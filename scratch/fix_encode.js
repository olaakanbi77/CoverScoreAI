const fs = require('fs');
const files = [
  'src/views/coverscore-personal-family.hbs',
  'src/views/coverscore-personal-family-calculator.hbs',
  'src/views/coverscore-personal-retirement.hbs',
  'src/views/coverscore-personal-retirement-calculator.hbs',
  'src/views/coverscore-personal-health.hbs',
  'src/views/coverscore-personal-health-calculator.hbs',
  'src/views/coverscore-personal-income.hbs',
  'src/views/coverscore-personal-income-calculator.hbs',
  'src/views/coverscore-personal-young-professional.hbs',
  'src/views/coverscore-personal-young-professional-calculator.hbs',
  'src/views/coverscore-personal-entrepreneur.hbs',
  'src/views/coverscore-personal-entrepreneur-calculator.hbs'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Find strings like: const text = encodeURIComponent(`FAMILY ${campaignCode}`);
  content = content.replace(/const text = encodeURIComponent\(`[A-Z_]+ \$\{campaignCode\}`\);/g, 'const text = encodeURIComponent(campaignCode);');
  
  fs.writeFileSync(file, content);
  console.log('Fixed text encode for', file);
}
