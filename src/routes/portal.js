const express = require('express');
const { get, all } = require('../config/database');
const { authenticatePage, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('portal/passport-login', { title: 'Customer Portal', layout: 'auth', redirect: req.query.redirect || '/portal/dashboard' });
});

router.get('/dashboard', authenticatePage, async (req, res, next) => {
  try {
    const customer = await get('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);

    if (!customer) {
      return res.render('portal/dashboard', {
        title: 'My Dashboard',
        user: req.user,
        passport: null,
        assessments: [],
        policies: [],
        quotes: [],
        scoreTrend: []
      });
    }

    const assessments = await all(`
      SELECT a.id, a.score, a.risk_level, a.created_at,
             l.business_name, l.entity_type, l.industry
      FROM assessments a
      LEFT JOIN leads l ON a.id = l.assessment_id
      WHERE l.passport_id = ? OR l.email = ?
      ORDER BY a.created_at DESC
      LIMIT 20
    `, [customer.passport_id, customer.email]);

    const policies = await all(`
      SELECT p.*, l.business_name
      FROM policies p
      JOIN leads l ON p.lead_id = l.id
      WHERE l.passport_id = ? OR l.email = ?
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [customer.passport_id, customer.email]);

    const quotes = await all(`
      SELECT rq.*, rp.name as product_name
      FROM rating_quotes rq
      JOIN rating_products rp ON rq.product_code = rp.code
      JOIN leads l ON rq.lead_id = l.id
      WHERE l.passport_id = ? OR l.email = ?
      ORDER BY rq.created_at DESC
      LIMIT 10
    `, [customer.passport_id, customer.email]);

    const scoreTrend = assessments.slice().reverse().map(a => ({
      date: a.created_at,
      score: a.score,
      risk_level: a.risk_level
    }));

    res.render('portal/dashboard', {
      title: 'My Dashboard',
      user: req.user,
      passport: customer,
      assessments,
      policies,
      quotes,
      scoreTrend
    });
  } catch (error) {
    next(error);
  }
});

router.get('/passport', authenticatePage, async (req, res, next) => {
  try {
    const customer = await get('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
    if (!customer) {
      return res.redirect('/portal/dashboard');
    }

    const assessments = await all(`
      SELECT a.id, a.score, a.risk_level, a.created_at,
             l.business_name, l.entity_type, l.industry
      FROM assessments a
      LEFT JOIN leads l ON a.id = l.assessment_id
      WHERE l.passport_id = ? OR l.email = ?
      ORDER BY a.created_at DESC
    `, [customer.passport_id, customer.email]);

    const leads = await all(`
      SELECT id, name, business_name, status, score, risk_level, created_at
      FROM leads WHERE passport_id = ? OR email = ?
      ORDER BY created_at DESC
    `, [customer.passport_id, customer.email]);

    res.render('portal/passport', {
      title: 'CoverScore Passport',
      user: req.user,
      passport: customer,
      assessments,
      leads
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
