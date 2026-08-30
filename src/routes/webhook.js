const express = require('express');
const router = express.Router();
const { sendWhatsApp, sendWhatsAppToGroup } = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { get, run, computeLeadScore } = require('../config/database');
const { generateRiskReport, getLeadQualifier } = require('../services/aiService');
const { calculateScore } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/cre');
const ccieEngine = require('../services/ccieEngine');
const { CCIE_EVENTS, publishEvent } = require('../services/ccieEvents');
const questionBank = require('../data/question_bank.json');
const { domainConfig, defaultDomain } = require('../config/domain');
const { notify, notifyRole } = require('../services/notify');

const flowMap = {
  'school': 'SCH', 'manufacturing': 'MFG', 'hospital': 'HOS', 'healthcare': 'HOS',
  'church': 'CHR', 'construction': 'CON', 'transport': 'TRN', 'logistics': 'TRN',
  'family': 'FAM', 'personal': 'FAM', 'individual': 'FAM',
  'young': 'YPR', 'retirement': 'RET', 'income': 'INC', 'health': 'HLT',
  'entrepreneur': 'ENT', 'sme': 'SME', 'business': 'SME',
  'hotel': 'HOT', 'hotels': 'HOT', 'hospitality': 'HOT', 'lodging': 'HOT'
};
const { runRiskIntelligence } = require('../rie/index');
const { renewalEngine } = require('../renewals/index');

const resolvePrefix = (ind) => {
  if (!ind) return 'SME';
  const lowerInd = ind.toLowerCase();
  for (const [key, val] of Object.entries(flowMap)) {
    if (lowerInd.includes(key)) return val;
  }
  return 'SME';
};

const assessmentTypeMap = {
  FAM: 'family', RET: 'retirement', HLT: 'health', INC: 'income',
  YPR: 'young_professional', ENT: 'entrepreneur',
  SME: 'sme', SCH: 'school', HOS: 'hospital', MFG: 'manufacturing',
  CHR: 'church', CON: 'construction', TRN: 'transport', HOT: 'hotel'
};

const generateCoverScoreInsight = (pillarScores, answers, name, prefix) => {
  const entries = Object.entries(pillarScores || {}).sort(([, a], [, b]) => a - b);
  if (entries.length === 0) return null;
  const weakest = entries[0];
  const weakestName = weakest[0];
  const weakestScore = weakest[1];
  const dom = domainConfig[prefix] || defaultDomain;

  // For INC, build a single concise discovery paragraph
  if (prefix === 'INC') {
    const incomeSrc = answers['INC_011'];
    const savings = answers['INC_012'];
    const hasProtection = answers['INC_014'];
    const incomeStop = answers['INC_018'];

    let srcPhrase = 'your income';
    if (incomeSrc === 'Salary from employment') srcPhrase = 'your salary';
    else if (incomeSrc === 'Freelance/Contract') srcPhrase = 'your freelance income';
    else if (incomeSrc === 'Business owner') srcPhrase = 'your business income';

    let savingsPhrase = '';
    const savingsMap = {
      'Less than 1 month': 'less than one month of expenses',
      '1-3 months': 'about 1\u20133 months of expenses',
      '3-6 months': 'about 3\u20136 months of expenses',
      '6+ months': 'over six months of expenses'
    };
    if (savings && savingsMap[savings]) savingsPhrase = savingsMap[savings];
    else savingsPhrase = 'less than one month of expenses';

    let protectionPhrase = '';
    if (hasProtection === 'No') protectionPhrase = "and you don't have income protection cover";

    let incomeStopPhrase = '';
    if (incomeStop === 'It would stop completely' || !incomeStop) {
      incomeStopPhrase = 'an unexpected illness or injury could put your finances under severe pressure before you\u2019re able to recover';
    } else if (incomeStop === 'It would reduce significantly') {
      incomeStopPhrase = 'even a partial income reduction could create financial pressure that affects your daily life and long-term plans';
    } else if (incomeStop === 'My income would continue') {
      incomeStopPhrase = 'while your income would continue during disruption, gaps in savings and protection remain';
    }

    const middle = protectionPhrase ? `, ${protectionPhrase}` : '';
    const body = `Your assessment shows that your income resilience currently depends almost entirely on ${srcPhrase}. Because your emergency savings would cover only ${savingsPhrase}${middle}, ${incomeStopPhrase}. The question isn\u2019t whether you\u2019ll face a disruption\u2014it\u2019s whether your finances can survive one.`;
    return `CoverScore Insight\u2122 \u2B50\n\n${body}`;
  }

  // For all other prefixes, use domain config insight texts (concise single paragraph)
  const renderPillarText = (name) => {
    const pillarDef = dom.insightTexts?.perPillar?.[name];
    if (!pillarDef) return null;
    let text = pillarDef.base;
    for (const check of (pillarDef.answerChecks || [])) {
      const answer = answers[check.q];
      if (!answer) continue;
      const matched = check.values
        ? check.values.includes(answer)
        : check.condition?.(answer);
      if (matched) {
        const append = typeof check.append === 'function' ? check.append(answer) : check.append;
        text += ' ' + append;
      }
    }
    if (pillarDef.suffix) text += ' ' + pillarDef.suffix;
    return text;
  };

  const weakestPillarText = renderPillarText(weakestName);
  let body = weakestPillarText || dom.insightTexts?.catchAll ||
    `Your assessment shows that your biggest opportunity to strengthen your ${dom.improvementTerm} is your ${weakestName.toLowerCase()}. The cost of acting is far less than the cost of waiting.`;

  // Surface the second-weakest pillar when it is also notably weak, so the
  // insight reflects more than just the single weakest area
  const second = entries[1];
  if (second && second[1] < 30) {
    const secondPillarText = renderPillarText(second[0]);
    if (secondPillarText && secondPillarText !== weakestPillarText) {
      body += `\n\n${secondPillarText}`;
    }
  }

  // Reflect the client's stated biggest concern so the insight feels personal
  if (prefix === 'SCH' && answers['SCH_028']) {
    const concernMap = {
      'Student safety and accident prevention': 'student safety',
      'Financial stability and revenue': 'financial stability',
      'Property / facility condition': 'the condition of your facilities',
      'Regulatory and compliance readiness': 'regulatory and compliance readiness',
      'Transport safety': 'transport safety'
    };
    const concern = concernMap[answers['SCH_028']];
    if (concern) {
      body += ` Your stated priority is ${concern}, so the actions below focus on the areas that matter most to you.`;
    }
  }

  return `CoverScore Insight\u2122 \u2B50\n\n${body}`;
};

const buildAdvisorBrief = (assessmentData, lead, phoneNumber, prefix, dom, qualifierOutput, appBase) => {
  const answers = assessmentData.answers || {};
  const score = assessmentData.score || lead.score || 0;
  const riskLevel = assessmentData.riskLevel || lead.risk_level || 'Moderate';
  const riskEmojis = { Critical: '\uD83D\uDD34', 'High Risk': '\uD83D\uDD34', Moderate: '\uD83D\uDFE0', Low: '\uD83D\uDFE1', 'Very Low': '\uD83D\uDFE2' };
  const riskEmoji = riskEmojis[riskLevel] || '\uD83D\uDD34';
  const cats = assessmentData.risk_categories || {};
  const name = assessmentData.name || lead.name || 'Client';
  const businessName = assessmentData.business_name || '';
  const rie = assessmentData.rie || {};
  const products = rie.recommendedProducts || [];
  const weakestCats = Object.entries(cats).sort(([, a], [, b]) => a - b).slice(0, 3);

  // Domain labels per funnel
  const entityLabels = {
    FAM: 'Family', YPR: 'Young Professional', ENT: 'Entrepreneur',
    INC: 'Individual', RET: 'Retiree', HLT: 'Individual',
    HOM: 'Homeowner', MOT: 'Vehicle Owner',
    SCH: 'School', SME: 'Business', MFG: 'Manufacturing',
    HOS: 'Hospital', CHR: 'Church', CON: 'Construction', TRN: 'Transport'
  };
  const entityLabel = entityLabels[prefix] || 'Client';

  const personalFunnels = ['FAM', 'YPR', 'ENT', 'INC', 'RET', 'HLT', 'HOM', 'MOT'];
  const isPersonal = personalFunnels.includes(prefix);

  // Build priority risk areas dynamically from pillar scores and answers
  const buildRiskAreas = () => {
    const areas = [];
    for (const [catName, catScore] of Object.entries(cats).sort(([, a], [, b]) => a - b)) {
      if (catScore >= 60) continue;
      const label = catScore < 30 ? 'Critical' : catScore < 50 ? 'High' : 'Moderate';
      const gaps = [];
      // === BUSINESS FUNNEL CHECKS ===
      if (prefix === 'SCH') {
        if (catName === 'Property Protection' || catName === 'Property') {
          if (answers['SCH_017'] === 'No') gaps.push('No Fire Insurance');
          if (answers['SCH_026'] === 'No') gaps.push('No functional fire alarm system');
          if (answers['SCH_021'] === 'No') gaps.push('Fire extinguishers not adequately provided or inspected');
          if (answers['SCH_027'] === 'Never' || answers['SCH_027'] === 'Rarely') gaps.push('Building maintenance rarely conducted');
        }
        if (catName === 'Student Safety' || catName === 'Liability Protection') {
          if (answers['SCH_012'] === 'Yes') gaps.push('Previous student accidents reported');
          if (answers['SCH_020'] === 'No') gaps.push('No documented emergency response procedures');
          if (answers['SCH_016'] === 'No') gaps.push('No liability / injury protection');
        }
        if (catName === 'Business Continuity' || catName === 'Financial Resilience') {
          if (answers['SCH_022'] === 'No') gaps.push('School unlikely to sustain operations during prolonged closure');
        }
        if (catName === 'Transport Safety') {
          if (answers['SCH_015'] === 'Yes') gaps.push('School buses in operation');
          if (answers['SCH_024'] === 'No') gaps.push('Drivers not trained in first aid or defensive driving');
          if (answers['SCH_025'] === 'No') gaps.push('No routine vehicle safety inspections');
        }
      }
      if (prefix === 'SME') {
        if (catName === 'Property Protection') {
          if (answers['SME_016'] === 'No') gaps.push('No fire / burglary insurance');
        }
        if (catName === 'Business Continuity') {
          if (answers['SME_017'] === 'No, we would close' || answers['SME_017'] === 'With difficulty') gaps.push('Business would not survive 3-month closure');
        }
      }
      // === PERSONAL FUNNEL CHECKS ===
      if (prefix === 'HLT') {
        if (catName === 'Healthcare Access') {
          if (answers['HLT_012'] === 'None') gaps.push('No health insurance coverage');
          if (answers['HLT_012'] === 'Government Health Scheme') gaps.push('Government scheme may not cover major procedures');
        }
        if (catName === 'Financial Health Protection' || catName === 'Financial Preparedness') {
          if (answers['HLT_013'] === 'Loan' || answers['HLT_013'] === "I don't know") gaps.push('Would rely on loans for emergency medical costs');
          if (answers['HLT_016'] === 'No') gaps.push('Current cover inadequate for major surgery');
        }
        if (catName === 'Medical Risk Profile') {
          if (answers['HLT_014'] && answers['HLT_014'] !== 'None') gaps.push(`Chronic condition: ${answers['HLT_014']}`);
        }
        if (catName === 'Household Resilience') {
          if (answers['HLT_017'] === 'No') gaps.push('Household vulnerable to income loss from illness');
        }
      }
      if (prefix === 'INC') {
        if (catName === 'Emergency Financial Buffer') {
          if (answers['INC_012'] === 'Less than 1 month') gaps.push('Emergency savings cover less than 1 month');
          if (answers['INC_012'] === '1-3 months') gaps.push('Emergency savings cover only 1-3 months');
        }
        if (catName === 'Income Protection Cover') {
          if (answers['INC_014'] === 'No') gaps.push('No disability income protection policy');
        }
        if (catName === 'Income Stability') {
          if (answers['INC_013'] === 'No') gaps.push('No secondary source of income');
        }
        if (catName === 'Financial Commitments') {
          if (answers['INC_015'] === 'Yes') gaps.push('Significant debt requiring monthly repayments');
        }
      }
      if (prefix === 'FAM') {
        if (catName === 'Career & Income Security' || catName === 'Emergency Financial Buffer') {
          if (answers['FAM_012'] === 'Less than 3 months') gaps.push('Savings would last less than 3 months');
        }
        if (catName === 'Protection & Insurance') {
          if (answers['FAM_013'] === 'No') gaps.push('No life insurance policy in place');
          if (answers['FAM_013'] === 'Not sure') gaps.push('Unsure about life insurance status');
          if (answers['FAM_015'] === 'No') gaps.push('No family health insurance');
        }
        if (catName === 'Future Planning') {
          if (answers['FAM_014'] === 'No') gaps.push("Children's education not secured");
        }
      }
      if (prefix === 'ENT') {
        if (catName === 'Business Continuity') {
          if (answers['ENT_011'] === 'Yes completely') gaps.push('Revenue 100% dependent on personal involvement');
          if (answers['ENT_013'] === 'No') gaps.push('Business would not survive 3-month absence');
          if (answers['ENT_013'] === 'Not sure') gaps.push('Unsure if business could survive without you');
        }
        if (catName === 'Legal & Liability') {
          if (answers['ENT_012'] === 'Yes') gaps.push('Personal guarantees on business debts');
          if (answers['ENT_015'] === 'No' || answers['ENT_015'] === 'Not sure') gaps.push('Personal assets not properly separated from business');
        }
        if (catName === 'Employees' || catName === 'Protection & Insurance') {
          if (answers['ENT_014'] === 'No') gaps.push('No key person insurance');
        }
      }
      if (prefix === 'YPR') {
        if (catName === 'Financial Resilience') {
          if (answers['YPR_012'] === 'No' || answers['YPR_012'] === 'With difficulty') gaps.push('Cannot afford critical illness bills without debt');
          if (answers['YPR_013'] === 'No') gaps.push('No emergency fund covering 6 months of expenses');
        }
        if (catName === 'Protection & Insurance') {
          if (answers['YPR_014'] === 'No') gaps.push('No personal health or accident insurance');
        }
      }
      if (prefix === 'RET') {
        if (catName === 'Financial Resilience') {
          if (answers['RET_012'] === 'No') gaps.push('No dedicated pension or retirement savings account');
        }
        if (catName === 'Protection & Insurance' || catName === 'Health & Wellbeing') {
          if (answers['RET_014'] === 'No') gaps.push('No long-term care or critical illness plan');
        }
        if (catName === 'Future Planning') {
          if (answers['RET_015'] === 'No, not yet') gaps.push('No documented asset distribution or beneficiary nominations');
        }
      }
      if (prefix === 'HOM') {
        if (catName === 'Protection & Insurance') {
          if (answers['HOM_012'] === 'No') gaps.push('No homeowner\'s or renter\'s insurance');
        }
      }
      if (prefix === 'MOT') {
        if (catName === 'Protection & Insurance') {
          if (answers['MOT_012'] === 'No') gaps.push('No comprehensive motor insurance');
        }
      }
      // Generic gap from score
      if (gaps.length === 0 && catScore < 40) gaps.push(`Score: ${catScore}% — needs significant improvement`);
      if (gaps.length > 0) areas.push({ name: catName, label, score: catScore, gaps });
    }
    return areas;
  };

  const riskAreas = buildRiskAreas();

  // Build client mindset
  const mindsetLines = [];
  if (assessmentData._scored) mindsetLines.push('✅ Completed the full CoverScore Assessment');
  if (assessmentData.is_qualified) mindsetLines.push('✅ Requested to speak with a Certified Risk Advisor');
  if (assessmentData.consultation_preference) mindsetLines.push(`📅 Preferred contact: ${assessmentData.consultation_preference}`);
  mindsetLines.push('\nThis indicates the client is actively seeking professional guidance rather than simply requesting an insurance quotation.');

  // Build advisory strategy based on weakest pillars
  const buildStrategy = () => {
    if (prefix === 'SCH') {
      return 'Lead the conversation with school resilience, not insurance.\n\nSuggested order:\n1. Student Safety\n2. Business Continuity\n3. Property Protection\n4. Regulatory Compliance\n5. Appropriate Protection Solutions';
    }
    if (prefix === 'SME') {
      return 'Lead the conversation with business resilience, not insurance.\n\nSuggested order:\n1. Business Continuity\n2. Property Protection\n3. Liability & Compliance\n4. Employee Protection\n5. Appropriate Protection Solutions';
    }
    if (prefix === 'HLT') {
      return 'Lead the conversation with health protection, not insurance.\n\nSuggested order:\n1. Healthcare Access & Coverage\n2. Financial Preparedness for Emergencies\n3. Lifestyle & Preventive Health\n4. Household Resilience\n5. Appropriate Health Protection Solutions';
    }
    if (prefix === 'INC') {
      return 'Lead the conversation with income resilience, not insurance.\n\nSuggested order:\n1. Emergency Savings Buffer\n2. Income Protection Options\n3. Debt & Commitment Management\n4. Long-Term Income Strategy\n5. Appropriate Income Protection Solutions';
    }
    if (prefix === 'FAM') {
      return 'Lead the conversation with family security, not insurance.\n\nSuggested order:\n1. Income Replacement & Savings\n2. Life Protection Needs\n3. Children\'s Education Security\n4. Health Cover for the Family\n5. Appropriate Family Protection Solutions';
    }
    if (prefix === 'ENT') {
      return 'Lead the conversation with business continuity, not insurance.\n\nSuggested order:\n1. Key-Person Dependency\n2. Business Survival Planning\n3. Asset & Liability Separation\n4. Personal & Business Protection\n5. Appropriate Entrepreneur Protection Solutions';
    }
    if (prefix === 'YPR') {
      return 'Lead the conversation with financial foundation, not insurance.\n\nSuggested order:\n1. Emergency Fund Readiness\n2. Health & Accident Protection\n3. Career & Income Stability\n4. Future Goal Planning\n5. Appropriate Young Professional Solutions';
    }
    if (prefix === 'RET') {
      return 'Lead the conversation with retirement confidence, not insurance.\n\nSuggested order:\n1. Retirement Savings Status\n2. Healthcare Cost Planning\n3. Long-Term Care Readiness\n4. Legacy & Estate Planning\n5. Appropriate Retirement Solutions';
    }
    if (prefix === 'HOM') {
      return 'Lead the conversation with asset protection, not insurance.\n\nSuggested order:\n1. Property & Asset Exposure\n2. Home/Renter\'s Protection Needs\n3. Contents & Liability Coverage\n4. Appropriate Home Protection Solutions';
    }
    if (prefix === 'MOT') {
      return 'Lead the conversation with mobility protection, not insurance.\n\nSuggested order:\n1. Vehicle Exposure & Usage\n2. Comprehensive Coverage Needs\n3. Liability & Third-Party Risk\n4. Appropriate Motor Protection Solutions';
    }
    const topNames = weakestCats.map(([n]) => n);
    return 'Lead the conversation with risk areas the client cares about most.\n\nSuggested order:\n' + topNames.map((n, i) => `${i + 1}. ${n}`).join('\n') + '\n' + (topNames.length >= 4 ? '' : `${topNames.length + 1}. Appropriate Protection Solutions`);
  };

  // Build suggested opening
  const buildOpening = () => {
    if (prefix === 'SCH') {
      const hasAccidents = answers['SCH_012'] === 'Yes';
      const noProcedures = answers['SCH_020'] === 'No';
      if (hasAccidents && noProcedures) {
        return `"Good day, ${name}. Thank you for completing your CoverScore School Assessment. I've reviewed your report, and one issue stood out immediately\u2014your school has already experienced student accidents, yet there are no documented emergency procedures in place. I'd like to understand how those incidents were managed so we can identify the improvements that will make the biggest difference."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore School Assessment. I've reviewed your report and identified several areas where targeted improvements could significantly strengthen your school's resilience. I'd like to walk you through the key findings."`;
    }
    if (prefix === 'SME') {
      const noFire = answers['SME_016'] === 'No';
      const cantSurvive = answers['SME_017'] === 'No, we would close' || answers['SME_017'] === 'With difficulty';
      if (noFire && cantSurvive) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Business Assessment. Your report shows that your business currently lacks fire insurance and would struggle to survive a prolonged closure. These are exactly the kinds of risks we can address together. I'd like to understand your business better so we can prioritise the most impactful improvements."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Business Assessment. I've reviewed your report and I'd like to walk you through a few key areas where we can make a real difference to your business resilience."`;
    }
    if (prefix === 'HLT') {
      const noIns = answers['HLT_012'] === 'None';
      const wouldBorrow = answers['HLT_013'] === 'Loan' || answers['HLT_013'] === "I don't know";
      if (noIns && wouldBorrow) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Health Assessment. Your report shows that you currently have no health insurance and would need to borrow if a medical emergency arose. That's exactly the kind of situation we can help you prepare for. I'd like to understand your situation better and identify the most impactful improvements."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Health Assessment. I've reviewed your report and identified several practical steps that could significantly strengthen your health protection. I'd like to walk you through the key findings."`;
    }
    if (prefix === 'INC') {
      const noBuffer = answers['INC_012'] === 'Less than 1 month' || answers['INC_012'] === '1-3 months';
      const noPolicy = answers['INC_014'] === 'No';
      if (noBuffer && noPolicy) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Income Assessment. Your report shows that your emergency savings would only last a short time and you don't yet have income protection in place. That means an unexpected interruption to your income could create real financial pressure. I'd like to walk you through the most impactful ways to strengthen your income resilience."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Income Protection Assessment. I've reviewed your report and identified practical steps to strengthen your income resilience. I'd like to walk you through the key findings."`;
    }
    if (prefix === 'FAM') {
      const noLife = answers['FAM_013'] === 'No';
      const noHealth = answers['FAM_015'] === 'No';
      if (noLife && noHealth) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Family Protection Assessment. Your report shows that your family currently lacks both life insurance and health coverage. That means the people who depend on you could be vulnerable if something unexpected happens. I'd like to understand your situation better and help you build a plan that gives your family real peace of mind."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Family Protection Assessment. I've reviewed your report and identified several ways to strengthen the protection around your family. I'd like to walk you through the key findings."`;
    }
    if (prefix === 'ENT') {
      const keyDependency = answers['ENT_011'] === 'Yes completely';
      const wouldNotSurvive = answers['ENT_013'] === 'No';
      if (keyDependency && wouldNotSurvive) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Entrepreneur Assessment. Your report highlights a critical risk\u2014your business completely depends on your personal involvement and would not survive a prolonged absence. This is a common challenge for entrepreneurs, and one we can address together. I'd like to understand your business better so we can prioritise the most impactful improvements."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Entrepreneur Assessment. I've reviewed your report and identified key areas where we can strengthen both your business and personal protection. I'd like to walk you through the findings."`;
    }
    if (prefix === 'YPR') {
      const noFund = answers['YPR_013'] === 'No';
      const noIns = answers['YPR_014'] === 'No';
      if (noFund && noIns) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Young Professional Assessment. Your report shows that you're building your financial foundation, but there are two important gaps\u2014no emergency fund and no personal insurance. Addressing these early is one of the smartest financial decisions you can make. I'd like to walk you through the most practical next steps."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Young Professional Assessment. You're at exactly the right stage to build strong financial foundations. I've reviewed your report and I'd like to walk you through a few key areas."`;
    }
    if (prefix === 'RET') {
      const noPension = answers['RET_012'] === 'No';
      const noCarePlan = answers['RET_014'] === 'No';
      if (noPension && noCarePlan) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Retirement Assessment. Your report shows that you don't yet have a dedicated retirement savings plan or a long-term care strategy. Time is one of the most powerful assets in retirement planning\u2014and the sooner we address these gaps, the more options you'll have. I'd like to walk you through the key findings."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Retirement Assessment. I've reviewed your report and identified practical ways to strengthen your retirement confidence. I'd like to walk you through the key findings."`;
    }
    if (prefix === 'HOM') {
      const noIns = answers['HOM_012'] === 'No';
      if (noIns) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Home Protection Assessment. Your report shows that your home and personal belongings are not currently insured. A fire, theft, or liability incident could result in significant financial loss. I'd like to understand your situation better so we can find the right level of protection for your home."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Home Protection Assessment. I've reviewed your report and identified practical ways to strengthen your home protection. I'd like to walk you through the key findings."`;
    }
    if (prefix === 'MOT') {
      const noIns = answers['MOT_012'] === 'No';
      if (noIns) {
        return `"Good day, ${name}. Thank you for completing your CoverScore Motor Assessment. Your report shows that your primary vehicle is not covered by comprehensive motor insurance. An accident or theft could leave you with significant out-of-pocket costs. I'd like to understand your driving patterns and find the right level of protection."`;
      }
      return `"Good day, ${name}. Thank you for completing your CoverScore Motor Assessment. I've reviewed your report and identified practical ways to strengthen your motor protection. I'd like to walk you through the key findings."`;
    }
    return `"Good day, ${name}. Thank you for completing your CoverScore Assessment. I've reviewed your report and identified several priority areas where targeted improvements could make a significant difference. I'd like to walk you through the key findings."`;
  };

  // Build product list
  const buildProducts = () => {
    if (prefix === 'SCH') {
      return '• Fire & Special Perils Insurance\n• Public Liability Insurance\n• School Comprehensive Protection\n• School Bus / Motor Insurance\n• Business Interruption Cover\n• Group Personal Accident (Students & Staff)';
    }
    if (prefix === 'SME') {
      return '• Fire & Special Perils Insurance\n• Public Liability Insurance\n• Business Interruption Cover\n• Burglary Insurance\n• Group Life & Workmen Compensation\n• Goods in Transit Insurance';
    }
    if (prefix === 'HLT') {
      return '• Private Health Insurance / HMO\n• Critical Illness Insurance\n• Personal Accident Insurance\n• Hospital Cash Plan\n• Medical Emergency Fund';
    }
    if (prefix === 'INC') {
      return '• Income Protection / Disability Insurance\n• Emergency Savings Plan\n• Accident & Sickness Cover\n• Critical Illness Insurance\n• Debt Protection Cover';
    }
    if (prefix === 'FAM') {
      return '• Life Insurance (Term / Whole Life)\n• Family Health Insurance / HMO\n• Education Savings / Trust Plan\n• Personal Accident Cover\n• Income Protection';
    }
    if (prefix === 'ENT') {
      return '• Key Person Insurance\n• Business Continuity Plan\n• Personal Health / Accident Cover\n• Asset & Liability Separation Structure\n• Life Insurance';
    }
    if (prefix === 'YPR') {
      return '• Personal Health / Accident Insurance\n• Emergency Fund Strategy\n• Critical Illness Cover\n• Life Insurance (starter)\n• Income Protection';
    }
    if (prefix === 'RET') {
      return '• Pension / Retirement Savings (RSA)\n• Long-Term Care Insurance\n• Critical Illness Cover\n• Annuity / Retirement Income Plan\n• Estate & Legacy Planning';
    }
    if (prefix === 'HOM') {
      return '• Homeowner\'s / Renter\'s Insurance\n• Contents Insurance\n• Fire & Perils Cover\n• Public Liability Cover\n• Burglary Insurance';
    }
    if (prefix === 'MOT') {
      return '• Comprehensive Motor Insurance\n• Third-Party Liability Cover\n• Accident & Breakdown Cover\n• Personal Accident Cover for Driver';
    }
    if (products.length > 0) {
      return products.slice(0, 6).map(p => `• ${p.product || p}`).join('\n');
    }
    return '• Review assessment for tailored product recommendations';
  };

  // Build next action
  const nextAction = qualifierOutput?.next_best_action || 'Contact client within 24 hours';
  const priority = qualifierOutput?.lead_status?.toLowerCase().includes('hot') ? '\uD83D\uDD34 High' : '\uD83D\uDFE1 Medium';
  const url = `${appBase || 'https://coverscore.site'}/admin/dashboard`;

  // Role label
  const roleLabel = isPersonal ? '' : (prefix === 'SCH' ? 'Proprietor' : (assessmentData.contact_person || lead.contact_person || 'Contact'));

  // Assemble the message
  const parts = [];
  parts.push(`\uD83D\uDD25 *NEW COVERSCORE ADVISOR BRIEF* \uD83D\uDD25`);
  parts.push('');
  parts.push(`\uD83D\uDC64 *Client Profile*`);
  parts.push(`Contact: ${name}`);
  if (businessName) parts.push(`${entityLabel}: ${businessName}`);
  if (!isPersonal) parts.push(`Role: ${roleLabel}`);
  parts.push(`Location: ${answers.city || lead.city || 'Not specified'}`);
  parts.push(`Phone: ${phoneNumber}`);
  parts.push('');
  parts.push(`\uD83D\uDCCA *CoverScore Summary*`);
  parts.push(`Overall CoverScore\u2122: ${score}/100`);
  parts.push(`Risk Level: ${riskEmoji} ${riskLevel.toUpperCase()}`);
  parts.push('');
  parts.push(`\uD83D\uDEA8 *Priority Risk Areas*`);

  for (const area of riskAreas) {
    parts.push(`${area.label === 'Critical' ? '\uD83D\uDD25' : '\u26A0'} ${area.name} (${area.label})`);
    for (const g of area.gaps) {
      parts.push(`  ${g}`);
    }
    parts.push('');
  }

  parts.push(`\uD83D\uDCAC *Client Mindset*`);
  parts.push(...mindsetLines);
  parts.push('');
  parts.push(`\uD83C\uDFAF *Recommended Advisory Strategy*`);
  parts.push(buildStrategy());
  parts.push('');
  parts.push(`\uD83D\uDDE3 *Suggested Opening*`);
  parts.push(buildOpening());
  parts.push('');
  parts.push(`\uD83D\uDCE6 *Priority Protection Solutions*`);
  parts.push(buildProducts());
  parts.push('');
  parts.push(`\uD83D\uDCDE *Immediate Next Action*`);
  parts.push(`Priority: ${priority}`);
  parts.push(`Contact within 24 hours`);
  parts.push(`Arrange a 30\u201345 minute ${entityLabel} Risk Review`);
  parts.push(`Walk the client through the CoverScore Report\u2122`);
  parts.push(`Prioritise quick-win improvements before discussing insurance placement`);
  parts.push('');

  // Advisor Conversation Priority section
  const primaryConcern = answers['SCH_028'] || answers['primary_concern'] || 'Not explicitly stated';
  const pastIncidents = !!answers['SCH_012'] || !!answers['MFG_012'] || !!answers['HOS_012'] || !!answers['CON_012'] || !!answers['TRN_012'];
  const hasUrgency = assessmentData._urgencySent || pastIncidents;
  const weakestCat = Object.entries(cats).sort(([, a], [, b]) => a - b)[0];
  const weakestName = weakestCat ? weakestCat[0] : 'General';
  const weakestScore = weakestCat ? Math.round(weakestCat[1]) : 0;
  parts.push(`\uD83C\uDFAF *Advisor Conversation Priority*`);
  parts.push(`Client\u2019s stated concern: ${primaryConcern}`);
  parts.push(`Deepest pillar gap: ${weakestName} (${weakestScore}%)`);
  parts.push(`Emotional trigger: ${hasUrgency ? 'Past incidents reported \u2014 client may be more receptive to action' : 'No past incidents \u2014 focus on prevention and peace of mind'}`);
  parts.push(`Urgency level: ${score < 45 ? '\uD83D\uDD34 High \u2014 significant gaps need addressing' : score < 65 ? '\uD83D\uDFE0 Moderate \u2014 targeted improvements recommended' : '\uD83D\uDFE2 Low \u2014 client in good position, focus on optimisation'}`);
  parts.push(`Suggested opening angle: ${primaryConcern !== 'Not explicitly stated' ? `"You mentioned ${primaryConcern.toLowerCase()} as a concern. Let\u2019s start there."` : `"Your CoverScore shows your biggest opportunity is in ${weakestName.toLowerCase()}. Shall we explore that first?"`}`);
  parts.push('');
  parts.push(`\uD83D\uDD17 Open Client Record: ${url}`);

  return parts.filter(l => l !== '' || true).join('\n');
};

router.post('/evolution', async (req, res) => {
  res.status(200).send('OK');

  try {
    const payload = req.body;
    if (!(payload && payload.event === 'messages.upsert')) return;

    const messageData = payload.data;
    if (messageData.key && messageData.key.fromMe) return;

    let incomingTextRaw = '';
    if (messageData.message) {
      incomingTextRaw =
        messageData.message.conversation ||
        (messageData.message.extendedTextMessage && messageData.message.extendedTextMessage.text) ||
        (messageData.message.buttonsResponseMessage && messageData.message.buttonsResponseMessage.selectedDisplayText) ||
        (messageData.message.interactiveResponseMessage && messageData.message.interactiveResponseMessage.buttonReply && messageData.message.interactiveResponseMessage.buttonReply.title) ||
        (messageData.message.interactiveResponseMessage && messageData.message.interactiveResponseMessage.listReply && messageData.message.interactiveResponseMessage.listReply.title) ||
        (messageData.message.listResponseMessage && messageData.message.listResponseMessage.singleSelectReply && messageData.message.listResponseMessage.singleSelectReply.selectedRowId) ||
        '';
    }

    const incomingText = incomingTextRaw.trim().toUpperCase();
    if (!incomingText) return;

    const remoteJid = messageData.key.remoteJid;
    if (!remoteJid) return;
    const phoneNumber = remoteJid.split('@')[0];

    console.log(`📩 Received WhatsApp reply from ${phoneNumber}: "${incomingText}"`);

    let searchPhone = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
    let lead = await get('SELECT * FROM leads WHERE phone LIKE ? ORDER BY id DESC LIMIT 1', ['%' + searchPhone]);

    const words = incomingText.split(/\s+/);
    const isStartTrigger = words.some(w => w === 'START' || w === 'ASSESSMENT' || w === 'HELLO' || w === 'HI' || w === 'BEGIN');
    const isRestartTrigger = (incomingText.includes('START ') && incomingText.includes(' ASSESSMENT')) || incomingText.includes('RESTART') || incomingText.includes('START OVER');

    let detectedIndustry = null;
    if (incomingText.includes('START ') && incomingText.includes(' ASSESSMENT')) {
      const match = incomingText.match(/START\s+(.+)\s+ASSESSMENT/);
      if (match && match[1]) detectedIndustry = match[1].trim().toLowerCase();
    }

    console.log(`   Lead found: ${!!lead}, isStartTrigger: ${isStartTrigger}, isRestartTrigger: ${isRestartTrigger}, detectedIndustry: ${detectedIndustry}`);

    const resolvedIndustry = detectedIndustry || (lead ? lead.industry : null);
    const prefix = resolvePrefix(resolvedIndustry);

    // Persist the detected industry so prefix stays consistent across all webhook calls
    if (lead && detectedIndustry && detectedIndustry !== lead.industry) {
      await run('UPDATE leads SET industry = ? WHERE id = ?', [detectedIndustry, lead.id]);
      lead.industry = detectedIndustry;
    }

    let currentState, chatHistory, assessmentData, ccieContext;

    if (lead && (isRestartTrigger || incomingText === 'RESTART')) {
      currentState = `${prefix}_001`;
      chatHistory = [];
      assessmentData = {};
      ccieContext = ccieEngine.buildContext({
        questionPack: prefix, channel: 'whatsapp',
        customer: { phone: phoneNumber, name: lead.name, email: lead.email },
        currentPhase: 'WELCOME', currentQuestion: `${prefix}_001`, questionCount: 0
      });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, assessment_data = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(assessmentData), JSON.stringify(ccieContext), lead.id]);
      console.log(`   Lead ${lead.id} restarting -> ${currentState}`);

      const ccieStart = await ccieEngine.startConversation(prefix, phoneNumber, detectedIndustry);
      const welcomeMsg = ccieStart.messages[0]?.text || `👋 Welcome to CoverScore AI.\n\nLet's begin.`;
      await sendWhatsApp(phoneNumber, null, { _message: welcomeMsg });
      chatHistory.push({ role: 'assistant', content: welcomeMsg, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(ccieStart.context), lead.id]);
      return;
    }

    if (!lead && !isStartTrigger) {
      console.log(`   Lead not found and no start trigger.`);
      return;
    }

    if (!lead && isStartTrigger) {
      currentState = `${prefix}_001`;
      chatHistory = [];
      assessmentData = {};
      console.log(`   Creating NEW lead for phone ${phoneNumber}`);
      const ccieStart = await ccieEngine.startConversation(prefix, phoneNumber, detectedIndustry);
      ccieContext = ccieStart.context;
      const insertResult = await run(`
        INSERT INTO leads (name, email, phone, status, wa_state, chat_history, entity_type, contact_person, industry, ccie_context, assessment_type)
        VALUES (?, ?, ?, 'New Lead', ?, '{}', 'unknown', ?, ?, ?, ?)
      `, ['WhatsApp User', 'whatsapp@coverscore.site', phoneNumber, currentState, 'WhatsApp User', resolvedIndustry, JSON.stringify(ccieContext), assessmentTypeMap[prefix] || 'sme']);
      lead = await get('SELECT * FROM leads WHERE id = ?', [insertResult.lastInsertRowid]);
      console.log(`   Created new lead ID: ${lead.id}`);

      const welcomeMsg = ccieStart.messages[0]?.text || `👋 Welcome to CoverScore AI.\n\nLet's begin.`;
      await sendWhatsApp(phoneNumber, null, { _message: welcomeMsg });
      chatHistory.push({ role: 'assistant', content: welcomeMsg, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(ccieContext), lead.id]);
      return;
    }

    currentState = lead.wa_state || 'initial';
    try { chatHistory = JSON.parse(lead.chat_history || '[]'); } catch (e) { chatHistory = []; }
    try { assessmentData = JSON.parse(lead.assessment_data || '{}'); } catch (e) { assessmentData = {}; }
    ccieContext = (() => {
      try { return JSON.parse(lead.ccie_context || 'null'); } catch(e) { return null; }
    })() || ccieEngine.buildContext({
      questionPack: prefix, channel: 'whatsapp',
      customer: { phone: phoneNumber, name: lead.name, email: lead.email },
      currentPhase: ccieEngine.determinePhase(currentState),
      currentQuestion: currentState, questionCount: 0
    });

    if (isStartTrigger && (currentState === 'initial' || currentState === null || assessmentData._scored || currentState === 'qualification')) {
      currentState = `${prefix}_001`;
      assessmentData = {};
      await run('UPDATE leads SET wa_state = ?, assessment_data = ? WHERE id = ?', [currentState, '{}', lead.id]);
    }

    if (isStartTrigger && currentState === `${prefix}_001`) {
      const ccieStart = await ccieEngine.startConversation(prefix, phoneNumber, detectedIndustry);
      const welcomeMsg = ccieStart.messages[0]?.text || `👋 Welcome to CoverScore AI.\n\nLet's begin.`;
      await sendWhatsApp(phoneNumber, null, { _message: welcomeMsg });
      chatHistory.push({ role: 'user', content: incomingTextRaw.trim(), timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      chatHistory.push({ role: 'assistant', content: welcomeMsg, timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
      await run('UPDATE leads SET wa_state = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [currentState, JSON.stringify(chatHistory), JSON.stringify(ccieStart.context), lead.id]);
      return;
    }

    if (!currentState) currentState = `${prefix}_001`;

    ccieContext.currentQuestion = currentState;
    ccieContext.currentPhase = ccieEngine.determinePhase(currentState);
    ccieContext.answers = assessmentData;

    // Deep snapshot of the answers BEFORE processReply (it mutates the shared
    // answers object via shallow copies internally) so we can detect truly new keys.
    const answersBeforeMerge = JSON.parse(JSON.stringify(assessmentData.answers || {}));

    const { messages, nextState, updatedData, isComplete, context: updatedCcieContext } = await ccieEngine.processReply(
      ccieContext, incomingTextRaw.trim()
    );

    console.log(`   CCIE transition: ${currentState} -> ${nextState}, complete: ${isComplete}, messages: ${messages.length}`);

    let newAssessmentData = updatedData ? { ...assessmentData, ...updatedData } : { ...assessmentData };
    if (updatedData && updatedData.answers) {
      newAssessmentData.answers = { ...answersBeforeMerge, ...updatedData.answers };
    }

    assessmentData = newAssessmentData;

    const isFinished = isComplete || nextState === 'finished' || nextState === 'COMPLETE';
    const nextQ = questionBank.find(q => q.id === nextState);
    const reachedResults = ccieEngine.determinePhase(nextState) === 'RESULTS'
      || (nextQ && nextQ.data_mapping === 'request_consultation');
    const nextQScoring = questionBank.find(q => q.id === nextState);
    const isScoreQuestion = nextQScoring && nextQScoring.question && nextQScoring.question.includes('{{score}}');
    const needsScoring = (isFinished || reachedResults || isScoreQuestion || nextState === 'awaiting_consultation' || nextState === 'COMPLETE') && !assessmentData._scored;

    // Template fill helper (uses assessmentData which scoring populates)
    const riskLabelMap = {
      'Excellent': 'Excellent', 'Strong': 'Strong', 'Developing': 'Developing',
      'Needs Attention': 'Needs Attention',
      'Priority Improvement': 'Priority Improvement',
      'Critical': 'Critical',
      'Very Low Risk': 'Very Low', 'Low Risk': 'Low', 'Moderate Risk': 'Moderate',
      'High Risk': 'High', 'Critical Risk': 'Critical'
    };
    let userRiskLabel = 'Needs Attention';
    const dbRiskLevelMap = {
      'Excellent': 'low', 'Good': 'low',
      'Strong': 'low',
      'Developing': 'moderate',
      'Needs Attention': 'moderate',
      'Priority Improvement': 'high',
      'Critical': 'critical',
      'Very Low Risk': 'low', 'Low Risk': 'low', 'Moderate Risk': 'moderate',
      'High Risk': 'high', 'Critical Risk': 'critical',
      'Moderate': 'moderate', 'Vulnerable': 'high',
      'Critical': 'critical'
    };
    const fillTemplate = (text) => {
      return text
        .replace(/\{\{name\}\}/g, assessmentData.name || 'Customer')
        .replace(/\{\{score\}\}/g, assessmentData.score || '0')
        .replace(/\{\{riskLevel\}\}/g, userRiskLabel.toUpperCase())
        .replace(/\{\{protectionLevel\}\}/g, userRiskLabel.toUpperCase())
        .replace(/\{\{strengths\}\}/g, assessmentData.strengths || '')
        .replace(/\{\{top_risks\}\}/g, assessmentData.top_risks || '')
        .replace(/\{\{risks\}\}/g, assessmentData.top_risks || '')
        .replace(/\{\{recommendations\}\}/g, assessmentData.recommendations || '')
        .replace(/\{\{reportUrl\}\}/g, assessmentData.reportUrl || 'https://coverscore.site');
    };

    // Phase 1: Send auto_advance messages immediately (before scoring takes time)
    let allMessages = [...messages];
    const preMessages = needsScoring ? allMessages.filter(m => m.type === 'auto_advance') : [];
    // When scoring, Phase 3 replaces the results template entirely; discard old reply text
    const postMessages = needsScoring
      ? allMessages.filter(m => m.type !== 'auto_advance' && m.type !== 'reply')
      : allMessages;

    // Subtle urgency: acknowledge past incidents to prime psychological readiness (ONCE per assessment)
    if (updatedData && updatedData.answers && !assessmentData._scored && !needsScoring && !assessmentData._urgencySent && messages.length <= 1) {
      // Get the answer keys that are NEW in this interaction (not in the previously saved assessmentData)
      const prevAnswers = answersBeforeMerge;
      const newKeys = Object.keys(updatedData.answers).filter(k => prevAnswers[k] === undefined);
      const incidentQIds = ['SCH_012', 'MFG_012', 'HOS_012', 'CON_012', 'TRN_012'];
      const latestAnswerKey = newKeys.find(k => incidentQIds.includes(k));
      if (latestAnswerKey) {
        const answerVal = updatedData.answers[latestAnswerKey];
        const urgencyTriggers = {
          'SCH_012': { values: ['Yes'], phrase: 'schools that have experienced previous student incidents' },
          'MFG_012': { values: ['Yes'], phrase: 'facilities that have had past workplace accidents' },
          'HOS_012': { values: ['Yes'], phrase: 'healthcare facilities that have had past patient incidents' },
          'CON_012': { values: ['Yes'], phrase: 'construction sites with a history of accidents' },
          'TRN_012': { values: ['Yes'], phrase: 'transport operations that have had past fleet incidents' }
        };
        const trigger = urgencyTriggers[latestAnswerKey];
        if (trigger && trigger.values.includes(answerVal)) {
          const domainPhrase = trigger.phrase;
          const urgencyReply = `Thank you. That helps me understand your risk profile.\n\n${domainPhrase.charAt(0).toUpperCase() + domainPhrase.slice(1)} usually benefit from a closer review of their current protections and arrangements.\n\nLet me continue with a few more questions to complete your assessment.`;
          assessmentData._urgencySent = true;
          const nextQ = questionBank.find(q => q.id === nextState);
          if (nextQ) {
            const qNum = parseInt((nextQ.id || '').match(/_(\d+)$/)?.[1] || '0', 10);
            if (qNum > 0 && qNum < 25) {
              await sendWhatsApp(phoneNumber, null, { _message: urgencyReply });
              chatHistory.push({
                role: 'assistant', content: urgencyReply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            }
          }
        }
      }
    }

    for (const msg of preMessages) {
      if (!msg.text) continue;
      msg.text = fillTemplate(msg.text);
      const sendResult = await sendWhatsApp(phoneNumber, null, { _message: msg.text });
      if (!sendResult.success) {
        console.error(`   ❌ Failed to send auto_advance message: ${sendResult.error}. Aborting.`);
        return;
      }
      chatHistory.push({
        role: 'assistant', content: msg.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // Phase 2: Run scoring (takes time — AI calls)
    if (needsScoring) {
      delete assessmentData.reportUrl;
      console.log(`   [CCIE SCORING] Calculating CoverScore for ${phoneNumber}`);
      const finalAnswers = { ...(assessmentData.answers || {}), template_selection: { template_id: prefix } };
      try {
        const scoreResult = await calculateScore(finalAnswers);
        assessmentData.score = scoreResult.score;
        assessmentData.riskLevel = scoreResult.risk_level;
        userRiskLabel = riskLabelMap[assessmentData.riskLevel] || assessmentData.riskLevel || 'Moderate';
        assessmentData.identified_gaps = scoreResult.identified_gaps || [];
        assessmentData.min_loss = scoreResult.min_loss;
        assessmentData.max_loss = scoreResult.max_loss;

        const fb = {
          HLT: { strengths: '', risks: "⚠ Your health protection gaps need attention.", recommendations: "• Review your health coverage.\n• Build an emergency medical fund.\n• Schedule preventive health screenings." },
          ENT: { strengths: "✓ Strong business vision\n✓ Market awareness", risks: "⚠ High key-person dependency\n⚠ Inadequate liability protection", recommendations: "• Review Key Person Insurance.\n• Separate personal and business assets." },
          FAM: { strengths: "✓ Clear long-term goals\n✓ Strong familial support", risks: "⚠ Inadequate life cover\n⚠ Education funding gap", recommendations: "• Review Life Insurance policy.\n• Set up an education trust." },
          SCH: { strengths: "✓ Operational awareness\n✓ Commitment to student safety", risks: "⚠ Student safety gaps\n⚠ No liability cover\n⚠ No property protection", recommendations: "• Strengthen student safety procedures.\n• Secure public liability insurance.\n• Get fire insurance for school buildings." },
           INC: { strengths: "✓ Income stability\n✓ Employment security", risks: "⚠ Limited emergency savings\n⚠ No income protection cover", recommendations: "• Build an emergency fund.\n• Consider income protection insurance." },
          RET: { strengths: "✓ Retirement planning awareness\n✓ Long-term thinking", risks: "⚠ Inadequate retirement savings\n⚠ No long-term care plan\n⚠ No legacy documentation", recommendations: "• Start or review a dedicated retirement savings plan.\n• Consider long-term care insurance.\n• Document your asset distribution and beneficiary nominations." },
          YPR: { strengths: "✓ Early career financial awareness", risks: "⚠ Limited emergency savings\n⚠ No personal insurance", recommendations: "• Build an emergency fund.\n• Consider health and accident insurance." },
          HOM: { strengths: "✓ Property ownership", risks: "⚠ No home contents insurance", recommendations: "• Consider homeowner's or renter's insurance." },
          MOT: { strengths: "✓ Vehicle ownership", risks: "⚠ No comprehensive motor insurance", recommendations: "• Consider comprehensive motor insurance." },
          DEFAULT: { strengths: "✓ Career Stability\n✓ Digital Safety\n✓ Personal Responsibility", risks: "⚠ Limited emergency savings\n⚠ Inadequate income protection\n⚠ No long-term financial protection strategy", recommendations: "• Build an emergency fund\n• Review income protection\n• Begin a structured long-term financial plan" }
        };
        const fallbacks = fb[prefix] || fb.DEFAULT;

        let strengthsText = fallbacks.strengths;
        let risksText = fallbacks.risks;
        if (scoreResult.risk_categories && Object.keys(scoreResult.risk_categories).length > 0) {
          const makeBar = (s) => {
            const filled = Math.round(Math.min(s, 100) / 10);
            return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
          };
          const pillarNames = Object.keys(scoreResult.risk_categories);
          const maxLen = Math.max(...pillarNames.map(n => n.length), 20);
          const lines = Object.entries(scoreResult.risk_categories)
            .sort(([, a], [, b]) => b - a)
            .map(([name, score]) => {
              const paddedName = name.padEnd(maxLen);
              return `${paddedName} ${makeBar(score)} ${score}%`;
            });
          strengthsText = lines.join('\n');

          const weak = Object.entries(scoreResult.risk_categories)
            .filter(([, v]) => v < 50)
            .sort(([, a], [, b]) => a - b);
          risksText = weak.length > 0
            ? weak.map(([name]) => '\u26A0 ' + name + ' needs attention').join('\n')
            : "Your overall profile is reasonably balanced. Targeted recommendations below.";
        }
        assessmentData.strengths = strengthsText;
        assessmentData.top_risks = risksText;
        assessmentData.risk_categories = scoreResult.risk_categories;
        assessmentData.pillar_scores = scoreResult.pillar_scores;
        assessmentData.recommendations = scoreResult.recommendations && scoreResult.recommendations.length > 0
          ? scoreResult.recommendations.slice(0, 3).map(r => '• ' + r).join('\n') : fallbacks.recommendations;
        assessmentData._rawRecommendations = scoreResult.recommendations || [];

        const personalPrefixes = ['FAM', 'HLT', 'INC', 'YPR', 'ENT', 'RET', 'HOM', 'MOT'];
        const entityType = personalPrefixes.includes(prefix) ? 'individual' : 'business';
        const assessmentDataObj = {
          answers: finalAnswers, score: scoreResult.score, riskLevel: scoreResult.risk_level,
          min_loss: scoreResult.min_loss, max_loss: scoreResult.max_loss,
          recommendations: scoreResult.recommendations, identified_gaps: scoreResult.identified_gaps,
          risk_categories: scoreResult.risk_categories, entityType
        };

        const dbRiskLevel = dbRiskLevelMap[scoreResult.risk_level] || 'low';

        publishEvent(CCIE_EVENTS.SCORE_CALCULATED, ccieContext, {
          score: scoreResult.score, riskLevel: scoreResult.risk_level, entityType
        });

        // Insert assessment record immediately (without AI report) so reportUrl is available in Phase 3
        const assessRes = await run(`
          INSERT INTO assessments (user_id, answers, score, risk_level)
          VALUES (NULL, ?, ?, ?)
        `, [JSON.stringify(finalAnswers), scoreResult.score, dbRiskLevel]);
        const assessmentId = assessRes.lastInsertRowid;
        assessmentData.assessmentId = assessmentId;
        assessmentData.reportUrl = `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${assessmentId}`;
        publishEvent(CCIE_EVENTS.REPORT_GENERATED, ccieContext, { assessmentId, reportUrl: assessmentData.reportUrl });
        assessmentData._scored = true;

        // Fire AI report generation + remaining persistence in background (don't block user response)
        setImmediate(async () => {
          try {
            let aiReportFinal;
            try {
              const creIntel = generateRecommendations(assessmentDataObj);
              aiReportFinal = await generateRiskReport(assessmentDataObj, creIntel);
              await run(`UPDATE assessments SET ai_report = ? WHERE id = ?`, [JSON.stringify(aiReportFinal), assessmentId]);
            } catch (err) {
              console.error('Background AI error:', err);
            }

            if (assessmentData.email) {
              emailService.sendAssessmentReport(assessmentData.email, {
                score: scoreResult.score, riskLevel: dbRiskLevel, aiReport: aiReportFinal || null,
                businessName: assessmentData.business_name || assessmentData.name, assessmentId
              }).then(() => {
                publishEvent(CCIE_EVENTS.REPORT_DELIVERED, ccieContext, { email: assessmentData.email, assessmentId });
                console.log(`✅ Assessment report emailed to ${assessmentData.email}`);
              }).catch(err => console.error(`❌ Failed to email report:`, err));
            }

            let estimatedPremium = 0;
            if (scoreResult.min_loss) {
              const PREMIUM_RATES = {
                'All Risks Insurance': 0.01, 'Aviation Insurance': 0.01, 'Bond Insurance': 0.01,
                'Burglary Insurance': 0.01, 'Business Interruption Insurance': 0.015,
                'Comprehensive Motor Insurance': 0.05, 'Cyber Liability Insurance': 0.02,
                'Directors & Officers Liability': 0.015, 'Engineering Insurance': 0.01,
                'Fidelity Guarantee Insurance': 0.01, 'Fire & Special Perils Insurance': 0.0025,
                'Goods in Transit Insurance': 0.01, 'Group Life & Workmen Compensation': 0.01,
                'Health Insurance / HMO': 0.05, 'Home/Property Insurance': 0.0025,
                'Life Insurance': 0.02, 'Marine Insurance': 0.01, 'Plant & All Risk Insurance': 0.01,
                'Professional Indemnity Insurance': 0.015, 'Public Liability Insurance': 0.005,
                'Travel Insurance': 0.01
              };
              let annualPremium = 0, monthlyPremium = 0;
              const recs = scoreResult.recommendations || [];
              if (recs.length > 0) {
                recs.forEach(rec => {
                  const rate = PREMIUM_RATES[rec] || 0.01;
                  if (rec.toLowerCase().includes('life')) monthlyPremium += (scoreResult.min_loss * rate) / 12;
                  else annualPremium += (scoreResult.min_loss * rate);
                });
                estimatedPremium = Math.round(annualPremium + monthlyPremium);
              } else { estimatedPremium = Math.round(scoreResult.min_loss * 0.013); }
            }

            const phoneToSet = phoneNumber;
            const ls = computeLeadScore({
              email: assessmentData.email || 'whatsapp@coverscore.site',
              phone: phoneToSet,
              engagement_points: (lead.engagement_points || 0) + 20,
              score: scoreResult.score,
              entity_type: entityType,
              is_qualified: lead.is_qualified || false
            });
            await run(`
              UPDATE leads SET assessment_id = ?, score = ?, risk_level = ?, entity_type = ?,
                name = ?, email = ?, phone = ?,
                status = 'Report Sent', pipeline_stage = 2,
                engagement_points = engagement_points + 20, sales_score = sales_score + 20,
                estimated_premium = ?,
                birth_date = ?, anniversary_date = ?, contact_person = ?,
                assessment_type = COALESCE(assessment_type, ?),
                lead_score = ?, lead_priority = ?
              WHERE id = ?
            `, [
              assessmentId, scoreResult.score, dbRiskLevel, entityType,
              (entityType === 'business' && assessmentData.business_name) ? assessmentData.business_name : (assessmentData.name || 'WhatsApp User'),
              assessmentData.email || 'whatsapp@coverscore.site',
              phoneToSet,
              estimatedPremium,
              assessmentData.birth_date || null, assessmentData.anniversary_date || null,
              assessmentData.name || 'WhatsApp User',
              assessmentTypeMap[prefix] || 'sme',
              ls.score, ls.priority, lead.id
            ]);
            console.log(`   📊 Assessment completed. Lead ${lead.id} → qualification state`);

            // Check for expiring policies after assessment completion
            try {
              const { all: dbAll, get: dbGet, run: dbRun } = require('../config/database');
              const renewalActions = await renewalEngine.checkExpiringPolicies({ all: dbAll, get: dbGet, run: dbRun });
              if (renewalActions.length > 0) {
                console.log(`   [Renewal] ${renewalActions.length} renewal actions triggered for lead ${lead.id}`);
              }
            } catch (renewalErr) {
              console.error(`   [Renewal] Background check error: ${renewalErr.message}`);
            }
          } catch (e) {
            console.error('Background setImmediate error:', e);
          }
        });

      } catch (e) {
        console.error('Scoring error:', e);
        console.error('Scoring error stack:', e.stack);
        assessmentData.score = assessmentData.score || 50;
        assessmentData.riskLevel = assessmentData.riskLevel || 'Moderate';
        assessmentData.risk_categories = assessmentData.risk_categories || {};
        assessmentData.strengths = assessmentData.strengths || '';
        assessmentData.top_risks = assessmentData.top_risks || '';
        assessmentData._rawRecommendations = [];
        assessmentData._scored = true; // Ensure Phase 3 still runs with fallback data
        if (!assessmentData.reportUrl) {
          const fallbackId = assessmentData.assessmentId || (lead ? lead.assessment_id : null);
          assessmentData.reportUrl = fallbackId
            ? `${process.env.APP_URL || 'https://coverscore.site'}/assessment/result/${fallbackId}`
            : `${process.env.APP_URL || 'https://coverscore.site'}`;
        }
      }
    }

    // Phase 3: Build ending sequence — Score → Summary → Insight → Recommendation → Report → Advisor
    if (needsScoring && assessmentData._scored) {
      console.log(`   [Phase 3] Building ending sequence...`);
      const dom = domainConfig[prefix] || defaultDomain;
      const name = assessmentData.name || 'Customer';
      const email = assessmentData.email || (lead ? lead.email : null);
      const appBase = process.env.APP_URL || 'https://coverscore.site';
      const fallbackId = assessmentData.assessmentId || (lead ? lead.assessment_id : null);
      const reportUrl = assessmentData.reportUrl || (fallbackId ? `${appBase}/assessment/result/${fallbackId}` : appBase);
      const riskCats = assessmentData.risk_categories || {};
      const answers = assessmentData.answers || {};

      // Filter out null pillars (pillars with no evidence)
      const scoredCats = Object.fromEntries(Object.entries(riskCats).filter(([, v]) => v !== null && v !== undefined));
      const scoredEntries = Object.entries(scoredCats);

      // Derive CSNS display label directly from score using fixed bands
      const fixedBand = (score) => {
        if (score >= 80) return 'Strong';
        if (score >= 60) return 'Stable';
        if (score >= 40) return 'Needs Attention';
        if (score >= 20) return 'High Risk';
        return 'Critical';
      };
      const displayLabel = fixedBand(assessmentData.score);

      // Derive sorted pillar list once
      const sortedDesc = scoredEntries.sort(([, a], [, b]) => b - a);
      const weakestPillar = sortedDesc.length > 0 ? sortedDesc[sortedDesc.length - 1][0] : null;

      // ===== Message 1: Concise CoverScore + Risk Level + Biggest Vulnerability =====
      const riskEmojis = { 'Critical': '\uD83D\uDD34', 'High Risk': '\uD83D\uDD34', 'Needs Attention': '\uD83D\uDFE0', 'Stable': '\uD83D\uDFE1', 'Strong': '\uD83D\uDFE2' };
      const riskEmoji = riskEmojis[displayLabel] || '\uD83D\uDD34';
      const msg1Parts = [
        `\uD83C\uDFAF Your CoverScore\u2122 is ${assessmentData.score} / 100`,
        `Risk Level\n${riskEmoji} ${displayLabel}`
      ];
      if (weakestPillar) {
        const weakKey = weakestPillar.toLowerCase();
        const pillarDef = dom.insightTexts?.perPillar?.[weakestPillar];
        let whyText = '';
        if (pillarDef && pillarDef.whyChecks) {
          for (const check of pillarDef.whyChecks) {
            const answer = answers[check.q];
            if (answer && check.values.includes(answer)) {
              whyText = check.text;
              break;
            }
          }
        }
        if (!whyText) {
          whyText = (dom.whyTexts && dom.whyTexts[weakKey])
            ? dom.whyTexts[weakKey]
            : (dom.recommendationTexts && dom.recommendationTexts[weakKey])
              ? dom.recommendationTexts[weakKey].replace(/^(ensuring|securing|getting|reviewing|developing|building|strengthening|creating|implementing) /i, '')
              : `this area presents the greatest opportunity to strengthen your overall ${dom.improvementTerm}`;
        }
        msg1Parts.push(`Your highest-priority resilience gap\n${weakestPillar}\n\nBecause ${whyText.charAt(0).toLowerCase() + whyText.slice(1)}`);
      }
      postMessages.push({ type: 'report', text: msg1Parts.join('\n\n'), _delay: 12000 });

      // ---- personalized real-life context builder ----
      const buildRealLifeContext = (answers, prefix, dom) => {
        if (prefix === 'INC') {
          const savings = answers['INC_012'];
          const hasProtection = answers['INC_014'];
          const incomeStop = answers['INC_018'];
          let savingsPhrase = 'your emergency savings may not be sufficient to cover extended expenses';
          const savingsMap = {
            'Less than 1 month': 'your emergency savings would likely cover less than one month of expenses',
            '1-3 months': 'your emergency savings would cover 1\u20133 months of expenses',
            '3-6 months': 'your emergency savings would cover 3\u20136 months of expenses',
            '6+ months': 'your emergency savings would cover over six months of expenses'
          };
          if (savings && savingsMap[savings]) savingsPhrase = savingsMap[savings];
          let protectionPhrase = '';
          if (hasProtection === 'No') protectionPhrase = "you don't have a dedicated income protection policy";
          let consequence = 'a prolonged interruption to your income could create financial challenges that need to be addressed';
          if (incomeStop === 'It would stop completely' || !incomeStop) {
            consequence = "a prolonged interruption to your income could place significant pressure on your finances before you're able to recover";
          } else if (incomeStop === 'It would reduce significantly') {
            consequence = 'even with some income remaining, a prolonged interruption could still create financial strain';
          }
          const middle = protectionPhrase ? `, and because ${protectionPhrase}` : '';
          return `Based on your answers, ${savingsPhrase}${middle}. As a result, ${consequence}.`;
        }
        if (dom.realLifeContext) return dom.realLifeContext.replace(/^Here\u2019s what this means in real life:\s*/, '');
        return null;
      };

      // ---- Risk Story\u2122: consequence narrative (what could happen if nothing changes) ----
      const buildRiskStory = (cats, answers, prefix, dom) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return '';
        if (prefix === 'INC') {
          const incomeStop = answers['INC_018'];
          const savings = answers['INC_012'];
          const hasProtection = answers['INC_014'];
          const hasDebt = answers['INC_015'];
          const incomeSrc = answers['INC_011'];

          let scenario = "If you were unable to work for the next six months because of illness or injury, here\u2019s what your assessment suggests:";
          const consParts = [];

          if (!incomeStop || incomeStop === 'It would stop completely') {
            consParts.push("your income would stop");
          } else if (incomeStop === 'It would reduce significantly') {
            consParts.push("your income would reduce significantly");
          }

          if (!savings || savings === 'Less than 1 month') {
            consParts.push("your emergency savings would be exhausted quickly");
          } else if (savings === '1-3 months') {
            consParts.push("your emergency savings would only cover a few months");
          }

          if (hasProtection === 'No') {
            consParts.push("you don't have income protection cover to replace lost earnings");
          }

          if (!hasDebt || hasDebt === 'Yes') {
            consParts.push("ongoing financial commitments could become difficult to maintain");
          } else if (hasDebt === 'No') {
            consParts.push("and your existing commitments could become harder to maintain");
          }

          if (consParts.length > 0) {
            const last = consParts.pop();
            const consequence = consParts.length > 0
              ? consParts.join(', ') + ', and ' + last
              : last;
            scenario += `\n\nBased on your responses, ${consequence}.`;
          }

          scenario += `\n\nThese circumstances could place considerable pressure on both you and your household. The goal is to protect your income when life is interrupted.`;
          return scenario;
        }
        if (prefix === 'YPR') {
          const careerStability = answers['YPR_011'];
          const criticalIllness = answers['YPR_012'];
          const incomeStability = answers['YPR_013'];
          const hasInsurance = answers['YPR_014'];
          const hasGoal = answers['YPR_015'];

          const positives = [];
          const gaps = [];

          if (hasGoal === 'Yes') positives.push("you've already started saving toward a major life goal");
          if (careerStability === 'Over 5 years') positives.push("you've built solid career stability");
          if (criticalIllness === 'Yes easily') positives.push("you have an emergency fund that can handle unexpected costs");
          if (incomeStability === 'Yes') positives.push("your household could manage without your income for a period");

          if (hasInsurance === 'No') gaps.push("you don't have personal health or accident insurance");
          if (criticalIllness === 'No') gaps.push("a single unexpected medical event could force you to use your savings or take on debt");
          if (criticalIllness === 'With difficulty') gaps.push("an unexpected health event would still create significant financial strain");
          if (careerStability === 'Under 2 years') gaps.push("you're still early in your career, so your income history and financial buffer are still developing");
          if (incomeStability === 'No') gaps.push("if your income stopped, your household would struggle to maintain financial stability");

          let story;
          if (positives.length > 0) {
            const lastPos = positives.pop();
            const posStr = positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos;
            story = `You've already taken positive steps\u2014${posStr}. `;
          } else {
            story = `You're at the beginning of your financial journey, and that's exactly the right time to build strong foundations. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            const gapStr = gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap;
            story += `However, ${gapStr}. `;
          }

          story += `Without action, an unexpected event could delay important life goals like buying a home, starting a family, or investing in your future. The progress you\u2019ve already made deserves to be protected.`;
          return story;
        }
        if (prefix === 'HLT') {
          const insurance = answers['HLT_012'];
          const age = answers['HLT_009'];
          const checkups = answers['HLT_015'];
          const conditions = answers['HLT_014'];
          const emergencyFund = answers['HLT_013'];
          const surgeryCover = answers['HLT_016'];
          const illnessResilience = answers['HLT_017'];
          const dependants = answers['HLT_010'];

          const positives = [];
          const gaps = [];

          if (insurance === 'Private Health Insurance') positives.push("you have private health insurance in place");
          if (insurance === 'Employer HMO') positives.push("you have health coverage through your employer");
          if (checkups === 'Every 6 months' || checkups === 'Annually') positives.push("you stay on top of your health with regular check-ups");
          if (emergencyFund === 'Savings') positives.push("you have savings set aside for medical emergencies");
          if (conditions === 'None') positives.push("you don't currently have any chronic health conditions");

          if (insurance === 'None') gaps.push("you don't have any health insurance coverage");
          if (surgeryCover === 'No') gaps.push("your current cover may not be sufficient for major surgical procedures");
          if (checkups === 'Rarely/Only when sick') gaps.push("you only visit a doctor when you're already unwell, which means you may miss early detection of health issues");
          if (illnessResilience === 'No') gaps.push("your household would face financial pressure if a serious illness kept you from working");
          if (dependants === '4+' || dependants === '3') gaps.push("a health emergency would affect not just you but multiple family members who depend on you");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've taken positive steps to manage your health\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `If a serious health issue required extended treatment, gaps in your coverage could create financial pressure at a time when you should be focused on recovery. The goal is to stay healthy without financial hardship.`;
          return story;
        }
        if (prefix === 'FAM') {
          const dependents = answers['FAM_011'];
          const incomeBuffer = answers['FAM_012'];
          const insurance = answers['FAM_013'];
          const education = answers['FAM_014'];
          const healthCover = answers['FAM_015'];

          const positives = [];
          const gaps = [];

          if (insurance === 'Yes') positives.push("your family has insurance protection in place");
          if (healthCover === 'Yes') positives.push("your family is covered by a health plan");
          if (education === 'Yes') positives.push("you've planned for your children's education costs");
          if (incomeBuffer === 'Over 6 months') positives.push("your family has more than six months of income buffer");

          if (insurance === 'No') gaps.push("your family doesn't have adequate insurance coverage");
          if (insurance === 'Not sure') gaps.push("you're not certain whether your family's insurance coverage is adequate");
          if (healthCover === 'No') gaps.push("your family doesn't have comprehensive health insurance");
          if (incomeBuffer === 'Less than 3 months') gaps.push("your family would face financial difficulty within three months if your income stopped");
          if (education === 'No') gaps.push("your children's education costs are not secured against unexpected events");
          if (dependents === '3 or more') gaps.push("with multiple people relying on you, the impact of any disruption is magnified");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've taken important steps to protect your family\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Your family depends on you, and that responsibility is at the heart of this assessment. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `Without action, an unexpected event could affect not just your finances but the daily lives of the people who depend on you. Your family deserves to know that whatever happens, they\u2019ll be taken care of. That peace of mind is priceless.`;
          return story;
        }
        if (prefix === 'ENT') {
          const keyPerson = answers['ENT_011'];
          const guarantees = answers['ENT_012'];
          const survival = answers['ENT_013'];
          const keyInsurance = answers['ENT_014'];
          const assetSeparation = answers['ENT_015'];

          const positives = [];
          const gaps = [];

          if (keyPerson === 'No it runs itself') positives.push("your business doesn't depend entirely on your personal involvement");
          if (keyInsurance === 'Yes') positives.push("you have key person insurance in place");
          if (assetSeparation === 'Yes') positives.push("you've separated your personal and business assets");
          if (guarantees === 'No') positives.push("you've avoided personal guarantees on business debts");

          if (keyPerson === 'Yes completely') gaps.push("your business completely depends on your personal involvement, creating significant risk if you're unavailable");
          if (survival === 'No') gaps.push("your business would not survive three months without you");
          if (survival === 'Not sure') gaps.push("you're uncertain whether your business could survive without you");
          if (keyInsurance === 'No') gaps.push("you don't have key person insurance to protect the business if you become incapacitated");
          if (guarantees === 'Yes') gaps.push("your personal assets are at risk due to personal guarantees on business debts");
          if (assetSeparation === 'No') gaps.push("your personal and business assets are not adequately separated");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've built smart practices into your business\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Your business is an extension of you, and that personal investment is both your greatest strength and your greatest risk. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `Without addressing these gaps, a single unexpected event could put both your business and your personal finances at risk\u2014and everything you\u2019ve sacrificed to build your company could be lost in an instant. Protect both your company and your personal future.`;
          return story;
        }
        if (prefix === 'RET') {
          const plan = answers['RET_010'];
          const horizon = answers['RET_011'];
          const pension = answers['RET_012'];
          const medicalConcern = answers['RET_013'];
          const longTermCare = answers['RET_014'];
          const legacy = answers['RET_015'];

          const positives = [];
          const gaps = [];

          if (plan === 'I already have a written retirement plan') positives.push("you have a written retirement plan in place");
          if (plan === "I'm saving but don't have a clear plan") positives.push("you're already saving for retirement");
          if (pension === 'Yes') positives.push("you have a dedicated pension or retirement savings account");
          if (legacy === 'Yes, I have a documented plan') positives.push("you've documented your estate and legacy plans");

          if (pension === 'No') gaps.push("you don't have a dedicated pension or retirement savings account");
          if (plan === "I haven't thought seriously about retirement") gaps.push("you haven't started planning for retirement yet");
          if (plan === 'I know I should start planning') gaps.push("you know you should be planning for retirement but haven't taken concrete action");
          if (longTermCare === 'No') gaps.push("you don't have a plan for long-term care or critical illness needs in retirement");
          if (medicalConcern === 'Very concerned') gaps.push("you're very concerned about medical costs exhausting your retirement savings");
          if (horizon === 'Within 5 years' && pension === 'No') gaps.push("you're close to retirement but without sufficient savings in place");

          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've taken important steps toward securing your retirement\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Retirement may feel distant, but the decisions you make today determine whether your later years are defined by freedom or financial pressure. `;
          }

          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }

          story += `Time is the most powerful asset in retirement planning. Addressing these gaps now gives your savings more time to grow. Confidence in retirement comes from preparation, not hope.`;
          return story;
        }
        if (prefix === 'HOM') {
          const tenure = answers['HOM_011'];
          const insurance = answers['HOM_012'];
          let story = '';
          if (tenure === 'Own') story += "You own your home, which is a valuable asset that deserves to be protected. ";
          else if (tenure === 'Rent') story += "You're currently renting, which means your personal belongings and liability need coverage even though you don't own the property. ";
          else story += "Without stable housing, you face significant exposure to cost changes and lack the security of homeownership. ";
          if (insurance === 'No') story += "Without adequate home insurance, a fire, theft, or liability claim could result in significant financial loss that could have been avoided. ";
          else story += "While you have some protections in place, making sure your coverage matches the full value of your belongings is essential. ";
          story += "Your home is more than a building\u2014it's your foundation. Protecting it protects everything else.";
          return story;
        }
        if (prefix === 'MOT') {
          const count = answers['MOT_011'];
          const insurance = answers['MOT_012'];
          let story = '';
          if (count === '1') story += "You have a single vehicle, which simplifies your risk exposure. ";
          else if (count === '2') story += "With two vehicles, your combined exposure to accidents, theft, and repair costs increases. ";
          else story += "With multiple vehicles, your overall risk exposure and insurance costs multiply significantly. ";
          if (insurance === 'No') story += "Without comprehensive motor insurance, a serious accident or theft could leave you with substantial out-of-pocket costs. ";
          else story += "Having insurance on your primary vehicle is a good start, but ensuring every vehicle you use is adequately covered is important. ";
          story += "Being on the road shouldn\u2019t mean being at risk. Protect your mobility so you can keep moving.";
          return story;
        }
        if (prefix === 'SME') {
          const workforce = answers['SME_013'];
          const revenue = answers['SME_014'];
          const propertyIns = answers['SME_016'];
          const disasterSurvival = answers['SME_017'];
          const positives = [];
          const gaps = [];
          if (propertyIns === 'Yes') positives.push("you have fire and burglary insurance for your business");
          if (disasterSurvival === 'Yes easily') positives.push("your business could recover easily from a major disruption");
          if (workforce === '1-10') positives.push("you operate a lean business with manageable workforce risks");
          if (workforce === '51+') gaps.push("you have a significant workforce that creates substantial employment liability exposure");
          if (revenue === 'Over \u20A6200M') gaps.push("your business has significant financial exposure that needs adequate coverage");
          if (propertyIns === 'No') gaps.push("you don't have fire and burglary insurance for your business");
          if (disasterSurvival === 'No, we would close') gaps.push("your business would not survive a three-month closure");
          if (disasterSurvival === 'With difficulty') gaps.push("your business would struggle to recover from a major disaster");
          let story = '';
          if (positives.length > 0) {
            const lastPos = positives.pop();
            story = `You've put important safeguards in place for your business\u2014${positives.length > 0 ? positives.join(', ') + ', and ' + lastPos : lastPos}. `;
          } else {
            story = `Your business is the result of hard work, late nights, and personal sacrifice. Every day you're building something worth protecting. `;
          }
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += `However, ${gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap}. `;
          }
          story += `A fire, burglary, or prolonged closure could undo years of effort\u2014and your customers, suppliers, and employees depend on you to keep going. A single disruption shouldn\u2019t be able to undo everything you\u2019ve built.`;
          return story;
        }
        if (prefix === 'MFG') {
          const workplaceAccidents = answers['MFG_012'];
          const equipment = answers['MFG_014'];
          const emergencyProcedures = answers['MFG_020'];
          const fireExtinguishers = answers['MFG_021'];
          const safetyOwner = answers['MFG_023'];
          const facilityIns = answers['MFG_016'];
          const closureResilience = answers['MFG_022'];
          const gapItems = [];
          if (equipment === 'Immediately') gapItems.push("a critical machine breakdown could halt production immediately");
          if (emergencyProcedures === 'No') gapItems.push("emergency response procedures have not been formally documented");
          if (safetyOwner === 'No one specifically assigned') gapItems.push("there is no designated health and safety lead");
          if (facilityIns === 'No') gapItems.push("your facility and equipment are not protected against fire and special perils");
          if (fireExtinguishers === 'No') gapItems.push("fire protection measures are incomplete");
          let story = "Every day, your manufacturing operation depends on equipment, people, and processes working together to keep production running\u2014and your customers rely on you to deliver.\n\n";
          if (workplaceAccidents === 'Yes') {
            story += "Your facility has already experienced workplace accidents. Each past incident is a signal to review and strengthen current safety measures before more serious events occur. ";
          }
          if (gapItems.length > 0) {
            const lastGap = gapItems.pop();
            const gapStr = gapItems.length > 0 ? gapItems.join(', ') + ', and ' + lastGap : lastGap;
            story += `Based on your assessment, several important safeguards are currently missing: ${gapStr}.`;
            story += `\n\nThese may not affect daily production today, but imagine explaining to your biggest customer that you can\u2019t fulfil their order because a fire or equipment failure shut down your line. A single major incident could halt production, disrupt customer commitments, create legal exposure, and put the business\u2014and the jobs of your team\u2014at risk.`;
          } else {
            story += `Your facility has important safeguards in place, but manufacturing risk management requires continuous attention.`;
          }
          story += `\n\nThe encouraging news is that each of these risks can be reduced through practical operational improvements and appropriate protection strategies.`;
          return story;
        }
        if (prefix === 'HOS') {
          const patientIncidents = answers['HOS_012'];
          const medicalLiability = answers['HOS_015'];
          const complianceOwner = answers['HOS_023'];
          const emergencyProcedures = answers['HOS_020'];
          const equipmentIns = answers['HOS_017'];
          const equipmentValue = answers['HOS_016'];
          const fireExtinguishers = answers['HOS_021'];
          const buildingMaintenance = answers['HOS_027'];
          const gapItems = [];
          if (complianceOwner === 'No one specifically assigned') gapItems.push("no designated compliance or patient safety lead");
          if (emergencyProcedures === 'No') gapItems.push("emergency response procedures have not been formally documented");
          if (equipmentValue === 'Yes' && equipmentIns === 'No') gapItems.push("critical medical equipment is not protected against breakdown");
          if (medicalLiability === 'No') gapItems.push("professional indemnity protection is not in place");
          if (fireExtinguishers === 'No') gapItems.push("fire protection measures are incomplete");
          if (buildingMaintenance === 'Never' || buildingMaintenance === 'Rarely') gapItems.push("routine facility maintenance is limited");
          let story = "Every day, your hospital depends on people, equipment, and processes working together to deliver safe patient care. Your patients and their families trust you with their lives.\n\n";
          if (patientIncidents === 'Yes') {
            story += "Your facility has already experienced patient safety incidents. Each past event is a signal\u2014not just a statistic. The most critical question isn\u2019t whether another incident will happen, but whether your facility will be prepared when it does. ";
          }
          if (gapItems.length > 0) {
            const lastGap = gapItems.pop();
            const gapStr = gapItems.length > 0 ? gapItems.join(', ') + ', and ' + lastGap : lastGap;
            story += `Based on your assessment, several important safeguards are currently missing. There is ${gapStr}.`;
            story += `\n\nThese gaps may not affect daily operations today, but imagine the consequence of a fire in a ward, a critical equipment failure during surgery, or a patient safety incident that could have been prevented. Any of these could interrupt clinical services, increase legal exposure, damage public confidence, and create financial pressure that threatens your ability to serve your community.`;
          } else {
            story += `Your facility has important safeguards in place, but clinical risk management requires continuous attention.`;
          }
          story += `\n\nThe encouraging news is that each of these risks can be reduced through practical operational improvements and appropriate protection strategies.`;
          return story;
        }
        if (prefix === 'SCH') {
          const studentAccidents = answers['SCH_012'];
          const emergencyProcedures = answers['SCH_020'];
          const safetyOwner = answers['SCH_023'];
          const injuryLiability = answers['SCH_016'];
          const propertyIns = answers['SCH_017'];
          const fireAlarm = answers['SCH_026'];
          const closureResilience = answers['SCH_022'];
          const hasBuses = answers['SCH_015'];
          const driverTraining = answers['SCH_024'];
          const vehicleInspections = answers['SCH_025'];
          const gaps = [];
          if (emergencyProcedures === 'No') gaps.push('documented emergency procedures');
          if (safetyOwner === 'No one specifically assigned') gaps.push('assigned safety leadership');
          if (injuryLiability === 'No') gaps.push('liability protection');
          if (propertyIns === 'No') gaps.push('fire insurance');
          if (fireAlarm === 'No') gaps.push('a working fire alarm');
          let story;
          if (studentAccidents === 'Yes') {
            story = "Your school has already experienced student incidents on the premises. Past incidents often indicate areas where existing safeguards may need strengthening. ";
          } else {
            story = "Even if your school hasn\u2019t experienced a serious incident, the risk is real. A single fire or student accident could significantly disrupt school operations, damage community confidence, and place financial pressure on the school. "; 
          }
          story += "Based on your responses, several important safeguards are currently missing, including ";
          if (gaps.length > 0) {
            const lastGap = gaps.pop();
            story += (gaps.length > 0 ? gaps.join(', ') + ', and ' + lastGap : lastGap) + '. ';
          } else {
            story += 'some core protections. ';
          }
          if (closureResilience === 'No') {
            story += "Your responses also indicate that an unexpected three-month closure could create immediate financial pressure\u2014making it difficult to pay staff salaries and maintain the facilities parents trust you to provide. ";
          }
          story += 'Together, these gaps mean that a future incident could not only disrupt operations but damage the trust you\u2019ve built with parents and the community over years. Your school deserves the same level of protection you provide your students every day.';
          return story;
        }
        if (prefix === 'CHR') {
          const premisesIncidents = answers['CHR_012'];
          const congregation = answers['CHR_013'];
          const eventLiability = answers['CHR_015'];
          const buildingIns = answers['CHR_017'];
          const emergencyProcedures = answers['CHR_020'];
          const safetyOwner = answers['CHR_023'];
          const gapItems = [];
          if (emergencyProcedures === 'No') gapItems.push("emergency response procedures have not been formally documented");
          if (safetyOwner === 'No one specifically assigned') gapItems.push("there is no designated health and safety lead");
          if (eventLiability === 'No') gapItems.push("your church does not have liability protection if a congregant is injured on your premises");
          if (buildingIns === 'No') gapItems.push("your church building and contents are not protected against fire");
          let story = "Every week, your church brings people together for worship, community, and support. Your congregation trusts you to provide a safe space for them to gather and grow in faith. Protecting that space is part of protecting your mission.\n\n";
          if (premisesIncidents === 'Yes') {
            story += "Your church has already experienced incidents on its premises. Each past event is a reminder that the people who walk through your doors depend on you for their safety\u2014and that responsibility requires constant attention. ";
          }
          if (gapItems.length > 0) {
            const lastGap = gapItems.pop();
            const gapStr = gapItems.length > 0 ? gapItems.join(', ') + ', and ' + lastGap : lastGap;
            story += `Based on your assessment, several important safeguards are currently missing: ${gapStr}.`;
            story += `\n\nThese gaps may not affect your weekly services today, but imagine a fire damaging your sanctuary, a congregant being injured during an event, or valuable equipment being stolen. Any of these could disrupt your operations, create legal exposure, and put financial pressure on your church\u2014making it harder to serve the community that depends on you.`;
          } else {
            story += `Your church has important safeguards in place, but protecting your congregation requires continuous attention.`;
          }
          story += `\n\nThe encouraging news is that each of these risks can be reduced through practical operational improvements and appropriate protection strategies.`;
          return story;
        }
        if (prefix === 'CON') {
          const siteAccidents = answers['CON_012'];
          const machinery = answers['CON_014'];
          const contractorIns = answers['CON_015'];
          const accidentCover = answers['CON_016'];
          const emergencyProcedures = answers['CON_020'];
          const safetyOwner = answers['CON_023'];
          const gapItems = [];
          if (machinery === 'Yes') gapItems.push("heavy machinery on site creates significant liability and damage risk");
          if (emergencyProcedures === 'No') gapItems.push("emergency response procedures for site accidents have not been formally documented");
          if (safetyOwner === 'No one specifically assigned') gapItems.push("there is no designated health and safety lead on site");
          if (contractorIns === 'No') gapItems.push("your projects are not protected by contractor's all-risk insurance");
          if (accidentCover === 'No') gapItems.push("your on-site workers do not have group personal accident cover");
          let story = "Every day on a construction site, people, equipment, and processes must work together to deliver projects safely and on time. Your reputation\u2014built project by project over years\u2014depends on getting this right every single day.\n\n";
          if (siteAccidents === 'Yes') {
            story += "Your sites have already experienced on-site accidents. In construction, past incidents are the strongest predictor of future risk. Each gap in your safety framework increases the chance that a worker goes home injured\u2014or doesn\u2019t. ";
          }
          if (gapItems.length > 0) {
            const lastGap = gapItems.pop();
            const gapStr = gapItems.length > 0 ? gapItems.join(', ') + ', and ' + lastGap : lastGap;
            story += `Based on your assessment, several important safeguards are currently missing: ${gapStr}.`;
            story += `\n\nThese gaps may not affect your day-to-day operations today, but a single major incident\u2014an accident, equipment failure, or fire\u2014could halt work across your projects, trigger contract penalties, create legal exposure, and put the future of your business at risk. One uninsured incident could undo years of hard-won reputation.`;
          } else {
            story += `Your sites have important safeguards in place, but construction risk management requires continuous attention.`;
          }
          story += `\n\nThe encouraging news is that each of these risks can be reduced through practical operational improvements and appropriate protection strategies.`;
          return story;
        }
        if (prefix === 'TRN') {
          const fleetAccidents = answers['TRN_012'];
          const goodsIns = answers['TRN_015'];
          const driverCover = answers['TRN_016'];
          const compliance = answers['TRN_017'];
          const emergencyProcedures = answers['TRN_020'];
          const safetyOwner = answers['TRN_023'];
          const gapItems = [];
          if (emergencyProcedures === 'No') gapItems.push("emergency response procedures for road accidents have not been formally documented");
          if (goodsIns === 'No') gapItems.push("your cargo is not protected by goods-in-transit insurance");
          if (driverCover === 'No') gapItems.push("your drivers are not covered by group personal accident insurance");
          if (compliance === 'No') gapItems.push("your fleet vehicles are not comprehensively insured");
          if (compliance === 'Some of them') gapItems.push("only some of your fleet vehicles have comprehensive motor insurance");
          if (safetyOwner === 'No one specifically assigned') gapItems.push("there is no designated safety and compliance lead");
          let story = "Every day, your fleet depends on drivers, vehicles, and processes working together to keep goods moving safely. Your clients trust you with their cargo and their deadlines\u2014and that trust is your business\u2019s most valuable asset.\n\n";
          if (fleetAccidents === 'Yes') {
            story += "Your fleet has already experienced accidents. In transport operations, past incidents signal deeper systemic risks. Each gap in your safety and compliance framework increases the likelihood of a more serious event\u2014one that could cost lives, cargo, and client relationships built over years. ";
          }
          if (gapItems.length > 0) {
            const lastGap = gapItems.pop();
            const gapStr = gapItems.length > 0 ? gapItems.join(', ') + ', and ' + lastGap : lastGap;
            story += `Based on your assessment, several important safeguards are currently missing: ${gapStr}.`;
            story += `\n\nThese gaps may not affect your daily operations today, but a single major incident\u2014a serious accident, cargo theft, or compliance failure\u2014could ground your fleet, disrupt critical deliveries, create legal exposure, and put significant financial pressure on your business. One phone call could undo years of reliable service.`;
          } else {
            story += `Your fleet has important safeguards in place, but transport risk management requires continuous attention.`;
          }
          story += `\n\nThe encouraging news is that each of these risks can be reduced through practical operational improvements and appropriate protection strategies.`;
          return story;
        }
        // Generic fallback
        return `Your overall ${dom.closingTerm} profile shows areas of strength and opportunities to build greater resilience for the future. The question isn\u2019t whether a challenge will come\u2014it\u2019s whether you\u2019ll be ready when it does.`;
      };

      // ---- resilience forecast (illustrative, based on improvement gains) ----
      const buildResilienceForecast = (cats, currentScore, answers, prefix, dom, reportName) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return null;
        const sorted = entries.sort(([, a], [, b]) => a - b);
        const wName = sorted[0][0];
        const scoringConfig = require('../config/scoring/index');
        const prefixConfig = scoringConfig[prefix];
        let actionLines = [];
        let totalGain = 0;
        if (prefixConfig && prefixConfig.improvements) {
          // Build qId -> pillarName map so actions can be ordered weakest-pillar-first
          const qPillar = {};
          if (prefixConfig.questions && prefixConfig.categories) {
            const catPillar = {};
            for (const [catId, cat] of Object.entries(prefixConfig.categories)) catPillar[catId] = cat.pillar;
            const idName = {};
            for (const p of prefixConfig.pillars || []) idName[p.id] = p.name || p.id;
            for (const [qId, qConf] of Object.entries(prefixConfig.questions)) {
              const catId = qConf.category;
              const pillarId = catPillar[catId];
              if (pillarId) qPillar[qId] = idName[pillarId] || pillarId;
            }
          }
          const matched = [];
          for (const [qId, qImprovements] of Object.entries(prefixConfig.improvements)) {
            const answer = answers[qId];
            if (answer && qImprovements[answer]) {
              const action = qImprovements[answer].action;
              const isInsurance = /insurance|cover|indemnity|policy|protection\s+for/i.test(action);
              matched.push({ qId, qImprovements, answer, pillarName: qPillar[qId], isInsurance });
            }
          }
          // Weakest pillar first; within a pillar, insurance / risk-transfer
          // actions come before operational ones so key protections surface
          matched.sort((a, b) => {
            const sa = a.pillarName != null ? (cats[a.pillarName] ?? 999) : 999;
            const sb = b.pillarName != null ? (cats[b.pillarName] ?? 999) : 999;
            if (sa !== sb) return sa - sb;
            return (b.isInsurance ? 1 : 0) - (a.isInsurance ? 1 : 0);
          });
          for (const { qId, qImprovements, answer } of matched) {
            if (actionLines.length >= 3) break;
            const imp = qImprovements[answer];
            totalGain += imp.gain;
            const prefixVerbs = 'Add|Assess|Audit|Begin|Bring|Build|Complete|Conduct|Confirm|Consider|Create|Delegate|Designate|Develop|Diversify|Document|Educate|Ensure|Establish|Expand|Explore|Extend|Get|Implement|Improve|Increase|Install|Make|Obtain|Open|Protect|Reduce|Replace|Research|Resolve|Review|Schedule|Secure|Separate|Set|Start|Strengthen|Supplement|Train|Upgrade|Verify';
            const prefixRegex = new RegExp('^(' + prefixVerbs + ')', 'i');
            const verbMatch = imp.action.match(prefixRegex);
            const prefixWord = verbMatch ? verbMatch[1] : 'Build';
            const rest = imp.action.replace(new RegExp('^(' + prefixVerbs + ')\\s+', 'i'), '');
            actionLines.push(`\u2713 ${prefixWord} ${rest.charAt(0).toLowerCase() + rest.slice(1)}`);
          }
        }
        let projectedScore = Math.min(Math.round(currentScore + totalGain), 95);
        if (actionLines.length === 0) {
          const recTexts = dom.recommendationTexts || {};
          const wLower = wName.toLowerCase();
          const action = recTexts[wLower];
          if (action) {
            action.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3).forEach(step => {
              const clean = step.replace(/^(reviewing|building|considering|diversifying|getting|securing|ensuring|creating|starting|strengthening)\s+/i, '');
              const vm = step.match(/^(reviewing|building|considering|diversifying|getting|securing|ensuring|creating|starting|strengthening)/i);
              const vMap = { building: 'Build', conducting: 'Conduct', considering: 'Consider', creating: 'Create', designating: 'Designate', developing: 'Develop', diversifying: 'Diversify', documenting: 'Document', ensuring: 'Ensure', establishing: 'Establish', extending: 'Extend', getting: 'Get', implementing: 'Implement', installing: 'Install', reviewing: 'Review', scheduling: 'Schedule', securing: 'Secure', seeking: 'Seek', separating: 'Separate', setting: 'Set', starting: 'Start', strengthening: 'Strengthen' };
              const pw = vm ? vMap[vm[1].toLowerCase()] || 'Build' : 'Build';
              actionLines.push(`\u2713 ${pw} ${clean}`);
            });
          } else {
            actionLines.push(`\u2713 Strengthen your ${wLower}`);
          }
          const fallbackGain = Math.round((95 - currentScore) * 0.6);
          projectedScore = Math.max(Math.round(currentScore + fallbackGain), Math.round(currentScore * 1.5));
        }
        return { text: `Resilience Forecast\u2122\n\nHere\u2019s how your resilience could improve\n${actionLines.slice(0, 3).join('\n')}\n\nYour ${reportName} score could improve from\n${currentScore} \u2192 approximately ${projectedScore}`, projectedScore };
      };

      // ---- confidence-phrased recommendation ----
      const buildRecommendation = (cats, dom) => {
        const entries = Object.entries(cats);
        if (entries.length === 0) return null;
        const sorted = entries.sort(([, a], [, b]) => a - b);
        const weakestName = sorted[0][0];
        const weakestScore = sorted[0][1];
        const weakArea = weakestName.toLowerCase();
        const firstSteps = dom.firstStepTexts || {};
        const recTexts = dom.recommendationTexts || {};
        const action = firstSteps[weakArea] || recTexts[weakArea] || `reviewing your ${weakArea} to strengthen your ${dom.closingTerm}`;
        return `Recommended First Step\n\n${action.charAt(0).toUpperCase() + action.slice(1)}\n\nImproving this area from ${weakestScore}% is expected to have the greatest impact on your ${dom.closingTerm}.`;
      };

      const reportNames = {
        HLT: 'Health Protection Report\u2122', YPR: 'Young Professional Report\u2122',
        ENT: 'Entrepreneur Report\u2122', FAM: 'Family Protection Report\u2122',
        INC: 'Income Protection Report\u2122', RET: 'Retirement Readiness Report\u2122',
        HOM: 'Home Protection Report\u2122', MOT: 'Motor Protection Report\u2122',
        SME: 'Business Risk Report\u2122', MFG: 'Manufacturing Risk Report\u2122',
        HOS: 'Hospital Risk Report\u2122', SCH: 'School Risk Report\u2122',
        CHR: 'Church Risk Report\u2122', CON: 'Construction Risk Report\u2122',
        TRN: 'Transport Risk Report\u2122'
      };
      const reportName = reportNames[prefix] || `${dom.assessmentTitle} Report\u2122`;

      const makePillarBar = (s) => {
        const filled = Math.round(Math.min(s, 100) / 10);
        return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
      };
      const pillarNames = Object.keys(scoredCats);
      const maxNameLen = pillarNames.length > 0 ? Math.max(...pillarNames.map(n => n.length), 20) : 20;
      const pillarChart = Object.entries(scoredCats)
        .sort(([, a], [, b]) => b - a)
        .map(([n, s]) => `${n.padEnd(maxNameLen)} ${makePillarBar(s)} ${s}%`)
        .join('\n');

      // ===== Message 2: Risk Pillars (bars only) =====
      let msg2 = `\uD83D\uDCCA Your Risk Pillars\n\n${pillarChart}`;
      postMessages.push({ type: 'pillars', text: msg2, _delay: 3000 });

      // ---- What You're Doing Well\u2122 (strengths-based section) ----
      const buildStrengths = (answers, prefix) => {
        const strengthDefs = {
          HOS: [
            { q: 'HOS_013', values: ['Less than 50', '50\u2013100'], text: 'manageable patient volume that keeps clinical liability exposure contained' },
            { q: 'HOS_016', values: ['No'], text: 'no high-value medical equipment exposure that requires specialised protection' },
            { q: 'HOS_020', values: ['Yes'], text: 'documented emergency procedures for patient incidents and fire' },
            { q: 'HOS_021', values: ['Yes'], text: 'fire extinguishers regularly inspected and available across your facility' },
            { q: 'HOS_023', values: ['Medical Director', 'Designated Compliance Officer'], text: 'dedicated compliance and patient safety leadership' },
            { q: 'HOS_024', values: ['Yes'], text: 'structured patient transport service with appropriate fleet coverage' },
            { q: 'HOS_025', values: ['Yes'], text: 'drivers trained in defensive driving and emergency protocols' },
            { q: 'HOS_026', values: ['Yes'], text: 'regular vehicle safety inspections for your medical transport fleet' },
            { q: 'HOS_027', values: ['Monthly', 'Quarterly', 'Annually'], text: 'regular building maintenance inspection programme' },
            { q: 'HOS_022', values: ['Yes'], text: 'financial resilience to sustain operations through a three-month closure' }
          ],
          MFG: [
            { q: 'MFG_013', values: ['Under 50', '50\u2013200'], text: 'manageable workforce size that keeps liability exposure contained' },
            { q: 'MFG_020', values: ['Yes'], text: 'documented emergency procedures for accidents and fire' },
            { q: 'MFG_021', values: ['Yes'], text: 'regularly inspected fire extinguishers in place across your facility' },
            { q: 'MFG_023', values: ['Operations Manager', 'Designated Safety Officer'], text: 'dedicated health and safety leadership' },
            { q: 'MFG_025', values: ['Yes'], text: 'operators trained in safe operating procedures' },
            { q: 'MFG_026', values: ['Yes'], text: 'regular vehicle safety inspections for your logistics fleet' },
            { q: 'MFG_022', values: ['Yes'], text: 'financial resilience to sustain operations through a three-month closure' }
          ],
          CHR: [
            { q: 'CHR_013', values: ['Under 200', '200\u2013500', '500\u20131000'], text: 'manageable congregation size that keeps operational risk contained' },
            { q: 'CHR_020', values: ['Yes'], text: 'documented emergency procedures for services and events' },
            { q: 'CHR_021', values: ['Yes'], text: 'regularly inspected fire extinguishers in place across your premises' },
            { q: 'CHR_023', values: ['Church Administrator', 'Designated Safety Officer'], text: 'dedicated health and safety leadership' },
            { q: 'CHR_025', values: ['Yes'], text: 'drivers trained in defensive driving and first aid' },
            { q: 'CHR_026', values: ['Yes'], text: 'routine safety inspections for church transport vehicles' },
            { q: 'CHR_014', values: ['No'], text: 'no high-value asset exposure requiring specialised insurance' }
          ],
          CON: [
            { q: 'CON_020', values: ['Yes'], text: 'documented emergency procedures for on-site accidents and fire' },
            { q: 'CON_021', values: ['Yes'], text: 'fire extinguishers regularly inspected across your work sites' },
            { q: 'CON_023', values: ['Project Manager', 'Designated Safety Officer'], text: 'dedicated health and safety leadership on site' },
            { q: 'CON_025', values: ['Yes'], text: 'equipment operators trained in safe operating procedures' },
            { q: 'CON_014', values: ['No'], text: 'no heavy machinery exposure requiring specialised coverage' },
            { q: 'CON_013', values: ['1\u20133', '3\u20135'], text: 'manageable project portfolio that limits cumulative risk exposure' }
          ],
          TRN: [
            { q: 'TRN_013', values: ['1\u20135', '6\u201310', '11\u201320'], text: 'manageable fleet size that keeps risk exposure contained' },
            { q: 'TRN_020', values: ['Yes'], text: 'documented emergency procedures for road accidents and fleet incidents' },
            { q: 'TRN_021', values: ['Yes'], text: 'fire extinguishers regularly inspected in your depot and vehicles' },
            { q: 'TRN_023', values: ['Fleet Manager', 'Designated Compliance Officer'], text: 'dedicated safety and compliance leadership' },
            { q: 'TRN_024', values: ['Yes'], text: 'drivers trained in defensive driving and first aid' },
            { q: 'TRN_025', values: ['Yes'], text: 'regular vehicle safety inspections across your fleet' },
            { q: 'TRN_026', values: ['Yes'], text: 'working fire alarm system in your depot that is regularly tested' }
          ],
          SCH: [
            { q: 'SCH_013', values: ['Under 100'], text: 'manageable student population that keeps safety exposure contained' },
            { q: 'SCH_020', values: ['Yes'], text: 'documented emergency procedures for student accidents and fire' },
            { q: 'SCH_021', values: ['Yes'], text: 'fire extinguishers regularly inspected and available across your school' },
            { q: 'SCH_023', values: ['Head Teacher / Principal', 'Designated Safety Officer'], text: 'designated health and safety leadership' },
            { q: 'SCH_024', values: ['Yes'], text: 'drivers trained in first aid and defensive driving' },
            { q: 'SCH_025', values: ['Yes'], text: 'regular vehicle safety inspections for your school transport' },
            { q: 'SCH_026', values: ['Yes'], text: 'a working fire alarm system that is regularly tested' },
            { q: 'SCH_027', values: ['Monthly', 'Quarterly', 'Annually'], text: 'regular building maintenance inspection programme' },
            { q: 'SCH_022', values: ['Yes'], text: 'financial resilience to sustain operations through a three-month closure' },
            { q: 'SCH_016', values: ['Yes'], text: 'public liability protection against student injury claims' }
          ],
          SME: [
            { q: 'SME_011', values: ['Yes'], text: 'consistent monthly revenue that supports business stability' },
            { q: 'SME_013', values: ['1\u201310', '11\u201350'], text: 'manageable workforce size that keeps liability exposure contained' },
            { q: 'SME_015', values: ['Yes'], text: 'an established base of operations for your business' },
            { q: 'SME_016', values: ['Yes'], text: 'comprehensive fire and burglary insurance for your business premises' },
            { q: 'SME_017', values: ['Yes easily'], text: 'strong financial resilience to sustain operations through a three-month closure' }
          ]
        };
        const defs = strengthDefs[prefix] || [];
        const found = [];
        for (const d of defs) {
          const answer = answers[d.q];
          if (answer && d.values.includes(answer)) found.push(d.text);
        }
        return found;
      };
      const strengths = buildStrengths(answers, prefix);
      const strengthsForReport = [...strengths];

      // ===== Message 3: Biggest Insight (one paragraph) =====
      const insightText = generateCoverScoreInsight(scoredCats, answers, name, prefix);
      let msg3 = '';
      if (insightText) {
        msg3 = `\uD83D\uDCA1 Biggest Insight\n\n${insightText.replace(/^CoverScore Insight\u2122 \u2B50\n\n/, '')}`;
      }
      postMessages.push({ type: 'insight', text: msg3, _delay: 3000 });

      // ===== Message 4: How to Improve (3 bullets) + What You're Doing Well =====
      let msg4 = `\uD83D\uDCC8 How to Improve\n`;
      const forecast = buildResilienceForecast(scoredCats, assessmentData.score, answers, prefix, dom, reportName);
      if (forecast && forecast.text) {
        const forecastLines = forecast.text.split('\n');
        const actionLines = forecastLines.filter(l => l.startsWith('\u2713'));
        if (actionLines.length > 0) {
          msg4 += '\n' + actionLines.slice(0, 3).join('\n');
        } else {
          const recommendation = buildRecommendation(scoredCats, dom);
          if (recommendation) {
            const recLines = recommendation.split('\n');
            const actionPart = recLines.filter(l => !l.startsWith('Recommended') && !l.startsWith('Improving'));
            if (actionPart.length > 0) msg4 += '\n\u2713 ' + actionPart.join('\n\u2713 ');
          }
        }
      } else {
        const recommendation = buildRecommendation(scoredCats, dom);
        if (recommendation) {
          const recLines = recommendation.split('\n');
          const actionPart = recLines.filter(l => !l.startsWith('Recommended') && !l.startsWith('Improving'));
          if (actionPart.length > 0) msg4 += '\n\u2713 ' + actionPart.join('\n\u2713 ');
        }
      }
      if (forecast && forecast.projectedScore > assessmentData.score) {
        msg4 += `\n\nYour score could improve from ${assessmentData.score} to approximately ${forecast.projectedScore}`;
      }
      // Add strengths if found
      if (strengths.length > 0) {
        const lastS = strengths.pop();
        const sStr = strengths.length > 0 ? strengths.join(', ') + ', and ' + lastS : lastS;
        const entityMap = { MFG: 'facility', HOS: 'hospital' };
        const entity = entityMap[prefix] || dom.domain.replace('healthcare', 'hospital');
        msg4 += `\n\n\u2705 One positive finding\nYour ${entity} ${sStr}.`;
      }
      postMessages.push({ type: 'report_link', text: msg4, _delay: 3000 });

      // ===== Message 5: Would you like the full report? =====
      postMessages.push({
        type: 'advisor',
        text: `\uD83D\uDCC4 Would you like to see your complete report?\n\nIt includes:\n\u2713 What you're doing well\n\u2713 Your personalised risk story\n\u2713 Practical next steps\n\u2713 Detailed recommendations\n\u2713 Your report link\n\nA. Yes, show me\nB. Not now`,
        _delay: 3000
      });

      // Build full detailed report bundle and store for later delivery
      const fullReportMessages = [];

      // Full Report M1: What You're Doing Well + Risk Story
      let fullM1 = '';
      const riskStoryText = `\uD83D\uDD0D Your Risk Story\n\n${buildRiskStory(scoredCats, answers, prefix, dom)}`;
      if (strengthsForReport.length > 0) {
        const lastS = strengthsForReport.pop();
        const sStr = strengthsForReport.length > 0 ? strengthsForReport.join(', ') + ', and ' + lastS : lastS;
        const count = strengthsForReport.length + 1;
        const intro = count === 1 ? 'Your assessment identified an important strength.' : 'Your assessment identified several important strengths.';
        const bridge = count === 1 ? 'This provides' : 'Together, these provide';
        const entityMap = { MFG: 'facility', HOS: 'hospital' };
        const entity = entityMap[prefix] || dom.domain.replace('healthcare', 'hospital');
        fullM1 = `What You\u2019re Doing Well\u2122\n\n${intro} Your ${entity} has ${sStr}. ${bridge} a solid operational foundation on which stronger ${dom.resilienceTerm.toLowerCase()} can be built.`;
      }
      if (fullM1) fullM1 += '\n\n';
      fullM1 += riskStoryText;

      // Full Report M2: If Nothing Changes (emotional version)
      const ifNothingChangeTexts = {
        HOS: `If nothing changes...\n\nA single serious incident could force your hospital to suspend critical services for months. Patients would be turned away, public confidence would erode, and the financial cost of recovery could threaten your facility\u2019s long-term viability. The hard work your team has put into building your reputation could unravel in days.`,
        MFG: `If nothing changes...\n\nA fire, equipment failure, or workplace accident could halt your production line for weeks. Customer orders would go unfilled, contracts could be lost, and the financial pressure of downtime could put years of hard work at risk. Your reputation for reliability depends on the safeguards you put in place today.`,
        CHR: `If nothing changes...\n\nA single incident during a service or event could harm a member of your congregation and create legal exposure that threatens your church\u2019s mission. The trust your community places in you is invaluable\u2014and fragile. Protecting your congregation means protecting your ability to serve.`,
        CON: `If nothing changes...\n\nAn on-site accident or equipment failure could halt work across your projects, triggering contract penalties and legal exposure. Your reputation for delivering on time\u2014built project by project over years\u2014could be damaged in an instant. One uninsured incident could put your entire business at risk.`,
        TRN: `If nothing changes...\n\nA major accident, cargo theft, or compliance failure could ground your fleet and disrupt deliveries for weeks. Your clients depend on you to keep their goods moving. A single gap in your protections could cost you contracts you\u2019ve spent years building.`,
        SCH: `If nothing changes...\n\nA fire or student accident could significantly disrupt school operations, damage community confidence, and place financial pressure on the school. Parents may reconsider their choice of school, staff confidence may waver, and years of community trust could be damaged. The reputation you\u2019ve worked so hard to build could be undone by a single preventable incident.`,
        SME: `If nothing changes...\n\nA fire, burglary, or prolonged closure could undo everything you\u2019ve built. Your customers would move on, your suppliers would look elsewhere, and recovering from the financial loss could take years\u2014if recovery is even possible. The business you\u2019ve worked so hard to grow deserves better protection.`,
        HLT: `If nothing changes...\n\nA serious health event could deplete your savings, force you to borrow, or leave you unable to work. Without adequate health coverage, a medical emergency becomes a financial emergency. Your health should never be compromised by cost concerns.`,
        INC: `If nothing changes...\n\nIf an illness or injury interrupted your income, your emergency savings would last only a short time. Without disability income protection, a prolonged absence from work could put your finances under severe pressure. Your income is your most valuable asset\u2014it deserves to be protected.`,
        FAM: `If nothing changes...\n\nAn unexpected event affecting the primary breadwinner could leave your family without income, without health coverage, and unable to secure your children\u2019s future. The people who depend on you deserve to know they\u2019ll be taken care of, no matter what happens.`,
        ENT: `If nothing changes...\n\nYour business depends on your personal involvement. If you were unable to work for even a few months, your business could collapse\u2014taking your income, your employees\u2019 jobs, and years of hard work with it. Your business deserves a future that doesn\u2019t depend on a single person.`,
        YPR: `If nothing changes...\n\nYou're at the beginning of your financial journey, which is the best time to build strong foundations. Without an emergency fund or personal insurance, a single unexpected event\u2014a health scare, accident, or job loss\u2014could derail your plans and set you back years.`,
        RET: `If nothing changes...\n\nWithout a dedicated retirement savings plan and long-term care strategy, your later years could be defined by financial pressure rather than freedom. Time is your most powerful asset\u2014the sooner you act, the more options you\u2019ll have.`,
        HOM: `If nothing changes...\n\nA fire, burglary, or liability incident could result in significant financial loss. Your home is more than a building\u2014it\u2019s your family\u2019s foundation. Without adequate protection, everything you\u2019ve worked for could be at risk. Your home deserves to be protected.`,
        MOT: `If nothing changes...\n\nAn accident, theft, or third-party claim could leave you with substantial out-of-pocket costs. Being on the road shouldn\u2019t mean being at risk. Without comprehensive motor cover, a single incident could disrupt your mobility and your finances.`
      };
      const ifNothingChanges = ifNothingChangeTexts[prefix] || null;
      if (ifNothingChanges) fullM1 += `\n\n${ifNothingChanges}`;
      fullReportMessages.push({ type: 'report_link', text: fullM1, _delay: 3000 });

      // Full Report M3: Resilience Forecast + Report Link
      let fullM2 = '';
      if (forecast && forecast.text) {
        const fLines = forecast.text.split('\n');
        const fActions = fLines.filter(l => l.startsWith('\u2713'));
        fullM2 += `Resilience Forecast\u2122\n\nHere\u2019s how your resilience could improve\n${fActions.slice(0, 3).join('\n')}`;
      }
      fullM2 += `\n\n\uD83D\uDCC4 View My Report: ${reportUrl}`;
      fullReportMessages.push({ type: 'report_link', text: fullM2, _delay: 3000 });

      // Full Report M3: Risk Reduction vs Risk Transfer
      const buildRiskManagementPlan = (cats, answers, prefix) => {
        const ops = [];
        const ins = [];
        const scoringConfig = require('../config/scoring/index');
        const prefixConfig = scoringConfig[prefix];
        if (prefixConfig && prefixConfig.improvements) {
          for (const [qId, qImprovements] of Object.entries(prefixConfig.improvements)) {
            const answer = answers[qId];
            if (!answer || !qImprovements[answer]) continue;
            const action = qImprovements[answer].action;
            const isInsurance = /insurance|cover|indemnity|policy|protection\s+for/i.test(action);
            const verb = action.match(/^(Conduct|Develop|Establish|Install|Implement|Train|Review|Appoint|Designate|Schedule|Strengthen|Build|Create|Document|Set|Begin|Start)/i);
            const item = verb ? `${verb[1]} ${action.replace(/^(Conduct|Develop|Establish|Install|Implement|Train|Review|Appoint|Designate|Schedule|Strengthen|Build|Create|Document|Set|Begin|Start)\s+/i, '').charAt(0).toLowerCase() + action.replace(/^(Conduct|Develop|Establish|Install|Implement|Train|Review|Appoint|Designate|Schedule|Strengthen|Build|Create|Document|Set|Begin|Start)\s+/i, '').slice(1)}` : action;
            if (isInsurance) {
              ins.push('\u2713 ' + item);
            } else {
              ops.push('\u2713 ' + item);
            }
          }
        }
        let text = '\uD83D\uDEE1\uFE0F Your Risk Management Plan\n\n';
        if (ops.length > 0) {
          text += 'Risk Reduction \u2014 Operational Improvements\n(actions you can take to reduce the likelihood or impact of an incident)\n' + ops.slice(0, 3).join('\n') + '\n\n';
        }
        if (ins.length > 0) {
          text += 'Risk Transfer \u2014 Protection Solutions\n(insurance cover to protect against financial loss when incidents occur)\n' + ins.slice(0, 3).join('\n');
        }
        if (ops.length === 0 && ins.length === 0) return null;
        return text;
      };
      const riskMgmtPlan = buildRiskManagementPlan(scoredCats, answers, prefix);
      if (riskMgmtPlan) {
        fullReportMessages.push({ type: 'report_link', text: riskMgmtPlan, _delay: 3000 });
      }

      // Full Report M4: Advisor CTA
      fullReportMessages.push({
        type: 'advisor',
        text: `Would you like a Certified CoverScore Risk Advisor to conduct a Risk Review?\n\nThey\u2019ll help you:\n\u2713 Understand your specific risk profile\n\u2713 Prioritise the most impactful improvements\n\u2713 Distinguish operational changes from protection solutions\n\nA. Yes\nB. Not now`,
        _delay: 3000
      });

      // Store full report bundle for later delivery
      assessmentData._fullReportMessages = fullReportMessages;
      console.log(`   [Phase 3] Ending sequence built (${postMessages.length} total post-messages)`);
    }

    // Acknowledge webhook immediately so Evolution API doesn't timeout
    // (line 100 already sends 200 OK immediately; this is a safety net)
    if (!res.headersSent) res.sendStatus(200);

    // Phase 4: Send remaining messages with real data and typing indicator
    console.log(`   [Phase 4] Sending ${postMessages.length} post-messages...`);
    for (let i = 0; i < postMessages.length; i++) {
      const msg = postMessages[i];
      if (!msg.text) continue;
      msg.text = fillTemplate(msg.text);

      // Use per-message delay if set, otherwise fallback to 12s for first post-message
      const msgDelay = msg._delay != null ? msg._delay : (i === 0 && preMessages.length > 0 ? 12000 : undefined);

      const sendResult = await sendWhatsApp(phoneNumber, null, { _message: msg.text, delay: msgDelay });
      if (!sendResult.success) {
        console.error(`   ❌ Failed to send message ${i}: ${sendResult.error}. Saving state and aborting.`);
        await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
          [currentState, JSON.stringify(assessmentData), JSON.stringify(chatHistory), JSON.stringify(updatedCcieContext || ccieContext), lead.id]);
        return;
      }

      chatHistory.push({
        role: 'assistant',
        content: msg.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      if (msg.type === 'milestone' || msg.type === 'insight' || msg.type === 'trust') {
        publishEvent(CCIE_EVENTS.MICRO_INSIGHT_DISPLAYED, ccieContext, {
          messageType: msg.type, text: msg.text.substring(0, 60)
        });
      }
    }

    // ===== If user requested full report, send the stored bundle =====
    if (updatedData && updatedData._showFullReport && assessmentData._fullReportMessages) {
      console.log(`   [Full Report] User requested full report — sending bundle...`);
      const fullBundle = assessmentData._fullReportMessages;
      delete assessmentData._fullReportMessages;
      delete assessmentData._scored;
      for (let fi = 0; fi < fullBundle.length; fi++) {
        const fm = fullBundle[fi];
        if (!fm.text) continue;
        const fDelay = fm._delay || 3000;
        const fSendResult = await sendWhatsApp(phoneNumber, null, { _message: fm.text, delay: fDelay });
        if (!fSendResult.success) {
          console.error(`   ❌ Failed to send full report message ${fi}: ${fSendResult.error}.`);
          break;
        }
        chatHistory.push({
          role: 'assistant',
          content: fm.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      // After full report bundle (which includes advisor CTA), set state for advisor reply
      assessmentData._scored = true;
      // Don't set isFinished yet — user still needs to respond to advisor CTA
      if (isFinished) isFinished = false;
    }

    // ===== Risk Intelligence Engine (RIE) — run after scoring completes =====
    if (assessmentData._scored && prefix) {
      try {
        const rieRiskCats = assessmentData.risk_categories || {};
        const rieCats = Object.fromEntries(Object.entries(rieRiskCats).filter(([, v]) => v !== null && v !== undefined));
        const rieResult = runRiskIntelligence(
          prefix,
          assessmentData.answers || {},
          rieCats,
          {
            score: assessmentData.score,
            advisorRequested: assessmentData.advisor_requested || false,
            businessEntity: lead?.entity_type === 'business',
            hasRevenue: !!(lead?.email || assessmentData.email),
            hasEmployees: !!(assessmentData.answers?.SME_013 || assessmentData.answers?.MFG_013)
          }
        );
        assessmentData.rie = rieResult;
        console.log(`   [RIE] Opportunity Score: ${rieResult.opportunityScore}, Products: ${rieResult.recommendedProducts.length}, Follow-up: ${rieResult.followUp.nextAction}`);

        // NOTE: Opportunity is NOT created here automatically.
        // It is created only when the user explicitly requests an advisor (is_qualified = true)
        // in the isFinished block below, to keep the sales pipeline clean.
      } catch (rieErr) {
        console.error(`   [RIE] Error: ${rieErr.message}`);
      }
    }

    const finalState = (isFinished || nextState === 'finished') ? nextState
      : (assessmentData._scored ? (assessmentData._fullReportMessages ? 'full_report_offer' : 'awaiting_consultation') : nextState);
    console.log(`   [State Save] Saving lead state (finalState: ${finalState})...`);
    const oppScore = assessmentData.rie?.opportunityScore;
    if (oppScore != null) {
      await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ?, ccie_context = ?, sales_score = ? WHERE id = ?',
        [finalState, JSON.stringify(assessmentData), JSON.stringify(chatHistory), JSON.stringify(updatedCcieContext || ccieContext), oppScore, lead.id]);
    } else {
      await run('UPDATE leads SET wa_state = ?, assessment_data = ?, chat_history = ?, ccie_context = ? WHERE id = ?',
        [finalState, JSON.stringify(assessmentData), JSON.stringify(chatHistory), JSON.stringify(updatedCcieContext || ccieContext), lead.id]);
    }

    if (assessmentData.name || assessmentData.email || assessmentData.business_name) {
      await run('UPDATE leads SET name = COALESCE(?, name), email = COALESCE(?, email), business_name = COALESCE(?, business_name) WHERE id = ?',
        [assessmentData.name || null, assessmentData.email || null, assessmentData.business_name || null, lead.id]);
    }

    if (isFinished) {
      console.log(`   [Qualifier] Assessment finished — running lead qualifier...`);
      publishEvent(CCIE_EVENTS.ASSESSMENT_COMPLETED, ccieContext, {
        leadId: lead.id, score: assessmentData.score, isQualified: !!assessmentData.is_qualified
      });

      console.log(`   🧠 Running Lead Qualifier AI for Lead ${lead.id}...`);
      let assessData = {};
      try {
        if (lead.assessment_id) {
          const rec = await get('SELECT answers FROM assessments WHERE id = ?', [lead.assessment_id]);
          if (rec && rec.answers) assessData = JSON.parse(rec.answers);
        }
      } catch (e) { }

      const qualifierOutput = await getLeadQualifier([], assessData);
      console.log(`   ✅ Qualifier output: ${JSON.stringify(qualifierOutput)}`);

      await run(`
        UPDATE leads SET status = ?, pipeline_stage = ?, is_qualified = ?,
          consultation_preference = ?, primary_concern = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        qualifierOutput.lead_status || 'Qualified',
        (qualifierOutput.lead_status || '').toLowerCase().includes('hot') ? 4 : 3,
        assessmentData.is_qualified ? 1 : 0,
        assessmentData.consultation_preference || null,
        assessmentData.primary_concern || null,
        qualifierOutput.next_best_action + " - " + qualifierOutput.qualification_reasoning,
        lead.id
      ]);

      // Recompute lead_score now that is_qualified may have changed
      const lsAfterQual = computeLeadScore({
        email: assessmentData.email || lead.email,
        phone: lead.phone || phoneNumber,
        engagement_points: (lead.engagement_points || 0) + (assessmentData._scored ? 20 : 0),
        score: assessmentData.score || lead.score || 0,
        entity_type: assessmentData.entity_type || lead.entity_type || 'business',
        is_qualified: assessmentData.is_qualified ? 1 : 0
      });
      await run('UPDATE leads SET lead_score = ?, lead_priority = ? WHERE id = ?', [lsAfterQual.score, lsAfterQual.priority, lead.id]);

      if ((process.env.ADMIN_WHATSAPP_GROUP || process.env.ADMIN_PHONE) && ((qualifierOutput.lead_status || '').toLowerCase().includes('hot') || assessmentData.is_qualified)) {
        const briefDom = domainConfig[prefix] || defaultDomain;
        const notifMsg = buildAdvisorBrief(assessmentData, lead, phoneNumber, prefix, briefDom, qualifierOutput, process.env.APP_URL);
        if (process.env.ADMIN_WHATSAPP_GROUP) {
          await sendWhatsAppToGroup(process.env.ADMIN_WHATSAPP_GROUP, { _message: notifMsg });
        } else if (process.env.ADMIN_PHONE) {
          await sendWhatsApp(process.env.ADMIN_PHONE, null, { _message: notifMsg });
        }
        publishEvent(CCIE_EVENTS.ADVISOR_REQUESTED, ccieContext, { phone: process.env.ADMIN_PHONE, group: process.env.ADMIN_WHATSAPP_GROUP, leadId: lead.id });
      }

      if (!assessmentData.is_qualified) {
        await run(`UPDATE leads SET status = 'WhatsApp Engaged', pipeline_stage = 3, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [lead.id]);
      }

      // ===== Create Opportunity only when user explicitly requests advisor =====
      if (assessmentData.is_qualified) {
        try {
          const existingOpp = await get('SELECT id FROM opportunities WHERE lead_id = ?', [lead.id]);
          if (!existingOpp) {
            const rie = assessmentData.rie || {};
            const oppScore = rie.opportunityScore || assessmentData.score || 50;
            const scoreBand = oppScore >= 70 ? 'high' : oppScore >= 40 ? 'medium' : 'low';
            const priority = oppScore >= 70 ? 'High' : oppScore >= 50 ? 'Standard' : 'Low';
            const cats = assessmentData.risk_categories || {};
            const riskDna = Object.entries(cats).map(([k, v]) => ({ name: k, score: v }));
            const topPriorities = (rie.recommendedProducts || []).slice(0, 3).map(p => ({
              name: p.product,
              priority: p.priority,
              gap_level: p.priority === 'high' ? 'High' : p.priority === 'medium' ? 'Medium' : 'Low',
              reason: p.reason || ''
            }));

            await run(`
              INSERT INTO opportunities (lead_id, advisor_id, score, score_band, risk_dna, top_priorities, opportunity_priority, contact_preference, stage, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [
              lead.id,
              lead.advisor_id || null,
              oppScore,
              scoreBand,
              JSON.stringify(riskDna),
              JSON.stringify(topPriorities),
              priority,
              assessmentData.consultation_preference || null
            ]);
            console.log(`   [Opportunity] Created for lead ${lead.id} (advisor requested) — Score: ${oppScore}, Priority: ${priority}`);

            if (lead.advisor_id) {
              notify(lead.advisor_id, 'new_opportunity', 'New Opportunity Created', `New opportunity for ${lead.name || 'a lead'} (Score: ${oppScore})`, `/advisor/opportunities`);
            }
            if (priority === 'High' || priority === 'Urgent') {
              notifyRole('admin', 'high_priority_opportunity', '🚀 High-Priority Opportunity', `${lead.name || 'A lead'} scored ${oppScore} — high-value opportunity`, `/admin/leads/${lead.id}`);
            }
          }
        } catch (oppErr) {
          console.error(`   [Opportunity] Error creating for lead ${lead.id}: ${oppErr.message}`);
        }
      }

      publishEvent(CCIE_EVENTS.CONVERSATION_COMPLETED, ccieContext, { leadId: lead.id });
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message || error);
    console.error('   Stack:', error.stack || '(no stack)');
    try {
      const errJid = req.body?.data?.key?.remoteJid;
      if (errJid) {
        const errPhone = errJid.split('@')[0];
        await sendWhatsApp(errPhone, null, { _message: "I ran into an issue processing your response. No worries — your progress is saved. Please type START ASSESSMENT to continue." });
      }
    } catch (notifErr) {
      console.error('Failed to send error notification:', notifErr);
    }
  }

  if (!res.headersSent) {
    res.sendStatus(200);
  }
});

module.exports = router;
