import { unique } from "../market-lib.mjs";
import { getMatches, collectBoundedTitleHits } from "./text.mjs";

/** Extra weight when title/body read like a hands-on Shopify/commerce web role. */
export function commerceRoleBoost(titleText, fullText) {
  const t = String(titleText ?? "").toLowerCase();
  const f = String(fullText ?? "").toLowerCase();
  const signals = [];
  let points = 0;

  const shopifyInTitle = /\bshopify\b/.test(t);
  const webDevTitle =
    shopifyInTitle && /\b(web\s+developer|developer|engineer)\b/.test(t);
  if (webDevTitle) {
    points += 12;
    signals.push("Shopify-forward title (web/dev/engineering)");
  } else if (shopifyInTitle && /\b(liquid|plus|headless|storefront)\b/.test(t)) {
    points += 10;
    signals.push("Shopify platform keywords in title");
  }

  if (points === 0 && /\bshopify\b/.test(f) && /\bliquid\b/.test(f)) {
    points += 8;
    signals.push("Shopify + Liquid in description");
  }
  if (points > 0 && /\b(dtc|direct.to.consumer|ecommerce|e-commerce)\b/.test(f)) {
    points += 4;
    signals.push("DTC/ecommerce context");
  }
  if (points > 0 && /\b(klaviyo|recharge|gorgias|yotpo|tapcart)\b/.test(f)) {
    points += 3;
    signals.push("commerce stack (apps/integrations)");
  }

  return { points: Math.min(22, points), signals };
}

/**
 * Title + keyword scoring for the commerce / Shopify track only.
 * Caller adds remote, stack, tracked, salary, date.
 */
export function scoreCommerceJob({
  job,
  titleLower,
  fullLower,
  targetRolesLower,
  positiveFilters,
  negativeFilters,
  seniorityBoostsLower,
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

  const seniorityBoostHits = getMatches(titleLower, seniorityBoostsLower);
  if (seniorityBoostHits.length > 0) {
    score += Math.min(12, seniorityBoostHits.length * 4);
    signals.push(`seniority markers: ${seniorityBoostHits.join(", ")}`);
  }

  if (/\bjunior\b|\bintern\b|\bentry level\b/.test(titleLower)) {
    score -= 25;
    signals.push("juniority penalty");
  }

  const commerceBoost = commerceRoleBoost(titleLower, fullLower);
  if (commerceBoost.points > 0) {
    score += commerceBoost.points;
    for (const line of commerceBoost.signals) {
      signals.push(line);
    }
  }

  return {
    partialScore: score,
    signals,
    target_role_hits: unique(targetRoleHits),
    positive_title_hits: unique(positiveTitleHits),
    positive_body_hits: unique(positiveBodyHits),
    negative_hits: unique(negativeHits),
    seniority_boost_hits: unique(seniorityBoostHits),
    seniority_penalty_hits: [],
  };
}
