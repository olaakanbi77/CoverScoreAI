// Question Engine — owns question loading, lookup, ordering
// KNOWS: questions, options, sequences
// DOES NOT KNOW: scoring, branching, state, reports

const db = require('../../database/schemas');

class QuestionEngine {
  // Load full pack with questions and options
  async loadPack(packId) {
    const packRes = await db.query('SELECT * FROM question_packs WHERE id = $1 AND active = true', [packId]);
    if (!packRes.rows.length) throw new Error(`Question pack '${packId}' not found`);

    const questionsRes = await db.query(
      'SELECT * FROM questions WHERE pack_id = $1 AND active = true ORDER BY sequence',
      [packId]
    );

    const questions = [];
    for (const q of questionsRes.rows) {
      const optRes = await db.query(
        'SELECT * FROM question_options WHERE question_id = $1 ORDER BY sort_order',
        [q.id]
      );
      questions.push({
        id: q.id,
        sequence: q.sequence,
        text: q.text,
        category: q.category,
        pillar: q.pillar,
        branch_rules: q.branch_rules || [],
        options: optRes.rows.map(o => ({
          id: o.id,
          text: o.text,
          value: o.value,
          score: o.score,
          sort_order: o.sort_order,
          metadata: o.metadata
        }))
      });
    }

    return {
      pack: packRes.rows[0],
      questions
    };
  }

  // Get a specific question by ID
  getQuestionById(questions, questionId) {
    return questions.find(q => q.id === questionId) || null;
  }

  // Get the first question in a pack
  getFirstQuestion(questions) {
    return questions.length ? questions[0] : null;
  }

  // Validate that an answer is valid for a given question
  validateAnswer(question, value) {
    if (!question) return { valid: false, error: 'Question not found' };
    const option = question.options.find(o => o.value === value);
    if (!option) {
      const validValues = question.options.map(o => o.value);
      return { valid: false, error: `Invalid option. Valid values: ${validValues.join(', ')}`, validValues };
    }
    return { valid: true, option };
  }

  // Get the remaining unanswered questions for a session
  async getUnansweredQuestions(sessionId, packId) {
    const { questions } = await this.loadPack(packId);
    const ansRes = await db.query(
      'SELECT question_id FROM answers WHERE session_id = $1',
      [sessionId]
    );
    const answered = new Set(ansRes.rows.map(r => r.question_id));
    return questions.filter(q => !answered.has(q.id));
  }
}

module.exports = new QuestionEngine();
