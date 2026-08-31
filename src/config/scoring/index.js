const scoringConfigs = {
  HLT: {
    name: 'Health Protection',
    pillars: [
      { id: 'healthcare_access', name: 'Healthcare Access', weight: 0.25 },
      { id: 'preventive_health', name: 'Preventive Health', weight: 0.20 },
      { id: 'medical_risk_profile', name: 'Medical Risk Profile', weight: 0.20 },
      { id: 'financial_health_protection', name: 'Financial Health Protection', weight: 0.20 },
      { id: 'household_resilience', name: 'Household Resilience', weight: 0.15 }
    ],
    categories: {
      insurance_coverage: { name: 'Insurance Coverage', pillar: 'healthcare_access' },
      checkup_frequency: { name: 'Check-up Frequency', pillar: 'preventive_health' },
      diagnosed_conditions: { name: 'Diagnosed Conditions', pillar: 'medical_risk_profile' },
      age_factor: { name: 'Age Factor', pillar: 'medical_risk_profile' },
      emergency_fund: { name: 'Emergency Fund', pillar: 'financial_health_protection' },
      surgery_coverage: { name: 'Surgery Coverage', pillar: 'financial_health_protection' },
      illness_resilience: { name: 'Illness Resilience', pillar: 'financial_health_protection' },
      employment_stability: { name: 'Employment Stability', pillar: 'household_resilience' },
      dependant_burden: { name: 'Dependant Burden', pillar: 'household_resilience' }
    },
    questions: {
      HLT_008: {
        category: 'employment_stability',
        weight: 2,
        scores: { 'Employed full-time': 100, 'Self-employed': 60, 'Part-time / Freelance': 40, 'Student': 30, 'Retired': 70 },
        gaps: { 'Student': 'No steady income stream creates vulnerability during health emergencies.', 'Part-time / Freelance': 'Variable income makes it harder to absorb unexpected medical costs.' },
        recommendations: { 'Student': 'Build a basic emergency fund and explore health insurance options.', 'Part-time / Freelance': 'Consider a health plan that provides consistent coverage regardless of income fluctuations.' }
      },
      HLT_009: {
        category: 'age_factor',
        weight: 3,
        scores: { '18 - 25': 100, '26 - 35': 80, '36 - 45': 60, '46 - 55': 40, '56+': 20 },
        gaps: { '56+': 'Your age increases the risk profile for health-related complications.', '46 - 55': 'Age-related health risks are increasing and may need specialized coverage.' },
        recommendations: { '56+': 'Review your health coverage with a focus on age-related care needs.', '46 - 55': 'Consider comprehensive health coverage that addresses age-related risks.' }
      },
      HLT_010: {
        category: 'dependant_burden',
        weight: 3,
        scores: { 'None': 100, '1': 80, '2': 60, '3': 40, '4+': 20 },
        gaps: { '3': 'Multiple dependants amplify household vulnerability to health-related income shocks.', '4+': 'A large number of dependants creates significant household exposure to health emergencies.' },
        recommendations: { '3': 'Ensure your health and income protection coverage accounts for all dependants.', '4+': 'Review family health insurance and income protection to cover all dependants.' }
      },
      HLT_012: {
        category: 'insurance_coverage',
        weight: 5,
        scores: { 'Private Health Insurance': 100, 'Employer HMO': 60, 'Government Health Scheme': 50, 'None': 0 },
        gaps: { 'None': 'You do not have active health insurance coverage.' },
        recommendations: { 'None': 'Compare health plans that provide wider hospital coverage.' }
      },
      HLT_013: {
        category: 'emergency_fund',
        weight: 5,
        scores: { 'Savings': 100, 'Insurance': 80, 'Family/Friends': 40, 'Loan': 25, "I don't know": 0 },
        gaps: { 'Loan': 'You rely on loans or borrowing for emergency medical expenses.', "I don't know": 'You have no plan for emergency medical expenses.' },
        recommendations: { 'Loan': 'Build a medical emergency fund.', "I don't know": 'Create a plan for medical emergencies.' }
      },
      HLT_014: {
        category: 'diagnosed_conditions',
        weight: 3,
        scores: { 'None': 100, 'Asthma': 50, 'Hypertension': 35, 'Diabetes': 25 },
        gaps: { 'Hypertension': 'You have a chronic condition that requires specialized coverage.', 'Diabetes': 'Diabetes requires consistent care that may not be fully covered.', 'Asthma': 'Asthma management needs regular medical attention.' },
        recommendations: { 'Hypertension': 'Review your HMO benefits to ensure chronic care is covered.', 'Diabetes': 'Ensure your health plan covers diabetes management.', 'Asthma': 'Confirm your insurance covers respiratory care.' }
      },
      HLT_015: {
        category: 'checkup_frequency',
        weight: 2,
        scores: { 'Every 6 months': 100, 'Annually': 80, 'Rarely/Only when sick': 20 },
        gaps: { 'Rarely/Only when sick': 'You are missing out on early detection through routine check-ups.' },
        recommendations: { 'Rarely/Only when sick': 'Schedule an annual preventive health screening.' }
      },
      HLT_016: {
        category: 'surgery_coverage',
        weight: 5,
        scores: { 'Yes': 100, 'Not sure': 40, 'No': 0 },
        gaps: { 'No': 'Your current cover is inadequate for major surgical procedures.' },
        recommendations: { 'No': 'Consider Critical Illness Insurance if appropriate for your circumstances.' }
      },
      HLT_017: {
        category: 'illness_resilience',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Your household is highly vulnerable to loss of income due to illness.' },
        recommendations: { 'No': 'Explore income protection options.' }
      }
    },
    modifiers: [
      {
        id: 'no_insurance_no_emergency_fund',
        name: 'No Health Insurance + No Emergency Fund',
        conditions: [['HLT_012', 'None'], ['HLT_013', ["I don't know", 'Loan']]],
        penalty: 10,
        description: 'No health insurance and no emergency savings for medical needs'
      },
      {
        id: 'chronic_condition_no_coverage',
        name: 'Chronic Condition + Inadequate Surgery Cover',
        conditions: [['HLT_014', ['Hypertension', 'Diabetes']], ['HLT_016', ['No', 'Not sure']]],
        penalty: 8,
        description: 'Chronic condition without confidence in treatment coverage'
      },
      {
        id: 'rare_checkups_no_insurance',
        name: 'Rare Check-ups + No Insurance',
        conditions: [['HLT_015', 'Rarely/Only when sick'], ['HLT_012', 'None']],
        penalty: 7,
        description: 'Infrequent check-ups combined with no insurance increases late-detection risk'
      },
      {
        id: 'precarious_employment_no_protection',
        name: 'Unstable Employment + No Income Protection',
        conditions: [['HLT_008', ['Student', 'Part-time / Freelance']], ['HLT_017', 'No']],
        penalty: 8,
        description: 'Unstable income combined with no illness resilience creates high vulnerability'
      },
      {
        id: 'no_income_protection',
        name: 'No Income Protection During Illness',
        conditions: [['HLT_017', 'No']],
        penalty: 5,
        description: 'No financial resilience during extended illness'
      },
      {
        id: 'positive_health_engagement',
        name: 'Health Insurance + Regular Check-ups',
        conditions: [['HLT_012', ['Private Health Insurance', 'Employer HMO']], ['HLT_015', ['Every 6 months', 'Annually']]],
        bonus: 5,
        description: 'Active health management through insurance and regular screenings'
      }
    ],
    improvements: {
      HLT_008: { 'Student': { target: 'Employed full-time', gain: 8, action: 'Build income stability through full-time employment or consistent freelance income' }, 'Part-time / Freelance': { target: 'Employed full-time', gain: 6, action: 'Strengthen income consistency for better financial resilience' } },
      HLT_009: { '56+': { target: '46 - 55', gain: 7, action: 'Review your health coverage to address age-related care needs' }, '46 - 55': { target: '36 - 45', gain: 6, action: 'Consider comprehensive health coverage for age-related risks' } },
      HLT_010: { '3': { target: '2', gain: 4, action: 'Ensure dependants have their own health coverage where possible' }, '4+': { target: '2', gain: 6, action: 'Review family health insurance to cover all dependants' } },
      HLT_012: { 'None': { target: 'Employer HMO', gain: 8, action: 'Obtain basic health insurance coverage' }, 'Employer HMO': { target: 'Private Health Insurance', gain: 5, action: 'Upgrade to comprehensive private health insurance' } },
      HLT_013: { "I don't know": { target: 'Savings', gain: 10, action: 'Build a dedicated medical emergency fund' }, 'Loan': { target: 'Savings', gain: 8, action: 'Replace loan dependency with emergency savings' } },
      HLT_014: { 'Asthma': { target: 'None', gain: 4, action: 'Confirm your insurance covers respiratory care and medications' }, 'Hypertension': { target: 'Asthma', gain: 2, action: 'Review your HMO benefits to ensure chronic care is covered' } },
      HLT_015: { 'Rarely/Only when sick': { target: 'Annually', gain: 6, action: 'Schedule annual preventive health screenings' } },
      HLT_016: { 'No': { target: 'Yes', gain: 8, action: 'Review and upgrade your health insurance coverage' } },
      HLT_017: { 'No': { target: 'Yes', gain: 12, action: 'Explore income protection options for illness resilience' } }
    }
  },

  INC: {
    name: 'Income Protection',
    pillars: [
      { id: 'emergency_financial_buffer', name: 'Emergency Financial Buffer', weight: 0.35 },
      { id: 'income_stability', name: 'Income Stability', weight: 0.25 },
      { id: 'income_protection_cover', name: 'Income Protection Cover', weight: 0.25 },
      { id: 'financial_commitments', name: 'Financial Commitments', weight: 0.15 }
    ],
    categories: {
      income_source: { name: 'Income Source', pillar: 'income_stability' },
      emergency_savings: { name: 'Emergency Savings', pillar: 'emergency_financial_buffer' },
      income_stability: { name: 'Income Stability', pillar: 'income_stability' },
      income_insurance: { name: 'Income Insurance', pillar: 'income_protection_cover' },
      debt_exposure: { name: 'Debt Exposure', pillar: 'financial_commitments' }
    },
    questions: {
      INC_011: {
        category: 'income_source',
        weight: 3,
        scores: { 'Salary from employment': 100, 'Freelance/Contract': 60, 'Business owner': 30 },
        gaps: { 'Freelance/Contract': 'Freelance or contract income can be unpredictable.', 'Business owner': 'Business income is tied to business performance and carries higher risk.' },
        recommendations: { 'Freelance/Contract': 'Build a steady client base and maintain an income buffer for dry periods.', 'Business owner': 'Separate personal and business finances and build business continuity safeguards.' }
      },
      INC_012: {
        category: 'emergency_savings',
        weight: 5,
        scores: { 'Over 3 months': 100, '1-3 months': 50, 'Less than 1 month': 0 },
        gaps: { 'Less than 1 month': 'Your savings would last less than one month.', '1-3 months': 'Your savings provide only a short buffer.' },
        recommendations: { 'Less than 1 month': 'Build an emergency fund covering at least 3 months of expenses.', '1-3 months': 'Increase your emergency fund to 6 months of expenses.' }
      },
      INC_013: {
        category: 'income_stability',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'You lack confidence in your income stability.' },
        recommendations: { 'No': 'Diversify your income sources and build a career contingency plan.' }
      },
      INC_014: {
        category: 'income_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'You do not have income protection insurance.' },
        recommendations: { 'No': 'Consider income protection insurance to replace earnings if unable to work.' }
      },
      INC_015: {
        category: 'debt_exposure',
        weight: 3,
        scores: { 'No': 100, 'Yes': 25 },
        gaps: { 'Yes': 'Your debts depend on continued income, creating significant vulnerability.' },
        recommendations: { 'Yes': 'Review debt structure and consider debt protection insurance.' }
      },
      INC_018: {
        category: 'income_insurance',
        weight: 3,
        scores: { 'My income would continue': 100, 'It would reduce significantly': 50, 'It would stop completely': 0, "I'm not sure": 25 },
        gaps: { 'It would stop completely': 'Your income would stop completely if you were unable to work for six months.', "I'm not sure": 'You are uncertain about what would happen to your income during a prolonged inability to work.' },
        recommendations: { 'It would stop completely': 'Consider income protection insurance to replace your earnings if you cannot work.', "I'm not sure": 'Review your employee benefits and insurance options to understand what income protection you have.' }
      }
    },
    modifiers: [
      {
        id: 'no_savings_no_protection',
        name: 'No Emergency Savings + No Income Insurance',
        conditions: [['INC_012', 'Less than 1 month'], ['INC_014', 'No']],
        penalty: 12,
        description: 'No savings buffer and no income insurance creates extreme vulnerability'
      },
      {
        id: 'debt_no_protection',
        name: 'High Debt + No Income Protection',
        conditions: [['INC_015', 'Yes'], ['INC_014', 'No']],
        penalty: 8,
        description: 'Significant debt without income protection is high risk'
      },
      {
        id: 'no_protection_income_stops',
        name: 'No Income Protection + Income Would Stop',
        conditions: [['INC_014', 'No'], ['INC_018', 'It would stop completely']],
        penalty: 8,
        description: 'No income protection and income would stop during extended inability to work'
      },
      {
        id: 'positive_income_resilience',
        name: 'Strong Savings + Income Insurance',
        conditions: [['INC_012', 'Over 3 months'], ['INC_014', 'Yes']],
        bonus: 5,
        description: 'Comprehensive income protection through savings and insurance'
      }
    ],
    improvements: {
      INC_011: { 'Freelance/Contract': { target: 'Salary from employment', gain: 4, action: 'Supplement freelance income with retainer clients or part-time employment' }, 'Business owner': { target: 'Salary from employment', gain: 6, action: 'Diversify income sources and build business stability' } },
      INC_012: { 'Less than 1 month': { target: '1-3 months', gain: 10, action: 'Begin building an emergency fund covering at least 1-3 months, with a long-term goal of 6 months' }, '1-3 months': { target: 'Over 3 months', gain: 6, action: 'Expand emergency fund to cover 6+ months' } },
      INC_013: { 'No': { target: 'Yes', gain: 8, action: 'Diversify income sources and build a career contingency plan' } },
      INC_014: { 'No': { target: 'Yes', gain: 10, action: 'Get income protection insurance' } },
      INC_015: { 'Yes': { target: 'No', gain: 8, action: 'Create a debt reduction plan' } },
      INC_018: { 'It would stop completely': { target: 'My income would continue', gain: 10, action: 'Get income protection insurance to replace earnings if unable to work' }, 'I\'m not sure': { target: 'My income would continue', gain: 6, action: 'Review employee benefits and explore income protection options' } }
    }
  },

  FAM: {
    name: 'Family Protection',
    pillars: [
      { id: 'family_dependency', name: 'Family Dependency', weight: 0.15 },
      { id: 'income_resilience', name: 'Income Resilience', weight: 0.20 },
      { id: 'financial_protection', name: 'Financial Protection', weight: 0.25 },
      { id: 'future_security', name: 'Future Security', weight: 0.20 },
      { id: 'family_healthcare', name: 'Family Healthcare', weight: 0.20 }
    ],
    categories: {
      dependents: { name: 'Dependents', pillar: 'family_dependency' },
      income_resilience: { name: 'Income Resilience', pillar: 'income_resilience' },
      family_insurance: { name: 'Family Insurance', pillar: 'financial_protection' },
      education_funding: { name: 'Education Funding', pillar: 'future_security' },
      family_health: { name: 'Family Health', pillar: 'family_healthcare' }
    },
    questions: {
      FAM_011: {
        category: 'dependents',
        weight: 3,
        scores: { 'None': 100, '1-2': 60, '3 or more': 30 },
        gaps: { '3 or more': 'Multiple dependents increase financial pressure and risk exposure.' },
        recommendations: { '3 or more': 'Ensure adequate life and health cover for all dependents.' }
      },
      FAM_012: {
        category: 'income_resilience',
        weight: 3,
        scores: { 'Over 6 months': 100, '3-6 months': 60, 'Less than 3 months': 0 },
        gaps: { 'Less than 3 months': 'Family would struggle financially within 3 months of income loss.', '3-6 months': 'Family has a moderate but limited income buffer.' },
        recommendations: { 'Less than 3 months': 'Build a family emergency fund covering 6+ months.', '3-6 months': 'Strengthen family income reserves to 6+ months.' }
      },
      FAM_013: {
        category: 'family_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'Not sure': 45, 'No': 0 },
        gaps: { 'No': 'Your family lacks adequate insurance protection.', 'Not sure': 'You are uncertain about your family insurance coverage.' },
        recommendations: { 'No': 'Review and secure comprehensive family insurance coverage.' }
      },
      FAM_014: {
        category: 'education_funding',
        weight: 3,
        scores: { 'Yes': 100, 'Not applicable': 80, 'No': 0 },
        gaps: { 'No': 'Children\'s education costs are not secured.' },
        recommendations: { 'No': 'Set up an education savings plan or education insurance policy.' }
      },
      FAM_015: {
        category: 'family_health',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Your family does not have comprehensive health insurance.' },
        recommendations: { 'No': 'Get comprehensive family health insurance coverage.' }
      }
    },
    modifiers: [
      {
        id: 'multiple_dependents_no_insurance',
        name: 'Multiple Dependents + No Insurance',
        conditions: [['FAM_011', '3 or more'], ['FAM_013', 'No']],
        penalty: 12,
        description: 'Multiple dependents without insurance is a critical vulnerability'
      },
      {
        id: 'no_income_buffer_no_insurance',
        name: 'Low Income Buffer + No Insurance',
        conditions: [['FAM_012', 'Less than 3 months'], ['FAM_013', 'No']],
        penalty: 10,
        description: 'Minimal income buffer combined with no insurance'
      },
      {
        id: 'education_gap_no_planning',
        name: 'No Education Fund + No Insurance',
        conditions: [['FAM_014', 'No'], ['FAM_013', ['No', 'Not sure']]],
        penalty: 7,
        description: 'Children unprotected both for education and health'
      },
      {
        id: 'positive_family_protection',
        name: 'Comprehensive Family Protection',
        conditions: [['FAM_013', 'Yes'], ['FAM_015', 'Yes']],
        bonus: 5,
        description: 'Full family insurance coverage across health and protection'
      }
    ],
    improvements: {
      FAM_011: { '3 or more': { target: '1-2', gain: 8, action: 'Ensure adequate life and health cover for all dependents' } },
      FAM_012: { 'Less than 3 months': { target: '3-6 months', gain: 8, action: 'Build family emergency fund to 3-6 months' }, '3-6 months': { target: 'Over 6 months', gain: 5, action: 'Extend family emergency fund beyond 6 months' } },
      FAM_013: { 'No': { target: 'Yes', gain: 10, action: 'Secure comprehensive family insurance' } },
      FAM_014: { 'No': { target: 'Yes', gain: 7, action: 'Start an education savings plan' } },
      FAM_015: { 'No': { target: 'Yes', gain: 8, action: 'Get family health insurance' } }
    }
  },

  RET: {
    name: 'Retirement Readiness',
    pillars: [
      { id: 'retirement_readiness', name: 'Retirement Readiness', weight: 0.30 },
      { id: 'retirement_savings', name: 'Retirement Savings', weight: 0.30 },
      { id: 'healthcare_protection', name: 'Healthcare & Protection', weight: 0.20 },
      { id: 'legacy_planning', name: 'Legacy Planning', weight: 0.20 }
    ],
    categories: {
      retirement_preparedness: { name: 'Retirement Preparedness', pillar: 'retirement_readiness' },
      retirement_horizon: { name: 'Retirement Horizon', pillar: 'retirement_readiness' },
      pension_savings: { name: 'Pension & Savings', pillar: 'retirement_savings' },
      long_term_care: { name: 'Long-term Care', pillar: 'healthcare_protection' },
      medical_cost_impact: { name: 'Medical Cost Impact', pillar: 'healthcare_protection', weight: 0.4 },
      legacy_documentation: { name: 'Legacy Documentation', pillar: 'legacy_planning' }
    },
    questions: {
      RET_010: {
        category: 'retirement_preparedness',
        weight: 2,
        scores: { 'I already have a written retirement plan': 100, "I'm saving but don't have a clear plan": 60, 'I know I should start planning': 30, "I haven't thought seriously about retirement": 0 },
        gaps: { "I haven't thought seriously about retirement": 'No retirement planning has been started.', 'I know I should start planning': 'Awareness of retirement needs exists but no concrete action taken.', "I'm saving but don't have a clear plan": 'Saving without a structured plan limits long-term effectiveness.' },
        recommendations: { "I haven't thought seriously about retirement": 'Start with a retirement savings plan immediately.', 'I know I should start planning': 'Create a written retirement plan with specific savings targets.', "I'm saving but don't have a clear plan": 'Develop a structured retirement plan with clear goals and timelines.' }
      },
      RET_011: {
        category: 'retirement_horizon',
        weight: 2,
        scores: { 'Over 15 years': 100, '5-15 years': 60, 'Within 5 years': 20 },
        gaps: { 'Within 5 years': 'Retiring soon with potentially insufficient preparation.', '5-15 years': 'Moderate runway but accelerated savings needed.' },
        recommendations: { 'Within 5 years': 'Conduct a detailed retirement readiness review immediately.', '5-15 years': 'Maximize retirement contributions in the coming years.' }
      },
      RET_012: {
        category: 'pension_savings',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No dedicated pension or retirement savings account.' },
        recommendations: { 'No': 'Open a pension or retirement savings account as soon as possible.' }
      },
      RET_013: {
        category: 'medical_cost_impact',
        weight: 3,
        scores: { 'Not concerned': 100, 'Somewhat concerned': 55, 'Very concerned': 25 },
        gaps: { 'Very concerned': 'Medical costs pose a significant threat to your retirement savings.', 'Somewhat concerned': 'Rising medical costs could impact your retirement plans.' },
        recommendations: { 'Very concerned': 'Include health cost projections in your retirement plan and consider medical cover.', 'Somewhat concerned': 'Build a medical cost buffer into your retirement savings target.' }
      },
      RET_014: {
        category: 'long_term_care',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No plan for long-term care or critical illness needs.' },
        recommendations: { 'No': 'Consider long-term care insurance or critical illness cover.' }
      },
      RET_015: {
        category: 'legacy_documentation',
        weight: 1,
        scores: { 'Yes, I have a documented plan': 100, 'Partially - I have some documentation': 50, 'No, not yet': 0 },
        gaps: { 'No, not yet': 'No documented plan for asset distribution or beneficiary nominations.', 'Partially - I have some documentation': 'Partial documentation leaves gaps in your legacy plan.' },
        recommendations: { 'No, not yet': 'Document how your assets should be distributed and nominate beneficiaries for your retirement accounts.', 'Partially - I have some documentation': 'Complete your estate planning documentation and review beneficiary designations.' }
      }
    },
    modifiers: [
      // Positive modifiers — reward proactive behaviour
      {
        id: 'positive_retirement_planning',
        name: 'Active Retirement Planning',
        conditions: [['RET_010', 'I already have a written retirement plan']],
        bonus: 5,
        description: 'Having a written retirement plan demonstrates strong financial preparedness'
      },
      {
        id: 'positive_pension_savings',
        name: 'Dedicated Pension Savings',
        conditions: [['RET_012', 'Yes']],
        bonus: 6,
        description: 'Dedicated retirement savings provide a foundation for retirement security'
      },
      {
        id: 'positive_partial_planning',
        name: 'Some Retirement Planning',
        conditions: [['RET_010', "I'm saving but don't have a clear plan"]],
        bonus: 2,
        description: 'Some saving activity shows awareness even without a structured plan'
      },
      {
        id: 'positive_legacy_documentation',
        name: 'Legacy Plan Documented',
        conditions: [['RET_015', 'Yes, I have a documented plan']],
        bonus: 3,
        description: 'Documented legacy planning protects loved ones and assets'
      },
      // Risk modifiers — penalise critical gaps
      {
        id: 'no_pension_no_care',
        name: 'No Pension + No Long-term Care Plan',
        conditions: [['RET_012', 'No'], ['RET_014', 'No']],
        penalty: 5,
        description: 'No retirement savings and no care plan creates extreme vulnerability'
      },
      {
        id: 'soon_retire_no_pension',
        name: 'Soon to Retire + No Pension Savings',
        conditions: [['RET_011', 'Within 5 years'], ['RET_012', 'No']],
        penalty: 4,
        description: 'Retiring without pension savings requires immediate action'
      },
      {
        id: 'no_savings_no_legacy',
        name: 'No Savings + No Legacy Plan',
        conditions: [['RET_012', 'No'], ['RET_015', 'No, not yet']],
        penalty: 4,
        description: 'No retirement savings and no legacy plan compounds vulnerability'
      }
    ],
    improvements: {
      RET_010: { "I'm saving but don't have a clear plan": { target: 'I already have a written retirement plan', gain: 5, action: 'Create a written retirement plan with specific savings targets' }, 'I know I should start planning': { target: "I'm saving but don't have a clear plan", gain: 4, action: 'Start saving regularly for retirement with a structured approach' }, "I haven't thought seriously about retirement": { target: 'I know I should start planning', gain: 10, action: 'Educate yourself on retirement planning basics and set a start date' } },
      RET_012: { 'No': { target: 'Yes', gain: 12, action: 'Open and contribute to a pension or retirement savings account' } },
      RET_013: { 'Very concerned': { target: 'Somewhat concerned', gain: 5, action: 'Research health insurance options and estimate medical costs in retirement' }, 'Somewhat concerned': { target: 'Not concerned', gain: 5, action: 'Build a medical cost buffer into your retirement savings' } },
      RET_014: { 'No': { target: 'Yes', gain: 8, action: 'Get long-term care or critical illness cover' } },
      RET_015: { 'No, not yet': { target: 'Partially - I have some documentation', gain: 6, action: 'Document your asset distribution wishes and nominate beneficiaries' }, 'Partially - I have some documentation': { target: 'Yes, I have a documented plan', gain: 4, action: 'Complete your estate planning documentation and review all beneficiary designations' } }
    }
  },

  YPR: {
    name: 'Young Professional',
    pillars: [
      { id: 'career_foundation', name: 'Career Foundation', weight: 0.25 },
      { id: 'financial_habits', name: 'Financial Habits', weight: 0.30 },
      { id: 'protection_readiness', name: 'Protection Readiness', weight: 0.30 },
      { id: 'future_goal_preparedness', name: 'Future Goal Preparedness', weight: 0.15 }
    ],
    categories: {
      career_stability: { name: 'Career Stability', pillar: 'career_foundation' },
      critical_illness_funding: { name: 'Critical Illness Funding', pillar: 'financial_habits' },
      income_stability: { name: 'Income Stability', pillar: 'career_foundation' },
      goal_saving: { name: 'Goal Saving', pillar: 'financial_habits' },
      personal_insurance: { name: 'Personal Insurance', pillar: 'protection_readiness' }
    },
    questions: {
      YPR_011: {
        category: 'career_stability',
        weight: 3,
        scores: { 'Over 5 years': 100, '2-5 years': 65, 'Under 2 years': 30 },
        gaps: { 'Under 2 years': 'Early career stage with limited income history and stability.', '2-5 years': 'Building career stability but still in growth phase.' },
        recommendations: { 'Under 2 years': 'Focus on career growth and building an emergency fund.', '2-5 years': 'Continue building professional credentials and income stability.' }
      },
      YPR_012: {
        category: 'critical_illness_funding',
        weight: 3,
        scores: { 'Yes easily': 100, 'With difficulty': 50, 'No': 0 },
        gaps: { 'No': 'Cannot cover critical illness costs.', 'With difficulty': 'Would struggle to cover critical illness costs.' },
        recommendations: { 'No': 'Build an emergency fund and consider critical illness insurance.', 'With difficulty': 'Strengthen your financial buffer for health emergencies.' }
      },
      YPR_013: {
        category: 'income_stability',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Household would struggle to maintain stability without your income.' },
        recommendations: { 'No': 'Build income resilience through savings and passive income.' }
      },
      YPR_014: {
        category: 'personal_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No personal health or accident insurance.' },
        recommendations: { 'No': 'Consider health and accident insurance to protect against unexpected medical costs.' }
      },
      YPR_015: {
        category: 'goal_saving',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Not actively saving towards a major life goal.', 'Yes': 'Actively saving towards a major life goal — building positive financial habits.' },
        recommendations: { 'No': 'Set a specific savings goal and automate regular contributions.' }
      }
    },
    modifiers: [
      {
        id: 'no_cover_critical_illness_no_insurance',
        name: 'Cannot Cover Illness + No Insurance',
        conditions: [['YPR_012', ['No', 'With difficulty']], ['YPR_014', 'No']],
        penalty: 12,
        description: 'Cannot fund critical illness and has no insurance'
      },
      {
        id: 'no_income_stability_no_insurance',
        name: 'Income Instability + No Insurance',
        conditions: [['YPR_013', 'No'], ['YPR_014', 'No']],
        penalty: 8,
        description: 'Household income instability combined with no insurance'
      },
      {
        id: 'positive_young_professional',
        name: 'Strong Financial Foundation',
        conditions: [['YPR_012', 'Yes easily'], ['YPR_014', 'Yes']],
        bonus: 5,
        description: 'Early career financial resilience through savings and insurance'
      }
    ],
    improvements: {
      YPR_011: { 'Under 2 years': { target: '2-5 years', gain: 4, action: 'Build career stability through professional certifications and networking' }, '2-5 years': { target: 'Over 5 years', gain: 3, action: 'Strengthen your career foundation with advanced skills and income diversification' } },
      YPR_012: { 'No': { target: 'With difficulty', gain: 8, action: 'Build an emergency fund so one unexpected expense doesn\u2019t erase your progress' }, 'With difficulty': { target: 'Yes easily', gain: 5, action: 'Strengthen your emergency fund to cover 6 months of expenses' } },
      YPR_013: { 'No': { target: 'Yes', gain: 6, action: 'Build income resilience through savings and passive income streams' } },
      YPR_014: { 'No': { target: 'Yes', gain: 10, action: 'Get personal health or accident insurance to protect the future you\u2019re building' } },
      YPR_015: { 'No': { target: 'Yes', gain: 6, action: 'Set up an automated savings plan for a major life goal' } }
    }
  },

  ENT: {
    name: 'Entrepreneur',
    pillars: [
      { id: 'business_continuity', name: 'Business Continuity', weight: 0.25 },
      { id: 'legal_liability', name: 'Legal & Liability', weight: 0.20 },
      { id: 'employee_protection', name: 'Employee Protection', weight: 0.20 },
      { id: 'asset_protection', name: 'Asset Protection', weight: 0.20 },
      { id: 'financial_resilience', name: 'Financial Resilience', weight: 0.15 }
    ],
    categories: {
      key_person_dependency: { name: 'Key Person Dependency', pillar: 'business_continuity' },
      personal_guarantees: { name: 'Personal Guarantees', pillar: 'legal_liability' },
      revenue_resilience: { name: 'Revenue Resilience', pillar: 'financial_resilience' },
      key_person_insurance: { name: 'Key Person Insurance', pillar: 'employee_protection' },
      asset_separation: { name: 'Asset Separation', pillar: 'asset_protection' }
    },
    questions: {
      ENT_011: {
        category: 'key_person_dependency',
        weight: 3,
        scores: { "No it runs itself": 100, 'Partially': 55, 'Yes completely': 0 },
        gaps: { 'Yes completely': 'Business completely depends on your personal involvement.', 'Partially': 'Business has partial dependency on you.' },
        recommendations: { 'Yes completely': 'Build team capacity and document processes to reduce key-person dependency.', 'Partially': 'Reduce personal dependency through delegation and systems.' }
      },
      ENT_012: {
        category: 'personal_guarantees',
        weight: 3,
        scores: { 'No': 100, 'Yes': 20 },
        gaps: { 'Yes': 'Personal guarantees for business debts create personal financial risk.' },
        recommendations: { 'Yes': 'Review personal guarantees and explore limited liability restructuring.' }
      },
      ENT_013: {
        category: 'revenue_resilience',
        weight: 3,
        scores: { 'Yes': 100, 'Not sure': 50, 'No': 0 },
        gaps: { 'No': 'Business would not survive 3 months without you.', 'Not sure': 'Uncertain about business survival without you.' },
        recommendations: { 'No': 'Create a business continuity plan and build an operational team.', 'Not sure': 'Assess and address key person risks in your business.' }
      },
      ENT_014: {
        category: 'key_person_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No key person insurance to protect the business if you become incapacitated.' },
        recommendations: { 'No': 'Consider key person insurance to protect your business.' }
      },
      ENT_015: {
        category: 'asset_separation',
        weight: 2,
        scores: { 'Yes': 100, 'Not sure': 50, 'No': 0 },
        gaps: { 'No': 'Personal assets are not separated from business liabilities.', 'Not sure': 'Uncertain about personal vs business asset protection.' },
        recommendations: { 'No': 'Separate personal and business assets through proper corporate structure.', 'Not sure': 'Review your asset protection structure.' }
      }
    },
    modifiers: [
      {
        id: 'complete_dependency_no_insurance',
        name: 'Complete Key-Person Dependency + No Insurance',
        conditions: [['ENT_011', 'Yes completely'], ['ENT_014', 'No']],
        penalty: 14,
        description: 'Business fully depends on you with no key person insurance'
      },
      {
        id: 'personal_guarantees_no_asset_separation',
        name: 'Personal Guarantees + No Asset Separation',
        conditions: [['ENT_012', 'Yes'], ['ENT_015', ['No', 'Not sure']]],
        penalty: 10,
        description: 'Personal guarantees without asset separation creates personal financial risk'
      },
      {
        id: 'no_business_survival_no_insurance',
        name: 'Business Cannot Survive + No Key Person Insurance',
        conditions: [['ENT_013', ['No', 'Not sure']], ['ENT_014', 'No']],
        penalty: 8,
        description: 'Business may not survive without you and lacks key person insurance'
      },
      {
        id: 'positive_entrepreneur_protection',
        name: 'Key Person Insurance + Asset Separation',
        conditions: [['ENT_014', 'Yes'], ['ENT_015', 'Yes']],
        bonus: 5,
        description: 'Business protected through key person insurance and asset separation'
      }
    ],
    improvements: {
      ENT_011: { 'Yes completely': { target: 'Partially', gain: 8, action: 'Delegate responsibilities and document business processes' }, 'Partially': { target: "No it runs itself", gain: 5, action: 'Build team capacity and create operational systems' } },
      ENT_012: { 'Yes': { target: 'No', gain: 6, action: 'Review personal guarantees and explore limited liability restructuring' } },
      ENT_013: { 'No': { target: 'Not sure', gain: 8, action: 'Create a business continuity plan and build an operational team' }, 'Not sure': { target: 'Yes', gain: 5, action: 'Assess and address key person risks in your business' } },
      ENT_014: { 'No': { target: 'Yes', gain: 10, action: 'Get key person insurance' } },
      ENT_015: { 'No': { target: 'Yes', gain: 8, action: 'Separate personal and business assets' }, 'Not sure': { target: 'Yes', gain: 4, action: 'Review your asset protection structure' } }
    }
  },

  HOM: {
    name: 'Home Protection',
    pillars: [
      { id: 'property_protection', name: 'Property Protection', weight: 1.0 }
    ],
    categories: {
      tenure_type: { name: 'Tenure Type', pillar: 'property_protection' },
      home_insurance: { name: 'Home Insurance', pillar: 'property_protection' }
    },
    questions: {
      HOM_011: {
        category: 'tenure_type',
        weight: 3,
        scores: { 'Own': 100, 'Rent': 60, 'Neither': 20 },
        gaps: { 'Neither': 'No stable housing tenure creates significant exposure.', 'Rent': 'Renting means you do not benefit from property asset appreciation.' },
        recommendations: { 'Neither': 'Work towards securing stable housing to reduce personal risk exposure.', 'Rent': 'Review renter\'s insurance and consider long-term homeownership goals.' }
      },
      HOM_012: {
        category: 'home_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No homeowner\'s or renter\'s insurance for your contents.' },
        recommendations: { 'No': 'Consider homeowner\'s or renter\'s insurance to protect your belongings.' }
      }
    },
    modifiers: [],
    improvements: {
      HOM_011: { 'Rent': { target: 'Own', gain: 4, action: 'Explore homeownership pathways and build a deposit' }, 'Neither': { target: 'Rent', gain: 6, action: 'Secure stable rental accommodation' } },
      HOM_012: { 'No': { target: 'Yes', gain: 15, action: 'Get homeowner\'s or renter\'s insurance' } }
    }
  },

  MOT: {
    name: 'Motor Protection',
    pillars: [
      { id: 'vehicle_protection', name: 'Vehicle Protection', weight: 1.0 }
    ],
    categories: {
      vehicle_count: { name: 'Vehicle Count', pillar: 'vehicle_protection' },
      motor_insurance: { name: 'Motor Insurance', pillar: 'vehicle_protection' }
    },
    questions: {
      MOT_011: {
        category: 'vehicle_count',
        weight: 3,
        scores: { '1': 100, '2': 70, '3 or more': 40 },
        gaps: { '3 or more': 'Multiple vehicles increase overall risk exposure and insurance costs.', '2': 'Two vehicles means higher combined exposure.' },
        recommendations: { '3 or more': 'Review whether all vehicles need comprehensive cover vs third-party.', '2': 'Ensure all vehicles have appropriate insurance cover.' }
      },
      MOT_012: {
        category: 'motor_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Primary vehicle is not covered by comprehensive motor insurance.' },
        recommendations: { 'No': 'Consider comprehensive motor insurance for your primary vehicle.' }
      }
    },
    modifiers: [],
    improvements: {
      MOT_011: { '2': { target: '1', gain: 3, action: 'Review whether you need multiple vehicles' }, '3 or more': { target: '1', gain: 5, action: 'Reduce vehicle count or ensure all are adequately insured' } },
      MOT_012: { 'No': { target: 'Yes', gain: 15, action: 'Get comprehensive motor insurance' } }
    }
  },

  SCH: {
    name: 'School Risk Assessment',
    pillars: [
      { id: 'student_safety', name: 'Student Safety', weight: 0.25 },
      { id: 'business_continuity', name: 'Business Continuity', weight: 0.20 },
      { id: 'transport_safety', name: 'Transport Safety', weight: 0.15 },
      { id: 'regulatory_readiness', name: 'Safety & Compliance Readiness', weight: 0.20 },
      { id: 'property_protection', name: 'Property Protection', weight: 0.20 }
    ],
    categories: {
      student_exposure: { name: 'Student Exposure', pillar: 'student_safety' },
      tuition_revenue: { name: 'Tuition Revenue', pillar: 'business_continuity' },
      transport_risk: { name: 'Transport Risk', pillar: 'transport_safety' },
      student_incidents: { name: 'Student Incidents', pillar: 'student_safety' },
      emergency_preparedness: { name: 'Emergency Preparedness', pillar: 'student_safety' },
      fire_safety: { name: 'Fire Safety', pillar: 'property_protection' },
      financial_continuity: { name: 'Financial Continuity', pillar: 'business_continuity' },
      safety_governance: { name: 'Safety Governance', pillar: 'regulatory_readiness' },
      driver_training: { name: 'Driver Training', pillar: 'transport_safety' },
      vehicle_inspections: { name: 'Vehicle Inspections', pillar: 'transport_safety' },
      fire_alarm: { name: 'Fire Alarm', pillar: 'property_protection' },
      building_maintenance: { name: 'Building Maintenance', pillar: 'property_protection' },
      injury_liability: { name: 'Injury Liability', pillar: 'regulatory_readiness' },
      property_insurance: { name: 'Property Insurance', pillar: 'property_protection' }
    },
    questions: {
      SCH_013: {
        category: 'student_exposure',
        weight: 3,
        scores: { 'Under 100': 100, '100-500': 55, 'Over 500': 20 },
        gaps: { 'Over 500': 'Large student population increases safety risk.' },
        recommendations: { 'Over 500': 'Strengthen student safety procedures and consider comprehensive accident coverage.' }
      },
      SCH_014: {
        category: 'tuition_revenue',
        weight: 2,
        scores: { 'Under \u20A6100,000': 40, '\u20A6100,000 - \u20A6500,000': 70, 'Over \u20A6500,000': 100 },
        gaps: { 'Under \u20A6100,000': 'Lower tuition revenue means less financial buffer for disruptions.' },
        recommendations: { 'Under \u20A6100,000': 'Develop a financial contingency plan to sustain operations during unexpected disruptions.' }
      },
      SCH_015: {
        category: 'transport_risk',
        weight: 2,
        scores: { 'No': 100, 'Yes': 30 },
        gaps: { 'Yes': 'School bus operations create transport safety obligations.' },
        recommendations: { 'Yes': 'Review motor fleet insurance and implement bus safety protocols.' }
      },
      SCH_012: {
        category: 'student_incidents',
        weight: 2,
        scores: { 'No': 100, 'Yes': 40 },
        gaps: { 'Yes': 'Student accidents have occurred on premises, indicating safety gaps.' },
        recommendations: { 'Yes': 'Conduct a full student safety audit and review accident response protocols.' }
      },
      SCH_020: {
        category: 'emergency_preparedness',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No written emergency procedures for student accidents or fire.' },
        recommendations: { 'No': 'Develop and document written emergency procedures for student accidents and fire.' }
      },
      SCH_021: {
        category: 'fire_safety',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Fire extinguishers not regularly inspected or available across the school.' },
        recommendations: { 'No': 'Install fire extinguishers across all school buildings and establish regular inspection schedule.' }
      },
      SCH_022: {
        category: 'financial_continuity',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0, 'Not sure': 30 },
        gaps: { 'No': 'School cannot sustain staff salaries and expenses for a three-month closure.', 'Not sure': 'Uncertainty about the school\u2019s ability to survive a three-month closure.' },
        recommendations: { 'No': 'Develop a financial contingency plan to cover operating expenses during unexpected closures.', 'Not sure': 'Assess your school\u2019s financial reserves and develop a contingency plan for unexpected closures.' }
      },
      SCH_023: {
        category: 'safety_governance',
        weight: 1,
        scores: { 'Head Teacher / Principal': 70, 'Designated Safety Officer': 100, 'School Administrator': 60, 'External Consultant': 40, 'No one specifically assigned': 0 },
        gaps: { 'No one specifically assigned': 'No one is specifically responsible for health and safety.' },
        recommendations: { 'No one specifically assigned': 'Designate a health and safety officer or committee within the school.' }
      },
      SCH_024: {
        category: 'driver_training',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0, 'Not sure': 30 },
        gaps: { 'No': 'School bus drivers are not trained in first aid and defensive driving.', 'Not sure': 'Uncertainty about driver training standards for school transport.' },
        recommendations: { 'No': 'Implement first aid and defensive driving training for all school bus drivers.', 'Not sure': 'Review driver training credentials and establish a training program.' }
      },
      SCH_025: {
        category: 'vehicle_inspections',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0, 'Not sure': 30 },
        gaps: { 'No': 'No regular vehicle safety inspections for school transport.', 'Not sure': 'Uncertainty about vehicle inspection schedules for school transport.' },
        recommendations: { 'No': 'Establish a regular vehicle safety inspection schedule for all school transport.', 'Not sure': 'Document and formalize vehicle inspection procedures for school transport.' }
      },
      SCH_026: {
        category: 'fire_alarm',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0, 'Not sure': 30 },
        gaps: { 'No': 'No working and regularly tested fire alarm system.', 'Not sure': 'Uncertainty about fire alarm functionality and testing.' },
        recommendations: { 'No': 'Install a fire alarm system and establish a regular testing schedule.', 'Not sure': 'Verify fire alarm system functionality and set up regular testing.' }
      },
      SCH_027: {
        category: 'building_maintenance',
        weight: 1,
        scores: { 'Monthly': 100, 'Quarterly': 80, 'Annually': 50, 'Rarely': 20, 'Never': 0 },
        gaps: { 'Rarely': 'Building maintenance inspections are only conducted rarely.', 'Never': 'No building maintenance inspections are conducted.' },
        recommendations: { 'Rarely': 'Establish a regular building maintenance inspection schedule.', 'Never': 'Begin conducting building maintenance inspections at least annually.' }
      },
      SCH_016: {
        category: 'injury_liability',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No liability coverage if a student is injured on premises.' },
        recommendations: { 'No': 'Secure comprehensive public liability insurance covering student injuries.' }
      },
      SCH_017: {
        category: 'property_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire insurance for school buildings.' },
        recommendations: { 'No': 'Get comprehensive fire insurance for all school buildings.' }
      }
    },
    modifiers: [
      {
        id: 'high_student_count_no_liability',
        name: 'High Student Count + No Liability Cover',
        conditions: [['SCH_013', 'Over 500'], ['SCH_016', 'No']],
        penalty: 12,
        description: 'Large school without liability cover for student injuries'
      },
      {
        id: 'no_liability_no_fire',
        name: 'No Liability + No Fire Insurance',
        conditions: [['SCH_016', 'No'], ['SCH_017', 'No']],
        penalty: 10,
        description: 'School lacks both liability and property insurance'
      }
    ],
    improvements: {
      SCH_013: { 'Over 500': { target: 'Under 100', gain: 10, action: 'Conduct a student safety review covering supervision, premises, and accident response to reduce injury risk and protect your students' } },
      SCH_014: { 'Under \u20A6100,000': { target: '\u20A6100,000 - \u20A6500,000', gain: 8, action: 'Develop a financial contingency plan to sustain operations during disruptions' } },
      SCH_015: { 'Yes': { target: 'No', gain: 5, action: 'Review transport safety policies and student movement procedures to reduce accident risk during school transport' } },
      SCH_012: { 'Yes': { target: 'No', gain: 10, action: 'Conduct a full student safety audit and accident response review to identify hazards and protect your students from harm' } },
      SCH_020: { 'No': { target: 'Yes', gain: 8, action: 'Establish written emergency procedures so your staff can respond effectively to student accidents and fire' } },
      SCH_021: { 'No': { target: 'Yes', gain: 6, action: 'Install fire extinguishers across all buildings and schedule regular inspections to protect your students, staff, and property' } },
      SCH_022: { 'No': { target: 'Yes', gain: 12, action: 'Develop and test a business continuity plan so your school can continue operating during unexpected disruptions' } },
      SCH_023: { 'No one specifically assigned': { target: 'Designated Safety Officer', gain: 6, action: 'Establish formal health and safety governance so safety responsibilities are clearly owned and managed' } },
      SCH_024: { 'No': { target: 'Yes', gain: 8, action: 'Train all school bus drivers in first aid and defensive driving to reduce accident risk and protect students during transport' }, 'Not sure': { target: 'Yes', gain: 3, action: 'Confirm and document driver training certifications to ensure your school transport drivers are properly qualified' } },
      SCH_025: { 'No': { target: 'Yes', gain: 8, action: 'Establish regular vehicle safety inspections to keep your school transport fleet safe and reliable' }, 'Not sure': { target: 'Yes', gain: 3, action: 'Audit vehicle inspection procedures and set up a schedule to ensure consistent school transport safety' } },
      SCH_026: { 'No': { target: 'Yes', gain: 10, action: 'Install and maintain a fire alarm system with monthly tests to ensure early warning and protect your school community' }, 'Not sure': { target: 'Yes', gain: 3, action: 'Verify fire alarm installation and schedule regular tests to ensure your school\'s fire safety system is reliable' } },
      SCH_027: { 'Never': { target: 'Monthly', gain: 6, action: 'Conduct monthly building maintenance inspections to catch structural and safety issues early' }, 'Rarely': { target: 'Quarterly', gain: 4, action: 'Conduct quarterly building maintenance inspections to prevent undetected deterioration of school facilities' } },
      SCH_016: { 'No': { target: 'Yes', gain: 12, action: 'Protect your school against student injury claims with public liability insurance' } },
      SCH_017: { 'No': { target: 'Yes', gain: 8, action: 'Protect your school buildings against catastrophic fire loss with adequate insurance' } }
    }
  },

  MFG: {
    name: 'Manufacturing Protection',
    pillars: [
      { id: 'workforce', name: 'Workforce', weight: 0.20 },
      { id: 'operations', name: 'Operations', weight: 0.30 },
      { id: 'asset_protection', name: 'Asset Protection', weight: 0.25 },
      { id: 'business_continuity', name: 'Business Continuity', weight: 0.25 }
    ],
    categories: {
      workforce_exposure: { name: 'Workforce Exposure', pillar: 'workforce' },
      equipment_dependency: { name: 'Equipment Dependency', pillar: 'operations' },
      facility_insurance: { name: 'Facility Insurance', pillar: 'asset_protection' },
      disaster_recovery: { name: 'Disaster Recovery', pillar: 'business_continuity' },
      workplace_safety: { name: 'Workplace Safety', pillar: 'workforce' },
      emergency_procedures: { name: 'Emergency Procedures', pillar: 'operations' },
      fire_safety: { name: 'Fire Safety', pillar: 'asset_protection' },
      financial_continuity: { name: 'Financial Continuity', pillar: 'business_continuity' },
      safety_governance: { name: 'Safety Governance', pillar: 'operations' },
      vehicle_operations: { name: 'Vehicle Operations', pillar: 'operations' },
      driver_training: { name: 'Driver Training', pillar: 'operations' },
      vehicle_inspections: { name: 'Vehicle Inspections', pillar: 'operations' },
      building_maintenance: { name: 'Building Maintenance', pillar: 'asset_protection' }
    },
    questions: {
      MFG_013: {
        category: 'workforce_exposure',
        weight: 3,
        scores: { '1-50': 100, '51-200': 55, '200+': 20 },
        gaps: { '200+': 'Large workforce creates significant liability and compliance exposure.' },
        recommendations: { '200+': 'Review comprehensive workforce insurance and safety programs.' }
      },
      MFG_014: {
        category: 'equipment_dependency',
        weight: 3,
        scores: { 'We have backups': 100, 'Within a few days': 50, 'Immediately': 0 },
        gaps: { 'Immediately': 'Critical machine breakdown would halt production immediately.' },
        recommendations: { 'Immediately': 'Implement equipment redundancy and maintenance programs.' }
      },
      MFG_016: {
        category: 'facility_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire and special perils insurance for your facility.' },
        recommendations: { 'No': 'Get comprehensive fire and special perils insurance for your facility.' }
      },
      MFG_017: {
        category: 'disaster_recovery',
        weight: 2,
        scores: { 'Yes easily': 100, 'With difficulty': 50, 'No, we would close': 0 },
        gaps: { 'No, we would close': 'Business would not survive a major disaster closure.', 'With difficulty': 'Business would struggle to recover from a major disaster.' },
        recommendations: { 'No, we would close': 'Create a comprehensive business continuity and disaster recovery plan.', 'With difficulty': 'Strengthen business continuity planning and insurance coverage.' }
      },
      MFG_012: {
        category: 'workplace_safety',
        weight: 3,
        scores: {'No':100,'Yes':40},
        gaps: {'Yes':'Workplace accidents indicate safety gaps in your manufacturing operation.'},
        recommendations: {'Yes':'Conduct a full workplace safety audit and review accident response protocols.'}
      },
      MFG_020: {
        category: 'emergency_procedures',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'No written emergency procedures for accidents or incidents.'},
        recommendations: {'No':'Develop and document written emergency procedures for accidents and incidents.'}
      },
      MFG_021: {
        category: 'fire_safety',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'Fire extinguishers not regularly inspected or available across your facility.'},
        recommendations: {'No':'Install fire extinguishers across all areas and establish regular inspection schedule.'}
      },
      MFG_022: {
        category: 'financial_continuity',
        weight: 3,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Your operation lacks resilience to absorb this risk.','Not sure':'Uncertainty about your ability to handle this risk.'},
        recommendations: {'No':'Develop a contingency plan to address this risk.','Not sure':'Assess your current position and develop a contingency plan.'}
      },
      MFG_023: {
        category: 'safety_governance',
        weight: 1,
        scores: {'Operations Manager':100,'Designated Safety Officer':67,'External Consultant':33,'No one specifically assigned':0},
        gaps: {'Designated Safety Officer':'Answer \'Designated Safety Officer\' indicates an area for improvement.','External Consultant':'Answer \'External Consultant\' indicates an area for improvement.','No one specifically assigned':'No one is specifically responsible for this critical area.'},
        recommendations: {'Designated Safety Officer':'Review your approach to \'Designated Safety Officer\' and develop an improvement plan.','External Consultant':'Review your approach to \'External Consultant\' and develop an improvement plan.','No one specifically assigned':'Designate a responsible person or team for this critical area.'}
      },
      MFG_024: {
        category: 'vehicle_operations',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      MFG_025: {
        category: 'driver_training',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Vehicle operators are not trained in safe operating procedures.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Implement safe operating procedures training for all vehicle and equipment operators.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      MFG_026: {
        category: 'vehicle_inspections',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'No regular vehicle safety inspections conducted.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Establish a regular vehicle safety inspection schedule.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      MFG_027: {
        category: 'building_maintenance',
        weight: 1,
        scores: {'Monthly':100,'Quarterly':80,'Annually':50,'Rarely':20,'Never':0},
        gaps: {'Quarterly':'Answer \'Quarterly\' indicates an area for improvement.','Annually':'Answer \'Annually\' indicates an area for improvement.','Rarely':'Maintenance inspections are only conducted rarely, increasing risk.','Never':'No maintenance inspections are conducted, allowing issues to go undetected.'},
        recommendations: {'Quarterly':'Review your approach to \'Quarterly\' and develop an improvement plan.','Annually':'Review your approach to \'Annually\' and develop an improvement plan.','Rarely':'Establish a regular maintenance inspection schedule.','Never':'Begin conducting regular maintenance inspections at least annually.'}
      }
    },
    modifiers: [
      {
        id: 'no_insurance_no_recovery',
        name: 'No Facility Insurance + Cannot Recover',
        conditions: [['MFG_016', 'No'], ['MFG_017', ['No, we would close', 'With difficulty']]],
        penalty: 14,
        description: 'No facility insurance and unable to recover from disaster'
      },
      {
        id: 'immediate_shutdown_no_redundancy',
        name: 'Immediate Shutdown + No Backups',
        conditions: [['MFG_014', 'Immediately'], ['MFG_017', ['No, we would close', 'With difficulty']]],
        penalty: 8,
        description: 'Production halts immediately with no recovery plan'
      },
      {
        id: 'mfg_incidents_no_procedures',
        name: 'Workplace Incidents + No Emergency Procedures',
        conditions: [['MFG_012', 'Yes'], ['MFG_020', 'No']],
        penalty: 12,
        description: 'Manufacturing operation with accident history and no emergency procedures'
      },
      {
        id: 'mfg_no_fire_extinguishers_poor_maintenance',
        name: 'No Fire Extinguishers + Poor Building Maintenance',
        conditions: [['MFG_021', 'No'], ['MFG_027', ["Rarely","Never"]]],
        penalty: 8,
        description: 'Fire safety equipment gaps combined with poor facility maintenance'
      }
    ],
    improvements: {
      MFG_013: { '200+': { target: '51-200', gain: 7, action: 'Review comprehensive workforce insurance and safety programs to protect your employees and reduce liability exposure' } },
      MFG_014: { 'Immediately': { target: 'Within a few days', gain: 8, action: 'Implement equipment redundancy for critical machinery to prevent production downtime' } },
      MFG_016: { 'No': { target: 'Yes', gain: 10, action: 'Protect your facility and equipment against fire and special perils to prevent catastrophic production loss' } },
      MFG_017: { 'No, we would close': { target: 'With difficulty', gain: 8, action: 'Create a business continuity plan so your manufacturing operation can survive a prolonged disruption' }, 'With difficulty': { target: 'Yes easily', gain: 6, action: 'Strengthen business continuity and disaster recovery planning to keep production running during disruptions' } },
      MFG_012: {
        'Yes': { target: 'No', gain: 6, action: 'Strengthen workplace safety governance and incident investigation processes to reduce accident risk and liability exposure' },
      },
      MFG_020: {
        'No': { target: 'Yes', gain: 10, action: 'Document emergency procedures so your team can respond effectively to workplace accidents and fire' },
      },
      MFG_021: {
        'No': { target: 'Yes', gain: 10, action: 'Install fire extinguishers across all areas and establish regular inspections to protect your facility and people' },
      },
      MFG_022: {
        'No': { target: 'Yes', gain: 10, action: 'Build financial reserves to sustain operations during a three-month closure' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review financial resilience and develop a closure contingency plan' },
      },
      MFG_023: {
        'Designated Safety Officer': { target: 'Operations Manager', gain: 3, action: 'Upgrade safety oversight from officer to senior operations leadership so safety governance has proper authority' },
        'External Consultant': { target: 'Operations Manager', gain: 7, action: 'Bring safety governance in-house under senior operations management to strengthen accountability' },
        'No one specifically assigned': { target: 'Operations Manager', gain: 10, action: 'Designate a senior operations lead for health and safety so responsibilities are clearly owned' },
      },
      MFG_024: {
        'No': { target: 'Yes', gain: 10, action: 'Secure goods-in-transit insurance to protect your shipments against loss or damage during transportation' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review supply chain operations and obtain goods-in-transit cover to protect your shipments' },
      },
      MFG_025: {
        'No': { target: 'Yes', gain: 10, action: 'Train production staff in preventive maintenance to reduce equipment breakdown risk' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Audit maintenance skills and establish a training program to close skill gaps and prevent breakdowns' },
      },
      MFG_026: {
        'No': { target: 'Yes', gain: 10, action: 'Establish regular vehicle safety inspections to keep your logistics fleet safe and roadworthy' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Document vehicle inspection procedures and set up a schedule to ensure fleet safety' },
      },
      MFG_027: {
        'Quarterly': { target: 'Monthly', gain: 2, action: 'Increase facility maintenance inspections to monthly frequency to catch issues early' },
        'Annually': { target: 'Monthly', gain: 5, action: 'Increase facility maintenance inspections to monthly frequency to catch issues early' },
        'Rarely': { target: 'Monthly', gain: 8, action: 'Establish regular monthly facility maintenance inspections to prevent undetected deterioration' },
        'Never': { target: 'Monthly', gain: 10, action: 'Begin conducting regular monthly facility maintenance inspections to prevent undetected issues from escalating' },
      }
    }
  },

  HOS: {
    name: 'Hospital Protection',
    pillars: [
      { id: 'operations', name: 'Clinical Risk & Patient Safety', weight: 0.25 },
      { id: 'legal_liability', name: 'Professional Liability', weight: 0.30 },
      { id: 'equipment', name: 'Medical Equipment Resilience', weight: 0.20 },
      { id: 'asset_protection', name: 'Operational Continuity', weight: 0.25 }
    ],
    categories: {
      patient_exposure: { name: 'Patient Volume & Liability', pillar: 'operations' },
      medical_liability: { name: 'Medical Malpractice Coverage', pillar: 'legal_liability' },
      equipment_value: { name: 'High-Value Equipment', pillar: 'equipment' },
      equipment_insurance: { name: 'Equipment Protection', pillar: 'equipment' },
      patient_incidents: { name: 'Patient Safety Incidents', pillar: 'operations' },
      emergency_procedures: { name: 'Emergency Preparedness', pillar: 'operations' },
      fire_safety: { name: 'Fire Safety', pillar: 'asset_protection' },
      financial_continuity: { name: 'Financial Continuity', pillar: 'operations' },
      compliance_governance: { name: 'Clinical Governance', pillar: 'legal_liability' },
      vehicle_operations: { name: 'Medical Transport', pillar: 'operations' },
      driver_training: { name: 'Driver Emergency Training', pillar: 'operations' },
      vehicle_inspections: { name: 'Vehicle Safety Inspections', pillar: 'operations' },
      building_maintenance: { name: 'Facility Maintenance', pillar: 'asset_protection' }
    },
    questions: {
      HOS_013: {
        category: 'patient_exposure',
        weight: 3,
        scores: { 'Under 20': 100, '20-100': 55, 'Over 100': 20 },
        gaps: { 'Over 100': 'Large facility with significant patient liability exposure.' },
        recommendations: { 'Over 100': 'Ensure comprehensive medical malpractice and liability coverage.' }
      },
      HOS_015: {
        category: 'medical_liability',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No professional indemnity or medical malpractice insurance.' },
        recommendations: { 'No': 'Secure comprehensive professional indemnity and medical malpractice insurance.' }
      },
      HOS_016: {
        category: 'equipment_value',
        weight: 2,
        scores: { 'No': 100, 'Yes': 40 },
        gaps: { 'Yes': 'High-value medical equipment on site requires specialized coverage.' },
        recommendations: { 'Yes': 'Ensure all high-value medical equipment is specifically insured.' }
      },
      HOS_017: {
        category: 'equipment_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No insurance coverage for critical life-support equipment damage.' },
        recommendations: { 'No': 'Get all-risks equipment insurance covering power surge and breakdown.' }
      },
      HOS_012: {
        category: 'patient_incidents',
        weight: 3,
        scores: {'No':100,'Yes':40},
        gaps: {'Yes':'Patient safety incidents indicate gaps in your healthcare facility.'},
        recommendations: {'Yes':'Conduct a full patient safety audit and review incident response protocols.'}
      },
      HOS_020: {
        category: 'emergency_procedures',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'No written emergency procedures for accidents or incidents.'},
        recommendations: {'No':'Develop and document written emergency procedures for accidents and incidents.'}
      },
      HOS_021: {
        category: 'fire_safety',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'Fire extinguishers not regularly inspected or available across your facility.'},
        recommendations: {'No':'Install fire extinguishers across all areas and establish regular inspection schedule.'}
      },
      HOS_022: {
        category: 'financial_continuity',
        weight: 3,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Your operation lacks resilience to absorb this risk.','Not sure':'Uncertainty about your ability to handle this risk.'},
        recommendations: {'No':'Develop a contingency plan to address this risk.','Not sure':'Assess your current position and develop a contingency plan.'}
      },
      HOS_023: {
        category: 'compliance_governance',
        weight: 1,
        scores: {'Medical Director':100,'Designated Compliance Officer':67,'External Consultant':33,'No one specifically assigned':0},
        gaps: {'Designated Compliance Officer':'Answer \'Designated Compliance Officer\' indicates an area for improvement.','External Consultant':'Answer \'External Consultant\' indicates an area for improvement.','No one specifically assigned':'No one is specifically responsible for this critical area.'},
        recommendations: {'Designated Compliance Officer':'Review your approach to \'Designated Compliance Officer\' and develop an improvement plan.','External Consultant':'Review your approach to \'External Consultant\' and develop an improvement plan.','No one specifically assigned':'Designate a responsible person or team for this critical area.'}
      },
      HOS_024: {
        category: 'vehicle_operations',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      HOS_025: {
        category: 'driver_training',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Vehicle operators are not trained in safe operating procedures.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Implement safe operating procedures training for all vehicle and equipment operators.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      HOS_026: {
        category: 'vehicle_inspections',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'No regular vehicle safety inspections conducted.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Establish a regular vehicle safety inspection schedule.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      HOS_027: {
        category: 'building_maintenance',
        weight: 1,
        scores: {'Monthly':100,'Quarterly':80,'Annually':50,'Rarely':20,'Never':0},
        gaps: {'Quarterly':'Answer \'Quarterly\' indicates an area for improvement.','Annually':'Answer \'Annually\' indicates an area for improvement.','Rarely':'Maintenance inspections are only conducted rarely, increasing risk.','Never':'No maintenance inspections are conducted, allowing issues to go undetected.'},
        recommendations: {'Quarterly':'Review your approach to \'Quarterly\' and develop an improvement plan.','Annually':'Review your approach to \'Annually\' and develop an improvement plan.','Rarely':'Establish a regular maintenance inspection schedule.','Never':'Begin conducting regular maintenance inspections at least annually.'}
      }
    },
    modifiers: [
      {
        id: 'high_value_equipment_no_insurance',
        name: 'High-Value Equipment + No Equipment Insurance',
        conditions: [['HOS_016', 'Yes'], ['HOS_017', 'No']],
        penalty: 12,
        description: 'Expensive equipment on site without insurance coverage'
      },
      {
        id: 'large_facility_no_liability',
        name: 'Large Facility + No Liability Insurance',
        conditions: [['HOS_013', 'Over 100'], ['HOS_015', 'No']],
        penalty: 10,
        description: 'Large hospital without professional liability coverage'
      },
      {
        id: 'hos_incidents_no_procedures',
        name: 'Patient Incidents + No Emergency Procedures',
        conditions: [['HOS_012', 'Yes'], ['HOS_020', 'No']],
        penalty: 12,
        description: 'Healthcare operation with accident history and no emergency procedures'
      },
      {
        id: 'hos_no_fire_extinguishers_poor_maintenance',
        name: 'No Fire Extinguishers + Poor Building Maintenance',
        conditions: [['HOS_021', 'No'], ['HOS_027', ["Rarely","Never"]]],
        penalty: 8,
        description: 'Fire safety equipment gaps combined with poor facility maintenance'
      }
    ],
    improvements: {
      HOS_015: { 'No': { target: 'Yes', gain: 12, action: 'Protect clinicians and your facility against malpractice claims' } },
      HOS_017: { 'No': { target: 'Yes', gain: 10, action: 'Protect critical medical equipment against breakdown and power surge damage' } },
      HOS_012: {
        'Yes': { target: 'No', gain: 6, action: 'Strengthen patient safety governance and incident review processes' },
      },
      HOS_020: {
        'No': { target: 'Yes', gain: 10, action: 'Document emergency procedures so staff can respond effectively to patient incidents and fire' },
      },
      HOS_021: {
        'No': { target: 'Yes', gain: 10, action: 'Install fire extinguishers across all facility areas and establish regular inspection schedule' },
      },
      HOS_022: {
        'No': { target: 'Yes', gain: 10, action: 'Build financial reserves to sustain patient care operations during a three-month closure' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review financial resilience and develop a contingency plan for service continuity' },
      },
      HOS_023: {
        'Designated Compliance Officer': { target: 'Medical Director', gain: 3, action: 'Upgrade compliance oversight from officer to senior clinical leadership' },
        'External Consultant': { target: 'Medical Director', gain: 7, action: 'Bring compliance governance in-house under senior clinical leadership' },
        'No one specifically assigned': { target: 'Medical Director', gain: 10, action: 'Designate a senior clinical lead for compliance and patient safety' },
      },
      HOS_024: {
        'No': { target: 'Yes', gain: 10, action: 'Secure appropriate fleet insurance for ambulances and patient transport vehicles' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review transport operations and obtain appropriate fleet coverage' },
      },
      HOS_025: {
        'No': { target: 'Yes', gain: 10, action: 'Train drivers in defensive driving and emergency protocols to reduce accident risk' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Audit driver training credentials and establish a training program' },
      },
      HOS_026: {
        'No': { target: 'Yes', gain: 10, action: 'Establish regular vehicle safety inspections to keep medical transport safe and reliable' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Document vehicle inspection procedures and set up a regular schedule' },
      },
      HOS_027: {
        'Quarterly': { target: 'Monthly', gain: 2, action: 'Increase building maintenance inspections to monthly frequency' },
        'Annually': { target: 'Monthly', gain: 5, action: 'Increase building maintenance inspections to monthly frequency' },
        'Rarely': { target: 'Monthly', gain: 8, action: 'Establish regular monthly building maintenance inspections' },
        'Never': { target: 'Monthly', gain: 10, action: 'Begin conducting regular monthly building maintenance inspections' },
      }
    }
  },

  CHR: {
    name: 'Church Protection',
    pillars: [
      { id: 'operations', name: 'Operations', weight: 0.25 },
      { id: 'assets', name: 'Assets', weight: 0.25 },
      { id: 'legal_liability', name: 'Legal & Liability', weight: 0.25 },
      { id: 'property', name: 'Property Protection', weight: 0.25 }
    ],
    categories: {
      congregation_exposure: { name: 'Congregation Exposure', pillar: 'operations' },
      valuable_assets: { name: 'Valuable Assets', pillar: 'assets' },
      event_liability: { name: 'Event Liability', pillar: 'legal_liability' },
      building_insurance: { name: 'Building Insurance', pillar: 'property' },
      premises_incidents: { name: 'Premises Incidents', pillar: 'legal_liability' },
      emergency_procedures: { name: 'Emergency Procedures', pillar: 'operations' },
      fire_safety: { name: 'Fire Safety', pillar: 'property' },
      financial_continuity: { name: 'Financial Continuity', pillar: 'operations' },
      safety_governance: { name: 'Safety Governance', pillar: 'legal_liability' },
      vehicle_operations: { name: 'Vehicle Operations', pillar: 'operations' },
      driver_training: { name: 'Driver Training', pillar: 'operations' },
      vehicle_inspections: { name: 'Vehicle Inspections', pillar: 'operations' },
      building_maintenance: { name: 'Building Maintenance', pillar: 'property' }
    },
    questions: {
      CHR_013: {
        category: 'congregation_exposure',
        weight: 3,
        scores: { 'Under 200': 100, '200-1000': 55, 'Over 1000': 15 },
        gaps: { 'Over 1000': 'Large congregation creates significant liability during gatherings.' },
        recommendations: { 'Over 1000': 'Review comprehensive public liability insurance for large gatherings.' }
      },
      CHR_014: {
        category: 'valuable_assets',
        weight: 2,
        scores: { 'No': 100, 'Yes': 40 },
        gaps: { 'Yes': 'Valuable instruments and equipment require specialized insurance.' },
        recommendations: { 'Yes': 'Ensure high-value musical instruments and broadcast equipment are specifically insured.' }
      },
      CHR_015: {
        category: 'event_liability',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No insurance if a congregant is injured on church premises.' },
        recommendations: { 'No': 'Secure comprehensive public liability insurance for your premises.' }
      },
      CHR_017: {
        category: 'building_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire insurance for the church building and contents.' },
        recommendations: { 'No': 'Get fire insurance for the church building and contents.' }
      },
      CHR_012: {
        category: 'premises_incidents',
        weight: 3,
        scores: {'No':100,'Yes':40},
        gaps: {'Yes':'Incidents on your premises indicate safety gaps at your church.'},
        recommendations: {'Yes':'Conduct a full premises safety audit and review incident response protocols.'}
      },
      CHR_020: {
        category: 'emergency_procedures',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'No written emergency procedures for accidents or incidents.'},
        recommendations: {'No':'Develop and document written emergency procedures for accidents and incidents.'}
      },
      CHR_021: {
        category: 'fire_safety',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'Fire extinguishers not regularly inspected or available across your facility.'},
        recommendations: {'No':'Install fire extinguishers across all areas and establish regular inspection schedule.'}
      },
      CHR_022: {
        category: 'financial_continuity',
        weight: 3,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Your operation lacks resilience to absorb this risk.','Not sure':'Uncertainty about your ability to handle this risk.'},
        recommendations: {'No':'Develop a contingency plan to address this risk.','Not sure':'Assess your current position and develop a contingency plan.'}
      },
      CHR_023: {
        category: 'safety_governance',
        weight: 1,
        scores: {'Church Administrator':100,'Designated Safety Officer':67,'Volunteer Coordinator':33,'No one specifically assigned':0},
        gaps: {'Designated Safety Officer':'Answer \'Designated Safety Officer\' indicates an area for improvement.','Volunteer Coordinator':'Answer \'Volunteer Coordinator\' indicates an area for improvement.','No one specifically assigned':'No one is specifically responsible for this critical area.'},
        recommendations: {'Designated Safety Officer':'Review your approach to \'Designated Safety Officer\' and develop an improvement plan.','Volunteer Coordinator':'Review your approach to \'Volunteer Coordinator\' and develop an improvement plan.','No one specifically assigned':'Designate a responsible person or team for this critical area.'}
      },
      CHR_024: {
        category: 'vehicle_operations',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      CHR_025: {
        category: 'driver_training',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Vehicle operators are not trained in safe operating procedures.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Implement safe operating procedures training for all vehicle and equipment operators.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      CHR_026: {
        category: 'vehicle_inspections',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'No regular vehicle safety inspections conducted.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Establish a regular vehicle safety inspection schedule.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      CHR_027: {
        category: 'building_maintenance',
        weight: 1,
        scores: {'Monthly':100,'Quarterly':80,'Annually':50,'Rarely':20,'Never':0},
        gaps: {'Quarterly':'Answer \'Quarterly\' indicates an area for improvement.','Annually':'Answer \'Annually\' indicates an area for improvement.','Rarely':'Maintenance inspections are only conducted rarely, increasing risk.','Never':'No maintenance inspections are conducted, allowing issues to go undetected.'},
        recommendations: {'Quarterly':'Review your approach to \'Quarterly\' and develop an improvement plan.','Annually':'Review your approach to \'Annually\' and develop an improvement plan.','Rarely':'Establish a regular maintenance inspection schedule.','Never':'Begin conducting regular maintenance inspections at least annually.'}
      }
    },
    modifiers: [
      {
        id: 'large_congregation_no_liability',
        name: 'Large Congregation + No Liability Cover',
        conditions: [['CHR_013', 'Over 1000'], ['CHR_015', 'No']],
        penalty: 12,
        description: 'Large congregation without liability insurance'
      },
      {
        id: 'valuable_assets_no_building_insurance',
        name: 'Valuable Assets + No Building Insurance',
        conditions: [['CHR_014', 'Yes'], ['CHR_017', 'No']],
        penalty: 8,
        description: 'Valuable contents unprotected and no building insurance'
      },
      {
        id: 'chr_incidents_no_procedures',
        name: 'Premises Incidents + No Emergency Procedures',
        conditions: [['CHR_012', 'Yes'], ['CHR_020', 'No']],
        penalty: 12,
        description: 'Church operation with accident history and no emergency procedures'
      },
      {
        id: 'chr_no_fire_extinguishers_poor_maintenance',
        name: 'No Fire Extinguishers + Poor Building Maintenance',
        conditions: [['CHR_021', 'No'], ['CHR_027', ["Rarely","Never"]]],
        penalty: 8,
        description: 'Fire safety equipment gaps combined with poor facility maintenance'
      }
    ],
    improvements: {
      CHR_015: { 'No': { target: 'Yes', gain: 12, action: 'Protect your church and congregation against injury claims with comprehensive public liability insurance' } },
      CHR_017: { 'No': { target: 'Yes', gain: 8, action: 'Protect your church building and contents against catastrophic fire loss' } },
      CHR_012: {
        'Yes': { target: 'No', gain: 6, action: 'Strengthen premises safety governance so your church can respond effectively to incidents' },
      },
      CHR_020: {
        'No': { target: 'Yes', gain: 10, action: 'Document emergency procedures so your staff and volunteers know how to respond to fire and medical incidents' },
      },
      CHR_021: {
        'No': { target: 'Yes', gain: 10, action: 'Install fire extinguishers across all premises and establish regular inspections to protect your congregation and property' },
      },
      CHR_022: {
        'No': { target: 'Yes', gain: 10, action: 'Build financial reserves to sustain operations during a three-month closure' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review financial resilience and develop a closure contingency plan' },
      },
      CHR_023: {
        'Designated Safety Officer': { target: 'Church Administrator', gain: 3, action: 'Upgrade safety oversight to senior administrative leadership so safety governance has proper authority' },
        'Volunteer Coordinator': { target: 'Church Administrator', gain: 7, action: 'Bring safety governance under senior administrative leadership to strengthen accountability' },
        'No one specifically assigned': { target: 'Church Administrator', gain: 10, action: 'Designate a senior administrator for safety and compliance so responsibilities are clearly owned' },
      },
      CHR_024: {
        'No': { target: 'Yes', gain: 10, action: 'Protect your musical instruments and broadcast equipment against theft or damage with specialised insurance' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Audit your valuable equipment and obtain appropriate coverage to prevent financial loss' },
      },
      CHR_025: {
        'No': { target: 'Yes', gain: 10, action: 'Train technical staff in preventive maintenance to reduce equipment failure risk during services' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Audit maintenance skills and establish a training program to close skill gaps and prevent breakdowns' },
      },
      CHR_026: {
        'No': { target: 'Yes', gain: 10, action: 'Establish regular vehicle safety inspections to keep your church transport safe and reliable' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Document vehicle inspection procedures and set up a schedule to ensure fleet safety' },
      },
      CHR_027: {
        'Quarterly': { target: 'Monthly', gain: 2, action: 'Increase facility maintenance inspections to monthly frequency to catch issues early' },
        'Annually': { target: 'Monthly', gain: 5, action: 'Increase facility maintenance inspections to monthly frequency to catch issues early' },
        'Rarely': { target: 'Monthly', gain: 8, action: 'Establish regular monthly facility maintenance inspections to prevent undetected deterioration' },
        'Never': { target: 'Monthly', gain: 10, action: 'Begin conducting regular monthly facility maintenance inspections to prevent small issues from escalating' },
      }
    }
  },

  CON: {
    name: 'Construction Protection',
    pillars: [
      { id: 'operations', name: 'Operations', weight: 0.20 },
      { id: 'equipment', name: 'Equipment', weight: 0.20 },
      { id: 'insurance', name: 'Insurance', weight: 0.25 },
      { id: 'worker_protection', name: 'Worker Protection', weight: 0.20 },
      { id: 'contractual', name: 'Contractual Risk', weight: 0.15 }
    ],
    categories: {
      project_exposure: { name: 'Project Exposure', pillar: 'operations' },
      heavy_machinery: { name: 'Heavy Machinery', pillar: 'equipment' },
      contractor_insurance: { name: 'Contractor Insurance', pillar: 'insurance' },
      accident_cover: { name: 'Accident Cover', pillar: 'worker_protection' },
      penalty_protection: { name: 'Penalty Protection', pillar: 'contractual' },
      site_incidents: { name: 'Site Incidents', pillar: 'worker_protection' },
      emergency_procedures: { name: 'Emergency Procedures', pillar: 'operations' },
      fire_safety: { name: 'Fire Safety', pillar: 'insurance' },
      financial_continuity: { name: 'Financial Continuity', pillar: 'contractual' },
      safety_governance: { name: 'Safety Governance', pillar: 'worker_protection' },
      vehicle_operations: { name: 'Vehicle Operations', pillar: 'operations' },
      operator_training: { name: 'Operator Training', pillar: 'operations' },
      vehicle_inspections: { name: 'Vehicle Inspections', pillar: 'operations' },
      equipment_maintenance: { name: 'Equipment Maintenance', pillar: 'equipment' }
    },
    questions: {
      CON_013: {
        category: 'project_exposure',
        weight: 3,
        scores: { '1-2': 100, '3-5': 55, 'More than 5': 20 },
        gaps: { 'More than 5': 'Managing many concurrent projects increases risk exposure.' },
        recommendations: { 'More than 5': 'Ensure each project has adequate insurance coverage.' }
      },
      CON_014: {
        category: 'heavy_machinery',
        weight: 3,
        scores: { 'No': 100, 'Yes': 30 },
        gaps: { 'Yes': 'Heavy machinery on site creates significant liability and damage risk.' },
        recommendations: { 'Yes': 'Ensure all heavy machinery is comprehensively insured.' }
      },
      CON_015: {
        category: 'contractor_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No contractor\'s all-risk or works insurance.' },
        recommendations: { 'No': 'Get comprehensive contractor\'s all-risk insurance.' }
      },
      CON_016: {
        category: 'accident_cover',
        weight: 3,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No group personal accident cover for on-site workers.' },
        recommendations: { 'No': 'Get group personal accident cover for all on-site workers.' }
      },
      CON_017: {
        category: 'penalty_protection',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No protection against project delay penalties.' },
        recommendations: { 'No': 'Review contract terms and consider delay penalty protection.' }
      },
      CON_012: {
        category: 'site_incidents',
        weight: 3,
        scores: {'No':100,'Yes':40},
        gaps: {'Yes':'On-site accidents indicate safety gaps in your construction operation.'},
        recommendations: {'Yes':'Conduct a full site safety audit and review accident response protocols.'}
      },
      CON_020: {
        category: 'emergency_procedures',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'No written emergency procedures for accidents or incidents.'},
        recommendations: {'No':'Develop and document written emergency procedures for accidents and incidents.'}
      },
      CON_021: {
        category: 'fire_safety',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'Fire extinguishers not regularly inspected or available across your facility.'},
        recommendations: {'No':'Install fire extinguishers across all areas and establish regular inspection schedule.'}
      },
      CON_022: {
        category: 'financial_continuity',
        weight: 3,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Your operation lacks resilience to absorb this risk.','Not sure':'Uncertainty about your ability to handle this risk.'},
        recommendations: {'No':'Develop a contingency plan to address this risk.','Not sure':'Assess your current position and develop a contingency plan.'}
      },
      CON_023: {
        category: 'safety_governance',
        weight: 1,
        scores: {'Project Manager':100,'Designated Safety Officer':67,'External Consultant':33,'No one specifically assigned':0},
        gaps: {'Designated Safety Officer':'Answer \'Designated Safety Officer\' indicates an area for improvement.','External Consultant':'Answer \'External Consultant\' indicates an area for improvement.','No one specifically assigned':'No one is specifically responsible for this critical area.'},
        recommendations: {'Designated Safety Officer':'Review your approach to \'Designated Safety Officer\' and develop an improvement plan.','External Consultant':'Review your approach to \'External Consultant\' and develop an improvement plan.','No one specifically assigned':'Designate a responsible person or team for this critical area.'}
      },
      CON_024: {
        category: 'vehicle_operations',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      CON_025: {
        category: 'operator_training',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Vehicle operators are not trained in safe operating procedures.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Implement safe operating procedures training for all vehicle and equipment operators.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      CON_026: {
        category: 'vehicle_inspections',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'No regular vehicle safety inspections conducted.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Establish a regular vehicle safety inspection schedule.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      CON_027: {
        category: 'equipment_maintenance',
        weight: 1,
        scores: {'Monthly':100,'Quarterly':80,'Annually':50,'Rarely':20,'Never':0},
        gaps: {'Quarterly':'Answer \'Quarterly\' indicates an area for improvement.','Annually':'Answer \'Annually\' indicates an area for improvement.','Rarely':'Maintenance inspections are only conducted rarely, increasing risk.','Never':'No maintenance inspections are conducted, allowing issues to go undetected.'},
        recommendations: {'Quarterly':'Review your approach to \'Quarterly\' and develop an improvement plan.','Annually':'Review your approach to \'Annually\' and develop an improvement plan.','Rarely':'Establish a regular maintenance inspection schedule.','Never':'Begin conducting regular maintenance inspections at least annually.'}
      }
    },
    modifiers: [
      {
        id: 'heavy_machinery_no_contractor_insurance',
        name: 'Heavy Machinery + No Contractor Insurance',
        conditions: [['CON_014', 'Yes'], ['CON_015', 'No']],
        penalty: 14,
        description: 'Heavy machinery operation without contractor insurance'
      },
      {
        id: 'no_accident_cover_no_penalty',
        name: 'No Accident Cover + No Penalty Protection',
        conditions: [['CON_016', 'No'], ['CON_017', 'No']],
        penalty: 8,
        description: 'Workers unprotected and no penalty protection'
      },
      {
        id: 'high_project_count_no_insurance',
        name: 'Many Projects + No Contractor Insurance',
        conditions: [['CON_013', 'More than 5'], ['CON_015', 'No']],
        penalty: 10,
        description: 'High volume of projects without adequate insurance'
      },
      {
        id: 'con_incidents_no_procedures',
        name: 'Site Incidents + No Emergency Procedures',
        conditions: [['CON_012', 'Yes'], ['CON_020', 'No']],
        penalty: 12,
        description: 'Construction operation with accident history and no emergency procedures'
      },
      {
        id: 'con_no_fire_extinguishers_poor_maintenance',
        name: 'No Fire Extinguishers + Poor Building Maintenance',
        conditions: [['CON_021', 'No'], ['CON_027', ["Rarely","Never"]]],
        penalty: 8,
        description: 'Fire safety equipment gaps combined with poor facility maintenance'
      }
    ],
    improvements: {
      CON_015: { 'No': { target: 'Yes', gain: 12, action: 'Protect your construction projects against site damage and loss with contractor\'s all-risk insurance' } },
      CON_016: { 'No': { target: 'Yes', gain: 8, action: 'Protect your workers and your business against accident-related costs with group personal accident cover' } },
      CON_017: { 'No': { target: 'Yes', gain: 6, action: 'Add delay penalty protection to your contracts so a project delay doesn\'t create financial liability' } },
      CON_012: {
        'Yes': { target: 'No', gain: 6, action: 'Strengthen on-site safety governance so your team can investigate and prevent incidents effectively' },
      },
      CON_020: {
        'No': { target: 'Yes', gain: 10, action: 'Document emergency procedures so your team can respond effectively to site accidents and fire' },
      },
      CON_021: {
        'No': { target: 'Yes', gain: 10, action: 'Install fire extinguishers across all work sites and establish regular inspections to protect your people and property' },
      },
      CON_022: {
        'No': { target: 'Yes', gain: 10, action: 'Build financial reserves to sustain operations during a one-month project halt' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review financial resilience and develop a project disruption contingency plan' },
      },
      CON_023: {
        'Designated Safety Officer': { target: 'Project Manager', gain: 3, action: 'Upgrade safety oversight to senior project management so safety governance has proper authority on site' },
        'External Consultant': { target: 'Project Manager', gain: 7, action: 'Bring safety governance in-house under senior project management to strengthen on-site accountability' },
        'No one specifically assigned': { target: 'Project Manager', gain: 10, action: 'Designate a senior project manager for site health and safety so responsibilities are clearly owned' },
      },
      CON_024: {
        'No': { target: 'Yes', gain: 10, action: 'Secure goods-in-transit insurance to protect your tools and materials against loss or damage during transit' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review supply chain operations and obtain goods-in-transit cover to protect your materials' },
      },
      CON_025: {
        'No': { target: 'Yes', gain: 10, action: 'Train equipment operators in preventive maintenance to reduce machinery breakdown risk on site' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Audit maintenance skills and establish a training program to close skill gaps and prevent site breakdowns' },
      },
      CON_026: {
        'No': { target: 'Yes', gain: 10, action: 'Establish regular vehicle safety inspections to keep your site vehicles safe and operational' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Document vehicle inspection procedures and set up a schedule to ensure site fleet safety' },
      },
      CON_027: {
        'Quarterly': { target: 'Monthly', gain: 2, action: 'Increase site maintenance inspections to monthly frequency to catch issues early' },
        'Annually': { target: 'Monthly', gain: 5, action: 'Increase site maintenance inspections to monthly frequency to catch issues early' },
        'Rarely': { target: 'Monthly', gain: 8, action: 'Establish regular monthly site maintenance inspections to prevent undetected deterioration' },
        'Never': { target: 'Monthly', gain: 10, action: 'Begin conducting regular monthly site maintenance inspections to prevent small issues from escalating' },
      }
    }
  },

  TRN: {
    name: 'Transport Protection',
    pillars: [
      { id: 'fleet', name: 'Fleet Management', weight: 0.25 },
      { id: 'insurance', name: 'Insurance', weight: 0.30 },
      { id: 'worker_protection', name: 'Worker Protection', weight: 0.20 },
      { id: 'compliance', name: 'Compliance', weight: 0.25 }
    ],
    categories: {
      fleet_exposure: { name: 'Fleet Exposure', pillar: 'fleet' },
      fleet_insurance: { name: 'Fleet Insurance', pillar: 'insurance' },
      driver_accident: { name: 'Driver Accident Cover', pillar: 'worker_protection' },
      motor_compliance: { name: 'Motor Compliance', pillar: 'compliance' },
      fleet_incidents: { name: 'Fleet Incidents', pillar: 'fleet' },
      emergency_procedures: { name: 'Emergency Procedures', pillar: 'fleet' },
      fire_safety: { name: 'Fire Safety', pillar: 'compliance' },
      financial_continuity: { name: 'Financial Continuity', pillar: 'insurance' },
      compliance_governance: { name: 'Compliance Governance', pillar: 'compliance' },
      driver_training: { name: 'Driver Training', pillar: 'worker_protection' },
      vehicle_inspections: { name: 'Vehicle Inspections', pillar: 'fleet' },
      fire_alarm: { name: 'Fire Alarm', pillar: 'compliance' },
      depot_maintenance: { name: 'Depot Maintenance', pillar: 'fleet' }
    },
    questions: {
      TRN_013: {
        category: 'fleet_exposure',
        weight: 3,
        scores: { '1-5': 100, '6-20': 55, 'Over 20': 20 },
        gaps: { 'Over 20': 'Large fleet creates significant cumulative risk exposure.' },
        recommendations: { 'Over 20': 'Implement fleet-wide risk management and comprehensive insurance.' }
      },
      TRN_015: {
        category: 'fleet_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'Not Applicable': 70, 'No': 0 },
        gaps: { 'No': 'No fleet insurance for goods in transit.' },
        recommendations: { 'No': 'Get comprehensive goods-in-transit insurance.' }
      },
      TRN_016: {
        category: 'driver_accident',
        weight: 2,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No group personal accident cover for drivers.' },
        recommendations: { 'No': 'Get group personal accident cover for all drivers.' }
      },
      TRN_017: {
        category: 'motor_compliance',
        weight: 5,
        scores: { 'Yes': 100, 'Some of them': 50, 'No': 0 },
        gaps: { 'No': 'Vehicles not covered by comprehensive motor insurance.', 'Some of them': 'Only some vehicles have comprehensive motor insurance.' },
        recommendations: { 'No': 'Get comprehensive motor insurance for all fleet vehicles.', 'Some of them': 'Extend comprehensive motor insurance to entire fleet.' }
      },
      TRN_012: {
        category: 'fleet_incidents',
        weight: 3,
        scores: {'No':100,'Yes':40},
        gaps: {'Yes':'Fleet incidents indicate safety gaps in your transport operation.'},
        recommendations: {'Yes':'Conduct a full fleet safety audit and review incident response protocols.'}
      },
      TRN_020: {
        category: 'emergency_procedures',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'No written emergency procedures for accidents or incidents.'},
        recommendations: {'No':'Develop and document written emergency procedures for accidents and incidents.'}
      },
      TRN_021: {
        category: 'fire_safety',
        weight: 2,
        scores: {'Yes':100,'No':0},
        gaps: {'No':'Fire extinguishers not regularly inspected or available across your facility.'},
        recommendations: {'No':'Install fire extinguishers across all areas and establish regular inspection schedule.'}
      },
      TRN_022: {
        category: 'financial_continuity',
        weight: 3,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Your operation lacks resilience to absorb this risk.','Not sure':'Uncertainty about your ability to handle this risk.'},
        recommendations: {'No':'Develop a contingency plan to address this risk.','Not sure':'Assess your current position and develop a contingency plan.'}
      },
      TRN_023: {
        category: 'compliance_governance',
        weight: 1,
        scores: {'Fleet Manager':100,'Designated Compliance Officer':67,'External Consultant':33,'No one specifically assigned':0},
        gaps: {'Designated Compliance Officer':'Answer \'Designated Compliance Officer\' indicates an area for improvement.','External Consultant':'Answer \'External Consultant\' indicates an area for improvement.','No one specifically assigned':'No one is specifically responsible for this critical area.'},
        recommendations: {'Designated Compliance Officer':'Review your approach to \'Designated Compliance Officer\' and develop an improvement plan.','External Consultant':'Review your approach to \'External Consultant\' and develop an improvement plan.','No one specifically assigned':'Designate a responsible person or team for this critical area.'}
      },
      TRN_024: {
        category: 'driver_training',
        weight: 3,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Vehicle operators are not trained in safe operating procedures.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Address this gap to strengthen your protection.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      TRN_025: {
        category: 'vehicle_inspections',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'Vehicle operators are not trained in safe operating procedures.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Implement safe operating procedures training for all vehicle and equipment operators.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      TRN_026: {
        category: 'fire_alarm',
        weight: 2,
        scores: {'Yes':100,'No':0,'Not sure':30},
        gaps: {'No':'No regular vehicle safety inspections conducted.','Not sure':'Uncertainty about this area indicates a gap in your management.'},
        recommendations: {'No':'Establish a regular vehicle safety inspection schedule.','Not sure':'Review your current practices and documentation to address this uncertainty.'}
      },
      TRN_027: {
        category: 'depot_maintenance',
        weight: 1,
        scores: {'Monthly':100,'Quarterly':80,'Annually':50,'Rarely':20,'Never':0},
        gaps: {'Quarterly':'Answer \'Quarterly\' indicates an area for improvement.','Annually':'Answer \'Annually\' indicates an area for improvement.','Rarely':'Maintenance inspections are only conducted rarely, increasing risk.','Never':'No maintenance inspections are conducted, allowing issues to go undetected.'},
        recommendations: {'Quarterly':'Review your approach to \'Quarterly\' and develop an improvement plan.','Annually':'Review your approach to \'Annually\' and develop an improvement plan.','Rarely':'Establish a regular maintenance inspection schedule.','Never':'Begin conducting regular maintenance inspections at least annually.'}
      }
    },
    modifiers: [
      {
        id: 'large_fleet_no_comprehensive',
        name: 'Large Fleet + No Comprehensive Cover',
        conditions: [['TRN_013', 'Over 20'], ['TRN_017', ['No', 'Some of them']]],
        penalty: 12,
        description: 'Large fleet without comprehensive motor insurance'
      },
      {
        id: 'no_driver_cover_no_transit_cover',
        name: 'No Driver Cover + No Transit Insurance',
        conditions: [['TRN_016', 'No'], ['TRN_015', 'No']],
        penalty: 10,
        description: 'Drivers unprotected and goods in transit uninsured'
      },
      {
        id: 'trn_incidents_no_procedures',
        name: 'Fleet Incidents + No Emergency Procedures',
        conditions: [['TRN_012', 'Yes'], ['TRN_020', 'No']],
        penalty: 12,
        description: 'Transport operation with accident history and no emergency procedures'
      },
      {
        id: 'trn_no_fire_extinguishers_poor_maintenance',
        name: 'No Fire Extinguishers + Poor Building Maintenance',
        conditions: [['TRN_021', 'No'], ['TRN_027', ["Rarely","Never"]]],
        penalty: 8,
        description: 'Fire safety equipment gaps combined with poor facility maintenance'
      }
    ],
    improvements: {
      TRN_015: { 'No': { target: 'Yes', gain: 10, action: 'Protect your cargo against loss or damage during transportation with goods-in-transit insurance' } },
      TRN_016: { 'No': { target: 'Yes', gain: 8, action: 'Protect your drivers and your business against accident-related costs with group personal accident cover' } },
      TRN_017: { 'No': { target: 'Some of them', gain: 6, action: 'Start with comprehensive insurance for your high-value vehicles to protect your most critical fleet assets' } },
      TRN_012: {
        'Yes': { target: 'No', gain: 6, action: 'Strengthen fleet safety governance so your team can investigate and prevent accidents effectively' },
      },
      TRN_020: {
        'No': { target: 'Yes', gain: 10, action: 'Document emergency procedures so your drivers know how to respond effectively to road accidents and fleet incidents' },
      },
      TRN_021: {
        'No': { target: 'Yes', gain: 10, action: 'Install fire extinguishers across your depot and vehicles and establish regular inspections to protect your fleet and people' },
      },
      TRN_022: {
        'No': { target: 'Yes', gain: 10, action: 'Build financial reserves to sustain operations during a one-month fleet suspension' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Review financial resilience and develop a fleet disruption contingency plan' },
      },
      TRN_023: {
        'Designated Compliance Officer': { target: 'Fleet Manager', gain: 3, action: 'Upgrade compliance oversight to senior fleet management so compliance governance has proper authority' },
        'External Consultant': { target: 'Fleet Manager', gain: 7, action: 'Bring compliance governance in-house under senior fleet management to strengthen accountability' },
        'No one specifically assigned': { target: 'Fleet Manager', gain: 10, action: 'Designate a senior fleet manager for safety and compliance so responsibilities are clearly owned' },
      },
      TRN_024: {
        'No': { target: 'Yes', gain: 10, action: 'Train all drivers in defensive driving and first aid to reduce accident risk and improve emergency response' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Audit driver training credentials and establish a training program to close skill gaps and improve road safety' },
      },
      TRN_025: {
        'No': { target: 'Yes', gain: 10, action: 'Establish regular vehicle safety inspections to keep your entire fleet safe and roadworthy' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Document vehicle inspection procedures and set up a schedule to ensure consistent fleet safety' },
      },
      TRN_026: {
        'No': { target: 'Yes', gain: 10, action: 'Install a fire alarm system in your depot and establish regular testing to protect your facility and fleet' },
        'Not sure': { target: 'Yes', gain: 7, action: 'Verify fire alarm system functionality and set up regular testing to ensure your depot fire safety is reliable' },
      },
      TRN_027: {
        'Quarterly': { target: 'Monthly', gain: 2, action: 'Increase depot and yard maintenance inspections to monthly frequency to catch issues early' },
        'Annually': { target: 'Monthly', gain: 5, action: 'Increase depot and yard maintenance inspections to monthly frequency to catch issues early' },
        'Rarely': { target: 'Monthly', gain: 8, action: 'Establish regular monthly depot and yard maintenance inspections to prevent undetected deterioration' },
        'Never': { target: 'Monthly', gain: 10, action: 'Begin conducting regular monthly depot and yard maintenance inspections to prevent small issues from escalating' },
      }
    }
  },


  HOT: {
    name: 'Hotels & Hospitality Resilience',
    evidenceValidation: {
      minCoreAnswers: 12,
      minPillarsCovered: 5,
      coreQuestions: ['HOT_012','HOT_013','HOT_014','HOT_015','HOT_016','HOT_017','HOT_019','HOT_020','HOT_021','HOT_022','HOT_023','HOT_024','HOT_025','HOT_026','HOT_027','HOT_028','HOT_029','HOT_030','HOT_031','HOT_032'],
      pillarMap: {
        HOT_010: 'guest_safety', HOT_011: 'guest_safety',
        HOT_012: 'fire_property', HOT_013: 'fire_property', HOT_014: 'fire_property',
        HOT_015: 'fire_property', HOT_016: 'fire_property',
        HOT_017: 'guest_safety', HOT_019: 'guest_safety',
        HOT_020: 'operational_resilience', HOT_021: 'operational_resilience', HOT_022: 'operational_resilience', HOT_023: 'operational_resilience',
        HOT_024: 'business_continuity', HOT_025: 'business_continuity', HOT_026: 'business_continuity',
        HOT_027: 'employee_safety', HOT_028: 'employee_safety',
        HOT_029: 'security', HOT_030: 'security',
        HOT_031: 'financial_regulatory', HOT_032: 'financial_regulatory',
        HOT_035: 'guest_safety', HOT_036: 'fire_property',
        HOT_038: 'guest_safety', HOT_040: 'guest_safety', HOT_042: 'guest_safety',
        HOT_044: 'guest_safety', HOT_046: 'guest_safety', HOT_048: 'fire_property'
      }
    },
    pillars: [
      { id: 'guest_safety', name: 'Guest Safety & Liability', weight: 0.20 },
      { id: 'fire_property', name: 'Fire & Property Protection', weight: 0.20 },
      { id: 'business_continuity', name: 'Business Continuity', weight: 0.15 },
      { id: 'employee_safety', name: 'Employee Safety & Welfare', weight: 0.12 },
      { id: 'security', name: 'Security & Guest Protection', weight: 0.12 },
      { id: 'operational_resilience', name: 'Operational & Facility Resilience', weight: 0.11 },
      { id: 'financial_regulatory', name: 'Financial & Regulatory Resilience', weight: 0.10 }
    ],
    categories: {
      hotel_profile: { name: 'Hotel Profile & Classification', pillar: 'guest_safety' },
      facility_safety: { name: 'Facility Safety & Compliance', pillar: 'guest_safety' },
      food_safety: { name: 'Food Safety & Hygiene', pillar: 'guest_safety' },
      guest_liability: { name: 'Guest Liability & Incidents', pillar: 'guest_safety' },
      fire_detection: { name: 'Fire Detection & Suppression', pillar: 'fire_property' },
      property_protection: { name: 'Property & Asset Protection', pillar: 'fire_property' },
      emergency_governance: { name: 'Emergency & Crisis Governance', pillar: 'fire_property' },
      closure_resilience: { name: 'Closure & Revenue Resilience', pillar: 'business_continuity' },
      staff_safety: { name: 'Staff Safety & Training', pillar: 'employee_safety' },
      access_security: { name: 'Access & Security Systems', pillar: 'security' },
      generator_hvac: { name: 'Generator & Power Resilience', pillar: 'operational_resilience' },
      equipment_facility: { name: 'Equipment & Facility Maintenance', pillar: 'operational_resilience' },
      cyber_protection: { name: 'Cyber & Data Protection', pillar: 'financial_regulatory' },
      financial_controls: { name: 'Financial Controls & Insurance', pillar: 'financial_regulatory' }
    },
    questions: {
      HOT_010: {
        category: 'hotel_profile',
        weight: 3,
        scores: { 'Budget / Guest House': 100, 'Mid-range': 80, 'Business Hotel': 65, 'Boutique Hotel': 60, 'Luxury Hotel': 40, 'Resort': 35, 'Serviced Apartment': 70, 'Conference / Event Hotel': 30 },
        gaps: { 'Resort': 'High-complexity operation with recreation, events and extensive guest services increases exposure.', 'Conference / Event Hotel': 'Large event spaces with crowd management and AV equipment create unique risks.' },
        recommendations: { 'Resort': 'Implement resort-level risk management with pool, spa and event safety programmes.', 'Conference / Event Hotel': 'Ensure comprehensive crowd management, AV safety and event liability coverage.' }
      },
      HOT_011: {
        category: 'hotel_profile',
        weight: 3,
        scores: { 'Under 30 rooms': 100, '30-75 rooms': 80, '76-150 rooms': 60, '151-300 rooms': 35, 'Over 300 rooms': 20 },
        gaps: { '151-300 rooms': 'Large hotel with significant guest liability exposure across many rooms.', 'Over 300 rooms': 'Very large hotel with high occupancy creates complex safety and liability challenges.' },
        recommendations: { '151-300 rooms': 'Ensure comprehensive public liability and guest safety programmes for high occupancy.', 'Over 300 rooms': 'Implement enterprise-level risk management with dedicated safety teams.' }
      },
      HOT_012: {
        category: 'fire_detection',
        weight: 5,
        scores: { 'Yes — regularly tested': 100, 'Yes — but testing is irregular': 40, 'No': 0, 'Not sure': 20 },
        gaps: { 'No': 'No fire detection system — catastrophic life-safety gap.', 'Not sure': 'Uncertainty about fire detection indicates a critical safety gap.', 'Yes — but testing is irregular': 'Fire detection exists but is not regularly tested.' },
        recommendations: { 'No': 'Install and commission a compliant fire detection system immediately.', 'Not sure': 'Audit fire detection systems and establish testing schedule.', 'Yes — but testing is irregular': 'Establish monthly fire alarm testing with documentation.' }
      },
      HOT_013: {
        category: 'emergency_governance',
        weight: 4,
        scores: { 'Yes — documented and regularly practiced': 100, 'Documented but rarely practiced': 50, 'No': 0, 'Not sure': 20 },
        gaps: { 'No': 'No emergency procedures for fire and guest evacuation.', 'Not sure': 'Uncertainty about emergency procedures indicates a governance gap.', 'Documented but rarely practiced': 'Emergency plan exists but has never been drilled.' },
        recommendations: { 'No': 'Develop written emergency procedures and run quarterly drills.', 'Not sure': 'Audit emergency procedures and establish drill schedule.', 'Documented but rarely practiced': 'Test crisis management with simulations and assign crisis roles.' }
      },
      HOT_014: {
        category: 'fire_detection',
        weight: 3,
        scores: { 'Yes — inspected and maintained': 100, 'No': 0, 'Not sure': 20 },
        gaps: { 'No': 'Fire extinguishers not serviced or accessible.', 'Not sure': 'Uncertainty about firefighting equipment readiness.' },
        recommendations: { 'No': 'Service all extinguishers and ensure accessibility.', 'Not sure': 'Audit firefighting equipment and schedule professional servicing.' }
      },
      HOT_015: {
        category: 'property_protection',
        weight: 4,
        scores: { 'Comprehensive insurance protection': 100, 'Some insurance protection': 50, 'No insurance protection': 0, 'Not sure': 20 },
        gaps: { 'No insurance protection': 'No property insurance — unprotected against fire, storm, flood and burglary.', 'Some insurance protection': 'Partial property insurance with material gaps.', 'Not sure': 'Uncertainty about property insurance coverage.' },
        recommendations: { 'No insurance protection': 'Arrange comprehensive Fire & Special Perils protection.', 'Some insurance protection': 'Review and close gaps in property insurance coverage.', 'Not sure': 'Audit current insurance arrangements and close identified gaps.' }
      },
      HOT_016: {
        category: 'property_protection',
        weight: 3,
        scores: { 'Yes — valued within 12 months': 100, 'Valued but over 12 months ago': 55, 'Never valued / Not sure': 0 },
        gaps: { 'Never valued / Not sure': 'Building and assets not professionally valued — high risk of underinsurance.', 'Valued but over 12 months ago': 'Valuation is becoming outdated as reinstatement costs rise.' },
        recommendations: { 'Never valued / Not sure': 'Commission a professional reinstatement valuation and review sum insured.', 'Valued but over 12 months ago': 'Update your property valuation and asset register.' }
      },
      HOT_017: {
        category: 'guest_liability',
        weight: 4,
        scores: { 'Yes': 30, 'No': 100, 'Not sure': 50 },
        gaps: { 'Yes': 'Previous guest incident significantly increases liability exposure.', 'Not sure': 'Uncertainty about guest incidents indicates a monitoring gap.' },
        recommendations: { 'Yes': 'Review liability protection immediately and implement incident prevention measures.', 'Not sure': 'Establish guest incident tracking and review system.' }
      },
      HOT_019: {
        category: 'guest_liability',
        weight: 4,
        scores: { 'Yes': 100, 'No': 0, 'Not sure': 30 },
        gaps: { 'No': 'No public or occupiers liability protection — critical exposure.', 'Not sure': 'Uncertainty about liability protection indicates a coverage gap.' },
        recommendations: { 'No': 'Arrange Public/Occupiers Liability protection immediately.', 'Not sure': 'Audit current liability coverage and close identified gaps.' }
      },
      HOT_020: {
        category: 'generator_hvac',
        weight: 3,
        scores: { 'Low — grid power is reliable': 100, 'Moderate — backup for outages': 70, 'High — frequent outages': 30, 'Almost completely dependent': 10 },
        gaps: { 'High — frequent outages': 'Heavy generator dependency with frequent outages — operational risk.', 'Almost completely dependent': 'Near-total generator dependency — critical operational vulnerability.' },
        recommendations: { 'High — frequent outages': 'Review backup power strategy and consider additional generators.', 'Almost completely dependent': 'Install additional backup power capacity and review maintenance schedule.' }
      },
      HOT_021: {
        category: 'generator_hvac',
        weight: 3,
        scores: { 'Monthly': 100, 'Quarterly': 75, 'Annually': 50, 'Irregularly': 20, 'Never': 0 },
        gaps: { 'Irregularly': 'Generator servicing is inconsistent — reliability risk.', 'Never': 'No generator servicing — critical failure risk.' },
        recommendations: { 'Irregularly': 'Establish monthly generator servicing schedule.', 'Never': 'Implement immediate monthly generator servicing with documentation.' }
      },
      HOT_022: {
        category: 'generator_hvac',
        weight: 4,
        scores: { 'More than 24 hours': 100, '12–24 hours': 70, '4–12 hours': 40, 'Less than 4 hours': 15, 'We would struggle to operate': 0 },
        gaps: { 'We would struggle to operate': 'Generator failure during peak season would halt operations.', 'Less than 4 hours': 'Very limited operational resilience without generator power.' },
        recommendations: { 'We would struggle to operate': 'Review backup power strategy and establish emergency power protocols.', 'Less than 4 hours': 'Develop generator failure contingency plan and review maintenance.' }
      },
      HOT_023: {
        category: 'equipment_facility',
        weight: 3,
        scores: { 'Monthly preventive schedule': 100, 'Quarterly checks': 70, 'Only when broken': 25, 'No formal schedule': 0 },
        gaps: { 'Only when broken': 'Reactive maintenance allows equipment failure to disrupt guests.', 'No formal schedule': 'No preventive maintenance for critical equipment.' },
        recommendations: { 'Only when broken': 'Move from reactive to preventive maintenance with service contracts.', 'No formal schedule': 'Implement a preventive maintenance register with scheduled servicing.' }
      },
      HOT_024: {
        category: 'closure_resilience',
        weight: 4,
        scores: { 'More than 6 months': 100, '3–6 months': 75, '1–3 months': 45, 'Less than 1 month': 0, 'Not sure': 20 },
        gaps: { 'Less than 1 month': 'Hotel cannot survive without room revenue — critical vulnerability.', '1–3 months': 'Limited revenue resilience — survival risk.', 'Not sure': 'Uncertainty about closure resilience indicates a planning gap.' },
        recommendations: { 'Less than 1 month': 'Build emergency reserves and secure business interruption insurance.', '1–3 months': 'Strengthen business interruption cover and alternative operating arrangements.', 'Not sure': 'Assess closure resilience and develop contingency plans.' }
      },
      HOT_025: {
        category: 'closure_resilience',
        weight: 3,
        scores: { 'Yes — regularly tested': 100, 'Yes — but rarely tested': 60, 'No': 0, 'Not sure': 15 },
        gaps: { 'No': 'No business continuity plan — recovery from major incident will be ad hoc.', 'Not sure': 'Uncertainty about BC plan indicates a governance gap.', 'Yes — but rarely tested': 'Plan exists but has never been tested — may fail when needed.' },
        recommendations: { 'No': 'Develop a documented business continuity plan with quarterly testing.', 'Not sure': 'Audit business continuity preparedness and establish a plan.', 'Yes — but rarely tested': 'Schedule regular BC drills and update procedures based on findings.' }
      },
      HOT_026: {
        category: 'closure_resilience',
        weight: 3,
        scores: { 'More than 6 months': 100, '3–6 months': 70, '1–3 months': 40, 'Less than 1 month': 0, 'Not sure': 20 },
        gaps: { 'Less than 1 month': 'Hotel cannot survive without room revenue — critical vulnerability.', '1–3 months': 'Limited revenue resilience — survival risk.', 'Not sure': 'Uncertainty about revenue resilience indicates a planning gap.' },
        recommendations: { 'Less than 1 month': 'Build revenue reserves and diversify income streams.', '1–3 months': 'Extend revenue reserves and review business interruption coverage.', 'Not sure': 'Assess revenue resilience and develop alternative income strategies.' }
      },
      HOT_027: {
        category: 'staff_safety',
        weight: 3,
        scores: { 'Yes — documented and regularly reviewed': 100, 'Partially': 50, 'No': 0, 'Not sure': 20 },
        gaps: { 'No': 'No staff safety procedures — injury and liability risk.', 'Partially': 'Staff safety procedures incomplete.', 'Not sure': 'Uncertainty about staff safety indicates a governance gap.' },
        recommendations: { 'No': 'Establish documented staff safety procedures with incident reporting.', 'Partially': 'Complete and formalize staff safety procedures.', 'Not sure': 'Audit staff safety procedures and establish documentation.' }
      },
      HOT_028: {
        category: 'staff_safety',
        weight: 2,
        scores: { 'Yes': 100, 'Some employees': 55, 'No': 0, 'Not sure': 20 },
        gaps: { 'No': 'No formal employee protection — staff welfare and retention risk.', 'Some employees': 'Partial employee protection — inequality and compliance risk.', 'Not sure': 'Uncertainty about employee benefits indicates a gap.' },
        recommendations: { 'No': 'Review Group Life, Personal Accident and employee benefit options.', 'Some employees': 'Extend employee protection to all eligible staff.', 'Not sure': 'Audit current employee benefit arrangements.' }
      },
      HOT_029: {
        category: 'access_security',
        weight: 3,
        scores: { 'Formal security procedures with trained personnel and monitoring': 100, 'Basic security procedures': 60, 'Informal security arrangements': 25, 'Significant gaps': 0, 'Not sure': 20 },
        gaps: { 'Significant gaps': 'Major security gaps — guests, property and staff are unprotected.', 'Informal security arrangements': 'Security is informal — inconsistent protection.', 'Not sure': 'Uncertainty about security management.' },
        recommendations: { 'Significant gaps': 'Implement formal security procedures with trained personnel.', 'Informal security arrangements': 'Formalize security procedures and assign trained personnel.', 'Not sure': 'Audit security arrangements and establish formal procedures.' }
      },
      HOT_030: {
        category: 'access_security',
        weight: 2,
        scores: { 'Yes — actively monitored': 100, 'Yes — but monitoring is limited': 55, 'No': 0, 'Not sure': 15 },
        gaps: { 'No': 'No CCTV — no visual deterrence or incident evidence.', 'Yes — but monitoring is limited': 'CCTV exists but monitoring is limited — reduced effectiveness.' },
        recommendations: { 'No': 'Install CCTV coverage for key areas with active monitoring.', 'Yes — but monitoring is limited': 'Enhance CCTV monitoring and ensure adequate coverage.' }
      },
      HOT_031: {
        category: 'financial_controls',
        weight: 2,
        scores: { 'POS system with audit trail': 100, 'Basic controls, some manual processes': 55, 'Minimal controls': 20, 'Not sure': 30 },
        gaps: { 'Minimal controls': 'Minimal financial controls — fraud and cash loss risk.', 'Not sure': 'Uncertainty about financial controls indicates governance gap.', 'Basic controls, some manual processes': 'Financial controls have manual processes creating vulnerability.' },
        recommendations: { 'Minimal controls': 'Implement POS system with audit trail and segregation of duties.', 'Not sure': 'Review financial controls and establish audit procedures.', 'Basic controls, some manual processes': 'Reduce manual processes and implement automated controls.' }
      },
      HOT_032: {
        category: 'financial_controls',
        weight: 3,
        scores: { 'Comprehensive (Fire + BI + Liability)': 100, 'Partial coverage': 50, 'None / Not sure': 0 },
        gaps: { 'None / Not sure': 'No comprehensive insurance programme — property, liability and interruption unprotected.', 'Partial coverage': 'Insurance programme has material gaps.' },
        recommendations: { 'None / Not sure': 'Arrange Fire & Special Perils, Business Interruption and Public Liability review.', 'Partial coverage': 'Review sums insured and close gaps in business interruption and liability.' }
      },
      HOT_035: {
        category: 'food_safety',
        weight: 3,
        scores: { 'Daily': 100, 'Weekly': 80, 'Monthly': 60, 'Rarely': 20, 'Never': 0 },
        gaps: { 'Rarely': 'Kitchen fire risks not regularly inspected — potential fire and safety hazard.', 'Never': 'No kitchen fire risk inspection — critical safety gap.' },
        recommendations: { 'Rarely': 'Establish daily kitchen fire risk checks and weekly formal inspections.', 'Never': 'Implement immediate daily kitchen fire risk inspections with documentation.' }
      },
      HOT_036: {
        category: 'food_safety',
        weight: 3,
        scores: { 'Formal procedures and regular inspections': 100, 'Procedures exist but monitoring is inconsistent': 55, 'Informal controls': 25, 'No formal controls': 0, 'Not sure / N/A': 40 },
        gaps: { 'Informal controls': 'Food safety controls are informal — contamination risk.', 'No formal controls': 'No formal food safety controls — critical health risk.', 'Procedures exist but monitoring is inconsistent': 'Food safety monitoring is inconsistent.' },
        recommendations: { 'Informal controls': 'Implement formal food safety procedures with documentation.', 'No formal controls': 'Establish comprehensive food safety programme immediately.', 'Procedures exist but monitoring is inconsistent': 'Strengthen food safety monitoring and documentation.' }
      },
      HOT_038: {
        category: 'facility_safety',
        weight: 3,
        scores: { 'Yes — documented and maintained': 100, 'Partially — some procedures exist': 50, 'No': 0 },
        gaps: { 'Partially — some procedures exist': 'Pool safety procedures incomplete — drowning and injury risk.', 'No': 'No documented pool safety procedures — critical liability gap.' },
        recommendations: { 'Partially — some procedures exist': 'Complete pool safety documentation and establish supervision protocols.', 'No': 'Implement comprehensive pool safety procedures with barriers, signage and trained supervision.' }
      },
      HOT_040: {
        category: 'facility_safety',
        weight: 2,
        scores: { 'Yes — regular inspection schedule': 100, 'Partially — occasional checks': 50, 'No': 0 },
        gaps: { 'Partially — occasional checks': 'Gym equipment inspection is inconsistent — injury risk.', 'No': 'No gym equipment inspection — liability exposure.' },
        recommendations: { 'Partially — occasional checks': 'Establish regular gym equipment inspection schedule.', 'No': 'Implement daily gym equipment checks with documented maintenance.' }
      },
      HOT_042: {
        category: 'facility_safety',
        weight: 2,
        scores: { 'Yes — documented and inspected': 100, 'Partially — some procedures': 50, 'No': 0 },
        gaps: { 'Partially — some procedures': 'Spa safety procedures incomplete.', 'No': 'No spa safety procedures — liability exposure.' },
        recommendations: { 'Partially — some procedures': 'Complete spa safety documentation and inspection schedule.', 'No': 'Implement comprehensive spa safety procedures with trained staff.' }
      },
      HOT_044: {
        category: 'facility_safety',
        weight: 2,
        scores: { 'Yes — documented and tested': 100, 'Documented but not tested': 50, 'No': 0 },
        gaps: { 'Documented but not tested': 'Event procedures not tested — may fail during emergency.', 'No': 'No event crowd management procedures — safety risk.' },
        recommendations: { 'Documented but not tested': 'Test event procedures with drills and assign crowd management roles.', 'No': 'Develop event crowd management and evacuation procedures.' }
      },
      HOT_046: {
        category: 'facility_safety',
        weight: 2,
        scores: { 'Yes — documented schedule': 100, 'Partially — occasional checks': 50, 'No': 0 },
        gaps: { 'Partially — occasional checks': 'Vehicle inspection is inconsistent — accident risk.', 'No': 'No vehicle inspection — significant liability exposure.' },
        recommendations: { 'Partially — occasional checks': 'Establish documented vehicle inspection schedule.', 'No': 'Implement immediate vehicle inspection programme with maintenance records.' }
      },
      HOT_048: {
        category: 'facility_safety',
        weight: 2,
        scores: { 'Formal procedures with regular checks': 100, 'Basic controls': 55, 'Informal controls': 20, 'No formal controls': 0 },
        gaps: { 'Informal controls': 'Laundry safety controls are informal — fire and chemical risk.', 'No formal controls': 'No laundry safety controls — critical operational risk.' },
        recommendations: { 'Informal controls': 'Implement formal laundry safety procedures with fire prevention and chemical handling.', 'No formal controls': 'Establish comprehensive laundry safety programme immediately.' }
      }
    },
    modifiers: [
      {
        id: 'pool_no_safety',
        name: 'Pool + No Safety Procedures',
        conditions: [['HOT_037', 'Yes'], ['HOT_038', 'No']],
        penalty: 12,
        description: 'Swimming pool without documented safety procedures and supervision'
      },
      {
        id: 'kitchen_no_fire_inspection',
        name: 'Kitchen + No Fire Risk Inspection',
        conditions: [['HOT_034', 'Yes'], ['HOT_035', ['Rarely', 'Never']]],
        penalty: 10,
        description: 'Commercial kitchen with inadequate fire risk inspection'
      },
      {
        id: 'no_fire_detection',
        name: 'No Fire Detection System',
        conditions: [['HOT_012', ['No', 'Not sure']]],
        penalty: 15,
        description: 'No functional fire detection system — catastrophic life-safety gap'
      },
      {
        id: 'large_hotel_no_closures',
        name: 'Large Hotel + Cannot Survive Closure',
        conditions: [['HOT_011', ['151-300 rooms', 'Over 300 rooms']], ['HOT_024', ['Less than 1 month', '1–3 months']]],
        penalty: 12,
        description: 'Large hotel cannot survive prolonged closure'
      },
      {
        id: 'generator_failure_critical',
        name: 'Generator Failure Stops Operations',
        conditions: [['HOT_022', ['Less than 4 hours', 'We would struggle to operate']], ['HOT_021', ['Irregularly', 'Never']]],
        penalty: 12,
        description: 'Generator failure during peak season would halt operations'
      },
      {
        id: 'no_liability_protection',
        name: 'No Liability Protection + Previous Incident',
        conditions: [['HOT_017', 'Yes'], ['HOT_019', 'No']],
        penalty: 14,
        description: 'Previous guest incident without liability protection — critical exposure'
      },
      {
        id: 'no_bc_plan',
        name: 'No Business Continuity Plan',
        conditions: [['HOT_025', 'No'], ['HOT_024', ['Less than 1 month', '1–3 months']]],
        penalty: 10,
        description: 'No BC plan with limited financial resilience'
      },
      {
        id: 'positive_hotel_resilience',
        name: 'Strong Fire Detection + Emergency Plan + Insurance',
        conditions: [['HOT_012', 'Yes — regularly tested'], ['HOT_013', 'Yes — documented and regularly practiced'], ['HOT_032', 'Comprehensive (Fire + BI + Liability)']],
        bonus: 10,
        description: 'Strong hotel resilience combination'
      }
    ],
    improvements: {
      HOT_012: { 'No': { target: 'Yes — regularly tested', gain: 15, action: 'Install and regularly test your fire detection system — this is a life-safety priority' }, 'Not sure': { target: 'Yes — regularly tested', gain: 10, action: 'Audit fire detection systems and establish testing schedule' }, 'Yes — but testing is irregular': { target: 'Yes — regularly tested', gain: 8, action: 'Set up monthly fire alarm testing with documentation' } },
      HOT_013: { 'No': { target: 'Yes — documented and regularly practiced', gain: 12, action: 'Develop written emergency procedures and run quarterly drills' }, 'Not sure': { target: 'Yes — documented and regularly practiced', gain: 8, action: 'Audit emergency procedures and establish drill schedule' }, 'Documented but rarely practiced': { target: 'Yes — documented and regularly practiced', gain: 6, action: 'Test crisis management with simulations and assign crisis roles' } },
      HOT_014: { 'No': { target: 'Yes — inspected and maintained', gain: 8, action: 'Service all fire extinguishers and ensure accessibility' }, 'Not sure': { target: 'Yes — inspected and maintained', gain: 5, action: 'Audit and service your firefighting equipment' } },
      HOT_015: { 'No insurance protection': { target: 'Comprehensive insurance protection', gain: 12, action: 'Arrange comprehensive Fire & Special Perils protection' }, 'Some insurance protection': { target: 'Comprehensive insurance protection', gain: 6, action: 'Review and close gaps in property insurance coverage' }, 'Not sure': { target: 'Comprehensive insurance protection', gain: 8, action: 'Audit current insurance arrangements and close identified gaps' } },
      HOT_016: { 'Never valued / Not sure': { target: 'Yes — valued within 12 months', gain: 10, action: 'Commission a professional reinstatement valuation and review sum insured' }, 'Valued but over 12 months ago': { target: 'Yes — valued within 12 months', gain: 5, action: 'Update your property valuation and asset register' } },
      HOT_017: { 'Yes': { target: 'No', gain: 8, action: 'Review liability protection immediately and implement incident prevention measures' } },
      HOT_019: { 'No': { target: 'Yes', gain: 10, action: 'Arrange Public/Occupiers Liability protection immediately' }, 'Not sure': { target: 'Yes', gain: 6, action: 'Audit current liability coverage and close identified gaps' } },
      HOT_021: { 'Irregularly': { target: 'Monthly', gain: 8, action: 'Establish monthly generator servicing schedule' }, 'Never': { target: 'Monthly', gain: 12, action: 'Implement immediate monthly generator servicing with documentation' } },
      HOT_022: { 'We would struggle to operate': { target: 'More than 24 hours', gain: 12, action: 'Review backup power strategy and establish emergency power protocols' }, 'Less than 4 hours': { target: 'More than 24 hours', gain: 8, action: 'Develop generator failure contingency plan and review maintenance' } },
      HOT_024: { 'Less than 1 month': { target: 'More than 6 months', gain: 15, action: 'Build emergency reserves and secure business interruption insurance' }, '1–3 months': { target: 'More than 6 months', gain: 6, action: 'Strengthen business interruption cover and alternative operating arrangements' } },
      HOT_025: { 'No': { target: 'Yes — regularly tested', gain: 10, action: 'Develop a documented business continuity plan with quarterly testing' }, 'Not sure': { target: 'Yes — regularly tested', gain: 6, action: 'Audit business continuity preparedness and establish a plan' }, 'Yes — but rarely tested': { target: 'Yes — regularly tested', gain: 4, action: 'Schedule regular BC drills and update procedures' } },
      HOT_026: { 'Less than 1 month': { target: 'More than 6 months', gain: 12, action: 'Build revenue reserves and diversify income streams' }, '1–3 months': { target: 'More than 6 months', gain: 6, action: 'Extend revenue reserves and review business interruption coverage' } },
      HOT_027: { 'No': { target: 'Yes — documented and regularly reviewed', gain: 10, action: 'Establish documented staff safety procedures with incident reporting' }, 'Partially': { target: 'Yes — documented and regularly reviewed', gain: 5, action: 'Complete and formalize staff safety procedures' } },
      HOT_028: { 'No': { target: 'Yes', gain: 8, action: 'Review Group Life, Personal Accident and employee benefit options' }, 'Some employees': { target: 'Yes', gain: 4, action: 'Extend employee protection to all eligible staff' } },
      HOT_029: { 'Significant gaps': { target: 'Formal security procedures with trained personnel and monitoring', gain: 10, action: 'Implement formal security procedures with trained personnel' }, 'Informal security arrangements': { target: 'Formal security procedures with trained personnel and monitoring', gain: 6, action: 'Formalize security procedures and assign trained personnel' } },
      HOT_030: { 'No': { target: 'Yes — actively monitored', gain: 8, action: 'Install CCTV coverage for key areas with active monitoring' }, 'Yes — but monitoring is limited': { target: 'Yes — actively monitored', gain: 4, action: 'Enhance CCTV monitoring and ensure adequate coverage' } },
      HOT_031: { 'Minimal controls': { target: 'POS system with audit trail', gain: 8, action: 'Implement POS system with audit trail and segregation of duties' }, 'Not sure': { target: 'POS system with audit trail', gain: 5, action: 'Review financial controls and establish audit procedures' } },
      HOT_032: { 'None / Not sure': { target: 'Comprehensive (Fire + BI + Liability)', gain: 12, action: 'Arrange a comprehensive Fire, Business Interruption and Liability insurance review' }, 'Partial coverage': { target: 'Comprehensive (Fire + BI + Liability)', gain: 6, action: 'Close gaps in your insurance programme' } },
      HOT_035: { 'Rarely': { target: 'Daily', gain: 8, action: 'Establish daily kitchen fire risk checks and weekly formal inspections' }, 'Never': { target: 'Daily', gain: 12, action: 'Implement immediate daily kitchen fire risk inspections with documentation' } },
      HOT_036: { 'No formal controls': { target: 'Formal procedures and regular inspections', gain: 10, action: 'Establish comprehensive food safety programme immediately' }, 'Informal controls': { target: 'Formal procedures and regular inspections', gain: 6, action: 'Implement formal food safety procedures with documentation' }, 'Procedures exist but monitoring is inconsistent': { target: 'Formal procedures and regular inspections', gain: 4, action: 'Strengthen food safety monitoring and documentation' } },
      HOT_038: { 'No': { target: 'Yes — documented and maintained', gain: 10, action: 'Implement comprehensive pool safety procedures with barriers, signage and trained supervision' }, 'Partially — some procedures exist': { target: 'Yes — documented and maintained', gain: 5, action: 'Complete pool safety documentation and establish supervision protocols' } },
      HOT_040: { 'No': { target: 'Yes — regular inspection schedule', gain: 8, action: 'Implement daily gym equipment checks with documented maintenance' }, 'Partially — occasional checks': { target: 'Yes — regular inspection schedule', gain: 4, action: 'Establish regular gym equipment inspection schedule' } },
      HOT_042: { 'No': { target: 'Yes — documented and inspected', gain: 8, action: 'Implement comprehensive spa safety procedures with trained staff' }, 'Partially — some procedures': { target: 'Yes — documented and inspected', gain: 4, action: 'Complete spa safety documentation and inspection schedule' } },
      HOT_044: { 'No': { target: 'Yes — documented and tested', gain: 8, action: 'Develop event crowd management and evacuation procedures' }, 'Documented but not tested': { target: 'Yes — documented and tested', gain: 4, action: 'Test event procedures with drills and assign crowd management roles' } },
      HOT_046: { 'No': { target: 'Yes — documented schedule', gain: 8, action: 'Implement immediate vehicle inspection programme with maintenance records' }, 'Partially — occasional checks': { target: 'Yes — documented schedule', gain: 4, action: 'Establish documented vehicle inspection schedule' } },
      HOT_048: { 'No formal controls': { target: 'Formal procedures with regular checks', gain: 8, action: 'Establish comprehensive laundry safety programme immediately' }, 'Informal controls': { target: 'Formal procedures with regular checks', gain: 5, action: 'Implement formal laundry safety procedures with fire prevention and chemical handling' } }
    }
  },

  SME: {
    name: 'Small Business Protection',
    pillars: [
      { id: 'workforce', name: 'Workforce', weight: 0.20 },
      { id: 'financial', name: 'Financial Exposure', weight: 0.25 },
      { id: 'asset_protection', name: 'Asset Protection', weight: 0.25 },
      { id: 'business_continuity', name: 'Business Continuity', weight: 0.30 }
    ],
    categories: {
      employee_exposure: { name: 'Employee Exposure', pillar: 'workforce' },
      revenue_exposure: { name: 'Revenue Exposure', pillar: 'financial' },
      property_insurance: { name: 'Property Insurance', pillar: 'asset_protection' },
      disaster_survival: { name: 'Disaster Survival', pillar: 'business_continuity' }
    },
    questions: {
      SME_013: {
        category: 'employee_exposure',
        weight: 3,
        scores: { '1-10': 100, '11-50': 55, '51+': 20 },
        gaps: { '51+': 'Large workforce with significant employment liability exposure.' },
        recommendations: { '51+': 'Review comprehensive employer\'s liability and workforce insurance.' }
      },
      SME_014: {
        category: 'revenue_exposure',
        weight: 3,
        scores: { 'Under ₦50M': 100, '₦50M - ₦200M': 55, 'Over ₦200M': 20 },
        gaps: { 'Over ₦200M': 'High revenue business with significant financial exposure.' },
        recommendations: { 'Over ₦200M': 'Ensure all business insurance adequately covers your revenue scale.' }
      },
      SME_016: {
        category: 'property_insurance',
        weight: 5,
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire and burglary insurance for your business.' },
        recommendations: { 'No': 'Get comprehensive fire and burglary insurance.' }
      },
      SME_017: {
        category: 'disaster_survival',
        weight: 2,
        scores: { 'Yes easily': 100, 'With difficulty': 45, 'No, we would close': 0 },
        gaps: { 'No, we would close': 'Business would not survive a 3-month closure.', 'With difficulty': 'Business would struggle to survive a major disaster.' },
        recommendations: { 'No, we would close': 'Create a business continuity plan and ensure adequate insurance.', 'With difficulty': 'Strengthen your business continuity and insurance coverage.' }
      }
    },
    modifiers: [
      {
        id: 'high_revenue_no_property_insurance',
        name: 'High Revenue + No Property Insurance',
        conditions: [['SME_014', 'Over ₦200M'], ['SME_016', 'No']],
        penalty: 12,
        description: 'High-value business without property insurance'
      },
      {
        id: 'no_property_no_disaster',
        name: 'No Property Insurance + Cannot Survive Disaster',
        conditions: [['SME_016', 'No'], ['SME_017', ['No, we would close', 'With difficulty']]],
        penalty: 14,
        description: 'No insurance and no ability to survive a disaster'
      },
      {
        id: 'large_workforce_no_insurance',
        name: 'Large Workforce + No Property Insurance',
        conditions: [['SME_013', '51+'], ['SME_016', 'No']],
        penalty: 8,
        description: 'Many employees with no business property insurance'
      }
    ],
    improvements: {
      SME_013: { '51+': { target: '11-50', gain: 6, action: 'Review comprehensive employer\u2019s liability and workforce insurance' } },
      SME_014: { 'Over \u20A6200M': { target: '\u20A650M - \u20A6200M', gain: 6, action: 'Ensure all business insurance adequately covers your revenue scale' } },
      SME_016: { 'No': { target: 'Yes', gain: 12, action: 'Get comprehensive fire and burglary insurance' } },
      SME_017: { 'No, we would close': { target: 'With difficulty', gain: 10, action: 'Create a business continuity plan' }, 'With difficulty': { target: 'Yes easily', gain: 6, action: 'Strengthen business continuity planning and insurance coverage' } }
    }
  }
};

module.exports = scoringConfigs;