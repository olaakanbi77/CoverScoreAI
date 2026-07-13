const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db, run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/aiService');
const { sendWhatsApp } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { generateProposal } = require('../proposals/index');

const requireSalesOrAdminApi = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

// Generate a proposal using AI
router.post('/generate', authenticate, requireSalesOrAdminApi, async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId is required' });

  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let assessment = null;
    if (lead.assessment_id) {
      assessment = await get('SELECT * FROM assessments WHERE id = ?', [lead.assessment_id]);
    }

    // Call AI service to draft the proposal
    const draftHtml = await aiService.generateProposal(lead, assessment);

    res.json({ success: true, draft: draftHtml });
  } catch (err) {
    console.error('Error generating proposal:', err);
    res.status(500).json({ error: 'Failed to generate proposal' });
  }
});

// Generate PDF proposal from assessment data
router.post('/generate-pdf', authenticate, requireSalesOrAdminApi, async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId is required' });

    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let assessment = null;
    if (lead.assessment_id) {
      assessment = await get('SELECT * FROM assessments WHERE id = ?', [lead.assessment_id]);
    }

    const assessmentData = {
      name: lead.name,
      business_name: lead.business_name,
      email: lead.email,
      score: lead.score || 50,
      risk_level: lead.risk_level || 'Moderate',
      scored_pillars: {},
      answers: {}
    };

    if (assessment?.answers) {
      const parsed = typeof assessment.answers === 'string' ? JSON.parse(assessment.answers) : assessment.answers;
      if (parsed.answers) assessmentData.answers = parsed.answers;
    }

    const knowledge = require('../knowledge/index');
    const products = knowledge.getByIndustry(lead.industry || 'sme');

    const result = generateProposal(assessmentData, products, {
      name: req.user?.name || 'CoverScore Advisor',
      phone: process.env.WHATSAPP_BOT_NUMBER,
      email: process.env.ADMIN_EMAIL || 'advisor@coverscore.ai'
    });

    const token = require('crypto').randomBytes(16).toString('hex');
    const proposalId = (await run(
      'INSERT INTO proposals (lead_id, advisor_id, title, content, amount, status, token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [leadId, req.user?.id, `CoverScore Proposal - ${new Date().toLocaleDateString()}`, JSON.stringify(result), 0, 'Generated', token]
    )).lastInsertRowid;

    const proposal = await get('SELECT * FROM proposals WHERE id = ?', [proposalId]);
    res.json({ success: true, proposal, pdfUrl: result.pdfUrl || result.htmlUrl, proposalNumber: result.proposalNumber });
  } catch (err) {
    console.error('Error generating PDF proposal:', err);
    res.status(500).json({ error: 'Failed to generate PDF proposal' });
  }
});

// Save or Update Proposal
router.post('/save', authenticate, requireSalesOrAdminApi, async (req, res) => {
  const { id, leadId, title, content, amount, status } = req.body;
  
  try {
    let token;
    let proposalId = id;
    
    if (id) {
      // Update existing
      await run(
        'UPDATE proposals SET title = ?, content = ?, amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, amount || 0, status || 'Draft', id]
      );
    } else {
      // Create new
      token = crypto.randomBytes(16).toString('hex');
      const result = await run(
        'INSERT INTO proposals (lead_id, advisor_id, title, content, amount, status, token) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [leadId, req.user.id, title, content, amount || 0, status || 'Draft', token]
      );
      proposalId = result.lastInsertRowid;
    }

    const proposal = await get('SELECT * FROM proposals WHERE id = ?', [proposalId]);
    res.json({ success: true, proposal });
  } catch (err) {
    console.error('Error saving proposal:', err);
    res.status(500).json({ error: 'Failed to save proposal' });
  }
});

// View Public Proposal
router.get('/view/:token', async (req, res) => {
  try {
    const proposal = await get('SELECT p.*, l.name as lead_name, l.business_name FROM proposals p JOIN leads l ON p.lead_id = l.id WHERE p.token = ?', [req.params.token]);
    if (!proposal) {
      return res.status(404).send('Proposal not found or link has expired.');
    }
    res.render('public/proposal-view', { layout: 'main', proposal });
  } catch (err) {
    console.error('Error fetching public proposal:', err);
    res.status(500).send('Server Error');
  }
});

// Accept/Decline Proposal
router.post('/:token/action', async (req, res) => {
  const { action } = req.body; // 'Accepted' or 'Declined'
  try {
    const proposal = await get('SELECT * FROM proposals WHERE token = ?', [req.params.token]);
    if (!proposal) return res.status(404).json({ error: 'Not found' });

    await run('UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [action, proposal.id]);
    
    // Auto-update lead status
    if (action === 'Accepted') {
      await run('UPDATE leads SET status = "Proposal Accepted", pipeline_stage = 4 WHERE id = ?', [proposal.lead_id]);
    } else if (action === 'Declined') {
      await run('UPDATE leads SET status = "Lost", pipeline_stage = 6 WHERE id = ?', [proposal.lead_id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// Send Proposal via Email or WhatsApp
router.post('/send', authenticate, requireSalesOrAdminApi, async (req, res) => {
  const { proposalId, method } = req.body;
  
  try {
    const proposal = await get('SELECT p.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM proposals p JOIN leads l ON p.lead_id = l.id WHERE p.id = ?', [proposalId]);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposalUrl = `${process.env.APP_URL || 'http://localhost:3016'}/api/proposals/view/${proposal.token}`;
    
    if (method === 'whatsapp') {
      if (!proposal.lead_phone) {
        return res.status(400).json({ error: 'Lead has no phone number' });
      }
      const message = `Hi ${proposal.lead_name},\n\nYour personalized insurance proposal is ready for review. You can view, accept or decline it using the secure link below:\n\n${proposalUrl}\n\nPlease let us know if you have any questions.\n\n— CoverScore AI`;
      const result = await sendWhatsApp(proposal.lead_phone, null, { _message: message });
      
      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send WhatsApp message: ' + result.error });
      }
      
      // Save sent message to chat_history
      let chatData = {};
      try {
        const leadRow = await get('SELECT chat_history FROM leads WHERE id = ?', [proposal.lead_id]);
        if (leadRow && leadRow.chat_history) chatData = JSON.parse(leadRow.chat_history);
      } catch(e) {}
      
      chatData.__messages = chatData.__messages || [];
      chatData.__messages.push({
        role: 'assistant',
        content: message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      });

      await run('UPDATE leads SET chat_history = ?, status = "Proposal Sent", pipeline_stage = 3 WHERE id = ?', [JSON.stringify(chatData), proposal.lead_id]);
      await run('UPDATE proposals SET status = "Sent" WHERE id = ?', [proposal.id]);

      return res.json({ success: true, message: 'Proposal sent via WhatsApp' });
      
    } else if (method === 'email') {
      if (!proposal.lead_email) {
        return res.status(400).json({ error: 'Lead has no email address' });
      }
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Your Insurance Proposal is Ready</h2>
          <p>Hi ${proposal.lead_name},</p>
          <p>Your personalized insurance proposal is ready for review.</p>
          <p>You can view, accept or decline it using the secure link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${proposalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Proposal</a>
          </div>
          <p>Or copy this link to your browser: <br><a href="${proposalUrl}">${proposalUrl}</a></p>
          <p>Please let us know if you have any questions.</p>
          <p>Best regards,<br>CoverScore AI Advisor</p>
        </div>
      `;
      
      const result = await emailService.sendEmail({
        to: proposal.lead_email,
        subject: `Your Insurance Proposal - CoverScore AI`,
        html: html
      });
      
      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send Email: ' + result.error });
      }
      
      await run('UPDATE leads SET status = "Proposal Sent", pipeline_stage = 3 WHERE id = ?', [proposal.lead_id]);
      await run('UPDATE proposals SET status = "Sent" WHERE id = ?', [proposal.id]);

      return res.json({ success: true, message: 'Proposal sent via Email' });
    } else {
      return res.status(400).json({ error: 'Invalid method' });
    }

  } catch (err) {
    console.error('Error sending proposal:', err);
    res.status(500).json({ error: 'Failed to send proposal' });
  }
});

module.exports = router;
