/**
 * Append-only job-search events for analytics (JSON Lines).
 * File: data/tracker-events.jsonl (user layer — same trust as applications.md)
 *
 * Event types:
 * - status     — pipeline state (to / optional from)
 * - gmail_ack  — application acknowledgement email observed
 * - gmail_rejection — rejection email observed
 *
 * Each line: {"v":1,"at":"YYYY-MM-DD","num":"12",...}
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/** Display labels aligned with templates/states.yml */
export const STATUS_LABELS = [
  'Evaluated',
  'Applied',
  'Responded',
  'Interview',
  'Offer',
  'Rejected',
  'Discarded',
  'SKIP',
];

export function eventsPath(projectRoot) {
  return join(projectRoot, 'data', 'tracker-events.jsonl');
}

export function normalizeStatusToken(raw) {
  const t = String(raw || '')
    .trim()
    .replace(/\*\*/g, '');
  const lower = t.toLowerCase();
  const hit = STATUS_LABELS.find((l) => l.toLowerCase() === lower);
  return hit || t;
}

function pruneUndefined(obj) {
  const o = { ...obj };
  for (const k of Object.keys(o)) {
    if (o[k] === undefined) delete o[k];
  }
  return o;
}

/**
 * Upsert single event — dedupe by dedupeKey, full file rewritten (small logs).
 */
export function appendEvent(projectRoot, partial) {
  const ev = pruneUndefined({ v: 1, ...partial });
  const existing = readEvents(projectRoot);
  mergeWriteAll(projectRoot, [...existing, ev]);
}

export function readEvents(projectRoot) {
  const p = eventsPath(projectRoot);
  if (!existsSync(p)) return [];
  const raw = readFileSync(p, 'utf8').trim();
  if (!raw) return [];
  const out = [];
  for (const line of raw.split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try {
      out.push(JSON.parse(s));
    } catch {
      /* skip corrupt line */
    }
  }
  return out;
}

export function dedupeKey(ev) {
  return [
    ev.at,
    String(ev.num),
    ev.event,
    ev.to ?? '',
    ev.from ?? '',
    ev.channel ?? '',
    ev.gmailKind ?? '',
  ].join('\t');
}

/** Dedupe + sort for analytics previews and mergeWriteAll. */
export function flattenDedupeEvents(events) {
  const map = new Map();
  for (const e of events) {
    const n = pruneUndefined({ v: 1, ...e });
    map.set(dedupeKey(n), n);
  }
  return [...map.values()].sort((a, b) => {
    const c = String(a.at || '').localeCompare(String(b.at || ''));
    if (c !== 0) return c;
    return String(a.num || '').localeCompare(String(b.num || ''), undefined, {
      numeric: true,
    });
  });
}

export function mergeWriteAll(projectRoot, events) {
  const sorted = flattenDedupeEvents(events);
  writeFileSync(
    eventsPath(projectRoot),
    sorted.length ? `${sorted.map(JSON.stringify).join('\n')}\n` : '',
    'utf8',
  );
}
