// The Motor Pool — catalogue, mirror, coverage and pricing (Lane J).
//
// base44/shared/motorPool.ts is a Deno module that cannot be imported into
// Vitest, so every pure-data table is lifted out of it TEXTUALLY
// (extract-const.js) and deep-equalled against the importable mirror at
// src/lib/motorPool.js. There is no UI-only allowlist: label and blurb are
// canonical on both sides and the comparison is strict in both directions.
//
// Two files can hold identical tables while their LOGIC drifts, so this file
// also compares the exported identifier sets and the whole source body from
// the first export onward.
//
// It then asserts the catalogue itself — coverage, the tradeoff discipline,
// the terrain vocabulary, the Points Audit recomputed from the tables rather
// than trusted, the plate register, the Codex append and the GAME_RULES
// append — and, last, that no armour arithmetic exists anywhere in the lane.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import * as MIRROR from "@/lib/motorPool.js";
import {
  MANUFACTURERS, WEAPON_PATTERNS, ARMOUR_CLASSES, WEAPON_CLASSES, QUALITY_GRADES,
  HOUSE_KEYS, apValue, aaValue,
} from "@/lib/arms.js";
import { UNIT_TYPES } from "@/lib/units.js";
import { IMAGE_LIBRARY, IMAGE_CATEGORIES, HOUSE_STYLE } from "@/lib/imageLibrary.js";
import { PLATE_URLS } from "@/lib/imagePlates";
import { ENTRIES } from "@/lib/wiki/entries.js";

const CANON_SRC = readRepoFile("base44/shared/motorPool.ts");
const MIRROR_SRC = readRepoFile("src/lib/motorPool.js");
const DOC = readRepoFile("docs/MOTOR_POOL.md");
const CANON = (name) => extractConst(CANON_SRC, name);

// Every pure-data table the two files must agree on, in declaration order.
const TABLES = [
  "VEHICLE_CLASSES",
  "VEHICLE_SLOTS",
  "TERRAIN_KEYS",
  "TIER_RANK",
  "MOTOR_WORKS_KEYS",
  "SPEED_CURVE",
  "CHASSIS_PATTERNS",
  "POWERPLANTS",
  "ARMOUR_PACKAGES",
  "SUSPENSIONS",
  "MOUNTS",
  "CREW_EXPOSURE_MORALE",
  "VEHICLE_STAT_KEYS",
  "MECHANIZED_SPECIALS",
  "VEHICLE_QUIRK_CONDITIONS",
  "VEHICLE_MODS",
  "VEHICLE_QUIRKS",
  "MELEE_CURVE",
  "CREW_MORALE_CURVE",
  "MOTOR_MODEL",
  "ROLL_ODDS",
];

const {
  VEHICLE_CLASSES, VEHICLE_SLOTS, TERRAIN_KEYS, TIER_RANK, MOTOR_WORKS_KEYS,
  CHASSIS_PATTERNS, POWERPLANTS, ARMOUR_PACKAGES, SUSPENSIONS, MOUNTS,
  CREW_EXPOSURE_MORALE, VEHICLE_STAT_KEYS, MECHANIZED_SPECIALS,
  VEHICLE_QUIRK_CONDITIONS, VEHICLE_MODS, VEHICLE_QUIRKS, MOTOR_MODEL, ROLL_ODDS,
  SPEED_CURVE, speedFromPowerWeight,
} = MIRROR;

const CHASSIS_KEYS = Object.keys(CHASSIS_PATTERNS);
const ARMOUR_KEYS = Object.keys(ARMOUR_CLASSES);
const VEHICLE_CAPABLE = ["crawler_gun", "hmg", "flame", "mortar", "artillery", "aircraft_gun"];
const REGIMENT_KEYS = ["riflemen", "crawler", "artillery", "fighter", "gunboat"];
const words = (s) => s.trim().split(/\s+/).length;
const av = (k) => ARMOUR_CLASSES[k].armourValue;
const round4 = (n) => Math.round(n * 10000) / 10000;
// The heading suffix every content lane's draft rules section carries, and
// the Codex ids this lane ships — both derived, so neither can drift from the
// tables they are built out of.
// Spelled-out counts are used in the prose on purpose: they read better and
// they are just as checkable, because every test below BUILDS the expected
// phrase from the table rather than reading a digit out of the document.
const WORD = {
  3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine",
  10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen",
  16: "sixteen", 20: "twenty", 24: "twenty-four", 34: "thirty-four",
};
const PROPOSED = "[PROPOSED — awaiting platform wiring]";
const MOTOR_ENTRY_IDS = new Set([
  ...MOTOR_WORKS_KEYS.map((k) => `maker-${k.replace(/_/g, "-")}`),
  ...VEHICLE_CLASSES.map((c) => `vehicle-class-${c.replace(/_/g, "-")}`),
]);

// ---------------------------------------------------------------------------
// §1 THE MIRROR INVARIANT
// ---------------------------------------------------------------------------

describe("motorPool.ts and src/lib/motorPool.js are one catalogue", () => {
  for (const name of TABLES) {
    it(`${name} in motorPool.ts deep-equals the src/lib mirror`, () => {
      expect(CANON(name)).toEqual(MIRROR[name]);
    });
  }

  it("every export const data literal in motorPool.ts is covered by the mirror list", () => {
    // Keyed on "the declaration is a data literal", NOT on SCREAMING_CASE: an
    // `export const MotorIndex = {` matched neither side of the old pattern and
    // so was absent from both, and the gate passed over a table with no mirror
    // row. The precondition of a gate is part of the gate.
    const declared = [...CANON_SRC.matchAll(/^export const ([A-Za-z_$][\w$]*)\s*=\s*[[{]/gm)].map((m) => m[1]);
    expect(declared.sort()).toEqual([...TABLES].sort());
    // and the widened pattern is itself pinned: it must see a mixed-case name.
    expect([...("export const MotorIndex = {\n").matchAll(/^export const ([A-Za-z_$][\w$]*)\s*=\s*[[{]/gm)].map((m) => m[1]))
      .toEqual(["MotorIndex"]);
  });

  it("the two files export the same identifiers", () => {
    const names = (src) => [...src.matchAll(/^export const ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]).sort();
    expect(names(CANON_SRC)).toEqual(names(MIRROR_SRC));
    expect(names(MIRROR_SRC)).toEqual(Object.keys(MIRROR).sort());
  });

  it("the whole body from the first export onward is byte-identical", () => {
    // The tables deep-equal above; this is what catches a drift in a FUNCTION,
    // which no table comparison can see. Everything before the first export is
    // the header and the one import line, which differ on purpose.
    const body = (src) => {
      const at = src.indexOf("export const VEHICLE_CLASSES");
      expect(at, "the first export moved").toBeGreaterThan(-1);
      return src.slice(at);
    };
    expect(body(MIRROR_SRC)).toBe(body(CANON_SRC));
  });

  it("the mirror imports Lane I by the @/ alias and the canon by relative path", () => {
    expect(MIRROR_SRC).toContain("from '@/lib/arms.js'");
    expect(MIRROR_SRC).not.toContain("from '../");
    expect(CANON_SRC).toContain("from './arms.ts'");
  });
});

// ---------------------------------------------------------------------------
// §2 THE CATALOGUE
// ---------------------------------------------------------------------------

describe("the catalogue is complete", () => {
  it("chassis: at least 18 patterns and at least one per VehicleClass", () => {
    expect(CHASSIS_KEYS.length).toBeGreaterThanOrEqual(18);
    const QUOTA = {
      scout_crawler: 2, line_crawler: 3, heavy_crawler: 2, land_fort: 1, half_track: 2,
      armoured_car: 2, sp_gun: 2, tractor_gun: 1, gunboat: 2, fighter: 2, bomber: 1,
    };
    expect(Object.keys(QUOTA).sort()).toEqual([...VEHICLE_CLASSES].sort());
    for (const [cls, least] of Object.entries(QUOTA)) {
      const n = CHASSIS_KEYS.filter((k) => CHASSIS_PATTERNS[k].class === cls).length;
      expect(n, `${cls} has ${n} patterns, wanted at least ${least}`).toBeGreaterThanOrEqual(least);
    }
  });

  it("chassis: every pattern declares all four facings with valid ArmourClass keys", () => {
    for (const k of CHASSIS_KEYS) {
      const facings = CHASSIS_PATTERNS[k].hull.baseArmour;
      expect(Object.keys(facings).sort(), `${k} facings`).toEqual(["front", "rear", "side", "top"]);
      for (const [face, cls] of Object.entries(facings)) {
        expect(ARMOUR_KEYS, `${k}.${face} = ${cls}`).toContain(cls);
      }
    }
  });

  it("chassis: every hardpoint declares a non-empty allowed list of WeaponClass values", () => {
    for (const k of CHASSIS_KEYS) {
      const hull = CHASSIS_PATTERNS[k].hull;
      expect(hull.hardpoints.length, `${k} has no hardpoint`).toBeGreaterThanOrEqual(1);
      const seen = new Set();
      for (const hp of hull.hardpoints) {
        expect(typeof hp.key).toBe("string");
        expect(seen.has(hp.key), `${k} repeats hardpoint key ${hp.key}`).toBe(false);
        seen.add(hp.key);
        expect(hp.allowed.length, `${k}.${hp.key} allows nothing`).toBeGreaterThanOrEqual(1);
        for (const cls of hp.allowed) {
          expect(WEAPON_CLASSES, `${k}.${hp.key}: ${cls}`).toContain(cls);
          expect(VEHICLE_CAPABLE, `${k}.${hp.key}: ${cls} is not vehicle-capable`).toContain(cls);
        }
      }
    }
  });

  it("chassis: every hardpoint has at least one eligible WEAPON_PATTERNS entry at tierCap III", () => {
    for (const k of CHASSIS_KEYS) {
      for (const hp of CHASSIS_PATTERNS[k].hull.hardpoints) {
        const any = hp.allowed.some((cls) => Object.values(WEAPON_PATTERNS).some((p) => p.class === cls));
        expect(any, `${k}.${hp.key} can carry nothing in the register`).toBe(true);
      }
    }
  });

  it("chassis: every maker key exists in MANUFACTURERS, and tonnage, crew, tier, pts and slots are sane", () => {
    for (const k of CHASSIS_KEYS) {
      const c = CHASSIS_PATTERNS[k];
      expect(c.key, "key must match its own slot").toBe(k);
      expect(MANUFACTURERS[c.maker], `${k} maker ${c.maker}`).toBeDefined();
      expect(VEHICLE_CLASSES).toContain(c.class);
      expect(Object.keys(TIER_RANK)).toContain(c.tier);
      expect(c.hull.tonnage).toBeGreaterThan(0);
      expect(Number.isInteger(c.hull.crew) && c.hull.crew >= 1).toBe(true);
      expect(Number.isInteger(c.pts) && c.pts >= 1).toBe(true);
      for (const s of c.slots) expect(VEHICLE_SLOTS, `${k} slot ${s}`).toContain(s);
      expect(new Set(c.slots).size).toBe(c.slots.length);
      for (const q of c.quirks) expect(VEHICLE_QUIRKS[q], `${k} innate quirk ${q}`).toBeDefined();
      expect(words(c.blurb), `${k} blurb word count`).toBeGreaterThanOrEqual(15);
      expect(words(c.blurb), `${k} blurb word count`).toBeLessThanOrEqual(40);
      // maker-stem + pattern year + name, per §2's nomenclature
      expect(c.label, `${k} label`).toMatch(/^[A-Z][\w'-]* \d{3} /);
    }
  });

  it("the Hundredweight 141 Line Crawler reference is pinned", () => {
    const ref = CHASSIS_PATTERNS.hundredweight_141_line_crawler;
    expect(ref).toBeDefined();
    expect(ref.label).toBe("Hundredweight 141 Line Crawler");
    expect(ref.class).toBe("line_crawler");
    expect(ref.tier).toBe("I");
    expect(ref.pts).toBe(12);
  });

  it("powerplants: at least 8, each with a fuelClass in the regiment keys", () => {
    const keys = Object.keys(POWERPLANTS);
    expect(keys.length).toBeGreaterThanOrEqual(8);
    for (const k of keys) {
      const p = POWERPLANTS[k];
      expect(p.key).toBe(k);
      expect(p.hp).toBeGreaterThan(0);
      expect(p.weight).toBeGreaterThan(0);
      expect(p.reliability).toBeGreaterThanOrEqual(0);
      expect(p.reliability).toBeLessThanOrEqual(1);
      expect(REGIMENT_KEYS, `${k} fuelClass`).toContain(p.fuelClass);
      expect(p.heat).toBeGreaterThanOrEqual(0);
      expect(p.heat).toBeLessThanOrEqual(12);
      if (p.maker !== undefined) expect(MANUFACTURERS[p.maker], `${k} maker`).toBeDefined();
      expect(words(p.blurb)).toBeGreaterThanOrEqual(15);
      expect(words(p.blurb)).toBeLessThanOrEqual(40);
    }
    // at least one relic-material plant, gated to tier III and saying so
    const relic = keys.filter((k) => ROLL_ODDS.tierOf.plants[k] === "III");
    expect(relic.length).toBeGreaterThanOrEqual(1);
    expect(relic.some((k) => /relic|precursor|cell/i.test(POWERPLANTS[k].label + POWERPLANTS[k].blurb))).toBe(true);
  });

  it("armour packages: at least 10, and no package lowers a facing of any hull it is offered to", () => {
    const keys = Object.keys(ARMOUR_PACKAGES);
    expect(keys.length).toBeGreaterThanOrEqual(10);
    for (const k of keys) {
      const p = ARMOUR_PACKAGES[k];
      expect(p.key).toBe(k);
      expect(Object.keys(p.facings).length, `${k} substitutes nothing`).toBeGreaterThanOrEqual(1);
      for (const [face, cls] of Object.entries(p.facings)) {
        expect(["front", "side", "rear", "top"], `${k}.${face}`).toContain(face);
        expect(ARMOUR_KEYS, `${k}.${face} = ${cls}`).toContain(cls);
      }
      expect(p.weight).toBeGreaterThan(0);
      expect(p.cost).toBeGreaterThanOrEqual(1);
      expect(p.reliability).toBeLessThanOrEqual(0);
      expect(words(p.blurb)).toBeGreaterThanOrEqual(15);
      expect(words(p.blurb)).toBeLessThanOrEqual(40);
    }
    // The invariant, over the pools rollVehicle actually offers.
    for (const [chassisKey, pool] of Object.entries(ROLL_ODDS.packagePool)) {
      const base = CHASSIS_PATTERNS[chassisKey].hull.baseArmour;
      for (const pk of pool) {
        for (const [face, cls] of Object.entries(ARMOUR_PACKAGES[pk].facings)) {
          expect(av(cls), `${pk} lowers ${face} on ${chassisKey}`).toBeGreaterThanOrEqual(av(base[face]));
        }
      }
    }
    // and at least one package pushes a line_crawler front to heavy, at a cost
    const pushes = keys.filter((k) => ARMOUR_PACKAGES[k].facings.front === "heavy");
    expect(pushes.length).toBeGreaterThanOrEqual(1);
    const line = CHASSIS_KEYS.filter((k) => CHASSIS_PATTERNS[k].class === "line_crawler");
    const reachable = pushes.filter((k) => line.some((c) => (ROLL_ODDS.packagePool[c] || []).includes(k)));
    expect(reachable.length, "no heavy-front package is offered to any line crawler").toBeGreaterThanOrEqual(1);
    for (const k of reachable) {
      expect(ARMOUR_PACKAGES[k].weight, `${k} is free weight`).toBeGreaterThan(1);
      expect(ARMOUR_PACKAGES[k].reliability, `${k} is free reliability`).toBeLessThan(0);
    }
  });

  it("suspensions: at least 6, each declaring a modifier for all 16 terrain keys", () => {
    const keys = Object.keys(SUSPENSIONS);
    expect(keys.length).toBeGreaterThanOrEqual(6);
    expect(TERRAIN_KEYS.length).toBe(16);
    for (const k of keys) {
      const s = SUSPENSIONS[k];
      expect(s.key).toBe(k);
      expect(Object.keys(s.terrain).sort(), `${k} terrain keys`).toEqual([...TERRAIN_KEYS].sort());
      for (const t of TERRAIN_KEYS) {
        expect(s.terrain[t], `${k}.${t}`).toBeGreaterThanOrEqual(0);
        expect(s.terrain[t], `${k}.${t}`).toBeLessThanOrEqual(1.5);
      }
      expect(s.weight).toBeGreaterThan(0);
      expect(s.reliability).toBeGreaterThan(0);
      expect(s.reliability).toBeLessThanOrEqual(1);
      expect(words(s.blurb)).toBeGreaterThanOrEqual(15);
      expect(words(s.blurb)).toBeLessThanOrEqual(40);
    }
  });

  it("TERRAIN_KEYS deep-equals Lane B's merged TERRAIN vocabulary", () => {
    const TERRAIN = extractConst(readRepoFile("base44/shared/tacticalField.ts"), "TERRAIN");
    expect(TERRAIN_KEYS).toEqual(Object.keys(TERRAIN));
    // and the four Lane B marks impassable are impassable for every drive that
    // keeps contact with the ground.
    const impassable = Object.keys(TERRAIN).filter((t) => TERRAIN[t].moveCost === null);
    expect(impassable.sort()).toEqual(["fuel_tank", "precursor_wall", "wall", "water"]);
    for (const k of Object.keys(SUSPENSIONS)) {
      for (const t of impassable) {
        if (SUSPENSIONS[k].terrain[t] > 0) {
          expect(["sus_twin_screw", "sus_plenum_skirt", "sus_flight_gear"], `${k} crosses ${t}`).toContain(k);
        }
      }
    }
  });

  it("mounts: at least 8, each with a valid crewArmour and at least one hardpoint", () => {
    const keys = Object.keys(MOUNTS);
    expect(keys.length).toBeGreaterThanOrEqual(8);
    for (const k of keys) {
      const m = MOUNTS[k];
      expect(m.key).toBe(k);
      expect(Number.isInteger(m.hardpoints) && m.hardpoints >= 1).toBe(true);
      expect(m.arc).toBeGreaterThan(0);
      expect(m.arc).toBeLessThanOrEqual(360);
      expect(ARMOUR_KEYS, `${k} crewArmour`).toContain(m.crewArmour);
      expect(words(m.blurb)).toBeGreaterThanOrEqual(15);
      expect(words(m.blurb)).toBeLessThanOrEqual(40);
    }
    // CREW_EXPOSURE_MORALE covers every ArmourClass key and indexes a morale
    // figure, never an armour value.
    expect(Object.keys(CREW_EXPOSURE_MORALE).sort()).toEqual([...ARMOUR_KEYS].sort());
    for (const v of Object.values(CREW_EXPOSURE_MORALE)) expect(Number.isInteger(v)).toBe(true);
    // every chassis has at least one legal mount in its class pool
    for (const k of CHASSIS_KEYS) {
      const legal = (ROLL_ODDS.mountPool[CHASSIS_PATTERNS[k].class] || [])
        .filter((m) => MOUNTS[m].hardpoints <= CHASSIS_PATTERNS[k].hull.hardpoints.length);
      expect(legal.length, `${k} has no legal mount`).toBeGreaterThanOrEqual(1);
    }
    // §8's arc/protection claim, scoped to the SINGLE-GUN positions it is
    // about — the Wing Battery is narrower than either and protects nothing,
    // which is why the unscoped "monotone at both ends" reading was false.
    const singles = Object.values(MOUNTS).filter((m) => m.hardpoints === 1);
    expect(singles.length).toBeGreaterThanOrEqual(4);
    const byArc = [...singles].sort((a, b) => a.arc - b.arc);
    const rank = (k) => ARMOUR_KEYS.indexOf(k);
    const best = [...singles].sort((a, b) => rank(b.crewArmour) - rank(a.crewArmour));
    expect(new Set(byArc.slice(0, 2).map((m) => m.key)), "§8: the two narrowest single-gun mounts")
      .toEqual(new Set(best.slice(0, 2).map((m) => m.key)));
    const narrowest = Object.values(MOUNTS).sort((a, b) => a.arc - b.arc)[0];
    expect(narrowest.hardpoints, "§8 names the Wing Battery as the multi-gun exception")
      .toBeGreaterThan(1);
    // §8 also states that no shipped mount is fortified-crewed, which is why
    // that CREW_EXPOSURE_MORALE row reads as vocabulary and not as a live trade
    expect(Object.values(MOUNTS).map((m) => m.crewArmour)).not.toContain("fortified");
    expect(CREW_EXPOSURE_MORALE.fortified, "the row must still exist — the key sets are equal").toBeDefined();
  });

  it("Mount.hardpoints is read as fitting legality only, never as a gun cap", () => {
    // §8 used to say a mount "serves" a number of hardpoints, and §12's
    // declarative table did not list the field, so a reader was told it was
    // live. Nothing implements a serving limit: step 7 rolls one weapon per
    // HULL hardpoint and never consults the mount. Asserted in both
    // directions so the doc and the code cannot part company again.
    let overServed = 0;
    for (const k of CHASSIS_KEYS) {
      const hull = CHASSIS_PATTERNS[k].hull.hardpoints.length;
      for (const m of ROLL_ODDS.mountPool[CHASSIS_PATTERNS[k].class] || []) {
        if (MOUNTS[m].hardpoints > hull) continue;      // illegal, never rolled
        if (hull > MOUNTS[m].hardpoints) overServed += 1;
      }
    }
    expect(overServed, "no legal pairing carries more guns than its mount 'serves'")
      .toBeGreaterThan(0);
    // and the field is declared as such in §12
    expect(DOC, "§12 must list Mount.hardpoints among the declarative fields")
      .toContain("| `Mount.hardpoints` |");
  });

  it("vehicle mods: at least 25, at least 2 per slot, with non-empty disjoint mods/tradeoff from the stat vocabulary", () => {
    const keys = Object.keys(VEHICLE_MODS);
    expect(keys.length).toBeGreaterThanOrEqual(25);
    for (const slot of VEHICLE_SLOTS) {
      const n = keys.filter((k) => VEHICLE_MODS[k].slot === slot).length;
      expect(n, `slot ${slot} has ${n} kits`).toBeGreaterThanOrEqual(2);
    }
    for (const k of keys) {
      const m = VEHICLE_MODS[k];
      expect(m.key).toBe(k);
      expect(VEHICLE_SLOTS, `${k} slot`).toContain(m.slot);
      expect(m.appliesTo.length, `${k} applies to nothing`).toBeGreaterThanOrEqual(1);
      for (const c of m.appliesTo) expect(VEHICLE_CLASSES, `${k} appliesTo ${c}`).toContain(c);
      expect(Number.isInteger(m.pts) && m.pts >= 1).toBe(true);
      const mods = Object.keys(m.mods);
      const tradeoff = Object.keys(m.tradeoff);
      expect(mods.length, `${k} buys nothing`).toBeGreaterThanOrEqual(1);
      expect(tradeoff.length, `${k} has an empty tradeoff — a pure-upside kit is a lane failure`).toBeGreaterThanOrEqual(1);
      for (const key of [...mods, ...tradeoff]) expect(VEHICLE_STAT_KEYS, `${k}: ${key}`).toContain(key);
      for (const key of mods) expect(tradeoff, `${k} both improves and costs ${key}`).not.toContain(key);
      for (const v of [...Object.values(m.mods), ...Object.values(m.tradeoff)]) {
        expect(typeof v).toBe("number");
        expect(v, `${k} carries a zero delta`).not.toBe(0);
      }
      expect(words(m.blurb)).toBeGreaterThanOrEqual(15);
      expect(words(m.blurb)).toBeLessThanOrEqual(40);
    }
    // every kit is reachable: some chassis declares its slot and its class
    for (const k of keys) {
      const m = VEHICLE_MODS[k];
      const fits = CHASSIS_KEYS.some((c) => CHASSIS_PATTERNS[c].slots.includes(m.slot) && m.appliesTo.includes(CHASSIS_PATTERNS[c].class));
      expect(fits, `${k} fits no hull in the register`).toBe(true);
    }
  });

  it("vehicle quirks: at least 15, each with a condition key from the vocabulary", () => {
    const keys = Object.keys(VEHICLE_QUIRKS);
    expect(keys.length).toBeGreaterThanOrEqual(15);
    const used = new Set();
    for (const k of keys) {
      const q = VEHICLE_QUIRKS[k];
      expect(q.key).toBe(k);
      expect(q.condition, `${k} has no condition — a quirk whose effect exists only in prose is a lane failure`).toBeDefined();
      expect(VEHICLE_QUIRK_CONDITIONS, `${k} condition ${q.condition.key}`).toContain(q.condition.key);
      used.add(q.condition.key);
      const mods = Object.keys(q.mods);
      expect(mods.length, `${k} does nothing`).toBeGreaterThanOrEqual(1);
      for (const key of mods) expect(VEHICLE_STAT_KEYS, `${k}: ${key}`).toContain(key);
      for (const v of Object.values(q.mods)) expect(typeof v).toBe("number");
      // the cycle guard: quirk context is built from crew and tonnage, so no
      // quirk may change either without making the evaluation self-referential
      expect(mods, `${k} carries crew — that would make quirkContext circular`).not.toContain("crew");
      expect(mods, `${k} carries tonnage — that would make quirkContext circular`).not.toContain("tonnage");
      expect(words(q.blurb)).toBeGreaterThanOrEqual(15);
      expect(words(q.blurb)).toBeLessThanOrEqual(40);
    }
    // both directions: no condition key in the vocabulary goes uncarried
    expect([...used].sort()).toEqual([...VEHICLE_QUIRK_CONDITIONS].sort());
    // the brief's three worked examples exist and are numeric
    expect(VEHICLE_QUIRKS.vq_hand_fitted_gearbox.mods.reliability).toBe(0.1);
    expect(VEHICLE_QUIRKS.vq_hand_fitted_gearbox.condition.key).toBe("below_full_pace");
    expect(VEHICLE_QUIRKS.vq_prize_hull.mods.morale).toBe(1);
    expect(VEHICLE_QUIRKS.vq_boiler_shy.mods.reliability).toBe(-0.15);
    expect(VEHICLE_QUIRKS.vq_boiler_shy.condition).toEqual({ key: "weather", value: "rain" });
    // every innate quirk named by a chassis exists, and every rollable one too
    for (const k of ROLL_ODDS.rollableQuirks) expect(VEHICLE_QUIRKS[k], `rollable ${k}`).toBeDefined();
    const innate = new Set(CHASSIS_KEYS.flatMap((k) => CHASSIS_PATTERNS[k].quirks));
    for (const k of ROLL_ODDS.rollableQuirks) expect(innate.has(k), `${k} is both innate and rollable`).toBe(false);
    expect([...innate].length + ROLL_ODDS.rollableQuirks.length).toBe(keys.length);
  });

  it("motor works: at least 4 mw_* manufacturers conforming to the Manufacturer shape", () => {
    expect(MOTOR_WORKS_KEYS.length).toBeGreaterThanOrEqual(4);
    const houses = Object.keys(MANUFACTURERS.hundredweight_works.access);
    for (const k of MOTOR_WORKS_KEYS) {
      expect(k.startsWith("mw_"), `${k} is not mw_-prefixed`).toBe(true);
      const m = MANUFACTURERS[k];
      expect(m, `${k} is missing from MANUFACTURERS`).toBeDefined();
      expect(m.key).toBe(k);
      expect(Object.keys(m).sort()).toEqual(
        [k in MANUFACTURERS && m.houseKey !== undefined ? "houseKey" : "culture", "key", "label", "signature", "nameStems", "access", "lore"].sort(),
      );
      expect(m.houseKey !== undefined || m.culture !== undefined, `${k} is tied to no house or culture`).toBe(true);
      expect(Object.keys(m.signature).length, `${k} has no signature`).toBeGreaterThanOrEqual(1);
      expect(m.nameStems.length, `${k} name-stems`).toBeGreaterThanOrEqual(4);
      expect(Object.keys(m.access).sort(), `${k} access map`).toEqual([...houses].sort());
      for (const v of Object.values(m.access)) expect(["native", "licensed", "captured"]).toContain(v);
      expect(Object.values(m.access), `${k} is native nowhere`).toContain("native");
      expect(words(m.lore), `${k} lore word count`).toBeGreaterThanOrEqual(60);
      expect(words(m.lore), `${k} lore word count`).toBeLessThanOrEqual(100);
    }
  });

  it("the arms.ts MANUFACTURERS append adds only mw_* keys", () => {
    // Lane I's nine, written out. This lane's whole permitted change to that
    // table is APPENDING rows; the byte-level proof is the git diff in the
    // Definition of done, and this is the shape of it that a test can hold.
    const LANE_I = [
      "hundredweight_works", "reclamation_state_arsenal", "emberwright_foundries",
      "ferrymen_shrine_armoury", "salvage_court_prize_yard", "crossloom_pattern_house",
      "ascendancy_signal_works", "outrider_wheelwrights", "tarpool_burnworks",
    ];
    // Scoped in BOTH directions, and to this lane's own keys only. A whole-set
    // equality here would go red the day any later lane appends a manufacturer
    // row — the exact failure Lane I was barred from creating so that THIS
    // lane's append could land, and the courtesy runs both ways.
    //   (a) every Lane I row is still present and none of them is mw_-prefixed
    for (const k of LANE_I) {
      expect(MANUFACTURERS[k], `${k} was removed from MANUFACTURERS`).toBeDefined();
      expect(MANUFACTURERS[k].key, `${k} no longer keys itself`).toBe(k);
      expect(k.startsWith("mw_"), `${k} is a Lane I row and cannot be mw_-prefixed`).toBe(false);
    }
    //   (b) the mw_* namespace is exactly what this lane declares — no more,
    //       no fewer, so an appended row that skipped MOTOR_WORKS_KEYS is red
    expect(Object.keys(MANUFACTURERS).filter((k) => k.startsWith("mw_")).sort())
      .toEqual([...MOTOR_WORKS_KEYS].sort());
    // and the appended rows come last, in one block, so the diff is an append
    const src = readRepoFile("src/lib/arms.js");
    const first = Math.min(...MOTOR_WORKS_KEYS.map((k) => src.indexOf(`\n  ${k}: {`)));
    const lastLaneI = Math.max(...LANE_I.map((k) => src.indexOf(`\n  ${k}: {`)));
    expect(first, "an mw_* row was inserted above a Lane I row").toBeGreaterThan(lastLaneI);
    // never assert an exact manufacturer count, for the same reason.
    expect(Object.keys(MANUFACTURERS).length).toBeGreaterThanOrEqual(8);
  });

  it("every chassis, plant, package, drive, mount and kit is reachable through ROLL_ODDS", () => {
    for (const cls of VEHICLE_CLASSES) {
      for (const map of ["plantPool", "drivePool", "mountPool"]) {
        expect(ROLL_ODDS[map][cls], `${map} has no entry for ${cls}`).toBeDefined();
        expect(ROLL_ODDS[map][cls].length, `${map}.${cls} is empty`).toBeGreaterThanOrEqual(1);
      }
      expect(ROLL_ODDS.armourPackageChance[cls]).toBeGreaterThan(0);
      expect(ROLL_ODDS.armourPackageChance[cls]).toBeLessThanOrEqual(1);
      expect(ROLL_ODDS.plantTarget[cls]).toBeGreaterThan(0);
      expect(MOTOR_MODEL.gearAllowanceByClass[cls]).toBeGreaterThan(0);
    }
    const reach = (map, table) => new Set(Object.values(ROLL_ODDS[map]).flat().concat(Object.keys(table).filter(() => false)));
    for (const [map, table, label] of [["plantPool", POWERPLANTS, "powerplant"], ["drivePool", SUSPENSIONS, "suspension"], ["mountPool", MOUNTS, "mount"]]) {
      const used = reach(map, table);
      for (const k of used) expect(table[k], `${map} names ${k}, which is not in the table`).toBeDefined();
      for (const k of Object.keys(table)) expect(used.has(k), `${label} ${k} is offered to no class`).toBe(true);
    }
    const pooled = new Set(Object.values(ROLL_ODDS.packagePool).flat());
    for (const k of Object.keys(ARMOUR_PACKAGES)) expect(pooled.has(k), `package ${k} is offered to no hull`).toBe(true);
    expect(Object.keys(ROLL_ODDS.packagePool).sort()).toEqual([...CHASSIS_KEYS].sort());
    // tier gates point at rows that exist and tiers that exist
    for (const [kind, table] of [["plants", POWERPLANTS], ["packages", ARMOUR_PACKAGES], ["drives", SUSPENSIONS], ["mods", VEHICLE_MODS]]) {
      for (const [k, tier] of Object.entries(ROLL_ODDS.tierOf[kind])) {
        expect(table[k], `tierOf.${kind} gates ${k}, which is not in the table`).toBeDefined();
        expect(Object.keys(TIER_RANK), `tierOf.${kind}.${k}`).toContain(tier);
      }
    }
    // quality-keyed bands cover all five grades
    for (const band of ["modCount", "quirkCount", "luckSlope"]) {
      expect(Object.keys(ROLL_ODDS[band]).sort()).toEqual(Object.keys(QUALITY_GRADES).sort());
    }
  });

  it("ROLL_ODDS.packagePool is recomputed from the tables, not judged", () => {
    // The cache and its derivation, asserted equal. Both halves are needed:
    // raises-or-holds (armour values, which may only be read here) AND the
    // weight cap (which is what keeps a fortress course off an airframe).
    for (const chassisKey of CHASSIS_KEYS) {
      const c = CHASSIS_PATTERNS[chassisKey];
      const want = Object.keys(ARMOUR_PACKAGES).filter((pk) => {
        const p = ARMOUR_PACKAGES[pk];
        if (p.weight > c.hull.tonnage * MOTOR_MODEL.packageWeightCap) return false;
        return Object.entries(p.facings).every(([f, v]) => av(v) >= av(c.hull.baseArmour[f]));
      });
      expect(ROLL_ODDS.packagePool[chassisKey], `packagePool for ${chassisKey}`).toEqual(want);
      expect(want.length, `${chassisKey} can wear nothing`).toBeGreaterThanOrEqual(1);
    }
  });

  it("MOTOR_MODEL.specials names every token in the vocabulary and invents none", () => {
    const src = MOTOR_MODEL.specials;
    const emitted = new Set();
    const tables = { byClass: VEHICLE_CLASSES, byDrive: Object.keys(SUSPENSIONS), byMount: Object.keys(MOUNTS), byPackage: Object.keys(ARMOUR_PACKAGES), byQuirk: Object.keys(VEHICLE_QUIRKS), byMod: Object.keys(VEHICLE_MODS) };
    for (const [group, legalKeys] of Object.entries(tables)) {
      for (const [k, tokens] of Object.entries(src[group])) {
        expect(legalKeys, `specials.${group} names ${k}`).toContain(k);
        for (const t of tokens) {
          expect(MECHANIZED_SPECIALS, `specials.${group}.${k}: ${t}`).toContain(t);
          emitted.add(t);
        }
      }
    }
    expect([...emitted].sort(), "a specials token with no source is a promise").toEqual([...MECHANIZED_SPECIALS].sort());
    // every class emits something, so no stand comes back specials-less
    for (const cls of VEHICLE_CLASSES) expect((src.byClass[cls] || []).length).toBeGreaterThanOrEqual(1);
  });

  it("MOTOR_MODEL.speedClamp is the clamp speedFromPowerWeight actually applies", () => {
    const [lo, hi] = MOTOR_MODEL.speedClamp;
    // Probing the endpoints proves nothing about the CLAMP: SPEED_CURVE's own
    // speeds already span [1, 8], so both probes are answered by the curve
    // before the clamp is consulted, and a clamp widened to [1, 99] passes
    // them. Three assertions instead — the curve's endpoints ARE the clamp,
    // the function names the constant rather than two literals, and the
    // endpoints still return what the clamp says.
    const speeds = SPEED_CURVE.map((r) => r.speed);
    expect(Math.min(...speeds), "SPEED_CURVE's floor has left the clamp").toBe(lo);
    expect(Math.max(...speeds), "SPEED_CURVE's ceiling has left the clamp").toBe(hi);
    const body = CANON_SRC.slice(
      CANON_SRC.indexOf("export const speedFromPowerWeight"),
      CANON_SRC.indexOf("export const terrainMultiplier"),
    );
    expect(body, "the clamp was inlined as literals and can now drift from MOTOR_MODEL")
      .toContain("MOTOR_MODEL.speedClamp[0], MOTOR_MODEL.speedClamp[1]");
    expect(speedFromPowerWeight(0.0001, 1000)).toBe(lo);
    expect(speedFromPowerWeight(1e6, 0.1)).toBe(hi);
  });

  it("the quality-weight zero clamp is unreachable at the shipped luck slopes", () => {
    // ROLL_ODDS' comment and §11 both call the clamp defensive. That is only
    // true while every (1 + luck x slope) stays positive over luck in [-1, 1],
    // which is a property of the SLOPES and therefore rots when one is edited.
    // Enumerated rather than asserted in prose; the day a slope passes 1 this
    // goes red and the clamp needs a test that drives it.
    let worst = Infinity;
    for (const g of Object.keys(ROLL_ODDS.luckSlope)) {
      for (const luck of [-1, 1]) {
        const factor = 1 + luck * ROLL_ODDS.luckSlope[g];
        if (factor < worst) worst = factor;
        expect(QUALITY_GRADES[g], `luckSlope names ${g}, which is not a grade`).toBeDefined();
      }
    }
    expect(worst, "a luck slope now exceeds 1: the zero clamp is live and untested").toBeGreaterThan(0);
    expect(Math.max(...Object.values(ROLL_ODDS.luckSlope).map(Math.abs))).toBeLessThan(1);
  });

  it("no source but byDrive emits a running-gear token", () => {
    // The three tokens that name how a hull puts its weight on the ground are
    // the SUSPENSION's alone. byClass used to carry them too and, because the
    // six maps are unioned, shipped stands tagged both `tracked` and `walker`.
    // Structural half of the guard; motor-roll.test.js drives the rolled half.
    const GROUND = ["tracked", "wheeled", "walker"];
    const src = MOTOR_MODEL.specials;
    for (const group of ["byClass", "byMount", "byPackage", "byQuirk", "byMod"]) {
      for (const [k, tokens] of Object.entries(src[group])) {
        for (const t of tokens) {
          expect(GROUND.includes(t), `specials.${group}.${k} emits the running-gear token ${t}`).toBe(false);
        }
      }
    }
    // and every one of the three still has a source, or the vocabulary lies
    for (const t of GROUND) {
      expect(Object.values(src.byDrive).some((list) => list.includes(t)), `no drive emits ${t}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// §3 THE DOCUMENT'S NUMBERS, RECOMPUTED
// ---------------------------------------------------------------------------

describe("docs/MOTOR_POOL.md", () => {
  it("the documented speed-curve samples match speedFromPowerWeight", () => {
    const samples = extractConst(DOC, "SPEED_CURVE_SAMPLES");
    expect(samples.length, "§5 must span the whole curve").toBeGreaterThanOrEqual(8);
    for (const row of samples) {
      expect(speedFromPowerWeight(row.hp, row.tonnage), `${row.hp}hp / ${row.tonnage}t`).toBe(row.speed);
    }
    // both clamps are exercised, not merely present
    expect(samples.some((r) => r.speed === MOTOR_MODEL.speedClamp[0])).toBe(true);
    expect(samples.some((r) => r.speed === MOTOR_MODEL.speedClamp[1])).toBe(true);
  });

  // The §13 model, in code. `value` and `ratio` are RECOMPUTED from
  // CHASSIS_PATTERNS, ARMOUR_CLASSES and WEAPON_PATTERNS on every run, so a
  // Lane I change moves the audit rather than falsifying it — and a figure
  // typed into the document that the tables do not support goes red here.
  const FACING_WEIGHT = { front: 0.45, side: 0.3, rear: 0.1, top: 0.15 };
  const CARRIAGE = 0.7;
  const meanPts = (cls) => {
    const rows = Object.values(WEAPON_PATTERNS).filter((p) => p.class === cls);
    return rows.reduce((t, p) => t + p.pts, 0) / rows.length;
  };
  const valueOf = (c) => {
    let value = 0;
    for (const [face, w] of Object.entries(FACING_WEIGHT)) value += w * av(c.hull.baseArmour[face]);
    for (const hp of c.hull.hardpoints) value += CARRIAGE * Math.max(...hp.allowed.map(meanPts));
    return round4(value);
  };

  it("the Points Audit covers every chassis and matches its pts", () => {
    const audit = extractConst(DOC, "POINTS_AUDIT");
    expect(audit.map((r) => r.key).sort()).toEqual([...CHASSIS_KEYS].sort());
    for (const row of audit) {
      expect(row.pts, `${row.key} pts`).toBe(CHASSIS_PATTERNS[row.key].pts);
      expect(row.value, `${row.key} value`).toBe(valueOf(CHASSIS_PATTERNS[row.key]));
    }
  });

  it("the Hundredweight 141 Line Crawler reference prices at 12 pts", () => {
    const audit = extractConst(DOC, "POINTS_AUDIT");
    const ref = audit.find((r) => r.key === "hundredweight_141_line_crawler");
    expect(ref, "the reference row is missing").toBeDefined();
    expect(ref.pts).toBe(12);
    expect(ref.ratio).toBe(1);
    expect(ref.value).toBe(valueOf(CHASSIS_PATTERNS.hundredweight_141_line_crawler));
  });

  it("no chassis exceeds 1.6x the reference points efficiency", () => {
    const audit = extractConst(DOC, "POINTS_AUDIT");
    const ref = audit.find((r) => r.key === "hundredweight_141_line_crawler");
    const refEff = ref.value / ref.pts;
    for (const row of audit) {
      const ratio = round4((row.value / row.pts) / refEff);
      expect(ratio, `${row.key} ratio drifted from the table`).toBe(row.ratio);
      expect(ratio, `${row.key} is ${ratio}x the reference`).toBeLessThanOrEqual(1.6);
    }
  });

  // §9 and §10 restate thirty-four kits and twenty-four quirks in markdown.
  // That is precisely the shape Wave 1's audit caught — a published number
  // that is arithmetically false against its own table, restated in three
  // places and checked by nothing — so both tables are PARSED and compared
  // row for row against the catalogue rather than proof-read.
  const mdRows = (heading) => {
    const start = DOC.indexOf(`\n## ${heading}`);
    expect(start, `${heading} is missing`).toBeGreaterThan(-1);
    const next = DOC.indexOf("\n## ", start + 1);
    const section = DOC.slice(start, next === -1 ? DOC.length : next);
    return section.split("\n")
      .filter((l) => l.startsWith("| ") && !l.startsWith("| ---") && !/\| *(Slot|Quirk|Key|Plate key|Spent by|Declarative) *\|/.test(l))
      .map((l) => l.slice(1, l.lastIndexOf("|")).split(" | ").map((c) => c.trim()));
  };
  // "reliability −0.08 · heat +2" → { reliability: -0.08, heat: 2 }
  const deltas = (cell) => {
    const out = {};
    for (const part of cell.replace(/−/g, "-").split("·").map((x) => x.trim()).filter(Boolean)) {
      const m = part.match(/^([A-Za-z]+)\s+([+-]?[\d.]+)$/);
      expect(m, `unparseable delta "${part}"`).not.toBeNull();
      out[m[1]] = Number(m[2]);
    }
    return out;
  };

  it("§9's refit table matches VEHICLE_MODS row for row", () => {
    const rows = mdRows("9. Refit kits (vehicle modifications)");
    expect(rows.length, "§9 must list every kit").toBe(Object.keys(VEHICLE_MODS).length);
    const byLabel = new Map(Object.values(VEHICLE_MODS).map((m) => [m.label, m]));
    for (const [slot, labelCell, pts, buys, costs] of rows) {
      const tierMark = labelCell.match(/\*\((.+)\)\*$/);
      const label = labelCell.replace(/\s*\*\(.+\)\*$/, "");
      const kit = byLabel.get(label);
      expect(kit, `§9 names "${label}", which is not in VEHICLE_MODS`).toBeDefined();
      expect(kit.slot, `${label} slot`).toBe(slot);
      expect(kit.pts, `${label} pts`).toBe(Number(pts));
      expect(deltas(buys), `${label} buys`).toEqual(kit.mods);
      expect(deltas(costs), `${label} costs`).toEqual(kit.tradeoff);
      // the tier annotation is the gate, not a decoration
      expect(tierMark ? tierMark[1] : undefined, `${label} tier mark`).toBe(ROLL_ODDS.tierOf.mods[kit.key]);
    }
  });

  it("§10's quirk table matches VEHICLE_QUIRKS row for row", () => {
    const rows = mdRows("10. Quirks & conditions");
    expect(rows.length, "§10 must list every quirk").toBe(Object.keys(VEHICLE_QUIRKS).length);
    const byLabel = new Map(Object.values(VEHICLE_QUIRKS).map((q) => [q.label, q]));
    for (const [label, conditionCell, effect] of rows) {
      const q = byLabel.get(label);
      expect(q, `§10 names "${label}", which is not in VEHICLE_QUIRKS`).toBeDefined();
      const [key, ...rest] = conditionCell.split(/\s+/);
      const raw = rest.join(" ").replace(/`/g, "");
      const want = raw === "" ? { key } : { key, value: /^-?[\d.]+$/.test(raw) ? Number(raw) : raw };
      expect(want, `${label} condition`).toEqual(q.condition);
      expect(deltas(effect), `${label} effect`).toEqual(q.mods);
    }
  });

  it("the counts the document states in prose are the counts the tables hold", () => {
    // A measured count written into prose goes stale; every one this document
    // spells out is asserted here against the thing it counts. Spelled-out
    // numbers are used deliberately — they read better and they are just as
    // checkable, because this test builds the expected phrase rather than
    // reading a digit.
    const doc = DOC.toLowerCase();
    const has = (phrase) => expect(doc, `the document's prose has drifted: expected "${phrase}"`).toContain(phrase.toLowerCase());

    has(`${WORD[Object.keys(VEHICLE_MODS).length]} kits across the nine`);
    has(`${WORD[Object.keys(VEHICLE_QUIRKS).length]} quirks, in the Arms Catalogue's`);
    const innate = new Set(CHASSIS_KEYS.flatMap((k) => CHASSIS_PATTERNS[k].quirks)).size;
    has(`${WORD[innate]} are innate and ${WORD[ROLL_ODDS.rollableQuirks.length]} are rollable`);
    has(`${WORD[VEHICLE_QUIRK_CONDITIONS.length]} keys, and ${WORD[7]} of them are Lane I's own`);
    has(`at most **${MOTOR_MODEL.packageWeightCap * 100} %**`);

    const motorPlates = IMAGE_LIBRARY.filter((p) => p.category === "motor").length;
    has(`**${motorPlates} placeholder plates**`);

    const mine = ENTRIES.filter((e) => MOTOR_ENTRY_IDS.has(e.id));
    has(`${WORD[mine.length]} entries — one per motor-works`);
    has(`${WORD[mine.filter((e) => e.status === "thin").length]} of the ${WORD[mine.length]} are \`status: 'thin'\``);
  });

  it("§14 and the appended docs/GAME_RULES.md section are the same text", () => {
    // BOUNDED AT BOTH ENDS, on both sides. Slicing to end of file would hold
    // only while this lane happened to be the last to append to GAME_RULES.md,
    // and Lane G's section already sits between Lane I's and this one.
    const TITLE = `The Motor Pool ${PROPOSED}`;
    const heading = () => new RegExp(`^## \\d+\\. ${TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "gm");
    const section = (src, where) => {
      const hits = [...src.matchAll(heading())];
      expect(hits.length, `${where}: expected exactly one "${TITLE}" heading, found ${hits.length}`).toBe(1);
      const start = hits[0].index;
      const body = src.slice(start).replace(/^## \d+\. /, "");
      const next = body.indexOf("\n## ");
      return body.slice(0, next === -1 ? body.length : next).trim();
    };
    const rules = readRepoFile("docs/GAME_RULES.md");
    const inDoc = section(DOC, "docs/MOTOR_POOL.md §14");
    const inRules = section(rules, "docs/GAME_RULES.md");
    expect(inDoc.length).toBeGreaterThan(500);
    expect(inRules.length).toBeGreaterThan(500);
    expect(inDoc, "the two copies of the proposed rules section have drifted").toBe(inRules);
  });

  // The 22 sections that predate this whole wave, in order, by number AND by
  // wording. Lane I's and Lane G's [PROPOSED] sections sit after them and are
  // deliberately NOT pinned to a number here: the orchestrator renumbers
  // appended sections at merge when two lanes claim the same one, and a test
  // that hard-codes 25 turns that mechanical fix into someone else's red
  // build. Nothing below reads a literal section number — this lane's is
  // DERIVED from its title, which is the one thing a renumber does not touch.
  const PRE_WAVE = [
    "Victory Conditions",
    "Resources & Economy",
    "Buildings",
    "Units",
    "Garrison Combat (tile-vs-tile Attack action)",
    "Terrain & Elevation",
    "Supply & Logistics",
    "Weather",
    "Field Armies & Generals (Mass Combat)",
    "Artillery Bombardment",
    "Army Designs (Design Bureau)",
    "Reconnaissance Probe",
    "Faction Point-Buy Perks",
    "NPC AI (per turn)",
    "Game Setup",
    "Fog of War & Intel",
    'Diplomacy — The Envoy Desk (v1.1.0 "The Envoy Accords")',
    "Mobile Fortress-Bases (vanilla-era slice)",
    "Doctrine Research (Directorate of War Sciences)",
    "The State Armory (off-turn unlocks)",
    "Command Vehicles & Refit Logistics",
    "Macro Operations (experimental world model — slices M1–M3a)",
  ];
  const rulesHeadings = () => [...readRepoFile("docs/GAME_RULES.md")
    .matchAll(/^## (\d+)\. (.+)$/gm)]
    .map((m) => ({ n: Number(m[1]), title: m[2], at: m.index }));
  const mySection = () => {
    const mine = rulesHeadings().filter((h) => h.title === `The Motor Pool ${PROPOSED}`);
    expect(mine.length, "expected exactly one Motor Pool section in docs/GAME_RULES.md").toBe(1);
    return mine[0];
  };

  it("docs/GAME_RULES.md keeps every pre-existing section, unrenumbered and unreworded", () => {
    const headings = rulesHeadings();
    PRE_WAVE.forEach((title, i) => {
      const h = headings.find((x) => x.n === i + 1);
      expect(h, `§${i + 1} went missing`).toBeDefined();
      expect(h.title, `§${i + 1} was reworded`).toBe(title);
    });
    const numbers = headings.map((h) => h.n);
    expect(new Set(numbers).size, "a section number is duplicated").toBe(numbers.length);
    // headings are matched in file order, so this also proves nothing was
    // inserted out of sequence — and it survives a later lane appending.
    expect(numbers, "section numbers are not 1..N in file order")
      .toEqual(numbers.map((_, i) => i + 1));

    const mine = mySection();
    expect(mine.n, "this lane's section must be appended after the pre-wave rules")
      .toBeGreaterThan(PRE_WAVE.length);
    const lastPreWave = Math.max(...headings.filter((h) => h.n <= PRE_WAVE.length).map((h) => h.at));
    expect(mine.at, "this lane's section must sit after every pre-existing one")
      .toBeGreaterThan(lastPreWave);
  });

  it("every section number this lane quotes is the number GAME_RULES.md actually uses", () => {
    // Three places name the number, and a renumber must move all three. This
    // is what makes that renumber mechanical instead of a silent falsehood:
    // §14's prose, §14's embedded copy of the heading, and nothing else.
    const n = mySection().n;
    const quoted = DOC.match(/is numbered \*\*§(\d+)\*\*/);
    expect(quoted, "§14 must state the GAME_RULES number it was appended as").not.toBeNull();
    expect(Number(quoted[1]), "§14's prose quotes a number GAME_RULES.md does not use").toBe(n);
    expect(DOC, "§14's embedded copy carries a different number")
      .toContain(`\n## ${n}. The Motor Pool ${PROPOSED}`);
    // and no OTHER number is claimed anywhere in this lane's prose
    const claims = new Set([...DOC.matchAll(/GAME_RULES(?:\.md)? §(\d+)/g)].map((m) => Number(m[1])));
    for (const c of claims) expect(c, "docs/MOTOR_POOL.md cites a stale GAME_RULES section").toBe(n);
  });

  it("no shipped Codex entry hard-codes a GAME_RULES section number", () => {
    // The Codex block is appended to a file Lane H owns and merges AFTER this
    // lane, so a number inside it is the one place a renumber could not be
    // fixed by editing this lane's own files. The entries name the section by
    // title instead; this asserts they keep doing so.
    const block = JSON.stringify(ENTRIES.filter((e) => MOTOR_ENTRY_IDS.has(e.id)));
    expect(block.match(/GAME_RULES(?:\.md)? ?§ ?\d+/), "a Codex entry pins a section number").toBeNull();
    expect(block, "the Codex must still point at the draft section by title")
      .toContain("Motor Pool section of docs/GAME_RULES.md");
  });
});

// ---------------------------------------------------------------------------
// §3b THE DOCUMENT RESTATES THE CATALOGUE — AND EVERY RESTATEMENT IS PARSED
// ---------------------------------------------------------------------------
//
// §3 to §8 repeat six catalogue tables in markdown, and §13 quotes a dozen
// figures derived from Lane I's. Wave 1's audit caught a cost curve that was
// arithmetically false against its own tree, restated in three places and
// checked by nothing; §9 and §10 were already parsed row for row above, and
// this block is the other six tables plus the derived prose. Nothing here is
// proof-read: every number is recomputed from the table it claims to describe.
describe("docs/MOTOR_POOL.md restates the catalogue, and the restatements are parsed", () => {
  const cells = (l) => l.slice(1, l.lastIndexOf("|")).split(" | ").map((c) => c.trim());
  const tablesIn = (heading) => {
    const start = DOC.indexOf(`\n## ${heading}`);
    expect(start, `${heading} is missing`).toBeGreaterThan(-1);
    const next = DOC.indexOf("\n## ", start + 1);
    const lines = DOC.slice(start, next === -1 ? DOC.length : next).split("\n");
    const runs = [];
    let run = null;
    for (const l of lines) {
      if (l.startsWith("|")) { (run ||= []).push(l); continue; }
      if (run) { runs.push(run); run = null; }
    }
    if (run) runs.push(run);
    return runs.map((r) => {
      expect(r.length, `${heading}: a table needs a header, a rule and rows`).toBeGreaterThan(2);
      expect(r[1].replace(/[|\-\s]/g, ""), `${heading}: line 2 must be the rule`).toBe("");
      return { header: cells(r[0]), rows: r.slice(2).map(cells) };
    });
  };
  const table = (heading, firstColumn) => {
    const hit = tablesIn(heading).filter((t) => t.header[0] === firstColumn);
    expect(hit.length, `expected one table headed "${firstColumn}" in ${heading}`).toBe(1);
    return hit[0];
  };
  const plain = (c) => c.replace(/`/g, "").replace(/\*\*/g, "").replace(/−/g, "-").replace(/°/g, "").trim();
  const num = (c) => {
    const n = Number(plain(c));
    expect(Number.isFinite(n), `"${c}" is not a number`).toBe(true);
    return n;
  };
  // "`armorPen +0.35`, `rateOfFire −0.15`" → { armorPen: 0.35, rateOfFire: -0.15 }
  const pairs = (cell, sep) => {
    const out = {};
    for (const part of cell.split(sep).map(plain).filter(Boolean)) {
      const m = part.match(/^([A-Za-z_]+)\s+([+-]?[\d.]+)$/);
      expect(m, `unparseable "${part}"`).not.toBeNull();
      out[m[1]] = Number(m[2]);
    }
    return out;
  };
  const FLAT = DOC.replace(/\s+/g, " ");

  it("§3's motor-works table matches the MANUFACTURERS rows this lane appended", () => {
    const { rows } = table("3. The Motor Works", "Key");
    expect(rows.length, "§3 must list every mw_* works").toBe(MOTOR_WORKS_KEYS.length);
    for (const [keyCell, label, tie, lean] of rows) {
      const key = plain(keyCell);
      expect(MOTOR_WORKS_KEYS, `${key} is not in MOTOR_WORKS_KEYS`).toContain(key);
      const m = MANUFACTURERS[key];
      expect(m, `${key} is not in MANUFACTURERS`).toBeDefined();
      expect(m.label, `${key} label`).toBe(label);
      const [kind, value] = tie.split(/\s+/);
      expect(["house", "culture"], `${key} tie kind`).toContain(kind);
      expect(kind === "house" ? m.houseKey : m.culture, `${key} tie`).toBe(plain(value));
      expect(pairs(lean, ","), `${key} signature`).toEqual(m.signature);
    }
  });

  it("§4's chassis table matches CHASSIS_PATTERNS row for row", () => {
    const { rows } = table("4. Chassis patterns", "Pattern");
    expect(rows.length, "§4 must list every hull").toBe(CHASSIS_KEYS.length);
    const byLabel = new Map(CHASSIS_KEYS.map((k) => [CHASSIS_PATTERNS[k].label, CHASSIS_PATTERNS[k]]));
    for (const [label, cls, tier, works, t, crew, facings, hardpoints, pts] of rows) {
      const c = byLabel.get(label);
      expect(c, `§4 names "${label}", which is not in CHASSIS_PATTERNS`).toBeDefined();
      expect(c.class, `${label} class`).toBe(plain(cls));
      expect(c.tier, `${label} tier`).toBe(plain(tier));
      // §4's column drops the works' definite article; §3 keeps it.
      expect(MANUFACTURERS[c.maker].label.replace(/^The /, ""), `${label} works`)
        .toBe(works.replace(/^The /, ""));
      expect(c.hull.tonnage, `${label} tonnage`).toBe(num(t));
      expect(c.hull.crew, `${label} crew`).toBe(num(crew));
      expect(facings.split("/").map((x) => plain(x)), `${label} facings`)
        .toEqual([c.hull.baseArmour.front, c.hull.baseArmour.side, c.hull.baseArmour.rear, c.hull.baseArmour.top]);
      expect(c.pts, `${label} pts`).toBe(num(pts));
      // Hardpoints are compared as MECHANICS, not as spelling: "sponson ×2
      // (hmg)" is two positions that take an hmg, wherever the catalogue keys
      // them. What must not drift is the count and the allowed lists.
      const declared = [];
      for (const part of hardpoints.split(";").map((x) => x.trim())) {
        const m = part.match(/^(.+?)(?: ×(\d+))? \(([^)]+)\)$/);
        expect(m, `${label}: unparseable hardpoint "${part}"`).not.toBeNull();
        const allowed = m[3].split(",").map((x) => plain(x)).join("+");
        for (let i = 0; i < Number(m[2] || 1); i++) declared.push(allowed);
      }
      expect(declared.sort(), `${label} hardpoints`)
        .toEqual(c.hull.hardpoints.map((h) => h.allowed.join("+")).sort());
    }
    expect(new Set(rows.map((r) => r[0])).size, "§4 lists a hull twice").toBe(rows.length);
  });

  it("§5's powerplant table matches POWERPLANTS row for row", () => {
    const { rows } = table("5. Powerplants & the speed curve", "Plant");
    expect(rows.length, "§5 must list every plant").toBe(Object.keys(POWERPLANTS).length);
    const byLabel = new Map(Object.values(POWERPLANTS).map((p) => [p.label, p]));
    for (const [label, hp, t, rel, fuel, heat] of rows) {
      const p = byLabel.get(label);
      expect(p, `§5 names "${label}", which is not in POWERPLANTS`).toBeDefined();
      expect(p.hp, `${label} hp`).toBe(num(hp));
      expect(p.weight, `${label} weight`).toBe(num(t));
      expect(p.reliability, `${label} reliability`).toBe(num(rel));
      expect(p.fuelClass, `${label} fuelClass`).toBe(plain(fuel));
      expect(p.heat, `${label} heat`).toBe(num(heat));
    }
  });

  it("§5's published curve is SPEED_CURVE, and the samples straddle every step", () => {
    const { rows } = table("5. Powerplants & the speed curve", "`minRatio` (hp per tonne)");
    expect(rows.map(([r, s]) => ({ minRatio: num(r), speed: num(s) })), "§5's curve has drifted")
      .toEqual(MIRROR.SPEED_CURVE);
    // Every step of the curve is exercised by a documented sample, so a row
    // could not be deleted and leave the sample table still passing.
    const samples = extractConst(DOC, "SPEED_CURVE_SAMPLES");
    MIRROR.SPEED_CURVE.forEach((step, i) => {
      const upper = MIRROR.SPEED_CURVE[i + 1] ? MIRROR.SPEED_CURVE[i + 1].minRatio : Infinity;
      expect(samples.some((s) => s.hp / s.tonnage >= step.minRatio && s.hp / s.tonnage < upper),
        `no documented sample lands on the ${step.minRatio} hp/t step`).toBe(true);
    });
  });

  it("§6's armour-package table matches ARMOUR_PACKAGES row for row", () => {
    const { rows } = table("6. Armour packages & facings", "Package");
    expect(rows.length, "§6 must list every package").toBe(Object.keys(ARMOUR_PACKAGES).length);
    const byLabel = new Map(Object.values(ARMOUR_PACKAGES).map((p) => [p.label, p]));
    for (const [label, facings, t, cost, rel] of rows) {
      const p = byLabel.get(label);
      expect(p, `§6 names "${label}", which is not in ARMOUR_PACKAGES`).toBeDefined();
      const declared = {};
      ["front", "side", "rear", "top"].forEach((face, i) => {
        const v = plain(facings.split("/")[i] || "");
        if (v && v !== "—" && v !== "-") declared[face] = v;
      });
      expect(declared, `${label} facings`).toEqual(p.facings);
      expect(p.weight, `${label} weight`).toBe(num(t));
      expect(p.cost, `${label} cost`).toBe(num(cost));
      expect(p.reliability, `${label} reliability delta`).toBe(num(rel));
    }
  });

  it("§7's terrain matrix matches SUSPENSIONS cell for cell", () => {
    const { header, rows } = table("7. Suspension & terrain", "Drive");
    expect(header.slice(1, -2), "§7's columns are not the terrain vocabulary, in order")
      .toEqual(TERRAIN_KEYS);
    expect(header.slice(-2)).toEqual(["+t", "rel"]);
    expect(rows.length, "§7 must list every drive").toBe(Object.keys(SUSPENSIONS).length);
    const byLabel = new Map(Object.values(SUSPENSIONS).map((s) => [s.label, s]));
    for (const row of rows) {
      const s = byLabel.get(row[0]);
      expect(s, `§7 names "${row[0]}", which is not in SUSPENSIONS`).toBeDefined();
      TERRAIN_KEYS.forEach((t, i) => {
        expect(s.terrain[t], `${row[0]} × ${t}`).toBe(num(row[i + 1]));
      });
      expect(s.weight, `${row[0]} weight`).toBe(num(row[row.length - 2]));
      expect(s.reliability, `${row[0]} reliability`).toBe(num(row[row.length - 1]));
    }
    // §7's prose counts the drives that claim to cross an impassable hex.
    const TERRAIN = extractConst(readRepoFile("base44/shared/tacticalField.ts"), "TERRAIN");
    const impassable = Object.keys(TERRAIN).filter((t) => TERRAIN[t].moveCost === null);
    const crossers = Object.values(SUSPENSIONS).filter((s) => impassable.some((t) => s.terrain[t] > 0));
    const said = FLAT.match(/only ([\w-]+) drives make it/);
    expect(said, "§7 must count the drives that cross an impassable hex").not.toBeNull();
    expect(said[1].toLowerCase(), `§7 says "${said[1]}"; ${crossers.length} drives do`)
      .toBe(WORD[crossers.length]);
  });

  it("§8's mount table matches MOUNTS row for row, crew-exposure column included", () => {
    const { rows } = table("8. Turrets & mounts", "Mount");
    expect(rows.length, "§8 must list every mount").toBe(Object.keys(MOUNTS).length);
    const byLabel = new Map(Object.values(MOUNTS).map((m) => [m.label, m]));
    for (const [label, hardpoints, arc, crewArmour, morale] of rows) {
      const m = byLabel.get(label);
      expect(m, `§8 names "${label}", which is not in MOUNTS`).toBeDefined();
      expect(m.hardpoints, `${label} hardpoints`).toBe(num(hardpoints));
      expect(m.arc, `${label} arc`).toBe(num(arc));
      expect(m.crewArmour, `${label} crewArmour`).toBe(plain(crewArmour));
      // the morale column is not a fourth authored figure — it is the lookup
      expect(CREW_EXPOSURE_MORALE[m.crewArmour], `${label} crew morale`).toBe(num(morale));
    }
    // and §8's prose spells the whole lookup out, so parse that too
    const quoted = pairs(FLAT.match(/`none [^.]+?fortified [+-]?\d+`/)[0], "`, `");
    expect(quoted, "§8's crew-exposure prose has drifted from CREW_EXPOSURE_MORALE")
      .toEqual(CREW_EXPOSURE_MORALE);
  });

  // -- the derived figures §13 and §6 publish ------------------------------
  const meanOf = (cls, f) => {
    const rows = Object.values(WEAPON_PATTERNS).filter((p) => p.class === cls);
    expect(rows.length, `${cls} has no patterns`).toBeGreaterThan(0);
    return rows.reduce((t, p) => t + f(p), 0) / rows.length;
  };

  it("§13's class means are recomputed from WEAPON_PATTERNS, not typed", () => {
    const quoted = pairs(FLAT.match(/`meanPts` is `([^`]+)`/)[1], "·");
    expect(Object.keys(quoted).sort(), "§13 must quote every vehicle-capable class")
      .toEqual([...VEHICLE_CAPABLE].sort());
    for (const [cls, n] of Object.entries(quoted)) {
      expect(round4(meanOf(cls, (p) => p.pts)), `§13's meanPts for ${cls}`).toBe(n);
    }
  });

  it("§13's anti-armour / anti-personnel split is recomputed from arms.ts", () => {
    const round2 = (n) => Math.round(n * 100) / 100;
    const hits = [...FLAT.matchAll(/`(\w+)`[^`]{0,14}`AP ([\d.]+) \/ AA ([\d.]+)`/g)];
    expect(hits.length, "§13 must quote the split for at least three classes").toBeGreaterThanOrEqual(3);
    for (const [, cls, ap, aa] of hits) {
      expect(VEHICLE_CAPABLE, `${cls} is not a vehicle-capable class`).toContain(cls);
      expect(round2(meanOf(cls, apValue)), `§13's AP mean for ${cls}`).toBe(Number(ap));
      expect(round2(meanOf(cls, aaValue)), `§13's AA mean for ${cls}`).toBe(Number(aa));
    }
    // "`flame` and `mortar` both `AA 0.00`"
    const both = FLAT.match(/`(\w+)` and `(\w+)` both `AA ([\d.]+)`/);
    expect(both, "§13 must name the classes with no anti-personnel value").not.toBeNull();
    for (const cls of [both[1], both[2]]) {
      expect(round2(meanOf(cls, aaValue)), `${cls} AA`).toBe(Number(both[3]));
    }
  });

  it("§13's reference efficiency and the spread of the audit are recomputed", () => {
    const audit = extractConst(DOC, "POINTS_AUDIT");
    const ref = audit.find((r) => r.key === "hundredweight_141_line_crawler");
    const eff = FLAT.match(/`refEff = ([\d.]+) \/ (\d+) = ([\d.]+)`/);
    expect(eff, "§13 must publish the reference efficiency").not.toBeNull();
    expect(Number(eff[1]), "§13's reference value").toBe(ref.value);
    expect(Number(eff[2]), "§13's reference pts").toBe(ref.pts);
    expect(round4(ref.value / ref.pts), "§13's refEff").toBe(Number(eff[3]));

    const ratios = audit.map((r) => r.ratio).sort((a, b) => a - b);
    const band = FLAT.match(/widest spread below is `([\d.]+) … ([\d.]+)`/);
    expect(band, "§13 must publish the spread it claims").not.toBeNull();
    expect(Number(band[1]), "§13's lowest ratio").toBe(ratios[0]);
    expect(Number(band[2]), "§13's highest ratio").toBe(ratios[ratios.length - 1]);

    // the four rows §13 calls out by name quote their own audit ratio
    const called = [...FLAT.matchAll(/\*\*([A-Z][^*]+?)\*\* \((\d\.\d+)\)/g)];
    expect(called.length, "§13's blind-spot list has changed shape").toBeGreaterThanOrEqual(4);
    for (const [, name, ratio] of called) {
      const key = CHASSIS_KEYS.find((k) => CHASSIS_PATTERNS[k].label.startsWith(name));
      expect(key, `§13 calls out "${name}", which is not a chassis`).toBeDefined();
      expect(audit.find((r) => r.key === key).ratio, `${name}'s quoted ratio`).toBe(Number(ratio));
    }
  });

  it("§12's count of facing-lowering pairings is recomputed from the tables", () => {
    // §12 tells the platform that a HAND-FITTED package must be checked
    // against ROLL_ODDS.packagePool, and quotes a measured number as the
    // reason. Both halves are recomputed here: the number, and the claim it
    // stands on — that no lowering pair is inside a hull's own pool.
    let lowering = 0;
    let loweringInPool = 0;
    for (const ck of CHASSIS_KEYS) {
      const base = CHASSIS_PATTERNS[ck].hull.baseArmour;
      for (const pk of Object.keys(ARMOUR_PACKAGES)) {
        const lowers = Object.entries(ARMOUR_PACKAGES[pk].facings)
          .some(([face, cls]) => av(cls) < av(base[face]));
        if (!lowers) continue;
        lowering += 1;
        if ((ROLL_ODDS.packagePool[ck] || []).includes(pk)) loweringInPool += 1;
      }
    }
    expect(loweringInPool, "a hull's own package pool offers it a facing DOWNGRADE").toBe(0);
    expect(lowering, "there is nothing for the hand-fitting gate to catch").toBeGreaterThan(0);
    const quoted = FLAT.match(/(\d+) \(chassis,\s*package\) pairs lower at least one facing/);
    expect(quoted, "§12 no longer states the count the gate exists for").not.toBeNull();
    expect(Number(quoted[1]), "§12's measured count has gone stale").toBe(lowering);

    // and PLATFORM_HANDOFF J2's named worked case is still a worked case
    const handoff = readRepoFile("docs/prompts/PLATFORM_HANDOFF.md").replace(/\s+/g, " ");
    const named = handoff.match(/`(ap_\w+)` on `(\w+)` is the worked case/);
    expect(named, "J2 no longer names a worked case for the hand-fitting gate").not.toBeNull();
    const [, pkg, hull] = named;
    expect(ARMOUR_PACKAGES[pkg], `J2 names ${pkg}, which is not a package`).toBeDefined();
    expect(CHASSIS_PATTERNS[hull], `J2 names ${hull}, which is not a hull`).toBeDefined();
    expect((ROLL_ODDS.packagePool[hull] || []).includes(pkg),
      `J2's worked case ${pkg}/${hull} is inside the pool and proves nothing`).toBe(false);
    const hullBase = CHASSIS_PATTERNS[hull].hull.baseArmour;
    const dropped = Object.entries(ARMOUR_PACKAGES[pkg].facings)
      .filter(([face, cls]) => av(cls) < av(hullBase[face]));
    expect(dropped.length, `J2's worked case ${pkg}/${hull} no longer lowers a facing`).toBeGreaterThan(0);
    for (const [face, cls] of dropped) {
      expect(handoff, `J2 misstates the ${face} substitution`)
        .toContain(`${face} \`${hullBase[face]} → ${cls}\``);
    }
  });

  it("§6's worked armour example is what the curve actually returns", () => {
    // "14 t → 17.6 t … from 10.00 to 7.95 and the speed from 4 to 3", and the
    // carapace at "5.96 hp/t and speed 2". Three tables meet in that sentence.
    const ref = CHASSIS_PATTERNS.hundredweight_141_line_crawler;
    const hp = 140;
    const r2 = (n) => (Math.round(n * 100) / 100).toFixed(2);
    const glacis = Object.values(ARMOUR_PACKAGES).find((p) => p.label === "Cast Glacis & Nose");
    const carapace = Object.values(ARMOUR_PACKAGES).find((p) => p.label === "Breakthrough Carapace");
    expect(glacis, "§6's named case is missing from ARMOUR_PACKAGES").toBeDefined();
    const loaded = ref.hull.tonnage + glacis.weight;
    expect(FLAT).toContain(`${ref.hull.tonnage} t → ${loaded} t`);
    expect(FLAT).toContain(`from ${r2(hp / ref.hull.tonnage)} to ${r2(hp / loaded)}`);
    expect(speedFromPowerWeight(hp, ref.hull.tonnage), "the unloaded speed").toBe(4);
    expect(speedFromPowerWeight(hp, loaded), "the loaded speed").toBe(3);
    expect(FLAT).toContain("the speed from **4 to 3**");
    const heavy = ref.hull.tonnage + carapace.weight;
    expect(FLAT).toContain(`${r2(hp / heavy)} hp/t and speed **${speedFromPowerWeight(hp, heavy)}**`);
    const minus = (n) => String(n).replace("-", "−");
    expect(FLAT, "§6's stated cost for the named case has drifted")
      .toContain(`**+${glacis.weight} t** and **${minus(glacis.reliability)}**`);
  });

  it("the counts §3-§8 state in prose are the counts the tables hold", () => {
    // Captures the count WORD rather than asserting a phrase is present: a
    // containment check passes when the same phrase happens to appear
    // somewhere else in the document, which is how a mutated "Twenty hulls"
    // survived the first cut of this test untouched.
    const states = (re, n, what) => {
      const m = FLAT.match(re);
      expect(m, `${what}: the document no longer states this count`).not.toBeNull();
      expect(m[1].toLowerCase(), `${what}: prose says "${m[1]}", the table holds ${n}`).toBe(WORD[n]);
    };
    states(/([\w-]+) works are appended/i, MOTOR_WORKS_KEYS.length, "§3 motor works");
    states(/for all ([\w-]+) house keys/i, HOUSE_KEYS.length, "§3 house access");
    states(/([\w-]+) hulls, at least one per/i, CHASSIS_KEYS.length, "§4 chassis");
    states(/spread across all ([\w-]+) tiers/i,
      new Set(CHASSIS_KEYS.map((k) => CHASSIS_PATTERNS[k].tier)).size, "§4 tiers");
    // Counted off CHASSIS_PATTERNS, never off MANUFACTURERS: "how many works
    // build a hull" is this lane's own fact and cannot be falsified by a later
    // lane appending a manufacturer row.
    states(/and ([\w-]+) distinct works/i,
      new Set(CHASSIS_KEYS.map((k) => CHASSIS_PATTERNS[k].maker)).size, "§4 works");
    states(/([\w-]+) plants\./i, Object.keys(POWERPLANTS).length, "§5 powerplants");
    states(/([\w-]+) packages\./i, Object.keys(ARMOUR_PACKAGES).length, "§6 armour packages");
    states(/([\w-]+) drives\./i, Object.keys(SUSPENSIONS).length, "§7 suspensions");
    states(/([\w-]+) mounts\./i, Object.keys(MOUNTS).length, "§8 mounts");
    const singles = CHASSIS_KEYS.filter((k) => CHASSIS_PATTERNS[k].hull.hardpoints.length === 1).length;
    const multi = Object.values(MOUNTS).filter((m) => m.hardpoints >= 2).length;
    states(/([\w-]+) of the [\w-]+ hulls declare a single hardpoint/i, singles, "§8 single-hardpoint hulls");
    states(/of the ([\w-]+) hulls declare a single hardpoint/i, CHASSIS_KEYS.length, "§8 hull total");
    states(/the ([\w-]+) two-gun and three-gun mounts/i, multi, "§8 multi-gun mounts");
    // and the claims those counts stand on. Every hull's works resolves, and
    // every works THIS LANE APPENDED builds at least one hull — a subset and a
    // coverage claim, not an equality against a table this lane does not own.
    for (const k of CHASSIS_KEYS) {
      expect(MANUFACTURERS[CHASSIS_PATTERNS[k].maker], `${k} names an unknown works`).toBeDefined();
    }
    for (const w of MOTOR_WORKS_KEYS) {
      expect(CHASSIS_KEYS.some((k) => CHASSIS_PATTERNS[k].maker === w),
        `${w} was appended to MANUFACTURERS and builds no hull`).toBe(true);
    }
    const offered = new Set(CHASSIS_KEYS.flatMap((k) => CHASSIS_PATTERNS[k].slots));
    expect([...offered].sort(), "§4 claims every slot is offered by some hull")
      .toEqual([...VEHICLE_SLOTS].sort());
  });

  it("§4's cross-check against the live macro table still holds", () => {
    // §4 quotes four macro unit costs it was NOT fitted to. If the platform
    // lane reprices a regiment, this sentence becomes false, and this is the
    // only thing that would say so.
    const points = (key) => {
      expect(UNIT_TYPES[key], `${key} is not a macro unit`).toBeDefined();
      return UNIT_TYPES[key].points;
    };
    for (const [label, key] of [["line crawler", "crawler"], ["tractor gun", "artillery"],
      ["Shoalcutter", "gunboat"], ["Lofter", "fighter"]]) {
      const quoted = FLAT.match(new RegExp(`${label} (\\d+) ↔ (?:\\w+ )?(\\d+)`));
      expect(quoted, `§4 must cross-check ${label}`).not.toBeNull();
      expect(Number(quoted[2]), `§4's macro figure for ${key}`).toBe(points(key));
    }
    expect(points("crawler"), "the whole audit anchors on this").toBe(12);
  });
});

// ---------------------------------------------------------------------------
// §4 THE SHARED FILES
// ---------------------------------------------------------------------------

describe("the plate register", () => {
  const byKey = new Map(IMAGE_LIBRARY.map((p) => [p.key, p]));
  const mine = IMAGE_LIBRARY.filter((p) => p.category === "motor");

  it("plates: every catalogue row has its placeholder plate and every IMAGE_LIBRARY key is unique", () => {
    expect(IMAGE_CATEGORIES.motor, "the motor category is missing").toBeDefined();
    expect(IMAGE_CATEGORIES.motor.label).toBe("The Motor Pool");
    for (const k of CHASSIS_KEYS) expect(byKey.has(`chassis_${k}`), `chassis_${k} is missing`).toBe(true);
    for (const k of Object.keys(POWERPLANTS)) expect(byKey.has(`plant_${k}`), `plant_${k} is missing`).toBe(true);
    for (const table of [ARMOUR_PACKAGES, SUSPENSIONS, MOUNTS, VEHICLE_MODS]) {
      for (const k of Object.keys(table)) expect(byKey.has(`refit_${k}`), `refit_${k} is missing`).toBe(true);
    }
    for (const k of MOTOR_WORKS_KEYS) expect(byKey.has(`maker_${k}`), `maker_${k} is missing`).toBe(true);

    const expected = CHASSIS_KEYS.length + Object.keys(POWERPLANTS).length + MOTOR_WORKS_KEYS.length
      + [ARMOUR_PACKAGES, SUSPENSIONS, MOUNTS, VEHICLE_MODS].reduce((t, x) => t + Object.keys(x).length, 0);
    expect(mine.length, "the motor category carries a plate for something that is not in the catalogue").toBe(expected);

    const keys = IMAGE_LIBRARY.map((p) => p.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect([...new Set(dupes)], "duplicate plate keys").toEqual([]);
    // the 17 pre-existing refit_* keys in the vehicles category are untouched
    const theirs = IMAGE_LIBRARY.filter((p) => p.category === "vehicles" && p.key.startsWith("refit_"));
    expect(theirs.length).toBeGreaterThanOrEqual(17);
    for (const p of theirs) expect(mine.some((q) => q.key === p.key)).toBe(false);
  });

  it("plates: every prompt is url-less, 15-35 words, and carries no house style or colour", () => {
    // A prompt that restates HOUSE_STYLE produces a doubled prompt, because it
    // is prepended at generation. The colour sweep is scoped to the text that
    // reaches an image generator: the .ts calls a failing test "red" and that
    // is not a palette instruction.
    const STYLE = /\b(dieselpunk|painterly|concept art|film grain|wartime aesthetic|industrial wartime|foxhole|iron harvest)\b/i;
    const COLOURS = /\b(red|green|blue|amber|brass|olive|rust|umber|gold|golden|silver|crimson|scarlet|azure|violet|magenta|cyan|teal|ochre|sepia)\b/i;
    for (const p of mine) {
      // A plate starts life as a REQUEST (url null) and the Base44 session
      // DELIVERS it by adding the key to PLATE_URLS. "url is null" is a proxy
      // that is true only until the pipeline works — it went red on Lane I the
      // day nine maker plates were delivered. The real rule is that the LANE
      // ships no visual: a non-null url must have arrived through PLATE_URLS
      // and never from a literal written into imageLibrary.js.
      expect(p.url === null || PLATE_URLS[p.key] === p.url,
        `${p.key} has a url that did not come from PLATE_URLS`).toBe(true);
      expect(p.aspect, `${p.key} aspect`).toMatch(/^\d+:\d+$/);
      expect(words(p.prompt), `${p.key} prompt word count is ${words(p.prompt)}`).toBeGreaterThanOrEqual(15);
      expect(words(p.prompt), `${p.key} prompt word count is ${words(p.prompt)}`).toBeLessThanOrEqual(35);
      const text = `${p.title} ${p.desc} ${p.prompt}`;
      expect(STYLE.test(text), `${p.key} restates the house style`).toBe(false);
      expect(COLOURS.test(text), `${p.key} names a colour`).toBe(false);
    }
    expect(HOUSE_STYLE.length).toBeGreaterThan(0);
  });

  it("the plate block is one banner-commented tail block, bounded at both ends", () => {
    const src = readRepoFile("src/lib/imageLibrary.js");
    const banner = "  // ——— LANE J: motor pool ———";
    const start = src.indexOf(banner);
    expect(start, "the Lane J banner is missing from imageLibrary.js").toBeGreaterThan(-1);
    const terminator = src.indexOf("\n];\n\nexport const getImage");
    expect(terminator).toBeGreaterThan(start);
    const next = src.indexOf("\n  // ——— LANE ", start + 1);
    const end = next !== -1 && next < terminator ? next : terminator;
    const block = src.slice(start, end);
    // every motor plate is inside it, and nothing else's is
    for (const p of mine) expect(block, `${p.key} is outside the Lane J block`).toContain(`P("${p.key}"`);
    expect(src.indexOf("LANE I: arms"), "Lane I's block must still precede this one").toBeLessThan(start);
  });
});

describe("the Codex append", () => {
  const MOTOR_IDS = [...MOTOR_ENTRY_IDS];

  it("the codex appendix covers every motor-works and every VehicleClass", () => {
    const ids = new Set(ENTRIES.map((e) => e.id));
    for (const id of MOTOR_IDS) expect(ids.has(id), `${id} is missing from ENTRIES`).toBe(true);
    expect(MOTOR_IDS.length).toBeGreaterThanOrEqual(15);
    const mine = ENTRIES.filter((e) => MOTOR_IDS.includes(e.id));
    for (const e of mine) {
      expect(["powers", "war"], `${e.id} category`).toContain(e.category);
      expect(e.tag, `${e.id} tag`).toMatch(/^Motor Pool §\d+$/);
      expect(["canon", "thin"], `${e.id} status`).toContain(e.status);
      expect(e.summary.length).toBeGreaterThan(20);
      expect(e.blocks.length).toBeGreaterThanOrEqual(3);
    }
    // motor-works are `powers`, chassis classes are `war`
    for (const k of MOTOR_WORKS_KEYS) {
      expect(ENTRIES.find((e) => e.id === `maker-${k.replace(/_/g, "-")}`).category).toBe("powers");
    }
    for (const c of VEHICLE_CLASSES) {
      expect(ENTRIES.find((e) => e.id === `vehicle-class-${c.replace(/_/g, "-")}`).category).toBe("war");
    }
  });

  it("claims canon only where a governing document supports it", () => {
    // An EXACT equality, scoped to this lane's own ids. LORE.md names none of
    // these motor-works and does not divide the crawler by tonnage; the three
    // below are units the live rules already field.
    const canon = ENTRIES.filter((e) => MOTOR_IDS.includes(e.id) && e.status === "canon").map((e) => e.id).sort();
    expect(canon).toEqual(["vehicle-class-fighter", "vehicle-class-gunboat", "vehicle-class-tractor-gun"]);
  });

  it("every id is unique across the whole array and every see target resolves", () => {
    const seen = ENTRIES.map((e) => e.id);
    const dupes = seen.filter((id, i) => seen.indexOf(id) !== i);
    expect([...new Set(dupes)], "duplicate Codex ids").toEqual([]);
    const ids = new Set(seen);
    const broken = [];
    for (const e of ENTRIES) for (const t of e.see || []) if (!ids.has(t)) broken.push(`${e.id} → ${t}`);
    expect(broken, "the Archive is link-clean and an append must not break it").toEqual([]);
  });

  it("docs/MOTOR_POOL.md §15 reproduces the shipped block byte for byte", () => {
    const src = readRepoFile("src/lib/wiki/entries.js");
    const banner = "  // ——— LANE J: motor works & chassis classes ———";
    const start = src.indexOf(banner);
    expect(start, "the Lane J banner block is missing from entries.js").toBeGreaterThan(-1);
    // Bounded at the NEXT lane's banner or at the array terminator, whichever
    // comes first — Lane H merges after this lane and appends its own block.
    const terminator = src.indexOf("\n];\n\nexport const ENTRY_BY_ID");
    expect(terminator).toBeGreaterThan(start);
    const next = src.indexOf("\n  // ——— LANE ", start + 1);
    const end = next !== -1 && next < terminator ? next : terminator;
    const shipped = src.slice(start, end).replace(/\n+$/, "");

    const marker = "The rows exactly as they shipped:\n\n```js\n";
    const dstart = DOC.indexOf(marker);
    expect(dstart, "§15's shipped-rows block is missing").toBeGreaterThan(-1);
    const dend = DOC.indexOf("\n```", dstart + marker.length);
    expect(dend).toBeGreaterThan(dstart);
    expect(DOC.slice(dstart + marker.length, dend), "§15 has drifted from what shipped").toBe(shipped);
  });

  it("§16 lists every plate key this lane registered", () => {
    for (const p of IMAGE_LIBRARY.filter((x) => x.category === "motor")) {
      expect(DOC, `§16 omits ${p.key}`).toContain(`| \`${p.key}\` |`);
    }
  });
});

// ---------------------------------------------------------------------------
// §5 THE HARD PROHIBITIONS
// ---------------------------------------------------------------------------

describe("drift guards", () => {
  it("motorPool.ts contains no armour arithmetic", () => {
    for (const [where, src] of [["base44/shared/motorPool.ts", CANON_SRC], ["src/lib/motorPool.js", MIRROR_SRC]]) {
      for (const banned of [/armourValue/, /PEN_TABLE/, /TYPE_MATRIX/, /resolveHit/]) {
        expect(banned.test(src), `${where} names ${banned}`).toBe(false);
      }
    }
    // and the import list is only what §4 sanctions
    const imported = CANON_SRC.match(/^import \{([^}]*)\} from '\.\/arms\.ts';$/m);
    expect(imported, "the arms import moved or changed shape").not.toBeNull();
    expect(imported[1].split(",").map((s) => s.trim()).sort()).toEqual(
      ["QUALITY_GRADES", "QUALITY_ORDER", "WEAPON_PATTERNS", "resolveWeapon", "rollWeapon"].sort(),
    );
  });

  it("the export surface is the §4 contract plus exactly the documented extras", () => {
    // §4's Motor Pool block contracts twenty exports. This lane ships two
    // more and gives two contracted functions an OPTIONAL second parameter —
    // all additive, all mirrored, all justified in docs/MOTOR_POOL.md §1, and
    // all still awaiting an orchestrator ruling on whether §4 is amended or
    // the superset is blessed. Pinned here so the superset cannot grow while
    // that ruling is outstanding, and so the ruling has a list to act on.
    const CONTRACTED = [
      "VEHICLE_CLASSES", "VEHICLE_SLOTS", "TERRAIN_KEYS", "TIER_RANK", "VEHICLE_STAT_KEYS",
      "MECHANIZED_SPECIALS", "VEHICLE_QUIRK_CONDITIONS", "MOTOR_WORKS_KEYS", "SPEED_CURVE",
      "MELEE_CURVE", "CREW_MORALE_CURVE", "CREW_EXPOSURE_MORALE", "ROLL_ODDS",
      "CHASSIS_PATTERNS", "POWERPLANTS", "ARMOUR_PACKAGES", "SUSPENSIONS", "MOUNTS",
      "VEHICLE_MODS", "VEHICLE_QUIRKS",
      "tierRank", "speedFromPowerWeight", "terrainMultiplier", "totalTonnage",
      "hardpointStats", "hardpointWeapons", "breakdownChance", "rollVehicle", "deriveMechanized",
    ];
    const EXTRAS = ["MOTOR_MODEL", "evaluateVehicleQuirk"];
    const exported = [...CANON_SRC.matchAll(/^export const ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    expect(exported.sort()).toEqual([...CONTRACTED, ...EXTRAS].sort());
    for (const name of EXTRAS) expect(MIRROR[name], `${name} is not mirrored`).toBeDefined();

    // the two optional ctx parameters, and the fact that they ARE optional —
    // a contracted call shape must keep working
    for (const fn of ["hardpointStats", "deriveMechanized"]) {
      expect(CANON_SRC, `${fn} no longer takes the documented optional ctx`)
        .toContain(`export const ${fn} = (`);
    }
    const v = MIRROR.rollVehicle({ seed: 2 });
    expect(MIRROR.hardpointStats(v)).toEqual(MIRROR.hardpointStats(v, undefined));
    expect(MIRROR.deriveMechanized({ vehicle: v })).toEqual(MIRROR.deriveMechanized({ vehicle: v }, undefined));
    // and both extras are documented where §1 says they are
    for (const name of EXTRAS) expect(DOC, `§1 does not account for ${name}`).toContain(name);
  });

  it("motorPool.ts and its mirror contain no Math.random", () => {
    for (const [where, src] of [["base44/shared/motorPool.ts", CANON_SRC], ["src/lib/motorPool.js", MIRROR_SRC]]) {
      expect(/Math\.random/.test(src), `${where} names Math.random`).toBe(false);
      expect(/Date\.now/.test(src), `${where} names Date.now`).toBe(false);
      expect(/crypto\./.test(src), `${where} names crypto`).toBe(false);
    }
  });

  it("no table is computed — every mirrored export is a pure data literal", () => {
    for (const name of TABLES) {
      const decl = new RegExp(`export const ${name}\\s*=\\s*[[{]`);
      expect(decl.test(CANON_SRC), `${name} is not a bare literal in the canon`).toBe(true);
      expect(decl.test(MIRROR_SRC), `${name} is not a bare literal in the mirror`).toBe(true);
    }
  });
});
