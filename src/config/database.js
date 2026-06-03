const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/coverscore.db';
const dbDir = path.dirname(path.resolve(DB_PATH));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected');
  }
});

db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      business_name TEXT,
      industry TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'sales', 'analyst', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      answers JSON NOT NULL,
      score INTEGER NOT NULL,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'moderate', 'high', 'critical')),
      ai_report TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      business_name TEXT,
      assessment_id INTEGER,
      score INTEGER,
      risk_level TEXT,
      entity_type TEXT DEFAULT 'business',
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'converted', 'lost')),
      wa_state TEXT DEFAULT 'initial',
      primary_concern TEXT,
      consultation_preference TEXT,
      engagement_points INTEGER DEFAULT 0,
      is_qualified BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id)
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
    CREATE INDEX IF NOT EXISTS idx_leads_assessment_id ON leads(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
  `);

  // Simple schema migration for existing databases
  const columnsToAdd = [
    "ALTER TABLE leads ADD COLUMN wa_state TEXT DEFAULT 'initial'",
    "ALTER TABLE leads ADD COLUMN primary_concern TEXT",
    "ALTER TABLE leads ADD COLUMN consultation_preference TEXT",
    "ALTER TABLE leads ADD COLUMN engagement_points INTEGER DEFAULT 0",
    "ALTER TABLE leads ADD COLUMN is_qualified BOOLEAN DEFAULT 0"
  ];

  columnsToAdd.forEach(sql => {
    db.run(sql, (err) => {
      // Ignore errors related to duplicate columns
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration error:', err.message);
      }
    });
  });

  db.get('SELECT id FROM users WHERE role = ?', ['admin'], (err, row) => {
    if (!row) {
      const bcrypt = require('bcrypt');
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = bcrypt.hashSync(adminPassword, 12);
      db.run(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES (?, ?, ?, 'admin')
      `, [
        process.env.ADMIN_EMAIL || 'admin@coverscore.ai',
        passwordHash,
        'Administrator'
      ], (err) => {
        if (err) console.error('Failed to create admin user:', err.message);
        else console.log('Admin user created');
      });
    }
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { db, initDatabase, run, get, all };
