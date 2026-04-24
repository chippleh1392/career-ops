import path from "node:path";
import {
  MARKET_DIR,
  PORTALS_FILE,
  PROFILE_FILE,
  canonicalizeUrl,
  ensureDir,
  loadYaml,
  normalizeWhitespace,
  readJsonl,
  summarizeText,
  unique,
  writeJsonl,
  writeTsv,
} from "./market-lib.mjs";
import { isCommerceShopifyTrack } from "./market-scoring/detect-commerce-track.mjs";
import { resolveTitleFilterBlocks } from "./market-scoring/resolve-title-filters.mjs";
import { passesAttainableGeneralFilter } from "./market-scoring/attainable-general.mjs";
import { scoreCommerceJob } from "./market-scoring/score-commerce.mjs";
import { scoreGeneralJob } from "./market-scoring/score-general.mjs";

const INPUT_FILE = path.join(MARKET_DIR, "jobs.jsonl");
const OUTPUT_FILE = path.join(MARKET_DIR, "jobs-scored.jsonl");
const DEEP_EVAL_QUEUE_FILE = path.join(MARKET_DIR, "deep-eval-queue.tsv");
const DEEP_EVAL_QUEUE_COMMERCE_FILE = path.join(
  MARKET_DIR,
  "deep-eval-queue-commerce.tsv",
);
const DEEP_EVAL_QUEUE_GENERAL_FILE = path.join(
  MARKET_DIR,
  "deep-eval-queue-general.tsv",
);

/**
 * Min star rating for the general-queue (attainable FE). Commerce queue has no
 * floor so the best Shopify-track rows still appear even when absolute scores are low.
 */
const QUEUE_MIN_RATING_GENERAL = 1.85;

const STACK_TERMS = [
  "react",
  "typescript",
  "shopify",
  "liquid",
  "graphql",
  "accessibility",
  "performance",
  "design system",
  "frontend",
  "ecommerce",
  "commerce",
];

function getMatches(text, candidates) {
  const haystack = text.toLowerCase();
  return candidates.filter((candidate) =>
    haystack.includes(String(candidate).toLowerCase()),
  );
}

function detectLane(text) {
  const normalized = text.toLowerCase();
  if (/(shopify|commerce|ecommerce|merchant)/.test(normalized)) {
    return "commerce";
  }
  if (/(product engineer|product web|product frontend)/.test(normalized)) {
    return "product";
  }
  return "frontend";
}

function scoreRemoteFit(job) {
  const normalizedLocation = String(job.location ?? "").toLowerCase();
  switch (job.remote_mode) {
    case "remote":
      return { points: 15, reason: "remote-first" };
    case "hybrid":
      if (/(dallas|fort worth|dfw)/.test(normalizedLocation)) {
        return { points: 8, reason: "selective DFW hybrid fit" };
      }
      return { points: 1, reason: "hybrid but not local" };
    case "onsite":
      if (/(dallas|fort worth|dfw)/.test(normalizedLocation)) {
        return { points: 2, reason: "onsite but local" };
      }
      return { points: -10, reason: "onsite outside preferred geography" };
    default:
      return { points: 1, reason: "remote mode unclear" };
  }
}

function buildReason(signals) {
  return summarizeText(signals.slice(0, 6).join("; "), 220);
}

function toRating(score) {
  return Number((score / 20).toFixed(2));
}

function applyTrackPriorityCaps(job, score) {
  let capped = score;
  const track = job.scoring_track ?? "general";
  const generalPenaltyTier =
    track === "general" ? job.seniority_penalty_tier ?? "none" : "none";
  const hasCommerceSeniorityBoost =
    track === "commerce" && (job.seniority_boost_hits ?? []).length > 0;

  // User preference:
  // - non-commerce roles should rank highly only when they are attainable/non-senior
  // - commerce roles should rank highly only when they are senior
  if (generalPenaltyTier === "clear_senior") {
    capped = Math.min(capped, 58);
  }
  if (generalPenaltyTier === "ambiguous_experienced") {
    capped = Math.min(capped, 72);
  }
  if (track === "commerce" && !hasCommerceSeniorityBoost) {
    capped = Math.min(capped, 72);
  }

  return capped;
}

function pickTrackQueue(sortedJobs, track, { limit, minRating, attainableGeneral }) {
  const seen = new Set();
  const out = [];
  for (const job of sortedJobs) {
    if ((job.scoring_track ?? "general") !== track) {
      continue;
    }
    if (!job.url || (job.negative_hits ?? []).length > 0) {
      continue;
    }
    if (attainableGeneral && !passesAttainableGeneralFilter(job)) {
      continue;
    }
    if (
      minRating != null &&
      (job.quick_fit_rating ?? 0) < minRating
    ) {
      continue;
    }
    const key = canonicalizeUrl(job.url);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(job);
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

function toDeepEvalTsvRows(jobs) {
  return jobs.map((job, index) => ({
    id: String(index + 1),
    url: job.url,
    source: `market:${job.source_type}`,
    notes: `Score ${job.quick_fit_rating}/5 | ${job.company} | ${job.title} | ${job.quick_fit_reason}`,
  }));
}

async function main() {
  await ensureDir(MARKET_DIR);

  const [portals, profile, jobs] = await Promise.all([
    loadYaml(PORTALS_FILE),
    loadYaml(PROFILE_FILE),
    readJsonl(INPUT_FILE),
  ]);

  const blocks = resolveTitleFilterBlocks(portals);

  const trackedCompanies = new Set(
    (portals.tracked_companies ?? []).map((company) =>
      company.name.toLowerCase(),
    ),
  );
  const targetRoles = (profile.target_roles?.primary ?? []).map((role) =>
    role.toLowerCase(),
  );

  const commercePos = (blocks.commerce.positive ?? []).map((v) =>
    String(v).toLowerCase(),
  );
  const commerceNeg = (blocks.commerce.negative ?? []).map((v) =>
    String(v).toLowerCase(),
  );
  const commerceSenBoost = (blocks.commerce.seniority_boost ?? []).map((v) =>
    String(v).toLowerCase(),
  );

  const generalPos = (blocks.general.positive ?? []).map((v) =>
    String(v).toLowerCase(),
  );
  const generalNeg = (blocks.general.negative ?? []).map((v) =>
    String(v).toLowerCase(),
  );
  const generalSenPenalty = blocks.general.seniority_penalty ?? [];

  const scoredJobs = jobs.map((job) => {
    const fullText = normalizeWhitespace(
      [job.title, job.company, job.location, job.content_text].join(" "),
    ).toLowerCase();
    const titleText = String(job.title ?? "").toLowerCase();

    const useCommerce = isCommerceShopifyTrack(job, fullText);

    const core = useCommerce
      ? scoreCommerceJob({
          job,
          titleLower: titleText,
          fullLower: fullText,
          targetRolesLower: targetRoles,
          positiveFilters: commercePos,
          negativeFilters: commerceNeg,
          seniorityBoostsLower: commerceSenBoost,
        })
      : scoreGeneralJob({
          job,
          titleLower: titleText,
          fullLower: fullText,
          targetRolesLower: targetRoles,
          positiveFilters: generalPos,
          negativeFilters: generalNeg,
          seniorityPenaltyNeedles: generalSenPenalty,
        });

    let score = core.partialScore;
    const signals = [...core.signals];

    const remoteFit = scoreRemoteFit(job);
    score += remoteFit.points;
    signals.push(remoteFit.reason);

    if (trackedCompanies.has(String(job.company ?? "").toLowerCase())) {
      score += 8;
      signals.push("tracked company");
    }

    const stackHits = getMatches(fullText, STACK_TERMS);
    if (stackHits.length > 0) {
      score += Math.min(15, stackHits.length * 3);
      signals.push(`stack overlap: ${unique(stackHits).join(", ")}`);
    }

    if (job.salary_min || job.salary_max) {
      score += 5;
      signals.push("salary signal present");
    }

    if (job.first_published_at) {
      const publishedAt = new Date(job.first_published_at);
      if (!Number.isNaN(publishedAt.valueOf())) {
        const ageInDays = Math.floor(
          (Date.now() - publishedAt.valueOf()) / (1000 * 60 * 60 * 24),
        );
        if (ageInDays > 90) {
          score -= 2;
          signals.push("stale posting (>90d)");
        }
        if (ageInDays <= 21) {
          score += 4;
          signals.push("recent posting");
        }
      }
    }

    const priorityCappedScore = applyTrackPriorityCaps(
      {
        scoring_track: useCommerce ? "commerce" : "general",
        seniority_boost_hits: useCommerce ? core.seniority_boost_hits : [],
        seniority_penalty_hits: useCommerce ? [] : core.seniority_penalty_hits,
      },
      score,
    );
    const boundedScore = Math.max(0, Math.min(100, priorityCappedScore));
    const rating = toRating(boundedScore);
    const lane = detectLane(fullText);
    const recommended =
      boundedScore >= 65 && core.negative_hits.length === 0;

    const positiveHits = unique([
      ...core.positive_title_hits,
      ...core.positive_body_hits,
    ]);

    return {
      ...job,
      market_lane: lane,
      scoring_track: useCommerce ? "commerce" : "general",
      target_role_hits: core.target_role_hits,
      positive_hits: positiveHits,
      negative_hits: core.negative_hits,
      seniority_hits: useCommerce
        ? core.seniority_boost_hits
        : core.seniority_penalty_hits,
      seniority_boost_hits: core.seniority_boost_hits,
      seniority_penalty_hits: core.seniority_penalty_hits,
      seniority_penalty_tier: core.seniority_penalty_tier ?? "none",
      stack_hits: unique(stackHits),
      quick_fit_score: boundedScore,
      quick_fit_rating: rating,
      deep_eval_recommended: recommended,
      quick_fit_reason: buildReason(signals),
    };
  });

  const sortedJobs = scoredJobs.sort(
    (left, right) => right.quick_fit_score - left.quick_fit_score,
  );
  await writeJsonl(OUTPUT_FILE, sortedJobs);

  const queueJobs = [];
  const seenQueueUrls = new Set();
  for (const job of sortedJobs) {
    if (
      !job.url ||
      job.negative_hits.length > 0 ||
      (job.quick_fit_rating ?? 0) < 2.0
    ) {
      continue;
    }
    const queueKey = canonicalizeUrl(job.url);
    if (seenQueueUrls.has(queueKey)) {
      continue;
    }
    seenQueueUrls.add(queueKey);
    queueJobs.push({
      ...job,
      market_queue_candidate: true,
    });
    if (queueJobs.length >= 25) {
      break;
    }
  }

  const deepEvalRows = queueJobs.map((job, index) => ({
    id: String(index + 1),
    url: job.url,
    source: `market:${job.source_type}`,
    notes: `Score ${job.quick_fit_rating}/5 | ${job.company} | ${job.title} | ${job.quick_fit_reason}`,
  }));

  await writeTsv(
    DEEP_EVAL_QUEUE_FILE,
    ["id", "url", "source", "notes"],
    deepEvalRows,
  );

  const queueCommerce = pickTrackQueue(sortedJobs, "commerce", {
    limit: 25,
    minRating: null,
  });
  const queueGeneral = pickTrackQueue(sortedJobs, "general", {
    limit: 25,
    minRating: QUEUE_MIN_RATING_GENERAL,
    attainableGeneral: true,
  });

  await writeTsv(
    DEEP_EVAL_QUEUE_COMMERCE_FILE,
    ["id", "url", "source", "notes"],
    toDeepEvalTsvRows(queueCommerce),
  );
  await writeTsv(
    DEEP_EVAL_QUEUE_GENERAL_FILE,
    ["id", "url", "source", "notes"],
    toDeepEvalTsvRows(queueGeneral),
  );

  console.log(
    JSON.stringify(
      {
        total_jobs: sortedJobs.length,
        recommended_jobs: sortedJobs.filter((job) => job.deep_eval_recommended)
          .length,
        queued_jobs: queueJobs.length,
        top_score: sortedJobs[0]?.quick_fit_rating ?? null,
        deep_eval_queue: DEEP_EVAL_QUEUE_FILE,
        deep_eval_queue_commerce: DEEP_EVAL_QUEUE_COMMERCE_FILE,
        deep_eval_queue_general: DEEP_EVAL_QUEUE_GENERAL_FILE,
        queued_commerce: queueCommerce.length,
        queued_general: queueGeneral.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
