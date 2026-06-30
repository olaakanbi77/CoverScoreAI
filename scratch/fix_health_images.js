const fs = require('fs');

const files = [
  'src/views/coverscore-personal-health.hbs',
  'src/views/coverscore-personal-health-calculator.hbs'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/risk-health-1\.jpg/g, 'risk-health-1.png');
  c = c.replace(/risk-health-2\.jpg/g, 'risk-health-2.png');
  c = c.replace(/risk-health-3\.jpg/g, 'risk-health-3.png');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
