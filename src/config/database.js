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
      type TEXT DEFAULT 'BUSINESS' CHECK(type IN ('BUSINESS', 'PERSONAL')),
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
      opportunity_type TEXT DEFAULT 'BUSINESS' CHECK(opportunity_type IN ('BUSINESS', 'PERSONAL')),
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
      category TEXT DEFAULT 'BUSINESS' CHECK(category IN ('BUSINESS', 'PERSONAL')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS academy_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS academy_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      video_url TEXT,
      content TEXT,
      track TEXT DEFAULT 'CORE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (level_id) REFERENCES academy_levels(id)
    );

    CREATE TABLE IF NOT EXISTS academy_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (module_id) REFERENCES academy_modules(id),
      UNIQUE(user_id, module_id)
    );

    INSERT OR IGNORE INTO templates (id, title, type, content) VALUES
      (1, 'Welcome Follow-up', 'whatsapp', 'Hi {{name}}, I am your CoverScore AI Advisor. I noticed you just completed your risk assessment. Do you have a few minutes to review the recommendations?'),
      (2, 'Proposal Sent', 'email', 'Dear {{name}},\n\nPlease find attached the insurance proposal based on our recent consultation for {{business_name}}.\n\nLet me know if you have any questions.\n\nBest regards,\nCoverScore AI Advisor');

    INSERT OR IGNORE INTO academy_levels (id, name, description, order_index) VALUES 
      (1, 'CoverScore Certified Associate™ (CCA™)', 'Foundation Level', 1),
      (2, 'CoverScore Risk Assessment Specialist™ (CRAS™)', 'Intermediate Level', 2),
      (3, 'CoverScore Commercial Risk Advisor™ (CCRA™)', 'Advanced Level', 3),
      (4, 'CoverScore Specialized Risk Advisor™ (CSRA™)', 'Expert Level', 4),
      (5, 'CoverScore Master Risk Advisor™ (CMRA™)', 'Mastery Level', 5);

    INSERT OR IGNORE INTO academy_modules (id, level_id, title, description, order_index, video_url, content, track) VALUES 
      (1, 1, 'Introduction to Insurance', 'Basics of insurance', 1, NULL, NULL, 'CORE'),
      (2, 1, 'Principles of Risk Management', 'Core risk management principles', 2, NULL, NULL, 'CORE'),
      (3, 1, 'Understanding Business Risks', 'Identifying key business risks', 3, NULL, NULL, 'CORE'),
      (4, 1, 'Introduction to CoverScore™', 'Overview of the CoverScore platform', 4, NULL, NULL, 'CORE'),
      (5, 1, 'Customer Communication Basics', 'How to communicate with clients', 5, NULL, NULL, 'CORE');

  `);

  // Academy Column Migration
  db.all("PRAGMA table_info(academy_modules)", (err, columns) => {
    if (!err && columns) {
      const hasTrackColumn = columns.some(col => col.name === 'track');
      if (!hasTrackColumn) {
        db.exec(`ALTER TABLE academy_modules ADD COLUMN track TEXT DEFAULT 'CORE'`, (err) => {
          if (!err) console.log('Added track column to academy_modules');
        });
      }
    }
  });

  // Academy Curriculum v2 Migration
  db.get("SELECT name FROM academy_levels WHERE name LIKE '%CCRA%'", (err, row) => {
    if (row) {
      console.log('Migrating Academy Curriculum to v2...');
      db.exec(`
        DELETE FROM academy_progress;
        DELETE FROM academy_modules;
        DELETE FROM academy_levels;

        INSERT INTO academy_levels (id, name, description, order_index) VALUES 
          (1, 'CoverScore Certified Associate™ (CCA™)', 'Level 1: Foundation', 1),
          (2, 'CoverScore Risk Assessment Specialist™ (CRAS™)', 'Level 2: Assessment', 2),
          (3, 'Specialization Tracks™ (CPRA™ / CBRA™)', 'Level 3: Specialization', 3),
          (4, 'CoverScore Risk Consultant™ (CRC™)', 'Level 4: Consulting', 4),
          (5, 'CoverScore Intelligent Solutions Advisor™ (CISA™)', 'Level 5: AI & Data', 5),
          (6, 'CoverScore Master Risk Advisor™ (CMRA™)', 'Level 6: Mastery', 6);

        INSERT INTO academy_modules (level_id, title, description, order_index, track) VALUES 
          (1, 'Introduction to Risk', 'Basic risk concepts', 1, 'CORE'),
          (1, 'Introduction to Insurance', 'Basics of insurance', 2, 'CORE'),
          (1, 'Risk Management Principles', 'Core risk management principles', 3, 'CORE'),
          (1, 'CoverScore Philosophy™', 'Understanding our approach', 4, 'CORE'),
          (1, 'Professional Ethics', 'Ethical advisory', 5, 'CORE'),
          (1, 'Customer Communication', 'Effective client interaction', 6, 'CORE'),
          (1, 'Digital Advisory Skills', 'Using digital tools', 7, 'CORE'),

          (2, 'Assessment Fundamentals™', 'How to assess risk', 1, 'CORE'),
          (2, 'CoverScore Risk Score™', 'Understanding the score', 2, 'CORE'),
          (2, 'Risk Fingerprint™', 'Individual risk profiles', 3, 'CORE'),
          (2, 'Exposure Index™', 'Calculating exposure', 4, 'CORE'),
          (2, 'Protection Gap™', 'Identifying gaps', 5, 'CORE'),
          (2, 'Risk DNA™', 'Deep dive into risk elements', 6, 'CORE'),
          (2, 'AI Assessment Interpretation™', 'Using AI for insights', 7, 'CORE'),

          (3, 'Family Protection Planning™', 'Planning for families', 1, 'PERSONAL'),
          (3, 'Health Protection Planning™', 'Health risk advisory', 2, 'PERSONAL'),
          (3, 'Income Protection Planning™', 'Securing income', 3, 'PERSONAL'),
          (3, 'Retirement Readiness Planning™', 'Retirement risks', 4, 'PERSONAL'),
          (3, 'Education Funding Planning™', 'Education risks', 5, 'PERSONAL'),
          (3, 'Estate & Legacy Awareness™', 'Legacy planning', 6, 'PERSONAL'),
          (3, 'Personal Risk Reviews™', 'Conducting reviews', 7, 'PERSONAL'),

          (3, 'SME Risk Advisory™', 'Advising small businesses', 8, 'BUSINESS'),
          (3, 'School Risk Advisory™', 'Advising schools', 9, 'BUSINESS'),
          (3, 'Church Risk Advisory™', 'Advising churches', 10, 'BUSINESS'),
          (3, 'Hospital Risk Advisory™', 'Advising hospitals', 11, 'BUSINESS'),
          (3, 'Manufacturing Risk Advisory™', 'Advising manufacturers', 12, 'BUSINESS'),
          (3, 'Construction Risk Advisory™', 'Advising construction firms', 13, 'BUSINESS'),

          (4, 'Consultative Selling™', 'Advanced selling techniques', 1, 'CORE'),
          (4, 'Risk Advisory Framework™', 'Structured advisory', 2, 'CORE'),
          (4, 'Risk Improvement Roadmaps™', 'Creating roadmaps', 3, 'CORE'),
          (4, 'Business Continuity™', 'Ensuring continuity', 4, 'CORE'),
          (4, 'Enterprise Risk Concepts™', 'ERM basics', 5, 'CORE'),
          (4, 'Strategic Protection Planning™', 'Strategic planning', 6, 'CORE'),
          (4, 'Executive Presentation Skills™', 'Presenting to executives', 7, 'CORE'),

          (5, 'AI Risk Intelligence™', 'Leveraging AI', 1, 'CORE'),
          (5, 'Industry Benchmarking™', 'Benchmarking risks', 2, 'CORE'),
          (5, 'Predictive Risk Thinking™', 'Anticipating risks', 3, 'CORE'),
          (5, 'CoverScore Copilot™', 'Using the copilot', 4, 'CORE'),
          (5, 'Risk Analytics™', 'Data analysis', 5, 'CORE'),
          (5, 'Data-Driven Advisory™', 'Data-driven insights', 6, 'CORE'),

          (6, 'Strategic Risk Leadership™', 'Leading in risk', 1, 'CORE'),
          (6, 'Risk Transformation™', 'Transforming risk management', 2, 'CORE'),
          (6, 'Risk Culture Development™', 'Building culture', 3, 'CORE'),
          (6, 'Advanced Advisory™', 'Master-level advisory', 4, 'CORE'),
          (6, 'Thought Leadership™', 'Becoming a thought leader', 5, 'CORE'),
          (6, 'Coaching & Mentorship™', 'Mentoring others', 6, 'CORE'),
          (6, 'Academy Facilitation™', 'Teaching the academy', 7, 'CORE');
      `);
    }
  });

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
          opportunity_type TEXT DEFAULT 'BUSINESS' CHECK(opportunity_type IN ('BUSINESS', 'PERSONAL')),
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

  // Simple auto-migration for missing columns in older databases
  db.run("ALTER TABLE leads ADD COLUMN assessment_data TEXT DEFAULT '{}'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (assessment_data):', err.message);
    }
  });
  db.run("ALTER TABLE leads ADD COLUMN chat_history TEXT DEFAULT '[]'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (chat_history):', err.message);
    }
  });
  db.run("ALTER TABLE leads ADD COLUMN wa_state TEXT DEFAULT 'initial'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (wa_state):', err.message);
    }
  });
  db.run("ALTER TABLE assessments ADD COLUMN type TEXT DEFAULT 'BUSINESS'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (assessments type):', err.message);
    }
  });
  db.run("ALTER TABLE leads ADD COLUMN opportunity_type TEXT DEFAULT 'BUSINESS'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (leads opportunity_type):', err.message);
    }
  });
  db.run("ALTER TABLE templates ADD COLUMN category TEXT DEFAULT 'BUSINESS'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (templates category):', err.message);
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
