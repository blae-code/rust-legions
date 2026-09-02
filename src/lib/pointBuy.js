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
  // ── LANE H: nomad-keel requisitions (GAME_RULES draft §28) ──────────────
  // Eight rows for the March itself — the graze, the swath, the draught
  // columns and the boarding deck (ECONOMY_DESIGN §§2-5, VISION §3). Every
  // row above this banner is untouched; ids are additive and never renamed.
  //
  // PRICED, NOT GUESSED. `pts` is not an opinion: each row's cost is the sum
  // of its own PERK_MODS steps under the schedule the shipped catalog already
  // proves, one anchor per step —
  //   income      +1 -> +3 (industrial_base)   |  -1 -> -2 (fuel_shortage)
  //   unitStat    +1 -> +3 (veteran_corps)     |  -1 -> -3 (green_recruits)
  //   unitCost    -1 -> +2 (conscription)      |  +1 -> -2 (rusting_arsenal)
  //   armyCap    +15 -> +3 (mobilization_...)  | -15 -> -2 (war_weary)
  //   startBonus  +4 -> +2 (war_chest)         |  -4 -> -2 (depleted_...)
  //   capitalDef  +1 -> +2 (home_guard)        | disposition -10 -> -1 (pariah_state)
  // `test/presets.test.js` recomputes all fifteen shipped asset/liability
  // rows AND all eight below from that schedule and asserts the published
  // `pts`. The five `cat: "upgrade"` rows are excluded, and the exclusion is
  // MEASURED rather than explained away: kits are priced on their own
  // schedule, which departs from the one above in BOTH directions (naval_rams
  // and drop_tanks sit a point under it, flame_projectors two points over it),
  // so the test pins all five deltas individually instead of calling it a
  // discount. No step is used here that no shipped row anchors —
  // positive `disposition` and negative `capitalDefense` are therefore absent
  // rather than invented.
  //
  // NOTHING HERE IS A `cat: "upgrade"`. Upgrades are one-per-unit under
  // `pickError`, so an eighth upgrade would silently shrink the space of legal
  // ledgers for every existing preset. These eight stack freely.
  // ── Assets (cost points) ──
  { id: "draught_columns", cat: "asset", pts: 1, label: "Draught Column Circuit", desc: "+1 Steel income every turn, −1 Fuel income every turn — the hold-wagons run a standing circuit and burn their way home." },
  { id: "boarding_parties", cat: "asset", pts: 1, label: "Boarding Parties", desc: "Riflemen attack +1, and riflemen cost 1 more Manpower — deck drill is paid for in men, twice." },
  { id: "field_refit_train", cat: "asset", pts: 2, label: "Field Refit Train", desc: "Crawlers cost 1 less Steel — the workshop marches with the column instead of waiting at the keel." },
  { id: "ranging_batteries", cat: "asset", pts: 3, label: "Ranging Batteries", desc: "Artillery attack +1 — the guns range the pasture before the columns are sent into it." },
  // ── Liabilities (grant points) ──
  { id: "swath_bound", cat: "liability", pts: -2, label: "Swath-Bound", desc: "−1 Manpower income every turn — the ground behind this keel has already been eaten, and it musters nobody." },
  { id: "stripped_escorts", cat: "liability", pts: -1, label: "Stripped Escorts", desc: "Crawler defense −1, and crawlers cost 1 less Steel — plate cut away to keep the column screen fast." },
  { id: "tribute_graze", cat: "liability", pts: -3, label: "Tribute Graze", desc: "−1 Fuel income every turn, and NPC powers regard you at −10 disposition — harvest rights taken at gunpoint are fired behind you, and the ground talks." },
  { id: "exposed_batteries", cat: "liability", pts: -3, label: "Exposed Batteries", desc: "Artillery defense −1 — the guns are mounted where the yard had room, not where the crews are safe." },
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