# Resume prompt — Tactical Squad Plan, Wave 1 onward

Paste the block below into the same Claude Code session (or a fresh one at the repo root) after the kickoff prompt has completed Wave 0.

---

You are resuming as orchestrator for the **Tactical Squad Plan** in `blae-code/rust-legions`. Wave 0 is done: `main` is green, ten lane briefs exist under `docs/prompts/LANE_BRIEFS/`, and `docs/prompts/ORCHESTRATION_LOG.md` records the executed wave order and seven contract amendments (Q1–Q6, Q3b). Everything in `docs/prompts/TACTICAL_SQUAD_KICKOFF.md` still binds — re-read it, then `docs/TACTICAL_SQUAD_PLAN.md` §3–§6 and the log, before spawning anything.

## First: sync — the platform moved under you

The Base44 session made changes that landed on `main` via two-way sync **after** your Wave 0 baseline. Run `git fetch origin && git checkout main && git pull --ff-only && npm install && npm test` and confirm **97 passed** (was 95) before any lane branches. Then rebase every existing `feat/tactical-*` branch onto the new `main`.

What changed and why it matters to lanes:

1. **`base44/functions/gameEngine/entry.ts`** (platform-owned, still off-limits) shrank from 2,459 to 2,393 lines. Two tables were lifted into shared modules the lanes may now **import but not edit**:
   - `base44/shared/commandVehicles.ts` — `COMMAND_VEHICLES`, `SUPREME_VEHICLE`, `VEHICLE_MODS`, `vehicleOf()`. Lane J's chassis work must not duplicate these; a general's command vehicle is a *general* modifier, not a Motor Pool stand.
   - `base44/shared/macroGraph.ts` — `MACRO_ROUTE_QUALITY`, `MACRO_SUPPLY_MILES`, `macroWeatherMult`, `macroFindPath`, `macroSupplied`. Lane B's field generator consumes `nodeKind`/`weather` only; it does not touch the macro graph.
2. **`test/helpers/macro-harness.js`** now injects those two modules and lifts the macro region starting at `const MACRO_UNIT_MARCH = {` (not `MACRO_ROUTE_QUALITY`, which is gone from `entry.ts`). Do not let any lane "repair" this — it is correct.
3. **`test/macro-mirror.test.js`** and **`test/rules-mirror.test.js`** gained import-not-inlined assertions for the new shared modules (same pattern as the `perkMods` assertion from Wave 0). The mirror test is the drift guard §6 names — keep it green after every merge.
4. **Two P3 items are already live** and marked APPLIED in `PLATFORM_HANDOFF.md`: `tacticalOrders` reads `body.orderAction` (Q1), and `tacticalAuto { gameId }` exists. Lane E may ship its auto-resolve button **enabled**. The remaining P3/C3 rows are still pending — lanes keep appending exact bodies there.
5. `base44/shared/tacticalEngine.ts` exported API is **unchanged** — Lane A/C's §6 guard still applies against it as-is.

## Then: execute Wave 1 → Wave 4, stop at the handoff

Follow the wave table in the log exactly:

| Wave | Spawn | Merge gate |
| --- | --- | --- |
| 1 | **I** Arms Catalogue · **B** Field generator · **G** Research/armory/decrees — in parallel | I: roll distribution (10 000 rolls, `mulberry32`, no `Math.random`), `PEN_TABLE` has a `mult: 0` row, issue `rifle` → 0 vs `heavy` while `anti_armor` → >0, every pattern declares `armorPen`/`damageType`/`aoe`. B: 16 `TerrainKey`s exactly, `hexPixel`/`hexCorners` authored in `field.js`. G: ≥20 techs w/ capstones, 20+ armory items, all effects numeric via §4 `effects[]`. |
| 2 | **A** Rules core · **J** Motor Pool — after I merges | A imports `resolveHit` from `arms.ts`, re-exports `hexPixel`/`hexCorners` from `field.js`. J: every chassis has four facings, hardpoint keys ⊆ `WEAPON_PATTERNS`, `mw_*` rows appended to `MANUFACTURERS`, zero `armourValue` arithmetic outside `arms.ts`. |
| 3 | **C** Engine · **F** Units — after A+B | C produces `test/fixtures/tactical-state.json` from its scripted battle; hits on vehicles select a facing. F stops and reports if A has not merged (never authors A's rows). |
| 4 | **H** Factions/houses/lore — after F, G, I, J | 13 house presets w/ unique rosters incl. `patterns`, herald voices for all, 40+ codex entries, no `keel` field on `Preset`. |
| — | **STOP.** Post `PLATFORM_HANDOFF.md` + `ART_MANIFEST.md`. Do not start D/E. | |

Per-merge routine, no exceptions: `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`, mirror test, then the lane-specific checks from the kickoff §"Guarding against drift". Every 2 PRs, diff `base44/shared/tactical.ts` against `src/lib/tactical/data.js`. First red → route back to the owning lane, never fix another lane's file. Append a row to the log's **Merges** table on every merge (lane, PR, branch, tests added, §§ touched, UTC).

## Standing rulings you must enforce in reviews

- `SquadType.pts` is the **squad's** cost (`riflemen.pts === 100`), never a figure's.
- `FIGURES_PER_COMPANY` is keyed by regiment; a type's `figures` may differ.
- All five lanes that touch `src/lib/imageLibrary.js` and `src/lib/wiki/entries.js` append ONE banner-commented block at the **end** of the array. Conflicts resolve as "keep both, in lane order". Only I (`arms`) and J (`motor`) add `IMAGE_CATEGORIES` keys.
- Content lanes author data and prose only — `P(...)` placeholders with `url: null`, no image files, no SVGs, no `PLATE_URLS`, no `UnitSprite.jsx` edits. Every placeholder key goes into `ART_MANIFEST.md`.
- Lane I never asserts an exact `MANUFACTURERS` count (gate is ≥8; J appends).
- Platform-owned files stay untouched: `base44/functions/gameEngine/entry.ts`, `base44/entities/**`, `Patch` records, anything needing `test_backend_function`. Needs go into `PLATFORM_HANDOFF.md` under `### Lane <X>` with exact bodies.

## Deliverable

When waves 1–4 are merged: stop, post `PLATFORM_HANDOFF.md` and `ART_MANIFEST.md`, and summarize — files added per lane, content counts per catalog (squad types, specialists, kits, techs, armory items, houses, codex entries, makers, calibres, patterns, mods, quirks, chassis, powerplants), tests added, contract amendments filed, open questions. No code in the summary. Wait for "Phase 3 is live" before D/E.