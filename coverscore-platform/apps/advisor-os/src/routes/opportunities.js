// Opportunity Routes — advisor action items from triggered journeys
const express = require('express');
const router = express.Router();
const svc = require('../advisorDataService');
const journeyEngine = require('../../../services/journey-engine/src/index');

// GET /api/v1/advisor/opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await svc.listOpportunities(
      status || 'active',
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    res.json(result);
  } catch (err) {
    console.error('[advisor/opportunities]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/advisor/opportunities/:progressId
router.get('/opportunities/:progressId', async (req, res) => {
  try {
    const detail = await svc.getOpportunityDetail(req.params.progressId);
    if (!detail) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(detail);
  } catch (err) {
    console.error('[advisor/opportunities/:id]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/advisor/opportunities/:progressId/complete
router.post('/opportunities/:progressId/complete', async (req, res) => {
  try {
    const { progressId } = req.params;
    const { customerJourneyId, action } = req.body;
    if (!customerJourneyId) return res.status(400).json({ error: 'customerJourneyId required' });

    const result = await journeyEngine.completeStep(
      customerJourneyId, progressId, action || {}
    );
    res.json(result);
  } catch (err) {
    console.error('[advisor/opportunities/:id/complete]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
