# Setup Guide

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured, or Codex working in this repo
- Node.js 18+ (for PDF generation and utility scripts)
- (Optional) Go 1.21+ (for the dashboard TUI)

## Quick Start (5 steps)

### 1. Clone and install

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
npm install
npx playwright install chromium   # Required for PDF generation
```

### 2. Configure your profile

```bash
cp config/profile.example.yml config/profile.yml
```

Edit `config/profile.yml` with your personal details: name, email, target roles, narrative, proof points.

### 3. Add your CV

Create `cv.md` in the project root with your full CV in markdown format. This is the source of truth for all evaluations and PDFs.

(Optional) Create `article-digest.md` with proof points from your portfolio projects/articles.

### 4. Configure portals

```bash
cp templates/portals.example.yml portals.yml
```

Edit `portals.yml`:
- Update **`title_filter.commerce`** and **`title_filter.general`** (see `market-scoring/`): commerce is senior-friendly for Shopify/commerce postings; general down-ranks senior titles for everything else. Legacy flat `title_filter` still loads until you save from the web UI or migrate YAML.
- Add companies you want to track in `tracked_companies`
- Customize `search_queries` for your preferred job boards

### 5. Start using

Use either agent path:

**Claude Code**

```bash
claude
```

Then paste a job offer URL or description, or use `/career-ops`.

**Codex**

- Open the repo in Codex
- Read `AGENTS.md`
- Ask naturally, for example:
  - `Evaluate this role`
  - `Generate a tailored resume for this JD`
  - `Scan the configured portals`

Both paths use the same `cv.md`, `article-digest.md`, `config/profile.yml`, and `portals.yml`.

### 6. Batch processing

```bash
# Claude workers
bash batch/batch-runner.sh --agent claude

# Codex workers
bash batch/batch-runner.sh --agent codex

# Manual fallback
bash batch/batch-runner.sh --agent manual
```

Use `--dry-run` first if you want to inspect `batch/batch-input.tsv` without executing anything.

On Windows/PowerShell, prefer:

```powershell
.\batch\batch-runner.ps1 -Agent codex
.\batch\batch-runner.ps1 -Agent manual
```

## Available Commands

| Action | How |
|--------|-----|
| Evaluate an offer | Paste a URL or JD text |
| Search for offers | Claude: `/career-ops scan` · Codex: `Scan the configured portals` |
| Process pending URLs | Claude: `/career-ops pipeline` · Codex: `Process data/pipeline.md` |
| Generate a PDF | Claude: `/career-ops pdf` · Codex: `Generate a tailored PDF for this JD` |
| Batch evaluate | Claude: `/career-ops batch` or `bash batch/batch-runner.sh --agent claude` · Codex: `.\batch\batch-runner.ps1 -Agent codex` on Windows or `bash batch/batch-runner.sh --agent codex` on Unix |
| Check tracker status | Claude: `/career-ops tracker` · Codex: `Show tracker status` |
| Fill application form | Claude: `/career-ops apply` · Codex: `Help me fill this application` |

## Verify Setup

```bash
node cv-sync-check.mjs      # Check configuration
node verify-pipeline.mjs     # Check pipeline integrity
```

## Build Dashboard (Optional)

```bash
cd dashboard
go build -o career-dashboard .
./career-dashboard --path ..  # Opens TUI pipeline viewer
```

## Web dashboard (Optional)

Browser UI for the same pipeline data (no Go required). Serves on **127.0.0.1** only by default.

```bash
npm run web
# → http://127.0.0.1:8787/
```

Options:

```bash
node web/server.mjs --path /path/to/career-ops   # data root (default: repo root)
node web/server.mjs --port 9000
node web/server.mjs --host 0.0.0.0                # listen on all interfaces (LAN) — use with care
```

- **GET `/api/pipeline`** — JSON (`applications`, `metrics`, `progressMetrics`), same enrichment rules as the TUI.
- **GET `/api/report?path=reports/001-....md`** — **rendered HTML** (readable typography, tables, dark theme). Append **`&raw=1`** for the raw `.md` file (plain text).
- **GET `/market`** — **rendered HTML** for `data/market/market-report.md` (output of `npm run market:refresh`). **`/market?raw=1`** for raw Markdown. The pipeline home footer links here.

**Where market data lives on disk**

| Path | What it is |
|------|------------|
| `data/market/jobs.jsonl` | Imported job rows |
| `data/market/jobs-scored.jsonl` | After `market:score` |
| `data/market/market-report.md` | Human-readable analysis (open in editor or **`/market`** in the web UI) |
| `data/market/market-summary.json` | Machine summary stats |
| `data/market/import-summary.json` | Last import run metadata |
| `data/market/deep-eval-queue.tsv` | Top 25 overall (mixed tracks) for quick review |
| `data/market/deep-eval-queue-commerce.tsv` | Best **commerce / Shopify-track** rows (senior-friendly scoring) |
| `data/market/deep-eval-queue-general.tsv` | **Attainable** general FE: no Senior/Staff/Lead/etc. in title, min ~1.85★ |
