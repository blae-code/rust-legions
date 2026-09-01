# PLATFORM HANDOFF — Tactical Squad Plan

Everything the worktree lanes could **not** do because it is platform-owned: `base44/functions/gameEngine/entry.ts`,
`base44/entities/*.jsonc`, `Patch` records, and anything needing a live backend deploy or `test_backend_function`.

Apply these in the **Base44 chat session**, in order. Phase 3 (P3) is the engine wiring; C3 is the content wiring.
Nothing here has been applied except where a row says APPLIED.

> Status: **accumulating.** Lanes append to this file as they discover platform needs. It is posted to the
> operator when waves 1–4 are merged, and the orchestrator then stops until told Phase 3 is live.

---

## 0. Already applied to a platform-owned file (verify it survives the next Base44 sync)

| File | Change | Why | Risk |
| --- | --- | --- | --- |
| `base44/functions/gameEngine/entry.ts` | Two **comment lines only**, added around the settlement-charter block: `// ---------- Begin settlement charter (harness marker) ----------` and `// ---------- End settlement charter (harness marker) ----------` | `test/helpers/macro-harness.js` lifts marked regions of this file textually so the macro simulation tests exercise the real engine instead of stubs. The identical convention already existed in this file for the macro-engine block. | None — zero behaviour change, no deploy required. **Verified surviving** after the 2026-09-01 platform sync. |
| `base44/functions/gameEngine/entry.ts` → `base44/shared/commandVehicles.ts`, `base44/shared/macroGraph.ts` | **Platform-side extraction (2026-09-01):** command-vehicle tables and macro route/weather/pathing/supply math lifted into shared modules; engine imports them. Engine 2,459 → 2,393 lines. Harness now injects both modules and lifts the macro region from `const MACRO_UNIT_MARCH = {`; mirror tests assert import-not-inlined. | Headroom for P3 wiring. | Lanes must **import, never edit** these modules. Rebase lane branches onto the synced `main`; `npm test` = 97 passed. |

---

## P3 — Engine wiring (after waves 1–3)

- [ ] `createTactical` call site passes `{ seed, nodeKind, weather, fortBonus }`.
- [ ] `tacticalDeploy` accepts `squads: [{ name, type, figures, specialists: [], at?: {q,r}, loadout? }]`.
- [x] **APPLIED 2026-09-01** — `tacticalOrders` reads `body.orderAction` (Q1). Envelope `action` stays the
      dispatch verb; `squadId` (legacy `formationId`) and `target.squadId` (legacy `targetId`) are accepted.
- [x] **APPLIED 2026-09-01** — `tacticalAuto { gameId }` hands the caller's side to the staff: deploys via
      `autoFormations` if not yet filed, then runs `autoOrders` turns until the engagement settles. Both sides
      may hand off; the shared `settleTactical` tail persists and archives. **Lane E may ship its button enabled.**
- [ ] `tacticalView` fields persisted via `persistWar()`.
- [ ] Field Amendment `Patch` dispatch filed.

*(Exact function bodies, entity schema JSON and action names are appended by the lanes as they are written.)*

---

## C3 — Content wiring (after wave 4)

- [ ] Import `base44/shared/catalog.ts` into `gameEngine` **and** `concurrentPlay`, retiring the inlined duplicates.
- [ ] Apply the typed `effects[]` vocabulary in the engine.
- [ ] Enforce `creedLock` / `factionLock`.
- [ ] Point `npcHerald` at the `docs/HERALD_VOICES.md` voices.
- [ ] `base44/entities/ArmyDesign.jsonc` → the `SquadTemplate` shape.
- [ ] Generate every placeholder plate registered in `src/lib/imageLibrary.js` and deliver its URL into
      `src/lib/imagePlates.js` — the full list is `docs/prompts/ART_MANIFEST.md`.
- [ ] Promote each `[PROPOSED — awaiting platform wiring]` section of `docs/GAME_RULES.md` to live.

---

## Lane-appended items

*(Lanes append below, one `### Lane <X>` block each, with exact bodies/schemas/action names.)*
### Lane G — the catalog (`base44/shared/catalog.ts`)

**What landed in the worktree, and what it cannot do by itself.** `base44/shared/catalog.ts` is now the
canonical research/armory catalog: `TECHS` (25), `CREEDS` (4), `ARMORY_ITEMS` (32), `RELIC_PROJECTS` (4),
pure data literals, deep-equal-mirrored into `src/lib/doctrine.js` + `src/lib/armory.js` and proved by
`test/catalog-mirror.test.js`. **Nothing in it is wired to anything.** The engine still runs off its own
inlined tables and the frontend mirrors are a strict superset of them — `test/rules-mirror.test.js` was
narrowed to say exactly that, and it snaps back to equality the moment G1 below is done.

#### G1 — import the module, retire the two inlined copies

| Site | Today | After |
| --- | --- | --- |
| `gameEngine/entry.ts:45` | `const TECHS = { …9 rows… }` | `import { TECHS } from '../../shared/catalog.ts'` |
| `concurrentPlay/entry.ts:6` | `const TECHS = { …9 rows, cost+prereq only… }` | same import |
| `concurrentPlay/entry.ts:20` | `const ARMORY = { …7 rows… }` | `import { ARMORY_ITEMS, RELIC_PROJECTS } from '../../shared/catalog.ts'` |

**This import is already proven in both files** — CLAUDE.md's "no local imports between functions" gotcha
is about function-to-function only. `gameEngine` already imports `../../shared/perkMods.ts`,
`../../shared/relics.ts` and `../../shared/tacticalEngine.ts`; `concurrentPlay` already imports
`../../shared/perkMods.ts`. `catalog.ts` adds no new dependency and no `npm:` specifier.

Two shape changes fall out of the swap and both are breaking if missed:

- **`prereq` may now be an array.** `concurrentPlay/entry.ts:55` guards with
  `if (tech.prereq && !(completed).includes(tech.prereq))`, which with an array is always
  "not included" — every array-prereq tech becomes unselectable, including all five capstones. Replace
  with an every-of-the-list check. (The identical bug exists on the display side; see G6.)
- **The rows carry fields the handlers do not read** (`branch`, `tier`, `effect`, `effects`, `desc`,
  `creedLock`, `axis`, `direction`, `objectClass`, `buildDays`). All additive; nothing was renamed and
  no legacy key was dropped, so `slot.research.completed` and `slot.unlocks` from live saves keep
  resolving.

#### G2 — apply `effects[]`, which means building an application layer that does not exist yet

The catalog speaks the §4 `effects[]` vocabulary; the engine speaks `mods` (`shared/perkMods.ts`). An
adapter is required either way, but **do not assume `mergeMods` is the destination** — most of it is
write-only today. Measured against the shipped engine:

| `mods` field | Written by | Read by | Status |
| --- | --- | --- | --- |
| `armyCap` | perks, techs, decrees, relics | `armyCap()` `entry.ts:257` | **applied** |
| `unitCost` | perks | `effectiveCosts()` `entry.ts:270` | **applied** |
| `startBonus` | perks | `entry.ts:1904` | **applied** |
| `disposition` | perks | `entry.ts:1910` | **applied** |
| `unitStat` | perks, techs, decrees, relics | *(nothing — only inverted in `negateMods()` `entry.ts:156`)* | **inert** |
| `income` | perks, techs, decrees, relics | *(nothing — `factionProduction()` `entry.ts:198` never adds it)* | **inert** |
| `capitalDefense` | perks, techs, decrees, relics | *(nothing)* | **inert** |
| `supplyRange` | techs, relics | *(nothing)* | **inert** |

Consequence, stated plainly because it changes what "wire the catalog" costs: of the **16** legacy rows
this lane preserved, only `field_kitchens`, `universal_levy` and half of `total_mobilization` have any
mechanical effect on the shipped build. `standardized_calibers`, `hardened_plate`, `combined_arms`,
`rationalized_foundries`, `synthetic_fuel`, `motorized_supply`, `general_staff_academy`,
`war_bonds_decree`, `fuel_ration_act` and `hearth_and_bulwark` are **already cosmetic** — the catalog
did not make them so and does not fix them. Four read sites are needed (`unitStat` in the combat stat
lookup, `income` in `factionProduction`, `capitalDefense` in the capital-defense roll, `supplyRange` in
the supply envelope) before any `effects[]` value beyond `armyCap` does anything at all.

The mapping itself is mechanical, and the legacy encodings were written to reproduce the existing `mods`
byte-for-byte so the adapter can be validated against them:

```
{ key: "unit.<type>.<stat>", value: v }  →  mods.unitStat[<type>][<stat>] += v
{ key: "income.<res>",       value: v }  →  mods.income[<res>]            += v
{ key: "armyCap"|"supplyRange"|"capitalDefense", value: v } → mods.<key>  += v
{ key: "initiative"|"losRange"|"digSpeed"|"fragmentYield"|"moraleTest"|"buildTurns" } → NO mods field exists
```

Those last **six** keys have no `mods` slot and no consumer. They are the whole of the `signals` and
`reclamation` branches' output, so the two new branches are inert until `mergeMods` is widened and the
macro layer reads them. `moraleTest`, `initiative` and the `melee`/`ranged`/`morale`/`speed`/`armor`
unit stats are tactical-scope and land in Lane A/B/C's engine, not the macro one — every row carries
`scope` (`macro` | `tactical` | `economy`) precisely so the adapter can route them.

**One deliberate behaviour change to approve, not to absorb silently:** `citadel_plate`,
`juggernaut_reactors` and `munitions_works` carry **no `mods`** in `concurrentPlay` today — unlocking
them does nothing. The catalog gives all three an `effects[]` faithful to their shipped `desc`
(`capitalDefense +6`; `income.fuel +1`; `income.steel/fuel/manpower +1`). Applying it makes three
long-dead purchases live. For `kind: 'module'` the catalog's `effects[]` is what the module does once
**fitted**, not what certification does — if the Refit Yard is the intended application point, fit is
where these belong and unlock should stay inert.

#### G3 — fragments are a fourth resource family and cannot be spent today

`concurrentPlay/entry.ts:19` defines `RESOURCE_KEYS = ['manpower','steel','fuel']`, and `unlockItem`
(`:65`) affords and debits over exactly that list. **`cost.fragments` is invisible to it**, so every
`II:*` and `III` row in the catalog is purchasable for free the instant the table is imported. Needed:

- a per-class fragment counter on `factionSlots` — `{ cache, engine, cipher, wake }`, integers, found
  not produced (`docs/TECH_DESIGN.md` §1);
- `unlockItem` affords/debits `cost.fragments` alongside the three conventional resources;
- **the tier gate**, which is a separate check from affordability: `tier` `'I'` is buyable at once;
  `'II:Cache'`/`'II:Eng'`/`'II:Ciph'`/`'II:Wake'` require the matching class; `'III'` requires a housed
  Object of the row's `objectClass` **and** the completed `prereq` doctrines. The catalog guarantees the
  invariant the gate reads — every `'II:'` row carries exactly its own matching fragment class at ≥1 and
  every `'I'` row carries none, asserted in `test/catalog-mirror.test.js`.

Fragment sources are `docs/TECH_DESIGN.md` §1; the `digSpeed` / `fragmentYield` effect keys are the
supply side of the same loop and are two of the six unconsumed keys in G2.

#### G4 — enforce `creedLock`

Eight rows carry `creedLock` and it is enforced nowhere: 4 techs (`vigil_watch` recall,
`bonded_manifests` finished_ledger, `sealing_protocols` flight, `stripping_yards` discarding), 4 decrees
(`writ_of_consecration` recall, `charter_of_passage` finished_ledger, `sealed_sites_order` flight,
`breaking_yards_act` discarding) and 2 relic projects (`the_beacon` recall, `the_new_ignition`
discarding — the two creed forks of the Exodus Works, `docs/TECH_DESIGN.md` §2).

The value is always a `CREEDS` key (`recall` | `finished_ledger` | `flight` | `discarding`) — the test
asserts that, so the handler may treat an unknown value as a bug rather than a soft filter. **A faction
slot has no Departure field yet.** Until Lane H's `Preset.house` / the ideology axes land, `creedLock`
has nothing to compare against; the reject belongs in `setResearchFocus` (`concurrentPlay:47`) and
`unlockItem` (`:65`), not only in the UI, and it must be a server-side refusal — the panels are a
display filter and a save can name a locked key directly.

The Creed axis of `VISION §6.1` is the natural source: `CREEDS[k].axisLean` maps each Departure onto it
(`recall` +1, `finished_ledger` 0, `flight` 0, `discarding` −1), so a house's Departure can be derived
from its axis position rather than stored twice.

#### G5 — `RELIC_PROJECTS` need a build clock, and it is a new persisted structure

A relic project is not a purchase; `docs/TECH_DESIGN.md` §2/§10 makes it an **on-clock, interruptible
race**. `buildDays` is a positive integer in in-game days (24 · 18 · 40 · 40) and is *not* the signed
`buildTurns` effect key (negative = sooner) — both appear in this catalog and they are unrelated.

- new per-slot state: `{ key, startedDay, daysRemaining }`, ticked on the day tick alongside marches;
- **visible to enemy intelligence** — probes/intercepts reveal a running project (that is the design
  point: everyone can see the days remaining);
- **dies with the keel** — a captured base loses its running project. Materials only, per §7 Q5's
  leaning; the decision is still open in that doc and is worth closing before this is built;
- on completion, apply the row's `effects[]` (G2) and file a combat-log event; the herald line is
  drafted in `docs/TECH_DESIGN.md` §4.

**`land_dreadnought` is one machine described by two rows in two tables** — this lane's `RELIC_PROJECTS`
row is the *project that builds it*, Lane F's `SQUAD_TYPES` row is the *stand that then fights*. Both
tier `'III'`. Neither lane edited the other's file; the completion handler is where they meet, and the
orchestrator should diff the two rows at merge.

#### G6 — consumer follow-ups (UI lane, not platform, but they break on the same commit)

All **three** are latent only because the shipped tables had no array prereqs and no fragment costs.
Detail and the exact fixes are in `docs/TECH_DESIGN.md` §12; none of these files is Lane G's and none
was touched.

- `src/components/game/research/TechCard.jsx:8` — `includes(tech.prereq)` against an array prereq
  renders all **9** array-prereq techs, every capstone included, permanently locked. Fix:
  `prereqList(tech).every(…)`, exported from `@/lib/doctrine.js` for this purpose.
- `src/components/game/research/ArmoryPanel.jsx:9` — `affords` iterates `RESOURCE_KEYS` only, so
  `cost.fragments` is invisible and every `II:*`/`III` row reads as affordable. Fix: consume
  `fragmentCost(item)`, exported from `@/lib/armory.js` for this purpose.
- `src/lib/units.js:42` — `costString` filters the **same** `RESOURCE_KEYS`, and `ArmoryPanel.jsx:38`
  renders the price with it. So the fragments are missing from the price tag as well as from the
  affordability check: `pattern_shop` shows "8 STL + 4 FUE", `the_new_ignition` "16 MAN + 40 STL + 24
  FUE". Fix: append the `fragmentCost(item)` entries to the rendered string. **`units.js` is a shared
  frontend file, not Lane G's — this is a report, not a change.**

Two display notes for the same lane, neither a bug: `DoctrinePanel`'s branch grid is `sm:grid-cols-3`
and now holds **5** branches; `ArmoryPanel`'s kind grid is `sm:grid-cols-2` and now holds **3** kinds.
Both wrap and render correctly.

#### G6b — one effect the §4 vocabulary cannot express

`docs/GEAR_LIBRARY.md` defines the **Pattern Shop** as reducing Armory certification **cost** by a
quarter. §4's effect-key vocabulary has no cost-modifier key and no percentage semantics — every key in
it is a flat signed integer added to a stat, an income or a turn count. Rather than invent a percentage
that the engine would have to special-case, the row ships encoded as `buildTurns -2`, which is a true
statement about it, and the shortfall is recorded here instead of hidden in prose. **No vocabulary key
was added.** If the platform lane wants the certification discount, it needs a new §4 key (a flat
`certificationCost` modifier is the shape that matches the rest of the vocabulary; a percentage is not)
and `pattern_shop` is its first consumer.

#### G7 — promote the rules section

`docs/GAME_RULES.md` **§23 — Doctrine, Armory & Relic Projects** is appended and marked
`[PROPOSED — awaiting platform wiring]`. Drop the marker when G1–G5 are live; the design record and the
reasoning behind every number stay in `docs/TECH_DESIGN.md` §8–§12. Existing §19 (research tree) and
§20 (State Armory) were **not** edited — §23 supersedes them on the day the marker comes off, and
folding the two old sections into it is a platform-lane edit, not a content-lane one.
