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
  WEAPON_PATTERNS, SUPPRESSION, DAMAGE_TYPES, TYPE_MATRIX,
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

// ---------------------------------------------------------------------------
// Vehicle armament. Lane J draws its hardpoint weapons from WEAPON_PATTERNS BY
// KEY and its facings from ARMOUR_CLASSES, so these rows are not decoration:
// they are the other lane's parts bin, and the ladder they describe is a
// contract between the two catalogues.
// ---------------------------------------------------------------------------
describe("vehicle armament — the ladder Lane J mounts", () => {
  const MOUNTABLE = ["crawler_gun", "hmg", "flame", "mortar", "artillery", "aircraft_gun"];
  const VEHICLE_USERS = ["crawler", "land_dreadnought", "fighter", "artillery", "siege_mortar", "autocar_scouts"];

  // Same helper as the class sweep: pattern base plus maker signature, which
  // is what an issue-grade un-modded instance resolves to.
  const issueBase = (key) => {
    const p = WEAPON_PATTERNS[key];
    const b = { ...p.base };
    for (const [k, v] of Object.entries(MANUFACTURERS[p.maker].signature)) b[k] = b[k] + v;
    return b;
  };
  const on = (key, cls) => resolveHit({ weapon: issueBase(key), target: ARMOUR_CLASSES[cls] }).effective;
  const ofClass = (cls) => Object.entries(WEAPON_PATTERNS).filter(([, p]) => p.class === cls);

  it("every mountable class offers at least one genuinely mountable pattern", () => {
    for (const cls of MOUNTABLE) {
      const usable = ofClass(cls).filter(
        ([, p]) => p.slots.includes("mount") && p.appliesTo.some((a) => VEHICLE_USERS.includes(a)),
      );
      expect(usable.length, `${cls}: no pattern with a mount slot and a vehicle in appliesTo`).toBeGreaterThan(0);
    }
  });

  it("a land-fort's main gun meets a belt on equal terms", () => {
    // Not merely "greater than zero": the keel gun's penetration equals the
    // belt's armour value, which is the top of the penetration curve's neutral
    // band. Nothing else in the catalogue does that.
    expect(on("fs198_reliquary_keel_gun_mk1", "superheavy")).toBeGreaterThan(0);
    expect(penMultFor(issueBase("fs198_reliquary_keel_gun_mk1").armorPen - ARMOUR_CLASSES.superheavy.armourValue)).toBe(1);
  });

  it("a siege howitzer reduces poured works that a field piece cannot", () => {
    expect(on("em284_anvilgate_siege_howitzer_mk2", "fortified")).toBeGreaterThan(on("cl235_crossloom_field_piece_mk2", "fortified"));
    expect(on("em284_anvilgate_siege_howitzer_mk2", "fortified")).toBeGreaterThan(0);
  });

  it("AN AIRCRAFT GUN DOES NOT PUNCH SUPERHEAVY — not one of them, at any grade of luck", () => {
    const guns = ofClass("aircraft_gun");
    expect(guns.length).toBeGreaterThanOrEqual(2);
    for (const [k] of guns) {
      expect(on(k, "superheavy"), `${k} vs superheavy`).toBe(0);
      // and it is still worth carrying: it opens an autocar's skin.
      expect(on(k, "light"), `${k} vs light`).toBeGreaterThan(0);
    }
  });

  it("the crawler-gun ladder: a light bore opens a hull and is spent on a belt; a heavy bore opens the belt", () => {
    expect(on("sy277_prizeyard_turret_gun_mk3", "medium")).toBeGreaterThan(0);
    expect(on("sy277_prizeyard_turret_gun_mk3", "heavy")).toBeGreaterThan(0);
    expect(on("sy277_prizeyard_turret_gun_mk3", "superheavy")).toBe(0);
    expect(on("em291_forgeworks_breakthrough_gun_mk1", "superheavy")).toBeGreaterThan(0);
    expect(on("cl318_tollgate_casemate_gun_mk1", "superheavy")).toBeGreaterThan(0);
  });

  it("a shaped casemate shell beats a solid one on plate and is wasted on men", () => {
    const shaped = "cl318_tollgate_casemate_gun_mk1";
    const solid = "em291_forgeworks_breakthrough_gun_mk1";
    expect(on(shaped, "superheavy") / on(solid, "superheavy")).toBeGreaterThan(1);
    expect(on(shaped, "soft") / on(solid, "soft")).toBeLessThan(1);
  });

  it("a hull projector burns a trench and never opens the hull it is bolted to", () => {
    const flame = "tp305_slagline_hull_projector_mk1";
    expect(on(flame, "soft")).toBeGreaterThan(on(flame, "none"));
    // Against a line crawler it is not quite zero — a projector finds a vision
    // slit and a deck grille — but it is a trickle, and the number is stated as
    // a ratio rather than left as "greater than zero", which would pass on any
    // amount at all. Against a breakthrough glacis and a fort's belt the
    // penetration curve takes it to nothing.
    expect(on(flame, "medium")).toBeLessThan(on(flame, "soft") / 20);
    for (const c of ["heavy", "superheavy"]) expect(on(flame, c), `${flame} vs ${c}`).toBe(0);
  });

  it("a fume bomb empties an unsealed position and dies at the first sealed hatch", () => {
    const gas = "tp317_tarpool_fume_mortar_mk1";
    expect(WEAPON_PATTERNS[gas].base.damageType).toBe("chemical");
    for (const c of ["none", "soft", "light"]) expect(on(gas, c), `${gas} vs ${c}`).toBeGreaterThan(0);
    for (const c of ["medium", "heavy", "superheavy"]) expect(on(gas, c), `${gas} vs ${c}`).toBe(0);
  });

  it("fume is the one thing in the catalogue a greatcoat is any use against", () => {
    // Every other damage type rates `soft` at or above `none` — webbing and a
    // heavy coat do nothing about a bullet and rather less about a fragment.
    // Chemical is the exception, and it is the exception on purpose.
    const gas = "tp317_tarpool_fume_mortar_mk1";
    expect(on(gas, "none")).toBeGreaterThan(on(gas, "soft"));
    for (const t of DAMAGE_TYPES.filter((x) => x !== "chemical")) {
      expect(TYPE_MATRIX[t].soft, `${t}`).toBeGreaterThanOrEqual(TYPE_MATRIX[t].none);
    }
  });

  it("a concussion bomb is bought for suppression: more raw damage, less of it arrives", () => {
    // Same bore, same crew, same range — and the blast bomb kills less than the
    // case bomb it is issued alongside. That is the whole of its argument, and
    // the reason SUPPRESSION is declared as data rather than inferred.
    const blast = "rs278_state_concussion_mortar_mk2";
    const case_ = "cl221_crossloom_light_mortar_mk2";
    expect(WEAPON_PATTERNS[blast].calibre).toBe(WEAPON_PATTERNS[case_].calibre);
    expect(WEAPON_PATTERNS[blast].base.damage).toBeGreaterThan(WEAPON_PATTERNS[case_].base.damage);
    expect(on(blast, "soft")).toBeLessThan(on(case_, "soft"));
    expect(SUPPRESSION.concussiveBonus).toBeGreaterThan(0);
  });

  it("a burst rolls every stand around it against its own armour, and falls off per hex", () => {
    const w = issueBase("em284_anvilgate_siege_howitzer_mk2");
    const out = resolveAoe({
      weapon: w,
      victims: [
        { target: ARMOUR_CLASSES.none, dist: 0 },
        { target: ARMOUR_CLASSES.none, dist: 3 },
        { target: ARMOUR_CLASSES.heavy, dist: 0 },
        { target: ARMOUR_CLASSES.none, dist: 9 },
      ],
    });
    expect(out).toHaveLength(3);
    expect(out[0].effective).toBeGreaterThan(out[1].effective);
    expect(out[0].effective).toBeGreaterThan(out[2].effective);
  });
});

describe("the catalogue reads as its makers", () => {
  // A reader should be able to name the maker from how a weapon shoots. These
  // are the leans stated as consequences rather than as table values, so a
  // later step that re-tunes a signature discovers what it broke.
  const bySame = (calibre) => Object.entries(WEAPON_PATTERNS).filter(([, p]) => p.calibre === calibre);
  const resolved = (key, field) => {
    const p = WEAPON_PATTERNS[key];
    return p.base[field] + (MANUFACTURERS[p.maker].signature[field] || 0);
  };

  it("the State Arsenal builds the fastest line rifle and the least reliable one", () => {
    const rifles = bySame("r13_line").filter(([, p]) => p.class === "rifle").map(([k]) => k);
    const fastest = rifles.reduce((a, b) => (resolved(a, "rateOfFire") >= resolved(b, "rateOfFire") ? a : b));
    const flakiest = rifles.reduce((a, b) => (resolved(a, "reliability") <= resolved(b, "reliability") ? a : b));
    expect(WEAPON_PATTERNS[fastest].maker).toBe("reclamation_state_arsenal");
    expect(WEAPON_PATTERNS[flakiest].maker).toBe("reclamation_state_arsenal");
  });

  it("the Wheelwrights build the lightest line rifle, and pay for it in reach", () => {
    const rifles = bySame("r13_line").filter(([, p]) => p.class === "rifle").map(([k]) => k);
    const lightest = rifles.reduce((a, b) => (resolved(a, "weight") <= resolved(b, "weight") ? a : b));
    expect(WEAPON_PATTERNS[lightest].maker).toBe("outrider_wheelwrights");
    expect(resolved(lightest, "range")).toBeLessThan(resolved("hw141_levy_rifle_mk2", "range"));
  });

  it("the Signal Works builds the longest-reaching rifle and the weakest shot", () => {
    const rifles = bySame("r13_line").filter(([, p]) => p.class === "rifle").map(([k]) => k);
    const longest = rifles.reduce((a, b) => (resolved(a, "range") >= resolved(b, "range") ? a : b));
    const weakest = rifles.reduce((a, b) => (resolved(a, "damage") <= resolved(b, "damage") ? a : b));
    expect(WEAPON_PATTERNS[longest].maker).toBe("ascendancy_signal_works");
    expect(WEAPON_PATTERNS[weakest].maker).toBe("ascendancy_signal_works");
  });

  it("the Foundries build the hardest-hitting line rifle, at the ceiling of what a rifle may open", () => {
    const rifles = bySame("r13_line").filter(([, p]) => p.class === "rifle").map(([k]) => k);
    const hardest = rifles.reduce((a, b) => (resolved(a, "armorPen") >= resolved(b, "armorPen") ? a : b));
    expect(WEAPON_PATTERNS[hardest].maker).toBe("emberwright_foundries");
    expect(resolved(hardest, "armorPen")).toBeLessThan(4);
    expect(resolved(hardest, "armorPen")).toBeGreaterThan(3.5);
  });

  it("every pattern's authored base leans the same way as its maker's signature", () => {
    // The signature is applied on top of the base; if the base contradicted it
    // the two would fight and the maker would stop being legible. Checked on
    // the one field where the lean is unambiguous and shared by three makers:
    // a maker who leans heavy never builds the lightest thing in its class.
    for (const cls of ["rifle", "carbine", "smg"]) {
      const rows = Object.entries(WEAPON_PATTERNS).filter(([, p]) => p.class === cls);
      if (rows.length < 2) continue;
      const lightest = rows.reduce((a, b) => (a[1].base.weight <= b[1].base.weight ? a : b));
      const lean = MANUFACTURERS[lightest[1].maker].signature.weight || 0;
      expect(lean, `${lightest[0]} is the lightest ${cls} but its maker leans heavy`).toBeLessThanOrEqual(0);
    }
  });
});
