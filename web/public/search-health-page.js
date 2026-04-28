const $ = (id) => document.getElementById(id);

const COLORS = {
  accent: '#6eb5ff',
  good: '#3fb950',
  bad: '#ff7b72',
  warn: '#d29922',
  muted: '#8b9cb3',
  bar1: '#6eb5ff',
  bar2: '#a78bfa',
  bar3: '#f78c6c',
};

let charts = [];

function destroyCharts() {
  for (const c of charts) {
    try {
      c.destroy();
    } catch {
      /* */
    }
  }
  charts = [];
}

/** @typedef {{ ok: true }} ShPayload approx */

function binsForAckDays(perApplication) {
  const vals = [];
  for (const p of perApplication) {
    const d = p.daysApplyToAck;
    if (typeof d === 'number' && !Number.isNaN(d)) vals.push(d);
  }
  if (!vals.length) return { labels: [], data: [] };
  const buckets = [
    ['0', 0],
    ['1', 0],
    ['2–3', 0],
    ['4–7', 0],
    ['8+', 0],
  ];
  for (const d of vals) {
    if (d <= 0) buckets[0][1]++;
    else if (d === 1) buckets[1][1]++;
    else if (d <= 3) buckets[2][1]++;
    else if (d <= 7) buckets[3][1]++;
    else buckets[4][1]++;
  }
  return {
    labels: buckets.map(([k]) => k),
    data: buckets.map(([, v]) => v),
  };
}

async function fetchPayload() {
  const asOf = $('shAsOf')?.value?.trim();
  const qs = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
  const r = await fetch(`/api/search-health${qs}`);
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `${r.status} ${r.statusText}`);
  }
  return /** @type {Promise<Record<string, unknown>>} */ (r.json());
}

function render(payload) {
  destroyCharts();

  const snap = $('snap');
  const bars = $('bars');
  const hist = $('hist');
  const Chart = window.Chart;
  if (!Chart) throw new Error('Chart.js missing');

  const snapObj = payload.snapshot || {};
  const labs = Object.keys(snapObj);
  const data = labs.map((k) => snapObj[k]);

  charts.push(
    new Chart(snap, {
      type: 'doughnut',
      data: {
        labels: labs.map((x) =>
          typeof x === 'string' ? x.charAt(0).toUpperCase() + x.slice(1) : String(x),
        ),
        datasets: [
          {
            data,
            backgroundColor: [
              COLORS.accent,
              COLORS.good,
              COLORS.bad,
              COLORS.warn,
              COLORS.muted,
              '#8899aa',
            ],
            borderColor: '#2d3a4d',
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: COLORS.muted } } },
        maintainAspectRatio: false,
      },
    }),
  );

  const w = payload.windows || {};
  const w14 = w.d14 || {};
  const w30 = w.d30 || {};
  const w90 = w.w90 || w.d90 || {};

  charts.push(
    new Chart(bars, {
      type: 'bar',
      data: {
        labels: ['14d', '30d', '90d'],
        datasets: [
          {
            label: 'status→Applied (# distinct)',
            data: [
              w14.statusAppliedDistinctNums ?? 0,
              w30.statusAppliedDistinctNums ?? 0,
              w90.statusAppliedDistinctNums ?? 0,
            ],
            backgroundColor: COLORS.bar1,
          },
          {
            label: 'gmail_ack',
            data: [w14.gmailAckEvents ?? 0, w30.gmailAckEvents ?? 0, w90.gmailAckEvents ?? 0],
            backgroundColor: COLORS.bar2,
          },
          {
            label: 'gmail rejection',
            data: [
              w14.gmailRejectionEvents ?? 0,
              w30.gmailRejectionEvents ?? 0,
              w90.gmailRejectionEvents ?? 0,
            ],
            backgroundColor: COLORS.bad,
          },
          {
            label: 'status→Rejected',
            data: [
              w14.statusRejectedEvents ?? 0,
              w30.statusRejectedEvents ?? 0,
              w90.statusRejectedEvents ?? 0,
            ],
            backgroundColor: COLORS.bar3,
          },
        ],
      },
      options: {
        scales: {
          x: { ticks: { color: COLORS.muted }, grid: { color: '#2d3a4d' } },
          y: { ticks: { color: COLORS.muted }, grid: { color: '#2d3a4d' }, beginAtZero: true },
        },
        plugins: { legend: { labels: { color: COLORS.muted } } },
        maintainAspectRatio: false,
      },
    }),
  );

  const h = binsForAckDays(payload.perApplication || []);
  charts.push(
    new Chart(hist, {
      type: 'bar',
      data: {
        labels: h.labels,
        datasets: [{ label: 'count', data: h.data, backgroundColor: COLORS.accent }],
      },
      options: {
        scales: {
          x: { ticks: { color: COLORS.muted }, grid: { color: '#2d3a4d' } },
          y: { ticks: { color: COLORS.muted }, grid: { color: '#2d3a4d' }, beginAtZero: true },
        },
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
      },
    }),
  );
}

function renderMetrics(payload) {
  const t = payload.timing || {};
  const o = payload.openness || {};
  const m = $('shMetrics');
  m.innerHTML = `
    <div class="metric"><div class="label">As-of</div><div class="value">${String(payload.meta?.asOf ?? '—').slice(0, 10)}</div></div>
    <div class="metric"><div class="label">median days → Gmail ack</div><div class="value">${t.medianDaysApplyToFirstGmailAck ?? '—'}</div></div>
    <div class="metric"><div class="label">median days → first rejection</div><div class="value">${t.medianDaysApplyToFirstRejection ?? '—'}</div></div>
    <div class="metric"><div class="label">Applied (open)</div><div class="value">${o.appliedOpenCount ?? '—'}</div></div>
    <div class="metric"><div class="label">Stale no-ack rows</div><div class="value">${(o.staleAppliedNoAck || []).length}</div></div>
    <div class="metric"><div class="label">rejections last 30d</div><div class="value">${payload.funnel?.rejectionsCapturedLast30d ?? '—'}</div></div>
  `;
}

function renderSignals(payload) {
  const sr = $('shSignalsRed');
  const sa = $('shSignalsAmber');
  const red = payload.signals?.red || [];
  const amber = payload.signals?.amber || [];
  sr.innerHTML = red.length
    ? `<h3 style="margin:0 0 .5rem;color:${COLORS.bad}">Red</h3><ul>${red.map((s) => `<li>${escapeHtml(String(s))}</li>`).join('')}</ul>`
    : '';
  sa.innerHTML = amber.length
    ? `<h3 style="margin:.75rem 0 .5rem;color:${COLORS.warn}">Amber</h3><ul>${amber.map((s) => `<li>${escapeHtml(String(s))}</li>`).join('')}</ul>`
    : '';
}

function renderStale(payload) {
  const stale = payload.openness?.staleAppliedNoAck || [];
  const el = $('shStale');
  if (!stale.length) {
    el.innerHTML = `<p style="margin:0;color:var(--muted)">None over ${payload.openness?.staleThresholdDays ?? '—'}d.</p>`;
    return;
  }
  el.innerHTML = `
    <table class="sh-mini" aria-label="Stale applied">
      <thead><tr><th>#</th><th>Company</th><th>Days waiting</th><th>Since</th></tr></thead>
      <tbody>
        ${stale
          .map(
            (s) =>
              `<tr><td>${escapeHtml(String(s.num))}</td><td>${escapeHtml(String(s.company))}</td><td>${escapeHtml(String(s.daysWaiting))}</td><td>${escapeHtml(String(s.appliedOrProxyAt))}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function load() {
  const banner = $('shBanner');
  try {
    const payload = await fetchPayload();
    if (payload.ok === false || !payload.meta) throw new Error('invalid payload');

    $('shMeta').textContent =
      `${payload.meta.rows} tracker rows · ${payload.meta.eventLines} event lines`;

    $('shAsOf').value =
      String(payload.meta.asOf || '').slice(0, 10) ||
      $('shAsOf').value ||
      new Date().toISOString().slice(0, 10);

    renderMetrics(payload);
    render(payload);
    renderSignals(payload);
    renderStale(payload);
    banner.classList.add('hidden');
  } catch (e) {
    banner.textContent = String(e?.message || e);
    banner.classList.remove('hidden');
  }
}

$('shRefresh')?.addEventListener('click', load);
$('shAsOf')?.addEventListener('change', load);

document.addEventListener('DOMContentLoaded', load);
