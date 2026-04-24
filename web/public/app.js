const $ = (id) => document.getElementById(id);

let allApps = [];

/** @type {{ key: string | null, dir: 'asc' | 'desc' }} */
let sortState = { key: null, dir: 'asc' };

const SORT_STORAGE_KEY = 'careerOpsTrackerSort';

const defaultSortDir = {
  num: 'desc',
  date: 'desc',
  company: 'asc',
  role: 'asc',
  score: 'desc',
  status: 'asc',
};

/** Custom status order (asc): active pipeline first, then backlog. */
const STATUS_SORT_ORDER = [
  'Applied',
  'Responded',
  'Interview',
  'Offer',
  'Rejected',
  'Discarded',
  'Evaluated',
  'SKIP',
];

/**
 * @param {string | undefined} status
 * @returns {number}
 */
function statusSortRank(status) {
  const s = String(status || '')
    .trim()
    .toLowerCase();
  const i = STATUS_SORT_ORDER.findIndex((x) => x.toLowerCase() === s);
  return i === -1 ? STATUS_SORT_ORDER.length : i;
}

function loadSortState() {
  try {
    const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return { key: null, dir: 'asc' };
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.key == null || Object.hasOwn(defaultSortDir, parsed.key)) &&
      (parsed.dir === 'asc' || parsed.dir === 'desc')
    ) {
      return { key: parsed.key || null, dir: parsed.dir };
    }
  } catch {
    // Ignore unavailable or malformed localStorage.
  }
  return { key: null, dir: 'asc' };
}

function saveSortState() {
  try {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortState));
  } catch {
    // Sorting still works when localStorage is unavailable.
  }
}

/**
 * @param {object} app
 * @returns {number | null} numeric score, or null if N/A / missing
 */
function scoreRank(app) {
  const raw = String(app.scoreRaw || '')
    .replace(/\*\*/g, '')
    .trim();
  if (raw === 'N/A' || raw === 'DUP' || raw === '') return null;
  if (typeof app.score === 'number' && !Number.isNaN(app.score) && app.score > 0) {
    return app.score;
  }
  const m = raw.match(/(\d+\.?\d*)\s*\/\s*5/);
  return m ? parseFloat(m[1]) : null;
}

function getSortedApps() {
  if (!sortState.key) return [...allApps];
  const key = sortState.key;
  const mult = sortState.dir === 'asc' ? 1 : -1;
  return [...allApps].sort((a, b) => {
    switch (key) {
      case 'num':
        return mult * ((a.number || 0) - (b.number || 0));
      case 'date':
        return mult * String(a.date || '').localeCompare(String(b.date || ''));
      case 'company':
        return (
          mult *
          String(a.company || '').localeCompare(String(b.company || ''), undefined, {
            sensitivity: 'base',
          })
        );
      case 'role':
        return (
          mult *
          String(a.role || '').localeCompare(String(b.role || ''), undefined, {
            sensitivity: 'base',
          })
        );
      case 'score': {
        const ra = scoreRank(a);
        const rb = scoreRank(b);
        if (ra == null && rb == null) return 0;
        if (ra == null) return 1;
        if (rb == null) return -1;
        return mult * (ra - rb);
      }
      case 'status': {
        const ra = statusSortRank(a.status);
        const rb = statusSortRank(b.status);
        if (ra !== rb) return mult * (ra - rb);
        return (
          mult *
          String(a.status || '').localeCompare(String(b.status || ''), undefined, {
            sensitivity: 'base',
          })
        );
      }
      default:
        return 0;
    }
  });
}

function updateSortUI() {
  document.querySelectorAll('.th-sort').forEach((btn) => {
    const th = btn.closest('th');
    const k = btn.dataset.sort;
    const isActive = sortState.key === k;
    btn.classList.toggle('is-active', isActive);
    let hint = btn.querySelector('.sort-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'sort-hint';
      hint.setAttribute('aria-hidden', 'true');
      btn.appendChild(hint);
    }
    hint.textContent = isActive ? (sortState.dir === 'asc' ? ' ▲' : ' ▼') : '';
    if (th) {
      if (isActive) {
        th.setAttribute(
          'aria-sort',
          sortState.dir === 'asc' ? 'ascending' : 'descending',
        );
      } else {
        th.removeAttribute('aria-sort');
      }
    }
  });
}

function renderTableBody() {
  $('tbody').innerHTML = getSortedApps().map(rowHtml).join('');
  applyFilter();
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMetrics(m, pm) {
  const rejected = m.byStatus?.rejected || 0;
  const evaluated = m.byStatus?.evaluated || 0;
  const applied = m.byStatus?.applied || 0;
  const responded = m.byStatus?.responded || 0;
  $('metrics').innerHTML = `
    <div class="metric"><div class="label">Tracker rows</div><div class="value">${m.total}</div></div>
    <div class="metric"><div class="label">Avg score</div><div class="value">${m.avgScore ? m.avgScore.toFixed(2) : '—'}</div></div>
    <div class="metric"><div class="label">Top score</div><div class="value">${m.topScore ? m.topScore.toFixed(2) : '—'}</div></div>
    <div class="metric"><div class="label">Evaluated</div><div class="value">${evaluated}</div></div>
    <div class="metric"><div class="label">Applied</div><div class="value">${applied}</div></div>
    <div class="metric"><div class="label">Responded</div><div class="value">${responded}</div></div>
    <div class="metric metric-negative"><div class="label">Rejected</div><div class="value">${rejected}</div></div>
  `;

  const funnel = (pm.funnelStages || [])
    .map(
      (st) => `
    <div class="funnel-row">
      <span>${esc(st.label)}</span>
      <span>${st.count} (${st.pct.toFixed(0)}%)</span>
      <div class="bar"><i style="width:${Math.min(100, st.pct)}%"></i></div>
    </div>`
    )
    .join('');

  const buckets = (pm.scoreBuckets || [])
    .map((b) => `<span class="bucket">${esc(b.label)}: ${b.count}</span>`)
    .join('');

  $('progress').innerHTML = `
    <div class="card">
      <h2>Funnel <span class="card-hint">(counts by Status)</span></h2>
      <div class="funnel">${funnel}</div>
    </div>
    <div class="card">
      <h2>Score distribution</h2>
      <div class="buckets">${buckets}</div>
      <div class="rates" style="margin-top:0.75rem">
        Response ${pm.responseRate?.toFixed(0) ?? '—'}% ·
        Interview ${pm.interviewRate?.toFixed(0) ?? '—'}% ·
        Offer ${pm.offerRate?.toFixed(0) ?? '—'}%
      </div>
    </div>
    <div class="card">
      <h2>Weekly activity <span class="card-hint">(new rows logged)</span></h2>
      <div class="rates">
        ${(pm.weeklyActivity || [])
          .map((w) => `${esc(w.week)}: ${w.count}`)
          .join(' · ') || '—'}
      </div>
    </div>
  `;
}

function rowHtml(app) {
  const reportUrl = app.reportPath
    ? `/api/report?path=${encodeURIComponent(app.reportPath)}`
    : '#';
  const absoluteReportUrl =
    app.reportPath && reportUrl !== '#'
      ? new URL(reportUrl, window.location.href).href
      : '#';
  const job = app.jobURL
    ? `<a href="${esc(app.jobURL)}" target="_blank" rel="noreferrer">Job</a>`
    : '';
  const statusClass = `status status-${String(app.status || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;
  return `<tr data-row>
    <td>${app.number}</td>
    <td>${esc(app.date)}</td>
    <td>${esc(app.company)}</td>
    <td>${esc(app.role)}</td>
    <td>${esc(app.scoreRaw || '')}</td>
    <td><span class="${statusClass}">${esc(app.status)}</span></td>
    <td><a href="${esc(absoluteReportUrl)}" target="_blank" rel="noopener" data-report-link>#${esc(app.reportNumber)}</a></td>
    <td class="tldr">${esc(app.tldr || '')}</td>
    <td class="links">${job}</td>
  </tr>`;
}

function applyFilter() {
  const q = ($('filter').value || '').trim().toLowerCase();
  const rows = document.querySelectorAll('[data-row]');
  rows.forEach((tr) => {
    const text = tr.innerText.toLowerCase();
    tr.classList.toggle('hidden-row', q && !text.includes(q));
  });
}

async function load() {
  const r = await fetch('/api/pipeline');
  const data = await r.json();
  $('rootPath').textContent = data.careerOpsPath || '';

  if (!data.ok) {
    $('banner').textContent = data.error || 'Could not load tracker data.';
    $('banner').classList.remove('hidden');
    $('tbody').innerHTML = '';
    $('metrics').innerHTML = '';
    $('progress').innerHTML = '';
    return;
  }

  $('banner').classList.add('hidden');
  allApps = data.applications || [];
  sortState = loadSortState();
  renderMetrics(data.metrics, data.progressMetrics);
  renderTableBody();
  updateSortUI();
}

$('filter').addEventListener('input', applyFilter);
$('btnRefresh').addEventListener('click', load);

$('tbody').addEventListener('click', (e) => {
  const link = e.target.closest('[data-report-link]');
  if (!link || !link.href || link.href.endsWith('#')) return;
  e.preventDefault();

  const opened = window.open(link.href, '_blank');
  if (opened) {
    opened.opener = null;
  } else {
    window.location.href = link.href;
  }
});

document.querySelector('table thead')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.th-sort');
  if (!btn || !btn.dataset.sort) return;
  const key = btn.dataset.sort;
  if (sortState.key === key) {
    sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
  } else {
    sortState.key = key;
    sortState.dir = /** @type {'asc' | 'desc'} */ (
      defaultSortDir[key] || 'asc'
    );
  }
  saveSortState();
  updateSortUI();
  renderTableBody();
});

load();
