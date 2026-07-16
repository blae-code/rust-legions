export const UNIT_TYPES = {
  riflemen: { key: "riflemen", label: "Riflemen", cost: 3, attack: 1, defense: 2, domain: "land" },
  crawler: { key: "crawler", label: "Diesel Crawler", cost: 6, attack: 3, defense: 2, domain: "land" },
  gunboat: { key: "gunboat", label: "Ironclad Gunboat", cost: 7, attack: 2, defense: 2, domain: "sea" },
  fighter: { key: "fighter", label: "Prop Fighter", cost: 10, attack: 3, defense: 1, domain: "air" },
};

export const UNIT_KEYS = ["riflemen", "crawler", "gunboat", "fighter"];

export const RESOURCE_LABELS = {
  oil_field: "Oil Field (+2 income)",
  coal_depot: "Coal Depot (+1 income)",
  iron_foundry: "Iron Foundry (Crawler −1 cost)",
};

export const totalUnits = (units = {}) =>
  UNIT_KEYS.reduce((sum, k) => sum + (units[k] || 0), 0);