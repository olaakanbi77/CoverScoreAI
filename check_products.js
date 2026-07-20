const { all } = require('./src/config/database');
(async () => {
  const p = await all('SELECT * FROM rating_products ORDER BY name');
  console.log('Products:', p.length);
  p.forEach(x => console.log('  ' + x.code + ' "' + x.name + '" cat=' + x.category));

  const r = await all('SELECT DISTINCT product_code FROM rating_rates');
  console.log('\nRate tables:', r.map(x => x.product_code).join(', '));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
