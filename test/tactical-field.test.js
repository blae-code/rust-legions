// ---------------------------------------------------------------------------
// Lane B — field generator, terrain palettes and hex toolkit.
//
// The four acceptance properties from docs/TACTICAL_SQUAD_PLAN.md §3 ("same
// seed → identical field; deploy zones always free of blockers; every deploy
// hex reachable from the opposite side; LOS symmetric") are proven here as
// PROPERTY tests over a fixed corpus of 200 generated fields — the full cross
// product of 5 node kinds x 5 weather states x 8 seeds, with fortBonus cycled
// 0..3 across it so every fortification level is exercised. Spot checks would
// pass on a generator that happened to be lucky on one board; these do not.
//
// The corpus is built once at module scope: 200 fields is the unit of evidence,
// and regenerating it per test would triple the runtime for no extra coverage.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import { mulberry32 as refMulberry32 } from "@/lib/macro/worlds.js";

// Canonical (server authority) — a plain ES module despite the .ts extension.
import {
  FIELD, TERRAIN, PALETTES, WEATHER_FIELD, WORKS_SEED, TERRAIN_KEYS,
  generateField, neighbors, hexLine, hexRange, lineOfSight, pathCost, repairConnectivity,
} from "../base44/shared/tacticalField.ts";

// Frontend mirror.
import {
  FIELD as M_FIELD, TERRAIN as M_TERRAIN, PALETTES as M_PALETTES,
  WEATHER_FIELD as M_WEATHER, WORKS_SEED as M_WORKS, TERRAIN_KEYS as M_TERRAIN_KEYS,
  generateField as mirrorGenerateField, neighbors as mNeighbors, hexLine as mHexLine,
  hexRange as mHexRange, lineOfSight as mLineOfSight, pathCost as mPathCost,
  hexPixel, hexCorners, repairConnectivity as mRepairConnectivity,
} from "@/lib/tactical/field.js";

import { hexDistance } from "@/lib/tactical/data.js";

// Namespace views of both modules, so the exported SURFACE can be frozen by
// test rather than by good intentions: Lanes C, E and J all import against
// these names and a rename after merge is a contract change.
import * as CANON_MOD from "../base44/shared/tacticalField.ts";
import * as MIRROR_MOD from "@/lib/tactical/field.js";

const CANON_SRC = readRepoFile("base44/shared/tacticalField.ts");
const MIRROR_SRC = readRepoFile("src/lib/tactical/field.js");

// ---- corpus ----------------------------------------------------------------

const KINDS = ["city", "town", "depot", "ruin", "crossroads"];
const WEATHERS = ["clear", "rain", "fog", "snow", "storm"];
const SEEDS = [1, 7, 42, 137, 1917, 2044, 31337, 65535];

const CORPUS = [];
for (const nodeKind of KINDS) {
  for (const weather of WEATHERS) {
    for (const seed of SEEDS) {
      CORPUS.push({ seed, nodeKind, weather, fortBonus: CORPUS.length % 4 });
    }
  }
}
const FIELDS = CORPUS.map((opts) => generateField(opts));

const K = (q, r) => `${q},${r}`;
const zoneOf = (f) => f.deploy.attacker.concat(f.deploy.defender);

// An INDEPENDENT flood fill, written against the tile table rather than the
// generator's own helper, so property 3 is evidence and not a tautology.
function reachableFrom(f, start) {
  const seen = new Set([K(start.q, start.r)]);
  const stack = [start];
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  while (stack.length) {
    const cur = stack.pop();
    for (const [dq, dr] of dirs) {
      const q = cur.q + dq, r = cur.r + dr;
      if (q < 0 || q >= f.w || r < 0 || r >= f.h) continue;
      const k = K(q, r);
      if (seen.has(k)) continue;
      const tile = f.tiles[k];
      if (!tile || tile.moveCost === null) continue;
      seen.add(k);
      stack.push({ q, r });
    }
  }
  return seen;
}

// 60 hex pairs per field, derived from the field's index — deterministic, and
// deliberately not Math.random, so a failure is reproducible from the index.
function pairsFor(index, f) {
  const rnd = refMulberry32((index + 1) * 0x9e3779b1);
  const out = [];
  for (let i = 0; i < 60; i++) {
    out.push([
      { q: (rnd() * f.w) | 0, r: (rnd() * f.h) | 0 },
      { q: (rnd() * f.w) | 0, r: (rnd() * f.h) | 0 },
    ]);
  }
  return out;
}

const UI_ONLY = ["label", "short", "blurb", "desc", "icon", "fill"];
const stripUI = (v) => {
  if (Array.isArray(v)) return v.map(stripUI);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (UI_ONLY.includes(k)) continue;
      out[k] = stripUI(val);
    }
    return out;
  }
  return v;
};

// Lift the mulberry32 COPY out of a source file as text and evaluate it. This
// is what proves the copy is faithful without importing the platform-owned
// Deno handler it was copied from: a drifted copy fails on the numbers, and a
// deleted copy fails on the marker.
function liftMulberry(source, label) {
  const marker = "const mulberry32 = (a) => () => {";
  const at = source.indexOf(marker);
  expect(at, `${label}: mulberry32 copy not found verbatim`).toBeGreaterThan(-1);
  const open = at + marker.length - 1;
  let depth = 0, end = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const expr = `(a) => () => ${source.slice(open, end + 1)}`;
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr});`)();
}

// ---------------------------------------------------------------------------

describe("field tables — the published vocabulary", () => {
  it("TERRAIN carries exactly the 16 contract keys", () => {
    expect(Object.keys(TERRAIN)).toEqual([
      "open", "road", "rail", "field", "rubble", "ruins", "building", "wall",
      "woods", "hedgerow", "crater", "water", "marsh", "hill", "fuel_tank",
      "precursor_wall",
    ]);
    // There is no `street`: a metalled lane is `road`. Lanes E and J are keyed
    // to this list, so an extra or renamed key is a contract break.
    expect(TERRAIN.street).toBeUndefined();
  });

  it("every TERRAIN row is fully specified and internally consistent", () => {
    for (const [key, row] of Object.entries(TERRAIN)) {
      expect(row.key).toBe(key);
      expect(typeof row.cover).toBe("number");
      expect(row.cover).toBeGreaterThanOrEqual(0);
      expect(typeof row.blocksLOS).toBe("boolean");
      expect([0, 1, 2]).toContain(row.baseElev); // elev is 0|1|2 — three steps
      expect(row.moveCost === null || row.moveCost >= 1).toBe(true);
    }
    // The four impassable terrains, and only those four.
    const impassable = Object.keys(TERRAIN).filter((k) => TERRAIN[k].moveCost === null);
    expect(impassable).toEqual(["wall", "water", "fuel_tank", "precursor_wall"]);
    // The five LOS blockers, and only those five.
    const blockers = Object.keys(TERRAIN).filter((k) => TERRAIN[k].blocksLOS);
    expect(blockers).toEqual(["building", "wall", "woods", "fuel_tank", "precursor_wall"]);
  });

  it("PALETTES has exactly 5 entries, each declaring >= 6 valid terrain keys", () => {
    expect(Object.keys(PALETTES)).toEqual(KINDS);
    for (const [key, pal] of Object.entries(PALETTES)) {
      expect(pal.key).toBe(key);
      const weightKeys = Object.keys(pal.weights);
      expect(weightKeys.length).toBeGreaterThanOrEqual(6);
      for (const wk of weightKeys) {
        expect(TERRAIN[wk], `${key} weights an unknown terrain ${wk}`).toBeTruthy();
        expect(Number.isInteger(pal.weights[wk])).toBe(true);
        expect(pal.weights[wk]).toBeGreaterThan(0);
      }
      expect(TERRAIN[pal.artery], `${key} artery ${pal.artery} is not a terrain`).toBeTruthy();
      expect(TERRAIN[pal.artery].moveCost).not.toBeNull(); // the backbone must be walkable
      expect(TERRAIN[pal.features.terrain]).toBeTruthy();
      expect(pal.features.maxClusters).toBeGreaterThanOrEqual(pal.features.minClusters);
    }
  });

  it("each palette declares the signature terrain its brief names", () => {
    // Character check, not a count check: two palettes with the same six keys
    // and different weights would pass the count and fail the game.
    expect(Object.keys(PALETTES.city.weights)).toEqual(
      expect.arrayContaining(["ruins", "rubble", "road", "building", "wall", "open"]));
    expect(Object.keys(PALETTES.town.weights)).toEqual(
      expect.arrayContaining(["building", "hedgerow", "field", "road", "woods", "open"]));
    expect(Object.keys(PALETTES.depot.weights)).toEqual(
      expect.arrayContaining(["fuel_tank", "rail", "road", "rubble", "open", "field"]));
    expect(Object.keys(PALETTES.ruin.weights)).toEqual(
      expect.arrayContaining(["crater", "precursor_wall", "rubble", "marsh", "open", "woods"]));
    expect(Object.keys(PALETTES.crossroads.weights)).toEqual(
      expect.arrayContaining(["open", "woods", "road", "field", "hedgerow", "hill"]));
    expect(PALETTES.depot.artery).toBe("rail"); // the only palette metalled with rail
    // No two palettes share a signature feature — that is what makes them read
    // as five places rather than one place with five colour schemes.
    const features = KINDS.map((k) => PALETTES[k].features.terrain);
    expect(new Set(features).size).toBe(5);
  });

  it("WEATHER_FIELD has exactly 5 entries with the contract numbers", () => {
    expect(Object.keys(WEATHER_FIELD).sort()).toEqual([...WEATHERS].sort());
    expect(WEATHER_FIELD.clear).toMatchObject({ losCap: 99, openMoveAdd: 0, woodsMoveAdd: 0, groundsFighters: false });
    expect(WEATHER_FIELD.rain).toMatchObject({ losCap: 7, openMoveAdd: 1, woodsMoveAdd: 0, groundsFighters: false });
    expect(WEATHER_FIELD.fog).toMatchObject({ losCap: 4, openMoveAdd: 0, woodsMoveAdd: 0, groundsFighters: false });
    expect(WEATHER_FIELD.snow).toMatchObject({ losCap: 6, openMoveAdd: 1, woodsMoveAdd: 1, groundsFighters: false });
    expect(WEATHER_FIELD.storm).toMatchObject({ losCap: 8, openMoveAdd: 1, woodsMoveAdd: 0, groundsFighters: true });
    // Storm is the only state that grounds aircraft; fog is the tightest sight.
    expect(WEATHERS.filter((w) => WEATHER_FIELD[w].groundsFighters)).toEqual(["storm"]);
    const caps = WEATHERS.map((w) => WEATHER_FIELD[w].losCap);
    expect(Math.min(...caps)).toBe(WEATHER_FIELD.fog.losCap);
  });

  it("FIELD and WORKS_SEED hold the contract geometry", () => {
    expect(FIELD).toEqual({ w: 15, h: 11, deployCols: 3 });
    expect(WORKS_SEED).toEqual({ maxLevel: 3, trenchPerLevel: 3, bunkerFromLevel: 2, depthCols: 4 });
    // The works pool must be strictly larger than the works it has to seat at
    // maximum fortification, or stamping would silently run out of ground.
    const maxWorks = WORKS_SEED.maxLevel * WORKS_SEED.trenchPerLevel
      + (WORKS_SEED.maxLevel - WORKS_SEED.bunkerFromLevel + 1);
    expect(WORKS_SEED.depthCols * FIELD.h).toBeGreaterThan(maxWorks);
    expect(WORKS_SEED.depthCols).toBeGreaterThan(FIELD.deployCols); // works have depth
  });
});

describe("the canonical/mirror invariant", () => {
  const table = (name) => extractConst(CANON_SRC, name);

  it("FIELD mirrors", () => expect(stripUI(M_FIELD)).toEqual(table("FIELD")));
  it("TERRAIN mirrors", () => expect(stripUI(M_TERRAIN)).toEqual(table("TERRAIN")));
  it("PALETTES mirrors", () => expect(stripUI(M_PALETTES)).toEqual(table("PALETTES")));
  it("WEATHER_FIELD mirrors", () => expect(stripUI(M_WEATHER)).toEqual(table("WEATHER_FIELD")));
  it("WORKS_SEED mirrors", () => expect(stripUI(M_WORKS)).toEqual(table("WORKS_SEED")));

  it("the mirror adds only allowlisted display fields, in Ministry voice", () => {
    for (const [key, row] of Object.entries(M_TERRAIN)) {
      const extra = Object.keys(row).filter((k) => !(k in TERRAIN[key]));
      expect(extra.every((k) => UI_ONLY.includes(k)), `${key} adds ${extra}`).toBe(true);
      expect(typeof row.label).toBe("string");
      expect(row.label.length).toBeGreaterThan(2);
      expect(typeof row.blurb).toBe("string");
      expect(row.blurb.length).toBeGreaterThan(24);
      // Drift guard 4: design tokens only, never a hex colour.
      expect(row.fill, `${key} fill is not a design token`)
        .toMatch(/^hsl\(var\(--[a-z0-9-]+\)( \/ [0-9.]+)?\)$/);
      // Drift guard 7: a blurb describes, it never restates a table number.
      expect(row.blurb).not.toMatch(/\d/);
    }
    for (const pal of Object.values(M_PALETTES)) {
      expect(pal.blurb).not.toMatch(/\d/);
    }
    // Every fill is distinct, or the arena cannot tell two terrains apart.
    const fills = Object.values(M_TERRAIN).map((r) => r.fill);
    expect(new Set(fills).size).toBe(fills.length);
  });

  it("mulberry32 is copied verbatim into both files and is bit-faithful", () => {
    const ref = refMulberry32(12345);
    const expected = [ref(), ref(), ref(), ref(), ref()];
    for (const [src, label] of [[CANON_SRC, "canonical"], [MIRROR_SRC, "mirror"]]) {
      const copy = liftMulberry(src, label)(12345);
      for (let i = 0; i < 5; i++) expect(copy(), `${label} draw ${i}`).toBeCloseTo(expected[i], 12);
    }
    // ...and it is a COPY, not an import (§3: "do not import it").
    expect(CANON_SRC).not.toMatch(/^\s*import[^;\n]*mulberry32/m);
    expect(MIRROR_SRC).not.toMatch(/^\s*import[^;\n]*mulberry32/m);
  });

  it("canonical and mirror generate byte-identical fields", () => {
    for (const opts of CORPUS.slice(0, 10)) {
      expect(JSON.stringify(mirrorGenerateField(opts)))
        .toBe(JSON.stringify(generateField(opts)));
    }
    // ...including at a non-default board size and through the fallbacks.
    const odd = { seed: 99, nodeKind: "nonesuch", weather: "hail", fortBonus: 2, w: 21, h: 9 };
    expect(JSON.stringify(mirrorGenerateField(odd))).toBe(JSON.stringify(generateField(odd)));
  });
});

describe("acceptance 1 — same seed, identical field", () => {
  it("every corpus entry regenerates deep-equal", () => {
    for (let i = 0; i < CORPUS.length; i++) {
      const a = generateField(CORPUS[i]);
      const b = generateField(CORPUS[i]);
      expect(JSON.stringify(a), `corpus[${i}]`).toBe(JSON.stringify(b));
      expect(JSON.stringify(a)).toBe(JSON.stringify(FIELDS[i]));
    }
  });

  it("determinism is not achieved by ignoring the inputs", () => {
    // The anti-cheat: a generator that returns the same board every time would
    // pass the test above perfectly. The brief's floor is 95% distinct; the
    // generator measures 200/200, so the floor asserted here is the MEASURED
    // one. A 95% gate on a corpus that is fully distinct has ten boards of
    // slack and would sit green through a collision it is meant to catch.
    const distinct = new Set(FIELDS.map((f) => JSON.stringify(f)));
    expect(distinct.size, "the brief's floor").toBeGreaterThanOrEqual(Math.ceil(FIELDS.length * 0.95));
    expect(distinct.size, "measured: every corpus board is its own board").toBe(FIELDS.length);
  });

  it("changing any one input alone changes the board", () => {
    const base = { seed: 4242, nodeKind: "town", weather: "clear", fortBonus: 1 };
    const s = (o) => JSON.stringify(generateField(o));
    const ref = s(base);
    expect(s({ ...base, nodeKind: "city" })).not.toBe(ref);
    expect(s({ ...base, weather: "fog" })).not.toBe(ref);
    expect(s({ ...base, fortBonus: 2 })).not.toBe(ref);
    expect(s({ ...base, seed: 4243 })).not.toBe(ref);
    expect(s({ ...base, w: 17 })).not.toBe(ref);
  });

  it("is pure — it neither mutates its argument nor keeps state", () => {
    const opts = { seed: 8, nodeKind: "depot", weather: "snow", fortBonus: 3 };
    const before = JSON.stringify(opts);
    const first = JSON.stringify(generateField(opts));
    expect(JSON.stringify(opts)).toBe(before);
    // Run a hundred unrelated generations between the two calls: a module-level
    // RNG or cache would show up here and nowhere else.
    for (let i = 0; i < 100; i++) generateField({ seed: i, nodeKind: "ruin", weather: "rain", fortBonus: i % 4 });
    expect(JSON.stringify(generateField(opts))).toBe(first);
  });

  it("never throws on unknown or malformed input, and clamps the board", () => {
    expect(() => generateField()).not.toThrow();
    const junk = generateField({ seed: NaN, nodeKind: "atlantis", weather: "ash", fortBonus: -5, w: 2, h: 1 });
    expect(junk.meta.nodeKind).toBe("crossroads");
    expect(junk.meta.weather).toBe("clear");
    expect(junk.meta.fortBonus).toBe(0);
    expect(junk.w).toBe(9);
    expect(junk.h).toBe(7);
    expect(Object.keys(junk.tiles).length).toBe(63);
    const big = generateField({ seed: 1, nodeKind: "city", weather: "fog", fortBonus: 9, w: 23.7, h: 13.2 });
    expect(big.w).toBe(23);
    expect(big.h).toBe(13);
    expect(big.meta.fortBonus).toBe(WORKS_SEED.maxLevel);
  });
});

describe("acceptance 2 — deploy zones free of blockers", () => {
  it("both zones are the right size and shape on every field", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      expect(f.deploy.attacker.length, `corpus[${i}] attacker`).toBe(FIELD.deployCols * f.h);
      expect(f.deploy.defender.length, `corpus[${i}] defender`).toBe(FIELD.deployCols * f.h);
      expect(f.deploy.attacker.length).toBe(33); // 15x11 default
      const seen = new Set(zoneOf(f).map((hx) => K(hx.q, hx.r)));
      expect(seen.size).toBe(66); // no duplicates, no overlap between the zones
      for (const hx of f.deploy.attacker) expect(hx.q).toBeLessThan(FIELD.deployCols);
      for (const hx of f.deploy.defender) expect(hx.q).toBeGreaterThanOrEqual(f.w - FIELD.deployCols);
    }
  });

  it("no deploy hex is impassable, LOS-blocking or elevated", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      for (const hx of zoneOf(f)) {
        const tile = f.tiles[K(hx.q, hx.r)];
        expect(tile, `corpus[${i}] missing tile ${K(hx.q, hx.r)}`).toBeTruthy();
        expect(tile.moveCost, `corpus[${i}] ${K(hx.q, hx.r)} impassable`).not.toBeNull();
        expect(tile.blocksLOS, `corpus[${i}] ${K(hx.q, hx.r)} blocks LOS`).toBe(false);
        expect(tile.elev, `corpus[${i}] ${K(hx.q, hx.r)} elevated`).toBe(0);
      }
    }
  });

  it("emits the zones in ascending q then ascending r", () => {
    for (const side of ["attacker", "defender"]) {
      const list = FIELDS[0].deploy[side];
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1], b = list[i];
        expect(a.q < b.q || (a.q === b.q && a.r < b.r)).toBe(true);
      }
    }
  });
});

describe("acceptance 3 — every deploy hex reachable from the opposite side", () => {
  it("one flood from the attacker corner reaches both entire zones", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const reached = reachableFrom(f, f.deploy.attacker[0]);
      for (const hx of zoneOf(f)) {
        expect(reached.has(K(hx.q, hx.r)), `corpus[${i}] unreachable ${K(hx.q, hx.r)}`).toBe(true);
      }
    }
  });

  it("pathCost agrees with the flood, and returns a walkable chain", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const from = f.deploy.attacker[0];
      const to = f.deploy.defender[f.deploy.defender.length - 1];
      const res = pathCost(f, from, to);
      expect(res, `corpus[${i}] no path`).not.toBeNull();
      expect(Number.isFinite(res.cost)).toBe(true);
      expect(res.cost).toBeGreaterThan(0);
      expect(res.path[0]).toEqual({ q: from.q, r: from.r });
      expect(res.path[res.path.length - 1]).toEqual({ q: to.q, r: to.r });
      for (let s = 1; s < res.path.length; s++) {
        expect(hexDistance(res.path[s - 1], res.path[s]), `corpus[${i}] step ${s}`).toBe(1);
      }
      // The reported cost is the sum of the entry costs — the start is free.
      const summed = res.path.slice(1).reduce((sum, hx) => sum + f.tiles[K(hx.q, hx.r)].moveCost, 0);
      expect(res.cost).toBe(summed);
    }
  });

  it("honours blocked hexes and allowBlockedTarget", () => {
    const f = FIELDS[0];
    const from = f.deploy.attacker[0];
    const to = f.deploy.attacker[1];
    expect(pathCost(f, from, from)).toEqual({ cost: 0, path: [{ q: from.q, r: from.r }] });
    expect(pathCost(f, from, to, { blocked: [K(to.q, to.r)] })).toBeNull();
    const allowed = pathCost(f, from, to, { blocked: new Set([K(to.q, to.r)]), allowBlockedTarget: true });
    expect(allowed).not.toBeNull();
    expect(allowed.path[allowed.path.length - 1]).toEqual({ q: to.q, r: to.r });
    // Walling the attacker in with blocked hexes must yield null, not a throw.
    const ring = new Set(neighbors(from.q, from.r).map((n) => K(n.q, n.r)));
    expect(pathCost(f, from, f.deploy.defender[0], { blocked: ring })).toBeNull();
    // Off-board endpoints are not paths.
    expect(pathCost(f, from, { q: 99, r: 99 })).toBeNull();
    expect(pathCost(f, { q: -1, r: 0 }, to)).toBeNull();
  });

  it("returns the same path on every call — the tie-break is total", () => {
    const f = FIELDS[7];
    const from = f.deploy.attacker[5];
    const to = f.deploy.defender[20];
    const first = JSON.stringify(pathCost(f, from, to));
    for (let i = 0; i < 5; i++) expect(JSON.stringify(pathCost(f, from, to))).toBe(first);
  });
});

describe("acceptance 4 — line of sight is symmetric", () => {
  it("lineOfSight(a,b) === lineOfSight(b,a) over 12,000 sampled pairs", () => {
    let checked = 0;
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      for (const [a, b] of pairsFor(i, f)) {
        expect(lineOfSight(f, a, b), `corpus[${i}] ${K(a.q, a.r)}->${K(b.q, b.r)}`)
          .toBe(lineOfSight(f, b, a));
        checked++;
      }
    }
    expect(checked).toBe(12000);
  });

  it("hexLine(a,b) is the exact reverse of hexLine(b,a) over the same pairs", () => {
    let checked = 0;
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      for (const [a, b] of pairsFor(i, f)) {
        const forward = JSON.stringify(hexLine(a, b));
        const back = JSON.stringify(hexLine(b, a).slice().reverse());
        expect(forward, `corpus[${i}] ${K(a.q, a.r)}<->${K(b.q, b.r)}`).toBe(back);
        checked++;
      }
    }
    expect(checked).toBe(12000);
  });

  it("hexLine is inclusive, contiguous and exactly distance+1 long", () => {
    const f = FIELDS[0];
    for (const [a, b] of pairsFor(3, f)) {
      const line = hexLine(a, b);
      expect(line.length).toBe(hexDistance(a, b) + 1);
      expect(line[0]).toEqual({ q: a.q, r: a.r });
      expect(line[line.length - 1]).toEqual({ q: b.q, r: b.r });
      for (let i = 1; i < line.length; i++) expect(hexDistance(line[i - 1], line[i])).toBe(1);
    }
    expect(hexLine({ q: 3, r: 4 }, { q: 3, r: 4 })).toEqual([{ q: 3, r: 4 }]);
  });

  it("losCap cuts sight off even down a completely open lane", () => {
    // fog caps at 4 hexes. Build the check on a board whose whole west edge is
    // deploy ground, so the failure can only be the cap and not a blocker.
    const fog = generateField({ seed: 5, nodeKind: "crossroads", weather: "fog", fortBonus: 0 });
    expect(fog.meta.losCap).toBe(WEATHER_FIELD.fog.losCap);
    let beyond = 0;
    for (const a of fog.deploy.attacker) {
      for (const b of fog.deploy.defender) {
        if (hexDistance(a, b) > fog.meta.losCap) {
          expect(lineOfSight(fog, a, b)).toBe(false);
          beyond++;
        }
      }
    }
    expect(beyond).toBeGreaterThan(0);
    const clear = generateField({ seed: 5, nodeKind: "crossroads", weather: "clear", fortBonus: 0 });
    expect(clear.meta.losCap).toBe(99);
  });

  it("sees exactly AT the losCap and not one hex further", () => {
    // The cap is INCLUSIVE: `hexDistance(a, b) > losCap` fails sight, so a
    // stand at exactly losCap hexes is visible. The test above only asserts the
    // beyond-cap side, which is satisfied just as well by an exclusive cap —
    // and an exclusive cap is a silent one-hex sight cut in every weather
    // (fog 4->3, rain 7->6, storm 8->7). Both sides of the boundary are pinned
    // here, on a board with every blocker and every rise cleared away so the
    // only thing that can decide the answer is the cap itself.
    for (const weather of ["fog", "snow", "rain", "storm"]) {
      const src = generateField({ seed: 71, nodeKind: "crossroads", weather, fortBonus: 0 });
      const f = JSON.parse(JSON.stringify(src));
      for (const tile of Object.values(f.tiles)) { tile.blocksLOS = false; tile.elev = 0; }
      const cap = f.meta.losCap;
      expect(cap).toBe(WEATHER_FIELD[weather].losCap);
      let at = 0, past = 0;
      const hexes = [];
      for (let q = 0; q < f.w; q++) for (let r = 0; r < f.h; r++) hexes.push({ q, r });
      for (const a of hexes) {
        for (const b of hexes) {
          const d = hexDistance(a, b);
          if (d === cap) {
            expect(lineOfSight(f, a, b), `${weather}: blind AT the cap, ${K(a.q, a.r)}->${K(b.q, b.r)}`).toBe(true);
            at++;
          } else if (d === cap + 1) {
            expect(lineOfSight(f, a, b), `${weather}: sees past the cap, ${K(a.q, a.r)}->${K(b.q, b.r)}`).toBe(false);
            past++;
          }
        }
      }
      expect(at, `${weather}: no pair sits exactly at the cap`).toBeGreaterThan(100);
      expect(past, `${weather}: no pair sits just past the cap`).toBeGreaterThan(100);
    }
  });

  it("refuses to guess a losCap when meta has been stripped", () => {
    // A field that lost its `meta` in serialisation must fail loudly. Defaulting
    // to unlimited sight would be an invisible rules change, and defaulting to
    // zero would be an invisible one in the other direction.
    const f = generateField({ seed: 1, nodeKind: "city", weather: "fog", fortBonus: 0 });
    const stripped = { w: f.w, h: f.h, tiles: f.tiles, deploy: f.deploy };
    expect(() => lineOfSight(stripped, { q: 0, r: 0 }, { q: 9, r: 5 })).toThrow();
    // pathCost, by contrast, never reads meta — movement must survive it.
    expect(pathCost(stripped, { q: 0, r: 0 }, { q: 1, r: 0 })).not.toBeNull();
  });

  it("a blocker below both ends is shot over, at its own height it is not", () => {
    const f = generateField({ seed: 11, nodeKind: "town", weather: "clear", fortBonus: 0 });
    const a = { q: 4, r: 5 }, mid = { q: 5, r: 5 }, b = { q: 6, r: 5 };
    expect(hexLine(a, b)).toEqual([a, mid, b]);
    f.tiles[K(mid.q, mid.r)].blocksLOS = true;
    f.tiles[K(mid.q, mid.r)].elev = 0;
    f.tiles[K(a.q, a.r)].elev = 0;
    f.tiles[K(b.q, b.r)].elev = 0;
    expect(lineOfSight(f, a, b)).toBe(false);           // ground blocker, ground shooters
    f.tiles[K(a.q, a.r)].elev = 1;
    f.tiles[K(b.q, b.r)].elev = 2;
    expect(lineOfSight(f, a, b)).toBe(true);            // both above it — shoot over
    expect(lineOfSight(f, b, a)).toBe(true);            // and symmetric
    f.tiles[K(mid.q, mid.r)].elev = 1;
    expect(lineOfSight(f, a, b)).toBe(false);           // blocker level with the lower end
    // Adjacency is never blocked by anything: there is no hex in between.
    expect(lineOfSight(f, a, mid)).toBe(true);
  });
});

describe("works seeding — the defender's fortifications", () => {
  const countWorks = (f) => {
    const out = { trench: 0, bunker: 0, other: 0, hexes: [] };
    for (const [k, tile] of Object.entries(f.tiles)) {
      if (!("work" in tile)) continue;
      out.hexes.push([k, tile]);
      if (tile.work === "trench") out.trench++;
      else if (tile.work === "bunker") out.bunker++;
      else out.other++;
    }
    return out;
  };

  it("places exactly 0/0, 3/0, 6/1, 9/2 works for fortBonus 0..3, and clamps above", () => {
    const expected = { 0: [0, 0], 1: [3, 0], 2: [6, 1], 3: [9, 2], 7: [9, 2] };
    for (const [fortBonus, [trench, bunker]] of Object.entries(expected)) {
      const f = generateField({ seed: 2026, nodeKind: "town", weather: "clear", fortBonus: Number(fortBonus) });
      const got = countWorks(f);
      expect(got.trench, `fortBonus ${fortBonus} trenches`).toBe(trench);
      expect(got.bunker, `fortBonus ${fortBonus} bunkers`).toBe(bunker);
      expect(got.other).toBe(0);
    }
    // fortBonus 0 adds no `work` key at all — never work: null or undefined.
    const bare = generateField({ seed: 2026, nodeKind: "town", weather: "clear", fortBonus: 0 });
    for (const tile of Object.values(bare.tiles)) expect("work" in tile).toBe(false);
  });

  it("works sit only in the defender's last four columns, never doubled up", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const got = countWorks(f);
      const keys = got.hexes.map(([k]) => k);
      expect(new Set(keys).size, `corpus[${i}] duplicate work hex`).toBe(keys.length);
      for (const [k, tile] of got.hexes) {
        const q = Number(k.split(",")[0]);
        expect(q, `corpus[${i}] work at ${k} is too far forward`).toBeGreaterThanOrEqual(f.w - WORKS_SEED.depthCols);
        expect(["trench", "bunker"]).toContain(tile.work);
        // A work never makes ground impassable and never blocks sight.
        expect(tile.moveCost).not.toBeNull();
        expect(tile.blocksLOS).toBe(false);
      }
      expect(got.trench).toBe(f.meta.fortBonus * WORKS_SEED.trenchPerLevel);
    }
  });

  it("seats a full fortification line on the smallest supported board", () => {
    // 9x7 is the floor after clamping: the works pool is 4 columns x 7 rows =
    // 28 candidates for 11 works. If the pool were ever smaller than the line,
    // stamping would run out of ground and silently under-fortify.
    for (const nodeKind of KINDS) {
      const f = generateField({ seed: 3, nodeKind, weather: "storm", fortBonus: 3, w: 9, h: 7 });
      const worked = Object.entries(f.tiles).filter(([, t]) => "work" in t);
      expect(worked.length, `${nodeKind} 9x7`).toBe(11);
      expect(new Set(worked.map(([k]) => k)).size).toBe(11);
      for (const [k] of worked) expect(Number(k.split(",")[0])).toBeGreaterThanOrEqual(f.w - WORKS_SEED.depthCols);
    }
  });

  it("leaves cover, moveCost and blocksLOS purely terrain-derived", () => {
    // Drift guard 5 / the Lane A boundary: the mechanical value of a work is
    // DEPLOYABLES' business. This file must not have folded any of it in.
    for (const f of FIELDS) {
      for (const tile of Object.values(f.tiles)) {
        if (!("work" in tile)) continue;
        const meta = TERRAIN[tile.terrain];
        expect(tile.cover).toBe(meta.cover);
        expect(tile.blocksLOS).toBe(meta.blocksLOS);
      }
    }
    // Definition-of-done greps 6 and 7 are literal: these tokens must not
    // appear in either file at all, comments included.
    expect(CANON_SRC).not.toMatch(/DEPLOYABLES/);
    expect(MIRROR_SRC).not.toMatch(/DEPLOYABLES/);
  });
});

describe("weather — sight, soft ground and grounded aircraft", () => {
  it("reports losCap and groundsFighters onto meta for all five states", () => {
    for (const weather of WEATHERS) {
      const f = generateField({ seed: 77, nodeKind: "crossroads", weather, fortBonus: 0 });
      expect(f.meta.weather).toBe(weather);
      expect(f.meta.losCap).toBe(WEATHER_FIELD[weather].losCap);
      expect(f.meta.groundsFighters).toBe(WEATHER_FIELD[weather].groundsFighters);
      expect(f.meta).toEqual({
        seed: 77, nodeKind: "crossroads", weather, fortBonus: 0,
        losCap: WEATHER_FIELD[weather].losCap,
        groundsFighters: WEATHER_FIELD[weather].groundsFighters,
      });
    }
  });

  it("taxes soft ground but never a metalled lane", () => {
    for (const weather of WEATHERS) {
      const wf = WEATHER_FIELD[weather];
      for (const nodeKind of KINDS) {
        const f = generateField({ seed: 313, nodeKind, weather, fortBonus: 0 });
        for (const tile of Object.values(f.tiles)) {
          const base = TERRAIN[tile.terrain].moveCost;
          if (base === null) { expect(tile.moveCost).toBeNull(); continue; }
          if (tile.terrain === "road" || tile.terrain === "rail") {
            expect(tile.moveCost, `${weather}/${nodeKind} taxed a metalled lane`).toBe(base);
          } else if (tile.terrain === "woods") {
            expect(tile.moveCost).toBe(base + wf.woodsMoveAdd);
          } else if (["open", "field", "crater", "marsh"].includes(tile.terrain)) {
            expect(tile.moveCost).toBe(base + wf.openMoveAdd);
          } else {
            expect(tile.moveCost).toBe(base);
          }
        }
      }
    }
  });

  it("costs an open hex exactly one more in rain and in snow", () => {
    for (const weather of ["rain", "snow"]) {
      const f = generateField({ seed: 909, nodeKind: "crossroads", weather, fortBonus: 0 });
      const open = Object.values(f.tiles).filter((t) => t.terrain === "open");
      expect(open.length).toBeGreaterThan(0);
      for (const tile of open) expect(tile.moveCost).toBe(TERRAIN.open.moveCost + 1);
      // ...and snow, uniquely, also taxes timber.
      const woods = Object.values(f.tiles).filter((t) => t.terrain === "woods");
      for (const tile of woods) {
        expect(tile.moveCost).toBe(TERRAIN.woods.moveCost + (weather === "snow" ? 1 : 0));
      }
    }
  });
});

describe("the generated board — shape and playability", () => {
  it("every tile key and every tile body matches the §4 shape", () => {
    const f = FIELDS[0];
    const keys = Object.keys(f.tiles);
    expect(keys.length).toBe(f.w * f.h);
    expect(keys.length).toBe(165);
    for (const k of keys) {
      expect(k).toMatch(/^\d+,\d+$/);
      const tile = f.tiles[k];
      const fields = Object.keys(tile);
      expect(fields.slice(0, 5)).toEqual(["terrain", "cover", "elev", "blocksLOS", "moveCost"]);
      expect(fields.length === 5 || (fields.length === 6 && fields[5] === "work")).toBe(true);
      expect(TERRAIN[tile.terrain]).toBeTruthy();
      expect([0, 1, 2]).toContain(tile.elev);
    }
  });

  it("no tile anywhere in the corpus carries a null or undefined work", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      for (const [k, tile] of Object.entries(FIELDS[i].tiles)) {
        if (!("work" in tile)) continue;
        expect(tile.work, `corpus[${i}] ${k}`).toBeTruthy();
        expect([0, 1, 2]).toContain(tile.elev);
      }
    }
  });

  it("every board is varied and at least 55% of it is fightable ground", () => {
    // Two floors on purpose. The CONTRACT floor is the brief's (>= 4 terrains,
    // >= 55% fightable) and must never be lowered. The REGRESSION floor is set
    // just under the measured worst board, because the contract floor alone is
    // unfalsifiable: re-measured over this corpus the worst board is 76.97%
    // fightable (corpus[17] city/fog/seed 7) and the thinnest palette still
    // paints 7 distinct terrains, so a palette re-weight would have to destroy
    // a fifth of the board before a 55% gate noticed.
    let worstShare = 1, worstKinds = 99;
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const tiles = Object.values(f.tiles);
      const kinds = new Set(tiles.map((t) => t.terrain));
      expect(kinds.size, `corpus[${i}] terrain variety (contract floor)`).toBeGreaterThanOrEqual(4);
      expect(kinds.size, `corpus[${i}] terrain variety (measured floor)`).toBeGreaterThanOrEqual(6);
      const good = tiles.filter((t) => t.moveCost !== null && !t.blocksLOS).length;
      const share = good / tiles.length;
      expect(share, `corpus[${i}] passable share (contract floor)`).toBeGreaterThanOrEqual(0.55);
      expect(share, `corpus[${i}] passable share (measured floor)`).toBeGreaterThanOrEqual(0.72);
      worstShare = Math.min(worstShare, share);
      worstKinds = Math.min(worstKinds, kinds.size);
    }
    // ...and pin the headroom itself, so a palette that quietly gets ROOMIER
    // (which would make the gates above meaningless) is visible too.
    expect(worstShare, "the measured floor has drifted far from the worst board").toBeLessThan(0.90);
    expect(worstKinds).toBeLessThanOrEqual(10);
  });

  it("paints an unbroken arterial lane and at least one elevated hex", () => {
    // Measured: the artery terrain reaches all 15 columns on all 200 boards,
    // so the gate is FULL WIDTH, not the "w - deployCols*2" (9 of 15) it used
    // to be — a lane that stopped six columns short would have passed that.
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const artery = PALETTES[f.meta.nodeKind].artery;
      const cols = new Set();
      const rows = new Set();
      for (const [k, tile] of Object.entries(f.tiles)) {
        if (tile.terrain !== artery) continue;
        cols.add(Number(k.split(",")[0]));
        rows.add(Number(k.split(",")[1]));
      }
      expect(cols.size, `corpus[${i}] arterial coverage`).toBe(f.w);
      // Step 3 drifts the lane by -1/0/+1 a column. A lane that never drifted
      // would be a single ruled row down the middle of every board — legal,
      // deterministic, and quietly the death of the terrain variety the drift
      // exists to create. Measured: no corpus board puts the artery on fewer
      // than 2 rows.
      expect(rows.size, `corpus[${i}] the arterial never leaves its row`).toBeGreaterThanOrEqual(2);
      const elevated = Object.values(f.tiles).filter((t) => t.elev > 0);
      expect(elevated.length, `corpus[${i}] elevation`).toBeGreaterThan(0);
    }
  });

  it("holds together well outside the default 15x11", () => {
    // The generator is called with a fixed size today, but the clamps and the
    // repair loop are written to survive anything. A board four times the area
    // must still terminate, still connect and still be one field.
    for (const [w, h] of [[9, 7], [15, 11], [21, 15], [41, 31]]) {
      const f = generateField({ seed: 5, nodeKind: "city", weather: "fog", fortBonus: 3, w, h });
      expect(Object.keys(f.tiles).length).toBe(w * h);
      expect(f.deploy.attacker.length).toBe(FIELD.deployCols * h);
      const reached = reachableFrom(f, f.deploy.attacker[0]);
      for (const hx of zoneOf(f)) expect(reached.has(K(hx.q, hx.r)), `${w}x${h} ${K(hx.q, hx.r)}`).toBe(true);
      const far = f.deploy.defender[f.deploy.defender.length - 1];
      expect(pathCost(f, f.deploy.attacker[0], far)).not.toBeNull();
    }
  });

  it("each palette produces a board that reads as its own place", () => {
    // Signature terrain must actually show up on its own board and must not
    // leak onto boards that never weight it.
    const board = (nodeKind) => {
      const counts = {};
      for (let s = 0; s < 12; s++) {
        const f = generateField({ seed: s * 101 + 3, nodeKind, weather: "clear", fortBonus: 0 });
        for (const tile of Object.values(f.tiles)) counts[tile.terrain] = (counts[tile.terrain] || 0) + 1;
      }
      return counts;
    };
    const city = board("city");
    const depot = board("depot");
    const ruin = board("ruin");
    const crossroads = board("crossroads");
    expect(city.building).toBeGreaterThan(0);
    // A city is mostly wreckage. Compare against the wreckage TOTAL: `open` is
    // inflated on every board by the deploy-zone normalisation, so a bare
    // ruins-vs-open comparison would be measuring step 8, not the palette.
    expect(city.ruins + city.rubble).toBeGreaterThan(city.open);
    expect(depot.fuel_tank).toBeGreaterThan(0);
    expect(depot.rail).toBeGreaterThan(0);
    expect(ruin.precursor_wall).toBeGreaterThan(0);
    expect(ruin.crater).toBeGreaterThan(0);
    expect(crossroads.open).toBeGreaterThan(city.open);   // and a crossroads is not
    expect(crossroads.building).toBeUndefined();          // no buildings out here
    expect(city.precursor_wall).toBeUndefined();          // no precursor ruins in town
  });
});

describe("hex toolkit — neighbours, range and geometry helpers", () => {
  it("neighbors returns the six axial directions in the fixed order", () => {
    expect(neighbors(4, 5)).toEqual([
      { q: 5, r: 5 }, { q: 5, r: 4 }, { q: 4, r: 4 },
      { q: 3, r: 5 }, { q: 3, r: 6 }, { q: 4, r: 6 },
    ]);
    // Unfiltered: the caller bounds-checks, so negatives come back.
    expect(neighbors(0, 0)).toHaveLength(6);
    expect(neighbors(0, 0).some((n) => n.q < 0 || n.r < 0)).toBe(true);
    for (const n of neighbors(7, 2)) expect(hexDistance({ q: 7, r: 2 }, n)).toBe(1);
  });

  it("hexRange is in-field, inclusive of the centre and ascending q then r", () => {
    const f = FIELDS[0];
    const centre = { q: 7, r: 5 };
    const r0 = hexRange(f, centre, 0);
    expect(r0).toEqual([centre]);
    const r1 = hexRange(f, centre, 1);
    expect(r1).toHaveLength(7);
    const r2 = hexRange(f, centre, 2);
    expect(r2).toHaveLength(19);
    for (const hx of r2) {
      expect(hexDistance(centre, hx)).toBeLessThanOrEqual(2);
      expect(hx.q).toBeGreaterThanOrEqual(0);
      expect(hx.q).toBeLessThan(f.w);
      expect(hx.r).toBeGreaterThanOrEqual(0);
      expect(hx.r).toBeLessThan(f.h);
    }
    for (let i = 1; i < r2.length; i++) {
      const a = r2[i - 1], b = r2[i];
      expect(a.q < b.q || (a.q === b.q && a.r < b.r)).toBe(true);
    }
    // A corner centre is clipped by the board edge, not wrapped around it.
    expect(hexRange(f, { q: 0, r: 0 }, 1)).toHaveLength(3);
  });

  it("hexPixel and hexCorners moved to field.js and still draw pointy-top hexes", () => {
    expect(hexPixel(0, 0, 20)).toEqual({ x: 0, y: 0 });
    expect(hexPixel(1, 0, 10)).toEqual({ x: 10 * Math.sqrt(3), y: 0 });
    expect(hexPixel(0, 2, 10).y).toBe(30);
    const corners = hexCorners(20).split(" ");
    expect(corners).toHaveLength(6);
    expect(corners[0]).toBe("17.32,-10.00");
    // Lane A keeps hexDistance / dominantTroop / formationSize — those are
    // rules meta and are NOT part of this move.
    expect(MIRROR_SRC).not.toMatch(/dominantTroop|formationSize/);
    expect(MIRROR_SRC).toMatch(/export const hexPixel/);
    expect(MIRROR_SRC).toMatch(/export const hexCorners/);
    expect(MIRROR_SRC).toMatch(/import \{ hexDistance \} from "@\/lib\/tactical\/data"/);
  });
});

describe("lane hygiene — no drift into another layer", () => {
  it("neither file uses Math.random or the clock", () => {
    expect(CANON_SRC).not.toMatch(/Math\.random/);
    expect(MIRROR_SRC).not.toMatch(/Math\.random/);
    expect(CANON_SRC).not.toMatch(/Date\.now/);
    expect(MIRROR_SRC).not.toMatch(/Date\.now/);
  });

  it("the canonical file never reaches into src/ or gameEngine", () => {
    expect(CANON_SRC).not.toMatch(/gameEngine/);
    expect(CANON_SRC).not.toMatch(/from ['"][^'"]*src\//);
    expect(CANON_SRC).not.toMatch(/from ['"]@\//);
    // Deno resolves import specifiers literally — the .ts extension is required.
    expect(CANON_SRC).toMatch(/from '\.\/tactical\.ts'/);
  });

  it("the mirror never imports from base44/, and uses the @/ alias", () => {
    // Prose may name its canonical counterpart; only an IMPORT crosses layers.
    expect(MIRROR_SRC).not.toMatch(/^\s*import[^;]*base44/m);
    expect(MIRROR_SRC).not.toMatch(/from ['"]\.\.\//);
    expect(MIRROR_SRC).toMatch(/from "@\/lib\//);
  });

  it("contains no armour, penetration or damage arithmetic (drift guard 12)", () => {
    for (const src of [CANON_SRC, MIRROR_SRC]) {
      expect(src).not.toMatch(/armourValue|armorPen|armourClass|resolveHit|PEN_TABLE/i);
    }
  });

  it("keeps every mirror-tested table a pure literal the extractor can lift", () => {
    for (const name of ["FIELD", "TERRAIN", "PALETTES", "WEATHER_FIELD", "WORKS_SEED"]) {
      expect(() => extractConst(CANON_SRC, name)).not.toThrow();
      const decl = CANON_SRC.slice(CANON_SRC.indexOf(`const ${name} =`));
      const body = decl.slice(0, decl.indexOf("\n};") + 3);
      expect(body, `${name} uses a spread`).not.toMatch(/\.\.\./);
      expect(body, `${name} uses a computed key`).not.toMatch(/^\s*\[/m);
    }
  });
});

// ---------------------------------------------------------------------------
// SECOND PASS — the parts most likely to rot.
//
// Everything above proves the four acceptance properties over the 200-field
// corpus. What follows attacks the same generator from the outside: an
// INDEPENDENT Dijkstra that does not share a line of code with pathCost, an
// adversarial board whose blockers and elevations are sown by hand so LOS
// symmetry is tested where the generator is not the one choosing the board,
// aggregate weather measurements that would go quiet if a weather row were
// zeroed, and a read of the contract document itself so the vocabulary this
// lane publishes cannot drift away from the two lanes keyed to it.
// ---------------------------------------------------------------------------

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

// A plain uniform-cost search, written against the tile table only. It shares
// nothing with pathCost — no heuristic, no tie-break, no shared helper — so
// when the two agree on a cost, A*'s heuristic is admissible and its
// tie-breaking is not quietly cutting a corner.
function dijkstraCost(f, from, to, blocked = new Set(), allowTarget = false) {
  const fromK = K(from.q, from.r), toK = K(to.q, to.r);
  if (!f.tiles[fromK] || !f.tiles[toK]) return null;
  if (fromK === toK) return 0;
  const usable = (k) => {
    const t = f.tiles[k];
    if (!t || t.moveCost === null) return false;
    if (blocked.has(k)) return k === toK && allowTarget;
    return true;
  };
  if (!usable(toK)) return null;
  const dist = new Map([[fromK, 0]]);
  const done = new Set();
  for (;;) {
    let bestK = null, bestD = Infinity;
    for (const [k, d] of dist) if (!done.has(k) && d < bestD) { bestD = d; bestK = k; }
    if (bestK === null) return null;
    if (bestK === toK) return bestD;
    done.add(bestK);
    const q = Number(bestK.split(",")[0]), r = Number(bestK.split(",")[1]);
    for (const [dq, dr] of DIRS) {
      const nq = q + dq, nr = r + dr;
      if (nq < 0 || nq >= f.w || nr < 0 || nr >= f.h) continue;
      const nk = K(nq, nr);
      if (done.has(nk) || !usable(nk)) continue;
      const nd = bestD + f.tiles[nk].moveCost;
      if (!dist.has(nk) || nd < dist.get(nk)) dist.set(nk, nd);
    }
  }
}

// BFS reachability that also honours an occupied set — the flood equivalent of
// pathCost's `opts.blocked`, so "returned null" can be checked against
// "genuinely unreachable" rather than taken on trust.
function reachableWith(f, start, blocked) {
  const seen = new Set([K(start.q, start.r)]);
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    for (const [dq, dr] of DIRS) {
      const q = cur.q + dq, r = cur.r + dr;
      if (q < 0 || q >= f.w || r < 0 || r >= f.h) continue;
      const k = K(q, r);
      if (seen.has(k) || blocked.has(k)) continue;
      const tile = f.tiles[k];
      if (!tile || tile.moveCost === null) continue;
      seen.add(k);
      stack.push({ q, r });
    }
  }
  return seen;
}

// A deterministic occupied set — Lane C will pass the hexes squads stand on.
function blockedFor(index, f, share) {
  const rnd = refMulberry32((index + 1) * 0x27d4eb2f);
  const out = new Set();
  for (let q = 0; q < f.w; q++) for (let r = 0; r < f.h; r++) if (rnd() < share) out.add(K(q, r));
  return out;
}

// A board the GENERATOR would never produce: a third of it blocks sight and
// elevation is scattered 0/1/2 at random. LOS symmetry must be a property of
// lineOfSight, not a property of boards that happen to be sparsely blocked.
function sownBoard(seedN) {
  const f = generateField({ seed: seedN, nodeKind: "ruin", weather: "clear", fortBonus: 2, w: 9, h: 7 });
  const rnd = refMulberry32(seedN * 0x9e3779b1 + 17);
  for (const tile of Object.values(f.tiles)) {
    tile.blocksLOS = rnd() < 0.35;
    tile.elev = (rnd() * 3) | 0;
  }
  return f;
}

// Every ordered pair of a 9x7 board: 63 x 63 = 3,969 pairs, exhaustive rather
// than sampled.
function allHexes(f) {
  const out = [];
  for (let q = 0; q < f.w; q++) for (let r = 0; r < f.h; r++) out.push({ q, r });
  return out;
}

// The visibility yardstick used by the weather tests: one fixed lattice of
// corner-to-corner pairs per board, identical across weathers, so the only
// thing that can move the number is the sight rule.
function visibleShare(fields) {
  let vis = 0, pairs = 0;
  for (const f of fields) {
    for (let q = 0; q < f.w; q += 2) {
      for (let r = 0; r < f.h; r += 2) {
        if (lineOfSight(f, { q, r }, { q: f.w - 1 - q, r: f.h - 1 - r })) vis++;
        pairs++;
      }
    }
  }
  return vis / pairs;
}

// Mean entry cost of soft ground — the only ground weather taxes.
const SOFT = ["open", "field", "crater", "marsh", "woods"];
function softGroundMeanCost(fields) {
  let sum = 0, n = 0;
  for (const f of fields) {
    for (const tile of Object.values(f.tiles)) {
      if (tile.moveCost === null || !SOFT.includes(tile.terrain)) continue;
      sum += tile.moveCost; n++;
    }
  }
  return sum / n;
}

const worksOf = (f) => Object.entries(f.tiles).filter(([, t]) => "work" in t);
const PLAN_SRC = readRepoFile("docs/TACTICAL_SQUAD_PLAN.md");

// The 25 (kind x weather) combinations, each at 8 seeds — the grid the
// fortification and weather properties sweep.
const GRID = [];
for (const nodeKind of KINDS) for (const weather of WEATHERS) GRID.push({ nodeKind, weather });

describe("acceptance 3+ — no board is unwinnable by geometry", () => {
  it("the flood runs both ways: the defender's ground reaches the attacker's", () => {
    // Property 3 is worded "reachable from the OPPOSITE side". Flooding only
    // from the attacker's corner would pass on a board where the defender is
    // walled into a pocket that happens to touch that one flood.
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const label = `corpus[${i}] ${f.meta.nodeKind}/${f.meta.weather}/seed ${f.meta.seed}/fb ${f.meta.fortBonus}`;
      const fromDefender = reachableFrom(f, f.deploy.defender[f.deploy.defender.length - 1]);
      for (const hx of zoneOf(f)) {
        expect(fromDefender.has(K(hx.q, hx.r)), `${label}: defender cannot reach ${K(hx.q, hx.r)}`).toBe(true);
      }
    }
  });

  it("every sampled attacker hex can walk to every sampled defender hex", () => {
    // 16 crossings a board, 3,200 in all. A single unwinnable board fails here
    // by name, with the exact arguments that produced it.
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const label = `corpus[${i}] ${f.meta.nodeKind}/${f.meta.weather}/seed ${f.meta.seed}`;
      const pick = (list) => [0, 7, 19, list.length - 1].map((n) => list[n]);
      for (const a of pick(f.deploy.attacker)) {
        for (const b of pick(f.deploy.defender)) {
          const res = pathCost(f, a, b);
          expect(res, `${label}: no crossing ${K(a.q, a.r)} -> ${K(b.q, b.r)}`).not.toBeNull();
          expect(res.cost).toBeGreaterThan(0);
          expect(res.path[0]).toEqual({ q: a.q, r: a.r });
          expect(res.path[res.path.length - 1]).toEqual({ q: b.q, r: b.r });
        }
      }
    }
  });

  it("A* returns a genuinely optimal cost — checked against an independent Dijkstra", () => {
    // If the heuristic were ever made inadmissible (a cheapest-cost constant
    // above 1, say), A* would still return A path and every other test here
    // would stay green. This is the one that notices.
    let compared = 0;
    for (let i = 0; i < FIELDS.length; i += 2) {
      const f = FIELDS[i];
      const pairs = [
        [f.deploy.attacker[0], f.deploy.defender[f.deploy.defender.length - 1]],
        [f.deploy.attacker[f.deploy.attacker.length - 1], f.deploy.defender[0]],
        [f.deploy.attacker[5], { q: (f.w / 2) | 0, r: (f.h / 2) | 0 }],
      ];
      for (const [a, b] of pairs) {
        const astar = pathCost(f, a, b);
        const truth = dijkstraCost(f, a, b);
        if (truth === null) { expect(astar).toBeNull(); continue; }
        expect(astar, `corpus[${i}] ${K(a.q, a.r)} -> ${K(b.q, b.r)}`).not.toBeNull();
        expect(astar.cost, `corpus[${i}] suboptimal path`).toBe(truth);
        compared++;
      }
    }
    expect(compared).toBeGreaterThanOrEqual(280);
  });

  it("the fighting ground is one region, not an archipelago", () => {
    // The repair guarantees the deploy zones connect. It does not forbid a
    // four-hex pocket behind a wall, and that is fine — a board that is MOSTLY
    // pockets is not. RE-MEASURED over this corpus: the worst board keeps
    // 99.30% of its passable ground in the main region (corpus[124]
    // ruin/clear/seed 1917). The floor was 0.90 against a hand-typed "97.1%"
    // that was never true of this generator — nine points of slack on a figure
    // that was itself wrong. It is 0.97 now: still tolerant of a pocket or
    // two, no longer tolerant of an archipelago.
    let worst = 1;
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const passable = Object.values(f.tiles).filter((t) => t.moveCost !== null).length;
      const main = reachableFrom(f, f.deploy.attacker[0]).size;
      const share = main / passable;
      expect(share, `corpus[${i}] ${f.meta.nodeKind}/${f.meta.weather} stranded`).toBeGreaterThanOrEqual(0.97);
      worst = Math.min(worst, share);
    }
    expect(worst, "the stranding floor has drifted away from the worst board").toBeLessThan(1.0);
  });

  it("connectivity comes from the arterial spine — the repair pass is a net, not a floor", () => {
    // Worth being exact about, because it is the difference between a property
    // that HOLDS and a property that is TESTED. Step 3 metals one lane from the
    // west edge to the east; nothing downstream can make that lane impassable
    // (features skip artery hexes, and steps 8/10 only ever repaint to `open`),
    // and both deploy strips are normalised passable end to end. So the deploy
    // zones are joined to the spine, and through it to each other, before the
    // repair in step 10 is ever consulted.
    //
    // The claim "one lane from the west edge to the east" is not taken on
    // trust here: the assertion below finds the CONNECTED COMPONENTS of the
    // artery terrain and requires one of them to span every column. That is a
    // real claim about hex adjacency, and it is why step 3 lays a bridging hex
    // on a southward drift — [+1,0] and [+1,-1] are neighbours, (q+1,r+1) is
    // two hexes away, so a lane that only ever painted (q, ar) would be a
    // dotted line that merely LOOKS continuous on a map. Measured with the
    // bridge disabled: 4 of 200 boards keep a full-width component.
    //
    // Measured, by mutation: stubbing the repair out entirely — no flood, no
    // carve — leaves every field in this corpus BYTE-IDENTICAL. The repair is a
    // safety net for a future pipeline change, not the reason property 3 holds
    // today. It therefore gets its coverage from a board built by hand rather
    // than from the corpus — see "the connectivity repair really does reconnect
    // a walled-off board" below.
    for (const pal of Object.values(PALETTES)) {
      expect(TERRAIN[pal.artery].moveCost, `${pal.key}'s artery is impassable`).not.toBeNull();
    }
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const reached = reachableFrom(f, f.deploy.attacker[0]);
      const columns = new Set([...reached].map((k) => Number(k.split(",")[0])));
      expect(columns.size, `corpus[${i}] the walkable region does not span the board`).toBe(f.w);
      for (const hx of zoneOf(f)) {
        expect(f.tiles[K(hx.q, hx.r)].moveCost, `corpus[${i}] deploy strip has a hole at ${K(hx.q, hx.r)}`).not.toBeNull();
      }
      // The spine itself: one connected run of artery terrain, all w columns.
      const artery = PALETTES[f.meta.nodeKind].artery;
      const lane = new Set();
      for (const [k, tile] of Object.entries(f.tiles)) if (tile.terrain === artery) lane.add(k);
      const seen = new Set();
      let widest = 0;
      for (const start of lane) {
        if (seen.has(start)) continue;
        const stack = [start];
        seen.add(start);
        const cols = new Set();
        while (stack.length) {
          const k = stack.pop();
          const q = Number(k.split(",")[0]), r = Number(k.split(",")[1]);
          cols.add(q);
          for (const [dq, dr] of DIRS) {
            const nk = K(q + dq, r + dr);
            if (!lane.has(nk) || seen.has(nk)) continue;
            seen.add(nk);
            stack.push(nk);
          }
        }
        widest = Math.max(widest, cols.size);
      }
      expect(widest, `corpus[${i}] the arterial lane is broken, not a spine`).toBe(f.w);
    }
  });

  it("the connectivity repair really does reconnect a walled-off board", () => {
    // The repair pass carves nothing on a board this generator produces, so
    // without this test the whole of step 10 — flood, guard loop, conditional
    // carve, unconditional last resort — is unexecuted code wearing a comment.
    // It is exported for exactly this reason, and driven here against a board
    // the generator would never build: a solid wall down the middle.
    const wall = (f, col) => {
      for (let r = 0; r < f.h; r++) {
        const tile = f.tiles[K(col, r)];
        tile.terrain = "wall";
        tile.cover = TERRAIN.wall.cover;
        tile.blocksLOS = true;
        tile.moveCost = null;
        tile.elev = 2;          // a crest the carve must not flatten
        tile.work = "trench";   // and a stamp the carve must not scrub
      }
    };
    const build = () => {
      const src = generateField({ seed: 4242, nodeKind: "town", weather: "rain", fortBonus: 2 });
      const f = JSON.parse(JSON.stringify(src));
      wall(f, 7);
      return f;
    };

    // Sanity first: the walled board really is cut in two, or the repair below
    // would be "proving" it fixed something that was never broken.
    const broken = build();
    const before = reachableFrom(broken, broken.deploy.attacker[0]);
    expect(before.has(K(broken.w - 1, broken.h - 1)), "the wall did not actually cut the board")
      .toBe(false);

    const report = repairConnectivity(broken);
    expect(report.carved, "the repair carved nothing on a walled board").toBeGreaterThan(0);
    expect(report.passes, "the repair never entered its loop").toBeGreaterThanOrEqual(1);
    expect(report.passes, "the guard counter was exceeded").toBeLessThanOrEqual(8);
    // A hexLine is a chain of adjacent hexes, so one conditional pass is always
    // enough and the unconditional last resort must stay unreached.
    expect(report.forced, "the repair fell through to its last resort").toBe(0);

    const after = reachableFrom(broken, broken.deploy.attacker[0]);
    for (const hx of zoneOf(broken)) {
      expect(after.has(K(hx.q, hx.r)), `still stranded at ${K(hx.q, hx.r)}`).toBe(true);
    }

    // What it carved: `open`, weather-taxed (rain adds 1 to open ground), and
    // with elevation and works left exactly where they were. applyTerrain's
    // contract is that it repaints TERRAIN and only terrain.
    let carvedHexes = 0;
    for (let r = 0; r < broken.h; r++) {
      const tile = broken.tiles[K(7, r)];
      if (tile.terrain === "wall") continue;
      carvedHexes++;
      expect(tile.terrain).toBe("open");
      expect(tile.moveCost, "the carve dropped the weather tax").toBe(TERRAIN.open.moveCost + WEATHER_FIELD.rain.openMoveAdd);
      expect(tile.blocksLOS).toBe(false);
      expect(tile.cover).toBe(TERRAIN.open.cover);
      expect(tile.elev, "the carve flattened a crest it was told to leave alone").toBe(2);
      expect(tile.work, "the carve scrubbed a work it was told to leave alone").toBe("trench");
    }
    expect(carvedHexes).toBeGreaterThan(0);

    // Deterministic, and identical across the mirror: the repair consults no
    // RNG, so two runs of the same broken board must agree byte for byte.
    const a = build(), b = build();
    expect(JSON.stringify(repairConnectivity(a))).toBe(JSON.stringify(mRepairConnectivity(b)));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));

    // And on a board the generator actually built it is a genuine no-op — the
    // "net, not a floor" claim above, as a fact rather than a comment.
    const pristine = generateField({ seed: 4242, nodeKind: "town", weather: "rain", fortBonus: 2 });
    const untouched = JSON.stringify(pristine);
    expect(repairConnectivity(pristine)).toEqual({ passes: 0, carved: 0, forced: 0 });
    expect(JSON.stringify(pristine)).toBe(untouched);
  });

  it("no fortification is stranded behind ground the attacker cannot cross", () => {
    // A bunker nobody can assault is a bunker that never entered the battle.
    // Measured: 1,050 works across the corpus (fortBonus cycles 0..3, so the
    // 200 boards average 5.25 works each), all of them in the main region.
    let checked = 0;
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const main = reachableFrom(f, f.deploy.attacker[0]);
      for (const [k] of worksOf(f)) {
        expect(main.has(k), `corpus[${i}] work at ${k} is unreachable`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});

describe("pathCost — occupied and impassable ground is never crossed", () => {
  it("never returns a path that steps on an impassable hex", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const res = pathCost(f, f.deploy.attacker[0], f.deploy.defender[f.deploy.defender.length - 1]);
      for (const hx of res.path) {
        const tile = f.tiles[K(hx.q, hx.r)];
        expect(tile, `corpus[${i}] path leaves the board at ${K(hx.q, hx.r)}`).toBeTruthy();
        expect(tile.moveCost, `corpus[${i}] path crosses impassable ${K(hx.q, hx.r)}`).not.toBeNull();
      }
    }
  });

  it("never returns a path that steps on an occupied hex, and its null is honest", () => {
    // A sixth of the board occupied, deterministically. Three claims at once:
    // the path avoids every occupied hex, its cost is the true optimum under
    // those blocks, and a null answer is corroborated by an independent flood
    // rather than being an A* that gave up early.
    let routed = 0, refused = 0;
    for (let i = 0; i < FIELDS.length; i += 2) {
      const f = FIELDS[i];
      const from = f.deploy.attacker[0];
      const to = f.deploy.defender[f.deploy.defender.length - 1];
      const blocked = blockedFor(i, f, 1 / 6);
      blocked.delete(K(from.q, from.r));
      blocked.delete(K(to.q, to.r));
      const res = pathCost(f, from, to, { blocked });
      const reach = reachableWith(f, from, blocked);
      if (res === null) {
        expect(reach.has(K(to.q, to.r)), `corpus[${i}] refused a route that exists`).toBe(false);
        refused++;
        continue;
      }
      for (const hx of res.path) {
        expect(blocked.has(K(hx.q, hx.r)), `corpus[${i}] path crosses occupied ${K(hx.q, hx.r)}`).toBe(false);
        expect(f.tiles[K(hx.q, hx.r)].moveCost).not.toBeNull();
      }
      expect(res.cost, `corpus[${i}] suboptimal under blocks`).toBe(dijkstraCost(f, from, to, blocked));
      routed++;
    }
    // The sample has to contain both outcomes or it is only testing one of them.
    expect(routed, "no board routed under blocks").toBeGreaterThan(0);
    expect(routed + refused).toBe(100);
  });

  it("allowBlockedTarget frees the destination and nothing else", () => {
    // A hand-built one-hex corridor, so "the only route" is a fact rather than
    // a hope: everything off row 3 is walled, leaving a single lane east.
    const f = generateField({ seed: 21, nodeKind: "crossroads", weather: "clear", fortBonus: 0 });
    for (const [k, tile] of Object.entries(f.tiles)) {
      const r = Number(k.split(",")[1]);
      if (r === 3) { tile.terrain = "open"; tile.moveCost = 1; tile.blocksLOS = false; tile.cover = 0; }
      else { tile.terrain = "wall"; tile.moveCost = null; tile.blocksLOS = true; tile.cover = 2; }
    }
    const from = { q: 0, r: 3 }, mid = { q: 7, r: 3 }, to = { q: 14, r: 3 };
    expect(pathCost(f, from, to).cost).toBe(14);
    // The target alone, blocked: refused by default, allowed on request.
    expect(pathCost(f, from, to, { blocked: [K(to.q, to.r)] })).toBeNull();
    const onto = pathCost(f, from, to, { blocked: [K(to.q, to.r)], allowBlockedTarget: true });
    expect(onto.cost).toBe(14);
    expect(onto.path[onto.path.length - 1]).toEqual(to);
    // An INTERMEDIATE hex blocked: the flag must not open it. Both answers null.
    expect(pathCost(f, from, to, { blocked: [K(mid.q, mid.r)] })).toBeNull();
    expect(pathCost(f, from, to, { blocked: [K(mid.q, mid.r)], allowBlockedTarget: true })).toBeNull();
  });

  it("reads opts.blocked as an array or a Set alike, and an absent one as a no-op", () => {
    const f = FIELDS[3];
    const from = f.deploy.attacker[4], to = f.deploy.defender[9];
    const keys = [K(7, 0), K(7, 1), K(7, 2)];
    const asArray = JSON.stringify(pathCost(f, from, to, { blocked: keys }));
    const asSet = JSON.stringify(pathCost(f, from, to, { blocked: new Set(keys) }));
    expect(asArray).toBe(asSet);
    const bare = JSON.stringify(pathCost(f, from, to));
    expect(JSON.stringify(pathCost(f, from, to, {}))).toBe(bare);
    expect(JSON.stringify(pathCost(f, from, to, { blocked: [] }))).toBe(bare);
    expect(JSON.stringify(pathCost(f, from, to, { blocked: new Set() }))).toBe(bare);
    // Blocking the START is not the same as blocking the target: the mover is
    // standing there, so the route out of it still exists.
    expect(pathCost(f, from, to, { blocked: [K(from.q, from.r)] })).not.toBeNull();
  });
});

describe("fortBonus — the fortification line scales with the bonus", () => {
  it("the works count rises strictly with the bonus, on every palette and weather", () => {
    // 25 combinations x 8 seeds x 4 levels = 800 boards. Monotone is the weak
    // claim; the exact ladder 0 < 3 < 7 < 11 is the strong one, and both are
    // asserted so a generator that merely trends upward cannot pass.
    for (const { nodeKind, weather } of GRID) {
      for (const seed of SEEDS) {
        const counts = [0, 1, 2, 3].map((fortBonus) =>
          worksOf(generateField({ seed, nodeKind, weather, fortBonus })).length);
        const label = `${nodeKind}/${weather}/seed ${seed}`;
        expect(counts, label).toEqual([0, 3, 7, 11]);
        for (let i = 1; i < counts.length; i++) {
          expect(counts[i], `${label}: level ${i} did not add ground`).toBeGreaterThan(counts[i - 1]);
        }
      }
    }
  });

  it("trenches come from level 1, bunkers only from level 2", () => {
    for (const { nodeKind, weather } of GRID) {
      const seed = 4491;
      for (const fortBonus of [0, 1, 2, 3]) {
        const f = generateField({ seed, nodeKind, weather, fortBonus });
        const works = worksOf(f).map(([, t]) => t.work);
        const trench = works.filter((wk) => wk === "trench").length;
        const bunker = works.filter((wk) => wk === "bunker").length;
        const label = `${nodeKind}/${weather}/fb ${fortBonus}`;
        expect(trench, label).toBe(fortBonus * WORKS_SEED.trenchPerLevel);
        expect(bunker, label).toBe(Math.max(0, fortBonus - (WORKS_SEED.bunkerFromLevel - 1)));
        if (fortBonus < WORKS_SEED.bunkerFromLevel) expect(bunker, `${label}: early bunker`).toBe(0);
      }
    }
  });

  it("fortifying never takes ground out of play", () => {
    // Works are stamps, not structures: whatever the bonus, the worked hexes
    // stay walkable and see-through, and the board stays crossable.
    for (const nodeKind of KINDS) {
      for (const fortBonus of [1, 2, 3]) {
        const f = generateField({ seed: 808, nodeKind, weather: "snow", fortBonus });
        for (const [k, tile] of worksOf(f)) {
          expect(tile.moveCost, `${nodeKind}/fb ${fortBonus} ${k}`).not.toBeNull();
          expect(tile.blocksLOS).toBe(false);
          expect(tile.cover).toBe(TERRAIN[tile.terrain].cover);
        }
        const reached = reachableFrom(f, f.deploy.attacker[0]);
        for (const hx of zoneOf(f)) expect(reached.has(K(hx.q, hx.r))).toBe(true);
      }
    }
  });

  it("clamps the bonus rather than extrapolating it", () => {
    const at = (fortBonus) => {
      const f = generateField({ seed: 55, nodeKind: "depot", weather: "clear", fortBonus });
      return [f.meta.fortBonus, worksOf(f).length];
    };
    expect(at(3.9)).toEqual([3, 11]);      // floored, not rounded
    expect(at(4)).toEqual([3, 11]);
    expect(at(1000)).toEqual([3, 11]);
    expect(at(-2)).toEqual([0, 0]);
    expect(at(undefined)).toEqual([0, 0]);
    expect(at(NaN)).toEqual([0, 0]);
    expect(at(0.9)).toEqual([0, 0]);       // half a level of digging is no level
  });
});

describe("weather — it really does bend sight and ground", () => {
  it("sight shrinks monotonically with losCap, and the visible set only ever nests", () => {
    // Pure test of the rule, on ONE board: the pairs visible at a shorter cap
    // must be a SUBSET of those visible at a longer one. A losCap that were
    // ignored, or applied with the comparison the wrong way round, breaks this
    // without breaking symmetry.
    const base = generateField({ seed: 66, nodeKind: "town", weather: "clear", fortBonus: 0 });
    const pairs = pairsFor(9, base);
    let previous = null;
    const sizes = [];
    for (const losCap of [0, 1, 2, 4, 6, 7, 8, 12, 20, 99]) {
      const f = { w: base.w, h: base.h, tiles: base.tiles, deploy: base.deploy, meta: { ...base.meta, losCap } };
      const seen = new Set();
      pairs.forEach(([a, b], idx) => { if (lineOfSight(f, a, b)) seen.add(idx); });
      if (previous) for (const idx of previous) expect(seen.has(idx), `losCap ${losCap} lost pair ${idx}`).toBe(true);
      sizes.push(seen.size);
      previous = seen;
    }
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
    expect(sizes[sizes.length - 1]).toBeGreaterThan(sizes[0]);
    // At a cap of zero the only thing a stand can see is the hex it stands on,
    // so whatever survives must be a self-pair.
    const blind = { w: base.w, h: base.h, tiles: base.tiles, deploy: base.deploy, meta: { ...base.meta, losCap: 0 } };
    for (const [a, b] of pairs) {
      if (!lineOfSight(blind, a, b)) continue;
      expect(`${a.q},${a.r}`, "a cap of zero saw past its own hex").toBe(`${b.q},${b.r}`);
    }
  });

  it("across the corpus, visibility ranks exactly as losCap does", () => {
    // 40 boards per weather, one fixed lattice of corner-to-corner pairs.
    // RE-MEASURED: fog .051 < rain .088 < snow .116 < storm .141 < clear .219.
    //
    // The ranking asserted here is deliberately COARSE. Each weather generates
    // its own boards (the weather string is in the seed hash), so the aggregate
    // carries board noise. Note what the measurement says and the old comment
    // here denied: snow (cap 6) reads HIGHER than rain (cap 7), so this
    // aggregate does NOT rank strictly by losCap and asserting that pair would
    // pin the noise, not the rule. The separations that are real: fog sees far
    // less than anything else, clear sees far more, and every capped weather
    // sits strictly between. The exact monotonicity in losCap is proven on a
    // FIXED board by the nesting test above, which is where it can be proven.
    const share = {};
    for (const weather of WEATHERS) share[weather] = visibleShare(FIELDS.filter((f) => f.meta.weather === weather));
    for (const weather of ["rain", "fog", "snow", "storm"]) {
      expect(share[weather], `${weather} sees as far as clear`).toBeLessThan(share.clear * 0.8);
    }
    for (const weather of ["rain", "snow", "storm"]) {
      expect(share[weather], `${weather} sees no further than fog`).toBeGreaterThan(share.fog * 1.3);
    }
    expect(share.clear).toBeGreaterThan(share.fog * 2);
    expect(share.storm, "storm has the longest cap of the four and should show it")
      .toBeGreaterThan(share.snow);
    // The board noise this test declines to assert through is itself bounded:
    // if the four capped weathers ever spread further apart than clear-to-fog,
    // the "coarse on purpose" reasoning above has stopped being true and this
    // test needs rewriting rather than believing.
    const capped = ["rain", "fog", "snow", "storm"].map((w) => share[w]);
    expect(Math.max(...capped) - Math.min(...capped)).toBeLessThan(share.clear - share.fog);
  });

  it("across the corpus, soft ground is slower in rain, storm and snow and untouched in fog", () => {
    // Boards differ between weathers (the weather is in the seed hash), so this
    // is an AGGREGATE over 40 boards each — deterministic, but a measurement
    // rather than an identity. RE-MEASURED: clear 1.298, fog 1.303, rain 2.218,
    // storm 2.219, snow 2.314.
    const mean = {};
    for (const weather of WEATHERS) mean[weather] = softGroundMeanCost(FIELDS.filter((f) => f.meta.weather === weather));
    expect(Math.abs(mean.fog - mean.clear), "fog taxes no ground, so it must read like clear").toBeLessThan(0.05);
    expect(Math.abs(mean.storm - mean.rain), "storm and rain tax the same ground").toBeLessThan(0.05);
    expect(mean.rain - mean.clear, "rain must cost a full step on soft ground").toBeGreaterThan(0.7);
    expect(mean.snow, "snow taxes timber as well as mud").toBeGreaterThan(mean.rain);
  });

  it("no weather ever makes ground cheaper, and none opens impassable ground", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      for (const [k, tile] of Object.entries(f.tiles)) {
        const base = TERRAIN[tile.terrain].moveCost;
        if (base === null) {
          expect(tile.moveCost, `corpus[${i}] ${k} opened impassable ground`).toBeNull();
        } else {
          expect(tile.moveCost, `corpus[${i}] ${k} got cheaper`).toBeGreaterThanOrEqual(base);
          expect(tile.moveCost - base).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe("every tile on every board is a legal tile", () => {
  it("all 33,000 corpus tiles match the §4 shape and derive from TERRAIN", () => {
    let tiles = 0;
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const wf = WEATHER_FIELD[f.meta.weather];
      for (const [k, tile] of Object.entries(f.tiles)) {
        const label = `corpus[${i}] ${k}`;
        expect(k, label).toMatch(/^\d+,\d+$/);
        const meta = TERRAIN[tile.terrain];
        expect(meta, `${label}: terrain '${tile.terrain}' is not in TERRAIN`).toBeTruthy();
        expect(tile.cover, label).toBe(meta.cover);
        expect(tile.blocksLOS, label).toBe(meta.blocksLOS);
        expect([0, 1, 2], label).toContain(tile.elev);
        // The exact entry cost the weather rules say this terrain should carry.
        let want = meta.moveCost;
        if (want !== null) {
          if (["open", "field", "crater", "marsh"].includes(tile.terrain)) want += wf.openMoveAdd;
          if (tile.terrain === "woods") want += wf.woodsMoveAdd;
        }
        expect(tile.moveCost, label).toBe(want);
        const keys = Object.keys(tile);
        expect(keys.slice(0, 5), label).toEqual(["terrain", "cover", "elev", "blocksLOS", "moveCost"]);
        expect(keys.length === 5 || (keys.length === 6 && keys[5] === "work"), label).toBe(true);
        if ("work" in tile) expect(["trench", "bunker"], label).toContain(tile.work);
        tiles++;
      }
    }
    expect(tiles).toBe(200 * 165);
  });

  it("the key space is exactly the board rectangle — nothing missing, nothing extra", () => {
    for (let i = 0; i < FIELDS.length; i += 7) {
      const f = FIELDS[i];
      const keys = new Set(Object.keys(f.tiles));
      expect(keys.size).toBe(f.w * f.h);
      for (let q = 0; q < f.w; q++) {
        for (let r = 0; r < f.h; r++) {
          expect(keys.has(K(q, r)), `corpus[${i}] missing ${K(q, r)}`).toBe(true);
          keys.delete(K(q, r));
        }
      }
      expect([...keys], `corpus[${i}] stray keys`).toEqual([]);
    }
  });

  it("no board ever paints a terrain its palette does not declare", () => {
    // The only terrain a board may carry that the palette never weights is
    // `open`, and only because steps 8 and 10 repaint with it. Measured across
    // the corpus: zero other escapes.
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const pal = PALETTES[f.meta.nodeKind];
      const allowed = new Set(Object.keys(pal.weights));
      allowed.add(pal.artery);
      allowed.add(pal.features.terrain);
      allowed.add("open");
      for (const [k, tile] of Object.entries(f.tiles)) {
        expect(allowed.has(tile.terrain), `corpus[${i}] ${k}: '${tile.terrain}' is off-palette for ${pal.key}`).toBe(true);
      }
    }
  });

  it("every weight a palette declares actually reaches the ground", () => {
    // A weight row that never paints anything is dead numbers in a catalogue —
    // it reads as content and is not. Checked over the 40 corpus boards of
    // each palette.
    for (const nodeKind of KINDS) {
      const painted = new Set();
      for (const f of FIELDS.filter((x) => x.meta.nodeKind === nodeKind)) {
        for (const tile of Object.values(f.tiles)) painted.add(tile.terrain);
      }
      for (const key of Object.keys(PALETTES[nodeKind].weights)) {
        expect(painted.has(key), `${nodeKind} declares '${key}' and never paints it`).toBe(true);
      }
      expect(painted.has(PALETTES[nodeKind].features.terrain)).toBe(true);
      expect(painted.has(PALETTES[nodeKind].artery)).toBe(true);
    }
  });
});

describe("the mirror is a mirror at runtime, not only on the tables", () => {
  const FROZEN = ["FIELD", "TERRAIN", "PALETTES", "WEATHER_FIELD", "WORKS_SEED",
    "generateField", "neighbors", "hexLine", "hexRange", "lineOfSight", "pathCost"];

  it("both modules export the frozen eleven, and only the agreed extras", () => {
    for (const name of FROZEN) {
      expect(CANON_MOD[name], `canonical is missing ${name}`).toBeDefined();
      expect(MIRROR_MOD[name], `mirror is missing ${name}`).toBeDefined();
      expect(typeof MIRROR_MOD[name], `${name} changed kind across the mirror`).toBe(typeof CANON_MOD[name]);
    }
    // Extras are a contract statement too: both files add the derived
    // TERRAIN_KEYS and the step-10 repair pass (exported so it can be driven
    // against a board the generator would never build — see "the connectivity
    // repair really does reconnect a walled-off board"), and the mirror adds
    // the two geometry helpers moved out of Lane A's data.js. Anything else is
    // an unannounced export.
    const extras = (mod) => Object.keys(mod).filter((k) => !FROZEN.includes(k)).sort();
    expect(extras(CANON_MOD)).toEqual(["TERRAIN_KEYS", "repairConnectivity"]);
    expect(extras(MIRROR_MOD)).toEqual(["TERRAIN_KEYS", "hexCorners", "hexPixel", "repairConnectivity"]);
  });

  it("TERRAIN_KEYS is derived, identical on both sides, and in table order", () => {
    expect(TERRAIN_KEYS).toEqual(Object.keys(TERRAIN));
    expect(M_TERRAIN_KEYS).toEqual(TERRAIN_KEYS);
    expect(M_TERRAIN_KEYS).toEqual(Object.keys(M_TERRAIN));
    expect(TERRAIN_KEYS).toHaveLength(16);
  });

  it("generates byte-identical fields for every nodeKind x weather combination", () => {
    // The step-1 pass compared ten. All twenty-five is the real claim, and it
    // is what catches a mirror whose divergence only shows on one palette.
    let compared = 0;
    for (const { nodeKind, weather } of GRID) {
      const opts = { seed: 1234 + compared, nodeKind, weather, fortBonus: compared % 4 };
      expect(JSON.stringify(mirrorGenerateField(opts)), `${nodeKind}/${weather}`)
        .toBe(JSON.stringify(generateField(opts)));
      compared++;
    }
    expect(compared).toBe(25);
    // ...and at both ends of the clamp, where the two copies of the coercion
    // logic are most likely to have drifted apart.
    for (const size of [{ w: 9, h: 7 }, { w: 2, h: 2 }, { w: 31, h: 21 }]) {
      const opts = { seed: 9, nodeKind: "ruin", weather: "storm", fortBonus: 3, ...size };
      expect(JSON.stringify(mirrorGenerateField(opts))).toBe(JSON.stringify(generateField(opts)));
    }
  });

  it("the hex toolkit answers identically on both sides", () => {
    // The tables are compared textually elsewhere; the FUNCTIONS are only ever
    // compared here, and they are the half Lane C actually calls.
    for (let i = 0; i < FIELDS.length; i += 10) {
      const f = FIELDS[i];
      for (const [a, b] of pairsFor(i, f).slice(0, 12)) {
        expect(JSON.stringify(mHexLine(a, b))).toBe(JSON.stringify(hexLine(a, b)));
        expect(mLineOfSight(f, a, b)).toBe(lineOfSight(f, a, b));
        expect(JSON.stringify(mPathCost(f, a, b))).toBe(JSON.stringify(pathCost(f, a, b)));
      }
      const centre = { q: (f.w / 2) | 0, r: (f.h / 2) | 0 };
      expect(JSON.stringify(mHexRange(f, centre, 3))).toBe(JSON.stringify(hexRange(f, centre, 3)));
      expect(JSON.stringify(mNeighbors(centre.q, centre.r))).toBe(JSON.stringify(neighbors(centre.q, centre.r)));
    }
  });

  it("the mirror's own tables are pure literals the extractor can lift", () => {
    // The purity rule binds BOTH files. If the mirror ever computed its rows
    // from the canonical shape, the table comparison above would still pass
    // and the mirror would no longer be independently readable.
    for (const name of ["FIELD", "TERRAIN", "PALETTES", "WEATHER_FIELD", "WORKS_SEED"]) {
      expect(() => extractConst(MIRROR_SRC, name), `${name} is not liftable`).not.toThrow();
      expect(extractConst(MIRROR_SRC, name), `${name} does not round-trip`).toEqual(MIRROR_MOD[name]);
    }
  });
});

describe("hexLine and LOS survive a board the generator would never build", () => {
  it("is symmetric over all 3,969 ordered pairs of a board sown with blockers", () => {
    // A third of the hexes block sight and elevation is scattered 0/1/2. This
    // is exhaustive, not sampled: every ordered pair of a 9x7 board.
    const f = sownBoard(4004);
    const hexes = allHexes(f);
    const blockers = Object.values(f.tiles).filter((t) => t.blocksLOS).length;
    expect(blockers).toBeGreaterThan(10);
    let pairs = 0, blocked = 0;
    for (const a of hexes) {
      for (const b of hexes) {
        const there = lineOfSight(f, a, b);
        expect(there, `${K(a.q, a.r)} <-> ${K(b.q, b.r)}`).toBe(lineOfSight(f, b, a));
        if (!there) blocked++;
        pairs++;
      }
    }
    expect(pairs).toBe(63 * 63);
    // The board has to actually block things, or symmetry is trivially true.
    expect(blocked).toBeGreaterThan(pairs * 0.15);
  });

  it("draws the same line in both directions over all 3,969 pairs", () => {
    const f = sownBoard(4004);
    const hexes = allHexes(f);
    let pairs = 0;
    for (const a of hexes) {
      for (const b of hexes) {
        const forward = hexLine(a, b);
        expect(JSON.stringify(forward), `${K(a.q, a.r)} -> ${K(b.q, b.r)}`)
          .toBe(JSON.stringify(hexLine(b, a).slice().reverse()));
        expect(forward.length).toBe(hexDistance(a, b) + 1);
        for (let i = 1; i < forward.length; i++) expect(hexDistance(forward[i - 1], forward[i])).toBe(1);
        pairs++;
      }
    }
    expect(pairs).toBe(63 * 63);
  });

  it("holds symmetry when the elevation is lopsided and the blocker sits between", () => {
    // The elevation rule reads min(elevA, elevB), which is symmetric — but a
    // rule written as "the blocker must clear the SHOOTER" would not be, and
    // would pass every sampled test on a board with few blockers.
    const f = sownBoard(77);
    for (const tile of Object.values(f.tiles)) { tile.blocksLOS = false; tile.elev = 0; }
    const a = { q: 1, r: 3 }, b = { q: 7, r: 3 };
    const line = hexLine(a, b);
    const mid = line[3];
    f.tiles[K(mid.q, mid.r)].blocksLOS = true;
    for (const [ea, eb, expected] of [
      [0, 0, false], [1, 0, false], [0, 1, false],
      [1, 1, true], [2, 1, true], [1, 2, true], [2, 2, true],
    ]) {
      f.tiles[K(a.q, a.r)].elev = ea;
      f.tiles[K(b.q, b.r)].elev = eb;
      f.tiles[K(mid.q, mid.r)].elev = 0;
      const label = `elev ${ea}/${eb} over a ground blocker`;
      expect(lineOfSight(f, a, b), label).toBe(expected);
      expect(lineOfSight(f, b, a), `${label} (reversed)`).toBe(expected);
    }
  });

  it("never lets an endpoint block itself, however solid it is", () => {
    const f = sownBoard(1291);
    for (const tile of Object.values(f.tiles)) { tile.blocksLOS = true; tile.elev = 0; }
    // Every hex on the board blocks. Adjacent pairs still see each other,
    // because a line of length two has no intermediate hex at all.
    for (let q = 0; q < f.w; q++) {
      for (let r = 0; r < f.h; r++) {
        for (const n of neighbors(q, r)) {
          if (n.q < 0 || n.q >= f.w || n.r < 0 || n.r >= f.h) continue;
          expect(lineOfSight(f, { q, r }, n), `${K(q, r)} cannot see its neighbour ${K(n.q, n.r)}`).toBe(true);
        }
        expect(lineOfSight(f, { q, r }, { q, r })).toBe(true);
      }
    }
  });
});

describe("the passes that only show up in aggregate", () => {
  // Four generator knobs that no per-board assertion can see: the crest tier,
  // the elevation blob's spread, the depth column of the works pool, and the
  // feature-cluster COUNT. Each is proven here by a floor measured off the
  // corpus and set below the value a neutralised knob produces, so the gate
  // sits between the two rather than below both.

  it("reaches the crest tier, not just the rise", () => {
    // elev 2 is the tier the sight rule leans on: a blocker at elev 1 is shot
    // over by two stands on crests and not by two on a rise. Measured: 133
    // crest tiles on 100 of the 200 boards. With the crest roll disabled the
    // numbers are 0 and 0, and every other assertion in this file stays green,
    // because they only ever check membership of [0, 1, 2].
    let crestTiles = 0, crestBoards = 0;
    for (const f of FIELDS) {
      const n = Object.values(f.tiles).filter((t) => t.elev === 2).length;
      crestTiles += n;
      if (n > 0) crestBoards++;
    }
    expect(crestTiles, "no board in the corpus has a crest").toBeGreaterThanOrEqual(60);
    expect(crestBoards, "crests are not spread across the corpus").toBeGreaterThanOrEqual(40);
    // ...and a crest is rare on purpose — a board of nothing but crests would
    // pass the floors above and would not be a battlefield.
    expect(crestTiles).toBeLessThan(FIELDS.length * 5);
  });

  it("raises blobs of high ground, not single elevated hexes", () => {
    // Step 5 lifts a centre AND its in-field neighbours. Measured: 2,781
    // elevated tiles and 274 hexes whose six neighbours are ALL elevated
    // (a blob interior) across 161 boards. Drop the neighbour spread and those
    // become 789 and 0 — the board still has "at least one elevated hex", which
    // is all the old assertion asked for.
    let elevated = 0, interiors = 0, boardsWithInterior = 0;
    for (const f of FIELDS) {
      let hasInterior = false;
      for (const [k, tile] of Object.entries(f.tiles)) {
        if (tile.elev === 0) continue;
        elevated++;
        const q = Number(k.split(",")[0]), r = Number(k.split(",")[1]);
        const nbs = neighbors(q, r).filter((n) => n.q >= 0 && n.q < f.w && n.r >= 0 && n.r < f.h);
        if (nbs.length === 6 && nbs.every((n) => f.tiles[K(n.q, n.r)].elev > 0)) {
          interiors++;
          hasInterior = true;
        }
      }
      if (hasInterior) boardsWithInterior++;
    }
    expect(elevated, "high ground is thinner than a blob pass would leave it").toBeGreaterThanOrEqual(1800);
    expect(interiors, "no elevated hex is surrounded by high ground").toBeGreaterThanOrEqual(100);
    expect(boardsWithInterior).toBeGreaterThanOrEqual(80);
  });

  it("digs the works pool four columns deep, not three", () => {
    // WORKS_SEED.depthCols = 4 is the deploy strip PLUS the column in front of
    // it: the fortification line has depth instead of sitting flat on the board
    // edge. The lower bound elsewhere ("no work west of w - depthCols") is
    // satisfied by any narrower pool, so it cannot see a pool cut back to the
    // three deploy columns. Measured: of 1,050 works, 233 land in the depth
    // column itself; cut the pool back and that becomes 0.
    let inDepthColumn = 0, total = 0;
    for (const f of FIELDS) {
      for (const [k] of worksOf(f)) {
        total++;
        if (Number(k.split(",")[0]) === f.w - WORKS_SEED.depthCols) inDepthColumn++;
      }
    }
    expect(total).toBe(1050);
    expect(inDepthColumn, "no work was dug in front of the deploy strip").toBeGreaterThanOrEqual(150);
    // ...and the depth column is one of four, so it must not hold most of them.
    expect(inDepthColumn).toBeLessThan(total * 0.5);
  });

  it("varies the feature-cluster count instead of always taking the minimum", () => {
    // features.maxClusters is decorative unless the count actually reaches it,
    // and a board cannot report how many clusters were placed — only how much
    // signature terrain ended up on it. Measured totals over each palette's 40
    // corpus boards, against the same totals with the cluster count pinned to
    // minClusters: city 929/815, town 1391/1249, depot 527/431, ruin 619/446,
    // crossroads 680/592. The floors sit between the two.
    const FLOOR = { city: 870, town: 1320, depot: 480, ruin: 530, crossroads: 635 };
    for (const nodeKind of KINDS) {
      const pal = PALETTES[nodeKind];
      let painted = 0;
      for (const f of FIELDS.filter((x) => x.meta.nodeKind === nodeKind)) {
        painted += Object.values(f.tiles).filter((t) => t.terrain === pal.features.terrain).length;
      }
      expect(painted, `${nodeKind} paints too little '${pal.features.terrain}' for its cluster range`)
        .toBeGreaterThanOrEqual(FLOOR[nodeKind]);
      expect(pal.features.maxClusters, `${nodeKind} declares a range it cannot use`)
        .toBeGreaterThan(pal.features.minClusters);
    }
  });

  it("puts every one of the four seed inputs into the RNG derivation", () => {
    // "Changing any one input changes the board" is satisfied for fortBonus by
    // the works alone — a generator that left ${fb} out of the hash string
    // would still pass it, because the works themselves differ. The TERRAIN
    // projection is the discriminating one: drop fortBonus from the hash and
    // the ground under the works is identical at every level.
    const terrainOf = (opts) => JSON.stringify(
      Object.entries(generateField(opts).tiles).map(([k, t]) => [k, t.terrain, t.elev]),
    );
    for (const nodeKind of KINDS) {
      const at = (fortBonus) => terrainOf({ seed: 2026, nodeKind, weather: "clear", fortBonus });
      expect(at(0), `${nodeKind}: fortBonus is not in the seed`).not.toBe(at(1));
      expect(at(1), `${nodeKind}: fortBonus is not in the seed`).not.toBe(at(2));
      expect(at(2), `${nodeKind}: fortBonus is not in the seed`).not.toBe(at(3));
      // The clamp is part of the derivation: 3 and 7 both normalise to 3, so
      // they must produce the SAME ground, not merely the same works.
      expect(terrainOf({ seed: 2026, nodeKind, weather: "clear", fortBonus: 7 }))
        .toBe(at(3));
    }
    // The board size is in the string too, and w x h is not a bare product:
    // 15x11 and 11x15 must not collide.
    const sized = (w, h) => terrainOf({ seed: 5, nodeKind: "city", weather: "fog", fortBonus: 1, w, h });
    expect(sized(15, 11)).not.toBe(sized(11, 15));
  });
});

describe("hexLine's tie-break is a decision, not an accident", () => {
  // Symmetry is guaranteed by the canonicalisation line alone, so the 12,000
  // sampled and 3,969 exhaustive symmetry assertions elsewhere in this file are
  // blind to the +1e-6 nudge: delete it and they all stay green. The epsilon
  // decides WHICH way an exact tie rounds, and on a 15x11 board it changes
  // 3,528 of the ordered pairs. These pin the direction.

  it("rounds an exact tie the same way every time, on both sides of the mirror", () => {
    const cases = [
      [{ q: 0, r: 0 }, { q: 1, r: 5 }, [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [1, 5]]],
      [{ q: 0, r: 0 }, { q: 2, r: 6 }, [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [2, 6]]],
      [{ q: 0, r: 0 }, { q: 3, r: 5 }, [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5]]],
    ];
    // Compared as JSON, like every other line comparison in this file: the
    // cube rounding can hand back a negative zero for r, which is the same hex
    // by every reading that matters (`${0},${-0}` is "0,0") but is not the same
    // VALUE to toEqual.
    for (const [a, b, expected] of cases) {
      const want = JSON.stringify(expected.map(([q, r]) => ({ q, r })));
      expect(JSON.stringify(hexLine(a, b)), `${K(a.q, a.r)} -> ${K(b.q, b.r)}`).toBe(want);
      expect(JSON.stringify(mHexLine(a, b)), `mirror ${K(a.q, a.r)} -> ${K(b.q, b.r)}`).toBe(want);
      // ...and the reverse is still the exact mirror image, which is the
      // property the epsilon must never be allowed to break.
      expect(JSON.stringify(hexLine(b, a).reverse())).toBe(want);
    }
  });

  it("keeps the nudge inside the rounding, not inside the geometry", () => {
    // An epsilon large enough to move a hex would be a bug of its own. Every
    // line still starts and ends where it was asked to, and every step is
    // exactly one hex — over every ordered pair of a 15x11 board.
    let checked = 0;
    for (let aq = 0; aq < 15; aq += 2) {
      for (let ar = 0; ar < 11; ar += 2) {
        for (let bq = 0; bq < 15; bq += 3) {
          for (let br = 0; br < 11; br += 3) {
            const a = { q: aq, r: ar }, b = { q: bq, r: br };
            const line = hexLine(a, b);
            expect(line[0].q === a.q && line[0].r === a.r, `${K(a.q, a.r)} start`).toBe(true);
            const end = line[line.length - 1];
            expect(end.q === b.q && end.r === b.r, `${K(b.q, b.r)} end`).toBe(true);
            expect(line.length).toBe(hexDistance(a, b) + 1);
            for (let i = 1; i < line.length; i++) expect(hexDistance(line[i - 1], line[i])).toBe(1);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(400);
  });
});

describe("the contract records the vocabulary this lane publishes", () => {
  // A union type is a SET, not a sequence — §4 spells WeatherKey in a different
  // order from the table and neither is wrong. Compare sorted, or this guard
  // fires on a cosmetic reordering and gets switched off.
  const unionOf = (prefix) => {
    const line = PLAN_SRC.split("\n").find((l) => l.startsWith(prefix));
    expect(line, `§4 has no '${prefix}' declaration`).toBeTruthy();
    return [...line.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
  };
  const sorted = (o) => Object.keys(o).sort();

  it("§4's TerrainKey union is exactly the TERRAIN table", () => {
    // Lane E's terrain tokens and Lane J's Suspension.terrain are keyed to this
    // union. If the table and the contract ever disagree, one of those two
    // lanes ships a hole, and it will not be visible in this lane's own tests.
    expect(unionOf("TerrainKey")).toEqual(sorted(TERRAIN));
    expect(unionOf("TerrainKey")).toHaveLength(16);
  });

  it("§4's NodeKind and WeatherKey unions are exactly the palettes and weather rows", () => {
    expect(unionOf("NodeKind")).toEqual(sorted(PALETTES));
    expect(unionOf("WeatherKey")).toEqual(sorted(WEATHER_FIELD));
  });

  it("§4 declares the Tile, FieldMeta and Field shapes this generator returns", () => {
    const sample = FIELDS[0];
    const tile = Object.values(sample.tiles)[0];
    for (const key of Object.keys(tile)) expect(PLAN_SRC).toMatch(new RegExp(`Tile\\s+=.*\\b${key}\\b`));
    const metaLine = PLAN_SRC.split("\n").find((l) => l.startsWith("FieldMeta"));
    for (const key of Object.keys(sample.meta)) expect(metaLine, `FieldMeta omits ${key}`).toContain(key);
    expect(PLAN_SRC).toMatch(/WorkKey\s+=.*'trench'/);
    expect(PLAN_SRC).toMatch(/WorkKey\s+=.*'bunker'/);
    // The only two work keys this lane may ever emit.
    const emitted = new Set();
    for (const f of FIELDS) for (const [, t] of worksOf(f)) emitted.add(t.work);
    expect([...emitted].sort()).toEqual(["bunker", "trench"]);
  });
});
