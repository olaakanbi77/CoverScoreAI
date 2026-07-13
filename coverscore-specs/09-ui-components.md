# UI Component Library Specification

## 1. Component Philosophy

- Every component is a reusable Handlebars partial
- Components are self-contained (own CSS via classes, no inline styles)
- All data is passed as template variables
- Components adapt to their container width
- Mobile-first responsive design
- Consistent colour system using CSS custom properties

## 2. Colour System

```css
:root {
  --cs-blue: #1a56db;
  --cs-blue-light: #e8f0fe;
  --cs-blue-dark: #1e3a5f;
  --cs-green: #059669;
  --cs-green-light: #d1fae5;
  --cs-amber: #d97706;
  --cs-amber-light: #fef3c7;
  --cs-red: #dc2626;
  --cs-red-light: #fee2e2;
  --cs-purple: #7c3aed;
  --cs-purple-light: #ede9fe;
  --cs-pink: #db2777;
  --cs-pink-light: #fce7f3;
  --cs-gray-50: #f9fafb;
  --cs-gray-100: #f3f4f6;
  --cs-gray-200: #e5e7eb;
  --cs-gray-700: #374151;
  --cs-gray-900: #111827;
}
```

## 3. Component Catalog

### 3.1 CoverScore Gauge

Circular gauge showing score (0-100) with colour-coded arc.

```
┌───────┐
│  78   │  ← Score in centre
│  /100 │
│  ○────│  ← Arc: 0% at bottom-left, full circle at 0
│       │
│ Strong│  ← CSNS label below
└───────┘
```

**Props:** `score`, `riskLevel`, `size` (small/medium/large)
**States:** Default, Loading (pulsing grey), Error (red X)
**Colours:** Critical=red, HighRisk=orange, NeedsAttention=amber, Developing=yellow, Strong=light-green, Excellent=dark-green

### 3.2 Risk Pillar Card

Single pillar score bar.

```
Asset Protection     ████████░░░░    42%
[Pillar Name]        [Score Bar]     [Score%]
```

**Props:** `name`, `score`, `maxNameLen`
**States:** Default, Null (grey with "No data" label)
**Score Bar:** 10 filled blocks, colour matches gauge band

### 3.3 Risk Story Card

Narrative risk story with icon.

```
┌─────────────────────────────────────────────┐
│  🔥 Your Risk Story™                        │
│                                             │
│  Every day, your manufacturing operation    │
│  depends on equipment, people, and pro-     │
│  cesses working together...                 │
└─────────────────────────────────────────────┘
```

**Props:** `storyText`, `icon` (optional, defaults to industry emoji)
**States:** Default, Collapsible

### 3.4 Insight Card

Single insight/observation.

```
┌─────────────────────────────────────────────┐
│  ⭐ CoverScore Insight™                      │
│                                             │
│  Your biggest opportunity is in Asset       │
│  Protection, which scored 42%. Your         │
│  business property is not adequately        │
│  protected...                               │
└─────────────────────────────────────────────┘
```

**Props:** `text`, `pillarName`, `pillarScore`

### 3.5 Forecast Card

Resilience forecast with improvement actions.

```
┌─────────────────────────────────────────────┐
│  📈 Resilience Forecast™                     │
│                                             │
│  Here's how your resilience could improve:  │
│  ✓ Get fire insurance for your premises     │
│  ✓ Secure business interruption cover       │
│  ✓ Implement safety training                │
│                                             │
│  42 → 72  (+30 points)                     │
└─────────────────────────────────────────────┘
```

**Props:** `actions[]`, `currentScore`, `projectedScore`

### 3.6 Recommendation Card

Recommended first step.

```
┌─────────────────────────────────────────────┐
│  💡 Recommended First Step                   │
│                                             │
│  Obtain a fire and burglary insurance       │
│  quote for your business premises.          │
│                                             │
│  Improving Asset Protection from 42% is     │
│  expected to have the greatest impact.      │
└─────────────────────────────────────────────┘
```

**Props:** `text`, `pillarName`, `pillarScore`

### 3.7 Lead Card

Lead summary for the pipeline.

```
┌────────────────────────────────────────────────┐
│  [Initials]  John's Manufacturing              │
│              John Adeyemi                      │
│  78          Contacted • 2h ago                │
│  [Score]     [Status]   [Time]                 │
│                                                │
│  [Contact]  [Proposal]  [View Report]          │
└────────────────────────────────────────────────┘
```

**Props:** `lead` (full lead object with computed fields)
**State variations:** New (green pulse), Contacted (blue), Qualified (purple), Won (green solid), Lost (pink)

### 3.8 Advisor Card

Advisor profile card.

```
┌──────────────────────┐
│  [Avatar]            │
│  Ayo Johnson         │
│  Senior Advisor      │
│                      │
│  ⭐ 4.8  •  23 leads │
│  📞 2348123456789    │
│  ✉ ayo@coverscore   │
└──────────────────────┘
```

**Props:** `name`, `role`, `rating`, `leadCount`, `phone`, `email`

### 3.9 Quote Card

Insurance quote summary.

```
┌──────────────────────────────────────────────┐
│  📄 Proposal for: John's Manufacturing       │
├──────────────────────────────────────────────┤
│                                              │
│  Product                 Sum Assured  Premium │
│  ─────────────────────────────────────────── │
│  Machinery Breakdown     ₦20M         ₦200K  │
│  Business Interruption   ₦50M         ₦500K  │
│                                              │
│  Total Annual Premium:              ₦700,000 │
│                                              │
│  [Send via WhatsApp]  [Send via Email] [Edit]│
└──────────────────────────────────────────────┘
```

**Props:** `quote` { products[], totalPremium, clientName }
**States:** Draft, Sent, Viewed, Accepted, Declined

### 3.10 Pipeline Card

Kanban pipeline stage column.

```
┌─────────────────────────────┐
│  Stage 3: Report Sent    (5)│ ← Title + count
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ Lead Card (item 1)    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Lead Card (item 2)    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Lead Card (item 3)    │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Props:** `stageName`, `stageNumber`, `leads[]`

### 3.11 Activity Timeline

Chronological activity feed.

```
┌──────────────────────────────────────────────┐
│  📋 Activity Timeline                        │
├──────────────────────────────────────────────┤
│                                              │
│  Today, 2:30 PM ──────●── Report sent       │
│  Today, 2:15 PM ──────●── Assessment done   │
│  Today, 2:00 PM ──────●── Call completed    │
│  Yesterday ────────────●── Lead created     │
└──────────────────────────────────────────────┘
```

**Props:** `activities[]` (each with title, description, timestamp, type)
**Types:** system (grey), call (blue), email (green), whatsapp (green), consultation (purple)

### 3.12 Task Card

Single follow-up task.

```
┌────────────────────────────────┐
│  ☐ Call John about proposal    │ ← Checkbox + title
│  Due: Today, 5:00 PM           │ ← Due date
│  Priority: High                │ ← Colour badge
│                                │
│  [Complete] [Reschedule]       │ ← Actions
└────────────────────────────────┘
```

**Props:** `task` { title, dueDate, priority, status }
**Priorities:** High (red), Medium (amber), Low (grey)
**States:** Pending (☐ unchecked), Completed (☑ checked, strikethrough)

### 3.13 Notification Card

System notification/toast.

```
┌──────────────────────────────────────┐
│  🔥 New qualified lead: John's MFG   │
│  Score: 78 — High opportunity        │
│                          [Dismiss]   │
└──────────────────────────────────────┘
```

**Props:** `type` (lead/new/task/renewal), `message`, `actionUrl`
**Types:** Lead (green), Task (blue), Alert (red), System (grey)

### 3.14 Stat Card

Dashboard statistic tile.

```
┌──────────┐
│  📊      │ ← Icon
│  23      │ ← Value
│  Leads   │ ← Label
│  +12% ▲  │ ← Trend
└──────────┘
```

**Props:** `icon`, `value`, `label`, `trend`, `trendDirection`
**Trend:** Positive (green ▲), Negative (red ▼), Flat (grey →)

## 4. Empty States

Every list/card component must define an empty state:

```handlebars
{{#if items}}
  {{#each items}}
    {{> componentName item=this}}
  {{/each}}
{{else}}
  {{> empty-state title="No items" message="Nothing to show yet" icon="📭"}}
{{/if}}
```

## 5. Loading States

```
<spinner> ──── Pulsing circular spinner (primary colour)
<skeleton> ─── Grey rectangular pulse (for cards)
```

## 6. Error States

```
┌──────────────────────────┐
│  ⚠ Something went wrong   │
│  Unable to load data.    │
│  [Try Again]             │
└──────────────────────────┘
```
