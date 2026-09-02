# Lane C — Engine

> This brief is your complete instruction set. Besides it, read exactly four documents, in this order:
> `CLAUDE.md` → `AGENTS.md` → `docs/VISION.md` → `docs/TACTICAL_SQUAD_PLAN.md` (§3 lanes/ownership,
> §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol). Then read your owned files and
> `test/helpers/extract-const.js`. Nothing else is required context, and nothing else may be edited.
>
> Repository root (absolute): `/home/blae/Documents/ROOT/Code/rust-legions`
> Your phase: **P2 — Engine**, which runs *after* A and B merge and *before* the platform lane wires it.

---

## Goal

At the end of this lane, `base44/shared/tacticalEngine.ts` is a **squad-based, deterministic, server-authoritative
state machine** on a 15×11 procedurally generated field: it builds the field through Lane B's `generateField`,
carves squads from figure pools through Lane A's `deriveSquad`, resolves orders with movement cost, line of sight,
range, cover, morale, suppression, rout, deployables and figure erosion, and resolves **every** damaging hit through
`resolveHit` imported from `base44/shared/arms.ts` — including a **facing** selection for stands that carry
`facings`. The eight exported function names `gameEngine` already imports keep working, so the existing
`runAutoTurns` seam in `base44/functions/gameEngine/entry.ts` does not break while the platform lane catches up.
`test/tactical-engine.test.js` proves all of it, and the lane also commits
`test/fixtures/tactical-state.json` — a recorded `getState`-shaped tactical payload produced by the scripted-battle
test, which Lanes D and E build their UI against.

---

## Owned files

Copied from §3 ("Lane C — Engine"), plus the fixture this lane is additionally responsible for:

1. `/home/blae/Documents/ROOT/Code/rust-legions/base44/shared/tacticalEngine.ts` — rewrite
2. `/home/blae/Documents/ROOT/Code/rust-legions/test/tactical-engine.test.js` — new file
3. `/home/blae/Documents/ROOT/Code/rust-legions/test/fixtures/tactical-state.json` — new file (create the
   `test/fixtures/` directory; it does not exist yet)

**You may not edit any other file.** Specifically and non-exhaustively, these are other lanes' or the platform's:

- `base44/shared/tactical.ts`, `src/lib/tactical/data.js`, `test/tactical-mirror.test.js`,
  `docs/COMBAT_DESIGN.md` — **Lane A**
- `base44/shared/tacticalField.ts`, `src/lib/tactical/field.js`, `test/tactical-field.test.js` — **Lane B**
- everything under `src/components/game/tactical/**`, `src/pages/ArmyDesigner.jsx`, `src/components/army/**` — **Lane D**
- everything under `src/components/game/tactical/arena/**`, `src/index.css`, `UnitSprite.jsx` — **Lane E**
- `base44/shared/arms.ts`, `src/lib/arms.js`, `docs/ARMS_CATALOGUE.md` — **Lane I**
- `base44/shared/motorPool.ts`, `src/lib/motorPool.js`, `docs/MOTOR_POOL.md` — **Lane J**
- `base44/functions/gameEngine/entry.ts`, `base44/entities/*.jsonc`, `docs/GAME_RULES.md`,
  `docs/ARCHITECTURE.md` — **platform lane (Base44 chat session, not a worktree)**
- `package.json`, `package-lock.json` — **nobody** (drift guard 3)

The **one** exception: `docs/TACTICAL_SQUAD_PLAN.md` **§4 only**, and only under the amendment protocol in
Work item 3 below. If you touch §4 you say so in the PR body.

### If a dependency is missing

`tacticalEngine.ts` imports from Lane A (`./tactical.ts`), Lane B (`./tacticalField.ts`), Lane I (`./arms.ts`)
and Lane J (`./motorPool.ts`). **Merge order (§5) puts all four ahead of you, and here is the derivation
so you can check it rather than trust it:** the systems track is `A/B → C → platform → D/E`, so A and B
precede you; the content track (`C1`) runs **in parallel with P1** and orders itself `I → J → F → H`, so
Lane I's `arms.ts` and Lane J's `motorPool.ts` also land before P2 opens. §5 states the I-before-A
dependency explicitly (*"I's damage-model tables merge before A finalises combat resolution"*), which puts
Lane I ahead of Lane A and therefore far ahead of you. Start with
`git fetch origin && git rebase origin/main` and confirm every symbol in "Contracts you consume" resolves.
**If one does not exist yet: STOP and report it to the orchestrator.** Do not author it in another lane's file,
do not re-implement it locally, and above all do not write your own penetration or armour math (drift guard 12).

---

## Contracts you consume

### From Lane D and Lane E, via the platform lane (§4, verbatim)

```ts
// tacticalDeploy body (Lane D → platform → Lane C)
{ action: 'tacticalDeploy', gameId, squads: [{ name, type, figures, specialists: [], at?: { q, r } }] }

// tacticalOrders body (Lane E → platform → Lane C)
{ action: 'tacticalOrders', gameId, squadId, moveTo?: { q, r }, action: SquadActionKey, target?: { squadId } | { q, r } }

// tacticalAuto body (Lane E → platform)
{ action: 'tacticalAuto', gameId }
```

**⚠ The `tacticalOrders` line above is a known defect in §4 and Lane E owns the fix — do not file it
yourself.** As written the object literal declares **`action` twice**: the second key wins in
JavaScript, so the shape dispatches to a `SquadActionKey` rather than to `"tacticalOrders"` and the
request cannot route. Lane E's brief authorises exactly one amendment renaming the second key to
**`orderAction`**, and Lane E emits `orderAction`. Consequences for you, all of them:

- **Never edit that §4 line.** Two lanes amending the same line is a guaranteed merge conflict on the
  contract document, and Lane E is the lane that emits the payload.
- The platform maps the body onto your positional arguments, so **your `resolveOrders(t, squadId,
  moveTo, action, target)` signature is unaffected** — it is a body key that is renamed, not a
  parameter. Keep the signature exactly as specified in Work item 10.
- In the hand-off note of Work item 20, say that `gameEngine`'s `tacticalOrders` handler must read
  **`body.orderAction`** (today it forwards `body.action`, which is the literal dispatch string
  `"tacticalOrders"`, into `resolveOrders` — a live defect). Lane E flags the same thing; two flags on
  a platform-owned file are cheap, two edits to §4 are not.
- If the orchestrator has ruled on this differently by the time you start, the ruling wins.

`squads[]` arrives as the third argument of `submitFormations(t, side, squads)`. `squadId` / `moveTo` /
`action` / `target` arrive as arguments 2–5 of `resolveOrders`. `tacticalAuto` is a platform action that drives
your `autoOrders` + `resolveOrders` (see Work item 15).

### From Lane A — `base44/shared/tactical.ts` (§4 content contracts, verbatim)

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed? }, blurb }
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
```

Also from §4: *"Regiments ↔ figures: `1 company = FIGURES_PER_COMPANY` (Lane A sets; default 10 for
infantry-derived, 1 for crawler/artillery/fighter — vehicles are single-figure squads). `toRegiments` rounds
**down** so battles never create companies."*

You call Lane A's `SQUAD_TYPES`, `SPECIALISTS`, `SQUAD_ACTIONS`, `DEPLOYABLES`, `FIGURES_PER_COMPANY`,
`deriveSquad(squad)` → `{ figures, melee, ranged, range, armor, speed, morale, initiative, actions[], pts }`,
`poolCost` and `toRegiments`. **You never recompute a derived stat yourself** — every stat you read off a squad
comes from `deriveSquad`.

`SQUAD_ACTIONS` keys (§3 Lane A): `fire, assault (melee), hold, grenade (AoE r1), mortar_barrage (AoE r1,
indirect), suppress, smoke, build_<deployable>, rally, entrench`; each carries `requires` (type/specialist),
`dmg`, `range` override, `aoe`, `moraleHit`, `noMove`, `turns`. `DEPLOYABLES` are `foxhole, trench, bunker,
emplacement` with `cover`, `blocksLOS`, `moveCost`, `buildTurns`, `infantryOnly`. Read the gating off those
fields — do not hard-code an action list in the engine.

### From Lane B — `base44/shared/tacticalField.ts` (§3, verbatim)

```
generateField({ seed, nodeKind, weather, fortBonus, w=15, h=11 })
  → { w, h, tiles: { "q,r": { terrain, cover, elev, blocksLOS, moveCost, work? } },
      deploy: { attacker: [...], defender: [...] } }
lineOfSight(field, a, b), hexLine, hexRange, neighbors, pathCost   // pathCost = A* over moveCost
```

### From Lane I — `base44/shared/arms.ts` (§4, verbatim). **This is the only armour math in the codebase.**

```ts
WeaponBase     = { accuracy, rateOfFire, damage, armorPen, range, reliability, weight, damageType: DamageType, aoe: { radius, falloff } | null }
DamageType     = 'kinetic'|'explosive'|'shaped'|'incendiary'|'fragmentation'|'concussive'|'chemical'
ArmourClassKey = 'none'|'soft'|'light'|'medium'|'heavy'|'superheavy'|'fortified'
ArmourClass    = { key: ArmourClassKey, armourValue: number, sealed: boolean, blurb }
PEN_TABLE      = Array<{ minDelta: number, mult: number }>      // armorPen − armourValue → effectiveness; a mult 0 row is mandatory
TYPE_MATRIX    = { [DamageType]: { [ArmourClassKey]: number } } // damage-type vs armour-class multiplier
// resolveHit({ weapon: WeaponBase, target: ArmourClass }) → { effective: number, suppressOnly: boolean } — the only armour math; Lane A imports it
```

Also consumed: `deriveLoadout(squad)` → `Partial<SquadType values>` (Lane A folds it into `deriveSquad`; the
engine never inspects a `WeaponInstance` — drift guard 11).

### From Lane J — `base44/shared/motorPool.ts` (§4, verbatim)

```ts
Facings         = { front: ArmourClassKey, side: ArmourClassKey, rear: ArmourClassKey, top: ArmourClassKey }
// Mechanized stand rows carry `vehicle: VehicleInstance`; deriveMechanized(stand) → Partial<SquadType values> & { facings: Facings }
// Engine rule (Lane A/C): a hit resolves via resolveHit against the struck facing — rear if the attacker occupies a hex behind the stand's facing
```

### From `gameEngine` (already shipped — the seam you must not break)

`base44/functions/gameEngine/entry.ts` imports, today, exactly:

```js
import {
  createTactical, submitFormations, autoFormations, autoOrders, resolveOrders,
  activeFormation, battleResult, tacticalView,
} from '../../shared/tacticalEngine.ts';
```

and calls them like this (do not edit this file; read it to know what must keep working):

```js
b.tactical = createTactical(b.attacker.units, b.defender.units);          // TWO args today
submitFormations(b.tactical, 'defender', autoFormations(b.tactical.pools.defender));
const f = activeFormation(t);
const o = autoOrders(t, f);
resolveOrders(t, f.id, o.moveTo, o.actionKey, o.targetId);               // targetId is a BARE STRING today
const r = battleResult(t);                                               // { attackerWon, attackerUnits, defenderUnits }
tacticalView(ab.tactical, myRole);
```

---

## Contracts you produce

### 1. `tacticalView(t, myRole)` → `getState → battle.tactical` (§4, verbatim — emit these keys exactly)

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

Key counts, so there is nothing to interpret: **13** top-level keys; `deployed` **2**; `field` **4**; each tile
**5** required + `work` optional (**6**); each `squads[]` row **20**; `status` **3** required + `building`
optional (**4**); `fx` **8** always-present + `targetId`, `at`, `moraleResult` optional (**11**).
The old `grid` key is **gone** (replaced by `field`); the old `formations` key is **gone** (replaced by
`squads`); the old `fx.attackerId` is **renamed** `fx.actorId`.

### 2. `battleResult(t)` (§4, verbatim — unchanged, exactly 3 keys)

```ts
{ attackerWon: bool, attackerUnits: Regiments, defenderUnits: Regiments }
```

`Regiments` = an object over Lane A's `COLUMN_KEYS` (`riflemen, crawler, artillery, fighter`) with
**non-negative integers**, produced by Lane A's `toRegiments` (rounds down). `battleResult` returns `null`
while the fight continues.

### 3. `test/fixtures/tactical-state.json`

A single JSON object that **is** the §4 payload above, byte-for-byte the value `tacticalView(t, 'attacker')`
returns at a chosen point in the scripted-battle test. Lanes D and E render against it and have no other source
of truth for the shape, so it is a contract, not a test artifact. Requirements, all checkable:

- exactly the §4 key set at every level (a test asserts the key lists — Work item 17)
- `status: 'fighting'`, `myRole: 'attacker'`, `round >= 2`
- `deployed: { attacker: true, defender: true }`, `myPool` non-null (figures, not companies)
- `field.w === 15`, `field.h === 11`, `field.deploy.attacker` and `field.deploy.defender` both non-empty
- **≥ 8 squads per side** still on the field, of **≥ 4 distinct `type` values**, including **≥ 1 mechanized
  stand per side**
- at least **1** squad with `status.suppressed > 0`, **1** with `status.routed` truthy, **1** with
  `status.building`, and at least **1** field tile carrying a completed `work`
- `fx` non-null, `los` non-empty, `log.length` ≤ **18**
- written with `JSON.stringify(payload, null, 2)` + a trailing newline, and committed

---

## Work items

Numbered and checkable. Every minimum is a number.

1. **Set up the worktree without npm.** `scripts/agent-worktree.sh` prints `npm ci` in its hint — **ignore that
   line, it is wrong for this environment.** Create the worktree, then link dependencies:
   `ln -s /home/blae/.node-modules-store/rust-legions/node_modules <worktree>/node_modules`.
   Never run `npm install` or `npm ci` (see Drift guards).
2. **Rebase on `origin/main` and verify every consumed symbol resolves** (see "If a dependency is missing").
3. **Amend §4 FIRST if — and only if — you need a field it does not define.** You will almost certainly need
   two: `facing` on a mechanized `squads[]` row (Lane E must draw it, and the rear-hit rule is unverifiable
   without it) and `armour: ArmourClassKey` on an infantry row (§4 already says *"Every stand row gains
   `armour: ArmourClassKey`"* for the data model, but the `squads[]` view row does not list it). The protocol:
   edit `docs/TACTICAL_SQUAD_PLAN.md` §4 in the **same PR, before** writing the code, keep the edit minimal
   (added optional keys only — never remove or rename an existing key), and list every §4 line you touched in
   the PR body. The fixture then matches the amended §4 and the key-set test asserts the amended list.
4. **Rewrite `tacticalEngine.ts` header constants.** Export `ROUND_LIMIT = 20`, `MAX_SQUADS = 24`,
   `GRID = { w: 15, h: 11 }` (default field size; the authoritative size is always `t.field.w/h`), and
   `DEFAULT_FIELD_OPTS = { seed: 1, nodeKind: 'crossroads', weather: 'clear', fortBonus: 0 }`. Keep the file
   **plain ESM JavaScript in a `.ts` file** matching the existing style: relative imports carry an explicit
   `.ts` extension (Deno requires it), no `npm:` imports, no type annotations, no module-top-level `await` or
   `throw`.
5. **Make the engine deterministic. There is no `Math.random` anywhere in this file — a test greps for it.**
   Copy `mulberry32` into `tacticalEngine.ts` as a private local function (the canonical copy is
   `src/lib/macro/worlds.js:10`; **copy it, never import it** — `base44/shared/` must not import from `src/`).
   Store `t.seed` (from `fieldOpts.seed`) and an integer `t.rolls` on the battle object; every random draw is
   `mulberry32(t.seed + t.rolls++)()`, so replay from the same seed and the same order sequence is exact.
   Squad ids are deterministic too: replace the current `Math.random().toString(36)` id with a counter
   (`t.nextId`), e.g. `a1`…`a24` / `d1`…`d24`.
6. **`createTactical(attackerUnits, defenderUnits, fieldOpts)`** — third argument optional, defaulting to
   `DEFAULT_FIELD_OPTS` so the shipped two-argument call site in `gameEngine` keeps working. It builds the
   field with Lane B's `generateField({ seed, nodeKind, weather, fortBonus, w: 15, h: 11 })`, stores it at
   `t.field`, and converts the incoming **regiment** pools to **figure** pools with Lane A's
   `FIGURES_PER_COMPANY`. It initialises `status: 'deploy'`, `round: 1`, `roundLimit: ROUND_LIMIT`,
   `queue: []`, `qIndex: 0`, `squads: []`, `deployed: { attacker: false, defender: false }`, `log: [...]`,
   `fx: null`, `seed`, `rolls: 0`, `nextId: 0`.
7. **`submitFormations(t, side, squads)`** — returns an error **string** on rejection and `null` on success
   (unchanged convention). Validates each `{ name, type, figures, specialists[] }` row: `type` exists in
   `SQUAD_TYPES`; `figures` is a positive integer within the type's allowed band; `specialists.length <= 2`
   and each key exists in `SPECIALISTS`; the whole submission costs no more than the side's figure pool via
   Lane A's `poolCost`. Hard limits: **at least 1** squad, **at most `MAX_SQUADS` = 24**. Placement: a row's
   optional `at: { q, r }` is honoured when it is inside that side's `field.deploy[side]` zone, is not a
   blocker and is not already occupied; otherwise the squad takes the first free deploy hex. When both sides
   have filed, `status` becomes `'fighting'` and the initiative queue is built. Every rejection message is in
   Ministry voice.
8. **`autoFormations(pool)`** — one argument (the seam calls it with one). Returns a serviceable **squad**
   list (`{ name, type, figures, specialists }`), never formations. It must produce **at least 4 and at most 24**
   squads for a non-trivial pool, spend no more than the pool, and be deterministic (no `Math.random`).
9. **`activeFormation(t)`** — keeps its exported name (drift guard 2), now returns the active **squad** object
   or `null` when not fighting.
10. **`resolveOrders(t, squadId, moveTo, action, target)`** — `target` accepts `{ squadId }`, `{ q, r }`,
    **or a bare squad-id string** (normalise at the top of the function: the shipped `gameEngine` call site
    passes a bare string, and it must keep working until the platform lane updates it). Implements, in order,
    all **13** mechanics named in §3:
    1. **movement cost** — the path is legal only if Lane B's `pathCost` from the squad's hex to `moveTo` is
       ≤ the squad's `speed`; a blocked or occupied hex is never enterable; a failed order restores the
       squad's original `q,r` so it costs nothing.
    2. **LOS + range check** — Lane B's `lineOfSight(field, actor, target)` must be true and the hex distance
       ≤ the action's `range` override or the squad's `range`, **except** for an indirect action
       (`mortar_barrage`), which needs range but not LOS.
    3. **melee vs ranged** — `assault` uses the actor's `melee` against an adjacent target; everything else
       uses `ranged`.
    4. **armor** — resolved *only* through `resolveHit` (Work item 11).
    5. **cover** — the target tile's `cover` (plus any `work`) reduces incoming effect; an `entrench`ed or
       `guard`ing squad stacks with it.
    6. **AoE** — an action with `aoe` targets a **hex** and strikes **every** stand within `radius`, friendly
       stands included, each rolled separately against its **own** armour class, damage falling off by
       `falloff` per hex of distance from the impact hex.
    7. **suppression** — a suppressed squad's output is reduced and its `status.suppressed` counts down one
       per round.
    8. **morale tests** (Work item 12).
    9. **rout movement** — a routed squad moves toward its own board edge each activation, **never fires**,
       and cannot be issued an attacking order.
    10. **deployable construction** — `build_<deployable>` sets `status.building = { work, turnsLeft }` from
        the deployable's `buildTurns` (reduced by a `sapper`'s `buildSpeed`); on completion the `work` is
        written into `t.field.tiles["q,r"].work` and the status clears.
    11. **figure erosion** — casualties remove whole figures from the target squad; a squad at 0 figures is
        removed from the field and from the queue.
    12. **medic recovery** — a squad carrying a `medic` and not adjacent to an enemy recovers exactly
        `mods.recoverPerTurn` figures per round, never above `maxFigures`.
    13. **commissar floor** — a `commissar`'s `moraleFloor` prevents `routed`: the squad loses **1 figure**
        instead and is marked `suppressed`.
    On success it writes `t.fx` (the §4 shape, `seq` incrementing), appends a Ministry-voice line to `t.log`,
    trims `t.log` to its last **60** entries, and advances the queue.
11. **Penetration is resolved ONLY via `resolveHit` imported from `arms.ts`. This is the sharpest rule in the
    lane** (drift guard 12). Every damaging hit — small arms, AoE splash, melee, artillery, aircraft —
    calls `resolveHit({ weapon, target })` and uses the returned `{ effective, suppressOnly }`. There is no
    `PEN_TABLE` lookup, no `TYPE_MATRIX` lookup, no `armorPen − armourValue` arithmetic and no ad-hoc armour
    clamp anywhere in `tacticalEngine.ts`. `effective === 0` means **zero figures lost**; if `suppressOnly` is
    true the hit still applies suppression and still forces a morale test. A rifle squad firing on a heavy
    crawler must therefore lose nothing off the crawler and may still pin its crew.
12. **Facing selection for stands that carry `facings`.** A mechanized squad (one whose `deriveMechanized`
    output supplied `facings`) carries a `facing` — an axial direction index `0..5`. It is set at deployment
    (facing the enemy edge) and updated whenever the squad moves (to the direction it moved) or fires (to the
    direction of its target). When it is struck, compute `d = (dirFromTargetToAttacker − facing + 6) % 6` and
    select the `ArmourClass` from `facings`: **`d === 0` → `front`; `d === 1` or `d === 5` → `side`;
    `d === 2`, `3` or `4` → `rear`** — i.e. **rear when the attacker occupies a hex behind the stand's facing
    hex**, exactly as §4 requires. **Indirect and air attacks (`mortar_barrage`, and any action from a
    `fighter`-class stand) resolve against `top`** regardless of position. Non-mechanized stands use their
    single `armour` class and ignore facing entirely. The chosen facing is recorded on `t.fx` only if you
    amended §4 to carry it (Work item 3); otherwise it is internal.
13. **`autoOrders(t, squad)`** — keeps its exported name and its `{ moveTo, actionKey, targetId }` return
    shape (the seam destructures exactly those three); **additionally** return `target` in the §4 object form
    so the platform can pass either. Upgrade it with the **3** behaviours §3 names: (a) **prefers cover** —
    when choosing a hex to move to, it prefers the reachable hex with the highest `cover` that keeps the
    target in range and LOS; (b) **uses AoE on clustered targets** — when ≥ 2 enemy stands sit within an AoE
    action's `radius` of one hex, it fires that action at the hex; (c) **sappers build when not engaged** — a
    squad with a `sapper` and no enemy within its `range` issues `build_<deployable>`. A **routed** squad is
    never given a firing order. `autoOrders` must be deterministic (seeded draws only).
14. **`battleResult(t)`** — signature and 3-key shape unchanged, survivors folded back through Lane A's
    `toRegiments`. It must return non-null once one side is empty **or** `t.round > t.roundLimit`, so the
    battle always terminates within `ROUND_LIMIT` rounds.
15. **Add exactly one new export for the platform's `tacticalAuto`:**
    `autoResolveRemainder(t, side, maxTurns = 200)` — loops `autoOrders` + `resolveOrders` for that side's
    squads until `battleResult(t)` is non-null or `maxTurns` activations are spent; returns the number of
    activations resolved. Additive only: the **8** frozen names stay exported and keep working. Do not add any
    other new export.
16. **`tacticalView(t, myRole)`** — emits the §4 payload above and nothing else. `actions` is populated only
    for the caller's own squads (`[]` otherwise); `los` is present only when the active squad is the caller's
    (`[]` otherwise); `myPool` is `null` when `myRole` is `null`; `log` is the last **18** lines; `queue` is
    rotated to start at the active squad, exactly as the current implementation does.
17. **Write `test/tactical-engine.test.js` with at least the following 26 cases**, each a distinct `it(...)`,
    importing the real module (`import { ... } from "../base44/shared/tacticalEngine.ts"` — shared `.ts`
    modules are plain ESM and load directly under Vitest; see `test/helpers/macro-harness.js:20-26` for the
    established idiom) and reading file text through `readRepoFile` from `test/helpers/extract-const.js`:
    1. all **8** frozen names are exported and are functions
    2. `createTactical(att, def)` with **two** arguments returns `status: 'deploy'` (legacy seam)
    3. `createTactical` is deterministic — same args twice → deep-equal state
    4. the source of `tacticalEngine.ts` contains **no** `Math.random` (assert on the text via `readRepoFile`)
    5. `submitFormations` rejects **25** squads and accepts **24**
    6. `submitFormations` rejects a submission exceeding the figure pool
    7. `submitFormations` rejects **0** squads
    8. every placed squad sits inside its own side's deploy zone, on an unblocked, unoccupied hex
    9. a client-supplied `at` inside the zone is honoured; one outside it is relocated, not accepted
    10. both sides filed → `status: 'fighting'` and `queue` is ordered by `initiative` descending
    11. `resolveOrders` rejects a move into a blocked hex and a move whose `pathCost` exceeds `speed`
    12. `resolveOrders` rejects a target out of LOS and a target out of range; `mortar_barrage` is allowed
        without LOS
    13. a routed squad never fires — `autoOrders` gives it no firing order and `resolveOrders` rejects one
    14. a light weapon against a `superheavy` facing loses the target **0** figures, and `suppressOnly` still
        applies suppression and forces a morale test
    15. the same attack resolves against `rear` when the attacker is behind the stand's facing and `front`
        when in front, and the rear result is ≥ the front result
    16. an AoE action strikes **every** stand within `radius`, with falloff per hex, each against its own
        armour class
    17. a failed morale test sets `suppressed`; a critical failure sets `routed`; a `commissar` converts the
        rout into **−1 figure** and `suppressed`
    18. a `medic` recovers exactly `recoverPerTurn` figures while unengaged and never exceeds `maxFigures`
    19. `build_<deployable>` counts `turnsLeft` down over `buildTurns` rounds and then writes `work` into the
        field tile
    20. a scripted **6-round** battle replays identically twice (deep-equal final state from the same seed)
    21. the same scripted battle run to completion terminates with `round <= ROUND_LIMIT + 1` and a non-null
        `battleResult`
    22. `battleResult` has exactly **3** keys and both unit objects are `COLUMN_KEYS` with non-negative
        integers
    23. `tacticalView` emits **exactly** the §4 key set — assert the sorted key lists at the top level, on a
        `squads[]` row, on `status`, on `field`, on a tile and on `fx`
    24. `tacticalView` hides `actions` on the opponent's squads, returns `[]` for `los` when the active squad
        is not the caller's, and `null` for `myPool` when `myRole` is `null`
    25. `test/fixtures/tactical-state.json` parses and deep-equals `tacticalView(t, 'attacker')` from the
        scripted battle at the recorded point
    26. `autoOrders` demonstrates all **3** upgraded behaviours: prefers the higher-cover hex, fires an AoE
        action at a hex holding **2** clustered enemies, and makes an unengaged sapper build
18. **Record `test/fixtures/tactical-state.json` from the scripted battle** (see "Contracts you produce" §3
    for the full list of required properties). Regenerate it only from the test — never hand-edit it. Provide
    the regeneration path as an env flag in the test (`UPDATE_FIXTURE=1 npm test` rewrites it; the default run
    asserts against it), so a future engine change fails loudly instead of silently drifting away from what
    Lanes D and E render.
19. **List your engine constants in the PR body under a heading "Engine constants for COMBAT_DESIGN.md"**
    (`ROUND_LIMIT`, `MAX_SQUADS`, the morale roll shape and its modifier values, suppression duration, cover
    stacking, rout movement rate, AoE friendly-fire rule). Drift guard 9 wants them documented, but
    `docs/COMBAT_DESIGN.md` is **Lane A's file** — you do not edit it; you hand the numbers over.
20. **Flag to the platform lane in the PR body, do not fix:** `runAutoTurns` in
    `base44/functions/gameEngine/entry.ts:2010` caps auto activations at `guard < 60`, which at 24 v 24
    squads is barely more than one round; and its `resolveOrders(..., o.targetId)` call passes a bare string
    that your normaliser accepts today but the platform should migrate to the §4 `target` object.

---

## Acceptance criteria

### Copied verbatim from §3 "Lane C — Engine"

> Acceptance: deterministic replay of a scripted 6-turn battle in tests; no order can push a squad into a
> blocked hex; routed squads never fire; battle always terminates ≤ `ROUND_LIMIT`.

### Lane-specific checks, all runnable

- `npm test` is green, and `test/tactical-engine.test.js` contains **≥ 26** `it(...)` cases covering the list
  in Work item 17.
- `grep -n "Math.random" base44/shared/tacticalEngine.ts` returns **nothing**.
- `grep -nE "PEN_TABLE|TYPE_MATRIX|armourValue|armorPen\s*-" base44/shared/tacticalEngine.ts` returns
  **nothing** — the only armour call in the file is `resolveHit(...)`.
- `grep -nE "^export (function|const) (createTactical|submitFormations|autoFormations|autoOrders|resolveOrders|activeFormation|battleResult|tacticalView)\b" base44/shared/tacticalEngine.ts`
  returns **8** lines.
- `grep -n "from '\.\./\.\./src\|from \"@/" base44/shared/tacticalEngine.ts` returns **nothing** — shared
  server code never imports from `src/`.
- `test/fixtures/tactical-state.json` exists, is valid JSON, and its key set matches §4 exactly (asserted by
  test 23 and test 25).
- `node -e "const s=require('fs').readFileSync('test/fixtures/tactical-state.json','utf8');const p=JSON.parse(s);console.log(Object.keys(p).length, p.field.w, p.field.h, p.squads.length)"`
  prints `13 15 11` and a squad count of **≥ 16** (≥ 8 per side).
- `npm run lint`, `npm run typecheck` and `npm run rules:check` are green.
- `bash .claude/hooks/rules-guard.sh < /dev/null` exits 0.
- `git status --short` shows **exactly three** paths changed by this lane
  (`base44/shared/tacticalEngine.ts`, `test/tactical-engine.test.js`, `test/fixtures/tactical-state.json`) —
  plus `docs/TACTICAL_SQUAD_PLAN.md` **only** if you exercised the §4 amendment protocol.

---

## Drift guards

### §6 of the plan — mandatory in every lane PR (verbatim)

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a deep-equal
   mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it. UI-only fields are
   allowlisted in the test.
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations, autoFormations,
   autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported (rename internally,
   re-export aliases if needed). `gameEngine` imports exactly these.
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind classes
   must be literal strings.
5. **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only.
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from `data.js`, never
   retyped.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and flags
   `docs/GAME_RULES.md` for the platform lane.
10. **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no
    `UnitSprite.jsx` edits. Art is requested only as `imageLibrary.js` placeholders with `url: null`.
    Existing catalog keys are never renamed or removed (live saves reference them). Every new mechanical
    effect uses the §4 effect-key vocabulary or extends it in the same PR.
11. **Arms granularity stays numeric and server-rolled** — no weapon stat exists only in prose; every quirk
    carries a machine-evaluable `condition`; `rollWeapon` is pure and seeded (no `Math.random`); the tactical
    engine consumes only `deriveLoadout` output, never raw weapon instances.
12. **One damage model** — armour math exists only in `arms.ts` (`ARMOUR_CLASSES`, `PEN_TABLE`, `TYPE_MATRIX`,
    `resolveHit`). Every weapon declares `armorPen`, `damageType` and `aoe`; every stand declares an
    `ArmourClass` (vehicles per facing). `PEN_TABLE` must contain a `mult: 0` row so light weapons are
    genuinely ineffective against heavy/superheavy armour; a zero-effect hit may still suppress. No lane
    re-implements penetration in its own file.
13. **Mechanized granularity mirrors arms** — vehicles are chassis + powerplant + armour package + suspension
    + mount + hardpoints (Lane I weapon instances) + mods + quirks; `rollVehicle` is pure and seeded; the
    engine consumes only `deriveMechanized` output plus `facings`.

**The two that bite this lane hardest are 2 and 12.** Guard 2 is why the eight names above stay exported with
working signatures even though everything behind them is rewritten — `gameEngine` is platform-owned and will
not be updated in step with you. Guard 12 is why `resolveHit` is the only armour call in your file.

### Environment rules — non-negotiable

- **Never run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store (`/home/blae/.node-modules-store/rust-legions/node_modules`)
  and npm silently **deletes the symlink** and reifies a real directory in its place. Dependencies are already
  installed. In a fresh worktree, create the same symlink by hand (Work item 1) — never `npm ci`, whatever
  `scripts/agent-worktree.sh` prints.
- **Never edit `package.json` or `package-lock.json`** (drift guard 3).
- **Every table exported from a `base44/shared/*.ts` file MUST be a PURE DATA LITERAL** —
  `export const NAME = { ... }` or `[ ... ]`, with **no spreads, no computed keys, no function calls, and no
  template literals in keys** — because the mirror tests lift it **textually** with
  `test/helpers/extract-const.js` and evaluate it. A table that is computed cannot be mirror-tested. (This
  bites you on any constant table you add to `tacticalEngine.ts`; functions are fine, tables are not.)
- **`@/` imports only in `src/`.** No hex colours anywhere. No non-literal Tailwind class strings.
- **Ministry voice in every user-visible string** — your log lines and your rejection messages are user-visible.
  "The target lies beyond effective range", not "out of range".
- **Existing catalog keys are NEVER renamed or removed** — live saves reference them.
- **Numbers live in one place** — any constant shown in UI copy is imported from `src/lib`, never retyped.
- **Components ≤ ~60 lines, one per file** (no components in this lane, but the rule stands if you touch one —
  you should not).
- Do not run `git commit`/`push` against the orchestrator's checkout; you work in **your own worktree** (below).

### Git protocol (§7)

- Work in your **own** git worktree on branch **`feat/tactical-c`**. `scripts/agent-worktree.sh` currently
  creates `claude/<topic>` branches; §7 is the contract, so make sure the branch is named `feat/tactical-c`
  (`git worktree add -b feat/tactical-c ../rl-tactical-c origin/main` if the helper's prefix differs), then
  `git -C <worktree> config core.hooksPath .githooks` to arm the pre-push gate.
- Push to `origin/feat/tactical-c` and open a PR against `main`.
- PR title: `tactical(c): <summary>`. PR body lists the contract sections touched and the test names added,
  plus the three hand-over notes from Work items 3, 19 and 20.
- **You never edit another lane's files. If a contract must change, you edit `docs/TACTICAL_SQUAD_PLAN.md`
  §4 FIRST and say so in the PR body.**

---

## Definition of done

Run all of these from the worktree root and paste the output into the PR body. Green means:

```bash
cd <your worktree>

npm test
#   → all suites pass, 0 failed. test/tactical-engine.test.js reports ≥ 26 passing cases.

npm run lint
#   → exits 0 with no output (eslint --quiet; it covers src/components, src/pages and src/Layout.jsx only,
#     so a green run means you have not broken anything there — it does NOT lint your .ts file).

npm run typecheck
#   → exits 0 with no output.

npm run rules:check
#   → the mirror + combat-math suites pass.

bash .claude/hooks/rules-guard.sh < /dev/null
#   → exits 0.

grep -c "Math.random" base44/shared/tacticalEngine.ts || true
#   → 0.

grep -nE "PEN_TABLE|TYPE_MATRIX|armourValue" base44/shared/tacticalEngine.ts || true
#   → no matches.

grep -cE "^export (function|const) (createTactical|submitFormations|autoFormations|autoOrders|resolveOrders|activeFormation|battleResult|tacticalView)\b" base44/shared/tacticalEngine.ts
#   → 8.

node -e "const p=JSON.parse(require('fs').readFileSync('test/fixtures/tactical-state.json','utf8'));console.log(Object.keys(p).length,p.field.w,p.field.h,p.squads.length,p.status,p.myRole)"
#   → 13 15 11 <≥16> fighting attacker

git status --short
#   → exactly: base44/shared/tacticalEngine.ts, test/tactical-engine.test.js,
#     test/fixtures/tactical-state.json  (+ docs/TACTICAL_SQUAD_PLAN.md only if §4 was amended).
```

Then push `feat/tactical-c` and open the PR against `main`. The pre-push hook re-runs lint, typecheck and
`rules:check`; if it fails, fix the cause — do not push with `--no-verify`.

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


---

## WAVE 3 ADDENDUM — 2026-09-01 (orchestrator, AUTHORITATIVE)

Waves 1 and 2 are merged. `main` is green at **934 tests**. Everything you consume now exists.

### What is on main for you
- `base44/shared/tactical.ts` + `src/lib/tactical/data.js` (Lane A) — `SQUAD_TYPES` (base nine),
  `SPECIALISTS`, `SQUAD_ACTIONS`, `DEPLOYABLES`, `FIGURES_PER_COMPANY`, `deriveSquad`, `poolCost`,
  `toRegiments`.
- `base44/shared/tacticalField.ts` (Lane B) — `generateField({ seed, nodeKind, weather, fortBonus, w, h })`
  and the LOS/A* toolkit. **Call it with Lane B's exact `fieldOpts` shape.**
- `base44/shared/arms.ts` (Lane I) — `resolveHit`, `ARMOUR_CLASSES`, `PEN_TABLE`, `TYPE_MATRIX`.
- `base44/shared/motorPool.ts` (Lane J) — `deriveMechanized(stand)` returning SquadType-shaped values
  **plus `facings`**.

### Hard requirements added by the operator
1. **`test/fixtures/tactical-state.json` must come from a scripted battle that includes at least one
   VEHICLE stand**, so a **facing selection** is actually present in the fixture. Lanes D and E build
   against this file; if it contains only infantry, the facing path ships untested and unrendered.
2. **`createTactical(attackerUnits, defenderUnits, fieldOpts)`** — the field is **stored on
   `battle.tactical` at creation and NEVER regenerated**. A re-run with a changed `fortBonus` or `weather`
   would repaint the board underneath the squads. It is 165 tile objects at 15×11.
3. **`field.meta` must be carried through `tacticalView`** to the client. `lineOfSight()` reads
   `meta.losCap` and throws if `meta` is missing — deliberately, because a silent default would be an
   invisible rules change.
4. **`GRID` → `FIELD` (15×11) is your move**, up from the old 9×7.
5. **Drift guard 12:** penetration resolves ONLY via `resolveHit` imported from `arms.ts`. A hit on a
   vehicle **selects a facing** — rear when the attacker occupies a hex behind the stand's facing hex.
   You author no armour arithmetic.
6. **§6.2 export freeze, and it is now a SUPERSET rule:** `base44/shared/tacticalEngine.ts` must keep
   exporting `createTactical`, `submitFormations`, `autoFormations`, `autoOrders`, `resolveOrders`,
   `activeFormation`, `battleResult`, `tacticalView`. **Nothing removed, nothing re-signatured.** You may
   add exports (see amendment Q7); you may not take one away or change how an existing one is called.
7. **Leave a `relicProject` slot on the per-faction tactical state you fixture.** You do NOT implement the
   capture path — boarding assaults are a later Field Amendment — but the shape must exist now so it is
   not re-cut later. Operator ruling: on capture the captor loots the project's unspent **materials only**;
   the project, its progress and its housed-Object requirement are lost.
8. `tacticalOrders` reads **`body.orderAction`** (amendment Q1), and `tacticalAuto { gameId }` is already
   live on the platform side.

### Section numbers taken
`docs/GAME_RULES.md` `## 23` (Lane I), `## 24` (Lane G), and Lanes A and J have taken theirs. Read the
file, take the next free number, and name it in your PR body. Do not hard-code your section number
anywhere a renumber would silently break — the orchestrator renumbers on collision.
