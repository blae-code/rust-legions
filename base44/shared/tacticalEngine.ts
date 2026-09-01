// ---------------------------------------------------------------------------
// Tactical battle state machine — server authority. Pure functions over the
// battle object stored at game.activeBattle.tactical. gameEngine owns
// persistence, auth and the macro-map consequences; this owns the fight.
// ---------------------------------------------------------------------------
import {
  TROOP_KEYS, ACTIONS, CASUALTY_ORDER, COLUMN_KEYS,
  deriveFormation, formationSize, hexDistance, poolCost, toRegiments,
} from './tactical.ts';

export const GRID = { w: 9, h: 7 };
export const ROUND_LIMIT = 20;
const MAX_FORMATIONS = 10;

const tid = () => Math.random().toString(36).slice(2, 9);
const clone = (o) => JSON.parse(JSON.stringify(o));
const inGrid = (q, r) => q >= 0 && q < GRID.w && r >= 0 && r < GRID.h;
const occupied = (t, q, r, exceptId) => t.formations.some((f) => f.q === q && f.r === r && f.id !== exceptId);

// Front-line hexes for a side: attacker on the west edge, defender on the east
function deployHexes(side) {
  const out = [];
  const cols = side === 'attacker' ? [0, 1] : [GRID.w - 1, GRID.w - 2];
  for (const q of cols) for (let r = 0; r < GRID.h; r++) out.push({ q, r });
  return out;
}

export function createTactical(attackerUnits, defenderUnits) {
  return {
    status: 'deploy', grid: { ...GRID }, round: 1, roundLimit: ROUND_LIMIT,
    qIndex: 0, queue: [], formations: [],
    pools: { attacker: clone(attackerUnits || {}), defender: clone(defenderUnits || {}) },
    deployed: { attacker: false, defender: false },
    log: ['The field is surveyed. Both staffs draw up their order of battle.'],
    fx: null,
  };
}

// Validate a submitted order of battle against the side's regiment pool
export function submitFormations(t, side, submitted) {
  if (t.status !== 'deploy') return 'The order of battle is already sealed';
  if (t.deployed[side]) return 'Your order of battle is already filed';
  const list = (submitted || []).filter((f) => formationSize(f.troops) > 0);
  if (list.length === 0) return 'At least one formation must take the field';
  if (list.length > MAX_FORMATIONS) return `No more than ${MAX_FORMATIONS} formations may be fielded`;
  const spent = {};
  for (const f of list) {
    for (const k of TROOP_KEYS) {
      const n = f.troops[k] || 0;
      if (n < 0 || !Number.isInteger(n)) return 'Invalid company count';
    }
    for (const [k, n] of Object.entries(poolCost(f.troops))) spent[k] = (spent[k] || 0) + n;
  }
  for (const k of COLUMN_KEYS) if ((spent[k] || 0) > (t.pools[side][k] || 0)) return `Your force holds no such reserve of ${k}`;

  const hexes = deployHexes(side).filter((h) => !occupied(t, h.q, h.r));
  list.slice(0, hexes.length).forEach((f, i) => {
    const troops = Object.fromEntries(TROOP_KEYS.map((k) => [k, f.troops[k] || 0]).filter(([, n]) => n > 0));
    t.formations.push({
      id: tid(), side, name: (f.name || `${i + 1} Formation`).slice(0, 28),
      troops, q: hexes[i].q, r: hexes[i].r,
      status: { suppressed: 0, marked: 0, guard: 0 },
    });
  });
  t.deployed[side] = true;
  t.log.push(`The ${side === 'attacker' ? 'assault' : 'defending'} staff files its order of battle — ${list.length} formation${list.length === 1 ? '' : 's'} take the field.`);
  if (t.deployed.attacker && t.deployed.defender) {
    t.status = 'fighting';
    buildQueue(t);
    t.log.push('Whistles. The first formations step off.');
  }
  return null;
}

// A staff with no commander present draws up a serviceable order of battle
export function autoFormations(pool = {}) {
  const rifles = pool.riflemen || 0;
  const out = [];
  const gunners = Math.min(Math.floor(rifles / 4), 3);
  const scouts = Math.min(Math.floor(rifles / 6), 2);
  let line = rifles - gunners - scouts;
  const take = (n) => { const x = Math.min(line, n); line -= x; return x; };
  if ((pool.crawler || 0) > 0) out.push({ name: 'Armored Spearhead', troops: { crawler: pool.crawler, riflemen: take(3) } });
  if ((pool.artillery || 0) > 0) out.push({ name: 'Gun Battery', troops: { artillery: pool.artillery, riflemen: take(2) } });
  if ((pool.fighter || 0) > 0) out.push({ name: 'Air Wing', troops: { fighter: pool.fighter } });
  if (gunners > 0 || line > 0) out.push({ name: 'Line Battalion', troops: { riflemen: take(5), gunners } });
  if (scouts > 0) out.push({ name: 'Screening Element', troops: { scouts } });
  while (line > 0) out.push({ name: `${out.length + 1} Reserve Battalion`, troops: { riflemen: take(6) } });
  return out.filter((f) => formationSize(f.troops) > 0);
}

function buildQueue(t) {
  t.queue = t.formations
    .map((f) => ({ id: f.id, init: deriveFormation(f.troops).initiative }))
    .sort((a, b) => b.init - a.init || (a.id < b.id ? -1 : 1))
    .map((x) => x.id);
  t.qIndex = 0;
}

export const activeFormation = (t) =>
  t.status === 'fighting' ? t.formations.find((f) => f.id === t.queue[t.qIndex]) || null : null;

function advanceQueue(t) {
  for (let guard = 0; guard < 64; guard++) {
    t.qIndex++;
    if (t.qIndex >= t.queue.length) {
      t.round++;
      if (t.round > t.roundLimit) return;
      for (const f of t.formations) {
        if (f.status.suppressed > 0) f.status.suppressed--;
        if (f.status.marked > 0) f.status.marked--;
      }
      buildQueue(t);
      t.log.push(`— Round ${t.round} —`);
    }
    if (t.formations.some((f) => f.id === t.queue[t.qIndex])) return;
  }
}

function removeCasualties(troops, n) {
  let left = n;
  for (const k of CASUALTY_ORDER) while (left > 0 && (troops[k] || 0) > 0) { troops[k]--; left--; }
  return n - left;
}

// Resolve one formation's orders. Returns an error string, or null on success.
export function resolveOrders(t, formationId, moveTo, actionKey, targetId) {
  if (t.status !== 'fighting') return 'No battle is underway';
  const f = activeFormation(t);
  if (!f || f.id !== formationId) return "It is not that formation's turn";
  const act = ACTIONS[actionKey];
  if (!act) return 'Unknown order';
  const d = deriveFormation(f.troops);
  if (!d.actions.includes(actionKey)) return 'That formation cannot execute that order';

  const wantsMove = !!moveTo && (moveTo.q !== f.q || moveTo.r !== f.r);
  if (wantsMove) {
    if (act.noMove) return 'That order requires the formation to stand fast';
    if (d.strained && act.requires) return 'An oversized formation cannot displace and execute a special order in the same turn';
    if (!inGrid(moveTo.q, moveTo.r)) return 'That ground is off the field';
    if (occupied(t, moveTo.q, moveTo.r, f.id)) return 'That ground is already held';
    if (hexDistance(f, moveTo) > d.move) return "Beyond the formation's march allowance";
  }

  const fx = { attackerId: f.id, targetId: null, action: actionKey, dealt: 0, taken: 0, moved: wantsMove, from: { q: f.q, r: f.r } };
  if (wantsMove) { f.q = moveTo.q; f.r = moveTo.r; f.status.guard = 0; }

  if (act.self) {
    f.status.guard = act.guard;
    t.log.push(`${f.name} ${actionKey === 'entrench' ? 'breaks ground and digs in' : 'holds its ground'}.`);
  } else {
    const target = t.formations.find((x) => x.id === targetId);
    if (!target) return 'No such target formation';
    if (target.side === f.side) return 'A formation does not fire on its own side';
    const reach = act.reach !== undefined ? act.reach : d.reach;
    if (hexDistance(f, target) > reach) {
      // undo the displacement so a failed order costs nothing
      f.q = fx.from.q; f.r = fx.from.r;
      return 'The target lies beyond effective range';
    }
    fx.targetId = target.id;
    const td = deriveFormation(target.troops);
    let power = d.attack * d.dmgMult * act.dmg;
    if (f.status.suppressed > 0) power *= 0.65;
    if (target.status.marked > 0) power *= 1.25;
    let cover = td.defense * td.defMult * (target.status.guard || 1);
    if (act.pierce) cover *= 1 - act.pierce;
    const swing = 0.85 + Math.random() * 0.3;
    const casualties = Math.max(1, Math.round((power * td.size * swing) / Math.max(cover * 2, 1)));
    fx.dealt = removeCasualties(target.troops, Math.min(casualties, td.size));
    if (act.suppress) target.status.suppressed = act.suppress + 1;
    if (act.mark) target.status.marked = act.mark;
    target.status.guard = 0;
    if (act.recoil && formationSize(target.troops) > 0) {
      const back = Math.max(1, Math.round((td.defense * act.recoil * d.size) / Math.max(d.defense * d.defMult, 1)));
      fx.taken = removeCasualties(f.troops, Math.min(back, d.size));
    }
    t.log.push(`${f.name} — ${act.label.toLowerCase()} on ${target.name}: ${fx.dealt} compan${fx.dealt === 1 ? 'y' : 'ies'} broken` + (fx.taken ? `, ${fx.taken} lost to return fire.` : '.'));
    if (formationSize(target.troops) === 0) t.log.push(`${target.name} is wiped from the field.`);
  }
  if (formationSize(f.troops) === 0) t.log.push(`${f.name} is spent — the colors come down.`);
  t.formations = t.formations.filter((x) => formationSize(x.troops) > 0);
  t.fx = { ...fx, round: t.round, seq: (t.fx?.seq || 0) + 1 };
  if (t.log.length > 60) t.log = t.log.slice(-60);
  advanceQueue(t);
  return null;
}

// Nearest reachable hex within `move` of `f` that puts `foe` inside `reach`
function approach(t, f, foe, move, reach) {
  let best = null;
  for (let q = 0; q < GRID.w; q++) for (let r = 0; r < GRID.h; r++) {
    if (occupied(t, q, r, f.id)) continue;
    const cell = { q, r };
    if (hexDistance(f, cell) > move) continue;
    const gap = hexDistance(cell, foe);
    if (reach !== null && gap > reach) continue;
    if (!best || gap < best.gap) best = { cell, gap };
  }
  return best?.cell || null;
}

// A staff with no live commander fights by doctrine: close, then hit hardest.
export function autoOrders(t, f) {
  const d = deriveFormation(f.troops);
  const foes = [...t.formations.filter((x) => x.side !== f.side)].sort((a, b) => hexDistance(f, a) - hexDistance(f, b));
  if (foes.length === 0) return null;
  const specials = d.actions.filter((a) => ACTIONS[a].requires && !ACTIONS[a].self);
  for (const key of [...specials, 'volley']) {
    const act = ACTIONS[key];
    const reach = act.reach !== undefined ? act.reach : d.reach;
    for (const foe of foes) {
      if (hexDistance(f, foe) <= reach) return { moveTo: null, actionKey: key, targetId: foe.id };
      if (act.noMove || (d.strained && act.requires)) continue;
      const cell = approach(t, f, foe, d.move, reach);
      if (cell) return { moveTo: cell, actionKey: key, targetId: foe.id };
    }
  }
  return { moveTo: approach(t, f, foes[0], d.move, null), actionKey: 'hold', targetId: null };
}

// null while the fight continues; otherwise the finished result
export function battleResult(t) {
  if (t.status !== 'fighting') return null;
  const att = t.formations.filter((f) => f.side === 'attacker');
  const def = t.formations.filter((f) => f.side === 'defender');
  const power = (list) => list.reduce((s, f) => { const d = deriveFormation(f.troops); return s + d.attack + d.defense; }, 0);
  let attackerWon = null;
  if (def.length === 0) attackerWon = att.length > 0;
  else if (att.length === 0) attackerWon = false;
  else if (t.round > t.roundLimit) attackerWon = power(att) > power(def);
  if (attackerWon === null) return null;
  return { attackerWon, attackerUnits: toRegiments(att), defenderUnits: toRegiments(def) };
}

// Role-aware view for the client
export function tacticalView(t, myRole) {
  return {
    status: t.status, grid: t.grid, round: t.round, roundLimit: t.roundLimit, myRole,
    deployed: t.deployed,
    myPool: myRole ? t.pools[myRole] : null,
    activeId: t.status === 'fighting' ? t.queue[t.qIndex] || null : null,
    queue: t.status === 'fighting' ? t.queue.slice(t.qIndex).concat(t.queue.slice(0, t.qIndex)) : [],
    formations: t.formations.map((f) => {
      const d = deriveFormation(f.troops);
      return {
        id: f.id, side: f.side, name: f.name, q: f.q, r: f.r, troops: f.troops, status: f.status,
        size: d.size, pace: d.pace, move: d.move, reach: d.reach, attack: d.attack, defense: d.defense,
        strained: d.strained, actions: f.side === myRole ? d.actions : [], mine: f.side === myRole,
      };
    }),
    log: t.log.slice(-18),
    fx: t.fx,
  };
}