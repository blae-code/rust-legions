// Full-game simulation of the macro engine (slices M1–M2) running the REAL
// gameEngine source in a Node harness — deploy-equivalent runtime validation
// without spending Base44 credits. Exercises: world generation, spawn setup,
// muster, march plotting, dawn advancement, control flips, income, fog of war,
// NPC turns, and node assaults resolved through the shared battle path.
import { describe, it, expect, beforeEach } from "vitest";
import { loadMacro } from "./helpers/macro-harness.js";

const M = loadMacro();

// Build a started 2-faction macro game the way startGame does (§9)
function newGame(planetId = "cindara") {
  const world = M.macroGenerateWorld(planetId);
  const factionSlots = [
    { slotIndex: 0, factionName: "Kessel Pact", isNPC: false, generals: [{ id: "g0", name: "Voss", strategy: 12 }], armiesRaised: 1, doctrine: "aggressive" },
    { slotIndex: 1, factionName: "Iron Synod", isNPC: true, generals: [], armiesRaised: 1, doctrine: "economic", dispositions: {} },
  ];
  const game = {
    status: "active", turnNumber: 1, weather: "clear",
    factionSlots, turnOrder: [0, 1], currentTurnIndex: 0,
    treasuries: { "0": { manpower: 20, steel: 20, fuel: 20 }, "1": { manpower: 20, steel: 20, fuel: 20 } },
    combatLog: [], statHistory: [], armies: [],
    macro: { ...world, control: {}, bases: {}, columns: [] },
    __accords: [],
  };
  const spawns = M.macroSpawnCities(game.macro, 2);
  spawns.forEach((spawn, i) => {
    game.macro.control[spawn.id] = i;
    game.macro.bases[String(i)] = { nodeId: spawn.id };
    game.macro.columns.push({ id: `c${i}`, owner: i, battles: 0, generalId: i === 0 ? "g0" : null, name: "1st Column", regiments: { riflemen: 2, crawler: 1 }, nodeId: spawn.id });
  });
  return game;
}

describe("macro world generation + setup", () => {
  it("generates a connected graph and spreads spawns apart", () => {
    const game = newGame();
    expect(game.macro.nodes.length).toBeGreaterThan(50);
    expect(Object.keys(game.macro.bases)).toEqual(["0", "1"]);
    expect(game.macro.bases["0"].nodeId).not.toBe(game.macro.bases["1"].nodeId);
    // Each faction controls its spawn and fields one column there
    expect(game.macro.control[game.macro.bases["0"].nodeId]).toBe(0);
    expect(game.macro.columns.filter((c) => c.owner === 0)).toHaveLength(1);
  });
});

describe("marching and dawn advancement", () => {
  it("advances a plotted column and flips undefended control", () => {
    const game = newGame();
    const col = game.macro.columns.find((c) => c.owner === 0);
    // Plot toward a neighbor by route from the spawn
    const start = col.nodeId;
    const edge = game.macro.routes.find((r) => r[0] === start || r[1] === start);
    const dest = edge[0] === start ? edge[1] : edge[0];
    const rate = M.macroDayRate(col.regiments);
    const found = M.macroFindPath(game.macro, start, dest, rate);
    col.march = { path: found.path, legMiles: 0 };
    delete col.nodeId;

    // March enough days to arrive (miles/effRate, capped)
    let guard = 0;
    while (col.march && guard++ < 40) M.macroAdvanceDay(game);
    expect(col.nodeId).toBe(dest);
    // Undefended settlement flips to the marcher
    const destNode = M.macroNode(game.macro, dest);
    if (destNode.kind !== "crossroads") expect(game.macro.control[dest]).toBe(0);
  });

  it("collects settlement income into the treasury", () => {
    const game = newGame();
    const before = { ...game.treasuries["0"] };
    M.macroCollectIncome(game, 0);
    const after = game.treasuries["0"];
    // Spawn is a settlement — at least one resource must have grown
    const grew = ["manpower", "steel", "fuel"].some((k) => after[k] > before[k]);
    expect(grew).toBe(true);
  });
});

describe("fog of war", () => {
  it("hides distant control from a faction with no scouts there", () => {
    const game = newGame();
    const view = M.macroVisibleFor(game, 0);
    // My own spawn control is visible; the enemy spawn (far away) is not
    expect(view.control[game.macro.bases["0"].nodeId]).toBe(0);
    expect(view.control[game.macro.bases["1"].nodeId]).toBeUndefined();
    // Geography is fully public
    expect(view.nodes.length).toBe(game.macro.nodes.length);
  });

  it("reveals everything to a null (spectator) slot", () => {
    const game = newGame();
    const view = M.macroVisibleFor(game, null);
    expect(Object.keys(view.control).length).toBe(Object.keys(game.macro.control).length);
  });
});

describe("node assault (M2) via the shared battle path", () => {
  let game, attacker, targetNode;
  beforeEach(() => {
    game = newGame();
    attacker = game.macro.columns.find((c) => c.owner === 0);
    // Drop an enemy column on a node adjacent to the attacker's spawn
    const start = attacker.nodeId;
    const edge = game.macro.routes.find((r) => r[0] === start || r[1] === start);
    targetNode = edge[0] === start ? edge[1] : edge[0];
    game.macro.columns.push({ id: "enemy1", owner: 1, battles: 0, generalId: null, name: "Raider Column", regiments: { riflemen: 1 }, nodeId: targetNode });
    game.macro.control[targetNode] = 1;
  });

  it("opens a mass battle and removes committed defenders from the roster", () => {
    M.macroCreateBattle(game, 0, attacker, targetNode);
    expect(game.activeBattle).toBeTruthy();
    expect(game.activeBattle.worldModel).toBe("macro");
    expect(game.activeBattle.macro.nodeId).toBe(targetNode);
    // The defending column is folded into the battle, off the map
    expect(game.macro.columns.find((c) => c.id === "enemy1")).toBeUndefined();
    expect(game.activeBattle.defender.units.riflemen).toBe(1);
  });

  it("attacker victory advances the column and flips control", () => {
    M.macroCreateBattle(game, 0, attacker, targetNode);
    const b = game.activeBattle;
    b.attacker.units = { riflemen: 2, crawler: 1 };
    b.defender.units = {};                // enemy annihilated
    const outcome = M.macroApplyBattleOutcome(game, b, true);
    expect(outcome).toBe("captured");
    expect(game.macro.control[targetNode]).toBe(0);
    const col = game.macro.columns.find((c) => c.id === attacker.id);
    expect(col.nodeId).toBe(targetNode);
    expect(col.battles).toBe(1);
  });

  it("defender victory reforms the defense and retreats attacker survivors", () => {
    M.macroCreateBattle(game, 0, attacker, targetNode);
    const b = game.activeBattle;
    b.attacker.units = { riflemen: 1 };   // attacker survivors
    b.defender.units = { riflemen: 1 };   // defender holds
    const outcome = M.macroApplyBattleOutcome(game, b, false);
    expect(outcome).toBe("retreated");
    // Control stays with the defender; a defense column reappears on the node
    expect(game.macro.control[targetNode]).toBe(1);
    expect(game.macro.columns.some((c) => c.owner === 1 && c.nodeId === targetNode)).toBe(true);
  });
});

describe("truce protection + NPC behavior", () => {
  it("dawn arrival does not flip ground owned by an accord partner", () => {
    const game = newGame();
    game.__accords.push([0, 1]);
    const col = game.macro.columns.find((c) => c.owner === 0);
    const enemySpawn = game.macro.bases["1"].nodeId;
    // Force the column onto the enemy-owned node via a direct one-day plot
    game.macro.control[enemySpawn] = 1;
    // Simulate arrival bookkeeping through the flip path
    const start = col.nodeId;
    const route = game.macro.routes.find((r) => (r[0] === start && r[1] === enemySpawn) || (r[1] === start && r[0] === enemySpawn));
    if (route) {
      col.march = { path: [start, enemySpawn], legMiles: 0 };
      delete col.nodeId;
      let guard = 0;
      while (col.march && guard++ < 60) M.macroAdvanceDay(game);
      // Accord holds — the node is not seized
      expect(game.macro.control[enemySpawn]).toBe(1);
    }
  });

  it("an NPC turn plots idle columns toward unclaimed settlements", () => {
    const game = newGame();
    const npcCol = game.macro.columns.find((c) => c.owner === 1);
    M.macroNpcTurn(game, 1);
    // The NPC either issued a march or mustered a second column
    const hasPlan = !!npcCol.march || game.macro.columns.filter((c) => c.owner === 1).length > 1;
    expect(hasPlan).toBe(true);
  });
});

describe("victory", () => {
  it("declares a winner at 60% settlement control", () => {
    const game = newGame();
    const settlements = M.macroSettlements(game.macro);
    // Hand faction 0 a 60%+ share
    settlements.slice(0, Math.ceil(settlements.length * 0.6)).forEach((n) => { game.macro.control[n.id] = 0; });
    M.macroCheckWin(game);
    expect(game.status).toBe("complete");
    expect(game.winnerSlot).toBe(0);
  });
});
