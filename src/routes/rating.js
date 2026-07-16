const express = require('express');
const router = express.Router();
const { get } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireSalesOrAdmin } = require('../middleware/rbac');
const ratingEngine = require('../rating/engine');

router.get('/api/rating/products/:leadId', authenticate, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let prefix = null;
    let assessmentData = {};
    if (lead.assessment_data) {
      try {
        const ad = JSON.parse(lead.assessment_data);
        assessmentData = ad;
        if (ad.answers && ad.answers.template_selection) {
          prefix = ad.answers.template_selection.template_id;
        }
      } catch (e) {}
    }
    if (!prefix && lead.assessment_id) {
      const a = await get('SELECT answers FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (a && a.answers) {
        try {
          const parsed = JSON.parse(a.answers);
          if (parsed.template_selection) prefix = parsed.template_selection.template_id;
        } catch (e) {}
      }
    }
    if (!prefix && lead.industry) {
      const flowMap = { school: 'SCH', hospital: 'HOS', manufacturing: 'MFG', church: 'CHR', sme: 'SME', business: 'BUS' };
      prefix = flowMap[lead.industry.toLowerCase()] || 'SME';
    }

    const products = await ratingEngine.getProducts('BUSINESS');
    const productsWithClasses = await Promise.all(products.map(async (p) => {
      const classInfo = await ratingEngine.suggestClasses(p.code, prefix);
      return {
        ...p,
        inputSchema: p.input_schema ? JSON.parse(p.input_schema) : {},
        classes: classInfo.classes,
        suggestedClass: classInfo.suggested
      };
    }));

    res.json({ lead: { id: lead.id, name: lead.name, business_name: lead.business_name, score: lead.score, industry: lead.industry, entity_type: lead.entity_type }, products: productsWithClasses, prefix });
  } catch (err) {
    console.error('Rating products error:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/api/rating/calculate', authenticate, requireSalesOrAdmin, async (req, res) => {
  try {
    const { productCode, className, inputs, leadId } = req.body;
    if (!productCode) return res.status(400).json({ error: 'productCode required' });

    let lead = null;
    let prefix = null;
    let assessmentData = {};
    if (leadId) {
      lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
      if (lead) {
        try { assessmentData = JSON.parse(lead.assessment_data || '{}'); } catch (e) {}
        if (assessmentData.answers && assessmentData.answers.template_selection) {
          prefix = assessmentData.answers.template_selection.template_id;
        }
      }
    }

    const result = await ratingEngine.calculate(productCode, className, inputs || {}, assessmentData, prefix);
    res.json(result);
  } catch (err) {
    console.error('Rating calculate error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/rating/generate-proposal', authenticate, requireSalesOrAdmin, async (req, res) => {
  try {
    const { run } = require('../config/database');
    const { leadId, products } = req.body;
    if (!leadId || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'leadId and products array required' });
    }

    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const activeProducts = products.filter(p => p.selected !== false && p.premium > 0);

    const productData = activeProducts.map(p => ({
      product: p.productName,
      code: p.productCode,
      className: p.className,
      premium: p.premium,
      breakdown: p.breakdown || [],
      inputs: p.inputs || {}
    }));

    const totalPremium = activeProducts.reduce((s, p) => s + p.premium, 0);

    const assessmentData = {
      name: lead.name,
      business_name: lead.business_name,
      email: lead.email,
      score: lead.score || 50,
      risk_level: lead.risk_level || 'Moderate',
      scored_pillars: {},
      answers: {}
    };

    if (lead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (assessment) {
        if (assessment.ai_report) {
          try {
            const aiData = JSON.parse(assessment.ai_report);
            if (aiData.pillar_scores) assessmentData.scored_pillars = aiData.pillar_scores;
          } catch (e) {}
        }
        if (assessment.answers) {
          try {
            const parsed = JSON.parse(assessment.answers);
            if (parsed.answers) assessmentData.answers = parsed.answers;
          } catch (e) {}
        }
      }
    }

    const { generateProposal } = require('../proposals/generator');
    const result = generateProposal(assessmentData, productData.map(p => ({
      product: p.product,
      reason: `${p.className} class`,
      estimatedPremium: { min: p.premium, max: p.premium }
    })), {
      name: req.user?.name || 'CoverScore Advisor',
      phone: process.env.WHATSAPP_BOT_NUMBER,
      email: process.env.ADMIN_EMAIL || 'advisor@coverscore.ai'
    });

    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');

    const proposalId = (await run(
      'INSERT INTO proposals (lead_id, advisor_id, title, content, amount, status, token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [leadId, req.user?.id,
       `CoverScore Proposal - ${lead.business_name || lead.name} - ${new Date().toLocaleDateString()}`,
       JSON.stringify({ ...result, ratingProducts: productData }), totalPremium, 'Generated', token]
    )).lastInsertRowid;

    const proposal = await get('SELECT * FROM proposals WHERE id = ?', [proposalId]);

    await run('UPDATE leads SET status = "Proposal Ready", pipeline_stage = 3, estimated_premium = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalPremium, leadId]);

    const { notify } = require('../services/notify');
    if (req.user?.id) {
      notify(req.user.id, 'quote_generated', 'Proposal Generated', `Proposal ready for ${lead.business_name || lead.name} — ₦${totalPremium.toLocaleString()} total`, `/advisor/proposal-writer/${leadId}`);
    }

    res.json({
      success: true,
      proposal,
      proposalUrl: `/advisor/proposal-writer/${leadId}`
    });
  } catch (err) {
    console.error('Generate proposal error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/rating/proposal/:id/pdf', authenticate, requireSalesOrAdmin, async (req, res) => {
  try {
    const proposal = await get('SELECT * FROM proposals WHERE id = ?', [req.params.id]);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const lead = await get('SELECT * FROM leads WHERE id = ?', [proposal.lead_id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let ratingProducts = [];
    if (proposal.content) {
      try {
        const content = JSON.parse(proposal.content);
        if (content.ratingProducts) ratingProducts = content.ratingProducts;
      } catch (e) {}
    }

    const { generateAndStreamPdf } = require('../services/pdf');
    await generateAndStreamPdf(proposal, lead, ratingProducts, res);
  } catch (err) {
    console.error('[PDF] Route error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
