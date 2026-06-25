-- PostgreSQL Schema for CoverScore Node-RED Architecture

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) UNIQUE,
  business_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'New Lead',
  wa_state VARCHAR(50) DEFAULT 'initial',
  opportunity_type VARCHAR(50) DEFAULT 'PERSONAL',
  consultation_preference VARCHAR(50),
  engagement_points INTEGER DEFAULT 0,
  is_qualified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER REFERENCES leads(id),
  template_code VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- new, in_progress, paused, completed, abandoned, stopped, error
  current_step VARCHAR(100),
  answers JSONB DEFAULT '{}',
  score_payload JSONB,
  reminder_stage INTEGER DEFAULT 0,
  stopped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER REFERENCES leads(id),
  session_id UUID REFERENCES assessment_sessions(id),
  evolution_message_id VARCHAR(255) NOT NULL,
  evolution_instance VARCHAR(100) NOT NULL,
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  message_type VARCHAR(50),
  text_content TEXT,
  delivery_status VARCHAR(50) DEFAULT 'received',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (evolution_message_id, evolution_instance)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  actor_type VARCHAR(50),
  actor_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INTEGER REFERENCES leads(id),
  session_id UUID REFERENCES assessment_sessions(id),
  template_code VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  secure_url TEXT,
  status VARCHAR(50) DEFAULT 'generated',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  session_id UUID REFERENCES assessment_sessions(id),
  advisor_id INTEGER, -- references users(id) in the future
  score INTEGER,
  score_band VARCHAR(50),
  risk_dna JSONB,
  top_priorities JSONB,
  opportunity_priority VARCHAR(50),
  contact_preference VARCHAR(50),
  stage VARCHAR(50) DEFAULT 'unassigned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_sessions_lead_id ON assessment_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_reports_token ON reports(token);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

CREATE TABLE IF NOT EXISTS landing_page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  session_key varchar(120),
  event_name varchar(100) NOT NULL,
  landing_page varchar(100) NOT NULL,
  cta_position varchar(80),
  utm_source varchar(120),
  utm_medium varchar(120),
  utm_campaign varchar(160),
  utm_content varchar(160),
  utm_term varchar(160),
  campaign_code varchar(120),
  referral_code varchar(120),
  device_type varchar(50),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_page_events_campaign ON landing_page_events (utm_campaign, event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_landing_page_events_session ON landing_page_events (session_key, created_at);
