/**
 * “Attainable” general-track FE — excludes senior tokens and obvious exec/leadership titles.
 * Used for shortlists and deep-eval-queue-general.tsv (not global scoring).
 */
export function passesAttainableGeneralFilter(job) {
  if ((job.scoring_track ?? "general") !== "general") {
    return false;
  }
  if ((job.seniority_penalty_hits ?? []).length > 0) {
    return false;
  }
  const title = String(job.title ?? "");
  if (
    /\b(vice president|v\.p\.|chief |head of|\bdirector\b|distinguished)\b/i.test(
      title,
    )
  ) {
    return false;
  }
  return true;
}
