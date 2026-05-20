# Mode: auto-pipeline — Full Automatic Pipeline

When the user pastes a JD (text or URL) without an explicit sub-command, run the **entire** pipeline in sequence:

## Step 0 — Extract JD

If the input is a **URL** (not pasted JD text), use this strategy to extract content:

**Priority order:**

1. **Playwright (preferred):** Most job boards (Lever, Ashby, Greenhouse, Workday) are SPAs. Use `browser_navigate` + `browser_snapshot` to render and read the JD.
2. **WebFetch (fallback):** Static pages (ZipRecruiter, company career pages).
3. **WebSearch (last resort):** Search role title + company on secondary portals that index the JD in static HTML.

**If nothing works:** Ask the candidate to paste the JD manually or share a screenshot.

**If the input is JD text** (not a URL): use it directly; no fetch needed.

## Step 1 — A–G evaluation
Run exactly like `oferta` mode (read `modes/oferta.md` for blocks A–F + Block G Posting Legitimacy).

## Step 2 — Save report .md
Save the full evaluation to `reports/{###}-{company-slug}-{YYYY-MM-DD}.md` (format in `modes/oferta.md`).
Include Block G in the saved report. Add `**Legitimacy:** {tier}` to the report header.

## Step 3 — Generate PDF
Read `config/profile.yml`. Check `cv.output_format`:

- If `"latex"`, run the full pipeline from `modes/latex.md`
- Otherwise (default), run the full pipeline from `modes/pdf.md`

## Step 4 — Draft application answers (only if score >= 4.5)

If the final score is >= 4.5, draft application form answers:

1. **Extract form questions**: Use Playwright to open the form and snapshot. If not extractable, use generic questions.
2. **Generate answers** following the tone below.
3. **Save in the report** as section `## H) Draft Application Answers`.

### Generic questions (if the form can't be extracted)

- Why are you interested in this role?
- Why do you want to work at [Company]?
- Tell us about a relevant project or achievement
- What makes you a good fit for this position?
- How did you hear about this role?

### Tone for form answers

**Position: "I'm choosing you."** The candidate has options and is choosing this company for concrete reasons.

**Tone rules:**
- **Confident without arrogance**: "I've spent the past year building production AI agent systems — your role is where I want to apply that experience next"
- **Selective without superiority**: "I've been intentional about finding a team where I can contribute meaningfully from day one"
- **Specific and concrete**: Always reference something REAL from the JD or company, and something REAL from the candidate's experience
- **Direct, no fluff**: 2–4 sentences per answer. No "I'm passionate about..." or "I would love the opportunity to..."
- **Proof over claims**: Instead of "I'm great at X", say "I built X that does Y"

**Framework by question:**
- **Why this role?** → "Your [specific thing] maps directly to [specific thing I built]."
- **Why this company?** → Something concrete about the company. "I've been using [product] for [time/purpose]."
- **Relevant experience?** → One quantified proof point.
- **Good fit?** → "I sit at the intersection of [A] and [B], which is exactly where this role lives."
- **How did you hear?** → Honest: "Found through [portal/scan], evaluated against my criteria, and it scored highest."

**Language**: Always match the JD language (EN default). Apply `/tech-translate` when needed.

## Step 5 — Update tracker
Record in `data/applications.md` with all columns including Report and PDF ✅/❌.

**If any step fails**, continue with the rest and mark the failed step as pending in the tracker.
