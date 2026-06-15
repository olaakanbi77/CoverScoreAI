const fs = require('fs');
const path = require('path');

const qbPath = path.join(__dirname, '../src/data/question_bank.json');
let questionBank = [];
if (fs.existsSync(qbPath)) {
  questionBank = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
}

const clearPrefix = (prefix) => {
  questionBank = questionBank.filter(q => !q.id.startsWith(prefix));
};

const flows = [
  { prefix: 'SCH', name: 'School', ind: 'school' },
  { prefix: 'MFG', name: 'Manufacturing', ind: 'manufacturing' },
  { prefix: 'HOS', name: 'Hospital', ind: 'hospital' },
  { prefix: 'CHR', name: 'Church', ind: 'church' },
  { prefix: 'SME', name: 'SME', ind: 'sme' }
];

flows.forEach(flow => {
  clearPrefix(flow.prefix + '_');
  
  const p = flow.prefix;
  const indStr = flow.name.toLowerCase();
  
  // Specific Exposure Questions based on Industry
  let specificExposure = [];
  if (p === 'SCH') {
    specificExposure = [
      {
        id: `${p}_007`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `Approximately how many students are enrolled in your school?`,
        question_type: 'single_choice',
        answers: ['Under 100', '100-500', 'Over 500'],
        risk_logic: { 'Under 100': { exposure_points: 10, lead_score_points: 10 }, '100-500': { exposure_points: 20, lead_score_points: 20 }, 'Over 500': { exposure_points: 30, lead_score_points: 30 } },
        branching: { 'DEFAULT': `${p}_008` }
      },
      {
        id: `${p}_008`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `What is the estimated average annual tuition fee per student?`,
        question_type: 'single_choice',
        answers: ['Under ₦100,000', '₦100,000 - ₦500,000', 'Over ₦500,000'],
        risk_logic: { 'Under ₦100,000': { exposure_points: 5, lead_score_points: 5 }, '₦100,000 - ₦500,000': { exposure_points: 15, lead_score_points: 15 }, 'Over ₦500,000': { exposure_points: 25, lead_score_points: 25 } },
        data_mapping: 'tuition_fees',
        branching: { 'DEFAULT': `${p}_009` }
      }
    ];
  } else if (p === 'MFG') {
    specificExposure = [
      {
        id: `${p}_007`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `How many factory workers do you employ?`,
        question_type: 'single_choice',
        answers: ['1-50', '51-200', '200+'],
        risk_logic: { '1-50': { exposure_points: 10, lead_score_points: 10 }, '51-200': { exposure_points: 20, lead_score_points: 20 }, '200+': { exposure_points: 30, lead_score_points: 30 } },
        branching: { 'DEFAULT': `${p}_008` }
      },
      {
        id: `${p}_008`,
        industry: flow.ind,
        pillar: 'Vulnerability',
        question: `If a critical machine breaks down, how quickly would it halt operations?`,
        question_type: 'single_choice',
        answers: ['Immediately', 'Within a few days', 'We have backups'],
        risk_logic: { 'Immediately': { vulnerability_points: 30, lead_score_points: 20 }, 'Within a few days': { vulnerability_points: 15, lead_score_points: 10 } },
        recommendation_trigger: { condition: 'Immediately', recommendation: 'Machinery Breakdown Insurance required' },
        branching: { 'DEFAULT': `${p}_009` }
      }
    ];
  } else if (p === 'HOS') {
    specificExposure = [
      {
        id: `${p}_007`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `Approximately how many patient beds does your facility have?`,
        question_type: 'single_choice',
        answers: ['Under 20', '20-100', 'Over 100'],
        risk_logic: { 'Under 20': { exposure_points: 10, lead_score_points: 10 }, '20-100': { exposure_points: 20, lead_score_points: 20 }, 'Over 100': { exposure_points: 30, lead_score_points: 30 } },
        branching: { 'DEFAULT': `${p}_008` }
      },
      {
        id: `${p}_008`,
        industry: flow.ind,
        pillar: 'Vulnerability',
        question: `Are patient records stored electronically with access controls?`,
        question_type: 'yes_no',
        answers: ['Yes', 'No'],
        risk_logic: { 'No': { vulnerability_points: 30, lead_score_points: 20 } },
        recommendation_trigger: { condition: 'No', recommendation: 'Cyber Insurance and data protection required' },
        branching: { 'DEFAULT': `${p}_009` }
      }
    ];
  } else if (p === 'CHR') {
    specificExposure = [
      {
        id: `${p}_007`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `What is your average weekly congregation size?`,
        question_type: 'single_choice',
        answers: ['Under 200', '200-1000', 'Over 1000'],
        risk_logic: { 'Under 200': { exposure_points: 10, lead_score_points: 10 }, '200-1000': { exposure_points: 20, lead_score_points: 20 }, 'Over 1000': { exposure_points: 40, lead_score_points: 35 } },
        branching: { 'DEFAULT': `${p}_008` }
      },
      {
        id: `${p}_008`,
        industry: flow.ind,
        pillar: 'Vulnerability',
        question: `Do you have high-value musical instruments and broadcast equipment on the premises?`,
        question_type: 'yes_no',
        answers: ['Yes', 'No'],
        risk_logic: { 'Yes': { vulnerability_points: 20, lead_score_points: 15 } },
        recommendation_trigger: { condition: 'Yes', recommendation: 'All Risk / Burglary Insurance for instruments' },
        branching: { 'DEFAULT': `${p}_009` }
      }
    ];
  } else {
    specificExposure = [
      {
        id: `${p}_007`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `How many employees/staff do you have?`,
        question_type: 'single_choice',
        answers: ['1-10', '11-50', '51+'],
        risk_logic: { '1-10': { exposure_points: 5, lead_score_points: 5 }, '11-50': { exposure_points: 10, lead_score_points: 10 }, '51+': { exposure_points: 20, lead_score_points: 20 } },
        branching: { 'DEFAULT': `${p}_008` }
      },
      {
        id: `${p}_008`,
        industry: flow.ind,
        pillar: 'Exposure',
        question: `What is your estimated annual revenue?`,
        question_type: 'single_choice',
        answers: ['Under ₦50M', '₦50M - ₦200M', 'Over ₦200M'],
        risk_logic: { 'Under ₦50M': { exposure_points: 5, lead_score_points: 5 }, '₦50M - ₦200M': { exposure_points: 15, lead_score_points: 15 }, 'Over ₦200M': { exposure_points: 25, lead_score_points: 25 } },
        branching: { 'DEFAULT': `${p}_009` }
      }
    ];
  }

  // Base Questions
  const questions = [
    {
      id: `${p}_001`,
      industry: flow.ind,
      pillar: 'General',
      question: `Hello 👋\n\nWelcome to CoverScore AI.\n\nI'll help identify risks that may affect your ${indStr}, employees, facilities, and operations.\n\nAt the end of this assessment, you'll receive:\n\n✓ Risk Score™\n✓ Protection Gap Analysis\n✓ Priority Risk Areas\n✓ Personalized Risk Report\n\nThe assessment takes approximately 3-5 minutes.\n\nShall we begin?`,
      question_type: 'single_choice',
      answers: ['Yes', 'Tell Me More'],
      branching: { 'Yes': `${p}_003`, 'Tell Me More': `${p}_002`, 'DEFAULT': `${p}_002` }
    },
    {
      id: `${p}_002`,
      industry: flow.ind,
      pillar: 'General',
      question: `CoverScore helps business owners identify hidden risks before they become costly incidents.\n\nWould you like to continue?`,
      question_type: 'single_choice',
      answers: ['Start Assessment', 'Not Now'],
      branching: { 'Start Assessment': `${p}_003`, 'Not Now': 'COMPLETE', 'DEFAULT': `${p}_003` }
    },
    {
      id: `${p}_003`,
      industry: flow.ind,
      pillar: 'General',
      question: `Great.\n\nTo personalize your report, what is the name of your ${indStr}?`,
      question_type: 'open_text',
      data_mapping: 'business_name',
      branching: { 'DEFAULT': `${p}_004` }
    },
    {
      id: `${p}_004`,
      industry: flow.ind,
      pillar: 'General',
      question: `Thanks!\n\nAnd what is your name?`,
      question_type: 'open_text',
      data_mapping: 'name',
      branching: { 'DEFAULT': `${p}_005` }
    },
    {
      id: `${p}_005`,
      industry: flow.ind,
      pillar: 'General',
      question: `Nice to meet you.\n\nWhat is your role?`,
      question_type: 'open_text',
      data_mapping: 'role',
      branching: { 'DEFAULT': `${p}_006` }
    },
    {
      id: `${p}_006`,
      industry: flow.ind,
      pillar: 'General',
      question: `Finally, what is your email address?\n\n(We'll send your completed Risk Report here)`,
      question_type: 'open_text',
      data_mapping: 'email',
      branching: { 'DEFAULT': `${p}_007` }
    },
    ...specificExposure,
    {
      id: `${p}_009`,
      industry: flow.ind,
      pillar: 'Vulnerability',
      question: `Do you own the building you operate from?`,
      question_type: 'single_choice',
      answers: ['Own', 'Rent'],
      branching: { 'DEFAULT': `${p}_010` }
    },
    {
      id: `${p}_010`,
      industry: flow.ind,
      pillar: 'Vulnerability',
      question: `Do you currently have a comprehensive Fire Insurance policy for your building and contents?`,
      question_type: 'yes_no',
      answers: ['Yes', 'No'],
      risk_logic: { 'No': { vulnerability_points: 30, lead_score_points: 20 } },
      recommendation_trigger: { condition: 'No', recommendation: 'Immediate need for Fire Insurance' },
      branching: { 'DEFAULT': `${p}_011` }
    },
    {
      id: `${p}_011`,
      industry: flow.ind,
      pillar: 'Impact',
      question: `Have you experienced any major incidents (fire, theft, major accidents) in the last 3 years?`,
      question_type: 'yes_no',
      answers: ['Yes', 'No'],
      risk_logic: { 'Yes': { impact_points: 25, lead_score_points: 15 } },
      branching: { 'DEFAULT': `${p}_012` }
    },
    {
      id: `${p}_012`,
      industry: flow.ind,
      pillar: 'Exposure',
      question: `Are members of the public regularly at your premises?`,
      question_type: 'yes_no',
      answers: ['Yes', 'No'],
      branching: { 'Yes': `${p}_013`, 'No': `${p}_014`, 'DEFAULT': `${p}_014` }
    },
    {
      id: `${p}_013`,
      industry: flow.ind,
      pillar: 'Vulnerability',
      question: `If a visitor was injured on your premises and sued for ₦10M, do you have Public Liability Insurance?`,
      question_type: 'yes_no',
      answers: ['Yes', 'No'],
      risk_logic: { 'No': { vulnerability_points: 25, lead_score_points: 20 } },
      recommendation_trigger: { condition: 'No', recommendation: 'High priority: Public Liability Insurance required' },
      branching: { 'DEFAULT': `${p}_014` }
    },
    {
      id: `${p}_014`,
      industry: flow.ind,
      pillar: 'Vulnerability',
      question: `Do you provide Health Insurance benefits for your staff?`,
      question_type: 'yes_no',
      answers: ['Yes', 'No'],
      risk_logic: { 'No': { vulnerability_points: 15, lead_score_points: 15 } },
      recommendation_trigger: { condition: 'No', recommendation: 'Consider Health Insurance for staff retention' },
      branching: { 'DEFAULT': `${p}_015` }
    },
    {
      id: `${p}_015`,
      industry: flow.ind,
      pillar: 'Impact',
      question: `If a major disaster forced you to close for 3 months, could you survive without revenue?`,
      question_type: 'single_choice',
      answers: ['Yes easily', 'With difficulty', 'No, we would close'],
      risk_logic: { 'With difficulty': { impact_points: 20, lead_score_points: 10 }, 'No, we would close': { impact_points: 40, lead_score_points: 25 } },
      recommendation_trigger: { condition: 'No, we would close', recommendation: 'Critical need for Business Interruption Insurance' },
      branching: { 'DEFAULT': `${p}_016` }
    },
    {
      id: `${p}_016`,
      industry: flow.ind,
      pillar: 'General',
      question: `Which of these insurances do you currently have? (Select all that apply, e.g., A, C)`,
      question_type: 'multi_choice',
      answers: ['Fire & Property', 'Group Life / Health', 'Public Liability', 'Cyber Security', 'Motor / Fleet', 'None of the above'],
      data_mapping: 'existing_insurance',
      branching: { 'DEFAULT': `${p}_017` }
    },
    {
      id: `${p}_017`,
      industry: flow.ind,
      pillar: 'General',
      question: `Thank you for completing the core assessment!\n\nBased on your responses, we've identified potential protection gaps.\n\nWould you like a complimentary 15-minute consultation with a Risk Advisor?`,
      question_type: 'single_choice',
      answers: ['Yes, please', 'No, just send my report'],
      data_mapping: 'consultation_preference',
      branching: { 'Yes, please': `${p}_018`, 'No, just send my report': 'COMPLETE', 'DEFAULT': 'COMPLETE' }
    },
    {
      id: `${p}_018`,
      industry: flow.ind,
      pillar: 'General',
      question: `Great! What time of day works best for a brief call?`,
      question_type: 'single_choice',
      answers: ['Morning', 'Afternoon', 'Evening'],
      data_mapping: 'consultation_time',
      branching: { 'DEFAULT': 'COMPLETE' }
    }
  ];

  questionBank.push(...questions);
});

fs.writeFileSync(qbPath, JSON.stringify(questionBank, null, 2), 'utf8');
console.log('Successfully generated complete flows for all industries.');
