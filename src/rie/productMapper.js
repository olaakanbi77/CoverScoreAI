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
    // Personal funnels
    FAM: [
      { product: 'Group Personal Accident', risk: 'family protection' },
      { product: 'Comprehensive Motor', risk: 'transportation' },
    ],
    HLT: [
      { product: 'Group Personal Accident', risk: 'health security' },
      { product: 'Comprehensive Motor', risk: 'transportation' },
    ],
    INC: [
      { product: 'Group Personal Accident', risk: 'income security' },
      { product: 'Comprehensive Motor', risk: 'transportation' },
    ],
    ENT: [
      { product: 'Group Personal Accident', risk: 'personal liability' },
      { product: 'Public Liability', risk: 'business operations' },
      { product: 'Fire & Special Perils', risk: 'asset protection' },
    ],
    YPR: [
      { product: 'Group Personal Accident', risk: 'personal protection' },
      { product: 'Comprehensive Motor', risk: 'transportation' },
    ],
    RET: [
      { product: 'Group Personal Accident', risk: 'health security' },
      { product: 'Comprehensive Motor', risk: 'transportation' },
    ],
  };

  const personalPrefixes = ['FAM', 'HLT', 'INC', 'ENT', 'YPR', 'RET', 'HOM', 'MOT'];
  const isPersonal = personalPrefixes.includes(prefix);

  const prefixConfig = productMap[prefix] || [];
  // Personal funnels get only their specific products; business funnels get common + specific
  const allProductDefs = isPersonal ? prefixConfig : [...productMap.common, ...prefixConfig];

  const priorityKey = {};
  for (const [pillar, score] of Object.entries(scoredPillars)) {
    priorityKey[pillar.toLowerCase()] = Number(score) < threshold ? 'high' : 'medium';
  }

  const riskPriorityMap = {
    'asset protection': ['asset protection', 'property', 'tangible assets', 'physical assets'],
    'legal liability': ['legal liability', 'liability', 'third party'],
    workforce: ['workforce', 'worker protection', 'employees', 'staff'],
    operations: ['operations', 'operational', 'supply chain', 'logistics'],
    'business continuity': ['business continuity', 'interruption', 'downtime'],
    property: ['property', 'asset protection', 'tangible assets'],
    'student safety': ['student safety', 'student welfare', 'child safety'],
    'property protection': ['property protection', 'security', 'premises'],
    'transport safety': ['transport safety', 'fleet', 'vehicle', 'transport'],
    'insurance pillar': ['insurance pillar', 'general insurance', 'overall'],
    fleet: ['fleet', 'transport safety', 'vehicle'],
    compliance: ['compliance', 'regulatory', 'legal compliance'],
    'regulatory readiness': ['regulatory readiness', 'compliance', 'statutory'],
    // Personal funnel pillars
    'family protection': ['family protection', 'dependents', 'family security', 'income protection'],
    'health security': ['health security', 'medical', 'healthcare', 'wellness'],
    'income security': ['income security', 'income protection', 'disability', 'earnings'],
    'personal liability': ['personal liability', 'liability', 'third party'],
    'personal protection': ['personal protection', 'accident', 'disability', 'health'],
    'transportation': ['transportation', 'transport', 'vehicle', 'fleet'],
    'business operations': ['business operations', 'operations', 'liability', 'entrepreneur'],
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
    if (score !== undefined && Number(score) < threshold) {
      return `Your ${pillarName} score of ${score}% indicates exposure in this area.`;
    }
    return `${product} helps address your ${pillarName} risk exposure.`;
  }

  const recommendedProducts = [];
  const seen = new Set();
  let highCount = 0;

  for (const def of allProductDefs) {
    const key = def.product + def.risk;
    if (seen.has(key)) continue;
    seen.add(key);

    const priority = resolvePriority(def.risk);
    const reason = buildReason(def.product, def.risk);

    const entry = { product: def.product, risk: def.risk, priority, reason };

    if (priority === 'high') {
      recommendedProducts.push(entry);
      highCount++;
    }
  }

  // If fewer than 3 high-priority products, fill with medium-priority ones
  if (highCount < 3) {
    for (const def of allProductDefs) {
      const key = def.product + def.risk;
      if (seen.has(key)) continue;
      seen.add(key);

      const priority = resolvePriority(def.risk);
      if (priority !== 'medium') continue;

      const reason = buildReason(def.product, def.risk);
      recommendedProducts.push({ product: def.product, risk: def.risk, priority, reason });
      if (recommendedProducts.length >= 3) break;
    }
  }

  // Fallback: if no products recommended (no pillar data), return first 3 prefix-specific products
  if (recommendedProducts.length === 0) {
    const defaults = allProductDefs.slice(0, 3).map(d => ({
      product: d.product, risk: d.risk, priority: 'medium',
      reason: `${d.product} helps address your ${d.risk} risk exposure.`
    }));
    return { recommendedProducts: defaults, allProducts: allProductDefs.map((d) => ({ product: d.product, risk: d.risk })) };
  }

  return {
    recommendedProducts,
    allProducts: allProductDefs.map((d) => ({ product: d.product, risk: d.risk })),
  };
}

module.exports = { mapProducts };
