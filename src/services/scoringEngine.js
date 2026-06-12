const getRiskLevel = (score) => {
  if (score <= 20) return 'Very Low Risk';
  if (score <= 40) return 'Low Risk';
  if (score <= 60) return 'Moderate Risk';
  if (score <= 80) return 'High Risk';
  return 'Critical Risk';
};

const calcCategory = (e, i, p, t) => {
  return (e * 0.3) + (i * 0.3) + ((100 - p) * 0.2) + ((100 - t) * 0.2);
};

// Map textual answers to numerical values for Business
const mapVal = (val, mapping, defaultVal = 0) => mapping[val] !== undefined ? mapping[val] : defaultVal;

const calculateBusinessScore = (answers) => {
  const { business, property, business_interruption, employee_risk, liability, vehicle, cyber, claims } = answers;

  // Property Risk (15%)
  let propE = 0, propI = 0, propP = 0, propT = 0;
  if (property) {
    propE = mapVal(property.building_value, { 'under_10m': 20, '10m_50m': 50, '50m_250m': 75, 'above_250m': 100 }, 50);
    propI = mapVal(property.equipment_value, { 'under_5m': 20, '5m_20m': 50, '20m_100m': 75, 'above_100m': 100 }, 50);
    propP = mapVal(property.fire_extinguishers, { 'none': 0, 'some': 50, 'all': 100 }, 0);
    propT = 0; // Assume 0 unless we have data
  }
  const propertyScore = calcCategory(propE, propI, propP, propT);

  // Employee Risk (15%)
  let empE = 0, empI = 0, empP = 0, empT = 0;
  if (business) {
    empE = mapVal(business.employees, { '1_5': 20, '6_20': 50, '21_50': 75, '51_100': 100, '101_500': 100, '500plus': 100 }, 20);
  }
  if (employee_risk) {
    empI = mapVal(employee_risk.accidents, { 'none': 20, '1_2': 50, '3_5': 75, 'above_5': 100 }, 50);
    empP = 50; // Safety policies default
    empT = mapVal(employee_risk.workers_comp, { 'yes': 100, 'no': 0 }, 0);
  }
  const employeeScore = calcCategory(empE, empI, empP, empT);

  // Liability Risk (15%)
  let liabE = 0, liabI = 0, liabP = 0, liabT = 0;
  if (liability) {
    liabE = mapVal(liability.customer_interaction, { 'rarely': 20, 'occasionally': 50, 'frequently': 100 }, 50);
    liabI = mapVal(liability.premises_injury, { 'low': 20, 'moderate': 50, 'high': 100 }, 50);
    liabP = mapVal(liability.product_liability, { 'no': 80, 'yes': 20 }, 50);
  }
  const liabilityScore = calcCategory(liabE, liabI, liabP, liabT);

  // Operational Risk (15%) - Using Vehicle/Claims data as proxy if present
  let opE = 50, opI = 50, opP = 50, opT = 0;
  if (vehicle && vehicle.own_vehicles === 'yes') {
    opE = mapVal(vehicle.num_vehicles, { '1_3': 30, '4_10': 60, '11_50': 80, 'above_50': 100 }, 50);
    opI = mapVal(vehicle.transit_value, { 'under_1m': 20, '1m_10m': 50, '10m_100m': 80, 'above_100m': 100 }, 50);
    opP = mapVal(vehicle.transport_goods, { 'occasionally': 60, 'weekly': 40, 'daily': 20 }, 50);
  }
  const operationalScore = calcCategory(opE, opI, opP, opT);

  // Business Continuity Risk (15%)
  let bcE = 50, bcI = 50, bcP = 0, bcT = 0;
  if (business_interruption) {
    bcI = mapVal(business_interruption.revenue_impact, { 'minimally': 20, 'moderately': 50, 'significantly': 80, 'catastrophically': 100 }, 50);
    bcP = mapVal(business_interruption.alt_location, { 'yes': 80, 'no': 0 }, 0);
  }
  const continuityScore = calcCategory(bcE, bcI, bcP, bcT);

  // Cyber Risk (10%)
  let cybE = 0, cybI = 0, cybP = 0, cybT = 0;
  if (cyber) {
    cybE = mapVal(cyber.store_data, { 'yes': 100, 'no': 20 }, 50);
    cybI = mapVal(cyber.incidents, { 'none': 20, '1_2': 60, 'above_2': 100 }, 50);
    cybP = mapVal(cyber.backups, { 'daily': 100, 'weekly': 70, 'occasionally': 30, 'never': 0 }, 50);
  }
  const cyberScore = calcCategory(cybE, cybI, cybP, cybT);

  // Regulatory Risk (10%) & Key Person Risk (5%)
  const regulatoryScore = 50; 
  const keyPersonScore = 50;

  let finalScore = (propertyScore * 0.15) + (employeeScore * 0.15) + (liabilityScore * 0.15) + 
                   (operationalScore * 0.15) + (continuityScore * 0.15) + (cyberScore * 0.10) + 
                   (regulatoryScore * 0.10) + (keyPersonScore * 0.05);

  const resilience_score = Math.max(0, 100 - Math.round(finalScore));

  const recommendations = [];
  const identified_gaps = [];
  
  if (propP < 50 || propT < 50) { recommendations.push('Fire & Special Perils Insurance'); identified_gaps.push('Property protection gaps identified'); }
  if (empT < 50) { recommendations.push('Group Life & Workmen Compensation'); identified_gaps.push('Employee risk exposure unprotected'); }
  if (liabE > 50 && liabT < 50) { recommendations.push('Public Liability Insurance'); identified_gaps.push('High liability exposure with limited protection'); }
  if (bcP < 50) { recommendations.push('Business Interruption Insurance'); identified_gaps.push('Vulnerable to business continuity disruption'); }
  if (cybE > 50 && cybP < 50) { recommendations.push('Cyber Liability Insurance'); identified_gaps.push('Cyber risk management gaps'); }

  let baseValue = 5000000;
  if (business && business.turnover) {
    if (business.turnover === 'above_1b') baseValue = 1000000000;
    else if (business.turnover === '250m_1b') baseValue = 500000000;
    else if (business.turnover === '50m_250m') baseValue = 150000000;
    else if (business.turnover === '10m_50m') baseValue = 30000000;
    else if (business.turnover === 'under_10m') baseValue = 8000000;
  }

  const effectiveRisk = Math.max((finalScore / 100), 0.05);
  const maxLoss = Math.round(baseValue * effectiveRisk);
  const minLoss = Math.round(maxLoss * 0.4);

  return {
    score: Math.min(Math.round(finalScore), 100),
    resilience_score,
    risk_level: getRiskLevel(finalScore),
    recommendations,
    identified_gaps,
    risk_categories: {
      property_risk: Math.round(propertyScore),
      employee_risk: Math.round(employeeScore),
      liability_risk: Math.round(liabilityScore),
      operational_risk: Math.round(operationalScore),
      business_continuity_risk: Math.round(continuityScore),
      cyber_risk: Math.round(cyberScore),
      regulatory_risk: Math.round(regulatoryScore),
      key_person_risk: Math.round(keyPersonScore)
    },
    min_loss: minLoss,
    max_loss: maxLoss
  };
};

const calculateIndividualScore = (answers) => {
  const { personal, family_protection, health_protection, home_risk, motor_risk, financial_resilience } = answers;

  // Life Risk (20%)
  let lifeE = 50, lifeI = 50, lifeP = 50, lifeT = 0;
  if (personal) {
    lifeE = mapVal(personal.dependents, { 'none': 0, '1_2': 30, '3_5': 60, 'more_than_5': 100 }, 30);
  }
  if (family_protection) {
    lifeI = mapVal(family_protection.lifestyle_maintenance, { 'more_than_24m': 0, '12_24m': 30, '6_12m': 60, '3_6m': 80, 'less_than_3m': 100 }, 50);
    lifeT = mapVal(family_protection.life_insurance, { 'yes': 100, 'no': 0 }, 0);
  }
  const lifeScore = calcCategory(lifeE, lifeI, lifeP, lifeT);

  // Health Risk (20%)
  let healthE = 50, healthI = 50, healthP = 50, healthT = 0;
  if (health_protection) {
    healthI = mapVal(health_protection.annual_spending, { 'under_100k': 20, '100k_500k': 50, '500k_1m': 80, 'above_1m': 100 }, 50);
    healthT = mapVal(health_protection.health_insurance, { 'yes': 100, 'no': 0 }, 0);
  }
  const healthScore = calcCategory(healthE, healthI, healthP, healthT);

  // Income Risk (20%)
  let incE = 50, incI = 50, incP = 50, incT = 0;
  if (financial_resilience) {
    incI = mapVal(financial_resilience.income_stop, { 'more_than_24m': 0, '12_24m': 25, '6_12m': 50, '3_6m': 75, 'less_than_3m': 100 }, 50);
    incP = mapVal(financial_resilience.emergency_fund, { 'yes': 80, 'no': 20 }, 50);
  }
  const incomeScore = calcCategory(incE, incI, incP, incT);

  // Asset Risk (15%)
  let assE = 50, assI = 50, assP = 50, assT = 0;
  if (home_risk) {
    assE = mapVal(home_risk.property_value, { 'under_10m': 20, '10m_50m': 50, '50m_100m': 80, 'above_100m': 100 }, 50);
    assT = mapVal(home_risk.home_insurance, { 'yes': 100, 'no': 0 }, 0);
  }
  if (motor_risk && motor_risk.own_vehicle === 'yes') {
    assE = Math.max(assE, 60); // higher exposure if owning car
    if (motor_risk.motor_insurance === 'yes') assT = Math.max(assT, 50);
  }
  const assetScore = calcCategory(assE, assI, assP, assT);

  // Liability Risk (10%) - Motor is biggest source of personal liability in this scope
  let plE = 50, plI = 50, plP = 50, plT = 0;
  if (motor_risk && motor_risk.own_vehicle === 'yes') {
    plE = 80;
    plT = mapVal(motor_risk.motor_insurance, { 'yes': 100, 'no': 0 }, 0);
  }
  const liabilityScore = calcCategory(plE, plI, plP, plT);

  // Retirement Risk (10%) & Estate Planning Risk (5%)
  const retirementScore = 50; 
  const estateScore = 50;

  let finalScore = (lifeScore * 0.20) + (healthScore * 0.20) + (incomeScore * 0.20) + 
                   (assetScore * 0.15) + (liabilityScore * 0.10) + (retirementScore * 0.10) + 
                   (estateScore * 0.05);

  const resilience_score = Math.max(0, 100 - Math.round(finalScore));

  const recommendations = [];
  const identified_gaps = [];

  if (lifeT < 50 && lifeE > 30) { recommendations.push('Life Insurance'); identified_gaps.push('Dependents exposed to loss of income'); }
  if (healthT < 50) { recommendations.push('Health Insurance / HMO'); identified_gaps.push('Out-of-pocket medical expenses vulnerability'); }
  if (assT < 50) { recommendations.push('Home/Property Insurance'); identified_gaps.push('Asset exposure to fire/theft'); }
  if (plT < 50 && plE > 50) { recommendations.push('Comprehensive Motor Insurance'); identified_gaps.push('Vehicle liability exposure'); }
  if (incI > 50) { recommendations.push('Income Protection Planning'); identified_gaps.push('Inadequate emergency buffers'); }

  let baseValue = 5000000;
  if (home_risk?.property_value === 'above_100m') baseValue = 150000000;
  else if (home_risk?.property_value === '50m_100m') baseValue = 75000000;
  else if (home_risk?.property_value === '10m_50m') baseValue = 30000000;

  const effectiveRisk = Math.max((finalScore / 100), 0.05);
  const maxLoss = Math.round(baseValue * effectiveRisk);
  const minLoss = Math.round(maxLoss * 0.4);

  return {
    score: Math.min(Math.round(finalScore), 100),
    resilience_score,
    risk_level: getRiskLevel(finalScore),
    recommendations,
    identified_gaps,
    risk_categories: {
      life_risk: Math.round(lifeScore),
      health_risk: Math.round(healthScore),
      income_risk: Math.round(incomeScore),
      asset_risk: Math.round(assetScore),
      liability_risk: Math.round(liabilityScore),
      retirement_risk: Math.round(retirementScore),
      estate_planning_risk: Math.round(estateScore)
    },
    min_loss: minLoss,
    max_loss: maxLoss
  };
};

const calculateScore = (answers) => {
  if (answers?.type?.entity_type === 'individual') {
    return calculateIndividualScore(answers);
  }
  return calculateBusinessScore(answers);
};

module.exports = {
  calculateScore,
  getRiskLevel
};
