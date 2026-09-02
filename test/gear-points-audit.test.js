// THE POINTS AUDIT, RECOMPUTED — docs/GEAR_LIBRARY.md §11 and
// docs/FACTION_ROSTER.md §5 versus the tables they claim to describe.
//
// WHY THIS FILE EXISTS. A Wave 1 lane published a cost curve claiming 110 RP
// against a table that summed to 138, restated it in three places, and nothing
// checked it. A published number is not a number until something recomputes it.
// So this suite parses the tables back out of the markdown and rebuilds every
// cell from base44/shared/tactical.ts, src/lib/armyDesign.js and
// src/lib/units.js. A stale figure in either document is a red test.
//
// IT ALSO CHECKS THE FORMULA AGAINST ITSELF. §11.1 prints its coefficients in a
// code fence; the suite parses THOSE and recomputes the §11.2 table with them,
// then separately asserts the printed coefficients are the ones Lane F's brief
// mandates. Editing the formula without moving the numbers fails, and so does
// moving both away from the contract.
//
// BOUNDED AT BOTH ENDS. Each section is sliced from its own heading to the next
// top-level heading, never to end-of-file. Lane H appends after Lane F; an
// end-of-file bound would silently swallow its section and start reporting on
// it. Sub-tables inside a section are located by their header row, not by
// position, so inserting a paragraph moves nothing.
//
// OWNERSHIP. TACTICAL_SQUAD_PLAN §3 assigns test/tactical-mirror.test.js to
// Lane A and names no test for Lane F. This file is new and unassigned, and
// Lane F claims it explicitly — the same move §3's Lane G Amendment 3 makes for
// test/rules-mirror.test.js. It duplicates no assertion in the mirror suite: it
// reads documents, which no other suite does.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import { DESIGN_SLOTS, SLOT_KEYS, DEFAULT_DESIGN, SQUAD_MOD_KEYS, compileDesign } from "@/lib/armyDesign.js";
import { UNIT_TYPES, UNIT_KEYS, PROPOSED_UNIT_TYPES, BUILDINGS } from "@/lib/units.js";
import { IMAGE_LIBRARY, IMAGE_CATEGORIES } from "@/lib/imageLibrary.js";
import { ENTRIES } from "@/lib/wiki/entries.js";

const tacticalSrc = readRepoFile("base44/shared/tactical.ts");
const SQUAD_TYPES = extractConst(tacticalSrc, "SQUAD_TYPES");
const SPECIALISTS = extractConst(tacticalSrc, "SPECIALISTS");
const UPGRADES = extractConst(tacticalSrc, "UPGRADES");
const UPGRADE_RULES = extractConst(tacticalSrc, "UPGRADE_RULES");
const POINTS_MODEL = extractConst(tacticalSrc, "POINTS_MODEL");
const SCALING = extractConst(tacticalSrc, "SCALING");

const gearSrc = readRepoFile("docs/GEAR_LIBRARY.md");
const rosterSrc = readRepoFile("docs/FACTION_ROSTER.md");
const rulesSrc = readRepoFile("docs/GAME_RULES.md");
const librarySrc = readRepoFile("src/lib/imageLibrary.js");

// ── document slicing ───────────────────────────────────────────────────────
// From a heading line to the NEXT top-level heading, or the end of the file if
// this section is currently last. Both ends are bound: a later lane's section
// is excluded whether it exists yet or not.
function section(src, headingStartsWith) {
  const lines = src.split("\n");
  const start = lines.findIndex((l) => l.startsWith(headingStartsWith));
  expect(start, `heading not found: ${headingStartsWith}`).toBeGreaterThan(-1);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}

// A markdown pipe table located by a distinctive cell in its header row.
// Returns rows as arrays of trimmed cells.
function table(sectionText, ...headerCells) {
  const lines = sectionText.split("\n");
  const head = lines.findIndex((l) => l.startsWith("|") && headerCells.every((c) => l.includes(`| ${c} |`) || l.includes(`| ${c}`)));
  expect(head, `table not found for header cells: ${headerCells.join(", ")}`).toBeGreaterThan(-1);
  const rows = [];
  for (let i = head + 2; i < lines.length; i++) {
    if (!lines[i].startsWith("|")) break;
    rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
  }
  expect(rows.length, "table has no body rows").toBeGreaterThan(0);
  return rows;
}

const AUDIT = section(gearSrc, "## 11. Points Audit");
const ACCESS = section(rosterSrc, "## 5. Unit Access");
// Located by its heading TEXT, never by its number. Lanes append concurrently and
// the orchestrator may renumber at merge; a suite that hard-codes 26 turns a
// mechanical renumber into a red test in a file the renumberer is not editing.
const RULES = section(rulesSrc, "## 26. Squads, Specialists & Upgrade Kits");

// A lane's own tail block in a shared file, bounded at BOTH ends: from this
// lane's banner to whichever comes first — the NEXT lane's banner, or the array
// terminator. "Everything to the end of the file" is true only while this lane
// happens to be last, and Lane H merges after Lane F into both of these files.
// Bounding on the array close alone would quietly swallow Lane H's block and
// start reporting on its content as if it were Lane F's.
const LANE_F_PLATE_BANNER = "// ——— LANE F: squad tokens, upgrade kits & design patterns ———";
const LANE_F_CODEX_BANNER = "// ——— LANE F: squad types ———";
function laneBlock(src, banner, terminator) {
  const start = src.indexOf(banner);
  expect(start, `banner not found: ${banner}`).toBeGreaterThan(-1);
  const rest = src.slice(start + banner.length);
  const ends = [rest.indexOf("// ——— LANE"), rest.search(terminator)].filter((i) => i > -1);
  expect(ends.length, "the block is bounded at neither a later banner nor the array close").toBeGreaterThan(0);
  return banner + rest.slice(0, Math.min(...ends));
}
const laneFPlateBlock = laneBlock(librarySrc, LANE_F_PLATE_BANNER, /\n\];/);
const codexSrc = readRepoFile("src/lib/wiki/entries.js");
const laneFCodexSrc = laneBlock(codexSrc, LANE_F_CODEX_BANNER, /\n\];/);
const laneFCodexBlock = (() => {
  const block = laneFCodexSrc;
  const ids = new Set([...block.matchAll(/^\s*id: "([^"]+)"/gm)].map((m) => m[1]));
  expect(ids.size, "the Lane F Codex block declares no entries").toBeGreaterThan(0);
  return ENTRIES.filter((e) => ids.has(e.id));
})();
const bare = (c) => c.replace(/[`*]/g, "").trim();
const keysOf = (cell) => bare(cell).split(",").map((s) => s.trim()).filter(Boolean);

// ── the formula, read out of the document it is printed in ─────────────────
const FENCE = AUDIT.match(/```\n(value\(t\)[\s\S]*?)\n```/);
const COEF = (() => {
  expect(FENCE, "§11.1 formula fence not found").not.toBeNull();
  const line = FENCE[1].split("\n")[0];
  const grab = (field) => {
    const m = line.match(new RegExp(`([0-9.]+)×t\\.${field}`));
    return m ? Number(m[1]) : 1;
  };
  const rangeM = line.match(/([0-9.]+)×\(t\.range/);
  return {
    melee: /t\.melee/.test(line) ? grab("melee") : null,
    ranged: /t\.ranged/.test(line) ? grab("ranged") : null,
    armor: grab("armor"),
    speed: grab("speed"),
    morale: grab("morale"),
    range: rangeM ? Number(rangeM[1]) : null,
  };
})();

// Recomputed with the coefficients the DOCUMENT prints.
const value = (t) => t.figures * (COEF.melee * t.melee + COEF.ranged * t.ranged
  + COEF.armor * t.armor + COEF.speed * t.speed + COEF.morale * t.morale + COEF.range * (t.range - 1));
const efficiency = (t) => value(t) / t.pts;
const BASELINE = efficiency(SQUAD_TYPES[POINTS_MODEL.anchorKey]);
const ratio = (t) => efficiency(t) / BASELINE;

// Lane A's model, reimplemented from POINTS_MODEL so the doc's `fair pts`
// column is checked against the constants and not against a copy of the code.
const combat = (t) => t.ranged * (1 + t.range / POINTS_MODEL.rangeDivisor)
  + t.ranged * Math.max(0, t.armorPen - POINTS_MODEL.penFloor) * POINTS_MODEL.penWeight
  + t.melee * POINTS_MODEL.meleeWeight
  + t.figures * (t.armor * POINTS_MODEL.armorWeight + t.morale * POINTS_MODEL.moraleWeight)
  + t.speed * POINTS_MODEL.speedWeight
  + t.specials.length * POINTS_MODEL.specialWeight;
const ANCHOR_CV = combat(SQUAD_TYPES[POINTS_MODEL.anchorKey]);
const fairPts = (t) => (combat(t) / ANCHOR_CV) * POINTS_MODEL.anchorPts;

// -0 formats as "-0.00" and would never match a published "+0.00".
const z = (n) => (Object.is(n, -0) || Math.abs(n) < 5e-13 ? 0 : n);
const f2 = (n) => z(n).toFixed(2);
const f3 = (n) => z(n).toFixed(3);
const sgn = (n) => (z(n) >= 0 ? "+" : "") + f2(n);
const ANCHOR = SQUAD_TYPES[POINTS_MODEL.anchorKey].pts;

describe("points audit — the formula in §11.1", () => {
  it("prints the coefficients Lane F's brief mandates", () => {
    expect(COEF).toEqual({ melee: 1, ranged: 1, armor: 0.6, speed: 0.35, morale: 0.5, range: 0.25 });
  });

  it("names the anchor the rest of the audit is divided by, and prints its computed baseline", () => {
    expect(FENCE[1]).toContain(`efficiency(SQUAD_TYPES.${POINTS_MODEL.anchorKey})`);
    expect(FENCE[1]).toContain(`ratio(t) ≤ ${POINTS_MODEL.efficiencyCap.toFixed(2)}`);
    expect(AUDIT).toContain(`\`SQUAD_TYPES.${POINTS_MODEL.anchorKey}.pts = ${ANCHOR}\``);
    expect(AUDIT).toContain(`\`baseline\` computes to **${f3(BASELINE)}**`);
  });
});

describe("points audit — §11.2, every squad type", () => {
  const rows = table(AUDIT, "key", "from", "tier", "figures", "pts", "value");

  it("carries one row per SQUAD_TYPES key and no row that is not one", () => {
    expect(rows.map((r) => bare(r[0]))).toEqual(Object.keys(SQUAD_TYPES));
  });

  it("republishes each row's own fields unchanged", () => {
    for (const r of rows) {
      const t = SQUAD_TYPES[bare(r[0])];
      expect([r[1], r[2], Number(r[3]), Number(r[4])], bare(r[0])).toEqual([t.from, t.tier, t.figures, t.pts]);
    }
  });

  it("recomputes value, efficiency and ratio from the printed formula", () => {
    for (const r of rows) {
      const t = SQUAD_TYPES[bare(r[0])];
      expect([r[5], r[6], r[7]], bare(r[0])).toEqual([f2(value(t)), f3(efficiency(t)), f2(ratio(t))]);
    }
  });

  it("recomputes fair pts and deviation from POINTS_MODEL", () => {
    for (const r of rows) {
      const t = SQUAD_TYPES[bare(r[0])];
      const dev = (t.pts - fairPts(t)) / fairPts(t) * 100;
      expect([r[8], r[9]], bare(r[0])).toEqual([f2(fairPts(t)), `${sgn(dev)}%`]);
    }
  });

  it("holds the hard gate — no type over the efficiency cap — and says which row is widest", () => {
    const widest = Object.keys(SQUAD_TYPES).reduce((a, b) => (ratio(SQUAD_TYPES[a]) >= ratio(SQUAD_TYPES[b]) ? a : b));
    for (const [k, t] of Object.entries(SQUAD_TYPES)) {
      expect(ratio(t), `${k} exceeds the efficiency cap`).toBeLessThanOrEqual(POINTS_MODEL.efficiencyCap);
    }
    expect(AUDIT).toContain(`widest ratio in the roster is \`${widest}\` at **${f2(ratio(SQUAD_TYPES[widest]))}**`);
  });

  it("states the band exceptions against the base nine, computed", () => {
    const BASE_NINE = ["riflemen", "assault", "gunners", "scouts", "mortars", "pioneers", "crawler", "artillery", "fighter"];
    const maxArmor = Math.max(...BASE_NINE.map((k) => SQUAD_TYPES[k].armor));
    const maxRange = Math.max(...BASE_NINE.map((k) => SQUAD_TYPES[k].range));
    expect(SQUAD_TYPES.land_dreadnought.armor - maxArmor, "armour exception exceeds the sanctioned +2").toBeLessThanOrEqual(2);
    expect(SQUAD_TYPES.marksmen.range - maxRange, "range exception exceeds the sanctioned +1").toBeLessThanOrEqual(1);
    expect(AUDIT).toContain(`\`land_dreadnought.armor\` = **${SQUAD_TYPES.land_dreadnought.armor}**`);
    expect(AUDIT).toContain(`\`marksmen.range\` = **${SQUAD_TYPES.marksmen.range}**`);
  });
});

describe("points audit — §11.3, specialists", () => {
  const rows = table(AUDIT, "key", "pts", "% of anchor", "mods");

  it("carries one row per SPECIALISTS key", () => {
    expect(rows.map((r) => bare(r[0]))).toEqual(Object.keys(SPECIALISTS));
  });

  it("republishes pts and recomputes the fraction of the anchor squad", () => {
    for (const r of rows) {
      const s = SPECIALISTS[bare(r[0])];
      expect([Number(r[1]), r[2]], bare(r[0])).toEqual([s.pts, `${f2(s.pts / ANCHOR * 100)}%`]);
    }
  });

  it("keeps every specialist inside the quarter-of-anchor ceiling with at least one numeric mod", () => {
    for (const [k, s] of Object.entries(SPECIALISTS)) {
      expect(s.pts, `${k} is over a quarter of the anchor squad`).toBeLessThanOrEqual(ANCHOR * 0.25);
      expect(Object.values(s.mods).some(Number.isFinite), `${k} has no numeric mod`).toBe(true);
    }
  });

  it("publishes the staff ceiling as the sum of the dearest SCALING.maxSpecialists", () => {
    const top = Object.values(SPECIALISTS).map((s) => s.pts).sort((a, b) => b - a)
      .slice(0, SCALING.maxSpecialists).reduce((a, b) => a + b, 0);
    expect(AUDIT).toContain(`carries at most **${top}** pts of staff`);
  });
});

describe("points audit — §11.4, upgrade kits", () => {
  const rows = table(AUDIT, "key", "appliesTo", "tier", "pts");
  const deltas = table(AUDIT, "key", "Δ fair pts, min");
  const stacks = table(AUDIT, "type", "pts", "dearest legal stack");

  it("carries one row per UPGRADES key and republishes appliesTo, tier and pts", () => {
    expect(rows.map((r) => bare(r[0]))).toEqual(Object.keys(UPGRADES));
    for (const r of rows) {
      const u = UPGRADES[bare(r[0])];
      expect([keysOf(r[1]), r[2], Number(r[3]), r[4]], bare(r[0]))
        .toEqual([u.appliesTo, u.tier, u.pts, `${f2(u.pts / ANCHOR * 100)}%`]);
    }
  });

  it("keeps every kit inside the two-fifths-of-anchor ceiling, non-empty and non-free", () => {
    for (const [k, u] of Object.entries(UPGRADES)) {
      expect(u.pts, `${k} is over two fifths of the anchor squad`).toBeLessThanOrEqual(ANCHOR * 0.4);
      expect(u.appliesTo.length, `${k} applies to nothing`).toBeGreaterThan(0);
      for (const s of u.appliesTo) expect(SQUAD_TYPES[s], `${k} applies to a squad type that does not exist: ${s}`).toBeDefined();
      const free = u.tier === "I" && !Object.values(u.mods).some((v) => v < 0);
      expect(free, `${k} is a free tier-I upgrade`).toBe(false);
    }
  });

  it("recomputes each kit's fair-pts delta across its own appliesTo", () => {
    for (const r of deltas) {
      const u = UPGRADES[bare(r[0])];
      const ds = u.appliesTo.map((s) => {
        const fitted = Object.assign({}, SQUAD_TYPES[s]);
        for (const [f, v] of Object.entries(u.mods)) fitted[f] = fitted[f] + v;
        return fairPts(fitted) - fairPts(SQUAD_TYPES[s]);
      });
      expect([r[1], r[2], r[3]], bare(r[0])).toEqual([
        sgn(Math.min(...ds)), sgn(Math.max(...ds)), sgn(ds.reduce((a, b) => a + b, 0) / ds.length),
      ]);
    }
  });

  it("recomputes the stack ceiling for every squad type, and no stack reaches a second stand", () => {
    const stackOf = (key) => Object.values(UPGRADES).filter((u) => u.appliesTo.includes(key))
      .sort((a, b) => b.pts - a.pts).slice(0, UPGRADE_RULES.maxPerSquad);
    expect(stacks.map((r) => bare(r[0]))).toEqual(Object.keys(SQUAD_TYPES));
    for (const r of stacks) {
      const key = bare(r[0]);
      const t = SQUAD_TYPES[key];
      const top = stackOf(key);
      const sum = top.reduce((a, u) => a + u.pts, 0);
      expect([Number(r[1]), Number(r[2]), r[4]], key)
        .toEqual([t.pts, sum, `${f2(sum / t.pts * 100)}%`]);
      expect(sum, `a full kit stack on ${key} costs as much as a second stand`).toBeLessThan(t.pts);
    }
  });
});

describe("points audit — §11.5, the Design Bureau", () => {
  const counts = table(AUDIT, "slot", "options");
  const env = table(AUDIT, "compiled field", "min", "max");

  const combos = [];
  {
    const opts = SLOT_KEYS.map((s) => Object.keys(DESIGN_SLOTS[s].options));
    for (const a of opts[0]) for (const b of opts[1]) for (const c of opts[2]) for (const d of opts[3]) {
      combos.push(compileDesign({ formation: a, weapon: b, armor: c, support: d }));
    }
  }

  it("offers at least six options in every slot, with SLOT_KEYS and DEFAULT_DESIGN unmoved", () => {
    expect(SLOT_KEYS).toEqual(["formation", "weapon", "armor", "support"]);
    expect(DEFAULT_DESIGN).toEqual({ formation: "line", weapon: "rifles", armor: "standard", support: "none" });
    for (const s of SLOT_KEYS) {
      expect(Object.keys(DESIGN_SLOTS[s].options).length, `slot ${s}`).toBeGreaterThanOrEqual(6);
      expect(DESIGN_SLOTS[s].options[DEFAULT_DESIGN[s]], `default option missing from ${s}`).toBeDefined();
    }
  });

  // The fourteen options that existed before this lane. A closed historical
  // set: it records what shipped, so it never grows, and every option added
  // after it must carry squad mods.
  const LEGACY = ["line", "vanguard", "skirmish", "column", "rifles", "trench_guns", "mortars",
    "standard", "plated", "scout", "none", "medics", "signals", "commissars"];

  it("keeps every pre-existing option key — live saves reference them", () => {
    const all = SLOT_KEYS.flatMap((s) => Object.keys(DESIGN_SLOTS[s].options));
    for (const k of LEGACY) expect(all, `option ${k} was removed or renamed`).toContain(k);
  });

  it("gives every option added after the legacy set a squad-mod object", () => {
    for (const s of SLOT_KEYS) {
      for (const [k, o] of Object.entries(DESIGN_SLOTS[s].options)) {
        if (LEGACY.includes(k)) continue;
        expect(o.mods, `${s}/${k} carries no mods`).toBeDefined();
        expect(Object.keys(o.mods).length, `${s}/${k} has an empty mods object`).toBeGreaterThan(0);
        for (const m of Object.keys(o.mods)) expect(SQUAD_MOD_KEYS, `${s}/${k} mods ${m}`).toContain(m);
      }
    }
  });

  // The two layers must agree in sign, or a design deals more macro damage
  // while handing the squad a worse gun. Scoped to every option that declares
  // mods, never to this lane's ten: a later lane's option is covered the
  // moment it is written.
  it("keeps the legacy multipliers and the squad mods pointing the same way", () => {
    for (const s of SLOT_KEYS) {
      for (const [k, o] of Object.entries(DESIGN_SLOTS[s].options)) {
        if (!o.mods) continue;
        const where = `${s}/${k}`;
        const off = (o.mods.ranged || 0) + (o.mods.melee || 0);
        if ((o.dmgOut || 1) > 1) expect(Math.max(o.mods.ranged || 0, o.mods.melee || 0), `${where} deals more macro damage but no better squad attack`).toBeGreaterThan(0);
        else if ((o.dmgOut || 1) < 1) expect(Math.min(o.mods.ranged || 0, o.mods.melee || 0), `${where} deals less macro damage but no worse squad attack`).toBeLessThan(0);
        else expect(off, `${where} moves squad attack without moving dmgOut`).toBe(0);
        if ((o.dmgIn || 1) < 1) expect(o.mods.armor || 0, `${where} takes less macro damage but gains no squad armor`).toBeGreaterThan(0);
        if ((o.dmgIn || 1) > 1) expect(o.mods.armor || 0, `${where} takes more macro damage but loses no squad armor`).toBeLessThan(0);
        if ((o.moraleIn || 1) < 1) expect(o.mods.morale || 0, `${where} loses less macro morale but gains no squad morale`).toBeGreaterThan(0);
        if ((o.moraleIn || 1) > 1) expect(o.mods.morale || 0, `${where} loses more macro morale but loses no squad morale`).toBeLessThan(0);
      }
    }
  });

  it("charges for every non-default option — a cost, a penalty, or both", () => {
    for (const s of SLOT_KEYS) {
      for (const [k, o] of Object.entries(DESIGN_SLOTS[s].options)) {
        if (k === DEFAULT_DESIGN[s]) continue;
        const paid = Object.values(o.cost || {}).some((v) => v > 0)
          || (o.dmgOut || 1) < 1 || (o.dmgIn || 1) > 1 || (o.moraleIn || 1) > 1
          || Object.values(o.mods || {}).some((v) => v < 0);
        expect(paid, `${s}/${k} is strictly better than the default`).toBe(true);
      }
    }
  });

  it("keeps compileDesign's frozen output shape and leaves the default design neutral", () => {
    const d = compileDesign(DEFAULT_DESIGN);
    expect(Object.keys(d).sort()).toEqual(["cost", "dmgIn", "dmgOut", "effects", "mods", "moraleIn", "skill"]);
    expect(d).toEqual({ skill: 0, dmgOut: 1, dmgIn: 1, moraleIn: 1, cost: { manpower: 0, steel: 0, fuel: 0 }, mods: {}, effects: [] });
  });

  it("republishes the per-slot counts", () => {
    expect(counts.map((r) => bare(r[0]))).toEqual(SLOT_KEYS);
    for (const r of counts) {
      const o = Object.values(DESIGN_SLOTS[bare(r[0])].options);
      expect([Number(r[1]), Number(r[2])], bare(r[0])).toEqual([o.length, o.filter((x) => x.mods).length]);
    }
  });

  it("recomputes the compiled envelope over every legal design", () => {
    const readers = {
      skill: (c) => c.skill,
      dmgOut: (c) => c.dmgOut,
      dmgIn: (c) => c.dmgIn,
      moraleIn: (c) => c.moraleIn,
      "cost (total)": (c) => c.cost.manpower + c.cost.steel + c.cost.fuel,
      effects: (c) => c.effects.length,
    };
    for (const k of SQUAD_MOD_KEYS) readers[`mods.${k}`] = (c) => c.mods[k] || 0;
    expect(AUDIT).toContain(`enumerated over all **${combos.length}** legal designs`);
    expect(env.map((r) => bare(r[0])).sort()).toEqual(Object.keys(readers).sort());
    for (const r of env) {
      const f = readers[bare(r[0])];
      const v = combos.map(f);
      expect([r[1], r[2]], bare(r[0])).toEqual([f3(Math.min(...v)), f3(Math.max(...v))]);
    }
  });
});

describe("points audit — §11.6, proposed macro support classes", () => {
  const rows = table(AUDIT, "key", "points", "cost", "density");
  const resourceCost = (u) => (u.cost.manpower || 0) + (u.cost.steel || 0) + (u.cost.fuel || 0);
  const density = (u) => u.points / resourceCost(u);
  const band = Object.values(UNIT_TYPES).map(density);
  const lo = Math.min(...band), hi = Math.max(...band);

  it("stays out of UNIT_TYPES and out of UNIT_KEYS", () => {
    for (const k of Object.keys(PROPOSED_UNIT_TYPES)) {
      expect(UNIT_TYPES[k], `${k} leaked into UNIT_TYPES`).toBeUndefined();
      expect(UNIT_KEYS, `${k} leaked into UNIT_KEYS`).not.toContain(k);
    }
    expect(Object.keys(PROPOSED_UNIT_TYPES).length).toBeGreaterThanOrEqual(7);
  });

  it("carries the UNIT_TYPES field set plus effects and a blurb, deploying at a real building", () => {
    for (const [k, u] of Object.entries(PROPOSED_UNIT_TYPES)) {
      for (const f of ["key", "label", "points", "cost", "attack", "defense", "speed", "domain", "deployAt", "effects", "blurb"]) {
        expect(u[f], `${k} missing ${f}`).toBeDefined();
      }
      expect(u.key).toBe(k);
      expect(BUILDINGS[u.deployAt], `${k} deploys at a building that does not exist: ${u.deployAt}`).toBeDefined();
      expect(["land", "sea", "air"]).toContain(u.domain);
      expect(u.effects.length, `${k} has no effects`).toBeGreaterThan(0);
      for (const e of u.effects) expect(["macro", "tactical", "economy"], `${k} effect scope`).toContain(e.scope);
    }
  });

  it("prices every row inside the density band the base five already set", () => {
    for (const [k, u] of Object.entries(PROPOSED_UNIT_TYPES)) {
      expect(density(u), `${k} is priced below the cheapest thing in UNIT_TYPES`).toBeGreaterThanOrEqual(lo);
      expect(density(u), `${k} is priced above the dearest thing in UNIT_TYPES`).toBeLessThanOrEqual(hi);
    }
    expect(AUDIT).toContain(`runs **${f3(lo)}**`);
    expect(AUDIT).toContain(`to **${f3(hi)}**`);
  });

  it("republishes points, cost and density", () => {
    expect(rows.map((r) => bare(r[0]))).toEqual(Object.keys(PROPOSED_UNIT_TYPES));
    for (const r of rows) {
      const u = PROPOSED_UNIT_TYPES[bare(r[0])];
      const cost = ["manpower", "steel", "fuel"].filter((x) => u.cost[x]).map((x) => `${u.cost[x]} ${x}`).join(" + ");
      expect([Number(r[1]), r[2], r[3], r[4]], bare(r[0]))
        .toEqual([u.points, cost, f3(density(u)), `${u.attack}/${u.defense}/${u.speed}`]);
    }
  });
});

describe("points audit — §11.8, what is reported and not failed", () => {
  it("lists exactly the types under the thin threshold, to the precision the threshold needs", () => {
    const thin = Object.entries(SQUAD_TYPES).filter(([, t]) => ratio(t) < 0.55);
    expect(AUDIT).toContain(`${thin.length} of ${Object.keys(SQUAD_TYPES).length}`);
    for (const [k, t] of thin) expect(AUDIT, `thin row ${k} not reported`).toContain(`\`${k}\` ${f3(ratio(t))}`);
    for (const [k, t] of Object.entries(SQUAD_TYPES)) {
      if (ratio(t) >= 0.55) expect(AUDIT, `${k} is not thin but is listed as thin`).not.toContain(`\`${k}\` ${f3(ratio(t))},`);
    }
  });

  it("reports the combined staff-and-kit bill on the two stands where it is worst", () => {
    const staff = Object.values(SPECIALISTS).map((s) => s.pts).sort((a, b) => b - a)
      .slice(0, SCALING.maxSpecialists).reduce((a, b) => a + b, 0);
    const worst = Object.entries(SQUAD_TYPES).map(([k, t]) => {
      const kits = Object.values(UPGRADES).filter((u) => u.appliesTo.includes(k))
        .sort((a, b) => b.pts - a.pts).slice(0, UPGRADE_RULES.maxPerSquad).reduce((a, u) => a + u.pts, 0);
      return { k, pct: (kits + staff) / t.pts * 100 };
    }).sort((a, b) => b.pct - a.pct);
    expect(AUDIT).toContain(`**${f2(worst[0].pct)}%** of \`${worst[0].k}\``);
    expect(AUDIT).toContain(`**${f2(worst[1].pct)}%** of \`${worst[1].k}\``);
  });
});

describe("faction roster — §5 unit access", () => {
  const rows = table(ACCESS, "House", "Signature squad type(s)");

  it("carries one row per house in §1", () => {
    const houses = [...rosterSrc.matchAll(/^### \d+\. (.+?) —/gm)].map((m) => m[1]);
    expect(houses.length).toBe(10);
    expect(rows.map((r) => r[0])).toEqual(houses);
  });

  it("names only live keys, and only kits that fit one of the house's own squads", () => {
    for (const r of rows) {
      const squads = keysOf(r[1]);
      const kits = keysOf(r[2]);
      expect(squads.length, `${r[0]} names no squad`).toBeGreaterThan(0);
      for (const s of squads) expect(SQUAD_TYPES[s], `${r[0]} names a squad type that does not exist: ${s}`).toBeDefined();
      for (const k of kits) {
        expect(UPGRADES[k], `${r[0]} names an upgrade that does not exist: ${k}`).toBeDefined();
        expect(UPGRADES[k].appliesTo.some((a) => squads.includes(a)),
          `${r[0]}'s kit ${k} fits none of its own signature squads`).toBe(true);
      }
    }
  });

  it("gives every new squad type and every kit at least one house", () => {
    const squads = new Set(rows.flatMap((r) => keysOf(r[1])));
    const kits = new Set(rows.flatMap((r) => keysOf(r[2])));
    const NEW = ["stormtroops", "sappers", "ski_troops", "digger_corps", "pilgrim_levy", "provost",
      "marksmen", "flame_team", "autocar_scouts", "siege_mortar", "land_dreadnought"];
    for (const k of NEW) expect(squads, `${k} is signature to no house`).toContain(k);
    for (const k of Object.keys(UPGRADES)) expect(kits, `${k} is signature to no house`).toContain(k);
  });

  it("declares every lock the lane actually uses, and no more than the budgeted two", () => {
    const locked = Object.entries(SQUAD_TYPES).filter(([, t]) => t.creedLock || t.factionLock);
    const BASE_NINE = ["riflemen", "assault", "gunners", "scouts", "mortars", "pioneers", "crawler", "artillery", "fighter"];
    expect(locked.filter(([k]) => !BASE_NINE.includes(k)).length,
      "more than two of the new rows carry a lock").toBeLessThanOrEqual(2);
    for (const [k, t] of locked) {
      if (t.creedLock) expect(ACCESS, `lock on ${k} is not declared`).toContain(`\`creedLock: '${t.creedLock}'\``);
      if (t.factionLock) expect(ACCESS, `lock on ${k} is not declared`).toContain(t.factionLock);
    }
    const claimsNoFactionLock = ACCESS.includes("No `factionLock` is used anywhere in this lane");
    expect(claimsNoFactionLock && locked.some(([, t]) => t.factionLock),
      "the section claims no factionLock while a row carries one").toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// STEP 3 — the plates, the Codex and the [PROPOSED] rules section.
//
// The gate this suite deliberately does NOT write: "every Lane F plate has
// url === null". A previous lane wrote exactly that and it went red the moment
// the platform delivered art — a gate forbidding the step it exists to wait
// for. A delivered url is the SUCCESS case. What must stay true is that the
// LANE ships no visual, which is a property of the lane's diff and of the P()
// call it writes, not of the value P() resolves at runtime.
// ══════════════════════════════════════════════════════════════════════════

// Parse the Lane F block's P(...) calls textually. The source is the authority
// for arity and aspect; IMAGE_LIBRARY is the authority for what resolves.
const PLATE_CALL = /P\(\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*\n\s*"([^"]*)"((?:,[^)]*)?)\)/g;
const laneFPlates = [...laneFPlateBlock.matchAll(PLATE_CALL)].map((m) => ({
  key: m[1], category: m[2], title: m[3], desc: m[4], prompt: m[5], extra: (m[6] || "").trim(),
  aspect: (m[6] || "").trim() ? (m[6].match(/"([^"]+)"/) || [])[1] : "1:1",
}));

const NEW_TYPES = ["stormtroops", "sappers", "ski_troops", "digger_corps", "pilgrim_levy", "provost",
  "marksmen", "flame_team", "autocar_scouts", "siege_mortar", "land_dreadnought"];
const LEGACY_DESIGN_OPTIONS = ["line", "vanguard", "skirmish", "column", "rifles", "trench_guns",
  "mortars", "standard", "plated", "scout", "none", "medics", "signals", "commissars"];

describe("plates — the Lane F block in src/lib/imageLibrary.js", () => {
  it("parsed every P(...) call in the block", () => {
    // A regex that silently matches nothing turns every assertion below into a
    // vacuous pass. Count the openers independently and demand agreement.
    const openers = (laneFPlateBlock.match(/^\s{2}P\(/gm) || []).length;
    expect(laneFPlates.length, "the plate parser missed a P(...) call").toBe(openers);
    expect(laneFPlates.length).toBeGreaterThanOrEqual(29);
  });

  it("is ONE contiguous block, and holds nothing but its own plates", () => {
    // NOT "Lane F is last". Lane H merges after Lane F and appends its own tail
    // block to this file; the sanctioned resolution is to keep both, in lane
    // order. A gate demanding Lane F stay last would forbid the next required
    // step. What must hold is that Lane F opened exactly one block and that
    // nothing but plates lives inside it.
    for (const src of [librarySrc, codexSrc]) {
      const mine = [...src.matchAll(/\/\/ ——— LANE F: /g)];
      expect(mine.length, "Lane F opened more than one block in a shared file").toBe(1);
    }
    const stray = laneFPlateBlock.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//") && !/^\s{2}P\(/.test(l) && !/^\s{4}"/.test(l));
    expect(stray, "non-plate source inside the Lane F block").toEqual([]);
  });

  it("registers a token for every new squad type and an action plate for every single-figure stand", () => {
    const keys = new Set(laneFPlates.map((p) => p.key));
    for (const k of NEW_TYPES) expect(keys, `missing unit_${k}_token`).toContain(`unit_${k}_token`);
    // Derived from the table, not listed: the vehicles ARE the figures === 1 rows.
    const stands = NEW_TYPES.filter((k) => SQUAD_TYPES[k].figures === 1);
    expect(stands.length, "the roster's single-figure new stands").toBe(3);
    for (const k of stands) expect(keys, `missing unit_${k}_action`).toContain(`unit_${k}_action`);
    for (const k of NEW_TYPES.filter((x) => !stands.includes(x)))
      expect(keys, `${k} is not a single-figure stand and must not carry an action plate`).not.toContain(`unit_${k}_action`);
  });

  it("registers a kit plate for exactly the kits that had none, and re-registers none that existed", () => {
    const laneFKeys = new Set(laneFPlates.map((p) => p.key));
    const preExisting = new Set(
      [...librarySrc.slice(0, librarySrc.indexOf(LANE_F_PLATE_BANNER)).matchAll(/P\("(kit_[a-z_0-9]+)"/g)].map((m) => m[1]),
    );
    for (const k of Object.keys(UPGRADES)) {
      const plate = `kit_${k}`;
      if (preExisting.has(plate)) expect(laneFKeys, `${plate} already existed — re-registering it is a duplicate key`).not.toContain(plate);
      else expect(laneFKeys, `${k} has no kit plate on either side`).toContain(plate);
    }
  });

  it("registers a design card for every option this lane added, and for no legacy option", () => {
    const laneFKeys = new Set(laneFPlates.map((p) => p.key));
    const added = SLOT_KEYS.flatMap((s) => Object.keys(DESIGN_SLOTS[s].options)).filter((k) => !LEGACY_DESIGN_OPTIONS.includes(k));
    expect(added.length, "the options this lane added").toBeGreaterThanOrEqual(10);
    for (const k of added) expect(laneFKeys, `missing design_${k}`).toContain(`design_${k}`);
    for (const k of LEGACY_DESIGN_OPTIONS) expect(laneFKeys, `design_${k} predates this lane`).not.toContain(`design_${k}`);
  });

  it("names only categories that already exist, and adds no IMAGE_CATEGORIES key", () => {
    for (const p of laneFPlates) expect(Object.keys(IMAGE_CATEGORIES), `${p.key} names an unknown category`).toContain(p.category);
    expect(new Set(laneFPlates.map((p) => p.category))).toEqual(new Set(["units", "gear", "designs"]));
  });

  it("leaves zero duplicate plate keys in the whole library", () => {
    const all = IMAGE_LIBRARY.map((p) => p.key);
    const dupes = [...new Set(all.filter((k, i) => all.indexOf(k) !== i))];
    expect(dupes, "duplicate plate keys").toEqual([]);
  });

  it("passes no url and restates no HOUSE_STYLE", () => {
    for (const p of laneFPlates) {
      // P(key, category, title, desc, prompt, aspect?) — a 7th argument would be a url.
      const extraArgs = p.extra ? p.extra.split(",").filter((x) => x.trim()).length : 0;
      expect(extraArgs, `${p.key} passes more than an aspect`).toBeLessThanOrEqual(1);
      if (extraArgs === 1) expect(["1:1", "4:3", "16:9"], `${p.key} aspect`).toContain(p.aspect);
      expect(p.prompt.length, `${p.key} has no prompt`).toBeGreaterThan(40);
      const words = p.prompt.split(/\s+/).length;
      expect(words, `${p.key} prompt is ${words} words, outside the 15–40 band`).toBeGreaterThanOrEqual(15);
      expect(words, `${p.key} prompt is ${words} words, outside the 15–40 band`).toBeLessThanOrEqual(40);
    }
    // The house style is prepended at generation; a prompt that repeats it doubles it.
    const HOUSE_FRAGMENTS = ["Gritty dieselpunk", "1930s industrial", "muted olive-rust-umber", "Foxhole and Iron Harvest"];
    for (const f of HOUSE_FRAGMENTS) expect(laneFPlateBlock, `a Lane F prompt repeats HOUSE_STYLE ("${f}")`).not.toContain(f);
  });

  it("every registered plate resolves in IMAGE_LIBRARY with the source's own category and aspect", () => {
    const byKey = Object.fromEntries(IMAGE_LIBRARY.map((p) => [p.key, p]));
    for (const p of laneFPlates) {
      expect(byKey[p.key], `${p.key} does not resolve`).toBeTruthy();
      expect(byKey[p.key].category, `${p.key} category`).toBe(p.category);
      expect(byKey[p.key].aspect, `${p.key} aspect`).toBe(p.aspect);
    }
  });
});

describe("plates — §11.9 Plate Register, recomputed", () => {
  const rows = table(AUDIT, "Plate key", "Category");

  it("lists exactly the plates in the Lane F block, in both directions", () => {
    expect(rows.map((r) => bare(r[0])).sort()).toEqual(laneFPlates.map((p) => p.key).sort());
  });

  it("republishes each plate's category, aspect and title unchanged", () => {
    const byKey = Object.fromEntries(laneFPlates.map((p) => [p.key, p]));
    for (const r of rows) {
      const p = byKey[bare(r[0])];
      expect(bare(r[1]), `${p.key} category`).toBe(p.category);
      expect(bare(r[2]), `${p.key} aspect`).toBe(p.aspect);
      expect(bare(r[3]), `${p.key} subject`).toBe(p.title);
    }
  });

  it("rules on every pre-existing unit_* sketch plate the register claims to cover", () => {
    const dupes = table(AUDIT, "Older key", "Canonical key");
    expect(dupes.length, "the duplicate ruling table").toBe(6);
    const libKeys = new Set(IMAGE_LIBRARY.map((p) => p.key));
    const laneFKeys = new Set(laneFPlates.map((p) => p.key));
    for (const [older, canonical] of dupes) {
      expect(libKeys, `${bare(older)} is claimed as pre-existing but does not exist`).toContain(bare(older));
      expect(laneFKeys, `${bare(older)} is claimed as pre-existing but Lane F registered it`).not.toContain(bare(older));
      const c = bare(canonical);
      if (c.startsWith("unit_")) {
        expect(laneFKeys, `the canonical key ${c} is not one of Lane F's`).toContain(c);
      } else {
        // The one row that rules "not a duplicate" must say so, and the subject
        // it is distinguished from must actually be a live PROPOSED_UNIT_TYPES row.
        expect(canonical, "a non-canonical ruling must name no replacement key").toContain("none");
        expect(Object.keys(PROPOSED_UNIT_TYPES), "the not-a-duplicate ruling names no live macro row")
          .toContain(bare(older).replace(/^unit_/, ""));
      }
    }
  });

  it("states the aspect divergence against counts recomputed from the library", () => {
    const before = librarySrc.slice(0, librarySrc.indexOf(LANE_F_PLATE_BANNER));
    const legacyActions = [...before.matchAll(/P\("unit_[a-z_0-9]+_action",[\s\S]{0,400}?\)/g)].filter((m) => /"4:3"/.test(m[0]));
    const legacyDesigns = [...before.matchAll(/P\("design_[a-z_0-9]+",[\s\S]{0,400}?\)/g)].filter((m) => /"4:3"/.test(m[0]));
    const WORD = { 5: "five", 11: "eleven" };
    expect(AUDIT, `the register claims a legacy 4:3 action-plate count that is not ${legacyActions.length}`)
      .toContain(`all ${WORD[legacyActions.length] || legacyActions.length} pre-existing\n\`unit_*_action\` plates`);
    expect(AUDIT, `the register claims a legacy 4:3 design-card count that is not ${legacyDesigns.length}`)
      .toContain(`${WORD[legacyDesigns.length] || legacyDesigns.length} pre-existing \`design_*\` cards`);
    // The lane took the brief's aspects; the divergence is reported, not decided.
    expect(new Set(laneFPlates.map((p) => p.aspect))).toEqual(new Set(["1:1", "16:9"]));
  });

  it("does not assert that a plate url stays null — a delivered plate is the success case", () => {
    expect(AUDIT).toContain("a delivered plate is the success case");
    // And the lane genuinely ships no visual: no P(...) call passes a url, and
    // nothing in the block writes to the delivery table. Reading imagePlates.js
    // for the ABSENCE of these keys would be the same defect in mirror image —
    // the platform's job is to put them there.
    expect(laneFPlateBlock, "a Lane F P(...) call passes a url").not.toMatch(/\burl\s*:/);
    expect(laneFPlateBlock, "the Lane F block writes to PLATE_URLS").not.toMatch(/PLATE_URLS\s*\[/);
  });

  it("declares that all seven proposed macro classes already have a plate, and they do", () => {
    const libKeys = new Set(IMAGE_LIBRARY.map((p) => p.key));
    for (const k of Object.keys(PROPOSED_UNIT_TYPES)) {
      expect(libKeys, `PROPOSED_UNIT_TYPES.${k} has no plate`).toContain(`unit_${k}`);
      expect(AUDIT, `the register does not account for unit_${k}`).toContain(`unit_${k}`);
    }
  });
});

describe("codex — the Lane F block in src/lib/wiki/entries.js", () => {
  it("carries at least one entry per new squad type, keyed by the type's own key", () => {
    expect(laneFCodexBlock.length).toBeGreaterThanOrEqual(11);
    const ids = new Set(laneFCodexBlock.map((e) => e.id));
    for (const k of NEW_TYPES) expect(ids, `no Codex entry for ${k}`).toContain(`squad-${k.replace(/_/g, "-")}`);
  });

  it("leaves every id unique and every see target live, across the WHOLE array", () => {
    const ids = ENTRIES.map((e) => e.id);
    expect([...new Set(ids.filter((k, i) => ids.indexOf(k) !== i))], "duplicate Codex ids").toEqual([]);
    const live = new Set(ids);
    for (const e of ENTRIES) {
      expect(Array.isArray(e.see) && e.see.length > 0, `${e.id} has no see links`).toBe(true);
      for (const t of e.see) expect(live, `${e.id} sees missing entry ${t}`).toContain(t);
    }
  });

  it("is cited back by something, so no Lane F entry is an orphan in the Archive", () => {
    const cited = new Set(ENTRIES.flatMap((e) => e.see || []));
    for (const e of laneFCodexBlock) expect(cited, `${e.id} is linked from nowhere`).toContain(e.id);
  });

  it("marks the five companies GEAR_LIBRARY §8 already names canon, and everything it invents thin", () => {
    const gear8 = section(gearSrc, "## 8. Infantry");
    for (const k of NEW_TYPES) {
      const e = ENTRIES.find((x) => x.id === `squad-${k.replace(/_/g, "-")}`);
      // "Named by §8" is read out of §8 itself, not from a list retyped here.
      const named = new RegExp(`\\*\\*${SQUAD_TYPES[k].label}\\*\\*`).test(gear8);
      expect(e.status, `${k} is ${named ? "named" : "not named"} in §8`).toBe(named ? "canon" : "thin");
      expect(e.tag, `${k} citation`).toBe(named ? "Gear Library §8" : "Gear Library §11");
      expect(e.category, `${k} category`).toBe("war");
    }
  });

  it("quotes no stat and no section number in its prose", () => {
    for (const e of laneFCodexBlock) {
      const prose = [e.title, e.folk || "", e.summary,
        ...e.blocks.map((b) => b.p || b.lead || b.note || b.h || (b.list || []).join(" ") || "")].join(" ");
      const digits = prose.match(/\d/g) || [];
      expect(digits, `${e.id} quotes a number in prose — the tables are the only place a stat is written`).toEqual([]);
    }
  });
});

describe("game rules — the [PROPOSED] section, recomputed", () => {
  it("is marked [PROPOSED — awaiting platform wiring] and is the last section in the file", () => {
    expect(RULES.split("\n")[0]).toContain("[PROPOSED — awaiting platform wiring]");
    expect(RULES).toContain("Every number in this section is read from `base44/shared/tactical.ts`");
  });

  it("republishes the whole squad roster — every key, and no key that is not one", () => {
    const rows = table(RULES, "`key`", "Label", "`from`", "Figures");
    expect(rows.map((r) => bare(r[0])).sort()).toEqual(Object.keys(SQUAD_TYPES).sort());
    for (const r of rows) {
      const t = SQUAD_TYPES[bare(r[0])];
      expect(bare(r[1]), `${t.key} label`).toBe(t.label);
      expect(bare(r[2]), `${t.key} from`).toBe(t.from);
      expect(bare(r[3]), `${t.key} tier`).toBe(t.tier);
      expect(Number(bare(r[4])), `${t.key} figures`).toBe(t.figures);
      expect(Number(bare(r[5])), `${t.key} pts`).toBe(t.pts);
    }
  });

  it("states the single-figure rule as a claim the table actually supports", () => {
    const single = Object.values(SQUAD_TYPES).filter((t) => t.figures === 1).map((t) => t.from);
    expect(new Set(single), "a riflemen-derived row fields at one figure").toEqual(new Set(["crawler", "artillery", "fighter"]));
    const many = Object.values(SQUAD_TYPES).filter((t) => t.from === "riflemen");
    expect(many.every((t) => t.figures > 1), "a riflemen-derived row fields at one figure").toBe(true);
  });

  it("republishes every specialist with its pts and its mods", () => {
    const rows = table(RULES, "`key`", "Label", "`pts`", "Mods");
    expect(rows.map((r) => bare(r[0])).sort()).toEqual(Object.keys(SPECIALISTS).sort());
    for (const r of rows) {
      const sp = SPECIALISTS[bare(r[0])];
      expect(bare(r[1]), `${sp.key} label`).toBe(sp.label);
      expect(Number(bare(r[2])), `${sp.key} pts`).toBe(sp.pts);
      const printed = bare(r[3]).split(",").map((x) => x.trim()).sort();
      const actual = Object.entries(sp.mods).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).sort();
      expect(printed, `${sp.key} mods`).toEqual(actual);
    }
  });

  it("republishes every kit with its tier, pts, mods and appliesTo", () => {
    const rows = table(RULES, "`key`", "Label", "Tier", "`pts`", "`appliesTo`");
    expect(rows.map((r) => bare(r[0])).sort()).toEqual(Object.keys(UPGRADES).sort());
    for (const r of rows) {
      const u = UPGRADES[bare(r[0])];
      expect(bare(r[1]), `${u.key} label`).toBe(u.label);
      expect(bare(r[2]), `${u.key} tier`).toBe(u.tier);
      expect(Number(bare(r[3])), `${u.key} pts`).toBe(u.pts);
      const printed = bare(r[4]).split(",").map((x) => x.trim()).sort();
      const actual = Object.entries(u.mods).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).sort();
      expect(printed, `${u.key} mods`).toEqual(actual);
      expect(keysOf(r[5]), `${u.key} appliesTo`).toEqual(u.appliesTo);
    }
  });

  it("references the kit ceiling as a constant and never retypes the digit", () => {
    expect(RULES).toContain("`UPGRADE_RULES.maxPerSquad` kits");
    expect(RULES).toContain("`SCALING.maxSpecialists`");
    // Drift guard 7: the ceiling's VALUE must appear nowhere in the ceiling's own prose.
    const sentence = RULES.split("\n").filter((l) => l.includes("maxPerSquad")).join(" ");
    expect(sentence.includes(String(UPGRADE_RULES.maxPerSquad)),
      "the ceiling's digit is retyped beside the constant").toBe(false);
  });

  it("hard-codes its own section number nowhere a renumber would break", () => {
    const n = RULES.match(/^## (\d+)\./)[1];
    // This suite finds the section by heading text. Nothing in the lane's OWN
    // blocks may pin the number: a renumber at merge is one edit, here. Scoped
    // to Lane F's blocks and not to the whole shared file — a later lane's
    // content is not this gate's to report on.
    for (const src of [laneFPlateBlock, laneFCodexSrc])
      expect(src, `a Lane F block pins GAME_RULES §${n}`).not.toContain(`GAME_RULES.md §${n}`);
    expect(RULES.slice(RULES.indexOf("\n")), "the section body restates its own number").not.toContain(`§${n}`);
  });
});
