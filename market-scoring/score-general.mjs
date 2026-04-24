import { unique } from "../market-lib.mjs";
import { getMatches, collectBoundedTitleHits } from "./text.mjs";

function detectGeneralTrackSeniority({
  job,
  titleLower,
  fullLower,
  seniorityPenaltyNeedles,
}) {
  const clearSeniorHits = collectBoundedTitleHits(
    job.title ?? "",
    seniorityPenaltyNeedles,
  );
  if (clearSeniorHits.length > 0) {
    return {
      tier: "clear_senior",
      hits: unique(clearSeniorHits),
      penalty: Math.min(20, 8 + (clearSeniorHits.length - 1) * 6),
      signal: `general track: down-rank clear senior titles (${unique(clearSeniorHits).join(", ")})`,
    };
  }

  const ambiguousHits = [];
  if (/\bmid[-\s]?senior\b/.test(fullLower)) {
    ambiguousHits.push("mid-senior language");
  }
  if (
    /\b3\s*[-–]\s*6\+?\s*years\b|\b4\+\s+years\b|\b5\+\s+years\b|\b6\+\s+years\b/.test(
      fullLower,
    )
  ) {
    ambiguousHits.push("experienced years band");
  }

  let seniorScopeSignals = 0;
  if (/\btechnical leadership\b/.test(fullLower)) seniorScopeSignals += 1;
  if (/\bmentor(?:ing| others)?\b/.test(fullLower)) seniorScopeSignals += 1;
  if (/\barchitect(?:ure|ing)?\b/.test(fullLower)) seniorScopeSignals += 1;
  if (/\bhigh[-\s]autonomy\b|\bhigh[-\s]impact\b/.test(fullLower)) seniorScopeSignals += 1;
  if (/\bown(?:ing)?\s+(major|core|critical|meaningful)\b/.test(fullLower)) {
    seniorScopeSignals += 1;
  }

  if (seniorScopeSignals >= 2) {
    ambiguousHits.push("senior-style scope");
  }

  if (ambiguousHits.length > 0) {
    return {
      tier: "ambiguous_experienced",
      hits: unique(ambiguousHits),
      penalty: 8,
      signal: `general track: light discount for mid/mid-senior stretch (${unique(ambiguousHits).join(", ")})`,
    };
  }

  return {
    tier: "none",
    hits: [],
    penalty: 0,
    signal: "",
  };
}

/**
 * Title + keyword scoring for the general (non–Shopify-primary) track.
 * Penalizes senior title tokens so mid-level roles surface first.
 */
export function scoreGeneralJob({
  job,
  titleLower,
  fullLower,
  targetRolesLower,
  positiveFilters,
  negativeFilters,
  seniorityPenaltyNeedles,
}) {
  const signals = [];
  let score = 0;

  const targetRoleHits = getMatches(titleLower, targetRolesLower);
  if (targetRoleHits.length > 0) {
    score += Math.min(24, targetRoleHits.length * 12);
    signals.push(`title matches target roles: ${targetRoleHits.join(", ")}`);
  }

  const positiveTitleHits = getMatches(titleLower, positiveFilters);
  if (positiveTitleHits.length > 0) {
    score += Math.min(24, positiveTitleHits.length * 6);
    signals.push(`positive title hits: ${positiveTitleHits.join(", ")}`);
  }

  const positiveBodyHits = unique(
    getMatches(fullLower, positiveFilters).filter(
      (match) => !positiveTitleHits.includes(match),
    ),
  );
  if (positiveBodyHits.length > 0) {
    score += Math.min(10, positiveBodyHits.length * 2);
    signals.push(`supporting body hits: ${positiveBodyHits.join(", ")}`);
  }

  const negativeHits = collectBoundedTitleHits(job.title ?? "", negativeFilters);
  if (negativeHits.length > 0) {
    score -= 45 + (negativeHits.length - 1) * 8;
    signals.push(`negative filters: ${negativeHits.join(", ")}`);
  }

  const seniorityPenalty = detectGeneralTrackSeniority({
    job,
    titleLower,
    fullLower,
    seniorityPenaltyNeedles,
  });
  if (seniorityPenalty.penalty > 0) {
    score -= seniorityPenalty.penalty;
    signals.push(seniorityPenalty.signal);
  }

  if (/\bjunior\b|\bintern\b|\bentry level\b/.test(titleLower)) {
    score -= 25;
    signals.push("juniority penalty");
  }

  return {
    partialScore: score,
    signals,
    target_role_hits: unique(targetRoleHits),
    positive_title_hits: unique(positiveTitleHits),
    positive_body_hits: unique(positiveBodyHits),
    negative_hits: unique(negativeHits),
    seniority_boost_hits: [],
    seniority_penalty_hits: unique(seniorityPenalty.hits),
    seniority_penalty_tier: seniorityPenalty.tier,
  };
}
