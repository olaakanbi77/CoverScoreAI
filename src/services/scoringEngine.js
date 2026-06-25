const { all } = require('../config/database');

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
  const templateId = answers?.template_selection?.template_id;
  if (!templateId) {
    // Fallback if somehow old data or missing template
    return {
      score: 50,
      resilience_score: 50,
      risk_level: 'Moderate Risk',
      recommendations: [],
      identified_gaps: [],
      risk_categories: {},
      min_loss: 0,
      max_loss: 0,
      exposure_index: 'Moderate',
      protection_gap: 50,
      risk_dna: 'Unknown'
    };
  }

  // Fetch all questions for this template
  const questions = await all('SELECT * FROM assessment_questions WHERE template_id = ?', [templateId]);
  
  let totalCategoryScores = 0;
  let categoryCount = 0;
  const risk_categories = {};
  const recommendations = [];
  const identified_gaps = [];
  
  // Group questions by category
  const categories = {};
  questions.forEach(q => {
    if (!categories[q.category]) {
      categories[q.category] = {
        totalWeightedRisk: 0,
        totalWeight: 0,
        questions: []
      };
    }
    categories[q.category].questions.push(q);
  });

  // Calculate scores per category based on answers
  for (const [categoryName, categoryData] of Object.entries(categories)) {
    // The frontend sends answers grouped by the sanitized category id
    const categoryId = categoryName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const categoryAnswers = answers[categoryId] || {};

    for (const q of categoryData.questions) {
      const answerVal = categoryAnswers[q.id];
      if (answerVal) {
        let riskValue = 0;
        try {
          const rules = JSON.parse(q.risk_impact_rules);
          if (rules[answerVal] !== undefined) {
            riskValue = rules[answerVal];
          }
        } catch(e) {
          console.error('Invalid risk_impact_rules JSON for question', q.id);
        }
        
        categoryData.totalWeightedRisk += (riskValue * q.weight);
        categoryData.totalWeight += q.weight;

        // Check recommendation trigger
        if (q.recommendation_trigger === answerVal) {
          recommendations.push(q.academy_trigger || q.category);
          identified_gaps.push(q.question_text);
        }
      }
    }

    if (categoryData.totalWeight > 0) {
      const catScore = Math.round(categoryData.totalWeightedRisk / categoryData.totalWeight);
      risk_categories[categoryName] = catScore;
      totalCategoryScores += catScore;
      categoryCount++;
    } else {
      risk_categories[categoryName] = 0;
    }
  }

  const finalScore = categoryCount > 0 ? Math.round(totalCategoryScores / categoryCount) : 50;
  const resilience_score = Math.max(0, 100 - finalScore);
  const exposure_index = getExposureIndex(finalScore);
  const protection_gap = finalScore; // Simplified for MVP: Protection gap equals risk score.

  // Determine Risk DNA (the highest risk category)
  let risk_dna = 'Balanced Profile';
  let maxCatScore = -1;
  for (const [catName, score] of Object.entries(risk_categories)) {
    if (score > maxCatScore) {
      maxCatScore = score;
      risk_dna = catName + ' Dominant™';
    }
  }

  // Simplified Loss Estimates
  let baseValue = 10000000; // Base 10m
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
