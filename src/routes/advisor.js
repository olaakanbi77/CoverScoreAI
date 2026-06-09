const express = require('express');
const router = express.Router();
const { all, get } = require('../config/database');
const { authenticatePage } = require('../middleware/auth');

const requireSalesOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'sales'].includes(req.user.role)) return next();
  return res.status(403).send('Forbidden: Sales or Admin role required');
};

const mockLeads = [
  {
    id: 1, name: 'Greenfield Manufacturing Ltd', contact: 'John Okafor',
    phone: '08031234567', email: 'john@greenfield.com', industry: 'Manufacturing',
    employees: '45', annual_turnover: '₦250M', location: 'Lagos, Nigeria',
    assessment_date: 'May 15, 2024', source: 'WhatsApp',
    score: 82, risk_level: 'high', estimated_premium: '850000',
    status: 'hot', next_action: 'Call Now', last_activity: 'Today, 10:15 AM',
    business_name: 'Greenfield Manufacturing Ltd',
    assigned_agent: 'Tunde Adeola',
    is_qualified: 1,
    primary_concern: 'Business Interruption',
    recommended_product: 'Business Interruption Insurance',
    likelihood_to_buy: 'HIGH',
    premium_range: '₦600,000 - ₦1,100,000',
    financial_exposure_min: 45000000, financial_exposure_max: 120000000,
    risks: [
      { name: 'Property Risk', score: 90 },
      { name: 'Business Interruption', score: 88 },
      { name: 'Employee Risk', score: 75 },
      { name: 'Liability Risk', score: 82 },
      { name: 'Cyber Risk', score: 40 }
    ],
    protection_gaps: [
      'No Group Life Insurance', 'No Public Liability Insurance',
      'No Business Interruption Cover', 'Cyber Insurance Not In Place'
    ],
    notes: 'Client expressed concern about downtime during production halt. Budget indication: Around ₦600k annually. Already has Fire Insurance with another insurer.',
    conversations: [
      { sender: 'client', text: 'Hello, I have just completed my CoverScore assessment.', time: '10:15 AM' },
      { sender: 'advisor', text: 'Thank you Mr. Okafor. I\'ve reviewed your report.', time: '10:16 AM' },
      { sender: 'client', text: 'I would like a review of the risks and recommendations.', time: '10:17 AM' },
      { sender: 'advisor', text: 'Absolutely. I can see a few key areas we should discuss.', time: '10:18 AM' },
      { sender: 'client', text: 'What do you recommend we start with?', time: '10:19 AM' },
      { sender: 'advisor', text: 'Let\'s start with business interruption and employee protection.', time: '10:20 AM' }
    ]
  },
  {
    id: 2, name: 'Sunshine Schools', contact: 'Mrs. Adebayo',
    phone: '08099887766', email: 'info@sunshineschools.com', industry: 'Education',
    employees: '120', annual_turnover: '₦500M', location: 'Abuja, Nigeria',
    assessment_date: 'May 18, 2024', source: 'Website',
    score: 77, risk_level: 'high', estimated_premium: '1200000',
    status: 'hot', next_action: 'Send Proposal', last_activity: 'Yesterday',
    business_name: 'Sunshine Schools',
    premium_range: '₦1,200,000 - ₦1,800,000',
    primary_concern: 'Student & Staff Welfare',
    recommended_product: 'Group Life & Health Insurance',
    likelihood_to_buy: 'HIGH',
    financial_exposure_min: 80000000, financial_exposure_max: 200000000,
    risks: [
      { name: 'Property Risk', score: 85 },
      { name: 'Public Liability', score: 78 },
      { name: 'Employee Risk', score: 72 },
      { name: 'Motor Risk', score: 65 },
      { name: 'Cyber Risk', score: 35 }
    ],
    protection_gaps: [
      'No Group Life Insurance', 'No Public Liability Insurance',
      'No School Equipment Cover', 'Cyber Insurance Not In Place'
    ],
    notes: 'School administrator interested in comprehensive coverage for staff and students. Budget around ₦1.5M annually.',
    conversations: [
      { sender: 'client', text: 'Good morning. I completed the assessment for our school.', time: '9:00 AM' },
      { sender: 'advisor', text: 'Good morning. I have the report ready for you.', time: '9:05 AM' },
      { sender: 'client', text: 'What are the main areas we need to focus on?', time: '9:10 AM' },
      { sender: 'advisor', text: 'I recommend starting with group life and public liability.', time: '9:12 AM' }
    ]
  },
  {
    id: 3, name: 'Adekunle Johnson', contact: 'Adekunle Johnson',
    phone: '08055667788', email: 'adekunle.j@gmail.com', industry: 'Retail',
    employees: '5', annual_turnover: '₦25M', location: 'Ibadan, Nigeria',
    assessment_date: 'Jun 1, 2024', source: 'WhatsApp',
    score: 75, risk_level: 'high', estimated_premium: '120000',
    status: 'warm', next_action: 'Send Follow-up', last_activity: '2 days ago',
    business_name: 'Adekunle Johnson',
    premium_range: '₦120,000 - ₦200,000',
    primary_concern: 'Shop & Inventory Protection',
    recommended_product: 'Fire & Special Perils Insurance',
    likelihood_to_buy: 'MEDIUM',
    financial_exposure_min: 5000000, financial_exposure_max: 15000000,
    risks: [
      { name: 'Property Risk', score: 78 },
      { name: 'Business Interruption', score: 70 },
      { name: 'Liability Risk', score: 45 },
      { name: 'Employee Risk', score: 30 },
      { name: 'Cyber Risk', score: 20 }
    ],
    protection_gaps: [
      'No Fire Insurance', 'No Burglary Insurance',
      'No Public Liability Insurance'
    ],
    notes: 'Small business owner seeking basic protection for his retail shop. Price-sensitive client.',
    conversations: [
      { sender: 'client', text: 'I need insurance for my shop in Ibadan.', time: 'Jun 1' },
      { sender: 'advisor', text: 'Let me review your assessment and get back to you.', time: 'Jun 1' }
    ]
  },
  {
    id: 4, name: 'Femi & Family', contact: 'Femi Adewale',
    phone: '08033445566', email: 'femi@example.com', industry: 'Healthcare',
    employees: '3', annual_turnover: '₦15M', location: 'Lagos, Nigeria',
    assessment_date: 'Jun 3, 2024', source: 'Referral',
    score: 68, risk_level: 'medium', estimated_premium: '300000',
    status: 'warm', next_action: 'Schedule Call', last_activity: '3 days ago',
    business_name: 'Femi & Family',
    premium_range: '₦300,000 - ₦450,000',
    primary_concern: 'Family Health & Income Protection',
    recommended_product: 'Family Health Insurance Plan',
    likelihood_to_buy: 'MEDIUM',
    financial_exposure_min: 2000000, financial_exposure_max: 8000000,
    risks: [
      { name: 'Health Risk', score: 72 },
      { name: 'Income Risk', score: 65 },
      { name: 'Property Risk', score: 50 },
      { name: 'Liability Risk', score: 35 }
    ],
    protection_gaps: [
      'No Health Insurance', 'No Life Insurance',
      'No Personal Accident Cover'
    ],
    notes: 'Family of 4 looking for comprehensive health cover. Referred by existing client.',
    conversations: [
      { sender: 'client', text: 'My friend recommended I reach out to you.', time: 'Jun 3' },
      { sender: 'advisor', text: 'Happy to help. Let me review your assessment.', time: 'Jun 3' }
    ]
  },
  {
    id: 5, name: 'Vertex Logistics Ltd', contact: 'Chidi Mbaka',
    phone: '08071122334', email: 'chidi@vertexlogistics.com', industry: 'Logistics',
    employees: '80', annual_turnover: '₦350M', location: 'Port Harcourt, Nigeria',
    assessment_date: 'Jun 5, 2024', source: 'Website',
    score: 63, risk_level: 'medium', estimated_premium: '650000',
    status: 'follow-up', next_action: 'Follow Up', last_activity: '1 week ago',
    business_name: 'Vertex Logistics Ltd',
    premium_range: '₦650,000 - ₦900,000',
    primary_concern: 'Fleet & Cargo Protection',
    recommended_product: 'Fleet Insurance & Goods-in-Transit',
    likelihood_to_buy: 'MEDIUM',
    financial_exposure_min: 15000000, financial_exposure_max: 50000000,
    risks: [
      { name: 'Motor Risk', score: 88 },
      { name: 'Cargo Risk', score: 82 },
      { name: 'Property Risk', score: 60 },
      { name: 'Liability Risk', score: 55 },
      { name: 'Employee Risk', score: 45 }
    ],
    protection_gaps: [
      'Incomplete Fleet Coverage', 'No Goods-in-Transit Insurance',
      'No Public Liability Insurance', 'No Group Life Cover for Drivers'
    ],
    notes: 'Logistics company with a fleet of 15 vehicles. Interested in comprehensive fleet and cargo insurance.',
    conversations: [
      { sender: 'client', text: 'We need fleet insurance for our trucks.', time: 'Jun 5' },
      { sender: 'advisor', text: 'I can help with that. Let me review your needs.', time: 'Jun 5' }
    ]
  }
];

const mockProposals = [
  { id: 1, lead_id: 1, title: 'Business Insurance Package - Greenfield Mfg', amount: 850000, status: 'Sent', updated_at: '2024-06-08', token: 'abc123', lead_name: 'Greenfield Manufacturing Ltd' },
  { id: 2, lead_id: 2, title: 'Comprehensive School Insurance Plan', amount: 1500000, status: 'Draft', updated_at: '2024-06-07', token: 'def456', lead_name: 'Sunshine Schools' }
];

const aiRecommendations = [
  { product: 'Business Interruption Insurance', priority: 'High' },
  { product: 'Group Life Insurance', priority: 'High' },
  { product: 'Public Liability Insurance', priority: 'High' },
  { product: 'Fire Insurance', priority: 'Medium' },
  { product: 'Cyber Insurance', priority: 'Medium' }
];

const talkingPoints = [
  'Highlight financial loss during downtime.',
  'Discuss employee welfare and group life benefits.',
  'Explain liability exposure from visitors and vendors.',
  'Review cyber risk in increasingly digital operations.',
  'Compare current Fire Insurance coverage with comprehensive package.'
];

router.get('/dashboard', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const leadId = parseInt(req.query.lead) || mockLeads[0].id;
    const selectedLead = mockLeads.find(l => l.id === leadId) || mockLeads[0];
    res.render('advisor/dashboard', {
      layout: false,
      user: req.user,
      leads: mockLeads,
      proposals: mockProposals,
      aiRecommendations,
      talkingPoints,
      selectedLead,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Advisor dashboard error:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/proposal-writer/:leadId', authenticatePage, requireSalesOrAdmin, async (req, res) => {
  try {
    const lead = mockLeads.find(l => l.id === parseInt(req.params.leadId)) || mockLeads[0];
    const proposal = mockProposals.find(p => p.lead_id === lead.id) || null;
    res.render('advisor/proposal-writer', {
      layout: 'admin',
      user: req.user,
      lead,
      proposal,
      path: '/advisor/dashboard'
    });
  } catch (err) {
    console.error('Error loading proposal writer:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
