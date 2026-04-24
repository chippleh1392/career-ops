import { escapeRegex } from "../market-lib.mjs";

export function getMatches(text, candidates) {
  const haystack = String(text ?? "").toLowerCase();
  return candidates.filter((candidate) =>
    haystack.includes(String(candidate).toLowerCase()),
  );
}

/** Negative / seniority-penalty style: word boundaries for tokens, substring for multi-word. */
export function collectBoundedTitleHits(titleText, needles) {
  const lower = String(titleText ?? "").toLowerCase();
  const hits = [];
  for (const needle of needles) {
    const raw = String(needle).trim();
    if (!raw) {
      continue;
    }
    const n = raw.toLowerCase();
    if (/\s/.test(n)) {
      if (lower.includes(n)) {
        hits.push(raw);
      }
      continue;
    }
    if (n === "java") {
      if (/\bjava\b/i.test(lower) && !/javascript/i.test(lower)) {
        hits.push(raw);
      }
      continue;
    }
    if (new RegExp(`\\b${escapeRegex(n)}\\b`, "i").test(lower)) {
      hits.push(raw);
    }
  }
  return hits;
}
