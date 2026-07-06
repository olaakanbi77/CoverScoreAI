// Journey Controller — HTTP layer for the Journey Engine
const journeyEngine = require('../../../services/journey-engine/src/index');

class JourneyController {
  // GET /journeys/active/:customerId — list active journeys
  async getActive(req, res) {
    try {
      const { customerId } = req.params;
      const journeys = await journeyEngine.getActiveJourneys(customerId);
      res.json({ customerId, count: journeys.length, journeys });
    } catch (err) {
      console.error('[journey/active]', err);
      res.status(500).json({ error: err.message });
    }
  }

  // GET /journeys/state/:customerJourneyId — journey state
  async getState(req, res) {
    try {
      const { customerJourneyId } = req.params;
      const state = await journeyEngine.getJourneyState(customerJourneyId);
      if (!state) return res.status(404).json({ error: 'Journey not found' });

      const currentStep = state.currentStep ? {
        progressId: state.currentStep.id,
        stepId: state.currentStep.step_id,
        sequence: state.currentStep.step_sequence,
        type: state.currentStep.step_type,
        title: state.currentStep.title,
        content: state.currentStep.content
      } : null;

      res.json({
        journeyId: state.journey.id,
        customerJourneyId: state.journey.id,
        code: state.definition?.code,
        name: state.definition?.name,
        status: state.journey.status,
        currentStep,
        progress: state.progress.map(p => ({
          sequence: p.step_sequence,
          type: p.step_type,
          title: p.title,
          status: p.status,
          completedAt: p.completed_at
        })),
        startedAt: state.journey.started_at,
        completedAt: state.journey.completed_at
      });
    } catch (err) {
      console.error('[journey/state]', err);
      res.status(500).json({ error: err.message });
    }
  }

  // GET /journeys/step/:customerJourneyId — current available step
  async getCurrentStep(req, res) {
    try {
      const { customerJourneyId } = req.params;
      const step = await journeyEngine.getCurrentStep(customerJourneyId);
      if (!step) return res.json({ step: null, message: 'All steps completed' });
      res.json({ step });
    } catch (err) {
      console.error('[journey/step]', err);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /journeys/step/complete — mark step done, advance journey
  async completeStep(req, res) {
    try {
      const { customerJourneyId, progressId, action } = req.body;
      if (!customerJourneyId || !progressId) {
        return res.status(400).json({ error: 'customerJourneyId and progressId are required' });
      }

      const result = await journeyEngine.completeStep(customerJourneyId, progressId, action || {});
      res.json(result);
    } catch (err) {
      console.error('[journey/step/complete]', err);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /journeys/cancel — cancel a journey
  async cancel(req, res) {
    try {
      const { customerJourneyId } = req.body;
      if (!customerJourneyId) return res.status(400).json({ error: 'customerJourneyId is required' });

      await journeyEngine.cancelJourney(customerJourneyId);
      res.json({ customerJourneyId, status: 'cancelled' });
    } catch (err) {
      console.error('[journey/cancel]', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new JourneyController();
