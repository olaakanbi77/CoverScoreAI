const express = require('express');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const bcrypt = require('bcrypt');

const router = express.Router();

router.get('/dashboard', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const totalAssessments = await get('SELECT COUNT(*) as count FROM assessments');

    const highRiskLeads = await get('SELECT COUNT(*) as count FROM leads WHERE risk_level IN ("high", "critical")');

    const totalLeads = await get('SELECT COUNT(*) as count FROM leads');
    const convertedLeads = await get('SELECT COUNT(*) as count FROM leads WHERE status = "converted"');
    const conversionRate = totalLeads.count > 0 ? Math.round((convertedLeads.count / totalLeads.count) * 100) : 0;

    const recentSubmissions = await all(`
      SELECT l.id, l.name, l.email, l.score, l.risk_level, l.status, l.created_at,
             JSON_EXTRACT(a.answers, '$.business.industry') as industry
      FROM leads l
      LEFT JOIN assessments a ON l.assessment_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    const riskDistribution = await all(`
      SELECT risk_level, COUNT(*) as count
      FROM leads
      GROUP BY risk_level
    `);

    const distribution = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };
    riskDistribution.forEach(d => {
      distribution[d.risk_level] = d.count;
    });

    res.json({
      metrics: {
        totalAssessments: totalAssessments.count,
        highRiskLeads: highRiskLeads.count,
        conversionRate,
        totalLeads: totalLeads.count
      },
      recentSubmissions: recentSubmissions.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        score: s.score,
        riskLevel: s.risk_level,
        status: s.status,
        industry: s.industry,
        createdAt: s.created_at
      })),
      riskDistribution: distribution
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const users = await all('SELECT id, email, name, phone, business_name, industry, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    const totalResult = await get('SELECT COUNT(*) as count FROM users');

    res.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        businessName: u.business_name,
        industry: u.industry,
        role: u.role,
        createdAt: u.created_at
      })),
      pagination: {
        page,
        limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/role',
  authenticate,
  requireAdmin,
  body('role').isIn(['admin', 'sales', 'analyst', 'user']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid role' });
      }

      const { role } = req.body;

      const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
      if (!user) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found' });
      }

      await run('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?', [role, req.params.id]);

      res.json({ message: 'Role updated', role });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/users/create',
  authenticate,
  requireAdmin,
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'sales', 'analyst', 'user']).withMessage('Invalid role'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: errors.array()[0].msg });
      }

      const { email, password, name, role } = req.body;

      const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(400).json({ error: 'Bad Request', message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await run(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES (?, ?, ?, ?)
      `, [email, passwordHash, name, role]);

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/users/:id',
  authenticate,
  requireAdmin,
  body('email').isEmail().normalizeEmail(),
  body('name').trim().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: errors.array()[0].msg });
      }

      const { email, name } = req.body;

      const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
      if (!user) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found' });
      }

      const existingUser = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.params.id]);
      if (existingUser) {
        return res.status(400).json({ error: 'Bad Request', message: 'Email already registered to another user' });
      }

      await run('UPDATE users SET email = ?, name = ?, updated_at = datetime("now") WHERE id = ?', [email, name, req.params.id]);

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/users/:id/reset-password',
  authenticate,
  requireAdmin,
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', message: errors.array()[0].msg });
      }

      const { password } = req.body;

      const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
      if (!user) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found' });
      }

      const password_hash = await bcrypt.hash(password, 12);
      await run('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?', [password_hash, req.params.id]);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/users/:id',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
      if (!user) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found' });
      }
      
      // Prevent deleting self
      if (req.user.id === parseInt(req.params.id)) {
        return res.status(400).json({ error: 'Bad Request', message: 'You cannot delete your own account' });
      }

      await run('DELETE FROM users WHERE id = ?', [req.params.id]);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { meet_link } = req.body;
    
    // Only update meet_link for now, could expand to other settings later
    if (meet_link !== undefined) {
      await run('UPDATE users SET meet_link = ?, updated_at = datetime("now") WHERE id = ?', [meet_link.trim(), req.user.id]);
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

const { graph: knowledgeGraph, ruleEngine } = require('../services/knowledgeGraphService');

router.get('/knowledge/stats', authenticate, requireAdmin, (req, res, next) => {
  try {
    res.json(knowledgeGraph.getStatistics());
  } catch (error) { next(error); }
});

router.get('/knowledge/questions/:questionId', authenticate, requireAdmin, (req, res, next) => {
  try {
    const result = knowledgeGraph.getQuestionGraph(req.params.questionId);
    if (!result) return res.status(404).json({ error: 'Question not found' });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/knowledge/risks/:riskId', authenticate, requireAdmin, (req, res, next) => {
  try {
    const result = knowledgeGraph.getRiskGraph(req.params.riskId);
    if (!result) return res.status(404).json({ error: 'Risk not found' });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/knowledge/assessments/:prefix', authenticate, requireAdmin, (req, res, next) => {
  try {
    const result = knowledgeGraph.getAssessmentGraph(req.params.prefix.toUpperCase());
    if (!result) return res.status(404).json({ error: 'Assessment type not found' });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/knowledge/domains/:domain', authenticate, requireAdmin, (req, res, next) => {
  try {
    const result = knowledgeGraph.getDomainGraph(req.params.domain);
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/knowledge/risks', authenticate, requireAdmin, (req, res, next) => {
  try {
    const allRisks = require('../knowledge/riskObjects');
    allRisks.initialize();
    res.json(allRisks.getAllRiskObjects());
  } catch (error) { next(error); }
});

router.get('/knowledge/recommendations', authenticate, requireAdmin, (req, res, next) => {
  try {
    const allRecs = require('../knowledge/recommendations');
    allRecs.initialize();
    res.json(allRecs.getAllRecommendations());
  } catch (error) { next(error); }
});

router.get('/knowledge/rules/evaluate', authenticate, requireAdmin, (req, res, next) => {
  try {
    const { prefix, ...answers } = req.query;
    if (!prefix) return res.status(400).json({ error: 'prefix query parameter required' });
    const result = ruleEngine.evaluate(prefix.toUpperCase(), answers);
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/knowledge/path/:fromType/:fromId/:toType', authenticate, requireAdmin, (req, res, next) => {
  try {
    const { fromType, fromId, toType } = req.params;
    const path = knowledgeGraph.findPath(fromType, fromId, toType);
    if (!path) return res.status(404).json({ error: 'No path found' });
    res.json({ path });
  } catch (error) { next(error); }
});

// Audit Logs
router.get('/audit-logs', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { event_type, entity_type, actor_type } = req.query;

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (event_type) { sql += ' AND event_type = ?'; params.push(event_type); }
    if (entity_type) { sql += ' AND entity_type = ?'; params.push(entity_type); }
    if (actor_type) { sql += ' AND actor_type = ?'; params.push(actor_type); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await all(sql, params);
    const countResult = await get('SELECT COUNT(*) as count FROM audit_logs');
    const eventTypes = await all('SELECT DISTINCT event_type FROM audit_logs ORDER BY event_type');
    const entityTypes = await all('SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type');

    res.json({
      logs: logs.map(l => ({
        ...l,
        metadata: l.metadata ? (typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata) : null
      })),
      eventTypes: eventTypes.map(e => e.event_type),
      entityTypes: entityTypes.map(e => e.entity_type),
      pagination: { page, limit, total: countResult.count, totalPages: Math.ceil(countResult.count / limit) }
    });
  } catch (error) { next(error); }
});

router.get('/audit-logs/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const total = await get('SELECT COUNT(*) as count FROM audit_logs');
    const byEvent = await all('SELECT event_type, COUNT(*) as count FROM audit_logs GROUP BY event_type ORDER BY count DESC');
    const byDate = await all("SELECT DATE(created_at) as date, COUNT(*) as count FROM audit_logs GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30");
    res.json({ total: total.count, byEvent, byDate });
  } catch (error) { next(error); }
});

module.exports = router;
