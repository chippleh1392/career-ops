#!/usr/bin/env node
/**
 * One-off: fetch LinkedIn job HTML and extract title + description + criteria.
 * Usage: node scripts/fetch-linkedin-jds.mjs <jobId> [<jobId> ...]
 */
import https from 'node:https';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'text/html' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetch(res.headers.location).then(resolve).catch(reject);
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      },
    ).on('error', reject);
  });
}

function stripTags(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ')
    .trim();
}

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error('Usage: node scripts/fetch-linkedin-jds.mjs <id> ...');
  process.exit(1);
}

for (const id of ids) {
  const url = `https://www.linkedin.com/jobs/view/${id}/`;
  const html = await fetch(url);
  const titleM = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleM ? titleM[1].replace(/\s*\|\s*LinkedIn\s*$/i, '') : '';
  let desc = '';
  const dm = html.match(
    /class="description__text description__text--rich"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
  );
  if (dm) desc = stripTags(dm[1]);
  const criteria = [...html.matchAll(/description__job-criteria-text[^>]*>([^<]+)</gi)].map(
    (m) => m[1].trim(),
  );
  const out = { id, url, title, criteria, description: desc };
  console.log(JSON.stringify(out));
}
