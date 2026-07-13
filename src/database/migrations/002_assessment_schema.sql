CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES persons(id),
  business_id TEXT REFERENCES businesses(id),
  advisor_id TEXT REFERENCES advisors(id),
  prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','expired')),
  score INTEGER CHECK(score >= 0 AND score <= 100),
  risk_level TEXT CHECK(risk_level IN ('low','moderate','high','critical')),
  resilience_level TEXT,
  answers_json TEXT,
  scored_pillars TEXT,
  rie_data TEXT,
  report_url TEXT,
  advisor_requested INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_answers (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  question_id TEXT NOT NULL,
  question_text TEXT,
  answer_value TEXT NOT NULL,
  pillar TEXT,
  category TEXT,
  score_contribution INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_pillars (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  name TEXT NOT NULL,
  score INTEGER CHECK(score >= 0 AND score <= 100),
  weight REAL,
  rank INTEGER,
  why_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_person ON assessments(person_id);
CREATE INDEX IF NOT EXISTS idx_assessments_advisor ON assessments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_score ON assessments(score);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment ON assessment_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risk_pillars_assessment ON risk_pillars(assessment_id);
