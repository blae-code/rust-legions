// Macro map logic layer — a node-and-route graph. Nodes are settlements, depots
// and crossroads on the abandoned continent; routes carry a real distance in miles
// and a quality grade that throttles march speed. Node positions are canonical
// lat/lon on the campaign world (docs/MACRO_MAP.md §3.2) — the continent drapes
// over Cindara's northern hemisphere.

export const ROUTE_QUALITY = {
  highway: { label: "Imperial Highway", mult: 1.25, desc: "Cracked but drivable ferrocrete" },
  road: { label: "Paved Road", mult: 1.0, desc: "Pre-collapse paving, potholed" },
  track: { label: "Dirt Track", mult: 0.75, desc: "Rutted haul-road, mud in the wet" },
  trail: { label: "Wilderness Trail", mult: 0.5, desc: "Goat paths and dry riverbeds" },
};

export const NODE_KINDS = {
  city: { label: "Ruined City" },
  town: { label: "Township" },
  depot: { label: "Fuel Depot" },
  crossroads: { label: "Crossroads" },
  ruin: { label: "Deep Ruin" },
};

export const MACRO_NODES = [
  { id: "kesselgrad", name: "Kesselgrad", kind: "city", lat: 23.6, lon: -61 },
  { id: "ashvale", name: "Ashvale", kind: "town", lat: 30.8, lon: -47.5 },
  { id: "rustwater", name: "Rustwater", kind: "city", lat: 32.4, lon: -31 },
  { id: "ironmoor", name: "Ironmoor", kind: "town", lat: 29.2, lon: -11.5 },
  { id: "veldt_cross", name: "Veldt Cross", kind: "crossroads", lat: 12.4, lon: -52 },
  { id: "foundry_91", name: "Foundry 91", kind: "depot", lat: 17.2, lon: -37 },
  { id: "greyspire", name: "Greyspire", kind: "city", lat: 15.6, lon: -20.5 },
  { id: "pale_marsh", name: "Pale Marsh", kind: "ruin", lat: 14, lon: -3.25 },
  { id: "cinder_flats", name: "Cinder Flats", kind: "depot", lat: -0.4, lon: -60.25 },
  { id: "old_lorry", name: "Old Lorry", kind: "town", lat: 1.2, lon: -44.5 },
  { id: "saltglass", name: "Saltglass", kind: "crossroads", lat: 2.8, lon: -28 },
  { id: "verge", name: "The Verge", kind: "city", lat: -0.4, lon: -11.5 },
  { id: "thornfield", name: "Thornfield", kind: "ruin", lat: -11.6, lon: -49.75 },
  { id: "terminus", name: "Terminus", kind: "city", lat: -12.4, lon: -27.25 },
  { id: "black_quay", name: "Black Quay", kind: "town", lat: -13.2, lon: -5.5 },
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
