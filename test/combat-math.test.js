// Combat-math guardrails. The mass-combat numbers live ONLY in the backend
// gameEngine (the frontend mirror carries labels, not the skill/damage stats),
// and docs/GAME_RULES.md §9–§10 is their published source of truth. These tests
// lock the implemented maneuver table, casualty order, and strength-mod formula
// to the documented ruleset, so a silent balance drift in either direction fails CI.
import { describe, it, expect } from "vitest";
import { readRepoFile, extractConst } from "./helpers/extract-const.js";

const src = readRepoFile("base44/functions/gameEngine/entry.ts");
const MANEUVERS = extractConst(src, "MANEUVERS");
const CASUALTY_ORDER = extractConst(src, "CASUALTY_ORDER");

// The maneuver table exactly as published in docs/GAME_RULES.md §9.
// [skill, dmgOut, dmgIn, moraleOut]; signatures also carry a cooldown.
const DOCUMENTED = {
  all_out_attack: { skill: -2, dmgOut: 1.6, dmgIn: 1.5, moraleOut: 1.3 },
  attack: { skill: 0, dmgOut: 1.0, dmgIn: 1.0, moraleOut: 1.0 },
  defend: { skill: 2, dmgOut: 0.5, dmgIn: 0.6, moraleOut: 0.7 },
  flank: { skill: -1, dmgOut: 1.3, dmgIn: 0.8, moraleOut: 1.5 },
  feint: { skill: 1, dmgOut: 0.3, dmgIn: 0.7, moraleOut: 0.8 },
  rally: { skill: 0, dmgOut: 0.2, dmgIn: 0.9, moraleOut: 0.5 },
  relentless_pursuit: { skill: -1, dmgOut: 1.5, dmgIn: 1.2, moraleOut: 1.9, cooldown: 4 },
  ambush: { skill: 2, dmgOut: 1.3, dmgIn: 0.7, moraleOut: 1.2, cooldown: 3 },
  iron_wall: { skill: 3, dmgOut: 0.3, dmgIn: 0.35, moraleOut: 0.6, cooldown: 3 },
  inspiring_charge: { skill: 0, dmgOut: 1.1, dmgIn: 1.0, moraleOut: 1.2, cooldown: 2 },
};

describe("maneuver table matches docs/GAME_RULES.md §9", () => {
  it("implements exactly the documented maneuver set", () => {
    expect(Object.keys(MANEUVERS).sort()).toEqual(Object.keys(DOCUMENTED).sort());
  });

  for (const [key, doc] of Object.entries(DOCUMENTED)) {
    it(`${key}: skill/dmgOut/dmgIn/moraleOut (and cooldown) match the ruleset`, () => {
      const m = MANEUVERS[key];
      expect(m.skill).toBe(doc.skill);
      expect(m.dmgOut).toBe(doc.dmgOut);
      expect(m.dmgIn).toBe(doc.dmgIn);
      expect(m.moraleOut).toBe(doc.moraleOut);
      if (doc.cooldown !== undefined) {
        expect(m.cooldown).toBe(doc.cooldown);
        expect(m.signature).toBe(true);
      }
    });
  }
});

describe("casualty removal order (docs §4)", () => {
  it("is riflemen → crawler → gunboat → artillery → fighter", () => {
    expect(CASUALTY_ORDER).toEqual(["riflemen", "crawler", "gunboat", "artillery", "fighter"]);
  });
});

describe("strength-mod formula (docs §9)", () => {
  // Reference implementation of the documented formula, matched to the exact
  // expression at gameEngine entry.ts:1162.
  const strengthMod = (myPoints, foePoints) =>
    Math.max(Math.min(Math.round(Math.log2(myPoints / foePoints) * 2), 4), -4);

  it("evenly matched forces get no bonus", () => {
    expect(strengthMod(100, 100)).toBe(0);
  });

  it("2× strength → +2, 4× → +4", () => {
    expect(strengthMod(200, 100)).toBe(2);
    expect(strengthMod(400, 100)).toBe(4);
  });

  it("half strength → −2, quarter → −4", () => {
    expect(strengthMod(100, 200)).toBe(-2);
    expect(strengthMod(100, 400)).toBe(-4);
  });

  it("clamps to the ±4 band no matter how lopsided", () => {
    expect(strengthMod(100000, 1)).toBe(4);
    expect(strengthMod(1, 100000)).toBe(-4);
  });

  it("is antisymmetric: swapping sides negates the mod", () => {
    for (const [a, b] of [[300, 100], [150, 90], [512, 64]]) {
      expect(strengthMod(a, b)).toBe(-strengthMod(b, a));
    }
  });

  // Tripwire: if the backend formula is edited, this reminds the maintainer to
  // update the documented reference above (and docs/GAME_RULES.md §9).
  it("the backend still uses the log2(ratio)*2 clamped-to-±4 expression", () => {
    expect(src).toContain("Math.round(Math.log2(ratio) * 2)");
    expect(src).toMatch(/Math\.max\(Math\.min\(Math\.round\(Math\.log2\(ratio\) \* 2\), 4\), -4\)/);
  });
});
