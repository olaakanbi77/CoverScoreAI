const { assessProtectionNeeds } = require('../recommendation/index');
const { buildQuote } = require('./quoteBuilder');
const { determineFollowUp } = require('./followUpEngine');
const learningEngine = require('./learningEngine');

const PREFIX_TO_ASSESSMENT_TYPE = {
  FAM: 'family', HLT: 'health', INC: 'income', YPR: 'young_professional',
  ENT: 'entrepreneur', RET: 'retirement', HOM: 'home', MOT: 'motor',
  SME: 'sme', SCH: 'school', HOS: 'hospital', MFG: 'manufacturing',
  CHR: 'church', CON: 'construction', TRN: 'transport',
};

function runRiskIntelligence(prefix, answers, scoredPillars, leadData) {
  const assessmentType = PREFIX_TO_ASSESSMENT_TYPE[prefix] || 'sme';

  // Use the new layered recommendation architecture
  const result = assessProtectionNeeds(assessmentType, scoredPillars || {}, answers || {}, {
    score: leadData.score,
    advisorRequested: leadData.advisorRequested || false,
    businessEntity: leadData.businessEntity || false,
    hasRevenue: leadData.hasRevenue || false,
    hasEmployees: leadData.hasEmployees || false,
  });

  // Build quote for backwards compatibility
  const productNames = result.recommendedProducts.map(r => r.product);
  const quote = buildQuote(productNames, leadData);

  return {
    // New layered output
    gaps: result.gaps,
    needs: result.needs,
    strategies: result.strategies,
    productRecommendations: result.productRecommendations,
    categories: result.categories,
    crossSell: result.crossSell,

    // Backwards-compatible fields
    opportunityScore: result.opportunityScore,
    recommendedProducts: result.recommendedProducts,
    allProducts: result.allProducts,
    copilotBrief: result.copilotBrief,
    quote,
    followUp: result.followUp,

    rieMetadata: result.rieMetadata,
  };
}

module.exports = { runRiskIntelligence, learningEngine };
