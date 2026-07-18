// Rules-mirror invariant — the mechanical enforcement of CLAUDE.md's
// "One Critical Invariant": the authoritative rules in the backend functions
// (base44/functions/gameEngine + concurrentPlay) must stay in sync with the
// frontend mirrors in src/lib. These tests lift the backend's pure-data rule
// tables out of their Deno source (which can't be imported here) and compare
// them field-by-field against the mirrors. If either side drifts, CI fails.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";

// ── Frontend mirrors (plain ES modules — importable directly) ──
import { UNIT_TYPES } from "@/lib/units.js";
import { TECHS as MIRROR_TECHS } from "@/lib/doctrine.js";
import { PERKS } from "@/lib/pointBuy.js";
import { ARMORY_ITEMS } from "@/lib/armory.js";
import { WEATHER_META } from "@/lib/weather.js";
import { SIGNATURE_COOLDOWNS } from "@/lib/massCombat.js";
import { COMMAND_VEHICLES as MIRROR_VEHICLES, SUPREME_VEHICLE as MIRROR_SUPREME, VEHICLE_MODS as MIRROR_VEHICLE_MODS } from "@/lib/commandVehicles.js";

// ── Backend sources (read as text, tables extracted) ──
const gameEngineSrc = readRepoFile("base44/functions/gameEngine/entry.ts");
const concurrentSrc = readRepoFile("base44/functions/concurrentPlay/entry.ts");

const GE = (name) => extractConst(gameEngineSrc, name);
const CP = (name) => extractConst(concurrentSrc, name);

// pick a subset of fields from an object (mirrors carry extra display-only fields)
const pick = (obj, fields) =>
  Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]));

describe("units — gameEngine.UNITS ↔ src/lib/units.js UNIT_TYPES", () => {
  const UNITS = GE("UNITS");
  const fields = ["points", "cost", "attack", "defense", "domain", "deployAt"];

  it("has the same unit keys on both sides", () => {
    expect(Object.keys(UNITS).sort()).toEqual(Object.keys(UNIT_TYPES).sort());
  });

  for (const key of Object.keys(GE("UNITS"))) {
    it(`${key}: points/cost/attack/defense/domain/deployAt match`, () => {
      expect(pick(UNIT_TYPES[key], fields)).toEqual(pick(UNITS[key], fields));
    });
  }
});


describe("research tree — TECHS across gameEngine, concurrentPlay, and doctrine.js", () => {
  const GE_TECHS = GE("TECHS");
  const CP_TECHS = CP("TECHS");

  it("all three sources declare the same tech keys", () => {
    const keys = Object.keys(GE_TECHS).sort();
    expect(Object.keys(CP_TECHS).sort()).toEqual(keys);
    expect(Object.keys(MIRROR_TECHS).sort()).toEqual(keys);
  });

  for (const key of Object.keys(GE("TECHS"))) {
    it(`${key}: cost and prereq agree across all three`, () => {
      const { cost, prereq } = GE_TECHS[key];
      expect(CP_TECHS[key]).toMatchObject({ cost, prereq });
      expect(MIRROR_TECHS[key].cost).toBe(cost);
      expect(MIRROR_TECHS[key].prereq).toBe(prereq);
    });
  }
});

describe("point-buy perks — PERK_MODS (both backends) ↔ pointBuy.js PERKS", () => {
  const GE_PERKS = GE("PERK_MODS");
  const CP_PERKS = CP("PERK_MODS");
  const mirrorIds = PERKS.map((p) => p.id).sort();

  it("gameEngine and concurrentPlay PERK_MODS are byte-identical tables", () => {
    expect(CP_PERKS).toEqual(GE_PERKS);
  });

  it("the perk id set matches the frontend catalog", () => {
    expect(Object.keys(GE_PERKS).sort()).toEqual(mirrorIds);
  });
});


describe("state armory — concurrentPlay.ARMORY ↔ armory.js ARMORY_ITEMS", () => {
  const ARMORY = CP("ARMORY");
  const fields = ["kind", "cost"];

  it("has the same armory keys on both sides", () => {
    expect(Object.keys(ARMORY).sort()).toEqual(Object.keys(ARMORY_ITEMS).sort());
  });

  for (const key of Object.keys(CP("ARMORY"))) {
    it(`${key}: kind and cost match`, () => {
      expect(pick(ARMORY_ITEMS[key], fields)).toEqual(pick(ARMORY[key], fields));
    });
  }
});

describe("weather — gameEngine.WEATHER_TYPES ↔ weather.js WEATHER_META", () => {
  const WEATHER_TYPES = GE("WEATHER_TYPES");

  it("declares the same weather keys and labels", () => {
    expect(Object.keys(WEATHER_TYPES).sort()).toEqual(Object.keys(WEATHER_META).sort());
    for (const key of Object.keys(WEATHER_TYPES)) {
      expect(WEATHER_META[key].label).toBe(WEATHER_TYPES[key].label);
    }
  });
});

describe("signature cooldowns — gameEngine.MANEUVERS ↔ massCombat.js SIGNATURE_COOLDOWNS", () => {
  const MANEUVERS = GE("MANEUVERS");

  for (const key of Object.keys(SIGNATURE_COOLDOWNS)) {
    it(`${key}: cooldown matches the server maneuver table`, () => {
      expect(MANEUVERS[key]).toBeDefined();
      expect(MANEUVERS[key].cooldown).toBe(SIGNATURE_COOLDOWNS[key]);
    });
  }
});



describe("command vehicles — gameEngine ↔ commandVehicles.js", () => {
  const VEHICLES = GE("COMMAND_VEHICLES");
  const SUPREME = GE("SUPREME_VEHICLE");
  const VEHICLE_MODS = GE("VEHICLE_MODS");

  it("trait vehicles share keys, labels, and effect text", () => {
    expect(Object.keys(VEHICLES).sort()).toEqual(Object.keys(MIRROR_VEHICLES).sort());
    for (const key of Object.keys(VEHICLES)) {
      expect(MIRROR_VEHICLES[key].label).toBe(VEHICLES[key].label);
      expect(MIRROR_VEHICLES[key].effect).toBe(VEHICLES[key].effect);
    }
  });

  it("supreme vehicle label and effect match", () => {
    expect(MIRROR_SUPREME.label).toBe(SUPREME.label);
    expect(MIRROR_SUPREME.effect).toBe(SUPREME.effect);
  });

  it("refit-bay mods share keys, bay, trait, and cost", () => {
    expect(Object.keys(VEHICLE_MODS).sort()).toEqual(Object.keys(MIRROR_VEHICLE_MODS).sort());
    const fields = ["bay", "trait", "cost"];
    for (const key of Object.keys(VEHICLE_MODS)) {
      expect(pick(MIRROR_VEHICLE_MODS[key], fields)).toEqual(pick(VEHICLE_MODS[key], fields));
    }
  });
});
