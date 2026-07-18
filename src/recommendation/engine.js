function categorize(productRecs) {
  const immediate = [];
  const stronglyRecommended = [];
  const considerNext = [];

  for (const rec of productRecs) {
    if (rec.confidence >= 90 || rec.category === 'Immediate Priority') {
      immediate.push(rec);
    } else if (rec.confidence >= 75 || rec.category === 'Strongly Recommended') {
      stronglyRecommended.push(rec);
    } else {
      considerNext.push(rec);
    }
  }

  return { immediate, stronglyRecommended, considerNext };
}

function deduplicate(productRecs) {
  const seen = new Set();
  return productRecs.filter(rec => {
    const key = rec.productCode;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateCrossSell(assessmentType, gaps, needs) {
  const crossSell = [];

  const crossSellRules = [
    { fromType: ['family', 'FAM'], toType: 'entrepreneur', toLabel: 'Entrepreneur Score™', toDesc: 'You indicated business involvement. Let us assess your business risks too.', triggerCondition: 'self_employed' },
    { fromType: ['family', 'FAM'], toType: 'health', toLabel: 'Health Protection Score™', toDesc: 'Protect your familys health with a dedicated health assessment.', triggerCondition: 'dependents' },
    { fromType: ['young_professional', 'YPR'], toType: 'retirement', toLabel: 'Retirement Readiness Score™', toDesc: 'Start planning your retirement early for maximum benefit.', triggerCondition: 'age_over_30' },
    { fromType: ['health', 'HLT'], toType: 'family', toLabel: 'Family Protection Score™', toDesc: 'Now that your health is covered, protect your family too.', triggerCondition: 'has_dependents' },
    { fromType: ['income', 'INC'], toType: 'family', toLabel: 'Family Protection Score™', toDesc: 'Protect the people who depend on your income.', triggerCondition: 'has_dependents' },
    { fromType: ['sme', 'SME'], toType: 'family', toLabel: 'Family Protection Score™', toDesc: 'As a business owner, your personal financial resilience is equally important. Assess your family protection.', triggerCondition: 'personal_exposure' },
    { fromType: ['manufacturing', 'MFG'], toType: 'sme', toLabel: 'SME Risk Score™', toDesc: 'Review your overall business risk posture.', triggerCondition: 'general_review' },
    { fromType: ['hospital', 'HOS'], toType: 'sme', toLabel: 'SME Risk Score™', toDesc: 'Consider a broader business risk assessment.', triggerCondition: 'general_review' },
    { fromType: ['church', 'CHR'], toType: 'sme', toLabel: 'SME Risk Score™', toDesc: 'Evaluate your organization overall risk posture.', triggerCondition: 'general_review' },
    { fromType: ['school', 'SCH'], toType: 'sme', toLabel: 'SME Risk Score™', toDesc: 'A broader business risk assessment can identify additional needs.', triggerCondition: 'general_review' },
  ];

  for (const rule of crossSellRules) {
    if (rule.fromType.some(t => t.toLowerCase() === assessmentType.toLowerCase())) {
      crossSell.push({
        assessmentType: rule.toType,
        label: rule.toLabel,
        description: rule.toDesc,
      });
    }
  }

  return crossSell;
}

function computeOpportunityScore(gaps, needs) {
  let score = 0;
  const criticalCount = gaps.filter(g => g.severity === 'critical').length;
  const highCount = gaps.filter(g => g.severity === 'high').length;

  score += criticalCount * 25;
  score += highCount * 15;
  score += needs.length * 5;
  score = Math.min(score, 100);

  return score;
}

function buildRecommendations(detectedGaps, detectedNeeds, productRecs, assessmentType) {
  const dedupedRecs = deduplicate(productRecs);
  const categories = categorize(dedupedRecs);
  const opportunityScore = computeOpportunityScore(detectedGaps, detectedNeeds);
  const crossSell = generateCrossSell(assessmentType, detectedGaps, detectedNeeds);

  return {
    opportunityScore,
    categories,
    allProducts: dedupedRecs,
    crossSell,
    gapCount: detectedGaps.length,
    needCount: detectedNeeds.length,
  };
}

module.exports = { categorize, deduplicate, generateCrossSell, computeOpportunityScore, buildRecommendations };
