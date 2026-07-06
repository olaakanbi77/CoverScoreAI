// State Engine — manages conversation state machine
// KNOWS: state transitions, phase management
// DOES NOT KNOW: questions, scoring, reports

const { STATES, STATE_ORDER, canTransition } = require('../../packages/shared-types');
const db = require('../../database/schemas');

class StateEngine {
  // Get current state for a session
  async getState(sessionId) {
    const res = await db.query(
      'SELECT * FROM conversation_states WHERE session_id = $1 ORDER BY entered_at DESC LIMIT 1',
      [sessionId]
    );
    return res.rows.length ? res.rows[0] : null;
  }

  // Get session record
  async getSession(sessionId) {
    const res = await db.query('SELECT * FROM conversation_sessions WHERE id = $1', [sessionId]);
    return res.rows.length ? res.rows[0] : null;
  }

  // Transition to a new phase
  async transition(sessionId, toPhase, context = {}) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const currentState = await this.getState(sessionId);
    const fromPhase = currentState ? currentState.phase : STATES.NEW;

    if (!canTransition(fromPhase, toPhase)) {
      throw new Error(`Invalid transition from ${fromPhase} to ${toPhase}`);
    }

    // Close current state if exists
    if (currentState) {
      await db.query(
        'UPDATE conversation_states SET exited_at = now() WHERE id = $1',
        [currentState.id]
      );
    }

    // Create new state
    const history = currentState
      ? [...(currentState.history || []), { phase: fromPhase, exitedAt: new Date().toISOString() }]
      : [];

    const newState = await db.query(
      `INSERT INTO conversation_states (session_id, phase, current_question, history, context)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionId, toPhase, context.currentQuestion || null, JSON.stringify(history), JSON.stringify(context)]
    );

    // Update session state
    await db.query(
      'UPDATE conversation_sessions SET state = $1, updated_at = now() WHERE id = $2',
      [toPhase, sessionId]
    );

    // Log event
    await db.query(
      `INSERT INTO events (session_id, event_type, data, source)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, 'state.transition', JSON.stringify({ from: fromPhase, to: toPhase }), 'state-engine']
    );

    return newState.rows[0];
  }

  // Set current question on the active state
  async setCurrentQuestion(sessionId, questionId) {
    const currentState = await this.getState(sessionId);
    if (!currentState) throw new Error(`No active state for session ${sessionId}`);

    await db.query(
      'UPDATE conversation_states SET current_question = $1 WHERE id = $2',
      [questionId, currentState.id]
    );

    await db.query(
      'UPDATE conversation_sessions SET updated_at = now() WHERE id = $1',
      [sessionId]
    );
  }

  // Get phase for a session
  async getPhase(sessionId) {
    const session = await this.getSession(sessionId);
    return session ? session.state : null;
  }

  // Check if session is complete
  async isComplete(sessionId) {
    const phase = await this.getPhase(sessionId);
    return phase === STATES.COMPLETE;
  }
}

module.exports = new StateEngine();
