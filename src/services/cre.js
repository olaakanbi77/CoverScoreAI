/**
 * CoverScore Recommendation Engine™ (CRE) v1
 * Combines dynamically evaluated rules and Category Scores to generate prioritized recommendations
 */

const { getRiskByCategory } = require('./pme');
const { getIndustryProfile } = require('./irl');

/**
 * Generate Intelligence using CRE
 * @param {Object} assessmentData 
 * @returns {Object} { topRisks, recommendations, advisorTalkingPoints, industryData }
 */
const generateRecommendations = (assessmentData) => {
  const { answers, score, entityType = 'business', risk_categories, identified_gaps, recommendations: dynamicRecs } = assessmentData;
  const isBusiness = entityType === 'business';
  
  let triggeredResults = [];

  // 1. Process Dynamic Triggers from Scoring Engine
  if (dynamicRecs && Array.isArray(dynamicRecs)) {
    dynamicRecs.forEach((rec, index) => {
      // In a full implementation, we'd query `recommendation_rules` DB. For MVP, we map strings.
      triggeredResults.push({
        risk_category: 'Triggered Risk',
        severity: 'High',
        recommendation: rec,
        advisor_prompt: identified_gaps[index] ? `Regarding: ${identified_gaps[index]}` : 'Let\'s discuss your protection options.',
        priorityScore: 2
      });
    });
  }

  // 2. Evaluate Category Risks (Dynamic replacement for hardcoded CRE Rules)
  if (risk_categories) {
    for (const [category, categoryScore] of Object.entries(risk_categories)) {
      if (categoryScore >= 50) {
        triggeredResults.push({
          risk_category: category,
          severity: categoryScore >= 80 ? 'Critical' : 'High',
          recommendation: `Review ${category} Protection Strategy`,
          advisor_prompt: `Your ${category} profile indicates a high exposure level. What controls are currently in place?`,
          priorityScore: categoryScore >= 80 ? 3 : 2
        });
      }
    }
  }

  // Sort by priority score
  triggeredResults.sort((a, b) => b.priorityScore - a.priorityScore);

  // 3. Add Industry Context if Business
  let industryData = null;
  if (isBusiness && answers?.business?.industry) {
    industryData = getIndustryProfile(answers.business.industry);
  }

  // 4. Format Output
  const topRisks = triggeredResults.map(tr => tr.risk_category);
  const recommendations = triggeredResults.map(tr => ({
    risk: tr.risk_category,
    severity: tr.severity,
    action: tr.recommendation
  }));
  const advisorTalkingPoints = triggeredResults.map(tr => tr.advisor_prompt);

  // Add Industry Specifics
  if (industryData) {
    industryData.top_risks.forEach(r => {
      if (!topRisks.includes(r)) topRisks.push(`Industry Specific: ${r}`);
    });
    industryData.advisor_questions.forEach(q => {
      advisorTalkingPoints.push(q);
    });
    // Add industry products to recommendations
    industryData.products.forEach(p => {
      if (!recommendations.find(rec => rec.action.includes(p))) {
         recommendations.push({
           risk: 'Industry Standard',
           severity: 'Medium',
           action: p
         });
      }
    });
  }

  return {
    topRisks: [...new Set(topRisks)].slice(0, 5), // Top 5
    recommendations,
    advisorTalkingPoints: [...new Set(advisorTalkingPoints)],
    industryData
  };
};

module.exports = {
  generateRecommendations
};
