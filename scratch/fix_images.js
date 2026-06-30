const fs = require('fs');

const files = [
  'src/views/coverscore-personal-retirement.hbs',
  'src/views/coverscore-personal-retirement-calculator.hbs'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  // First slide
  c = c.replace(/risk-retirement-\.png" alt="Retirement Came Earlier/g, 'risk-retirement-1.png" alt="Retirement Came Earlier');
  // Second slide
  c = c.replace(/risk-retirement-\.png" alt="Inflation Reduced/g, 'risk-retirement-2.png" alt="Inflation Reduced');
  // Third slide
  c = c.replace(/risk-retirement-\.png" alt="Supporting Adult/g, 'risk-retirement-3.png" alt="Supporting Adult');
  
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
