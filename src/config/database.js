const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const usePostgres = !!process.env.DATABASE_URL;
let db = null;
let pgPool = null;

if (usePostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5000),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 10000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 10000)
  });
  pgPool.on('error', (err) => {
    console.error('PostgreSQL Pool Error:', err.message);
  });
  console.log('PostgreSQL Pool initialized');
} else {
  const DB_PATH = process.env.DB_PATH || './data/coverscore.db';
  const dbDir = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
    if (err) console.error('Database connection error:', err.message);
    else console.log('SQLite Database connected');
  });
  db.configure('busyTimeout', Number(process.env.SQLITE_BUSY_TIMEOUT_MS || 5000));
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
}

// PostgreSQL-only startup migration: drop legacy risk_level CHECK constraint
if (usePostgres) {
  (async () => {
    try {
      const constraints = await pgPool.query(
        `SELECT conname FROM pg_constraint
         JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
         WHERE pg_class.relname = 'assessments'
         AND contype = 'c'`
      );
      for (const row of constraints.rows) {
        await pgPool.query(`ALTER TABLE assessments DROP CONSTRAINT IF EXISTS "${row.conname}"`);
        console.log(`Dropped PostgreSQL constraint: ${row.conname}`);
      }
    } catch (err) {
      if (!err.message.includes('does not exist') && !err.message.includes('relation')) {
        console.error('PG migration error (assessments constraints):', err.message);
      }
    }
  })();
}

// Convert SQLite '?' to Postgres '$1, $2'
const convertSqliteToPg = (sql) => {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
};

const ensureSqliteColumn = (table, column, definition, cb = () => {}) => {
  db.all(`PRAGMA table_info(${table})`, (err, columns) => {
    if (err) return cb(err);
    const hasColumn = columns.some(col => col.name === column);
    if (hasColumn) return cb(null, false);

    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
      cb(alterErr, !alterErr);
    });
  });
};

const initDatabase = () => {
  if (usePostgres) {
    console.log('Skipping SQLite initDatabase; PostgreSQL is configured');
    return;
  }

  // Ensure the critical assessments table is created individually with error logging
  db.run(`CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    answers JSON NOT NULL,
    score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    type TEXT DEFAULT 'BUSINESS' CHECK(type IN ('BUSINESS', 'PERSONAL')),
    ai_report TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('[initDatabase] Failed to create assessments table:', err.message);
    else {
      ensureSqliteColumn('assessments', 'user_id', 'INTEGER REFERENCES users(id)', (alterErr) => {
        if (alterErr) console.error('[initDatabase] Failed to add assessments.user_id:', alterErr.message);
        else console.log('[initDatabase] assessments table ready');
      });
    }
  });

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
      ccie_context TEXT,
      birth_date TEXT,
      anniversary_date TEXT,
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

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      lead_id INTEGER UNIQUE,
      passport_id TEXT UNIQUE NOT NULL,
      full_name TEXT,
      email TEXT,
      phone TEXT,
      profile_image TEXT,
      preferred_assessment_type TEXT,
      total_assessments INTEGER DEFAULT 0,
      last_score INTEGER,
      last_risk_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

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

    CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      lead_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      new_assessment_session_id TEXT,
      new_premium INTEGER,
      new_policy_id INTEGER,
      reminder_sent_at DATETIME,
      reminder_channel TEXT,
      decision_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (policy_id) REFERENCES policies(id),
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
      status TEXT DEFAULT 'active',
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

    CREATE TABLE IF NOT EXISTS academy_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      status TEXT DEFAULT 'enrolled',
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES academy_courses(id),
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS assessment_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      track TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      track TEXT NOT NULL,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      help_text TEXT,
      answer_type TEXT NOT NULL,
      is_required BOOLEAN DEFAULT 1,
      weight INTEGER NOT NULL,
      risk_impact_rules TEXT,
      recommendation_trigger TEXT,
      story_trigger TEXT,
      academy_trigger TEXT,
      version TEXT DEFAULT '1.0',
      status TEXT DEFAULT 'active',
      FOREIGN KEY (template_id) REFERENCES assessment_templates(id)
    );

    CREATE TABLE IF NOT EXISTS risk_stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      track TEXT NOT NULL,
      industry TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      scenario TEXT NOT NULL,
      trigger_cause TEXT,
      impact TEXT,
      lesson TEXT,
      warning_signs TEXT,
      preventive_controls TEXT,
      protection_solutions TEXT,
      assessment_link TEXT,
      advisor_talking_point TEXT,
      funnel_use TEXT,
      academy_use TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'Approved',
      last_reviewed DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS assessment_sessions (
      id TEXT PRIMARY KEY,
      lead_id INTEGER,
      template_code TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      current_step TEXT,
      answers JSON DEFAULT '{}',
      score_payload JSON,
      reminder_stage INTEGER DEFAULT 0,
      stopped_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id TEXT PRIMARY KEY,
      lead_id INTEGER,
      session_id TEXT,
      evolution_message_id TEXT NOT NULL,
      evolution_instance TEXT NOT NULL,
      direction TEXT NOT NULL,
      message_type TEXT,
      text_content TEXT,
      delivery_status TEXT DEFAULT 'received',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (evolution_message_id, evolution_instance),
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (session_id) REFERENCES assessment_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      actor_type TEXT,
      actor_id TEXT,
      metadata JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      session_id TEXT,
      advisor_id INTEGER,
      score INTEGER,
      score_band TEXT,
      risk_dna JSON,
      top_priorities JSON,
      opportunity_priority TEXT,
      contact_preference TEXT,
      stage TEXT DEFAULT 'unassigned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (session_id) REFERENCES assessment_sessions(id),
      FOREIGN KEY (advisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      metadata TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      lead_id INTEGER NOT NULL,
      template_code TEXT NOT NULL,
      payload TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS nurture_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      trigger_event TEXT NOT NULL DEFAULT 'not_now',
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nurture_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      delay_days INTEGER NOT NULL DEFAULT 1,
      channel TEXT NOT NULL DEFAULT 'email',
      subject TEXT,
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES nurture_campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS nurture_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      campaign_id INTEGER NOT NULL,
      message_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      channel TEXT NOT NULL DEFAULT 'email',
      subject TEXT,
      body TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      sent_at DATETIME,
      status TEXT DEFAULT 'pending',
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (campaign_id) REFERENCES nurture_campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_number TEXT UNIQUE NOT NULL,
      lead_id INTEGER NOT NULL,
      policy_id INTEGER,
      claim_type TEXT NOT NULL,
      description TEXT,
      amount_claimed INTEGER DEFAULT 0,
      amount_approved INTEGER,
      status TEXT DEFAULT 'filed',
      documents TEXT DEFAULT '[]',
      filed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      settled_at DATETIME,
      notes TEXT,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    );

    CREATE TABLE IF NOT EXISTS risk_surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      session_id TEXT,
      surveyor_id INTEGER,
      type TEXT NOT NULL DEFAULT 'site_inspection',
      status TEXT DEFAULT 'pending',
      answers JSON DEFAULT '{}',
      report TEXT,
      scheduled_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (surveyor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS risk_survey_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      questions JSON NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS landing_page_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_key TEXT,
      event_name TEXT NOT NULL,
      landing_page TEXT NOT NULL,
      cta_position TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      campaign_code TEXT,
      referral_code TEXT,
      device_type TEXT,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rating_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'BUSINESS',
      input_schema TEXT,
      icon TEXT DEFAULT 'g',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rating_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (product_code) REFERENCES rating_products(code),
      UNIQUE(product_code, name)
    );

    CREATE TABLE IF NOT EXISTS rating_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT NOT NULL,
      class_name TEXT NOT NULL,
      rate REAL NOT NULL,
      min_premium INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'NGN',
      FOREIGN KEY (product_code) REFERENCES rating_products(code),
      FOREIGN KEY (product_code, class_name) REFERENCES rating_classes(product_code, name)
    );

    CREATE TABLE IF NOT EXISTS rating_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      advisor_id INTEGER,
      product_code TEXT NOT NULL,
      class_name TEXT,
      inputs TEXT,
      premium INTEGER,
      breakdown TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    INSERT OR IGNORE INTO rating_products (code, name, description, category, input_schema, icon) VALUES
      ('FIRE', 'Fire & Special Perils', 'Cover for buildings, contents, and stock against fire, lightning, explosion, and other specified perils', 'BUSINESS', '{"buildingValue":{"label":"Building Value","type":"number","required":true},"contentsValue":{"label":"Contents Value","type":"number","required":false},"stockValue":{"label":"Stock Value","type":"number","required":false},"location":{"label":"Location","type":"text","required":false}}', 'o'),
      ('PL', 'Public Liability', 'Cover for legal liability to third parties for bodily injury or property damage', 'BUSINESS', '{"annualTurnover":{"label":"Annual Turnover","type":"number","required":true},"maxVisitors":{"label":"Maximum Visitors/Day","type":"number","required":false},"limitIndemnity":{"label":"Limit of Indemnity","type":"select","options":[5000000,10000000,20000000,50000000,100000000],"default":20000000,"required":true}}', 'b'),
      ('MOTOR', 'Comprehensive Motor', 'Cover for damage to or loss of the insured vehicle and third-party liability', 'BUSINESS', '{"vehicleValue":{"label":"Vehicle Value","type":"number","required":true}}', 'g'),
      ('GPA', 'Group Personal Accident', 'Cover for employees or members against accidental bodily injury or death', 'BUSINESS', '{"employeeCount":{"label":"Employee Count","type":"number","required":true},"salaryRoll":{"label":"Total Annual Salary Roll","type":"number","required":true},"benefitMultiple":{"label":"Benefit Multiple","type":"select","options":[12,24,36,48,60],"default":36,"required":true}}', 'g'),
      ('FG', 'Fidelity Guarantee', 'Cover against financial loss from employee dishonesty or fraud', 'BUSINESS', '{"employeeCount":{"label":"Employee Count","type":"number","required":true},"bondAmount":{"label":"Bond Amount","type":"number","required":true},"handlesCash":{"label":"Handles Cash/Financial Records","type":"select","options":["Yes","No"],"required":true}}', 'o');

    INSERT OR IGNORE INTO rating_classes (product_code, name, description) VALUES
      ('FIRE', 'Office', 'Office buildings and administrative premises'),
      ('FIRE', 'School', 'Educational institutions'),
      ('FIRE', 'Hospital', 'Medical and healthcare facilities'),
      ('FIRE', 'Manufacturing', 'Factories and production facilities'),
      ('FIRE', 'Retail', 'Shops and retail outlets'),
      ('FIRE', 'Warehouse', 'Storage and warehousing facilities'),
      ('FIRE', 'Church', 'Religious buildings'),
      ('PL', 'School', 'Educational institutions'),
      ('PL', 'Hospital', 'Medical and healthcare facilities'),
      ('PL', 'Church', 'Religious organizations'),
      ('PL', 'Manufacturing', 'Manufacturing operations'),
      ('PL', 'Retail', 'Retail businesses'),
      ('PL', 'Office', 'Office-based businesses'),
      ('MOTOR', 'Private', 'Private passenger vehicles'),
      ('MOTOR', 'Commercial', 'Commercial vehicles used for business'),
      ('MOTOR', 'Truck', 'Trucks and heavy goods vehicles'),
      ('MOTOR', 'Motorcycle', 'Motorcycles and tricycles'),
      ('GPA', 'Standard', 'Standard group personal accident'),
      ('GPA', 'Hazardous', 'Hazardous occupation group personal accident'),
      ('FG', 'Standard', 'Standard fidelity guarantee'),
      ('FG', 'High Risk', 'High-risk positions handling large sums');

    INSERT OR IGNORE INTO rating_rates (product_code, class_name, rate, min_premium) VALUES
      ('FIRE', 'Office', 0.0020, 100000),
      ('FIRE', 'School', 0.0025, 150000),
      ('FIRE', 'Hospital', 0.0035, 200000),
      ('FIRE', 'Manufacturing', 0.0060, 250000),
      ('FIRE', 'Retail', 0.0030, 100000),
      ('FIRE', 'Warehouse', 0.0040, 150000),
      ('FIRE', 'Church', 0.0025, 100000),
      ('PL', 'School', 0.0035, 50000),
      ('PL', 'Hospital', 0.0045, 75000),
      ('PL', 'Church', 0.0030, 50000),
      ('PL', 'Manufacturing', 0.0050, 100000),
      ('PL', 'Retail', 0.0035, 50000),
      ('PL', 'Office', 0.0030, 50000),
      ('MOTOR', 'Private', 0.0500, 100000),
      ('MOTOR', 'Commercial', 0.0500, 100000),
      ('MOTOR', 'Truck', 0.0500, 100000),
      ('MOTOR', 'Motorcycle', 0.0500, 100000),
      ('GPA', 'Standard', 0.0150, 25000),
      ('GPA', 'Hazardous', 0.0250, 50000),
      ('FG', 'Standard', 0.0050, 25000),
      ('FG', 'High Risk', 0.0080, 50000);

    -- Update Motor to simplified schema (5% NAICOM flat rate) on existing databases
    UPDATE rating_products SET input_schema = '{"vehicleValue":{"label":"Vehicle Value","type":"number","required":true}}' WHERE code = 'MOTOR' AND input_schema IS NOT NULL;
    UPDATE rating_rates SET rate = 0.05, min_premium = 100000 WHERE product_code = 'MOTOR';

    INSERT OR IGNORE INTO templates (id, title, type, content) VALUES
      (1, 'Welcome Follow-up', 'whatsapp', 'Hi {{name}}, I am your CoverScore AI Advisor. I noticed you just completed your risk assessment. Do you have a few minutes to review the recommendations?'),
      (2, 'Proposal Sent', 'email', 'Dear {{name}},\n\nPlease find attached the insurance proposal based on our recent consultation for {{business_name}}.\n\nLet me know if you have any questions.\n\nBest regards,\nCoverScore AI Advisor');

    INSERT OR IGNORE INTO nurture_campaigns (id, name, trigger_event, description) VALUES
      (1, 'Not Now Follow-Up', 'not_now', 'Drip campaign for leads who declined advisor after assessment'),
      (2, 'Birthday Campaign', 'birthday', 'Automated birthday greetings with protection tips'),
      (3, 'General Nurture', 'general', 'General lead nurturing with educational content');

    INSERT OR IGNORE INTO nurture_messages (id, campaign_id, step_order, delay_days, channel, subject, body) VALUES
      (1, 1, 1, 3, 'email', 'Your CoverScore Risk Report Summary', 'Hi {{name}},\n\nThank you for completing your CoverScore assessment. Your personalized risk report is ready whenever you need it.\n\nHere is a quick summary:\n• Your CoverScore: {{score}}/100\n• Risk Level: {{riskLevel}}\n\nWould you like to schedule a complimentary 15-minute review with a licensed advisor? No obligation.\n\nReply to this email or click here to book: {{bookingLink}}\n\nStay protected,\nThe CoverScore Team'),
      (2, 1, 2, 7, 'email', 'Understanding Your Protection Gaps', 'Hi {{name}},\n\nDid you know that addressing just your top protection gap could improve your CoverScore by {{potentialIncrease}} points?\n\nYour assessment identified {{gapCount}} key areas where you may be under-protected. Our advisors can help you understand these gaps and find practical solutions.\n\nBook a free review: {{bookingLink}}\n\nBest regards,\nCoverScore AI'),
      (3, 1, 3, 14, 'email', 'Top Risks Facing Your Business/Family', 'Hi {{name}},\n\nBased on your assessment, here are the top risks to keep on your radar:\n\n{{topRisks}}\n\nEach of these can be managed with the right protection strategy. Our advisors are just a click away.\n\nSchedule a chat: {{bookingLink}}\n\n— The CoverScore Team'),
      (4, 1, 4, 30, 'email', 'Your CoverScore Has Not Changed — But Your Risk May Have', 'Hi {{name}},\n\nIt has been one month since your assessment. While your CoverScore remains the same, your risk exposure may have changed.\n\nLife changes quickly — a new job, a growing family, or changes in your business. We recommend reassessing every quarter.\n\nRetake your assessment: {{retakeLink}}\n\nOr speak with an advisor: {{bookingLink}}\n\nStay ahead of risk,\nCoverScore AI');

    INSERT OR IGNORE INTO risk_survey_templates (id, name, category, questions) VALUES
      (1, 'Site Safety Inspection', 'general', '["Are fire extinguishers present and serviced within the last 12 months?", "Are emergency exits clearly marked and unobstructed?", "Is there adequate ventilation in work areas?", "Are electrical panels accessible and clearly labeled?", "Are first aid kits available and stocked?", "Are walkways and floors free of trip hazards?"]'),
      (2, 'Property & Equipment', 'general', '["Is the building structure in good condition?", "Are roofs, gutters and drainage in good repair?", "Is the electrical system up to code?", "Is HVAC equipment serviced regularly?", "Are security systems (CCTV, alarms) functional?", "Is there evidence of water damage or leaks?"]'),
      (3, 'Fire & Emergency Preparedness', 'general', '["Are smoke detectors installed and tested monthly?", "Is there a documented fire evacuation plan?", "Are fire drills conducted at least annually?", "Are flammable materials stored safely?", "Is there a sprinkler system installed?", "Are fire extinguishers located within 75ft of all areas?"]'),
      (4, 'General Business Health Check', 'general', '["Are business insurance documents current and accessible?", "Are employee records and contracts properly filed?", "Is there a business continuity plan?", "Are critical business records backed up?", "Is there an incident reporting procedure?"]');

    INSERT OR IGNORE INTO assessment_templates (id, title, track, description) VALUES 
      ('family_protection', 'Family Protection Score™', 'Personal', 'Family protection readiness'),
      ('sme_risk', 'SME Risk Score™', 'Business', 'Overall small-business risk posture'),
      ('school_risk', 'School Risk Score™', 'Business', 'Student safety, property, fleet, and liability readiness'),
      ('church_risk', 'Church Risk Score™', 'Business', 'Premises, crowd, property, and liability readiness'),
      ('hospital_risk', 'Hospital Risk Score™', 'Business', 'Clinical, property, equipment, liability, and compliance readiness'),
      ('manufacturing_risk', 'Manufacturing Risk Score™', 'Business', 'Fire, machinery, people, continuity, and liability readiness');

    INSERT OR IGNORE INTO assessment_questions (id, template_id, track, category, question_text, answer_type, weight, risk_impact_rules, recommendation_trigger, story_trigger, academy_trigger) VALUES 
      ('PER-FAM-001', 'family_protection', 'Personal', 'Family Protection Risk™', 'Do you currently have life assurance that would support your dependents if you were unable to provide income?', 'yes_no_notsure', 10, '{"no": 100, "notsure": 50, "yes": 0}', 'No or Not sure', 'PER-FAM-002', 'Family Protection Planning™'),
      ('PER-FAM-002', 'family_protection', 'Personal', 'Income Protection Risk™', 'How many months could your household survive on savings if your income stopped today?', 'months_survival', 10, '{"less_3": 100, "3_6": 75, "6_12": 50, "12_24": 25, "over_24": 0}', 'less_3', 'PER-FAM-001', 'Income Protection Planning™'),
      ('BUS-SCH-001', 'school_risk', 'Business', 'Fire & Property Risk™', 'Are all school buildings equipped with functional fire extinguishers and smoke detectors?', 'yes_no', 10, '{"no": 100, "yes": 0}', 'no', 'BUS-SCH-001', 'School Risk Advisory™'),
      ('BUS-SCH-014', 'school_risk', 'Business', 'Fleet & Liability Risk™', 'Does the school maintain a documented servicing schedule for all student transport vehicles?', 'yes_no_na', 8, '{"no": 100, "yes": 0, "na": -1}', 'no', 'BUS-SCH-002', 'School Risk Advisory™'),
      ('BUS-MFG-001', 'manufacturing_risk', 'Business', 'Fire & Property Risk™', 'Are combustible materials safely segregated from active machinery?', 'yes_no', 10, '{"no": 100, "yes": 0}', 'no', 'BUS-MFG-002', 'Manufacturing Risk Advisory™'),
      ('BUS-SME-001', 'sme_risk', 'Business', 'Cyber & Data Risk™', 'Do you regularly backup customer and financial data securely offsite or in the cloud?', 'yes_no', 8, '{"no": 100, "yes": 0}', 'no', 'BUS-SME-003', 'Cyber Risk Specialist™');


    INSERT OR IGNORE INTO risk_stories (
      story_id, title, track, industry, category, subcategory, scenario, trigger_cause, impact, lesson, warning_signs, preventive_controls, protection_solutions, assessment_link, advisor_talking_point, funnel_use, academy_use, priority
    ) VALUES 
    ('BUS-SCH-001', 'School Building Fire', 'Business', 'School', 'Fire & Property Risk™', 'Electrical Fire', 'An electrical fault in a school administrative block caused a fire after closing hours. Classrooms, records, computers, furniture, and teaching materials were damaged.', 'Overloaded sockets, aging wiring, and delayed maintenance.', 'Loss of property, disruption of learning, parent concern, and unexpected replacement costs.', 'A school can lose years of records and teaching resources in a single night.', 'Frequent power trips, hot sockets, extension overload, burnt smell, and delayed repairs.', 'Electrical inspection, smoke detectors, extinguishers, staff drills, and safe storage of records.', 'Fire & Special Perils Insurance, Business Interruption Insurance, Electronic Equipment Insurance.', 'Fire safety controls, electrical maintenance, asset protection, emergency planning.', '“If classes could not continue tomorrow because of a fire, how long would recovery take?”', 'School Risk Score™ — Real Risk Story Card', 'School Risk Advisory™', 'Critical'),
    ('BUS-SCH-002', 'School Bus Accident', 'Business', 'School', 'Fleet & Liability Risk™', 'Student Transportation', 'A school bus transporting students was involved in a road accident during the morning school run. Several students required medical attention and parents demanded immediate answers.', 'Driver fatigue, poor vehicle maintenance, and weak journey-management procedures.', 'Medical expenses, reputational pressure, parental anxiety, possible liability claims, and disruption of school operations.', 'A school bus is not only a vehicle; it carries the institution’s duty of care.', 'Delayed servicing, worn tyres, complaints about drivers, no journey log, and inadequate driver screening.', 'Driver vetting, defensive-driving training, vehicle maintenance schedule, route monitoring, and emergency response procedure.', 'Comprehensive Motor Insurance, Motor Third Party Liability, Group Personal Accident, Public Liability Insurance.', 'Fleet safety, driver controls, student safety, emergency response.', '“When a child enters the school bus, the school assumes a serious responsibility.”', 'School Risk Score™ — Real Risk Story Card', 'School Risk Advisory™', 'Critical'),
    ('BUS-SCH-003', 'Playground Injury Claim', 'Business', 'School', 'Liability Risk™', 'Student Injury', 'A student sustained an injury on damaged playground equipment. The parent alleged negligence and requested compensation for medical treatment.', 'Poor maintenance, delayed repairs, and inadequate inspection of recreational equipment.', 'Medical expenses, liability exposure, parent dissatisfaction, and reputational damage.', 'Small maintenance failures can become major liability events.', 'Loose bolts, damaged equipment, rust, complaints from students, and lack of inspection records.', 'Weekly inspections, repair logs, safety signage, supervision, and incident documentation.', 'Public Liability Insurance, Group Personal Accident, Occupiers Liability Insurance.', 'Premises safety, supervision, incident response, liability controls.', '“Parents expect safety wherever their children learn, play, or travel.”', 'School Risk Score™', 'School Risk Advisory™', 'High'),
    ('BUS-CHR-001', 'Auditorium Fire', 'Business', 'Church', 'Fire & Property Risk™', 'Auditorium Fire', 'An electrical surge during a service caused a fire in the church auditorium, damaging sound equipment, chairs, ceilings, and worship materials.', 'Faulty electrical installation, overloaded power points, and absence of surge protection.', 'Costly repairs, disruption of worship activities, loss of equipment, and pressure on church finances.', 'Worship spaces require the same level of safety planning as commercial buildings.', 'Flickering lights, overheating cables, overloaded extension boards, and frequent power surges.', 'Electrical audit, fire extinguishers, smoke alarms, surge protection, and emergency evacuation plan.', 'Fire & Special Perils Insurance, Electronic Equipment Insurance, Business Interruption Insurance.', 'Electrical safety, fire controls, asset protection, emergency preparedness.', '“A fire should not stop the mission of the church.”', 'Church Risk Score™', 'Church Risk Advisory™', 'Critical'),
    ('BUS-CHR-002', 'Slip and Fall Lawsuit', 'Business', 'Church', 'Liability Risk™', 'Premises Injury', 'A visitor slipped on a wet tiled walkway after rainfall and sustained an injury. The family requested that the church cover treatment costs.', 'Poor drainage, wet surfaces, no warning signs, and inadequate maintenance.', 'Medical costs, potential legal claim, negative publicity, and reputational strain.', 'Hospitality creates a duty to maintain safe premises.', 'Water pooling, slippery tiles, poor drainage, and recurring complaints.', 'Drainage improvement, warning signs, non-slip surfaces, cleaning procedures, and incident reporting.', 'Public Liability Insurance, Occupiers Liability Insurance.', 'Premises condition, visitor safety, liability exposure.', '“A place of worship should also be a place of safety.”', 'Church Risk Score™', 'Church Risk Advisory™', 'High'),
    ('BUS-CHR-003', 'Storm Roof Damage', 'Business', 'Church', 'Property Risk™', 'Storm Damage', 'Heavy rainfall and strong winds damaged the roof of a church building, forcing services to be relocated temporarily.', 'Aging roof sheets, weak roof structure, and lack of preventive maintenance.', 'Property damage, service disruption, repair expenses, and loss of equipment exposed to rain.', 'Weather-related losses can interrupt ministry and create unexpected financial pressure.', 'Loose roofing sheets, leaks, rust, and visible structural weakness.', 'Periodic roof inspection, maintenance plan, drainage checks, and secure storage for equipment.', 'Fire & Special Perils Insurance with storm cover, Business Interruption Insurance.', 'Property condition, weather exposure, maintenance planning.', '“Protection planning helps the church recover without diverting ministry funds.”', 'Church Risk Score™', 'Church Risk Advisory™', 'High'),
    ('BUS-SME-001', 'Office Fire', 'Business', 'SME', 'Fire & Property Risk™', 'Office Fire', 'A small business lost computers, furniture, customer files, and stock after a fire started from an overloaded extension socket.', 'Poor electrical practices and lack of basic fire controls.', 'Operations stopped, customer records were lost, and the business faced urgent replacement costs.', 'Small businesses are often least able to absorb sudden losses.', 'Overloaded sockets, exposed wiring, no extinguisher, and poor storage practices.', 'Electrical maintenance, extinguishers, backup of digital records, and safe storage.', 'Fire & Special Perils Insurance, Electronic Equipment Insurance, Business Interruption Insurance.', 'Fire controls, asset value, business continuity, record backup.', '“Could your business reopen next week if your office was damaged tonight?”', 'SME Risk Score™', 'SME Risk Advisory™', 'Critical'),
    ('BUS-SME-002', 'Employee Injury', 'Business', 'SME', 'People Risk™', 'Workplace Accident', 'An employee sustained an injury while moving heavy stock in a warehouse without appropriate safety equipment.', 'Inadequate training, weak supervision, and absence of protective equipment.', 'Medical costs, loss of productivity, possible compensation claim, and staff morale issues.', 'Employee safety is both a human responsibility and a business protection issue.', 'No safety induction, no PPE, unsafe lifting, repeated near misses.', 'Safety training, PPE, lifting procedures, incident reporting, and supervisor checks.', 'Group Personal Accident, Employers Liability, Workmen’s Compensation where applicable.', 'Employee safety, workplace controls, people protection.', '“A single workplace injury can affect both the employee and the business.”', 'SME Risk Score™', 'SME Risk Advisory™', 'High'),
    ('BUS-SME-003', 'Cyber Ransomware', 'Business', 'SME', 'Cyber & Data Risk™', 'Ransomware', 'A business employee clicked a fraudulent email link, leading to encrypted customer records and temporary loss of access to business systems.', 'Weak password practices, poor cyber awareness, and no secure backup.', 'Business downtime, customer distrust, recovery costs, and possible data protection exposure.', 'Cyber risk is no longer limited to large companies.', 'Shared passwords, no backup testing, suspicious emails, and outdated software.', 'Cyber awareness training, multi-factor authentication, secure backups, access controls, and software updates.', 'Cyber Insurance, Business Interruption Protection, Professional Support Services.', 'Data security, backup, cyber controls, incident response.', '“Your customer data may be one of your most valuable business assets.”', 'SME Risk Score™', 'SME Risk Advisory™, Cyber Risk Specialist™', 'Critical'),
    ('BUS-MFG-001', 'Warehouse Flood', 'Business', 'Manufacturing', 'Property & Operational Risk™', 'Flood Damage', 'Heavy rainfall flooded a warehouse, damaging raw materials, finished goods, and electrical equipment stored at ground level.', 'Poor drainage, low-level storage, and inadequate flood preparedness.', 'Stock loss, production delays, replacement costs, and missed customer deliveries.', 'Flood risk affects stock, equipment, cash flow, and customer commitments at the same time.', 'Blocked drainage, water pooling, weather warnings, and stock stored directly on the floor.', 'Drainage maintenance, raised pallets, flood barriers, stock zoning, and emergency procedures.', 'Fire & Special Perils Insurance with flood extension, Stock Insurance, Business Interruption Insurance.', 'Location risk, stock storage, drainage, business continuity.', '“When stock is damaged, revenue is damaged too.”', 'Manufacturing Risk Score™', 'Manufacturing Risk Advisory™', 'Critical'),
    ('BUS-MFG-002', 'Factory Fire', 'Business', 'Manufacturing', 'Fire & Property Risk™', 'Production Area Fire', 'A fire in a production area damaged machinery and halted manufacturing operations for several weeks.', 'Electrical fault, combustible materials near machinery, and inadequate fire suppression.', 'Machinery damage, lost production, delayed orders, staff downtime, and severe revenue loss.', 'A factory fire can become a business survival event.', 'Overheated machinery, exposed wiring, poor housekeeping, blocked exits, and missing extinguishers.', 'Fire detection, extinguisher servicing, machinery maintenance, housekeeping, staff drills, and segregation of combustibles.', 'Industrial Fire Insurance, Machinery Breakdown Insurance, Business Interruption Insurance.', 'Fire systems, machinery maintenance, business continuity, asset concentration.', '“Replacing equipment is one challenge; surviving the lost production period is another.”', 'Manufacturing Risk Score™', 'Manufacturing Risk Advisory™', 'Critical'),
    ('BUS-MFG-003', 'Power Surge Equipment Failure', 'Business', 'Manufacturing', 'Engineering & Equipment Risk™', 'Electrical Surge', 'A power surge damaged a production control panel and halted operations until replacement components could be sourced.', 'Unstable power supply and inadequate surge protection.', 'Production downtime, repair costs, delayed deliveries, and lost revenue.', 'Equipment failure can create a major operational loss even without a fire or flood.', 'Frequent voltage fluctuation, equipment alarms, repeated minor faults, and inadequate backup systems.', 'Surge protection, voltage stabilizers, preventive maintenance, spare-parts planning, and generator maintenance.', 'Machinery Breakdown Insurance, Electronic Equipment Insurance, Business Interruption Insurance.', 'Equipment maintenance, power quality, contingency planning.', '“How much revenue is lost for every day your production line is down?”', 'Manufacturing Risk Score™', 'Manufacturing Risk Advisory™', 'High'),
    ('PER-FAM-001', 'Income Stops After Disability', 'Personal', 'Working parent or primary income earner', 'Income Protection Risk™', 'Temporary Disability', 'A working parent was unable to continue normal work after an accident. The household depended heavily on that income.', 'No income-replacement plan, limited savings, and no personal accident protection.', 'Rent, school fees, household expenses, and loan obligations became difficult to meet.', 'A family’s financial stability can depend heavily on one person’s ability to earn.', 'No emergency fund, high debt, dependents, and single-income household.', 'Emergency fund planning, budget review, debt management, and income diversification where possible.', 'Personal Accident Cover, Life Assurance, Income Protection Planning.', 'Dependents, emergency savings, income sources, debt obligations.', '“If income paused unexpectedly, how long could your household continue normally?”', 'Family Protection Score™, Income Protection Score™', 'Family Protection Planning™, Income Protection Planning™', 'Critical'),
    ('PER-FAM-002', 'Family Left Without Life Protection', 'Personal', 'Parents and income earners', 'Life & Disability Risk™', 'Death of Primary Earner', 'A family lost its primary income earner without a clear financial protection plan. The surviving family members struggled to maintain housing, school fees, and daily expenses.', 'No life assurance, insufficient savings, and no documented family financial plan.', 'Reduced standard of living, education disruption, and reliance on relatives.', 'Love and responsibility should be supported by a practical protection plan.', 'Dependents, outstanding loans, no life cover, and no estate planning.', 'Family financial plan, emergency fund, updated beneficiary records, and basic estate awareness.', 'Life Assurance, Family Protection Plan, Education Planning.', 'Dependents, liabilities, life cover, education obligations.', '“Protection planning is about helping the people who depend on you remain stable.”', 'Family Protection Score™', 'Family Protection Planning™', 'Critical'),
    ('PER-HLT-001', 'Unexpected Medical Emergency', 'Personal', 'Individuals and families', 'Health Protection Risk™', 'Emergency Medical Expense', 'A family faced an unexpected medical emergency and had to fund treatment from savings and borrowed money.', 'No health plan, limited emergency savings, and delayed medical attention.', 'Financial stress, depleted savings, debt, and disruption to family plans.', 'Medical emergencies can become financial emergencies when healthcare costs are not planned for.', 'No HMO, no health budget, dependents, and reliance on out-of-pocket treatment.', 'Health planning, routine medical checks, emergency savings, and provider-network awareness.', 'Health Insurance, HMO Plan, Critical Illness Protection where available.', 'Existing health cover, dependents, emergency savings, health planning.', '“A health plan protects both wellbeing and the money set aside for other family goals.”', 'Health Protection Score™', 'Health Protection Planning™', 'Critical'),
    ('PER-HLT-002', 'Delayed Treatment Due to Cost', 'Personal', 'Individuals and families', 'Health Protection Risk™', 'Treatment Affordability', 'An individual delayed seeking medical treatment because the expected cost was beyond available cash. The condition became more difficult and expensive to manage.', 'No health cover, weak emergency savings, and limited awareness of available healthcare options.', 'Higher treatment cost, lost work time, emotional strain, and avoidable financial pressure.', 'Planning for healthcare improves the ability to act early.', 'Frequent postponement of medical checks, no health cover, and no emergency reserve.', 'Preventive care, health budgeting, and regular health reviews.', 'HMO Plan, Health Insurance, Emergency Medical Support.', 'Healthcare access, existing cover, financial readiness.', '“The cost of waiting can be higher than the cost of planning.”', 'Health Protection Score™', 'Health Protection Planning™', 'High'),
    ('PER-RET-001', 'Retirement Savings Shortfall', 'Personal', 'Working professionals and business owners', 'Retirement Readiness Risk™', 'Insufficient Retirement Savings', 'A retiree discovered that accumulated savings and pension income could not sustain expected living costs after leaving active work.', 'Late planning, irregular savings, inflation, and unrealistic retirement assumptions.', 'Reduced lifestyle, dependence on relatives, and pressure to return to work without preparation.', 'Retirement planning is a long-term protection decision, not a late-career emergency.', 'No retirement target, no regular savings, no investment review, and dependence on one income source.', 'Retirement goals, periodic review, disciplined savings, and diversified planning.', 'Retirement Planning, Annuity Solutions where appropriate, Life Assurance-linked savings plans.', 'Age, retirement timeline, savings pattern, income needs, dependents.', '“Retirement readiness is about ensuring your future income can support your future life.”', 'Retirement Readiness Score™', 'Retirement Readiness Planning™', 'High'),
    ('PER-RET-002', 'Inflation Reduces Retirement Income', 'Personal', 'Retirees and pre-retirees', 'Retirement Readiness Risk™', 'Inflation Exposure', 'A retiree’s fixed income gradually lost purchasing power as living costs increased.', 'No inflation-adjusted plan, limited diversification, and inadequate periodic review.', 'Reduced ability to pay for healthcare, housing, food, and family obligations.', 'Retirement income must be reviewed against changing living costs.', 'Fixed income only, rising monthly expenses, no financial review, and health costs increasing.', 'Annual retirement review, diversified income planning, and expense management.', 'Retirement Planning Advisory, Annuity Review, Health Protection Planning.', 'Income sources, retirement timeline, health expenses, inflation assumptions.', '“A retirement plan should protect purchasing power, not only provide a number on paper.”', 'Retirement Readiness Score™', 'Retirement Readiness Planning™', 'High'),
    ('PER-EDU-001', 'University Fees Disruption', 'Personal', 'Parents and guardians', 'Education Funding Risk™', 'Loss of Education Funding', 'A parent experienced a sudden income disruption during a child’s university programme, making it difficult to meet tuition and living expenses.', 'No education fund, limited savings, and overdependence on monthly income.', 'Delayed fees, academic disruption, family stress, and debt.', 'Education goals need a dedicated protection and funding strategy.', 'No education savings plan, dependents in school, unstable income, and no contingency fund.', 'Education budget, dedicated savings, periodic funding review, and emergency reserve.', 'Education Planning, Life Assurance, Income Protection Planning.', 'Number of dependents, education obligations, savings, income stability.', '“A child’s education should not depend entirely on one month’s income.”', 'Family Protection Score™, Education Planning Assessment™', 'Education Funding Planning™', 'High'),
    ('PER-CYB-001', 'Mobile Banking Fraud', 'Personal', 'Digital banking users', 'Fraud & Cyber Risk™', 'Account Compromise', 'An individual responded to a fraudulent message that appeared to come from a financial institution and later discovered unauthorized transactions.', 'Phishing, weak verification habits, and sharing of sensitive information.', 'Financial loss, stress, disruption of planned expenses, and loss of trust.', 'Personal cyber safety is now part of financial protection.', 'Urgent messages, unfamiliar links, requests for PINs or codes, and unusual account notifications.', 'Verify communication channels, enable alerts, use strong passwords, avoid sharing codes, and report suspicious activity quickly.', 'Cyber Awareness, Fraud Response Plan, Account Security Practices.', 'Digital banking habits, password practices, fraud awareness, emergency savings.', '“Protecting money today includes protecting the digital access to it.”', 'Personal Financial Resilience Score™', 'Personal Risk Intelligence™, Cyber Risk Awareness™', 'High'),
    ('PER-YPR-001', 'High Income, Low Protection', 'Personal', 'Young professionals', 'Personal Financial Resilience Risk™', 'Lifestyle Inflation', 'A young professional earned a stable income but spent most earnings on lifestyle expenses, with little savings, health cover, or long-term protection plan.', 'No financial structure, lifestyle pressure, and delayed protection decisions.', 'Financial vulnerability when unexpected medical, family, or job-related expenses arose.', 'Income is valuable, but protection and discipline make income sustainable.', 'No emergency fund, no insurance, high recurring expenses, and no retirement plan.', 'Budgeting, emergency fund, protection review, and automated savings.', 'Health Insurance, Personal Accident Cover, Life Assurance, Retirement Planning.', 'Savings habits, income stability, dependents, health cover, retirement readiness.', '“A strong salary is not the same thing as financial resilience.”', 'Young Professional Score™', 'Young Professional Advisory™', 'High'),
    ('XRS-CYB-001', 'Data Loss After Weak Backup Practice', 'Cross-Over', 'Individuals, professionals, SMEs, schools, and institutions', 'Cyber & Data Risk™', 'Data Loss', 'Important records were lost after a device failure and there was no tested backup available.', 'No backup, device failure.', 'Loss of important information and records.', 'Important information should not exist in only one place.', 'No backup, reliance on single device.', 'Secure backups, password protection, access control, and periodic recovery testing.', 'Cyber Protection, Electronic Equipment Insurance where applicable, Data Recovery Support.', 'Data backup practices.', '“Information stored in one place is vulnerable.”', 'Personal and Business Cyber Risk content', 'Cyber Risk Awareness™', 'High'),
    ('XRS-FIN-001', 'Emergency Fund Gap', 'Cross-Over', 'Individuals, families, SMEs, and institutions', 'Financial Resilience Risk™', 'Cash-Flow Crisis', 'An unexpected expense created a cash-flow crisis because no reserve had been set aside.', 'No emergency fund, unexpected expense.', 'Cash flow crisis, debt.', 'Protection is stronger when insurance and financial reserves work together.', 'No emergency reserve.', 'Emergency reserve policy, cash-flow review, and contingency planning.', 'Appropriate insurance protection, emergency-fund planning, and financial advisory.', 'Emergency reserve, financial resilience.', '“An emergency fund is your first line of defense.”', 'Personal and SME Risk Score™', 'Financial Resilience Planning™', 'High');

  `, (err) => {
    if (err) console.error('[initDatabase] db.exec batch failed:', err.message);
  });

  // Create all indexes individually so a single failure doesn't abort table creation
  const safeIndex = (sql) => {
    db.run(sql, (err) => {
      if (err) console.warn('[initDatabase] Index skipped:', err.message);
    });
  };

  // Ensure assessments.user_id and leads.advisor_id columns exist before indexing
  ensureSqliteColumn('assessments', 'user_id', 'INTEGER REFERENCES users(id)', (err) => {
    if (err) {
      console.error('[initDatabase] Failed to ensure assessments.user_id:', err.message);
    } else {
        safeIndex("CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id)");
    }
  });
  ensureSqliteColumn('leads', 'advisor_id', 'INTEGER REFERENCES users(id)');
  ensureSqliteColumn('leads', 'lead_score', 'INTEGER DEFAULT 0');
  ensureSqliteColumn('leads', 'lead_priority', 'TEXT DEFAULT \'Cold\'');
  ensureSqliteColumn('leads', 'nurture_campaign_id', 'INTEGER');
  ensureSqliteColumn('leads', 'nurture_stage', 'INTEGER DEFAULT 0');
  ensureSqliteColumn('leads', 'nurture_status', 'TEXT DEFAULT \'idle\'');
  ensureSqliteColumn('leads', 'passport_id', 'TEXT REFERENCES customers(passport_id)');

  safeIndex("CREATE INDEX IF NOT EXISTS idx_leads_assessment_id ON leads(assessment_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_customers_passport_id ON customers(passport_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_customers_lead_id ON customers(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_proposals_token ON proposals(token)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_renewals_policy_id ON renewals(policy_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_renewals_lead_id ON renewals(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_renewals_status ON renewals(status)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_sessions_lead_id ON assessment_sessions(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_sessions_status ON assessment_sessions(status)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_landing_events_campaign ON landing_page_events(utm_campaign, event_name, created_at)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_landing_events_session ON landing_page_events(session_key, created_at)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_nurture_queue_status ON nurture_queue(status, scheduled_at)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_nurture_queue_lead ON nurture_queue(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_claims_lead ON claims(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_risk_surveys_lead ON risk_surveys(lead_id)");
  safeIndex("CREATE INDEX IF NOT EXISTS idx_risk_surveys_status ON risk_surveys(status)");

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

  // Academy Courses & v3 Curriculum Migration — all in one serialize block
  db.serialize(() => {
    db.run(`    CREATE TABLE IF NOT EXISTS academy_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (level_id) REFERENCES academy_levels(id)
    )`);

    // Add columns to academy_modules (safe IF NOT EXISTS via try)
    ['course_id INTEGER', 'lesson_number INTEGER', 'duration_minutes INTEGER DEFAULT 15', 'quiz_data TEXT', 'video_script TEXT', 'workbook_content TEXT', 'case_study TEXT', 'resources TEXT'].forEach(col => {
      db.run(`ALTER TABLE academy_modules ADD COLUMN ${col}`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          // ignore duplicate column errors
        }
      });
    });

    db.run("UPDATE academy_modules SET course_id = 1 WHERE level_id = 1 AND course_id IS NULL AND id >= 50");

    console.log('Seeding CCA courses and v3 curriculum...');

    db.exec(`
      INSERT OR IGNORE INTO academy_levels (id, name, description, order_index) VALUES 
        (1, 'CoverScore Certified Associate™ (CCA™)', 'Level 1: Foundation', 1),
        (2, 'CoverScore Risk Assessment Specialist™ (CRAS™)', 'Level 2: Assessment', 2),
        (3, 'Specialization Tracks™ (CPRA™ / CBRA™)', 'Level 3: Specialization', 3),
        (4, 'CoverScore Risk Consultant™ (CRC™)', 'Level 4: Consulting', 4),
        (5, 'CoverScore Intelligent Solutions Advisor™ (CISA™)', 'Level 5: AI & Data', 5),
        (6, 'CoverScore Master Risk Advisor™ (CMRA™)', 'Level 6: Mastery', 6);

      INSERT OR IGNORE INTO academy_modules (id, level_id, title, description, order_index, track) VALUES 
        (1,1,'Introduction to Risk','Basic risk concepts',1,'CORE'),
        (2,1,'Introduction to Insurance','Basics of insurance',2,'CORE'),
        (3,1,'Risk Management Principles','Core risk management principles',3,'CORE'),
        (4,1,'CoverScore Philosophy™','Understanding our approach',4,'CORE'),
        (5,1,'Professional Ethics','Ethical advisory',5,'CORE'),
        (6,1,'Customer Communication','Effective client interaction',6,'CORE'),
        (7,1,'Digital Advisory Skills','Using digital tools',7,'CORE'),
        (8,2,'Assessment Fundamentals™','How to assess risk',1,'CORE'),
        (9,2,'CoverScore Risk Score™','Understanding the score',2,'CORE'),
        (10,2,'Risk Fingerprint™','Individual risk profiles',3,'CORE'),
        (11,2,'Exposure Index™','Calculating exposure',4,'CORE'),
        (12,2,'Protection Gap™','Identifying gaps',5,'CORE'),
        (13,2,'Risk DNA™','Deep dive into risk elements',6,'CORE'),
        (14,2,'AI Assessment Interpretation™','Using AI for insights',7,'CORE'),
        (15,3,'Family Protection Planning™','Planning for families',1,'PERSONAL'),
        (16,3,'Health Protection Planning™','Health risk advisory',2,'PERSONAL'),
        (17,3,'Income Protection Planning™','Securing income',3,'PERSONAL'),
        (18,3,'Retirement Readiness Planning™','Retirement risks',4,'PERSONAL'),
        (19,3,'Education Funding Planning™','Education risks',5,'PERSONAL'),
        (20,3,'Estate & Legacy Awareness™','Legacy planning',6,'PERSONAL'),
        (21,3,'Personal Risk Reviews™','Conducting reviews',7,'PERSONAL'),
        (22,3,'SME Risk Advisory™','Advising small businesses',8,'BUSINESS'),
        (23,3,'School Risk Advisory™','Advising schools',9,'BUSINESS'),
        (24,3,'Church Risk Advisory™','Advising churches',10,'BUSINESS'),
        (25,3,'Hospital Risk Advisory™','Advising hospitals',11,'BUSINESS'),
        (26,3,'Manufacturing Risk Advisory™','Advising manufacturers',12,'BUSINESS'),
        (27,3,'Construction Risk Advisory™','Advising construction firms',13,'BUSINESS'),
        (28,4,'Consultative Selling™','Advanced selling techniques',1,'CORE'),
        (29,4,'Risk Advisory Framework™','Structured advisory',2,'CORE'),
        (30,4,'Risk Improvement Roadmaps™','Creating roadmaps',3,'CORE'),
        (31,4,'Business Continuity™','Ensuring continuity',4,'CORE'),
        (32,4,'Enterprise Risk Concepts™','ERM basics',5,'CORE'),
        (33,4,'Strategic Protection Planning™','Strategic planning',6,'CORE'),
        (34,4,'Executive Presentation Skills™','Presenting to executives',7,'CORE'),
        (35,5,'AI Risk Intelligence™','Leveraging AI',1,'CORE'),
        (36,5,'Industry Benchmarking™','Benchmarking risks',2,'CORE'),
        (37,5,'Predictive Risk Thinking™','Anticipating risks',3,'CORE'),
        (38,5,'CoverScore Copilot™','Using the copilot',4,'CORE'),
        (39,5,'Risk Analytics™','Data analysis',5,'CORE'),
        (40,5,'Data-Driven Advisory™','Data-driven insights',6,'CORE'),
        (41,6,'Strategic Risk Leadership™','Leading in risk',1,'CORE'),
        (42,6,'Risk Transformation™','Transforming risk management',2,'CORE'),
        (43,6,'Risk Culture Development™','Building culture',3,'CORE'),
        (44,6,'Advanced Advisory™','Master-level advisory',4,'CORE'),
        (45,6,'Thought Leadership™','Becoming a thought leader',5,'CORE'),
        (46,6,'Coaching & Mentorship™','Mentoring others',6,'CORE'),
        (47,6,'Academy Facilitation™','Teaching the academy',7,'CORE');

      INSERT OR IGNORE INTO academy_courses (level_id, code, title, description, order_index) VALUES
(1,'CCA-101','Foundations of Risk & Insurance','Build a solid understanding of risk, insurance principles, and the Nigerian risk landscape.',1),
(1,'CCA-102','The Nigerian Insurance Market & Regulatory Environment','Explore the Nigerian insurance industry structure, key players, and the regulatory framework overseen by NAICOM.',2),
(1,'CCA-103','CoverScore Risk Assessment Methodology','Master the CoverScore assessment framework, risk scoring, and protection gap analysis.',3),
(1,'CCA-104','Advisory & Client Engagement','Develop client discovery skills, risk conversation techniques, and relationship management abilities.',4),
(1,'CCA-105','CoverScore Product Suite & Solutions Design','Learn the full CoverScore product range and how to design tailored protection solutions for clients.',5),
(1,'CCA-106','Ethics, Compliance & Professional Standards','Understand ethical advisory, regulatory compliance, data protection, and the CoverScore Code of Ethics.',6),
(1,'CCA-107','Digital Tools & Technology in Advisory','Leverage digital tools, the CoverScore platform, and virtual engagement to enhance your advisory practice.',7),
(1,'CCA-108','Capstone: Integrated Advisory Simulation & Assessment','Apply all CCA knowledge in an integrated simulation covering real-world client scenarios from assessment to recommendation.',8)`, (err) => {
        if (err) { console.error('Failed to seed academy:', err.message); return; }

        // Check if CCA-101 already has content; skip seeding course 1 if so
        db.get("SELECT COUNT(*) as cnt FROM academy_modules WHERE course_id=1 AND level_id=1 AND content IS NOT NULL AND length(content)>0", [], (e2, row) => {
          const skipCourse1 = row && row.cnt >= 8;
          if (skipCourse1) console.log('CCA-101 already has content, skipping course-1 lesson seed');

        // Seed 60 lessons across 8 courses
        const m1Content = '<div class="lesson-content"><section class="lesson-section"><h2>Learning Objectives</h2><ul><li>Define risk and distinguish it from uncertainty</li><li>Understand why risk awareness is the foundation of protection planning</li><li>Recognise how CoverScore approach transforms risk advisory</li></ul></section><section class="lesson-section"><h2>What Is Risk?</h2><p>Risk is the possibility that an event will occur and cause a negative outcome. In the insurance context, risk is the <strong>uncertainty of financial loss</strong>. Every individual, family, and business faces risk every day.</p><p>What matters is how we <strong>identify, measure, and manage</strong> it.</p><div class="callout-box" style="background:#f5f3ff;border-left:3px solid #7c3aed;padding:12px;border-radius:6px;margin:12px 0;"><p style="margin:0;font-size:12px;color:#1e293b;font-weight:600;"><strong>Key Insight:</strong> Risk is not about fear — it is about readiness. The goal is not to eliminate risk but to understand it well enough to make informed decisions.</p></div></section><section class="lesson-section"><h2>Risk vs Uncertainty</h2><table class="lesson-table"><tr><th>Risk</th><th>Uncertainty</th></tr><tr><td>Probabilities can be estimated based on past data</td><td>Probabilities cannot be estimated</td></tr><tr><td>Insurance companies use risk to set premiums</td><td>Uncertain events are generally not insurable</td></tr><tr><td>Example: The probability of a house fire in a given year</td><td>Example: Whether a new technology will succeed in the market</td></tr></table></section><section class="lesson-section"><h2>Why Risk Awareness Matters</h2><p>Most people do not think about risk until something happens. As a CoverScore advisor, your role is to help clients <strong>recognise their risks before they materialise</strong>.</p><ul><li>Over 70% of Nigerian small businesses have no insurance coverage</li><li>Fewer than 5% of Nigerian adults have any form of life assurance</li><li>Most families are one medical emergency away from financial distress</li></ul></section><section class="lesson-section"><h2>The CoverScore Difference</h2><ol><li><strong>Assess</strong> — Use AI-powered tools to evaluate a client risk profile</li><li><strong>Score</strong> — Generate an objective risk score (0–100)</li><li><strong>Analyze</strong> — Identify protection gaps with the Risk Fingerprint™</li><li><strong>Recommend</strong> — Present tailored solutions that address real needs</li><li><strong>Protect</strong> — Implement the plan and track improvement</li><li><strong>Reflect</strong> — Review outcomes and adjust as circumstances change</li><li><strong>Improve</strong> — Continuously enhance the client risk posture</li></ol></section><section class="lesson-section"><h2>Key Takeaways</h2><ul><li>Risk is the possibility of financial loss — it can be measured and managed</li><li>Risk differs from uncertainty; insurance works where probabilities can be estimated</li><li>Nigeria has massive protection gaps that advisors can help close</li><li>CoverScore replaces reactive selling with proactive, data-driven advisory</li></ul></section></div>';

        const m1Quiz = JSON.stringify([
          {id:1,type:'multiple-choice',question:'What is risk in the context of insurance?',options:['The certainty of financial gain','The possibility of an event causing a negative financial outcome','A guaranteed loss that will occur','An unpredictable event with no measurable probability'],correctIndex:1,explanation:'Risk in insurance is the possibility that an event will occur and cause financial loss.'},
          {id:2,type:'true-false',question:'Risk and uncertainty mean the same thing in insurance.',options:['True','False'],correctIndex:1,explanation:'Risk and uncertainty are different. Risk involves outcomes where probabilities can be estimated.'},
          {id:3,type:'multiple-choice',question:'What is the primary goal of risk management according to CoverScore?',options:['To eliminate all risk','To sell as many insurance policies as possible','To understand risk well enough to make informed protection decisions','To predict exactly when a loss will occur'],correctIndex:2,explanation:'The goal is not to eliminate risk but to understand it well enough to make informed decisions.'},
          {id:4,type:'multiple-choice',question:'What percentage of Nigerian adults have life assurance?',options:['50%','25%','10%','Fewer than 5%'],correctIndex:3,explanation:'Fewer than 5% of Nigerian adults have any form of life assurance.'},
          {id:5,type:'scenario-analysis',question:'A client says nothing bad has happened so they do not need insurance. How should you respond?',options:['Agree and move on','Explain that past experience does not predict future risk','Tell them they are being irresponsible','Offer a discount if they buy today'],correctIndex:1,explanation:'Risk is about future possibilities, not past experiences.'}
        ]);

        const lessons = [
          [1,1,m1Content,m1Quiz,20],[1,2,null,null,15],[1,3,null,null,15],[1,4,null,null,15],[1,5,null,null,15],[1,6,null,null,15],[1,7,null,null,15],[1,8,null,null,20],
          [2,1,null,null,15],[2,2,null,null,15],[2,3,null,null,15],[2,4,null,null,15],[2,5,null,null,15],[2,6,null,null,15],[2,7,null,null,20],
          [3,1,null,null,15],[3,2,null,null,15],[3,3,null,null,15],[3,4,null,null,15],[3,5,null,null,15],[3,6,null,null,15],[3,7,null,null,15],[3,8,null,null,20],
          [4,1,null,null,15],[4,2,null,null,15],[4,3,null,null,15],[4,4,null,null,15],[4,5,null,null,15],[4,6,null,null,15],[4,7,null,null,15],[4,8,null,null,20],
          [5,1,null,null,15],[5,2,null,null,15],[5,3,null,null,15],[5,4,null,null,15],[5,5,null,null,15],[5,6,null,null,15],[5,7,null,null,15],[5,8,null,null,20],
          [6,1,null,null,15],[6,2,null,null,15],[6,3,null,null,15],[6,4,null,null,15],[6,5,null,null,15],[6,6,null,null,15],[6,7,null,null,20],
          [7,1,null,null,15],[7,2,null,null,15],[7,3,null,null,15],[7,4,null,null,15],[7,5,null,null,15],[7,6,null,null,15],[7,7,null,null,20],
          [8,1,null,null,20],[8,2,null,null,25],[8,3,null,null,25],[8,4,null,null,25],[8,5,null,null,30],[8,6,null,null,20],[8,7,null,null,30]
        ];

        const titleDesc = {
          1:{t:'What Is Risk? — The Foundation of Protection',d:'Discover what risk means in insurance, why it matters, and how proactive risk awareness changes outcomes.'},
          2:{t:'Types of Risk — Pure vs Speculative',d:'Learn to distinguish risk types and determine which are insurable.'},
          3:{t:'The Insurance Mechanism — How Risk Pooling Works',d:'Understand the core mechanism of insurance: pooling, premiums, claims, and actuarial fairness.'},
          4:{t:'Core Insurance Principles in Practice',d:'Apply the six core insurance principles to real advisory scenarios.'},
          5:{t:'The Nigerian Risk Landscape',d:'Explore the unique risk profile of Nigerian individuals, families, and businesses.'},
          6:{t:'Why Risk Management Matters',d:'Make the case for proactive risk management to clients at every level.'},
          7:{t:'Introduction to the CoverScore Approach to Risk',d:'Understand how CoverScore transforms traditional insurance advisory.'},
          8:{t:'Module 1 Knowledge Check & Case Study',d:'Apply all Module 1 concepts to a practical client case study.'},
          9:{t:'Overview of the Nigerian Insurance Industry',d:'Survey the structure, size, and key characteristics of Nigeria insurance market.'},
          10:{t:'Key Players: Insurers, Brokers, Agents, and Regulators',d:'Understand the roles and relationships of every participant in the insurance ecosystem.'},
          11:{t:'NAICOM and the Regulatory Framework',d:'Learn NAICOM mandate, licensing requirements, and compliance obligations.'},
          12:{t:'Insurance Products in the Nigerian Market',d:'Survey the major insurance products available and their market penetration.'},
          13:{t:'Distribution Channels and Market Access',d:'Explore how insurance reaches customers: agents, brokers, bancassurance, digital.'},
          14:{t:'Industry Challenges and Opportunities',d:'Understand barriers to growth and the opportunities driving market evolution.'},
          15:{t:'Module 2 Knowledge Check & Case Study',d:'Apply market and regulatory knowledge to a compliance scenario.'},
          16:{t:'The CoverScore Assessment Framework',d:'Understand the structure and methodology behind all CoverScore risk assessments.'},
          17:{t:'Family Protection Score™',d:'Master the personal risk assessment for individuals and families.'},
          18:{t:'SME Risk Score™',d:'Learn to assess small and medium enterprise risk comprehensively.'},
          19:{t:'Sector-Specific Assessments',d:'Navigate specialized assessments for schools, churches, hospitals, and manufacturers.'},
          20:{t:'The CoverScore™ — Interpreting the 0–100 Score',d:'Deep-dive into score calculation, band interpretation, and client communication.'},
          21:{t:'The Risk Fingerprint™ & Protection Gap Analysis™',d:'Generate and interpret multi-dimensional risk profiles.'},
          22:{t:'The Exposure Index™',d:'Calculate and rank client exposures by likelihood and severity.'},
          23:{t:'Module 3 Knowledge Check & Case Study',d:'Analyze a complete assessment and produce a risk report.'},
          24:{t:'The Advisor Role: From Seller to Trusted Partner',d:'Transform your mindset from product-selling to client-centric advisory.'},
          25:{t:'The Client Discovery Process',d:'Conduct structured discovery conversations that uncover real client needs.'},
          26:{t:'Conducting Effective Risk Conversations',d:'Guide clients through risk discussions with confidence and empathy.'},
          27:{t:'Presenting the Risk Fingerprint™ to Clients',d:'Translate data-rich reports into clear, actionable client conversations.'},
          28:{t:'Handling Objections and Building Trust',d:'Overcome common client objections with proven response frameworks.'},
          29:{t:'Proposal Writing and Presentation',d:'Craft compelling protection proposals that drive client action.'},
          30:{t:'Post-Sale Relationship Management',d:'Nurture long-term client relationships and identify expansion opportunities.'},
          31:{t:'Module 4 Knowledge Check & Case Study',d:'Role-play a complete advisory engagement from discovery to proposal.'},
          32:{t:'Introduction to Insurance Products via CoverScore',d:'Survey the full product landscape available through the CoverScore platform.'},
          33:{t:'Life Assurance Products',d:'Master term life, whole life, and endowment products and their client applications.'},
          34:{t:'Health Insurance Products',d:'Navigate HMO, IPP, group health, and critical illness products.'},
          35:{t:'Personal Accident and Income Protection',d:'Recommend personal accident and income replacement solutions.'},
          36:{t:'Property Insurance',d:'Advise on fire, burglary, all-risk, and specialized property covers.'},
          37:{t:'Motor Insurance',d:'Explain third-party, third-party fire and theft, and comprehensive motor policies.'},
          38:{t:'Business Insurance Lines',d:'Structure business interruption, public liability, group PA, and combined policies.'},
          39:{t:'Module 5 Knowledge Check & Case Study',d:'Design a multi-product solution for a complex client scenario.'},
          40:{t:'Introduction to Ethics in Risk Advisory',d:'Understand why ethics are the foundation of trust in advisory relationships.'},
          41:{t:'Core Ethical Principles for Advisors',d:'Master integrity, competence, client interest, confidentiality, fairness, and professionalism.'},
          42:{t:'Conflicts of Interest',d:'Recognize and manage situations where personal interest conflicts with client duty.'},
          43:{t:'Client Data Protection and Confidentiality',d:'Apply data protection principles and maintain client confidentiality.'},
          44:{t:'Regulatory Compliance for Insurance Intermediaries',d:'Understand licensing, continuing education, and reporting obligations.'},
          45:{t:'Professional Conduct and the CoverScore Code of Ethics',d:'Adhere to CoverScore standards of professional conduct.'},
          46:{t:'Module 6 Knowledge Check & Case Study',d:'Navigate an ethical dilemma using structured decision-making.'},
          47:{t:'The Digital Transformation of Insurance Advisory',d:'Understand how technology is reshaping client expectations and advisory delivery.'},
          48:{t:'Using the CoverScore Platform Effectively',d:'Navigate the advisor dashboard, assessments, reports, and client management tools.'},
          49:{t:'Digital Client Engagement',d:'Master email, WhatsApp, video consultations, and digital document sharing.'},
          50:{t:'CRM Best Practices for Client Management',d:'Use the CoverScore CRM to track leads, nurture relationships, and manage pipelines.'},
          51:{t:'Data-Driven Advisory',d:'Leverage reports, analytics, and benchmarking to deliver superior client outcomes.'},
          52:{t:'Digital Security and Best Practices',d:'Protect client data and maintain professional standards in digital channels.'},
          53:{t:'Module 7 Knowledge Check & Case Study',d:'Build a digital client engagement plan using CoverScore platform tools.'},
          54:{t:'Capstone Introduction',d:'Understand the capstone structure, assessment criteria, and certification pathway.'},
          55:{t:'Client Scenario A — Young Professional Family Protection',d:'Assess, analyze, and recommend for a young professional starting a family.'},
          56:{t:'Client Scenario B — SME Owner Risk Assessment',d:'Conduct a full SME risk assessment and produce a protection plan.'},
          57:{t:'Client Scenario C — Comprehensive Business Protection',d:'Design a multi-line protection strategy for an established business.'},
          58:{t:'Integrated Advisory Simulation',d:'Complete an end-to-end advisory simulation covering all CCA competencies.'},
          59:{t:'Capstone Assessment Review and Feedback',d:'Receive detailed feedback on your capstone performance.'},
          60:{t:'CCA Certification Preparation and Final Assessment',d:'Prepare for and complete the CCA certification examination.'}
        };

        let modIdx = 0;
        const courseTitles = [null,'Foundations of Risk & Insurance','Nigerian Insurance Market & Regulatory Environment','CoverScore Risk Assessment Methodology','Advisory & Client Engagement','CoverScore Product Suite & Solutions Design','Ethics, Compliance & Professional Standards','Digital Tools & Technology in Advisory','Capstone: Integrated Advisory Simulation & Assessment'];

        let modId = 50;
        const insertStatements = lessons.map((l, i) => {
          modIdx = i + 1;
          const td = titleDesc[modIdx];
          if (!td) return '';
          if (skipCourse1 && l[0] === 1) return '';
          const escT = td.t.replace(/'/g,"''");
          const escD = td.d.replace(/'/g,"''");
          const content = l[2] ? `'${l[2].replace(/'/g,"''")}'` : 'NULL';
          const quiz = l[3] ? `'${l[3].replace(/'/g,"''")}'` : 'NULL';
          const modIdActual = modId + i;
          return `INSERT OR IGNORE INTO academy_modules (id, level_id, course_id, lesson_number, title, description, order_index, track, content, quiz_data, duration_minutes) VALUES (${modIdActual},1,${l[0]},${l[1]},'${escT}','${escD}',${l[1]},'CORE',${content},${quiz},${l[4]});`;
        }).filter(Boolean).join('\n');

        db.exec(insertStatements, (err) => {
          if (err) console.error('Failed to seed lessons:', err.message);
          else console.log('Seeded 8 CCA courses with 60 lessons');
        });
        });   // close db.get callback
      });     // close outer db.exec callback

    // Academy support tables
    db.run(`CREATE TABLE IF NOT EXISTS academy_quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      passed INTEGER DEFAULT 0,
      answers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (module_id) REFERENCES academy_modules(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS academy_coach_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'coach')),
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (module_id) REFERENCES academy_modules(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS academy_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES academy_courses(id)
    )`);
  }); // end serialize

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
          assessment_data TEXT DEFAULT '{}',
          ccie_context TEXT,
          birth_date TEXT,
          anniversary_date TEXT,
          sales_score INTEGER DEFAULT 0,
          pipeline_stage INTEGER DEFAULT 1,
          estimated_premium INTEGER DEFAULT 0,
          lead_source TEXT DEFAULT 'CoverScore AI',
          industry TEXT,
          employees TEXT,
          recommended_covers TEXT,
          assigned_agent TEXT,
          advisor_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (assessment_id) REFERENCES assessments(id),
          FOREIGN KEY (advisor_id) REFERENCES users(id)
        );
        INSERT INTO leads_new (id, name, email, phone, business_name, contact_person, assessment_id, score, risk_level, entity_type, status, wa_state, primary_concern, consultation_preference, engagement_points, is_qualified, notes, chat_history, assessment_data, ccie_context, birth_date, anniversary_date, advisor_id, created_at, updated_at)
        SELECT id, name, email, phone, business_name, NULL, assessment_id, score, risk_level, entity_type, 
               CASE WHEN status = 'new' THEN 'New Lead' WHEN status = 'contacted' THEN 'WhatsApp Engaged' WHEN status = 'converted' THEN 'Won' WHEN status = 'lost' THEN 'Lost' ELSE 'New Lead' END,
               wa_state, primary_concern, consultation_preference, engagement_points, is_qualified, notes, chat_history, assessment_data, ccie_context, birth_date, anniversary_date, advisor_id, created_at, updated_at 
        FROM leads;
        DROP TABLE leads;
        ALTER TABLE leads_new RENAME TO leads;
        CREATE INDEX IF NOT EXISTS idx_leads_assessment_id ON leads(assessment_id);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
        COMMIT;
        PRAGMA foreign_keys=on;
      `, (err) => {
        if (err) {
          console.error('Migration failed, falling back to ALTER TABLE:', err.message);
          // Fallback: add columns individually
          const fallbackColumns = [
            "ALTER TABLE leads ADD COLUMN assessment_data TEXT DEFAULT '{}'",
            "ALTER TABLE leads ADD COLUMN ccie_context TEXT",
            "ALTER TABLE leads ADD COLUMN birth_date TEXT",
            "ALTER TABLE leads ADD COLUMN anniversary_date TEXT",
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
          fallbackColumns.forEach(sql => {
            db.run(sql, (err) => {
              if (err && !err.message.includes('duplicate column name')) {
                console.error('Migration fallback error:', err.message);
              }
            });
          });
        } else {
          console.log('CRM Migration complete.');
        }
      });
    } else {
      // If table exists but doesn't have the old constraint, just ensure the new columns exist
      const columnsToAdd = [
        "ALTER TABLE leads ADD COLUMN assessment_data TEXT DEFAULT '{}'",
        "ALTER TABLE leads ADD COLUMN ccie_context TEXT",
        "ALTER TABLE leads ADD COLUMN birth_date TEXT",
        "ALTER TABLE leads ADD COLUMN anniversary_date TEXT",
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
  ensureSqliteColumn('academy_modules', 'status', "TEXT DEFAULT 'active'", (err) => {
    if (err) {
      console.error('Migration error (academy_modules status):', err.message);
    }
  });
  ensureSqliteColumn('assessments', 'user_id', 'INTEGER REFERENCES users(id)', (err) => {
    if (err) {
      console.error('Migration error (assessments user_id):', err.message);
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
  db.run("ALTER TABLE leads ADD COLUMN assessment_type TEXT", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (assessment_type):', err.message);
    }
  });
  db.run("ALTER TABLE leads ADD COLUMN lead_score INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (lead_score):', err.message);
    }
  });
  db.run("ALTER TABLE leads ADD COLUMN lead_priority TEXT DEFAULT 'Cold'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (lead_priority):', err.message);
    }
  });
  // Backfill lead_score for existing leads
  db.all("SELECT * FROM leads WHERE lead_score IS NULL OR lead_score = 0", (bErr, rows) => {
    if (bErr) return console.error('Backfill error (lead_score):', bErr.message);
    if (!rows || rows.length === 0) return;
    for (const r of rows) {
      const ls = computeLeadScore(r);
      db.run("UPDATE leads SET lead_score = ?, lead_priority = ? WHERE id = ?", [ls.score, ls.priority, r.id]);
    }
    if (rows.length > 0) console.log(`Backfilled lead_score for ${rows.length} existing leads`);
  });
  db.run("ALTER TABLE templates ADD COLUMN category TEXT DEFAULT 'BUSINESS'", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error (templates category):', err.message);
    }
  });

  // Seed full product catalog from productCatalog.js
  try {
    const { seedCatalog } = require('../rating/seedCatalog');
    seedCatalog().catch(err => console.error('[seedCatalog] Error:', err.message));
  } catch (err) {
    console.error('[seedCatalog] Failed to load seedCatalog:', err.message);
  }

  // Auto-heal: if assessments_v2 exists but assessments doesn't, restore it
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('assessments','assessments_v2')", (err2, tables) => {
    if (!err2 && tables) {
      const names = tables.map(t => t.name);
      if (names.includes('assessments_v2') && !names.includes('assessments')) {
        console.log('[initDatabase] Restoring assessments from assessments_v2...');
        db.run('ALTER TABLE assessments_v2 RENAME TO assessments', (renameErr) => {
          if (renameErr) {
            console.error('[initDatabase] Failed to restore assessments:', renameErr.message);
          } else {
            console.log('[initDatabase] assessments table restored from assessments_v2');
          }
        });
      } else if (names.includes('assessments_v2') && names.includes('assessments')) {
        db.run('DROP TABLE IF EXISTS assessments_v2', (dropErr) => {
          if (!dropErr) console.log('[initDatabase] Cleaned up orphaned assessments_v2 table');
        });
      }
    }
  });

  // Drop legacy CHECK constraint on assessments.risk_level so CSNS 6-tier values can be stored
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='assessments'", (err, rows) => {
    if (!err && rows && rows[0] && /CHECK\s*\(\s*risk_level\s+IN\s*\(/i.test(rows[0].sql)) {
      db.all("PRAGMA table_info(assessments)", (pragmaErr, columns = []) => {
        if (pragmaErr) {
          console.error('Migration error (assessments CHECK):', pragmaErr.message);
          return;
        }

        const hasColumn = (name) => columns.some(col => col.name === name);
        const userIdSelect = hasColumn('user_id') ? 'user_id' : 'NULL';
        const typeSelect = hasColumn('type') ? "COALESCE(type,'BUSINESS')" : "'BUSINESS'";
        const aiReportSelect = hasColumn('ai_report') ? 'ai_report' : 'NULL';
        const createdAtSelect = hasColumn('created_at') ? 'created_at' : 'CURRENT_TIMESTAMP';

        db.run('PRAGMA foreign_keys = OFF', () => {
          db.run('DROP TABLE IF EXISTS assessments_v2', () => {
            db.run(`CREATE TABLE assessments_v2 (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              answers JSON NOT NULL,
              score INTEGER NOT NULL,
              risk_level TEXT NOT NULL,
              type TEXT DEFAULT 'BUSINESS',
              ai_report TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )`, (createErr) => {
              if (createErr) {
                console.error('Migration error (assessments CHECK create):', createErr.message);
                db.run('PRAGMA foreign_keys = ON');
                return;
              }

              db.run(`INSERT INTO assessments_v2 SELECT id, ${userIdSelect}, answers, score, risk_level, ${typeSelect}, ${aiReportSelect}, ${createdAtSelect} FROM assessments`, (insertErr) => {
                if (insertErr) {
                  console.error('Migration error (assessments CHECK copy):', insertErr.message);
                  db.run('DROP TABLE IF EXISTS assessments_v2', () => db.run('PRAGMA foreign_keys = ON'));
                  return;
                }

                db.run('DROP TABLE assessments', (dropErr) => {
                  if (dropErr) {
                    console.error('Migration error (assessments CHECK drop):', dropErr.message);
                    db.run('DROP TABLE IF EXISTS assessments_v2', () => db.run('PRAGMA foreign_keys = ON'));
                    return;
                  }

                  db.run('ALTER TABLE assessments_v2 RENAME TO assessments', (renameErr) => {
                    if (renameErr) {
                      console.error('[initDatabase] Migration RENAME failed:', renameErr.message);
                    } else {
                      console.log('Migrated assessments table: removed risk_level CHECK constraint');
                    }
                    db.run('PRAGMA foreign_keys = ON');
                  });
                });
              });
            });
          });
        });
      });
    }
  });
};

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS || 15000);

const withTimeout = (promise, label) => {
  const timer = setTimeout(() => {
    console.error(`[DB TIMEOUT] ${label} — query exceeded ${DB_TIMEOUT_MS}ms`);
  }, DB_TIMEOUT_MS);
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`DB_TIMEOUT: ${label}`)), DB_TIMEOUT_MS))
  ]).finally(() => clearTimeout(timer));
};

const run = async (sql, params = []) => {
  if (usePostgres) {
    const pgSql = convertSqliteToPg(sql);
    const isInsert = /^\s*INSERT\s/i.test(pgSql);
    const finalSql = isInsert ? pgSql + ' RETURNING id' : pgSql;
    try {
      const res = await pgPool.query(finalSql, params);
      return { lastInsertRowid: res.rows[0]?.id || null, changes: res.rowCount };
    } catch (err) {
      throw err;
    }
  } else {
    return withTimeout(new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
      });
    }), sql.slice(0, 80));
  }
};

const get = async (sql, params = []) => {
  if (usePostgres) {
    const pgSql = convertSqliteToPg(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows[0];
    } catch (err) {
      throw err;
    }
  } else {
    return withTimeout(new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }), sql.slice(0, 80));
  }
};

const all = async (sql, params = []) => {
  if (usePostgres) {
    const pgSql = convertSqliteToPg(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      throw err;
    }
  } else {
    return withTimeout(new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }), sql.slice(0, 80));
  }
};

const computeLeadScore = (lead) => {
  if (!lead) return { score: 0, priority: 'Cold' };
  let s = 0;
  if (lead.email && lead.email !== 'whatsapp@coverscore.site') s += 5;
  if (lead.phone) s += 5;
  if (lead.engagement_points >= 10) s += 10;
  if (lead.score > 0) s += 20;
  if (lead.score > 0 && lead.score < 30) s += 15;
  if (lead.entity_type === 'business') s += 20;
  if (lead.is_qualified) s += 40;
  s = Math.min(Math.max(Math.round(s), 0), 100);
  const p = s >= 80 ? 'Hot' : s >= 50 ? 'Warm' : 'Cold';
  return { score: s, priority: p };
};

module.exports = { db, pgPool, initDatabase, run, get, all, computeLeadScore };
