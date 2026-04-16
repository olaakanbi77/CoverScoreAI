/**
 * Individual Risk Scoring Engine
 * Calculates risk scores for personal insurance assessments
 */

import {
  SCORE_LIMITS,
  RISK_LEVELS
} from './types.js';

import {
  clampScore,
  classifyRiskLevel,
  createIndividualBreakdown,
  normalizeBreakdown,
  isValidEnum,
  isValidNumber,
  log
} from './utils.js';

// Valid enum values for individual inputs
const VALID_INCOME_TYPES = ['stable', 'unstable', 'multiple', 'none'];
const VALID_HEALTH_STATUSES = ['healthy', 'moderate', 'high_risk'];
const VALID_LIFESTYLE_RISKS = ['low', 'medium', 'high'];
const VALID_INSURANCE_COVERAGE = ['none', 'partial', 'full'];

/**
 * Validates individual input data
 * @param {Object} input - Individual input data
 * @throws {Object} Validation error if input is invalid
 */
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw { valid: false, error: 'Input must be a valid object' };
  }

  isValidEnum(input.income_type, VALID_INCOME_TYPES, 'income_type');
  isValidNumber(input.dependents, 0, Infinity, 'dependents');
  isValidEnum(input.health_status, VALID_HEALTH_STATUSES, 'health_status');
  isValidNumber(input.savings_months, 0, Infinity, 'savings_months');
  isValidEnum(input.has_insurance, VALID_INSURANCE_COVERAGE, 'has_insurance');
  isValidEnum(input.lifestyle_risk, VALID_LIFESTYLE_RISKS, 'lifestyle_risk');
}

/**
 * Calculates income dependency score (Max 20)
 * @param {string} incomeType - Type of income
 * @returns {number} Score contribution
 */
function calculateIncomeScore(incomeType) {
  const incomeScores = {
    none: 20,
    unstable: 15,
    stable: 10,
    multiple: 5
  };
  return incomeScores[incomeType] || 0;
}

/**
 * Calculates dependents score (Max 20)
 * @param {number} dependents - Number of dependents
 * @returns {number} Score contribution
 */
function calculateDependentsScore(dependents) {
  if (dependents === 0) return 5;
  if (dependents <= 2) return 10;
  if (dependents <= 4) return 15;
  return 20; // 5+
}

/**
 * Calculates health risk score (Max 15)
 * @param {string} healthStatus - Health status
 * @returns {number} Score contribution
 */
function calculateHealthScore(healthStatus) {
  const healthScores = {
    high_risk: 15,
    moderate: 10,
    healthy: 5
  };
  return healthScores[healthStatus] || 0;
}

/**
 * Calculates savings buffer score (Max 20)
 * @param {number} savingsMonths - Months of savings
 * @returns {number} Score contribution
 */
function calculateSavingsScore(savingsMonths) {
  if (savingsMonths < 1) return 20;
  if (savingsMonths <= 3) return 15;
  if (savingsMonths <= 6) return 10;
  return 5; // 6+
}

/**
 * Calculates insurance coverage score (Max 15)
 * @param {string} coverage - Insurance coverage level
 * @returns {number} Score contribution
 */
function calculateInsuranceScore(coverage) {
  const coverageScores = {
    none: 15,
    partial: 10,
    full: 5
  };
  return coverageScores[coverage] || 0;
}

/**
 * Calculates lifestyle risk score (Max 10)
 * @param {string} lifestyleRisk - Lifestyle risk level
 * @returns {number} Score contribution
 */
function calculateLifestyleScore(lifestyleRisk) {
  const lifestyleScores = {
    high: 10,
    medium: 7,
    low: 5
  };
  return lifestyleScores[lifestyleRisk] || 0;
}

/**
 * Generates key risks based on individual profile
 * @param {Object} input - Individual input data
 * @param {Object} breakdown - Score breakdown
 * @returns {string[]} Array of key risk descriptions
 */
function generateKeyRisks(input, breakdown) {
  const risks = [];

  if (input.has_insurance === 'none') {
    risks.push('No financial protection against unexpected events');
  }

  if (input.dependents > 0) {
    risks.push('Family dependency risk - income loss impacts dependents');
  }

  if (input.savings_months < 3) {
    risks.push('Low financial buffer - limited emergency reserves');
  }

  if (input.lifestyle_risk === 'high') {
    risks.push('High lifestyle risk - increased exposure to accidents');
  }

  if (input.income_type === 'unstable' || input.income_type === 'none') {
    risks.push('Income instability - unpredictable cash flow');
  }

  if (input.health_status === 'high_risk') {
    risks.push('Health vulnerability - elevated medical risk');
  }

  return risks;
}

/**
 * Generates insurance recommendations based on individual profile
 * @param {Object} input - Individual input data
 * @param {string} riskLevel - Calculated risk level
 * @returns {string[]} Array of recommended insurance products
 */
function generateRecommendations(input, riskLevel) {
  const recommendations = [];
  const hasAnyInsurance = input.has_insurance !== 'none';

  // Core recommendations based on risk level
  if (riskLevel === RISK_LEVELS.HIGH || riskLevel === RISK_LEVELS.MODERATE) {
    if (!hasAnyInsurance) {
      recommendations.push('Health Insurance', 'Life Insurance');
    }

    if (input.dependents > 0) {
      recommendations.push('Term Life Insurance');
    }

    if (input.income_type === 'stable' || input.income_type === 'multiple') {
      recommendations.push('Income Protection Plan');
    }

    if (input.savings_months < 3) {
      recommendations.push('Personal Accident Insurance');
    }
  }

  // Add recommendations based on specific conditions
  if (input.lifestyle_risk === 'high') {
    recommendations.push('Comprehensive Personal Accident Cover');
  }

  if (input.health_status === 'moderate' || input.health_status === 'high_risk') {
    if (!recommendations.includes('Health Insurance')) {
      recommendations.push('Health Insurance');
    }
    recommendations.push('Critical Illness Cover');
  }

  if (input.dependents > 0 && !recommendations.includes('Life Insurance')) {
    recommendations.push('Family Life Insurance');
  }

  // Remove duplicates and limit to 6
  const unique = [...new Set(recommendations)];
  return unique.slice(0, 6);
}

/**
 * Calculates individual risk score and generates full risk assessment
 * @param {Object} input - Individual risk input data
 * @returns {Object} Complete risk assessment result
 */
export function calculateIndividualRisk(input) {
  log('INFO', 'Calculating individual risk');

  try {
    validateInput(input);
  } catch (validationError) {
    log('ERROR', 'Validation failed', validationError);
    throw validationError;
  }

  // Calculate breakdown scores
  const breakdown = createIndividualBreakdown();

  breakdown.income = calculateIncomeScore(input.income_type);
  breakdown.dependents = calculateDependentsScore(input.dependents);
  breakdown.health = calculateHealthScore(input.health_status);
  breakdown.savings = calculateSavingsScore(input.savings_months);
  breakdown.insurance = calculateInsuranceScore(input.has_insurance);
  breakdown.lifestyle = calculateLifestyleScore(input.lifestyle_risk);

  // Normalize to ensure max score of 100
  const normalizedBreakdown = normalizeBreakdown(breakdown);

  // Calculate total score
  const totalScore = Object.values(normalizedBreakdown)
    .reduce((sum, val) => sum + val, 0);

  const score = clampScore(totalScore);
  const level = classifyRiskLevel(score);

  log('INFO', `Individual risk calculated: score=${score}, level=${level}`);

  return {
    score,
    level,
    type: 'individual',
    breakdown: normalizedBreakdown,
    key_risks: generateKeyRisks(input, normalizedBreakdown),
    recommendations: generateRecommendations(input, level)
  };
}

export default calculateIndividualRisk;
