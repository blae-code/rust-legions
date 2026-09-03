// ---------------------------------------------------------------------------
// Observation & intel fidelity.
//
// A player may inspect ANY counter, including hostile and neutral ones, on or
// off their turn — but what the file says depends on what their own units can
// actually see. Three fidelities:
//
//   confirmed — in contact, or under close observation: exact numbers
//   probable  — seen at range: bands, estimates, no internals
//   unknown   — beyond observation: a silhouette on the map and nothing else
//
// Distance is the driver; reconnaissance sharpens it, weather and works blunt
// it. This is the fog-of-war contract the tactical engine will later enforce
// server-side — the shapes here are deliberately the ones it will return.
// ---------------------------------------------------------------------------
import { UNIT_TYPES, CARRIES_FUEL, ARM_LABEL } from "./orbat";
import { ACTIVITIES } from "./activities";

const hexDist = (a, b) => {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
};

const MURK = ["fog", "snow", "storm"];
const LEVELS = ["unknown", "probable", "confirmed"];
const step = (level, by) => LEVELS[Math.max(0, Math.min(2, LEVELS.indexOf(level) + by))];

export const FIDELITY_LABEL = {
  confirmed: "Confirmed",
  probable: "Probable",
  unknown: "Unobserved",
};

/**
 * How well `stand` is observed by `viewers` (the inspecting player's own units).
 * Returns the fidelity, the range it was seen at, and why it landed there.
 */
export function assess(stand, viewers, weather = "clear") {
  const own = viewers.filter((v) => v.id !== stand.id);
  if (!own.length) return { level: "unknown", dist: null, reasons: ["No friendly units in the sector"] };

  const dist = Math.min(...own.map((v) => hexDist(v, stand)));
  const reasons = [];

  let level = "unknown";
  if (dist <= 1) {
    level = "confirmed";
    reasons.push("In contact — observed directly");
  } else if (dist <= 3) {
    level = "probable";
    reasons.push(`Observed at ${dist} hexes`);
  } else if (dist <= 6) {
    level = "probable";
    reasons.push(`Distant observation, ${dist} hexes`);
  } else {
    reasons.push(`Beyond observation, ${dist} hexes`);
  }

  // A recon element within four hexes reads a formation properly.
  const scout = own.some((v) => UNIT_TYPES[v.type].arm === "recon" && hexDist(v, stand) <= 4);
  if (scout && level !== "unknown") {
    level = step(level, 1);
    reasons.push("Reconnaissance element in range");
  }

  if (MURK.includes(weather) && dist > 1) {
    level = step(level, -1);
    reasons.push(`Sight degraded by ${weather}`);
  }

  if ((stand.entrench || 0) >= 2 && level === "confirmed" && dist > 1) {
    level = "probable";
    reasons.push("Target is dug in — strength concealed");
  }

  return { level, dist, reasons, scout };
}

// Display helpers ----------------------------------------------------------
const band = (n, spread = 0.25) => {
  const lo = Math.max(0, Math.floor((n * (1 - spread)) / 5) * 5);
  const hi = Math.ceil((n * (1 + spread)) / 5) * 5;
  return `${lo}–${hi}`;
};

const ammoWord = (n) => (n <= 2 ? "Critical" : n <= 5 ? "Low" : "Adequate");
const R = (k, v, fid) => ({ k, v, fid });

/**
 * Build one intel report for a stand at a given fidelity.
 * kind: "identity" | "strength" | "signals" | "ground"
 */
export function buildReport(kind, stand, obs, cover = 0) {
  const t = UNIT_TYPES[stand.type];
  const full = obs.level === "confirmed";
  const some = obs.level !== "unknown";
  const dark = R;

  if (kind === "identity") {
    return {
      title: "Identification",
      rows: [
        R("Designation", full ? stand.name : some ? "Unconfirmed" : "Unidentified", full ? "known" : some ? "est" : "dark"),
        R("Pattern", full ? t.label : some ? `${ARM_LABEL[t.arm]} formation` : "Unknown", full ? "known" : some ? "est" : "dark"),
        R("Arm", some ? ARM_LABEL[t.arm] : "Unknown", some ? "known" : "dark"),
        R("Veterancy", full ? ["Green", "Seasoned", "Veteran", "Elite"][stand.vet ?? 0] : "Unknown", full ? "known" : "dark"),
      ],
    };
  }

  if (kind === "strength") {
    return {
      title: "Strength Estimate",
      rows: [
        R("Effectives", full ? `${stand.str} of ${t.maxStr}` : some ? band(stand.str) : "Unknown", full ? "known" : some ? "est" : "dark"),
        R("Condition", full || some ? (stand.str / t.maxStr > 0.6 ? "Holding" : stand.str / t.maxStr > 0.3 ? "Worn" : "Broken") : "Unknown", full ? "known" : some ? "est" : "dark"),
        R("Attack value", full ? String(t.atk) : "Unknown", full ? "known" : "dark"),
        R("Defence value", full ? String(t.def) : some ? band(t.def, 0.3) : "Unknown", full ? "known" : some ? "est" : "dark"),
      ],
    };
  }

  if (kind === "signals") {
    const carries = CARRIES_FUEL.includes(t.arm);
    return {
      title: "Signals & Supply",
      rows: [
        R("Ammunition", full ? `${stand.ammo} lots` : some ? ammoWord(stand.ammo) : "Unknown", full ? "known" : some ? "est" : "dark"),
        R("Fuel", !carries ? "Not carried" : full ? `${stand.fuel}%` : "Unknown", full && carries ? "known" : carries ? "dark" : "est"),
        R(
          "Current order",
          stand.activity ? ACTIVITIES[stand.activity].label : some ? "Standing by" : "Unknown",
          stand.activity ? "known" : some ? "est" : "dark",
        ),
        dark("Movement", full ? (stand.moved ? "Expended" : "Available") : "Unknown", full ? "known" : "dark"),
      ],
    };
  }

  return {
    title: "Ground & Works",
    rows: [
      R("Position", `${stand.q}, ${stand.r}`, "known"),
      R("Cover", some ? `+${cover}` : "Unknown", some ? "known" : "dark"),
      R("Entrenchment", full ? `Level ${stand.entrench || 0}` : some ? ((stand.entrench || 0) > 0 ? "Works observed" : "None observed") : "Unknown", full ? "known" : some ? "est" : "dark"),
      R("Observed at", obs.dist == null ? "—" : `${obs.dist} hexes`, "known"),
    ],
  };
}