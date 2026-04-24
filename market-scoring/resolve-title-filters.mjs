/**
 * Normalize portals.title_filter into commerce + general blocks (legacy flat → split).
 */
export function resolveTitleFilterBlocks(portals) {
  const tf = portals.title_filter ?? {};
  if (tf.commerce && tf.general) {
    return {
      commerce: normalizeBlock(tf.commerce, { mode: "commerce" }),
      general: normalizeBlock(tf.general, { mode: "general" }),
    };
  }

  const legacy = {
    positive: tf.positive ?? [],
    negative: tf.negative ?? [],
    seniority_boost: tf.seniority_boost ?? [],
  };

  return {
    commerce: {
      positive: legacy.positive,
      negative: legacy.negative,
      seniority_boost: legacy.seniority_boost,
    },
    general: {
      positive: legacy.positive,
      negative: legacy.negative,
      seniority_penalty: ["Senior", "Sr.", "Staff", "Lead", "Principal"],
    },
  };
}

function normalizeBlock(block, { mode }) {
  const b = block ?? {};
  if (mode === "commerce") {
    return {
      positive: b.positive ?? [],
      negative: b.negative ?? [],
      seniority_boost: b.seniority_boost ?? [],
    };
  }
  return {
    positive: b.positive ?? [],
    negative: b.negative ?? [],
    seniority_penalty: b.seniority_penalty ?? [
      "Senior",
      "Sr.",
      "Staff",
      "Lead",
      "Principal",
    ],
  };
}
