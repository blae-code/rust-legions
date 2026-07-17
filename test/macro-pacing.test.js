// Macro-map pacing guardrails. docs/MACRO_MAP.md §7 sets the balance target:
// marches between major neighbors land in a 2–6 day band for a standard column,
// and every settlement on a library world must be reachable overland. These
// tests lock that band for all curated planets so a regenerated world or a
// mileage-formula drift fails CI instead of silently wrecking campaign pacing.
import { describe, it, expect } from "vitest";
import { PLANETS } from "@/lib/macro/planets";
import { ROUTE_QUALITY } from "@/lib/macro/graph";

// Riflemen + crawlers — the reference column; the crawler sets the pace
const STANDARD_RATE = 16;
const routeDays = ([, , miles, quality]) => miles / (STANDARD_RATE * ROUTE_QUALITY[quality].mult);

describe.each(PLANETS.map((p) => [p.name, p]))("library world %s", (_name, planet) => {
  it("every settlement is reachable overland from every other", () => {
    const adj = {};
    for (const [a, b] of planet.routes) {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    }
    const seen = new Set([planet.nodes[0].id]);
    const queue = [planet.nodes[0].id];
    while (queue.length) {
      for (const nb of adj[queue.shift()] || []) {
        if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }
      }
    }
    expect(seen.size).toBe(planet.nodes.length);
  });

  it("routes only reference charted settlements", () => {
    const ids = new Set(planet.nodes.map((n) => n.id));
    for (const [a, b] of planet.routes) {
      expect(ids.has(a)).toBe(true);
      expect(ids.has(b)).toBe(true);
    }
  });

  it("major-neighbor marches (road/highway) sit in the 2–6 day band", () => {
    const days = planet.routes
      .filter(([, , , q]) => q === "road" || q === "highway")
      .map(routeDays)
      .sort((a, b) => a - b);
    expect(days.length).toBeGreaterThan(0);
    const median = days[(days.length / 2) | 0];
    expect(median).toBeGreaterThanOrEqual(2);
    expect(median).toBeLessThanOrEqual(6);
    for (const d of days) expect(d).toBeLessThanOrEqual(6.5);
  });

  it("no single route exceeds a 20-day haul for a standard column", () => {
    for (const r of planet.routes) expect(routeDays(r)).toBeLessThanOrEqual(20);
  });
});
