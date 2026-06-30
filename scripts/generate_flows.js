const fs = require('fs');
const path = require('path');

const qbPath = path.join(__dirname, '../src/data/question_bank.json');
let questionBank = [];
if (fs.existsSync(qbPath)) {
  questionBank = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
}

const flows = [
  // Business Funnels
  { prefix: 'SCH', name: 'School', ind: 'school', type: 'business' },
  { prefix: 'MFG', name: 'Manufacturing', ind: 'manufacturing', type: 'business' },
  { prefix: 'HOS', name: 'Hospital', ind: 'hospital', type: 'business' },
  { prefix: 'CHR', name: 'Church', ind: 'church', type: 'business' },
  { prefix: 'CON', name: 'Construction', ind: 'construction', type: 'business' },
  { prefix: 'TRN', name: 'Transport & Logistics', ind: 'transport', type: 'business' },
  { prefix: 'SME', name: 'SME', ind: 'sme', type: 'business' },
  // Personal Funnels
  { prefix: 'FAM', name: 'Family', ind: 'family', type: 'personal' },
  { prefix: 'YPR', name: 'Young Professional', ind: 'young_professional', type: 'personal' },
  { prefix: 'RET', name: 'Retirement', ind: 'retirement', type: 'personal' },
  { prefix: 'INC', name: 'Income Protection', ind: 'income', type: 'personal' },
  { prefix: 'HLT', name: 'Health', ind: 'health', type: 'personal' },
  { prefix: 'ENT', name: 'Entrepreneur', ind: 'entrepreneur', type: 'personal' }
];

const clearPrefix = (prefix) => {
  questionBank = questionBank.filter(q => !q.id.startsWith(prefix));
};

const getSpecificQuestions = (prefix) => {
  switch(prefix) {
    // BUSINESS FUNNELS
    case 'SCH':
      return [
        {
          question: `How many students are enrolled in your school?`,
          question_type: 'single_choice',
          answers: ['Under 100', '100-500', 'Over 500'],
          risk_logic: { 'Under 100': { exposure_points: 10 }, '100-500': { exposure_points: 20 }, 'Over 500': { exposure_points: 30 } }
        },
        {
          question: `What is the estimated average annual tuition fee per student?`,
          question_type: 'single_choice',
          answers: ['Under ₦100,000', '₦100,000 - ₦500,000', 'Over ₦500,000'],
          data_mapping: 'tuition_fees'
        },
        {
          question: `Do you operate school buses to transport students?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          recommendation_trigger: { condition: 'Yes', recommendation: 'Comprehensive Motor Fleet Insurance required' }
        },
        {
          question: `If a student was injured on the playground and parents sued, do you have Public Liability Insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 30 } }
        },
        {
          question: `Do you currently have a comprehensive Fire Insurance policy for your school buildings?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        }
      ];
    case 'MFG':
      return [
        {
          question: `How many factory workers do you employ?`,
          question_type: 'single_choice',
          answers: ['1-50', '51-200', '200+'],
          risk_logic: { '1-50': { exposure_points: 10 }, '51-200': { exposure_points: 20 }, '200+': { exposure_points: 30 } }
        },
        {
          question: `If a critical machine breaks down, how quickly would it halt operations?`,
          question_type: 'single_choice',
          answers: ['Immediately', 'Within a few days', 'We have backups'],
          risk_logic: { 'Immediately': { vulnerability_points: 30 }, 'Within a few days': { vulnerability_points: 15 } }
        },
        {
          question: `Do you import raw materials or export finished goods?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          recommendation_trigger: { condition: 'Yes', recommendation: 'Marine/Goods In Transit Insurance required' }
        },
        {
          question: `Do you have comprehensive Fire & Special Perils insurance for your warehouse/factory?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 30 } }
        },
        {
          question: `If a major fire forced you to close for 3 months, could you survive without revenue?`,
          question_type: 'single_choice',
          answers: ['Yes easily', 'With difficulty', 'No, we would close'],
          risk_logic: { 'With difficulty': { impact_points: 20 }, 'No, we would close': { impact_points: 40 } }
        }
      ];
    case 'HOS':
      return [
        {
          question: `Approximately how many patient beds does your facility have?`,
          question_type: 'single_choice',
          answers: ['Under 20', '20-100', 'Over 100'],
          risk_logic: { 'Under 20': { exposure_points: 10 }, '20-100': { exposure_points: 20 }, 'Over 100': { exposure_points: 30 } }
        },
        {
          question: `Are patient records stored electronically?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          recommendation_trigger: { condition: 'Yes', recommendation: 'Cyber Liability Insurance required' }
        },
        {
          question: `Do you have Medical Malpractice/Professional Indemnity insurance for your doctors and staff?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 35 } }
        },
        {
          question: `Do you have high-value medical equipment (e.g., MRI, X-Ray) that would be costly to replace?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'Yes': { exposure_points: 15 } }
        },
        {
          question: `If a power surge destroyed critical life-support equipment, do you have Machinery Breakdown insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        }
      ];
    case 'CHR':
      return [
        {
          question: `What is your average weekly congregation size?`,
          question_type: 'single_choice',
          answers: ['Under 200', '200-1000', 'Over 1000'],
          risk_logic: { 'Under 200': { exposure_points: 10 }, '200-1000': { exposure_points: 20 }, 'Over 1000': { exposure_points: 40 } }
        },
        {
          question: `Do you have high-value musical instruments and broadcast equipment on the premises?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'Yes': { exposure_points: 15 } }
        },
        {
          question: `If a visitor was injured during a service and sued, do you have Public Liability Insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `Do you own the church building?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No']
        },
        {
          question: `Do you currently have Fire Insurance for the building and its contents?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 30 } }
        }
      ];
    case 'CON':
      return [
        {
          question: `How many active construction projects do you typically manage at once?`,
          question_type: 'single_choice',
          answers: ['1-2', '3-5', 'More than 5'],
          risk_logic: { '1-2': { exposure_points: 10 }, '3-5': { exposure_points: 20 }, 'More than 5': { exposure_points: 30 } }
        },
        {
          question: `Do you use heavy construction machinery (e.g., excavators, cranes)?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'Yes': { exposure_points: 20 } }
        },
        {
          question: `Do you currently have Contractors All Risk (CAR) insurance for your sites?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 30 } }
        },
        {
          question: `If a worker is injured on site, do you have Group Personal Accident or Employers Liability insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `If a project is delayed due to an unforeseen accident, do you have cover for the resulting financial loss?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 15 } }
        }
      ];
    case 'TRN':
      return [
        {
          question: `How many vehicles are in your fleet?`,
          question_type: 'single_choice',
          answers: ['1-5', '6-20', 'Over 20'],
          risk_logic: { '1-5': { exposure_points: 10 }, '6-20': { exposure_points: 20 }, 'Over 20': { exposure_points: 30 } }
        },
        {
          question: `Do you primarily transport goods (cargo) or passengers?`,
          question_type: 'single_choice',
          answers: ['Goods', 'Passengers', 'Both']
        },
        {
          question: `Do you have Goods In Transit (GIT) insurance for the cargo you carry?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', 'Not Applicable'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `If a driver is involved in a severe accident, do you have Group Life / Personal Accident cover for them?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 20 } }
        },
        {
          question: `Are your vehicles covered by Comprehensive Motor Insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', 'Some of them'],
          risk_logic: { 'No': { vulnerability_points: 30 }, 'Some of them': { vulnerability_points: 15 } }
        }
      ];
    case 'SME':
      return [
        {
          question: `How many employees/staff do you have?`,
          question_type: 'single_choice',
          answers: ['1-10', '11-50', '51+'],
          risk_logic: { '1-10': { exposure_points: 5 }, '11-50': { exposure_points: 15 }, '51+': { exposure_points: 25 } }
        },
        {
          question: `What is your estimated annual revenue?`,
          question_type: 'single_choice',
          answers: ['Under ₦50M', '₦50M - ₦200M', 'Over ₦200M'],
          risk_logic: { 'Under ₦50M': { exposure_points: 10 }, '₦50M - ₦200M': { exposure_points: 20 }, 'Over ₦200M': { exposure_points: 30 } }
        },
        {
          question: `Do you operate from a physical shop or office?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No']
        },
        {
          question: `Do you currently have a comprehensive Fire & Burglary Insurance policy?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `If a major disaster forced you to close for 3 months, could you survive without revenue?`,
          question_type: 'single_choice',
          answers: ['Yes easily', 'With difficulty', 'No, we would close'],
          risk_logic: { 'With difficulty': { impact_points: 20 }, 'No, we would close': { impact_points: 40 } }
        }
      ];
    // PERSONAL FUNNELS
    case 'FAM':
      return [
        {
          question: `How many dependents (children or elderly relatives) rely on your income?`,
          question_type: 'single_choice',
          answers: ['None', '1-2', '3 or more'],
          risk_logic: { 'None': { exposure_points: 5 }, '1-2': { exposure_points: 20 }, '3 or more': { exposure_points: 35 } }
        },
        {
          question: `If you were suddenly unable to work due to illness, how long would your savings last?`,
          question_type: 'single_choice',
          answers: ['Less than 3 months', '3-6 months', 'Over 6 months'],
          risk_logic: { 'Less than 3 months': { vulnerability_points: 35 }, '3-6 months': { vulnerability_points: 15 } }
        },
        {
          question: `Do you currently have a Life Insurance policy?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', 'Not sure'],
          risk_logic: { 'No': { vulnerability_points: 30 }, 'Not sure': { vulnerability_points: 20 } }
        },
        {
          question: `Are your children's future education costs secured if something happens to the primary breadwinner?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', 'Not applicable'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `Does your family have comprehensive Health Insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        }
      ];
    case 'YPR':
      return [
        {
          question: `How long have you been in your current career?`,
          question_type: 'single_choice',
          answers: ['Under 2 years', '2-5 years', 'Over 5 years']
        },
        {
          question: `If you suffered a critical illness (e.g. cancer, stroke) today, could you afford the medical bills without going into debt?`,
          question_type: 'single_choice',
          answers: ['Yes easily', 'With difficulty', 'No'],
          risk_logic: { 'With difficulty': { vulnerability_points: 20 }, 'No': { vulnerability_points: 40 } }
        },
        {
          question: `Do you have an emergency fund covering at least 6 months of expenses?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `Do you currently have personal Health or Accident Insurance?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 20 } }
        },
        {
          question: `Are you currently saving towards a major life goal (e.g. buying a house, marriage)?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No']
        }
      ];
    case 'RET':
      return [
        {
          question: `How soon do you plan to retire?`,
          question_type: 'single_choice',
          answers: ['Within 5 years', '5-15 years', 'Over 15 years'],
          risk_logic: { 'Within 5 years': { exposure_points: 30 }, '5-15 years': { exposure_points: 15 } }
        },
        {
          question: `Do you have a dedicated Pension or Retirement Savings Account (RSA)?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 40 } }
        },
        {
          question: `Are you concerned that escalating medical costs might deplete your retirement savings?`,
          question_type: 'single_choice',
          answers: ['Very concerned', 'Somewhat concerned', 'Not concerned']
        },
        {
          question: `Do you have a plan in place for long-term care or critical illness during retirement?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `If you pass away, will your spouse or dependents have enough income to maintain their lifestyle?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', 'Not applicable'],
          risk_logic: { 'No': { vulnerability_points: 30 } }
        }
      ];
    case 'INC':
      return [
        {
          question: `What is your primary source of income?`,
          question_type: 'single_choice',
          answers: ['Salary from employment', 'Freelance/Contract', 'Business owner']
        },
        {
          question: `If you lost your primary income tomorrow, how long would your emergency funds last?`,
          question_type: 'single_choice',
          answers: ['Less than 1 month', '1-3 months', 'Over 3 months'],
          risk_logic: { 'Less than 1 month': { vulnerability_points: 40 }, '1-3 months': { vulnerability_points: 20 } }
        },
        {
          question: `Do you have secondary sources of income (e.g. investments, real estate)?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 10 } }
        },
        {
          question: `Do you currently have a policy that pays you a monthly income if you are disabled by an accident?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `Do you have significant debts (mortgage, personal loans) that require monthly repayments?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'Yes': { exposure_points: 25 } }
        }
      ];
    case 'HLT':
      return [
        {
          question: `Do you currently have a Health Maintenance Organization (HMO) or health insurance plan?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 35 } }
        },
        {
          question: `If yes, are you satisfied with the limits and coverage of your current health plan?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', "I don't have one"]
        },
        {
          question: `Have you or a close family member ever had to pay out-of-pocket for a major medical emergency?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No']
        },
        {
          question: `Is there a history of critical illnesses (e.g., heart disease, cancer) in your family?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'Yes': { exposure_points: 30 } }
        },
        {
          question: `Do you have a Critical Illness insurance policy that pays a lump sum upon diagnosis?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        }
      ];
    case 'ENT':
      return [
        {
          question: `Does your business's revenue completely rely on your personal involvement?`,
          question_type: 'single_choice',
          answers: ['Yes completely', 'Partially', 'No it runs itself'],
          risk_logic: { 'Yes completely': { vulnerability_points: 30 }, 'Partially': { vulnerability_points: 15 } }
        },
        {
          question: `Have you provided personal guarantees for any business loans or debts?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'Yes': { exposure_points: 25 } }
        },
        {
          question: `If you were hospitalized for 3 months, would your business survive?`,
          question_type: 'single_choice',
          answers: ['Yes', 'No', 'Not sure'],
          risk_logic: { 'No': { vulnerability_points: 40 }, 'Not sure': { vulnerability_points: 20 } }
        },
        {
          question: `Do you have Key Person Insurance to protect the business if a vital team member is lost?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          risk_logic: { 'No': { vulnerability_points: 25 } }
        },
        {
          question: `Are your personal assets properly separated and protected from business liabilities?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No', 'Not sure'],
          risk_logic: { 'No': { exposure_points: 30 }, 'Not sure': { exposure_points: 15 } }
        }
      ];
    default:
      return [];
  }
};

flows.forEach(flow => {
  clearPrefix(flow.prefix + '_');
  const p = flow.prefix;
  const indStr = flow.name.toLowerCase();
  
  let questions = [];
  
  // 1. Welcome
  questions.push({
    id: `${p}_001`,
    industry: flow.ind,
    pillar: 'General',
    question: `Hello 👋\n\nWelcome to CoverScore AI.\n\nI'll help identify risks that may affect your ${flow.type === 'business' ? indStr + ', employees, facilities, and operations' : 'financial future, family, and wellbeing'}.\n\nAt the end of this assessment, you'll receive:\n\n✓ Risk Score™\n✓ Protection Gap Analysis\n✓ Priority Risk Areas\n✓ Personalized Risk Report\n\nThe assessment takes approximately 3-5 minutes.\n\nShall we begin?`,
    question_type: 'single_choice',
    answers: ['Yes', 'Tell Me More'],
    branching: { 'Yes': `${p}_003`, 'Tell Me More': `${p}_002`, 'DEFAULT': `${p}_002` }
  });
  
  // 2. Tell me more
  questions.push({
    id: `${p}_002`,
    industry: flow.ind,
    pillar: 'General',
    question: `CoverScore helps ${flow.type === 'business' ? 'business owners' : 'individuals'} identify hidden risks before they become costly incidents.\n\nWould you like to continue?`,
    question_type: 'single_choice',
    answers: ['Start Assessment', 'Not Now'],
    branching: { 'Start Assessment': `${p}_003`, 'Not Now': 'COMPLETE', 'DEFAULT': `${p}_003` }
  });

  // 3. Lead Capture
  let nextId = 3;
  if (flow.type === 'business') {
    questions.push({
      id: `${p}_003`, industry: flow.ind, pillar: 'General',
      question: `Great.\n\nTo personalize your report, what is the name of your ${indStr}?`,
      question_type: 'open_text', data_mapping: 'business_name',
      branching: { 'DEFAULT': `${p}_004` }
    });
    questions.push({
      id: `${p}_004`, industry: flow.ind, pillar: 'General',
      question: `Thanks!\n\nAnd what is your name?`,
      question_type: 'open_text', data_mapping: 'name',
      branching: { 'DEFAULT': `${p}_005` }
    });
    questions.push({
      id: `${p}_005`, industry: flow.ind, pillar: 'General',
      question: `Nice to meet you.\n\nWhat is your role?`,
      question_type: 'open_text', data_mapping: 'role',
      branching: { 'DEFAULT': `${p}_006` }
    });
    questions.push({
      id: `${p}_006`, industry: flow.ind, pillar: 'General',
      question: `Finally, what is your email address?\n\n(We'll send your completed Risk Report here)`,
      question_type: 'open_text', data_mapping: 'email',
      branching: { 'DEFAULT': `${p}_007` }
    });
    nextId = 7;
  } else {
    questions.push({
      id: `${p}_003`, industry: flow.ind, pillar: 'General',
      question: `Great.\n\nTo personalize your report, what is your full name?`,
      question_type: 'open_text', data_mapping: 'name',
      branching: { 'DEFAULT': `${p}_004` }
    });
    questions.push({
      id: `${p}_004`, industry: flow.ind, pillar: 'General',
      question: `Nice to meet you.\n\nFinally, what is your email address?\n\n(We'll send your completed Risk Report here)`,
      question_type: 'open_text', data_mapping: 'email',
      branching: { 'DEFAULT': `${p}_005` }
    });
    nextId = 5;
  }

  // 4. Tailored questions
  const specificQs = getSpecificQuestions(p);
  specificQs.forEach((q, index) => {
    const id = `${p}_${String(nextId).padStart(3, '0')}`;
    const nextIdStr = `${p}_${String(nextId + 1).padStart(3, '0')}`;
    
    // Add default branching to next ID if none provided
    if (!q.branching) {
      q.branching = { 'DEFAULT': nextIdStr };
    }
    
    q.id = id;
    q.industry = flow.ind;
    q.pillar = q.pillar || 'Exposure'; // default pillar if not provided
    
    questions.push(q);
    nextId++;
  });

  // 5. Closing questions
  const currentInsuranceAnswers = flow.type === 'business' 
    ? ['Fire & Property', 'Group Life / Health', 'Public Liability', 'Cyber Security', 'Motor / Fleet', 'None of the above']
    : ['Life Insurance', 'Health Insurance (HMO)', 'Vehicle Insurance', 'Property / Home', 'None of the above'];

  const finalQuestions = [
    {
      id: `${p}_${String(nextId).padStart(3, '0')}`,
      industry: flow.ind,
      pillar: 'General',
      question: `Which of these insurances do you currently have? (Select all that apply, e.g., A, C)`,
      question_type: 'multi_choice',
      answers: currentInsuranceAnswers,
      data_mapping: 'existing_insurance',
      branching: { 'DEFAULT': `${p}_${String(nextId + 1).padStart(3, '0')}` }
    },
    {
      id: `${p}_${String(nextId + 1).padStart(3, '0')}`,
      industry: flow.ind,
      pillar: 'General',
      question: `Thank you for completing the core assessment!\n\nBased on your responses, we've identified potential protection gaps.\n\nWould you like a complimentary 15-minute consultation with a Risk Advisor?`,
      question_type: 'single_choice',
      answers: ['Yes, please', 'No, just send my report'],
      data_mapping: 'consultation_preference',
      branching: { 'Yes, please': `${p}_${String(nextId + 2).padStart(3, '0')}`, 'No, just send my report': 'COMPLETE', 'DEFAULT': 'COMPLETE' }
    },
    {
      id: `${p}_${String(nextId + 2).padStart(3, '0')}`,
      industry: flow.ind,
      pillar: 'General',
      question: `Great! What time of day works best for a brief call?`,
      question_type: 'single_choice',
      answers: ['Morning', 'Afternoon', 'Evening'],
      data_mapping: 'consultation_time',
      branching: { 'DEFAULT': 'COMPLETE' }
    }
  ];

  questions.push(...finalQuestions);
  questionBank.push(...questions);
});

fs.writeFileSync(qbPath, JSON.stringify(questionBank, null, 2), 'utf8');
console.log('Successfully generated complete flows for 13 industries and personal funnels.');
