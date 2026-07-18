const { catalog } = require('./productCatalog');
const { run, get } = require('../config/database');

async function seedCatalog() {
  console.log('[seedCatalog] Seeding full product catalog...');
  let productCount = 0, classCount = 0, rateCount = 0;

  for (const product of catalog) {
    const inputSchema = JSON.stringify(product.inputs || {});
    const cat = product.category || 'BUSINESS';

    const existing = await get('SELECT code FROM rating_products WHERE code = ?', [product.code]);
    if (!existing) {
      await run(
        'INSERT INTO rating_products (code, name, description, category, input_schema, icon) VALUES (?, ?, ?, ?, ?, ?)',
        [product.code, product.name, product.desc || '', cat, inputSchema, product.icon || 'g']
      );
      productCount++;
    }

    const productClasses = product.classes || [];
    const productRates = product.rates || {};

    for (const cls of productClasses) {
      const rateVal = productRates[cls];
      if (rateVal === undefined) continue;

      const clsExisting = await get(
        'SELECT id FROM rating_classes WHERE product_code = ? AND name = ?',
        [product.code, cls]
      );
      if (!clsExisting) {
        await run(
          'INSERT INTO rating_classes (product_code, name, description) VALUES (?, ?, ?)',
          [product.code, cls, `Rating class for ${product.name}`]
        );
        classCount++;
      }

      const rateExisting = await get(
        'SELECT id FROM rating_rates WHERE product_code = ? AND class_name = ?',
        [product.code, cls]
      );
      if (!rateExisting) {
        await run(
          'INSERT INTO rating_rates (product_code, class_name, rate, min_premium) VALUES (?, ?, ?, ?)',
          [product.code, cls, rateVal, product.min_premium || 0]
        );
        rateCount++;
      }
    }
  }

  console.log(`[seedCatalog] Done: ${productCount} products, ${classCount} classes, ${rateCount} rates seeded.`);
  return { productCount, classCount, rateCount };
}

module.exports = { seedCatalog };
