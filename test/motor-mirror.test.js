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
} from "@/lib/arms.js";
import { IMAGE_LIBRARY, IMAGE_CATEGORIES, HOUSE_STYLE } from "@/lib/imageLibrary.js";
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
  speedFromPowerWeight,
} = MIRROR;

const CHASSIS_KEYS = Object.keys(CHASSIS_PATTERNS);
const ARMOUR_KEYS = Object.keys(ARMOUR_CLASSES);
const VEHICLE_CAPABLE = ["crawler_gun", "hmg", "flame", "mortar", "artillery", "aircraft_gun"];
const REGIMENT_KEYS = ["riflemen", "crawler", "artillery", "fighter", "gunboat"];
const words = (s) => s.trim().split(/\s+/).length;
const av = (k) => ARMOUR_CLASSES[k].armourValue;
const round4 = (n) => Math.round(n * 10000) / 10000;

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
    const declared = [...CANON_SRC.matchAll(/^export const ([A-Z][A-Z0-9_]*)\s*=\s*[[{]/gm)].map((m) => m[1]);
    expect(declared.sort()).toEqual([...TABLES].sort());
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
    expect(Object.keys(MANUFACTURERS).sort()).toEqual([...LANE_I, ...MOTOR_WORKS_KEYS].sort());
    // and the appended rows come last, in one block, so the diff is an append
    const src = readRepoFile("src/lib/arms.js");
    const first = Math.min(...MOTOR_WORKS_KEYS.map((k) => src.indexOf(`\n  ${k}: {`)));
    const lastLaneI = Math.max(...LANE_I.map((k) => src.indexOf(`\n  ${k}: {`)));
    expect(first, "an mw_* row was inserted above a Lane I row").toBeGreaterThan(lastLaneI);
    // never assert an exact manufacturer count — Lane I was barred from it so
    // that this lane's append could not turn main red, and the courtesy runs
    // both ways for whoever appends next.
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
    expect(speedFromPowerWeight(0.0001, 1000)).toBe(lo);
    expect(speedFromPowerWeight(1e6, 0.1)).toBe(hi);
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
    const WORD = {
      4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
      11: "eleven", 12: "twelve", 13: "thirteen", 16: "sixteen", 20: "twenty",
      24: "twenty-four", 34: "thirty-four",
    };
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

    const MOTOR_IDS = new Set([
      ...MOTOR_WORKS_KEYS.map((k) => `maker-${k.replace(/_/g, "-")}`),
      ...VEHICLE_CLASSES.map((c) => `vehicle-class-${c.replace(/_/g, "-")}`),
    ]);
    const mine = ENTRIES.filter((e) => MOTOR_IDS.has(e.id));
    has(`${WORD[mine.length]} entries — one per motor-works`);
    has(`${WORD[mine.filter((e) => e.status === "thin").length]} of the ${WORD[mine.length]} are \`status: 'thin'\``);
  });

  it("§14 and the appended docs/GAME_RULES.md section are the same text", () => {
    // BOUNDED AT BOTH ENDS, on both sides. Slicing to end of file would hold
    // only while this lane happened to be the last to append to GAME_RULES.md,
    // and Lane G's section already sits between Lane I's and this one.
    const TITLE = "The Motor Pool [PROPOSED — awaiting platform wiring]";
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

  it("docs/GAME_RULES.md keeps every pre-existing numbered section, unrenumbered", () => {
    const rules = readRepoFile("docs/GAME_RULES.md");
    const numbers = [...rules.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => Number(m[1]));
    // 1..24 were there before this lane; 25 is this lane's.
    for (let n = 1; n <= 24; n++) expect(numbers, `§${n} went missing`).toContain(n);
    expect(numbers).toContain(25);
    expect(new Set(numbers).size, "a section number is duplicated").toBe(numbers.length);
    expect(Math.max(...numbers)).toBe(25);
    // the new section is the LAST one in the file
    expect(rules.lastIndexOf("\n## ")).toBe(rules.lastIndexOf("\n## 25. "));
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
      expect(p.url, `${p.key} must ship url: null`).toBe(null);
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
  const MOTOR_IDS = [
    ...MOTOR_WORKS_KEYS.map((k) => `maker-${k.replace(/_/g, "-")}`),
    ...VEHICLE_CLASSES.map((c) => `vehicle-class-${c.replace(/_/g, "-")}`),
  ];

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
      ["MANUFACTURERS", "QUALITY_GRADES", "QUALITY_ORDER", "WEAPON_PATTERNS", "resolveWeapon", "rollWeapon"].sort(),
    );
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
