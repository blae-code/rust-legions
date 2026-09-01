import { CATEGORY_KEYS } from "@/components/patch/patchMeta";

const SEEN_KEY = "cq_patch_watch_seen";

// Which version the commander has already reviewed
export function lastReviewedVersion() {
  try { return localStorage.getItem(SEEN_KEY) || null; } catch { return null; }
}

export function markReviewed(version) {
  try { localStorage.setItem(SEEN_KEY, version); } catch { /* terminal denied storage */ }
}

// Ministry version arithmetic — "1.2.3" → comparable tuple
function parts(v) {
  return String(v || "0").split(".").map((n) => parseInt(n, 10) || 0);
}

export function compareVersions(a, b) {
  const pa = parts(a), pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

// Anything at or beyond 1.0 counts as an official advance past development
export function isPostRelease(version) {
  return compareVersions(version, "1.0") >= 0;
}

// Quantitative breakdown of a patch's amendments by category
export function tallyChanges(changes = []) {
  const counts = {};
  CATEGORY_KEYS.forEach((k) => { counts[k] = 0; });
  changes.forEach((c) => {
    if (counts[c.category] !== undefined) counts[c.category] += 1;
  });
  return { counts, total: changes.length };
}

// Aggregate tally across every published post-1.0 patch
export function serviceTotals(patches = []) {
  const all = patches.flatMap((p) => p.changes || []);
  return { ...tallyChanges(all), releases: patches.length };
}