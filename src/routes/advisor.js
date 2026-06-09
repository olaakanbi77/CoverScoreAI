const express = require('express');
const router = express.Router();
const { db, all, get } = require('../config/database');
const { requireAuth, requireSalesOrAdmin } = require('../middleware/auth');

// Advisor Dashboard
router.get('/dashboard', requireAuth, requireSalesOrAdmin, async (req, res) => {
  try {
    // Advisors see their assigned leads, OR leads that are qualified and unassigned
    let leadsQuery = `
      SELECT id, name, business_name, email, phone, status, risk_level, estimated_premium, created_at, assigned_agent 
      FROM leads 
      WHERE (assigned_agent = ? OR assigned_agent IS NULL) 
        AND is_qualified = 1
      ORDER BY created_at DESC
    `;
    const leads = await all(leadsQuery, [req.user.name]);

    // Active proposals created by this advisor
    const proposals = await all('SELECT * FROM proposals WHERE advisor_id = ? ORDER BY updated_at DESC', [req.user.id]);

    res.render('advisor/dashboard', { 
      layout: 'admin', 
      user: req.user,
      leads,
      proposals,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Advisor dashboard error:', err);
    res.status(500).send('Server Error');
  }
});

// Proposal Writer View
router.get('/proposal-writer/:leadId', requireAuth, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = await get('SELECT * FROM leads WHERE id = ?', [req.params.leadId]);
    if (!lead) return res.status(404).send('Lead not found');
    
    // Check if an existing proposal exists
    let proposal = await get('SELECT * FROM proposals WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1', [lead.id]);

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
