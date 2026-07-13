# Product Requirements Document (PRD)

## 1. Product Overview

CoverScore is an AI-powered risk assessment and insurance recommendation platform that operates primarily through WhatsApp. It guides users through a conversational assessment, generates a personalised risk report, and connects them with certified advisors who convert insights into protection.

### 1.1 Product Name
**CoverScore™** — The Intelligence Behind Protection™

### 1.2 Product Tiers
- **CoverScore Free** — Risk assessment + digital report + advisor matching
- **CoverScore Pro** (future) — Multi-entity assessments, portfolio view, priority advisor
- **CoverScore Enterprise** (future) — API access, white-label, team dashboard

## 2. User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **End User** | Completes assessments via WhatsApp | Read own report, request advisor |
| **Advisor / Sales Agent** | Views assigned leads, manages pipeline, sends quotes | CRUD own leads, generate proposals |
| **Admin** | Full system access, user management, analytics | All |
| **Analyst** | Views analytics and reports | Read-only analytics |
| **Super Admin** | System configuration, billing, team management | All + settings |

## 3. Features

### 3.1 WhatsApp Assessment Engine
- Conversational flow with branching questions
- Multi-language support (English + Nigerian Pidgin)
- Typing indicators and media messages
- Session persistence across disconnections

### 3.2 Risk Scoring & Reporting
- 5-pillar scoring (varies by industry)
- CSNS 6-tier risk classification
- Personalised Risk Story™
- CoverScore Insight™
- What You're Doing Well™
- If Nothing Changes™
- Resilience Forecast™
- Improvement Potential™

### 3.3 Advisor Operating System (Advisor OS)
- Lead pipeline management
- AI-generated Copilot Brief
- Task automation and reminders
- Quote builder
- Proposal generator (AI + PDF)
- Cross-sell recommendations
- Activity timeline

### 3.4 Risk Intelligence Engine (RIE)
- Product mapping (Layer 9)
- Opportunity scoring (Layer 10)
- Advisor copilot brief (Layer 11)
- Quote pre-building (Layer 12)
- Follow-up engine (Layer 13)
- Learning engine (Layer 14)

### 3.5 Admin Dashboard
- Real-time analytics
- Funnel performance
- Advisor leaderboard
- Pipeline management
- System health monitoring

### 3.6 Renewal Engine
- 90-day renewal lifecycle
- Automated reassessment triggers
- Renewal proposal generation
- Multi-channel reminders
- Decision processing

## 4. Business Rules

### 4.1 Assessment Philosophy

Every assessment must be:
- **Short** — 10-15 questions, <8 minutes
- **Personalised** — Every question adapts based on previous answers
- **Conversational** — Natural language, not form-filling
- **Validated** — Questions have built-in validation and help text
- **Scored instantly** — No waiting for report generation

### 4.2 CoverScore Methodology

The CoverScore is a 0-100 composite risk score computed as:

```
CoverScore = Σ(weight × pillar_score) / Σ(weight)
```

Where each **pillar_score** (0-100) is derived from:
- Answer weights mapped to risk impact
- Configurable per-industry pillar weights
- Null pillars excluded (no evidence = no score impact)

### 4.3 CSNS Risk Tiers

| Score Range | Tier | Label | Colour |
|-------------|------|-------|--------|
| 0-19 | 1 | Critical Risk | Red |
| 20-39 | 2 | High Risk | Orange |
| 40-59 | 3 | Needs Attention | Amber |
| 60-79 | 4 | Developing | Yellow |
| 80-89 | 5 | Strong | Light Green |
| 90-100 | 6 | Excellent | Dark Green |

### 4.4 Report Section Order (User-Tested)

1. Score + Summary
2. Risk Pillar Chart
3. CoverScore Insight™
4. What You're Doing Well™
5. Your Risk Story™
6. If Nothing Changes™
7. Resilience Forecast™
8. Improvement Potential™
9. Recommended First Step
10. Report Link
11. Advisor CTA

### 4.5 WhatsApp Message Limits

- WhatsApp soft limit: ~4096 characters per message
- msg3 is split at the Forecast boundary:
  - **msg3a**: What You're Doing Well + Risk Story + If Nothing Changes
  - **msg3b**: Forecast + Improvement Potential + First Step + Report

## 5. Navigation (Web)
```
Landing → /:industry → start-whatsapp
                            ↓
                   WhatsApp Assessment
                            ↓
                   /assessment/result/:id (read-only)
                            ↓
                   Advisor Dashboard
                   ├── /advisor/dashboard (overview)
                   ├── /advisor/leads (list + kanban)
                   ├── /advisor/leads/:id (detail)
                   ├── /advisor/leads/:id/assessment
                   ├── /admin/proposals
                   ├── /admin/policies
                   └── /admin/opportunities (pipeline view)
```

## 6. User Journeys

### 6.1 First-Time User
1. User visits coverscore.site (or industry landing page)
2. Clicks "Start Assessment" → WhatsApp deep link
3. Bot sends welcome message + first question
4. User answers 10-15 questions conversationally
5. Score computed → report generated
6. Report sections delivered via WhatsApp (4-6 messages)
7. CTA: "Would you like a Certified Risk Advisor to review?"
8. If Yes → lead assigned → advisor follows up

### 6.2 Advisor Engagement
1. Advisor receives notification of new qualified lead
2. Opens Copilot Brief (AI-generated summary + opening line)
3. Contacts lead via WhatsApp
4. Assesses needs → builds quote in Quote Builder
5. Sends PDF proposal via WhatsApp
6. Client accepts → policy issued → renewal scheduled

### 6.3 Renewal
1. 90 days before expiry: system creates renewal record
2. 30 days before expiry: automated reminder sent
3. 7 days before expiry: advisor notified of urgent renewal
4. Option: reassessment triggered or auto-renew with adjustments
5. Client approves → new policy issued

## 7. Success Metrics

| KPI | Definition | Target |
|-----|-----------|--------|
| Assessment Start Rate | % of landing visitors who start | >30% |
| Completion Rate | % of started assessments completed | >75% |
| Advisor Request Rate | % of completed assessments requesting advisor | >40% |
| Time-to-First-Contact | Assessment completion to advisor first message | <2 hours |
| Quote-to-Policy | % of quotes that become policies | >35% |
| NPS | User satisfaction score | >60 |
| Renewal Rate | % of policies renewed at expiry | >80% |
| Avg Premium per Policy | Mean annual premium | ₦200,000+ |
