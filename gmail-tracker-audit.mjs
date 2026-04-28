#!/usr/bin/env node
/**
 * Backfill Gmail evidence into data/applications.md Notes for Status != Evaluated.
 * Skips spam/digest mail; verifies company/token in subject+snippet before logging.
 *
 * Rejections routed through LinkedIn (jobs-noreply@linkedin.com) often put the
 * company + role in the subject ("Your application to … at X4 Technology") and the
 * actual rejection wording in the snippet — see rejectionScore().
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { appendEvent } from './lib/tracker-events.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

const MIN_MAIL_YMD = '2025-11-01';

function getGmailClient() {
  const oauth = JSON.parse(
    readFileSync(join(projectRoot, 'private', 'gmail-token.json'), 'utf8')
  );
  const file = readdirSync(join(projectRoot, 'private')).find(
    (f) => f.startsWith('client_secret') && f.endsWith('.json')
  );
  const blob = JSON.parse(
    readFileSync(join(projectRoot, 'private', file), 'utf8')
  );
  const b = blob.installed || blob.web;
  const o2 = new google.auth.OAuth2(
    b.client_id,
    b.client_secret,
    b.redirect_uris[0]
  );
  o2.setCredentials(oauth);
  return google.gmail({ version: 'v1', auth: o2 });
}

function parseRow(line) {
  const raw = line.trim();
  if (!raw.startsWith('|')) return null;
  const inner = raw.slice(1, -1).split('|').map((s) => s.trim());
  if (inner.length < 8) return null;
  if (!/^\d+$/.test(inner[0])) return null;
  return {
    num: inner[0],
    date: inner[1],
    company: inner[2],
    role: inner[3],
    score: inner[4],
    status: inner[5],
    report: inner[6],
    notes: inner.slice(7).join('|').trim(),
  };
}

function formatRow(r) {
  return (
    `| ${r.num} | ${r.date} | ${r.company} | ${r.role} | ${r.score} | ${r.status} | ${r.report} | ${r.notes} |`
  );
}

function companyToken(company) {
  return company
    .replace(/,?\s*a\s+CDW\s+Company/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extra Gmail queries by tracker # for noisy company names */
const EXTRA_QUERIES = {
  52: [
    `newer_than:180d from:gem.com ("Thank you for your application" OR Mission) ("Software Engineer, Frontend")`,
  ],
  51: [
    `newer_than:180d from:link OR from:linkedin (LaunchDarkly) ("application was sent" OR "received")`,
  ],
  41: [
    `newer_than:180d from:ashbyhq.com ("Aleph" OR "Aleph Talent")`, // avoid generic “Aleph”
  ],
  27: [`newer_than:730d ("Jonas" OR PrestoSports) (application OR received OR Greenhouse)`, `newer_than:730d from:linkedin "Jonas"`],
};

function isSpamLikely(subject, snippet) {
  const t = `${subject}\n${snippet}`;
  return /New jobs similar\b|jobs found for Software Engineer\b|🔥|, apply now to ‘|, apply now to '|saved you a seat at Google\b|Marketing Live\b|your job'?s expiring/i.test(t);
}

function companyInMessage(company, msg) {
  const t = `${msg.subject}\n${msg.snippet}\n${msg.from}`.toLowerCase();
  const c = companyToken(company).toLowerCase();
  /** Significant chunks; allow 2+ chars when numeric (e.g. X4). */
  const significant = (
    (c.match(/[a-z0-9]{2,}/g) ?? []).filter(
      (w) => w.length >= 3 || /\d/.test(w)
    )
  ).slice(0, 8);

  /** Strong false positives */
  if (/united parks|wellfound\b|marketing live/i.test(msg.subject ?? '') &&
      !/yahoo|linkedin digest/i.test(t)) {
    if (!/^yahoo\b/i.test(company)) return false;
  }

  /** LinkedIn forwarded wrong target */
  const ln = msg.subject?.match(/application was sent to ([^:]+)/i);
  if (ln) {
    const tgt = ln[1].trim().split(/\s+/)[0]?.toLowerCase();
    const first = significant[0] || '';
    if (tgt && first && !tgt.includes(first.slice(0, 3)) && tgt.length > 4) {
      if (!t.includes(significant[0] ?? '') && tgt !== significant[0]) return false;
    }
  }

  let hits = 0;
  for (const w of significant) {
    if (w.length < 3 && !/\d/.test(w)) continue;
    if (t.includes(w)) hits++;
  }
  return hits >= 1 || t.includes(significant[0]?.slice(0, 5) ?? '___');
}

const APP_RX =
  /application (has been )?received|thank you for (your )?(applying|application)|received your application|your application was sent|we('ve|\sve)? received your application|confirmation of your application|^we'?ve\s+received your application/i;

const REJ_RX =
  /not\s+(moving\s+forward|selected|successful|able\s+to\s+offer)|regret\b|won'?t\s+be\s+moving\b|chosen\s+(another|candidates?\b)|unable\s+to\s+(?:offer|proceed)|position\s+(has\s+been\s+)?filled|after\s+(careful\s+)?review|wish(?:ing)?\s+you\s+(?:luck|the\s+best).*?(?:moving\s+forward|other\s+candidates)/is;

/** Body/snippet-heavy rejections ("thank you for your interest" + turn-down in same paragraph). */
const REJ_EXPANDED_RX =
  /thank\s+you\s+for\s+(?:your\s+)?(?:interest|application)[\s\S]{0,800}?(?:decided\s+not|not\s+(?:selected|successful|moving)|unable\s+to\s+proceed|(?:will|won't)\s+not\s+(?:be\s+moving|move)|other\s+(?:successful\s+)?candidates|\bunable\s+to\s+offer)/is;

/** LinkedIn mails from jobs/recruiting senders — rejections arrive here often. */
function fromLinkedIn(m) {
  return /@linkedin\.com/i.test(m.from || '');
}

/** Subject line often: "Your application to {Role} at {Company}". */
function linkedInCompanyInSubject(m, company) {
  const sub = (m.subject || '').toLowerCase();
  const chunks = companyToken(company)
    .replace(/[&]/g, ' ')
    .split(/\s+/)
    .map((x) => x.toLowerCase().replace(/\W/g, ''))
    .filter(Boolean);
  for (const ch of chunks) {
    if (ch.length >= 2 && sub.includes(ch)) return true;
  }
  return /\bat\s+[a-z0-9&][^|\n]{1,72}\b/i.test(sub);
}

function linkedInRoughCompanyOverlap(lowerSubject, company) {
  const parts = companyToken(company)
    .replace(/[&]/g, ' ')
    .split(/\s+/);
  let hits = 0;
  for (const p of parts) {
    const w = p.toLowerCase().replace(/\W/g, '');
    if ((w.length >= 4 || (w.length === 2 && /\d/.test(w))) &&
        lowerSubject.includes(w))
      hits++;
    if (
      w.length === 4 &&
      ['cdw', 'x4'].includes(w) &&
      lowerSubject.includes(w)
    )
      hits++;
  }
  return hits >= 1;
}

/** LinkedIn rejection wording often lives mostly in snippet, not Subject. */
const LI_REJECT_SNIPPET_RX =
  /not\s+(?:selected|successful|moving\s+forward)|regret\b|chosen\s+(?:other|another|candidates)|unable\s+to\s+(?:proceed|move\s+forward|offer)|moving\s+forward\s+with\s+other|decided\s+to\s+pursue\s+other|candidacy[^\n]{0,120}?(?:not|won't\s+move)|no\s+longer\s+(?:considering|under\s+consideration)/is;

/** Routed / forwarded confirmations are not rejections (LinkedIn UX copy). */
function linkedInSpamApplyOnly(m, t) {
  return (
    fromLinkedIn(m) && /\b(your\s+)?application\s+was\s+routed\b/i.test(t)
  );
}

function rejectionScore(m, company) {
  if (isSpamLikely(m.subject, m.snippet)) return -100;
  const subject = m.subject || '';
  const snippet = m.snippet || '';
  const t = `${subject}\n${snippet}`;

  const fromLi = fromLinkedIn(m);
  const liAnchored = fromLi && linkedInCompanyInSubject(m, company);

  /** LinkedIn: company often in Subject ("… at Company"); reject copy in snippet. */
  if (!liAnchored && !companyInMessage(company, m)) return -100;
  if (linkedInSpamApplyOnly(m, t)) return -100;

  if (
    liAnchored &&
    (LI_REJECT_SNIPPET_RX.test(snippet) ||
      LI_REJECT_SNIPPET_RX.test(subject) ||
      REJ_RX.test(t) ||
      REJ_EXPANDED_RX.test(t))
  ) {
    return 22;
  }

  if (
    REJ_RX.test(t) ||
    REJ_EXPANDED_RX.test(t) ||
    (LI_REJECT_SNIPPET_RX.test(snippet) &&
      linkedInRoughCompanyOverlap(t.toLowerCase(), company))
  ) {
    return 14;
  }
  return -100;
}

async function fetchMsgs(gmail, q) {
  const seen = new Set();
  const out = [];
  const list = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: 35,
  });
  for (const { id } of list.data.messages || []) {
    if (seen.has(id)) continue;
    seen.add(id);
    const full = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    });
    const headers = full.data.payload?.headers || [];
    const h = (n) =>
      headers.find((x) => x.name?.toLowerCase() === n.toLowerCase())?.value || '';
    const internalDate = full.data.internalDate
      ? new Date(Number(full.data.internalDate))
      : null;
    const internalYMD = internalDate
      ? internalDate.toISOString().slice(0, 10)
      : '';
    if (internalYMD && internalYMD < MIN_MAIL_YMD) continue;

    out.push({
      id,
      subject: h('Subject'),
      from: h('From'),
      snippet: full.data.snippet || '',
      internalDate,
      internalYMD,
    });
  }
  return out;
}

function scoreApplied(m, company) {
  if (!companyInMessage(company, m) || isSpamLikely(m.subject, m.snippet))
    return -100;
  const t = `${m.subject}\n${m.snippet}`;
  let s = 0;
  if (APP_RX.test(t)) s += 8;
  if (/ashby|greenhouse|icims\.|gem\.com|Lever|workday/i.test(m.from)) s += 4;
  if (/jobs-noreply@linkedin/i.test(m.from) && /application was sent/i.test(t))
    s += 5;
  if (/thank you for applying to/i.test(t)) s += 3;
  /** Penalise generic LinkedIn blobs */
  if (/LinkedIn<i/i.test(t) && /application was sent/.test(t) && companyInMessage(company, m))
    s += 2;
  return s;
}

async function auditOne(gmail, row) {
  const tok = companyToken(row.company);
  const num = row.num;
  const qs = [`newer_than:730d "${tok}"`];
  /** LinkedIn: From is often `@linkedin.com` while company + role sit in Subject — prime that pool first. */
  if (row.status.startsWith('Rejected')) {
    qs.unshift(`newer_than:540d from:linkedin "${tok}"`);
  }
  const extra = EXTRA_QUERIES[Number(num)] || [];
  for (const q of extra) qs.unshift(q);

  const uniq = new Map();
  for (const q of qs) {
    try {
      for (const m of await fetchMsgs(gmail, q)) uniq.set(m.id, m);
    } catch {
      /** skip bad query */
    }
  }

  const msgs = [...uniq.values()];

  if (row.status === 'Applied') {
    const cand = msgs
      .map((m) => ({ m, s: scoreApplied(m, row.company) }))
      .filter((x) => x.s >= 6)
      .sort(
        (a, b) =>
          (b.internalDate?.getTime() || 0) - (a.internalDate?.getTime() || 0)
      );

    /** Prefer ATS/real ack over duplicates */
    let best = cand[0]?.m;

    /** If duplicate dates, earliest within top band */
    const top = cand.filter((x) => x.m.internalYMD === best?.internalYMD);
    if (top.length > 1) {
      const alt = cand.sort(
        (a, b) =>
          (a.internalDate?.getTime() || 0) - (b.internalDate?.getTime() || 0)
      );
      best = alt[0].m;
    }

    if (best?.internalYMD && scoreApplied(best, row.company) >= 6) {
      const sub = String(best.subject).replace(/\|/g, '/').slice(0, 85);
      return {
        ok: true,
        ymd: best.internalYMD,
        line: `${best.internalYMD}: Gmail: application acknowledgement (${tok.slice(0, 42)} — ${sub}). `,
        kind: 'gmail_ack',
      };
    }
  } else if (row.status.startsWith('Rejected')) {
    const cand = msgs
      .map((m) => ({ m, s: rejectionScore(m, row.company) }))
      .filter((x) => x.s >= 14)
      .sort(
        (a, b) =>
          (b.internalDate?.getTime() || 0) - (a.internalDate?.getTime() || 0)
      );
    const best = cand[0]?.m;
    if (best?.internalYMD) {
      const sub = String(best.subject).replace(/\|/g, '/').slice(0, 85);
      const liTag = fromLinkedIn(best) ? ' [LinkedIn]' : '';
      return {
        ok: true,
        ymd: best.internalYMD,
        line: `${best.internalYMD}: Gmail: rejection notice (${tok.slice(0, 42)} — ${sub})${liTag}. `,
        kind: 'gmail_rejection',
        linkedin: fromLinkedIn(best),
      };
    }
  }

  return { ok: false, tries: msgs.length };
}

function hasAudit(notes) {
  return /\d{4}-\d{2}-\d{2}: Gmail:/i.test(notes || '');
}

/** Rows where we falsely said "no rejection in Gmail" — allow re-scan. */
function staleRejectedPlaceholder(notes) {
  return /\bno rejection email found|No Ashby rejection mail|no separate rejection email\b/i.test(
    notes || ''
  );
}

function alreadyHasRejectLine(notes) {
  return /\d{4}-\d{2}-\d{2}: Gmail: rejection notice/i.test(notes || '');
}

async function main() {
  const pathMd = join(projectRoot, 'data', 'applications.md');
  const lines = readFileSync(pathMd, 'utf8').split('\n');
  const gmail = getGmailClient();
  const report = [];

  for (let i = 0; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (!row) continue;

    const st = row.status.trim().replace(/\s+/g, ' ');
    if (st === 'Evaluated') continue;
    const staleReject =
      st.startsWith('Rejected') &&
      staleRejectedPlaceholder(row.notes) &&
      !alreadyHasRejectLine(row.notes);

    if (hasAudit(row.notes) && !staleReject) {
      report.push({ num: row.num, skip: true });
      continue;
    }

    await new Promise((r) => setTimeout(r, 140));
    const res = await auditOne(gmail, { ...row, status: st });
    if (res.ok && res.line) {
      row.notes = res.line + (row.notes || '');
      lines[i] = formatRow(row);
      report.push({ num: row.num, company: row.company, gmail: true, ymd: res.ymd });
      if (res.kind === 'gmail_ack') {
        appendEvent(projectRoot, {
          at: res.ymd,
          num: row.num,
          company: row.company,
          role: row.role,
          event: 'gmail_ack',
          source: 'gmail-audit',
        });
      } else if (res.kind === 'gmail_rejection') {
        appendEvent(projectRoot, {
          at: res.ymd,
          num: row.num,
          company: row.company,
          role: row.role,
          event: 'gmail_rejection',
          source: 'gmail-audit',
          ...(res.linkedin ? { channel: 'linkedin' } : {}),
        });
      }
    } else {
      report.push({
        num: row.num,
        company: row.company,
        status: st,
        gmail: false,
        pooled: res.tries,
      });
    }
  }

  writeFileSync(pathMd, lines.join('\n'), 'utf8');
  console.log(JSON.stringify({ report }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
