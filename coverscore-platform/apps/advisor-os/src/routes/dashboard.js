// Dashboard Routes — advisor overview stats
const express = require('express');
const router = express.Router();
const svc = require('../advisorDataService');

// GET /api/v1/advisor/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [stats, riskDistribution, recentActivity, topRisks] = await Promise.all([
      svc.getDashboardStats(),
      svc.getRiskDistribution(),
      svc.getRecentActivity(15),
      svc.getTopRisks(10)
    ]);

    res.json({
      stats,
      riskDistribution,
      recentActivity,
      topRisks,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[advisor/dashboard]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
