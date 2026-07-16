// Macro map logic layer — a node-and-route graph. Nodes are settlements, depots
// and crossroads on the abandoned continent; routes carry a real distance in miles
// and a quality grade that throttles march speed. Coordinates are in a 0–100 × 0–70
// map space for the painterly client map.

export const ROUTE_QUALITY = {
  highway: { label: "Imperial Highway", mult: 1.25, desc: "Cracked but drivable ferrocrete" },
  road: { label: "Paved Road", mult: 1.0, desc: "Pre-collapse paving, potholed" },
  track: { label: "Dirt Track", mult: 0.75, desc: "Rutted haul-road, mud in the wet" },
  trail: { label: "Wilderness Trail", mult: 0.5, desc: "Goat paths and dry riverbeds" },
};

export const NODE_KINDS = {
  city: { label: "Ruined City", r: 3.2 },
  town: { label: "Township", r: 2.4 },
  depot: { label: "Fuel Depot", r: 2.4 },
  crossroads: { label: "Crossroads", r: 1.8 },
  ruin: { label: "Deep Ruin", r: 2.0 },
};

export const MACRO_NODES = [
  { id: "kesselgrad", name: "Kesselgrad", kind: "city", x: 12, y: 18 },
  { id: "ashvale", name: "Ashvale", kind: "town", x: 30, y: 9 },
  { id: "rustwater", name: "Rustwater", kind: "city", x: 52, y: 7 },
  { id: "ironmoor", name: "Ironmoor", kind: "town", x: 78, y: 11 },
  { id: "veldt_cross", name: "Veldt Cross", kind: "crossroads", x: 24, y: 32 },
  { id: "foundry_91", name: "Foundry 91", kind: "depot", x: 44, y: 26 },
  { id: "greyspire", name: "Greyspire", kind: "city", x: 66, y: 28 },
  { id: "pale_marsh", name: "Pale Marsh", kind: "ruin", x: 89, y: 30 },
  { id: "cinder_flats", name: "Cinder Flats", kind: "depot", x: 13, y: 48 },
  { id: "old_lorry", name: "Old Lorry", kind: "town", x: 34, y: 46 },
  { id: "saltglass", name: "Saltglass", kind: "crossroads", x: 56, y: 44 },
  { id: "verge", name: "The Verge", kind: "city", x: 78, y: 48 },
  { id: "thornfield", name: "Thornfield", kind: "ruin", x: 27, y: 62 },
  { id: "terminus", name: "Terminus", kind: "city", x: 57, y: 63 },
  { id: "black_quay", name: "Black Quay", kind: "town", x: 86, y: 64 },
];

// Bidirectional routes: [nodeA, nodeB, miles, quality]
export const MACRO_ROUTES = [
  ["kesselgrad", "ashvale", 42, "road"],
  ["ashvale", "rustwater", 48, "highway"],
  ["rustwater", "ironmoor", 55, "highway"],
  ["kesselgrad", "veldt_cross", 38, "road"],
  ["ashvale", "veldt_cross", 46, "track"],
  ["veldt_cross", "foundry_91", 40, "road"],
  ["rustwater", "foundry_91", 44, "track"],
  ["foundry_91", "greyspire", 46, "road"],
  ["rustwater", "greyspire", 52, "road"],
  ["ironmoor", "greyspire", 42, "track"],
  ["ironmoor", "pale_marsh", 46, "trail"],
  ["greyspire", "pale_marsh", 50, "trail"],
  ["veldt_cross", "cinder_flats", 40, "track"],
  ["kesselgrad", "cinder_flats", 62, "trail"],
  ["veldt_cross", "old_lorry", 36, "road"],
  ["old_lorry", "foundry_91", 44, "track"],
  ["old_lorry", "saltglass", 44, "road"],
  ["foundry_91", "saltglass", 42, "track"],
  ["saltglass", "greyspire", 38, "road"],
  ["saltglass", "verge", 46, "highway"],
  ["greyspire", "verge", 45, "road"],
  ["verge", "pale_marsh", 40, "trail"],
  ["cinder_flats", "thornfield", 42, "trail"],
  ["old_lorry", "thornfield", 38, "track"],
  ["thornfield", "terminus", 58, "road"],
  ["saltglass", "terminus", 40, "road"],
  ["terminus", "black_quay", 56, "highway"],
  ["verge", "black_quay", 38, "road"],
];

export const nodeById = (id) => MACRO_NODES.find((n) => n.id === id);
export const routeBetween = (a, b) =>
  MACRO_ROUTES.find(([x, y]) => (x === a && y === b) || (x === b && y === a));