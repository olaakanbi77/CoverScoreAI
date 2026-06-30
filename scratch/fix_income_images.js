const fs = require('fs');

const files = [
  'src/views/coverscore-personal-income.hbs',
  'src/views/coverscore-personal-income-calculator.hbs'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/risk-income-1\.jpg/g, 'risk-income-1.png');
  c = c.replace(/risk-income-2\.jpg/g, 'risk-income-2.png');
  c = c.replace(/risk-income-3\.jpg/g, 'risk-income-3.png');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
