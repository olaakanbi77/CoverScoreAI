/**
 * Business Risk Scoring Engine
 * Calculates risk scores for business insurance assessments
 */

import {
  RISK_LEVELS
} from './types.js';

import {
  clampScore,
  classifyRiskLevel,
  createBusinessBreakdown,
  normalizeBreakdown,
  isValidEnum,
  log
} from './utils.js';

// Valid enum values for business inputs
const VALID_BUSINESS_TYPES = ['manufacturing', 'retail', 'service', 'digital'];
const VALID_ASSET_VALUES = ['low', 'medium', 'high'];
const VALID_CUSTOMER_INTERACTIONS = ['low', 'medium', 'high'];
const VALID_STAFF_SIZES = ['small', 'medium', 'large'];
const VALID_LOCATION_RISKS = ['low', 'medium', 'high'];
const VALID_CONTINUITY_PLANS = ['none', 'weak', 'strong'];
const VALID_INSURANCE_COVERAGE = ['none', 'partial', 'full'];

/**
 * Validates business input data
 * @param {Object} input - Business input data
 * @throws {Object} Validation error if input is invalid
 */
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw { valid: false, error: 'Input must be a valid object' };
  }

  isValidEnum(input.business_type, VALID_BUSINESS_TYPES, 'business_type');
  isValidEnum(input.asset_value, VALID_ASSET_VALUES, 'asset_value');
  isValidEnum(input.customer_interaction, VALID_CUSTOMER_INTERACTIONS, 'customer_interaction');
  isValidEnum(input.staff_size, VALID_STAFF_SIZES, 'staff_size');
  isValidEnum(input.location_risk, VALID_LOCATION_RISKS, 'location_risk');
  isValidEnum(input.continuity_plan, VALID_CONTINUITY_PLANS, 'continuity_plan');
  isValidEnum(input.insurance_coverage, VALID_INSURANCE_COVERAGE, 'insurance_coverage');
}

/**
 * Calculates business type score (Max 20)
 * @param {string} businessType - Type of business
 * @returns {number} Score contribution
 */
function calculateBusinessTypeScore(businessType) {
  const scores = {
    manufacturing: 20,
    retail: 15,
    service: 10,
    digital: 5
  };
  return scores[businessType] || 0;
}

/**
 * Calculates asset value score (Max 15)
 * @param {string} assetValue - Asset value level
 * @returns {number} Score contribution
 */
function calculateAssetValueScore(assetValue) {
  const scores = {
    high: 15,
    medium: 10,
    low: 5
  };
  return scores[assetValue] || 0;
}

/**
 * Calculates customer interaction score (Max 15)
 * @param {string} interaction - Customer interaction level
 * @returns {number} Score contribution
 */
function calculateCustomerInteractionScore(interaction) {
  const scores = {
    high: 15,
    medium: 10,
    low: 5
  };
  return scores[interaction] || 0;
}

/**
 * Calculates staff dependency score (Max 10)
 * @param {string} staffSize - Staff size category
 * @returns {number} Score contribution
 */
function calculateStaffScore(staffSize) {
  const scores = {
    large: 10,
    medium: 7,
    small: 5
  };
  return scores[staffSize] || 0;
}

/**
 * Calculates location risk score (Max 10)
 * @param {string} locationRisk - Location risk level
 * @returns {number} Score contribution
 */
function calculateLocationRiskScore(locationRisk) {
  const scores = {
    high: 10,
    medium: 7,
    low: 5
  };
  return scores[locationRisk] || 0;
}

/**
 * Calculates continuity plan score (Max 15)
 * @param {string} continuityPlan - Continuity plan strength
 * @returns {number} Score contribution
 */
function calculateContinuityScore(continuityPlan) {
  const scores = {
    none: 15,
    weak: 10,
    strong: 5
  };
  return scores[continuityPlan] || 0;
}

/**
 * Calculates insurance coverage score (Max 15)
 * @param {string} coverage - Insurance coverage level
 * @returns {number} Score contribution
 */
function calculateInsuranceScore(coverage) {
  const scores = {
    none: 15,
    partial: 10,
    full: 5
  };
  return scores[coverage] || 0;
}

/**
 * Generates key risks based on business profile
 * @param {Object} input - Business input data
 * @param {Object} breakdown - Score breakdown
 * @returns {string[]} Array of key risk descriptions
 */
function generateKeyRisks(input, breakdown) {
  const risks = [];

  if (input.insurance_coverage === 'none') {
    risks.push('No risk transfer mechanism - all losses borne by business');
  }

  if (input.customer_interaction === 'high') {
    risks.push('High liability exposure from customer interactions');
  }

  if (input.continuity_plan === 'none') {
    risks.push('Business disruption risk - no continuity plan in place');
  }

  if (input.asset_value === 'high') {
    risks.push('High financial loss exposure from valuable assets');
  }

  if (input.location_risk === 'high') {
    risks.push('Elevated location risk - vulnerable to local hazards');
  }

  if (input.business_type === 'manufacturing') {
    risks.push('Manufacturing risk - equipment failure, supply chain disruptions');
  }

  if (input.staff_size === 'large') {
    risks.push('Large workforce risk - employee-related liabilities');
  }

  if (input.insurance_coverage === 'partial') {
    risks.push('Partial coverage - gaps in risk protection');
  }

  return risks;
}

/**
 * Generates insurance recommendations based on business profile
 * @param {Object} input - Business input data
 * @param {string} riskLevel - Calculated risk level
 * @returns {string[]} Array of recommended insurance products
 */
function generateRecommendations(input, riskLevel) {
  const recommendations = [];

  // Universal business recommendations
  if (input.insurance_coverage === 'none') {
    recommendations.push('Business Owners Policy (BOP)');
  }

  // Business type specific recommendations
  if (input.business_type === 'retail') {
    recommendations.push('Fire & Theft Insurance');
    recommendations.push('Stock Insurance');
  }

  if (input.business_type === 'manufacturing') {
    recommendations.push('Equipment Breakdown Insurance');
    recommendations.push('Business Interruption Insurance');
    recommendations.push('Goods in Transit Insurance');
  }

  if (input.business_type === 'service') {
    recommendations.push('Professional Indemnity Insurance');
    recommendations.push('Errors & Omissions Insurance');
  }

  if (input.business_type === 'digital') {
    recommendations.push('Cyber Liability Insurance');
    recommendations.push('Digital Asset Insurance');
  }

  // Customer interaction based recommendations
  if (input.customer_interaction === 'high') {
    recommendations.push('Public Liability Insurance');
    recommendations.push('Product Liability Insurance');
  }

  // Continuity plan based recommendations
  if (input.continuity_plan === 'none' || input.continuity_plan === 'weak') {
    recommendations.push('Business Interruption Insurance');
  }

  // Asset value based recommendations
  if (input.asset_value === 'high' || input.asset_value === 'medium') {
    recommendations.push('Property Insurance');
    recommendations.push('Buildings Insurance');
  }

  // Staff based recommendations
  if (input.staff_size === 'medium' || input.staff_size === 'large') {
    recommendations.push('Group Life Insurance (NAICOM Required)');
    recommendations.push("Workers' Compensation Insurance");
    recommendations.push('Employee Benefits Insurance');
  }

  // Risk level based additions
  if (riskLevel === RISK_LEVELS.HIGH) {
    recommendations.push('Directors & Officers Liability Insurance');
    recommendations.push('Key Person Insurance');
  }

  // Location risk based
  if (input.location_risk === 'high') {
    recommendations.push('Natural Disaster Insurance');
  }

  // Remove duplicates and limit to 8
  const unique = [...new Set(recommendations)];
  return unique.slice(0, 8);
}

/**
 * Calculates business risk score and generates full risk assessment
 * @param {Object} input - Business risk input data
 * @returns {Object} Complete risk assessment result
 */
export function calculateBusinessRisk(input) {
  log('INFO', 'Calculating business risk');

  try {
    validateInput(input);
  } catch (validationError) {
    log('ERROR', 'Validation failed', validationError);
    throw validationError;
  }

  // Calculate breakdown scores
  const breakdown = createBusinessBreakdown();

  breakdown.businessType = calculateBusinessTypeScore(input.business_type);
  breakdown.assetValue = calculateAssetValueScore(input.asset_value);
  breakdown.customerInteraction = calculateCustomerInteractionScore(input.customer_interaction);
  breakdown.staffDependency = calculateStaffScore(input.staff_size);
  breakdown.locationRisk = calculateLocationRiskScore(input.location_risk);
  breakdown.continuity = calculateContinuityScore(input.continuity_plan);
  breakdown.insurance = calculateInsuranceScore(input.insurance_coverage);

  // Normalize to ensure max score of 100
  const normalizedBreakdown = normalizeBreakdown(breakdown);

  // Calculate total score
  const totalScore = Object.values(normalizedBreakdown)
    .reduce((sum, val) => sum + val, 0);

  const score = clampScore(totalScore);
  const level = classifyRiskLevel(score);

  log('INFO', `Business risk calculated: score=${score}, level=${level}`);

  return {
    score,
    level,
    type: 'business',
    breakdown: normalizedBreakdown,
    key_risks: generateKeyRisks(input, normalizedBreakdown),
    recommendations: generateRecommendations(input, level)
  };
}

export default calculateBusinessRisk;
