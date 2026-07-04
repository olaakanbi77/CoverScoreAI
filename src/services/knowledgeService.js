const riskRegistry = require('../knowledge/riskObjects');
const scoringConfigs = require('../config/scoring');
const urecosRegistry = require('../knowledge/recommendations');

class KnowledgeService {
  constructor() {
    riskRegistry.initialize();
    urecosRegistry.initialize();
  }

  getRisk(riskId) {
    return riskRegistry.getRiskObject(riskId);
  }

  getRisksByQuestion(questionId) {
    return riskRegistry.getRiskObjectsByQuestion(questionId);
  }

  getRisksByPrefix(prefix) {
    return riskRegistry.getRiskObjectsByPrefix(prefix);
  }

  getAllRisks() {
    return riskRegistry.getAllRiskObjects();
  }

  getIdentifiedRisks(prefix, answers) {
    return riskRegistry.getIdentifiedRisks(prefix, answers);
  }

  getRiskGraph(riskId) {
    return riskRegistry.getRiskGraph(riskId);
  }

  explainRisk(riskId, answer) {
    return riskRegistry.explainRisk(riskId, answer);
  }

  getQuestionRiskMap(prefix) {
    const risks = this.getRisksByPrefix(prefix);
    const map = {};
    for (const risk of risks) {
      const qId = risk._metadata?.question;
      if (qId) {
        if (!map[qId]) map[qId] = [];
        map[qId].push({
          riskId: risk.riskId,
          name: risk.name,
          severity: risk.characteristics.severityRange
        });
      }
    }
    return map;
  }

  getAssessmentRiskProfile(prefix, answers) {
    const identified = this.getIdentifiedRisks(prefix, answers);
    const total = this.getRisksByPrefix(prefix).length;

    const severityCounts = { Critical: 0, High: 0, Moderate: 0, Low: 0 };
    for (const risk of identified) {
      severityCounts[risk.severity] = (severityCounts[risk.severity] || 0) + 1;
    }

    const totalPenalty = identified.reduce((sum, r) => sum + (r.penalty || 0), 0);

    const config = scoringConfigs[prefix];
    const maxPossible = config ? Object.keys(config.questions).length * 25 : 100;
    const riskDensity = total > 0 ? Math.round((identified.length / total) * 100) : 0;

    return {
      totalRisks: total,
      identifiedRisks: identified.length,
      riskDensity: riskDensity,
      totalPotentialPenalty: totalPenalty,
      severityBreakdown: severityCounts,
      riskCategories: [...new Set(identified.map(r => r.category))],
      primaryRisk: identified.length > 0 ? identified[0] : null,
      criticalCount: severityCounts.Critical || 0,
      highCount: severityCounts.High || 0,
      moderateCount: severityCounts.Moderate || 0,
      riskScore: Math.max(0, Math.min(100, 100 - Math.round((totalPenalty / Math.max(maxPossible, 1)) * 100))),
      risks: identified
    };
  }

  getRecommendationPath(riskIds) {
    if (!riskIds || riskIds.length === 0) return [];
    const recs = urecosRegistry.getDeduplicatedByRisk(riskIds);
    const priorityOrder = { Immediate: 0, High: 1, Medium: 2, Low: 3 };
    recs.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    return recs.slice(0, 5);
  }

  getRecommendation(recId) {
    urecosRegistry.initialize();
    return urecosRegistry.getRecommendation(recId);
  }

  getRecommendationsByPrefix(prefix) {
    urecosRegistry.initialize();
    return urecosRegistry.getRecommendationsByPrefix(prefix);
  }

  getRecommendationsByRisk(riskId) {
    urecosRegistry.initialize();
    return urecosRegistry.getRecommendationsByRisk(riskId);
  }

  getRecommendationsByTrigger(prefix, answers) {
    urecosRegistry.initialize();
    return urecosRegistry.getRecommendationsByTrigger(prefix, answers);
  }

  getAllRecommendations() {
    urecosRegistry.initialize();
    return urecosRegistry.getAllRecommendations();
  }

  getActionPlan(recId) {
    urecosRegistry.initialize();
    const rec = urecosRegistry.getRecommendation(recId);
    if (!rec) return null;
    return {
      recId: rec.recId,
      name: rec.name,
      effort: rec.actionPlan.effort,
      timeline: rec.actionPlan.timeline,
      steps: rec.actionPlan.steps.map(s => s.action),
      successCriteria: rec.successCriteria
    };
  }

  getStructuredRecommendations(prefix, answers) {
    urecosRegistry.initialize();
    return urecosRegistry.getRecommendationsByTrigger(prefix, answers);
  }

  getRiskSummaryForReport(prefix, answers) {
    const profile = this.getAssessmentRiskProfile(prefix, answers);

    if (profile.identifiedRisks === 0) {
      return {
        summary: 'No significant risks identified. Your protection profile shows strong resilience.',
        criticalRisks: [],
        primaryRecommendations: [],
        riskCategories: []
      };
    }

    const criticalRisks = profile.risks.filter(r => r.severity === 'Critical');
    const highRisks = profile.risks.filter(r => r.severity === 'High');
    const topRisks = [...criticalRisks, ...highRisks].slice(0, 3);

    const recs = this.getRecommendationPath(profile.risks.map(r => r.riskId));

    let summary;
    if (criticalRisks.length > 0) {
      summary = `${criticalRisks.length} critical risk${criticalRisks.length > 1 ? 's' : ''} identified requiring immediate attention. ${highRisks.length > 1 ? 'Additional high-priority areas need addressing.' : ''}`;
    } else if (highRisks.length > 0) {
      summary = `${highRisks.length} high-priority risk${highRisks.length > 1 ? 's' : ''} identified. Addressing these will significantly improve your resilience.`;
    } else {
      summary = `${profile.identifiedRisks} moderate risk${profile.identifiedRisks !== 1 ? 's' : ''} identified for improvement.`;
    }

    return {
      summary,
      identifiedCount: profile.identifiedRisks,
      totalPossible: profile.totalRisks,
      riskDensity: profile.riskDensity,
      criticalRisks: criticalRisks.map(r => ({
        riskId: r.riskId, name: r.name, definition: r.definition
      })),
      highRisks: highRisks.map(r => ({
        riskId: r.riskId, name: r.name, definition: r.definition
      })),
      topRisks: topRisks.map(r => ({
        riskId: r.riskId, name: r.name, severity: r.severity, definition: r.definition
      })),
      primaryRecommendations: recs.slice(0, 3),
      riskCategories: profile.riskCategories,
      severityBreakdown: profile.severityBreakdown
    };
  }
}

const deduplicate = (arr, key) => {
  const seen = new Set();
  return arr.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

module.exports = new KnowledgeService();
