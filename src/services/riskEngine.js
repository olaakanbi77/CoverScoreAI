/**
 * CoverScore Risk Intelligence Engine™ (RIE)
 * Calculates scores based on the collected assessment_data from the CFE.
 */

const calculateRiskScore = (data) => {
  // Extract running totals from the CFE
  const scores = data.riskScores || { exposure: 0, vulnerability: 0, impact: 0 };
  
  // Base normalization (assuming maxes of 100 for each, capped)
  const exposure = Math.min(Math.max(scores.exposure, 10), 100);
  const vulnerability = Math.min(Math.max(scores.vulnerability, 10), 100);
  const impact = Math.min(Math.max(scores.impact, 10), 100);

  // User Formula: Exposure * Vulnerability * Impact / 10000 (To get 50.4 from 80*70*90)
  let riskScore = (exposure * vulnerability * impact) / 10000;
  riskScore = Math.min(Math.round(riskScore * 10) / 10, 100); // Max 100, 1 decimal place

  let riskLevel = 'Low';
  if (riskScore > 20) riskLevel = 'Moderate';
  if (riskScore > 40) riskLevel = 'Elevated';
  if (riskScore > 60) riskLevel = 'High';
  if (riskScore > 80) riskLevel = 'Critical';

  return {
    score: Math.round(riskScore),
    level: riskLevel,
    exposure,
    vulnerability,
    impact
  };
};

const calculateResilienceScore = (data) => {
  // Placeholder resilience calculation using the 5 pillars
  // Real implementation would pull 'preparedness_points' etc from CFE data
  const preparedness = 60; // Mock derived score
  const protection = 50; 
  const continuity = 40;
  const compliance = 70;
  const financial = 80;

  const resilienceScore = Math.round(
    (preparedness * 0.25) +
    (protection * 0.25) +
    (continuity * 0.20) +
    (compliance * 0.15) +
    (financial * 0.15)
  );

  let resilienceLevel = 'Fragile';
  if (resilienceScore > 20) resilienceLevel = 'Vulnerable';
  if (resilienceScore > 40) resilienceLevel = 'Developing';
  if (resilienceScore > 60) resilienceLevel = 'Resilient';
  if (resilienceScore > 80) resilienceLevel = 'Highly Resilient';

  return {
    score: resilienceScore,
    level: resilienceLevel
  };
};

const generateAIReport = (riskResult, resilienceResult, data) => {
  return `
CoverScore Risk Intelligence Report
-----------------------------------
Entity: ${data.name || 'Unknown'}
Risk Score: ${riskResult.score}/100 (${riskResult.level})
Resilience Score: ${resilienceResult.score}/100 (${resilienceResult.level})

Recommendations:
${(data.recommendations || []).map(r => '- ' + r).join('\n') || '- Further assessment needed to generate specific recommendations.'}
  `.trim();
};

const processAssessment = (assessmentData) => {
  const risk = calculateRiskScore(assessmentData);
  const resilience = calculateResilienceScore(assessmentData);
  const report = generateAIReport(risk, resilience, assessmentData);

  return {
    risk_score: risk.score,
    risk_level: risk.level,
    resilience_score: resilience.score,
    resilience_level: resilience.level,
    recommendations: assessmentData.recommendations || [],
    ai_report: report
  };
};

module.exports = {
  processAssessment,
  calculateRiskScore,
  calculateResilienceScore
};
