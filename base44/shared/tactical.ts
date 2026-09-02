// ---------------------------------------------------------------------------
// Tactical battles — canonical rules & derivations.
// Imported by base44/functions/gameEngine (server authority). The client keeps
// a preview-only mirror at src/lib/tactical/data.js for the design phase.
//
// TWO LAYERS LIVE IN THIS FILE, and they are not the same model.
//
//   1. THE FORMATION LAYER (TROOPS, ACTIONS, SIZE, deriveFormation) — the
//      formation-mass model the live engine still runs. Untouched, still
//      exported, still imported by tacticalEngine.ts and five components.
//   2. THE SQUAD LAYER (SQUAD_TYPES and everything below it) — the set-piece
//      model of docs/TACTICAL_SQUAD_PLAN.md. A squad is N figures of one type
//      plus up to two specialists; figures are the HP pool and effectiveness
//      erodes with them.
//
// poolCost and toRegiments are the seam: they were re-based onto SQUADS by
// this lane, per plan section 3. The un-rewritten tacticalEngine.ts on main
// still passes FORMATIONS to them; that mismatch is expected and accepted
// (merge order A then C), and both functions return a zeroed regiment map
// rather than throwing when handed something that is not a squad list.
//
// ALL ARMOUR AND PENETRATION ARITHMETIC LIVES IN base44/shared/arms.ts AND
// NOWHERE ELSE (drift guard 12). This file imports the damage model from
// arms.ts; it declares armour class KEYS on its rows and never a value, never
// a multiplier, never a subtraction. resolveSquadHit is the only function here
// that touches a hit at all, and it is a short adapter over the import.
// ---------------------------------------------------------------------------

import { resolveHit, deriveLoadout, loadoutProfile, ARMOUR_CLASSES } from './arms.ts';

// speed: march pace (lowest in a formation sets the whole formation's pace)
// reach: how far it can put fire (highest in a formation sets engagement range)
export const TROOPS = {
  riflemen:  { key: 'riflemen',  label: 'Rifle Company',    speed: 3, attack: 1, defense: 2, reach: 1, from: 'riflemen' },
  gunners:   { key: 'gunners',   label: 'Machine-Gun Crew', speed: 2, attack: 2, defense: 2, reach: 2, from: 'riflemen' },
  scouts:    { key: 'scouts',    label: 'Scout Section',    speed: 5, attack: 1, defense: 1, reach: 1, from: 'riflemen' },
  crawler:   { key: 'crawler',   label: 'Diesel Crawler',   speed: 2, attack: 3, defense: 3, reach: 1, from: 'crawler' },
  artillery: { key: 'artillery', label: 'Siege Artillery',  speed: 1, attack: 4, defense: 1, reach: 4, from: 'artillery' },
  fighter:   { key: 'fighter',   label: 'Prop Fighter',     speed: 6, attack: 3, defense: 1, reach: 3, from: 'fighter' },
};
export const TROOP_KEYS = Object.keys(TROOPS);
export const CASUALTY_ORDER = ['scouts', 'riflemen', 'gunners', 'crawler', 'artillery', 'fighter'];
export const COLUMN_KEYS = ['riflemen', 'crawler', 'artillery', 'fighter'];

// requires: minimum company counts by troop type for the order to be issued
export const ACTIONS = {
  volley:            { key: 'volley',            label: 'Volley',            dmg: 1.0 },
  hold:              { key: 'hold',              label: 'Hold Ground',       dmg: 0,   guard: 1.45, self: true },
  suppressing_fire:  { key: 'suppressing_fire',  label: 'Suppressing Fire',  dmg: 0.8, suppress: 1, requires: { riflemen: 1, gunners: 1 } },
  creeping_barrage:  { key: 'creeping_barrage',  label: 'Creeping Barrage',  dmg: 1.55, noMove: true, requires: { artillery: 1, riflemen: 1 } },
  combined_assault:  { key: 'combined_assault',  label: 'Combined Assault',  dmg: 1.6, recoil: 0.18, reach: 1, requires: { crawler: 1, riflemen: 1 } },
  recon_in_force:    { key: 'recon_in_force',    label: 'Recon-in-Force',    dmg: 0.55, mark: 2, requires: { scouts: 1, crawler: 1 } },
  strafing_run:      { key: 'strafing_run',      label: 'Strafing Run',      dmg: 1.3, pierce: 0.4, requires: { fighter: 1 } },
  entrench:          { key: 'entrench',          label: 'Entrench',          dmg: 0,   guard: 1.9, self: true, requires: { riflemen: 3 } },
};

export const SIZE = { dmgPerCompany: 0.05, dmgCap: 1.55, defPerCompany: 0.04, defCap: 1.45, paceDrag: 5, commandLimit: 8 };

export const hexDistance = (a, b) => {
  const dq = a.q - b.q, dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};

export const formationSize = (troops = {}) => TROOP_KEYS.reduce((s, k) => s + (troops[k] || 0), 0);

export function deriveFormation(troops = {}) {
  const keys = TROOP_KEYS.filter((k) => (troops[k] || 0) > 0);
  const size = formationSize(troops);
  if (size === 0) return { size: 0, pace: 0, move: 0, reach: 0, attack: 0, defense: 0, dmgMult: 1, defMult: 1, initiative: 0, actions: [], strained: false };
  const basePace = Math.min(...keys.map((k) => TROOPS[k].speed));
  const drag = Math.floor(size / SIZE.paceDrag);
  const pace = Math.max(1, basePace - drag);
  const reach = Math.max(...keys.map((k) => TROOPS[k].reach));
  const attack = keys.reduce((s, k) => s + TROOPS[k].attack * troops[k], 0);
  const defense = keys.reduce((s, k) => s + TROOPS[k].defense * troops[k], 0);
  return {
    size, pace, move: Math.max(1, Math.round(pace * 0.8)), reach, attack, defense,
    dmgMult: Math.min(1 + (size - 1) * SIZE.dmgPerCompany, SIZE.dmgCap),
    defMult: Math.min(1 + (size - 1) * SIZE.defPerCompany, SIZE.defCap),
    initiative: pace * 10 + (troops.scouts || 0) * 3 - drag,
    actions: Object.values(ACTIONS)
      .filter((a) => !a.requires || Object.entries(a.requires).every(([k, n]) => (troops[k] || 0) >= n))
      .map((a) => a.key),
    strained: size > SIZE.commandLimit,
  };
}

// ===========================================================================
// THE SQUAD LAYER (Lane A)
// ===========================================================================
//
// READING THE STAT BLOCK — every number below is on a declared scale, and two
// of the field names look alike on purpose because the contract in section 4
// of the plan names both:
//
//   figures     the squad at full strength. Figures are the HP pool.
//   melee       the WHOLE squad at full strength in contact. Not per figure.
//   ranged      the WHOLE squad at full strength putting fire out. Not per
//               figure. Calibrated against the Arms Catalogue: a figure with
//               an issue-grade line rifle is worth about 1.3 of this, so ten
//               of them are worth about 13.
//   range       hexes. Also calibrated against arms.ts, at issue grade and by
//               weapon CLASS min to max (line rifle 5.2-11, belt gun 8-11,
//               mortar 8-13, field piece 16-23). The rifle band is the wide
//               one: the class runs from a stubby field pattern to a long
//               rifle, and a squad row sits inside its class, not at its top.
//   armor       the numeric resilience the melee/ranged contest pairs
//               against. Scale: 0 an unarmoured scout, 2 a rifle section in
//               greatcoats, 12 a riveted crawler hull. It is the lineage of
//               the old TROOPS.defense and IT IS NOT ARMOUR CLASS.
//   armour      the ArmourClassKey penetration resolves against, and the ONLY
//               armour concept this file is allowed to carry (drift guard
//               12). A key, never a value. Vehicles declare the class of the
//               hull as a whole; Lane J supplies per-facing classes and
//               struckFacing picks which one a hit lands on.
//   morale      roll-under target on MORALE_MODS.dice dice of
//               MORALE_MODS.dieSides. 11 is a steady line section.
//   speed       hexes per turn.
//   pts         THE COST OF THE SQUAD, NOT OF A FIGURE. riflemen is 100 for
//               ten figures. Every other row is priced against it by
//               combatValue below, and the audit is code, not prose.
//   specials    the SQUAD_ACTIONS keys this type unlocks. Never decorative:
//               a test asserts this list equals the set of gated actions the
//               type satisfies, in both directions.
//   from        the REGIMENT the figures are drawn from and fold back into.
//               One of COLUMN_KEYS. Six of the nine are riflemen-derived.
//
// APPENDING (Lane F): one row per line-block, flat literal, new rows at the
// END. No spreads, no computed keys, no calls, no comments INSIDE the
// literal — the mirror test lifts these tables textually and evaluates them,
// and its brace scanner reads an apostrophe inside a comment as the start of
// a string. Keep prose above the table, not in it.
// ---------------------------------------------------------------------------

export const SQUAD_TYPES = {
  riflemen:  { key: 'riflemen',  label: 'Rifle Section',    short: 'Rifles',   from: 'riflemen',  tier: 'I', figures: 10, minFigures: 4, maxFigures: 12, melee: 5,  ranged: 14, range: 7,  armor: 2,  speed: 3, morale: 11, pts: 100, specials: ['grenade'], armour: 'soft', damageType: 'kinetic', armorPen: 2.5, blurb: "Ten men, ten rifles, and the Ministry assumption that ground is taken by walking onto it.", doctrineNote: "The unit every other line is priced against. If a figure in the ledger looks generous, set it beside a rifle section and it will stop looking generous." },
  assault:   { key: 'assault',   label: 'Assault Section',  short: 'Assault',  from: 'riflemen',  tier: 'I', figures: 8,  minFigures: 3, maxFigures: 10, melee: 12, ranged: 10, range: 3,  armor: 3,  speed: 4, morale: 12, pts: 90,  specials: ['grenade'], armour: 'light', damageType: 'kinetic', armorPen: 1.5, blurb: "Short guns, spades and a bag of bombs. They are issued the last forty yards and nothing else.", doctrineNote: "Fast into contact and expensive out of it. Bring them up behind a work or a screen; ground crossed in the open is paid for in figures." },
  gunners:   { key: 'gunners',   label: 'Machine-Gun Crew', short: 'Gunners',  from: 'riflemen',  tier: 'I', figures: 6,  minFigures: 2, maxFigures: 8,  melee: 2,  ranged: 18, range: 9,  armor: 2,  speed: 2, morale: 11, pts: 85,  specials: ['suppress'], armour: 'soft', damageType: 'kinetic', armorPen: 3, blurb: "A belt gun on a tripod, six men to feed it, and a sight line they will not give up while it still fires.", doctrineNote: "Site it once and let it hold the lane. The crew moves at a walk and is worth nothing at all caught in the open." },
  scouts:    { key: 'scouts',    label: 'Scout Section',    short: 'Scouts',   from: 'riflemen',  tier: 'I', figures: 5,  minFigures: 2, maxFigures: 6,  melee: 2,  ranged: 6,  range: 5,  armor: 1,  speed: 6, morale: 10, pts: 45,  specials: ['smoke'], armour: 'none', damageType: 'kinetic', armorPen: 2, blurb: "Runners, glass and a map case. They see first, and it is the only advantage they are issued.", doctrineNote: "Screen the flank, take the crest, and never let them be the section that has to hold anything." },
  mortars:   { key: 'mortars',   label: 'Mortar Team',      short: 'Mortars',  from: 'riflemen',  tier: 'I', figures: 4,  minFigures: 2, maxFigures: 6,  melee: 1,  ranged: 12, range: 9,  armor: 1,  speed: 2, morale: 10, pts: 55,  specials: ['smoke', 'mortar_barrage'], armour: 'none', damageType: 'fragmentation', armorPen: 2, blurb: "A tube on a base plate and a case of bombs. It never sees what it kills, and it does not need to.", doctrineNote: "Indirect: it needs no sight line, only an observer and a hex. Keep it a lane behind the line and it will out-work anything of its price." },
  pioneers:  { key: 'pioneers',  label: 'Pioneer Section',  short: 'Pioneers', from: 'riflemen',  tier: 'I', figures: 8,  minFigures: 3, maxFigures: 10, melee: 8,  ranged: 9,  range: 5,  armor: 3,  speed: 3, morale: 11, pts: 100, specials: ['grenade', 'build_foxhole', 'build_trench', 'build_bunker', 'build_emplacement'], armour: 'light', damageType: 'explosive', armorPen: 2.2, blurb: "Spades, wire, charges, and standing orders to make ground into works before the shooting reaches it.", doctrineNote: "The only line section that can raise all four works. Send them forward early or do not send them at all." },
  crawler:   { key: 'crawler',   label: 'Diesel Crawler',   short: 'Crawler',  from: 'crawler',   tier: 'I', figures: 1,  minFigures: 1, maxFigures: 1,  melee: 6,  ranged: 12, range: 10, armor: 12, speed: 4, morale: 12, pts: 100, specials: ['overrun'], armour: 'medium', damageType: 'kinetic', armorPen: 9.5, blurb: "Riveted plate on tracks, hot enough inside to cook on, and proof against every rifle on the field.", doctrineNote: "One figure: one loss removes it. Nothing short of a shaped charge or a gun will mark it, so never leave it where a shaped charge can walk up to it." },
  artillery: { key: 'artillery', label: 'Siege Piece',      short: 'Guns',     from: 'artillery', tier: 'I', figures: 1,  minFigures: 1, maxFigures: 1,  melee: 1,  ranged: 16, range: 18, armor: 3,  speed: 1, morale: 9,  pts: 100, specials: ['bombard'], armour: 'light', damageType: 'explosive', armorPen: 7, blurb: "A gun the column drags, a crew that reads the ground on paper, and a reach no other section on the field can answer.", doctrineNote: "It covers the whole board and cannot defend a hex of it. Screen it, or lose it to the first section that walks the flank." },
  fighter:   { key: 'fighter',   label: 'Prop Fighter',     short: 'Fighter',  from: 'fighter',   tier: 'I', figures: 1,  minFigures: 1, maxFigures: 1,  melee: 2,  ranged: 13, range: 8,  armor: 4,  speed: 8, morale: 11, pts: 70,  specials: ['strafe'], armour: 'light', damageType: 'kinetic', armorPen: 6, blurb: "One machine, one pass, and a pilot who will be somewhere else before the dust has settled.", doctrineNote: "Grounded outright by a thunderstorm. Spend it on crews, guns and columns in the open; against a heavy hull it is a nuisance and no more." },
  stormtroops:      { key: 'stormtroops',      label: 'Stormtroops',      short: 'Storm',       from: 'riflemen',  tier: 'I', figures: 8,  minFigures: 3, maxFigures: 10, melee: 11, ranged: 12, range: 4,  armor: 4,  speed: 4, morale: 12, pts: 105, specials: ['grenade'], armour: 'light', damageType: 'kinetic', armorPen: 2.8, blurb: "Picked out of the line regiments and issued the automatic, the bomb bag and the first forty yards of any assault the Ministry means to win.", doctrineNote: "Guard-flagged wherever they muster, and priced for it: eight men who cost more than ten. Spend them on the position that decides the day, never on the one that merely needs holding." },
  sappers:          { key: 'sappers',          label: 'Sappers',          short: 'Sappers',     from: 'riflemen',  tier: 'I', figures: 8,  minFigures: 3, maxFigures: 10, melee: 9,  ranged: 8,  range: 5,  armor: 3,  speed: 4, morale: 11, pts: 106, specials: ['grenade', 'build_foxhole', 'build_trench', 'build_emplacement'], armour: 'light', damageType: 'shaped', armorPen: 5.5, blurb: "Breaching men. They carry the shaped charge that opens a hull or a wall, and the wire and revetment to close the hole again behind them.", doctrineNote: "The section that goes through a thing rather than around it. They raise three of the four works and not the bunker — pouring and roofing is a pioneer's trade and a pioneer's second turn." },
  ski_troops:       { key: 'ski_troops',       label: 'Ski Troops',       short: 'Skis',        from: 'riflemen',  tier: 'I', figures: 10, minFigures: 4, maxFigures: 12, melee: 4,  ranged: 12, range: 5,  armor: 1,  speed: 6, morale: 11, pts: 85,  specials: ['smoke'], armour: 'soft', damageType: 'kinetic', armorPen: 2.4, blurb: "Northern companies on the long boards, carbines slung and packs cut to the bone, raised where the ground is white a third of the year.", doctrineNote: "Bought for the speed column and for nothing else — they shoot like a light section and they stand like one. Arrive where the enemy is not, and be gone before he answers." },
  digger_corps:     { key: 'digger_corps',     label: 'Digger Corps',     short: 'Diggers',     from: 'riflemen',  tier: 'I', figures: 10, minFigures: 4, maxFigures: 12, melee: 5,  ranged: 7,  range: 4,  armor: 2,  speed: 2, morale: 10, pts: 82,  specials: ['build_foxhole', 'build_trench'], armour: 'soft', damageType: 'kinetic', armorPen: 2.2, blurb: "Excavation companies off the dig faces, short rifles issued as an afterthought and the spade issued as the point of them.", doctrineNote: "They open ground and cut works, and they lose a straight exchange to anything holding a proper rifle. Put them behind a line and never in one." },
  pilgrim_levy:     { key: 'pilgrim_levy',     label: 'Pilgrim Levy',     short: 'Levy',        from: 'riflemen',  tier: 'I', creedLock: 'recall', figures: 14, minFigures: 6, maxFigures: 18, melee: 6,  ranged: 11, range: 6,  armor: 1,  speed: 3, morale: 9,  pts: 89,  specials: [], armour: 'none', damageType: 'kinetic', armorPen: 2.2, blurb: "Fourteen of the devout walking under a borrowed banner with whatever the parish armoury still had racked when the call went round.", doctrineNote: "The cheapest figures in the ledger and the first to go. Mass is the entire argument: they are raised by the body and spent by the body, and they are never asked to hold a hex alone." },
  provost:          { key: 'provost',          label: 'Provost Section',  short: 'Provost',     from: 'riflemen',  tier: 'I', figures: 6,  minFigures: 2, maxFigures: 8,  melee: 6,  ranged: 7,  range: 4,  armor: 2,  speed: 3, morale: 12, pts: 58,  specials: [], armour: 'soft', damageType: 'kinetic', armorPen: 2, blurb: "The discipline detachment — revolvers, a writ book, and the whole standing of the Ministry behind both of them.", doctrineNote: "Six men who will not run, and very little else. Post them where a line is likely to break; price them as the morale they hold rather than the fire they put out." },
  marksmen:         { key: 'marksmen',         label: 'Marksmen',         short: 'Marksmen',    from: 'riflemen',  tier: 'I', figures: 5,  minFigures: 2, maxFigures: 6,  melee: 2,  ranged: 7,  range: 11, armor: 1,  speed: 4, morale: 11, pts: 51,  specials: [], armour: 'none', damageType: 'kinetic', armorPen: 3.4, blurb: "Selected shots with the long rifle and the ranging optic, working in pairs and reporting to nobody nearer than the battalion.", doctrineNote: "The longest reach the line regiments are issued. Five figures erode quickly, so keep them out of any hex a section can walk into and let the reach do the work." },
  flame_team:       { key: 'flame_team',       label: 'Flame Team',       short: 'Flame',       from: 'riflemen',  tier: 'II:Eng', figures: 6,  minFigures: 2, maxFigures: 8,  melee: 4,  ranged: 12, range: 3,  armor: 2,  speed: 3, morale: 10, pts: 59,  specials: [], armour: 'soft', damageType: 'incendiary', armorPen: 1.2, blurb: "The trench projector and the men who carry its tanks, issued to any section whose next order is a bunker doorway.", doctrineNote: "It reaches barely past its own hex, and the fume goes where fire cannot. Against a garrison that will not come out it is the shortest argument in the catalogue; in the open it is six men with tanks on their backs." },
  autocar_scouts:   { key: 'autocar_scouts',   label: 'Autocar Scouts',   short: 'Autocar',     from: 'crawler',   tier: 'I', figures: 1,  minFigures: 1, maxFigures: 1,  melee: 2,  ranged: 8,  range: 8,  armor: 5,  speed: 7, morale: 11, pts: 41,  specials: ['smoke'], armour: 'light', damageType: 'kinetic', armorPen: 3.5, blurb: "A wheeled scout car with a turret gun and a skin thin enough that its crew navigate by where the shooting is not.", doctrineNote: "One stand, and one loss ends it. Bought for the pace column and the sight line, never for weight — a line crawler will finish it in a single exchange." },
  siege_mortar:     { key: 'siege_mortar',     label: 'Siege Mortar',     short: 'Siege',       from: 'artillery', tier: 'I', figures: 1,  minFigures: 1, maxFigures: 1,  melee: 1,  ranged: 13, range: 14, armor: 2,  speed: 1, morale: 9,  pts: 52,  specials: ['mortar_barrage'], armour: 'light', damageType: 'fragmentation', armorPen: 3.7, blurb: "A heavy tube on a bedded plate, dug in behind the crest and firing on a map reference nobody at the tube has ever seen.", doctrineNote: "Indirect: it wants an observer and a hex, not a sight line, and it does not displace in the turn it fires. Cheaper reach than the siege piece, and shorter — the ranging is what you are not paying for." },
  land_dreadnought: { key: 'land_dreadnought', label: 'Land Dreadnought', short: 'Dreadnought', from: 'crawler',   tier: 'III', figures: 1,  minFigures: 1, maxFigures: 1,  melee: 10, ranged: 17, range: 12, armor: 14, speed: 2, morale: 12, pts: 156, specials: ['overrun'], armour: 'superheavy', damageType: 'kinetic', armorPen: 12, blurb: "The Land-Dreadnought: a second keel, lesser and meaner — an imperial engine walled in plate until it takes what a fortress takes, and put onto the field as one stand.", doctrineNote: "The heaviest plate and the heaviest gun in the roster, at a walking pace and a single figure. It is a relic Object and it dies with the keel that raised it, so everything it is worth is lost the turn something opens it." },
};

export const SQUAD_TYPE_KEYS = Object.keys(SQUAD_TYPES);

// The five staff attachments, at most SCALING.maxSpecialists to a squad.
// EVERY effect here is a number in `mods` — a blurb describing something no
// number implements is a lane failure, so the vocabulary is fixed:
//
//   morale          added to the squad morale target
//   initiative      added to the squad initiative
//   moraleFloor     the target can never derive below this (MAX when stacked)
//   recoverPerTurn  figures returned per turn while unengaged (Lane C)
//   aoeSuppress     hexes added to the suppress radius (Lane C)
//   buildSpeed      turns taken OFF a build order, never below one (Lane C)
//   executionToll   figures lost INSTEAD of routing on a failed test (Lane C)
//
// deriveSquad consumes `morale` and `moraleFloor` and `initiative`, because
// those three land inside its ten-key return. The other four are read from
// this table by the engine at resolution time — squadStaffMods() stacks all
// seven in one pass so no lane re-implements the stacking rule.
export const SPECIALISTS = {
  medic:        { key: 'medic',        label: 'Field Medic',        pts: 12, mods: { morale: 1, recoverPerTurn: 1 }, blurb: "A satchel, a whistle, and the standing to use both. He does not stop casualties; he stops them being permanent." },
  signaler:     { key: 'signaler',     label: 'Signaler',           pts: 10, mods: { initiative: 3 }, blurb: "Wire, a field set, and the column timetable held in his head. Orders arrive early, or they arrive as news." },
  commissar:    { key: 'commissar',    label: 'Ministry Commissar', pts: 14, mods: { morale: 1, moraleFloor: 11, executionToll: 1 }, blurb: "Sent out with a ledger and the authority to close it. The section does not run while he is standing in it." },
  heavy_gunner: { key: 'heavy_gunner', label: 'Heavy Gunner',       pts: 16, mods: { aoeSuppress: 1 }, blurb: "An automatic rifle carried at the expense of everything else in his pack. It kills little and makes a hex unusable." },
  sapper:       { key: 'sapper',       label: 'Sapper',             pts: 12, mods: { buildSpeed: 1 }, blurb: "Trained on wire, revetment and charge. Any section he is attached to can dig, and digs a turn faster." },
  chaplain:         { key: 'chaplain',         label: 'Chaplain',           pts: 13, mods: { morale: 1, moraleFloor: 10 }, blurb: "A field chaplain with no pistol and no writ, only the standing the devout already grant him. The section holds because it wants to, which holds a little lower and costs nobody." },
  cartographer:     { key: 'cartographer',     label: 'Field Cartographer', pts: 13, mods: { initiative: 2, morale: 1 }, blurb: "Plane table, chain and a corrected sheet. A section that knows where it is standing moves sooner than one that is working it out." },
  forward_observer: { key: 'forward_observer', label: 'Forward Observer',   pts: 18, mods: { aoeSuppress: 1, initiative: 1 }, blurb: "Glass, a map reference and a wire back to the tubes. He fires nothing himself and widens everything that fires for him." },
  provost_sergeant: { key: 'provost_sergeant', label: 'Provost Sergeant',   pts: 15, mods: { moraleFloor: 12, executionToll: 2 }, blurb: "Sent down from the discipline detachment with a list and the authority to work through it. The section does not rout while he is in it; it is reduced instead." },
  relic_bearer:     { key: 'relic_bearer',     label: 'Relic Bearer',       pts: 20, mods: { morale: 2, recoverPerTurn: 1 }, blurb: "He carries the Object, and the men carry him. Nothing in the ledger steadies a section further, and nothing in the ledger is a worse thing to lose in the open." },
};

// The order verbs. Sixteen rows: the nine the plan names, the four builds
// (one per deployable), and three vehicle signatures the base nine would
// otherwise have gone without.
//
// THE GATE IS A UNION, and it is written this way so Lane F can append squad
// rows without ever editing this table. An action is offered to a squad when
//   (a) its `requires` is null, OR
//   (b) `requires.types` names the squad type, OR
//   (c) the TYPE names the action in its own `specials`, OR
//   (d) `requires.specialists` names a specialist the squad is carrying.
// (b) and (c) are the same statement written from both ends for the base
// nine, and a test asserts they agree. A new type from Lane F declares only
// `specials` and is gated correctly by (c).
//
// FIELD MEANINGS
//   uses         which derived stat the damage is drawn from. null = the
//                order does no damage at all.
//   dmg          MULTIPLIER on that stat, in the lineage of the old ACTIONS
//                table. Never an absolute.
//   guard        MULTIPLIER on the squad defence for the round. 1 = neutral,
//                below 1 = exposed by the act of doing it.
//   range        OVERRIDE in hexes; null means use the squad range.
//   aoe          { radius, falloff } handed to Lane I resolveAoe, or null.
//   moraleHit    modifier applied to the TARGET morale test this order forces.
//   suppress     suppression weight applied to the target.
//   screenTurns  turns of LOS-blocking screen the order leaves on the hex.
//   noMove       the squad cannot displace in the same turn.
//   turns        turns the order occupies. A build equals its buildTurns.
//   builds       the DEPLOYABLES key a build order raises, or null.
//   damageType   OVERRIDE of the squad damage type; null = use the squad one.
//   indirect     no line of sight required. Lane C skips the LOS check.
export const SQUAD_ACTIONS = {
  fire:              { key: 'fire',              label: 'Fire',              requires: null, uses: 'ranged', dmg: 1,    guard: 1,    range: null, aoe: null, moraleHit: 1, suppress: 0.25, screenTurns: 0, noMove: false, turns: 1, builds: null, damageType: null, indirect: false, blurb: "Aimed fire at a squad in sight and in range." },
  assault:           { key: 'assault',           label: 'Assault',           requires: null, uses: 'melee',  dmg: 1.2,  guard: 0.9,  range: 1,    aoe: null, moraleHit: 3, suppress: 0,    screenTurns: 0, noMove: false, turns: 1, builds: null, damageType: 'kinetic', indirect: false, blurb: "Close to contact and settle it with bayonet, spade and revolver." },
  hold:              { key: 'hold',              label: 'Hold Ground',       requires: null, uses: null,     dmg: 0,    guard: 1.45, range: null, aoe: null, moraleHit: 0, suppress: 0,    screenTurns: 0, noMove: true,  turns: 1, builds: null, damageType: null, indirect: false, blurb: "Stand fast, fire nothing, and be harder to move for it." },
  rally:             { key: 'rally',             label: 'Rally',             requires: null, uses: null,     dmg: 0,    guard: 1.1,  range: null, aoe: null, moraleHit: 0, suppress: 0,    screenTurns: 0, noMove: true,  turns: 1, builds: null, damageType: null, indirect: false, blurb: "Take the section in hand and test again to shake off suppression." },
  entrench:          { key: 'entrench',          label: 'Entrench',          requires: null, uses: null,     dmg: 0,    guard: 1.9,  range: null, aoe: null, moraleHit: 0, suppress: 0,    screenTurns: 0, noMove: true,  turns: 1, builds: null, damageType: null, indirect: false, blurb: "Go to ground where you stand. No work is raised and nothing is left behind." },
  grenade:           { key: 'grenade',           label: 'Grenade',           requires: { types: ['riflemen', 'assault', 'pioneers'], specialists: [] }, uses: 'ranged', dmg: 0.9,  guard: 1,    range: 2,    aoe: { radius: 1, falloff: 0.4 },  moraleHit: 2, suppress: 0.5,  screenTurns: 0, noMove: false, turns: 1, builds: null, damageType: 'fragmentation', indirect: false, blurb: "Bombs thrown into a hex at arm reach. Cheap, short, and it clears a room." },
  suppress:          { key: 'suppress',          label: 'Suppressing Fire',  requires: { types: ['gunners'], specialists: ['heavy_gunner'] }, uses: 'ranged', dmg: 0.5,  guard: 1,    range: null, aoe: null, moraleHit: 4, suppress: 1.5,  screenTurns: 0, noMove: true,  turns: 1, builds: null, damageType: null, indirect: false, blurb: "Fire to pin rather than to kill. The hex becomes unusable while the belt lasts." },
  smoke:             { key: 'smoke',             label: 'Smoke Screen',      requires: { types: ['scouts', 'mortars'], specialists: [] }, uses: null,     dmg: 0,    guard: 1,    range: 4,    aoe: { radius: 1, falloff: 0 },    moraleHit: 0, suppress: 0.25, screenTurns: 2, noMove: false, turns: 1, builds: null, damageType: null, indirect: false, blurb: "Pots into the ground upwind. Sight dies in the hex for two turns, for both sides." },
  mortar_barrage:    { key: 'mortar_barrage',    label: 'Mortar Barrage',    requires: { types: ['mortars'], specialists: [] }, uses: 'ranged', dmg: 1.35, guard: 1,    range: null, aoe: { radius: 1, falloff: 0.35 }, moraleHit: 3, suppress: 0.75, screenTurns: 0, noMove: true,  turns: 1, builds: null, damageType: 'fragmentation', indirect: true, blurb: "Bombs onto a hex the crew cannot see. No sight line is required and none is offered." },
  bombard:           { key: 'bombard',           label: 'Bombard',           requires: { types: ['artillery'], specialists: [] }, uses: 'ranged', dmg: 1.5,  guard: 1,    range: null, aoe: { radius: 2, falloff: 0.3 },  moraleHit: 4, suppress: 1,    screenTurns: 0, noMove: true,  turns: 1, builds: null, damageType: 'explosive', indirect: true, blurb: "The battery fires on a map reference. Two hexes of ground stop being ground." },
  strafe:            { key: 'strafe',            label: 'Strafing Run',      requires: { types: ['fighter'], specialists: [] }, uses: 'ranged', dmg: 1.25, guard: 0.85, range: null, aoe: { radius: 1, falloff: 0.5 },  moraleHit: 3, suppress: 0.5,  screenTurns: 0, noMove: false, turns: 1, builds: null, damageType: null, indirect: false, blurb: "One pass along the line, guns open, and every head down for a hundred yards." },
  overrun:           { key: 'overrun',           label: 'Overrun',           requires: { types: ['crawler'], specialists: [] }, uses: 'melee',  dmg: 1.6,  guard: 1,    range: 1,    aoe: null, moraleHit: 5, suppress: 1,    screenTurns: 0, noMove: false, turns: 1, builds: null, damageType: 'kinetic', indirect: false, blurb: "Drive onto the position and turn on it. Works are not proof against tracks." },
  build_foxhole:     { key: 'build_foxhole',     label: 'Dig Foxholes',      requires: { types: ['pioneers'], specialists: ['sapper'] }, uses: null, dmg: 0, guard: 1, range: null, aoe: null, moraleHit: 0, suppress: 0, screenTurns: 0, noMove: true, turns: 1, builds: 'foxhole', damageType: null, indirect: false, blurb: "Scrapes deep enough for a prone man and his rifle. One turn, one hex." },
  build_trench:      { key: 'build_trench',      label: 'Cut Trench',        requires: { types: ['pioneers'], specialists: ['sapper'] }, uses: null, dmg: 0, guard: 1, range: null, aoe: null, moraleHit: 0, suppress: 0, screenTurns: 0, noMove: true, turns: 1, builds: 'trench', damageType: null, indirect: false, blurb: "A cut line with the spoil banked forward. It stops sight as well as fire." },
  build_bunker:      { key: 'build_bunker',      label: 'Raise Bunker',      requires: { types: ['pioneers'], specialists: ['sapper'] }, uses: null, dmg: 0, guard: 1, range: null, aoe: null, moraleHit: 0, suppress: 0, screenTurns: 0, noMove: true, turns: 2, builds: 'bunker', damageType: null, indirect: false, blurb: "Poured and roofed, and it takes two turns nobody ever has. Worth every one of them." },
  build_emplacement: { key: 'build_emplacement', label: 'Cut Emplacement',   requires: { types: ['pioneers'], specialists: ['sapper'] }, uses: null, dmg: 0, guard: 1, range: null, aoe: null, moraleHit: 0, suppress: 0, screenTurns: 0, noMove: true, turns: 1, builds: 'emplacement', damageType: null, indirect: false, blurb: "A pit, a platform and a traverse. The gun in it stops being able to leave." },
};

export const SQUAD_ACTION_KEYS = Object.keys(SQUAD_ACTIONS);

// The four works. Lane B stamps `trench` and `bunker` onto defender ground at
// generation time and NEVER folds their value into the tile, so every number
// here is applied by Lane C at resolution time and applied exactly once.
//
//   cover        ADDED to the terrain cover of the hex. Lane B terrain tops
//                out at 3; only a bunker goes past it.
//   moveCost     ADDED to the terrain cost of entering the hex.
//   blocksLOS    the work stops a sight line at ground level.
//   buildTurns   turns of work. A sapper takes SPECIALISTS.sapper.mods
//                .buildSpeed off this, never below one.
//   infantryOnly no vehicle may occupy or raise it.
//   armourClass  the ArmourClassKey a stand in the work resolves hits
//                against INSTEAD of its own, and only when its own class is
//                in WORK_ARMOUR_APPLIES_TO. A key, never a value: this file
//                does not compare armour, it hands a key to arms.ts.
//   mods.speed   ABSOLUTE SET, not a delta. null leaves the squad speed
//                alone; 0 pins it where it stands.
//   mods.range   delta on the squad range.
//   mods.suppress delta on the suppression the squad puts out.
export const DEPLOYABLES = {
  foxhole:     { key: 'foxhole',     label: 'Foxholes',    cover: 1, blocksLOS: false, moveCost: 0, buildTurns: 1, infantryOnly: true,  armourClass: 'light',     mods: { speed: null, range: 0, suppress: 0 },   blurb: "A scrape apiece. It will not stop a shell and it has stopped a great many bullets." },
  trench:      { key: 'trench',      label: 'Trench Line', cover: 2, blocksLOS: true,  moveCost: 1, buildTurns: 1, infantryOnly: true,  armourClass: 'light',     mods: { speed: null, range: 0, suppress: 0 },   blurb: "Cut, revetted and banked. Sight stops at the parapet and so does the advance." },
  bunker:      { key: 'bunker',      label: 'Bunker',      cover: 4, blocksLOS: true,  moveCost: 1, buildTurns: 2, infantryOnly: false, armourClass: 'fortified', mods: { speed: null, range: 0, suppress: 0.5 }, blurb: "Poured works with a roof on. Thicker than any hull, and full of men who must go on breathing." },
  emplacement: { key: 'emplacement', label: 'Emplacement', cover: 2, blocksLOS: false, moveCost: 0, buildTurns: 1, infantryOnly: false, armourClass: 'light',     mods: { speed: 0, range: 1, suppress: 0.5 },    blurb: "A pit and a traverse cut for one gun. It reaches a hex further and it is not going anywhere." },
};

export const DEPLOYABLE_KEYS = Object.keys(DEPLOYABLES);

// A work is an infantry position. It re-classes a stand that has nothing
// better; it never re-classes a hull. Membership, not arithmetic.
export const WORK_ARMOUR_APPLIES_TO = ['none', 'soft', 'light'];

// WHICH REGIMENTS ARE MEN ON FOOT. `infantryOnly` on a work is a rule, not a
// label, and this is the table that gives it teeth: squadActions refuses a
// build order whose work is infantryOnly to any type drawn from a regiment
// that is not in this list, so a crawler with a sapper aboard is offered the
// bunker and the emplacement and is never offered a foxhole to lie in.
// OCCUPYING a work is the other half of the same rule and belongs to Lane C
// (see 13.12); RAISING one is decided here, because the order list is.
export const INFANTRY_REGIMENTS = ['riflemen'];

// Figures to companies, KEYED BY REGIMENT and never by squad type (plan
// section 4, orchestrator ruling Q5). A squad type default size is its own
// business: mortars muster four, gunners six, and both fold back through the
// RIFLEMEN company of ten because both are drawn from the rifle regiment.
export const FIGURES_PER_COMPANY = { riflemen: 10, crawler: 1, artillery: 1, fighter: 1 };

// The morale test, as data. Lane C rolls it; Lane C authors none of these
// numbers (drift guard 7).
//
// The test is roll-under on `dice` dice of `dieSides`, against the squad
// derived morale plus the situational modifiers below. SIGN CONVENTION: a
// modifier is ADDED to the target, so a negative number makes the test
// harder. Fail by `routMargin` or more and the squad routs instead of being
// suppressed; a commissar converts that rout into SPECIALISTS.commissar
// .mods.executionToll figures and the squad stands.
export const MORALE_MODS = {
  dice: 3,
  dieSides: 6,
  autoPassRoll: 4,
  autoFailRoll: 17,
  routMargin: 4,
  suppressedTurns: 1,
  perCasualtyThisTurn: -1,
  flanked: -2,
  adjacentFriendlyDestroyed: -1,
  alreadySuppressed: -2,
  underFireFromUnseen: -1,
  inCover: 1,
  inWork: 1,
  entrenched: 2,
  rallying: 2,
  commandAdjacent: 1,
};

// Every figure-scaling and derivation constant, in one exported table, so no
// downstream lane retypes one (drift guard 7). Nothing in deriveSquad is a
// bare number that is not here.
//
//   offenceExponent    a squad at ratio r of full strength fights at r^0.9.
//                      Half a section is 53.6% of a section, not 50%: the
//                      survivors still have their rifles and their frontage.
//   moralePerStrength  morale delta = round((ratio - 1) * this), clamped.
//   initiative         speed * initiativePerSpeed + initiativeBase + staff.
export const SCALING = {
  offenceExponent: 0.9,
  moralePerStrength: 4,
  moraleDeltaFloor: -3,
  moraleDeltaCap: 1,
  moraleMin: 3,
  moraleMax: 15,
  speedFloor: 1,
  initiativeBase: 4,
  initiativePerSpeed: 2,
  maxSpecialists: 2,
};

// THE POINTS MODEL, AND WHY IT IS CODE.
//
// A points audit written by hand rots. So the audit is combatValue() and
// fairPts() below, docs/COMBAT_DESIGN.md prints what they return, and the
// mirror test reads that table back out of the markdown and recomputes every
// cell — a stale number in the document is a failing test.
//
// combatValue is the sum of six terms, all from fields this file owns:
//   anti-personnel   ranged * (1 + range / rangeDivisor)
//   anti-armour      ranged * max(0, armorPen - penFloor) * penWeight
//   contact          melee * meleeWeight
//   the pool         figures * (armor * armorWeight + morale * moraleWeight)
//   mobility         speed * speedWeight
//   verbs            specials.length * specialWeight
//
// The anti-armour term exists for the same reason Lane I split AA_RATE from
// AP_RATE: without it a crawler is priced only on the infantry it kills and
// its armour-killing gun costs nothing, which prices a breakthrough vehicle
// at half a rifle section. penFloor is the penetration below which a weapon
// is no threat to a hull at all.
//
// There is deliberately NO stored calibration constant. The value one point
// buys is DERIVED from the anchor row every time (see fairPts), so it cannot
// go stale when a stat is re-tuned.
export const POINTS_MODEL = {
  rangeDivisor: 8,
  penFloor: 3,
  penWeight: 0.5,
  meleeWeight: 0.6,
  armorWeight: 1.1,
  moraleWeight: 0.35,
  speedWeight: 1.2,
  specialWeight: 3,
  anchorKey: 'riflemen',
  anchorPts: 100,
  efficiencyCap: 1.6,
  specialistPtsCap: 20,
};

// The six axial directions, in the SAME ORDER as Lane B neighbors() in
// tacticalField.ts. A stand `facing` is an index into this list, so the two
// lanes cannot disagree about which way a hull is pointed.
export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

// Which facing a bearing lands on, as an offset from the stand facing.
// Front is the three-hex arc ahead, rear is the single hex behind, and the
// two remaining offsets are the flanks.
export const FACING_ARCS = { front: [5, 0, 1], side: [2, 4], rear: [3] };

// SQUAD UPGRADE KITS (Lane F). Wargear fitted to a stand, never unlocked onto
// a faction: a kit's numbers live on the squad that carries it and nowhere
// else, which is the operator ruling that module effects apply on FIT.
//
//   appliesTo  the SQUAD_TYPES keys the kit may be fitted to. Non-empty, and
//              every string is a live type key.
//   tier       the fragment class that gates it, from the same six strings a
//              SquadType tier is drawn from.
//   mods       DELTAS on the SquadType value columns, and only these seven:
//              figures, melee, ranged, range, armor, speed, morale.
//   pts        added to the squad cost when the kit is fitted.
//
// NO KIT IS FREE. Every row either carries a negative delta or sits behind a
// tier above I, and most carry both — a kit that is strictly better than not
// fitting it is a kit every squad fits, which is a column and not a choice.
export const UPGRADES = {
  armor_skirts:     { key: 'armor_skirts',     label: 'Armor Skirts',      appliesTo: ['crawler', 'autocar_scouts', 'land_dreadnought'], pts: 20, tier: 'I', mods: { armor: 3, speed: -1 }, blurb: "Bolted plate hung off the running gear against a shaped charge walking up to the track. The hull gains a course of armour and loses the last of its pace." },
  storm_hoods:      { key: 'storm_hoods',      label: 'Storm Hoods',       appliesTo: ['stormtroops', 'assault', 'sappers', 'pioneers', 'flame_team'], pts: 14, tier: 'II:Cache', mods: { morale: 1 }, blurb: "Cache-pattern hoods and eyepieces drawn against fume and burning oil. Men who can see through the smoke they are standing in are markedly harder to move out of it." },
  wire_spades:      { key: 'wire_spades',      label: 'Wire & Spades',     appliesTo: ['riflemen', 'pioneers', 'sappers', 'digger_corps', 'ski_troops', 'pilgrim_levy', 'provost'], pts: 12, tier: 'I', mods: { armor: 1, speed: -1 }, blurb: "Every man issued a coil, a picket and a spade, and every man carrying them. The section goes to ground wherever it stops and marches slower to every place it stops at." },
  sapper_plate:     { key: 'sapper_plate',     label: 'Sapper Plate',      appliesTo: ['sappers', 'pioneers', 'stormtroops', 'assault'], pts: 20, tier: 'I', mods: { armor: 2, speed: -1 }, blurb: "A breastplate and a throat piece off the siege stores, worn by men whose work is a doorway. Proof against the fragment that would otherwise end the breach." },
  ski_conversions:  { key: 'ski_conversions',  label: 'Ski Conversions',   appliesTo: ['ski_troops', 'autocar_scouts', 'crawler'], pts: 16, tier: 'I', mods: { speed: 2, ranged: -2 }, blurb: "Boards for the men and forward skis for the running gear. Winter ground stops being an argument, and nothing aims well while it is being crossed at that rate." },
  mine_flails:      { key: 'mine_flails',      label: 'Mine Flails',       appliesTo: ['crawler', 'autocar_scouts', 'land_dreadnought'], pts: 14, tier: 'I', mods: { melee: 2, speed: -1 }, blurb: "A drum of chains slung forward on outriggers, beating the ground the tracks are about to stand on. It is also the least survivable thing to be standing in front of." },
  marksman_pattern: { key: 'marksman_pattern', label: 'Marksman Pattern',  appliesTo: ['marksmen', 'scouts', 'riflemen', 'provost'], pts: 18, tier: 'II:Eng', mods: { range: 2, ranged: -1 }, blurb: "Selected barrels, a ranging optic and ammunition off a single lot. Every shot reaches further and there are fewer of them, because a man who is aiming is not firing." },
  drum_magazines:   { key: 'drum_magazines',   label: 'Drum Magazines',    appliesTo: ['assault', 'stormtroops', 'gunners', 'provost'], pts: 18, tier: 'I', mods: { ranged: 3, range: -1 }, blurb: "Drums in place of sticks, and a great deal more going out per minute. It is short work, badly aimed, and it wins rooms." },
  gas_shells:       { key: 'gas_shells',       label: 'Gas Shells',        appliesTo: ['mortars', 'siege_mortar', 'artillery'], pts: 22, tier: 'II:Ciph', mods: { ranged: 2, range: -1 }, blurb: "Fume rounds drawn on a ciphered warrant and signed for twice. Heavier than a fragmentation bomb and therefore shorter, and they clear a work that fragments only chip." },
  radio_pack:       { key: 'radio_pack',       label: 'Radio Pack',        appliesTo: ['riflemen', 'stormtroops', 'marksmen', 'provost', 'autocar_scouts', 'siege_mortar'], pts: 16, tier: 'II:Ciph', mods: { morale: 1, speed: -1 }, blurb: "A field set, its batteries and the two men who carry both. Orders arrive as orders instead of as rumour, and the section walks at the pace of the heaviest thing in it." },
};

export const UPGRADE_KEYS = Object.keys(UPGRADES);

// How many kits one stand may carry. Declared here and read everywhere else:
// the ceiling is referenced by name in the rules draft and in the Bureau, and
// retyped in neither (drift guard 7).
export const UPGRADE_RULES = { maxPerSquad: 2 };

// ---------------------------------------------------------------------------
// DERIVATIONS. Pure: no die roll, no clock, no I/O, and no mutation of an
// argument. Same input, identical output, always.
// ---------------------------------------------------------------------------

const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;
const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);

// The ten-key zero row, freshly built each call so no caller can mutate a
// shared object. Same key order as a real derivation: the two are read side
// by side in Lane D stat grid.
const zeroSquad = () => ({
  figures: 0, melee: 0, ranged: 0, range: 0, armor: 0,
  speed: 0, morale: 0, initiative: 0, actions: [], pts: 0,
});

/**
 * The figure count a squad ACTUALLY musters: a whole number, never negative,
 * never above the type ceiling. Every derivation and both pool functions go
 * through this, so a caller cannot over-stack a squad by asking nicely.
 */
export function squadFigures(squad) {
  const t = squad && SQUAD_TYPES[squad.type];
  if (!t) return 0;
  const n = Math.floor(Number(squad.figures));
  if (!isFinite(n) || n <= 0) return 0;
  return Math.min(n, t.maxFigures);
}

/**
 * Lane I deriveLoadout, called defensively. A squad with no loadout returns
 * {} and every consumer below falls back to the type declared values. A
 * squad carrying an instance the catalogue does not recognise must not take
 * the battle down with it, so a throw is caught and read as "no kit".
 */
function loadoutOf(squad) {
  if (!squad || !squad.loadout) return {};
  try {
    return deriveLoadout(squad, squad.ctx || {}) || {};
  } catch {
    return {};
  }
}

/**
 * The same defensive call, for the OTHER half of Lane I's squad reduction:
 * loadoutProfile turns the primary weapon into the armorPen and damageType
 * resolveHit needs. deriveLoadout deliberately cannot return those — its keys
 * are a strict subset of the SquadType value columns — so a squad whose kit
 * reached its damage but not its penetration was the state this returns to
 * close. Null, never a zeroed profile: an inert profile would read as
 * "penetrates nothing" and silently disarm a squad with an unreadable
 * loadout, where null falls back to the type's declared values.
 */
function profileOf(squad) {
  if (!squad || !squad.loadout || !squad.loadout.primary) return null;
  try {
    return loadoutProfile(squad, squad.ctx || {}) || null;
  } catch {
    return null;
  }
}

/**
 * Stack up to SCALING.maxSpecialists staff attachments and return every mod
 * in the section 4 vocabulary, summed, plus their combined pts.
 *
 * THE STACKING RULE, and it is fixed so two callers cannot disagree:
 *  - duplicates count ONCE;
 *  - the survivors are chosen in SPECIALISTS DECLARATION order, never in the
 *    caller array order, so the result is invariant under permutation of the
 *    input and a third attachment is silently IGNORED rather than rejected;
 *  - morale, initiative, recoverPerTurn, aoeSuppress, buildSpeed and
 *    executionToll are ADDITIVE;
 *  - moraleFloor takes the MAXIMUM, because a floor is a floor.
 */
export function squadStaffMods(specialists) {
  const wanted = Array.isArray(specialists) ? specialists : [];
  const keys = [];
  for (const k of Object.keys(SPECIALISTS)) {
    if (keys.length >= SCALING.maxSpecialists) break;
    if (wanted.indexOf(k) !== -1) keys.push(k);
  }
  const out = {
    keys, pts: 0, morale: 0, initiative: 0, moraleFloor: 0,
    recoverPerTurn: 0, aoeSuppress: 0, buildSpeed: 0, executionToll: 0,
  };
  for (const k of keys) {
    const s = SPECIALISTS[k];
    const m = s.mods;
    out.pts += s.pts;
    out.morale += m.morale || 0;
    out.initiative += m.initiative || 0;
    out.recoverPerTurn += m.recoverPerTurn || 0;
    out.aoeSuppress += m.aoeSuppress || 0;
    out.buildSpeed += m.buildSpeed || 0;
    out.executionToll += m.executionToll || 0;
    if ((m.moraleFloor || 0) > out.moraleFloor) out.moraleFloor = m.moraleFloor;
  }
  return out;
}

/**
 * The order keys a squad of this type, carrying these specialists, may be
 * given. TYPE AND STAFF ONLY — suppressed, routed, entrenched and
 * already-building are Lane C state gates and are deliberately not applied
 * here. Returned in SQUAD_ACTIONS declaration order.
 *
 * THE STAFF ARGUMENT IS PUT THROUGH squadStaffMods FIRST, and that is not a
 * tidy-up: this function and deriveSquad are two published entry points to
 * the same question, and before the cap was applied here a squad handed three
 * attachments got a DIFFERENT order list depending on which one the caller
 * reached for. Both now run the same selection, and a test asserts they agree
 * for every type and every staff array up to length three.
 *
 * A work marked `infantryOnly` may not be RAISED by a squad drawn from a
 * regiment outside INFANTRY_REGIMENTS. That flag is mirrored, printed in
 * 13.5 and gate-checked; before this line it was read by nothing, and a
 * sapper aboard a crawler was offered a foxhole to dig.
 */
export function squadActions(typeKey, specialists) {
  const t = SQUAD_TYPES[typeKey];
  const staff = squadStaffMods(specialists).keys;
  const foot = !!t && INFANTRY_REGIMENTS.indexOf(t.from) !== -1;
  const out = [];
  for (const k of Object.keys(SQUAD_ACTIONS)) {
    const a = SQUAD_ACTIONS[k];
    if (!a.requires) { out.push(k); continue; }
    if (!t) continue;
    if (a.builds && DEPLOYABLES[a.builds].infantryOnly && !foot) continue;
    const byType = !!(a.requires.types && a.requires.types.indexOf(typeKey) !== -1);
    const bySpecial = t.specials.indexOf(k) !== -1;
    const byStaff = !!(a.requires.specialists && a.requires.specialists.some((s) => staff.indexOf(s) !== -1));
    if (byType || bySpecial || byStaff) out.push(k);
  }
  return out;
}

/**
 * deriveSquad(squad) -> the ten keys, in this order, every time.
 *
 * squad = { type, figures, specialists?: [], loadout?: Loadout, ctx?: object }
 *
 * FIGURE SCALING. ratio = figures / the type default. Offence is multiplied
 * by ratio ** SCALING.offenceExponent, so erosion bites sub-linearly: half a
 * section still holds its frontage and still has its rifles. range, armor and
 * speed do not scale — a two-man mortar team shoots as far as a four-man one,
 * it simply shoots less. Morale scales, downward, by moralePerStrength.
 *
 * THE ARMS JOIN. deriveLoadout is PER FIGURE (arms.ts section 12) while the
 * melee and ranged columns of SQUAD_TYPES are WHOLE-SQUAD values at full
 * strength. So a loadout melee/ranged is multiplied by the type DEFAULT
 * figure count to reach the same scale, and only then eroded; `range` is
 * what one figure carries and is taken as is; `speed` is a delta; `pts` is a
 * per-figure delta and is multiplied by the ACTUAL figures present.
 *
 * Degenerate input never throws: an unknown type, a missing squad, zero or
 * negative figures all return the zero row.
 */
export function deriveSquad(squad) {
  const t = squad && SQUAD_TYPES[squad.type];
  if (!t) return zeroSquad();
  const figures = squadFigures(squad);
  if (figures <= 0) return zeroSquad();

  const staff = squadStaffMods(squad.specialists);
  const kit = loadoutOf(squad);
  const ratio = figures / t.figures;
  const cohesion = Math.pow(ratio, SCALING.offenceExponent);

  const baseMelee = kit.melee === undefined ? t.melee : kit.melee * t.figures;
  const baseRanged = kit.ranged === undefined ? t.ranged : kit.ranged * t.figures;
  const range = kit.range === undefined ? t.range : kit.range;
  const speed = Math.max(SCALING.speedFloor, t.speed + (kit.speed || 0));

  const strain = clamp(
    Math.round((ratio - 1) * SCALING.moralePerStrength),
    SCALING.moraleDeltaFloor,
    SCALING.moraleDeltaCap,
  );
  let morale = clamp(t.morale + staff.morale + strain, SCALING.moraleMin, SCALING.moraleMax);
  if (staff.moraleFloor > morale) morale = Math.min(staff.moraleFloor, SCALING.moraleMax);

  return {
    figures,
    melee: round2(baseMelee * cohesion),
    ranged: round2(baseRanged * cohesion),
    range,
    armor: t.armor,
    speed,
    morale,
    initiative: speed * SCALING.initiativePerSpeed + SCALING.initiativeBase + staff.initiative,
    actions: squadActions(t.key, staff.keys),
    pts: Math.round(t.pts * ratio) + staff.pts + Math.round((kit.pts || 0) * figures),
  };
}

// ---- the points audit, as code --------------------------------------------

/** The six-term value of a type at full strength. See POINTS_MODEL. */
export function combatValue(typeKey) {
  const t = SQUAD_TYPES[typeKey];
  if (!t) return 0;
  const P = POINTS_MODEL;
  return round4(
    t.ranged * (1 + t.range / P.rangeDivisor)
    + t.ranged * Math.max(0, t.armorPen - P.penFloor) * P.penWeight
    + t.melee * P.meleeWeight
    + t.figures * (t.armor * P.armorWeight + t.morale * P.moraleWeight)
    + t.speed * P.speedWeight
    + t.specials.length * P.specialWeight,
  );
}

/**
 * What the type OUGHT to cost, in the anchor currency. The exchange rate is
 * derived from the anchor row on every call and stored nowhere, so re-tuning
 * a riflemen stat re-prices the whole catalogue instead of quietly
 * invalidating a constant.
 */
export function fairPts(typeKey) {
  const anchor = combatValue(POINTS_MODEL.anchorKey);
  if (!anchor) return 0;
  return round2((combatValue(typeKey) / anchor) * POINTS_MODEL.anchorPts);
}

/** fair / asked. 1 is exactly priced; POINTS_MODEL.efficiencyCap is the gate. */
export function typeEfficiency(typeKey) {
  const t = SQUAD_TYPES[typeKey];
  if (!t || !t.pts) return 0;
  return round4(fairPts(typeKey) / t.pts);
}

// ---- pools ----------------------------------------------------------------

const zeroRegiments = () => {
  const out = {};
  for (const k of COLUMN_KEYS) out[k] = 0;
  return out;
};

/**
 * poolCost(squads) -> FIGURES drawn per regiment, matching the section 4
 * myPool comment. ALL FOUR regiment keys are always present, zero by
 * default: a caller that has to write (cost[k] || 0) is a caller that will
 * one day forget to.
 *
 * Squads whose type is unknown contribute nothing, and a non-array argument
 * (the formation-shaped call the un-rewritten engine still makes) returns
 * the zero map rather than throwing. That is degenerate-input handling, not
 * a second code path: no formation is ever costed.
 */
export function poolCost(squads = []) {
  const out = zeroRegiments();
  if (!Array.isArray(squads)) return out;
  for (const s of squads) {
    const t = s && SQUAD_TYPES[s.type];
    if (!t) continue;
    out[t.from] += squadFigures(s);
  }
  return out;
}

/**
 * toRegiments(squads) -> COMPANIES, rounding DOWN, all four keys present.
 * Survivors fold back through the REGIMENT company size, never the squad
 * type default size. Nine surviving riflemen figures are nine men who walked
 * off the field, and none of them is a company.
 */
export function toRegiments(squads = []) {
  const figures = poolCost(squads);
  const out = zeroRegiments();
  for (const k of COLUMN_KEYS) out[k] = Math.floor(figures[k] / FIGURES_PER_COMPANY[k]);
  return out;
}

// ---- hex geometry for facing ----------------------------------------------

const SQRT3 = Math.sqrt(3);

/**
 * Which of the six HEX_DIRECTIONS the vector at -> from points along, by
 * pointy-top pixel bearing. -1 when the two hexes are the same hex.
 */
const bearingIndex = (from, at) => {
  const dq = from.q - at.q;
  const dr = from.r - at.r;
  if (dq === 0 && dr === 0) return -1;
  const x = SQRT3 * (dq + dr / 2);
  const y = 1.5 * dr;
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return ((Math.round(-deg / 60) % 6) + 6) % 6;
};

/**
 * struckFacing({ from, at, facing, overhead }) -> 'front' | 'side' | 'rear' | 'top'
 *
 * Pure axial geometry and nothing else: it picks WHICH Facings key a hit
 * lands on and never asks what armour is behind it. `facing` is an index
 * into HEX_DIRECTIONS (the Lane B neighbour order). `overhead` is passed by
 * Lane C for an air attack or an indirect shell, which arrive on the top
 * plate whatever the hull is pointed at; an attacker in the target own hex
 * is read the same way.
 */
export function struckFacing({ from, at, facing, overhead } = {}) {
  if (overhead) return 'top';
  if (!from || !at) return 'front';
  const b = bearingIndex(from, at);
  if (b < 0) return 'top';
  const f = ((Math.round(Number(facing) || 0) % 6) + 6) % 6;
  const delta = ((b - f) % 6 + 6) % 6;
  if (FACING_ARCS.rear.indexOf(delta) !== -1) return 'rear';
  if (FACING_ARCS.side.indexOf(delta) !== -1) return 'side';
  return 'front';
}

// ---- the one route to the damage model ------------------------------------

/**
 * resolveSquadHit({ attacker, action, targetArmour, targetDerived })
 *   -> { effective, suppressOnly }
 *
 * THE ONLY ROUTE FROM THIS LAYER INTO THE DAMAGE MODEL, and a pure
 * adapter: it builds the WeaponBase-shaped object arms.ts asks for, looks the
 * target armour CLASS up by key, and hands both over. There is no
 * subtraction of an armour value here, no penetration-table walk, no
 * damage-type matrix lookup, no local multiplier and no fallback constant. If this
 * function ever grows one, drift guard 12 has been broken.
 *
 *   attacker      a squad row. Its PENETRATION comes from its kit: if the
 *                 squad carries a `loadout.primary`, Lane I loadoutProfile
 *                 reduces it to the armorPen and damageType this hit
 *                 resolves with, exactly as deriveSquad already takes its
 *                 melee and ranged from deriveLoadout. Without that, a
 *                 section handed the one shaped-charge lance in the
 *                 catalogue fired at the LANCE's damage and the RIFLE's
 *                 penetration, and resolved zero against a hull. A caller
 *                 may still pass `profile` explicitly and it wins; the type
 *                 defaults are the last resort. An order that declares its
 *                 own `damageType` (a grenade is fragmentation whatever is
 *                 slung on the shoulder) still overrides both.
 *
 *                 AoE IS NOT RESOLVED HERE. This function answers for ONE
 *                 stand; the burst pattern on the order row is handed to
 *                 Lane I resolveAoe by Lane C, which is the layer that knows
 *                 which hexes have anyone in them.
 *   action        a SQUAD_ACTIONS key or row.
 *   targetArmour  an ArmourClassKey. For a vehicle, the class of the facing
 *                 struckFacing picked.
 *   targetDerived optional. Only its figure count is read: a stand already
 *                 at zero figures cannot be hit again.
 */
export function resolveSquadHit({ attacker, action, targetArmour, targetDerived } = {}) {
  const inert = { effective: 0, suppressOnly: true };
  const row = typeof action === 'string' ? SQUAD_ACTIONS[action] : action;
  const type = attacker && SQUAD_TYPES[attacker.type];
  const target = ARMOUR_CLASSES[targetArmour];
  if (!row || !type || !target) return inert;
  if (targetDerived && (Number(targetDerived.figures) || 0) <= 0) return inert;

  const derived = deriveSquad(attacker);
  const source = row.uses === 'melee' ? derived.melee : row.uses === 'ranged' ? derived.ranged : 0;
  if (source <= 0) return inert;

  const profile = attacker.profile || profileOf(attacker);
  const weapon = {
    damage: round2(source * row.dmg),
    armorPen: profile && profile.armorPen !== undefined ? profile.armorPen : type.armorPen,
    damageType: row.damageType || (profile && profile.damageType) || type.damageType,
  };
  return resolveHit({ weapon, target });
}
