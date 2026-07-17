// Tactical overlay analysis — pure computation, no rendering.
// Supply arteries: the routes most used by shortest marches between every pair
// of nodes (a betweenness measure over effective miles). High-value targets:
// nodes scored by intrinsic resource worth, road connectivity and artery access.

import { MACRO_NODES, MACRO_ROUTES, ROUTE_QUALITY } from "@/lib/macro/graph";

export const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// What a captured node yields — crossroads hold ground, not resources
const KIND_VALUE = {
  city: { score: 3, tag: "STEEL & MANPOWER" },
  depot: { score: 4, tag: "FUEL STOCKS" },
  ruin: { score: 3, tag: "PRECURSOR SALVAGE" },
  town: { score: 2, tag: "PROVISIONS" },
  crossroads: { score: 0, tag: null },
};

// Dijkstra over effective miles (distance throttled by route quality)
function shortestPath(from, to, adj) {
  const dist = { [from]: 0 };
  const prev = {};
  const queue = [from];
  const done = new Set();
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const cur = queue.shift();
    if (cur === to) break;
    if (done.has(cur)) continue;
    done.add(cur);
    for (const { to: nb, cost } of adj[cur] || []) {
      const nd = dist[cur] + cost;
      if (dist[nb] === undefined || nd < dist[nb]) {
        dist[nb] = nd;
        prev[nb] = cur;
        queue.push(nb);
      }
    }
  }
  if (dist[to] === undefined) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}

// Defaults to the original continent graph (Macro Lab); the 3D planet map passes
// its own per-planet nodes/routes.
export function computeTacticalOverlay(nodes = MACRO_NODES, routes = MACRO_ROUTES) {
  const adj = {};
  for (const r of routes) {
    const [a, b, miles, quality] = r;
    const cost = miles / ROUTE_QUALITY[quality].mult;
    (adj[a] = adj[a] || []).push({ to: b, cost });
    (adj[b] = adj[b] || []).push({ to: a, cost });
  }

  // Count how many optimal marches cross each route
  const usage = {};
  const ids = nodes.map((n) => n.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const path = shortestPath(ids[i], ids[j], adj);
      if (!path) continue;
      for (let k = 0; k < path.length - 1; k++) {
        const key = edgeKey(path[k], path[k + 1]);
        usage[key] = (usage[key] || 0) + 1;
      }
    }
  }
  const ranked = Object.entries(usage).sort((a, b) => b[1] - a[1]);
  const arteries = new Set(ranked.slice(0, 6).map(([k]) => k));

  // Score resource-bearing nodes: intrinsic worth + connectivity + artery access
  const degree = {};
  for (const [a, b] of routes) {
    degree[a] = (degree[a] || 0) + 1;
    degree[b] = (degree[b] || 0) + 1;
  }
  const targets = nodes
    .filter((n) => KIND_VALUE[n.kind]?.tag)
    .map((n) => {
      const arteryTouches = [...arteries].filter((k) => k.split("|").includes(n.id)).length;
      return {
        id: n.id,
        tag: KIND_VALUE[n.kind].tag,
        score: KIND_VALUE[n.kind].score * 2 + (degree[n.id] || 0) * 0.7 + arteryTouches,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((t, i) => ({ ...t, priority: i + 1 }));

  return { arteries, targets };
}