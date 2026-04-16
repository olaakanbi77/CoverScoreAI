const getRiskLevel = (score) => {
  if (score <= 25) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'critical';
};

const calculateBusinessScore = (answers) => {
  let score = 0;
  const { business, assets, liability, staff, insurance } = answers;

  if (business) {
    if (business.employees === 'large') score += 3;
    else if (business.employees === 'medium') score += 2;

    if (business.revenue === 'high') score += 3;
    else if (business.revenue === 'medium') score += 2;

    if (business.locationType === 'multiple') score += 3;
    else if (business.locationType === 'shared') score += 2;
  }

  if (assets) {
    if (assets.assetValue === 'high') score += 5;
    else if (assets.assetValue === 'medium') score += 3;
    else score += 1;

    if (assets.fireProtection === 'none') score += 5;
    else if (assets.fireProtection === 'partial') score += 3;
    else score += 1;

    if (assets.equipment === 'owned') score += 2;
    else score += 1;

    if (assets.lossHistory === 'frequent') score += 5;
    else if (assets.lossHistory === 'occasional') score += 3;
    else score += 1;
  }

  if (liability) {
    if (liability.customerInteraction === 'onsite') score += 5;
    else if (liability.customerInteraction === 'mixed') score += 3;
    else score += 1;

    if (liability.professionalServices) score += 5;

    if (liability.clientLoss === 'high') score += 5;
    else if (liability.clientLoss === 'medium') score += 3;
    else score += 1;
  }

  if (staff) {
    if (staff.count === 'large') score += 3;
    else if (staff.count === 'medium') score += 2;
    else score += 1;

    if (staff.riskExposure === 'high') score += 5;
    else if (staff.riskExposure === 'medium') score += 3;
    else score += 1;

    if (staff.benefits === 'none') score += 4;
    else if (staff.benefits === 'basic') score += 2;
    else score += 1;
  }

  if (insurance) {
    if (insurance.existing === 'none') score += 5;
    else if (insurance.existing === 'partial') score += 3;
    else score += 1;

    if (insurance.lastReview === 'never') score += 3;
    else if (insurance.lastReview === 'over2years') score += 2;
    else score += 1;
  }

  return score;
};

const calculateIndividualScore = (answers) => {
  let score = 0;
  const { personal, personal_assets, personal_liability, health, personal_insurance } = answers;

  if (personal) {
    if (personal.ageRange === '55plus') score += 4;
    else if (personal.ageRange === '40_54') score += 3;
    else if (personal.ageRange === '25_39') score += 2;
    else score += 1;

    if (personal.dependents === 'many') score += 5;
    else if (personal.dependents === 'few') score += 3;
    else score += 1;

    if (personal.employment === 'self_employed') score += 4;
    else if (personal.employment === 'unemployed') score += 5;
    else score += 2;
  }

  if (personal_assets) {
    if (personal_assets.housing === 'owned') score += 4;
    else if (personal_assets.housing === 'rented') score += 2;
    else score += 1;

    if (personal_assets.vehicles === 'multiple') score += 5;
    else if (personal_assets.vehicles === 'one') score += 3;
    else score += 1;

    if (personal_assets.highValueItems === 'yes') score += 4;
    else score += 1;
  }

  if (personal_liability) {
    if (personal_liability.domesticStaff === 'yes') score += 5;
    else score += 1;

    if (personal_liability.travel === 'frequent') score += 4;
    else if (personal_liability.travel === 'occasional') score += 2;
    else score += 1;

    if (personal_liability.pets === 'yes') score += 2;
    else score += 1;
  }

  if (health) {
    if (health.healthStatus === 'poor') score += 5;
    else if (health.healthStatus === 'fair') score += 3;
    else score += 1;

    if (health.preExisting === 'yes') score += 5;
    else score += 1;
  }

  if (personal_insurance) {
    if (personal_insurance.health === 'none') score += 5;
    else if (personal_insurance.health === 'basic') score += 3;
    else score += 1;

    if (personal_insurance.life === 'none') score += 4;
    else if (personal_insurance.life === 'basic') score += 2;
    else score += 1;
  }

  return score;
};

const calculateScore = (answers) => {
  const entityType = answers?.type?.entity_type || 'business';
  let score;

  if (entityType === 'individual') {
    score = calculateIndividualScore(answers);
  } else {
    score = calculateBusinessScore(answers);
  }

  return { score, riskLevel: getRiskLevel(score) };
};

module.exports = { calculateScore, getRiskLevel };
