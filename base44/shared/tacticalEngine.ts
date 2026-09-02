// ---------------------------------------------------------------------------
// Tactical battle state machine — server authority. Pure functions over the
// battle object stored at game.activeBattle.tactical. gameEngine owns
// persistence, auth and the macro-map consequences; this owns the fight.
//
// THE SQUAD MODEL (docs/TACTICAL_SQUAD_PLAN.md §1). The atomic token is a
// SQUAD — N figures of one SQUAD_TYPES row plus up to SCALING.maxSpecialists
// staff attachments — standing on one hex of a 15x11 procedurally generated
// field. It is not the old formation mass, and none of the old troop-count
// arithmetic survives.
//
// WHAT THIS FILE AUTHORS, AND WHAT IT REFUSES TO AUTHOR
//
//   It authors: the state machine (deploy -> fighting -> done), the initiative
//   queue and the round clock, order validation, the figure-erosion model, the
//   morale ROLL, suppression duration, deployable construction, rout movement
//   and the doctrine AI.
//
//   It authors NO armour arithmetic (drift guard 12) and NO scaling constant
//   (drift guard 7). Every armour question goes to Lane A's
//   `resolveSquadHit` — the adapter §4 declares to be "THE TACTICAL LAYER'S
//   ONLY ROUTE TO arms.ts resolveHit", which is itself the only caller of
//   `resolveHit` in the tactical stack. Reaching `resolveHit` directly from
//   here would mean re-authoring the weapon-building chain (damage source,
//   penetration and damage-type fallbacks) that the adapter already owns, and
//   a second copy of that chain is precisely what drift guard 12 forbids.
//   There is no penetration-table walk, no damage-type-matrix lookup and
//   no armour subtraction anywhere below — a test greps the source text for
//   all three names, so they may not even appear in this comment.
//
//   Every morale number comes from Lane A's MORALE_MODS, every figure-scaling
//   number from Lane A's SCALING, every work number from Lane A's DEPLOYABLES,
//   every order number from Lane A's SQUAD_ACTIONS, every terrain number from
//   Lane B's tiles, and the zero-effect suppression weight from Lane I's
//   SUPPRESSION. The one table this file owns is COMBAT below: the numbers
//   that describe RESOLUTION rather than content. They are handed to Lane A
//   for docs/COMBAT_DESIGN.md rather than documented here, because Lane A owns
//   that file.
//
// DETERMINISM. The platform RNG is never consulted — a test greps this file's
// source text for the name and fails if it appears anywhere, comments included.
// Every draw is mulberry32(t.seed + t.rolls++)(), so a battle replayed from
// the same seed with the same order sequence is byte-identical. Squad ids are
// a counter, not a random string.
//
// THE EXPORT FREEZE (§6.2). createTactical, submitFormations, autoFormations,
// autoOrders, resolveOrders, activeFormation, battleResult and tacticalView
// keep their names and their shipped call forms — gameEngine imports exactly
// these and is platform-owned, so it will not be updated in step with this
// file. `createTactical` still answers a two-argument call; `resolveOrders`
// still answers a bare target-id string.
// ---------------------------------------------------------------------------
import {
  COLUMN_KEYS, DEPLOYABLES, FIGURES_PER_COMPANY, HEX_DIRECTIONS, INFANTRY_REGIMENTS,
  MORALE_MODS, SCALING, SPECIALISTS, SQUAD_ACTIONS, SQUAD_TYPES, WORK_ARMOUR_APPLIES_TO,
  deriveSquad, hexDistance, poolCost, resolveSquadHit, squadStaffMods, struckFacing,
  toRegiments,
} from './tactical.ts';
import { generateField, hexRange, lineOfSight, pathCost } from './tacticalField.ts';
import { SUPPRESSION } from './arms.ts';
import { deriveMechanized } from './motorPool.ts';

// ---------------------------------------------------------------------------
// 1. Constants
// ---------------------------------------------------------------------------

export const ROUND_LIMIT = 20;
export const MAX_SQUADS = 24;

// The default board. A PURE DATA LITERAL, because every table exported from a
// base44/shared/*.ts file is lifted TEXTUALLY by test/helpers/extract-const.js
// and a computed one cannot be lifted at all — `{ w: FIELD.w, h: FIELD.h }`
// read as a drift guard and was in fact unliftable, so the guard it looked
// like was the one thing it could not be. The two files are held together by
// an ASSERTION instead (`GRID` deep-equals Lane B's `FIELD`), which is
// stronger than the derivation was: it lifts, and it fails loudly the day the
// board changes size in one file only.
//
// The AUTHORITATIVE size of a battle in progress is always t.field.w /
// t.field.h — a field is generated once and stored, and nothing below reads
// GRID after creation.
export const GRID = { w: 15, h: 11 };

// What createTactical generates a field from when the platform passes no
// fieldOpts (the shipped two-argument seam). A pure literal on purpose: it is
// the documented default, and a caller may spread it.
export const DEFAULT_FIELD_OPTS = { seed: 1, nodeKind: 'crossroads', weather: 'clear', fortBonus: 0 };

// THE RESOLUTION MODEL — the only balance numbers this file owns. Everything
// here describes how an already-resolved effect becomes figures, suppression
// and morale; nothing here describes content.
//
//   toughnessBase / toughnessPerArmor
//     A figure absorbs toughnessBase + toughnessPerArmor * the stand's
//     `armor` before it is removed. `armor` is Lane A's numeric resilience
//     column (§4: "the resilience the melee/ranged contest pairs against"),
//     NOT an armour class — the class went to resolveSquadHit and came back
//     as `effective`. Rifle section: 3 + 2*2 = 7, so a rifle volley
//     (effective 14 in the open) takes two figures. Diesel crawler:
//     3 + 2*12 = 27, so the same volley is a scratch and eight are a wreck.
//   carryOver
//     Damage that does not fill a figure is RETAINED on the stand rather than
//     rounded away. Two consequences, both deliberate: small hits accumulate
//     instead of vanishing, and a genuinely zero-effect hit (resolveSquadHit
//     returning effective 0 against superheavy) adds exactly nothing, for
//     ever. A rounding rule would have let a fighter kill a heavy crawler on
//     a lucky swing; this cannot.
//   coverWeight
//     Each point of cover on the target's hex (terrain cover plus the work's
//     `cover`) multiplies its toughness by 1 + coverWeight. Cover 2 is +70%.
//   swingMin / swingSpan
//     The one seeded draw in a damage resolution: effective is multiplied by
//     swingMin + draw * swingSpan, i.e. 0.85..1.15.
//   suppressRound
//     Suppression turns = floor(order suppress weight + suppressRound), so
//     aimed fire (0.25) does not pin, automatic and explosive fire (>= 0.5)
//     pins for a round, and a belt of suppressing fire (1.5) pins for two.
//     A hit that resolved to zero adds Lane I's SUPPRESSION.onZeroEffect —
//     which is what makes a rifle section able to pin a crawler's crew while
//     being unable to mark its hull.
//   suppressedOutput
//     A suppressed stand's damage multiplier.
//
// EVERY ROW IS A LITERAL. COMBAT is module-local, so the pure-data-literal
// rule that binds an EXPORTED table does not formally bind it — but §26 of
// docs/GAME_RULES.md quotes these numbers and a test lifts them out of this
// file's text to check that it still does, so a computed row here would be a
// row the check could not read. The one row that WAS computed
// (`queueGuard: MAX_SQUADS * 2 + 8`) bounded a loop that no longer needs a
// bound: `removeFigures` now takes a wiped stand out of the queue, so the
// queue holds only live stands and the advance is a single step.
const COMBAT = {
  toughnessBase: 3,
  toughnessPerArmor: 2,
  coverWeight: 0.35,
  swingMin: 0.85,
  swingSpan: 0.3,
  suppressRound: 0.5,
  suppressedOutput: 0.65,
  logKeep: 60,
  logShown: 18,
};

// The doctrine order autoFormations carves a rifle regiment into. Read left to
// right, repeatedly, taking a squad whenever the remaining figures cover the
// type's default size. It is a LIST rather than a ratio so the mix is legible:
// three sections of the line for every support weapon, pioneers late.
const AUTO_DOCTRINE = ['riflemen', 'gunners', 'riflemen', 'mortars', 'assault', 'riflemen', 'scouts', 'pioneers'];

// Which staff attachment a doctrine squad is issued. A specialist costs points
// and no figures, so this spends nothing the pool has to cover.
const AUTO_STAFF = {
  riflemen: ['commissar'],
  assault: ['medic'],
  gunners: ['heavy_gunner'],
  scouts: ['signaler'],
  mortars: ['signaler'],
  pioneers: ['sapper'],
  crawler: [],
  artillery: [],
  fighter: [],
};

// Ministry-voice ordinals for auto-carved squads. Beyond the tenth the number
// is printed plainly; a staff that fields more than ten of one type has bigger
// problems than its stationery.
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

// THE MARCH ORDER, and why it is not a SQUAD_ACTIONS row.
//
// Lane A's table has no zero-effect MOVING verb: `hold`, `rally` and
// `entrench` all carry noMove:true by design, and every other order either
// fires or builds. So an activation spent purely closing the ground has no
// key in the content layer, and a squad that only wants to walk cannot be
// given one. `march` is therefore an ENGINE order, not a content order: it is
// accepted by resolveOrders, emitted by autoOrders and reported on fx.action,
// and it is deliberately absent from SQUAD_ACTIONS so Lane F never has to
// append it and Lane A never has to price it. A null or absent action with a
// moveTo is read as a march, because the platform's body makes orderAction
// optional.
const MARCH = 'march';
const MARCH_ACTION = {
  key: 'march', label: 'March', requires: null, uses: null, dmg: 0, guard: 1,
  range: null, aoe: null, moraleHit: 0, suppress: 0, screenTurns: 0,
  noMove: false, turns: 1, builds: null, damageType: null, indirect: false,
};

// ---------------------------------------------------------------------------
// 2. Determinism
// ---------------------------------------------------------------------------

// A verbatim copy of the macro world generator's mulberry32 (src/lib/macro/
// worlds.js:10). COPIED, never imported: base44/shared must not reach into
// src/, and the module that owns the original is a Deno request handler.
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** One draw in [0,1). Advances t.rolls, so replay order is part of the seed. */
const draw = (t) => {
  const n = mulberry32((t.seed + t.rolls) | 0)();
  t.rolls++;
  return n;
};

/** MORALE_MODS.dice dice of MORALE_MODS.dieSides. 3d6 by default. */
const rollMorale = (t) => {
  let sum = 0;
  for (let i = 0; i < MORALE_MODS.dice; i++) sum += 1 + Math.floor(draw(t) * MORALE_MODS.dieSides);
  return sum;
};

// ---------------------------------------------------------------------------
// 3. Small helpers over the state object
// ---------------------------------------------------------------------------

const keyOf = (q, r) => `${q},${r}`;
const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const round4 = (n) => Math.round(n * 10000) / 10000;

const tileAt = (t, q, r) => t.field.tiles[keyOf(q, r)] || null;
const squadById = (t, id) => t.squads.find((s) => s.id === id) || null;
const squadAt = (t, q, r) => t.squads.find((s) => s.q === q && s.r === r) || null;
const occupiedKeys = (t, exceptId) => {
  const out = new Set();
  for (const s of t.squads) if (s.id !== exceptId) out.add(keyOf(s.q, s.r));
  return out;
};
const adjacent = (a, b) => hexDistance(a, b) === 1;
const isFoot = (typeKey) => {
  const type = SQUAD_TYPES[typeKey];
  return !!type && INFANTRY_REGIMENTS.indexOf(type.from) !== -1;
};

/**
 * The derived stat block for a stand. deriveSquad answers for every squad;
 * a MECHANIZED stand — one carrying a VehicleInstance — has its MOVEMENT and
 * BEARING columns overlaid from Lane J's deriveMechanized, which is
 * SquadType-shaped by contract and deliberately returns no `armor` (a numeric
 * armour rating would be drift guard 12's exact prohibition; the hull's
 * resilience stays Lane A's `armor` column and its PROOF is `facings`).
 *
 * ⚠ THE OVERLAY IS `speed`, `range`, `morale`, `initiative` and `pts` — NOT
 * `melee` and `ranged`, AND THIS IS A REPORTED GAP, NOT A PREFERENCE.
 * Every damaging hit goes to Lane A's `resolveSquadHit`, which computes its
 * damage source from `deriveSquad(attacker)` and never inspects `vehicle`.
 * So a hull's MOUNTS do not reach the damage model, and they cannot be made
 * to from here: building a second damage source in this file is precisely the
 * duplicate chain drift guard 12 forbids, and `tactical.ts` is Lane A's.
 * Overlaying the two columns anyway would have published — in the view row,
 * in the fixture Lanes D and E render, in the clock-decided `holdingPower`
 * and in the staff's own valuation — a melee and a ranged figure that is NOT
 * the figure the stand fires at. Measured on a heavy crawler: the overlay
 * says 10.9 and the shot resolves at 12. One number, everywhere, that is the
 * number the engine actually uses, is the only honest shape available to this
 * lane; the fix that makes the mounts bite is a Lane A/J item and is filed as
 * such (`docs/prompts/PLATFORM_HANDOFF.md` C10).
 *
 * `initiative` is the one derived value the overlay has to recompute, because
 * deriveSquad cannot see the hull's pace. It is recomputed from Lane A's
 * SCALING constants and the same three terms deriveSquad uses, never from a
 * number authored here — and a test pins that a hull whose speed matches its
 * type's speed derives exactly deriveSquad's initiative, so the two cannot
 * drift apart silently.
 *
 * An unreadable vehicle falls back to the type's declared values rather than
 * taking the battle down. A test drives that path with a bogus chassis key.
 */
function derivedOf(sq) {
  const base = deriveSquad(sq);
  if (!sq || !sq.vehicle) return base;
  let mech = null;
  try {
    mech = deriveMechanized(sq);
  } catch {
    return base;
  }
  const staff = squadStaffMods(sq.specialists);
  const morale = clamp(mech.morale + staff.morale, SCALING.moraleMin, SCALING.moraleMax);
  return {
    figures: base.figures,
    // Lane A's, not the hull's — see the gap named in this function's header.
    melee: base.melee,
    ranged: base.ranged,
    range: mech.range,
    armor: base.armor,
    speed: Math.max(SCALING.speedFloor, mech.speed),
    morale,
    initiative: mech.speed * SCALING.initiativePerSpeed + SCALING.initiativeBase + staff.initiative,
    actions: base.actions,
    pts: Math.round(mech.pts) + staff.pts,
  };
}

/**
 * The ArmourClassKey a hit on this stand resolves against.
 *
 * Three layers, in this order, and the order is the rule:
 *   1. a MECHANIZED stand answers on the facing struckFacing picks — front,
 *      side, rear, or top for an overhead attack;
 *   2. a stand standing in a WORK answers on the work's `armourClass`, but
 *      only when its own class is in Lane A's WORK_ARMOUR_APPLIES_TO. A work
 *      re-classes a rifleman; it never re-classes a hull, so this cannot
 *      undo layer 1;
 *   3. otherwise the type's declared `armour`.
 *
 * The engine picks WHICH class. It never asks what is behind it — that is
 * resolveSquadHit's business and arms.ts's alone.
 */
function armourKeyOf(t, sq, from, overhead) {
  if (sq.facings) return plateOf(sq, from, overhead).key;
  // `none` for a type this catalogue no longer knows — a battle persisted
  // against an older SQUAD_TYPES can hand the engine one, and deriveSquad
  // already answers a zeroed block for it. It is a real branch and a test
  // drives it. There is deliberately NO second fallback for a KNOWN row with
  // no `armour`: every row declares one, arms.ts knows every class it
  // declares, and a test asserts that over the whole table rather than
  // leaving a guard here that nothing could ever reach.
  const type = SQUAD_TYPES[sq.type];
  const own = type ? type.armour : 'none';
  const tile = standTile(t, sq);
  if (tile.work && WORK_ARMOUR_APPLIES_TO.indexOf(own) !== -1) {
    return DEPLOYABLES[tile.work].armourClass;
  }
  return own;
}

/**
 * THE PLATE A HIT LANDS ON — the face AND the class behind it, from ONE
 * decision, because they were two.
 *
 * `facings` is PERSISTED on the Game record at deployment, so a battle saved
 * before Lane J last touched the plate set can come back missing a face.
 * Handing `undefined` to resolveSquadHit would resolve the hit against no
 * armour class at all, which is the softest possible answer to the hardest
 * possible question, so the fallback is the FRONT plate — the conservative
 * one. A test drives it.
 *
 * The fallback used to live in `armourKeyOf` alone while the facing reported
 * to the client was recomputed independently, so on that path the engine
 * resolved the shot against `front` and TOLD the client — in `fx.facing` and
 * in the log line — that it had landed on the rear. One decision, returned
 * whole, is the only shape in which the two cannot disagree: the reported
 * face is by construction the face whose class was asked about.
 */
function plateOf(sq, from, overhead) {
  const face = struckFacing({ from, at: { q: sq.q, r: sq.r }, facing: sq.facing, overhead: !!overhead });
  if (sq.facings[face]) return { facing: face, key: sq.facings[face] };
  return { facing: 'front', key: sq.facings.front };
}

/** The facing key a hit from `from` RESOLVED against, for the log and for fx. */
function facingKeyOf(sq, from, overhead) {
  if (!sq.facings) return null;
  return plateOf(sq, from, overhead).facing;
}

/**
 * THE GROUND UNDER A STAND, and it FAILS LOUDLY when there is none.
 *
 * Every stand on this board is standing on a tile: deployment seats it on a
 * zone hex, a march is validated against `occupiable` before the stand is
 * moved, and a rout picks from `hexRange`. So a stand off the field is not a
 * situation, it is a CORRUPTED BATTLE — and five separate silent defaults
 * (cover 0, no work, no range bonus, no suppression bonus, the type's own
 * armour) is five different wrong answers to it, none of which any test could
 * reach and all of which read as deliberate rules.
 *
 * The addendum makes the same call about `meta.losCap`: a silent default is
 * an invisible rules change. One loud invariant, in one place, is the honest
 * shape — and unlike the defaults, it is drivable from a test.
 */
function standTile(t, sq) {
  const tile = t.field.tiles[keyOf(sq.q, sq.r)];
  if (!tile) throw new Error(`No ground beneath ${sq.id} at ${sq.q},${sq.r}`);
  return tile;
}

/** Cover points on a stand's hex: terrain cover plus the work standing on it. */
function coverOf(t, sq) {
  const tile = standTile(t, sq);
  return tile.cover + (tile.work ? DEPLOYABLES[tile.work].cover : 0);
}

/** The work's absolute speed set (emplacement pins a gun at 0), or null. */
function workSpeedOf(t, sq) {
  const tile = standTile(t, sq);
  return tile.work ? DEPLOYABLES[tile.work].mods.speed : null;
}

/** Hexes a stand may march this activation, after the work it stands in. */
function speedOf(t, sq, d) {
  const set = workSpeedOf(t, sq);
  return set === null ? d.speed : set;
}

/** The reach of an order: its override, else the squad range, plus the work. */
function rangeOf(t, sq, d, act) {
  const base = act.range === null ? d.range : act.range;
  const tile = standTile(t, sq);
  return Math.max(1, base + (tile.work ? DEPLOYABLES[tile.work].mods.range : 0));
}

/** Suppression weight the order puts out, after the work and the hit result. */
function suppressWeightOf(t, sq, act, zeroEffect) {
  const tile = standTile(t, sq);
  const bonus = tile.work ? DEPLOYABLES[tile.work].mods.suppress : 0;
  return act.suppress + bonus + (zeroEffect ? SUPPRESSION.onZeroEffect : 0);
}

/**
 * MAY THIS STAND STAND HERE, AND IF NOT, WHY NOT — a Ministry-voice reason,
 * or null when the ground will take it.
 *
 * It returns the REASON rather than a boolean because resolveOrders used to
 * ask this question twice: once itself, for the two answers it had a sentence
 * for, and once here for the two it did not. A hull refused a trench was
 * therefore told 'That ground is already held', which is not what happened and
 * not a thing the commander can act on. One decision, four true sentences.
 *
 * The last clause is the other half of Lane A's `infantryOnly` flag: Lane A's
 * squadActions owns RAISING a work, this owns OCCUPYING one.
 */
function occupiable(t, sq, q, r) {
  const tile = tileAt(t, q, r);
  if (!tile) return 'That ground is off the field';
  if (tile.moveCost === null) return 'That ground will not take a section';
  const sitting = squadAt(t, q, r);
  if (sitting && sitting.id !== sq.id) return 'That ground is already held';
  if (tile.work && DEPLOYABLES[tile.work].infantryOnly && !isFoot(sq.type)) {
    return `No hull will stand in a ${DEPLOYABLES[tile.work].label.toLowerCase()}`;
  }
  return null;
}

/** The same question asked for a yes or a no. */
const canOccupy = (t, sq, q, r) => occupiable(t, sq, q, r) === null;

/** Is this stand grounded by the weather? Lane B reports; Lane C enforces. */
function isGrounded(t, sq) {
  const type = SQUAD_TYPES[sq.type];
  return !!(t.field.meta.groundsFighters && type && type.from === 'fighter');
}

/** An attack from the air or over the horizon lands on the top plate. */
function isOverhead(sq, act) {
  const type = SQUAD_TYPES[sq.type];
  return !!act.indirect || !!(type && type.from === 'fighter');
}

// ---------------------------------------------------------------------------
// 4. Creation
// ---------------------------------------------------------------------------

/**
 * createTactical(attackerUnits, defenderUnits, fieldOpts)
 *
 * `attackerUnits` / `defenderUnits` are macro-map REGIMENTS (companies, keyed
 * by COLUMN_KEYS). They become FIGURE pools through Lane A's
 * FIGURES_PER_COMPANY, which is keyed by regiment and never by squad type
 * (orchestrator ruling Q5).
 *
 * THE FIELD IS GENERATED ONCE AND STORED. Nothing below regenerates it: a
 * second generateField call with a different fortBonus or weather would
 * repaint 165 tiles underneath squads that are already standing on them. The
 * third argument is optional so the shipped two-argument call site in
 * gameEngine keeps working.
 */
export function createTactical(attackerUnits, defenderUnits, fieldOpts) {
  const opts = fieldOpts || DEFAULT_FIELD_OPTS;
  const seed = Number.isFinite(opts.seed) ? Math.floor(opts.seed) : DEFAULT_FIELD_OPTS.seed;
  const field = generateField({
    seed,
    nodeKind: opts.nodeKind === undefined ? DEFAULT_FIELD_OPTS.nodeKind : opts.nodeKind,
    weather: opts.weather === undefined ? DEFAULT_FIELD_OPTS.weather : opts.weather,
    fortBonus: opts.fortBonus === undefined ? DEFAULT_FIELD_OPTS.fortBonus : opts.fortBonus,
    w: GRID.w,
    h: GRID.h,
  });
  return {
    status: 'deploy',
    round: 1,
    roundLimit: ROUND_LIMIT,
    field,
    qIndex: 0,
    queue: [],
    squads: [],
    pools: { attacker: figurePool(attackerUnits), defender: figurePool(defenderUnits) },
    deployed: { attacker: false, defender: false },
    // The per-faction relic slot. Boarding assaults are a later Field
    // Amendment and NOTHING below reads or writes this — it exists now so the
    // shape is not re-cut once the capture path is built, and so the
    // platform's Game persistence carries it from the first battle. Operator
    // ruling: on capture the captor loots the project's unspent MATERIALS
    // only; the project, its progress and its housed-Object requirement die
    // with the keel.
    relicProject: { attacker: null, defender: null },
    // Temporary LOS-blocking screens (smoke). Each entry restores the tile's
    // own blocksLOS when it expires, so a screen never permanently repaints
    // Lane B's ground.
    screens: [],
    // Hexes where a stand was destroyed this round — MORALE_MODS
    // .adjacentFriendlyDestroyed reads them and endRound clears them.
    lost: [],
    log: ['The field is surveyed. Both staffs draw up their order of battle.'],
    fx: null,
    seed,
    rolls: 0,
    nextId: 0,
  };
}

/** Regiments (companies) -> figures, all four COLUMN_KEYS, zero by default. */
function figurePool(units) {
  const out = {};
  for (const k of COLUMN_KEYS) out[k] = Math.max(0, Math.floor((units && units[k]) || 0)) * FIGURES_PER_COMPANY[k];
  return out;
}

// ---------------------------------------------------------------------------
// 5. Deployment
// ---------------------------------------------------------------------------

/**
 * submitFormations(t, side, squads) -> error string, or null on success.
 *
 * The name is frozen by §6.2; what it files is a SQUAD list, not formations.
 * Each row is `{ name, type, figures, specialists[], at?: {q,r} }` and may
 * additionally carry Lane I's `loadout` and Lane J's `vehicle`, both of which
 * §4 puts on a deploy row and both of which are passed through untouched to
 * the derivations that own them.
 *
 * PLACEMENT IS TWO PASSES, and that is not tidiness: honouring `at` in one
 * pass makes a client's preferred hex depend on which row happened to claim
 * it first, so every row that asked for a legal hex is seated before any row
 * is auto-seated.
 */
export function submitFormations(t, side, squads) {
  if (t.status !== 'deploy') return 'The order of battle is already sealed';
  if (side !== 'attacker' && side !== 'defender') return 'No such command on this field';
  if (t.deployed[side]) return 'Your order of battle is already filed';

  const list = Array.isArray(squads) ? squads : [];
  if (list.length === 0) return 'At least one section must take the field';
  if (list.length > MAX_SQUADS) return `No more than ${MAX_SQUADS} sections may be fielded`;

  for (const row of list) {
    const type = row && SQUAD_TYPES[row.type];
    if (!type) return 'The Ministry lists no such section';
    const n = Number(row.figures);
    if (!Number.isInteger(n) || n < type.minFigures || n > type.maxFigures) {
      return `A ${type.label.toLowerCase()} musters between ${type.minFigures} and ${type.maxFigures} figures`;
    }
    const staff = row.specialists;
    if (staff !== undefined && staff !== null && !Array.isArray(staff)) return 'The staff return is malformed';
    const wanted = Array.isArray(staff) ? staff : [];
    if (wanted.length > SCALING.maxSpecialists) {
      return `No section carries more than ${SCALING.maxSpecialists} staff attachments`;
    }
    for (const k of wanted) if (!SPECIALISTS[k]) return 'The Ministry lists no such staff attachment';
  }

  const spent = poolCost(list);
  for (const k of COLUMN_KEYS) {
    if (spent[k] > (t.pools[side][k] || 0)) return `Your column holds no such reserve of ${k}`;
  }

  const zone = t.field.deploy[side];
  const zoneKeys = new Set(zone.map((h) => keyOf(h.q, h.r)));
  // FILL FROM THE FRONT OF THE ZONE, and fill the two zones as 180-DEGREE
  // ROTATIONS OF EACH OTHER. Both halves of that are corrections, and the
  // second one is the important one.
  //
  // Front first, because Lane B lists a deploy zone west to east: taking it in
  // that order packs the attacker's first sections against column 0 and walls
  // the rest of the order of battle in behind them. Twenty sections in a
  // three-column strip is a traffic jam, and the rear ranks then spend the
  // whole battle unable to path anywhere.
  //
  // Rotated, because an axial "column" is a DIAGONAL in hex space, so the two
  // deploy strips are parallelograms and mirroring q alone is NOT an isometry
  // of the hex metric. Filling both sides r-ascending put the attacker's first
  // section on the sheltered corner of its parallelogram and the defender's on
  // the exposed corner of its own: from (2,0) every enemy column is the same
  // distance away whatever its row, while (12,0) is reachable from every row
  // of the enemy line. Measured over forty scripted battles between identical
  // orders of battle, that alone routed the defender's siege piece in the
  // first round of most of them. (q,r) -> (w-1-q, h-1-r) IS an isometry, so
  // the defender fills its rows in the opposite order and the two lines are
  // genuinely the same shape.
  const order = zone.slice().sort((a, b) => (side === 'attacker'
    ? (b.q - a.q) || (a.r - b.r)
    : (a.q - b.q) || (b.r - a.r)));
  const facing = side === 'attacker' ? 0 : 3;
  const firstId = t.nextId;
  const placed = list.map((row) => newSquad(t, side, row, facing));

  // PLACEMENT IS ATOMIC, and that is a repair rather than a refinement.
  //
  // Both passes used to seat straight into `t.squads`, and the second one can
  // FAIL — 'the deployment ground will not hold another section' — after the
  // first has already pushed sections onto the field. The filing was then
  // rejected with part of it standing on the board, `deployed[side]` still
  // false and `nextId` advanced: the commander re-filed, the phantom sections
  // were still holding the hexes his new ones needed, and the same rejection
  // came back for ever. An order of battle that is refused must leave the
  // field exactly as it found it, which is the rule every rejection in
  // resolveOrders already keeps.
  //
  // It is one work away from live: the tightest deploy zone Lane B generates
  // offers exactly MAX_SQUADS hexes a HULL may stand on (fortBonus 3 stamps
  // infantry-only works over the rest), so a legal filing of 24 hulls sits on
  // the boundary. A test asserts that headroom against Lane B directly, and
  // another drives the rejection and then re-files successfully.
  //
  // `taken` does the work `t.squads` used to do incidentally: a hex claimed by
  // an earlier row of THIS filing is not offered to a later one.
  const taken = new Set();
  const seating = [];
  const seat = (sq, q, r) => {
    sq.q = q; sq.r = r;
    taken.add(keyOf(q, r));
    seating.push(sq);
  };
  for (const sq of placed) {
    const at = sq.wanted;
    if (!at || !zoneKeys.has(keyOf(at.q, at.r))) continue;
    if (taken.has(keyOf(at.q, at.r)) || !canOccupy(t, sq, at.q, at.r)) continue;
    seat(sq, at.q, at.r);
  }
  for (const sq of placed) {
    if (seating.indexOf(sq) !== -1) continue;
    const hex = order.find((h) => !taken.has(keyOf(h.q, h.r)) && canOccupy(t, sq, h.q, h.r));
    if (!hex) {
      t.nextId = firstId;
      return 'The deployment ground will not hold another section';
    }
    seat(sq, hex.q, hex.r);
  }
  for (const sq of seating) {
    delete sq.wanted;
    t.squads.push(sq);
  }

  t.deployed[side] = true;
  t.log.push(`The ${side === 'attacker' ? 'assault' : 'defending'} staff files its order of battle — ${list.length} section${list.length === 1 ? '' : 's'} take the field.`);
  if (t.deployed.attacker && t.deployed.defender) {
    t.status = 'fighting';
    buildQueue(t);
    t.log.push('Whistles. The first sections step off.');
  }
  return null;
}

/** One server-side stand. `wanted` is stripped once placement is settled. */
function newSquad(t, side, row, facing) {
  const type = SQUAD_TYPES[row.type];
  t.nextId++;
  const id = `${side === 'attacker' ? 'a' : 'd'}${t.nextId}`;
  const sq = {
    id,
    side,
    name: String(row.name || type.label).slice(0, 28),
    type: row.type,
    figures: Number(row.figures),
    maxFigures: Number(row.figures),
    specialists: (Array.isArray(row.specialists) ? row.specialists : []).slice(0, SCALING.maxSpecialists),
    q: 0,
    r: 0,
    facing,
    facings: null,
    wounds: 0,
    lostThisRound: 0,
    status: { suppressed: 0, routed: false, guard: 1, building: null },
    wanted: row.at && Number.isFinite(row.at.q) && Number.isFinite(row.at.r) ? { q: row.at.q, r: row.at.r } : null,
  };
  if (row.loadout) sq.loadout = row.loadout;
  if (row.vehicle) {
    sq.vehicle = row.vehicle;
    try {
      sq.facings = deriveMechanized(sq).facings;
    } catch {
      sq.facings = null;
    }
  }
  return sq;
}

/**
 * autoFormations(pool) -> a serviceable squad list. ONE argument: the shipped
 * seam calls it with one, and the pool it is handed is FIGURES.
 *
 * Vehicles first (one stand per figure — a crawler, a gun and an aeroplane
 * are single-figure squads by FIGURES_PER_COMPANY), then the rifle regiment
 * carved along AUTO_DOCTRINE until what is left will not fill another
 * section. The remainder becomes a short section if it clears the smallest
 * minFigures on the board, and is otherwise left in the depot.
 *
 * Deterministic: no draw is taken, the doctrine list is walked in order and
 * ties are broken by that order. Never more than MAX_SQUADS.
 */
export function autoFormations(pool = {}) {
  const out = [];
  const counts = {};
  const push = (typeKey, figures) => {
    if (out.length >= MAX_SQUADS) return false;
    counts[typeKey] = (counts[typeKey] || 0) + 1;
    const ord = ORDINALS[counts[typeKey] - 1] || `${counts[typeKey]}th`;
    out.push({
      name: `${ord} ${SQUAD_TYPES[typeKey].label}`,
      type: typeKey,
      figures,
      specialists: AUTO_STAFF[typeKey].slice(),
    });
    return true;
  };

  for (const typeKey of ['crawler', 'artillery', 'fighter']) {
    const have = Math.max(0, Math.floor(pool[typeKey] || 0));
    for (let i = 0; i < have; i++) if (!push(typeKey, SQUAD_TYPES[typeKey].figures)) break;
  }

  let left = Math.max(0, Math.floor(pool.riflemen || 0));
  let cursor = 0;
  let stalled = 0;
  while (left > 0 && out.length < MAX_SQUADS && stalled < AUTO_DOCTRINE.length) {
    const typeKey = AUTO_DOCTRINE[cursor % AUTO_DOCTRINE.length];
    cursor++;
    const size = SQUAD_TYPES[typeKey].figures;
    if (size > left) { stalled++; continue; }
    stalled = 0;
    push(typeKey, size);
    left -= size;
  }
  if (left > 0 && out.length < MAX_SQUADS) {
    // The tail. Smallest type that the remainder can still muster, so a
    // regiment is not left with figures nobody can carve into a section.
    let best = null;
    for (const typeKey of AUTO_DOCTRINE) {
      const type = SQUAD_TYPES[typeKey];
      if (left < type.minFigures) continue;
      if (!best || type.minFigures < SQUAD_TYPES[best].minFigures) best = typeKey;
    }
    if (best) push(best, Math.min(left, SQUAD_TYPES[best].maxFigures));
  }
  return out;
}

// ---------------------------------------------------------------------------
// 6. The queue and the round clock
// ---------------------------------------------------------------------------

/**
 * The initiative queue: highest initiative first.
 *
 * THE TIE-BREAK IS A SEEDED DRAW, and that is a correction, not a flourish.
 * Initiative is speed * SCALING.initiativePerSpeed + SCALING.initiativeBase +
 * staff, so on a board of thirty-odd stands most of them TIE — and breaking a
 * tie on the id string hands every one of those ties to the attacker, whose
 * ids all begin 'a'. Measured over twenty scripted battles between identical
 * orders of battle, that alone took the attacker to nineteen wins. One draw
 * per stand per round, taken in t.squads order (deployment order, which is
 * stable), keeps the queue exactly reproducible from the seed while giving
 * neither side the first word.
 */
function buildQueue(t) {
  t.queue = t.squads
    .map((s) => ({ id: s.id, init: derivedOf(s).initiative, cut: draw(t) }))
    .sort((a, b) => b.init - a.init || a.cut - b.cut || (a.id < b.id ? -1 : 1))
    .map((x) => x.id);
  t.qIndex = 0;
}

/** The squad whose activation it is, or null when no fight is underway. */
export const activeFormation = (t) =>
  t && t.status === 'fighting' ? t.squads.find((s) => s.id === t.queue[t.qIndex]) || null : null;

/**
 * Hand the activation to the next stand, and close the round when the queue
 * runs out.
 *
 * ONE STEP, NOT A SEARCH. This used to be a bounded loop that skipped queue
 * entries naming stands no longer on the field, because a wiped stand was
 * removed from `t.squads` and left in `t.queue`. It is not skipped any more
 * because it is not there any more (`removeFigures`), and a loop whose second
 * iteration is unreachable is a guard against a state the engine no longer
 * has. `endRound` rebuilds the queue from the survivors and resets the index,
 * except past the round limit, where it returns with the engagement called.
 */
function advanceQueue(t) {
  t.qIndex++;
  if (t.qIndex < t.queue.length) return;
  endRound(t);
}

/**
 * End-of-round upkeep, in this order: suppression lifts, screens thin, works
 * are finished, medics recover, the round's casualty memory is cleared. Then
 * the queue is rebuilt, because a squad that lost figures may have lost the
 * initiative with them.
 */
function endRound(t) {
  t.round++;
  if (t.round > t.roundLimit) {
    t.log.push('The engagement is called. The ground is counted as it stands.');
    return;
  }
  for (const sq of t.squads) {
    if (sq.status.suppressed > 0) sq.status.suppressed--;
    sq.lostThisRound = 0;
  }
  for (let i = t.screens.length - 1; i >= 0; i--) {
    t.screens[i].turns--;
    if (t.screens[i].turns > 0) continue;
    // Not guarded: a screen is only ever laid on a tile that exists, and a
    // screen whose ground has vanished is a corrupted battle, not a case.
    t.field.tiles[keyOf(t.screens[i].q, t.screens[i].r)].blocksLOS = t.screens[i].was;
    t.screens.splice(i, 1);
  }
  for (const sq of t.squads) {
    const b = sq.status.building;
    if (!b) continue;
    b.turnsLeft--;
    if (b.turnsLeft > 0) continue;
    standTile(t, sq).work = b.work;
    sq.status.building = null;
    t.log.push(`${sq.name} reports the ${DEPLOYABLES[b.work].label.toLowerCase()} complete.`);
  }
  for (const sq of t.squads) {
    const staff = squadStaffMods(sq.specialists);
    if (staff.recoverPerTurn <= 0) continue;
    if (sq.figures >= sq.maxFigures) continue;
    if (t.squads.some((x) => x.side !== sq.side && adjacent(x, sq))) continue;
    const back = Math.min(staff.recoverPerTurn, sq.maxFigures - sq.figures);
    sq.figures += back;
    t.log.push(`${sq.name} returns ${back} figure${back === 1 ? '' : 's'} to the line.`);
  }
  t.lost = [];
  buildQueue(t);
  t.log.push(`— Round ${t.round} —`);
}

// ---------------------------------------------------------------------------
// 7. Morale
// ---------------------------------------------------------------------------

/**
 * The GURPS-shaped roll-under test, entirely on Lane A's MORALE_MODS: roll
 * `dice` of `dieSides` under the derived morale plus the situation. Sign
 * convention is Lane A's — a modifier is ADDED to the target, so a negative
 * number makes the test harder.
 *
 * Outcomes: 'held', 'suppressed', or 'routed' when the failure margin reaches
 * MORALE_MODS.routMargin. A commissar's moraleFloor converts a rout into
 * SPECIALISTS.commissar.mods.executionToll figures and the section stands —
 * suppressed, and one man lighter.
 */
function moraleTest(t, sq, ctx) {
  const d = derivedOf(sq);
  const staff = squadStaffMods(sq.specialists);
  let target = d.morale;
  target += MORALE_MODS.perCasualtyThisTurn * sq.lostThisRound;
  if (coverOf(t, sq) > 0) target += MORALE_MODS.inCover;
  if (standTile(t, sq).work) target += MORALE_MODS.inWork;
  if (sq.status.guard >= SQUAD_ACTIONS.entrench.guard) target += MORALE_MODS.entrenched;
  if (sq.status.suppressed > 0) target += MORALE_MODS.alreadySuppressed;
  if (t.squads.filter((x) => x.side !== sq.side && adjacent(x, sq)).length >= 2) target += MORALE_MODS.flanked;
  if (t.lost.some((h) => h.side === sq.side && adjacent(h, sq))) target += MORALE_MODS.adjacentFriendlyDestroyed;
  if (ctx.unseen) target += MORALE_MODS.underFireFromUnseen;
  if (ctx.rallying) target += MORALE_MODS.rallying;
  if (t.squads.some((x) => x.side === sq.side && x.id !== sq.id && adjacent(x, sq)
    && (x.specialists.indexOf('signaler') !== -1 || x.specialists.indexOf('commissar') !== -1))) {
    target += MORALE_MODS.commandAdjacent;
  }
  target -= ctx.moraleHit || 0;

  const roll = rollMorale(t);
  if (roll <= MORALE_MODS.autoPassRoll) return 'held';
  if (roll < MORALE_MODS.autoFailRoll && roll <= target) return 'held';
  if (roll - target < MORALE_MODS.routMargin) return 'suppressed';
  if (staff.moraleFloor > 0 && staff.executionToll > 0) return 'commissar';
  return 'routed';
}

/** Apply a test result to the stand and say what actually happened. */
function applyMorale(t, sq, result) {
  if (result === 'held') return 'held';
  if (result === 'suppressed') {
    sq.status.suppressed = Math.max(sq.status.suppressed, MORALE_MODS.suppressedTurns);
    t.log.push(`${sq.name} goes to ground.`);
    return 'suppressed';
  }
  if (result === 'commissar') {
    const staff = squadStaffMods(sq.specialists);
    removeFigures(t, sq, staff.executionToll);
    // A section the toll finishes has already been logged off the field by
    // removeFigures. Saying it stands, one line later, would be a lie the log
    // told twice in the same breath.
    if (sq.figures > 0) {
      sq.status.suppressed = Math.max(sq.status.suppressed, MORALE_MODS.suppressedTurns);
      t.log.push(`The commissar of ${sq.name} closes the ledger. The section stands.`);
    }
    return 'suppressed';
  }
  sq.status.routed = true;
  sq.status.guard = 1;
  t.log.push(`${sq.name} breaks and runs for its own line.`);
  return 'routed';
}

// ---------------------------------------------------------------------------
// 8. Damage
// ---------------------------------------------------------------------------

/**
 * Remove whole figures; a stand at zero leaves the field AND THE QUEUE.
 *
 * The queue half is not bookkeeping. `tacticalView` publishes `t.queue`
 * verbatim, `advanceQueue` only SKIPS a dead id rather than dropping it, and
 * the queue is not rebuilt until `endRound` — so a stand killed mid-round
 * stayed in the emitted payload for the rest of that round, and §4 declares
 * `queue: [squadId]`. Lane E's rail resolves those ids against `squads[]`;
 * a dangling one is an `undefined` in the middle of the strip. The committed
 * fixture carried one.
 *
 * THE INDEX HAS TO FOLLOW THE SPLICE. Removing an entry at or before the
 * current activation shifts every later entry one to the left underneath it,
 * so without the decrement `advanceQueue`'s `++` lands one stand too far and
 * a section silently loses its turn. `at === t.qIndex` is the actor killing
 * itself — its own burst, or a commissar's toll on its last figure — and
 * leaves `qIndex` at -1 for the few statements before `advanceQueue` restores
 * it to 0, which is the stand that took its place. That window is closed by
 * construction and not by a clamp: every caller of `removeFigures` sits after
 * the commit point of `resolveOrders` or `resolveRout`, and both of those end
 * in `advanceQueue` on every path. Both halves are driven by tests — the
 * skip-the-next-stand one and the actor-kills-itself one.
 */
function removeFigures(t, sq, n) {
  const gone = Math.max(0, Math.min(sq.figures, Math.floor(n)));
  if (gone <= 0) return 0;
  sq.figures -= gone;
  sq.lostThisRound += gone;
  if (sq.figures <= 0) {
    t.lost.push({ q: sq.q, r: sq.r, side: sq.side });
    t.squads = t.squads.filter((x) => x.id !== sq.id);
    const at = t.queue.indexOf(sq.id);
    if (at !== -1) {
      t.queue.splice(at, 1);
      if (at <= t.qIndex) t.qIndex--;
    }
    t.log.push(`${sq.name} is wiped from the field.`);
  }
  return gone;
}

/**
 * ONE stand struck by one order. Returns
 * `{ figures, effective, suppressOnly, facing }`.
 *
 * The whole armour question — penetration, damage type, what a class is
 * proof against — is asked once, of Lane A's resolveSquadHit, and answered as
 * `effective`. Everything after that line is bookkeeping in figures:
 *
 *   effective  ->  x swing  ->  / (toughness x cover x guard)  ->  figures
 *
 * with the fractional remainder RETAINED on the stand. A stand whose armour
 * class returns effective 0 accumulates exactly zero for ever, which is what
 * makes drift guard 12's mult:0 row bite: a rifle section cannot mark a heavy
 * hull however long it fires, and can still pin the crew.
 */
function strike(t, actor, act, victim, falloffMult) {
  const overhead = isOverhead(actor, act);
  const from = { q: actor.q, r: actor.r };
  const armourKey = armourKeyOf(t, victim, from, overhead);
  const hit = resolveSquadHit({
    attacker: actor,
    action: act,
    targetArmour: armourKey,
    targetDerived: derivedOf(victim),
  });
  const facing = facingKeyOf(victim, from, overhead);
  let effective = hit.effective * (falloffMult === undefined ? 1 : falloffMult);
  if (actor.status.suppressed > 0) effective *= COMBAT.suppressedOutput;
  effective = round4(effective * (COMBAT.swingMin + draw(t) * COMBAT.swingSpan));

  const vd = derivedOf(victim);
  const mitigation = (1 + COMBAT.coverWeight * coverOf(t, victim)) * Math.max(victim.status.guard, 0.1);
  const perFigure = (COMBAT.toughnessBase + COMBAT.toughnessPerArmor * vd.armor) * mitigation;
  const pool = victim.wounds + effective;
  const figures = Math.floor(pool / perFigure);
  victim.wounds = round4(pool - figures * perFigure);
  const gone = removeFigures(t, victim, figures);
  return { figures: gone, effective, suppressOnly: hit.suppressOnly, facing };
}

/**
 * THE SUPPRESSION RING — Lane A's `aoeSuppress`, applied where Lane A says.
 *
 * Lane A declares the mod as "hexes added to the SUPPRESS radius (Lane C)",
 * and the heavy gunner's own blurb is "It kills little and makes a hex
 * unusable". This engine was adding it to the DAMAGE radius instead, and the
 * two are not the same rule in any respect:
 *
 *   * it widened the killing radius of a burst, which is the one thing the
 *     mod is written not to do;
 *   * because the shell weight is SHARED among the stands under it, widening
 *     the burst DILUTED it — a heavy gunner attached to a bombing section
 *     made its grenades weaker per stand, an upgrade with a penalty;
 *   * and it did nothing at all for the section that actually carries the
 *     mod, because `suppress` — the gunner's own order, the one the staff
 *     issues him — has no `aoe` row for the radius to be added to. Measured
 *     before the fix: every heavy gunner in an auto-carved order of battle
 *     was attached to a section with no area order at all, so the whole mod
 *     resolved to nothing on every stand that had it.
 *
 * The ring is the correct shape for both. Stands the order STRUCK are already
 * suppressed by `afterHit`. `reach` is the SUPPRESS radius — the order's own
 * burst radius plus `aoeSuppress` for an area order, and `aoeSuppress` alone
 * measured from the target's hex for point fire — and every stand inside it
 * that the order did not strike is pinned and tested WITHOUT losing a figure:
 * the belt goes over their heads. Friendly stands are caught too, for the
 * same reason the burst catches them: an automatic weapon does not read
 * armbands, and a mod that denied ground at no cost to the side using it
 * would be free area denial.
 *
 * THE FIRER IS NOT IN ITS OWN RING. For point fire the ring is measured from
 * the TARGET's hex with a reach of `aoeSuppress` alone, so a section firing at
 * an adjacent stand stands inside it — and the ring pins and morale-tests
 * every stand it finds, so the section pinned ITSELF and could break and run
 * on its own order. Driven against the real tables before the fix: a gunner
 * section with a heavy gunner, issued the `suppress` the staff itself chooses,
 * came out of its own activation `suppressed: 2` and `routed: true`, and the
 * log read "MG breaks and runs for its own line." / "The belt walks on and
 * pins 1 more section." — the one more section being the firer. Friendly
 * stands stay in, for the reason the docstring above gives; the man behind the
 * gun is not one of them.
 *
 * Returns the stands it pinned, for the log.
 */
function suppressRing(t, actor, act, aimHex, struck, reach) {
  if (reach <= 0 || !aimHex) return [];
  const pinned = [];
  for (const other of t.squads.slice()) {
    if (other.id === actor.id) continue;
    if (other.figures <= 0 || struck.has(other.id)) continue;
    if (hexDistance(other, aimHex) > reach) continue;
    // `false`, not `true`: SUPPRESSION.onZeroEffect is the weight a hit that
    // resolved to nothing still carries, and nothing was resolved against
    // this stand at all. It takes the order's own weight and no more.
    const turns = Math.floor(suppressWeightOf(t, actor, act, false) + COMBAT.suppressRound);
    if (turns <= 0) continue;
    other.status.suppressed = Math.max(other.status.suppressed, turns);
    applyMorale(t, other, moraleTest(t, other, { moraleHit: act.moraleHit, unseen: !!act.indirect }));
    pinned.push(other);
  }
  return pinned;
}

/** Suppression and the morale test that follow a hit, for one victim. */
function afterHit(t, actor, act, victim, hit) {
  if (victim.figures <= 0) return null;
  const weight = suppressWeightOf(t, actor, act, hit.suppressOnly);
  const turns = Math.floor(weight + COMBAT.suppressRound);
  if (turns > 0) victim.status.suppressed = Math.max(victim.status.suppressed, turns);
  const unseen = !!act.indirect || !lineOfSight(t.field, { q: victim.q, r: victim.r }, { q: actor.q, r: actor.r });
  return applyMorale(t, victim, moraleTest(t, victim, { moraleHit: act.moraleHit, unseen }));
}

// ---------------------------------------------------------------------------
// 9. Orders
// ---------------------------------------------------------------------------

/**
 * `target` may be `{ squadId }`, `{ q, r }`, or a BARE SQUAD-ID STRING — the
 * shipped gameEngine call site passes a bare string and must keep working
 * until the platform lane migrates to the §4 object.
 */
function normaliseTarget(t, target) {
  if (target === null || target === undefined) return { squad: null, hex: null };
  if (typeof target === 'string') return { squad: squadById(t, target), hex: null };
  if (typeof target !== 'object') return { squad: null, hex: null };
  if (target.squadId) return { squad: squadById(t, target.squadId), hex: null };
  if (Number.isFinite(target.q) && Number.isFinite(target.r)) return { squad: null, hex: { q: target.q, r: target.r } };
  return { squad: null, hex: null };
}

/**
 * resolveOrders(t, squadId, moveTo, action, target) -> error string, or null.
 *
 * ORDER OF BUSINESS, and it is load-bearing: everything is VALIDATED against
 * the destination hex before anything is written, so a rejected order leaves
 * the stand exactly where it was and costs it nothing. There is no "undo the
 * displacement" path here because there is never a displacement to undo.
 */
export function resolveOrders(t, squadId, moveTo, action, target) {
  if (!t || t.status !== 'fighting') return 'No engagement is underway';
  if (t.round > t.roundLimit) return 'The engagement is called; no further orders are taken';
  // A DECIDED ENGAGEMENT TAKES NO FURTHER ORDERS. Without this the last
  // section standing keeps being handed activations after the other side has
  // been swept off the board: it marches, digs and burns rounds against an
  // empty field, and every one of those activations is a state change the
  // platform has to persist for a battle whose result is already fixed. The
  // platform seals `status` to 'done' in the same request that reads
  // battleResult, so this is what holds the line inside the request.
  if (battleResult(t)) return 'The engagement is decided; no further orders are taken';
  const sq = activeFormation(t);
  if (!sq || sq.id !== squadId) return "It is not that section's turn";
  // A malformed destination is REJECTED, never quietly ignored: reading
  // { q: undefined } as "no move asked for" would resolve the order from the
  // hex the section is standing on and report success for an order the client
  // never gave.
  const asked = !!moveTo && typeof moveTo === 'object';
  if (asked && (!Number.isFinite(moveTo.q) || !Number.isFinite(moveTo.r))) return 'That ground is off the field';
  const wantsMove = asked && (moveTo.q !== sq.q || moveTo.r !== sq.r);
  const marching = !action || action === MARCH;
  if (marching && !wantsMove) return 'The section awaits an order';
  const act = marching ? MARCH_ACTION : SQUAD_ACTIONS[action];
  if (!act) return 'The Ministry issues no such order';
  const d = derivedOf(sq);
  if (!marching && d.actions.indexOf(action) === -1) return 'That section is not trained to that order';

  const aim = normaliseTarget(t, target);

  // A broken section answers no firing order. It may be told to stand, and
  // its activation is spent trying to come back to hand — or running.
  if (sq.status.routed) {
    if (act.uses !== null) return 'The section is broken and will not answer a firing order';
    return resolveRout(t, sq, d);
  }
  // A section at work is at work. It may not fire, it may not start a second
  // work, AND IT MAY NOT WALK AWAY — without that last clause a pioneer
  // section could break ground on one hex, march eight hexes, and have the
  // bunker appear under its feet where it stopped, because endRound writes the
  // work at wherever the section is standing when the count runs out.
  if (sq.status.building && (act.uses !== null || act.builds || wantsMove)) {
    return 'The section is at work and cannot be spared';
  }
  if (isGrounded(t, sq) && (act.uses !== null || wantsMove)) {
    return 'The weather holds the machine on the ground';
  }

  // ---- movement -----------------------------------------------------------
  let path = null;
  if (wantsMove) {
    if (act.noMove) return 'That order requires the section to stand fast';
    // ONE question, asked once, answered with the true reason. This used to be
    // three checks here and a fourth inside canOccupy whose answer was
    // reported as 'That ground is already held' — so a hull refused a trench
    // was told a section was standing in it. See `occupiable`.
    const refusal = occupiable(t, sq, moveTo.q, moveTo.r);
    if (refusal) return refusal;
    path = pathCost(t.field, { q: sq.q, r: sq.r }, moveTo, { blocked: occupiedKeys(t, sq.id) });
    if (!path) return 'No passable route to that ground';
    if (path.cost > speedOf(t, sq, d)) return "Beyond the section's march allowance";
  }
  const at = wantsMove ? { q: moveTo.q, r: moveTo.r } : { q: sq.q, r: sq.r };

  // ---- the order, validated from where it will be given -------------------
  const aoe = act.aoe;
  const staff = squadStaffMods(sq.specialists);
  let aimHex = null;
  if (act.builds) {
    const work = DEPLOYABLES[act.builds];
    // `at` is either the hex the section is standing on or the destination
    // `occupiable` has just passed, so the tile exists by construction.
    const tile = t.field.tiles[keyOf(at.q, at.r)];
    if (tile.work) return 'The ground here is already worked';
    if (work.infantryOnly && !isFoot(sq.type)) return 'No crew raises that work';
  } else if (act.uses !== null || aoe) {
    if (aoe) {
      aimHex = aim.hex || (aim.squad ? { q: aim.squad.q, r: aim.squad.r } : null);
      if (!aimHex) return 'That order needs a hex to fall on';
      if (!tileAt(t, aimHex.q, aimHex.r)) return 'That ground is off the field';
    } else {
      if (!aim.squad) return 'No such section is on the field';
      if (aim.squad.id === sq.id) return 'A section does not fire on itself';
      if (aim.squad.side === sq.side) return 'A section does not fire on its own side';
      aimHex = { q: aim.squad.q, r: aim.squad.r };
    }
    const reach = rangeOf(t, sq, d, act);
    if (hexDistance(at, aimHex) > reach) return 'The target lies beyond effective range';
    if (!act.indirect && !lineOfSight(t.field, at, aimHex)) return 'No sight line to the target';
  }

  // ---- commit -------------------------------------------------------------
  const fx = {
    seq: (t.fx && t.fx.seq ? t.fx.seq : 0) + 1,
    round: t.round,
    actorId: sq.id,
    action: marching ? MARCH : action,
    dealt: 0,
    taken: 0,
    moved: wantsMove,
    from: { q: sq.q, r: sq.r },
  };
  if (wantsMove) {
    // pathCost returns the whole route including both ends, and a march is
    // only reached when the destination differs from the start, so the route
    // is at least two hexes and the penultimate one always exists. The facing
    // is the LAST STEP, not the whole displacement: a section that walks round
    // a wood ends up looking the way it was walking.
    sq.facing = directionIndex(path.path[path.path.length - 2], at);
    sq.q = at.q; sq.r = at.r;
  }
  // The order's own guard replaces whatever the section was holding from its
  // last activation — a section that gets up and walks is no longer dug in.
  sq.status.guard = act.guard;

  if (act.builds) {
    const work = DEPLOYABLES[act.builds];
    const turns = Math.max(1, work.buildTurns - staff.buildSpeed);
    sq.status.building = { work: act.builds, turnsLeft: turns };
    fx.at = { q: sq.q, r: sq.r };
    t.log.push(`${sq.name} breaks ground — ${work.label.toLowerCase()}, ${turns} turn${turns === 1 ? '' : 's'} of work.`);
  } else if (act.screenTurns > 0 && aimHex) {
    // THE SCREEN IS THE ORDER'S OWN RADIUS. Lane A declares
    // `smoke.aoe = { radius: 1, falloff: 0 }` and this branch screened the
    // impact hex alone, so a content field that reads as a rule had no effect
    // on the board at all — the radius was load-bearing only for routing the
    // order down the hex-target branch, which is the worst kind of half-used:
    // it looks read. Numbers live in one place (drift guard 7), and this is
    // the place that reads this one.
    const cloud = aoe ? hexRange(t.field, aimHex, aoe.radius) : [aimHex];
    for (const hx of cloud) layScreen(t, hx, act.screenTurns);
    fx.at = { q: aimHex.q, r: aimHex.r };
    t.log.push(`${sq.name} puts smoke onto ${aimHex.q},${aimHex.r}. Sight dies in ${cloud.length} hex${cloud.length === 1 ? '' : 'es'}.`);
  } else if (aoe && aimHex) {
    fx.at = { q: aimHex.q, r: aimHex.r };
    sq.facing = directionIndex({ q: sq.q, r: sq.r }, aimHex, sq.facing);
    // The DAMAGE radius is the order's own. `staff.aoeSuppress` widens the
    // suppression ring below, never this — see suppressRing.
    const victims = t.squads
      .filter((x) => hexDistance(x, aimHex) <= aoe.radius)
      .map((x) => ({ sq: x, dist: hexDistance(x, aimHex), fall: Math.max(0, 1 - aoe.falloff * hexDistance(x, aimHex)) }))
      .sort((a, b) => a.dist - b.dist || (a.sq.id < b.sq.id ? -1 : 1));
    // THE SHELL WEIGHT IS DIVIDED AMONG THE STANDS IT FINDS, in proportion to
    // what each stand's distance from the burst earns it. One stand under a
    // grenade takes the whole of it; eight stands under a bombard share it.
    //
    // This is the correction that made the engine neutral. Applying the
    // order's full resolved effect to EVERY stand in the radius multiplies a
    // burst by its own area — a bombard reached ten times its direct-fire
    // output — and measured over forty scripted battles between identical
    // orders of battle, one siege piece a side took the win rate to 32-8 and
    // a four-to-one figure count. Normalising the aggregate to the same
    // effect the order would have had on a single stand puts the whole of an
    // AoE order's advantage back where SQUAD_ACTIONS prices it: reach,
    // indirect fire, suppression on every stand under it, and a morale test
    // each. What the engine must not do is invent a damage multiplier that
    // no content table declares.
    const share = victims.reduce((sum, v) => sum + (v.sq.figures > 0 ? v.fall : 0), 0);
    // THE CREW AS IT WAS WHEN THE ORDER WAS GIVEN. A burst can catch its own
    // firer — friendly stands under it are struck, and a stand at the impact
    // hex is the nearest of them, so it is resolved first — and the resolved
    // effect is drawn from the FIRER's derived output, which falls to nothing
    // when its last figure goes. Without this snapshot a battery that killed
    // itself with its own bombardment stopped the same shell dead for every
    // other stand under it: measured, a mutual burst reported '0 figures
    // down, 1 of our own with them'. The shell is already in the air.
    const shooter = { ...sq };
    let primary = null;
    for (const v of victims) {
      if (v.sq.figures <= 0) continue;
      const falloff = share > 0 ? v.fall / share : 0;
      const hit = strike(t, shooter, act, v.sq, falloff);
      if (v.sq.side === sq.side) fx.taken += hit.figures; else fx.dealt += hit.figures;
      const result = afterHit(t, shooter, act, v.sq, hit);
      if (!primary && v.sq.side !== sq.side) {
        primary = v.sq;
        fx.targetId = v.sq.id;
        if (hit.facing) fx.facing = hit.facing;
        if (result) fx.moraleResult = result;
      }
    }
    // The order's own burst radius PLUS the mod: `aoeSuppress` is hexes ADDED
    // to the suppress radius, so for an area order the ring starts where the
    // damage stops. Handing it the bare mod would have made the ring a subset
    // of the stands the burst already struck, i.e. always empty.
    const ring = suppressRing(t, shooter, act, aimHex, new Set(victims.map((v) => v.sq.id)), aoe.radius + staff.aoeSuppress);
    t.log.push(`${sq.name} — ${act.label.toLowerCase()} onto ${aimHex.q},${aimHex.r}: ${fx.dealt} figure${fx.dealt === 1 ? '' : 's'} down` + (fx.taken ? `, ${fx.taken} of our own with them.` : '.'));
    if (ring.length) t.log.push(`The fall of shot pins ${ring.length} more section${ring.length === 1 ? '' : 's'} around ${aimHex.q},${aimHex.r}.`);
  } else if (act.uses !== null && aim.squad) {
    const victim = aim.squad;
    fx.targetId = victim.id;
    sq.facing = directionIndex({ q: sq.q, r: sq.r }, { q: victim.q, r: victim.r }, sq.facing);
    const hit = strike(t, sq, act, victim);
    fx.dealt = hit.figures;
    // THE PLATE THE SHOT LANDED ON, reported to the client rather than kept
    // internal. `strike` already selected it — the engine cannot resolve a hit
    // on a hull WITHOUT selecting one — and a facing that only ever reaches
    // the log as an English phrase is a rule Lane E can neither draw nor
    // verify. Present only when the struck stand carried `facings`: an
    // infantry section has one armour class and no plate to name.
    if (hit.facing) fx.facing = hit.facing;
    const result = afterHit(t, sq, act, victim, hit);
    if (result) fx.moraleResult = result;
    const where = hit.facing ? ` on the ${hit.facing}` : '';
    t.log.push(`${sq.name} — ${act.label.toLowerCase()} on ${victim.name}${where}: ${hit.figures} figure${hit.figures === 1 ? '' : 's'} down.`);
    // Point fire gets a ring too, and this is the case the mod was written
    // for: an automatic rifle laid on one section makes the hexes beside it
    // unusable as well. `victim` may have been wiped by the strike, so the
    // ring is measured from the hex the order fell on, not from the stand.
    const ring = suppressRing(t, sq, act, { q: aimHex.q, r: aimHex.r }, new Set([victim.id]), staff.aoeSuppress);
    if (ring.length) t.log.push(`The belt walks on and pins ${ring.length} more section${ring.length === 1 ? '' : 's'}.`);
  } else if (action === 'rally') {
    const result = moraleTest(t, sq, { rallying: true });
    if (result === 'held') {
      sq.status.suppressed = 0;
      t.log.push(`${sq.name} is taken in hand and answers again.`);
    } else {
      t.log.push(`${sq.name} will not be moved from the ground it is on.`);
    }
    fx.moraleResult = result === 'held' ? 'held' : 'suppressed';
  } else if (marching) {
    t.log.push(`${sq.name} advances on the ground ahead.`);
  } else {
    t.log.push(`${sq.name} ${action === 'entrench' ? 'goes to ground where it stands' : 'holds its ground'}.`);
  }

  t.fx = fx;
  if (t.log.length > COMBAT.logKeep) t.log = t.log.slice(-COMBAT.logKeep);
  advanceQueue(t);
  return null;
}

/**
 * A broken section's activation. It tries to come back to hand first — a
 * rally test at MORALE_MODS.rallying — and runs for its own board edge if it
 * cannot. It never fires, and the queue advances either way, so a rout costs
 * exactly one activation and is recoverable rather than terminal.
 */
function resolveRout(t, sq, d) {
  const fx = {
    seq: (t.fx && t.fx.seq ? t.fx.seq : 0) + 1,
    round: t.round,
    actorId: sq.id,
    action: 'rally',
    dealt: 0,
    taken: 0,
    moved: false,
    from: { q: sq.q, r: sq.r },
  };
  const result = moraleTest(t, sq, { rallying: true });
  if (result === 'held') {
    sq.status.routed = false;
    sq.status.suppressed = Math.max(sq.status.suppressed, MORALE_MODS.suppressedTurns);
    fx.moraleResult = 'held';
    t.log.push(`${sq.name} is rallied on the spot and faces front.`);
  } else {
    const home = sq.side === 'attacker' ? 0 : t.field.w - 1;
    // A broken section runs at its full pace. There is deliberately no knob
    // here: a constant set to 1 is a rule nobody can see and nobody tested.
    const budget = Math.max(1, speedOf(t, sq, d));
    const dest = fleeHex(t, sq, home, budget);
    fx.moraleResult = 'routed';
    if (dest) {
      sq.facing = directionIndex({ q: sq.q, r: sq.r }, dest, sq.facing);
      sq.q = dest.q; sq.r = dest.r;
      fx.moved = true;
      fx.at = { q: dest.q, r: dest.r };
      t.log.push(`${sq.name} falls back on its own line and will not be halted.`);
    } else {
      t.log.push(`${sq.name} cowers where it stands.`);
    }
  }
  sq.status.guard = 1;
  t.fx = fx;
  if (t.log.length > COMBAT.logKeep) t.log = t.log.slice(-COMBAT.logKeep);
  advanceQueue(t);
  return null;
}

/** The reachable hex nearest the stand's own board edge. */
function fleeHex(t, sq, homeCol, budget) {
  const blocked = occupiedKeys(t, sq.id);
  let best = null;
  for (const hx of hexRange(t.field, { q: sq.q, r: sq.r }, budget)) {
    if (hx.q === sq.q && hx.r === sq.r) continue;
    if (!canOccupy(t, sq, hx.q, hx.r)) continue;
    const gap = Math.abs(hx.q - homeCol);
    if (gap >= Math.abs(sq.q - homeCol)) continue;
    const p = pathCost(t.field, { q: sq.q, r: sq.r }, hx, { blocked });
    if (!p || p.cost > budget) continue;
    if (!best || gap < best.gap || (gap === best.gap && p.cost < best.cost)) best = { hx, gap, cost: p.cost };
  }
  return best ? best.hx : null;
}

/** Lay a temporary LOS screen, remembering the ground it stands on. */
function layScreen(t, hex, turns) {
  // Unguarded on purpose: resolveOrders refuses an aim point off the field
  // before it ever gets here, so a missing tile would be a corrupted battle.
  const tile = t.field.tiles[keyOf(hex.q, hex.r)];
  const held = t.screens.find((s) => s.q === hex.q && s.r === hex.r);
  if (held) { held.turns = Math.max(held.turns, turns); return; }
  t.screens.push({ q: hex.q, r: hex.r, turns, was: tile.blocksLOS });
  tile.blocksLOS = true;
}

/**
 * Which of the six HEX_DIRECTIONS points from `a` toward `b`. Lane A's list is
 * in Lane B's neighbour order, so a facing index means the same thing in both
 * files. Falls back to the stand's current facing when the two hexes are the
 * same or the step is not a single axial direction.
 */
function directionIndex(a, b, fallback) {
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    if (HEX_DIRECTIONS[i].q === dq && HEX_DIRECTIONS[i].r === dr) return i;
  }
  let best = fallback === undefined ? 0 : fallback;
  let bestGap = Infinity;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const step = { q: a.q + HEX_DIRECTIONS[i].q, r: a.r + HEX_DIRECTIONS[i].r };
    const gap = hexDistance(step, b);
    if (gap < bestGap) { bestGap = gap; best = i; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// 10. The staff AI
// ---------------------------------------------------------------------------

/**
 * autoOrders(t, sq) -> { moveTo, actionKey, targetId, target }
 *
 * The shipped seam destructures `moveTo`, `actionKey` and `targetId`; `target`
 * is the §4 object form, returned additionally so the platform may pass
 * either. Deterministic — every choice is an argmax with an explicit
 * tie-break, and no draw is taken.
 *
 * BOTH KEYS ALWAYS DESCRIBE A LEGAL ORDER. `targetId` is a squad id whenever
 * the order takes a target at all — including an area order, which reports
 * the true aim point on `target` and a stand under the burst on `targetId` —
 * because the shipped seam passes `targetId` and nothing else. The only
 * orders that carry neither are the ones resolveOrders never reads a target
 * for: `hold`, the march, and `build_*`.
 *
 * Doctrine, in order:
 *   0. a broken section is never given a firing order;
 *   1. a section already at work stands to it;
 *   2. a sapper with no enemy inside its reach raises a work;
 *   3. an AoE order goes onto the hex covering the most enemy stands, when
 *      that is two or more, no friend is under it, and one of them can be
 *      NAMED to the shipped seam (see the note at that branch);
 *   4. otherwise the hardest order that reaches a target from here;
 *   5. otherwise close, PREFERRING THE HIGHEST-COVER hex that puts a target
 *      in range and sight;
 *   6. otherwise advance on the nearest enemy and hold.
 */
export function autoOrders(t, sq) {
  if (!sq) return null;
  const d = derivedOf(sq);
  const foes = t.squads
    .filter((x) => x.side !== sq.side)
    .sort((a, b) => hexDistance(sq, a) - hexDistance(sq, b) || (a.id < b.id ? -1 : 1));
  if (foes.length === 0) return null;
  const hold = { moveTo: null, actionKey: 'hold', targetId: null, target: null };
  if (sq.status.routed || sq.status.building) return hold;
  if (isGrounded(t, sq)) return hold;

  const damaging = d.actions.filter((k) => SQUAD_ACTIONS[k].uses !== null);
  const staff = squadStaffMods(sq.specialists);
  const here = { q: sq.q, r: sq.r };

  // 2. build when nothing is in reach
  const builds = d.actions.filter((k) => SQUAD_ACTIONS[k].builds);
  if (builds.length > 0) {
    const reach = rangeOf(t, sq, d, SQUAD_ACTIONS.fire);
    const engaged = foes.some((f) => hexDistance(sq, f) <= reach);
    const tile = tileAt(t, sq.q, sq.r);
    if (!engaged && tile && !tile.work) {
      let best = null;
      for (const k of builds) {
        const work = DEPLOYABLES[SQUAD_ACTIONS[k].builds];
        if (work.infantryOnly && !isFoot(sq.type)) continue;
        if (!best || work.cover > DEPLOYABLES[SQUAD_ACTIONS[best].builds].cover) best = k;
      }
      if (best) return { moveTo: null, actionKey: best, targetId: null, target: { q: sq.q, r: sq.r } };
    }
  }

  // 3. AoE onto a cluster
  let cluster = null;
  for (const k of damaging) {
    const act = SQUAD_ACTIONS[k];
    if (!act.aoe) continue;
    // The DAMAGE radius, not the suppression ring: the staff picks the hex
    // that puts the most stands under the burst, and the ring is a bonus it
    // does not aim for. (This read `+ staff.aoeSuppress` while the resolver
    // did too, so the AI and the resolver were wrong in step — which is
    // exactly why neither one showed it.)
    const radius = act.aoe.radius;
    const reach = rangeOf(t, sq, d, act);
    for (const hx of hexRange(t.field, here, reach)) {
      if (!act.indirect && !lineOfSight(t.field, here, hx)) continue;
      const under = t.squads.filter((x) => hexDistance(x, hx) <= radius);
      const enemies = under.filter((x) => x.side !== sq.side);
      if (enemies.length < 2 || under.length > enemies.length) continue;
      // THE SAME ORDER IN BOTH THE FORMS THE PLATFORM CAN PASS. The shipped
      // seam (`gameEngine`'s runAutoTurns) hands `o.targetId` to
      // resolveOrders, so a burst that reported only `target: { q, r }` was
      // refused by the platform's own call — 'That order needs a hex to fall
      // on' — and the `break` ended the whole auto run inside round one, the
      // first time any section was issued a barrage. So the staff also NAMES
      // a stand under the burst that the same order could legally have been
      // fired at directly. `target` still carries the true aim point; the id
      // is the seam's degraded but LEGAL reading of it, and a candidate hex
      // that cannot be named this way is not offered at all, so the two forms
      // never disagree about whether the order is legal.
      const named = enemies
        .filter((x) => hexDistance(here, x) <= reach
          && (act.indirect || lineOfSight(t.field, here, { q: x.q, r: x.r })))
        .sort((a, b) => hexDistance(a, hx) - hexDistance(b, hx) || (a.id < b.id ? -1 : 1))[0];
      if (!named) continue;
      const score = enemies.length * 100 - hexDistance(here, hx);
      if (!cluster || score > cluster.score) cluster = { score, key: k, hex: hx, named };
    }
  }
  if (cluster) {
    return {
      moveTo: null,
      actionKey: cluster.key,
      targetId: cluster.named.id,
      target: { q: cluster.hex.q, r: cluster.hex.r },
    };
  }

  // 4. shoot from where we stand
  const seen = new Map();
  const shot = bestShot(t, sq, d, damaging, here, foes, staff.aoeSuppress, seen);
  if (shot) return { moveTo: null, actionKey: shot.key, targetId: shot.foe.id, target: { squadId: shot.foe.id } };

  // 5. close, preferring cover
  const speed = speedOf(t, sq, d);
  if (speed > 0) {
    const blocked = occupiedKeys(t, sq.id);
    let best = null;
    for (const hx of hexRange(t.field, here, speed)) {
      if (hx.q === sq.q && hx.r === sq.r) continue;
      if (!canOccupy(t, sq, hx.q, hx.r)) continue;
      const p = pathCost(t.field, here, hx, { blocked });
      if (!p || p.cost > speed) continue;
      const from = { q: hx.q, r: hx.r };
      const opening = bestShot(t, sq, d, damaging, from, foes, staff.aoeSuppress, seen, true);
      const tile = tileAt(t, hx.q, hx.r);
      const cover = tile.cover + (tile.work ? DEPLOYABLES[tile.work].cover : 0);
      const gap = hexDistance(from, foes[0]);
      const score = (opening ? 10000 : 0) + cover * 100 - gap * 10 - p.cost;
      if (!best || score > best.score) best = { score, hx: from, opening };
    }
    if (best && best.opening) {
      return { moveTo: best.hx, actionKey: best.opening.key, targetId: best.opening.foe.id, target: { squadId: best.opening.foe.id } };
    }
    if (best) return { moveTo: best.hx, actionKey: MARCH, targetId: null, target: null };
  }
  return hold;
}

/**
 * WHAT AN ORDER IS WORTH, priced in ENEMY OUTPUT REMOVED THIS ACTIVATION.
 *
 * The staff used to rank an order by `source * act.dmg`, i.e. by raw damage
 * alone, and that scoring had two consequences it is worth naming because
 * both look like content bugs from the outside:
 *
 *   * SUPPRESSING FIRE WAS NEVER ISSUED. It is priced at dmg 0.5 against
 *     aimed fire's 1.0 precisely BECAUSE its value is the pin rather than the
 *     casualty, so a scorer that reads only `dmg` rejects it every single
 *     time. Measured across forty auto battles before this change, the gunner
 *     sections — the only sections in an auto-carved order of battle that
 *     have the order at all — issued it zero times, which also left the heavy
 *     gunner's suppression ring firing in 2 battles of 40.
 *   * A RIFLE SECTION WOULD EMPTY ITSELF INTO A HULL. `dmg` knows nothing
 *     about armour, so the staff rated a volley at a heavy crawler exactly as
 *     it rated the same volley at the infantry beside it, and the mult:0 row
 *     drift guard 12 insists on was invisible to every decision that mattered.
 *
 * Both are the same defect: the scorer read a number that TRAVELS WITH the
 * thing it wanted rather than the thing itself. What the staff actually wants
 * is the enemy output this activation takes off the board. That has two
 * terms, and both are priced in the same unit — OUTPUT DENIED FOR THE REST OF
 * THE ENGAGEMENT — because a model that priced them differently would need an
 * exchange rate between them, and an invented constant is the one thing this
 * file is not allowed to author:
 *
 *   KILL  the figures the order is expected to remove, times what a figure of
 *         that stand is worth, TIMES THE ROUNDS LEFT ON THE CLOCK. A figure
 *         taken off the board is denied for every round that follows, and
 *         that is the whole difference between killing and pinning. Expected
 *         figures come from Lane A's resolveSquadHit — the same pure,
 *         seedless call the resolver makes — over the same per-figure
 *         toughness `strike` divides by. Cover and guard are deliberately
 *         left out: the staff estimates, it does not roll, and it does not
 *         know the swing.
 *   PIN   the output denied while the stand is suppressed: the ADDITIONAL
 *         turns the order's weight buys over what the stand is already
 *         carrying (suppression takes the longer of the two, so re-pinning a
 *         pinned section buys nothing and is scored at nothing), times the
 *         1 - COMBAT.suppressedOutput the stand loses, times its whole
 *         output — and times the stands the suppression ring reaches beyond
 *         it. Without the clock on the kill term this alone decided: a rifle
 *         section beside a land fort it could not scratch preferred to pin
 *         forty points of hull output for one round over killing a rifleman
 *         for twenty, and walked past the infantry every time.
 *
 * A zero-effect hit therefore scores its PIN and nothing else, which is
 * exactly the behaviour drift guard 12 describes: the rifle section cannot
 * mark the hull, so it stops trying to kill it and starts pinning its crew —
 * or turns to a target it can hurt, if one is in reach.
 *
 * THE PLATE IS THE ONE THE STAND CAN SEE FROM WHERE IT IS NOW, not the one it
 * would strike after the march it is considering. That is an approximation
 * and it is named as one: the staff appreciates a hull from where it stands,
 * and does not plan a drive round the back of it. Making it exact would mean
 * re-deriving the facing for every candidate hex, which is the sweep the memo
 * below exists to avoid.
 *
 * `seen` is a per-decision memo. bestShot is asked about every reachable hex
 * when the staff is choosing where to walk; with the plate fixed as above the
 * answer for a given (foe, order) is the same from all of them, so the memo
 * turns an O(hexes x foes x orders) sweep back into an O(foes x orders) one.
 */
function orderValue(t, sq, d, act, foe, extra, seen) {
  const overhead = isOverhead(sq, act);
  const armourKey = armourKeyOf(t, foe, { q: sq.q, r: sq.r }, overhead);
  const memo = `${foe.id}|${act.key}|${armourKey}`;
  if (seen.has(memo)) return seen.get(memo);
  const fd = derivedOf(foe);
  const hit = resolveSquadHit({ attacker: sq, action: act, targetArmour: armourKey, targetDerived: fd });
  const output = fd.melee + fd.ranged;
  const perFigure = COMBAT.toughnessBase + COMBAT.toughnessPerArmor * fd.armor;
  const left = Math.max(1, t.roundLimit - t.round + 1);
  const kill = (hit.effective / perFigure) * (output / Math.max(1, fd.figures)) * left;
  const turns = Math.floor(suppressWeightOf(t, sq, act, hit.suppressOnly) + COMBAT.suppressRound);
  const gained = Math.max(0, turns - foe.status.suppressed);
  // The stands the ring would ADD, counted the way `suppressRing` actually
  // lays it. This used to count every stand within `extra` of the target
  // REGARDLESS OF SIDE, so the shooter's own body and its own sections raised
  // the value of the shot — a friendly stand caught in the ring is a COST, and
  // the firer is not in its own ring at all. The side test covers the firer
  // too, so there is deliberately no separate identity check to go stale.
  const ring = extra > 0
    ? t.squads.filter((x) => x.id !== foe.id && x.side !== sq.side
      && hexDistance(x, foe) <= extra).length
    : 0;
  const pin = gained * (1 - COMBAT.suppressedOutput) * output * (1 + ring);
  const value = kill + pin;
  seen.set(memo, value);
  return value;
}

/**
 * The most valuable order that reaches a foe from `from`, or null.
 *
 * `moving` means the shot would be taken AFTER a march, and it excludes every
 * `noMove` order — an omission that was latent here until the scorer above
 * started choosing suppressing fire. Step 5 would pair a destination with
 * SQUAD_ACTIONS.suppress, resolveOrders would refuse it with 'that order
 * requires the section to stand fast', and autoResolveRemainder would stop
 * the whole battle on the rejection. Nothing showed it while `dmg` alone
 * decided, because the only non-area noMove order in the table is the one
 * that scoring could never pick. Step 4 has already tried standing and
 * firing by the time step 5 runs, so nothing is lost by dropping them here.
 */
function bestShot(t, sq, d, damaging, from, foes, extra, seen, moving) {
  let best = null;
  for (const k of damaging) {
    const act = SQUAD_ACTIONS[k];
    if (act.aoe) continue;
    if (moving && act.noMove) continue;
    const reach = rangeOf(t, sq, d, act);
    for (const foe of foes) {
      const at = { q: foe.q, r: foe.r };
      if (hexDistance(from, at) > reach) continue;
      if (!act.indirect && !lineOfSight(t.field, from, at)) continue;
      // The hex gap breaks ties without ever outweighing the value: two
      // orders worth the same take the nearer target.
      const score = orderValue(t, sq, d, act, foe, extra, seen) * 100 - hexDistance(from, at);
      if (!best || score > best.score) best = { score, key: k, foe };
    }
  }
  return best;
}

/**
 * autoResolveRemainder(t, side, maxTurns) -> activations resolved.
 *
 * The one export this lane adds (§4 amendment Q7 permits a superset; nothing
 * frozen is removed or re-signatured). `side` may be 'attacker', 'defender',
 * or null for both — it stops rather than issuing orders for a commander who
 * is still holding the field himself.
 */
export function autoResolveRemainder(t, side, maxTurns = 200) {
  let n = 0;
  while (n < maxTurns) {
    if (!t || t.status !== 'fighting') break;
    if (battleResult(t)) break;
    const sq = activeFormation(t);
    if (!sq) break;
    if (side && sq.side !== side) break;
    // ONE totality guard, and it is UNREACHABLE while the two properties
    // beside it hold: autoOrders answers for every stand whose side still has
    // an enemy on the board (and `battleResult` above has already stopped the
    // loop if it does not), and resolveOrders accepts every order autoOrders
    // issues. Both are asserted directly — section 17 walks six whole battles
    // and fails on a null order or on a refused one — which is the honest way
    // to keep a branch a test cannot drive: prove the property that makes it
    // unreachable, rather than write a comment claiming it is.
    //
    // It is not decoration. When step 2's scorer first learned to value
    // suppressing fire, autoOrders began pairing a march with a `noMove`
    // order, resolveOrders refused it, and THIS BREAK is what turned an
    // infinite loop of rejected orders into a battle that stopped in round 1
    // — which is how the defect was found at all.
    const o = autoOrders(t, sq);
    if (!o || resolveOrders(t, sq.id, o.moveTo, o.actionKey, o.target)) break;
    n++;
  }
  return n;
}

// ---------------------------------------------------------------------------
// 11. Result and view
// ---------------------------------------------------------------------------

/**
 * null while the fight continues; otherwise exactly three keys. Survivors fold
 * back through Lane A's toRegiments, which rounds DOWN, so a battle never
 * creates a company. Figures still in the depot were never carved into
 * sections and do not fold back — the same as the shipped engine, and flagged
 * to the platform lane rather than changed here.
 */
export function battleResult(t) {
  if (!t || t.status !== 'fighting') return null;
  const att = t.squads.filter((s) => s.side === 'attacker');
  const def = t.squads.filter((s) => s.side === 'defender');
  let attackerWon = null;
  if (def.length === 0) attackerWon = att.length > 0;
  else if (att.length === 0) attackerWon = false;
  else if (t.round > t.roundLimit) attackerWon = holdingPower(att) > holdingPower(def);
  if (attackerWon === null) return null;
  return { attackerWon, attackerUnits: toRegiments(att), defenderUnits: toRegiments(def) };
}

/** What a side still has on the field, when the clock decides the battle. */
function holdingPower(list) {
  let sum = 0;
  for (const sq of list) {
    const d = derivedOf(sq);
    sum += d.melee + d.ranged + d.figures * d.armor;
  }
  return sum;
}

/**
 * tacticalView(t, myRole) -> the §4 getState payload and nothing else.
 *
 * `field` carries `meta` (the addendum's requirement): lineOfSight reads
 * meta.losCap and throws without it, so a client that renders sight lines
 * needs it, and a silent default would be an invisible rules change.
 *
 * `relicProject` and `fx.facing` are amendment C2, and both exist for the same
 * reason: `test/fixtures/tactical-state.json` IS this payload, and it is the
 * only description of the battle Lanes D and E have. A slot or a plate that
 * the server knows and the payload does not is a shape they cannot render,
 * cannot test against, and would have to re-cut the day it matters.
 */
export function tacticalView(t, myRole) {
  const fighting = t.status === 'fighting';
  const active = activeFormation(t);
  const mineActive = !!active && active.side === myRole;
  return {
    status: t.status,
    round: t.round,
    roundLimit: t.roundLimit,
    myRole: myRole || null,
    deployed: t.deployed,
    myPool: myRole ? t.pools[myRole] : null,
    // THE PER-FACTION RELIC SLOT, shipped to the client rather than kept as
    // engine state. Nothing reads or writes it until boarding assaults land
    // as a Field Amendment, so it is `{ attacker: null, defender: null }` on
    // every board today — but the fixture Lanes D and E build against IS this
    // payload, byte for byte, and a slot that exists only on the server is a
    // shape they would have to re-cut the day it is filled. `||` because a
    // battle persisted before the slot was cut carries no relicProject at
    // all, and the view's key set is a contract: a missing key is a different
    // payload, not an empty one. A test deletes the slot and drives it.
    relicProject: t.relicProject || { attacker: null, defender: null },
    field: t.field,
    activeId: fighting && active ? active.id : null,
    queue: fighting ? t.queue.slice(t.qIndex).concat(t.queue.slice(0, t.qIndex)) : [],
    squads: t.squads.map((sq) => {
      const d = derivedOf(sq);
      const status = { suppressed: sq.status.suppressed, routed: sq.status.routed, guard: sq.status.guard };
      if (sq.status.building) status.building = { work: sq.status.building.work, turnsLeft: sq.status.building.turnsLeft };
      return {
        id: sq.id,
        side: sq.side,
        name: sq.name,
        type: sq.type,
        figures: sq.figures,
        maxFigures: sq.maxFigures,
        specialists: sq.specialists.slice(),
        q: sq.q,
        r: sq.r,
        facing: sq.facing,
        armour: sq.facings ? sq.facings.front : armourKeyOf(t, sq, { q: sq.q, r: sq.r }, false),
        status,
        melee: d.melee,
        ranged: d.ranged,
        range: d.range,
        armor: d.armor,
        speed: d.speed,
        morale: d.morale,
        initiative: d.initiative,
        pts: d.pts,
        actions: sq.side === myRole ? d.actions.slice() : [],
        mine: sq.side === myRole,
      };
    }),
    los: mineActive ? visibleFrom(t, active) : [],
    log: t.log.slice(-COMBAT.logShown),
    fx: t.fx,
  };
}

/** Hexes the stand can see, out to its own reach. */
function visibleFrom(t, sq) {
  const d = derivedOf(sq);
  const here = { q: sq.q, r: sq.r };
  const out = [];
  for (const hx of hexRange(t.field, here, d.range)) {
    if (lineOfSight(t.field, here, hx)) out.push({ q: hx.q, r: hx.r });
  }
  return out;
}
