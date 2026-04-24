/**
 * Wrap evaluation markdown in a readable HTML document (matches dashboard vibe).
 */
import showdown from 'showdown';

const converter = new showdown.Converter({
  tables: true,
  tasklists: true,
  strikethrough: true,
  simplifiedAutoLink: true,
  openLinksInNewWindow: true,
  ghCodeBlocks: true,
});

/** @param {string} markdown @param {{ title?: string, rawUrl?: string }} meta */
export function markdownToReportHtml(markdown, meta = {}) {
  const title = meta.title || 'Report';
  const rawUrl = meta.rawUrl || '';
  const bodyHtml = converter.makeHtml(markdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #0f1419;
      --panel: #1a2332;
      --text: #e6edf3;
      --muted: #8b9cb3;
      --accent: #6eb5ff;
      --border: #2d3a4d;
      --code-bg: #0d1117;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height:1.65;
      color: var(--text);
      background: var(--bg);
      padding: 0 1rem 3rem;
    }
    .bar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      background: rgba(15, 20, 25, 0.92);
      backdrop-filter: blur(8px);
    }
    .bar a {
      color: var(--accent);
      text-decoration: none;
      font-size: 0.88rem;
    }
    .bar a:hover { text-decoration: underline; }
    .wrap {
      max-width: 52rem;
      margin: 0 auto;
    }
    article {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.5rem 1.75rem 2rem;
    }
    article :first-child { margin-top: 0; }
    h1 {
      font-size: 1.65rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 1rem;
      line-height: 1.25;
      color: #f0f4f8;
    }
    h2 {
      font-size: 1.2rem;
      font-weight: 650;
      margin: 1.75rem 0 0.75rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--border);
      color: #c8d4e0;
    }
    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 1.25rem 0 0.5rem;
      color: var(--muted);
    }
    p { margin: 0.65rem 0; }
    a { color: var(--accent); }
    strong { color: #f0f4f8; font-weight: 600; }
    ul, ol { margin: 0.5rem 0 0.75rem; padding-left: 1.35rem; }
    li { margin: 0.35rem 0; }
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 1.5rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.5rem 0.65rem;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: rgba(110, 181, 255, 0.08);
      color: var(--muted);
      font-weight: 600;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) td { background: rgba(0,0,0,0.15); }
    code {
      font-family: ui-monospace, "Cascadia Code", "Segoe UI Mono", monospace;
      font-size: 0.88em;
      background: var(--code-bg);
      padding: 0.12rem 0.35rem;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.84rem;
      line-height: 1.5;
    }
    pre code {
      background: none;
      border: none;
      padding: 0;
    }
    blockquote {
      margin: 1rem 0;
      padding: 0.5rem 0 0.5rem 1rem;
      border-left: 3px solid var(--accent);
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="bar">
      <a href="/">← Pipeline tracker</a>
      ${rawUrl ? `<a href="${escapeHtml(rawUrl)}">View raw Markdown</a>` : ''}
    </div>
    <article class="markdown-body">
      ${bodyHtml}
    </article>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
