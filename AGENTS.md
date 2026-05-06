# AGENTS.md

## Purpose

This repo is a job-search operating system. Claude Code is the native workflow, but Codex can use the same file-based system if it follows the rules below.

## Start-of-session checks

Before doing anything else, silently verify that these files exist:

- `cv.md`
- `config/profile.yml`
- `portals.yml`
- `data/applications.md`

If any are missing, create them before running evaluations or scans.

## Sources of truth

- `cv.md` is the canonical resume source.
- `article-digest.md` contains higher-signal proof points and framing.
- `config/profile.yml` is the canonical identity, target-role, and search-strategy file.
- `portals.yml` controls scanner keywords, search queries, and tracked companies.

Do not invent experience or metrics. If a number is missing, leave it out or mark it for follow-up.

## Current candidate profile

- Candidate: Cristofer Hippleheuser
- Two-lane search (see `modes/_profile.md` + `config/profile.yml` → `search_strategy`):
  - **Lane A (commerce / Shopify / ecommerce web):** target **Senior+** (Senior, Lead, Staff when the JD is truly commerce-shaped)—this is where depth matches title.
  - **Lane B (general product frontend):** target **mid-level** by default (e.g. SE I/II, Frontend Engineer without “Senior”)—several YOE, not new grad; avoid generic **Senior FE** here unless there is a **strong, explicit** fit argument (recruiters often discount a commerce CV for those reqs).
- Strongest themes:
  - commercial frontend execution
  - accessibility and performance
  - analytics, experimentation, and cross-functional delivery
  - pragmatic AI-assisted development
- Real constraints:
  - remote-first preference
  - selective DFW hybrid is acceptable for strong roles
  - LeetCode-heavy loops carry real prep cost and should be evaluated consciously

## Mode mapping

Claude uses slash commands from `.claude/skills/career-ops/SKILL.md`.

Codex should map natural-language requests to the same underlying mode files:

- "Evaluate this job" -> `modes/auto-pipeline.md`
- "Scan for jobs" -> `modes/scan.md`
- "Generate a tailored PDF" -> `modes/pdf.md`
- "Show tracker status" -> `modes/tracker.md`
- "Process my pipeline" -> `modes/pipeline.md`
- "Batch process these jobs" -> `modes/batch.md`

When a mode requires shared context, read both:

- `modes/_shared.md`
- `modes/{mode}.md`

## Agent compatibility notes

- Claude-native features:
  - slash-command routing in `.claude/skills/`
- Codex-compatible today:
  - all markdown, YAML, tracker, report, and PDF source files
  - manual or shell-driven execution of evaluations and tracker updates
  - natural-language use of the mode files
  - standalone batch processing through `batch/batch-runner.sh --agent codex`
- Shared batch runner:
  - `batch/batch-runner.sh --agent claude`
  - `batch/batch-runner.sh --agent codex`
  - `batch/batch-runner.sh --agent manual`

## Tracker rules

- Never add new tracker rows by directly hand-editing the table if the workflow already expects TSV additions and merge scripts.
- Do update existing status or notes in `data/applications.md` when needed.
- Keep statuses aligned with `templates/states.yml`.
- **Structured events (analytics):** `data/tracker-events.jsonl` stores one JSON object per line (`status`, `gmail_ack`, `gmail_rejection`, etc.). After changing Notes with dated status lines, run `npm run tracker:events:backfill` to merge inferred events. `gmail-tracker-audit.mjs` appends `gmail_*` events automatically when it updates Notes. **`npm run search:health`** prints timing/funnel JSON to stdout; **`npm run search:health:report`** writes `output/search-health.json` plus a short console summary. **`npm run web`** then open **`/search-health`** or **`/api/search-health`** for the chart view (facts only — compare to market research yourself).

### Status change log (forward-only)

Whenever you change the **`Status`** column for an existing row (e.g. `Evaluated` → `Applied`, → `Rejected`, etc.):

1. Set **`Status`** to the new canonical value from `templates/states.yml`.
2. **Prepend** one line to **`Notes`** (same table cell), before any existing text:  
   `{YYYY-MM-DD}: {NewStatus}. `  
   Example after applying: `2026-04-30: Applied. Strong commerce lane…`
3. Use **date only** (no time). Prefer **today’s date** from the environment when the user reports the change; if unclear, ask once.
4. **Do not rewrite or remove** earlier `YYYY-MM-DD: Status.` prefixes already in `Notes`—they form the trail.
5. New rows from merge/eval still use the existing **`Date`** column for the evaluation date; this log is for **transitions after** the row exists.

Rationale: there are no separate `applied_at` columns today; this keeps an explicit, grep-friendly history in-repo without relying on agent memory.

## Gmail API (canonical — not MCP)

Inbox reads and tracker evidence use the **Gmail API** from this repo. **Do not** rely on a Gmail MCP or IDE “Gmail tools” for this workflow.

- **Scripts:** `gmail.mjs` (OAuth + search), `gmail-tracker-audit.mjs` (backfill ack/rejection lines into `data/applications.md` Notes for non-`Evaluated` rows).
- **npm:** `npm run gmail:auth`, `npm run gmail:search -- "<gmail-query>"`, `npm run gmail:audit`
- **Secrets (gitignored):** `private/client_secret*.json` (Google OAuth client), `private/gmail-token.json` (refresh token). Optional env: `GMAIL_CLIENT_SECRET_JSON`, `GMAIL_TOKEN_JSON`, `GMAIL_MAX_RESULTS` (default 10, max 100 for search).
- **First-time auth:** `node gmail.mjs auth` (or `npm run gmail:auth`) — completes OAuth; token saved to `private/gmail-token.json`.
- **Search examples:** `node gmail.mjs search "from:acme.com newer_than:14d"` — query syntax matches the Gmail search box.
- **After manual Notes edits** (including Gmail-derived lines): `npm run tracker:events:backfill`. The audit script merges `gmail_*` events when it writes Notes.

Agents should **`run_terminal_cmd`** these commands rather than assuming an MCP is available.

## Safety

- Never submit an application automatically.
- Never inflate qualifications.
- Prefer fewer, higher-fit applications over mass volume.
