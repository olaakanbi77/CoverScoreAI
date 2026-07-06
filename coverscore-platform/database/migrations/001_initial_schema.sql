-- Sprint 1 + 2: Core Schema for QPRE (Question Pack Runtime Engine)
-- Graph-based question packs, sections, branch rules
-- 12 tables total

BEGIN;

-- ============================================================
-- 1. customers — unified customer/lead record
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(32) UNIQUE,
    email           VARCHAR(255) UNIQUE,
    name            VARCHAR(255),
    metadata        JSONB DEFAULT '{}',
    risk_level      VARCHAR(32),
    score           INTEGER,
    status          VARCHAR(32) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================
-- 2. conversation_sessions — one session per assessment run
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
    pack_id         VARCHAR(64) NOT NULL,
    state           VARCHAR(32) DEFAULT 'NEW',
    channel         VARCHAR(32) DEFAULT 'whatsapp',
    context         JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    started_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_customer ON conversation_sessions(customer_id);
CREATE INDEX idx_sessions_state ON conversation_sessions(state);
CREATE INDEX idx_sessions_pack ON conversation_sessions(pack_id);

-- ============================================================
-- 3. question_packs — assessment type definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS question_packs (
    id              VARCHAR(64) PRIMARY KEY,
    code            VARCHAR(32) UNIQUE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    version         VARCHAR(16) DEFAULT '1.0',
    status          VARCHAR(32) DEFAULT 'active',
    pillars         JSONB DEFAULT '[]',
    categories      JSONB DEFAULT '{}',
    modifiers       JSONB DEFAULT '[]',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. pack_sections — logical groupings within a pack
-- ============================================================
CREATE TABLE IF NOT EXISTS pack_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id         VARCHAR(64) NOT NULL REFERENCES question_packs(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    sort_order      INTEGER DEFAULT 0,
    entry_question  VARCHAR(64),            -- first question in this section
    entry_rule      JSONB DEFAULT NULL,     -- conditional entry: { ifQuestion, ifAnswer }
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_sections_pack ON pack_sections(pack_id);

-- ============================================================
-- 5. questions — individual questions (graph nodes)
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id              VARCHAR(64) PRIMARY KEY,
    pack_id         VARCHAR(64) NOT NULL REFERENCES question_packs(id),
    section_id      UUID REFERENCES pack_sections(id),
    sequence        INTEGER DEFAULT 0,
    question_type   VARCHAR(32) DEFAULT 'choice',
    text            TEXT NOT NULL,
    help_text       TEXT,
    category        VARCHAR(128),
    pillar          VARCHAR(128),
    metadata        JSONB DEFAULT '{}',
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_pack ON questions(pack_id);
CREATE INDEX idx_questions_section ON questions(section_id);

-- ============================================================
-- 6. question_options — answer choices (graph edges)
-- Each option can point to the next question via next_question_id
-- ============================================================
CREATE TABLE IF NOT EXISTS question_options (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     VARCHAR(64) NOT NULL REFERENCES questions(id),
    text            VARCHAR(512) NOT NULL,
    value           VARCHAR(128) NOT NULL,
    score           INTEGER DEFAULT 0,
    sort_order      INTEGER DEFAULT 0,
    next_question   VARCHAR(64),            -- graph edge: next node if this option selected
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_options_question ON question_options(question_id);

-- ============================================================
-- 7. branch_rules — complex conditional routing (graph edges)
-- Evaluated when a question has no direct next_question on its options
-- ============================================================
CREATE TABLE IF NOT EXISTS branch_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     VARCHAR(64) NOT NULL REFERENCES questions(id),
    operator        VARCHAR(16) NOT NULL DEFAULT '=',
    value           VARCHAR(256) NOT NULL,
    next_question   VARCHAR(64) NOT NULL,
    priority        INTEGER DEFAULT 0,
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_branch_rules_question ON branch_rules(question_id);

-- ============================================================
-- 8. answers — customer answers per session
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    question_id     VARCHAR(64) NOT NULL REFERENCES questions(id),
    option_id       UUID REFERENCES question_options(id),
    value           VARCHAR(128) NOT NULL,
    score           INTEGER DEFAULT 0,
    confidence      INTEGER DEFAULT 100,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_answers_session ON answers(session_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE UNIQUE INDEX idx_answers_unique ON answers(session_id, question_id);

-- ============================================================
-- 9. conversation_states — state machine tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    phase           VARCHAR(32) NOT NULL,
    current_section UUID REFERENCES pack_sections(id),
    current_question VARCHAR(64),
    history         JSONB DEFAULT '[]',
    context         JSONB DEFAULT '{}',
    entered_at      TIMESTAMPTZ DEFAULT now(),
    exited_at       TIMESTAMPTZ
);

CREATE INDEX idx_states_session ON conversation_states(session_id);
CREATE INDEX idx_states_phase ON conversation_states(phase);

-- ============================================================
-- 10. risk_scores — scoring results per session
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    score           INTEGER NOT NULL,
    risk_level      VARCHAR(32) NOT NULL,
    pillars         JSONB DEFAULT '{}',
    categories      JSONB DEFAULT '{}',
    modifiers       JSONB DEFAULT '[]',
    identified_risks JSONB DEFAULT '[]',
    risk_profile    JSONB DEFAULT '{}',
    min_loss        NUMERIC DEFAULT 0,
    max_loss        NUMERIC DEFAULT 0,
    exposure_index  VARCHAR(32),
    protection_gap  INTEGER DEFAULT 0,
    risk_dna        VARCHAR(128),
    confidence      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scores_session ON risk_scores(session_id);

-- ============================================================
-- 11. reports — generated Risk Intelligence Reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id),
    score_id        UUID REFERENCES risk_scores(id),
    format          VARCHAR(16) DEFAULT 'json',
    content         JSONB DEFAULT '{}',
    pdf_url         TEXT,
    html_url        TEXT,
    status          VARCHAR(32) DEFAULT 'draft',
    generated_at    TIMESTAMPTZ DEFAULT now(),
    sent_at         TIMESTAMPTZ
);

CREATE INDEX idx_reports_session ON reports(session_id);

-- ============================================================
-- 12. events — audit/event log
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id),
    event_type      VARCHAR(64) NOT NULL,
    data            JSONB DEFAULT '{}',
    source          VARCHAR(64) DEFAULT 'runtime',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at);

COMMIT;
