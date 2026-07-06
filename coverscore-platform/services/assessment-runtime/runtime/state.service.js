// State Service — deterministic runtime state machine
// Tracks: START → LOAD_PACK → LOAD_QUESTION → WAIT_ANSWER → VALIDATE → SAVE → BRANCH → NEXT → COMPLETE

const sessionRepo = require('../repositories/session.repository');
const { RUNTIME_STATES, SESSION_PHASES, canTransition } = require('../types');

class StateService {
  async getRuntimeState(sessionId) {
    const activeState = await sessionRepo.getActiveState(sessionId);
    return activeState?.context?.runtimeState || RUNTIME_STATES.START;
  }

  async transitionSession(sessionId, toPhase, context = {}) {
    const session = await sessionRepo.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const activeState = await sessionRepo.getActiveState(sessionId);
    const fromPhase = activeState?.phase || SESSION_PHASES.NEW;

    if (!canTransition(fromPhase, toPhase)) {
      throw new Error(`Invalid session phase transition: ${fromPhase} → ${toPhase}`);
    }

    // Close current state
    if (activeState) {
      await sessionRepo.closeState(activeState.id);
    }

    // Build history
    const history = activeState
      ? [...(activeState.history || []), { phase: fromPhase, exitedAt: new Date().toISOString() }]
      : [];

    // Create new state with runtime context
    await sessionRepo.createState({
      sessionId,
      phase: toPhase,
      currentSection: context.currentSection || null,
      currentQuestion: context.currentQuestion || null,
      history,
      context: {
        ...context,
        runtimeState: context.runtimeState || RUNTIME_STATES.WAIT_ANSWER
      }
    });

    await sessionRepo.updateSessionState(sessionId, toPhase);
  }

  async setCurrentQuestion(sessionId, questionId, sectionId = null) {
    const activeState = await sessionRepo.getActiveState(sessionId);
    if (!activeState) return;

    const context = { ...(activeState.context || {}), runtimeState: RUNTIME_STATES.WAIT_ANSWER };
    if (sectionId) context.currentSection = sectionId;

    await sessionRepo.updateCurrentQuestion(activeState.id, questionId);

    // Also update the state record's context
    await sessionRepo.closeState(activeState.id);
    await sessionRepo.createState({
      sessionId,
      phase: activeState.phase,
      currentSection: sectionId || activeState.current_section,
      currentQuestion: questionId,
      history: activeState.history || [],
      context
    });
  }

  async completeAssessment(sessionId) {
    const session = await sessionRepo.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    await sessionRepo.completeSession(sessionId);

    // Close and finalize state
    const activeState = await sessionRepo.getActiveState(sessionId);
    if (activeState) {
      await sessionRepo.closeState(activeState.id);
    }

    await sessionRepo.createState({
      sessionId,
      phase: SESSION_PHASES.COMPLETE,
      currentQuestion: null,
      history: activeState?.history || [],
      context: { runtimeState: RUNTIME_STATES.COMPLETE }
    });
  }

  async getPhase(sessionId) {
    const session = await sessionRepo.getSession(sessionId);
    return session?.state || null;
  }

  async getFullState(sessionId) {
    const session = await sessionRepo.getSession(sessionId);
    if (!session) return null;
    const activeState = await sessionRepo.getActiveState(sessionId);
    const answeredCount = await sessionRepo.getAnswerCount(sessionId);
    const score = await sessionRepo.getScore(sessionId);
    return { session, activeState, answeredCount, score };
  }
}

module.exports = new StateService();
