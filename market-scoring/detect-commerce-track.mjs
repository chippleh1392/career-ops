/**
 * Commerce / Shopify track — use senior-friendly scoring rules.
 * Everything else uses the general track (down-rank senior titles).
 */

/** Employer is Shopify but posting is PM/sales/etc. → use general track. */
function isShopifyEmployerTechnicalRole(titleLower, fullLower) {
  if (
    /\b(developer|engineer|engineering|frontend|back[- ]end|full[- ]?stack|web\s+developer|web\s+engineer|liquid|devops|sre|security\s+engineer|data\s+engineer)\b/.test(
      titleLower,
    )
  ) {
    return true;
  }
  if (
    /\b(liquid|storefront\s+api|hydrogen|oxygen|shopify\s+plus|graphql|theme\s+developer|checkout\s+extensibility)\b/.test(
      fullLower,
    )
  ) {
    return true;
  }
  return false;
}

export function isCommerceShopifyTrack(job, fullTextLower) {
  const t = String(job.title ?? "").toLowerCase();
  const c = String(job.company ?? "").toLowerCase();
  const f = String(fullTextLower ?? "");

  if (/\bshopify\b/.test(t)) {
    return true;
  }
  if (/\bshopify\b/.test(c)) {
    return isShopifyEmployerTechnicalRole(t, f);
  }
  if (/\b(shopify|commerce)\s+(engineer|developer|web)\b/.test(t)) {
    return true;
  }
  if (/\b(ecommerce|e-commerce)\s+(engineer|developer)\b/.test(t)) {
    return true;
  }
  if (/\bmerchant\s+platform\b/.test(t)) {
    return true;
  }
  if (/\bshopify\s+plus\b/.test(t) || /\bshopify\s+plus\b/.test(f)) {
    return true;
  }
  if (/\bliquid\b/.test(f) && /\b(shopify|storefront|hydrogen|oxygen)\b/.test(f)) {
    return true;
  }
  if (/\b(headless\s+)?commerce\b/.test(t) && /\b(developer|engineer|web)\b/.test(t)) {
    return true;
  }
  if (/\b(hydrogen|storefront\s+api|checkout\s+extensibility)\b/.test(f) && /\bshopify\b/.test(f)) {
    return true;
  }
  return false;
}
