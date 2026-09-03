// ---------------------------------------------------------------------------
// Skirmish force building.
//
// A one-off battle is bought, not inherited: the commander spends a points
// allowance on stands from the roster. These costs price a SINGLE battle and
// have nothing to say about the campaign economy.
// ---------------------------------------------------------------------------

import { UNIT_TYPES } from "@/lib/tactical/orbat";

export const COST = {
  riflemen: 90,
  pilgrim_levy: 70,
  digger_corps: 85,
  provost: 100,
  sappers: 115,
  marksmen: 120,
  stormtroops: 150,
  flame_team: 140,
  autocar_scouts: 110,
  artillery: 190,
  siege_mortar: 230,
  crawler: 240,
  land_dreadnought: 420,
};

export const ROSTER_ORDER = Object.keys(COST);

// Stores a bought stand takes the field with.
const START = { ammo: 8, fuelled: 45 };

// House numbering, issued in order so a bought force reads as a real ORBAT.
const ORDINALS = ["1st", "2nd", "3rd", "9th", "12th", "25th", "41st", "76th", "88th", "97th", "141st", "203rd"];

let uid = 0;
export const newUid = () => `f${++uid}`;

export const costOf = (items) => items.reduce((n, it) => n + (COST[it.type] || 0), 0);

/** Turn bought items into board stands — named, stored, awaiting deployment. */
export function toStands(items, side) {
  return items.map((it, i) => {
    const type = UNIT_TYPES[it.type];
    const motor = type.arm === "armor" || type.arm === "recon";
    return {
      id: `${side === "attacker" ? "a" : "d"}${i + 1}`,
      side,
      type: it.type,
      name: `${ORDINALS[i % ORDINALS.length]} ${type.label}`,
      str: type.maxStr,
      ammo: START.ammo,
      fuel: motor ? START.fuelled : null,
      entrench: 0,
      vet: it.vet || 0,
      moved: false,
    };
  });
}

// What a machine commander buys, by doctrine: walked in order and repeated
// until the allowance can no longer afford anything on its list.
const DOCTRINE_BUY = {
  aggressive: ["stormtroops", "crawler", "flame_team", "riflemen", "autocar_scouts"],
  defensive: ["riflemen", "provost", "artillery", "marksmen", "digger_corps"],
  economic: ["pilgrim_levy", "riflemen", "sappers", "artillery", "marksmen"],
};

/** Spend an allowance for the machine opponent. Deterministic: same points, same force. */
export function buildAiForce(points, doctrine = "aggressive") {
  const list = DOCTRINE_BUY[doctrine] || DOCTRINE_BUY.aggressive;
  const out = [];
  let left = points;
  let i = 0;
  while (out.length < 14 && i < 200) {
    if (list.every((t) => COST[t] > left)) break;
    const type = list[i % list.length];
    if (COST[type] <= left) {
      out.push({ key: newUid(), type });
      left -= COST[type];
    }
    i++;
  }
  return out;
}

// A saved Army Designer sheet is a DOCTRINE KIT rather than a roster: it says
// how this commander fights, so we open the shop with a force already in it.
const BY_WEAPON = {
  rifles: ["riflemen", "riflemen", "marksmen"],
  trench_guns: ["stormtroops", "flame_team", "riflemen"],
  mortars: ["siege_mortar", "artillery", "riflemen"],
};
const BY_SUPPORT = {
  medics: ["pilgrim_levy"],
  signals: ["autocar_scouts"],
  commissars: ["provost"],
};
const BY_ARMOR = { plated: ["crawler"], scout: ["autocar_scouts"] };

/** Seed a force from a saved design, clipped to the allowance. */
export function seedFromDesign(design, points) {
  const wish = [
    ...(BY_WEAPON[design.weapon] || BY_WEAPON.rifles),
    ...(BY_ARMOR[design.armor] || []),
    ...(BY_SUPPORT[design.support] || []),
  ];
  const out = [];
  let left = points;
  for (const type of wish) {
    if (COST[type] > left) continue;
    out.push({ key: newUid(), type });
    left -= COST[type];
  }
  return out;
}