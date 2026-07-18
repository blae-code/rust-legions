// Macro-map pacing + geography guardrails. docs/MACRO_MAP.md locks the balance
// target (major-neighbor marches in a 2–6 day band for a standard column) and
// the geography contract of the flat ministry chart: continents are grown
// AROUND node clusters, so every settlement must sit on dry land, and every
// settlement must be reachable (convoy lanes bridge the landmasses). These
// tests lock all of that for every curated world so a generator drift fails CI.
import { describe, it, expect } from "vitest";
import { WORLDS } from "@/lib/macro/worlds";
import { ROUTE_QUALITY } from "@/lib/macro/graph";

// Riflemen + crawlers — the reference column; the crawler sets the pace
const STANDARD_RATE = 16;
const routeDays = ([, , miles, quality]) => miles / (STANDARD_RATE * ROUTE_QUALITY[quality].mult);

// Ray-cast point-in-polygon
function inside([px, py], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

describe.each(WORLDS.map((w) => [w.name, w]))("charted world %s", (_name, world) => {
  it("every settlement is reachable from every other (convoy lanes included)", () => {
    const adj = {};
    for (const [a, b] of world.routes) {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    }
    const seen = new Set([world.nodes[0].id]);
    const queue = [world.nodes[0].id];
    while (queue.length) {
      for (const nb of adj[queue.shift()] || []) {
        if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }
      }
    }
    expect(seen.size).toBe(world.nodes.length);
  });

  it("no settlement stands in the ocean — every node is inside its continent", () => {
    for (const continent of world.continents) {
      for (const nid of continent.nodeIds) {
        const n = world.nodes.find((x) => x.id === nid);
        expect(inside([n.x, n.y], continent.outline), `${n.name} (${n.x},${n.y}) off the coast of ${continent.id}`).toBe(true);
      }
    }
    // and every node belongs to exactly one continent
    const all = world.continents.flatMap((c) => c.nodeIds);
    expect(all.sort()).toEqual(world.nodes.map((n) => n.id).sort());
  });

  it("routes only reference charted settlements", () => {
    const ids = new Set(world.nodes.map((n) => n.id));
    for (const [a, b] of world.routes) {
      expect(ids.has(a)).toBe(true);
      expect(ids.has(b)).toBe(true);
    }
  });

  it("major-neighbor marches (road/highway) sit in the 2–6 day band", () => {
    const days = world.routes
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
    for (const r of world.routes) expect(routeDays(r), r.join("/")).toBeLessThanOrEqual(20);
  });

  it("sealanes exist only between different continents", () => {
    const continentOf = {};
    for (const c of world.continents) for (const nid of c.nodeIds) continentOf[nid] = c.id;
    for (const [a, b, , q] of world.routes) {
      if (q === "sealane") expect(continentOf[a]).not.toBe(continentOf[b]);
      else expect(continentOf[a]).toBe(continentOf[b]);
    }
  });
});
