const coverscoreEngine = require('./coverscoreEngine');

const getPrefixFromAnswers = (answers) => {
  for (const key of Object.keys(answers)) {
    const match = key.match(/^([A-Z]+)_\d+$/);
    if (match) return match[1];
    if (key === 'template_selection' && answers[key] && answers[key].template_id) {
      return answers[key].template_id;
    }
  }
  return null;
};

const calculateScore = async (answers) => {
  const prefix = getPrefixFromAnswers(answers);
  if (!prefix) {
    return {
      score: 50,
      resilience_score: 50,
      risk_level: 'Moderate',
      risk_categories: { General: 50 },
      recommendations: [],
      identified_gaps: [],
      min_loss: 200000,
      max_loss: 500000,
      exposure_index: 'Moderate',
      protection_gap: 50,
      risk_dna: 'Balanced Profile'
    };
  }

  const result = coverscoreEngine.calculate(prefix, answers);
  return {
    score: result.score,
    resilience_score: result.resilience_score,
    risk_level: result.risk_level,
    recommendations: result.recommendations,
    structured_recommendations: result.structured_recommendations || [],
    identified_gaps: result.identified_gaps,
    identified_risks: result.identified_risks,
    risk_profile: result.risk_profile,
    risk_categories: result.risk_categories,
    min_loss: result.min_loss,
    max_loss: result.max_loss,
    exposure_index: result.exposure_index,
    protection_gap: result.protection_gap,
    risk_dna: result.risk_dna,
    confidence: result.confidence,
    priority_risks: result.priority_risks,
    improvement_potential: result.improvement_potential,
    question_scores: result.question_scores,
    category_scores: result.category_scores,
    pillar_scores: result.pillar_scores,
    modifiers_applied: result.modifiers_applied
  };
};

module.exports = {
  calculateScore,
  getRiskLevel: (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Moderate';
    if (score >= 40) return 'Vulnerable';
    return 'Critical';
  }
};
