const GAP_THRESHOLDS = [
  { max: 20, severity: 'critical', label: 'Very High Risk' },
  { max: 40, severity: 'high', label: 'High Risk' },
  { max: 60, severity: 'medium', label: 'Moderate Risk' },
  { max: 80, severity: 'low', label: 'Low Risk' },
  { max: 100, severity: 'none', label: 'Minimal Risk' },
];

function classifySeverity(score) {
  for (const t of GAP_THRESHOLDS) {
    if (score <= t.max) return { severity: t.severity, label: t.label };
  }
  return { severity: 'none', label: 'Minimal Risk' };
}

const PILLAR_DESCRIPTIONS = {
  // School
  studentSafety: 'Student safety preparedness including supervision, premises safety, and emergency procedures',
  propertyProtection: 'Protection of school buildings, equipment, and assets against damage or loss',
  businessContinuity: 'Ability to maintain operations during and after a disruption',
  transportSafety: 'Safety and insurance of student transport vehicles and journeys',
  regulatoryReadiness: 'Compliance with education and safety regulations',

  // Hospital
  patientSafety: 'Patient safety protocols and clinical risk management',
  clinicalLiability: 'Exposure to medical malpractice and professional liability claims',
  equipmentProtection: 'Protection of diagnostic and treatment equipment against breakdown',
  propertyAndAssets: 'Protection of hospital buildings, contents, and supplies',
  regulatoryCompliance: 'Compliance with health and safety regulations',

  // Manufacturing
  fireAndProperty: 'Fire safety and physical asset protection in production facilities',
  machineryAndEquipment: 'Protection of production machinery against breakdown',
  workforceSafety: 'Employee safety and workplace injury prevention',
  businessInterruption: 'Ability to maintain operations after a disruption',
  environmentalCompliance: 'Compliance with environmental and safety regulations',
  supplyChain: 'Resilience of raw material and inventory supply chains',

  // Church
  premisesSafety: 'Safety of worship premises for congregants and visitors',
  propertyAndAssets: 'Protection of church buildings, equipment, and valuables',
  crowdManagement: 'Safety during large gatherings and special events',
  financialStewardship: 'Protection of church funds and financial assets',
  communityEngagement: 'Risk management for outreach and community programs',

  // SME
  assetProtection: 'Protection of business assets, inventory, and equipment',
  legalLiability: 'Exposure to third-party liability claims',
  workforce: 'Employee safety and worker protection',
  operations: 'Operational continuity and supply chain resilience',
  cyberAndData: 'Protection of digital assets and customer data',

  // Personal — Family
  familyProtection: 'Financial protection for dependents in case of income loss',
  incomeProtection: 'Ability to maintain household income during illness or disability',
  healthSecurity: 'Access to quality healthcare without financial strain',
  educationFunding: 'Ability to fund children education goals',
  retirementReadiness: 'Preparedness for retirement income needs',
  emergencyResilience: 'Ability to handle unexpected financial emergencies',

  // Personal — Health
  healthAccess: 'Access to medical care when needed',
  treatmentAffordability: 'Ability to afford medical treatment without financial hardship',
  criticalIllness: 'Protection against the financial impact of serious illness',
  wellnessAndPrevention: 'Preventive health practices and wellness planning',

  // Personal — Income
  incomeStability: 'Stability and reliability of income sources',
  disabilityProtection: 'Protection against income loss due to disability',
  savingsAdequacy: 'Adequacy of savings for income gaps and emergencies',
  debtExposure: 'Exposure to debt obligations relative to income',

  // Personal — Young Professional
  financialFoundation: 'Strength of financial habits and emergency preparedness',
  healthAndProtection: 'Personal health and accident protection coverage',
  savingsAndInvesting: 'Savings discipline and investment planning',
  careerAndIncome: 'Career stability and income growth trajectory',

  // Personal — Entrepreneur
  businessPersonalSeparation: 'Separation of personal and business finances and risks',
  personalLiability: 'Personal exposure to business liabilities',
  incomeVolatility: 'Management of variable and unpredictable income',
  personalProtection: 'Personal insurance and health coverage adequacy',

  // Personal — Retirement
  retirementSavings: 'Adequacy of retirement savings relative to goals',
  incomeSustainability: 'Sustainability of retirement income against inflation',
  healthcareInRetirement: 'Healthcare cost preparedness in retirement',
  legacyAndEstate: 'Estate planning and wealth transfer preparedness',

  // General / cross-over
  cyberExposure: 'Exposure to cyber threats and data breaches',
  financialResilience: 'Overall financial ability to absorb shocks',
  fraudAwareness: 'Awareness and protection against fraud and scams',
};

function detectGaps(assessmentType, scoredPillars, answers) {
  const gaps = [];

  for (const [pillarKey, score] of Object.entries(scoredPillars)) {
    const numericScore = Number(score);
    if (isNaN(numericScore)) continue;

    const { severity, label } = classifySeverity(numericScore);
    if (severity === 'none') continue;

    const pillarClean = pillarKey.replace(/[^a-zA-Z0-9]/g, '');
    const desc = PILLAR_DESCRIPTIONS[pillarClean] || PILLAR_DESCRIPTIONS[Object.keys(PILLAR_DESCRIPTIONS).find(k => pillarKey.toLowerCase().includes(k.toLowerCase()))] || `Risk exposure in ${pillarKey}`;

    gaps.push({
      id: pillarClean.toLowerCase(),
      pillarKey,
      label: pillarKey,
      score: numericScore,
      severity,
      severityLabel: label,
      description: `${label}: ${desc}`,
      gap: Math.max(0, 40 - numericScore),
    });
  }

  gaps.sort((a, b) => a.score - b.score);
  return gaps;
}

module.exports = { detectGaps, classifySeverity, PILLAR_DESCRIPTIONS };
