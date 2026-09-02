// Stellaris-style army design templates — slot catalog shared with the game engine.
//
// TWO LAYERS, ONE ROW. Every option carries the LEGACY macro modifiers the mass-
// battle resolver has always read (`skill`, `dmgOut`, `dmgIn`, `moraleIn`, `cost`)
// and — for every option added from Lane F onward — a `mods` object in the
// SquadType vocabulary, so a saved design compiles to a squad template plus kits
// rather than to a bag of multipliers the tactical layer cannot spend.
//
// THE TWO LAYERS MUST AGREE IN SIGN. `test/gear-points-audit.test.js` asserts it
// for every option that declares `mods`: a design that deals more macro damage may
// not hand the squad a worse gun. The rule is stated once, there, and applies to
// any option a later lane adds — it is not scoped to this lane's ten.
//
// The fourteen options below marked LEGACY predate that convention and carry no
// `mods`; translating them is a platform-handoff item, not a silent edit here —
// their keys are referenced by live saves and are frozen.

// The SquadType fields a design option may move. Same seven keys as Upgrade.mods
// in base44/shared/tactical.ts; the tactical layer knows how to spend these and
// nothing else.
export const SQUAD_MOD_KEYS = ["figures", "melee", "ranged", "range", "armor", "speed", "morale"];

export const DESIGN_SLOTS = {
  formation: {
    label: "Formation",
    options: {
      line: { label: "Line Formation", desc: "Balanced battle posture — no modifiers." },
      vanguard: { label: "Vanguard Assault", desc: "+20% damage dealt · +15% damage taken.", dmgOut: 1.2, dmgIn: 1.15 },
      skirmish: { label: "Skirmish Screen", desc: "−15% damage dealt · −15% damage taken.", dmgOut: 0.85, dmgIn: 0.85 },
      column: { label: "Deep Column", desc: "−5% damage dealt · −15% morale losses.", dmgOut: 0.95, moraleIn: 0.85 },
      dispersed: {
        label: "Dispersed Order",
        desc: "−15% damage dealt · −20% damage taken · +15% morale losses. Squad: +1 armor, −1 ranged, −1 morale, line of sight +1. No surcharge — the ground is the cost.",
        dmgOut: 0.85, dmgIn: 0.8, moraleIn: 1.15,
        mods: { armor: 1, ranged: -1, morale: -1 },
        effects: [{ scope: "macro", key: "losRange", value: 1 }],
      },
      echelon: {
        label: "Echelon Refused",
        desc: "+1 battle skill · −10% damage dealt · −10% damage taken. Squad: +1 armor, −1 melee, −1 speed. Costs 1 Manpower — a wing held back is a wing not firing.",
        skill: 1, dmgOut: 0.9, dmgIn: 0.9, cost: { manpower: 1 },
        mods: { armor: 1, melee: -1, speed: -1 },
      },
    },
  },
  weapon: {
    label: "Weapons",
    options: {
      rifles: { label: "Standard Rifles", desc: "Issue-pattern arms — no surcharge." },
      trench_guns: { label: "Trench Guns", desc: "+10% damage dealt.", dmgOut: 1.1, cost: { steel: 2 } },
      mortars: { label: "Field Mortars", desc: "+1 battle skill.", skill: 1, cost: { steel: 3 } },
      automatics: {
        label: "Automatic Rifles",
        desc: "+15% damage dealt. Squad: +2 ranged, −1 range. Costs 2 Steel and 1 Manpower — volume, and the two men who carry it.",
        dmgOut: 1.15, cost: { steel: 2, manpower: 1 },
        mods: { ranged: 2, range: -1 },
      },
      long_rifles: {
        label: "Long Rifles",
        desc: "+1 battle skill · −5% damage dealt. Squad: +2 range, −1 ranged. Costs 2 Steel — a man who is aiming is not firing.",
        skill: 1, dmgOut: 0.95, cost: { steel: 2 },
        mods: { range: 2, ranged: -1 },
      },
      shaped_charges: {
        label: "Shaped Charges",
        desc: "+10% damage dealt · +5% damage taken. Squad: +3 melee, −1 ranged, −1 armor. Costs 3 Steel and 1 Fuel — a laden man in a doorway.",
        dmgOut: 1.1, dmgIn: 1.05, cost: { steel: 3, fuel: 1 },
        mods: { melee: 3, ranged: -1, armor: -1 },
      },
    },
  },
  armor: {
    label: "Armor",
    options: {
      standard: { label: "Standard Kit", desc: "Regulation webbing — no surcharge." },
      plated: { label: "Plated Harness", desc: "−15% damage taken.", dmgIn: 0.85, cost: { steel: 3 } },
      scout: { label: "Scout Rig", desc: "+1 battle skill · +10% damage taken.", skill: 1, dmgIn: 1.1, cost: { fuel: 1 } },
      entrenching: {
        label: "Entrenching Issue",
        desc: "−15% damage taken · −5% damage dealt. Squad: +1 armor, −1 melee, −1 speed, dig rate +1. Costs 1 Steel and 1 Manpower — every man a spade, and every man carrying it.",
        dmgIn: 0.85, dmgOut: 0.95, cost: { steel: 1, manpower: 1 },
        mods: { armor: 1, melee: -1, speed: -1 },
        effects: [{ scope: "macro", key: "digSpeed", value: 1 }],
      },
      sealed_hoods: {
        label: "Sealed Hoods",
        desc: "−15% morale losses · −5% damage dealt. Squad: +1 morale, −1 ranged. Costs 2 Steel and 1 Fuel — men who can see through the fume they are standing in.",
        moraleIn: 0.85, dmgOut: 0.95, cost: { steel: 2, fuel: 1 },
        mods: { morale: 1, ranged: -1 },
      },
      light_order: {
        label: "Light Marching Order",
        desc: "+15% damage taken. Squad: +2 speed, −1 armor. No surcharge — the pack is left with the waggons, and so is everything in it.",
        dmgIn: 1.15,
        mods: { speed: 2, armor: -1 },
      },
      heavy_plate: {
        label: "Siege Harness",
        desc: "−25% damage taken. Squad: +3 armor, −2 speed. Costs 5 Steel — the heaviest kit the line regiments are issued, and it walks.",
        dmgIn: 0.75, cost: { steel: 5 },
        mods: { armor: 3, speed: -2 },
      },
    },
  },
  support: {
    label: "Support",
    options: {
      none: { label: "No Attachment", desc: "The army travels light — no surcharge." },
      medics: { label: "Field Hospital", desc: "−10% damage taken.", dmgIn: 0.9, cost: { manpower: 2 } },
      signals: { label: "Signals Corps", desc: "+1 battle skill.", skill: 1, cost: { fuel: 2 } },
      commissars: { label: "Commissariat", desc: "−20% morale losses.", moraleIn: 0.8, cost: { manpower: 2 } },
      chaplaincy: {
        label: "Chaplaincy Detachment",
        desc: "−15% morale losses. Squad: +1 morale. Costs 1 Manpower — cheaper than the Commissariat, and it holds a little higher.",
        moraleIn: 0.85, cost: { manpower: 1 },
        mods: { morale: 1 },
      },
      observers: {
        label: "Observation Section",
        desc: "+1 battle skill · +10% damage dealt · +5% damage taken. Squad: +1 ranged, −1 armor, line of sight +1. Costs 2 Fuel and 1 Manpower — glass forward, and nothing to hide behind.",
        skill: 1, dmgOut: 1.1, dmgIn: 1.05, cost: { fuel: 2, manpower: 1 },
        mods: { ranged: 1, armor: -1 },
        effects: [{ scope: "macro", key: "losRange", value: 1 }],
      },
    },
  },
};

export const SLOT_KEYS = ["formation", "weapon", "armor", "support"];

export const DEFAULT_DESIGN = { formation: "line", weapon: "rifles", armor: "standard", support: "none" };

export function compileDesign(rec = {}) {
  const out = { skill: 0, dmgOut: 1, dmgIn: 1, moraleIn: 1, cost: { manpower: 0, steel: 0, fuel: 0 }, mods: {}, effects: [] };
  for (const slot of SLOT_KEYS) {
    const opt = DESIGN_SLOTS[slot].options[rec[slot]] || {};
    out.skill += opt.skill || 0;
    out.dmgOut *= opt.dmgOut || 1;
    out.dmgIn *= opt.dmgIn || 1;
    out.moraleIn *= opt.moraleIn || 1;
    for (const k of ["manpower", "steel", "fuel"]) out.cost[k] += (opt.cost || {})[k] || 0;
    for (const k of SQUAD_MOD_KEYS) {
      const v = (opt.mods || {})[k] || 0;
      if (v) out.mods[k] = (out.mods[k] || 0) + v;
    }
    for (const e of opt.effects || []) out.effects.push(e);
  }
  return out;
}
