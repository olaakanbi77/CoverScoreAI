# CoverScore Data Model — Single Source of Truth

## Overview

This document defines every entity, relationship, field, constraint, and index across all four CoverScore products (Assess, Advisor, Quote, Intelligence). It serves as the authoritative blueprint for database, API, Node-RED, AI prompts, dashboards, and mobile/web apps.

## Entity Relationship Diagram (Text)

```
Person 1──* Business
Person 1──* Assessment
Person 1──* Client
Person 1──* Advisor (if role = advisor)

Advisor 1──* Team
Advisor 1──* Client
Advisor 1──* Task
Advisor 1──* Quote

Business 1──* Assessment
Business 1──* Client

Assessment 1──* AssessmentAnswer
Assessment 1──* RiskPillar
Assessment 1──* RiskScore
Assessment 1──* AIOutput
Assessment 1──* Quote

Quote 1──* Proposal
Proposal 1──* Policy
Policy 1──* Renewal

Product *──* Quote
Product 1──* KnowledgeBase
```

## Product 1: CoverScore Assess™ — Core Entities

### Person

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| phone | VARCHAR(20) | | |
| role | ENUM('client','advisor','admin','manager') | NOT NULL, DEFAULT 'client' | |
| avatar_url | TEXT | | |
| birth_date | DATE | | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

Indexes: idx_person_email, idx_person_role

### Business

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| registration_number | VARCHAR(100) | | RC number, CAC, etc |
| industry | VARCHAR(100) | | mapped to prefix |
| business_size | ENUM('1-10','11-50','51-200','200+') | | employee count range |
| annual_revenue | VARCHAR(50) | | e.g. 'Under ₦50M' |
| website | VARCHAR(255) | | |
| person_id | UUID | FK -> Person, nullable | owner/sole proprietor |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

Indexes: idx_business_person, idx_business_industry

### Address

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| entity_type | ENUM('person','business') | NOT NULL | |
| entity_id | UUID | NOT NULL | FK to Person or Business |
| line1 | VARCHAR(255) | NOT NULL | |
| line2 | VARCHAR(255) | | |
| city | VARCHAR(100) | NOT NULL | |
| state | VARCHAR(100) | NOT NULL | |
| postal_code | VARCHAR(20) | | |
| country | VARCHAR(100) | DEFAULT 'Nigeria' | |
| type | ENUM('physical','postal','registered') | NOT NULL | |
| is_primary | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |

Index: idx_address_entity

### Assessment

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| person_id | UUID | FK -> Person, NOT NULL | who took it |
| business_id | UUID | FK -> Business, nullable | |
| advisor_id | UUID | FK -> Advisor, nullable | assigned advisor |
| prefix | VARCHAR(10) | NOT NULL | SME, MFG, HOS, CHR, etc |
| status | ENUM('in_progress','completed','expired') | DEFAULT 'in_progress' | |
| score | INTEGER | CHECK(0-100) | CoverScore |
| risk_level | ENUM('low','moderate','high','critical') | | |
| resilience_level | VARCHAR(50) | | 'Secure', 'Needs Attention', etc |
| answers_json | JSONB | | full raw answers |
| scored_pillars | JSONB | | {PillarName: score} |
| rie_data | JSONB | | full RIE engine output |
| report_url | TEXT | | link to PDF/web report |
| advisor_requested | BOOLEAN | DEFAULT false | |
| started_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

Indexes: idx_assessment_person, idx_assessment_advisor, idx_assessment_status, idx_assessment_score

### AssessmentAnswer

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| assessment_id | UUID | FK -> Assessment, NOT NULL | |
| question_id | VARCHAR(50) | NOT NULL | e.g. SME_016 |
| question_text | TEXT | | the actual question |
| answer_value | TEXT | NOT NULL | the user's answer |
| pillar | VARCHAR(100) | | which pillar it maps to |
| category | VARCHAR(100) | | scoring category |
| score_contribution | INTEGER | | points contributed |
| created_at | TIMESTAMPTZ | | |

Index: idx_answer_assessment

### RiskPillar

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| assessment_id | UUID | FK -> Assessment, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | e.g. 'Asset Protection' |
| score | INTEGER | CHECK(0-100) | |
| weight | DECIMAL(5,2) | | contribution weight |
| rank | INTEGER | | 1 = weakest |
| why_text | TEXT | | the 'Why?' explanation |
| created_at | TIMESTAMPTZ | | |

Index: idx_pillar_assessment

## Product 2: CoverScore Advisor™ — CRM Entities

### Team

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| manager_id | UUID | FK -> Advisor, nullable | team lead |
| description | TEXT | | |
| created_at | TIMESTAMPTZ | | |

### Advisor

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| person_id | UUID | FK -> Person, UNIQUE, NOT NULL | |
| license_number | VARCHAR(100) | | NAICOM, etc |
| specialization | VARCHAR(255) | | e.g. 'Manufacturing, Healthcare' |
| team_id | UUID | FK -> Team, nullable | |
| status | ENUM('active','inactive','suspended') | DEFAULT 'active' | |
| bio | TEXT | | |
| conversion_rate | DECIMAL(5,2) | DEFAULT 0 | calculated |
| total_premium_written | DECIMAL(15,2) | DEFAULT 0 | |
| rating | DECIMAL(3,2) | | client rating 1-5 |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

### Client

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| advisor_id | UUID | FK -> Advisor, NOT NULL | |
| person_id | UUID | FK -> Person, NOT NULL | |
| business_id | UUID | FK -> Business, nullable | |
| status | ENUM('lead','contacted','qualified','converted','inactive') | DEFAULT 'lead' | |
| opportunity_score | INTEGER | CHECK(0-100), DEFAULT 0 | from RIE |
| source | VARCHAR(100) | | 'assessment', 'referral', 'manual' |
| source_assessment_id | UUID | FK -> Assessment, nullable | |
| assigned_at | TIMESTAMPTZ | | |
| last_contacted_at | TIMESTAMPTZ | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

Indexes: idx_client_advisor, idx_client_person, idx_client_status

### Task

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| entity_type | VARCHAR(50) | NOT NULL | 'assessment','client','quote','policy' |
| entity_id | UUID | NOT NULL | |
| assigned_to | UUID | FK -> Advisor, NOT NULL | |
| assigned_by | UUID | FK -> Person, nullable | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | | |
| priority | ENUM('high','medium','low') | NOT NULL | |
| status | ENUM('pending','in_progress','completed','cancelled') | DEFAULT 'pending' | |
| due_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

Index: idx_task_assignee, idx_task_status

### Activity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| entity_type | VARCHAR(50) | NOT NULL | |
| entity_id | UUID | NOT NULL | |
| activity_type | ENUM('call','email','meeting','note','system','whatsapp') | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | | |
| performed_by | UUID | FK -> Person | |
| duration_minutes | INTEGER | | |
| outcome | VARCHAR(255) | | |
| created_at | TIMESTAMPTZ | | |

Index: idx_activity_entity

### Notification

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| person_id | UUID | FK -> Person, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | assessment_complete, advisor_assigned, quote_ready, renewal_due, task_due |
| title | VARCHAR(255) | NOT NULL | |
| body | TEXT | | |
| channel | ENUM('in_app','email','whatsapp') | NOT NULL | |
| status | ENUM('pending','sent','read') | DEFAULT 'pending' | |
| sent_at | TIMESTAMPTZ | | |
| read_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | | |

Index: idx_notification_person, idx_notification_status

## Product 3: CoverScore Quote™ — Insurance Entities

### Product

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| code | VARCHAR(50) | UNIQUE, NOT NULL | e.g. 'FIRE_SPECIAL_PERILS' |
| name | VARCHAR(255) | NOT NULL | e.g. 'Fire & Special Perils' |
| category | VARCHAR(100) | | 'Property', 'Liability', 'Health', 'Motor' |
| description | TEXT | | |
| carrier | VARCHAR(255) | | insurer name |
| min_premium | DECIMAL(15,2) | | |
| max_premium | DECIMAL(15,2) | | |
| commission_rate | DECIMAL(5,2) | | percentage |
| risk_mappings | JSONB | | [{pillar, condition, priority}] |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

### Quote

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| assessment_id | UUID | FK -> Assessment, nullable | |
| advisor_id | UUID | FK -> Advisor, NOT NULL | |
| client_id | UUID | FK -> Client, NOT NULL | |
| status | ENUM('draft','sent','accepted','rejected','expired') | DEFAULT 'draft' | |
| selected_products | JSONB | NOT NULL | [{product_id, premium, sum_insured}] |
| total_premium_min | DECIMAL(15,2) | | |
| total_premium_max | DECIMAL(15,2) | | |
| valid_until | DATE | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

Indexes: idx_quote_assessment, idx_quote_advisor, idx_quote_status

### Proposal

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| quote_id | UUID | FK -> Quote, NOT NULL | |
| assessment_id | UUID | FK -> Assessment, nullable | |
| status | ENUM('draft','sent','viewed','signed','declined') | DEFAULT 'draft' | |
| pdf_url | TEXT | | |
| sent_at | TIMESTAMPTZ | | |
| viewed_at | TIMESTAMPTZ | | |
| signed_at | TIMESTAMPTZ | | |
| declined_at | TIMESTAMPTZ | | |
| decline_reason | TEXT | | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

### Policy

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| quote_id | UUID | FK -> Quote, NOT NULL | |
| proposal_id | UUID | FK -> Proposal, nullable | |
| policy_number | VARCHAR(100) | UNIQUE | |
| carrier | VARCHAR(255) | NOT NULL | |
| product_code | VARCHAR(50) | FK -> Product.code | |
| sum_insured | DECIMAL(15,2) | | |
| premium | DECIMAL(15,2) | NOT NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| status | ENUM('active','expired','cancelled','lapsed') | DEFAULT 'active' | |
| cancellation_reason | TEXT | | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

Indexes: idx_policy_number, idx_policy_client (via quote), idx_policy_status, idx_policy_end_date

### Renewal

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| policy_id | UUID | FK -> Policy, NOT NULL | |
| new_assessment_id | UUID | FK -> Assessment, nullable | reassessment score |
| status | ENUM('pending','approved','declined','expired') | DEFAULT 'pending' | |
| new_premium | DECIMAL(15,2) | | |
| new_start_date | DATE | | |
| new_end_date | DATE | | |
| reminder_sent_at | TIMESTAMPTZ | | |
| converted_at | TIMESTAMPTZ | | when client accepts |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

Index: idx_renewal_policy

## Product 4: CoverScore Intelligence™ — AI & Analytics Entities

### AIPrompt

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| code | VARCHAR(50) | UNIQUE, NOT NULL | RISK_STORY, INSIGHT, COPILOT, etc |
| name | VARCHAR(255) | NOT NULL | |
| prompt_template | TEXT | NOT NULL | template with {{variables}} |
| model | VARCHAR(100) | DEFAULT 'gpt-4' | |
| temperature | DECIMAL(3,2) | DEFAULT 0.7 | |
| max_tokens | INTEGER | DEFAULT 500 | |
| variables | JSONB | | list of expected variables |
| version | VARCHAR(20) | NOT NULL | semver |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

### AIOutput

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| prompt_id | UUID | FK -> AIPrompt, NOT NULL | |
| assessment_id | UUID | FK -> Assessment, nullable | |
| input_variables | JSONB | | the values used |
| output_text | TEXT | NOT NULL | |
| tokens_used | INTEGER | | |
| latency_ms | INTEGER | | |
| model_version | VARCHAR(50) | | |
| was_cached | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | | |

### KnowledgeBase

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| product_code | VARCHAR(50) | FK -> Product.code, nullable | |
| category | ENUM('risk','product','objection','faq','claim','success_story') | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| content | TEXT | NOT NULL | markdown |
| tags | JSONB | | ['fire','property','sme'] |
| source | VARCHAR(255) | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

Index: idx_kb_category, idx_kb_product

### Outcome (Learning Engine)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| assessment_id | UUID | FK -> Assessment, NOT NULL | |
| lead_id | UUID | FK -> Client, nullable | |
| advisor_id | UUID | FK -> Advisor, nullable | |
| products_quoted | JSONB | | [{code, name, premium}] |
| products_purchased | JSONB | | [{code, name, premium}] |
| advisor_contacted | BOOLEAN | DEFAULT false | |
| meeting_held | BOOLEAN | DEFAULT false | |
| conversion | BOOLEAN | DEFAULT false | |
| premium_written | DECIMAL(15,2) | DEFAULT 0 | |
| follow_ups_sent | INTEGER | DEFAULT 0 | |
| recorded_at | TIMESTAMPTZ | | |

Index: idx_outcome_assessment, idx_outcome_advisor

### AnalyticsEvent

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| event_type | VARCHAR(100) | NOT NULL | assessment_completed, quote_sent, policy_issued, etc |
| entity_type | VARCHAR(50) | | |
| entity_id | UUID | | |
| properties | JSONB | | arbitrary event data |
| person_id | UUID | FK -> Person, nullable | |
| session_id | VARCHAR(100) | | |
| created_at | TIMESTAMPTZ | | |

Index: idx_event_type, idx_event_person, idx_event_created

## Relationships Summary (Formal)

| Parent | Child | Type | FK Field |
|--------|-------|------|----------|
| Person | Business | 1:N | business.person_id |
| Person | Assessment | 1:N | assessment.person_id |
| Person | Client | 1:N | client.person_id |
| Person | Advisor | 1:1 | advisor.person_id |
| Advisor | Team | N:1 | advisor.team_id |
| Advisor | Client | 1:N | client.advisor_id |
| Advisor | Task | 1:N | task.assigned_to |
| Advisor | Quote | 1:N | quote.advisor_id |
| Business | Assessment | 1:N | assessment.business_id |
| Business | Client | 1:N | client.business_id |
| Assessment | AssessmentAnswer | 1:N | answer.assessment_id |
| Assessment | RiskPillar | 1:N | pillar.assessment_id |
| Assessment | AIOutput | 1:N | aioutput.assessment_id |
| Assessment | Quote | 1:N | quote.assessment_id |
| Client | Quote | 1:N | quote.client_id |
| Quote | Proposal | 1:N | proposal.quote_id |
| Proposal | Policy | 1:N | policy.proposal_id |
| Policy | Renewal | 1:N | renewal.policy_id |
| Product | KnowledgeBase | 1:N | knowledgebase.product_code |
| AIPrompt | AIOutput | 1:N | aioutput.prompt_id |

## Standard Fields Convention

Every table MUST include:
- id (UUID, PK)
- created_at (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- updated_at (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

Use triggers or application code to auto-update updated_at.

## Naming Conventions

- Tables: snake_case, plural (persons, businesses, assessments)
- Columns: snake_case
- JSON fields: snake_case
- Enums: UPPER_SNAKE_CASE
- Indexes: idx_{table}_{column}
- Foreign keys: {singular_table}_id

## Enum Definitions

```
person_role: client, advisor, admin, manager
business_size: 1-10, 11-50, 51-200, 200+
assessment_status: in_progress, completed, expired
risk_level: low, moderate, high, critical
advisor_status: active, inactive, suspended
client_status: lead, contacted, qualified, converted, inactive
task_priority: high, medium, low
task_status: pending, in_progress, completed, cancelled
activity_type: call, email, meeting, note, system, whatsapp
notification_channel: in_app, email, whatsapp
notification_status: pending, sent, read
quote_status: draft, sent, accepted, rejected, expired
proposal_status: draft, sent, viewed, signed, declined
policy_status: active, expired, cancelled, lapsed
renewal_status: pending, approved, declined, expired
kb_category: risk, product, objection, faq, claim, success_story
```

## Index Strategy

Every foreign key gets an index. Every status/lookup field used in WHERE gets an index. Every date field used in range queries gets an index. JSONB fields use GIN indexes for querying inside JSON structures.