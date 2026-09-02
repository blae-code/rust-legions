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
import { PERK_BY_ID, MAX_LIABILITIES, netPoints, pickError } from "@/lib/pointBuy.js";
import { PHILOSOPHIES, VALUES, DOCTRINES } from "@/lib/lifepath.js";
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
    const base = byId("iron_reclamation").pointBuy.picks;
    expect(base.filter((id) => PERK_BY_ID[id].cat === "liability").length).toBe(3);
    const fourth = [...base, "war_weary"];
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
