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
| **I** Arms Catalogue | [#6](https://github.com/blae-code/rust-legions/pull/6) | `feat/tactical-i` | `arms-mirror` (189) + `arms-roll` (114) = 303 | §4 Arms block, §6.11/6.12, GAME_RULES §23 `[PROPOSED]` | 2026-09-01 |
| **B** Field generator | [#5](https://github.com/blae-code/rust-legions/pull/5) | `feat/tactical-b` | `tactical-field` (96) | §4 field shape + `FieldMeta`, COMBAT_DESIGN | 2026-09-01 |
| **G** Research/armory | [#4](https://github.com/blae-code/rust-legions/pull/4) | `feat/tactical-g` | `catalog-mirror` (105) | §4 Tech/ArmoryItem, GAME_RULES §24 `[PROPOSED]` | 2026-09-01 |
| **A** Rules core | [#7](https://github.com/blae-code/rust-legions/pull/7) | `feat/tactical-a` | `tactical-mirror` (200) | §4 SquadType/Specialist, §4 Q5 regiment-keyed ratio, §6.1, §6.12 | 2026-09-01 |
| **J** Motor Pool | [#8](https://github.com/blae-code/rust-legions/pull/8) | `feat/tactical-j` | `motor-mirror` + `motor-roll` (133) | §4 Motor Pool block, §4 Q7/Q8 amendments, §6.12, §6.13, GAME_RULES `[PROPOSED]` | 2026-09-01 |
| **C** Engine | [#10](https://github.com/blae-code/rust-legions/pull/10) | `feat/tactical-c` | `tactical-engine` (164) | §4 tacticalView payload (C1/C2), §4 Q9-Q12, §6.2 export freeze, GAME_RULES §26 | 2026-09-02 |
| **F** Units/specialists/kits | [#9](https://github.com/blae-code/rust-legions/pull/9) | `feat/tactical-f` | `gear-points-audit` + mirror growth | §4 SquadType/Specialist/Upgrade rows, GAME_RULES §27 | 2026-09-02 |
| *fix* Lane A gates | — | `fix/tactical-a-gates` | frozen-pin + optional-field gates | §4 SquadType optionals | 2026-09-02 |
| *fix* Lane C optionals | — | `fix/tactical-c-optionals` | payload-shape gates opened | §4 Tile/status/fx optionals | 2026-09-02 |

### Wave 1 — platform sync, then merge

`main` moved under the wave: the Base44 session lifted `commandVehicles.ts` and `macroGraph.ts` out of
`gameEngine/entry.ts` and marked two P3 items APPLIED (`body.orderAction`, `tacticalAuto`). All three lane
branches were rebased onto it. `npm install` was **not** run — `package.json`/`package-lock.json` were
byte-identical across the sync, and this checkout's `node_modules` is a symlink into a shared store that
npm deletes and reifies inside the vault.

**Session limit interrupted the first wave-1 run** (13 of 23 agents finished). No work was lost: 24 audit
findings were recovered from the workflow journal and fed to the fixers rather than re-run.

**Ownership breaches caught and backed out before merge:**
- Lane B had written an 86-line `## 13. The Field Generator` into `docs/COMBAT_DESIGN.md` — §3 assigns
  that file to **Lane A**. Three independent auditors flagged it as a blocker. The instruction came from
  the orchestrator's own build prompt and was wrong; §3 wins. Section preserved and handed to Lane A.
- Lane G had appended 73 lines to `docs/prompts/ART_MANIFEST.md`, which is orchestrator-owned. Backed out;
  the orchestrator folds each lane's plate rows in at merge time. Lanes now report plate keys in the PR body.

**Defects the audits caught that tests could not:** Lane B's connectivity-repair pass was entirely dead
code whose justification in the docs was factually false (now exported, live and directly tested against a
deliberately broken field); its `losCap` boundary could be made exclusive with all 87 tests green. Lane G's
published cost curve claimed 22 RP per branch and 110 for the tree against a real 28/28/22/28/32 and 138,
restated in three places with nothing checking it — corrected, and a new test now parses the published
table out of `TECH_DESIGN.md` and asserts it against the computed totals, so it cannot rot again.

**Merge-time collisions, all resolved as "keep both, in lane order":** `PLATFORM_HANDOFF.md` (three times),
`src/lib/imageLibrary.js`, `src/lib/wiki/entries.js`, and `docs/GAME_RULES.md` — where Lanes I and G had
both taken `## 23.`, so G was renumbered to §24.

**Two defects the orchestrator introduced in its own conflict resolution, and had to fix:**
1. Taking the lane side wholesale on `PLATFORM_HANDOFF.md` reverted the platform's three APPLIED rows.
   Caught on verification; the resolver was rewritten to union both sides rather than pick one.
2. Unioning the two Codex tail blocks dropped the closing brace of Lane I's final entry, making
   `src/lib/wiki/entries.js` invalid JS. Both mirror suites then failed **at collection time**, which
   zeroes a whole file rather than one assertion — 601 tests silently reported as 308. The renumber also
   left two of Lane G's own Codex entries tagged `Doctrine §23`, pointing at the Arms Catalogue; retagged.

**Routed back to its owner rather than fixed in place:** Lane I's `§14 ↔ GAME_RULES` assertion sliced from
its own heading **to end of file** on both sides — true only while Lane I was the last lane to append.
Lane G's §24 broke it. That is a gate on a proxy, and it is Lane I's file, so Lane I fixed it.


### Wave 2 — Lane A merged, Lane J in audit

**A second session limit** interrupted the wave: Lane A completed through its fixer, Lane J finished
building but its three audit lenses were cut. Lane A was verified by the orchestrator and shipped by hand;
Lane J's audits were re-launched rather than skipped.

**Operator rulings arrived mid-wave** (in `PLATFORM_HANDOFF.md` as `RULED 2026-09-01 (operator)`) and are
now enforced in every review: **module effects apply on FIT, never on unlock** — a `kind: 'module'` row's
certification is inert and its `effects[]` live on the fitted stand, not the faction; and **relic projects
die with the keel** — on capture the captor loots unspent materials only, the project and its progress are
lost. Lane H closes `TECH_DESIGN.md` §7 Q5 on the second.

**Lane A's mirror test is now what pins `tactical.ts`.** It DISCOVERS rather than remembers: it parses
every top-level `export const` out of the canonical file and demands a mirror for each, classifying by
right-hand side so a table that becomes computed (`export const SQUAD_TYPES = buildTypes()`) is caught too.
A hand-written list of table names is a gate on a proxy — it passes for exactly the tables someone
remembered, which is precisely how `CASUALTY_ORDER` stayed unmirrored since before this plan began.
Verified after the merge: `tactical.ts` ↔ `data.js` 21 exports, `arms.ts` ↔ `arms.js` 28 exports, zero drift.

**The `COMBAT_DESIGN.md` handover worked as intended.** Lane B's draft was edited, not pasted — 34 of its
83 lines rewritten or cut, and the false claim its own audit had found (the arterial described as a
connected spine, when a one-row drift leaves consecutive hexes two apart) is corrected against the merged
generator and replaced with the bridging-hex mechanism.

### A red the orchestrator caused, and a red the platform caused

1. **Pushed a red `main` for ~3 minutes.** A verification chain ended in `grep`, whose exit code masked
   `npm test`'s failure, so `&&` let the push proceed. Exit codes are now checked with `set -e` and a
   separate assertion rather than inferred from a pipeline's tail.
2. **The red itself was NOT a lane defect.** The Base44 session delivered nine of Lane I's maker plates
   into `PLATE_URLS`, and Lane I asserted `url === null` for every arms plate under the banner "content
   lanes never ship visuals". But `P()` resolves `url` from `PLATE_URLS`, so that assertion forbids the
   delivery step the pipeline exists to perform — it encoded *"no art exists yet"* as if it were *"the lane
   shipped no art"*. Another gate on a proxy, and this one went red the first time the platform did its
   job. Corrected to the invariant that is actually meant: a plate's `url` is null **or** equals
   `PLATE_URLS[key]`, so any visual arrived through the platform's channel and never from a literal in
   `imageLibrary.js`. Fixed by the orchestrator rather than routed back, because the red came from the
   platform's commit and invalidated already-merged work; Lane G's and Lane J's plate guards were checked
   for the same shape and are clean (51 of Lane G's plates are already delivered without incident).

### Wave 2 closed — 934 tests green

Post-merge parity, as required after every two PRs and specifically after Lane J appended to Lane I's
table: `tactical.ts` ↔ `data.js` **21 exports, 0 drift**; `arms.ts` ↔ `arms.js` **28 exports, 0 drift**.
`MANUFACTURERS` is 14 = Lane I's 9 preserved byte-for-byte + Lane J's 5 `mw_*`.

**Lane J: 23 findings, 1 blocker, every fix mutation-checked.** The blocker was Lane J's own whole-table
`MANUFACTURERS` assertions — the very thing Lane I had been barred from doing, reintroduced one lane
later from the other side. Rescoped to something stronger for its own namespace. Also caught: ~11% of
rolls emitted contradictory locomotion tokens (a class token and a drive token disagreeing), and
`Mount.hardpoints` was *documented* as a firing limit it never implemented — the code was right and the
doc was wrong, so the doc was corrected rather than the behaviour bent to match it.

Lane J also adopted `main`'s plate-gate fix while rebasing, unprompted: it carried the identical
`url === null` assertion and would have gone red the day a motor plate was delivered.

### Two contract questions ruled on rather than left open

| # | Raised by | Question | Ruling |
| --- | --- | --- | --- |
| **Q7** | Lane J | Its export surface is a superset of §4 (`MOTOR_MODEL`, `evaluateVehicleQuirk`, two optional `ctx` params) | **Blessed.** §4 is a contract, not an export whitelist. Extra pure helpers are allowed provided every contracted export keeps its name and signature, an added optional parameter leaves the contracted call form identical, and the lane pins its full surface in a test — all of which Lane J did instead of filing a competing amendment. |
| **Q8** | Lane J | `PLATFORM_HANDOFF.md` is an eleventh path its own ownership gate flags | **Blessed as an append surface for every lane.** §3's owned-file lists never named it, so a correct gate read a required action as a breach. The kickoff has always demanded lanes collect platform needs there. It is now the ONE shared doc lanes may append to; `ART_MANIFEST.md` and `ORCHESTRATION_LOG.md` stay orchestrator-only. |

Both are recorded in §4 of the plan as amendments Q7 and Q8.

### Wave 3 — Lane C merged; Lane F blocked by Lane A, and the reason is systemic

**Lane C (PR #10, 1098 tests).** Verified before merge: all eight frozen exports intact with unchanged
signatures (one added, `autoResolveRemainder`, permitted by Q7); zero armour arithmetic; the field stored
on `battle.tactical` and never regenerated; `field.meta` carried through `tacticalView`. The fixture Lanes
D and E will build against is **real**: 23 squads on 15x11, four mechanized stands, every row carrying
`facing` and `armour`, `fx.facing: "rear"` — an actual facing selection — plus `field.meta`, a
`relicProject` slot and live suppressed/routed states.

Four open questions ruled as amendments **Q9-Q12**: `relicProject` belongs in the payload (the fixture IS
the payload, and a hidden slot is one D/E must re-cut later); it is keyed by **role**, not faction id;
`orderAction: 'march'` is **engine-reserved** — not priced, not gated, never in a squad's `actions[]`, and
not a missing Lane A row; and `facing` is emitted on **every** row because a row shape that varies by type
forces every consumer to branch before it can read.

### THE SAME DEFECT CLASS, FOR THE THIRD TIME — and this time it shipped

Lane F did its mandated job (SQUAD_TYPES 9 -> 16+, SPECIALISTS 5 -> 10) and hit **ten** failing assertions,
all in Lane A's `test/tactical-mirror.test.js`, none of them Lane F's fault:

- `expect(SQUAD_TYPE_KEYS).toEqual([...the nine...])` — a whole-table equality gate.
- `expect(Object.keys(SPECIALISTS)).toEqual([...the five...])` — the same.
- `expect(row.tier).toBe("I")` — which structurally **forbids** the tier `'II:Eng'` and `'III'` rows §3
  *requires* Lane F to add.

**A gate must fail on DRIFT, not on GROWTH.** These encode "these are the only rows that exist" when the
fact worth protecting is "these particular rows are correct and unchanged". The history:

| Occurrence | Table | Outcome |
| --- | --- | --- |
| Lane I | `MANUFACTURERS` | **Pre-empted** — the orchestrator barred an exact count in the brief, because Lane J appends `mw_*` rows |
| Lane J | `MANUFACTURERS` | **Caught by audit** — shipped anyway from the other side; rescoped to something stronger (every Lane I key present and correctly keyed, AND the `mw_*` subset matching the registry exactly) |
| Lane A | `SQUAD_TYPES` / `SPECIALISTS` | **Shipped and blocking** — found only when the lane it blocks tried to do its job |

The pattern is that the lane writing the gate is never the lane the gate will obstruct, so it cannot feel
the cost of closing the table. Being warned in a brief was not enough; only the audit caught Lane J, and
nothing caught Lane A.

**Lane F behaved correctly and is worth recording as the right precedent.** Its ship order said "never
push red"; its ownership rule said "§3 is absolute — report the conflict, do not write into another lane's
file". Those conflicted. It followed §3, refused to edit Lane A's test, pushed red **deliberately**, and
made the red unmissable in its PR title and first screen. No test was weakened and no mandated content was
dropped to go green. Routed to Lane A, whose file it is.

### Wave 3 closed — 1180 tests green

**Lane F's `land_dreadnought` cross-check passes.** Lane F's `SQUAD_TYPES` row and Lane G's
`ARMORY_ITEMS` row are both tier `'III'`, and F's `pts: 156` is a squad cost against riflemen's 100.
The orchestrator's first check reported a mismatch by reading `RELIC_PROJECTS` — the build-spec table,
which carries no tier — instead of the `ARMORY_ITEMS` row where the tier lives. Orchestrator error, not
a lane defect.

### THE CLOSED-SET DEFECT, FOUR TIMES, AND WHAT IT ACTUALLY COSTS

This is the finding of the whole run. **A gate must fail on DRIFT, not on GROWTH — and "growth" includes
a field §4 marks with a `?`.**

| # | Where | How it surfaced | Cost |
| --- | --- | --- | --- |
| 1 | Lane I, `MANUFACTURERS` | **Pre-empted** — the orchestrator barred an exact count in the brief | none |
| 2 | Lane J, `MANUFACTURERS` | **Caught by audit** — shipped anyway from the other side | one fix inside the lane |
| 3 | Lane A, `SQUAD_TYPES` / `SPECIALISTS` row set | **Shipped.** Found only when Lane F tried to do its mandated job | Lane F blocked, a full route-back |
| 3b | Lane A, the FIELD set inside the same repair | The repair itself, one level down — `creedLock` is `optional` in §4 | a second route-back |
| 4 | Lane C, `tile` / `status` / `fx` optional members | **Found by Lane A's sweep, not by any test.** Passed only because the assertion sampled a row without the optional — while the fixture already contained the breaking cases | pre-empted before D/E |

Two structural lessons worth keeping:

1. **The lane writing the gate is never the lane the gate obstructs**, so it cannot feel the cost of
   closing the set. Being warned in a brief was not enough — only an audit caught Lane J, and nothing at
   all caught Lane A until the blocked lane arrived.
2. **A gate that passes by accident of selection is worse than one that fails.** Lane C's tile gate had
   been green over a fixture that already contained `work` tiles and `building` statuses; it was simply
   looking at `tiles["5,5"]`. Fixing it meant iterating the collection, not editing the expectation.

Every repair in this class came out **stronger** than what it replaced: a key-list cap never noticed a
re-tuned stat, a renamed key or a dropped field, whereas a field-for-field frozen pin plus a
required/allowed/optional split catches all of those *and* survives the append.

### Lane F set the precedent for a red PR

Lane F's ship order said "never push red"; §3 said "ownership is absolute — report the conflict, do not
write into another lane's file". Ten assertions in Lane A's file structurally forbade the rows §3
*mandates* Lane F to add. It followed §3, refused to edit Lane A's test, pushed red **deliberately**, and
made it unmissable in the PR title and first screen. Nothing was weakened and no mandated content was
dropped to go green. That is the correct behaviour under a genuine rule conflict and it is recorded here
as precedent.
