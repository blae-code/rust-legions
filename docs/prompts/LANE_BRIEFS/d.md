# Lane D — Squad builder UI (pre-battle + Army Design Bureau)

> This brief is your complete instruction set. Besides it, you read exactly four documents:
> `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md`, `docs/TACTICAL_SQUAD_PLAN.md` (**the contract** — §3
> lanes/ownership, §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol), plus your own owned
> files and `test/helpers/extract-const.js`. Nothing else is required context. Where this brief and the
> contract disagree, **the contract wins** — and you fix this brief's error in your PR body.

**You are phase P4, and everything below you must already be on `main`.** §5 is explicit and gives you
two obligations, not one:

1. **Merge order is strict: `A/B → C → platform → D/E`**, and on the content track
   `I → J → F → H`, with **F, I and J all landing before D starts** (*"the squad builder renders F's
   rows, I's loadouts and J's vehicles"*). So before you write a line, confirm all of:
   `src/lib/tactical/data.js` exports `SQUAD_TYPES` (Lane A) with Lane F's rows appended,
   `src/lib/arms.js` exists (Lane I), `src/lib/motorPool.js` exists (Lane J), and
   `base44/shared/tacticalEngine.ts` exports `tacticalView` in its squad form (Lane C).
   If any of those is missing, **stop and report to the orchestrator** — do not author another lane's
   tables, and do not stub them into your own files.
2. **"D and E may open PRs early but rebase on P3."** You may therefore start against P1 shapes and
   open a draft PR, but you are **not done** until you have run
   `git fetch origin && git rebase origin/main` **after the platform lane has landed P3** (the
   `createTactical` field opts, squads on `tacticalDeploy`, the `tacticalAuto` action) and re-run the
   whole Definition of done on that rebase. State the rebase — the commit you rebased onto — in your
   PR body. A green run against a pre-P3 `main` does not discharge this.

---

## Goal

At the end of this lane, the pre-battle screen is a four-step **squad builder**, not a company-chit
divider. A commander carves squads out of the column's regiments (Lane F's `SQUAD_TYPES`), fits each
squad with up to two specialist attachments, issues small arms from Lane I's Arms Catalogue in a
**Small Arms Issue** step, refits mechanized stands from Lane J's Motor Pool in a **Motor Pool Refit**
step, places squads on the defender/attacker deploy hexes, and seals an order of battle that emits the
§4 `tacticalDeploy` payload exactly. The Army Design Bureau gains a **Squad Templates** register whose
records match the §4 `SquadTemplate` shape, stubbed on local storage until the platform lane lands the
entity. Every drag interaction has a keyboard equivalent; every number shown in copy is imported, never
retyped; every string is in Ministry voice.

---

## Owned files

Copied from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane D:

```
src/components/game/tactical/DeploymentScreen.jsx
src/components/game/tactical/FormationSlip.jsx
src/components/game/tactical/FormationStats.jsx
src/components/game/tactical/ReserveRack.jsx
src/components/game/tactical/TroopStack.jsx
src/components/game/tactical/squad/*            (NEW directory — you create it)
src/pages/ArmyDesigner.jsx
src/components/army/*
```

Plus **one** file this brief adds to your ownership, because §3 gave Lane D no test path and your
acceptance criteria must be executable:

```
test/squad-builder.test.js                      (NEW file — create it; never edit an existing test file)
```

Because that is an extension of §3, you **must** in the same PR add `test/squad-builder.test.js` to the
Lane D `Owns:` line in `docs/TACTICAL_SQUAD_PLAN.md` §3 and say so in your PR body under "Contract
sections touched". That is the only edit you may make to the plan document unless a §4 shape genuinely
has to change (see Drift guards).

**You may not edit any other file.** In particular these are near you and are NOT yours:

| File | Owner |
| --- | --- |
| `src/components/game/tactical/EngagementStage.jsx` | unowned router — see "Wiring you must request" |
| `src/components/game/tactical/StageFrame.jsx`, `ResolutionElection.jsx` | unowned — do not touch |
| `src/components/game/tactical/arena/*`, `src/index.css`, `UnitSprite.jsx` | Lane E |
| `src/lib/tactical/data.js`, `base44/shared/tactical.ts` | Lane A (rows: Lane F) |
| `src/lib/arms.js`, `base44/shared/arms.ts` | Lane I |
| `src/lib/motorPool.js`, `base44/shared/motorPool.ts` | Lane J |
| `src/lib/armyDesign.js`, `src/lib/units.js` | Lane F |
| `base44/functions/gameEngine/entry.ts`, `base44/entities/*.jsonc` | platform lane |
| `package.json`, `package-lock.json` | nobody (drift guard 3) |

### Wiring you must request, not perform

`EngagementStage.jsx` currently calls `onDeploy` with `{ action: "tacticalDeploy", formations }`. §4 says
the body is `{ action: 'tacticalDeploy', gameId, squads: [...] }`. That one-line change is outside your
ownership. Your `DeploymentScreen` **must** call its `onDeploy(squads)` prop with the squads array and
nothing else; then list this in your PR body verbatim:

> **Required wiring outside Lane D (1 line):** `src/components/game/tactical/EngagementStage.jsx` —
> `onDeploy={(formations) => onAction({ action: "tacticalDeploy", formations })}` becomes
> `onDeploy={(squads) => onAction({ action: "tacticalDeploy", squads })}`.

Same rule for the placement preview: §3 says the mini field preview is **Lane E's `FieldCanvas` in
`placement` mode**. Lane E may not have merged. You therefore do **not** import
`@/components/game/tactical/arena/FieldCanvas` (importing a file that does not exist breaks the build).
Instead your `DeployPlacement.jsx` takes a `renderField` render-prop (a function or element) and falls
back to your own keyboard-first `HexListPicker.jsx` when it is `null`. Request the wiring in the PR body:

> **Required wiring outside Lane D (1 prop):** once Lane E merges, `DeploymentScreen` passes
> `renderField={(props) => <FieldCanvas mode="placement" {...props} />}` to `DeployPlacement`.

---

## Contracts you consume

Verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §4. **Read these shapes off the merged files at runtime —
never re-declare them.**

### From Lane C via the platform (`getState → battle.tactical`) — the prop your screen receives

```ts
{
  status: 'deploy' | 'fighting' | 'done', round, roundLimit, myRole: 'attacker' | 'defender' | null,
  deployed: { attacker: bool, defender: bool },
  myPool: { riflemen, crawler, artillery, fighter } | null,        // figures, not companies
  field: { w, h, tiles: { "q,r": { terrain, cover, elev, blocksLOS, moveCost, work? } }, deploy: { attacker: [{q,r}], defender: [{q,r}] } },
  activeId, queue: [squadId],
  squads: [{ id, side, name, type, figures, maxFigures, specialists, q, r,
             status: { suppressed, routed, guard, building?: { work, turnsLeft } },
             melee, ranged, range, armor, speed, morale, initiative, pts,
             actions: [] /* only for mine */, mine: bool }],
  los: [{ q, r }] /* hexes visible to the active squad, only when mine */,
  log: string[], fx: { seq, round, actorId, action, targetId?, at?: {q,r}, dealt, taken, moraleResult?: 'held'|'suppressed'|'routed', moved, from } | null
}
```

Lane D reads `status`, `myRole`, `deployed`, `myPool`, `field.deploy[myRole]`, `field.tiles`, `field.w`,
`field.h`. It does **not** read `queue`, `activeId`, `los` or `fx` — those are Lane E's.

### From Lanes A + F (`@/lib/tactical/data`)

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed? }, blurb }
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
```

Also from Lane A: `deriveSquad(squad)` → `{ figures, melee, ranged, range, armor, speed, morale,
initiative, actions[], pts }`, `SQUAD_ACTIONS`, `DEPLOYABLES`, `poolCost`, `toRegiments`, and the
figures↔companies ratio (`1 company = FIGURES_PER_COMPANY`; default 10 infantry-derived, 1 for
crawler/artillery/fighter). **`deriveSquad` is the only place that computes squad values — you never
add two stats together in a component.**

### From Lane I (`@/lib/arms`)

```ts
WeaponClass    = 'sidearm'|'carbine'|'rifle'|'smg'|'lmg'|'hmg'|'shotgun'|'marksman'|'anti_armor'|'flame'|'mortar'|'crawler_gun'|'artillery'|'aircraft_gun'
ModSlot        = 'barrel'|'optic'|'magazine'|'stock'|'muzzle'|'bayonet'|'ammunition'|'mount'
Manufacturer   = { key, label, houseKey?: string, culture?: string, signature: Partial<WeaponBase>, nameStems: string[], access: { [houseKey]: 'native'|'licensed'|'captured' }, lore }
Calibre        = { key, label, class: WeaponClass, damage, armorPen, range, weight, logisticsClass: RegimentKey, lore }
WeaponPattern  = { key, label, maker: ManufacturerKey, calibre: CalibreKey, class: WeaponClass, tier, base: WeaponBase, slots: ModSlot[], quirks: QuirkKey[], pts, appliesTo: SquadTypeKey[], blurb }
Modification   = { key, label, slot: ModSlot, appliesTo: WeaponClass[], pts, mods: Partial<WeaponBase>, tradeoff: Partial<WeaponBase>, blurb }
Quirk          = { key, label, mods: Partial<WeaponBase> | { morale?, initiative? }, condition?: { key: string, value?: any }, blurb }
QualityGrade   = { key: 'scrap'|'issue'|'proofed'|'master'|'relic', mult: Partial<WeaponBase>, ptsMult, rollWeight }
WeaponInstance = { patternKey, quality: QualityKey, mods: ModKey[], quirks: QuirkKey[], serial: string }
Loadout        = { primary: WeaponInstance, support?: WeaponInstance, sidearm?: WeaponInstance }
// Squad rows gain `loadout?: Loadout`; deriveLoadout(squad) → Partial<SquadType values>, consumed by deriveSquad
```

You display `deriveLoadout(squad)` output; you never do weapon arithmetic and never touch armour math
(drift guard 12 — armour math exists only in `arms.ts`/`arms.js`).

### From Lane J (`@/lib/motorPool`)

```ts
VehicleClass    = 'scout_crawler'|'line_crawler'|'heavy_crawler'|'land_fort'|'half_track'|'armoured_car'|'sp_gun'|'tractor_gun'|'gunboat'|'fighter'|'bomber'
VehicleSlot     = 'engine'|'armour'|'suspension'|'turret'|'hardpoint'|'optics'|'radio'|'stowage'|'crew_kit'
Facings         = { front: ArmourClassKey, side: ArmourClassKey, rear: ArmourClassKey, top: ArmourClassKey }
Hardpoint       = { key, allowed: WeaponClass[] }
ChassisPattern  = { key, label, maker: ManufacturerKey, class: VehicleClass, tier, hull: { tonnage, crew, hardpoints: Hardpoint[], baseArmour: Facings }, slots: VehicleSlot[], quirks: QuirkKey[], pts, blurb }
Powerplant      = { key, label, maker?, hp, weight, reliability, fuelClass: RegimentKey, heat, blurb }
ArmourPackage   = { key, label, facings: Partial<Facings>, weight, cost, reliability, blurb }
Suspension      = { key, label, terrain: { [TerrainKey]: number }, weight, reliability, blurb }
Mount           = { key, label, hardpoints: number, arc: number, crewArmour: ArmourClassKey, blurb }
VehicleMod      = { key, label, slot: VehicleSlot, appliesTo: VehicleClass[], pts, mods: Record<string, number>, tradeoff: Record<string, number>, blurb }
VehicleInstance = { chassisKey, quality: QualityKey, powerplant: PowerplantKey, armourPackage?: ArmourPackageKey, suspension: SuspensionKey, mount: MountKey, hardpoints: WeaponInstance[], mods: VehicleModKey[], quirks: QuirkKey[], serial }
// Mechanized stand rows carry `vehicle: VehicleInstance`; deriveMechanized(stand) → Partial<SquadType values> & { facings: Facings }
```

**If an export you need is missing** from any of those three files after F/I/J merged: do not invent it
and do not edit their file. Add a one-line request to `docs/TACTICAL_SQUAD_PLAN.md` §4 and flag it in the
PR body as a contract amendment, then code defensively against its absence (see Work item 3).

---

## Contracts you produce

Emit these **exactly**. Extra keys are drift; missing keys are drift.

```ts
// Squad template (ArmyDesign successor; entity + Lane D)
SquadTemplate = { name: string, type: SquadTypeKey, specialists: SpecialistKey[] /* ≤2 */, notes?: string }
```

```ts
// tacticalDeploy body (Lane D → platform → Lane C)
{ action: 'tacticalDeploy', gameId, squads: [{ name, type, figures, specialists: [], at?: { q, r } }] }
```

Per §4's trailing note, a squad **may** additionally carry `loadout` (`Loadout`) and — for mechanized
stands — `vehicle` (`VehicleInstance`); the platform validates instances against the caller's arsenal.
So the exact key set your builder emits per squad is:

```
required: name, type, figures, specialists
optional: at        — only when the commander placed it on a deploy hex
optional: loadout   — only when the Small Arms Issue step set one
optional: vehicle   — only for mechanized stands refitted in the Motor Pool step
```

`action` and `gameId` are added by the caller (`EngagementStage` → `GamePage`), **not** by you: your
`onDeploy` prop receives the squads array alone.

**Note on the neighbouring §4 line you do not emit.** §4's `tacticalOrders` body declares `action`
twice; Lane E owns the single authorised amendment renaming the second key to `orderAction`. You emit
`tacticalDeploy`, never `tacticalOrders`, so this changes nothing in your code — it is recorded here
only so you do not "fix" the same §4 line in your own PR. Two lanes amending one contract line is a
guaranteed conflict.

---

## Work items

Every minimum below is a number. All of them are checkable.

### 1. Create the pure rules module first — `src/components/game/tactical/squad/builderRules.js`

No JSX, no React, no `base44` import. This is the ONLY place builder logic lives; components call it.
It is what `test/squad-builder.test.js` imports, and it is why your acceptance criteria are runnable.
It exports at least these **13** functions/constants:

1. `MAX_SQUADS` — the roster ceiling, **24**. Prefer `import { MAX_SQUADS } from "@/lib/tactical/data"`
   and re-export it. Only if Lane A did not export it: define it here **exactly once**
   (`export const MAX_SQUADS = 24; // source of truth: tacticalEngine.ts MAX_SQUADS`) and request the
   export in your PR body. It is never retyped in a component or inside a string.
2. `MIN_SQUADS_TO_SEAL` = **1**.
3. `SPECIALIST_SLOTS` = **2**.
4. `MAX_UPGRADES_PER_SQUAD` = **2** (Lane F: "max 2 per squad").
5. `figureBounds(typeKey, specialists)` → `{ min, max }`. `max` = `SQUAD_TYPES[typeKey].figures`, plus
   any numeric `mods.figures` carried by the attached specialists; `min` = **1**. If Lane F ships
   explicit `minFigures`/`maxFigures` on the row, those win. Never hard-code a per-type number.
6. `poolRemaining(myPool, squads)` → `{ [regimentKey]: figuresLeft }`. A squad draws
   `figures` from `SQUAD_TYPES[type].from`, **not** from its own key (riflemen-derived types —
   assault, gunners, scouts, mortars, pioneers and Lane F's additions — all draw rifle figures).
7. `validateSquad(squad, ctx)` → `{ ok: bool, errors: string[] }`.
8. `validateRoster(squads, ctx)` → `{ ok, errors, canSeal }`.
9. `canSeal(squads, ctx)` → bool — false at **0** fielded squads, false above **24**, false when any
   regiment's remaining figures are negative, false when any squad fails `validateSquad`.
10. `legalMods(pattern, currentMods)` → `ModKey[]` — a mod is legal iff its `slot` is in
    `pattern.slots`, the pattern's `class` is in the mod's `appliesTo`, and no mod already occupies
    that slot (**at most 1 mod per `ModSlot`**; total mods ≤ `pattern.slots.length`).
11. `legalHardpoints(chassis, index)` → `WeaponPatternKey[]` — the pattern's `class` must be in
    `chassis.hull.hardpoints[index].allowed`; hardpoint count is exactly
    `chassis.hull.hardpoints.length`, capped by `MOUNTS[mount].hardpoints`. **At most 1 vehicle mod per
    `VehicleSlot`, except `hardpoint`.**
12. `placementErrors(squads, field, myRole)` → `string[]` — a squad's `at` must be a member of
    `field.deploy[myRole]`, and **no two squads may share a hex**.
13. `toDeployPayload(squads)` → the §4 squads array, with **exactly** the key set listed under
    "Contracts you produce" — it strips every local-only field (client ids, ui flags, draft names).
    Also `templateToSquad(template)` → a legal squad at the type's default figure count.

Every error string it returns is in Ministry voice, non-empty, and starts with a capital letter.

### 2. Rewrite the deployment screen as a **4-step** builder

`DeploymentScreen.jsx` becomes a thin orchestrator (≤ 60 lines) over a step rail with exactly these
four steps plus the seal:

| # | Step | Ministry header |
| --- | --- | --- |
| 1 | Order of Battle | `Form 9-D · Order of Battle` |
| 2 | Small Arms Issue | `Form 11-A · Small Arms Issue` |
| 3 | Motor Pool Refit | `Form 14-M · Motor Pool Refit` |
| 4 | Deploy Zone | `Form 9-D/A · Ground Assignment` |
| — | Seal | button: `Seal the Order of Battle` |

Steps 2 and 3 are **skippable** and are disabled with an explanatory line when they have no subject
(step 2 when no squad has an infantry-class loadout slot; step 3 when no mechanized stand is on the
roster). Skipping emits no `loadout`/`vehicle` keys — never an empty object.

### 3. Degrade cleanly when a catalog export is absent

Each of the three data sources is read through **one** accessor in `builderRules.js`
(e.g. `armsCatalog()`, `motorCatalog()`) that returns `null` when the export is missing. A `null`
catalog disables its step with the Ministry line "The catalogue has not reached this desk." and the
builder still seals a legal payload. This is the only permitted fallback — never a local copy of the
data.

### 4. Author the `squad/*` components — one per file, each ≤ 60 lines

Create exactly these **19** files under `src/components/game/tactical/squad/` — **17** components and
**2** plain modules. Anything that grows past 60 lines is split, not shrunk by removing whitespace.

```
builderRules.js       pure logic (Work item 1) — no JSX
templateStore.js      SquadTemplate stub store (Work item 7) — no JSX
DeployStepper.jsx     the 4-step rail + step gating
SquadCard.jsx         one squad: name, type, figures, 2 specialist slots, pts, stats, actions, strike
SquadTypePicker.jsx   SQUAD_TYPES grid — label, tier, from-regiment, pts; locked rows disabled with reason
FigureStepper.jsx     bounded figure count; +/- buttons AND +/- keys; clamps to figureBounds()
SpecialistSlot.jsx    one of the 2 slots; drop target for a staff chit; keyboard cycles eligible chits
StaffPool.jsx         "Staff Pool" rack of draggable SPECIALISTS chits
SquadStats.jsx        the derived grid (Work item 5)
SquadActionTags.jsx   cq-tag list gated by deriveSquad().actions
PoolLedger.jsx        figures-per-regiment reserve ledger, replaces the company count
TemplateRack.jsx      one-click SquadTemplate presets
SmallArmsIssue.jsx    step 2 shell — squad list + selected squad's three weapon slips
WeaponSlip.jsx        one WeaponInstance row: pattern, maker, calibre, quality, quirks, mod chips
ModKitRack.jsx        draggable Modification chits, filtered by legalMods()
MotorPoolRefit.jsx    step 3 shell — chassis / powerplant / armour package / suspension / mount
FacingShield.jsx      the 4-facing armour readout from deriveMechanized().facings
DeployPlacement.jsx   renderField render-prop + HexListPicker fallback
HexListPicker.jsx     keyboard-first legal-deploy-hex list (the fallback until Lane E merges)
```

Create every one of them. `HexListPicker.jsx` is the fallback pair of `DeployPlacement.jsx` and is not
optional — it is what makes drag interaction #5 keyboard-reachable before Lane E merges.

### 5. The derived stat grid shows exactly **9** cells

`SquadStats.jsx` renders, in this order, in the Service Dossier grid style already used by
`FormationStats.jsx`: `FIGURES`, `MELEE`, `RANGED`, `RANGE`, `ARMOR`, `SPEED`, `MORALE`, `INITIATIVE`,
`PTS`. Every value comes from `deriveSquad(squad)`. Each cell is wrapped in the existing
`@/components/ui/CommandTip` with a one-sentence Ministry explanation. No cell computes anything.

### 6. Keyboard fallback for all **5** drag interactions

§3's acceptance is absolute: *keyboard fallback (+/−) for every drag interaction*. There are five, and
each needs a focusable control (`tabIndex={0}`), a visible focus ring, and an `aria-label`:

| # | Drag | Keyboard equivalent |
| --- | --- | --- |
| 1 | figures from the reserve → a squad card | `+` / `-` (and `ArrowUp`/`ArrowDown`) on `FigureStepper` |
| 2 | specialist chit → `SpecialistSlot` | `+` / `-` cycles eligible specialists; `Delete`/`Backspace` clears |
| 3 | mod kit chit → a weapon slot | `+` / `-` cycles `legalMods()`; `Delete` clears |
| 4 | refit part chit → a vehicle slot | `+` / `-` cycles the legal parts for that `VehicleSlot`; `Delete` clears |
| 5 | squad token → a deploy hex | `+` / `-` cycles `field.deploy[myRole]`; `Enter` confirms; `Delete` unplaces |

Every one of these must work with the pointer **and** with the keyboard, and `builderRules` must be the
thing both paths call (so the test exercises the same code the keys do).

### 7. `SquadTemplate` register — stubbed, additive, non-destructive

- `templateStore.js` exposes `listTemplates()`, `saveTemplate(t)`, `deleteTemplate(id)` over
  `localStorage` key `rl.squadTemplates.v1`, guarded in `try/catch` (a blocked/absent store must render
  an empty register, never throw). A single `const USE_ENTITY = false;` marks the seam so the platform
  lane flips one constant when the `SquadTemplate` entity lands. **Do not write the new shape to
  `base44.entities.ArmyDesign` — it would corrupt live records.**
- Records validate against the §4 `SquadTemplate` shape before they are stored: `specialists.length ≤ 2`,
  `type` present in `SQUAD_TYPES`.
- `src/pages/ArmyDesigner.jsx` gains a **second** register, "Squad Templates", alongside the existing
  "Registered Designs". The existing doctrine-pattern path (`ArmyDesign` entity, `SLOT_KEYS`,
  `DESIGN_SLOTS`, `compileDesign`, `DesignCard`, `DesignStats`, `SlotPicker`) keeps working **unchanged
  in behaviour** — existing catalog keys are never renamed or removed, live saves reference them. If
  Lane F grew `DESIGN_SLOTS` to ≥6 options per slot, `SlotPicker` must render them all without a code
  change (it already iterates `Object.entries`) — verify, do not rewrite.
- Add `src/components/army/TemplateCard.jsx` and `src/components/army/TemplateForm.jsx` (owned:
  `src/components/army/*`), each ≤ 60 lines. `ArmyDesigner.jsx` stays ≤ 120 lines by delegating.

### 8. Reserve rack becomes a figures ledger

`ReserveRack.jsx` + `PoolLedger.jsx`: the rack shows **figures per regiment** (`myPool` is figures, not
companies — §4), with the figures↔companies ratio shown as "N figures · M companies" using Lane A's
`FIGURES_PER_COMPANY`. The existing footer copy about retrained rifle companies is rewritten for
squads: derived types draw from their `from` regiment.

### 9. `TroopStack.jsx` / `FormationSlip.jsx` / `FormationStats.jsx`

These three survive as the **chit**, the **card frame** and the **stat grid** primitives, re-pointed at
squads. Keep their `cq-*` styling. If a file's role is fully absorbed by a `squad/*` component, leave it
as a thin re-export rather than deleting it — another lane's import must not break. Do not delete an
owned file without saying so in the PR body.

### 10. Copy — Ministry voice, every string

Every user-visible string is in-world military-ministry English (`CLAUDE.md` § Design System, drift
guard 5). Use these for the error paths so the register is consistent:

- 25th squad: `The Ministry will not issue a twenty-fifth squad. Strike one from the roster.`
- pool exhausted: `The reserve is spent — no <regiment> remain to draw.`
- third specialist: `Two staff attachments per squad. The third has no billet.`
- seal with none: `No squad has taken the field. The Ministry declines an empty order.`
- occupied hex: `That ground is already assigned. Choose another.`
- outside the zone: `That hex lies beyond your line of departure.`
- absent catalogue: `The catalogue has not reached this desk.`

The `24` in the first string is written as a **word** ("twenty-fifth") precisely so no digit is retyped;
anywhere a digit must appear, interpolate `MAX_SQUADS`.

### 11. Tests — `test/squad-builder.test.js`, at least **16** named cases

Vitest runs in `environment: "node"` with **no jsdom and no testing-library**, and you may not add
packages. So the test imports `builderRules.js` (and `templateStore.js` with a `globalThis.localStorage`
stub) — **never a `.jsx` file**. Write at least these 16 `it(...)` cases:

1. `rejects a twenty-fifth squad` — `canSeal` false at `MAX_SQUADS + 1`.
2. `accepts a roster of exactly MAX_SQUADS` — true at 24.
3. `refuses to seal an empty order of battle` — false at 0.
4. `refuses to seal a squad with no figures` — false when any squad has `figures === 0`.
5. `never draws more figures than the column holds` — `poolRemaining` never negative for a legal roster; a squad one figure over is rejected.
6. `draws a derived type from its parent regiment` — a riflemen-derived type consumes `riflemen`, not its own key.
7. `rejects a third specialist` — `validateSquad` errors at 3.
8. `rejects a duplicate specialist` — the same key twice errors.
9. `bounds the figure count to the type establishment` — `figureBounds` max equals the row's `figures` (plus specialist `mods.figures`), min is 1.
10. `rejects a third upgrade kit` and a kit whose `appliesTo` excludes the type.
11. `rejects a mod whose slot the pattern does not carry` and a second mod in an occupied slot.
12. `fits no more hardpoints than the chassis and mount allow` and rejects a weapon class not in `hardpoints[i].allowed`.
13. `refuses two squads on one hex` and `refuses a hex outside the deploy zone`.
14. `emits exactly the tacticalDeploy key set` — `toDeployPayload` output keys are a subset of `{name,type,figures,specialists,at,loadout,vehicle}` and a superset of `{name,type,figures,specialists}`; no client id leaks.
15. `turns a SquadTemplate into a legal squad` — `templateToSquad` round-trips the §4 shape at default figures.
16. `speaks in Ministry voice` — every string returned by `validateSquad`/`validateRoster`/`placementErrors` is non-empty, starts with an uppercase letter, and contains none of `undefined`, `null`, `NaN`, `TODO`, `Error:`.

Plus, conditionally: if `test/fixtures/tactical-state.json` exists (Lane C produces it in P4), a 17th
case asserts the builder accepts that recorded `myPool` and `field` unchanged. Gate it with
`(existsSync(p) ? it : it.skip)` so the suite is green either way.

---

## Acceptance criteria

**Copied verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane D:**

> Acceptance: cannot exceed pool; cannot exceed 24 squads; cannot seal with 0 squads; all copy in
> Ministry voice; keyboard fallback (+/−) for every drag interaction.

**And, verbatim, what §3 says Lane D delivers:**

> - Deployment screen evolves: reserve rack shows **figures per regiment**; a formation slip becomes a
>   **squad card** — type picker, figure count (bounded by type default ± sapper/commissar rules), two
>   specialist slots (drag specialist chits from a "Staff Pool" rack), `pts` readout, derived stat grid
>   (melee / ranged / range / armor / speed / morale / initiative) in the Service Dossier grid style,
>   action tags.
> - Deploy-zone placement: a mini field preview (Lane E's `FieldCanvas` in `placement` mode) where
>   squads are dragged onto deploy hexes.
> - Army Design Bureau: `ArmyDesign` templates become **squad templates** (type + specialists + name).
>   Templates appear as one-click presets in the deployment reserve. Entity schema change is
>   platform-owned; lane D codes against §4's `SquadTemplate` shape and stubs with local state until the
>   entity lands.

**Lane-specific checks (each is a command in Definition of done):**

- D1 `npm test` green, with ≥16 named cases in `test/squad-builder.test.js`.
- D2 `npm run lint` clean; `npm run typecheck` clean.
- D3 Every `.jsx` under `src/components/game/tactical/` and `src/components/army/` is ≤ 60 lines;
  `src/pages/ArmyDesigner.jsx` ≤ 120 lines.
- D4 Zero hex colours in owned files.
- D5 Zero `${` inside a Tailwind class token in owned files.
- D6 Zero relative imports in owned `src/` files — `@/` only.
- D7 Zero retyped constants: the literals `24`, `15`, `11`, `9x7`, `80128`, and any figure/pts number
  appear in **no** owned `.jsx` file; they come from `builderRules.js` or the `src/lib` catalogs.
- D8 `git status --porcelain` shows no modification to `package.json`, `package-lock.json`,
  `base44/**`, `src/lib/**`, `src/index.css`, or any file outside the Owned files list (the single
  permitted exception being the §3 `Owns:` line in `docs/TACTICAL_SQUAD_PLAN.md`).
- D9 All five drag interactions have a keyboard path, and both paths call `builderRules.js`.
- D10 No `base44.entities` call writes the `SquadTemplate` shape.

---

## Drift guards

The §6 list, in full, as it applies to you:

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it. You
   author no table, so you must not break one: **do not edit `src/lib/tactical/data.js`**.
2. **Exported API freeze** — `tacticalEngine.ts` keeps its exported names. Not your file; do not touch.
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colours in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind
   classes must be literal strings.
5. **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only.
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from `data.js`,
   never retyped.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` and flags
   `docs/GAME_RULES.md` for the platform lane. **Lane D changes no rule numbers.** If you find yourself
   wanting to, you are in the wrong lane — request it from A/F/I/J instead.
10. **Content lanes never ship visuals** — you are not a content lane, but the same restraint applies:
    **no image files, no SVG art, no `PLATE_URLS` entries, no `imageLibrary.js` edits, no
    `UnitSprite.jsx` edits.** Existing catalog keys are never renamed or removed (live saves reference
    them).
11. **Arms granularity stays numeric and server-rolled** — you never call `rollWeapon` to *create* an
    instance for a player; you display instances the server issued. No `Math.random` in this lane.
12. **One damage model** — armour math exists only in `arms.ts`/`arms.js`. `FacingShield.jsx` renders
    `ArmourClass` labels; it computes nothing.
13. **Mechanized granularity mirrors arms** — you consume `deriveMechanized(stand)` output plus
    `facings`, never a raw bag of parts.

**Plus the environment rules (non-negotiable):**

- **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store; npm silently deletes the symlink and reifies a real
  directory (`npm warn reify Removing non-directory .../node_modules`), which orphans the store, drags
  ~1.15 GiB back inside the encrypted vault, and cannot be undone by re-running anything. If
  `node_modules` is missing in your worktree, **stop and tell the orchestrator** — do not install.
- **Never edit `package.json` or `package-lock.json`** (drift guard 3).
- Never run a Base44 deploy, `base44 dev`, or `test_backend_function`. Backend functions run only on
  Base44; nothing under `base44/` compiles locally.
- Never edit another lane's files. **If a contract must change, edit
  `docs/TACTICAL_SQUAD_PLAN.md` §4 FIRST and say so explicitly in the PR body** under a heading
  "Contract amendments". The one §3 edit this brief authorises (adding your test path to Lane D's
  `Owns:` line) is declared the same way.
- Every table exported from a `base44/shared/*.ts` file must be a **pure data literal**
  (`export const NAME = { ... }` / `[ ... ]` — no spreads, no computed keys, no function calls, no
  template literals in keys), because the mirror tests lift it **textually** with
  `test/helpers/extract-const.js` and evaluate it. A computed table cannot be mirror-tested. Lane D
  authors no such table — but if you ever propose one in a contract amendment, it must obey this.

---

## Definition of done

Run these, in this order, from the worktree root. Green means what is written beside each.

```bash
# 1. the suite — includes your new test file
npm test
#    → all files pass; test/squad-builder.test.js reports >= 16 passing cases

# 2. lint + types (pre-push runs both)
npm run lint
#    → no output
npm run typecheck
#    → no output
npm run rules:check
#    → rules-mirror + combat-math green (you changed no rules; this proves it)

# 3. the rules-guard hook, exactly as the orchestrator will run it
bash .claude/hooks/rules-guard.sh < /dev/null
#    → exits 0, prints nothing (you touched no mirrored rules file)

# 4. D3 — component size
find src/components/game/tactical src/components/army -name '*.jsx' -print0 \
  | xargs -0 wc -l | awk '$2 != "total" && $1 > 60 { print; bad=1 } END { exit bad?1:0 }'
#    → no output, exit 0
wc -l src/pages/ArmyDesigner.jsx
#    → <= 120

# 5. D4 — no hex colours
grep -rnE '#[0-9a-fA-F]{3,8}\b' src/components/game/tactical src/components/army src/pages/ArmyDesigner.jsx
#    → no matches (exit 1)

# 6. D5 — no interpolated Tailwind tokens
grep -rnE 'className=\{`[^`]*\$\{[^}]*\}[a-z-]' src/components/game/tactical src/components/army src/pages/ArmyDesigner.jsx
#    → no matches. (A whole conditional class string is fine; an interpolation INSIDE a token is not.)

# 7. D6 — @/ imports only
grep -rnE 'from "(\.\./|\./)' src/components/game/tactical src/components/army src/pages/ArmyDesigner.jsx
#    → no matches

# 8. D7 — no retyped constants in JSX
find src/components/game/tactical src/components/army -name '*.jsx' -print0 \
  | xargs -0 grep -nE '\b(24|15|11)\b'
#    → no match that is a balance constant. Tailwind sizing (w-24, p-1.5) and array indices are fine;
#      a roster ceiling, a grid dimension or a stat number is not.
grep -rn 'MAX_SQUADS' src/components/game/tactical/squad/builderRules.js
#    → exactly one definition or re-export

# 9. D8 — nothing outside the lane changed
git status --porcelain
#    → only files from the Owned files list, plus docs/TACTICAL_SQUAD_PLAN.md (one §3 line)

# 10. D10 — the template stub never writes the new shape to the entity
grep -rn 'entities.ArmyDesign' src/pages/ArmyDesigner.jsx src/components/army src/components/game/tactical
#    → only the legacy doctrine-pattern calls; templateStore.js contains none
```

Then, per §7 (Worktree & git protocol):

- Work in your own worktree on branch `feat/tactical-d`. (`scripts/agent-worktree.sh` defaults to a
  `claude/<topic>` branch name; §7's `feat/tactical-<lane>` is the contract and wins — the orchestrator
  owns creating and naming the worktree.)
- Push to `origin/feat/tactical-d` and open a PR against `main`.
- PR title: `tactical(d): squad builder — Order of Battle, Small Arms Issue, Motor Pool Refit`
- PR body lists, as separate headings: **Contract sections touched** (§3 Lane D `Owns:` line;
  any §4 amendment), **Tests added** (the 16 case names), **Required wiring outside Lane D**
  (the `EngagementStage.jsx` one-liner and the `renderField` prop), and **Missing exports requested**
  from Lanes A/F/I/J, if any.
- Never merge your own branch. Never rebase another lane's branch. **If your orchestrator tells you it
  owns git state, that overrides this section: leave your work uncommitted in the working tree and run
  no `git commit`, `push`, `checkout`, `branch` or `merge`.**

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

