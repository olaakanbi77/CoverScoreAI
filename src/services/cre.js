/**
 * CoverScore Recommendation Engine™ (CRE)
 * Combines PME, IRL, and Assessment Data to generate prioritized recommendations
 */

const { getRiskByCategory } = require('./pme');
const { getIndustryProfile } = require('./irl');

// Predefined rules that map triggers to specific risks
const creRules = [
  // ---------------------------------------------------------
  // PERSONAL RULES
  // ---------------------------------------------------------
  {
    id: 'rule_p1',
    type: 'personal',
    evaluate: (data) => {
      // Dependents > 3 + Life Cover = None
      const depMap = { '1_2': 2, '3_5': 4, 'over_5': 6 };
      const dependentsCount = data.answers?.dependents ? depMap[data.answers.dependents] : 0;
      return dependentsCount >= 3 && data.answers?.has_life_insurance === 'no';
    },
    risk_category: 'Life Risk',
    severity: 'High',
    recommendation: 'Life Protection Strategy',
    advisor_prompt: 'If your income stopped tomorrow, how would your family manage financially?'
  },
  {
    id: 'rule_p2',
    type: 'personal',
    evaluate: (data) => {
      // Savings < 1 month + Dependents > 0
      return data.answers?.savings_buffer === 'less_1m' && data.answers?.has_dependents === 'yes';
    },
    risk_category: 'Life Risk',
    severity: 'Critical',
    recommendation: 'Immediate Income Protection',
    advisor_prompt: 'With less than 1 month of savings, a sudden disruption to your income would be catastrophic. What is your contingency plan?'
  },
  {
    id: 'rule_p3',
    type: 'personal',
    evaluate: (data) => {
      // Owns vehicle + Not insured or third party only
      return data.answers?.owns_vehicle === 'yes' && ['none', 'third_party'].includes(data.answers?.vehicle_insurance);
    },
    risk_category: 'Vehicle Risk',
    severity: 'Medium',
    recommendation: 'Comprehensive Motor Protection',
    advisor_prompt: 'If your vehicle is written off tomorrow, do you have the liquidity to replace it immediately?'
  },

  // ---------------------------------------------------------
  // BUSINESS RULES
  // ---------------------------------------------------------
  {
    id: 'rule_b1',
    type: 'business',
    evaluate: (data) => {
      // Employees > 10 (or 6_20+)
      const empBrackets = ['6_20', '21_50', '51_100', 'over_100'];
      return empBrackets.includes(data.answers?.business?.employee_bracket);
    },
    risk_category: 'Employee Welfare Risk',
    severity: 'High',
    recommendation: 'Group Life & ECA Compliance',
    advisor_prompt: 'What provisions currently exist for employees\' families in the event of death in service? Are you compliant with the Pension Reform Act?'
  },
  {
    id: 'rule_b2',
    type: 'business',
    evaluate: (data) => {
      // Has physical location + No protection or high impact of fire
      return data.answers?.business?.has_location === 'yes';
    },
    risk_category: 'Property Fire Risk',
    severity: 'Critical',
    recommendation: 'Comprehensive Fire & Special Perils',
    advisor_prompt: 'If a fire destroyed your primary facility tonight, how long could you survive without revenue?'
  },
  {
    id: 'rule_b3',
    type: 'business',
    evaluate: (data) => {
      // Public visitors = yes
      return data.answers?.business?.public_visitors === 'yes';
    },
    risk_category: 'Public Liability Risk',
    severity: 'High',
    recommendation: 'Public & Occupiers Liability',
    advisor_prompt: 'If a customer or visitor is severely injured on your premises, how would you fund the legal and compensation costs?'
  }
];

/**
 * Generate Intelligence using CRE
 * @param {Object} assessmentData 
 * @returns {Object} { topRisks, recommendations, advisorTalkingPoints }
 */
const generateRecommendations = (assessmentData) => {
  const { answers, score, entityType = 'business' } = assessmentData;
  const isBusiness = entityType === 'business';
  
  const activeRules = creRules.filter(r => r.type === (isBusiness ? 'business' : 'personal'));
  
  let triggeredResults = [];

  // 1. Evaluate CRE Rules
  activeRules.forEach(rule => {
    if (rule.evaluate(assessmentData)) {
      const pmeData = getRiskByCategory(rule.risk_category);
      
      // Calculate impact/likelihood score for sorting (simplified)
      const severityScore = rule.severity === 'Critical' ? 3 : (rule.severity === 'High' ? 2 : 1);
      
      triggeredResults.push({
        risk_category: rule.risk_category,
        severity: rule.severity,
        recommendation: rule.recommendation,
        advisor_prompt: rule.advisor_prompt,
        priorityScore: severityScore, // In full CRE: Severity x Impact x Likelihood x Gap
        pme_context: pmeData
      });
    }
  });

  // Sort by priority score
  triggeredResults.sort((a, b) => b.priorityScore - a.priorityScore);

  // 2. Add Industry Context if Business
  let industryData = null;
  if (isBusiness && answers?.business?.industry) {
    industryData = getIndustryProfile(answers.business.industry);
  }

  // 3. Format Output
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
  generateRecommendations,
  creRules
};
