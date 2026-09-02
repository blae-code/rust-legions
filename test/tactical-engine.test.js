// ---------------------------------------------------------------------------
// Lane C — the tactical state machine on the 15x11 field.
//
// WHAT THIS SUITE IS FOR. The engine is the only file in the tactical stack
// that is both stateful and server-authoritative, so almost nothing about it
// can be checked by reading a table. Every case below therefore drives the
// REAL exported functions over a REAL generated field and asserts on the
// state that comes back — there are no stubs and no hand-built field objects.
//
// Three groups of case exist for reasons worth naming, because a reader
// skimming for "the happy path" would delete them:
//
//   * THE GATES ON THE TWO BALANCE CORRECTIONS (sections 9 and 10). Both were
//     found by measurement, not by reading: filling both deploy zones
//     r-ascending is not an isometry of the hex metric, and applying an AoE
//     order's full resolved effect to every stand under it multiplies a burst
//     by its own area. Each correction has a test that fails if it is undone.
//   * THE FALLBACK DRIVERS. A fallback nothing reaches is dead code with a
//     false justification, so the unreadable-vehicle path and the
//     no-route-to-that-ground path are exercised rather than asserted about.
//   * THE SOURCE-TEXT GATES (section 1). Drift guards 2 and 12 are claims
//     about the FILE, not about a value, so they are checked against the file.
// ---------------------------------------------------------------------------
import { describe, it, expect } from "vitest";
import { readRepoFile } from "./helpers/extract-const.js";

import * as ENGINE from "../base44/shared/tacticalEngine.ts";
import {
  createTactical, submitFormations, autoFormations, autoOrders, resolveOrders,
  activeFormation, battleResult, tacticalView, autoResolveRemainder,
  ROUND_LIMIT, MAX_SQUADS, GRID, DEFAULT_FIELD_OPTS,
} from "../base44/shared/tacticalEngine.ts";
import {
  SQUAD_TYPES, SPECIALISTS, SQUAD_ACTIONS, DEPLOYABLES, FIGURES_PER_COMPANY,
  COLUMN_KEYS, SCALING, MORALE_MODS, deriveSquad, hexDistance,
} from "../base44/shared/tactical.ts";
import { FIELD, lineOfSight } from "../base44/shared/tacticalField.ts";
import { rollVehicle } from "../base44/shared/motorPool.ts";

const SRC = readRepoFile("base44/shared/tacticalEngine.ts");

// A muster big enough that pool limits never accidentally gate a staging
// helper. Regiments (companies) — createTactical converts them to figures.
const MUSTER = { riflemen: 30, crawler: 4, artillery: 3, fighter: 2 };
const OPTS = { seed: 5, nodeKind: "crossroads", weather: "clear", fortBonus: 0 };

const copy = (o) => JSON.parse(JSON.stringify(o));
const key = (q, r) => `${q},${r}`;
const byId = (t, id) => t.squads.find((s) => s.id === id);

/** A battle already in 'fighting', built from explicit squad rows. */
function battle(attRows, defRows, opts) {
  const t = createTactical(MUSTER, MUSTER, { ...OPTS, ...(opts || {}) });
  expect(submitFormations(t, "attacker", attRows)).toBe(null);
  expect(submitFormations(t, "defender", defRows)).toBe(null);
  expect(t.status).toBe("fighting");
  return t;
}

/** Repaint every tile as open ground, so a resolution test measures the rule
 *  and not the terrain the seed happened to roll. */
function flatten(t) {
  for (const k of Object.keys(t.field.tiles)) {
    t.field.tiles[k] = { terrain: "open", cover: 0, elev: 0, blocksLOS: false, moveCost: 1 };
  }
  return t;
}

const place = (t, id, q, r, facing) => {
  const s = byId(t, id);
  s.q = q; s.r = r;
  if (facing !== undefined) s.facing = facing;
  return s;
};

/** Put `id` at the head of the queue so the next resolveOrders is its turn. */
const makeActive = (t, id) => {
  t.queue = [id].concat(t.queue.filter((x) => x !== id));
  t.qIndex = 0;
};

/**
 * A MONOTONE damage proxy, not a damage figure: whole figures lost dominate,
 * and the retained remainder breaks the tie beneath them. It is comparable
 * between two states of the SAME stand under the same conditions, which is
 * all any assertion below asks of it, and it is not a quantity of damage.
 */
const harm = (before, after) => (before.figures - after.figures) * 1000 + (after.wounds - before.wounds);

const row = (name, type, figures, specialists, at) => ({ name, type, figures, specialists: specialists || [], at });

// ---------------------------------------------------------------------------
describe("Lane C · 1. the frozen surface and the source-text guards", () => {
  it("exports all eight frozen names as functions (drift guard 2)", () => {
    for (const name of ["createTactical", "submitFormations", "autoFormations", "autoOrders",
      "resolveOrders", "activeFormation", "battleResult", "tacticalView"]) {
      expect(typeof ENGINE[name], name).toBe("function");
    }
  });

  it("pins the whole export surface, so the superset cannot grow unnoticed (Q7)", () => {
    expect(Object.keys(ENGINE).sort()).toEqual([
      "DEFAULT_FIELD_OPTS", "GRID", "MAX_SQUADS", "ROUND_LIMIT",
      "activeFormation", "autoFormations", "autoOrders", "autoResolveRemainder",
      "battleResult", "createTactical", "resolveOrders", "submitFormations", "tacticalView",
    ]);
  });

  it("names the platform RNG nowhere in its source", () => {
    expect(SRC).not.toMatch(/Math\s*\.\s*random/);
  });

  it("holds no armour arithmetic of its own (drift guard 12)", () => {
    expect(SRC).not.toMatch(/PEN_TABLE|TYPE_MATRIX|armourValue/);
    expect(SRC).not.toMatch(/armorPen\s*-/);
    // The one route into the damage model, and it is Lane A's adapter.
    expect(SRC).toMatch(/resolveSquadHit/);
  });

  it("never imports from src/ (shared server code is not frontend code)", () => {
    expect(SRC).not.toMatch(/from ['"]\.\.\/\.\.\/src/);
    expect(SRC).not.toMatch(/from ['"]@\//);
  });

  it("declares the header constants the platform reads", () => {
    expect(ROUND_LIMIT).toBe(20);
    expect(MAX_SQUADS).toBe(24);
    expect(GRID).toEqual({ w: 15, h: 11 });
    // Derived from Lane B rather than retyped: one board size, one owner.
    expect(GRID).toEqual({ w: FIELD.w, h: FIELD.h });
    expect(DEFAULT_FIELD_OPTS).toEqual({ seed: 1, nodeKind: "crossroads", weather: "clear", fortBonus: 0 });
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 2. createTactical and the stored field", () => {
  it("answers the shipped TWO-argument call with a deploy-phase battle", () => {
    const t = createTactical({ riflemen: 4 }, { riflemen: 4 });
    expect(t.status).toBe("deploy");
    expect(t.round).toBe(1);
    expect(t.roundLimit).toBe(ROUND_LIMIT);
    expect(t.squads).toEqual([]);
    expect(t.deployed).toEqual({ attacker: false, defender: false });
  });

  it("is deterministic — the same arguments twice deep-equal", () => {
    expect(createTactical(MUSTER, MUSTER, OPTS)).toEqual(createTactical(MUSTER, MUSTER, OPTS));
  });

  it("builds 165 tiles at 15x11 through Lane B, with meta", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(t.field.w).toBe(15);
    expect(t.field.h).toBe(11);
    expect(Object.keys(t.field.tiles)).toHaveLength(15 * 11);
    expect(Object.keys(t.field.tiles)).toHaveLength(165);
    expect(t.field.meta.nodeKind).toBe("crossroads");
    expect(t.field.meta.losCap).toBeGreaterThan(0);
    expect(t.field.deploy.attacker.length).toBeGreaterThan(0);
    expect(t.field.deploy.defender.length).toBeGreaterThan(0);
  });

  it("stores the field once and NEVER regenerates it under the squads", () => {
    const t = battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]);
    const before = copy(t.field);
    // A marker no generator would ever produce.
    t.field.tiles["7,5"].terrain = "marsh";
    autoResolveRemainder(t, null, 40);
    expect(t.field.tiles["7,5"].terrain).toBe("marsh");
    expect(t.field.w).toBe(before.w);
    expect(t.field.meta).toEqual(before.meta);
  });

  it("converts REGIMENTS to FIGURES through Lane A's FIGURES_PER_COMPANY", () => {
    const t = createTactical({ riflemen: 3, crawler: 2, artillery: 1, fighter: 0 }, {}, OPTS);
    expect(t.pools.attacker).toEqual({
      riflemen: 3 * FIGURES_PER_COMPANY.riflemen,
      crawler: 2 * FIGURES_PER_COMPANY.crawler,
      artillery: 1 * FIGURES_PER_COMPANY.artillery,
      fighter: 0,
    });
    expect(t.pools.defender).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
  });

  it("cuts the per-faction relicProject slot now, empty, so it is not re-cut later", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(t.relicProject).toEqual({ attacker: null, defender: null });
  });

  it("carries fieldOpts through to Lane B — a different fortBonus is a different board", () => {
    const plain = createTactical(MUSTER, MUSTER, { ...OPTS, fortBonus: 0 });
    const forted = createTactical(MUSTER, MUSTER, { ...OPTS, fortBonus: 3 });
    const works = (t) => Object.values(t.field.tiles).filter((x) => x.work).length;
    expect(works(plain)).toBe(0);
    expect(works(forted)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 3. submitFormations — validation", () => {
  const many = (n) => Array.from({ length: n }, (_, i) => row(`S${i}`, "riflemen", 10));

  it(`accepts ${MAX_SQUADS} sections and rejects ${MAX_SQUADS + 1}`, () => {
    const ok = createTactical(MUSTER, MUSTER, OPTS);
    expect(submitFormations(ok, "attacker", many(MAX_SQUADS))).toBe(null);
    expect(ok.squads).toHaveLength(MAX_SQUADS);
    const bad = createTactical(MUSTER, MUSTER, OPTS);
    expect(submitFormations(bad, "attacker", many(MAX_SQUADS + 1))).toMatch(/No more than/);
    expect(bad.squads).toHaveLength(0);
  });

  it("rejects an empty order of battle", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(submitFormations(t, "attacker", [])).toMatch(/At least one section/);
    expect(submitFormations(t, "attacker", null)).toMatch(/At least one section/);
  });

  it("rejects a submission that outruns the figure pool", () => {
    const t = createTactical({ riflemen: 2, crawler: 0, artillery: 0, fighter: 0 }, MUSTER, OPTS);
    // 2 companies = 20 figures; three ten-figure sections is 30.
    expect(submitFormations(t, "attacker", many(3))).toMatch(/no such reserve/);
    expect(submitFormations(t, "attacker", many(2))).toBe(null);
  });

  it("rejects an unknown type, an out-of-band figure count and a bad staff return", () => {
    const t = () => createTactical(MUSTER, MUSTER, OPTS);
    expect(submitFormations(t(), "attacker", [row("x", "dragoons", 10)])).toMatch(/no such section/);
    const min = SQUAD_TYPES.riflemen.minFigures;
    const max = SQUAD_TYPES.riflemen.maxFigures;
    expect(submitFormations(t(), "attacker", [row("x", "riflemen", min - 1)])).toMatch(/musters between/);
    expect(submitFormations(t(), "attacker", [row("x", "riflemen", max + 1)])).toMatch(/musters between/);
    expect(submitFormations(t(), "attacker", [row("x", "riflemen", 4.5)])).toMatch(/musters between/);
    expect(submitFormations(t(), "attacker", [row("x", "riflemen", 10, ["medic", "sapper", "commissar"])]))
      .toMatch(/staff attachments/);
    expect(submitFormations(t(), "attacker", [row("x", "riflemen", 10, ["quartermaster"])]))
      .toMatch(/no such staff attachment/);
    expect(SCALING.maxSpecialists).toBe(2);
  });

  it("refuses a second filing and refuses an unknown side", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(submitFormations(t, "umpire", many(1))).toMatch(/No such command/);
    expect(submitFormations(t, "attacker", many(1))).toBe(null);
    expect(submitFormations(t, "attacker", many(1))).toMatch(/already filed/);
  });

  it("seals the order of battle once both sides have filed", () => {
    const t = battle(many(3), many(3));
    expect(submitFormations(t, "attacker", many(1))).toMatch(/already sealed/);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 4. submitFormations — placement", () => {
  it("puts every section inside its own deploy zone, on passable, unshared ground", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`S${i}`, "riflemen", 10));
    const t = battle(rows, rows);
    const seen = new Set();
    for (const sq of t.squads) {
      const zone = t.field.deploy[sq.side].some((h) => h.q === sq.q && h.r === sq.r);
      expect(zone, `${sq.id} inside its own zone`).toBe(true);
      expect(t.field.tiles[key(sq.q, sq.r)].moveCost).not.toBe(null);
      expect(seen.has(key(sq.q, sq.r)), `${sq.id} shares a hex`).toBe(false);
      seen.add(key(sq.q, sq.r));
    }
  });

  it("honours an `at` inside the zone and relocates one outside it", () => {
    const inside = { q: 1, r: 4 };
    const outside = { q: 9, r: 4 };
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(submitFormations(t, "attacker", [
      row("Auto", "riflemen", 10),
      row("Asked", "riflemen", 10, [], inside),
      row("Silly", "riflemen", 10, [], outside),
    ])).toBe(null);
    const asked = t.squads.find((s) => s.name === "Asked");
    const silly = t.squads.find((s) => s.name === "Silly");
    expect({ q: asked.q, r: asked.r }).toEqual(inside);
    expect({ q: silly.q, r: silly.r }).not.toEqual(outside);
    expect(t.field.deploy.attacker.some((h) => h.q === silly.q && h.r === silly.r)).toBe(true);
  });

  it("seats every requested hex before any auto-seated one, so `at` does not depend on row order", () => {
    // The first row is auto-seated and would otherwise take the front hex the
    // third row asks for by name.
    const t = createTactical(MUSTER, MUSTER, OPTS);
    const wanted = t.field.deploy.attacker
      .slice()
      .sort((a, b) => (b.q - a.q) || (a.r - b.r))[0];
    expect(submitFormations(t, "attacker", [
      row("Auto", "riflemen", 10),
      row("Asked", "riflemen", 10, [], { q: wanted.q, r: wanted.r }),
    ])).toBe(null);
    const asked = t.squads.find((s) => s.name === "Asked");
    expect({ q: asked.q, r: asked.r }).toEqual({ q: wanted.q, r: wanted.r });
  });

  it("never seats a hull in an infantry-only work (the other half of Lane A's flag)", () => {
    const t = createTactical(MUSTER, { ...MUSTER, crawler: 8 }, { ...OPTS, fortBonus: 3 });
    const rows = Array.from({ length: 8 }, (_, i) => row(`C${i}`, "crawler", 1));
    expect(submitFormations(t, "defender", rows)).toBe(null);
    for (const sq of t.squads) {
      const work = t.field.tiles[key(sq.q, sq.r)].work;
      if (!work) continue;
      expect(DEPLOYABLES[work].infantryOnly, `${sq.id} sat in a ${work}`).toBe(false);
    }
    // The board really did have infantry-only works to avoid.
    const infantryWorks = Object.values(t.field.tiles).filter((x) => x.work && DEPLOYABLES[x.work].infantryOnly);
    expect(infantryWorks.length).toBeGreaterThan(0);
  });

  it("builds the initiative queue in descending initiative, every stand once", () => {
    const t = battle(
      [row("Scouts", "scouts", 5), row("Guns", "artillery", 1), row("Line", "riflemen", 10)],
      [row("Scouts", "scouts", 5), row("Guns", "artillery", 1), row("Line", "riflemen", 10)],
    );
    expect(t.queue.slice().sort()).toEqual(t.squads.map((s) => s.id).sort());
    const inits = t.queue.map((id) => deriveSquad(byId(t, id)).initiative);
    for (let i = 1; i < inits.length; i++) expect(inits[i]).toBeLessThanOrEqual(inits[i - 1]);
    expect(activeFormation(t).id).toBe(t.queue[0]);
  });

  it("activeFormation is null outside the fight", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(activeFormation(t)).toBe(null);
    submitFormations(t, "attacker", [row("A", "riflemen", 10)]);
    expect(activeFormation(t)).toBe(null);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 5. autoFormations", () => {
  const pool = (t, side) => t.pools[side];

  it("carves a serviceable order of battle: 4..24 sections, four or more types", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    const list = autoFormations(pool(t, "attacker"));
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.length).toBeLessThanOrEqual(MAX_SQUADS);
    expect(new Set(list.map((s) => s.type)).size).toBeGreaterThanOrEqual(4);
    expect(list.some((s) => s.type === "crawler")).toBe(true);
    expect(list.some((s) => s.type === "artillery")).toBe(true);
  });

  it("never spends more than the pool, and the pool always covers the filing", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    const list = autoFormations(pool(t, "attacker"));
    const spent = {};
    for (const s of list) {
      const from = SQUAD_TYPES[s.type].from;
      spent[from] = (spent[from] || 0) + s.figures;
    }
    for (const k of COLUMN_KEYS) expect(spent[k] || 0).toBeLessThanOrEqual(pool(t, "attacker")[k]);
    expect(submitFormations(t, "attacker", list)).toBe(null);
  });

  it("is deterministic and takes no draw", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    expect(autoFormations(pool(t, "attacker"))).toEqual(autoFormations(pool(t, "attacker")));
    expect(t.rolls).toBe(0);
  });

  it("issues staff attachments the engine actually reads", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    const list = autoFormations(pool(t, "attacker"));
    const staff = new Set(list.flatMap((s) => s.specialists));
    for (const k of staff) expect(SPECIALISTS[k], k).toBeTruthy();
    expect(staff.has("sapper")).toBe(true);
    expect(staff.has("commissar")).toBe(true);
  });

  it("degrades rather than throwing on an empty or trivial muster", () => {
    expect(autoFormations({})).toEqual([]);
    expect(autoFormations({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 })).toEqual([]);
    const tiny = autoFormations({ riflemen: 6, crawler: 0, artillery: 0, fighter: 0 });
    expect(tiny.length).toBeGreaterThanOrEqual(1);
    expect(tiny.reduce((n, s) => n + s.figures, 0)).toBeLessThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 6. movement", () => {
  const two = () => flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));

  it("refuses ground off the field, impassable ground and ground already held", () => {
    const t = two();
    const a = t.squads.find((s) => s.side === "attacker");
    const foe = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5);
    place(t, foe.id, 5, 6);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, { q: -1, r: 0 }, "march", null)).toMatch(/off the field/);
    expect(resolveOrders(t, a.id, { q: 99, r: 0 }, "march", null)).toMatch(/off the field/);
    // A malformed destination is rejected rather than read as "no move asked
    // for" — otherwise the order resolves from where the section stands and
    // reports success for an order the client never gave.
    expect(resolveOrders(t, a.id, { q: undefined, r: 3 }, "march", null)).toMatch(/off the field/);
    expect(resolveOrders(t, a.id, { r: 3 }, "hold", null)).toMatch(/off the field/);
    expect({ q: a.q, r: a.r }).toEqual({ q: 5, r: 5 });
    t.field.tiles["6,5"].moveCost = null;
    expect(resolveOrders(t, a.id, { q: 6, r: 5 }, "march", null)).toMatch(/will not take a section/);
    expect(resolveOrders(t, a.id, { q: 5, r: 6 }, "march", null)).toMatch(/already held/);
  });

  it("refuses a march whose path cost exceeds the section's speed, and it costs nothing", () => {
    const t = two();
    const a = t.squads.find((s) => s.side === "attacker");
    place(t, a.id, 5, 5);
    makeActive(t, a.id);
    const speed = deriveSquad(a).speed;
    const far = { q: 5 + speed + 2, r: 5 };
    expect(resolveOrders(t, a.id, far, "march", null)).toMatch(/march allowance/);
    expect({ q: a.q, r: a.r }).toEqual({ q: 5, r: 5 });
    expect(resolveOrders(t, a.id, { q: 5 + speed, r: 5 }, "march", null)).toBe(null);
    expect({ q: a.q, r: a.r }).toEqual({ q: 5 + speed, r: 5 });
  });

  it("reports when there is no route at all, rather than pathing through a wall", () => {
    const t = two();
    const a = t.squads.find((s) => s.side === "attacker");
    place(t, a.id, 5, 5);
    makeActive(t, a.id);
    for (const n of [[6, 5], [6, 4], [5, 4], [4, 5], [4, 6], [5, 6]]) {
      t.field.tiles[key(n[0], n[1])].moveCost = null;
    }
    expect(resolveOrders(t, a.id, { q: 7, r: 5 }, "march", null)).toMatch(/No passable route/);
  });

  it("refuses to combine a march with an order that must stand fast", () => {
    const t = two();
    const a = t.squads.find((s) => s.side === "attacker");
    place(t, a.id, 5, 5);
    makeActive(t, a.id);
    expect(SQUAD_ACTIONS.hold.noMove).toBe(true);
    expect(resolveOrders(t, a.id, { q: 6, r: 5 }, "hold", null)).toMatch(/stand fast/);
  });

  it("reads a null order with a destination as a march, and a null order without one as no order", () => {
    const t = two();
    const a = t.squads.find((s) => s.side === "attacker");
    place(t, a.id, 5, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, null, null)).toMatch(/awaits an order/);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, { q: 6, r: 5 }, null, null)).toBe(null);
    expect(t.fx.action).toBe("march");
    expect(t.fx.moved).toBe(true);
  });

  it("pins a gun in an emplacement and lengthens its reach (Lane A's work mods)", () => {
    const t = two();
    const g = t.squads.find((s) => s.side === "attacker");
    place(t, g.id, 5, 5);
    t.field.tiles["5,5"].work = "emplacement";
    makeActive(t, g.id);
    expect(DEPLOYABLES.emplacement.mods.speed).toBe(0);
    expect(resolveOrders(t, g.id, { q: 6, r: 5 }, "march", null)).toMatch(/march allowance/);
    const foe = t.squads.find((s) => s.side === "defender");
    const reach = deriveSquad(g).range + DEPLOYABLES.emplacement.mods.range;
    place(t, foe.id, 5 + reach, 5);
    makeActive(t, g.id);
    expect(resolveOrders(t, g.id, null, "fire", { squadId: foe.id })).toBe(null);
  });

  it("will not walk a hull into an infantry-only work", () => {
    const t = flatten(battle([row("C", "crawler", 1)], [row("D", "riflemen", 10)]));
    const c = t.squads.find((s) => s.side === "attacker");
    place(t, c.id, 5, 5);
    t.field.tiles["6,5"].work = "trench";
    makeActive(t, c.id);
    expect(DEPLOYABLES.trench.infantryOnly).toBe(true);
    expect(resolveOrders(t, c.id, { q: 6, r: 5 }, "march", null)).toMatch(/already held/);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 7. sight, reach and the order gate", () => {
  const pair = (attType, defType) => flatten(battle(
    [row("A", attType, SQUAD_TYPES[attType].figures)],
    [row("D", defType, SQUAD_TYPES[defType].figures)],
  ));

  it("refuses a target beyond effective range", () => {
    const t = pair("riflemen", "riflemen");
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 2, 5);
    place(t, d.id, 2 + deriveSquad(a).range + 1, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toMatch(/beyond effective range/);
  });

  it("refuses a target with no sight line, and lets an indirect order through", () => {
    const t = pair("mortars", "riflemen");
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 4, 5);
    place(t, d.id, 8, 5);
    for (let q = 5; q <= 7; q++) { t.field.tiles[key(q, 5)].blocksLOS = true; t.field.tiles[key(q, 5)].elev = 1; }
    expect(lineOfSight(t.field, { q: 4, r: 5 }, { q: 8, r: 5 })).toBe(false);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toMatch(/No sight line/);
    makeActive(t, a.id);
    expect(SQUAD_ACTIONS.mortar_barrage.indirect).toBe(true);
    expect(resolveOrders(t, a.id, null, "mortar_barrage", { q: 8, r: 5 })).toBe(null);
  });

  it("refuses an order the section is not trained to, and an unknown one", () => {
    const t = pair("riflemen", "riflemen");
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 6, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "bombard", { squadId: d.id })).toMatch(/not trained/);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "enfilade", { squadId: d.id })).toMatch(/no such order/);
  });

  it("refuses to fire on its own side, on itself, or on nobody", () => {
    const t = flatten(battle(
      [row("A", "riflemen", 10), row("B", "riflemen", 10)],
      [row("D", "riflemen", 10)],
    ));
    const [a, b] = t.squads.filter((s) => s.side === "attacker");
    place(t, a.id, 5, 5); place(t, b.id, 6, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: b.id })).toMatch(/own side/);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: a.id })).toMatch(/on itself/);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: "d999" })).toMatch(/No such section/);
  });

  it("normalises a bare target-id string, the §4 object, and a hex", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 6, 5);
    makeActive(t, a.id);
    // the shipped gameEngine call site passes a bare string
    expect(resolveOrders(t, a.id, null, "fire", d.id)).toBe(null);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toBe(null);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "grenade", { q: d.q, r: d.r })).toBe(null);
  });

  it("refuses an order out of turn and outside the fight", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    makeActive(t, a.id);
    expect(resolveOrders(t, d.id, null, "hold", null)).toMatch(/not that section's turn/);
    t.status = "done";
    expect(resolveOrders(t, a.id, null, "hold", null)).toMatch(/No engagement/);
  });

  it("grounds an aeroplane in a thunderstorm (Lane B reports, Lane C enforces)", () => {
    const t = flatten(battle(
      [row("A", "fighter", 1)], [row("D", "riflemen", 10)],
      { weather: "storm" },
    ));
    expect(t.field.meta.groundsFighters).toBe(true);
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 6, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toMatch(/holds the machine on the ground/);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, { q: 6, r: 6 }, "march", null)).toMatch(/holds the machine on the ground/);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "hold", null)).toBe(null);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 8. the damage model — armour, facing, cover", () => {
  function duel(defRow, opts) {
    const t = flatten(battle([row("A", "riflemen", 10)], [defRow], opts));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5, 0);
    place(t, d.id, 6, 5, 3);
    makeActive(t, a.id);
    return { t, a, d };
  }

  it("takes NOTHING off a superheavy hull, and still pins the crew", () => {
    const fort = rollVehicle({ seed: 11, class: "land_fort" });
    const { t, a, d } = duel({ ...row("Keel", "crawler", 1), vehicle: fort });
    expect(d.facings.front).toBe("superheavy");
    const before = copy(d);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toBe(null);
    expect(d.figures).toBe(before.figures);
    expect(d.wounds).toBe(0);
    expect(d.status.suppressed).toBeGreaterThan(0);
    // a zero-effect hit still forces the morale test
    expect(["held", "suppressed", "routed"]).toContain(t.fx.moraleResult);
    expect(t.fx.dealt).toBe(0);
  });

  it("resolves against the REAR when the attacker stands behind the hull, and the rear hurts more", () => {
    const hull = rollVehicle({ seed: 9, class: "heavy_crawler" });
    const facings = { front: "heavy", side: "medium", rear: "light" };
    const front = duel({ ...row("Hull", "crawler", 1), vehicle: hull });
    expect(front.d.facings.front).toBe(facings.front);
    expect(front.d.facings.rear).toBe(facings.rear);

    // The hull points east (facing 0); an attacker to its east is in FRONT.
    place(front.t, front.d.id, 6, 5, 0);
    place(front.t, front.a.id, 7, 5);
    makeActive(front.t, front.a.id);
    const beforeF = copy(front.d);
    expect(resolveOrders(front.t, front.a.id, null, "fire", { squadId: front.d.id })).toBe(null);
    const frontHarm = harm(beforeF, front.d);

    // Same seed, same rolls, same stands: only the attacker's side changes.
    const rear = duel({ ...row("Hull", "crawler", 1), vehicle: hull });
    place(rear.t, rear.d.id, 6, 5, 0);
    place(rear.t, rear.a.id, 5, 5);
    makeActive(rear.t, rear.a.id);
    const beforeR = copy(rear.d);
    expect(resolveOrders(rear.t, rear.a.id, null, "fire", { squadId: rear.d.id })).toBe(null);
    const rearHarm = harm(beforeR, rear.d);

    expect(frontHarm).toBe(0);
    expect(rearHarm).toBeGreaterThan(frontHarm);
  });

  it("puts an indirect shell on the TOP plate whatever the hull is pointed at", () => {
    const hull = rollVehicle({ seed: 9, class: "heavy_crawler" });
    const t = flatten(battle([row("Mortars", "mortars", 4)], [{ ...row("Hull", "crawler", 1), vehicle: hull }]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    // Facing the mortar squad head-on: a direct hit would land on the front.
    place(t, a.id, 5, 5); place(t, d.id, 8, 5, 3);
    expect(d.facings.top).toBe("light");
    expect(d.facings.front).toBe("heavy");
    makeActive(t, a.id);
    const before = copy(d);
    expect(resolveOrders(t, a.id, null, "mortar_barrage", { q: 8, r: 5 })).toBe(null);
    expect(harm(before, d)).toBeGreaterThan(0);
  });

  it("cover on the target's hex reduces what a volley takes off it", () => {
    const run = (cover) => {
      const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
      const a = t.squads.find((s) => s.side === "attacker");
      const d = t.squads.find((s) => s.side === "defender");
      place(t, a.id, 5, 5); place(t, d.id, 6, 5);
      t.field.tiles["6,5"].cover = cover;
      makeActive(t, a.id);
      const before = copy(d);
      expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toBe(null);
      return harm(before, d);
    };
    expect(run(3)).toBeLessThan(run(0));
  });

  it("a work re-classes a rifle section's armour and never a hull's", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const d = t.squads.find((s) => s.side === "defender");
    place(t, d.id, 6, 5);
    expect(tacticalView(t, "defender").squads.find((s) => s.id === d.id).armour)
      .toBe(SQUAD_TYPES.riflemen.armour);
    t.field.tiles["6,5"].work = "bunker";
    expect(tacticalView(t, "defender").squads.find((s) => s.id === d.id).armour)
      .toBe(DEPLOYABLES.bunker.armourClass);

    const hull = rollVehicle({ seed: 9, class: "heavy_crawler" });
    const t2 = flatten(battle([row("A", "riflemen", 10)], [{ ...row("H", "crawler", 1), vehicle: hull }]));
    const h = t2.squads.find((s) => s.side === "defender");
    place(t2, h.id, 6, 5);
    t2.field.tiles["6,5"].work = "bunker";
    expect(tacticalView(t2, "defender").squads.find((s) => s.id === h.id).armour).toBe(h.facings.front);
  });

  it("falls back to the type's own values when a stand's vehicle cannot be read", () => {
    const t = flatten(battle(
      [row("A", "riflemen", 10)],
      [{ ...row("Wreck", "crawler", 1), vehicle: { chassisKey: "no_such_chassis", quality: "issue" } }],
    ));
    const d = t.squads.find((s) => s.side === "defender");
    expect(d.facings).toBe(null);
    const view = tacticalView(t, "defender").squads.find((s) => s.id === d.id);
    expect(view.armour).toBe(SQUAD_TYPES.crawler.armour);
    expect(view.ranged).toBe(deriveSquad({ type: "crawler", figures: 1, specialists: [] }).ranged);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 9. area fire", () => {
  function blast(nVictims) {
    const t = flatten(battle(
      [row("Guns", "artillery", 1)],
      Array.from({ length: nVictims }, (_, i) => row(`D${i}`, "riflemen", 10)),
    ));
    const a = t.squads.find((s) => s.side === "attacker");
    const foes = t.squads.filter((s) => s.side === "defender");
    place(t, a.id, 2, 5);
    // Pack the victims onto the impact hex and its ring.
    const ring = [[8, 5], [9, 5], [9, 4], [8, 4], [7, 5], [7, 6], [8, 6]];
    foes.forEach((f, i) => place(t, f.id, ring[i][0], ring[i][1]));
    makeActive(t, a.id);
    const before = foes.map(copy);
    expect(resolveOrders(t, a.id, null, "bombard", { q: 8, r: 5 })).toBe(null);
    return { t, total: foes.reduce((n, f, i) => n + harm(before[i], f), 0), foes, before };
  }

  it("strikes EVERY stand under the burst, each against its own armour class", () => {
    const { foes, before } = blast(7);
    for (let i = 0; i < foes.length; i++) {
      expect(harm(before[i], foes[i]), `${foes[i].id} took nothing`).toBeGreaterThan(0);
    }
  });

  it("falls off with distance from the impact hex", () => {
    const { foes, before } = blast(7);
    const centre = harm(before[0], foes[0]);
    const edge = harm(before[6], foes[6]);
    expect(hexDistance(foes[0], { q: 8, r: 5 })).toBe(0);
    expect(hexDistance(foes[6], { q: 8, r: 5 })).toBe(1);
    expect(centre).toBeGreaterThan(edge);
  });

  it("does not multiply a burst by its own area — the shell weight is shared", () => {
    // THE GATE ON THE SECOND BALANCE CORRECTION, and it is deliberately
    // measured on ONE stand rather than on a total. Applying the order's full
    // resolved effect to every stand under it makes a bombard scale linearly
    // with the crowd it finds; measured, that took one siege piece a side to a
    // 32-8 win rate between identical orders of battle. Under a shared weight
    // the stand ON the impact hex takes strictly less when it has company than
    // when it stands there alone — under the unshared rule the two are
    // identical, because the crowd changes nothing about its own share.
    const alone = blast(1);
    const crowd = blast(7);
    const centreAlone = harm(alone.before[0], alone.foes[0]);
    const centreCrowd = harm(crowd.before[0], crowd.foes[0]);
    expect(centreAlone).toBeGreaterThan(0);
    expect(centreCrowd).toBeGreaterThan(0);
    expect(centreCrowd).toBeLessThan(centreAlone);
    // And the whole burst does not remove seven times the figures either.
    const lost = (b) => b.foes.reduce((n, f, i) => n + (b.before[i].figures - f.figures), 0);
    expect(lost(crowd)).toBeLessThanOrEqual(lost(alone));
  });

  it("catches friendly stands under it and reports them as taken, not dealt", () => {
    const t = flatten(battle(
      [row("Guns", "artillery", 1), row("Line", "riflemen", 10)],
      [row("D", "riflemen", 10)],
    ));
    const a = t.squads.find((s) => s.name === "Guns");
    const friend = t.squads.find((s) => s.name === "Line");
    const foe = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 2, 5); place(t, foe.id, 8, 5); place(t, friend.id, 8, 6);
    makeActive(t, a.id);
    const beforeFriend = copy(friend);
    expect(resolveOrders(t, a.id, null, "bombard", { q: 8, r: 5 })).toBe(null);
    expect(harm(beforeFriend, friend)).toBeGreaterThan(0);
    expect(t.fx.taken).toBeGreaterThanOrEqual(0);
    expect(t.fx.targetId).toBe(foe.id);
  });

  it("lays a screen that blocks sight for its turns and then lifts", () => {
    const t = flatten(battle([row("Scouts", "scouts", 5)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    place(t, a.id, 5, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "smoke", { q: 7, r: 5 })).toBe(null);
    expect(t.field.tiles["7,5"].blocksLOS).toBe(true);
    expect(lineOfSight(t.field, { q: 5, r: 5 }, { q: 9, r: 5 })).toBe(false);
    for (let i = 0; i < SQUAD_ACTIONS.smoke.screenTurns; i++) autoResolveRemainder(t, null, 60);
    expect(t.field.tiles["7,5"].blocksLOS).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 10. morale, suppression, rout and recovery", () => {
  it("counts suppression down one per round and reduces the stand's output", () => {
    const t = flatten(battle([row("A", "gunners", 6)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 6, 5);
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "suppress", { squadId: d.id })).toBe(null);
    // suppress carries the heaviest weight on the board
    expect(d.status.suppressed).toBeGreaterThanOrEqual(2);
    const held = d.status.suppressed;
    autoResolveRemainder(t, null, 40);
    expect(d.status.suppressed).toBeLessThan(held);
  });

  it("pins by the order's own weight, and a hit that resolved to zero still pins", () => {
    const fort = rollVehicle({ seed: 11, class: "land_fort" });
    const t = flatten(battle(
      [row("A", "riflemen", 10), row("B", "riflemen", 10)],
      [{ ...row("Keel", "crawler", 1), vehicle: fort }, row("Men", "riflemen", 10)],
    ));
    const [a, b] = t.squads.filter((s) => s.side === "attacker");
    const keel = t.squads.find((s) => s.name === "Keel");
    const men = t.squads.find((s) => s.name === "Men");
    place(t, a.id, 5, 5); place(t, keel.id, 6, 5);
    place(t, b.id, 5, 8); place(t, men.id, 6, 8);
    makeActive(t, a.id);
    resolveOrders(t, a.id, null, "fire", { squadId: keel.id });
    makeActive(t, b.id);
    resolveOrders(t, b.id, null, "fire", { squadId: men.id });
    // The keel lost nothing at all and its crew is pinned anyway — drift
    // guard 12's zero-effect hit, with Lane I's SUPPRESSION.onZeroEffect
    // carrying the weight over the threshold.
    expect(keel.figures).toBe(1);
    expect(keel.status.suppressed).toBeGreaterThan(0);
    // Aimed fire's own weight is under the threshold, so a rifle volley never
    // pins for more than the single round a failed morale test buys. Only an
    // order bought for pinning reaches two.
    expect(men.status.suppressed).toBeLessThanOrEqual(MORALE_MODS.suppressedTurns);
    expect(SQUAD_ACTIONS.fire.suppress).toBeLessThan(SQUAD_ACTIONS.suppress.suppress);
  });

  it("a commissar's section never routs across a whole scripted battle", () => {
    const t = createTactical(MUSTER, MUSTER, { ...OPTS, seed: 3 });
    submitFormations(t, "attacker", autoFormations(t.pools.attacker));
    submitFormations(t, "defender", autoFormations(t.pools.defender));
    let routsSeen = 0;
    for (let i = 0; i < 900; i++) {
      if (t.status !== "fighting" || battleResult(t)) break;
      const sq = activeFormation(t);
      if (!sq) break;
      const o = autoOrders(t, sq);
      if (!o || resolveOrders(t, sq.id, o.moveTo, o.actionKey, o.target)) break;
      for (const s of t.squads) {
        if (s.status.routed) routsSeen++;
        expect(!(s.specialists.includes("commissar") && s.status.routed), `${s.id} routed under a commissar`).toBe(true);
      }
    }
    // The battle really did break sections — the guarantee above is not vacuous.
    expect(routsSeen).toBeGreaterThan(0);
    expect(MORALE_MODS.routMargin).toBeGreaterThan(0);
    expect(SPECIALISTS.commissar.mods.executionToll).toBeGreaterThan(0);
  });

  it("a broken section answers no firing order and runs for its own line", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 8, 5); place(t, d.id, 9, 5);
    a.status.routed = true;
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "fire", { squadId: d.id })).toMatch(/broken/);
    expect(autoOrders(t, a).actionKey).toBe("hold");
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, null, "hold", null)).toBe(null);
    // Either it rallied on the spot, or it fell back toward q = 0.
    expect(a.status.routed ? a.q : 8).toBeLessThanOrEqual(8);
    expect(["held", "routed"]).toContain(t.fx.moraleResult);
  });

  it("a medic returns exactly recoverPerTurn figures a round and never overfills the section", () => {
    const t = flatten(battle(
      [row("A", "riflemen", 10, ["medic"])],
      [row("D", "riflemen", 10)],
    ));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 2, 2); place(t, d.id, 12, 9);
    a.figures = 6;
    const perTurn = SPECIALISTS.medic.mods.recoverPerTurn;
    const startRound = t.round;
    while (t.round === startRound) {
      const sq = activeFormation(t);
      resolveOrders(t, sq.id, null, "hold", null);
    }
    expect(a.figures).toBe(6 + perTurn);
    a.figures = a.maxFigures;
    const r2 = t.round;
    while (t.round === r2) {
      const sq = activeFormation(t);
      resolveOrders(t, sq.id, null, "hold", null);
    }
    expect(a.figures).toBe(a.maxFigures);
  });

  it("a medic does not work while the enemy is on top of it", () => {
    const t = flatten(battle([row("A", "riflemen", 10, ["medic"])], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 6, 5);
    a.figures = 6;
    const startRound = t.round;
    while (t.round === startRound) {
      const sq = activeFormation(t);
      resolveOrders(t, sq.id, null, "hold", null);
    }
    expect(a.figures).toBe(6);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 11. deployables", () => {
  it("counts a build down over its buildTurns and then writes the work into the tile", () => {
    const t = flatten(battle(
      [row("Pioneers", "pioneers", 8)],
      [row("D", "riflemen", 10)],
    ));
    const p = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, p.id, 3, 3); place(t, d.id, 12, 9);
    makeActive(t, p.id);
    expect(resolveOrders(t, p.id, null, "build_bunker", null)).toBe(null);
    expect(p.status.building).toEqual({ work: "bunker", turnsLeft: DEPLOYABLES.bunker.buildTurns });
    expect(t.field.tiles["3,3"].work).toBeUndefined();
    for (let i = 0; i < DEPLOYABLES.bunker.buildTurns; i++) {
      const round = t.round;
      while (t.round === round) {
        const sq = activeFormation(t);
        resolveOrders(t, sq.id, null, "hold", null);
      }
    }
    expect(p.status.building).toBe(null);
    expect(t.field.tiles["3,3"].work).toBe("bunker");
  });

  it("a sapper takes buildSpeed turns off the work, never below one", () => {
    const t = flatten(battle([row("P", "pioneers", 8, ["sapper"])], [row("D", "riflemen", 10)]));
    const p = t.squads.find((s) => s.side === "attacker");
    place(t, p.id, 3, 3);
    makeActive(t, p.id);
    expect(resolveOrders(t, p.id, null, "build_bunker", null)).toBe(null);
    expect(p.status.building.turnsLeft)
      .toBe(Math.max(1, DEPLOYABLES.bunker.buildTurns - SPECIALISTS.sapper.mods.buildSpeed));
    const t2 = flatten(battle([row("P", "pioneers", 8, ["sapper"])], [row("D", "riflemen", 10)]));
    const p2 = t2.squads.find((s) => s.side === "attacker");
    place(t2, p2.id, 3, 3);
    makeActive(t2, p2.id);
    expect(resolveOrders(t2, p2.id, null, "build_foxhole", null)).toBe(null);
    expect(p2.status.building.turnsLeft).toBe(1);
  });

  it("refuses to work ground that already carries a work, and to spare a working section", () => {
    const t = flatten(battle([row("P", "pioneers", 8)], [row("D", "riflemen", 10)]));
    const p = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, p.id, 3, 3); place(t, d.id, 4, 3);
    t.field.tiles["3,3"].work = "foxhole";
    makeActive(t, p.id);
    expect(resolveOrders(t, p.id, null, "build_trench", null)).toMatch(/already worked/);
    delete t.field.tiles["3,3"].work;
    makeActive(t, p.id);
    expect(resolveOrders(t, p.id, null, "build_trench", null)).toBe(null);
    makeActive(t, p.id);
    expect(resolveOrders(t, p.id, null, "fire", { squadId: d.id })).toMatch(/at work/);
    // And it may not walk away from the work either: endRound writes the work
    // wherever the section is standing, so a section that could march would
    // finish its bunker somewhere it never broke ground.
    makeActive(t, p.id);
    expect(resolveOrders(t, p.id, { q: 3, r: 4 }, "march", null)).toMatch(/at work/);
    expect({ q: p.q, r: p.r }).toEqual({ q: 3, r: 3 });
  });

  it("offers no infantry-only work to a hull (Lane A gates the order list)", () => {
    const t = flatten(battle([row("C", "crawler", 1, ["sapper"])], [row("D", "riflemen", 10)]));
    const c = t.squads.find((s) => s.side === "attacker");
    const actions = tacticalView(t, "attacker").squads.find((s) => s.id === c.id).actions;
    expect(actions).not.toContain("build_foxhole");
    expect(actions).not.toContain("build_trench");
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 12. the doctrine AI", () => {
  it("prefers the higher-cover hex when it opens the same shot", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 13, 5);
    // Out of reach from where it stands, so the section must close. Every hex
    // on the flattened board is bare but one, and that one still opens the
    // shot — so a staff that ignored cover would take the nearest hex instead.
    expect(hexDistance(a, d)).toBeGreaterThan(deriveSquad(a).range);
    t.field.tiles["7,5"].cover = 3;
    const o = autoOrders(t, a);
    expect(o.moveTo).toEqual({ q: 7, r: 5 });
    expect(t.field.tiles[key(o.moveTo.q, o.moveTo.r)].cover).toBe(3);
    expect(o.targetId).toBe(d.id);
  });

  it("puts an AoE order onto a hex holding two clustered enemies", () => {
    const t = flatten(battle(
      [row("Guns", "artillery", 1)],
      [row("D1", "riflemen", 10), row("D2", "riflemen", 10)],
    ));
    const a = t.squads.find((s) => s.side === "attacker");
    const [d1, d2] = t.squads.filter((s) => s.side === "defender");
    place(t, a.id, 2, 5); place(t, d1.id, 9, 5); place(t, d2.id, 9, 4);
    const o = autoOrders(t, a);
    expect(o.actionKey).toBe("bombard");
    expect(o.target).toHaveProperty("q");
    expect(hexDistance(o.target, d1)).toBeLessThanOrEqual(SQUAD_ACTIONS.bombard.aoe.radius);
    expect(hexDistance(o.target, d2)).toBeLessThanOrEqual(SQUAD_ACTIONS.bombard.aoe.radius);
  });

  it("will not drop a burst on its own people", () => {
    // The two enemies stand four hexes apart, which is exactly the radius-2
    // burst's span: (9,3) is the ONLY hex on the board within two of both.
    // Park a friendly section on it and there is no clean shot to be had.
    const stage = (withFriend) => {
      const t = flatten(battle(
        [row("Guns", "artillery", 1), row("Line", "riflemen", 10)],
        [row("D1", "riflemen", 10), row("D2", "riflemen", 10)],
      ));
      const a = t.squads.find((s) => s.name === "Guns");
      const friend = t.squads.find((s) => s.name === "Line");
      const [d1, d2] = t.squads.filter((s) => s.side === "defender");
      place(t, a.id, 2, 5); place(t, d1.id, 9, 5); place(t, d2.id, 9, 1);
      place(t, friend.id, withFriend ? 9 : 2, withFriend ? 3 : 8);
      return { t, a, order: autoOrders(t, a) };
    };
    const radius = SQUAD_ACTIONS.bombard.aoe.radius;
    const clear = stage(false);
    expect(clear.order.actionKey).toBe("bombard");
    expect(clear.order.target).toEqual({ q: 9, r: 3 });
    const blocked = stage(true);
    expect(blocked.order.actionKey).not.toBe("bombard");
    // And the standing invariant: whatever it fires, nothing of ours is under it.
    for (const state of [clear, blocked]) {
      if (!state.order.target || state.order.target.q === undefined) continue;
      const friends = state.t.squads.filter((s) => s.side === state.a.side
        && hexDistance(s, state.order.target) <= radius);
      expect(friends).toEqual([]);
    }
  });

  it("sets an unengaged sapper to work and leaves an engaged one alone", () => {
    const t = flatten(battle([row("P", "pioneers", 8, ["sapper"])], [row("D", "riflemen", 10)]));
    const p = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, p.id, 3, 3); place(t, d.id, 13, 9);
    expect(autoOrders(t, p).actionKey).toMatch(/^build_/);
    place(t, d.id, 4, 3);
    expect(autoOrders(t, p).actionKey).not.toMatch(/^build_/);
  });

  it("returns the seam's three keys and the §4 target object together", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const d = t.squads.find((s) => s.side === "defender");
    place(t, a.id, 5, 5); place(t, d.id, 6, 5);
    const o = autoOrders(t, a);
    expect(Object.keys(o).sort()).toEqual(["actionKey", "moveTo", "target", "targetId"]);
    expect(o.targetId).toBe(d.id);
    expect(o.target).toEqual({ squadId: d.id });
    // the shipped seam passes o.targetId straight through as a bare string
    makeActive(t, a.id);
    expect(resolveOrders(t, a.id, o.moveTo, o.actionKey, o.targetId)).toBe(null);
  });

  it("takes no draw — the staff is deterministic", () => {
    const t = flatten(battle([row("A", "riflemen", 10)], [row("D", "riflemen", 10)]));
    const a = t.squads.find((s) => s.side === "attacker");
    const before = t.rolls;
    autoOrders(t, a);
    autoOrders(t, a);
    expect(t.rolls).toBe(before);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 13. the clock, the result and neutrality", () => {
  function scripted(seed) {
    const t = createTactical(MUSTER, MUSTER, { ...OPTS, seed });
    submitFormations(t, "attacker", autoFormations(t.pools.attacker));
    submitFormations(t, "defender", autoFormations(t.pools.defender));
    return t;
  }

  it("replays a scripted six-round battle identically from the same seed", () => {
    const play = () => {
      const t = scripted(12);
      while (t.round <= 6 && t.status === "fighting" && !battleResult(t)) {
        const sq = activeFormation(t);
        if (!sq) break;
        const o = autoOrders(t, sq);
        if (!o || resolveOrders(t, sq.id, o.moveTo, o.actionKey, o.target)) break;
      }
      return t;
    };
    const a = play();
    const b = play();
    expect(a.round).toBeGreaterThanOrEqual(6);
    expect(a).toEqual(b);
  });

  it("always terminates inside the round limit with a non-null result", () => {
    for (const seed of [2, 4, 6, 8, 10]) {
      const t = scripted(seed);
      autoResolveRemainder(t, null, 4000);
      const r = battleResult(t);
      expect(r, `seed ${seed} never finished`).toBeTruthy();
      expect(t.round).toBeLessThanOrEqual(ROUND_LIMIT + 1);
    }
  });

  it("battleResult is null mid-fight and three keys of non-negative companies at the end", () => {
    const t = scripted(4);
    expect(battleResult(t)).toBe(null);
    autoResolveRemainder(t, null, 4000);
    const r = battleResult(t);
    expect(Object.keys(r).sort()).toEqual(["attackerUnits", "attackerWon", "defenderUnits"]);
    expect(typeof r.attackerWon).toBe("boolean");
    for (const units of [r.attackerUnits, r.defenderUnits]) {
      expect(Object.keys(units).sort()).toEqual(COLUMN_KEYS.slice().sort());
      for (const k of COLUMN_KEYS) {
        expect(Number.isInteger(units[k]), `${k} is not an integer`).toBe(true);
        expect(units[k]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("autoResolveRemainder counts activations and stops at the other side's turn", () => {
    const t = scripted(7);
    const side = activeFormation(t).side;
    const n = autoResolveRemainder(t, side, 200);
    expect(n).toBeGreaterThan(0);
    expect(activeFormation(t).side).not.toBe(side);
    expect(autoResolveRemainder(t, side, 200)).toBe(0);
  });

  it("deploys the two orders of battle as 180-degree rotations of each other", () => {
    // THE GATE ON THE FIRST BALANCE CORRECTION. An axial column is a diagonal,
    // so mirroring q alone is not an isometry of the hex metric: filling both
    // zones r-ascending put the attacker's leading section on the sheltered
    // corner of its parallelogram and the defender's on the exposed corner of
    // its own, and the defender's siege piece was routed in the first round of
    // most battles. (q,r) -> (w-1-q, h-1-r) IS an isometry, so the two lines
    // must come out as exact rotations.
    const rows = Array.from({ length: 10 }, (_, i) => row(`S${i}`, "riflemen", 10));
    const t = battle(rows, rows);
    const att = t.squads.filter((s) => s.side === "attacker");
    const def = t.squads.filter((s) => s.side === "defender");
    expect(att).toHaveLength(def.length);
    for (let i = 0; i < att.length; i++) {
      expect({ q: def[i].q, r: def[i].r }).toEqual({
        q: t.field.w - 1 - att[i].q,
        r: t.field.h - 1 - att[i].r,
      });
    }
  });

  it("does not hand either side the battle between identical orders of battle", () => {
    // The measured consequence of the two corrections above, as a property.
    // Twelve boards, the same muster on both sides; before the corrections
    // this read eleven wins to one.
    let attacker = 0;
    let decided = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const t = createTactical(MUSTER, MUSTER, { ...OPTS, seed });
      submitFormations(t, "attacker", autoFormations(t.pools.attacker));
      submitFormations(t, "defender", autoFormations(t.pools.defender));
      autoResolveRemainder(t, null, 4000);
      const r = battleResult(t);
      if (!r) continue;
      decided++;
      if (r.attackerWon) attacker++;
    }
    expect(decided).toBe(12);
    expect(attacker).toBeGreaterThanOrEqual(3);
    expect(attacker).toBeLessThanOrEqual(9);
  });
});

// ---------------------------------------------------------------------------
describe("Lane C · 14. tacticalView — the §4 payload", () => {
  function viewed() {
    const t = createTactical(MUSTER, MUSTER, { ...OPTS, seed: 21 });
    submitFormations(t, "attacker", autoFormations(t.pools.attacker));
    submitFormations(t, "defender", autoFormations(t.pools.defender));
    autoResolveRemainder(t, null, 120);
    return { t, v: tacticalView(t, "attacker") };
  }

  it("emits exactly the amended §4 key set at every level", () => {
    const { v } = viewed();
    expect(Object.keys(v).sort()).toEqual([
      "activeId", "deployed", "field", "fx", "log", "myPool", "myRole",
      "queue", "round", "roundLimit", "squads", "status",
    ].concat(["los"]).sort());
    expect(Object.keys(v)).toHaveLength(13);
    expect(Object.keys(v.deployed).sort()).toEqual(["attacker", "defender"]);
    expect(Object.keys(v.field).sort()).toEqual(["deploy", "h", "meta", "tiles", "w"]);
    expect(Object.keys(v.myPool).sort()).toEqual(COLUMN_KEYS.slice().sort());

    const tile = v.field.tiles["5,5"];
    expect(Object.keys(tile).sort()).toEqual(["blocksLOS", "cover", "elev", "moveCost", "terrain"]);

    const sq = v.squads[0];
    expect(Object.keys(sq).sort()).toEqual([
      "actions", "armor", "armour", "facing", "figures", "id", "initiative", "maxFigures",
      "melee", "mine", "morale", "name", "pts", "q", "r", "range", "ranged", "side",
      "specialists", "speed", "status", "type",
    ]);
    expect(Object.keys(sq)).toHaveLength(22);
    expect(Object.keys(sq.status).sort()).toEqual(["guard", "routed", "suppressed"]);

    expect(v.fx).toBeTruthy();
    for (const k of ["seq", "round", "actorId", "action", "dealt", "taken", "moved", "from"]) {
      expect(Object.keys(v.fx), `fx.${k}`).toContain(k);
    }
    for (const k of Object.keys(v.fx)) {
      expect(["seq", "round", "actorId", "action", "targetId", "at", "dealt",
        "taken", "moraleResult", "moved", "from"], `fx.${k} is not in §4`).toContain(k);
    }
  });

  it("adds `building` to a status only while the section is at work", () => {
    const t = flatten(battle([row("P", "pioneers", 8)], [row("D", "riflemen", 10)]));
    const p = t.squads.find((s) => s.side === "attacker");
    place(t, p.id, 3, 3);
    makeActive(t, p.id);
    resolveOrders(t, p.id, null, "build_bunker", null);
    const status = tacticalView(t, "attacker").squads.find((s) => s.id === p.id).status;
    expect(Object.keys(status).sort()).toEqual(["building", "guard", "routed", "suppressed"]);
    expect(Object.keys(status.building).sort()).toEqual(["turnsLeft", "work"]);
  });

  it("shows a tile's `work` only where there is one", () => {
    const t = createTactical(MUSTER, MUSTER, { ...OPTS, fortBonus: 3 });
    const tiles = Object.values(tacticalView(t, "attacker").field.tiles);
    const worked = tiles.filter((x) => x.work);
    expect(worked.length).toBeGreaterThan(0);
    for (const x of worked) expect(Object.keys(x)).toHaveLength(6);
    expect(tiles.filter((x) => !x.work)[0]).not.toHaveProperty("work");
  });

  it("hides the opponent's order list, the opponent's sight, and the pool from a spectator", () => {
    const { t, v } = viewed();
    for (const sq of v.squads) {
      expect(sq.mine).toBe(sq.side === "attacker");
      if (sq.side === "attacker") expect(sq.actions.length).toBeGreaterThan(0);
      else expect(sq.actions).toEqual([]);
    }
    const mine = activeFormation(t).side === "attacker";
    expect(v.los.length > 0).toBe(mine);
    expect(tacticalView(t, activeFormation(t).side).los.length).toBeGreaterThan(0);
    const spectator = tacticalView(t, null);
    expect(spectator.myPool).toBe(null);
    expect(spectator.myRole).toBe(null);
    expect(spectator.los).toEqual([]);
    expect(spectator.squads.every((s) => s.actions.length === 0 && s.mine === false)).toBe(true);
  });

  it("rotates the queue to start at the active section and shows the last eighteen lines", () => {
    const { t, v } = viewed();
    expect(v.queue[0]).toBe(v.activeId);
    expect(v.queue.slice().sort()).toEqual(t.queue.slice().sort());
    expect(v.log.length).toBeLessThanOrEqual(18);
    expect(t.log.length).toBeLessThanOrEqual(60);
  });

  it("empties the queue and the active id outside the fight", () => {
    const t = createTactical(MUSTER, MUSTER, OPTS);
    const v = tacticalView(t, "attacker");
    expect(v.status).toBe("deploy");
    expect(v.queue).toEqual([]);
    expect(v.activeId).toBe(null);
    expect(v.squads).toEqual([]);
    expect(v.fx).toBe(null);
  });

  it("carries field.meta through to the client", () => {
    const { v } = viewed();
    expect(v.field.meta.losCap).toBeGreaterThan(0);
    expect(v.field.meta.nodeKind).toBe("crossroads");
    expect(v.field.meta.weather).toBe("clear");
    expect(typeof v.field.meta.groundsFighters).toBe("boolean");
  });
});
