const pack = {
  id: 'QP-100',
  code: 'QP-100',
  name: 'Health Protection Assessment',
  description: 'Evaluates personal health insurance coverage, medical risk factors, lifestyle habits, financial preparedness for healthcare, and protection recovery readiness.',
  version: '1.0',
  status: 'active',
  type: 'personal',
  master_template: 'MPAT-001',

  // At what question index to insert the Insight Checkpoint
  checkpoint_after: 4,

  // Pillars — define the 5 scoring dimensions
  pillars: [
    { id: 'healthcare_access', name: 'Healthcare Access', weight: 0.20 },
    { id: 'medical_risk', name: 'Medical Risk', weight: 0.20 },
    { id: 'lifestyle', name: 'Lifestyle', weight: 0.20 },
    { id: 'financial_preparedness', name: 'Financial Preparedness', weight: 0.20 },
    { id: 'protection_recovery', name: 'Protection & Recovery', weight: 0.20 }
  ],

  categories: {
    insurance_coverage: { name: 'Insurance Coverage', pillar: 'healthcare_access' },
    diagnosed_conditions: { name: 'Diagnosed Conditions', pillar: 'medical_risk' },
    checkup_frequency: { name: 'Check-up Frequency', pillar: 'lifestyle' },
    emergency_fund: { name: 'Emergency Fund', pillar: 'financial_preparedness' },
    surgery_coverage: { name: 'Surgery Coverage', pillar: 'protection_recovery' },
    illness_resilience: { name: 'Illness Resilience', pillar: 'protection_recovery' }
  },

  modifiers: [
    {
      id: 'no_insurance_no_emergency_fund',
      conditions: [
        { questionId: 'QP-100-012', value: 'None' },
        { questionId: 'QP-100-013', values: ['I don\'t know', 'Loan'] }
      ],
      type: 'penalty', points: 10
    },
    {
      id: 'chronic_condition_no_coverage',
      conditions: [
        { questionId: 'QP-100-014', values: ['Hypertension', 'Diabetes'] },
        { questionId: 'QP-100-016', values: ['No', 'Not sure'] }
      ],
      type: 'penalty', points: 8
    },
    {
      id: 'rare_checkups_no_insurance',
      conditions: [
        { questionId: 'QP-100-015', value: 'Rarely/Only when sick' },
        { questionId: 'QP-100-012', value: 'None' }
      ],
      type: 'penalty', points: 7
    },
    {
      id: 'no_income_protection',
      conditions: [ { questionId: 'QP-100-017', value: 'No' } ],
      type: 'penalty', points: 5
    },
    {
      id: 'positive_health_engagement',
      conditions: [
        { questionId: 'QP-100-012', values: ['Private Health Insurance', 'Employer HMO'] },
        { questionId: 'QP-100-015', values: ['Every 6 months', 'Annually'] }
      ],
      type: 'bonus', points: 5
    }
  ]
};

const discovery_questions = [
  {
    id: 'QP-100-012',
    sequence: 0,
    question_type: 'choice',
    text: 'What type of health insurance coverage do you currently have?',
    category: 'insurance_coverage',
    pillar: 'healthcare_access',
    options: [
      { text: 'Private Health Insurance', value: 'Private Health Insurance', score: 100, sort_order: 0 },
      { text: 'Employer HMO', value: 'Employer HMO', score: 60, sort_order: 1 },
      { text: 'Government Health Scheme', value: 'Government Health Scheme', score: 50, sort_order: 2 },
      { text: 'None', value: 'None', score: 0, sort_order: 3 }
    ]
  },
  {
    id: 'QP-100-013',
    sequence: 1,
    question_type: 'choice',
    text: 'How would you cover an emergency medical expense of \u20A6500,000 today?',
    category: 'emergency_fund',
    pillar: 'financial_preparedness',
    gap: {
      'Loan': { text: 'You rely on loans or borrowing for emergency medical expenses.', recommendations: ['Build a medical emergency fund.'] },
      'I don\'t know': { text: 'You have no plan for emergency medical expenses.', recommendations: ['Create a plan for medical emergencies.'] }
    },
    options: [
      { text: 'Savings', value: 'Savings', score: 100, sort_order: 0 },
      { text: 'Insurance', value: 'Insurance', score: 80, sort_order: 1 },
      { text: 'Family/Friends', value: 'Family/Friends', score: 40, sort_order: 2 },
      { text: 'Loan', value: 'Loan', score: 25, sort_order: 3 },
      { text: 'I don\'t know', value: 'I don\'t know', score: 0, sort_order: 4 }
    ]
  },
  {
    id: 'QP-100-014',
    sequence: 2,
    question_type: 'choice',
    text: 'Have you been diagnosed with any of the following chronic conditions?',
    category: 'diagnosed_conditions',
    pillar: 'medical_risk',
    gap: {
      'Asthma': { text: 'You have Asthma \u2014 a pre-existing condition.', recommendations: ['Ensure your plan covers asthma-related care.'] },
      'Hypertension': { text: 'You have Hypertension \u2014 a chronic condition.', recommendations: ['Consider a health plan with chronic disease management.'] },
      'Diabetes': { text: 'You have Diabetes \u2014 a chronic condition.', recommendations: ['Look for plans with diabetes wellness programs.'] }
    },
    options: [
      { text: 'None', value: 'None', score: 100, sort_order: 0 },
      { text: 'Asthma', value: 'Asthma', score: 50, sort_order: 1 },
      { text: 'Hypertension', value: 'Hypertension', score: 35, sort_order: 2 },
      { text: 'Diabetes', value: 'Diabetes', score: 25, sort_order: 3 }
    ]
  },
  {
    id: 'QP-100-015',
    sequence: 3,
    question_type: 'choice',
    text: 'How often do you go for medical check-ups?',
    category: 'checkup_frequency',
    pillar: 'lifestyle',
    gap: {
      'Rarely/Only when sick': { text: 'You are missing out on early detection through routine check-ups.', recommendations: ['Schedule an annual preventive health screening.'] }
    },
    options: [
      { text: 'Every 6 months', value: 'Every 6 months', score: 100, sort_order: 0 },
      { text: 'Annually', value: 'Annually', score: 80, sort_order: 1 },
      { text: 'Rarely/Only when sick', value: 'Rarely/Only when sick', score: 20, sort_order: 2 }
    ]
  },
  {
    id: 'QP-100-016',
    sequence: 4,
    question_type: 'choice',
    text: 'Does your current health insurance cover major surgical procedures?',
    category: 'surgery_coverage',
    pillar: 'protection_recovery',
    gap: {
      'No': { text: 'Your current cover is inadequate for major surgical procedures.', recommendations: ['Consider Critical Illness Insurance if appropriate.'] },
      'Not sure': { text: 'You are uncertain about your surgery coverage.', recommendations: ['Review your policy to understand surgical coverage limits.'] }
    },
    options: [
      { text: 'Yes', value: 'Yes', score: 100, sort_order: 0 },
      { text: 'Not sure', value: 'Not sure', score: 40, sort_order: 1 },
      { text: 'No', value: 'No', score: 0, sort_order: 2 }
    ]
  },
  {
    id: 'QP-100-017',
    sequence: 5,
    question_type: 'yes_no',
    text: 'If you fell ill and couldn\'t work for 3 months, would your household cope financially?',
    category: 'illness_resilience',
    pillar: 'protection_recovery',
    gap: {
      'No': { text: 'Your household is highly vulnerable to loss of income due to illness.', recommendations: ['Explore income protection options.'] }
    },
    options: [
      { text: 'Yes', value: 'Yes', score: 100, sort_order: 0 },
      { text: 'No', value: 'No', score: 0, sort_order: 1 }
    ]
  }
];

module.exports = { pack, discovery_questions };
