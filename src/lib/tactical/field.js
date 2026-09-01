// ---------------------------------------------------------------------------
// Tactical field generator — FRONTEND MIRROR of base44/shared/tacticalField.ts.
//
// The server remains the authority; nothing here decides an outcome. This copy
// exists so the deployment preview and the arena can paint a board, measure a
// path and test a sight line without a round trip. Its five data tables are
// deep-equal to the canonical ones (test/tactical-field.test.js lifts them out
// of the .ts textually and compares), and its generator is byte-for-byte
// reproducible against the canonical one for the same arguments.
//
// The ONLY permitted difference is display-only fields on the table rows —
// `label`, `short`, `blurb`, `fill` — which the mirror test strips before
// comparing. Every number lives on the canonical side and is never retyped in
// prose here.
//
// This file also holds the two axial→pixel helpers the arena needs
// (`hexPixel`, `hexCorners`). They moved here from src/lib/tactical/data.js;
// Lane A re-exports them from there so no existing import path breaks.
// ---------------------------------------------------------------------------
import { hexDistance } from "@/lib/tactical/data";

// Board geometry. `deployCols` is the depth of each side's deployment strip:
// the attacker owns the westernmost three columns, the defender the eastern
// three. At 15x11 that is 33 hexes a side.
export const FIELD = { w: 15, h: 11, deployCols: 3 };

// The repository's TerrainKey vocabulary. Lane E's terrain tokens and Lane J's
// Suspension.terrain table are both keyed to exactly these sixteen strings.
//
//   cover      defensive cover the engine reads when a stand is fired on
//   moveCost   cost to ENTER the hex; `null` means impassable, full stop
//   blocksLOS  true when the hex stops a sight line at ground level
//   baseElev   the elevation a hex of this terrain starts at, before the
//              elevation pass. `elev` is 0 | 1 | 2 — THREE steps, not five:
//              0 = ground, 1 = rise, 2 = crest. There is no 3 and no 4.
//
// Note there is no `street` key. A metalled lane is `road`.
export const TERRAIN = {
  open:           { key: 'open',           cover: 0, moveCost: 1,    blocksLOS: false, baseElev: 0, label: 'Open Ground',    short: 'Open',   fill: 'hsl(var(--muted))',            blurb: 'Ploughed flat and offering nothing. Cross it quickly or be counted.' },
  road:           { key: 'road',           cover: 0, moveCost: 1,    blocksLOS: false, baseElev: 0, label: 'Metalled Road',  short: 'Road',   fill: 'hsl(var(--steel) / 0.35)',     blurb: 'The Ministry laid it. Both armies will use it, and both know that.' },
  rail:           { key: 'rail',           cover: 1, moveCost: 1,    blocksLOS: false, baseElev: 0, label: 'Rail Line',      short: 'Rail',   fill: 'hsl(var(--steel) / 0.55)',     blurb: 'Sleepers and ballast. Good footing, poor cover, and it runs the wrong way.' },
  field:          { key: 'field',          cover: 1, moveCost: 1,    blocksLOS: false, baseElev: 0, label: 'Standing Crop',  short: 'Field',  fill: 'hsl(var(--olive) / 0.35)',     blurb: 'Waist-high and worthless. It hides a kneeling man and nothing larger.' },
  rubble:         { key: 'rubble',         cover: 1, moveCost: 2,    blocksLOS: false, baseElev: 0, label: 'Rubble',         short: 'Rubble', fill: 'hsl(var(--secondary))',        blurb: 'A street poured into itself. Low walls, bad footing, ankles lost daily.' },
  ruins:          { key: 'ruins',          cover: 2, moveCost: 2,    blocksLOS: false, baseElev: 0, label: 'Ruined Block',   short: 'Ruins',  fill: 'hsl(var(--border))',           blurb: 'Roofless shells. Fight from the window-lines and mind the floors.' },
  building:       { key: 'building',       cover: 3, moveCost: 2,    blocksLOS: true,  baseElev: 0, label: 'Standing Block', short: 'Bldg',   fill: 'hsl(var(--card))',             blurb: 'Brick and rafter, still standing enough to fight from.' },
  wall:           { key: 'wall',           cover: 2, moveCost: null, blocksLOS: true,  baseElev: 0, label: 'Compound Wall',  short: 'Wall',   fill: 'hsl(var(--foreground) / 0.25)', blurb: 'Ministry masonry, mortared to last. Go around it.' },
  woods:          { key: 'woods',          cover: 2, moveCost: 2,    blocksLOS: true,  baseElev: 0, label: 'Standing Timber',short: 'Woods',  fill: 'hsl(var(--olive))',            blurb: 'Sight dies inside it. So, reliably, do runners.' },
  hedgerow:       { key: 'hedgerow',       cover: 2, moveCost: 2,    blocksLOS: false, baseElev: 0, label: 'Hedge Bank',     short: 'Hedge',  fill: 'hsl(var(--olive) / 0.65)',     blurb: 'Banked earth under thorn. An old field boundary makes a new firing line.' },
  crater:         { key: 'crater',         cover: 2, moveCost: 2,    blocksLOS: false, baseElev: 0, label: 'Shell Crater',   short: 'Crater', fill: 'hsl(var(--background))',       blurb: 'Rim-high and already dug. Cover the ordnance made for you.' },
  water:          { key: 'water',          cover: 0, moveCost: null, blocksLOS: false, baseElev: 0, label: 'Standing Water', short: 'Water',  fill: 'hsl(var(--chart-3) / 0.55)',   blurb: 'Depth unrecorded. No column fords it under fire, and the Ministry has stopped asking.' },
  marsh:          { key: 'marsh',          cover: 0, moveCost: 3,    blocksLOS: false, baseElev: 0, label: 'Sucking Ground', short: 'Marsh',  fill: 'hsl(var(--chart-3) / 0.3)',    blurb: 'It takes your boots first and your pace directly after.' },
  hill:           { key: 'hill',           cover: 0, moveCost: 2,    blocksLOS: false, baseElev: 1, label: 'Rise',           short: 'Hill',   fill: 'hsl(var(--brass) / 0.3)',      blurb: 'A rise worth a battalion. Whoever holds it sees the rest of us.' },
  fuel_tank:      { key: 'fuel_tank',      cover: 2, moveCost: null, blocksLOS: true,  baseElev: 0, label: 'Fuel Drum',      short: 'Fuel',   fill: 'hsl(var(--rust) / 0.55)',      blurb: 'A riveted drum of naphtha. Excellent cover, right up until it is not.' },
  precursor_wall: { key: 'precursor_wall', cover: 3, moveCost: null, blocksLOS: true,  baseElev: 0, label: 'Precursor Wall', short: 'Precsr', fill: 'hsl(var(--chart-4) / 0.6)',    blurb: 'Seamless, unweathered, older than the Ministry. Nothing we own has ever cut it.' },
};

// One palette per macro node kind. `weights` is a discrete distribution walked
// against a single rand() draw; `artery` is the terrain the west-to-east lane
// is metalled with; `features` is the palette's signature blocking cluster.
export const PALETTES = {
  city: {
    key: 'city',
    weights: { ruins: 20, rubble: 16, building: 14, open: 12, road: 10, wall: 6, crater: 5, rail: 3 },
    artery: 'road',
    features: { terrain: 'building', minClusters: 3, maxClusters: 6 },
    label: 'Ministry Ward',
    blurb: 'A city reduced to its street plan. It will be taken block by block or not at all.',
  },
  town: {
    key: 'town',
    weights: { field: 22, open: 16, hedgerow: 14, building: 10, road: 5, woods: 7, marsh: 3, rail: 2 },
    artery: 'road',
    features: { terrain: 'hedgerow', minClusters: 2, maxClusters: 5 },
    label: 'Farm Township',
    blurb: 'Field boundaries, a chapel and a road out. Nothing here was laid down for this.',
  },
  depot: {
    key: 'depot',
    weights: { open: 22, rail: 16, rubble: 10, field: 8, building: 5, fuel_tank: 5, road: 4, wall: 3 },
    artery: 'rail',
    features: { terrain: 'fuel_tank', minClusters: 2, maxClusters: 4 },
    label: 'Supply Depot',
    blurb: 'Sidings, hardstanding and drums. Very little to hide behind and a great deal to burn.',
  },
  ruin: {
    key: 'ruin',
    weights: { crater: 18, rubble: 15, open: 12, marsh: 10, ruins: 8, woods: 8, precursor_wall: 6, hill: 4, water: 4 },
    artery: 'road',
    features: { terrain: 'precursor_wall', minClusters: 2, maxClusters: 5 },
    label: 'Precursor Ground',
    blurb: 'Dug over by generations of prospectors and shelled by all of them. The old walls still stand.',
  },
  crossroads: {
    key: 'crossroads',
    weights: { open: 30, field: 18, woods: 9, hedgerow: 7, hill: 6, marsh: 3, road: 3 },
    artery: 'road',
    features: { terrain: 'woods', minClusters: 2, maxClusters: 4 },
    label: 'Open Crossroads',
    blurb: 'Rolling country and one metalled lane. The armour will settle this before the infantry arrive.',
  },
};

// Weather never repaints terrain. It shortens sight, taxes soft ground and
// grounds aircraft — nothing else. `road` and `rail` are metalled and exempt.
export const WEATHER_FIELD = {
  clear: { key: 'clear', losCap: 99, openMoveAdd: 0, woodsMoveAdd: 0, groundsFighters: false, label: 'Clear Skies',  blurb: 'Every glass on the field is working. Assume you are being watched.' },
  rain:  { key: 'rain',  losCap: 7,  openMoveAdd: 1, woodsMoveAdd: 0, groundsFighters: false, label: 'Driving Rain', blurb: 'The ground drinks and the columns crawl. The metalled lanes hold.' },
  fog:   { key: 'fog',   losCap: 4,  openMoveAdd: 0, woodsMoveAdd: 0, groundsFighters: false, label: 'Heavy Fog',    blurb: 'The war shrinks to the length of a shout. Guns fire on faith.' },
  snow:  { key: 'snow',  losCap: 6,  openMoveAdd: 1, woodsMoveAdd: 1, groundsFighters: false, label: 'Falling Snow', blurb: 'Cold engines, short sight, and a set of tracks for the enemy to read.' },
  storm: { key: 'storm', losCap: 8,  openMoveAdd: 1, woodsMoveAdd: 0, groundsFighters: true,  label: 'Thunderstorm', blurb: 'The airfields are shut. For today the sky belongs to nobody.' },
};

// Defender works seeding. The MECHANICAL effect of a work is Lane A's
// deployables catalogue, applied by Lane C at resolution time — this file only
// stamps the key, and never folds work cover into tile.cover.
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

// ---- axial → pixel (moved here from src/lib/tactical/data.js) --------------
// Pointy-top hexes. The arena's geometry helpers and the deployment preview
// both draw from these; data.js re-exports them so older import paths hold.
export const hexPixel = (q, r, size) => ({ x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r });
export const hexCorners = (size) =>
  [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(size * Math.cos(a)).toFixed(2)},${(size * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

// ---- seeded randomness -----------------------------------------------------
// A verbatim COPY of the macro world generator's `macroMulberry32`, duplicated
// on purpose rather than shared: the module that owns it is a Deno request
// handler which cannot be loaded into Node. A test lifts this copy out of the
// file text and pins its first draws against src/lib/macro/worlds.js, so the
// duplication cannot rot silently.
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
 * Symmetry is guaranteed STRUCTURALLY: the unordered pair is canonicalised
 * first (lexicographic on q then r) and the tie-breaking epsilon is applied
 * only afterwards, so hexLine(a,b) and hexLine(b,a) come out of the same lerp
 * and one is the exact reverse of the other.
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
 * Generate a battlefield. Mirror of the canonical generator — same ten steps,
 * same order, same draws from the same seeded stream, so the two produce
 * JSON-identical objects for identical arguments (asserted in the tests).
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
  for (const hx of attacker.concat(defender)) {
    const tile = tiles[tileKey(hx.q, hx.r)];
    if (tile.moveCost === null || tile.blocksLOS === true) applyTerrain(tile, 'open', wf);
    tile.elev = 0;
  }

  // ---- 9. works -------------------------------------------------------------
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
 * EXPORTED ON PURPOSE — see the canonical file for why: the guard counter this
 * pass is required to carry cannot be asserted from outside a closure, and on a
 * board the generator actually produces the pass carves nothing, so unexported
 * it would have no coverage at all. Returns `{ passes, carved, forced }`.
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
