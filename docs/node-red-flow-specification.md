# CoverScore Node-RED Flow-by-Flow Build Specification™ v1
MVP Build Specification for CoverScore Personal™

Assessment: Family Protection Score™
WhatsApp: Evolution API
Workflow engine: Node-RED
Database: PostgreSQL
Timezone: Africa/Lagos
Build principle: Small reusable flows, database-led state, idempotent processing, consent-first advisor handoff.

## 1. Build Structure

Create the following Node-RED tabs.

- TAB 01 — Webhook Gateway
- TAB 02 — Message Router
- TAB 03 — Family Protection Assessment
- TAB 04 — Scoring & Result Generation
- TAB 05 — Report Generation & Delivery
- TAB 06 — Advisor Consent & Opportunity Creation
- TAB 07 — Reminder & Abandonment Recovery
- TAB 08 — Delivery Status & Monitoring
- TAB 09 — Admin Alerts & Error Handling
- TAB 10 — Shared Configuration

Create these reusable subflows.

- SUBFLOW 01 — Normalize Evolution Event
- SUBFLOW 02 — Duplicate Message Guard
- SUBFLOW 03 — Resolve Lead
- SUBFLOW 04 — Resolve Assessment Session
- SUBFLOW 05 — Send WhatsApp Message
- SUBFLOW 06 — Write Conversation Message
- SUBFLOW 07 — Save Assessment Answer
- SUBFLOW 08 — Resolve Next Assessment State
- SUBFLOW 09 — Render Assessment Message
- SUBFLOW 10 — Calculate Family Protection Score
- SUBFLOW 11 — Generate Secure Report
- SUBFLOW 12 — Record Consent
- SUBFLOW 13 — Create Opportunity
- SUBFLOW 14 — Route Advisor
- SUBFLOW 15 — Create Follow-Up Task
- SUBFLOW 16 — Write Audit Log
- SUBFLOW 17 — Send Admin Alert

## 2. Required Node-RED Palette Nodes

Install only the nodes needed for the MVP:
- `node-red-node-postgres`
- `node-red-contrib-credentials`
- `node-red-contrib-cron-plus`
- `node-red-contrib-moment`
- `node-red-contrib-queue-gate`

## 3. Environment Variables
... (Config rules and SQL scripts)
