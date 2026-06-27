const fs = require('fs');
const files = {
  'src/views/coverscore-personal-retirement.hbs': { report: 'RETIREMENT READINESS REPORT', defaultCode: 'WEB_RETIREMENT_2026', prefix: 'RETIREMENT' },
  'src/views/coverscore-personal-health.hbs': { report: 'HEALTH PROTECTION REPORT', defaultCode: 'WEB_HEALTH_2026', prefix: 'HEALTH' },
  'src/views/coverscore-personal-income.hbs': { report: 'INCOME PROTECTION REPORT', defaultCode: 'WEB_INCOME_2026', prefix: 'INCOME' },
  'src/views/coverscore-personal-young-professional.hbs': { report: 'YOUNG PROFESSIONAL REPORT', defaultCode: 'WEB_YOUNG_PRO_2026', prefix: 'YOUNG_PRO' },
  'src/views/coverscore-personal-entrepreneur.hbs': { report: 'ENTREPRENEUR RISK REPORT', defaultCode: 'WEB_ENTREPRENEUR_2026', prefix: 'ENTREPRENEUR' }
};

for (const [file, config] of Object.entries(files)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/FAMILY REPORT™/g, `${config.report}™`);
  content = content.replace(/FAMILY REPORT"/g, `${config.report}"`);
  content = content.replace(/WEB_FAMILY_2026/g, config.defaultCode);
  content = content.replace(/FAMILY \$\{campaignCode\}/g, `${config.prefix} \${campaignCode}`);
  
  // also replace "Check My Family" button
  const checkPrefix = config.report.split(' ')[0]; // e.g. "RETIREMENT"
  // Let's replace "Check My Family" with a more generic or specific one
  let btnReplacement = "Check My " + config.report.replace(" REPORT", ""); // Check My RETIREMENT READINESS
  // convert to Title Case
  btnReplacement = btnReplacement.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
  content = content.replace(/Check My Family/g, btnReplacement);

  // replace "Know My Family's Risk" with "Know My Risk"
  content = content.replace(/Know My Family's Risk/g, "Know My Risk");

  // replace "Because your family deserves the best protection."
  content = content.replace(/Because your family deserves the best protection./g, "Because you deserve the best protection.");

  // "Take the first step toward a safer family." -> "Take the first step toward a safer future."
  content = content.replace(/Take the first step toward a safer family\./g, "Take the first step toward a safer future.");

  // "Calculate My Family Exposure" -> "Calculate My Exposure"
  content = content.replace(/Calculate My Family Exposure/g, "Calculate My Exposure");

  // "Start My Free Family\nProtection \nScore™" -> "Start My Free\nScore™"
  content = content.replace(/Start My Free Family(?:<br>|\n)(?:Protection |Readiness |Risk )?(?:<br>|\n)?Score/g, "Start My Free<br>Score");

  fs.writeFileSync(file, content);
  console.log('Cleaned up', file);
}
