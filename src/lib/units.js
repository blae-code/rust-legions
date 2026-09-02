export const RESOURCE_KEYS = ["manpower", "steel", "fuel"];

export const RESOURCE_META = {
  manpower: { label: "Manpower", short: "MP", icon: "👥" },
  steel: { label: "Steel", short: "ST", icon: "⚙" },
  fuel: { label: "Fuel", short: "FL", icon: "🛢" },
};

// Which resource a terrain produces
export const TERRAIN_RESOURCE = {
  plains: "manpower", deltas: "manpower", forest: "manpower",
  hills: "steel", highlands: "steel", mountains: "steel",
  marsh: "fuel",
};

export const UNIT_TYPES = {
  riflemen: { key: "riflemen", label: "Riflemen", points: 5, cost: { manpower: 2, steel: 1 }, attack: 1, defense: 2, speed: 3, domain: "land", deployAt: "barracks" },
  crawler: { key: "crawler", label: "Diesel Crawler", points: 12, cost: { steel: 3, fuel: 2 }, attack: 3, defense: 2, speed: 2, domain: "land", deployAt: "foundry" },
  gunboat: { key: "gunboat", label: "Ironclad Gunboat", points: 10, cost: { steel: 3, fuel: 1 }, attack: 2, defense: 2, speed: 4, domain: "sea", deployAt: "foundry" },
  fighter: { key: "fighter", label: "Prop Fighter", points: 15, cost: { steel: 2, fuel: 3 }, attack: 3, defense: 1, speed: 6, domain: "air", deployAt: "airstrip" },
  artillery: { key: "artillery", label: "Siege Artillery", points: 10, cost: { steel: 3, manpower: 1 }, attack: 1, defense: 1, speed: 1, domain: "land", deployAt: "foundry" },
};

export const UNIT_KEYS = ["riflemen", "crawler", "gunboat", "fighter", "artillery"];

export const BUILDINGS = {
  barracks: { key: "barracks", label: "Barracks", cost: { steel: 4 }, upgradeCost: { steel: 6 }, desc: "Deploys Riflemen · +1 Manpower per level" },
  foundry: { key: "foundry", label: "Foundry", cost: { manpower: 3, fuel: 2 }, upgradeCost: { manpower: 4, fuel: 3 }, desc: "Deploys Crawlers & Gunboats · +1 Steel per level" },
  refinery: { key: "refinery", label: "Refinery", cost: { steel: 4 }, upgradeCost: { steel: 6 }, desc: "+2 Fuel per level" },
  fortifications: { key: "fortifications", label: "Fortifications", cost: { steel: 5 }, upgradeCost: { steel: 7 }, desc: "Defenders +1 defense per level" },
  airstrip: { key: "airstrip", label: "Airstrip", cost: { steel: 3, fuel: 3 }, desc: "Deploys Prop Fighters" },
};

export const BUILDING_KEYS = ["barracks", "foundry", "refinery", "fortifications", "airstrip"];

// [PROPOSED — awaiting platform wiring] Macro support classes (GEAR_LIBRARY §7).
// Not in UNIT_KEYS and not mirrored in gameEngine: the platform lane lifts these
// rows into gameEngine's UNITS when it wires them, at which point they move into
// UNIT_TYPES and the mirror test covers them.
//
// PRICED AGAINST THE FIVE THAT ALREADY EXIST, NOT AGAINST EACH OTHER. The macro
// ledger's only published relationship between a unit's cost and its points is
// density = points / (manpower + steel + fuel), which across UNIT_TYPES runs from
// riflemen (the cheap mass floor) to fighter (the expensive ceiling). Every row
// below sits inside that band, and test/gear-points-audit.test.js recomputes the
// band from UNIT_TYPES rather than reading a number written here — so the band
// moves if the base five ever do.
//
// EFFECT SIGNS FOLLOW THE KEY, NOT A HOUSE RULE: `value` is the additive delta
// applied to the named key, so buildTurns -1 is the benefit and everything else
// here is a benefit upward. Scope follows Lane G's catalog.ts convention
// (supplyRange/losRange/digSpeed/armyCap and unit.<t>.attack|defense|speed are
// macro; initiative/moraleTest are tactical; income.*/fragmentYield/buildTurns
// are economy).
//
// Two of these carry a design intent GEAR_LIBRARY §7 states and the effect
// vocabulary cannot yet express: the bridging train's river crossing (there is no
// crossing key — buildTurns stands in for the span it throws) and the hospital
// train's [II:Cache] fragment gate (PROPOSED_UNIT_TYPES mirrors UNIT_TYPES, which
// has no tier field). Both are named in GEAR_LIBRARY §11 as platform-handoff
// items rather than invented here.
export const PROPOSED_UNIT_TYPES = {
  draught_column: { key: "draught_column", label: "Draught Column", points: 5, cost: { manpower: 2, fuel: 1 }, attack: 0, defense: 1, speed: 3, domain: "land", deployAt: "barracks", effects: [{ scope: "macro", key: "supplyRange", value: 2 }], blurb: "Waggons, beasts and drivers, and the whole reason the line eats. It carries no gun worth the name and every army that lost one learned why it was on the establishment." },
  siege_train: { key: "siege_train", label: "Siege Train", points: 15, cost: { steel: 4, manpower: 2, fuel: 1 }, attack: 3, defense: 1, speed: 1, domain: "land", deployAt: "foundry", effects: [{ scope: "macro", key: "unit.artillery.attack", value: 1 }, { scope: "macro", key: "unit.artillery.speed", value: 1 }], blurb: "The heavy pieces, their platforms, and the tractors that drag both. A gun that arrives on time is a different gun from one that arrives." },
  bridging_train: { key: "bridging_train", label: "Bridging Train", points: 7, cost: { steel: 3, manpower: 1 }, attack: 0, defense: 1, speed: 2, domain: "land", deployAt: "foundry", effects: [{ scope: "economy", key: "buildTurns", value: -1 }], blurb: "Pontoons, decking and the engineers who have measured the water already. Works go up a turn sooner wherever it is parked, and a river stops being an argument." },
  signals_wagon: { key: "signals_wagon", label: "Signals Wagon", points: 9, cost: { steel: 2, fuel: 2 }, attack: 1, defense: 1, speed: 3, domain: "land", deployAt: "foundry", effects: [{ scope: "macro", key: "losRange", value: 1 }, { scope: "tactical", key: "initiative", value: 1 }], blurb: "A mast, a set, and two operators who have not slept. The column sees one zone further and is told about it before the enemy is told about them." },
  salvage_detachment: { key: "salvage_detachment", label: "Salvage Detachment", points: 6, cost: { manpower: 2, steel: 1 }, attack: 0, defense: 1, speed: 2, domain: "land", deployAt: "foundry", effects: [{ scope: "macro", key: "digSpeed", value: 1 }, { scope: "economy", key: "fragmentYield", value: 1 }], blurb: "Winches, cutting gear and men who read a spoil heap the way a clerk reads a column. Near useless in the line and worth three companies at a shaft head." },
  hospital_train: { key: "hospital_train", label: "Hospital Train", points: 11, cost: { manpower: 3, steel: 2 }, attack: 0, defense: 2, speed: 2, domain: "land", deployAt: "barracks", effects: [{ scope: "economy", key: "income.manpower", value: 1 }, { scope: "macro", key: "armyCap", value: 1 }], blurb: "Wards on bogies, running wherever the supply runs. It does not stop the casualties; it returns a share of them to the establishment that wrote them off." },
  provost_column: { key: "provost_column", label: "Provost Column", points: 8, cost: { manpower: 3, steel: 1 }, attack: 1, defense: 2, speed: 3, domain: "land", deployAt: "fortifications", effects: [{ scope: "tactical", key: "moraleTest", value: 2 }], blurb: "Mounted discipline detachments working the occupied ground behind the front. Unrest is not persuaded out of a settlement; it is written down and answered." },
};

export const RESOURCE_LABELS = {
  oil_field: "Oil Field (+2 Fuel)",
  coal_depot: "Coal Depot (+1 Steel)",
  iron_foundry: "Iron Works (Crawler −1 Steel)",
};

export const costString = (cost = {}) =>
  RESOURCE_KEYS.filter((k) => cost[k]).map((k) => `${cost[k]} ${RESOURCE_META[k].short}`).join(" + ") || "Free";

export const activeBuildings = (state) => (state?.buildings || []).filter((b) => (b.level || 0) > 0);
export const hasBuilding = (state, type) => activeBuildings(state).some((b) => b.type === type);

export const totalUnits = (units = {}) =>
  UNIT_KEYS.reduce((sum, k) => sum + (units[k] || 0), 0);

export const armyPointsOf = (units = {}) =>
  UNIT_KEYS.reduce((sum, k) => sum + (units[k] || 0) * UNIT_TYPES[k].points, 0);