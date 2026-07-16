// GURPS-style point-buy catalog. Mirrored in the gameEngine backend — keep in sync.
export const PERKS = [
  // ── Assets (cost points) ──
  { id: "veteran_corps", cat: "asset", pts: 3, label: "Veteran Corps", desc: "Riflemen attack +1 — hardened by the last war." },
  { id: "industrial_base", cat: "asset", pts: 3, label: "Industrial Base", desc: "+1 Steel income every turn." },
  { id: "oil_concessions", cat: "asset", pts: 3, label: "Oil Concessions", desc: "+1 Fuel income every turn." },
  { id: "deep_reserves", cat: "asset", pts: 3, label: "Deep Reserves", desc: "+1 Manpower income every turn." },
  { id: "conscription", cat: "asset", pts: 2, label: "Conscription Act", desc: "Riflemen cost 1 less Manpower." },
  { id: "mobilization_doctrine", cat: "asset", pts: 3, label: "Mobilization Doctrine", desc: "Army cap +15 points." },
  { id: "war_chest", cat: "asset", pts: 2, label: "War Chest", desc: "Start the war with +4 of every resource." },
  { id: "home_guard", cat: "asset", pts: 2, label: "Home Guard", desc: "Units defending your capital get +1 defense." },
  // ── Liabilities (grant points) ──
  { id: "war_weary", cat: "liability", pts: -2, label: "War-Weary Populace", desc: "Army cap −15 points." },
  { id: "fuel_shortage", cat: "liability", pts: -2, label: "Fuel Shortage", desc: "−1 Fuel income every turn." },
  { id: "rusting_arsenal", cat: "liability", pts: -2, label: "Rusting Arsenal", desc: "Crawlers cost +1 Steel." },
  { id: "green_recruits", cat: "liability", pts: -3, label: "Green Recruits", desc: "Riflemen defense −1." },
  { id: "depleted_stockpiles", cat: "liability", pts: -2, label: "Depleted Stockpiles", desc: "Start the war with −4 of every resource." },
  { id: "brittle_industry", cat: "liability", pts: -2, label: "Brittle Industry", desc: "−1 Steel income every turn." },
  { id: "pariah_state", cat: "liability", pts: -1, label: "Pariah State", desc: "NPC powers regard you at −10 disposition." },
  // ── Unit upgrades (cost points, one per unit type) ──
  { id: "trench_gear", cat: "upgrade", unit: "riflemen", pts: 2, label: "Trench Gear", desc: "Riflemen defense +1." },
  { id: "flame_projectors", cat: "upgrade", unit: "crawler", pts: 3, label: "Flame Projectors", desc: "Crawler attack +1, but +1 Fuel cost." },
  { id: "heavy_plating", cat: "upgrade", unit: "crawler", pts: 3, label: "Heavy Plating", desc: "Crawler defense +1." },
  { id: "naval_rams", cat: "upgrade", unit: "gunboat", pts: 2, label: "Naval Rams", desc: "Gunboat attack +1." },
  { id: "drop_tanks", cat: "upgrade", unit: "fighter", pts: 2, label: "Drop Tanks", desc: "Fighter defense +1." },
];

export const PERK_BY_ID = Object.fromEntries(PERKS.map((p) => [p.id, p]));

export const MAX_LIABILITIES = 3;

export const netPoints = (picks = []) =>
  picks.reduce((s, id) => s + (PERK_BY_ID[id]?.pts || 0), 0);

export function pickError(picks = []) {
  const liabilities = picks.filter((id) => PERK_BY_ID[id]?.cat === "liability");
  if (liabilities.length > MAX_LIABILITIES) return `At most ${MAX_LIABILITIES} liabilities allowed`;
  const units = picks.filter((id) => PERK_BY_ID[id]?.cat === "upgrade").map((id) => PERK_BY_ID[id].unit);
  if (new Set(units).size !== units.length) return "Only one upgrade per unit type";
  const net = netPoints(picks);
  if (net > 0) return `Ledger overdrawn by ${net} pts — accept liabilities to fund your requisitions`;
  return null;
}