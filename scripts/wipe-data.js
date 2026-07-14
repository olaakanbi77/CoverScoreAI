const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './data/coverscore.db');
console.log('DB path:', dbPath);

const db = new sqlite3.Database(dbPath);

const tablesToWipe = [
  'conversation_messages',
  'risk_stories',
  'audit_logs',
  'activities',
  'tasks',
  'notifications',
  'reports',
  'opportunities',
  'proposals',
  'renewals',
  'policies',
  'assessment_sessions',
  'landing_page_events',
  'leads',
  'assessments_v2',
  'assessments'
];

let idx = 0;

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');

  function next() {
    if (idx >= tablesToWipe.length) {
      return finish();
    }
    const table = tablesToWipe[idx++];
    db.run(`DELETE FROM "${table}"`, function(err) {
      if (err) {
        if (err.message.includes('no such table')) {
          console.log(`  - ${table}: does not exist`);
        } else {
          console.error(`  ✗ ${table}: ${err.message}`);
        }
      } else {
        console.log(this.changes > 0 ? `  ✓ ${table}: ${this.changes} rows` : `  - ${table}: empty`);
      }
      next();
    });
  }

  next();

  function finish() {
    const seq = tablesToWipe.map(t => "'" + t.replace(/'/g, "''") + "'").join(',');
    db.run(`DELETE FROM sqlite_sequence WHERE name IN (${seq})`, () => {
      db.run('PRAGMA foreign_keys = ON', () => {
        console.log('\nDone. All data tables wiped.');
        db.close();
      });
    });
  }
});
