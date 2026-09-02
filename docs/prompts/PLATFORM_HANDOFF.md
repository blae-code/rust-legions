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
