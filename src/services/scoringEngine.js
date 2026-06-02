const getRiskLevel = (score) => {
  if (score <= 20) return 'Very Low Risk';
  if (score <= 40) return 'Low Risk';
  if (score <= 60) return 'Moderate Risk';
  if (score <= 80) return 'High Risk';
  return 'Critical Risk';
};

const calculateBusinessScore = (answers) => {
  const { profile, property, business_interruption, employee_risk, liability, vehicle, cyber, claims } = answers;

  let propertyScore = 0;
  if (property) {
    if (property.own_building === 'yes') propertyScore += 30;
    
    if (property.building_value === 'above_250m') propertyScore += 20;
    else if (property.building_value === '50m_250m') propertyScore += 15;
    else if (property.building_value === '10m_50m') propertyScore += 10;
    else if (property.building_value === 'under_10m') propertyScore += 5;

    if (property.equipment_value === 'above_100m') propertyScore += 20;
    else if (property.equipment_value === '20m_100m') propertyScore += 15;
    else if (property.equipment_value === '5m_20m') propertyScore += 10;
    else if (property.equipment_value === 'under_5m') propertyScore += 5;

    if (property.fire_extinguishers === 'none') propertyScore += 20;
    else if (property.fire_extinguishers === 'some') propertyScore += 10;

    if (property.fire_incident === 'yes') propertyScore += 10;
  }

  let biScore = 0;
  if (business_interruption) {
    if (business_interruption.revenue_impact === 'catastrophically') biScore += 60;
    else if (business_interruption.revenue_impact === 'significantly') biScore += 40;
    else if (business_interruption.revenue_impact === 'moderately') biScore += 20;
    else biScore += 5;

    if (business_interruption.alt_location === 'no') biScore += 40;
  }

  let employeeScore = 0;
  if (employee_risk) {
    if (employee_risk.employ_staff === 'yes') employeeScore += 30;
    if (employee_risk.death_benefits === 'no') employeeScore += 30;

    if (employee_risk.accidents === 'above_5') employeeScore += 40;
    else if (employee_risk.accidents === '3_5') employeeScore += 30;
    else if (employee_risk.accidents === '1_2') employeeScore += 15;
  }

  let liabilityScore = 0;
  if (liability) {
    if (liability.customer_interaction === 'frequently') liabilityScore += 40;
    else if (liability.customer_interaction === 'occasionally') liabilityScore += 20;

    if (liability.premises_injury === 'high') liabilityScore += 30;
    else if (liability.premises_injury === 'moderate') liabilityScore += 15;

    if (liability.product_liability === 'yes') liabilityScore += 30;
  }

  let vehicleScore = 0;
  if (vehicle && vehicle.own_vehicles === 'yes') {
    if (vehicle.num_vehicles === 'above_50') vehicleScore += 30;
    else if (vehicle.num_vehicles === '11_50') vehicleScore += 20;
    else if (vehicle.num_vehicles === '4_10') vehicleScore += 10;

    if (vehicle.transport_goods === 'daily') vehicleScore += 40;
    else if (vehicle.transport_goods === 'weekly') vehicleScore += 25;
    else if (vehicle.transport_goods === 'occasionally') vehicleScore += 10;

    if (vehicle.transit_value === 'above_100m') vehicleScore += 30;
    else if (vehicle.transit_value === '10m_100m') vehicleScore += 20;
    else if (vehicle.transit_value === '1m_10m') vehicleScore += 10;
  }

  let cyberScore = 0;
  if (cyber) {
    if (cyber.store_data === 'yes') cyberScore += 40;
    if (cyber.incidents !== 'none') cyberScore += 30;

    if (cyber.backups === 'never') cyberScore += 30;
    else if (cyber.backups === 'occasionally') cyberScore += 20;
    else if (cyber.backups === 'weekly') cyberScore += 10;
  }

  let claimsScore = 0;
  if (claims) {
    if (claims.past_losses !== 'none') claimsScore += 50;

    if (claims.loss_value === 'above_50m') claimsScore += 50;
    else if (claims.loss_value === '10m_50m') claimsScore += 40;
    else if (claims.loss_value === '1m_10m') claimsScore += 25;
    else if (claims.loss_value === 'under_1m') claimsScore += 10;
  }

  let finalScore = 0;
  if (!vehicle || vehicle.own_vehicles === 'no') {
    finalScore = (propertyScore * 0.25 * 1.11) +
                 (biScore * 0.15 * 1.11) +
                 (employeeScore * 0.15 * 1.11) +
                 (liabilityScore * 0.15 * 1.11) +
                 (cyberScore * 0.10 * 1.11) +
                 (claimsScore * 0.10 * 1.11);
  } else {
    finalScore = (propertyScore * 0.25) +
                 (biScore * 0.15) +
                 (employeeScore * 0.15) +
                 (liabilityScore * 0.15) +
                 (vehicleScore * 0.10) +
                 (cyberScore * 0.10) +
                 (claimsScore * 0.10);
  }

  const recommendations = [];
  
  if (property && (property.own_building === 'yes' || ['5m_20m', '20m_100m', 'above_100m'].includes(property.equipment_value))) {
    recommendations.push('Fire & Special Perils Insurance');
  }

  if (employee_risk && employee_risk.employ_staff === 'yes') {
    if (profile && ['6_20', '21_50', '51_100', '101_500', '500plus'].includes(profile.employees)) {
      recommendations.push('Group Life Assurance');
      recommendations.push('Employers Liability / Workmen Compensation');
    }
  }

  if (vehicle && ['daily', 'weekly'].includes(vehicle.transport_goods)) {
    recommendations.push('Goods in Transit Insurance');
  }
  
  if (liability && ['frequently', 'occasionally'].includes(liability.customer_interaction)) {
    recommendations.push('Public Liability Insurance');
  }

  if (business_interruption && ['significantly', 'catastrophically'].includes(business_interruption.revenue_impact)) {
    recommendations.push('Business Interruption Insurance');
  }

  if (cyber && cyber.store_data === 'yes') {
    recommendations.push('Cyber Liability Insurance');
  }

  let minLoss = 500000;
  let maxLoss = 2000000;

  if (profile && profile.turnover) {
    if (profile.turnover === 'above_1b') { minLoss = 100000000; maxLoss = 500000000; }
    else if (profile.turnover === '250m_1b') { minLoss = 25000000; maxLoss = 100000000; }
    else if (profile.turnover === '50m_250m') { minLoss = 5000000; maxLoss = 25000000; }
    else if (profile.turnover === '10m_50m') { minLoss = 1000000; maxLoss = 5000000; }
  }

  return {
    score: Math.min(Math.round(finalScore), 100),
    recommendations,
    min_loss: minLoss,
    max_loss: maxLoss
  };
};

const calculateIndividualScore = (answers) => {
  const { personal_profile, family_protection, health_protection, home_risk, motor_risk, financial_resilience } = answers;

  let familyScore = 0;
  if (personal_profile && family_protection) {
    if (personal_profile.dependents === 'more_than_5') familyScore += 10;
    else if (personal_profile.dependents === '3_5') familyScore += 6;
    else if (personal_profile.dependents === '1_2') familyScore += 3;

    if (family_protection.lifestyle_maintenance === 'less_than_3m') familyScore += 10;
    else if (family_protection.lifestyle_maintenance === '3_6m') familyScore += 5;

    if (family_protection.life_insurance === 'no') familyScore += 15;
  }

  let healthScore = 0;
  if (health_protection) {
    if (health_protection.health_insurance === 'no') healthScore += 15;

    if (['borrowing', 'not_sure'].includes(health_protection.medical_emergency)) healthScore += 10;
    else if (health_protection.medical_emergency === 'family') healthScore += 5;
  }

  let homeScore = 0;
  if (home_risk) {
    if (home_risk.household_contents_value === 'above_20m') homeScore += 15;
    else if (home_risk.household_contents_value === '5m_20m') homeScore += 10;
    else if (home_risk.household_contents_value === '1m_5m') homeScore += 5;
    else homeScore += 2;

    if (home_risk.burglary_fire_experience === 'yes') homeScore += 5;
  }

  let motorScore = 0;
  if (motor_risk && motor_risk.own_vehicle === 'yes') {
    if (motor_risk.motor_insurance_status === 'uninsured') motorScore += 15;
    else if (motor_risk.motor_insurance_status === 'third_party') motorScore += 5;

    if (motor_risk.accident_history === 'yes') motorScore += 5;
  }

  let financialScore = 0;
  if (financial_resilience) {
    if (financial_resilience.survival_months === 'less_than_1m') financialScore += 20;
    else if (financial_resilience.survival_months === '1_3m') financialScore += 15;
    else if (financial_resilience.survival_months === '3_6m') financialScore += 5;
  }

  let finalScore = familyScore + healthScore + homeScore + motorScore + financialScore;

  const recommendations = [];

  if (family_protection?.life_insurance === 'no' && personal_profile?.dependents && personal_profile.dependents !== 'none') {
    recommendations.push('Term Life Insurance');
  }

  if (health_protection?.health_insurance === 'no') {
    recommendations.push('HMO / Health Insurance');
  }

  if (home_risk && (home_risk.residence_status === 'own' || ['1m_5m', '5m_20m', 'above_20m'].includes(home_risk.household_contents_value))) {
    recommendations.push('Home/Property Contents Insurance');
  }

  if (motor_risk && motor_risk.own_vehicle === 'yes' && motor_risk.motor_insurance_status !== 'comprehensive') {
    recommendations.push('Comprehensive Motor Insurance');
  }

  if (financial_resilience && ['less_than_1m', '1_3m'].includes(financial_resilience.survival_months)) {
    recommendations.push('Personal Accident & Disability Insurance');
  }

  let minLoss = 500000;
  let maxLoss = 2000000;

  if (personal_profile && personal_profile.monthly_income) {
    if (personal_profile.monthly_income === 'above_1m') { minLoss = 15000000; maxLoss = 50000000; }
    else if (personal_profile.monthly_income === '500k_1m') { minLoss = 5000000; maxLoss = 15000000; }
    else if (personal_profile.monthly_income === '100k_500k') { minLoss = 2000000; maxLoss = 5000000; }
    else { minLoss = 500000; maxLoss = 2000000; }
  }

  return { 
    score: Math.min(Math.round(finalScore), 100), 
    recommendations, 
    min_loss: minLoss, 
    max_loss: maxLoss 
  };
};

const calculateScore = (answers) => {
  const entityType = answers?.type?.entity_type || 'business';
  let result;

  if (entityType === 'individual') {
    result = calculateIndividualScore(answers);
  } else {
    result = calculateBusinessScore(answers);
  }

  return { 
    ...result,
    riskLevel: getRiskLevel(result.score)
  };
};

module.exports = { calculateScore, getRiskLevel };
