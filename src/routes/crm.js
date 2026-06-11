const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAgent } = require('../middleware/rbac');

const router = express.Router();

// GET /api/crm/tasks
router.get('/tasks', authenticate, requireAgent, async (req, res, next) => {
  try {
    const tasks = await all(`
      SELECT t.*, l.name as lead_name, l.business_name 
      FROM tasks t
      JOIN leads l ON t.lead_id = l.id
      ORDER BY t.due_date ASC
      LIMIT 50
    `);
    res.json(tasks);
  } catch (err) { next(err); }
});

// POST /api/crm/tasks
router.post('/tasks', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { lead_id, title, type, due_date } = req.body;
    if (!lead_id || !title) return res.status(400).json({ error: 'Missing lead_id or title' });
    
    await run(`
      INSERT INTO tasks (lead_id, title, type, due_date)
      VALUES (?, ?, ?, ?)
    `, [lead_id, title, type || 'call', due_date]);
    
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/crm/activities
router.get('/activities', authenticate, requireAgent, async (req, res, next) => {
  try {
    const limit = req.query.limit || 20;
    const activities = await all(`
      SELECT a.*, l.name as lead_name, l.business_name 
      FROM activities a
      JOIN leads l ON a.lead_id = l.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [limit]);
    res.json(activities);
  } catch (err) { next(err); }
});

// POST /api/crm/policies
router.post('/policies', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { lead_id, policy_number, product, premium, expiry_date } = req.body;
    if (!lead_id || !policy_number || !product || !premium || !expiry_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await run(`
      INSERT INTO policies (lead_id, policy_number, product, premium, expiry_date, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
    `, [lead_id, policy_number, product, premium, expiry_date]);
    
    // Auto-update lead's pipeline stage if needed
    await run(`UPDATE leads SET pipeline_stage = 6 WHERE id = ?`, [lead_id]);
    
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/crm/templates
router.post('/templates', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { title, type, content } = req.body;
    if (!title || !type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await run(`
      INSERT INTO templates (title, type, content)
      VALUES (?, ?, ?)
    `, [title, type, content]);
    
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
