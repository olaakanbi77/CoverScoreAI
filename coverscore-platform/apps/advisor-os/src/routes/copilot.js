// Copilot Routes — AI advisor context for any customer
const express = require('express');
const router = express.Router();
const svc = require('../advisorDataService');

// GET /api/v1/advisor/copilot/:customerId — full context for advisor AI
router.get('/copilot/:customerId', async (req, res) => {
  try {
    const context = await svc.getCopilotContext(req.params.customerId);
    if (!context) return res.status(404).json({ error: 'Customer not found' });
    res.json(context);
  } catch (err) {
    console.error('[advisor/copilot]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/advisor/copilot/:customerId/briefing — condensed advisor briefing
router.get('/copilot/:customerId/briefing', async (req, res) => {
  try {
    const context = await svc.getCopilotContext(req.params.customerId);
    if (!context) return res.status(404).json({ error: 'Customer not found' });

    const score = context.score;
    const briefing = {
      customer: {
        name: context.customer.name,
        phone: context.customer.phone,
        email: context.customer.email
      },
      assessment: {
        packId: context.session?.packId,
        completed: !!score,
        date: context.session?.startedAt
      },
      riskSummary: score ? {
        coverScore: score.overall,
        riskLevel: score.riskLevel,
        protectionGap: score.protectionGap
      } : null,
      keyFindings: (context.answers || [])
        .filter(a => a.score < 50)
        .map(a => ({
          area: a.category || a.pillar,
          question: a.question,
          answer: a.answer,
          score: a.score
        })),
      activeJourneys: (context.journeys || []).map(j => ({
        name: j.name,
        status: j.status,
        currentStep: j.currentStep,
        nextActions: (j.nextSteps || []).map(ns => ({
          type: ns.step_type,
          title: ns.title
        }))
      }))
    };

    res.json(briefing);
  } catch (err) {
    console.error('[advisor/copilot/briefing]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
