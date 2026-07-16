# Conquest Tactics — Architecture Reference

## Data Model (Base44 entities, `base44/entities/*.jsonc`)

### Game (one document per war — the entire live game state)
- `name`, `mode` (`multiplayer` | `campaign`), `status` (`lobby` | `active` | `complete`), `hostUserId`, `winnerSlot`
- `mapId`, `tiles[]` (hex tiles: `id`, `q`, `r`, `name`, `terrain`, `isSea`, `isCapital`, `baseIncome`, `resourceBonus`, `adjacentIds[]`)
- `factionSlots[]`: per-player slot — `slotIndex`, `userId`, `factionId`, `factionName`, `isNPC`, `doctrine`, `traits[]`, `pointBuy[]`, `mods` (compiled perks), `color`, `capitalTileId`, `eliminated`, `generals[]`, `armiesRaised`, `dispositions` (NPC only)
- `turnOrder[]`, `currentTurnIndex`, `turnNumber`, `weather`
- `territoryStates{tileId}`: `owner` (slotIndex|null), `units{unitKey: count}`, `buildings[{type, level, pending}]`, `lastBombardTurn`
- `treasuries{slotIndex}`: `{manpower, steel, fuel}`
- `armies[]`: field armies — `id`, `owner`, `tileId`, `name`, `generalId`, `battles`, `design`, `regiments{}`
- `activeBattle` (live mass battle state) / `lastBattle` (after-action report) / `battleArchives[]` (last 15 reports w/ round history)
- `lastSeen{userId: ISO}` — presence heartbeats
- `combatLog[]` (typed entries: `combat`, `capture`, `event`), `statHistory[]` (per-turn control/production snapshots)
- `campaignWinCondition{type, value}`, `loggedToSheet`, `chronicleDocUrl`

### Other entities
- **Faction** — player-authored banner: `factionName`, `lore`, `doctrine`, `traits[]`, `insigniaDescription`, `lifepathChoices`, `pointBuy`, `npcDispositions`, `isPublished`
- **GameMap** — `name`, `description`, `tiles[]`, `recommendedPlayerCount`, `isPublished`, `loreBlurb`
- **ArmyDesign** — doctrine template: `name`, `formation`, `weapon`, `armor`, `support` (per-user via `created_by_id`)
- **UserProfile** — `displayName`, `avatarUrl`, `gamesPlayed`, `gamesWon`, `campaignsCompleted`, `mapsCreated`, `isAdmin`
- **Patch** — live-service dispatch: `version`, `codename`, `title`, `summary` (markdown), `releaseDate`, `isPublished`, `changes[{category, title, description, impact}]`
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
| `endTurn` | gameId | Advance turn; NPCs play inline; weather rolls per cycle |

Turn enforcement via `requireMyTurn()`; most army actions blocked while `activeBattle` exists. On completion, fires `logGameToSheet` + `exportChronicleToDoc` (non-blocking).

### Other functions
- **generateMap** — procedural hex map generation (used by NewGame/MapEditor)
- **synthesizeFaction** — LLM synthesis of faction lore/traits from lifepath choices (InvokeLLM)
- **logGameToSheet** — appends completed-game summary to a master Google Sheet (googlesheets connector)
- **exportChronicleToDoc** — formats the campaign War Chronicle into a Google Doc (googledocs connector)

Connectors authorized: `googlesheets`, `googledocs` (shared mode, builder's account).

## Frontend Structure

### Routing (`src/App.jsx`)
`/` Home · `/new-game` · `/game/:gameId` · `/faction-builder` · `/map-editor` · `/maps` · `/army-designer` · `/patch-notes` — all wrapped in `src/components/Layout.jsx`. Auth template pages at `/login` etc.

### Pages
- **Home** — 100dvh three-column command deck: `StormFront25D` video backdrop (locked-off trench-front loop + live lightning/artillery FX), `GameMenu` order plates, `FrontCard` game list, dossier/intel/ticker panels, `BootSequence`, ambient audio unlock.
- **GamePage** — the war room: command bar (factions, weather badge, resources, end turn), `HexBoard3D` tactical theater, side panels (`ArmyPanel`, `MusterPanel`, `ProbePanel`, `TilePanel`, `BuildPanel`, `PurchasePanel`, `DispatchArchive`, `CombatLog`), `WarCharts`, modal `BattleView` (+ `BattleDiorama` animated combat) and `BattleReport`. Polls `getState` (4s / 2.5s in battle).
- **NewGame / MapLibrary / MapEditor / FactionBuilder / ArmyDesigner / PatchNotes** — setup & meta tools.

### Component directories
- `src/components/home/` — command-deck panels & 2.5D backdrop
- `src/components/game/` — in-game panels, battle UI, sprites (`sprites/UnitSprite.jsx`)
- `src/components/hexmap3d/` — Three.js board: `HexBoard3D`, `TerrainTile`, `TileDecor`, `TileLabels`, `ArmyFlag3D`, `Weather3D` (3D rain/fog/snow/lightning), `TileFX`, `DriftingHaze`
- `src/components/patch/` — patch dispatch display + admin composer (`patchMeta.js` category codes)
- `src/components/faction/`, `src/components/army/` — builder sub-UIs
- `src/components/ui/` — shadcn primitives (button/panel variants restyled dieselpunk)

### Frontend libraries (`src/lib/`)
- `sfx.js` — synthesized Web Audio SFX w/ grit distortion; `playSfx(name)`, `sfxEnabled()`/`setSfxEnabled()`
- `ambience.js` — thunder/artillery ambience; `unlockAmbience()` on first gesture
- `hex.js` — axial hex math · `terrain3d.js` — 3D terrain palette/geometry
- Rules mirrors (**keep in sync with gameEngine** — see CLAUDE.md): `units.js`, `massCombat.js`, `armyDesign.js`, `pointBuy.js`, `combatMods.js`, `weather.js`
- `lifepath.js` — faction lifepath stages · `medals.js` · `generalPortraits.js`
- `AuthContext.jsx`, `query-client.js`, `utils.js`, `app-params.js` — platform plumbing (do not modify casually)

### Conventions
- Components small and focused; new UI gets its own file.
- `base44` SDK client: `import { base44 } from "@/api/base44Client"` — entities via `base44.entities.X`, functions via `base44.functions.invoke(name, payload)` (response data in `res.data`), auth via `base44.auth.me()`.
- Admin checks: `user.role === "admin"` from `base44.auth.me()`.
- All game mutations go through `gameEngine` — never write `Game` records from the frontend.