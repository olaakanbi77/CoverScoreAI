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
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['admin', 'sales', 'analyst', 'user']),
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

module.exports = router;
