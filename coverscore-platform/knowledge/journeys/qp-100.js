// Journey definitions for QP-100 (Health Protection)
// Each journey is a structured post-assessment follow-up path

const journeys = [
  {
    code: 'COVERSCORE_REPORT',
    name: 'Risk Intelligence Report Delivery',
    description: 'Delivers the full Risk Intelligence Report and executive summary',
    trigger_rules: [
      { type: 'always', priority: 0 }
    ],
    priority: 0,
    pack_id: 'QP-100',
    steps: [
      {
        sequence: 0,
        step_type: 'message',
        title: 'Assessment Complete',
        content: {
          text: 'Thank you for completing the Health Protection Assessment. Your personalized Risk Intelligence Report is ready.'
        },
        delay_hours: 0
      },
      {
        sequence: 1,
        step_type: 'message',
        title: 'CoverScore Summary',
        content: {
          text: 'Your CoverScore is {{score}}/100 ({{riskLevel}}). Your protection gap is {{protectionGap}}%.',
          template: 'score_summary'
        },
        delay_hours: 0
      },
      {
        sequence: 2,
        step_type: 'message',
        title: 'Report Link',
        content: {
          text: 'View your full report here: {{reportUrl}}',
          requires_generation: true
        },
        delay_hours: 0,
        branch_rules: [
          { if_response: 'VIEWED', next_sequence: 3, default: true },
          { if_response: 'REMIND_LATER', next_sequence: 2, delay_hours: 24 }
        ]
      },
      {
        sequence: 3,
        step_type: 'question',
        title: 'Report Feedback',
        content: {
          text: 'Was this report helpful? (Yes/No)',
          options: [
            { value: 'Yes', label: 'Yes, very helpful' },
            { value: 'No', label: 'No, needs improvement' }
          ]
        },
        delay_hours: 0
      }
    ]
  },
  {
    code: 'COVERAGE_GAP',
    name: 'Close Your Coverage Gaps',
    description: 'Guides the customer through addressing identified protection gaps',
    trigger_rules: [
      { type: 'condition', field: 'protectionGap', operator: '>=', value: 40, priority: 1 }
    ],
    priority: 1,
    pack_id: 'QP-100',
    steps: [
      {
        sequence: 0,
        step_type: 'message',
        title: 'Gaps Identified',
        content: {
          text: 'Our assessment identified some gaps in your coverage. Let us help you address them step by step.'
        },
        delay_hours: 0
      },
      {
        sequence: 1,
        step_type: 'education',
        title: 'Understanding Protection Gaps',
        content: {
          text: 'A protection gap means there are areas where you may not have adequate coverage. Addressing these gaps reduces your financial risk.',
          article_id: 'EDU-001'
        },
        delay_hours: 0
      },
      {
        sequence: 2,
        step_type: 'product',
        title: 'Recommended Products',
        content: {
          text: 'Based on your assessment, these products may help close your gaps:',
          products: [] // populated dynamically from scoring results
        },
        delay_hours: 24
      },
      {
        sequence: 3,
        step_type: 'advisor_referral',
        title: 'Speak to an Advisor',
        content: {
          text: 'Would you like to speak with a licensed advisor about your coverage options?',
          options: [
            { value: 'YES', label: 'Yes, call me' },
            { value: 'NO', label: 'No, not now' }
          ]
        },
        delay_hours: 48
      },
      {
        sequence: 4,
        step_type: 'check_in',
        title: 'Follow-up Check',
        content: {
          text: 'It has been 2 weeks since your assessment. Have you taken any steps to address your coverage gaps?',
          options: [
            { value: 'YES', label: 'Yes, I have' },
            { value: 'NO', label: 'Not yet' },
            { value: 'HELP', label: 'I need help' }
          ]
        },
        delay_hours: 336
      }
    ]
  },
  {
    code: 'URGENT_ADVISORY',
    name: 'Urgent Advisory Intervention',
    description: 'High-risk customers get expedited advisory outreach',
    trigger_rules: [
      { type: 'condition', field: 'riskLevel', operator: 'in', value: 'Critical,Vulnerable', priority: 0 }
    ],
    priority: 0,
    pack_id: 'QP-100',
    steps: [
      {
        sequence: 0,
        step_type: 'message',
        title: 'Urgent Attention Needed',
        content: {
          text: 'Your assessment indicates a {{riskLevel}} risk level. We strongly recommend speaking with an advisor as soon as possible.',
          urgent: true
        },
        delay_hours: 0
      },
      {
        sequence: 1,
        step_type: 'advisor_referral',
        title: 'Immediate Advisor Connect',
        content: {
          text: 'A senior advisor will contact you within 24 hours. Alternatively, click here to schedule a call now.',
          priority: 'high',
          auto_assign: true
        },
        delay_hours: 0
      },
      {
        sequence: 2,
        step_type: 'message',
        title: 'What to Expect',
        content: {
          text: 'Your advisor will review your assessment, discuss your biggest risks, and recommend specific steps to improve your protection.'
        },
        delay_hours: 24
      },
      {
        sequence: 3,
        step_type: 'check_in',
        title: 'Advisory Follow-up',
        content: {
          text: 'Did our advisor contact you?',
          options: [
            { value: 'YES', label: 'Yes' },
            { value: 'NO', label: 'Not yet' },
            { value: 'DECLINE', label: 'I declined' }
          ]
        },
        delay_hours: 72
      }
    ]
  },
  {
    code: 'WELLNESS_IMPROVEMENT',
    name: 'Wellness & Prevention Program',
    description: 'Encourages regular check-ups and preventive care',
    trigger_rules: [
      { type: 'condition', field: 'question', questionId: 'QP-100-015', value: 'Rarely/Only when sick', priority: 2 }
    ],
    priority: 2,
    pack_id: 'QP-100',
    steps: [
      {
        sequence: 0,
        step_type: 'message',
        title: 'Preventive Care Matters',
        content: {
          text: 'Regular check-ups can detect health issues early. We recommend scheduling an annual preventive health screening.'
        },
        delay_hours: 0
      },
      {
        sequence: 1,
        step_type: 'education',
        title: 'Why Check-ups Matter',
        content: {
          text: 'Early detection through routine check-ups can improve treatment outcomes by up to 40%. Most conditions are more manageable when caught early.',
          article_id: 'EDU-002'
        },
        delay_hours: 0
      },
      {
        sequence: 2,
        step_type: 'message',
        title: 'Wellness Plan Options',
        content: {
          text: 'Many health plans include free annual check-ups. Review your policy or ask us about plans with wellness benefits.',
          products: []
        },
        delay_hours: 24
      },
      {
        sequence: 3,
        step_type: 'check_in',
        title: 'Check-up Reminder',
        content: {
          text: 'Have you scheduled your check-up yet? Regular screening is one of the best investments in your health.'
        },
        delay_hours: 168
      }
    ]
  },
  {
    code: 'INCOME_PROTECTION',
    name: 'Income Protection Pathway',
    description: 'Helps customers without illness resilience explore income protection',
    trigger_rules: [
      { type: 'condition', field: 'question', questionId: 'QP-100-017', value: 'No', priority: 2 }
    ],
    priority: 2,
    pack_id: 'QP-100',
    steps: [
      {
        sequence: 0,
        step_type: 'message',
        title: 'Protecting Your Income',
        content: {
          text: 'Your assessment shows that an extended illness could significantly impact your household finances. Income protection insurance can help.'
        },
        delay_hours: 0
      },
      {
        sequence: 1,
        step_type: 'education',
        title: 'How Income Protection Works',
        content: {
          text: 'Income protection replaces a portion of your income if you cannot work due to illness or injury. It provides peace of mind and financial stability.',
          article_id: 'EDU-003'
        },
        delay_hours: 0
      },
      {
        sequence: 2,
        step_type: 'product',
        title: 'Income Protection Options',
        content: {
          text: 'Here are income protection plans that may suit your needs:',
          products: []
        },
        delay_hours: 24
      },
      {
        sequence: 3,
        step_type: 'advisor_referral',
        title: 'Discuss Income Protection',
        content: {
          text: 'Would you like an advisor to explain income protection options?',
          options: [
            { value: 'YES', label: 'Yes' },
            { value: 'NO', label: 'Not now' }
          ]
        },
        delay_hours: 48
      }
    ]
  },
  {
    code: 'CHRONIC_CONDITION',
    name: 'Chronic Condition Management',
    description: 'Support for customers with diagnosed chronic conditions',
    trigger_rules: [
      { type: 'condition', field: 'question', questionId: 'QP-100-014', operator: 'in', value: 'Hypertension,Diabetes,Asthma', priority: 2 }
    ],
    priority: 2,
    pack_id: 'QP-100',
    steps: [
      {
        sequence: 0,
        step_type: 'message',
        title: 'Managing Your Health',
        content: {
          text: 'You mentioned having a chronic condition. The right health plan can help you manage it effectively.'
        },
        delay_hours: 0
      },
      {
        sequence: 1,
        step_type: 'education',
        title: 'Chronic Care Management',
        content: {
          text: 'Many health plans now offer chronic disease management programs including regular monitoring, medication coverage, and specialist access.',
          article_id: 'EDU-004'
        },
        delay_hours: 0
      },
      {
        sequence: 2,
        step_type: 'product',
        title: 'Plans with Chronic Care',
        content: {
          text: 'These plans include chronic condition management benefits:',
          products: []
        },
        delay_hours: 24
      },
      {
        sequence: 3,
        step_type: 'check_in',
        title: 'Health Check-in',
        content: {
          text: 'How are you managing your condition? Would you like resources on chronic care management?',
          options: [
            { value: 'YES', label: 'Yes, send resources' },
            { value: 'NO', label: 'I am managing fine' }
          ]
        },
        delay_hours: 336
      }
    ]
  }
];

module.exports = { journeys };
