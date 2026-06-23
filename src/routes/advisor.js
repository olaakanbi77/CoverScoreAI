const express = require('express');
const router = express.Router();
const { all, get } = require('../config/database');
const { authenticatePage } = require('../middleware/auth');
const HTMLtoDOCX = require('html-to-docx');
const { calculateScore } = require('../services/scoringEngine');
const { handleAdvisorCopilotChat } = require('../services/aiService');

const requireSalesOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).send('Forbidden: Sales or Admin role required');
};

router.get('/dashboard', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    let rawLeads = [];
    if (req.user.role === 'admin') {
      rawLeads = await all(`
        SELECT leads.*, users.name as advisor_name 
        FROM leads 
        LEFT JOIN users ON leads.advisor_id = users.id 
        ORDER BY leads.updated_at DESC, leads.created_at DESC
      `);
    } else {
      rawLeads = await all(`
        SELECT leads.*, users.name as advisor_name 
        FROM leads 
        LEFT JOIN users ON leads.advisor_id = users.id 
        WHERE leads.advisor_id = ? OR leads.advisor_id IS NULL
        ORDER BY leads.updated_at DESC, leads.created_at DESC
      `, [req.user.id]);
    }
    
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
        sales_score: (l.sales_score || 0) > 100 ? 100 : (l.sales_score || 0),
        likelihood_to_buy: l.sales_score >= 70 ? 'HIGH' : (l.sales_score >= 40 ? 'MEDIUM' : 'LOW'),
        premium_range: l.estimated_premium ? `₦${l.estimated_premium.toLocaleString()}` : 'N/A',
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
    let copilot_data = null;

    if (selectedLead && selectedLead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [selectedLead.assessment_id]);
      if (assessment && assessment.answers) {
        try {
          const answers = JSON.parse(assessment.answers);
          user_primary_concern = answers.primary_concern;
          
          if (answers.business) {
            selectedLead.industry = answers.business.industry || 'Unknown';
            selectedLead.employees = answers.business.employees ? answers.business.employees.replace('_', '-') : 'Unknown';
            selectedLead.turnover = answers.business.turnover ? answers.business.turnover.replace('_', '-') : 'Unknown';
          } else {
            selectedLead.industry = 'Individual';
            selectedLead.employees = 'N/A';
            selectedLead.turnover = 'N/A';
          }
          
          if (answers.type && answers.type.location) {
             selectedLead.location = answers.type.location;
          } else {
             selectedLead.location = 'Nigeria'; // Default placeholder
          }
          
          const report = calculateScore(answers);
          
          if (assessment.ai_report) {
            const aiData = JSON.parse(assessment.ai_report);
            copilot_data = aiData.copilot || null;
            if (aiData.cre_data && aiData.cre_data.recommendations) {
              aiRecommendations = aiData.cre_data.recommendations.map(r => ({
                product: r.action,
                priority: r.severity
              }));
            }
          }
          
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
      selectedLead.industry = selectedLead.industry || 'Unknown';
      selectedLead.employees = selectedLead.employees || 'N/A';
      selectedLead.turnover = selectedLead.turnover || 'N/A';
      selectedLead.location = selectedLead.location || 'Nigeria';
      selectedLead.risks = risks.length > 0 ? risks.map(r => {
        let formatted = r.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!formatted.toLowerCase().includes('risk')) formatted += ' Risk';
        return { ...r, name: formatted };
      }) : [{name: 'General Risk', score: selectedLead.score || 50}];
      selectedLead.protection_gaps = protection_gaps.length > 0 ? protection_gaps : ['Pending full analysis'];
      selectedLead.primary_concern = Array.isArray(user_primary_concern) ? user_primary_concern.join(', ') : (user_primary_concern || selectedLead.primary_concern || 'Not Specified');
      selectedLead.financial_exposure_min = financial_exposure_min;
      selectedLead.financial_exposure_max = financial_exposure_max;
      
      const resilience = 100 - (selectedLead.score || 0);
      selectedLead.resilience_score = resilience > 0 ? resilience : 0;
      
      if (selectedLead.estimated_premium > 0) {
        selectedLead.premium_range = `₦${selectedLead.estimated_premium.toLocaleString()}`;
      } else {
        selectedLead.premium_range = 'Pending';
      }
      
      // Dynamic calculations for Lead Intelligence
        
      let next_action = copilot_data?.next_actions?.[0] || 'Contact Lead';
      if (!copilot_data) {
        if (selectedLead.status === 'New Lead' || selectedLead.status === 'hot') next_action = 'Initial Outreach';
        else if (selectedLead.status === 'WhatsApp Engaged' || selectedLead.status === 'warm') next_action = 'Follow up on WhatsApp';
        else if (selectedLead.status === 'Proposal Sent') next_action = 'Review Proposal';
      }
      selectedLead.next_best_action = next_action;
      
      if (copilot_data) {
        talkingPoints = copilot_data.recommended_questions || [];
        selectedLead.objections = copilot_data.likely_objections || [];
      }

      if (aiRecommendations.length > 0) {
        selectedLead.recommended_product = aiRecommendations[0].product;
      }
    }

    const proposals = await all('SELECT * FROM proposals ORDER BY created_at DESC');

    const hotLeadsCount = leads.filter(l => l.badgeClass === 'hot').length;
    const proposalsCount = proposals.length;
    const totalPremium = leads.reduce((sum, l) => sum + (l.estimated_premium || 0), 0);
    const premiumFormatted = totalPremium > 1000000 
      ? `₦${(totalPremium/1000000).toFixed(1)}M` 
      : `₦${totalPremium.toLocaleString()}`;

    const activePipelineLeads = leads.filter(l => [1, 2, 3, 4].includes(l.pipeline_stage));
    const activePipelineValue = activePipelineLeads.reduce((sum, l) => sum + (l.estimated_premium || 0), 0);
    const activePipelineValueFormatted = activePipelineValue > 1000000 
      ? `₦${(activePipelineValue/1000000).toFixed(1)}M` 
      : `₦${activePipelineValue.toLocaleString()}`;

    const wonLeads = leads.filter(l => l.pipeline_stage === 6);
    const wonDealsCount = wonLeads.length;
    
    // Proposals Pending (Proposal Sent stage)
    const proposalsPendingCount = leads.filter(l => l.pipeline_stage === 4).length;
    
    // Mobile Dashboard Stats
    const newLeadsCount = leads.filter(l => l.status === 'New Lead').length;
    const assessmentsPendingCount = leads.filter(l => !l.assessment_id).length;

    // Conversion rate
    const conversionRate = leads.length > 0 ? Math.round((wonDealsCount / leads.length) * 100) : 0;

    const summary = {
      hotLeads: hotLeadsCount,
      consultations: 0,
      proposalsSent: proposalsPendingCount,
      policiesSold: wonDealsCount,
      estPremium: premiumFormatted,
      activePipelineValue: activePipelineValueFormatted,
      conversionRate: `${conversionRate}%`,
      newLeads: newLeadsCount,
      assessmentsPending: assessmentsPendingCount
    };

    res.render('advisor/dashboard', {
      layout: false,
      user: req.user,
      leads: leads.slice(0, 3),
      proposals,
      summary,
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

router.get('/follow-up', authenticatePage, requireSalesOrAdmin, (req, res) => {
  res.redirect('/advisor/follow-up/1');
});

router.get('/follow-up/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    res.render('advisor/follow-up', {
      layout: 'admin',
      user: req.user,
      lead,
      activePage: 'more'
    });
  } catch (err) {
    console.error('Error loading follow up screen:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/risk-report', authenticatePage, requireSalesOrAdmin, (req, res) => {
  res.redirect('/advisor/risk-report/1');
});

router.get('/risk-report/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');

    res.render('advisor/risk-report', {
      layout: 'admin',
      user: req.user,
      lead,
      activePage: 'assessments'
    });
  } catch (err) {
    console.error('Error loading risk report screen:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/notifications', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/notifications', {
      layout: 'admin',
      user: req.user,
      activePage: 'notifications'
    });
  } catch (err) {
    console.error('Error loading notifications:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/tasks', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/tasks', {
      layout: 'admin',
      user: req.user,
      activePage: 'more'
    });
  } catch (err) {
    console.error('Error loading tasks:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/profile', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/profile', {
      layout: 'admin',
      user: req.user,
      activePage: 'more'
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/calendar', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/calendar', {
      layout: 'admin',
      user: req.user,
      activePage: 'calendar'
    });
  } catch (err) {
    console.error('Error loading calendar:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/pipeline', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/pipeline', {
      layout: 'admin',
      user: req.user,
      activePage: 'pipeline'
    });
  } catch (err) {
    console.error('Error loading pipeline:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/leaderboard', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/leaderboard', {
      layout: 'admin',
      user: req.user,
      activePage: 'leaderboard'
    });
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/copilot', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    res.render('advisor/copilot', {
      layout: 'admin',
      user: req.user,
      activePage: 'copilot'
    });
  } catch (err) {
    console.error('Error loading copilot:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/api/copilot-chat', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { leadId, message } = req.body;
    if (!leadId || !message) {
      return res.status(400).json({ error: 'Missing leadId or message' });
    }

    const lead = await get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let assessmentAnswers = null;
    let aiReport = null;
    if (lead.assessment_id) {
      const assessment = await get('SELECT answers, ai_report FROM assessments WHERE id = ?', [lead.assessment_id]);
      if (assessment) {
        assessmentAnswers = assessment.answers ? JSON.parse(assessment.answers) : null;
        aiReport = assessment.ai_report ? JSON.parse(assessment.ai_report) : null;
      }
    }

    let chatHistory = [];
    try {
      const parsed = JSON.parse(lead.chat_history || '{}');
      chatHistory = Array.isArray(parsed.__messages) ? parsed.__messages : [];
    } catch(e) {}

    const leadContext = {
      lead_profile: {
        name: lead.name,
        business_name: lead.business_name,
        industry: lead.industry,
        employees: lead.employees,
        risk_level: lead.risk_level,
        score: lead.score,
        status: lead.status,
        sales_score: lead.sales_score,
        estimated_premium: lead.estimated_premium
      },
      assessment: assessmentAnswers,
      ai_report_summary: aiReport,
      whatsapp_history: chatHistory.slice(-20) // Only send last 20 messages to save tokens
    };

    const response = await handleAdvisorCopilotChat(leadContext, message);
    res.json({ response });

  } catch (err) {
    console.error('Copilot Chat API Error:', err);
    res.status(500).json({ error: 'Failed to process copilot request' });
  }
});

router.post('/api/export-docx', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const { htmlContent, filename } = req.body;
    if (!htmlContent) return res.status(400).json({ error: 'No htmlContent provided' });

    const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'proposal'}.docx"`);
    res.send(docxBuffer);
  } catch (err) {
    console.error('DOCX Export Error:', err);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

router.post('/api/leads/:id/assign', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leadId = req.params.id;
    const advisorId = req.user.id;
    const { run } = require('../config/database');
    await run('UPDATE leads SET advisor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [advisorId, leadId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Assign Error:', err);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
});

router.post('/api/leads/:id/stage', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leadId = req.params.id;
    const { stage } = req.body;
    const validStages = ['New', 'Contacted', 'Meeting Set', 'Proposal Sent', 'Won', 'Lost'];
    
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const { run } = require('../config/database');
    await run('UPDATE leads SET pipeline_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [stage, leadId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Pipeline Update Error:', err);
    res.status(500).json({ error: 'Failed to update pipeline stage' });
  }
});

module.exports = router;
