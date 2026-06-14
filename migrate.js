const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'data/coverscore.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run("ALTER TABLE leads ADD COLUMN assessment_data TEXT DEFAULT '{}'", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column assessment_data already exists.');
      } else {
        console.error('Migration failed:', err);
      }
    } else {
      console.log('Added assessment_data column to leads table.');
    }
  });
});
