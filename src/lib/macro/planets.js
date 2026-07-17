// Planetary star chart data — three detailed worlds carrying the node-and-route
// system. Cindara hosts the original abandoned continent (MACRO_NODES); every
// world is fleshed out with procedurally seeded settlements and supply routes.
import { MACRO_NODES, MACRO_ROUTES } from "@/lib/macro/graph";

// Deterministic RNG so the chart is identical for every commander
export const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function latLonToXYZ(lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

// Angular separation between two surface points, in degrees
const angDeg = (a, b) => {
  const A = latLonToXYZ(a.lat, a.lon, 1);
  const B = latLonToXYZ(b.lat, b.lon, 1);
  const dot = Math.min(Math.max(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1), 1);
  return (Math.acos(dot) * 180) / Math.PI;
};

const PREFIX = ["Ash", "Iron", "Rust", "Grey", "Black", "Pale", "Cold", "Dust", "Slag", "Tar", "Bone", "Cinder", "Salt", "Storm", "Coal", "Brass", "Mire", "Fen", "Krael", "Vost", "Dead", "Low", "Red", "Gaunt", "Hollow"];
const SUFFIX = ["fall", "reach", "moor", "hold", "gate", "yard", "haven", "spur", "cross", "field", "quay", "ridge", "hollow", "works", "barrow", "march", "point", "deep", "watch", "stead"];
const KIND_POOL = ["town", "town", "town", "depot", "depot", "crossroads", "crossroads", "ruin", "ruin", "city"];

function makeName(rand, used) {
  for (let i = 0; i < 60; i++) {
    const n = PREFIX[(rand() * PREFIX.length) | 0] + SUFFIX[(rand() * SUFFIX.length) | 0];
    if (!used.has(n)) { used.add(n); return n; }
  }
  const fallback = `Station ${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

// Seeded route mileage: scaled so a standard column (16 mi/day) marches between
// major neighbors in the locked 2–6 day band (docs/MACRO_MAP.md §7); longer
// track/trail spans read as deliberate strategic hauls, not the norm.
const milesFor = (d) => Math.min(160, Math.max(30, Math.round(d * 4.5)));
const qualityFor = (d, rand) =>
  d < 13 ? (rand() < 0.35 ? "highway" : "road") : d < 21 ? (rand() < 0.5 ? "road" : "track") : d < 30 ? "track" : "trail";

// Scatter `count` settlements over a sphere and lace them with 2–3 routes each
function generateWorld(seed, count, baseNodes = [], baseRoutes = []) {
  const rand = mulberry32(seed);
  const nodes = [...baseNodes];
  const used = new Set(nodes.map((n) => n.name));
  let serial = 0, guard = 0;
  while (nodes.length < baseNodes.length + count && guard++ < count * 40) {
    const cand = {
      id: `p${seed}_${serial++}`,
      name: makeName(rand, used),
      kind: KIND_POOL[(rand() * KIND_POOL.length) | 0],
      lat: rand() * 150 - 75,
      lon: rand() * 360 - 180,
    };
    if (nodes.every((n) => angDeg(n, cand) > 8.5)) nodes.push(cand);
    else used.delete(cand.name);
  }
  const routes = baseRoutes.map((r) => [...r]);
  const has = (a, b) => routes.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  for (const n of nodes.slice(baseNodes.length)) {
    const near = nodes.filter((o) => o !== n).map((o) => ({ o, d: angDeg(n, o) })).sort((a, b) => a.d - b.d);
    const links = 2 + (rand() < 0.35 ? 1 : 0);
    for (const { o, d } of near.slice(0, links)) {
      if (d > 42 || has(n.id, o.id)) continue;
      routes.push([n.id, o.id, milesFor(d), qualityFor(d, rand)]);
    }
  }
  // Connectivity pass — every settlement must be reachable overland. Bridge each
  // isolated cluster to the main graph through its closest pair of settlements.
  const parent = {};
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const n of nodes) parent[n.id] = n.id;
  for (const [a, b] of routes) parent[find(a)] = find(b);
  for (;;) {
    const comps = new Map();
    for (const n of nodes) {
      const root = find(n.id);
      if (!comps.has(root)) comps.set(root, []);
      comps.get(root).push(n);
    }
    if (comps.size <= 1) break;
    const [main, ...rest] = [...comps.values()].sort((a, b) => b.length - a.length);
    let best = null;
    for (const island of rest) {
      for (const a of island) {
        for (const b of main) {
          const d = angDeg(a, b);
          if (!best || d < best.d) best = { a, b, d };
        }
      }
    }
    routes.push([best.a.id, best.b.id, milesFor(best.d), qualityFor(best.d, rand)]);
    parent[find(best.a.id)] = find(best.b.id);
  }
  return { nodes, routes };
}

// The original abandoned continent is authored in lat/lon (graph.js) and drapes
// over Cindara's northern hemisphere as-is.
const cindara = generateWorld(1917, 45, MACRO_NODES, MACRO_ROUTES);
const veyra = generateWorld(2044, 55);
const morhollow = generateWorld(3121, 45);

export const PLANETS = [
  {
    id: "cindara", name: "Cindara", radius: 4, spin: 0.03, seed: 1917,
    blurb: "The ash world. Home front of the abandoned continent — every column and convoy of the war crawls its grey crust.",
    palette: { base: "#46423c", high: "#6e675c", low: "#26241f", accent: "#8a3e2f", atmo: "#b0533f", caps: "#9a958c", storm: { color: "#7a6f60", opacity: 0.26, speed: 0.05 } },
    ...cindara,
  },
  {
    id: "veyra", name: "Veyra", radius: 3.4, spin: 0.045, seed: 2044,
    blurb: "A rust desert of dead foundry belts and dune-buried highways. Its depots still hold pre-collapse fuel.",
    palette: { base: "#6b4a2c", high: "#8f6a3a", low: "#3a2917", accent: "#b5722f", atmo: "#d18a3f", caps: "#c9b89a", storm: { color: "#c98a45", opacity: 0.34, speed: 0.1 } },
    ...veyra,
  },
  {
    id: "morhollow", name: "Morhollow", radius: 3.1, spin: 0.02, seed: 3121,
    blurb: "A frozen marsh-world of brine fogs and salt-ice quays. Trails vanish under the frost between seasons.",
    palette: { base: "#3d4a4a", high: "#5f7373", low: "#222b2b", accent: "#7a93a5", atmo: "#8fb3c6", caps: "#dfe8ea", storm: { color: "#aec4cc", opacity: 0.28, speed: 0.03 } },
    ...morhollow,
  },
];