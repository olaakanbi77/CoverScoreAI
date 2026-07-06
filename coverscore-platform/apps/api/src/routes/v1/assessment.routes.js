// Assessment Routes — QPRE v1 API
// POST /api/v1/assessment/start
// POST /api/v1/assessment/reply
// GET  /api/v1/assessment/session/{id}
// POST /api/v1/assessment/report
// POST /api/v1/assessment/complete

const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/assessment.controller');

router.post('/start', (req, res) => controller.start(req, res));
router.post('/reply', (req, res) => controller.reply(req, res));
router.get('/session/:id', (req, res) => controller.getState(req, res));
router.post('/report', (req, res) => controller.getReport(req, res));
router.post('/complete', (req, res) => controller.complete(req, res));

module.exports = router;
