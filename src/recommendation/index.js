const { detectGaps } = require('./riskGapDetector');
const { detectNeeds, buildStrategies } = require('./protectionStrategyEngine');
const { mapStrategiesToProducts } = require('./productKnowledgeBase');
const { buildRecommendations } = require('./engine');
const { generateExplanation, generateCopilotBrief } = require('./explainEngine');
const { determineFollowUp } = require('../rie/followUpEngine');

function assessProtectionNeeds(assessmentType, scoredPillars, answers, leadData) {
  const detectedGaps = detectGaps(assessmentType, scoredPillars, answers);
  const detectedNeeds = detectNeeds(detectedGaps, assessmentType);
  const strategies = buildStrategies(detectedNeeds);
  const productRecs = mapStrategiesToProducts(detectedNeeds, detectedGaps, assessmentType, answers);
  const recommendations = buildRecommendations(detectedGaps, detectedNeeds, productRecs, assessmentType);

  const enrichedRecs = recommendations.allProducts.map(rec => ({
    ...rec,
    explanation: generateExplanation(rec, detectedGaps, assessmentType, answers),
  }));

  const copilotBrief = generateCopilotBrief(detectedGaps, detectedNeeds, enrichedRecs, recommendations.categories);
  const followUp = determineFollowUp(leadData, { score: leadData.score || 50, advisor_requested: leadData.advisorRequested });

  return {
    // New layered output
    gaps: detectedGaps,
    needs: detectedNeeds,
    strategies,
    productRecommendations: enrichedRecs,
    categories: recommendations.categories,
    crossSell: recommendations.crossSell,
    opportunityScore: recommendations.opportunityScore,

    // Backwards-compatible fields for existing consumers
    recommendedProducts: enrichedRecs.map(r => ({
      product: r.productName,
      code: r.productCode,
      priority: r.priority,
      reason: r.explanation,
      confidence: r.confidence,
      category: r.category,
      pillarScore: r.severity === 'critical' ? 20 : r.severity === 'high' ? 30 : 50,
    })),
    allProducts: enrichedRecs.map(r => ({ product: r.productName, code: r.productCode })),

    copilotBrief,
    followUp,
    rieMetadata: {
      engineVersion: '2.0',
      scoredAt: new Date().toISOString(),
      architecture: 'gap_detector → strategy_engine → product_kb → recommendation_engine → explanation_engine',
    },
  };
}

module.exports = { assessProtectionNeeds };
