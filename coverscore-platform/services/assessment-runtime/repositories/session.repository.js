// Session Repository — data access for sessions, states, customers
const db = require('../../../database/schemas');

class SessionRepository {
  async findByPhone(phone) {
    const res = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    return res.rows[0] || null;
  }

  async createCustomer(data) {
    const res = await db.query(
      `INSERT INTO customers (phone, name) VALUES ($1, $2) RETURNING *`,
      [data.phone, data.name || null]
    );
    return res.rows[0];
  }

  async getCustomer(id) {
    const res = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async createSession(data) {
    const res = await db.query(
      `INSERT INTO conversation_sessions (customer_id, pack_id, state, channel)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.customerId, data.packId, 'NEW', data.channel || 'whatsapp']
    );
    return res.rows[0];
  }

  async getSession(sessionId) {
    const res = await db.query('SELECT * FROM conversation_sessions WHERE id = $1', [sessionId]);
    return res.rows[0] || null;
  }

  async updateSessionState(sessionId, state) {
    await db.query(
      'UPDATE conversation_sessions SET state = $1, updated_at = now() WHERE id = $2',
      [state, sessionId]
    );
  }

  async completeSession(sessionId) {
    await db.query(
      'UPDATE conversation_sessions SET state = $1, completed_at = now(), updated_at = now() WHERE id = $2',
      ['COMPLETE', sessionId]
    );
  }

  async saveAnswer(data) {
    const res = await db.query(
      `INSERT INTO answers (session_id, question_id, option_id, value, score, confidence)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.sessionId, data.questionId, data.optionId, data.value, data.score, data.confidence || 100]
    );
    return res.rows[0];
  }

  async getAnsweredIds(sessionId) {
    const res = await db.query(
      'SELECT question_id FROM answers WHERE session_id = $1',
      [sessionId]
    );
    return new Set(res.rows.map(r => r.question_id));
  }

  async getAnswerCount(sessionId) {
    const res = await db.query(
      'SELECT COUNT(*) as count FROM answers WHERE session_id = $1',
      [sessionId]
    );
    return parseInt(res.rows[0].count);
  }

  async getActiveState(sessionId) {
    const res = await db.query(
      'SELECT * FROM conversation_states WHERE session_id = $1 ORDER BY entered_at DESC LIMIT 1',
      [sessionId]
    );
    return res.rows[0] || null;
  }

  async createState(data) {
    const res = await db.query(
      `INSERT INTO conversation_states (session_id, phase, current_section, current_question, history, context)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.sessionId,
        data.phase,
        data.currentSection || null,
        data.currentQuestion || null,
        JSON.stringify(data.history || []),
        JSON.stringify(data.context || {})
      ]
    );
    return res.rows[0];
  }

  async closeState(stateId) {
    await db.query(
      'UPDATE conversation_states SET exited_at = now() WHERE id = $1',
      [stateId]
    );
  }

  async updateCurrentQuestion(stateId, questionId) {
    await db.query(
      'UPDATE conversation_states SET current_question = $1 WHERE id = $2',
      [questionId, stateId]
    );
  }

  async getScore(sessionId) {
    const res = await db.query(
      'SELECT * FROM risk_scores WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );
    return res.rows[0] || null;
  }

  async getEvents(sessionId, type) {
    const query = type
      ? db.query('SELECT * FROM events WHERE session_id = $1 AND event_type = $2 ORDER BY created_at', [sessionId, type])
      : db.query('SELECT * FROM events WHERE session_id = $1 ORDER BY created_at', [sessionId]);
    return (await query).rows;
  }
}

module.exports = new SessionRepository();
