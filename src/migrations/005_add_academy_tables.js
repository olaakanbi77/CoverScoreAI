const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite'); // This points to src/database.sqlite because __dirname is src/migrations
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Running migration 005: Add Academy Tables...');

  // Create academy_levels table
  db.run(`
    CREATE TABLE IF NOT EXISTS academy_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      acronym TEXT,
      target_audience TEXT,
      outcome TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create academy_modules table
  db.run(`
    CREATE TABLE IF NOT EXISTS academy_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (level_id) REFERENCES academy_levels(id)
    )
  `);

  // Create academy_progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS academy_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      status TEXT DEFAULT 'in_progress',
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (module_id) REFERENCES academy_modules(id),
      UNIQUE(user_id, module_id)
    )
  `);

  const levels = [
    { level: 1, title: 'CoverScore Certified Associate™', acronym: 'CCA™', target: 'Students, NYSC Members, New Advisors, Entry-level Professionals', outcome: 'CoverScore Certified Associate™' },
    { level: 2, title: 'CoverScore Risk Assessment Specialist™', acronym: 'CRAS™', target: 'Insurance Advisors, Brokers, Agents', outcome: 'Risk Assessment Specialist™' },
    { level: 3, title: 'CoverScore Insurance Risk Consultant™', acronym: 'CIRC™', target: 'Experienced Advisors, Insurance Professionals', outcome: 'Insurance Risk Consultant™' },
    { level: 4, title: 'CoverScore Intelligent Solutions Advisor™', acronym: 'CISA™', target: 'Senior Advisors, Team Leads, Consultants', outcome: 'Intelligent Solutions Advisor™' },
    { level: 5, title: 'CoverScore Master Risk Advisor™', acronym: 'CMRA™', target: 'Experts, Consultants, Trainers, Future Instructors', outcome: 'CoverScore Master Risk Advisor™' }
  ];

  const modulesByLevel = {
    1: ['Introduction to Insurance', 'Principles of Risk Management', 'Understanding Business Risks', 'Introduction to CoverScore™', 'Customer Communication Basics'],
    2: ['Risk Identification', 'Risk Assessment Techniques', 'Risk Scoring Fundamentals', 'Risk Fingerprint™', 'Exposure Index™', 'Protection Gap Analysis™', 'Industry Assessments'],
    3: ['Risk Advisory Process', 'Consultative Selling', 'Insurance Product Mapping', 'Liability Risks', 'Fire Risks', 'Engineering Risks', 'Business Interruption', 'Cyber Risks', 'Proposal Development'],
    4: ['Enterprise Risk Management', 'AI-Powered Risk Analysis', 'Risk Intelligence Framework™', 'Industry Benchmarking', 'Business Continuity Planning', 'Risk Improvement Roadmaps', 'AI Copilot Utilization'],
    5: ['Advanced Risk Intelligence™', 'Strategic Risk Advisory™', 'Risk Transformation™', 'Risk Maturity Framework™', 'Executive Risk Communication™', 'Complex Risk Structuring™', 'Academy Mentorship™']
  };

  db.get('SELECT COUNT(*) as count FROM academy_levels', async (err, row) => {
    if (!err && row.count === 0) {
      console.log('Seeding Academy Curriculum...');
      
      const insertLevel = (l) => {
        return new Promise((resolve) => {
          db.run('INSERT INTO academy_levels (level_number, title, acronym, target_audience, outcome) VALUES (?, ?, ?, ?, ?)', 
          [l.level, l.title, l.acronym, l.target, l.outcome], function(err) {
            resolve(this.lastID);
          });
        });
      };

      const insertModule = (levelId, mTitle, idx) => {
        return new Promise((resolve) => {
          db.run('INSERT INTO academy_modules (level_id, title, order_index) VALUES (?, ?, ?)', 
          [levelId, mTitle, idx], function() {
            resolve();
          });
        });
      };

      for (const l of levels) {
        const levelId = await insertLevel(l);
        const mods = modulesByLevel[l.level];
        for (let idx = 0; idx < mods.length; idx++) {
          await insertModule(levelId, mods[idx], idx + 1);
        }
      }
      console.log('Academy seeded successfully!');
    }
  });

});
