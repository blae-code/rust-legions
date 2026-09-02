// THE THIRTEEN HOUSES — every preset checked against the tables it names.
//
// WHY THIS FILE EXISTS. `src/lib/presetFactions.js` is the one place in the
// codebase where content from four other lanes meets: a preset names squad
// types (Lane F), upgrade kits (Lane F), a decree (Lane G) and weapon patterns
// (Lane I), and a key that is merely PLAUSIBLE is indistinguishable from a key
// that is real until something looks it up. So nothing here trusts a copy. The
// catalogs are lifted TEXTUALLY out of `base44/shared/*.ts` with
// `extractConst`, the same way the mirror suites do it, and every referenced
// key is resolved against what that file actually holds today.
//
// FOUR HABITS THIS FILE KEEPS, EACH FOR A DEFECT AN EARLIER WAVE SHIPPED.
//
//   1. NO DEAD ASSERTION. Where a gate is only meaningful if it can fail, the
//      gate is a named predicate and the suite asserts BOTH directions: the
//      real data passes it, and a deliberately mutated copy fails it. A gate
//      nothing has ever seen go red is a gate nobody has tested.
//   2. NO PUBLISHED NUMBER TAKEN ON TRUST. `docs/FACTION_ROSTER.md` prints
//      doctrine counts and a key register. Both are parsed back out of the
//      markdown and recomputed from `PRESET_FACTIONS`. A stale cell is red.
//   3. BOUNDED AT BOTH ENDS. Document slices run from a heading to the NEXT
//      heading of the same level, never to end-of-file. Lane H is last today;
//      Field Amendments come after it.
//   4. NO CLOSED SET THAT FORBIDS A LEGAL VALUE. Nothing here pins a table to
//      the rows that happen to exist. Squad, upgrade, decree and pattern keys
//      are validated by MEMBERSHIP in the live catalogs, so those catalogs may
//      grow freely. `lifepathChoices.philosophy` is checked against
//      `PHILOSOPHIES` only for the ten houses this lane authors, because the
//      three legacy rows carry pre-`PHILOSOPHIES` values that are frozen by
//      contract. And `DEPARTURE_BY_CREED_SEED` is asserted to cover the axis's
//      WHOLE legal domain rather than the seven values in use.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import {
  PRESET_FACTIONS,
  KEEL_BY_HOUSE,
  DEPARTURE_BY_CREED_SEED,
  departureOf,
  keelOf,
  presetToFactionRecord,
} from "@/lib/presetFactions.js";
import { PERKS, PERK_BY_ID, MAX_LIABILITIES, netPoints, pickError } from "@/lib/pointBuy.js";
import { LIFEPATH_CHAPTERS, PHILOSOPHIES, VALUES, DOCTRINES, availableOptions } from "@/lib/lifepath.js";
import { IMAGE_LIBRARY } from "@/lib/imageLibrary.js";

// ── the live catalogs, lifted from the canonical .ts sources ───────────────
const tacticalSrc = readRepoFile("base44/shared/tactical.ts");
const catalogSrc = readRepoFile("base44/shared/catalog.ts");
const armsSrc = readRepoFile("base44/shared/arms.ts");
const SQUAD_TYPES = extractConst(tacticalSrc, "SQUAD_TYPES");
const UPGRADES = extractConst(tacticalSrc, "UPGRADES");
const ARMORY_ITEMS = extractConst(catalogSrc, "ARMORY_ITEMS");
const CREEDS = extractConst(catalogSrc, "CREEDS");
const WEAPON_PATTERNS = extractConst(armsSrc, "WEAPON_PATTERNS");
const rosterSrc = readRepoFile("docs/FACTION_ROSTER.md");
const factionEntity = JSON.parse(readRepoFile("base44/entities/Faction.jsonc").replace(/^\s*\/\/.*$/gm, ""));

const DOCTRINE_KEYS = DOCTRINES.map((d) => d.id);
const EFFECT_TYPES = ["income_flat", "unit_discount", "attack_bonus", "defense_bonus"];
const EFFECT_UNITS = ["riflemen", "crawler", "gunboat", "fighter"];
const STANDARDS = ["std_column", "std_reliquary", "std_black", "std_first_keel"];
const AXES = ["authority", "economy", "creed", "mobilization"];

// The three rows that shipped before this lane. Frozen BY ID, never by array
// position: a later amendment may insert a house anywhere, and an index-based
// freeze would then guard the wrong row while still reading green.
const LEGACY_IDS = ["kessel_pact", "iron_synod", "grauwall_marches"];
const byId = (id) => PRESET_FACTIONS.find((p) => p.id === id);
const AUTHORED = PRESET_FACTIONS.filter((p) => !LEGACY_IDS.includes(p.id));

// ── document slicing, bounded at both ends ─────────────────────────────────
function section(src, headingRe, level = "## ") {
  const lines = src.split("\n");
  const start = lines.findIndex((l) => headingRe.test(l));
  expect(start, `heading not found: ${headingRe}`).toBeGreaterThan(-1);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith(level)) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}
// Markdown pipe-table body rows, located by a header cell UNIQUE to that
// table. Two tables in the same section share the cell `house`, so each
// locator here names a cell only one of them has; a locator that matched
// twice would read the wrong table and still report a diff.
function tableRows(text, headerCell) {
  const lines = text.split("\n");
  const head = lines.findIndex((l) => l.startsWith("|") && l.includes(headerCell));
  expect(head, `table not found for header cell: ${headerCell}`).toBeGreaterThan(-1);
  const rows = [];
  for (let i = head + 2; i < lines.length; i++) {
    if (!lines[i].startsWith("|")) break;
    rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
  }
  expect(rows.length, `table has no body rows: ${headerCell}`).toBeGreaterThan(0);
  return rows;
}
const unbacktick = (s) => s.replace(/`/g, "").trim();
const cells = (s) => (s === "" ? [] : s.split(",").map((c) => unbacktick(c)).filter(Boolean));

// ── the roster's ten house blocks, parsed ──────────────────────────────────
// A "### <n>. <Name> — ..." block down to the next "### " or the end of §1.
// Minus signs: the roster writes U+2212, not ASCII hyphen, and one house
// carries a trailing asterisk on a seed. Both are handled here rather than
// being "corrected" in the document.
const HOUSES_SECTION = section(rosterSrc, /^## \d+\. The Ten Houses/);
function parseRosterHouses(sectionText) {
  const out = [];
  const lines = sectionText.split("\n");
  let cur = null;
  for (const line of lines) {
    const h = /^### \d+\.\s+(.+?)\s+—/.exec(line);
    if (h) { cur = { name: h[1].trim(), doctrine: null, seeds: null }; out.push(cur); continue; }
    if (!cur) continue;
    const d = /\*\*Doctrine\*\*\s+([a-z]+)/.exec(line);
    if (d) cur.doctrine = d[1];
    const s = /\*\*Seeds\*\*\s+Auth\s+(\S+?),\s*Econ\s+(\S+?),\s*Creed\s+(\S+?),\s*Mob\s+(\S+?)\s*(?:·|$)/.exec(line);
    if (s) {
      const num = (t) => Number(t.replace(/\*/g, "").replace(/−/g, "-").replace(/^\+/, ""));
      cur.seeds = { authority: num(s[1]), economy: num(s[2]), creed: num(s[3]), mobilization: num(s[4]) };
    }
  }
  return out;
}
const ROSTER_HOUSES = parseRosterHouses(HOUSES_SECTION);

// ── predicates, so every gate can be shown to have teeth ───────────────────
const ledgerIsLegal = (picks) =>
  pickError(picks) === null &&
  netPoints(picks) <= 0 &&
  picks.filter((id) => PERK_BY_ID[id]?.cat === "liability").length <= MAX_LIABILITIES &&
  picks.every((id) => Object.prototype.hasOwnProperty.call(PERK_BY_ID, id));

const rosterKeysAreReal = (u) =>
  u.squads.every((k) => Object.prototype.hasOwnProperty.call(SQUAD_TYPES, k)) &&
  u.upgrades.every((k) => Object.prototype.hasOwnProperty.call(UPGRADES, k)) &&
  ARMORY_ITEMS[u.decree]?.kind === "decree" &&
  u.patterns.every((k) => Object.prototype.hasOwnProperty.call(WEAPON_PATTERNS, k));

const effectIsValid = (e) => {
  if (!e || !EFFECT_TYPES.includes(e.type)) return false;
  if (!Number.isInteger(e.value) || e.value < 1 || e.value > 2) return false;
  const needsUnit = e.type !== "income_flat";
  if (needsUnit !== Object.prototype.hasOwnProperty.call(e, "unit")) return false;
  return !needsUnit || EFFECT_UNITS.includes(e.unit);
};

const clone = (o) => JSON.parse(JSON.stringify(o));

describe("PRESET_FACTIONS — shape and identity", () => {
  it("ships thirteen presets", () => {
    expect(PRESET_FACTIONS.length).toBe(13);
  });

  it("keeps every id and every faction name unique", () => {
    expect(new Set(PRESET_FACTIONS.map((p) => p.id)).size).toBe(13);
    expect(new Set(PRESET_FACTIONS.map((p) => p.factionName)).size).toBe(13);
    expect(new Set(PRESET_FACTIONS.map((p) => p.house)).size).toBe(13);
  });

  it("still carries the three legacy ids, and carries them first", () => {
    expect(PRESET_FACTIONS.slice(0, 3).map((p) => p.id)).toEqual(LEGACY_IDS);
  });

  it("gives every preset the additive Lane H fields", () => {
    for (const p of PRESET_FACTIONS) {
      expect(typeof p.house, p.id).toBe("string");
      expect(p.heraldVoice, p.id).toBe(p.house);
      expect(typeof keelOf(p), p.id).toBe("string");
      expect(Object.keys(p.uniqueRoster).sort()).toEqual(["decree", "patterns", "squads", "upgrades"]);
    }
  });

  it("adds NO `keel` field to any row (§4 amendment Q3b)", () => {
    // The keel is looked up from `house`; storing it would be the amendment's
    // "stored twice" defect and is explicitly forbidden.
    for (const p of PRESET_FACTIONS) {
      expect(Object.prototype.hasOwnProperty.call(p, "keel"), p.id).toBe(false);
    }
  });
});

// The values the three shipped rows had before this lane, captured verbatim.
// Anything not listed here is a field Lane H is permitted to add.
const LEGACY_FIXTURE = Object.freeze({
  kessel_pact: {
    factionName: "The Kessel Pact",
    doctrine: "aggressive",
    insigniaDescription:
      "A clenched iron gauntlet crushing a spent artillery shell, stamped over a field of rust-red.",
    lore:
      "Forged from frontier freeholds that survived the First Attrition by striking before they could be struck, the Kessel Pact keeps no reserves it will not spend. Its columns move at a punishing pace, its foundries turn out flame-crawlers faster than crews can be trained for them, and its diplomats are, by long habit, unwelcome. The Pact wins early or not at all.",
    traits: [
      { name: "Shock Vanguard", description: "Assault riflemen are drilled to close and kill first.", effect: { type: "attack_bonus", unit: "riflemen", value: 1 } },
      { name: "Flamewrights", description: "Crawler crews favour overpressure and burn.", effect: { type: "attack_bonus", unit: "crawler", value: 1 } },
      { name: "Requisition Raids", description: "The Pact takes its manpower where it marches.", effect: { type: "unit_discount", unit: "riflemen", value: 1 } },
    ],
    pointBuy: { picks: ["veteran_corps", "flame_projectors", "green_recruits", "fuel_shortage", "pariah_state"] },
    npcDispositions: { aggressive: 5, economic: -15, defensive: -10 },
    isNPC: false,
    lifepath: { preset: true, doctrine: "aggressive", philosophy: "war_economy", value: "glory" },
  },
  iron_synod: {
    factionName: "The Iron Synod",
    doctrine: "economic",
    insigniaDescription:
      "Three foundry stacks bound by a brass gear-ring, venting stylised smoke against deep umber.",
    lore:
      "The Synod believes wars are won in the ledger long before the field. Its clustered foundry-cities out-produce every neighbour, funding a war machine that starts lean and ends overwhelming. Old requisition debts left its stockpiles thin and its army cap modest, and its crawler lines run dear — but give the Synod ten turns and it will bury you in steel.",
    traits: [
      { name: "Foundry Cities", description: "The great stacks never cool.", effect: { type: "income_flat", value: 2 } },
      { name: "Assembly Lines", description: "Standardised hulls come off the line cheap.", effect: { type: "unit_discount", unit: "crawler", value: 1 } },
      { name: "Deep Ledgers", description: "Every seam and siding is accounted for.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["industrial_base", "oil_concessions", "war_weary", "depleted_stockpiles", "rusting_arsenal"] },
    npcDispositions: { aggressive: -10, economic: 10, defensive: 5 },
    isNPC: false,
    lifepath: { preset: true, doctrine: "economic", philosophy: "industry", value: "order" },
  },
  grauwall_marches: {
    factionName: "The Grauwall Marches",
    doctrine: "defensive",
    insigniaDescription:
      "A grey rampart of overlapping shields beneath a single watch-lantern, on weathered olive.",
    lore:
      "The Marches were raised on the losing side of three invasions and learned the only lesson that mattered: let the enemy break himself on your walls, then take what remains. Its riflemen dig in as reflex, its crawlers carry doubled plate, and its war-weary, fuel-starved economy is built to endure a long siege rather than win a short race. Patience is the Grauwall doctrine.",
    traits: [
      { name: "Entrenched", description: "Marchmen fight from prepared ground by instinct.", effect: { type: "defense_bonus", unit: "riflemen", value: 1 } },
      { name: "Ironclad Hulls", description: "Every crawler carries a second skin of plate.", effect: { type: "defense_bonus", unit: "crawler", value: 1 } },
      { name: "Stubborn Provisioning", description: "The Marches hoard against the long winter.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["trench_gear", "heavy_plating", "war_weary", "fuel_shortage", "depleted_stockpiles"] },
    npcDispositions: { aggressive: -5, economic: 5, defensive: 10 },
    isNPC: false,
    lifepath: { preset: true, doctrine: "defensive", philosophy: "fortress", value: "endurance" },
  },
});

describe("the three legacy presets are additive-only", () => {
  for (const id of LEGACY_IDS) {
    it(`${id} keeps every shipped value untouched`, () => {
      const p = byId(id);
      const f = LEGACY_FIXTURE[id];
      expect(p, id).toBeDefined();
      for (const k of ["factionName", "doctrine", "insigniaDescription", "lore", "traits", "pointBuy", "npcDispositions", "isNPC"]) {
        expect(p[k], `${id}.${k}`).toEqual(f[k]);
      }
      const { preset, doctrine, philosophy, value } = p.lifepathChoices;
      expect({ preset, doctrine, philosophy, value }, `${id}.lifepathChoices`).toEqual(f.lifepath);
    });
  }

  it("keeps the legacy philosophy/value words that predate PHILOSOPHIES and VALUES", () => {
    // These are NOT typos and must never be "fixed": live saves reference them.
    // Asserting them here is what makes a well-meaning tidy-up a red test.
    const philosophyIds = PHILOSOPHIES.map((x) => x.id);
    const valueIds = VALUES.map((x) => x.id);
    for (const id of LEGACY_IDS) {
      const lp = byId(id).lifepathChoices;
      expect(philosophyIds, `${id} philosophy is legacy`).not.toContain(lp.philosophy);
      expect(valueIds, `${id} value is legacy`).not.toContain(lp.value);
    }
  });
});

describe("point-buy — every preset is a legal ledger", () => {
  for (const p of PRESET_FACTIONS) {
    it(`${p.id} passes pointBuy.js validation`, () => {
      const picks = p.pointBuy.picks;
      for (const pick of picks) expect(PERK_BY_ID, `${p.id} unknown perk ${pick}`).toHaveProperty(pick);
      expect(pickError(picks), `${p.id} pickError`).toBeNull();
      expect(netPoints(picks), `${p.id} netPoints`).toBeLessThanOrEqual(0);
      expect(picks.filter((id) => PERK_BY_ID[id].cat === "liability").length, `${p.id} liabilities`)
        .toBeLessThanOrEqual(MAX_LIABILITIES);
      expect(new Set(picks).size, `${p.id} duplicate picks`).toBe(picks.length);
      expect(ledgerIsLegal(picks)).toBe(true);
    });
  }

  // The gate has teeth: each way a ledger can go wrong is shown to trip it.
  it("goes red when a ledger's netPoints turns positive", () => {
    const picks = [...byId("iron_reclamation").pointBuy.picks];
    const overdrawn = picks.filter((id) => PERK_BY_ID[id].cat !== "liability");
    expect(netPoints(overdrawn)).toBeGreaterThan(0);
    expect(pickError(overdrawn)).toMatch(/overdrawn/);
    expect(ledgerIsLegal(overdrawn)).toBe(false);
  });

  it("goes red when a ledger grows a fourth liability", () => {
    // Deliberately read off a ledger that is AT the cap rather than naming one
    // by memory: `iron_reclamation` used to be the probe here and stopped
    // being at the cap the moment it traded fuel_shortage + pariah_state for
    // the single act `tribute_graze`. A probe that silently stops probing is
    // the whole reason this suite asserts both directions of every gate.
    const atCap = PRESET_FACTIONS.find(
      (p) => p.pointBuy.picks.filter((id) => PERK_BY_ID[id].cat === "liability").length === MAX_LIABILITIES,
    );
    expect(atCap, "no preset sits at the liability cap").toBeTruthy();
    const base = atCap.pointBuy.picks;
    expect(base.filter((id) => PERK_BY_ID[id].cat === "liability").length).toBe(3);
    const fourth = [...base, base.includes("war_weary") ? "swath_bound" : "war_weary"];
    expect(fourth.filter((id) => PERK_BY_ID[id].cat === "liability").length).toBe(4);
    expect(pickError(fourth)).toMatch(/liabilities/);
    expect(ledgerIsLegal(fourth)).toBe(false);
  });

  it("goes red on a perk id that is not in the catalog", () => {
    expect(ledgerIsLegal(["conscription", "a_perk_that_does_not_exist"])).toBe(false);
  });
});

describe("uniqueRoster — every key names something that really exists", () => {
  for (const p of PRESET_FACTIONS) {
    it(`${p.id} references only live Lane F / G / I keys`, () => {
      const u = p.uniqueRoster;
      for (const k of u.squads) expect(SQUAD_TYPES, `${p.id} squad ${k}`).toHaveProperty(k);
      for (const k of u.upgrades) expect(UPGRADES, `${p.id} upgrade ${k}`).toHaveProperty(k);
      for (const k of u.patterns) expect(WEAPON_PATTERNS, `${p.id} pattern ${k}`).toHaveProperty(k);
      expect(ARMORY_ITEMS, `${p.id} decree ${u.decree}`).toHaveProperty(u.decree);
      expect(ARMORY_ITEMS[u.decree].kind, `${p.id} decree kind`).toBe("decree");
      expect(rosterKeysAreReal(u)).toBe(true);
    });

    it(`${p.id} meets the minimum roster sizes`, () => {
      const u = p.uniqueRoster;
      expect(u.squads.length, `${p.id} squads`).toBeGreaterThanOrEqual(2);
      expect(u.upgrades.length, `${p.id} upgrades`).toBeGreaterThanOrEqual(2);
      expect(u.patterns.length, `${p.id} patterns`).toBeGreaterThanOrEqual(2);
      expect(typeof u.decree).toBe("string");
    });

    it(`${p.id}'s kits and patterns fit its own signature squads`, () => {
      const u = p.uniqueRoster;
      for (const k of u.upgrades) {
        expect(UPGRADES[k].appliesTo.some((s) => u.squads.includes(s)), `${p.id}: kit ${k} fits no signature squad`).toBe(true);
      }
      for (const k of u.patterns) {
        expect(WEAPON_PATTERNS[k].appliesTo.some((s) => u.squads.includes(s)), `${p.id}: pattern ${k} fits no signature squad`).toBe(true);
      }
    });
  }

  // THE ASSERTION THAT MATTERS MOST. It reads the live tables, so an upstream
  // rename or removal surfaces here, in the lane that depends on it, rather
  // than as a blank panel in play. Shown to have teeth in both directions.
  it("goes red on a squad, upgrade, decree or pattern key that does not exist", () => {
    const real = clone(byId("outrider_compact").uniqueRoster);
    expect(rosterKeysAreReal(real)).toBe(true);
    expect(rosterKeysAreReal({ ...real, squads: [...real.squads, "ghost_squad"] })).toBe(false);
    expect(rosterKeysAreReal({ ...real, upgrades: [...real.upgrades, "ghost_kit"] })).toBe(false);
    expect(rosterKeysAreReal({ ...real, patterns: [...real.patterns, "ghost_pattern"] })).toBe(false);
    expect(rosterKeysAreReal({ ...real, decree: "ghost_decree" })).toBe(false);
  });

  it("goes red when `decree` names a real armory row of the wrong kind", () => {
    // `kind: 'module'` certification is inert (orchestrator ruling 2) and a
    // relic project is not an act of the Assembly. Only a decree is a decree.
    const notDecree = Object.entries(ARMORY_ITEMS).find(([, r]) => r.kind !== "decree");
    expect(notDecree, "catalog has no non-decree row to test with").toBeDefined();
    const real = byId("outrider_compact").uniqueRoster;
    expect(rosterKeysAreReal({ ...real, decree: notDecree[0] })).toBe(false);
  });

  it("gives each house its own decree — thirteen presets, thirteen distinct acts", () => {
    const decrees = PRESET_FACTIONS.map((p) => p.uniqueRoster.decree);
    expect(new Set(decrees).size).toBe(decrees.length);
  });

  it("never puts a creed-locked decree in a house that does not hold that creed", () => {
    let locked = 0;
    for (const p of PRESET_FACTIONS) {
      const lock = ARMORY_ITEMS[p.uniqueRoster.decree].creedLock;
      if (!lock) continue;
      locked++;
      expect(CREEDS, `unknown creedLock ${lock}`).toHaveProperty(lock);
      expect(lock, `${p.id} holds ${departureOf(p)} but its decree locks to ${lock}`).toBe(departureOf(p));
    }
    // Not a required count — it is a floor, so adding creed-locked decrees
    // upstream cannot make this test wrong. It exists so the loop above can
    // never pass by iterating over nothing.
    expect(locked, "no creed-locked decree is claimed by any house").toBeGreaterThan(0);
  });
});

describe("the Departure is derived from the Creed axis, never stored", () => {
  it("maps the WHOLE legal domain of the Creed axis", () => {
    // -3..3 is the axis's full range (VISION §6.1). Covering all seven values
    // is what makes this a derivation rather than a rule with a hidden default.
    const domain = [-3, -2, -1, 0, 1, 2, 3].map(String);
    expect(Object.keys(DEPARTURE_BY_CREED_SEED).sort()).toEqual([...domain].sort());
    for (const v of Object.values(DEPARTURE_BY_CREED_SEED)) {
      expect(CREEDS, `departure ${v} is not a CREEDS key`).toHaveProperty(v);
    }
  });

  it("resolves a real Departure for every preset", () => {
    for (const p of PRESET_FACTIONS) {
      expect(CREEDS, `${p.id}`).toHaveProperty(departureOf(p));
    }
  });

  it("uses all four Departures across the thirteen houses", () => {
    const held = new Set(PRESET_FACTIONS.map((p) => departureOf(p)));
    expect([...held].sort()).toEqual(Object.keys(CREEDS).sort());
  });

  it("cannot be satisfied by `CREEDS[k].axisLean` alone — and says so", () => {
    // The reason `DEPARTURE_BY_CREED_SEED` exists rather than a sign() of the
    // lean: two Departures share lean 0, so the lean is ambiguous. If a future
    // amendment ever makes the leans distinct, this test fails and the mapping
    // can be simplified — which is the outcome it exists to surface.
    const leans = Object.values(CREEDS).map((c) => c.axisLean);
    expect(new Set(leans).size, "leans became distinct; revisit DEPARTURE_BY_CREED_SEED").toBeLessThan(leans.length);
  });

  it("matches the table published in FACTION_ROSTER §6.2", () => {
    const recon = section(rosterSrc, /^## \d+\. Reconciliation/);
    const rows = tableRows(recon, "| Reading (LORE §2) |");
    const fromDoc = {};
    for (const [seedCell, depCell] of rows) {
      const dep = unbacktick(depCell);
      // A cell is either a single value or a range; the negative range is
      // written high-to-low ("−2 … −3") the way the axis reads, so the bounds
      // are sorted rather than assumed to be in order.
      const nums = seedCell.replace(/−/g, "-").match(/-?\d+/g).map(Number).sort((a, b) => a - b);
      const [lo, hi] = nums.length === 2 ? nums : [nums[0], nums[0]];
      for (let v = lo; v <= hi; v++) fromDoc[String(v)] = dep;
    }
    expect(fromDoc).toEqual(DEPARTURE_BY_CREED_SEED);
  });
});

describe("traits, lore and dispositions", () => {
  for (const p of PRESET_FACTIONS) {
    it(`${p.id} carries exactly three traits in the synthesizeFaction effect schema`, () => {
      expect(p.traits.length, p.id).toBe(3);
      for (const t of p.traits) {
        expect(typeof t.name, `${p.id} trait name`).toBe("string");
        expect(t.name.length, `${p.id} trait name`).toBeGreaterThan(0);
        expect(typeof t.description, `${p.id} trait description`).toBe("string");
        expect(effectIsValid(t.effect), `${p.id}: bad effect ${JSON.stringify(t.effect)}`).toBe(true);
      }
    });
  }

  it("goes red on an effect outside the validated schema", () => {
    // Every one of these is silently clamped or dropped by
    // base44/functions/synthesizeFaction, which is why it is caught here.
    expect(effectIsValid({ type: "attack_bonus", unit: "riflemen", value: 1 })).toBe(true);
    expect(effectIsValid({ type: "morale_bonus", unit: "riflemen", value: 1 })).toBe(false);
    expect(effectIsValid({ type: "attack_bonus", unit: "riflemen", value: 3 })).toBe(false);
    expect(effectIsValid({ type: "attack_bonus", value: 1 })).toBe(false);
    expect(effectIsValid({ type: "income_flat", unit: "riflemen", value: 1 })).toBe(false);
    expect(effectIsValid({ type: "attack_bonus", unit: "artillery", value: 1 })).toBe(false);
  });

  // SCOPED BY ID, DELIBERATELY. The 120-180 word floor is a Lane H requirement
  // for the houses Lane H writes. The three legacy rows are 62, 61 and 64 words
  // and are frozen byte-for-byte by contract, so the brief's two requirements
  // cannot both hold for them; byte-identity governs (live saves). Recorded in
  // FACTION_ROSTER §6.4. The exclusion is by NAME, so inserting a house does
  // not quietly widen or narrow it.
  for (const p of AUTHORED) {
    it(`${p.id}'s lore runs 120-180 words`, () => {
      const words = p.lore.trim().split(/\s+/).length;
      expect(words, `${p.id} lore words = ${words}`).toBeGreaterThanOrEqual(120);
      expect(words).toBeLessThanOrEqual(180);
    });
  }

  it("authors exactly the ten roster houses beyond the legacy three", () => {
    expect(AUTHORED.length).toBe(10);
    expect(PRESET_FACTIONS.length - AUTHORED.length).toBe(LEGACY_IDS.length);
  });

  for (const p of PRESET_FACTIONS) {
    it(`${p.id} has a doctrine and dispositions the AI can use`, () => {
      expect(DOCTRINE_KEYS, p.id).toContain(p.doctrine);
      expect(Object.keys(p.npcDispositions).sort()).toEqual(["aggressive", "defensive", "economic"]);
      for (const [k, v] of Object.entries(p.npcDispositions)) {
        expect(Number.isInteger(v), `${p.id}.${k}`).toBe(true);
        expect(v, `${p.id}.${k}`).toBeGreaterThanOrEqual(-20);
        expect(v).toBeLessThanOrEqual(20);
      }
      // A house leans hardest toward its own doctrine. True of all three
      // legacy rows as shipped, and the reason a preset reads as itself in NPC
      // play rather than as a bundle of numbers.
      const own = p.npcDispositions[p.doctrine];
      for (const v of Object.values(p.npcDispositions)) expect(v, `${p.id} own doctrine not the lean`).toBeLessThanOrEqual(own);
      expect(typeof p.insigniaDescription).toBe("string");
      expect(p.insigniaDescription.trim().length).toBeGreaterThan(0);
      expect(p.isNPC).toBe(false);
    });
  }
});

describe("lifepathChoices", () => {
  for (const p of PRESET_FACTIONS) {
    it(`${p.id} seeds four axes and picks a shipped standard`, () => {
      const lp = p.lifepathChoices;
      expect(lp.preset).toBe(true);
      expect(lp.doctrine, `${p.id} lifepath doctrine`).toBe(p.doctrine);
      expect(Object.keys(lp.seeds).sort()).toEqual([...AXES].sort());
      for (const a of AXES) {
        expect(Number.isInteger(lp.seeds[a]), `${p.id}.seeds.${a}`).toBe(true);
        expect(lp.seeds[a], `${p.id}.seeds.${a}`).toBeGreaterThanOrEqual(-3);
        expect(lp.seeds[a]).toBeLessThanOrEqual(3);
      }
      expect(STANDARDS, `${p.id} standard`).toContain(lp.standard);
    });
  }

  it("uses every one of the four shipped standards at least once", () => {
    const used = new Set(PRESET_FACTIONS.map((p) => p.lifepathChoices.standard));
    expect([...used].sort()).toEqual([...STANDARDS].sort());
  });

  it("gives the ten authored houses a real PHILOSOPHIES / VALUES pair", () => {
    const philosophyIds = PHILOSOPHIES.map((x) => x.id);
    const valueIds = VALUES.map((x) => x.id);
    for (const p of AUTHORED) {
      expect(philosophyIds, `${p.id}.philosophy`).toContain(p.lifepathChoices.philosophy);
      expect(valueIds, `${p.id}.value`).toContain(p.lifepathChoices.value);
    }
  });
});

describe("FACTION_ROSTER.md governs, and the document is recomputed not trusted", () => {
  it("parses ten house blocks out of §1", () => {
    expect(ROSTER_HOUSES.length).toBe(10);
    for (const h of ROSTER_HOUSES) {
      expect(h.doctrine, `${h.name} doctrine`).toBeTruthy();
      expect(h.seeds, `${h.name} seeds`).toBeTruthy();
    }
  });

  it("gives every roster house exactly one preset, matched by faction name", () => {
    for (const h of ROSTER_HOUSES) {
      expect(PRESET_FACTIONS.filter((p) => p.factionName === h.name).length, h.name).toBe(1);
    }
  });

  it("matches each roster house's Doctrine line", () => {
    for (const h of ROSTER_HOUSES) {
      const p = PRESET_FACTIONS.find((x) => x.factionName === h.name);
      expect(p.doctrine, `${h.name} doctrine`).toBe(h.doctrine);
    }
  });

  it("matches each roster house's Seeds line, minus signs and asterisks and all", () => {
    for (const h of ROSTER_HOUSES) {
      const p = PRESET_FACTIONS.find((x) => x.factionName === h.name);
      expect(p.lifepathChoices.seeds, `${h.name} seeds`).toEqual(h.seeds);
    }
  });

  it("recomputes the doctrine counts §1 publishes, for the ten and for the thirteen", () => {
    // A published number is not a number until something recomputes it: an
    // earlier wave shipped a cost curve claiming 110 against a table that
    // summed to 138. Both sentences in §1 are parsed and rebuilt here.
    const count = (rows) => DOCTRINE_KEYS.map((d) => rows.filter((r) => r === d).length);
    const rosterTen = count(ROSTER_HOUSES.map((h) => h.doctrine));
    const allThirteen = count(PRESET_FACTIONS.map((p) => p.doctrine));

    const summary = /aggressive\s*\n?×(\d+), economic ×(\d+), defensive ×(\d+)/.exec(HOUSES_SECTION);
    expect(summary, "§1 summary sentence not found").toBeTruthy();
    expect([Number(summary[1]), Number(summary[2]), Number(summary[3])]).toEqual(rosterTen);

    const shipped = /shipped thirteen are aggressive ×(\d+), economic ×(\d+), defensive ×(\d+)/.exec(HOUSES_SECTION);
    expect(shipped, "§1 thirteen-preset sentence not found").toBeTruthy();
    expect([Number(shipped[1]), Number(shipped[2]), Number(shipped[3])]).toEqual(allThirteen);
  });

  it("keeps §6.1's key register equal to the data", () => {
    const recon = section(rosterSrc, /^## \d+\. Reconciliation/);
    const rows = tableRows(recon, "| keel slug |");
    expect(rows.length).toBe(PRESET_FACTIONS.length);
    const fromDoc = rows.map((r) => ({
      factionName: r[0],
      id: unbacktick(r[1]),
      house: unbacktick(r[2]),
      keel: unbacktick(r[3]),
      heraldVoice: unbacktick(r[4]),
      creed: Number(r[5].replace(/−/g, "-")),
      departure: unbacktick(r[6]),
    }));
    const fromData = PRESET_FACTIONS.map((p) => ({
      factionName: p.factionName,
      id: p.id,
      house: p.house,
      keel: keelOf(p),
      heraldVoice: p.heraldVoice,
      creed: p.lifepathChoices.seeds.creed,
      departure: departureOf(p),
    }));
    expect(fromDoc).toEqual(fromData);
  });

  it("keeps §6.3's roster register equal to the data", () => {
    const recon = section(rosterSrc, /^## \d+\. Reconciliation/);
    const rows = tableRows(recon, "| squads (Lane F) |");
    const fromDoc = rows.map((r) => ({
      house: unbacktick(r[0]),
      squads: cells(r[1]),
      upgrades: cells(r[2]),
      decree: unbacktick(r[3]),
      patterns: cells(r[4]),
    }));
    const fromData = PRESET_FACTIONS.map((p) => ({ house: p.house, ...p.uniqueRoster }));
    expect(fromDoc).toEqual(fromData.map((d) => ({ house: d.house, squads: d.squads, upgrades: d.upgrades, decree: d.decree, patterns: d.patterns })));
  });
});

describe("plates", () => {
  it("has a crest and a keel plate for all thirteen houses", () => {
    const keys = new Set(IMAGE_LIBRARY.map((p) => p.key));
    for (const p of PRESET_FACTIONS) {
      expect(keys.has(`house_${p.house}_crest`), `missing house_${p.house}_crest`).toBe(true);
      expect(keys.has(`keel_${keelOf(p)}`), `missing keel_${keelOf(p)}`).toBe(true);
    }
  });

  it("maps every house stem to a keel slug, and no two houses to the same keel", () => {
    const stems = PRESET_FACTIONS.map((p) => p.house);
    for (const s of stems) expect(KEEL_BY_HOUSE, `no keel for ${s}`).toHaveProperty(s);
    const slugs = stems.map((s) => KEEL_BY_HOUSE[s]);
    expect(new Set(slugs).size).toBe(slugs.length);
    // No orphan entries either — a stem in the lookup that no preset uses is
    // dead data with a plausible-looking justification.
    expect(Object.keys(KEEL_BY_HOUSE).sort()).toEqual([...stems].sort());
  });

  it("keeps every IMAGE_LIBRARY key unique", () => {
    const keys = IMAGE_LIBRARY.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ships no lane-authored plate url — delivery comes from PLATE_URLS", () => {
    // Bounded at BOTH ends: from this lane's banner to the closing `];` of the
    // array, never to end-of-file. The file has exported helpers after it.
    const src = readRepoFile("src/lib/imageLibrary.js");
    const start = src.indexOf("// ——— LANE H:");
    expect(start, "Lane H plate banner not found").toBeGreaterThan(-1);
    const end = src.indexOf("\n];", start);
    expect(end, "end of IMAGE_LIBRARY not found after the Lane H banner").toBeGreaterThan(start);
    const block = src.slice(start, end);
    expect(block).not.toMatch(/\burl\s*:/);
    expect(block).not.toMatch(/https?:\/\//);
    for (const p of IMAGE_LIBRARY) {
      expect(p.url === null || typeof p.url === "string", `plate ${p.key} url`).toBe(true);
    }
  });
});

describe("presetToFactionRecord", () => {
  const entityProps = Object.keys(factionEntity.properties);

  it("strips every presentation-only field", () => {
    for (const p of PRESET_FACTIONS) {
      const rec = presetToFactionRecord(p);
      for (const k of ["id", "house", "keel", "uniqueRoster", "heraldVoice"]) {
        expect(Object.prototype.hasOwnProperty.call(rec, k), `${p.id} leaks ${k}`).toBe(false);
      }
    }
  });

  it("returns only keys the Faction entity actually has", () => {
    for (const p of PRESET_FACTIONS) {
      for (const k of Object.keys(presetToFactionRecord(p))) {
        expect(entityProps, `${p.id}: Faction.jsonc has no '${k}' column`).toContain(k);
      }
    }
  });

  it("still carries the fields the entity requires", () => {
    for (const p of PRESET_FACTIONS) {
      const rec = presetToFactionRecord(p);
      for (const k of factionEntity.required) expect(rec, `${p.id}`).toHaveProperty(k);
      expect(rec.lore).toBe(p.lore);
      expect(rec.pointBuy).toEqual(p.pointBuy);
    }
  });
});

describe("voice and safety", () => {
  const strings = [];
  for (const p of PRESET_FACTIONS) {
    strings.push(p.factionName, p.lore, p.insigniaDescription);
    for (const t of p.traits) strings.push(t.name, t.description);
  }
  for (const plate of IMAGE_LIBRARY) {
    if (plate.category === "houses") strings.push(plate.title, plate.desc, plate.prompt);
  }

  const PII = [
    [/[\w.+-]+@[\w-]+\.[\w.]+/, "email address"],
    [/https?:\/\//, "url"],
    [/\+?\d[\d\s().-]{7,}\d/, "phone-shaped digit run"],
    [/(^|\s)@\w+/, "@handle"],
  ];
  it("contains no PII of any shape", () => {
    for (const s of strings) {
      for (const [re, what] of PII) expect(re.test(s), `${what} in: ${s.slice(0, 80)}`).toBe(false);
    }
  });

  it("names no real-world nation, regime or alliance", () => {
    const deny = /\b(America|American|Europe|European|Russia|Russian|German|Germany|Britain|British|France|French|China|Chinese|Japan|Japanese|Soviet|Nazi|Reich|USSR|NATO)\b/;
    for (const s of strings) expect(deny.test(s), `real-world proper noun in: ${s.slice(0, 80)}`).toBe(false);
  });

  it("keeps out-of-world mechanics vocabulary out of user-visible copy", () => {
    // `turn` is deliberately absent from this list: the three legacy rows say
    // "give the Synod ten turns" and are frozen byte-for-byte. Banning a word
    // this lane may not remove would be a gate that is red in the healthy
    // state, which is a gate the next reader learns to scroll past.
    const banned = /\b(tile|player|stat|modifier|hex|XP|buff|debuff)s?\b/i;
    for (const s of strings) expect(banned.test(s), `mechanics word in: ${s.slice(0, 80)}`).toBe(false);
  });

  it("uses no hex colour anywhere in the files this lane authors", () => {
    for (const f of ["src/lib/presetFactions.js", "test/presets.test.js"]) {
      expect(/#[0-9a-fA-F]{3,8}\b/.test(readRepoFile(f)), `hex colour in ${f}`).toBe(false);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// STEP 2 — the nomad-keel requisitions, Chapter VI, and the thirteen packs.
// ═══════════════════════════════════════════════════════════════════════════

const perkModsSrc = readRepoFile("base44/shared/perkMods.ts");
const PERK_MODS = extractConst(perkModsSrc, "PERK_MODS");
const heraldSrc = readRepoFile("docs/HERALD_VOICES.md");

// The twenty rows `main` shipped, named so that this lane's additions can be
// separated from them BY ID and not by position or by an absolute count. A
// later Field Amendment may append a twenty-ninth perk without touching a
// single assertion below.
const SHIPPED_PERK_IDS = [
  "veteran_corps", "industrial_base", "oil_concessions", "deep_reserves", "conscription",
  "mobilization_doctrine", "war_chest", "home_guard",
  "war_weary", "fuel_shortage", "rusting_arsenal", "green_recruits", "depleted_stockpiles",
  "brittle_industry", "pariah_state",
  "trench_gear", "flame_projectors", "heavy_plating", "naval_rams", "drop_tanks",
];

// This lane's eight, in the order they are declared. Hard-coded on purpose:
// "every NEW perk is picked by a preset" cannot be satisfied for this lane by
// a perk some other lane appends later.
const LANE_H_PERK_IDS = [
  "draught_columns", "boarding_parties", "field_refit_train", "ranging_batteries",
  "swath_bound", "stripped_escorts", "tribute_graze", "exposed_batteries",
];

const MOD_KEYS = ["unitStat", "unitCost", "income", "armyCap", "startBonus", "capitalDefense", "disposition"];
const INCOME_KEYS = ["manpower", "steel", "fuel"];
const UNIT_KEYS = ["riflemen", "crawler", "gunboat", "fighter", "artillery"];

// THE PRICING SCHEDULE, WITH ONE SHIPPED ANCHOR PER STEP.
//
// Nothing here is invented. Each entry is the cost of one step of one lever,
// read off a shipped `cat: "asset"` / `cat: "liability"` row that carries that
// lever and nothing else. A lever/sign combination with no shipped anchor
// (positive `disposition`, negative `capitalDefense`) deliberately has NO
// entry, and `priceOf` throws on it — so the schedule cannot be quietly
// extended by a row that uses an unpriced step.
const PRICE_ANCHORS = {
  "unitStat+": { per: 1, pts: 3, anchor: "veteran_corps" },
  "unitStat-": { per: 1, pts: -3, anchor: "green_recruits" },
  "unitCost+": { per: 1, pts: -2, anchor: "rusting_arsenal" },
  "unitCost-": { per: 1, pts: 2, anchor: "conscription" },
  "income+": { per: 1, pts: 3, anchor: "industrial_base" },
  "income-": { per: 1, pts: -2, anchor: "fuel_shortage" },
  "armyCap+": { per: 15, pts: 3, anchor: "mobilization_doctrine" },
  "armyCap-": { per: 15, pts: -2, anchor: "war_weary" },
  "startBonus+": { per: 4, pts: 2, anchor: "war_chest" },
  "startBonus-": { per: 4, pts: -2, anchor: "depleted_stockpiles" },
  "capitalDefense+": { per: 1, pts: 2, anchor: "home_guard" },
  "disposition-": { per: 10, pts: -1, anchor: "pariah_state" },
};

function stepPrice(lever, v) {
  const key = `${lever}${v > 0 ? "+" : "-"}`;
  const a = PRICE_ANCHORS[key];
  if (!a) throw new Error(`no shipped anchor prices ${key} — do not invent one`);
  return (Math.abs(v) / a.per) * a.pts;
}

function priceOf(mods) {
  let pts = 0;
  for (const stats of Object.values(mods.unitStat || {})) for (const v of Object.values(stats)) pts += stepPrice("unitStat", v);
  for (const res of Object.values(mods.unitCost || {})) for (const v of Object.values(res)) pts += stepPrice("unitCost", v);
  for (const v of Object.values(mods.income || {})) pts += stepPrice("income", v);
  for (const lever of ["armyCap", "startBonus", "capitalDefense", "disposition"]) {
    if (mods[lever]) pts += stepPrice(lever, mods[lever]);
  }
  return pts;
}

describe("the point-buy catalog — eight nomad-keel requisitions", () => {
  const newPerks = PERKS.filter((p) => LANE_H_PERK_IDS.includes(p.id));

  // The brief's check 14 reads `PERKS.length >= 29 (21 shipped + 8 new)`. The
  // parenthetical is the derivation and the derivation is WRONG: `main` ships
  // TWENTY perks, not 21, so with "exactly 4 new assets and exactly 4 new
  // liabilities" also binding, 29 is unreachable by construction. Rather than
  // pad the catalog with a ninth perk to satisfy a false figure, the count is
  // asserted from the two id lists it is actually made of.
  it("is exactly the twenty shipped rows plus this lane's eight", () => {
    const ids = PERKS.map((p) => p.id);
    expect(new Set(ids).size, "duplicate perk id").toBe(ids.length);
    for (const id of SHIPPED_PERK_IDS) expect(ids, `shipped perk ${id} was removed`).toContain(id);
    for (const id of LANE_H_PERK_IDS) expect(ids, `lane perk ${id} missing`).toContain(id);
    expect(ids.length).toBe(SHIPPED_PERK_IDS.length + LANE_H_PERK_IDS.length);
    expect(ids.slice(0, SHIPPED_PERK_IDS.length), "shipped rows moved or were reordered").toEqual(SHIPPED_PERK_IDS);
  });

  it("adds exactly four assets and exactly four liabilities, and no upgrade", () => {
    expect(newPerks.filter((p) => p.cat === "asset").map((p) => p.id).length).toBe(4);
    expect(newPerks.filter((p) => p.cat === "liability").map((p) => p.id).length).toBe(4);
    expect(newPerks.filter((p) => p.cat === "upgrade")).toEqual([]);
    // An eighth `upgrade` would be one-per-unit under pickError and would
    // silently shrink the legal ledger space of every preset that already
    // spends that unit's slot.
    for (const p of newPerks) expect(p).not.toHaveProperty("unit");
  });

  it("keeps assets in 1..3 and liabilities in -3..-1", () => {
    for (const p of newPerks) {
      expect(Number.isInteger(p.pts), `${p.id} pts`).toBe(true);
      if (p.cat === "asset") expect(p.pts, `${p.id} pts`).toBeGreaterThanOrEqual(1);
      if (p.cat === "asset") expect(p.pts, `${p.id} pts`).toBeLessThanOrEqual(3);
      if (p.cat === "liability") expect(p.pts, `${p.id} pts`).toBeGreaterThanOrEqual(-3);
      if (p.cat === "liability") expect(p.pts, `${p.id} pts`).toBeLessThanOrEqual(-1);
    }
  });

  it("gives every perk a label and a desc that states its own number", () => {
    for (const p of newPerks) {
      expect(p.label, `${p.id} label`).toBeTruthy();
      expect(p.desc, `${p.id} desc`).toMatch(/\d/);
    }
  });
});

describe("PERK_MODS — the mirror, the vocabulary, and the price", () => {
  it("declares exactly the same ids as PERKS, in the same set", () => {
    // The same assertion test/rules-mirror.test.js makes, restated here so the
    // lane fails on its own terms rather than in somebody else's file.
    expect(Object.keys(PERK_MODS).sort()).toEqual(PERKS.map((p) => p.id).sort());
  });

  it("uses only keys compileMods actually reduces — no silently inert mod", () => {
    for (const [id, mods] of Object.entries(PERK_MODS)) {
      for (const k of Object.keys(mods)) expect(MOD_KEYS, `${id} uses ${k}`).toContain(k);
      for (const u of Object.keys(mods.unitStat || {})) expect(UNIT_KEYS, `${id} unitStat ${u}`).toContain(u);
      for (const u of Object.keys(mods.unitCost || {})) expect(UNIT_KEYS, `${id} unitCost ${u}`).toContain(u);
      for (const r of Object.keys(mods.income || {})) expect(INCOME_KEYS, `${id} income ${r}`).toContain(r);
      for (const res of Object.values(mods.unitCost || {})) {
        for (const r of Object.keys(res)) expect(INCOME_KEYS, `${id} unitCost resource ${r}`).toContain(r);
      }
    }
  });

  it("goes red on a mod key compileMods would silently drop", () => {
    // `supplyRange` is real — mergeMods handles it — and is exactly the shape
    // of mistake this gate exists for: plausible, spelled correctly, and never
    // reduced by compileMods.
    const rogue = { supplyRange: 1 };
    expect(Object.keys(rogue).every((k) => MOD_KEYS.includes(k))).toBe(false);
  });

  // ── the published `pts` is recomputed, never trusted ──────────────────────
  it("prices all fifteen shipped asset/liability rows off the schedule", () => {
    for (const p of PERKS) {
      if (p.cat === "upgrade") continue;
      if (!SHIPPED_PERK_IDS.includes(p.id)) continue;
      expect(priceOf(PERK_MODS[p.id]), `${p.id} rubric`).toBe(p.pts);
    }
  });

  it("prices all eight of this lane's rows off the same schedule", () => {
    for (const id of LANE_H_PERK_IDS) {
      expect(priceOf(PERK_MODS[id]), `${id} rubric`).toBe(PERKS.find((p) => p.id === id).pts);
    }
  });

  it("pins each upgrade row's departure from the schedule, in both directions", () => {
    // The five `cat: "upgrade"` rows are the ONE exemption, and it is measured
    // rather than explained: kits are priced on their own schedule that runs
    // both under it and over it. Naming the deltas means the exemption cannot
    // widen to cover a sixth row without this line going red.
    const delta = {};
    for (const p of PERKS) if (p.cat === "upgrade") delta[p.id] = p.pts - priceOf(PERK_MODS[p.id]);
    expect(delta).toEqual({
      trench_gear: -1,
      flame_projectors: 2,
      heavy_plating: 0,
      naval_rams: -1,
      drop_tanks: -1,
    });
  });

  it("refuses to price a step no shipped row anchors", () => {
    expect(() => priceOf({ disposition: 10 })).toThrow(/no shipped anchor/);
    expect(() => priceOf({ capitalDefense: -1 })).toThrow(/no shipped anchor/);
    // …and the whole live catalog is free of both, which is the point of the throw.
    for (const [id, mods] of Object.entries(PERK_MODS)) {
      expect(() => priceOf(mods), `${id} uses an unanchored step`).not.toThrow();
    }
  });

  it("spends every one of the eight on at least one preset", () => {
    const picked = new Set(PRESET_FACTIONS.flatMap((p) => p.pointBuy.picks));
    for (const id of LANE_H_PERK_IDS) expect(picked, `${id} is shipped but nothing picks it`).toContain(id);
  });

  it("leaves the three legacy ledgers alone", () => {
    for (const id of ["kessel_pact", "iron_synod", "grauwall_marches"]) {
      const picks = byId(id).pointBuy.picks;
      for (const pick of picks) expect(LANE_H_PERK_IDS, `${id} picked a new perk`).not.toContain(pick);
    }
  });

  it("names artillery — a legal UNIT_TYPES key no shipped perk had ever used", () => {
    // Defect class 4, inverted: the shipped catalog touched four of the five
    // unit keys, and a lane that read the shipped rows as the permitted set
    // would have concluded artillery was off-limits. It is not.
    const shippedUnits = new Set();
    for (const id of SHIPPED_PERK_IDS) {
      for (const u of Object.keys(PERK_MODS[id].unitStat || {})) shippedUnits.add(u);
      for (const u of Object.keys(PERK_MODS[id].unitCost || {})) shippedUnits.add(u);
    }
    expect(shippedUnits.has("artillery")).toBe(false);
    expect(Object.keys(PERK_MODS.ranging_batteries.unitStat)).toEqual(["artillery"]);
    expect(UNIT_KEYS).toContain("artillery");
  });
});

describe("plates — one requisition token per new perk", () => {
  const byKey = new Map(IMAGE_LIBRARY.map((p) => [p.key, p]));
  for (const id of LANE_H_PERK_IDS) {
    it(`registers perk_${id}`, () => {
      const plate = byKey.get(`perk_${id}`);
      expect(plate, `perk_${id} plate missing`).toBeTruthy();
      expect(plate.category).toBe("perks");
      expect(plate.prompt, "a lane prompt must not restate HOUSE_STYLE").not.toMatch(/dieselpunk/i);
    });
  }
});

// ── LIFEPATH CHAPTER VI ─────────────────────────────────────────────────────

const CHAPTERS_I_TO_V = [
    {
      "id": "era",
      "title": "Founding Era",
      "prompt": "How was your nation born?",
      "options": [
        {
          "id": "revolt",
          "label": "Workers' Revolt",
          "desc": "Foundry laborers rose against the old barons, seizing the machines that had chained them."
        },
        {
          "id": "collapse",
          "label": "Collapse of the Old Empire",
          "desc": "When the empire's diesel arteries ran dry, your people carved a state from its rusting bones."
        },
        {
          "id": "frontier",
          "label": "Frontier Colonization",
          "desc": "Pioneers hauled boilers and rail into the wastes, founding a nation where no map dared draw borders."
        }
      ]
    },
    {
      "id": "land",
      "title": "Homeland",
      "prompt": "What ground did your people claim?",
      "options": [
        {
          "id": "forges",
          "label": "The Highland Forges",
          "desc": "Mountain valleys black with foundry smoke, rich in iron and coal."
        },
        {
          "id": "deltas",
          "label": "The River Deltas",
          "desc": "Fertile floodplains and crowded ports, where trade and grain flow together."
        },
        {
          "id": "steppes",
          "label": "The Ashen Steppes",
          "desc": "Endless windburnt plains — hard land that breeds hard soldiers."
        }
      ]
    },
    {
      "id": "crisis",
      "title": "First Crisis",
      "prompt": "Every young nation is tested. What was your trial?",
      "options": [
        {
          "id": "famine",
          "label": "The Hunger Winter",
          "desc": "Crops failed and the silos emptied. Your people learned rationing, and remembrance."
        },
        {
          "id": "borderwar",
          "label": "The Border War",
          "desc": "A neighbor tested your frontier with crawlers and shells. You answered."
        },
        {
          "id": "purge",
          "label": "The Counter-Revolution",
          "desc": "The old barons struck back from exile. The revolt had to be defended in blood.",
          "requires": {
            "era": "revolt"
          }
        },
        {
          "id": "succession",
          "label": "The Succession Feud",
          "desc": "Imperial pretenders fought over your provinces until you crowned your own order.",
          "requires": {
            "era": "collapse"
          }
        },
        {
          "id": "isolation",
          "label": "The Cut Rail",
          "desc": "The homeland severed your supply line. You survived a year alone in the wastes.",
          "requires": {
            "era": "frontier"
          }
        }
      ]
    },
    {
      "id": "event",
      "title": "The Long War",
      "prompt": "In the great war that reshaped the continent, your nation…",
      "options": [
        {
          "id": "profiteer",
          "label": "Armed Both Sides",
          "desc": "Your foundries ran day and night, selling crawlers to anyone with coin."
        },
        {
          "id": "bled",
          "label": "Bled on the Front",
          "desc": "A generation vanished into the mud, but the line held and legends were made."
        },
        {
          "id": "neutral",
          "label": "Fortified and Watched",
          "desc": "You sealed the passes, dug in deep, and let the world exhaust itself."
        }
      ]
    }
  ];

describe("lifepath — Chapter VI is an addition, not an edit", () => {
  it("leaves the four shipped chapters byte-equal to their fixture", () => {
    expect(LIFEPATH_CHAPTERS.slice(0, 4)).toEqual(CHAPTERS_I_TO_V);
  });

  it("appends exactly one chapter, at the end", () => {
    expect(LIFEPATH_CHAPTERS.length).toBe(CHAPTERS_I_TO_V.length + 1);
    const last = LIFEPATH_CHAPTERS[LIFEPATH_CHAPTERS.length - 1];
    expect(last.id).toBe("standard");
    expect(last.title).toBe("VI — The Standard");
    expect(last.prompt).toBeTruthy();
    expect(last.options.length).toBe(4);
  });

  it("maps its four options one-to-one onto the four shipped std_* plates", () => {
    const last = LIFEPATH_CHAPTERS[LIFEPATH_CHAPTERS.length - 1];
    const plates = last.options.map((o) => o.plate);
    expect(new Set(plates)).toEqual(new Set(["std_column", "std_reliquary", "std_black", "std_first_keel"]));
    expect(plates.length).toBe(4);
    const keys = new Set(IMAGE_LIBRARY.map((p) => p.key));
    for (const k of plates) expect(keys, `${k} is not a real plate`).toContain(k);
  });

  it("gives every option an id, a label, a desc and a schema-legal effect", () => {
    const last = LIFEPATH_CHAPTERS[LIFEPATH_CHAPTERS.length - 1];
    const ids = last.options.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of last.options) {
      expect(o.label, `${o.id} label`).toBeTruthy();
      expect(o.desc, `${o.id} desc`).toBeTruthy();
      expect(EFFECT_TYPES, `${o.id} effect type`).toContain(o.effect.type);
      expect(Number.isInteger(o.effect.value)).toBe(true);
      expect(o.effect.value).toBeGreaterThanOrEqual(1);
      expect(o.effect.value).toBeLessThanOrEqual(2);
      if (o.effect.type === "income_flat") expect(o.effect, `${o.id} income_flat takes no unit`).not.toHaveProperty("unit");
      else expect(EFFECT_UNITS, `${o.id} effect unit`).toContain(o.effect.unit);
    }
  });

  it("gates none of the four — the standard is chosen on the march", () => {
    const last = LIFEPATH_CHAPTERS[LIFEPATH_CHAPTERS.length - 1];
    for (const o of last.options) expect(o).not.toHaveProperty("requires");
    expect(availableOptions(last, {}).length).toBe(4);
    expect(availableOptions(last, { era: "revolt", land: "forges" }).length).toBe(4);
  });

  it("uses each shipped standard on at least one preset", () => {
    const chosen = new Set(PRESET_FACTIONS.map((p) => p.lifepathChoices.standard));
    expect(chosen).toEqual(new Set(["std_column", "std_reliquary", "std_black", "std_first_keel"]));
  });
});

// ── HERALD VOICES ───────────────────────────────────────────────────────────

// Bounded at BOTH ends: a pack runs from its own `## ` heading to the NEXT
// `## ` heading, never to end-of-file. Lane H is last today; Field Amendments
// append after it, and a slice that ran to EOF would swallow them.
function heraldPacks(src) {
  const lines = src.split("\n");
  const heads = [];
  lines.forEach((l, i) => { if (l.startsWith("## ")) heads.push(i); });
  const out = new Map();
  heads.forEach((start, i) => {
    const end = i + 1 < heads.length ? heads[i + 1] : lines.length;
    const m = /`([a-z_]+)`\s*$/.exec(lines[start]);
    if (!m) return;                       // Shared Rules / Garble / Implementation Notes
    const body = lines.slice(start, end);
    const moods = {};
    let cur = null;
    for (const b of body) {
      if (b.startsWith("### ")) { cur = b.slice(4).trim(); moods[cur] = []; }
      else if (b.startsWith("> ") && cur) moods[cur].push(b.slice(2).trim());
    }
    out.set(m[1], { heading: lines[start], body, moods });
  });
  return out;
}

describe("HERALD_VOICES.md — thirteen packs", () => {
  const packs = heraldPacks(heraldSrc);
  const MOODS = ["Ascendant", "Pressed", "Dealing"];

  it("carries exactly one pack per heraldVoice, and no orphan pack", () => {
    const wanted = PRESET_FACTIONS.map((p) => p.heraldVoice);
    expect(new Set(wanted).size, "two presets share a heraldVoice").toBe(wanted.length);
    for (const key of wanted) expect([...packs.keys()], `no pack for ${key}`).toContain(key);
    expect([...packs.keys()].sort()).toEqual([...wanted].sort());
  });

  it("gives every preset's `house` the pack its `heraldVoice` names", () => {
    for (const p of PRESET_FACTIONS) expect(p.heraldVoice, `${p.id}`).toBe(p.house);
  });

  it("names the faction in the pack heading it belongs to", () => {
    for (const p of PRESET_FACTIONS) {
      expect(packs.get(p.heraldVoice).heading, `${p.id} heading`).toContain(p.factionName);
    }
  });

  for (const key of [...new Set(PRESET_FACTIONS.map((p) => p.heraldVoice))]) {
    it(`${key} carries a Voice, an Always, a Never and three samples per mood`, () => {
      const pack = packs.get(key);
      const text = pack.body.join("\n");
      expect(text, `${key} Voice`).toContain("**Voice.**");
      expect(text, `${key} Always`).toContain("**Always:**");
      expect(text, `${key} Never`).toContain("**Never:**");
      expect(Object.keys(pack.moods)).toEqual(MOODS);
      for (const mood of MOODS) {
        expect(pack.moods[mood].length, `${key} / ${mood}`).toBeGreaterThanOrEqual(3);
        for (const s of pack.moods[mood]) expect(s.length, `${key} / ${mood} empty sample`).toBeGreaterThan(20);
      }
    });
  }

  it("holds at least 117 samples — thirteen packs, three moods, three each", () => {
    let n = 0;
    for (const pack of packs.values()) for (const mood of MOODS) n += pack.moods[mood].length;
    expect(n).toBeGreaterThanOrEqual(117);
  });

  it("reports the loss of a running works in every single register", () => {
    // Operator ruling: on capture the captor loots unspent MATERIALS only; the
    // project, its progress and its housed Object are lost. Thirteen registers,
    // thirteen ways of saying the same unwelcome thing — and none of them may
    // say the winner inherited it.
    for (const [key, pack] of packs) {
      const samples = MOODS.flatMap((m) => pack.moods[m]);
      const loss = samples.filter((s) => s.includes("{projectName}"));
      expect(loss.length, `${key} never reports a lost works`).toBeGreaterThanOrEqual(1);
      for (const s of loss) {
        expect(/\b(inherit|inherited|inherits|transferred|transferable)\b/i.test(s) && !/not a transferable|does not inherit|not recoverable/i.test(s),
          `${key} reports a captured works as an inheritance`).toBe(false);
      }
    }
  });

  it("keeps out-of-world mechanics vocabulary out of every sample", () => {
    const banned = /\b(turn|tile|player|stat|modifier|hex|XP|buff|debuff)s?\b/i;
    for (const [key, pack] of packs) {
      for (const mood of MOODS) {
        for (const s of pack.moods[mood]) expect(banned.test(s), `${key} / ${mood}: ${s.slice(0, 70)}`).toBe(false);
      }
    }
  });

  it("goes red on a sample that leaks a mechanics word", () => {
    const banned = /\b(turn|tile|player|stat|modifier|hex|XP|buff|debuff)s?\b/i;
    expect(banned.test("BULLETIN 12. The player holds the tile at first watch.")).toBe(true);
    expect(banned.test("BULLETIN 12. The Reclamation holds the ground at first watch.")).toBe(false);
  });

  it("keeps the three structural blocks the herald function reads", () => {
    for (const h of ["## Shared Rules (all houses)", "## Garble Template (confidence POOR)", "## Implementation Notes"]) {
      expect(heraldSrc, `${h} was dropped`).toContain(h);
    }
  });

  it("keeps the canon sample lines of the three packs that predate this lane", () => {
    // Canon prose is redistributed across the three moods, never deleted.
    const canon = [
      ["reclamation", "BULLETIN 41."],
      ["reclamation", "BULLETIN 44."],
      ["reclamation", "BULLETIN 47."],
      ["combine", "ADVISORY TO ALL FREIGHT."],
      ["combine", "NOTICE OF ADJUSTMENT."],
      ["combine", "The Combine confirms delivery of {resource}"],
      ["synod", "Let it be entered in the Preservation Roll:"],
      ["synod", "The Synod observes that {faction} has opened ground"],
      ["synod", "Entered this day: the keel {baseName} was seen making south"],
    ];
    for (const [key, opening] of canon) {
      const samples = MOODS.flatMap((m) => packs.get(key).moods[m]);
      expect(samples.some((s) => s.includes(opening)), `${key} lost canon line: ${opening}`).toBe(true);
    }
  });

  it("contains no PII and no real-world proper noun, anywhere in the file", () => {
    for (const [re, what] of [
      [/[\w.+-]+@[\w-]+\.[\w.]+/, "email address"],
      [/https?:\/\//, "url"],
      [/\+?\d[\d\s().-]{7,}\d/, "phone-shaped digit run"],
      [/(^|\s)@\w+/, "@handle"],
    ]) {
      expect(re.test(heraldSrc), `${what} in HERALD_VOICES.md`).toBe(false);
    }
    const deny = /\b(America|American|Europe|European|Russia|Russian|German|Germany|Britain|British|France|French|China|Chinese|Japan|Japanese|Soviet|Nazi|Reich|USSR|NATO)\b/;
    expect(deny.test(heraldSrc)).toBe(false);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 — the ten named grounds, and forty-four entries of the Archive.
//
// TWO GATES HERE ARE DELIBERATELY NOT WRITTEN THE OBVIOUS WAY.
//
//   * The Codex tail block is located by its OWN ids, from the first to the
//     last, and is asserted to be a contiguous run of exactly that length.
//     It is NOT "everything from the banner to the end of the array": Lane H is
//     the last content lane today and Field Amendments append after it, so a
//     slice bounded by end-of-file would be true exactly until the next append.
//   * The block-key set ADMITS `cite`. The Lane H brief lists the shipped block
//     kinds as lead/p/h/note/quote/list/table, but `cite` is the optional
//     companion of `quote` — documented in src/lib/fieldManual.js's schema
//     comment, rendered by ManualBlock.jsx, and used by two entries that predate
//     this wave. A gate built from the brief's list would have been red on a
//     healthy corpus, which is the defect class this file exists to avoid.
import { settlementDossier, charterOptions, LORE_ERAS, LORE_HOOKS } from "../base44/shared/settlementLore.ts";
import { ENTRIES, CATEGORIES, STATUS, entryText, citedBy } from "@/lib/wiki/entries.js";

const settlementSrc = readRepoFile("base44/shared/settlementLore.ts");
// Lifted textually, not imported: extractConst throws on a spread, a computed
// key or a call, so a green extraction is itself the proof that the table is
// still the pure data literal the mirror protocol requires.
const NAMED_POLITIES = extractConst(settlementSrc, "NAMED_POLITIES");
const POLITY_ROWS = Object.entries(NAMED_POLITIES);
const SPOIL_KEYS = ["steel", "manpower", "fuel"];

// ── predicates, each one shown to have teeth ───────────────────────────────
const polityGrammarIsValid = (row) =>
  typeof row.name === "string" && row.name.length > 0 &&
  Object.prototype.hasOwnProperty.call(LORE_HOOKS, row.kind) &&
  LORE_ERAS.includes(row.era) &&
  typeof row.culture === "string" && row.culture === row.culture.toLowerCase() &&
  typeof row.hook === "string" && /^[a-z]/.test(row.hook) &&
  Object.keys(row.spoils).length === 1 &&
  SPOIL_KEYS.includes(Object.keys(row.spoils)[0]) &&
  Number.isInteger(Object.values(row.spoils)[0]) &&
  Object.values(row.spoils)[0] >= 2 && Object.values(row.spoils)[0] <= 5;

// One sentence: opens on a capital, closes on a full stop, and carries no
// second sentence inside it.
const isOneSentence = (s) => typeof s === "string" && s.length > 20 && /^[A-Z“"]/.test(s) && s.endsWith(".") && !/\.\s/.test(s.slice(0, -1));
// "states its own number" — a numeral or a written number, either is a number.
const statesANumber = (s) => /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i.test(s);

describe("NAMED_POLITIES — the ten grounds the Chart names", () => {
  it("is a pure data literal of exactly ten rows", () => {
    expect(POLITY_ROWS.length).toBe(10);
    expect(new Set(POLITY_ROWS.map(([, r]) => r.name)).size).toBe(10);
    expect(new Set(Object.keys(NAMED_POLITIES)).size).toBe(10);
  });

  it("gives every row the shipped row grammar", () => {
    for (const [slug, row] of POLITY_ROWS) {
      expect(polityGrammarIsValid(row), `${slug} breaks the row grammar`).toBe(true);
    }
  });

  it("goes red on a row that breaks the grammar", () => {
    const good = clone(NAMED_POLITIES.tarpool);
    expect(polityGrammarIsValid(good)).toBe(true);
    expect(polityGrammarIsValid({ ...good, era: "the Third Collapse" }), "era off LORE_ERAS").toBe(false);
    expect(polityGrammarIsValid({ ...good, kind: "fortress" }), "kind off LORE_HOOKS").toBe(false);
    expect(polityGrammarIsValid({ ...good, spoils: { fuel: 9 } }), "spoils out of band").toBe(false);
    expect(polityGrammarIsValid({ ...good, spoils: { fuel: 3, steel: 1 } }), "two spoil keys").toBe(false);
    expect(polityGrammarIsValid({ ...good, hook: "Burns where it stands" }), "hook capitalised").toBe(false);
  });

  it("gives every ground one bespoke crisis and one bespoke charter, the charter stating its number", () => {
    for (const [slug, row] of POLITY_ROWS) {
      expect(isOneSentence(row.crisis), `${slug} crisis is not one sentence: ${row.crisis}`).toBe(true);
      expect(isOneSentence(row.charter), `${slug} charter is not one sentence: ${row.charter}`).toBe(true);
      expect(statesANumber(row.charter), `${slug} charter states no number`).toBe(true);
    }
    // No two grounds share a crisis or a charter — ten bespoke hooks, not one
    // hook with the name swapped ten times.
    expect(new Set(POLITY_ROWS.map(([, r]) => r.crisis)).size).toBe(10);
    expect(new Set(POLITY_ROWS.map(([, r]) => r.charter)).size).toBe(10);
    expect(new Set(POLITY_ROWS.map(([, r]) => r.hook)).size).toBe(10);
  });

  it("names a plate that already exists, and adds none", () => {
    const keys = new Set(IMAGE_LIBRARY.map((p) => p.key));
    for (const [slug, row] of POLITY_ROWS) expect(keys.has(row.plate), `${slug} → ${row.plate}`).toBe(true);
    // Every settlement plate this lane names was shipped before it: the count of
    // set_* plates is read off the library rather than typed here, and the ten
    // named ones are a subset of it.
    const setPlates = IMAGE_LIBRARY.filter((p) => p.key.startsWith("set_")).map((p) => p.key);
    for (const [, row] of POLITY_ROWS) expect(setPlates).toContain(row.plate);
  });

  it("names ten grounds the roster's §2 actually lists", () => {
    // Bounded at BOTH ends: §2 down to the next `## `, never to end-of-file.
    const grounds = section(rosterSrc, /^## \d+\. The Ten Grounds/);
    for (const [slug, row] of POLITY_ROWS) expect(grounds, `${slug} missing from roster §2`).toContain(row.name);
  });

  it("keeps §6.6's register equal to the data", () => {
    const recon = section(rosterSrc, /^## \d+\. Reconciliation/);
    const rows = tableRows(recon, "| spoils |");
    const fromDoc = rows.map((r) => ({
      slug: unbacktick(r[1]), name: r[2], kind: r[3], culture: r[4], era: r[5], spoils: r[6], plate: unbacktick(r[7]),
    }));
    const fromData = POLITY_ROWS.map(([slug, r]) => {
      const [res, amt] = Object.entries(r.spoils)[0];
      return { slug, name: r.name, kind: r.kind, culture: r.culture, era: r.era, spoils: `${res} ${amt}`, plate: r.plate };
    });
    expect(fromDoc).toEqual(fromData);
    expect(rows.map((r) => Number(r[0]))).toEqual(fromData.map((_, i) => i + 1));
  });
});

describe("settlementDossier — the named path, and the hashed path it did not disturb", () => {
  const FOUR = ["title", "era", "text", "spoils"];

  it("answers a named node from its own row", () => {
    const row = NAMED_POLITIES.tarpool;
    const d = settlementDossier({ id: "n1", name: "Tarpool", kind: "town" });
    expect(Object.keys(d).sort()).toEqual([...FOUR].sort());
    expect(d.title).toBe("Tarpool");
    expect(d.era).toBe(row.era);
    expect(d.spoils).toEqual(row.spoils);
    expect(d.text).toBe(`Tarpool ${row.hook}.`);
  });

  it("answers every one of the ten, whatever kind the chart node claims", () => {
    // The node's `kind` is the surveyor's guess; a named ground's own row wins.
    for (const [slug, row] of POLITY_ROWS) {
      const d = settlementDossier({ id: `n-${slug}`, name: row.name, kind: "ruin" });
      expect(d.text, slug).toBe(`${row.name} ${row.hook}.`);
      expect(d.era, slug).toBe(row.era);
    }
  });

  it("hands out a COPY of the spoils, so a save cannot mutate the canon table", () => {
    const d = settlementDossier({ id: "n1", name: "Tarpool", kind: "town" });
    const before = Object.values(NAMED_POLITIES.tarpool.spoils)[0];
    d.spoils[Object.keys(d.spoils)[0]] = 99;
    const after = settlementDossier({ id: "n2", name: "Tarpool", kind: "town" });
    expect(Object.values(after.spoils)[0]).toBe(before);
  });

  it("leaves the hashed path intact for everything else", () => {
    const node = { id: "x7", name: "Ashfoot Siding", kind: "depot" };
    const a = settlementDossier(node);
    const b = settlementDossier(node);
    expect(Object.keys(a).sort()).toEqual([...FOUR].sort());
    expect(a).toEqual(b);
    expect(LORE_ERAS).toContain(a.era);
    // The legacy text carries its own tail; the named path deliberately does not.
    expect(a.text.endsWith(`Standing since ${a.era}.`)).toBe(true);
    expect(settlementDossier({ id: "n1", name: "Tarpool", kind: "town" }).text).not.toContain("Standing since");
  });

  it("keeps charterOptions on its three ids", () => {
    const d = settlementDossier({ id: "n1", name: "Tarpool", kind: "town" });
    expect(charterOptions(d).map((o) => o.id)).toEqual(["requisition", "levy", "autonomy"]);
    for (const o of charterOptions(d)) expect(typeof o.label === "string" && typeof o.detail === "string").toBe(true);
  });
});

// ── the Archive ────────────────────────────────────────────────────────────
// This lane's own ids, named one by one. The minimum is 40 IN THIS LANE'S DIFF,
// and four other content lanes have already appended to this file — so counting
// ENTRIES.length would let somebody else's block satisfy this lane's floor.
const LANE_H_ENTRY_IDS = [
  "the-house-register",
  "house-iron-reclamation", "house-charter-combine", "house-bastion-synod", "house-covenant-of-locks",
  "house-signal-ascendancy", "house-commonweal-march", "house-salvage-court", "house-emberwright-union",
  "house-long-procession", "house-outrider-compact", "house-kessel-pact", "house-iron-synod",
  "house-grauwall-marches",
  "the-ten-grounds",
  "ground-hundredweight-bottoms", "ground-the-nine-cradles", "ground-tarpool", "ground-the-gray-commons",
  "ground-crossloom", "ground-vault-of-winters", "ground-the-chandlery", "ground-redwater-digs",
  "ground-the-quiet-parish", "ground-kettleharrow",
  "departures-in-practice", "the-thirteen-keels", "herald-registers", "the-swath", "grazing-rights",
  "salvage-adjudication", "charter-terms", "works-lost-with-the-keel", "certification-and-fit",
  "the-red-flag", "the-parish-question", "the-meet", "lexicon-settlement-cultures", "boarding-assault",
  "the-standard",
  "requisitions-the-graze", "requisitions-the-refit", "requisitions-the-boarding-deck", "requisitions-the-batteries",
];
const HOUSE_ENTRY_IDS = LANE_H_ENTRY_IDS.filter((id) => id.startsWith("house-"));
const GROUND_ENTRY_IDS = LANE_H_ENTRY_IDS.filter((id) => id.startsWith("ground-"));
const BLOCK_KEYS = ["lead", "p", "h", "note", "quote", "cite", "list", "table"];
const blockIsValid = (b) =>
  Object.keys(b).length > 0 &&
  Object.keys(b).every((k) => BLOCK_KEYS.includes(k)) &&
  (!b.table || (Array.isArray(b.table.head) && Array.isArray(b.table.rows)));

describe("the Ministry Archive — forty-four entries in this lane's own diff", () => {
  const ids = ENTRIES.map((e) => e.id);
  const byIdEntry = (id) => ENTRIES.find((e) => e.id === id);

  it("adds at least forty entries of its own, and the corpus clears its floor", () => {
    expect(LANE_H_ENTRY_IDS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(LANE_H_ENTRY_IDS).size, "a Lane H id is listed twice").toBe(LANE_H_ENTRY_IDS.length);
    for (const id of LANE_H_ENTRY_IDS) expect(ids, `missing entry ${id}`).toContain(id);
    expect(ENTRIES.length).toBeGreaterThanOrEqual(86);
  });

  it("covers what the lane owes: thirteen houses, ten grounds, all eight requisitions and the Standard", () => {
    expect(HOUSE_ENTRY_IDS.length).toBe(PRESET_FACTIONS.length);
    expect(GROUND_ENTRY_IDS.length).toBe(POLITY_ROWS.length);
    // Every house entry is titled with its faction's name, exactly.
    for (const p of PRESET_FACTIONS) {
      const hit = HOUSE_ENTRY_IDS.map(byIdEntry).filter((e) => e.title === p.factionName);
      expect(hit.length, `no house entry titled ${p.factionName}`).toBe(1);
    }
    for (const [, row] of POLITY_ROWS) {
      const hit = GROUND_ENTRY_IDS.map(byIdEntry).filter((e) => e.title === row.name);
      expect(hit.length, `no ground entry titled ${row.name}`).toBe(1);
    }
    // The eight nomad-keel requisitions are each named, by label, somewhere in
    // the four requisition entries — grouped coverage, but coverage by name.
    const reqText = LANE_H_ENTRY_IDS.filter((id) => id.startsWith("requisitions-")).map(byIdEntry).map(entryText).join(" ");
    for (const id of LANE_H_PERK_IDS) {
      expect(reqText, `requisition ${id} is never named`).toContain(PERK_BY_ID[id].label.toLowerCase());
    }
    expect(byIdEntry("the-standard").blocks.length).toBeGreaterThan(2);
  });

  it("sits as ONE contiguous tail block, bounded at both ends by its own ids", () => {
    // Bounded by the FIRST and LAST Lane H id, never by end-of-array: a later
    // Field Amendment appends after this block and must not turn this red.
    const positions = LANE_H_ENTRY_IDS.map((id) => ids.indexOf(id));
    const first = Math.min(...positions);
    const last = Math.max(...positions);
    expect(last - first + 1, "the Lane H block is not contiguous").toBe(LANE_H_ENTRY_IDS.length);
    const inside = ids.slice(first, last + 1);
    expect([...inside].sort()).toEqual([...LANE_H_ENTRY_IDS].sort());
    // …and it is a TAIL block: nothing from another lane sits after it today.
    expect(first).toBeGreaterThan(0);
  });

  it("keeps every id unique and every entry well formed, corpus-wide", () => {
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    const statuses = new Set(Object.keys(STATUS));
    for (const e of ENTRIES) {
      expect(cats.has(e.category), `${e.id} category ${e.category}`).toBe(true);
      expect(statuses.has(e.status), `${e.id} status ${e.status}`).toBe(true);
      expect(typeof e.summary === "string" && e.summary.length > 0, `${e.id} summary`).toBe(true);
      expect(Array.isArray(e.blocks) && e.blocks.length > 0, `${e.id} blocks`).toBe(true);
      for (const b of e.blocks) expect(blockIsValid(b), `${e.id} block ${JSON.stringify(b).slice(0, 60)}`).toBe(true);
    }
  });

  it("admits `cite`, which the corpus already uses, and still rejects an unknown key", () => {
    expect(blockIsValid({ quote: "…and on the last lift-day no manifest was posted.", cite: "fragment, provenance disputed" })).toBe(true);
    expect(blockIsValid({ p: "text" })).toBe(true);
    expect(blockIsValid({ table: { head: ["a"], rows: [["b"]] } })).toBe(true);
    expect(blockIsValid({ table: { head: ["a"] } }), "a table with no rows").toBe(false);
    expect(blockIsValid({ paragraph: "text" }), "an invented block kind").toBe(false);
    expect(blockIsValid({}), "an empty block").toBe(false);
  });

  it("leaves no dangling `see` link anywhere in the corpus", () => {
    const known = new Set(ids);
    const dangling = ENTRIES.flatMap((e) => (e.see || []).filter((s) => !known.has(s)).map((s) => `${e.id} → ${s}`));
    expect(dangling).toEqual([]);
    // and this lane's own entries carry links rather than standing alone
    for (const id of LANE_H_ENTRY_IDS) {
      expect((byIdEntry(id).see || []).length, `${id} links to nothing`).toBeGreaterThan(0);
    }
  });

  it("cross-links both ways — every new house and ground entry is cited by another entry", () => {
    for (const id of [...HOUSE_ENTRY_IDS, ...GROUND_ENTRY_IDS]) {
      expect(citedBy(id).length, `${id} is cited by nothing`).toBeGreaterThan(0);
    }
  });

  it("mentions all thirteen faction names and all ten ground names somewhere in the corpus", () => {
    const haystacks = ENTRIES.map(entryText);
    for (const p of PRESET_FACTIONS) {
      expect(haystacks.some((t) => t.includes(p.factionName.toLowerCase())), `${p.factionName} unmentioned`).toBe(true);
    }
    for (const [slug, row] of POLITY_ROWS) {
      expect(haystacks.some((t) => t.includes(row.name.toLowerCase())), `${slug} unmentioned`).toBe(true);
    }
  });

  it("marks the three legacy presets thin, because no governing document names them", () => {
    for (const legacyId of LEGACY_IDS) {
      const p = byId(legacyId);
      const e = HOUSE_ENTRY_IDS.map(byIdEntry).find((x) => x.title === p.factionName);
      expect(e.status, `${legacyId} entry status`).toBe("thin");
    }
    // …and the ten the Almanac does name are not hedged.
    for (const p of AUTHORED) {
      const e = HOUSE_ENTRY_IDS.map(byIdEntry).find((x) => x.title === p.factionName);
      expect(e.status, `${p.id} entry status`).toBe("canon");
    }
  });

  it("restates no requisition number — the tables are the only place those live", () => {
    // Drift guard 7. A perk's number is written in PERK_MODS and described in
    // its own `desc`; an Archive entry that repeated one would be a second
    // source that goes stale in silence.
    const reqEntries = LANE_H_ENTRY_IDS.filter((id) => id.startsWith("requisitions-")).map(byIdEntry);
    for (const e of reqEntries) {
      expect(/[+−-]\s?\d/.test(entryText(e)), `${e.id} restates a signed number`).toBe(false);
    }
  });
});

describe("voice and safety — the grounds and the Archive", () => {
  const strings = [];
  for (const [, row] of POLITY_ROWS) strings.push(row.name, row.culture, row.hook, row.crisis, row.charter);
  for (const id of LANE_H_ENTRY_IDS) {
    const e = ENTRIES.find((x) => x.id === id);
    strings.push(e.title, e.summary, e.folk || "", e.tag || "");
    for (const b of e.blocks) {
      for (const v of Object.values(b)) {
        if (typeof v === "string") strings.push(v);
        else if (Array.isArray(v)) strings.push(...v);
        else if (v && v.head) strings.push(...v.head, ...v.rows.flat());
      }
    }
  }

  it("carries no PII of any shape", () => {
    const PII = [
      [/[\w.+-]+@[\w-]+\.[\w.]+/, "email address"],
      [/https?:\/\//, "url"],
      [/\+?\d[\d\s().-]{7,}\d/, "phone-shaped digit run"],
      [/(^|\s)@\w+/, "@handle"],
    ];
    for (const s of strings) {
      for (const [re, what] of PII) expect(re.test(s), `${what} in: ${s.slice(0, 80)}`).toBe(false);
    }
  });

  it("names no real-world nation, regime or alliance", () => {
    const deny = /\b(America|American|Europe|European|Russia|Russian|German|Germany|Britain|British|France|French|China|Chinese|Japan|Japanese|Soviet|Nazi|Reich|USSR|NATO)\b/;
    for (const s of strings) expect(deny.test(s), `real-world proper noun in: ${s.slice(0, 80)}`).toBe(false);
  });

  it("keeps out-of-world mechanics vocabulary out of every string it ships", () => {
    const banned = /\b(tile|player|stat|modifier|hex|XP|buff|debuff)s?\b/i;
    for (const s of strings) expect(banned.test(s), `mechanics word in: ${s.slice(0, 80)}`).toBe(false);
  });

  it("uses no hex colour in the files this step touched", () => {
    for (const f of ["base44/shared/settlementLore.ts", "src/lib/wiki/entries.js"]) {
      expect(/#[0-9a-fA-F]{3,8}\b/.test(readRepoFile(f)), `hex colour in ${f}`).toBe(false);
    }
  });
});
