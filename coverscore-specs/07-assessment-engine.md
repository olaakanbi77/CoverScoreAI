# Assessment Engine

## 1. Overview

The CoverScore Assessment Engine is a conversational risk assessment system operating over WhatsApp. It uses the CCIE (CoverScore Conversational Intelligence Engine) to manage question flow, answer validation, state persistence, and scoring.

## 2. Prefix System

Each industry/use case has a unique prefix used for question IDs, state management, and domain configuration:

| Prefix | Industry | Assessment Title |
|--------|----------|-----------------|
| SME | Small Business | SME Risk Score™ |
| HOS | Healthcare/Hospital | Hospital Risk Score™ |
| MFG | Manufacturing | Manufacturing Risk Score™ |
| SCH | School | School Risk Score™ |
| CHR | Church | Church Risk Score™ |
| CON | Construction | Construction Risk Score™ |
| TRN | Transport/Logistics | Transport Risk Score™ |
| INC | Income Protection | Income Protection Score™ |
| HLT | Health Protection | Health Protection Score™ |
| FAM | Family Protection | Family Protection Score™ |
| YPR | Young Professional | Young Professional Score™ |
| RET | Retirement | Retirement Readiness Score™ |
| ENT | Entrepreneur | Entrepreneur Score™ |
| HOM | Home Protection | Home Protection Score™ |
| MOT | Motor Protection | Motor Protection Score™ |

## 3. Question Bank Structure

Questions are stored in `data/question_bank.json`:

```json
{
  "id": "SME_011",
  "question": "Does your business have consistent monthly revenue?",
  "answer_type": "yes_no",
  "options": ["Yes", "No"],
  "next": "SME_012",
  "weight": 10,
  "data_mapping": "revenue_stability",
  "risk_value": { "Yes": 0, "No": 100 }
}
```

### Question Types

| Type | Description | Example |
|------|-------------|---------|
| `yes_no` | Two-option binary | "Yes" / "No" |
| `yes_no_notsure` | Three-option | "Yes" / "No" / "Not sure" |
| `yes_no_na` | Three-option with N/A | "Yes" / "No" / "N/A" |
| `multiple_choice` | Custom options | "Under 50" / "50-200" / "201+ |
| `input` | Free text | Name, email address |
| `scale` | Numeric scale | 1-10 |

## 4. State Management

The conversation state machine:

```
initial
   │
   ▼
{prefix}_001 ──→ {prefix}_002 ──→ ... ──→ {prefix}_00N
   │                                              │
   │                                              ▼
   │                                          COMPLETE
   │                                              │
   │                                              ▼
   │                                      awaiting_consultation
   │                                              │
   └───── (RESTART resets to {prefix}_001) ───────┘
```

### State Transitions

- Each answer advances `currentState` to the next question ID
- CCIE determines `nextState` based on the current question's `next` field and answer branching
- Assessment completion triggers transition to `awaiting_consultation`
- Chat history is persisted in `leads.chat_history` as JSON array
- Lead state is saved after every message

## 5. Scoring Flow

```javascript
calculateScore(finalAnswers)
  ├── Extract answers for each pillar
  ├── Calculate pillar scores (0-100)
  │     └── Per-question: risk_value × weight
  ├── Compute composite Score (weighted average)
  ├── Determine risk level (CSNS 6-tier)
  ├── Calculate exposure (min/max loss estimates)
  ├── Generate recommendations list
  │     └── Based on answer thresholds
  └── Return {score, risk_level, pillar_scores, recommendations, ...}
```

### Score Formula

```
Score = 100 × (safeWeight / totalWeight)

Where:
  safeWeight = Σ(answered questions where risk_value = 0)
  totalWeight = Σ(all answered questions × weight)
  unanswered questions ARE excluded
```

## 6. Domain Configuration

Each prefix has a domain config in `config/domain.js`:

```javascript
{
  domain: 'Your Business',
  assessmentTitle: 'Business Risk Score™',
  resilienceTerm: 'Resilience',
  improvementTerm: 'business resilience',
  closingTerm: 'business',
  snapshotTitle: 'Business Resilience Snapshot™',
  insightTexts: {
    perPillar: {
      'Asset Protection': {
        base: 'Your asset protection score is your lowest area.',
        answerChecks: [
          { q: 'SME_016', values: ['No'], append: 'Without fire and burglary insurance, your business property and assets are fully exposed.' }
        ],
        suffix: 'Securing this area would significantly strengthen your overall resilience.'
      }
    }
  },
  whyTexts: { 'asset protection': 'your business assets are not adequately protected against fire, theft, or damage' },
  recommendationTexts: { 'asset protection': 'securing comprehensive fire and burglary insurance for your business premises' },
  firstStepTexts: { 'asset protection': 'Obtain a fire and burglary insurance quote for your business premises' }
}
```

## 7. Assessment Delivery Flow

```
Phase 1: Auto-Advance
  Send any pre-scoring informational messages immediately
  (e.g., "Give me a few seconds while I analyse...")

Phase 2: Scoring
  Run calculateScore() with all answered questions
  Create assessment record in database
  Generate reportUrl
  Fire background AI report generation

Phase 3: Build Report Messages
  Construct 4-5 WhatsApp messages with full report content
  Each message is built from scored data + domain config

Phase 4: Send Messages
  Send each message sequentially with delays
  Save chat history after each send
  If send fails → save state and abort gracefully

Phase 5: Background Processing
  AI report generation (async)
  Email report to user (if email provided)
  Update lead record with score/status
  RIE execution (product mapping, opportunity scoring, copilot)
  Lead qualification (AI)
  Admin notification (if high-opportunity)
  Renewal engine check
```
