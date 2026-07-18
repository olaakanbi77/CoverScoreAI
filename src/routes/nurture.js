const express = require('express');
const router = express.Router();
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { enrollLead, getNurtureStatus } = require('../services/nurtureEngine');

const requireAdminOrSales = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

router.post('/enroll/:leadId', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const { trigger_event } = req.body;
    const campaign = await enrollLead(req.params.leadId, trigger_event || 'not_now');
    if (!campaign) return res.status(400).json({ error: 'No active campaign found for trigger' });
    res.json({ message: `Enrolled in campaign: ${campaign.name}`, campaign });
  } catch (err) { next(err); }
});

router.get('/status/:leadId', authenticate, async (req, res, next) => {
  try {
    const status = await getNurtureStatus(req.params.leadId);
    res.json(status || { nurture_status: 'idle' });
  } catch (err) { next(err); }
});

router.get('/campaigns', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const campaigns = await all('SELECT * FROM nurture_campaigns ORDER BY name');
    for (const c of campaigns) {
      c.messages = await all('SELECT * FROM nurture_messages WHERE campaign_id = ? ORDER BY step_order', [c.id]);
    }
    res.json(campaigns);
  } catch (err) { next(err); }
});

router.get('/queue', authenticate, requireAdminOrSales, async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    let sql = `SELECT nq.*, l.name as lead_name, l.email FROM nurture_queue nq JOIN leads l ON nq.lead_id = l.id`;
    const params = [];
    if (status) { sql += ' WHERE nq.status = ?'; params.push(status); }
    sql += ' ORDER BY nq.scheduled_at DESC';
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }
    const queue = await all(sql, params);
    res.json(queue);
  } catch (err) { next(err); }
});

module.exports = router;