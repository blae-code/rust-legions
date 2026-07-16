# Conquest Tactics — Architecture Reference

## Data Model (Base44 entities, `base44/entities/*.jsonc`)

### Game (one document per war — the entire live game state)
- `name`, `mode` (`multiplayer` | `campaign`), `status` (`lobby` | `active` | `complete`), `hostUserId`, `winnerSlot`
- `mapId`, `tiles[]` (hex tiles: `id`, `q`, `r`, `name`, `terrain`, `isSea`, `isCapital`, `baseIncome`, `resourceBonus`, `adjacentIds[]`)
- `factionSlots[]`: per-player slot — `slotIndex`, `userId`, `factionId`, `factionName`, `isNPC`, `doctrine`, `traits[]`, `pointBuy[]`, `mods` (compiled perks + research/decrees), `color`, `capitalTileId`, `eliminated`, `generals[]`, `armiesRaised`, `dispositions` (NPC only), `research{focus, progress, completed}`, `unlocks[]` (armory), `base{tileId, modules, movedTurn}` / `baseLost` (fortress-base)
- `turnOrder[]`, `currentTurnIndex`, `turnNumber`, `weather`
- `territoryStates{tileId}`: `owner` (slotIndex|null), `units{unitKey: count}`, `buildings[{type, level, pending}]`, `lastBombardTurn`
- `treasuries{slotIndex}`: `{manpower, steel, fuel}`
- `armies[]`: field armies — `id`, `owner`, `tileId`, `name`, `generalId`, `battles`, `design`, `regiments{}`
- `activeBattle` (live mass battle state) / `lastBattle` (after-action report) / `battleArchives[]` (last 15 reports w/ round history)
- `lastSeen{userId: ISO}` — presence heartbeats
- `combatLog[]` (typed entries: `combat`, `capture`, `event`), `statHistory[]` (per-turn control/production snapshots)
- `diplomacy{relations, offers[], lastProposal, tradeLog[]}` — accords keyed `"a-b"` with `{status, since, until}`
- `campaignWinCondition{type, value}`, `loggedToSheet`, `chronicleDocUrl`

### Other entities
- **Faction** — player-authored banner: `factionName`, `lore`, `doctrine`, `traits[]`, `insigniaDescription`, `lifepathChoices`, `pointBuy`, `npcDispositions`, `isPublished`
- **GameMap** — `name`, `description`, `tiles[]`, `recommendedPlayerCount`, `isPublished`, `loreBlurb`
- **ArmyDesign** — doctrine template: `name`, `formation`, `weapon`, `armor`, `support` (per-user via `created_by_id`)
- **UserProfile** — `displayName`, `avatarUrl`, `gamesPlayed`, `gamesWon`, `campaignsCompleted`, `mapsCreated`, `isAdmin`
- **Patch** — live-service dispatch: `version`, `codename`, `title`, `summary` (markdown), `releaseDate`, `isPublished`, `changes[{category, title, description, impact}]`
- **ChatMessage** — Field Wire chat: `gameId`, `authorName`, `text` (written directly from the frontend; realtime via `subscribe`)
- **User** — built-in Base44 entity (do not create records; `role` is `admin`/`user`)

## Backend Functions (`base44/functions/*/entry.ts`)

### gameEngine — the single gameplay API
Action-dispatch over POST body `{ action, gameId?, ...params }`. Frontend calls via `base44.functions.invoke("gameEngine", payload)`.

| Action | Params | Purpose |
| --- | --- | --- |
| `listMyGames` | — | Games where caller is host or seated |
| `createGame` | name, mode, mapId/mapData, factionId, humanCount, npcConfigs, campaignWinCondition | Create lobby |
| `joinGame` | gameId, factionId | Claim an open slot |
| `startGame` | gameId | Host only — seed capitals, garrisons, treasuries, generals |
| `getState` | gameId | Full fog-filtered view + presence heartbeat |
| `moveUnits` | fromTileId, toTileId, units | Garrison move (friendly, adjacent) |
| `attack` | fromTileId, toTileId, units | Garrison combat (§5 of rules) |
| `build` | tileId, buildingType | Start construction/upgrade |
| `purchaseUnits` | tileId, units | Buy + deploy units |
| `musterArmy` | tileId, regiments, generalId (`"recruit"` to buy), designId? | Raise a field army |
| `moveArmy` | armyId, toTileId | March / engage (may open a mass battle) |
| `reinforceArmy` | armyId, regiments | Feed garrison companies into a supplied army |
| `disbandArmy` | armyId | Return regiments to garrison |
| `battleChoice` | gameId, maneuver | Issue secret orders for the active battle |
| `bombard` | fromTileId, toTileId | Artillery barrage |
| `probe` | tileId | Recon — returns partial `intel` |
| `installModule` | moduleKey | Refit a fortress-base bay (prototypes need armory unlock) |
| `moveBase` | toTileId | Crawl the fortress-base 1 friendly zone (engine + fuel) |
| `proposeDiplomacy` | targetSlot, kind (`truce`/`nap`/`trade`), give, want | Dispatch an envoy (NPCs decide inline) |
| `respondDiplomacy` | offerId, accept | Accept/decline a pending offer (usable off-turn) |
| `endTurn` | gameId | Advance turn; NPCs play inline; weather + research tick per cycle |

Turn enforcement via `requireMyTurn()`; most army actions blocked while `activeBattle` exists. On completion, fires `logGameToSheet` + `exportChronicleToDoc` (non-blocking).

### Other functions
- **concurrentPlay** — off-turn ("concurrent play") actions that never touch contested state: `setResearchFocus` (doctrine tree) and `unlockItem` (State Armory prototypes/decrees). Callable at any time by any seated player.
- **generateMap** — procedural hex map generation (used by NewGame/MapEditor)
- **synthesizeFaction** — LLM synthesis of faction lore/traits from lifepath choices (InvokeLLM)
- **logGameToSheet** — appends completed-game summary to a master Google Sheet (googlesheets connector)
- **exportChronicleToDoc** — formats the campaign War Chronicle into a Google Doc (googledocs connector)

Connectors authorized: `googlesheets`, `googledocs` (shared mode, builder's account).

## Frontend Structure

### Routing (`src/App.jsx`)
`/` Home · `/new-game` · `/game/:gameId` · `/faction-builder` · `/map-editor` · `/maps` · `/army-designer` · `/patch-notes` · `/asset-registry` · `/macro-lab` · `/walkthrough` — all wrapped in `src/components/Layout.jsx` (which also mounts the persistent `MusicController`). Auth template pages at `/login` etc.

### Pages
- **Home** — 100dvh three-column command deck: `StormFront25D` video backdrop (locked-off trench-front loop + live lightning/artillery FX), `GameMenu` order plates, `FrontCard` game list, dossier/intel/ticker panels, `BootSequence`, ambient audio unlock.
- **GamePage** — the war room: command bar (factions, weather badge, resources, end turn), `HexBoard3D` tactical theater, side panels (`ArmyPanel`, `MusterPanel`, `ProbePanel`, `TilePanel`, `BuildPanel`, `PurchasePanel`, `DispatchArchive`, `CombatLog`), `WarCharts`, modal `BattleView` (+ `BattleDiorama` animated combat) and `BattleReport`. Polls `getState` (4s / 2.5s in battle).
- **GamePage side systems** — `DoctrinePanel` (research tree + `ArmoryPanel`), `FortressBay`/`RefitYard` (base modules & movement), `DiplomacyPanel` (Envoy Desk: offers, accords ledger, trade log), `GameChat` (Field Wire), `CombatResolution` (post-battle losses screen).
- **NewGame / MapLibrary / MapEditor / FactionBuilder / ArmyDesigner / PatchNotes** — setup & meta tools.
- **Walkthrough** — 5-step "Field Induction" interactive tutorial (base refitting, ideology, treads primer).
- **MacroLab** — sandbox for the v2.x node-and-route macro map: Dijkstra day-rate march planning plus a tactical overlay (supply arteries via all-pairs betweenness, top-5 capture objectives).
- **AssetRegistry** — Illustration Directorate (image plates, `src/lib/imageLibrary.js`) + Sound Registry (`src/lib/audioLibrary.js`); every asset carries a generation-ready prompt and delivery status.

### Component directories
- `src/components/home/` — command-deck panels & 2.5D backdrop (`StormFront25D` + `BackdropReel` rotating video playlist)
- `src/components/game/` — in-game panels, battle UI, sprites; subdirs: `diplomacy/`, `fortress/`, `research/`, `chat/`
- `src/components/macro/` — macro-map lab: `MacroGraphMap`, `RouteEdge`, `MarchPlanner`, `TacticalOverlay`
- `src/components/walkthrough/`, `src/components/induction/` — Field Induction tutorial & commissioning
- `src/components/assets/` — asset registry cards (image + audio)
- `src/components/audio/MusicController.jsx` — persistent soundtrack controls (mounted in Layout)
- `src/components/hexmap3d/` — Three.js board: `HexBoard3D`, `TerrainTile`, `TileDecor`, `TileLabels`, `ArmyFlag3D`, `Weather3D` (3D rain/fog/snow/lightning), `TileFX`, `DriftingHaze`
- `src/components/patch/` — patch dispatch display + admin composer (`patchMeta.js` category codes)
- `src/components/faction/`, `src/components/army/` — builder sub-UIs
- `src/components/ui/` — shadcn primitives (button/panel variants restyled dieselpunk)

### Frontend libraries (`src/lib/`)
- `sfx.js` — synthesized Web Audio SFX (mechanical clicks/levers w/ grit distortion); `playSfx(name)`, `sfxEnabled()`/`setSfxEnabled()`
- `ambience.js` — rotating 5-piece public-domain orchestral score (Wikimedia Commons); playlist, per-track fades, `startScore`/`stopScore`/`skipScore`, `setScoreSuppressed` (battles), `unlockAmbience()` on first gesture
- `hex.js` — axial hex math · `terrain3d.js` — 3D terrain palette/geometry
- `macro/` — v2.x lab: `graph.js` (nodes/routes), `march.js` (day-rate Dijkstra itineraries), `overlay.js` (supply-artery + objective analysis)
- `imageLibrary.js` / `imagePlates.js` / `audioLibrary.js` — asset registries with generation prompts and delivery status
- Rules mirrors (**keep in sync with gameEngine** — see CLAUDE.md): `units.js`, `massCombat.js`, `armyDesign.js`, `pointBuy.js`, `combatMods.js`, `weather.js`, `baseModules.js`, `doctrine.js`, `armory.js`, `diplomacy.js`
- `lifepath.js` — faction lifepath stages · `medals.js` · `generalPortraits.js`
- `AuthContext.jsx`, `query-client.js`, `utils.js`, `app-params.js` — platform plumbing (do not modify casually)

### Conventions
- Components small and focused; new UI gets its own file.
- `base44` SDK client: `import { base44 } from "@/api/base44Client"` — entities via `base44.entities.X`, functions via `base44.functions.invoke(name, payload)` (response data in `res.data`), auth via `base44.auth.me()`.
- Admin checks: `user.role === "admin"` from `base44.auth.me()`.
- All game mutations go through `gameEngine` — never write `Game` records from the frontend.