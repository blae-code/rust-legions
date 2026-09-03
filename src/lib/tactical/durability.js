// ---------------------------------------------------------------------------
// Layered durability — what a counter has to lose, in the order it loses it.
//
//   shield  → a gun shield, a storm hood: soft cover, first to go
//   armour  → plate. Stops shot outright until it is beaten in
//   hull    → the structure behind the plate. Vehicles only
//   health  → the men. THIS is the layer that kills a stand
//
// Depletion order is shield, armour, hull, health. Losing armour does NOT
// destroy a stand — it EXPOSES it: with no protection left, every further hit
// lands on health at the exposed multiplier.
//
// Two ways past intact armour:
//   pierce — a fraction of the shot passes through (AP shot, shaped charges)
//   bio    — gas and fume fillings ignore plate entirely and attack the crew,
//            though a sealed vehicle hull cuts most of it out
//
// Display/forecast model. Authoritative resolution stays server-side in
// base44/shared/tacticalEngine.ts, which mirrors these same layer names.
// ---------------------------------------------------------------------------
import { UNIT_TYPES } from "./orbat";

export const EXPOSED_MULT = 1.5;

// Per pattern, the protection it carries. Foot troops that carry nothing are
// health-only — which is exactly why they die fast in the open.
export const PROTECTION = {
  riflemen: {},
  pilgrim_levy: {},
  marksmen: {},
  flame_team: { shield: 2 },
  stormtroops: { armour: 4 },
  sappers: { shield: 3, armour: 2 },
  digger_corps: { shield: 4 },
  provost: { armour: 3 },
  artillery: { shield: 6 },
  siege_mortar: { shield: 4 },
  autocar_scouts: { armour: 5, hull: 6 },
  crawler: { armour: 12, hull: 10 },
  land_dreadnought: { armour: 24, hull: 18 },
};

export const LAYER_META = {
  shield: { label: "Shield", tone: "#8AB0C9" },
  armour: { label: "Armour", tone: "#A8B0B8" },
  hull: { label: "Hull", tone: "#C0A55E" },
};

export const LAYER_ORDER = ["shield", "armour", "hull"];

const healthTone = (f) => (f > 0.6 ? "#7E9B57" : f > 0.3 ? "#C9922F" : "#C0392B");

/**
 * The bars a counter should print: its protective layers in depletion order,
 * plus health. `stand.prot` holds current values; anything absent is full.
 */
export function layersOf(stand) {
  const type = UNIT_TYPES[stand.type];
  const max = PROTECTION[stand.type] || {};
  const protection = LAYER_ORDER.filter((k) => max[k] > 0).map((k) => ({
    key: k,
    label: LAYER_META[k].label,
    tone: LAYER_META[k].tone,
    cur: Math.max(0, stand.prot?.[k] ?? max[k]),
    max: max[k],
  }));
  const frac = Math.max(0, Math.min(1, stand.str / type.maxStr));
  return {
    protection,
    health: { key: "health", label: "Health", tone: healthTone(frac), cur: stand.str, max: type.maxStr, frac },
    exposed: protection.length > 0 && protection.every((l) => l.cur <= 0),
    unprotected: protection.length === 0,
  };
}

// What each firing activity does to protection. `pierce` is the share of the
// shot that reaches health through intact plate; `bio` attacks the crew directly.
export const WEAPON_TRAITS = {
  firing_light: { pierce: 0.1 },
  firing_sustained: { pierce: 0.15 },
  firing_light_gun: { pierce: 0.5 },
  firing_heavy_gun: { pierce: 0.7 },
  firing_siege: { pierce: 0.85 },
  firing_gas: { pierce: 0, bio: true },
  grenade: { pierce: 0.3 },
  flame: { pierce: 0.4, bio: true },
  melee: { pierce: 0.25 },
};

const SEALED_ARMS = ["armor", "recon"];

/**
 * Apply `damage` to a stand's layers.
 * Returns the health loss, the new layer values, and how the hit got through —
 * enough for both the forecast chips and a future engine round-trip.
 */
export function resolveDamage(stand, damage, traits = {}) {
  const { pierce = 0.15, bio = false } = traits;
  const { protection, exposed, unprotected } = layersOf(stand);
  const next = {};
  protection.forEach((l) => (next[l.key] = l.cur));

  // Biological and incendiary fillings go around plate at the crew. A sealed
  // vehicle hull keeps most of it out; open stands take it all.
  if (bio) {
    const sealed = SEALED_ARMS.includes(UNIT_TYPES[stand.type].arm);
    return {
      health: Math.max(1, Math.round(damage * (sealed ? 0.35 : 1))),
      layers: next,
      pierced: true,
      soaked: 0,
      exposed,
      bio: true,
      sealed,
    };
  }

  let health = 0;
  let remaining = damage;

  // The piercing share bypasses protection outright.
  if (pierce > 0 && protection.length) {
    const through = Math.round(damage * pierce);
    health += through;
    remaining -= through;
  }

  // The rest is eaten layer by layer, in order.
  let soaked = 0;
  for (const l of protection) {
    if (remaining <= 0) break;
    const eaten = Math.min(next[l.key], remaining);
    next[l.key] -= eaten;
    remaining -= eaten;
    soaked += eaten;
  }

  // Whatever is left reaches the men — harder if there was never any plate in
  // the way, or if it was already beaten in.
  if (remaining > 0) health += Math.round(remaining * (exposed || unprotected ? EXPOSED_MULT : 1));

  return {
    health: Math.max(0, Math.min(stand.str, Math.round(health))),
    layers: next,
    pierced: pierce > 0,
    soaked,
    exposed: protection.length > 0 && protection.every((k) => next[k.key] <= 0),
    bio: false,
  };
}