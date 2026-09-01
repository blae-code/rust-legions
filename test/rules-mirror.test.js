// Rules-mirror invariant — the mechanical enforcement of CLAUDE.md's
// "One Critical Invariant": the authoritative rules in the backend functions
// (base44/functions/gameEngine + concurrentPlay) must stay in sync with the
// frontend mirrors in src/lib. Some rule tables have since been de-duplicated
// into shared Deno modules under base44/shared/*.ts that those functions import
// (e.g. PERK_MODS in base44/shared/perkMods.ts) — the server-side source of
// truth is then the shared module, and this file lifts each table from
// whichever file actually declares it. These tests lift the backend's pure-data
// rule tables out of their Deno source (which can't be imported here) and
// compare them field-by-field against the mirrors. If either side drifts, CI
// fails.
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
const perkModsSrc = readRepoFile("base44/shared/perkMods.ts");

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

  it("both backends declare the same tech keys", () => {
    expect(Object.keys(CP_TECHS).sort()).toEqual(Object.keys(GE_TECHS).sort());
  });

  // NARROWED (Lane G, plan §3 Amendment 3): the frontend mirror is now grown from
  // base44/shared/catalog.ts, which the backends do not import until plan phase C3.
  // Until C3 the mirror is a strict SUPERSET of the backend tables — every legacy
  // key must still be present and field-identical (the per-key loop below), but the
  // mirror may declare keys the backends have not been given yet. Equality returns
  // at C3, when gameEngine and concurrentPlay import the catalog and retire their
  // inlined copies.
  it("the frontend mirror is a superset of the backend tech keys (equality returns at C3)", () => {
    for (const key of Object.keys(GE_TECHS)) {
      expect(MIRROR_TECHS, `mirror is missing backend tech ${key}`).toHaveProperty(key);
    }
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

// PERK_MODS was de-duplicated into base44/shared/perkMods.ts (commit b27babb):
// both backends now IMPORT it rather than inlining a copy each, so the shared
// module is the single server-side source of truth. The "are the two backends
// identical" question therefore becomes "do both backends actually consume the
// shared table, and has neither re-inlined a local copy".
describe("point-buy perks — shared/perkMods.ts PERK_MODS ↔ pointBuy.js PERKS", () => {
  const SHARED_PERKS = extractConst(perkModsSrc, "PERK_MODS");
  const mirrorIds = PERKS.map((p) => p.id).sort();

  const SHARED_IMPORT = /import\s*\{[^}]*\bcompileMods\b[^}]*\}\s*from\s*['"][^'"]*shared\/perkMods\.ts['"]/;
  const LOCAL_DECL = /\bconst\s+PERK_MODS\s*=/;

  for (const [label, src] of [["gameEngine", gameEngineSrc], ["concurrentPlay", concurrentSrc]]) {
    it(`${label} consumes the shared perk table and declares no local copy`, () => {
      expect(src).toMatch(SHARED_IMPORT);
      expect(src).not.toMatch(LOCAL_DECL);
    });
  }

  it("the perk id set matches the frontend catalog", () => {
    expect(Object.keys(SHARED_PERKS).sort()).toEqual(mirrorIds);
  });
});


describe("state armory — concurrentPlay.ARMORY ↔ armory.js ARMORY_ITEMS", () => {
  const ARMORY = CP("ARMORY");
  const fields = ["kind", "cost"];

  // NARROWED (Lane G, plan §3 Amendment 3): same reasoning as the tech tree above —
  // the mirror is grown from base44/shared/catalog.ts and is a strict superset of the
  // backend ARMORY until plan phase C3, when concurrentPlay imports the catalog.
  it("the frontend mirror is a superset of the backend armory keys (equality returns at C3)", () => {
    for (const key of Object.keys(ARMORY)) {
      expect(ARMORY_ITEMS, `mirror is missing backend armory item ${key}`).toHaveProperty(key);
    }
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



// COMMAND_VEHICLES / SUPREME_VEHICLE / VEHICLE_MODS were lifted into
// base44/shared/commandVehicles.ts (imported by gameEngine) to keep entry.ts
// under the platform line limit. The shared module is the server source of truth.
describe("command vehicles — shared/commandVehicles.ts ↔ commandVehicles.js", () => {
  const vehiclesSrc = readRepoFile("base44/shared/commandVehicles.ts");
  const VEHICLES = extractConst(vehiclesSrc, "COMMAND_VEHICLES");
  const SUPREME = extractConst(vehiclesSrc, "SUPREME_VEHICLE");
  const VEHICLE_MODS = extractConst(vehiclesSrc, "VEHICLE_MODS");

  it("gameEngine imports the shared tables rather than re-inlining them", () => {
    expect(gameEngineSrc).toMatch(/from '\.\.\/\.\.\/shared\/commandVehicles\.ts'/);
    expect(gameEngineSrc).not.toMatch(/^const COMMAND_VEHICLES\s*=/m);
    expect(gameEngineSrc).not.toMatch(/^const VEHICLE_MODS\s*=/m);
  });

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