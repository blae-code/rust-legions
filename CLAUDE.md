# CLAUDE.md — Conquest Tactics

Warm-handoff context for working on this repository. Read this first; the granular references live in `docs/`.

## What This Is

**Conquest Tactics** is a turn-based dieselpunk grand-strategy game (2–4 players) built on the **Base44 platform**. Players conquer hex-tile territories under fog of war, manage a typed resource economy, raise field armies under named generals, and fight round-by-round mass battles with secret simultaneous maneuvers. It supports live multiplayer, solo campaigns against doctrine-driven NPC factions, custom faction creation via a lifepath wizard, a map editor, and an Army Design Bureau for doctrine templates.

The game is positioned as a **live-service title**: v1.0.0 is "The Vanilla Front" baseline, and all future gameplay changes are published as in-game "Field Amendment" patch dispatches (see Patch workflow below).

**The long-term vision goes further than the vanilla rules:** the game is pivoting toward *nomadic factions in modular mobile fortress-bases* (Mortal Engines / Stellaris Nomads) hunting buried precursor technology on an abandoned world, with Air and Sea expansions planned. **Read `docs/VISION.md` before designing any new gameplay feature** — new work should align with that direction, not entrench the permanent-capital model.

## Documentation Map

| Doc | Contents |
| --- | --- |
| `CLAUDE.md` (this file) | Handoff overview, conventions, invariants, workflows |
| `docs/VISION.md` | Design north star — lore bible, mobile-base redesign, expansion roadmap (Air, Sea) |
| `docs/GAME_RULES.md` | The complete, numeric ruleset **as currently implemented** — every stat, cost, modifier, and formula |
| `docs/ARCHITECTURE.md` | File map, data model, backend API catalog, frontend structure |
| `README.md` | Local dev setup, Base44 CLI, publish workflow |
| `AGENTS.md` | Base44 platform conventions for coding agents |

## Tech Stack & Platform Constraints

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui. Routing via `react-router-dom` (routes declared in `src/App.jsx`). 3D board via `three` / `@react-three/fiber` / `@react-three/drei`. Animation via `framer-motion`. Charts via `recharts`.
- **Backend:** Base44 BaaS. Entities are JSON schemas in `base44/entities/*.jsonc`. Backend logic is Deno HTTP handlers in `base44/functions/{name}/entry.ts` (JavaScript, `Deno.serve`, no local imports between functions — share code by inlining).
- **Auth:** Base44 built-in (template pages in `src/pages/Login.jsx` etc. — do not rewrite). Frontend SDK: `import { base44 } from "@/api/base44Client"`.
- **Imports:** always use the `@/` alias, never relative `src/` paths.
- **Styling:** design tokens only — see Design System below. No hardcoded colors/fonts in JSX.
- **Dependencies:** use only what is in `package.json`. Do not add packages without explicit need.

## The One Critical Invariant

**Game rules exist in TWO places and must stay in sync:**

1. `base44/functions/gameEngine/entry.ts` — the authoritative server-side rules (all validation and resolution happens here).
2. `src/lib/*.js` — frontend mirrors used for display and pre-validation:
   - `src/lib/units.js` — unit stats, costs, building defs, resource metadata
   - `src/lib/massCombat.js` — maneuver definitions, signature cooldowns
   - `src/lib/armyDesign.js` — design bureau slot options and modifiers
   - `src/lib/pointBuy.js` — faction perk definitions
   - `src/lib/combatMods.js` — terrain/elevation combat modifiers
   - `src/lib/weather.js` — weather metadata and effect descriptions

**Any rules change must be applied to both sides**, and should also be filed as a Patch dispatch (below). The server always wins — the frontend mirrors are cosmetic/UX only.

## Patch (Live-Service) Workflow

Every player-facing gameplay change should ship with a patch note:

1. Rules change → edit `gameEngine/entry.ts` + the matching `src/lib/` mirror.
2. File a dispatch: create a `Patch` entity record (version, codename, title, summary, `changes[]` with `category` / `title` / `description` / `impact`). Admins can also author in-app via the composer on `/patch-notes`.
3. Categories: `new_content`, `balance`, `mechanics`, `fix`, `ui`, `audio`. Every change entry should include an `impact` line ("how this lands on the front").
4. Versioning: semver. The highest published version renders as "Current Articles" on `/patch-notes`.

## Design System (Dieselpunk)

- Tokens live in `src/index.css` (`:root` + `.dark`), mapped in `tailwind.config.js`. Palette: `brass` / `brass-bright` (primary gold), `rust` (destructive red), `olive`, `steel`, dark umber backgrounds.
- Fonts: `font-display` (Bebas Neue — big stencil headings), `font-heading` (Barlow Condensed — labels/buttons, uppercase + tracking), `font-body` (Barlow), `font-mono` (IBM Plex Mono — telemetry/readouts).
- Reusable component classes (defined in `src/index.css`): `cq-panel` (riveted steel plate), `cq-hazard` (hazard-stripe divider), `cq-label` (stenciled section label), `cq-display` (stencil heading), `cq-tag`, `cq-brackets` (corner brackets), `cq-metal` (worn-metal button surface), `cq-stamp` (rubber stamp), `cq-scanlines`, `cq-vignette`, plus many FX keyframe classes (`cq-shake`, `cq-arty-flash`, `cq-lightning`, `cq-rain`, `cq-ember`, etc.).
- **Voice:** all UI copy is in-world military-ministry English ("Issue orders, General", "War Ministry Communiqué"). Keep new copy in that voice.
- **Audio:** all SFX are synthesized at runtime via Web Audio (`src/lib/sfx.js` — grit/overdrive stage; `src/lib/ambience.js` — thunder/artillery ambience). No audio assets. Respect the `sfxEnabled()` toggle.
- **Immersion first:** menus and docs are diegetic (dispatch files, dossiers, communiqués), not plain web pages.

## Key Runtime Flows

- **All gameplay goes through one backend function:** `gameEngine` — an action-dispatch API (`{ action: "getState" | "attack" | ... , gameId, ...params }`). The frontend never mutates `Game` records directly. See `docs/ARCHITECTURE.md` for the full action catalog.
- **State polling:** `GamePage` polls `getState` every 4s (2.5s during battles). `getState` doubles as a presence heartbeat (`lastSeen`), which drives live-vs-AI battle defense (defender is "live" if seen < 60s ago).
- **Fog of war** is enforced server-side: `getState` returns only tiles visible to the caller.
- **Game completion side-effects:** on completion, `gameEngine` invokes `logGameToSheet` (Google Sheets) and `exportChronicleToDoc` (Google Docs) — both must never block play (errors swallowed).

## Current Scope Status (as of 2026-07-16)

Built and live: territorial conquest, typed economy, buildings, 5 unit types, garrison combat, mass battles (generals, maneuvers, morale, signatures, veterancy, medals), supply/logistics, weather, terrain/elevation modifiers, artillery bombardment, recon probes, army designs, faction point-buy + lifepath, NPC AI (3 doctrines), campaign mode, dispatch archive, war charts, patch-notes system.

**The committed direction (NOT yet built — see `docs/VISION.md` for full detail):**
- **v2.x Mobile Bases redesign:** permanent capitals replaced by modular mobile fortress-bases (module slots altering speed/defense/economy/auras); bases captured only by committed ground troops (boarding assaults); permanent settlements become neutral minor polities; buried precursor tech with dig sites, relics, and a "restore humanity" victory condition.
- **Air expansion** (Sky Captain-inspired aerial theater) and **Sea expansion** (Waterworld/Foxhole-naval theater) planned after that, in order.

**Known gaps — near-term candidates, scope not yet locked** (full analysis in `docs/VISION.md` §5.1):
1. Sea transport — "convoy" action ferrying armies between friendly coasts (biggest hole; full naval theater stays in the Sea expansion)
2. Minimal diplomacy — offer truce / declare war, NPC acceptance driven by disposition
3. Resource exchange — lossy war market (~3:1) and/or player trade offers
4. Stalemate protection — optional turn deadline with auto-skip + max-turn scored victory (land + production)
5. Speed/initiative system — **in-or-out decision pending**; pairs with v2.x engine modules
6. Field Manual — in-game codex page, ministry styling, sourced from `docs/GAME_RULES.md`
7. Turn notifications — email nudge to registered players when the baton passes

Do not start implementing v2.x or expansion content without explicit user go-ahead — the docs-first working agreement in `docs/VISION.md` applies.

## Gotchas

- `updateMany`/`deleteMany` on entities skip schema validation — be careful.
- Entity `.jsonc` files must always be written as complete schemas (no partial edits).
- Backend functions: everything inside `Deno.serve`, `npm:` prefixed imports with versions, no module-top-level `await`/`throw`.
- The `Game` entity is a large single document — `gameEngine` mutates the in-memory object then persists selected fields. When adding state, remember to add it to the relevant `Game.update(...)` persistence calls (see `persistWar()` for the war-related field set).
- Tailwind class names must appear as literal strings in source (no template-built class names) or the build purges them.
- Old 2D board (`src/components/hexmap/HexBoard.jsx`) is legacy; the live board is `src/components/hexmap3d/HexBoard3D.jsx`.