/**
 * Hotels & Hospitality Resilience Assessment™ Flow v1.0
 *
 * Canonical CoverScore Business Assessment architecture for hotels.
 * Replaces the flat 56-question structure with an adaptive funnel:
 *   Welcome → Consent → Profile → Context → Risk Discovery (branches)
 *   → Insurance → Continuity → Concern → Completion → Intelligence → Report → Advisor
 *
 * The customer never sees the underlying H01–H56 risk-object structure.
 * Adaptive branches fire based on hotel context and answers.
 */

const STAGES = {
  WELCOME:            'welcome',
  CONSENT:            'consent',
  PROFILE:            'profile',
  CONTEXT:            'context',
  FIRE_DISCOVERY:     'fire_discovery',
  FIRE_BRANCH:        'fire_branch',
  GUEST_DISCOVERY:    'guest_discovery',
  INCIDENT_BRANCH:    'incident_branch',
  RECREATION_BRANCH:  'recreation_branch',
  OPERATIONS:         'operations',
  POWER_BRANCH:       'power_branch',
  EQUIPMENT_BRANCH:   'equipment_branch',
  FB_BRANCH:          'fb_branch',
  VEHICLE_BRANCH:     'vehicle_branch',
  STAFF_SAFETY:       'staff_safety',
  STAFF_BRANCH:       'staff_branch',
  SECURITY:           'security',
  SECURITY_BRANCH:    'security_branch',
  DIGITAL:            'digital',
  CYBER_BRANCH:       'cyber_branch',
  FINANCIAL:          'financial',
  INSURANCE:          'insurance',
  CONTINUITY:         'continuity',
  REVENUE_RESILIENCE: 'revenue_resilience',
  OPERATIONAL_DEPENDENCY: 'operational_dependency',
  CLIENT_CONCERN:     'client_concern',
  FINAL_VALIDATION:   'final_validation',
  COMPLETION:         'completion',
  INTELLIGENCE:       'intelligence',
  REPORT:             'report',
  ADVISOR:            'advisor'
};

const BRANCH_PRIORITY = {
  CRITICAL_DISCLOSURE: 1,
  MATERIAL_EXPOSURE:   2,
  CONTROL_WEAKNESS:    3,
  UNCERTAINTY:         4,
  ROUTINE_DISCOVERY:   5
};

/**
 * Stage entry mapping: when a transition targets a STAGE constant,
 * it should actually go to the first question in that stage.
 */
const STAGE_ENTRY_MAP = {
  [STAGES.WELCOME]:            'welcome',
  [STAGES.CONSENT]:            'consent',
  [STAGES.PROFILE]:            'profile_q1',
  [STAGES.CONTEXT]:            'context_q4',
  [STAGES.FIRE_DISCOVERY]:     'fire_q7',
  [STAGES.FIRE_BRANCH]:        'fire_f1',
  [STAGES.GUEST_DISCOVERY]:    'guest_q9',
  [STAGES.INCIDENT_BRANCH]:    'incident_i1',
  [STAGES.RECREATION_BRANCH]:  'recreation_check',
  [STAGES.OPERATIONS]:         'operations_q10',
  [STAGES.POWER_BRANCH]:       'power_p1',
  [STAGES.FB_BRANCH]:          'fb_fb1',
  [STAGES.VEHICLE_BRANCH]:     'vehicle_q',
  [STAGES.STAFF_SAFETY]:       'staff_q11',
  [STAGES.STAFF_BRANCH]:       'staff_branch_q',
  [STAGES.SECURITY]:           'security_q13',
  [STAGES.SECURITY_BRANCH]:    'security_branch_q',
  [STAGES.DIGITAL]:            'digital_q14',
  [STAGES.CYBER_BRANCH]:       'cyber_q',
  [STAGES.FINANCIAL]:          'financial_q15',
  [STAGES.INSURANCE]:          'insurance_q16',
  [STAGES.CONTINUITY]:         'continuity_q18',
  [STAGES.REVENUE_RESILIENCE]: 'revenue_q19',
  [STAGES.OPERATIONAL_DEPENDENCY]: 'ops_dep_q',
  [STAGES.CLIENT_CONCERN]:     'client_concern_q20',
  [STAGES.FINAL_VALIDATION]:   'final_validation_check',
  [STAGES.COMPLETION]:         'completion'
};

const ASSESSMENT_COMPLETE_FIELDS = [
  'profile_complete',
  'context_complete',
  'exposures_discovered',
  'evidence_sufficient',
  'critical_branches_resolved',
  'protection_established',
  'resilience_established',
  'client_concern_captured'
];

/* ─── WELCOME ─── */

const WELCOME_STAGE = {
  id: STAGES.WELCOME,
  ai_message:
    `Hello and welcome to CoverScore™.\n\n` +
    `I'm your AI Risk Advisor. I'll help you understand how resilient your hotel is across areas such as guest safety, fire protection, property, operations, employees, security, financial resilience and business continuity.\n\n` +
    `This assessment takes about 3–5 minutes. There are no right or wrong answers. Just tell me how things currently work in your hotel.\n\n` +
    `At the end, you'll receive your personalised Hotel Risk Report™, highlighting your strengths, priority risk gaps and practical improvement opportunities.\n\n` +
    `Shall we begin?`,
  options: [
    { key: 'A', label: 'Yes, let\'s begin' },
    { key: 'B', label: 'Tell me more' }
  ],
  transitions: {
    A: STAGES.CONSENT,
    B: 'welcome_info'
  }
};

const WELCOME_INFO = {
  id: 'welcome_info',
  ai_message:
    `CoverScore uses a structured risk discovery process. I'll ask about your hotel's operations, safety arrangements, insurance, and business resilience. I adapt my questions based on what you tell me — so no two assessments are exactly the same.\n\n` +
    `Your responses are confidential and used only to generate your risk report. Ready?`,
  options: [
    { key: 'A', label: 'Yes, let\'s begin' }
  ],
  transitions: {
    A: STAGES.CONSENT
  }
};

/* ─── CONSENT ─── */

const CONSENT_STAGE = {
  id: STAGES.CONSENT,
  ai_message:
    `Before we begin, I'll need your consent to process the information you provide and generate your CoverScore assessment and report.`,
  options: [
    { key: 'A', label: 'I agree' },
    { key: 'B', label: 'I don\'t agree' }
  ],
  transitions: {
    A: STAGES.PROFILE,
    B: 'consent_decline'
  }
};

const CONSENT_DECLINE = {
  id: 'consent_decline',
  ai_message:
    `No problem. Thank you for your time. If you change your mind, you can start a new assessment anytime. Have a great day.`,
  terminal: true
};

/* ─── PROFILE (Q1-Q3) ─── */

const PROFILE_Q1 = {
  id: 'profile_q1',
  stage: STAGES.PROFILE,
  ai_message: `What is the name of your hotel?`,
  input_type: 'text',
  capture: 'hotel_name',
  risk_objects: ['HOT_004'],
  next: 'profile_q2'
};

const PROFILE_Q2 = {
  id: 'profile_q2',
  stage: STAGES.PROFILE,
  ai_message: `And what's your name and role at the hotel?`,
  input_type: 'text',
  capture: ['respondent_name', 'respondent_role'],
  risk_objects: ['HOT_005', 'HOT_006'],
  next: 'profile_q3'
};

const PROFILE_Q3 = {
  id: 'profile_q3',
  stage: STAGES.PROFILE,
  ai_message: `Where is the hotel located?`,
  input_type: 'text',
  capture: ['city', 'state', 'country'],
  risk_objects: ['HOT_007'],
  next: 'profile_q3b'
};

const PROFILE_Q3B = {
  id: 'profile_q3b',
  stage: STAGES.PROFILE,
  ai_message: `Does the assessment you're completing cover one location or your hotel group as a whole?`,
  options: [
    { key: 'A', label: 'This location only' },
    { key: 'B', label: 'Multiple locations' }
  ],
  capture: 'scope',
  transitions: {
    A: STAGES.CONTEXT,
    B: 'profile_q3c'
  }
};

const PROFILE_Q3C = {
  id: 'profile_q3c',
  stage: STAGES.PROFILE,
  ai_message: `How many locations does the hotel group cover?`,
  input_type: 'text',
  capture: 'location_count',
  next: STAGES.CONTEXT
};

/* ─── CONTEXT (Q4-Q6) ─── */

const CONTEXT_Q4 = {
  id: 'context_q4',
  stage: STAGES.CONTEXT,
  ai_message: `How would you describe your hotel?`,
  options: [
    { key: 'A', label: 'Budget' },
    { key: 'B', label: 'Mid-range' },
    { key: 'C', label: 'Upscale' },
    { key: 'D', label: 'Luxury' },
    { key: 'E', label: 'Boutique' },
    { key: 'F', label: 'Resort' },
    { key: 'G', label: 'Business hotel' },
    { key: 'H', label: 'Other' }
  ],
  capture: 'hotel_type',
  risk_objects: ['HOT_009'],
  next: 'context_q5'
};

const CONTEXT_Q5 = {
  id: 'context_q5',
  stage: STAGES.CONTEXT,
  ai_message: `Approximately how many guest rooms does the hotel have?`,
  options: [
    { key: 'A', label: '1–20' },
    { key: 'B', label: '21–50' },
    { key: 'C', label: '51–100' },
    { key: 'D', label: '101–200' },
    { key: 'E', label: '200+' }
  ],
  capture: 'room_count',
  risk_objects: ['HOT_010'],
  next: 'context_q6'
};

const CONTEXT_Q6 = {
  id: 'context_q6',
  stage: STAGES.CONTEXT,
  ai_message: `Which facilities or services does your hotel currently operate?`,
  multi_select: [
    { key: 'A', label: 'Restaurant', activates: ['fb'] },
    { key: 'B', label: 'Bar', activates: ['fb'] },
    { key: 'C', label: 'Kitchen', activates: ['fb'] },
    { key: 'D', label: 'Swimming pool', activates: ['pool'] },
    { key: 'E', label: 'Gym', activates: ['gym'] },
    { key: 'F', label: 'Spa', activates: ['spa'] },
    { key: 'G', label: 'Event/banquet facilities', activates: [] },
    { key: 'H', label: 'Laundry', activates: [] },
    { key: 'I', label: 'Hotel vehicles', activates: ['vehicles'] },
    { key: 'J', label: 'Conference facilities', activates: [] }
  ],
  capture: 'facilities',
  risk_objects: ['HOT_011'],
  compute: (answers) => {
    const facs = answers.facilities || [];
    return {
      has_fb: facs.some(f => ['A', 'B', 'C'].includes(f)),
      has_pool: facs.includes('D'),
      has_gym: facs.includes('E'),
      has_spa: facs.includes('F'),
      has_vehicles: facs.includes('I')
    };
  },
  next: STAGES.FIRE_DISCOVERY
};

/* ─── FIRE & PROPERTY DISCOVERY (Q7) ─── */

const FIRE_Q7 = {
  id: 'fire_q7',
  stage: STAGES.FIRE_DISCOVERY,
  ai_message:
    `Let's start with one of the most important areas for any hotel. How would you describe your hotel's fire safety arrangements?`,
  options: [
    { key: 'A', label: 'Well established and regularly tested' },
    { key: 'B', label: 'In place but testing/maintenance is inconsistent' },
    { key: 'C', label: 'Basic arrangements only' },
    { key: 'D', label: 'We have significant gaps' },
    { key: 'E', label: 'I\'m not sure' }
  ],
  capture: 'fire_arrangements',
  risk_objects: ['HOT_012'],
  transitions: {
    A: STAGES.GUEST_DISCOVERY,
    B: STAGES.FIRE_BRANCH,
    C: STAGES.FIRE_BRANCH,
    D: STAGES.FIRE_BRANCH,
    E: STAGES.FIRE_BRANCH
  }
};

/* ─── FIRE BRANCH (F1-F5) ─── */

const FIRE_F1 = {
  id: 'fire_f1',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `Does the hotel have a working fire alarm or detection system?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'fire_detection',
  risk_objects: ['HOT_012'],
  transitions: {
    A: 'fire_f1_tested',
    B: 'fire_f1_nodetect',
    C: 'fire_f1_nodetect'
  }
};

const FIRE_F1_TESTED = {
  id: 'fire_f1_tested',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `How regularly is it tested?`,
  options: [
    { key: 'A', label: 'Daily' },
    { key: 'B', label: 'Weekly' },
    { key: 'C', label: 'Monthly' },
    { key: 'D', label: 'Quarterly' },
    { key: 'E', label: 'Annually' },
    { key: 'F', label: 'Irregularly' },
    { key: 'G', label: 'Never' },
    { key: 'H', label: 'Not sure' }
  ],
  capture: 'fire_detection_test_frequency',
  risk_objects: ['HOT_013'],
  transitions: {
    F: 'fire_f1_last_test',
    G: 'fire_f1_last_test',
    H: 'fire_f1_last_test',
    default: 'fire_f2'
  }
};

const FIRE_F1_LAST_TEST = {
  id: 'fire_f1_last_test',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `When was the system last tested or professionally inspected?`,
  input_type: 'text',
  capture: 'fire_detection_last_test',
  risk_objects: ['HOT_013'],
  next: 'fire_f2'
};

const FIRE_F1_NODETECT = {
  id: 'fire_f1_nodetect',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `This is a critical gap. Does the hotel have any form of fire warning or detection at all — even basic smoke detectors?`,
  options: [
    { key: 'A', label: 'Yes, basic smoke detectors' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'fire_detection_basic',
  risk_objects: ['HOT_012'],
  next: 'fire_f2'
};

const FIRE_F2 = {
  id: 'fire_f2',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `Are fire extinguishers and other fire-fighting equipment regularly inspected and maintained?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Partially' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'fire_equipment_maintenance',
  risk_objects: ['HOT_014'],
  next: 'fire_f3'
};

const FIRE_F3 = {
  id: 'fire_f3',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `Does the hotel have a documented fire evacuation procedure that staff are familiar with?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'fire_evacuation_procedure',
  risk_objects: ['HOT_015'],
  transitions: {
    A: 'fire_f3_drill',
    B: 'fire_f3_nodrill',
    C: 'fire_f3_nodrill'
  }
};

const FIRE_F3_DRILL = {
  id: 'fire_f3_drill',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `When was the last evacuation drill conducted?`,
  input_type: 'text',
  capture: 'fire_evacuation_last_drill',
  risk_objects: ['HOT_015'],
  next: 'fire_f4'
};

const FIRE_F3_NODRILL = {
  id: 'fire_f3_nodrill',
  stage: STAGES.FIRE_BRANCH,
  ai_message: `How would staff know what to do if there were a serious fire emergency?`,
  input_type: 'text',
  capture: 'fire_emergency_knowledge',
  risk_objects: ['HOT_015'],
  next: 'fire_f4'
};

const FIRE_F4 = {
  id: 'fire_f4',
  stage: STAGES.FIRE_BRANCH,
  condition: (ctx) => ctx.has_fb,
  ai_message:
    `Because your hotel operates a kitchen, I'd like to check one additional area. How often is the kitchen fire protection system inspected?`,
  options: [
    { key: 'A', label: 'Monthly' },
    { key: 'B', label: 'Quarterly' },
    { key: 'C', label: 'Twice yearly' },
    { key: 'D', label: 'Annually' },
    { key: 'E', label: 'Irregularly' },
    { key: 'F', label: 'Never' },
    { key: 'G', label: 'Not sure' }
  ],
  capture: 'kitchen_fire_inspection',
  risk_objects: ['HOT_034'],
  next: 'fire_f5'
};

const FIRE_F5 = {
  id: 'fire_f5',
  stage: STAGES.FIRE_BRANCH,
  condition: (ctx) => ctx.has_fb,
  ai_message: `Are electrical installations and major electrical equipment regularly inspected?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Partially' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'electrical_inspection',
  risk_objects: ['HOT_016'],
  next: STAGES.GUEST_DISCOVERY
};

const FIRE_F5_SKIP = {
  id: 'fire_f5_skip',
  stage: STAGES.FIRE_BRANCH,
  next: STAGES.GUEST_DISCOVERY
};

/* ─── GUEST & LIABILITY DISCOVERY (Q9) ─── */

const GUEST_Q9 = {
  id: 'guest_q9',
  stage: STAGES.GUEST_DISCOVERY,
  ai_message:
    `In the last three years, has your hotel experienced any guest accident, injury, complaint involving safety, or liability incident?`,
  options: [
    { key: 'A', label: 'No' },
    { key: 'B', label: 'Yes' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'guest_incidents',
  risk_objects: ['HOT_017'],
  transitions: {
    A: STAGES.OPERATIONS,
    B: STAGES.INCIDENT_BRANCH,
    C: 'guest_q9_clarify'
  }
};

const GUEST_Q9_CLARIFY = {
  id: 'guest_q9_clarify',
  stage: STAGES.GUEST_DISCOVERY,
  ai_message: `Could you think back — have there been any situations where a guest was hurt or complained about safety in any way?`,
  options: [
    { key: 'A', label: 'No, nothing comes to mind' },
    { key: 'B', label: 'Yes, now that you mention it' }
  ],
  capture: 'guest_incidents_clarified',
  transitions: {
    A: STAGES.OPERATIONS,
    B: STAGES.INCIDENT_BRANCH
  }
};

/* ─── INCIDENT BRANCH (I1-I4) ─── */

const INCIDENT_I1 = {
  id: 'incident_i1',
  stage: STAGES.INCIDENT_BRANCH,
  ai_message: `What happened?`,
  multi_select: [
    { key: 'A', label: 'Slip/trip/fall' },
    { key: 'B', label: 'Room accident' },
    { key: 'C', label: 'Pool/recreation incident' },
    { key: 'D', label: 'Food-related incident' },
    { key: 'E', label: 'Security incident' },
    { key: 'F', label: 'Fire-related incident' },
    { key: 'G', label: 'Vehicle incident' },
    { key: 'H', label: 'Other' }
  ],
  capture: 'incident_types',
  risk_objects: ['HOT_017', 'HOT_018'],
  next: 'incident_i2'
};

const INCIDENT_I2 = {
  id: 'incident_i2',
  stage: STAGES.INCIDENT_BRANCH,
  ai_message: `Was this a one-off incident or have similar incidents happened more than once?`,
  options: [
    { key: 'A', label: 'One-off' },
    { key: 'B', label: 'Occasional' },
    { key: 'C', label: 'Repeated' },
    { key: 'D', label: 'Frequent' },
    { key: 'E', label: 'Not sure' }
  ],
  capture: 'incident_frequency',
  risk_objects: ['HOT_018'],
  next: 'incident_i3'
};

const INCIDENT_I3 = {
  id: 'incident_i3',
  stage: STAGES.INCIDENT_BRANCH,
  ai_message: `How did the hotel respond when the incident occurred?`,
  input_type: 'text',
  capture: 'incident_response',
  risk_objects: ['HOT_019'],
  next: 'incident_i4'
};

const INCIDENT_I4 = {
  id: 'incident_i4',
  stage: STAGES.INCIDENT_BRANCH,
  ai_message: `Does the hotel currently have public or occupiers' liability insurance?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'liability_insurance',
  risk_objects: ['HOT_020'],
  next: 'recreation_check'
};

/* ─── RECREATION BRANCH ─── */

const RECREATION_CHECK = {
  id: 'recreation_check',
  stage: STAGES.RECREATION_BRANCH,
  compute_next: (ctx) => {
    if (ctx.has_pool) return 'recreation_pool';
    if (ctx.has_gym) return 'recreation_gym';
    if (ctx.has_spa) return 'recreation_spa';
    return STAGES.OPERATIONS;
  }
};

const RECREATION_POOL = {
  id: 'recreation_pool',
  stage: STAGES.RECREATION_BRANCH,
  ai_message: `Does the pool have documented safety procedures and controls?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'pool_safety',
  risk_objects: ['HOT_036'],
  transitions: {
    B: 'recreation_pool_limit',
    C: 'recreation_pool_limit',
    D: 'recreation_pool_limit',
    default: 'recreation_next'
  }
};

const RECREATION_POOL_LIMIT = {
  id: 'recreation_pool_limit',
  stage: STAGES.RECREATION_BRANCH,
  ai_message: `What is the biggest limitation today?`,
  input_type: 'text',
  capture: 'pool_safety_limitation',
  risk_objects: ['HOT_036'],
  next: 'recreation_next'
};

const RECREATION_NEXT = {
  id: 'recreation_next',
  stage: STAGES.RECREATION_BRANCH,
  compute_next: (ctx, answers) => {
    if (ctx.has_gym && !answers.gym_safety) return 'recreation_gym';
    if (ctx.has_spa && !answers.spa_safety) return 'recreation_spa';
    return STAGES.OPERATIONS;
  }
};

const RECREATION_GYM = {
  id: 'recreation_gym',
  stage: STAGES.RECREATION_BRANCH,
  ai_message: `Is gym equipment regularly inspected and maintained?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'gym_safety',
  risk_objects: ['HOT_037'],
  next: 'recreation_next'
};

const RECREATION_SPA = {
  id: 'recreation_spa',
  stage: STAGES.RECREATION_BRANCH,
  ai_message: `Does the spa have documented safety procedures and appropriate maintenance controls?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'spa_safety',
  risk_objects: ['HOT_038'],
  next: STAGES.OPERATIONS
};

/* ─── OPERATIONS (Q10) ─── */

const OPERATIONS_Q10 = {
  id: 'operations_q10',
  stage: STAGES.OPERATIONS,
  ai_message:
    `How dependent is the hotel on generators or alternative power because of unreliable public electricity?`,
  options: [
    { key: 'A', label: 'Low' },
    { key: 'B', label: 'Moderate' },
    { key: 'C', label: 'High' },
    { key: 'D', label: 'Almost completely dependent' },
    { key: 'E', label: 'Not sure' }
  ],
  capture: 'generator_dependency',
  risk_objects: ['HOT_021'],
  transitions: {
    A: 'operations_q10b',
    B: 'operations_q10b',
    C: STAGES.POWER_BRANCH,
    D: STAGES.POWER_BRANCH,
    E: 'operations_q10b'
  }
};

const OPERATIONS_Q10B = {
  id: 'operations_q10b',
  stage: STAGES.OPERATIONS,
  ai_message: `How regularly are critical equipment and systems maintained?`,
  options: [
    { key: 'A', label: 'Monthly' },
    { key: 'B', label: 'Quarterly' },
    { key: 'C', label: 'Twice yearly' },
    { key: 'D', label: 'Annually' },
    { key: 'E', label: 'Irregularly' },
    { key: 'F', label: 'Only after failure' },
    { key: 'G', label: 'Not sure' }
  ],
  capture: 'equipment_maintenance',
  risk_objects: ['HOT_023'],
  transitions: {
    E: 'operations_q10c',
    F: 'operations_q10c',
    default: 'operations_fb_check'
  }
};

const OPERATIONS_Q10C = {
  id: 'operations_q10c',
  stage: STAGES.OPERATIONS,
  ai_message: `Which critical equipment would cause the greatest disruption if it failed?`,
  input_type: 'text',
  capture: 'critical_equipment',
  risk_objects: ['HOT_023'],
  next: 'operations_fb_check'
};

const OPERATIONS_FB_CHECK = {
  id: 'operations_fb_check',
  stage: STAGES.OPERATIONS,
  compute_next: (ctx) => {
    if (ctx.has_fb) return STAGES.FB_BRANCH;
    if (ctx.has_vehicles) return STAGES.VEHICLE_BRANCH;
    return STAGES.STAFF_SAFETY;
  }
};

/* ─── POWER BRANCH (P1-P2) ─── */

const POWER_P1 = {
  id: 'power_p1',
  stage: STAGES.POWER_BRANCH,
  ai_message: `How often are your generators serviced?`,
  options: [
    { key: 'A', label: 'Monthly' },
    { key: 'B', label: 'Quarterly' },
    { key: 'C', label: 'Twice yearly' },
    { key: 'D', label: 'Annually' },
    { key: 'E', label: 'Irregularly' },
    { key: 'F', label: 'Only when there\'s a problem' },
    { key: 'G', label: 'Not sure' }
  ],
  capture: 'generator_service_frequency',
  risk_objects: ['HOT_022'],
  next: 'power_p2'
};

const POWER_P2 = {
  id: 'power_p2',
  stage: STAGES.POWER_BRANCH,
  ai_message:
    `If your main generator failed unexpectedly, how long could the hotel operate normally before the failure seriously disrupted operations?`,
  options: [
    { key: 'A', label: 'Less than 4 hours' },
    { key: 'B', label: '4–12 hours' },
    { key: 'C', label: '12–24 hours' },
    { key: 'D', label: '1–3 days' },
    { key: 'E', label: 'More than 3 days' },
    { key: 'F', label: 'Not sure' }
  ],
  capture: 'generator_failure_tolerance',
  risk_objects: ['HOT_022'],
  next: 'operations_q10b'
};

/* ─── F&B BRANCH (FB1-FB3) ─── */

const FB_FB1 = {
  id: 'fb_fb1',
  stage: STAGES.FB_BRANCH,
  ai_message: `How would you describe your hotel's food safety controls?`,
  options: [
    { key: 'A', label: 'Formal and consistently enforced' },
    { key: 'B', label: 'Formal but inconsistently enforced' },
    { key: 'C', label: 'Basic controls' },
    { key: 'D', label: 'Mostly informal' },
    { key: 'E', label: 'Significant gaps' },
    { key: 'F', label: 'Not sure' }
  ],
  capture: 'food_safety_controls',
  risk_objects: ['HOT_034'],
  next: 'fb_fb2'
};

const FB_FB2 = {
  id: 'fb_fb2',
  stage: STAGES.FB_BRANCH,
  ai_message: `Has the hotel experienced any suspected food contamination or foodborne illness incident?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'food_contamination_incident',
  risk_objects: ['HOT_035'],
  transitions: {
    A: 'fb_fb2_detail',
    default: 'fb_fb3'
  }
};

const FB_FB2_DETAIL = {
  id: 'fb_fb2_detail',
  stage: STAGES.FB_BRANCH,
  ai_message: `Can you briefly describe what happened?`,
  input_type: 'text',
  capture: 'food_contamination_detail',
  risk_objects: ['HOT_035'],
  next: 'fb_fb3'
};

const FB_FB3 = {
  id: 'fb_fb3',
  stage: STAGES.FB_BRANCH,
  ai_message: `How often is the kitchen professionally inspected or reviewed for safety?`,
  options: [
    { key: 'A', label: 'Monthly' },
    { key: 'B', label: 'Quarterly' },
    { key: 'C', label: 'Twice yearly' },
    { key: 'D', label: 'Annually' },
    { key: 'E', label: 'Irregularly' },
    { key: 'F', label: 'Never' },
    { key: 'G', label: 'Not sure' }
  ],
  capture: 'kitchen_inspection_frequency',
  risk_objects: ['HOT_034'],
  next: 'fb_vehicle_check'
};

const FB_VEHICLE_CHECK = {
  id: 'fb_vehicle_check',
  stage: STAGES.FB_BRANCH,
  compute_next: (ctx) => {
    if (ctx.has_vehicles) return STAGES.VEHICLE_BRANCH;
    return STAGES.STAFF_SAFETY;
  }
};

/* ─── VEHICLE BRANCH ─── */

const VEHICLE_Q = {
  id: 'vehicle_q',
  stage: STAGES.VEHICLE_BRANCH,
  ai_message: `Does the hotel maintain a documented inspection and maintenance schedule for its vehicles?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'vehicle_maintenance_schedule',
  risk_objects: ['HOT_041'],
  transitions: {
    A: 'vehicle_q_records',
    default: 'vehicle_q_records'
  }
};

const VEHICLE_Q_RECORDS = {
  id: 'vehicle_q_records',
  stage: STAGES.VEHICLE_BRANCH,
  ai_message: `Are those records kept up to date?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'vehicle_records_current',
  risk_objects: ['HOT_041'],
  next: STAGES.STAFF_SAFETY
};

/* ─── STAFF SAFETY (Q11-Q12) ─── */

const STAFF_Q11 = {
  id: 'staff_q11',
  stage: STAGES.STAFF_SAFETY,
  ai_message: `How would you describe the hotel's employee safety procedures?`,
  options: [
    { key: 'A', label: 'Formal and consistently implemented' },
    { key: 'B', label: 'Formal but inconsistent' },
    { key: 'C', label: 'Basic procedures' },
    { key: 'D', label: 'Mostly informal' },
    { key: 'E', label: 'Significant gaps' },
    { key: 'F', label: 'Not sure' }
  ],
  capture: 'employee_safety_procedures',
  risk_objects: ['HOT_024'],
  transitions: {
    D: STAGES.STAFF_BRANCH,
    E: STAGES.STAFF_BRANCH,
    F: STAGES.STAFF_BRANCH,
    default: 'staff_q12'
  }
};

const STAFF_BRANCH_Q = {
  id: 'staff_branch_q',
  stage: STAGES.STAFF_BRANCH,
  ai_message: `Which areas receive the most attention?`,
  multi_select: [
    { key: 'A', label: 'Training' },
    { key: 'B', label: 'PPE' },
    { key: 'C', label: 'Emergency procedures' },
    { key: 'D', label: 'Incident reporting' },
    { key: 'E', label: 'Occupational hazards' },
    { key: 'F', label: 'Welfare' }
  ],
  capture: 'staff_safety_focus_areas',
  risk_objects: ['HOT_024'],
  next: 'staff_q12'
};

const STAFF_Q12 = {
  id: 'staff_q12',
  stage: STAGES.STAFF_SAFETY,
  ai_message:
    `Are employees covered by any formal employee protection arrangements such as Group Life, Personal Accident or health coverage?`,
  options: [
    { key: 'A', label: 'Most employees' },
    { key: 'B', label: 'Some employees' },
    { key: 'C', label: 'Only selected employees' },
    { key: 'D', label: 'None' },
    { key: 'E', label: 'Not sure' }
  ],
  capture: 'employee_protection',
  risk_objects: ['HOT_025'],
  transitions: {
    B: 'staff_q12_gap',
    D: 'staff_q12_gap',
    default: STAGES.SECURITY
  }
};

const STAFF_Q12_GAP = {
  id: 'staff_q12_gap',
  stage: STAGES.STAFF_SAFETY,
  ai_message: `Which employees are not covered?`,
  input_type: 'text',
  capture: 'employee_protection_gap',
  risk_objects: ['HOT_025'],
  next: STAGES.SECURITY
};

/* ─── SECURITY (Q13) ─── */

const SECURITY_Q13 = {
  id: 'security_q13',
  stage: STAGES.SECURITY,
  ai_message: `How would you describe the hotel's current security arrangements?`,
  options: [
    { key: 'A', label: 'Comprehensive' },
    { key: 'B', label: 'Good' },
    { key: 'C', label: 'Basic' },
    { key: 'D', label: 'Weak' },
    { key: 'E', label: 'Significant gaps' },
    { key: 'F', label: 'Not sure' }
  ],
  capture: 'security_arrangements',
  risk_objects: ['HOT_026'],
  transitions: {
    C: STAGES.SECURITY_BRANCH,
    D: STAGES.SECURITY_BRANCH,
    E: STAGES.SECURITY_BRANCH,
    default: STAGES.DIGITAL
  }
};

const SECURITY_BRANCH_Q = {
  id: 'security_branch_q',
  stage: STAGES.SECURITY_BRANCH,
  ai_message: `Which security controls do you currently have?`,
  multi_select: [
    { key: 'A', label: 'CCTV' },
    { key: 'B', label: 'Access control' },
    { key: 'C', label: 'Security personnel' },
    { key: 'D', label: 'Visitor records' },
    { key: 'E', label: 'Emergency response' },
    { key: 'F', label: 'Room/key controls' },
    { key: 'G', label: 'Perimeter security' },
    { key: 'H', label: 'Incident reporting' }
  ],
  capture: 'security_controls',
  risk_objects: ['HOT_026'],
  next: 'security_cctv_check'
};

const SECURITY_CCTV_CHECK = {
  id: 'security_cctv_check',
  stage: STAGES.SECURITY_BRANCH,
  condition: (ctx, answers) => {
    const controls = answers.security_controls || [];
    return controls.includes('A');
  },
  ai_message: `Is CCTV actively monitored and are recordings retained for an appropriate period?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'cctv_effective',
  risk_objects: ['HOT_027'],
  next: STAGES.DIGITAL
};

const SECURITY_CCTV_SKIP = {
  id: 'security_cctv_skip',
  stage: STAGES.SECURITY_BRANCH,
  next: STAGES.DIGITAL
};

/* ─── DIGITAL & CYBER (Q14) ─── */

const DIGITAL_Q14 = {
  id: 'digital_q14',
  stage: STAGES.DIGITAL,
  ai_message:
    `Does your hotel rely on digital systems such as booking platforms, POS, payment systems, guest databases or cloud software to operate?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' }
  ],
  capture: 'digital_dependence',
  risk_objects: ['HOT_028'],
  transitions: {
    A: STAGES.CYBER_BRANCH,
    B: STAGES.FINANCIAL
  }
};

const CYBER_Q = {
  id: 'cyber_q',
  stage: STAGES.CYBER_BRANCH,
  ai_message:
    `How would you describe your hotel's protection of its important digital systems and guest information?`,
  options: [
    { key: 'A', label: 'Strong controls' },
    { key: 'B', label: 'Adequate' },
    { key: 'C', label: 'Basic' },
    { key: 'D', label: 'Weak' },
    { key: 'E', label: 'Not sure' }
  ],
  capture: 'cyber_protection',
  risk_objects: ['HOT_029'],
  transitions: {
    D: 'cyber_backups',
    E: 'cyber_backups',
    default: 'cyber_recovery'
  }
};

const CYBER_BACKUPS = {
  id: 'cyber_backups',
  stage: STAGES.CYBER_BRANCH,
  ai_message: `Do you have regular backups of critical hotel data?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'No' },
    { key: 'C', label: 'Not sure' }
  ],
  capture: 'data_backups',
  risk_objects: ['HOT_029'],
  next: 'cyber_recovery'
};

const CYBER_RECOVERY = {
  id: 'cyber_recovery',
  stage: STAGES.CYBER_BRANCH,
  ai_message:
    `What would happen if your booking or payment system became unavailable for several days?`,
  input_type: 'text',
  capture: 'digital_recovery_plan',
  risk_objects: ['HOT_030'],
  next: STAGES.FINANCIAL
};

/* ─── FINANCIAL (Q15) ─── */

const FINANCIAL_Q15 = {
  id: 'financial_q15',
  stage: STAGES.FINANCIAL,
  ai_message: `How would you describe your hotel's financial controls and oversight?`,
  options: [
    { key: 'A', label: 'Strong' },
    { key: 'B', label: 'Good' },
    { key: 'C', label: 'Basic' },
    { key: 'D', label: 'Weak' },
    { key: 'E', label: 'Significant gaps' },
    { key: 'F', label: 'Not sure' }
  ],
  capture: 'financial_controls',
  risk_objects: ['HOT_031'],
  transitions: {
    C: 'financial_deep',
    D: 'financial_deep',
    E: 'financial_deep',
    default: STAGES.INSURANCE
  }
};

const FINANCIAL_DEEP = {
  id: 'financial_deep',
  stage: STAGES.FINANCIAL,
  ai_message: `Does the hotel have clear controls around cash, payments, approvals and reconciliation?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' }
  ],
  capture: 'financial_controls_detail',
  risk_objects: ['HOT_031'],
  next: STAGES.INSURANCE
};

/* ─── INSURANCE (Q16-Q17) ─── */

const INSURANCE_Q16 = {
  id: 'insurance_q16',
  stage: STAGES.INSURANCE,
  ai_message:
    `Which of these areas does your hotel currently have insurance protection for?`,
  multi_select: [
    { key: 'A', label: 'Building/property' },
    { key: 'B', label: 'Fire' },
    { key: 'C', label: 'Public liability' },
    { key: 'D', label: 'Occupiers\' liability' },
    { key: 'E', label: 'Group Life' },
    { key: 'F', label: 'Personal Accident' },
    { key: 'G', label: 'Equipment' },
    { key: 'H', label: 'Money' },
    { key: 'I', label: 'Fidelity Guarantee' },
    { key: 'J', label: 'Business interruption' },
    { key: 'K', label: 'Motor' },
    { key: 'L', label: 'Cyber' },
    { key: 'M', label: 'Other' },
    { key: 'N', label: 'None' },
    { key: 'O', label: 'Not sure' }
  ],
  capture: 'insurance_coverage',
  risk_objects: ['HOT_032'],
  next: 'insurance_q17'
};

const INSURANCE_Q17 = {
  id: 'insurance_q17',
  stage: STAGES.INSURANCE,
  ai_message:
    `How confident are you that your current insurance arrangements adequately protect the hotel's major exposures?`,
  options: [
    { key: 'A', label: 'Very confident' },
    { key: 'B', label: 'Fairly confident' },
    { key: 'C', label: 'Not very confident' },
    { key: 'D', label: 'Not confident' },
    { key: 'E', label: 'Not sure' }
  ],
  capture: 'insurance_confidence',
  risk_objects: ['HOT_032'],
  transitions: {
    C: 'insurance_q17_gap',
    D: 'insurance_q17_gap',
    E: 'insurance_q17_gap',
    default: STAGES.CONTINUITY
  }
};

const INSURANCE_Q17_GAP = {
  id: 'insurance_q17_gap',
  stage: STAGES.INSURANCE,
  ai_message: `Which area are you least confident about?`,
  input_type: 'text',
  capture: 'insurance_least_confident',
  risk_objects: ['HOT_032'],
  next: STAGES.CONTINUITY
};

/* ─── BUSINESS CONTINUITY (Q18-Q19) ─── */

const CONTINUITY_Q18 = {
  id: 'continuity_q18',
  stage: STAGES.CONTINUITY,
  ai_message: `Does the hotel have a documented business continuity or disaster recovery plan?`,
  options: [
    { key: 'A', label: 'Yes' },
    { key: 'B', label: 'Partially' },
    { key: 'C', label: 'No' },
    { key: 'D', label: 'Not sure' }
  ],
  capture: 'bc_plan',
  risk_objects: ['HOT_033'],
  transitions: {
    A: 'continuity_q18_reviewed',
    default: 'continuity_q18_no'
  }
};

const CONTINUITY_Q18_REVIEWED = {
  id: 'continuity_q18_reviewed',
  stage: STAGES.CONTINUITY,
  ai_message: `When was it last reviewed or tested?`,
  input_type: 'text',
  capture: 'bc_plan_last_reviewed',
  risk_objects: ['HOT_033'],
  next: 'revenue_q19'
};

const CONTINUITY_Q18_NO = {
  id: 'continuity_q18_no',
  stage: STAGES.CONTINUITY,
  ai_message:
    `If a major incident suddenly prevented the hotel from operating normally, who would coordinate the response?`,
  input_type: 'text',
  capture: 'bc_informal_response',
  risk_objects: ['HOT_033'],
  next: 'revenue_q19'
};

const REVENUE_Q19 = {
  id: 'revenue_q19',
  stage: STAGES.REVENUE_RESILIENCE,
  ai_message:
    `If your hotel suddenly lost its normal room revenue, how long could it continue meeting essential operating expenses?`,
  options: [
    { key: 'A', label: 'Less than 1 month' },
    { key: 'B', label: '1–3 months' },
    { key: 'C', label: '3–6 months' },
    { key: 'D', label: '6–12 months' },
    { key: 'E', label: 'More than 12 months' },
    { key: 'F', label: 'Not sure' }
  ],
  capture: 'revenue_resilience',
  risk_objects: ['HOT_043'],
  next: 'ops_dep_q'
};

const OPS_DEP_Q = {
  id: 'ops_dep_q',
  stage: STAGES.OPERATIONAL_DEPENDENCY,
  ai_message:
    `Which single failure would cause the greatest disruption to your hotel today?`,
  options: [
    { key: 'A', label: 'Power' },
    { key: 'B', label: 'Water' },
    { key: 'C', label: 'Fire incident' },
    { key: 'D', label: 'Key equipment' },
    { key: 'E', label: 'Booking/POS system' },
    { key: 'F', label: 'Staff shortage' },
    { key: 'G', label: 'Security incident' },
    { key: 'H', label: 'Loss of building' },
    { key: 'I', label: 'Supply disruption' },
    { key: 'J', label: 'Other' }
  ],
  capture: 'critical_single_point_of_failure',
  risk_objects: ['HOT_044'],
  next: STAGES.CLIENT_CONCERN
};

/* ─── CLIENT CONCERN (Q20) ─── */

const CLIENT_CONCERN_Q20 = {
  id: 'client_concern_q20',
  stage: STAGES.CLIENT_CONCERN,
  ai_message:
    `We've covered the major areas. Before I calculate your results, there's one question I'd really like to ask you personally:\n\n` +
    `What is the biggest risk or challenge you worry about affecting your hotel?`,
  input_type: 'text',
  capture: 'user_expressed_concern',
  risk_objects: ['HOT_051'],
  next: 'final_validation_check'
};

/* ─── FINAL VALIDATION ─── */

const FINAL_VALIDATION_CHECK = {
  id: 'final_validation_check',
  stage: STAGES.FINAL_VALIDATION,
  ai_message:
    `I have enough information to prepare your assessment. There are just a few areas I'd like to clarify before I generate your report.`,
  compute_next: (ctx) => {
    const unresolved = [];
    if (!ctx.fire_detection || ctx.fire_detection === 'C') unresolved.push('fire_control');
    if (!ctx.guest_incidents_clarified && ctx.guest_incidents === 'C') unresolved.push('incident');
    if (ctx.insurance_confidence === 'C' || ctx.insurance_confidence === 'D' || ctx.insurance_confidence === 'E') unresolved.push('insurance');
    if (!ctx.bc_plan || ctx.bc_plan === 'C') unresolved.push('bc_plan');
    if (unresolved.length === 0) return STAGES.COMPLETION;
    ctx._unresolved = unresolved;
    ctx._validationIndex = 0;
    return 'final_validation_q';
  }
};

const FINAL_VALIDATION_Q = {
  id: 'final_validation_q',
  stage: STAGES.FINAL_VALIDATION,
  compute_message: (ctx) => {
    const topics = ctx._unresolved || [];
    const idx = ctx._validationIndex || 0;
    if (idx >= topics.length) return null;
    const topic = topics[idx];
    const messages = {
      fire_control: `Could you confirm — when was your fire detection system last professionally inspected?`,
      incident: `Just to clarify — have there been any guest safety incidents in the last 3 years that we haven't covered?`,
      insurance: `Could you confirm — which specific insurance policies does the hotel currently hold?`,
      bc_plan: `Could you confirm — does the hotel have any form of business continuity plan, even if informal?`
    };
    return messages[topic] || null;
  },
  compute_next: (ctx) => {
    const topics = ctx._unresolved || [];
    const idx = (ctx._validationIndex || 0) + 1;
    ctx._validationIndex = idx;
    if (idx >= topics.length) return STAGES.COMPLETION;
    return 'final_validation_q';
  }
};

/* ─── COMPLETION ─── */

const COMPLETION_STAGE = {
  id: STAGES.COMPLETION,
  ai_message:
    `Thank you. I now have enough information to prepare your Hotel Risk Report™.\n\n` +
    `Your personalised report is being generated. It will include:\n` +
    `• Your overall CoverScore™\n` +
    `• Pillar-by-pillar breakdown\n` +
    `• Priority risk gaps with evidence\n` +
    `• Practical improvement recommendations\n\n` +
    `One moment please...`,
  terminal: true
};

/* ─── NODE REGISTRY ─── */

const ALL_NODES = [
  WELCOME_STAGE, WELCOME_INFO,
  CONSENT_STAGE, CONSENT_DECLINE,
  PROFILE_Q1, PROFILE_Q2, PROFILE_Q3, PROFILE_Q3B, PROFILE_Q3C,
  CONTEXT_Q4, CONTEXT_Q5, CONTEXT_Q6,
  FIRE_Q7,
  FIRE_F1, FIRE_F1_TESTED, FIRE_F1_LAST_TEST, FIRE_F1_NODETECT,
  FIRE_F2, FIRE_F3, FIRE_F3_DRILL, FIRE_F3_NODRILL,
  FIRE_F4, FIRE_F5, FIRE_F5_SKIP,
  GUEST_Q9, GUEST_Q9_CLARIFY,
  INCIDENT_I1, INCIDENT_I2, INCIDENT_I3, INCIDENT_I4,
  RECREATION_CHECK, RECREATION_POOL, RECREATION_POOL_LIMIT, RECREATION_NEXT,
  RECREATION_GYM, RECREATION_SPA,
  OPERATIONS_Q10, OPERATIONS_Q10B, OPERATIONS_Q10C, OPERATIONS_FB_CHECK,
  POWER_P1, POWER_P2,
  FB_FB1, FB_FB2, FB_FB2_DETAIL, FB_FB3, FB_VEHICLE_CHECK,
  VEHICLE_Q, VEHICLE_Q_RECORDS,
  STAFF_Q11, STAFF_BRANCH_Q, STAFF_Q12, STAFF_Q12_GAP,
  SECURITY_Q13, SECURITY_BRANCH_Q, SECURITY_CCTV_CHECK, SECURITY_CCTV_SKIP,
  DIGITAL_Q14, CYBER_Q, CYBER_BACKUPS, CYBER_RECOVERY,
  FINANCIAL_Q15, FINANCIAL_DEEP,
  INSURANCE_Q16, INSURANCE_Q17, INSURANCE_Q17_GAP,
  CONTINUITY_Q18, CONTINUITY_Q18_REVIEWED, CONTINUITY_Q18_NO,
  REVENUE_Q19, OPS_DEP_Q,
  CLIENT_CONCERN_Q20,
  FINAL_VALIDATION_CHECK, FINAL_VALIDATION_Q,
  COMPLETION_STAGE
];

const NODE_MAP = {};
for (const node of ALL_NODES) {
  NODE_MAP[node.id] = node;
}

/* ─── STATE MACHINE ─── */

class HotelAssessmentFlow {
  constructor() {
    this.nodes = NODE_MAP;
    this.startNode = STAGES.WELCOME;
  }

  /**
   * Get the initial state for a new assessment
   */
  getInitialState() {
    return {
      currentNode: this.startNode,
      answers: {},
      context: {
        has_fb: false,
        has_pool: false,
        has_gym: false,
        has_spa: false,
        has_vehicles: false,
        _unresolved: [],
        _validationIndex: 0
      },
      riskObjectsActivated: [],
      completedStages: [],
      interactionCount: 0,
      status: 'in_progress'
    };
  }

  /**
   * Get the current node's message/options
   */
  getCurrentNode(state) {
    const node = this.nodes[state.currentNode];
    if (!node) return null;

    // Handle conditional nodes
    if (node.condition && !node.condition(state.context, state.answers)) {
      // Skip this node, go to next
      return this.transition(state, 'default');
    }

    // Handle compute_next nodes (no user input needed)
    if (node.compute_next && !node.ai_message) {
      const next = node.compute_next(state.context, state.answers);
      return this.transition(state, 'default', next);
    }

    // Build response
    const response = {
      nodeId: node.id,
      stage: node.stage,
      ai_message: node.ai_message || '',
      terminal: node.terminal || false,
      interactionCount: state.interactionCount + 1
    };

    if (node.options) {
      response.options = node.options;
    }
    if (node.multi_select) {
      response.multi_select = node.multi_select;
      response.input_type = 'multi_select';
    }
    if (node.input_type === 'text') {
      response.input_type = 'text';
    }

    // Handle compute_message
    if (node.compute_message) {
      const msg = node.compute_message(state.context);
      if (!msg) {
        // No more questions, advance
        const next = node.compute_next(state.context);
        return this.transition(state, 'default', next);
      }
      response.ai_message = msg;
    }

    return response;
  }

  /**
   * Resolve a raw next-node value to an actual node ID
   * Handles stage constants → first question in stage
   */
  resolveNodeId(raw) {
    if (!raw) return null;
    // If it's a known node, use it directly
    if (this.nodes[raw]) return raw;
    // If it's a stage constant, map to first question
    if (STAGE_ENTRY_MAP[raw]) return STAGE_ENTRY_MAP[raw];
    // Fallback
    return raw;
  }

  /**
   * Process user input and return next state
   */
  processInput(state, input) {
    const node = this.nodes[state.currentNode];
    if (!node) return { state, error: 'Invalid node' };

    const newState = { ...state, interactionCount: state.interactionCount + 1 };

    // Capture the answer
    if (node.capture) {
      if (Array.isArray(node.capture)) {
        // Multi-field capture (e.g., name + role)
        if (typeof input === 'string') {
          const parts = input.split(/[,\n]+/).map(s => s.trim());
          node.capture.forEach((field, i) => {
            newState.answers[field] = parts[i] || '';
          });
        }
      } else {
        newState.answers[node.capture] = input;
      }
    }

    // Record activated risk objects
    if (node.risk_objects) {
      newState.riskObjectsActivated = [
        ...new Set([...newState.riskObjectsActivated, ...node.risk_objects])
      ];
    }

    // Record completed stage
    if (node.stage && !newState.completedStages.includes(node.stage)) {
      newState.completedStages = [...newState.completedStages, node.stage];
    }

    // Update context with compute results
    if (node.compute) {
      const computed = node.compute(newState.answers);
      newState.context = { ...newState.context, ...computed };
    }

    // Determine next node
    let nextNode;
    if (node.transitions) {
      nextNode = node.transitions[input] || node.transitions.default;
    }
    if (!nextNode && node.compute_next) {
      nextNode = node.compute_next(newState.context, newState.answers);
    }
    if (!nextNode) {
      nextNode = node.next;
    }

    newState.currentNode = this.resolveNodeId(nextNode) || STAGES.COMPLETION;
    return { state: newState };
  }

  /**
   * Transition to a specific node
   */
  transition(state, input, overrideNext) {
    const node = this.nodes[state.currentNode];
    if (!node) return { state, error: 'Invalid node' };

    const newState = { ...state, interactionCount: state.interactionCount + 1 };

    if (node.capture && input !== 'default') {
      newState.answers[node.capture] = input;
    }

    if (node.risk_objects) {
      newState.riskObjectsActivated = [
        ...new Set([...newState.riskObjectsActivated, ...node.risk_objects])
      ];
    }

    if (node.stage && !newState.completedStages.includes(node.stage)) {
      newState.completedStages = [...newState.completedStages, node.stage];
    }

    let nextNode;
    if (node.transitions) {
      nextNode = node.transitions[input] || node.transitions.default;
    }
    if (!nextNode && node.compute_next) {
      nextNode = node.compute_next(newState.context, newState.answers);
    }
    if (!nextNode) {
      nextNode = node.next;
    }

    newState.currentNode = this.resolveNodeId(overrideNext || nextNode) || STAGES.COMPLETION;
    return this.getCurrentNode(newState);
  }

  /**
   * Check if assessment is complete
   */
  isComplete(state) {
    return state.currentNode === STAGES.COMPLETION ||
           state.currentNode === 'consent_decline' ||
           (this.nodes[state.currentNode] && this.nodes[state.currentNode].terminal);
  }

  /**
   * Get assessment completion metrics
   */
  getCompletionMetrics(state) {
    const { context, answers, completedStages } = state;
    return {
      profile_complete: !!(answers.hotel_name && answers.respondent_name),
      context_complete: !!(answers.hotel_type && answers.room_count),
      exposures_discovered: completedStages.includes(STAGES.FIRE_DISCOVERY) ||
                            completedStages.includes(STAGES.GUEST_DISCOVERY) ||
                            completedStages.includes(STAGES.OPERATIONS),
      evidence_sufficient: state.interactionCount >= 15,
      critical_branches_resolved: true,
      protection_established: completedStages.includes(STAGES.INSURANCE),
      resilience_established: completedStages.includes(STAGES.CONTINUITY),
      client_concern_captured: !!answers.user_expressed_concern
    };
  }
}

module.exports = {
  HotelAssessmentFlow,
  STAGES,
  BRANCH_PRIORITY,
  ASSESSMENT_COMPLETE_FIELDS,
  NODE_MAP
};
