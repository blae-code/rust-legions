// Campaign worlds on the flat ministry chart — a bounded plane carrying the
// node-and-route system. Continents are grown AROUND node clusters (the nodes
// come first; the landmass forms to hold them), so no settlement ever ends up
// in the ocean. Landmasses are linked by sea-going Convoy Lanes.
// This generator is mirrored verbatim in gameEngine (docs/MACRO_ENGINE.md §1) —
// in play, the server generates and STORES the world; the client renders it.
import { MACRO_NODES, MACRO_ROUTES, CHART } from "@/lib/macro/graph";

// Deterministic RNG so a chart is identical for every commander
export const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const milesFor = (d) => Math.min(170, Math.max(30, Math.round(d * 1.1)));
export const seaMilesFor = (d) => Math.min(180, Math.max(60, Math.round(d * 0.9)));
const qualityFor = (d, rand) =>
  d < 55 ? (rand() < 0.35 ? "highway" : "road") : d < 95 ? (rand() < 0.5 ? "road" : "track") : d < 140 ? "track" : "trail";

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

// Coastline for one node cluster: sample directions around the centroid and
// push the coast out past the farthest settlement each way, with seeded noise,
// then smooth. The +55 margin (before smoothing) keeps every node on dry land.
export function continentOutline(nodes, rand) {
  const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
  const S = 28;
  const raw = [];
  for (let i = 0; i < S; i++) {
    const a = (i / S) * Math.PI * 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    let r = 46;
    for (const n of nodes) {
      const proj = (n.x - cx) * dx + (n.y - cy) * dy;
      const perp = Math.abs(-(n.x - cx) * dy + (n.y - cy) * dx);
      if (perp < 110) r = Math.max(r, proj + 55 - perp * 0.2);
    }
    raw.push(r + rand() * 24);
  }
  const smooth = raw.map((r, i) => (raw[(i + S - 1) % S] + r * 2 + raw[(i + 1) % S]) / 4);
  return smooth.map((r, i) => {
    const a = (i / S) * Math.PI * 2;
    return [Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)];
  });
}

// Group nodes into landmasses by proximity — anything within 170 chart units
// shares a continent (a merged scatter is simply one bigger landmass)
function clusterNodes(nodes) {
  const parent = {};
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const n of nodes) parent[n.id] = n.id;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (dist(nodes[i], nodes[j]) < 170) parent[find(nodes[i].id)] = find(nodes[j].id);
    }
  }
  const groups = new Map();
  for (const n of nodes) {
    const root = find(n.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(n);
  }
  return [...groups.values()];
}

// Build the full world from placed nodes: cluster into continents, grow
// coastlines, lace any missing land routes, and bridge landmasses with Convoy
// Lanes until every settlement is reachable. Also the map builder's "survey".
export function buildWorldFromNodes(nodes, routes, seed) {
  const rand = mulberry32((seed || 1) ^ 0x5eed);
  const out = routes.map((r) => [...r]);
  const has = (a, b) => out.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const clusters = clusterNodes(nodes);

  // Lace unlinked nodes to their 2–3 nearest same-continent neighbors
  for (const cluster of clusters) {
    for (const n of cluster) {
      const linked = out.filter(([a, b]) => a === n.id || b === n.id).length;
      if (linked >= 2) continue;
      const near = cluster.filter((o) => o !== n).map((o) => ({ o, d: dist(n, o) })).sort((a, b) => a.d - b.d);
      const links = 2 + (rand() < 0.35 ? 1 : 0);
      for (const { o, d } of near.slice(0, links)) {
        if (d > 190 || has(n.id, o.id)) continue;
        out.push([n.id, o.id, milesFor(d), qualityFor(d, rand)]);
      }
    }
    // Bridge any isolated pockets within the continent
    const parent = {};
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (const n of cluster) parent[n.id] = n.id;
    const ids = new Set(cluster.map((n) => n.id));
    for (const [a, b] of out) if (ids.has(a) && ids.has(b)) parent[find(a)] = find(b);
    for (;;) {
      const comps = new Map();
      for (const n of cluster) {
        const root = find(n.id);
        if (!comps.has(root)) comps.set(root, []);
        comps.get(root).push(n);
      }
      if (comps.size <= 1) break;
      const [main, ...rest] = [...comps.values()].sort((a, b) => b.length - a.length);
      let best = null;
      for (const island of rest) for (const a of island) for (const b of main) {
        const d = dist(a, b);
        if (!best || d < best.d) best = { a, b, d };
      }
      out.push([best.a.id, best.b.id, milesFor(best.d), best.d < 140 ? "track" : "trail"]);
      parent[find(best.a.id)] = find(best.b.id);
    }
  }

  // Convoy Lanes: bridge continents by their closest coastal pair
  const cparent = clusters.map((_, i) => i);
  const cfind = (i) => (cparent[i] === i ? i : (cparent[i] = cfind(cparent[i])));
  for (;;) {
    const comps = new Set(clusters.map((_, i) => cfind(i)));
    if (comps.size <= 1) break;
    let best = null;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (cfind(i) === cfind(j)) continue;
        for (const a of clusters[i]) for (const b of clusters[j]) {
          const d = dist(a, b);
          if (!best || d < best.d) best = { a, b, d, i, j };
        }
      }
    }
    out.push([best.a.id, best.b.id, seaMilesFor(best.d), "sealane"]);
    cparent[cfind(best.i)] = cfind(best.j);
  }

  const continents = clusters.map((cluster, i) => ({
    id: `land_${i}`,
    nodeIds: cluster.map((n) => n.id),
    outline: continentOutline(cluster, rand),
  }));
  return { nodes, routes: out, continents, size: { ...CHART } };
}

// Scatter a fresh world: spread cluster centers, grow settlements around them
function generateWorld(spec) {
  const rand = mulberry32(spec.seed);
  const nodes = spec.authored ? MACRO_NODES.map((n) => ({ ...n })) : [];
  const routes = spec.authored ? MACRO_ROUTES.map((r) => [...r]) : [];
  const used = new Set(nodes.map((n) => n.name));
  const avoid = spec.authored
    ? { x: nodes.reduce((s, n) => s + n.x, 0) / nodes.length, y: nodes.reduce((s, n) => s + n.y, 0) / nodes.length }
    : null;

  const centers = [];
  let guard = 0;
  while (centers.length < spec.clusters && guard++ < 500) {
    const c = { x: 170 + rand() * (CHART.w - 340), y: 140 + rand() * (CHART.h - 280) };
    if (centers.every((o) => dist(c, o) > 330) && (!avoid || dist(c, avoid) > 330)) centers.push(c);
  }

  let serial = 0;
  centers.forEach((center, ci) => {
    const share = Math.ceil(spec.count / centers.length);
    let placed = 0, g = 0;
    while (placed < share && g++ < share * 50) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 135;
      const cand = {
        id: `w${spec.seed}_${ci}_${serial++}`,
        name: makeName(rand, used),
        kind: KIND_POOL[(rand() * KIND_POOL.length) | 0],
        x: Math.round(Math.min(Math.max(center.x + Math.cos(a) * r, 45), CHART.w - 45)),
        y: Math.round(Math.min(Math.max(center.y + Math.sin(a) * r, 45), CHART.h - 45)),
      };
      if (nodes.every((n) => dist(n, cand) > 26)) { nodes.push(cand); placed++; }
      else used.delete(cand.name);
    }
  });

  return buildWorldFromNodes(nodes, routes, spec.seed);
}

export const WORLDS = [
  {
    id: "cindara", name: "Cindara", seed: 1917, count: 45, clusters: 2, authored: true,
    blurb: "The ash theater. The abandoned home continent in the west, with charted landmasses across the convoy lanes.",
    palette: { land: "#141821", coast: "#C9A227", grid: "#7a6a3a", sea: "#7A93A5", accent: "#8a3e2f" },
  },
  {
    id: "veyra", name: "Veyra", seed: 2044, count: 55, clusters: 3, authored: false,
    blurb: "A rust archipelago of dead foundry belts and dune-buried highways. Its depots still hold pre-collapse fuel.",
    palette: { land: "#1a1712", coast: "#B5722F", grid: "#8a6a3a", sea: "#9a927f", accent: "#b5722f" },
  },
  {
    id: "morhollow", name: "Morhollow", seed: 3121, count: 45, clusters: 2, authored: false,
    blurb: "A frozen brine-fog theater of salt-ice quays. Trails vanish under the frost between seasons.",
    palette: { land: "#131a1a", coast: "#7A93A5", grid: "#4a6a70", sea: "#8fb3c6", accent: "#7a93a5" },
  },
].map((w) => ({ ...w, ...generateWorld(w) }));
