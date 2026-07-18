const GAP_TO_NEED_MAP = [
  // School
  { gapPattern: /student.*safety|student.*protection/i, need: 'Protect students against accidental injury', category: 'people', pillarWeight: 1.0 },
  { gapPattern: /property.*protection|fire.*property|asset.*protect/i, need: 'Protect buildings and contents against fire and damage', category: 'property', pillarWeight: 1.0 },
  { gapPattern: /business.*continuity|interruption|operational/i, need: 'Maintain cash flow and operations during disruptions', category: 'operations', pillarWeight: 1.0 },
  { gapPattern: /transport.*safety|fleet|vehicle/i, need: 'Protect school buses and student transport', category: 'fleet', pillarWeight: 1.0 },
  { gapPattern: /regulatory.*readiness|complianc/i, need: 'Meet regulatory and compliance obligations', category: 'legal', pillarWeight: 0.8 },
  { gapPattern: /legal.*liability|liability.*third|public.*liability|occupiers/i, need: 'Protect against third-party liability claims', category: 'legal', pillarWeight: 1.0 },

  // Hospital
  { gapPattern: /patient.*safety|clinical/i, need: 'Protect patients against medical incidents', category: 'people', pillarWeight: 1.0 },
  { gapPattern: /clinical.*liability|malpractice|professional.*indemnity/i, need: 'Protect against medical malpractice claims', category: 'legal', pillarWeight: 1.0 },
  { gapPattern: /equipment.*protection|machinery.*breakdown|diagnostic/i, need: 'Protect diagnostic and medical equipment against breakdown', category: 'equipment', pillarWeight: 0.9 },
  { gapPattern: /workforce.*safety|employee.*safety|worker.*protect/i, need: 'Protect employees against workplace injuries', category: 'people', pillarWeight: 0.9 },
  { gapPattern: /supply.*chain|stock|inventory/i, need: 'Protect supply chain and inventory against disruptions', category: 'operations', pillarWeight: 0.7 },
  { gapPattern: /environmental.*compliance|waste|hazard/i, need: 'Meet environmental and waste management obligations', category: 'legal', pillarWeight: 0.6 },

  // Manufacturing
  { gapPattern: /fire.*property|fire.*safety/i, need: 'Protect factory buildings and stock against fire', category: 'property', pillarWeight: 1.0 },
  { gapPattern: /machinery.*equipment|equipment.*protect|machinery.*breakdown/i, need: 'Protect production machinery against breakdown', category: 'equipment', pillarWeight: 0.9 },
  { gapPattern: /business.*interruption|continuity/i, need: 'Maintain income during production stoppages', category: 'operations', pillarWeight: 1.0 },

  // Church
  { gapPattern: /premises.*safety|crowd.*management|congregant/i, need: 'Protect congregants and visitors against injury', category: 'people', pillarWeight: 1.0 },
  { gapPattern: /financial.*stewardship|funds/i, need: 'Protect church funds against theft or mismanagement', category: 'financial', pillarWeight: 0.7 },
  { gapPattern: /community.*engagement|program|outreach/i, need: 'Protect community programs and outreach activities', category: 'operations', pillarWeight: 0.5 },

  // SME
  { gapPattern: /asset.*protection|property.*asset|tangible/i, need: 'Protect business assets and inventory against loss', category: 'property', pillarWeight: 1.0 },
  { gapPattern: /workforce|people.*risk|employee.*safety/i, need: 'Protect employees with adequate benefits and cover', category: 'people', pillarWeight: 0.9 },
  { gapPattern: /operations|operational|logistics/i, need: 'Safeguard business operations and logistics', category: 'operations', pillarWeight: 0.8 },
  { gapPattern: /cyber.*data|digital|data.*breach/i, need: 'Protect digital assets and customer data', category: 'cyber', pillarWeight: 0.8 },

  // Personal — Family
  { gapPattern: /family.*protection|dependents|loved/i, need: 'Provide financial security for dependents', category: 'life', pillarWeight: 1.0 },
  { gapPattern: /income.*protection|income.*loss|disability/i, need: 'Replace income if unable to work due to illness or injury', category: 'income', pillarWeight: 1.0 },
  { gapPattern: /health.*security|health.*access|medical|treatment.*afford/i, need: 'Access quality healthcare without financial strain', category: 'health', pillarWeight: 0.9 },
  { gapPattern: /education.*funding|school.*fees|child.*education/i, need: 'Secure funding for children education', category: 'savings', pillarWeight: 0.7 },
  { gapPattern: /retirement.*readiness|retirement.*saving|pension/i, need: 'Build adequate retirement savings', category: 'savings', pillarWeight: 0.8 },
  { gapPattern: /emergency.*resilience|emergency.*fund|saving.*adequacy/i, need: 'Build emergency savings for unexpected expenses', category: 'savings', pillarWeight: 0.6 },

  // Personal — Young Professional
  { gapPattern: /financial.*foundation|budget|habit/i, need: 'Build strong financial habits and emergency preparedness', category: 'financial', pillarWeight: 0.8 },
  { gapPattern: /health.*protection|personal.*accident|disability.*protect/i, need: 'Secure personal health and accident cover', category: 'health', pillarWeight: 0.9 },
  { gapPattern: /saving.*investing|investment|wealth/i, need: 'Start disciplined saving and investing', category: 'savings', pillarWeight: 0.7 },

  // Personal — Entrepreneur
  { gapPattern: /business.*personal.*separ/i, need: 'Separate personal and business financial risks', category: 'legal', pillarWeight: 0.8 },
  { gapPattern: /personal.*liability|entrepreneur.*liability/i, need: 'Protect personal assets from business liabilities', category: 'legal', pillarWeight: 0.9 },
  { gapPattern: /income.*volatility|variable.*income/i, need: 'Manage income fluctuations with protection planning', category: 'income', pillarWeight: 0.8 },
  { gapPattern: /personal.*protection|individual.*cover/i, need: 'Secure personal insurance and health coverage', category: 'health', pillarWeight: 0.7 },

  // Retirement
  { gapPattern: /retirement.*saving|nest.*egg|pension/i, need: 'Close the retirement savings gap', category: 'savings', pillarWeight: 1.0 },
  { gapPattern: /income.*sustainability|inflation.*income/i, need: 'Ensure retirement income keeps pace with inflation', category: 'income', pillarWeight: 0.8 },
  { gapPattern: /healthcare.*retirement|medical.*retire/i, need: 'Plan for healthcare costs in retirement', category: 'health', pillarWeight: 0.7 },
  { gapPattern: /legacy.*estate|inheritance|will/i, need: 'Plan estate and wealth transfer', category: 'legal', pillarWeight: 0.5 },

  // Cross-over
  { gapPattern: /cyber.*exposure|data.*breach|ransomware|phishing/i, need: 'Protect against cyber threats and data loss', category: 'cyber', pillarWeight: 0.9 },
  { gapPattern: /financial.*resilience|cash.*flow|debt.*burden/i, need: 'Strengthen financial resilience against shocks', category: 'financial', pillarWeight: 0.7 },
  { gapPattern: /fraud.*awareness|scam|identity/i, need: 'Improve fraud awareness and prevention', category: 'financial', pillarWeight: 0.5 },
  { gapPattern: /key.*person|leadership.*dependenc|succession/i, need: 'Protect against loss of key personnel', category: 'people', pillarWeight: 0.8 },
];

function detectNeeds(gaps, assessmentType) {
  const needs = [];
  const seen = new Set();

  for (const gap of gaps) {
    for (const mapping of GAP_TO_NEED_MAP) {
      if (mapping.gapPattern.test(gap.pillarKey) || mapping.gapPattern.test(gap.label)) {
        const key = mapping.need + gap.severity;
        if (seen.has(key)) continue;
        seen.add(key);

        needs.push({
          id: key.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          label: mapping.need,
          category: mapping.category,
          priority: gap.severity === 'critical' ? 1 : gap.severity === 'high' ? 2 : gap.severity === 'medium' ? 3 : 4,
          severity: gap.severity,
          gapIds: [gap.id],
          score: gap.score,
        });
      }
    }
  }

  needs.sort((a, b) => a.priority - b.priority || a.score - b.score);
  return needs;
}

function buildStrategies(needs) {
  const strategies = [];

  for (const need of needs) {
    const strategy = {
      id: `strategy_${need.id}`,
      label: need.label,
      type: 'insurance',
      needId: need.id,
      category: need.category,
      priority: need.priority,
      severity: need.severity,
      description: `${need.label}. This addresses a ${need.severity} priority protection need.`,
    };
    strategies.push(strategy);
  }

  return strategies;
}

module.exports = { detectNeeds, buildStrategies, GAP_TO_NEED_MAP };
