#!/usr/bin/env node
/**
 * Merge event rows from applications.md Notes into data/tracker-events.jsonl.
 * Idempotent dedupe via lib/tracker-events.mjs mergeWriteAll.
 *
 * Usage:
 *   node backfill-tracker-events.mjs           # merge + write
 *   node backfill-tracker-events.mjs --dry-run
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  dedupeKey,
  eventsPath,
  flattenDedupeEvents,
  mergeWriteAll,
  normalizeStatusToken,
  readEvents,
  STATUS_LABELS,
} from './lib/tracker-events.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT = __dirname;
const APPS =
  existsSync(join(PROJECT, 'data', 'applications.md'))
    ? join(PROJECT, 'data', 'applications.md')
    : join(PROJECT, 'applications.md');

const DRY = process.argv.includes('--dry-run');

function parseApplications(content) {
  const rows = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|')) continue;
    const parts = line.split('|').map((s) => s.trim());
    if (parts.length < 9) continue;
    const num = parts[1];
    if (!/^\d+$/.test(num)) continue;
    rows.push({
      num,
      date: parts[2],
      company: parts[3],
      role: parts[4],
      status: parts[6],
      notes: parts[8] || '',
    });
  }
  return rows;
}

/** @param {{ num: string, company: string, role: string, notes: string }} row */
function inferEventsFromRow(row) {
  const notes = row.notes || '';
  /** @type {Record<string, unknown>[]} */
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();

  function push(ev) {
    const k = dedupeKey(ev);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(ev);
  }

  const reAck = /(\d{4}-\d{2}-\d{2}):\s*Gmail:\s*application acknowledgement/gi;
  let m;
  while ((m = reAck.exec(notes)) !== null) {
    push({
      at: m[1],
      num: row.num,
      company: row.company,
      role: row.role,
      event: 'gmail_ack',
      source: 'backfill',
    });
  }

  const reRej =
    /(\d{4}-\d{2}-\d{2}):\s*Gmail:\s*rejection\s+notice/gi;
  while ((m = reRej.exec(notes)) !== null) {
    const slice = notes.slice(m.index, Math.min(m.index + 300, notes.length));
    const linkedin =
      /\[linkedin\]|sender\s+linkedin|jobs-noreply@linkedin|\blinkedIn\b/i.test(
        slice,
      );
    push({
      at: m[1],
      num: row.num,
      company: row.company,
      role: row.role,
      event: 'gmail_rejection',
      ...(linkedin && { channel: 'linkedin' }),
      source: 'backfill',
    });
  }

  const statuses = STATUS_LABELS.join('|');
  const reColonStatus = new RegExp(
    `(?:^|[\\r\\n])(\\d{4}-\\d{2}-\\d{2}):\\s*(${statuses})\\s*\\.`,
    'gi',
  );
  while ((m = reColonStatus.exec(notes)) !== null) {
    push({
      at: m[1],
      num: row.num,
      company: row.company,
      role: row.role,
      event: 'status',
      to: normalizeStatusToken(m[2]),
      source: 'backfill',
    });
  }

  const reInlineStatus = new RegExp(
    `\\b(${statuses})\\s+(\\d{4}-\\d{2}-\\d{2})\\b`,
    'gi',
  );
  while ((m = reInlineStatus.exec(notes)) !== null) {
    push({
      at: m[2],
      num: row.num,
      company: row.company,
      role: row.role,
      event: 'status',
      to: normalizeStatusToken(m[1]),
      source: 'backfill_inline',
    });
  }

  return out;
}

function main() {
  if (!existsSync(APPS)) {
    console.error(JSON.stringify({ ok: false, error: 'applications.md missing' }));
    process.exit(1);
  }

  const content = readFileSync(APPS, 'utf8');
  const rows = parseApplications(content);
  const inferred = rows.flatMap((r) => inferEventsFromRow(r));
  const existing = readEvents(PROJECT);

  /** @type {Record<string, unknown>[]} */
  const combined = [...existing, ...inferred];
  const merged = flattenDedupeEvents(combined);

  if (DRY) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          applicationsRows: rows.length,
          inferredLines: inferred.length,
          existingLines: existing.length,
          uniqueLinesAfterDedupe: merged.length,
        },
        null,
        2,
      ),
    );
    return;
  }

  mergeWriteAll(PROJECT, combined);
  console.log(
    JSON.stringify(
      {
        ok: true,
        wrote: eventsPath(PROJECT),
        applicationsRows: rows.length,
        inferredLines: inferred.length,
        existingBefore: existing.length,
        totalAfter: merged.length,
      },
      null,
      2,
    ),
  );
}

main();
