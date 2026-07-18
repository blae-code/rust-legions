// Macro-engine parity guardrails (slice M1 — docs/MACRO_ENGINE.md §1).
// The macro world generator and march tables live in BOTH gameEngine (the
// authority) and src/lib/macro (the client mirror the War Table renders from).
// These tests lift the server literals out of the Deno function and compare
// them against the frontend mirrors, extending CLAUDE.md's one critical
// invariant to the macro layer.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";
import { MACRO_NODES, MACRO_ROUTES, ROUTE_QUALITY } from "@/lib/macro/graph";
import { UNIT_MARCH } from "@/lib/macro/march";

const src = readRepoFile("base44/functions/gameEngine/entry.ts");

describe("macro march tables match the src/lib mirrors", () => {
  it("route quality multipliers are identical", () => {
    const server = extractConst(src, "MACRO_ROUTE_QUALITY");
    const client = Object.fromEntries(Object.entries(ROUTE_QUALITY).map(([k, v]) => [k, v.mult]));
    expect(server).toEqual(client);
  });

  it("unit day-rates and ground flags are identical", () => {
    const server = extractConst(src, "MACRO_UNIT_MARCH");
    const client = Object.fromEntries(
      Object.entries(UNIT_MARCH).map(([k, v]) => [k, { rate: v.rate, ground: v.ground }])
    );
    expect(server).toEqual(client);
  });
});

describe("the authored continent matches the src/lib mirror", () => {
  it("nodes are identical (ids, kinds, lat/lon)", () => {
    const server = extractConst(src, "MACRO_CONTINENT_NODES");
    expect(server).toEqual(MACRO_NODES);
  });

  it("routes are identical (endpoints, miles, quality)", () => {
    const server = extractConst(src, "MACRO_CONTINENT_ROUTES");
    expect(server).toEqual(MACRO_ROUTES.map((r) => [...r]));
  });
});

describe("the seeded-world generator matches the src/lib mirror", () => {
  it("mileage formulas and world specs are identical", () => {
    // The generator itself is exercised by test/macro-pacing.test.js on the
    // client side; here we lock the shared numeric knobs so a drift in either
    // copy of the mileage formulas or the world catalog fails CI.
    const serverWorlds = extractConst(src, "MACRO_WORLDS");
    expect(serverWorlds.cindara).toEqual({ seed: 1917, count: 45, clusters: 2, authored: true });
    expect(serverWorlds.veyra).toEqual({ seed: 2044, count: 55, clusters: 3 });
    expect(serverWorlds.morhollow).toEqual({ seed: 3121, count: 45, clusters: 2 });
    // land miles: clamp(30, d*1.1, 170) · sea miles: clamp(60, d*0.9, 180)
    expect(src).toMatch(/macroMilesFor = \(d\) => Math\.min\(170, Math\.max\(30, Math\.round\(d \* 1\.1\)\)\)/);
    expect(src).toMatch(/macroSeaMilesFor = \(d\) => Math\.min\(180, Math\.max\(60, Math\.round\(d \* 0\.9\)\)\)/);
  });
});
