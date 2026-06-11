const express = require('express');
const router = express.Router();
const { all, get } = require('../config/database');
const { authenticatePage } = require('../middleware/auth');
const { calculateScore } = require('../services/scoringEngine');

const requireSalesOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).send('Forbidden: Sales or Admin role required');
};

router.get('/dashboard', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const rawLeads = await all('SELECT * FROM leads ORDER BY updated_at DESC, created_at DESC');
    
    const leads = rawLeads.map(l => {
      let conversations = [];
      try {
        const parsed = JSON.parse(l.chat_history || '{}');
        conversations = Array.isArray(parsed.__messages) ? parsed.__messages : [];
      } catch(e) {}
      
      let badgeClass = 'follow-up';
      if (l.status === 'New Lead' || l.status === 'hot') badgeClass = 'hot';
      else if (l.status === 'WhatsApp Engaged' || l.status === 'warm') badgeClass = 'warm';

      return {
        ...l,
        badgeClass,
        conversations,
        contact: l.name,
        last_activity: l.updated_at || l.created_at,
        likelihood_to_buy: l.sales_score > 70 ? 'HIGH' : (l.sales_score > 40 ? 'MEDIUM' : 'LOW'),
        premium_range: l.estimated_premium ? `₦${l.estimated_premium.toLocaleString()} - ₦${(l.estimated_premium * 1.5).toLocaleString()}` : 'N/A',
        recommended_product: l.recommended_covers || 'Review Assessment'
      };
    });

    const leadId = parseInt(req.query.lead) || (leads.length > 0 ? leads[0].id : null);
    const selectedLead = leads.find(l => l.id === leadId) || leads[0] || null;

    let aiRecommendations = [];
    let talkingPoints = [];
    let risks = [];
    let protection_gaps = [];
    let financial_exposure_min = 0;
    let financial_exposure_max = 0;
    let user_primary_concern = null;

    if (selectedLead && selectedLead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [selectedLead.assessment_id]);
      if (assessment && assessment.answers) {
        try {
          const answers = JSON.parse(assessment.answers);
          user_primary_concern = answers.primary_concern;
          const report = calculateScore(answers);
          
          if (report.risk_categories) {
            risks = Object.entries(report.risk_categories).map(([name, score]) => ({ name: name.replace('_', ' '), score }));
          }
          
          if (report.recommendations) {
            protection_gaps = report.recommendations.map(r => 'No ' + r);
          } else if (report.identified_gaps) {
            protection_gaps = report.identified_gaps;
          }
          
          if (report.recommendations) {
            aiRecommendations = report.recommendations.map(r => ({
              product: r,
              priority: 'High'
            }));
          }

          financial_exposure_min = report.min_loss || 0;
          financial_exposure_max = report.max_loss || 0;

        } catch (e) {
          console.error('Error parsing AI report:', e);
        }
      }
    }

    if (selectedLead) {
      selectedLead.risks = risks.length > 0 ? risks.map(r => {
        let formatted = r.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!formatted.toLowerCase().includes('risk')) formatted += ' Risk';
        return { ...r, name: formatted };
      }) : [{name: 'General Risk', score: selectedLead.score || 50}];
      selectedLead.protection_gaps = protection_gaps.length > 0 ? protection_gaps : ['Pending full analysis'];
      selectedLead.financial_exposure_min = financial_exposure_min;
      selectedLead.financial_exposure_max = financial_exposure_max;
      
      if (financial_exposure_min > 0) {
        const premium_min = Math.round(financial_exposure_min * 0.01).toLocaleString();
        const premium_max = Math.round(financial_exposure_max * 0.015).toLocaleString();
        selectedLead.premium_range = `₦${premium_min} - ₦${premium_max}`;
      } else if (selectedLead.premium_range === 'N/A' || !selectedLead.premium_range) {
        selectedLead.premium_range = 'Pending';
      }
      
      // Dynamic calculations for Lead Intelligence
      selectedLead.primary_concern = user_primary_concern || 'Not specified';
      
      let next_action = 'Contact Lead';
      if (selectedLead.status === 'New Lead' || selectedLead.status === 'hot') next_action = 'Initial Outreach';
      else if (selectedLead.status === 'WhatsApp Engaged' || selectedLead.status === 'warm') next_action = 'Follow up on WhatsApp';
      else if (selectedLead.status === 'Proposal Sent') next_action = 'Review Proposal';
      selectedLead.next_best_action = next_action;

      if (aiRecommendations.length > 0) {
        selectedLead.recommended_product = aiRecommendations[0].product;
      }
    }

    // Default recommendations if none found
    if (aiRecommendations.length === 0) {
      aiRecommendations = [
        { product: selectedLead?.recommended_product || 'General Business Protection', priority: 'High' }
      ];
    }
    if (talkingPoints.length === 0) {
      talkingPoints = [
        'Discuss identified protection gaps.',
        'Highlight the importance of immediate coverage.',
        'Review the recommended products and their benefits.'
      ];
    }

    const proposals = await all('SELECT * FROM proposals ORDER BY created_at DESC');

    res.render('advisor/dashboard', {
      layout: false,
      user: req.user,
      leads,
      proposals,
      aiRecommendations,
      talkingPoints,
      selectedLead,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Advisor dashboard error:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/proposal-writer/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    const proposal = await get('SELECT * FROM proposals WHERE lead_id = ?', [lead.id]) || null;
    
    res.render('advisor/proposal-writer', {
      layout: 'admin',
      user: req.user,
      lead,
      proposal,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Error loading proposal writer:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
