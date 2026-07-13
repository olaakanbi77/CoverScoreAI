# AI Prompt Library

## 1. Overview

All AI prompts are stored as individual Markdown files in `src/prompts/` and loaded via the `renderPrompt()` entry point. This keeps prompts outside application code for easy iteration without deployments.

## 2. Prompt Catalog

### 2.1 Risk Story Prompt (`risk-story.md`)

Generates a personalised narrative about the user's risk situation.

**Template variables:** `{{name}}`, `{{industry}}`, `{{score}}`, `{{weakestPillar}}`, `{{weakestScore}}`, `{{answers}}`, `{{strengths}}`, `{{gaps}}`

**Structure:**
- Opening: Daily operations context
- Middle: Specific gaps identified
- Consequence: What could happen
- Closing: Encouraging note

### 2.2 CoverScore Insight Prompt (`insight.md`)

Generates a single-paragraph insight about the biggest opportunity.

**Template variables:** `{{name}}`, `{{weakestPillar}}`, `{{weakestScore}}`, `{{answers}}`, `{{whyText}}`

**Structure:**
- What the lowest-scoring pillar is
- Why it matters (specific to their answers)
- What improvement would mean

### 2.3 Advisor Copilot Brief (`copilot-brief.md`)

Generates the advisor's briefing document.

**Template variables:** `{{clientName}}`, `{{businessName}}`, `{{phone}}`, `{{email}}`, `{{score}}`, `{{riskLevel}}`, `{{pillars}}`, `{{answers}}`, `{{products}}`, `{{recommendations}}`

**Output structure:**
```json
{
  "clientSummary": "...",
  "strengths": ["...", "..."],
  "keyRisks": ["...", "..."],
  "openingLine": "...",
  "suggestedApproach": "...",
  "objectionHandlers": "..."
}
```

### 2.4 Quote Explanation Prompt (`quote-explanation.md`)

Generates a plain-English explanation of a quote for the client.

**Template variables:** `{{clientName}}`, `{{products}}`, `{{totalPremium}}`, `{{coverageDetails}}`

**Structure:**
- What the quote covers
- Why each product was recommended
- Total premium summary
- Payment options

### 2.5 Proposal Generation Prompt (`proposal.md`)

Generates a full proposal document.

**Template variables:** `{{clientName}}`, `{{businessName}}`, `{{date}}`, `{{assessmentSummary}}`, `{{riskTable}}`, `{{recommendedProducts}}`, `{{totalPremium}}`, `{{advisorName}}`

**Output:** Full HTML proposal document

### 2.6 Renewal Notification Prompt (`renewal.md`)

Generates renewal reminder messages.

**Template variables:** `{{clientName}}`, `{{policyNumber}}`, `{{productName}}`, `{{expiryDate}}`, `{{newPremium}}`, `{{daysUntilExpiry}}`

**Variations:**
- Friendly reminder (30+ days)
- Urgent reminder (7-30 days)
- Final notice (<7 days)

### 2.7 Cross-Sell Prompt (`cross-sell.md`)

Generates cross-sell recommendations and messages.

**Template variables:** `{{clientName}}`, `{{existingProducts}}`, `{{industry}}`, `{{gaps}}`

**Output:** Prioritised list of cross-sell opportunities

### 2.8 Objection Handling Prompt (`objection.md`)

Generates responses to common client objections.

**Template variables:** `{{objection}}`, `{{clientProfile}}`, `{{product}}`, `{{premium}}`

**Pre-defined objections:**
- "I need to think about it"
- "It's too expensive"
- "I already have insurance"
- "Let me ask my spouse"
- "I'll call you back"

### 2.9 Follow-Up Message Prompt (`follow-up.md`)

Generates personalised follow-up messages.

**Template variables:** `{{clientName}}`, `{{stage}}`, `{{lastAction}}`, `{{daysSinceLastContact}}`

**Tone variations:** Friendly, Professional, Urgent

### 2.10 Strengths Identification Prompt (`strengths.md`)

Generates "What You're Doing Well" content.

**Template variables:** `{{answers}}`, `{{industry}}`, `{{prefix}}`

**Output:** List of identified strengths with personalised context

## 3. Loading Prompts

```javascript
const { renderPrompt } = require('../prompts/index');

// Load and render a prompt with variables
const message = renderPrompt('RENEWAL', {
  clientName: 'John',
  policyNumber: 'POL-001',
  productName: 'Fire Insurance',
  expiryDate: '2026-12-31',
  newPremium: 250000,
  daysUntilExpiry: 45
});
```

## 4. Prompt Management

- Prompts are plain Markdown with `{{mustache}}` variable syntax
- No code changes needed to update prompt text
- Prompt files can be version-controlled independently
- Each prompt has a header with metadata (version, purpose, expected output format)
