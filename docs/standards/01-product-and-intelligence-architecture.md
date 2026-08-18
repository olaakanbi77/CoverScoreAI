# CoverScore Product & Intelligence Architecture™

**Version:** v1.0 | **Status:** Canonical | **Owner:** CoverScore Product & Intelligence team

---

## 1. Purpose

This document defines the complete product and intelligence architecture of the CoverScore platform. It describes the seven-layer platform stack, the product ecosystem, the funnel architecture, the intelligence objects the platform produces, and how every component aligns to a single purpose:

> **CoverScore does not sell insurance. CoverScore builds resilience.**

---

## 2. Platform Architecture — Seven Layers

### Layer 1 — Discovery & Acquisition
- Marketing website, social proof, educational content, and coverage education.
- Entry point for the **Business Funnel™** and **Personal Funnel™**.
- No insurance selling language. No fear-based messaging.

### Layer 2 — Engagement & Qualification
- Digital questionnaires and assessment onboarding.
- Qualification rules apply before an assessment is issued.
- Captures entity/contact details without demanding personal data prematurely.

### Layer 3 — Assessment & Intelligence
- The CoverScore™ assessment engine.
- Produces the assessment, the score, the pillars, and the intelligence outputs.
- Fully automated. The advisor never assesses manually.

### Layer 4 — Advisor Enablement
- Produces the **Advisor Brief™** and the **CoverScore Report™**.
- The advisor's responsibility begins here.
- Includes the Advisor Copilot, risk treatment guidance, and next-step management.

### Layer 5 — Advisory Engagement
- The Risk Review conversation (in-person, video, or phone).
- Risk Reduction first, Risk Transfer second, never mixed.
- Produces the agreed Protection Strategy and next actions.

### Layer 6 — Protection & Monitoring
- Quotes, policy issuance, servicing, claims awareness.
- Renewal and annual review intelligence.
- Ongoing monitoring and re-assessment triggers.

### Layer 7 — Intelligence & Growth
- Client lifecycle management.
- Learning engine, continuous improvement, portfolio analytics.
- Feedback into assessment design and advisor development.

---

## 3. Product Ecosystem

### Suite A — Business Intelligence™

| Product | Category | ID |
|---------|----------|----|
| School Resilience™ | Business | `SCH` |
| SME Resilience™ | Business | `SME` |
| Manufacturing Resilience™ | Business | `MFG` |
| Healthcare Resilience™ | Business | `HLT` |
| Faith Organisation Resilience™ | Business | `CHR` |
| Construction Resilience™ | Business | `CON` |
| Hospitality Resilience™ | Business | `HOS` |
| Agribusiness Resilience™ | Business | `AGR` |
| Logistics Resilience™ | Business | `TRN` |
| Retail Resilience™ | Business | `RET` |

### Suite B — Personal Financial Intelligence™

| Product | Category | ID |
|---------|----------|----|
| Income Protection Intelligence™ | Personal | `INC` |
| Retirement Readiness Intelligence™ | Personal | `RET` |
| Family Protection Intelligence™ | Personal | `FAM` |
| Financial Resilience Intelligence™ | Personal | `FIN` |
| Healthcare Readiness Intelligence™ | Personal | `HLT` |
| Young Professionals Intelligence™ | Personal | `YPR` |
| Entrepreneur Protection Intelligence™ | Personal | `ENT` |
| Home & Household Protection Intelligence™ | Personal | `HOM` |
| Motor & Transport Protection Intelligence™ | Personal | `MOT` |

**Naming rule:** `[Subject] + Resilience™` for business products, `[Subject] + Readiness™ / Protection™ / Intelligence™` for personal products. Never invent a product name outside this catalogue.

---

## 4. Funnel Architecture

### Business Funnel™
1. **Discover** — education, content, social proof.
2. **Engage** — coverage conversation, qualification.
3. **Assess** — CoverScore assessment issued.
4. **Advise** — Advisor Brief + Risk Review.
5. **Protect** — agreed treatment plan.
6. **Review** — annual review and renewal.

### Personal Funnel™
1. **Discover**
2. **Engage**
3. **Assess**
4. **Advise**
5. **Protect**
6. **Review**

Both funnels are identical in structure; the difference is audience and product set. Advisors never jump ahead of the funnel — qualification always precedes assessment, and the Advisor Brief always precedes the conversation.

---

## 5. Intelligence Objects

| Object | Definition | Rules |
|--------|-----------|-------|
| CoverScore™ | Single 0–100 score | One per assessment |
| Risk Level™ | Banded label derived from score | See Intelligence Standards |
| Risk Pillars™ | 5–9 component scores | Every assessment has pillars |
| Highest Priority™ | The single most important risk | Exactly one |
| Biggest Insight™ | Narrative insight, 80–150 words | Written by the engine |
| Risk Story™ | Context narrative, 150–300 words | Written by the engine |
| Resilience Forecast™ | Trajectory and what drives it | Engine-generated |
| Improvement Potential™ | Current → potential + points | Engine-generated |
| Recommended First Step™ | Exactly one recommended action | Always stated first |
| Advisor Brief™ | Confidential advisor briefing | 12 mandatory sections |
| Protection Strategy™ | Agreed treatment plan | Produced after Risk Review |

---

## 6. Standard Risk Pillars (Business)

Standard pillar set for business products (varies per product):

1. People & Key Person
2. Property & Assets
3. Business Continuity
4. Liability & Regulatory
5. Financial Resilience
6. Operations & Process
7. Cyber & Data
8. Compliance & Governance
9. Transport & Fleet (where applicable)
10. Environment & Safety

Products define **5–9** pillars from this set. Personal products use a dedicated personal pillar set defined in the Assessment Catalogue.

---

## 7. Intelligence Outputs & the Advisor

- The platform (engine) produces the assessment, the CoverScore, the pillars, the Highest Priority, the Biggest Insight, the Risk Story, the Resilience Forecast, the Improvement Potential, the Recommended First Step, and the Advisor Brief.
- The **advisor's responsibility begins at the Advisor Brief**.
- The advisor interprets, prioritises with the client, recommends, agrees a Protection Strategy, and manages next steps.
- The advisor does **not** manually prospect, qualify, or assess.

---

## 8. AI Components

1. **Conversational Assessment Interface (CAI)** — collects assessment answers in plain language.
2. **Assessment Engine (AE)** — scores and produces intelligence objects.
3. **Risk Intelligence Engine (RIE)** — 14-layer engine (product mapper, opportunity scorer, Advisor Copilot, quote pre-builder, follow-up, learning engine, and more).
4. **Advisor Copilot** — in-conversation guidance for the advisor.
5. **Quote Pre-Builder** — prepares risk-transfer options aligned to the Protection Strategy.
6. **Follow-up Engine** — next-step management and reminders.
7. **Learning Engine** — improves the system with every completed review.

---

## 9. Client Lifecycle

1. Prospect
2. Qualified
3. Assessed
4. Advised
5. Protected
6. Serviced
7. Reviewed
8. Advocated (referral source)

Each stage has defined entry and exit criteria. Advisors manage the lifecycle through the CRM.

---

## 10. Core Data Objects

- **Entity** (organisation or individual)
- **Contact** (person)
- **Assessment** (one per entity per product, versioned)
- **Pillar scores**
- **Intelligence outputs** (score, level, priority, insights, story, forecast, potential, first step)
- **Advisor Brief**
- **CoverScore Report**
- **Protection Strategy**
- **Risk Treatment items**
- **Conversation/meeting records**
- **CRM events and tasks**
- **Referrals**

---

## 11. Certification Alignment

| Training | Alignment |
|----------|-----------|
| CCA 105 | Practical Risk Advisory & Client Assessment — driven by the Simulation & Assessment Framework |
| CCA 106 | Risk Reviews — Advanced practice in the Risk Review conversation |
| CCA 107 | Portfolio Management — Multi-client judgement, prioritisation, governance |
| CCA 108 | Integrated Professional Practice — Final integrated advisory simulation and certification |

---

## 12. Future Roadmap

- Additional business verticals (Hospitality, Agribusiness, Logistics, Retail already catalogued).
- Additional personal products (Home, Motor).
- Multi-assessor mode for the simulation platform.
- Portfolio analytics and benchmark reporting.
- Regional and multi-currency support.
- AI roleplay with adaptive personality levels (see Simulation Framework).

---

*Canonical. Approved for use across training, prompts, and advisor operations.*
