/**
 * Scaffold the CCA 106-108 complete training packages (production standard v2).
 * Creates the same 6-part folder structure as docs/training/cca-105/ for each module,
 * using module + lesson titles drawn from the current CoverScore Academy curriculum.
 *
 * Blueprint-dependent fields (purpose, duration, outcomes, flow, resources,
 * assessment, avatar scripts) are left as clearly-marked placeholders.
 *
 * Run (re-runnable, regenerates scaffolds in place): node scripts/scaffold_cca_training_packages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'docs', 'training');

const MODULES = [
  {
    code: 'CCA 106',
    title: 'Risk Advisory Practice, Business Development & Client Growth',
    folder: 'cca-106',
    question: 'How do we build a sustainable advisory practice?',
    theme: 'identifying ideal clients, risk-intelligence prospecting, converting assessments into business, retention, referrals, and lifetime advisory relationships.',
    lessons: [
      "The CoverScore Advisor's Ideal Client",
      'Prospecting Through Risk Intelligence',
      'The CoverScore Prospecting System',
      'Starting the Risk Conversation',
      'Converting Prospects into CoverScore Assessments',
      'From Advisory Insight to Business Conversion',
      'Client Retention, Referrals & Lifetime Advisory Relationships',
      'Business Development Simulation & Module Assessment',
    ],
  },
  {
    code: 'CCA 107',
    title: 'Professional Risk Advisory Practice & Client Portfolio Management',
    folder: 'cca-107',
    question: 'How do we remain valuable throughout the client journey?',
    theme: 'professional trust, the client journey, portfolio management, reviews and reassessments, CRM and advisory records, value measurement, and professional practice.',
    lessons: [
      'The Professional CoverScore Advisor',
      'Managing the CoverScore Client Journey',
      'Building and Managing a Client Risk Portfolio',
      'Risk Reviews, Reassessments and Portfolio Monitoring',
      'LESSON 5 — TITLE PENDING MODULE BLUEPRINT',
      'Client Documentation, CRM and Advisory Records',
      'Measuring Client Value and Advisor Performance',
      'Professional Practice Simulation and Module Assessment',
    ],
  },
  {
    code: 'CCA 108',
    title: 'Capstone: Integrated Advisory Simulation & Professional Assessment',
    folder: 'cca-108',
    question: 'Can the learner independently perform as a professional CoverScore Risk Advisor in a complex, realistic client environment?',
    theme: 'integration of CCA 101-107 into complete, assessed, real-world advisory performance.',
    lessons: [
      'Capstone Orientation & the Complete CoverScore Advisory Cycle',
      'Integrated Client Engagement Simulation',
      'Complex Risk Intelligence & CoverScore Assessment',
      'Protection Strategy & Executive Advisory Simulation',
      'Business Development, Conversion & Client Growth Simulation',
      'Professional Practice, Portfolio Management & Risk Review Simulation',
      'Ethics, Professional Judgment & Difficult Advisory Decisions',
      'Final Integrated Advisory Simulation & Professional Assessment',
    ],
  },
];

// ── templates ─────────────────────────────────────────────────────
const PLACEHOLDER = (field) => `> **Placeholder:** ${field} — complete from the module blueprint when supplied.`;
const REPEAT = (s, n) => Array.from({ length: n }, () => s).join('\n');

function packageIndex(m) {
  const lessonRows = m.lessons
    .map((l, i) => `| ${i + 1} | ${l} | ${i === m.lessons.length - 1 ? 'Capstone / module assessment' : ''} |`)
    .join('\n');
  return `# ${m.code} — Complete Training Package Index

**Module:** ${m.code} — ${m.title}
**Production Standard:** Complete Training Package, v2 (all modules CCA 105–108)
**Total learning time:** ~15 hours (placeholder — confirm from module blueprint)
**Certification pass mark:** 80%

> **Status:** Scaffold. Structure and known curriculum titles are in place; blueprint-dependent
> content is marked with placeholders. Complete this package following the CCA 105 exemplar in
> \`docs/training/cca-105/\`.

---

## Package Map

| Part | Deliverable | Location |
|------|-------------|----------|
| Part 1 | Module Blueprint | \`01-module-blueprint.md\` |
| Part 2 | Complete Lesson Production (Lessons 1–8) | \`02-lessons/lesson-01.md\` … \`02-lessons/lesson-08.md\` |
| Part 3 | Module Resources | \`03-resources/\` |
| Part 4 | Assessment | \`04-assessment/assessment-pack.md\` |
| Part 5 | AI Companion Package | \`05-ai-companion/ai-companion-pack.md\` |
| Part 6 | Multimedia Production Pack | \`06-multimedia/multimedia-production-pack.md\` |

---

## Module Identity

- **Central question:** ${m.question}
- **Theme:** ${m.theme}

## Lesson Titles (Part 2)

| Lesson | Title | Notes |
|--------|-------|-------|
${lessonRows}

---

## How To Use This Package

1. **Producers / course creators** — Complete \`01-module-blueprint.md\` from the module
   blueprint, then produce lessons in sequence using the fixed 12-section template in each
   lesson file and \`06-multimedia\`.
2. **Instructors** — Use \`03-resources/01-instructor-guide.md\` and \`03-resources/05-conversation-guides.md\`.
3. **Learners** — Work through Lessons 1–8 using each lesson's Learner Handbook and \`03-resources/02-student-workbook.md\`.
4. **AI systems** — Load prompts from \`05-ai-companion\` into AI Tutor / Coach / Feedback / Grading.
5. **Assessors** — Use \`04-assessment/assessment-pack.md\` with the scoring rubric and 80% certification standard.

---

## The Fixed Lesson Template (every lesson)

1. Lesson overview · 2. Learning objectives · 3. Avatar script and scene directions ·
4. Slide deck storyboard · 5. Learner handbook · 6. Practical exercises · 7. Case study ·
8. Knowledge check · 9. AI Tutor Knowledge Base · 10. AI Coaching Prompts ·
11. Lesson completion standard · 12. Final takeaway

Shared terminology and score bands: see \`docs/training/cca-105/00-package-index.md\`.
`;
}

function moduleBlueprint(m) {
  return `# ${m.code} — Part 1: Module Blueprint (Scaffold)

**Module Title:** ${m.code} — ${m.title}
**Package Production Standard:** Complete Training Package v2 (Parts 1–6)

---

## 1. Module Overview

${PLACEHOLDER('Module overview — purpose, position in the academy, learner profile')}
> Central question: ${m.question}
> Theme: ${m.theme}

## 2. Module Purpose

${PLACEHOLDER('Module purpose paragraph')}

## 3. Module Duration

| Component | Duration |
|-----------|----------|
| Video lessons | ~6 hours |
| Practical workshops | ~3 hours |
| Guided simulations | ~2 hours |
| Independent exercises | ~2 hours |
| Assessment | ~2 hours |
| **Total learning time** | **~15 hours** |

## 4. Learning Outcomes

${PLACEHOLDER('8 learning outcomes, one per intended capability')}
1. ${'[Outcome 1]'}
2. ${'[Outcome 2]'}
3. ${'[Outcome 3]'}
4. ${'[Outcome 4]'}
5. ${'[Outcome 5]'}
6. ${'[Outcome 6]'}
7. ${'[Outcome 7]'}
8. ${'[Outcome 8]'}

## 5. Competencies Developed

### Technical
- ${'[Technical competency]'} × ${'5'}
### Professional
- ${'[Professional competency]'} × ${'5'}
### Behavioural
- ${'[Behavioural competency]'} × ${'5'}

## 6. Module Flow

${PLACEHOLDER('Module flow — sequence diagram of the 8 lessons')}

## 7. Lessons

| Lesson | Title |
|--------|-------|
${m.lessons.map((l, i) => `| ${i + 1} | ${l} |`).join('\n')}

## 8. Required Resources

${PLACEHOLDER('Platform access, learner materials, demonstrations, facilities')}

## 9. Assessment Strategy

${PLACEHOLDER('What learners receive + the 5 tasks they must complete')}

## 10. Module Resources

### Worksheets
- ${'[Worksheet 1]'} × ${'6'}
### Templates
- ${'[Template 1]'} × ${'5'}
### Conversation Guides
- ${'[Conversation guide 1]'} × ${'5'}

## 11. Certification Standard

To pass, learners must demonstrate competence in:
${'7 competencies (assessment interpretation, explanation, questioning, communication, judgement, prioritisation, engagement)'}
**Minimum pass mark: 80%**

## 12. Production Standard Compliance

Every lesson includes the fixed 12-section template. See \`02-lessons/\`.
`;
}

function lessonScaffold(m, n) {
  const title = m.lessons[n - 1];
  return `# ${m.code} — Lesson ${n}: ${title}

**Module:** ${m.code} — ${m.title}
**Video duration:** ~45 minutes | **Workshop:** ~25 minutes | **Independent:** ~15 minutes
*(placeholders — confirm timing from the module blueprint)*

---

## 1. Lesson Overview

${PLACEHOLDER(`Lesson ${n} overview`)}${n === 1 ? `
> Place in the module: opening lesson establishing the module's mindset and roadmap.` : ''}${n === 8 ? `
> Place in the module: capstone simulation + module assessment preparation.` : ''}

## 2. Learning Objectives

${[1, 2, 3, 4, 5].map(() => `1. ${'[Objective]'}`).join('\n')}

## 3. Avatar Script and Scene Directions

> **Studio note:** The spoken narration is supplied separately by the production team.
> Insert the provided script into each [SCRIPT BODY] slot. Scene directions define the
> visuals, timing, and on-screen action.

| Scene | Time | Scene direction | Script slot |
|-------|------|-----------------|-------------|
| 1 | 0:00–0:20 | ${'[Scene direction]'} | [SCRIPT BODY — Scene 1] |
| 2 | 0:20–1:00 | ${'[Scene direction]'} | [SCRIPT BODY — Scene 2] |
| 3 | 1:00–2:10 | ${'[Scene direction]'} | [SCRIPT BODY — Scene 3] |
| 4 | 2:10–3:00 | ${'[Scene direction]'} | [SCRIPT BODY — Scene 4] |
| 5 | 3:00–3:45 | ${'[Scene direction]'} | [SCRIPT BODY — Scene 5] |
| 6 | 3:45–4:30 | ${'[Scene direction]'} | [SCRIPT BODY — Scene 6] |

**B-roll / assets required:** ${'[List assets]'}
**Delivery notes:** ${'[Pacing, tone, framing guidance]'}

## 4. Slide Deck Storyboard

| Slide | Title | Content / Visual |
|-------|-------|------------------|
| 1 | ${title} | Lesson title + objectives |
${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => `| ${'[n]'} | ${'[Slide title]'} | ${'[Content / visual]'} |`).join('\n')}

## 5. Learner Handbook

### 5.1 ${'[Core concept 1]'}
${'[Handbook content]'}
### 5.2 ${'[Core concept 2]'}
${'[Handbook content]'}
### 5.3 ${'[Core concept 3]'}
${'[Handbook content]'}
### 5.4 ${'[Core concept 4]'}
${'[Handbook content]'}
### 5.5 ${'[Core concept 5]'}
${'[Handbook content]'}

## 6. Practical Exercises

**Exercise ${n}.1 — ${'[Title]'}** — ${'[Duration + instruction]'}
**Exercise ${n}.2 — ${'[Title]'}** — ${'[Duration + instruction]'}
**Exercise ${n}.3 — ${'[Title]'}** — ${'[Duration + instruction]'}

## 7. Case Study

${PLACEHOLDER(`Lesson ${n} case study — scenario + tasks`)}
**Scenario:** ${'[Case scenario]'}
**Tasks:**
1. ${'[Task]'}
2. ${'[Task]'}
3. ${'[Task]'}
4. ${'[Task]'}
5. ${'[Task]'}

## 8. Knowledge Check

1. ${'[Question]'} — a) ${'X'} b) ${'X'} c) ${'X'} d) ${'X'} *(correct answer + explanation pending)*
2. ${'[Question]'} — a) ${'X'} b) ${'X'} c) ${'X'} d) ${'X'}
3. ${'[Question]'} — a) ${'X'} b) ${'X'} c) ${'X'} d) ${'X'}
4. ${'[Question]'} — a) ${'X'} b) ${'X'} c) ${'X'} d) ${'X'}
5. ${'[Question]'} — a) ${'X'} b) ${'X'} c) ${'X'} d) ${'X'}

## 9. AI Tutor Knowledge Base

- **KB-${n}.1 ${'[Topic]'}:** ${'[Knowledge entry]'}
- **KB-${n}.2 ${'[Topic]'}:** ${'[Knowledge entry]'}
- **KB-${n}.3 ${'[Topic]'}:** ${'[Knowledge entry]'}
- **KB-${n}.4 ${'[Topic]'}:** ${'[Knowledge entry]'}
- **KB-${n}.5 ${'[Topic]'}:** ${'[Knowledge entry]'}

## 10. AI Coaching Prompts

- **Prompt ${n}.1 (${'[Drill type]'}):** ${'[Prompt]'}
- **Prompt ${n}.2 (${'[Drill type]'}):** ${'[Prompt]'}
- **Prompt ${n}.3 (${'[Drill type]'}):** ${'[Prompt]'}

## 11. Lesson Completion Standard

This lesson is complete when learners can:
${[1, 2, 3, 4].map(() => `- ${'[Completion criterion]'}`).join('\n')}

## 12. Final Takeaway

${'[Final takeaway]'}
`;
}

function resourceScaffold(m, filename) {
  const files = {
    '01-instructor-guide.md': `# ${m.code} — Instructor Guide (Part 3, Scaffold)

**Module:** ${m.code} — ${m.title}

## 1. Your Role
${PLACEHOLDER('Instructor role for this module')}

## 2. Session Plan (workshops)
${PLACEHOLDER('Workshop sessions per lesson with durations')}

## 3. Room Setup
${PLACEHOLDER('Breakout setup, role-play triads, shared artefacts, timekeeping')}

## 4. Facilitation Script (debrief template)
${PLACEHOLDER('50-minute debrief template')}

## 5. Common Learner Errors and Coaching
${PLACEHOLDER('Error table + coaching interventions')}

## 6. Assessment Logistics
Use the module assessment in \`04-assessment/assessment-pack.md\`. Book one-on-one
simulated reviews; score with the instructor rubric; provide feedback within 48 hours.

## 7. Materials Checklist
${PLACEHOLDER('Learner materials, platform access, sample records')}
`,

    '02-student-workbook.md': `# ${m.code} — Student Workbook (Part 3, Scaffold)

**Module:** ${m.code} — ${m.title}

## How to use this workbook
Complete the sections for each lesson after watching the video. These become your
practice bank and real-world templates.

## Lesson 1 — ${m.lessons[0]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 2 — ${m.lessons[1]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 3 — ${m.lessons[2]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 4 — ${m.lessons[3]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 5 — ${m.lessons[4]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 6 — ${m.lessons[5]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 7 — ${m.lessons[6]}
${REPEAT('- [Workbook task]', 3)}

## Lesson 8 — ${m.lessons[7]}
${REPEAT('- [Workbook task]', 3)}

## Optional extension (module assessment prep)
Re-run the Lesson 8 simulation against the scoring rubric in \`04-assessment/assessment-pack.md\`
under exam conditions the day before your assessment.
`,

    '03-worksheets.md': `# ${m.code} — Worksheets (Part 3, Scaffold)

**Module:** ${m.code} — ${m.title}

| # | Worksheet | Purpose |
|---|-----------|---------|
| 1 | ${'[Worksheet 1]'} | ${'[Purpose]'} |
| 2 | ${'[Worksheet 2]'} | ${'[Purpose]'} |
| 3 | ${'[Worksheet 3]'} | ${'[Purpose]'} |
| 4 | ${'[Worksheet 4]'} | ${'[Purpose]'} |
| 5 | ${'[Worksheet 5]'} | ${'[Purpose]'} |
| 6 | ${'[Worksheet 6]'} | ${'[Purpose]'} |

${PLACEHOLDER('Worksheet contents')}
`,

    '04-templates.md': `# ${m.code} — Templates (Part 3, Scaffold)

**Module:** ${m.code} — ${m.title}

| # | Template | Use |
|---|----------|-----|
| 1 | ${'[Template 1]'} | ${'[Use]'} |
| 2 | ${'[Template 2]'} | ${'[Use]'} |
| 3 | ${'[Template 3]'} | ${'[Use]'} |
| 4 | ${'[Template 4]'} | ${'[Use]'} |
| 5 | ${'[Template 5]'} | ${'[Use]'} |

${PLACEHOLDER('Template contents')}
`,

    '05-conversation-guides.md': `# ${m.code} — Conversation Guides (Part 3, Scaffold)

**Module:** ${m.code} — ${m.title}

| # | Guide | Situation |
|---|-------|-----------|
| 1 | ${'[Guide 1]'} | ${'[Situation]'} |
| 2 | ${'[Guide 2]'} | ${'[Situation]'} |
| 3 | ${'[Guide 3]'} | ${'[Situation]'} |
| 4 | ${'[Guide 4]'} | ${'[Situation]'} |
| 5 | ${'[Guide 5]'} | ${'[Situation]'} |

${PLACEHOLDER('Conversation guide contents')}
`,

    '06-practical-tools.md': `# ${m.code} — Practical Tools (Part 3, Scaffold)

**Module:** ${m.code} — ${m.title}

${PLACEHOLDER('Practical, reusable tools')}

Refer to \`docs/training/cca-105/03-resources/06-practical-tools.md\` for examples of
the tool-card format used across the programme.
`,
  };
  return files[filename];
}

function assessmentScaffold(m) {
  return `# ${m.code} — Part 4: Assessment Pack (Scaffold)

**Module:** ${m.code} — ${m.title}
**Pass mark:** 80% | **Duration:** ~2 hours (placeholder)

## 1. Assessment Overview

| Mode | Marks | Weight | Duration |
|------|-------|--------|----------|
| A. Practical assessment | 50 | 40% | ~45 min |
| B. Written assessment | 30 | 25% | ~45 min |
| C. AI assessment | 20 | 15% | ~20 min |
| D. Instructor assessment | 20 | 20% | observed during A–B |
| **Total** | **120** | **100%** | **~2h10m** |

Final score = (A+B+C+D)/120 × 100. **Pass = 80 or above.**

## 2. Assessment Scenario

${PLACEHOLDER('Assessment scenario — what learners receive + the 5 tasks (analyse, prepare, conduct, summarise, recommend)')}

## 3. A. Practical Assessment (50 marks)

${PLACEHOLDER('Live simulated assessment — criteria, marks, level descriptors')}

## 4. B. Written Assessment (30 marks)

${PLACEHOLDER('Written advisory summary bundling — sections + marks')}

## 5. C. AI Assessment (20 marks)

${PLACEHOLDER('AI-graded component — scenario questions + short answers')}

## 6. D. Instructor Assessment (20 marks)

${PLACEHOLDER('Professional-conduct criteria: preparation, communication, records, ethics')}

## 7. Scoring Rubric (summary)

| Band | % | Verdict |
|------|-----|---------|
| 90–100 | Outstanding | Certified with honours |
| 80–89 | Competent | Certified |
| 70–79 | Nearly there | Re-assess written only |
| 60–69 | Developing | Re-assess practical + written |
| <60 | Needs support | Full re-sit with mentoring |

## 8. Certification Standard

Pass at **80%+** with **no competency area below 50%** across the ${'7'} certification
competency areas. Certification is logged in the Academy with score breakdown retained
for audit.

## 9. Administration Notes

${PLACEHOLDER('Re-sit rules, fresh scenario sources, assessor materials, audit trail')}
`;
}

function aiCompanionScaffold(m) {
  return `# ${m.code} — Part 5: AI Companion Package (Scaffold)

**Module:** ${m.code} — ${m.title}

Prompt bundles for four AI roles: Tutor, Coach, Feedback, and Grading. Per-lesson
Knowledge Base and Coaching prompts live inside each lesson file; this pack is the
module-level system.

## 1. AI Tutor Prompts (module-level)

**System prompt (AI Tutor):**
${PLACEHOLDER('Module-level AI Tutor system prompt + turn-level templates')}

## 2. AI Coach Prompts (module-level)

**System prompt (AI Coach):**
${PLACEHOLDER('Module-level AI Coach system prompt + drill prompts (role-play, drills, rewrites)')}

## 3. AI Feedback Prompts (module-level)

**System prompt (AI Feedback):**
${PLACEHOLDER('Module-level AI Feedback system prompt + feedback templates')}

## 4. AI Grading Prompts (module-level)

**System prompt (AI Grader):**
${PLACEHOLDER('Module-level AI Grader system prompt + grading templates against the module rubric')}

## 5. Prompt versioning & safety rules

- Never let any AI role alter a CoverScore, a recommendation, or the assessment engine’s
  output (hallucination prevention).
- Never invent client history or industries not in the supplied scenario.
- AI grading informs, never overrides, instructor judgement on ethics and professional conduct.
- Log prompt versions used for every assessment submission.

## 6. Load order

1. AI Tutor + lesson Knowledge Base → concept learning.
2. AI Coach + drills → practice.
3. AI Feedback → refinement.
4. Assessment day: AI Grader + rubric → grading.
5. Instructor runs the final certification decision.

See \`docs/training/cca-105/05-ai-companion/ai-companion-pack.md\` for the completed
reference implementation.
`;
}

function multimediaScaffold(m) {
  return `# ${m.code} — Part 6: Multimedia Production Pack (Scaffold)

**Module:** ${m.code} — ${m.title}

## 1. Video Production Script (per lesson)

Each lesson follows the fixed 6-scene structure (see each lesson file's scene table).
Narration text is supplied separately by the studio; this pack defines format, timing,
and asset requirements.

| Lesson | Runtime target | Scenes | B-roll heavy | Notes |
|--------|----------------|--------|--------------|-------|
${m.lessons.map((l, i) => `| ${i + 1} — ${l} | ~4:15 | 6 | Yes | ${'[Production notes]'} |`).join('\n')}

**Production standard per video:** 16:9, 1080p; captions burned in; title safe 5%;
each scene ends with the next scene's first visual on screen. Follow the shared specs in
\`docs/training/cca-105/06-multimedia/multimedia-production-pack.md\`.

## 2. Slide Production Notes

Use the shared master template and design language from the CCA 105 production pack
(colours, type, contrast, one-idea-per-slide rule). Diagrams reused across the programme
(process flow, matrices, arcs) keep recognition high.

## 3. Graphics List

${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => `| G${i} | ${'[Graphic]'} | ${'[Used in]'} | ${'[Format]'} |`).join('\n')}

## 4. Animations

${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => `| A${i} | ${'[Animation]'} | ${'[Behaviour]'} |`).join('\n')}

**Motion rules:** 300–500 ms transitions; no flashing; honour reduced-motion; urgency
cues never strobe (ethics + accessibility).

## 5. Downloadable Assets (learner pack)

Delivered in one ZIP per learner cohort, mirroring the CCA 105 asset list:
Student Workbook, Worksheets, Templates, Conversation Guides, Practical Tools, Module
Blueprint, Assessment prep brief, sample reports (fictional, marked as training material).

## 6. Asset Quality & QA Checklist

- [ ] Every lesson has 6 scenes with time-coded scene directions
- [ ] Slides meet the one-idea, 18pt+, contrast rules
- [ ] Diagrams consistent across all lessons
- [ ] Animations honour reduced-motion and no-strobe rules
- [ ] Captions reviewed for brand terminology
- [ ] Downloadable assets match 03-resources filenames
- [ ] Sample client data fully fictional and clearly marked
`;
}

// ── write ──────────────────────────────────────────────────────────
function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log('  written ' + rel);
}

for (const m of MODULES) {
  console.log(`\nScaffolding ${m.code} (${m.folder})`);

  write(path.join(m.folder, '00-package-index.md'), packageIndex(m));
  write(path.join(m.folder, '01-module-blueprint.md'), moduleBlueprint(m));

  m.lessons.forEach((l, i) => {
    write(
      path.join(m.folder, '02-lessons', `lesson-${String(i + 1).padStart(2, '0')}.md`),
      lessonScaffold(m, i + 1)
    );
  });

  for (const f of [
    '01-instructor-guide.md',
    '02-student-workbook.md',
    '03-worksheets.md',
    '04-templates.md',
    '05-conversation-guides.md',
    '06-practical-tools.md',
  ]) {
    write(path.join(m.folder, '03-resources', f), resourceScaffold(m, f));
  }

  write(path.join(m.folder, '04-assessment', 'assessment-pack.md'), assessmentScaffold(m));
  write(path.join(m.folder, '05-ai-companion', 'ai-companion-pack.md'), aiCompanionScaffold(m));
  write(path.join(m.folder, '06-multimedia', 'multimedia-production-pack.md'), multimediaScaffold(m));
}

console.log('\nDone. Scaffolded CCA 106, 107, 108 under', ROOT);