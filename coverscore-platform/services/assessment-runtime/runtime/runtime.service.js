// Runtime Service — QPRE orchestrator
// Executes the runtime lifecycle: START → LOAD_PACK → LOAD_QUESTION → WAIT_ANSWER → VALIDATE → SAVE → BRANCH → NEXT → COMPLETE

const sessionRepo = require('../repositories/session.repository');
const questionRepo = require('../repositories/question.repository');
const packLoader = require('../loaders/question-pack.loader');
const questionLoader = require('../loaders/question.loader');
const branchService = require('./branch.service');
const stateService = require('./state.service');
const events = require('../events/event-publisher');
const { getValidator } = require('../validators');
const { SESSION_PHASES, RUNTIME_STATES } = require('../types');

class RuntimeService {
  // Start a new assessment session
  async start(data) {
    const { questionPack: packId, channel, phone, name } = data;

    // Resolve customer
    let customer = phone ? await sessionRepo.findByPhone(phone) : null;
    if (!customer && phone) {
      customer = await sessionRepo.createCustomer({ phone, name });
    }

    // Create session
    const session = await sessionRepo.createSession({
      customerId: customer?.id || null,
      packId,
      channel
    });

    // Load pack
    const pack = await packLoader.load(packId);

    // Find first question
    const firstQuestion = await questionRepo.getFirstQuestion(packId);

    // Transition session to DISCOVERY
    await stateService.transitionSession(session.id, SESSION_PHASES.DISCOVERY, {
      currentQuestion: firstQuestion?.id || null,
      runtimeState: RUNTIME_STATES.LOAD_QUESTION
    });

    // Set current question
    if (firstQuestion) {
      await stateService.setCurrentQuestion(session.id, firstQuestion.id);
    }

    // Publish event
    await events.assessmentStarted(session.id, packId, channel);
    if (firstQuestion) {
      await events.questionDisplayed(session.id, firstQuestion.id);
    }

    return { session, firstQuestion: firstQuestion ? await this._formatQuestion(firstQuestion.id) : null };
  }

  // Process an answer and advance the runtime
  async processAnswer(sessionId, questionId, answerValue, confidence = 100) {
    const session = await sessionRepo.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const pack = await packLoader.load(session.pack_id);
    const question = pack.questionMap[questionId];
    if (!question) throw new Error('Question not found in pack');

    // Validate answer
    const validation = this._validate(question, answerValue);
    if (!validation.valid) {
      await events.answerInvalid(sessionId, questionId, validation.error);
      return { error: validation.error, retry: true };
    }
    await events.answerValidated(sessionId, questionId, true);

    // Check if already answered
    const answeredIds = await sessionRepo.getAnsweredIds(sessionId);
    if (answeredIds.has(questionId)) {
      return { error: 'Question already answered', code: 'DUPLICATE' };
    }

    // Save answer
    const option = question.options.find(o => o.value === validation.normalized);
    const saved = await sessionRepo.saveAnswer({
      sessionId, questionId,
      optionId: option?.id || null,
      value: validation.normalized,
      score: option?.score || 0,
      confidence
    });

    await events.answerReceived(sessionId, questionId, validation.normalized);
    await events.questionCompleted(sessionId, questionId, validation.normalized, option?.score || 0);

    answeredIds.add(questionId);

    // Resolve next question via graph traversal
    const branchResult = await branchService.resolveNext(
      sessionId, session.pack_id, questionId, validation.normalized
    );

    // Check if assessment is complete
    if (branchResult.done || !branchResult.questionId) {
      // Check if there are no more sections with unanswered questions
      const allDone = await this._isPackComplete(session.pack_id, answeredIds);
      if (allDone) {
        await stateService.transitionSession(sessionId, SESSION_PHASES.SCORING);
        await stateService.transitionSession(sessionId, SESSION_PHASES.REPORT);
        await events.assessmentCompleted(sessionId, session.pack_id);

        return {
          sessionId,
          phase: SESSION_PHASES.REPORT,
          done: true,
          answered: { questionId, value: validation.normalized, score: option?.score || 0 },
          next: null
        };
      }
    }

    // Move to next question
    if (branchResult.questionId) {
      await stateService.setCurrentQuestion(sessionId, branchResult.questionId);
      await events.questionDisplayed(sessionId, branchResult.questionId);
    }

    // Format next question response
    const nextQuestion = branchResult.questionId
      ? await this._formatQuestion(branchResult.questionId)
      : null;

    return {
      sessionId,
      phase: SESSION_PHASES.DISCOVERY,
      done: false,
      answered: { questionId, value: validation.normalized, score: option?.score || 0 },
      next: nextQuestion
    };
  }

  // Get current session state
  async getState(sessionId) {
    const full = await stateService.getFullState(sessionId);
    if (!full) return null;

    let score = null;
    if (full.session.state === SESSION_PHASES.REPORT || full.session.state === SESSION_PHASES.COMPLETE) {
      if (full.score) {
        score = {
          overall: full.score.score,
          riskLevel: full.score.risk_level,
          protectionGap: full.score.protection_gap
        };
      }
    }

    return {
      sessionId: full.session.id,
      packId: full.session.pack_id,
      phase: full.session.state,
      currentQuestion: full.activeState?.current_question || null,
      currentSection: full.activeState?.current_section || null,
      answered: full.answeredCount,
      startedAt: full.session.started_at,
      completedAt: full.session.completed_at,
      score
    };
  }

  // Complete an assessment (mark as complete)
  async complete(sessionId) {
    const session = await sessionRepo.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    await stateService.completeAssessment(sessionId);
    await events.assessmentCompleted(sessionId, session.pack_id);

    return { sessionId, status: 'completed' };
  }

  // -- Private helpers --

  _validate(question, answerValue) {
    const type = question.question_type || 'choice';
    const validator = getValidator(type);

    if (type === 'choice' || type === 'yes_no') {
      return validator.validate(answerValue, question.options);
    }
    if (type === 'number') {
      return validator.validate(answerValue);
    }
    return validator.validate(answerValue);
  }

  async _formatQuestion(questionId) {
    const q = await questionLoader.load(questionId);
    if (!q) return null;
    return {
      id: q.id,
      text: q.text,
      helpText: q.help_text || null,
      type: q.question_type || 'choice',
      options: (q.options || []).map(o => ({
        id: o.id,
        text: o.text,
        value: o.value
      }))
    };
  }

  async _isPackComplete(packId, answeredIds) {
    const pack = await packLoader.load(packId);
    const unanswered = pack.questions.filter(q => !answeredIds.has(q.id));

    // If no unanswered questions, pack is complete
    if (unanswered.length === 0) return true;

    // If unanswered questions exist but all are unreachable (no graph path), also done
    // For now, simple check — if any unanswered, not done
    return false;
  }
}

module.exports = new RuntimeService();
