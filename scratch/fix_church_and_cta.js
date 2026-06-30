const fs = require('fs');
const path = require('path');

const viewsDir = 'src/views';
const files = fs.readdirSync(viewsDir)
  .filter(f => f.startsWith('coverscore-personal-') && f.endsWith('.hbs'))
  .map(f => path.join(viewsDir, f));

const getChurchReplacement = (f) => {
  if (f.includes('health')) return 'Lessons everyone should learn about their health.';
  if (f.includes('income')) return 'Lessons everyone should learn about income protection.';
  if (f.includes('retirement')) return 'Lessons everyone should learn about retirement.';
  if (f.includes('young-professional')) return 'Lessons every young professional should learn.';
  if (f.includes('entrepreneur')) return 'Lessons every business owner should learn.';
  if (f.includes('family')) return 'Lessons every family should learn.';
  return 'Lessons everyone should learn.';
};

const getReportName = (f) => {
  if (f.includes('health')) return 'HEALTH PROTECTION REPORT™';
  if (f.includes('income')) return 'INCOME PROTECTION REPORT™';
  if (f.includes('retirement')) return 'RETIREMENT READINESS REPORT™';
  if (f.includes('young-professional')) return 'YOUNG PROFESSIONAL REPORT™';
  if (f.includes('entrepreneur')) return 'ENTREPRENEUR RISK REPORT™';
  if (f.includes('family')) return 'FAMILY PROTECTION REPORT™';
  return 'REPORT™';
};

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Replace the church text
  c = c.replace(/Lessons every church should learn\./g, getChurchReplacement(f));
  
  // Reduce font size
  c = c.replace(/font-size:22px;/g, 'font-size:16px;');
  
  // Fix the report names on calculator templates which got copied as "FAMILY REPORT™"
  if (f.includes('-calculator.hbs')) {
     c = c.replace(/>FAMILY REPORT™</g, `>${getReportName(f)}<`);
  } else if (f.includes('family.hbs')) {
     c = c.replace(/>FAMILY REPORT™</g, `>${getReportName(f)}<`);
  }
  
  fs.writeFileSync(f, c);
  console.log('Processed', f);
});
