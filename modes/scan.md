# Mode: scan — Portal Scanner (Job Discovery)

Scan configured job portals, filter by title relevance, and add new postings to the pipeline for later evaluation.

> **Note (v1.5+):** The default scanner (`scan.mjs` / `npm run scan`) is **zero-token** and only queries Greenhouse, Ashby, and Lever public APIs directly. The Playwright/WebSearch tiers described below are the **agent** flow (run by Claude/Codex), not what `scan.mjs` does. If a company has no Greenhouse/Ashby/Lever API, `scan.mjs` ignores it; in those cases, the agent must complete Tier 1 (Playwright) or Tier 3 (WebSearch) manually.

## Recommended execution

Run as a subagent so the main conversation does not burn context:

```
Agent(
    subagent_type="general-purpose",
    prompt="[content of this file + specific inputs]",
    run_in_background=True
)
```

## Configuration

Read `portals.yml`, which contains:
- `search_queries`: List of WebSearch queries with `site:` filters per portal (broad discovery)
- `tracked_companies`: Specific companies with `careers_url` for direct navigation
- `title_filter`: `positive` / `negative` / `seniority_boost` keywords for title filtering

## Discovery strategy (3 tiers)

### Tier 1 — Direct Playwright (PRIMARY)

**For each company in `tracked_companies`:** Navigate to its `careers_url` with Playwright (`browser_navigate` + `browser_snapshot`), read EVERY visible job listing, and extract title + URL for each. This is the most reliable method because:
- It sees the page in real time (not cached Google results)
- Works with SPAs (Ashby, Lever, Workday)
- Detects brand-new postings instantly
- Does not depend on Google indexing

**Every company MUST have `careers_url` in portals.yml.** If missing, find it once, save it, and reuse on future scans.

### Tier 2 — ATS APIs / Feeds (COMPLEMENTARY)

For companies with a public API or structured feed, use the JSON/XML response as a fast complement to Tier 1. It is faster than Playwright and reduces visual-scraping errors.

**Current support (variables in `{}`):**
- **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- **Ashby**: `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR**: list `https://{company}.bamboohr.com/careers/list`; single posting detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Lever**: `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor**: `https://{company}.teamtailor.com/jobs.rss`
- **Workday**: `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**Parsing convention by provider:**
- `greenhouse`: `jobs[]` → `title`, `absolute_url`
- `ashby`: GraphQL `ApiJobBoardWithTeams` with `organizationHostedJobsPageName={company}` → `jobBoard.jobPostings[]` (`title`, `id`; build public URL if not in payload)
- `bamboohr`: list `result[]` → `jobOpeningName`, `id`; build detail URL `https://{company}.bamboohr.com/careers/{id}/detail`; for full JD, GET detail and use `result.jobOpening` (`jobOpeningName`, `description`, `datePosted`, `minimumExperience`, `compensation`, `jobOpeningShareUrl`)
- `lever`: root array `[]` → `text`, `hostedUrl` (fallback: `applyUrl`)
- `teamtailor`: RSS items → `title`, `link`
- `workday`: `jobPostings[]` / `jobPostings` (tenant-dependent) → `title`, `externalPath` or URL built from host

### Tier 3 — WebSearch queries (BROAD DISCOVERY)

`search_queries` with `site:` filters cover portals horizontally (all Ashby, all Greenhouse, etc.). Useful to discover NEW companies not yet in `tracked_companies`, but results may be stale.

**Execution priority:**
1. Tier 1: Playwright → all `tracked_companies` with `careers_url`
2. Tier 2: API → all `tracked_companies` with `api:`
3. Tier 3: WebSearch → all `search_queries` with `enabled: true`

Tiers are additive — run all of them; merge results and deduplicate.

## Workflow

1. **Read configuration**: `portals.yml`
2. **Read history**: `data/scan-history.tsv` → URLs already seen
3. **Read dedup sources**: `data/applications.md` + `data/pipeline.md`

4. **Tier 1 — Playwright scan** (parallel in batches of 3–5):
   For each company in `tracked_companies` with `enabled: true` and defined `careers_url`:
   a. `browser_navigate` to `careers_url`
   b. `browser_snapshot` to read every job listing
   c. If the page has filters/departments, navigate relevant sections
   d. For each listing extract: `{title, url, company}`
   e. If the page paginates, navigate additional pages
   f. Accumulate into candidate list
   g. If `careers_url` fails (404, redirect), try `scan_query` as fallback and note to update the URL

5. **Tier 2 — ATS APIs / feeds** (parallel):
   For each company in `tracked_companies` with defined `api:` and `enabled: true`:
   a. WebFetch the API/feed URL
   b. If `api_provider` is set, use its parser; otherwise infer by domain (`boards-api.greenhouse.io`, `jobs.ashbyhq.com`, `api.lever.co`, `*.bamboohr.com`, `*.teamtailor.com`, `*.myworkdayjobs.com`)
   c. For **Ashby**, send POST with:
      - `operationName: ApiJobBoardWithTeams`
      - `variables.organizationHostedJobsPageName: {company}`
      - GraphQL query for `jobBoardWithTeams` + `jobPostings { id title locationName employmentType compensationTierSummary }`
   d. For **BambooHR**, the list only returns basic metadata. For each relevant item, read `id`, GET `https://{company}.bamboohr.com/careers/{id}/detail`, and extract the full JD from `result.jobOpening`. Use `jobOpeningShareUrl` as public URL if present; otherwise use the detail URL.
   e. For **Workday**, send JSON POST with at least `{"appliedFacets":{},"limit":20,"offset":0,"searchText":""}` and paginate with `offset` until exhausted
   f. For each job extract and normalize: `{title, url, company}`
   g. Accumulate into candidate list (dedupe with Tier 1)

6. **Tier 3 — WebSearch queries** (parallel if possible):
   For each query in `search_queries` with `enabled: true`:
   a. Run WebSearch with the defined `query`
   b. From each result extract: `{title, url, company}`
      - **title**: from result title (before `" @ "` or `" | "`)
      - **url**: result URL
      - **company**: after `" @ "` in title, or from domain/path
   c. Accumulate into candidate list (dedupe with Tier 1+2)

7. **Filter by title** using `title_filter` from `portals.yml`:
   - At least 1 keyword from `positive` must appear in title (case-insensitive)
   - 0 keywords from `negative` may appear
   - `seniority_boost` keywords add priority but are not mandatory

8. **Deduplicate** against three sources:
   - `scan-history.tsv` → exact URL already seen
   - `applications.md` → company + normalized role already evaluated
   - `pipeline.md` → exact URL already under ## Pending or ## Processed

9. **Verify liveness for WebSearch results (Tier 3)** — BEFORE adding to pipeline:

   WebSearch results can be stale (Google may cache for weeks or months). To avoid evaluating expired postings, verify with Playwright every new URL that came from Tier 3. Tiers 1 and 2 are inherently real-time and do not need this check.

   For each new Tier 3 URL (sequential — NEVER parallel Playwright):
   a. `browser_navigate` to URL
   b. `browser_snapshot` to read content
   c. Classify:
      - **Active**: role title visible + role description + visible Apply/Submit control in main content. Do not count generic header/navbar/footer text.
      - **Expired** (any of):
        - Final URL contains `?error=true` (Greenhouse redirects like this when closed)
        - Page contains: "job no longer available" / "no longer open" / "position has been filled" / "this job has expired" / "page not found"
        - Only navbar and footer visible, no JD body (body text < ~300 chars)
   d. If expired: log in `scan-history.tsv` with status `skipped_expired` and discard
   e. If active: continue to step 10

   **Do not abort the entire scan when one URL fails.** If `browser_navigate` errors (timeout, 403, etc.), mark `skipped_expired` and continue with the next.

10. **For each new verified posting that passes filters:**
    a. Add to `pipeline.md` under ## Pending: `- [ ] {url} | {company} | {title}`
    b. Log in `scan-history.tsv`: `{url}\t{date}\t{query_name}\t{title}\t{company}\tadded`

11. **Title-filtered postings**: log in `scan-history.tsv` with status `skipped_title`
12. **Duplicate postings**: log with status `skipped_dup`
13. **Expired postings (Tier 3)**: log with status `skipped_expired`

## Extracting title and company from WebSearch results

WebSearch titles often look like `"Job Title @ Company"` or `"Job Title | Company"` or `"Job Title — Company"`.

Patterns by portal:
- **Ashby**: `"Senior AI PM (Remote) @ EverAI"` → title: `Senior AI PM`, company: `EverAI`
- **Greenhouse**: `"AI Engineer at Anthropic"` → title: `AI Engineer`, company: `Anthropic`
- **Lever**: `"Product Manager - AI @ Temporal"` → title: `Product Manager - AI`, company: `Temporal`

Generic regex: `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## Private URLs

If you find a URL that is not publicly accessible:
1. Save the JD to `jds/{company}-{role-slug}.md`
2. Add to pipeline.md as: `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

## Scan history

`data/scan-history.tsv` tracks EVERY URL seen:

```
url	first_seen	portal	title	company	status
https://...	2026-02-10	Ashby — AI PM	PM AI	Acme	added
https://...	2026-02-10	Greenhouse — SA	Junior Dev	BigCo	skipped_title
https://...	2026-02-10	Ashby — AI PM	SA AI	OldCo	skipped_dup
https://...	2026-02-10	WebSearch — AI PM	PM AI	ClosedCo	skipped_expired
```

## Output summary

```
Portal Scan — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries executed: N
Postings found: N total
Title-filtered: N relevant
Duplicates: N (already evaluated or in pipeline)
Expired discarded: N (dead links, Tier 3)
New rows added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...

→ Run /career-ops pipeline to evaluate new postings.
```

## Managing careers_url

Each entry in `tracked_companies` should have `careers_url` — the direct URL to its jobs page. This avoids hunting it down every run.

**RULE: Prefer the company's corporate careers page; use the ATS endpoint only when there is no proper corporate page.**

`careers_url` should point to the company's own employment page whenever available. Many companies run Workday, Greenhouse, or Lever underneath but only expose vacancy IDs through the corporate domain. Using a bare ATS URL when a corporate page exists can cause false 410s because posting IDs may not align.

| ✅ Correct (corporate) | ❌ Wrong as first choice (direct ATS) |
|---|---|
| `https://careers.mastercard.com` | `https://mastercard.wd1.myworkdayjobs.com` |
| `https://openai.com/careers` | `https://job-boards.greenhouse.io/openai` |
| `https://stripe.com/jobs` | `https://jobs.lever.co/stripe` |

Fallback: if you only have the bare ATS URL, first go to the company site and locate the corporate careers page. Use the ATS URL only when the company has no own page.

**Known patterns by platform:**
- **Ashby:** `https://jobs.ashbyhq.com/{slug}`
- **Greenhouse:** `https://job-boards.greenhouse.io/{slug}` or `https://job-boards.eu.greenhouse.io/{slug}`
- **Lever:** `https://jobs.lever.co/{slug}`
- **BambooHR:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail`
- **Teamtailor:** `https://{company}.teamtailor.com/jobs`
- **Workday:** `https://{company}.{shard}.myworkdayjobs.com/{site}`
- **Custom:** The company's own URL (e.g. `https://openai.com/careers`)

**API/feed patterns by platform:**
- **Ashby API:** `https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams`
- **BambooHR API:** list `https://{company}.bamboohr.com/careers/list`; detail `https://{company}.bamboohr.com/careers/{id}/detail` (`result.jobOpening`)
- **Lever API:** `https://api.lever.co/v0/postings/{company}?mode=json`
- **Teamtailor RSS:** `https://{company}.teamtailor.com/jobs.rss`
- **Workday API:** `https://{company}.{shard}.myworkdayjobs.com/wday/cxs/{company}/{site}/jobs`

**If `careers_url` is missing** for a company:
1. Try its known platform pattern
2. If that fails, quick WebSearch: `"{company}" careers jobs`
3. Confirm with Playwright
4. **Save the URL to portals.yml** for future scans

**If `careers_url` returns 404 or redirects badly:**
1. Note it in the output summary
2. Try `scan_query` as fallback
3. Flag for manual update

## Maintaining portals.yml

- **ALWAYS save `careers_url`** when adding a new company
- Add new queries as you discover portals or target roles worth watching
- Disable noisy queries with `enabled: false`
- Tune filter keywords as target roles evolve
- Add companies to `tracked_companies` when you want close follow-up
- Re-check `careers_url` periodically — companies change ATS platforms
