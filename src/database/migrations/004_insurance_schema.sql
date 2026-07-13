CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  carrier TEXT,
  min_premium REAL,
  max_premium REAL,
  commission_rate REAL,
  risk_mappings TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  assessment_id TEXT REFERENCES assessments(id),
  advisor_id TEXT NOT NULL REFERENCES advisors(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','accepted','rejected','expired')),
  selected_products TEXT NOT NULL,
  total_premium_min REAL,
  total_premium_max REAL,
  valid_until TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id),
  assessment_id TEXT REFERENCES assessments(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','viewed','signed','declined')),
  pdf_url TEXT,
  sent_at TEXT,
  viewed_at TEXT,
  signed_at TEXT,
  declined_at TEXT,
  decline_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id),
  proposal_id TEXT REFERENCES proposals(id),
  policy_number TEXT UNIQUE,
  carrier TEXT NOT NULL,
  product_code TEXT REFERENCES products(code),
  sum_insured REAL,
  premium REAL NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled','lapsed')),
  cancellation_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS renewals (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES policies(id),
  new_assessment_id TEXT REFERENCES assessments(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined','expired')),
  new_premium REAL,
  new_start_date TEXT,
  new_end_date TEXT,
  reminder_sent_at TEXT,
  converted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_assessment ON quotes(assessment_id);
CREATE INDEX IF NOT EXISTS idx_quotes_advisor ON quotes(advisor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_proposals_quote ON proposals(quote_id);
CREATE INDEX IF NOT EXISTS idx_policies_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_end_date ON policies(end_date);
CREATE INDEX IF NOT EXISTS idx_renewals_policy ON renewals(policy_id);
