const fs = require('fs');
const files = {
  'src/views/coverscore-personal-family.hbs': { defaultCode: 'START FAMILY PROTECTION ASSESSMENT', oldPrefix: 'FAMILY' },
  'src/views/coverscore-personal-family-calculator.hbs': { defaultCode: 'START FAMILY PROTECTION ASSESSMENT', oldPrefix: 'FAMILY' },
  
  'src/views/coverscore-personal-retirement.hbs': { defaultCode: 'START RETIREMENT READINESS ASSESSMENT', oldPrefix: 'RETIREMENT' },
  'src/views/coverscore-personal-retirement-calculator.hbs': { defaultCode: 'START RETIREMENT READINESS ASSESSMENT', oldPrefix: 'RETIREMENT' },
  
  'src/views/coverscore-personal-health.hbs': { defaultCode: 'START HEALTH PROTECTION ASSESSMENT', oldPrefix: 'HEALTH' },
  'src/views/coverscore-personal-health-calculator.hbs': { defaultCode: 'START HEALTH PROTECTION ASSESSMENT', oldPrefix: 'HEALTH' },
  
  'src/views/coverscore-personal-income.hbs': { defaultCode: 'START INCOME PROTECTION ASSESSMENT', oldPrefix: 'INCOME' },
  'src/views/coverscore-personal-income-calculator.hbs': { defaultCode: 'START INCOME PROTECTION ASSESSMENT', oldPrefix: 'INCOME' },
  
  'src/views/coverscore-personal-young-professional.hbs': { defaultCode: 'START YOUNG PROFESSIONAL RISK ASSESSMENT', oldPrefix: 'YOUNG_PRO' },
  'src/views/coverscore-personal-young-professional-calculator.hbs': { defaultCode: 'START YOUNG PROFESSIONAL RISK ASSESSMENT', oldPrefix: 'YOUNG_PRO' },
  
  'src/views/coverscore-personal-entrepreneur.hbs': { defaultCode: 'START ENTREPRENEUR RISK ASSESSMENT', oldPrefix: 'ENTREPRENEUR' },
  'src/views/coverscore-personal-entrepreneur-calculator.hbs': { defaultCode: 'START ENTREPRENEUR RISK ASSESSMENT', oldPrefix: 'ENTREPRENEUR' }
};

for (const [file, config] of Object.entries(files)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace campaign_code fallback
  content = content.replace(/campaign_code: params\.get\('campaign_code'\) \|\| '.*?'/g, `campaign_code: params.get('campaign_code') || '${config.defaultCode}'`);
  
  // Replace const text = encodeURIComponent(`PREFIX ${campaignCode}`);
  // with const text = encodeURIComponent(campaignCode);
  const regexText = new RegExp(`const text = encodeURIComponent\\\(\\\`${config.oldPrefix} \\\\\\$\\\\\\{campaignCode\\\\\\}\\\`\\\);`, 'g');
  content = content.replace(regexText, `const text = encodeURIComponent(campaignCode);`);
  
  fs.writeFileSync(file, content);
  console.log('Cleaned up', file);
}
