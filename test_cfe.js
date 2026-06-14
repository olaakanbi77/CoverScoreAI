const { getNextStateAndReply } = require('./src/services/whatsappFlow');
const { processAssessment } = require('./src/services/riskEngine');

let currentState = 'welcome_name';
let currentData = {};

const inputs = [
  "Test User", // name
  "test@example.com", // email
  "YES", // PR001
  "2",   // PR002 (Rent)
  "2",   // PR003 (10-50M)
  "NO",  // PR004 (no extinguishers)
  "YES", // PR006 (experienced fire)
  "YES", // PR101 (inventory)
  "3",   // PR102 (20-50M)
  "NO",  // PR103 (no records)
  "1",   // BC001 (less than 1 mo)
  "NO",  // BC002 (no continuity plan)
  "NO",  // BC003 (no backups)
  "2",   // ER001 (6-20 employees)
  "NO",  // ER002 (no group life)
  "4",   // ER003 (never safety training)
  "YES", // LR001 (public visitors)
  "3",   // LR002 (51-100)
  "NO",  // LR003 (no public liability)
  "YES", // LR004 (prof advice)
  "NO",  // KP001 (cannot operate 90 days)
  "NO",  // KP002 (no succession plan)
  "1",   // FR001 (less than 1 month cash)
  "YES", // CR001 (store data)
  "NO",  // CR002 (no mfa)
  "NO",  // CR003 (no approval controls)
  "NO",  // OR001 (no formal process)
  "NO",  // RR001 (no updated tax)
  "NO",  // SR001 (no cctv)
  "NO",  // SR002 (no segregation of duties)
  // --- MANUFACTURING MODULE ---
  "NO",  // MFG001 (no preventative maintenance)
  "NO"   // MFG002 (no machinery breakdown insurance)
];

for (let input of inputs) {
  const result = getNextStateAndReply(currentState, input, currentData, 'manufacturing');
  console.log(`${currentState} -> ${input} -> ${result.nextState}`);
  currentState = result.nextState;
  currentData = result.updatedData;
  
  if (result.isComplete) {
    console.log('\n--- ASSESSMENT COMPLETE ---');
    console.log(JSON.stringify(currentData.riskScores, null, 2));
    const finalReport = processAssessment(currentData);
    console.log(finalReport.ai_report);
    break;
  }
}
