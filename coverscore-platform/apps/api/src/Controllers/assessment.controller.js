// Assessment Controller — HTTP layer for the QPRE
const runtime = require('../../../services/assessment-runtime/runtime/runtime.service');
const scoringEngine = require('../../../services/scoring-engine/src/index');
const reportEngine = require('../../../services/report-engine/src/index');
const journeyEngine = require('../../../services/journey-engine/src/index');
const events = require('../../../services/assessment-runtime/events/event-publisher');
const sessionRepo = require('../../../services/assessment-runtime/repositories/session.repository');
const {
  StartAssessmentRequest,
  StartAssessmentResponse,
  ReplyResponse,
  SessionStateResponse,
  CompleteResponse
} = require('../../../services/assessment-runtime/dto/assessment.dto');

class AssessmentController {
  async start(req, res) {
    try {
      const input = new StartAssessmentRequest(req.body);
      const { session, firstQuestion } = await runtime.start({
        questionPack: input.questionPack,
        channel: input.channel,
        phone: input.phone,
        name: input.name,
        customerId: input.customerId
      });
      const response = new StartAssessmentResponse(session, firstQuestion);
      res.status(201).json(response);
    } catch (err) {
      console.error('[controller/start]', err);
      res.status(500).json({ error: err.message });
    }
  }

  async reply(req, res) {
    try {
      const { sessionId, answer, questionId, confidence } = req.body;
      if (!sessionId || answer === undefined || answer === null) {
        return res.status(400).json({ error: 'sessionId and answer are required' });
      }

      const result = await runtime.processAnswer(sessionId, questionId, answer, confidence);

      if (result.error) {
        return res.status(400).json(result);
      }

      // If assessment completed, auto-score and generate report
      if (result.done) {
        try {
          const scoreResult = await scoringEngine.calculateScore(sessionId);
          await scoringEngine.saveScore(sessionId, scoreResult);
          await events.scoringTriggered(sessionId, scoreResult.score);

          const report = await reportEngine.generateReport(sessionId);
          await reportEngine.saveReport(sessionId, report);
          await events.publish(sessionId, 'ReportGenerated', { reportId: report.reportId });

          result.score = {
            overall: scoreResult.score,
            riskLevel: scoreResult.riskLevel,
            protectionGap: scoreResult.protectionGap
          };
          result.report = {
            reportId: report.reportId,
            summary: report.summary,
            pillars: report.pillars
          };

          // Auto-start triggered journeys
          try {
            const session = await sessionRepo.getSession(sessionId);
            if (session?.customer_id) {
              const journeys = await journeyEngine.autoStartJourneys(
                sessionId, session.customer_id, scoreResult
              );
              result.journeys = journeys.map(j => ({
                journeyId: j.journey_id,
                customerJourneyId: j.id,
                currentStep: j.current_step
              }));
            }
          } catch (journeyErr) {
            console.error('[controller/reply] journey error:', journeyErr);
          }
        } catch (scoreErr) {
          console.error('[controller/reply] scoring error:', scoreErr);
        }
      }

      const response = new ReplyResponse(result);
      res.json(response);
    } catch (err) {
      console.error('[controller/reply]', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getState(req, res) {
    try {
      const { id } = req.params;
      const state = await runtime.getState(id);
      if (!state) return res.status(404).json({ error: 'Session not found' });

      const response = new SessionStateResponse(
        { id: state.sessionId, pack_id: state.packId, state: state.phase, started_at: state.startedAt, completed_at: state.completedAt },
        { current_question: state.currentQuestion, current_section: state.currentSection },
        state.answered,
        state.score
      );
      res.json(response);
    } catch (err) {
      console.error('[controller/state]', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getReport(req, res) {
    try {
      const { sessionId, format = 'json' } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

      const report = await reportEngine.generateReport(sessionId);

      if (format === 'html') {
        res.type('text/html').send(reportEngine.generateHtml(report));
      } else {
        res.json(report);
      }
    } catch (err) {
      console.error('[controller/report]', err);
      res.status(500).json({ error: err.message });
    }
  }

  async complete(req, res) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

      const result = await runtime.complete(sessionId);
      res.json(new CompleteResponse(result.sessionId));
    } catch (err) {
      console.error('[controller/complete]', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AssessmentController();
