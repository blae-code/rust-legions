// Macro map logic layer — a node-and-route graph. Nodes are settlements, depots
// and crossroads; routes carry a real distance in miles and a quality grade that
// throttles march speed. Node positions are canonical x/y on the flat ministry
// chart (docs/MACRO_MAP.md — the chart plane is 1000 × 620 chart units).

export const CHART = { w: 1000, h: 620 };

export const ROUTE_QUALITY = {
  highway: { label: "Imperial Highway", mult: 1.25, desc: "Cracked but drivable ferrocrete" },
  road: { label: "Paved Road", mult: 1.0, desc: "Pre-collapse paving, potholed" },
  track: { label: "Dirt Track", mult: 0.75, desc: "Rutted haul-road, mud in the wet" },
  trail: { label: "Wilderness Trail", mult: 0.5, desc: "Goat paths and dry riverbeds" },
  sealane: { label: "Convoy Lane", mult: 0.6, desc: "Chartered coastal shipping between landmasses" },
};

export const NODE_KINDS = {
  city: { label: "Ruined City" },
  town: { label: "Township" },
  depot: { label: "Fuel Depot" },
  crossroads: { label: "Crossroads" },
  ruin: { label: "Deep Ruin" },
};

// The authored home continent, placed on the chart's western reach
export const MACRO_NODES = [
  { id: "kesselgrad", name: "Kesselgrad", kind: "city", x: 113, y: 135 },
  { id: "ashvale", name: "Ashvale", kind: "town", x: 178, y: 102 },
  { id: "rustwater", name: "Rustwater", kind: "city", x: 257, y: 95 },
  { id: "ironmoor", name: "Ironmoor", kind: "town", x: 351, y: 110 },
  { id: "veldt_cross", name: "Veldt Cross", kind: "crossroads", x: 156, y: 185 },
  { id: "foundry_91", name: "Foundry 91", kind: "depot", x: 228, y: 164 },
  { id: "greyspire", name: "Greyspire", kind: "city", x: 308, y: 171 },
  { id: "pale_marsh", name: "Pale Marsh", kind: "ruin", x: 390, y: 178 },
  { id: "cinder_flats", name: "Cinder Flats", kind: "depot", x: 117, y: 243 },
  { id: "old_lorry", name: "Old Lorry", kind: "town", x: 192, y: 236 },
  { id: "saltglass", name: "Saltglass", kind: "crossroads", x: 272, y: 228 },
  { id: "verge", name: "The Verge", kind: "city", x: 351, y: 243 },
  { id: "thornfield", name: "Thornfield", kind: "ruin", x: 167, y: 293 },
  { id: "terminus", name: "Terminus", kind: "city", x: 275, y: 297 },
  { id: "black_quay", name: "Black Quay", kind: "town", x: 380, y: 300 },
];

// Bidirectional routes: [nodeA, nodeB, miles, quality] — authored miles are
// hand-tuned for pacing and independent of drawn length
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
