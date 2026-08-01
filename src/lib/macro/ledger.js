// Quartermaster's Ledger — display mirror of the engine's settlement yields and
// supply envelope (docs/MACRO_ENGINE.md §8). The backend stays authoritative;
// this only reads what getState already reveals to the player.

export const SETTLEMENT_YIELD = {
  city: { steel: 2, manpower: 2 },
  town: { manpower: 2 },
  depot: { fuel: 2 },
  ruin: { steel: 1 },
  crossroads: {},
};

export const KIND_LABEL = {
  city: "Ruined City",
  town: "Township",
  depot: "Fuel Depot",
  ruin: "Deep Ruin",
  crossroads: "Crossroads",
};

// Everything the ledger needs, derived from the fog-filtered macro state
export function ledgerReport(game) {
  const macro = game.macro;
  if (!macro || game.mySlot === null || game.mySlot === undefined) {
    return { holdings: [], hubs: [], cutOff: [], columnsOut: [], income: { manpower: 0, steel: 0, fuel: 0 }, lostIncome: { manpower: 0, steel: 0, fuel: 0 }, coverage: 0, controlled: 0, settlementCount: macro?.settlementCount || 0 };
  }
  const supplied = new Set(macro.supplied || []);
  const myBaseNode = (macro.bases || []).find((b) => b.slot === game.mySlot)?.nodeId || null;

  const holdings = macro.nodes
    .filter((n) => n.kind !== "crossroads" && macro.control[n.id] === game.mySlot)
    .map((n) => ({
      id: n.id,
      name: n.name,
      kind: n.kind,
      yield: SETTLEMENT_YIELD[n.kind] || {},
      inSupply: supplied.has(n.id),
      isBase: n.id === myBaseNode,
      isHub: n.id === myBaseNode || n.kind === "depot",
    }))
    .sort((a, b) => (b.isHub ? 1 : 0) - (a.isHub ? 1 : 0) || a.name.localeCompare(b.name));

  const income = { manpower: 0, steel: 0, fuel: 0 };
  const lostIncome = { manpower: 0, steel: 0, fuel: 0 };
  for (const h of holdings) {
    for (const [k, v] of Object.entries(h.yield)) {
      income[k] += v;
      if (!h.inSupply) lostIncome[k] += v;
    }
  }

  return {
    holdings,
    hubs: holdings.filter((h) => h.isHub),
    cutOff: holdings.filter((h) => !h.inSupply),
    columnsOut: (macro.columns || []).filter((c) => c.owner === game.mySlot && c.inSupply === false),
    income,
    lostIncome,
    coverage: holdings.length ? Math.round((holdings.filter((h) => h.inSupply).length / holdings.length) * 100) : 0,
    controlled: holdings.length,
    settlementCount: macro.settlementCount || 0,
  };
}