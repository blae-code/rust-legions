---
description: Scaffold a feature the plug-and-play way, per docs/ADD_A_FEATURE.md
---
Read `docs/ADD_A_FEATURE.md` and `CLAUDE.md`'s "one critical invariant" first, then plan (do NOT write code until I approve the plan) the feature: **$ARGUMENTS**

Follow the playbook exactly:
- **UI** → a new folder `src/components/game/<feature>/` with a single entry panel; imports only its own folder, `@/lib/*`, and `@/components/ui/*` (no cross-feature imports).
- **Client data** → one `src/lib/<feature>.js`.
- **Backend** → one `GAME_ACTIONS.<action>` (or `PREGAME.<action>`) registry entry in `gameEngine`, ending in `return Response.json(...)`.
- **Persisted state** → field in `base44/entities/Game.jsonc` (complete schema) **and** in `persistWar()`.
- **Rules on both sides?** → update every copy (gameEngine + `src/lib` mirror + any `concurrentPlay` copy) in the same change, and add the table to `npm run rules:check`.
- **Wire** → `<Route>` in `src/App.jsx` and/or mount in `src/pages/GamePage.jsx`.
- **Docs** → action table in `docs/ARCHITECTURE.md`; rules in `docs/GAME_RULES.md`. File a `Patch` dispatch.
- **Gates** → `npm run lint && npm run typecheck && npm test && npm run build` all green.

Present the plan as the checklist with the concrete files you'll touch, then stop for approval.
