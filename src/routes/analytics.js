const express = require('express');
const { all, get } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAgent } = require('../middleware/rbac');

const router = express.Router();

router.get('/overview', authenticate, requireAgent, async (req, res, next) => {
  try {
    const totalAssessments = await get('SELECT COUNT(*) as count FROM assessments');

    const totalLeads = await get('SELECT COUNT(*) as count FROM leads');
    const convertedLeads = await get('SELECT COUNT(*) as count FROM leads WHERE status = "converted"');
    const conversionRate = totalLeads.count > 0 ? Math.round((convertedLeads.count / totalLeads.count) * 100) : 0;

    const avgScoreResult = await get('SELECT AVG(score) as avg FROM assessments');
    const avgScore = Math.round(avgScoreResult?.avg || 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthlyAssessments = await get('SELECT COUNT(*) as count FROM assessments WHERE created_at >= ?', [thisMonth.toISOString()]);

    res.json({
      totalAssessments: totalAssessments.count,
      totalLeads: totalLeads.count,
      convertedLeads: convertedLeads.count,
      conversionRate,
      avgScore,
      monthlyAssessments: monthlyAssessments.count
    });
  } catch (error) {
    next(error);
  }
});

router.get('/risk-distribution', authenticate, requireAgent, async (req, res, next) => {
  try {
    const distribution = await all(`
      SELECT risk_level, COUNT(*) as count
      FROM leads
      GROUP BY risk_level
    `);

    const result = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0
    };

    distribution.forEach(d => {
      result[d.risk_level] = d.count;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/conversion', authenticate, requireAgent, async (req, res, next) => {
  try {
    const statusCounts = await all(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    `);

    const result = {
      new: 0,
      contacted: 0,
      converted: 0,
      lost: 0
    };

    statusCounts.forEach(s => {
      result[s.status] = s.count;
    });

    const total = Object.values(result).reduce((a, b) => a + b, 0);
    const conversionRate = total > 0 ? Math.round((result.converted / total) * 100) : 0;

    res.json({
      ...result,
      total,
      conversionRate
    });
  } catch (error) {
    next(error);
  }
});

router.get('/industry-distribution', authenticate, requireAgent, async (req, res, next) => {
  try {
    const industries = await all(`
      SELECT u.industry, COUNT(*) as count
      FROM leads l
      JOIN users u ON l.email = u.email
      WHERE u.industry IS NOT NULL
      GROUP BY u.industry
    `);

    res.json(industries.map(i => ({
      industry: i.industry || 'Unknown',
      count: i.count
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/trends', authenticate, requireAgent, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const assessments = await all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM assessments
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate.toISOString()]);

    res.json(assessments);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
