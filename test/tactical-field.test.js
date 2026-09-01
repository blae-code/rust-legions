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
  FIELD, TERRAIN, PALETTES, WEATHER_FIELD, WORKS_SEED,
  generateField, neighbors, hexLine, hexRange, lineOfSight, pathCost,
} from "../base44/shared/tacticalField.ts";

// Frontend mirror.
import {
  FIELD as M_FIELD, TERRAIN as M_TERRAIN, PALETTES as M_PALETTES,
  WEATHER_FIELD as M_WEATHER, WORKS_SEED as M_WORKS,
  generateField as mirrorGenerateField,
  hexPixel, hexCorners,
} from "@/lib/tactical/field.js";

import { hexDistance } from "@/lib/tactical/data.js";

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
    // pass the test above perfectly.
    const distinct = new Set(FIELDS.map((f) => JSON.stringify(f)));
    expect(distinct.size).toBeGreaterThanOrEqual(Math.ceil(FIELDS.length * 0.95));
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
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const tiles = Object.values(f.tiles);
      const kinds = new Set(tiles.map((t) => t.terrain));
      expect(kinds.size, `corpus[${i}] terrain variety`).toBeGreaterThanOrEqual(4);
      const good = tiles.filter((t) => t.moveCost !== null && !t.blocksLOS).length;
      expect(good / tiles.length, `corpus[${i}] passable share`).toBeGreaterThanOrEqual(0.55);
    }
  });

  it("paints an unbroken arterial lane and at least one elevated hex", () => {
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const artery = PALETTES[f.meta.nodeKind].artery;
      // The arterial touches every column: one hex of `artery` per column is
      // the floor, since features and the deploy normalisation may repaint it.
      const cols = new Set();
      for (const [k, tile] of Object.entries(f.tiles)) {
        if (tile.terrain === artery) cols.add(Number(k.split(",")[0]));
      }
      expect(cols.size, `corpus[${i}] arterial coverage`).toBeGreaterThanOrEqual(f.w - FIELD.deployCols * 2);
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
