/**
 * Risk Engine Type Definitions
 * Central type definitions for the risk scoring engine
 */

/**
 * @typedef {'healthy' | 'moderate' | 'high_risk'} HealthStatus
 * @typedef {'stable' | 'unstable' | 'multiple' | 'none'} IncomeType
 * @typedef {'low' | 'medium' | 'high'} LifestyleRisk
 * @typedef {'none' | 'partial' | 'full'} InsuranceCoverage
 * @typedef {'low' | 'medium' | 'high'} LocationRisk
 * @typedef {'none' | 'weak' | 'strong'} ContinuityPlan
 * @typedef {'small' | 'medium' | 'large'} StaffSize
 * @typedef {'manufacturing' | 'retail' | 'service' | 'digital'} BusinessType
 * @typedef {'low' | 'medium' | 'high'} CustomerInteraction
 * @typedef {'low' | 'medium' | 'high'} AssetValue
 */

/**
 * Individual risk input schema
 * @typedef {Object} IndividualInput
 * @property {IncomeType} income_type
 * @property {number} dependents
 * @property {HealthStatus} health_status
 * @property {number} savings_months
 * @property {InsuranceCoverage} has_insurance
 * @property {LifestyleRisk} lifestyle_risk
 */

/**
 * Business risk input schema
 * @typedef {Object} BusinessInput
 * @property {BusinessType} business_type
 * @property {AssetValue} asset_value
 * @property {CustomerInteraction} customer_interaction
 * @property {StaffSize} staff_size
 * @property {LocationRisk} location_risk
 * @property {ContinuityPlan} continuity_plan
 * @property {InsuranceCoverage} insurance_coverage
 */

/**
 * Risk level classification
 * @typedef {'LOW' | 'MODERATE' | 'HIGH'} RiskLevel
 */

/**
 * Individual scoring breakdown
 * @typedef {Object} IndividualBreakdown
 * @property {number} income
 * @property {number} dependents
 * @property {number} health
 * @property {number} savings
 * @property {number} insurance
 * @property {number} lifestyle
 */

/**
 * Business scoring breakdown
 * @typedef {Object} BusinessBreakdown
 * @property {number} businessType
 * @property {number} assetValue
 * @property {number} customerInteraction
 * @property {number} staffDependency
 * @property {number} locationRisk
 * @property {number} continuity
 * @property {number} insurance
 */

/**
 * Combined breakdown type
 * @typedef {IndividualBreakdown | BusinessBreakdown} ScoringBreakdown
 */

/**
 * Risk calculation result
 * @typedef {Object} RiskResult
 * @property {number} score - Final risk score (0-100)
 * @property {RiskLevel} level - Risk level classification
 * @property {'individual' | 'business'} type - Entity type
 * @property {ScoringBreakdown} breakdown - Score breakdown by category
 * @property {string[]} key_risks - Identified key risks
 * @property {string[]} recommendations - Recommended insurance products
 */

/**
 * Validation error result
 * @typedef {Object} ValidationError
 * @property {boolean} valid - Always false
 * @property {string} error - Error message
 * @property {string} [field] - Field that failed validation
 */

export const RISK_LEVELS = {
  HIGH: 'HIGH',
  MODERATE: 'MODERATE',
  LOW: 'LOW'
};

export const ENTITY_TYPES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business'
};

export const SCORE_LIMITS = {
  INDIVIDUAL: {
    INCOME: 20,
    DEPENDENTS: 20,
    HEALTH: 15,
    SAVINGS: 20,
    INSURANCE: 15,
    LIFESTYLE: 10,
    MAX: 100
  },
  BUSINESS: {
    TYPE: 20,
    ASSET: 15,
    CUSTOMER: 15,
    STAFF: 10,
    LOCATION: 10,
    CONTINUITY: 15,
    INSURANCE: 15,
    MAX: 100
  }
};
