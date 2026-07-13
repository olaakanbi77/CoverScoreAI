function mapProducts(prefix, answers, scoredPillars) {
  const threshold = 40;

  const productMap = {
    common: [
      { product: 'Fire & Special Perils', risk: 'asset protection' },
      { product: 'Public Liability', risk: 'legal liability' },
      { product: 'Employers Liability', risk: 'workforce' },
      { product: 'Goods in Transit', risk: 'operations' },
      { product: 'Group Personal Accident', risk: 'workforce' },
      { product: 'Business Interruption', risk: 'business continuity' },
    ],
    SME: [{ product: 'Fire & Burglary', risk: 'asset protection' }],
    MFG: [{ product: 'Machinery Breakdown', risk: 'operations' }],
    HOS: [
      { product: 'Medical Malpractice / Professional Indemnity', risk: 'legal liability' },
      { product: 'Machinery Breakdown', risk: 'asset protection' },
    ],
    CHR: [
      { product: 'Public Liability', risk: 'legal liability' },
      { product: 'Fire & Special Perils', risk: 'property' },
    ],
    CON: [
      { product: 'Contractors All Risk', risk: 'insurance pillar' },
      { product: 'Public Liability', risk: 'operations' },
      { product: 'Group Personal Accident', risk: 'worker protection' },
    ],
    TRN: [
      { product: 'Comprehensive Motor', risk: 'fleet' },
      { product: 'Goods in Transit', risk: 'insurance pillar' },
      { product: 'Group Personal Accident', risk: 'worker protection' },
    ],
    SCH: [
      { product: 'Public Liability', risk: 'student safety' },
      { product: 'Fire & Special Perils', risk: 'property protection' },
      { product: 'Group Personal Accident', risk: 'transport safety' },
    ],
  };

  const prefixConfig = productMap[prefix] || [];
  const allProductDefs = [...productMap.common, ...prefixConfig];

  const priorityKey = {};
  for (const [pillar, score] of Object.entries(scoredPillars)) {
    priorityKey[pillar.toLowerCase()] = score < threshold ? 'high' : 'medium';
  }

  const riskPriorityMap = {
    'asset protection': ['asset protection', 'property'],
    'legal liability': ['legal liability'],
    workforce: ['workforce', 'worker protection'],
    operations: ['operations'],
    'business continuity': ['business continuity'],
    property: ['property', 'asset protection'],
    'student safety': ['student safety'],
    'property protection': ['property protection'],
    'transport safety': ['transport safety'],
    'insurance pillar': ['insurance pillar'],
    fleet: ['fleet'],
    compliance: ['compliance'],
    'regulatory readiness': ['regulatory readiness'],
  };

  function resolvePriority(risk) {
    const mappedPillars = riskPriorityMap[risk.toLowerCase()] || [risk.toLowerCase()];
    for (const p of mappedPillars) {
      if (priorityKey[p] === 'high') return 'high';
    }
    for (const p of mappedPillars) {
      if (priorityKey[p] === 'medium') return 'medium';
    }
    return 'low';
  }

  function buildReason(product, risk) {
    const pillarName = risk;
    const score = scoredPillars[pillarName];
    if (score !== undefined && score < threshold) {
      return `Your ${pillarName} score indicates exposure in this area.`;
    }
    return `${product} helps address your ${pillarName} risk exposure.`;
  }

  const recommendedProducts = [];
  const seen = new Set();

  for (const def of allProductDefs) {
    const key = def.product + def.risk;
    if (seen.has(key)) continue;
    seen.add(key);

    const priority = resolvePriority(def.risk);
    const reason = buildReason(def.product, def.risk);

    const entry = { product: def.product, risk: def.risk, priority, reason };

    if (priority === 'high') {
      recommendedProducts.push(entry);
    } else {
      recommendedProducts.push(entry);
    }
  }

  return {
    recommendedProducts,
    allProducts: allProductDefs.map((d) => ({ product: d.product, risk: d.risk })),
  };
}

module.exports = { mapProducts };
