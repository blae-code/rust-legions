// Arms-catalogue rolls and resolution (Lane I).
//
// Two things are proved here. First, PURITY: nothing in this lane may reach
// for Math.random, the clock or crypto — every roll is a seeded mulberry32
// stream so the server can reproduce any weapon it ever issued.
//
// Second, and this is the centrepiece of the whole content track: THE DESIGN
// INVARIANT THE DAMAGE MODEL EXISTS TO EXPRESS. An issue-grade rifle does
// literally zero damage to a heavy crawler — it may still pin the crew — while
// an anti-armour weapon does not. Every later step of this lane builds weapon
// patterns on top of the calibre references asserted here, so if these numbers
// move the whole catalogue moves with them.
import { describe, it, expect } from "vitest";
import { readRepoFile } from "./helpers/extract-const.js";
import {
  ARMOUR_CLASSES, CALIBRES, MANUFACTURERS, QUALITY_GRADES, PEN_TABLE,
  mulberry32, penMultFor, resolveHit, resolveAoe,
} from "@/lib/arms.js";

const SOURCES = [
  ["base44/shared/arms.ts", readRepoFile("base44/shared/arms.ts")],
  ["src/lib/arms.js", readRepoFile("src/lib/arms.js")],
];

// Small arms: everything a figure carries. None of these may scratch a heavy
// crawler at issue grade (Work item 9.8).
const SMALL_ARM_CLASSES = ["sidearm", "carbine", "rifle", "smg", "lmg", "hmg", "shotgun", "marksman", "flame"];
// Weapons bought specifically to open a hull.
const ARMOUR_KILLING_CLASSES = ["anti_armor", "crawler_gun", "artillery"];

// A WeaponBase built at a calibre's reference numbers. QUALITY_GRADES.issue is
// the neutral grade (every multiplier exactly 1), so an issue-grade, un-modded
// weapon chambered for a calibre resolves at exactly these values — which is
// what makes a calibre-level assertion a real assertion about the patterns
// that will be drawn around it.
const issueWeaponFor = (calKey, damageType = "kinetic", aoe = null) => {
  const c = CALIBRES[calKey];
  return {
    accuracy: 0.55, rateOfFire: 1, damage: c.damage, armorPen: c.armorPen,
    range: c.range, reliability: 0.9, weight: c.weight, damageType, aoe,
  };
};

describe("purity — no unseeded randomness anywhere in the lane", () => {
  for (const [name, src] of SOURCES) {
    it(`${name} contains no Math.random, Date.now or crypto`, () => {
      expect(src).not.toMatch(/Math\.random/);
      expect(src).not.toMatch(/Date\.now/);
      expect(src).not.toMatch(/\bcrypto\b/);
    });

    it(`${name} holds no mutable module-level state`, () => {
      expect(src).not.toMatch(/^(let|var) /m);
    });
  }

  it("mulberry32 is deterministic and byte-stable across streams", () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const first = [a(), a(), a(), a(), a()];
    expect([b(), b(), b(), b(), b()]).toEqual(first);
    expect(mulberry32(1235)()).not.toBe(first[0]);
    for (const v of first) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("resolveHit is referentially transparent — same input, same output, forever", () => {
    const w = issueWeaponFor("r13_line");
    const once = resolveHit({ weapon: w, target: ARMOUR_CLASSES.soft });
    for (let i = 0; i < 50; i++) {
      expect(resolveHit({ weapon: w, target: ARMOUR_CLASSES.soft })).toEqual(once);
    }
    // and it does not mutate its arguments
    expect(w).toEqual(issueWeaponFor("r13_line"));
  });
});

describe("THE ACCEPTANCE TEST — a rifle cannot scratch a heavy crawler", () => {
  it("issue is the neutral grade, so a calibre reference IS the issue-grade weapon", () => {
    expect(Object.values(QUALITY_GRADES.issue.mult).every((v) => v === 1)).toBe(true);
  });

  it("an issue-grade line rifle does ZERO effective damage to a heavy target", () => {
    const r = resolveHit({ weapon: issueWeaponFor("r13_line"), target: ARMOUR_CLASSES.heavy });
    expect(r.effective).toBe(0);
    expect(r.suppressOnly).toBe(true);
  });

  it("an issue-grade heavy anti-armour rifle does NOT", () => {
    const r = resolveHit({ weapon: issueWeaponFor("hr17_heavy"), target: ARMOUR_CLASSES.heavy });
    expect(r.effective).toBeGreaterThan(0);
    expect(r.suppressOnly).toBe(false);
  });

  it("the same rifle is perfectly effective against the men in front of it", () => {
    const w = issueWeaponFor("r13_line");
    expect(resolveHit({ weapon: w, target: ARMOUR_CLASSES.none }).effective).toBeGreaterThan(0);
    expect(resolveHit({ weapon: w, target: ARMOUR_CLASSES.soft }).effective).toBeGreaterThan(0);
    expect(resolveHit({ weapon: w, target: ARMOUR_CLASSES.light }).effective).toBeGreaterThan(0);
  });

  it("every small-arm calibre is spent on heavy AND superheavy armour", () => {
    for (const [key, c] of Object.entries(CALIBRES)) {
      if (!SMALL_ARM_CLASSES.includes(c.class)) continue;
      const type = c.class === "flame" ? "incendiary" : "kinetic";
      for (const target of ["heavy", "superheavy"]) {
        const r = resolveHit({ weapon: issueWeaponFor(key, type), target: ARMOUR_CLASSES[target] });
        expect(r.effective, `${key} vs ${target}`).toBe(0);
        expect(r.suppressOnly, `${key} vs ${target}`).toBe(true);
      }
    }
  });

  it("every armour-killing calibre bites a heavy target", () => {
    const types = { anti_armor: "kinetic", crawler_gun: "kinetic", artillery: "explosive" };
    let checked = 0;
    for (const [key, c] of Object.entries(CALIBRES)) {
      if (!ARMOUR_KILLING_CLASSES.includes(c.class)) continue;
      const r = resolveHit({ weapon: issueWeaponFor(key, types[c.class]), target: ARMOUR_CLASSES.heavy });
      expect(r.effective, `${key} vs heavy`).toBeGreaterThan(0);
      expect(r.suppressOnly, `${key} vs heavy`).toBe(false);
      checked++;
    }
    expect(checked, "no armour-killing calibres found").toBeGreaterThanOrEqual(5);
  });

  it("the small-arms penetration budget against heavy armour is under 4, with headroom for a maker's lean", () => {
    // This is the number every weapon pattern authored later must respect: a
    // pattern's base armour penetration PLUS its maker's signature must stay
    // below 4, or the pattern stops being a small arm.
    const heavy = ARMOUR_CLASSES.heavy.armourValue;
    expect(penMultFor(3.9 - heavy)).toBe(0);
    expect(penMultFor(4 - heavy)).toBeGreaterThan(0);

    const worstLean = Math.max(0, ...Object.values(MANUFACTURERS).map((m) => m.signature.armorPen || 0));
    for (const [key, c] of Object.entries(CALIBRES)) {
      if (!SMALL_ARM_CLASSES.includes(c.class)) continue;
      expect(c.armorPen + worstLean, `${key} + the heaviest maker lean (+${worstLean})`).toBeLessThan(4);
    }
  });

  it("a zero-effect hit still carries suppression weight — pinning is not nothing", () => {
    const r = resolveHit({ weapon: issueWeaponFor("mg13_sustained"), target: ARMOUR_CLASSES.heavy });
    expect(r.suppressOnly).toBe(true);
    expect(PEN_TABLE.some((row) => row.mult === 0)).toBe(true);
  });
});

describe("the damage model reads as designed against every armour class", () => {
  const CLASS_ORDER = ["none", "soft", "light", "medium", "heavy", "superheavy"];

  it("a shaped anti-armour round beats a kinetic one on plate and loses to it on flesh", () => {
    const kinetic = issueWeaponFor("hr17_heavy", "kinetic");
    const shaped = issueWeaponFor("hr17_heavy", "shaped");
    const on = (w, t) => resolveHit({ weapon: w, target: ARMOUR_CLASSES[t] }).effective;
    expect(on(shaped, "heavy")).toBeGreaterThan(on(kinetic, "heavy"));
    expect(on(shaped, "soft")).toBeLessThan(on(kinetic, "soft"));
  });

  it("a flame projector is devastating on men and cannot reduce a work", () => {
    // Two different mechanisms, and the model keeps them apart on purpose.
    // Against a SEALED hull it is the type matrix that kills incendiary — the
    // seal, not the thickness. Against POURED WORKS (unsealed, and thicker
    // than any hull) it is the penetration curve: a hand-carried projector
    // arrives with almost no penetration, so a bunker is pinned and its
    // garrison driven off their slits, never burned down. That is what the
    // incendiary/fortified multiplier is reserved for — an incendiary SHELL,
    // which arrives with real penetration behind it.
    const flame = issueWeaponFor("fg2_fuel", "incendiary");
    const on = (t) => resolveHit({ weapon: flame, target: ARMOUR_CLASSES[t] }).effective;
    expect(on("soft")).toBeGreaterThan(on("none"));
    expect(on("light")).toBeGreaterThan(0);
    expect(on("soft")).toBeGreaterThan(on("light"));
    expect(on("heavy")).toBe(0);
    expect(on("fortified")).toBe(0);

    const shell = issueWeaponFor("a105_shell", "incendiary");
    expect(resolveHit({ weapon: shell, target: ARMOUR_CLASSES.fortified }).effective).toBeGreaterThan(0);
  });

  it("a fragmentation bomb shreds soft targets and is wasted on anything plated", () => {
    const bomb = issueWeaponFor("m50_bore", "fragmentation", { radius: 1, falloff: 0.4 });
    const on = (t) => resolveHit({ weapon: bomb, target: ARMOUR_CLASSES[t] }).effective;
    expect(on("soft")).toBeGreaterThan(on("none"));
    expect(on("light")).toBeLessThan(on("soft") / 2);
    expect(on("superheavy")).toBe(0);
  });

  it("kinetic effectiveness degrades monotonically as armour thickens", () => {
    const w = issueWeaponFor("cg57_bore", "kinetic");
    const values = CLASS_ORDER.map((t) => resolveHit({ weapon: w, target: ARMOUR_CLASSES[t] }).effective);
    for (let i = 1; i < values.length; i++) {
      expect(values[i], `${CLASS_ORDER[i]} vs ${CLASS_ORDER[i - 1]}`).toBeLessThanOrEqual(values[i - 1]);
    }
  });

  it("a mortar bomb bursting on a squad rolls each stand against its own armour", () => {
    const bomb = issueWeaponFor("m81_bore", "fragmentation", { radius: 2, falloff: 0.35 });
    const out = resolveAoe({
      weapon: bomb,
      victims: [
        { target: ARMOUR_CLASSES.none, dist: 0 },
        { target: ARMOUR_CLASSES.soft, dist: 1 },
        { target: ARMOUR_CLASSES.medium, dist: 1 },
        { target: ARMOUR_CLASSES.none, dist: 5 },
      ],
    });
    expect(out).toHaveLength(3);
    expect(out[0].effective).toBeGreaterThan(out[1].effective);
    expect(out[2].effective).toBeLessThan(out[1].effective);
    expect(out.every((h) => Number.isFinite(h.effective))).toBe(true);
  });
});
