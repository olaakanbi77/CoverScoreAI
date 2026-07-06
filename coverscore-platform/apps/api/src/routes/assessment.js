// Conversation Runtime API — Sprint 1
// Routes: POST /start, /reply, /report, /complete  |  GET /state/:id

const express = require('express');
const router = express.Router();
const db = require('../../../database/schemas');
const { STATES } = require('../../../packages/shared-types');
const questionEngine = require('../../../services/assessment-engine/questionEngine');
const branchEngine = require('../../../services/assessment-engine/branchEngine');
const stateEngine = require('../../../services/assessment-engine/stateEngine');
const scoringEngine = require('../../../services/scoring-engine/src/index');
const reportEngine = require('../../../services/report-engine/src/index');

// ─────────────────────────────────────────────
// POST /assessment/start — start a new assessment
// ─────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { phone, name, packId = 'QP-100', channel = 'whatsapp' } = req.body;

    if (!phone) return res.status(400).json({ error: 'phone is required' });

    // Find or create customer
    let customerRes = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    let customer;
    if (!customerRes.rows.length) {
      customerRes = await db.query(
        `INSERT INTO customers (phone, name) VALUES ($1, $2) RETURNING *`,
        [phone, name || null]
      );
    }
    customer = customerRes.rows[0];

    // Create session
    const sessionRes = await db.query(
      `INSERT INTO conversation_sessions (customer_id, pack_id, state, channel, started_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [customer.id, packId, STATES.WELCOME, channel]
    );
    const session = sessionRes.rows[0];

    // Load pack and get first question
    const { questions } = await questionEngine.loadPack(packId);
    const firstQuestion = questionEngine.getFirstQuestion(questions);

    // Create initial state
    await stateEngine.transition(
      session.id,
      STATES.WELCOME,
      { currentQuestion: firstQuestion ? firstQuestion.id : null }
    );

    // Log event
    await db.query(
      `INSERT INTO events (session_id, customer_id, event_type, data, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [session.id, customer.id, 'assessment.started', JSON.stringify({ packId, channel }), 'api']
    );

    res.json({
      sessionId: session.id,
      customerId: customer.id,
      packId,
      phase: STATES.WELCOME,
      firstQuestion: firstQuestion ? {
        id: firstQuestion.id,
        text: firstQuestion.text,
        options: firstQuestion.options.map(o => ({ text: o.text, value: o.value }))
      } : null,
      totalQuestions: questions.length
    });
  } catch (err) {
    console.error('[start] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /assessment/reply — process an answer
// ─────────────────────────────────────────────
router.post('/reply', async (req, res) => {
  try {
    const { sessionId, answerValue, questionId } = req.body;

    if (!sessionId || !answerValue || !questionId) {
      return res.status(400).json({ error: 'sessionId, questionId, and answerValue are required' });
    }

    // Get session
    const session = await stateEngine.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Load pack
    const { questions } = await questionEngine.loadPack(session.pack_id);

    // Validate question and answer
    const question = questionEngine.getQuestionById(questions, questionId);
    if (!question) return res.status(400).json({ error: `Question ${questionId} not found in pack` });

    const validation = questionEngine.validateAnswer(question, answerValue);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error, validValues: validation.validValues });
    }

    // Get answered IDs so far
    const ansRes = await db.query(
      'SELECT question_id FROM answers WHERE session_id = $1',
      [sessionId]
    );
    const answeredIds = new Set(ansRes.rows.map(r => r.question_id));

    // Check if already answered
    if (answeredIds.has(questionId)) {
      return res.status(409).json({ error: 'Question already answered', questionId });
    }

    // Save answer
    await db.query(
      `INSERT INTO answers (session_id, question_id, option_id, value, score)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, questionId, validation.option.id, answerValue, validation.option.score]
    );
    answeredIds.add(questionId);

    // Log event
    await db.query(
      `INSERT INTO events (session_id, event_type, data, source)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, 'answer.recorded', JSON.stringify({ questionId, value: answerValue }), 'api']
    );

    // Evaluate branch rules to determine next question
    const branchResult = branchEngine.getNextQuestion(
      questions, questionId, answerValue, answeredIds
    );

    // Move to SCORING phase if done
    let phase = STATES.DISCOVERY;
    if (branchResult.done) {
      phase = STATES.SCORING;
      await stateEngine.transition(sessionId, STATES.SCORING);

      // Auto-calculate score
      const scoreResult = await scoringEngine.calculateScore(sessionId);
      await scoringEngine.saveScore(sessionId, scoreResult);

      // Transition to REPORT phase
      await stateEngine.transition(sessionId, STATES.REPORT);

      // Auto-generate report
      const report = await reportEngine.generateReport(sessionId);
      await reportEngine.saveReport(sessionId, report);

      res.json({
        done: true,
        phase,
        score: {
          overall: scoreResult.score,
          riskLevel: scoreResult.riskLevel,
          protectionGap: scoreResult.protectionGap
        },
        report: {
          reportId: report.reportId,
          summary: report.summary,
          pillars: report.pillars
        },
        next: null
      });
      return;
    }

    // Update state with current question
    if (branchResult.questionId) {
      await stateEngine.setCurrentQuestion(sessionId, branchResult.questionId);
    }

    // Get next question for response
    let nextQuestion = null;
    if (branchResult.questionId) {
      const next = questionEngine.getQuestionById(questions, branchResult.questionId);
      if (next) {
        nextQuestion = {
          id: next.id,
          text: next.text,
          options: next.options.map(o => ({ text: o.text, value: o.value }))
        };
      }
    }

    res.json({
      done: false,
      phase,
      answered: { questionId, value: answerValue, score: validation.option.score },
      next: nextQuestion,
      skipped: branchResult.skipped
    });
  } catch (err) {
    console.error('[reply] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /assessment/state/:id — get session state
// ─────────────────────────────────────────────
router.get('/state/:id', async (req, res) => {
  try {
    const session = await stateEngine.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const activeState = await stateEngine.getState(req.params.id);

    // Get answered count
    const ansRes = await db.query(
      'SELECT COUNT(*) as count FROM answers WHERE session_id = $1',
      [req.params.id]
    );

    // Get score if available
    let score = null;
    if (session.state === STATES.REPORT || session.state === STATES.COMPLETE) {
      const scoreRes = await db.query(
        'SELECT * FROM risk_scores WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
        [req.params.id]
      );
      if (scoreRes.rows.length) {
        score = {
          overall: scoreRes.rows[0].score,
          riskLevel: scoreRes.rows[0].risk_level,
          protectionGap: scoreRes.rows[0].protection_gap
        };
      }
    }

    res.json({
      sessionId: session.id,
      packId: session.pack_id,
      phase: session.state,
      currentQuestion: activeState?.current_question || null,
      answeredCount: parseInt(ansRes.rows[0].count),
      startedAt: session.started_at,
      completedAt: session.completed_at,
      score
    });
  } catch (err) {
    console.error('[state] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /assessment/report — get current report
// ─────────────────────────────────────────────
router.post('/report', async (req, res) => {
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
    console.error('[report] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /assessment/complete — complete session
// ─────────────────────────────────────────────
router.post('/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await stateEngine.getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await stateEngine.transition(sessionId, STATES.COMPLETE);

    await db.query(
      'UPDATE conversation_sessions SET completed_at = now(), updated_at = now() WHERE id = $1',
      [sessionId]
    );

    // Log event
    await db.query(
      `INSERT INTO events (session_id, event_type, data, source)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, 'assessment.completed', JSON.stringify({ packId: session.pack_id }), 'api']
    );

    res.json({
      sessionId,
      status: 'completed',
      message: 'Assessment complete'
    });
  } catch (err) {
    console.error('[complete] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
