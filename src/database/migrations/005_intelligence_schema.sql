CREATE TABLE IF NOT EXISTS ai_prompts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4',
  temperature REAL NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 500,
  variables TEXT,
  version TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_outputs (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES ai_prompts(id),
  assessment_id TEXT REFERENCES assessments(id),
  input_variables TEXT,
  output_text TEXT NOT NULL,
  tokens_used INTEGER,
  latency_ms INTEGER,
  model_version TEXT,
  was_cached INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  product_code TEXT REFERENCES products(code),
  category TEXT NOT NULL CHECK(category IN ('risk','product','objection','faq','claim','success_story')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  source TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  lead_id TEXT REFERENCES clients(id),
  advisor_id TEXT REFERENCES advisors(id),
  products_quoted TEXT,
  products_purchased TEXT,
  advisor_contacted INTEGER NOT NULL DEFAULT 0,
  meeting_held INTEGER NOT NULL DEFAULT 0,
  conversion INTEGER NOT NULL DEFAULT 0,
  premium_written REAL NOT NULL DEFAULT 0,
  follow_ups_sent INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  properties TEXT,
  person_id TEXT REFERENCES persons(id),
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_prompt ON ai_outputs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_assessment ON ai_outputs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_product ON knowledge_base(product_code);
CREATE INDEX IF NOT EXISTS idx_outcomes_assessment ON outcomes(assessment_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_advisor ON outcomes(advisor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_person ON analytics_events(person_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
