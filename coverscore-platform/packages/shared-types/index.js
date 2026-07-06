// Shared type constants for the CoverScore Platform

const STATES = Object.freeze({
  NEW: 'NEW',
  WELCOME: 'WELCOME',
  CONSENT: 'CONSENT',
  PROFILE: 'PROFILE',
  DISCOVERY: 'DISCOVERY',
  SCORING: 'SCORING',
  REPORT: 'REPORT',
  COMPLETE: 'COMPLETE'
});

const STATE_ORDER = Object.freeze([
  STATES.NEW,
  STATES.WELCOME,
  STATES.CONSENT,
  STATES.PROFILE,
  STATES.DISCOVERY,
  STATES.SCORING,
  STATES.REPORT,
  STATES.COMPLETE
]);

const RISK_LEVELS = Object.freeze({
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  MODERATE: 'Moderate',
  VULNERABLE: 'Vulnerable',
  CRITICAL: 'Critical'
});

const RISK_THRESHOLDS = Object.freeze([
  { min: 85, max: 100, level: RISK_LEVELS.EXCELLENT, label: 'Excellent' },
  { min: 70, max: 84, level: RISK_LEVELS.GOOD, label: 'Good' },
  { min: 55, max: 69, level: RISK_LEVELS.MODERATE, label: 'Moderate' },
  { min: 40, max: 54, level: RISK_LEVELS.VULNERABLE, label: 'Vulnerable' },
  { min: 0, max: 39, level: RISK_LEVELS.CRITICAL, label: 'Critical' }
]);

const CHANNELS = Object.freeze({
  WHATSAPP: 'whatsapp',
  WEB: 'web',
  API: 'api'
});

const REPORT_FORMATS = Object.freeze({
  JSON: 'json',
  PDF: 'pdf',
  HTML: 'html'
});

const getRiskLevel = (score) => {
  for (const t of RISK_THRESHOLDS) {
    if (score >= t.min && score <= t.max) return t.level;
  }
  return RISK_LEVELS.CRITICAL;
};

const canTransition = (from, to) => {
  const fromIdx = STATE_ORDER.indexOf(from);
  const toIdx = STATE_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx >= fromIdx;
};

module.exports = {
  STATES,
  STATE_ORDER,
  RISK_LEVELS,
  RISK_THRESHOLDS,
  CHANNELS,
  REPORT_FORMATS,
  getRiskLevel,
  canTransition
};
