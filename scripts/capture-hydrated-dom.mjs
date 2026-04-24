#!/usr/bin/env node
/**
 * Full post-hydration DOM via Playwright (Chromium).
 * Use for SPAs where View Source is only the shell; this waits for client render.
 *
 *   node scripts/capture-hydrated-dom.mjs https://www.activeandfit.com/
 *   node scripts/capture-hydrated-dom.mjs --ash-public   # all four program homes
 *
 * Writes HTML + a small .json summary next to it under interview-prep/snapshots/
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'interview-prep', 'snapshots');

const ASH_HOMES = [
  'https://www.activeandfit.com/',
  'https://www.activeandfitdirect.com/default.aspx',
  'https://www.activeandfitnow.com/',
  'https://www.silverandfit.com/',
];

function hostSlug(u) {
  return new URL(u).hostname.replace(/^www\./, '').replace(/\./g, '-');
}

async function analyzePage(page) {
  return page.evaluate(() => {
    const root =
      document.getElementById('root') ||
      document.getElementById('app-container') ||
      document.body;
    const all = document.body ? document.body.getElementsByTagName('*') : [];
    const classes = new Map();
    let mui = 0;
    let ember = 0;
    for (let i = 0; i < all.length; i++) {
      const c = all[i].getAttribute('class');
      if (!c) continue;
      if (c.includes('Mui')) mui++;
      for (const token of c.split(/\s+/)) {
        if (!token) continue;
        if (token.startsWith('Mui')) mui++;
        if (token.includes('ember')) ember++;
        const prefix = token.split(/[-_]/)[0] || token.slice(0, 12);
        classes.set(prefix, (classes.get(prefix) || 0) + 1);
      }
    }
    const topPrefixes = [...classes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([k, v]) => ({ prefix: k, count: v }));
    return {
      documentElementClass: document.documentElement.getAttribute('class'),
      bodyClass: document.body?.getAttribute('class'),
      mountIds: {
        root: !!document.getElementById('root'),
        appContainer: !!document.getElementById('app-container'),
        navContainer: !!document.getElementById('navContainer-content'),
      },
      elementCount: all.length,
      muiClassAttributeHits: mui,
      emberMentionsInClass: ember,
      topClassPrefixes: topPrefixes,
    };
  });
}

async function capture(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // SPAs: wait for either MUI in DOM or a generous cap
    try {
      await page.waitForSelector(
        '[class*="Mui"], [id="root"], [id="app-container"]',
        { timeout: 15_000 }
      );
    } catch {
      /* still snapshot */
    }
    await new Promise((r) => setTimeout(r, 2500));
    const summary = await analyzePage(page);
    const html = await page.content();
    return { html, summary };
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  let urls = [];
  if (args.includes('--ash-public')) {
    urls = ASH_HOMES;
  } else if (args[0] && !args[0].startsWith('-')) {
    urls = [args[0]];
  } else {
    console.error('Usage: node scripts/capture-hydrated-dom.mjs <url> | --ash-public');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const url of urls) {
    const slug = hostSlug(url);
    process.stderr.write(`Capturing: ${url}\n`);
    const { html, summary } = await capture(url);
    const base = `${stamp}-${slug}-hydrated`;
    const htmlPath = join(OUT_DIR, `${base}.html`);
    const jsonPath = join(OUT_DIR, `${base}.summary.json`);
    await writeFile(htmlPath, html, 'utf8');
    await writeFile(
      jsonPath,
      JSON.stringify(
        { url, captured: new Date().toISOString(), bytes: Buffer.byteLength(html, 'utf8'), ...summary },
        null,
        2
      ),
      'utf8'
    );
    results.push({ url, htmlPath, jsonPath, summary });
  }

  for (const r of results) {
    console.log(JSON.stringify({ url: r.url, ...r.summary, htmlPath: r.htmlPath, jsonPath: r.jsonPath }, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
