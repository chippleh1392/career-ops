/**
 * Read/write market-related slices of portals.yml + profile.yml for the web UI.
 * Full YAML round-trip may reorder keys; .bak files are written before saves.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse, stringify } from 'yaml';

const PORTALS = 'portals.yml';
const PROFILE = 'config/profile.yml';

const MAX_LINES = 250;
const MAX_LINE_LEN = 500;

function cleanLines(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .slice(0, MAX_LINES)
    .map((s) => (s.length > MAX_LINE_LEN ? s.slice(0, MAX_LINE_LEN) : s));
}

function backup(filePath) {
  if (!fs.existsSync(filePath)) return;
  const bak = `${filePath}.bak`;
  fs.copyFileSync(filePath, bak);
}

function readTitleFilterFromPortals(tf) {
  if (tf?.commerce && tf?.general) {
    return {
      commerce: {
        positive: cleanLines(tf.commerce.positive),
        negative: cleanLines(tf.commerce.negative),
        seniority_boost: cleanLines(tf.commerce.seniority_boost),
      },
      general: {
        positive: cleanLines(tf.general.positive),
        negative: cleanLines(tf.general.negative),
        seniority_penalty: cleanLines(
          tf.general.seniority_penalty ?? [
            'Senior',
            'Sr.',
            'Staff',
            'Lead',
            'Principal',
          ],
        ),
      },
    };
  }
  const legacy = tf ?? {};
  const sharedPos = cleanLines(legacy.positive);
  const sharedNeg = cleanLines(legacy.negative);
  const boost = cleanLines(legacy.seniority_boost);
  return {
    commerce: {
      positive: sharedPos,
      negative: sharedNeg,
      seniority_boost: boost,
    },
    general: {
      positive: sharedPos,
      negative: sharedNeg,
      seniority_penalty: ['Senior', 'Sr.', 'Staff', 'Lead', 'Principal'],
    },
  };
}

/**
 * @param {string} root career-ops root
 */
export function loadMarketConfig(root) {
  const portalsPath = path.join(root, PORTALS);
  const profilePath = path.join(root, PROFILE);

  if (!fs.existsSync(portalsPath)) {
    throw new Error(`Missing ${PORTALS}`);
  }
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Missing ${PROFILE}`);
  }

  const portals = parse(fs.readFileSync(portalsPath, 'utf8'));
  const profile = parse(fs.readFileSync(profilePath, 'utf8'));

  return {
    title_filter: readTitleFilterFromPortals(portals.title_filter),
    search_queries: (portals.search_queries ?? []).map((q) => ({
      name: String(q.name ?? ''),
      query: String(q.query ?? ''),
      enabled: q.enabled !== false,
    })),
    tracked_companies: (portals.tracked_companies ?? []).map((c) => ({
      name: String(c.name ?? ''),
      enabled: c.enabled !== false,
      notes: String(c.notes ?? ''),
    })),
    target_roles_primary: cleanLines(profile.target_roles?.primary),
  };
}

/**
 * @param {string} root
 * @param {object} body partial update
 */
export function saveMarketConfig(root, body) {
  const portalsPath = path.join(root, PORTALS);
  const profilePath = path.join(root, PROFILE);

  if (!body || typeof body !== 'object') {
    throw new Error('Invalid JSON body');
  }

  if (
    body.title_filter ||
    body.search_queries ||
    body.tracked_companies
  ) {
    backup(portalsPath);
    const portals = parse(fs.readFileSync(portalsPath, 'utf8'));

    if (body.title_filter) {
      const tf = body.title_filter;
      portals.title_filter = portals.title_filter ?? {};

      if (tf.commerce) {
        portals.title_filter.commerce = portals.title_filter.commerce ?? {};
        const c = tf.commerce;
        if (c.positive != null) {
          portals.title_filter.commerce.positive = cleanLines(c.positive);
        }
        if (c.negative != null) {
          portals.title_filter.commerce.negative = cleanLines(c.negative);
        }
        if (c.seniority_boost != null) {
          portals.title_filter.commerce.seniority_boost = cleanLines(
            c.seniority_boost,
          );
        }
      }

      if (tf.general) {
        portals.title_filter.general = portals.title_filter.general ?? {};
        const g = tf.general;
        if (g.positive != null) {
          portals.title_filter.general.positive = cleanLines(g.positive);
        }
        if (g.negative != null) {
          portals.title_filter.general.negative = cleanLines(g.negative);
        }
        if (g.seniority_penalty != null) {
          portals.title_filter.general.seniority_penalty = cleanLines(
            g.seniority_penalty,
          );
        }
      }
    }

    if (body.search_queries && Array.isArray(body.search_queries)) {
      const byName = new Map(
        body.search_queries.map((q) => [String(q.name), q.enabled === true]),
      );
      portals.search_queries = (portals.search_queries ?? []).map((q) => {
        if (!byName.has(String(q.name))) return q;
        return { ...q, enabled: byName.get(String(q.name)) };
      });
    }

    if (body.tracked_companies && Array.isArray(body.tracked_companies)) {
      const byName = new Map(
        body.tracked_companies.map((c) => [
          String(c.name),
          c.enabled === true,
        ]),
      );
      portals.tracked_companies = (portals.tracked_companies ?? []).map(
        (c) => {
          if (!byName.has(String(c.name))) return c;
          return { ...c, enabled: byName.get(String(c.name)) };
        },
      );
    }

    fs.writeFileSync(
      portalsPath,
      stringify(portals, {
        lineWidth: 120,
        defaultStringType: 'QUOTE_DOUBLE',
        defaultKeyType: 'PLAIN',
      }),
      'utf8',
    );
  }

  if (body.target_roles_primary != null) {
    backup(profilePath);
    const profile = parse(fs.readFileSync(profilePath, 'utf8'));
    profile.target_roles = profile.target_roles ?? {};
    profile.target_roles.primary = cleanLines(body.target_roles_primary);
    fs.writeFileSync(
      profilePath,
      stringify(profile, {
        lineWidth: 120,
        defaultStringType: 'QUOTE_DOUBLE',
        defaultKeyType: 'PLAIN',
      }),
      'utf8',
    );
  }

  return loadMarketConfig(root);
}
