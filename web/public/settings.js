const $ = (id) => document.getElementById(id);

function linesToText(arr) {
  return (arr || []).join('\n');
}

function textToLines(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function showBanner(msg, isErr) {
  const b = $('banner');
  b.textContent = msg;
  b.classList.toggle('hidden', !msg);
  b.style.background = isErr
    ? 'rgba(248, 81, 73, 0.12)'
    : 'rgba(63, 185, 80, 0.12)';
  b.style.borderColor = isErr
    ? 'rgba(248, 81, 73, 0.35)'
    : 'rgba(63, 185, 80, 0.35)';
  b.style.color = isErr ? '#ffa198' : '#acf2bd';
}

function appendToggleRow(container, kind, index, name, checked, detailText) {
  const row = document.createElement('label');
  row.className = 'toggle-row';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.dataset.kind = kind;
  input.dataset.name = name;
  input.id = `${kind}-${index}`;
  input.checked = checked;

  const title = document.createElement('span');
  title.className = 'toggle-title';
  title.textContent = name;

  const detail = document.createElement('span');
  detail.className =
    kind === 'sq' ? 'toggle-query' : 'toggle-notes';
  detail.textContent = detailText;

  row.appendChild(input);
  row.appendChild(title);
  row.appendChild(detail);
  container.appendChild(row);
}

async function load() {
  const r = await fetch('/api/config');
  const data = await r.json();
  if (data.error) {
    showBanner(data.error, true);
    return;
  }
  $('rootPath').textContent = data.careerOpsPath || '';
  const c = data.config;

  const tf = c.title_filter || {};
  const com = tf.commerce || {};
  const gen = tf.general || {};
  $('tfComPos').value = linesToText(com.positive);
  $('tfComNeg').value = linesToText(com.negative);
  $('tfComSen').value = linesToText(com.seniority_boost);
  $('tfGenPos').value = linesToText(gen.positive);
  $('tfGenNeg').value = linesToText(gen.negative);
  $('tfGenPen').value = linesToText(gen.seniority_penalty);
  $('targetRoles').value = linesToText(c.target_roles_primary);

  const sq = $('searchQueries');
  sq.replaceChildren();
  (c.search_queries || []).forEach((q, i) => {
    appendToggleRow(sq, 'sq', i, q.name, q.enabled !== false, q.query || '');
  });

  const tc = $('trackedCos');
  tc.replaceChildren();
  (c.tracked_companies || []).forEach((co, i) => {
    appendToggleRow(
      tc,
      'tc',
      i,
      co.name,
      co.enabled !== false,
      co.notes || ''
    );
  });

  showBanner('', false);
}

async function save() {
  const body = {
    title_filter: {
      commerce: {
        positive: textToLines($('tfComPos').value),
        negative: textToLines($('tfComNeg').value),
        seniority_boost: textToLines($('tfComSen').value),
      },
      general: {
        positive: textToLines($('tfGenPos').value),
        negative: textToLines($('tfGenNeg').value),
        seniority_penalty: textToLines($('tfGenPen').value),
      },
    },
    target_roles_primary: textToLines($('targetRoles').value),
    search_queries: Array.from(
      document.querySelectorAll('input[data-kind="sq"]')
    ).map((el) => ({
      name: el.dataset.name,
      enabled: el.checked,
    })),
    tracked_companies: Array.from(
      document.querySelectorAll('input[data-kind="tc"]')
    ).map((el) => ({
      name: el.dataset.name,
      enabled: el.checked,
    })),
  };

  try {
    const r = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!data.ok) {
      showBanner(data.error || 'Save failed', true);
      return;
    }
    showBanner('Saved. Backups: portals.yml.bak & profile.yml.bak', false);
  } catch (e) {
    showBanner(String(e.message || e), true);
  }
}

$('btnReload').addEventListener('click', load);
$('btnSave').addEventListener('click', save);
load();
