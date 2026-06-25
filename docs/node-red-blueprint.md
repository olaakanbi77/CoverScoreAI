# CoverScore Node-RED Implementation Blueprint™ v1
Technical Build Blueprint for CoverScore Personal™

Assessment: Family Protection Score™
WhatsApp transport: Evolution API
Workflow orchestration: Node-RED
Database: PostgreSQL
Report delivery: Secure web report + optional PDF
Primary objective: Turn WhatsApp assessment conversations into scored reports, consent-based advisor opportunities, and structured follow-up workflows.

## 1. Platform Architecture
Social Media / Landing Page
        ↓
WhatsApp Deep Link
        ↓
Evolution API
        ↓
Node-RED Webhook Gateway
        ↓
CoverScore Conversation Engine™
        ↓
PostgreSQL Database
        ↓
CoverScore Scoring & Recommendation Engine™
        ↓
Report Generator
        ↓
Secure Report Storage
        ↓
Evolution API WhatsApp Delivery
        ↓
Lead receives result and report
        ↓
Advisor Consent Engine
        ↓
CoverScore Advisor OS™ Opportunities
        ↓
Advisor Follow-Up Workflow

## 2. Recommended Deployment Structure

Use separate services so that the WhatsApp conversation, database, reporting, and advisor dashboard can scale independently.

VPS / Docker Host
│
├── reverse-proxy
│   ├── HTTPS certificates
│   ├── webhook routing
│   └── secure report links
│
├── node-red
│   ├── WhatsApp webhook flows
│   ├── conversation engine
│   ├── reminder scheduler
│   ├── scoring trigger
│   └── advisor routing
│
├── postgres
│   ├── leads
│   ├── sessions
│   ├── answers
│   ├── results
│   ├── reports
│   ├── opportunities
│   └── audit logs
│
├── evolution-api
│   ├── WhatsApp instance management
│   ├── incoming messages
│   ├── outgoing messages
│   └── delivery webhooks
│
├── report-service
│   ├── HTML report renderer
│   ├── PDF generator
│   └── signed-link generator
│
├── object-storage
│   ├── report PDFs
│   ├── generated images
│   └── secure assets
│
└── advisor-os
    ├── opportunities
    ├── advisor assignments
    ├── follow-up tasks
    └── reporting dashboard

## 3. Core Integration Principles
- **Evolution API only handles WhatsApp transport.** It receives and sends messages but does not decide the next assessment step.
- **Node-RED controls workflow.** It decides whether to start, resume, pause, validate, score, remind, generate a report, or create an opportunity.
- **PostgreSQL is the source of truth.** Never rely only on Node-RED context memory for sessions, answers, scores, or consent.
- **Questions and rules must be configuration-driven.** Do not hardcode the Family Protection questions inside multiple Node-RED function nodes.
- **Every inbound and outbound message must be logged.**
- **No advisor opportunity is created without explicit consent.**
- **Every report must be traceable to a saved result payload.**
- **All flows must be idempotent.** If Evolution API sends the same webhook twice, the user must not receive duplicate questions or duplicate reports.

## 4. Service Responsibilities
| Service | Responsibility |
| --- | --- |
| Evolution API | WhatsApp connection, incoming messages, outgoing messages, delivery updates |
| Node-RED | Conversation state, validation, reminders, scoring triggers, report orchestration, opportunity routing |
| PostgreSQL | Permanent storage for all business data |
| Report Service | Generate secure HTML report and PDF |
| Object Storage | Store PDF reports and protected assets |
| Advisor OS | Display opportunities, assignments, tasks, notes, and sales progress |
| Reverse Proxy | HTTPS, routing, rate limiting, secure access |

## 5. Node-RED Flow Map

The implementation should use small reusable flows rather than one large flow.

FLOW 01 — Evolution API Webhook Receiver
FLOW 02 — Incoming Message Normalizer
FLOW 03 — Duplicate Message Guard
FLOW 04 — Lead and Session Resolver
FLOW 05 — Global Command Router
FLOW 06 — Assessment State Engine
FLOW 07 — Answer Validation and Save
FLOW 08 — Conditional Branching Engine
FLOW 09 — Assessment Completion Trigger
FLOW 10 — Scoring and Recommendation Engine
FLOW 11 — Report Generation Workflow
FLOW 12 — WhatsApp Report Delivery
FLOW 13 — Advisor Consent and Opportunity Creation
FLOW 14 — Advisor Routing and Notification
FLOW 15 — Reminder Scheduler
FLOW 16 — Delivery Status Updates
FLOW 17 — Error Handling and Admin Alerts
FLOW 18 — Audit Logging

## 6. Flow 01 — Evolution API Webhook Receiver
### Purpose
Receive incoming WhatsApp events from Evolution API.

### Endpoint
POST /webhooks/evolution/messages

### Node Sequence
HTTP In
↓
JSON Parser
↓
Webhook Authentication Check
↓
Event Type Filter
↓
Send to Incoming Message Normalizer
↓
HTTP Response 200

### Accepted Events
- messages.upsert
- messages.update
- connection.update
- send.message

### Security Rules
- Require a secret header or token.
- Reject requests without the expected secret.
- Store raw webhook payload for troubleshooting.
- Return HTTP 200 quickly, then process asynchronously where possible.
- Do not expose database errors in the webhook response.

## 7. Flow 02 — Incoming Message Normalizer
### Purpose
Convert Evolution API payload variations into one CoverScore message object.

### Normalized Object
```json
{
  "event_id": "evt_001",
  "event_type": "incoming_message",
  "instance_name": "coverscore-main",
  "message_id": "wamid_001",
  "from_number": "2348012345678",
  "to_number": "2348099999999",
  "message_type": "text",
  "text": "START",
  "timestamp": "2026-06-24T14:00:00Z",
  "display_name": "Ayo",
  "is_group": false,
  "raw_payload": {}
}
```

### Normalization Rules
- Convert phone numbers to E.164 without +.
- Trim whitespace from message text.
- Convert text to uppercase for command matching.
- Preserve original message text for audit logging.
- Ignore group messages.
- Ignore status messages.
- Route image, voice note, document, and sticker messages to unsupported-message handling.

### Unsupported Media Reply
Please reply with text or a number so I can continue your Family Protection Score™.
For example: 1

## 8. Flow 03 — Duplicate Message Guard
### Purpose
Prevent repeated Evolution API webhook events from causing duplicate processing.

### Logic
Check conversation_messages for: message_id + instance_name
If found: stop processing
If not found: create inbound message log, continue

### Database Constraint
UNIQUE (evolution_message_id, evolution_instance)

### Important Rule
The duplicate guard must run before session updates, answer saving, question sending, scoring, or report generation.

## 9. Flow 04 — Lead and Session Resolver
### Purpose
Find or create the lead and locate the correct Family Protection Score™ session.

### Logic
Find lead by WhatsApp number
↓
If no lead exists: create lead
↓
Find latest session for: lead_id, template_code = family_protection_score_v1
↓
Route based on session status

### Session Statuses
| Status | Meaning |
| --- | --- |
| new | Session created but assessment not started |
| in_progress | User is actively answering |
| paused | User chose to pause |
| completed | Assessment and result completed |
| abandoned | User did not complete after reminder cycle |
| stopped | User opted out |
| expired | Secure session no longer valid |
| error | System failure requires review |

### Resolver Rules
| Condition | Action |
| --- | --- |
| No prior session | Create session at FAM_WELCOME |
| In-progress session | Resume from current_step |
| Paused session | Wait for CONTINUE |
| Completed session | Handle REPORT, ADVISOR, or START |
| Abandoned session | Offer CONTINUE or RESTART |
| Stopped session | Only allow a new assessment after START |

## 10. Flow 05 — Global Command Router
### Supported Commands
START, FAMILY, CONTINUE, PAUSE, RESTART, STOP, HELP, REPORT, ADVISOR, MENU

### Command Priority
STOP ↓ HELP ↓ PAUSE ↓ RESTART ↓ CONTINUE ↓ REPORT ↓ ADVISOR ↓ MENU ↓ Current-step answer validation

### Node Sequence
Normalize Text ↓ Map Aliases ↓ Switch Node by Command ↓ Command-Specific Subflow ↓ Send WhatsApp Message ↓ Write Audit Log

### Command Alias Map
| User Input | System Command |
| --- | --- |
| resume | CONTINUE |
| continue assessment | CONTINUE |
| quit | STOP |
| unsubscribe | STOP |
| family score | FAMILY |
| start assessment | START |
| support | ADVISOR |

## 11. Flow 06 — Assessment State Engine
### Purpose
Send the correct question or message based on current_step.

### State Lookup
Store state configuration in the database or version-controlled JSON file.
assessment_templates ↓ assessment_states ↓ state_code ↓ message_code ↓ input_type ↓ validation_rule ↓ branch_rule ↓ next_state

### State Engine Logic
Load current session ↓ Load current state configuration ↓ Render message variables ↓ Send message through WhatsApp adapter ↓ Log outbound message

### Example State Configuration
```json
{
  "state_code": "FAM_Q03_INCOME_CONTINUITY",
  "question_code": "PER_INC_001",
  "input_type": "single_select",
  "accepted_inputs": ["1", "2", "3", "4", "5", "6"],
  "next_state": "FAM_Q04_LIFE_PROTECTION",
  "invalid_message_code": "BOT_FAM_INVALID_003"
}
```

## 12. Flow 07 — Answer Validation and Save
### Purpose
Validate user input, save the answer, and prepare the next state.

### Node Sequence
Load Current State ↓ Validate Input Type ↓ If Invalid: Invalid Reply Handler ↓ If Valid: Map Answer Value ↓ Save Answer ↓ Update Session Activity ↓ Run Branching Engine

### Validation Types
| Input Type | Rule |
| --- | --- |
| single_select | Must match listed option |
| name | 2–50 letters, spaces, apostrophes, hyphens |
| nigerian_state | Match approved state list |
| email_or_skip | Valid email or SKIP |
| command | Match allowed command |
| free_text | Sanitize and store safely |

### Answer Save Rule
Use an upsert so that a corrected answer replaces the prior answer for the same question.
UNIQUE (assessment_session_id, question_code)

## 13. Flow 08 — Conditional Branching Engine
### Purpose
Choose the next assessment state based on answers.

### Example Rules
If dependents > 0: ask family health cover question
If dependents = 0: skip family health cover question
If education responsibility exists: ask education continuity question
If education responsibility does not exist: move to report email option

### Rule Format
```json
{
  "rule_id": "BRANCH_FAM_001",
  "state_code": "FAM_Q05_HEALTH_PROTECTION",
  "condition": "answers.PER_FAM_001.value != 0",
  "next_state": "FAM_Q06_FAMILY_HEALTH_COVER",
  "fallback_state": "FAM_Q07_EMERGENCY_FUND"
}
```

### Important Rule
Branching logic must be stored as configuration, not duplicated across multiple Node-RED functions.

## 14. Flow 09 — Assessment Completion Trigger
### Trigger Condition
Current state = FAM_PROCESSING AND all required questions are complete AND assessment consent = true

### Node Sequence
Validate Required Answers ↓ Mark Session as Processing ↓ Create Assessment Completion Event ↓ Call Scoring Engine

### Required Completion Checks
- All core questions answered
- Conditional questions answered when applicable
- No duplicate answer records
- Assessment consent recorded
- Lead phone number present
- Session status is not stopped

## 15. Flow 10 — Scoring and Recommendation Engine
### Purpose
Generate the official Family Protection Score™ result payload.

### Node Sequence
Load Session Answers ↓ Load Scoring Configuration ↓ Calculate Category Scores ↓ Apply Weight Redistribution ↓ Calculate Overall Score ↓ Assign Score Band ↓ Assign Risk DNA™ ↓ Select Top Three Priorities ↓ Select Recommendations ↓ Select Risk Story ↓ Select Academy Lesson ↓ Create Result Record

### Result Storage
assessment_results
├── overall_score
├── score_band
├── category_scores_json
├── risk_dna_json
├── priority_actions_json
├── risk_story_json
├── academy_recommendation_json
├── advisor_priority
└── generated_at

### Idempotency Rule
Before calculating:
If a completed result already exists for the session: return existing result
Else: calculate and save new result

## 16. Flow 11 — Report Generation Workflow
### Purpose
Generate the secure web report and optional PDF.

### Node Sequence
Load Assessment Result ↓ Load Report Template ↓ Build Report Payload ↓ Create Secure Report Token ↓ Generate HTML Web Report ↓ Generate PDF ↓ Upload PDF to Object Storage ↓ Create Report Record ↓ Return Secure Report URL

### Report Record
reports
├── id
├── assessment_session_id
├── report_type
├── report_version
├── report_token_hash
├── secure_url
├── pdf_storage_key
├── expires_at
├── generated_at
└── status

### Secure URL Rule
https://report.coverscore.ng/r/[signed-token]
Recommended expiry: 30 days
Allow a new link to be generated if the user sends REPORT.

## 17. Flow 12 — WhatsApp Report Delivery
### Purpose
Send the score summary and secure report link.

### Node Sequence
Load Result ↓ Render Result Message ↓ Send Score Summary ↓ Send Secure Report Link ↓ Update Report Status ↓ Send Advisor Consent Prompt

### Delivery Sequence
Processing message -> Score summary -> Risk story -> Report link -> Advisor-support consent prompt

### Delivery Failure Rule
If sending fails:
Retry after 1 minute ↓ Retry after 5 minutes ↓ Retry after 15 minutes ↓ Create admin alert

## 18. Flow 13 — Advisor Consent and Opportunity Creation
### Purpose
Create an opportunity only after the lead asks for advisor support.

### Consent Options
1 — Yes, I would like support
2 — Not now
3 — I only want educational tips

### Node Sequence
Receive Consent Reply ↓ Validate Consent Option ↓ Save Consent Record ↓ If Option 1: Ask Contact Preference ↓ Receive Contact Preference ↓ Create Opportunity ↓ Create Follow-Up Task ↓ Route to Advisor

### Opportunity Creation Rule
Create opportunity only when: advisor_contact_consent = true

### Opportunity Data
opportunities
├── lead_id
├── assessment_session_id
├── score
├── score_band
├── risk_dna_json
├── top_priorities_json
├── opportunity_priority
├── contact_preference
├── stage
├── advisor_id
└── created_at

## 19. Flow 14 — Advisor Routing and Notification
### Advisor Routing Rules
1. Match Personal Protection specialization.
2. Prefer the lead’s previously assigned advisor.
3. Match advisor location where possible.
4. Exclude advisors at capacity.
5. Assign lowest active-opportunity load.
6. Send unmatched leads to supervisor queue.

### Node Sequence
Find Eligible Advisors ↓ Score Advisors by Routing Rules ↓ Assign Advisor ↓ Create Follow-Up Task ↓ Notify Advisor ↓ Update Opportunity Stage = assigned

### Advisor Notification
```text
New CoverScore Personal Opportunity™

Lead: [First Name]
State: [State]
Score: [Score]/100 — [Score Band]
Priority: [Opportunity Priority]

Top Areas:
• [Priority 1]
• [Priority 2]
• [Priority 3]

Preferred Contact:
[WhatsApp / Phone / Either]
```

## 20. Flow 15 — Reminder Scheduler
### Schedule
Run every 15 minutes.

### Reminder Rules
| Stage | Trigger | Action |
| --- | --- | --- |
| 1 | No activity for 1 hour | Friendly reminder |
| 2 | No activity for 24 hours | Value-led reminder |
| 3 | No activity for 72 hours | Final reminder |
| Abandoned | No activity for 7 days | Mark abandoned |

### Reminder Safety Rules
Do not remind users who replied STOP.
Do not remind completed sessions.
Do not send more than three reminders.
Do not send reminders during quiet hours (e.g., 9:00 PM to 8:00 AM Africa/Lagos).

### Scheduler Query
```sql
SELECT *
FROM assessment_sessions
WHERE status IN ('in_progress', 'paused')
  AND reminder_stage < 3
  AND stopped_at IS NULL
  AND completed_at IS NULL;
```

## 21. Flow 16 — Delivery Status Updates
### Purpose
Track WhatsApp delivery and read events.

### Node Sequence
Evolution API Delivery Webhook ↓ Normalize Status Event ↓ Find conversation_messages record ↓ Update delivery_status ↓ Write audit log

### Delivery Status Values
queued, sent, delivered, read, failed

### Use Cases
Confirm report link was delivered.
Identify failed reminder messages.
Avoid resending a report that was already delivered.
Track advisor notification delivery.

## 22. Flow 17 — Error Handling and Admin Alerts
### Error Categories
| Error | Response |
| --- | --- |
| Evolution API disconnected | Notify admin immediately |
| Database unavailable | Queue event and retry |
| Duplicate webhook | Ignore safely |
| Invalid state configuration | Mark session error and alert admin |
| Report generation failure | Retry and alert after final failure |
| PDF upload failure | Retry and alert |
| No advisor available | Route to supervisor queue |
| Repeated invalid replies | Offer skip, pause, or human support |

### Admin Alert Channels
Admin WhatsApp group, Email, Advisor OS admin dashboard, Optional Slack or Telegram channel

### Alert Format
```text
CoverScore System Alert

Type: Report Generation Failure
Session: [Session ID]
Lead: [First Name]
Current State: [State]
Time: [Timestamp]

Action Required:
Retry report generation or contact the lead manually.
```

## 23. Flow 18 — Audit Logging
Every major event must be written to audit_logs.

### Events to Log
lead_created, session_created, session_resumed, message_received, message_sent, message_delivery_updated, answer_saved, answer_invalid, state_changed, assessment_completed, result_generated, report_generated, report_sent, advisor_consent_given, opportunity_created, advisor_assigned, reminder_sent, session_abandoned, session_stopped, system_error

### Audit Log Structure
```json
{
  "event_type": "answer_saved",
  "entity_type": "assessment_session",
  "entity_id": "assessment_uuid",
  "actor_type": "lead",
  "actor_id": "lead_uuid",
  "metadata": {
    "question_code": "PER_INC_001",
    "answer_value": "2"
  },
  "created_at": "2026-06-24T14:15:00Z"
}
```

## 24. Reusable Node-RED Subflows
Create each as a reusable subflow.

| Subflow Name | Purpose |
| --- | --- |
| CoverScore — Normalize WhatsApp Event | Convert Evolution payload to standard object |
| CoverScore — Duplicate Guard | Prevent duplicate processing |
| CoverScore — Find or Create Lead | Resolve lead by WhatsApp number |
| CoverScore — Find Assessment Session | Resolve active assessment |
| CoverScore — Send WhatsApp Message | Send and log outbound messages |
| CoverScore — Validate Reply | Validate current-state input |
| CoverScore — Save Assessment Answer | Upsert answer record |
| CoverScore — Resolve Next State | Apply branch rules |
| CoverScore — Calculate Result | Run scoring engine |
| CoverScore — Generate Report | Generate HTML/PDF and signed link |
| CoverScore — Create Opportunity | Create consent-based opportunity |
| CoverScore — Route Advisor | Assign advisor |
| CoverScore — Schedule Reminder | Manage reminder stage |
| CoverScore — Write Audit Log | Store system events |
| CoverScore — Send Admin Alert | Notify operations team |

## 25. Recommended Node-RED Environment Variables
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_DATABASE
POSTGRES_USER
POSTGRES_PASSWORD

EVOLUTION_API_BASE_URL
EVOLUTION_API_KEY
EVOLUTION_INSTANCE_NAME
EVOLUTION_WEBHOOK_SECRET

REPORT_SERVICE_URL
REPORT_SERVICE_API_KEY
REPORT_BASE_URL

OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY
OBJECT_STORAGE_SECRET_KEY

ADVISOR_OS_API_URL
ADVISOR_OS_API_KEY

ADMIN_ALERT_WHATSAPP_NUMBER
ADMIN_ALERT_EMAIL

APP_TIMEZONE=Africa/Lagos

Never place these values directly inside Node-RED function nodes.

## 26. Database Connection Rules
- Use parameterized queries only.
- Enable PostgreSQL connection pooling.
- Add indexes for WhatsApp number, session status, current step, reminder stage, report token, and opportunity stage.
- Use database transactions for: Answer save + state update, Result creation + session completion, Consent save + opportunity creation, Advisor assignment + task creation.
- Store timestamps in UTC.
- Display timestamps in Africa/Lagos in the Advisor OS.

## 27. Build Order
### Phase 1 — Foundation
1. Deploy PostgreSQL
2. Deploy Evolution API
3. Deploy Node-RED
4. Configure HTTPS and webhook routing
5. Create environment variables
6. Build raw webhook receiver
7. Build message normalization
8. Build duplicate guard
9. Build audit logging

### Phase 2 — WhatsApp Assessment
1. Create assessment template tables
2. Load Family Protection question configuration
3. Build lead and session resolver
4. Build command router
5. Build state engine
6. Build validation and answer-save flow
7. Build branching rules
8. Build pause, continue, restart, stop, and help flows

### Phase 3 — Intelligence and Reports
1. Build scoring engine
2. Build Risk DNA™ rules
3. Build recommendation selection
4. Build result storage
5. Build report payload
6. Build report generator
7. Build secure report links
8. Build WhatsApp report delivery

### Phase 4 — Advisor Handoff
1. Build advisor consent flow
2. Build contact preference flow
3. Build opportunity creation
4. Build advisor routing
5. Build advisor notification
6. Build follow-up task creation

### Phase 5 — Recovery and Operations
1. Build reminder scheduler
2. Build delivery-status updates
3. Build retry logic
4. Build admin alerts
5. Build session abandonment rules
6. Build monitoring dashboard

### Phase 6 — Testing and Pilot
1. Test all valid answer paths
2. Test all conditional branches
3. Test invalid replies
4. Test duplicate webhooks
5. Test interrupted sessions
6. Test reminders
7. Test report delivery
8. Test advisor consent
9. Test advisor routing
10. Run a controlled pilot

## 28. MVP Acceptance Criteria
The MVP is ready for pilot only when:
- A lead can start the assessment through WhatsApp.
- The system can resume an interrupted assessment.
- Every answer is saved correctly.
- Conditional questions appear only when applicable.
- Invalid replies do not break the flow.
- A completed assessment produces a score and report.
- The report link is private and secure.
- The report can be resent with REPORT.
- No opportunity is created without advisor consent.
- Advisor opportunities are routed correctly.
- Reminders stop after completion or opt-out.
- Duplicate webhooks do not create duplicate messages.
- Admins can identify failed sessions and failed report deliveries.
- All activity is recorded in audit logs.

## 29. Future-Ready Extensions
This blueprint is designed to support future assessment tracks without rebuilding the core engine:
- Family Protection Score™
- Personal Health Readiness Score™
- Motor Risk Readiness Score™
- Home Protection Score™
- SME Risk Score™
- School Risk Score™
- Church Risk Score™
- Manufacturing Risk Score™

Each future assessment should reuse the same: Lead model, Session model, Conversation engine, Question configuration structure, Scoring engine pattern, Report-generation workflow, Advisor-consent workflow, Opportunity-routing system.
Only the question bank, scoring rules, recommendations, risk stories, report template, and advisor specialization rules should change.

## 30. Final Build Principle
Evolution API delivers the message.
Node-RED manages the journey.
PostgreSQL remembers every important decision.
CoverScore intelligence explains the result.
The report builds trust.
Advisor consent creates the sales opportunity.

CoverScore Personal™
Smart Risk. Stronger Decisions.
