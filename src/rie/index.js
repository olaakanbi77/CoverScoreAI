const { mapProducts } = require('./productMapper');
const { buildQuote } = require('./quoteBuilder');
const { determineFollowUp } = require('./followUpEngine');
const learningEngine = require('./learningEngine');

function scoreOpportunity(scoredPillars, leadData) {
  let score = 0;
  for (const v of Object.values(scoredPillars)) {
    if (v < 40) { score += 30; break; }
  }
  if (leadData.advisorRequested) score += 30;
  if (leadData.businessEntity) score += 15;
  if (leadData.hasRevenue) score += 15;
  if (leadData.hasEmployees) score += 10;
  return Math.min(score, 100);
}

function generateCopilotBrief(prefix, answers, scoredPillars, recommendedProducts) {
  const lowScorePillars = Object.entries(scoredPillars)
    .filter(([, v]) => v < 40)
    .map(([k]) => k);
  const highPriorityProducts = recommendedProducts.filter((p) => p.priority === 'high');
  const summary = lowScorePillars.length > 0
    ? `The client shows elevated risk in ${lowScorePillars.join(', ')}, indicating clear insurance needs.`
    : 'The client has moderate risk exposure across key areas.';
  const sectorHint = prefix === 'TRN' ? 'fleet/transport'
    : prefix === 'HOS' ? 'healthcare'
    : prefix === 'SCH' ? 'education'
    : prefix === 'CON' ? 'construction'
    : prefix === 'MFG' ? 'manufacturing'
    : prefix === 'CHR' ? 'church/charity'
    : prefix === 'SME' ? 'business'
    : 'general';
  const suggestedOpening = `I noticed your ${sectorHint} operation has some risk areas we should discuss — specifically around ${lowScorePillars.slice(0, 2).join(' and ') || 'general liability'}.`;
  return {
    summary,
    keyRisks: lowScorePillars,
    recommendedProducts: highPriorityProducts.map((p) => p.product),
    suggestedOpening,
    likelyObjections: ['Cost of additional premiums', 'Perceived overlaps with existing coverage', 'Timing of policy implementation']
  };
}

function runRiskIntelligence(prefix, answers, scoredPillars, leadData) {
  const { recommendedProducts, allProducts } = mapProducts(prefix, answers, scoredPillars);
  const opportunityScore = scoreOpportunity(scoredPillars, leadData);
  const copilotBrief = generateCopilotBrief(prefix, answers, scoredPillars, recommendedProducts);
  const quote = buildQuote(recommendedProducts, leadData);
  const followUp = determineFollowUp(leadData, { score: leadData.score, advisor_requested: leadData.advisorRequested });

  return {
    opportunityScore,
    recommendedProducts,
    allProducts,
    copilotBrief,
    quote,
    followUp,
    rieMetadata: {
      engineVersion: '1.0',
      scoredAt: new Date().toISOString()
    }
  };
}

module.exports = { runRiskIntelligence, learningEngine };
