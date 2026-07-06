// Question Repository — data access for packs, sections, questions, options, branch rules
const db = require('../../../database/schemas');

class QuestionRepository {
  async getPack(packId) {
    const res = await db.query(
      'SELECT * FROM question_packs WHERE id = $1 AND status = $2',
      [packId, 'active']
    );
    return res.rows[0] || null;
  }

  async getSections(packId) {
    const res = await db.query(
      'SELECT * FROM pack_sections WHERE pack_id = $1 ORDER BY sort_order',
      [packId]
    );
    return res.rows;
  }

  async getSection(sectionId) {
    const res = await db.query('SELECT * FROM pack_sections WHERE id = $1', [sectionId]);
    return res.rows[0] || null;
  }

  async getQuestions(packId) {
    const res = await db.query(
      'SELECT * FROM questions WHERE pack_id = $1 AND active = true ORDER BY sequence',
      [packId]
    );
    return res.rows;
  }

  async getQuestionsBySection(sectionId) {
    const res = await db.query(
      'SELECT * FROM questions WHERE section_id = $1 AND active = true ORDER BY sequence',
      [sectionId]
    );
    return res.rows;
  }

  async getQuestion(questionId) {
    const res = await db.query('SELECT * FROM questions WHERE id = $1 AND active = true', [questionId]);
    return res.rows[0] || null;
  }

  async getOptions(questionId) {
    const res = await db.query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY sort_order',
      [questionId]
    );
    return res.rows;
  }

  async getBranchRules(questionId) {
    const res = await db.query(
      'SELECT * FROM branch_rules WHERE question_id = $1 ORDER BY priority',
      [questionId]
    );
    return res.rows;
  }

  // Load full question with options and branch rules
  async getFullQuestion(questionId) {
    const question = await this.getQuestion(questionId);
    if (!question) return null;
    const options = await this.getOptions(questionId);
    const branchRules = await this.getBranchRules(questionId);
    return { ...question, options, branchRules };
  }

  // Load full pack with sections, questions, options
  async getFullPack(packId) {
    const pack = await this.getPack(packId);
    if (!pack) return null;
    const sections = await this.getSections(packId);
    const questions = await this.getQuestions(packId);

    // Attach options to each question
    const questionMap = {};
    for (const q of questions) {
      const options = await this.getOptions(q.id);
      questionMap[q.id] = { ...q, options };
    }

    // Attach questions to sections
    const sectionsWithQuestions = sections.map(s => ({
      ...s,
      questions: questions.filter(q => q.section_id === s.id)
    }));

    return {
      pack,
      sections: sectionsWithQuestions,
      questions: Object.values(questionMap)
    };
  }

  // Get first question in a pack (lowest sequence in first section)
  async getFirstQuestion(packId) {
    const sections = await this.getSections(packId);
    if (!sections.length) {
      // Fall back to first question by sequence
      const res = await db.query(
        'SELECT * FROM questions WHERE pack_id = $1 AND active = true ORDER BY sequence LIMIT 1',
        [packId]
      );
      return res.rows[0] || null;
    }
    const firstSection = sections[0];
    const questions = await this.getQuestionsBySection(firstSection.id);
    if (questions.length) return questions[0];

    // Fallback
    const res = await db.query(
      'SELECT * FROM questions WHERE pack_id = $1 AND active = true ORDER BY sequence LIMIT 1',
      [packId]
    );
    return res.rows[0] || null;
  }
}

module.exports = new QuestionRepository();
