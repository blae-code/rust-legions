# Rust Legions — The Macro Engine (v2.x server phase design)

**Status: greenlit 2026-07-17.** This is the docs-first design for wiring the macro
map into `gameEngine` — the server phase that [`MACRO_MAP.md`](./MACRO_MAP.md) §7
deferred and [`VISION.md`](./VISION.md) §5/§9 gates behind an explicit go-ahead.
The go-ahead has been given; this document is the contract for the implementation
slices below. Numbers marked *(tune)* are starting values, expected to move.

---

## 1. Coexistence: two world models, one engine

**Decision: macro is a new world model beside hex, not a replacement patch.**

- `Game.worldModel: "hex" | "macro"` (default `"hex"`). Chosen at operation
  setup and immutable for the life of the game.
- **Hex games are untouched.** Every existing action, rule, and NPC behavior
  runs exactly as today; the vanilla hex rules remain authoritative for hex
  games until macro reaches parity and the deprecation is explicitly decided
  (VISION §5.5: vanilla games finish on the hex engine).
- **Macro games** carry their world in a new `Game.macro` state object (§3) and
  use macro-specific actions (§5). Actions that are hex-only (`attack`,
  `moveUnits`, `build`, `moveBase`, …) reject on macro games and vice versa;
  shared systems — treasuries, factions, generals, research (`concurrentPlay`),
  diplomacy, chat, weather, patch/chronicle logging — are world-model agnostic
  and reused unchanged.
- The macro world graph is generated **server-side** at creation from the same
  deterministic generator the client sandbox uses (seeded `mulberry32`), inlined
  into `gameEngine` (Base44 functions cannot import each other). The client
  mirror in `src/lib/macro/` must stay byte-equivalent in behavior — this is the
  standard three-way parity rule (`gameEngine` ↔ `src/lib` mirrors), extended to
  the macro constants and guarded by `test/rules-mirror` + `test/macro-pacing`.

## 2. Time & the turn loop

**Decision (resolves VISION §5.6 Q3): sequential player turns; one full baton
cycle = one in-game day.** Simultaneous (WEGO) daily resolution is deferred — it
would replace the entire turn/lobby/NPC/presence infrastructure for a payoff we
can evaluate later; nothing in this design precludes moving to it.

- The existing `advanceTurn` day boundary (`currentTurnIndex === 0`) gains one
  call: `macroAdvanceDay(game)` — **dawn resolution**. All marching columns (every
  faction's) advance one day simultaneously and deterministically (column array
  order), arrivals resolve, and the day count (`turnNumber` = Day N) increments
  as today.
- Orders are issued during your turn; movement happens at dawn. A column can be
  **redirected on any day** — the new plot takes effect from the next node the
  column reaches (mid-edge redirects finish the current leg first; *(tune)* — a
  later slice may allow about-turns along the current edge).
- Weather (daily roll), research ticks, accord lapses, and per-slot income all
  keep their existing cadence, which is already one cycle = one day.

## 3. Data model

```jsonc
Game.worldModel: "macro",
Game.macro: {
  "seed": 1917,                      // world generation seed (from the planet)
  "nodes": [ { "id", "name", "kind", "lat", "lon" } ],
  "routes": [ [ "a", "b", 120, "road" ] ],       // miles + quality, as the sandbox
  "control": { "<nodeId>": 0 | 1 | ... | null }, // null = neutral settlement
  "bases":   { "<slotIndex>": { "nodeId": "..." } },  // fortress-base anchors
  "columns": [ {
    "id", "owner", "name", "generalId", "battles",
    "regiments": { "riflemen": 2, "crawler": 1, ... },
    "nodeId": "...",              // present when halted at a node
    "march": {                    // present when on the road
      "path": ["a","b","c"],      // remaining path, path[0] = leg origin
      "legMiles": 34.5            // miles progressed along the current leg
    }
  } ]
}
```

- Columns are the macro armies. They deliberately mirror the hex army shape
  (`owner`/`generalId`/`regiments`/`battles`) so generals, veterancy, medals,
  designs, and the mass-battle engine plug in without translation (§7 / M2).
- Position is either `nodeId` (halted) or `march` (en route). The convoy's
  drawable position is derived: leg fraction = `legMiles / routeMiles`.
- `persistWar()` grows `worldModel` + `macro` in its field set (CLAUDE.md gotcha:
  new state must be added to the persistence calls).

## 4. Movement: day-rates on the server

Server copies of the sandbox tables (three-way parity, §1):

- `UNIT_MARCH` — riflemen 20 mi/day, crawlers 16, artillery 12; air never slows
  a column. Column pace = slowest ground element present.
- `ROUTE_QUALITY` — highway ×1.25, road ×1.0, track ×0.75, trail ×0.5.
- **Weather** *(tune)*: rain/snow multiply wheel-bearing columns (any crawler or
  artillery) ×0.6, foot-only columns ×0.85; storms ground the air wing's recon
  bonus (§6). Applied at dawn from that day's weather.
- Dawn advance per column: `legMiles += dayRate × qualityMult × weatherMult`;
  overflow rolls into the next leg; reaching the final node resolves an
  **arrival** (§6/§7).

## 5. Action catalog (macro)

| Action | Who | Effect |
| --- | --- | --- |
| `macroPlotMarch` | owner, own turn | Set/replace a column's plan: server Dijkstra-validates the path from its current node (or next node if mid-leg) |
| `macroHalt` | owner, own turn | Clear the plan; column halts at the next node it reaches |
| `macroMusterColumn` | owner, own turn | Levy a new column at the base node or a controlled city — pays unit costs from the treasury, assigns a general (existing recruit/free-general flow) |
| `macroDisbandColumn` | owner, own turn | Disband at a controlled settlement; regiments dissolve *(garrison layer arrives M3)* |
| (shared) `endTurn`, diplomacy, research, chat | — | Unchanged |

All validation server-side: path connectivity, route existence, ownership,
turn possession, active-battle lock — same shape as the hex actions.

## 6. Fog of war & intel

**Geography is public; intel is not.** The whole node/route graph (names, kinds,
routes) is charted for everyone — it matches the client's world and keeps the
War Table honest. What fog gates is the **live state**:

- **Observed set** = your base node, nodes you control, your columns' current
  node (or both endpoints of their current edge) — plus **one route hop** out
  from each of those *(tune)*.
- Enemy columns and control flags are returned only for observed nodes/edges;
  unobserved control reads as `"unknown"` client-side.
- `getState` filters `macro` accordingly (macro sibling of `visibleStateFor`).
- Probes and the air wing extend recon in M3 (fighters in a column widen its
  observation to two hops *(tune)* — the speed stat finally paying off off-board).

## 7. Arrivals, control & combat

- **Neutral / uncontrolled node:** arrival flips `control[node]` to the column's
  owner. Settlements-as-polities (dispositions, trade, coercion) arrive in M4 —
  until then neutral settlements simply submit to the column rolling past
  (VISION §2: they project no power).
- **Own / allied node:** column halts (or marches through per its plan).
- **Enemy-held node (M1):** movement onto it is rejected at plot time unless
  empty of enemy columns; arrival at an enemy-*controlled* but undefended node
  flips it. **(M2)** arrival with hostile columns present triggers a **mass
  battle** through the existing engine unchanged — `createBattle` gains a macro
  entry point (node name as `tileName`, node kind → terrain flavor); veterancy,
  medals, signatures, morale, weather effects all carry over (VISION §5.5).
- **Interception on edges (M3b, shipped):** at dawn, after all movement, two
  hostile columns that end the day on the **same route segment** (same unordered
  node pair — catches a fast column catching a slow one and head-on meetings)
  roll an interception. Each column carries a **posture** (`aggressive` default /
  `evasive`, player-set; NPCs by doctrine). The **faster** column (higher
  day-rate) decides: aggressive → it attacks; evasive → it slips past **unless**
  the segment touches a **chokepoint** (any `crossroads` node, or a node's
  `chokepoint` flag), in which case an aggressive **slower** column springs the
  ambush. The engagement is a full mass battle **auto-resolved** server-side
  (both sides AI-commanded via the same `aiManeuver` the battle screen uses —
  dawn resolves every faction's columns with no player present, so interception
  battles can't be interactive this slice; the posture is the player's lever).
  No control flips on the road; the loser's survivors fall back to the segment's
  rear node and halt, or are destroyed (general faces `generalFate`); the winner
  keeps marching. Veterancy, morale, signatures, command vehicles and the
  after-action report all apply. One interception per segment per dawn;
  pass-through (a fast column overtaking without ending co-located) is not
  modeled.

## 8. Economy & supply

- **Income (daily, at the owner's turn start — reuses `collectIncome` cadence)**
  from controlled settlements, in the existing typed resources *(tune)*:
  city `{steel 2, manpower 2}` · town `{manpower 2}` · depot `{fuel 2}` ·
  ruin `{steel 1}` (precursor yields arrive with dig sites) · crossroads `{}`.
- **Supply envelope (M3):** effective-mile range from the fortress-base through
  friendly/neutral routes *(tune: ~3 road-days)*. Columns beyond it march at
  half rate and take attrition per day *(tune: 1 company per 2 days)*; depots
  extend the envelope — making Fuel Depots the strategic terrain VISION intends.
- **Fortress-base (M1 anchor, M3 movement):** each faction's base anchors at its
  spawn city; M3 gives it a day-rate (slowest thing on the map), module-driven,
  wired to the shipped fortress-base rules. **Boarding assaults (M5)** replace
  wreck-on-capture per VISION §3.3.

## 9. Setup & victory

- **Setup (M1):** spaced spawn cities are auto-assigned (max pairwise
  route-distance); each faction starts controlling its spawn city, base anchored
  there, one escort column (2 riflemen, 1 crawler *(tune)*), and the standard
  starting treasury.
- **Victory (M1):** **settlement control** — first faction to control ≥ 60%
  *(tune; reuses `mapControlTarget`)* of settlements (crossroads excluded) wins.
  Elimination via base loss arrives with base combat (M5); the **relic victory**
  ("restore humanity") arrives with dig sites (M6) and is intended to become the
  headline condition (VISION §4).

## 10. NPC factions

- **M1:** doctrine-flavored greedy expansion — each NPC turn, unemployed columns
  plot toward the nearest unobserved-by-them neutral settlement (aggressive:
  prefers the enemy-adjacent frontier; economic: highest-yield first; defensive:
  nearest to base). Musters a second column when treasury allows.
- **M2+:** engage/avoid decisions on contact; M3: supply-aware pathing; M5:
  base-hunting. NPC herald intercepts work unchanged (they read the combat log).

## 11. Rollout slices

| Slice | Contents | Ships with |
| --- | --- | --- |
| **M1 — The graph goes live** ✅ | worldModel, server world-gen, columns, plot/halt/muster/disband, dawn advance, fog, income, control flips, control victory, greedy NPCs, setup toggle + war-room client | shipped 2026-07-17 |
| **M2 — Contact** ✅ | `macroEngage` node assaults via the mass-battle engine (absorption defense, honors/veterancy/medals, retreat/repel/reform outcomes), truce-protected territory, base anchors block movement | shipped 2026-07-17 |
| **M3a — Supply & the base** ✅ | supply envelope (base + depots), out-of-supply half-rate + attrition, fortress-base movement re-anchoring supply | shipped 2026-07-17 |
| **M3b — Interception** ✅ | dawn interception on shared road segments (posture-driven engage/evade, crossroads chokepoints, auto-resolved mass battles, road retreat) | shipped 2026-07-18 |
| **M3c — later** | air-wing recon (fighters widen observation), garrison layer at settlements | |
| **M4 — The settled** | settlements as polities: dispositions, trade/tribute/raid verbs, war market | |
| **M5 — The storm** | boarding assaults, base loss (crippled-remnant grace *(leaning)*), module stripping | |
| **M6 — The prize** | dig sites, excavation, relics, relic victory; map editor becomes a graph editor; `World`/`Planet` entity | |

Every slice: `docs/GAME_RULES.md` update + `src/lib` mirror parity + a Field
Amendment patch dispatch (CLAUDE.md workflow). The client war room reuses the
War Table components (`src/components/starmap/`) driven by server state; the
sandbox at `/star-map` stays as the planning/preview surface.

## 12. Out of scope for this design

WEGO simultaneous resolution (revisit after M3), off-road movement (VISION §5.6
Q2 — currently forbidden), the Air/Sea expansion layers, ideology decrees
(VISION §6 — lands orthogonally), and hex-map migration (none — hex games finish
on hex).
