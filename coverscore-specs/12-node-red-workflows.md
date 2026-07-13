# Node-RED Automation Workflows

> Full specification at `node-red-flows/README.md` — this document summarises the automation architecture.

## 1. Overview

Node-RED orchestrates all post-assessment automation: lead routing, notifications, follow-ups, reminders, and analytics events. Every flow is event-triggered via webhook from the CoverScore API.

## 2. Flow Catalog

### Flow 1: Assessment Completed
**Trigger:** `POST /api/webhook/assessment-complete`

**Actions:**
1. Validate payload (`assessmentId`, `personId`, `prefix`, `score`, `rieData`)
2. Fetch full assessment data from API
3. Send report email to client
4. Notify advisor (if `advisorRequested`)
5. Create/update CRM lead record
6. Generate tasks from follow-up engine output
7. Build advisor copilot brief from RIE output
8. Push products to quote builder
9. Return 200 OK

### Flow 2: Advisor Assigned
**Trigger:** `POST /api/advisor/claim-lead`

**Actions:**
1. Load assessment + RIE data
2. Generate personalised copilot brief with opening line
3. Create call task (due in 2h for high opportunity, 24h for standard)
4. Send WhatsApp welcome message to client
5. Log activity in CRM

### Flow 3: Quote Generated
**Trigger:** Quote Builder form submission

**Actions:**
1. Validate selected products
2. Calculate premiums
3. Save quote to database
4. Generate proposal link
5. Notify client
6. Log activity

### Flow 4: Proposal Sent
**Trigger:** Proposal status → 'sent'

**Actions:**
1. Generate PDF proposal
2. Upload to storage/public directory
3. Save URL to proposal record
4. Send WhatsApp notification
5. Send email copy
6. Schedule follow-up task (7 days)
7. If not viewed within 48h: send reminder
8. If not signed within 7d: advisor follow-up task
9. If signed: trigger Policy Issued flow

### Flow 5: Policy Issued
**Trigger:** Policy record created

**Actions:**
1. Send welcome pack (message + documents)
2. Schedule renewal (90 days before expiry)
3. Log outcome (won/deal)
4. Check cross-sell opportunities

### Flow 6: Renewal Due
**Trigger:** 90 days before policy expiry

**Actions:**
1. Load policy + client data
2. If score change > 10 pts: recommend reassessment
3. If new risks detected: update recommendations
4. If no change: auto-generate renewal with premium adjustment
5. Send reminder to client
6. Notify advisor

### Flow 7: Client No-Response
**Trigger:** 7 days since last contact

**Actions:**
1. Check last contact timestamp
2. Send follow-up message
3. Log activity
4. If >14 days: escalate to advisor

### Flow 8: Cross-sell Opportunity
**Trigger:** Policy issued OR score improvement detected

**Actions:**
1. Check existing products vs recommended
2. Find coverage gaps
3. Generate cross-sell message
4. Queue for advisor review

### Flow 9: Analytics Event
**Trigger:** Any significant system event

**Actions:** Log event to analytics_events table and update advisor metrics.

### Flow 10: Daily Scheduler
**Trigger:** Cron (daily 6:00 AM WAT)

**Checks:** Expiring policies, overdue follow-ups, unread proposals (48h+), advisor metrics, learning engine aggregation.

## 3. Integration Points

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/webhook/assessment-complete` | Webhook | Assessment completed |
| `POST /api/webhook/advisor-assigned` | Webhook | Advisor claims lead |
| `POST /api/webhook/quote-generated` | Webhook | Quote created |
| `POST /api/webhook/proposal-status` | Webhook | Proposal status change |
| `POST /api/webhook/policy-issued` | Webhook | Policy created |
| `GET /api/assessments/:id` | HTTP | Get full assessment |
| `GET /api/clients/:id` | HTTP | Get client details |
| `GET /api/products?industry=X` | HTTP | Get product list |
| `POST /api/notifications/send` | HTTP | Send notification |
| `POST /api/tasks/create` | HTTP | Create task |
| `POST /api/activities/log` | HTTP | Log activity |

## 4. Error Handling Strategy

- Every flow node has a catch handler that logs errors without blocking downstream nodes
- Failed sends are retried once after 60 seconds
- After 2 failures, the error is escalated to admin via Telegram/Email
- The client-facing message path is never blocked by backend processing
