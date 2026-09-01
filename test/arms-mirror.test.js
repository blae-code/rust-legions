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

const CANON_SRC = readRepoFile("base44/shared/arms.ts");
const MIRROR_SRC = readRepoFile("src/lib/arms.js");

const CANON = (name) => extractConst(CANON_SRC, name);

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

  for (const key of Object.keys(CANON("MANUFACTURERS"))) {
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
