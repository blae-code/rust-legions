// Catalog-mirror invariant — the mechanical enforcement of CLAUDE.md's "One
// Critical Invariant" for the research/armory catalog. `base44/shared/catalog.ts`
// is canonical; `src/lib/doctrine.js` and `src/lib/armory.js` are its frontend
// mirrors. The canonical side is lifted TEXTUALLY (the module is a Deno file that
// cannot be imported here) and compared deep-equal against the mirrors, which are
// imported normally. If either side drifts, CI fails.
//
// It is also the STRUCTURE gate for the catalog: the shapes in
// `docs/TACTICAL_SQUAD_PLAN.md` §4, the tier/cost curve, the prereq DAG, the
// effect-key vocabulary and the byte-identity of every legacy key that live saves
// reference. A row that satisfies the mirror but breaks a rule fails here.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";

import { TECHS as MIRROR_TECHS, CREEDS as MIRROR_CREEDS, DOCTRINE_BRANCHES, techsByBranch, prereqList } from "@/lib/doctrine.js";

const catalogSrc = readRepoFile("base44/shared/catalog.ts");
const CANON = (name) => extractConst(catalogSrc, name);

const TECHS = CANON("TECHS");
const CREEDS = CANON("CREEDS");

// ── The frozen sets. Changing any of these is a contract change, not a test fix. ──

const CREED_KEYS = ["recall", "finished_ledger", "flight", "discarding"];
const BRANCHES = ["armament", "industry", "logistics", "signals", "reclamation"];
const TIER_COST = { 1: 3, 2: 4, 3: 6, 4: 9 };
const SCOPES = ["macro", "tactical", "economy"];

// §4's effect-key vocabulary, expanded. The engine applies exactly these keys; a
// row may not invent one without the vocabulary line in §4 being extended first.
const UNIT_TYPES = ["riflemen", "crawler", "gunboat", "fighter", "artillery"];
const UNIT_STATS = ["attack", "defense", "melee", "ranged", "armor", "speed", "morale"];
const EFFECT_KEYS = new Set([
  ...UNIT_TYPES.flatMap((u) => UNIT_STATS.map((s) => `unit.${u}.${s}`)),
  "income.steel", "income.fuel", "income.manpower",
  "armyCap", "supplyRange", "capitalDefense", "initiative",
  "losRange", "digSpeed", "fragmentYield", "moraleTest", "buildTurns",
]);

// The 9 techs that shipped before this catalog existed, copied from
// `git show HEAD:src/lib/doctrine.js`. LIVE SAVES REFERENCE THESE KEYS. They may
// gain the additive fields `key` and `effects[]` and nothing else — no rename, no
// cost change, no prose polish.
const LEGACY_TECHS = {
  standardized_calibers: { branch: "armament", tier: 1, label: "Standardized Calibers", cost: 3, prereq: null, effect: "Riflemen attack +1", desc: "One cartridge for every rifle on the front — no more scavenging mismatched rounds." },
  hardened_plate: { branch: "armament", tier: 2, label: "Hardened Plate", cost: 4, prereq: "standardized_calibers", effect: "Crawler defense +1", desc: "Face-hardened armor rolled in the deep foundries turns all but the heaviest shot." },
  combined_arms: { branch: "armament", tier: 3, label: "Combined Arms Doctrine", cost: 6, prereq: "hardened_plate", effect: "Crawler & fighter attack +1", desc: "Armor, air and infantry strike as one fist — the culmination of the new war." },
  rationalized_foundries: { branch: "industry", tier: 1, label: "Rationalized Foundries", cost: 3, prereq: null, effect: "+1 Steel income", desc: "Time-and-motion men walk the casting floors; the same coal pours more steel." },
  synthetic_fuel: { branch: "industry", tier: 2, label: "Synthetic Fuel Program", cost: 4, prereq: "rationalized_foundries", effect: "+1 Fuel income", desc: "Coal liquefaction plants free the war effort from the shrinking oil fields." },
  total_mobilization: { branch: "industry", tier: 3, label: "Total Mobilization", cost: 6, prereq: "synthetic_fuel", effect: "+1 Manpower income · army cap +20", desc: "Every hand, every furnace, every hour — the entire nation becomes the war machine." },
  field_kitchens: { branch: "logistics", tier: 1, label: "Field Kitchens", cost: 3, prereq: null, effect: "Army cap +10", desc: "An army marches on its stomach; hot rations keep more companies in the field." },
  motorized_supply: { branch: "logistics", tier: 2, label: "Motorized Supply Trains", cost: 4, prereq: "field_kitchens", effect: "Supply range +1", desc: "Trucks replace mules — the supply net reaches one zone deeper into the front." },
  general_staff_academy: { branch: "logistics", tier: 3, label: "General Staff Academy", cost: 6, prereq: "motorized_supply", effect: "Capital defense +1 · riflemen defense +1", desc: "A generation of officers schooled in the hard arithmetic of the trenches." },
};
const LEGACY_TECH_FIELDS = ["branch", "tier", "label", "cost", "prereq", "effect", "desc"];

const pick = (obj, fields) => Object.fromEntries(fields.map((f) => [f, obj[f]]));

describe("catalog mirror — base44/shared/catalog.ts ↔ src/lib", () => {
  it("TECHS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_TECHS).toEqual(TECHS);
  });

  it("CREEDS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_CREEDS).toEqual(CREEDS);
  });

  it("CREEDS declares exactly the four Departures", () => {
    expect(Object.keys(CREEDS).sort()).toEqual([...CREED_KEYS].sort());
  });

  it("every map key equals its row's own `key` field", () => {
    for (const [table, name] of [[TECHS, "TECHS"], [CREEDS, "CREEDS"]]) {
      for (const [key, row] of Object.entries(table)) {
        expect(row.key, `${name}.${key}`).toBe(key);
      }
    }
  });
});

describe("catalog legacy freeze — keys live saves reference", () => {
  it("all 9 legacy tech keys are still present", () => {
    for (const key of Object.keys(LEGACY_TECHS)) {
      expect(TECHS, `legacy tech ${key} was removed or renamed`).toHaveProperty(key);
    }
  });

  for (const [key, row] of Object.entries(LEGACY_TECHS)) {
    it(`${key}: branch/tier/label/cost/prereq/effect/desc are byte-identical`, () => {
      expect(pick(TECHS[key], LEGACY_TECH_FIELDS)).toEqual(row);
    });
  }

  it("no legacy tech carries a creedLock", () => {
    for (const key of Object.keys(LEGACY_TECHS)) {
      expect(TECHS[key].creedLock, `legacy tech ${key}`).toBeUndefined();
    }
  });
});

describe("the doctrine tree — shape", () => {
  const entries = Object.entries(TECHS);

  it("declares at least 20 techs", () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it("declares exactly the 5 named branches, all of them display-registered", () => {
    expect([...new Set(entries.map(([, t]) => t.branch))].sort()).toEqual([...BRANCHES].sort());
    for (const [key, t] of entries) {
      expect(DOCTRINE_BRANCHES, `${key} has an unregistered branch`).toHaveProperty(t.branch);
    }
  });

  for (const branch of BRANCHES) {
    it(`${branch}: has a tech at tiers 1, 2 and 3, and exactly one capstone at tier 4`, () => {
      const tiers = entries.filter(([, t]) => t.branch === branch).map(([, t]) => t.tier);
      for (const tier of [1, 2, 3]) {
        expect(tiers.filter((t) => t === tier).length, `${branch} tier ${tier}`).toBeGreaterThanOrEqual(1);
      }
      expect(tiers.filter((t) => t === 4).length, `${branch} capstones`).toBe(1);
    });
  }

  it("cost is fixed by tier at 3/4/6/9 RP for every tech", () => {
    for (const [key, t] of entries) {
      expect(TIER_COST, `${key} has tier ${t.tier}`).toHaveProperty(String(t.tier));
      expect(t.cost, `${key} (tier ${t.tier})`).toBe(TIER_COST[t.tier]);
    }
  });

  it("`effect` is a terse one-liner: ≤ 90 characters, no trailing period", () => {
    for (const [key, t] of entries) {
      expect(t.effect.length, `${key}: "${t.effect}"`).toBeLessThanOrEqual(90);
      expect(t.effect.endsWith("."), `${key} ends with a period`).toBe(false);
    }
  });

  // Scoped to rows this lane authors: the 9 legacy descs are FROZEN (the shortest
  // is 14 words) and a length rule may not be used to justify rewriting them.
  it("every non-legacy `desc` is 15–40 words of Ministry prose", () => {
    for (const [key, t] of entries.filter(([k]) => !(k in LEGACY_TECHS))) {
      const words = t.desc.trim().split(/\s+/).length;
      expect(words, `${key} desc is ${words} words`).toBeGreaterThanOrEqual(15);
      expect(words, `${key} desc is ${words} words`).toBeLessThanOrEqual(40);
    }
  });
});

describe("the doctrine tree — the prereq DAG", () => {
  const entries = Object.entries(TECHS);

  it("every prereq names a real tech at a strictly lower tier", () => {
    for (const [key, t] of entries) {
      for (const p of prereqList(t)) {
        expect(TECHS, `${key} requires unknown tech ${p}`).toHaveProperty(p);
        expect(TECHS[p].tier, `${key} (tier ${t.tier}) requires ${p} (tier ${TECHS[p].tier})`)
          .toBeLessThan(t.tier);
      }
    }
  });

  it("at least 7 techs carry an array prereq", () => {
    const arrays = entries.filter(([, t]) => Array.isArray(t.prereq));
    expect(arrays.length).toBeGreaterThanOrEqual(7);
  });

  for (const branch of BRANCHES) {
    it(`${branch}: the capstone needs ≥2 prereqs, ≥1 of them from another branch`, () => {
      const [key, cap] = entries.find(([, t]) => t.branch === branch && t.tier === 4);
      expect(Array.isArray(cap.prereq), `${key} prereq is not an array`).toBe(true);
      expect(cap.prereq.length, `${key} prereqs`).toBeGreaterThanOrEqual(2);
      const foreign = cap.prereq.filter((p) => TECHS[p].branch !== branch);
      expect(foreign.length, `${key} has no cross-branch prereq`).toBeGreaterThanOrEqual(1);
    });
  }

  it("no capstone is reachable only through creed-locked ground", () => {
    // A capstone whose every path runs through a creedLock would be unavailable
    // to three quarters of the houses by construction. Direct prereqs suffice as
    // the guard: the tier rule means anything deeper is already reachable.
    for (const [key, t] of entries.filter(([, x]) => x.tier === 4)) {
      const gated = prereqList(t).filter((p) => TECHS[p].creedLock);
      expect(gated, `capstone ${key} is gated behind ${gated.join(", ")}`).toEqual([]);
    }
  });
});

describe("the doctrine tree — creed locks", () => {
  it("every creedLock names one of the four Departures", () => {
    for (const [key, t] of Object.entries(TECHS)) {
      if (t.creedLock === undefined) continue;
      expect(CREED_KEYS, `${key} locks to unknown creed ${t.creedLock}`).toContain(t.creedLock);
    }
  });

  for (const creed of CREED_KEYS) {
    it(`${creed}: at least one tech is locked to it`, () => {
      const locked = Object.entries(TECHS).filter(([, t]) => t.creedLock === creed);
      expect(locked.length, `no tech carries creedLock "${creed}"`).toBeGreaterThanOrEqual(1);
    });
  }

  // A tier of a branch whose ONLY tech is creed-locked is an empty shelf for three
  // houses in four: they pay the branch's RP and are offered nothing. Every
  // populated (branch, tier) cell must hold at least one creed-agnostic row.
  it("no (branch, tier) cell offers only creed-locked techs", () => {
    const cells = new Map();
    for (const [key, t] of Object.entries(TECHS)) {
      const cell = `${t.branch} tier ${t.tier}`;
      if (!cells.has(cell)) cells.set(cell, []);
      cells.get(cell).push([key, t]);
    }
    for (const [cell, rows] of cells) {
      const open = rows.filter(([, t]) => t.creedLock === undefined);
      expect(open.length, `${cell} offers only ${rows.map(([k]) => k).join(", ")}`)
        .toBeGreaterThanOrEqual(1);
    }
  });

  it("axisLean places the Departures on the Creed axis of VISION §6.1", () => {
    for (const [key, c] of Object.entries(CREEDS)) {
      expect([-1, 0, 1], `${key} axisLean`).toContain(c.axisLean);
    }
    expect(CREEDS.recall.axisLean).toBe(1);
    expect(CREEDS.discarding.axisLean).toBe(-1);
  });

  it("every creed blurb is 12–30 words", () => {
    for (const [key, c] of Object.entries(CREEDS)) {
      const words = c.blurb.trim().split(/\s+/).length;
      expect(words, `${key} blurb is ${words} words`).toBeGreaterThanOrEqual(12);
      expect(words, `${key} blurb is ${words} words`).toBeLessThanOrEqual(30);
    }
  });
});

describe("effects[] — prose describes, numbers decide", () => {
  it("every tech carries a non-empty effects[] in the §4 vocabulary", () => {
    for (const [key, t] of Object.entries(TECHS)) {
      expect(Array.isArray(t.effects), `${key} effects is not an array`).toBe(true);
      expect(t.effects.length, `${key} has no effects`).toBeGreaterThanOrEqual(1);
      for (const e of t.effects) {
        expect(SCOPES, `${key} effect scope`).toContain(e.scope);
        expect(EFFECT_KEYS.has(e.key), `${key} uses effect key "${e.key}", which is not in §4`).toBe(true);
        expect(Number.isFinite(e.value), `${key} effect ${e.key} value`).toBe(true);
        expect(e.value, `${key} effect ${e.key} is a no-op`).not.toBe(0);
      }
    }
  });

  it("no tech declares the same effect key twice", () => {
    for (const [key, t] of Object.entries(TECHS)) {
      const keys = t.effects.map((e) => e.key);
      expect(new Set(keys).size, `${key} repeats an effect key`).toBe(keys.length);
    }
  });
});

describe("exported API freeze", () => {
  it("techsByBranch returns [key, tech] pairs sorted ascending by tier", () => {
    const rows = techsByBranch("armament");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(Array.isArray(row)).toBe(true);
      expect(row.length).toBe(2);
      expect(row[1].branch).toBe("armament");
    }
    const tiers = rows.map((r) => r[1].tier);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });

  it("prereqList normalizes null, a string and an array", () => {
    expect(prereqList({ prereq: null })).toEqual([]);
    expect(prereqList({ prereq: "field_kitchens" })).toEqual(["field_kitchens"]);
    expect(prereqList({ prereq: ["a", "b"] })).toEqual(["a", "b"]);
  });
});
