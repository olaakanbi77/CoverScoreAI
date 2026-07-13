const buildQuote = (recommendedProducts, leadData) => {
  const premiumRanges = {
    'Fire & Special Perils': { min: 25000, max: 150000 },
    'Fire & Burglary': { min: 20000, max: 100000 },
    'Public Liability': { min: 15000, max: 75000 },
    "Employers Liability": { min: 10000, max: 50000 },
    'Goods in Transit': { min: 15000, max: 60000 },
    'Group Personal Accident': { min: 5000, max: 30000 },
    'Business Interruption': { min: 20000, max: 100000 },
    'Machinery Breakdown': { min: 15000, max: 80000 },
    'Medical Malpractice / Professional Indemnity': { min: 50000, max: 300000 },
    "Contractors All Risk": { min: 30000, max: 150000 },
    'Comprehensive Motor': { min: 50000, max: 200000 },
    'Group Life': { min: 10000, max: 50000 },
    'Cyber Insurance': { min: 25000, max: 100000 },
    'Marine Cargo': { min: 15000, max: 75000 },
    'Keyman Insurance': { min: 30000, max: 150000 },
    'Income Protection': { min: 15000, max: 80000 }
  };

  const products = recommendedProducts.map((product, index) => {
    const range = premiumRanges[product] || { min: 10000, max: 50000 };
    return {
      product,
      estimatedPremium: { min: range.min, max: range.max },
      priority: index + 1
    };
  });

  const estimatedTotalPremium = products.reduce(
    (acc, p) => ({
      min: acc.min + p.estimatedPremium.min,
      max: acc.max + p.estimatedPremium.max
    }),
    { min: 0, max: 0 }
  );

  return {
    products,
    estimatedTotalPremium,
    generatedAt: new Date().toISOString(),
    note: "Premium estimates are indicative. Actual premiums depend on specific underwriting assessment."
  };
};

module.exports = { buildQuote };
