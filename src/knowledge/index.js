const products = require('./products.json');

function getProduct(code) {
  return products.find(p => p.code === code) || null;
}

function getProductsByIndustry(prefix) {
  return products.filter(p => p.industries.includes(prefix));
}

function getProductsByPillar(pillarName) {
  return products.filter(p =>
    p.risk_mappings.some(r => r.pillar === pillarName)
  );
}

function getCrossSellProducts(productCode) {
  const product = getProduct(productCode);
  if (!product) return [];
  return product.cross_sell;
}

function getProductFAQs(productCode) {
  const product = getProduct(productCode);
  if (!product) return [];
  return product.faqs;
}

function getObjectionResponse(productCode, objection) {
  const product = getProduct(productCode);
  if (!product) return null;
  const match = product.objections.find(o =>
    o.objection.toLowerCase().includes(objection.toLowerCase())
  );
  return match ? match.response : null;
}

module.exports = {
  getProduct,
  getProductsByIndustry,
  getProductsByPillar,
  getCrossSellProducts,
  getProductFAQs,
  getObjectionResponse
};
