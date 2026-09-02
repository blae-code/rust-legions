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
### Lane I — the Arms Catalogue & the Universal Damage Model

Data is complete, tested and mirrored (`base44/shared/arms.ts` ↔ `src/lib/arms.js`). Nothing below
is wired; each item is a decision the platform lane owns.

**1. Where `rollWeapon` fires.** `rollWeapon({ seed, class, maker, calibre, tierCap, luck })` is pure
and seeded and returns a `WeaponInstance` — the lane supplies the function, the platform decides the
trigger. The three §3 callers named are **battle loot**, **dig finds** and **armory certifications**.
Each needs a `seed` that is *stable and reproducible from the game record*, because a serial is
reproduced from its seed rather than stored: derive it from `(gameId, turn, sourceKey, index)` and
never from `Date.now()` or a request-time random. A re-derivable seed means the same dig produces the
same rifle on a replay, a refresh and a rollback.

**And a derivation that comes up short now FAILS rather than degrades.** `mulberry32` coerces its
argument with `a |= 0`, so an `undefined` or `null` seed used to become seed 0 and every caller that
failed to derive one got the same weapon, silently and permanently. `rollWeapon` throws
`rollWeapon: seed must be a finite number` on anything non-finite (`undefined`, `null`, `NaN`,
`Infinity`, a numeric string). Seed `0` itself is a perfectly good seed — the guard is on finiteness,
not on truthiness. Likewise a non-finite `luck` is now treated as neutral `0`; it previously poisoned
every adjusted weight and returned the RAREST grade on every roll.

**2. Arsenal validation of any instance reaching `tacticalDeploy`.** A `WeaponInstance` arriving from
a client is untrusted. Before it is stored on a squad's `loadout`, the engine must reject it unless:
`patternKey ∈ WEAPON_PATTERNS`; `quality ∈ QUALITY_GRADES`; every `mods[k] ∈ MODIFICATIONS` with
`slot ∈ WEAPON_PATTERNS[patternKey].slots` and `appliesTo` containing the pattern's class; **no two
mods share a slot**; every `quirks[k] ∈ QUIRKS`; and `serial` matches `/^[A-Z]{3}-\d{3}-[0-9A-Z]{5}$/`.
Those are exactly the invariants `test/arms-roll.test.js` asserts over 500 rolled instances, so a
validator can be written straight off that test. Without it a client can hand itself a `relic`-grade
anti-crawler lance with four ammunition kits on it and the engine will price it as legal.

**3. Where a `Loadout` is persisted.** §4 says squad rows gain `loadout?: Loadout`
(`{ primary, support?, sidearm? }`). The lane does not touch `base44/entities/**`, so the field does
not exist yet. The engine consumes only `deriveLoadout(squad)` and `loadoutProfile(squad)` — never a
raw instance (drift guard 11) — so the storage decision is free as long as those two are what the
tactical path reads.

**Two rules `deriveSquad` must not guess at, both now asserted in `test/arms-roll.test.js` and
written up in `docs/ARMS_CATALOGUE.md` §10.2:**

- **An absent `loadout` must not be reduced, and the function makes that safe for you.**
  `deriveLoadout`'s `melee`, `ranged` and `range` are `absolute` in `LOADOUT_KEYS` — they *replace*
  the `SquadType` base value. Since no squad row carries a `loadout` yet, a `deriveSquad` that
  applied the result unconditionally would zero every authored `melee`/`ranged`/`range` in the game.
  So a squad with **no `loadout` at all returns `{}`** (contributes nothing, overrides nothing),
  while a squad with a `loadout` that is **present and empty** returns the full set of zeroes —
  an unarmed stand, where zero is the right answer. Calling it unconditionally is safe.
- **The values are PER FIGURE, not per squad.** `SquadType.pts` is the cost of a squad
  (`riflemen` = 100, ten figures); `WeaponPattern.pts` is the cost of one weapon (the 141 Levy Rifle
  = 1). `deriveLoadout` never reads `squad.figures` — a one-figure team and a ten-figure section
  carrying the same weapons reduce identically. `deriveSquad` multiplies `melee`, `ranged` and `pts`
  by `figures` before applying them; `range` and `speed` describe what one figure carries and are
  never scaled. A ten-figure section with 1-point rifles adds **10** to its 100-point squad, and
  `deriveLoadout` returns the **1**.

**4. Where a stand's `armour` class is stored.** §4 says every stand row gains
`armour: ArmourClassKey`, infantry `none/soft/light` via upgrade kits, vehicles **per facing**. Lane J
keys its `Facings` off `ARMOUR_CLASSES`; `resolveHit` takes the armour-class **row**, not the key, so
whatever stores the key must resolve it through `ARMOUR_CLASSES[key]` at the call site.

**5. `resolveHit` is the only armour arithmetic in the repository** (drift guard 12). Lane A imports
it rather than writing penetration code; `test/arms-mirror.test.js` asserts that `armourValue`,
`PEN_TABLE[` and `TYPE_MATRIX[` appear nowhere outside `penMultFor` / `resolveHit` / `resolveAoe` in
either file. If the engine needs suppression weighting, `SUPPRESSION` is exported as data — a
zero-effect hit still suppresses, and that number belongs in the table, not in the engine.

**6. `docs/GAME_RULES.md` section 23** is appended as
`[PROPOSED — awaiting platform wiring]` and is on the C3 promotion list.

**7. A decision the lane could not make: the morale/initiative quirks are DECLARATIVE.** §4 declares
`Quirk.mods` as `Partial<WeaponBase> | { morale?, initiative? }` — a **union**, and no row mixes the
two branches (asserted, because `applyDelta` copies only `WeaponBase` keys and would silently discard
half of a mixed row). The morale/initiative branch holds `ferrymans_blessing`, `prize_taken`,
`synod_proscribed`, `ledger_kept` and `hair_trigger` — including the two §3 names it calls for by hand — `ferrymans_blessing` and `prize_taken`. **Nothing in this lane spends them:**
`deriveLoadout`'s keys are fixed by `LOADOUT_KEYS`, which has no `morale`, and `loadoutProfile`
returns exactly `{ armorPen, damageType, aoe, misfire }` because §22.9 asserts those four and nothing
else. Their conditions evaluate and their numbers are authored and mirrored; whether squad morale or
initiative reads them is a platform decision. `morale` is already inside `SQUAD_VALUE_KEYS`, so the
smallest wiring is to add it to `LOADOUT_KEYS` as a `delta` and sum the active morale quirks in
`deriveLoadout` — which changes a published contract and is therefore not Lane I's to make.

**8. Not a request, a warning:** `POINTS_MODEL.AP_RATE` is calibrated to
`apValue('hw141_levy_rifle_mk2')` so the reference prices itself at exactly 1. Re-tuning that
pattern's `base` moves the whole audit. The test will say so.
### Lane B — Field generator

Nothing in this lane needs a deploy: `base44/shared/tacticalField.ts` is a pure module and its mirror
`src/lib/tactical/field.js` is a pure module. Three things it CANNOT do for itself, all of them in
`gameEngine`:

- [ ] **Persist the field, do not regenerate it.** `generateField` is deterministic on
      `{ seed, nodeKind, weather, fortBonus, w, h }`, so a re-run with the same arguments is free and
      identical — but a re-run with a CHANGED `fortBonus` (the defender fortifies mid-battle) or a changed
      `weather` repaints the whole board underneath the squads. The generated `field` must be stored on
      `battle.tactical` at creation and persisted through `persistWar()`, never rebuilt per `getState`.
      It is 165 tile objects at 15x11 (up from the old 63-hex `GRID`), so budget for that in the `Game`
      document rather than being surprised by it.
- [ ] **Carry `field.meta` through to the client.** §4's field shape gained
      `meta: { seed, nodeKind, weather, fortBonus, losCap, groundsFighters }` (Lane B amendment). The
      arena reads `meta.losCap` for the sight overlay and `meta.groundsFighters` to grey out the fighter
      orders. `lineOfSight()` reads `meta.losCap` directly and **throws** if `meta` is missing — that is
      deliberate (a silent default would be an invisible rules change), and it is pinned by a test. If a
      serialisation step drops unknown keys, the arena will fail loudly on the first sight check.
- [ ] **Source `nodeKind` and `weather` from the real macro node and the live weather.** The generator
      never throws: an unrecognised `nodeKind` falls back to `'crossroads'` and an unrecognised `weather`
      to `'clear'`. A typo therefore surfaces as a bland board, not as an error — worth one assertion at
      the `createTactical` call site that both strings are in the published vocabularies.

The vocabularies themselves are now published in §4 (`TerrainKey`, `NodeKind`, `WeatherKey`, `Tile`,
`FieldMeta`, `Field`) and are what Lane E's terrain tokens and Lane J's `Suspension.terrain` are keyed to.

#### The `createTactical` call site — the exact argument, and what must be true of it

`createTactical(attackerUnits, defenderUnits, fieldOpts)` builds the field. `fieldOpts` is passed
**straight through** to `generateField` and is exactly:

```ts
{ seed: number, nodeKind: 'city'|'town'|'depot'|'ruin'|'crossroads',
  weather: 'clear'|'rain'|'fog'|'storm'|'snow', fortBonus: number,
  w?: number /* = 15 */, h?: number /* = 11 */ }
```

- [ ] **`seed`** — an integer. It is coerced `>>> 0`, so a float, a negative or a `NaN` still produces a
      board, just not the one anyone intended. Derive it from something already persisted on the battle
      (the battle id, the turn number) so a re-entry into the same battle cannot re-roll the ground.
      **The RNG is derived from every input, not just this field**, so the same numeric seed at a
      different node kind, weather, fortification level or board size is a completely different board.
- [ ] **`nodeKind`** — the macro node's own kind, from `src/lib/macro/graph.js`. **Not** a display label.
- [ ] **`weather`** — the live weather key, from `WEATHER_META` in `src/lib/weather.js`.
- [ ] **`fortBonus`** — the DEFENDER's fortification level. Clamped to `0..3` and floored, so `2.7` is two
      levels of digging, not three, and anything above three buys nothing.
- [ ] **`w` / `h`** — omit them. They exist for tests and are clamped to a `9x7` floor. The engine's
      `GRID = { w: 9, h: 7 }` is Lane C's to move to `FIELD` (15x11); this lane does not pre-empt it.

**Validate `nodeKind` and `weather` at this call site.** The generator never throws — an unrecognised
`nodeKind` silently falls back to `'crossroads'` and an unrecognised `weather` to `'clear'`. That is the
right behaviour for a server that must not 500 mid-battle, but it means a typo or a renamed macro node
surfaces as *a bland board*, never as an error. One assertion here converts a silent content bug into a
loud one.

**The two vocabularies are published in §4** (`NodeKind`, `WeatherKey`) and are checked against the
generator's own tables by `test/tactical-field.test.js`, so the platform side can validate against the
contract document rather than against a hand-copied list.
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

> **RULED 2026-09-01 (operator):** **fit, not unlock.** For every `kind: 'module'` row, certification stays
> inert; the row's `effects[]` apply when the module is fitted in the Refit Yard and are removed when it is
> unfitted. `citadel_plate`, `juggernaut_reactors`, `munitions_works` come alive on fit only. Platform lane
> wires it in P3/C3.

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
  > **RULED 2026-09-01 (operator):** **materials only.** The captor inherits the project's unspent
  > materials as loot; the project itself, its progress and any housed Object class it required are lost.
  > Lane H may close §7 Q5 in `docs/TECH_DESIGN.md` on this ruling.
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

### Lane A — the squad rules core (`base44/shared/tactical.ts`)

Data, derivations and documentation are complete, mirrored (`src/lib/tactical/data.js`) and proven
(`test/tactical-mirror.test.js`). **Nothing below is wired**, and none of it is a change this lane
could make: every item is either a platform-owned file or a persisted shape.

- [ ] **`docs/GAME_RULES.md` §25 — the tactical squad layer.** Platform-owned, so this lane did not
      write it (drift guard 9). `## 23` is Lane I's Arms Catalogue and `## 24` is Lane G's doctrine
      section, so **`## 25` is the next free number** and is reserved for this. Mark it
      `[PROPOSED — awaiting platform wiring]` like its two neighbours. Write it as a *reference to*
      `docs/COMBAT_DESIGN.md` §13, not a copy of it: every table in §13 — the nine types, the five
      specialists, the sixteen orders, the four works, the Points Audit, the morale modifiers and
      the worked example — is read back out of that document and recomputed against the exported
      tables on every test run, so a figure retyped into `GAME_RULES.md` is a figure with no gate
      on it. §13.2 is the stat block; §13.6 is the figures↔companies ratio in prose.
- [ ] **Import the module; do not inline it.** `gameEngine` (and `concurrentPlay`, if it ever prices
      a squad) must consume `base44/shared/tactical.ts` the way Lane G asks for `catalog.ts`. Every
      balance constant is in an exported table — `SCALING`, `POINTS_MODEL`, `MORALE_MODS`,
      `FIGURES_PER_COMPANY`, `WORK_ARMOUR_APPLIES_TO` — precisely so no third copy has to exist.
- [ ] **Never persist a derived row.** `deriveSquad` is pure and total: the same
      `{ type, figures, specialists, loadout }` always yields the same ten keys, and a degenerate
      input returns the zero row rather than throwing. Persist the squad, derive the stats on read.
      A stored `melee`/`ranged`/`pts` is a number that silently survives a balance patch.
- [ ] **`toRegiments` returns all four `COLUMN_KEYS`, always, and rounds DOWN.**
      `battleResult` → `macroApplyBattleOutcome` already depends on the four-key shape; the rounding
      is the rule that stops a battle *creating* companies. `poolCost` is in **figures**, matching
      §4's `myPool` comment; `toRegiments` is in **companies**. They are not interchangeable.
- [ ] **Two persisted fields the entity schema does not have yet.** `struckFacing` needs a stand's
      **`facing`** — an integer index into `HEX_DIRECTIONS`, which is asserted equal to Lane B's
      neighbour order — and an **`overhead`** flag on a hit that arrives from the air or by indirect
      fire (both land on the top plate whatever the hull is pointed at). Without `facing` persisted,
      every vehicle is struck on the front and rear shots stop existing.
- [ ] **Screen state has nowhere to live.** `SQUAD_ACTIONS.smoke.screenTurns` is the only non-zero
      screen in the sixteen orders and it blinds a hex **for both sides**. That is per-hex, per-turn
      battle state, not squad state, and the battle document has no field for it.
- [ ] **Four staff mods have no consumer yet** — `recoverPerTurn`, `aoeSuppress`, `buildSpeed` and
      `executionToll` are read from `SPECIALISTS` at resolution time, and resolution is Lane C's.
      They are live data in an inert path until then: a medic currently steadies a squad's morale and
      heals nobody. Same shape as Lane G's unconsumed effect keys; worth tracking the same way.
- [ ] **Decide what an over-staffed squad does on the server.** `deriveSquad` applies at most
      `SCALING.maxSpecialists` attachments and **silently ignores** the rest, in declaration order,
      so the derivation is invariant under the order the player attached them. That is the right
      behaviour for a derivation and the wrong behaviour for a muster screen: the server should
      *refuse* a third attachment at muster rather than let the player buy one that does nothing.
- [ ] **Occupying an `infantryOnly` work is Lane C's half of that flag.** `squadActions` now refuses
      to *raise* a work marked `infantryOnly` to any type drawn from a regiment outside
      `INFANTRY_REGIMENTS` (a sapper aboard a crawler is offered the bunker and the emplacement and
      never a foxhole), and the mirror test asserts it for every type. `DEPLOYABLES` says "no vehicle
      may **occupy** or raise it" — the occupying half is a movement/stacking rule and lives in the
      resolver. Until it does, a crawler can still drive into a foxhole somebody else dug.
- [ ] **AoE falloff is Lane C's, through `arms.ts` `resolveAoe`.** `resolveSquadHit` answers for ONE
      stand and deliberately builds no burst: `resolveHit` reads exactly `damage`, `armorPen` and
      `damageType`, so an `aoe` field handed to it changed no number anywhere. The burst pattern is
      declared on the order row (`SQUAD_ACTIONS[k].aoe`) and the resolver is the layer that knows
      which hexes have anyone standing in them — call `resolveAoe({ weapon, victims })` with each
      victim's own armour class and its distance from the burst centre.
- [ ] **A work re-classes a man, never a hull.** `DEPLOYABLES[k].armourClass` replaces the stand's own
      armour class while it occupies the work, **and only if** the stand's own class is in
      `WORK_ARMOUR_APPLIES_TO`. Applying it unconditionally would make a bunker upgrade a crawler.
      The work's `cover` and `moveCost` are **added** to the tile's — Lane B's generator deliberately
      never folds them in, so exactly one layer applies them and it is the resolver.

**One transitional mismatch, expected and accepted** (also in this lane's PR body): `poolCost` and
`toRegiments` were re-based from formations onto squads per §3, while the un-rewritten
`tacticalEngine.ts` on `main` still passes formations to them. Merge order is A → C and Lane C
rewrites both call sites in P2; no test on `main` covers the intermediate state. It is not a defect
to be "fixed" by restoring a dual code path that sniffs its argument.

### Lane J — the Motor Pool

Data is complete, tested and mirrored (`base44/shared/motorPool.ts` ↔ `src/lib/motorPool.js`).
Nothing below is wired; each item is a decision the platform lane owns. **No armour or penetration
arithmetic exists in this lane** (drift guard 12) — `motorPool.ts` declares `ArmourClass` *keys* per
facing and passes `armorPen` through untouched, and the mirror test asserts the four forbidden
identifiers appear in neither file.

#### J1 — where `rollVehicle` fires, and the seed rule

`rollVehicle({ seed, class, maker, tierCap = 'III', luck = 0 })` is pure and seeded and returns a
`VehicleInstance`. The lane supplies the function; the platform decides the trigger — motor-pool
issue, salvage recovery and prize capture are the three the catalogue was written for. **The seed
must be stable and reproducible from the game record**, because a serial is *reproduced from its
seed and never stored*: derive it from `(gameId, turn, sourceKey, index)`, never from `Date.now()`
or a request-time random, or the same hull acquires a new serial on every replay, refresh and
rollback.

A derivation that comes up short **fails rather than degrades**: `rollVehicle` throws
`rollVehicle: seed must be a finite number` on `undefined`, `null`, `NaN`, `Infinity` or a numeric
string. Seed `0` is a perfectly good seed — the guard is finiteness, not truthiness. `class` and
`maker` filters that empty the pool **throw a descriptive `Error` naming the filter**; they never
fall back to an unfiltered draw.

Hardpoint weapons are built by Lane I's `rollWeapon` with the sub-seed
`(seed ^ Math.imul(0x9e3779b9, i + 1)) | 0` for hardpoint index `i`. Serials are
`MW-<uppercase maker stem>-<4 uppercase hex>`, asserted by regex.

**Against the 2026-09-01 operator rulings.** *Module effects apply on fit, never on unlock* — a
refit kit is a `VehicleMod` row named in `VehicleInstance.mods`, and **every one of its `mods` and
`tradeoff` deltas is read only through that instance**, by `totalTonnage`, `hardpointStats`,
`breakdownChance` and `deriveMechanized`. Nothing in this lane applies a kit's numbers to a faction,
a house or a certification, and no Motor Pool kit is modelled as an armory `module`: if the platform
later gates a kit behind State Armory certification, the certification must stay inert and the
numbers must keep arriving from the fitted stand. *Relic projects die with the keel* — this lane
models no project and no progress; `fs_reliquary_cell_800` and `ap_relic_alloy_skin` are catalogue
rows gated by `tierCap`, not by a project, so a captured hull carries them because it carries them.

#### J2 — validating a `VehicleInstance` that arrives from a client

A `VehicleInstance` reaching `tacticalDeploy` is untrusted, and the engine must reject it unless:
`chassisKey ∈ CHASSIS_PATTERNS`; `quality ∈ QUALITY_GRADES`; `powerplant ∈ POWERPLANTS`;
`suspension ∈ SUSPENSIONS`; `mount ∈ MOUNTS` **with `MOUNTS[mount].hardpoints <=
CHASSIS_PATTERNS[chassisKey].hull.hardpoints.length`**; `armourPackage` either `null` or a key in
**`ROLL_ODDS.packagePool[chassisKey]`** (see below — `ARMOUR_PACKAGES` membership alone is **not**
enough); every `mods[k] ∈ VEHICLE_MODS` with `slot` in the chassis's own `slots`, the chassis class
in `appliesTo`, and **no two mods sharing a slot**; every `hardpoints[i]` a valid Lane I
`WeaponInstance`, with the array **assignable in hull order** (see below); every
`quirks[k] ∈ VEHICLE_QUIRKS`; and `serial` matching `/^MW-[A-Z]{2,4}-[0-9A-F]{4}$/`. Most of those
are invariants `test/motor-roll.test.js` asserts over the rolled corpus — but the rolled corpus only
ever draws LEGAL combinations, so it cannot show you what an illegal one looks like, and the two
rules below are the ones it therefore cannot be read off. Without them a client can hand itself a
relic-grade land fort with a fortress course on a two-tonne airframe.

**The armour package must come from the HULL's pool, not from the table.**
`ROLL_ODDS.packagePool[chassisKey]` is the cache of {every declared facing raises or holds this
hull's} ∩ {weight ≤ `MOTOR_MODEL.packageWeightCap` × stamped tonnage}, recomputed and asserted by
`test/motor-mirror.test.js`. `deriveMechanized` applies `{ ...hull.baseArmour, ...pkg.facings }`
**unconditionally** — it has to, because comparing two facings needs armour *values* and drift guard
12 puts those in `arms.ts` — so "a package never lowers a facing" is an invariant of the *pairing*
and this gate is the only thing that holds it. Measured over the full cross product: **51 (chassis,
package) pairs lower at least one facing, and every one of them is outside that hull's pool** (zero
inside it). `ap_sandbag_stowage` on `grimwold_156_lockjaw_mk1` is the worked case — front
`superheavy → light`, side `superheavy → soft` — and it is a perfectly legal package on a lighter
hull. This is the one work-item-6 invariant a hand-fitted Refit Yard swap (Lane D) can break, and it
breaks it silently: the stand comes back with a complete, valid-looking `facings`.

**Weapons are assigned in HULL ORDER, and cannot be indexed by position.**
`vehicle.hardpoints.length` may be **less** than `hull.hardpoints.length`: a hardpoint with nothing
it can legally carry at the requested `tierCap` goes to the field empty rather than being filled
with something illegal — the Reliquary Monitor's casemate at `tierCap: 'II:Wake'` is the worked
case, and the hull is still legal. A `WeaponInstance` carries `{ patternKey, quality, mods, quirks,
serial }` and **no hardpoint key**, so once a position is skipped the association is not recoverable
positionally. The check that *is* implementable, and the one this lane's tests now use:

```js
let at = 0;
for (const w of vehicle.hardpoints) {
  const cls = WEAPON_PATTERNS[w.patternKey].class;
  while (at < hull.hardpoints.length && !hull.hardpoints[at].allowed.includes(cls)) at += 1;
  if (at >= hull.hardpoints.length) return false;   // no hull position can take this gun
  at += 1;                                          // a position is never reused
}
```

`rollVehicle` fills positions left to right and omits the ones it cannot fill, so the greedy
in-order walk accepts exactly what the roll can produce and rejects a gun the hull has no position
for. **Never index weapons by hull hardpoint position** — `hardpoints[1]` is not
`hull.hardpoints[1]`, and at `tierCap: 'II:Wake'` on the Reliquary Monitor it demonstrably is not.
If the platform later wants the association back, that is a §4 amendment (a `hardpointKey` on each
entry, or a parallel `hardpointKeys` array) and this lane flagged it rather than taking it.

#### J3 — what the tactical engine consumes

Only `deriveMechanized(stand, ctx?)`, which returns **exactly**
`{ figures, melee, ranged, range, speed, morale, pts, specials, facings }` and no other key — a
subset of §4's `SquadType` value keys ∪ `{ facings }`. `figures` is always `1` (vehicles are
single-figure squads). It deliberately does **not** return `armor`: a numeric armour rating would
require reading an armour value, so the engine derives it from `facings` through `arms.ts`.

The two numeric escape hatches are **separate exported functions**, never smuggled into that object:
`breakdownChance(vehicle, ctx?)` → a number in `[0, 0.5]`, and `hardpointWeapons(vehicle)` → the
`WeaponInstance[]` verbatim, so Lane C can hand each instance to `resolveHit` itself.
`totalTonnage`, `hardpointStats`, `speedFromPowerWeight`, `terrainMultiplier`, `tierRank` and
`evaluateVehicleQuirk` are exported for the same reason.

**The export surface is a SUPERSET of §4's Motor Pool block, and it is awaiting a ruling.** Beyond
the twenty §4 contracts this module also exports `MOTOR_MODEL` (the tuning constants every formula
reads, mirrored and mirror-tested, so no number in this lane lives only in a function body)
and `evaluateVehicleQuirk` (without it "a quirk whose effect exists only in prose is a lane failure"
is unenforceable), and it gives `hardpointStats(vehicle, ctx?)` and `deriveMechanized(stand, ctx?)`
an **optional** second parameter. Everything is additive — every contracted call shape still works,
asserted — and `docs/MOTOR_POOL.md` §1 carries the reasoning. **Either bless the superset or add
these four lines to `docs/TACTICAL_SQUAD_PLAN.md` §4's Motor Pool block**, so Lanes A, C and D code
against one list; this lane did not file the amendment itself because the choice is the
orchestrator's, and `test/motor-mirror.test.js` pins the exact surface meanwhile so it cannot grow
while the question is open.

**Terrain is not applied by this lane.** `speed` is the power-to-weight step, clamped `[1, 8]`;
Lane C calls `terrainMultiplier(suspensionKey, terrainKey)` per hex. That function **throws** on an
unknown suspension or terrain key rather than returning `undefined`, because an `undefined`
multiplier reads downstream as "unaffected" and would quietly make a river passable to a tread.

#### J4 — the quirk context the engine must supply

Every vehicle quirk carries a machine-evaluable `condition` whose `key` is in
`VEHICLE_QUIRK_CONDITIONS` (twelve keys; seven are Lane I's own, reused rather than re-spelled).
**Three are filled in from the instance by this lane** — `quality_at_least`, `crew_at_least`,
`tonnage_at_least` — so those quirks are live today with no engine work at all. The remaining nine
need a turn, and `ctx` is where the engine supplies it:

| `condition.key` | ctx field | shape |
| --- | --- | --- |
| `always` | — | fires unconditionally |
| `weather` | `weather` | the weather key |
| `terrain` | `terrain` | the terrain key of the occupied hex |
| `night` | `night` | boolean |
| `vs_house` | `vsHouse`, `nativeHouses` | the opposing house key; the hull's native houses |
| `round_at_least` | `round` | number |
| `below_full_pace` | `atFullPace` | boolean — the quirk fires when this is `false` |
| `stationary` | `moved` | hexes moved this turn; the quirk fires on `0` |
| `hull_down` | `hullDown` | boolean |

`ctx` is **optional everywhere**. Omitted, only `always` and the three instance-fact conditions
fire; the returned key set never changes, so a caller that has no turn context yet is safe.

**`ctx` cannot overwrite the three instance facts.** `quality`, `crew` and `tonnage` are read off
the instance *after* the caller's `ctx` is spread, so a client that supplies `{ crew: 99 }` changes
nothing — asserted, because the opposite spread order was a one-token edit that no test saw. The
engine may pass a turn's context through from an untrusted request without laundering those three.

#### J5 — the one decision this lane declined to make: the points scale

The Points Audit anchors on the **macro** scale — `src/lib/units.js` `crawler.points === 12`, which
the plan pins and which `docs/MOTOR_POOL.md` §13 recomputes against — while a tactical `SquadType`
prices a whole squad (`SQUAD_TYPES.riflemen.pts === 100`). `deriveMechanized().pts` is therefore on
the **chassis** scale. Reconciling the two is one documented multiplier and it belongs with whoever
owns `SQUAD_TYPES`; inventing a number here would have put a third scale in the repository rather
than removing one. **This is the item to settle before a mechanized stand and a rifle section are
costed in the same army list.**

#### J6 — flags for other lanes

- **`arms.ts`'s `LOGISTICS_CLASSES` has four entries and no `gunboat`.** That table prices calibres,
  not powerplants, so this lane uses the five-key regiment vocabulary the contract specifies for
  `Powerplant.fuelClass` rather than narrowing a marine diesel into an inland column. No amendment
  filed; Lane I owns the table.
- **`base44/shared/commandVehicles.ts` is untouched and unduplicated.** A general's command vehicle
  is a *general modifier* — priced in `steel`/`fuel`/`manpower`, expressed as
  `dmgOut`/`dmgIn`/`skill`/`moraleIn` on a macro battle. A Motor Pool chassis is a *stand on the
  tactical field*, priced in points and resolved hex by hex. The two tables share no key; that
  module was read, not imported, and never edited.
- **`ROLL_ODDS.packagePool` is a cache of a derivation, not a judgement**: `{raises-or-holds every
  facing}` ∩ `{package weight ≤ `MOTOR_MODEL.packageWeightCap` of stamped tonnage}`. It has to be a
  cache because the first half needs armour values, which this lane may not read. The mirror test
  recomputes both halves from `ARMOUR_CLASSES` + `CHASSIS_PATTERNS` and asserts exact equality — so
  **if any chassis or package changes, the table regenerates or the test goes red.**
- **Five `VEHICLE_STAT_KEYS` are declarative** — `arc`, `losRange`, `initiative`, `hardpoints` and
  `fuelUse` are carried, mirrored and tested, and spent by nothing in this lane because each belongs
  to a layer that is not this one; `weight` and `pts` are in the vocabulary but used by no kit or
  quirk at all. `docs/MOTOR_POOL.md` §12 tabulates which is which and why. Wiring them is a platform
  decision, not a gap.

#### J7 — promote the rules section

**Two ownership questions this lane could not settle itself, both flagged rather than assumed.**
(a) **This file is the eleventh path.** Lane J's Definition of done enumerates ten permitted paths
and calls anything else drift; the `### Lane J` section you are reading is outside them. It is a
pure append in the shape Lanes I, G and A already set here, it is platform-handoff material by
definition, and moving it into `docs/MOTOR_POOL.md` would put the platform's own instructions in a
lane's design record — so it was written here and reported. **Bless `PLATFORM_HANDOFF.md` as an
append surface for content lanes, or move this section**; do not leave gate 7 quietly contradicted.
(b) **`docs/GAME_RULES.md` `## 25`.** This lane took it as the next free number, `## 23` being Lane
I's and `## 24` Lane G's. Lane A's section above *reserves* `## 25` for the tactical squad layer —
but Lane A is barred from writing to `GAME_RULES.md` at all (drift guard 9 makes it platform-owned
for that lane) and its commits touch no line of it, whereas §3's content-lane preamble *requires*
this append. The reservation is therefore a note about a section nobody has written; the number is
in use. **Renumbering is a mechanical three-line edit inside this lane's own files** and a red test
if any one of them is missed — see the paragraph below.

`docs/GAME_RULES.md` **The Motor Pool** is appended and marked `[PROPOSED — awaiting platform
wiring]`; it is on the C3 promotion list. **Its section number is deliberately not quoted here.**
Two content lanes were appending sections concurrently, so the number may be reassigned at merge —
`docs/MOTOR_POOL.md` §14 states the number it was written as, and `test/motor-mirror.test.js` ties
that statement, the embedded copy and the live heading together, so a renumber is a mechanical
three-line edit inside this lane's own files and a red test if any one of them is missed. **No
shipped Codex entry names a section number**, asserted, because the Codex block lands in a file
Lane H owns and merges after this lane.

### Lane C — the tactical engine (`base44/shared/tacticalEngine.ts`)

The state machine is complete, deterministic and tested (`test/tactical-engine.test.js`), and the
recorded payload Lanes D and E build against is committed at **`test/fixtures/tactical-state.json`**.
`gameEngine` already imports the eight frozen names and none of them changed shape, so **nothing below
is required to keep the engine compiling** — but until C1 and C2 are applied the tactical battle is
played on one board and settles by refusing its own orders. Two items are already applied and are
marked so.

#### C1 — `createTactical` is still called with TWO arguments, so every battle is the same board

`entry.ts` `battleSetMode` (≈ line 1944) reads:

```js
b.tactical = createTactical(b.attacker.units, b.defender.units);
```

The third argument is optional precisely so this line kept working, and when it is omitted the engine
falls back to `DEFAULT_FIELD_OPTS = { seed: 1, nodeKind: 'crossroads', weather: 'clear', fortBonus: 0 }`.
**That is one board, for every battle, in every game, for ever** — same 165 tiles, same two deploy
strips, same woods in the same places. Lane B's generator is doing no work at all today.

- [ ] Pass the real options:

```js
b.tactical = createTactical(b.attacker.units, b.defender.units, {
  seed: <stable integer derived from the persisted battle — e.g. gameId + turn + tile id>,
  nodeKind: <the macro node's own kind: 'city'|'town'|'depot'|'ruin'|'crossroads'>,
  weather: <the live weather key: 'clear'|'rain'|'fog'|'storm'|'snow'>,
  fortBonus: <the DEFENDER's fortification level, 0..3>,
});
```

`w`/`h` are omitted deliberately — the board is `FIELD` (15×11) and the engine takes it from Lane B.
**The field is generated once and stored on `b.tactical.field`; nothing in the engine ever regenerates
it**, because a second `generateField` with a changed `fortBonus` or `weather` would repaint the ground
underneath squads already standing on it. Validate `nodeKind` and `weather` at this call site — Lane B's
generator never throws, it falls back, so a typo surfaces as a bland board rather than as an error.

One consequence of the current ordering worth knowing rather than changing: `battleSetMode` files the
**defender's** auto order of battle at set-mode time, before the attacker has deployed. That is legal
(the deploy zones are disjoint) and the engine seats the second filing around the first.

#### C2 — `runAutoTurns` passes `o.targetId` (**NO LONGER A BREAKAGE — now an aim-quality item**)

`entry.ts` ≈ line 1908:

```js
const o = autoOrders(t, f);
if (!o || resolveOrders(t, f.id, o.moveTo, o.actionKey, o.targetId)) break;
```

**What this note said before, and what changed.** `autoOrders` used to report `targetId: null` for every
order that falls on a HEX — `grenade`, `mortar_barrage`, `bombard` — so the first time the staff chose a
barrage the platform's own call refused its own order (*"That order needs a hex to fall on"*) and the
`break` ended the whole auto run inside round one, with `battleResult` still null and `settleTactical`
returning without settling. **That was an engine defect wearing a platform label: the export freeze held
by signature and not in effect, which is not what §6.2 asks for.** It is fixed in the engine, not here:
`autoOrders` now reports BOTH forms of the same order — `target` carries the true aim point and
`targetId` names a stand under the burst that the same order could legally have been fired at directly —
and a candidate aim hex with no such stand is not offered at all, so the two forms never disagree about
whether the order is legal.

**Measured** (`test/tactical-engine.test.js`, *"hands the SHIPPED seam an order it can issue"*): over
seeds 1–5, the shipped `o.targetId` form now runs all **60** of its activations and passes out of round
1, and so does the `o.target` form. The case asserts the count rather than describing it, because the
note that stood here published a range ("16–38 of 60 over five seeds") that **no committed test
reproduced and that did not reproduce when it was re-measured** — the backing case ran one seed and
asserted only that the run stopped. A second case walks a whole auto battle and asserts that `targetId`
is non-null for every order `resolveOrders` reads a target for.

**What is still worth doing, and it is no longer urgent.** `targetId` is the staff's *degraded* reading
of an area order: it aims the burst at the named stand's hex rather than at the hex that put the most
stands under it. Passing `o.target` restores the true aim point.

- [ ] One word: `resolveOrders(t, f.id, o.moveTo, o.actionKey, o.target)`. `resolveOrders` normalises
      `{ squadId }`, `{ q, r }` **and** a bare id string at the top of the function, so this is
      backward-compatible with anything else that still passes a string.

#### C3 — `guard < 60` is under one round at full strength

Same loop. `MAX_SQUADS` is **24 a side**, so a full board is **48 activations per round** and a 60-turn
guard is one round and a quarter. It is a safety bound, not a budget, and the engine has its own
termination guarantee (`t.round > t.roundLimit` with `ROUND_LIMIT = 20`, so **≤ 960 activations**).

- [ ] Either raise the guard to `MAX_SQUADS * 2 * ROUND_LIMIT` (960) with the same `break`s, or call
      the export written for exactly this: **`autoResolveRemainder(t, side, maxTurns = 200)`** loops
      `autoOrders` + `resolveOrders` for one side (`side = null` for both) until `battleResult(t)` is
      non-null or the budget is spent, and returns the number of activations it resolved. It stops of
      its own accord the moment the other side's stand is next in the queue, so it is safe to call on
      a half-automatic battle.

#### C4 — `tacticalOrders` reads `body.orderAction` (**APPLIED**) but still flattens the target to an id

```js
const targetId = body.target?.squadId ?? body.targetId ?? null;
```

A hex target from Lane E (`target: { q, r }`) is silently dropped to `null` by that expression, so a
human commander cannot issue a grenade, a barrage, a bombardment or a smoke screen — the same class of
refusal as C2, on the human path instead of the staff path. The code comment says *"hex targets await
Lane C"*; they no longer do.

- [ ] Pass `body.target` straight through: `resolveOrders(b.tactical, squadId, body.moveTo || null,
      body.orderAction, body.target ?? body.targetId ?? null)`. The engine normalises all three forms.
- [ ] `body.orderAction` additionally accepts the engine order **`'march'`** (§4 amendment C1 item 4) —
      an activation spent moving only. A `moveTo` with a null or absent `orderAction` is read as a
      march, so Lane E may send either.

#### C5 — `tacticalDeploy` passes the rows through untouched; make sure they still have their kit on

`submitFormations(b.tactical, role, body.squads ?? body.formations)` already forwards each row whole, so
nothing in `gameEngine` needs to change for the row to carry more. What it must not do is normalise the
rows on the way past. A deploy row is:

```ts
{ name, type, figures, specialists: SpecialistKey[] /* <= 2 */,
  at?: { q, r },            // honoured when it is inside that side's field.deploy[side] zone
  loadout?: Loadout,        // Lane I — folded in by deriveSquad, never inspected by the engine
  vehicle?: VehicleInstance // Lane J — the ONLY thing that gives a stand `facings`
}
```

- [ ] **`vehicle` is what makes a stand mechanized.** `autoFormations` carves a `crawler` row with no
      `vehicle`, so a staff-deployed crawler has no facings and every hit on it resolves against the
      squad type's single armour class. A hull only ever gets front/side/rear/top plates if a
      `VehicleInstance` reaches `submitFormations` on its row. That is a Lane D + entity-schema item as
      much as an engine one, and it is why the committed fixture deploys its two hulls explicitly.
- [ ] `ArmyDesign.jsonc` → the `SquadTemplate` shape needs room for `loadout` and `vehicle`, or the
      whole arms and motor-pool half of the game never reaches the board.

#### C6 — persistence: `persistWar()` already carries it, and it is bigger than it was

`persistWar()` writes `activeBattle` whole, so `b.tactical` rides along with no field list to maintain —
including `field` (165 tile objects), `relicProject`, `screens`, `lost`, `seed`, `rolls`, `nextId` and
each stand's retained `wounds`. **Do not add a per-key projection of `b.tactical` to that update.**
Dropping `seed`/`rolls` breaks replay determinism; dropping `screens` leaves a smoke screen blocking
sight for ever; dropping `wounds` heals every stand on every save.

- [ ] Budget for the size: the committed fixture — one battle, 22 stands, mid-round-two — serialises to
      **~46 KB** as the client-facing view, and the server object is larger. The `Game` document is
      already a large single record (CLAUDE.md, Gotchas); this is the biggest single thing in it.

#### C7 — the two keys §4 gained from this lane (amendment C2), both additive

- **`relicProject: { attacker, defender }`** at the top level of the `getState → battle.tactical`
  payload. `{ attacker: null, defender: null }` on every board today. Nothing reads or writes it until
  boarding assaults land as a Field Amendment; it is cut now so the shape is not re-cut then. Operator
  ruling recorded with it: **on capture the captor loots the project's unspent materials only — the
  project, its progress and its housed-Object requirement die with the keel.**
- **`fx.facing: 'front'|'side'|'rear'|'top'`**, optional, present exactly when the struck stand carried
  `facings`. The engine cannot resolve a hit on a hull without selecting a plate; before this the
  selection reached the client only as English inside a log line.

#### C8 — `t.status = 'done'` is the platform's transition, and `battleResult` is read before it

`runAutoTurns` sets `t.status = 'done'` itself, after reading `battleResult(t)`. **The engine never sets
it**, deliberately: `battleResult(t)` returns `null` unless `t.status === 'fighting'`, so a second
`settleTactical` on an already-sealed battle cannot re-run `finishBattle`. Two consequences:

- `tacticalView` therefore never emits `status: 'done'` from the engine's own state machine — Lanes D
  and E get that value because the platform wrote it.
- If anything ever calls `battleResult(b.tactical)` **after** the seal, it gets `null`. Read it once,
  before setting the status, exactly as the current code does.

#### C9 — the fixture, and what to point Lanes D and E at

`test/fixtures/tactical-state.json` **is** the `getState → battle.tactical` payload, byte for byte, at a
recorded moment of a scripted battle: 14 top-level keys, 15×11 field with `meta`, 23 stands (11 attacker,
12 defender) of 8 types, one mechanized stand per side, seven stands suppressed, three routed, two at
work, two finished works on the ground, 90 hexes of sight, an 18-line log, a **23-entry queue naming
exactly those 23 stands**, and an `fx` recording a hit that selected the **rear** plate of a hull.
`UPDATE_FIXTURE=1 npm test` regenerates it; a default run asserts the committed bytes against the battle,
so an engine change fails loudly instead of drifting away from what the UI draws.

**The queue is now a subset of `squads[]`, and it was not.** The committed fixture used to carry 23 queue
entries for 22 stands — `a7` named a stand that had been wiped from the field — because `removeFigures`
dropped a dead stand from `t.squads` and left it in `t.queue` until the round ended, and `tacticalView`
publishes the queue verbatim. Measured over four seeded auto battles at the time, **71 % of published
views named at least one stand that was not on the board**. Lane E's initiative rail resolves those ids
against `squads[]`, so `queue.map(id => squads.find(s => s.id === id))` handed it an `undefined` in the
middle of the strip. Fixed in the engine; asserted on the fixture and over a whole auto battle.

- [ ] When P3 goes live, diff a real `getState` response against this file. Any key that differs is
      either a platform projection dropping engine state (C6) or a contract change nobody filed.

#### C10 — a hull's MOUNTS do not reach the damage model, and this lane cannot make them (Lane A + Lane J)

`base44/shared/tactical.ts`'s `resolveSquadHit` — §4's declared *"only route to arms.ts resolveHit"* —
computes its damage source as `deriveSquad(attacker).melee|ranged` and **never inspects
`attacker.vehicle`**. It honours `attacker.profile` for `armorPen` and `damageType`, and `profileOf`
reads `loadout` only, so nothing a `VehicleInstance` declares changes a single number in a resolution.
Driven: for a `heavy_crawler` hull, `resolveSquadHit` returns a byte-identical result with and without
`vehicle` on the row.

The engine used to overlay `deriveMechanized`'s `melee`/`ranged` onto the stand's derived block anyway.
That published a figure the stand does not fire at — in the `squads[]` view row, in the fixture Lanes D
and E render, in the clock-decided `holdingPower`, and in the staff's own valuation — while the shot
resolved from Lane A's column. Measured: the overlay said **10.9** and the shot resolved at **12**. The
engine now publishes Lane A's column, which is the one that fires; `speed`, `range`, `morale`,
`initiative` and `pts` from Lane J are unchanged and still overlaid.

- [ ] **Decide where the hull's mounts enter the damage model.** The narrow fix is one line in Lane A's
      adapter — take the damage source from Lane J when the row carries a `vehicle` — and it belongs
      there rather than here, because a second damage-source chain in `tacticalEngine.ts` is exactly
      what drift guard 12 forbids. `test/tactical-engine.test.js` ("publishes the melee and ranged a
      mechanized stand actually fires at") pins the gap and will go red the moment it closes: move the
      overlay back into `derivedOf` in the SAME change, so the published number and the fired number
      never part again.

#### C11 — `docs/TACTICAL_SQUAD_PLAN.md` §0 still says the board is 9×7 (one word, orchestrator-owned)

Line 14 of the plan reads *"9×7 axial hex grid, initiative queue, 20-round limit"*, while line 35 of the
same document says *"8–24 squads per side on a **15×11** grid (up from 9×7)"* and the shipped code
exports `GRID = { w: 15, h: 11 }`, asserted equal to Lane B's `FIELD`. The addendum made the change this
lane's move; §0 is a section this lane may not edit (its one sanctioned exception is §4), so it is named
here rather than quietly left for an audit to find.

- [ ] `docs/TACTICAL_SQUAD_PLAN.md:14` — `9×7` → `15×11`.
### Lane F — squad roster, specialists, upgrade kits & the points audit

Data is complete, mirrored (`base44/shared/tactical.ts` ↔ `src/lib/tactical/data.js`) and audited.
Nothing below is wired. Lane F appended **rows only**: every table structure, every derivation
(`deriveSquad`, `squadStaffMods`, `poolCost`, `toRegiments`) and all nine base squad types are Lane
A's and were not touched.

The lane's own regression suite is `test/gear-points-audit.test.js`. **It is a claimed file, not an
assigned one**: `TACTICAL_SQUAD_PLAN.md` §3 names no test for Lane F, so the lane claimed an
unassigned path explicitly, the way §3's Lane G Amendment 3 does for `test/rules-mirror.test.js`. It
touches no assertion in `test/tactical-mirror.test.js` — it is the only suite in the repository that
reads *documents*, parsing `docs/GEAR_LIBRARY.md` §11, `docs/FACTION_ROSTER.md` §5 and
`docs/GAME_RULES.md` §26 back out of the markdown and rebuilding every published cell from the
tables. Every section is sliced heading→next `##`, never to end of file, so a later lane appending
after Lane F is excluded whether it exists yet or not.

#### F1 — nothing reads these tables yet

`gameEngine` consumes no squad type, no specialist and no kit. `UPGRADES` and `UPGRADE_RULES` are
**new in this lane** — they appear in no other lane's delivers list. Two follow-ups belong to Lane A
rather than to the platform: add `UPGRADES` and `UPGRADE_RULES` to `test/tactical-mirror.test.js`'s
table list, and read `UPGRADE_RULES.maxPerSquad` wherever a kit ceiling is enforced instead of
hard-coding the digit.

#### F2 — the fourteen legacy Design Bureau options carry no squad `mods`

`line`, `vanguard`, `skirmish`, `column`, `rifles`, `trench_guns`, `mortars`, `standard`, `plated`,
`scout`, `none`, `medics`, `signals` and `commissars` predate the squad-mod convention and are
referenced by live saves, so this lane did not touch them (drift guard 10). The eleven options it
added all declare `mods`, and `compileDesign` now returns a `mods` key alongside its frozen
`{ skill, dmgOut, dmgIn, moraleIn, cost }` — additive, so `ArmyDesigner.jsx`, `DesignCard.jsx` and
`SlotPicker.jsx` render the new options with zero component edits. **Until the legacy fourteen are
translated, `compileDesign(...).mods` describes only the options that declare it**, and any consumer
treating it as a complete picture of a design will be wrong about the eleven-year-old half of the
bureau. Translating those multipliers into `mods` is the platform's edit, not a content lane's,
because it changes what existing saves compile to.

#### F3 — `bridging_train` has no effect key for the thing it does

`PROPOSED_UNIT_TYPES.bridging_train` exists to put an army across water. The §4 effect vocabulary has
no key for a crossing, so the row declares `{ scope: 'economy', key: 'buildTurns', value: -1 }` — a
true statement about a bridging train and **not** the mechanic the unit is named for. The honest fix
is a new §4 key (`crossing`, or a river-crossing verb on the macro side) added by whoever owns the
macro movement rules; inventing one inside a content lane would have put an effect key in a table
that nothing could ever apply. Named here so the gap is a decision rather than an omission.

#### F4 — `hospital_train` is gated in prose and nowhere else

`docs/GEAR_LIBRARY.md` §7 gates the hospital train at `[II:Cache]`. `PROPOSED_UNIT_TYPES` mirrors the
`UNIT_TYPES` field set, and `UNIT_TYPES` has **no tier field** — so the gate exists in the Gear
Library and in the row's `blurb`, and in no machine-readable field anywhere. Adding a `tier` to
`PROPOSED_UNIT_TYPES` alone would have made the proposed rows a different shape from the live ones and
broken the "lift each row into `gameEngine`'s `UNITS` unchanged" promise the table exists to keep. The
platform lane decides: add `tier` to both tables, or gate macro units some other way.

#### F5 — the combined staff-and-kit bill is ungated, and on the cheap stands it is large

Nothing in this lane's contract caps `SCALING.maxSpecialists` attachments **plus**
`UPGRADE_RULES.maxPerSquad` kits against the stand's own cost. Recomputed from the tables: the two
dearest attachments come to 38 pts, and against the cheapest stands that plus two kits reaches
**180.49%** of `autocar_scouts` and **146.15%** of `siege_mortar` — a stand whose attachments cost
more than a second stand. `docs/GEAR_LIBRARY.md` §11.8 states it and
`test/gear-points-audit.test.js` recomputes it, so the figures cannot rot. **It should not be
"fixed" by re-pricing kits**: what a squad may actually field in a battle is Lane C's, and a cap
belongs there or in the engine.

#### F6 — promoting `PROPOSED_UNIT_TYPES`

Seven macro support classes sit in `src/lib/units.js` as `PROPOSED_UNIT_TYPES`, deliberately outside
`UNIT_KEYS` and outside `gameEngine.UNITS`, because `test/rules-mirror.test.js` asserts those two key
sets are equal and `gameEngine` is platform-owned. Each row carries the full `UNIT_TYPES` field set
plus `effects[]` and a `blurb`, so promotion is: copy the row into `gameEngine`'s `UNITS`, copy it
into `UNIT_TYPES`, add the key to `UNIT_KEYS`, and delete it from `PROPOSED_UNIT_TYPES`. All seven
already have plates registered (`unit_draught_column`, `unit_siege_train`, `unit_bridging_train`,
`unit_signals_wagon`, `unit_salvage_detachment`, `unit_hospital_train`, `unit_provost_column`) —
which is why the seven were chosen.

#### F7 — plates: twenty-nine requests, and one aspect decision the platform owns

One banner-commented block at the very end of `IMAGE_LIBRARY`, after Lanes I, G and J: eleven
`unit_<key>_token`, three `unit_<key>_action` for the single-figure stands, four `kit_*` (the other
six kit plates already existed) and eleven `design_*`, one per new Design Bureau option. No new
`IMAGE_CATEGORIES` key was needed. **No url is passed and `src/lib/imagePlates.js` is untouched** —
the lane ships no visual, and no test here asserts that a url stays `null`, because a delivered plate
is the success case and a gate on `url === null` forbids the very step it waits for.

Two things the platform must settle, both in `docs/GEAR_LIBRARY.md` §11.9:

- **Aspect.** The lane brief mandates `1:1` for tokens, kits and design cards and `16:9` for action
  plates. Every pre-existing row in those categories is `4:3` — all five legacy `unit_*_action`
  plates and all eleven legacy `design_*` cards. The lane followed the brief, so the `designs`
  category now holds two aspects. Re-stamp this block or re-stamp the legacy rows, in one edit.
- **Five duplicate subjects.** `unit_stormtroops`, `unit_sappers`, `unit_ski_troops`,
  `unit_digger_corps` and `unit_pilgrim_levy` predate the canonical `unit_<key>_token` convention and
  were left in place (drift guard 10 forbids renaming a plate key). Generate **one** image per pair,
  against the canonical `_token` key. The sixth older key, `unit_provost_column`, is **not** a
  duplicate: it is the macro support class, while the tactical squad type is `provost` at
  `unit_provost_token`. Two subjects, two images.

#### F8 — the appended documents

`docs/GAME_RULES.md` **§26 Squads, Specialists & Upgrade Kits** is appended and marked
`[PROPOSED — awaiting platform wiring]`; it is on the C3 promotion list. It states the kit ceiling as
*"a squad may carry at most `UPGRADE_RULES.maxPerSquad` kits"* and never retypes the digit (drift
guard 7). The number 26 is hard-coded in no test and in no Codex entry — `test/gear-points-audit.test.js`
locates the section by its heading text, so a renumber at merge is a one-line edit in one file.

`docs/GEAR_LIBRARY.md` §11 (the Points Audit, 11.1–11.9) and `docs/FACTION_ROSTER.md` §5 (Unit
Access, ten houses) are the lane's own appends. Thirteen `squad-*` Codex entries land in
`src/lib/wiki/entries.js` as one tail block; **no Codex entry quotes a stat or a section number**,
asserted, because that file is Lane H's and Lane H merges after Lane F.

#### F9 — two contract facts a reader of the brief will get wrong

- **`specials[]` has sixteen legal keys, not thirteen.** Lane A merged `SQUAD_ACTIONS` with
  `bombard`, `strafe` and `overrun` beyond the thirteen the Lane F brief listed. `land_dreadnought`
  uses `overrun` and the base rows use `bombard` and `strafe`. The live table is the authority; the
  brief's list is stale.
- **`Specialist.mods` carries a seventh key.** §4 names six; Lane A's merged `commissar` declares
  `executionToll`, `deriveSquad` folds it, and `provost_sergeant` follows that precedent rather than
  the brief's list. No new key was invented by this lane.

#### F10 — the cross-lane rows to diff at merge

`land_dreadnought` is one machine in two tables: Lane G's `RELIC_PROJECTS` row (the project that
raises it) and Lane F's `SQUAD_TYPES` row (the stand that then fights). Both carry `tier: 'III'`;
Lane F's `pts` is a **squad** cost on the tactical scale and Lane G's is a project cost — they are not
the same currency and must not be reconciled by making them equal. Per the operator ruling, the
project **dies with the keel**: on capture the captor loots unspent materials only, and the project,
its progress and its housed Object are lost. Both rows' prose says so.

The lane uses exactly **one** lock, inside the budget of two: `pilgrim_levy.creedLock: 'recall'`.
There is no `factionLock` anywhere in Lane F. `land_dreadnought` is deliberately **unlocked** — Lane
G's relic project gates it on `prereq` with no creed, and a second gate on the stand would gate it
twice.
