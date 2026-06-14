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
      contact_person TEXT,
      assessment_id INTEGER,
      score INTEGER,
      risk_level TEXT,
      entity_type TEXT DEFAULT 'business',
      status TEXT DEFAULT 'New Lead',
      wa_state TEXT DEFAULT 'initial',
      primary_concern TEXT,
      consultation_preference TEXT,
      engagement_points INTEGER DEFAULT 0,
      is_qualified BOOLEAN DEFAULT 0,
      notes TEXT,
      chat_history TEXT DEFAULT '[]',
      assessment_data TEXT DEFAULT '{}',
      sales_score INTEGER DEFAULT 0,
      pipeline_stage INTEGER DEFAULT 1,
      estimated_premium INTEGER DEFAULT 0,
      lead_source TEXT DEFAULT 'CoverScore AI',
      industry TEXT,
      employees TEXT,
      recommended_covers TEXT,
      assigned_agent TEXT,
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

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'call',
      status TEXT DEFAULT 'pending',
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      advisor_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (advisor_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
    CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
    CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
    CREATE INDEX IF NOT EXISTS idx_proposals_token ON proposals(token);

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      policy_number TEXT UNIQUE NOT NULL,
      product TEXT NOT NULL,
      premium INTEGER NOT NULL,
      status TEXT DEFAULT 'Active',
      expiry_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO templates (id, title, type, content) VALUES
      (1, 'Welcome Follow-up', 'whatsapp', 'Hi {{name}}, I am your CoverScore AI Advisor. I noticed you just completed your risk assessment. Do you have a few minutes to review the recommendations?'),
      (2, 'Proposal Sent', 'email', 'Dear {{name}},\n\nPlease find attached the insurance proposal based on our recent consultation for {{business_name}}.\n\nLet me know if you have any questions.\n\nBest regards,\nCoverScore AI Advisor');

  `);

  // CRM Schema Migration (Option B)
  // Drop the old leads table constraint by recreating the table if the old constraint exists,
  // or simply adding the new columns if the table already exists.
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'", (err, row) => {
    if (row && row.sql.includes('CHECK(status IN')) {
      console.log('Migrating leads table to new CRM schema (removing CHECK constraint)...');
      db.exec(`
        PRAGMA foreign_keys=off;
        BEGIN TRANSACTION;
        CREATE TABLE leads_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          business_name TEXT,
          contact_person TEXT,
          assessment_id INTEGER,
          score INTEGER,
          risk_level TEXT,
          entity_type TEXT DEFAULT 'business',
          status TEXT DEFAULT 'New Lead',
          wa_state TEXT DEFAULT 'initial',
          primary_concern TEXT,
          consultation_preference TEXT,
          engagement_points INTEGER DEFAULT 0,
          is_qualified BOOLEAN DEFAULT 0,
          notes TEXT,
          chat_history TEXT DEFAULT '[]',
          sales_score INTEGER DEFAULT 0,
          pipeline_stage INTEGER DEFAULT 1,
          estimated_premium INTEGER DEFAULT 0,
          lead_source TEXT DEFAULT 'CoverScore AI',
          industry TEXT,
          employees TEXT,
          recommended_covers TEXT,
          assigned_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (assessment_id) REFERENCES assessments(id)
        );
        INSERT INTO leads_new (id, name, email, phone, business_name, contact_person, assessment_id, score, risk_level, entity_type, status, wa_state, primary_concern, consultation_preference, engagement_points, is_qualified, notes, chat_history, created_at, updated_at)
        SELECT id, name, email, phone, business_name, NULL, assessment_id, score, risk_level, entity_type, 
               CASE WHEN status = 'new' THEN 'New Lead' WHEN status = 'contacted' THEN 'WhatsApp Engaged' WHEN status = 'converted' THEN 'Won' WHEN status = 'lost' THEN 'Lost' ELSE 'New Lead' END,
               wa_state, primary_concern, consultation_preference, engagement_points, is_qualified, notes, chat_history, created_at, updated_at 
        FROM leads;
        DROP TABLE leads;
        ALTER TABLE leads_new RENAME TO leads;
        CREATE INDEX IF NOT EXISTS idx_leads_assessment_id ON leads(assessment_id);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
        COMMIT;
        PRAGMA foreign_keys=on;
      `, (err) => {
        if (err) console.error('Migration failed:', err);
        else console.log('CRM Migration complete.');
      });
    } else {
      // If table exists but doesn't have the old constraint, just ensure the new columns exist
      const columnsToAdd = [
        "ALTER TABLE leads ADD COLUMN sales_score INTEGER DEFAULT 0",
        "ALTER TABLE leads ADD COLUMN pipeline_stage INTEGER DEFAULT 1",
        "ALTER TABLE leads ADD COLUMN estimated_premium INTEGER DEFAULT 0",
        "ALTER TABLE leads ADD COLUMN lead_source TEXT DEFAULT 'CoverScore AI'",
        "ALTER TABLE leads ADD COLUMN industry TEXT",
        "ALTER TABLE leads ADD COLUMN employees TEXT",
        "ALTER TABLE leads ADD COLUMN recommended_covers TEXT",
        "ALTER TABLE leads ADD COLUMN assigned_agent TEXT",
        "ALTER TABLE leads ADD COLUMN contact_person TEXT"
      ];
      columnsToAdd.forEach(sql => {
        db.run(sql, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Migration error:', err.message);
          }
        });
      });
    }
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
