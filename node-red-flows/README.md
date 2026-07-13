# CoverScore Node-RED Automation Flows

## Overview

CoverScore uses Node-RED as its automation engine to orchestrate post-assessment workflows. This document defines every flow, trigger, condition, action, and integration point.

## Flow 1: Assessment Completed

**Trigger**: Webhook from CoverScore API when assessment scoring completes (`POST /api/webhook/assessment-complete`)

**Payload**: `{ assessmentId, personId, prefix, score, riskLevel, advisorRequested, rieData }`

**Flow**:
```
[Webhook] → [Calculate Score] → [Generate Report] → [Email Report] → [Notify Advisor] → [Create CRM Lead] → [Generate Tasks] → [Open AI Brief] → [Recommend Products]
```

**Nodes**:
1. HTTP Input — receives webhook
2. Function — validate payload, extract key fields
3. HTTP Request — call CoverScore API to get full assessment data
4. Function — calculate RIE opportunity score (or use existing score)
5. Email — send report to client
6. HTTP Request — notify advisor via API
7. Database — insert/update client record
8. Function — generate tasks based on follow-up engine output
9. Function — build advisor copilot brief from RIE output
10. HTTP Request — push products to quote builder
11. HTTP Response — return 200 OK

**Error handling**: If any node fails, log error and continue. Never block the client report.

## Flow 2: Advisor Assigned

**Trigger**: Advisor claims a lead (`POST /api/advisor/claim-lead`)

**Flow**:
```
[Webhook] → [Load Assessment] → [Generate Copilot Brief] → [Create Tasks] → [Send Welcome Message] → [Log Activity]
```

**Key actions**:
- Load the full assessment + RIE data
- Generate a personalized copilot brief with opening line
- Create call task (due in 2 hours for high opportunity, 24 hours for standard)
- Send WhatsApp welcome message to client
- Log activity in CRM

## Flow 3: Quote Generated

**Trigger**: Advisor generates a quote in Quote Builder

**Flow**:
```
[Quote Builder] → [Validate Products] → [Calculate Premiums] → [Save Quote] → [Generate Proposal Link] → [Notify Client] → [Log Activity]
```

## Flow 4: Proposal Sent

**Trigger**: Proposal status changes to 'sent'

**Flow**:
```
[Status Change] → [Generate PDF] → [Upload to Storage] → [Save URL] → [Send WhatsApp] → [Send Email] → [Schedule Follow-up Task (7 days)]
```

**Follow-up logic**:
- If not viewed within 48 hours: send reminder
- If not signed within 7 days: advisor follow-up task
- If signed: trigger Policy Issued flow

## Flow 5: Policy Issued

**Trigger**: Policy created in system

**Flow**:
```
[Policy Created] → [Send Welcome Pack] → [Schedule Renewal (90 days before expiry)] → [Log Outcome] → [Check Cross-sell Opportunities]
```

## Flow 6: Renewal Due

**Trigger**: 90 days before policy end_date (from Renewal Engine)

**Flow**:
```
[Scheduler] → [Load Policy] → [Check if Reassessment Needed] → [Send Renewal Reminder] → [Generate Renewal Proposal] → [Notify Advisor]
```

**Decision tree**:
- If score change > 10 points: recommend reassessment
- If new risks detected: update recommendations
- If no change: auto-generate renewal with same products + premium adjustment

## Flow 7: Client No-Response

**Trigger**: No response for 7 days after last contact

**Flow**:
```
[Scheduler] → [Check Last Contact] → [If >7 days] → [Send Follow-up Message] → [Log Activity] → [If >14 days] → [Escalate to Advisor]
```

## Flow 8: Cross-sell Opportunity

**Trigger**: Policy issued OR score improvement detected

**Flow**:
```
[Event] → [Check Existing Products] → [Compare with Recommended] → [Find Gap] → [Generate Cross-sell Message] → [Queue for Advisor Review]
```

## Flow 9: Analytics Event

**Trigger**: Any significant system event

**Events tracked**:
- Assessment completed
- Advisor assigned
- Quote generated
- Proposal sent/viewed/signed
- Policy issued/expired
- Renewal approved/declined
- Client contacted
- Task completed

**Flow**:
```
[Event] → [Enrich with Context] → [Log to analytics_events] → [Update Advisor Metrics] → [Check Learning Engine]
```

## Flow 10: Daily Scheduler

**Trigger**: Cron job (daily at 6:00 AM WAT)

**Checks**:
1. Expiring policies (90-day window) → trigger Flow 6
2. Overdue follow-ups → trigger Flow 7
3. Unread proposals (48h+) → send reminder
4. Advisor performance metrics → update daily
5. Learning engine → aggregate yesterday's outcomes

## Node-RED Integration Points

| Endpoint | Method | Purpose |
|----------|--------|---------|
| POST /api/webhook/assessment-complete | Webhook | Assessment completed |
| POST /api/webhook/advisor-assigned | Webhook | Advisor claims lead |
| POST /api/webhook/quote-generated | Webhook | Quote created |
| POST /api/webhook/proposal-status | Webhook | Proposal status change |
| POST /api/webhook/policy-issued | Webhook | Policy created |
| GET /api/assessments/:id | HTTP | Get full assessment |
| GET /api/clients/:id | HTTP | Get client details |
| GET /api/products?industry=X | HTTP | Get product list |
| POST /api/notifications/send | HTTP | Send notification |
| POST /api/tasks/create | HTTP | Create task |
| POST /api/activities/log | HTTP | Log activity |

## Environment Variables for Node-RED

```
COVERSCORE_API_URL=https://coverscore.site/api
COVERSCORE_API_KEY=xxx
DATABASE_URL=postgres://...
EVOLUTION_API_URL=https://evolution.cover.zone
EVOLUTION_API_KEY=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

## Testing

For each flow, create a test payload and expected output. Document here how to manually trigger each flow for testing.
