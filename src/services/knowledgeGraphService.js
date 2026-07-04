const scoringConfigs = require('../config/scoring');
const riskRegistry = require('../knowledge/riskObjects');
const urecosRegistry = require('../knowledge/recommendations');

class KnowledgeGraph {
  constructor() {
    this.nodes = { question: {}, risk: {}, recommendation: {}, modifier: {}, pillar: {}, category: {}, assessment: {} };
    this.edges = [];
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    riskRegistry.initialize();
    urecosRegistry.initialize();

    for (const [prefix, config] of Object.entries(scoringConfigs)) {
      this._addNode('assessment', prefix, { id: prefix, name: config.name, description: config.name });

      for (const pillar of config.pillars) {
        this._addNode('pillar', pillar.id, { id: pillar.id, name: pillar.name, weight: pillar.weight, prefix });
        this._addEdge(prefix, 'assessment', pillar.id, 'pillar', { type: 'has_pillar' });
      }

      for (const [catId, cat] of Object.entries(config.categories)) {
        this._addNode('category', catId, { id: catId, name: cat.name, pillar: cat.pillar, prefix });
        this._addEdge(catId, 'category', cat.pillar, 'pillar', { type: 'belongs_to' });
        this._addEdge(prefix, 'assessment', catId, 'category', { type: 'has_category' });
      }

      for (const qId of Object.keys(config.questions)) {
        const qConfig = config.questions[qId];
        this._addNode('question', qId, {
          id: qId, prefix, category: qConfig.category,
          text: qConfig.gaps ? Object.values(qConfig.gaps)[0] || '' : '',
          answers: qConfig.scores ? Object.keys(qConfig.scores) : []
        });
        this._addEdge(qId, 'question', qConfig.category, 'category', { type: 'belongs_to' });
        this._addEdge(prefix, 'assessment', qId, 'question', { type: 'has_question' });
      }

      for (const mod of config.modifiers) {
        this._addNode('modifier', mod.id, {
          id: mod.id, name: mod.name, penalty: mod.penalty || 0,
          bonus: mod.bonus || 0, impact: (mod.bonus || 0) - (mod.penalty || 0),
          prefix, description: mod.description,
          conditions: mod.conditions.map(c => ({ question: c[0], answer: c[1] }))
        });
        for (const [qId] of mod.conditions) {
          this._addEdge(mod.id, 'modifier', qId, 'question', { type: 'involves_question' });
        }
      }

      const prefixRisks = riskRegistry.getRiskObjectsByPrefix(prefix);
      for (const risk of prefixRisks) {
        this._addNode('risk', risk.riskId, {
          id: risk.riskId, code: risk.riskCode, name: risk.name,
          severity: risk.characteristics.severityRange, domain: risk.domain,
          category: risk.category, prefix, penalty: risk.scoreRules.maxPenalty
        });
        this._addEdge(prefix, 'assessment', risk.riskId, 'risk', { type: 'has_risk' });

        const qId = risk._metadata?.question;
        if (qId) {
          this._addEdge(risk.riskId, 'risk', qId, 'question', { type: 'detected_by', answers: risk._metadata.triggerAnswers });
          this._addEdge(qId, 'question', risk.riskId, 'risk', { type: 'triggers', answers: risk._metadata.triggerAnswers, penalty: risk.scoreRules.maxPenalty });
        }

        for (const dep of risk.dependencies || []) {
          this._addEdge(risk.riskId, 'risk', dep.modifierId, 'modifier', { type: 'compounded_by', impact: dep.impact });
          this._addEdge(dep.modifierId, 'modifier', risk.riskId, 'risk', { type: 'affects_risk', impact: dep.impact });
        }
      }

      const prefixRecs = urecosRegistry.getRecommendationsByPrefix(prefix);
      for (const rec of prefixRecs) {
        this._addNode('recommendation', rec.recId, {
          id: rec.recId, name: rec.name, priority: rec.priority,
          effort: rec.actionPlan.effort, timeline: rec.actionPlan.timeline,
          scoreGain: rec.expectedScoreGain, prefix,
          steps: rec.actionPlan.steps.map(s => s.action)
        });
        this._addEdge(prefix, 'assessment', rec.recId, 'recommendation', { type: 'has_recommendation' });

        for (const addr of rec.addresses || []) {
          if (addr.riskId) {
            this._addEdge(rec.recId, 'recommendation', addr.riskId, 'risk', { type: 'addresses' });
            this._addEdge(addr.riskId, 'risk', rec.recId, 'recommendation', { type: 'addressed_by' });
          }
        }
      }
    }

    this._initialized = true;
  }

  _addNode(type, id, data) {
    this.nodes[type][id] = { ...this.nodes[type][id], ...data };
  }

  _addEdge(fromId, fromType, toId, toType, data) {
    this.edges.push({ from: { id: fromId, type: fromType }, to: { id: toId, type: toType }, ...data });
  }

  getNode(type, id) {
    this.initialize();
    return this.nodes[type]?.[id] || null;
  }

  getEdges(fromType, fromId, opts = {}) {
    this.initialize();
    let results = this.edges.filter(e => e.from.type === fromType && e.from.id === fromId);
    if (opts.toType) results = results.filter(e => e.to.type === opts.toType);
    if (opts.edgeType) results = results.filter(e => e.type === opts.edgeType);
    return results;
  }

  getInboundEdges(toType, toId, opts = {}) {
    this.initialize();
    let results = this.edges.filter(e => e.to.type === toType && e.to.id === toId);
    if (opts.fromType) results = results.filter(e => e.from.type === opts.fromType);
    if (opts.edgeType) results = results.filter(e => e.type === opts.edgeType);
    return results;
  }

  traverse(fromType, fromId, toType, opts = {}) {
    this.initialize();
    const visited = new Set();
    const queue = [{ type: fromType, id: fromId }];
    const results = [];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.type}:${current.id}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (current.type === toType && current.id !== fromId) {
        results.push({ id: current.id, type: current.type, data: this.nodes[current.type]?.[current.id] || {} });
        if (!opts.deep) continue;
      }

      const edges = this.edges.filter(e => e.from.type === current.type && e.from.id === current.id);
      for (const edge of edges) {
        const nextKey = `${edge.to.type}:${edge.to.id}`;
        if (!visited.has(nextKey)) {
          queue.push({ type: edge.to.type, id: edge.to.id });
        }
      }
    }

    return results;
  }

  findPath(fromType, fromId, toType) {
    this.initialize();
    const visited = new Set();
    const queue = [{ type: fromType, id: fromId, path: [{ type: fromType, id: fromId }] }];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.type}:${current.id}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (current.type === toType) return current.path;

      const edges = this.edges.filter(e => e.from.type === current.type && e.from.id === current.id);
      for (const edge of edges) {
        const nextKey = `${edge.to.type}:${edge.to.id}`;
        if (!visited.has(nextKey)) {
          queue.push({
            type: edge.to.type, id: edge.to.id,
            path: [...current.path, { type: edge.to.type, id: edge.to.id, edge: edge.type }]
          });
        }
      }
    }

    return null;
  }

  getQuestionGraph(questionId) {
    this.initialize();
    const node = this.getNode('question', questionId);
    if (!node) return null;
    const riskEdges = this.getEdges('question', questionId, { toType: 'risk' });
    const risks = riskEdges.map(e => this.getNode('risk', e.to.id)).filter(Boolean);
    const recEdges = risks.flatMap(r => this.getEdges('risk', r.id, { toType: 'recommendation' }));
    const recs = recEdges.map(e => this.getNode('recommendation', e.to.id)).filter(Boolean);
    const modEdges = risks.flatMap(r => this.getEdges('risk', r.id, { toType: 'modifier' }));
    const mods = modEdges.map(e => this.getNode('modifier', e.to.id)).filter(Boolean);
    const cat = this.getEdges('question', questionId, { toType: 'category' }).map(e => this.getNode('category', e.to.id))[0] || null;
    const pillar = cat ? this.getEdges('category', cat.id, { toType: 'pillar' }).map(e => this.getNode('pillar', e.to.id))[0] || null : null;
    return {
      question: { id: questionId, ...node },
      category: cat,
      pillar,
      risks: risks.map(r => ({ id: r.id, name: r.name, severity: r.severity, penalty: r.penalty })),
      recommendations: [...new Map(recs.map(r => [r.id, { id: r.id, name: r.name, priority: r.priority, effort: r.effort }])).values()],
      modifiers: mods.map(m => ({ id: m.id, name: m.name, impact: m.impact }))
    };
  }

  getRiskGraph(riskId) {
    this.initialize();
    const node = this.getNode('risk', riskId);
    if (!node) return null;
    const qEdges = this.getEdges('risk', riskId, { toType: 'question' });
    const questions = qEdges.map(e => ({ id: e.to.id, answers: e.answers || [] }));
    const recEdges = this.getEdges('risk', riskId, { toType: 'recommendation' });
    const recs = recEdges.map(e => this.getNode('recommendation', e.to.id)).filter(Boolean);
    const modEdges = this.getEdges('risk', riskId, { toType: 'modifier' });
    const mods = modEdges.map(e => this.getNode('modifier', e.to.id)).filter(Boolean);
    const assessment = this.getInboundEdges('risk', riskId, { fromType: 'assessment' }).map(e => e.from.id);
    return {
      risk: { id: riskId, name: node.name, severity: node.severity, domain: node.domain, penalty: node.penalty },
      assessmentType: assessment[0] || null,
      triggerQuestions: questions,
      recommendations: recs.map(r => ({ id: r.id, name: r.name, priority: r.priority, effort: r.effort, steps: r.steps })),
      modifiers: mods.map(m => ({ id: m.id, name: m.name, impact: m.impact })),
      pathToRecommendation: this.findPath('risk', riskId, 'recommendation')
    };
  }

  getAssessmentGraph(prefix) {
    this.initialize();
    const assessment = this.getNode('assessment', prefix);
    if (!assessment) return null;
    const pillars = this.getEdges('assessment', prefix, { toType: 'pillar' }).map(e => this.getNode('pillar', e.to.id)).filter(Boolean);
    const categories = this.getEdges('assessment', prefix, { toType: 'category' }).map(e => this.getNode('category', e.to.id)).filter(Boolean);
    const questions = this.getEdges('assessment', prefix, { toType: 'question' }).map(e => this.getNode('question', e.to.id)).filter(Boolean);
    const risks = this.getEdges('assessment', prefix, { toType: 'risk' }).map(e => this.getNode('risk', e.to.id)).filter(Boolean);
    const recs = this.getEdges('assessment', prefix, { toType: 'recommendation' }).map(e => this.getNode('recommendation', e.to.id)).filter(Boolean);
    return {
      assessment: { id: prefix, name: assessment.name },
      pillars: pillars.map(p => ({ id: p.id, name: p.name, weight: p.weight })),
      categories: categories.map(c => ({ id: c.id, name: c.name, pillar: c.pillar })),
      questions: questions.map(q => ({ id: q.id, category: q.category })),
      risks: risks.map(r => ({ id: r.id, name: r.name, severity: r.severity, domain: r.domain })),
      recommendations: recs.map(r => ({ id: r.id, name: r.name, priority: r.priority, effort: r.effort, scoreGain: r.scoreGain }))
    };
  }

  getDomainGraph(domain) {
    this.initialize();
    const risks = Object.values(this.nodes.risk).filter(n => n.domain === domain);
    const identifiers = {};
    for (const risk of risks) {
      identifiers[risk.prefix] = true;
      const qEdges = this.getEdges('risk', risk.id, { toType: 'question' });
      for (const e of qEdges) {
        const qNode = this.getNode('question', e.to.id);
        if (qNode && qNode.prefix) identifiers[qNode.prefix] = true;
      }
    }
    return {
      domain,
      uniqueAssessments: Object.keys(identifiers),
      riskCount: risks.length,
      risks: risks.map(r => ({
        id: r.id, name: r.name, severity: r.severity,
        recs: this.getEdges('risk', r.id, { toType: 'recommendation' }).length,
        modifiers: this.getEdges('risk', r.id, { toType: 'modifier' }).length
      }))
    };
  }

  getStatistics() {
    this.initialize();
    return {
      nodes: Object.fromEntries(Object.entries(this.nodes).map(([k, v]) => [k, Object.keys(v).length])),
      edges: this.edges.length,
      edgeTypes: [...new Set(this.edges.map(e => e.type))],
      assessments: Object.values(this.nodes.assessment).map(n => ({ id: n.id, name: n.name, pillars: this.traverse('assessment', n.id, 'pillar').length, risks: this.traverse('assessment', n.id, 'risk').length, recs: this.traverse('assessment', n.id, 'recommendation').length })),
      totalRisksBySeverity: Object.values(this.nodes.risk).reduce((acc, r) => { acc[r.severity] = (acc[r.severity] || 0) + 1; return acc; }, {}),
      totalRisksByDomain: Object.values(this.nodes.risk).reduce((acc, r) => { acc[r.domain] = (acc[r.domain] || 0) + 1; return acc; }, {})
    };
  }
}

const ruleEngine = {
  init() { graph.initialize(); },

  evaluate(prefix, answers) {
    graph.initialize();
    const recommendations = urecosRegistry.getRecommendationsByTrigger(prefix, answers);
    const config = scoringConfigs[prefix];
    if (!config) return { recommendations, modifiers: [], immediateActions: [], advisorEscalations: [] };

    const modifiers = config.modifiers.filter(mod => {
      return mod.conditions.every(([qId, expected]) => {
        const ans = answers[qId];
        if (ans === null || ans === undefined) return false;
        if (Array.isArray(expected)) return expected.includes(ans);
        return ans === expected;
      });
    }).map(mod => ({
      id: mod.id, name: mod.name, impact: (mod.bonus || 0) - (mod.penalty || 0),
      penalty: mod.penalty || 0, bonus: mod.bonus || 0,
      severity: ((mod.penalty || 0) - (mod.bonus || 0)) >= 10 ? 'Critical' : ((mod.penalty || 0) - (mod.bonus || 0)) >= 5 ? 'High' : 'Moderate'
    }));

    const identifiedRisks = riskRegistry.getIdentifiedRisks(prefix, answers);
    const advisorEscalations = identifiedRisks
      .filter(r => r.severity === 'Critical')
      .map(r => ({ riskId: r.riskId, riskName: r.name, reason: 'Critical severity detected', action: 'Escalate to senior advisor' }));

    const immediateActions = [...recommendations.filter(r => r.priority === 'Immediate' || r.priority === 'High'),
      ...modifiers.filter(m => m.severity === 'Critical').map(m => ({
        recId: null, name: m.name, priority: 'Immediate', type: 'risk_mitigation'
      }))
    ];

    return { recommendations, modifiers, immediateActions, advisorEscalations };
  },

  getTriggeredRules(prefix, answers) {
    const result = this.evaluate(prefix, answers);
    const rules = [];
    for (const rec of result.recommendations) {
      rules.push({
        rule: `IF answer=${rec.triggerRules[0]?.answer} ON ${rec.triggerRules[0]?.question} THEN recommend ${rec.recId}`,
        trigger: { type: 'answer_match', question: rec.triggerRules[0]?.question, answer: rec.triggerRules[0]?.answer },
        action: { type: 'recommend', recId: rec.recId, name: rec.shortDescription, priority: rec.priority }
      });
    }
    for (const mod of result.modifiers) {
      rules.push({
        rule: `IF modifier=${mod.id} THEN apply ${mod.impact > 0 ? 'bonus' : 'penalty'} of ${Math.abs(mod.impact)} points`,
        trigger: { type: 'modifier_match', modifierId: mod.id },
        action: { type: 'modify_score', impact: mod.impact, description: mod.name }
      });
    }
    for (const esc of result.advisorEscalations) {
      rules.push({
        rule: `IF risk=${esc.riskId} IS Critical THEN escalate to advisor`,
        trigger: { type: 'severity_threshold', riskId: esc.riskId, threshold: 'Critical' },
        action: { type: 'escalate', to: 'advisor', reason: esc.reason }
      });
    }
    return rules;
  }
};

const graph = new KnowledgeGraph();
module.exports = { graph, ruleEngine };
