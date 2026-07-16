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
  riflemen: { key: "riflemen", label: "Riflemen", points: 5, cost: { manpower: 2, steel: 1 }, attack: 1, defense: 2, domain: "land", deployAt: "barracks" },
  crawler: { key: "crawler", label: "Diesel Crawler", points: 12, cost: { steel: 3, fuel: 2 }, attack: 3, defense: 2, domain: "land", deployAt: "foundry" },
  gunboat: { key: "gunboat", label: "Ironclad Gunboat", points: 10, cost: { steel: 3, fuel: 1 }, attack: 2, defense: 2, domain: "sea", deployAt: "foundry" },
  fighter: { key: "fighter", label: "Prop Fighter", points: 15, cost: { steel: 2, fuel: 3 }, attack: 3, defense: 1, domain: "air", deployAt: "airstrip" },
};

export const UNIT_KEYS = ["riflemen", "crawler", "gunboat", "fighter"];

export const BUILDINGS = {
  barracks: { key: "barracks", label: "Barracks", cost: { steel: 4 }, upgradeCost: { steel: 6 }, desc: "Deploys Riflemen · +1 Manpower per level" },
  foundry: { key: "foundry", label: "Foundry", cost: { manpower: 3, fuel: 2 }, upgradeCost: { manpower: 4, fuel: 3 }, desc: "Deploys Crawlers & Gunboats · +1 Steel per level" },
  refinery: { key: "refinery", label: "Refinery", cost: { steel: 4 }, upgradeCost: { steel: 6 }, desc: "+2 Fuel per level" },
  fortifications: { key: "fortifications", label: "Fortifications", cost: { steel: 5 }, upgradeCost: { steel: 7 }, desc: "Defenders +1 defense per level" },
  airstrip: { key: "airstrip", label: "Airstrip", cost: { steel: 3, fuel: 3 }, desc: "Deploys Prop Fighters" },
};

export const BUILDING_KEYS = ["barracks", "foundry", "refinery", "fortifications", "airstrip"];

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