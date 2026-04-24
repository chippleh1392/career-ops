/**
 * Pipeline data layer — mirrors dashboard/internal/data/career.go (read-only paths).
 */
import fs from 'node:fs';
import path from 'node:path';

const reReportLink = /\[(\d+)\]\(([^)]+)\)/;
const reScoreValue = /(\d+\.?\d*)\/5/;
const reArchetype = /\*\*Arquetipo(?:\s+detectado)?\*\*\s*\|\s*(.+)/i;
const reTlDr = /\*\*TL;DR\*\*\s*\|\s*(.+)/i;
const reTlDrColon = /\*\*TL;DR:\*\*\s*(.+)/i;
const reRemote = /\*\*Remote\*\*\s*\|\s*(.+)/i;
const reComp = /\*\*Comp\*\*\s*\|\s*(.+)/i;
const reArchetypeColon = /\*\*Arquetipo:\*\*\s*(.+)/i;
const reReportURL = /^\*\*URL:\*\*\s*(https?:\/\/\S+)/m;
const reBatchID = /^\*\*Batch ID:\*\*\s*(\d+)/m;

function normalizeCompany(name) {
  let s = name.toLowerCase().trim();
  const suffixes = [
    ' inc.',
    ' inc',
    ' llc',
    ' ltd',
    ' corp',
    ' corporation',
    ' technologies',
    ' technology',
    ' group',
    ' co.',
  ];
  for (const suf of suffixes) {
    if (s.endsWith(suf)) s = s.slice(0, -suf.length);
  }
  return s.trim();
}

export function normalizeStatus(raw) {
  let s = raw.replace(/\*\*/g, '').trim().toLowerCase();
  const dateIdx = s.search(/\s+202\d/);
  if (dateIdx > 0) s = s.slice(0, dateIdx).trim();

  if (
    s.includes('no aplicar') ||
    s.includes('no_aplicar') ||
    s === 'skip' ||
    s.includes('geo blocker')
  )
    return 'skip';
  if (s.includes('interview') || s.includes('entrevista')) return 'interview';
  if (s === 'offer' || s.includes('oferta')) return 'offer';
  if (s.includes('responded') || s.includes('respondido')) return 'responded';
  if (
    s.includes('applied') ||
    s.includes('aplicado') ||
    s === 'enviada' ||
    s === 'aplicada' ||
    s === 'sent'
  )
    return 'applied';
  if (s.includes('rejected') || s.includes('rechazado') || s === 'rechazada')
    return 'rejected';
  if (
    s.includes('discarded') ||
    s.includes('descartado') ||
    s === 'descartada' ||
    s === 'cerrada' ||
    s === 'cancelada' ||
    s.startsWith('duplicado') ||
    s.startsWith('dup')
  )
    return 'discarded';
  if (
    s.includes('evaluated') ||
    s.includes('evaluada') ||
    s === 'condicional' ||
    s === 'hold' ||
    s === 'monitor' ||
    s === 'evaluar' ||
    s === 'verificar'
  )
    return 'evaluated';
  return s;
}

function cleanTableCell(cell) {
  return String(cell)
    .trim()
    .replace(/\|+$/g, '')
    .trim();
}

/** True for |---|---| and for | --- | --- | (Prettier / many Markdown formatters). */
function isMarkdownSeparatorRow(fields) {
  const nonEmpty = fields.filter((f) => f !== '');
  if (nonEmpty.length < 2) return false;
  return nonEmpty.every((f) => /^[\s\-:]+$/.test(f));
}

function loadBatchInputURLs(careerOpsPath) {
  const inputPath = path.join(careerOpsPath, 'batch', 'batch-input.tsv');
  if (!fs.existsSync(inputPath)) return null;
  const inputData = fs.readFileSync(inputPath, 'utf8');
  const result = {};
  for (const line of inputData.split('\n')) {
    const fields = line.split('\t');
    if (fields.length < 4 || fields[0] === 'id') continue;
    const id = fields[0];
    const notes = fields[3];
    const idx = notes.lastIndexOf('| ');
    if (idx >= 0) {
      const u = notes.slice(idx + 2).trim();
      if (u.startsWith('http')) {
        result[id] = u;
        continue;
      }
    }
    if (fields[1]?.startsWith('http')) result[id] = fields[1];
  }
  return result;
}

function loadJobURLs(careerOpsPath) {
  const inputPath = path.join(careerOpsPath, 'batch', 'batch-input.tsv');
  const statePath = path.join(careerOpsPath, 'batch', 'batch-state.tsv');
  if (!fs.existsSync(inputPath) || !fs.existsSync(statePath)) return null;

  const inputData = fs.readFileSync(inputPath, 'utf8');
  /** @type {Record<string, { id: string, url: string, company: string, role: string }>} */
  const entries = {};
  for (const line of inputData.split('\n')) {
    const fields = line.split('\t');
    if (fields.length < 4 || fields[0] === 'id') continue;
    const id = fields[0];
    const notes = fields[3];
    let url = '';
    const idx = notes.lastIndexOf('| ');
    if (idx >= 0) {
      const u = notes.slice(idx + 2).trim();
      if (u.startsWith('http')) url = u;
    }
    if (!url && fields[1]?.startsWith('http')) url = fields[1];
    let role = '';
    let company = '';
    let notesPart = notes;
    const pipeIdx = notesPart.indexOf(' | ');
    if (pipeIdx >= 0) notesPart = notesPart.slice(0, pipeIdx);
    const atIdx = notesPart.lastIndexOf(' @ ');
    if (atIdx >= 0) {
      role = notesPart.slice(0, atIdx).trim();
      company = notesPart.slice(atIdx + 3).trim();
    }
    if (url) entries[id] = { id, url, company, role };
  }

  const stateData = fs.readFileSync(statePath, 'utf8');
  const reportToURL = {};
  for (const line of stateData.split('\n')) {
    const fields = line.split('\t');
    if (fields.length < 6 || fields[0] === 'id') continue;
    const id = fields[0];
    const status = fields[2];
    const reportNum = fields[5];
    if (status !== 'completed' || !reportNum || reportNum === '-') continue;
    const e = entries[id];
    if (!e) continue;
    reportToURL[reportNum] = e.url;
    if (reportNum.length < 3) {
      reportToURL[String(reportNum).padStart(3, '0')] = e.url;
    }
  }
  return reportToURL;
}

function enrichFromScanHistory(careerOpsPath, apps) {
  const scanPath = path.join(careerOpsPath, 'scan-history.tsv');
  if (!fs.existsSync(scanPath)) return;
  const scanData = fs.readFileSync(scanPath, 'utf8');
  /** @type {Record<string, Array<{ url: string, company: string, title: string }>>} */
  const byCompany = {};
  for (const line of scanData.split('\n')) {
    const fields = line.split('\t');
    if (fields.length < 5 || fields[0] === 'url') continue;
    const url = fields[0];
    const title = fields[3];
    const company = fields[4];
    if (!url?.startsWith('http')) continue;
    const key = normalizeCompany(company);
    if (!byCompany[key]) byCompany[key] = [];
    byCompany[key].push({ url, company, title });
  }

  for (const app of apps) {
    if (app.jobURL) continue;
    const key = normalizeCompany(app.company);
    const matches = byCompany[key];
    if (!matches?.length) continue;
    if (matches.length === 1) {
      app.jobURL = matches[0].url;
    } else {
      const appRole = app.role.toLowerCase();
      let best = matches[0].url;
      let bestScore = 0;
      for (const m of matches) {
        let score = 0;
        const mTitle = m.title.toLowerCase();
        for (const word of appRole.split(/\s+/)) {
          if (word.length > 2 && mTitle.includes(word)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          best = m.url;
        }
      }
      app.jobURL = best;
    }
  }
}

function enrichAppURLsByCompany(careerOpsPath, apps) {
  const inputPath = path.join(careerOpsPath, 'batch', 'batch-input.tsv');
  if (!fs.existsSync(inputPath)) return;
  const inputData = fs.readFileSync(inputPath, 'utf8');
  /** @type {Record<string, Array<{ role: string, url: string }>>} */
  const byCompany = {};
  for (const line of inputData.split('\n')) {
    const fields = line.split('\t');
    if (fields.length < 4 || fields[0] === 'id') continue;
    const notes = fields[3];
    let url = '';
    const idx = notes.lastIndexOf('| ');
    if (idx >= 0) {
      const u = notes.slice(idx + 2).trim();
      if (u.startsWith('http')) url = u;
    }
    if (!url && fields[1]?.startsWith('http')) url = fields[1];
    if (!url) continue;
    let notesPart = notes;
    const pipeIdx = notesPart.indexOf(' | ');
    if (pipeIdx >= 0) notesPart = notesPart.slice(0, pipeIdx);
    const atIdx = notesPart.lastIndexOf(' @ ');
    if (atIdx < 0) continue;
    const role = notesPart.slice(0, atIdx).trim();
    const company = notesPart.slice(atIdx + 3).trim();
    const key = normalizeCompany(company);
    if (!byCompany[key]) byCompany[key] = [];
    byCompany[key].push({ role, url });
  }

  for (const app of apps) {
    if (app.jobURL) continue;
    const key = normalizeCompany(app.company);
    const matches = byCompany[key];
    if (!matches?.length) continue;
    if (matches.length === 1) {
      app.jobURL = matches[0].url;
    } else {
      const appRole = app.role.toLowerCase();
      let best = matches[0].url;
      let bestScore = 0;
      for (const m of matches) {
        let score = 0;
        const mRole = m.role.toLowerCase();
        for (const word of appRole.split(/\s+/)) {
          if (word.length > 2 && mRole.includes(word)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          best = m.url;
        }
      }
      app.jobURL = best;
    }
  }
}

/**
 * @param {string} careerOpsPath
 */
export function parseApplications(careerOpsPath) {
  let filePath = path.join(careerOpsPath, 'applications.md');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(careerOpsPath, 'data', 'applications.md');
  }
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  /** @type {Array<Record<string, unknown>>} */
  const apps = [];
  let num = 0;

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (
      !line ||
      line.startsWith('# ') ||
      line.startsWith('|---') ||
      line.startsWith('| #')
    ) {
      continue;
    }
    if (!line.startsWith('|')) continue;

    let fields;
    if (line.includes('\t')) {
      let rest = line.replace(/^\|/, '').trim();
      fields = rest.split('\t').map((p) => p.replace(/\|/g, '').trim());
    } else {
      // Match Go: Trim leading/trailing | then split (avoids empty first cell)
      let s = line.trim();
      if (s.startsWith('|')) s = s.slice(1).trimStart();
      if (s.endsWith('|')) s = s.slice(0, -1).trimEnd();
      fields = s.split('|').map((p) => p.trim());
    }

    if (fields.length < 8) continue;

    if (isMarkdownSeparatorRow(fields)) continue;
    if (fields[0] === '#' && String(fields[1] || '').toLowerCase().startsWith('date'))
      continue;

    num++;
    const hasPdfColumn = fields.length >= 9;
    const reportCell = hasPdfColumn ? fields[7] : fields[6];
    const notesCell = hasPdfColumn ? fields[8] ?? '' : fields[7] ?? '';

    const app = {
      number: num,
      date: fields[1],
      company: fields[2],
      role: fields[3],
      status: fields[5],
      scoreRaw: fields[4],
      score: 0,
      reportPath: '',
      reportNumber: '',
      notes: notesCell,
      jobURL: '',
    };

    const sm = fields[4].match(reScoreValue);
    if (sm) app.score = parseFloat(sm[1]);

    const rm = reportCell.match(reReportLink);
    if (rm) {
      app.reportNumber = rm[1];
      app.reportPath = rm[2];
    }

    apps.push(app);
  }

  const batchURLs = loadBatchInputURLs(careerOpsPath);
  const reportNumURLs = loadJobURLs(careerOpsPath);

  for (const app of apps) {
    if (!app.reportPath) continue;
    const fullReport = path.join(careerOpsPath, app.reportPath);
    if (!fs.existsSync(fullReport)) continue;
    let header = fs.readFileSync(fullReport, 'utf8');
    if (header.length > 1000) header = header.slice(0, 1000);

    let m = header.match(reReportURL);
    if (m) {
      app.jobURL = m[1];
      continue;
    }
    m = header.match(reBatchID);
    if (m && batchURLs?.[m[1]]) {
      app.jobURL = batchURLs[m[1]];
      continue;
    }
    if (reportNumURLs && app.reportNumber && reportNumURLs[app.reportNumber]) {
      app.jobURL = reportNumURLs[app.reportNumber];
    }
  }

  enrichFromScanHistory(careerOpsPath, apps);
  enrichAppURLsByCompany(careerOpsPath, apps);

  return apps;
}

export function loadReportSummary(careerOpsPath, reportPath) {
  const fullPath = path.join(careerOpsPath, reportPath);
  if (!fs.existsSync(fullPath)) {
    return { archetype: '', tldr: '', remote: '', comp: '' };
  }
  const text = fs.readFileSync(fullPath, 'utf8');

  let archetype = '';
  let m = text.match(reArchetype);
  if (m) archetype = cleanTableCell(m[1]);
  else {
    m = text.match(reArchetypeColon);
    if (m) archetype = cleanTableCell(m[1]);
  }

  let tldr = '';
  m = text.match(reTlDr);
  if (m) tldr = cleanTableCell(m[1]);
  else {
    m = text.match(reTlDrColon);
    if (m) tldr = cleanTableCell(m[1]);
  }

  let remote = '';
  m = text.match(reRemote);
  if (m) remote = cleanTableCell(m[1]);

  let comp = '';
  m = text.match(reComp);
  if (m) comp = cleanTableCell(m[1]);

  if (tldr.length > 120) tldr = tldr.slice(0, 117) + '...';

  return { archetype, tldr, remote, comp };
}

export function computeMetrics(apps) {
  const m = {
    total: apps.length,
    byStatus: {},
    avgScore: 0,
    topScore: 0,
    actionable: 0,
  };

  let totalScore = 0;
  let scored = 0;

  for (const app of apps) {
    const status = normalizeStatus(app.status);
    m.byStatus[status] = (m.byStatus[status] || 0) + 1;

    if (app.score > 0) {
      totalScore += app.score;
      scored++;
      if (app.score > m.topScore) m.topScore = app.score;
    }
    if (!['skip', 'rejected', 'discarded'].includes(status)) m.actionable++;
  }

  if (scored > 0) m.avgScore = totalScore / scored;
  return m;
}

function safePct(part, whole) {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

export function computeProgressMetrics(apps) {
  const statusCounts = {};
  let totalScore = 0;
  let scored = 0;
  let topScore = 0;
  let totalOffers = 0;
  let activeApps = 0;

  for (const app of apps) {
    const norm = normalizeStatus(app.status);
    statusCounts[norm] = (statusCounts[norm] || 0) + 1;

    if (app.score > 0) {
      totalScore += app.score;
      scored++;
      if (app.score > topScore) topScore = app.score;
    }
    if (norm === 'offer') totalOffers++;
    if (!['skip', 'rejected', 'discarded'].includes(norm)) activeApps++;
  }

  const total = apps.length;
  const applied =
    (statusCounts.applied || 0) +
    (statusCounts.responded || 0) +
    (statusCounts.interview || 0) +
    (statusCounts.offer || 0) +
    (statusCounts.rejected || 0);
  const responded =
    (statusCounts.responded || 0) +
    (statusCounts.interview || 0) +
    (statusCounts.offer || 0);
  const interview = (statusCounts.interview || 0) + (statusCounts.offer || 0);
  const offer = statusCounts.offer || 0;

  const funnelStages = [
    { label: 'Evaluated', count: total, pct: 100.0 },
    { label: 'Applied', count: applied, pct: safePct(applied, total) },
    { label: 'Responded', count: responded, pct: safePct(responded, applied) },
    { label: 'Interview', count: interview, pct: safePct(interview, applied) },
    { label: 'Offer', count: offer, pct: safePct(offer, applied) },
  ];

  let responseRate = 0;
  let interviewRate = 0;
  let offerRate = 0;
  if (applied > 0) {
    responseRate = (responded / applied) * 100;
    interviewRate = (interview / applied) * 100;
    offerRate = (offer / applied) * 100;
  }

  const buckets = [0, 0, 0, 0, 0];
  for (const app of apps) {
    if (app.score <= 0) continue;
    if (app.score >= 4.5) buckets[0]++;
    else if (app.score >= 4.0) buckets[1]++;
    else if (app.score >= 3.5) buckets[2]++;
    else if (app.score >= 3.0) buckets[3]++;
    else buckets[4]++;
  }

  const scoreBuckets = [
    { label: '4.5-5.0', count: buckets[0] },
    { label: '4.0-4.4', count: buckets[1] },
    { label: '3.5-3.9', count: buckets[2] },
    { label: '3.0-3.4', count: buckets[3] },
    { label: '<3.0', count: buckets[4] },
  ];

  /** ISO week key YYYY-Www (aligned with Go time.ISOWeek) */
  function isoWeekKey(dateStr) {
    const [Y, M, D] = dateStr.split('-').map(Number);
    if (!Y || !M || !D) return null;
    const d = new Date(Y, M - 1, D);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const week =
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      );
    const y = d.getFullYear();
    return `${y}-W${String(week).padStart(2, '0')}`;
  }

  const weekCounts = {};
  for (const app of apps) {
    const key = isoWeekKey(app.date);
    if (!key) continue;
    weekCounts[key] = (weekCounts[key] || 0) + 1;
  }

  let weeks = Object.keys(weekCounts).sort();
  if (weeks.length > 8) weeks = weeks.slice(-8);

  const weeklyActivity = weeks.map((w) => ({
    week: w,
    count: weekCounts[w],
  }));

  const avgScore = scored > 0 ? totalScore / scored : 0;

  return {
    funnelStages,
    scoreBuckets,
    weeklyActivity,
    responseRate,
    interviewRate,
    offerRate,
    avgScore,
    topScore,
    totalOffers,
    activeApps,
  };
}

/**
 * Full payload for /api/pipeline
 * @param {string} careerOpsPath
 */
export function getPipelineData(careerOpsPath) {
  const apps = parseApplications(careerOpsPath);
  if (!apps) {
    return {
      ok: false,
      error: 'applications.md not found (expected at repo root or data/).',
      applications: [],
      metrics: computeMetrics([]),
      progressMetrics: computeProgressMetrics([]),
    };
  }

  const enriched = apps.map((app) => {
    const sum = app.reportPath
      ? loadReportSummary(careerOpsPath, app.reportPath)
      : {};
    return {
      ...app,
      archetype: sum.archetype || '',
      tldr: sum.tldr || '',
      remote: sum.remote || '',
      compEstimate: sum.comp || '',
    };
  });

  return {
    ok: true,
    applications: enriched,
    metrics: computeMetrics(apps),
    progressMetrics: computeProgressMetrics(apps),
  };
}
