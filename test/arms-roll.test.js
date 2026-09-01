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
  MODIFICATIONS, QUIRKS, QUALITY_ORDER, MOD_COUNT_BY_QUALITY, LUCK_SLOPE,
  TIER_RANK, LOADOUT_KEYS, LOADOUT_SHARES, SQUAD_VALUE_KEYS, WEAPON_BASE_KEYS,
  mulberry32, penMultFor, resolveHit, resolveAoe,
  resolveWeapon, rollWeapon, deriveLoadout, loadoutProfile, evaluateQuirk,
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

// ---------------------------------------------------------------------------
// rollWeapon. The server issues weapons by seed and reproduces them from the
// seed rather than storing them, so the draw order is a permanent contract:
// change it and every serial the Ministry has ever recorded refers to a
// different weapon. These tests exist to make that change impossible to make
// quietly.
// ---------------------------------------------------------------------------

describe("rollWeapon — determinism", () => {
  it("the same seed returns a deeply-equal instance, twice and after a hundred unrelated rolls", () => {
    const once = rollWeapon({ seed: 1234, tierCap: "III", luck: 0 });
    expect(rollWeapon({ seed: 1234, tierCap: "III", luck: 0 })).toEqual(once);
    for (let s = 9000; s < 9100; s++) rollWeapon({ seed: s, tierCap: "III", luck: 0 });
    expect(rollWeapon({ seed: 1234, tierCap: "III", luck: 0 })).toEqual(once);
  });

  it("SNAPSHOT — seed 1234 issues exactly this weapon, and any change to the draw order fails here", () => {
    // Hard-coded on purpose. Every other test in this file would still pass if
    // the seven draws were reordered; this one would not, which is the whole
    // point of writing it down. A deliberate change to the order updates this
    // literal AND says so in the commit message.
    expect(rollWeapon({ seed: 1234, tierCap: "III", luck: 0 })).toEqual({
      patternKey: "as294_longear_ranging_rifle_mk1",
      quality: "issue",
      mods: ["optic_ranging_telescope"],
      quirks: [],
      serial: "TES-294-45SE4",
    });
  });

  it("the roll is a pure function of its arguments — it mutates no table", () => {
    const patternsBefore = JSON.stringify(WEAPON_PATTERNS);
    const modsBefore = JSON.stringify(MODIFICATIONS);
    const quirksBefore = JSON.stringify(QUIRKS);
    for (let s = 1; s <= 200; s++) rollWeapon({ seed: s, tierCap: "III", luck: 0.5 });
    expect(JSON.stringify(WEAPON_PATTERNS)).toBe(patternsBefore);
    expect(JSON.stringify(MODIFICATIONS)).toBe(modsBefore);
    expect(JSON.stringify(QUIRKS)).toBe(quirksBefore);
  });

  it("different seeds genuinely diverge", () => {
    const patterns = new Set();
    const grades = new Set();
    for (let s = 1; s <= 200; s++) {
      const r = rollWeapon({ seed: s, tierCap: "III", luck: 0 });
      patterns.add(r.patternKey);
      grades.add(r.quality);
    }
    expect(patterns.size, `only ${patterns.size} distinct patterns over 200 seeds`).toBeGreaterThanOrEqual(20);
    expect(grades.size, `only ${grades.size} distinct grades over 200 seeds`).toBeGreaterThanOrEqual(3);
  });

  it("the serial is reproducible and correctly formed from the maker and the pattern year", () => {
    for (let s = 1; s <= 200; s++) {
      const r = rollWeapon({ seed: s, tierCap: "III" });
      expect(r.serial, `seed ${s}`).toMatch(/^[A-Z]{3}-\d{3}-[0-9A-Z]{5}$/);
      const p = WEAPON_PATTERNS[r.patternKey];
      const stem = MANUFACTURERS[p.maker].nameStems[0].slice(0, 3).toUpperCase();
      expect(r.serial.slice(0, 3), `seed ${s}: ${r.patternKey}`).toBe(stem);
      expect(r.serial.slice(4, 7), `seed ${s}: ${p.label}`).toBe(p.label.match(/ (\d{3}) /)[1]);
    }
  });
});

describe("rollWeapon — filters, pools and failure", () => {
  it("honours a class filter", () => {
    for (let s = 1; s <= 60; s++) {
      expect(WEAPON_PATTERNS[rollWeapon({ seed: s, class: "marksman", tierCap: "III" }).patternKey].class).toBe("marksman");
    }
  });

  it("honours a maker filter", () => {
    for (let s = 1; s <= 60; s++) {
      expect(WEAPON_PATTERNS[rollWeapon({ seed: s, maker: "emberwright_foundries", tierCap: "III" }).patternKey].maker).toBe("emberwright_foundries");
    }
  });

  it("honours a calibre filter", () => {
    for (let s = 1; s <= 60; s++) {
      expect(WEAPON_PATTERNS[rollWeapon({ seed: s, calibre: "r13_line", tierCap: "III" }).patternKey].calibre).toBe("r13_line");
    }
  });

  it("a tierCap of I never yields anything above tier I", () => {
    for (let s = 1; s <= 200; s++) {
      expect(WEAPON_PATTERNS[rollWeapon({ seed: s, tierCap: "I" }).patternKey].tier, `seed ${s}`).toBe("I");
    }
  });

  it("a tier-II cap opens its OWN branch and no sibling branch", () => {
    // The three II:* branches are the same height and differ only in how they
    // are unlocked, so a cap admits everything strictly below it plus its own
    // exact tier. An engineering cache does not hand you cipher patterns.
    const seen = new Set();
    for (let s = 1; s <= 300; s++) seen.add(WEAPON_PATTERNS[rollWeapon({ seed: s, tierCap: "II:Eng" }).patternKey].tier);
    expect([...seen].sort()).toEqual(["I", "II:Eng"]);
    for (const t of Object.keys(TIER_RANK)) expect(TIER_RANK[t]).toBeGreaterThan(0);
    expect(TIER_RANK["II:Cache"]).toBe(TIER_RANK["II:Eng"]);
    expect(TIER_RANK.I).toBeLessThan(TIER_RANK["II:Eng"]);
    expect(TIER_RANK.III).toBeGreaterThan(TIER_RANK["II:Wake"]);
  });

  it("AN EMPTY POOL THROWS LOUDLY, naming the filters — it never widens them", () => {
    expect(() => rollWeapon({ seed: 1, class: "marksman", maker: "tarpool_burnworks", tierCap: "III" }))
      .toThrow(/no pattern matches.*marksman.*tarpool_burnworks/);
    expect(() => rollWeapon({ seed: 1, class: "artillery", tierCap: "I" })).toThrow(/no pattern matches/);
    expect(() => rollWeapon({ seed: 1, class: "not_a_class", tierCap: "III" })).toThrow(/no pattern matches/);
    expect(() => rollWeapon({ seed: 1, tierCap: "IV" })).toThrow(/unknown tierCap/);
  });
});

describe("rollWeapon — structural validity over 500 instances", () => {
  const INSTANCES = [];
  for (let s = 1; s <= 500; s++) INSTANCES.push([s, rollWeapon({ seed: s, tierCap: "III", luck: 0 })]);

  it("every instance has exactly the five WeaponInstance keys", () => {
    for (const [s, r] of INSTANCES) {
      expect(Object.keys(r).sort(), `seed ${s}`).toEqual(["mods", "patternKey", "quality", "quirks", "serial"]);
    }
  });

  it("patternKey and quality always resolve to declared rows", () => {
    for (const [s, r] of INSTANCES) {
      expect(Object.keys(WEAPON_PATTERNS), `seed ${s}`).toContain(r.patternKey);
      expect(Object.keys(QUALITY_GRADES), `seed ${s}`).toContain(r.quality);
    }
  });

  it("every fitted mod is legal for the pattern, and NO TWO SHARE A SLOT", () => {
    for (const [s, r] of INSTANCES) {
      const p = WEAPON_PATTERNS[r.patternKey];
      const slots = [];
      for (const k of r.mods) {
        const mod = MODIFICATIONS[k];
        expect(mod, `seed ${s}: undeclared mod ${k}`).toBeTruthy();
        expect(p.slots, `seed ${s}: ${k} occupies a slot ${r.patternKey} does not have`).toContain(mod.slot);
        expect(mod.appliesTo, `seed ${s}: ${k} is not legal on a ${p.class}`).toContain(p.class);
        slots.push(mod.slot);
      }
      expect(new Set(slots).size, `seed ${s}: two mods share a slot`).toBe(slots.length);
      expect(new Set(r.mods).size, `seed ${s}: a mod is fitted twice`).toBe(r.mods.length);
    }
  });

  it("the fitted count sits inside MOD_COUNT_BY_QUALITY, clamped by the slots actually available", () => {
    for (const [s, r] of INSTANCES) {
      const p = WEAPON_PATTERNS[r.patternKey];
      const open = new Set(Object.values(MODIFICATIONS)
        .filter((m) => p.slots.includes(m.slot) && m.appliesTo.includes(p.class))
        .map((m) => m.slot)).size;
      const [lo, hi] = MOD_COUNT_BY_QUALITY[r.quality];
      expect(r.mods.length, `seed ${s} (${r.quality})`).toBeGreaterThanOrEqual(Math.min(lo, open));
      expect(r.mods.length, `seed ${s} (${r.quality})`).toBeLessThanOrEqual(Math.min(hi, open));
    }
  });

  it("every rolled quirk is declared, unique, and not already on the pattern", () => {
    for (const [s, r] of INSTANCES) {
      const p = WEAPON_PATTERNS[r.patternKey];
      expect(r.quirks.length, `seed ${s}`).toBeLessThanOrEqual(2);
      expect(new Set(r.quirks).size, `seed ${s}: a quirk is drawn twice`).toBe(r.quirks.length);
      for (const q of r.quirks) {
        expect(Object.keys(QUIRKS), `seed ${s}: undeclared quirk ${q}`).toContain(q);
        expect(p.quirks, `seed ${s}: ${q} is already a characteristic of ${r.patternKey}`).not.toContain(q);
      }
    }
  });

  it("EVERYTHING THE ROLLER CAN PRODUCE IS WELL-FORMED — every reachable mod has a cost, every reachable quirk a condition", () => {
    // Asserted over what the ROLLER can actually hand a player, which is a
    // different claim from "the tables are valid": a mod is only reachable if
    // some pattern's slots and class admit it, and a quirk is reachable on any
    // pattern that does not already carry it. Both sets are computed here
    // rather than assumed.
    const reachableMods = new Set();
    for (const p of Object.values(WEAPON_PATTERNS)) {
      for (const [k, m] of Object.entries(MODIFICATIONS)) {
        if (p.slots.includes(m.slot) && m.appliesTo.includes(p.class)) reachableMods.add(k);
      }
    }
    expect(reachableMods.size, "the roller cannot reach every modification").toBe(Object.keys(MODIFICATIONS).length);
    for (const k of reachableMods) {
      expect(Object.keys(MODIFICATIONS[k].tradeoff).length, `${k} is reachable and pure upside`).toBeGreaterThanOrEqual(1);
    }
    for (const [k, q] of Object.entries(QUIRKS)) {
      expect(q.condition, `${k} is reachable and has no machine-evaluable condition`).toBeTruthy();
      expect(typeof evaluateQuirk(q, {}), `${k}`).toBe("boolean");
    }
  });

  it("every rolled instance resolves to a complete, finite, in-range WeaponBase", () => {
    for (const [s, r] of INSTANCES) {
      const b = resolveWeapon(r, {});
      expect(Object.keys(b).sort(), `seed ${s}`).toEqual([...WEAPON_BASE_KEYS].sort());
      expect(b.accuracy, `seed ${s}`).toBeGreaterThanOrEqual(0.05);
      expect(b.accuracy, `seed ${s}`).toBeLessThanOrEqual(1.5);
      expect(b.reliability, `seed ${s}`).toBeGreaterThanOrEqual(0.05);
      expect(b.reliability, `seed ${s}`).toBeLessThanOrEqual(1);
      expect(b.rateOfFire, `seed ${s}`).toBeGreaterThanOrEqual(0.1);
      expect(b.weight, `seed ${s}`).toBeGreaterThanOrEqual(0.1);
      for (const f of ["damage", "armorPen", "range"]) {
        expect(Number.isFinite(b[f]), `seed ${s}.${f}`).toBe(true);
        expect(b[f], `seed ${s}.${f}`).toBeGreaterThanOrEqual(0);
      }
      expect(DAMAGE_TYPES, `seed ${s}`).toContain(b.damageType);
    }
  });
});

describe("THE DISTRIBUTION TEST — 10 000 rolls against the published odds", () => {
  it("every grade's observed share is within 2 percentage points of rollWeight / 1000", () => {
    const N = 10000;
    const seen = {};
    for (const g of QUALITY_ORDER) seen[g] = 0;
    for (let s = 1; s <= N; s++) seen[rollWeapon({ seed: s, tierCap: "III", luck: 0 }).quality]++;
    const report = QUALITY_ORDER
      .map((g) => `${g} ${(seen[g] / N).toFixed(4)} vs ${(QUALITY_GRADES[g].rollWeight / 1000).toFixed(4)}`)
      .join(" · ");
    for (const g of QUALITY_ORDER) {
      const observed = seen[g] / N;
      const target = QUALITY_GRADES[g].rollWeight / 1000;
      expect(Math.abs(observed - target), `${g}: ${report}`).toBeLessThanOrEqual(0.02);
    }
    expect(Object.values(seen).reduce((a, b) => a + b, 0)).toBe(N);
  });

  it("luck bends the distribution in the direction LUCK_SLOPE declares, and luck 0 does not bend it at all", () => {
    // The distribution test above is a test of the WEIGHT TABLE, and it is only
    // that because luck 0 leaves the weights untouched. This is the assertion
    // that makes that claim true rather than assumed.
    const share = (luck, grade) => {
      let n = 0;
      for (let s = 1; s <= 3000; s++) if (rollWeapon({ seed: s, tierCap: "III", luck }).quality === grade) n++;
      return n / 3000;
    };
    expect(LUCK_SLOPE.relic).toBeGreaterThan(0);
    expect(LUCK_SLOPE.scrap).toBeLessThan(0);
    expect(share(1, "relic")).toBeGreaterThan(share(0, "relic"));
    expect(share(1, "scrap")).toBeLessThan(share(0, "scrap"));
    expect(share(-1, "scrap")).toBeGreaterThan(share(0, "scrap"));
    // and luck is clamped, so nothing past the ends of the range moves further
    expect(share(5, "relic")).toBe(share(1, "relic"));
  });
});

// ---------------------------------------------------------------------------
// Resolution and reduction. The tactical engine never sees a WeaponInstance
// (drift guard 11) — it sees deriveLoadout's squad-level numbers and
// loadoutProfile's damage profile. These tests are that boundary.
// ---------------------------------------------------------------------------

describe("resolveWeapon — the application order is the contract", () => {
  const BASE = { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: [], quirks: [] };

  it("an issue-grade, un-modded instance under an empty context is the pattern base plus the maker's signature", () => {
    for (const [k, p] of Object.entries(WEAPON_PATTERNS)) {
      const b = resolveWeapon({ patternKey: k, quality: "issue", mods: [], quirks: [] }, {});
      for (const f of ["accuracy", "rateOfFire", "damage", "armorPen", "range", "reliability", "weight"]) {
        const expected = p.base[f] + (MANUFACTURERS[p.maker].signature[f] || 0);
        expect(b[f], `${k}.${f}`).toBeCloseTo(Math.min(Math.max(expected, 0), f === "reliability" ? 1 : Infinity), 4);
      }
      expect(b.damageType, `${k}.damageType`).toBe(p.base.damageType);
      expect(b.aoe, `${k}.aoe`).toEqual(p.base.aoe);
    }
  });

  it("a master-grade example of the baseline pattern hits strictly harder than an issue-grade one", () => {
    const issue = resolveWeapon(BASE, {});
    const master = resolveWeapon({ ...BASE, quality: "master" }, {});
    expect(master.damage).toBeGreaterThan(issue.damage);
    expect(master.accuracy).toBeGreaterThan(issue.accuracy);
    // and the multiplicative layer never touches penetration, which is what
    // keeps the class sweep true at every grade.
    expect(master.armorPen).toBe(issue.armorPen);
  });

  it("a tradeoff-bearing mod moves the traded stat in the WORSE direction", () => {
    const issue = resolveWeapon(BASE, {});
    const withDrum = resolveWeapon({ ...BASE, mods: ["magazine_extended_box"] }, {});
    expect(withDrum.rateOfFire).toBeGreaterThan(issue.rateOfFire);
    expect(withDrum.weight, "the extended box weighs nothing").toBeGreaterThan(issue.weight);

    const withBlade = resolveWeapon({ ...BASE, mods: ["bayonet_sword_pattern"] }, {});
    expect(withBlade.accuracy).toBeLessThan(issue.accuracy);
    expect(withBlade.rateOfFire).toBeLessThan(issue.rateOfFire);
  });

  it("a quirk whose condition is unmet contributes exactly nothing", () => {
    const off = resolveWeapon({ ...BASE, quirks: ["dark_run_sights"] }, {});
    const on = resolveWeapon({ ...BASE, quirks: ["dark_run_sights"] }, { night: true });
    expect(off).toEqual(resolveWeapon(BASE, {}));
    expect(on.accuracy).toBeGreaterThan(off.accuracy);
  });

  it("a quirk's morale and initiative are dropped — they are not WeaponBase fields", () => {
    const withMorale = resolveWeapon({ ...BASE, quirks: ["ferrymans_blessing"] }, { adjacentSpecialists: ["relic_bearer"] });
    expect(Object.keys(withMorale).sort()).toEqual([...WEAPON_BASE_KEYS].sort());
    expect(withMorale).toEqual(resolveWeapon(BASE, {}));
  });

  it("a 'native_house' quirk resolves against the MAKER, without the caller looking anything up", () => {
    // The Prize Yard's native house is salvage, and prize_taken is a morale
    // quirk — so the observable proof is that evaluateQuirk fires, which
    // resolveWeapon arranges by filling nativeHouses off the access map itself.
    const yard = MANUFACTURERS.salvage_court_prize_yard;
    const natives = Object.keys(yard.access).filter((h) => yard.access[h] === "native");
    expect(natives).toContain("salvage");
    expect(evaluateQuirk(QUIRKS.prize_taken, { vsHouse: "salvage", nativeHouses: natives })).toBe(true);
    expect(evaluateQuirk(QUIRKS.prize_taken, { vsHouse: "synod", nativeHouses: natives })).toBe(false);
  });

  it("clamps rather than producing a nonsense weapon, and throws on a row that does not exist", () => {
    const relicFerryman = resolveWeapon({ patternKey: "fs159_ninefold_vigil_rifle_mk1", quality: "relic", mods: [], quirks: [] }, {});
    expect(relicFerryman.reliability).toBeLessThanOrEqual(1);
    expect(() => resolveWeapon({ patternKey: "no_such_pattern", quality: "issue", mods: [], quirks: [] }, {})).toThrow(/unknown pattern/);
    expect(() => resolveWeapon({ patternKey: "hw141_levy_rifle_mk2", quality: "gilded", mods: [], quirks: [] }, {})).toThrow(/unknown quality/);
  });

  it("does not mutate the instance it is handed", () => {
    const instance = { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: ["stock_bipod"], quirks: ["cold_forged"] };
    const before = JSON.stringify(instance);
    resolveWeapon(instance, { weather: "snow" });
    expect(JSON.stringify(instance)).toBe(before);
  });
});

describe("deriveLoadout — the reduction to squad numbers", () => {
  const squadFor = (seeds) => ({
    figures: 10,
    loadout: {
      primary: rollWeapon({ seed: seeds[0], class: "rifle", tierCap: "III" }),
      support: rollWeapon({ seed: seeds[1], class: "lmg", tierCap: "III" }),
      sidearm: rollWeapon({ seed: seeds[2], class: "sidearm", tierCap: "III" }),
    },
  });

  it("ITS OUTPUT KEYS ARE A SUBSET OF LOADOUT_KEYS, WHICH IS A SUBSET OF THE SQUADTYPE VALUE KEYS", () => {
    // The named acceptance criterion. Asserted mechanically against the two
    // exported allowlists, so neither can drift from the function.
    for (const seeds of [[3, 4, 5], [11, 12, 13], [77, 78, 79]]) {
      const out = deriveLoadout(squadFor(seeds), {});
      for (const k of Object.keys(out)) expect(Object.keys(LOADOUT_KEYS), `${k} is not in LOADOUT_KEYS`).toContain(k);
    }
    for (const k of Object.keys(LOADOUT_KEYS)) {
      expect(SQUAD_VALUE_KEYS, `LOADOUT_KEYS.${k} is not a SquadType value key`).toContain(k);
      expect(["absolute", "delta"], `LOADOUT_KEYS.${k}`).toContain(LOADOUT_KEYS[k]);
    }
    // and the engine is never handed a weapon-shaped thing
    const out = deriveLoadout(squadFor([3, 4, 5]), {});
    for (const k of ["patternKey", "quality", "mods", "quirks", "serial", "damageType", "armorPen", "aoe"]) {
      expect(Object.keys(out), `${k} leaked into the squad values`).not.toContain(k);
    }
  });

  it("every returned value is a finite number, and speed is a drag that is never a bonus", () => {
    for (let s = 1; s <= 60; s++) {
      const out = deriveLoadout(squadFor([s, s + 1000, s + 2000]), {});
      for (const [k, v] of Object.entries(out)) {
        expect(Number.isFinite(v), `seed ${s}: ${k} = ${v}`).toBe(true);
      }
      expect(out.speed, `seed ${s}`).toBeLessThanOrEqual(0);
      expect(out.ranged, `seed ${s}`).toBeGreaterThan(0);
      expect(out.range, `seed ${s}`).toBeGreaterThan(0);
      expect(out.pts, `seed ${s}`).toBeGreaterThan(0);
    }
  });

  it("is deterministic — the same squad reduces to a deeply-equal result every time", () => {
    const squad = squadFor([42, 43, 44]);
    const once = deriveLoadout(squad, {});
    for (let i = 0; i < 20; i++) expect(deriveLoadout(squad, {})).toEqual(once);
  });

  it("A BAYONET RAISES MELEE AND DOES NOT RAISE RANGED — the double-count the two-resolve reduction exists to prevent", () => {
    const bare = { figures: 10, loadout: { primary: { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: [], quirks: [] } } };
    const bladed = { figures: 10, loadout: { primary: { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: ["bayonet_sword_pattern"], quirks: [] } } };
    const a = deriveLoadout(bare, {});
    const b = deriveLoadout(bladed, {});
    expect(a.melee).toBe(0);
    expect(b.melee).toBeCloseTo(1.9, 4);
    // The blade's damage must not reach the fire term. It costs accuracy and
    // rate of fire, so ranged goes DOWN — which is the correct direction and
    // the thing a naive single-resolve implementation gets backwards.
    expect(b.ranged).toBeLessThan(a.ranged);
  });

  it("the shares are applied as published: the primary carries the squad and the sidearm is a rounding error", () => {
    expect(LOADOUT_SHARES).toEqual({ primary: 1, support: 0.15, sidearm: 0.1 });
    const one = { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: [], quirks: [] };
    const primaryOnly = deriveLoadout({ figures: 10, loadout: { primary: one } }, {});
    const withSupport = deriveLoadout({ figures: 10, loadout: { primary: one, support: one } }, {});
    expect(withSupport.ranged / primaryOnly.ranged).toBeCloseTo(1.15, 2);
    expect(withSupport.pts / primaryOnly.pts).toBeCloseTo(1.15, 2);
  });

  it("the longest reach in the squad sets the squad's reach", () => {
    const short = { patternKey: "sy288_knife_room_gun_mk5", quality: "issue", mods: [], quirks: [] };
    const long = { patternKey: "as268_copperline_long_rifle_mk2", quality: "issue", mods: [], quirks: [] };
    const out = deriveLoadout({ figures: 10, loadout: { primary: short, support: long } }, {});
    expect(out.range).toBe(resolveWeapon(long, {}).range);
    expect(out.range).toBeGreaterThan(resolveWeapon(short, {}).range);
  });

  it("weight drags speed by whole steps, and an infantry loadout drags at most one", () => {
    // The formula is -floor(weight / 12) over the SHARE-WEIGHTED weight, so a
    // rifle section is unencumbered and a projector team is not. A crew-served
    // mount goes far lower, which is correct and is Lane J's problem: this
    // function answers for what a stand CARRIES.
    const rifle = { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: [], quirks: [] };
    const flamer = { patternKey: "tp226_seamfire_trench_projector_mk2", quality: "issue", mods: [], quirks: [] };
    expect(deriveLoadout({ figures: 10, loadout: { primary: rifle } }, {}).speed).toBe(0);
    expect(deriveLoadout({ figures: 10, loadout: { primary: flamer } }, {}).speed).toBeLessThan(0);
    for (let s = 1; s <= 40; s++) {
      const out = deriveLoadout(squadFor([s, s + 500, s + 900]), {});
      expect(out.speed, `seed ${s}`).toBeGreaterThanOrEqual(-1);
    }
  });

  it("an unarmed stand is a legal state and reduces to zeroes rather than throwing", () => {
    expect(deriveLoadout({ figures: 4, loadout: {} }, {})).toEqual({ melee: 0, ranged: 0, range: 0, speed: 0, pts: 0 });
    expect(deriveLoadout({ figures: 4 }, {})).toEqual({ melee: 0, ranged: 0, range: 0, speed: 0, pts: 0 });
  });

  it("context reaches the weapons: a quirk that fires changes the squad's numbers", () => {
    const squad = { figures: 10, loadout: { primary: { patternKey: "hw141_levy_rifle_mk2", quality: "issue", mods: [], quirks: ["dark_run_sights"] } } };
    expect(deriveLoadout(squad, { night: true }).ranged).toBeGreaterThan(deriveLoadout(squad, {}).ranged);
  });
});

describe("loadoutProfile — what the engine feeds to resolveHit", () => {
  const squadOf = (instance) => ({ figures: 10, loadout: { primary: instance } });

  it("returns exactly the four fields resolveHit needs, and nothing that identifies a weapon", () => {
    const out = loadoutProfile(squadOf(rollWeapon({ seed: 5, tierCap: "III" })), {});
    expect(Object.keys(out).sort()).toEqual(["aoe", "armorPen", "damageType", "misfire"]);
  });

  it("damageType is one of the seven and misfire always sits in [0, 0.5]", () => {
    for (let s = 1; s <= 300; s++) {
      const out = loadoutProfile(squadOf(rollWeapon({ seed: s, tierCap: "III" })), {});
      expect(DAMAGE_TYPES, `seed ${s}`).toContain(out.damageType);
      expect(out.misfire, `seed ${s}`).toBeGreaterThanOrEqual(0);
      expect(out.misfire, `seed ${s}`).toBeLessThanOrEqual(0.5);
      expect(Number.isFinite(out.armorPen), `seed ${s}`).toBe(true);
      expect(out.armorPen, `seed ${s}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("PLUGS STRAIGHT INTO resolveHit against all seven armour classes and always returns a finite effective", () => {
    // This is the join the whole boundary rests on: deriveLoadout keeps its
    // keys inside SQUAD_VALUE_KEYS, and this is how the engine still has enough
    // to resolve penetration without ever holding a WeaponInstance.
    for (let s = 1; s <= 200; s++) {
      const instance = rollWeapon({ seed: s, tierCap: "III" });
      const profile = loadoutProfile(squadOf(instance), {});
      const damage = deriveLoadout(squadOf(instance), {}).ranged;
      for (const cls of Object.keys(ARMOUR_CLASSES)) {
        const hit = resolveHit({ weapon: { ...profile, damage }, target: ARMOUR_CLASSES[cls] });
        expect(Number.isFinite(hit.effective), `seed ${s} vs ${cls}`).toBe(true);
        expect(hit.effective, `seed ${s} vs ${cls}`).toBeGreaterThanOrEqual(0);
        expect(hit.suppressOnly, `seed ${s} vs ${cls}`).toBe(hit.effective === 0);
      }
    }
  });

  it("a scrap-grade weapon misfires more often than a master-grade one of the same pattern", () => {
    const at = (quality) => loadoutProfile(squadOf({ patternKey: "rs229_verdict_service_rifle_mk3", quality, mods: [], quirks: [] }), {}).misfire;
    expect(at("scrap")).toBeGreaterThan(at("issue"));
    expect(at("issue")).toBeGreaterThan(at("master"));
  });

  it("an unarmed stand profiles as inert — it penetrates nothing and never fires", () => {
    expect(loadoutProfile({ figures: 4, loadout: {} }, {})).toEqual({ armorPen: 0, damageType: "kinetic", aoe: null, misfire: 0.5 });
    expect(resolveHit({ weapon: { ...loadoutProfile({ figures: 4 }, {}), damage: 0 }, target: ARMOUR_CLASSES.none }).effective).toBe(0);
  });
});
