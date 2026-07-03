const scoringConfigs = require('../config/scoring');

const getRiskLevel = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 40) return 'Vulnerable';
  return 'Critical';
};

const getExposureIndex = (score) => {
  if (score >= 75) return 'Low';
  if (score >= 50) return 'Moderate';
  if (score >= 25) return 'High';
  return 'Critical';
};

const getRiskDNA = (pillarScores) => {
  let maxScore = -1;
  let dominant = 'Balanced';
  for (const [name, score] of Object.entries(pillarScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Dominant™';
    }
  }
  return dominant;
};

const estimateLoss = (score, baseValue = 10000000) => {
  const effectiveRisk = Math.max((100 - score) / 100, 0.05);
  const maxLoss = Math.round(baseValue * effectiveRisk);
  const minLoss = Math.round(maxLoss * 0.4);
  return { min_loss: minLoss, max_loss: maxLoss };
};

const resolveAnswer = (answer) => {
  if (answer === null || answer === undefined) return null;
  if (Array.isArray(answer)) return answer[0];
  return answer;
};

class CoverScoreEngine {
  calculate(prefix, answers) {
    const config = scoringConfigs[prefix];
    if (!config) return this._fallback(answers);

    const resolved = {};
    for (const [key, val] of Object.entries(answers)) {
      resolved[key] = resolveAnswer(val);
    }

    const questionScores = this._layer1QuestionScores(config, resolved);
    const categoryScores = this._layer2CategoryScores(config, questionScores);
    const pillarScores = this._layer3PillarScores(config, categoryScores);
    const modifiers = this._layer4Modifiers(config, resolved);
    const overall = this._layer5Overall(config, pillarScores, modifiers);
    const confidence = this._calculateConfidence(config, resolved);
    const priorityRisks = this._priorityRiskIndex(config, questionScores, resolved);
    const improvement = this._improvementPotential(config, questionScores, resolved);
    const loss = estimateLoss(overall.score);

    const level = getRiskLevel(overall.score);
    return {
      score: overall.score,
      resilience_score: 100 - overall.score,
      risk_level: level,
      riskLevel: level,
      risk_categories: Object.fromEntries(
        Object.entries(pillarScores).map(([k, v]) => [k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), v])
      ),
      question_scores: questionScores,
      category_scores: categoryScores,
      pillar_scores: pillarScores,
      modifiers_applied: modifiers,
      confidence: confidence,
      priority_risks: priorityRisks,
      improvement_potential: improvement,
      identified_gaps: [...new Set(priorityRisks.filter(p => p.gap).map(p => p.gap))],
      recommendations: [...new Set(priorityRisks.filter(p => p.recommendation).map(p => p.recommendation))],
      min_loss: loss.min_loss,
      max_loss: loss.max_loss,
      exposure_index: getExposureIndex(overall.score),
      protection_gap: 100 - overall.score,
      risk_dna: getRiskDNA(pillarScores)
    };
  }

  _layer1QuestionScores(config, answers) {
    const scores = {};
    for (const [qId, qConfig] of Object.entries(config.questions)) {
      const answer = answers[qId];
      if (answer === null || answer === undefined) continue;
      if (qConfig.scores && qConfig.scores[answer] !== undefined) {
        scores[qId] = qConfig.scores[answer];
      }
    }
    return scores;
  }

  _layer2CategoryScores(config, questionScores) {
    const scores = {};
    for (const [catId, cat] of Object.entries(config.categories)) {
      let total = 0;
      let weightSum = 0;
      for (const [qId, qConfig] of Object.entries(config.questions)) {
        if (qConfig.category !== catId) continue;
        const qScore = questionScores[qId];
        if (qScore === undefined) continue;
        const w = qConfig.weight || 1;
        total += qScore * w;
        weightSum += w;
      }
      scores[catId] = weightSum > 0 ? Math.round(total / weightSum) : null;
    }
    return scores;
  }

  _layer3PillarScores(config, categoryScores) {
    const scores = {};
    for (const pillar of config.pillars) {
      let total = 0;
      let weightSum = 0;
      for (const [catId, cat] of Object.entries(config.categories)) {
        if (cat.pillar !== pillar.id) continue;
        const catScore = categoryScores[catId];
        if (catScore === null || catScore === undefined) continue;
        const w = cat.weight || 1;
        total += catScore * w;
        weightSum += w;
      }
      scores[pillar.id] = weightSum > 0 ? Math.round(total / weightSum) : null;
    }
    return scores;
  }

  _layer4Modifiers(config, answers) {
    const applied = [];
    let netImpact = 0;
    for (const mod of config.modifiers) {
      const allMet = mod.conditions.every(([qId, expected]) => {
        const ans = answers[qId];
        if (ans === null || ans === undefined) return false;
        if (Array.isArray(expected)) return expected.includes(ans);
        return ans === expected;
      });
      if (allMet) {
        const impact = (mod.bonus || 0) - (mod.penalty || 0);
        netImpact += impact;
        applied.push({ id: mod.id, name: mod.name, impact, type: impact > 0 ? 'bonus' : 'penalty' });
      }
    }
    return { applied, netImpact };
  }

  _layer5Overall(config, pillarScores, modifiers) {
    const totalWeight = config.pillars.reduce((s, p) => s + p.weight, 0);
    if (totalWeight === 0) return { score: 50, weightedPillarScore: 50, netModifier: 0 };
    let weightedScore = 0;
    for (const pillar of config.pillars) {
      const ps = pillarScores[pillar.id];
      weightedScore += (ps !== null && ps !== undefined ? ps : 50) * (pillar.weight / totalWeight);
    }
    const rawScore = weightedScore + modifiers.netImpact;
    return {
      score: Math.max(0, Math.min(100, Math.round(rawScore))),
      weightedPillarScore: Math.round(weightedScore),
      netModifier: modifiers.netImpact
    };
  }

  _calculateConfidence(config, answers) {
    let answered = 0;
    let total = 0;
    for (const qId of Object.keys(config.questions)) {
      total++;
      if (answers[qId] !== null && answers[qId] !== undefined) {
        answered++;
      }
    }
    if (total === 0) return 100;
    const completeness = (answered / total) * 100;
    return Math.round(Math.min(100, completeness));
  }

  _priorityRiskIndex(config, questionScores, answers) {
    const risks = [];
    for (const [qId, qConfig] of Object.entries(config.questions)) {
      const score = questionScores[qId];
      if (score === undefined) continue;
      const answer = answers[qId];
      if (answer === null || answer === undefined) continue;
      let severity;
      if (score >= 70) severity = 'Low';
      else if (score >= 40) severity = 'Moderate';
      else if (score >= 20) severity = 'High';
      else severity = 'Critical';
      if (severity === 'Low') continue;
      const gap = qConfig.gaps && qConfig.gaps[answer] ? qConfig.gaps[answer] : null;
      const recommendation = qConfig.recommendations && qConfig.recommendations[answer] ? qConfig.recommendations[answer] : null;
      risks.push({ question_id: qId, answer, resilience_score: score, severity, gap, recommendation });
    }
    risks.sort((a, b) => {
      const order = { Critical: 0, High: 1, Moderate: 2 };
      return (order[a.severity] || 99) - (order[b.severity] || 99);
    });
    return risks;
  }

  _improvementPotential(config, questionScores, answers) {
    const improvements = [];
    let current = 0;
    let totalQs = 0;
    let maxPossible = 0;
    for (const [qId, qConfig] of Object.entries(config.questions)) {
      const score = questionScores[qId];
      if (score === undefined) continue;
      totalQs++;
      current += score;
      const answer = answers[qId];
      let bestScore = score;
      if (qConfig.scores) {
        for (const optScore of Object.values(qConfig.scores)) {
          if (optScore > bestScore) bestScore = optScore;
        }
      }
      maxPossible += bestScore;
      if (answer !== null && answer !== undefined && qConfig.scores) {
        const currentScore = qConfig.scores[answer];
        if (currentScore !== undefined && currentScore < 100) {
          for (const [opt, optScore] of Object.entries(qConfig.scores)) {
            if (optScore > currentScore) {
              const gain = Math.round((optScore - currentScore) / 10);
              if (gain > 0) {
                improvements.push({ question_id: qId, action: opt, from: answer, to: opt, potential_gain: Math.min(gain, 15) });
              }
            }
          }
        }
      }
    }
    const avgCurrent = totalQs > 0 ? Math.round(current / totalQs) : 50;
    const avgMax = totalQs > 0 ? Math.round(maxPossible / totalQs) : 100;
    const configImps = config.improvements || {};
    for (const [qId, impMap] of Object.entries(configImps)) {
      const answer = answers[qId];
      if (answer !== null && answer !== undefined && impMap[answer]) {
        const imp = impMap[answer];
        improvements.push({ question_id: qId, action: imp.action, from: answer, to: imp.target, potential_gain: imp.gain });
      }
    }
    improvements.sort((a, b) => b.potential_gain - a.potential_gain);
    return {
      current_score: avgCurrent,
      potential_score: Math.max(avgCurrent, Math.min(100, avgMax)),
      improvements: improvements.slice(0, 4)
    };
  }

  _fallback(answers) {
    return {
      score: 50,
      resilience_score: 50,
      risk_level: 'Moderate',
      risk_categories: { 'General': 50 },
      question_scores: {},
      category_scores: {},
      pillar_scores: { general: 50 },
      modifiers_applied: { applied: [], netImpact: 0 },
      confidence: 0,
      priority_risks: [],
      improvement_potential: { current_score: 50, potential_score: 50, improvements: [] },
      identified_gaps: [],
      recommendations: [],
      min_loss: 200000,
      max_loss: 500000,
      exposure_index: 'Moderate',
      protection_gap: 50,
      risk_dna: 'Balanced Profile'
    };
  }
}

module.exports = new CoverScoreEngine();
