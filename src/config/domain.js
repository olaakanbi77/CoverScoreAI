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
