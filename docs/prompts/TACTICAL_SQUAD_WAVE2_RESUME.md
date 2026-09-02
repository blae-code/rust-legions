# Resume prompt — Tactical Squad Plan, Wave 2 → handoff

Paste the block below into the running orchestrator session once the Wave 2 dynamic workflow (A + J) reports.

---

Wave 1 report received and accepted — the repair of `entries.js`, the handoff merge, and the export-enumerating `tactical.ts` mirror test are all the right calls. Continue as orchestrator through Wave 2, 3 and 4, then stop at the handoff. Everything in `TACTICAL_SQUAD_KICKOFF.md` and `TACTICAL_SQUAD_RESUME.md` still binds.

## Sync first

The operator pushed two rulings into `docs/prompts/PLATFORM_HANDOFF.md` from the Base44 side; they will arrive on `main` on the next two-way sync. `git fetch origin && git checkout main && git pull --ff-only && npm test` — confirm 601+ green — then rebase `feat/tactical-a` and `feat/tactical-j` before merging either. If the handoff file has not yet gained the two `> **RULED 2026-09-01 (operator)**` blockquotes under Lane G's G2 and G5, wait for the sync rather than merging over it.

## Two operator rulings — enforce in every review from here

1. **Module effects apply on FIT, never on unlock.** For any catalog row with `kind: 'module'`, certification is inert; `effects[]` apply when fitted in the Refit Yard and are removed on unfit. Lane G's `citadel_plate`, `juggernaut_reactors`, `munitions_works` come alive on fit only. Lane J: if any Motor Pool refit kit is modelled as an armory module, it follows the same rule — a kit's numbers live on the fitted stand, not the faction. Lane H: house presets must not assume unlock grants a module's effect.
2. **Relic projects die with the keel; materials only.** When a fortress-base is captured, the captor loots the running project's *unspent materials*; the project, its progress and its housed-Object requirement are lost. Lane H closes `docs/TECH_DESIGN.md` §7 Q5 on this ruling in its PR and writes the herald line for the loss. Lane C does not implement the capture path (boarding assaults are a later Field Amendment) but must leave a `relicProject` slot on the per-faction tactical state it fixtures, so the shape is not re-cut later.

## Wave 2 gate — A and J

Everything from the resume prompt plus:

- **A** — `resolveHit` imported from `arms.ts`, zero `armourValue`/`PEN_TABLE[`/`TYPE_MATRIX[` outside it; `hexPixel`/`hexCorners` re-exported from `field.js`; `CASUALTY_ORDER` bug fixed **with** a failing-then-passing test; the export-enumerating mirror test is what pins `tactical.ts` from now on. A's `COMBAT_DESIGN.md` receives B's connectivity note *by A's hand* — check that the draft B posted was edited into A's voice, not pasted.
- **J** — every chassis declares all four facings as `ARMOUR_CLASSES` keys; every hardpoint weapon key ∈ `WEAPON_PATTERNS`; `mw_*` rows appended to `MANUFACTURERS` as flat one-row blocks; `deriveMechanized` output keys ⊆ §4 `SquadType` value keys ∪ `{facings}`; no `Math.random`; 10 000-roll distribution test; grep `motorPool.ts` for `armourValue` arithmetic and reject any. J may **import** `base44/shared/commandVehicles.ts` for reference but must not duplicate a general's command vehicle as a Motor Pool chassis.

After both merge: diff `base44/shared/tactical.ts` ↔ `src/lib/tactical/data.js` and `arms.ts` ↔ `arms.js` (J appended to I's table — the mirror must still deep-equal).

## Wave 3 — C and F

- **C** produces `test/fixtures/tactical-state.json` from a scripted battle **that includes at least one vehicle stand**, so a facing selection is in the fixture. `createTactical(attackerUnits, defenderUnits, fieldOpts)` per Lane B's exact `fieldOpts` shape; `field` stored on `battle.tactical`, never regenerated; `field.meta` carried through `tacticalView`. `GRID` → `FIELD` (15×11) is C's move. `tacticalEngine.ts` exported API must remain a superset of today's — nothing removed or re-signatured.
- **F** stops and reports if A has not merged. `land_dreadnought` — diff F's `SQUAD_TYPES` row against G's `RELIC_PROJECTS` row at merge; same tier `'III'`, same `pts` basis (squad cost, not figure).

## Wave 4 — H

13 house presets with unique rosters including `patterns`; herald voices for all 13 in `HERALD_VOICES.md`; 40+ codex entries appended as ONE tail block; no `keel` field on `Preset`; every house's Departure derivable from its Creed-axis position (G4 relies on this); §7 Q5 closed per ruling 2.

## Then STOP

Post `PLATFORM_HANDOFF.md` and `ART_MANIFEST.md`. The operator's Base44 session takes Phase 3 / C3, which now includes: G1 catalog import, the four inert `mods` read sites (`unitStat`, `income`, `capitalDefense`, `supplyRange`), fragments as a resource family, `creedLock`, fit-time module effects, the relic-project clock, and the three G6 frontend consumer fixes (`TechCard`, `ArmoryPanel`, `units.js`) — **do not assign G6 to a lane**; they break only when G1 lands and the operator will fix them in the same commit.

Summarize as before: files per lane, catalog counts, tests added, amendments filed, open questions. No code. Wait for "Phase 3 is live" before D/E.