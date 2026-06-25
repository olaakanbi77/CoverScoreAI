const { calculateFamilyProtectionResult } = require('./src/services/familyProtectionScoring');

function createTestCase(name, answers) {
  console.log(`\n===========================================`);
  console.log(`TEST CASE: ${name}`);
  console.log(`===========================================`);
  const result = calculateFamilyProtectionResult(answers);
  console.log(`Overall Score: ${result.score.overall} - ${result.score.band}`);
  console.log(`Risk DNA: ${result.risk_dna.map(d => d.name).join(', ') || 'None'}`);
  console.log(`Top Recommendation: ${result.priority_actions[0]?.title || 'None'}`);
  console.log(`Opportunity Priority: ${result.advisor_opportunity.priority}`);
  // console.log(JSON.stringify(result, null, 2));
}

// Test Case 1 — Strong Protection Foundation
// Dependents, adequate life cover, broad health cover, 6+ months emergency fund, 1+ year income continuity
createTestCase("1. Strong Protection Foundation", {
  "PER_FAM_001": { value: 1, raw_input: "2", risk_value: 35 }, // One person dependent
  "PER_FAM_004": { risk_value: 30 }, // Half of expenses
  "PER_INC_001": { risk_value: 20 }, // 1+ year continuity
  "PER_LIF_001": { risk_value: 10 }, // adequate life cover
  "PER_HLT_001": { risk_value: 10 }, // broad health cover
  "PER_HLT_002": { risk_value: 10 }, // broad family health
  "PER_FIN_001": { risk_value: 15 }, // 6+ months emergency fund
  "PER_FAM_003": { value: 1, raw_input: "2", risk_value: 20 }, // pays education
  "PER_EDU_002": { risk_value: 10 } // manageable
});

// Test Case 2 — Income Exposure
// Main income source, less than 3 months continuity, low emergency fund
createTestCase("2. Income Exposure", {
  "PER_FAM_001": { value: 0, raw_input: "1", risk_value: 10 }, // No dependents
  "PER_FAM_004": { risk_value: 90 }, // Main income source
  "PER_INC_001": { risk_value: 80 }, // Less than 3 months
  "PER_LIF_001": { risk_value: 20 },
  "PER_HLT_001": { risk_value: 30 },
  "PER_FIN_001": { risk_value: 70 }, // low emergency fund
});

// Test Case 3 — Family Protection Gap
// Two or more dependents, no life cover
createTestCase("3. Family Protection Gap", {
  "PER_FAM_001": { value: 2, raw_input: "3", risk_value: 60 }, // Two or more dependents
  "PER_FAM_004": { risk_value: 70 },
  "PER_INC_001": { risk_value: 50 },
  "PER_LIF_001": { risk_value: 95 }, // No life cover
  "PER_HLT_001": { risk_value: 40 },
  "PER_HLT_002": { risk_value: 40 },
  "PER_FIN_001": { risk_value: 50 },
});

// Test Case 4 — Health Vulnerability
// No health cover, no emergency fund
createTestCase("4. Health Vulnerability", {
  "PER_FAM_001": { value: 0, raw_input: "1", risk_value: 10 }, // No dependents
  "PER_FAM_004": { risk_value: 40 },
  "PER_INC_001": { risk_value: 40 },
  "PER_LIF_001": { risk_value: 20 },
  "PER_HLT_001": { risk_value: 95 }, // No health cover
  "PER_FIN_001": { risk_value: 95 }, // No emergency fund
});

// Test Case 5 — Education Continuity Risk
// Pays education expenses for two or more people, expenses not manageable after six months without income
createTestCase("5. Education Continuity Risk", {
  "PER_FAM_001": { value: 2, raw_input: "3", risk_value: 60 }, 
  "PER_FAM_004": { risk_value: 50 },
  "PER_INC_001": { risk_value: 50 },
  "PER_LIF_001": { risk_value: 40 },
  "PER_HLT_001": { risk_value: 30 },
  "PER_HLT_002": { risk_value: 30 },
  "PER_FIN_001": { risk_value: 40 },
  "PER_FAM_003": { value: 1, raw_input: "3", risk_value: 60 }, // Two or more people
  "PER_EDU_002": { risk_value: 85 } // Not manageable
});
