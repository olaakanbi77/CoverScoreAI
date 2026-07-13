# API Specification

## 1. Authentication

All API routes (except public endpoints) require JWT Bearer token in `Authorization` header.

```
Authorization: Bearer <token>
```

### POST /api/auth/login

Authenticate user and return JWT.

**Request:**
```json
{
  "email": "admin@coverscore.ai",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": 1,
    "email": "admin@coverscore.ai",
    "name": "Administrator",
    "role": "admin"
  }
}
```

**Errors:** 401 Invalid credentials, 400 Missing fields

### POST /api/auth/register

Create new user account.

**Request:**
```json
{
  "name": "John Adedeji",
  "email": "john@example.com",
  "phone": "2348123456789",
  "password": "securePass123",
  "business_name": "John's Clinic",
  "industry": "hospital"
}
```

**Response (201):**
```json
{
  "id": 2,
  "email": "john@example.com",
  "name": "John Adedeji",
  "role": "user"
}
```

**Errors:** 409 Email exists, 400 Validation

---

## 2. WhatsApp Webhook

### POST /api/webhook/evolution

Evolution API event webhook — receives all WhatsApp messages.

**Request (from Evolution API):**
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "2348123456789@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "START SME ASSESSMENT"
    }
  }
}
```

**Response:** `200 OK` (immediately — processing continues asynchronously)

**Validation:**
- Must have `event === 'messages.upsert'`
- Must have valid `remoteJid`
- Must NOT be `fromMe`
- Must have non-empty text content

---

## 3. Analytics

### GET /api/analytics/overview

Dashboard overview metrics.

**Response (200):**
```json
{
  "totalAssessments": 342,
  "totalLeads": 567,
  "convertedLeads": 89,
  "conversionRate": 15.7,
  "avgScore": 52,
  "totalPremium": 45600000,
  "monthlyAssessments": 78,
  "sidebar": {
    "newLeads": 45,
    "newLeadsTrend": 12,
    "assessments": 78,
    "assessmentsTrend": -5,
    "consultations": 23,
    "consultationsTrend": 8,
    "policies": 12,
    "policiesTrend": 20,
    "activeWhatsAppChats": 34
  },
  "trends": {
    "leads": 12,
    "assessments": -5,
    "consultations": 8,
    "policies": 20,
    "premium": 15
  }
}
```

### GET /api/analytics/risk-distribution

Risk level distribution across all leads.

**Response (200):**
```json
{
  "low": 120,
  "moderate": 200,
  "high": 180,
  "critical": 67
}
```

### GET /api/analytics/conversion

Lead status breakdown and conversion rate.

**Response (200):**
```json
{
  "new": 200,
  "contacted": 150,
  "converted": 89,
  "lost": 128,
  "total": 567,
  "conversionRate": 15.7
}
```

### GET /api/analytics/pipeline

Pipeline stage distribution with trends.

**Response (200):**
```json
{
  "1": 150,
  "2": 120,
  "3": 98,
  "4": 45,
  "5": 23,
  "6": 12,
  "trends": {
    "4": 15,
    "6": -3
  }
}
```

### GET /api/analytics/query/:name

Execute a named analytics query.

**Query params:** `startDate`, `endDate`, `prefix`, `limit`

**Response (200):** Array of query result rows

**Errors:** 400 Unknown query name

### GET /api/analytics/report/weekly

Weekly advisor performance report.

**Response (200):** Composite report object

### GET /api/analytics/report/monthly

Monthly business overview report.

**Response (200):** Composite report object

### GET /api/analytics/report/funnel-health

Funnel health comparison across industries.

**Response (200):** Array of funnel metrics

### GET /api/analytics/report/assessment/:id

Deep-dive assessment analysis.

**Response (200):** Complete assessment data + RIE output + products + history

---

## 4. Proposals

### POST /api/proposals/generate

AI-draft a proposal for a lead.

**Request:**
```json
{
  "leadId": 42
}
```

**Response (200):**
```json
{
  "success": true,
  "draft": "<html>...</html>"
}
```

### POST /api/proposals/generate-pdf

Generate a PDF proposal from assessment data.

**Request:**
```json
{
  "leadId": 42
}
```

**Response (200):**
```json
{
  "success": true,
  "proposal": { "id": 15, "token": "abc...", "status": "Generated" },
  "pdfUrl": "/proposals/PROP-ABC123.pdf",
  "proposalNumber": "PROP-ABC123"
}
```

### POST /api/proposals/save

Create or update a proposal.

**Request:**
```json
{
  "id": null,
  "leadId": 42,
  "title": "Insurance Proposal — John's Clinic",
  "content": "Proposal content...",
  "amount": 250000,
  "status": "Draft"
}
```

**Response (200):**
```json
{
  "success": true,
  "proposal": { "id": 15, "token": "abc...", "status": "Draft" }
}
```

### GET /api/proposals/view/:token

Public proposal view page (renders HTML).

**Response:** Rendered Handlebars template

### POST /api/proposals/:token/action

Accept or decline a proposal.

**Request:**
```json
{
  "action": "Accepted"
}
```

**Response (200):** `{ "success": true }`

**Business rules:**
- Accepted → lead status = "Proposal Accepted", pipeline_stage = 4
- Declined → lead status = "Lost", pipeline_stage = 6

### POST /api/proposals/send

Send proposal via WhatsApp or Email.

**Request:**
```json
{
  "proposalId": 15,
  "method": "whatsapp"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal sent via WhatsApp"
}
```

**Errors:** 400 Invalid method, 404 Proposal not found

---

## 5. Renewals

### GET /api/renewals

List all renewals.

**Response (200):** Array of renewal objects with policy and lead details

### GET /api/renewals/pipeline

Renewal pipeline grouped by timeframe.

**Response (200):**
```json
{
  "overdue": [],
  "dueWithin30": [],
  "dueWithin60": [],
  "dueWithin90": []
}
```

### GET /api/renewals/check

Manually trigger renewal check (runs daily automatically).

**Response (200):**
```json
{
  "actions": [],
  "count": 0
}
```

### POST /api/renewals/:id/reassess

Trigger a new assessment for renewal.

**Response (200):**
```json
{
  "sessionId": "REN-abc123-def456",
  "assessmentLink": "/assessment/REN-abc123-def456"
}
```

### POST /api/renewals/:id/generate-proposal

Generate a renewal proposal.

**Response (200):**
```json
{
  "renewalId": 3,
  "policyNumber": "POL-001",
  "oldPremium": 250000,
  "newPremium": 275000,
  "scoreChange": 5,
  "proposalNumber": "PROP-ABC789",
  "proposalUrl": "/proposals/PROP-ABC789.pdf"
}
```

### POST /api/renewals/:id/decision

Process advisor decision on renewal.

**Request:**
```json
{
  "decision": "approved"
}
```

**Response (200):**
```json
{
  "decision": "approved",
  "newPolicyNumber": "REN-POL-001-XYZ",
  "newPolicyId": 21
}
```

**Business rules:**
- Approved → creates new policy, updates renewal status
- Declined → logs decision, no new policy

### GET /api/renewals/:id

Get renewal details.

**Response (200):** Full renewal object with policy and lead details

---

## 6. Web (Public)

### GET /:industry

Industry landing page.

**Parameter:** Industry key (school, hospital, manufacturing, church, etc.)

**Response:** Rendered HBS template

**Reserved routes (not rendered as industry pages):**
login, api, webhook, whatsapp, admin, advisor, dashboard, wipe-db-xyz123, quote-request, consultation-request, personal

### GET /start-whatsapp

Redirect to WhatsApp with pre-filled assessment start message.

**Query params:** `text` (default: "START ASSESSMENT")

**Response:** 302 redirect to `https://wa.me/{botNumber}?text={text}`

---

## 7. Leads (CRM)

### GET /api/leads

List leads. Supports filtering by status, industry, and search.

**Auth:** Admin/Sales

### GET /api/leads/:id

Lead detail with activities.

**Auth:** Admin/Sales

### POST /api/leads

Create a new lead.

**Auth:** Admin/Sales

### PUT /api/leads/:id

Update lead (status, notes, assignment, etc.).

**Auth:** Admin/Sales

### POST /api/leads/:id/activity

Log an activity for a lead.

**Request:**
```json
{
  "title": "Phone call completed",
  "description": "Discussed fire insurance options",
  "type": "call"
}
```

---

## 8. Admin

### GET /api/admin/dashboard

Admin dashboard data.

### GET /api/admin/leads

Admin lead list with all fields.

### POST /api/admin/leads/assign

Assign a lead to an advisor.

### POST /api/admin/tasks

Create a task.

### GET /api/admin/tasks?date=2026-07-13

Get tasks for a date (calendar events).

### GET /api/admin/users

List all users.

### POST /api/admin/users

Create a new user (admin only).

---

## 9. Error Response Format

```json
{
  "error": "Error type or message",
  "message": "Human-readable description",
  "details": {} // Optional
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 409 | Conflict (e.g., duplicate) |
| 429 | Rate limited |
| 500 | Internal server error |
