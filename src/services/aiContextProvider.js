const riskRegistry = require('../knowledge/riskObjects');
const urecosRegistry = require('../knowledge/recommendations');
const { graph: knowledgeGraph, ruleEngine } = require('./knowledgeGraphService');
const scoringConfigs = require('../config/scoring');

class AIContextProvider {
  initialize() {
    riskRegistry.initialize();
    urecosRegistry.initialize();
    knowledgeGraph.initialize();
  }

  buildAssessmentContext(prefix, answers, scoreResult) {
    this.initialize();
    const config = scoringConfigs[prefix];
    const identifiedRisks = riskRegistry.getIdentifiedRisks(prefix, answers);
    const ruleResult = ruleEngine.evaluate(prefix, answers);
    const riskProfile = scoreResult?.risk_profile || null;

    const blocks = {
      assessment: { type: prefix, name: config?.name || prefix, score: scoreResult?.score, level: scoreResult?.risk_level },
      risks: identifiedRisks.map(r => ({
        riskId: r.riskId, name: r.name, severity: r.severity, domain: r.domain,
        category: r.category, penalty: r.penalty, definition: r.definition,
        triggerQuestion: r.triggerQuestion, triggerAnswer: r.triggerAnswer
      })),
      severitySummary: riskProfile ? {
        critical: riskProfile.criticalCount, high: riskProfile.highCount,
        moderate: riskProfile.moderateCount, total: riskProfile.identifiedRisks,
        density: riskProfile.riskDensity + '%'
      } : null,
      criticalRisks: identifiedRisks.filter(r => r.severity === 'Critical').map(r => r.name),
      highRisks: identifiedRisks.filter(r => r.severity === 'High').map(r => r.name),
      recommendations: ruleResult.recommendations.map(r => ({
        recId: r.recId, name: r.name, priority: r.priority,
        effort: r.actionPlan.effort, timeline: r.actionPlan.timeline,
        steps: r.actionPlan.steps.map(s => s.action),
        successCriteria: r.successCriteria
      })),
      activeModifiers: ruleResult.modifiers.map(m => ({
        name: m.name, impact: m.impact, type: m.impact > 0 ? 'bonus' : 'penalty'
      })),
      advisorEscalations: ruleResult.advisorEscalations,
      strengths: scoreResult?.risk_categories ? Object.entries(scoreResult.risk_categories)
        .filter(([, v]) => v >= 70).map(([k]) => k) : [],
      weaknesses: scoreResult?.risk_categories ? Object.entries(scoreResult.risk_categories)
        .filter(([, v]) => v < 40).map(([k]) => k) : []
    };

    return this._addDerivedContext(blocks);
  }

  _addDerivedContext(blocks) {
    const r = blocks;
    r.riskNarrative = this._buildRiskNarrative(r.risks, r.strengths, r.weaknesses);
    r.recommendationNarrative = this._buildRecNarrative(r.recommendations);
    r.advisorBriefing = this._buildAdvisorBriefing(r.risks, r.recommendations, r.activeModifiers, r.advisorEscalations);
    r.impactSummary = this._buildImpactSummary(r.risks);
    r.domainBreakdown = this._buildDomainBreakdown(r.risks);
    return r;
  }

  _buildRiskNarrative(risks, strengths, weaknesses) {
    const critical = risks.filter(r => r.severity === 'Critical');
    const high = risks.filter(r => r.severity === 'High');
    const parts = [];
    if (critical.length) parts.push(`${critical.length} critical risk${critical.length > 1 ? 's' : ''} identified requiring immediate attention: ${critical.map(r => r.name).join(', ')}.`);
    if (high.length) parts.push(`${high.length} high-priority risk${high.length > 1 ? 's' : ''} also identified: ${high.map(r => r.name).join(', ')}.`);
    if (!critical.length && !high.length && risks.length) parts.push(`${risks.length} moderate risk${risks.length > 1 ? 's' : ''} identified for improvement.`);
    if (strengths.length) parts.push(`Areas of resilience: ${strengths.join(', ')}.`);
    if (weaknesses.length) parts.push(`Areas needing attention: ${weaknesses.join(', ')}.`);
    return parts.join(' ');
  }

  _buildRecNarrative(recs) {
    return recs.slice(0, 5).map(r => ({
      recId: r.recId, name: r.name, priority: r.priority,
      effort: r.effort, timeline: r.timeline,
      overview: `${r.name} (${r.priority} priority, ${r.effort} effort, ${r.timeline}).`,
      successCriteria: r.successCriteria,
      steps: r.steps
    }));
  }

  _buildAdvisorBriefing(risks, recs, modifiers, escalations) {
    return {
      criticalCount: risks.filter(r => r.severity === 'Critical').length,
      primaryRisks: risks.filter(r => r.severity === 'Critical' || r.severity === 'High').slice(0, 3).map(r => r.name),
      topRecommendations: recs.slice(0, 3).map(r => r.name),
      interactionModifiers: modifiers.filter(m => m.type === 'penalty').map(m => `${m.name}: ${m.impact} point penalty`),
      escalationRequired: escalations.length > 0,
      escalationReasons: escalations.map(e => e.reason)
    };
  }

  _buildImpactSummary(risks) {
    const domains = {};
    for (const r of risks) {
      if (!domains[r.domain]) domains[r.domain] = { domain: r.domain, count: 0, severities: {} };
      domains[r.domain].count++;
      domains[r.domain].severities[r.severity] = (domains[r.domain].severities[r.severity] || 0) + 1;
    }
    return Object.values(domains).map(d => ({
      domain: d.domain,
      riskCount: d.count,
      hasCritical: (d.severities.Critical || 0) > 0,
      summary: `${d.domain}: ${d.count} risk${d.count > 1 ? 's' : ''}${d.severities.Critical ? ' including ' + d.severities.Critical + ' critical' : ''}`
    }));
  }

  _buildDomainBreakdown(risks) {
    const breakdown = {};
    for (const r of risks) {
      breakdown[r.domain] = (breakdown[r.domain] || 0) + 1;
    }
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([domain, count]) => ({ domain, count }));
  }

  getSystemPrompt(prefix) {
    this.initialize();
    const config = scoringConfigs[prefix];
    return {
      role: 'CoverScore Risk Intelligence AI — a professional resilience advisory platform.',
      expertise: `Expert in ${config?.name || prefix} risk assessment and insurance gap analysis.`,
      rules: [
        'Never sound like a salesperson — focus on resilience and risk mitigation.',
        'Explain consequences of being unprotected in clear terms.',
        'Prioritize recommendations by severity (Critical > High > Moderate > Low).',
        'Use the risk objects, recommendations, and action plans provided in context.',
        'Where applicable, reference specific risk IDs and recommendation IDs.',
        'Use Nigerian Naira (₦) for financial figures where relevant.',
        'Keep explanations concise and actionable.'
      ],
      knowledgeDomains: [
        'Property Risk', 'Liability Risk', 'Business Continuity',
        'Financial Resilience', 'Health Protection', 'Income Protection'
      ],
      outputFormat: 'Structured JSON with risk analysis, prioritized recommendations, and action plan.'
    };
  }

  getRiskContextBlock(riskId) {
    this.initialize();
    const risk = riskRegistry.getRiskObject(riskId);
    if (!risk) return null;
    const graph = knowledgeGraph.getRiskGraph(riskId);
    return {
      risk: { id: risk.riskId, name: risk.name, severity: risk.characteristics.severityRange, domain: risk.domain },
      definition: risk.definition,
      whatThisMeans: risk.definition.customer,
      whyItMatters: risk.definition.official,
      impact: risk.aiContext?.definition || risk.definition.official,
      relatedQuestions: risk.questionReferences.map(q => ({ id: q.questionId, purpose: q.purpose })),
      compoundingModifiers: risk.dependencies.map(d => ({ name: d.name, impact: d.impact })),
      triggerAnswers: risk._metadata?.triggerAnswers || [],
      penaltyIfUnaddressed: risk.scoreRules.maxPenalty,
      recommendations: risk.recommendations.map(r => ({
        id: r.recommendationCode, name: r.name, priority: r.priority,
        expectedGain: r.expectedScoreGain
      })),
      graphConnections: graph ? {
        recommendations: graph.recommendations.map(r => r.name),
        modifiers: graph.modifiers.map(m => m.name)
      } : null
    };
  }

  getRecommendationContextBlock(recId) {
    this.initialize();
    const rec = urecosRegistry.getRecommendation(recId);
    if (!rec) return null;
    return {
      recommendation: { id: rec.recId, name: rec.name, priority: rec.priority },
      description: rec.shortDescription,
      fullDescription: rec.fullDescription,
      effort: rec.actionPlan.effort,
      timeline: rec.actionPlan.timeline,
      actionSteps: rec.actionPlan.steps.map(s => `Step ${s.step}: ${s.action}`),
      successCriteria: rec.successCriteria,
      scoreGain: rec.expectedScoreGain,
      addressesRisks: rec.addresses.map(a => a.riskId),
      assessmentType: rec.assessmentType,
      aiContext: rec.aiContext
    };
  }

  buildRiskExplanation(riskId, answerGiven) {
    this.initialize();
    const risk = riskRegistry.getRiskObject(riskId);
    if (!risk) return null;
    const graph = knowledgeGraph.getRiskGraph(riskId);
    return {
      summary: `${risk.name} — ${risk.characteristics.severityRange} severity`,
      whatThisMeans: risk.definition.customer,
      whyItMatters: risk.definition.official,
      technicalDetail: risk.definition.technical,
      yourResponse: answerGiven || 'Not provided',
      impactStatement: `This affects ${risk.characteristics.impactAreas?.join(', ') || 'financial'} areas.`,
      penaltyImpact: `This risk can reduce your resilience score by up to ${risk.scoreRules.maxPenalty} points if unaddressed.`,
      whatToDoNow: risk.recommendations.length > 0 ? risk.recommendations[0].description : 'Consult an advisor.',
      compoundingFactors: graph?.modifiers?.map(m => `${m.name} (${m.impact > 0 ? '+' : ''}${m.impact} points)`) || [],
      actionPlan: risk.recommendations.slice(0, 3).map(r => ({ priority: r.priority, action: r.description, gain: r.expectedScoreGain }))
    };
  }

  buildReportContext(prefix, answers, scoreResult) {
    const ctx = this.buildAssessmentContext(prefix, answers, scoreResult);
    return {
      systemPrompt: this.getSystemPrompt(prefix),
      assessmentData: ctx.assessment,
      executiveSummary: ctx.riskNarrative,
      criticalRisks: ctx.criticalRisks,
      highRisks: ctx.highRisks,
      riskBreakdown: ctx.domainBreakdown,
      impactSummary: ctx.impactSummary,
      riskDetails: ctx.risks.map(r => this.buildRiskExplanation(r.riskId, r.triggerAnswer)),
      recommendations: ctx.recommendationNarrative.map(r => ({
        recId: r.recId, name: r.name, priority: r.priority,
        overview: r.overview, steps: r.steps,
        successCriteria: r.successCriteria
      })),
      activeModifiers: ctx.activeModifiers,
      advisorBriefing: ctx.advisorBriefing
    };
  }

  generateLocalReport(prefix, answers, scoreResult) {
    const ctx = this.buildAssessmentContext(prefix, answers, scoreResult);
    const config = scoringConfigs[prefix];
    const critical = ctx.risks.filter(r => r.severity === 'Critical');
    const high = ctx.risks.filter(r => r.severity === 'High');

    const sections = {
      title: `${config?.name || prefix} Risk Assessment Report`,
      score: { value: scoreResult?.score, level: scoreResult?.risk_level, protectionGap: 100 - (scoreResult?.score || 50) + '%' },
      executiveSummary: ctx.riskNarrative,
      riskRegister: critical.concat(high).slice(0, 5).map(r => ({
        name: r.name, severity: r.severity, domain: r.domain,
        definition: r.definition, penalty: r.penalty,
        assessmentResponse: r.triggerAnswer
      })),
      allRisks: ctx.risks.map(r => ({
        name: r.name, severity: r.severity, domain: r.domain,
        category: r.category, penalty: r.penalty
      })),
      prioritizedRecommendations: ctx.recommendationNarrative.map(r => ({
        recId: r.recId, name: r.name, priority: r.priority,
        effort: r.effort, timeline: r.timeline,
        steps: r.steps
      })),
      activePenalties: ctx.activeModifiers.filter(m => m.type === 'penalty').map(m => ({
        name: m.name, impact: m.impact,
        description: `${m.name}: ${Math.abs(m.impact)} point penalty applied`
      })),
      strengthsDetected: ctx.strengths,
      improvementActions: ctx.weaknesses.map(w => `Review and strengthen ${w}`),
      domainBreakdown: ctx.domainBreakdown,
      generatedAt: new Date().toISOString()
    };
    return sections;
  }
}

module.exports = new AIContextProvider();
