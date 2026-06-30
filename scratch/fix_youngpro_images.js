const fs = require('fs');

const files = [
  'src/views/coverscore-personal-young-professional.hbs',
  'src/views/coverscore-personal-young-professional-calculator.hbs'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/risk-youngpro-1\.jpg/g, 'risk-youngpro-1.png');
  c = c.replace(/risk-youngpro-2\.jpg/g, 'risk-youngpro-2.png');
  c = c.replace(/risk-youngpro-3\.jpg/g, 'risk-youngpro-3.png');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
