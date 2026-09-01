// Zero-credit runtime harness for the macro engine. Base44 Deno functions only
// execute when deployed, so to validate the macro rules' RUNTIME behavior (which
// deno lint can't — it only checks syntax/scope) we lift the real macro code
// out of gameEngine/entry.ts verbatim and evaluate it in Node. This runs the
// exact shipped source, so a logic bug here is a logic bug in production.
//
// TWO marked regions are lifted (entry.ts can't simply be widened into one
// slice: it has `import` statements between them, and an `import` is a
// SyntaxError inside a `new Function` body):
//   1. the settlement-charter region (surveySettlement / applyCharter), which
//      the macro region calls on first contact and after a capture;
//   2. the macro engine region itself.
// The shared modules under base44/shared/*.ts are plain ESM, so their REAL
// exports are imported and injected rather than stubbed — hand-copying a value
// like BARTER_COOLDOWN_DAYS into STUBS would reintroduce exactly the mirror
// drift this test tree exists to catch. `STUBS` therefore covers only the
// helpers that live in the unliftable parts of entry.ts (treasury, units,
// generals, diplomacy).
import { readRepoFile } from "./extract-const.js";
import { settlementDossier, charterOptions } from "../../base44/shared/settlementLore.ts";
import {
  CRISES, rollCrisisId, crisisView, crisisOption, clampStability,
  STABILITY_START, STABILITY_REVOLT_BELOW, CRISIS_FESTER_STABILITY, CRISIS_CHANCE,
} from "../../base44/shared/settlementCrisis.ts";
import { excavateRelic } from "../../base44/shared/relics.ts";
import { BARTER_COOLDOWN_DAYS } from "../../base44/shared/barterDeals.ts";

const SRC = readRepoFile("base44/functions/gameEngine/entry.ts");

// Real shared-module exports that are free identifiers in the lifted text.
// Only names the lifted regions do NOT declare may appear here — injecting one
// they also declare is a `const` redeclaration SyntaxError (loud, by design).
const SHARED = {
  settlementDossier, charterOptions, excavateRelic, BARTER_COOLDOWN_DAYS,
  CRISES, rollCrisisId, crisisView, crisisOption, clampStability,
  STABILITY_START, STABILITY_REVOLT_BELOW, CRISIS_FESTER_STABILITY, CRISIS_CHANCE,
};

// Lift the text between two marker strings. Throws loudly when a marker is
// missing or out of order, so a future refactor that deletes or reorders one
// fails visibly instead of silently lifting an empty or wrong slice.
function region(startMarker, endMarker, { keepStart = false } = {}) {
  const s = SRC.indexOf(startMarker);
  const e = SRC.indexOf(endMarker);
  if (s < 0 || e < 0) throw new Error(`harness region markers not found: ${startMarker}`);
  if (e <= s) throw new Error(`harness region markers out of order: ${startMarker}`);
  return SRC.slice(keepStart ? s : s + startMarker.length, e);
}

// surveySettlement + applyCharter — called from macroFlipControl and
// macroApplyBattleOutcome. Lifted, never stubbed: it files dossiers, queues
// charters and pays NPC treasuries, and the fog-of-war view publishes exactly
// that state. A no-op stub would make the march/assault scenarios vacuous.
const charterBlock = () =>
  region(
    "// ---------- Begin settlement charter (harness marker) ----------",
    "// ---------- End settlement charter (harness marker) ----------",
  );

// The macro block is contiguous: from the first macro constant to just before
// the fog-of-war section (see the region markers in entry.ts).
const macroBlock = () =>
  region(
    "const MACRO_ROUTE_QUALITY = {",
    "// ---------- End macro engine (harness marker) ----------",
    { keepStart: true },
  );

// Minimal stand-ins for the shared engine helpers the macro block references.
// They model just enough behavior for a faithful simulation.
const STUBS = `
  const MAP_CONTROL_PCT = 60;
  const RESOURCE_KEYS = ['manpower', 'steel', 'fuel'];
  const ARMY_ORDINALS = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];
  const UNITS = {
    riflemen: { points: 5, cost: { manpower: 2, steel: 1 } },
    crawler: { points: 12, cost: { steel: 3, fuel: 2 } },
    artillery: { points: 10, cost: { steel: 3, manpower: 1 } },
    fighter: { points: 15, cost: { steel: 2, fuel: 3 } },
  };
  const emptyResources = () => ({ manpower: 0, steel: 0, fuel: 0 });
  let __id = 0;
  const genId = () => 'id' + (++__id);
  const getTreasury = (game, s) => (game.treasuries[String(s)] = game.treasuries[String(s)] || emptyResources());
  const factionProduction = (game, s) => {
    const out = emptyResources();
    for (const [nid, owner] of Object.entries(game.macro.control)) {
      if (owner !== s) continue;
      const node = game.macro.nodes.find((n) => n.id === nid);
      const y = MACRO_SETTLEMENT_YIELD[node && node.kind] || {};
      for (const k of RESOURCE_KEYS) out[k] += y[k] || 0;
    }
    return out;
  };
  const canAfford = (t, c) => RESOURCE_KEYS.every((k) => (t[k] || 0) >= (c[k] || 0));
  const pay = (t, c) => { for (const k of RESOURCE_KEYS) t[k] = (t[k] || 0) - (c[k] || 0); };
  const armyPoints = (game, s) => {
    let p = 0;
    for (const c of game.macro.columns || []) if (c.owner === s)
      for (const k of MACRO_COLUMN_KEYS) p += (c.regiments[k] || 0) * (UNITS[k] ? UNITS[k].points : 0);
    return p;
  };
  const armyCap = () => 90;
  const atPeace = (game, a, b) => !!(game.__accords || []).find((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const traitByKey = () => null;
  const vehicleOf = () => null;
  const armyRank = () => ({ bonus: 0, label: 'Green' });
  const defenderIsLive = () => false;
  const shiftDisposition = () => {};
  const totalUnits = (u = {}) => Object.values(u).reduce((s, n) => s + (n || 0), 0);
  const forcePoints = (u = {}) => MACRO_COLUMN_KEYS.reduce((s, k) => s + (u[k] || 0) * (UNITS[k] ? UNITS[k].points : 0), 0);
  const creditVictory = () => {};
  const generalFate = () => {};
  const roll3d6 = () => 10;
`;

let MACRO = null;
export function loadMacro() {
  if (MACRO) return MACRO;
  const names = [
    "macroGenerateWorld", "macroSpawnCities", "macroDayRate", "macroFindPath",
    "macroAdvanceDay", "macroCheckWin", "macroCollectIncome", "macroControlPct",
    "macroObserved", "macroVisibleFor", "macroNpcTurn", "macroCreateBattle",
    "macroApplyBattleOutcome", "macroNode", "macroRouteBetween", "macroColumnsAt",
    "macroBlockedAgainst", "macroSettlements", "macroSupplied", "MACRO_SETTLEMENT_YIELD",
    "MACRO_COLUMN_KEYS", "MACRO_ESCORT", "MACRO_SUPPLY_MILES", "MACRO_BASE_DAY_RATE",
  ];
  // eslint-disable-next-line no-new-func
  const factory = new Function("__shared", `"use strict";
    const { ${Object.keys(SHARED).join(", ")} } = __shared;
    ${STUBS}
    ${charterBlock()}
    ${macroBlock()}
    return { ${names.join(", ")} };
  `);
  MACRO = factory(SHARED);
  return MACRO;
}
