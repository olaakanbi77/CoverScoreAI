const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { renewalEngine } = require('../renewals/index');

const requireAdminOrSales = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

router.get('/pipeline', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const pipeline = await renewalEngine.getRenewalPipeline(req.user.role === 'admin' ? null : req.user.id, { all, get });
    res.json(pipeline);
  } catch (err) {
    console.error('Renewal pipeline error:', err);
    res.status(500).json({ error: 'Failed to fetch renewal pipeline' });
  }
});

router.get('/check', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const actions = await renewalEngine.checkExpiringPolicies({ all, get, run });
    res.json({ actions, count: actions.length });
  } catch (err) {
    console.error('Renewal check error:', err);
    res.status(500).json({ error: 'Failed to check renewals' });
  }
});

router.post('/:id/reassess', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const renewal = await get('SELECT policy_id FROM renewals WHERE id = ?', [req.params.id]);
    if (!renewal) return res.status(404).json({ error: 'Renewal not found' });
    const result = await renewalEngine.triggerReassessment(renewal.policy_id, { all, get, run });
    res.json(result);
  } catch (err) {
    console.error('Reassessment trigger error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/generate-proposal', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const result = await renewalEngine.generateRenewalProposal(parseInt(req.params.id), { all, get, run });
    res.json(result);
  } catch (err) {
    console.error('Renewal proposal error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/decision', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['approved', 'declined'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved or declined' });
    }
    const result = await renewalEngine.processDecision(parseInt(req.params.id), decision, { all, get, run });
    res.json(result);
  } catch (err) {
    console.error('Renewal decision error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const rows = await all(`
      SELECT r.*, p.policy_number, p.product, p.premium, p.expiry_date,
             l.name AS client_name, l.business_name, l.phone, l.email, l.assigned_agent
      FROM renewals r
      JOIN policies p ON p.id = r.policy_id
      JOIN leads l ON l.id = r.lead_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Renewal list error:', err);
    res.status(500).json({ error: 'Failed to fetch renewals' });
  }
});

router.get('/:id', authenticate, requireAdminOrSales, async (req, res) => {
  try {
    const renewal = await get(`
      SELECT r.*, p.policy_number, p.product, p.premium, p.expiry_date,
             l.name AS client_name, l.business_name, l.phone, l.email
      FROM renewals r
      JOIN policies p ON p.id = r.policy_id
      JOIN leads l ON l.id = r.lead_id
      WHERE r.id = ?
    `, [req.params.id]);
    if (!renewal) return res.status(404).json({ error: 'Renewal not found' });
    res.json(renewal);
  } catch (err) {
    console.error('Renewal detail error:', err);
    res.status(500).json({ error: 'Failed to fetch renewal' });
  }
});

module.exports = router;
