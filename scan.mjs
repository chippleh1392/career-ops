#!/usr/bin/env node

/**
 * scan.mjs — Zero-token portal scanner
 *
 * Fetches Greenhouse, Ashby, Lever APIs (per tracked_companies) plus
 * Remotive’s public JSON API when enabled in portals.yml. Applies
 * title filters, deduplicates, and appends new offers to
 * pipeline.md + scan-history.tsv.
 *
 * Zero Claude API tokens — pure HTTP + JSON.
 *
 * Usage:
 *   node scan.mjs                  # scan all enabled companies + Remotive
 *   node scan.mjs --dry-run        # preview without writing files
 *   node scan.mjs --company Cohere # scan a single company (Remotive skipped)
 *   node scan.mjs --remotive-only  # only Remotive API + same title_filter / dedupe
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import yaml from 'js-yaml';
const parseYaml = yaml.load;

// ── Config ──────────────────────────────────────────────────────────

const PORTALS_PATH = 'portals.yml';
const SCAN_HISTORY_PATH = 'data/scan-history.tsv';
const PIPELINE_PATH = 'data/pipeline.md';
const APPLICATIONS_PATH = 'data/applications.md';

// Ensure required directories exist (fresh setup)
mkdirSync('data', { recursive: true });

const CONCURRENCY = 10;
const FETCH_TIMEOUT_MS = 10_000;
const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';

// ── API detection ───────────────────────────────────────────────────

function detectApi(company) {
  // Greenhouse: explicit api field
  if (company.api && company.api.includes('greenhouse')) {
    return { type: 'greenhouse', url: company.api };
  }

  const url = company.careers_url || '';

  // Ashby
  const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/);
  if (ashbyMatch) {
    return {
      type: 'ashby',
      url: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}?includeCompensation=true`,
    };
  }

  // Lever
  const leverMatch = url.match(/jobs\.lever\.co\/([^/?#]+)/);
  if (leverMatch) {
    return {
      type: 'lever',
      url: `https://api.lever.co/v0/postings/${leverMatch[1]}`,
    };
  }

  // Greenhouse EU boards
  const ghEuMatch = url.match(/job-boards(?:\.eu)?\.greenhouse\.io\/([^/?#]+)/);
  if (ghEuMatch && !company.api) {
    return {
      type: 'greenhouse',
      url: `https://boards-api.greenhouse.io/v1/boards/${ghEuMatch[1]}/jobs`,
    };
  }

  return null;
}

// ── API parsers ─────────────────────────────────────────────────────

function parseGreenhouse(json, companyName) {
  const jobs = json.jobs || [];
  return jobs.map(j => ({
    title: j.title || '',
    url: j.absolute_url || '',
    company: companyName,
    location: j.location?.name || '',
  }));
}

function parseAshby(json, companyName) {
  const jobs = json.jobs || [];
  return jobs.map(j => ({
    title: j.title || '',
    url: j.jobUrl || '',
    company: companyName,
    location: j.location || '',
  }));
}

function parseLever(json, companyName) {
  if (!Array.isArray(json)) return [];
  return json.map(j => ({
    title: j.text || '',
    url: j.hostedUrl || '',
    company: companyName,
    location: j.categories?.location || '',
  }));
}

const PARSERS = { greenhouse: parseGreenhouse, ashby: parseAshby, lever: parseLever };

// ── Remotive API ────────────────────────────────────────────────────
// Docs: https://remotive.com/api-documentation
// Use sparingly (Remotive asks ~max ~4 GETs/day for the public API).

function buildRemotiveUrl(cfg = {}) {
  const params = new URLSearchParams();
  if (cfg.category) params.set('category', cfg.category);
  if (cfg.search) params.set('search', cfg.search);
  if (cfg.company_name) params.set('company_name', cfg.company_name);
  if (cfg.limit != null && cfg.limit !== '') params.set('limit', String(cfg.limit));
  const q = params.toString();
  return q ? `${REMOTIVE_API}?${q}` : REMOTIVE_API;
}

function parseRemotive(json) {
  const jobs = json.jobs || [];
  return jobs.map((j) => ({
    title: j.title || '',
    url: j.url || '',
    company: j.company_name || '',
    location: j.candidate_required_location || '',
    description: j.description || '',
  }));
}

// ── Fetch with timeout ──────────────────────────────────────────────

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Title filter ────────────────────────────────────────────────────

function buildTitleFilter(titleFilter) {
  const positive = (titleFilter?.positive || []).map(k => k.toLowerCase());
  const negative = [
    ...(titleFilter?.negative || []),
    ...(titleFilter?.seniority_penalty || []),
  ].map(k => k.toLowerCase());

  return (title) => {
    const lower = title.toLowerCase();
    const hasPositive = positive.length === 0 || positive.some(k => lower.includes(k));
    const hasNegative = negative.some(k => lower.includes(k));
    return hasPositive && !hasNegative;
  };
}

/** OR of commerce + general blocks when both exist (same as market-import). */
function buildTitleFilterFromConfig(config) {
  const tf = config.title_filter ?? {};
  if (tf.commerce && tf.general) {
    const a = buildTitleFilter(tf.commerce);
    const b = buildTitleFilter(tf.general);
    return (title) => a(title) || b(title);
  }
  return buildTitleFilter(tf);
}

/**
 * At commerce_lane employers (Yotpo, Lazer, …): accept general FE titles without
 * seniority_penalty, but keep commerce/general stack negatives (Backend, Staff+, …).
 */
function buildCommerceEmployerFilter(tf) {
  if (!tf?.commerce || !tf?.general) {
    return buildTitleFilter(tf);
  }
  const seenPos = new Set();
  const seenNeg = new Set();
  const positive = [];
  const negative = [];
  for (const k of [...(tf.commerce.positive || []), ...(tf.general.positive || [])]) {
    const key = String(k).toLowerCase();
    if (!seenPos.has(key)) {
      seenPos.add(key);
      positive.push(k);
    }
  }
  for (const k of [...(tf.commerce.negative || []), ...(tf.general.negative || [])]) {
    const key = String(k).toLowerCase();
    if (!seenNeg.has(key)) {
      seenNeg.add(key);
      negative.push(k);
    }
  }
  return buildTitleFilter({ positive, negative });
}

const REMOTIVE_ROLE_RE =
  /\b(developer|engineer|frontend|front[- ]end|full[- ]?stack|web developer|web engineer|architect)\b/i;

const REMOTIVE_DESC_ROLE_RE =
  /\b(shopify\s+developer|shopify\s+engineer|shopify\s+web\s+developer|frontend|front[- ]end|full[- ]?stack|web developer|web engineer|ecommerce developer|e-?commerce developer)\b/i;

const REMOTIVE_DESC_ROLE_BLOCK_RE =
  /\b(devops|sre|backend|back[- ]end|data engineer|ml engineer|machine learning|platform engineer|infrastructure|security engineer|mobile developer|ios|android)\b/i;

function buildRemotiveCommerceFilter(config, titleFilter) {
  const tf = config.title_filter ?? {};
  const descKeywords = (
    config.remotive?.description_positive ?? [
      'shopify',
      'shopify plus',
      'liquid',
      'hydrogen',
      'storefront api',
      'checkout extensibility',
      'oxygen',
      'headless commerce',
      'ecommerce platform',
    ]
  ).map((k) => String(k).toLowerCase());
  // Description-based Shopify matches are Lane A — do not apply general seniority_penalty.
  const descNegatives = [
    ...(tf.commerce?.negative || []),
    ...(tf.general?.negative || []),
  ].map((k) => String(k).toLowerCase());

  return (job) => {
    if (titleFilter(job.title)) return true;
    const title = job.title || '';
    if (!REMOTIVE_DESC_ROLE_RE.test(title)) return false;
    if (REMOTIVE_DESC_ROLE_BLOCK_RE.test(title)) return false;
    const lower = title.toLowerCase();
    if (descNegatives.some((k) => lower.includes(k))) return false;
    const desc = String(job.description || '').toLowerCase();
    return descKeywords.some((k) => desc.includes(k));
  };
}

// ── Dedup ───────────────────────────────────────────────────────────

function loadSeenUrls() {
  const seen = new Set();

  // scan-history.tsv
  if (existsSync(SCAN_HISTORY_PATH)) {
    const lines = readFileSync(SCAN_HISTORY_PATH, 'utf-8').split('\n');
    for (const line of lines.slice(1)) { // skip header
      const url = line.split('\t')[0];
      if (url) seen.add(url);
    }
  }

  // pipeline.md — extract URLs from checkbox lines (incl. `#55 | https://...` processed rows)
  if (existsSync(PIPELINE_PATH)) {
    const text = readFileSync(PIPELINE_PATH, 'utf-8');
    for (const line of text.split('\n')) {
      if (!/^- \[[ x]\]/.test(line)) continue;
      for (const match of line.matchAll(/https?:\/\/[^\s|)]+/g)) {
        seen.add(match[0]);
      }
    }
  }

  // applications.md — extract URLs from report links and any inline URLs
  if (existsSync(APPLICATIONS_PATH)) {
    const text = readFileSync(APPLICATIONS_PATH, 'utf-8');
    for (const match of text.matchAll(/https?:\/\/[^\s|)]+/g)) {
      seen.add(match[0]);
    }
  }

  return seen;
}

function loadSeenCompanyRoles() {
  const seen = new Set();
  if (existsSync(APPLICATIONS_PATH)) {
    const lines = readFileSync(APPLICATIONS_PATH, 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.startsWith('|')) continue;
      if (line.includes('---')) continue;

      const parts = line.split('|').map((s) => s.trim());
      if (parts.length < 6) continue;

      const company = parts[3]?.toLowerCase();
      const role = parts[4]?.toLowerCase();

      if (!company || !role || company === 'company') continue;
      seen.add(`${company}::${role}`);
    }
  }
  return seen;
}

// ── Pipeline writer ─────────────────────────────────────────────────

const PIPELINE_PENDING_HEADERS = ['## Pending', '## Pendientes', '## Pendentes'];
const PIPELINE_PROCESSED_HEADERS = ['## Processed', '## Procesadas', '## Processadas'];
const PIPELINE_PENDING_WRITE = '## Pending';

function findPipelineSection(text, headers) {
  for (const header of headers) {
    const idx = text.indexOf(header);
    if (idx !== -1) return { header, idx, len: header.length };
  }
  return null;
}

function appendToPipeline(offers) {
  if (offers.length === 0) return;

  let text = readFileSync(PIPELINE_PATH, 'utf-8');
  const pending = findPipelineSection(text, PIPELINE_PENDING_HEADERS);
  const processed = findPipelineSection(text, PIPELINE_PROCESSED_HEADERS);

  if (!pending) {
    const insertAt = processed ? processed.idx : text.length;
    const block = `\n${PIPELINE_PENDING_WRITE}\n\n` + offers.map(o =>
      `- [ ] ${o.url} | ${o.company} | ${o.title}`
    ).join('\n') + '\n\n';
    text = text.slice(0, insertAt) + block + text.slice(insertAt);
  } else {
    const afterMarker = pending.idx + pending.len;
    const nextSection = text.indexOf('\n## ', afterMarker);
    const insertAt = nextSection === -1 ? text.length : nextSection;
    const block = '\n' + offers.map(o =>
      `- [ ] ${o.url} | ${o.company} | ${o.title}`
    ).join('\n') + '\n';
    text = text.slice(0, insertAt) + block + text.slice(insertAt);
  }

  writeFileSync(PIPELINE_PATH, text, 'utf-8');
}

function appendToScanHistory(offers, date) {
  // Ensure file + header exist
  if (!existsSync(SCAN_HISTORY_PATH)) {
    writeFileSync(SCAN_HISTORY_PATH, 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n', 'utf-8');
  }

  const lines = offers.map(o =>
    `${o.url}\t${date}\t${o.source}\t${o.title}\t${o.company}\tadded`
  ).join('\n') + '\n';

  appendFileSync(SCAN_HISTORY_PATH, lines, 'utf-8');
}

// ── Parallel fetch with concurrency limit ───────────────────────────

async function parallelFetch(tasks, limit) {
  const results = [];
  let i = 0;

  async function next() {
    while (i < tasks.length) {
      const task = tasks[i++];
      results.push(await task());
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => next());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const remotiveOnly = args.includes('--remotive-only');
  const companyFlag = args.indexOf('--company');
  const filterCompany = companyFlag !== -1 ? args[companyFlag + 1]?.toLowerCase() : null;

  if (remotiveOnly && filterCompany) {
    console.error('Use either --remotive-only or --company, not both.');
    process.exit(1);
  }

  // 1. Read portals.yml
  if (!existsSync(PORTALS_PATH)) {
    console.error('Error: portals.yml not found. Run onboarding first.');
    process.exit(1);
  }

  const config = parseYaml(readFileSync(PORTALS_PATH, 'utf-8'));
  const companies = config.tracked_companies || [];
  const titleFilter = buildTitleFilterFromConfig(config);
  const commerceEmployerFilter =
    config.title_filter?.commerce && config.title_filter?.general
      ? buildCommerceEmployerFilter(config.title_filter)
      : titleFilter;
  const remotiveCommerceFilter = buildRemotiveCommerceFilter(config, titleFilter);

  // 2. Filter to enabled companies with detectable APIs
  let targets = companies
    .filter(c => c.enabled !== false)
    .filter(c => !filterCompany || c.name.toLowerCase().includes(filterCompany))
    .map(c => ({ ...c, _api: detectApi(c) }))
    .filter(c => c._api !== null);

  if (remotiveOnly) {
    targets = [];
  }

  const skippedCount = companies.filter(c => c.enabled !== false).length - targets.length;

  const remotiveCfgEarly = config.remotive || {};
  if (remotiveOnly && remotiveCfgEarly.enabled === false) {
    console.error('Error: remotive.enabled is false in portals.yml.');
    process.exit(1);
  }

  if (remotiveOnly) {
    console.log('Remotive-only scan (same title_filter + dedupe as full scan).');
  } else {
    const willRemotive = remotiveCfgEarly.enabled !== false && !filterCompany;
    console.log(
      `Scanning ${targets.length} companies via API (${skippedCount} skipped — no API detected)${willRemotive ? ' + Remotive' : ''}`
    );
  }
  if (dryRun) console.log('(dry run — no files will be written)\n');

  // 3. Load dedup sets
  const seenUrls = loadSeenUrls();
  const seenCompanyRoles = loadSeenCompanyRoles();

  // 4. Fetch all APIs
  const date = new Date().toISOString().slice(0, 10);
  let totalFound = 0;
  let totalFiltered = 0;
  let totalDupes = 0;
  const newOffers = [];
  const errors = [];

  function ingestJobs(jobs, source, { filter = titleFilter } = {}) {
    totalFound += jobs.length;
    for (const job of jobs) {
      if (!job.url) continue;
      if (!filter(job)) {
        totalFiltered++;
        continue;
      }
      if (seenUrls.has(job.url)) {
        totalDupes++;
        continue;
      }
      const key = `${String(job.company).toLowerCase()}::${job.title.toLowerCase()}`;
      if (seenCompanyRoles.has(key)) {
        totalDupes++;
        continue;
      }
      seenUrls.add(job.url);
      seenCompanyRoles.add(key);
      newOffers.push({ ...job, source });
    }
  }

  const tasks = targets.map((company) => async () => {
    const { type, url } = company._api;
    const filter = company.commerce_lane ? commerceEmployerFilter : titleFilter;
    try {
      const json = await fetchJson(url);
      const jobs = PARSERS[type](json, company.name);
      ingestJobs(jobs, `${type}-api`, {
        filter: (job) => filter(job.title),
      });
    } catch (err) {
      errors.push({ company: company.name, error: err.message });
    }
  });

  await parallelFetch(tasks, CONCURRENCY);

  // Remotive public API (skipped with --company unless --remotive-only)
  const remotiveCfg = config.remotive || {};
  const remotiveOn = remotiveCfg.enabled !== false && (remotiveOnly || !filterCompany);
  if (remotiveOn) {
    let category = remotiveCfg.category;
    if (category === undefined) category = 'software-dev';
    else if (category === null || category === '') category = undefined;
    const url = buildRemotiveUrl({
      category,
      search: remotiveCfg.search || undefined,
      limit: remotiveCfg.limit,
      company_name: remotiveCfg.company_name || undefined,
    });
    try {
      if (remotiveOnly) console.log(`Request: ${url}\n`);
      const json = await fetchJson(url);
      const parsed = parseRemotive(json);

      if (remotiveOnly) {
        const matches = [];
        for (const job of parsed) {
          if (!job.url) continue;
          if (!remotiveCommerceFilter(job)) continue;
          const urlDup = seenUrls.has(job.url);
          const key = `${String(job.company).toLowerCase()}::${job.title.toLowerCase()}`;
          const roleDup = seenCompanyRoles.has(key);
          let tag = '[new]';
          if (urlDup) tag = '[dup url]';
          else if (roleDup) tag = '[dup company+title]';
          matches.push({ ...job, tag });
        }
        console.log(
          `Remotive — ${matches.length} job(s) match title_filter (raw feed: ${parsed.length}, category: ${category || 'all'})\n`
        );
        for (const m of matches) {
          console.log(`  ${m.tag} ${m.company} | ${m.title}`);
          console.log(`         ${m.location || 'N/A'}`);
          console.log(`         ${m.url}`);
          console.log('');
        }
      }

      ingestJobs(parsed, 'remotive-api', { filter: remotiveCommerceFilter });
    } catch (err) {
      errors.push({ company: 'Remotive', error: err.message });
    }
  }

  // 5. Write results
  if (!dryRun && newOffers.length > 0) {
    appendToPipeline(newOffers);
    appendToScanHistory(newOffers, date);
  }

  // 6. Print summary
  console.log(`\n${'━'.repeat(45)}`);
  console.log(`Portal Scan — ${date}`);
  console.log(`${'━'.repeat(45)}`);
  console.log(`ATS API scans:         ${targets.length}`);
  console.log(`Total jobs found:      ${totalFound}`);
  console.log(`Filtered by title:     ${totalFiltered} removed`);
  console.log(`Duplicates:            ${totalDupes} skipped`);
  console.log(`New offers added:      ${newOffers.length}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) {
      console.log(`  ✗ ${e.company}: ${e.error}`);
    }
  }

  if (newOffers.length > 0) {
    console.log('\nNew offers:');
    for (const o of newOffers) {
      console.log(`  + ${o.company} | ${o.title} | ${o.location || 'N/A'}`);
    }
    if (dryRun) {
      console.log('\n(dry run — run without --dry-run to save results)');
    } else {
      console.log(`\nResults saved to ${PIPELINE_PATH} and ${SCAN_HISTORY_PATH}`);
    }
  }

  console.log(`\n→ Run /career-ops pipeline to evaluate new offers.`);
  console.log('→ Share results and get help: https://discord.gg/8pRpHETxa4');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
