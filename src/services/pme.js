/**
 * CoverScore Protection Mapping Engine™ (PME)
 * Master knowledge base of Risk Scenarios
 */

const riskLibrary = [
  // ---------------------------------------------------------
  // PERSONAL RISKS
  // ---------------------------------------------------------
  {
    risk_id: 'PR_01',
    risk_category: 'Life Risk',
    exposure: 'Income Earner',
    consequences: [
      'Loss of family income',
      'Children\'s education disruption',
      'Debt default',
      'Reduced standard of living'
    ],
    controls: [
      'Emergency fund',
      'Savings',
      'Investment portfolio'
    ],
    insurance_solutions: [
      'Term Life',
      'Whole Life',
      'Education Protection',
      'Mortgage Protection'
    ],
    non_insurance_solutions: [
      'Trust fund setup',
      'Estate planning'
    ],
    advisor_questions: [
      'How many people depend on your income?',
      'How long would your family cope without your income?',
      'Do you currently have life protection?'
    ],
    priority: 'Critical'
  },
  {
    risk_id: 'PR_02',
    risk_category: 'Health Risk',
    exposure: 'Personal Health',
    consequences: [
      'Out of pocket medical expenses',
      'Inability to work',
      'Depleted savings'
    ],
    controls: [
      'Healthy lifestyle',
      'Regular medical checkups'
    ],
    insurance_solutions: [
      'Comprehensive Health Insurance',
      'Critical Illness Cover'
    ],
    non_insurance_solutions: [
      'Medical emergency fund'
    ],
    advisor_questions: [
      'How would you fund a major medical emergency?',
      'Does your employer provide comprehensive health cover?'
    ],
    priority: 'Critical'
  },
  {
    risk_id: 'PR_03',
    risk_category: 'Property Risk',
    exposure: 'Personal Residence',
    consequences: [
      'Loss of home',
      'Replacement cost of belongings',
      'Temporary accommodation costs'
    ],
    controls: [
      'Fire alarms',
      'Security systems',
      'Gated estate security'
    ],
    insurance_solutions: [
      'Homeowners Insurance',
      'Renters Insurance',
      'Fire & Special Perils'
    ],
    non_insurance_solutions: [
      'Fire extinguishers',
      'Strong physical security'
    ],
    advisor_questions: [
      'If your home was severely damaged, how would you finance repairs?',
      'Do you have an inventory of your high-value belongings?'
    ],
    priority: 'High'
  },
  {
    risk_id: 'PR_04',
    risk_category: 'Vehicle Risk',
    exposure: 'Personal Vehicle',
    consequences: [
      'Vehicle replacement cost',
      'Third-party liability claims',
      'Loss of mobility'
    ],
    controls: [
      'Vehicle tracker',
      'Safe driving habits',
      'Secure parking'
    ],
    insurance_solutions: [
      'Comprehensive Auto Insurance',
      'Third-Party Auto Insurance'
    ],
    non_insurance_solutions: [
      'Public transport budget'
    ],
    advisor_questions: [
      'Could you comfortably replace your vehicle out-of-pocket if it was totaled?',
      'Are you protected against liability if you injure someone in an accident?'
    ],
    priority: 'High'
  },

  // ---------------------------------------------------------
  // BUSINESS & CORPORATE RISKS
  // ---------------------------------------------------------
  {
    risk_id: 'BR_01',
    risk_category: 'Property Fire Risk',
    exposure: 'Buildings, Equipment, Inventory',
    consequences: [
      'Property damage',
      'Business interruption',
      'Revenue loss'
    ],
    controls: [
      'Fire extinguishers',
      'Fire alarms',
      'Fire drills',
      'Sprinkler systems'
    ],
    insurance_solutions: [
      'Fire Insurance',
      'Industrial All Risk',
      'Business Interruption'
    ],
    non_insurance_solutions: [
      'Off-site inventory storage',
      'Fire-resistant construction'
    ],
    advisor_questions: [
      'If a fire destroyed your primary facility, how long could you survive without revenue?',
      'Are your building valuations up to date for replacement cost?'
    ],
    priority: 'Critical'
  },
  {
    risk_id: 'BR_02',
    risk_category: 'Cyber Risk',
    exposure: 'Data, Systems, Customer Records',
    consequences: [
      'Data breach',
      'Financial loss',
      'Regulatory penalties',
      'Reputation damage'
    ],
    controls: [
      'MFA (Multi-Factor Authentication)',
      'Data Backups',
      'Cyber awareness training',
      'Firewalls'
    ],
    insurance_solutions: [
      'Cyber Liability Insurance'
    ],
    non_insurance_solutions: [
      'Incident response plan',
      'Third-party security audits'
    ],
    advisor_questions: [
      'What would happen to your business if your core systems were locked by ransomware?',
      'How are you protecting sensitive customer data?'
    ],
    priority: 'High'
  },
  {
    risk_id: 'BR_03',
    risk_category: 'Employee Welfare Risk',
    exposure: 'Workforce',
    consequences: [
      'Employee injury or death',
      'Low morale',
      'Legal liability',
      'Loss of key personnel'
    ],
    controls: [
      'Safety training',
      'HSE compliance',
      'Ergonomic workspaces'
    ],
    insurance_solutions: [
      'Group Life Insurance (Statutory)',
      'Workers Compensation / ECA',
      'Group Personal Accident',
      'Keyman Insurance'
    ],
    non_insurance_solutions: [
      'Robust safety culture',
      'Employee assistance programs'
    ],
    advisor_questions: [
      'What provisions exist for an employee\'s family in the event of death in service?',
      'Are you compliant with statutory employee insurance requirements?'
    ],
    priority: 'Critical'
  },
  {
    risk_id: 'BR_04',
    risk_category: 'Public Liability Risk',
    exposure: 'Premises, Operations',
    consequences: [
      'Third-party injury claims',
      'Property damage claims',
      'Legal defense costs'
    ],
    controls: [
      'Strict access control',
      'Regular maintenance',
      'Warning signs'
    ],
    insurance_solutions: [
      'Public Liability',
      'Occupiers Liability (Compulsory)'
    ],
    non_insurance_solutions: [
      'Liability waivers',
      'Risk transfer via contracts'
    ],
    advisor_questions: [
      'If a visitor is severely injured on your premises, how would you fund the legal and compensation costs?',
      'Do you have adequate liability protection for your field operations?'
    ],
    priority: 'High'
  },
  {
    risk_id: 'BR_05',
    risk_category: 'Professional Liability Risk',
    exposure: 'Services rendered, Advice given',
    consequences: [
      'Client lawsuits',
      'Financial damages',
      'Loss of professional license'
    ],
    controls: [
      'Quality assurance processes',
      'Peer reviews',
      'Detailed documentation'
    ],
    insurance_solutions: [
      'Professional Indemnity',
      'Medical Malpractice',
      'Errors & Omissions (E&O)'
    ],
    non_insurance_solutions: [
      'Strict SLA contracts',
      'Continuous professional development'
    ],
    advisor_questions: [
      'Could your business survive a multi-million Naira lawsuit from a dissatisfied client?',
      'How do you protect your firm against errors made by junior staff?'
    ],
    priority: 'High'
  },
  {
    risk_id: 'BR_06',
    risk_category: 'Transit & Fleet Risk',
    exposure: 'Vehicles, Cargo in transit',
    consequences: [
      'Vehicle loss/damage',
      'Cargo theft or damage',
      'Third-party accidents'
    ],
    controls: [
      'Fleet tracking',
      'Driver training',
      'Route planning'
    ],
    insurance_solutions: [
      'Motor Fleet (Comprehensive)',
      'Goods-in-Transit (GIT)',
      'Marine Cargo'
    ],
    non_insurance_solutions: [
      'Outsourcing logistics',
      'Escort services for high-value goods'
    ],
    advisor_questions: [
      'What is the maximum value of goods you transport at any one time?',
      'How are you protected against accidents involving your company vehicles?'
    ],
    priority: 'Medium'
  }
];

const getRiskByCategory = (category) => {
  return riskLibrary.find(r => r.risk_category.toLowerCase() === category.toLowerCase());
};

const getAllRisks = () => {
  return riskLibrary;
};

module.exports = {
  riskLibrary,
  getRiskByCategory,
  getAllRisks
};
