# Conquest Tactics

A turn-based **dieselpunk grand-strategy game** for 2–4 players — hex-tile territorial conquest with fog of war, a typed resource economy, and round-by-round mass battles led by named generals. Supports live multiplayer and solo campaigns against personality-driven NPC factions. Built on the [Base44](https://base44.com) platform.

## Features

- **Territorial conquest** on a 3D hex board with fog of war, supply lines, weather, terrain and elevation modifiers
- **Typed economy** (Manpower / Steel / Fuel), buildings, artillery bombardment and recon probes
- **Mass battles** — named generals with traits, command vehicles, secret simultaneous maneuvers, morale, veterancy and medals
- **Mobile fortress-bases** — modular armor/engine/industry bays, refit yards, and movement on the great treads
- **Diplomacy** — truces, non-aggression pacts and trade via the Envoy Desk, with dynamic NPC dispositions
- **AI-driven NPC factions** — three doctrines with distinct play styles, plus a background AI herald that writes in-character radio broadcasts ("Signals Intercepts") each turn
- **Faction creation** — BattleTech-style lifepath wizard with LLM-synthesized lore, plus GURPS-style point-buy perks
- **Off-turn planning** — doctrine research tree and State Armory unlocks playable while waiting for your turn
- **Meta tools** — map editor, Army Design Bureau, patch-notes live-service system, Field Induction tutorial
- **v2.x prototypes** — Macro March Lab (graph-based day-rate movement) and the Star Chart (3D planetary map with radial node orders)
- **Immersive presentation** — 2.5D cinematic menu backdrops, synthesized Web Audio SFX, rotating orchestral score

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS + shadcn/ui, three.js / @react-three/fiber (3D boards & star chart), framer-motion, recharts
- **Backend:** Base44 BaaS — JSON-schema entities (`base44/entities/`) and Deno HTTP functions (`base44/functions/`), including the single authoritative `gameEngine` rules API
- **Integrations:** LLM synthesis (faction lore, NPC broadcasts), Google Sheets / Docs campaign logging

## Repository Structure

```
base44/entities/     Entity JSON schemas (Game, Faction, GameMap, NpcDispatch, ...)
base44/functions/    Deno backend functions (gameEngine, concurrentPlay, npcHerald, ...)
src/pages/           Route pages (Home, GamePage, StarMap, FactionBuilder, ...)
src/components/      Focused UI components (game/, hexmap3d/, starmap/, macro/, home/, ...)
src/lib/             Frontend rules mirrors, audio engines, macro-map math
docs/                Project documentation (see below)
```

**Project documentation:**
- `CLAUDE.md` — warm-handoff overview: conventions, invariants, workflows (**read this first if contributing**)
- `docs/VISION.md` — design north star: lore, mobile-base redesign, expansion roadmap
- `docs/GAME_RULES.md` — the complete numeric ruleset (as currently implemented)
- `docs/ARCHITECTURE.md` — data model, backend API, frontend structure
- `AGENTS.md` — Base44 platform conventions for coding agents

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.

See the [Base44 CLI docs](https://docs.base44.com/developers/references/cli/get-started/overview) if you want to run Base44 commands directly.

## Run Locally

Run the full local development environment from the project root:

```bash
base44 dev
```

`base44 dev` starts the local Base44 development backend and, when this app is configured for it, also starts the frontend dev server for you. Use the frontend URL printed by the command.

For example, when the Base44 project config includes a `serveCommand`, `base44 dev` can launch the frontend too:

```json5
{
  "site": {
    "serveCommand": "npm run dev"
  }
}
```

In a Base44 project this lives in `base44/config.jsonc`.

## Run Only The Frontend

If you only want to work on the frontend against the hosted Base44 backend, run:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Use The Hosted Backend

For frontend-only development, create or update `.env.local` in the project root:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

`VITE_BASE44_APP_ID` identifies the Base44 app.

`VITE_BASE44_APP_BASE_URL` tells the Base44 Vite plugin where to send local `/api` requests. Point it at your deployed Base44 app URL when you want the local frontend to use the hosted backend.

When you use `base44 dev`, the command injects the local Base44 values for you, so `.env.local` is mainly needed for frontend-only workflows.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

## Docs & Support

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Base44 CLI command reference: [https://docs.base44.com/developers/references/cli/commands/introduction](https://docs.base44.com/developers/references/cli/commands/introduction)

Support: [https://app.base44.com/support](https://app.base44.com/support)