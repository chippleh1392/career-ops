#!/usr/bin/env node
/**
 * CLI for search-health analytics. Core logic: lib/search-health-analyze.mjs
 *
 * Usage:
 *   node analyze-search-health.mjs [--write] [--summary] [--as-of YYYY-MM-DD]
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { analyzeSearchHealth } from './lib/search-health-analyze.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'output', 'search-health.json');

const args = process.argv.slice(2);
const DO_WRITE = args.includes('--write');
const SUMMARY = args.includes('--summary');
const asOfIdx = args.indexOf('--as-of');
const AS_OF =
  asOfIdx !== -1 && args[asOfIdx + 1]
    ? String(args[asOfIdx + 1]).slice(0, 10)
    : undefined;

const data = analyzeSearchHealth(ROOT, AS_OF ? { asOf: AS_OF } : {});

if (data.ok === false) {
  console.error(JSON.stringify(data));
  process.exit(1);
}

const outJson = JSON.stringify(data, null, 2);

if (DO_WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, outJson, 'utf8');
}

if (SUMMARY) {
  const p = data;
  console.log(`Search health (as-of ${p.meta.asOf})\n`);
  console.log('Snapshot (status → count):');
  for (const [k, v] of Object.entries(p.snapshot).sort()) {
    console.log(`  ${k}: ${v}`);
  }
  console.log('\nTiming (days):');
  console.log(
    `  Median apply → first Gmail ack: ${p.timing.medianDaysApplyToFirstGmailAck ?? '—'} (n=${p.timing.nApplyToAckSamples})`,
  );
  console.log(
    `  Median apply → first rejection: ${p.timing.medianDaysApplyToFirstRejection ?? '—'} (n=${p.timing.nApplyToRejectSamples})`,
  );
  console.log('\n30d window:');
  console.log(
    `  status→Applied distinct #s / gmail_ack / gmail_rejection / status→Rejected: ${p.windows.d30.statusAppliedDistinctNums} / ${p.windows.d30.gmailAckEvents} / ${p.windows.d30.gmailRejectionEvents} / ${p.windows.d30.statusRejectedEvents}`,
  );
  console.log(`\nOpen Applied: ${p.openness.appliedOpenCount}`);
  const stale = p.openness.staleAppliedNoAck;
  console.log(
    `  Stale (no ack, ≥${p.openness.staleThresholdDays}d): ${stale.length}`,
  );
  if (stale.length) {
    for (const s of stale.slice(0, 8)) {
      console.log(
        `    #${s.num} ${s.company} — ${s.daysWaiting}d since ${s.appliedOrProxyAt}`,
      );
    }
    if (stale.length > 8) console.log(`    … +${stale.length - 8} more`);
  }
  if (p.signals.amber.length) {
    console.log('\nAmber signals:');
    for (const a of p.signals.amber) console.log(`  - ${a}`);
  }
  if (p.signals.red.length) {
    console.log('\nRed signals:');
    for (const r of p.signals.red) console.log(`  - ${r}`);
  }
  if (DO_WRITE) console.log(`\nWrote ${OUT}`);
  process.exit(0);
}

console.log(outJson);
