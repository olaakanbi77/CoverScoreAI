const scoringConfigs = require('../../config/scoring');
const riskRegistry = require('../riskObjects');

const ACTION_PLAN_TEMPLATES = {
  insurance: [
    'Assess current coverage and identify gaps.',
    'Research available insurance providers and compare plans.',
    'Request quotes and evaluate options based on coverage and cost.',
    'Select and apply for the most suitable policy.',
    'Review policy documents and confirm coverage details.'
  ],
  savings: [
    'Set a savings target based on your needs.',
    'Open a dedicated savings account.',
    'Set up automatic monthly transfers to the savings account.',
    'Review progress quarterly and adjust contributions.'
  ],
  review: [
    'Gather relevant documents and current policy information.',
    'Schedule a review with a qualified advisor.',
    'Compare current coverage against identified needs.',
    'Implement recommended changes.'
  ],
  plan: [
    'Assess current situation and identify gaps.',
    'Define objectives and timeline.',
    'Develop a written plan with specific action items.',
    'Implement the plan with professional guidance.',
    'Review and update the plan periodically.'
  ],
  continuity: [
    'Identify critical business functions and dependencies.',
    'Document key processes and develop standard operating procedures.',
    'Identify and train backup personnel for each critical role.',
    'Create a written business continuity plan.',
    'Test the plan and update based on lessons learned.'
  ],
  default: [
    'Assess your current situation and identify what needs to change.',
    'Research available options and professional guidance.',
    'Create a specific action plan with measurable milestones.',
    'Implement changes with support from qualified professionals.',
    'Review progress and adjust approach as needed.'
  ]
};

const getEffort = (rec) => {
  if (rec.includes('insurance') || rec.includes('cover') || rec.includes('policy')) return 'Medium';
  if (rec.includes('fund') || rec.includes('savings') || rec.includes('saving')) return 'Low';
  if (rec.includes('review') || rec.includes('assess') || rec.includes('schedule')) return 'Low';
  if (rec.includes('plan') || rec.includes('create') || rec.includes('develop') || rec.includes('build')) return 'High';
  if (rec.includes('separate') || rec.includes('restructure')) return 'High';
  return 'Medium';
};

const getTimeline = (effort) => {
  if (effort === 'Low') return '1-2 weeks';
  if (effort === 'Medium') return '2-6 weeks';
  return '1-3 months';
};

const getActionPlanTemplate = (rec) => {
  const lower = rec.toLowerCase();
  if (lower.includes('insurance') || lower.includes('cover') || lower.includes('hmo') || lower.includes('policy')) return 'insurance';
  if (lower.includes('fund') || lower.includes('savings') || lower.includes('saving') || lower.includes('account')) return 'savings';
  if (lower.includes('review') || lower.includes('assess') || lower.includes('schedule')) return 'review';
  if (lower.includes('plan') || lower.includes('create') || lower.includes('develop') || lower.includes('build') || lower.includes('business continuity')) return lower.includes('business') || lower.includes('continuity') ? 'continuity' : 'plan';
  if (lower.includes('separate') || lower.includes('restructure')) return 'plan';
  return 'default';
};

const getSuccessCriteria = (rec, scoreGain) => {
  const lower = rec.toLowerCase();
  if (lower.includes('insurance') || lower.includes('cover') || lower.includes('hmo') || lower.includes('policy')) return { metric: 'Insurance coverage obtained', targetScore: 100, scoreGain, measurement: 'Active policy in place within 30 days' };
  if (lower.includes('fund') || lower.includes('savings')) return { metric: 'Emergency fund established', targetScore: 100, scoreGain, measurement: 'Savings account with target balance' };
  if (lower.includes('review') || lower.includes('schedule') || lower.includes('check')) return { metric: 'Review completed', targetScore: 80, scoreGain, measurement: 'Professional review session completed' };
  if (lower.includes('plan') || lower.includes('create') || lower.includes('develop')) return { metric: 'Plan documented and implemented', targetScore: 90, scoreGain, measurement: 'Written plan with actionable steps' };
  return { metric: 'Action completed', targetScore: 85, scoreGain, measurement: 'Measurable improvement within 60 days' };
};

const getRecommendationCategory = (rec) => {
  const lower = rec.toLowerCase();
  if (lower.includes('insurance') || lower.includes('cover') || lower.includes('policy') || lower.includes('hmo')) return 'Insurance';
  if (lower.includes('fund') || lower.includes('savings') || lower.includes('saving') || lower.includes('account')) return 'Financial Planning';
  if (lower.includes('plan') || lower.includes('continuity') || lower.includes('develop') || lower.includes('create')) return 'Business Planning';
  if (lower.includes('review') || lower.includes('assess') || lower.includes('schedule') || lower.includes('check')) return 'Assessment';
  if (lower.includes('separate') || lower.includes('restructure') || lower.includes('structure')) return 'Legal Structure';
  if (lower.includes('liability') || lower.includes('injury') || lower.includes('safety')) return 'Risk Management';
  return 'General Advisory';
};

const getDomainForRec = (prefix) => {
  const cfg = scoringConfigs[prefix];
  if (!cfg) return 'General';
  const p = cfg.pillars[0];
  if (!p) return 'General';
  const name = p.name.toLowerCase();
  if (name.includes('health') || name.includes('medical')) return 'Health';
  if (name.includes('financial') || name.includes('income') || name.includes('debt') || name.includes('savings')) return 'Financial';
  if (name.includes('home') || name.includes('property') || name.includes('motor') || name.includes('vehicle')) return 'Property';
  if (name.includes('business') || name.includes('operation') || name.includes('workforce') || name.includes('fleet')) return 'Business';
  if (name.includes('legal') || name.includes('liability')) return 'Legal';
  if (name.includes('personal') || name.includes('family') || name.includes('lifestyle')) return 'Personal';
  return 'General';
};

class URecOSRegistry {
  constructor() {
    this._byId = new Map();
    this._byPrefix = new Map();
    this._byRisk = new Map();
    this._byText = new Map();
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    riskRegistry.initialize();

    let sequence = 0;
    for (const [prefix, config] of Object.entries(scoringConfigs)) {
      const prefixRecs = [];
      const prefixRisks = riskRegistry.getRiskObjectsByPrefix(prefix);

      for (const [qId, qConfig] of Object.entries(config.questions)) {
        if (!qConfig.recommendations) continue;

        for (const [answer, recText] of Object.entries(qConfig.recommendations)) {
          sequence++;
          const risk = prefixRisks.find(r =>
            r._metadata.question === qId && r._metadata.triggerAnswers.includes(answer)
          );
          const riskId = risk ? risk.riskId : null;

          const recId = `REC-${prefix}-${String(sequence).padStart(3, '0')}`;
          const effort = getEffort(recText);
          const scoreGain = risk ? Math.min(Math.round(risk.scoreRules.maxPenalty / 2), 15) : 8;
          const recObj = {
            recId,
            recCode: recId,
            version: '1.0',
            status: 'Active',
            name: recText.length > 60 ? recText.substring(0, 57) + '...' : recText,
            shortDescription: recText,
            fullDescription: recText,
            assessmentType: prefix,
            classification: {
              domain: getDomainForRec(prefix),
              category: getRecommendationCategory(recText),
              type: risk ? 'Risk Mitigation' : 'General Advisory',
              subCategory: ''
            },
            addresses: riskId ? [{ riskId, version: '1.0' }] : [],
            triggerRules: [{
              riskId,
              question: qId,
              answer,
              assessmentType: prefix,
              condition: { type: 'answer', equals: answer },
              priority: risk ? (risk.characteristics.severityRange === 'Critical' ? 'Immediate' : risk.characteristics.severityRange === 'High' ? 'High' : 'Medium') : 'Medium'
            }],
            actionPlan: {
              effort,
              timeline: getTimeline(effort),
              steps: ACTION_PLAN_TEMPLATES[getActionPlanTemplate(recText)].map((stepAction, i) => ({
                step: i + 1,
                action: stepAction,
                duration: i === 0 ? '1 day' : effort === 'Low' ? '2-3 days' : '1 week',
                assignedTo: 'Policyholder'
              }))
            },
            successCriteria: getSuccessCriteria(recText, scoreGain),
            priority: risk ? (risk.characteristics.severityRange === 'Critical' ? 'Immediate' : risk.characteristics.severityRange === 'High' ? 'High' : 'Medium') : 'Medium',
            expectedScoreGain: scoreGain,
            productLinks: [],
            risks: [],
            advisor: {
              conversationObjective: `Recommend the customer to: ${recText}`,
              discoveryQuestions: ['Would you like help implementing this recommendation?'],
              commonObjections: ['Cost concerns', 'Not a priority right now', 'Need to research more'],
              suggestedResponses: ['I understand cost is a concern. Let me show you some affordable options.', 'Addressing this now prevents much larger costs later.']
            },
            aiContext: {
              recommendationText: recText,
              whyThisHelps: recText,
              relatedRisks: riskId ? [{ riskId, name: risk.name }] : [],
              approvedTerminology: [recText]
            },
            reportContent: {
              executiveSummary: recText,
              actionSteps: ACTION_PLAN_TEMPLATES[getActionPlanTemplate(recText)].map((s, i) => `Step ${i + 1}: ${s}`),
              expectedImpact: `Implementing this recommendation can improve your resilience score by up to ${scoreGain} points.`
            },
            governance: {
              author: 'CoverScore Knowledge Engine',
              version: '1.0',
              effectiveDate: new Date().toISOString().split('T')[0],
              status: 'Published',
              lastReviewDate: new Date().toISOString().split('T')[0],
              nextReviewDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
            },
            _metadata: {
              prefix,
              question: qId,
              answer,
              riskId,
              text: recText
            }
          };

          this._byId.set(recId, recObj);
          if (!this._byText.has(recText)) this._byText.set(recText, []);
          this._byText.get(recText).push(recObj);
          prefixRecs.push(recObj);
          if (riskId) {
            if (!this._byRisk.has(riskId)) this._byRisk.set(riskId, []);
            this._byRisk.get(riskId).push(recObj);
          }
        }
      }
      this._byPrefix.set(prefix, prefixRecs);
    }

    this._initialized = true;
  }

  getRecommendation(recId) {
    this.initialize();
    return this._byId.get(recId) || null;
  }

  getRecommendationsByPrefix(prefix) {
    this.initialize();
    return this._byPrefix.get(prefix) || [];
  }

  getRecommendationsByRisk(riskId) {
    this.initialize();
    return this._byRisk.get(riskId) || [];
  }

  getRecommendationsByRiskIds(riskIds) {
    this.initialize();
    const seen = new Set();
    const result = [];
    for (const riskId of riskIds) {
      const recs = this.getRecommendationsByRisk(riskId);
      for (const rec of recs) {
        if (!seen.has(rec.recId)) {
          seen.add(rec.recId);
          result.push(rec);
        }
      }
    }
    return result;
  }

  getRecommendationsByTrigger(prefix, answers) {
    this.initialize();
    const recs = this.getRecommendationsByPrefix(prefix);
    const triggered = [];
    for (const rec of recs) {
      const trigger = rec.triggerRules[0];
      if (trigger && answers[trigger.question] === trigger.answer) {
        triggered.push(rec);
      }
    }
    return triggered;
  }

  getAllRecommendations() {
    this.initialize();
    return Array.from(this._byId.values());
  }

  getRecommendationCount() {
    this.initialize();
    return this._byId.size;
  }

  getDeduplicatedByRisk(riskIds) {
    const recs = this.getRecommendationsByRiskIds(riskIds);
    const byText = new Map();
    for (const rec of recs) {
      const key = rec.shortDescription.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!byText.has(key) || rec.priority === 'Immediate') {
        byText.set(key, rec);
      }
    }
    const priorityOrder = { Immediate: 0, High: 1, Medium: 2, Low: 3 };
    return Array.from(byText.values()).sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
  }
}

module.exports = new URecOSRegistry();
