const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../data/coverscore.db'));

const templates = [
  { id: 'family_protection', title: 'Family Protection Score™', track: 'Personal', desc: 'Family protection readiness' },
  { id: 'health_protection', title: 'Health Protection Score™', track: 'Personal', desc: 'Health protection readiness' },
  { id: 'income_protection', title: 'Income Protection Score™', track: 'Personal', desc: 'Income protection readiness' },
  { id: 'retirement_readiness', title: 'Retirement Readiness Score™', track: 'Personal', desc: 'Retirement readiness' },
  { id: 'young_professional', title: 'Young Professional Score™', track: 'Personal', desc: 'Young professional protection' },
  { id: 'education_planning', title: 'Education Planning Assessment™', track: 'Personal', desc: 'Education planning readiness' },
  { id: 'financial_resilience', title: 'Personal Financial Resilience Score™', track: 'Personal', desc: 'Financial resilience and flexibility' }
];

const categories = {
  'FAM': 'Family Protection Risk™',
  'HLT': 'Health Protection Risk™',
  'INC': 'Income Protection Risk™',
  'LIF': 'Life & Disability Risk™',
  'RET': 'Retirement Readiness Risk™',
  'EDU': 'Education Funding Risk™',
  'AST': 'Asset Protection Risk™',
  'CYB': 'Fraud & Cyber Risk™',
  'FIN': 'Personal Financial Resilience Risk™'
};

const questions = [
  {
    id: 'PER-PRO-001',
    cat: 'RET',
    question: 'Which age range best describes you?',
    help: null,
    weight: 2,
    rules: {"Under 25": 20, "25–34": 30, "35–44": 45, "45–54": 65, "55–64": 80, "65 and above": 70, "Prefer not to say": 0},
    templates: ['family_protection', 'health_protection', 'income_protection', 'retirement_readiness', 'young_professional', 'education_planning', 'financial_resilience']
  },
  {
    id: 'PER-PRO-002',
    cat: 'INC',
    question: 'Which option best describes your current work situation?',
    help: null,
    weight: 8,
    rules: {"Full-time employed": 30, "Self-employed": 55, "Business owner": 50, "Contract or freelance worker": 65, "Currently unemployed": 85, "Retired": 50, "Student": 40, "Other": 50},
    templates: ['family_protection', 'income_protection', 'retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-PRO-003',
    cat: 'FIN',
    question: 'Which range best describes your average monthly income?',
    help: 'A range is enough. You do not need to enter an exact amount.',
    weight: 4,
    rules: {"Prefer not to say": 0, "Below ₦100,000": 20, "₦100,000–₦249,999": 40, "₦250,000–₦499,999": 60, "₦500,000–₦999,999": 80, "₦1,000,000–₦2,499,999": 90, "₦2,500,000 and above": 100},
    templates: ['family_protection', 'income_protection', 'retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-PRO-004',
    cat: 'FIN', // Mapped to FIN as fallback
    question: 'Which state do you currently live in?',
    help: null,
    weight: 0,
    rules: {"Lagos":0, "Abuja":0, "Rivers":0, "Other":0},
    templates: ['family_protection', 'health_protection', 'income_protection', 'retirement_readiness', 'young_professional', 'education_planning', 'financial_resilience']
  },
  {
    id: 'PER-FAM-001',
    cat: 'FAM',
    question: 'How many people currently depend on your income or financial support?',
    help: null,
    weight: 10,
    rules: {"None": 10, "1 person": 35, "2–3 people": 60, "4–5 people": 75, "More than 5 people": 90},
    templates: ['family_protection', 'health_protection', 'income_protection', 'education_planning', 'financial_resilience']
  },
  {
    id: 'PER-FAM-002',
    cat: 'FAM',
    question: 'Who currently depends on you financially?',
    help: null,
    weight: 6,
    rules: {"Spouse or partner": 50, "Children": 50, "Parent or guardian": 50, "Sibling": 50, "Extended family member": 50, "Other": 50},
    templates: ['family_protection', 'education_planning']
  },
  {
    id: 'PER-FAM-003',
    cat: 'EDU',
    question: 'Do you currently pay school fees or education-related expenses for anyone?',
    help: null,
    weight: 8,
    rules: {"No": 10, "Yes, for one person": 45, "Yes, for two or more people": 70, "Not currently, but expected within 3 years": 40, "Prefer not to say": 35},
    templates: ['family_protection', 'education_planning', 'financial_resilience']
  },
  {
    id: 'PER-FAM-004',
    cat: 'INC',
    question: 'How much does your household depend on your income?',
    help: null,
    weight: 10,
    rules: {"My income is not essential to household expenses": 15, "My income contributes but others can cover most expenses": 35, "My income covers about half of household expenses": 55, "My income covers most household expenses": 75, "My income is the only or main source of household income": 90},
    templates: ['family_protection', 'income_protection', 'financial_resilience']
  },
  {
    id: 'PER-INC-001',
    cat: 'INC',
    question: 'If you were unable to work or earn income unexpectedly, how long could your household continue meeting normal expenses?',
    help: null,
    weight: 12,
    rules: {"Less than 1 month": 95, "1–3 months": 75, "4–6 months": 45, "7–12 months": 25, "More than 12 months": 10, "Not sure": 70},
    templates: ['family_protection', 'health_protection', 'income_protection', 'financial_resilience']
  },
  {
    id: 'PER-FIN-001',
    cat: 'FIN',
    question: 'Do you have savings set aside specifically for unexpected expenses?',
    help: null,
    weight: 10,
    rules: {"Yes, enough for more than 6 months of expenses": 10, "Yes, enough for 3–6 months": 30, "Yes, but less than 3 months": 65, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'health_protection', 'income_protection', 'retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-FIN-002',
    cat: 'FIN',
    question: 'Do you have loans, rent obligations, school-fee commitments, or other regular payments that would be difficult to maintain if your income stopped?',
    help: null,
    weight: 8,
    rules: {"No significant regular obligations": 15, "Yes, but manageable with savings or other income": 35, "Yes, and they would become difficult within 3 months": 75, "Yes, and they would become difficult within 1 month": 95, "Not sure": 60},
    templates: ['family_protection', 'health_protection', 'income_protection', 'retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-INC-002',
    cat: 'INC',
    question: 'How stable has your income been over the last 12 months?',
    help: null,
    weight: 8,
    rules: {"Very stable": 15, "Mostly stable": 35, "Somewhat unpredictable": 60, "Frequently unpredictable": 80, "I currently have no regular income": 95},
    templates: ['family_protection', 'income_protection', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-LIF-001',
    cat: 'LIF',
    question: 'Do you currently have life assurance or another protection plan that could support your dependents if you died or became permanently disabled?',
    help: null,
    weight: 12,
    rules: {"Yes, and I believe it is adequate": 15, "Yes, but I am not sure it is enough": 50, "Yes, but it only covers a small amount": 65, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'income_protection', 'education_planning']
  },
  {
    id: 'PER-HLT-001',
    cat: 'HLT',
    question: 'Do you currently have health insurance or an HMO plan for yourself?',
    help: null,
    weight: 12,
    rules: {"Yes, with broad cover": 15, "Yes, but limited cover": 45, "Yes, through work but not sure of the benefits": 55, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'health_protection', 'retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-HLT-002',
    cat: 'HLT',
    question: 'Are your spouse, children, or other dependents covered by a health plan?',
    help: null,
    weight: 8,
    rules: {"Yes, all are covered": 15, "Some are covered": 55, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'health_protection']
  },
  {
    id: 'PER-INC-003',
    cat: 'INC',
    question: 'Do you have personal accident or disability protection that could help if an accident affected your ability to work?',
    help: null,
    weight: 10,
    rules: {"Yes, and I understand the cover": 15, "Yes, but I am not sure what it covers": 50, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'income_protection', 'young_professional']
  },
  {
    id: 'PER-EDU-001',
    cat: 'EDU',
    question: 'Do you currently have a dedicated plan or savings arrangement for education expenses?',
    help: null,
    weight: 10,
    rules: {"Yes, and it is reviewed regularly": 15, "Yes, but it may not be enough": 50, "No, but I plan to start": 70, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'education_planning', 'financial_resilience']
  },
  {
    id: 'PER-EDU-002',
    cat: 'EDU',
    question: 'If your income stopped for six months, would education expenses for your dependents remain manageable?',
    help: null,
    weight: 10,
    rules: {"Yes, comfortably": 10, "Yes, but with some difficulty": 45, "Probably not": 80, "No": 95, "Not sure": 70},
    templates: ['family_protection', 'education_planning']
  },
  {
    id: 'PER-RET-001',
    cat: 'RET',
    question: 'Do you currently have a clear retirement income plan beyond your regular monthly income?',
    help: null,
    weight: 12,
    rules: {"Yes, and I review it regularly": 15, "Yes, but I have not reviewed it recently": 40, "I have started planning but it is incomplete": 60, "No": 95, "Not sure": 75},
    templates: ['family_protection', 'retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-RET-002',
    cat: 'RET',
    question: 'How consistently do you save or invest toward long-term retirement goals?',
    help: null,
    weight: 10,
    rules: {"Every month": 15, "Most months": 35, "Occasionally": 65, "Rarely": 80, "Never": 95},
    templates: ['retirement_readiness', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-RET-003',
    cat: 'RET',
    question: 'When do you expect to reduce or stop full-time work?',
    help: null,
    weight: 6,
    rules: {"Within 5 years": 100, "Within 6–10 years": 80, "Within 11–20 years": 50, "More than 20 years from now": 20, "I am not sure": 60},
    templates: ['retirement_readiness']
  },
  {
    id: 'PER-AST-001',
    cat: 'AST',
    question: 'Do you own or regularly use a vehicle?',
    help: null,
    weight: 5,
    rules: {"Yes, I own one": 50, "Yes, I use a family or work vehicle regularly": 30, "No": 0},
    templates: ['family_protection', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-AST-002',
    cat: 'AST',
    question: 'What type of motor insurance do you currently have?',
    help: null,
    weight: 8,
    rules: {"Comprehensive motor insurance": 15, "Third-party motor insurance only": 55, "No current insurance": 95, "Not sure": 70},
    templates: ['family_protection', 'young_professional', 'financial_resilience']
  },
  {
    id: 'PER-AST-003',
    cat: 'AST',
    question: 'Do you have protection for your home contents, valuable electronics, or other important personal assets?',
    help: null,
    weight: 6,
    rules: {"Yes, adequate protection": 15, "Some protection": 50, "No": 85, "Not sure": 70},
    templates: ['young_professional', 'financial_resilience']
  },
  {
    id: 'PER-CYB-001',
    cat: 'CYB',
    question: 'Which statement best describes how you protect your online financial and personal accounts?',
    help: null,
    weight: 8,
    rules: {"I use strong unique passwords and multi-factor authentication": 15, "I use passwords but do not use multi-factor authentication consistently": 45, "I reuse passwords across several accounts": 75, "I am not sure how secure my accounts are": 70},
    templates: ['young_professional', 'financial_resilience']
  },
  {
    id: 'PER-CYB-002',
    cat: 'CYB',
    question: 'If you received an urgent message asking for your bank code, PIN, password, or verification number, what would you do?',
    help: null,
    weight: 8,
    rules: {"Ignore it and contact my bank through an official channel": 10, "Reply only if the message looks genuine": 70, "Share the information if the sender appears to be my bank": 95, "Not sure": 75},
    templates: ['young_professional', 'financial_resilience']
  }
];

const seed = async () => {
  db.serialize(() => {
    // 1. Insert Templates
    const stmtTemplate = db.prepare(`INSERT OR IGNORE INTO assessment_templates (id, title, track, description) VALUES (?, ?, ?, ?)`);
    templates.forEach(t => stmtTemplate.run(t.id, t.title, t.track, t.desc));
    stmtTemplate.finalize();

    // 2. Clear old personal questions to avoid duplication if re-run
    db.run(`DELETE FROM assessment_questions WHERE track = 'Personal'`);

    // 3. Insert Questions
    const stmtQ = db.prepare(`
      INSERT INTO assessment_questions 
      (id, template_id, track, category, question_text, help_text, answer_type, weight, risk_impact_rules) 
      VALUES (?, ?, 'Personal', ?, ?, ?, 'dynamic_multiple_choice', ?, ?)
    `);

    let count = 0;
    questions.forEach(q => {
      const categoryName = categories[q.cat] || q.cat;
      q.templates.forEach(templateId => {
        // ID must be unique in assessment_questions, but the schema uses `id` as PRIMARY KEY which means
        // if a question belongs to multiple templates, we must append the template_id to the id.
        const uniqueId = `${q.id}_${templateId}`;
        stmtQ.run(uniqueId, templateId, categoryName, q.question, q.help, q.weight, JSON.stringify(q.rules));
        count++;
      });
    });

    stmtQ.finalize();

    console.log(`✅ Successfully seeded ${count} Personal Assessment Questions across ${templates.length} templates.`);
  });
};

seed();
