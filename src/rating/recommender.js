const RIE_TO_RATING_CODE = {
  'Fire & Special Perils': 'FIRE',
  'Fire & Burglary': 'FIRE',
  'Public Liability': 'PL',
  'Comprehensive Motor': 'MOTOR',
  'Group Personal Accident': 'GPA',
  'Fidelity Guarantee': 'FG',
  'Employers Liability': 'EMPLOYERS_LIABILITY',
  'Goods in Transit': 'GOODS_IN_TRANSIT',
  'Business Interruption': 'BI',
  'Machinery Breakdown': 'MB',
  'Medical Malpractice / Professional Indemnity': 'MED_MALPRACTICE',
  'Contractors All Risk': 'CAR',
};

async function recommendProducts(lead, assessmentData, ratingProducts, prefix) {
  const assessments = [];

  // Check for new architecture productRecommendations first
  if (assessmentData && assessmentData.productRecommendations && Array.isArray(assessmentData.productRecommendations)) {
    assessments.push(...assessmentData.productRecommendations.map(r => ({
      code: r.productCode,
      name: r.productName,
      confidence: r.confidence,
      priority: r.priority,
      reason: r.explanation || r.reason,
      category: r.category,
    })));
  }

  // Fallback: check legacy recommendedProducts
  if (assessments.length === 0 && assessmentData && assessmentData.recommendedProducts) {
    for (const rec of assessmentData.recommendedProducts) {
      const code = rec.code || RIE_TO_RATING_CODE[rec.product];
      if (!code) continue;

      assessments.push({
        code,
        name: rec.product || rec.productName,
        confidence: rec.confidence || 50,
        priority: rec.priority || 'medium',
        reason: rec.reason || rec.explanation || '',
        category: rec.category || 'Recommended',
      });
    }
  }

  // Final fallback: use old productMapper directly
  if (assessments.length === 0) {
    const { mapProducts } = require('../rie/productMapper');
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
    const personalPrefixes = ['FAM', 'HLT', 'INC', 'ENT', 'YPR', 'RET', 'HOM', 'MOT'];
    if (!prefix) prefix = 'SME';
    const rieResult = mapProducts(prefix, null, scoredPillars);

    for (const rec of rieResult.recommendedProducts) {
      const code = RIE_TO_RATING_CODE[rec.product];
      if (!code) continue;

      assessments.push({
        code,
        name: rec.product,
        confidence: rec.priority === 'high' ? 85 : rec.priority === 'medium' ? 65 : 45,
        priority: rec.priority,
        reason: rec.reason || '',
        category: rec.priority === 'high' ? 'Immediate Priority' : 'Recommended',
      });
    }
  }

  const ratingMap = {};
  for (const p of ratingProducts) {
    ratingMap[p.code] = p;
  }

  const recommended = [];
  const seenCodes = new Set();

  for (const rec of assessments) {
    if (seenCodes.has(rec.code)) continue;
    seenCodes.add(rec.code);

    const ratingProduct = ratingMap[rec.code];
    if (!ratingProduct) continue;

    recommended.push({
      code: rec.code,
      name: ratingProduct.name || rec.name,
      description: ratingProduct.description || '',
      icon: ratingProduct.icon || 'g',
      inputSchema: typeof ratingProduct.input_schema === 'string'
        ? JSON.parse(ratingProduct.input_schema) : (ratingProduct.input_schema || {}),
      priority: rec.priority,
      confidence: rec.confidence,
      category: rec.category,
      reason: rec.reason,
      pillarScore: rec.pillarScore || null,
    });
  }

  return recommended;
}

module.exports = { recommendProducts };
