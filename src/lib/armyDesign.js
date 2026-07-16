// Stellaris-style army design templates — slot catalog shared with the game engine
export const DESIGN_SLOTS = {
  formation: {
    label: "Formation",
    options: {
      line: { label: "Line Formation", desc: "Balanced battle posture — no modifiers." },
      vanguard: { label: "Vanguard Assault", desc: "+20% damage dealt · +15% damage taken.", dmgOut: 1.2, dmgIn: 1.15 },
      skirmish: { label: "Skirmish Screen", desc: "−15% damage dealt · −15% damage taken.", dmgOut: 0.85, dmgIn: 0.85 },
      column: { label: "Deep Column", desc: "−5% damage dealt · −15% morale losses.", dmgOut: 0.95, moraleIn: 0.85 },
    },
  },
  weapon: {
    label: "Weapons",
    options: {
      rifles: { label: "Standard Rifles", desc: "Issue-pattern arms — no surcharge." },
      trench_guns: { label: "Trench Guns", desc: "+10% damage dealt.", dmgOut: 1.1, cost: { steel: 2 } },
      mortars: { label: "Field Mortars", desc: "+1 battle skill.", skill: 1, cost: { steel: 3 } },
    },
  },
  armor: {
    label: "Armor",
    options: {
      standard: { label: "Standard Kit", desc: "Regulation webbing — no surcharge." },
      plated: { label: "Plated Harness", desc: "−15% damage taken.", dmgIn: 0.85, cost: { steel: 3 } },
      scout: { label: "Scout Rig", desc: "+1 battle skill · +10% damage taken.", skill: 1, dmgIn: 1.1, cost: { fuel: 1 } },
    },
  },
  support: {
    label: "Support",
    options: {
      none: { label: "No Attachment", desc: "The army travels light — no surcharge." },
      medics: { label: "Field Hospital", desc: "−10% damage taken.", dmgIn: 0.9, cost: { manpower: 2 } },
      signals: { label: "Signals Corps", desc: "+1 battle skill.", skill: 1, cost: { fuel: 2 } },
      commissars: { label: "Commissariat", desc: "−20% morale losses.", moraleIn: 0.8, cost: { manpower: 2 } },
    },
  },
};

export const SLOT_KEYS = ["formation", "weapon", "armor", "support"];

export const DEFAULT_DESIGN = { formation: "line", weapon: "rifles", armor: "standard", support: "none" };

export function compileDesign(rec = {}) {
  const out = { skill: 0, dmgOut: 1, dmgIn: 1, moraleIn: 1, cost: { manpower: 0, steel: 0, fuel: 0 } };
  for (const slot of SLOT_KEYS) {
    const opt = DESIGN_SLOTS[slot].options[rec[slot]] || {};
    out.skill += opt.skill || 0;
    out.dmgOut *= opt.dmgOut || 1;
    out.dmgIn *= opt.dmgIn || 1;
    out.moraleIn *= opt.moraleIn || 1;
    for (const k of ["manpower", "steel", "fuel"]) out.cost[k] += (opt.cost || {})[k] || 0;
  }
  return out;
}