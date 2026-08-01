// The Bazaar — display mirror of the engine's barter table
// (base44/functions/gameEngine/entry.ts). The backend stays authoritative.
import { SETTLEMENT_YIELD } from "@/lib/macro/ledger";
import { RELIC_SETS } from "@/lib/relics";

export const BARTER_COOLDOWN_DAYS = 3;

export const barterPrimary = (kind) => Object.keys(SETTLEMENT_YIELD[kind] || {})[0] || "manpower";

export function barterDeals(node) {
  const primary = barterPrimary(node?.kind);
  return [
    { id: "stores", label: "Trade Surplus Stores", give: { steel: 4 }, gain: { manpower: 5 }, detail: "The market takes plate and scrap; the households send sons in return." },
    { id: "fuel_run", label: "Charter a Fuel Run", give: { manpower: 4 }, gain: { fuel: 4 }, detail: "Lend the town labor for the pumps and take the drums that come up." },
    { id: "endowment", label: "Endow the Elders", give: { steel: 3, fuel: 2 }, boost: { res: primary, amt: 1 }, detail: `Fund the council's works and they pledge +1 ${primary} every day the settlement stays yours.` },
    { id: "relic_gift", label: "Gift a Salvaged Relic", relic: true, gain: { steel: 3, manpower: 3 }, boost: { res: primary, amt: 2 }, detail: `Hand a precursor find to the town — it is enshrined, and the settlement pledges +2 ${primary} daily. The relic's own benefit is lost.` },
  ];
}

// Relics inside an assembled set are never given away
export function looseRelics(myRelics = [], myRelicSets = []) {
  const locked = new Set();
  for (const setId of myRelicSets) for (const m of RELIC_SETS[setId]?.members || []) locked.add(m);
  return myRelics.filter((r) => !locked.has(r.id));
}