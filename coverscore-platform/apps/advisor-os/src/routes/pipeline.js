// Pipeline Routes — customer journey stages
const express = require('express');
const router = express.Router();
const svc = require('../advisorDataService');

// GET /api/v1/advisor/pipeline
router.get('/pipeline', async (req, res) => {
  try {
    const pipeline = await svc.getPipeline();
    res.json({
      pipeline,
      totalCustomers: pipeline.reduce((sum, s) => sum + s.count, 0),
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[advisor/pipeline]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
