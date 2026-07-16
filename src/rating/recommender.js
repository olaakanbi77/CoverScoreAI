const { mapProducts } = require('../rie/productMapper');

const RIE_TO_RATING_CODE = {
  'Fire & Special Perils': 'FIRE',
  'Fire & Burglary': 'FIRE',
  'Public Liability': 'PL',
  'Comprehensive Motor': 'MOTOR',
  'Group Personal Accident': 'GPA',
  'Fidelity Guarantee': 'FG',
};

async function recommendProducts(lead, assessmentData, ratingProducts, prefix) {
  const scoredPillars = {};
  if (assessmentData && assessmentData.ai_report) {
    try {
      const aiData = typeof assessmentData.ai_report === 'string'
        ? JSON.parse(assessmentData.ai_report)
        : assessmentData.ai_report;
      if (aiData.risk_categories) Object.assign(scoredPillars, aiData.risk_categories);
      if (aiData.pillar_scores) Object.assign(scoredPillars, aiData.pillar_scores);
    } catch (e) {}
  }

  const rieResult = mapProducts(prefix || 'SME', null, scoredPillars);
  const ratingMap = {};
  for (const p of ratingProducts) {
    ratingMap[p.name] = p;
    ratingMap[p.code] = p;
  }

  const recommended = [];
  const seenCodes = new Set();

  for (const rec of rieResult.recommendedProducts) {
    const code = RIE_TO_RATING_CODE[rec.product];
    if (!code) continue;
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);

    const ratingProduct = ratingMap[code];
    if (!ratingProduct) continue;

    const pillarKey = rec.risk.toLowerCase();
    const pillarScore = Object.entries(scoredPillars).find(([k]) => k.toLowerCase() === pillarKey);
    const scoreVal = pillarScore ? Number(pillarScore[1]) : null;

    recommended.push({
      code,
      name: ratingProduct.name,
      description: ratingProduct.description,
      icon: ratingProduct.icon || 'g',
      inputSchema: typeof ratingProduct.input_schema === 'string'
        ? JSON.parse(ratingProduct.input_schema) : (ratingProduct.input_schema || {}),
      priority: rec.priority,
      reason: rec.reason,
      pillarScore: scoreVal,
    });
  }

  return recommended;
}

module.exports = { recommendProducts };