const domainConfig = {
  HLT: {
    assessmentTitle: 'Health Protection',
    domain: 'health',
    resilienceTerm: 'Health Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall health protection',
    improvementTerm: 'health resilience',
    followUpMsg: "I'll also share practical health protection tips and strategies that match your assessment.",
    pillarMappings: {
      'Healthcare Access': 'Healthcare Access',
      'Preventive Health': 'Preventive Health',
      'Medical Risk Profile': 'Medical Risk Profile',
      'Financial Health Protection': 'Financial Health Protection',
      'Household Resilience': 'Household Resilience'
    },
    resilienceLabels: {
      'low': 'Strong Resilience',
      'moderate': 'Building Resilience',
      'high': 'Needs Attention',
      'critical': 'Priority Improvement'
    },
    insightTexts: {
      perPillar: {
        'Healthcare Access': {
          base: "Your assessment suggests that the most significant gap in your overall protection is your access to healthcare coverage.",
          answerChecks: [
            { q: 'HLT_012', values: ['None'], append: "Without active health insurance, a serious medical event could result in significant out-of-pocket costs that may be difficult to manage." },
            { q: 'HLT_012', values: ['Government Health Scheme'], append: "While government schemes provide a foundation, the coverage limits may not extend to major medical procedures or specialist care." },
            { q: 'HLT_012', values: ['Employer HMO'], append: "Your employer HMO is a good starting point, but its coverage limits may not be sufficient for serious or chronic conditions that require extended care." }
          ],
          suffix: "Exploring options to strengthen your health insurance is the most practical step toward improving your overall protection."
        },
        'Preventive Health': {
          base: "Your assessment shows that the biggest opportunity to strengthen your overall protection isn't about what you have\u2014it's about what you do.",
          answerChecks: [
            { q: 'HLT_015', values: ['Rarely/Only when sick'], append: "By only seeking medical attention when you're already unwell, you miss the chance to detect potential health issues early, when they are most treatable." }
          ],
          suffix: "Making preventive health a regular habit\u2014starting with an annual check-up\u2014is a simple but powerful step toward long-term wellbeing."
        },
        'Medical Risk Profile': {
          base: "Your assessment highlights that your medical history and age profile are important factors in your overall risk picture.",
          answerChecks: [
            { q: 'HLT_014', condition: (v) => v && v !== 'None', append: (v) => `Managing ${v} requires consistent medical attention and appropriate insurance coverage.` },
            { q: 'HLT_009', values: ['56+', '46 - 55'], append: "As you get older, health risks naturally increase, making comprehensive coverage more important." }
          ],
          suffix: "Ensuring your health plan is designed to address your specific circumstances is the most impactful step you can take."
        },
        'Financial Health Protection': {
          base: "Your assessment suggests that your greatest financial risk isn't access to care\u2014it's the financial impact that a serious illness could have on you and your family.",
          answerChecks: [
            { q: 'HLT_013', values: ["I don't know", 'Loan'], append: "Without dedicated savings for medical emergencies, a major health event could create significant debt." },
            { q: 'HLT_016', values: ['No', 'Not sure'], append: "Your current health cover may not be sufficient for major procedures such as surgery." },
            { q: 'HLT_017', values: ['No'], append: "A serious illness could put financial pressure on your household." }
          ],
          suffix: "Strengthening your financial health protection is the most impactful step you can take."
        },
        'Household Resilience': {
          base: "Your assessment shows that your household's overall resilience is an area to strengthen.",
          answerChecks: [
            { q: 'HLT_010', values: ['3', '4+'], append: "With multiple dependants relying on you, any health-related income disruption affects more than just yourself." },
            { q: 'HLT_008', values: ['Part-time / Freelance', 'Student'], append: "Your current employment situation means there is less of a financial buffer if a health emergency arises." }
          ],
          suffix: "Building a stronger household safety net through appropriate coverage is your most practical next step."
        }
      },
      catchAll: "Your assessment provides a clear picture of your current protection profile. The areas highlighted in your pillar scores show where focusing your attention would have the greatest impact."
    }
  },
  RET: {
    assessmentTitle: 'Retirement Readiness',
    domain: 'retirement',
    resilienceTerm: 'Retirement Readiness',
    displayLabel: 'Readiness',
    closingTerm: 'overall retirement readiness',
    improvementTerm: 'retirement readiness',
    followUpMsg: "I'll also share practical retirement planning insights and strategies that match your assessment.",
    pillarMappings: {
      'retirement_readiness': 'Retirement Readiness',
      'retirement_savings': 'Retirement Savings',
      'protection': 'Protection & Insurance',
      'legacy_planning': 'Legacy Planning'
    },
    resilienceLabels: {
      'low': 'Strong Readiness',
      'moderate': 'Building Readiness',
      'high': 'Needs Attention',
      'critical': 'Priority Improvement'
    },
    insightTexts: {
      perPillar: {
        'Retirement Readiness': {
          base: "You're approaching the stage of life where retirement planning becomes increasingly important, yet your assessment suggests you may still be relying primarily on future income rather than dedicated retirement assets.",
          answerChecks: [
            { q: 'RET_009', values: ['46 - 55', '56+'], append: "Delaying retirement planning further could make it significantly more difficult to achieve your desired lifestyle after retirement." },
            { q: 'RET_012', values: ['No'], append: "Without a dedicated pension or retirement savings account, you may have limited options to build the retirement nest egg you need." },
            { q: 'RET_015', values: ['No, not yet', 'Partially - I have some documentation'], append: "Your retirement assets and estate plans may not be structured to protect your loved ones." }
          ],
          suffix: "Starting a structured retirement savings plan is the most impactful step you can take toward securing your financial future."
        },
        'Retirement Savings': {
          base: "Your assessment shows that your greatest retirement risk is not when you plan to retire\u2014it's whether you'll have sufficient financial resources to maintain your lifestyle throughout retirement. Building dedicated retirement savings that are separate from your daily income is essential for long-term financial independence."
        },
        'Protection': {
          base: "Your assessment suggests that your retirement could be disrupted by unexpected healthcare or long-term care costs.",
          answerChecks: [
            { q: 'RET_013', values: ['Very concerned'], append: "You're right to be concerned\u2014medical costs are one of the biggest threats to retirement savings." },
            { q: 'RET_014', values: ['No'], append: "Without a long-term care plan, a health event could quickly deplete your retirement savings." }
          ],
          suffix: "Reviewing your protection options for retirement is a practical step toward safeguarding your savings."
        },
        'Legacy Planning': {
          base: "Your assessment shows that your estate and legacy planning is an area to strengthen.",
          answerChecks: [
            { q: 'RET_015', values: ['No, not yet'], append: "Without clear beneficiary nominations or asset distribution plans, your retirement assets may not pass to your loved ones as you intend." }
          ],
          suffix: "Documenting your estate plan and reviewing beneficiary designations are simple steps that provide peace of mind."
        }
      },
      catchAll: "Your assessment shows that your greatest retirement risk is not when you plan to retire\u2014it's whether you'll have sufficient financial resources and protection to maintain your lifestyle throughout retirement.",
      suffix: "\n\nDelaying retirement planning further could make it significantly more difficult to achieve your desired lifestyle after retirement."
    }
  },
  INC: {
    assessmentTitle: 'Income Protection',
    domain: 'income',
    resilienceTerm: 'Income Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall income protection',
    improvementTerm: 'income resilience',
    followUpMsg: "I'll also share practical income protection tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  YPR: {
    assessmentTitle: 'Young Professional',
    domain: 'young professional',
    resilienceTerm: 'Financial Foundation',
    displayLabel: 'Foundation',
    closingTerm: 'overall financial foundation',
    improvementTerm: 'financial foundation',
    followUpMsg: "I'll also share practical financial planning tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  FAM: {
    assessmentTitle: 'Family Protection',
    domain: 'family',
    resilienceTerm: 'Family Security',
    displayLabel: 'Security',
    closingTerm: 'overall family protection',
    improvementTerm: 'family security',
    followUpMsg: "I'll also share practical family protection tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  ENT: {
    assessmentTitle: 'Business Protection',
    domain: 'business',
    resilienceTerm: 'Business Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall business protection',
    improvementTerm: 'business resilience',
    followUpMsg: "I'll also share practical business protection tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  HOM: {
    assessmentTitle: 'Home Protection',
    domain: 'home',
    resilienceTerm: 'Home Protection',
    displayLabel: 'Protection',
    closingTerm: 'overall home protection',
    improvementTerm: 'home protection',
    followUpMsg: "I'll also share practical home protection tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  MOT: {
    assessmentTitle: 'Motor Protection',
    domain: 'motor',
    resilienceTerm: 'Motor Protection',
    displayLabel: 'Protection',
    closingTerm: 'overall motor protection',
    improvementTerm: 'motor protection',
    followUpMsg: "I'll also share practical motor protection tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  SME: {
    assessmentTitle: 'Business Risk Assessment',
    domain: 'business',
    resilienceTerm: 'Business Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall business resilience',
    improvementTerm: 'business resilience',
    followUpMsg: "I'll also share practical business risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  MFG: {
    assessmentTitle: 'Manufacturing Risk Assessment',
    domain: 'manufacturing',
    resilienceTerm: 'Operational Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall operational resilience',
    improvementTerm: 'operational resilience',
    followUpMsg: "I'll also share practical manufacturing risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  HOS: {
    assessmentTitle: 'Healthcare Risk Assessment',
    domain: 'healthcare',
    resilienceTerm: 'Healthcare Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall healthcare resilience',
    improvementTerm: 'healthcare resilience',
    followUpMsg: "I'll also share practical healthcare risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  SCH: {
    assessmentTitle: 'School Risk Assessment',
    domain: 'education',
    resilienceTerm: 'School Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall school resilience',
    improvementTerm: 'school resilience',
    followUpMsg: "I'll also share practical school risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  CHR: {
    assessmentTitle: 'Church Risk Assessment',
    domain: 'church',
    resilienceTerm: 'Church Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall church resilience',
    improvementTerm: 'church resilience',
    followUpMsg: "I'll also share practical church risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  CON: {
    assessmentTitle: 'Construction Risk Assessment',
    domain: 'construction',
    resilienceTerm: 'Construction Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall construction resilience',
    improvementTerm: 'construction resilience',
    followUpMsg: "I'll also share practical construction risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  },
  TRN: {
    assessmentTitle: 'Transport Risk Assessment',
    domain: 'transport',
    resilienceTerm: 'Transport Resilience',
    displayLabel: 'Resilience',
    closingTerm: 'overall transport resilience',
    improvementTerm: 'transport resilience',
    followUpMsg: "I'll also share practical transport risk management tips and strategies that match your assessment.",
    pillarMappings: {}
  }
};

const defaultDomain = {
  assessmentTitle: 'Risk Assessment',
  domain: 'general',
  resilienceTerm: 'Protection Profile',
  displayLabel: 'Protection',
  closingTerm: 'overall protection profile',
  improvementTerm: 'protection profile',
  followUpMsg: "I'll also share practical tips and strategies that match your assessment.",
  pillarMappings: {}
};

module.exports = { domainConfig, defaultDomain };
