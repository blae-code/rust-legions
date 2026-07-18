# Rust Legions — Architecture Reference

## Data Model (Base44 entities, `base44/entities/*.jsonc`)

### Game (one document per war — the entire live game state)
- `name`, `mode` (`multiplayer` | `campaign`), `status` (`lobby` | `active` | `complete`), `hostUserId`, `winnerSlot`
- `mapId`, `worldModel: "macro"`, `macro{seed, nodes[], routes[], continents[], size, control{}, bases{}, columns[]}` — the ministry-chart world (stored at creation; single truth)
- `factionSlots[]`: per-player slot — `slotIndex`, `userId`, `factionId`, `factionName`, `isNPC`, `doctrine`, `traits[]`, `pointBuy[]`, `mods` (compiled perks + research/decrees), `color`, `capitalTileId`, `eliminated`, `generals[]`, `armiesRaised`, `dispositions` (NPC only), `research{focus, progress, completed}`, `unlocks[]` (armory), `base{tileId, modules, movedTurn}` / `baseLost` (fortress-base)
- `turnOrder[]`, `currentTurnIndex`, `turnNumber`, `weather`
- `treasuries{slotIndex}`: `{manpower, steel, fuel}`
- `armies[]`: field armies — `id`, `owner`, `tileId`, `name`, `generalId`, `battles`, `design`, `regiments{}`
- `activeBattle` (live mass battle state) / `lastBattle` (after-action report) / `battleArchives[]` (last 15 reports w/ round history)
- `lastSeen{userId: ISO}` — presence heartbeats
- `combatLog[]` (typed entries: `combat`, `capture`, `event`), `statHistory[]` (per-turn control/production snapshots)
- `diplomacy{relations, offers[], lastProposal, tradeLog[]}` — accords keyed `"a-b"` with `{status, since, until}`
- `campaignWinCondition{type, value}`, `loggedToSheet`, `chronicleDocUrl`

### Other entities
- **Faction** — player-authored banner: `factionName`, `lore`, `doctrine`, `traits[]`, `insigniaDescription`, `lifepathChoices`, `pointBuy`, `npcDispositions`, `isPublished`
- **GameMap** — a Bureau war chart: `name`, `description`, `nodes[]`, `routes[]`, `recommendedPlayerCount`, `isPublished`
- **ArmyDesign** — doctrine template: `name`, `formation`, `weapon`, `armor`, `support` (per-user via `created_by_id`)
- **UserProfile** — `displayName`, `avatarUrl`, `gamesPlayed`, `gamesWon`, `campaignsCompleted`, `mapsCreated`, `isAdmin`
- **Patch** — live-service dispatch: `version`, `codename`, `title`, `summary` (markdown), `releaseDate`, `isPublished`, `changes[{category, title, description, impact}]`
- **ChatMessage** — Field Wire chat: `gameId`, `authorName`, `text` (written directly from the frontend; realtime via `subscribe`)
- **NpcDispatch** — AI-generated NPC radio broadcast ("Signals Intercepts"): `gameId`, `turnNumber`, `factionName`, `doctrine`, `mood`, `text` (created by `npcHerald`, read directly from the frontend)
- **User** — built-in Base44 entity (do not create records; `role` is `admin`/`user`)

## Backend Functions (`base44/functions/*/entry.ts`)

### gameEngine — the single gameplay API
Action-dispatch over POST body `{ action, gameId?, ...params }`. Frontend calls via `base44.functions.invoke("gameEngine", payload)`. Dispatch is registry-based: `PREGAME` handlers (create/list, run before a game is loaded) and `GAME_ACTIONS` handlers (run against the fetched `game`); adding an action is one map entry (see `docs/ADD_A_FEATURE.md`).

| Action | Params | Purpose |
| --- | --- | --- |
| `listMyGames` | — | Games where caller is host or seated |
| `createGame` | name, mode, factionId, humanCount, npcConfigs, campaignWinCondition, planetId, mapId? (Bureau chart) | Create lobby — generates + stores the ministry-chart world |
| `joinGame` | gameId, factionId | Claim an open slot |
| `startGame` | gameId | Host only — spread spawn cities, anchor bases, field escorts, seed treasuries |
| `getState` | gameId | Full fog-filtered view + presence heartbeat |
| `battleChoice` | gameId, maneuver | Issue secret orders for the active battle |
| `proposeDiplomacy` | targetSlot, kind (`truce`/`nap`/`trade`), give, want | Dispatch an envoy (NPCs decide inline) |
| `respondDiplomacy` | offerId, accept | Accept/decline a pending offer (usable off-turn) |
| `endTurn` | gameId | Advance turn; NPCs play inline; weather + research tick per cycle; macro: dawn march resolution |
| `macroPlotMarch` | columnId, toNodeId | Macro only — Dijkstra-validated march plan (redirects from the node ahead) |
| `macroEngage` | columnId, toNodeId | Macro only — assault an adjacent node held by foreign columns (opens a mass battle) |
| `macroMoveBase` | toNodeId | Macro only — roll the fortress-base along the graph (slow; re-anchors supply) |
| `macroHalt` | columnId | Macro only — stand down at the next node reached |
| `macroMusterColumn` | nodeId, regiments, generalId (`"recruit"` to buy) | Macro only — levy a column at a controlled city / the base anchor |
| `macroDisbandColumn` | columnId | Macro only — dissolve at a controlled settlement |

Turn enforcement via `requireMyTurn()`; army actions blocked while `activeBattle` exists. The world lives in `Game.macro` (design: `docs/MACRO_ENGINE.md`); the hex world model is deleted. On completion, fires `logGameToSheet` + `exportChronicleToDoc` (non-blocking).

### Other functions
- **concurrentPlay** — off-turn ("concurrent play") actions that never touch contested state: `setResearchFocus` (doctrine tree) and `unlockItem` (State Armory prototypes/decrees). Callable at any time by any seated player.
- **synthesizeFaction** — LLM synthesis of faction lore/traits from lifepath choices (InvokeLLM)
- **npcHerald** — background AI herald: per turn, reads front reports/control/dispositions and generates one in-character radio broadcast per NPC faction (InvokeLLM → `NpcDispatch` records; triggered fire-and-forget by `NpcIntercepts` on GamePage, deduped per faction per turn)
- **logGameToSheet** — appends completed-game summary to a master Google Sheet (googlesheets connector)
- **logCampaignSummary** — post-session campaign report (games won, resources, milestones) to Google Sheets
- **exportChronicleToDoc** — formats the campaign War Chronicle into a Google Doc (googledocs connector)

Connectors authorized: `googlesheets`, `googledocs` (shared mode, builder's account).

## Frontend Structure

### Routing (`src/App.jsx`)
`/` Home · `/new-game` · `/game/:gameId` · `/faction-builder` · `/map-editor` · `/maps` · `/army-designer` · `/patch-notes` · `/asset-registry` · `/star-map` · `/walkthrough` — all wrapped in `src/components/Layout.jsx` (which also mounts the persistent `MusicController`). Auth template pages at `/login` etc.

### Pages
- **Home** — 100dvh three-column command deck: `StormFront25D` video backdrop (locked-off trench-front loop + live lightning/artillery FX), `GameMenu` order plates, `FrontCard` game list, dossier/intel/ticker panels, `BootSequence`, ambient audio unlock.
- **GamePage** — the war room: command bar (factions, weather badge, research/diplomacy, end turn), `MacroWarRoom` (the Ministry Chart with orders), `WarCharts`, `NpcIntercepts`, `DispatchArchive`, `CombatLog`, chat, modal `BattleView` (+ `BattleDiorama`) and `BattleReport`. Polls `getState` (4s / 2.5s in battle).
- **GamePage side systems** — `DoctrinePanel` (research tree + `ArmoryPanel`), `FortressBay`/`RefitYard` (base modules & movement), `DiplomacyPanel` (Envoy Desk: offers, accords ledger, trade log), `GameChat` (Field Wire), `CombatResolution` (post-battle losses screen).
- **NewGame / MapLibrary / MapEditor / FactionBuilder / ArmyDesigner / PatchNotes** — setup & meta tools.
- **Walkthrough** — 5-step "Field Induction" interactive tutorial (base refitting, ideology, treads primer).
- **StarMap** — the **War Table** planning sandbox: the Ministry Chart (`MinistryChart`) for the theater world picked via `?planet=`, with the radial orders menu, `MarchPlanner` day-rate itineraries, and the tactical overlay analysis. (In play the same chart renders live server state inside `MacroWarRoom`.)
- **AssetRegistry** — Illustration Directorate (image plates, `src/lib/imageLibrary.js`) + Sound Registry (`src/lib/audioLibrary.js`); every asset carries a generation-ready prompt and delivery status.

### Component directories
- `src/components/home/` — command-deck panels & 2.5D backdrop (`StormFront25D` + `BackdropReel` rotating video playlist)
- `src/components/game/` — in-game panels, battle UI, sprites; subdirs: `diplomacy/`, `fortress/`, `research/`, `chat/`
- `src/components/macro/` — `MarchPlanner` (column composition + itemized itinerary side panel)
- `src/components/starmap/` — the War Table: `PlanetSystem`, `PlanetBody`, `NodeMarker`, `NodeRadialMenu` (radial orders), `RouteArcs`, `MarchTrail`, `TacticalLayer`, `arcMath.js`
- `src/components/walkthrough/`, `src/components/induction/` — Field Induction tutorial & commissioning
- `src/components/assets/` — asset registry cards (image + audio)
- `src/components/audio/MusicController.jsx` — persistent soundtrack controls (mounted in Layout)
- `src/components/chart/` — the Ministry Chart: `MinistryChart` (SVG pan/zoom war chart), `NodeRadialMenu`
- `src/components/patch/` — patch dispatch display + admin composer (`patchMeta.js` category codes)
- `src/components/faction/`, `src/components/army/` — builder sub-UIs
- `src/components/ui/` — shadcn primitives (button/panel variants restyled dieselpunk)

### Frontend libraries (`src/lib/`)
- `sfx.js` — synthesized Web Audio SFX (mechanical clicks/levers w/ grit distortion); `playSfx(name)`, `sfxEnabled()`/`setSfxEnabled()`
- `ambience.js` — rotating 5-piece public-domain orchestral score (Wikimedia Commons); playlist, per-track fades, `startScore`/`stopScore`/`skipScore`, `setScoreSuppressed` (battles), `unlockAmbience()` on first gesture
- `hex.js` — axial hex math · `terrain3d.js` — 3D terrain palette/geometry
- `macro/` — v2.x macro map: `graph.js` (nodes/routes, canonical lat/lon), `march.js` (day-rate Dijkstra itineraries), `overlay.js` (supply-artery + objective analysis), `planets.js` (campaign worlds: deterministic procedural settlements/routes, lat/lon→XYZ)
- `imageLibrary.js` / `imagePlates.js` / `audioLibrary.js` — asset registries with generation prompts and delivery status
- Rules mirrors (**keep in sync with gameEngine** — see CLAUDE.md): `units.js`, `massCombat.js`, `armyDesign.js`, `pointBuy.js`, `combatMods.js`, `weather.js`, `baseModules.js`, `doctrine.js`, `armory.js`, `diplomacy.js`, `commandVehicles.js`
- `lifepath.js` — faction lifepath stages · `medals.js` · `generalPortraits.js`
- `AuthContext.jsx`, `query-client.js`, `utils.js`, `app-params.js` — platform plumbing (do not modify casually)

### Conventions
- Components small and focused; new UI gets its own file.
- `base44` SDK client: `import { base44 } from "@/api/base44Client"` — entities via `base44.entities.X`, functions via `base44.functions.invoke(name, payload)` (response data in `res.data`), auth via `base44.auth.me()`.
- Admin checks: `user.role === "admin"` from `base44.auth.me()`.
- All game mutations go through `gameEngine` — never write `Game` records from the frontend.