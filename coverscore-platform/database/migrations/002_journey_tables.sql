-- Sprint 2: Journey Engine tables
-- Post-assessment journeys: structured follow-up paths triggered by scores/risks

BEGIN;

-- ============================================================
-- 1. journey_definitions — template for a post-assessment journey
-- ============================================================
CREATE TABLE IF NOT EXISTS journey_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    trigger_rules   JSONB DEFAULT '[]',        -- conditions that auto-start this journey
    priority        INTEGER DEFAULT 0,
    pack_id         VARCHAR(64) REFERENCES question_packs(id),
    active          BOOLEAN DEFAULT true,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_journey_defs_pack ON journey_definitions(pack_id);
CREATE INDEX idx_journey_defs_active ON journey_definitions(active);

-- ============================================================
-- 2. journey_steps — individual steps within a journey
-- ============================================================
CREATE TABLE IF NOT EXISTS journey_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id      UUID NOT NULL REFERENCES journey_definitions(id) ON DELETE CASCADE,
    sequence        INTEGER NOT NULL,
    step_type       VARCHAR(32) NOT NULL,       -- message|question|product|advisor|education|check_in|score_improvement
    title           VARCHAR(255),
    content         JSONB DEFAULT '{}',         -- step payload (text, media, product ref, etc.)
    delay_hours     INTEGER DEFAULT 0,          -- wait before this step becomes available
    branch_rules    JSONB DEFAULT '[]',         -- conditional routing to next step
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_journey_steps_journey ON journey_steps(journey_id);
CREATE INDEX idx_journey_steps_seq ON journey_steps(journey_id, sequence);

-- ============================================================
-- 3. customer_journeys — per-customer journey instances
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_journeys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
    journey_id      UUID NOT NULL REFERENCES journey_definitions(id),
    status          VARCHAR(32) DEFAULT 'active', -- active|completed|cancelled|paused
    current_step    INTEGER DEFAULT 0,
    context         JSONB DEFAULT '{}',         -- runtime context for branching
    started_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ
);

CREATE INDEX idx_cust_journeys_customer ON customer_journeys(customer_id);
CREATE INDEX idx_cust_journeys_session ON customer_journeys(session_id);
CREATE INDEX idx_cust_journeys_status ON customer_journeys(status);

-- ============================================================
-- 4. journey_progress — per-step tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS journey_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_journey_id UUID NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
    step_id         UUID NOT NULL REFERENCES journey_steps(id),
    step_sequence   INTEGER NOT NULL,
    status          VARCHAR(32) DEFAULT 'pending', -- pending|available|sent|completed|skipped|failed
    action_taken    JSONB DEFAULT '{}',
    sent_at         TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_journey_progress_cj ON journey_progress(customer_journey_id);
CREATE INDEX idx_journey_progress_status ON journey_progress(status);

COMMIT;
