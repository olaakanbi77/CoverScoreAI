# CCA 106 — Part 5: AI Companion Package (Scaffold)

**Module:** CCA 106 — Risk Advisory Practice, Business Development & Client Growth

Prompt bundles for four AI roles: Tutor, Coach, Feedback, and Grading. Per-lesson
Knowledge Base and Coaching prompts live inside each lesson file; this pack is the
module-level system.

## 1. AI Tutor Prompts (module-level)

**System prompt (AI Tutor):**
> **Placeholder:** Module-level AI Tutor system prompt + turn-level templates — complete from the module blueprint when supplied.

## 2. AI Coach Prompts (module-level)

**System prompt (AI Coach):**
> **Placeholder:** Module-level AI Coach system prompt + drill prompts (role-play, drills, rewrites) — complete from the module blueprint when supplied.

## 3. AI Feedback Prompts (module-level)

**System prompt (AI Feedback):**
> **Placeholder:** Module-level AI Feedback system prompt + feedback templates — complete from the module blueprint when supplied.

## 4. AI Grading Prompts (module-level)

**System prompt (AI Grader):**
> **Placeholder:** Module-level AI Grader system prompt + grading templates against the module rubric — complete from the module blueprint when supplied.

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

See `docs/training/cca-105/05-ai-companion/ai-companion-pack.md` for the completed
reference implementation.
