const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db, run, get, all } = require('../config/database');
const { requireAuth, requireSalesOrAdmin } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Generate a proposal using AI
router.post('/generate', requireAuth, requireSalesOrAdmin, async (req, res) => {
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

// Save or Update Proposal
router.post('/save', requireAuth, requireSalesOrAdmin, async (req, res) => {
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
      await run('UPDATE leads SET status = "Won", pipeline_stage = 5 WHERE id = ?', [proposal.lead_id]);
    } else if (action === 'Declined') {
      await run('UPDATE leads SET status = "Lost", pipeline_stage = 6 WHERE id = ?', [proposal.lead_id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

module.exports = router;
