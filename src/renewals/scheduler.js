const renewalEngine = require('./engine');

const db = { all: null, get: null, run: null };

async function initDb() {
  const dbModule = require('../config/database');
  db.all = dbModule.all;
  db.get = dbModule.get;
  db.run = dbModule.run;
}

async function runDailyRenewalCheck() {
  if (!db.all) await initDb();
  console.log('[Renewal Scheduler] Running daily check...');
  const actions = await renewalEngine.checkExpiringPolicies(db);
  console.log(`[Renewal Scheduler] ${actions.length} renewal actions taken`);
  return actions;
}

module.exports = { runDailyRenewalCheck };
