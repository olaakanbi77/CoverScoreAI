# Risk Intelligence Engine (RIE)

## 1. Overview

The Risk Intelligence Engine (RIE) is a 14-layer AI computation system that transforms raw assessment data into actionable insurance intelligence. It runs synchronously on every assessment completion and stores its output in the assessment record.

## 2. Architecture

```
Assessment Data (answers + scores)
              │
              ▼
┌─────────────────────────────┐
│ Layer 1-8: CCIE (Conv. Eng)│ ← Existing conversation engine
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Layer 9: Product Mapper     │ ← Maps risks → insurance products
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Layer 10: Opportunity Scorer│ ← Scores lead quality (0-100)
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Layer 11: Advisor Copilot   │ ← Generates advisor briefing
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Layer 12: Quote Pre-builder │ ← Pre-populates quote data
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Layer 13: Follow-up Engine  │ ← Determines next actions
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Layer 14: Learning Engine   │ ← Tracks outcomes for improvement
└─────────────────────────────┘
              │
              ▼
     JSON output stored in assessment_data.rie
```

## 3. Layer 9: Product Mapper

Maps assessment answers to specific insurance products from the knowledge base.

**Input:** `{ prefix, answers, pillarScores }`

**Process:**
```
1. Identify industry (prefix → SME, HOS, MFG, etc.)
2. Load relevant products from knowledge base
3. For each product:
   a. Check risk_mapping conditions against answers
   b. If conditions met → add to recommendations
4. Score each recommendation by relevance (0-100)
5. Sort by relevance score descending
```

**Output:**
```json
{
  "recommendedProducts": [
    { "product": "Fire & Special Perils Insurance", "confidence": 92,
      "reason": "Your facility lacks fire protection", "estimatedPremium": { "min": 50000, "max": 150000 } },
    { "product": "Public Liability Insurance", "confidence": 85,
      "reason": "Customer-facing operations with no liability cover", "estimatedPremium": { "min": 75000, "max": 200000 } }
  ]
}
```

## 4. Layer 10: Opportunity Scorer

Scores the lead's commercial potential (0-100).

**Input:** `{ prefix, answers, assessmentData }`

**Components:**
- **Need Urgency (35%)**: How critical are the identified gaps?
- **Financial Capacity (25%)**: Revenue, employee count, business maturity
- **Decision Authority (20%)**: Is the respondent the decision-maker?
- **Engagement Level (20%)**: Did they complete the full assessment? Request advisor?

**Output:**
```json
{
  "opportunityScore": 78,
  "scoreComponents": {
    "needUrgency": 0.85,
    "financialCapacity": 0.70,
    "decisionAuthority": 0.80,
    "engagementLevel": 0.75
  },
  "priorityBand": "High"
}
```

## 5. Layer 11: Advisor Copilot

Generates a structured briefing for the assigned advisor.

**Input:** `{ lead, assessmentData, productRecommendations, opportunityScore }`

**Output:**
```json
{
  "advisorBrief": {
    "openingLine": "Hi John, I've reviewed your CoverScore assessment and I can see you're doing well with...",
    "keyRisks": ["No fire insurance on business premises", "No liability cover"],
    "recommendedProducts": ["Fire & Special Perils", "Public Liability"],
    "suggestedApproach": "Start by acknowledging their strengths, then discuss the highest-priority gap",
    "estimatedPremium": "₦125,000 - ₦350,000/year",
    "objectionHandlers": {
      "I need to think about it": "I understand. Many business owners feel the same way. Would it help if I walk you through what the actual cost of not having cover could be?",
      "It's too expensive": "The premium for fire insurance starts at about ₦X/month — less than what most businesses spend on diesel in a week."
    }
  }
}
```

## 6. Layer 12: Quote Pre-Builder

Pre-populates quote data so advisors don't start from scratch.

**Input:** `{ productRecommendations, assessmentData }`

**Output:**
```json
{
  "prebuiltQuote": {
    "products": [
      {
        "product": "Fire & Special Perils Insurance",
        "sumAssured": "₦50,000,000",
        "premium": "₦125,000",
        "term": "Annual",
        "notes": "Based on estimated property value of ₦50M"
      }
    ],
    "totalPremium": "₦125,000",
    "paymentOptions": ["Annual", "Semi-Annual", "Quarterly"]
  }
}
```

## 7. Layer 13: Follow-Up Engine

Determines the optimal follow-up sequence and timing.

**Input:** `{ opportunityScore, advisorRequested, assessmentData }`

**Output:**
```json
{
  "followUp": {
    "nextAction": "send_report",
    "timing": "immediate",
    "sequence": [
      { "day": 0, "action": "send_report", "channel": "whatsapp" },
      { "day": 1, "action": "follow_up_message", "channel": "whatsapp" },
      { "day": 3, "action": "call", "channel": "phone", "assignedTo": "advisor" },
      { "day": 7, "action": "email_reminder", "channel": "email" }
    ],
    "adapterResponse": "Send the report link now and follow up in 24 hours"
  }
}
```

## 8. Layer 14: Learning Engine

Tracks outcomes to improve RIE accuracy over time.

**Input:** `{ assessmentId, opportunityScore, actualOutcome, (future: premium, productsPurchased) }`

**Current tracking:**
```
- Assessment ID
- Predicted opportunity score
- Actual advisor request (yes/no)
- Time to follow-up
- (Future: Actual premium, products purchased, conversion status)
```

## 9. Integration Points

### In webhook.js (post-assessment):
```javascript
const rieResult = runRiskIntelligence(prefix, answers, pillarScores, context);
assessmentData.rie = rieResult;
// RIE output saved to assessment_data.rie in JSON
// opportunityScore saved to lead.sales_score for CRM sorting
```

### Database storage:
```
assessment_data.rie → TEXT (JSON) in leads table
sales_score → INTEGER in leads table (0-100 opportunity score)
```
