// ---------------------------------------------------------------------------
// THE MOTOR POOL — canonical (Lane J).
//
// A "crawler" is a chassis CLASS, not a vehicle. A mechanized stand is a named
// chassis pattern from a named motor-works, fitted with a powerplant, an
// armour package, a suspension, a mount, hardpoint weapons drawn from Lane I's
// WEAPON_PATTERNS, refit kits and rolled quirks — priced in points and rolled
// by a pure, seeded rollVehicle().
//
// NO ARMOUR OR PENETRATION ARITHMETIC EXISTS IN THIS FILE (drift guard 12).
// Facings are declared as ArmourClass KEYS out of arms.ts's ARMOUR_CLASSES and
// nothing in this module ever reads a numeric armour rating, a penetration
// row, a damage-type cell, or the hit resolver. The four identifiers that name
// those things are deliberately absent from this file's SOURCE TEXT, because
// that is exactly what the acceptance grep looks for. The engine takes the
// facing keys out of deriveMechanized() and hands them to arms.ts, which owns
// the whole model.
// Weapon armorPen passes through this lane untouched and is never compared to
// anything here.
//
// Plain JavaScript in a .ts file, exactly as base44/shared/arms.ts and
// base44/shared/tactical.ts are: no TypeScript syntax. Every exported table is
// a PURE DATA LITERAL, because test/motor-mirror.test.js lifts each one out of
// this file TEXTUALLY (test/helpers/extract-const.js) and evaluates it — a
// computed table cannot be mirror-tested.
//
// Mirror: src/lib/motorPool.js — identical table content, identical function
// bodies, no UI-only fields on either side.
//
// Design record, with the speed curve and the Points Audit: docs/MOTOR_POOL.md
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Vocabularies
//
// Fixed string sets. Every one of them is a pure data literal so the mirror
// test can lift it textually; nothing here is derived from another table.
// ---------------------------------------------------------------------------

// The eleven mechanized classes, in §4 order. A "crawler" is three of these,
// not one: what the ordnance boards separate is tonnage and role, never fuel.
export const VEHICLE_CLASSES = [
  'scout_crawler', 'line_crawler', 'heavy_crawler', 'land_fort', 'half_track',
  'armoured_car', 'sp_gun', 'tractor_gun', 'gunboat', 'fighter', 'bomber',
];

// The nine refit slots, in §4 order. A chassis declares which of them its hull
// will accept; a refit kit declares which slot it occupies. A slot a chassis
// does not declare cannot be fitted, however much the kit would suit it.
export const VEHICLE_SLOTS = [
  'engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio',
  'stowage', 'crew_kit',
];

// Lane B's TERRAIN vocabulary, verbatim and in its order — read out of the
// merged base44/shared/tacticalField.ts, not inferred. Every suspension
// declares a modifier for every one of these and for nothing else; the mirror
// test pins this array against Object.keys(TERRAIN) lifted from Lane B's file,
// so a divergence is a red test rather than an undefined at the point of use.
//
// There is no `street` key. A metalled lane is `road`.
export const TERRAIN_KEYS = [
  'open', 'road', 'rail', 'field', 'rubble', 'ruins', 'building', 'wall',
  'woods', 'hedgerow', 'crater', 'water', 'marsh', 'hill', 'fuel_tank',
  'precursor_wall',
];

// §4 SquadType tier values. Declared here rather than imported: arms.ts holds
// an identical table for the same reason, and a shared Deno module borrowing
// another module's union is the coupling §3 forbids.
export const TIER_RANK = { I: 1, 'II:Cache': 2, 'II:Eng': 2, 'II:Ciph': 2, 'II:Wake': 2, III: 3 };

// The motor-works appended to arms.ts's MANUFACTURERS by this lane, keyed
// mw_*. Chassis and powerplants name makers out of the WHOLE of MANUFACTURERS
// — Lane I's nine as readily as these five — so this list is a record of what
// this lane added to that table, never the set of makers it may draw from.
export const MOTOR_WORKS_KEYS = [
  'mw_grimwold_treadworks', 'mw_chandlery_carriageworks', 'mw_kettleharrow_boneyard',
  'mw_longshadow_aeroworks', 'mw_redwater_hullyards',
];

// ---------------------------------------------------------------------------
// 2. The speed curve
//
// Speed is a step lookup on power-to-weight — hp ÷ totalTonnage — and never a
// stat a chassis declares. Fitting a bigger plant is the only way to go
// faster, and bolting on plate is the only way to slow down; both fall out of
// the same division, which is why neither number can drift from the other.
//
// LOOKUP RULE (speedFromPowerWeight): rows ascend by minRatio; return the
// `speed` of the LAST row whose minRatio <= ratio, then clamp to [1, 8].
// The first row's minRatio is 0, so the lookup always resolves.
//
// The top two rows are deliberately far apart. Ground machines live between
// about 2 and 20 hp per tonne — the whole of speeds 1 to 6 — while an
// airframe at 2.4 tonnes behind a 620 hp radial sits at 258, three orders of
// the same ratio away. One curve serves both only because 60 and 200 are wide
// enough to separate a bomber from a fighter and to leave everything on
// treads well below them. Sample rows in docs/MOTOR_POOL.md §5 pin it.
export const SPEED_CURVE = [
  { minRatio: 0, speed: 1 },
  { minRatio: 3.5, speed: 2 },
  { minRatio: 6.5, speed: 3 },
  { minRatio: 10, speed: 4 },
  { minRatio: 14, speed: 5 },
  { minRatio: 20, speed: 6 },
  { minRatio: 60, speed: 7 },
  { minRatio: 200, speed: 8 },
];

// ---------------------------------------------------------------------------
// 3. Chassis patterns
//
// Twenty hulls, at least one per VehicleClass. Each is a PATTERN — a drawing
// held by a works, built in marks, and priced by the ordnance boards against
// the Hundredweight 141 Line Crawler at 12 points (docs/MOTOR_POOL.md §13).
//
// NOMENCLATURE, as Lane I: maker name-stem, pattern year, name, and a mark
// where the works has issued one — "Grimwold 138 Breaker, Mk III". The key is
// the label in snake_case, so neither can drift from the other unnoticed.
//
// `hull.tonnage` is the ALL-UP COMBAT WEIGHT the boards stamp on the hull:
// armour, running gear and the works' nominal plant, ready to fight and
// before any refit. It is the tonnage the speed curve divides into. A refit
// that changes the plant changes power, not the stamp — the boards weigh a
// hull once. A plant far heavier than the pattern was drawn around shows up
// as drive strain in breakdownChance, not as a second weight ledger.
//
// `hull.baseArmour` declares ALL FOUR FACINGS as ArmourClass KEYS out of
// arms.ts's ARMOUR_CLASSES. There is no default facing and no armour NUMBER
// anywhere in this file: drift guard 12 puts every armour value and every
// penetration comparison in arms.ts, and this lane declares keys only.
//
// `quirks` are INNATE — the ones the pattern is born with. rollVehicle adds
// rolled quirks on top of these.
export const CHASSIS_PATTERNS = {
  // ---- scout_crawler --------------------------------------------------------
  outrider_129_whippet_mk2: {
    key: 'outrider_129_whippet_mk2',
    label: "Outrider 129 Whippet, Mk II",
    maker: 'outrider_wheelwrights',
    class: 'scout_crawler',
    tier: 'I',
    hull: {
      tonnage: 5.5,
      crew: 2,
      hardpoints: [
        { key: 'ring', allowed: ['hmg', 'flame'] },
      ],
      baseArmour: { front: 'light', side: 'soft', rear: 'soft', top: 'soft' },
    },
    slots: ['engine', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage'],
    quirks: ['vq_light_footed'],
    pts: 5,
    blurb: "A courier hull with a gun ring welded where the mail chest sat. The Compact sells it as a scout and prices it as a cart, and the crew of two are told to run first.",
  },
  knife_136_ferret_mk3: {
    key: 'knife_136_ferret_mk3',
    label: "Knife 136 Ferret, Mk III",
    maker: 'salvage_court_prize_yard',
    class: 'scout_crawler',
    tier: 'II:Cache',
    hull: {
      tonnage: 6.5,
      crew: 2,
      hardpoints: [
        { key: 'turret', allowed: ['crawler_gun', 'hmg'] },
      ],
      baseArmour: { front: 'light', side: 'light', rear: 'soft', top: 'soft' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage'],
    quirks: ['vq_prize_hull'],
    pts: 7,
    blurb: "Adjudicated salvage rebuilt around a turret ring the Yard did not cut. Every Ferret carries another house's rivets somewhere in it, and the Court considers that part of the fee.",
  },

  // ---- line_crawler ---------------------------------------------------------
  // THE REFERENCE HULL. Pinned at 12 points by §3 and by the live macro table
  // (src/lib/units.js crawler.points === 12). Every other chassis in this
  // catalogue is priced against it in the §13 Points Audit; nothing about it
  // may be edited without re-running that audit.
  hundredweight_141_line_crawler: {
    key: 'hundredweight_141_line_crawler',
    label: "Hundredweight 141 Line Crawler",
    maker: 'hundredweight_works',
    class: 'line_crawler',
    tier: 'I',
    hull: {
      tonnage: 14,
      crew: 4,
      hardpoints: [
        { key: 'turret', allowed: ['crawler_gun', 'hmg'] },
        { key: 'hull', allowed: ['hmg', 'flame'] },
      ],
      baseArmour: { front: 'medium', side: 'light', rear: 'light', top: 'soft' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_forgiving_tolerances'],
    pts: 12,
    blurb: "The hull every board prices the others against. Coarse threads, generous hatches, a turret ring a seam fitter can true with a hammer. Nothing about it is admired and nothing about it fails.",
  },
  verdict_144_levy_crawler: {
    key: 'verdict_144_levy_crawler',
    label: "Verdict 144 Levy Crawler",
    maker: 'reclamation_state_arsenal',
    class: 'line_crawler',
    tier: 'I',
    hull: {
      tonnage: 12,
      crew: 4,
      hardpoints: [
        { key: 'turret', allowed: ['crawler_gun', 'hmg'] },
        { key: 'bow', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'medium', side: 'light', rear: 'soft', top: 'soft' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'stowage', 'crew_kit'],
    quirks: ['vq_cramped_fighting_room'],
    pts: 11,
    blurb: "Drawn to be built in shifts rather than by craftsmen. The plate is thinner behind than a crew would choose and there is no wireless shelf, because the Arsenal expects the machine beside you to be doing the same thing.",
  },
  tollgate_147_knotwork_crawler_mk2: {
    key: 'tollgate_147_knotwork_crawler_mk2',
    label: "Tollgate 147 Knotwork Crawler, Mk II",
    maker: 'crossloom_pattern_house',
    class: 'line_crawler',
    tier: 'II:Eng',
    hull: {
      tonnage: 16,
      crew: 5,
      hardpoints: [
        { key: 'turret', allowed: ['crawler_gun', 'hmg'] },
        { key: 'hull', allowed: ['hmg', 'flame'] },
        { key: 'sponson', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'medium', side: 'medium', rear: 'light', top: 'soft' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_hand_fitted_gearbox'],
    pts: 16,
    blurb: "A waystation hull built for hire and finished like a customer is watching. Sides as thick as the nose, a third gun for the flank, and a gearbox that must be learned rather than driven.",
  },

  // ---- heavy_crawler --------------------------------------------------------
  grimwold_138_breaker_mk3: {
    key: 'grimwold_138_breaker_mk3',
    label: "Grimwold 138 Breaker, Mk III",
    maker: 'mw_grimwold_treadworks',
    class: 'heavy_crawler',
    tier: 'II:Eng',
    hull: {
      tonnage: 28,
      crew: 5,
      hardpoints: [
        { key: 'turret', allowed: ['crawler_gun'] },
        { key: 'hull', allowed: ['hmg', 'flame'] },
        { key: 'coax', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'heavy', side: 'medium', rear: 'light', top: 'light' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_thirsty'],
    pts: 18,
    blurb: "Drawn to walk onto a shaft head and stay there while the sappers fill it. The glacis is sloped past the point of politeness and the fuel bill is entered as a cost of closing the lock.",
  },
  forgeworks_152_cinderhead: {
    key: 'forgeworks_152_cinderhead',
    label: "Forgeworks 152 Cinderhead",
    maker: 'emberwright_foundries',
    class: 'heavy_crawler',
    tier: 'III',
    hull: {
      tonnage: 34,
      crew: 6,
      hardpoints: [
        { key: 'turret', allowed: ['crawler_gun'] },
        { key: 'hull', allowed: ['flame'] },
        { key: 'sponson_left', allowed: ['hmg'] },
        { key: 'sponson_right', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'heavy', side: 'heavy', rear: 'medium', top: 'light' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_thirsty', 'vq_cramped_fighting_room'],
    pts: 22,
    blurb: "The Union's argument that the Rent can be beaten, cast in plate and set on fire. Sides as heavy as the nose, a projector in the bow, and six men in a compartment drawn for five.",
  },

  // ---- land_fort ------------------------------------------------------------
  grimwold_156_lockjaw_mk1: {
    key: 'grimwold_156_lockjaw_mk1',
    label: "Grimwold 156 Lockjaw, Mk I",
    maker: 'mw_grimwold_treadworks',
    class: 'land_fort',
    tier: 'III',
    hull: {
      tonnage: 96,
      crew: 14,
      hardpoints: [
        { key: 'main_turret', allowed: ['artillery', 'crawler_gun'] },
        { key: 'fore_sponson', allowed: ['crawler_gun'] },
        { key: 'aft_sponson', allowed: ['crawler_gun'] },
        { key: 'ring_fore', allowed: ['hmg'] },
        { key: 'ring_aft', allowed: ['hmg'] },
        { key: 'mortar_pit', allowed: ['mortar'] },
      ],
      baseArmour: { front: 'superheavy', side: 'superheavy', rear: 'heavy', top: 'medium' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_thirsty', 'vq_ponderous'],
    pts: 44,
    blurb: "A works building laid on treads and sent to sit on an excavation until the argument is over. Fourteen crew, six guns, and a belt the Covenant lays in courses like masonry.",
  },

  // ---- half_track -----------------------------------------------------------
  drover_134_provender_carrier: {
    key: 'drover_134_provender_carrier',
    label: "Drover 134 Provender Carrier",
    maker: 'mw_chandlery_carriageworks',
    class: 'half_track',
    tier: 'I',
    hull: {
      tonnage: 9,
      crew: 3,
      hardpoints: [
        { key: 'ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'light', side: 'soft', rear: 'soft', top: 'none' },
    },
    slots: ['engine', 'armour', 'suspension', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_open_fighting_compartment'],
    pts: 5,
    blurb: "A victualling wagon with a plate nose and no roof. It carries a section forward, a gun on the ring, and whatever the Chandlery was paid to put in the bed behind them.",
  },
  seamfire_143_burnwagon: {
    key: 'seamfire_143_burnwagon',
    label: "Seamfire 143 Burnwagon",
    maker: 'tarpool_burnworks',
    class: 'half_track',
    tier: 'II:Eng',
    hull: {
      tonnage: 11,
      crew: 3,
      hardpoints: [
        { key: 'bow', allowed: ['flame'] },
        { key: 'ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'light', side: 'light', rear: 'soft', top: 'none' },
    },
    slots: ['engine', 'armour', 'suspension', 'hardpoint', 'optics', 'stowage', 'crew_kit'],
    quirks: ['vq_boiler_shy'],
    pts: 7,
    blurb: "Tarpool's answer to a held building: a projector in the bow, a tank where the bed was, and a crew who have been told exactly how far the flame reaches and to believe it.",
  },

  // ---- armoured_car ---------------------------------------------------------
  dustpromise_131_courier_mk2: {
    key: 'dustpromise_131_courier_mk2',
    label: "Dustpromise 131 Courier, Mk II",
    maker: 'outrider_wheelwrights',
    class: 'armoured_car',
    tier: 'I',
    hull: {
      tonnage: 4.5,
      crew: 3,
      hardpoints: [
        { key: 'turret', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'light', side: 'soft', rear: 'soft', top: 'soft' },
    },
    slots: ['engine', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage'],
    quirks: ['vq_light_footed'],
    pts: 5,
    blurb: "Four and a half tonnes of despatch rider. The Compact builds it to reach a waystation before the news does and sells the news on arrival, which is most of what it is for.",
  },
  copperline_139_beacon_car: {
    key: 'copperline_139_beacon_car',
    label: "Copperline 139 Beacon Car",
    maker: 'ascendancy_signal_works',
    class: 'armoured_car',
    tier: 'II:Ciph',
    hull: {
      tonnage: 6,
      crew: 4,
      hardpoints: [
        { key: 'ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'light', side: 'light', rear: 'soft', top: 'soft' },
    },
    slots: ['engine', 'armour', 'suspension', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_signals_fitted'],
    pts: 6,
    blurb: "Two thirds of the fighting compartment is a transmitter, and the Ascendancy regards that as the armament. The gun on the ring is there so the aerial can be got away again.",
  },

  // ---- sp_gun ---------------------------------------------------------------
  sledge_145_pit_gun: {
    key: 'sledge_145_pit_gun',
    label: "Sledge 145 Pit Gun",
    maker: 'hundredweight_works',
    class: 'sp_gun',
    tier: 'I',
    hull: {
      tonnage: 15,
      crew: 4,
      hardpoints: [
        { key: 'casemate', allowed: ['artillery', 'crawler_gun'] },
        { key: 'ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'medium', side: 'light', rear: 'light', top: 'none' },
    },
    slots: ['engine', 'armour', 'suspension', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_open_fighting_compartment'],
    pts: 16,
    blurb: "A line hull with the roof taken off and a field piece dropped into the hole. Open to the sky, which the boards note, and which every crew learns the first time it rains ordnance.",
  },
  harrow_149_slaghound_mk2: {
    key: 'harrow_149_slaghound_mk2',
    label: "Harrow 149 Slaghound, Mk II",
    maker: 'mw_kettleharrow_boneyard',
    class: 'sp_gun',
    tier: 'II:Cache',
    hull: {
      tonnage: 18,
      crew: 4,
      hardpoints: [
        { key: 'casemate', allowed: ['crawler_gun'] },
        { key: 'ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'heavy', side: 'light', rear: 'soft', top: 'none' },
    },
    slots: ['engine', 'armour', 'suspension', 'hardpoint', 'optics', 'stowage', 'crew_kit'],
    quirks: ['vq_pieced_together'],
    pts: 13,
    blurb: "Built on the rim of a dead city from whatever the rim gave up. All the plate went on the nose; the sides are what was left, and the Boneyard is honest about which is which.",
  },

  // ---- tractor_gun ----------------------------------------------------------
  crossloom_128_field_carriage: {
    key: 'crossloom_128_field_carriage',
    label: "Crossloom 128 Field Carriage",
    maker: 'crossloom_pattern_house',
    class: 'tractor_gun',
    tier: 'I',
    hull: {
      tonnage: 7,
      crew: 6,
      hardpoints: [
        { key: 'trail', allowed: ['artillery', 'mortar'] },
      ],
      baseArmour: { front: 'soft', side: 'none', rear: 'none', top: 'none' },
    },
    slots: ['engine', 'suspension', 'hardpoint', 'optics', 'stowage', 'crew_kit'],
    quirks: ['vq_prime_mover_dependent'],
    pts: 9,
    blurb: "A split-trail carriage, a shield the width of a kneeling man, and a tractor that belongs to somebody else. Six crew, no hull, and every one of them outside it.",
  },

  // ---- gunboat --------------------------------------------------------------
  punt_137_shoalcutter: {
    key: 'punt_137_shoalcutter',
    label: "Punt 137 Shoalcutter",
    maker: 'mw_redwater_hullyards',
    class: 'gunboat',
    tier: 'I',
    hull: {
      tonnage: 22,
      crew: 8,
      hardpoints: [
        { key: 'fore_turret', allowed: ['crawler_gun', 'hmg'] },
        { key: 'aft_ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'light', side: 'light', rear: 'soft', top: 'none' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_shallow_draught'],
    pts: 10,
    blurb: "Draws less water than a laden barge and is built by diggers rather than shipwrights. It goes where a bridge has been dropped and takes the crossing back at a range nobody expected.",
  },
  reliquary_124_monitor_mk2: {
    key: 'reliquary_124_monitor_mk2',
    label: "Reliquary 124 Monitor, Mk II",
    maker: 'ferrymen_shrine_armoury',
    class: 'gunboat',
    tier: 'II:Wake',
    hull: {
      tonnage: 46,
      crew: 14,
      hardpoints: [
        { key: 'main', allowed: ['artillery'] },
        { key: 'casemate', allowed: ['crawler_gun'] },
        { key: 'ring_fore', allowed: ['hmg'] },
        { key: 'ring_aft', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'medium', side: 'medium', rear: 'light', top: 'light' },
    },
    slots: ['engine', 'armour', 'suspension', 'turret', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_consecrated_plate'],
    pts: 26,
    blurb: "A shrine that floats, and is armed accordingly. The Ferrymen bless the belt before it is riveted and the crew of fourteen are counted as a parish for the purposes of the roll.",
  },

  // ---- fighter --------------------------------------------------------------
  kestrel_150_lofter_mk2: {
    key: 'kestrel_150_lofter_mk2',
    label: "Kestrel 150 Lofter, Mk II",
    maker: 'mw_longshadow_aeroworks',
    class: 'fighter',
    tier: 'II:Ciph',
    hull: {
      tonnage: 2.4,
      crew: 1,
      hardpoints: [
        { key: 'nose', allowed: ['aircraft_gun'] },
        { key: 'wing', allowed: ['aircraft_gun'] },
      ],
      baseArmour: { front: 'light', side: 'soft', rear: 'none', top: 'soft' },
    },
    slots: ['engine', 'armour', 'hardpoint', 'optics', 'radio', 'stowage'],
    quirks: ['vq_high_wing_loading'],
    pts: 16,
    blurb: "Two and a half tonnes behind an engine drawn for four. It climbs like nothing else on the register, turns badly, and is flown by one person who has been told both facts.",
  },
  adjudicated_142_writhawk: {
    key: 'adjudicated_142_writhawk',
    label: "Adjudicated 142 Writhawk",
    maker: 'salvage_court_prize_yard',
    class: 'fighter',
    tier: 'II:Cache',
    hull: {
      tonnage: 2.1,
      crew: 1,
      hardpoints: [
        { key: 'nose', allowed: ['aircraft_gun'] },
        { key: 'ring', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'soft', side: 'soft', rear: 'none', top: 'none' },
    },
    slots: ['engine', 'hardpoint', 'optics', 'radio', 'stowage'],
    quirks: ['vq_pieced_together'],
    pts: 10,
    blurb: "Three airframes adjudicated into one and served with a writ. It has no armour worth the name, and the Court's position is that a machine this cheap is not meant to come back twice.",
  },

  // ---- bomber ---------------------------------------------------------------
  longshadow_154_span_mk1: {
    key: 'longshadow_154_span_mk1',
    label: "Longshadow 154 Span, Mk I",
    maker: 'mw_longshadow_aeroworks',
    class: 'bomber',
    tier: 'III',
    hull: {
      tonnage: 9.5,
      crew: 5,
      hardpoints: [
        { key: 'bay', allowed: ['artillery', 'mortar'] },
        { key: 'nose', allowed: ['aircraft_gun'] },
        { key: 'dorsal', allowed: ['hmg'] },
        { key: 'ventral', allowed: ['hmg'] },
      ],
      baseArmour: { front: 'light', side: 'soft', rear: 'soft', top: 'soft' },
    },
    slots: ['engine', 'armour', 'hardpoint', 'optics', 'radio', 'stowage', 'crew_kit'],
    quirks: ['vq_thin_deck'],
    pts: 24,
    blurb: "The Combine bought the drawing and the crews it takes to fill one. A bay amidships, guns fore, above and below, and five people arguing about the ground through four different windows.",
  },
};

// ---------------------------------------------------------------------------
// 4. Powerplants
//
// `hp` and `weight` (tonnes) are the plant's own; `reliability` is a base
// probability in [0, 1] that a turn passes without a mechanical fault, before
// suspension, armour package and quirks touch it. `heat` is the cooling
// burden in arbitrary works units, 0–12 — it prices radiators, not damage,
// and is what makes a turbine a poor neighbour in a sealed hull.
//
// `fuelClass` is a REGIMENT key out of src/lib/units.js UNIT_KEYS —
// riflemen, crawler, artillery, fighter, gunboat — because a plant's real
// cost is whose supply column has to carry its fuel. NOTE for the platform
// lane: arms.ts's LOGISTICS_CLASSES omits `gunboat` (it has four entries, not
// five). That table prices calibres, not plants, and this lane deliberately
// uses the five-key regiment vocabulary the brief specifies rather than
// narrowing marine diesel into an inland column.
//
// `weight` does NOT enter totalTonnage — hull.tonnage is already the all-up
// stamped weight (see CHASSIS_PATTERNS above). It earns its place in
// breakdownChance instead: a plant much heavier than the pattern was drawn
// around strains the drive, and that is where it is read.
export const POWERPLANTS = {
  hw_flatbed_diesel_60: {
    key: 'hw_flatbed_diesel_60',
    label: "Hundredweight Flatbed Diesel, 60 hp",
    maker: 'hundredweight_works',
    hp: 60,
    weight: 1.4,
    reliability: 0.9,
    fuelClass: 'crawler',
    heat: 2,
    blurb: "A pit-head pump engine with a flywheel taken off it. Slow, cold, and very nearly impossible to stop; the Works has changed the drawing twice in forty years and both times reluctantly.",
  },
  rs_levy_diesel_95: {
    key: 'rs_levy_diesel_95',
    label: "State Levy Diesel, 95 hp",
    maker: 'reclamation_state_arsenal',
    hp: 95,
    weight: 1.9,
    reliability: 0.78,
    fuelClass: 'crawler',
    heat: 3,
    blurb: "Cast in shifts to a tolerance the Arsenal describes as generous. It will start in any weather the drawings anticipated and sulk in the rest, which is most of them.",
  },
  cl_knotwork_diesel_140: {
    key: 'cl_knotwork_diesel_140',
    label: "Knotwork Governed Diesel, 140 hp",
    maker: 'crossloom_pattern_house',
    hp: 140,
    weight: 2.6,
    reliability: 0.88,
    fuelClass: 'crawler',
    heat: 3,
    blurb: "Governed, shimmed and signed for. The waystation fits a lead seal to the throttle stop and charges to break it, which has kept more Knotwork plants alive than the engineering has.",
  },
  em_anvilgate_diesel_240: {
    key: 'em_anvilgate_diesel_240',
    label: "Anvilgate Twin-Bank Diesel, 240 hp",
    maker: 'emberwright_foundries',
    hp: 240,
    weight: 4.4,
    reliability: 0.83,
    fuelClass: 'crawler',
    heat: 5,
    blurb: "Two banks on one crank, drawn so either half can be run alone home. The Union publishes the tolerances; the boards check them; the fuel bill is nobody's business but the column's.",
  },
  em_forgeworks_diesel_460: {
    key: 'em_forgeworks_diesel_460',
    label: "Forgeworks Gallery Diesel, 460 hp",
    maker: 'emberwright_foundries',
    hp: 460,
    weight: 8.2,
    reliability: 0.75,
    fuelClass: 'crawler',
    heat: 7,
    blurb: "Drawn for a foundry gallery and never entirely reconciled to a hull. Eight tonnes of it, hot at the back, and a service interval the Union prints in bold on the plate.",
  },
  tp_seamfire_flash_boiler_180: {
    key: 'tp_seamfire_flash_boiler_180',
    label: "Seamfire Flash Boiler, 180 hp",
    maker: 'tarpool_burnworks',
    hp: 180,
    weight: 5.1,
    reliability: 0.66,
    fuelClass: 'artillery',
    heat: 9,
    blurb: "Burns seam tar, standing timber, or whatever the crew can shovel. It raises pressure in four minutes and holds it for as long as the fittings agree to, which varies.",
  },
  ow_courier_alcohol_75: {
    key: 'ow_courier_alcohol_75',
    label: "Courier Alcohol Burner, 75 hp",
    maker: 'outrider_wheelwrights',
    hp: 75,
    weight: 0.8,
    reliability: 0.85,
    fuelClass: 'riflemen',
    heat: 2,
    blurb: "Light enough for two to lift and content on anything the commissariat can distil. The Compact regards a plant that eats what the levy eats as the only honest sort.",
  },
  kh_boneyard_pieced_diesel_120: {
    key: 'kh_boneyard_pieced_diesel_120',
    label: "Boneyard Pieced Diesel, 120 hp",
    maker: 'mw_kettleharrow_boneyard',
    hp: 120,
    weight: 2.9,
    reliability: 0.58,
    fuelClass: 'crawler',
    heat: 6,
    blurb: "Four dead plants made into one living one, with the good pistons kept and the rest sold. It runs, and Kettleharrow declines to say for how long, in writing, as a matter of policy.",
  },
  rw_shoal_marine_diesel_310: {
    key: 'rw_shoal_marine_diesel_310',
    label: "Redwater Marine Diesel, 310 hp",
    maker: 'mw_redwater_hullyards',
    hp: 310,
    weight: 7.6,
    reliability: 0.87,
    fuelClass: 'gunboat',
    heat: 4,
    blurb: "Cooled by the river it sits in, and therefore cheerful about work that would cook a hull plant. Heavy, wet, and the most reliable thing the Digs have ever sold anyone.",
  },
  as_beacon_turbine_540: {
    key: 'as_beacon_turbine_540',
    label: "Beacon Gas Turbine, 540 hp",
    maker: 'ascendancy_signal_works',
    hp: 540,
    weight: 3.9,
    reliability: 0.7,
    fuelClass: 'fighter',
    heat: 12,
    blurb: "The Ascendancy built it to be heard. It is light for its power, drinks without pause, and leaves a plume that has ended more machines than the running gear ever has.",
  },
  ls_lofter_radial_620: {
    key: 'ls_lofter_radial_620',
    label: "Longshadow Nine-Cylinder Radial, 620 hp",
    maker: 'mw_longshadow_aeroworks',
    hp: 620,
    weight: 3.4,
    reliability: 0.8,
    fuelClass: 'fighter',
    heat: 6,
    blurb: "Nine cylinders in a ring, air past all of them, and a Combine warranty that expires on delivery. It is the reason anything this house flies gets off the ground at all.",
  },
  fs_reliquary_cell_800: {
    key: 'fs_reliquary_cell_800',
    label: "Reliquary Relic-Cell, 800 hp",
    maker: 'ferrymen_shrine_armoury',
    hp: 800,
    weight: 2.2,
    reliability: 0.72,
    fuelClass: 'artillery',
    heat: 1,
    blurb: "Relic material, and the Synod will fit one to nothing it has not blessed first. It is silent, cold, and stops without warning or reason; no works on the Ground can build a second.",
  },
};

// ---------------------------------------------------------------------------
// 5. Armour packages
//
// A package is PURE KEY SUBSTITUTION over a hull's baseArmour:
// { ...hull.baseArmour, ...pkg.facings }. There is no addition here, no
// comparison, and no armour value — drift guard 12 again. A package declares
// the ArmourClass KEY a facing ends at, and arms.ts is the only place that
// knows what that key is worth.
//
// `weight` is tonnes added to the stamped hull weight, which is how a package
// pays for itself in speed. `cost` is points. `reliability` is a DELTA on the
// vehicle's breakdown reliability — plate strains suspension and drive, and
// the heaviest suits strain them badly.
//
// A package may never LOWER a facing. That invariant cannot be asserted in
// this file, because checking it needs armour VALUES; it is asserted in
// test/motor-mirror.test.js, which may import ARMOUR_CLASSES. rollVehicle
// only ever offers a chassis a package that raises or holds all four.
export const ARMOUR_PACKAGES = {
  ap_gun_shield: {
    key: 'ap_gun_shield',
    label: "Gun-Shield & Trail Plate",
    facings: { front: 'light' },
    weight: 0.4,
    cost: 1,
    reliability: 0,
    blurb: "A shield the width of a kneeling man and a plate on the trail legs. It stops what a crew served in the open would otherwise catch, and costs the piece almost nothing.",
  },
  ap_seat_and_sump: {
    key: 'ap_seat_and_sump',
    label: "Seat-Back & Sump Plate",
    facings: { rear: 'soft', top: 'soft' },
    weight: 0.25,
    cost: 1,
    reliability: -0.01,
    blurb: "Plate behind the seat and under the sump, which is where an airframe is hit from and where it burns. A quarter tonne, and every squadron fits it after the first loss.",
  },
  ap_sandbag_stowage: {
    key: 'ap_sandbag_stowage',
    label: "Sandbag & Spare-Track Stowage",
    facings: { front: 'light', side: 'soft' },
    weight: 0.6,
    cost: 1,
    reliability: -0.01,
    blurb: "Sandbags on the nose and spare track links hung on the flanks. The boards decline to price it as armour and every crew on the Ground fits it anyway, without asking.",
  },
  ap_overhead_grillage: {
    key: 'ap_overhead_grillage',
    label: "Overhead Grillage",
    facings: { top: 'light' },
    weight: 0.9,
    cost: 1,
    reliability: -0.01,
    blurb: "Bar stock welded over an open compartment. It will not stop a shell and was never meant to; it stops the mortar bomb that would otherwise land among the crew.",
  },
  ap_spaced_screens: {
    key: 'ap_spaced_screens',
    label: "Spaced Stand-Off Screens",
    facings: { side: 'medium', rear: 'medium' },
    weight: 2.1,
    cost: 3,
    reliability: -0.03,
    blurb: "Thin screens hung a hand's width off the flanks and tail, to make a shaped charge open early. They bend on hedgerows and are replaced from the column's stock as routine.",
  },
  ap_bolted_salvage: {
    key: 'ap_bolted_salvage',
    label: "Bolted Salvage Plate",
    facings: { front: 'medium', side: 'light' },
    weight: 1.8,
    cost: 2,
    reliability: -0.04,
    blurb: "Other people's plate, bolted through the hull where the drawing said not to. It works. The bolt heads shear on a hard stop and the hull is never quite square again.",
  },
  ap_rolled_plate_suit: {
    key: 'ap_rolled_plate_suit',
    label: "Rolled Plate Suit",
    facings: { front: 'medium', side: 'medium', rear: 'light' },
    weight: 3.2,
    cost: 4,
    reliability: -0.05,
    blurb: "The board's standard refit: rolled plate all round to a common thickness, cut to the works drawing. Nothing clever, nothing light, and no argument about where the weak side is.",
  },
  ap_cast_glacis: {
    key: 'ap_cast_glacis',
    label: "Cast Glacis & Nose",
    facings: { front: 'heavy' },
    weight: 3.6,
    cost: 5,
    reliability: -0.06,
    blurb: "A single cast nose replacing the built-up glacis, sloped past what the hull was drawn for. It puts a line crawler's front into the heavy grade and its flanks nowhere at all.",
  },
  ap_sealed_fume_hull: {
    key: 'ap_sealed_fume_hull',
    label: "Sealed Fume Hull",
    facings: { front: 'medium', side: 'medium', rear: 'medium', top: 'light' },
    weight: 4,
    cost: 6,
    reliability: -0.07,
    blurb: "Every seam welded, every hatch gasketted, and a blower on the roof. It is fitted for burn-town work and for nothing else, and the crew inside it can be worked much longer.",
  },
  ap_face_hardened_belt: {
    key: 'ap_face_hardened_belt',
    label: "Face-Hardened Belt",
    facings: { front: 'heavy', side: 'medium' },
    weight: 5.4,
    cost: 7,
    reliability: -0.09,
    blurb: "Case-hardened on the face and soft behind, so a striking shot shatters rather than bites. It cracks if the hull flexes, which is why the boards pair it with a governed plant.",
  },
  ap_breakthrough_carapace: {
    key: 'ap_breakthrough_carapace',
    label: "Breakthrough Carapace",
    facings: { front: 'heavy', side: 'heavy', rear: 'medium', top: 'medium' },
    weight: 9.5,
    cost: 12,
    reliability: -0.14,
    blurb: "Nine and a half tonnes of plate on every face, fitted to hulls that will be shot at from all of them. It costs two steps of pace and a great deal of running gear.",
  },
  ap_relic_alloy_skin: {
    key: 'ap_relic_alloy_skin',
    label: "Relic-Alloy Skin",
    facings: { front: 'heavy', side: 'heavy', rear: 'heavy', top: 'medium' },
    weight: 2.8,
    cost: 18,
    reliability: -0.03,
    blurb: "Recovered sheet, cut cold, and no works on the Ground can make more of it. It weighs a third of what it protects like, and the Reliquary Lobby counts every panel issued.",
  },
  ap_fortress_courses: {
    key: 'ap_fortress_courses',
    label: "Fortress Courses",
    facings: { front: 'superheavy', side: 'superheavy', rear: 'heavy', top: 'heavy' },
    weight: 26,
    cost: 24,
    reliability: -0.2,
    blurb: "Belt plate laid in courses like masonry, on a hull drawn to carry it and on nothing else. Twenty-six tonnes; the boards keep a separate ledger for what has ever moved one.",
  },
};

// ---------------------------------------------------------------------------
// 6. Suspension and drive
//
// `terrain` declares a multiplier for EVERY ONE of TERRAIN_KEYS and for
// nothing else. 1 is unaffected, 0 is impassable, and the range is [0, 1.5].
//
// The four terrains Lane B marks moveCost: null — wall, water, fuel_tank and
// precursor_wall — are 0 for every drive that keeps contact with the ground.
// A non-zero there is a claim to cross a hex Lane B calls impassable, and only
// two drives make it: the twin screw, which is at home in water and nowhere
// else, and flight gear, which is over all of it. A plenum skirt floats a
// river and still will not climb a wall.
//
// `weight` is tonnes of running gear, read by breakdownChance as drive strain
// rather than added to the stamped hull weight. `reliability` is the drive's
// own base probability in [0, 1].
export const SUSPENSIONS = {
  sus_line_tread: {
    key: 'sus_line_tread',
    label: "Line Tread",
    terrain: {
      open: 1, road: 1.1, rail: 0.9, field: 1, rubble: 0.8, ruins: 0.7,
      building: 0.4, wall: 0, woods: 0.6, hedgerow: 0.7, crater: 0.7, water: 0,
      marsh: 0.5, hill: 0.8, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 2.2,
    reliability: 0.82,
    blurb: "Sixteen-inch links on sprung bogies — the drive every board draws first. Good everywhere and best nowhere, which is the point of issuing one pattern to a whole regiment.",
  },
  sus_wide_girder_tread: {
    key: 'sus_wide_girder_tread',
    label: "Wide-Girder Tread",
    terrain: {
      open: 1, road: 1, rail: 0.9, field: 1.05, rubble: 0.85, ruins: 0.75,
      building: 0.4, wall: 0, woods: 0.7, hedgerow: 0.75, crater: 0.8, water: 0,
      marsh: 0.9, hill: 0.85, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 3.1,
    reliability: 0.8,
    blurb: "Twice the footprint and a tonne more of it. It floats a hull across ground that would swallow a line tread, and gives back a little pace on a made road for the privilege.",
  },
  sus_half_track_bogie: {
    key: 'sus_half_track_bogie',
    label: "Half-Track Bogie",
    terrain: {
      open: 1.05, road: 1.25, rail: 0.95, field: 1, rubble: 0.7, ruins: 0.6,
      building: 0.3, wall: 0, woods: 0.5, hedgerow: 0.55, crater: 0.6, water: 0,
      marsh: 0.55, hill: 0.7, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 1.6,
    reliability: 0.86,
    blurb: "Wheels to steer, track to push. It is quicker than a full tread on anything metalled and worse than both on anything broken, and it is what a carrier column runs on.",
  },
  sus_road_wheels: {
    key: 'sus_road_wheels',
    label: "Sprung Road Wheels",
    terrain: {
      open: 1, road: 1.5, rail: 1, field: 0.8, rubble: 0.45, ruins: 0.35,
      building: 0.2, wall: 0, woods: 0.3, hedgerow: 0.35, crater: 0.4, water: 0,
      marsh: 0.25, hill: 0.6, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 0.9,
    reliability: 0.92,
    blurb: "Six wheels, leaf springs, and nothing to shed. On a metalled lane it is half again as fast as anything on treads; off one it is a liability the crew must plan around.",
  },
  sus_walker_legs: {
    key: 'sus_walker_legs',
    label: "Ratchet Walking Legs",
    terrain: {
      open: 0.8, road: 0.8, rail: 0.85, field: 0.85, rubble: 1.1, ruins: 1.15,
      building: 0.9, wall: 0, woods: 1, hedgerow: 1, crater: 1.05, water: 0,
      marsh: 1, hill: 1.15, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 3.6,
    reliability: 0.62,
    blurb: "Ratchet legs off a gallery loader, put under a fighting hull by an engineer with a grievance. It walks into a ruin nothing else enters and breaks a shin doing it about once a week.",
  },
  sus_twin_screw: {
    key: 'sus_twin_screw',
    label: "Twin Screw Drive",
    terrain: {
      open: 0, road: 0, rail: 0, field: 0, rubble: 0, ruins: 0,
      building: 0, wall: 0, woods: 0, hedgerow: 0, crater: 0, water: 1.3,
      marsh: 0.8, hill: 0, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 2.8,
    reliability: 0.88,
    blurb: "Two screws in tunnels, drawing less than a laden barge. It is the only drive on the register with no answer at all to dry ground, and it does not pretend otherwise.",
  },
  sus_plenum_skirt: {
    key: 'sus_plenum_skirt',
    label: "Relic Plenum Skirt",
    terrain: {
      open: 1.2, road: 1.2, rail: 1.15, field: 1.2, rubble: 0.9, ruins: 0.7,
      building: 0.3, wall: 0, woods: 0.5, hedgerow: 0.8, crater: 1, water: 1.1,
      marsh: 1.2, hill: 0.9, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 2.4,
    reliability: 0.55,
    blurb: "Recovered plenum work under a rubber curtain. It crosses marsh and open river at a pace that offends the boards, and fails without warning roughly twice a season.",
  },
  sus_flight_gear: {
    key: 'sus_flight_gear',
    label: "Undercarriage & Mainplanes",
    terrain: {
      open: 1, road: 1, rail: 1, field: 1, rubble: 1, ruins: 1,
      building: 1, wall: 1, woods: 1, hedgerow: 1, crater: 1, water: 1,
      marsh: 1, hill: 1, fuel_tank: 1, precursor_wall: 1,
    },
    weight: 1.1,
    reliability: 0.84,
    blurb: "Mainplanes, a tail and two wheels that touch the ground twice a sortie. Ground is a thing an airframe is above; the board records a modifier of one and moves on.",
  },
  sus_split_trail: {
    key: 'sus_split_trail',
    label: "Split-Trail Carriage",
    terrain: {
      open: 0.6, road: 0.9, rail: 0.6, field: 0.55, rubble: 0.3, ruins: 0.25,
      building: 0.15, wall: 0, woods: 0.2, hedgerow: 0.25, crater: 0.3, water: 0,
      marsh: 0.2, hill: 0.4, fuel_tank: 0, precursor_wall: 0,
    },
    weight: 0.6,
    reliability: 0.95,
    blurb: "Two trail legs, a limber eye and somebody else's tractor. It is the simplest drive on the register and the slowest, and it will still be serviceable when the tractor is not.",
  },
};

// ---------------------------------------------------------------------------
// 7. Turrets and mounts
//
// A mount governs three things: how many of the hull's hardpoints it can
// actually serve, the arc in degrees through which it can be laid, and the
// ArmourClass the GUN CREW themselves are behind — which is a different
// question from what the hull is behind, and the reason an open ring on a
// heavy crawler is still an open ring.
//
// A mount is legal on a chassis only when mount.hardpoints is at most the
// number of hardpoints the hull declares. rollVehicle enforces it; the mirror
// test asserts that at least one mount is legal on every chassis.
export const MOUNTS = {
  mnt_fixed_bow: {
    key: 'mnt_fixed_bow',
    label: "Fixed Bow Plate",
    hardpoints: 1,
    arc: 30,
    crewArmour: 'medium',
    blurb: "The gun goes through the nose and the hull is aimed at the target. The narrowest arc on the register, and the best-protected gunner, for exactly the same reason.",
  },
  mnt_casemate_box: {
    key: 'mnt_casemate_box',
    label: "Casemate Box",
    hardpoints: 1,
    arc: 45,
    crewArmour: 'heavy',
    blurb: "A fixed box built up around the breech, with the thickest plate on the register in front of it. It carries a gun no turret ring on the hull could have taken.",
  },
  mnt_howitzer_cradle: {
    key: 'mnt_howitzer_cradle',
    label: "Howitzer Cradle",
    hardpoints: 1,
    arc: 60,
    crewArmour: 'none',
    blurb: "A cradle, a recoil sleeve and six people standing in the open around it. It lays a heavy piece accurately and offers those six nothing whatever while they do it.",
  },
  mnt_wing_battery: {
    key: 'mnt_wing_battery',
    label: "Wing Battery",
    hardpoints: 2,
    arc: 20,
    crewArmour: 'light',
    blurb: "Guns in the mainplanes, harmonised to converge, laid by pointing the airframe. The pilot is the mount, the seat plate is the protection, and the arc is whatever the machine can turn.",
  },
  mnt_open_pintle_ring: {
    key: 'mnt_open_pintle_ring',
    label: "Open Pintle Ring",
    hardpoints: 1,
    arc: 360,
    crewArmour: 'none',
    blurb: "A ring, a pintle and a man standing up in the weather to use it. Every direction at once, and the boards note that he is visible from all of them.",
  },
  mnt_shielded_ring: {
    key: 'mnt_shielded_ring',
    label: "Shielded Ring Mount",
    hardpoints: 1,
    arc: 300,
    crewArmour: 'soft',
    blurb: "The same ring with a curved shield that travels with the gun. It costs the last sixty degrees behind the gunner and returns the only plate he will ever stand behind.",
  },
  mnt_enclosed_turret: {
    key: 'mnt_enclosed_turret',
    label: "Enclosed Turret",
    hardpoints: 1,
    arc: 360,
    crewArmour: 'medium',
    blurb: "A roofed turret on a proper race, traversed by hand or by drive. It is what a line crawler is drawn around, and what every other mount is judged against.",
  },
  mnt_twin_cradle: {
    key: 'mnt_twin_cradle',
    label: "Twin Cradle",
    hardpoints: 2,
    arc: 240,
    crewArmour: 'light',
    blurb: "Two barrels on one trunnion and one gunner laying both. It serves two hardpoints from a single crew position and gives up the arc behind the mounting to do it.",
  },
  mnt_sponson_pair: {
    key: 'mnt_sponson_pair',
    label: "Sponson Pair",
    hardpoints: 2,
    arc: 120,
    crewArmour: 'medium',
    blurb: "Two boxes hung on the hull sides, each covering its own flank and neither able to help the other. Well plated, badly placed, and the reason a sponson hull fears its own tail.",
  },
  mnt_barbette_tier: {
    key: 'mnt_barbette_tier',
    label: "Tiered Barbette",
    hardpoints: 3,
    arc: 360,
    crewArmour: 'superheavy',
    blurb: "Three fighting positions stacked in one armoured drum, served by a common hoist. Only a hull with the tonnage for a belt can carry it, and only a land fort has ever been given one.",
  },
};

// CREW_EXPOSURE_MORALE — a morale DELTA per mount crewArmour key.
//
// This is the one place in this file where an ArmourClass key indexes
// arithmetic, and what it indexes is a hand-authored morale figure, never an
// armour VALUE. Nothing here is derived from ARMOUR_CLASSES and nothing here
// may be: reading a numeric armour rating in this module is drift guard 12's
// exact prohibition. `fortified` scores below superheavy on purpose — poured works
// are thicker and unsealed, and a crew that must go on breathing knows it.
export const CREW_EXPOSURE_MORALE = {
  none: -2,
  soft: -1,
  light: 0,
  medium: 1,
  heavy: 2,
  superheavy: 2,
  fortified: 1,
};

// ---------------------------------------------------------------------------
// 8. Pure functions
//
// No armour arithmetic appears below, or anywhere above. Weapon stats pass
// through this lane untouched and are compared only in arms.ts.
// ---------------------------------------------------------------------------

// TIER_RANK lookup that fails loudly. A tier this catalogue does not know is a
// content error, not a zero.
export const tierRank = (tier) => {
  const rank = TIER_RANK[tier];
  if (rank === undefined) throw new Error(`motorPool: unknown tier "${tier}"`);
  return rank;
};

// Step lookup over SPEED_CURVE on hp / tonnage, clamped to [1, 8].
// Monotonic non-decreasing in hp and non-increasing in tonnage, because the
// curve ascends and the clamp is applied last.
export const speedFromPowerWeight = (hp, tonnage) => {
  if (!(tonnage > 0)) throw new Error(`motorPool: tonnage must be > 0, got ${tonnage}`);
  const ratio = hp / tonnage;
  let speed = SPEED_CURVE[0].speed;
  for (const row of SPEED_CURVE) {
    if (ratio >= row.minRatio) speed = row.speed;
    else break;
  }
  return Math.max(1, Math.min(8, speed));
};

// SUSPENSIONS[k].terrain[t], failing loudly on either key. A silent undefined
// here would read downstream as "unaffected" and quietly make a river
// passable to a tread.
export const terrainMultiplier = (suspensionKey, terrainKey) => {
  const drive = SUSPENSIONS[suspensionKey];
  if (!drive) throw new Error(`motorPool: unknown suspension "${suspensionKey}"`);
  const mult = drive.terrain[terrainKey];
  if (mult === undefined) throw new Error(`motorPool: unknown terrain "${terrainKey}" for suspension "${suspensionKey}"`);
  return mult;
};
