class LearningEngine {
  constructor() {
    this.outcomes = [];
  }

  recordOutcome(outcome) {
    this.outcomes.push({ ...outcome, timestamp: new Date().toISOString() });
  }

  getConversionRate(prefix) {
    const filtered = this.outcomes.filter(o => o.prefix === prefix);
    if (filtered.length === 0) return 0;
    const converted = filtered.filter(o => o.conversion);
    return converted.length / filtered.length;
  }

  getTopProducts(prefix, limit = 5) {
    const filtered = this.outcomes.filter(o => o.prefix === prefix);
    const productCounts = {};

    for (const outcome of filtered) {
      for (const product of outcome.products_purchased) {
        productCounts[product] = (productCounts[product] || 0) + 1;
      }
    }

    return Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([product, count]) => ({ product, count }));
  }

  getBestAdvisors(limit = 5) {
    const advisorMap = {};

    for (const outcome of this.outcomes) {
      if (!outcome.advisor_contacted) continue;
      const key = outcome.advisor || 'unknown';
      if (!advisorMap[key]) {
        advisorMap[key] = { total: 0, converted: 0 };
      }
      advisorMap[key].total++;
      if (outcome.conversion) {
        advisorMap[key].converted++;
      }
    }

    return Object.entries(advisorMap)
      .map(([advisor, data]) => ({
        advisor,
        conversionRate: data.total > 0 ? data.converted / data.total : 0,
        totalLeads: data.total,
        conversions: data.converted
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit);
  }

  getOptimalFollowUpTime(prefix) {
    const filtered = this.outcomes.filter(o => o.prefix === prefix && o.conversion);
    if (filtered.length === 0) return null;

    const totalTime = filtered.reduce((sum, o) => {
      const assessmentTime = new Date(o.assessmentDate || o.timestamp).getTime();
      const conversionTime = new Date(o.conversionDate || o.timestamp).getTime();
      return sum + (conversionTime - assessmentTime);
    }, 0);

    const avgMs = totalTime / filtered.length;
    const avgHours = avgMs / (1000 * 60 * 60);
    return Math.round(avgHours);
  }
}

module.exports = new LearningEngine();
