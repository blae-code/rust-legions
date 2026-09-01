// Pins the extractor itself. extractConst is the reader behind every
// rules-mirror assertion, so a regression here reports as "the data drifted"
// on the suites that depend on it — which is the wrong diagnosis and the exact
// defect this file exists to prevent. Case (c) is the important one: it fails
// if a future change quietly stops following chains again.
import { describe, it, expect } from "vitest";
import { extractConst } from "./helpers/extract-const.js";

describe("extractConst", () => {
  it("extracts a plain object literal unchanged", () => {
    const src = `
      const OTHER = 1;
      const TABLE = {
        a: { cost: 2 }, // trailing comment with a } brace
        b: { cost: 3, label: "]" },
      };
      const AFTER = 2;
    `;
    expect(extractConst(src, "TABLE")).toEqual({ a: { cost: 2 }, b: { cost: 3, label: "]" } });
  });

  it("evaluates a trailing .map() so the value matches the module's runtime value", () => {
    const src =
      "const NODES = [['a','A','city',1,2], ['b','B','town',3,4]]" +
      ".map(([id, name, kind, x, y]) => ({ id, name, kind, x, y }));";
    expect(extractConst(src, "NODES")).toEqual([
      { id: "a", name: "A", kind: "city", x: 1, y: 2 },
      { id: "b", name: "B", kind: "town", x: 3, y: 4 },
    ]);
  });

  it("follows a multi-step allowlisted chain across newlines", () => {
    const src = `
      const XS = [1, 2, 3, 4]
        .filter((n) => n % 2 === 0)
        .map((n) => n * 10);
    `;
    expect(extractConst(src, "XS")).toEqual([20, 40]);
  });

  it("throws loudly on a chained method that is not a pure array transform", () => {
    const src = "const TOTAL = [1, 2, 3].reduce((a, b) => a + b, 0);";
    expect(() => extractConst(src, "TOTAL")).toThrow(/unsupported chained method \.reduce/);
  });

  it("still throws when the const is absent", () => {
    expect(() => extractConst("const OTHER = {};", "MISSING")).toThrow(/const MISSING not found/);
  });
});
