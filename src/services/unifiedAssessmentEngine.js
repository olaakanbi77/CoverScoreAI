/**
 * Unified Assessment Engine v2 — Radical Simplification
 *
 * One Assessment Engine. Two Channels. 20-25 interactions.
 *
 * Core Principles:
 * 1. Don't ask what the system already knows
 * 2. 1 Discovery → 1 Adaptive Follow-up → Stop (1-1-1 Rule)
 * 3. Evidence sufficiency drives every decision
 * 4. Profile compressed to 4 interactions
 * 5. Facility discovery = 1 multi-select
 * 6. Big Five risk discovery approach
 */

const { normaliseAnswer } = require('./answerNormalizer');
const { checkNewAnswerContradiction } = require('./contradictionDetector');
const { isUncertainAnswer } = require('./uncertaintyTracker');
const { RISK_OBJECTS, getActivatedRiskObjects } = require('../config/scoring/hotelRiskObjects');

// ─── STAGES ───

const STAGES = {
  WELCOME: 'WELCOME',
  CONSENT: 'CONSENT',
  PROFILE: 'PROFILE',
  FACILITIES: 'FACILITIES',
  FIRE: 'FIRE',
  GUEST_SAFETY: 'GUEST_SAFETY',
  INCIDENT: 'INCIDENT',
  OPERATIONS: 'OPERATIONS',
  POWER: 'POWER',
  CRITICAL_DEP: 'CRITICAL_DEP',
  STAFF: 'STAFF',
  SECURITY: 'SECURITY',
  DIGITAL: 'DIGITAL',
  FINANCIAL: 'FINANCIAL',
  INSURANCE: 'INSURANCE',
  FACILITY_BRANCH: 'FACILITY_BRANCH',
  CLIENT_CONCERN: 'CLIENT_CONCERN',
  VALIDATION: 'VALIDATION',
  COMPLETION: 'COMPLETION',
};

// ─── NODE GRAPH (20-25 core + adaptive) ───

const NODES = [
  // ═══════════════════════════════════════
  // 01 — WELCOME
  // ═══════════════════════════════════════
  { id: 'welcome', stage: STAGES.WELCOME, type: 'option',
    ai_message: "Welcome to CoverScore. I'll help you quickly identify the biggest risks and resilience gaps affecting your hotel. It takes about 3 to 5 minutes and you'll receive your personalised Hotel Risk Report immediately. There are no right or wrong answers. Shall we begin?",
    options: [{ key: 'A', label: 'Yes, let\'s begin' }, { key: 'B', label: 'Tell me more' }],
    transitions: { A: 'consent', B: 'welcome_more' } },
  { id: 'welcome_more', stage: STAGES.WELCOME, type: 'option',
    ai_message: 'CoverScore assesses your hotel across fire safety, guest protection, operations, security, digital resilience, insurance and business continuity. Your answers help us identify where the biggest risks and gaps are. Ready?',
    options: [{ key: 'A', label: 'Yes, let\'s begin' }, { key: 'B', label: 'Not now' }],
    transitions: { A: 'consent', B: 'consent_decline' } },

  // ═══════════════════════════════════════
  // 02 — CONSENT
  // ═══════════════════════════════════════
  { id: 'consent', stage: STAGES.CONSENT, type: 'option',
    ai_message: 'Before we begin, may I use your responses to prepare your personalised Hotel Risk Report and contact you about your results?',
    options: [{ key: 'A', label: 'I Agree' }, { key: 'B', label: 'Not Now' }],
    capture: 'consent',
    transitions: { A: 'profile_q1', B: 'consent_decline' } },
  { id: 'consent_decline', stage: STAGES.CONSENT, type: 'terminal',
    ai_message: 'No problem. Your information will not be stored. You can restart anytime.' },

  // ═══════════════════════════════════════
  // 03 — BUSINESS PROFILE (4 interactions)
  // ═══════════════════════════════════════
  { id: 'profile_q1', stage: STAGES.PROFILE, type: 'text',
    ai_message: "What's the name of your hotel, and what's your name?",
    capture: ['hotel_name', 'respondent_name'], risk_objects: ['HOT_004', 'HOT_005'],
    next: 'profile_q2' },
  { id: 'profile_q2', stage: STAGES.PROFILE, type: 'text',
    ai_message: "What's your role and where is the hotel located?",
    capture: ['respondent_role', 'hotel_location'], risk_objects: ['HOT_006', 'HOT_007'],
    next: 'profile_q3' },
  { id: 'profile_q3', stage: STAGES.PROFILE, type: 'option',
    ai_message: 'Which best describes your hotel and approximately how many rooms does it have?',
    options: [
      { key: 'A', label: 'Budget / limited service (under 30 rooms)' },
      { key: 'B', label: 'Mid-range (30–100 rooms)' },
      { key: 'C', label: 'Full-service / upscale (100–250 rooms)' },
      { key: 'D', label: 'Large / resort (250+ rooms)' },
      { key: 'E', label: 'Boutique / lifestyle' },
    ],
    capture: 'hotel_type', risk_objects: ['HOT_009'],
    transitions: { default: 'profile_q4' } },
  { id: 'profile_q4', stage: STAGES.PROFILE, type: 'option',
    ai_message: 'How long has the hotel been operating?',
    options: [
      { key: 'A', label: 'Under 2 years' },
      { key: 'B', label: '2–5 years' },
      { key: 'C', label: '5+ years' },
    ],
    capture: 'years_operating', next: 'facility_q' },

  // ═══════════════════════════════════════
  // 04 — FACILITY DISCOVERY (1 interaction)
  // ═══════════════════════════════════════
  { id: 'facility_q', stage: STAGES.FACILITIES, type: 'multi_select',
    ai_message: 'Which facilities or services does your hotel operate? Select all that apply.',
    multi_select: [
      { key: 'fb', label: 'Restaurant / Kitchen' },
      { key: 'pool', label: 'Swimming Pool' },
      { key: 'gym', label: 'Gym / Fitness Centre' },
      { key: 'spa', label: 'Spa / Wellness' },
      { key: 'events', label: 'Events / Conference' },
      { key: 'vehicles', label: 'Hotel Vehicles' },
      { key: 'laundry', label: 'Laundry' },
    ],
    capture: 'facilities', risk_objects: ['HOT_011'],
    compute: (answers) => {
      const f = answers.facilities || [];
      return {
        has_fb: f.includes('fb'),
        has_pool: f.includes('pool'),
        has_gym: f.includes('gym'),
        has_spa: f.includes('spa'),
        has_vehicles: f.includes('vehicles'),
        has_events: f.includes('events'),
        has_laundry: f.includes('laundry'),
      };
    },
    next: 'fire_q' },

  // ═══════════════════════════════════════
  // 05 — FIRE SAFETY (1-1-1 Rule)
  // ═══════════════════════════════════════
  { id: 'fire_q', stage: STAGES.FIRE, type: 'option',
    ai_message: 'How would you describe your hotel\'s fire safety readiness?',
    options: [
      { key: 'A', label: 'Strong — regularly tested and maintained' },
      { key: 'B', label: 'In place but inconsistent' },
      { key: 'C', label: 'Basic / significant gaps' },
      { key: 'D', label: 'Not sure' },
    ],
    capture: 'fire_safety', risk_objects: ['HOT_012'],
    transitions: { A: 'guest_safety_q', B: 'fire_followup', C: 'fire_followup', D: 'fire_followup' } },
  { id: 'fire_followup', stage: STAGES.FIRE, type: 'option',
    ai_message: 'Are your fire alarms and fire-fighting equipment regularly tested and maintained?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partially' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'fire_controls', risk_objects: ['HOT_013', 'HOT_014'],
    next: 'guest_safety_q' },

  // ═══════════════════════════════════════
  // 06 — GUEST SAFETY (1-1-1 Rule)
  // ═══════════════════════════════════════
  { id: 'guest_safety_q', stage: STAGES.GUEST_SAFETY, type: 'option',
    ai_message: 'How confident are you in your hotel\'s ability to prevent and respond to guest accidents or liability incidents?',
    options: [
      { key: 'A', label: 'Very confident' },
      { key: 'B', label: 'Fairly confident' },
      { key: 'C', label: 'Not very confident' },
      { key: 'D', label: 'Not confident' },
      { key: 'E', label: 'Not sure' },
    ],
    capture: 'guest_safety_confidence', risk_objects: ['HOT_017'],
    transitions: { C: 'guest_incident_q', D: 'guest_incident_q', E: 'guest_incident_q', default: 'operations_q' } },
  { id: 'guest_incident_q', stage: STAGES.INCIDENT, type: 'option',
    ai_message: 'Have you experienced any significant guest accident, injury or liability incident in the last three years?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'No' }, { key: 'C', label: 'Not sure' }],
    capture: 'guest_incidents', risk_objects: ['HOT_017'],
    transitions: { A: 'incident_type_q', default: 'operations_q' } },
  { id: 'incident_type_q', stage: STAGES.INCIDENT, type: 'option',
    ai_message: 'What type of incident was it?',
    options: [
      { key: 'A', label: 'Slip, trip or fall' },
      { key: 'B', label: 'Injury / illness' },
      { key: 'C', label: 'Theft' },
      { key: 'D', label: 'Property damage' },
      { key: 'E', label: 'Multiple types' },
    ],
    capture: 'incident_type', risk_objects: ['HOT_018'],
    next: 'operations_q' },

  // ═══════════════════════════════════════
  // 07 — POWER & OPERATIONS (1-1-1 Rule)
  // ═══════════════════════════════════════
  { id: 'operations_q', stage: STAGES.OPERATIONS, type: 'option',
    ai_message: 'How dependent is your hotel on generators or alternative power?',
    options: [
      { key: 'A', label: 'Low' },
      { key: 'B', label: 'Moderate' },
      { key: 'C', label: 'High' },
      { key: 'D', label: 'Almost completely dependent' },
    ],
    capture: 'power_dependence', risk_objects: ['HOT_021'],
    transitions: { C: 'power_followup', D: 'power_followup', default: 'critical_dep_q' } },
  { id: 'power_followup', stage: STAGES.POWER, type: 'option',
    ai_message: 'If your main power source failed during peak occupancy, how long could you continue normal operations?',
    options: [
      { key: 'A', label: 'More than 24 hours' },
      { key: 'B', label: '12–24 hours' },
      { key: 'C', label: '4–12 hours' },
      { key: 'D', label: 'Less than 4 hours' },
    ],
    capture: 'power_resilience', risk_objects: ['HOT_022'],
    next: 'critical_dep_q' },

  // ═══════════════════════════════════════
  // 08 — CRITICAL OPERATIONS
  // ═══════════════════════════════════════
  { id: 'critical_dep_q', stage: STAGES.CRITICAL_DEP, type: 'option',
    ai_message: 'Which area could cause the greatest disruption to your hotel if it failed unexpectedly?',
    options: [
      { key: 'A', label: 'Power' },
      { key: 'B', label: 'Water' },
      { key: 'C', label: 'Critical equipment' },
      { key: 'D', label: 'IT / booking / payment systems' },
      { key: 'E', label: 'Staff availability' },
      { key: 'F', label: 'Security' },
      { key: 'G', label: 'Building / property' },
      { key: 'H', label: 'Other' },
    ],
    capture: 'critical_dependency', risk_objects: ['HOT_044'],
    transitions: { C: 'equipment_followup', default: 'staff_q' } },
  { id: 'equipment_followup', stage: STAGES.CRITICAL_DEP, type: 'option',
    ai_message: 'Are your critical systems maintained on a preventive schedule?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partial' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'equipment_maintenance', risk_objects: ['HOT_023'],
    next: 'staff_q' },

  // ═══════════════════════════════════════
  // 09 — STAFF (1-1-1 Rule)
  // ═══════════════════════════════════════
  { id: 'staff_q', stage: STAGES.STAFF, type: 'option',
    ai_message: 'How would you describe your hotel\'s staff safety and employee protection arrangements?',
    options: [
      { key: 'A', label: 'Strong and formal' },
      { key: 'B', label: 'Partially established' },
      { key: 'C', label: 'Limited' },
      { key: 'D', label: 'None' },
      { key: 'E', label: 'Not sure' },
    ],
    capture: 'employee_safety', risk_objects: ['HOT_024'],
    transitions: { A: 'security_q', default: 'staff_followup' } },
  { id: 'staff_followup', stage: STAGES.STAFF, type: 'option',
    ai_message: 'Are employees covered by formal protection such as Group Life, Personal Accident or health benefits?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Some' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'employee_protection', risk_objects: ['HOT_025'],
    next: 'security_q' },

  // ═══════════════════════════════════════
  // 10 — SECURITY (1-1-1 Rule)
  // ═══════════════════════════════════════
  { id: 'security_q', stage: STAGES.SECURITY, type: 'option',
    ai_message: 'How would you describe your hotel\'s security arrangements?',
    options: [
      { key: 'A', label: 'Comprehensive' },
      { key: 'B', label: 'Good' },
      { key: 'C', label: 'Basic' },
      { key: 'D', label: 'Significant gaps' },
      { key: 'E', label: 'Not sure' },
    ],
    capture: 'security_level', risk_objects: ['HOT_026'],
    transitions: { A: 'digital_q', B: 'digital_q', default: 'security_followup' } },
  { id: 'security_followup', stage: STAGES.SECURITY, type: 'multi_select',
    ai_message: 'Which security controls do you currently use?',
    multi_select: [
      { key: 'cctv', label: 'CCTV' },
      { key: 'guards', label: 'Security personnel' },
      { key: 'access', label: 'Access control' },
      { key: 'visitors', label: 'Visitor records' },
      { key: 'incidents', label: 'Incident reporting' },
      { key: 'other', label: 'Other' },
    ],
    capture: 'security_controls', risk_objects: ['HOT_027'],
    compute_next: (ctx, answers) => {
      const controls = answers.security_controls || [];
      if (controls.includes('cctv')) return 'security_cctv_q';
      return 'digital_q';
    } },
  { id: 'security_cctv_q', stage: STAGES.SECURITY, type: 'option',
    ai_message: 'Is your CCTV actively monitored?',
    options: [{ key: 'A', label: 'Yes, 24/7' }, { key: 'B', label: 'Recording only' }, { key: 'C', label: 'Partial / not working' }],
    capture: 'cctv_monitoring', next: 'digital_q' },

  // ═══════════════════════════════════════
  // 11 — DIGITAL OPERATIONS (1-1-1 Rule)
  // ═══════════════════════════════════════
  { id: 'digital_q', stage: STAGES.DIGITAL, type: 'option',
    ai_message: 'How dependent is your hotel on digital systems such as booking, POS, payment or guest-management systems?',
    options: [
      { key: 'A', label: 'Low' },
      { key: 'B', label: 'Moderate' },
      { key: 'C', label: 'High' },
      { key: 'D', label: 'Almost completely dependent' },
      { key: 'E', label: 'Not sure' },
    ],
    capture: 'digital_dependence', risk_objects: ['HOT_028'],
    transitions: { C: 'digital_followup', D: 'digital_followup', default: 'financial_q' } },
  { id: 'digital_followup', stage: STAGES.DIGITAL, type: 'option',
    ai_message: 'If your critical digital systems became unavailable for several days, could the hotel continue operating using backup arrangements?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partially' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'digital_backup', risk_objects: ['HOT_029', 'HOT_030'],
    next: 'financial_q' },

  // ═══════════════════════════════════════
  // 12 — FINANCIAL RESILIENCE
  // ═══════════════════════════════════════
  { id: 'financial_q', stage: STAGES.FINANCIAL, type: 'option',
    ai_message: 'If your hotel suddenly lost normal room revenue, how long could it continue meeting essential operating expenses?',
    options: [
      { key: 'A', label: 'Less than 1 month' },
      { key: 'B', label: '1–3 months' },
      { key: 'C', label: '3–6 months' },
      { key: 'D', label: 'More than 6 months' },
      { key: 'E', label: 'Not sure' },
    ],
    capture: 'financial_resilience', risk_objects: ['HOT_031', 'HOT_043'],
    next: 'insurance_q' },

  // ═══════════════════════════════════════
  // 13 — INSURANCE (compact)
  // ═══════════════════════════════════════
  { id: 'insurance_q', stage: STAGES.INSURANCE, type: 'multi_select',
    ai_message: 'Which major risks does your hotel currently have insurance protection for?',
    multi_select: [
      { key: 'fire', label: 'Fire / Property' },
      { key: 'liability', label: 'Public / Occupiers Liability' },
      { key: 'bi', label: 'Business Interruption' },
      { key: 'group_life', label: 'Group Life / Employee Protection' },
      { key: 'motor', label: 'Motor / Fleet' },
      { key: 'burglary', label: 'Burglary' },
      { key: 'equipment', label: 'Equipment' },
      { key: 'cyber', label: 'Cyber' },
      { key: 'other', label: 'Other' },
      { key: 'none', label: 'None' },
      { key: 'unsure', label: 'Not sure' },
    ],
    capture: 'insurance_coverage', risk_objects: ['HOT_032'],
    compute_next: (ctx, answers) => {
      const coverage = answers.insurance_coverage || [];
      if (coverage.length <= 1 && (coverage.includes('none') || coverage.includes('unsure'))) {
        return 'insurance_followup';
      }
      return 'facility_branch_check';
    } },
  { id: 'insurance_followup', stage: STAGES.INSURANCE, type: 'option',
    ai_message: 'How confident are you that your current insurance limits adequately reflect the hotel\'s current assets and exposures?',
    options: [{ key: 'A', label: 'Very confident' }, { key: 'B', label: 'Fairly confident' }, { key: 'C', label: 'Not very confident' }, { key: 'D', label: 'Not sure' }],
    capture: 'insurance_confidence',
    next: 'facility_branch_check' },

  // ═══════════════════════════════════════
  // 14 — FACILITY ADAPTIVE BRANCHES
  // ═══════════════════════════════════════
  { id: 'facility_branch_check', stage: STAGES.FACILITY_BRANCH, type: 'compute',
    compute_next: (ctx) => {
      if (ctx.has_fb) return 'fb_q';
      if (ctx.has_pool) return 'pool_q';
      if (ctx.has_gym) return 'gym_q';
      if (ctx.has_spa) return 'spa_q';
      if (ctx.has_events) return 'events_q';
      if (ctx.has_vehicles) return 'vehicle_q';
      if (ctx.has_laundry) return 'laundry_q';
      return 'client_concern_q';
    } },

  // Restaurant / Kitchen (1 question + optional follow-up)
  { id: 'fb_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'How would you describe your kitchen\'s fire and food-safety controls?',
    options: [
      { key: 'A', label: 'Formal and consistently monitored' },
      { key: 'B', label: 'In place but inconsistent' },
      { key: 'C', label: 'Basic / informal' },
      { key: 'D', label: 'Significant gaps' },
      { key: 'E', label: 'Not sure' },
    ],
    capture: 'food_safety', risk_objects: ['HOT_034'],
    compute_next: (ctx) => {
      if (ctx.has_pool) return 'pool_q';
      return 'facility_chain_next';
    } },

  // Pool (1 question)
  { id: 'pool_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'How would you describe your pool safety controls?',
    options: [
      { key: 'A', label: 'Documented, maintained and supervised' },
      { key: 'B', label: 'Partially controlled' },
      { key: 'C', label: 'Significant gaps' },
      { key: 'D', label: 'Not sure' },
    ],
    capture: 'pool_safety', risk_objects: ['HOT_036'],
    compute_next: (ctx) => ctx.has_gym ? 'gym_q' : 'facility_chain_next' },

  // Gym (1 question)
  { id: 'gym_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'Are gym equipment and facilities regularly inspected and maintained?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partial' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'gym_safety', risk_objects: ['HOT_037'],
    compute_next: (ctx) => ctx.has_spa ? 'spa_q' : 'facility_chain_next' },

  // Spa (1 question)
  { id: 'spa_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'Are spa and wellness facilities operated under documented safety and hygiene protocols?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partial' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'spa_safety', risk_objects: ['HOT_038'],
    compute_next: (ctx) => ctx.has_events ? 'events_q' : 'facility_chain_next' },

  // Events (1 question)
  { id: 'events_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'Are crowd management and emergency evacuation procedures in place for major events?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partial' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'event_safety', risk_objects: ['HOT_039'],
    compute_next: (ctx) => ctx.has_vehicles ? 'vehicle_q' : 'facility_chain_next' },

  // Vehicles (1 question)
  { id: 'vehicle_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'Are hotel vehicles maintained under a documented inspection schedule?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partial' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'vehicle_maintenance', risk_objects: ['HOT_041'],
    compute_next: (ctx) => ctx.has_laundry ? 'laundry_q' : 'facility_chain_next' },

  // Laundry (1 question)
  { id: 'laundry_q', stage: STAGES.FACILITY_BRANCH, type: 'option',
    ai_message: 'Are laundry operations managed under health and safety protocols?',
    options: [{ key: 'A', label: 'Yes' }, { key: 'B', label: 'Partial' }, { key: 'C', label: 'No' }, { key: 'D', label: 'Not sure' }],
    capture: 'laundry_safety', risk_objects: ['HOT_042'],
    next: 'client_concern_q' },

  // Facility chain connector
  { id: 'facility_chain_next', stage: STAGES.FACILITY_BRANCH, type: 'compute',
    compute_next: (ctx) => {
      if (ctx.has_gym) return 'gym_q';
      if (ctx.has_spa) return 'spa_q';
      if (ctx.has_events) return 'events_q';
      if (ctx.has_vehicles) return 'vehicle_q';
      if (ctx.has_laundry) return 'laundry_q';
      return 'client_concern_q';
    } },

  // ═══════════════════════════════════════
  // 15 — CLIENT CONCERN (mandatory)
  // ═══════════════════════════════════════
  { id: 'client_concern_q', stage: STAGES.CLIENT_CONCERN, type: 'text',
    ai_message: "We've covered the main areas. Before I prepare your results, what's the biggest risk or challenge you personally worry about affecting the hotel?",
    capture: 'client_concern', risk_objects: ['HOT_051'], next: 'validation_check' },

  // ═══════════════════════════════════════
  // 16 — INTELLIGENT FINAL CHECK
  // ═══════════════════════════════════════
  { id: 'validation_check', stage: STAGES.VALIDATION, type: 'compute',
    compute_next: (ctx, answers, state) => {
      const gaps = getRemainingGaps(state);
      if (gaps.length === 0) return 'completion';
      return 'validation_followup';
    } },
  { id: 'validation_followup', stage: STAGES.VALIDATION, type: 'text',
    ai_message: (state) => {
      const gaps = getRemainingGaps(state);
      return gaps[0]?.message || 'One more thing — can you tell me more about this?';
    },
    capture: 'validation_response', next: 'validation_check' },

  // ═══════════════════════════════════════
  // 17 — COMPLETION
  // ═══════════════════════════════════════
  { id: 'completion', stage: STAGES.COMPLETION, type: 'terminal',
    ai_message: 'Assessment complete. Your Hotel Risk Report is being generated.' },
];

// Build node map
const NODE_MAP = {};
NODES.forEach(n => { NODE_MAP[n.id] = n; });

// ─── REMAINING GAPS (intelligent final check) ───

function getRemainingGaps(state) {
  const gaps = [];
  const a = state.answers;

  if (!a.hotel_name) gaps.push({ field: 'hotel_name', message: 'Could you confirm the hotel name?' });
  if (!a.respondent_role) gaps.push({ field: 'respondent_role', message: 'What is your role at the hotel?' });
  if (!a.fire_safety) gaps.push({ field: 'fire_safety', message: 'How would you describe fire safety readiness?' });
  if (!a.guest_safety_confidence) gaps.push({ field: 'guest_safety', message: 'How confident are you in guest safety?' });
  if (!a.insurance_coverage) gaps.push({ field: 'insurance', message: 'What insurance does the hotel have?' });
  if (!a.client_concern) gaps.push({ field: 'concern', message: 'What is your biggest risk concern?' });

  return gaps.slice(0, 2);
}

// ─── COMPLETION METRICS ───

function calculateCompletionMetrics(state) {
  const a = state.answers;
  return {
    profile_complete: !!(a.hotel_name && a.respondent_name && a.respondent_role && a.hotel_location),
    facilities_discovered: !!(a.facilities),
    exposures_discovered: !!(a.fire_safety && a.guest_safety_confidence),
    evidence_sufficient: Object.keys(state.evidence).length >= 8,
    critical_branches_resolved: !!(a.fire_safety || a.fire_controls),
    protection_established: !!(a.insurance_coverage && a.employee_safety),
    resilience_established: !!(a.financial_resilience),
    client_concern_captured: !!a.client_concern,
  };
}

// ─── EVIDENCE MAP ───

const EVIDENCE_MAP = {
  fire_safety: { pillar: 'fire_property', category: 'fire_readiness', exposure: 'Fire safety gaps increase property and life risk' },
  fire_controls: { pillar: 'fire_property', category: 'fire_controls', exposure: 'Untested fire equipment may fail during emergency' },
  guest_safety_confidence: { pillar: 'guest_safety', category: 'liability_exposure', exposure: 'Low confidence in guest safety indicates control weaknesses' },
  guest_incidents: { pillar: 'guest_safety', category: 'incident_history', exposure: 'Past incidents indicate future risk exposure' },
  incident_type: { pillar: 'guest_safety', category: 'incident_type', exposure: 'Specific incident types reveal targeted vulnerabilities' },
  power_dependence: { pillar: 'operational', category: 'power', exposure: 'High power dependence creates operational vulnerability' },
  power_resilience: { pillar: 'operational', category: 'power_resilience', exposure: 'Low power resilience threatens continuity' },
  critical_dependency: { pillar: 'business_continuity', category: 'dependency', exposure: 'Single points of failure create catastrophic risk' },
  equipment_maintenance: { pillar: 'operational', category: 'equipment', exposure: 'Unmaintained equipment creates failure risk' },
  employee_safety: { pillar: 'employee', category: 'procedures', exposure: 'Inadequate safety procedures endanger staff' },
  employee_protection: { pillar: 'employee', category: 'coverage', exposure: 'Missing worker protections create legal and morale risks' },
  security_level: { pillar: 'security', category: 'overall', exposure: 'Weak security increases theft and safety risks' },
  security_controls: { pillar: 'security', category: 'controls', exposure: 'Limited security controls reduce deterrence' },
  cctv_monitoring: { pillar: 'security', category: 'cctv', exposure: 'Non-monitored CCTV reduces evidence and deterrence' },
  digital_dependence: { pillar: 'operational', category: 'digital', exposure: 'Digital dependence creates cyber and downtime risks' },
  digital_backup: { pillar: 'operational', category: 'recovery', exposure: 'No digital backup threatens operational continuity' },
  financial_resilience: { pillar: 'financial', category: 'resilience', exposure: 'Low financial resilience limits recovery ability' },
  insurance_coverage: { pillar: 'guest_safety', category: 'insurance', exposure: 'Insurance gaps leave risks uninsured' },
  insurance_confidence: { pillar: 'guest_safety', category: 'insurance_adequacy', exposure: 'Low confidence in insurance adequacy' },
  food_safety: { pillar: 'operational', category: 'food_safety', exposure: 'Food safety failures create health and legal risks' },
  pool_safety: { pillar: 'guest_safety', category: 'pool', exposure: 'Pool incidents create significant liability' },
  gym_safety: { pillar: 'guest_safety', category: 'gym', exposure: 'Equipment failures cause guest injuries' },
  spa_safety: { pillar: 'guest_safety', category: 'spa', exposure: 'Spa operations carry hygiene and injury risks' },
  event_safety: { pillar: 'guest_safety', category: 'events', exposure: 'Event safety gaps endanger large groups' },
  vehicle_maintenance: { pillar: 'operational', category: 'vehicles', exposure: 'Poor vehicle management creates accident liability' },
  laundry_safety: { pillar: 'operational', category: 'laundry', exposure: 'Laundry operations carry fire and chemical risks' },
  client_concern: { pillar: 'business_continuity', category: 'concern', exposure: 'Client concerns indicate perceived vulnerabilities' },
};

function extractEvidence(state, questionId, answer) {
  const mapping = EVIDENCE_MAP[questionId];
  if (!mapping) return null;
  const normalised = normaliseAnswer(answer);
  const uncertain = isUncertainAnswer(answer);
  return {
    questionId,
    pillar: mapping.pillar,
    category: mapping.category,
    exposure: mapping.exposure,
    answer: normalised.normalised || answer,
    rawAnswer: answer,
    confidence: normalised.confidence,
    uncertain,
    timestamp: new Date().toISOString(),
  };
}

// ─── MAIN ENGINE CLASS ───

class UnifiedAssessmentEngine {
  constructor() {
    this.nodes = NODE_MAP;
    this.stages = STAGES;
  }

  getInitialState(channel = 'WHATSAPP') {
    return {
      assessmentId: `CSA-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      leadId: null,
      channel: { current: channel, history: [channel] },
      status: 'in_progress',
      currentNode: 'welcome',
      stage: STAGES.WELCOME,
      answers: {},
      context: {
        has_fb: false, has_pool: false, has_gym: false, has_spa: false,
        has_vehicles: false, has_events: false, has_laundry: false,
        hotel_type: null, years_operating: null,
      },
      evidence: {},
      riskObjectsActivated: [],
      contradictions: [],
      uncertainties: [],
      completionMetrics: {},
      interactionCount: 0,
      startedAt: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      completedAt: null,
    };
  }

  getCurrentQuestion(state) {
    let nodeId = state.currentNode;
    const visited = new Set();

    while (nodeId && this.nodes[nodeId]) {
      if (visited.has(nodeId)) break;
      visited.add(nodeId);

      const node = this.nodes[nodeId];

      if (node.condition && !node.condition(state.context, state.answers)) {
        nodeId = node.next || null;
        continue;
      }

      if (node.type === 'compute') {
        if (node.compute_next) {
          nodeId = typeof node.compute_next === 'function'
            ? node.compute_next(state.context, state.answers, state)
            : node.compute_next;
          state.currentNode = nodeId;
          continue;
        }
        break;
      }

      return {
        nodeId: node.id,
        stage: node.stage,
        type: node.type,
        message: typeof node.ai_message === 'function' ? node.ai_message(state) : node.ai_message,
        options: node.options || null,
        multiSelect: node.multi_select || null,
        terminal: node.type === 'terminal',
      };
    }

    return { nodeId: 'completion', stage: STAGES.COMPLETION, type: 'terminal', message: 'Assessment complete.', terminal: true };
  }

  processResponse(state, response) {
    const node = this.nodes[state.currentNode];
    if (!node) return state;

    state.lastInteraction = new Date().toISOString();
    state.interactionCount++;

    // Capture answer
    if (node.capture) {
      const fields = Array.isArray(node.capture) ? node.capture : [node.capture];
      if (fields.length === 1) {
        state.answers[fields[0]] = response;
      } else {
        fields.forEach((f, i) => {
          state.answers[f] = Array.isArray(response) ? response[i] : response;
        });
      }
    }

    // Run compute function
    if (node.compute) {
      const updates = node.compute(state.answers);
      if (updates && typeof updates === 'object') Object.assign(state.context, updates);
    }

    // Extract evidence
    const riskObjects = node.risk_objects || [];
    if (riskObjects.length > 0 || EVIDENCE_MAP[node.id]) {
      const ev = extractEvidence(state, node.id, response);
      if (ev) state.evidence[node.id] = ev;
      state.riskObjectsActivated = [...new Set([...state.riskObjectsActivated, ...riskObjects])];
    }

    // Check contradictions
    const newContradictions = checkNewAnswerContradiction(node.id, response, state.answers) || [];
    if (newContradictions.length > 0) {
      state.contradictions = [...state.contradictions, ...newContradictions];
    }

    // Track uncertainty
    if (isUncertainAnswer(response)) {
      state.uncertainties.push({ questionId: node.id, answer: response, timestamp: new Date().toISOString() });
    }

    // Determine next node
    let nextNodeId = null;
    if (node.transitions) nextNodeId = node.transitions[response] || node.transitions.default;
    if (!nextNodeId && node.compute_next) {
      nextNodeId = typeof node.compute_next === 'function'
        ? node.compute_next(state.context, state.answers, state)
        : node.compute_next;
    }
    if (!nextNodeId) nextNodeId = node.next;

    if (nextNodeId) {
      state.currentNode = nextNodeId;
      const nextNode = this.nodes[nextNodeId];
      if (nextNode) state.stage = nextNode.stage;
    }

    // Update risk objects
    state.riskObjectsActivated = getActivatedRiskObjects(state.context, state.answers);
    state.completionMetrics = calculateCompletionMetrics(state);

    if (state.currentNode === 'completion' || nextNodeId === 'completion') {
      state.status = 'completed';
      state.completedAt = new Date().toISOString();
    }

    return state;
  }

  checkCompletion(state) {
    return state.status === 'completed' || state.currentNode === 'completion';
  }

  switchChannel(state, newChannel) {
    if (state.channel.current !== newChannel) {
      state.channel.history.push(newChannel);
      state.channel.current = newChannel;
    }
    return state;
  }

  getStateForPersistence(state) { return JSON.parse(JSON.stringify(state)); }
  loadStateFromPersistence(data) { return typeof data === 'string' ? JSON.parse(data) : data; }
}

module.exports = {
  UnifiedAssessmentEngine,
  STAGES,
  NODES,
  NODE_MAP,
  calculateCompletionMetrics,
  EVIDENCE_MAP,
};
