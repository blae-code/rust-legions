# Lane A — Rules core (data + derivations)

> This brief is your complete instruction set. Besides this file you read exactly four documents:
> `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md`, `docs/TACTICAL_SQUAD_PLAN.md` (the contract — §3 lanes,
> §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol), plus your own owned files and
> `test/helpers/extract-const.js`. Nothing in this brief overrides the plan document; where this brief
> is more specific than the plan, it is resolving an ambiguity the plan left open, and it says so.

---

## Goal

At the end of Lane A, `base44/shared/tactical.ts` is the single canonical source of the **squad**
model that replaces the formation-mass model: the base **9** squad types, the **5** specialists, the
**13** squad actions, the **4** deployables, the morale-modifier table, the figures↔companies
conversion, and the derivations `deriveSquad`, `poolCost`, `toRegiments`. `src/lib/tactical/data.js`
mirrors every one of those tables exactly (UI-only fields allowlisted), and
`test/tactical-mirror.test.js` proves it mechanically by lifting the tables textually out of the
`.ts` source. All armour and penetration arithmetic is **imported from Lane I's
`base44/shared/arms.ts`** — Lane A authors none of it. The tables are shaped so Lane F can append
rows later with a pure-append diff, and `docs/COMBAT_DESIGN.md` gains a `§ Tactical squads` section
recording every number and every formula.

---

## Owned files

Copied from §3 ("Lane A — Rules core (data + derivations)"). These are the **only** files you may
create or edit:

- `/home/blae/Documents/ROOT/Code/rust-legions/base44/shared/tactical.ts`
- `/home/blae/Documents/ROOT/Code/rust-legions/src/lib/tactical/data.js`
- `/home/blae/Documents/ROOT/Code/rust-legions/test/tactical-mirror.test.js`  *(new file)*
- `/home/blae/Documents/ROOT/Code/rust-legions/docs/COMBAT_DESIGN.md`  *(§ Tactical squads only — append, do not rewrite §0–§12)*

Plus **one** shared, protocol-sanctioned exception:

- `/home/blae/Documents/ROOT/Code/rust-legions/docs/TACTICAL_SQUAD_PLAN.md` **§4 only**, and only to
  record a contract addition, which you must then list in your PR body (§7 and the §3 preamble both
  require this). You may not touch §0–§3 or §5–§7.

**You may not edit any other file.** Specifically and by name, these are other lanes' or the platform's
and are off-limits even if they look broken to you:

| File | Owner |
| --- | --- |
| `base44/shared/tacticalEngine.ts` | Lane C |
| `base44/shared/tacticalField.ts`, `src/lib/tactical/field.js` | Lane B |
| `base44/shared/arms.ts`, `src/lib/arms.js`, `docs/ARMS_CATALOGUE.md` | Lane I |
| `base44/shared/motorPool.ts`, `src/lib/motorPool.js` | Lane J |
| `src/components/game/tactical/**` (`DeploymentScreen.jsx`, `FormationSlip.jsx`, `FormationStats.jsx`, `ReserveRack.jsx`, `TroopStack.jsx`, `EngagementStage.jsx`, `StageFrame.jsx`, …) | Lanes D / E |
| `src/components/game/sprites/UnitSprite.jsx`, `src/index.css` | Lane E |
| `src/lib/units.js`, `src/lib/armyDesign.js` | Lane F |
| `base44/functions/gameEngine/entry.ts`, `base44/functions/concurrentPlay/entry.ts`, `base44/entities/*.jsonc`, `docs/GAME_RULES.md`, `docs/ARCHITECTURE.md` | Platform lane (Base44 chat session) |
| `package.json`, `package-lock.json` | nobody — frozen (drift guard 3) |

If one of those files must change for your work to land, you do **not** change it. You write the exact
required change into your PR body as a hand-off line addressed to the owning lane.

---

## Contracts you consume

### From Lane I — `base44/shared/arms.ts` (mirror `src/lib/arms.js`). VERBATIM §4:

```ts
WeaponBase     = { accuracy, rateOfFire, damage, armorPen, range, reliability, weight, damageType: DamageType, aoe: { radius, falloff } | null }
DamageType     = 'kinetic'|'explosive'|'shaped'|'incendiary'|'fragmentation'|'concussive'|'chemical'
ArmourClassKey = 'none'|'soft'|'light'|'medium'|'heavy'|'superheavy'|'fortified'
ArmourClass    = { key: ArmourClassKey, armourValue: number, sealed: boolean, blurb }
PEN_TABLE      = Array<{ minDelta: number, mult: number }>      // armorPen − armourValue → effectiveness; a mult 0 row is mandatory
TYPE_MATRIX    = { [DamageType]: { [ArmourClassKey]: number } } // damage-type vs armour-class multiplier
// resolveHit({ weapon: WeaponBase, target: ArmourClass }) → { effective: number, suppressOnly: boolean } — the only armour math; Lane A imports it
Loadout        = { primary: WeaponInstance, support?: WeaponInstance, sidearm?: WeaponInstance }
// Squad rows gain `loadout?: Loadout`; deriveLoadout(squad) → Partial<SquadType values>, consumed by deriveSquad
// Every stand row gains `armour: ArmourClassKey` (infantry: none/soft/light via upgrade kits; vehicles: per facing, see below)
```

### From Lane J — `base44/shared/motorPool.ts` (informational; you do not import it). VERBATIM §4:

```ts
Facings         = { front: ArmourClassKey, side: ArmourClassKey, rear: ArmourClassKey, top: ArmourClassKey }
// Mechanized stand rows carry `vehicle: VehicleInstance`; deriveMechanized(stand) → Partial<SquadType values> & { facings: Facings }
// Engine rule (Lane A/C): a hit resolves via resolveHit against the struck facing — rear if the attacker occupies a hex behind the stand's facing
```

### From §4, the row shape you must satisfy for Lane F to extend. VERBATIM:

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed? }, blurb }
```

### From §4, the ratio rule you implement. VERBATIM:

```
Regiments ↔ figures: `1 company = FIGURES_PER_COMPANY` (Lane A sets; default 10 for infantry-derived, 1 for crawler/artillery/fighter — vehicles are single-figure squads). `toRegiments` rounds **down** so battles never create companies.
```

### From §4, the payload your output feeds (Lane C emits it; you supply the per-squad numbers). VERBATIM:

```ts
  myPool: { riflemen, crawler, artillery, fighter } | null,        // figures, not companies
  squads: [{ id, side, name, type, figures, maxFigures, specialists, q, r,
             status: { suppressed, routed, guard, building?: { work, turnsLeft } },
             melee, ranged, range, armor, speed, morale, initiative, pts,
             actions: [] /* only for mine */, mine: bool }],
```

```ts
// battleResult (Lane C → platform, unchanged)
{ attackerWon: bool, attackerUnits: Regiments, defenderUnits: Regiments }
```

---

## Contracts you produce

Everything below is consumed by Lane C (engine), Lane D (squad builder), Lane E (arena) and Lane F
(row appends). Emit these shapes **exactly**. Every field name is normative.

### Tables (pure data literals, mirrored 1:1)

```ts
SQUAD_TYPES        : { [SquadTypeKey]: SquadType }        // §4 SquadType + armour, damageType, armorPen, minFigures, maxFigures (see amendments)
SQUAD_TYPE_KEYS    : SquadTypeKey[]                       // derived: Object.keys(SQUAD_TYPES) — NOT a literal, not mirror-tested as a table
SPECIALISTS        : { [SpecialistKey]: Specialist }       // §4 Specialist, exactly 5 rows
SQUAD_ACTIONS      : { [SquadActionKey]: SquadAction }     // shape below, at least 13 rows
DEPLOYABLES        : { [DeployableKey]: Deployable }       // shape below, exactly 4 rows
FIGURES_PER_COMPANY: { riflemen: 10, crawler: 1, artillery: 1, fighter: 1 }   // keyed by RegimentKey
MORALE_MODS        : { [modKey]: number }                  // the roll-under modifier table Lane C applies
SCALING            : { ... }                               // every figure-scaling constant; no scaling magic number outside this table
COLUMN_KEYS        : ['riflemen','crawler','artillery','fighter']  // unchanged, keep as-is
```

New row shapes you are adding to the contract (record them in §4 — see **Work item 12**):

```ts
SquadAction = { key, label, requires: { types?: SquadTypeKey[], specialists?: SpecialistKey[] } | null,
                dmg: number, range: number | null /* override, null = use squad range */,
                aoe: { radius: number, falloff: number } | null,
                moraleHit: number, noMove: boolean, turns: number,
                builds?: DeployableKey, damageType?: DamageType }
Deployable  = { key, label, cover: number, blocksLOS: boolean, moveCost: number,
                buildTurns: number, infantryOnly: boolean,
                mods: { speed?: number, range?: number, suppress?: number } }
```

### Functions

```ts
deriveSquad(squad) → { figures, melee, ranged, range, armor, speed, morale, initiative, actions: SquadActionKey[], pts }
   // squad = { type: SquadTypeKey, figures: number, specialists: SpecialistKey[] /* ≤2 */, loadout?: Loadout }
poolCost(squads) → { [RegimentKey]: figures }        // FIGURES, not companies (matches §4 `myPool`)
toRegiments(squads) → { riflemen, crawler, artillery, fighter }   // COMPANIES, Math.floor, all four keys always present
resolveSquadHit({ attacker, action, targetArmour, targetDerived? }) → { effective: number, suppressOnly: boolean }
   // the ONLY call site of Lane I's resolveHit in the tactical layer; contains zero armour arithmetic of its own
struckFacing({ from: {q,r}, at: {q,r}, facing: number }) → 'front' | 'side' | 'rear' | 'top'
   // pure axial-hex geometry; picks which Facings key a hit lands on. Geometry, not armour math.
```

### Kept, unchanged, do not delete (Lane C's current engine and Lane D's current components import them)

`TROOPS`, `TROOP_KEYS`, `CASUALTY_ORDER`, `COLUMN_KEYS`, `ACTIONS`, `SIZE`, `hexDistance`,
`formationSize`, `deriveFormation` in `tactical.ts`; the same set plus `dominantTroop`, `hexPixel`,
`hexCorners` in `data.js`. Your work is **additive** to these. Deleting them turns Lane C's live
`tacticalEngine.ts` and five of Lane D's components into broken imports on `main`.

**⚠ The one cross-lane exception, and it is Lane B's, not yours — `hexPixel` and `hexCorners`.**
§3 gives Lane B `src/lib/tactical/field.js` with *"terrain meta + hex helpers moved here from
`data.js` — coordinate with Lane A"*. The agreed protocol, written identically into Lane B's brief:

- **Lane B authors `hexPixel` / `hexCorners` in `field.js` and never edits `data.js`** (it is yours).
- **You keep both helpers in `data.js` for the whole of P1.** Do not delete them pre-emptively —
  Lane B may not have merged, and a `data.js` that has lost them while `field.js` does not yet exist
  breaks Lane E's `arena/hexGeometry.js` chokepoint, which imports them from `@/lib/tactical/data`.
- **The removal is a follow-up you own**, filed after Lane B merges, and it is a *re-export*, not a
  deletion: `export { hexPixel, hexCorners } from "@/lib/tactical/field";` so no importer breaks.
- Because both states are legal during P1, **mirror check 3 (below) must pass whether the two helpers
  are defined in `data.js` or re-exported from `field.js`** — assert the allowlisted *names*, never
  the definition site. Note the outstanding follow-up in your PR body; Lane B's PR body flags it too.
- Never move `hexDistance`, `dominantTroop` or `formationSize` — they are rules/troop meta and stay
  with you. Lane B imports `hexDistance` from you and depends on you continuing to export it.

`poolCost` and `toRegiments` are the two exceptions — §3 explicitly re-bases them onto squads. Change
their semantics; do **not** keep a dual code path that sniffs whether the argument is a formation. The
transitional mismatch (the un-rewritten `tacticalEngine.ts` on `main` still passes formations) is
**expected and accepted**: merge order is strictly A → C, no test on `main` covers it, and Lane C
rewrites both call sites in P2. Note it in your PR body. Do not "fix" `tacticalEngine.ts`.

---

## Work items

Numbered and checkable. Every minimum below is a number.

1. **`SQUAD_TYPES` — exactly 9 rows, in this order:** `riflemen, assault, gunners, scouts, mortars,
   pioneers, crawler, artillery, fighter`. **Ship the BASE 9 ONLY.** Lane F appends
   `stormtroops, sappers, ski_troops, digger_corps, pilgrim_levy, provost, marksmen, flame_team,
   autocar_scouts, siege_mortar, land_dreadnought` later; you author none of them.
   - `from` (source regiment): `riflemen, assault, gunners, scouts, mortars, pioneers` → `'riflemen'`;
     `crawler` → `'crawler'`; `artillery` → `'artillery'`; `fighter` → `'fighter'`. **6 of the 9 are
     riflemen-derived.** `RegimentKey` ∈ the 4 `COLUMN_KEYS` — do not invent a fifth regiment.
   - Every row carries all of: `key, label, short, from, tier, figures, minFigures, maxFigures, melee,
     ranged, range, armor, speed, morale, pts, specials, armour, damageType, armorPen, blurb,
     doctrineNote`. **21 fields, every row, no omissions** — count them; the earlier "20" in this brief
     was an arithmetic slip and is corrected here. A missing field reads as `undefined` and
     Lane D renders a blank stat cell.
   - `tier` is `'I'` for all 9. Tiers `II:*` and `III` are gated content and belong to Lane F.
   - `specials: string[]` names the §1 hooks (`grenade`, `smoke`, `build`, …). Every string here must
     correspond to a `SQUAD_ACTIONS` key or a `requires` token you actually gate on — no decorative tags.
   - `armour` is an `ArmourClassKey` from Lane I's `ARMOUR_CLASSES` (infantry: `none`/`soft`/`light`;
     vehicles higher). `damageType` and `armorPen` are the squad's pre-loadout defaults, overridden by
     `deriveLoadout` output when Lane I's loadouts land.
2. **`SPECIALISTS` — exactly 5 rows:** `medic, signaler, commissar, heavy_gunner, sapper`. §3 is
   explicit: **"explicit numeric mods (no prose-only effects)"**. Every row's `mods` object carries at
   least **1** numeric key drawn from the §4 vocabulary `{ morale, initiative, recoverPerTurn,
   moraleFloor, aoeSuppress, buildSpeed }`; a `blurb` describing an effect that no number implements is
   a lane failure. Map §1's descriptions onto numbers: medic → `recoverPerTurn` + `morale`; signaler →
   `initiative`; commissar → `moraleFloor` (and the "−1 figure on failed test instead of routing" as a
   numeric field, name it and record it in §4); heavy_gunner → `aoeSuppress`; sapper → `buildSpeed`.
   Lane F extends this to 10 rows later; leave it appendable.
3. **`SQUAD_ACTIONS` — at least 13 rows:** `fire, assault, hold, grenade, mortar_barrage, suppress,
   smoke, rally, entrench` (**9**) plus one `build_<deployable>` per deployable — `build_foxhole,
   build_trench, build_bunker, build_emplacement` (**4**). Each row carries the full `SquadAction`
   shape above: `requires` (by squad type and/or specialist — `null` when universal), `dmg`, `range`
   override, `aoe` (`{ radius, falloff }` or `null`), `moraleHit`, `noMove`, `turns`. `grenade` and
   `mortar_barrage` are **AoE radius 1** per §3; `mortar_barrage` is **indirect** (mark it with an
   explicit boolean field, e.g. `indirect: true`, so Lane C can skip the LOS check — a prose note is
   not enough). Every `build_*` row sets `builds` to its `DEPLOYABLES` key and `turns` to that
   deployable's `buildTurns`; a test asserts the two agree.
4. **`DEPLOYABLES` — exactly 4 rows:** `foxhole, trench, bunker, emplacement`, each with `cover`,
   `blocksLOS`, `moveCost`, `buildTurns`, `infantryOnly`, `mods`. §1 constrains them: foxhole = light
   cover, `infantryOnly: true`; trench = linear cover, `blocksLOS: true`, raised `moveCost`; bunker =
   heavy cover, **`buildTurns: 2`**; emplacement fixes a gunner/artillery squad — express its three
   effects as numbers in `mods`: movement to zero (`speed: 0` as an absolute set, documented as such),
   **`range: +1`**, and a suppress bonus. The other three are `buildTurns: 1` (§1: "sapper/pioneer
   action, 1 turn"). Lane B seeds `trench`/`bunker` on the defender edge and Lane E draws glyphs for
   all four — the keys are a cross-lane contract, so they go into §4 (**work item 12**).
5. **`FIGURES_PER_COMPANY` and the ratio.** Export
   `FIGURES_PER_COMPANY = { riflemen: 10, crawler: 1, artillery: 1, fighter: 1 }`, keyed by
   **RegimentKey**, and make it the only conversion `poolCost`/`toRegiments` use.
   **The plan says the ratio two slightly different ways and you must resolve it, in code and in §4:**
   §3 says "1 company = 1 squad's default figures"; §4 says "default 10 for infantry-derived, 1 for
   crawler/artillery/fighter". The binding resolution: `FIGURES_PER_COMPANY` is keyed by regiment, not
   by squad type; `SQUAD_TYPES[t].figures` is the default *squad size* and may differ from its
   regiment's company size for specialised infantry — **except** that
   `SQUAD_TYPES.riflemen.figures === 10` and `SQUAD_TYPES.{crawler,artillery,fighter}.figures === 1`
   are hard, and asserted by a test. Vehicles are single-figure squads:
   `minFigures === maxFigures === 1` for all three.
6. **`poolCost(squads)` → figures.** Group `squad.figures` by `SQUAD_TYPES[squad.type].from` and sum.
   Output is in **figures**, matching §4's `myPool` comment ("figures, not companies"). Missing
   regiments may be absent or `0` — pick one and document it; the tests must pin whichever you pick.
7. **`toRegiments(squads)` → companies, rounding DOWN.** For each of the **4** `COLUMN_KEYS`:
   `Math.floor(Σ figures of squads whose regiment is that key / FIGURES_PER_COMPANY[key])`. All four
   keys are always present with a `0` default (the current implementation does this; `gameEngine`'s
   `battleResult` → `macroApplyBattleOutcome` depends on it). §4 is explicit: **rounds down "so battles
   never create companies"** — never `Math.round`, never `Math.ceil`.
8. **`deriveSquad(squad)`** returning exactly `{ figures, melee, ranged, range, armor, speed, morale,
   initiative, actions, pts }` — the same **10** keys, in that order, every time.
   - **Figure scaling:** effectiveness scales with figures (HoMM stack erosion). Base the scale on
     `figures / SQUAD_TYPES[type].figures` through a curve whose every constant lives in the exported
     `SCALING` table. **Zero scaling magic numbers appear outside `SCALING`** (drift guard 7).
     A single-figure vehicle scales at ratio 1 and must not divide by zero.
   - **Specialist stacking:** at most **2** specialists; apply them in `Object.keys(SPECIALISTS)` order,
     **not** in the caller's array order, so the result is invariant under permutation of
     `squad.specialists`. Additive mods sum (`morale`, `initiative`, `recoverPerTurn`, `buildSpeed`,
     `aoeSuppress`); `moraleFloor` takes the **max**. Duplicate specialists in the array count once.
     Document the rule in the file header.
   - **Action gating:** `actions[]` = the `SQUAD_ACTIONS` keys whose `requires` is satisfied by the
     squad's `type` and its `specialists`. Status-dependent gating (suppressed / routed / entrenched /
     already-building) is **Lane C's**, not yours — gate on type and specialists only.
   - **`pts`:** documented formula combining the type's `pts` scaled by figures plus each specialist's
     `pts`. **Anchor: `SQUAD_TYPES.riflemen.pts = 100` at its default 10 figures** (10 pts/figure).
     This reading of §3's *"riflemen ×10 = 100 pts"* is binding on Lane F too — its brief has been
     corrected to match, and its Points Audit recomputes against whatever value you actually merge —
     Lane F's Points Audit prices all 16+ types against "riflemen ×10 = 100 pts", so this number is a
     fixed reference, not a free choice. No base type exceeds **1.6×** baseline efficiency
     (pts per unit of derived combat value).
   - **`initiative`:** documented formula from `speed` plus the signaler mod (scouts fastest). Deterministic.
   - **Degenerate input:** `figures <= 0`, unknown `type`, or `undefined` returns the zero row —
     all numeric fields `0`, `actions: []` — and never throws. `deriveFormation` already does this;
     match the behaviour.
   - **Purity:** no `Math.random`, no `Date`, no `crypto`, no I/O. Same input → identical output, always.
9. **`MORALE_MODS` — at least 5 numeric entries.** §1 lists the roll-under modifiers: casualties taken
   this turn, flanked, an adjacent friendly destroyed, and the commissar/medic effects (those two come
   from `SPECIALISTS.mods`, so `MORALE_MODS` covers the situational ones). Include the outcome
   thresholds too — the margin at which a failed test becomes `routed` rather than `suppressed`.
   **Lane C implements the roll; Lane C authors none of these numbers** (drift guard 7). Because Lane C
   consumes it, it is a contract: record it in §4 (**work item 12**).
10. **Armour: import, never author (drift guard 12 — this is the loudest rule in this brief).**
    ```ts
    // in base44/shared/tactical.ts
    import { resolveHit, ARMOUR_CLASSES, PEN_TABLE, TYPE_MATRIX } from './arms.ts';
    ```
    ```js
    // in src/lib/tactical/data.js
    import { resolveHit, ARMOUR_CLASSES } from "@/lib/arms";
    ```
    - `resolveSquadHit` is the **only** function in either of your files that touches penetration, and
      it is a thin adapter: build a `WeaponBase`-shaped object from the attacker's derived
      `{ armorPen, damageType, aoe, … }`, look the target's `ArmourClass` up in `ARMOUR_CLASSES`, call
      `resolveHit`, return its result. **No subtraction of `armourValue`. No table walk over
      `PEN_TABLE`. No `TYPE_MATRIX` lookup. No local multiplier table. No "temporary" fallback constant.**
      §6.12: *"No lane re-implements penetration in its own file."*
    - Do **not** copy, re-export or mirror `ARMOUR_CLASSES` / `PEN_TABLE` / `TYPE_MATRIX` into
      `data.js`. They are Lane I's tables and Lane I's mirror test owns them; a second copy is exactly
      the drift the One Critical Invariant exists to prevent.
    - A hit on a vehicle resolves against the **struck facing** (§4: "rear if the attacker occupies a
      hex behind the stand's facing"). `struckFacing` picks the key; `resolveSquadHit` takes the
      resulting `ArmourClassKey` as an argument. Lane A therefore never imports Lane J.
    - **Sequencing (§5): Lane I merges BEFORE Lane A finalises combat resolution.** If `arms.ts` is not
      on `main` when you start: build items 1–9 and 11–14 first, rebase your branch on `main` once Lane
      I merges, then add item 10 last. If Lane I still has not merged when you are otherwise finished,
      **open the PR with `resolveSquadHit` and `struckFacing` absent** and say so in the PR body under
      "blocked on Lane I". A missing helper is a merge-order note; a second damage model is a defect
      that survives the project.
11. **The mirror — `src/lib/tactical/data.js`.** Every exported table above appears there with
    **identical keys in identical order** and identical values, plus optional UI-only fields. The
    mirror may add **only** these **5** keys anywhere in a row: `label`, `short`, `blurb`, `desc`,
    `icon` (§3: *"mirror may add UI-only fields `label, short, blurb, desc, icon`"*). Any other extra
    field, or a differing value on a shared field, is drift and the test fails. Mirror the functions
    too (`deriveSquad`, `poolCost`, `toRegiments`, `resolveSquadHit`, `struckFacing`) — the mirror is
    preview-only and decides nothing, but Lane D's stat grid renders from it.
12. **§4 contract amendments — file them in the same PR, and list them in the PR body.** Your work adds
    shapes the plan does not yet carry. Add each to `docs/TACTICAL_SQUAD_PLAN.md` §4, in the same
    `ts` code block style, and nowhere else:
    - `SquadType` gains `armour: ArmourClassKey`, `damageType: DamageType`, `armorPen: number`,
      `minFigures: number`, `maxFigures: number`.
    - `SquadAction` — the full row shape (§3 lists the field names in prose only).
    - `Deployable` — the full row shape (absent from §4 entirely; Lanes B, C and E all consume it).
    - `MORALE_MODS`, `SCALING`, `FIGURES_PER_COMPANY` — named as Lane-A-owned tables consumed by Lane C.
    - `resolveSquadHit` and `struckFacing` — signatures, and the note that they are the tactical
      layer's only route to `resolveHit`.
    - The figures↔companies resolution from work item 5, as a one-line clarification under the existing
      "Regiments ↔ figures" paragraph.
13. **`test/tactical-mirror.test.js`** — see **Acceptance criteria → Lane-specific checks** for the
    exact assertions this file must contain.
14. **`docs/COMBAT_DESIGN.md` § Tactical squads** — append a new numbered section after §12 (e.g.
    `## 13. Tactical Squads — canonical numbers (Lane A)`). It must contain: the 9-row squad table with
    every stat; the 5 specialists and their numeric mods; the 13 actions; the 4 deployables; the
    `FIGURES_PER_COMPANY` table **and the figures↔companies ratio stated in prose**; the `deriveSquad`
    scaling / specialist-stacking / initiative / `pts` formulas; the base-9 Points Audit against
    `riflemen ×10 = 100 pts` (Lane F extends the same table); and one paragraph stating that all armour
    math is delegated to `arms.ts`. Ministry voice in any player-facing phrasing. Do **not** edit
    `docs/GAME_RULES.md` — it is platform-owned; flag it in the PR body instead (drift guard 9).

### Keeping the tables trivially appendable for Lane F

Lane F appends rows to `SQUAD_TYPES`, `SPECIALISTS` and a new `UPGRADES` table **later, into files you
wrote**. Author them so that append is a pure-append diff:

- **One row per line-block**, one key per row, in a flat object literal. No grouping helpers, no
  sub-objects of rows, no arrays-of-tuples reshaped by `.map()`.
- **No spreads (`...`), no computed keys (`[x]:`), no function calls, no template literals in keys, no
  chained array methods.** The mirror test lifts these tables **textually** with
  `test/helpers/extract-const.js` and evaluates them with `Function("return (…)")` — it has no access
  to module scope, so a computed table throws `ReferenceError` and **a table that is computed cannot be
  mirror-tested at all**. (`extract-const.js` does allow a small chain allowlist; this brief forbids
  using it for these tables.)
- New rows go at the **end** of the literal, both sides, so canonical and mirror stay diffable
  side by side. The test asserts key **order**, not just key sets.
- Do not sort, reflow, realign or reformat existing rows in the same PR as a content change.

---

## Acceptance criteria

### Copied VERBATIM from §3, "Lane A — Rules core (data + derivations)"

> Owns: `base44/shared/tactical.ts`, `src/lib/tactical/data.js`, `test/tactical-mirror.test.js`, `docs/COMBAT_DESIGN.md` (§ Tactical squads).
> Delivers:
> - `SQUAD_TYPES` — `riflemen, assault, gunners, scouts, mortars, pioneers, crawler, artillery, fighter` with the value set in §1. Source regiment via `from` (riflemen-derived: assault, gunners, scouts, mortars, pioneers).
> - `SPECIALISTS` — the five in §1 with explicit numeric mods (no prose-only effects).
> - `SQUAD_ACTIONS` — `fire, assault (melee), hold, grenade (AoE r1), mortar_barrage (AoE r1, indirect), suppress, smoke, build_<deployable>, rally, entrench`. Each with `requires` (type/specialist), `dmg`, `range` override, `aoe`, `moraleHit`, `noMove`, `turns`.
> - `DEPLOYABLES` — `foxhole, trench, bunker, emplacement` with `cover`, `blocksLOS`, `moveCost`, `buildTurns`, `infantryOnly`.
> - `deriveSquad(squad)` → `{ figures, melee, ranged, range, armor, speed, morale, initiative, actions[], pts }` applying figure scaling + specialists.
> - `poolCost`, `toRegiments` re-based on figures→companies (1 company = 1 squad's default figures; document the ratio).
> - **Mirror test** — extend the existing `test/helpers/extract-const.js` pattern: every exported table in `tactical.ts` deep-equals `data.js` (mirror may add UI-only fields `label, short, blurb, desc, icon`).
>
> Acceptance: `npm test` green; `deriveSquad` unit tests for scaling, specialist stacking, action gating.

### Lane-specific checks — each one is a test in `test/tactical-mirror.test.js` (or a command)

The mirror test file must contain, at minimum, assertions for all of the following. Every one is
checkable by running `npx vitest run test/tactical-mirror.test.js`.

1. **Auto-discovered table coverage.** Scan the text of `base44/shared/tactical.ts` for every
   declaration matching `export const NAME =` whose first non-trivia character after `=` is `{` or `[`
   (that filter excludes the arrow functions and `Object.keys(...)` derivations, which `extractConst`
   cannot lift). For **each** discovered name: `extractConst` it, import the same name from
   `@/lib/tactical/data.js`, strip the 5 UI-only keys from **both** sides recursively, and
   `expect(mirror).toEqual(canonical)`. Discovery must be **derived from the source**, never a
   hand-maintained list — this is the check that catches "a lane added a table without a mirror",
   which the orchestrator audits every 2 PRs.
2. **Key order.** For every discovered table, `expect(Object.keys(mirror)).toEqual(Object.keys(canonical))`
   — ordered, so the two files stay diffable and Lane F's appends land in the same place on both sides.
3. **Mirror-only exports are allowlisted.** The only exports allowed to exist in `data.js` and not in
   `tactical.ts` are the UI helpers `dominantTroop`, `hexPixel`, `hexCorners`. Assert the **set of
   names**, and assert it in a way that survives the Lane B hand-off above — `hexPixel`/`hexCorners`
   may be defined in `data.js` *or* re-exported from `@/lib/tactical/field`, and both are legal. Do
   not assert on the text of their definitions.
4. **No armour tables here.** `expect(tacticalSrc).not.toMatch(/const\s+(ARMOUR_CLASSES|PEN_TABLE|TYPE_MATRIX)\s*=/)`
   and the same against `data.js` — plus assert that if `resolveHit` appears at all, it appears on an
   `import` line. Drift guard 12, mechanically.
5. **Row completeness.** All **9** `SQUAD_TYPES` rows define all **21** required fields (the list in
   work item 1), none `undefined`;
   all **5** `SPECIALISTS` rows have ≥1 numeric key in `mods`; all **13+** `SQUAD_ACTIONS` rows define
   `requires`, `dmg`, `aoe`, `moraleHit`, `noMove`, `turns`; all **4** `DEPLOYABLES` rows define
   `cover`, `blocksLOS`, `moveCost`, `buildTurns`, `infantryOnly`.
6. **Regiment integrity.** Every `SQUAD_TYPES[t].from` ∈ `COLUMN_KEYS`; exactly **6** of the 9 have
   `from === 'riflemen'`; `SQUAD_TYPES.riflemen.figures === 10`; `crawler`/`artillery`/`fighter` each
   have `figures === minFigures === maxFigures === 1`; every regiment key in `FIGURES_PER_COMPANY`
   is a `COLUMN_KEY` and vice versa.
7. **`build_*` ↔ `DEPLOYABLES` agreement.** Every `SQUAD_ACTIONS` key starting `build_` names an
   existing `DEPLOYABLES` key via `builds`, and its `turns` equals that deployable's `buildTurns`;
   `bunker.buildTurns === 2`; the other three are `1`.
8. **`toRegiments` rounds down.** With `FIGURES_PER_COMPANY.riflemen === 10`: 19 riflemen figures → 1
   company; 9 → 0; 10 → 1; 0 squads → all four keys present at 0. A surviving crawler squad of 1
   figure → 1 company. And the never-create-companies property: for any squad list,
   `toRegiments(list)[k] * FIGURES_PER_COMPANY[k] <= poolCost(list)[k]` for every regiment key.
9. **`deriveSquad` — figure scaling** (§3 acceptance): at default figures the derived `melee`/`ranged`
   equal the type's declared values; at half figures they are strictly lower; at `minFigures` they are
   still ≥ 0; a vehicle at 1 figure derives its declared values unchanged; `figures: 0` returns the
   zero row without throwing.
10. **`deriveSquad` — specialist stacking** (§3 acceptance): `['medic','signaler']` and
    `['signaler','medic']` produce **deep-equal** output (order invariance); two specialists' additive
    mods sum; `moraleFloor` takes the max; a duplicate (`['medic','medic']`) counts once; a third
    specialist is rejected or ignored per your documented rule, and the test pins whichever it is.
11. **`deriveSquad` — action gating** (§3 acceptance): a plain `riflemen` squad's `actions` excludes
    every `build_*` action; adding `sapper` admits them; `mortars` admits `mortar_barrage` and plain
    `riflemen` does not; every key in every squad's `actions` exists in `SQUAD_ACTIONS`.
12. **Purity.** `expect(tacticalSrc).not.toMatch(/Math\.random|new Date|Date\.now/)` and the same for
    `data.js`; `deriveSquad` called twice on the same input deep-equals itself.
13. **Points anchor.** `SQUAD_TYPES.riflemen.pts === 100` and `SQUAD_TYPES.riflemen.figures === 10`.
14. **Legacy exports survive.** `TROOPS`, `TROOP_KEYS`, `CASUALTY_ORDER`, `COLUMN_KEYS`, `ACTIONS`,
    `SIZE`, `hexDistance`, `formationSize`, `deriveFormation` are still exported from `tactical.ts`,
    and `TROOPS`/`ACTIONS`/`SIZE` still mirror (they already do; item 1 covers them automatically).
15. **Command check, run and paste the output into the PR body:**
    `grep -n 'armourValue\|PEN_TABLE\|TYPE_MATRIX\|resolveHit' base44/shared/tactical.ts src/lib/tactical/data.js`
    — every hit must be on an `import` line or inside `resolveSquadHit`'s body as a call, and nothing else.

---

## Drift guards

### The §6 list, in full — mandatory in your PR

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it. UI-only
   fields are allowlisted in the test.
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations,
   autoFormations, autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported.
   `gameEngine` imports exactly these. *(Lane C's file — for you this means: do not open it.)*
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind
   classes must be literal strings, never template-built (the build purges non-literal classes).
5. **Ministry voice** in every user-visible string; PII never rendered. Every `label`, `short`, `blurb`,
   `desc` and `doctrineNote` you write is user-visible: in-world military-ministry English, consistent
   with `docs/VISION.md` (nomadic keels, the Ground, the Four Departures). No real-world nations,
   brands or people.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only — `@/` alias inside `src/`,
   never a relative `../` path. (You ship no components; the `@/` rule binds `data.js`.)
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from `data.js`,
   never retyped. Corollary for you: every scaling / morale / points constant lives in an **exported
   table**, not inline in a formula, so downstream lanes can import it instead of retyping it.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (yours) and
   **flags** `docs/GAME_RULES.md` for the platform lane (you do not edit it).
10. **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no
    `UnitSprite.jsx` edits. **Existing catalog keys are never renamed or removed — live saves reference
    them.** This binds you hard: `riflemen`, `gunners`, `scouts`, `crawler`, `artillery`, `fighter`
    already exist as `TROOPS` keys and as `COLUMN_KEYS`; reuse those exact spellings in `SQUAD_TYPES`
    and never rename one. Every new mechanical effect uses the §4 effect-key vocabulary or extends it
    in the same PR.
11. **Arms granularity stays numeric and server-rolled** — no weapon stat exists only in prose; every
    quirk carries a machine-evaluable `condition`; `rollWeapon` is pure and seeded (no `Math.random`);
    the tactical engine consumes only `deriveLoadout` output, never raw weapon instances. *(Lane I's —
    your obligation is the last clause: `deriveSquad` consumes `deriveLoadout` output only.)*
12. **One damage model** — armour math exists only in `arms.ts` (`ARMOUR_CLASSES`, `PEN_TABLE`,
    `TYPE_MATRIX`, `resolveHit`). Every weapon declares `armorPen`, `damageType` and `aoe`; every stand
    declares an `ArmourClass` (vehicles per facing). `PEN_TABLE` must contain a `mult: 0` row so light
    weapons are genuinely ineffective against heavy/superheavy armour; a zero-effect hit may still
    suppress. **No lane re-implements penetration in its own file.** ← the one you are most likely to
    break, because inventing a two-line multiplier feels harmless. It is not.
13. **Mechanized granularity mirrors arms** — vehicles are chassis + powerplant + armour package +
    suspension + mount + hardpoints + mods + quirks; `rollVehicle` is pure and seeded; the engine
    consumes only `deriveMechanized` output plus `facings`. *(Lane J's.)*

### Environment rules — non-negotiable

- **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store
  (`/home/blae/.node-modules-store/rust-legions/node_modules`) and npm **silently deletes the symlink
  and reifies a real directory** in its place (npm prints `warn reify Removing non-directory …`; there
  is no config knob). Dependencies are already installed. If your worktree has no `node_modules`,
  create the symlink — `ln -s /home/blae/.node-modules-store/rust-legions/node_modules node_modules` —
  or ask the orchestrator. **`scripts/agent-worktree.sh` prints `next: cd … && npm ci` — ignore that
  line; it predates the shared store.**
- **NEVER edit `package.json` or `package-lock.json`** (drift guard 3). You therefore cannot add your
  test to the `rules:check` script — that is fine, `npm test` (`vitest run`) picks up
  `test/**/*.test.js` automatically.
- Run tests with `npm test` (`vitest run`) and lint with `npm run lint` (`eslint . --quiet`), from the
  repository root.
- No new npm packages, ever (§2 non-goals: "No new npm packages").
- Do not use `Math.random`, `Date.now`, `new Date` or any I/O in `tactical.ts` or `data.js`.

### Git protocol (§7)

- Work in your **own git worktree** on branch **`feat/tactical-a`**. Note that
  `scripts/agent-worktree.sh new tactical-a` creates the branch as `claude/tactical-a`; §7 requires
  `feat/tactical-a`, so rename it or create the branch explicitly — confirm the branch name with the
  orchestrator before pushing rather than guessing.
- Push to `origin/feat/tactical-a` and open a **PR against `main`**. PR title: `tactical(a): <summary>`.
  PR body lists the contract sections touched (your §4 amendments from work item 12, itemised) and the
  test names added.
- **`main` is two-way synced with the Base44 Builder — a red merge breaks the live app's preview.**
  Never push a branch whose `npm test` is red.
- **You never edit another lane's files.** If a contract must change, you edit
  `docs/TACTICAL_SQUAD_PLAN.md` §4 **first** and say so in the PR body.
- Anything needing the live backend (entity writes, function deploy, `Patch` records) is handed back as
  a checklist in the PR body, never attempted from the worktree.

---

## Definition of done

Run these, in this order, from the repository root of your worktree. All four must be green before you
open the PR.

```bash
npm test
npm run lint
bash .claude/hooks/rules-guard.sh < /dev/null
npx vitest run test/tactical-mirror.test.js
```

Plus the drift-guard-12 grep, whose output goes in the PR body:

```bash
grep -n 'armourValue\|PEN_TABLE\|TYPE_MATRIX\|resolveHit' base44/shared/tactical.ts src/lib/tactical/data.js
```

**What green looks like**

| Command | Green |
| --- | --- |
| `npm test` | vitest exits **0**; `Test Files … passed`, `Tests … passed`, **0 failed**. The pre-existing suites (`combat-math`, `extract-const`, `macro-engine-sim`, `macro-mirror`, `macro-pacing`, `rules-mirror`) still pass — you have broken nothing — **and** `tactical-mirror.test.js` appears in the list. |
| `npm run lint` | eslint exits **0** with **no output** (`--quiet` suppresses warnings, so any line printed is an error). |
| `bash .claude/hooks/rules-guard.sh < /dev/null` | exits **0** and prints **nothing** (it is a passive reminder that only speaks when a mirrored rules file path appears on stdin). |
| `npx vitest run test/tactical-mirror.test.js` | every assertion in **Acceptance criteria → Lane-specific checks 1–14** passes. |
| the grep | every hit is an `import` line or a `resolveHit(...)` call inside `resolveSquadHit`. Any other hit = drift guard 12 violated = not done. |

**And the non-command half of done:**

- `base44/shared/tactical.ts` exports the base **9** squad types, **5** specialists, **13+** actions,
  **4** deployables, `FIGURES_PER_COMPANY`, `MORALE_MODS`, `SCALING`, `deriveSquad`, `poolCost`,
  `toRegiments`, and (if Lane I has merged) `resolveSquadHit` + `struckFacing` — with every legacy
  export still present.
- `src/lib/tactical/data.js` mirrors all of it, adding only `label`/`short`/`blurb`/`desc`/`icon`.
- `docs/COMBAT_DESIGN.md` carries the new `§ Tactical squads` section, including the figures↔companies
  ratio in prose and the base-9 Points Audit.
- `docs/TACTICAL_SQUAD_PLAN.md` §4 carries every amendment from work item 12, and **only** §4 changed.
- The PR body lists: the §4 amendments, the test names added, the grep output, the transitional
  `poolCost`/`toRegiments` note for Lane C, the `docs/GAME_RULES.md` flag for the platform lane, and —
  if applicable — the "blocked on Lane I" note for the two deferred helpers.

---

## ORCHESTRATOR RULINGS — 2026-09-01 (AUTHORITATIVE, supersedes anything above)

The brief you are reading was written before the contract was audited. Six genuine contradictions were
found **inside `docs/TACTICAL_SQUAD_PLAN.md`** and have been resolved by the orchestrator and written
into the plan. They are settled. **Do not re-litigate them, and do not file an amendment for any of
them** — a lane that files a competing amendment for a decided question will have its PR rejected.

| # | Question | Ruling |
| --- | --- | --- |
| Q1 | `tacticalOrders` declared `action` twice in §4 | The squad action key is **`orderAction`**. The envelope key `action` stays the gameEngine dispatch verb. Already fixed in §4. Lanes C, D and E consume `orderAction`. Lane E does **not** file this amendment any more. `gameEngine` reading `body.orderAction` is a platform-handoff item. |
| Q2 | §5 was circular about where Lane F sits | The executed wave order is now a table in §5: **1)** I, B, G · **2)** A, J · **3)** C, F · **4)** H · *platform handoff* · **5)** D, E. Your wave is fixed. Do not start early; do not assume a lane you depend on is unmerged. |
| Q3 | §3 Lane H `uniqueRoster` was missing `patterns` | §4 governs; §3 is fixed to `{ squads, upgrades, decree, patterns }`. Lane H does not file this. |
| Q3b | Does `Preset` need a `keel` field? | **No.** The required `keel_<key>` plate is keyed off the existing `house` value. Do not add a field. |
| Q4 | §3 Lane G cited `VISION §5` for the ideology axes | Wrong section — the axes are **`VISION §6.1`** (§5 is the macro map). Fixed in §3. Lane G does not file this. |
| Q5 | figures↔companies stated two ways | **`FIGURES_PER_COMPANY` is keyed by REGIMENT, never by squad type.** A squad type's `figures` is its own default squad size and may differ from its source regiment's company size. `riflemen`-derived = 10 and `crawler`/`artillery`/`fighter` = 1 are hard values, asserted in Lane A's tests. Fixed in §4. |
| Q6 | §0 said `hexPixel`/`hexCorners` live in `data.js` | They move to `field.js` with Lane B, and `data.js` **re-exports** them so no consumer's import path ever breaks. Noted in §0. |

**One more standing ruling — the pts anchor:** `SquadType.pts` is the cost of the **squad**, not of a
figure. `SQUAD_TYPES.riflemen.pts === 100` (a 10-figure squad). Every Points Audit is computed against
that. If your brief says `10`, it is wrong; `100` is correct.

**Baseline note:** `main` was RED when this wave started (6 failing tests, 1 lint error, all
pre-existing and unrelated to this plan). It was repaired first — `main` is green at 95 passing tests
before your lane begins. Do not record an absolute test count as your success gate; other lanes add
tests. Your gate is **0 failed** plus your own lane's named tests passing.

