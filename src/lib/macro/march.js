// GURPS-style day-rate marching. 1 turn = 1 in-game day. A column moves at the
// day-rate of its slowest ground element; route quality multiplies that pace.
import { MACRO_ROUTES, ROUTE_QUALITY } from "@/lib/macro/graph";

// Miles per day on a standard paved road
export const UNIT_MARCH = {
  riflemen: { label: "Riflemen", rate: 20, ground: true },
  crawler: { label: "Crawlers", rate: 16, ground: true },
  artillery: { label: "Artillery", rate: 12, ground: true },
  fighter: { label: "Air Wing", rate: 90, ground: false }, // flies ahead — never slows the column
};

// The column's day-rate = slowest ground unit present; null if no ground units
export function armyDayRate(regiments = {}) {
  let rate = null;
  for (const [k, def] of Object.entries(UNIT_MARCH)) {
    if (!def.ground || (regiments[k] || 0) <= 0) continue;
    rate = rate === null ? def.rate : Math.min(rate, def.rate);
  }
  return rate;
}

// Days to traverse one route at the given day-rate
export const routeDays = (route, dayRate) =>
  route[2] / (dayRate * ROUTE_QUALITY[route[3]].mult);

// Dijkstra over the route graph, minimizing total march days
export function findPath(fromId, toId, dayRate, routes = MACRO_ROUTES) {
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
    for (const route of routes) {
      const [a, b] = route;
      if (a !== cur && b !== cur) continue;
      const next = a === cur ? b : a;
      if (done.has(next)) continue;
      const nd = dist[cur] + routeDays(route, dayRate);
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

// Break a path into legs with cumulative day windows, plus end-of-day waypoints
// (leg index + fraction along it) for rendering the column's overnight camps.
export function planMarch(path, dayRate, routes = MACRO_ROUTES) {
  const legs = [];
  let elapsed = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const route = routes.find(
      ([a, b]) => (a === path[i] && b === path[i + 1]) || (a === path[i + 1] && b === path[i])
    );
    const days = routeDays(route, dayRate);
    legs.push({ from: path[i], to: path[i + 1], miles: route[2], quality: route[3], days, start: elapsed, end: elapsed + days });
    elapsed += days;
  }
  const camps = [];
  for (let d = 1; d < elapsed; d++) {
    const leg = legs.find((l) => d >= l.start && d < l.end);
    if (leg) camps.push({ day: d, legIndex: legs.indexOf(leg), t: (d - leg.start) / leg.days });
  }
  return { legs, camps, totalDays: elapsed, arrivalDay: Math.ceil(elapsed) };
}