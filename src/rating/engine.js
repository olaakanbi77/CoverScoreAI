const { get, all } = require('../config/database');

const modules = {
  FIRE: require('./modules/fire'),
  PL: require('./modules/publicLiability'),
  MOTOR: require('./modules/motor'),
  GPA: require('./modules/groupLife'),
  FG: require('./modules/fidelityGuarantee')
};

const getRate = async (productCode, className) => {
  const rate = await get(
    'SELECT rate, min_premium FROM rating_rates WHERE product_code = ? AND class_name = ?',
    [productCode, className]
  );
  if (!rate) {
    const fallback = await get(
      'SELECT rate, min_premium FROM rating_rates WHERE product_code = ? ORDER BY rate DESC LIMIT 1',
      [productCode]
    );
    return fallback || { rate: 0.01, min_premium: 50000 };
  }
  return rate;
};

const getClasses = async (productCode) => {
  return await all('SELECT name, description FROM rating_classes WHERE product_code = ? ORDER BY name', [productCode]);
};

const getProducts = async (category) => {
  if (category) {
    return await all('SELECT * FROM rating_products WHERE category = ? ORDER BY name', [category]);
  }
  return await all('SELECT * FROM rating_products ORDER BY name');
};

const resolveClassFromAssessment = async (productCode, assessmentData, prefix) => {
  const classMap = {
    FIRE: { SCH: 'School', HOS: 'Hospital', MFG: 'Manufacturing', CHR: 'Church', SME: 'Office', BUS: 'Office' },
    PL: { SCH: 'School', HOS: 'Hospital', MFG: 'Manufacturing', CHR: 'Church', SME: 'Office', BUS: 'Office' },
    MOTOR: { SCH: 'Commercial', HOS: 'Commercial', SME: 'Commercial', BUS: 'Commercial' },
    GPA: { SCH: 'Standard', HOS: 'Standard', SME: 'Standard', BUS: 'Standard' },
    FG: { SCH: 'Standard', HOS: 'Standard', SME: 'Standard', BUS: 'Standard' }
  };
  const map = classMap[productCode] || {};
  return map[prefix] || 'Office';
};

const calculate = async (productCode, className, inputs, assessmentData, prefix) => {
  const module = modules[productCode];
  if (!module) throw new Error(`No rating module for product: ${productCode}`);

  const resolvedClass = className || await resolveClassFromAssessment(productCode, assessmentData, prefix);
  const rateInfo = await getRate(productCode, resolvedClass);

  return module.rate({
    productCode,
    className: resolvedClass,
    rate: rateInfo.rate,
    minPremium: rateInfo.min_premium,
    inputs,
    assessmentData,
    prefix
  });
};

const suggestClasses = async (productCode, prefix) => {
  const classes = await getClasses(productCode);
  const suggested = await resolveClassFromAssessment(productCode, null, prefix);
  return { classes, suggested };
};

module.exports = { calculate, getProducts, getClasses, getRate, suggestClasses, resolveClassFromAssessment };
