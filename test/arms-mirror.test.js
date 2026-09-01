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

  it("every maker builds something and every calibre feeds something", () => {
    const makers = new Set(Object.values(WP).map((p) => p.maker));
    const calibres = new Set(Object.values(WP).map((p) => p.calibre));
    for (const m of Object.keys(MAKERS)) expect([...makers], `${m} builds nothing`).toContain(m);
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
