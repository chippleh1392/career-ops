#!/usr/bin/env node
/**
 * Local web dashboard for career-ops pipeline (browser UI).
 * Binds to 127.0.0.1 by default — not exposed on LAN.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPipelineData } from './lib/pipeline.mjs';
import { markdownToReportHtml } from './lib/report-html.mjs';
import {
  loadMarketConfig,
  saveMarketConfig,
} from './lib/market-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const DEFAULT_ROOT = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let careerOpsPath = DEFAULT_ROOT;
  let port = Number(process.env.PORT, 10) || 8787;
  let host = process.env.HOST || '127.0.0.1';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      careerOpsPath = path.resolve(args[++i]);
    } else if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if (args[i] === '--host' && args[i + 1]) {
      host = args[++i];
    }
  }
  return { careerOpsPath, port, host };
}

/** @param {string} root @param {string} rel */
function safeResolve(root, rel) {
  const r = path.resolve(root, rel);
  const relPath = path.relative(root, r);
  if (relPath.startsWith('..') || path.isAbsolute(relPath)) return null;
  return r;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const { careerOpsPath, port, host } = parseArgs();

async function readJsonBody(req) {
  const chunks = [];
  for await (const ch of req) {
    chunks.push(ch);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);

  try {
    if (url.pathname === '/api/pipeline' && req.method === 'GET') {
      const data = getPipelineData(careerOpsPath);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify({ careerOpsPath, ...data }));
      return;
    }

    /** Styled Markdown: market layer (import + score + analyze output) */
    if (url.pathname === '/market' && req.method === 'GET') {
      const rel = path.join('data', 'market', 'market-report.md');
      const full = safeResolve(careerOpsPath, rel);
      if (!full || !fs.existsSync(full)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Market report</title></head><body style="font-family:system-ui;padding:2rem;background:#0f1419;color:#e6edf3"><p>No <code>data/market/market-report.md</code> yet. Run <code>npm run market:refresh</code> from the career-ops root.</p><p><a href="/" style="color:#6eb5ff">← Pipeline</a></p></body></html>`
        );
        return;
      }
      const raw = url.searchParams.get('raw') === '1';
      const md = fs.readFileSync(full, 'utf8');
      if (raw) {
        res.writeHead(200, {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(md);
        return;
      }
      const rawUrl = '/market?raw=1';
      const html = markdownToReportHtml(md, {
        title: 'Market report',
        rawUrl,
      });
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(html);
      return;
    }

    if (url.pathname === '/api/report' && req.method === 'GET') {
      const rel = url.searchParams.get('path');
      if (!rel || rel.includes('..')) {
        res.writeHead(400);
        res.end('bad request');
        return;
      }
      const full = safeResolve(careerOpsPath, rel);
      if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const md = fs.readFileSync(full, 'utf8');
      const raw = url.searchParams.get('raw') === '1';

      if (raw) {
        res.writeHead(200, {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(md);
        return;
      }

      const titleMatch = md.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : path.basename(rel, '.md');
      const rawUrl = `/api/report?path=${encodeURIComponent(rel)}&raw=1`;
      const html = markdownToReportHtml(md, { title, rawUrl });

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(html);
      return;
    }

    if (url.pathname === '/api/config' && req.method === 'GET') {
      try {
        const config = loadMarketConfig(careerOpsPath);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify({ careerOpsPath, config }));
      } catch (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json; charset=utf-8',
        });
        res.end(JSON.stringify({ error: String(err?.message || err) }));
      }
      return;
    }

    if (url.pathname === '/api/config' && req.method === 'PUT') {
      try {
        const body = await readJsonBody(req);
        const config = saveMarketConfig(careerOpsPath, body);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify({ ok: true, config }));
      } catch (err) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
        });
        res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
      }
      return;
    }

    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    if (filePath === '/settings') {
      filePath = '/settings.html';
    }
    const resolved = path.join(PUBLIC, path.normalize(filePath));
    if (!resolved.startsWith(PUBLIC)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const ext = path.extname(resolved);
    const buf = fs.readFileSync(resolved);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(e?.message || e));
  }
});

server.listen(port, host, () => {
  console.error(
    `career-ops web: http://${host}:${port}/  (data: ${careerOpsPath})`
  );
});
