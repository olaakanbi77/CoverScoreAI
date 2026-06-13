/**
 * CoverScore Industry Risk Libraries™ (IRL)
 * Deep industry intelligence mapping top risks, questions, and products
 */

const industryLibraries = {
  school: {
    industry: 'School / Education',
    top_risks: [
      'Student Injury',
      'Fire',
      'Employee Risk',
      'School Bus Accidents',
      'Liability Claims'
    ],
    advisor_questions: [
      'Do you operate school buses?',
      'What is your student population?',
      'Do you have emergency response plans?',
      'How do you manage liabilities during school trips?'
    ],
    products: [
      'Group Life',
      'Public Liability',
      'Fire Insurance',
      'School Protection Package',
      'Motor Fleet (for buses)'
    ]
  },
  church: {
    industry: 'Church / Religious Organization',
    top_risks: [
      'Fire',
      'Crowd Incidents',
      'Equipment Damage',
      'Building Collapse',
      'Liability'
    ],
    advisor_questions: [
      'What is the maximum capacity of your auditorium?',
      'Do you frequently host large outdoor crusades?',
      'How is your high-value AV equipment protected?'
    ],
    products: [
      'Fire Insurance',
      'Public Liability',
      'Group Personal Accident',
      'All Risk (for equipment)'
    ]
  },
  manufacturing: {
    industry: 'Manufacturing',
    top_risks: [
      'Fire',
      'Machinery Breakdown',
      'Employee Injury',
      'Business Interruption'
    ],
    advisor_questions: [
      'What happens to your cash flow if your main production line breaks down?',
      'How are factory workers protected against occupational hazards?',
      'Are you storing highly flammable materials on site?'
    ],
    products: [
      'Industrial All Risk',
      'Machinery Breakdown',
      'Group Life',
      'Business Interruption',
      'Employers Liability / ECA'
    ]
  },
  hospital: {
    industry: 'Hospital / Healthcare',
    top_risks: [
      'Medical Negligence',
      'Equipment Failure',
      'Fire',
      'Employee Exposure'
    ],
    advisor_questions: [
      'Could your clinic survive a major medical malpractice lawsuit?',
      'How is your expensive diagnostic equipment (MRI, X-Ray) protected?',
      'Do you have comprehensive cover for your medical staff?'
    ],
    products: [
      'Professional Indemnity',
      'Medical Malpractice',
      'Fire Insurance',
      'Group Life',
      'Electronic Equipment Insurance'
    ]
  },
  logistics: {
    industry: 'Logistics / Transportation',
    top_risks: [
      'Vehicle Accidents',
      'Cargo Loss',
      'Employee Injury',
      'Third Party Liability'
    ],
    advisor_questions: [
      'Who bears the financial loss if a truck carrying client goods is hijacked or crashes?',
      'How are your drivers protected while on the road?',
      'What is your fleet maintenance protocol?'
    ],
    products: [
      'Motor Fleet',
      'Goods-in-Transit',
      'Public Liability',
      'Group Personal Accident'
    ]
  },
  construction: {
    industry: 'Construction',
    top_risks: [
      'Site Injury',
      'Equipment Damage',
      'Project Delays',
      'Structural Failure'
    ],
    advisor_questions: [
      'Are you compliant with mandatory Builders Liability requirements?',
      'How do you handle compensation for workers injured on site?',
      'What happens if severe weather damages a partially completed project?'
    ],
    products: [
      'Contractors All Risk',
      'Group Life',
      'Public Liability',
      'Plant and Equipment Insurance'
    ]
  },
  retail: {
    industry: 'Retail / FMCG',
    top_risks: [
      'Fire',
      'Burglary / Theft',
      'Business Interruption',
      'Public Liability'
    ],
    advisor_questions: [
      'If your warehouse catches fire, how long before you run out of stock to sell?',
      'Do you have adequate cover for cash-in-transit and theft?',
      'What happens if a customer slips and falls in your store?'
    ],
    products: [
      'Fire & Burglary',
      'Business Interruption',
      'Public Liability',
      'Goods in Transit'
    ]
  },
  technology: {
    industry: 'Technology / Software',
    top_risks: [
      'Cyber & Data Breach',
      'Professional Negligence',
      'Key Person Dependency',
      'Equipment Damage'
    ],
    advisor_questions: [
      'What is the financial impact of a 48-hour system downtime or data breach?',
      'If a software bug causes financial loss to a client, are you protected?',
      'What happens if your lead developer or founder is incapacitated?'
    ],
    products: [
      'Cyber Liability',
      'Professional Indemnity',
      'Keyman Insurance',
      'Electronic Equipment Insurance'
    ]
  },
  real_estate: {
    industry: 'Real Estate / Property Management',
    top_risks: [
      'Fire',
      'Tenant Injury',
      'Property Damage',
      'Loss of Rent'
    ],
    advisor_questions: [
      'Are you compliant with the statutory Occupiers Liability act for public buildings?',
      'If a property burns down, how will you recover the lost rental income during the rebuild?',
      'Who is liable if a structural failure injures a tenant?'
    ],
    products: [
      'Fire & Special Perils',
      'Occupiers Liability',
      'Loss of Rent',
      'Property Owners Liability'
    ]
  },
  fintech: {
    industry: 'FinTech / Financial Services',
    top_risks: [
      'Cyber & Data Breach',
      'Fraud / Crime',
      'Regulatory Action',
      'Directors Liability'
    ],
    advisor_questions: [
      'How are you protecting against internal fraud or embezzlement?',
      'If a data breach exposes customer financial records, what is your mitigation strategy?',
      'Are your directors protected against lawsuits from investors or regulators?'
    ],
    products: [
      'Cyber Liability',
      'Crime Insurance / Fidelity Guarantee',
      'Directors & Officers (D&O)',
      'Professional Indemnity'
    ]
  }
};

const getIndustryProfile = (industryName) => {
  if (!industryName) return industryLibraries.retail; // Default fallback
  
  const normalized = industryName.toLowerCase();
  
  if (normalized.includes('school') || normalized.includes('education')) return industryLibraries.school;
  if (normalized.includes('church') || normalized.includes('religion')) return industryLibraries.church;
  if (normalized.includes('manufactur')) return industryLibraries.manufacturing;
  if (normalized.includes('hospital') || normalized.includes('health') || normalized.includes('clinic')) return industryLibraries.hospital;
  if (normalized.includes('logistic') || normalized.includes('transport')) return industryLibraries.logistics;
  if (normalized.includes('construct') || normalized.includes('build')) return industryLibraries.construction;
  if (normalized.includes('tech') || normalized.includes('software')) return industryLibraries.technology;
  if (normalized.includes('real estate') || normalized.includes('property')) return industryLibraries.real_estate;
  if (normalized.includes('fintech') || normalized.includes('finance') || normalized.includes('bank')) return industryLibraries.fintech;
  
  // Default to retail if unknown but seems like standard business
  return industryLibraries.retail;
};

module.exports = {
  industryLibraries,
  getIndustryProfile
};
