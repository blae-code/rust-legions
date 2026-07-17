// Zero-credit runtime harness for the macro engine. Base44 Deno functions only
// execute when deployed, so to validate the macro rules' RUNTIME behavior (which
// deno lint can't — it only checks syntax/scope) we lift the real macro code
// block out of gameEngine/entry.ts verbatim and evaluate it in Node with stubs
// for the shared engine helpers it calls. This runs the exact shipped source, so
// a logic bug here is a logic bug in production.
import { readRepoFile } from "./extract-const.js";

const SRC = readRepoFile("base44/functions/gameEngine/entry.ts");

// The macro block is contiguous: from the first macro constant to just before
// the fog-of-war section (see the region markers in entry.ts).
function macroBlock() {
  const start = SRC.indexOf("const MACRO_ROUTE_QUALITY = {");
  const end = SRC.indexOf("// ---------- Fog of war ----------");
  if (start < 0 || end < 0) throw new Error("macro block markers not found");
  return SRC.slice(start, end);
}

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
    "macroBlockedAgainst", "macroSettlements", "MACRO_SETTLEMENT_YIELD",
    "MACRO_COLUMN_KEYS", "MACRO_ESCORT",
  ];
  // eslint-disable-next-line no-new-func
  const factory = new Function(`"use strict";
    ${STUBS}
    ${macroBlock()}
    return { ${names.join(", ")} };
  `);
  MACRO = factory();
  return MACRO;
}
