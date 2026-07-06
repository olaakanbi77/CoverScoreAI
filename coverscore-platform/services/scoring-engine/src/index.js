// Scoring Engine — calculates cover scores from answers
// KNOWS: answer values, score mappings, pillar weights
// DOES NOT KNOW: questions, branch rules, state, reports
// Backward compatible with coverscore-legacy scoringEngine.calculateScore()

const db = require('../../../database/schemas');
const { getRiskLevel } = require('../../../packages/shared-types');

class ScoringEngine {
  // Calculate full score for a session
  async calculateScore(sessionId) {
    const session = await db.query('SELECT * FROM conversation_sessions WHERE id = $1', [sessionId]);
    if (!session.rows.length) throw new Error(`Session ${sessionId} not found`);

    const packRes = await db.query('SELECT * FROM question_packs WHERE id = $1', [session.rows[0].pack_id]);
    if (!packRes.rows.length) throw new Error('Question pack not found');
    const pack = packRes.rows[0];

    // Load all answers for this session
    const ansRes = await db.query(
      'SELECT a.*, q.pillar, q.category FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.session_id = $1',
      [sessionId]
    );
    const answers = ansRes.rows;

    // Score by pillar
    const pillarScores = {};
    const categoryScores = {};
    let totalScore = 0;
    let answeredCount = 0;

    for (const answer of answers) {
      totalScore += answer.score || 0;
      answeredCount++;

      if (answer.pillar) {
        if (!pillarScores[answer.pillar]) {
          pillarScores[answer.pillar] = { total: 0, count: 0, score: 0 };
        }
        pillarScores[answer.pillar].total += answer.score || 0;
        pillarScores[answer.pillar].count++;
      }

      if (answer.category) {
        if (!categoryScores[answer.category]) {
          categoryScores[answer.category] = { total: 0, count: 0, score: 0 };
        }
        categoryScores[answer.category].total += answer.score || 0;
        categoryScores[answer.category].count++;
      }
    }

    // Normalize pillar scores to 0–100
    for (const [key, p] of Object.entries(pillarScores)) {
      pillarScores[key] = { ...p, score: p.count > 0 ? Math.round(p.total / p.count) : 0 };
    }

    for (const [key, c] of Object.entries(categoryScores)) {
      categoryScores[key] = { ...c, score: c.count > 0 ? Math.round(c.total / c.count) : 0 };
    }

    const finalScore = answeredCount > 0 ? Math.round(totalScore / answeredCount) : 0;
    const riskLevel = getRiskLevel(finalScore);

    // Apply modifiers from pack config
    const modifiers = pack.modifiers || [];
    let minLoss = 0;
    let maxLoss = 0;
    let protectionGap = 0;
    let exposureIndex = 'Low';
    let riskDna = '';

    // Identify triggered risks based on low-scoring categories/pillars
    const identifiedRisks = [];
    for (const [key, c] of Object.entries(categoryScores)) {
      if (c.score < 50) {
        identifiedRisks.push({
          category: key,
          score: c.score,
          detail: `Low resilience in ${key}`
        });
      }
    }

    // Calculate protection gap
    const gapCategories = Object.values(categoryScores).filter(c => c.score < 70);
    protectionGap = Math.round(
      (gapCategories.length / Math.max(Object.keys(categoryScores).length, 1)) * 100
    );

    // Build risk profile
    const riskProfile = {
      pillarScores,
      categoryScores,
      totalQuestions: pack.questions ? pack.questions.length : 0,
      answeredCount
    };

    return {
      score: finalScore,
      riskLevel,
      pillars: pillarScores,
      categories: categoryScores,
      modifiers,
      identifiedRisks,
      riskProfile,
      minLoss,
      maxLoss,
      exposureIndex,
      protectionGap,
      riskDna,
      confidence: answeredCount > 0 ? Math.round((answeredCount / Math.max(Object.keys(pillarScores).length * 3, 1)) * 100) : 0
    };
  }

  // Save scoring results to DB
  async saveScore(sessionId, scoreResult) {
    const res = await db.query(
      `INSERT INTO risk_scores
       (session_id, score, risk_level, pillars, categories, modifiers, identified_risks, risk_profile,
        min_loss, max_loss, exposure_index, protection_gap, risk_dna, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        sessionId,
        scoreResult.score,
        scoreResult.riskLevel,
        JSON.stringify(scoreResult.pillars),
        JSON.stringify(scoreResult.categories),
        JSON.stringify(scoreResult.modifiers),
        JSON.stringify(scoreResult.identifiedRisks),
        JSON.stringify(scoreResult.riskProfile),
        scoreResult.minLoss,
        scoreResult.maxLoss,
        scoreResult.exposureIndex,
        scoreResult.protectionGap,
        scoreResult.riskDna,
        scoreResult.confidence
      ]
    );

    await db.query(
      `INSERT INTO events (session_id, event_type, data, source)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, 'scoring.complete', JSON.stringify({ score: scoreResult.score, riskLevel: scoreResult.riskLevel }), 'scoring-engine']
    );

    return res.rows[0];
  }
}

module.exports = new ScoringEngine();
