// ---------------------------------------------------------------------------
// Tactical field generator — canonical, server authority.
//
// One call, `generateField({ seed, nodeKind, weather, fortBonus, w, h })`,
// paints a whole set-piece battlefield: an axial hex grid of terrain, cover,
// elevation, LOS blockers and move cost, the two deploy zones, and whatever
// works the defender's fortification bonus has bought. It is PURE and SEEDED —
// the same arguments always produce a deep-equal object, and nothing in this
// file consults the platform RNG, the clock, or module-level mutable state.
//
// The client keeps a value-identical mirror at src/lib/tactical/field.js which
// adds display-only fields (label / short / blurb / fill). The mirror test in
// test/tactical-field.test.js lifts the five tables below out of this file
// TEXTUALLY, so every one of them must stay a pure data literal: no spreads,
// no computed keys, no function calls, no template literals in keys.
// ---------------------------------------------------------------------------
import { hexDistance } from './tactical.ts';

// Board geometry. `deployCols` is the depth of each side's deployment strip:
// the attacker owns the westernmost three columns, the defender the eastern
// three. At 15x11 that is 33 hexes a side.
export const FIELD = { w: 15, h: 11, deployCols: 3 };

// The repository's TerrainKey vocabulary. Lane E's terrain tokens and Lane J's
// Suspension.terrain table are both keyed to exactly these sixteen strings, so
// adding, renaming or removing one is a contract change, never a quiet edit.
//
//   cover      defensive cover the engine reads when a stand is fired on
//   moveCost   cost to ENTER the hex; `null` means impassable, full stop
//   blocksLOS  true when the hex stops a sight line at ground level
//   baseElev   the elevation a hex of this terrain starts at, before the
//              elevation pass. `elev` is 0 | 1 | 2 — THREE steps, not five:
//              0 = ground, 1 = rise, 2 = crest. There is no 3 and no 4.
//
// Note there is no `street` key. A metalled lane is `road`; that is why the
// arterial exists and why weather never taxes it.
export const TERRAIN = {
  open:           { key: 'open',           cover: 0, moveCost: 1,    blocksLOS: false, baseElev: 0 },
  road:           { key: 'road',           cover: 0, moveCost: 1,    blocksLOS: false, baseElev: 0 },
  rail:           { key: 'rail',           cover: 1, moveCost: 1,    blocksLOS: false, baseElev: 0 },
  field:          { key: 'field',          cover: 1, moveCost: 1,    blocksLOS: false, baseElev: 0 },
  rubble:         { key: 'rubble',         cover: 1, moveCost: 2,    blocksLOS: false, baseElev: 0 },
  ruins:          { key: 'ruins',          cover: 2, moveCost: 2,    blocksLOS: false, baseElev: 0 },
  building:       { key: 'building',       cover: 3, moveCost: 2,    blocksLOS: true,  baseElev: 0 },
  wall:           { key: 'wall',           cover: 2, moveCost: null, blocksLOS: true,  baseElev: 0 },
  woods:          { key: 'woods',          cover: 2, moveCost: 2,    blocksLOS: true,  baseElev: 0 },
  hedgerow:       { key: 'hedgerow',       cover: 2, moveCost: 2,    blocksLOS: false, baseElev: 0 },
  crater:         { key: 'crater',         cover: 2, moveCost: 2,    blocksLOS: false, baseElev: 0 },
  water:          { key: 'water',          cover: 0, moveCost: null, blocksLOS: false, baseElev: 0 },
  marsh:          { key: 'marsh',          cover: 0, moveCost: 3,    blocksLOS: false, baseElev: 0 },
  hill:           { key: 'hill',           cover: 0, moveCost: 2,    blocksLOS: false, baseElev: 1 },
  fuel_tank:      { key: 'fuel_tank',      cover: 2, moveCost: null, blocksLOS: true,  baseElev: 0 },
  precursor_wall: { key: 'precursor_wall', cover: 3, moveCost: null, blocksLOS: true,  baseElev: 0 },
};

// One palette per macro node kind. `weights` is a discrete distribution walked
// against a single rand() draw; `artery` is the terrain the west-to-east lane
// is metalled with; `features` is the palette's signature blocking cluster.
//
// The five are deliberately NOT reskins of each other:
//   city        dense, vertical, three quarters of it wreckage — the fight is
//               for window-lines, and `wall` is the only hard stop
//   town        open farmland cut by hedge banks; buildings come in a knot
//               around the crossroads, not spread thin
//   depot       the most exposed board in the set: rail and hardstanding, very
//               little natural cover, and fuel drums that are cover until lit
//   ruin        precursor ground — cratered, waterlogged, slow underfoot, with
//               uncuttable precursor masonry standing where nothing else does
//   crossroads  rolling country, the armour board; woods are the only screen
export const PALETTES = {
  city: {
    key: 'city',
    weights: { ruins: 20, rubble: 16, building: 14, open: 12, road: 10, wall: 6, crater: 5, rail: 3 },
    artery: 'road',
    features: { terrain: 'building', minClusters: 3, maxClusters: 6 },
  },
  town: {
    key: 'town',
    weights: { field: 22, open: 16, hedgerow: 14, building: 10, road: 5, woods: 7, marsh: 3, rail: 2 },
    artery: 'road',
    features: { terrain: 'hedgerow', minClusters: 2, maxClusters: 5 },
  },
  depot: {
    key: 'depot',
    weights: { open: 22, rail: 16, rubble: 10, field: 8, building: 5, fuel_tank: 5, road: 4, wall: 3 },
    artery: 'rail',
    features: { terrain: 'fuel_tank', minClusters: 2, maxClusters: 4 },
  },
  ruin: {
    key: 'ruin',
    weights: { crater: 18, rubble: 15, open: 12, marsh: 10, ruins: 8, woods: 8, precursor_wall: 6, hill: 4, water: 4 },
    artery: 'road',
    features: { terrain: 'precursor_wall', minClusters: 2, maxClusters: 5 },
  },
  crossroads: {
    key: 'crossroads',
    weights: { open: 30, field: 18, woods: 9, hedgerow: 7, hill: 6, marsh: 3, road: 3 },
    artery: 'road',
    features: { terrain: 'woods', minClusters: 2, maxClusters: 4 },
  },
};

// Weather never repaints terrain. It shortens sight, taxes soft ground and
// grounds aircraft — nothing else. `openMoveAdd` applies only to OPEN_GROUND
// (open / field / crater / marsh); `road` and `rail` are metalled and exempt.
// Impassable hexes are never modified. Lane C enforces the grounding; this
// file only reports it on `field.meta.groundsFighters`.
export const WEATHER_FIELD = {
  clear: { key: 'clear', losCap: 99, openMoveAdd: 0, woodsMoveAdd: 0, groundsFighters: false },
  rain:  { key: 'rain',  losCap: 7,  openMoveAdd: 1, woodsMoveAdd: 0, groundsFighters: false },
  fog:   { key: 'fog',   losCap: 4,  openMoveAdd: 0, woodsMoveAdd: 0, groundsFighters: false },
  snow:  { key: 'snow',  losCap: 6,  openMoveAdd: 1, woodsMoveAdd: 1, groundsFighters: false },
  storm: { key: 'storm', losCap: 8,  openMoveAdd: 1, woodsMoveAdd: 0, groundsFighters: true },
};

// Defender works seeding. fortBonus 0..3 buys 0/3/6/9 trenches and 0/0/1/2
// bunkers, scattered over the defender's last four columns (the three deploy
// columns plus the one in front of them). The MECHANICAL effect of a work is
// Lane A's deployables catalogue, applied by Lane C at resolution time — this
// file only stamps the key, and never folds work cover into tile.cover.
export const WORKS_SEED = { maxLevel: 3, trenchPerLevel: 3, bunkerFromLevel: 2, depthCols: 4 };

// ---- derived (not mirror-tested tables; computed from the literals above) ---

export const TERRAIN_KEYS = Object.keys(TERRAIN);

// Soft ground the weather taxes. Metalled lanes are deliberately absent.
const OPEN_GROUND = ['open', 'field', 'crater', 'marsh'];

// Cheapest entry cost on the board, for the A* heuristic. Weather only ever
// raises a cost, so a heuristic built on this stays admissible.
const MIN_MOVE_COST = Math.min.apply(
  null,
  TERRAIN_KEYS.map((k) => TERRAIN[k].moveCost).filter((c) => c !== null),
);

// ---- seeded randomness -----------------------------------------------------
// A verbatim COPY of the macro world generator's `macroMulberry32`, duplicated
// on purpose rather than shared: the module that owns it is a Deno request
// handler which cannot be loaded into Node, and cross-boundary sharing between
// backend functions is forbidden. A test lifts this copy out of the file text
// and pins its first draws against src/lib/macro/worlds.js, so the duplication
// cannot rot silently.
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// FNV-1a over the non-numeric inputs, so a different node kind or weather
// gives a different board for the same numeric seed.
const hashStr = (s) => {
  let x = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
  return x >>> 0;
};

// ---- hex toolkit -----------------------------------------------------------

const tileKey = (q, r) => `${q},${r}`;

/**
 * The six axial neighbours, unfiltered — the caller bounds-checks. The ORDER
 * is fixed and load-bearing: BFS and A* tie-break on it, so shuffling it would
 * change every returned path.
 */
export const neighbors = (q, r) => [
  { q: q + 1, r: r },
  { q: q + 1, r: r - 1 },
  { q: q, r: r - 1 },
  { q: q - 1, r: r },
  { q: q - 1, r: r + 1 },
  { q: q, r: r + 1 },
];

const inField = (field, q, r) => q >= 0 && q < field.w && r >= 0 && r < field.h;

/** Every in-field hex within `n` of `centre`, centre included, ascending q then r. */
export const hexRange = (field, centre, n) => {
  const out = [];
  for (let q = 0; q < field.w; q++) {
    for (let r = 0; r < field.h; r++) {
      if (hexDistance(centre, { q, r }) <= n) out.push({ q, r });
    }
  }
  return out;
};

const cubeRound = (x, y, z) => {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
};

/**
 * The hex line from `a` to `b`, both endpoints included, `a` first.
 *
 * Symmetry is mandatory — acceptance property 4 is that LOS is symmetric, and
 * LOS reads this. It is guaranteed STRUCTURALLY rather than hoped for: the
 * unordered pair is canonicalised first (lexicographic on q then r) and the
 * tie-breaking epsilon is applied only afterwards, so hexLine(a,b) and
 * hexLine(b,a) are computed from literally the same lerp and one is the
 * reverse of the other. Applying the epsilon before canonicalising is the
 * classic way to make ties round two different directions.
 */
export const hexLine = (a, b) => {
  if (a.q > b.q || (a.q === b.q && a.r > b.r)) return hexLine(b, a).reverse();
  const n = hexDistance(a, b);
  if (n === 0) return [{ q: a.q, r: a.r }];
  const ax = a.q + 1e-6, az = a.r + 1e-6, ay = -a.q - a.r + 1e-6;
  const bx = b.q + 1e-6, bz = b.r + 1e-6, by = -b.q - b.r + 1e-6;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(cubeRound(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t));
  }
  return out;
};

const elevAt = (field, hx) => {
  const tile = field.tiles[tileKey(hx.q, hx.r)];
  return tile ? tile.elev : 0;
};

/**
 * True when `a` can see `b`. Two conditions, both symmetric by construction:
 *   1. the distance is inside the weather's losCap;
 *   2. no INTERMEDIATE hex blocks. A hex blocks when it is a LOS blocker AND
 *      it stands at least as high as the LOWER of the two endpoints — a
 *      blocker below both of you is something you shoot over. Endpoints never
 *      block themselves, and a hex outside the board never blocks.
 */
export const lineOfSight = (field, a, b) => {
  if (hexDistance(a, b) > field.meta.losCap) return false;
  const line = hexLine(a, b);
  if (line.length <= 2) return true;
  const floor = Math.min(elevAt(field, a), elevAt(field, b));
  for (let i = 1; i < line.length - 1; i++) {
    const tile = field.tiles[tileKey(line[i].q, line[i].r)];
    if (!tile) continue;
    if (tile.blocksLOS && tile.elev >= floor) return false;
  }
  return true;
};

/**
 * A* over moveCost, entry-cost model: moving INTO a hex costs that hex's
 * moveCost and the starting hex is free. Returns `{ cost, path }` with the
 * path inclusive of both endpoints, or `null` when there is no route.
 *
 * `opts.blocked` is an array or Set of "q,r" keys treated as impassable (Lane
 * C passes the occupied hexes). The destination is pathable while blocked only
 * when `opts.allowBlockedTarget === true`; `moveCost === null` is impassable
 * regardless. The open set tie-breaks on (f, then h, then q, then r) so the
 * returned path is one path, deterministically, not merely a shortest one.
 */
export function pathCost(field, from, to, opts = {}) {
  const tiles = field.tiles;
  const blocked = opts.blocked instanceof Set ? opts.blocked : new Set(opts.blocked || []);
  const allowTarget = opts.allowBlockedTarget === true;
  const fromKey = tileKey(from.q, from.r);
  const toKey = tileKey(to.q, to.r);
  if (!tiles[fromKey] || !tiles[toKey]) return null;
  if (fromKey === toKey) return { cost: 0, path: [{ q: from.q, r: from.r }] };

  const passable = (k, tile) => {
    if (!tile || tile.moveCost === null) return false;
    if (blocked.has(k)) return k === toKey && allowTarget;
    return true;
  };
  if (!passable(toKey, tiles[toKey])) return null;

  const best = new Map([[fromKey, 0]]);
  const came = new Map();
  const closed = new Set();
  const h0 = hexDistance(from, to) * MIN_MOVE_COST;
  const open = [{ q: from.q, r: from.r, k: fromKey, g: 0, h: h0, f: h0 }];

  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      const c = open[i], w = open[bi];
      if (c.f < w.f
        || (c.f === w.f && (c.h < w.h
          || (c.h === w.h && (c.q < w.q
            || (c.q === w.q && c.r < w.r)))))) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    if (closed.has(cur.k)) continue;
    if (cur.k === toKey) {
      const path = [];
      let k = toKey;
      while (k !== undefined) {
        const parts = k.split(',');
        path.push({ q: Number(parts[0]), r: Number(parts[1]) });
        k = came.get(k);
      }
      path.reverse();
      return { cost: cur.g, path };
    }
    closed.add(cur.k);
    for (const nb of neighbors(cur.q, cur.r)) {
      if (!inField(field, nb.q, nb.r)) continue;
      const nk = tileKey(nb.q, nb.r);
      if (closed.has(nk)) continue;
      const tile = tiles[nk];
      if (!passable(nk, tile)) continue;
      const g = cur.g + tile.moveCost;
      const seen = best.get(nk);
      if (seen !== undefined && g >= seen) continue;
      best.set(nk, g);
      came.set(nk, cur.k);
      const hh = hexDistance(nb, to) * MIN_MOVE_COST;
      open.push({ q: nb.q, r: nb.r, k: nk, g, h: hh, f: g + hh });
    }
  }
  return null;
}

// ---- generator internals ---------------------------------------------------

// Weather-adjusted entry cost for a terrain. `wf` is null before the weather
// pass (steps 2-5) and the weather row afterwards, so a repaint in steps 8-10
// re-earns the tax rather than silently dropping it.
const costFor = (terrain, wf) => {
  const base = TERRAIN[terrain].moveCost;
  if (base === null || !wf) return base;
  let c = base;
  if (OPEN_GROUND.indexOf(terrain) !== -1) c += wf.openMoveAdd;
  if (terrain === 'woods') c += wf.woodsMoveAdd;
  return c;
};

// Repaint a tile's terrain and every field derived from terrain. Deliberately
// leaves `elev` and `work` alone: elevation is its own pass, and a work is a
// stamp on the ground rather than a property of the ground.
const applyTerrain = (tile, terrain, wf) => {
  tile.terrain = terrain;
  tile.cover = TERRAIN[terrain].cover;
  tile.blocksLOS = TERRAIN[terrain].blocksLOS;
  tile.moveCost = costFor(terrain, wf);
};

// Walk the cumulative weights against one draw.
const pickTerrain = (weights, keys, total, rand) => {
  let roll = rand() * total;
  for (let i = 0; i < keys.length; i++) {
    roll -= weights[keys[i]];
    if (roll < 0) return keys[i];
  }
  return keys[keys.length - 1];
};

// Flood-fill over passable hexes from `start`, returning the set of reached keys.
const floodPassable = (field, start) => {
  const seen = new Set();
  const startKey = tileKey(start.q, start.r);
  const startTile = field.tiles[startKey];
  if (!startTile || startTile.moveCost === null) return seen;
  seen.add(startKey);
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    for (const nb of neighbors(cur.q, cur.r)) {
      if (!inField(field, nb.q, nb.r)) continue;
      const k = tileKey(nb.q, nb.r);
      if (seen.has(k)) continue;
      const tile = field.tiles[k];
      if (!tile || tile.moveCost === null) continue;
      seen.add(k);
      stack.push(nb);
    }
  }
  return seen;
};

/**
 * Generate a battlefield.
 *
 * The ten steps below run in exactly this order, and the four acceptance
 * properties are properties OF THAT ORDER — deploy zones are cleared (8)
 * before works are stamped (9), and connectivity is repaired (10) last of all
 * so nothing can re-block what it opened. Reordering them breaks the tests
 * whether or not it breaks the board.
 *
 * @param {{seed?:number, nodeKind?:string, weather?:string, fortBonus?:number, w?:number, h?:number}} opts
 * @returns {object} the field, per docs/TACTICAL_SQUAD_PLAN.md §4
 */
export function generateField(opts = {}) {
  // ---- 1. seed --------------------------------------------------------------
  const kind = PALETTES[opts.nodeKind] ? opts.nodeKind : 'crossroads';
  const wx = WEATHER_FIELD[opts.weather] ? opts.weather : 'clear';
  const palette = PALETTES[kind];
  const wf = WEATHER_FIELD[wx];
  const wRaw = Number.isFinite(opts.w) ? opts.w : FIELD.w;
  const hRaw = Number.isFinite(opts.h) ? opts.h : FIELD.h;
  const w = Math.max(9, Math.floor(wRaw));
  const h = Math.max(7, Math.floor(hRaw));
  const fb = Math.max(0, Math.min(WORKS_SEED.maxLevel, Math.floor(opts.fortBonus || 0)));
  const seed = (Number.isFinite(opts.seed) ? opts.seed : 0) >>> 0;
  const rand = mulberry32((seed ^ hashStr(`${kind}|${wx}|${fb}|${w}x${h}`)) >>> 0);

  // ---- 2. paint -------------------------------------------------------------
  const weightKeys = Object.keys(palette.weights);
  let weightTotal = 0;
  for (const k of weightKeys) weightTotal += palette.weights[k];
  const tiles = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const terrain = pickTerrain(palette.weights, weightKeys, weightTotal, rand);
      tiles[tileKey(q, r)] = {
        terrain,
        cover: TERRAIN[terrain].cover,
        elev: TERRAIN[terrain].baseElev,
        blocksLOS: TERRAIN[terrain].blocksLOS,
        moveCost: TERRAIN[terrain].moveCost,
      };
    }
  }
  const field = { w, h, tiles, deploy: { attacker: [], defender: [] }, meta: null };

  // ---- 3. artery ------------------------------------------------------------
  // One metalled lane west to east. It is the connectivity backbone and the
  // reason the connectivity repair in step 10 almost never has work to do.
  const arteryHexes = new Set();
  const metal = (q, r) => {
    const tile = tiles[tileKey(q, r)];
    applyTerrain(tile, palette.artery, null);
    tile.elev = TERRAIN[palette.artery].baseElev;
    arteryHexes.add(tileKey(q, r));
  };
  let ar = (h / 2) | 0;
  for (let q = 0; q < w; q++) {
    metal(q, ar);
    const drift = ((rand() * 3) | 0) - 1;
    const next = Math.max(0, Math.min(h - 1, ar + drift));
    // The six axial neighbours are [+1,0] [+1,-1] [0,-1] [-1,0] [-1,+1] [0,+1].
    // Read that list: stepping one column east and one row NORTH is adjacent,
    // stepping one column east and one row SOUTH is NOT — those two hexes are
    // a distance of 2 apart. A southward drift therefore lays one extra hex in
    // the next column to bridge the gap, so the lane is a genuinely CONNECTED
    // chain rather than a dotted line that merely looks like one on a map.
    if (next === ar + 1 && q + 1 < w) metal(q + 1, ar);
    ar = next;
  }

  // ---- 4. features ----------------------------------------------------------
  // The palette's signature blocking cluster: a centre plus a coin-flip on each
  // of its six neighbours, so clusters come out ragged rather than as rosettes.
  const spread = palette.features.maxClusters - palette.features.minClusters + 1;
  const clusters = palette.features.minClusters + ((rand() * spread) | 0);
  for (let c = 0; c < clusters; c++) {
    const cq = 2 + ((rand() * (w - 4)) | 0);
    const cr = (rand() * h) | 0;
    const centreKey = tileKey(cq, cr);
    if (!arteryHexes.has(centreKey)) {
      applyTerrain(tiles[centreKey], palette.features.terrain, null);
      tiles[centreKey].elev = TERRAIN[palette.features.terrain].baseElev;
    }
    for (const nb of neighbors(cq, cr)) {
      const take = rand() < 0.5;
      if (!take) continue;
      if (!inField(field, nb.q, nb.r)) continue;
      const k = tileKey(nb.q, nb.r);
      if (arteryHexes.has(k)) continue;
      applyTerrain(tiles[k], palette.features.terrain, null);
      tiles[k].elev = TERRAIN[palette.features.terrain].baseElev;
    }
  }

  // ---- 5. elevation ---------------------------------------------------------
  // One to three blobs. Elevation is a SEPARATE layer: it never changes
  // terrain, cover, moveCost or blocksLOS, it only decides who is shooting over
  // whom. Three steps only — 0 ground, 1 rise, 2 crest.
  const blobs = 1 + ((rand() * 3) | 0);
  for (let b = 0; b < blobs; b++) {
    const cq = 3 + ((rand() * (w - 6)) | 0);
    const cr = (rand() * h) | 0;
    const centre = tiles[tileKey(cq, cr)];
    centre.elev = 1;
    for (const nb of neighbors(cq, cr)) {
      if (!inField(field, nb.q, nb.r)) continue;
      tiles[tileKey(nb.q, nb.r)].elev = 1;
    }
    const crest = rand() < 1 / 3;
    if (crest) centre.elev = 2;
  }

  // ---- 6. weather -----------------------------------------------------------
  for (const k of Object.keys(tiles)) {
    tiles[k].moveCost = costFor(tiles[k].terrain, wf);
  }

  // ---- 7. deploy zones ------------------------------------------------------
  const attacker = [];
  const defender = [];
  for (let q = 0; q < FIELD.deployCols && q < w; q++) {
    for (let r = 0; r < h; r++) attacker.push({ q, r });
  }
  for (let q = Math.max(0, w - FIELD.deployCols); q < w; q++) {
    for (let r = 0; r < h; r++) defender.push({ q, r });
  }
  field.deploy.attacker = attacker;
  field.deploy.defender = defender;

  // ---- 8. normalise the zones ----------------------------------------------
  // No side ever deploys into a wall, a lake or a building. This is what makes
  // "deploy zones always free of blockers" true BY CONSTRUCTION rather than by
  // a lucky palette — and flattening the zones stops elevation handing one
  // side a free crest on turn zero.
  for (const hx of attacker.concat(defender)) {
    const tile = tiles[tileKey(hx.q, hx.r)];
    if (tile.moveCost === null || tile.blocksLOS === true) applyTerrain(tile, 'open', wf);
    tile.elev = 0;
  }

  // ---- 9. works -------------------------------------------------------------
  // Trenches first, then bunkers, over the defender's last four columns: the
  // deploy strip plus the column in front of it, so the line has depth rather
  // than sitting flat on the board edge.
  const trenches = fb * WORKS_SEED.trenchPerLevel;
  const bunkers = Math.max(0, fb - (WORKS_SEED.bunkerFromLevel - 1));
  if (trenches + bunkers > 0) {
    const pool = [];
    for (let q = Math.max(0, w - WORKS_SEED.depthCols); q < w; q++) {
      for (let r = 0; r < h; r++) pool.push({ q, r });
    }
    const stamp = (workKey) => {
      if (!pool.length) return;
      const pick = pool.splice((rand() * pool.length) | 0, 1)[0];
      const tile = tiles[tileKey(pick.q, pick.r)];
      if (tile.moveCost === null || tile.blocksLOS === true) applyTerrain(tile, 'open', wf);
      tile.work = workKey;
    };
    for (let i = 0; i < trenches; i++) stamp('trench');
    for (let i = 0; i < bunkers; i++) stamp('bunker');
  }

  field.meta = {
    seed,
    nodeKind: kind,
    weather: wx,
    fortBonus: fb,
    losCap: wf.losCap,
    groundsFighters: wf.groundsFighters,
  };

  // ---- 10. connectivity repair ---------------------------------------------
  repairConnectivity(field);
  return field;
}

/**
 * Step 10 — connectivity repair. Every deploy hex must be walkable from the
 * attacker's corner, or a battle can be unwinnable before an order is issued.
 *
 * Deterministic: `hexLine` is deterministic and `rand` is never consulted here,
 * so the repair cannot make two identical seeds diverge. It reads the weather
 * off `field.meta`, so it must run AFTER meta is set; that is the only ordering
 * constraint on it, and nothing else runs after it.
 *
 * EXPORTED ON PURPOSE. Work item 7 requires the guard counter to be asserted,
 * and a guard inside a closure cannot be asserted from outside. On a board the
 * generator actually produces this pass carves nothing (the arterial lane and
 * the normalised deploy strips have already connected everything), so leaving
 * it unexported would leave the whole pass — flood, guard loop, carve and the
 * unconditional last resort — with no coverage at all. The return value is what
 * a test reads: `{ passes, carved, forced }`.
 *
 * @param {object} field a field with `tiles`, `deploy` and `meta` already set
 * @returns {{passes:number, carved:number, forced:number}} work actually done
 */
export function repairConnectivity(field) {
  const tiles = field.tiles;
  const wf = WEATHER_FIELD[field.meta && field.meta.weather] || WEATHER_FIELD.clear;
  const origin = field.deploy.attacker[0];
  const zone = field.deploy.attacker.concat(field.deploy.defender);
  const carved = new Set();
  const carve = (target, unconditional) => {
    for (const step of hexLine(origin, target)) {
      const k = tileKey(step.q, step.r);
      const tile = tiles[k];
      if (!tile) continue;
      if (!unconditional && tile.moveCost !== null) continue;
      applyTerrain(tile, 'open', wf);
      carved.add(k);
    }
  };
  let reached = floodPassable(field, origin);
  let passes = 0;
  while (passes < 8) {
    const missing = zone.filter((hx) => !reached.has(tileKey(hx.q, hx.r)));
    if (missing.length === 0) break;
    for (const hx of missing) carve(hx, false);
    passes++;
    reached = floodPassable(field, origin);
  }
  // Last resort: a hexLine is a chain of adjacent hexes, so opening one whole
  // and unconditionally cannot fail to connect. The guard counter above is what
  // stops this loop being unbounded; `forced` reports whether it was reached.
  const stubborn = zone.filter((hx) => !reached.has(tileKey(hx.q, hx.r)));
  for (const hx of stubborn) carve(hx, true);
  return { passes, carved: carved.size, forced: stubborn.length };
}
