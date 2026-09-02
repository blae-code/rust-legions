// Arms-catalogue mirror invariant (Lane I).
//
// base44/shared/arms.ts is a Deno module that cannot be imported into Vitest,
// so every pure-data table is lifted out of it TEXTUALLY (extract-const.js)
// and deep-equalled against the importable mirror at src/lib/arms.js. Unlike
// src/lib/tactical/data.js there is NO UI-only allowlist here: label, blurb
// and lore are canonical on both sides, so the comparison is strict in both
// directions.
//
// The mirror alone is not enough — two files can hold identical tables while
// their LOGIC drifts. So this file also compares the exported identifier sets
// and the source text of every exported function.
//
// It then asserts the Universal Damage Model itself, because arms.ts is the
// only place in the repository where armour math may exist (drift guard 12),
// and a guard on the last copy of a rule is the only guard that matters.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import * as MIRROR from "@/lib/arms.js";
import { IMAGE_LIBRARY, IMAGE_CATEGORIES, HOUSE_STYLE } from "@/lib/imageLibrary.js";
import { ENTRIES } from "@/lib/wiki/entries.js";

const CANON_SRC = readRepoFile("base44/shared/arms.ts");
const MIRROR_SRC = readRepoFile("src/lib/arms.js");

const CANON = (name) => extractConst(CANON_SRC, name);

// THE NINE MAKER KEYS THIS LANE AUTHORS, and the single reason they are written
// out rather than read off the table. §3 sanctions Lane J appending motor-works
// rows keyed `mw_*` to MANUFACTURERS after this lane merges. Every assertion in
// this file that imposes LANE I's AUTHORING STANDARD — a two-key signature with
// a real cost, four name-stems, a ten-house access map with a native, 60–100
// words of lore, a plate, a Codex entry, a pattern that actually uses the maker
// — is scoped to these nine, because a sweep over the whole table would go red
// on `main`, in someone else's PR, for obligations Lane J was never given. The
// gate on the TABLE stays `>= 8` and is never an exact count.
const LANE_I_MAKERS = [
  "hundredweight_works", "reclamation_state_arsenal", "emberwright_foundries",
  "ferrymen_shrine_armoury", "salvage_court_prize_yard", "crossloom_pattern_house",
  "ascendancy_signal_works", "outrider_wheelwrights", "tarpool_burnworks",
];

// Every pure-data table the two files must agree on, in declaration order.
// Later steps of this lane append to this list as they append tables.
const TABLES = [
  "DAMAGE_TYPES",
  "WEAPON_CLASSES",
  "MOD_SLOTS",
  "HOUSE_KEYS",
  "APPLIES_TO_KEYS",
  "LOGISTICS_CLASSES",
  "ARMOUR_CLASSES",
  "PEN_TABLE",
  "TYPE_MATRIX",
  "SUPPRESSION",
  "QUALITY_GRADES",
  "ACCESS_COST",
  "MANUFACTURERS",
  "CALIBRES",
  "WEAPON_PATTERNS",
  "MODIFICATIONS",
  "QUALITY_ORDER",
  "SPECIALIST_KEYS",
  "QUIRK_CONDITION_KEYS",
  "QUIRKS",
  "WEAPON_BASE_KEYS",
  "TIER_RANK",
  "LUCK_SLOPE",
  "MOD_COUNT_BY_QUALITY",
  "SQUAD_VALUE_KEYS",
  "LOADOUT_KEYS",
  "LOADOUT_SHARES",
  "POINTS_MODEL",
];

// `export const NAME = (` / `= arg =>` — an exported function rather than a
// table. Derived from the source rather than hard-coded, so a function added
// in a later step is covered the moment it is written.
const exportedFunctionNames = (src) =>
  [...src.matchAll(/export const (\w+) = (?:\(|[A-Za-z_$][\w$]*\s*=>)/g)].map((m) => m[1]);

// A function's source text: from its `export const` to the next top-level
// `export`, or end of file.
const fnSource = (src, name) => {
  const start = src.indexOf(`export const ${name} = `);
  if (start === -1) throw new Error(`function ${name} not found`);
  const after = src.indexOf("\nexport ", start + 1);
  const body = src.slice(start, after === -1 ? src.length : after);
  return body.replace(/^export /, "").replace(/\s+/g, " ").trim();
};

// The span of a top-level declaration, used by the drift-guard-12 grep.
const declSpan = (src, name, nextName) => {
  const start = src.indexOf(`export const ${name} = `);
  const end = src.indexOf(`export const ${nextName} = `);
  expect(start, `${name} declaration`).toBeGreaterThan(-1);
  expect(end, `${nextName} declaration`).toBeGreaterThan(start);
  return [start, end];
};

// ---------------------------------------------------------------------------

describe("arms mirror — arms.ts ↔ src/lib/arms.js", () => {
  for (const name of TABLES) {
    it(`${name} is byte-identical in content across both files`, () => {
      expect(MIRROR[name], `${name} missing from the mirror`).toBeDefined();
      expect(MIRROR[name]).toEqual(CANON(name));
    });
  }

  it("exports exactly the same identifiers on both sides", () => {
    const ids = (src) => [...src.matchAll(/export const (\w+)/g)].map((m) => m[1]).sort();
    expect(ids(MIRROR_SRC)).toEqual(ids(CANON_SRC));
  });

  it("declares every table this test compares", () => {
    const ids = [...CANON_SRC.matchAll(/export const (\w+)/g)].map((m) => m[1]);
    const fns = new Set(exportedFunctionNames(CANON_SRC));
    const tables = ids.filter((id) => !fns.has(id));
    // Nothing may be exported as data and quietly left out of the comparison.
    expect(tables.sort()).toEqual([...TABLES].sort());
  });

  it("every exported function has identical source text in both files", () => {
    const fns = exportedFunctionNames(CANON_SRC);
    expect(fns.length, "no exported functions found — the regex has rotted").toBeGreaterThan(0);
    expect(fns).toContain("resolveHit");
    for (const name of fns) {
      expect(fnSource(MIRROR_SRC, name), `${name} drifted`).toEqual(fnSource(CANON_SRC, name));
    }
  });

  // The exported surface is not the whole module. round4, round2, applyDelta,
  // applyMult, clampTo, nativeHousesOf, activeQuirkKeys, withoutBlades,
  // SERIAL_ALPHABET and WEIGHT_PER_SPEED_STEP are module-level and NOT
  // exported, so the table comparison never sees them and the function-source
  // comparison only catches the ones that happen to sit inside an exported
  // function's slice. WEIGHT_PER_SPEED_STEP is a balance constant; applyDelta
  // decides whether a delta adds or replaces. Either could drift between the
  // two files with every other assertion in this file still green.
  it("every module-level helper and constant is identical in both files", () => {
    const helpers = (src) => {
      const out = {};
      const re = /^const (\w+) = /gm;
      let m;
      while ((m = re.exec(src)) !== null) {
        const start = m.index;
        const rest = src.slice(start + m[0].length);
        const stop = rest.search(/^(?:export )?const /m);
        out[m[1]] = src.slice(start, stop === -1 ? src.length : start + m[0].length + stop).replace(/\s+/g, " ").trim();
      }
      return out;
    };
    const canon = helpers(CANON_SRC);
    const mirror = helpers(MIRROR_SRC);
    expect(Object.keys(canon).length, "no module-level helpers found — the regex has rotted").toBeGreaterThan(4);
    expect(Object.keys(mirror).sort()).toEqual(Object.keys(canon).sort());
    for (const name of Object.keys(canon)) {
      expect(mirror[name], `helper ${name} drifted between the two files`).toEqual(canon[name]);
    }
  });
});

describe("armour classes (Work item 3.2)", () => {
  const AC = CANON("ARMOUR_CLASSES");
  const ORDER = ["none", "soft", "light", "medium", "heavy", "superheavy"];

  it("declares exactly the seven classes", () => {
    expect(Object.keys(AC).sort()).toEqual([...ORDER, "fortified"].sort());
  });

  it("every row carries key/armourValue/sealed/blurb, and key matches its own slot", () => {
    for (const [k, row] of Object.entries(AC)) {
      expect(row.key).toBe(k);
      expect(Number.isFinite(row.armourValue)).toBe(true);
      expect(typeof row.sealed).toBe("boolean");
      expect(row.blurb.length).toBeGreaterThan(20);
    }
  });

  it("armour value strictly increases none < soft < light < medium < heavy < superheavy", () => {
    for (let i = 1; i < ORDER.length; i++) {
      expect(AC[ORDER[i]].armourValue).toBeGreaterThan(AC[ORDER[i - 1]].armourValue);
    }
  });

  it("fortified sits between heavy and superheavy", () => {
    expect(AC.fortified.armourValue).toBeGreaterThan(AC.heavy.armourValue);
    expect(AC.fortified.armourValue).toBeLessThan(AC.superheavy.armourValue);
  });

  it("medium, heavy and superheavy are sealed; none, soft, light and fortified are not", () => {
    expect([AC.medium.sealed, AC.heavy.sealed, AC.superheavy.sealed]).toEqual([true, true, true]);
    expect([AC.none.sealed, AC.soft.sealed, AC.light.sealed, AC.fortified.sealed]).toEqual([false, false, false, false]);
  });
});

describe("penetration table (Work item 4.3)", () => {
  const PEN = CANON("PEN_TABLE");

  it("contains a genuine mult: 0 row", () => {
    expect(PEN.some((r) => r.mult === 0)).toBe(true);
  });

  it("is sorted by minDelta descending, so the lookup is unambiguous", () => {
    for (let i = 1; i < PEN.length; i++) {
      expect(PEN[i].minDelta).toBeLessThan(PEN[i - 1].minDelta);
    }
  });

  it("mult is non-increasing as minDelta decreases", () => {
    for (let i = 1; i < PEN.length; i++) {
      expect(PEN[i].mult).toBeLessThanOrEqual(PEN[i - 1].mult);
    }
  });

  it("the last row is the mult: 0 row and uses -999, never -Infinity", () => {
    const last = PEN[PEN.length - 1];
    expect(last.mult).toBe(0);
    expect(last.minDelta).toBe(-999);
    expect(Number.isFinite(last.minDelta)).toBe(true);
  });

  it("penMultFor never returns undefined for any integer delta in [-999, 999]", () => {
    for (let d = -999; d <= 999; d++) {
      const m = MIRROR.penMultFor(d);
      expect(Number.isFinite(m), `delta ${d}`).toBe(true);
      expect(m).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns the first row whose minDelta <= delta", () => {
    expect(MIRROR.penMultFor(99)).toBe(1.5);
    expect(MIRROR.penMultFor(6)).toBe(1.5);
    expect(MIRROR.penMultFor(5)).toBe(1.25);
    expect(MIRROR.penMultFor(0)).toBe(1);
    expect(MIRROR.penMultFor(-1)).toBe(0.6);
    expect(MIRROR.penMultFor(-6)).toBe(0.1);
    expect(MIRROR.penMultFor(-7)).toBe(0);
  });
});

describe("type matrix (Work item 5.2)", () => {
  const TM = CANON("TYPE_MATRIX");
  const TYPES = CANON("DAMAGE_TYPES");
  const AC = CANON("ARMOUR_CLASSES");
  const CLASSES = Object.keys(AC);
  const SEALED = CLASSES.filter((c) => AC[c].sealed);

  it("is 7 damage types × 7 armour classes = 49 numbers, no holes", () => {
    expect(Object.keys(TM).sort()).toEqual([...TYPES].sort());
    let count = 0;
    for (const t of TYPES) {
      expect(Object.keys(TM[t]).sort(), `${t} row`).toEqual([...CLASSES].sort());
      count += Object.keys(TM[t]).length;
    }
    expect(count).toBe(49);
  });

  it("every value is a finite number in [0, 2]", () => {
    for (const t of TYPES) {
      for (const c of CLASSES) {
        const v = TM[t][c];
        expect(Number.isFinite(v), `${t}.${c}`).toBe(true);
        expect(v, `${t}.${c}`).toBeGreaterThanOrEqual(0);
        expect(v, `${t}.${c}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("shaped beats plate but wastes on soft", () => {
    expect(TM.shaped.heavy).toBeGreaterThan(TM.shaped.medium);
    expect(TM.shaped.medium).toBeGreaterThan(TM.shaped.light);
    expect(TM.shaped.soft).toBeLessThan(0.75);
    expect(TM.shaped.heavy).toBeGreaterThan(TM.kinetic.heavy);
  });

  it("incendiary ignores plate but is stopped by a sealed hull", () => {
    for (const c of SEALED) expect(TM.incendiary[c], `incendiary.${c}`).toBeLessThanOrEqual(0.35);
    expect(TM.incendiary.soft).toBeGreaterThan(TM.incendiary.medium);
    // and walks straight into unsealed poured works
    expect(TM.incendiary.fortified).toBeGreaterThan(TM.incendiary.heavy);
  });

  it("chemical is stopped dead by a sealed hull", () => {
    for (const c of SEALED) expect(TM.chemical[c], `chemical.${c}`).toBe(0);
    expect(TM.chemical.fortified).toBeGreaterThan(0);
  });

  it("fragmentation shreds soft and is spent on light and above", () => {
    expect(TM.fragmentation.soft).toBeGreaterThanOrEqual(1.3);
    expect(TM.fragmentation.light).toBeLessThanOrEqual(0.5);
    for (const c of ["medium", "heavy", "superheavy", "fortified"]) {
      expect(TM.fragmentation[c], `fragmentation.${c}`).toBeLessThanOrEqual(TM.fragmentation.light);
    }
  });

  it("concussive is low damage across the board — it is bought for suppression", () => {
    for (const c of CLASSES) expect(TM.concussive[c], `concussive.${c}`).toBeLessThan(TM.kinetic[c] + 0.001);
    expect(MIRROR.SUPPRESSION.concussiveBonus).toBeGreaterThan(0);
  });
});

describe("resolveHit / resolveAoe (Work item 6)", () => {
  const AC = MIRROR.ARMOUR_CLASSES;
  const weapon = (over) => ({
    accuracy: 0.6, rateOfFire: 1, damage: 4, armorPen: 4, range: 6,
    reliability: 0.9, weight: 5, damageType: "kinetic", aoe: null, ...over,
  });

  it("returns exactly the keys effective and suppressOnly", () => {
    const r = MIRROR.resolveHit({ weapon: weapon({}), target: AC.soft });
    expect(Object.keys(r).sort()).toEqual(["effective", "suppressOnly"]);
  });

  it("effective is rounded to 4 decimal places", () => {
    const r = MIRROR.resolveHit({ weapon: weapon({ damage: 1 / 3, armorPen: 6 }), target: AC.medium });
    expect(r.effective).toBe(Number(r.effective.toFixed(4)));
  });

  it("suppressOnly is true exactly when effective is 0", () => {
    const dead = MIRROR.resolveHit({ weapon: weapon({ armorPen: 1 }), target: AC.heavy });
    expect(dead.effective).toBe(0);
    expect(dead.suppressOnly).toBe(true);
    const live = MIRROR.resolveHit({ weapon: weapon({ armorPen: 9 }), target: AC.medium });
    expect(live.effective).toBeGreaterThan(0);
    expect(live.suppressOnly).toBe(false);
  });

  it("a chemical round is suppression-only against any sealed hull, at any penetration", () => {
    const r = MIRROR.resolveHit({ weapon: weapon({ damageType: "chemical", armorPen: 99 }), target: AC.heavy });
    expect(r).toEqual({ effective: 0, suppressOnly: true });
  });

  it("resolveAoe returns nothing for point fire", () => {
    expect(MIRROR.resolveAoe({ weapon: weapon({ aoe: null }), victims: [{ target: AC.soft, dist: 0 }] })).toEqual([]);
  });

  it("resolveAoe drops victims beyond the radius", () => {
    const w = weapon({ damageType: "fragmentation", aoe: { radius: 2, falloff: 0.3 } });
    const out = MIRROR.resolveAoe({
      weapon: w,
      victims: [{ target: AC.soft, dist: 0 }, { target: AC.soft, dist: 2 }, { target: AC.soft, dist: 3 }],
    });
    expect(out).toHaveLength(2);
  });

  it("resolveAoe at dist 0 equals resolveHit for the same weapon and target", () => {
    const w = weapon({ damageType: "explosive", aoe: { radius: 3, falloff: 0.25 } });
    const [burst] = MIRROR.resolveAoe({ weapon: w, victims: [{ target: AC.light, dist: 0 }] });
    expect(burst).toEqual(MIRROR.resolveHit({ weapon: w, target: AC.light }));
  });

  it("resolveAoe rolls each victim against its OWN armour class, and falls off per hex", () => {
    const w = weapon({ damage: 10, armorPen: 5, damageType: "explosive", aoe: { radius: 3, falloff: 0.25 } });
    const out = MIRROR.resolveAoe({
      weapon: w,
      victims: [{ target: AC.none, dist: 0 }, { target: AC.none, dist: 2 }, { target: AC.medium, dist: 0 }],
    });
    expect(out[0].effective).toBeGreaterThan(out[1].effective); // falloff
    expect(out[0].effective).toBeGreaterThan(out[2].effective); // own armour class
  });
});

describe("drift guard 12 — armour math lives nowhere else", () => {
  // Where each of the three armour-model reads is allowed to appear, as pairs
  // of top-level declarations bounding a span. Anything outside is a second
  // copy of the maths, which is the one thing this lane exists to prevent.
  const CONFINED = [
    // the field itself: declared by the table, read by resolveHit, nowhere else
    ["armourValue", [["ARMOUR_CLASSES", "PEN_TABLE"], ["resolveHit", "resolveAoe"]]],
    // the penetration curve: read only by its own lookup function
    ["PEN_TABLE[", [["penMultFor", "resolveHit"]]],
    // the type matrix: read only by resolveHit
    ["TYPE_MATRIX[", [["resolveHit", "resolveAoe"]]],
  ];

  // Comments are stripped first. A doc comment quoting the formula is good
  // practice, not a second implementation — a guard that cannot tell them
  // apart is a guard on a proxy, and it goes red the day someone documents
  // the thing it is protecting.
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[^\n]*?\/\/.*$/gm, (line) => (/^\s*\/\//.test(line) ? "" : line));

  for (const [needle, spans] of CONFINED) {
    it(`${needle} is referenced only inside the damage model`, () => {
      for (const [file, raw] of [["arms.ts", CANON_SRC], ["arms.js", MIRROR_SRC]]) {
        const src = stripComments(raw);
        const bounds = spans.map(([a, b]) => declSpan(src, a, b));
        const inside = (i) => bounds.some(([lo, hi]) => i >= lo && i < hi);
        let at = src.indexOf(needle);
        let seen = 0;
        while (at !== -1) {
          expect(inside(at), `${file}: '${needle}' at index ${at} is outside the damage model`).toBe(true);
          seen++;
          at = src.indexOf(needle, at + 1);
        }
        expect(seen, `${file}: no '${needle}' found at all — the guard has rotted`).toBeGreaterThan(0);
      }
    });
  }
});

describe("quality grades (Work items 10.1, 10.2)", () => {
  const QG = CANON("QUALITY_GRADES");

  it("is exactly the five graded keys", () => {
    expect(Object.keys(QG)).toEqual(["scrap", "issue", "proofed", "master", "relic"]);
  });

  it("the five roll weights sum to exactly 1000", () => {
    expect(Object.values(QG).reduce((s, g) => s + g.rollWeight, 0)).toBe(1000);
    for (const g of Object.values(QG)) expect(Number.isInteger(g.rollWeight)).toBe(true);
  });

  it("issue is the neutral grade — every multiplier is exactly 1", () => {
    for (const [k, v] of Object.entries(QG.issue.mult)) expect(v, `issue.mult.${k}`).toBe(1);
    expect(QG.issue.ptsMult).toBe(1);
  });

  it("grade quality and points cost both rise monotonically", () => {
    const order = ["scrap", "issue", "proofed", "master", "relic"];
    for (let i = 1; i < order.length; i++) {
      expect(QG[order[i]].mult.damage, order[i]).toBeGreaterThan(QG[order[i - 1]].mult.damage);
      expect(QG[order[i]].ptsMult, order[i]).toBeGreaterThan(QG[order[i - 1]].ptsMult);
    }
  });

  it("issue is the modal grade, and rarity falls away above it", () => {
    // Deliberately NOT monotonic across all five: `scrap` is rarer than
    // `issue` because most of what a quartermaster hands out is simply what
    // the arsenal made. Rarity only starts climbing above the neutral grade.
    const above = ["issue", "proofed", "master", "relic"];
    for (let i = 1; i < above.length; i++) {
      expect(QG[above[i]].rollWeight, above[i]).toBeLessThan(QG[above[i - 1]].rollWeight);
    }
    expect(QG.issue.rollWeight).toBeGreaterThan(QG.scrap.rollWeight);
    expect(QG.scrap.rollWeight).toBeGreaterThan(QG.proofed.rollWeight);
  });

  it("names no colour anywhere — the grade's visual belongs to the Base44 session", () => {
    const colours = /\b(red|green|blue|gold|golden|silver|purple|orange|yellow|amber|crimson|azure)\b/i;
    expect(JSON.stringify(QG)).not.toMatch(colours);
  });
});

describe("manufacturers (Work item 7.2)", () => {
  const MAKERS = CANON("MANUFACTURERS");
  const HOUSES = CANON("HOUSE_KEYS");
  const ACCESS = CANON("ACCESS_COST");
  const BASE_KEYS = ["accuracy", "rateOfFire", "damage", "armorPen", "range", "reliability", "weight"];
  // Lower is better for weight; higher is better for everything else.
  const isCost = (k, v) => (k === "weight" ? v > 0 : v < 0);

  // The gate is >= 8, never an exact count: Lane J appends mw_* rows to this
  // same table after Lane I merges, in someone else's PR.
  it("declares at least 8 manufacturers", () => {
    expect(Object.keys(MAKERS).length).toBeGreaterThanOrEqual(8);
  });

  it("access grades price at native ×1.0, licensed ×1.25, captured ×1.5", () => {
    expect(ACCESS).toEqual({ native: 1, licensed: 1.25, captured: 1.5 });
  });

  it("declares every one of Lane I's nine, so the scoped sweep below cannot silently shrink", () => {
    for (const k of LANE_I_MAKERS) expect(MAKERS[k], `${k} is missing from MANUFACTURERS`).toBeDefined();
    expect(LANE_I_MAKERS.length).toBe(9);
  });

  // Scoped, deliberately. See LANE_I_MAKERS at the head of this file: these five
  // assertions are Lane I's authoring standard, not a property of the table, and
  // Lane J's `mw_*` rows answer to Lane J's own acceptance criteria.
  for (const key of LANE_I_MAKERS) {
    describe(key, () => {
      const m = MAKERS[key];

      it("key matches its slot and is tied to a house or a settlement culture", () => {
        expect(m.key).toBe(key);
        expect(Boolean(m.houseKey || m.culture), "neither houseKey nor culture").toBe(true);
        if (m.houseKey) expect(HOUSES).toContain(m.houseKey);
      });

      it("signature is a real lean — at least 2 WeaponBase keys, at least one a genuine cost", () => {
        const entries = Object.entries(m.signature);
        expect(entries.length).toBeGreaterThanOrEqual(2);
        for (const [k, v] of entries) {
          expect(BASE_KEYS, `signature key ${k}`).toContain(k);
          expect(Number.isFinite(v)).toBe(true);
        }
        expect(entries.some(([k, v]) => isCost(k, v)), "signature is all upside").toBe(true);
      });

      it("carries at least 4 name-stems, all usable as a label prefix", () => {
        expect(m.nameStems.length).toBeGreaterThanOrEqual(4);
        expect(new Set(m.nameStems).size).toBe(m.nameStems.length);
        for (const s of m.nameStems) expect(s, `stem ${s}`).toMatch(/^[A-Za-z'’-]+(?: [A-Za-z'’-]+)*$/);
      });

      it("prices access for all ten houses, with at least one native", () => {
        expect(Object.keys(m.access).sort()).toEqual([...HOUSES].sort());
        for (const [h, grade] of Object.entries(m.access)) {
          expect(Object.keys(ACCESS), `${h} access grade`).toContain(grade);
        }
        expect(Object.values(m.access)).toContain("native");
      });

      it("lore is 60–100 words of Ministry voice", () => {
        const words = m.lore.trim().split(/\s+/).length;
        expect(words, `${words} words`).toBeGreaterThanOrEqual(60);
        expect(words, `${words} words`).toBeLessThanOrEqual(100);
      });
    });
  }
});

describe("calibres (Work item 8.2)", () => {
  const CAL = CANON("CALIBRES");
  const CLASSES = CANON("WEAPON_CLASSES");
  const LOGI = CANON("LOGISTICS_CLASSES");

  it("declares at least 10 calibres", () => {
    expect(Object.keys(CAL).length).toBeGreaterThanOrEqual(10);
  });

  it("the logistics classes are exactly the shipped regiment column set", () => {
    expect(LOGI).toEqual(["riflemen", "crawler", "artillery", "fighter"]);
  });

  it("every row is complete, correctly classed, and numerically positive", () => {
    for (const [key, c] of Object.entries(CAL)) {
      expect(c.key).toBe(key);
      expect(CLASSES, `${key}.class`).toContain(c.class);
      expect(LOGI, `${key}.logisticsClass`).toContain(c.logisticsClass);
      for (const f of ["damage", "armorPen", "range", "weight"]) {
        expect(Number.isFinite(c[f]), `${key}.${f}`).toBe(true);
        expect(c[f], `${key}.${f}`).toBeGreaterThan(0);
      }
      expect(c.lore.trim().length, `${key}.lore`).toBeGreaterThan(60);
    }
  });

  it("armour penetration increases across the rifle-calibre ladder", () => {
    const ladder = ["p9_service", "c11_carbine", "r13_line", "hr17_heavy"];
    for (let i = 1; i < ladder.length; i++) {
      expect(CAL[ladder[i]].armorPen, ladder[i]).toBeGreaterThan(CAL[ladder[i - 1]].armorPen);
    }
  });

  it("armour penetration increases across the crawler bores", () => {
    expect(CAL.cg57_bore.armorPen).toBeGreaterThan(CAL.cg37_bore.armorPen);
  });

  it("the line cartridge names the shipped standardized_calibers doctrine", () => {
    expect(CAL.r13_line.lore).toMatch(/Standardized Calibers/);
  });

  it("every logistics class is actually fed by at least one calibre", () => {
    const fed = new Set(Object.values(CAL).map((c) => c.logisticsClass));
    expect([...fed].sort()).toEqual([...LOGI].sort());
  });
});

describe("weapon patterns (Work items 9.1–9.7)", () => {
  const WP = CANON("WEAPON_PATTERNS");
  const MAKERS = CANON("MANUFACTURERS");
  const CAL = CANON("CALIBRES");
  const CLASSES = CANON("WEAPON_CLASSES");
  const SLOTS = CANON("MOD_SLOTS");
  const TYPES = CANON("DAMAGE_TYPES");
  const APPLIES = CANON("APPLIES_TO_KEYS");
  const KEYS = Object.keys(WP);

  // §4 SquadType tier values, verbatim. Declared here rather than imported:
  // arms.ts never imports tactical.ts (a Deno shared module borrowing another
  // module's union is exactly the coupling §3 forbids).
  const TIERS = ["I", "II:Cache", "II:Eng", "II:Ciph", "II:Wake", "III"];

  // Work item 9.2's regex, verbatim from the brief.
  const LABEL_RE = /^[A-Za-z'’-]+(?: [A-Za-z'’-]+)* \d{3} [A-Za-z0-9'’-]+(?: [A-Za-z0-9'’-]+)*, Mk [IVX]+$/;

  // The per-class floors of Work item 9.1. Read as "at least this many", never
  // as an exact count — a later step may add rows to any class.
  const CLASS_FLOORS = {
    sidearm: 3, carbine: 3, rifle: 6, smg: 3, lmg: 3, hmg: 2, shotgun: 2,
    marksman: 3, anti_armor: 3, flame: 2, mortar: 3, crawler_gun: 3,
    artillery: 3, aircraft_gun: 2,
  };

  it("declares at least 40 hand-authored patterns", () => {
    expect(KEYS.length).toBeGreaterThanOrEqual(40);
  });

  it("covers every WeaponClass, at or above its per-class floor", () => {
    const seen = {};
    for (const p of Object.values(WP)) seen[p.class] = (seen[p.class] || 0) + 1;
    expect(Object.keys(CLASS_FLOORS).sort()).toEqual([...CLASSES].sort());
    for (const [cls, floor] of Object.entries(CLASS_FLOORS)) {
      expect(seen[cls] || 0, `${cls}: ${seen[cls] || 0} patterns, floor ${floor}`).toBeGreaterThanOrEqual(floor);
    }
  });

  it("the reference pattern is the baseline of the whole Points Audit", () => {
    const p = WP.hw141_levy_rifle_mk2;
    expect(p, "hw141_levy_rifle_mk2 missing").toBeDefined();
    expect(p.label).toBe("Hundredweight 141 Levy Rifle, Mk II");
    expect(p.maker).toBe("hundredweight_works");
    expect(p.calibre).toBe("r13_line");
    expect(p.class).toBe("rifle");
    expect(p.tier).toBe("I");
    expect(p.pts).toBe(1);
  });

  it("every row carries every §4 field, and nothing else", () => {
    const FIELDS = ["key", "label", "maker", "calibre", "class", "tier", "base", "slots", "quirks", "pts", "appliesTo", "blurb"];
    for (const [k, p] of Object.entries(WP)) {
      expect(Object.keys(p).sort(), `${k} fields`).toEqual([...FIELDS].sort());
      expect(p.key, `${k}.key`).toBe(k);
    }
  });

  it("every maker, calibre, class and tier resolves to a declared row", () => {
    for (const [k, p] of Object.entries(WP)) {
      expect(Object.keys(MAKERS), `${k}.maker`).toContain(p.maker);
      expect(Object.keys(CAL), `${k}.calibre`).toContain(p.calibre);
      expect(CLASSES, `${k}.class`).toContain(p.class);
      expect(TIERS, `${k}.tier`).toContain(p.tier);
    }
  });

  it("nomenclature holds: stem, three-digit F.I. year in 141–383, name, mark", () => {
    for (const [k, p] of Object.entries(WP)) {
      expect(p.label, `${k}.label`).toMatch(LABEL_RE);
      const year = Number(p.label.match(/ (\d{3}) /)[1]);
      expect(year, `${k} pattern year`).toBeGreaterThanOrEqual(141);
      expect(year, `${k} pattern year`).toBeLessThanOrEqual(383);
      const stems = MAKERS[p.maker].nameStems;
      expect(
        stems.some((s) => p.label.startsWith(s + " ")),
        `${k}: "${p.label}" begins with none of ${p.maker}'s stems ${JSON.stringify(stems)}`,
      ).toBe(true);
    }
  });

  it("base is a COMPLETE WeaponBase on every row — all nine keys, no exceptions", () => {
    const BASE = ["accuracy", "rateOfFire", "damage", "armorPen", "range", "reliability", "weight", "damageType", "aoe"];
    for (const [k, p] of Object.entries(WP)) {
      expect(Object.keys(p.base).sort(), `${k}.base`).toEqual([...BASE].sort());
      for (const f of ["accuracy", "rateOfFire", "damage", "range", "reliability", "weight"]) {
        expect(Number.isFinite(p.base[f]), `${k}.base.${f}`).toBe(true);
        expect(p.base[f], `${k}.base.${f}`).toBeGreaterThan(0);
      }
      expect(Number.isFinite(p.base.armorPen), `${k}.base.armorPen`).toBe(true);
      expect(p.base.armorPen, `${k}.base.armorPen`).toBeGreaterThanOrEqual(0);
      expect(p.base.reliability, `${k}.base.reliability`).toBeLessThanOrEqual(1);
    }
  });

  it("damageType is one of the seven, and every one of the seven is actually used", () => {
    const used = new Set();
    for (const [k, p] of Object.entries(WP)) {
      expect(TYPES, `${k}.base.damageType`).toContain(p.base.damageType);
      used.add(p.base.damageType);
    }
    // A damage type declared in the matrix and carried by no pattern is 49
    // numbers doing nothing — the matrix and the catalogue must agree.
    expect([...used].sort(), "an unused damage type").toEqual([...TYPES].sort());
  });

  it("aoe is null for point fire, or a whole-hex radius with a real falloff", () => {
    let bursts = 0;
    for (const [k, p] of Object.entries(WP)) {
      const a = p.base.aoe;
      if (a === null) continue;
      bursts++;
      expect(Object.keys(a).sort(), `${k}.base.aoe`).toEqual(["falloff", "radius"]);
      expect(Number.isInteger(a.radius), `${k}.aoe.radius`).toBe(true);
      expect(a.radius, `${k}.aoe.radius`).toBeGreaterThanOrEqual(1);
      expect(a.falloff, `${k}.aoe.falloff`).toBeGreaterThan(0);
      expect(a.falloff, `${k}.aoe.falloff`).toBeLessThanOrEqual(1);
    }
    expect(bursts, "no bursting weapon in the catalogue").toBeGreaterThan(0);
  });

  it("slots, quirks and appliesTo are valid, deduplicated and non-empty", () => {
    for (const [k, p] of Object.entries(WP)) {
      expect(p.slots.length, `${k}.slots`).toBeGreaterThanOrEqual(2);
      expect(new Set(p.slots).size, `${k}.slots has a duplicate`).toBe(p.slots.length);
      for (const s of p.slots) expect(SLOTS, `${k}.slots`).toContain(s);
      expect(Array.isArray(p.quirks), `${k}.quirks`).toBe(true);
      expect(new Set(p.quirks).size, `${k}.quirks has a duplicate`).toBe(p.quirks.length);
      for (const q of p.quirks) expect(Object.keys(CANON("QUIRKS")), `${k}.quirks`).toContain(q);
      expect(p.appliesTo.length, `${k}.appliesTo`).toBeGreaterThanOrEqual(1);
      expect(new Set(p.appliesTo).size, `${k}.appliesTo has a duplicate`).toBe(p.appliesTo.length);
      for (const a of p.appliesTo) expect(APPLIES, `${k}.appliesTo`).toContain(a);
    }
  });

  it("pts is a positive finite number and blurb is Ministry-voice prose", () => {
    for (const [k, p] of Object.entries(WP)) {
      expect(Number.isFinite(p.pts), `${k}.pts`).toBe(true);
      expect(p.pts, `${k}.pts`).toBeGreaterThan(0);
      expect(p.blurb.trim().length, `${k}.blurb`).toBeGreaterThan(60);
    }
  });

  it("CALIBRES HAVE TEETH — every base value sits within ±50 % of its calibre (Work item 8.3)", () => {
    for (const [k, p] of Object.entries(WP)) {
      const c = CAL[p.calibre];
      for (const f of ["damage", "armorPen", "range", "weight"]) {
        expect(p.base[f], `${k}.base.${f} vs ${p.calibre}.${f} (${c[f]})`).toBeGreaterThanOrEqual(c[f] * 0.5);
        expect(p.base[f], `${k}.base.${f} vs ${p.calibre}.${f} (${c[f]})`).toBeLessThanOrEqual(c[f] * 1.5);
      }
    }
  });

  it("every one of Lane I's makers builds something and every calibre feeds something", () => {
    // Scoped for the same reason as everything else keyed off LANE_I_MAKERS:
    // Lane J's motor-works append rows to MANUFACTURERS and draw from
    // WEAPON_PATTERNS rather than adding to it, so a `mw_*` maker legitimately
    // builds nothing in THIS table and must not redden THIS file.
    const makers = new Set(Object.values(WP).map((p) => p.maker));
    const calibres = new Set(Object.values(WP).map((p) => p.calibre));
    for (const m of LANE_I_MAKERS) expect([...makers], `${m} builds nothing`).toContain(m);
    for (const c of Object.keys(CAL)) expect([...calibres], `${c} feeds nothing`).toContain(c);
  });

  it("keys are unique, kebab-free and stable — live saves reference them", () => {
    for (const k of KEYS) expect(k, `${k}`).toMatch(/^[a-z][a-z0-9_]*$/);
    expect(new Set(KEYS).size).toBe(KEYS.length);
  });
});

describe("THE CLASS SWEEP — the design invariant the damage model exists to express (Work item 9.8)", () => {
  const WP = MIRROR.WEAPON_PATTERNS;
  const MAKERS = MIRROR.MANUFACTURERS;
  const AC = MIRROR.ARMOUR_CLASSES;

  // THE REAL FUNCTION, not a hand-rolled stand-in. Step 2 of this lane proved
  // the sweep against a two-line helper that reproduced resolveWeapon's steps
  // 1→2 by hand; the moment resolveWeapon landed, the helper became a second
  // implementation of the thing under test — a gate on a proxy. The assertions
  // did not move, and they still pass, which is the evidence that the helper
  // was faithful and that it is now redundant.
  //
  // An ISSUE-grade, un-modded instance under an EMPTY context resolves to the
  // pattern's base plus its maker's signature and nothing else: `issue` is the
  // neutral grade (every multiplier exactly 1), there are no mods, and no
  // conditional quirk fires against a context that says nothing.
  const issueBase = (key) => MIRROR.resolveWeapon({ patternKey: key, quality: "issue", mods: [], quirks: [] }, {});

  const SMALL_ARMS = ["sidearm", "carbine", "rifle", "smg", "lmg", "hmg", "shotgun", "marksman", "flame"];
  const ARMOUR_KILLERS = ["anti_armor", "crawler_gun", "artillery"];

  it("NOTHING a figure carries can scratch heavy or superheavy armour", () => {
    let swept = 0;
    for (const [k, p] of Object.entries(WP)) {
      if (!SMALL_ARMS.includes(p.class)) continue;
      const w = issueBase(k);
      for (const t of ["heavy", "superheavy"]) {
        const r = MIRROR.resolveHit({ weapon: w, target: AC[t] });
        expect(r.effective, `${k} (${p.class}) vs ${t}`).toBe(0);
        expect(r.suppressOnly, `${k} (${p.class}) vs ${t}`).toBe(true);
      }
      swept++;
    }
    expect(swept, "the sweep found no small arms — it has rotted").toBeGreaterThanOrEqual(25);
  });

  it("every weapon bought to open a hull DOES open a heavy one", () => {
    let swept = 0;
    for (const [k, p] of Object.entries(WP)) {
      if (!ARMOUR_KILLERS.includes(p.class)) continue;
      const r = MIRROR.resolveHit({ weapon: issueBase(k), target: AC.heavy });
      expect(r.effective, `${k} (${p.class}) vs heavy`).toBeGreaterThan(0);
      expect(r.suppressOnly, `${k} (${p.class}) vs heavy`).toBe(false);
      swept++;
    }
    expect(swept, "the sweep found no armour-killers — it has rotted").toBeGreaterThanOrEqual(9);
  });

  it("the budget behind the sweep: a small arm's penetration plus its maker's lean stays under 4", () => {
    // Stated as a number rather than only as an outcome, because this is the
    // constraint a later step authoring a new pattern has to hold in its head.
    // Heavy armour rates 10 and a delta of −6 still lets a tenth through, so
    // the ceiling is strict.
    for (const [k, p] of Object.entries(WP)) {
      if (!SMALL_ARMS.includes(p.class)) continue;
      expect(issueBase(k).armorPen, `${k}: base ${p.base.armorPen} + ${p.maker}'s lean`).toBeLessThan(4);
    }
  });

  it("AND NOT AT ANY GRADE, HOWEVER FITTED, UNDER ANY CONDITION — the containment sweep", () => {
    // The sweep above proves a much weaker claim than the design makes: it
    // fires an ISSUE-grade, UN-MODDED weapon under an EMPTY context. The claim
    // the model actually rests on is unqualified — no rifle company ever
    // acquires the ability to kill crawlers — so this test closes the three
    // remaining doors by construction rather than by sampling.
    //
    // effective = damage × penMult × typeMult, and penMult is 0 whenever the
    // delta is below −6. Damage and damage type therefore cannot break the
    // sweep at all: only `armorPen` can. So the whole claim reduces to one
    // arithmetic ceiling, and there are exactly three ways to raise it:
    //   quality — the grade multipliers do not name armorPen at all;
    //   quirks  — no quirk in the table writes armorPen;
    //   mods    — no armorPen-adding mod lists a small-arm class in appliesTo.
    // Each is asserted below over the whole table, and then the worst possible
    // fitted weapon is priced: every armorPen-adding mod that is legal for the
    // pattern, one per slot, plus every armorPen-adding quirk in the catalogue.
    for (const g of Object.values(MIRROR.QUALITY_GRADES)) {
      expect(Object.keys(g.mult), `${g.key}.mult names armorPen`).not.toContain("armorPen");
    }
    for (const [qk, q] of Object.entries(MIRROR.QUIRKS)) {
      expect(Object.keys(q.mods), `quirk ${qk} writes armorPen`).not.toContain("armorPen");
    }
    for (const [mk, mod] of Object.entries(MIRROR.MODIFICATIONS)) {
      if (!((mod.mods.armorPen || 0) > 0)) continue;
      for (const cls of mod.appliesTo) {
        expect(SMALL_ARMS, `mod ${mk} adds armorPen and is legal on a ${cls}`).not.toContain(cls);
      }
    }

    let priced = 0;
    for (const [k, p] of Object.entries(WP)) {
      if (!SMALL_ARMS.includes(p.class)) continue;
      const best = {};
      for (const mod of Object.values(MIRROR.MODIFICATIONS)) {
        if (!p.slots.includes(mod.slot) || !mod.appliesTo.includes(p.class)) continue;
        const delta = (mod.mods.armorPen || 0) + (mod.tradeoff.armorPen || 0);
        if (delta > 0) best[mod.slot] = Math.max(best[mod.slot] || 0, delta);
      }
      let ceiling = p.base.armorPen + (MAKERS[p.maker].signature.armorPen || 0);
      for (const v of Object.values(best)) ceiling += v;
      for (const q of Object.values(MIRROR.QUIRKS)) if ((q.mods.armorPen || 0) > 0) ceiling += q.mods.armorPen;
      // Below 4 is not a round number chosen for comfort: heavy armour rates
      // 10, and PEN_TABLE still passes a tenth of the damage at a delta of −6.
      expect(ceiling, `${k}: best-case fitted armour penetration`).toBeLessThan(4);
      expect(MIRROR.penMultFor(ceiling - AC.heavy.armourValue), `${k} vs heavy at its ceiling`).toBe(0);
      priced++;
    }
    expect(priced, "the containment sweep found no small arms — it has rotted").toBeGreaterThanOrEqual(25);
  });

  it("mortar and aircraft_gun are deliberately unconstrained by the sweep", () => {
    // Not an accident and not an oversight: a mortar is bought to kill men and
    // a wing cannon to kill aircraft. Neither answers for a crawler, and
    // neither is asserted either way — this test exists so that a later reader
    // does not "complete" the sweep by adding them to it.
    const free = Object.values(WP).filter((p) => p.class === "mortar" || p.class === "aircraft_gun");
    expect(free.length).toBeGreaterThan(0);
    for (const p of free) {
      expect(SMALL_ARMS).not.toContain(p.class);
      expect(ARMOUR_KILLERS).not.toContain(p.class);
    }
  });
});

// ---------------------------------------------------------------------------
// Modifications and quirks. Both tables are asserted MECHANICALLY over their
// whole contents rather than by spot-checking rows: the acceptance criteria
// say "every one with a non-empty numeric tradeoff" and "every one with a
// machine-evaluable condition", and a test that names three examples proves
// neither.
// ---------------------------------------------------------------------------

describe("modifications (Work item 11)", () => {
  const MODS = CANON("MODIFICATIONS");
  const SLOTS = CANON("MOD_SLOTS");
  const CLASSES = CANON("WEAPON_CLASSES");
  const TYPES = CANON("DAMAGE_TYPES");
  const WP = CANON("WEAPON_PATTERNS");
  // The seven numeric WeaponBase fields. `damageType` and `aoe` are the two
  // replacements and are handled separately — they are not better or worse.
  const NUMERIC = ["accuracy", "rateOfFire", "damage", "armorPen", "range", "reliability", "weight"];
  // Weight is the one field where MORE is worse; everything else, less is worse.
  const isCost = (k, v) => (k === "weight" ? v > 0 : v < 0);
  const KEYS = Object.keys(MODS);

  it("declares at least 26 modifications", () => {
    expect(KEYS.length).toBeGreaterThanOrEqual(26);
  });

  it("fills every one of the eight slots at least three deep", () => {
    const perSlot = {};
    for (const m of Object.values(MODS)) perSlot[m.slot] = (perSlot[m.slot] || 0) + 1;
    for (const s of SLOTS) {
      expect(perSlot[s] || 0, `${s}: ${perSlot[s] || 0} mods`).toBeGreaterThanOrEqual(3);
    }
    expect(Object.keys(perSlot).sort()).toEqual([...SLOTS].sort());
  });

  it("every row is complete, keyed to its own slot, and priced", () => {
    for (const [k, m] of Object.entries(MODS)) {
      expect(m.key, `${k}.key`).toBe(k);
      expect(k, `${k} is not a stable snake_case key`).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(SLOTS, `${k}.slot`).toContain(m.slot);
      expect(m.appliesTo.length, `${k}.appliesTo`).toBeGreaterThanOrEqual(1);
      expect(new Set(m.appliesTo).size, `${k}.appliesTo has a duplicate`).toBe(m.appliesTo.length);
      for (const c of m.appliesTo) expect(CLASSES, `${k}.appliesTo`).toContain(c);
      expect(Number.isFinite(m.pts), `${k}.pts`).toBe(true);
      expect(m.pts, `${k}.pts`).toBeGreaterThanOrEqual(0);
      expect(m.label.length, `${k}.label`).toBeGreaterThan(3);
      expect(m.blurb.trim().length, `${k}.blurb`).toBeGreaterThan(60);
    }
  });

  it("EVERY MOD HAS A NON-EMPTY TRADEOFF, AND EVERY ENTRY IN IT IS GENUINELY WORSE", () => {
    // The acceptance criterion of this table. A mod that is pure upside is a
    // bug in this lane: it collapses the choice the slot exists to pose.
    for (const [k, m] of Object.entries(MODS)) {
      const cost = Object.entries(m.tradeoff);
      expect(cost.length, `${k}.tradeoff is empty — no mod may be pure upside`).toBeGreaterThanOrEqual(1);
      for (const [f, v] of cost) {
        expect(NUMERIC, `${k}.tradeoff.${f} is not a numeric WeaponBase field`).toContain(f);
        expect(Number.isFinite(v), `${k}.tradeoff.${f}`).toBe(true);
        expect(isCost(f, v), `${k}.tradeoff.${f} = ${v} is not a cost`).toBe(true);
      }
    }
  });

  it("every mod's benefits are non-empty and genuinely better", () => {
    for (const [k, m] of Object.entries(MODS)) {
      const gain = Object.entries(m.mods);
      expect(gain.length, `${k}.mods is empty`).toBeGreaterThanOrEqual(1);
      for (const [f, v] of gain) {
        if (f === "damageType" || f === "aoe") continue;
        expect(NUMERIC, `${k}.mods.${f} is not a numeric WeaponBase field`).toContain(f);
        expect(Number.isFinite(v), `${k}.mods.${f}`).toBe(true);
        expect(isCost(f, v), `${k}.mods.${f} = ${v} is a cost, not a benefit`).toBe(false);
      }
    }
  });

  it("mods and tradeoff never name the same field — the two are disjoint", () => {
    for (const [k, m] of Object.entries(MODS)) {
      for (const f of Object.keys(m.mods)) {
        expect(Object.keys(m.tradeoff), `${k}: ${f} is in both mods and tradeoff`).not.toContain(f);
      }
    }
  });

  it("the two replacement fields appear only in mods, are valid, and are still paid for", () => {
    // damageType and aoe are set, not added. Neither is better or worse in the
    // abstract — a shaped filling is a trade — so a mod that sets one must
    // still carry a numeric cost, which the tradeoff assertion already forces.
    // What is asserted here is that the values are legal and that they never
    // appear on the cost side, where "worse" would be meaningless.
    let setters = 0;
    for (const [k, m] of Object.entries(MODS)) {
      expect(Object.keys(m.tradeoff), `${k}.tradeoff sets damageType`).not.toContain("damageType");
      expect(Object.keys(m.tradeoff), `${k}.tradeoff sets aoe`).not.toContain("aoe");
      if (m.mods.damageType !== undefined) {
        expect(TYPES, `${k}.mods.damageType`).toContain(m.mods.damageType);
        setters++;
      }
      if (m.mods.aoe !== undefined) {
        expect(Number.isInteger(m.mods.aoe.radius), `${k}.mods.aoe.radius`).toBe(true);
        expect(m.mods.aoe.radius, `${k}.mods.aoe.radius`).toBeGreaterThanOrEqual(1);
        expect(m.mods.aoe.falloff, `${k}.mods.aoe.falloff`).toBeGreaterThan(0);
        expect(m.mods.aoe.falloff, `${k}.mods.aoe.falloff`).toBeLessThanOrEqual(1);
        setters++;
      }
    }
    expect(setters, "no modification changes a damage type or adds a burst — the fitting has no teeth").toBeGreaterThan(0);
  });

  it("every weapon class a pattern actually offers can be fitted in every slot it offers", () => {
    // A pattern that declares a slot no modification can fill is a slot that
    // is decoration. Checked against the patterns rather than against the
    // class list, because the classes only matter where a pattern uses them.
    for (const [pk, p] of Object.entries(WP)) {
      let legal = 0;
      for (const s of p.slots) {
        const fits = Object.values(MODS).filter((m) => m.slot === s && m.appliesTo.includes(p.class));
        expect(fits.length, `${pk} (${p.class}) declares slot '${s}' and nothing fits it`).toBeGreaterThan(0);
        legal += fits.length;
      }
      expect(legal, `${pk} has fewer than two fittable modifications`).toBeGreaterThanOrEqual(2);
    }
  });

  it("the bayonet slot is the catalogue's only melee channel, and every blade carries a weight cost", () => {
    const blades = Object.entries(MODS).filter(([, m]) => m.slot === "bayonet");
    expect(blades.length).toBeGreaterThanOrEqual(3);
    for (const [k, m] of blades) {
      expect(m.mods.damage, `${k}: a bayonet with no blade value`).toBeGreaterThan(0);
      expect(m.tradeoff.weight, `${k}: a bayonet that weighs nothing`).toBeGreaterThan(0);
    }
  });
});

describe("quirks (Work item 12)", () => {
  const QUIRKS = CANON("QUIRKS");
  const VOCAB = CANON("QUIRK_CONDITION_KEYS");
  const SPECIALISTS = CANON("SPECIALIST_KEYS");
  const GRADES = CANON("QUALITY_ORDER");
  const AC = CANON("ARMOUR_CLASSES");
  const HOUSES = CANON("HOUSE_KEYS");
  const WEATHERS = ["clear", "rain", "snow", "fog", "storm"];
  const BASE_FIELDS = ["accuracy", "rateOfFire", "damage", "armorPen", "range", "reliability", "weight"];
  const KEYS = Object.keys(QUIRKS);

  it("declares at least 20 quirks", () => {
    expect(KEYS.length).toBeGreaterThanOrEqual(20);
  });

  it("names the four the contract calls for, in spirit and in numbers", () => {
    expect(QUIRKS.cold_forged.condition).toEqual({ key: "weather", value: "snow" });
    expect(QUIRKS.cold_forged.mods.reliability).toBeCloseTo(0.1, 6);
    expect(QUIRKS.ferrymans_blessing.condition).toEqual({ key: "adjacent_specialist", value: "relic_bearer" });
    expect(QUIRKS.ferrymans_blessing.mods.morale).toBe(1);
    expect(QUIRKS.runs_hot.condition).toEqual({ key: "consecutive_fire", value: 2 });
    expect(QUIRKS.runs_hot.mods.rateOfFire).toBeCloseTo(0.15, 6);
    expect(QUIRKS.runs_hot.mods.reliability).toBeCloseTo(-0.1, 6);
    expect(QUIRKS.prize_taken.condition).toEqual({ key: "vs_house", value: "native_house" });
    expect(QUIRKS.prize_taken.mods.morale).toBe(1);
  });

  it("EVERY QUIRK HAS A CONDITION, AND EVERY CONDITION IS IN THE PUBLISHED VOCABULARY", () => {
    for (const [k, q] of Object.entries(QUIRKS)) {
      expect(q.key, `${k}.key`).toBe(k);
      expect(q.condition, `${k} has no condition — an effect that exists only in prose`).toBeTruthy();
      expect(Object.keys(VOCAB), `${k}.condition.key`).toContain(q.condition.key);
    }
  });

  it("condition.value matches the valueType the vocabulary declares, and 'none' carries no value", () => {
    for (const [k, q] of Object.entries(QUIRKS)) {
      const declared = VOCAB[q.condition.key].valueType;
      if (declared === "none") {
        expect(Object.prototype.hasOwnProperty.call(q.condition, "value"), `${k}: a valueless condition carries a value`).toBe(false);
      } else {
        expect(Object.prototype.hasOwnProperty.call(q.condition, "value"), `${k}: missing condition.value`).toBe(true);
        expect(typeof q.condition.value, `${k}.condition.value`).toBe(declared);
      }
    }
  });

  it("every condition value names something that actually exists in this repository", () => {
    // The vocabulary types a value as a string; this checks it is a string
    // FROM THE RIGHT SET, which is the difference between a machine-evaluable
    // condition and a typo that silently never fires.
    for (const [k, q] of Object.entries(QUIRKS)) {
      const c = q.condition;
      if (c.key === "weather") expect(WEATHERS, `${k}.condition.value`).toContain(c.value);
      if (c.key === "adjacent_specialist") expect(SPECIALISTS, `${k}.condition.value`).toContain(c.value);
      if (c.key === "vs_armour_class") expect(Object.keys(AC), `${k}.condition.value`).toContain(c.value);
      if (c.key === "quality_at_least") expect(GRADES, `${k}.condition.value`).toContain(c.value);
      if (c.key === "vs_house" && c.value !== "native_house") expect(HOUSES, `${k}.condition.value`).toContain(c.value);
    }
  });

  it("every one of the twelve published condition keys is actually used by a quirk", () => {
    // A vocabulary entry no quirk uses is an instruction to the platform lane
    // to implement something nothing needs.
    const used = new Set(Object.values(QUIRKS).map((q) => q.condition.key));
    for (const key of Object.keys(VOCAB)) {
      expect([...used], `condition key '${key}' is published and unused`).toContain(key);
    }
  });

  it("mods are non-empty and confined to WeaponBase fields or morale/initiative", () => {
    for (const [k, q] of Object.entries(QUIRKS)) {
      const entries = Object.entries(q.mods);
      expect(entries.length, `${k}.mods is empty`).toBeGreaterThanOrEqual(1);
      for (const [f, v] of entries) {
        expect([...BASE_FIELDS, "morale", "initiative"], `${k}.mods.${f}`).toContain(f);
        expect(Number.isFinite(v), `${k}.mods.${f}`).toBe(true);
      }
      expect(q.blurb.trim().length, `${k}.blurb`).toBeGreaterThan(60);
    }
  });

  it("NO QUIRK MIXES THE TWO BRANCHES OF THE §4 UNION — half a row would be silently discarded", () => {
    // §4: Quirk.mods is `Partial<WeaponBase> | { morale?, initiative? }` — a
    // UNION, not a mix. applyDelta copies only WEAPON_BASE_KEYS, so a row
    // carrying both would have its morale term dropped in resolveWeapon with no
    // error anywhere while its WeaponBase term applied. One row did exactly
    // that. Nothing in this lane consumes morale or initiative at all
    // (deriveLoadout's keys are fixed by LOADOUT_KEYS; loadoutProfile returns
    // four fields), so those rows are DECLARATIVE until the platform wires
    // them — a stated handoff item, not a silent half-application.
    let declarative = 0;
    for (const [k, q] of Object.entries(QUIRKS)) {
      const fields = Object.keys(q.mods);
      const weaponSide = fields.filter((f) => BASE_FIELDS.includes(f));
      const squadSide = fields.filter((f) => f === "morale" || f === "initiative");
      expect(weaponSide.length === 0 || squadSide.length === 0, `${k}.mods mixes ${weaponSide.join("+")} with ${squadSide.join("+")}`).toBe(true);
      if (squadSide.length > 0) declarative++;
    }
    expect(declarative, "the morale/initiative branch of the union is no longer exercised").toBeGreaterThan(0);
  });

  it("an 'always' quirk is an INSTANCE quirk and is never authored onto a pattern", () => {
    // An unconditional modifier attached to a design is indistinguishable from
    // the design's own numbers and belongs in `base`. Keeping them off the
    // patterns is also what keeps the Points Audit honest: every pattern is
    // priced with ctx = {}, and an always-on quirk would move that price.
    const unconditional = Object.keys(QUIRKS).filter((k) => QUIRKS[k].condition.key === "always");
    expect(unconditional.length, "no unconditional quirks at all — rollWeapon has nothing to hang on an instance").toBeGreaterThan(0);
    for (const [pk, p] of Object.entries(CANON("WEAPON_PATTERNS"))) {
      for (const q of p.quirks) {
        expect(unconditional, `${pk} carries the unconditional quirk '${q}'`).not.toContain(q);
      }
    }
  });

  it("evaluateQuirk is total: a boolean for every quirk, against an empty and a full context, never throwing", () => {
    const full = {
      weather: "snow", terrain: "rubble", night: true, adjacentSpecialists: [...SPECIALISTS],
      consecutiveFire: 9, vsHouse: "reclamation", nativeHouses: ["reclamation"], vsArmourClass: "heavy",
      quality: "relic", range: 0, figures: 12, round: 12,
    };
    for (const [k, q] of Object.entries(QUIRKS)) {
      for (const [label, ctx] of [["empty", {}], ["full", full], ["undefined", undefined]]) {
        const out = MIRROR.evaluateQuirk(q, ctx);
        expect(typeof out, `${k} against the ${label} context`).toBe("boolean");
      }
      // The empty context is the one the Points Audit uses: nothing but an
      // unconditional quirk may fire against it.
      expect(MIRROR.evaluateQuirk(q, {}), `${k} fires against an empty context`).toBe(q.condition.key === "always");
    }
    expect(MIRROR.evaluateQuirk({ key: "x", label: "x", mods: {}, condition: { key: "not_a_real_key" } }, {})).toBe(false);
    expect(MIRROR.evaluateQuirk({ key: "x", label: "x", mods: {} }, {})).toBe(false);
    expect(MIRROR.evaluateQuirk(undefined, {})).toBe(false);
  });

  it("every quirk is reachable — on a pattern, or drawable onto an instance", () => {
    const onPatterns = new Set();
    for (const p of Object.values(CANON("WEAPON_PATTERNS"))) for (const q of p.quirks) onPatterns.add(q);
    expect(onPatterns.size, "no pattern carries a quirk").toBeGreaterThan(10);
    // rollWeapon draws extras from every key not already on the pattern, so
    // the remainder are reachable by definition; what would NOT be reachable
    // is a key on a pattern that the table does not declare.
    for (const q of onPatterns) expect(KEYS, `pattern quirk '${q}' is not declared`).toContain(q);
  });
});

// ---------------------------------------------------------------------------
// §21.e THE POINTS AUDIT.
//
// A points audit written by hand rots. This one is code, and this block is
// what makes that true: it re-computes every valuation from the tables, and
// then reads docs/ARMS_CATALOGUE.md §11.4 back out of the markdown and checks
// it CELL BY CELL against those values. A stale number in the document is a
// red test rather than a reader's problem — which is the whole difference
// between an audit and a claim.
// ---------------------------------------------------------------------------

describe("the Points Audit (Work item 16)", () => {
  const WP = CANON("WEAPON_PATTERNS");
  const MODEL = CANON("POINTS_MODEL");
  const PATTERNS = Object.values(WP);

  it("the reference pattern is priced at exactly 1 point", () => {
    expect(WP[MODEL.apReferenceKey], `${MODEL.apReferenceKey} is not in the register`).toBeDefined();
    expect(WP[MODEL.apReferenceKey].pts).toBe(1);
    expect(MODEL.apReferenceKey).toBe("hw141_levy_rifle_mk2");
  });

  it("the model is calibrated: fairPts(reference) === 1 to within 0.005", () => {
    const fair = MIRROR.fairPts(WP[MODEL.apReferenceKey]);
    expect(Math.abs(fair - 1), `fairPts(${MODEL.apReferenceKey}) = ${fair}`).toBeLessThanOrEqual(0.005);
  });

  it("the anti-armour term is a real share of the anti-armour reference's price", () => {
    const ref = WP[MODEL.aaReferenceKey];
    expect(ref, `${MODEL.aaReferenceKey} is not in the register`).toBeDefined();
    expect(ref.class).toBe("anti_armor");
    const aaTerm = MIRROR.aaValue(ref) / MODEL.AA_RATE;
    const share = aaTerm / MIRROR.fairPts(ref);
    expect(share, `aa term ${aaTerm} of fairPts ${MIRROR.fairPts(ref)} = ${(share * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.4);
  });

  // Two rates is the mechanism, not the decoration. If AA_RATE could be
  // anything at all without moving a price, the separation would be a comment
  // rather than a model — so prove it moves the number it claims to.
  it("anti-armour value is genuinely priced SEPARATELY from anti-personnel value", () => {
    const ref = WP[MODEL.aaReferenceKey];
    const ap = MIRROR.apValue(ref);
    const aa = MIRROR.aaValue(ref);
    expect(aa, "the anti-armour reference has no anti-armour value at all").toBeGreaterThan(0);
    // Priced on the anti-personnel term alone it would be a different weapon.
    const apOnly = ap / MODEL.AP_RATE;
    expect(MIRROR.fairPts(ref)).toBeGreaterThan(apOnly);
    // And the two rates are not the same number wearing two names.
    expect(MODEL.AA_RATE).not.toBe(MODEL.AP_RATE);
  });

  it("no pattern exceeds the efficiency cap", () => {
    const over = PATTERNS.map((p) => [p.key, MIRROR.patternEfficiency(p)]).filter(([, e]) => e > MODEL.efficiencyCap);
    expect(over, `over the ${MODEL.efficiencyCap} cap: ${over.map(([k, e]) => `${k} ${e}`).join(", ")}`).toEqual([]);
  });

  it("every anti_armor, crawler_gun and artillery pattern has anti-armour value", () => {
    const armourKillers = PATTERNS.filter((p) => ["anti_armor", "crawler_gun", "artillery"].includes(p.class));
    expect(armourKillers.length).toBeGreaterThan(8);
    for (const p of armourKillers) {
      expect(MIRROR.aaValue(p), `${p.key} (${p.class}) is worth nothing against heavy armour`).toBeGreaterThan(0);
    }
  });

  it("every valuation is a finite, non-negative number for every pattern", () => {
    for (const p of PATTERNS) {
      for (const [name, v] of [["apValue", MIRROR.apValue(p)], ["aaValue", MIRROR.aaValue(p)],
        ["fairPts", MIRROR.fairPts(p)], ["patternEfficiency", MIRROR.patternEfficiency(p)]]) {
        expect(Number.isFinite(v), `${name}(${p.key}) = ${v}`).toBe(true);
        expect(v, `${name}(${p.key})`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // The instruction the sister lane got wrong: a cost curve whose totals were
  // arithmetically false against its own tree, restated in three places and
  // checked by nothing. This is the check.
  it("docs/ARMS_CATALOGUE.md §11.4 is arithmetically true against the tables, cell by cell", () => {
    const doc = readRepoFile("docs/ARMS_CATALOGUE.md");
    const start = doc.indexOf("### 11.4");
    expect(start, "§11.4 is missing from the catalogue").toBeGreaterThan(-1);
    // An unguarded indexOf returns -1, and slice(start, -1) quietly means "to
    // one character before EOF" — a region that grows with every section a
    // later lane appends. Assert the bound instead of trusting it.
    const end = doc.indexOf("\n## ", start);
    expect(end, "§11.4 is not bounded by a following top-level heading").toBeGreaterThan(start);
    const region = doc.slice(start, end);
    const cell = (c) => c.trim().replace(/[`*]/g, "");
    const rows = region.split("\n")
      .filter((l) => /^\| `[a-z0-9_]+` \|/.test(l))
      .map((l) => l.split("|").slice(1, -1).map(cell));

    expect(rows.length, "no audit rows parsed out of §11.4 — the table shape moved").toBe(Object.keys(WP).length);

    for (const [key, cls, maker, pts, ap, aa, fair, eff] of rows) {
      const p = WP[key];
      expect(p, `§11.4 names '${key}', which is not in WEAPON_PATTERNS`).toBeDefined();
      expect(cls, `${key} class`).toBe(p.class);
      expect(maker, `${key} maker`).toBe(p.maker);
      expect(Number(pts), `${key} pts`).toBe(p.pts);
      expect(Number(ap), `${key} apValue`).toBe(MIRROR.apValue(p));
      expect(Number(aa), `${key} aaValue`).toBe(MIRROR.aaValue(p));
      expect(Number(fair), `${key} fairPts`).toBe(MIRROR.fairPts(p));
      expect(Number(eff), `${key} efficiency`).toBe(MIRROR.patternEfficiency(p));
    }
    // Every pattern is in the table, not just every table row in the register.
    const documented = new Set(rows.map((r) => r[0]));
    for (const k of Object.keys(WP)) expect(documented.has(k), `${k} is missing from §11.4`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// §21.f PLATES AND KEYS.
//
// Content lanes never ship visuals (drift guard 10). Art is REQUESTED, as a
// placeholder row with url null, and the prompt must not restate HOUSE_STYLE —
// which is prepended at generation, so a prompt that repeats it is fighting it.
// ---------------------------------------------------------------------------

describe("placeholder plates (Work item 18)", () => {
  const WP = CANON("WEAPON_PATTERNS");
  const MAKERS = CANON("MANUFACTURERS");
  const MODS = CANON("MODIFICATIONS");
  const byKey = new Map(IMAGE_LIBRARY.map((p) => [p.key, p]));
  const mine = IMAGE_LIBRARY.filter((p) => p.category === "arms");

  it("declares the arms category in IMAGE_CATEGORIES", () => {
    expect(IMAGE_CATEGORIES.arms, "the arms category is missing").toBeDefined();
    expect(typeof IMAGE_CATEGORIES.arms.label).toBe("string");
    expect(IMAGE_CATEGORIES.arms.label.length).toBeGreaterThan(0);
    expect(typeof IMAGE_CATEGORIES.arms.desc).toBe("string");
  });

  it("every weapon pattern has an arms_<key> plate", () => {
    for (const k of Object.keys(WP)) {
      expect(byKey.has(`arms_${k}`), `arms_${k} is missing from IMAGE_LIBRARY`).toBe(true);
    }
    expect(Object.keys(WP).length).toBeGreaterThanOrEqual(42);
  });

  // Scoped to THIS lane's nine keys on purpose. Lane J appends mw_* rows to
  // MANUFACTURERS after this lane merges, and a sweep over the whole table
  // would go red on main, in someone else's PR, for a plate Lane J was never
  // told to author.
  it("every one of Lane I's nine manufacturers has a maker_<key> plate", () => {
    const LANE_I_MAKERS = [
      "hundredweight_works", "reclamation_state_arsenal", "emberwright_foundries",
      "ferrymen_shrine_armoury", "salvage_court_prize_yard", "crossloom_pattern_house",
      "ascendancy_signal_works", "outrider_wheelwrights", "tarpool_burnworks",
    ];
    for (const k of LANE_I_MAKERS) {
      expect(MAKERS[k], `${k} is not in MANUFACTURERS`).toBeDefined();
      expect(byKey.has(`maker_${k}`), `maker_${k} is missing from IMAGE_LIBRARY`).toBe(true);
    }
    // The gate on the table itself is >= 8, never an exact count.
    expect(Object.keys(MAKERS).length).toBeGreaterThanOrEqual(8);
  });

  it("every modification has a mod_kit_<key> plate", () => {
    for (const k of Object.keys(MODS)) {
      expect(byKey.has(`mod_kit_${k}`), `mod_kit_${k} is missing from IMAGE_LIBRARY`).toBe(true);
    }
  });

  it("every arms plate is a REQUEST: url null, a real prompt, and a declared aspect", () => {
    expect(mine.length).toBeGreaterThanOrEqual(77);
    for (const p of mine) {
      expect(p.url, `${p.key} ships a url — content lanes never ship visuals`).toBe(null);
      expect(typeof p.prompt, `${p.key} prompt`).toBe("string");
      expect(p.prompt.trim().length, `${p.key} has an empty prompt`).toBeGreaterThan(20);
      expect(p.title.trim().length, `${p.key} has no title`).toBeGreaterThan(0);
      expect(["1:1", "16:9", "4:3", "3:4", "9:16"], `${p.key} aspect`).toContain(p.aspect);
    }
  });

  it("no arms plate prompt restates the house style", () => {
    // "Any substring" is not a checkable rule — every single character is a
    // substring. The checkable rule is the one that matters: no PHRASE of the
    // house style is repeated, where a phrase is one of its comma-separated
    // clauses.
    const phrases = HOUSE_STYLE.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.length > 6);
    expect(phrases.length, "HOUSE_STYLE did not split into phrases — the guard has rotted").toBeGreaterThan(4);
    for (const p of mine) {
      const prompt = p.prompt.toLowerCase();
      for (const phrase of phrases) {
        expect(prompt.includes(phrase), `${p.key} restates the house style: "${phrase}"`).toBe(false);
      }
      expect(prompt.includes(HOUSE_STYLE.toLowerCase()), `${p.key} embeds HOUSE_STYLE whole`).toBe(false);
    }
  });

  it("adds no duplicate key to the shared library", () => {
    const keys = IMAGE_LIBRARY.map((p) => p.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dupes, `duplicate plate keys: ${dupes.join(", ")}`).toEqual([]);
  });

  it("docs/ARMS_CATALOGUE.md §12 registers exactly the plates that shipped", () => {
    const doc = readRepoFile("docs/ARMS_CATALOGUE.md");
    const start = doc.indexOf("## 12. Plate register");
    expect(start, "§12's plate register is missing from the catalogue").toBeGreaterThan(-1);
    // Bounded at the NEXT top-level heading, whatever it is numbered — not at
    // a hard-coded "## 13.", which a renumber turns into -1 and therefore into
    // "everything to EOF".
    const end = doc.indexOf("\n## ", start + 1);
    expect(end, "§12 is not bounded by a following top-level heading").toBeGreaterThan(start);
    const region = doc.slice(start, end);
    const rows = [...region.matchAll(/^\| `((?:arms_|maker_|mod_kit_)[a-z0-9_]+)` \| ([\d:]+) \| (.+) \|$/gm)];
    expect(rows.length, "§12's plate register did not parse").toBe(mine.length);
    for (const [, key, aspect, title] of rows) {
      const plate = byKey.get(key);
      expect(plate, `§12 registers '${key}', which is not in IMAGE_LIBRARY`).toBeDefined();
      expect(plate.aspect, `${key} aspect`).toBe(aspect);
      expect(plate.title, `${key} title`).toBe(title.trim());
    }
  });
});

// ---------------------------------------------------------------------------
// §21.g THE CODEX.
//
// The entries are SHIPPED into src/lib/wiki/entries.js, not handed over as
// prose — a lane that hands its Codex over as prose is a lane whose Codex
// never lands. Lane H owns the file and merges after this lane, so the block
// is append-only and the link integrity of the WHOLE corpus is what is
// asserted: Lane H's acceptance depends on it staying 100% link-clean.
// ---------------------------------------------------------------------------

describe("Codex entries (Work item 19)", () => {
  const MAKERS = CANON("MANUFACTURERS");
  const CALIBRES = CANON("CALIBRES");
  const slug = (k) => k.replace(/_/g, "-");
  const ids = new Set(ENTRIES.map((e) => e.id));

  // LANE I'S OWN IDS, BUILT FROM ITS OWN KEYS — never `id.startsWith("maker-")`.
  // `maker-` is a NAMESPACE Lane J shares: §3 makes "Codex entries for every
  // motor-works and chassis class" a Lane J acceptance criterion, and this
  // lane's convention for a manufacturer entry is `maker-<slug>`. A sweep by
  // prefix would impose Lane I's entry contract on Lane J's `maker-mw-*` rows,
  // and the exact-equality canon check below would go red on main the first
  // time Lane J marked one `canon`.
  const LANE_I_IDS = new Set([
    ...LANE_I_MAKERS.map((k) => `maker-${slug(k)}`),
    ...Object.keys(CALIBRES).map((k) => `calibre-${slug(k)}`),
  ]);
  const laneI = () => ENTRIES.filter((e) => LANE_I_IDS.has(e.id));

  it("every entry id in the whole corpus is unique", () => {
    const seen = ENTRIES.map((e) => e.id);
    const dupes = seen.filter((k, i) => seen.indexOf(k) !== i);
    expect(dupes, `duplicate entry ids: ${dupes.join(", ")}`).toEqual([]);
  });

  it("every `see` link in the whole corpus resolves", () => {
    const broken = [];
    for (const e of ENTRIES) for (const target of e.see || []) if (!ids.has(target)) broken.push(`${e.id} → ${target}`);
    expect(broken, `broken Codex links: ${broken.join(", ")}`).toEqual([]);
  });

  it("ships an entry for every Lane I manufacturer and every calibre", () => {
    for (const k of LANE_I_MAKERS) {
      expect(MAKERS[k], `${k} is not in MANUFACTURERS`).toBeDefined();
      expect(ids.has(`maker-${slug(k)}`), `maker-${slug(k)} is missing from ENTRIES`).toBe(true);
    }
    for (const k of Object.keys(CALIBRES)) {
      expect(ids.has(`calibre-${slug(k)}`), `calibre-${slug(k)} is missing from ENTRIES`).toBe(true);
    }
    expect(laneI().length, "fewer than 24 Lane I Codex entries").toBeGreaterThanOrEqual(24);
    expect(laneI().length, "an id in LANE_I_IDS resolves to no entry").toBe(LANE_I_IDS.size);
  });

  it("every Lane I entry is complete and correctly categorised", () => {
    for (const e of laneI()) {
      expect(e.category, `${e.id} category`).toBe(e.id.startsWith("maker-") ? "powers" : "war");
      expect(e.tag, `${e.id} tag`).toMatch(/^Arms Catalogue §[34]$/);
      expect(["canon", "contested", "unanswered", "thin"], `${e.id} status`).toContain(e.status);
      expect(typeof e.summary, `${e.id} summary`).toBe("string");
      expect(e.summary.length, `${e.id} summary is empty`).toBeGreaterThan(10);
      expect(Array.isArray(e.blocks) && e.blocks.length >= 3, `${e.id} blocks`).toBe(true);
      expect(Array.isArray(e.see) && e.see.length > 0, `${e.id} see`).toBe(true);
    }
  });

  // Marking invented ground as sealed is how a wiki starts lying. Only the two
  // rows a governing document actually supports may read "canon".
  it("claims canon only where a governing document supports it", () => {
    // An EXACT equality, and therefore scoped to this lane's own ids: it is a
    // statement about the 25 rows Lane I authored, not about every row that
    // happens to start with `maker-`.
    const canon = laneI().filter((e) => e.status === "canon").map((e) => e.id).sort();
    expect(canon).toEqual(["calibre-r13-line", "maker-hundredweight-works"]);
  });

  it("docs/ARMS_CATALOGUE.md §13 reproduces the shipped block byte for byte", () => {
    const shippedSrc = readRepoFile("src/lib/wiki/entries.js");
    const bstart = shippedSrc.indexOf("  // ——— LANE I: makers & calibres ———");
    expect(bstart, "the Lane I banner block is missing from entries.js").toBeGreaterThan(-1);
    // The block ends at the NEXT lane's banner, or at the array terminator if
    // this is still the last block. Lanes F, G, H, I and J all append one
    // banner-commented tail block to this same array and the merge rule is
    // "keep both, in lane order" — so bounding this slice at the terminator
    // would sweep up whichever lane appends after this one and go red on main,
    // in that lane's PR, over rows Lane I never wrote.
    const terminator = shippedSrc.indexOf("\n];\n\nexport const ENTRY_BY_ID");
    expect(terminator, "the ENTRIES array terminator moved").toBeGreaterThan(bstart);
    const nextBanner = shippedSrc.indexOf("\n  // ——— LANE ", bstart + 1);
    const bend = nextBanner !== -1 && nextBanner < terminator ? nextBanner : terminator;
    const shipped = shippedSrc.slice(bstart, bend).replace(/\n+$/, "");

    const doc = readRepoFile("docs/ARMS_CATALOGUE.md");
    const marker = "The rows exactly as they shipped:\n\n```js\n";
    const dstart = doc.indexOf(marker);
    expect(dstart, "§13's shipped-rows block is missing").toBeGreaterThan(-1);
    const dend = doc.indexOf("\n```", dstart + marker.length);
    const documented = doc.slice(dstart + marker.length, dend);
    expect(documented, "§13 has drifted from what shipped in entries.js").toBe(shipped);
  });
});

// ---------------------------------------------------------------------------
// §21.h THE DOCUMENT ITSELF.
//
// docs/ARMS_CATALOGUE.md §14 and docs/GAME_RULES.md's appended section are the
// same text in two files, and two copies of one paragraph is exactly the shape
// that rots. So they are compared rather than trusted.
// ---------------------------------------------------------------------------

describe("the catalogue document (Work item 17)", () => {
  const doc = readRepoFile("docs/ARMS_CATALOGUE.md");

  it("carries all fourteen sections, in order", () => {
    const headings = [...doc.matchAll(/^## (\d+)\. /gm)].map((m) => Number(m[1]));
    // §14 quotes the GAME_RULES section verbatim, heading included, so the
    // last number in the file is the rules section's — not a fifteenth section.
    expect(headings.slice(0, 14)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  // Found by inspection, not by a gate: §9.3 once printed TIER_RANK's keys as
  // 'II: Cache' because the renderer put a space after every colon. It read as
  // a plausible constant and was a lie about the source. Any `export const`
  // snippet the document prints is therefore EVALUATED and deep-equalled
  // against the real table — a snippet is a claim about code, so check it
  // against the code.
  it("every `export const` snippet in the document evaluates to the real table", () => {
    const snippets = [...doc.matchAll(/^export const (\w+) = (.+);$/gm)];
    expect(snippets.length, "no single-line export snippets found — the guard has rotted").toBeGreaterThanOrEqual(3);
    let checked = 0;
    for (const [, name, literal] of snippets) {
      if (MIRROR[name] === undefined) continue; // a function signature, not a table
      let value;
      try {
        value = Function(`return (${literal});`)();
      } catch {
        throw new Error(`§ snippet for ${name} is not evaluable: ${literal}`);
      }
      expect(value, `the document's ${name} snippet does not match the module`).toEqual(MIRROR[name]);
      checked++;
    }
    expect(checked, "no snippet was actually compared against a table").toBeGreaterThanOrEqual(3);
  });

  // §10 is the section Lane A reads to build deriveSquad, and it carried a
  // `fire(w) = b.damage × shots(w)` that the module does not implement — the
  // module resolves the weapon twice and computes fire off the BLADELESS
  // damage, which is the whole reason a bayonet cannot make a rifle shoot
  // harder. Two records of one formula, contradicting each other, with no gate
  // between them. So the document's fence and the module's own comment block
  // are now compared rather than both believed.
  it("§10.2's reduction formula is the module's reduction formula, character for character", () => {
    const strip = (t) => t.replace(/\s+/g, " ").trim();
    const between = (src, from, to) => {
      const a = src.indexOf(from);
      expect(a, `marker missing: ${from}`).toBeGreaterThan(-1);
      const b = src.indexOf(to, a + from.length);
      expect(b, `marker missing: ${to}`).toBeGreaterThan(a);
      return src.slice(a + from.length, b);
    };
    const fromModule = strip(
      between(CANON_SRC, "// THE REDUCTION FORMULA, implemented exactly as documented in §10 of the\n// catalogue:\n//\n", "//\n// WHY THE WEAPON IS RESOLVED TWICE")
        .split("\n").map((l) => l.replace(/^\/\/ ?/, "")).join("\n"),
    );
    const fromDoc = strip(between(doc, "THE REDUCTION FORMULA — this is the implemented one\n\n```\n", "\n```"));
    expect(fromModule.length, "the module's formula block did not lift").toBeGreaterThan(200);
    expect(fromDoc, "docs/ARMS_CATALOGUE.md §10.2 has drifted from the module's own formula block").toBe(fromModule);
    // and the version the document used to carry is gone from it entirely
    expect(fromDoc).toContain("bare.damage");
    expect(fromDoc).toContain("blade(w)");
  });

  it("§2's damage-model tables are the tables, not a paraphrase of them", () => {
    const AC = CANON("ARMOUR_CLASSES");
    const PEN = CANON("PEN_TABLE");
    const MATRIX = CANON("TYPE_MATRIX");
    const CLASS_KEYS = Object.keys(AC);
    const cell = (c) => c.trim().replace(/[`*]/g, "");

    // 2.1 — one row per armour class, with its armourValue and sealed flag.
    const acRows = [...doc.matchAll(/^\| `(\w+)` \| (\d+) \| (\*\*yes\*\*|no) \| (.+) \|$/gm)];
    expect(acRows.length, "§2.1 did not parse").toBe(CLASS_KEYS.length);
    for (const [, key, value, sealed, blurb] of acRows) {
      expect(AC[key], `§2.1 names armour class '${key}'`).toBeDefined();
      expect(Number(value), `${key} armourValue`).toBe(AC[key].armourValue);
      expect(sealed === "**yes**", `${key} sealed`).toBe(AC[key].sealed);
      expect(blurb.trim(), `${key} blurb`).toBe(AC[key].blurb);
    }

    // 2.2 — the penetration curve, in order, including the mandatory zero row.
    const penRows = [...doc.matchAll(/^\| `(-?\d+)` \| ([\d.]+) \| .+ \|$/gm)];
    expect(penRows.length, "§2.2 did not parse").toBe(PEN.length);
    penRows.forEach(([, minDelta, mult], i) => {
      expect(Number(minDelta), `PEN_TABLE row ${i} minDelta`).toBe(PEN[i].minDelta);
      expect(Number(mult), `PEN_TABLE row ${i} mult`).toBe(PEN[i].mult);
    });

    // 2.3 — all 49 numbers of the type matrix.
    const start = doc.indexOf("### 2.3");
    expect(start, "§2.3 is missing from the catalogue").toBeGreaterThan(-1);
    const end = doc.indexOf("### 2.4", start);
    expect(end, "§2.3 is not bounded by §2.4").toBeGreaterThan(start);
    const region = doc.slice(start, end);
    const rows = region.split("\n").filter((l) => /^\| `\w+` \|/.test(l)).map((l) => l.split("|").slice(1, -1).map(cell));
    expect(rows.length, "§2.3 did not parse").toBe(Object.keys(MATRIX).length);
    for (const [type, ...cells] of rows) {
      expect(MATRIX[type], `§2.3 names damage type '${type}'`).toBeDefined();
      expect(cells.length, `${type} row width`).toBe(CLASS_KEYS.length);
      CLASS_KEYS.forEach((cls, i) => {
        expect(Number(cells[i]), `TYPE_MATRIX.${type}.${cls}`).toBe(MATRIX[type][cls]);
      });
    }
  });

  // This comparison used to slice from its own heading to END OF FILE on both
  // sides. "Everything to the end of the file" was a proxy for "my section",
  // and it stood in for it only while Lane I happened to be the last lane to
  // append to docs/GAME_RULES.md. Lane G merged, appended its own [PROPOSED]
  // section after this one, and `inRules` silently swallowed the whole of it —
  // the gate went red over text Lane I never wrote. Lanes F, H and J will each
  // append one too, so BOTH sides are now bounded at the next top-level "## "
  // heading, exactly as §13's entries.js comparison bounds at the next lane
  // banner. The heading is matched on its TITLE and not on its number: the
  // orchestrator renumbers on collision (that is how Lane G's became 24), so a
  // hard-coded "## 23." would either break loudly on a renumber or, if both
  // copies were renumbered apart, compare the wrong region. The
  // exactly-one-match assertion is what keeps the match legible — zero hits or
  // a second copy names the file it found them in rather than silently
  // comparing an empty string.
  const SECTION_TITLE = "The Arms Catalogue & the Universal Damage Model [PROPOSED — awaiting platform wiring]";
  const sectionHeading = () =>
    new RegExp(`^## \\d+\\. ${SECTION_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "gm");
  const proposedSection = (src, where) => {
    const hits = [...src.matchAll(sectionHeading())];
    expect(hits.length, `${where}: expected exactly one "${SECTION_TITLE}" heading, found ${hits.length}`).toBe(1);
    const start = hits[0].index;
    const next = src.indexOf("\n## ", start + 1);
    return src.slice(start, next === -1 ? src.length : next).trim();
  };

  it("§14 and the appended docs/GAME_RULES.md section are the same text", () => {
    const rules = readRepoFile("docs/GAME_RULES.md");
    const inDoc = proposedSection(doc, "docs/ARMS_CATALOGUE.md §14");
    const inRules = proposedSection(rules, "docs/GAME_RULES.md");
    expect(inDoc.length, "§14's proposed section is missing from the catalogue").toBeGreaterThan(500);
    expect(inRules.length, "the proposed arms section is missing from GAME_RULES.md").toBeGreaterThan(500);
    expect(inDoc, "the two copies of the proposed rules section have drifted").toBe(inRules);
  });

  // Drift guard 4 and Work item 10.3: the grade's colour and visual treatment
  // belong to the Base44 session, not to this lane. A guard pointed only at the
  // markdown would be a guard on a proxy — the strings that reach a UI live in
  // arms.ts, and the strings that reach an image generator live in the plate
  // prompts. All three surfaces are swept.
  it("names no colour anywhere — the palette is not this lane's to assign", () => {
    const COLOURS = /\b(red|green|blue|amber|brass|olive|rust|umber|gold|golden|silver|crimson|scarlet|azure|violet|magenta|cyan|teal|ochre|sepia)\b/gi;
    const prompts = IMAGE_LIBRARY.filter((p) => p.category === "arms").map((p) => `${p.key}: ${p.prompt} ${p.title} ${p.desc}`).join("\n");
    for (const [where, text] of [["docs/ARMS_CATALOGUE.md", doc], ["base44/shared/arms.ts", CANON_SRC],
      ["src/lib/arms.js", MIRROR_SRC], ["the arms plate prompts", prompts]]) {
      const hits = [...text.matchAll(COLOURS)].map((m) => m[0]);
      expect(hits, `colour words in ${where}: ${[...new Set(hits)].join(", ")}`).toEqual([]);
    }
  });
});
