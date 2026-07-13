CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id TEXT REFERENCES advisors(id),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advisors (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL UNIQUE REFERENCES persons(id),
  license_number TEXT,
  specialization TEXT,
  team_id TEXT REFERENCES teams(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
  bio TEXT,
  conversion_rate REAL NOT NULL DEFAULT 0,
  total_premium_written REAL NOT NULL DEFAULT 0,
  rating REAL CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  advisor_id TEXT NOT NULL REFERENCES advisors(id),
  person_id TEXT NOT NULL REFERENCES persons(id),
  business_id TEXT REFERENCES businesses(id),
  status TEXT NOT NULL DEFAULT 'lead' CHECK(status IN ('lead','contacted','qualified','converted','inactive')),
  opportunity_score INTEGER NOT NULL DEFAULT 0 CHECK(opportunity_score >= 0 AND opportunity_score <= 100),
  source TEXT,
  source_assessment_id TEXT REFERENCES assessments(id),
  assigned_at TEXT,
  last_contacted_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  assigned_to TEXT NOT NULL REFERENCES advisors(id),
  assigned_by TEXT REFERENCES persons(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('high','medium','low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
  due_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('call','email','meeting','note','system','whatsapp')),
  title TEXT NOT NULL,
  description TEXT,
  performed_by TEXT REFERENCES persons(id),
  duration_minutes INTEGER,
  outcome TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES persons(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  channel TEXT NOT NULL CHECK(channel IN ('in_app','email','whatsapp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','read')),
  sent_at TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advisors_person ON advisors(person_id);
CREATE INDEX IF NOT EXISTS idx_advisors_team ON advisors(team_id);
CREATE INDEX IF NOT EXISTS idx_clients_advisor ON clients(advisor_id);
CREATE INDEX IF NOT EXISTS idx_clients_person ON clients(person_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_person ON notifications(person_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
