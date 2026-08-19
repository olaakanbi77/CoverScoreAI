# CCA 105 — Lesson 2: Understanding CoverScore Assessments

**Module:** CCA 105 — Practical Risk Advisory & Client Assessment
**Video duration:** ~45 minutes | **Workshop:** ~20 minutes | **Independent:** ~15 minutes

---

## 1. Lesson Overview

Before a learner can interpret a report, they must understand what generated it. This
lesson unpacks the CoverScore Assessment™: how it is delivered, how questions are
answered, how scoring works, what the engine computes, and what data quality really
means. Learners learn to spot weak or low-confidence assessments — and why the quality
of answers determines the quality of the advice.

## 2. Learning Objectives

By the end of this lesson, learners will be able to:

1. Explain how a client experiences the CoverScore Assessment (delivery, flow, answer types).
2. Describe how the CoverScore™ is computed and what the score bands mean.
3. Identify what the assessment does NOT capture and where guesswork enters.
4. Recognise signs of a low-quality assessment and know how to respond.
5. Explain the role of the CCIE and RIE in producing assessment output.

## 3. Avatar Script and Scene Directions

> **Studio note:** The narration below is the approved production script for this lesson
> (CCA 105 — Complete Lesson Production Scripts, Lesson 2). Scene directions define the
> visuals; use the narration exactly as written.

### Scene 1 — What Is a CoverScore Assessment? (0:00–1:00)

> "A CoverScore assessment is a structured risk-discovery instrument.
>
> It collects information about the client's environment, operations, vulnerabilities and
> existing controls.
>
> It then translates those responses into structured risk intelligence."

**Visual:** Animated WhatsApp phone showing a client tapping through assessment
questions; overlay: "7 minutes, on the client's phone."

**On-screen:**
> **Assessment = Evidence** — not — **Assessment = Final Truth**

### Scene 2 — The Five Layers (1:00–2:20)

**Visual:** A CoverScore assessment contains five important layers:

1. **Client Context**
2. **Risk Evidence**
3. **Risk Pillars**
4. **Overall CoverScore**
5. **Recommended Improvement Areas**

**Client Context** — industry; location; size; stage; operating model; exposure profile.

**Risk Evidence** — accidents; absence of procedures; weak controls; existing insurance;
operational practices.

**Risk Pillars** — these group evidence into meaningful risk categories.

**CoverScore** — the overall resilience indicator.

**Improvement Areas** — actions that could improve resilience.

### Scene 3 — Reading Flourish College (2:20–3:20)

**Visual:** Show the Flourish College assessment.

> "Let's examine Florence's assessment."

**On-screen:**
- Property Protection — **5%**
- Transport Safety — **43%**
- Business Continuity — **35%**
- Student Safety — **32%**
- Regulatory Readiness — **30%**
- Overall CoverScore — **18**

### Scene 4 — The Lowest Score Trap (3:20–4:00)

**Question (on screen):**

> Does the 5% Property Protection score automatically mean: "Sell Fire Insurance"?
> A. Yes
> B. No

**Answer: B**

> "The score tells you where the vulnerability appears strongest.
>
> It does not tell you everything about the exposure.
>
> You must investigate."

### Scene 5 — Evidence vs Assumption (4:00–4:40)

**Visual:**

> **EVIDENCE:** "No comprehensive Fire Insurance."
> **ASSUMPTION:** "The school has no property protection whatsoever."

> "The second statement may or may not be true.
>
> A professional Advisor does not fill information gaps with assumptions."

### Scene 6 — Assessment Limitations (4:40–5:40)

> "An assessment is powerful, but it has boundaries."

**Visual:** It may not fully know: actual building values; construction details; exact
asset values; hidden controls; staff behaviour; informal procedures; recent changes;
management priorities; financial constraints.

> "This is why the Advisor exists."

**Knowledge check (on screen):**

> A CoverScore of 18 means:
> A. The client is a bad business owner.
> B. The client has an 18% chance of suffering a loss.
> C. The assessment indicates significant resilience gaps based on available information.
> D. The client must buy insurance.

**Answer: C**

### Lesson Close (5:40–6:00)

> "The assessment tells you where to look.
>
> It does not remove the need to look."

**B-roll / assets required:** mock WhatsApp chatbot animation, five-layer graphic,
Flourish College pillar card, evidence-vs-assumption card, assessment limitations list.
**Delivery notes:** teaching tone; slow down on the "lowest score trap" and the
evidence-vs-assumption distinction; never suggest the score is a final verdict.

## 4. Slide Deck Storyboard

| Slide | Title | Content / Visual |
|-------|-------|------------------|
| 1 | Understanding the Assessment | Lesson objectives |
| 2 | How the Client Experiences It | Delivery via WhatsApp/web; answer types (yes/no, scale, choice, input) |
| 3 | Question Flow (CCIE) | State-machine diagram; validation; branching |
| 4 | What the Engine Computes | Pillar scores → overall score → risk level → exposure → resilience |
| 5 | The Score Formula (Conceptual) | Score = 100 × (safe weight / total weight); unanswered excluded |
| 6 | Score Bands | Six bands table with guidance |
| 7 | Assessment Domains | 15+ prefixes grid |
| 8 | The Follow-up Layer (RIE) | Product mapping, opportunity score, brief, follow-up |
| 9 | Data Quality Matters | Confidence levels; signs of weak assessments |
| 10 | Key Takeaways | 4 takeaway points |

## 5. Learner Handbook

### 5.1 How the client experiences the assessment

The assessment runs as a guided conversation — typically over WhatsApp. A client opts-in
(or the advisor sends a link), the CCIE greets them, and a sequence of questions follows,
one at a time. Answer types include yes/no, yes/no/not-sure, multiple choice, numeric
scales, and short inputs. Each answer is validated; the flow branches based on answers.
Typical completion: 5–10 minutes.

### 5.2 How scoring works (conceptual)

Each question carries weight. Answers that indicate protection earn "safe" weight; answers
that indicate exposure earn risk weight. The engine computes:

```
Score = 100 × (safe weight / total weight of answered questions)
```

Unanswered questions are excluded — which is why a short, rushed assessment can score
artificially high. The overall CoverScore™ is then labelled with a band:

| Band | Range | Meaning |
|------|-------|---------|
| Highly Resilient | 80–100 | Strong protection; opportunities to refine |
| Moderately Resilient | 60–79 | Solid foundations; meaningful improvement available |
| Needs Improvement | 40–59 | Important gaps; prioritised action needed |
| High Risk | 20–39 | Significant exposure; urgent prioritised attention |
| Critical Risk | 0–19 | Severe exposure; immediate focused action required |

The engine also computes exposure estimates, current resilience, per-pillar scores, and a
risk fingerprint.

### 5.3 What the assessment does not capture

- Emotions, anxieties, and family dynamics (only the advisor can surface these).
- Ambiguity in answers the client didn't understand.
- Recent changes that happened after the assessment date.
- Data the client did not have to hand (e.g., exact sum assured on an old policy).
- Intent — a client may answer aspirationally ("I plan to get cover") rather than
  factually ("I have cover").

### 5.4 Assessment confidence and data quality

Three confidence levels: **High** (complete data, clear answers), **Medium** (some
estimated or unclear data), **Low** (significant gaps, rushed or skipped answers).
Signs of a low-quality assessment:

- Very short completion time.
- Many "not sure" answers or skipped questions.
- Sparse detail in free-text answers.
- Answers that contradict known facts about the client.
- Brand-new or unvalidated phone numbers/contacts.

Never present a low-confidence assessment as definitive. Book the review, confirm the
details conversationally, and update the record.

### 5.5 The RIE layer that follows

After scoring, the Risk Intelligence Engine adds: product mapping (which protections the
gaps suggest), an opportunity score (0–100 lead potential), the Advisor Copilot Brief,
quote pre-building, follow-up scheduling, and a learning loop that improves accuracy over
time.

## 6. Practical Exercises

**Exercise 2.1 — Read two assessments (20 min)**
Compare the fictional records below. For each: estimate confidence, list warning signs,
and note which scores you would trust (with reasons).

- Record A: completed in 6 minutes, 34 answers, 2 "not sure", all questions answered.
- Record B: completed in 2.5 minutes, 19 answers, 8 "not sure", 6 questions skipped.

**Exercise 2.2 — Explain the score (10 min)**
Explain to a non-technical colleague why an assessment with many skipped questions can
score *too high*, and why that matters before a Risk Review.

**Exercise 2.3 — The question you would ask (10 min)**
For a client whose assessment says "no business interruption cover", write the single
most important discovery question you would ask to verify the score is based on fact,
not misunderstanding.

## 7. Case Study

**Scenario:** A manufacturing client (MFG prefix) completed the assessment during a
power outage on a mobile phone with a slow connection. The record shows 9 questions
skipped, 5 "not sure" answers, and completion in 3 minutes. The system assigned a
Moderately Resilient band (62) and generated an Advisor Brief that says "client is making progress
on protection." You know from the industry that this plant runs three shifts on imported
machinery and has no maintenance contract and a single supplier for spare parts.

**Tasks:**
1. What confidence level would you assign this assessment? Why?
2. Which scores (total, pillar, resilience) would you treat as unreliable?
3. Prepare the 4–5 discovery questions you would ask in the Risk Review to close the
   information gaps.
4. How would you word the "confidence" caveat when you first speak to the client —
   without alarming them or suggesting the system made a mistake?

## 8. Knowledge Check

1. The CoverScore™ is primarily computed from:
   a. The client's age and income only
   b. The weighted answers to assessment questions *(correct)*
   c. The number of policies the advisor mentions *(incorrect)*
   d. Randomised scoring *(incorrect)*

2. Which score band applies to a cover score of 48?
   a. Highly Resilient
   b. Moderately Resilient
   c. Needs Improvement *(correct)*
   d. Critical Risk

3. Unanswered questions are:
   a. Charged double weight
   b. Excluded from scoring *(correct)*
   c. Counted as risks
   d. Automatically answered "yes"

4. A sign of a low-confidence assessment is:
   a. A very short completion time with many skipped questions *(correct)*
   b. All questions answered in 9 minutes *(incorrect)*
   c. Detailed free-text answers *(incorrect)*
   d. A high resilience score *(incorrect)*

5. What does the RIE do after scoring?
   a. Books the client a tax appointment
   b. Maps gaps to products, scores opportunity, and generates the Advisor Brief™ *(correct)*
   c. Decides the client's premium by itself *(incorrect)*
   d. Sends reminders to the advisor's manager *(incorrect)*

**Answers:** 1-b, 2-c, 3-b, 4-a, 5-b.

## 9. AI Tutor Knowledge Base

- **KB-2.1 Assessment delivery:** The assessment runs as a guided conversation (WhatsApp
  or web) with single-question-at-a-time flow, answer validation, and branching. Prefix
  system: SME, HOS, MFG, SCH, CHR, CON, TRN, INC, HLT, FAM, YPR, RET, ENT, HOM, MOT.
- **KB-2.2 Scoring formula:** Score = 100 × (safeWeight / totalWeight of answered
  questions). Unanswered questions are excluded, so completeness matters for accuracy.
- **KB-2.3 Bands (canonical):** Highly Resilient (80–100), Moderately Resilient
  (60–79), Needs Improvement (40–59), High Risk (20–39), Critical Risk (0–19).
- **KB-2.4 What scores are produced:** overall CoverScore™, per-pillar scores, risk
  level, exposure estimate, resilience score, risk fingerprint, priority risks,
  improvement potential, estimated loss.
- **KB-2.5 Confidence levels:** High / Medium / Low. Low-confidence assessments must be
  verified in conversation; never present them as definitive.
- **KB-2.6 RIE added layer:** product mapping, opportunity score (0–100), Advisor
  Copilot Brief, quote pre-builder, follow-up engine, learning engine.

## 10. AI Coaching Prompts

- **Prompt 2.1 (Explain):** "Ask the learner to explain the CoverScore™ scoring formula
  in plain English as if to a new colleague. Check they mention that unanswered questions
  are excluded and that completeness affects accuracy."
- **Prompt 2.2 (Quality triage):** "Give the learner three assessment summaries (long/complete,
  medium, rushed). Ask them to assign a confidence level to each, justify it, and list
  the discovery questions they would ask to close gaps."
- **Prompt 2.3 (Band drill):** "Quiz the learner with random scores and ask them to name
  the band and one-word guidance for each. Keep going until five correct in a row."

## 11. Lesson Completion Standard

This lesson is complete when learners can:
- Explain the scoring formula conceptually and why skipped questions distort it.
- Name all five score bands with their ranges and meanings.
- Assign a confidence level to a sample assessment and justify it.
- List at least four things an assessment does not capture.
- Explain the difference between assessment evidence and advisor assumption.

## 12. Final Takeaway

A number you do not understand is dangerous; a number you trust blindly is worse. Know
how the score was built, know how reliable it is, and verify what matters before you
advise on it. The assessment is a powerful start — never a substitute for your
professional curiosity.