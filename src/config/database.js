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
    connectionString: process.env.DATABASE_URL
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
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
}

// Convert SQLite '?' to Postgres '$1, $2'
const convertSqliteToPg = (sql) => {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
};

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

    CREATE INDEX IF NOT EXISTS idx_sessions_lead_id ON assessment_sessions(lead_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON assessment_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

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

    CREATE INDEX IF NOT EXISTS idx_landing_events_campaign ON landing_page_events (utm_campaign, event_name, created_at);
    CREATE INDEX IF NOT EXISTS idx_landing_events_session ON landing_page_events (session_key, created_at);

    INSERT OR IGNORE INTO templates (id, title, type, content) VALUES
      (1, 'Welcome Follow-up', 'whatsapp', 'Hi {{name}}, I am your CoverScore AI Advisor. I noticed you just completed your risk assessment. Do you have a few minutes to review the recommendations?'),
      (2, 'Proposal Sent', 'email', 'Dear {{name}},\n\nPlease find attached the insurance proposal based on our recent consultation for {{business_name}}.\n\nLet me know if you have any questions.\n\nBest regards,\nCoverScore AI Advisor');

    INSERT OR IGNORE INTO academy_levels (id, name, description, order_index) VALUES 
      (1, 'CoverScore Certified Associate™ (CCA™)', 'Foundation Level', 1),
      (2, 'CoverScore Risk Assessment Specialist™ (CRAS™)', 'Intermediate Level', 2),
      (3, 'CoverScore Commercial Risk Advisor™ (CCRA™)', 'Advanced Level', 3),
      (4, 'CoverScore Specialized Risk Advisor™ (CSRA™)', 'Expert Level', 4),
      (5, 'CoverScore Master Risk Advisor™ (CMRA™)', 'Mastery Level', 5);

    INSERT OR IGNORE INTO academy_modules (id, level_id, title, description, order_index) VALUES 
      (1, 1, 'Introduction to Insurance', 'Basics of insurance', 1),
      (2, 1, 'Principles of Risk Management', 'Core risk management principles', 2),
      (3, 1, 'Understanding Business Risks', 'Identifying key business risks', 3),
      (4, 1, 'Introduction to CoverScore™', 'Overview of the CoverScore platform', 4),
      (5, 1, 'Customer Communication Basics', 'How to communicate with clients', 5);

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
        INSERT INTO leads_new (id, name, email, phone, business_name, contact_person, assessment_id, score, risk_level, entity_type, status, wa_state, primary_concern, consultation_preference, engagement_points, is_qualified, notes, chat_history, assessment_data, ccie_context, birth_date, anniversary_date, created_at, updated_at)
        SELECT id, name, email, phone, business_name, NULL, assessment_id, score, risk_level, entity_type, 
               CASE WHEN status = 'new' THEN 'New Lead' WHEN status = 'contacted' THEN 'WhatsApp Engaged' WHEN status = 'converted' THEN 'Won' WHEN status = 'lost' THEN 'Lost' ELSE 'New Lead' END,
               wa_state, primary_concern, consultation_preference, engagement_points, is_qualified, notes, chat_history, assessment_data, ccie_context, birth_date, anniversary_date, created_at, updated_at 
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

const run = async (sql, params = []) => {
  if (usePostgres) {
    const pgSql = convertSqliteToPg(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return { lastInsertRowid: res.rows[0]?.id || null, changes: res.rowCount };
    } catch (err) {
      throw err;
    }
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
      });
    });
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
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
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
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, pgPool, initDatabase, run, get, all };
