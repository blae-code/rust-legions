// The Bazaar (mirrors src/lib/barter.js) — locals swap stores with an occupying
// force, and treat a gifted precursor relic as a civic treasure.
export const BARTER_COOLDOWN_DAYS = 3;

export function barterDeals(primary = 'manpower') {
  return [
    { id: 'stores', label: 'Trade Surplus Stores', give: { steel: 4 }, gain: { manpower: 5 }, detail: 'The market takes plate and scrap; the households send sons in return.' },
    { id: 'fuel_run', label: 'Charter a Fuel Run', give: { manpower: 4 }, gain: { fuel: 4 }, detail: 'Lend the town labor for the pumps and take the drums that come up.' },
    { id: 'endowment', label: 'Endow the Elders', give: { steel: 3, fuel: 2 }, boost: { res: primary, amt: 1 }, detail: `Fund the council's works and they pledge +1 ${primary} every day the settlement stays yours.` },
    { id: 'relic_gift', label: 'Gift a Salvaged Relic', relic: true, gain: { steel: 3, manpower: 3 }, boost: { res: primary, amt: 2 }, detail: `Hand a precursor find to the town — it is enshrined, and the settlement pledges +2 ${primary} daily. The relic's own benefit is lost.` },
  ];
}