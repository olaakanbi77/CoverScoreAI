/**
 * Risk Engine Utility Functions
 * Shared helper functions for validation and common operations
 */

import { SCORE_LIMITS, RISK_LEVELS } from './types.js';

/**
 * Clamps a score to the valid range (0-100)
 * @param {number} score - Raw score
 * @returns {number} Clamped score
 */
export function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Classifies risk level based on score
 * @param {number} score - Risk score
 * @returns {string} Risk level (HIGH, MODERATE, or LOW)
 */
export function classifyRiskLevel(score) {
  if (score >= 70) return RISK_LEVELS.HIGH;
  if (score >= 40) return RISK_LEVELS.MODERATE;
  return RISK_LEVELS.LOW;
}

/**
 * Creates a validation error object
 * @param {string} message - Error message
 * @param {string} [field] - Field that failed validation
 * @returns {Object} Validation error object
 */
export function validationError(message, field = null) {
  const error = { valid: false, error: message };
  if (field) error.field = field;
  return error;
}

/**
 * Validates that a value is one of the allowed values
 * @param {*} value - Value to check
 * @param {string[]} allowed - Array of allowed values
 * @param {string} fieldName - Field name for error message
 * @returns {boolean} True if valid
 */
export function isValidEnum(value, allowed, fieldName) {
  if (value === undefined || value === null) {
    throw validationError(`${fieldName} is required`, fieldName);
  }
  if (!allowed.includes(value)) {
    throw validationError(
      `${fieldName} must be one of: ${allowed.join(', ')}`,
      fieldName
    );
  }
  return true;
}

/**
 * Validates that a number is within a range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error message
 * @returns {boolean} True if valid
 */
export function isValidNumber(value, min, max, fieldName) {
  if (value === undefined || value === null) {
    throw validationError(`${fieldName} is required`, fieldName);
  }
  if (typeof value !== 'number' || isNaN(value)) {
    throw validationError(`${fieldName} must be a valid number`, fieldName);
  }
  if (value < min || value > max) {
    throw validationError(`${fieldName} must be between ${min} and ${max}`, fieldName);
  }
  return true;
}

/**
 * Safely parses a number from various inputs
 * @param {*} value - Value to parse
 * @param {number} defaultValue - Default if parsing fails
 * @returns {number} Parsed number or default
 */
export function parseNumber(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Logs a message with timestamp (for debugging)
 * @param {string} level - Log level (INFO, WARN, ERROR)
 * @param {string} message - Message to log
 * @param {Object} [data] - Additional data to log
 */
export function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  if (data !== null) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

/**
 * Creates an empty scoring breakdown for individual
 * @returns {Object} Individual breakdown object
 */
export function createIndividualBreakdown() {
  return {
    income: 0,
    dependents: 0,
    health: 0,
    savings: 0,
    insurance: 0,
    lifestyle: 0
  };
}

/**
 * Creates an empty scoring breakdown for business
 * @returns {Object} Business breakdown object
 */
export function createBusinessBreakdown() {
  return {
    businessType: 0,
    assetValue: 0,
    customerInteraction: 0,
    staffDependency: 0,
    locationRisk: 0,
    continuity: 0,
    insurance: 0
  };
}

/**
 * Sums all values in a breakdown object
 * @param {Object} breakdown - Scoring breakdown
 * @returns {number} Sum of all values
 */
export function sumBreakdown(breakdown) {
  return Object.values(breakdown).reduce((sum, val) => sum + val, 0);
}

/**
 * Ensures the total score doesn't exceed 100
 * Distributes any overflow proportionally across categories
 * @param {Object} breakdown - Scoring breakdown
 * @returns {Object} Adjusted breakdown with max total of 100
 */
export function normalizeBreakdown(breakdown) {
  const total = sumBreakdown(breakdown);
  const maxTotal = 100;

  if (total <= maxTotal) {
    return breakdown;
  }

  // Proportionally reduce all values to fit within limit
  const scale = maxTotal / total;
  const adjusted = {};
  for (const [key, value] of Object.entries(breakdown)) {
    adjusted[key] = Math.round(value * scale);
  }

  // Ensure we still hit exactly 100
  const adjustedTotal = sumBreakdown(adjusted);
  if (adjustedTotal < maxTotal) {
    // Add the difference to the largest category
    const largestKey = Object.entries(adjusted)
      .sort(([, a], [, b]) => b - a)[0][0];
    adjusted[largestKey] += maxTotal - adjustedTotal;
  }

  return adjusted;
}

export default {
  clampScore,
  classifyRiskLevel,
  validationError,
  isValidEnum,
  isValidNumber,
  parseNumber,
  log,
  createIndividualBreakdown,
  createBusinessBreakdown,
  sumBreakdown,
  normalizeBreakdown
};
