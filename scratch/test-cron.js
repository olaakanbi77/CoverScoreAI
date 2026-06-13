const { processBirthdaysAndAnniversaries, processRenewalNotices, processMonthlyRiskTips } = require('../src/services/automationEngine');

async function run() {
  console.log('Testing birthdays/anniversaries...');
  await processBirthdaysAndAnniversaries();
  
  console.log('Testing renewal notices...');
  await processRenewalNotices();
  
  console.log('Testing monthly risk tips...');
  await processMonthlyRiskTips();
  
  console.log('Done testing!');
  process.exit(0);
}

run();
