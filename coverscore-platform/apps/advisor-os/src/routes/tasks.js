// Task Routes — advisor follow-up actions from journey steps
const express = require('express');
const router = express.Router();
const svc = require('../advisorDataService');
const journeyEngine = require('../../../services/journey-engine/src/index');

// GET /api/v1/advisor/tasks
router.get('/tasks', async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await svc.listTasks(
      status || 'available',
      parseInt(page) || 1,
      parseInt(limit) || 50
    );
    res.json(result);
  } catch (err) {
    console.error('[advisor/tasks]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/advisor/tasks/:progressId/complete
router.post('/tasks/:progressId/complete', async (req, res) => {
  try {
    const { progressId } = req.params;
    const { customerJourneyId, action } = req.body;
    if (!customerJourneyId) return res.status(400).json({ error: 'customerJourneyId required' });

    const result = await journeyEngine.completeStep(
      customerJourneyId, progressId, action || {}
    );
    res.json(result);
  } catch (err) {
    console.error('[advisor/tasks/complete]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
