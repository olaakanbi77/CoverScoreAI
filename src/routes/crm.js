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

module.exports = router;
