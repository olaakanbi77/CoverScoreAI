const fs = require('fs');
const path = require('path');

/**
 * CoverScore Platform Blueprint™ v2 (Master Edition)
 * Question Pack Factory™
 * 
 * This engine generates the entire question bank from a standardized inheritance model.
 * Master Template (QP-100) dictates the conversation, lead capture, and closing engines.
 * All other Question Packs (QP-110 to QP-270) inherit these engines and only define overrides.
 */

class QuestionPackFactory {
  constructor() {
    this.questionBank = [];
  }

  // 1. Conversation Engine (Welcome, Tell Me More, Consent)
  buildConversationEngine(config) {
    const p = config.prefix;
    const isBiz = config.type === 'business';

    const introText = (config.overrides && config.overrides.intro_text) 
      ? config.overrides.intro_text 
      : `👋 Hello and welcome to CoverScore™.\n\nYou're about to discover how ${isBiz ? 'prepared your business is' : 'financially and personally prepared you are'} for unexpected life events.\n\nThis assessment takes about 5 minutes and you'll receive your personalized Risk Intelligence Report™ immediately after completion.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`;

    return [
      {
        id: `${p}_001`,
        industry: config.ind,
        pillar: 'General',
        question: introText,
        question_type: 'single_choice',
        answers: ["✅ Yes, let's begin", '❓ Tell me more'],
        branching: { "✅ Yes, let's begin": `${p}_003`, '❓ Tell me more': `${p}_002`, 'DEFAULT': `${p}_002` }
      },
      {
        id: `${p}_002`,
        industry: config.ind,
        pillar: 'General',
        question: `CoverScore helps people identify hidden risks before those risks become expensive problems.\n\nAt the end of this assessment, you'll receive:\n• Your overall CoverScore™\n• Your strongest areas\n• Your biggest risk gaps\n• Practical recommendations\n• Learning resources\n• Protection recommendations (where appropriate)\n\nReady to begin?`,
        question_type: 'single_choice',
        answers: ['✅ Start Assessment'],
        branching: { '✅ Start Assessment': `${p}_003`, 'DEFAULT': `${p}_003` }
      },
      {
        id: `${p}_003`,
        industry: config.ind,
        pillar: 'General',
        question: `Before we begin, we'd like your permission to securely process your responses so we can prepare your personalized report.\n\nYour information will remain private and will never be shared without your consent.\n\nDo you agree?`,
        question_type: 'single_choice',
        answers: ['✅ I Agree', '❌ Not Now'],
        branching: { '✅ I Agree': `${p}_004`, '❌ Not Now': 'COMPLETE', 'DEFAULT': 'COMPLETE' }
      }
    ];
  }

  // 2. Lead Capture Engine
  buildLeadCaptureEngine(config) {
    const p = config.prefix;
    let qs = [];
    if (config.type === 'business') {
      qs = [
        {
          id: `${p}_004`, industry: config.ind, pillar: 'General',
          question: `Great.\n\nLet's start with the name of your ${config.audience}.`,
          question_type: 'open_text', data_mapping: 'business_name',
          branching: { 'DEFAULT': `${p}_005` }
        },
        {
          id: `${p}_005`, industry: config.ind, pillar: 'General',
          question: `Thanks!\n\nAnd what is your name?`,
          question_type: 'open_text', data_mapping: 'name',
          branching: { 'DEFAULT': `${p}_006` }
        },
        {
          id: `${p}_006`, industry: config.ind, pillar: 'General',
          question: `Nice to meet you, {{name}}.\n\nWhat is your role?`,
          question_type: 'open_text', data_mapping: 'role',
          branching: { 'DEFAULT': `${p}_007` }
        },
        {
          id: `${p}_007`, industry: config.ind, pillar: 'General',
          question: `What's your email address?\n\n(Used to send your Risk Intelligence Report.)`,
          question_type: 'open_text', data_mapping: 'email',
          branching: { 'DEFAULT': `${p}_008` }
        },
        {
          id: `${p}_008`, industry: config.ind, pillar: 'General',
          question: `Which city do you currently operate in?`,
          question_type: 'open_text', data_mapping: 'city',
          branching: { 'DEFAULT': `${p}_009` }
        }
      ];
    } else {
      qs = [
        {
          id: `${p}_004`, industry: config.ind, pillar: 'General',
          question: `Great!\n\nLet's start with your first name.`,
          question_type: 'open_text', data_mapping: 'name',
          branching: { 'DEFAULT': `${p}_005` }
        },
        {
          id: `${p}_005`, industry: config.ind, pillar: 'General',
          question: `Nice to meet you, {{name}}.\n\nWhat's your email address?\n\n(Used to send your Risk Intelligence Report.)`,
          question_type: 'open_text', data_mapping: 'email',
          branching: { 'DEFAULT': `${p}_006` }
        },
        {
          id: `${p}_006`, industry: config.ind, pillar: 'General',
          question: `Which city do you currently live in?`,
          question_type: 'open_text', data_mapping: 'city',
          branching: { 'DEFAULT': `${p}_007` }
        }
      ];
    }
    return qs;
  }

  // 2a. Engagement Engine
  buildEngagementEngine(config, startId) {
    const p = config.prefix;
    const didYouKnow = (config.overrides && config.overrides.did_you_know_text)
      ? config.overrides.did_you_know_text
      : `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nMany ${config.audience}s believe they're financially prepared until an unexpected event interrupts their income.\n\nOur goal today is to help you discover any hidden gaps before they become real problems.\n\nLet's begin.`;

    return [
      {
        id: `${p}_${String(startId).padStart(3, '0')}`,
        industry: config.ind,
        pillar: 'General',
        question: didYouKnow,
        question_type: 'single_choice',
        answers: ['✅ Continue'],
        branching: { 'DEFAULT': `${p}_${String(startId + 1).padStart(3, '0')}` }
      }
    ];
  }

  // 2b. Qualification Engine
  buildQualificationEngine(config, startId) {
    const p = config.prefix;
    let qs = [];
    if (config.type === 'business') {
        qs = [
            {
                id: `${p}_${String(startId).padStart(3, '0')}`, industry: config.ind, pillar: 'General',
                question: `Which best describes your business stage?`,
                question_type: 'single_choice',
                answers: ['Just starting (0-1 yr)', 'Growing (1-3 yrs)', 'Established (3+ yrs)'],
                data_mapping: 'business_stage',
                branching: { 'DEFAULT': `${p}_${String(startId + 1).padStart(3, '0')}` }
            },
            {
                id: `${p}_${String(startId + 1).padStart(3, '0')}`, industry: config.ind, pillar: 'General',
                question: `Do you currently generate regular monthly revenue?`,
                question_type: 'yes_no',
                answers: ['Yes', 'No'],
                data_mapping: 'regular_revenue',
                branching: { 'DEFAULT': `${p}_${String(startId + 2).padStart(3, '0')}` }
            }
        ];
    } else {
        qs = [
            {
                id: `${p}_${String(startId).padStart(3, '0')}`, industry: config.ind, pillar: 'General',
                question: `What is your primary employment status?`,
                question_type: 'single_choice',
                answers: ['Full-time employed', 'Self-employed/Freelance', 'Unemployed/Student'],
                data_mapping: 'employment_status',
                branching: { 'DEFAULT': `${p}_${String(startId + 1).padStart(3, '0')}` }
            },
            {
                id: `${p}_${String(startId + 1).padStart(3, '0')}`, industry: config.ind, pillar: 'General',
                question: `What is your age range?`,
                question_type: 'single_choice',
                answers: ['18-25', '26-35', '36-45', '46-55', '56+'],
                data_mapping: 'age_range',
                branching: { 'DEFAULT': (config.overrides && config.overrides.extra_qual_questions) ? `${p}_${String(startId + 2).padStart(3, '0')}` : `${p}_${String(startId + 2).padStart(3, '0')}` }
            }
        ];
        
        if (config.overrides && config.overrides.extra_qual_questions) {
            config.overrides.extra_qual_questions.forEach((q, idx) => {
                const qId = startId + 2 + idx;
                const nextQId = startId + 2 + idx + 1;
                const isLast = idx === config.overrides.extra_qual_questions.length - 1;
                qs.push({
                    id: `${p}_${String(qId).padStart(3, '0')}`, industry: config.ind, pillar: 'General',
                    question: q.question,
                    question_type: q.question_type,
                    answers: q.answers,
                    data_mapping: q.data_mapping || `qual_extra_${idx}`,
                    branching: { 'DEFAULT': isLast ? `${p}_${String(nextQId).padStart(3, '0')}` : `${p}_${String(nextQId).padStart(3, '0')}` } // Wait, Assessment Intro Engine starts immediately after Qualification Engine returns. The Assessment Intro engine expects to start at startId + qs.length. So we don't branch to 'ASSESSMENT_CORE'. We branch to the next ID!
                });
            });
        }
    }
    
    // IMPORTANT FIX: ensure the last question in the qualification engine correctly points to the NEXT engine's start ID!
    // Since the main builder loop does `startId += qs.length`, the next engine will start at `startId + qs.length`.
    const totalLength = qs.length;
    qs[qs.length - 1].branching['DEFAULT'] = `${p}_${String(startId + totalLength).padStart(3, '0')}`;
    
    return qs;
  }

  // 2c. Assessment Intro Engine
  buildAssessmentIntroEngine(config, startId) {
    const p = config.prefix;
    return [
      {
        id: `${p}_${String(startId).padStart(3, '0')}`,
        industry: config.ind,
        pillar: 'General',
        question: `Excellent.\n\nYou've completed the introduction.\n\nWe're now moving into your personalized assessment.\n\nThere are only a few short sections, and you're already making great progress.\n\nProgress\n████░░░░░░\n12%`,
        question_type: 'single_choice',
        answers: ['✅ Start Questions'],
        branching: { 'DEFAULT': `${p}_${String(startId + 1).padStart(3, '0')}` }
      }
    ];
  }

  // 3. Closing & Advisor Integration Engine
  buildClosingEngine(config, startId) {
    const p = config.prefix;
    const advisorOffer = (config.overrides && config.overrides.advisor_offer_text)
      ? config.overrides.advisor_offer_text
      : `Would you like to schedule a free consultation with a Certified Risk Advisor?`;

    return [
      {
        id: `${p}_${String(startId).padStart(3, '0')}`,
        industry: config.ind,
        pillar: 'General',
        question: `Congratulations! You've completed your assessment.\n\nImmediately:\nGenerating your personalized report...\n✓ Calculating your CoverScore™\n✓ Identifying your strengths\n✓ Prioritizing your risks\n✓ Preparing recommendations\n\n█████████████`,
        question_type: 'single_choice',
        answers: ['✅ View My Results'],
        branching: { 'DEFAULT': `${p}_${String(startId + 1).padStart(3, '0')}` }
      },
      {
        id: `${p}_${String(startId + 1).padStart(3, '0')}`,
        industry: config.ind,
        pillar: 'General',
        question: `🎉 Congratulations, {{name}}!\n\nYour CoverScore™ is {{score}} / 100.\n{{riskLevel}} Resilience\n\n*Your Risk Pillars*\n{{strengths}}\n\n📄 View My Report: {{reportUrl}}\n\n${advisorOffer}`,
        question_type: 'yes_no',
        answers: ['Yes', 'No'],
        data_mapping: 'request_consultation',
        branching: { 'DEFAULT': 'awaiting_commitment' }
      }
    ];
  }

  // The Factory Pipeline
  buildQuestionPack(config) {
    console.log(`Building Question Pack: ${config.id} (${config.name}) - Inherits: ${config.parent}`);
    let qs = [];
    
    // 1. Load Conversation Engine
    qs.push(...this.buildConversationEngine(config));
    
    // 2. Load Lead Capture Engine
    const leadCapture = this.buildLeadCaptureEngine(config);
    qs.push(...leadCapture);

    let nextId = config.type === 'business' ? 9 : 7;

    // 3. Load Engagement Engine
    const engagement = this.buildEngagementEngine(config, nextId);
    qs.push(...engagement);
    nextId += engagement.length;

    // 4. Load Qualification Engine
    const qualification = this.buildQualificationEngine(config, nextId);
    qs.push(...qualification);
    nextId += qualification.length;

    // 5. Load Assessment Intro Engine
    const intro = this.buildAssessmentIntroEngine(config, nextId);
    qs.push(...intro);
    nextId += intro.length;

    // 6. Apply Overrides (Risk Pillars & Question Library)
    if (config.overrides && config.overrides.specific_questions) {
      const qCount = config.overrides.specific_questions.length;
      config.overrides.specific_questions.forEach((q, index) => {
        const id = `${config.prefix}_${String(nextId).padStart(3, '0')}`;
        const nextIdStr = `${config.prefix}_${String(nextId + 1).padStart(3, '0')}`;
        
        q.id = id;
        q.industry = config.ind;
        q.pillar = q.pillar || 'Exposure'; 
        if (!q.branching) {
          q.branching = { 'DEFAULT': nextIdStr };
        }
        
        // Micro-encouragement injection
        if (index === 2 && qCount > 3) {
          q.question = `Great job!\n\nYou're almost halfway there.\n\nEvery answer helps us make your report more accurate.\n\nProgress\n█████░░░░░\n40%\n\n---\n\n${q.question}`;
        }
        
        qs.push(q);
        nextId++;
      });
    }

    // 7. Load Closing Engine
    qs.push(...this.buildClosingEngine(config, nextId));
    
    this.questionBank.push(...qs);
  }

  export(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.questionBank, null, 2), 'utf8');
    console.log(`✅ Successfully generated ${this.questionBank.length} questions across all Question Packs.`);
  }
}

// ---------------------------------------------------------
// QUESTION PACK LIBRARY CONFIGURATION
// ---------------------------------------------------------

const questionPacks = [
  
  // ==========================================
  // PERSONAL LIBRARY
  // ==========================================
  
  {
    id: 'QP-100', parent: 'Master', prefix: 'YPR', name: 'Young Professional', ind: 'young_professional', type: 'personal', audience: 'young professional',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Young Professional Assessment.\n\nAs you build your career, unexpected life events can quickly derail your financial momentum.\n\nIn the next 3–5 minutes, we'll help you understand how prepared you are for financial risks and provide a personalized Risk Intelligence Report™ with practical recommendations.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nMost young professionals believe they're financially prepared until a single unexpected emergency wipes out their savings.\n\nOur goal today is to help you identify these hidden gaps before they become real problems.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Financial Advisor could help you prioritize your financial protection strategy as you advance in your career.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Career & Income Security', question: `How long have you been in your current career?`, question_type: 'single_choice', answers: ['Under 2 years', '2-5 years', 'Over 5 years'] },
        { pillar: 'Financial Resilience', question: `If you suffered a critical illness (e.g. cancer, stroke) today, could you afford the medical bills without going into debt?`, question_type: 'single_choice', answers: ['Yes easily', 'With difficulty', 'No'], risk_logic: { 'With difficulty': { vulnerability_points: 20 }, 'No': { vulnerability_points: 40 } } },
        { pillar: 'Financial Resilience', question: `Do you have an emergency fund covering at least 6 months of expenses?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Protection & Insurance', question: `Do you currently have personal Health or Accident Insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 20 } } },
        { pillar: 'Future Planning', question: `Are you currently saving towards a major life goal (e.g. buying a house, marriage)?`, question_type: 'yes_no', answers: ['Yes', 'No'] }
      ]
    }
  },
  {
    id: 'QP-110', parent: 'QP-100', prefix: 'ENT', name: 'Entrepreneur', ind: 'entrepreneur', type: 'personal', audience: 'entrepreneur',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Entrepreneur Assessment.\n\nYour business relies on your drive and vision, but personal and operational risks can threaten everything you've built.\n\nIn the next 3–5 minutes, we'll help you understand how protected you are and provide a personalized Risk Intelligence Report™ with actionable recommendations.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nMany entrepreneurs intertwine their personal assets with business liabilities, leaving their families exposed to commercial risks.\n\nOur goal today is to help you build an airtight firewall around your hard work.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Commercial Advisor could help you safeguard your business continuity and personal assets.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Business Continuity', question: `Does your business's revenue completely rely on your personal involvement?`, question_type: 'single_choice', answers: ['Yes completely', 'Partially', 'No it runs itself'], risk_logic: { 'Yes completely': { vulnerability_points: 30 }, 'Partially': { vulnerability_points: 15 } } },
        { pillar: 'Legal & Liability', question: `Have you provided personal guarantees for any business loans or debts?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'Yes': { exposure_points: 25 } } },
        { pillar: 'Business Continuity', question: `If you were hospitalized for 3 months, would your business survive?`, question_type: 'single_choice', answers: ['Yes', 'No', 'Not sure'], risk_logic: { 'No': { vulnerability_points: 40 }, 'Not sure': { vulnerability_points: 20 } } },
        { pillar: 'Employees', question: `Do you have Key Person Insurance to protect the business if a vital team member is lost?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Protection & Insurance', question: `Are your personal assets properly separated and protected from business liabilities?`, question_type: 'yes_no', answers: ['Yes', 'No', 'Not sure'], risk_logic: { 'No': { exposure_points: 30 }, 'Not sure': { exposure_points: 15 } } }
      ]
    }
  },
  {
    id: 'QP-120', parent: 'QP-100', prefix: 'FAM', name: 'Family Protection', ind: 'family', type: 'personal', audience: 'family member',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Family Protection Assessment.\n\nYour family relies on you, and ensuring their long-term stability in the face of unexpected events is your most important job.\n\nIn the next 3–5 minutes, we'll help you understand how well-protected your loved ones are and provide a personalized Risk Intelligence Report™.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nThe sudden loss of a primary income earner can disrupt a family's lifestyle, education plans, and home stability within months.\n\nOur goal today is to help you secure your family's future, no matter what happens.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Family Protection Advisor could help you structure a safety net that guarantees your family's peace of mind.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Personal Profile', question: `How many dependents (children or elderly relatives) rely on your income?`, question_type: 'single_choice', answers: ['None', '1-2', '3 or more'], risk_logic: { 'None': { exposure_points: 5 }, '1-2': { exposure_points: 20 }, '3 or more': { exposure_points: 35 } } },
        { pillar: 'Career & Income Security', question: `If you were suddenly unable to work due to illness, how long would your savings last?`, question_type: 'single_choice', answers: ['Less than 3 months', '3-6 months', 'Over 6 months'], risk_logic: { 'Less than 3 months': { vulnerability_points: 35 }, '3-6 months': { vulnerability_points: 15 } } },
        { pillar: 'Protection & Insurance', question: `Do you currently have a Life Insurance policy?`, question_type: 'yes_no', answers: ['Yes', 'No', 'Not sure'], risk_logic: { 'No': { vulnerability_points: 30 }, 'Not sure': { vulnerability_points: 20 } } },
        { pillar: 'Future Planning', question: `Are your children's future education costs secured if something happens to the primary breadwinner?`, question_type: 'yes_no', answers: ['Yes', 'No', 'Not applicable'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Health & Wellbeing', question: `Does your family have comprehensive Health Insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } }
      ]
    }
  },
  {
    id: 'QP-130', parent: 'QP-100', prefix: 'INC', name: 'Income Protection', ind: 'income', type: 'personal', audience: 'income earner',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Income Protection Assessment.\n\nYour ability to earn an income is your most valuable asset, yet it's often the least protected.\n\nIn the next 3–5 minutes, we'll help you understand how vulnerable your cash flow is to unexpected disruptions and provide a personalized Risk Intelligence Report™.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nA severe injury or illness can halt your income stream immediately, while your living expenses continue to accumulate.\n\nOur goal today is to help you identify income vulnerabilities so you can protect your livelihood.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Income Protection Advisor could help you guarantee that your lifestyle remains funded, even if you can't work.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Career & Income Security', question: `What is your primary source of income?`, question_type: 'single_choice', answers: ['Salary from employment', 'Freelance/Contract', 'Business owner'] },
        { pillar: 'Financial Resilience', question: `If you lost your primary income tomorrow, how long would your emergency funds last?`, question_type: 'single_choice', answers: ['Less than 1 month', '1-3 months', 'Over 3 months'], risk_logic: { 'Less than 1 month': { vulnerability_points: 40 }, '1-3 months': { vulnerability_points: 20 } } },
        { pillar: 'Career & Income Security', question: `Do you have secondary sources of income (e.g. investments, real estate)?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 10 } } },
        { pillar: 'Protection & Insurance', question: `Do you currently have a policy that pays you a monthly income if you are disabled by an accident?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Financial Resilience', question: `Do you have significant debts (mortgage, personal loans) that require monthly repayments?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'Yes': { exposure_points: 25 } } }
      ]
    }
  },
  {
    id: 'QP-140', parent: 'QP-100', prefix: 'HLT', name: 'Health Protection', ind: 'health', type: 'personal', audience: 'individual',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Health Protection Assessment.\n\nYour health is one of your greatest assets, but unexpected illness or medical emergencies can place enormous emotional and financial strain on you and your family.\n\nIn the next 3–5 minutes, we'll help you understand how prepared you are for health-related risks and provide a personalized Health Risk Intelligence Report™ with practical recommendations.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nA single serious illness can affect not only your health but also your income, savings, and long-term financial goals.\n\nOur goal today is to help you identify health protection gaps before they become costly problems.\n\nLet's begin.`,
      advisor_offer_text: `If you'd like, one of our Certified Risk Advisors can help you understand the most practical way to improve these areas.\n\nThe conversation is free and based entirely on your assessment.\n\nWould you like me to arrange it?`,
      extra_qual_questions: [
        {
          question: `Do you currently have any dependants who rely on you for healthcare decisions or financial support?`,
          question_type: 'yes_no',
          answers: ['Yes', 'No'],
          data_mapping: 'has_dependants'
        }
      ],
      specific_questions: [
        { pillar: 'Healthcare Access', question: `Do you currently have:`, question_type: 'single_choice', answers: ['Employer HMO', 'Private Health Insurance', 'Government Health Scheme', 'None'], risk_logic: { 'None': { vulnerability_points: 40 } }, recommendation_trigger: { condition: 'None', recommendation: 'Compare health plans that provide wider hospital coverage.', gap: 'You do not have active health insurance coverage.' } },
        { pillar: 'Financial Preparedness', question: `If you had to pay ₦2,000,000 for emergency treatment tomorrow, how would you most likely pay?`, question_type: 'single_choice', answers: ['Savings', 'Insurance', 'Loan', 'Family/Friends', "I don't know"], risk_logic: { "I don't know": { vulnerability_points: 30 }, 'Loan': { vulnerability_points: 25 }, 'Family/Friends': { vulnerability_points: 20 } }, recommendation_trigger: { condition: 'Loan', recommendation: 'Build a medical emergency fund.', gap: 'You rely on loans or borrowing for emergency medical expenses.' } },
        { pillar: 'Medical History', question: `Have you ever been diagnosed with:`, question_type: 'single_choice', answers: ['Hypertension', 'Diabetes', 'Asthma', 'None'], risk_logic: { 'Hypertension': { exposure_points: 20 }, 'Diabetes': { exposure_points: 20 }, 'Asthma': { exposure_points: 15 } }, recommendation_trigger: { condition: 'Hypertension', recommendation: 'Review your HMO benefits to ensure chronic care is covered.', gap: 'You have a chronic condition that requires specialized coverage.' } },
        { pillar: 'Lifestyle', question: `How often do you have routine medical check-ups?`, question_type: 'single_choice', answers: ['Every 6 months', 'Annually', 'Rarely/Only when sick'], risk_logic: { 'Rarely/Only when sick': { vulnerability_points: 20 } }, recommendation_trigger: { condition: 'Rarely/Only when sick', recommendation: 'Schedule an annual preventive health screening.', gap: 'You are missing out on early detection through routine check-ups.' } },
        { pillar: 'Protection & Insurance', question: `If your doctor recommended surgery tomorrow, would your current health cover pay for most of the cost?`, question_type: 'single_choice', answers: ['Yes', 'No', 'Not sure'], risk_logic: { 'No': { vulnerability_points: 35 }, 'Not sure': { vulnerability_points: 20 } }, recommendation_trigger: { condition: 'No', recommendation: 'Consider Critical Illness Insurance if appropriate for your circumstances.', gap: 'Your current cover is inadequate for major surgical procedures.' } },
        { pillar: 'Recovery & Resilience', question: `If illness prevented you from working for three months, would your household still be financially stable?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 35 } }, recommendation_trigger: { condition: 'No', recommendation: 'Explore income protection options.', gap: 'Your household is highly vulnerable to loss of income due to illness.' } }
      ]
    }
  },
  {
    id: 'QP-150', parent: 'QP-100', prefix: 'RET', name: 'Retirement Planning', ind: 'retirement', type: 'personal', audience: 'future retiree',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Retirement Planning Assessment.\n\nYou've worked hard to build your nest egg, but medical inflation and longevity risks can threaten your golden years.\n\nIn the next 3–5 minutes, we'll evaluate the resilience of your retirement strategy and provide a personalized Risk Intelligence Report™.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nUnexpected healthcare costs and long-term care needs are the leading causes of retirement savings depletion.\n\nOur goal today is to help you identify and mitigate the risks that could outlive your savings.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Retirement Advisor could help you preserve your wealth and secure your independence.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Future Planning', question: `How soon do you plan to retire?`, question_type: 'single_choice', answers: ['Within 5 years', '5-15 years', 'Over 15 years'], risk_logic: { 'Within 5 years': { exposure_points: 30 }, '5-15 years': { exposure_points: 15 } } },
        { pillar: 'Financial Resilience', question: `Do you have a dedicated Pension or Retirement Savings Account (RSA)?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 40 } } },
        { pillar: 'Health & Wellbeing', question: `Are you concerned that escalating medical costs might deplete your retirement savings?`, question_type: 'single_choice', answers: ['Very concerned', 'Somewhat concerned', 'Not concerned'] },
        { pillar: 'Protection & Insurance', question: `Do you have a plan in place for long-term care or critical illness during retirement?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Future Planning', question: `If you pass away, will your spouse or dependents have enough income to maintain their lifestyle?`, question_type: 'single_choice', answers: ['Yes', 'No', 'Not applicable'], risk_logic: { 'No': { vulnerability_points: 30 } } }
      ]
    }
  },
  // Future Placeholder Example
  {
    id: 'QP-160', parent: 'QP-100', prefix: 'HOM', name: 'Home Protection', ind: 'home', type: 'personal', audience: 'homeowner',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Home Protection Assessment.\n\nYour home is likely your biggest financial investment, but natural disasters, theft, and liability risks are unpredictable.\n\nIn the next 3–5 minutes, we'll help you understand how protected your property is and provide a personalized Risk Intelligence Report™.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nMany homeowners and renters realize their insurance coverage is inadequate only after a catastrophic loss has occurred.\n\nOur goal today is to ensure your sanctuary and possessions are fully secured.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Property Advisor could help you optimize your home insurance to avoid costly out-of-pocket repairs.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Property & Assets', question: `Do you currently own or rent your primary residence?`, question_type: 'single_choice', answers: ['Own', 'Rent', 'Neither'] },
        { pillar: 'Protection & Insurance', question: `Do you have Homeowner's or Renter's Insurance covering your personal property?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 30 } } }
      ]
    }
  },
  {
    id: 'QP-170', parent: 'QP-100', prefix: 'MOT', name: 'Motor Protection', ind: 'motor', type: 'personal', audience: 'vehicle owner',
    overrides: {
      intro_text: `👋 Welcome to CoverScore™ Motor Protection Assessment.\n\nYour vehicle keeps your life moving, but accidents, theft, and third-party liabilities can strike at any moment.\n\nIn the next 3–5 minutes, we'll evaluate your exposure on the road and provide a personalized Risk Intelligence Report™.\n\nThere are no right or wrong answers—just answer honestly.\n\nShall we begin?`,
      did_you_know_text: `Perfect.\n\nWe're ready to personalize your assessment.\n\nBefore we dive into the questions...\n\nDid you know?\nThird-party liability claims from a serious road accident can easily exceed the value of the vehicle itself.\n\nOur goal today is to ensure you're comprehensively protected behind the wheel.\n\nLet's begin.`,
      advisor_offer_text: `Based on your assessment, a short conversation with a CoverScore Motor Advisor could help you structure a policy that truly protects you and your assets on the road.\n\nWould you like to schedule a free consultation?`,
      specific_questions: [
        { pillar: 'Property & Assets', question: `How many vehicles do you currently own or lease?`, question_type: 'single_choice', answers: ['1', '2', '3 or more'] },
        { pillar: 'Protection & Insurance', question: `Is your primary vehicle covered by Comprehensive Motor Insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 40 } } }
      ]
    }
  },
  
  // ==========================================
  // BUSINESS LIBRARY
  // ==========================================
  
  {
    id: 'QP-200', parent: 'QP-100', prefix: 'SME', name: 'SME', ind: 'sme', type: 'business', audience: 'business',
    overrides: {
      specific_questions: [
        { pillar: 'Employees', question: `How many employees/staff do you have?`, question_type: 'single_choice', answers: ['1-10', '11-50', '51+'], risk_logic: { '1-10': { exposure_points: 5 }, '11-50': { exposure_points: 15 }, '51+': { exposure_points: 25 } } },
        { pillar: 'Cash Flow', question: `What is your estimated annual revenue?`, question_type: 'single_choice', answers: ['Under ₦50M', '₦50M - ₦200M', 'Over ₦200M'], risk_logic: { 'Under ₦50M': { exposure_points: 10 }, '₦50M - ₦200M': { exposure_points: 20 }, 'Over ₦200M': { exposure_points: 30 } } },
        { pillar: 'Facilities', question: `Do you operate from a physical shop or office?`, question_type: 'yes_no', answers: ['Yes', 'No'] },
        { pillar: 'Protection & Insurance', question: `Do you currently have a comprehensive Fire & Burglary Insurance policy?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Business Continuity', question: `If a major disaster forced you to close for 3 months, could you survive without revenue?`, question_type: 'single_choice', answers: ['Yes easily', 'With difficulty', 'No, we would close'], risk_logic: { 'With difficulty': { impact_points: 20 }, 'No, we would close': { impact_points: 40 } } }
      ]
    }
  },
  {
    id: 'QP-210', parent: 'QP-100', prefix: 'MFG', name: 'Manufacturing', ind: 'manufacturing', type: 'business', audience: 'manufacturing plant',
    overrides: {
      specific_questions: [
        { pillar: 'Employees', question: `How many factory workers do you employ?`, question_type: 'single_choice', answers: ['1-50', '51-200', '200+'], risk_logic: { '1-50': { exposure_points: 10 }, '51-200': { exposure_points: 20 }, '200+': { exposure_points: 30 } } },
        { pillar: 'Operations', question: `If a critical machine breaks down, how quickly would it halt operations?`, question_type: 'single_choice', answers: ['Immediately', 'Within a few days', 'We have backups'], risk_logic: { 'Immediately': { vulnerability_points: 30 }, 'Within a few days': { vulnerability_points: 15 } } },
        { pillar: 'Logistics', question: `Do you import raw materials or export finished goods?`, question_type: 'yes_no', answers: ['Yes', 'No'], recommendation_trigger: { condition: 'Yes', recommendation: 'Marine/Goods In Transit Insurance required' } },
        { pillar: 'Protection & Insurance', question: `Do you have comprehensive Fire & Special Perils insurance for your warehouse/factory?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 30 } } },
        { pillar: 'Business Continuity', question: `If a major fire forced you to close for 3 months, could you survive without revenue?`, question_type: 'single_choice', answers: ['Yes easily', 'With difficulty', 'No, we would close'], risk_logic: { 'With difficulty': { impact_points: 20 }, 'No, we would close': { impact_points: 40 } } }
      ]
    }
  },
  {
    id: 'QP-220', parent: 'QP-100', prefix: 'HOS', name: 'Hospital', ind: 'hospital', type: 'business', audience: 'hospital',
    overrides: {
      specific_questions: [
        { pillar: 'Operations', question: `Approximately how many patient beds does your facility have?`, question_type: 'single_choice', answers: ['Under 20', '20-100', 'Over 100'], risk_logic: { 'Under 20': { exposure_points: 10 }, '20-100': { exposure_points: 20 }, 'Over 100': { exposure_points: 30 } } },
        { pillar: 'Cyber Security', question: `Are patient records stored electronically?`, question_type: 'yes_no', answers: ['Yes', 'No'], recommendation_trigger: { condition: 'Yes', recommendation: 'Cyber Liability Insurance required' } },
        { pillar: 'Legal & Liability', question: `Do you have Medical Malpractice/Professional Indemnity insurance for your doctors and staff?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 35 } } },
        { pillar: 'Facilities', question: `Do you have high-value medical equipment (e.g., MRI, X-Ray) that would be costly to replace?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'Yes': { exposure_points: 15 } } },
        { pillar: 'Protection & Insurance', question: `If a power surge destroyed critical life-support equipment, do you have Machinery Breakdown insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } }
      ]
    }
  },
  {
    id: 'QP-230', parent: 'QP-100', prefix: 'SCH', name: 'School', ind: 'school', type: 'business', audience: 'school',
    overrides: {
      specific_questions: [
        { pillar: 'Operations', question: `How many students are enrolled in your school?`, question_type: 'single_choice', answers: ['Under 100', '100-500', 'Over 500'], risk_logic: { 'Under 100': { exposure_points: 10 }, '100-500': { exposure_points: 20 }, 'Over 500': { exposure_points: 30 } } },
        { pillar: 'Cash Flow', question: `What is the estimated average annual tuition fee per student?`, question_type: 'single_choice', answers: ['Under ₦100,000', '₦100,000 - ₦500,000', 'Over ₦500,000'], data_mapping: 'tuition_fees' },
        { pillar: 'Logistics', question: `Do you operate school buses to transport students?`, question_type: 'yes_no', answers: ['Yes', 'No'], recommendation_trigger: { condition: 'Yes', recommendation: 'Comprehensive Motor Fleet Insurance required' } },
        { pillar: 'Legal & Liability', question: `If a student was injured on the playground and parents sued, do you have Public Liability Insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 30 } } },
        { pillar: 'Protection & Insurance', question: `Do you currently have a comprehensive Fire Insurance policy for your school buildings?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } }
      ]
    }
  },
  {
    id: 'QP-240', parent: 'QP-100', prefix: 'CHR', name: 'Church', ind: 'church', type: 'business', audience: 'church',
    overrides: {
      specific_questions: [
        { pillar: 'Operations', question: `What is your average weekly congregation size?`, question_type: 'single_choice', answers: ['Under 200', '200-1000', 'Over 1000'], risk_logic: { 'Under 200': { exposure_points: 10 }, '200-1000': { exposure_points: 20 }, 'Over 1000': { exposure_points: 40 } } },
        { pillar: 'Facilities', question: `Do you have high-value musical instruments and broadcast equipment on the premises?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'Yes': { exposure_points: 15 } } },
        { pillar: 'Legal & Liability', question: `If a visitor was injured during a service and sued, do you have Public Liability Insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Facilities', question: `Do you own the church building?`, question_type: 'yes_no', answers: ['Yes', 'No'] },
        { pillar: 'Protection & Insurance', question: `Do you currently have Fire Insurance for the building and its contents?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 30 } } }
      ]
    }
  },
  {
    id: 'QP-260', parent: 'QP-100', prefix: 'CON', name: 'Construction', ind: 'construction', type: 'business', audience: 'construction firm',
    overrides: {
      specific_questions: [
        { pillar: 'Operations', question: `How many active construction projects do you typically manage at once?`, question_type: 'single_choice', answers: ['1-2', '3-5', 'More than 5'], risk_logic: { '1-2': { exposure_points: 10 }, '3-5': { exposure_points: 20 }, 'More than 5': { exposure_points: 30 } } },
        { pillar: 'Facilities', question: `Do you use heavy construction machinery (e.g., excavators, cranes)?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'Yes': { exposure_points: 20 } } },
        { pillar: 'Protection & Insurance', question: `Do you currently have Contractors All Risk (CAR) insurance for your sites?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 30 } } },
        { pillar: 'Employees', question: `If a worker is injured on site, do you have Group Personal Accident or Employers Liability insurance?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Business Continuity', question: `If a project is delayed due to an unforeseen accident, do you have cover for the resulting financial loss?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 15 } } }
      ]
    }
  },
  {
    id: 'QP-270', parent: 'QP-100', prefix: 'TRN', name: 'Transport & Logistics', ind: 'transport', type: 'business', audience: 'logistics company',
    overrides: {
      specific_questions: [
        { pillar: 'Operations', question: `How many vehicles are in your fleet?`, question_type: 'single_choice', answers: ['1-5', '6-20', 'Over 20'], risk_logic: { '1-5': { exposure_points: 10 }, '6-20': { exposure_points: 20 }, 'Over 20': { exposure_points: 30 } } },
        { pillar: 'Operations', question: `Do you primarily transport goods (cargo) or passengers?`, question_type: 'single_choice', answers: ['Goods', 'Passengers', 'Both'] },
        { pillar: 'Protection & Insurance', question: `Do you have Goods In Transit (GIT) insurance for the cargo you carry?`, question_type: 'single_choice', answers: ['Yes', 'No', 'Not Applicable'], risk_logic: { 'No': { vulnerability_points: 25 } } },
        { pillar: 'Employees', question: `If a driver is involved in a severe accident, do you have Group Life / Personal Accident cover for them?`, question_type: 'yes_no', answers: ['Yes', 'No'], risk_logic: { 'No': { vulnerability_points: 20 } } },
        { pillar: 'Protection & Insurance', question: `Are your vehicles covered by Comprehensive Motor Insurance?`, question_type: 'single_choice', answers: ['Yes', 'No', 'Some of them'], risk_logic: { 'No': { vulnerability_points: 30 }, 'Some of them': { vulnerability_points: 15 } } }
      ]
    }
  }
];

// Initialize the Factory
const factory = new QuestionPackFactory();

// Build each Question Pack using the Inheritance Model
questionPacks.forEach(pack => {
  factory.buildQuestionPack(pack);
});

// Export the Unified JSON to the Engine
const qbPath = path.join(__dirname, '../src/data/question_bank.json');
factory.export(qbPath);
