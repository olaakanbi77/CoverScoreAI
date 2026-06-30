const fs = require('fs');

const files = [
  'src/views/coverscore-personal-entrepreneur.hbs',
  'src/views/coverscore-personal-entrepreneur-calculator.hbs'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/risk-entrepreneur-1\.jpg/g, 'risk-entrepreneur-1.png');
  c = c.replace(/risk-entrepreneur-2\.jpg/g, 'risk-entrepreneur-2.png');
  c = c.replace(/risk-entrepreneur-3\.jpg/g, 'risk-entrepreneur-3.png');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
