// Tactical rules mirror invariant (Lane A).
//
// base44/shared/tactical.ts is a Deno module that Vitest cannot import, so
// every pure-data table is lifted out of it TEXTUALLY (extract-const.js) and
// deep-equalled against the importable mirror at src/lib/tactical/data.js.
//
// THE TABLE LIST IS DISCOVERED FROM THE SOURCE, NEVER HAND-MAINTAINED. That is
// the whole point of this file. Before it existed, `CASUALTY_ORDER` had been
// exported from the canonical module and absent from the mirror since before
// the squad plan started, and nothing noticed — because the only gates that
// existed were lists of names somebody had remembered to write down. A list is
// a gate on a proxy: it passes for exactly the tables it names. So the
// discovery below reads `export const` out of the canonical file and demands a
// mirror for every one of them, and the export-set check demands a mirror for
// every exported FUNCTION too.
//
// THREE THINGS FOLLOW FROM THAT, AND THEY ARE WHY THIS FILE IS LONGER THAN A
// DEEP-EQUAL:
//
//  (1) The discovery classifies EVERY top-level `export const`, not only the
//      ones whose right-hand side happens to be a literal. A table rewritten as
//      `export const SQUAD_TYPES = buildTypes()` would drop straight out of a
//      literal-only scan and take its mirror demand with it — the CASUALTY_ORDER
//      shape exactly. Anything that is neither a literal, nor an `Object.keys`
//      derivation, nor an arrow function lands in `unknown`, and `unknown` is
//      asserted empty. Silently skipped becomes loudly refused.
//  (2) The discovery's OWN precondition is asserted, against a synthetic source
//      fixture, because a normaliser that quietly stopped normalising is how the
//      last two gates in this repository were defeated. If the classifier
//      regressed, every per-table assertion below would pass vacuously.
//  (3) The gap the file was written to catch is a PERMANENT assertion, not a
//      transcript in a pull request: `missingMirrors` is run against the mirror
//      namespace with `CASUALTY_ORDER` removed and must name it. A proof that
//      exists only as a paste in a PR body cannot go red again next month.
//
// It also holds the line on drift guard 12: armour and penetration arithmetic
// exist in arms.ts and nowhere else. Both files are asserted to declare no
// armour table of their own, and the only route from this layer into the
// damage model is asserted to be a call inside resolveSquadHit.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import * as MIRROR from "@/lib/tactical/data.js";
import { ARMOUR_CLASSES, PEN_TABLE, TYPE_MATRIX, LOADOUT_KEYS, deriveLoadout } from "@/lib/arms.js";
import { neighbors, TERRAIN } from "@/lib/tactical/field.js";

const CANON_SRC = readRepoFile("base44/shared/tactical.ts");
const MIRROR_SRC = readRepoFile("src/lib/tactical/data.js");
const DESIGN_DOC = readRepoFile("docs/COMBAT_DESIGN.md");

const {
  SQUAD_TYPES, SQUAD_TYPE_KEYS, SPECIALISTS, SQUAD_ACTIONS, SQUAD_ACTION_KEYS,
  DEPLOYABLES, DEPLOYABLE_KEYS, FIGURES_PER_COMPANY, MORALE_MODS, SCALING,
  POINTS_MODEL, COLUMN_KEYS, HEX_DIRECTIONS, FACING_ARCS, WORK_ARMOUR_APPLIES_TO,
  deriveSquad, squadStaffMods, squadActions, squadFigures, poolCost, toRegiments,
  combatValue, fairPts, typeEfficiency, resolveSquadHit, struckFacing,
} = MIRROR;

// The five UI-only fields the mirror is allowed to add (plan section 3).
const UI_ONLY = ["label", "short", "blurb", "desc", "icon"];

const stripUi = (v) => {
  if (Array.isArray(v)) return v.map(stripUi);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) {
      if (UI_ONLY.includes(k)) continue;
      out[k] = stripUi(v[k]);
    }
    return out;
  }
  return v;
};

// Advance past whitespace and both comment forms — the same trivia rule
// extract-const uses, so discovery and extraction agree about where a literal
// starts.
const afterTrivia = (src, i) => {
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === "/" && src[i + 1] === "/") { const nl = src.indexOf("\n", i); i = nl === -1 ? src.length : nl + 1; continue; }
    if (src[i] === "/" && src[i + 1] === "*") { const s = src.indexOf("*/", i + 2); i = s === -1 ? src.length : s + 2; continue; }
    return i;
  }
};

/**
 * Classify EVERY top-level `export const NAME = …` by what its right-hand side
 * actually is:
 *
 *   tables    — an object or array literal. These are lifted textually and
 *               deep-equalled against the mirror.
 *   derived   — `Object.keys(SOME_TABLE)`. Not mirror-tested as a table (it has
 *               no literal to lift) but pinned against its source table on both
 *               sides, so it cannot quietly disagree either.
 *   functions — an arrow const.
 *   unknown   — ANYTHING ELSE, and the suite fails on a non-empty `unknown`.
 *               This is the branch that matters: a literal-only scan treats a
 *               table that became a function call as "not a table" and stops
 *               demanding a mirror for it, which is precisely how a gap hides.
 *
 * `export` must sit at column 0, so a `//` or `*` comment line that quotes a
 * declaration is not mistaken for one. The fixture suite below pins that.
 *
 * A TypeScript annotation (`export const X: Rec = {…}`) is matched and
 * classified. extract-const.js cannot lift such a declaration, so it throws by
 * name rather than the table vanishing from the sweep — loud, not silent.
 */
const classifyExports = (src) => {
  const re = /^export\s+const\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]*)?=\s*/gm;
  const out = { tables: [], derived: [], functions: [], unknown: [] };
  let m;
  while ((m = re.exec(src)) !== null) {
    const i = afterTrivia(src, m.index + m[0].length);
    const head = src.slice(i, i + 240);
    const keysOf = /^Object\.keys\(\s*([A-Za-z_$][\w$]*)\s*\)/.exec(head);
    if (src[i] === "{" || src[i] === "[") out.tables.push(m[1]);
    else if (keysOf) out.derived.push({ name: m[1], from: keysOf[1] });
    else if (/^(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(head)) out.functions.push(m[1]);
    else out.unknown.push(m[1]);
  }
  return out;
};

/** Every exported binding name — const, function, or a re-export braces list. */
const discoverExports = (src) => {
  const names = [];
  const re = /^export\s+(?:const|function|let|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(src)) !== null) names.push(m[1]);
  // `export { hexPixel, hexCorners } from "…"` — the shape the Lane B hand-off
  // leaves behind. A re-export is an export: if the canonical file ever used
  // one it would otherwise escape the mirror demand entirely.
  const reExport = /^export\s*\{([^}]*)\}/gm;
  while ((m = reExport.exec(src)) !== null) {
    for (const part of m[1].split(",")) {
      const t = part.trim();
      if (!t) continue;
      const aliased = /\bas\s+([A-Za-z_$][\w$]*)\s*$/.exec(t);
      names.push(aliased ? aliased[1] : t.split(/\s+/)[0]);
    }
  }
  return names;
};

/**
 * The gate, as a pure function of (canonical source, the names the mirror
 * actually supplies). Pure so it can be run against a SIMULATED mirror — which
 * is how this file proves, permanently and in the suite, that it would have
 * caught the CASUALTY_ORDER gap rather than merely claiming it.
 */
const missingMirrors = (canonSrc, mirrorNames) =>
  discoverExports(canonSrc).filter((n) => !mirrorNames.includes(n));

const CANON = classifyExports(CANON_SRC);
const CANON_TABLES = CANON.tables;
const CANON_EXPORTS = discoverExports(CANON_SRC);

// Source text of a top-level exported function or arrow const, whitespace
// normalised. Used to prove the two files share LOGIC, not only data.
const fnSource = (src, name) => {
  const decl = new RegExp(`\\bexport\\s+(?:function\\s+${name}\\b|const\\s+${name}\\s*=)`);
  const m = decl.exec(src);
  if (!m) return null;
  let i = src.indexOf("{", m.index);
  const arrow = src.indexOf("=>", m.index);
  if (arrow !== -1 && arrow < i) i = src.indexOf("{", arrow) === -1 ? -1 : Math.min(i === -1 ? Infinity : i, src.indexOf("{", arrow));
  if (i === -1) return null;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(i, j + 1).replace(/\s+/g, " "); }
  }
  return null;
};

/**
 * The inclusive line range of a top-level exported function's body, found by
 * balancing its braces. Returns null if the declaration is absent — the caller
 * asserts on that rather than treating "no range" as "nothing to check".
 *
 * This exists so that a region-bounded source assertion is bounded at BOTH
 * ends. A slice that runs to end-of-file is true only while its owner is the
 * last thing in the file, which is a property the next lane's append destroys.
 */
const fnLineRange = (src, name) => {
  const lines = src.split("\n");
  const decl = new RegExp(`^export\\s+(?:function\\s+${name}\\b|const\\s+${name}\\s*=)`);
  const start = lines.findIndex((l) => decl.test(l));
  if (start === -1) return null;
  let depth = 0;
  let opened = false;
  for (let i = start; i < lines.length; i++) {
    for (const c of lines[i]) {
      if (c === "{") { depth++; opened = true; }
      else if (c === "}") depth--;
    }
    if (opened && depth === 0) return { start, end: i };
  }
  return null;
};

// Lines of a file with // comments and blank lines removed, so a grep-style
// assertion cannot be satisfied or defeated by prose.
const codeLines = (src) => src.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("/*"));

/** A GitHub-flavoured markdown table, as arrays of trimmed cells. */
const parseMdTable = (doc, headingRe) => {
  const lines = doc.split("\n");
  let start = lines.findIndex((l) => headingRe.test(l));
  expect(start, `heading ${headingRe} not found in COMBAT_DESIGN.md`).toBeGreaterThan(-1);
  // Bounded at BOTH ends: stop at the next markdown heading, never at EOF, so
  // a later lane appending its own section cannot silently widen this slice.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
  }
  const rows = [];
  for (let i = start + 1; i < end; i++) {
    const l = lines[i].trim();
    if (!l.startsWith("|")) continue;
    if (/^\|[\s|:-]+\|$/.test(l)) continue;
    rows.push(l.slice(1, -1).split("|").map((c) => c.trim()));
  }
  expect(rows.length, `no table under ${headingRe}`).toBeGreaterThan(1);
  return { header: rows[0], body: rows.slice(1) };
};

const num = (s) => Number(String(s).replace(/[^0-9.-]/g, ""));

// The rounding both rules files apply to a derived offence value. Restated here
// on purpose: a test that imported the module's own rounding could not tell a
// changed rounding from a correct one.
const round2 = (n) => Math.round(n * 100) / 100;

// A synthetic source, exercising every shape the classifier has to tell apart.
// It is deliberately NOT the real file: a gate asserted only against the source
// it currently passes on is asserted against nothing.
const FIXTURE_SRC = [
  "// export const DECOY_LINE_COMMENT = { a: 1 };",
  "/*",
  " * export const DECOY_BLOCK_COMMENT = [1];",
  " */",
  "export const PLAIN_OBJECT = { a: 1 };",
  "export const PLAIN_ARRAY = ['a', 'b'];",
  "export const TYPED_TABLE: Record<string, number> = { b: 2 };",
  "export const AFTER_TRIVIA = /* a comment sits here */ { c: 3 };",
  "export const KEYS_OF = Object.keys(PLAIN_OBJECT);",
  "export const ARROW_PAIR = (a, b) => a + b;",
  "export const ARROW_BARE = x => x * 2;",
  "export const COMPUTED = buildTheTable();",
  "export function namedFunction(x) { return x; }",
  "  export const INDENTED_NOT_TOP_LEVEL = { d: 4 };",
  'export { alpha, beta as gamma } from "./elsewhere.js";',
].join("\n");

describe("tactical mirror — the gate's own precondition", () => {
  const F = classifyExports(FIXTURE_SRC);

  it("classifies literals as tables, annotation or no annotation", () => {
    expect(F.tables).toEqual(["PLAIN_OBJECT", "PLAIN_ARRAY", "TYPED_TABLE", "AFTER_TRIVIA"]);
  });

  it("classifies Object.keys derivations, and records what they derive from", () => {
    expect(F.derived).toEqual([{ name: "KEYS_OF", from: "PLAIN_OBJECT" }]);
  });

  it("classifies arrow consts in both spellings as functions", () => {
    expect(F.functions).toEqual(["ARROW_PAIR", "ARROW_BARE"]);
  });

  it("REFUSES a computed right-hand side rather than skipping it", () => {
    // The whole point. A literal-only scan would classify COMPUTED as "not a
    // table" and stop demanding a mirror for it, without a word.
    expect(F.unknown).toEqual(["COMPUTED"]);
  });

  it("ignores declarations quoted in comments and below column zero", () => {
    const all = [...F.tables, ...F.functions, ...F.unknown, ...F.derived.map((d) => d.name)];
    expect(all).not.toContain("DECOY_LINE_COMMENT");
    expect(all).not.toContain("DECOY_BLOCK_COMMENT");
    expect(all).not.toContain("INDENTED_NOT_TOP_LEVEL");
  });

  it("counts functions and re-exports as exports, so neither escapes the mirror demand", () => {
    expect(discoverExports(FIXTURE_SRC)).toContain("namedFunction");
    expect(discoverExports(FIXTURE_SRC)).toContain("alpha");
    expect(discoverExports(FIXTURE_SRC)).toContain("gamma");
    expect(discoverExports(FIXTURE_SRC)).not.toContain("beta");
  });

  it("would have gone red on the gap it was written to catch", () => {
    // CASUALTY_ORDER was exported from tactical.ts and absent from data.js from
    // before the squad plan until Lane A. Simulate that mirror and require the
    // gate to name it — this is the proof, kept in the suite rather than pasted
    // into a pull request where it can never fail again.
    const asMainHadIt = Object.keys(MIRROR).filter((n) => n !== "CASUALTY_ORDER");
    expect(missingMirrors(CANON_SRC, asMainHadIt)).toEqual(["CASUALTY_ORDER"]);
    // Drop a whole table and it is named too, by the same mechanism.
    const noSquadTypes = Object.keys(MIRROR).filter((n) => n !== "SQUAD_TYPES");
    expect(missingMirrors(CANON_SRC, noSquadTypes)).toEqual(["SQUAD_TYPES"]);
    // And against the mirror as it actually stands, nothing is missing.
    expect(missingMirrors(CANON_SRC, Object.keys(MIRROR))).toEqual([]);
  });
});

describe("tactical mirror — table discovery (check 1)", () => {
  it("discovers every canonical table from the source, not from a list", () => {
    // A sanity floor on the discovery itself: a regex that silently stopped
    // matching would make every assertion below vacuously pass.
    expect(CANON_TABLES).toContain("TROOPS");
    expect(CANON_TABLES).toContain("SQUAD_TYPES");
    expect(CANON_TABLES).toContain("CASUALTY_ORDER");
    expect(CANON_TABLES.length).toBeGreaterThanOrEqual(14);
    // The derived exports are correctly NOT treated as tables.
    expect(CANON_TABLES).not.toContain("SQUAD_TYPE_KEYS");
    expect(CANON_TABLES).not.toContain("hexDistance");
  });

  it("every canonical export is a literal, a keys derivation or a function", () => {
    // The refusal branch, on the real file. A table rewritten as a call would
    // land here rather than quietly leaving the sweep.
    expect(CANON.unknown, "unclassifiable export const in tactical.ts").toEqual([]);
    expect(classifyExports(MIRROR_SRC).unknown, "unclassifiable export const in data.js").toEqual([]);
  });

  for (const name of CANON_TABLES) {
    it(`${name} deep-equals its mirror`, () => {
      const canonical = extractConst(CANON_SRC, name);
      expect(MIRROR[name], `${name} is missing from src/lib/tactical/data.js`).toBeDefined();
      expect(stripUi(MIRROR[name])).toEqual(stripUi(canonical));
    });

    it(`${name} mirrors its key order (check 2)`, () => {
      const canonical = extractConst(CANON_SRC, name);
      if (Array.isArray(canonical)) return;
      expect(Object.keys(MIRROR[name])).toEqual(Object.keys(canonical));
    });

    it(`${name} is a pure data literal on the mirror side too`, () => {
      // Two things at once. extractConst throws unless data.js declares this as
      // a literal — which is what keeps Lane F's append a pure-append diff on
      // BOTH sides. And lifting the text and comparing it to the imported value
      // proves the mirror does not post-process the literal after declaring it,
      // which a runtime-only deep-equal against the canonical text cannot see.
      const lifted = extractConst(MIRROR_SRC, name);
      expect(stripUi(lifted)).toEqual(stripUi(MIRROR[name]));
    });
  }

  for (const { name, from } of CANON.derived) {
    it(`${name} is Object.keys(${from}) on both sides`, () => {
      // A derived export has no literal to mirror, so it is the one shape the
      // deep-equal sweep cannot see. Pin it against its source table instead of
      // leaving it unchecked.
      const canonicalKeys = Object.keys(extractConst(CANON_SRC, from));
      expect(MIRROR[name], `${name} is missing from the mirror`).toEqual(canonicalKeys);
      expect(MIRROR[name]).toEqual(Object.keys(MIRROR[from]));
    });
  }
});

describe("tactical mirror — export sets (check 3)", () => {
  it("every canonical export exists in the mirror", () => {
    const missing = CANON_EXPORTS.filter((n) => MIRROR[n] === undefined);
    expect(missing, "canonical exports with no mirror").toEqual([]);
  });

  it("the mirror adds only the three allowlisted UI helpers", () => {
    const extra = Object.keys(MIRROR).filter((n) => !CANON_EXPORTS.includes(n)).sort();
    expect(extra).toEqual(["dominantTroop", "hexCorners", "hexPixel"]);
  });

  it("hexPixel and hexCorners are present however they are supplied", () => {
    // Legal in two shapes during the Lane B hand-off: defined in data.js, or
    // re-exported from field.js. Assert the NAMES and the behaviour, never the
    // definition site.
    expect(typeof MIRROR.hexPixel).toBe("function");
    expect(typeof MIRROR.hexCorners).toBe("function");
    expect(MIRROR.hexPixel(0, 0, 10)).toEqual({ x: 0, y: 0 });
    expect(MIRROR.hexCorners(10).split(" ")).toHaveLength(6);
  });

  it("every shared exported function has identical source in both files", () => {
    const fns = CANON_EXPORTS.filter((n) => typeof MIRROR[n] === "function");
    expect(fns.length).toBeGreaterThanOrEqual(10);
    for (const n of fns) {
      const a = fnSource(CANON_SRC, n);
      const b = fnSource(MIRROR_SRC, n);
      expect(a, `no canonical body for ${n}`).toBeTruthy();
      expect(b, `no mirror body for ${n}`).toBeTruthy();
      expect(b, `${n} has drifted between canonical and mirror`).toBe(a);
    }
  });
});

describe("tactical mirror — one damage model (check 4, drift guard 12)", () => {
  for (const [label, src] of [["canonical", CANON_SRC], ["mirror", MIRROR_SRC]]) {
    it(`${label} declares no armour table of its own`, () => {
      expect(src).not.toMatch(/const\s+(ARMOUR_CLASSES|PEN_TABLE|TYPE_MATRIX)\s*=/);
    });

    it(`${label} touches the damage model only on an import line or inside resolveSquadHit`, () => {
      // BOUNDED AT BOTH ENDS, and by the function's braces rather than by the
      // spelling of one line. An earlier form of this check allowed any line
      // matching the exact text `return resolveHit({ weapon, target });` — which
      // is a gate on a spelling: a SECOND such call, pasted into some other
      // function in the same file, would have satisfied it. The permitted region
      // is now resolveSquadHit's actual body, so a later lane appending code
      // after it cannot widen the licence either.
      const range = fnLineRange(src, "resolveSquadHit");
      expect(range, `resolveSquadHit not found in the ${label} file`).toBeTruthy();
      expect(range.end - range.start, "resolveSquadHit's body did not scan").toBeGreaterThan(3);

      const lines = src.split("\n");
      let hits = 0;
      let inBlockComment = false;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const t = l.trim();
        if (inBlockComment) { if (t.includes("*/")) inBlockComment = false; continue; }
        if (t.startsWith("/*")) { if (!t.includes("*/")) inBlockComment = true; continue; }
        if (!t || t.startsWith("//") || t.startsWith("*")) continue;
        if (!/armourValue|PEN_TABLE|TYPE_MATRIX|resolveHit/.test(l)) continue;
        hits++;
        const isImport = /^\s*import\s/.test(l);
        const inAdapter = i >= range.start && i <= range.end;
        expect(isImport || inAdapter, `stray damage-model reference at ${label}:${i + 1}: ${t}`).toBe(true);
      }
      // A regex that stopped matching would let this pass with nothing checked.
      expect(hits, "the damage model is never referenced at all").toBeGreaterThan(0);
    });
  }

  it("penetration really is delegated — a rifle section cannot scratch a heavy hull", () => {
    // The claim docs/COMBAT_DESIGN.md makes in prose, proven against Lane I's
    // tables rather than restated. PEN_TABLE's mandatory zero row is what makes
    // it true, and this is the assertion that would fail if that row went away.
    expect(PEN_TABLE.some((r) => r.mult === 0)).toBe(true);
    const hit = resolveSquadHit({
      attacker: { type: "riflemen", figures: 10 },
      action: "fire",
      targetArmour: "heavy",
    });
    expect(hit.effective).toBe(0);
    expect(hit.suppressOnly).toBe(true);
  });

  it("a crawler gun resolves against the same model and does damage", () => {
    const hit = resolveSquadHit({ attacker: { type: "crawler", figures: 1 }, action: "fire", targetArmour: "soft" });
    expect(hit.effective).toBeGreaterThan(0);
    expect(hit.suppressOnly).toBe(false);
  });

  it("every declared armour class and damage type is one of Lane I's", () => {
    for (const k of SQUAD_TYPE_KEYS) {
      expect(Object.keys(ARMOUR_CLASSES), `${k}.armour`).toContain(SQUAD_TYPES[k].armour);
      expect(Object.keys(TYPE_MATRIX), `${k}.damageType`).toContain(SQUAD_TYPES[k].damageType);
    }
    for (const k of DEPLOYABLE_KEYS) {
      expect(Object.keys(ARMOUR_CLASSES), `${k}.armourClass`).toContain(DEPLOYABLES[k].armourClass);
    }
    for (const k of WORK_ARMOUR_APPLIES_TO) expect(Object.keys(ARMOUR_CLASSES)).toContain(k);
    for (const k of SQUAD_ACTION_KEYS) {
      const dt = SQUAD_ACTIONS[k].damageType;
      if (dt !== null) expect(Object.keys(TYPE_MATRIX), `${k}.damageType`).toContain(dt);
    }
  });

  it("resolveSquadHit refuses a stand that is already gone", () => {
    const live = resolveSquadHit({ attacker: { type: "gunners", figures: 6 }, action: "fire", targetArmour: "soft" });
    expect(live.effective).toBeGreaterThan(0);
    const dead = resolveSquadHit({
      attacker: { type: "gunners", figures: 6 }, action: "fire", targetArmour: "soft",
      targetDerived: { figures: 0 },
    });
    expect(dead).toEqual({ effective: 0, suppressOnly: true });
  });

  it("resolveSquadHit is inert on junk rather than throwing", () => {
    const inert = { effective: 0, suppressOnly: true };
    expect(resolveSquadHit()).toEqual(inert);
    expect(resolveSquadHit({ attacker: { type: "nope" }, action: "fire", targetArmour: "soft" })).toEqual(inert);
    expect(resolveSquadHit({ attacker: { type: "riflemen", figures: 10 }, action: "nope", targetArmour: "soft" })).toEqual(inert);
    expect(resolveSquadHit({ attacker: { type: "riflemen", figures: 10 }, action: "fire", targetArmour: "nope" })).toEqual(inert);
    expect(resolveSquadHit({ attacker: { type: "riflemen", figures: 10 }, action: "hold", targetArmour: "soft" })).toEqual(inert);
  });

  it("an attacker profile overrides the type defaults", () => {
    const plain = resolveSquadHit({ attacker: { type: "riflemen", figures: 10 }, action: "fire", targetArmour: "medium" });
    const lance = resolveSquadHit({
      attacker: { type: "riflemen", figures: 10, profile: { armorPen: 9, damageType: "shaped", aoe: null } },
      action: "fire", targetArmour: "medium",
    });
    expect(lance.effective).toBeGreaterThan(plain.effective);
  });
});

describe("tactical mirror — row completeness (check 5)", () => {
  const SQUAD_FIELDS = [
    "key", "label", "short", "from", "tier", "figures", "minFigures", "maxFigures",
    "melee", "ranged", "range", "armor", "speed", "morale", "pts", "specials",
    "armour", "damageType", "armorPen", "blurb", "doctrineNote",
  ];

  it("the base nine are exactly the base nine, in plan order", () => {
    expect(SQUAD_TYPE_KEYS).toEqual([
      "riflemen", "assault", "gunners", "scouts", "mortars", "pioneers",
      "crawler", "artillery", "fighter",
    ]);
  });

  it("every squad row defines all 21 fields", () => {
    expect(SQUAD_FIELDS).toHaveLength(21);
    for (const k of SQUAD_TYPE_KEYS) {
      const row = SQUAD_TYPES[k];
      expect(Object.keys(row).sort()).toEqual([...SQUAD_FIELDS].sort());
      for (const f of SQUAD_FIELDS) expect(row[f], `${k}.${f}`).toBeDefined();
      expect(row.key).toBe(k);
      expect(row.tier).toBe("I");
      expect(row.minFigures).toBeLessThanOrEqual(row.figures);
      expect(row.figures).toBeLessThanOrEqual(row.maxFigures);
      expect(String(row.blurb).length).toBeGreaterThan(30);
      expect(String(row.doctrineNote).length).toBeGreaterThan(30);
    }
  });

  it("five specialists, each with at least one numeric mod", () => {
    expect(Object.keys(SPECIALISTS)).toEqual(["medic", "signaler", "commissar", "heavy_gunner", "sapper"]);
    const VOCAB = ["morale", "initiative", "recoverPerTurn", "moraleFloor", "aoeSuppress", "buildSpeed", "executionToll"];
    for (const k of Object.keys(SPECIALISTS)) {
      const s = SPECIALISTS[k];
      const mods = Object.keys(s.mods);
      expect(mods.length, `${k} has no numeric mod`).toBeGreaterThanOrEqual(1);
      for (const m of mods) {
        expect(VOCAB, `${k}.mods.${m} is outside the effect vocabulary`).toContain(m);
        expect(typeof s.mods[m], `${k}.mods.${m}`).toBe("number");
      }
      expect(s.pts).toBeGreaterThan(0);
      expect(s.pts, `${k} costs more than a specialist should`).toBeLessThanOrEqual(POINTS_MODEL.specialistPtsCap);
    }
  });

  it("at least thirteen actions, every one a full row", () => {
    expect(SQUAD_ACTION_KEYS.length).toBeGreaterThanOrEqual(13);
    const FIELDS = ["key", "label", "requires", "uses", "dmg", "guard", "range", "aoe", "moraleHit", "suppress", "screenTurns", "noMove", "turns", "builds", "damageType", "indirect", "blurb"];
    for (const k of SQUAD_ACTION_KEYS) {
      const a = SQUAD_ACTIONS[k];
      expect(Object.keys(a).sort(), `${k} field set`).toEqual([...FIELDS].sort());
      expect(a.requires, `${k}.requires`).not.toBeUndefined();
      for (const f of ["dmg", "moraleHit", "turns", "suppress", "screenTurns", "guard"]) expect(typeof a[f], `${k}.${f}`).toBe("number");
      expect(typeof a.noMove).toBe("boolean");
      expect(typeof a.indirect).toBe("boolean");
      expect(a.aoe === null || typeof a.aoe.radius === "number").toBe(true);
      if (a.requires) {
        expect(Array.isArray(a.requires.types)).toBe(true);
        expect(Array.isArray(a.requires.specialists)).toBe(true);
        for (const t of a.requires.types) expect(SQUAD_TYPE_KEYS).toContain(t);
        for (const s of a.requires.specialists) expect(Object.keys(SPECIALISTS)).toContain(s);
      }
      if (a.uses !== null) expect(["melee", "ranged"]).toContain(a.uses);
    }
  });

  it("grenade and mortar_barrage are radius-1 bursts, and the barrage is indirect", () => {
    expect(SQUAD_ACTIONS.grenade.aoe.radius).toBe(1);
    expect(SQUAD_ACTIONS.mortar_barrage.aoe.radius).toBe(1);
    expect(SQUAD_ACTIONS.mortar_barrage.indirect).toBe(true);
    expect(SQUAD_ACTIONS.fire.indirect).toBe(false);
  });

  it("four deployables, every one a full row", () => {
    expect(DEPLOYABLE_KEYS).toEqual(["foxhole", "trench", "bunker", "emplacement"]);
    for (const k of DEPLOYABLE_KEYS) {
      const d = DEPLOYABLES[k];
      for (const f of ["cover", "blocksLOS", "moveCost", "buildTurns", "infantryOnly", "armourClass", "mods"]) {
        expect(d[f], `${k}.${f}`).not.toBeUndefined();
      }
      expect(typeof d.cover).toBe("number");
      expect(typeof d.moveCost).toBe("number");
      expect(typeof d.blocksLOS).toBe("boolean");
      expect(typeof d.infantryOnly).toBe("boolean");
      expect(Object.keys(d.mods).sort()).toEqual(["range", "speed", "suppress"]);
    }
    expect(DEPLOYABLES.foxhole.infantryOnly).toBe(true);
    expect(DEPLOYABLES.trench.blocksLOS).toBe(true);
    expect(DEPLOYABLES.emplacement.mods.speed).toBe(0);
    expect(DEPLOYABLES.emplacement.mods.range).toBe(1);
    expect(DEPLOYABLES.emplacement.mods.suppress).toBeGreaterThan(0);
  });

  it("the morale table carries the roll, the modifiers and the rout threshold", () => {
    const numeric = Object.values(MORALE_MODS).every((v) => typeof v === "number");
    expect(numeric).toBe(true);
    expect(Object.keys(MORALE_MODS).length).toBeGreaterThanOrEqual(5);
    for (const k of ["dice", "dieSides", "routMargin", "perCasualtyThisTurn", "flanked", "adjacentFriendlyDestroyed"]) {
      expect(MORALE_MODS[k], `MORALE_MODS.${k}`).toBeDefined();
    }
    expect(MORALE_MODS.perCasualtyThisTurn).toBeLessThan(0);
    expect(MORALE_MODS.entrenched).toBeGreaterThan(0);
    // The roll must be able to reach a steady squad's target at all.
    expect(MORALE_MODS.dice * MORALE_MODS.dieSides).toBeGreaterThan(SCALING.moraleMax);
  });
});

describe("tactical mirror — regiment integrity (check 6)", () => {
  it("every source regiment is a column key, and six of nine are riflemen", () => {
    for (const k of SQUAD_TYPE_KEYS) expect(COLUMN_KEYS, `${k}.from`).toContain(SQUAD_TYPES[k].from);
    expect(SQUAD_TYPE_KEYS.filter((k) => SQUAD_TYPES[k].from === "riflemen")).toHaveLength(6);
  });

  it("the hard figure values hold", () => {
    expect(SQUAD_TYPES.riflemen.figures).toBe(10);
    for (const k of ["crawler", "artillery", "fighter"]) {
      expect(SQUAD_TYPES[k].figures, k).toBe(1);
      expect(SQUAD_TYPES[k].minFigures, k).toBe(1);
      expect(SQUAD_TYPES[k].maxFigures, k).toBe(1);
    }
  });

  it("a squad type's default size may differ from its regiment's company size", () => {
    // The whole point of the Q5 ruling, asserted so nobody re-keys the table.
    expect(FIGURES_PER_COMPANY.riflemen).toBe(10);
    expect(SQUAD_TYPES.mortars.from).toBe("riflemen");
    expect(SQUAD_TYPES.mortars.figures).not.toBe(FIGURES_PER_COMPANY.riflemen);
  });

  it("FIGURES_PER_COMPANY is keyed by regiment and by nothing else", () => {
    expect(Object.keys(FIGURES_PER_COMPANY).sort()).toEqual([...COLUMN_KEYS].sort());
    expect(FIGURES_PER_COMPANY).toEqual({ riflemen: 10, crawler: 1, artillery: 1, fighter: 1 });
  });
});

describe("tactical mirror — builds agree with the works (check 7)", () => {
  it("every build order names a real work and takes exactly its build time", () => {
    const builds = SQUAD_ACTION_KEYS.filter((k) => k.startsWith("build_"));
    expect(builds).toHaveLength(4);
    for (const k of builds) {
      const a = SQUAD_ACTIONS[k];
      expect(DEPLOYABLE_KEYS, `${k}.builds`).toContain(a.builds);
      expect(a.turns, `${k}.turns`).toBe(DEPLOYABLES[a.builds].buildTurns);
      expect(a.noMove).toBe(true);
    }
    expect(DEPLOYABLES.bunker.buildTurns).toBe(2);
    for (const k of ["foxhole", "trench", "emplacement"]) expect(DEPLOYABLES[k].buildTurns).toBe(1);
  });

  it("no build order is offered without a work to raise", () => {
    for (const k of DEPLOYABLE_KEYS) expect(SQUAD_ACTION_KEYS).toContain(`build_${k}`);
  });
});

describe("tactical mirror — pools and companies (check 8)", () => {
  const rifle = (figures) => ({ type: "riflemen", figures });

  it("rounds down, always", () => {
    expect(toRegiments([rifle(10), rifle(9)]).riflemen).toBe(1);
    expect(toRegiments([rifle(9)]).riflemen).toBe(0);
    expect(toRegiments([rifle(10)]).riflemen).toBe(1);
    expect(toRegiments([rifle(12), rifle(12)]).riflemen).toBe(2);
  });

  it("all four keys are always present, at zero by default", () => {
    expect(toRegiments([])).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
    expect(poolCost([])).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
  });

  it("a surviving crawler is a company", () => {
    expect(toRegiments([{ type: "crawler", figures: 1 }]).crawler).toBe(1);
  });

  it("poolCost counts figures, grouped by source regiment", () => {
    const list = [rifle(10), { type: "gunners", figures: 6 }, { type: "mortars", figures: 4 }, { type: "artillery", figures: 1 }];
    expect(poolCost(list)).toEqual({ riflemen: 20, crawler: 0, artillery: 1, fighter: 0 });
  });

  it("battles never create companies", () => {
    const lists = [
      [],
      [rifle(1)],
      [rifle(9), { type: "scouts", figures: 5 }],
      [rifle(10), rifle(12), { type: "crawler", figures: 1 }, { type: "fighter", figures: 1 }],
      [{ type: "pioneers", figures: 8 }, { type: "assault", figures: 3 }, { type: "artillery", figures: 1 }],
    ];
    for (const list of lists) {
      const companies = toRegiments(list);
      const figures = poolCost(list);
      for (const k of COLUMN_KEYS) {
        expect(companies[k] * FIGURES_PER_COMPANY[k], `${k} on ${JSON.stringify(list)}`).toBeLessThanOrEqual(figures[k]);
      }
    }
  });

  it("junk in, zeroes out — never a throw", () => {
    expect(poolCost()).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
    // The formation-shaped call the un-rewritten engine still makes.
    expect(poolCost({ riflemen: 3, gunners: 1 })).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
    expect(toRegiments([{ type: "no_such_type", figures: 40 }])).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
    expect(poolCost([null, undefined, {}])).toEqual({ riflemen: 0, crawler: 0, artillery: 0, fighter: 0 });
  });

  it("a squad cannot be over-stacked past its ceiling", () => {
    expect(squadFigures(rifle(40))).toBe(SQUAD_TYPES.riflemen.maxFigures);
    expect(poolCost([rifle(40)]).riflemen).toBe(SQUAD_TYPES.riflemen.maxFigures);
    expect(squadFigures({ type: "riflemen", figures: 7.9 })).toBe(7);
    expect(squadFigures({ type: "riflemen", figures: -3 })).toBe(0);
  });
});

describe("tactical mirror — deriveSquad figure scaling (check 9)", () => {
  it("at full strength the derived values are the declared values", () => {
    for (const k of SQUAD_TYPE_KEYS) {
      const t = SQUAD_TYPES[k];
      const d = deriveSquad({ type: k, figures: t.figures });
      expect(d.melee, `${k}.melee`).toBe(t.melee);
      expect(d.ranged, `${k}.ranged`).toBe(t.ranged);
      expect(d.range, `${k}.range`).toBe(t.range);
      expect(d.armor, `${k}.armor`).toBe(t.armor);
      expect(d.speed, `${k}.speed`).toBe(t.speed);
      expect(d.pts, `${k}.pts`).toBe(t.pts);
    }
  });

  it("returns exactly the ten contract keys, in order", () => {
    const KEYS = ["figures", "melee", "ranged", "range", "armor", "speed", "morale", "initiative", "actions", "pts"];
    expect(Object.keys(deriveSquad({ type: "riflemen", figures: 10 }))).toEqual(KEYS);
    expect(Object.keys(deriveSquad({ type: "nope", figures: 10 }))).toEqual(KEYS);
    expect(Object.keys(deriveSquad())).toEqual(KEYS);
  });

  it("the erosion curve is the one SCALING declares, to the digit", () => {
    // Not "lower than full and higher than half" — the exact value, recomputed
    // from the exported constant. A bracket assertion passes over a curve that
    // has silently become something else with a similar shape.
    for (const k of SQUAD_TYPE_KEYS) {
      const t = SQUAD_TYPES[k];
      for (let f = t.minFigures; f <= t.maxFigures; f++) {
        const d = deriveSquad({ type: k, figures: f });
        const cohesion = Math.pow(f / t.figures, SCALING.offenceExponent);
        expect(d.ranged, `${k} at ${f} figures`).toBe(round2(t.ranged * cohesion));
        expect(d.melee, `${k} at ${f} figures`).toBe(round2(t.melee * cohesion));
      }
    }
  });

  it("offence never falls as figures rise, for any type at any strength", () => {
    for (const k of SQUAD_TYPE_KEYS) {
      const t = SQUAD_TYPES[k];
      let prev = -1;
      for (let f = t.minFigures; f <= t.maxFigures; f++) {
        const d = deriveSquad({ type: k, figures: f });
        expect(d.ranged, `${k} at ${f} figures is worse than at ${f - 1}`).toBeGreaterThanOrEqual(prev);
        prev = d.ranged;
      }
    }
  });

  it("the erosion percentage printed in COMBAT_DESIGN.md 13.8 is recomputed, not typed", () => {
    // The document names a figure — "half a section fights at 53.6% of a
    // section". A published number arithmetically false against its own table
    // is the Wave 1 defect this project has already paid for, so the number is
    // read back out of the prose and recomputed from SCALING.
    const lines = DESIGN_DOC.split("\n");
    const start = lines.findIndex((l) => /^### 13\.8 /.test(l));
    expect(start, "13.8 not found").toBeGreaterThan(-1);
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
    const section = lines.slice(start, end).join("\n");
    const printed = /([0-9]+\.[0-9])% of a section/.exec(section);
    expect(printed, "13.8 no longer states the half-strength percentage").toBeTruthy();
    const computed = (Math.pow(0.5, SCALING.offenceExponent) * 100).toFixed(1);
    expect(printed[1]).toBe(computed);
    // And the prose's exponent is the exported one.
    expect(section).toContain(String(SCALING.offenceExponent));
  });

  it("erosion is strict but sub-linear", () => {
    const full = deriveSquad({ type: "riflemen", figures: 10 });
    const half = deriveSquad({ type: "riflemen", figures: 5 });
    expect(half.ranged).toBeLessThan(full.ranged);
    expect(half.melee).toBeLessThan(full.melee);
    expect(half.ranged).toBeGreaterThan(full.ranged * 0.5);
    expect(half.range).toBe(full.range);
    expect(half.speed).toBe(full.speed);
    expect(half.morale).toBeLessThan(full.morale);
  });

  it("at minimum strength it is still a squad, never a negative one", () => {
    for (const k of SQUAD_TYPE_KEYS) {
      const d = deriveSquad({ type: k, figures: SQUAD_TYPES[k].minFigures });
      expect(d.melee, `${k}.melee`).toBeGreaterThanOrEqual(0);
      expect(d.ranged, `${k}.ranged`).toBeGreaterThanOrEqual(0);
      expect(d.morale, `${k}.morale`).toBeGreaterThanOrEqual(SCALING.moraleMin);
      expect(d.pts, `${k}.pts`).toBeGreaterThan(0);
    }
  });

  it("a single-figure vehicle scales at one and never divides by zero", () => {
    for (const k of ["crawler", "artillery", "fighter"]) {
      const d = deriveSquad({ type: k, figures: 1 });
      expect(d.ranged, k).toBe(SQUAD_TYPES[k].ranged);
      expect(Number.isFinite(d.ranged), k).toBe(true);
    }
  });

  it("zero, negative and unknown all return the zero row without throwing", () => {
    const zero = { figures: 0, melee: 0, ranged: 0, range: 0, armor: 0, speed: 0, morale: 0, initiative: 0, actions: [], pts: 0 };
    expect(deriveSquad({ type: "riflemen", figures: 0 })).toEqual(zero);
    expect(deriveSquad({ type: "riflemen", figures: -4 })).toEqual(zero);
    expect(deriveSquad({ type: "riflemen" })).toEqual(zero);
    expect(deriveSquad({ type: "no_such_type", figures: 10 })).toEqual(zero);
    expect(deriveSquad(undefined)).toEqual(zero);
    expect(deriveSquad(null)).toEqual(zero);
  });

  it("initiative rises with speed and the scouts lead the foot", () => {
    const foot = ["riflemen", "assault", "gunners", "scouts", "mortars", "pioneers"];
    const best = foot.reduce((a, b) => (deriveSquad({ type: a, figures: SQUAD_TYPES[a].figures }).initiative >= deriveSquad({ type: b, figures: SQUAD_TYPES[b].figures }).initiative ? a : b));
    expect(best).toBe("scouts");
    const d = deriveSquad({ type: "scouts", figures: 5 });
    expect(d.initiative).toBe(d.speed * SCALING.initiativePerSpeed + SCALING.initiativeBase);
  });
});

describe("tactical mirror — specialist stacking (check 10)", () => {
  it("is invariant under permutation of the caller's array", () => {
    const a = deriveSquad({ type: "riflemen", figures: 10, specialists: ["medic", "signaler"] });
    const b = deriveSquad({ type: "riflemen", figures: 10, specialists: ["signaler", "medic"] });
    expect(b).toEqual(a);
    expect(squadStaffMods(["signaler", "medic"])).toEqual(squadStaffMods(["medic", "signaler"]));
  });

  it("additive mods sum and moraleFloor takes the maximum", () => {
    const both = squadStaffMods(["medic", "commissar"]);
    expect(both.morale).toBe(SPECIALISTS.medic.mods.morale + SPECIALISTS.commissar.mods.morale);
    expect(both.moraleFloor).toBe(SPECIALISTS.commissar.mods.moraleFloor);
    expect(both.pts).toBe(SPECIALISTS.medic.pts + SPECIALISTS.commissar.pts);
    expect(both.recoverPerTurn).toBe(SPECIALISTS.medic.mods.recoverPerTurn);
    expect(squadStaffMods([]).moraleFloor).toBe(0);
  });

  it("the commissar floor lifts a shaken squad and never lowers a steady one", () => {
    const shaken = deriveSquad({ type: "scouts", figures: 2 });
    const held = deriveSquad({ type: "scouts", figures: 2, specialists: ["commissar"] });
    expect(shaken.morale).toBeLessThan(SPECIALISTS.commissar.mods.moraleFloor);
    expect(held.morale).toBe(SPECIALISTS.commissar.mods.moraleFloor);
    const steady = deriveSquad({ type: "assault", figures: 8, specialists: ["commissar"] });
    expect(steady.morale).toBeGreaterThanOrEqual(SPECIALISTS.commissar.mods.moraleFloor);
  });

  it("a duplicate counts once", () => {
    expect(squadStaffMods(["medic", "medic"])).toEqual(squadStaffMods(["medic"]));
    expect(squadStaffMods(["medic", "medic"]).keys).toEqual(["medic"]);
  });

  it("a third specialist is IGNORED, and which two survive is declaration order", () => {
    const three = squadStaffMods(["sapper", "medic", "signaler"]);
    expect(three.keys).toEqual(["medic", "signaler"]);
    expect(three.keys).toHaveLength(SCALING.maxSpecialists);
    expect(three.buildSpeed).toBe(0);
    // ...and it is the same two whatever order the caller wrote them in.
    expect(squadStaffMods(["signaler", "sapper", "medic"]).keys).toEqual(["medic", "signaler"]);
  });

  it("junk specialists are ignored rather than fatal", () => {
    expect(squadStaffMods(["not_a_specialist"]).keys).toEqual([]);
    expect(squadStaffMods("medic").keys).toEqual([]);
    expect(squadStaffMods().keys).toEqual([]);
  });

  it("specialists are charged for in the squad's points", () => {
    const plain = deriveSquad({ type: "riflemen", figures: 10 });
    const staffed = deriveSquad({ type: "riflemen", figures: 10, specialists: ["medic", "signaler"] });
    expect(staffed.pts).toBe(plain.pts + SPECIALISTS.medic.pts + SPECIALISTS.signaler.pts);
    expect(staffed.initiative).toBe(plain.initiative + SPECIALISTS.signaler.mods.initiative);
  });
});

describe("tactical mirror — action gating (check 11)", () => {
  it("a plain rifle section is offered no build order", () => {
    const actions = deriveSquad({ type: "riflemen", figures: 10 }).actions;
    expect(actions.filter((a) => a.startsWith("build_"))).toEqual([]);
    expect(actions).toContain("fire");
    expect(actions).toContain("grenade");
  });

  it("a sapper admits every build order", () => {
    const actions = deriveSquad({ type: "riflemen", figures: 10, specialists: ["sapper"] }).actions;
    for (const k of DEPLOYABLE_KEYS) expect(actions).toContain(`build_${k}`);
  });

  it("mortars barrage and riflemen do not", () => {
    expect(deriveSquad({ type: "mortars", figures: 4 }).actions).toContain("mortar_barrage");
    expect(deriveSquad({ type: "riflemen", figures: 10 }).actions).not.toContain("mortar_barrage");
  });

  it("a heavy gunner brings suppressing fire to a section that has none", () => {
    expect(deriveSquad({ type: "scouts", figures: 5 }).actions).not.toContain("suppress");
    expect(deriveSquad({ type: "scouts", figures: 5, specialists: ["heavy_gunner"] }).actions).toContain("suppress");
    expect(deriveSquad({ type: "gunners", figures: 6 }).actions).toContain("suppress");
  });

  it("pioneers build without a sapper attached", () => {
    const actions = deriveSquad({ type: "pioneers", figures: 8 }).actions;
    for (const k of DEPLOYABLE_KEYS) expect(actions).toContain(`build_${k}`);
  });

  it("every offered action exists, and the universal ones are offered to all nine", () => {
    for (const k of SQUAD_TYPE_KEYS) {
      const actions = deriveSquad({ type: k, figures: SQUAD_TYPES[k].figures }).actions;
      for (const a of actions) expect(SQUAD_ACTION_KEYS, `${k} -> ${a}`).toContain(a);
      for (const u of SQUAD_ACTION_KEYS.filter((a) => SQUAD_ACTIONS[a].requires === null)) {
        expect(actions, `${k} is missing the universal order ${u}`).toContain(u);
      }
    }
  });

  it("specials is the gate written from the other end — no decorative tags", () => {
    // Both directions, because one direction alone passes a table that has
    // drifted. A tag with no action, and an action gated to a type that does
    // not claim it, are both failures.
    for (const k of SQUAD_TYPE_KEYS) {
      const declared = [...SQUAD_TYPES[k].specials].sort();
      const gated = SQUAD_ACTION_KEYS
        .filter((a) => SQUAD_ACTIONS[a].requires && (SQUAD_ACTIONS[a].requires.types || []).includes(k))
        .sort();
      expect(declared, `${k}.specials disagrees with SQUAD_ACTIONS.requires.types`).toEqual(gated);
      for (const s of SQUAD_TYPES[k].specials) expect(SQUAD_ACTION_KEYS, `${k} tag ${s}`).toContain(s);
    }
  });

  it("squadActions gates on type and staff only, never on status", () => {
    expect(squadActions("gunners", [])).toContain("suppress");
    expect(squadActions("no_such_type", [])).toEqual(SQUAD_ACTION_KEYS.filter((a) => SQUAD_ACTIONS[a].requires === null));
    expect(squadActions("scouts")).not.toContain("suppress");
  });
});

describe("tactical mirror — purity (check 12)", () => {
  it("neither file rolls a die or reads a clock", () => {
    expect(CANON_SRC).not.toMatch(/Math\.random|new Date|Date\.now/);
    expect(MIRROR_SRC).not.toMatch(/Math\.random|new Date|Date\.now/);
  });

  it("the same squad derives identically twice, and is not mutated", () => {
    const squad = { type: "pioneers", figures: 6, specialists: ["sapper", "medic"] };
    const before = JSON.stringify(squad);
    const a = deriveSquad(squad);
    const b = deriveSquad(squad);
    expect(b).toEqual(a);
    expect(JSON.stringify(squad)).toBe(before);
    expect(a.actions).not.toBe(b.actions);
  });

  it("the zero row is a fresh object each time", () => {
    const a = deriveSquad(null);
    a.actions.push("tampered");
    expect(deriveSquad(null).actions).toEqual([]);
  });
});

describe("tactical mirror — the points anchor and the audit (check 13)", () => {
  it("the anchor is a squad's cost, not a figure's", () => {
    expect(SQUAD_TYPES.riflemen.pts).toBe(100);
    expect(SQUAD_TYPES.riflemen.figures).toBe(10);
    expect(POINTS_MODEL.anchorKey).toBe("riflemen");
    expect(POINTS_MODEL.anchorPts).toBe(SQUAD_TYPES[POINTS_MODEL.anchorKey].pts);
  });

  it("the exchange rate is derived from the anchor, so the anchor is exact", () => {
    expect(fairPts("riflemen")).toBe(100);
    expect(typeEfficiency("riflemen")).toBe(1);
  });

  it("no base type is priced above the efficiency cap", () => {
    for (const k of SQUAD_TYPE_KEYS) {
      const e = typeEfficiency(k);
      expect(e, `${k} efficiency`).toBeLessThanOrEqual(POINTS_MODEL.efficiencyCap);
      expect(e, `${k} efficiency`).toBeGreaterThan(0.5);
    }
  });

  it("no constant in SCALING or POINTS_MODEL is dead weight", () => {
    // A whole repair pass that nothing reached, justified by claims that were
    // untrue, is the defect class this project has already paid for once. A
    // published constant that no derivation reads is the same shape in
    // miniature: it looks like a knob and turns nothing. Every key must be read
    // by the derivations in BOTH files, or be one of the two named audit bounds
    // — and that exemption list is itself pinned, so a third cannot join it
    // quietly.
    const AUDIT_ONLY = ["efficiencyCap", "specialistPtsCap"];
    for (const [label, src] of [["tactical.ts", CANON_SRC], ["data.js", MIRROR_SRC]]) {
      const code = codeLines(src).join("\n");
      for (const k of Object.keys(SCALING)) {
        expect(code, `${label} never reads SCALING.${k}`).toContain(`SCALING.${k}`);
      }
      for (const k of Object.keys(POINTS_MODEL)) {
        if (AUDIT_ONLY.includes(k)) continue;
        const read = code.includes(`POINTS_MODEL.${k}`) || code.includes(`P.${k}`);
        expect(read, `${label} never reads POINTS_MODEL.${k}`).toBe(true);
      }
    }
    // The two exempt keys are bounds the audit enforces here rather than
    // arithmetic the derivations use. Enforced, not merely exempted:
    for (const k of SQUAD_TYPE_KEYS) {
      expect(typeEfficiency(k), `${k} efficiency`).toBeLessThanOrEqual(POINTS_MODEL.efficiencyCap);
    }
    for (const k of Object.keys(SPECIALISTS)) {
      expect(SPECIALISTS[k].pts, `${k} pts`).toBeLessThanOrEqual(POINTS_MODEL.specialistPtsCap);
    }
    expect(Object.keys(POINTS_MODEL).filter((k) => AUDIT_ONLY.includes(k))).toEqual(AUDIT_ONLY);
  });

  it("combatValue reads the table and nothing else", () => {
    expect(combatValue("no_such_type")).toBe(0);
    expect(fairPts("no_such_type")).toBe(0);
    expect(typeEfficiency("no_such_type")).toBe(0);
    // A stat rise must move the value. Recomputed by hand from POINTS_MODEL,
    // so the formula cannot be quietly re-weighted without this failing.
    const P = POINTS_MODEL;
    const t = SQUAD_TYPES.gunners;
    const byHand = t.ranged * (1 + t.range / P.rangeDivisor)
      + t.ranged * Math.max(0, t.armorPen - P.penFloor) * P.penWeight
      + t.melee * P.meleeWeight
      + t.figures * (t.armor * P.armorWeight + t.morale * P.moraleWeight)
      + t.speed * P.speedWeight
      + t.specials.length * P.specialWeight;
    expect(combatValue("gunners")).toBeCloseTo(byHand, 4);
  });
});

describe("tactical mirror — the design document is recomputed, not retyped (check 13b)", () => {
  it("the squad stat table in COMBAT_DESIGN.md matches SQUAD_TYPES", () => {
    const { header, body } = parseMdTable(DESIGN_DOC, /^### 13\.2 The base nine/);
    expect(header[0]).toBe("Type");
    expect(body).toHaveLength(SQUAD_TYPE_KEYS.length);
    const col = (name) => {
      const i = header.indexOf(name);
      expect(i, `column ${name}`).toBeGreaterThan(-1);
      return i;
    };
    body.forEach((row, i) => {
      const k = SQUAD_TYPE_KEYS[i];
      const t = SQUAD_TYPES[k];
      expect(row[0], `row ${i}`).toBe(`\`${k}\``);
      expect(row[col("From")]).toBe(`\`${t.from}\``);
      for (const f of ["figures", "melee", "ranged", "range", "armor", "speed", "morale", "pts", "armorPen"]) {
        expect(num(row[col(f)]), `${k}.${f} in the document`).toBe(t[f]);
      }
      expect(row[col("armour")]).toBe(`\`${t.armour}\``);
      expect(row[col("damageType")]).toBe(`\`${t.damageType}\``);
    });
  });

  it("the points audit in COMBAT_DESIGN.md is recomputed cell by cell", () => {
    const { header, body } = parseMdTable(DESIGN_DOC, /^### 13\.7 The Points Audit/);
    expect(body).toHaveLength(SQUAD_TYPE_KEYS.length);
    const iValue = header.indexOf("Combat value");
    const iFair = header.indexOf("Fair pts");
    const iPts = header.indexOf("Asked pts");
    const iEff = header.indexOf("Efficiency");
    expect(Math.min(iValue, iFair, iPts, iEff)).toBeGreaterThan(-1);
    body.forEach((row, i) => {
      const k = SQUAD_TYPE_KEYS[i];
      expect(row[0]).toBe(`\`${k}\``);
      expect(num(row[iValue]), `${k} combat value`).toBeCloseTo(combatValue(k), 1);
      expect(num(row[iFair]), `${k} fair pts`).toBeCloseTo(fairPts(k), 1);
      expect(num(row[iPts]), `${k} asked pts`).toBe(SQUAD_TYPES[k].pts);
      expect(num(row[iEff]), `${k} efficiency`).toBeCloseTo(typeEfficiency(k), 2);
    });
  });

  it("the specialist table in COMBAT_DESIGN.md matches SPECIALISTS", () => {
    const { header, body } = parseMdTable(DESIGN_DOC, /^### 13\.3 The five specialists/);
    expect(body).toHaveLength(Object.keys(SPECIALISTS).length);
    const iPts = header.indexOf("pts");
    const iMods = header.indexOf("Numeric mods");
    expect(Math.min(iPts, iMods)).toBeGreaterThan(-1);
    body.forEach((row, i) => {
      const k = Object.keys(SPECIALISTS)[i];
      expect(row[0]).toBe(`\`${k}\``);
      expect(num(row[iPts]), `${k} pts`).toBe(SPECIALISTS[k].pts);
      for (const m of Object.keys(SPECIALISTS[k].mods)) {
        expect(row[iMods], `${k} mods cell`).toContain(`${m} ${SPECIALISTS[k].mods[m] > 0 ? "+" : ""}${SPECIALISTS[k].mods[m]}`);
      }
    });
  });

  it("the works table in COMBAT_DESIGN.md matches DEPLOYABLES", () => {
    const { header, body } = parseMdTable(DESIGN_DOC, /^### 13\.5 The four works/);
    expect(body).toHaveLength(DEPLOYABLE_KEYS.length);
    const col = (n) => header.indexOf(n);
    body.forEach((row, i) => {
      const k = DEPLOYABLE_KEYS[i];
      const d = DEPLOYABLES[k];
      expect(row[0]).toBe(`\`${k}\``);
      expect(num(row[col("cover")]), `${k}.cover`).toBe(d.cover);
      expect(num(row[col("moveCost")]), `${k}.moveCost`).toBe(d.moveCost);
      expect(num(row[col("buildTurns")]), `${k}.buildTurns`).toBe(d.buildTurns);
      expect(row[col("blocksLOS")]).toBe(String(d.blocksLOS));
      expect(row[col("infantryOnly")]).toBe(String(d.infantryOnly));
    });
  });

  it("the morale table in COMBAT_DESIGN.md matches MORALE_MODS entry for entry", () => {
    // Sixteen numbers that Lane C rolls and this file owns. Published in the
    // document and read straight back out of it, in BOTH directions, so neither
    // a rotted cell nor an entry quietly dropped from the prose can survive.
    const { body } = parseMdTable(DESIGN_DOC, /^### 13\.10 /);
    const printed = {};
    for (const row of body) printed[row[0].replace(/`/g, "")] = num(row[1]);
    expect(Object.keys(printed).sort()).toEqual(Object.keys(MORALE_MODS).sort());
    for (const k of Object.keys(MORALE_MODS)) {
      expect(printed[k], `MORALE_MODS.${k} is printed wrong in COMBAT_DESIGN.md 13.10`).toBe(MORALE_MODS[k]);
    }
  });

  it("both auto thresholds are reachable by the modifiers actually printed", () => {
    // The document's closing paragraph makes a claim about the band. Proven
    // here rather than believed: a table of modifiers too weak to reach either
    // threshold would make both rules dead letters, and nothing else would say so.
    const M = MORALE_MODS;
    const situational = Object.keys(M).filter((k) => !["dice", "dieSides", "autoPassRoll", "autoFailRoll", "routMargin", "suppressedTurns"].includes(k));
    const worst = situational.reduce((s, k) => s + Math.min(0, M[k]), 0);
    const best = situational.reduce((s, k) => s + Math.max(0, M[k]), 0);
    // Both thresholds sit inside what 3d6 can actually roll.
    expect(M.autoPassRoll).toBeGreaterThanOrEqual(M.dice);
    expect(M.autoFailRoll).toBeLessThanOrEqual(M.dice * M.dieSides);
    // A squad at the floor with everything against it cannot pass on the target
    // alone — so autoPassRoll is doing work, not decorating the table.
    expect(SCALING.moraleMin + worst).toBeLessThanOrEqual(M.autoPassRoll);
    // A squad at the ceiling with everything for it would otherwise be
    // unbreakable — so autoFailRoll is doing work too.
    expect(SCALING.moraleMax + best).toBeGreaterThanOrEqual(M.autoFailRoll);
    // A rout is a worse outcome than suppression, and is reachable.
    expect(M.routMargin).toBeGreaterThan(0);
    expect(M.routMargin).toBeLessThan(M.dice * M.dieSides);
    expect(M.suppressedTurns).toBeGreaterThan(0);
  });

  it("the figures-to-companies ratio is stated in prose as well as in code", () => {
    const section = DESIGN_DOC.slice(DESIGN_DOC.indexOf("### 13.6"));
    expect(section).toMatch(/FIGURES_PER_COMPANY/);
    expect(section).toMatch(/rounds down|rounding down/i);
  });
});

describe("tactical mirror — the legacy layer survives (check 14)", () => {
  it("every formation-model export is still exported from both files", () => {
    for (const n of ["TROOPS", "TROOP_KEYS", "CASUALTY_ORDER", "COLUMN_KEYS", "ACTIONS", "SIZE", "hexDistance", "formationSize", "deriveFormation"]) {
      expect(CANON_EXPORTS, `canonical ${n}`).toContain(n);
      expect(MIRROR[n], `mirror ${n}`).toBeDefined();
    }
  });

  it("deriveFormation still behaves", () => {
    const d = MIRROR.deriveFormation({ riflemen: 3, gunners: 1 });
    expect(d.size).toBe(4);
    expect(d.actions).toContain("suppressing_fire");
    expect(MIRROR.deriveFormation({}).size).toBe(0);
  });

  it("Lane B still gets the hex distance it imports", () => {
    expect(MIRROR.hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });
});

describe("tactical mirror — the cross-lane seams", () => {
  it("HEX_DIRECTIONS is Lane B's neighbour order, exactly", () => {
    // A stand's `facing` is an index into this list. If the two lanes ever
    // disagreed about the order, every rear shot in the game would land on the
    // wrong plate, silently.
    expect(HEX_DIRECTIONS).toEqual(neighbors(0, 0));
  });

  it("struckFacing reads the arcs off the table", () => {
    const at = { q: 5, r: 5 };
    // facing 0 is due east: an attacker one hex east is dead ahead.
    expect(struckFacing({ from: { q: 6, r: 5 }, at, facing: 0 })).toBe("front");
    expect(struckFacing({ from: { q: 4, r: 5 }, at, facing: 0 })).toBe("rear");
    expect(struckFacing({ from: { q: 6, r: 4 }, at, facing: 0 })).toBe("front");
    expect(struckFacing({ from: { q: 5, r: 6 }, at, facing: 0 })).toBe("front");
    expect(struckFacing({ from: { q: 5, r: 4 }, at, facing: 0 })).toBe("side");
    expect(struckFacing({ from: { q: 4, r: 6 }, at, facing: 0 })).toBe("side");
    // Turn the hull to face the attacker and the same hex becomes the front.
    expect(struckFacing({ from: { q: 4, r: 5 }, at, facing: 3 })).toBe("front");
    // Distance does not change the arc.
    expect(struckFacing({ from: { q: 1, r: 5 }, at, facing: 0 })).toBe("rear");
  });

  it("struckFacing answers top for anything overhead and never throws", () => {
    expect(struckFacing({ from: { q: 5, r: 5 }, at: { q: 5, r: 5 }, facing: 0 })).toBe("top");
    expect(struckFacing({ from: { q: 6, r: 5 }, at: { q: 5, r: 5 }, facing: 0, overhead: true })).toBe("top");
    expect(struckFacing()).toBe("front");
    expect(struckFacing({ from: { q: 6, r: 5 }, at: { q: 5, r: 5 } })).toBe("front");
    expect(struckFacing({ from: { q: 6, r: 5 }, at: { q: 5, r: 5 }, facing: 12 })).toBe("front");
    expect(struckFacing({ from: { q: 6, r: 5 }, at: { q: 5, r: 5 }, facing: -6 })).toBe("front");
  });

  it("every facing arc offset is used exactly once", () => {
    const all = [...FACING_ARCS.front, ...FACING_ARCS.side, ...FACING_ARCS.rear].sort((a, b) => a - b);
    expect(all).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("deriveSquad consumes every key Lane I's loadout contract can return", () => {
    // Lane I owns LOADOUT_KEYS. If it grows one, this goes red rather than the
    // new key being silently ignored by the derivation.
    expect(Object.keys(LOADOUT_KEYS).sort()).toEqual(["melee", "pts", "range", "ranged", "speed"]);
  });

  it("a loadout replaces the issue values at the right scale", () => {
    const kit = {
      primary: { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: [], quirks: [] },
    };
    const plain = deriveSquad({ type: "riflemen", figures: 10 });
    const armed = deriveSquad({ type: "riflemen", figures: 10, loadout: kit });
    // deriveLoadout is PER FIGURE; ten rifles at ~1.3 each land beside the
    // issue value of 14, which is what "calibrated against arms.ts" means.
    expect(armed.ranged).toBeGreaterThan(plain.ranged * 0.7);
    expect(armed.ranged).toBeLessThan(plain.ranged * 1.3);
    expect(armed.range).toBe(7);
    expect(armed.pts).toBeGreaterThan(plain.pts);
    // Half the section carries half the rifles.
    const half = deriveSquad({ type: "riflemen", figures: 5, loadout: kit });
    expect(half.ranged).toBeLessThan(armed.ranged);
    expect(half.pts).toBeLessThan(armed.pts);
  });

  // ---- the reduction is arms.ts's, not ours -------------------------------
  //
  // The bracket assertions above would pass over a local approximation that
  // merely landed in the same neighbourhood — a number "arithmetically false
  // against its own table" is the defect class that survived Wave 1. These
  // recompute the derived row FROM deriveLoadout's own return value and demand
  // exact equality, so any arithmetic of our own between the two would show.
  const primaryKit = (patternKey, quality, mods = []) => ({
    primary: { patternKey, quality, mods, quirks: [] },
  });

  const KITS = [
    ["a levy rifle, as issued", primaryKit("hw141_levy_rifle_mk2", "issue")],
    ["the same rifle, proofed", primaryKit("hw141_levy_rifle_mk2", "proofed")],
    ["a rifle with the blade fixed", primaryKit("hw141_levy_rifle_mk2", "issue", ["bayonet_sword_pattern"])],
    ["an anvilgate heavy gun", primaryKit("em233_anvilgate_heavy_gun_mk1", "issue")],
    ["a full three-weapon kit", {
      primary: { patternKey: "rs229_verdict_service_rifle_mk3", quality: "issue", mods: [], quirks: [] },
      support: { patternKey: "cl274_knotwork_light_gun_mk1", quality: "issue", mods: [], quirks: [] },
      sidearm: { patternKey: "hw166_bottoms_pit_revolver_mk1", quality: "scrap", mods: [], quirks: [] },
    }],
    ["an empty kit — an unarmed stand is a legal state", {}],
  ];

  for (const [label, loadout] of KITS) {
    it(`every derived value for ${label} is recomputed from deriveLoadout's own return`, () => {
      const t = SQUAD_TYPES.riflemen;
      const figures = 7;
      const squad = { type: "riflemen", figures, loadout };
      const kit = deriveLoadout(squad, {});
      const derived = deriveSquad(squad);
      const cohesion = Math.pow(figures / t.figures, SCALING.offenceExponent);

      // 'absolute' (LOADOUT_KEYS): the kit REPLACES the declared value. Lane I
      // returns it per figure, so the type's DEFAULT figure count is what puts
      // it on the squad scale before erosion — never the actual headcount, or
      // the strength penalty would be charged twice.
      expect(derived.ranged).toBe(round2(kit.ranged * t.figures * cohesion));
      expect(derived.melee).toBe(round2(kit.melee * t.figures * cohesion));
      // 'absolute', and not scaled by headcount: reach is what a figure carries.
      expect(derived.range).toBe(kit.range);
      // 'delta': added to the type's base, floored.
      expect(derived.speed).toBe(Math.max(SCALING.speedFloor, t.speed + kit.speed));
      // 'delta', per figure, charged on the figures actually present.
      expect(derived.pts).toBe(Math.round(t.pts * (figures / t.figures)) + Math.round(kit.pts * figures));
    });
  }

  it("the kits are actually distinguishable, so the equality above is not vacuous", () => {
    // A deriveLoadout that returned a constant would satisfy every assertion in
    // the loop. Three kits, three different reductions.
    const seen = KITS.filter(([, l]) => Object.keys(l).length)
      .map(([, loadout]) => JSON.stringify(deriveLoadout({ type: "riflemen", figures: 7, loadout }, {})));
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("a proofed weapon is worth more than the same weapon as issued, all the way through", () => {
    const at = (loadout) => deriveSquad({ type: "riflemen", figures: 10, loadout });
    const issued = at(primaryKit("hw141_levy_rifle_mk2", "issue"));
    const proofed = at(primaryKit("hw141_levy_rifle_mk2", "proofed"));
    expect(proofed.ranged).toBeGreaterThan(issued.ranged);
    expect(proofed.pts).toBeGreaterThan(issued.pts);
  });

  it("melee is the blade and nothing else — Lane I's semantics, adopted whole", () => {
    // Recorded because it is surprising and deliberate. arms.ts computes melee
    // as the BLADE's contribution (b.damage − bare.damage) and publishes it as
    // 'absolute' in LOADOUT_KEYS, so a section issued a bayonet-less rifle
    // derives melee 0 — lower than the same section with no loadout at all.
    // That is the contract as Lane I wrote it, and Lane A applies the published
    // meaning rather than inventing a kinder one. Fix the blade and it returns.
    const bare = deriveSquad({ type: "riflemen", figures: 10, loadout: primaryKit("hw141_levy_rifle_mk2", "issue") });
    const fixed = deriveSquad({ type: "riflemen", figures: 10, loadout: primaryKit("hw141_levy_rifle_mk2", "issue", ["bayonet_sword_pattern"]) });
    expect(bare.melee).toBe(0);
    expect(fixed.melee).toBeGreaterThan(0);
    expect(deriveSquad({ type: "riflemen", figures: 10 }).melee).toBe(SQUAD_TYPES.riflemen.melee);
  });

  it("neither file ever looks inside a weapon (drift guard 11)", () => {
    // deriveSquad consumes deriveLoadout OUTPUT only. If either file ever named
    // a pattern, a quality grade or the resolver, the reduction boundary would
    // have been crossed and the equalities above would stop meaning anything.
    for (const [label, src] of [["tactical.ts", CANON_SRC], ["data.js", MIRROR_SRC]]) {
      for (const token of ["patternKey", "quirks", "WEAPON_PATTERNS", "QUALITY_GRADES", "MODIFICATIONS", "resolveWeapon", "rollWeapon", "LOADOUT_SHARES"]) {
        expect(codeLines(src).join("\n"), `${label} reaches into a weapon via ${token}`).not.toContain(token);
      }
    }
  });

  it("an unreadable loadout is no loadout, not a crash", () => {
    const broken = deriveSquad({
      type: "riflemen", figures: 10,
      loadout: { primary: { patternKey: "no_such_pattern", quality: "issue", mods: [], quirks: [] } },
    });
    expect(broken.ranged).toBe(SQUAD_TYPES.riflemen.ranged);
    expect(broken.pts).toBe(SQUAD_TYPES.riflemen.pts);
  });

  it("the works vocabulary is the one Lane B stamps", () => {
    // Lane B emits only trench and bunker; Lane A owns all four keys.
    expect(DEPLOYABLE_KEYS).toContain("trench");
    expect(DEPLOYABLE_KEYS).toContain("bunker");
    // Works cover extends the terrain cover scale rather than restating it.
    const terrainMax = Math.max(...Object.keys(TERRAIN).map((k) => TERRAIN[k].cover));
    expect(DEPLOYABLES.bunker.cover).toBeGreaterThan(terrainMax);
    expect(DEPLOYABLES.foxhole.cover).toBeLessThanOrEqual(terrainMax);
  });
});
