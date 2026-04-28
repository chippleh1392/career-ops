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

## Cursor MCP handoff — Gmail (Apr 2026)

- **Config:** User’s **Gmail MCP** is in global `~/.cursor/mcp.json` (hosted URL `https://gmailmcp.googleapis.com/mcp/v1`), with OAuth client credentials inlined locally (treat as secret; do not commit or paste into chat).
- **Google Cloud:** OAuth consent screen was moved **out of Testing** (**published** / in production) so consent is not limited to test users.
- **Cursor UI:** **Tools → gmail** shows **on**, green, **10 tools**, **Logout** — indicates IDE-side connection.
- **Agent limitation:** In some **Composer / agent sessions**, `call_mcp_tool` for `user-gmail` **does not appear** in the tool list (`user-gmail-search_threads not found` while Figma/Shopify/browser still work). **Publishing GCP does not fix that** — it is session/host wiring, not consent.
- **How to verify:** New **Agent** message in this project; or **Logout** next to gmail and re-auth after publish; ask the agent to run **`search_threads`** with something small (e.g. `newer_than:7d`, `pageSize` 5) and return subjects only.
- **Planned follow-up (when Gmail tools are callable):** Optional **tracker backfill** — search Gmail for application/reply threads, propose matches for rows past `Evaluated`, user confirms, then prepend `{YYYY-MM-DD}: {Status}.` to **Notes** per **Status change log** above.

## Safety

- Never submit an application automatically.
- Never inflate qualifications.
- Prefer fewer, higher-fit applications over mass volume.
