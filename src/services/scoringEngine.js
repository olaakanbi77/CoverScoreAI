const fs = require('fs');
const path = require('path');

// Load JSON Question Bank
const qbPath = path.join(__dirname, '..', 'data', 'question_bank.json');
let questionBank = [];
try {
  questionBank = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
} catch(e) {
  console.error("Failed to load question_bank.json", e);
}

const getRiskLevel = (score) => {
  if (score <= 20) return 'Very Low Risk';
  if (score <= 40) return 'Low Risk';
  if (score <= 60) return 'Moderate Risk';
  if (score <= 80) return 'High Risk';
  return 'Critical Risk';
};

const getExposureIndex = (score) => {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Moderate';
  if (score <= 75) return 'High';
  return 'Critical';
};

const calculateScore = async (answers) => {
  let totalScorePoints = 0;
  let totalMaxPoints = 0;
  const risk_categories = {};
  const recommendations = [];
  const identified_gaps = [];
  
  // Group questions by pillar
  const pillars = {};

  // For each answer, find the question in questionBank
  for (const [qId, ans] of Object.entries(answers)) {
    if (qId === 'template_selection') continue;
    
    const q = questionBank.find(x => x.id === qId);
    if (!q) continue;

    const pillar = q.pillar || 'General';
    if (!pillars[pillar]) {
      pillars[pillar] = { riskPoints: 0, maxPoints: 100 };
    }

    // Determine risk value
    let riskPoints = 0;
    if (q.risk_logic) {
      // Find the rule for the answer
      const ansArray = Array.isArray(ans) ? ans : [ans];
      for (const a of ansArray) {
         const rule = q.risk_logic[a];
         if (rule) {
           riskPoints += (rule.exposure_points || 0) + (rule.vulnerability_points || 0) + (rule.impact_points || 0);
         }
      }
    } else {
      // Default fallback logic
      if (typeof ans === 'string' && (ans.toLowerCase() === 'no' || ans.toLowerCase() === 'none' || ans.toLowerCase() === 'none of the above')) {
        riskPoints = 15;
      } else if (typeof ans === 'string' && (ans.toLowerCase() === 'yes')) {
        riskPoints = 0;
      }
    }

    pillars[pillar].riskPoints += riskPoints;
    
    // Recommendation trigger
    if (q.recommendation_trigger) {
      if (q.recommendation_trigger.condition === ans) {
         recommendations.push(q.recommendation_trigger.recommendation);
         identified_gaps.push(q.recommendation_trigger.gap || q.question);
      }
    }
  }

  let finalScore = 50; // default
  let categoryCount = 0;
  let totalCategoryScores = 0;

  for (const [pillarName, pData] of Object.entries(pillars)) {
    const catScore = Math.min(100, Math.max(0, pData.riskPoints));
    risk_categories[pillarName] = catScore;
    totalCategoryScores += catScore;
    categoryCount++;
  }

  if (categoryCount > 0) {
    finalScore = Math.round(totalCategoryScores / categoryCount);
  }

  const resilience_score = Math.max(0, 100 - finalScore);
  const exposure_index = getExposureIndex(finalScore);
  const protection_gap = finalScore;

  // Determine Risk DNA
  let risk_dna = 'Balanced Profile';
  let maxCatScore = -1;
  for (const [catName, score] of Object.entries(risk_categories)) {
    if (score > maxCatScore) {
      maxCatScore = score;
      risk_dna = catName + ' Dominant™';
    }
  }

  let baseValue = 10000000;
  const effectiveRisk = Math.max((finalScore / 100), 0.05);
  const maxLoss = Math.round(baseValue * effectiveRisk);
  const minLoss = Math.round(maxLoss * 0.4);

  return {
    score: Math.min(finalScore, 100),
    resilience_score,
    risk_level: getRiskLevel(finalScore),
    recommendations: [...new Set(recommendations)],
    identified_gaps: [...new Set(identified_gaps)],
    risk_categories,
    min_loss: minLoss,
    max_loss: maxLoss,
    exposure_index,
    protection_gap,
    risk_dna
  };
};

module.exports = {
  calculateScore,
  getRiskLevel
};
