#!/usr/bin/env node
/**
 * gmail.mjs — Gmail API (OAuth + search) using private/client_secret*.json
 *
 * Google "Desktop" / installed OAuth clients still use a loopback redirect
 * (e.g. http://localhost) — the browser returns to your machine; that URI is
 * embedded in the downloaded JSON, not a hosted callback you register separately.
 *
 *   node gmail.mjs auth
 *   node gmail.mjs auth --url-only
 *   node gmail.mjs auth --code=PASTED_URL_OR_CODE
 *   node gmail.mjs search [query]
 *
 * Env: GMAIL_CLIENT_SECRET_JSON | GMAIL_OAUTH_REDIRECT | GMAIL_TOKEN_JSON
 */

import { createServer } from 'http';
import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function findClientSecretPath() {
  if (process.env.GMAIL_CLIENT_SECRET_JSON) {
    const p = process.env.GMAIL_CLIENT_SECRET_JSON;
    if (!existsSync(p)) throw new Error(`GMAIL_CLIENT_SECRET_JSON not found: ${p}`);
    return p;
  }
  const privateDir = join(projectRoot, 'private');
  if (!existsSync(privateDir)) {
    throw new Error('Missing private/ directory (expected OAuth client JSON there).');
  }
  const files = readdirSync(privateDir).filter(
    (f) => f.startsWith('client_secret') && f.endsWith('.json')
  );
  if (files.length === 0) {
    throw new Error('No private/client_secret*.json — add your Google OAuth client JSON.');
  }
  return join(privateDir, files[0]);
}

function gmailTokenPath() {
  return process.env.GMAIL_TOKEN_JSON || join(projectRoot, 'private', 'gmail-token.json');
}

function loadCredentials() {
  const path = findClientSecretPath();
  const raw = readFileSync(path, 'utf8');
  const json = JSON.parse(raw);
  const block = json.installed || json.web;
  if (!block) {
    throw new Error('OAuth JSON must have "installed" or "web" credentials.');
  }
  return {
    client_id: block.client_id,
    client_secret: block.client_secret,
    redirect_uris: block.redirect_uris || [],
  };
}

function resolveRedirectUri() {
  if (process.env.GMAIL_OAUTH_REDIRECT) return process.env.GMAIL_OAUTH_REDIRECT;
  const creds = loadCredentials();
  const uri = creds.redirect_uris && creds.redirect_uris[0];
  if (!uri) {
    throw new Error(
      'OAuth JSON has no redirect_uris — re-download the Desktop client secret from Google Cloud.'
    );
  }
  return uri;
}

function buildOAuth2Client(redirectUri) {
  const { client_id, client_secret } = loadCredentials();
  return new google.auth.OAuth2(client_id, client_secret, redirectUri);
}

function extractCode(pasted) {
  const s = pasted.trim();
  const fromQuery = s.match(/[?&#]code=([^&]+)/);
  if (fromQuery) return decodeURIComponent(fromQuery[1]);
  if (/^[A-Za-z0-9._\-]+$/.test(s) && s.length >= 40) return s.trim();
  throw new Error('Could not find authorization code.');
}

function promptLine(q) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const onSig = () => {
      rl.close();
      resolve('');
    };
    process.once('SIGINT', onSig);
    rl.question(q, (ans) => {
      process.removeListener('SIGINT', onSig);
      rl.close();
      resolve(ans);
    });
  });
}

function parseRedirectPort(redirectUri) {
  const u = new URL(redirectUri);
  return u.port !== '' ? Number(u.port) : u.protocol === 'https:' ? 443 : 80;
}

async function authorizeWithServer(oAuth2Client, redirectUri, authUrl) {
  const port = parseRedirectPort(redirectUri);

  let handled = false;
  return await new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      if (!req.url || req.method !== 'GET') {
        res.writeHead(404);
        res.end();
        return;
      }
      let reqUrl;
      try {
        reqUrl = new URL(req.url, `http://127.0.0.1:${port}`);
      } catch {
        res.writeHead(400);
        res.end();
        return;
      }
      const err = reqUrl.searchParams.get('error');
      if (err) {
        res.writeHead(400);
        res.end(`Authorization error: ${err}`);
        if (!handled) {
          handled = true;
          try {
            server.close(() => {});
          } catch {
            /**/
          }
          reject(new Error(`OAuth denied: ${err}`));
        }
        return;
      }

      const code = reqUrl.searchParams.get('code');
      if (!code) {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<p>Authorized — close this tab.</p>');

      if (handled) return;
      handled = true;
      try {
        server.close(() => {});
      } catch {
        /**/
      }

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        resolve(tokens);
      } catch (e) {
        reject(e);
      }
    });

    server.on('error', reject);

    server.listen(port, '127.0.0.1', () => {
      console.error(`Listening at http://127.0.0.1:${port} for OAuth…\n`);
      console.error('Open this URL:\n');
      console.log(authUrl);
    });
  });
}

async function authorizeWithPaste(oAuth2Client, authUrl) {
  console.error('Open this URL:\n');
  console.log(authUrl);
  const pasted = await promptLine(
    '\nPaste the redirected URL from the browser (or paste the raw code):\n'
  );
  if (!pasted.trim()) {
    throw new Error('Auth cancelled (empty paste or Ctrl+C).');
  }
  const code = extractCode(pasted);
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

function extractCodeArg(rest) {
  for (const a of rest) {
    if (a.startsWith('--code=')) return a.slice('--code='.length);
  }
  return null;
}

function cmdPrintAuthUrl() {
  const redirectUri = resolveRedirectUri();
  const oAuth2Client = buildOAuth2Client(redirectUri);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log(authUrl);
}

async function cmdAuthWithCode(rawCode) {
  const redirectUri = resolveRedirectUri();
  const oAuth2Client = buildOAuth2Client(redirectUri);

  const code = extractCode(rawCode);
  const { tokens } = await oAuth2Client.getToken(code);
  writeFileSync(gmailTokenPath(), JSON.stringify(tokens, null, 2), 'utf8');
  console.error(`Saved tokens to ${gmailTokenPath()}`);
}

async function cmdAuth() {
  const redirectUri = resolveRedirectUri();

  const oAuth2Client = buildOAuth2Client(redirectUri);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  /** @type {object} */
  let tokens;
  try {
    tokens = await authorizeWithServer(oAuth2Client, redirectUri, authUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`\nOAuth listener failed: ${msg}`);
    if (/EADDRINUSE/i.test(msg)) {
      console.error(
        'Often port 80 is already in use (Desktop OAuth uses http://localhost → port 80). Approve in browser, then copy the full http://localhost/... address from the URL bar (includes ?code=) and paste below — even if the page says it cannot connect.'
      );
    }
    console.error('Falling back to manual paste.');
    tokens = await authorizeWithPaste(oAuth2Client, authUrl);
  }

  writeFileSync(gmailTokenPath(), JSON.stringify(tokens, null, 2), 'utf8');
  console.error(`\nSaved tokens to ${gmailTokenPath()}`);
}

async function getAuthorizedClient() {
  const tp = gmailTokenPath();
  if (!existsSync(tp)) {
    throw new Error(`No token file. Run first: node gmail.mjs auth`);
  }
  const redirectUri = resolveRedirectUri();

  const oAuth2Client = buildOAuth2Client(redirectUri);
  oAuth2Client.setCredentials(JSON.parse(readFileSync(tp, 'utf8')));
  return oAuth2Client;
}

async function cmdSearch(argv) {
  const q =
    argv[0] || 'newer_than:30d category:primary';
  const max = Math.min(Number(process.env.GMAIL_MAX_RESULTS) || 10, 100);

  const auth = await getAuthorizedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: max,
  });

  const messages = res.data.messages || [];

  console.error(`Query: ${q}\n`);

  for (const m of messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: m.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    });
    const headers = full.data.payload?.headers || [];
    const get = (n) =>
      headers.find((h) => h.name?.toLowerCase() === n.toLowerCase())?.value || '';

    console.log(`${get('Subject')}`);
    console.log(`  From: ${get('From')}`);
    console.log(`  Date: ${get('Date')}`);
    console.log('');
  }

  console.error(`Returned ${messages.length} message(s).`);
}

function usage() {
  console.error(`Usage:
  node gmail.mjs auth [--url-only | --code=... ]
  node gmail.mjs search [gmail-search-query]

Examples:
  node gmail.mjs auth --url-only
  node gmail.mjs auth --code=PASTED_OR_URL_WITH_CODE
  node gmail.mjs search "newer_than:7d"
  node gmail.mjs search "from:careers"
`);
}

async function main() {
  const args = process.argv.slice(2);
  const sub = args[0];

  if (sub === 'auth') {
    const authRest = args.slice(1);
    if (authRest.includes('--url-only')) {
      cmdPrintAuthUrl();
      return;
    }
    const codeArg = extractCodeArg(authRest);
    if (codeArg !== null) {
      await cmdAuthWithCode(codeArg);
      return;
    }
    await cmdAuth();
    return;
  }
  if (sub === 'search') {
    await cmdSearch(args.slice(1));
    return;
  }
  usage();
  process.exit(sub ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
