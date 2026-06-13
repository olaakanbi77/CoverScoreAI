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
    console.log('Starting migration 004: Creating documents table...');
    
    await run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_key TEXT NOT NULL,
        mime_type TEXT,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);
    console.log('Created documents table.');

    console.log('Migration 004 completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
}

migrate();
