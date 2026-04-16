/**
 * Risk Engine - Usage Examples
 * Run with: node --experimental-modules example.js
 */

import { calculateRisk, validateInput, RISK_LEVELS } from './index.js';

console.log('=== Individual Risk Assessment ===\n');

const individualInput = {
  income_type: 'stable',
  dependents: 3,
  health_status: 'healthy',
  savings_months: 2,
  has_insurance: 'partial',
  lifestyle_risk: 'medium'
};

console.log('Input:', JSON.stringify(individualInput, null, 2));
console.log('\nResult:');

const individualResult = calculateRisk(individualInput);
console.log(JSON.stringify(individualResult, null, 2));

console.log('\n--- Individual Validation ---');
console.log(validateInput(individualInput));

console.log('\n\n=== Business Risk Assessment ===\n');

const businessInput = {
  business_type: 'retail',
  asset_value: 'high',
  customer_interaction: 'high',
  staff_size: 'large',
  location_risk: 'medium',
  continuity_plan: 'none',
  insurance_coverage: 'partial'
};

console.log('Input:', JSON.stringify(businessInput, null, 2));
console.log('\nResult:');

const businessResult = calculateRisk(businessInput);
console.log(JSON.stringify(businessResult, null, 2));

console.log('\n--- Business Validation ---');
console.log(validateInput(businessInput));

console.log('\n\n=== High Risk Individual ===\n');

const highRiskIndividual = {
  income_type: 'none',
  dependents: 5,
  health_status: 'high_risk',
  savings_months: 0,
  has_insurance: 'none',
  lifestyle_risk: 'high'
};

console.log('Input:', JSON.stringify(highRiskIndividual, null, 2));
console.log('\nResult:');
console.log(JSON.stringify(calculateRisk(highRiskIndividual), null, 2));

console.log('\n\n=== Low Risk Business ===\n');

const lowRiskBusiness = {
  business_type: 'digital',
  asset_value: 'low',
  customer_interaction: 'low',
  staff_size: 'small',
  location_risk: 'low',
  continuity_plan: 'strong',
  insurance_coverage: 'full'
};

console.log('Input:', JSON.stringify(lowRiskBusiness, null, 2));
console.log('\nResult:');
console.log(JSON.stringify(calculateRisk(lowRiskBusiness), null, 2));

console.log('\n\n=== Error Handling ===\n');

try {
  calculateRisk({ invalid: 'input' });
} catch (error) {
  console.log('Caught expected error:', JSON.stringify(error, null, 2));
}

console.log('\n=== Test Complete ===');
