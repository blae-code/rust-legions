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
import { ARMORY_ITEMS as MIRROR_ARMORY, RELIC_PROJECTS as MIRROR_RELICS, ARMORY_KINDS, armoryByKind, fragmentCost } from "@/lib/armory.js";
import { IMAGE_LIBRARY, IMAGE_CATEGORIES, HOUSE_STYLE } from "@/lib/imageLibrary";
import { ENTRIES, CATEGORIES, STATUS } from "@/lib/wiki/entries";

const catalogSrc = readRepoFile("base44/shared/catalog.ts");
const CANON = (name) => extractConst(catalogSrc, name);

const TECHS = CANON("TECHS");
const CREEDS = CANON("CREEDS");
const ARMORY_ITEMS = CANON("ARMORY_ITEMS");
const RELIC_PROJECTS = CANON("RELIC_PROJECTS");

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

// The 7 armory items that shipped before this catalog existed, copied from
// `git show HEAD:src/lib/armory.js`. LIVE SAVES REFERENCE THESE KEYS, and
// `test/rules-mirror.test.js` still compares `kind`/`cost` against the backend
// row for row. They may gain the additive fields `key`, `tier`, `effects[]` and —
// for the four decrees — `axis` + `direction`. Nothing else changes.
const LEGACY_ARMORY = {
  citadel_plate: { label: "Citadel Plate", kind: "module", cost: { steel: 6, manpower: 2 }, desc: "Certify +6 defense prototype armor for the Refit Yard" },
  juggernaut_reactors: { label: "Juggernaut Reactors", kind: "module", cost: { steel: 5, fuel: 4 }, desc: "Certify an all-terrain prototype engine that marches on 1 Fuel instead of 2" },
  munitions_works: { label: "Munitions Works", kind: "module", cost: { steel: 6, fuel: 3 }, desc: "Certify a prototype industry deck yielding +1 of every resource" },
  war_bonds_decree: { label: "Decree of War Bonds", kind: "decree", cost: { manpower: 3, fuel: 2 }, desc: "+1 Steel income — the treasury issues war scrip" },
  fuel_ration_act: { label: "Fuel Rationing Act", kind: "decree", cost: { steel: 4, manpower: 2 }, desc: "+1 Fuel income — civilian stocks are seized for the front" },
  universal_levy: { label: "Decree of the Universal Levy", kind: "decree", cost: { steel: 3, manpower: 3 }, desc: "+15 army cap — every citizen owes service" },
  hearth_and_bulwark: { label: "Hearth & Bulwark Edict", kind: "decree", cost: { steel: 5, manpower: 2 }, desc: "+1 capital defense and +1 riflemen defense — the home front digs in" },
};
const LEGACY_ARMORY_FIELDS = ["label", "kind", "cost", "desc"];

const KINDS = ["module", "decree", "relic_project"];
const TIERS = ["I", "II:Cache", "II:Eng", "II:Ciph", "II:Wake", "III"];
// `docs/GEAR_LIBRARY.md` tier gate → the one fragment class it may demand.
const TIER_FRAGMENT = { "II:Cache": "cache", "II:Eng": "engine", "II:Ciph": "cipher", "II:Wake": "wake" };
const FRAGMENT_CLASSES = ["cache", "engine", "cipher", "wake"];
const RESOURCE_KEYS = ["steel", "fuel", "manpower"];
const AXES = ["authority", "economy", "creed", "mobilization"];
const OBJECT_CLASSES = ["engine", "cache", "cipher", "wake"];
const RELIC_KEYS = ["land_dreadnought", "lance_carriage", "the_beacon", "the_new_ignition"];

// Four plate keys predate the `<prefix>_<key>` convention and must never be
// renamed or duplicated (drift guard 10 — art is addressed by key).
const LEGACY_PLATE_ALIASES = {
  war_bonds_decree: "decree_war_bonds",
  fuel_ration_act: "decree_fuel_ration",
  hearth_and_bulwark: "decree_hearth_bulwark",
  the_new_ignition: "relic_new_ignition",
};
// ...and two relic plates were drawn wide before the convention fixed 4:3. The
// CATEGORY is the thing that groups a plate in the UI and is asserted for every
// row; the aspect of a plate this lane did not author is not ours to change.
const LEGACY_PLATE_ASPECTS = new Set(["relic_the_beacon", "relic_new_ignition"]);

const PLATE_CONVENTION = {
  module: { prefix: "mod_", category: "fortress", aspect: "1:1" },
  decree: { prefix: "decree_", category: "decrees", aspect: "4:3" },
  relic_project: { prefix: "relic_", category: "relics", aspect: "4:3" },
};

// Distinctive fragments of HOUSE_STYLE. It is prepended at generation time, so a
// prompt that repeats it doubles the style clause.
const HOUSE_STYLE_MARKERS = [
  "Gritty dieselpunk", "1930s industrial wartime", "worn riveted steel and brass",
  "muted olive-rust-umber", "painterly concept art", "film grain", "Foxhole", "Iron Harvest",
];

const plateFor = (key, prefix) => LEGACY_PLATE_ALIASES[key] || `${prefix}${key}`;

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

  it("ARMORY_ITEMS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_ARMORY).toEqual(ARMORY_ITEMS);
  });

  it("RELIC_PROJECTS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_RELICS).toEqual(RELIC_PROJECTS);
  });

  it("every map key equals its row's own `key` field", () => {
    for (const [table, name] of [[TECHS, "TECHS"], [CREEDS, "CREEDS"], [ARMORY_ITEMS, "ARMORY_ITEMS"], [RELIC_PROJECTS, "RELIC_PROJECTS"]]) {
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

  it("all 7 legacy armory keys are still present", () => {
    for (const key of Object.keys(LEGACY_ARMORY)) {
      expect(ARMORY_ITEMS, `legacy armory item ${key} was removed or renamed`).toHaveProperty(key);
    }
  });

  for (const [key, row] of Object.entries(LEGACY_ARMORY)) {
    it(`${key}: label/kind/cost/desc are byte-identical`, () => {
      expect(pick(ARMORY_ITEMS[key], LEGACY_ARMORY_FIELDS)).toEqual(row);
    });
  }

  it("no legacy decree carries a creedLock", () => {
    for (const key of Object.keys(LEGACY_ARMORY)) {
      expect(ARMORY_ITEMS[key].creedLock, `legacy armory item ${key}`).toBeUndefined();
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

describe("the State Armory — shape", () => {
  const entries = Object.entries(ARMORY_ITEMS);
  const byKind = (k) => entries.filter(([, i]) => i.kind === k);

  it("declares at least 20 items, and every kind is display-registered", () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
    for (const [key, i] of entries) {
      expect(KINDS, `${key} has kind "${i.kind}"`).toContain(i.kind);
      expect(ARMORY_KINDS, `${key} has an unregistered kind`).toHaveProperty(i.kind);
    }
  });

  it("kind counts: ≥9 modules, ≥10 decrees, ≥4 relic projects", () => {
    expect(byKind("module").length, "modules").toBeGreaterThanOrEqual(9);
    expect(byKind("decree").length, "decrees").toBeGreaterThanOrEqual(10);
    expect(byKind("relic_project").length, "relic projects").toBeGreaterThanOrEqual(4);
  });

  it("every non-legacy `desc` is 15–40 words of Ministry prose", () => {
    for (const [key, i] of entries.filter(([k]) => !(k in LEGACY_ARMORY))) {
      const words = i.desc.trim().split(/\s+/).length;
      expect(words, `${key} desc is ${words} words`).toBeGreaterThanOrEqual(15);
      expect(words, `${key} desc is ${words} words`).toBeLessThanOrEqual(40);
    }
  });

  it("every armory row carries a non-empty effects[] in the §4 vocabulary", () => {
    for (const [key, i] of entries) {
      expect(Array.isArray(i.effects), `${key} effects is not an array`).toBe(true);
      expect(i.effects.length, `${key} has no effects`).toBeGreaterThanOrEqual(1);
      const seen = i.effects.map((e) => e.key);
      expect(new Set(seen).size, `${key} repeats an effect key`).toBe(seen.length);
      for (const e of i.effects) {
        expect(SCOPES, `${key} effect scope`).toContain(e.scope);
        expect(EFFECT_KEYS.has(e.key), `${key} uses effect key "${e.key}", which is not in §4`).toBe(true);
        expect(Number.isFinite(e.value), `${key} effect ${e.key} value`).toBe(true);
        expect(e.value, `${key} effect ${e.key} is a no-op`).not.toBe(0);
      }
    }
  });
});

describe("the State Armory — decrees carry an ideology axis", () => {
  const decrees = Object.entries(ARMORY_ITEMS).filter(([, i]) => i.kind === "decree");

  it("every decree names an axis and a direction, and only decrees do", () => {
    for (const [key, i] of Object.entries(ARMORY_ITEMS)) {
      if (i.kind === "decree") {
        expect(AXES, `${key} axis`).toContain(i.axis);
        expect([-1, 1], `${key} direction`).toContain(i.direction);
      } else {
        expect(i.axis, `${key} is not a decree but declares an axis`).toBeUndefined();
        expect(i.direction, `${key} is not a decree but declares a direction`).toBeUndefined();
      }
    }
  });

  it("all 8 axis/direction poles of VISION §6.1 are offered", () => {
    const covered = new Set(decrees.map(([, i]) => `${i.axis}:${i.direction}`));
    const missing = AXES.flatMap((a) => [-1, 1].map((d) => `${a}:${d}`)).filter((c) => !covered.has(c));
    expect(missing, `no decree moves ${missing.join(", ")}`).toEqual([]);
  });

  // The same rule the doctrine tree enforces per (branch, tier) cell: a pole whose
  // ONLY decree is creed-locked is an axis three houses in four can never move.
  it("every axis pole offers at least one creed-agnostic decree", () => {
    const cells = new Map();
    for (const [key, i] of decrees) {
      const cell = `${i.axis} ${i.direction > 0 ? "+1" : "−1"}`;
      if (!cells.has(cell)) cells.set(cell, []);
      cells.get(cell).push([key, i]);
    }
    for (const [cell, rows] of cells) {
      const open = rows.filter(([, i]) => i.creedLock === undefined);
      expect(open.length, `${cell} offers only ${rows.map(([k]) => k).join(", ")}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("every armory creedLock names a Departure, and all 4 are represented among the decrees", () => {
    for (const [key, i] of Object.entries(ARMORY_ITEMS)) {
      if (i.creedLock === undefined) continue;
      expect(CREED_KEYS, `${key} locks to unknown creed ${i.creedLock}`).toContain(i.creedLock);
    }
    for (const creed of CREED_KEYS) {
      const locked = decrees.filter(([, i]) => i.creedLock === creed);
      expect(locked.length, `no decree carries creedLock "${creed}"`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("the State Armory — tier gates and the fragment economy", () => {
  const entries = Object.entries(ARMORY_ITEMS);

  it("every tier is one of the 6 GEAR_LIBRARY gates", () => {
    for (const [key, i] of entries) {
      expect(TIERS, `${key} tier`).toContain(i.tier);
    }
  });

  it("a 'II:*' row demands exactly its own fragment class, at 1 or more", () => {
    for (const [key, i] of entries.filter(([, x]) => x.tier.startsWith("II:"))) {
      const frags = fragmentCost(i);
      expect(Object.keys(frags).sort(), `${key} (${i.tier}) fragment classes`).toEqual([TIER_FRAGMENT[i.tier]]);
      expect(frags[TIER_FRAGMENT[i.tier]], `${key} fragment count`).toBeGreaterThanOrEqual(1);
    }
  });

  it("a tier 'I' row demands no fragments at all", () => {
    for (const [key, i] of entries.filter(([, x]) => x.tier === "I")) {
      expect(fragmentCost(i), `${key} is tier I but demands fragments`).toEqual({});
    }
  });

  it("every cost value in the catalog is a positive integer, and every key is known", () => {
    const rows = [...entries, ...Object.entries(RELIC_PROJECTS)];
    for (const [key, i] of rows) {
      for (const [k, v] of Object.entries(i.cost)) {
        if (k === "fragments") {
          for (const [fc, fv] of Object.entries(v)) {
            expect(FRAGMENT_CLASSES, `${key} fragment class ${fc}`).toContain(fc);
            expect(Number.isInteger(fv) && fv > 0, `${key} fragments.${fc} = ${fv}`).toBe(true);
          }
          continue;
        }
        expect(RESOURCE_KEYS, `${key} cost key ${k}`).toContain(k);
        expect(Number.isInteger(v) && v > 0, `${key} cost.${k} = ${v}`).toBe(true);
      }
    }
  });

  it("all 4 fragment classes are demanded somewhere in the catalog", () => {
    const demanded = new Set();
    for (const i of [...Object.values(ARMORY_ITEMS), ...Object.values(RELIC_PROJECTS)]) {
      for (const c of Object.keys(fragmentCost(i))) demanded.add(c);
    }
    expect([...demanded].sort()).toEqual([...FRAGMENT_CLASSES].sort());
  });
});

describe("the four Tier-III relic projects", () => {
  it("declares exactly the 4 named projects", () => {
    expect(Object.keys(RELIC_PROJECTS).sort()).toEqual([...RELIC_KEYS].sort());
  });

  for (const key of RELIC_KEYS) {
    it(`${key}: paired armory row, build clock, object class and prereqs`, () => {
      const rp = RELIC_PROJECTS[key];
      const ai = ARMORY_ITEMS[key];

      expect(ai, `${key} has no ARMORY_ITEMS row`).toBeDefined();
      expect(ai.kind, `${key} armory kind`).toBe("relic_project");
      expect(ai.tier, `${key} armory tier`).toBe("III");
      expect(ai.cost, `${key} armory cost differs from the project cost`).toEqual(rp.cost);
      expect(ai.label, `${key} label differs between the two tables`).toBe(rp.label);

      expect(OBJECT_CLASSES, `${key} objectClass`).toContain(rp.objectClass);
      expect(Number.isInteger(rp.buildDays) && rp.buildDays >= 10, `${key} buildDays = ${rp.buildDays}`).toBe(true);

      expect(Array.isArray(rp.prereq), `${key} prereq is not an array`).toBe(true);
      expect(rp.prereq.length, `${key} prereqs`).toBeGreaterThanOrEqual(2);
      for (const p of rp.prereq) expect(TECHS, `${key} requires unknown tech ${p}`).toHaveProperty(p);
      const reclamation = rp.prereq.filter((p) => TECHS[p].branch === "reclamation");
      expect(reclamation.length, `${key} has no Reclamation prereq`).toBeGreaterThanOrEqual(1);
      // A project reachable only through creed-locked doctrine is unbuildable for
      // three houses in four before its own creedLock is even considered.
      const gated = rp.prereq.filter((p) => TECHS[p].creedLock);
      expect(gated, `${key} is gated behind creed-locked doctrine ${gated.join(", ")}`).toEqual([]);

      expect(Object.keys(fragmentCost(rp)).length, `${key} fragment classes`).toBeGreaterThanOrEqual(2);
    });
  }

  it("the two Exodus Works forks carry their canonical creed locks", () => {
    expect(RELIC_PROJECTS.the_beacon.creedLock).toBe("recall");
    expect(RELIC_PROJECTS.the_new_ignition.creedLock).toBe("discarding");
    expect(RELIC_PROJECTS.land_dreadnought.creedLock).toBeUndefined();
    expect(RELIC_PROJECTS.lance_carriage.creedLock).toBeUndefined();
  });

  it("every relic project carries a non-empty effects[] in the §4 vocabulary", () => {
    for (const [key, rp] of Object.entries(RELIC_PROJECTS)) {
      expect(rp.effects.length, `${key} has no effects`).toBeGreaterThanOrEqual(1);
      for (const e of rp.effects) {
        expect(SCOPES, `${key} effect scope`).toContain(e.scope);
        expect(EFFECT_KEYS.has(e.key), `${key} uses effect key "${e.key}", which is not in §4`).toBe(true);
        expect(Number.isFinite(e.value) && e.value !== 0, `${key} effect ${e.key} value`).toBe(true);
      }
      expect(rp.effects, `${key} effects differ from its armory row`).toEqual(ARMORY_ITEMS[key].effects);
    }
  });
});

describe("art placeholders — every catalog row is addressable", () => {
  const plateBy = new Map(IMAGE_LIBRARY.map((p) => [p.key, p]));

  it("no plate key is registered twice", () => {
    const seen = new Set();
    const dupes = [];
    for (const p of IMAGE_LIBRARY) {
      if (seen.has(p.key)) dupes.push(p.key);
      seen.add(p.key);
    }
    expect(dupes, `duplicate plate keys: ${dupes.join(", ")}`).toEqual([]);
  });

  it("every tech has a `tech_<key>` plate in the doctrine category at 4:3", () => {
    for (const key of Object.keys(TECHS)) {
      const pk = plateFor(key, "tech_");
      const plate = plateBy.get(pk);
      expect(plate, `no plate ${pk} for tech ${key}`).toBeDefined();
      expect(plate.category, `${pk} category`).toBe("doctrine");
      expect(plate.aspect, `${pk} aspect`).toBe("4:3");
    }
  });

  for (const kind of KINDS) {
    const { prefix, category, aspect } = PLATE_CONVENTION[kind];
    it(`every ${kind} has a \`${prefix}<key>\` plate in the ${category} category`, () => {
      for (const [key, i] of Object.entries(ARMORY_ITEMS).filter(([, x]) => x.kind === kind)) {
        const pk = plateFor(key, prefix);
        const plate = plateBy.get(pk);
        expect(plate, `no plate ${pk} for ${kind} ${key}`).toBeDefined();
        expect(plate.category, `${pk} category`).toBe(category);
        if (!LEGACY_PLATE_ASPECTS.has(pk)) expect(plate.aspect, `${pk} aspect`).toBe(aspect);
      }
    });
  }

  it("every relic project resolves to a `relic_<key>` plate in the relics category", () => {
    for (const key of Object.keys(RELIC_PROJECTS)) {
      const pk = plateFor(key, "relic_");
      const plate = plateBy.get(pk);
      expect(plate, `no plate ${pk} for relic project ${key}`).toBeDefined();
      expect(plate.category, `${pk} category`).toBe("relics");
    }
  });

  it("no catalog plate repeats HOUSE_STYLE, and every category is registered", () => {
    const mine = new Set();
    for (const key of Object.keys(TECHS)) mine.add(plateFor(key, "tech_"));
    for (const [key, i] of Object.entries(ARMORY_ITEMS)) mine.add(plateFor(key, PLATE_CONVENTION[i.kind].prefix));
    for (const key of Object.keys(RELIC_PROJECTS)) mine.add(plateFor(key, "relic_"));
    for (const marker of HOUSE_STYLE_MARKERS) {
      expect(HOUSE_STYLE, `HOUSE_STYLE no longer contains "${marker}" — update the marker list`).toContain(marker);
    }
    for (const pk of mine) {
      const plate = plateBy.get(pk);
      expect(IMAGE_CATEGORIES, `${pk} uses an unregistered category`).toHaveProperty(plate.category);
      // `url` is deliberately NOT asserted: P() reads it from PLATE_URLS, which is
      // the Base44 art session's file, and several legacy plates are delivered.
      // A lane cannot ship a url through this helper, which is the point of it.
      for (const marker of HOUSE_STYLE_MARKERS) {
        expect(plate.prompt.includes(marker), `${pk} repeats HOUSE_STYLE ("${marker}")`).toBe(false);
      }
    }
  });
});

describe("the Codex — this lane's entries, and the corpus they joined", () => {
  const LANE_G_IDS = [
    "branch-signals", "branch-reclamation",
    "relic-project-land-dreadnought", "relic-project-lance-carriage",
    "relic-project-the-beacon", "relic-project-the-new-ignition",
    "decree-emergency-powers", "decree-sealed-sites", "decree-standing-corps",
    "decree-charter-of-passage", "decree-reliquary-act", "decree-writ-of-consecration",
    "decree-breaking-yards", "decree-ordinance-common-metal", "decree-wakewatch",
  ];

  it("ships at least 12 new entries covering the 2 branches, the 4 projects and ≥6 decrees", () => {
    expect(LANE_G_IDS.length).toBeGreaterThanOrEqual(12);
    const ids = new Set(ENTRIES.map((e) => e.id));
    for (const id of LANE_G_IDS) expect(ids.has(id), `codex entry ${id} is missing`).toBe(true);
    expect(LANE_G_IDS.filter((id) => id.startsWith("relic-project-")).length).toBe(4);
    expect(LANE_G_IDS.filter((id) => id.startsWith("decree-")).length).toBeGreaterThanOrEqual(6);
  });

  it("every entry id in the whole corpus is unique", () => {
    const ids = ENTRIES.map((e) => e.id);
    expect(new Set(ids).size, "duplicate codex ids").toBe(ids.length);
  });

  it("every entry declares a registered category and status", () => {
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const e of ENTRIES) {
      expect(cats.has(e.category), `${e.id} has unregistered category "${e.category}"`).toBe(true);
      expect(STATUS, `${e.id} has unregistered status "${e.status}"`).toHaveProperty(e.status);
    }
  });

  it("every `see` target in the whole corpus resolves — the append kept it link-clean", () => {
    const ids = new Set(ENTRIES.map((e) => e.id));
    const dangling = [];
    for (const e of ENTRIES) {
      for (const target of e.see || []) if (!ids.has(target)) dangling.push(`${e.id} → ${target}`);
    }
    expect(dangling, `dangling codex links: ${dangling.join(", ")}`).toEqual([]);
  });
});

describe("the [PROPOSED] rules draft", () => {
  const rules = readRepoFile("docs/GAME_RULES.md");

  it("docs/GAME_RULES.md carries the lane's [PROPOSED — awaiting platform wiring] section", () => {
    expect(rules).toContain("[PROPOSED — awaiting platform wiring]");
  });

  it("no existing numbered section was renumbered, reworded away or dropped", () => {
    const numbers = [...rules.matchAll(/^## (\d+)\./gm)].map((m) => Number(m[1]));
    expect(numbers.length, "GAME_RULES.md has no numbered sections").toBeGreaterThan(0);
    // Ascending and gapless from 1 — a renumber or a deletion breaks both.
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });
});

describe("exported API freeze — the armory half", () => {
  it("armoryByKind returns [key, item] pairs filtered by kind", () => {
    const rows = armoryByKind("decree");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(Array.isArray(row)).toBe(true);
      expect(row.length).toBe(2);
      expect(row[1].kind).toBe("decree");
    }
    expect(rows.map((r) => r[0])).toEqual(
      Object.keys(MIRROR_ARMORY).filter((k) => MIRROR_ARMORY[k].kind === "decree"),
    );
  });

  it("fragmentCost returns the fragment map, or {} when a row asks for none", () => {
    expect(fragmentCost(MIRROR_ARMORY.citadel_plate)).toEqual({});
    expect(fragmentCost(MIRROR_ARMORY.launch_rails)).toEqual({ engine: 3 });
    expect(fragmentCost({ cost: {} })).toEqual({});
    expect(fragmentCost(undefined)).toEqual({});
  });
});
