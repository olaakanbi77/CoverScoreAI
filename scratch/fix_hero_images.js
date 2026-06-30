const fs = require('fs');

const mappings = [
  { files: ['src/views/coverscore-personal-retirement.hbs', 'src/views/coverscore-personal-retirement-calculator.hbs'], find: /hero-retirement\.png/g, replace: 'hero-retirement.jpg' },
  { files: ['src/views/coverscore-personal-health.hbs', 'src/views/coverscore-personal-health-calculator.hbs'], find: /hero-health\.png/g, replace: 'hero-health.jpg' },
  { files: ['src/views/coverscore-personal-income.hbs', 'src/views/coverscore-personal-income-calculator.hbs'], find: /hero-income\.png/g, replace: 'hero-income.jpg' },
  { files: ['src/views/coverscore-personal-young-professional.hbs', 'src/views/coverscore-personal-young-professional-calculator.hbs'], find: /hero-future\.png/g, replace: 'hero-future.jpg' },
  { files: ['src/views/coverscore-personal-entrepreneur.hbs', 'src/views/coverscore-personal-entrepreneur-calculator.hbs'], find: /hero-business\.png/g, replace: 'hero-business.jpg' }
];

mappings.forEach(mapping => {
  mapping.files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(mapping.find, mapping.replace);
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
  });
});
