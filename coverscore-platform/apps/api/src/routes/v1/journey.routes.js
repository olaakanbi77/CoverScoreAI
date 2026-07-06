// Journey Routes — v1 API
// GET  /api/v1/journeys/active/:customerId
// GET  /api/v1/journeys/state/:customerJourneyId
// GET  /api/v1/journeys/step/:customerJourneyId
// POST /api/v1/journeys/step/complete
// POST /api/v1/journeys/cancel

const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/journey.controller');

router.get('/active/:customerId', (req, res) => controller.getActive(req, res));
router.get('/state/:customerJourneyId', (req, res) => controller.getState(req, res));
router.get('/step/:customerJourneyId', (req, res) => controller.getCurrentStep(req, res));
router.post('/step/complete', (req, res) => controller.completeStep(req, res));
router.post('/cancel', (req, res) => controller.cancel(req, res));

module.exports = router;
