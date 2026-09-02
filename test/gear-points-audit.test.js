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

const tacticalSrc = readRepoFile("base44/shared/tactical.ts");
const SQUAD_TYPES = extractConst(tacticalSrc, "SQUAD_TYPES");
const SPECIALISTS = extractConst(tacticalSrc, "SPECIALISTS");
const UPGRADES = extractConst(tacticalSrc, "UPGRADES");
const UPGRADE_RULES = extractConst(tacticalSrc, "UPGRADE_RULES");
const POINTS_MODEL = extractConst(tacticalSrc, "POINTS_MODEL");
const SCALING = extractConst(tacticalSrc, "SCALING");

const gearSrc = readRepoFile("docs/GEAR_LIBRARY.md");
const rosterSrc = readRepoFile("docs/FACTION_ROSTER.md");

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
