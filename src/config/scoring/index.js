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
        scores: { 'Employed full-time': 100, 'Self-employed': 60, 'Part-time / Freelance': 40, 'Student': 30, 'Retired': 70 },
        gaps: { 'Student': 'No steady income stream creates vulnerability during health emergencies.', 'Part-time / Freelance': 'Variable income makes it harder to absorb unexpected medical costs.' },
        recommendations: { 'Student': 'Build a basic emergency fund and explore health insurance options.', 'Part-time / Freelance': 'Consider a health plan that provides consistent coverage regardless of income fluctuations.' }
      },
      HLT_009: {
        category: 'age_factor',
        scores: { '18 - 25': 100, '26 - 35': 80, '36 - 45': 60, '46 - 55': 40, '56+': 20 },
        gaps: { '56+': 'Your age increases the risk profile for health-related complications.', '46 - 55': 'Age-related health risks are increasing and may need specialized coverage.' },
        recommendations: { '56+': 'Review your health coverage with a focus on age-related care needs.', '46 - 55': 'Consider comprehensive health coverage that addresses age-related risks.' }
      },
      HLT_010: {
        category: 'dependant_burden',
        scores: { 'None': 100, '1': 80, '2': 60, '3': 40, '4+': 20 },
        gaps: { '3': 'Multiple dependants amplify household vulnerability to health-related income shocks.', '4+': 'A large number of dependants creates significant household exposure to health emergencies.' },
        recommendations: { '3': 'Ensure your health and income protection coverage accounts for all dependants.', '4+': 'Review family health insurance and income protection to cover all dependants.' }
      },
      HLT_012: {
        category: 'insurance_coverage',
        scores: { 'Private Health Insurance': 100, 'Employer HMO': 60, 'Government Health Scheme': 50, 'None': 0 },
        gaps: { 'None': 'You do not have active health insurance coverage.' },
        recommendations: { 'None': 'Compare health plans that provide wider hospital coverage.' }
      },
      HLT_013: {
        category: 'emergency_fund',
        scores: { 'Savings': 100, 'Insurance': 80, 'Family/Friends': 40, 'Loan': 25, "I don't know": 0 },
        gaps: { 'Loan': 'You rely on loans or borrowing for emergency medical expenses.', "I don't know": 'You have no plan for emergency medical expenses.' },
        recommendations: { 'Loan': 'Build a medical emergency fund.', "I don't know": 'Create a plan for medical emergencies.' }
      },
      HLT_014: {
        category: 'diagnosed_conditions',
        scores: { 'None': 100, 'Asthma': 50, 'Hypertension': 35, 'Diabetes': 25 },
        gaps: { 'Hypertension': 'You have a chronic condition that requires specialized coverage.', 'Diabetes': 'Diabetes requires consistent care that may not be fully covered.', 'Asthma': 'Asthma management needs regular medical attention.' },
        recommendations: { 'Hypertension': 'Review your HMO benefits to ensure chronic care is covered.', 'Diabetes': 'Ensure your health plan covers diabetes management.', 'Asthma': 'Confirm your insurance covers respiratory care.' }
      },
      HLT_015: {
        category: 'checkup_frequency',
        scores: { 'Every 6 months': 100, 'Annually': 80, 'Rarely/Only when sick': 20 },
        gaps: { 'Rarely/Only when sick': 'You are missing out on early detection through routine check-ups.' },
        recommendations: { 'Rarely/Only when sick': 'Schedule an annual preventive health screening.' }
      },
      HLT_016: {
        category: 'surgery_coverage',
        scores: { 'Yes': 100, 'Not sure': 40, 'No': 0 },
        gaps: { 'No': 'Your current cover is inadequate for major surgical procedures.' },
        recommendations: { 'No': 'Consider Critical Illness Insurance if appropriate for your circumstances.' }
      },
      HLT_017: {
        category: 'illness_resilience',
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
      HLT_010: { '4+': { target: '3', gain: 4, action: 'Ensure dependants have their own health coverage where possible' } },
      HLT_012: { 'None': { target: 'Employer HMO', gain: 8, action: 'Obtain basic health insurance coverage' }, 'Employer HMO': { target: 'Private Health Insurance', gain: 5, action: 'Upgrade to comprehensive private health insurance' } },
      HLT_013: { "I don't know": { target: 'Savings', gain: 10, action: 'Build a dedicated medical emergency fund' }, 'Loan': { target: 'Savings', gain: 8, action: 'Replace loan dependency with emergency savings' } },
      HLT_015: { 'Rarely/Only when sick': { target: 'Annually', gain: 6, action: 'Schedule annual preventive health screenings' } },
      HLT_016: { 'No': { target: 'Yes', gain: 8, action: 'Review and upgrade your health insurance coverage' } }
    }
  },

  INC: {
    name: 'Income Protection',
    pillars: [
      { id: 'financial_resilience', name: 'Financial Resilience', weight: 0.35 },
      { id: 'career_security', name: 'Career & Income Security', weight: 0.25 },
      { id: 'protection', name: 'Protection & Insurance', weight: 0.25 },
      { id: 'debt_management', name: 'Debt Management', weight: 0.15 }
    ],
    categories: {
      income_source: { name: 'Income Source', pillar: 'career_security' },
      emergency_savings: { name: 'Emergency Savings', pillar: 'financial_resilience' },
      income_stability: { name: 'Income Stability', pillar: 'career_security' },
      income_insurance: { name: 'Income Insurance', pillar: 'protection' },
      debt_exposure: { name: 'Debt Exposure', pillar: 'debt_management' }
    },
    questions: {
      INC_011: {
        category: 'income_source',
        scores: { 'Salary from employment': 100, 'Freelance/Contract': 60, 'Business owner': 30 },
        gaps: { 'Freelance/Contract': 'Freelance or contract income can be unpredictable.', 'Business owner': 'Business income is tied to business performance and carries higher risk.' },
        recommendations: { 'Freelance/Contract': 'Build a steady client base and maintain an income buffer for dry periods.', 'Business owner': 'Separate personal and business finances and build business continuity safeguards.' }
      },
      INC_012: {
        category: 'emergency_savings',
        scores: { 'Over 3 months': 100, '1-3 months': 50, 'Less than 1 month': 0 },
        gaps: { 'Less than 1 month': 'Your savings would last less than one month.', '1-3 months': 'Your savings provide only a short buffer.' },
        recommendations: { 'Less than 1 month': 'Build an emergency fund covering at least 3 months of expenses.', '1-3 months': 'Increase your emergency fund to 6 months of expenses.' }
      },
      INC_013: {
        category: 'income_stability',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'You lack confidence in your income stability.' },
        recommendations: { 'No': 'Diversify your income sources and build a career contingency plan.' }
      },
      INC_014: {
        category: 'income_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'You do not have income protection insurance.' },
        recommendations: { 'No': 'Consider income protection insurance to replace earnings if unable to work.' }
      },
      INC_015: {
        category: 'debt_exposure',
        scores: { 'No': 100, 'Yes': 25 },
        gaps: { 'Yes': 'Your debts depend on continued income, creating significant vulnerability.' },
        recommendations: { 'Yes': 'Review debt structure and consider debt protection insurance.' }
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
        id: 'positive_income_resilience',
        name: 'Strong Savings + Income Insurance',
        conditions: [['INC_012', 'Over 3 months'], ['INC_014', 'Yes']],
        bonus: 5,
        description: 'Comprehensive income protection through savings and insurance'
      }
    ],
    improvements: {
      INC_011: { 'Freelance/Contract': { target: 'Salary from employment', gain: 4, action: 'Supplement freelance income with retainer clients or part-time employment' }, 'Business owner': { target: 'Salary from employment', gain: 6, action: 'Diversify income sources and build business stability' } },
      INC_012: { 'Less than 1 month': { target: '1-3 months', gain: 10, action: 'Build an emergency fund covering 1-3 months of expenses' }, '1-3 months': { target: 'Over 3 months', gain: 6, action: 'Expand emergency fund to cover 6+ months' } },
      INC_014: { 'No': { target: 'Yes', gain: 10, action: 'Get income protection insurance' } },
      INC_015: { 'Yes': { target: 'No', gain: 8, action: 'Create a debt reduction plan' } }
    }
  },

  FAM: {
    name: 'Family Protection',
    pillars: [
      { id: 'family_structure', name: 'Family Structure', weight: 0.15 },
      { id: 'career_security', name: 'Career & Income Security', weight: 0.20 },
      { id: 'protection', name: 'Protection & Insurance', weight: 0.25 },
      { id: 'future_planning', name: 'Future Planning', weight: 0.20 },
      { id: 'health_wellbeing', name: 'Health & Wellbeing', weight: 0.20 }
    ],
    categories: {
      dependents: { name: 'Dependents', pillar: 'family_structure' },
      income_resilience: { name: 'Income Resilience', pillar: 'career_security' },
      family_insurance: { name: 'Family Insurance', pillar: 'protection' },
      education_funding: { name: 'Education Funding', pillar: 'future_planning' },
      family_health: { name: 'Family Health', pillar: 'health_wellbeing' }
    },
    questions: {
      FAM_011: {
        category: 'dependents',
        scores: { 'None': 100, '1-2': 60, '3 or more': 30 },
        gaps: { '3 or more': 'Multiple dependents increase financial pressure and risk exposure.' },
        recommendations: { '3 or more': 'Ensure adequate life and health cover for all dependents.' }
      },
      FAM_012: {
        category: 'income_resilience',
        scores: { 'Over 6 months': 100, '3-6 months': 60, 'Less than 3 months': 0 },
        gaps: { 'Less than 3 months': 'Family would struggle financially within 3 months of income loss.', '3-6 months': 'Family has a moderate but limited income buffer.' },
        recommendations: { 'Less than 3 months': 'Build a family emergency fund covering 6+ months.', '3-6 months': 'Strengthen family income reserves to 6+ months.' }
      },
      FAM_013: {
        category: 'family_insurance',
        scores: { 'Yes': 100, 'Not sure': 45, 'No': 0 },
        gaps: { 'No': 'Your family lacks adequate insurance protection.', 'Not sure': 'You are uncertain about your family insurance coverage.' },
        recommendations: { 'No': 'Review and secure comprehensive family insurance coverage.' }
      },
      FAM_014: {
        category: 'education_funding',
        scores: { 'Yes': 100, 'Not applicable': 80, 'No': 0 },
        gaps: { 'No': 'Children\'s education costs are not secured.' },
        recommendations: { 'No': 'Set up an education savings plan or education insurance policy.' }
      },
      FAM_015: {
        category: 'family_health',
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
      FAM_012: { 'Less than 3 months': { target: '3-6 months', gain: 8, action: 'Build family emergency fund to 3-6 months' }, '3-6 months': { target: 'Over 6 months', gain: 5, action: 'Extend family emergency fund beyond 6 months' } },
      FAM_013: { 'No': { target: 'Yes', gain: 10, action: 'Secure comprehensive family insurance' } },
      FAM_014: { 'No': { target: 'Yes', gain: 7, action: 'Start an education savings plan' } },
      FAM_015: { 'No': { target: 'Yes', gain: 8, action: 'Get family health insurance' } }
    }
  },

  RET: {
    name: 'Retirement Readiness',
    pillars: [
      { id: 'retirement_readiness', name: 'Retirement Readiness', weight: 0.25 },
      { id: 'retirement_savings', name: 'Retirement Savings', weight: 0.30 },
      { id: 'healthcare_protection', name: 'Healthcare & Protection', weight: 0.25 },
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
        scores: { 'I already have a written retirement plan': 100, "I'm saving but don't have a clear plan": 60, 'I know I should start planning': 30, "I haven't thought seriously about retirement": 0 },
        gaps: { "I haven't thought seriously about retirement": 'No retirement planning has been started.', 'I know I should start planning': 'Awareness of retirement needs exists but no concrete action taken.', "I'm saving but don't have a clear plan": 'Saving without a structured plan limits long-term effectiveness.' },
        recommendations: { "I haven't thought seriously about retirement": 'Start with a retirement savings plan immediately.', 'I know I should start planning': 'Create a written retirement plan with specific savings targets.', "I'm saving but don't have a clear plan": 'Develop a structured retirement plan with clear goals and timelines.' }
      },
      RET_011: {
        category: 'retirement_horizon',
        scores: { 'Over 15 years': 100, '5-15 years': 60, 'Within 5 years': 20 },
        gaps: { 'Within 5 years': 'Retiring soon with potentially insufficient preparation.', '5-15 years': 'Moderate runway but accelerated savings needed.' },
        recommendations: { 'Within 5 years': 'Conduct a detailed retirement readiness review immediately.', '5-15 years': 'Maximize retirement contributions in the coming years.' }
      },
      RET_012: {
        category: 'pension_savings',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No dedicated pension or retirement savings account.' },
        recommendations: { 'No': 'Open a pension or retirement savings account as soon as possible.' }
      },
      RET_013: {
        category: 'medical_cost_impact',
        scores: { 'Not concerned': 100, 'Somewhat concerned': 55, 'Very concerned': 25 },
        gaps: { 'Very concerned': 'Medical costs pose a significant threat to your retirement savings.', 'Somewhat concerned': 'Rising medical costs could impact your retirement plans.' },
        recommendations: { 'Very concerned': 'Include health cost projections in your retirement plan and consider medical cover.', 'Somewhat concerned': 'Build a medical cost buffer into your retirement savings target.' }
      },
      RET_014: {
        category: 'long_term_care',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No plan for long-term care or critical illness needs.' },
        recommendations: { 'No': 'Consider long-term care insurance or critical illness cover.' }
      },
      RET_015: {
        category: 'legacy_documentation',
        scores: { 'Yes, I have a documented plan': 100, 'Partially - I have some documentation': 50, 'No, not yet': 0 },
        gaps: { 'No, not yet': 'No documented plan for asset distribution or beneficiary nominations.', 'Partially - I have some documentation': 'Partial documentation leaves gaps in your legacy plan.' },
        recommendations: { 'No, not yet': 'Document how your assets should be distributed and nominate beneficiaries for your retirement accounts.', 'Partially - I have some documentation': 'Complete your estate planning documentation and review beneficiary designations.' }
      }
    },
    modifiers: [
      {
        id: 'no_pension_no_care',
        name: 'No Pension + No Long-term Care Plan',
        conditions: [['RET_012', 'No'], ['RET_014', 'No']],
        penalty: 8,
        description: 'No retirement savings and no care plan creates extreme vulnerability'
      },
      {
        id: 'soon_retire_no_pension',
        name: 'Soon to Retire + No Pension Savings',
        conditions: [['RET_011', 'Within 5 years'], ['RET_012', 'No']],
        penalty: 6,
        description: 'Retiring without pension savings requires immediate action'
      },
      {
        id: 'positive_retirement_planning',
        name: 'Pension + Long-term Care Plan',
        conditions: [['RET_012', 'Yes'], ['RET_014', 'Yes']],
        bonus: 5,
        description: 'Comprehensive retirement planning with savings and care coverage'
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
      { id: 'financial_resilience', name: 'Financial Resilience', weight: 0.35 },
      { id: 'income_security', name: 'Income Security', weight: 0.30 },
      { id: 'protection', name: 'Protection & Insurance', weight: 0.35 }
    ],
    categories: {
      career_stability: { name: 'Career Stability', pillar: 'income_security' },
      critical_illness_funding: { name: 'Critical Illness Funding', pillar: 'financial_resilience' },
      income_stability: { name: 'Income Stability', pillar: 'income_security' },
      goal_saving: { name: 'Goal Saving', pillar: 'financial_resilience' },
      personal_insurance: { name: 'Personal Insurance', pillar: 'protection' }
    },
    questions: {
      YPR_011: {
        category: 'career_stability',
        scores: { 'Over 5 years': 100, '2-5 years': 65, 'Under 2 years': 30 },
        gaps: { 'Under 2 years': 'Early career stage with limited income history and stability.', '2-5 years': 'Building career stability but still in growth phase.' },
        recommendations: { 'Under 2 years': 'Focus on career growth and building an emergency fund.', '2-5 years': 'Continue building professional credentials and income stability.' }
      },
      YPR_012: {
        category: 'critical_illness_funding',
        scores: { 'Yes easily': 100, 'With difficulty': 50, 'No': 0 },
        gaps: { 'No': 'Cannot cover critical illness costs.', 'With difficulty': 'Would struggle to cover critical illness costs.' },
        recommendations: { 'No': 'Build an emergency fund and consider critical illness insurance.', 'With difficulty': 'Strengthen your financial buffer for health emergencies.' }
      },
      YPR_013: {
        category: 'income_stability',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'Household would struggle to maintain stability without your income.' },
        recommendations: { 'No': 'Build income resilience through savings and passive income.' }
      },
      YPR_014: {
        category: 'personal_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No personal health or accident insurance.' },
        recommendations: { 'No': 'Consider health and accident insurance to protect against unexpected medical costs.' }
      },
      YPR_015: {
        category: 'goal_saving',
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
      YPR_011: { 'Under 2 years': { target: '2-5 years', gain: 4, action: 'Focus on career growth and professional development' }, '2-5 years': { target: 'Over 5 years', gain: 3, action: 'Build long-term career stability through certifications and networking' } },
      YPR_012: { 'No': { target: 'With difficulty', gain: 8, action: 'Build an emergency fund for health emergencies' }, 'With difficulty': { target: 'Yes easily', gain: 5, action: 'Strengthen your critical illness funding' } },
      YPR_014: { 'No': { target: 'Yes', gain: 10, action: 'Get personal health or accident insurance' } },
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
        scores: { "No it runs itself": 100, 'Partially': 55, 'Yes completely': 0 },
        gaps: { 'Yes completely': 'Business completely depends on your personal involvement.', 'Partially': 'Business has partial dependency on you.' },
        recommendations: { 'Yes completely': 'Build team capacity and document processes to reduce key-person dependency.', 'Partially': 'Reduce personal dependency through delegation and systems.' }
      },
      ENT_012: {
        category: 'personal_guarantees',
        scores: { 'No': 100, 'Yes': 20 },
        gaps: { 'Yes': 'Personal guarantees for business debts create personal financial risk.' },
        recommendations: { 'Yes': 'Review personal guarantees and explore limited liability restructuring.' }
      },
      ENT_013: {
        category: 'revenue_resilience',
        scores: { 'Yes': 100, 'Not sure': 50, 'No': 0 },
        gaps: { 'No': 'Business would not survive 3 months without you.', 'Not sure': 'Uncertain about business survival without you.' },
        recommendations: { 'No': 'Create a business continuity plan and build an operational team.', 'Not sure': 'Assess and address key person risks in your business.' }
      },
      ENT_014: {
        category: 'key_person_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No key person insurance to protect the business if you become incapacitated.' },
        recommendations: { 'No': 'Consider key person insurance to protect your business.' }
      },
      ENT_015: {
        category: 'asset_separation',
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
      ENT_011: { 'Yes completely': { target: 'Partially', gain: 8, action: 'Delegate responsibilities and document business processes' } },
      ENT_014: { 'No': { target: 'Yes', gain: 10, action: 'Get key person insurance' } },
      ENT_015: { 'No': { target: 'Yes', gain: 8, action: 'Separate personal and business assets' } }
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
        scores: { 'Own': 100, 'Rent': 60, 'Neither': 20 },
        gaps: { 'Neither': 'No stable housing tenure creates significant exposure.', 'Rent': 'Renting means you do not benefit from property asset appreciation.' },
        recommendations: { 'Neither': 'Work towards securing stable housing to reduce personal risk exposure.', 'Rent': 'Review renter\'s insurance and consider long-term homeownership goals.' }
      },
      HOM_012: {
        category: 'home_insurance',
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
        scores: { '1': 100, '2': 70, '3 or more': 40 },
        gaps: { '3 or more': 'Multiple vehicles increase overall risk exposure and insurance costs.', '2': 'Two vehicles means higher combined exposure.' },
        recommendations: { '3 or more': 'Review whether all vehicles need comprehensive cover vs third-party.', '2': 'Ensure all vehicles have appropriate insurance cover.' }
      },
      MOT_012: {
        category: 'motor_insurance',
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
    name: 'School Protection',
    pillars: [
      { id: 'operations', name: 'Operations', weight: 0.30 },
      { id: 'legal_liability', name: 'Legal & Liability', weight: 0.35 },
      { id: 'asset_protection', name: 'Asset Protection', weight: 0.35 }
    ],
    categories: {
      student_exposure: { name: 'Student Exposure', pillar: 'operations' },
      injury_liability: { name: 'Injury Liability', pillar: 'legal_liability' },
      property_insurance: { name: 'Property Insurance', pillar: 'asset_protection' }
    },
    questions: {
      SCH_013: {
        category: 'student_exposure',
        scores: { 'Under 100': 100, '100-500': 55, 'Over 500': 20 },
        gaps: { 'Over 500': 'Large student population increases liability exposure.' },
        recommendations: { 'Over 500': 'Review comprehensive liability and accident coverage for all students.' }
      },
      SCH_016: {
        category: 'injury_liability',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No insurance coverage if a student is injured on premises.' },
        recommendations: { 'No': 'Secure comprehensive public liability insurance covering student injuries.' }
      },
      SCH_017: {
        category: 'property_insurance',
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
      SCH_016: { 'No': { target: 'Yes', gain: 12, action: 'Get comprehensive public liability insurance' } },
      SCH_017: { 'No': { target: 'Yes', gain: 8, action: 'Get fire insurance for school buildings' } }
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
      disaster_recovery: { name: 'Disaster Recovery', pillar: 'business_continuity' }
    },
    questions: {
      MFG_013: {
        category: 'workforce_exposure',
        scores: { '1-50': 100, '51-200': 55, '200+': 20 },
        gaps: { '200+': 'Large workforce creates significant liability and compliance exposure.' },
        recommendations: { '200+': 'Review comprehensive workforce insurance and safety programs.' }
      },
      MFG_014: {
        category: 'equipment_dependency',
        scores: { 'We have backups': 100, 'Within a few days': 50, 'Immediately': 0 },
        gaps: { 'Immediately': 'Critical machine breakdown would halt production immediately.' },
        recommendations: { 'Immediately': 'Implement equipment redundancy and maintenance programs.' }
      },
      MFG_016: {
        category: 'facility_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire and special perils insurance for your facility.' },
        recommendations: { 'No': 'Get comprehensive fire and special perils insurance for your facility.' }
      },
      MFG_017: {
        category: 'disaster_recovery',
        scores: { 'Yes easily': 100, 'With difficulty': 50, 'No, we would close': 0 },
        gaps: { 'No, we would close': 'Business would not survive a major disaster closure.', 'With difficulty': 'Business would struggle to recover from a major disaster.' },
        recommendations: { 'No, we would close': 'Create a comprehensive business continuity and disaster recovery plan.', 'With difficulty': 'Strengthen business continuity planning and insurance coverage.' }
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
      }
    ],
    improvements: {
      MFG_014: { 'Immediately': { target: 'Within a few days', gain: 8, action: 'Implement equipment redundancy for critical machinery' } },
      MFG_016: { 'No': { target: 'Yes', gain: 10, action: 'Get comprehensive fire and special perils insurance' } },
      MFG_017: { 'No, we would close': { target: 'With difficulty', gain: 8, action: 'Create a business continuity plan' } }
    }
  },

  HOS: {
    name: 'Hospital Protection',
    pillars: [
      { id: 'operations', name: 'Operations', weight: 0.25 },
      { id: 'legal_liability', name: 'Legal & Liability', weight: 0.30 },
      { id: 'equipment', name: 'Equipment', weight: 0.20 },
      { id: 'asset_protection', name: 'Asset Protection', weight: 0.25 }
    ],
    categories: {
      patient_exposure: { name: 'Patient Exposure', pillar: 'operations' },
      medical_liability: { name: 'Medical Liability', pillar: 'legal_liability' },
      equipment_value: { name: 'Equipment Value', pillar: 'equipment' },
      equipment_insurance: { name: 'Equipment Insurance', pillar: 'asset_protection' }
    },
    questions: {
      HOS_013: {
        category: 'patient_exposure',
        scores: { 'Under 20': 100, '20-100': 55, 'Over 100': 20 },
        gaps: { 'Over 100': 'Large facility with significant patient liability exposure.' },
        recommendations: { 'Over 100': 'Ensure comprehensive medical malpractice and liability coverage.' }
      },
      HOS_015: {
        category: 'medical_liability',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No professional indemnity or medical malpractice insurance.' },
        recommendations: { 'No': 'Secure comprehensive professional indemnity and medical malpractice insurance.' }
      },
      HOS_016: {
        category: 'equipment_value',
        scores: { 'No': 100, 'Yes': 40 },
        gaps: { 'Yes': 'High-value medical equipment on site requires specialized coverage.' },
        recommendations: { 'Yes': 'Ensure all high-value medical equipment is specifically insured.' }
      },
      HOS_017: {
        category: 'equipment_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No insurance coverage for critical life-support equipment damage.' },
        recommendations: { 'No': 'Get all-risks equipment insurance covering power surge and breakdown.' }
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
      }
    ],
    improvements: {
      HOS_015: { 'No': { target: 'Yes', gain: 12, action: 'Get professional indemnity and medical malpractice insurance' } },
      HOS_017: { 'No': { target: 'Yes', gain: 10, action: 'Get all-risks equipment insurance' } }
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
      building_insurance: { name: 'Building Insurance', pillar: 'property' }
    },
    questions: {
      CHR_013: {
        category: 'congregation_exposure',
        scores: { 'Under 200': 100, '200-1000': 55, 'Over 1000': 15 },
        gaps: { 'Over 1000': 'Large congregation creates significant liability during gatherings.' },
        recommendations: { 'Over 1000': 'Review comprehensive public liability insurance for large gatherings.' }
      },
      CHR_014: {
        category: 'valuable_assets',
        scores: { 'No': 100, 'Yes': 40 },
        gaps: { 'Yes': 'Valuable instruments and equipment require specialized insurance.' },
        recommendations: { 'Yes': 'Ensure high-value musical instruments and broadcast equipment are specifically insured.' }
      },
      CHR_015: {
        category: 'event_liability',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No insurance if a congregant is injured on church premises.' },
        recommendations: { 'No': 'Secure comprehensive public liability insurance for your premises.' }
      },
      CHR_017: {
        category: 'building_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire insurance for the church building and contents.' },
        recommendations: { 'No': 'Get fire insurance for the church building and contents.' }
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
      }
    ],
    improvements: {
      CHR_015: { 'No': { target: 'Yes', gain: 12, action: 'Get comprehensive public liability insurance' } },
      CHR_017: { 'No': { target: 'Yes', gain: 8, action: 'Get fire insurance for church building and contents' } }
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
      penalty_protection: { name: 'Penalty Protection', pillar: 'contractual' }
    },
    questions: {
      CON_013: {
        category: 'project_exposure',
        scores: { '1-2': 100, '3-5': 55, 'More than 5': 20 },
        gaps: { 'More than 5': 'Managing many concurrent projects increases risk exposure.' },
        recommendations: { 'More than 5': 'Ensure each project has adequate insurance coverage.' }
      },
      CON_014: {
        category: 'heavy_machinery',
        scores: { 'No': 100, 'Yes': 30 },
        gaps: { 'Yes': 'Heavy machinery on site creates significant liability and damage risk.' },
        recommendations: { 'Yes': 'Ensure all heavy machinery is comprehensively insured.' }
      },
      CON_015: {
        category: 'contractor_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No contractor\'s all-risk or works insurance.' },
        recommendations: { 'No': 'Get comprehensive contractor\'s all-risk insurance.' }
      },
      CON_016: {
        category: 'accident_cover',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No group personal accident cover for on-site workers.' },
        recommendations: { 'No': 'Get group personal accident cover for all on-site workers.' }
      },
      CON_017: {
        category: 'penalty_protection',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No protection against project delay penalties.' },
        recommendations: { 'No': 'Review contract terms and consider delay penalty protection.' }
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
      }
    ],
    improvements: {
      CON_015: { 'No': { target: 'Yes', gain: 12, action: 'Get comprehensive contractor\'s all-risk insurance' } },
      CON_016: { 'No': { target: 'Yes', gain: 8, action: 'Get group personal accident cover for workers' } },
      CON_017: { 'No': { target: 'Yes', gain: 6, action: 'Add delay penalty protection to contracts' } }
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
      motor_compliance: { name: 'Motor Compliance', pillar: 'compliance' }
    },
    questions: {
      TRN_013: {
        category: 'fleet_exposure',
        scores: { '1-5': 100, '6-20': 55, 'Over 20': 20 },
        gaps: { 'Over 20': 'Large fleet creates significant cumulative risk exposure.' },
        recommendations: { 'Over 20': 'Implement fleet-wide risk management and comprehensive insurance.' }
      },
      TRN_015: {
        category: 'fleet_insurance',
        scores: { 'Yes': 100, 'Not Applicable': 70, 'No': 0 },
        gaps: { 'No': 'No fleet insurance for goods in transit.' },
        recommendations: { 'No': 'Get comprehensive goods-in-transit insurance.' }
      },
      TRN_016: {
        category: 'driver_accident',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No group personal accident cover for drivers.' },
        recommendations: { 'No': 'Get group personal accident cover for all drivers.' }
      },
      TRN_017: {
        category: 'motor_compliance',
        scores: { 'Yes': 100, 'Some of them': 50, 'No': 0 },
        gaps: { 'No': 'Vehicles not covered by comprehensive motor insurance.', 'Some of them': 'Only some vehicles have comprehensive motor insurance.' },
        recommendations: { 'No': 'Get comprehensive motor insurance for all fleet vehicles.', 'Some of them': 'Extend comprehensive motor insurance to entire fleet.' }
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
      }
    ],
    improvements: {
      TRN_015: { 'No': { target: 'Yes', gain: 10, action: 'Get goods-in-transit insurance' } },
      TRN_016: { 'No': { target: 'Yes', gain: 8, action: 'Get group personal accident cover for drivers' } },
      TRN_017: { 'No': { target: 'Some of them', gain: 6, action: 'Start with comprehensive insurance for high-value vehicles' } }
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
        scores: { '1-10': 100, '11-50': 55, '51+': 20 },
        gaps: { '51+': 'Large workforce with significant employment liability exposure.' },
        recommendations: { '51+': 'Review comprehensive employer\'s liability and workforce insurance.' }
      },
      SME_014: {
        category: 'revenue_exposure',
        scores: { 'Under ₦50M': 100, '₦50M - ₦200M': 55, 'Over ₦200M': 20 },
        gaps: { 'Over ₦200M': 'High revenue business with significant financial exposure.' },
        recommendations: { 'Over ₦200M': 'Ensure all business insurance adequately covers your revenue scale.' }
      },
      SME_016: {
        category: 'property_insurance',
        scores: { 'Yes': 100, 'No': 0 },
        gaps: { 'No': 'No fire and burglary insurance for your business.' },
        recommendations: { 'No': 'Get comprehensive fire and burglary insurance.' }
      },
      SME_017: {
        category: 'disaster_survival',
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
      SME_016: { 'No': { target: 'Yes', gain: 12, action: 'Get comprehensive fire and burglary insurance' } },
      SME_017: { 'No, we would close': { target: 'With difficulty', gain: 10, action: 'Create a business continuity plan' } }
    }
  }
};

module.exports = scoringConfigs;
