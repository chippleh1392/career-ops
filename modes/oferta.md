# Mode: oferta — Full A-G Evaluation

When the candidate pastes an offer (text or URL), always deliver all 7 blocks (A–F evaluation + G legitimacy):

## Step 0 — Archetype detection

Classify the posting into one of the 6 archetypes (see `_shared.md`). If hybrid, name the two closest. This drives:
- Which proof points to prioritize in Block B
- How to rewrite the summary in Block E
- Which STAR stories to prepare in Block F

## Block A — Role summary

Table with:
- Detected archetype
- Domain (platform/agentic/LLMOps/ML/enterprise)
- Function (build/consult/manage/deploy)
- Seniority
- Remote (full/hybrid/onsite)
- Team size (if mentioned)
- One-sentence TL;DR

## Block B — CV match

Read `cv.md`. Build a table mapping each JD requirement to exact CV lines.

**Tailored to archetype:**
- If FDE → prioritize fast delivery and client-facing proof points
- If SA → prioritize system design and integrations
- If PM → prioritize product discovery and metrics
- If LLMOps → prioritize evals, observability, pipelines
- If Agentic → prioritize multi-agent, HITL, orchestration
- If Transformation → prioritize change management, adoption, scaling

**Gaps** section with mitigation strategy for each gap:
1. Hard blocker vs nice-to-have?
2. Can the candidate show adjacent experience?
3. Does a portfolio project cover this gap?
4. Concrete mitigation (cover-letter line, quick project, etc.)

## Block C — Level and strategy

1. **Level signaled in JD** vs **candidate's natural level for that archetype**
2. **"Sell senior without lying" plan**: archetype-specific phrasing, concrete wins to lead with, how to frame founder experience as leverage
3. **"If I'm down-leveled" plan**: accept if comp is fair, negotiate 6‑month review, clear promotion criteria

## Block D — Comp and demand

Use WebSearch for:
- Current salary bands for the role (Glassdoor, Levels.fyi, Blind)
- Company comp reputation
- Role demand trends

Table with facts and cited sources. If data is missing, say so — do not invent.

## Block E — Personalization plan

| # | Section | Current state | Proposed change | Why |
|---|---------|---------------|-----------------|-----|
| 1 | Summary | ... | ... | ... |
| ... | ... | ... | ... | ... |

Top 5 CV changes + Top 5 LinkedIn changes to maximize match.

## Block F — Interview plan

6–10 STAR+R stories mapped to JD requirements (STAR + **Reflection**):

| # | JD requirement | STAR+R story | S | T | A | R | Reflection |
|---|----------------|--------------|---|---|---|---|------------|

The **Reflection** column captures what was learned or what would be done differently. This signals seniority — junior candidates describe what happened, senior candidates extract lessons.

**Story Bank:** If `interview-prep/story-bank.md` exists, check if any of these stories are already there. If not, append new ones. Over time this builds a reusable bank of 5–10 master stories that can be adapted to any interview question.

**Selected and framed by archetype:**
- FDE → emphasize delivery speed and client-facing impact
- SA → emphasize architecture decisions
- PM → emphasize discovery and trade-offs
- LLMOps → emphasize metrics, evals, production hardening
- Agentic → emphasize orchestration, error handling, HITL
- Transformation → emphasize adoption and org change

Also include:
- 1 recommended case study (which project to present and how)
- Red-flag questions and answers (e.g. "why did you sell your company?", "do you manage reports?")

## Block G — Posting legitimacy

Analyze the job posting for signals that indicate whether this is a real, active opening. This helps the user prioritize their effort on opportunities most likely to result in a hiring process.

**Ethical framing:** Present observations, not accusations. Every signal has legitimate explanations. The user decides how to weigh them.

### Signals to analyze (in order):

**1. Posting freshness** (from Playwright snapshot, already captured in Step 0):
- Date posted or "X days ago" — extract from page
- Apply button state (active / closed / missing / redirects to generic page)
- If URL redirected to generic careers page, note it

**2. Description quality** (from JD text):
- Does it name specific technologies, frameworks, tools?
- Does it mention team size, reporting structure, or org context?
- Are requirements realistic? (years of experience vs technology age)
- Is there clear scope for the first 6–12 months?
- Is salary/compensation mentioned?
- What ratio of the JD is role-specific vs generic boilerplate?
- Any internal contradictions? (entry-level title + staff requirements, etc.)

**3. Company hiring signals** (2–3 WebSearch queries, combine with Block D research):
- Search: `"{company}" layoffs {year}` — note date, scale, departments
- Search: `"{company}" hiring freeze {year}` — note any announcements
- If layoffs found: are they in the same department as this role?

**4. Reposting detection** (from scan-history.tsv):
- Check if company + similar role title appeared before with a different URL
- Note how many times and over what period

**5. Role market context** (qualitative, no additional queries):
- Is this a common role that typically fills in 4–6 weeks?
- Does the role make sense for this company's business?
- Is the seniority level one that legitimately takes longer to fill?

### Output format:

**Assessment:** One of three tiers:
- **High Confidence** — Multiple signals suggest a real, active opening
- **Proceed with Caution** — Mixed signals worth noting
- **Suspicious** — Multiple ghost-job indicators; investigate before investing time

**Signals table:** Each signal observed with its finding and weight (Positive / Neutral / Concerning).

**Context notes:** Any caveats (niche role, government job, evergreen position, etc.) that explain potentially concerning signals.

### Edge case handling:
- **Government/academic postings:** Longer timelines are standard. Adjust thresholds (60–90 days is normal).
- **Evergreen/continuous hire postings:** If the JD explicitly says "ongoing" or "rolling," note it as context — this is not a ghost job, it is a pipeline role.
- **Niche/executive roles:** Staff+, VP, Director, or highly specialized roles legitimately stay open for months. Adjust age thresholds accordingly.
- **Startup / pre-revenue:** Early-stage companies may have vague JDs because the role is genuinely undefined. Weight description vagueness less heavily.
- **No date available:** If posting age cannot be determined and no other signals are concerning, default to "Proceed with Caution" with a note that limited data was available. NEVER default to "Suspicious" without evidence.
- **Recruiter-sourced (no public posting):** Freshness signals unavailable. Note that active recruiter contact is itself a positive legitimacy signal.

---

## Post-evaluation

**ALWAYS** after generating blocks A–G:

### 1. Save report .md

Save the full evaluation to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`.

- `{###}` = next sequential number (3 digits, zero-padded)
- `{company-slug}` = company name lowercase, spaces → hyphens
- `{YYYY-MM-DD}` = current date

**Report format:**

```markdown
# Evaluation: {Company} — {Role}

**Date:** {YYYY-MM-DD}
**Archetype:** {detected}
**Score:** {X/5}
**URL:** {posting URL, or note if pasted-text JD only}
**PDF:** {path or pending}
**Legitimacy:** {High Confidence | Proceed with Caution | Suspicious}

---

## A) Role summary
(full content of Block A)

## B) CV match
(full content of Block B)

## C) Level and strategy
(full content of Block C)

## D) Comp and demand
(full content of Block D)

## E) Personalization plan
(full content of Block E)

## F) Interview plan
(full content of Block F)

## G) Posting legitimacy
(full content of Block G)

## H) Draft application answers
(only if score >= 4.5 — draft answers for the application form)

---

## Keywords extracted
(list of 15–20 JD keywords for ATS optimization)
```

### 2. Register in tracker

**ALWAYS** register in `data/applications.md`:
- Next sequential number
- Current date
- Company
- Role
- Score: average match (1–5)
- Status: `Evaluated` (canonical — see `templates/states.yml`)
- PDF: ❌ (or ✅ if auto-pipeline produced PDF)
- Report: relative link to the .md report (e.g. `[001](reports/001-company-2026-01-01.md)`)

**Tracker table columns:**

```markdown
| # | Date | Company | Role | Score | Status | PDF | Report |
```
