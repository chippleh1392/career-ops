/**
 * Shared search-health computation for CLI (`analyze-search-health.mjs`) and web `/api/search-health`.
 * @typedef {{ asOf?: string }} SearchHealthOpts
 */
import { existsSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { readEvents } from './tracker-events.mjs';

const ALIASES = {
  evaluada: 'evaluated',
  aplicado: 'applied',
  enviada: 'applied',
  aplicada: 'applied',
  sent: 'applied',
  respondido: 'responded',
  entrevista: 'interview',
  oferta: 'offer',
  rechazado: 'rejected',
  rechazada: 'rejected',
  descartado: 'discarded',
  descartada: 'discarded',
  cerrada: 'discarded',
  cancelada: 'discarded',
  'no aplicar': 'skip',
  no_aplicar: 'skip',
  monitor: 'skip',
};

function normalizeStatus(raw) {
  const clean = String(raw || '')
    .replace(/\*\*/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+\d{4}-\d{2}-\d{2}.*$/, '')
    .trim();
  return ALIASES[clean] || clean;
}

function parseIso(d) {
  const [Y, M, D] = String(d).split('-').map(Number);
  if (!Y || !M || !D) return null;
  const dt = new Date(Date.UTC(Y, M - 1, D));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Days from a to b */
function daysBetween(aStr, bStr) {
  const a = parseIso(aStr);
  const b = parseIso(bStr);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (24 * 3600 * 1000));
}

/** Extract "Applied YYYY-MM-DD" from notes */
function appliedDatesFromNotes(notes) {
  const out = [];
  const re = /\bApplied\s+(\d{4}-\d{2}-\d{2})\b/gi;
  let m;
  while ((m = re.exec(notes || '')) !== null) out.push(m[1]);
  return out;
}

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
      scoreRaw: parts[5],
      statusRaw: parts[6],
      status: normalizeStatus(parts[6]),
      report: parts[7],
      notes: parts[8] || '',
    });
  }
  return rows;
}

function sortByDateAsc(events) {
  return [...events].sort((a, b) =>
    String(a.at || '').localeCompare(String(b.at || '')),
  );
}

function manyProxyWarning(list) {
  const n = list.filter((p) => p.appliedSource === 'eval_row_date_proxy').length;
  return n
    ? `${n} row(s) use eval date as apply proxy — interpret waiting times cautiously.`
    : 'none';
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * @param {string} careerOpsRoot
 * @param {SearchHealthOpts} [opts]
 * @returns {Record<string, unknown> | { ok: false, error: string }}
 */
export function analyzeSearchHealth(careerOpsRoot, opts = {}) {
  const AS_OF =
    typeof opts.asOf === 'string' && /^\d{4}-\d{2}-\d{2}/.test(opts.asOf)
      ? opts.asOf.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const APPS = existsSync(join(careerOpsRoot, 'data', 'applications.md'))
    ? join(careerOpsRoot, 'data', 'applications.md')
    : join(careerOpsRoot, 'applications.md');

  if (!existsSync(APPS)) {
    return { ok: false, error: 'applications.md not found' };
  }

  const asOfDate = parseIso(AS_OF);
  if (!asOfDate) {
    return { ok: false, error: 'invalid asOf date' };
  }

  const trackerRows = parseApplications(readFileSync(APPS, 'utf8'));
  const rawEvents = readEvents(careerOpsRoot);
  const events = sortByDateAsc(rawEvents);

  const byNum = new Map();
  for (const ev of events) {
    const k = String(ev.num);
    if (!byNum.has(k)) byNum.set(k, []);
    byNum.get(k).push(ev);
  }

  const windowDays = [14, 30, 90];
  /** @type {Record<number, { cutoff: string }>} */
  const windows = {};
  for (const d of windowDays) {
    const dt = new Date(asOfDate);
    dt.setUTCDate(dt.getUTCDate() - d);
    windows[d] = { cutoff: dt.toISOString().slice(0, 10) };
  }

  function inWin(evAt, cutoff) {
    return evAt >= cutoff && evAt <= AS_OF;
  }

  const statusAppliedInWin = {};
  const gmailAckInWin = {};
  const gmailRejInWin = {};
  const statusRejInWin = {};

  for (const d of windowDays) {
    const { cutoff } = windows[d];
    let sa = 0;
    let ga = 0;
    let gr = 0;
    let sr = 0;

    const seenAppliedNums = new Set();
    for (const ev of events) {
      if (!inWin(ev.at, cutoff)) continue;
      if (ev.event === 'status' && ev.to === 'Applied') {
        if (!seenAppliedNums.has(ev.num)) {
          seenAppliedNums.add(ev.num);
          sa++;
        }
      }
      if (ev.event === 'gmail_ack') ga++;
      if (ev.event === 'gmail_rejection') gr++;
      if (ev.event === 'status' && ev.to === 'Rejected') sr++;
    }
    statusAppliedInWin[d] = sa;
    gmailAckInWin[d] = ga;
    gmailRejInWin[d] = gr;
    statusRejInWin[d] = sr;
  }

  const snapshotByStatus = {};
  for (const row of trackerRows) {
    const s = row.status || 'unknown';
    snapshotByStatus[s] = (snapshotByStatus[s] || 0) + 1;
  }

  const applyToAckDays = [];
  const applyToRejectDays = [];
  const perApplication = [];

  for (const row of trackerRows) {
    const num = row.num;
    const evs = byNum.get(num) || [];

    const noteApplied = appliedDatesFromNotes(row.notes);
    const earliestNoteApplied =
      noteApplied.length > 0
        ? noteApplied.reduce((a, b) => (a < b ? a : b))
        : null;

    const statusAppliedDates = evs
      .filter((e) => e.event === 'status' && e.to === 'Applied')
      .map((e) => e.at)
      .sort();

    let appliedAt = earliestNoteApplied;
    let appliedSource = earliestNoteApplied ? 'notes' : null;

    if (!appliedAt && statusAppliedDates.length) {
      appliedAt = statusAppliedDates[0];
      appliedSource = 'event';
    }
    if (!appliedAt) {
      appliedAt = row.date;
      appliedSource = 'eval_row_date_proxy';
    }

    const ackDates = evs
      .filter((e) => e.event === 'gmail_ack')
      .map((e) => e.at)
      .sort();
    const firstAck = ackDates[0] || null;

    const rejDates = evs
      .filter(
        (e) =>
          e.event === 'gmail_rejection' ||
          (e.event === 'status' && e.to === 'Rejected'),
      )
      .map((e) => e.at)
      .sort();
    const firstReject = rejDates[0] || null;

    const dAck = appliedAt && firstAck ? daysBetween(appliedAt, firstAck) : null;
    if (dAck !== null && dAck >= 0) applyToAckDays.push(dAck);

    const dRej =
      appliedAt && firstReject ? daysBetween(appliedAt, firstReject) : null;
    if (dRej !== null && dRej >= 0) applyToRejectDays.push(dRej);

    const hasAck = ackDates.length > 0;

    perApplication.push({
      num,
      company: row.company,
      role: row.role,
      scoreRaw: row.scoreRaw,
      status: row.status,
      appliedAt,
      appliedSource,
      firstGmailAckAt: firstAck,
      firstRejectionAt: firstReject,
      daysApplyToAck: dAck,
      daysApplyToReject: dRej,
      hadGmailAck: hasAck,
    });
  }

  const GHOST_APPLIED_DAYS = 14;
  const GHOST_APPLIED_DAYS_HARD = 21;

  const appliedOpen = trackerRows.filter((r) => r.status === 'applied');
  const staleApplied = [];

  for (const row of appliedOpen) {
    const pa = perApplication.find((p) => p.num === row.num);
    if (!pa) continue;
    const base = pa.appliedAt || row.date;
    const waiting = daysBetween(base, AS_OF);
    if (waiting === null) continue;
    if (waiting >= GHOST_APPLIED_DAYS && !pa.hadGmailAck) {
      staleApplied.push({
        num: row.num,
        company: row.company,
        daysWaiting: waiting,
        appliedOrProxyAt: base,
        appliedSource: pa.appliedSource,
        ghostThresholdDays: GHOST_APPLIED_DAYS,
      });
    }
  }

  const recentRejections30 = events.filter((e) => {
    const rej =
      e.event === 'gmail_rejection' ||
      (e.event === 'status' && e.to === 'Rejected');
    return rej && inWin(e.at, windows[30].cutoff);
  });

  const Amber = [];
  const Red = [];

  if (staleApplied.some((s) => s.daysWaiting >= GHOST_APPLIED_DAYS_HARD)) {
    Red.push(
      `One or more Applied rows exceed ${GHOST_APPLIED_DAYS_HARD} days with no gmail_ack — worth a pipeline review.`,
    );
  } else if (staleApplied.length) {
    Amber.push(
      `${staleApplied.length} Applied row(s) exceed ${GHOST_APPLIED_DAYS} days with no gmail_ack.`,
    );
  }

  const rej30 = gmailRejInWin[30] + statusRejInWin[30];
  const app30 = statusAppliedInWin[30];
  if (app30 > 0 && rej30 / app30 > 0.85) {
    Amber.push(
      'High rejection volume vs logged status-applied events in last 30d — sanity-check role mix and leveling.',
    );
  }

  if (
    appliedOpen.length > 10 &&
    staleApplied.length / appliedOpen.length > 0.5
  ) {
    Amber.push(
      'Majority of open Applied rows are quiet (no gmail_ack) beyond the ghost threshold — verify ATS vs LinkedIn inbox coverage.',
    );
  }

  const eventsRel = join(careerOpsRoot, 'data', 'tracker-events.jsonl');

  return {
    ok: true,
    meta: {
      schema: 1,
      generatedAt: new Date().toISOString(),
      asOf: AS_OF,
      paths: {
        applicationsMd:
          relative(careerOpsRoot, APPS).replace(/\\/g, '/') || 'applications.md',
        trackerEventsJsonl:
          relative(careerOpsRoot, eventsRel).replace(/\\/g, '/') ||
          'data/tracker-events.jsonl',
      },
      rows: trackerRows.length,
      eventLines: events.length,
      windowsDays: windowDays,
    },
    snapshot: snapshotByStatus,
    windows: {
      d14: {
        cutoff: windows[14].cutoff,
        statusAppliedDistinctNums: statusAppliedInWin[14],
        gmailAckEvents: gmailAckInWin[14],
        gmailRejectionEvents: gmailRejInWin[14],
        statusRejectedEvents: statusRejInWin[14],
      },
      d30: {
        cutoff: windows[30].cutoff,
        statusAppliedDistinctNums: statusAppliedInWin[30],
        gmailAckEvents: gmailAckInWin[30],
        gmailRejectionEvents: gmailRejInWin[30],
        statusRejectedEvents: statusRejInWin[30],
      },
      d90: {
        cutoff: windows[90].cutoff,
        statusAppliedDistinctNums: statusAppliedInWin[90],
        gmailAckEvents: gmailAckInWin[90],
        gmailRejectionEvents: gmailRejInWin[90],
        statusRejectedEvents: statusRejInWin[90],
      },
    },
    timing: {
      medianDaysApplyToFirstGmailAck: median(applyToAckDays),
      nApplyToAckSamples: applyToAckDays.length,
      medianDaysApplyToFirstRejection: median(applyToRejectDays),
      nApplyToRejectSamples: applyToRejectDays.length,
    },
    openness: {
      appliedOpenCount: appliedOpen.length,
      staleAppliedNoAck: staleApplied,
      staleThresholdDays: GHOST_APPLIED_DAYS,
      hardStaleDays: GHOST_APPLIED_DAYS_HARD,
    },
    funnel: {
      rejectionsCapturedLast30d: recentRejections30.length,
    },
    signals: { amber: Amber, red: Red },
    llmPack: {
      purpose:
        'Paste this JSON (or facts only) plus your Life Dash OS / market notes. Ask the LLM not to invent market statistics.',
      caveat: manyProxyWarning(perApplication),
      promptStub: [
        'Facts JSON is from my tracker (search-health).',
        'Market claims are pasted separately from my research — do not invent benchmarks.',
        'Compare my timing and ghosting list to that market context; give 3–5 actions.',
      ],
    },
    perApplication,
  };
}
