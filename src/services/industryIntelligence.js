const industryRisks = {
  retail: {
    primary: ['Fire', 'Theft', 'Liability'],
    secondary: ['Product Liability', 'Equipment Breakdown'],
    recommendations: ['Property Insurance', 'General Liability', 'Business Interruption']
  },
  construction: {
    primary: ['Injury', 'Equipment', 'Liability'],
    secondary: ['Vehicle', 'Environmental'],
    recommendations: ['Workers Compensation', 'Contractors Equipment', 'General Liability', 'Commercial Auto']
  },
  technology: {
    primary: ['Cyber', 'Professional Liability'],
    secondary: ['Business Interruption', 'Errors & Omissions'],
    recommendations: ['Cyber Liability', 'Professional Liability', 'Errors & Omissions', 'Media Liability']
  },
  healthcare: {
    primary: ['Malpractice', 'Professional Liability'],
    secondary: ['Cyber', 'Workers Compensation'],
    recommendations: ['Medical Malpractice', 'Professional Liability', 'Cyber Liability', 'Workers Compensation']
  },
  manufacturing: {
    primary: ['Equipment', 'Liability', 'Fire'],
    secondary: ['Environmental', 'Product Liability'],
    recommendations: ['Property Insurance', 'General Liability', 'Equipment Breakdown', 'Product Liability']
  },
  hospitality: {
    primary: ['Liability', 'Fire'],
    secondary: ['Food Liability', 'Entertainment'],
    recommendations: ['General Liability', 'Property Insurance', 'Food Liability', 'Liquor Liability']
  },
  professional_services: {
    primary: ['Professional Liability', 'Cyber'],
    secondary: ['Errors & Omissions', 'Business Interruption'],
    recommendations: ['Professional Liability', 'Cyber Liability', 'Errors & Omissions', 'Business Owners Policy']
  },
  real_estate: {
    primary: ['Liability', 'Property'],
    secondary: ['Environmental', 'Workers Compensation'],
    recommendations: ['Property Insurance', 'General Liability', 'Umbrella', 'Workers Compensation']
  },
  agribusiness: {
    primary: ['Crop Failure', 'Weather Risk', 'Equipment'],
    secondary: ['Liability', 'Logistics'],
    recommendations: ['Agricultural Insurance', 'Crop Insurance', 'Fire & Special Perils', 'General Liability']
  },
  fintech: {
    primary: ['Cyber', 'Regulatory Compliance'],
    secondary: ['Professional Liability', 'Theft'],
    recommendations: ['Cyber Liability', 'Professional Indemnity', 'Crime Insurance', 'Directors & Officers']
  },
  logistics: {
    primary: ['Goods in Transit', 'Vehicle Accidents'],
    secondary: ['Theft', 'Warehousing Risk'],
    recommendations: ['Marine & Goods in Transit', 'Commercial Auto', 'Warehousemans Liability', 'Fire Insurance']
  },
  oil_gas: {
    primary: ['Environmental', 'Equipment Failure', 'Liability'],
    secondary: ['Safety Compliance', 'Business Interruption'],
    recommendations: ['Energy All Risks', 'Environmental Liability', 'General Liability', 'Control of Well']
  }
};

const getIndustryRisks = (industry) => {
  const normalizedIndustry = (industry || '').toLowerCase().replace(/[^a-z]/g, '_');
  return industryRisks[normalizedIndustry] || industryRisks.real_estate;
};

const getRecommendations = (industry, riskLevel) => {
  const risks = getIndustryRisks(industry);
  let recommendations = [...risks.recommendations];

  // African/Nigerian specific additions
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.unshift('Group Life Insurance (Statutory)');
    recommendations.push('Business Interruption insurance');
  }

  // Mandatory insurances based on industry (NAICOM/Local mandates)
  if (['construction', 'real_estate'].includes(industry)) {
    recommendations.push('Builders Liability (Compulsory)');
    recommendations.push('Occupiers Liability (Compulsory)');
  }

  if (industry === 'healthcare') {
    recommendations.push('Medical Professional Indemnity (Compulsory)');
    recommendations.push('NHIS Compliance Policy');
  }

  if (['manufacturing', 'logistics', 'agribusiness'].includes(industry)) {
    recommendations.push('Occupiers Liability (Public Buildings)');
  }

  return [...new Set(recommendations)]; // Remove duplicates
};

module.exports = { getIndustryRisks, getRecommendations, industryRisks };
