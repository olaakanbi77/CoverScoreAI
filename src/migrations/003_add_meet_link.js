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
    console.log('Starting migration 003: Adding meet_link to users...');
    
    // Add meet_link column if it doesn't exist
    try {
      await run("ALTER TABLE users ADD COLUMN meet_link TEXT");
      console.log('Added meet_link column to users table.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('meet_link column already exists.');
      } else {
        throw e;
      }
    }

    console.log('Migration 003 completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
}

migrate();
