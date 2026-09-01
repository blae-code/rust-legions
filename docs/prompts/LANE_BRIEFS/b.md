# Lane B — Field generator

> This brief is your complete instruction set. Besides it you read exactly four documents:
> `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md`, `docs/TACTICAL_SQUAD_PLAN.md` (the contract —
> §3 lanes/ownership, §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol), plus
> `test/helpers/extract-const.js` and your own owned files. Nothing else is required context, and
> nothing else may be edited.

---

## Goal

At the end of this lane the tactical layer has a **deterministic, seeded battlefield generator**. A single
call — `generateField({ seed, nodeKind, weather, fortBonus, w, h })` — returns a complete **15×11** axial
hex field: per-hex terrain, cover, elevation, LOS-blocking flag, move cost and optional defender works,
plus the two deploy zones. Five terrain palettes (`city`, `town`, `depot`, `ruin`, `crossroads`) paint the
ground, the five weather states bend LOS range and move cost, and the defender's `fortBonus` seeds trenches
and bunkers on its own edge. Alongside it ships the hex toolkit the engine and the arena both need —
`neighbors`, `hexLine`, `hexRange`, `lineOfSight`, `pathCost` — with a frontend mirror at
`src/lib/tactical/field.js` and a test file that proves the four acceptance properties as **property tests
over at least 200 generated fields**, not as spot checks.

Nothing in this lane resolves combat, moves a squad or touches the state machine. You produce a pure,
side-effect-free data structure and pure query functions over it. Lane C consumes them.

---

## Owned files

Copied from §3 (“Lane B — Field generator”):

> Owns: `base44/shared/tacticalField.ts`, `src/lib/tactical/field.js` (terrain meta + hex helpers moved
> here from `data.js` — coordinate with Lane A), `test/tactical-field.test.js`.

Exact paths, all relative to the repository root:

| Path | State | What you do |
| --- | --- | --- |
| `base44/shared/tacticalField.ts` | **NEW** | The canonical generator + hex toolkit (server authority). |
| `src/lib/tactical/field.js` | **NEW** | The frontend mirror: the same tables, byte-equal in value, plus UI-only fields, plus the hex helpers moved from `data.js`. |
| `test/tactical-field.test.js` | **NEW** | Mirror test + the four property tests + the unit tests listed below. |

**You may not edit any other file.** Specifically and non-negotiably you do **not** touch:
`base44/shared/tactical.ts`, `base44/shared/tacticalEngine.ts`, `src/lib/tactical/data.js`,
`base44/functions/gameEngine/entry.ts`, anything under `base44/entities/`, `docs/COMBAT_DESIGN.md`,
`docs/GAME_RULES.md`, `test/helpers/*`, `package.json`, `package-lock.json`, `vitest.config.js`,
`eslint.config.js`, any component under `src/components/`, or any other lane's files.

**The one exception, explicitly authorised.** §0 of the plan says: *“If a lane needs to change a contract,
it edits this file first and flags it in its PR.”* Your generator returns two structures §4 does not yet
declare (`meta` on the field, and the `TerrainKey` vocabulary that Lane J's `Suspension.terrain` already
references). You therefore **append** the block in *Contracts you produce* below to the end of the §4 code
fence in `docs/TACTICAL_SQUAD_PLAN.md`, changing nothing else in that document, and you say so in your PR
body under a heading `## §4 amendment`. Append only — never reword, reorder or delete an existing line in
§4; other lanes are editing the same fence.

---

## Contracts you consume

### 1. `hexDistance` — produced by **Lane A** (`base44/shared/tactical.ts`, already shipped per §0)

```js
export const hexDistance = (a, b) => {
  const dq = a.q - b.q, dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};
```

**Import it, never redefine it.** In `tacticalField.ts`: `import { hexDistance } from './tactical.ts';`
(the `.ts` extension is mandatory — Deno resolves it literally). In `src/lib/tactical/field.js`:
`import { hexDistance } from "@/lib/tactical/data";`. If Lane A were ever to stop exporting it your lane
breaks, so state that dependency in your PR body.

### 2. `fieldOpts` — produced by **Lane C** (`createTactical`) and ultimately by the **platform lane**

From §3 Lane C and the platform lane: *“`createTactical` call site passes `{ seed, nodeKind, weather,
fortBonus }`”*. That object, plus optional `w` / `h`, is exactly your input:

```ts
{ seed: number, nodeKind: 'city'|'town'|'depot'|'ruin'|'crossroads', weather: 'clear'|'rain'|'fog'|'storm'|'snow', fortBonus: number, w?: number /* =15 */, h?: number /* =11 */ }
```

The five `nodeKind` values are the macro node kinds already in `src/lib/macro/graph.js`. The five `weather`
values are the keys of `WEATHER_META` in `src/lib/weather.js`. Do not invent a sixth of either; do not
import either file — accept the strings and defend against unknown ones (see work item 4).

### 3. `mulberry32` — copied, **never imported**

§3 Lane B: *“Deterministic via `mulberry32` (copy the one in `gameEngine`; do not import it).”* The
authoritative body lives in `base44/functions/gameEngine/entry.ts` as `macroMulberry32` and is mirrored in
`src/lib/macro/worlds.js` as `mulberry32`. Copy this body verbatim into **both** of your files:

```js
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
```

`base44/functions/gameEngine/entry.ts` is a Deno module that cannot be imported into Node/Vitest and is
platform-owned; that is precisely why the plan says copy. A test asserts the copy is faithful (work item 12).

---

## Contracts you produce

### The `field` object — **verbatim from §4**, and your return value must match it exactly

```ts
field: { w, h, tiles: { "q,r": { terrain, cover, elev, blocksLOS, moveCost, work? } }, deploy: { attacker: [{q,r}], defender: [{q,r}] } }
```

Read that literally:

- `tiles` is a **flat object** keyed by the string `` `${q},${r}` `` — no space, no padding, no nesting.
- Every in-field hex has an entry. `w * h = 165` entries at the default size.
- Each tile carries exactly `terrain, cover, elev, blocksLOS, moveCost` always, and `work` **only when a
  work is present** (absent key, never `null`, when there is none).
- `deploy.attacker` and `deploy.defender` are arrays of `{ q, r }` objects in that key order.

### The §4 amendment you append (append-only, at the end of the §4 fence)

```ts
// ---- Field generator (Lane B) ----
TerrainKey  = 'open'|'road'|'rail'|'field'|'rubble'|'ruins'|'building'|'wall'|'woods'|'hedgerow'|'crater'|'water'|'marsh'|'hill'|'fuel_tank'|'precursor_wall'
WorkKey     = 'foxhole'|'trench'|'bunker'|'emplacement'   // Lane A owns DEPLOYABLES; Lane B only ever emits 'trench' | 'bunker'
TerrainMeta = { key: TerrainKey, cover: number, moveCost: number | null /* null = impassable */, blocksLOS: boolean, baseElev: 0|1|2 }
Tile        = { terrain: TerrainKey, cover: number, elev: 0|1|2, blocksLOS: boolean, moveCost: number | null, work?: WorkKey }
FieldMeta   = { seed: number, nodeKind: NodeKind, weather: WeatherKey, fortBonus: number, losCap: number, groundsFighters: boolean }
Field       = { w, h, tiles: { "q,r": Tile }, deploy: { attacker: [{q,r}], defender: [{q,r}] }, meta: FieldMeta }
NodeKind    = 'city'|'town'|'depot'|'ruin'|'crossroads'
WeatherKey  = 'clear'|'rain'|'fog'|'storm'|'snow'
// generateField({ seed, nodeKind, weather, fortBonus, w=15, h=11 }) → Field   (pure, seeded, no Math.random)
// neighbors(q, r) → [{q,r}] (6, unfiltered)   ·   hexRange(field, centre, n) → [{q,r}] in-field, hexDistance ≤ n
// hexLine(a, b) → [{q,r}] inclusive of both endpoints; hexLine(a,b) === hexLine(b,a).reverse()
// lineOfSight(field, a, b) → boolean          ·   pathCost(field, from, to, opts?) → { cost, path: [{q,r}] } | null
```

### The exported surface of `base44/shared/tacticalField.ts` (freeze these names)

Lane C, Lane E and Lane J all import against these. Renaming one after merge is a contract change.

| Export | Kind | Notes |
| --- | --- | --- |
| `FIELD` | pure data literal | `{ w: 15, h: 11, deployCols: 3 }` |
| `TERRAIN` | pure data literal | 16 keys, table below |
| `PALETTES` | pure data literal | 5 keys, table below |
| `WEATHER_FIELD` | pure data literal | 5 keys, table below |
| `WORKS_SEED` | pure data literal | `{ maxLevel: 3, trenchPerLevel: 3, bunkerFromLevel: 2, depthCols: 4 }` |
| `generateField` | function | signature above |
| `neighbors` | function | `(q, r) → [{q,r}]`, the 6 axial neighbours, unfiltered |
| `hexLine` | function | `(a, b) → [{q,r}]` |
| `hexRange` | function | `(field, centre, n) → [{q,r}]` |
| `lineOfSight` | function | `(field, a, b) → boolean` |
| `pathCost` | function | `(field, from, to, opts?) → { cost, path } \| null` |

`src/lib/tactical/field.js` exports **the same eleven names with the same values**, plus the two hex
helpers moved from `data.js` (`hexPixel`, `hexCorners`), plus UI-only fields on the tables (see work item 9).

---

## Work items

A numbered, checkable list. Every minimum is a number. Do them in order — the pipeline in item 5 is
order-dependent and the properties in item 11 only hold if it is followed exactly.

### 1. `TERRAIN` — exactly these 16 keys and exactly these numbers

`moveCost: null` means **impassable**. `cover` is the defensive cover value the engine reads. `baseElev`
is the elevation a tile of this terrain starts at before the elevation pass.

| key | cover | moveCost | blocksLOS | baseElev |
| --- | --- | --- | --- | --- |
| `open` | 0 | 1 | false | 0 |
| `road` | 0 | 1 | false | 0 |
| `rail` | 1 | 1 | false | 0 |
| `field` | 1 | 1 | false | 0 |
| `rubble` | 1 | 2 | false | 0 |
| `ruins` | 2 | 2 | false | 0 |
| `building` | 3 | 2 | true | 0 |
| `wall` | 2 | null | true | 0 |
| `woods` | 2 | 2 | true | 0 |
| `hedgerow` | 2 | 2 | false | 0 |
| `crater` | 2 | 2 | false | 0 |
| `water` | 0 | null | false | 0 |
| `marsh` | 0 | 3 | false | 0 |
| `hill` | 0 | 2 | false | 1 |
| `fuel_tank` | 2 | null | true | 0 |
| `precursor_wall` | 3 | null | true | 0 |

Each row is `{ key, cover, moveCost, blocksLOS, baseElev }` in the canonical file. These are the numbers;
you do not invent others.

**These 16 keys are the repository's `TerrainKey` vocabulary and two other lanes are keyed to them** —
Lane E's `arena/terrainTokens.js` must map all 16, and Lane J's `Suspension.terrain` must carry a modifier
for all 16. Both briefs have been corrected to this list. Note in particular that §3's palette prose says
*"city (ruins, rubble, streets)"* but the canonical key is **`road`** — **there is no `street` key**, and
both of those briefs originally invented one. If you add or rename a key you break two lanes, so a change
here is a §4 amendment plus a PR-body flag addressed to Lanes E and J, never a quiet edit. If you believe one is wrong, say so in the PR body — **do not** silently change
it, and **do not** edit `docs/COMBAT_DESIGN.md` (Lane A owns it, drift guard 9).

### 2. `PALETTES` — exactly 5, each with at least 6 terrain keys and integer weights

Five palettes, keyed by `nodeKind`, each `{ key, weights: { <TerrainKey>: <positive integer> }, artery, features }`.
The weight table is a discrete distribution: pick a terrain by walking the cumulative weights against one
`rand()` draw. `artery` is the terrain the west→east arterial lane is painted with. `features` is
`{ terrain: TerrainKey, minClusters: number, maxClusters: number }` — the palette's signature blocking
feature, painted as radius-1 clusters.

| palette | required terrain keys (≥6) | `artery` | `features.terrain` | clusters |
| --- | --- | --- | --- | --- |
| `city` | `ruins, rubble, road, building, wall, open` | `road` | `building` | 3–6 |
| `town` | `building, hedgerow, field, road, woods, open` | `road` | `hedgerow` | 2–5 |
| `depot` | `fuel_tank, rail, road, rubble, open, field` | `rail` | `fuel_tank` | 2–4 |
| `ruin` | `crater, precursor_wall, rubble, marsh, open, woods` | `road` | `precursor_wall` | 2–5 |
| `crossroads` | `open, woods, road, field, hedgerow, hill` | `road` | `woods` | 2–4 |

Extra terrain keys beyond the required six are allowed in a palette's `weights`; every key used **must**
exist in `TERRAIN` (tested). Choose the weights yourself, but weight `open`/`field`-class ground heavily
enough that a typical field is not a maze — a sanity target of **≥ 55 % passable, non-LOS-blocking hexes**
across the whole field, asserted in a test.

### 3. `WEATHER_FIELD` — exactly 5 keys, exactly these numbers

Weather never repaints terrain; it adjusts LOS range and move cost, and flags grounded aircraft.

| weather | `losCap` (hexes) | `openMoveAdd` | `woodsMoveAdd` | `groundsFighters` |
| --- | --- | --- | --- | --- |
| `clear` | 99 | 0 | 0 | false |
| `rain` | 7 | 1 | 0 | false |
| `fog` | 4 | 0 | 0 | false |
| `snow` | 6 | 1 | 1 | false |
| `storm` | 8 | 1 | 0 | **true** |

`openMoveAdd` applies to tiles whose terrain is in `OPEN_GROUND = ['open', 'field', 'crater', 'marsh']`
only — `road` and `rail` are explicitly **exempt** (a metalled lane is why the arterial exists).
`woodsMoveAdd` applies to `woods` only. Impassable tiles (`moveCost === null`) are never modified.
`losCap` lands on `field.meta.losCap`; `groundsFighters` lands on `field.meta.groundsFighters` (Lane C
enforces the grounding — you only report it).

### 4. `generateField` — signature, seeding and defence

```js
generateField({ seed, nodeKind, weather, fortBonus, w = FIELD.w, h = FIELD.h })
```

- Unknown `nodeKind` falls back to `'crossroads'`; unknown `weather` falls back to `'clear'`. Never throw.
- `w`/`h` are coerced with `Math.max(9, Math.floor(w))` / `Math.max(7, Math.floor(h))`. Defaults 15 / 11.
- The RNG seed is derived from **every** input, so a different node kind or weather gives a different
  field for the same numeric seed. Use exactly this, so the derivation is reproducible across the mirror:

```js
const hashStr = (s) => {
  let x = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
  return x >>> 0;
};
const rand = mulberry32(((seed >>> 0) ^ hashStr(`${kind}|${wx}|${fb}|${w}x${h}`)) >>> 0);
```

  where `kind`/`wx`/`fb` are the **post-fallback, post-clamp** values. Draw every random number from this
  one `rand` — no second generator, no `Date.now()`, and **no `Math.random` anywhere in the lane**.
- `generateField` is **pure**: same arguments in, deep-equal object out, no mutation of its argument, no
  module-level mutable state.

### 5. The generation pipeline — 10 ordered steps, implement in this order

The four acceptance properties are properties **of this order**. Changing it breaks them.

1. **Seed.** Normalise inputs, build `rand` per item 4.
2. **Paint.** For every hex `q ∈ [0, w)`, `r ∈ [0, h)`, draw a terrain from the palette weights. Tile
   gets `terrain`, and `cover`/`moveCost`/`blocksLOS` copied from `TERRAIN[terrain]`, `elev` = `baseElev`.
3. **Artery.** Carve one west→east lane: start at `r = (h/2)|0` in column `q = 0`; for each column
   `q = 0…w-1` set that hex's terrain to the palette's `artery` (refreshing cover/moveCost/blocksLOS/elev
   from `TERRAIN`), then drift `r` by `-1`, `0` or `+1` on the next column via `rand()` (thirds), clamped
   to `[0, h)`. This lane is the connectivity backbone.
4. **Features.** Place `minClusters + (rand() * (maxClusters - minClusters + 1) | 0)` clusters of
   `features.terrain`. Each cluster: a centre hex drawn uniformly from `q ∈ [2, w-3]`, `r ∈ [0, h)`, plus
   each of its in-field neighbours with probability `0.5`. Never paint a feature onto an artery hex.
5. **Elevation.** Place `1 + (rand() * 3 | 0)` elevation blobs (so 1–3). Each blob: a centre drawn from
   `q ∈ [3, w-4]`, `r ∈ [0, h)`; the centre and its in-field neighbours get `elev = 1`; with probability
   `1/3` the centre gets `elev = 2`. Elevation never changes terrain, cover, moveCost or blocksLOS.
6. **Weather.** Apply `openMoveAdd` / `woodsMoveAdd` per item 3. Record `losCap` and `groundsFighters`
   into `meta`.
7. **Deploy zones.** `deploy.attacker` = every hex with `q < FIELD.deployCols` (columns 0,1,2);
   `deploy.defender` = every hex with `q >= w - FIELD.deployCols` (columns `w-3, w-2, w-1`). At the default
   size that is **33 hexes each**. Emit them in ascending `q`, then ascending `r`.
8. **Normalise the zones.** For every deploy hex on either side: if `moveCost === null` **or**
   `blocksLOS === true`, repaint it as `open` (refresh all four terrain-derived fields from `TERRAIN`),
   then reapply the weather move adjustment. Set `elev = 0` on every deploy hex. After this step no deploy
   hex is a blocker — this is what makes acceptance property 2 true by construction.
9. **Works.** Seed defender works per item 6 (below).
10. **Connectivity repair.** Per item 7 (below). Nothing runs after it; return the frozen object.

Return `{ w, h, tiles, deploy, meta }` with `meta = { seed, nodeKind, weather, fortBonus, losCap, groundsFighters }`
(the post-fallback values, and `fortBonus` post-clamp).

### 6. `fortBonus` works seeding — exact counts

```js
const fb = Math.max(0, Math.min(WORKS_SEED.maxLevel, Math.floor(fortBonus || 0)));   // 0..3
const trenches = fb * WORKS_SEED.trenchPerLevel;                                     // 0, 3, 6, 9
const bunkers  = Math.max(0, fb - (WORKS_SEED.bunkerFromLevel - 1));                 // 0, 0, 1, 2
```

- Candidate hexes: the **defender's last `WORKS_SEED.depthCols = 4` columns** — `q ∈ [w-4, w-1]` — i.e.
  the 3-column deploy zone plus the one column in front of it. At the default size that is 44 candidates,
  comfortably more than the 11 works at `fb = 3`.
- Draw candidates with `rand`; never place two works on the same hex; place all trenches first, then bunkers.
- Before writing `work`, normalise the hex the same way step 8 does: if it is impassable or LOS-blocking,
  repaint it `open` first. **A work never makes a tile impassable and never sets `blocksLOS`** — the tile's
  `cover`, `blocksLOS` and `moveCost` stay **terrain-only**.
- The tile's `work` value is the string key only (`'trench'` or `'bunker'`). The mechanical effect of a
  work lives in Lane A's `DEPLOYABLES` and is applied by Lane C at resolution time. **Do not import
  `DEPLOYABLES`, do not duplicate its numbers, do not fold work cover into `tile.cover`.** This is the
  single most likely place for this lane to drift into Lane A's territory.
- `fb === 0` places **zero** works and adds **no** `work` key to any tile.

### 7. Connectivity repair — the last step, and the reason property 3 holds

1. BFS flood-fill from `deploy.attacker[0]` across hexes with `moveCost !== null`, moving only between
   the 6 axial neighbours.
2. For every hex in `deploy.attacker ∪ deploy.defender` **not** reached: compute the straight `hexLine`
   from `deploy.attacker[0]` to it, and repaint every impassable hex on that line as `open` (refreshing
   the terrain-derived fields, reapplying the weather move adjustment, leaving any `work` and `elev` intact).
3. Re-run the flood. Repeat at most **8** times; if a hex is still unreached after 8 passes, repaint the
   entire hexLine to `open` unconditionally. The loop must terminate — assert it does with a guard counter.

Because `hexLine` is deterministic and `rand` is not consulted here, repair is deterministic too.

### 8. The hex toolkit — five functions, exact semantics

- **`neighbors(q, r)`** → the 6 axial neighbours in this fixed order:
  `[+1,0], [+1,-1], [0,-1], [-1,0], [-1,+1], [0,+1]`. Unfiltered — the caller bounds-checks. The order is
  fixed so that BFS/A* tie-breaking is deterministic.
- **`hexRange(field, centre, n)`** → every in-field hex with `hexDistance(centre, hex) <= n`, including the
  centre, in ascending `q` then ascending `r`.
- **`hexLine(a, b)`** → the hex line, inclusive of both endpoints, `a` first. **Symmetry is mandatory:**
  implement it by canonicalising first — if `(a.q, a.r)` is lexicographically greater than `(b.q, b.r)`,
  compute the line for `(b, a)` and return it reversed. Only then do the cube-lerp, and apply the
  tie-breaking epsilon (`+1e-6` on the cube coordinates) **after** canonicalisation. Without this,
  floating-point rounding makes `hexLine(a,b)` and `hexLine(b,a)` disagree on ties and LOS stops being
  symmetric — which is acceptance property 4.
- **`lineOfSight(field, a, b)`** → `true` when **both** hold:
  1. `hexDistance(a, b) <= field.meta.losCap`;
  2. no **intermediate** hex of `hexLine(a, b)` (endpoints excluded) blocks. An intermediate hex blocks
     when its `blocksLOS === true` **and** its `elev` is `>= Math.min(tileElev(a), tileElev(b))`. A blocker
     that sits strictly lower than both endpoints does not block (you are shooting over it). Endpoints are
     never blockers. A hex outside the field never blocks.
  Both conditions are symmetric in `a` and `b` by construction — keep them that way.
- **`pathCost(field, from, to, opts = {})`** → A* over `moveCost`, entry-cost model (moving **into** a hex
  costs that hex's `moveCost`; the starting hex costs nothing). Returns `{ cost, path }` with `path`
  inclusive of both endpoints, or `null` when unreachable. `moveCost === null` is impassable.
  `opts.blocked` is an optional array or `Set` of `"q,r"` keys treated as impassable (Lane C passes the
  occupied hexes); the `to` hex is pathable even when it appears in `opts.blocked` **only if**
  `opts.allowBlockedTarget === true`, otherwise it is impassable like any other. Heuristic: `hexDistance`
  times the cheapest `moveCost` in `TERRAIN` (which is `1`), so the heuristic is admissible. Tie-break the
  open set by `(f, then h, then q, then r)` so the returned path is deterministic.

### 9. The frontend mirror `src/lib/tactical/field.js`

- Exports the **same eleven names** as `tacticalField.ts` with **deep-equal values** for the five data
  tables (`FIELD`, `TERRAIN`, `PALETTES`, `WEATHER_FIELD`, `WORKS_SEED`) and behaviourally identical
  functions. The mirror test enforces the tables; a runtime test enforces `generateField` parity
  (item 12).
- The mirror **may** add UI-only fields to the table rows, from this allowlist and no other:
  `label`, `short`, `blurb`, `desc`, `icon`, `fill`. Give every `TERRAIN` row a `label` and a `blurb` in
  **Ministry voice** (in-world military-ministry English — *“Brick and rafter, still standing enough to
  fight from.”*, never *“Building tile: +3 cover”*). `fill`, if you use it, is a design token string such
  as `"hsl(var(--steel))"` — **never a hex colour** (drift guard 4).
- **Move exactly two helpers out of `src/lib/tactical/data.js` into this file: `hexPixel` and `hexCorners`.**
  Copy their current bodies verbatim:

```js
export const hexPixel = (q, r, size) => ({ x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r });
export const hexCorners = (size) =>
  [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(size * Math.cos(a)).toFixed(2)},${(size * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
```

  **Do not move, copy or touch `hexDistance`, `dominantTroop` or `formationSize`** — they are rules/troop
  meta and stay with Lane A. No component currently imports `hexPixel` or `hexCorners` (verified), so the
  move breaks nothing.
- **You do not delete them from `data.js`** — that file is Lane A's. Until Lane A merges, the two helpers
  exist in both places, which is harmless duplication. See *Coordination with Lane A* below.
- `field.js` may import from `@/lib/...` only. It must **never** import anything under `base44/`.
  `tacticalField.ts` must never import anything under `src/`.

### 10. Purity rules for both files (mirror-test survival)

`test/helpers/extract-const.js` lifts a table out of the source **textually** and evaluates it with
`new Function`. That imposes hard constraints on the five data tables:

- Every table is a **pure data literal**: `export const NAME = { ... };` or `export const NAME = [ ... ];`
  containing only numbers, strings, booleans, `null`, and nested objects/arrays.
- **No spreads** (`...BASE`), **no computed keys** (`[k]:`), **no function calls**, **no template literals
  in keys**, no references to other module identifiers, no `Object.fromEntries`, no `.map()` building the
  table from a compact encoding. A computed table cannot be mirror-tested and the extractor throws
  `ReferenceError` by design.
- Trailing chained array transforms are technically allowlisted by the extractor, but **do not use them** —
  write the tables out longhand on both sides.
- Derived values such as `TERRAIN_KEYS` may be computed (`Object.keys(TERRAIN)`) because they are not
  mirror-tested tables; keep them below the literals.
- Deno rules for `tacticalField.ts` (CLAUDE.md “Gotchas”): no module-top-level `await` or `throw`, relative
  imports carry the `.ts` extension, no `npm:` imports needed here.

### 11. `test/tactical-field.test.js` — the four acceptance properties as real property tests

Minimum shape: **at least 6 `describe()` blocks and at least 18 `it()` cases.** The property tests run
over a **corpus of at least 200 fields**, built once at module scope as the cross-product of the **5**
`nodeKind` values × the **5** `weather` values × **8** fixed seeds (`[1, 7, 42, 137, 1917, 2044, 31337, 65535]`),
= **200 fields**, with `fortBonus` cycled `0,1,2,3` across the corpus so every level is exercised.

1. **`same seed → identical field`** (§3, property 1). For all 200 corpus entries, call `generateField`
   twice with identical arguments and assert `JSON.stringify(a) === JSON.stringify(b)`. **Plus the
   anti-cheat:** assert that across the corpus **at least 95 %** of the 200 serialised fields are
   distinct — determinism achieved by ignoring the seed is not determinism. **Plus:** assert that changing
   only `nodeKind`, only `weather`, or only `fortBonus` (seed held fixed) changes the output.
2. **`deploy zones always free of blockers`** (§3, property 2). For all 200 fields: every hex in
   `deploy.attacker` and in `deploy.defender` exists in `tiles`, has `moveCost !== null`, has
   `blocksLOS === false`, and has `elev === 0`; and each zone has exactly `FIELD.deployCols * h` = **33**
   hexes with no duplicates.
3. **`every deploy hex reachable from the opposite side`** (§3, property 3). For all 200 fields: one BFS
   flood from `deploy.attacker[0]` over passable hexes reaches **every** hex of `deploy.defender` **and**
   every hex of `deploy.attacker`. Then, per field, assert `pathCost(field, deploy.attacker[0], lastDefenderHex)`
   returns a finite `cost > 0` with a `path` whose first and last entries are the endpoints and whose
   consecutive entries are `hexDistance === 1` apart — so `pathCost` agrees with the flood rather than
   the flood standing in for it.
4. **`LOS symmetric`** (§3, property 4). For all 200 fields, sample **60 deterministic hex pairs**
   (indices derived from the field index, not `Math.random`) and assert
   `lineOfSight(f, a, b) === lineOfSight(f, b, a)` for every pair — **12 000 assertions minimum**. Plus
   assert `hexLine(a, b)` deep-equals `hexLine(b, a).slice().reverse()` for the same pairs, and that
   `lineOfSight` returns `false` for any pair beyond `field.meta.losCap` even on a completely open line.

### 12. The remaining unit tests (same file)

5. **Mirror.** Using `readRepoFile` + `extractConst` from `test/helpers/extract-const.js`, lift `FIELD`,
   `TERRAIN`, `PALETTES`, `WEATHER_FIELD` and `WORKS_SEED` out of `base44/shared/tacticalField.ts` and
   deep-equal each against the `src/lib/tactical/field.js` import, after stripping the UI-only allowlist
   (`label, short, blurb, desc, icon, fill`) from the mirror rows. **5 tables = 5 assertions minimum.**
6. **`mulberry32` fidelity.** Import `mulberry32` from `@/lib/macro/worlds` and assert the first **5**
   outputs of your copy for seed `12345` equal the first 5 of the existing one, to 12 decimal places.
   This proves the copy is faithful without importing the platform-owned Deno file.
7. **`generateField` parity across the mirror.** For **10** corpus entries, assert the canonical
   `tacticalField.ts` output and the `field.js` mirror output are `JSON.stringify`-identical.
8. **Works seeding.** For `fortBonus` `0, 1, 2, 3, 7`, assert the exact trench/bunker counts
   `0/0, 3/0, 6/1, 9/2, 9/2` (7 clamps to 3); assert every worked hex has `q >= w - 4`; assert no worked
   hex is impassable or LOS-blocking; assert `fortBonus: 0` produces **zero** tiles carrying a `work` key.
9. **Weather.** For each of the 5 weather keys, assert `meta.losCap` and `meta.groundsFighters` match
   `WEATHER_FIELD`, that `road`/`rail` tiles never gained move cost, and that in `rain` and `snow` a
   sampled `open` tile costs exactly `TERRAIN.open.moveCost + 1`.
10. **Palette integrity.** Exactly **5** palettes; each declares **≥ 6** terrain keys; every key used by
    every palette (weights, `artery`, `features.terrain`) exists in `TERRAIN`; each generated field uses
    **≥ 4** distinct terrain keys; **≥ 55 %** of hexes are passable and non-LOS-blocking.
11. **Tile shape.** For a sample field, every one of the `w * h` = **165** keys matches `/^\d+,\d+$/`, every
    tile has exactly the keys `terrain, cover, elev, blocksLOS, moveCost` (plus `work` where present and
    **never** `work: null` or `work: undefined`), and every `terrain` is a key of `TERRAIN`.
12. **No `Math.random`.** Read both source files as text with `readRepoFile` and assert neither contains
    `Math.random`. Assert `base44/shared/tacticalField.ts` contains no `gameEngine` string and no import
    from `src/`, and that `src/lib/tactical/field.js` contains no `base44/` import.

### 13. PR body

Title: `tactical(b): field generator, terrain palettes and hex toolkit`. Body must list:
the §4 sections touched (with the `## §4 amendment` heading and the appended block quoted), the test names
added, the dependency on Lane A continuing to export `hexDistance` from `base44/shared/tactical.ts`, the
note that `hexPixel`/`hexCorners` are duplicated until Lane A removes them from `data.js`, and any number
in item 1/2/3 you believe is wrong (flagged, not changed).

---

## Acceptance criteria

**Copied verbatim from §3, “Lane B — Field generator”:**

> Acceptance: same seed → identical field; deploy zones always free of blockers; every deploy hex
> reachable from the opposite side; LOS symmetric.

Each of those four is a **property test over the ≥200-field corpus** per work item 11 — not a spot check,
not an example, not a comment. In addition, this lane is accepted only when all of the following are true
and demonstrable by running something:

| # | Criterion | Checked by |
| --- | --- | --- |
| B1 | `TERRAIN` has exactly the 16 keys with exactly the numbers in work item 1 | test 10/11 + review of the table |
| B2 | `PALETTES` has exactly 5 entries, each with ≥ 6 terrain keys, all keys valid | test 10 |
| B3 | `WEATHER_FIELD` has exactly 5 entries with the exact `losCap`/move numbers | test 9 |
| B4 | Works counts are exactly `0/0, 3/0, 6/1, 9/2` for `fortBonus` 0–3 and clamp above 3 | test 8 |
| B5 | Works never alter `cover`, `blocksLOS` or `moveCost`; `DEPLOYABLES` is never imported | test 8 + `grep -n DEPLOYABLES base44/shared/tacticalField.ts src/lib/tactical/field.js` returns nothing |
| B6 | `mulberry32` is copied, not imported, and is bit-faithful | test 6 |
| B7 | No `Math.random`, no `Date.now`, no cross-layer import in either file | test 12 |
| B8 | Canonical and mirror produce byte-identical fields | test 7 |
| B9 | All five data tables are pure literals and survive `extractConst` | test 5 |
| B10 | `hexPixel` + `hexCorners` exist in `field.js`; `hexDistance`/`dominantTroop`/`formationSize` were not moved | `grep -n "hexPixel\|hexCorners\|hexDistance\|dominantTroop\|formationSize" src/lib/tactical/field.js` |
| B11 | `data.js`, `tactical.ts`, `tacticalEngine.ts` and `gameEngine/entry.ts` are untouched | `git status --porcelain` lists only the three owned files + the §4 amendment |
| B12 | ≥ 6 `describe()` and ≥ 18 `it()` in `test/tactical-field.test.js` | `grep -c "describe(" / "it("` |

---

## Drift guards

**The §6 list, in full, as it applies to you:**

1. **The One Critical Invariant** — every table exported from `base44/shared/tacticalField.ts` has a
   deep-equal mirror in `src/lib/tactical/field.js`, enforced by your own `test/tactical-field.test.js`.
   UI-only fields are allowlisted in the test (`label, short, blurb, desc, icon, fill`) and nowhere else.
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations, autoFormations,
   autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported. You do not open that
   file at all, so honour this by not touching it. Your own eleven exports become frozen the moment this
   lane merges.
3. **No new dependencies. `package.json` is not touched by any worktree lane** — and neither is
   `package-lock.json`.
4. **Design tokens only** — no hex colours anywhere; if a mirror row carries a `fill`, it is
   `hsl(var(--brass))`-style. Tailwind classes must be literal strings (you write no JSX, so this only
   binds any class string you might put in a mirror row — prefer none).
5. **Ministry voice** in every user-visible string; PII never rendered. Every `label`/`blurb` you author is
   in-world military-ministry English.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only. You author no components; the
   `@/`-imports-only rule binds `src/lib/tactical/field.js`.
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from the mirror,
   never retyped. Your blurbs describe; they never restate a number that also lives in a table.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and flags
   `docs/GAME_RULES.md` for the platform lane. **You do not own `docs/COMBAT_DESIGN.md`** (Lane A does), so
   the numbers in this brief are the numbers: if one must change, flag it in the PR body and let Lane A or
   the orchestrator carry it into the doc.
10. **Content lanes never ship visuals** — not your lane, but the second half binds you:
    **existing catalog keys are never renamed or removed — live saves reference them.** Once `TERRAIN`,
    `PALETTES`, `WEATHER_FIELD` and `WORKS_SEED` merge, their keys are permanent; add rows, never rename
    or delete one. Every new mechanical effect uses the §4 effect-key vocabulary or extends it in the same PR.
11. **Arms granularity stays numeric and server-rolled** — no `Math.random`, seeded rolls only. Yours is
    `mulberry32` from one seed derived from every input.
12. **One damage model** — armour math exists only in Lane I's `arms.ts`. Your files contain **no** armour,
    penetration or damage arithmetic of any kind. Cover is terrain metadata, not a damage calculation.
13. **Mechanized granularity mirrors arms** — not your lane, except that Lane J's `Suspension.terrain` is
    keyed by **your** `TerrainKey` vocabulary, which is why you publish it to §4.

**Environment rules — absolute, and they override convenience:**

- **Never run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store (`/home/blae/.node-modules-store/rust-legions/node_modules`)
  and npm silently **deletes the symlink and reifies a real directory**, orphaning the store. Dependencies
  are already installed. There is no config knob that prevents this.
- **Never edit `package.json` or `package-lock.json`** (drift guard 3).
- Run tests with `npm test` (`vitest run`) and lint with `npm run lint` from the repository root.
- **Every table exported from a `base44/shared/*.ts` file MUST be a PURE DATA LITERAL** —
  `export const NAME = { ... }` / `[ ... ]`, with no spreads, no computed keys, no function calls and no
  template literals in keys — because the mirror tests lift it **textually** with
  `test/helpers/extract-const.js` and evaluate it. A table that is computed cannot be mirror-tested.
- `@/` imports only inside `src/`; never a relative `src/` path.
- No hex colours; no non-literal Tailwind class strings.
- Ministry voice in every user-visible string.
- Components ≤ ~60 lines, one per file.
- Existing catalog keys are **never** renamed or removed — live saves reference them.
- Numbers live in one place: any constant shown in UI copy is imported from `src/lib`, never retyped.

**Coordination with Lane A (the one cross-lane dependency in this lane):**

- Lane A owns `src/lib/tactical/data.js` and `base44/shared/tactical.ts`. You **create** `field.js` with
  `hexPixel`/`hexCorners`; **Lane A** re-points `data.js` at them afterwards. You never edit `data.js` —
  not to delete, not to re-export, not to add a comment.
- **Lane A's brief now carries the reciprocal half of this protocol verbatim, so do not renegotiate it:**
  Lane A keeps both helpers in `data.js` for the whole of P1 (Lane E's `arena/hexGeometry.js` imports them
  from `@/lib/tactical/data` and would break otherwise), and replaces them with
  `export { hexPixel, hexCorners } from "@/lib/tactical/field";` in a follow-up **after** you merge.
  The duplication between merge and follow-up is expected, is not drift, and is not yours to tidy.
- **After Lane A merges to `main`, rebase onto `main`** (`git fetch origin && git rebase origin/main`),
  re-run `npm test` and `npm run lint`, and fix any fallout **inside your three files only**. Expect two
  possible outcomes: (a) the helpers are gone from `data.js` — nothing to do, your `field.js` is now the
  sole definition; (b) they are still there — that is Lane A's outstanding work, so **flag it in your PR
  body and leave it**. Do not "tidy" it.
- Your `tacticalField.ts` imports `hexDistance` from `./tactical.ts` and your `field.js` imports it from
  `@/lib/tactical/data`. If Lane A's merge changes either, fix your import, not their export.
- `tacticalEngine.ts` currently declares `GRID = { w: 9, h: 7 }` and `MAX_FORMATIONS = 10`. Moving to
  15×11 and 24 squads is **Lane C's** work against your `FIELD`. Do not pre-empt it.

**Git protocol (§7):**

- Repository `https://github.com/blae-code/rust-legions`, integration branch `main`, two-way synced with
  the Base44 Builder — a red merge to `main` breaks the live preview.
- This lane works in its **own git worktree** on branch **`feat/tactical-b`**, pushes to
  `origin/feat/tactical-b`, and opens a PR against `main`. PR title `tactical(b): <summary>`; body lists
  the contract sections touched and the test names added.
- It never edits another lane's files. If a contract must change it edits `docs/TACTICAL_SQUAD_PLAN.md` §4
  **first** and says so in the PR body (see the authorised append in *Owned files*).
- **Never** `git checkout`, `git branch`, `git merge`, or force-push. The orchestrator merges, in §5 order,
  re-running `npm test` after each merge. **If the message that launches you says the orchestrator owns
  all git state, that instruction wins**: make no commits, no pushes, no branch operations — leave your
  work in the working tree and report the file list.

---

## Definition of done

Run these, from the repository root, in this order. Green means exactly what is written in the right column.

| # | Command | Green looks like |
| --- | --- | --- |
| 1 | `npm test` | Zero failures, zero skipped, and `test/tactical-field.test.js` in the run with **≥ 18** passing cases. **Do not gate on an absolute file or test count** — `main` carried 6 files / 95 tests before this wave, but Lane A (and, on the content track, Lanes I/J/F/G) may already have merged when you rebase, each adding files and tests. Read the totals off your own run after `git rebase origin/main`; the only fixed numbers here are *0 failed* and *your ≥18*. |
| 2 | `npm run lint` | Exits 0 with no output (`eslint . --quiet` prints nothing when clean). |
| 3 | `bash .claude/hooks/rules-guard.sh < /dev/null` | Exits 0. It is a passive reminder and never blocks; a non-zero exit means something is wrong with the hook itself. |
| 4 | `npm run rules:check` | The mirror + combat-math suites still pass — proof you did not disturb the existing invariant. |
| 5 | `git status --porcelain` | Exactly four paths: `base44/shared/tacticalField.ts`, `src/lib/tactical/field.js`, `test/tactical-field.test.js`, `docs/TACTICAL_SQUAD_PLAN.md`. Anything else means you edited a file you do not own — revert it. |
| 6 | `grep -rn "Math.random\|Date.now" base44/shared/tacticalField.ts src/lib/tactical/field.js` | No output. |
| 7 | `grep -n "DEPLOYABLES\|armourValue\|armorPen" base44/shared/tacticalField.ts src/lib/tactical/field.js` | No output (drift guards 5 and 12). |
| 8 | `grep -c "it(" test/tactical-field.test.js` | **≥ 18**. And `grep -c "describe(" test/tactical-field.test.js` → **≥ 6**. |
| 9 | `grep -n "hexPixel\|hexCorners" src/lib/tactical/field.js` | Two hits — both present. And `grep -n "dominantTroop\|formationSize" src/lib/tactical/field.js` → no output. |
| 10 | `grep -n "0x6d2b79f5" base44/shared/tacticalField.ts src/lib/tactical/field.js` | One hit in each file — `mulberry32` copied into both, imported from nowhere. |

Then, and only then, write the PR body per work item 13. If step 1 or 2 is red, the lane is not done —
fix it inside your three owned files, or report the blocker; never make another lane's file green for it.

---

## ORCHESTRATOR RULINGS — 2026-09-01 (AUTHORITATIVE, supersedes anything above)

The brief you are reading was written before the contract was audited. Six genuine contradictions were
found **inside `docs/TACTICAL_SQUAD_PLAN.md`** and have been resolved by the orchestrator and written
into the plan. They are settled. **Do not re-litigate them, and do not file an amendment for any of
them** — a lane that files a competing amendment for a decided question will have its PR rejected.

| # | Question | Ruling |
| --- | --- | --- |
| Q1 | `tacticalOrders` declared `action` twice in §4 | The squad action key is **`orderAction`**. The envelope key `action` stays the gameEngine dispatch verb. Already fixed in §4. Lanes C, D and E consume `orderAction`. Lane E does **not** file this amendment any more. `gameEngine` reading `body.orderAction` is a platform-handoff item. |
| Q2 | §5 was circular about where Lane F sits | The executed wave order is now a table in §5: **1)** I, B, G · **2)** A, J · **3)** C, F · **4)** H · *platform handoff* · **5)** D, E. Your wave is fixed. Do not start early; do not assume a lane you depend on is unmerged. |
| Q3 | §3 Lane H `uniqueRoster` was missing `patterns` | §4 governs; §3 is fixed to `{ squads, upgrades, decree, patterns }`. Lane H does not file this. |
| Q3b | Does `Preset` need a `keel` field? | **No.** The required `keel_<key>` plate is keyed off the existing `house` value. Do not add a field. |
| Q4 | §3 Lane G cited `VISION §5` for the ideology axes | Wrong section — the axes are **`VISION §6.1`** (§5 is the macro map). Fixed in §3. Lane G does not file this. |
| Q5 | figures↔companies stated two ways | **`FIGURES_PER_COMPANY` is keyed by REGIMENT, never by squad type.** A squad type's `figures` is its own default squad size and may differ from its source regiment's company size. `riflemen`-derived = 10 and `crawler`/`artillery`/`fighter` = 1 are hard values, asserted in Lane A's tests. Fixed in §4. |
| Q6 | §0 said `hexPixel`/`hexCorners` live in `data.js` | They move to `field.js` with Lane B, and `data.js` **re-exports** them so no consumer's import path ever breaks. Noted in §0. |

**One more standing ruling — the pts anchor:** `SquadType.pts` is the cost of the **squad**, not of a
figure. `SQUAD_TYPES.riflemen.pts === 100` (a 10-figure squad). Every Points Audit is computed against
that. If your brief says `10`, it is wrong; `100` is correct.

**Baseline note:** `main` was RED when this wave started (6 failing tests, 1 lint error, all
pre-existing and unrelated to this plan). It was repaired first — `main` is green at 95 passing tests
before your lane begins. Do not record an absolute test count as your success gate; other lanes add
tests. Your gate is **0 failed** plus your own lane's named tests passing.

