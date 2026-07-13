# Business Rules Specification

## 1. Assessment Rules

### 1.1 Question Flow

```
User sends message
       │
       ▼
Match question bank by currentState + prefix
       │
       ▼
Apply answer validation:
  ├── Must match expected format
  ├── Must be in allowed options (for multiple choice)
  └── Help text shown on invalid input
       │
       ▼
Store answer in assessmentData.answers[questionId]
       │
       ▼
Advance to nextState (determined by CCIE)
       │
       ▼
If nextState is COMPLETE → trigger scoring
```

### 1.2 Scoring Rules

```
Score = 100 - (sum of risk weights / max possible risk) × 100

Where:
  - Risk weight = question.weight × answer_risk_value
  - answer_risk_value = 0 (safe) to 1 (maximum risk)
  - Null answers (no evidence) are EXCLUDED — they don't lower the score
```

### 1.3 CSNS Classification

```
IF score >= 90 → "Excellent"
IF score >= 80 → "Strong"
IF score >= 60 → "Developing"
IF score >= 40 → "Needs Attention"
IF score >= 20 → "High Risk"
ELSE           → "Critical"
```

### 1.4 Empty Pillar Handling

```
IF pillar has zero answered questions (all null):
  → pillar_score = null
  → pillar is EXCLUDED from score calculation
  → pillar is NOT shown in the report
```

### 1.5 whyTexts Fallback Chain

```
For the weakest (lowest-scored) pillar:
  1. Check whyChecks on the pillar definition
     → Evaluate each answer check in order
     → Return FIRST matching text
  2. Fall back to whyTexts[weakKey]
  3. Fall back to recommendationTexts[weakKey]
     → Strip leading gerund (e.g., "ensuring", "securing")
  4. Fall back to generic: "this area presents the greatest opportunity..."
```

### 1.6 firstStepTexts Priority

```
For the recommended first step:
  1. Check firstStepTexts[weakArea]
  2. Fall back to recommendationTexts[weakArea]
  3. Fall back to generic: "reviewing your {weakArea}..."
```

## 2. Report Section Order

The report is delivered in EXACTLY this order:

```
Message 1 (msg1): 
  1. Completion notification
  2. CoverScore Score (0-100)
  3. Resilience Level (CSNS label)
  4. Highest Priority Pillar + Why

Message 2 (msg2):
  5. Risk Pillar Chart (sorted high→low)
  6. CoverScore Insight™

Message 3a (msg3a):
  7. What You're Doing Well™
  8. Your Risk Story™
  9. If Nothing Changes™

Message 3b (msg3b):
  10. Resilience Forecast™
  11. Improvement Potential™
  12. Recommended First Step
  13. Report Link

Message 4:
  14. Advisor CTA
```

## 3. WhatsApp Constraints

### 3.1 Character Limit

Each WhatsApp message is limited to ~4096 characters. The report is split at specific boundaries:

```
msg1 (Score + Summary):         ~500 chars
msg2 (Pillars + Insight):       ~1000 chars
msg3a (Strengths + Story + INC): ~2000 chars  ← split here
msg3b (Forecast + First Step):   ~1500 chars
msg4 (Advisor CTA):              ~200 chars
```

### 3.2 Message Timing

Messages are sent with delays to simulate natural conversation:

```
msg1 → 12 second delay (scoring time)
msg2 →  3 second delay
msg3a → 3 second delay
msg3b → 3 second delay
msg4 →  3 second delay
```

## 4. Advisor Rules

### 4.1 Lead Assignment

```
IF assessment completed AND advisor requested:
  → Lead status = "Qualified"
  → Pipeline stage = 3
  → Notify admin (if admin phone configured)
  → (Future: auto-assign to least-loaded advisor)
```

### 4.2 High-Opportunity Lead

```
IF opportunity_score >= 70 (from RIE):
  → Priority flag = "Hot"
  → Advisor should contact within 2 hours
  → Copilot brief includes priority indicators
```

### 4.3 Lead Qualification

After scoring, the AI lead qualifier runs to determine:

```
qualifierOutput = {
  lead_status: "Hot Qualified" | "Qualified" | "Nurture" | "Disqualified",
  qualification_reasoning: "string",
  next_best_action: "string"
}
```

Rules:
- `Hot Qualified` → Notify admin immediately, pipeline stage 4
- `Qualified` → Standard follow-up, pipeline stage 3
- `Nurture` → Auto-nurture sequence (email drip), pipeline stage 2
- `Disqualified` → Mark as Lost, no follow-up

## 5. Premium Estimation Rules

### 5.1 Premium Rate Table

| Product Type | Rate (annual) |
|-------------|---------------|
| All Risks Insurance | 1.0% |
| Aviation Insurance | 1.0% |
| Bond Insurance | 1.0% |
| Burglary Insurance | 1.0% |
| Business Interruption Insurance | 1.5% |
| Comprehensive Motor Insurance | 5.0% |
| Cyber Liability Insurance | 2.0% |
| Directors & Officers Liability | 1.5% |
| Engineering Insurance | 1.0% |
| Fidelity Guarantee Insurance | 1.0% |
| Fire & Special Perils Insurance | 0.25% |
| Goods in Transit Insurance | 1.0% |
| Group Life & Workmen Compensation | 1.0% |
| Health Insurance / HMO | 5.0% |
| Home/Property Insurance | 0.25% |
| Life Insurance | 2.0% (monthly) |
| Marine Insurance | 1.0% |
| Plant & All Risk Insurance | 1.0% |
| Professional Indemnity Insurance | 1.5% |
| Public Liability Insurance | 0.5% |
| Travel Insurance | 1.0% |

### 5.2 Premium Calculation

```
totalPremium = Σ(product_rates × min_loss)

Where:
  - Life Insurance premium is calculated monthly (× rate / 12)
  - All other products calculated annually
  - min_loss comes from scoring engine exposure calculation
  - If no recommendations: totalPremium = min_loss × 0.013
```

## 6. Renewal Rules

### 6.1 Timing

```
90 days before expiry → Create renewal record (pending)
30 days before expiry → Send reminder to client
 7 days before expiry → Escalate to advisor (if still pending)
After expiry          → Mark as overdue, escalate
```

### 6.2 Premium Adjustment

```
newPremium = currentPremium × (1 - (scoreChange / 100) × 0.3)

Where:
  - scoreChange = newScore - oldScore
  - newPremium is clamped between 70% and 130% of currentPremium
  - If no reassessment: newPremium = currentPremium × 1.1 (default 10% increase)
```

### 6.3 Renewal Decisions

```
IF advisor approves:
  → Create new policy record
  → Set new expiry = 365 days from now
  → Update renewal status = "approved"
  → Log activity

IF advisor declines:
  → Update renewal status = "declined"
  → Log activity
  → No new policy created
```

## 7. RIE Opportunity Scoring

### 7.1 Score Components

```
opportunityScore = (
  needUrgency × 0.35 +
  financialCapacity × 0.25 +
  decisionAuthority × 0.20 +
  engagementLevel × 0.20
) × 100

Where each component is 0.0 to 1.0
```

### 7.2 Priority Tiers

| Score Range | Priority | Advisor Action |
|-------------|----------|----------------|
| 80-100 | Critical | Contact within 1 hour |
| 60-79 | High | Contact within 4 hours |
| 40-59 | Medium | Contact within 24 hours |
| 20-39 | Low | Add to nurture sequence |
| 0-19 | Cold | No action required |

## 8. Cross-Sell Rules

```
WHEN policy is issued:
  → Load client's industry/preferences
  → Compare existing products with recommended list
  → Find gaps (products NOT yet purchased)
  → Score each gap by relevance
  → Queue top 2 for advisor review
  → (Future: auto-send cross-sell message)
```

## 9. Follow-Up Rules

```
AFTER assessment completed WITHOUT advisor request:
  → Day 1: Send "Your report is ready" reminder
  → Day 3: Send "Did you review your report?" follow-up
  → Day 7: Send "Any questions about your report?"
  → Day 14: Send "Last chance for free advisor review"
  → Day 30: Mark as cold, move to nurture

IF client responds at any point:
  → Reset sequence
  → Route to advisor
```

## 10. Engagement Points

```
Each action awards points:
  Start assessment:         10 pts
  Complete assessment:      20 pts
  Request advisor:          30 pts
  View report:              10 pts
  Accept proposal:          50 pts
  Purchase policy:          100 pts
  Complete renewal:          50 pts
  Refer a friend:            40 pts

Point thresholds:
  100 pts → Bronze (basic support)
  250 pts → Silver (priority support)
  500 pts → Gold (dedicated advisor)
```
