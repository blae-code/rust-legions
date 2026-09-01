# ORCHESTRATION LOG — Tactical Squad Plan

Running record kept by the orchestrator. One row per lane merge, plus every contract amendment.
Contract: `docs/TACTICAL_SQUAD_PLAN.md`. Briefs: `docs/prompts/LANE_BRIEFS/`.

## Wave order being executed

| Wave | Lanes | Gate |
| --- | --- | --- |
| 0 | *(orchestrator)* baseline repair + 10 lane briefs | `npm test` green on `main` |
| 1 | **I** Arms Catalogue · **B** Field generator · **G** Research/armory/decrees | mirror + roll + field tests green |
| 2 | **A** Rules core · **J** Motor Pool | both need I merged |
| 3 | **C** Engine · **F** Units/specialists/upgrades | C needs A+B; F appends to A's tables |
| 4 | **H** Factions, houses & lore | needs F, G, I, J |
| — | **PLATFORM HANDOFF — stop and wait** | `PLATFORM_HANDOFF.md` + `ART_MANIFEST.md` posted |
| 5 | **D** Squad builder · **E** Arena | only after Phase 3 is live |

## Wave 0 — baseline repair + briefs (2026-09-01)

**`origin/main` was RED on arrival** at `d92f47f`: 6 failing tests across 3 files and 1 lint error, all
pre-existing and unrelated to this plan. Every lane PR must pass `npm test` (§6.8), so this was repaired
before any lane was spawned.

| Failure | Root cause | Fix |
| --- | --- | --- |
| `rules-mirror.test.js` — `const PERK_MODS not found` | `PERK_MODS` was de-duplicated into `base44/shared/perkMods.ts` (commit `b27babb`); both backends now import it. The test still read the two `entry.ts` files. No data drift — the 20 keys were set-equal to `pointBuy.js` throughout. | Re-pointed at the real source of truth, **plus** a new assertion that neither backend has re-inlined a local copy. Strictly stronger than before. |
| `macro-mirror.test.js` — tuples vs objects | `MACRO_CONTINENT_NODES` is authored as compact tuples with a trailing `.map(...)` expansion on the same line (commit `f2ab9af`). `extractConst` stopped at the literal's `]` and never consumed the chain, so it compared source encoding against runtime shape. Data was in sync. | `extractConst` now evaluates a whitelisted pure trailing chain (`map/flatMap/flat/filter/slice/concat/reverse`). New `test/extract-const.test.js` (5 cases) pins the extractor itself. |
| `macro-engine-sim.test.js` — 5× `ReferenceError` | `test/helpers/macro-harness.js` lifts one contiguous region of `gameEngine/entry.ts` and evals it. Two symbols it now calls (`surveySettlement`, `BARTER_COOLDOWN_DAYS`) live outside that region. The audit found **four more** on the same executed paths (`excavateRelic`, `charterOptions`, `crisisView`, `settlementDossier`) that would have surfaced the moment the first two were fixed. | The harness now imports the real `base44/shared/*.ts` modules and injects them, and lifts a second marked region for the charter block. Nothing stubbed — the simulation still exercises real engine code. |
| `npm run lint` | unused `PRESET_FACTIONS` import in `src/pages/NewGame.jsx` | removed |

**Result:** `npm test` 95 passed / 0 failed (was 49 passed / 6 failed), `npm run lint` clean,
`npm run typecheck` clean. No test was deleted, skipped, weakened, or edited to match broken source —
verified by an independent adversarial reviewer over the diff.

**⚠ One platform-owned file was touched:** `base44/functions/gameEngine/entry.ts` gained **two comment
lines only** (`// ---------- Begin/End settlement charter (harness marker) ----------`), following the
convention already present in that file at the macro-engine block. Zero behaviour change, no deploy
needed. Recorded in `PLATFORM_HANDOFF.md` so it is not lost in the next Base44 sync.

## Contract amendments

| Date | § | Amendment | Filed by |
| --- | --- | --- | --- |
| 2026-09-01 | §4 | **Q1** — `tacticalOrders` declared `action` twice; the second key won and the body could not route. Squad action key renamed **`orderAction`**; envelope `action` stays the dispatch verb. | orchestrator |
| 2026-09-01 | §5 | **Q2** — §5 was circular on Lane F (C1 row put F ∥ A; §3 requires F after A; §5 requires I before A). Replaced with the explicit executed wave-order table above. | orchestrator |
| 2026-09-01 | §3 | **Q3** — Lane H `uniqueRoster` was missing `patterns`; §4 governs. | orchestrator |
| 2026-09-01 | §4 | **Q3b** — ruled that `Preset` gains **no** `keel` field; the `keel_<key>` plate keys off the existing `house` value. | orchestrator |
| 2026-09-01 | §3 | **Q4** — Lane G cited `VISION §5` for the ideology axes; they are `VISION §6.1`. | orchestrator |
| 2026-09-01 | §4 | **Q5** — `FIGURES_PER_COMPANY` is keyed by **regiment**, never by squad type; a type's `figures` may differ from its regiment's company size. Resolves §3-vs-§4 divergence that would have broken every Lane F type whose squad is not 10 figures. | orchestrator |
| 2026-09-01 | §0 | **Q6** — noted that `hexPixel`/`hexCorners` move to `field.js` with Lane B and that `data.js` re-exports them, so no consumer's import path breaks. | orchestrator |

Standing ruling recorded in every brief: **`SquadType.pts` is the squad's cost, not a figure's** —
`riflemen.pts === 100`. Two briefs had disagreed by a factor of ten, which would have mis-scaled Lane F's
entire Points Audit and its 1.6× efficiency gate.

## Cross-lane collisions removed before spawning

Found by the brief critic, fixed in the briefs (details in the Wave 0 workflow transcript):

- **Lane F was told to author Lane A's base rows** as a contingency — the exact collision §3 forbids. Withdrawn; F now stops and reports if A has not merged.
- **`hexPixel`/`hexCorners`**: A and B each believed the other owned the deletion. Now a stated two-step protocol (B authors in `field.js`; A re-exports after B merges); Lane E's import path never breaks.
- **`src/lib/imageLibrary.js`** (5 lanes) and **`src/lib/wiki/entries.js`** (5 lanes): three different append shapes across the briefs. All five now append ONE banner-commented block at the END of the array, so conflicts are mechanical (`keep both, in lane order`). New `IMAGE_CATEGORIES` keys go inline in that object — only I (`arms`) and J (`motor`) need one.
- **Three content lanes had refused to write Codex entries or the `[PROPOSED]` `GAME_RULES.md` section** at all, routing them into design-doc annexes that no lane was instructed to lift — their own §3 acceptance criteria would have been unmeetable. Refusals withdrawn.
- **`TerrainKey`**: Lanes E and J had each invented `street`, which is not one of Lane B's 16 keys (the canonical key is `road`), and both omitted several real ones. Since §4 keys `Suspension.terrain` by `TerrainKey`, every Lane J suspension would have returned `undefined` for most of a depot or ruin field. Corrected to B's exact 16 in both.
- **`land_dreadnought`**: one machine, a Lane F `SQUAD_TYPES` row and a Lane G `RELIC_PROJECTS` row; neither brief knew about the other. Cross-referenced in both.
- **`MANUFACTURERS`**: §3 lets Lane J append `mw_*` rows to Lane I's table, but Lane I was about to assert an exact manufacturer count — which would go red on `main` the moment J appended. Lane I is now barred from asserting a count (the gate is ≥8) and must keep the table a flat one-row-per-block literal.

## Merges

| Lane | PR | Branch | Tests added | Contract §§ touched | Merged (UTC) |
| --- | --- | --- | --- | --- | --- |
| *(pending)* | | | | | |
