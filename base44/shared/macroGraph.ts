// ---------------------------------------------------------------------------
// Macro graph math — route quality, weather drag, Dijkstra pathing and the
// supply envelope (docs/MACRO_ENGINE.md §8). Pure functions over the stored
// macro chart; gameEngine owns persistence and consequences. Mirrors
// src/lib/macro/graph.js (guarded by test/macro-mirror.test.js). Lifted out of
// gameEngine/entry.ts to keep that file under the platform line limit.
// ---------------------------------------------------------------------------
export const MACRO_ROUTE_QUALITY = { highway: 1.25, road: 1.0, track: 0.75, trail: 0.5, sealane: 0.6 };
export const MACRO_SUPPLY_MILES = 220;        // effective-mile envelope from base/depots (~3 road-days)

export function macroWeatherMult(weather, regiments = {}) {
  if (weather !== 'rain' && weather !== 'snow') return 1;
  const wheels = (regiments.crawler || 0) > 0 || (regiments.artillery || 0) > 0;
  return wheels ? 0.6 : 0.85;
}

// Dijkstra over march-days for a given column pace. opts.landOnly excludes
// Convoy Lanes — the fortress-base cannot be shipped (boarding/naval is ahead).
export function macroFindPath(macro, fromId, toId, dayRate, opts = {}) {
  if (!dayRate || fromId === toId) return null;
  const dist = { [fromId]: 0 };
  const prev = {};
  const done = new Set();
  const queue = [fromId];
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const cur = queue.shift();
    if (cur === toId) break;
    if (done.has(cur)) continue;
    done.add(cur);
    for (const route of macro.routes) {
      const [a, b, miles, quality] = route;
      if (opts.landOnly && quality === 'sealane') continue;
      if (a !== cur && b !== cur) continue;
      const next = a === cur ? b : a;
      if (done.has(next)) continue;
      const nd = dist[cur] + miles / (dayRate * MACRO_ROUTE_QUALITY[quality]);
      if (dist[next] === undefined || nd < dist[next]) {
        dist[next] = nd;
        prev[next] = cur;
        queue.push(next);
      }
    }
  }
  if (dist[toId] === undefined) return null;
  const path = [toId];
  while (path[0] !== fromId) path.unshift(prev[path[0]]);
  return { path, totalDays: dist[toId] };
}

// Supply envelope: effective-mile reach from the fortress-base and any
// controlled fuel depot, flowing only through routes whose far node the faction
// controls or that stand neutral. Returns the Set of in-supply node ids.
export function macroSupplied(game, slotIdx) {
  const macro = game.macro;
  if (!macro?.nodes) return new Set();
  const passable = (nid) => macro.control[nid] === slotIdx || macro.control[nid] === null || macro.control[nid] === undefined;
  const sources = [];
  const base = macro.bases?.[String(slotIdx)];
  if (base?.nodeId) sources.push(base.nodeId);
  for (const n of macro.nodes) if (n.kind === 'depot' && macro.control[n.id] === slotIdx) sources.push(n.id);
  const dist = {};
  const queue = [];
  for (const s of sources) { dist[s] = 0; queue.push(s); }
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const cur = queue.shift();
    for (const route of macro.routes) {
      const [a, b, miles, quality] = route;
      if (a !== cur && b !== cur) continue;
      const next = a === cur ? b : a;
      if (!passable(next)) continue;
      const nd = dist[cur] + miles / MACRO_ROUTE_QUALITY[quality]; // effective miles
      if (nd > MACRO_SUPPLY_MILES) continue;
      if (dist[next] === undefined || nd < dist[next]) { dist[next] = nd; queue.push(next); }
    }
  }
  return new Set(Object.keys(dist));
}