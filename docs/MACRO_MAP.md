# Rust Legions — The Macro Map (LOCKED spec, v2)

**Status: `[LOCKED]` — owner decision 2026-07-18.** This supersedes the v1 lock
(orbital 3D globe). The macro map is now **The Ministry Chart**: a flat,
pannable, zoomable fantasy war-chart. The hex world model has been **deleted
outright** (not retired) — macro is the only game.

## 1. The decision, in one line

**One flat ministry tactical chart per campaign: a dark survey board with a
brass grid, landmass silhouettes grown around the settlement clusters, glowing
route lines, and node reticles — pannable and zoomable like a real war atlas.**

### Locked choices (2026-07-18)

| Decision | Locked to |
| --- | --- |
| **Art direction** | **Ministry tactical chart** — blueprint/schematic: dark board, brass survey grid, glowing quality-coded routes, brass node reticles, abstracted landmass silhouettes with double-inked coastlines. Not painterly, not a globe. |
| **World geometry** | **Flat cartesian plane** (1000 × 620 chart units), full pan + wheel-zoom (×1–×7, cursor-anchored). |
| **Geography rule** | **Nodes come first; land forms around them.** Continents are grown around node clusters (coast pushed past the farthest settlement + margin), so **no settlement can ever stand in the ocean** — CI-locked by a point-in-polygon test. |
| **Between continents** | **Convoy Lanes** — sea routes (quality `sealane`, ×0.6 pace) bridging landmasses by their closest coastal pair; drawn as bowed dashed arcs. Every settlement stays reachable. The fortress-base is land-only. |
| **Hexes** | **Deleted.** Boards, tiles, hex actions, hex maps, `generateMap` — all removed from client and engine. |

## 2. The renderer

`src/components/chart/MinistryChart.jsx` — one SVG surface used by:
- **MacroWarRoom** (in play — fog-filtered server state, orders, columns, base)
- **The War Table** (`/star-map` — sandbox planning + march planner)
- **The Cartography Bureau** (`/map-editor` — node placement + live world survey)
- **Map Library / world picker** (silhouette previews)

Layers: board + survey grid → landmass silhouettes (double coastline) → routes
(quality colors; sealanes bowed + dashed) → glowing march plots → node reticles
(kind-shaped: city ringed crosshair, depot square, ruin dashed, crossroads
small) → control rings (faction color) → fortress-base corner brackets
(pulsing) → column beacons (pulsing, labeled) → HTML radial orders menu pinned
over the node. Fog: geography public, unobserved intel dimmed.

## 3. World generation (mirrored client/server, seeded)

`src/lib/macro/worlds.js` ↔ `gameEngine` macro block:
1. Scatter cluster centers (≥330 units apart), grow settlements around each
   (min separation 26, named from the ministry pools).
2. `buildWorldFromNodes` — the single world-builder, also consumed by the
   Cartography Bureau's charts: cluster nodes into landmasses (<170 units),
   lace 2–3 nearest-neighbor land routes (quality by distance), bridge island
   pockets, grow coastline outlines, bridge continents with Convoy Lanes.
3. Miles: land `clamp(30, dist × 1.1, 170)`; sea `clamp(60, dist × 0.9, 180)`
   — the 2–6-day major-neighbor band holds (CI-locked in `macro-pacing`).

Worlds catalog (`WORLDS`): Cindara (authored home continent + 2 seeded
landmasses), Veyra (3 landmasses), Morhollow (2) — each with a chart palette.
In play the server generates and **stores** the world on the Game; the stored
graph is the single truth.

## 4. The Cartography Bureau

Draft a chart by **placing settlements** on the empty board; the Ministry
grows the world around them live (same `buildWorldFromNodes`). Publish to the
registry (`GameMap { nodes, routes }`); at operation setup a charted map
replaces the generated theater world — the server rebuilds the same world from
its nodes. Guardrails: ≥8 settlements, ≥2 cities (spawn grounds).

## 5. What carried over unchanged

The whole macro engine (docs/MACRO_ENGINE.md slices M1–M3a) is
coordinate-agnostic and survived the projection swap untouched: day-rate
marching, dawn resolution, fog, income, control, mass battles, supply
envelope, base movement (now land-only), NPC expansion. The march planner,
tactical overlay analysis, and radial orders menu all carried over.
