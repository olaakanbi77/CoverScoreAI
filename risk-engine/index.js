/**
 * Risk Scoring Engine - Main Entry Point
 * A modular, production-ready risk scoring engine for insurance assessments
 *
 * @module risk-engine
 */

import { ENTITY_TYPES, RISK_LEVELS, SCORE_LIMITS } from './types.js';
import { log, clampScore, classifyRiskLevel } from './utils.js';
import { calculateIndividualRisk } from './individual.js';
import { calculateBusinessRisk } from './business.js';

/**
 * Detects the entity type from input data
 * @param {Object} input - Input data
 * @returns {'individual' | 'business'} Entity type
 */
function detectEntityType(input) {
  // Check for individual-specific fields
  if ('income_type' in input || 'health_status' in input ||
      'lifestyle_risk' in input || 'savings_months' in input) {
    return ENTITY_TYPES.INDIVIDUAL;
  }

  // Check for business-specific fields
  if ('business_type' in input || 'asset_value' in input ||
      'customer_interaction' in input || 'continuity_plan' in input) {
    return ENTITY_TYPES.BUSINESS;
  }

  // Fallback to individual if any common fields match
  if ('dependents' in input || 'has_insurance' in input) {
    return ENTITY_TYPES.INDIVIDUAL;
  }

  return null;
}

/**
 * Main risk calculation function
 * Accepts structured input and returns a complete risk assessment
 *
 * @param {Object} input - Risk input data (individual or business)
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.skipValidation] - Skip input validation (not recommended)
 * @param {string} [options.entityType] - Force entity type ('individual' or 'business')
 * @returns {Object} Complete risk assessment result
 * @throws {Object} Validation error if input is invalid
 *
 * @example
 * // Individual risk assessment
 * const individualResult = calculateRisk({
 *   income_type: 'stable',
 *   dependents: 2,
 *   health_status: 'healthy',
 *   savings_months: 4,
 *   has_insurance: 'partial',
 *   lifestyle_risk: 'low'
 * });
 *
 * @example
 * // Business risk assessment
 * const businessResult = calculateRisk({
 *   business_type: 'retail',
 *   asset_value: 'medium',
 *   customer_interaction: 'high',
 *   staff_size: 'medium',
 *   location_risk: 'low',
 *   continuity_plan: 'weak',
 *   insurance_coverage: 'partial'
 * });
 */
export function calculateRisk(input, options = {}) {
  log('INFO', 'Starting risk calculation', { entityTypeHint: options.entityType });

  if (!input || typeof input !== 'object') {
    const error = { valid: false, error: 'Input must be a valid object' };
    log('ERROR', 'Invalid input', error);
    throw error;
  }

  // Detect or use specified entity type
  let entityType = options.entityType;

  if (!entityType) {
    entityType = detectEntityType(input);
  }

  if (!entityType) {
    const error = {
      valid: false,
      error: 'Could not detect entity type. Please provide either individual-specific fields (income_type, health_status, etc.) or business-specific fields (business_type, asset_value, etc.)'
    };
    log('ERROR', 'Entity type detection failed', error);
    throw error;
  }

  log('INFO', `Detected entity type: ${entityType}`);

  // Route to appropriate calculation function
  let result;

  if (entityType === ENTITY_TYPES.INDIVIDUAL) {
    result = calculateIndividualRisk(input);
  } else if (entityType === ENTITY_TYPES.BUSINESS) {
    result = calculateBusinessRisk(input);
  } else {
    const error = { valid: false, error: `Unknown entity type: ${entityType}` };
    log('ERROR', 'Unknown entity type', error);
    throw error;
  }

  log('INFO', 'Risk calculation complete', {
    score: result.score,
    level: result.level,
    type: result.type
  });

  return result;
}

/**
 * Validates input without calculating risk
 *
 * @param {Object} input - Input to validate
 * @param {string} [entityType] - Optional entity type hint
 * @returns {Object} Validation result with valid: true or error details
 */
export function validateInput(input, entityType = null) {
  const type = entityType || detectEntityType(input);

  if (!type) {
    return {
      valid: false,
      error: 'Could not detect entity type from input'
    };
  }

  try {
    if (type === ENTITY_TYPES.INDIVIDUAL) {
      calculateIndividualRisk(input);
    } else {
      calculateBusinessRisk(input);
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.error || error.message || 'Validation failed'
    };
  }
}

/**
 * Gets the scoring limits for an entity type
 *
 * @param {'individual' | 'business'} entityType - Entity type
 * @returns {Object} Score limits for each category
 */
export function getScoreLimits(entityType) {
  if (entityType === ENTITY_TYPES.INDIVIDUAL) {
    return SCORE_LIMITS.INDIVIDUAL;
  }
  return SCORE_LIMITS.BUSINESS;
}

/**
 * Risk Engine exports
 */
export {
  // Types and constants
  RISK_LEVELS,
  ENTITY_TYPES,
  SCORE_LIMITS,

  // Utility functions
  clampScore,
  classifyRiskLevel,

  // Individual engine
  calculateIndividualRisk,

  // Business engine
  calculateBusinessRisk
};

export default calculateRisk;
