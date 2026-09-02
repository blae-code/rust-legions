# Lane J — The Motor Pool

You are the **Lane J** agent on the Tactical Squad Plan. This brief plus four documents is your *entire*
context. Read them in this order before touching anything:

1. `CLAUDE.md`
2. `AGENTS.md`
3. `docs/VISION.md`
4. `docs/TACTICAL_SQUAD_PLAN.md` — **the contract.** §3 (lanes/ownership), §4 (payload shapes),
   §5 (phases), §6 (drift guards), §7 (git protocol).

Then read the files this lane owns (they mostly do not exist yet — you create them), plus
`test/helpers/extract-const.js`, and the already-merged Lane I files `base44/shared/arms.ts` +
`src/lib/arms.js`.

Nothing else is required context, and nothing else is authority. If this brief and
`docs/TACTICAL_SQUAD_PLAN.md` disagree, the plan wins and you flag the conflict in your PR body.

---

## Goal

At the end of this lane, a "crawler" is no longer a unit type — it is a **chassis pattern** from a named
motor-works, fitted with a powerplant, an armour package, a suspension, a turret or mount, hardpoint
weapons drawn from Lane I's `WEAPON_PATTERNS`, refit kits and rolled quirks, all priced in points and all
rolled by a **pure, seeded** `rollVehicle()`. `base44/shared/motorPool.ts` is the canonical catalogue, with
a byte-faithful data mirror at `src/lib/motorPool.js`, a written design document at `docs/MOTOR_POOL.md`
carrying the speed curve and a complete Points Audit, and two test files that prove the catalogue is
complete, mirrored, deterministic and correctly priced. `deriveMechanized(stand)` reduces any vehicle to
squad-shaped numbers **plus `facings`**, so Lanes A and C treat a crawler as a stand with four armour
facings and never as a bag of parts. **No armour or penetration arithmetic exists anywhere in this lane** —
that lives only in Lane I's `arms.ts`.

This is a **CONTENT LANE**. See "Drift guards → Content-lane rule" below: you author **data and prose
only, never visuals**.

---

## Owned files

Copied from §3 "Lane J — The Motor Pool". You create/edit **exactly** these:

| Path | State | Note |
| --- | --- | --- |
| `base44/shared/motorPool.ts` | **NEW** | canonical catalogue + pure functions |
| `src/lib/motorPool.js` | **NEW** | the frontend mirror |
| `docs/MOTOR_POOL.md` | **NEW** | design doc, speed curve, Points Audit, codex + rules appendices |
| `test/motor-mirror.test.js` | **NEW** | catalogue/mirror/coverage/pricing tests |
| `test/motor-roll.test.js` | **NEW** | determinism/distribution/derivation tests |
| `src/lib/imageLibrary.js` | **APPEND ONLY** | one new `motor` key added inside the existing `IMAGE_CATEGORIES` object + your `P(...)` rows in one banner-commented block at the END of `IMAGE_LIBRARY` |
| `src/lib/wiki/entries.js` | **APPEND ONLY** | one banner-commented block of Codex entries at the END of `ENTRIES` — required of every content lane by §3's content-lane preamble |
| `docs/GAME_RULES.md` | **APPEND ONLY** | one new trailing `[PROPOSED — awaiting platform wiring]` section — required of every content lane by §3's content-lane preamble |
| `base44/shared/arms.ts` | **APPEND ONLY** | `mw_*` rows appended inside the `MANUFACTURERS` literal — nothing else in the file |
| `src/lib/arms.js` | **APPEND ONLY** | the identical `mw_*` rows inside the mirror's `MANUFACTURERS` literal — nothing else in the file |

**You may not edit any other file.** In particular, and without exception:
`base44/shared/tactical.ts`, `src/lib/tactical/data.js`, `base44/shared/tacticalField.ts`,
`base44/shared/tacticalEngine.ts`, `base44/shared/catalog.ts`, `src/lib/units.js`, `src/lib/armyDesign.js`,
`src/lib/doctrine.js`, `src/lib/armory.js`, `src/lib/commandVehicles.js`,
`src/lib/imagePlates.js`, `src/components/**`, `src/pages/**`, `base44/functions/**`, `base44/entities/**`,
`docs/GEAR_LIBRARY.md`, `docs/ARMS_CATALOGUE.md`, `docs/LORE.md`,
`docs/FACTION_ROSTER.md`, any other lane's test file, `package.json`, `package-lock.json`,
`eslint.config.js`, `vitest.config.js`.

### The two files you do not own but must extend

**(a) `arms.ts` / `arms.js` — the `mw_*` append.** §3 Lane J: *"Lane J appends motor-works to Lane I's
`MANUFACTURERS`, keys `mw_*`, rather than duplicating the table."* This is a **narrow, append-only
exception granted by §3 and by this brief**: you add new rows inside the `MANUFACTURERS` object literal in
**both** files (identical rows, or Lane I's mirror test goes red) and change **nothing else** — no existing
row's bytes, no other table, no function, no import. Verify with
`git diff origin/main -- base44/shared/arms.ts src/lib/arms.js` — every changed line must be an added
`mw_*` row.

**Fallback, and take it only on this exact trigger:** if a **Lane I-owned test** goes red *solely* because
of the appended rows, and fixing it would require editing a file you do not own (e.g. a per-manufacturer
Codex-coverage assertion against `src/lib/wiki/entries.js`), then **revert the arms append entirely** and
declare the identical rows as an exported `MOTOR_WORKS` table in `motorPool.ts` + mirror instead. In that
case you **must** edit `docs/TACTICAL_SQUAD_PLAN.md` §4's Motor Pool block first (add
`MOTOR_WORKS = { [key]: Manufacturer }  // merged into MANUFACTURERS by the platform lane`) and state the
amendment in the PR body. **Never leave both** the append and the local table in place.

**(b) `src/lib/imageLibrary.js`.** Add exactly one key to `IMAGE_CATEGORIES`:

```js
  motor: { label: "The Motor Pool", desc: "The Motor Pool — chassis patterns, powerplants and refit kits" },
```

**inside the existing `IMAGE_CATEGORIES` object, adjacent to the keys already there** (never in your tail
block), and append your `P(...)` rows in **one** block at the **end** of `IMAGE_LIBRARY`, before the
closing `];`, opened by a single banner comment — `// ——— LANE J: motor pool ———`. Never reorder, edit or
delete an existing row. Other content lanes are appending to this same file concurrently — expect a merge
conflict and resolve it by **keeping both blocks, in lane order**.

### The two shared content-lane files you DO write into — CORRECTED

*An earlier draft of this brief told you to keep out of `src/lib/wiki/entries.js` and
`docs/GAME_RULES.md` and hand their content over as appendices in `docs/MOTOR_POOL.md`. That reading is
withdrawn.* §3's content-lane preamble is the ownership rule for these two files: *"Every content lane
appends its additions to `docs/GAME_RULES.md` as a draft section marked `[PROPOSED — awaiting platform
wiring]` and adds Codex entries in `src/lib/wiki/entries.js`."* Every content lane (F, G, H, I, J)
appends to both. A lane that hands its Codex over as prose is a lane whose Codex never lands. You append
to both, **append-only**. The `MOTOR_POOL.md` appendices stay — as the design record — but they are no
longer the delivery mechanism.

- **`src/lib/wiki/entries.js`** — Lane H **owns** the file and merges after you, which is exactly why
  the append must be append-only and at the tail. Ship your **≥15** entries (Work item 14) as **one
  contiguous block appended at the very END of the `ENTRIES` array**, before the closing `];`, opened
  by a single banner comment and nothing else on that line:

  ```js
  // ——— LANE J: motor works & chassis classes ———
  ```

  Never edit an existing entry, never insert into the middle of the array, never touch `CATEGORIES`,
  `STATUS`, `entryText` or `citedBy`. Every `id` unique across the whole array; every `see` target
  resolves to a real id (the corpus is 100% link-clean today and must stay that way — assert it in
  `test/motor-mirror.test.js`). Reproduce the identical rows in `MOTOR_POOL.md` §15.
- **`docs/GAME_RULES.md`** — append exactly **one** section at the very end of the file,
  `## <N>. The Motor Pool [PROPOSED — awaiting platform wiring]`, where `<N>` is one greater than the
  highest existing `## <number>.` heading **at the time you write**; renumber mechanically if another
  content lane took your number while you were in flight. **Do not renumber, reword or delete any
  existing section.** Same text as `MOTOR_POOL.md` §14. Name the number you used in the PR body.

### The shared-file protocol (`imageLibrary.js`, `wiki/entries.js`) — and why the tail block is mandatory

Lanes F, G, H, I and J all append to both of these files concurrently. **One banner-commented block per
lane, at the very END of the array**, turns every cross-lane collision into the same mechanical conflict
— two adjacent tail blocks, resolved by **keeping both, in lane order** — instead of an unresolvable
interleave inside a 1,000-line literal. A plate's `category` field is what groups it for the UI; its
position in the array is not. Your **new `IMAGE_CATEGORIES` key (`motor`) is the exception**: it goes on
its own line **inside the existing `IMAGE_CATEGORIES` object, adjacent to the keys already there**, never
in your tail block. Never reorder, reflow, reformat or delete an existing row in either file.

### Handoffs you must NOT perform yourself

- **Plate URLs and any image file** are the Base44 session's. You register placeholders with `url: null`
  only (the `P(...)` helper does this for you), and you never touch `src/lib/imagePlates.js`.

---

## Contracts you consume

### From Lane I (`base44/shared/arms.ts`, merged before you start) — verbatim §4

```ts
WeaponBase     = { accuracy, rateOfFire, damage, armorPen, range, reliability, weight, damageType: DamageType, aoe: { radius, falloff } | null }
DamageType     = 'kinetic'|'explosive'|'shaped'|'incendiary'|'fragmentation'|'concussive'|'chemical'
ArmourClassKey = 'none'|'soft'|'light'|'medium'|'heavy'|'superheavy'|'fortified'
ArmourClass    = { key: ArmourClassKey, armourValue: number, sealed: boolean, blurb }
PEN_TABLE      = Array<{ minDelta: number, mult: number }>      // armorPen − armourValue → effectiveness; a mult 0 row is mandatory
TYPE_MATRIX    = { [DamageType]: { [ArmourClassKey]: number } } // damage-type vs armour-class multiplier
// resolveHit({ weapon: WeaponBase, target: ArmourClass }) → { effective: number, suppressOnly: boolean } — the only armour math; Lane A imports it
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
```

**What you actually use from Lane I, and how:**

| You need | Import | Use |
| --- | --- | --- |
| `MANUFACTURERS` | `arms.ts` / `@/lib/arms.js` | your `mw_*` rows are appended here; chassis `maker` keys must resolve here |
| `WEAPON_PATTERNS` | same | hardpoint weapons are drawn **only** from this table |
| `QUALITY_GRADES` | same | `rollVehicle` uses these five keys, their `rollWeight`s and `ptsMult` — you do **not** author your own grade table |
| `rollWeapon(...)` | same | you **call** it to build every `WeaponInstance` on a hardpoint; you never hand-construct one |
| `ARMOUR_CLASSES` keys | same | you use the **key strings only** (`'none'…'fortified'`) as facing values |
| `resolveHit`, `PEN_TABLE`, `TYPE_MATRIX`, `armourValue` | — | **NEVER.** Not imported, not referenced, not mentioned in `motorPool.ts` or `src/lib/motorPool.js` |

Import syntax, exactly:

```ts
// base44/shared/motorPool.ts  (Deno — relative path, explicit .ts extension)
import { MANUFACTURERS, WEAPON_PATTERNS, QUALITY_GRADES, rollWeapon } from './arms.ts';
```
```js
// src/lib/motorPool.js  (@/ alias only — drift guard: no relative src/ paths)
import { MANUFACTURERS, WEAPON_PATTERNS, QUALITY_GRADES, rollWeapon } from '@/lib/arms.js';
```

**Step 0 of your work is to read the merged `arms.ts` and write down the real export names.** If Lane I
exports these under different names or with a different `rollWeapon` signature, **follow the merged
`arms.ts`, not this table**, and say so in the PR body. If `base44/shared/arms.ts` does **not exist**, Lane
I has not merged: **stop and report** — §5 says J starts only after I.

### From Lane A / the existing model (read-only context)

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
```

`RegimentKey ∈ { riflemen, crawler, artillery, fighter, gunboat }` (`src/lib/units.js` `UNIT_KEYS`).
Regiments ↔ figures: **vehicles are single-figure squads** (§4) — `deriveMechanized` always returns
`figures: 1`.

Balance anchor from the live game (`src/lib/units.js`): `crawler.points === 12`. This is why the Points
Audit reference is 12 pts.

---

## Contracts you produce

Verbatim §4 "Motor Pool" block. Emit these shapes **exactly** — same field names, same order of concepts,
no extra fields:

```ts
// ---- Motor Pool (Lane J) ----
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
// Engine rule (Lane A/C): a hit resolves via resolveHit against the struck facing — rear if the attacker occupies a hex behind the stand's facing
// tacticalDeploy squads may carry `loadout`; platform validates instances against the caller's arsenal
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)  // url always null from a lane
```

Vehicle quirks reuse Lane I's `Quirk` shape verbatim:
`Quirk = { key, label, mods, condition?: { key: string, value?: any }, blurb }`.

### The exact export surface of `base44/shared/motorPool.ts` (mirrored 1:1 in `src/lib/motorPool.js`)

**Pure-data tables — every one of these is mirror-tested and must be a pure data literal:**

| Export | Shape | Minimum |
| --- | --- | --- |
| `VEHICLE_CLASSES` | `string[]` | the 11 keys above, in that order |
| `VEHICLE_SLOTS` | `string[]` | the 9 keys above, in that order |
| `TERRAIN_KEYS` | `string[]` | the **16** keys fixed below — Lane B's `TERRAIN` vocabulary |
| `TIER_RANK` | `{ [tier]: number }` | `{ 'I': 1, 'II:Cache': 2, 'II:Eng': 2, 'II:Ciph': 2, 'II:Wake': 2, 'III': 3 }` |
| `VEHICLE_STAT_KEYS` | `string[]` | the vocabulary every `mods`/`tradeoff` key must come from |
| `MECHANIZED_SPECIALS` | `string[]` | the vocabulary `deriveMechanized().specials` draws from |
| `VEHICLE_QUIRK_CONDITIONS` | `string[]` | every vehicle quirk's `condition.key` must be in here |
| `MOTOR_WORKS_KEYS` | `string[]` | the `mw_*` keys you appended to `MANUFACTURERS`, **≥ 4** |
| `SPEED_CURVE` | `[{ minRatio, speed }]` | **≥ 6** rows, ascending, first row `minRatio: 0` |
| `MELEE_CURVE` | `[{ minTonnage, melee }]` | **≥ 4** rows, ascending, first row `minTonnage: 0` |
| `CREW_MORALE_CURVE` | `[{ minCrew, morale }]` | **≥ 4** rows, ascending, first row `minCrew: 1` |
| `CREW_EXPOSURE_MORALE` | `{ [ArmourClassKey]: number }` | a **morale delta** per mount `crewArmour` key — the one place an armour *key* may index arithmetic, and it must never index an armour *value* |
| `ROLL_ODDS` | object literal | the `rollVehicle` odds tables (mod count, quirk count, armour-package chance, luck weighting) |
| `CHASSIS_PATTERNS` | `{ [key]: ChassisPattern }` | **≥ 18** (author **20**, per the class table below) |
| `POWERPLANTS` | `{ [key]: Powerplant }` | **≥ 8** |
| `ARMOUR_PACKAGES` | `{ [key]: ArmourPackage }` | **≥ 10** |
| `SUSPENSIONS` | `{ [key]: Suspension }` | **≥ 6** |
| `MOUNTS` | `{ [key]: Mount }` | **≥ 8** |
| `VEHICLE_MODS` | `{ [key]: VehicleMod }` | **≥ 25**, **≥ 2 per `VehicleSlot`** |
| `VEHICLE_QUIRKS` | `{ [key]: Quirk }` | **≥ 15**, every one with a `condition` |

**Pure functions (also mirrored, identical bodies):**

| Export | Signature | Contract |
| --- | --- | --- |
| `tierRank(tier)` | `→ number` | `TIER_RANK[tier]`; throws on an unknown tier |
| `speedFromPowerWeight(hp, tonnage)` | `→ integer` | step lookup over `SPEED_CURVE` on `hp / tonnage`; monotonic non-decreasing; result clamped to `[1, 8]` |
| `terrainMultiplier(suspensionKey, terrainKey)` | `→ number` | `SUSPENSIONS[k].terrain[t]`; throws on an unknown key |
| `totalTonnage(vehicle)` | `→ number` | hull tonnage + package weight + Σ mod weights |
| `hardpointStats(vehicle)` | `→ { ranged, range, armorPenMax }` | weapon-stat arithmetic only — pattern `base` × quality `mult`, then mod `mods`/`tradeoff`, then quirk `mods`. `armorPen` values are **passed through untouched**, never compared to anything |
| `hardpointWeapons(vehicle)` | `→ WeaponInstance[]` | verbatim pass-through of `vehicle.hardpoints`, so Lane C can hand each instance to `resolveHit` itself |
| `breakdownChance(vehicle)` | `→ number in [0, 0.5]` | composed from powerplant/suspension/package `reliability` and quirk conditions; strictly non-increasing as reliability rises |
| `rollVehicle({ seed, class, maker, tierCap, luck })` | `→ VehicleInstance` | **pure and seeded** — see Work item 10 |
| `deriveMechanized(stand)` | `→ object` | returns **exactly** `{ figures, melee, ranged, range, speed, morale, pts, specials, facings }` and no other key |

`deriveMechanized`'s key set is deliberately a **subset** of §4's `SquadType` value keys ∪ `{facings}`.
It does **not** return `armor`: a numeric armour rating would require reading `ARMOUR_CLASSES[...].armourValue`,
which is armour math and is forbidden here. The engine derives armour from `facings` via `arms.ts`.
Anything numeric that does not fit the contracted key set (breakdown chance, penetration) is exposed
through a **separate exported function**, never smuggled into the return object. If you conclude an extra
key is unavoidable, you **amend `docs/TACTICAL_SQUAD_PLAN.md` §4 first** and say so in the PR body.

**Fixed vocabularies — use exactly these strings.**

`TERRAIN_KEYS` (**16**, in this order):
```
open, road, rail, field, rubble, ruins, building, wall, woods, hedgerow, crater, water, marsh, hill,
fuel_tank, precursor_wall
```
**These are Lane B's `TERRAIN` keys verbatim — the authoritative `TerrainKey` vocabulary, which Lane B
publishes to §4 precisely because your `Suspension.terrain` is keyed by it** (§4: *"`Suspension = { key,
label, terrain: { [TerrainKey]: number }, … }`"*; §6.13 and Lane B's own drift-guard note both name your
lane as the consumer). *An earlier draft of this brief declared a different 12-key list, inferred from
§3's palette prose, and it was wrong twice over: it invented **`street`**, which is not a key — §3 says
"city (ruins, rubble, streets)" but Lane B's canonical key for a metalled lane is **`road`** — and it
dropped four keys that do exist: **`wall`, `hill`, `fuel_tank`, `precursor_wall`**, plus `rail`. A
suspension table missing those would silently return `undefined` for the terrain a `depot` or `ruin`
field is mostly made of.*

Lane B is P1 and merges on the systems track; you are on the content track. **If `base44/shared/tacticalField.ts`
has merged by the time you start, read `TERRAIN` out of it and use exactly its keys — the merged file wins
over this list.** If it has not, use the 16 above; they are copied from Lane B's brief, which fixes both
the keys and their numbers. Either way, every suspension carries a modifier for **every** key, and a later
divergence is a §4 amendment plus a PR-body flag addressed to Lane B — never a quiet edit.

`VEHICLE_STAT_KEYS` (the only legal `mods`/`tradeoff` keys — extend only by editing this table and the doc):
```
hp, tonnage, weight, reliability, heat, speed, ranged, range, accuracy, rateOfFire, melee,
morale, initiative, arc, hardpoints, crew, fuelUse, losRange, pts
```

`MECHANIZED_SPECIALS` (the only legal `specials` tokens):
```
indirect, direct_fire, air, naval, amphibious, sealed, open_top, tracked, wheeled, walker,
towed, smoke, crush, recon, command
```

---

## Work items

A numbered, checkable list. Every minimum is a number.

**0. Preconditions and environment (do this first).**
   - `test -f base44/shared/arms.ts` and `test -f src/lib/arms.js`. If either is missing, **stop and
     report**: Lane I has not merged and §5 forbids J from starting.
   - Record the real export names of `arms.ts` (`grep -n '^export' base44/shared/arms.ts`) and the actual
     `rollWeapon` signature. Everything below assumes the §4 names; the merged file wins.
   - Create your worktree: `scripts/agent-worktree.sh new tactical-j` → `../rl-tactical-j`. The script names
     the branch `claude/tactical-j`; §7 requires **`feat/tactical-j`**, so inside the worktree run
     `git switch -c feat/tactical-j` (or `git branch -m feat/tactical-j`) before your first commit.
   - **Do NOT run `npm ci` or `npm install`** even though the script's hint says to (see Drift guards).
     Give the worktree dependencies with a symlink instead:
     `ln -sfn /home/blae/.node-modules-store/rust-legions/node_modules ../rl-tactical-j/node_modules`
   - Confirm the baseline is green before you write anything: `npm test` → **0 failed, 0 skipped.**
     Do **not** gate on an absolute count. `main` carried 6 test files / 95 tests before this wave, but
     Lane I merges ahead of you (adding `arms-mirror` and `arms-roll`) and other lanes may have landed
     too. Record whatever your run prints as *your* baseline, and require only that the same suites are
     still green after your work plus your two new files.

**1. `docs/MOTOR_POOL.md` skeleton — 16 sections**, in this order:
   1 Purpose & scope (state the no-armour-math rule) · 2 Nomenclature · 3 The Motor Works ·
   4 Chassis patterns · 5 Powerplants & the speed curve · 6 Armour packages & facings ·
   7 Suspension & terrain · 8 Turrets & mounts · 9 Refit kits (vehicle modifications) ·
   10 Quirks & conditions · 11 Rolling a vehicle (`rollVehicle` odds, roll order, serial format) ·
   12 `deriveMechanized` — the roll-up formulas · 13 Points Audit · 14 GAME_RULES draft section ·
   15 Codex entries (Lane H handoff) · 16 Art manifest rows.
   Write it as you author, not after — every number in the tables below must appear here with its reasoning.

**2. Motor works — ≥ 4 `mw_*` manufacturers.** Appended to `MANUFACTURERS` in `arms.ts` **and**
   `src/lib/arms.js`, conforming to Lane I's `Manufacturer` shape exactly (`key, label, houseKey?,
   culture?, signature, nameStems, access, lore`) — no extra fields. Each:
   - key prefixed `mw_` (e.g. `mw_grimwold_treadworks`);
   - tied to one of the ten Great Houses (`docs/FACTION_ROSTER.md` §1) or one of the ten settlement
     cultures (§2) via `houseKey` / `culture`;
   - a **house signature**: a consistent `Partial<WeaponBase>` lean applied to everything it makes;
   - `nameStems`: **≥ 4** name-stems used by the chassis nomenclature;
   - `access`: a `native`/`licensed`/`captured` entry for **every** house key that appears in the existing
     `MANUFACTURERS` rows' `access` maps (match Lane I's house-key spelling exactly);
   - `lore`: **60–100 words**, Ministry voice, no real-world nations/brands/people.
   Also export `MOTOR_WORKS_KEYS` from `motorPool.ts` listing these keys.

**3. Chassis patterns — ≥ 18, author 20, ≥ 1 per `VehicleClass` (11 classes).** Minimum per class:

   | class | count | class | count |
   | --- | --- | --- | --- |
   | `scout_crawler` | 2 | `sp_gun` | 2 |
   | `line_crawler` | 3 | `tractor_gun` | 1 |
   | `heavy_crawler` | 2 | `gunboat` | 2 |
   | `land_fort` | 1 | `fighter` | 2 |
   | `half_track` | 2 | `bomber` | 1 |
   | `armoured_car` | 2 | **total** | **20** |

   Every chassis declares, without exception:
   - `hull.tonnage` (number > 0), `hull.crew` (integer ≥ 1);
   - `hull.hardpoints`: **≥ 1** `Hardpoint`, each `{ key, allowed }` with `allowed` a **non-empty** subset of
     `['crawler_gun','hmg','flame','mortar','artillery','aircraft_gun']`;
   - `hull.baseArmour`: **all four facings** — `front`, `side`, `rear`, `top` — each a valid `ArmourClassKey`.
     A chassis missing any facing is a lane failure, not a default;
   - `slots`: a subset of `VEHICLE_SLOTS`;
   - `quirks`: innate quirk keys, all present in `VEHICLE_QUIRKS`;
   - `tier` ∈ `TIER_RANK` keys; `pts` (integer ≥ 1); `maker` present in `MANUFACTURERS`;
   - `label` in the in-world nomenclature **maker-stem + pattern year + name + mark** — e.g.
     *"Grimwold 138 Breaker, Mk III"*, *"Hundredweight 141 Line Crawler"*;
   - `blurb`: **15–40 words**, Ministry voice.

   **The reference chassis is mandatory and pinned**: key `hundredweight_141_line_crawler`, label
   `"Hundredweight 141 Line Crawler"`, `class: 'line_crawler'`, `tier: 'I'`, **`pts: 12`**. Its `maker` is
   Lane I's Hundredweight works if one exists in `MANUFACTURERS` (grep for it), otherwise one of your
   `mw_*` works. Every other chassis is priced against it.

**4. Powerplants — ≥ 8.** Diesel, gas-turbine, steam-flash boiler, relic-cell, alcohol burner and at least
   three more. Each `{ key, label, maker?, hp, weight, reliability, fuelClass, heat, blurb }` with
   `reliability` in `[0, 1]`, `fuelClass` ∈ `{ riflemen, crawler, artillery, fighter, gunboat }`, and a
   15–40 word Ministry-voice `blurb`. At least one is `tier`-gated by lore to relic material (relic-cell)
   and says so in its blurb.

**5. The speed curve.** `speedFromPowerWeight(hp, tonnage)` is a step lookup over `SPEED_CURVE` (**≥ 6**
   rows) on the power-to-weight ratio `hp / totalTonnage(vehicle)`, clamped to `[1, 8]` hexes/turn.
   Document the curve in `docs/MOTOR_POOL.md` §5 **and** publish a checkable sample table there as a
   fenced ```js block containing exactly one declaration:

   ```js
   const SPEED_CURVE_SAMPLES = [
     { hp: 60,  tonnage: 6,  speed: 4 },
     // … ≥ 8 rows total, spanning the whole curve including both clamps
   ];
   ```

   `test/motor-mirror.test.js` lifts it with `extractConst` and asserts
   `speedFromPowerWeight(hp, tonnage) === speed` for every row.

**6. Armour packages — ≥ 10.** Rolled plate, cast, face-hardened, spaced, bolted salvage, sandbag stowage,
   relic-alloy and at least three more. Each `{ key, label, facings, weight, cost, reliability, blurb }`
   where `facings` is a **`Partial<Facings>` of `ArmourClassKey` strings**. Applying a package is
   **pure key substitution**: `{ ...hull.baseArmour, ...pkg.facings }`. No addition, no comparison, no
   armour values. A package must never *lower* a facing — that invariant is asserted **in the test file**
   (which may import `ARMOUR_CLASSES` and compare `armourValue`), never in `motorPool.ts`. At least one
   package must be heavy enough to push a `line_crawler` front facing to `heavy`, at a documented cost in
   `weight` (and therefore speed) and `reliability`.

**7. Suspension / drive — ≥ 6.** Tracks, half-track, wheels, walker-legs, screw-drive, hover-skirt (relic).
   Each `{ key, label, terrain, weight, reliability, blurb }` where `terrain` declares a multiplier for
   **every one of the 16 `TERRAIN_KEYS`**, each in `[0, 1.5]` (`1` = unaffected, `0` = impassable). Publish
   the full 6×12 matrix as a markdown table in `docs/MOTOR_POOL.md` §7.

**8. Turrets & mounts — ≥ 8.** Fixed casemate, open ring, enclosed turret, twin mount, sponson pair,
   howitzer cradle and at least two more. Each `{ key, label, hardpoints, arc, crewArmour, blurb }` with
   `hardpoints` an integer ≥ 1, `arc` a number in `(0, 360]`, `crewArmour` a valid `ArmourClassKey`.
   A mount is legal on a chassis only when `mount.hardpoints <= chassis.hull.hardpoints.length`;
   `rollVehicle` must respect this and the test asserts it.

**9. Vehicle modifications — ≥ 25, ≥ 2 per `VehicleSlot` (9 slots).** Each
   `{ key, label, slot, appliesTo, pts, mods, tradeoff, blurb }` where:
   - `slot` ∈ `VEHICLE_SLOTS`; `appliesTo` a non-empty subset of `VEHICLE_CLASSES`;
   - `mods` and `tradeoff` are both **non-empty** `Record<string, number>`;
   - every key of both is in `VEHICLE_STAT_KEYS`;
   - **their key sets are disjoint** — a mod may not both improve and "cost" the same stat, which is how a
     fake tradeoff gets written;
   - `blurb` 15–40 words naming the tradeoff in prose ("extra plate slows"; "the long-barrel gun cuts
     turret traverse"; "smoke dischargers cost a hardpoint").
   **Every one of the ≥ 25 mods has a genuinely adverse, non-empty `tradeoff`. A mod with `tradeoff: {}` is
   a lane failure.**

**10. Vehicle quirks — ≥ 15, every one machine-evaluable.** Each `{ key, label, mods, condition, blurb }`
   where `condition` is `{ key, value? }` and `condition.key` ∈ `VEHICLE_QUIRK_CONDITIONS`. Reuse Lane I's
   condition keys where an equivalent already exists in `arms.ts` rather than inventing a synonym; grep
   before you invent. Worked examples from §3 that must exist in some form: *Hand-Fitted Gearbox*
   (reliability +0.1 while not at full pace), *Prize Hull* (morale +1 for the captor's house),
   *Boiler-Shy* (reliability −0.15 in rain). **A quirk whose effect exists only in prose is a lane failure.**

**11. `rollVehicle({ seed, class, maker, tierCap, luck })` — pure and seeded.**
   - Destructure as `{ seed, class: vehicleClass, maker, tierCap = 'III', luck = 0 }` — `class` is a
     reserved word and cannot be a bare binding.
   - RNG: copy this body verbatim into **both** files as a non-exported local (it is `macroMulberry32` from
     `base44/functions/gameEngine/entry.ts:711`; copy it, do not import it):
     ```js
     const motorMulberry32 = (a) => () => {
       a |= 0; a = (a + 0x6d2b79f5) | 0;
       let t = Math.imul(a ^ (a >>> 15), 1 | a);
       t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
       return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
     };
     ```
   - **`Math.random` appears nowhere in this lane.** No `Date.now()`, no `crypto`, no module-level mutable
     state — two calls with the same arguments return deep-equal results in any order.
   - **Fixed roll order** (document it in §11 and never change it silently): quality → chassis →
     powerplant → suspension → mount → armour package (may be none) → hardpoint weapons in hull order →
     mods (count, then picks) → quirks (innate chassis quirks first, then rolled) → serial.
   - **Quality** is drawn from Lane I's `QUALITY_GRADES` `rollWeight`s. At `luck === 0` the distribution is
     exactly those weights normalised. `luck` ∈ `[-1, 1]` re-weights monotonically toward higher/lower
     grades; document the weighting formula in `ROLL_ODDS`.
   - **`tierCap`** bounds `tierRank` for the chassis, its hardpoint weapon patterns and its mods. Nothing
     above the cap may appear in the instance.
   - **`class` / `maker`**, when supplied, filter the chassis pool; when a filter empties the pool, **throw
     a descriptive `Error`** — never fall back silently.
   - **Hardpoint weapons** are built by calling Lane I's `rollWeapon(...)` once per hardpoint, with a
     deterministic sub-seed. Use exactly: `hpSeed = (seed ^ Math.imul(0x9e3779b9, i + 1)) | 0` for
     hardpoint index `i`, and pass a weapon class drawn from that hardpoint's `allowed` list. Document the
     formula in §11.
   - **Serial**: deterministic from the seed and the maker, format documented in §11 and asserted by a
     regex in the test — e.g. `MW-<uppercase maker stem>-<4 uppercase hex>`.

**12. `deriveMechanized(stand)`** — `stand` is `{ vehicle: VehicleInstance, ... }`. Returns **exactly**
   `{ figures, melee, ranged, range, speed, morale, pts, specials, facings }`:
   - `figures`: always `1` (vehicles are single-figure squads, §4);
   - `melee`: step lookup over `MELEE_CURVE` on `totalTonnage(vehicle)`;
   - `ranged`, `range`: from `hardpointStats(vehicle)` — document the reduction formula in §12
     (e.g. `ranged = Σ damage × rateOfFire × accuracy`, rounded to 2 dp; `range = max(range)`);
   - `speed`: `speedFromPowerWeight(plantHp, totalTonnage(vehicle))`, then mod `speed` deltas, clamped `[1, 8]`.
     Terrain is **not** applied here — Lane C calls `terrainMultiplier()` per hex;
   - `morale`: `CREW_MORALE_CURVE` on `hull.crew`, plus `CREW_EXPOSURE_MORALE[mount.crewArmour]`, plus
     `crew_kit` mod and quirk `morale` deltas;
   - `pts`: documented sum — chassis + powerplant + package + Σ mods + Σ hardpoint weapon pts, times the
     quality `ptsMult`;
   - `specials`: tokens from `MECHANIZED_SPECIALS` only, derived from class, suspension and quirks;
   - `facings`: `{ ...hull.baseArmour, ...(package?.facings ?? {}) }` — key substitution, nothing else.
   Also export `breakdownChance(vehicle)` and `hardpointWeapons(vehicle)` as the numeric escape hatches
   (see the export table above). Document both in §12.

**13. Points Audit — `docs/MOTOR_POOL.md` §13.** Every chassis, at `issue` grade with an issue powerplant
   and **no** armour package, priced against **`Hundredweight 141 Line Crawler = 12 pts`**. Publish it as a
   fenced ```js block containing exactly one declaration:

   ```js
   const POINTS_AUDIT = [
     { key: 'hundredweight_141_line_crawler', pts: 12, value: 12.0, ratio: 1.00 },
     // … one row per chassis, 20 rows
   ];
   ```

   where `value` is the combat value from a formula you define and document in §13 (state the formula
   above the block), and `ratio = (value / pts) ÷ (refValue / refPts)`. The test asserts: one row per
   chassis key, `pts` equal to `CHASSIS_PATTERNS[key].pts`, the reference row present at `pts: 12` and
   `ratio: 1`, and **`ratio <= 1.6` for every row**. Price anti-armour value separately from
   anti-personnel value in the prose so a heavy AT chassis is not "free" against infantry.

**14. `[PROPOSED]` rules draft — written in `docs/MOTOR_POOL.md` §14 AND appended to
   `docs/GAME_RULES.md`.** A self-contained section covering: what a mechanized stand is, the four
   facings, the refit vocabulary, the speed curve, breakdowns, and the points anchor.
   - In `docs/MOTOR_POOL.md`, head it `## 14. GAME_RULES.md draft — The Motor Pool
     [PROPOSED — awaiting platform wiring]`. This is the design record.
   - **Then append the identical text to `docs/GAME_RULES.md`** as one new trailing section
     `## <N>. The Motor Pool [PROPOSED — awaiting platform wiring]`, `<N>` one greater than the highest
     existing `## <number>.` heading **at the time you write** — `GAME_RULES.md` ended at §22 on `main`,
     but Lanes F, G, H and I each append one too, so **read the file and take the next free number**,
     and renumber mechanically if someone takes it while you are in flight. Never renumber, reword or
     delete an existing section. Name the number you used in the PR body.
   *(An earlier draft of this brief said "do not edit that file". That was wrong — §3's content-lane
   preamble requires this append of every content lane. See "The two shared content-lane files you DO
   write into" above.)*

**15. Codex entries — `docs/MOTOR_POOL.md` §15, ≥ 15 entries.** One per motor-works (**≥ 4**) and one per
   `VehicleClass` (**11**). Publish as a fenced ```js block containing exactly one declaration:

   ```js
   const MOTOR_CODEX_ENTRIES = [
     { id: 'motor-works-grimwold', title: '…', category: 'powers', tag: 'Motor Pool §3', status: 'canon',
       summary: '…', blocks: [{ lead: '…' }, { p: '…' }], see: ['…'] },
     // …
   ];
   ```

   Schema is `src/lib/wiki/entries.js`'s (read its header comment): `id, title, folk?, category, tag,
   status, summary, blocks, see?, manual?`. Use `category: 'powers'` for motor-works and `category: 'war'`
   for chassis classes; `tag: 'Motor Pool §<n>'`; `status: 'canon'`. **Never invent canon** — if an entry
   needs something `docs/LORE.md` does not say, mark it `status: 'thin'` and say so in the PR body.

   **Then ship the identical rows into `src/lib/wiki/entries.js`**, as the one banner-commented block
   (`// ——— LANE J: motor works & chassis classes ———`) appended at the very END of the `ENTRIES`
   array — see "The two shared content-lane files you DO write into" above. *(An earlier draft of this
   brief said you do not edit that file and Lane H would paste these in. That was wrong; §3's
   content-lane preamble requires the append, and Lane H merging after you is the reason append-only
   at the tail is mandatory, not a reason to skip it.)* Every `id` must be unique across the whole
   array and every `see` target must resolve to a real id — assert both in `test/motor-mirror.test.js`,
   over the entire array, so your append cannot break Lane H's link-clean corpus.

**16. Placeholder plates — `src/lib/imageLibrary.js`, append only.** One plate per catalogue row, all in
   the new `motor` category, `url` always `null` (the `P(...)` helper handles that):

   | Prefix | Covers | Count |
   | --- | --- | --- |
   | `chassis_<key>` | every chassis | 20 |
   | `plant_<key>` | every powerplant | ≥ 8 |
   | `refit_<key>` | every armour package, suspension, mount and vehicle mod | ≥ 49 |
   | `maker_<key>` | every `mw_*` motor-works | ≥ 4 |

   **Plate keys are globally unique across `IMAGE_LIBRARY`** — 17 `refit_*` keys already exist in the
   `vehicles` category (`refit_quartermaster_rig`, `refit_smoke_generators`, `refit_wireless_set`, …).
   Grep before you name; the uniqueness test will catch you if you don't. Prompts carry **no house style**
   (it is prepended at generation) and no colour direction. Mirror every plate key into
   `docs/MOTOR_POOL.md` §16 as the ART_MANIFEST handoff rows (key, category, aspect, one-line subject).

**17. Tests.** Author `test/motor-mirror.test.js` and `test/motor-roll.test.js` with **at least** the
   following `it(...)` names (wording may vary, coverage may not). Use
   `readRepoFile` + `extractConst` from `test/helpers/extract-const.js` for everything on the `.ts` side and
   plain `@/lib/...` imports for the mirrors — the pattern is `test/rules-mirror.test.js`.

   `test/motor-mirror.test.js`:
   1. one `it` per mirrored table: "`<TABLE>` in motorPool.ts deep-equals the src/lib mirror"
   2. "every `export const` data literal in motorPool.ts is covered by the mirror list"
   3. "chassis: at least 18 patterns and at least one per VehicleClass"
   4. "chassis: every pattern declares all four facings with valid ArmourClass keys"
   5. "chassis: every hardpoint declares a non-empty allowed list of WeaponClass values"
   6. "chassis: every hardpoint has at least one eligible WEAPON_PATTERNS entry at tierCap III"
   7. "chassis: every maker key exists in MANUFACTURERS"
   8. "powerplants: at least 8, each with a fuelClass in the regiment keys"
   9. "armour packages: at least 10, and no package lowers a facing"
   10. "suspensions: at least 6, each declaring a modifier for all 12 terrain keys"
   11. "mounts: at least 8, each with a valid crewArmour and at least one hardpoint"
   12. "vehicle mods: at least 25, at least 2 per slot, with non-empty disjoint mods/tradeoff from the stat vocabulary"
   13. "vehicle quirks: at least 15, each with a condition key from the vocabulary"
   14. "motor works: at least 4 mw_* manufacturers conforming to the Manufacturer shape"
   15. "plates: every catalogue row has its placeholder plate and every IMAGE_LIBRARY key is unique"
   16. "the documented speed-curve samples match speedFromPowerWeight"
   17. "the Points Audit covers every chassis and matches its pts"
   18. "the Hundredweight 141 Line Crawler reference prices at 12 pts"
   19. "no chassis exceeds 1.6x the reference points efficiency"
   20. "motorPool.ts contains no armour arithmetic" — assert the source text matches none of
       `/armourValue/`, `/PEN_TABLE/`, `/TYPE_MATRIX/`, `/resolveHit/`
   21. "motorPool.ts and its mirror contain no Math.random"
   22. "the codex appendix covers every motor-works and every VehicleClass"
   23. "the arms.ts MANUFACTURERS append adds only mw_* keys" — existing keys unchanged

   `test/motor-roll.test.js`:
   1. "the same seed produces an identical vehicle"
   2. "different seeds produce different vehicles" — ≥ 10 distinct chassis over 50 seeds
   3. "10 000 rolls match the quality-grade distribution within 2 percentage points"
   4. "luck 0 reproduces the base grade weights and positive luck raises the mean grade"
   5. "tierCap is never exceeded by the chassis, its hardpoint weapons or its mods"
   6. "every rolled hardpoint weapon key exists in WEAPON_PATTERNS"
   7. "a requested class always yields a chassis of that class"
   8. "a requested maker always yields a chassis of that maker, and an impossible filter throws"
   9. "the rolled mount never carries more hardpoints than the hull provides"
   10. "serials are deterministic and match the documented format"
   11. "deriveMechanized returns exactly the contracted key set"
   12. "deriveMechanized returns all four facings and an armour package substitutes facing keys"
   13. "breakdownChance is bounded to [0, 0.5] and does not rise as reliability rises"
   14. "rollVehicle holds no state — interleaved calls with the same seed agree"

   The 10 000-roll assertion is: for each of the five grades,
   `Math.abs(observed / 10000 - rollWeight / totalWeight) <= 0.02`.

**18. Finish.** Run the Definition of done, then push `feat/tactical-j` and open the PR.

---

## Acceptance criteria

**Copied verbatim from §3 "Lane J — The Motor Pool":**

> Acceptance: mirror + roll tests green (same seed → identical vehicle; 10 000 rolls within 2% of the grade
> table); every chassis has a `chassis_<key>` plate, every powerplant a `plant_<key>` plate, every armour
> package / mod a `refit_<key>` plate; `deriveMechanized` output keys ⊆ §4 `SquadType` value keys ∪
> `{facings}`; every hardpoint weapon key exists in Lane I's `WEAPON_PATTERNS`; Codex entries for every
> motor-works and chassis class; no `Math.random`; no armour arithmetic outside `arms.ts`.

**Plus these lane-specific checks, each satisfied by a named test above:**

1. `CHASSIS_PATTERNS` has **≥ 18** entries (author 20) and **≥ 1 per `VehicleClass`** (11 classes).
2. **Every chassis declares all four facings** — `front`, `side`, `rear`, `top` — with valid `ArmourClassKey`s.
3. `POWERPLANTS` ≥ 8 · `ARMOUR_PACKAGES` ≥ 10 · `SUSPENSIONS` ≥ 6 (each with a modifier for **every** one
   of the 16 `TERRAIN_KEYS`) · `MOUNTS` ≥ 8 · `VEHICLE_MODS` ≥ 25 (≥ 2 per slot) · `VEHICLE_QUIRKS` ≥ 15.
4. **Every vehicle mod has a non-empty numeric `tradeoff`**, disjoint from its `mods` keys, both drawn from
   `VEHICLE_STAT_KEYS`.
5. **Every vehicle quirk has a machine-evaluable `condition`** whose `key` is in `VEHICLE_QUIRK_CONDITIONS`.
6. Speed is `f(hp / tonnage)` via `SPEED_CURVE`, documented in `docs/MOTOR_POOL.md` §5, and the documented
   `SPEED_CURVE_SAMPLES` (≥ 8 rows) match the function exactly.
7. `rollVehicle` is **pure and seeded**; `Math.random` appears in neither `motorPool.ts` nor
   `src/lib/motorPool.js`; same arguments → deep-equal instances.
8. `deriveMechanized` returns **exactly** `{ figures, melee, ranged, range, speed, morale, pts, specials,
   facings }` — a subset of §4's `SquadType` value keys ∪ `{facings}`, with `facings` always complete.
9. **No armour arithmetic in `motorPool.ts`**: the source text contains none of `armourValue`, `PEN_TABLE`,
   `TYPE_MATRIX`, `resolveHit`. `motorPool.ts` declares `ArmourClass` **keys** per facing and nothing more.
10. Points Audit in `docs/MOTOR_POOL.md` covers every chassis, matches every `pts`, anchors on
    **`Hundredweight 141 Line Crawler = 12 pts`**, and no chassis exceeds **1.6×** the reference efficiency.
11. Plate coverage: `chassis_<key>` ×20, `plant_<key>` ×≥8, `refit_<key>` for every armour package,
    suspension, mount and mod (≥ 49), `maker_<key>` for every `mw_*` works (≥ 4) — all in the new `motor`
    category, all `url: null`, all keys globally unique in `IMAGE_LIBRARY`.
12. `MOTOR_CODEX_ENTRIES` in `docs/MOTOR_POOL.md` has **≥ 15** entries covering every motor-works and every
    one of the 11 `VehicleClass` values, in `src/lib/wiki/entries.js`'s schema — **and the identical rows
    are shipped into `src/lib/wiki/entries.js`** as one banner-commented tail block, with every `id`
    unique across the whole array and every `see` target resolving (asserted in `motor-mirror.test.js`).
13. The `arms.ts` / `arms.js` diff against `origin/main` contains **only added `mw_*` rows**.
14. `src/lib/motorPool.js` is a **strict data mirror**: every mirrored table deep-equals its `motorPool.ts`
    counterpart with **no extra fields** on either side. A UI-only field is a §4 amendment, not a liberty.
15. `docs/GAME_RULES.md` carries **one** new trailing section whose heading contains the literal string
    `[PROPOSED — awaiting platform wiring]`, and every pre-existing `## <number>.` heading is still
    present, unrenumbered and unreworded (assert with `readRepoFile` in `motor-mirror.test.js`).
16. `SUSPENSIONS[k].terrain` declares a modifier for **every one of the 16 `TERRAIN_KEYS`** — no missing
    key, no extra key — and if `base44/shared/tacticalField.ts` has merged, `TERRAIN_KEYS` deep-equals
    `Object.keys(TERRAIN)` lifted from it with `extractConst`.

---

## Drift guards

The §6 list, in full, as it applies to you:

1. **The One Critical Invariant** — every table exported from `base44/shared/motorPool.ts` has a deep-equal
   mirror in `src/lib/motorPool.js`; `test/motor-mirror.test.js` enforces it.
2. **Exported API freeze** — `tacticalEngine.ts` keeps its exported names. You do not touch that file.
3. **No new dependencies. `package.json` is not touched by any worktree lane.**
4. **Design tokens only** — no hex colors, no non-literal Tailwind class strings. (You ship no JSX, but the
   rule binds any string you write that a component might render.)
5. **Ministry voice** in every user-visible string; PII never rendered; no real-world nations, brands or
   people.
6. **Components ≤ ~60 lines**, one component per file, **`@/` imports only in `src/`** — your mirror imports
   `@/lib/arms.js`, never `../arms.js`.
7. **Numbers live in one place** — any constant that will appear in UI copy is read from
   `src/lib/motorPool.js`, never retyped into a component or a doc sentence that claims to be authoritative.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`.
9. **Doc drift** — a change to any rule number is made in `docs/MOTOR_POOL.md` in the same commit, is
   reflected in your appended `[PROPOSED]` section of `docs/GAME_RULES.md`, and is flagged for the
   platform lane in the PR body. You append one trailing section to `GAME_RULES.md` and edit nothing
   else in it; `docs/COMBAT_DESIGN.md` remains Lane A's and is a PR-body flag, never an edit.
10. **Content lanes never ship visuals** — **and this is your lane's headline rule. You author DATA AND
    PROSE ONLY.** No image files. No SVG art. No `PLATE_URLS` entries. No edits to
    `src/lib/imagePlates.js`, `UnitSprite.jsx`, `src/index.css` or any component. Art is requested **only**
    as `imageLibrary.js` placeholders with `url: null` and a prompt that carries **no `HOUSE_STYLE`** —
    the constant exported from `src/lib/imageLibrary.js` ("Gritty dieselpunk, 1930s industrial wartime
    aesthetic…") is **prepended at generation time**, so a prompt that restates it produces a doubled
    prompt — and no colour direction, no artist names, no real-world brands. Write only what is specific
    to *this* subject: the machine, the kit, the pose, the ground, the light. 15–35 words. **Existing catalog keys are NEVER renamed or removed
    — live saves reference them.** Every new mechanical effect uses the §4 effect-key vocabulary or extends
    it in the same PR.
11. **Arms granularity stays numeric and server-rolled** — no stat exists only in prose; every quirk carries
    a machine-evaluable `condition`; the roll is pure and seeded (no `Math.random`); the tactical engine
    consumes only the derived roll-up, never raw instances.
12. **One damage model** — armour math exists **only** in `arms.ts`. You re-implement no part of it.
13. **Mechanized granularity mirrors arms** — vehicles are chassis + powerplant + armour package +
    suspension + mount + hardpoints (Lane I weapon instances) + mods + quirks; `rollVehicle` is pure and
    seeded; the engine consumes only `deriveMechanized` output plus `facings`.

**Data-literal rule (why your tables must be dumb).** Every table exported from a `base44/shared/*.ts` file
**must be a PURE DATA LITERAL** — `export const NAME = { … }` or `export const NAME = [ … ]` containing only
numbers, strings, booleans, null and nested objects/arrays. **No spreads, no computed keys, no function
calls, no template literals in keys, and no TypeScript type annotation on the declaration** (`const X: T = {`
does not match the extractor's regex and will fail as "not found"). The mirror tests lift these tables
**textually** with `test/helpers/extract-const.js` and evaluate them — **a table that is computed cannot be
mirror-tested.** Derived conveniences (`export const CHASSIS_KEYS = Object.keys(CHASSIS_PATTERNS);`) are
allowed but are not mirror-tested and must never be the only declaration of any datum.

**Environment rules — non-negotiable.**
- **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store (`/home/blae/.node-modules-store/rust-legions/node_modules`)
  and npm **silently deletes the symlink** and reifies a real directory in its place. Dependencies are
  already installed. Give a fresh worktree its dependencies with
  `ln -sfn /home/blae/.node-modules-store/rust-legions/node_modules <worktree>/node_modules`.
- **NEVER edit `package.json` or `package-lock.json`** (drift guard 3).
- Tests: `npm test` (vitest run). Lint: `npm run lint`.

**Git protocol (§7).**
- Work in your **own worktree** — `scripts/agent-worktree.sh new tactical-j` → `../rl-tactical-j` — on
  branch **`feat/tactical-j`** (rename off the script's `claude/tactical-j` default). Never work in the
  orchestrator's checkout, never switch its branch.
- Push to `origin/feat/tactical-j` and open a **PR against `main`**. PR title: `tactical(j): <summary>`.
  Body lists the contract sections touched and the test names added.
- `main` is two-way synced with the Base44 Builder — a red merge breaks the live preview. Never push a red
  branch.
- **You never edit another lane's files.** If a contract must change, you edit
  `docs/TACTICAL_SQUAD_PLAN.md` §4 **first** and say so in the PR body under a
  `## Contract amendments` heading.
- Your PR body must additionally list, for the orchestrator: (a) the `mw_*` manufacturer keys appended to
  `arms.ts` / `arms.js`, (b) every plate key added (for `ART_MANIFEST.md`) and the new `motor`
  `IMAGE_CATEGORIES` key, (c) the codex entry ids **shipped** into `src/lib/wiki/entries.js` (flagged for
  Lane H, who owns the file and merges after you), (d) the `docs/GAME_RULES.md` section **number** you
  used (flagged for the platform lane, which promotes it, and for the other content lanes, which each
  append one too), (e) any `status: 'thin'` codex entry, and (f) whether Lane B had merged when you fixed
  `TERRAIN_KEYS`, and any divergence you found from its `TERRAIN`.

---

## Definition of done

Run these, in this order, from the worktree root, and paste the output in the PR body:

```bash
cd ../rl-tactical-j

# 1. the full suite
npm test

# 2. lint
npm run lint

# 3. the rules-invariant reminder hook (must exit 0 and print nothing that blocks)
bash .claude/hooks/rules-guard.sh < /dev/null

# 4. the pre-push gate's other two checks (the hook runs them on push)
npm run typecheck
npm run rules:check

# 5. the two hard greps — both must print NOTHING
grep -n "Math\.random" base44/shared/motorPool.ts src/lib/motorPool.js
grep -nE "armourValue|PEN_TABLE|TYPE_MATRIX|resolveHit" base44/shared/motorPool.ts src/lib/motorPool.js

# 6. the append-only proof — every changed line must be an added mw_* row
git diff origin/main -- base44/shared/arms.ts src/lib/arms.js

# 7. the ownership proof — this list must contain ONLY the ten owned paths
git diff --name-only origin/main
```

**Green looks like:**

- **(1)** Zero failures, zero skipped; every suite that was green in your Work-item-0 baseline is still
  green; and `motor-mirror.test.js` + `motor-roll.test.js` both appear in the run, together contributing
  **at least the 37 named tests** above. **Do not gate on an absolute file or test count** — it depends
  on how many lanes have merged when you rebase, and an absolute number here goes red on someone else's
  green work. Compare against the baseline you recorded, not against a number in this brief.
- **(2)** `npm run lint` exits 0 with no output.
- **(3)** `rules-guard.sh` exits 0.
- **(4)** `npm run typecheck` exits 0 with no output; `npm run rules:check` reports all tests passed.
- **(5)** both greps print **nothing** and exit 1 (no matches). A single hit in either is a lane failure,
  not a warning.
- **(6)** the `arms` diff shows **only added lines**, every one of them inside the `MANUFACTURERS` literal
  and every one of them an `mw_*` row — or the diff is **empty** because you took the documented fallback.
- **(7)** `git diff --name-only origin/main` lists **only** these ten: `base44/shared/motorPool.ts`,
  `src/lib/motorPool.js`, `docs/MOTOR_POOL.md`, `test/motor-mirror.test.js`, `test/motor-roll.test.js`,
  `src/lib/imageLibrary.js`, `src/lib/wiki/entries.js`, `docs/GAME_RULES.md`, `base44/shared/arms.ts`,
  `src/lib/arms.js` (and `docs/TACTICAL_SQUAD_PLAN.md` **only** if you made a declared §4 amendment).
  The two shared content-lane files — `wiki/entries.js` and `GAME_RULES.md` — are the ones an earlier
  draft of this brief omitted; they are yours to append to. **Any other path in that list is drift —
  revert it before pushing.**

Then push `feat/tactical-j` and open the PR against `main`.

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

## WAVE 2 ADDENDUM — 2026-09-01 (orchestrator, AUTHORITATIVE)

Wave 1 is merged. `main` is green at **601 tests**. Lane I has landed, so your gate is open.

### 1. Lane I's tables are on `main` — draw from them, never duplicate them
`base44/shared/arms.ts` exports `MANUFACTURERS` (9 rows), `CALIBRES` (16), `WEAPON_PATTERNS` (49),
`QUALITY_GRADES` (5), `MODIFICATIONS` (47), `QUIRKS` (33), `ARMOUR_CLASSES` (7), `PEN_TABLE`,
`TYPE_MATRIX`, `resolveHit`, `rollWeapon`, `deriveLoadout`.
- Your hardpoint weapons are drawn **by key** from `WEAPON_PATTERNS`. Every key you name must exist —
  assert it mechanically in your tests. The vehicle-capable classes are `crawler_gun`, `hmg`, `flame`,
  `mortar`, `artillery`, `aircraft_gun`.
- Append your motor-works to `MANUFACTURERS` with keys `mw_*`, in **both** `arms.ts` and
  `src/lib/arms.js`, as a flat one-row-per-block append. Lane I was barred from asserting an exact
  manufacturer count precisely so your append cannot turn `main` red — do not undo that by asserting
  one yourself.
- **ABSOLUTE, drift guard 12: no armour or penetration arithmetic anywhere in `motorPool.ts`.** You
  declare `ArmourClass` KEYS per facing and nothing more. All the math lives in `arms.ts`.

### 2. A NEW platform module you must NOT duplicate
The Base44 session lifted `base44/shared/commandVehicles.ts` out of the engine — it holds
`COMMAND_VEHICLES`, `SUPREME_VEHICLE`, `VEHICLE_MODS` and `vehicleOf()`. **A general's command vehicle
is a general modifier, not a Motor Pool stand.** Read that module so your chassis catalogue does not
re-invent it, keep your keys distinct from its keys, and import it if you need it — never edit it, never
copy its rows into `motorPool.ts`. Say in your PR body how you kept the two apart.

### 3. What Wave 1's audits caught, so you do not repeat it
Three defect classes were found in sister lanes by adversarial review, not by tests:
- **Dead code with a false justification.** Lane B shipped a whole connectivity-repair pass that nothing
  reached, and the doc explaining it was factually wrong. If you write a repair/fallback path, write a
  test that actually drives it.
- **A published number that was arithmetically false against its own table** (a cost curve claiming 110
  when the tree summed to 138), restated in three places, checked by nothing. Your Points Audit must be
  computed from `CHASSIS_PATTERNS`, and add a test that recomputes it from the table rather than trusting
  the prose.
- **A gate bounded by "everything to end of file"**, which held only while that lane was the last to
  append. You will append to `docs/GAME_RULES.md`, `src/lib/imageLibrary.js` and `src/lib/wiki/entries.js`
  after two other lanes and before two more. Any region your tests locate in a shared file must be bounded
  at both ends, and must survive later lanes appending after you.

### 4. Shared-file state as of now
`GAME_RULES.md` `## 23.` is Lane I's, `## 24.` is Lane G's — take the next free number and name it in your
PR body. `IMAGE_CATEGORIES` already has `arms`; you add `motor`. `IMAGE_LIBRARY` has 586 plates and two
banner-commented tail blocks (Lane I, Lane G) — append ONE more at the very end. Same for
`src/lib/wiki/entries.js`. Do NOT edit `docs/prompts/ART_MANIFEST.md`; list your plate keys in the PR body
and the orchestrator folds them in.
