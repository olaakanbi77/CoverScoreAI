const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/coverscore.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
});

const run = (query) => {
  return new Promise((resolve, reject) => {
    db.run(query, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

async function migrate() {
  try {
    console.log('Starting migration 002: Adding relationship dates to leads...');
    
    // Add birth_date column if it doesn't exist
    try {
      await run("ALTER TABLE leads ADD COLUMN birth_date TEXT");
      console.log('Added birth_date column.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('birth_date column already exists.');
      } else {
        throw e;
      }
    }

    // Add anniversary_date column if it doesn't exist
    try {
      await run("ALTER TABLE leads ADD COLUMN anniversary_date TEXT");
      console.log('Added anniversary_date column.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('anniversary_date column already exists.');
      } else {
        throw e;
      }
    }

    console.log('Migration 002 completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
}

migrate();
