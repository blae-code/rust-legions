// The Motor Pool — the seeded roll and the roll-up (Lane J).
//
// motor-mirror.test.js proves the CATALOGUE is complete and mirrored. This
// file proves the two things a catalogue cannot: that rollVehicle is pure and
// seeded, and that deriveMechanized reduces an instance to exactly the numbers
// the tactical engine is contracted to receive.
//
// Everything here runs against the importable mirror, src/lib/motorPool.js.
// The mirror test is what makes that legitimate: it deep-equals every table
// and compares every exported function's source text against
// base44/shared/motorPool.ts, so a behaviour proved here holds on the server.
import { describe, it, expect } from "vitest";
import {
  CHASSIS_PATTERNS, POWERPLANTS, ARMOUR_PACKAGES, SUSPENSIONS, MOUNTS,
  VEHICLE_MODS, VEHICLE_QUIRKS, VEHICLE_QUIRK_CONDITIONS, MECHANIZED_SPECIALS,
  MOTOR_MODEL, ROLL_ODDS, TIER_RANK, TERRAIN_KEYS, MELEE_CURVE, CREW_MORALE_CURVE,
  CREW_EXPOSURE_MORALE, tierRank, speedFromPowerWeight, terrainMultiplier, totalTonnage,
  hardpointStats, hardpointWeapons, breakdownChance, rollVehicle,
  deriveMechanized, evaluateVehicleQuirk,
} from "@/lib/motorPool.js";
import {
  WEAPON_PATTERNS, QUALITY_GRADES, QUALITY_ORDER, SQUAD_VALUE_KEYS, ARMOUR_CLASSES,
  resolveWeapon, rollWeapon,
} from "@/lib/arms.js";

const CHASSIS_KEYS = Object.keys(CHASSIS_PATTERNS);
const CAPS = Object.keys(TIER_RANK);
const withinCap = (tier, cap) => TIER_RANK[tier] < TIER_RANK[cap] || tier === cap;

// Every gun on the instance is accepted by a DISTINCT hull position, taken in
// hull order and never reused — the only association a VehicleInstance still
// supports once a position has been skipped, and therefore the rule
// PLATFORM_HANDOFF J2 gives the validator. Returns false if the walk runs out
// of positions, which is what an illegal instance looks like.
const assignInHullOrder = (vehicle, hull) => {
  let at = 0;
  for (const w of vehicle.hardpoints) {
    const cls = WEAPON_PATTERNS[w.patternKey].class;
    while (at < hull.length && !hull[at].allowed.includes(cls)) at += 1;
    if (at >= hull.length) return false;
    at += 1;
  }
  return true;
};

// The caps at which a weapon class has no eligible pattern at all. DERIVED
// from WEAPON_PATTERNS rather than asserted about it: a negative existence
// claim over Lane I's table goes red the day that lane adds a low-tier row,
// which is the same cross-lane failure this lane's manufacturer assertions
// were re-scoped to avoid.
const capsWithNoPattern = (weaponClass) => CAPS.filter(
  (cap) => !Object.values(WEAPON_PATTERNS).some((p) => p.class === weaponClass && withinCap(p.tier, cap)),
);

// ---------------------------------------------------------------------------
// §1 PURITY AND DETERMINISM
// ---------------------------------------------------------------------------

describe("rollVehicle — pure and seeded", () => {
  it("the same seed produces an identical vehicle", () => {
    for (const seed of [0, 1, 7, 4242, -99, 2 ** 30]) {
      expect(rollVehicle({ seed })).toEqual(rollVehicle({ seed }));
      expect(rollVehicle({ seed, luck: 0.4 })).toEqual(rollVehicle({ seed, luck: 0.4 }));
    }
  });

  it("rollVehicle holds no state — interleaved calls with the same seed agree", () => {
    // Two streams advanced alternately. A module-level generator, a cached
    // pool or a mutated table would show up here and nowhere else.
    const a1 = rollVehicle({ seed: 11 });
    const b1 = rollVehicle({ seed: 22 });
    const a2 = rollVehicle({ seed: 11 });
    rollVehicle({ seed: 33, class: "fighter" });
    const b2 = rollVehicle({ seed: 22 });
    expect(a2).toEqual(a1);
    expect(b2).toEqual(b1);
  });

  it("different seeds produce different vehicles", () => {
    const seen = new Set();
    for (let s = 0; s < 50; s++) seen.add(rollVehicle({ seed: s }).chassisKey);
    expect(seen.size, "distinct chassis over 50 seeds").toBeGreaterThanOrEqual(10);
  });

  it("rejects a seed that is not a finite number rather than silently rolling seed 0", () => {
    // mulberry32 coerces with `a |= 0`, so undefined would BECOME 0.
    for (const bad of [undefined, null, NaN, "7"]) {
      expect(() => rollVehicle({ seed: bad })).toThrow(/finite number/);
    }
  });
});

// ---------------------------------------------------------------------------
// §2 THE ODDS
// ---------------------------------------------------------------------------

describe("rollVehicle — the odds tables", () => {
  const gradeCounts = (n, luck) => {
    const counts = {};
    for (const g of QUALITY_ORDER) counts[g] = 0;
    for (let s = 0; s < n; s++) counts[rollVehicle({ seed: s, luck }).quality] += 1;
    return counts;
  };

  it("10 000 rolls match the quality-grade distribution within 2 percentage points", () => {
    const counts = gradeCounts(10000, 0);
    const total = QUALITY_ORDER.reduce((t, g) => t + QUALITY_GRADES[g].rollWeight, 0);
    for (const g of QUALITY_ORDER) {
      const observed = counts[g] / 10000;
      const expected = QUALITY_GRADES[g].rollWeight / total;
      expect(Math.abs(observed - expected), `${g}: observed ${observed}, expected ${expected}`).toBeLessThanOrEqual(0.02);
    }
  });

  it("luck 0 reproduces the base grade weights and positive luck raises the mean grade", () => {
    const mean = (counts) => {
      let sum = 0;
      let n = 0;
      QUALITY_ORDER.forEach((g, i) => { sum += i * counts[g]; n += counts[g]; });
      return sum / n;
    };
    const low = mean(gradeCounts(3000, -1));
    const zero = mean(gradeCounts(3000, 0));
    const high = mean(gradeCounts(3000, 1));
    expect(low).toBeLessThan(zero);
    expect(zero).toBeLessThan(high);
  });

  it("a non-finite luck is neutral rather than poisoning every weight", () => {
    // clampTo(NaN) is NaN, every weight becomes NaN, `ticket < 0` is never
    // true and the loop falls through to its initialiser — the RAREST grade,
    // on every seed. Lane I found this; the same guard is here.
    for (let s = 0; s < 40; s++) {
      expect(rollVehicle({ seed: s, luck: NaN })).toEqual(rollVehicle({ seed: s, luck: 0 }));
    }
  });

  it("the plant bias favours a power-to-weight near the class target", () => {
    // A ninety-six-tonne land fort on the weakest plant it can be given is a
    // lemon that should be rare, not equiprobable. Measured over 600 seeds.
    const counts = {};
    for (let s = 0; s < 600; s++) {
      const v = rollVehicle({ seed: s, class: "land_fort" });
      counts[v.powerplant] = (counts[v.powerplant] || 0) + 1;
    }
    const hull = CHASSIS_PATTERNS.grimwold_156_lockjaw_mk1.hull.tonnage;
    const target = ROLL_ODDS.plantTarget.land_fort;
    const deviation = (k) => Math.abs((POWERPLANTS[k].hp / hull) / target - 1);
    const best = Object.keys(counts).sort((a, b) => deviation(a) - deviation(b))[0];
    const worst = Object.keys(counts).sort((a, b) => deviation(b) - deviation(a))[0];
    expect(deviation(worst)).toBeGreaterThan(deviation(best));
    expect(counts[best], "the best-matched plant should out-draw the worst").toBeGreaterThan(counts[worst]);
  });

  it("the plant-bias floor is reached, not merely declared", () => {
    // ROLL_ODDS.plantBias has no catch-all row on purpose, so the floor is the
    // live branch for anything past the last step. If a sentinel row were ever
    // added the floor would become dead code, and this assertion goes red.
    const last = ROLL_ODDS.plantBias[ROLL_ODDS.plantBias.length - 1].maxDeviation;
    const hull = CHASSIS_PATTERNS.punt_137_shoalcutter.hull.tonnage;
    const target = ROLL_ODDS.plantTarget.gunboat;
    const cell = Math.abs((POWERPLANTS.fs_reliquary_cell_800.hp / hull) / target - 1);
    expect(ROLL_ODDS.plantPool.gunboat, "the relic cell must actually be in the pool").toContain("fs_reliquary_cell_800");
    expect(cell, "the deviation must exceed the last step for the floor to be live").toBeGreaterThan(last);
    expect(ROLL_ODDS.plantBiasFloor).toBeGreaterThan(0);
    // and it stays rare rather than impossible
    let cells = 0;
    for (let s = 0; s < 600; s++) {
      if (rollVehicle({ seed: s, class: "gunboat" }).powerplant === "fs_reliquary_cell_800") cells += 1;
    }
    expect(cells, "the floored plant should still appear").toBeGreaterThan(0);
    expect(cells / 600, "the floored plant should be rare").toBeLessThan(0.2);
  });

  it("a rolled quirk is always innate to the pattern or on the rollable list", () => {
    const rollable = new Set(ROLL_ODDS.rollableQuirks);
    for (let s = 0; s < 400; s++) {
      const v = rollVehicle({ seed: s });
      const innate = new Set(CHASSIS_PATTERNS[v.chassisKey].quirks);
      for (const q of v.quirks) {
        expect(VEHICLE_QUIRKS[q], `${q} is not a quirk`).toBeDefined();
        expect(innate.has(q) || rollable.has(q), `${q} on ${v.chassisKey} is neither innate nor rollable`).toBe(true);
      }
      expect(new Set(v.quirks).size, "a quirk was rolled twice").toBe(v.quirks.length);
    }
  });

  it("never fits two kits in one slot, and only in slots the hull declares", () => {
    for (let s = 0; s < 400; s++) {
      const v = rollVehicle({ seed: s });
      const chassis = CHASSIS_PATTERNS[v.chassisKey];
      const slots = v.mods.map((k) => VEHICLE_MODS[k].slot);
      expect(new Set(slots).size, `two kits in one slot on ${v.chassisKey}`).toBe(slots.length);
      for (const k of v.mods) {
        expect(chassis.slots).toContain(VEHICLE_MODS[k].slot);
        expect(VEHICLE_MODS[k].appliesTo).toContain(chassis.class);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// §3 FILTERS
// ---------------------------------------------------------------------------

describe("rollVehicle — filters", () => {
  it("a requested class always yields a chassis of that class", () => {
    for (const cls of [...new Set(CHASSIS_KEYS.map((k) => CHASSIS_PATTERNS[k].class))]) {
      for (let s = 0; s < 30; s++) {
        expect(CHASSIS_PATTERNS[rollVehicle({ seed: s, class: cls }).chassisKey].class).toBe(cls);
      }
    }
  });

  it("a requested maker always yields a chassis of that maker, and an impossible filter throws", () => {
    for (const maker of [...new Set(CHASSIS_KEYS.map((k) => CHASSIS_PATTERNS[k].maker))]) {
      for (let s = 0; s < 12; s++) {
        expect(CHASSIS_PATTERNS[rollVehicle({ seed: s, maker }).chassisKey].maker).toBe(maker);
      }
    }
    // Real maker, real class, no hull that is both.
    expect(() => rollVehicle({ seed: 1, class: "land_fort", maker: "outrider_wheelwrights" }))
      .toThrow(/no chassis matches/);
    expect(() => rollVehicle({ seed: 1, class: "fighter", tierCap: "I" })).toThrow(/no chassis matches/);
    expect(() => rollVehicle({ seed: 1, tierCap: "II:Nonesuch" })).toThrow(/unknown tier/);
  });

  it("tierCap is never exceeded by the chassis, its fittings, its guns or its kits", () => {
    for (const cap of CAPS) {
      for (let s = 0; s < 120; s++) {
        let v;
        try {
          v = rollVehicle({ seed: s, tierCap: cap });
        } catch (err) {
          expect(String(err.message)).toMatch(/no chassis matches/);
          continue;
        }
        expect(withinCap(CHASSIS_PATTERNS[v.chassisKey].tier, cap), `chassis ${v.chassisKey} at cap ${cap}`).toBe(true);
        expect(withinCap(ROLL_ODDS.tierOf.plants[v.powerplant] || "I", cap)).toBe(true);
        expect(withinCap(ROLL_ODDS.tierOf.drives[v.suspension] || "I", cap)).toBe(true);
        if (v.armourPackage) expect(withinCap(ROLL_ODDS.tierOf.packages[v.armourPackage] || "I", cap)).toBe(true);
        for (const k of v.mods) expect(withinCap(ROLL_ODDS.tierOf.mods[k] || "I", cap), `${k} at cap ${cap}`).toBe(true);
        for (const w of v.hardpoints) expect(withinCap(WEAPON_PATTERNS[w.patternKey].tier, cap)).toBe(true);
      }
    }
  });

  it("every rolled hardpoint weapon key exists in WEAPON_PATTERNS and is vehicle-capable", () => {
    const VEHICLE_CAPABLE = new Set(["crawler_gun", "hmg", "flame", "mortar", "artillery", "aircraft_gun"]);
    let rolled = 0;
    for (let s = 0; s < 400; s++) {
      const v = rollVehicle({ seed: s });
      const hull = CHASSIS_PATTERNS[v.chassisKey].hull.hardpoints;
      expect(v.hardpoints.length).toBeLessThanOrEqual(hull.length);
      for (const w of v.hardpoints) {
        const pattern = WEAPON_PATTERNS[w.patternKey];
        expect(pattern, `${w.patternKey} is not in WEAPON_PATTERNS`).toBeDefined();
        expect(VEHICLE_CAPABLE.has(pattern.class)).toBe(true);
        rolled += 1;
      }
      // Each gun is accepted by a hull position, walked in HULL ORDER.
      //
      // NOT `hull[i]`. A WeaponInstance carries no hardpoint key, and step 7
      // of the roll OMITS a position it cannot fill, so instance index i is
      // not hull position i the moment anything is skipped — the positional
      // form is green only while the default cap happens never to skip. The
      // greedy in-order walk is the reading the data actually supports, and it
      // is the one PLATFORM_HANDOFF J2 hands to the validator.
      expect(assignInHullOrder(v, hull), `no hull-order assignment on ${v.chassisKey}`).toBe(true);
    }
    expect(rolled).toBeGreaterThan(400);
  });

  it("a hardpoint with nothing it can carry at the cap goes to the field empty", () => {
    // The documented branch, DRIVEN — and the cap that drives it is derived at
    // runtime, never asserted about Lane I's table. The Reliquary Monitor's
    // casemate is a crawler_gun-only position on an otherwise legal hull, so
    // any cap at which the crawler_gun pool is empty exercises the skip.
    const casemate = CHASSIS_PATTERNS.reliquary_124_monitor_mk2.hull.hardpoints;
    expect(casemate[1].allowed).toEqual(["crawler_gun"]);
    // …at a cap that also admits the hull itself, or the filter throws first.
    const monitorTier = CHASSIS_PATTERNS.reliquary_124_monitor_mk2.tier;
    const empties = capsWithNoPattern("crawler_gun").filter((cap) => withinCap(monitorTier, cap));
    if (empties.length === 0) {
      // Every cap now has a crawler_gun pattern, so the branch is unreachable
      // from this hull. Say so rather than fail on another lane's data — but
      // the branch itself must still exist, or the hull would be unrollable.
      expect(CHASSIS_PATTERNS.reliquary_124_monitor_mk2, "the worked case is gone").toBeDefined();
      return;
    }
    for (const cap of empties) {
      const v = rollVehicle({ seed: 5, class: "gunboat", maker: "ferrymen_shrine_armoury", tierCap: cap });
      expect(v.chassisKey).toBe("reliquary_124_monitor_mk2");
      expect(v.hardpoints.length, `at cap ${cap}`).toBe(casemate.length - 1);
      // the hull is still a usable stand …
      expect(deriveMechanized({ vehicle: v }).ranged).toBeGreaterThan(0);
      // … and the skipped position is exactly why index i is NOT hull i: the
      // positional reading fails here, the hull-order walk holds.
      expect(assignInHullOrder(v, casemate), `hull-order walk at cap ${cap}`).toBe(true);
      const positional = v.hardpoints.every((w, i) => casemate[i].allowed.includes(WEAPON_PATTERNS[w.patternKey].class));
      expect(positional, "index i must NOT read as hull position i once a position is skipped").toBe(false);
    }
  });

  it("the rolled mount never carries more hardpoints than the hull provides", () => {
    for (let s = 0; s < 400; s++) {
      const v = rollVehicle({ seed: s });
      const chassis = CHASSIS_PATTERNS[v.chassisKey];
      expect(ROLL_ODDS.mountPool[chassis.class]).toContain(v.mount);
      expect(MOUNTS[v.mount].hardpoints).toBeLessThanOrEqual(chassis.hull.hardpoints.length);
    }
  });

  it("an offered armour package never lowers a facing of the hull it is offered to", () => {
    // The invariant lives HERE because checking it needs armour VALUES, which
    // drift guard 12 keeps out of motorPool.ts entirely.
    const av = (k) => ARMOUR_CLASSES[k].armourValue;
    for (let s = 0; s < 500; s++) {
      const v = rollVehicle({ seed: s });
      if (!v.armourPackage) continue;
      const base = CHASSIS_PATTERNS[v.chassisKey].hull.baseArmour;
      for (const [facing, value] of Object.entries(ARMOUR_PACKAGES[v.armourPackage].facings)) {
        expect(av(value), `${v.armourPackage} lowers ${facing} on ${v.chassisKey}`).toBeGreaterThanOrEqual(av(base[facing]));
      }
    }
  });

  it("serials are deterministic and match the documented format", () => {
    const FORMAT = /^MW-[A-Z]{2,4}-[0-9A-F]{4}$/;
    for (let s = 0; s < 200; s++) {
      const v = rollVehicle({ seed: s });
      expect(v.serial, `serial for seed ${s}`).toMatch(FORMAT);
      expect(rollVehicle({ seed: s }).serial).toBe(v.serial);
    }
    // and the stem is the WORKS KEY's — recomputed for every works that builds
    // a hull, and required to be distinct, so no two registers collide and no
    // stem is inherited from Lane I's nameStems (where the Ascendancy's first
    // stem "Testimony" stamped every Copperline car MW-TEST-####).
    const stemOf = (maker) => maker.replace(/^mw_/, "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4);
    const makers = [...new Set(CHASSIS_KEYS.map((k) => CHASSIS_PATTERNS[k].maker))];
    expect(new Set(makers.map(stemOf)).size, "two works share a serial stem").toBe(makers.length);
    for (const maker of makers) {
      const v = rollVehicle({ seed: 3, maker });
      expect(v.serial.split("-")[1], `serial stem for ${maker}`).toBe(stemOf(maker));
    }
    expect(stemOf("hundredweight_works")).toBe("HUND");
    expect(stemOf("mw_grimwold_treadworks")).toBe("GRIM");
  });
});

// ---------------------------------------------------------------------------
// §4 THE ROLL-UP
// ---------------------------------------------------------------------------

describe("deriveMechanized", () => {
  const CONTRACT = ["figures", "melee", "ranged", "range", "speed", "morale", "pts", "specials", "facings"];

  it("returns exactly the contracted key set", () => {
    for (let s = 0; s < 200; s++) {
      const out = deriveMechanized({ vehicle: rollVehicle({ seed: s }) });
      expect(Object.keys(out).sort()).toEqual([...CONTRACT].sort());
    }
  });

  it("its key set is a subset of §4's SquadType value keys plus {facings}", () => {
    // Read off Lane I's SQUAD_VALUE_KEYS rather than retyped, so a §4 change
    // to the SquadType shape moves this gate instead of falsifying it.
    const allowed = new Set([...SQUAD_VALUE_KEYS, "facings"]);
    for (const k of CONTRACT) expect(allowed.has(k), `${k} is not a SquadType value key`).toBe(true);
    // and `armor` is deliberately absent — it would need an armour value.
    expect(CONTRACT).not.toContain("armor");
  });

  it("requires a stand with a vehicle", () => {
    expect(() => deriveMechanized({})).toThrow(/stand.vehicle is required/);
    expect(() => deriveMechanized(null)).toThrow(/stand.vehicle is required/);
  });

  it("returns all four facings, and an armour package substitutes facing keys", () => {
    const FACINGS = ["front", "side", "rear", "top"];
    const classes = new Set(Object.keys(ARMOUR_CLASSES));
    let withPackage = 0;
    for (let s = 0; s < 300; s++) {
      const v = rollVehicle({ seed: s });
      const out = deriveMechanized({ vehicle: v });
      expect(Object.keys(out.facings).sort()).toEqual([...FACINGS].sort());
      for (const f of FACINGS) expect(classes.has(out.facings[f]), `${out.facings[f]} is not an ArmourClass key`).toBe(true);
      const base = CHASSIS_PATTERNS[v.chassisKey].hull.baseArmour;
      const sub = v.armourPackage ? ARMOUR_PACKAGES[v.armourPackage].facings : {};
      if (v.armourPackage) withPackage += 1;
      for (const f of FACINGS) expect(out.facings[f]).toBe(f in sub ? sub[f] : base[f]);
    }
    expect(withPackage, "no rolled vehicle carried a package — the substitution was never exercised").toBeGreaterThan(30);
  });

  it("figures is always 1 — vehicles are single-figure squads", () => {
    for (let s = 0; s < 60; s++) expect(deriveMechanized({ vehicle: rollVehicle({ seed: s }) }).figures).toBe(1);
  });

  it("specials are drawn only from MECHANIZED_SPECIALS, deduplicated, in vocabulary order", () => {
    const order = new Map(MECHANIZED_SPECIALS.map((t, i) => [t, i]));
    const seen = new Set();
    for (let s = 0; s < 400; s++) {
      const out = deriveMechanized({ vehicle: rollVehicle({ seed: s }) });
      expect(out.specials.length).toBeGreaterThan(0);
      expect(new Set(out.specials).size).toBe(out.specials.length);
      let last = -1;
      for (const t of out.specials) {
        expect(order.has(t), `${t} is not in MECHANIZED_SPECIALS`).toBe(true);
        expect(order.get(t)).toBeGreaterThan(last);
        last = order.get(t);
        seen.add(t);
      }
    }
    // The sources are not merely declared — the roll actually reaches most of
    // them. (`sealed`, `walker` and `smoke` need a specific fitting.)
    expect(seen.size).toBeGreaterThanOrEqual(12);
  });

  it("recomputes melee, speed, morale and pts from the tables", () => {
    const step = (curve, on, out, value) => {
      let found = curve[0][out];
      for (const row of curve) { if (value >= row[on]) found = row[out]; else break; }
      return found;
    };
    for (let s = 0; s < 250; s++) {
      const v = rollVehicle({ seed: s });
      const chassis = CHASSIS_PATTERNS[v.chassisKey];
      const plant = POWERPLANTS[v.powerplant];
      const out = deriveMechanized({ vehicle: v });

      // deltas: every kit's mods AND tradeoff, plus every unconditional quirk
      const d = {};
      const add = (rec) => { for (const k of Object.keys(rec || {})) d[k] = (d[k] || 0) + rec[k]; };
      for (const k of v.mods) { add(VEHICLE_MODS[k].mods); add(VEHICLE_MODS[k].tradeoff); }
      const ctxFacts = { quality: v.quality, crew: 0, tonnage: 0 };
      for (const k of v.quirks) {
        const q = VEHICLE_QUIRKS[k];
        if (q.condition.key === "always") add(q.mods);
        else if (q.condition.key === "quality_at_least"
          && QUALITY_ORDER.indexOf(ctxFacts.quality) >= QUALITY_ORDER.indexOf(q.condition.value)) add(q.mods);
      }
      const crew = chassis.hull.crew + (d.crew || 0);
      const tonnage = totalTonnage(v);
      for (const k of v.quirks) {
        const q = VEHICLE_QUIRKS[k];
        if (q.condition.key === "crew_at_least" && crew >= q.condition.value) add(q.mods);
        if (q.condition.key === "tonnage_at_least" && tonnage >= q.condition.value) add(q.mods);
      }

      const clamp = (n, [lo, hi]) => Math.min(hi, Math.max(lo, n));
      expect(out.melee).toBe(clamp(step(MELEE_CURVE, "minTonnage", "melee", tonnage) + (d.melee || 0), MOTOR_MODEL.meleeClamp));
      expect(out.speed).toBe(clamp(speedFromPowerWeight(plant.hp + (d.hp || 0), tonnage) + (d.speed || 0), MOTOR_MODEL.speedClamp));
      expect(out.morale).toBe(clamp(
        step(CREW_MORALE_CURVE, "minCrew", "morale", crew)
        + CREW_EXPOSURE_MORALE[MOUNTS[v.mount].crewArmour] + (d.morale || 0),
        MOTOR_MODEL.moraleClamp,
      ));

      let pts = chassis.pts + Math.max(MOTOR_MODEL.plantPtsMin, plant.hp * MOTOR_MODEL.plantPtsPerHp);
      if (v.armourPackage) pts += ARMOUR_PACKAGES[v.armourPackage].cost;
      for (const k of v.mods) pts += VEHICLE_MODS[k].pts;
      for (const w of v.hardpoints) pts += WEAPON_PATTERNS[w.patternKey].pts * QUALITY_GRADES[w.quality].ptsMult;
      const f = Math.pow(10, MOTOR_MODEL.decimals);
      expect(out.pts).toBe(Math.round(pts * QUALITY_GRADES[v.quality].ptsMult * f) / f);
      expect(out.pts).toBeGreaterThan(0);
    }
  });

  it("a heavier hull is never quicker on the same plant, and plate costs pace", () => {
    const v = rollVehicle({ seed: 77, class: "line_crawler", tierCap: "I" });
    const bare = deriveMechanized({ vehicle: { ...v, armourPackage: null, mods: [] } });
    const plated = deriveMechanized({ vehicle: { ...v, armourPackage: "ap_cast_glacis", mods: [] } });
    expect(totalTonnage({ ...v, armourPackage: "ap_cast_glacis", mods: [] }))
      .toBeGreaterThan(totalTonnage({ ...v, armourPackage: null, mods: [] }));
    expect(plated.speed).toBeLessThanOrEqual(bare.speed);
  });

  it("the ctx a quirk sees widens what applies without changing the key set", () => {
    // Boiler-Shy is the Seamfire's innate quirk and fires only in rain.
    const v = rollVehicle({ seed: 4, class: "half_track", maker: "tarpool_burnworks" });
    expect(v.quirks).toContain("vq_boiler_shy");
    const dry = breakdownChance(v);
    const wet = breakdownChance(v, { weather: "rain" });
    expect(wet).toBeGreaterThan(dry);
    expect(Object.keys(deriveMechanized({ vehicle: v }, { weather: "rain" })).sort())
      .toEqual(Object.keys(deriveMechanized({ vehicle: v })).sort());
  });
});

// ---------------------------------------------------------------------------
// §5 THE NUMERIC ESCAPE HATCHES
// ---------------------------------------------------------------------------

describe("breakdownChance, hardpointStats and hardpointWeapons", () => {
  it("breakdownChance is bounded to [0, 0.5] and does not rise as reliability rises", () => {
    for (let s = 0; s < 400; s++) {
      const chance = breakdownChance(rollVehicle({ seed: s }));
      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(MOTOR_MODEL.breakdownMax);
    }
    expect(MOTOR_MODEL.breakdownMax).toBe(0.5);

    // MONOTONICITY, driven rather than asserted in prose. An armour package is
    // the one fitting that changes reliability WITHOUT changing drive strain
    // (strain reads the plant's and the drive's weights, never the package's),
    // so walking a hull's whole package pool from the cleanest to the dirtiest
    // isolates the reliability term exactly.
    const v = { ...rollVehicle({ seed: 9, class: "line_crawler" }), mods: [] };
    const pool = [null, ...ROLL_ODDS.packagePool[v.chassisKey]]
      .sort((a, b) => (b === null ? 0 : ARMOUR_PACKAGES[b].reliability) - (a === null ? 0 : ARMOUR_PACKAGES[a].reliability));
    expect(pool.length).toBeGreaterThan(3);
    let previous = -Infinity;
    for (const pkg of pool) {
      const chance = breakdownChance({ ...v, armourPackage: pkg });
      expect(chance, `${pkg} broke monotonicity`).toBeGreaterThanOrEqual(previous);
      previous = chance;
    }
    expect(previous).toBeGreaterThan(breakdownChance({ ...v, armourPackage: pool[0] }) - 1e-9);

    // and a strictly cleaner plant on the same hull is never worse
    const clean = breakdownChance({ ...v, powerplant: "hw_flatbed_diesel_60", armourPackage: null });
    const dirty = breakdownChance({ ...v, powerplant: "kh_boneyard_pieced_diesel_120", armourPackage: null });
    expect(POWERPLANTS.hw_flatbed_diesel_60.reliability).toBeGreaterThan(POWERPLANTS.kh_boneyard_pieced_diesel_120.reliability);
    expect(clean).toBeLessThanOrEqual(dirty);
  });

  it("a package with a reliability cost always raises the breakdown chance", () => {
    const v = rollVehicle({ seed: 12, class: "line_crawler", tierCap: "I" });
    const bare = breakdownChance({ ...v, armourPackage: null, mods: [] });
    const heavy = breakdownChance({ ...v, armourPackage: "ap_cast_glacis", mods: [] });
    expect(ARMOUR_PACKAGES.ap_cast_glacis.reliability).toBeLessThan(0);
    expect(heavy).toBeGreaterThan(bare);
  });

  it("drive strain is real — an over-heavy plant costs reliability", () => {
    // The one consumer of Powerplant.weight and Suspension.weight. Without it
    // both fields would be dead data on twenty-one rows.
    const v = rollVehicle({ seed: 21, class: "scout_crawler", tierCap: "I" });
    const light = breakdownChance({ ...v, powerplant: "ow_courier_alcohol_75", mods: [], armourPackage: null });
    const heavy = breakdownChance({ ...v, powerplant: "cl_knotwork_diesel_140", mods: [], armourPackage: null });
    const hull = CHASSIS_PATTERNS[v.chassisKey].hull.tonnage;
    const allowed = hull * MOTOR_MODEL.gearAllowanceByClass.scout_crawler;
    const gear = POWERPLANTS.cl_knotwork_diesel_140.weight + SUSPENSIONS[v.suspension].weight;
    expect(gear, "the heavy plant must actually exceed the class allowance").toBeGreaterThan(allowed);
    expect(heavy).toBeGreaterThan(light);
  });

  it("every refit kit's tonnage delta is what totalTonnage actually adds", () => {
    // The kit term was the only untested half of totalTonnage: deleting it
    // left the whole suite green, because the recompute test sources its
    // expected tonnage from totalTonnage itself and the weight test pins
    // `mods: []` on both sides. Walked over EVERY kit, and over both records,
    // so neither half can be dropped and a kit that starts declaring tonnage
    // on the other side is covered the day it lands.
    const base = { ...rollVehicle({ seed: 44, class: "line_crawler", tierCap: "I" }), mods: [], armourPackage: null };
    const bare = totalTonnage(base);
    let moved = 0;
    for (const [k, mod] of Object.entries(VEHICLE_MODS)) {
      const delta = (mod.mods.tonnage || 0) + (mod.tradeoff.tonnage || 0);
      const fitted = totalTonnage({ ...base, mods: [k] });
      expect(Math.round((fitted - bare) * 100) / 100, `${k} tonnage delta`).toBe(delta);
      if (delta !== 0) moved += 1;
    }
    expect(moved, "no kit moves tonnage at all — the term would be dead").toBeGreaterThanOrEqual(10);

    // and the tonnage it adds is SPENT: melee reads it, speed reads it.
    const blade = VEHICLE_MODS.vm_dozer_blade;
    expect(blade.tradeoff.tonnage).toBeGreaterThan(0);
    const heavy = { ...base, mods: ["vm_dozer_blade"] };
    expect(totalTonnage(heavy)).toBe(Math.round((bare + blade.tradeoff.tonnage) * 100) / 100);
    expect(speedFromPowerWeight(1000, totalTonnage(heavy)))
      .toBeLessThanOrEqual(speedFromPowerWeight(1000, bare));
  });

  it("hardpointStats' range is the longest gun, not the sum of them", () => {
    // Replacing `max` with `+=` left the suite green: the only assertion over
    // stats.range was >= 0, and a six-hardpoint land fort would have reported
    // roughly six times its true reach to the tactical engine.
    let multi = 0;
    for (let s = 0; s < 300; s++) {
      const v = rollVehicle({ seed: s, mods: [] });
      if (v.hardpoints.length === 0) continue;
      const bare = { ...v, mods: [] };
      const ranges = bare.hardpoints.map((w) => resolveWeapon(w, undefined).range);
      expect(hardpointStats(bare).range, `range for seed ${s}`)
        .toBe(Math.round(Math.max(...ranges) * 100) / 100);
      if (bare.hardpoints.length > 1) multi += 1;
    }
    expect(multi, "no multi-gun hull was drawn — max and sum would agree").toBeGreaterThan(50);
  });

  it("the plant's cooling burden is spent in breakdownChance", () => {
    // Deleting the heat term left the suite green, because the monotonicity
    // walk is relative and a term that shifts every vehicle equally is
    // invisible to it. Two-point, against the published constant.
    const v = { ...rollVehicle({ seed: 63, class: "line_crawler", tierCap: "I" }), mods: [], quirks: [], armourPackage: null };

    // The whole formula, recomputed from the tables — the heat term included,
    // and this is the assertion that goes red when it is removed. Quirks are
    // stripped so the only live deltas are the kit's.
    const expected = (veh) => {
      const chassis = CHASSIS_PATTERNS[veh.chassisKey];
      const plant = POWERPLANTS[veh.powerplant];
      const drive = SUSPENSIONS[veh.suspension];
      let rel = plant.reliability * drive.reliability;
      if (veh.armourPackage) rel += ARMOUR_PACKAGES[veh.armourPackage].reliability;
      let heat = plant.heat;
      for (const k of veh.mods) {
        const mod = VEHICLE_MODS[k];
        rel += (mod.mods.reliability || 0) + (mod.tradeoff.reliability || 0);
        heat += (mod.mods.heat || 0) + (mod.tradeoff.heat || 0);
      }
      // the hull's INNATE quirks are carried whatever `vehicle.quirks` says
      for (const k of chassis.quirks || []) {
        const q = VEHICLE_QUIRKS[k];
        if (q.condition.key !== "always") continue;
        rel += q.mods.reliability || 0;
        heat += q.mods.heat || 0;
      }
      if (heat > 0) rel -= MOTOR_MODEL.heatPenaltyPerUnit * heat;
      const allowed = chassis.hull.tonnage * MOTOR_MODEL.gearAllowanceByClass[chassis.class];
      const gear = plant.weight + drive.weight;
      if (gear > allowed) rel -= MOTOR_MODEL.strainPerTonne * (gear - allowed);
      const raw = Math.min(MOTOR_MODEL.breakdownMax, Math.max(0, MOTOR_MODEL.breakdownScale * (1 - rel)));
      return Math.round(raw * Math.pow(10, MOTOR_MODEL.decimals)) / Math.pow(10, MOTOR_MODEL.decimals);
    };

    const gallery = VEHICLE_MODS.vm_radiator_gallery;
    expect(gallery.mods.heat).toBeLessThan(0);
    const cooledV = { ...v, mods: ["vm_radiator_gallery"] };
    expect(breakdownChance(v)).toBe(expected(v));
    expect(breakdownChance(cooledV)).toBe(expected(cooledV));
    expect(breakdownChance(cooledV), "a cooler, cleaner plant must break down less")
      .toBeLessThan(breakdownChance(v));
    // and the heat term is doing real work at this hull's numbers
    expect(POWERPLANTS[v.powerplant].heat).toBeGreaterThan(0);
    expect(MOTOR_MODEL.breakdownScale * MOTOR_MODEL.heatPenaltyPerUnit * POWERPLANTS[v.powerplant].heat)
      .toBeGreaterThan(0.005);

    // and a hotter plant on the same hull is worse for the heat reason alone
    const hot = { ...v, powerplant: "as_beacon_turbine_540" };
    const cool = { ...v, powerplant: "ls_lofter_radial_620" };
    expect(POWERPLANTS.as_beacon_turbine_540.heat).toBeGreaterThan(POWERPLANTS.ls_lofter_radial_620.heat);
    expect(breakdownChance(hot)).toBe(expected(hot));
    expect(breakdownChance(cool)).toBe(expected(cool));
    expect(breakdownChance(hot)).toBeGreaterThan(breakdownChance(cool));
  });

  it("hardpointStats passes armorPen through and never flattens the instances", () => {
    for (let s = 0; s < 200; s++) {
      const v = rollVehicle({ seed: s });
      const stats = hardpointStats(v);
      expect(stats.ranged).toBeGreaterThanOrEqual(0);
      expect(stats.range).toBeGreaterThanOrEqual(0);
      expect(stats.armorPenMax).toBeGreaterThanOrEqual(0);
      if (v.hardpoints.length === 0) expect(stats.armorPenMax).toBe(0);
      // the max is one of the hull's own guns, never an invented number
      if (v.hardpoints.length > 0) {
        const pens = v.hardpoints.map((w) => resolveWeapon(w, undefined).armorPen);
        expect(stats.armorPenMax).toBe(Math.max(...pens));
      }
      expect(hardpointWeapons(v)).toEqual(v.hardpoints);
      expect(hardpointWeapons(v)).not.toBe(v.hardpoints);
    }
  });

  it("a vehicle-level optic raises what the guns do without touching the instances", () => {
    const v = rollVehicle({ seed: 31, class: "line_crawler", tierCap: "I" });
    const bare = hardpointStats({ ...v, mods: [] });
    const sighted = hardpointStats({ ...v, mods: ["vm_range_drum_sight"] });
    expect(VEHICLE_MODS.vm_range_drum_sight.mods.accuracy).toBeGreaterThan(0);
    expect(sighted.ranged).not.toBe(bare.ranged);
    expect(hardpointWeapons({ ...v, mods: ["vm_range_drum_sight"] })).toEqual(v.hardpoints);
  });
});

// ---------------------------------------------------------------------------
// §6 QUIRK EVALUATION
// ---------------------------------------------------------------------------

describe("evaluateVehicleQuirk", () => {
  const q = (condition) => ({ key: "probe", label: "Probe", mods: { morale: 1 }, condition, blurb: "" });

  it("evaluates every condition key in the vocabulary, true and false", () => {
    const cases = {
      always: [[{}, true]],
      weather: [[{ weather: "rain" }, true], [{ weather: "snow" }, false], [{}, false]],
      terrain: [[{ terrain: "marsh" }, true], [{ terrain: "open" }, false]],
      night: [[{ night: true }, true], [{ night: false }, false], [{}, false]],
      vs_house: [[{ vsHouse: "covenant" }, true], [{ vsHouse: "outrider" }, false]],
      quality_at_least: [[{ quality: "master" }, true], [{ quality: "issue" }, false], [{}, false]],
      round_at_least: [[{ round: 4 }, true], [{ round: 1 }, false], [{}, false]],
      below_full_pace: [[{ atFullPace: false }, true], [{ atFullPace: true }, false], [{}, false]],
      stationary: [[{ moved: 0 }, true], [{ moved: 2 }, false], [{}, false]],
      crew_at_least: [[{ crew: 9 }, true], [{ crew: 2 }, false], [{}, false]],
      tonnage_at_least: [[{ tonnage: 40 }, true], [{ tonnage: 4 }, false], [{}, false]],
      hull_down: [[{ hullDown: true }, true], [{ hullDown: false }, false], [{}, false]],
    };
    const values = {
      weather: "rain", terrain: "marsh", vs_house: "covenant",
      quality_at_least: "proofed", round_at_least: 3, crew_at_least: 5, tonnage_at_least: 20,
    };
    expect(Object.keys(cases).sort()).toEqual([...VEHICLE_QUIRK_CONDITIONS].sort());
    for (const [key, probes] of Object.entries(cases)) {
      const condition = key in values ? { key, value: values[key] } : { key };
      for (const [ctx, want] of probes) {
        expect(evaluateVehicleQuirk(q(condition), ctx), `${key} with ${JSON.stringify(ctx)}`).toBe(want);
      }
    }
  });

  it("a quirk with no condition, or an unknown one, is never live", () => {
    expect(evaluateVehicleQuirk(null, {})).toBe(false);
    expect(evaluateVehicleQuirk({ mods: {} }, {})).toBe(false);
    expect(evaluateVehicleQuirk(q({ key: "sunspots" }), { sunspots: true })).toBe(false);
  });

  it("vs_house 'native_house' reads the maker's own houses", () => {
    const condition = { key: "vs_house", value: "native_house" };
    expect(evaluateVehicleQuirk(q(condition), { vsHouse: "salvage", nativeHouses: ["salvage"] })).toBe(true);
    expect(evaluateVehicleQuirk(q(condition), { vsHouse: "synod", nativeHouses: ["salvage"] })).toBe(false);
    expect(evaluateVehicleQuirk(q(condition), { vsHouse: "salvage" })).toBe(false);
  });

  it("the three instance-fact conditions fire with no engine context at all", () => {
    // crew_at_least, tonnage_at_least and quality_at_least are facts about the
    // instance, so deriveMechanized fills them in and they fire on ctx {}.
    // Without this, three shipped quirks would need an engine to mean anything.
    const base = { ...rollVehicle({ seed: 8, class: "gunboat", tierCap: "I" }), mods: [], armourPackage: null, quirks: [] };
    expect(base.chassisKey).toBe("punt_137_shoalcutter");
    const hull = CHASSIS_PATTERNS.punt_137_shoalcutter.hull;
    expect(hull.crew).toBeGreaterThanOrEqual(VEHICLE_QUIRKS.vq_deck_gang.condition.value);
    expect(hull.tonnage).toBeGreaterThanOrEqual(VEHICLE_QUIRKS.vq_bogs_the_soft_going.condition.value);

    const plain = deriveMechanized({ vehicle: base });
    const gang = deriveMechanized({ vehicle: { ...base, quirks: ["vq_deck_gang"] } });
    const bogged = deriveMechanized({ vehicle: { ...base, quirks: ["vq_bogs_the_soft_going"] } });
    expect(gang.morale).toBe(plain.morale + VEHICLE_QUIRKS.vq_deck_gang.mods.morale);
    expect(bogged.speed).toBe(plain.speed + VEHICLE_QUIRKS.vq_bogs_the_soft_going.mods.speed);
    expect(breakdownChance({ ...base, quirks: ["vq_deck_gang"] })).toBeLessThan(breakdownChance(base));

    // quality_at_least: the same hull, the same guns, two grades.
    const issue = deriveMechanized({ vehicle: { ...base, quality: "issue", quirks: ["vq_re_bored_barrel"] } });
    const master = deriveMechanized({ vehicle: { ...base, quality: "master", quirks: ["vq_re_bored_barrel"] } });
    const issuePlain = deriveMechanized({ vehicle: { ...base, quality: "issue" } });
    const masterPlain = deriveMechanized({ vehicle: { ...base, quality: "master" } });
    expect(issue.ranged, "the quirk must be inert below its grade").toBe(issuePlain.ranged);
    expect(master.ranged, "the quirk must be live at or above its grade").not.toBe(masterPlain.ranged);
    // and it is a real trade, not a bonus: the wider group costs more than the
    // heavier round returns on a two-gun hull.
    expect(VEHICLE_QUIRKS.vq_re_bored_barrel.mods.accuracy).toBeLessThan(0);
    expect(master.ranged).toBeLessThan(masterPlain.ranged);
  });

  it("terrainMultiplier is the matrix, and it fails loudly on either key", () => {
    // The sole consumer Lane C has for the 9x16 terrain matrix, and it had no
    // test at all: replacing the whole lookup body with `const mult = 1` left
    // the suite green, which would have made 144 authored numbers dead data,
    // and replacing the throw with `return 1` is precisely the silent
    // "unaffected" that §7 argues a river must never read as.
    for (const k of Object.keys(SUSPENSIONS)) {
      for (const t of TERRAIN_KEYS) {
        expect(terrainMultiplier(k, t), `${k} on ${t}`).toBe(SUSPENSIONS[k].terrain[t]);
      }
    }
    // the matrix is not constant, in either direction
    const flat = Object.keys(SUSPENSIONS).flatMap((k) => TERRAIN_KEYS.map((t) => terrainMultiplier(k, t)));
    expect(new Set(flat).size, "the terrain matrix reads as one number").toBeGreaterThan(3);
    expect(terrainMultiplier("sus_road_wheels", "road")).toBe(SUSPENSIONS.sus_road_wheels.terrain.road);
    expect(terrainMultiplier("sus_road_wheels", "road")).toBeGreaterThan(1);
    expect(terrainMultiplier("sus_line_tread", "water")).toBe(0);
    // and both keys fail loudly
    expect(() => terrainMultiplier("sus_hoverboard", "road")).toThrow(/unknown suspension/);
    expect(() => terrainMultiplier("sus_line_tread", "lava")).toThrow(/unknown terrain/);
    expect(() => terrainMultiplier("sus_line_tread", undefined)).toThrow(/unknown terrain/);
  });

  it("an unknown key fails loudly rather than reading as a zero", () => {
    expect(() => tierRank("IV")).toThrow(/unknown tier/);
    expect(() => rollVehicle({ seed: 1, class: "no_such_class" })).toThrow(/no chassis matches/);
    expect(() => totalTonnage({ chassisKey: "no_such_hull" })).toThrow(/unknown chassis/);
    expect(() => totalTonnage({ chassisKey: "hundredweight_141_line_crawler", armourPackage: "ap_nope" })).toThrow(/unknown armour package/);
    expect(() => totalTonnage({ chassisKey: "hundredweight_141_line_crawler", mods: ["vm_nope"] })).toThrow(/unknown vehicle mod/);
  });
});

// ---------------------------------------------------------------------------
// §7 THE ROLL ORDER, PINNED
// ---------------------------------------------------------------------------

describe("the roll order and the sub-seed are the contract", () => {
  // §11 says in prose that "the roll order is the contract" and that "every
  // pool is sorted by key before it is drawn from". Nothing held either of
  // them: swapping the suspension and mount steps, and dropping the chassis
  // pool's .sort() so the draw follows object insertion order, both left the
  // suite green — and both change every machine ever issued, because the
  // determinism tests only compare a roll to itself and move with the change.
  //
  // WHAT IS PINNED, AND WHAT DELIBERATELY IS NOT. The fields below are the
  // ones drawn from THIS lane's tables off the shared stream. The hardpoint
  // WEAPONS are not among them: they come out of Lane I's WEAPON_PATTERNS, and
  // a fixture naming pattern keys would go red the day a later lane appends a
  // vehicle-capable pattern — the cross-lane red this lane's manufacturer
  // assertions were re-scoped to avoid. The stream position is still safe to
  // pin, because step 7 consumes exactly one draw per FILLED position and
  // every case below fills every position it has; that is asserted, not
  // assumed. The sub-seed formula gets its own test, recomputed through Lane
  // I's own rollWeapon rather than against a key.
  const GOLDEN = [
  {
    args: { seed: 0 },
    want: {
      chassisKey: "adjudicated_142_writhawk", quality: "scrap",
      powerplant: "as_beacon_turbine_540", suspension: "sus_flight_gear",
      mount: "mnt_fixed_bow", armourPackage: null,
      hardpoints: ["as272_antenna_wing_cannon_mk2", "em233_anvilgate_heavy_gun_mk1"],
      mods: [],
      quirks: ["vq_pieced_together", "vq_deck_gang", "vq_bogs_the_soft_going"],
      serial: "MW-SALV-E747",
    },
  },
  {
    args: { seed: 137 },
    want: {
      chassisKey: "grimwold_138_breaker_mk3", quality: "proofed",
      powerplant: "cl_knotwork_diesel_140", suspension: "sus_line_tread",
      mount: "mnt_sponson_pair", armourPackage: "ap_overhead_grillage",
      hardpoints: ["em291_forgeworks_breakthrough_gun_mk1", "rs299_state_pintle_gun_mk4", "cl206_tollgate_sustained_gun_mk2"],
      mods: ["vm_mantlet_collar", "vm_turret_basket", "vm_forced_induction"],
      quirks: ["vq_thirsty"],
      serial: "MW-GRIM-B759",
    },
  },
  {
    args: { seed: 4242, luck: 0.75 },
    want: {
      chassisKey: "forgeworks_152_cinderhead", quality: "issue",
      powerplant: "tp_seamfire_flash_boiler_180", suspension: "sus_walker_legs",
      mount: "mnt_sponson_pair", armourPackage: "ap_cast_glacis",
      hardpoints: ["sy277_prizeyard_turret_gun_mk3", "tp305_slagline_hull_projector_mk1", "cl206_tollgate_sustained_gun_mk2", "rs299_state_pintle_gun_mk4"],
      mods: ["vm_ready_racks", "vm_wide_grousers"],
      quirks: ["vq_thirsty", "vq_cramped_fighting_room", "vq_re_bored_barrel"],
      serial: "MW-EMBE-DC20",
    },
  },
  {
    args: { seed: -8, class: "land_fort" },
    want: {
      chassisKey: "grimwold_156_lockjaw_mk1", quality: "proofed",
      powerplant: "fs_reliquary_cell_800", suspension: "sus_wide_girder_tread",
      mount: "mnt_sponson_pair", armourPackage: "ap_fortress_courses",
      hardpoints: ["sy277_prizeyard_turret_gun_mk3", "sy277_prizeyard_turret_gun_mk3", "sy277_prizeyard_turret_gun_mk3", "rs299_state_pintle_gun_mk4", "cl206_tollgate_sustained_gun_mk2", "em239_forgeworks_battalion_mortar_mk1"],
      mods: ["vm_stereo_rangefinder", "vm_low_compression_rebuild"],
      quirks: ["vq_thirsty", "vq_ponderous", "vq_settled_bearings", "vq_deck_gang"],
      serial: "MW-GRIM-A709",
    },
  },
  {
    args: { seed: 91, class: "gunboat", tierCap: "II:Cache" },
    want: {
      chassisKey: "punt_137_shoalcutter", quality: "issue",
      powerplant: "rw_shoal_marine_diesel_310", suspension: "sus_twin_screw",
      mount: "mnt_enclosed_turret", armourPackage: null,
      hardpoints: ["sy277_prizeyard_turret_gun_mk3", "cl206_tollgate_sustained_gun_mk2"],
      mods: ["vm_forced_induction"],
      quirks: ["vq_shallow_draught", "vq_deck_gang", "vq_low_silhouette"],
      serial: "MW-REDW-130E",
    },
  },
  ];

  it("five fixed seeds still produce the machines they were issued as", () => {
    for (const { args, want } of GOLDEN) {
      const v = rollVehicle(args);
      const hull = CHASSIS_PATTERNS[v.chassisKey].hull.hardpoints;
      expect(v.hardpoints.length, `${JSON.stringify(args)} skips a position — the stream position is no longer stable`)
        .toBe(hull.length);
      expect({
        chassisKey: v.chassisKey, quality: v.quality, powerplant: v.powerplant,
        suspension: v.suspension, mount: v.mount, armourPackage: v.armourPackage,
        mods: v.mods, quirks: v.quirks, serial: v.serial,
      }, `the roll for ${JSON.stringify(args)} has changed`).toEqual({
        chassisKey: want.chassisKey, quality: want.quality, powerplant: want.powerplant,
        suspension: want.suspension, mount: want.mount, armourPackage: want.armourPackage,
        mods: want.mods, quirks: want.quirks, serial: want.serial,
      });
    }
    // and the corpus is worth having: it spans classes, drives and grades
    const rolled = GOLDEN.map(({ args }) => rollVehicle(args));
    expect(new Set(rolled.map((v) => CHASSIS_PATTERNS[v.chassisKey].class)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(rolled.map((v) => v.suspension)).size).toBeGreaterThanOrEqual(4);
    expect(rolled.some((v) => v.armourPackage === null)).toBe(true);
    expect(rolled.some((v) => v.armourPackage !== null)).toBe(true);
  });

  it("every gun is the one the documented sub-seed produces", () => {
    // hpSeed = (seed ^ Math.imul(0x9e3779b9, i + 1)) | 0, for HULL index i.
    // Recomputed through Lane I's rollWeapon, so it pins the formula without
    // naming a pattern key: changing `i + 1` to `i + 2` goes red here.
    let checked = 0;
    for (const seed of [0, 3, 17, 137, 4242]) {
      const v = rollVehicle({ seed });
      const hull = CHASSIS_PATTERNS[v.chassisKey].hull.hardpoints;
      if (v.hardpoints.length !== hull.length) continue;
      v.hardpoints.forEach((w, i) => {
        const hpSeed = (seed ^ Math.imul(0x9e3779b9, i + 1)) | 0;
        const again = rollWeapon({
          seed: hpSeed, class: WEAPON_PATTERNS[w.patternKey].class, tierCap: "III", luck: 0,
        });
        expect(again, `hardpoint ${i} of seed ${seed}`).toEqual(w);
        checked += 1;
      });
    }
    expect(checked, "no hardpoint was checked").toBeGreaterThan(5);
  });

  it("every pool is drawn sorted, so a later append cannot renumber history", () => {
    // The property the .sort() calls exist for, asserted directly: the draw
    // must not follow declaration order. Rebuilding each pool in declaration
    // order and asserting it DIFFERS from the sorted one proves the sort is
    // observable rather than cosmetic on this catalogue.
    const declared = Object.keys(CHASSIS_PATTERNS);
    expect(declared, "CHASSIS_PATTERNS happens to be declared in key order — the sort would be unobservable")
      .not.toEqual([...declared].sort());
    const unsorted = Object.values(ROLL_ODDS.mountPool).concat(Object.values(ROLL_ODDS.drivePool))
      .filter((pool) => pool.length > 1 && String(pool) !== String([...pool].sort()));
    expect(unsorted.length, "every roll pool is already in key order — the sorts are unobservable")
      .toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// §8 THE THREE DOCUMENTED BEHAVIOURS THAT HAD NO GATE
// ---------------------------------------------------------------------------

describe("specials, quirk context and plant pricing", () => {
  it("a stand's running gear is its DRIVE's, and never two of them at once", () => {
    // byClass used to emit `tracked` and `wheeled` alongside byDrive's, and
    // because the six maps are unioned that shipped contradictions: a land
    // fort on walker legs came back BOTH tracked and walker, a hover-skirted
    // armoured car came back `wheeled`. Roughly one rolled stand in nine, and
    // these are exactly the tokens Lane A and Lane C branch on.
    const GROUND = ["tracked", "wheeled", "walker"];
    let sawTwo = 0;
    for (let s = 0; s < 800; s++) {
      const v = rollVehicle({ seed: s });
      const out = deriveMechanized({ vehicle: v });
      const carried = out.specials.filter((t) => GROUND.includes(t));
      const fromDrive = (MOTOR_MODEL.specials.byDrive[v.suspension] || []).filter((t) => GROUND.includes(t));
      expect(carried.sort(), `seed ${s} on ${v.suspension}`).toEqual([...fromDrive].sort());
      if (carried.length > 1) sawTwo += 1;
    }
    // the half-track bogie is genuinely both, and is the only source that is
    expect(sawTwo, "no stand carried two running-gear tokens — the half-track case is unreached")
      .toBeGreaterThan(0);
    const both = Object.entries(MOTOR_MODEL.specials.byDrive)
      .filter(([, list]) => list.filter((t) => GROUND.includes(t)).length > 1);
    expect(both.map(([k]) => k)).toEqual(["sus_half_track_bogie"]);
  });

  it("specials come off the declared quirks, not the live ones", () => {
    // §12: "a token is a capability of the machine, not a conditional effect
    // on a turn — an open fighting compartment is open in fine weather too."
    // Reading activeQuirkKeys instead left the suite green, because the two
    // drives that also emit `amphibious` masked the loss.
    const base = { ...rollVehicle({ seed: 19, class: "line_crawler", tierCap: "I" }), mods: [], armourPackage: null };
    expect(MOTOR_MODEL.specials.byDrive[base.suspension] || []).not.toContain("amphibious");
    const q = VEHICLE_QUIRKS.vq_shallow_draught;
    expect(q.condition.key, "the worked quirk must be conditional, or this proves nothing").not.toBe("always");
    expect(MOTOR_MODEL.specials.byQuirk.vq_shallow_draught).toContain("amphibious");
    const fitted = { ...base, quirks: ["vq_shallow_draught"] };
    // no ctx at all: the condition is NOT live, and the token is there anyway
    expect(deriveMechanized({ vehicle: fitted }).specials).toContain("amphibious");
    expect(evaluateVehicleQuirk(q, {})).toBe(false);
    // and it does not change when the condition does become live
    expect(deriveMechanized({ vehicle: fitted }, { terrain: q.condition.value }).specials)
      .toEqual(deriveMechanized({ vehicle: fitted }).specials);
  });

  it("the caller's ctx cannot overwrite the three instance facts", () => {
    // quirkContext fills quality, crew and tonnage from the INSTANCE and
    // spreads the caller's ctx underneath. Reordering the spread — so a
    // caller could claim any crew it liked — left the suite green.
    const v = { ...rollVehicle({ seed: 26, class: "gunboat", tierCap: "I" }), mods: [] };
    const honest = deriveMechanized({ vehicle: v });
    for (const lie of [{ crew: 99 }, { tonnage: 999 }, { quality: "relic" }, { crew: 0, tonnage: 0, quality: "scrap" }]) {
      expect(deriveMechanized({ vehicle: v }, lie), `ctx ${JSON.stringify(lie)} changed the roll-up`).toEqual(honest);
      expect(breakdownChance(v, lie), `ctx ${JSON.stringify(lie)} changed the breakdown`).toBe(breakdownChance(v));
    }
    // and a condition the caller DOES own still works, or this would pass on
    // a ctx that is ignored entirely
    const rainy = { ...rollVehicle({ seed: 4, class: "half_track", maker: "tarpool_burnworks" }) };
    expect(breakdownChance(rainy, { weather: "rain" })).toBeGreaterThan(breakdownChance(rainy));
  });

  it("a plant is priced at MOTOR_MODEL.plantPtsPerHp per horsepower", () => {
    // The constant's own comment publishes two worked figures. Changing it
    // 0.02 -> 0.05 left the suite green, because the recompute test sources
    // the same constant; these are the literals the comment and §13 state.
    expect(MOTOR_MODEL.plantPtsPerHp * POWERPLANTS.rs_levy_diesel_95.hp).toBeCloseTo(1.9, 10);
    expect(MOTOR_MODEL.plantPtsPerHp * POWERPLANTS.fs_reliquary_cell_800.hp).toBeCloseTo(16, 10);
    expect(POWERPLANTS.rs_levy_diesel_95.hp).toBe(95);
    expect(POWERPLANTS.fs_reliquary_cell_800.hp).toBe(800);

    // and the figure is what deriveMechanized actually charges: two plants on
    // one hull differ by exactly the hp difference times the rate, times the
    // hull's grade.
    const v = { ...rollVehicle({ seed: 55, class: "line_crawler", tierCap: "I" }), mods: [], armourPackage: null, quality: "issue" };
    const a = deriveMechanized({ vehicle: { ...v, powerplant: "hw_flatbed_diesel_60" } }).pts;
    const b = deriveMechanized({ vehicle: { ...v, powerplant: "em_forgeworks_diesel_460" } }).pts;
    const rate = MOTOR_MODEL.plantPtsPerHp * QUALITY_GRADES.issue.ptsMult;
    const gap = (POWERPLANTS.em_forgeworks_diesel_460.hp - POWERPLANTS.hw_flatbed_diesel_60.hp) * rate;
    expect(b - a).toBeCloseTo(gap, 1);
    expect(POWERPLANTS.hw_flatbed_diesel_60.hp * MOTOR_MODEL.plantPtsPerHp,
      "the floor must not be in play, or this measures plantPtsMin").toBeGreaterThan(MOTOR_MODEL.plantPtsMin);
  });
});
