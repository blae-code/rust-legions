# Rust Legions — The Macro Map (LOCKED spec)

**Status: `[LOCKED]` — the canonical form of the v2.x macro world.** This resolves
the "three conflicting map systems" problem and supersedes the open art/scale
questions in [`VISION.md`](./VISION.md) §5.6. It is a **presentation + world-model
lock**; the server wiring into `gameEngine` remains a later v2.x phase (see §7).
Nothing here changes the shipped hex game, which stays authoritative in play until
the redesign ships (VISION §9 working agreement).

---

## 1. The decision, in one line

**There is one macro map: a single gritty 3D planet you orbit, with a glowing
industrial node-and-route overlay floating above its crust.** The Star Chart
becomes that map; the flat Macro March Lab is absorbed into it and retired as a
player-facing screen; the hex board is retired for macro play (per VISION §5).

### Locked choices (2026-07-16)

| Decision | Locked to |
| --- | --- |
| **Art direction** | **Orbital relief globe + HUD overlay** — the solid procedural rust-planet is kept as a real 3D model; nodes, routes, marches, and intel render as a brass industrial tactical layer lifted just off the crust. Not a hologram, not a matte relief. |
| **World scale** | **The whole planet** — the entire sphere is the play area (~50–60 nodes), full wraparound orbit. |
| **Planet source** | **Curated library, one per campaign** — the host picks a planet at setup, exactly as maps are chosen today. |

---

## 2. Why this is not a rewrite

The three "systems" already share **one logic spine**, so the movement brain needs
no merging:

- [`src/lib/macro/graph.js`](../src/lib/macro/graph.js) — the graph data: nodes +
  routes as `[a, b, miles, quality]`. The **logic layer** (VISION §5.1).
- [`src/lib/macro/march.js`](../src/lib/macro/march.js) — day-rate Dijkstra
  (`findPath` / `planMarch` / `armyDayRate`). **Coordinate-agnostic** — it consumes
  miles + route quality, not 2D or 3D positions. Already used by *both* screens.
- [`src/lib/macro/planets.js`](../src/lib/macro/planets.js) — projects the same
  nodes onto a sphere via `latLonToXYZ` and seeds more. A **presentation
  projection** of the graph, not a second world.

The Star Chart (`/star-map`) already renders ~80% of the target: procedural
rust/soot/crater planet, dust storms, atmosphere, lat/lon-pinned nodes,
**true great-circle routes** (slerp), an animated convoy on a *real* `planMarch`
plan, and a radial orders menu. The Macro Lab (`/macro-lab`) holds the logistics
depth the Chart lacks. The merge is: **promote the Chart to canonical, port three
Lab panels onto it, unify the data model on lat/lon.**

---

## 3. World model (the "layout" lock)

### 3.1 A planet = one campaign world
- One campaign is fought on **one planet**: a full sphere carrying a single
  connected node-and-route graph over ~50–60 nodes (Cindara's current 15 authored
  + 45 seeded ≈ 60 is the reference density).
- Planets live in a **curated library** — the host picks one at game setup. Start
  as the code-level `PLANETS` catalog; the eventual home is a `World`/`Planet`
  entity (the v2.x successor to `GameMap`, when the map editor becomes a graph
  editor — VISION §5.5). Each planet record carries: `id`, `name`, `blurb`,
  `radius`, `spin`, `seed`, `palette`, `nodes[]`, `routes[]`.

### 3.2 Canonical coordinates: lat/lon
- **`lat`/`lon` is the single source of node position.** The legacy `x`/`y` grid
  in `graph.js` (0–100 × 0–70 flat space) is **retired** — it only served the flat
  SVG board. Authored planets place nodes by lat/lon directly (as `planets.js`
  already does for seeded settlements).
- Routes stay `[a, b, miles, quality]`. **Miles are authored/derived, independent
  of arc length** — they drive `planMarch`; the great-circle arc is only how the
  route is *drawn*. (Seeded routes currently derive miles from angular distance;
  authored routes may hand-tune them for pacing.)

### 3.3 Node taxonomy (markers)
Locks the *marker vocabulary* for the overlay. Gameplay roles in *italics* are
forward hooks for the v2.x wiring (§7) — presentation is locked now, numbers later.

| Kind | Marker | Forward gameplay role |
| --- | --- | --- |
| `city` (Ruined City) | large marker + `IndustrialHub` 3D model | *major settlement / minor polity, harvest + trade* |
| `town` (Township) | mid marker | *settlement, harvest + trade* |
| `depot` (Fuel Depot) | mid marker + hub model | *fuel cache / forward depot* |
| `crossroads` | small marker | *route junction; chokepoint candidate* |
| `ruin` (Deep Ruin) | small marker | *precursor dig-site candidate (relic hunt, VISION §4)* |
| `dig_site` *(new, reserved)* | excavation reticle | *precursor cache — seeded/hidden, probe-revealed* |

`crossroads` and route-choke nodes carry an optional **`chokepoint`** flag →
natural ambush/interception ground (VISION §5.4). Reserved kinds render as their
nearest existing marker until their systems land; **no new kind ships without a
gameplay role.**

### 3.4 Route taxonomy (unchanged, locked)
Four quality grades throttle march pace (`ROUTE_QUALITY` in `graph.js`):

| Grade | Pace mult | Drawn as |
| --- | --- | --- |
| `highway` (Imperial Highway) | ×1.25 | thick bright arc |
| `road` (Paved Road) | ×1.0 | medium arc |
| `track` (Dirt Track) | ×0.75 | thin arc |
| `trail` (Wilderness Trail) | ×0.5 | thin dashed arc |

Weather interaction (rain/snow slowing wheels more than boots) folds in at the
`gameEngine` wiring stage, reusing the shipped weather model.

---

## 4. The look (the "how it looks" lock)

**Orbital relief globe + industrial HUD overlay**, built in three depth layers:

1. **The planet (solid).** Keep `PlanetBody` — the procedural 1024×512 surface
   (continental blotches, oxide stains, impact craters, wind-scour, soot belts,
   ember specks, ice caps), used as `map` + `bumpMap`. Keep `DustStorm`, the cloud
   veil, the atmospheric rim-glow, the starfield. **Tune: lower surface shine
   (raise roughness / drop metalness)** so the crust reads as a matte war-relief
   and the brass overlay sits legibly on top.
2. **The overlay (brass HUD, lifted ~1.01–1.06× radius above the crust).** Nodes as
   brass markers with `IndustrialHub` works on cities/depots (rusted stacks,
   flickering furnace mouths); routes as great-circle arcs colored by grade;
   marches as brighter brass arcs with overnight `D{n}` camps and the animated
   convoy beacon; origin/dest/anchor **wireframe designators**. This is the
   "3D overlay of nodes over a 3D model of the planet."
3. **The intel layer (toggle).** The tactical overlay — supply arteries + ranked
   capture objectives — as brass great-circle arcs and billboard `OBJ {n}`
   reticles. Off by default; toggled from the HUD.

**Camera:** orbit one planet (drei `OrbitControls`, pan off, distance-clamped),
full wraparound. **Retire the three-planets-at-once staging** — a campaign shows
its one world, framed on load.

**Framing:** the existing `cq-panel cq-brackets` + hazard-stripe ministry chrome,
brass/rust dieselpunk tokens, IBM Plex Mono telemetry. Diegetic voice
("Astrocartography Directorate", "CHARTED SETTLEMENTS", "ORDERS").

---

## 5. Interaction model (locked)

- **Orbit + select.** Spin the globe; the selected world is framed on load.
- **Click a node → radial orders menu** (`NodeRadialMenu`, keep as-is): context-
  filtered verbs — Stage Column / March Here / Restage / Stand Down / Clear Plot /
  Anchor Base / Weigh Anchor. New verbs (excavate, garrison, coerce settlement)
  slot into the same `menuOptionsFor` pattern when their systems land.
- **Plan a march.** `findPath` + `planMarch` compute legs, overnight camps, and
  arrival day; the trail + convoy visualize the real plan.
- **Column composition** *(ported from Macro Lab `MarchPlanner`)* — a side panel of
  per-unit-type steppers; the **slowest ground element sets the pace**
  (`armyDayRate`), replacing the Chart's hardcoded `DAY_RATE = 16`.
- **Itemized itinerary** *(ported)* — per-leg from→to · road grade · miles · days,
  plus totals, in the readout panel.
- **Tactical overlay toggle** *(ported, re-rendered)* — see §6.

---

## 6. Build plan — reuse / port / retire

**Keep (the 3D substrate, canonical):** `PlanetBody`, `DustStorm`,
`arcMath` (`slerpSurface`/`arcPoints`), `RouteArcs`, `MarchTrail` (camps + convoy),
`NodeMarker`, `IndustrialHub`, `NodeRadialMenu` + `menuOptionsFor`, `PlanetSystem`,
the `OrbitControls`/`Rig` camera, and the shared `lib/macro/march` engine.

**Port from Macro Lab onto the 3D substrate:**
1. `MarchPlanner.jsx` — editable column composition + itemized itinerary → side
   panel driven by the plan the Chart already computes. (Drop-in.)
2. `overlay.js` — **generalize** it to accept per-planet `nodes`/`routes` (today it
   is hardwired to the global `MACRO_NODES`/`MACRO_ROUTES`). (Logic reusable.)
3. `TacticalOverlay` — **rewrite SVG → three.js**: arteries as great-circle
   `Line`s, objectives as billboard reticles. (Logic reusable; rendering not.)

**Retire (as player-facing):** the flat SVG board — `MacroGraphMap`, `RouteEdge`,
SVG `TacticalOverlay`, the `/macro-lab` route — and the `x`/`y` fields in
`graph.js`. Fold the Chart into a single canonical macro-map screen; drop the
multi-planet selector and the "plot in the Macro March Lab" footer.

**Data unification:** one node/route model on lat/lon; the planet catalog is the
one source both the renderer and `overlay.js` read.

---

## 7. What is NOT in this lock (still ahead)

This lock is the **world model + presentation + client interaction**. Deferred to
the v2.x server phase, unchanged by this doc:

- Wiring the macro map into `gameEngine` (real armies, fog of war on the graph,
  interception checks, supply envelope, base movement) — VISION §5.4/§9.
- Precursor dig-sites/relics and settlements-as-polities gameplay (VISION §4, §3.4)
  — this doc only reserves their **markers**.
- Weather/supply effects on day-cost — reuse shipped models at wiring time.
- Migration of the map editor to a **planet/graph editor** and the `World`/`Planet`
  entity — VISION §5.5.
- Open balance questions: mileage scaling so cross-planet marches stay in a sane
  range at whole-planet scale (VISION §5.6 target of 2–6 days between major
  neighbors); off-road movement; simultaneous vs sequential daily resolution.

**Working agreement (VISION §9) still applies:** the macro map remains a
client-side sandbox until the server phase is explicitly greenlit; every shipped
slice updates `docs/GAME_RULES.md`, the `src/lib/` mirrors, and files a Patch.
