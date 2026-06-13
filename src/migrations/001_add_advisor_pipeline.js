const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/coverscore.db';

const db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
});

const runMigration = () => {
  db.serialize(() => {
    // 1. Add advisor_id to leads
    db.run(`ALTER TABLE leads ADD COLUMN advisor_id INTEGER REFERENCES users(id)`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('Column advisor_id already exists.');
        } else {
          console.error('Error adding advisor_id:', err.message);
        }
      } else {
        console.log('Successfully added advisor_id column to leads.');
      }
    });

    // 2. Change pipeline_stage from INTEGER DEFAULT 1 to TEXT DEFAULT 'New'
    // SQLite doesn't allow ALTER COLUMN directly. We have to create a new table and copy data, 
    // BUT since we just need it to store text, SQLite's dynamic typing allows us to just insert TEXT into an INTEGER column!
    // However, to be clean, let's just use the existing `pipeline_stage` column and store text strings in it.
    // We'll update any existing NULL or '1' values to 'New'.
    db.run(`UPDATE leads SET pipeline_stage = 'New' WHERE pipeline_stage = '1' OR pipeline_stage IS NULL`, (err) => {
      if (err) {
        console.error('Error updating pipeline_stage default values:', err.message);
      } else {
        console.log('Successfully initialized existing pipeline_stage values to "New".');
      }
    });

  });

  setTimeout(() => {
    db.close();
    console.log('Migration complete.');
    process.exit(0);
  }, 1000);
};

runMigration();
