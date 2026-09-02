// ---------------------------------------------------------------------------
// THE MOTOR POOL — frontend mirror of base44/shared/motorPool.ts.
//
// Display and pre-validation only; the server module is authoritative. The two
// files carry IDENTICAL table content and IDENTICAL function bodies — there is
// no UI-only allowlist here, because label and blurb are already canonical on
// the server side. test/motor-mirror.test.js enforces both halves: the tables
// deep-equal and the exported identifier sets are equal.
//
// NO ARMOUR OR PENETRATION ARITHMETIC EXISTS IN THIS FILE either (drift guard
// 12). Facings are ArmourClass KEYS; arms.ts owns every value and every
// comparison.
//
// base44/shared/* never imports from src/ and src/lib/* never imports from
// base44/, so the two files import Lane I's catalogue by their own path — the
// only line in either file that differs on purpose.
//
// Design record: docs/MOTOR_POOL.md
// ---------------------------------------------------------------------------

// Lane I's catalogue. The three tables and two functions this lane draws on,
// and nothing else. The hit resolver, the penetration rows, the damage-type
// matrix and the armour values are deliberately NOT imported, and the four
// identifiers that name them do not appear in this file's source text at all —
// which is exactly what the acceptance grep looks for, so this comment cannot
// spell them out either.
import { WEAPON_PATTERNS, QUALITY_GRADES, QUALITY_ORDER, resolveWeapon, rollWeapon } from '@/lib/arms.js';

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
// 8. Refit, specials and condition vocabularies
//
// Three fixed string sets, all three from the lane brief verbatim. They exist
// so that a refit kit's numbers, a stand's specials and a quirk's trigger are
// all drawn from a CLOSED vocabulary: an invented key is caught by a red test
// instead of arriving downstream as an undefined the engine reads as zero.
// ---------------------------------------------------------------------------

// The only legal keys of a VehicleMod's `mods` and `tradeoff`, and of a
// VehicleQuirk's `mods`. §4 fixes the list; extending it is a §4 amendment.
//
// TWO OF THE NINETEEN ARE DELIBERATELY UNUSED BY EVERY SHIPPED ROW, and that
// is worth saying plainly rather than leaving a reader to grep for it.
// `weight` is the vocabulary's word for a COMPONENT's own mass — a plant, a
// drive, an armour package each declare `weight` as a field of their own — so
// a refit kit that makes a hull heavier says `tonnage`, which is the all-up
// stamped figure the speed curve divides into. `pts` is the price of a kit,
// and every kit already declares `pts` as a field; a `pts` delta inside `mods`
// would be a second, silent price on the same row. Both keys stay in the
// vocabulary because §4 puts them there and a later kit may want them.
//
// WHICH OF THE REMAINING SEVENTEEN THIS LANE ACTUALLY SPENDS is documented in
// docs/MOTOR_POOL.md §12, in a table, alongside the ones that are DECLARATIVE
// — carried on the row, mirrored, tested, and read by the platform rather than
// by any function here. Lane I made the same split for its quirks' morale
// keys, and stating it is the difference between a handoff and dead data.
export const VEHICLE_STAT_KEYS = [
  'hp', 'tonnage', 'weight', 'reliability', 'heat', 'speed', 'ranged', 'range',
  'accuracy', 'rateOfFire', 'melee', 'morale', 'initiative', 'arc', 'hardpoints',
  'crew', 'fuelUse', 'losRange', 'pts',
];

// The only tokens deriveMechanized().specials may contain. Every one of the
// fifteen is emitted by at least one source in MOTOR_MODEL.specials, and the
// mirror test asserts BOTH directions — no token without a source, no source
// emitting a token that is not here. A specials vocabulary that outruns its
// sources is a list of promises.
export const MECHANIZED_SPECIALS = [
  'indirect', 'direct_fire', 'air', 'naval', 'amphibious', 'sealed', 'open_top',
  'tracked', 'wheeled', 'walker', 'towed', 'smoke', 'crush', 'recon', 'command',
];

// Every vehicle quirk's condition.key comes from this list, and every key on
// this list is carried by at least one quirk — again asserted both ways.
//
// The first seven are LANE I'S OWN condition keys, reused rather than
// re-spelled: arms.ts's QUIRK_CONDITION_KEYS already has `always`, `weather`,
// `terrain`, `night`, `vs_house`, `quality_at_least` and `round_at_least`, and
// a synonym for any of them would give the platform two vocabularies to wire
// where one would do. The last five are the ones a hull has and a rifle does
// not: whether it is being driven below its full pace, whether it stood still,
// how many hands are in it, what it weighs, and whether it is hull down.
//
// `crew_at_least`, `tonnage_at_least` and `quality_at_least` are evaluable
// from the INSTANCE alone — deriveMechanized and breakdownChance fill them in
// from the vehicle before evaluating, so those three fire with no engine
// context at all. The remaining eight need a turn, and the engine supplies it.
export const VEHICLE_QUIRK_CONDITIONS = [
  'always', 'weather', 'terrain', 'night', 'vs_house', 'quality_at_least',
  'round_at_least', 'below_full_pace', 'stationary', 'crew_at_least',
  'tonnage_at_least', 'hull_down',
];

// ---------------------------------------------------------------------------
// 9. Refit kits — the vehicle modifications
//
// Thirty-four kits across the nine slots. A hull may carry ONE kit per slot,
// and only in a slot it declares (CHASSIS_PATTERNS[k].slots), which is why the
// slot list on a hull is a real constraint rather than decoration.
//
// EVERY KIT PAYS. `mods` and `tradeoff` are both non-empty, every key of both
// is in VEHICLE_STAT_KEYS, and THE TWO KEY SETS ARE DISJOINT — a kit may not
// both raise and "cost" the same stat, which is the exact shape a fake
// tradeoff takes. A pure-upside kit is a lane failure, not a good deal, and
// the mirror test refuses the whole table if one appears.
//
// The sign convention is: a number in `mods` is the improvement the kit is
// bought for, a number in `tradeoff` is what it costs, and the SIGN is written
// as the engine will read it. So a kit that adds nine hundred kilogrammes
// writes `tonnage: 0.9` under tradeoff, and a kit that cuts fuel draw writes
// `fuelUse: -0.3` under mods. Reading the sign off the section it sits in is
// wrong; read it off the arithmetic.
export const VEHICLE_MODS = {
  // ---- engine ---------------------------------------------------------------
  vm_governor_removed: {
    key: 'vm_governor_removed',
    label: "Governor Removed",
    slot: 'engine',
    appliesTo: ['scout_crawler', 'line_crawler', 'heavy_crawler', 'half_track', 'armoured_car', 'sp_gun', 'tractor_gun', 'gunboat'],
    pts: 1,
    mods: { hp: 25 },
    tradeoff: { reliability: -0.08, heat: 2 },
    blurb: "The seal comes off the throttle stop and the plant is allowed the power it was drawn with. The waystation fines the crew, the bearings collect the rest of the bill.",
  },
  vm_forced_induction: {
    key: 'vm_forced_induction',
    label: "Forced Induction Pack",
    slot: 'engine',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat', 'fighter', 'bomber'],
    pts: 3,
    mods: { hp: 40 },
    tradeoff: { heat: 3, fuelUse: 0.2 },
    blurb: "A blower geared off the crank, forcing more air than the plant was drawn to breathe. It buys power outright and pays for it in cooling and in the column's fuel.",
  },
  vm_radiator_gallery: {
    key: 'vm_radiator_gallery',
    label: "Radiator Gallery",
    slot: 'engine',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { heat: -4, reliability: 0.03 },
    tradeoff: { tonnage: 0.5, arc: -10 },
    blurb: "Matting and header tanks hung across the engine deck. It takes the heat out of a hot plant and puts a structure where the gun used to be able to traverse.",
  },
  vm_low_compression_rebuild: {
    key: 'vm_low_compression_rebuild',
    label: "Low-Compression Rebuild",
    slot: 'engine',
    appliesTo: ['scout_crawler', 'line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'armoured_car', 'sp_gun', 'tractor_gun', 'gunboat'],
    pts: 1,
    mods: { reliability: 0.09 },
    tradeoff: { hp: -20 },
    blurb: "The works takes the compression down until the plant will run on whatever the column is actually carrying. It stops breaking. It also stops being quick.",
  },
  vm_relic_cell_governor: {
    key: 'vm_relic_cell_governor',
    label: "Relic-Cell Governor",
    slot: 'engine',
    appliesTo: ['heavy_crawler', 'land_fort', 'gunboat', 'fighter', 'bomber'],
    pts: 6,
    mods: { hp: 60, heat: -3 },
    tradeoff: { reliability: -0.06, fuelUse: 0.4 },
    blurb: "A precursor regulator spliced into the fuel gallery by a crew who cannot read what it says. It gives more and runs cooler, and nobody can say why it sometimes stops.",
  },

  // ---- armour ---------------------------------------------------------------
  vm_track_skirts: {
    key: 'vm_track_skirts',
    label: "Track Skirts",
    slot: 'armour',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'sp_gun'],
    pts: 2,
    mods: { reliability: 0.05 },
    tradeoff: { tonnage: 0.9, arc: -20 },
    blurb: "Hung plate down the run of the track, to catch what would otherwise take a bogie off. It keeps the drive whole and fouls anything mounted low on the hull side.",
  },
  vm_spall_liner: {
    key: 'vm_spall_liner',
    label: "Spall Liner",
    slot: 'armour',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 3,
    mods: { morale: 2 },
    tradeoff: { crew: -1 },
    blurb: "Quilted matting glued to the inner face, so a strike that does not come through does not fill the compartment with metal. It takes the room a fourth pair of hands stood in.",
  },
  vm_belly_plate: {
    key: 'vm_belly_plate',
    label: "Belly Plate",
    slot: 'armour',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'armoured_car', 'sp_gun'],
    pts: 2,
    mods: { reliability: 0.06, morale: 1 },
    tradeoff: { tonnage: 1.1, speed: -1 },
    blurb: "A second floor laid under the fighting compartment against buried charges. Every crew that has driven over one asks for it, and every one of them notices the pace afterwards.",
  },
  vm_mantlet_collar: {
    key: 'vm_mantlet_collar',
    label: "Mantlet Collar",
    slot: 'armour',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { morale: 1, accuracy: 0.02 },
    tradeoff: { arc: -30, tonnage: 0.4 },
    blurb: "A cast collar closing the gap where the barrel leaves the plate. It seals the one hole every gunner knows about, and it will not let the piece lay as far round.",
  },

  // ---- suspension -----------------------------------------------------------
  vm_reinforced_bogies: {
    key: 'vm_reinforced_bogies',
    label: "Reinforced Bogies",
    slot: 'suspension',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'sp_gun'],
    pts: 2,
    mods: { reliability: 0.07 },
    tradeoff: { tonnage: 1.4, speed: -1 },
    blurb: "Heavier arms, heavier springs and a bogie the works will actually stand behind under a loaded hull. It carries the plate the crew have bolted on and it costs a hex.",
  },
  vm_wide_grousers: {
    key: 'vm_wide_grousers',
    label: "Wide Grousers",
    slot: 'suspension',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'sp_gun'],
    pts: 1,
    mods: { speed: 1 },
    tradeoff: { reliability: -0.05, tonnage: 0.6 },
    blurb: "Extended plates bolted through every second link, so the hull floats where it used to dig. The bolts work loose, the links stretch, and the crew get their pace back anyway.",
  },
  vm_shock_dampers: {
    key: 'vm_shock_dampers',
    label: "Shock Dampers",
    slot: 'suspension',
    appliesTo: ['scout_crawler', 'line_crawler', 'heavy_crawler', 'half_track', 'armoured_car', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { accuracy: 0.05 },
    tradeoff: { tonnage: 0.7, reliability: -0.02 },
    blurb: "Fluid dampers on the leading stations, to settle a hull that is being asked to shoot before it has stopped rocking. One more thing on the running gear to leak.",
  },
  vm_dozer_blade: {
    key: 'vm_dozer_blade',
    label: "Dozer Blade",
    slot: 'suspension',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun'],
    pts: 3,
    mods: { melee: 2 },
    tradeoff: { speed: -1, tonnage: 1.5 },
    blurb: "A cutting edge on rams across the nose, for filling a ditch or opening a wall. It is also the reason a line crawler is a thing infantry decline to stand in front of.",
  },

  // ---- turret ---------------------------------------------------------------
  vm_power_traverse: {
    key: 'vm_power_traverse',
    label: "Power Traverse",
    slot: 'turret',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 3,
    mods: { arc: 60, rateOfFire: 0.15 },
    tradeoff: { reliability: -0.05, heat: 1 },
    blurb: "A traverse motor geared off the plant, so the turret follows the commander instead of the gunner's shoulder. It doubles the useful arc and adds a hydraulic loom to lose.",
  },
  vm_long_barrel_gun: {
    key: 'vm_long_barrel_gun',
    label: "Long-Barrel Fitting",
    slot: 'turret',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 4,
    mods: { range: 2, ranged: 0.5 },
    tradeoff: { arc: -40, tonnage: 0.6 },
    blurb: "A longer tube in the same cradle. It reaches further and hits harder, and the muzzle overhang means the turret can no longer be swung past the hull's own stowage.",
  },
  vm_cupola_ring: {
    key: 'vm_cupola_ring',
    label: "Commander's Cupola",
    slot: 'turret',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'armoured_car', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { losRange: 2, initiative: 1 },
    tradeoff: { tonnage: 0.4, arc: -20 },
    blurb: "A vision ring cut into the roof so the commander can see out with the hatch shut. It is the single most requested fitting on the register and it raises the silhouette.",
  },
  vm_turret_basket: {
    key: 'vm_turret_basket',
    label: "Turret Basket",
    slot: 'turret',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'gunboat'],
    pts: 2,
    mods: { rateOfFire: 0.2 },
    tradeoff: { tonnage: 0.7, crew: -1 },
    blurb: "A floor that turns with the turret, so the loader stops climbing over the ammunition to keep up with the traverse. It also walls a crew position out of the hull.",
  },

  // ---- hardpoint ------------------------------------------------------------
  vm_smoke_dischargers: {
    key: 'vm_smoke_dischargers',
    label: "Smoke Dischargers",
    slot: 'hardpoint',
    appliesTo: ['scout_crawler', 'line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'armoured_car', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { morale: 1, initiative: 1 },
    tradeoff: { hardpoints: -1 },
    blurb: "Banks of dischargers on the mounting, and the crew's whole plan for the day they are seen first. They take a hardpoint the ordnance board would rather have given a gun.",
  },
  vm_coaxial_pintle: {
    key: 'vm_coaxial_pintle',
    label: "Coaxial Pintle",
    slot: 'hardpoint',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat', 'bomber'],
    pts: 2,
    mods: { ranged: 0.6 },
    tradeoff: { heat: 1, reliability: -0.03 },
    blurb: "A second, lighter barrel yoked to the main and laid by the same sight. It adds weight of fire to every engagement and one more mechanism to jam in the same box.",
  },
  vm_ready_racks: {
    key: 'vm_ready_racks',
    label: "Ready Racks",
    slot: 'hardpoint',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'tractor_gun', 'gunboat', 'bomber'],
    pts: 2,
    mods: { rateOfFire: 0.25 },
    tradeoff: { morale: -2 },
    blurb: "Rounds stood upright at the loader's elbow instead of stowed below the floor. Every crew who has fitted them shoots faster, and every crew who has fitted them knows why not to.",
  },
  vm_muzzle_brake_collar: {
    key: 'vm_muzzle_brake_collar',
    label: "Muzzle Brake Collar",
    slot: 'hardpoint',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'tractor_gun', 'gunboat'],
    pts: 1,
    mods: { accuracy: 0.06 },
    tradeoff: { losRange: -1 },
    blurb: "A ported collar that takes the worst of the recoil out of the mounting, so the second round goes where the first did. It also raises a wall of dust in front of the sight.",
  },

  // ---- optics ---------------------------------------------------------------
  vm_range_drum_sight: {
    key: 'vm_range_drum_sight',
    label: "Range-Drum Sight",
    slot: 'optics',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'tractor_gun', 'gunboat', 'fighter', 'bomber'],
    pts: 2,
    mods: { accuracy: 0.07 },
    tradeoff: { rateOfFire: -0.1 },
    blurb: "A drum graduated for the piece's own trajectory, set by hand each time the range changes. It puts the round where the gunner meant it and it slows him down doing it.",
  },
  vm_night_lamp_set: {
    key: 'vm_night_lamp_set',
    label: "Night Lamp Set",
    slot: 'optics',
    appliesTo: ['scout_crawler', 'line_crawler', 'half_track', 'armoured_car', 'gunboat'],
    pts: 2,
    mods: { losRange: 2 },
    tradeoff: { morale: -1, heat: 1 },
    blurb: "A shuttered lamp and a filtered screen, worked from inside the hull. It is the only way to see anything at all after dusk, and everything that can see is looking at it.",
  },
  vm_stereo_rangefinder: {
    key: 'vm_stereo_rangefinder',
    label: "Stereo Rangefinder",
    slot: 'optics',
    appliesTo: ['heavy_crawler', 'land_fort', 'sp_gun', 'tractor_gun', 'gunboat'],
    pts: 4,
    mods: { range: 2, accuracy: 0.05 },
    tradeoff: { rateOfFire: -0.08, tonnage: 0.5 },
    blurb: "A coincidence instrument across the full width of the mounting, read by one man who does nothing else. It is the difference between ranging a target and guessing at it.",
  },

  // ---- radio ----------------------------------------------------------------
  vm_command_set: {
    key: 'vm_command_set',
    label: "Command Wireless Set",
    slot: 'radio',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'armoured_car', 'gunboat', 'bomber'],
    pts: 4,
    mods: { initiative: 2 },
    tradeoff: { hardpoints: -1 },
    blurb: "A long-set and its operator, sited where the hull gun and its ammunition were. The stand stops being one machine and starts being the place the others are told what to do.",
  },
  vm_signals_relay: {
    key: 'vm_signals_relay',
    label: "Signals Relay",
    slot: 'radio',
    appliesTo: ['scout_crawler', 'line_crawler', 'half_track', 'armoured_car', 'gunboat', 'fighter', 'bomber'],
    pts: 2,
    mods: { initiative: 1, losRange: 1 },
    tradeoff: { tonnage: 0.3, reliability: -0.02 },
    blurb: "A repeater set that carries the company net further than one hull could hold it. The aerial is fragile, the loom chafes, and the flank stops going quiet at the worst moment.",
  },
  vm_direction_finder: {
    key: 'vm_direction_finder',
    label: "Direction Finder",
    slot: 'radio',
    appliesTo: ['line_crawler', 'armoured_car', 'gunboat', 'bomber'],
    pts: 3,
    mods: { losRange: 3 },
    tradeoff: { initiative: -1, tonnage: 0.3 },
    blurb: "A rotating loop and a set of bearings taken on whoever is transmitting. It finds what cannot be seen, and it keeps the commander's head in a headset instead of in the fight.",
  },

  // ---- stowage --------------------------------------------------------------
  vm_external_fuel_drums: {
    key: 'vm_external_fuel_drums',
    label: "External Fuel Drums",
    slot: 'stowage',
    appliesTo: ['scout_crawler', 'line_crawler', 'heavy_crawler', 'half_track', 'armoured_car', 'sp_gun', 'gunboat'],
    pts: 1,
    mods: { fuelUse: -0.3 },
    tradeoff: { morale: -1, reliability: -0.02 },
    blurb: "Drums strapped across the engine deck, jettisoned by a lever the crew hope still works. They halve what the column has to bring forward and nobody likes riding with them.",
  },
  vm_spare_link_bins: {
    key: 'vm_spare_link_bins',
    label: "Spare-Link Bins",
    slot: 'stowage',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'sp_gun'],
    pts: 1,
    mods: { reliability: 0.05 },
    tradeoff: { tonnage: 0.5, arc: -10 },
    blurb: "Bins of track links, pins and a driving band, welded where the crew can reach them under fire. A thrown track stops being a recovery job and starts being an hour's work.",
  },
  vm_deck_cargo_rails: {
    key: 'vm_deck_cargo_rails',
    label: "Deck Cargo Rails",
    slot: 'stowage',
    appliesTo: ['half_track', 'line_crawler', 'gunboat', 'armoured_car'],
    pts: 3,
    mods: { crew: 4 },
    tradeoff: { speed: -1, tonnage: 1.2 },
    blurb: "Rails, benches and grab-lines down both sides, so a section rides where the stowage was. The stand arrives with its own infantry and arrives later than it would have.",
  },

  // ---- crew_kit -------------------------------------------------------------
  vm_asbestos_suits: {
    key: 'vm_asbestos_suits',
    label: "Fireproofed Crew Suits",
    slot: 'crew_kit',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat', 'fighter', 'bomber'],
    pts: 2,
    mods: { morale: 2 },
    tradeoff: { rateOfFire: -0.08 },
    blurb: "Heavy treated coveralls and gauntlets issued against the one death every crew has watched. They are stifling, they catch on everything in the compartment, and no one refuses them.",
  },
  vm_medical_locker: {
    key: 'vm_medical_locker',
    label: "Medical Locker",
    slot: 'crew_kit',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'half_track', 'sp_gun', 'gunboat', 'bomber'],
    pts: 2,
    mods: { morale: 2 },
    tradeoff: { tonnage: 0.3, rateOfFire: -0.05 },
    blurb: "A sealed locker of dressings, morphia and a splint, bolted where the fourth man can reach it sitting down. It occupies exactly the space the ready rounds wanted.",
  },
  vm_escape_hatch_cut: {
    key: 'vm_escape_hatch_cut',
    label: "Cut Escape Hatch",
    slot: 'crew_kit',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { morale: 3 },
    tradeoff: { reliability: -0.06 },
    blurb: "A hatch cut through the floor by the crew, against the works' drawings and the boards' advice. It is the reason they will go on fighting, and it weakens everything above it.",
  },
  vm_ventilation_fans: {
    key: 'vm_ventilation_fans',
    label: "Ventilation Fans",
    slot: 'crew_kit',
    appliesTo: ['line_crawler', 'heavy_crawler', 'land_fort', 'sp_gun', 'gunboat'],
    pts: 2,
    mods: { heat: -2, rateOfFire: 0.08 },
    tradeoff: { tonnage: 0.3, reliability: -0.02 },
    blurb: "Extractors over the breech, clearing fume the crew would otherwise breathe until they stopped loading. They keep the compartment workable and give the plant one more belt to shed.",
  },
};

// ---------------------------------------------------------------------------
// 10. Quirks
//
// Twenty-four, in Lane I's Quirk shape verbatim — { key, label, mods,
// condition, blurb } — and every one carries a MACHINE-EVALUABLE condition out
// of VEHICLE_QUIRK_CONDITIONS. A quirk whose effect exists only in prose is a
// lane failure (drift guard 11), so every row's `mods` is a non-empty record
// of VEHICLE_STAT_KEYS and evaluateVehicleQuirk decides, in code, whether it
// applies.
//
// Sixteen of these are INNATE — named by a chassis pattern's `quirks` list and
// born with the hull. The other eight are ROLLABLE: listed in
// ROLL_ODDS.rollableQuirks and drawn onto any hull by rollVehicle. The two
// sets are deliberately disjoint at the roll, because a Shallow Draught
// fighter or a Prime-Mover Dependent gunboat is nonsense a generic pool would
// produce on its first thousand seeds.
export const VEHICLE_QUIRKS = {
  // --- innate: the pattern's own character ---------------------------------
  vq_light_footed: {
    key: 'vq_light_footed', label: "Light-Footed",
    mods: { speed: 1, morale: -1 },
    condition: { key: 'always' },
    blurb: "It was drawn as a cart and it still moves like one. Faster than the boards allow for, and thin enough that the crew never quite forget what they are riding in.",
  },
  vq_prize_hull: {
    key: 'vq_prize_hull', label: "Prize Hull",
    mods: { morale: 1 },
    condition: { key: 'vs_house', value: 'native_house' },
    blurb: "Adjudicated salvage, rebuilt and re-stamped. Set against the house whose yard first cut the plate, the crew fight it with an enthusiasm the Court does not record.",
  },
  vq_forgiving_tolerances: {
    key: 'vq_forgiving_tolerances', label: "Forgiving Tolerances",
    mods: { reliability: 0.05 },
    condition: { key: 'always' },
    blurb: "Coarse threads, generous clearances, and a fitter's assumption that nothing will ever be clean. It is the reason the pattern is still in service and nobody admires it.",
  },
  vq_cramped_fighting_room: {
    key: 'vq_cramped_fighting_room', label: "Cramped Fighting Room",
    mods: { rateOfFire: -0.1, morale: -1 },
    condition: { key: 'always' },
    blurb: "The drawings gave the plant its room first and the crew whatever was left. Every round is loaded by a man who has to move somebody else to do it.",
  },
  vq_hand_fitted_gearbox: {
    key: 'vq_hand_fitted_gearbox', label: "Hand-Fitted Gearbox",
    mods: { reliability: 0.1 },
    condition: { key: 'below_full_pace' },
    blurb: "Every gear in it was scraped to its neighbour by one fitter who signed the case. Held below its full pace it will run for ever; asked for everything, it is an ordinary gearbox.",
  },
  vq_thirsty: {
    key: 'vq_thirsty', label: "Thirsty",
    mods: { fuelUse: 0.35 },
    condition: { key: 'always' },
    blurb: "The plant drinks at a rate the supply column plans its whole day around. Nothing about the machine fails; the argument is always with the quartermaster.",
  },
  vq_ponderous: {
    key: 'vq_ponderous', label: "Ponderous",
    mods: { speed: -1, melee: 1 },
    condition: { key: 'always' },
    blurb: "It arrives when it arrives. What it does on arrival is not in dispute, and neither is the state of whatever was standing where it wanted to be.",
  },
  vq_open_fighting_compartment: {
    key: 'vq_open_fighting_compartment', label: "Open Fighting Compartment",
    mods: { morale: -1, initiative: 1, losRange: 1 },
    condition: { key: 'always' },
    blurb: "No roof. The crew see everything coming, hear the order the first time it is given, and have nothing at all over their heads while they act on it.",
  },
  vq_boiler_shy: {
    key: 'vq_boiler_shy', label: "Boiler-Shy",
    mods: { reliability: -0.15 },
    condition: { key: 'weather', value: 'rain' },
    blurb: "The flash boiler will not hold its head of steam once the lagging is wet through. The works has issued three remedies and the crews have stopped fitting any of them.",
  },
  vq_signals_fitted: {
    key: 'vq_signals_fitted', label: "Signals-Fitted",
    mods: { initiative: 1, losRange: 1 },
    condition: { key: 'always' },
    blurb: "Built around its set rather than having one added later, with the aerial lead run inside the plate. Whatever else the pattern does badly, it is never out of touch.",
  },
  vq_pieced_together: {
    key: 'vq_pieced_together', label: "Pieced Together",
    mods: { reliability: -0.12, morale: 1 },
    condition: { key: 'always' },
    blurb: "Four hulls went into the yard and this came out. The crew can name where each section served, which is worth something, and no two fasteners on it are the same.",
  },
  vq_prime_mover_dependent: {
    key: 'vq_prime_mover_dependent', label: "Prime-Mover Dependent",
    mods: { speed: -2 },
    condition: { key: 'always' },
    blurb: "It has no drive of its own and never pretended to. Where it goes, and how fast, is a question about the tractor in front of it and the state of the road.",
  },
  vq_shallow_draught: {
    key: 'vq_shallow_draught', label: "Shallow Draught",
    mods: { speed: 1, reliability: 0.04 },
    condition: { key: 'terrain', value: 'marsh' },
    blurb: "Drawn for the flooded diggings, where the water is a foot deep and full of iron. In the marsh it goes where nothing else will; everywhere else it is an ordinary hull.",
  },
  vq_consecrated_plate: {
    key: 'vq_consecrated_plate', label: "Consecrated Plate",
    mods: { morale: 2 },
    condition: { key: 'round_at_least', value: 3 },
    blurb: "Each course was signed and censed before it was hung. The crew do not claim it stops anything; they claim it matters once a fight has gone on long enough to be about staying.",
  },
  vq_thin_deck: {
    key: 'vq_thin_deck', label: "Thin Deck",
    mods: { speed: 1, morale: -1 },
    condition: { key: 'always' },
    blurb: "The structure is the lightest the stress office would sign. It carries the load it was drawn for and the crew have read the same drawings the office did.",
  },
  vq_high_wing_loading: {
    key: 'vq_high_wing_loading', label: "High Wing Loading",
    mods: { speed: 1, initiative: -1 },
    condition: { key: 'always' },
    blurb: "Small planes and a heavy airframe. It is quick in a straight line and takes a wide, patient turn that the crews of slower machines have learned to wait for.",
  },

  // --- rollable: what a hull picks up in service ---------------------------
  vq_governor_sealed: {
    key: 'vq_governor_sealed', label: "Governor Sealed",
    mods: { reliability: 0.08, speed: -1 },
    condition: { key: 'always' },
    blurb: "A waystation lead seal on the throttle stop, and a fine written against the crew if it is broken. The plant will outlast the hull. It will not outrun anything.",
  },
  vq_re_bored_barrel: {
    key: 'vq_re_bored_barrel', label: "Re-Bored Barrel",
    mods: { ranged: 0.4, accuracy: -0.03 },
    condition: { key: 'quality_at_least', value: 'proofed' },
    blurb: "Opened out a size at a proofed yard and re-chambered to suit. On a hull that was properly built to begin with it hits noticeably harder and groups a little wider.",
  },
  vq_frost_start: {
    key: 'vq_frost_start', label: "Frost-Start",
    mods: { reliability: -0.12 },
    condition: { key: 'weather', value: 'snow' },
    blurb: "Something in the fuel gallery waxes at the first hard frost, and no amount of lamping under the sump has ever settled which part of it. It starts eventually.",
  },
  vq_no_night_gear: {
    key: 'vq_no_night_gear', label: "No Night Gear",
    mods: { losRange: -2, initiative: -1 },
    condition: { key: 'night' },
    blurb: "The lamp brackets are there and the lamps never came. After dusk the machine is driven on shouted directions from a man walking in front of it.",
  },
  vq_settled_bearings: {
    key: 'vq_settled_bearings', label: "Settled Bearings",
    mods: { reliability: 0.06, accuracy: 0.03 },
    condition: { key: 'stationary' },
    blurb: "Everything in it has found its own seat over a long service. Standing still it is the steadiest gun platform in the company, and it takes a while to persuade into motion.",
  },
  vq_deck_gang: {
    key: 'vq_deck_gang', label: "Deck Gang",
    mods: { reliability: 0.06, morale: 1 },
    condition: { key: 'crew_at_least', value: 5 },
    blurb: "Enough hands aboard that a fault is somebody's job while the fight goes on. The big crews fix things under fire that a crew of three would have to withdraw to reach.",
  },
  vq_bogs_the_soft_going: {
    key: 'vq_bogs_the_soft_going', label: "Bogs the Soft Going",
    mods: { speed: -1 },
    condition: { key: 'tonnage_at_least', value: 20 },
    blurb: "Loaded to this weight it makes its own ground and then sits in it. The drivers know the feel of the moment it begins and there is nothing whatever to be done about it.",
  },
  vq_low_silhouette: {
    key: 'vq_low_silhouette', label: "Low Silhouette",
    mods: { morale: 1, accuracy: 0.04 },
    condition: { key: 'hull_down' },
    blurb: "Squat enough that a fold in the ground covers everything but the mounting. Sited properly it is a gun in a hole, and it is priced as though it were still a vehicle.",
  },
};

// ---------------------------------------------------------------------------
// 11. The roll-up curves
//
// Both are step lookups, both ascend, and both are read by deriveMechanized.
// ---------------------------------------------------------------------------

// Melee on all-up tonnage. A mechanized stand's close-quarters value is what
// it weighs and where it can put that weight; nothing else about the machine
// enters. LOOKUP RULE: the LAST row whose minTonnage <= tonnage.
export const MELEE_CURVE = [
  { minTonnage: 0, melee: 1 },
  { minTonnage: 8, melee: 2 },
  { minTonnage: 16, melee: 3 },
  { minTonnage: 32, melee: 4 },
  { minTonnage: 64, melee: 5 },
];

// Morale on crew number, before the mount's exposure delta and before any kit
// or quirk. More hands is more mutual obligation: the single-seat pilot has
// nobody to be steady in front of. LOOKUP RULE: the LAST row whose minCrew <=
// crew. Crew is the hull's own plus any refit kit's `crew` delta, so a spall
// liner that costs a position costs the morale that position carried.
export const CREW_MORALE_CURVE = [
  { minCrew: 1, morale: 3 },
  { minCrew: 3, morale: 4 },
  { minCrew: 5, morale: 5 },
  { minCrew: 8, morale: 6 },
  { minCrew: 12, morale: 7 },
];

// ---------------------------------------------------------------------------
// 12. The roll-up model
//
// The constants deriveMechanized, breakdownChance and totalTonnage spend, and
// the specials sources, in ONE table so that no number in this lane is typed
// twice. Every field below is read by a function in section 14 or by a test
// that recomputes something from it; there is no configuration here that
// nothing consumes.
//
// ⚠ ADDITION TO THE BRIEF'S EXPORT SURFACE, declared rather than smuggled.
// The lane brief's export table does not list MOTOR_MODEL. It is added because
// the alternative was a dozen bare numbers inside function bodies, which drift
// guard 7 forbids ("numbers live in one place"), and because the specials
// sources have to be data if the vocabulary is to be checked in both
// directions. It changes NO §4 shape, so it is not a §4 amendment; it is
// mirrored and mirror-tested like every other table here.
export const MOTOR_MODEL = {
  // -- pricing (docs/MOTOR_POOL.md §13) --
  // A plant's points are its power: 0.02/hp puts the 95 hp levy diesel at
  // 1.9 and the 800 hp relic cell at 16, against a 12-point reference hull.
  plantPtsPerHp: 0.02,
  plantPtsMin: 1,
  decimals: 2,

  // -- tonnage, strain and breakdown (§12) --
  // A package heavier than this fraction of the stamped hull weight is not
  // offered to that hull by rollVehicle. It is the only reason a two-tonne
  // airframe is not handed twenty-six tonnes of poured fortress course, and
  // ROLL_ODDS.packagePool is recomputed from it by the mirror test.
  packageWeightCap: 0.3,
  // The share of a hull's stamped weight its class allots to plant and
  // running gear; anything over it is drive strain. It is PER CLASS and not
  // one figure, because the fractions are genuinely different animals: a land
  // fort is mostly belt, a scout is mostly engine and axle, and an airframe is
  // an engine with a seat on it — a flat fraction would have shown every
  // fighter in the catalogue as permanently over-engined.
  gearAllowanceByClass: {
    scout_crawler: 0.55, line_crawler: 0.4, heavy_crawler: 0.35, land_fort: 0.25,
    half_track: 0.5, armoured_car: 0.6, sp_gun: 0.4, tractor_gun: 0.45,
    gunboat: 0.45, fighter: 2.2, bomber: 0.8,
  },
  // Reliability lost per tonne of excess plant-plus-drive over the allowance.
  strainPerTonne: 0.03,
  // Reliability lost per unit of the plant's cooling burden.
  heatPenaltyPerUnit: 0.008,
  // breakdown = clamp(breakdownScale x (1 - reliability), 0, breakdownMax)
  breakdownScale: 0.5,
  breakdownMax: 0.5,

  // -- roll-up clamps (§12) --
  // speedClamp repeats speedFromPowerWeight's own clamp on purpose: the two
  // are asserted equal by the mirror test rather than kept equal by hope.
  speedClamp: [1, 8],
  moraleClamp: [1, 10],
  meleeClamp: [1, 8],

  // -- specials sources (§12) --
  // Six maps, every value a subset of MECHANIZED_SPECIALS. The union of all
  // six is asserted EQUAL to MECHANIZED_SPECIALS — no token without a source
  // and no source emitting a token the vocabulary does not carry.
  //
  // RUNNING GEAR IS byDrive's ALONE. The three tokens that name how a hull
  // puts its weight on the ground — `tracked`, `wheeled`, `walker` — are
  // emitted by the SUSPENSION and by nothing else, and the mirror test
  // asserts that no other source map names one. byClass used to carry them
  // too, and because the two are unioned that shipped contradictions: a land
  // fort on walker legs came back BOTH `tracked` and `walker`, and an
  // armoured car on a hover skirt came back `wheeled` with no wheel on it.
  // Roughly one rolled stand in nine. A class is a ROLE — what the machine is
  // for — and the drive is how it moves; conflating them made a stand's means
  // of locomotion a fact about neither.
  //
  // `naval`, `air` and `towed` stay class facts on purpose: they are the
  // theatre a hull fights in rather than its running gear, they agree with
  // every drive their class can roll, and none of the three can contradict
  // another (a gunboat on a plenum skirt is still a naval hull).
  specials: {
    byClass: {
      scout_crawler: ['recon'],
      line_crawler: ['direct_fire'],
      heavy_crawler: ['direct_fire', 'crush'],
      land_fort: ['direct_fire', 'crush', 'command'],
      half_track: ['direct_fire'],
      armoured_car: ['recon'],
      sp_gun: ['direct_fire'],
      tractor_gun: ['towed', 'indirect'],
      gunboat: ['naval', 'direct_fire'],
      fighter: ['air', 'direct_fire'],
      bomber: ['air', 'indirect'],
    },
    byDrive: {
      sus_line_tread: ['tracked'],
      sus_wide_girder_tread: ['tracked'],
      sus_half_track_bogie: ['tracked', 'wheeled'],
      sus_road_wheels: ['wheeled'],
      sus_walker_legs: ['walker'],
      sus_twin_screw: ['naval', 'amphibious'],
      sus_plenum_skirt: ['amphibious'],
      sus_flight_gear: ['air'],
      sus_split_trail: ['towed'],
    },
    byMount: {
      mnt_open_pintle_ring: ['open_top'],
      mnt_howitzer_cradle: ['open_top'],
    },
    byPackage: {
      ap_sealed_fume_hull: ['sealed'],
    },
    byQuirk: {
      vq_open_fighting_compartment: ['open_top'],
      vq_shallow_draught: ['amphibious'],
      vq_signals_fitted: ['command'],
    },
    byMod: {
      vm_smoke_dischargers: ['smoke'],
      vm_command_set: ['command'],
      vm_dozer_blade: ['crush'],
      vm_night_lamp_set: ['recon'],
    },
  },
};

// ---------------------------------------------------------------------------
// 13. Roll odds
//
// Everything rollVehicle draws on, as data. The roll ORDER is fixed and
// documented in docs/MOTOR_POOL.md §11; this table is only the weighting.
//
// Nothing here is derived from another table at module load — the pools are
// written out because the mirror test RECOMPUTES each of them from the
// catalogue and asserts equality, which is a stronger check than a spread
// would be and survives the pure-data-literal rule.
export const ROLL_ODDS = {
  // Quality is drawn from Lane I's QUALITY_GRADES rollWeights, re-weighted by
  // luck as w = rollWeight x (1 + luck x luckSlope), clamped at zero. At
  // luck 0 the distribution is EXACTLY the normalised rollWeights, which is
  //
  // THE ZERO CLAMP IS UNREACHABLE AT THESE SLOPES, and that is asserted
  // rather than assumed: luck is clamped to [-1, 1] and the largest slope
  // magnitude here is 0.9, so the smallest (1 + luck x slope) any grade can
  // reach is 0.1 and no weight can go negative. The mirror test enumerates
  // that minimum over all five grades at both luck extremes. The clamp stays
  // as the guard on a future slope past 1 — where it would become live and
  // would then need a test that drives it — and it is written down here as
  // unreachable so nobody reads it as a live behaviour. It is also why
  // pickWeighted's total is always positive and its terminal return is
  // likewise unreachable today.
  // what the 10,000-roll test asserts. The slopes are Lane I's LUCK_SLOPE
  // values, restated here rather than imported so that the odds table is one
  // readable object and the mirror test can lift it.
  luckSlope: { scrap: -0.6, issue: -0.2, proofed: 0.2, master: 0.5, relic: 0.9 },

  // Inclusive [min, max] refit-kit count by quality. A hull carries at most
  // one kit per slot, so these are further bounded by the slots it declares.
  modCount: { scrap: [0, 1], issue: [1, 2], proofed: [1, 3], master: [2, 4], relic: [2, 5] },

  // Inclusive [min, max] ROLLED quirks, on top of the pattern's innate ones.
  // A scrap hull always picks up at least one; a relic hull usually does not.
  quirkCount: { scrap: [1, 3], issue: [0, 2], proofed: [0, 2], master: [0, 1], relic: [0, 1] },

  // The quirks a rollVehicle draw may add. The sixteen INNATE quirks are
  // absent on purpose: they describe a particular hull, and a generic pool
  // would put Shallow Draught on a fighter.
  rollableQuirks: [
    'vq_governor_sealed', 'vq_re_bored_barrel', 'vq_frost_start', 'vq_no_night_gear',
    'vq_settled_bearings', 'vq_deck_gang', 'vq_bogs_the_soft_going', 'vq_low_silhouette',
  ],

  // Chance a hull is offered an armour package at all, by class. A scout is
  // bought for its pace and a land fort is a belt with a hull inside it.
  armourPackageChance: {
    scout_crawler: 0.4, line_crawler: 0.65, heavy_crawler: 0.75, land_fort: 0.85,
    half_track: 0.45, armoured_car: 0.4, sp_gun: 0.6, tractor_gun: 0.35,
    gunboat: 0.55, fighter: 0.3, bomber: 0.35,
  },

  // The packages a given hull may be offered, per chassis. RECOMPUTED by the
  // mirror test as { packages whose every declared facing raises or holds
  // that hull's } intersect { weight <= tonnage x MOTOR_MODEL.packageWeightCap },
  // and asserted EQUAL — so this is a cache of a derivation, not a judgement.
  // It has to be a cache: the raises-or-holds half needs armour VALUES, and
  // drift guard 12 puts those in arms.ts and nowhere else.
  packagePool: {
    outrider_129_whippet_mk2: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage', 'ap_overhead_grillage'],
    knife_136_ferret_mk3: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_overhead_grillage', 'ap_bolted_salvage'],
    hundredweight_141_line_crawler: ['ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage', 'ap_rolled_plate_suit', 'ap_cast_glacis', 'ap_sealed_fume_hull', 'ap_relic_alloy_skin'],
    verdict_144_levy_crawler: ['ap_seat_and_sump', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage', 'ap_rolled_plate_suit', 'ap_relic_alloy_skin'],
    tollgate_147_knotwork_crawler_mk2: ['ap_overhead_grillage', 'ap_spaced_screens', 'ap_rolled_plate_suit', 'ap_cast_glacis', 'ap_sealed_fume_hull', 'ap_relic_alloy_skin'],
    grimwold_138_breaker_mk3: ['ap_overhead_grillage', 'ap_spaced_screens', 'ap_cast_glacis', 'ap_face_hardened_belt', 'ap_relic_alloy_skin'],
    forgeworks_152_cinderhead: ['ap_overhead_grillage', 'ap_cast_glacis', 'ap_breakthrough_carapace', 'ap_relic_alloy_skin'],
    grimwold_156_lockjaw_mk1: ['ap_fortress_courses'],
    drover_134_provender_carrier: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage'],
    seamfire_143_burnwagon: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage', 'ap_rolled_plate_suit', 'ap_relic_alloy_skin'],
    dustpromise_131_courier_mk2: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage', 'ap_overhead_grillage'],
    copperline_139_beacon_car: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_overhead_grillage'],
    sledge_145_pit_gun: ['ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage', 'ap_rolled_plate_suit', 'ap_cast_glacis', 'ap_sealed_fume_hull', 'ap_relic_alloy_skin'],
    harrow_149_slaghound_mk2: ['ap_seat_and_sump', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_cast_glacis', 'ap_relic_alloy_skin'],
    crossloom_128_field_carriage: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage'],
    punt_137_shoalcutter: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage', 'ap_rolled_plate_suit', 'ap_cast_glacis', 'ap_sealed_fume_hull', 'ap_face_hardened_belt', 'ap_relic_alloy_skin'],
    reliquary_124_monitor_mk2: ['ap_overhead_grillage', 'ap_spaced_screens', 'ap_rolled_plate_suit', 'ap_cast_glacis', 'ap_sealed_fume_hull', 'ap_face_hardened_belt', 'ap_breakthrough_carapace', 'ap_relic_alloy_skin'],
    kestrel_150_lofter_mk2: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage'],
    adjudicated_142_writhawk: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage'],
    longshadow_154_span_mk1: ['ap_gun_shield', 'ap_seat_and_sump', 'ap_sandbag_stowage', 'ap_overhead_grillage', 'ap_spaced_screens', 'ap_bolted_salvage', 'ap_relic_alloy_skin'],
  },

  // The plants a class may be given. A fuelClass is a supply question and not
  // a fitting question, so the pool is written per class: an aero radial is
  // not offered to a crawler because no yard could hang it, not because the
  // column could not carry the fuel.
  plantPool: {
    scout_crawler: ['ow_courier_alcohol_75', 'hw_flatbed_diesel_60', 'rs_levy_diesel_95', 'kh_boneyard_pieced_diesel_120', 'cl_knotwork_diesel_140'],
    line_crawler: ['hw_flatbed_diesel_60', 'rs_levy_diesel_95', 'cl_knotwork_diesel_140', 'em_anvilgate_diesel_240', 'kh_boneyard_pieced_diesel_120'],
    heavy_crawler: ['cl_knotwork_diesel_140', 'em_anvilgate_diesel_240', 'em_forgeworks_diesel_460', 'tp_seamfire_flash_boiler_180'],
    land_fort: ['em_anvilgate_diesel_240', 'em_forgeworks_diesel_460', 'fs_reliquary_cell_800'],
    half_track: ['ow_courier_alcohol_75', 'hw_flatbed_diesel_60', 'rs_levy_diesel_95', 'cl_knotwork_diesel_140', 'kh_boneyard_pieced_diesel_120'],
    armoured_car: ['ow_courier_alcohol_75', 'hw_flatbed_diesel_60', 'rs_levy_diesel_95', 'cl_knotwork_diesel_140'],
    sp_gun: ['rs_levy_diesel_95', 'cl_knotwork_diesel_140', 'em_anvilgate_diesel_240', 'tp_seamfire_flash_boiler_180', 'kh_boneyard_pieced_diesel_120'],
    tractor_gun: ['hw_flatbed_diesel_60', 'ow_courier_alcohol_75', 'rs_levy_diesel_95'],
    gunboat: ['rw_shoal_marine_diesel_310', 'em_forgeworks_diesel_460', 'tp_seamfire_flash_boiler_180', 'fs_reliquary_cell_800'],
    fighter: ['ls_lofter_radial_620', 'as_beacon_turbine_540', 'fs_reliquary_cell_800'],
    bomber: ['ls_lofter_radial_620', 'as_beacon_turbine_540', 'em_forgeworks_diesel_460'],
  },

  // The power-to-weight a class is drawn around. Not a limit — a weighting.
  plantTarget: {
    scout_crawler: 13, line_crawler: 9, heavy_crawler: 7, land_fort: 4,
    half_track: 11, armoured_car: 16, sp_gun: 8, tractor_gun: 9,
    gunboat: 8, fighter: 230, bomber: 70,
  },

  // Step lookup on |ratio / target - 1|: the FIRST row whose maxDeviation is
  // at least the deviation, and plantBiasFloor past the last row. An unweighted
  // plant draw is what puts a 60 hp pit-head engine in a ninety-six-tonne land
  // fort as often as the right one, and a lemon should be rare rather than
  // equiprobable. There is no catch-all row on purpose: a sentinel would make
  // the floor unreachable, and the floor is what prices an 800 hp relic cell in
  // a twenty-two-tonne gunboat.
  plantBias: [
    { maxDeviation: 0.35, weight: 12 },
    { maxDeviation: 0.7, weight: 6 },
    { maxDeviation: 1.5, weight: 2 },
  ],
  plantBiasFloor: 1,

  // The drives a class may be given, and the mounts. Both are further filtered
  // at the roll: a mount is legal only when its `hardpoints` is at most the
  // number the hull declares.
  drivePool: {
    scout_crawler: ['sus_line_tread', 'sus_road_wheels', 'sus_half_track_bogie'],
    line_crawler: ['sus_line_tread', 'sus_wide_girder_tread'],
    heavy_crawler: ['sus_line_tread', 'sus_wide_girder_tread', 'sus_walker_legs'],
    land_fort: ['sus_wide_girder_tread', 'sus_walker_legs'],
    half_track: ['sus_half_track_bogie'],
    armoured_car: ['sus_road_wheels', 'sus_plenum_skirt'],
    sp_gun: ['sus_line_tread', 'sus_wide_girder_tread', 'sus_half_track_bogie'],
    tractor_gun: ['sus_split_trail'],
    gunboat: ['sus_twin_screw', 'sus_plenum_skirt'],
    fighter: ['sus_flight_gear'],
    bomber: ['sus_flight_gear'],
  },
  mountPool: {
    scout_crawler: ['mnt_open_pintle_ring', 'mnt_shielded_ring', 'mnt_enclosed_turret'],
    line_crawler: ['mnt_fixed_bow', 'mnt_shielded_ring', 'mnt_enclosed_turret', 'mnt_twin_cradle', 'mnt_sponson_pair'],
    heavy_crawler: ['mnt_casemate_box', 'mnt_enclosed_turret', 'mnt_twin_cradle', 'mnt_sponson_pair'],
    land_fort: ['mnt_casemate_box', 'mnt_enclosed_turret', 'mnt_sponson_pair', 'mnt_barbette_tier'],
    half_track: ['mnt_open_pintle_ring', 'mnt_shielded_ring', 'mnt_twin_cradle'],
    armoured_car: ['mnt_open_pintle_ring', 'mnt_shielded_ring', 'mnt_enclosed_turret'],
    sp_gun: ['mnt_fixed_bow', 'mnt_casemate_box', 'mnt_howitzer_cradle', 'mnt_enclosed_turret'],
    tractor_gun: ['mnt_howitzer_cradle'],
    gunboat: ['mnt_casemate_box', 'mnt_open_pintle_ring', 'mnt_enclosed_turret', 'mnt_sponson_pair', 'mnt_barbette_tier'],
    fighter: ['mnt_fixed_bow', 'mnt_wing_battery'],
    bomber: ['mnt_open_pintle_ring', 'mnt_shielded_ring', 'mnt_wing_battery', 'mnt_twin_cradle'],
  },

  // Tier gates for everything that is not a chassis. A chassis carries its own
  // `tier`; a plant, a package, a drive and a refit kit do not, because §4
  // fixes their shapes and none of the four has the field. Anything ABSENT
  // from these maps is tier 'I' — the boards' default for a fitting anyone can
  // make. The mirror test asserts every key exists in its table and every
  // value is a TIER_RANK key, so a renamed row cannot leave a gate pointing at
  // nothing.
  tierOf: {
    plants: {
      kh_boneyard_pieced_diesel_120: 'II:Cache',
      tp_seamfire_flash_boiler_180: 'II:Eng',
      em_forgeworks_diesel_460: 'II:Eng',
      as_beacon_turbine_540: 'II:Ciph',
      fs_reliquary_cell_800: 'III',
    },
    packages: {
      ap_sealed_fume_hull: 'II:Eng',
      ap_face_hardened_belt: 'II:Eng',
      ap_breakthrough_carapace: 'II:Eng',
      ap_relic_alloy_skin: 'III',
      ap_fortress_courses: 'III',
    },
    drives: {
      sus_walker_legs: 'II:Eng',
      sus_plenum_skirt: 'III',
    },
    mods: {
      vm_power_traverse: 'II:Eng',
      vm_stereo_rangefinder: 'II:Ciph',
      vm_night_lamp_set: 'II:Ciph',
      vm_command_set: 'II:Ciph',
      vm_direction_finder: 'II:Ciph',
      vm_relic_cell_governor: 'III',
    },
  },
};

// ---------------------------------------------------------------------------
// 14. Pure functions
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

// Step lookup over SPEED_CURVE on hp / tonnage, clamped to MOTOR_MODEL.speedClamp.
// Monotonic non-decreasing in hp and non-increasing in tonnage, because the
// curve ascends and the clamp is applied last.
//
// The clamp is DEFENSIVE and, at the shipped curve, unreachable: SPEED_CURVE's
// own speeds already span exactly [1, 8], so every probe is answered by the
// curve before the clamp is consulted. It reads MOTOR_MODEL.speedClamp rather
// than two literals so that the two cannot drift apart silently — the mirror
// test asserts the curve's endpoints ARE the clamp, and that this function's
// source names the constant, because a test that probes the endpoints is
// probing the curve and would pass over a clamp widened to [1, 99].
export const speedFromPowerWeight = (hp, tonnage) => {
  if (!(tonnage > 0)) throw new Error(`motorPool: tonnage must be > 0, got ${tonnage}`);
  const ratio = hp / tonnage;
  let speed = SPEED_CURVE[0].speed;
  for (const row of SPEED_CURVE) {
    if (ratio >= row.minRatio) speed = row.speed;
    else break;
  }
  return clampTo(speed, MOTOR_MODEL.speedClamp[0], MOTOR_MODEL.speedClamp[1]);
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

// ---------------------------------------------------------------------------
// 15. The seeded roll and the roll-up
//
// Everything below is PURE. No ambient randomness, no wall clock, no platform
// entropy source, no module-level mutable state — and, as above, the
// identifiers for the first three are kept out of the source text because the
// acceptance grep is what enforces the rule. Two calls with the same arguments return
// deep-equal results in any order, and interleaving two rolls cannot make
// either of them differ. The roll ORDER is the contract (docs/MOTOR_POOL.md
// §11) — changing it changes every machine the server has ever issued,
// retroactively, because a serial is reproduced from its seed and not stored.
// ---------------------------------------------------------------------------

// macroMulberry32 from base44/functions/gameEngine/entry.ts, copied rather
// than imported: a Deno function module cannot be imported from a shared
// module, and Lane I's arms.ts carries the same body for the same reason.
const motorMulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const clampTo = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);

// Rounded to MOTOR_MODEL.decimals so that a derived figure is comparable,
// printable and reproducible across engines. Stated because it is observable.
const roundTo = (n) => {
  const f = Math.pow(10, MOTOR_MODEL.decimals);
  return Math.round(n * f) / f;
};

// A cap admits every tier strictly below it plus its own exact tier, which is
// arms.ts's rule verbatim — 'II:Eng' opens engineering patterns and not cipher
// ones. Restating it here rather than importing keeps the two lanes' tier
// tables independent, which is the same reason TIER_RANK is declared locally.
const withinCap = (tier, cap) => tierRank(tier) < tierRank(cap) || tier === cap;

// Tier of a fitting. Anything absent from ROLL_ODDS.tierOf is tier 'I'.
const tierOfFitting = (kind, key) => ROLL_ODDS.tierOf[kind][key] || 'I';

// Step lookup: the LAST row whose `on` field is at most `value`.
const stepLookup = (curve, on, out, value) => {
  let found = curve[0][out];
  for (let i = 0; i < curve.length; i++) {
    if (value >= curve[i][on]) found = curve[i][out];
    else break;
  }
  return found;
};

const pickWeighted = (rnd, keys, weights) => {
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += weights[i];
  let ticket = rnd() * total;
  for (let i = 0; i < keys.length; i++) {
    ticket -= weights[i];
    if (ticket < 0) return keys[i];
  }
  return keys[keys.length - 1];
};

const chassisOf = (vehicle) => {
  const chassis = CHASSIS_PATTERNS[vehicle && vehicle.chassisKey];
  if (!chassis) throw new Error(`motorPool: unknown chassis "${vehicle && vehicle.chassisKey}"`);
  return chassis;
};

const plantOf = (vehicle) => {
  const plant = POWERPLANTS[vehicle.powerplant];
  if (!plant) throw new Error(`motorPool: unknown powerplant "${vehicle.powerplant}"`);
  return plant;
};

const driveOf = (vehicle) => {
  const drive = SUSPENSIONS[vehicle.suspension];
  if (!drive) throw new Error(`motorPool: unknown suspension "${vehicle.suspension}"`);
  return drive;
};

const mountOf = (vehicle) => {
  const mount = MOUNTS[vehicle.mount];
  if (!mount) throw new Error(`motorPool: unknown mount "${vehicle.mount}"`);
  return mount;
};

// null when the hull wears no package, which is a legal instance — the
// armourPackage field is optional in §4 and rollVehicle writes null for it.
const packageOf = (vehicle) => {
  if (!vehicle.armourPackage) return null;
  const pkg = ARMOUR_PACKAGES[vehicle.armourPackage];
  if (!pkg) throw new Error(`motorPool: unknown armour package "${vehicle.armourPackage}"`);
  return pkg;
};

const modOf = (key) => {
  const mod = VEHICLE_MODS[key];
  if (!mod) throw new Error(`motorPool: unknown vehicle mod "${key}"`);
  return mod;
};

// Every quirk the instance carries: the pattern's innate ones and any rolled
// on top, deduplicated. Conditions are NOT evaluated here — this is the
// declared set, which is what the specials derivation reads.
const quirkKeysOf = (vehicle) => {
  const chassis = chassisOf(vehicle);
  const out = [];
  const push = (k) => { if (VEHICLE_QUIRKS[k] && out.indexOf(k) === -1) out.push(k); };
  for (const k of chassis.quirks || []) push(k);
  for (const k of vehicle.quirks || []) push(k);
  return out;
};

// The crew actually in the hull: the pattern's own, plus any refit kit that
// adds or displaces a position. Quirks carry no `crew` key — asserted by the
// mirror test — which is what keeps this out of a cycle with the quirk
// context below.
const crewOf = (vehicle) => {
  let crew = chassisOf(vehicle).hull.crew;
  for (const k of vehicle.mods || []) {
    const mod = modOf(k);
    crew += (mod.mods.crew || 0) + (mod.tradeoff.crew || 0);
  }
  return crew;
};

// The evaluation context a quirk sees. Three of the twelve conditions —
// quality, crew and tonnage — are facts about the instance rather than about
// the turn, so they are filled in here and fire with no engine context at all.
// The caller's ctx supplies the other nine and cannot overwrite these three.
const quirkContext = (vehicle, ctx) => ({
  ...(ctx || {}),
  quality: vehicle.quality,
  crew: crewOf(vehicle),
  tonnage: totalTonnage(vehicle),
});

// ---------------------------------------------------------------------------

// The machine evaluation of a vehicle quirk's condition — the vehicle-side
// twin of arms.ts's evaluateQuirk, over VEHICLE_QUIRK_CONDITIONS. It exists
// because breakdownChance, hardpointStats and deriveMechanized all have to
// decide whether a quirk is live, and "a quirk whose effect exists only in
// prose is a lane failure" is only true if something evaluates it.
export const evaluateVehicleQuirk = (quirk, ctx) => {
  const c = quirk && quirk.condition;
  if (!c || typeof c.key !== 'string') return false;
  const x = ctx || {};
  if (c.key === 'always') return true;
  if (c.key === 'weather') return x.weather === c.value;
  if (c.key === 'terrain') return x.terrain === c.value;
  if (c.key === 'night') return x.night === true;
  if (c.key === 'vs_house') {
    if (c.value !== 'native_house') return x.vsHouse === c.value;
    return Array.isArray(x.nativeHouses) && typeof x.vsHouse === 'string' && x.nativeHouses.indexOf(x.vsHouse) !== -1;
  }
  if (c.key === 'quality_at_least') {
    const have = QUALITY_ORDER.indexOf(x.quality);
    const need = QUALITY_ORDER.indexOf(c.value);
    return have !== -1 && need !== -1 && have >= need;
  }
  if (c.key === 'round_at_least') return typeof x.round === 'number' && x.round >= c.value;
  if (c.key === 'below_full_pace') return x.atFullPace === false;
  if (c.key === 'stationary') return x.moved === 0;
  if (c.key === 'crew_at_least') return typeof x.crew === 'number' && x.crew >= c.value;
  if (c.key === 'tonnage_at_least') return typeof x.tonnage === 'number' && x.tonnage >= c.value;
  if (c.key === 'hull_down') return x.hullDown === true;
  return false;
};

// The quirk keys that are LIVE in this context.
const activeQuirkKeys = (vehicle, ctx) => {
  const full = quirkContext(vehicle, ctx);
  return quirkKeysOf(vehicle).filter((k) => evaluateVehicleQuirk(VEHICLE_QUIRKS[k], full));
};

// Every VEHICLE_STAT_KEYS delta the instance carries, summed: each fitted
// kit's `mods` AND its `tradeoff` — both are deltas and both are signed as
// the engine reads them — plus the `mods` of every quirk whose condition is
// live. This one aggregate is what deriveMechanized, hardpointStats and
// breakdownChance all read, so a stat is spent in exactly one place.
const statDeltas = (vehicle, ctx) => {
  const out = {};
  const add = (rec) => {
    if (!rec) return;
    for (const k of Object.keys(rec)) out[k] = (out[k] || 0) + rec[k];
  };
  for (const k of vehicle.mods || []) {
    const mod = modOf(k);
    add(mod.mods);
    add(mod.tradeoff);
  }
  for (const k of activeQuirkKeys(vehicle, ctx)) add(VEHICLE_QUIRKS[k].mods);
  return out;
};

// ---------------------------------------------------------------------------

// Hull tonnage + package weight + every fitted kit's tonnage delta.
//
// The kit term reads BOTH `mods` and `tradeoff`: the split is framing, not
// sign — both records are signed deltas the engine reads the same way, and a
// kit that SHEDS weight would declare a negative tonnage under `mods`. Every
// shipped kit that moves tonnage happens to declare it under `tradeoff`
// today; the mirror test walks all of VEHICLE_MODS and asserts the delta this
// function applies for each one, so neither half can be dropped unnoticed and
// the day a kit declares it on the other side is not the day the term breaks.
//
// The plant's and the drive's own `weight` are deliberately NOT added: a
// hull's stamped tonnage is its ALL-UP combat weight, running gear and the
// works' nominal plant included (see CHASSIS_PATTERNS above). Those two
// weights are spent in breakdownChance instead, as drive strain — a plant far
// heavier than the pattern was drawn around is a fault waiting, not a second
// weight ledger.
export const totalTonnage = (vehicle) => {
  const chassis = chassisOf(vehicle);
  let tonnage = chassis.hull.tonnage;
  const pkg = packageOf(vehicle);
  if (pkg) tonnage += pkg.weight;
  for (const k of vehicle.mods || []) {
    const mod = modOf(k);
    tonnage += (mod.mods.tonnage || 0) + (mod.tradeoff.tonnage || 0);
  }
  return roundTo(tonnage);
};

// Weapon-stat arithmetic ONLY. Each hardpoint instance is resolved by Lane I's
// resolveWeapon — pattern base, maker signature, quality, weapon mods, live
// weapon quirks, clamp — and this lane adds only the VEHICLE's own accuracy
// and rate-of-fire deltas on top, because a stabilised mounting and a range
// drum change what the gun on it does.
//
// `armorPen` is passed through UNTOUCHED and is never compared to anything but
// another hardpoint's: the maximum over the hull's own guns is the contracted
// field. What it is worth against a plate is arms.ts's question and only
// arms.ts's (drift guard 12).
export const hardpointStats = (vehicle, ctx) => {
  const deltas = statDeltas(vehicle, ctx);
  const list = vehicle.hardpoints || [];
  let ranged = 0;
  let range = 0;
  let armorPenMax = 0;
  for (const instance of list) {
    const w = resolveWeapon(instance, ctx);
    const accuracy = w.accuracy + (deltas.accuracy || 0);
    const rateOfFire = w.rateOfFire + (deltas.rateOfFire || 0);
    ranged += w.damage * (rateOfFire > 0 ? rateOfFire : 0) * (accuracy > 0 ? accuracy : 0);
    if (w.range > range) range = w.range;
    if (w.armorPen > armorPenMax) armorPenMax = w.armorPen;
  }
  ranged += deltas.ranged || 0;
  if (list.length > 0) range += deltas.range || 0;
  return {
    ranged: roundTo(ranged < 0 ? 0 : ranged),
    range: roundTo(range < 0 ? 0 : range),
    armorPenMax: roundTo(armorPenMax),
  };
};

// The hull's weapon instances, verbatim, so Lane C can hand each one to
// arms.ts itself rather than receiving a number this lane has flattened. A
// copy of the array, not of the instances: the rows are the caller's to read
// and this lane's to own.
export const hardpointWeapons = (vehicle) => (vehicle.hardpoints || []).slice();

// The probability that a turn does NOT pass without a mechanical fault, in
// [0, MOTOR_MODEL.breakdownMax].
//
// Composed, in order: the plant's and the drive's own reliabilities
// (multiplied — two independent things that both have to keep working), the
// armour package's reliability delta, every live quirk's and every fitted
// kit's reliability delta, the plant's cooling burden, and DRIVE STRAIN — the
// plant-plus-running-gear mass over the share of the stamped hull weight its
// class allots to them.
//
// STRICTLY NON-INCREASING as reliability rises: every term enters through a
// single sum and the result is breakdownScale x (1 - that sum).
export const breakdownChance = (vehicle, ctx) => {
  const chassis = chassisOf(vehicle);
  const plant = plantOf(vehicle);
  const drive = driveOf(vehicle);
  const pkg = packageOf(vehicle);
  const deltas = statDeltas(vehicle, ctx);

  let reliability = plant.reliability * drive.reliability;
  if (pkg) reliability += pkg.reliability;
  reliability += deltas.reliability || 0;

  const heat = plant.heat + (deltas.heat || 0);
  if (heat > 0) reliability -= MOTOR_MODEL.heatPenaltyPerUnit * heat;

  const allowed = chassis.hull.tonnage * MOTOR_MODEL.gearAllowanceByClass[chassis.class];
  const gear = plant.weight + drive.weight;
  if (gear > allowed) reliability -= MOTOR_MODEL.strainPerTonne * (gear - allowed);

  return roundTo(clampTo(MOTOR_MODEL.breakdownScale * (1 - reliability), 0, MOTOR_MODEL.breakdownMax));
};

// ---------------------------------------------------------------------------

// A pattern class has an eligible weapon at this cap, or it has not — and a
// hardpoint whose whole allowed list has none goes to the field EMPTY rather
// than making the chassis unrollable. That branch is real: at tierCap
// 'II:Wake' no crawler_gun pattern qualifies, so the Reliquary Monitor's
// casemate has nothing to put in it while the hull itself is perfectly legal.
const hasPatternAtCap = (weaponClass, cap) => {
  for (const k of Object.keys(WEAPON_PATTERNS)) {
    const p = WEAPON_PATTERNS[k];
    if (p.class === weaponClass && withinCap(p.tier, cap)) return true;
  }
  return false;
};

// Weight for a plant whose power-to-weight would deviate this far from what
// the class is drawn around: the FIRST row whose maxDeviation covers it, and
// ROLL_ODDS.plantBiasFloor for anything past the last row.
//
// The table deliberately has NO catch-all row. A sentinel at some absurd
// deviation would have made this final return unreachable — dead code with a
// plausible-sounding justification, which is the exact defect class this wave
// was told to avoid — and the floor is genuinely reached: a relic cell in a
// twenty-two-tonne gunboat deviates by 3.5.
const plantBiasWeight = (deviation) => {
  for (const row of ROLL_ODDS.plantBias) {
    if (deviation <= row.maxDeviation) return row.weight;
  }
  return ROLL_ODDS.plantBiasFloor;
};

// rollVehicle — pure, seeded, and drawn in ONE fixed order:
//   1. quality        weighted over QUALITY_GRADES rollWeights, luck-adjusted
//   2. chassis        uniform over the filtered pool, sorted by key ascending
//   3. powerplant     weighted by how near its power-to-weight is to the class target
//   4. suspension     uniform over the class's drive pool
//   5. mount          uniform over the class's mount pool, hardpoint-count legal
//   6. armour package one draw against the class chance, then uniform over the hull's pool
//   7. hardpoints     in hull order, one rollWeapon per position, each on its own sub-seed
//   8. mods           a count from the quality band, then picks, one kit per slot
//   9. quirks         the pattern's innate ones, then rolled from rollableQuirks
//  10. serial         off the same stream
//
// Sorting every pool by key is what makes the draw independent of object
// insertion order, so a row appended by a later step cannot silently renumber
// the whole history.
export const rollVehicle = ({ seed, class: vehicleClass, maker, tierCap = 'III', luck = 0 }) => {
  // mulberry32 coerces its argument with `a |= 0`, so an undefined seed would
  // silently BECOME seed 0 and every caller that failed to derive one would
  // get the same machine. Fail loudly instead.
  if (!Number.isFinite(seed)) throw new Error('rollVehicle: seed must be a finite number, got ' + String(seed));
  const cap = tierCap || 'III';
  tierRank(cap);
  const rnd = motorMulberry32(seed);
  const luckAmount = clampTo(Number.isFinite(luck) ? luck : 0, -1, 1);

  // 1. quality
  const weights = QUALITY_ORDER.map((g) => {
    const w = QUALITY_GRADES[g].rollWeight * (1 + luckAmount * ROLL_ODDS.luckSlope[g]);
    return w < 0 ? 0 : w;
  });
  const quality = pickWeighted(rnd, QUALITY_ORDER, weights);

  // 2. chassis
  const chassisPool = Object.keys(CHASSIS_PATTERNS).filter((k) => {
    const c = CHASSIS_PATTERNS[k];
    if (vehicleClass && c.class !== vehicleClass) return false;
    if (maker && c.maker !== maker) return false;
    return withinCap(c.tier, cap);
  }).sort();
  if (chassisPool.length === 0) {
    throw new Error('rollVehicle: no chassis matches { class: ' + (vehicleClass || 'any') + ', maker: ' + (maker || 'any') + ', tierCap: ' + cap + ' }');
  }
  const chassisKey = chassisPool[Math.floor(rnd() * chassisPool.length)];
  const chassis = CHASSIS_PATTERNS[chassisKey];

  // 3. powerplant
  const plantPool = (ROLL_ODDS.plantPool[chassis.class] || [])
    .filter((k) => withinCap(tierOfFitting('plants', k), cap)).slice().sort();
  if (plantPool.length === 0) {
    throw new Error('rollVehicle: no powerplant for class ' + chassis.class + ' at tierCap ' + cap);
  }
  const target = ROLL_ODDS.plantTarget[chassis.class];
  const plantWeights = plantPool.map((k) => plantBiasWeight(Math.abs((POWERPLANTS[k].hp / chassis.hull.tonnage) / target - 1)));
  const powerplant = pickWeighted(rnd, plantPool, plantWeights);

  // 4. suspension
  const drivePool = (ROLL_ODDS.drivePool[chassis.class] || [])
    .filter((k) => withinCap(tierOfFitting('drives', k), cap)).slice().sort();
  if (drivePool.length === 0) {
    throw new Error('rollVehicle: no suspension for class ' + chassis.class + ' at tierCap ' + cap);
  }
  const suspension = drivePool[Math.floor(rnd() * drivePool.length)];

  // 5. mount — never more hardpoints than the hull provides
  const mountPool = (ROLL_ODDS.mountPool[chassis.class] || [])
    .filter((k) => MOUNTS[k].hardpoints <= chassis.hull.hardpoints.length).slice().sort();
  if (mountPool.length === 0) {
    throw new Error('rollVehicle: no legal mount for chassis ' + chassisKey);
  }
  const mount = mountPool[Math.floor(rnd() * mountPool.length)];

  // 6. armour package — may be none
  const packagePool = (ROLL_ODDS.packagePool[chassisKey] || [])
    .filter((k) => withinCap(tierOfFitting('packages', k), cap)).slice().sort();
  let armourPackage = null;
  if (rnd() < ROLL_ODDS.armourPackageChance[chassis.class] && packagePool.length > 0) {
    armourPackage = packagePool[Math.floor(rnd() * packagePool.length)];
  }

  // 7. hardpoint weapons, in hull order
  const hardpoints = [];
  for (let i = 0; i < chassis.hull.hardpoints.length; i++) {
    const allowed = chassis.hull.hardpoints[i].allowed.filter((wc) => hasPatternAtCap(wc, cap));
    if (allowed.length === 0) continue;
    const weaponClass = allowed[Math.floor(rnd() * allowed.length)];
    const hpSeed = (seed ^ Math.imul(0x9e3779b9, i + 1)) | 0;
    hardpoints.push(rollWeapon({ seed: hpSeed, class: weaponClass, tierCap: cap, luck: luckAmount }));
  }

  // 8. refit kits — one per slot, only in slots the hull declares
  const eligible = Object.keys(VEHICLE_MODS).filter((k) => {
    const mod = VEHICLE_MODS[k];
    return chassis.slots.indexOf(mod.slot) !== -1
      && mod.appliesTo.indexOf(chassis.class) !== -1
      && withinCap(tierOfFitting('mods', k), cap);
  }).sort();
  const openSlots = [];
  for (const k of eligible) {
    const slot = VEHICLE_MODS[k].slot;
    if (openSlots.indexOf(slot) === -1) openSlots.push(slot);
  }
  const modBand = ROLL_ODDS.modCount[quality];
  let wantMods = modBand[0] + Math.floor(rnd() * (modBand[1] - modBand[0] + 1));
  if (wantMods > openSlots.length) wantMods = openSlots.length;
  const mods = [];
  const usedSlots = [];
  for (let i = 0; i < wantMods; i++) {
    const free = eligible.filter((k) => mods.indexOf(k) === -1 && usedSlots.indexOf(VEHICLE_MODS[k].slot) === -1);
    if (free.length === 0) break;
    const picked = free[Math.floor(rnd() * free.length)];
    mods.push(picked);
    usedSlots.push(VEHICLE_MODS[picked].slot);
  }

  // 9. quirks — innate first, then rolled
  const quirks = (chassis.quirks || []).slice();
  const quirkBand = ROLL_ODDS.quirkCount[quality];
  const wantQuirks = quirkBand[0] + Math.floor(rnd() * (quirkBand[1] - quirkBand[0] + 1));
  const quirkPool = ROLL_ODDS.rollableQuirks.slice().sort();
  for (let i = 0; i < wantQuirks; i++) {
    const free = quirkPool.filter((k) => quirks.indexOf(k) === -1);
    if (free.length === 0) break;
    quirks.push(free[Math.floor(rnd() * free.length)]);
  }

  // 10. serial — MW-<works stem>-<4 hex>, reproduced from the seed, not stored.
  //
  // The stem is the first four letters of the WORKS KEY, less any `mw_`
  // prefix — not of `nameStems[0]`. Two reasons, and the second is the one
  // that matters. (a) The stems are Lane I's data: a reorder there, which is
  // a free edit as far as that lane is concerned, would retroactively
  // renumber every serial this lane has ever issued, and §11 says the roll is
  // the contract precisely because a serial is reproduced from its seed and
  // never stored. (b) `ascendancy_signal_works` leads with the stem
  // "Testimony", so every Copperline car came off the line stamped
  // `MW-TEST-####` — a shipped record that reads as placeholder data.
  const stem = chassis.maker.replace(/^mw_/, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4);
  const hex = Math.floor(rnd() * 65536).toString(16).toUpperCase();
  const serial = 'MW-' + stem + '-' + ('0000' + hex).slice(-4);

  return {
    chassisKey: chassisKey,
    quality: quality,
    powerplant: powerplant,
    armourPackage: armourPackage,
    suspension: suspension,
    mount: mount,
    hardpoints: hardpoints,
    mods: mods,
    quirks: quirks,
    serial: serial,
  };
};

// ---------------------------------------------------------------------------

// The specials a stand carries. Six sources, all of them data in
// MOTOR_MODEL.specials, emitted in MECHANIZED_SPECIALS order so that two
// equivalent stands cannot differ by array order alone.
//
// Quirk-sourced tokens are read off the DECLARED quirks and not the live ones:
// a token is a capability of the machine, not a conditional effect on a turn.
// An open fighting compartment is open in fine weather too.
const specialsOf = (vehicle) => {
  const chassis = chassisOf(vehicle);
  const src = MOTOR_MODEL.specials;
  const found = [];
  const take = (list) => { for (const t of list || []) if (found.indexOf(t) === -1) found.push(t); };
  take(src.byClass[chassis.class]);
  take(src.byDrive[vehicle.suspension]);
  take(src.byMount[vehicle.mount]);
  if (vehicle.armourPackage) take(src.byPackage[vehicle.armourPackage]);
  for (const k of quirkKeysOf(vehicle)) take(src.byQuirk[k]);
  for (const k of vehicle.mods || []) take(src.byMod[k]);
  return MECHANIZED_SPECIALS.filter((t) => found.indexOf(t) !== -1);
};

// deriveMechanized(stand, ctx) — a VehicleInstance reduced to SquadType-shaped
// numbers PLUS `facings`, so Lanes A and C treat a crawler as a stand with
// four armour facings and never as a bag of parts.
//
// It returns EXACTLY { figures, melee, ranged, range, speed, morale, pts,
// specials, facings } and no other key. It does NOT return `armor`: a numeric
// armour rating would mean reading an armour class's value, which is drift
// guard 12's exact prohibition. The engine derives armour from `facings`
// through arms.ts. Breakdown chance and penetration are exposed through
// breakdownChance() and hardpointStats() rather than smuggled in here.
export const deriveMechanized = (stand, ctx) => {
  const vehicle = stand && stand.vehicle;
  if (!vehicle) throw new Error('deriveMechanized: stand.vehicle is required');
  const chassis = chassisOf(vehicle);
  const plant = plantOf(vehicle);
  const mount = mountOf(vehicle);
  const pkg = packageOf(vehicle);
  const deltas = statDeltas(vehicle, ctx);
  const tonnage = totalTonnage(vehicle);
  const guns = hardpointStats(vehicle, ctx);

  const melee = clampTo(
    stepLookup(MELEE_CURVE, 'minTonnage', 'melee', tonnage) + (deltas.melee || 0),
    MOTOR_MODEL.meleeClamp[0], MOTOR_MODEL.meleeClamp[1],
  );

  // Terrain is deliberately NOT applied: Lane C calls terrainMultiplier() per
  // hex, because a hull's pace is one number and the ground is sixteen.
  const speed = clampTo(
    speedFromPowerWeight(plant.hp + (deltas.hp || 0), tonnage) + (deltas.speed || 0),
    MOTOR_MODEL.speedClamp[0], MOTOR_MODEL.speedClamp[1],
  );

  // EVERY kit's morale delta, not only the crew_kit slot's. A spall liner is
  // an armour-slot fitting whose entire effect is morale, and ready racks are
  // a hardpoint fitting that costs it; honouring only crew_kit would leave
  // five shipped rows with a number nothing reads.
  const morale = clampTo(
    stepLookup(CREW_MORALE_CURVE, 'minCrew', 'morale', crewOf(vehicle))
      + CREW_EXPOSURE_MORALE[mount.crewArmour]
      + (deltas.morale || 0),
    MOTOR_MODEL.moraleClamp[0], MOTOR_MODEL.moraleClamp[1],
  );

  // Chassis + plant + package + kits + carried guns, the whole times the
  // hull's own grade. A gun's own grade is priced on the gun, inside the sum;
  // the hull's grade multiplies everything, because a master-grade machine is
  // a better machine whatever is bolted to it. docs/MOTOR_POOL.md §13.
  let pts = chassis.pts;
  const plantPts = plant.hp * MOTOR_MODEL.plantPtsPerHp;
  pts += plantPts < MOTOR_MODEL.plantPtsMin ? MOTOR_MODEL.plantPtsMin : plantPts;
  if (pkg) pts += pkg.cost;
  for (const k of vehicle.mods || []) pts += modOf(k).pts;
  for (const instance of vehicle.hardpoints || []) {
    const pattern = WEAPON_PATTERNS[instance.patternKey];
    if (!pattern) throw new Error(`motorPool: unknown weapon pattern "${instance.patternKey}"`);
    pts += pattern.pts * QUALITY_GRADES[instance.quality].ptsMult;
  }
  pts = roundTo(pts * QUALITY_GRADES[vehicle.quality].ptsMult);

  return {
    figures: 1,
    melee: melee,
    ranged: guns.ranged,
    range: guns.range,
    speed: speed,
    morale: morale,
    pts: pts,
    specials: specialsOf(vehicle),
    facings: { ...chassis.hull.baseArmour, ...(pkg ? pkg.facings : {}) },
  };
};
