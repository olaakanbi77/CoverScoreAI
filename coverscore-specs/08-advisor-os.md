# Advisor Operating System (Advisor OS)

## 1. Overview

The Advisor OS is the complete toolset that enables insurance advisors to manage leads, generate quotes, create proposals, track activities, and close business — all powered by AI intelligence from the assessment engine.

## 2. Lead Pipeline

### 2.1 Pipeline Stages

```
Stage 1: New Lead         → Assessment not yet completed
Stage 2: Assessment Done  → Report generated, awaiting action
Stage 3: Report Sent      → Report delivered to client
Stage 4: Consultation     → Meeting scheduled or in progress
Stage 5: Proposal Sent    → Quote/Proposal delivered
Stage 6: Won/Lost         → Policy issued or declined
```

### 2.2 Lead Statuses

| Status | Description |
|--------|-------------|
| New Lead | Just created, assessment not started |
| WhatsApp Engaged | Actively chatting with bot |
| Report Sent | Assessment complete, report delivered |
| Qualified | Lead qualifies for advisor follow-up |
| Proposal Sent | Proposal/quote delivered |
| Proposal Accepted | Client agreed to terms |
| Won | Policy issued |
| Lost | Declined or unresponsive |
| Disqualified | Not a viable lead |

### 2.3 Lead Card (UI Component)

```
┌─────────────────────────────────────────────┐
│ [Avatar] Business Name          Score: 78   │
│         Contact Person          High Risk   │
│         Phone: 2348123456789                │
│         Created: 2h ago                     │
│                                             │
│ [Contact] [Send Proposal] [View Report]     │
│ Status: Qualified    Pipeline: Stage 3      │
└─────────────────────────────────────────────┘
```

## 3. Advisor Copilot

The Copilot is an AI-generated briefing available immediately after assessment completion.

### 3.1 Copilot Brief Contents

```json
{
  "clientSummary": "John runs a 15-employee manufacturing facility in Lagos with ₦50M annual revenue. His CoverScore is 42 (Needs Attention).",
  "strengths": ["Documented emergency procedures", "Fire extinguishers in place"],
  "keyRisks": ["No machinery breakdown cover", "No business interruption insurance"],
  "recommendedProducts": ["Machinery Breakdown Insurance", "Business Interruption Insurance"],
  "openingLine": "Hi John, I've reviewed your CoverScore assessment. I can see you're doing well with your emergency procedures, but there are a few areas where your manufacturing operation could be better protected.",
  "suggestedApproach": "Start by acknowledging their safety-conscious approach, then discuss the financial impact of an unplanned machinery breakdown.",
  "estimatedPremium": "₦180,000 - ₦450,000/year",
  "objections": {
    "I already have coverage": "Your assessment shows gaps in machinery breakdown and business interruption cover. Let me show you what's missing."
  }
}
```

### 3.2 Copilot Display (UI)

```
┌─────────────────────────────────────────────┐
│  🤖 Advisor Copilot Brief                   │
├─────────────────────────────────────────────┤
│                                             │
│  Opening Line:                              │
│  "Hi John, I've reviewed your CoverScore    │
│   assessment..."                            │
│                                             │
│  Key Risks:                                 │
│  ⚠ No machinery breakdown cover             │
│  ⚠ No business interruption insurance       │
│                                             │
│  Recommended Products:                       │
│  ✓ Machinery Breakdown Insurance            │
│  ✓ Business Interruption Insurance          │
│                                             │
│  [Copy Opening Line]  [Send WhatsApp]       │
└─────────────────────────────────────────────┘
```

## 4. Quote Builder

### 4.1 Quote Creation Flow

```
1. Select products from recommended list (pre-populated by RIE)
2. Adjust sum assured and premium
3. Add notes or custom terms
4. Preview quote
5. Send to client via WhatsApp or Email
6. Track acceptance/declination
```

### 4.2 Quote Card (UI)

```
┌─────────────────────────────────────────────┐
│  Quote for: John's Manufacturing Ltd        │
├─────────────────────────────────────────────┤
│                                             │
│  Product                 Sum Assured  Premium│
│  ─────────────────────────────────────────  │
│  Machinery Breakdown     ₦20,000,000  ₦200K │
│  Business Interruption   ₦50,000,000  ₦500K │
│  Fire & Special Perils   ₦30,000,000  ₦75K  │
│                                             │
│  Total:                              ₦775K  │
│                                             │
│  [Preview]  [Send to Client]  [Edit]        │
└─────────────────────────────────────────────┘
```

## 5. Proposal Generator

### 5.1 Types of Proposals

| Type | Description | Generation Method |
|------|-------------|-------------------|
| AI Draft | AI-written HTML proposal | Generative AI from assessment + quote |
| PDF | Professional PDF document | HTML → PDF (html-pdf-node) |
| WhatsApp | Text summary sent via WhatsApp | Template-based text message |

### 5.2 Proposal Contents (PDF)

1. **Cover Page** — CoverScore branding, client name, date, proposal number
2. **Executive Summary** — 2-3 sentence overview of client's risk profile
3. **Risk Summary Table** — Pillar name, score, risk level
4. **Recommended Covers** — Product name, description, premium range
5. **Terms & Conditions** — Standard disclaimers and policy terms
6. **Next Steps** — What happens after acceptance
7. **Advisor Signature Block** — Advisor contact details

### 5.3 PDF Generation

```javascript
generateProposal(assessmentData, products, advisorInfo)
  ├── Fill HTML template with {{variables}}
  ├── Build risk table from scored pillars
  ├── Build product cards with premiums
  ├── Calculate total premium range
  ├── Save to public/proposals/{proposalNumber}.html
  ├── Try PDF generation (html-pdf-node)
  └── Return {success, proposalNumber, pdfUrl, htmlUrl}
```

## 6. Task Management

### 6.1 Task Types

| Type | Description | Default Due |
|------|-------------|-------------|
| call | Phone call to lead | 24 hours |
| consultation | Scheduled meeting | 48 hours |
| follow-up | Check-in after proposal | 7 days |
| renewal | Renewal processing | 30 days before expiry |
| reminder | General reminder | As specified |

### 6.2 Auto-Generated Tasks

After assessment completion, the system auto-creates:
1. **Contact Lead** — Due in 2 hours (high opportunity) or 24 hours (standard)
2. **Review Copilot Brief** — Due immediately
3. **Send Proposal** — Due in 7 days (if no response)

## 7. Activity Timeline

Every interaction with a lead is logged chronologically:

```
Today, 2:30 PM ─ Report sent via WhatsApp
Today, 2:15 PM ─ Assessment completed (Score: 42)
Today, 2:00 PM ─ 5th question answered
Today, 1:55 PM ─ Assessment started
Today, 1:50 PM ─ Welcome message sent
Yesterday       ─ Lead created from WhatsApp
```

## 8. Dashboard Metrics

### Advisor Dashboard
```
┌─────────────────────────────────────────────────────┐
│  Welcome, Ayo                     [Notifications 🔔]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 My Performance                    This Month    │
│  ┌──────┬──────┬──────┬──────┐                     │
│  │Leads │Active│Policies│Premium│                    │
│  │  23  │  12  │   4   │₦1.2M  │                    │
│  │ +12% │  +5% │  +20% │ +15%  │                     │
│  └──────┴──────┴──────┴──────┘                     │
│                                                     │
│  🔥 Hot Leads (2)                📋 My Tasks (5)    │
│  ┌─────────────────────┐        ┌────────────────┐  │
│  │ John's MFG [78]     │        │ Call Tunde Mfg  │  │
│  │ Grace's Hosp [85]   │        │ Send proposal   │  │
│  └─────────────────────┘        │ Review Chloe's  │  │
│                                  │ assessment      │  │
│                                  └────────────────┘  │
└─────────────────────────────────────────────────────┘
```
