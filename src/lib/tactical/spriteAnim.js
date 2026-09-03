// ---------------------------------------------------------------------------
// Tactical sprite animation tables — the retro-wargame figure rig.
//
// A sprite is NOT a bitmap sheet here: it is a pose-per-frame rig, so one set
// of frame tables drives all twenty squad types and a type only supplies its
// KIT (silhouette, weapon length, headgear, palette). That keeps the whole
// roster to data instead of ~120 hand-drawn sheets, and it means a new squad
// type is a dozen numbers rather than an art commission.
//
// A pose is read by InfantryRig:
//   lean  torso rotation, degrees, + is forward (toward the enemy)
//   arm   weapon-arm rotation, degrees, - raises the muzzle
//   leg   stride separation in units
//   bob   vertical offset, - is up
//   flash 0|1 — draw the muzzle bloom this frame
//   rot   whole-figure rotation (falling)
//   fade  opacity multiplier
//   d     frame duration in ms
// ---------------------------------------------------------------------------

const F = (d, p = {}) => ({ lean: 0, arm: 0, leg: 2, bob: 0, flash: 0, rot: 0, fade: 1, d, ...p });

export const ANIM = {
  // Breathing at the ready. Deliberately slow and only two frames — a rank of
  // these must read as "waiting", not as "idling".
  idle: [F(680), F(680, { bob: -0.9, arm: -2 })],

  // Trudging under load, four-frame stride cycle.
  move: [
    F(150, { leg: 5, lean: 6, bob: -0.6 }),
    F(150, { leg: 2, lean: 5 }),
    F(150, { leg: 5, lean: 6, bob: -0.6, arm: 3 }),
    F(150, { leg: 2, lean: 5 }),
  ],

  // Shoulder, fire, ride the recoil, recover. The flash lives on ONE frame so
  // the report reads as a snap rather than a glow.
  fire: [
    F(120, { arm: -22, lean: 3 }),
    F(70, { arm: -24, lean: 2, flash: 1 }),
    F(90, { arm: -10, lean: -5, bob: -0.5 }),
    F(260, { arm: -18, lean: 2 }),
  ],

  // Wind up, thrust the bayonet home, hold, recover.
  melee: [
    F(130, { lean: -12, arm: 14, leg: 3 }),
    F(90, { lean: 22, arm: -6, leg: 7, bob: -1 }),
    F(110, { lean: 18, arm: -4, leg: 6 }),
    F(240, { lean: 4, arm: 6, leg: 3 }),
  ],

  // Struck and staggered — rocks back, wavers, steadies.
  hit: [
    F(90, { lean: -20, arm: 18, bob: -1.2 }),
    F(110, { lean: -12, arm: 10, leg: 4 }),
    F(300, { lean: -3, arm: 3 }),
  ],

  // Buckle, topple, prone, fade. Holds on the last frame — the stand is gone.
  death: [
    F(120, { lean: -14, arm: 22, bob: -1 }),
    F(140, { rot: 42, bob: 1.5, fade: 0.9 }),
    F(200, { rot: 76, bob: 4, fade: 0.7 }),
    F(600, { rot: 88, bob: 5.5, fade: 0 }),
  ],
};

export const ANIM_STATES = Object.keys(ANIM);

// Every state repeats except death, which holds its final frame.
export const HOLDS_LAST = ["death"];

// ---------------------------------------------------------------------------
// Per-type kit. `helm` and `weapon` pick a silhouette from the rig; `coat` and
// `trim` are the two-tone palette; `figures` is how many figures the stand
// shows on its hex (representative, never the true figure count).
// ---------------------------------------------------------------------------
export const SQUAD_KITS = {
  riflemen: { label: "Riflemen", helm: "helmet", weapon: "rifle", coat: "hsl(80 10% 30%)", trim: "hsl(40 18% 52%)", figures: 3 },
  stormtroops: { label: "Stormtroops", helm: "hood", weapon: "trench_gun", coat: "hsl(210 8% 24%)", trim: "hsl(4 60% 44%)", figures: 3 },
  marksmen: { label: "Marksmen", helm: "cap", weapon: "long_rifle", coat: "hsl(80 8% 34%)", trim: "hsl(40 22% 62%)", figures: 2 },
  sappers: { label: "Sappers", helm: "helmet", weapon: "spade", coat: "hsl(26 14% 28%)", trim: "hsl(40 20% 48%)", figures: 3 },
  flame_team: { label: "Flame Team", helm: "hood", weapon: "projector", coat: "hsl(20 16% 26%)", trim: "hsl(24 70% 48%)", figures: 2 },
  pilgrim_levy: { label: "Pilgrim Levy", helm: "cowl", weapon: "rifle", coat: "hsl(30 12% 32%)", trim: "hsl(45 40% 60%)", figures: 4 },
};

export const kitFor = (type) => SQUAD_KITS[type] || SQUAD_KITS.riflemen;