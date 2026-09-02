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
//
// MUTATION-CHECKED. A gate nobody has seen fail is a gate that might be reading a
// proxy, so each of the load-bearing assertions below was defeated on purpose and
// confirmed to go red on exactly the rule it names — and on nothing else:
//
//   mutation                                            red assertion
//   ------------------------------------------------    --------------------------------
//   hardened_plate cost 4 → 5 in BOTH catalog+mirror     legacy freeze (+ the tier-cost curve)
//   "Cipher Hall" → "Cipher Halls" in the mirror only    ARMORY_ITEMS deep-equal
//   a prereq renamed to a tech that does not exist       prereq DAG
//   effect key losRange → sightRange                     effects[] vocabulary
//   plate key tech_pattern_book renamed                  plate coverage (+ category registry)
//   one Codex `see` target made dangling                 corpus link-cleanliness
//   `.sort()` deleted from techsByBranch                 techsByBranch tier order (industry/signals/reclamation)
//   sloped_casemates riflemen.defense macro → tactical   one scope per effect key
//   saturation_barrage effects 2 → 5, prose left at +2   `effect` prose ↔ effects[] numbers
//   pattern_shop given cipher_hall's effect vector       no two same-kind rows do the same thing
//   wakewatch_act's morale −1 removed                    every non-legacy decree pays a price
//   flight.axisLean 0 → 1 on BOTH sides                  axisLean pins all four Departures
//   listening_posts given creedLock "recall"             transitive creed-lock closure (capstones + relics)
//   TECH_DESIGN §8 armament RP 28 → 22                   the published cost curve
//   GAME_RULES §12 deleted and 13..23 renumbered         baseline sections pinned BY TITLE
//   this lane's GAME_RULES heading reworded              the lane's own [PROPOSED] section
//   a mirror row given a stray `axis: undefined`         mirror deep-equal (this is why toStrictEqual)
//
// The first case is the one that matters most: mutating BOTH sides keeps every
// deep-equal assertion green, so only the hard-coded legacy literal can catch it.
// That literal was copied from `git show HEAD:src/lib/doctrine.js` and must never
// be regenerated from the working tree — a freeze that reads its own subject is
// exactly the proxy this comment exists to rule out.
//
// The last eleven were added after an audit found the gates they defeat reading a
// PROXY rather than the rule they were named for: a sort asserted against its own
// output, a scope asserted to be one-of-three rather than consistent, a `[PROPOSED]`
// marker any lane's section satisfies, a gapless 1..N sequence a delete-and-renumber
// also satisfies, a creed-lock walk one step deep, two of four Creeds pinned, and a
// cost curve published in three files that nothing read back. Each entry above was
// re-run against this file and confirmed to go red on the named assertion and on
// nothing else.
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

// The TRANSITIVE prerequisite closure of a set of tech keys — every doctrine a
// house must complete to reach them. The tier rule guarantees this terminates.
const prereqClosure = (keys) => {
  const out = new Set();
  const walk = (k) => {
    if (out.has(k) || !TECHS[k]) return;
    out.add(k);
    for (const p of prereqList(TECHS[k])) walk(p);
  };
  for (const k of keys) walk(k);
  return out;
};

// Every signed integer written into a human `effect` string. `−` (U+2212) is
// accepted alongside the ASCII hyphen because prose uses both.
const proseNumbers = (text) =>
  (text.match(/[+\u2212-]\s?\d+/g) || []).map((m) => Number(m.replace("\u2212", "-").replace(/\s/g, "")));

// A row's effect vector, order-independent — the identity of what it DOES.
const effectSignature = (row) => row.effects.map((e) => `${e.scope}:${e.key}=${e.value}`).sort().join(" · ");

// The four decrees that predate this catalog. Their `effects[]` is a faithful
// encoding of a frozen `desc`, not a fresh design, so the trade rule exempts them.
const LEGACY_DECREES = Object.keys(LEGACY_ARMORY).filter((k) => LEGACY_ARMORY[k].kind === "decree");

describe("catalog mirror — base44/shared/catalog.ts ↔ src/lib", () => {
  it("TECHS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_TECHS).toStrictEqual(TECHS);
  });

  it("CREEDS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_CREEDS).toStrictEqual(CREEDS);
  });

  it("CREEDS declares exactly the four Departures", () => {
    expect(Object.keys(CREEDS).sort()).toEqual([...CREED_KEYS].sort());
  });

  it("ARMORY_ITEMS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_ARMORY).toStrictEqual(ARMORY_ITEMS);
  });

  it("RELIC_PROJECTS: the mirror deep-equals the canonical table", () => {
    expect(MIRROR_RELICS).toStrictEqual(RELIC_PROJECTS);
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
    // A capstone whose every path runs through a creedLock would be unavailable to
    // three quarters of the houses by construction. THE WALK IS TRANSITIVE. Checking
    // direct prereqs only was justified here by the claim that "the tier rule means
    // anything deeper is already reachable" — that is false: the tier rule says a
    // prereq sits LOWER, not that it is UNLOCKED. Depth and availability are
    // unrelated, so a lock two steps down closes the capstone just as completely
    // and a direct-only check never sees it.
    for (const [key] of entries.filter(([, x]) => x.tier === 4)) {
      const gated = [...prereqClosure(prereqList(TECHS[key]))].filter((p) => TECHS[p].creedLock);
      expect(gated.sort(), `capstone ${key} is gated behind creed-locked ${gated.join(", ")}`).toEqual([]);
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
    // All FOUR are pinned. Pinning only the two poles left the two zeros free: the
    // Flight, whose whole doctrine is that the Key must never be turned, could have
    // been moved to +1 with every other assertion still green.
    expect(Object.fromEntries(Object.entries(CREEDS).map(([k, c]) => [k, c.axisLean]))).toEqual({
      recall: 1, finished_ledger: 0, flight: 0, discarding: -1,
    });
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
  // Asserting only that the RETURNED tiers come back ascending is a proxy: it is
  // satisfied by `identity` on any branch whose rows happen to be DECLARED in tier
  // order, and three of the five are (creed-locked rows are declared last, so the
  // open spine reads top to bottom). The gate below compares the returned KEY ORDER
  // against an expectation built a different way — bucket by tier 1..4, preserving
  // declaration order inside a bucket, which is what a stable sort by tier means —
  // and runs it over all five branches. Deleting `.sort()` from doctrine.js turns
  // industry, signals and reclamation red.
  const expectedBranchOrder = (branch) => {
    const rows = Object.entries(MIRROR_TECHS).filter(([, t]) => t.branch === branch);
    return [1, 2, 3, 4].flatMap((tier) => rows.filter(([, t]) => t.tier === tier).map(([k]) => k));
  };

  it("at least one branch is declared out of tier order, so the sort is load-bearing", () => {
    const unsorted = BRANCHES.filter((b) => {
      const declared = Object.entries(MIRROR_TECHS).filter(([, t]) => t.branch === b).map(([, t]) => t.tier);
      return declared.some((t, i) => i > 0 && declared[i - 1] > t);
    });
    expect(unsorted.length, "every branch is declared tier-ascending — the sort assertion below cannot fail").toBeGreaterThanOrEqual(1);
  });

  for (const branch of BRANCHES) {
    it(`techsByBranch("${branch}") returns [key, tech] pairs in tier order`, () => {
      const rows = techsByBranch(branch);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(Array.isArray(row)).toBe(true);
        expect(row.length).toBe(2);
        expect(row[1].branch).toBe(branch);
      }
      expect(rows.map((r) => r[0])).toEqual(expectedBranchOrder(branch));
    });
  }

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
      // three houses in four before its own creedLock is even considered. Walked
      // TRANSITIVELY, for the reason spelled out at the capstone gate above.
      const gated = [...prereqClosure(rp.prereq)].filter((p) => TECHS[p].creedLock);
      expect(gated.sort(), `${key} is gated behind creed-locked doctrine ${gated.join(", ")}`).toEqual([]);

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

  // The 22 numbered sections `docs/GAME_RULES.md` carried before this lane appended
  // to it, pinned BY TITLE. Every content lane appends a `[PROPOSED — awaiting
  // platform wiring]` section, so the bare marker stops naming anything the moment
  // a sibling lane merges; and a gapless 1..N sequence survives a delete-and-
  // renumber, which is exactly what "no existing section was dropped" forbids. The
  // section NUMBER this lane took is deliberately not pinned — the brief says to
  // renumber mechanically if a sibling lane takes it first.
  const BASELINE_SECTIONS = [
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

  const headings = [...rules.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => ({ n: Number(m[1]), title: m[2] }));

  it("docs/GAME_RULES.md carries THIS lane's [PROPOSED] section, not merely the marker", () => {
    const mine = headings.filter((h) =>
      h.title === "Doctrine, Armory & Relic Projects [PROPOSED — awaiting platform wiring]");
    expect(mine.length, "Lane G's `## <N>. Doctrine, Armory & Relic Projects [PROPOSED — awaiting platform wiring]` section is missing or was reworded").toBe(1);
  });

  it("every section that predates this lane is still present, verbatim and in order", () => {
    const titles = headings.map((h) => h.title);
    for (const [i, title] of BASELINE_SECTIONS.entries()) {
      expect(titles[i], `section ${i + 1} should be "${title}"`).toBe(title);
    }
    expect(headings.length, "sections were dropped").toBeGreaterThanOrEqual(BASELINE_SECTIONS.length + 1);
  });

  it("the section numbering is still ascending and gapless from 1", () => {
    const numbers = headings.map((h) => h.n);
    expect(numbers.length, "GAME_RULES.md has no numbered sections").toBeGreaterThan(0);
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

describe("effects[] — the invariants the catalog header claims", () => {
  const ALL_ROWS = [
    ...Object.entries(TECHS).map(([k, r]) => [`TECHS.${k}`, r]),
    ...Object.entries(ARMORY_ITEMS).map(([k, r]) => [`ARMORY_ITEMS.${k}`, r]),
    ...Object.entries(RELIC_PROJECTS).map(([k, r]) => [`RELIC_PROJECTS.${k}`, r]),
  ];

  // catalog.ts: "SCOPE IS A PROPERTY OF THE EFFECT KEY, NOT OF THE ROW." Asserting
  // that `scope` is one of three strings passes any key under any scope, so it can
  // never see the defect it is named for: one stat routed into two subsystems.
  it("every effect key is emitted under exactly one scope, catalog-wide", () => {
    const scopes = new Map();
    for (const [where, row] of ALL_ROWS) {
      for (const e of row.effects) {
        if (!scopes.has(e.key)) scopes.set(e.key, new Map());
        const byScope = scopes.get(e.key);
        if (!byScope.has(e.scope)) byScope.set(e.scope, []);
        byScope.get(e.scope).push(where);
      }
    }
    const conflicts = [...scopes.entries()]
      .filter(([, byScope]) => byScope.size > 1)
      .map(([key, byScope]) =>
        `${key} is ${[...byScope.entries()].map(([sc, rows]) => `${sc} in ${rows.join(", ")}`).join(" but ")}`);
    expect(conflicts, conflicts.join(" | ")).toEqual([]);
  });

  // catalog.ts: "the set of signed integers in `effect` must equal the set of
  // `effects[].value`". The `effect` gate before this one checked only length and
  // a trailing period, so a rebalanced number could be left out of the copy and the
  // UI would display a figure the engine does not apply. Compared as SETS, because
  // one clause legitimately fans out to several effects ("Crawler & fighter attack
  // +1" is two rows of +1) — that is a frozen legacy string and not rewritable.
  it("every tech's `effect` prose carries exactly the numbers its effects[] applies", () => {
    for (const [key, t] of Object.entries(TECHS)) {
      const prose = [...new Set(proseNumbers(t.effect))].sort((a, b) => a - b);
      const machine = [...new Set(t.effects.map((e) => e.value))].sort((a, b) => a - b);
      expect(prose, `${key}: "${t.effect}" vs effects[] ${JSON.stringify(t.effects.map((e) => e.value))}`)
        .toEqual(machine);
    }
  });

  // catalog.ts: "No two rows of the same `kind` share an effect signature." A
  // fragment-gated row whose vector already exists on a cheaper ungated row is a
  // purchase nobody has a reason to make; the tier and fragment gates pass it
  // happily because no assertion compared two rows to each other.
  it("no two armory rows of the same kind do exactly the same thing", () => {
    const seen = new Map();
    const dupes = [];
    for (const [key, i] of Object.entries(ARMORY_ITEMS)) {
      const sig = `${i.kind} → ${effectSignature(i)}`;
      if (seen.has(sig)) dupes.push(`${seen.get(sig)} and ${key} both do ${effectSignature(i)}`);
      else seen.set(sig, key);
    }
    expect(dupes, dupes.join(" | ")).toEqual([]);
  });

  // catalog.ts and GAME_RULES §23: "A decree is a trade, not a pure gain." The four
  // shipped decrees are exempt by Work item 7 (their effects encode a frozen desc);
  // every decree this lane authors must price its pole. `buildTurns` inverts —
  // more turns is the penalty.
  it("every non-legacy decree pays for its pole with at least one penalty effect", () => {
    const free = [];
    for (const [key, i] of Object.entries(ARMORY_ITEMS)) {
      if (i.kind !== "decree" || LEGACY_DECREES.includes(key)) continue;
      const penalty = i.effects.some((e) => (e.key === "buildTurns" ? e.value > 0 : e.value < 0));
      if (!penalty) free.push(key);
    }
    expect(free, `pure-gain decrees: ${free.join(", ")}`).toEqual([]);
  });
});

describe("the published cost curve — docs/TECH_DESIGN.md §8 against the tree that shipped", () => {
  const design = readRepoFile("docs/TECH_DESIGN.md");
  const rules = readRepoFile("docs/GAME_RULES.md");
  const catalog = catalogSrc;

  const branchRP = Object.fromEntries(BRANCHES.map((b) => [
    b, Object.values(TECHS).filter((t) => t.branch === b).reduce((a, t) => a + t.cost, 0),
  ]));
  const treeRP = Object.values(TECHS).reduce((a, t) => a + t.cost, 0);
  const closureRP = (key) => [...prereqClosure([key])].reduce((a, k) => a + TECHS[k].cost, 0);
  const capstoneBills = Object.keys(TECHS).filter((k) => TECHS[k].tier === 4).map(closureRP);

  // The published table, lifted from the doc rather than retyped here. The pair
  // that used to stand in this doc — "one branch = 22 RP, whole tree = 110 RP" —
  // was arithmetically false against the shipped tree and was restated in three
  // files, because nothing read the number back. This is what reads it back.
  const publishedTable = () => {
    const rows = {};
    const body = design.split(/^\| Branch \| Nodes \| RP to clear the branch \|$/m)[1];
    expect(body, "docs/TECH_DESIGN.md §8 has no per-branch RP table").toBeDefined();
    for (const line of body.split("\n")) {
      if (!line.trim()) continue;
      if (!line.startsWith("|")) break;
      const cells = line.split("|").slice(1, -1).map((c) => c.replace(/\*/g, "").trim());
      if (cells.length !== 3 || cells[0].startsWith("---")) continue;
      rows[cells[0].toLowerCase()] = { nodes: Number(cells[1]), rp: Number(cells[2]) };
    }
    return rows;
  };

  it("the per-branch table matches the sum of TECHS costs, branch by branch", () => {
    const rows = publishedTable();
    for (const b of BRANCHES) {
      const published = rows[b];
      expect(published, `docs/TECH_DESIGN.md §8 publishes no row for ${b}`).toBeDefined();
      expect(published.rp, `${b}: doc says ${published.rp} RP, the tree costs ${branchRP[b]}`).toBe(branchRP[b]);
      expect(published.nodes, `${b} node count`).toBe(Object.values(TECHS).filter((t) => t.branch === b).length);
    }
  });

  it("the whole-tree total matches, and is the same number in all three places", () => {
    const whole = publishedTable()["the whole tree"];
    expect(whole, "§8 publishes no whole-tree row").toBeDefined();
    expect(whole.rp, `doc says ${whole.rp} RP, the tree costs ${treeRP}`).toBe(treeRP);
    expect(whole.nodes).toBe(Object.keys(TECHS).length);
    // Drift guard 7 — the figure lives in three files and none may drift.
    expect(rules, `docs/GAME_RULES.md does not carry the whole-tree total ${treeRP}`).toContain(`**${treeRP} RP**`);
    expect(catalog, `the catalog.ts header does not carry the whole-tree total ${treeRP}`).toContain(`${treeRP} RP`);
  });

  it("the cheapest and dearest first capstone are published correctly", () => {
    const cheapest = Math.min(...capstoneBills);
    const dearest = Math.max(...capstoneBills);
    // Every capstone names a cross-branch prereq, so the 22 RP one-node-per-tier
    // spine is NOT what a capstone costs — which is the sentence these two figures
    // exist to keep honest.
    expect(design, `§8 must publish the cheapest first capstone as ${cheapest} RP`).toContain(`at ${cheapest} RP`);
    expect(design, `§8 must publish the dearest first capstone as ${dearest} RP`).toContain(`**${dearest} RP**`);
    expect(rules, `GAME_RULES §23 must publish the cheapest first capstone as ${cheapest} RP`).toContain(`**${cheapest} RP**`);
    expect(catalog, "the catalog.ts header must carry the cheapest first-capstone bill").toContain(`${cheapest} RP`);
    const spine = [1, 2, 3, 4].reduce((a, t) => a + TIER_COST[t], 0);
    expect(cheapest, "the cheapest capstone is no dearer than the spine — the cross-branch rule is not biting")
      .toBeGreaterThan(spine);
  });
});
