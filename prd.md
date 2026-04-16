# CoverScore AI - Product Requirements Document

## 1. Overview

**Product Name:** CoverScore AI
**Product Type:** Insurance Risk Intelligence Platform
**Version:** 1.0
**Last Updated:** 2026-03-20

### 1.1 Executive Summary

CoverScore AI is a web-based insurtech platform that enables businesses and individuals to assess their risk exposure through a multi-step guided assessment. The platform delivers AI-powered risk analysis and insurance recommendations, while providing insurance agents and administrators a comprehensive lead management dashboard to track and convert high-risk prospects into clients.

### 1.2 Problem Statement

Insurance buyers often lack visibility into their true risk exposure, making it difficult to:
- Understand which insurance products they actually need
- Justify insurance expenses to stakeholders
- Identify gaps in their current coverage

Insurance agents struggle to:
- Qualify leads efficiently
- Personalize pitches without lengthy consultations
- Focus on high-value prospects

### 1.3 Solution

CoverScore AI provides:
- A guided self-service risk assessment (5-10 minutes)
- Instant risk scoring with AI-generated insights
- Professional reports users can share with stakeholders
- A lead management dashboard for agents

---

## 2. Goals & Success Metrics

### 2.1 Business Goals

| Goal | Metric |
|------|--------|
| Generate qualified leads | Lead submission rate > 15% of assessments |
| Increase conversion | Lead → Client conversion > 10% |
| Reduce agent qualification time | < 5 min per lead review |
| Improve user engagement | Assessment completion rate > 60% |

### 2.2 Product Goals

- Deliver risk assessment in under 10 minutes
- Provide actionable insurance recommendations
- Generate reports that build trust and credibility
- Enable agents to prioritize high-risk (high-value) leads

### 2.3 Success Metrics

| Metric | Target |
|--------|--------|
| Assessment completion rate | > 60% |
| Average assessment time | < 10 minutes |
| Lead capture rate | > 85% of completed assessments |
| Email open rate | > 40% |
| Lead-to-quote conversion | > 15% |
| User satisfaction (NPS) | > 30 |

---

## 3. User Personas

### 3.1 Primary Users

#### Sarah - Small Business Owner
- **Age:** 35
- **Business:** Retail store, 15 employees, $1.2M revenue
- **Pain Points:** Unsure if she has adequate coverage, finds insurance jargon confusing
- **Goals:** Quick assessment, clear recommendations, affordable options
- **Device:** Mobile-first

#### Michael - Insurance Sales Agent
- **Age:** 42
- **Role:** Commercial lines agent at mid-size agency
- **Pain Points:** Too many unqualified leads, manual follow-up process
- **Goals:** Prioritize high-risk leads, save time on initial qualification
- **Device:** Desktop

#### David - Agency Administrator
- **Age:** 48
- **Role:** Branch manager overseeing 8 agents
- **Pain Points:** No visibility into team performance, inconsistent lead handling
- **Goals:** Dashboard oversight, performance metrics, compliance
- **Device:** Desktop

### 3.2 User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **User** | Complete assessments, view own reports, receive emails |
| **Sales Agent** | View assigned leads, update status, add notes, request quotes |
| **Analyst** | View all leads, export data, view analytics |
| **Admin** | Full access, user management, role assignment |

---

## 4. User Stories

### 4.1 Assessment Users

```
As a business owner,
I want to complete a risk assessment in under 10 minutes,
So I can understand my insurance needs without a lengthy consultation.

As a business owner,
I want to receive a clear risk score and report,
So I can discuss coverage with my team or insurance agent.

As a business owner,
I want to get personalized recommendations,
So I know which insurance products to prioritize.

As a business owner,
I want to receive my report via email,
So I can share it with stakeholders and reference it later.
```

### 4.2 Sales Agents

```
As a sales agent,
I want to see all my leads ranked by risk level,
So I can prioritize my follow-up efforts.

As a sales agent,
I want to view the full assessment report for each lead,
So I can prepare for consultations with context.

As a sales agent,
I want to update lead status and add notes,
So I can track my progress through the pipeline.

As a sales agent,
I want to see the estimated insurance cost range,
So I can set appropriate expectations with leads.
```

### 4.3 Administrators

```
As an admin,
I want to manage user roles and permissions,
So I can control access to sensitive data.

As an admin,
I want to view aggregate analytics,
So I can report on team performance.

As an admin,
I want to filter leads by multiple criteria,
So I can identify patterns and coaching opportunities.
```

---

## 5. Feature Requirements

### 5.1 Authentication & User Management

| Feature | Description | Priority |
|---------|-------------|----------|
| User Registration | Email/password registration with validation | Must Have |
| User Login | JWT-based authentication with access/refresh tokens | Must Have |
| Password Reset | Email-based password reset flow | Must Have |
| Session Management | Secure logout, token invalidation | Must Have |
| Profile Management | Update name, phone, business info, industry | Should Have |

### 5.2 Risk Assessment Engine

| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-Step Wizard | 5-section assessment with progress saving | Must Have |
| Business Info Section | Industry, employees, revenue, location type | Must Have |
| Assets Section | Equipment, value, fire protection, loss history | Must Have |
| Liability Section | Customer interaction, professional services, client loss risk | Must Have |
| Staff Section | Employee count, risk exposure, benefits | Must Have |
| Insurance Section | Existing coverage, types, last review date | Must Have |
| Progress Persistence | Save partial progress, resume later | Should Have |

### 5.3 Scoring & Analysis

| Feature | Description | Priority |
|---------|-------------|----------|
| Weighted Scoring | Calculate risk score based on answers | Must Have |
| Risk Level Classification | Categorize as Low/Moderate/High/Critical | Must Have |
| Industry Intelligence | Map industry to relevant risk categories | Must Have |
| AI Report Generation | OpenAI-powered detailed analysis | Must Have |
| Report Storage | Persist AI report with assessment | Must Have |

### 5.4 Lead Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Lead Capture | Auto-create lead from assessment | Must Have |
| Lead List View | Paginated list with search and filters | Must Have |
| Lead Detail View | Full assessment report and history | Must Have |
| Status Management | Track New → Contacted → Converted | Must Have |
| Lead Notes | Agent notes attached to each lead | Must Have |
| Lead Deletion | Remove leads (admin only) | Should Have |

### 5.5 Admin Dashboard

| Feature | Description | Priority |
|---------|-------------|----------|
| Dashboard Overview | Total assessments, high-risk leads, conversion rate | Must Have |
| Recent Submissions | Latest 10 assessments with quick actions | Must Have |
| User Management | View users, assign roles | Must Have |
| Risk Distribution | Chart showing risk level breakdown | Should Have |
| Lead Export | CSV export of leads | Should Have |

### 5.6 Email System

| Feature | Description | Priority |
|---------|-------------|----------|
| Assessment Complete Email | Send report summary with CTA | Must Have |
| Password Reset Email | Secure reset link | Must Have |
| Email Templates | Professional HTML templates | Must Have |

### 5.7 Analytics

| Feature | Description | Priority |
|---------|-------------|----------|
| Overview Metrics | Total assessments, conversion rate | Must Have |
| Risk Distribution | Breakdown by risk level | Should Have |
| Trend Charts | Risk trends over time | Should Have |
| Industry Breakdown | Assessment distribution by industry | Should Have |

---

## 6. User Flows

### 6.1 Assessment Flow

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │ Click "Start Assessment"
       ▼
┌─────────────────────┐
│   Auth Check       │──── No ────┐
│ (is logged in?)    │            │
└────────┬───────────┘            │
         │ Yes                    ▼
         ▼                 ┌─────────────┐
┌─────────────────┐        │   Login /   │
│   Step 1:       │        │   Register │
│   Business Info │        └──────┬──────┘
└────────┬────────┘               │ Success
         │                        ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Step 1:       │
│   Step 2:       │        │   Business Info │
│   Assets        │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Step 2:       │
│   Step 3:       │        │   Assets        │
│   Liability     │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Step 3:       │
│   Step 4:       │        │   Liability     │
│   Staff         │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Step 4:       │
│   Step 5:       │        │   Staff         │
│   Insurance     │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Step 5:       │
│   Calculate     │        │   Insurance    │
│   Risk Score    │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Calculate     │
│   Generate AI   │◄───────│   Risk Score   │
│   Report        │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Generate AI  │
│   Send Email    │◄───────│   Report       │
│   with Report   │        └────────┬────────┘
└────────┬────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Send Email   │
│   Show Results   │◄───────│   with Report  │
│   Page          │        └────────┬────────┘
└─────────────────┘                 │
         │                          ▼
         ▼                 ┌─────────────────┐
┌─────────────────┐        │   Show Results │
│   Create Lead   │◄───────│   Page        │
│   (status: new) │        └─────────────────┘
└─────────────────┘
```

### 6.2 Lead Management Flow

```
┌─────────────────┐
│   Agent Login   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Lead List     │◄──────────────────────┐
│   Dashboard     │                       │
└────────┬────────┘                       │
         │                                │
    ┌────┴────┐                           │
    │ Filter  │                           │
    │ Search  │                           │
    └────┬────┘                           │
         │                                │
         ▼                                │
┌─────────────────┐                       │
│   Select Lead   │───────────────────┐   │
└────────┬────────┘                   │   │
         │                            │   │
         ▼                            │   │
┌─────────────────┐                    │   │
│   Lead Detail   │                    │   │
│   View Report   │                    │   │
│   Add Notes     │                    │   │
│   Update Status │────────────────────┘   │
└─────────────────┘
```

---

## 7. UI/UX Requirements

### 7.1 Design Principles

1. **Premium & Professional** - Convey trust and expertise appropriate for financial decisions
2. **Mobile-First** - Primary access via mobile devices; responsive to all screen sizes
3. **Accessible** - WCAG 2.1 AA compliance, keyboard navigation, screen reader support
4. **Clear Progress** - Users always know where they are and what's next
5. **Instant Feedback** - Validation and guidance in real-time

### 7.2 Layout Structure

#### Public Pages
- Landing page with value proposition and CTA
- Login / Register pages
- Assessment wizard (full-screen, distraction-free)
- Result page with report

#### Authenticated User Pages
- User dashboard (recent assessments, quick actions)
- Assessment history
- Profile settings

#### Agent/Admin Pages
- Lead management table with filters
- Lead detail view
- Admin dashboard with metrics
- User management

### 7.3 Component Specifications

#### Navigation
- Sticky header with logo, nav links, user menu
- Mobile: hamburger menu with slide-out drawer
- Dark/Light mode toggle in user menu

#### Cards
- Rounded corners: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px
- Hover: slight elevation increase

#### Buttons
- Primary: filled, rounded, 44px min height (touch target)
- Secondary: outlined or ghost
- Destructive: red for delete actions
- Loading state: spinner icon

#### Forms
- Floating labels or top-aligned labels
- Inline validation messages
- Clear error states (red border, icon)
- Success states (green checkmark)

#### Progress Indicator
- Horizontal stepper for assessment wizard
- Step numbers with connecting lines
- Completed steps: filled primary color
- Current step: outlined primary color with pulse
- Future steps: gray

#### Risk Gauge
- Semi-circular gauge visualization
- Needle animation on score reveal
- Color gradient from green (low) to red (critical)
- Score number prominently displayed in center

#### Lead Table
- Div-based grid layout (not HTML table)
- Sortable columns with indicators
- Row hover state
- Action buttons per row
- Empty state with illustration and message

### 7.4 Color System

#### Light Mode
| Role | Color | Usage |
|------|-------|-------|
| Background | #F8FAFC | Page background |
| Surface | #FFFFFF | Cards, modals |
| Primary | #3B82F6 | Buttons, links, accents |
| Primary Hover | #2563EB | Button hover states |
| Success | #22C55E | Positive actions, Low risk |
| Warning | #F59E0B | Caution states, Moderate risk |
| Danger | #EF4444 | Errors, Critical risk, destructive actions |
| Text Primary | #1E293B | Headings, body text |
| Text Secondary | #64748B | Captions, labels |
| Border | #E2E8F0 | Dividers, input borders |

#### Dark Mode
| Role | Color | Usage |
|------|-------|-------|
| Background | #0F172A | Page background |
| Surface | #1E293B | Cards, modals |
| Primary | #60A5FA | Buttons, links, accents |
| Primary Hover | #3B82F6 | Button hover states |
| Success | #4ADE80 | Positive actions, Low risk |
| Warning | #FBBF24 | Caution states, Moderate risk |
| Danger | #F87171 | Errors, Critical risk |
| Text Primary | #F1F5F9 | Headings, body text |
| Text Secondary | #94A3B8 | Captions, labels |
| Border | #334155 | Dividers, input borders |

### 7.5 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 32px / 2rem | 700 |
| H2 | Inter | 24px / 1.5rem | 600 |
| H3 | Inter | 20px / 1.25rem | 600 |
| Body | Inter | 16px / 1rem | 400 |
| Small | Inter | 14px / 0.875rem | 400 |
| Caption | Inter | 12px / 0.75rem | 500 |
| Monospace | JetBrains Mono | 16px / 1rem | 500 |

### 7.6 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing, icon gaps |
| sm | 8px | Compact elements |
| md | 16px | Standard padding |
| lg | 24px | Section spacing |
| xl | 32px | Major sections |
| 2xl | 48px | Page sections |

### 7.7 Animations & Transitions

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | Fade | 200ms |
| Card hover | Transform + shadow | 150ms ease-out |
| Button press | Scale down to 0.98 | 100ms |
| Progress step | Slide + fade | 300ms ease-out |
| Score reveal | Count up + gauge needle | 800ms ease-out |
| Modal open | Fade + scale from 0.95 | 200ms |
| Toast notifications | Slide in from right | 250ms |

---

## 8. Technical Requirements

### 8.1 Technology Stack

See Design Document Section 2.1

### 8.2 API Requirements

- RESTful API design
- JSON request/response format
- JWT Bearer token authentication
- Standard HTTP status codes
- Consistent error response format: `{ error: string, message: string }`
- Pagination: `?page=1&limit=20`
- All timestamps in ISO 8601 format

### 8.3 Data Handling

- Input validation on all endpoints
- SQL parameterized queries (no string concatenation)
- XSS protection via Handlebars auto-escaping
- File uploads: not required for v1
- Data retention: indefinitely (no auto-delete)

### 8.4 Performance

| Metric | Target |
|--------|--------|
| Page load (LCP) | < 2.5s |
| Time to first byte | < 200ms |
| API response (p95) | < 500ms |
| Assessment submission to result | < 5s |

---

## 9. Non-Functional Requirements

### 9.1 Security

- TLS 1.2+ for all connections
- JWT access token expiry: 15 minutes
- JWT refresh token expiry: 7 days
- BCrypt cost factor: 12
- Rate limiting: 100 req/min per IP
- CORS configured for production domain only
- Security headers (CSP, X-Frame-Options, etc.)

### 9.2 Reliability

- Database WAL mode for concurrent reads
- Transactions for multi-step operations
- Graceful shutdown handling
- Error logging to file (not stdout)
- Health check endpoint: `/health`

### 9.3 Scalability

- Stateless API design (horizontal scaling ready)
- Database connection pooling
- Ready for container orchestration

### 9.4 Maintainability

- Environment-based configuration (no hardcoded values)
- Modular code structure
- Comprehensive error messages in logs
- Comment key logic

---

## 10. Out of Scope (v1)

- Payment processing / billing
- Policy management / policy documents
- Claims processing
- Multi-tenancy (org-level isolation)
- API for third-party integrations
- Mobile native apps
- Real-time chat support
- Document upload (photos of premises, etc.)
- Insurance carrier rate integration
- Agent commission tracking
- Workflow automation
- White-labeling

---

## 11. Success Criteria

### 11.1 Launch Criteria

- [ ] All "Must Have" features implemented
- [ ] No critical security vulnerabilities
- [ ] Admin can create users and assign roles
- [ ] Assessment flow completes end-to-end
- [ ] Email delivery confirmed
- [ ] Docker deployment verified
- [ ] Documentation complete

### 11.2 Post-Launch Metrics (30 days)

- [ ] > 100 assessments completed
- [ ] Assessment completion rate > 60%
- [ ] No security incidents
- [ ] < 1% error rate on assessment submissions

---

## 12. Glossary

| Term | Definition |
|------|------------|
| Risk Score | Numerical value (0+) representing overall risk exposure |
| Risk Level | Categorical classification (Low/Moderate/High/Critical) |
| Lead | A captured assessment with contact information |
| Conversion | Lead status change from "Contacted" to "Converted" |
| AI Report | OpenAI-generated analysis and recommendations |
| RBAC | Role-Based Access Control |

---

## 13. Appendix

### 13.1 Industry Risk Mapping

| Industry | Primary Risks | Secondary Risks |
|----------|---------------|-----------------|
| Retail | Fire, Theft, Liability | Product Liability, Equipment |
| Construction | Injury, Equipment, Liability | Vehicle, Environmental |
| Technology | Cyber, Professional Liability | Business Interruption |
| Healthcare | Malpractice | Professional Liability, Cyber |
| Manufacturing | Equipment, Liability, Fire | Environmental, Product Liability |
| Hospitality | Liability, Fire | Food Liability, Entertainment |
| Professional Services | Professional Liability | Cyber, E&O |
| Real Estate | Liability, Property | Environmental, Workers Comp |

### 13.2 Risk Scoring Rules Reference

| Category | Factor | Risk Level | Points |
|----------|--------|------------|--------|
| Insurance | No existing insurance | High | +5 |
| Insurance | Last review > 2 years ago | Medium | +3 |
| Insurance | Last review < 1 year ago | Low | +1 |
| Assets | High value (>$500K) | High | +5 |
| Assets | Medium value ($100K-$500K) | Medium | +3 |
| Assets | Basic equipment | Low | +1 |
| Assets | No fire protection | High | +5 |
| Assets | Partial fire protection | Medium | +3 |
| Assets | Full fire protection | Low | +1 |
| Liability | Customers visit premises | High | +5 |
| Liability | Professional services | High | +5 |
| Liability | Remote services only | Low | +1 |
| Staff | No workers comp | High | +4 |
| Staff | Optional coverage | Medium | +2 |
| Staff | Full coverage | Low | +1 |
| Business | High revenue (>$5M) | Medium | +3 |
| Business | Many employees (>50) | Medium | +3 |
