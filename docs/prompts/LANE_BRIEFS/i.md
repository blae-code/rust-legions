# Lane I — The Arms Catalogue

> **This brief plus four documents is your entire instruction set.** Read, in this order:
> `CLAUDE.md` → `AGENTS.md` → `docs/VISION.md` → `docs/TACTICAL_SQUAD_PLAN.md` (**the contract**:
> §3 lanes/ownership, §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol).
> Then read your owned files, `test/helpers/extract-const.js`, and for lore/reference only:
> `docs/LORE.md`, `docs/FACTION_ROSTER.md`, `docs/GEAR_LIBRARY.md`, `src/lib/imageLibrary.js`,
> `src/lib/wiki/entries.js`, `base44/shared/tactical.ts`, `test/rules-mirror.test.js`.
> Nothing in this brief may be traded away for brevity. Where this brief states a number, that
> number is the contract.

---

## Goal

At the end of this lane, `base44/shared/arms.ts` is the canonical, hand-authored arms catalogue of
Rust Legions: named weapon patterns from fictional manufacturers, in specific calibres, at rolled
quality grades, with slot-based modifications and named quirks — and it is the **single place in the
entire repository where armour mathematics exists**. The Universal Damage Model
(`ARMOUR_CLASSES`, `PEN_TABLE`, `TYPE_MATRIX`, `resolveHit`) is the centrepiece: Lane A imports
`resolveHit` from you rather than writing its own penetration code, and Lane J draws its hardpoint
weapons from your `WEAPON_PATTERNS` and its facings from your `ARMOUR_CLASSES`. A pure, seeded
`rollWeapon()` produces identical weapon instances for identical seeds, and `deriveLoadout()`
reduces a squad's weapons to squad-level numbers so the tactical engine never inspects an individual
rifle. Everything is mirrored to `src/lib/arms.js`, documented in `docs/ARMS_CATALOGUE.md` with a
complete Points Audit, and covered by two test files that make every claim above falsifiable.

**Lane I merges EARLY.** Lane A is blocked on your `resolveHit`; Lane J is blocked on your
`WEAPON_PATTERNS` and `ARMOUR_CLASSES`. Do not leave the damage model until last — build it first
(Work items 3–6), then the catalogue around it.

---

## Owned files

Copied from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane I:

| Path | State |
| --- | --- |
| `base44/shared/arms.ts` | **NEW** — canonical |
| `src/lib/arms.js` | **NEW** — mirror |
| `docs/ARMS_CATALOGUE.md` | **NEW** |
| `test/arms-mirror.test.js` | **NEW** |
| `test/arms-roll.test.js` | **NEW** |
| `src/lib/imageLibrary.js` | **SHARED, APPEND-ONLY** — the `arms` category line added inside the existing `IMAGE_CATEGORIES` object, and one contiguous banner-commented `arms` plate block appended at the END of `IMAGE_LIBRARY`. Touch nothing else in this file. |
| `src/lib/wiki/entries.js` | **SHARED, APPEND-ONLY** — one banner-commented block of Codex entries at the END of `ENTRIES`. Required of every content lane by §3's content-lane preamble. |
| `docs/GAME_RULES.md` | **SHARED, APPEND-ONLY** — one new trailing `[PROPOSED — awaiting platform wiring]` section. Required of every content lane by §3's content-lane preamble. |
| `docs/TACTICAL_SQUAD_PLAN.md` | **§4 Arms Catalogue block only**, append-only, and only for the amendment specified in Work item 20. |

**You may not edit any other file.** Not `base44/shared/tactical.ts`, not `src/lib/tactical/data.js`,
not `src/lib/units.js`, not `src/lib/imagePlates.js`, not `docs/prompts/ART_MANIFEST.md`, not any
component, not any test other than your two. If you believe another lane's file must change, you edit
`docs/TACTICAL_SQUAD_PLAN.md` §4 first and say so in the PR body (§3, §7).

**Two shared files you DO write into — CORRECTED.** *An earlier draft of this brief told you to keep
out of `src/lib/wiki/entries.js` and `docs/GAME_RULES.md` and hand their content over as annexes.
That reading is withdrawn.* §3's content-lane preamble is the ownership rule for these two files:
*"Every content lane appends its additions to `docs/GAME_RULES.md` as a draft section marked
`[PROPOSED — awaiting platform wiring]` and adds Codex entries in `src/lib/wiki/entries.js`."* Every
content lane (F, G, H, I, J) appends to both; a lane that hands its Codex over as prose is a lane
whose Codex never lands. You append to both, **append-only**, in the tail-block shape below. The
`ARMS_CATALOGUE.md` annexes stay — as the *catalogue of record*, where the reasoning lives — but they
are no longer the delivery mechanism.

1. `src/lib/wiki/entries.js` — **Lane H owns the file and merges after you**, so append-only keeps its
   rebase mechanical. Ship your ≥24 entries as **one contiguous block appended at the very END of the
   `ENTRIES` array**, before the closing `];`, opened by a single banner comment and nothing else on
   that line:

   ```js
   // ——— LANE I: makers & calibres ———
   ```

   Never edit an existing entry, never insert into the middle of the array, never touch `CATEGORIES`,
   `STATUS`, `entryText` or `citedBy`. Reproduce the same rows in `ARMS_CATALOGUE.md` §13.
2. `docs/GAME_RULES.md` — the platform lane **promotes** this section; every content lane appends one.
   Append exactly **one** section at the very end of the file,
   `## <N>. The Arms Catalogue & the Universal Damage Model [PROPOSED — awaiting platform wiring]`,
   where `<N>` is one greater than the highest existing `## <number>.` heading **at the time you
   write** — renumber mechanically if another content lane took your number while you were in flight.
   **Do not renumber, reword or delete any existing section.** Same text as `ARMS_CATALOGUE.md` §14.

**The shared-file protocol, and why the tail block is mandatory.** Lanes F, G, H, I and J all append
to `src/lib/imageLibrary.js` and `src/lib/wiki/entries.js` concurrently. One banner-commented block at
the tail of each array turns every cross-lane collision into the same mechanical conflict — two
adjacent tail blocks, resolved by **keeping both, in lane order** — instead of an unresolvable
interleave in the middle of a 1,000-line literal. A plate's `category` field is what groups it for the
UI; its position in the array is not. Your **new `IMAGE_CATEGORIES` key (`arms`) is the exception**:
it goes on its own line **inside the existing `IMAGE_CATEGORIES` object, adjacent to the keys already
there**, never in your tail block — one added line is a trivial conflict, a restructured object is
not. Never reorder, reflow, reformat or delete an existing row in either file.

---

## Contracts you consume

### From §4, produced by Lane A (rules core) and extended by Lane F (unit rows)

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
```

You consume this shape in exactly two ways and no other:

- **`SquadTypeKey`** — the value space of `WeaponPattern.appliesTo`. The guaranteed set is Lane A's
  nine: `riflemen, assault, gunners, scouts, mortars, pioneers, crawler, artillery, fighter`.
  Lane F's declared additions (`stormtroops, sappers, ski_troops, digger_corps, pilgrim_levy,
  provost, marksmen, flame_team, autocar_scouts, siege_mortar, land_dreadnought`) may also be used.
  **Do not import `tactical.ts`** — declare the union locally as `APPLIES_TO_KEYS` (Work item 15) and
  test against that. List every Lane F key you referenced in your PR body for reconciliation.
- **`SquadType` value keys** — the allowlist that `deriveLoadout`'s output keys must be a subset of:
  `figures, melee, ranged, range, armor, speed, morale, pts, specials`. Declare this locally as
  `SQUAD_VALUE_KEYS`.

`RegimentKey` (the value space of `Calibre.logisticsClass`) is the shipped column set — exactly
`riflemen`, `crawler`, `artillery`, `fighter` (`COLUMN_KEYS` in `base44/shared/tactical.ts`).

### From §4, the placeholder-plate contract (all content lanes)

```ts
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)  // url always null from a lane
```

### From §4, the effect-key vocabulary (read-only — you do not emit `effects[]`, but never invent keys)

> `unit.<type>.attack|defense|melee|ranged|armor|speed|morale`, `income.<steel|fuel|manpower>`,
> `armyCap`, `supplyRange`, `capitalDefense`, `initiative`, `losRange`, `digSpeed`,
> `fragmentYield`, `moraleTest`, `buildTurns`.

---

## Contracts you produce

This is the §4 "Arms Catalogue (Lane I)" block **verbatim**. Every shape below must be emitted
exactly — same field names, same value spaces, no renames, no omissions, no silent additions beyond
the amendment in Work item 20.

```ts
// ---- Arms Catalogue (Lane I) ----
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
// Squad rows gain `loadout?: Loadout`; deriveLoadout(squad) → Partial<SquadType values>, consumed by deriveSquad
// Every stand row gains `armour: ArmourClassKey` (infantry: none/soft/light via upgrade kits; vehicles: per facing, see below)
```

Also from §3, and binding on you:

> **`rollWeapon({ seed, class, maker?, calibre?, tierCap, luck })`** → deterministic `WeaponInstance`
> (pattern, quality, mods, quirks, serial) via the shared `mulberry32`. Odds tables live in
> `ARMS_CATALOGUE.md`. Battle loot, dig finds and armory certifications call this — Lane I supplies
> the function; the platform lane decides when it fires.

---

## Work items

Numbered and checkable. Every minimum is a number. Build in this order — 1–6 unblock Lane A.

### 1. Module skeleton — `base44/shared/arms.ts`

1.1 `arms.ts` is **plain JavaScript in a `.ts` file**, exactly as `base44/shared/tactical.ts` is.
No TypeScript syntax anywhere: no `interface`, no `type` aliases, no `: Type` annotations, no
`as`, no generics, no enums. The §4 block above is a *specification written in TS notation*, not
code you paste.

1.2 **Every exported table is a PURE DATA LITERAL** — `export const NAME = { ... }` or
`export const NAME = [ ... ]` containing only numbers, strings, booleans, `null`, and nested
objects/arrays. **Forbidden inside a table:** spread (`...`), computed keys (`[expr]:`), function
calls, template literals anywhere (keys or values), identifier references, arithmetic expressions
(`3 * 2`), and trailing method chains (`.map(...)`) even though `extractConst` tolerates an
allowlisted chain. **Reason:** `test/helpers/extract-const.js` lifts each table out of the file
**textually** with a brace matcher and evaluates it with `Function()`, because `base44/shared/*.ts`
is a Deno module that cannot be imported into Vitest. A computed table cannot be mirror-tested,
and a table that fails to lift reads as "the data drifted", which is exactly the wrong diagnosis.

1.3 `src/lib/arms.js` is the mirror: **identical table content, identical function bodies**, ES
module syntax, no `@/` import needed (it imports nothing). Unlike `src/lib/tactical/data.js`, the
arms mirror adds **no** UI-only fields — `label`, `blurb` and `lore` are already canonical in
`arms.ts`, so the deep-equal is strict in both directions.

1.4 No `Math.random` anywhere in either file. No `Date.now()`, no `crypto`, no mutable
module-level state. Every exported function is pure.

### 2. `mulberry32` — the one RNG

2.1 Declare it in `arms.ts` and mirror it verbatim, byte-for-byte identical to the shipped
implementation in `src/lib/macro/worlds.js`:

```js
export const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
```

2.2 Do **not** import it from `src/lib/macro/worlds.js` — a Deno shared module cannot import from
`src/`. Copying it is correct and is what Lane B is told to do as well.

### 3. `ARMOUR_CLASSES` — exactly 7 classes

3.1 Exactly the seven §4 keys, in this order, each `{ key, armourValue, sealed, blurb }`. `blurb`
is one Ministry-voice sentence. Use these values; if the Points Audit forces a change, the
invariants in 3.2 must still hold and every test in "Definition of done" must still pass.

| key | armourValue | sealed | what it is |
| --- | --- | --- | --- |
| `none` | 0 | false | Unprotected — a figure in a field coat |
| `soft` | 1 | false | Greatcoat, webbing, a sandbag lip |
| `light` | 3 | false | Sapper plate, an armoured car's skin, a foxhole |
| `medium` | 6 | true | A line crawler's hull |
| `heavy` | 10 | true | A breakthrough crawler's glacis |
| `superheavy` | 14 | true | A land-fort's belt |
| `fortified` | 12 | false | Poured works — a bunker, a keel's casemate |

3.2 Invariants (tested): exactly 7 entries; `armourValue` strictly increases across
`none < soft < light < medium < heavy < superheavy`; `fortified` sits between `heavy` and
`superheavy`; `medium`, `heavy` and `superheavy` are `sealed: true`; `none`, `soft`, `light` and
`fortified` are `sealed: false`.

### 4. `PEN_TABLE` — the penetration curve, with a mandatory `mult: 0` row

4.1 An **array**, sorted by `minDelta` **descending**. Lookup rule (`penMultFor(delta)`): return the
`mult` of the **first** row whose `minDelta <= delta`. Document the rule in `ARMS_CATALOGUE.md` §2.

```js
export const PEN_TABLE = [
  { minDelta: 6,    mult: 1.5 },   // overmatch — the plate is not the problem
  { minDelta: 3,    mult: 1.25 },
  { minDelta: 0,    mult: 1 },
  { minDelta: -2,   mult: 0.6 },
  { minDelta: -4,   mult: 0.3 },
  { minDelta: -6,   mult: 0.1 },
  { minDelta: -999, mult: 0 },     // MANDATORY (drift guard 12) — rifles cannot scratch a crawler
];
```

4.2 Use `-999`, never `-Infinity` — the literal must survive `Function()` evaluation and a
deep-equal across the mirror cleanly.

4.3 Invariants (tested): at least one row has `mult: 0`; `mult` is non-increasing as `minDelta`
decreases; the last row is the `mult: 0` row; `penMultFor` never returns `undefined` for any
integer delta in `[-999, 999]`.

### 5. `TYPE_MATRIX` — 7 damage types × 7 armour classes = 49 numbers

5.1 Every one of the 7 `DamageType` keys maps to an object with all 7 `ArmourClassKey` keys. No
gaps, no defaults, no fallbacks in code. Recommended table — the design intent in §3/§4 is
non-negotiable even if you re-tune the digits:

| type | none | soft | light | medium | heavy | superheavy | fortified |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `kinetic` | 1 | 1 | 0.95 | 0.9 | 0.8 | 0.7 | 0.6 |
| `explosive` | 1.1 | 1.15 | 1 | 0.85 | 0.7 | 0.55 | 0.9 |
| `shaped` | 0.5 | 0.5 | 0.9 | 1.25 | 1.4 | 1.45 | 1.2 |
| `incendiary` | 1.2 | 1.3 | 1.1 | 0.3 | 0.2 | 0.15 | 0.9 |
| `fragmentation` | 1.35 | 1.4 | 0.45 | 0.15 | 0.05 | 0 | 0.1 |
| `concussive` | 0.8 | 0.85 | 0.7 | 0.5 | 0.35 | 0.25 | 0.45 |
| `chemical` | 1.3 | 1.2 | 0.9 | 0 | 0 | 0 | 0.6 |

5.2 Invariants (tested, and these encode the §3 design statements literally):
- **shaped beats plate but wastes on soft:** `shaped.heavy > shaped.medium > shaped.light` and
  `shaped.soft < 0.75` and `shaped.heavy > kinetic.heavy`.
- **incendiary ignores plate but not sealed hulls:** for every `sealed: true` class,
  `incendiary[class] <= 0.35`; and `incendiary.soft > incendiary.medium`.
- **chemical is stopped dead by a sealed hull:** for every `sealed: true` class,
  `chemical[class] === 0`.
- **fragmentation shreds soft and is spent on light+:** `fragmentation.soft >= 1.3` and
  `fragmentation.light <= 0.5` and `fragmentation[c] <= fragmentation.light` for every class above
  `light`.
- Every value is a finite number `>= 0` and `<= 2`.

### 6. `resolveHit`, `resolveAoe`, `penMultFor` — the only armour math in the repository

6.1 `resolveHit({ weapon, target })` where `weapon` is a `WeaponBase` and `target` is an
`ArmourClass` **row** (not a key). Formula, documented verbatim in `ARMS_CATALOGUE.md` §2:

```
delta      = weapon.armorPen − target.armourValue
penMult    = penMultFor(delta)                       // PEN_TABLE
typeMult   = TYPE_MATRIX[weapon.damageType][target.key]
effective  = round4(weapon.damage × penMult × typeMult)
suppressOnly = effective === 0
```

6.2 The return object has **exactly two keys**: `effective` and `suppressOnly`. A test asserts
`Object.keys(result).sort()` deep-equals `['effective', 'suppressOnly']`. `effective` is rounded to
4 decimal places. `suppressOnly === true` means the hit did no damage but **still suppresses** — a
rifle volley pins a crawler's crew without hurting it. The numeric weight of that suppression is
declared once, as data:

```js
export const SUPPRESSION = { onZeroEffect: 0.5, concussiveBonus: 0.5 };
```

6.3 `resolveAoe({ weapon, victims })` where `victims` is
`[{ target: ArmourClass, dist: number }]` and `dist` is hexes from the burst centre. It **must call
`resolveHit` internally** — no second copy of the maths. Formula:

```
for each victim:
  if weapon.aoe === null            → skip (point fire hits only dist 0)
  if victim.dist > weapon.aoe.radius → skip
  falloffMult = max(0, 1 − weapon.aoe.falloff × victim.dist)
  hit = resolveHit({ weapon: { ...weapon, damage: round4(weapon.damage × falloffMult) }, target: victim.target })
```

Returns an array of `{ effective, suppressOnly }` in the input order, one per victim within radius,
each rolled **against that victim's own armour class** (§3). Skipped victims are omitted.

6.4 **No penetration, armour-value or type-matrix arithmetic exists anywhere outside these three
functions** — not in `deriveLoadout`, not in `rollWeapon`, not in the tests' helpers, not in
`motorPool.ts` (Lane J is forbidden from it too). Drift guard 12.

### 7. `MANUFACTURERS` — at least 8; author these 9

7.0 **⚠ Lane J appends to this table after you merge — author it so that append is trivial.** §3 Lane J:
*"Lane J appends motor-works to Lane I's `MANUFACTURERS`, keys `mw_*`, rather than duplicating the
table."* That is a sanctioned, append-only exception to the ownership rule, and it lands in **both**
`base44/shared/arms.ts` and `src/lib/arms.js`. Three obligations follow, and they are cheap now and
expensive later:

- **`MANUFACTURERS` is a flat object literal, one row per line-block, new rows appended at the end** —
  no spreads, no computed keys, no helper that builds it. (The pure-data-literal rule already forces
  this; this is why it also matters cross-lane.)
- **Never assert an exact `MANUFACTURERS` count anywhere.** Your gate is `>= 8` — with 9 authored, a
  `=== 9` assertion goes red the moment Lane J appends four `mw_*` rows, on `main`, in someone else's
  PR. The same applies to any per-manufacturer coverage assertion you write: if you assert *"every
  manufacturer has a `maker_<key>` plate"* or *"every manufacturer has a Codex entry"*, Lane J's rows
  must satisfy it too — so either scope the assertion to a hard-coded list of **your nine keys**, or
  accept that you are imposing the obligation on Lane J and say so in your PR body. Lane J's brief
  carries a documented fallback that abandons the append entirely if one of your tests goes red
  because of it; a needlessly strict assertion here costs that lane its contract with §3.
- List your nine keys in the PR body under a heading Lane J can read.

7.1 Nine required keys, each tied to a Great House or settlement culture from `docs/LORE.md` §6/§7
and `docs/FACTION_ROSTER.md`. `houseKey` uses the shipped ten-house key vocabulary (the same stems
as the `house_*_crest` plates already in `imageLibrary.js`): `reclamation, combine, synod, covenant,
ascendancy, commonweal, salvage, emberwright, procession, outrider`. Declare that list as
`HOUSE_KEYS` (a local allowlist for your access maps — it is not a claim on Lane H's data).

| key | tied to | signature lean (the house's consistent bias) |
| --- | --- | --- |
| `hundredweight_works` | Hundredweight Bottoms (mining combine, LORE §3 First Keel) | reliable and cheap; accuracy modest — the reference maker |
| `reclamation_state_arsenal` | `reclamation` | mass-issue: rate of fire up, reliability down, weight up |
| `emberwright_foundries` | `emberwright` | armour penetration up, weight up, rate of fire down |
| `ferrymen_shrine_armoury` | Nine Cradles / `synod` | accuracy up, reliability up, rate of fire down, weight up |
| `salvage_court_prize_yard` | `salvage` | rate of fire up, reliability well down, cheap |
| `crossloom_pattern_house` | Crossloom (waystation) | balanced, licensed widely, no strong lean but a real cost in weight |
| `ascendancy_signal_works` | `ascendancy` | range up, accuracy up, damage down |
| `outrider_wheelwrights` | `outrider` | weight down, range down, reliability up |
| `tarpool_burnworks` | Tarpool (burn-town) | incendiary and flame specialist: damage up, reliability down |

7.2 Each manufacturer row must carry:
- `signature: Partial<WeaponBase>` — **additive deltas** applied to every pattern that maker makes.
  **At least 2 keys, and at least one of them a genuine cost** (negative for
  `accuracy/rateOfFire/damage/armorPen/range/reliability`, or positive for `weight`, where lower is
  better). A signature that is all upside is rejected by test.
- `nameStems: string[]` — **at least 4 stems**. Every pattern that maker builds must have a `label`
  beginning with one of its stems (tested). E.g. `hundredweight_works` →
  `["Hundredweight", "Bottoms", "Sledge", "Combine"]`.
- `access: { [houseKey]: 'native'|'licensed'|'captured' }` — **all 10 house keys present**, and
  **at least one `native`**.
- `lore` — **60 to 100 words**, counted by `lore.trim().split(/\s+/).length`, and tested. Ministry
  voice, in-world, no real-world nations/brands/people, consistent with `docs/LORE.md`.
- `houseKey` **or** `culture` (at least one present).

7.3 The access cost multipliers are their own table:

```js
export const ACCESS_COST = { native: 1, licensed: 1.25, captured: 1.5 };
```

### 8. `CALIBRES` — at least 10; author these 15

8.1 Fifteen required keys. `class` is a `WeaponClass`; `logisticsClass` is one of
`riflemen | crawler | artillery | fighter` (the shipped `COLUMN_KEYS`, i.e. which regiment stock
feeds it). Each carries numeric `damage`, `armorPen`, `range` (hexes), `weight`, and `lore` naming
who standardised it. The `r13_line` cartridge is the one the shipped `standardized_calibers` tech
(`src/lib/doctrine.js`) is about — say so in its `lore`, do not edit that file.

| key | class | logisticsClass |
| --- | --- | --- |
| `p9_service` | `sidearm` | `riflemen` |
| `sm10_stub` | `smg` | `riflemen` |
| `c11_carbine` | `carbine` | `riflemen` |
| `r13_line` | `rifle` | `riflemen` |
| `r13_belt` | `lmg` | `riflemen` |
| `hr17_heavy` | `anti_armor` | `riflemen` |
| `sg20_bore` | `shotgun` | `riflemen` |
| `mg13_sustained` | `hmg` | `riflemen` |
| `fg2_fuel` | `flame` | `crawler` |
| `m50_bore` | `mortar` | `artillery` |
| `m81_bore` | `mortar` | `artillery` |
| `cg37_bore` | `crawler_gun` | `crawler` |
| `cg57_bore` | `crawler_gun` | `crawler` |
| `a105_shell` | `artillery` | `artillery` |
| `a150_shell` | `artillery` | `artillery` |
| `ac20_aircraft` | `aircraft_gun` | `fighter` |

(That is 16 rows — 15 is the floor, the sixteenth is free.)

8.2 Invariants (tested): every `class` is in `WEAPON_CLASSES`; every `logisticsClass` is in
`['riflemen','crawler','artillery','fighter']`; `damage`, `armorPen`, `range`, `weight` are finite
numbers `> 0`; `armorPen` increases monotonically across
`p9_service < c11_carbine < r13_line < hr17_heavy` and across `cg37_bore < cg57_bore`.

8.3 **Calibres have teeth.** A pattern must sit near its calibre's reference: for each of
`damage`, `armorPen`, `range`, `weight`, the pattern's `base` value is within **±50 %** of
`CALIBRES[pattern.calibre]`'s value. Tested for all 42 patterns. This is what stops a "rifle" that
is secretly an artillery piece.

### 9. `WEAPON_PATTERNS` — at least 42, hand-authored

9.1 **Minimum 42 patterns**, with these per-class floors so all 14 `WeaponClass` values are covered:

| class | min | class | min |
| --- | --- | --- | --- |
| `sidearm` | 3 | `marksman` | 3 |
| `carbine` | 3 | `anti_armor` | 3 |
| `rifle` | 6 | `flame` | 2 |
| `smg` | 3 | `mortar` | 3 |
| `lmg` | 3 | `crawler_gun` | 3 |
| `hmg` | 2 | `artillery` | 3 |
| `shotgun` | 2 | `aircraft_gun` | 2 |

9.2 **Nomenclature is a hard format**: `<maker name-stem> <3-digit pattern year> <name>, Mk <roman>`.
Example, and the reference pattern: `"Hundredweight 141 Levy Rifle, Mk II"`. Tested by regex:

```js
/^[A-Za-z'’-]+(?: [A-Za-z'’-]+)* \d{3} [A-Za-z0-9'’-]+(?: [A-Za-z0-9'’-]+)*, Mk [IVX]+$/
```

The 3-digit pattern year is the **F.I. year the pattern was certified** and must be
**between 141 and 383 inclusive** (`docs/LORE.md` §3.1: First March 141 F.I., the present 383 F.I.).
Tested by parsing the label. The label must begin with one of `MANUFACTURERS[maker].nameStems`.

9.3 The reference pattern key is **`hw141_levy_rifle_mk2`**, label
`"Hundredweight 141 Levy Rifle, Mk II"`, maker `hundredweight_works`, calibre `r13_line`,
class `rifle`, tier `'I'`, `pts: 1`. This is the baseline of the entire Points Audit and its `pts`
value is asserted to be exactly `1`.

9.4 Designate one `anti_armor` pattern as the **anti-armour reference** and record its key in
`POINTS_MODEL.aaReferenceKey` (Work item 16).

9.5 Every pattern row carries every §4 field: `key, label, maker, calibre, class, tier, base, slots,
quirks, pts, appliesTo, blurb`. `tier` is one of the §4 `SquadType` tier values —
`'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III'`. `blurb` is 1–2 Ministry-voice sentences.

9.6 `base` is a **complete `WeaponBase`** — all nine keys present on every pattern, no exceptions:
`accuracy, rateOfFire, damage, armorPen, range, reliability, weight, damageType, aoe`.
`damageType` is one of the 7. `aoe` is `null` for point fire, or
`{ radius: integer >= 1, falloff: number in (0, 1] }`. Tested for all 42.

9.7 `slots` ⊆ the 8 `ModSlot` values, **at least 2 slots per pattern**, no duplicates.
`quirks` ⊆ `Object.keys(QUIRKS)`. `appliesTo` ⊆ `APPLIES_TO_KEYS`, **at least 1 entry**.

9.8 **The design invariant the whole model exists to express** (tested as a sweep, Work item 22):
at `issue` grade with no mods and no quirks active, every pattern of class
`sidearm, carbine, rifle, smg, lmg, hmg, shotgun, marksman, flame` resolves to `effective === 0`
against **both** `heavy` and `superheavy`, while every pattern of class
`anti_armor, crawler_gun, artillery` resolves to `effective > 0` against `heavy`. Tune
`base.armorPen` until this holds. `mortar` and `aircraft_gun` are deliberately unconstrained.

### 10. `QUALITY_GRADES` — exactly 5

10.1 Exactly the five §4 keys. `mult` is **multiplicative** `Partial<WeaponBase>` (absent keys
default to 1). `rollWeight` is an integer; **the five weights sum to exactly 1000**.

```js
export const QUALITY_GRADES = {
  scrap:   { key: 'scrap',   mult: { damage: 0.85, accuracy: 0.85, rateOfFire: 0.9,  reliability: 0.75 }, ptsMult: 0.7,  rollWeight: 300 },
  issue:   { key: 'issue',   mult: { damage: 1,    accuracy: 1,    rateOfFire: 1,    reliability: 1 },    ptsMult: 1,    rollWeight: 420 },
  proofed: { key: 'proofed', mult: { damage: 1.08, accuracy: 1.1,  rateOfFire: 1.05, reliability: 1.1 },  ptsMult: 1.25, rollWeight: 190 },
  master:  { key: 'master',  mult: { damage: 1.18, accuracy: 1.22, rateOfFire: 1.12, reliability: 1.2 },  ptsMult: 1.6,  rollWeight: 75 },
  relic:   { key: 'relic',   mult: { damage: 1.35, accuracy: 1.4,  rateOfFire: 1.25, reliability: 1.3 },  ptsMult: 2.4,  rollWeight: 15 },
};
```

10.2 `issue` must be the neutral grade — every `mult` value exactly `1` (tested), because the entire
Points Audit is priced at `issue`.

10.3 **The grade's colour and visual are the Base44 session's, not yours** (§3). Reference grades by
`qualityKey` only. Do not name a colour anywhere.

10.4 Quality is **not** gated by `tierCap` — `tierCap` gates the *pattern* pool only. Document this
in `ARMS_CATALOGUE.md` §5, and it is what makes the distribution test in Work item 23 clean.

### 11. `MODIFICATIONS` — at least 26, at least 3 per slot, every one with a real tradeoff

11.1 **Minimum 26 mods**, and **at least 3 in each of the 8 `ModSlot` values**
(`barrel, optic, magazine, stock, muzzle, bayonet, ammunition, mount`).

11.2 `mods` and `tradeoff` are both `Partial<WeaponBase>` **additive deltas** (not multipliers —
only `QualityGrade.mult` is multiplicative). They must have **disjoint key sets**.

11.3 **Every mod's `tradeoff` is non-empty and genuinely a cost** (tested):
`Object.keys(mod.tradeoff).length >= 1`, and every entry is *worse* — negative for
`accuracy, rateOfFire, damage, armorPen, range, reliability`; positive for `weight`. `mods` must
likewise be non-empty and every entry a genuine benefit. The §3 examples are the standard: *bipod —
accuracy up, speed down; drum magazine — rate of fire up, reliability down; hollow-base rounds —
damage up, armour penetration down.*

11.4 `appliesTo` ⊆ `WEAPON_CLASSES`, at least 1 entry. `pts` is a finite number `>= 0`.
`label` and `blurb` in Ministry voice.

11.5 Mod keys live in `arms.ts` and are **never referenced from `base44/shared/tactical.ts`**. If a
mod's name reads like one of Lane F's `UPGRADES` rows (`drum_magazines`, `marksman_pattern`,
`gas_shells`…), that is fine — they are different layers — but say so in the PR body.

### 12. `QUIRKS` — at least 20, every one machine-evaluable

12.1 **Minimum 20 quirks**. Author the four named in §3 verbatim in spirit: *Cold-Forged*
(reliability +0.1 in snow), *Ferryman's Blessing* (morale +1 adjacent to a `relic_bearer`), *Runs
Hot* (rateOfFire +0.15, reliability −0.1 after 2 consecutive fire orders), *Prize-Taken* (+1 morale
when fielded against the maker's native house).

12.2 **"Machine-evaluable" is enforced, not asserted.** Declare the condition vocabulary as data and
an evaluator as a pure function:

```js
export const QUIRK_CONDITION_KEYS = {
  always:              { valueType: 'none' },
  weather:             { valueType: 'string' },   // 'clear'|'rain'|'snow'|'fog'|'storm'
  terrain:             { valueType: 'string' },
  night:               { valueType: 'none' },     // a dark-run (LORE §3.1)
  adjacent_specialist: { valueType: 'string' },   // a SpecialistKey
  consecutive_fire:    { valueType: 'number' },
  vs_house:            { valueType: 'string' },   // 'native_house' resolves to the maker's native house
  vs_armour_class:     { valueType: 'string' },
  quality_at_least:    { valueType: 'string' },
  range_at_most:       { valueType: 'number' },
  figures_at_least:    { valueType: 'number' },
  round_at_least:      { valueType: 'number' },
};

// evaluateQuirk(quirk, ctx) → boolean   (pure; unknown ctx fields read as "condition not met")
```

12.3 Tested: **every** quirk has a `condition`; `condition.key` ∈ `QUIRK_CONDITION_KEYS`; when the
declared `valueType` is `'string'` or `'number'`, `condition.value` is present and of that type;
when it is `'none'`, `condition.value` is absent. `evaluateQuirk` returns a boolean for every quirk
against both an empty context `{}` and a fully-populated context, and never throws.

12.4 `mods` is `Partial<WeaponBase>` **or** `{ morale?, initiative? }` (§4) — non-empty either way.
A morale/initiative quirk is surfaced by `loadoutProfile`, never by `deriveLoadout` (Work item 14).

### 13. `rollWeapon` — pure, seeded, and reproducible

13.1 Signature exactly `rollWeapon({ seed, class, maker, calibre, tierCap, luck })`. `class`,
`maker`, `calibre` are optional filters; `tierCap` is a tier string; `luck` is a number clamped to
`[-1, 1]`, default `0`. Returns a `WeaponInstance`:
`{ patternKey, quality, mods, quirks, serial }` — exactly those five keys.

13.2 **One `mulberry32(seed)` stream, drawn in this fixed, documented order.** Any change to the
order changes every historical roll; the order is part of the contract and is documented in
`ARMS_CATALOGUE.md` §9:

1. **pattern** — uniform pick from the filtered pool (filters: `class`, `maker`, `calibre`, and
   `tier` at or below `tierCap`), pool sorted by key ascending for determinism.
2. **quality** — weighted pick over the five `rollWeight`s adjusted by `luck` (13.3).
3. **mod count** — from `MOD_COUNT_BY_QUALITY` (13.4).
4. **each mod** — uniform pick from mods whose `slot` ∈ `pattern.slots` and whose `appliesTo`
   includes `pattern.class`; **no two mods may occupy the same slot**; pool sorted by key ascending.
5. **extra quirk count** — 0–2, uniform.
6. **each extra quirk** — uniform pick from `QUIRKS` keys not already on the pattern; sorted by key.
7. **serial** — 5 characters (13.5).

13.3 Luck is data, not code:

```js
export const LUCK_SLOPE = { scrap: -0.6, issue: -0.2, proofed: 0.2, master: 0.5, relic: 0.9 };
// adjustedWeight(g) = max(0, QUALITY_GRADES[g].rollWeight × (1 + clamp(luck, -1, 1) × LUCK_SLOPE[g]))
```

At `luck: 0` the adjusted weights are exactly the base weights — that is what Work item 23 tests.

13.4 Mod count is data too:

```js
export const MOD_COUNT_BY_QUALITY = { scrap: [0, 1], issue: [0, 1], proofed: [1, 2], master: [2, 3], relic: [2, 3] };
```
(inclusive `[min, max]`; a pick is clamped to the number of distinct slots actually available).

13.5 `serial` format: `` `${stem}-${year}-${five}` `` where `stem` is
`MANUFACTURERS[pattern.maker].nameStems[0].slice(0, 3).toUpperCase()`, `year` is the 3-digit pattern
year parsed from the label, and `five` is 5 characters drawn from `0-9A-Z` off the same stream.
Deterministic; tested for stability across runs.

13.6 **An empty pool throws loudly** — `throw new Error('rollWeapon: no pattern matches ...')` with
the filters named. It never returns `null`, never silently widens the filter. Tested.

13.7 `rollWeapon` never calls `Math.random`, never reads the clock, never mutates a module table.
The same `{ seed, ...opts }` returns a deeply-equal instance on every call, in any order, forever.

### 14. `resolveWeapon`, `deriveLoadout`, `loadoutProfile` — the reduction to squad numbers

14.1 `resolveWeapon(instance, ctx)` → a fully-resolved `WeaponBase`. **The application order is the
contract**, documented in `ARMS_CATALOGUE.md` §10:

```
1. b = copy of WEAPON_PATTERNS[instance.patternKey].base           (all 9 keys)
2. b = add(b, MANUFACTURERS[pattern.maker].signature)              (additive deltas)
3. b = mul(b, QUALITY_GRADES[instance.quality].mult)               (multiplicative; absent key = ×1)
4. for each mod in instance.mods:  b = add(b, mod.mods); b = add(b, mod.tradeoff)
5. for each quirk in pattern.quirks ∪ instance.quirks where evaluateQuirk(quirk, ctx):
      b = add(b, quirk.mods)                                       (WeaponBase keys only)
6. clamp: accuracy [0.05, 1.5] · reliability [0.05, 1] · rateOfFire [0.1, 12]
          damage >= 0 · armorPen >= 0 · range >= 0 · weight >= 0.1
7. damageType and aoe pass through from the pattern unchanged unless a mod/quirk sets them.
```

14.2 `deriveLoadout(squad)` where `squad` is `{ figures, loadout: Loadout, ... }`. Output keys must
be a **strict subset of §4 `SquadType` value keys** — this is a named acceptance criterion. Declare
both allowlists as data so the constraint is checkable rather than remembered:

```js
export const SQUAD_VALUE_KEYS = ['figures', 'melee', 'ranged', 'range', 'armor', 'speed', 'morale', 'pts', 'specials'];
export const LOADOUT_KEYS     = { melee: 'absolute', ranged: 'absolute', range: 'absolute', speed: 'delta', pts: 'delta' };
```

`LOADOUT_KEYS` tells Lane A what each returned key *means* so `deriveSquad` cannot guess wrong:
`absolute` replaces the `SquadType` base value; `delta` is added to it. Tested:
`Object.keys(deriveLoadout(...))` ⊆ `Object.keys(LOADOUT_KEYS)` ⊆ `SQUAD_VALUE_KEYS`.

14.3 The reduction formula — documented in `ARMS_CATALOGUE.md` §10 and implemented exactly:

```
shares: primary 1.00 · support 0.15 · sidearm 0.10          (export as LOADOUT_SHARES)
for each present instance w:  b = resolveWeapon(w, ctx)
  shots(w)  = b.rateOfFire × b.accuracy × b.reliability
  fire(w)   = b.damage × shots(w)
  bayonet(w)= b.melee-contribution from active 'bayonet'-slot mods and quirks (0 if none)

ranged = round2( Σ share_w × fire(w) )
range  = max over instances of b.range                       // the longest reach sets the squad's reach
melee  = round2( Σ share_w × bayonet(w) )
weight = Σ share_w × b.weight
speed  = −Math.floor( weight / WEIGHT_PER_SPEED_STEP )       // a delta, always ≤ 0; WEIGHT_PER_SPEED_STEP = 12
pts    = round2( Σ share_w × WEAPON_PATTERNS[w.patternKey].pts × QUALITY_GRADES[w.quality].ptsMult )
```

14.4 `loadoutProfile(squad)` → `{ armorPen, damageType, aoe, misfire }` — the squad's *primary*
weapon reduced to the three fields `resolveHit` needs, plus
`misfire = round2(clamp(0, 1 − b.reliability, 0.5))`. **This is what Lane A/C feeds into
`resolveHit` as the `weapon` argument.** It exists precisely so `deriveLoadout`'s keys can stay
inside `SQUAD_VALUE_KEYS` while the engine still has what it needs to resolve penetration — the
engine sees squad-level numbers and a damage profile, never a `WeaponInstance` (drift guard 11).

14.5 `deriveLoadout` and `loadoutProfile` are pure and never touch `Math.random`.

### 15. Vocabulary tables

Declare these as pure data literals so every test has an authority to check against rather than a
hard-coded list:

```js
export const DAMAGE_TYPES    = ['kinetic','explosive','shaped','incendiary','fragmentation','concussive','chemical'];
export const WEAPON_CLASSES  = ['sidearm','carbine','rifle','smg','lmg','hmg','shotgun','marksman','anti_armor','flame','mortar','crawler_gun','artillery','aircraft_gun'];
export const MOD_SLOTS       = ['barrel','optic','magazine','stock','muzzle','bayonet','ammunition','mount'];
export const HOUSE_KEYS      = ['reclamation','combine','synod','covenant','ascendancy','commonweal','salvage','emberwright','procession','outrider'];
export const APPLIES_TO_KEYS = [ /* Lane A's 9 + any Lane F keys you reference — see "Contracts you consume" */ ];
```

### 16. The Points Audit — mechanical, not prose

16.1 A points audit written by hand rots. Yours is computed, exported and tested. Declare the model
as data and the valuation as pure functions:

```js
export const POINTS_MODEL = {
  AP_RATE: <number>,              // anti-personnel value per point
  AA_RATE: <number>,              // anti-armour value per point — PRICED SEPARATELY
  rangeFactorDivisor: 20,
  apReferenceKey: 'hw141_levy_rifle_mk2',
  aaReferenceKey: '<your anti_armor reference pattern key>',
  efficiencyCap: 1.6,
};
```

```
issueBase(p)     = resolveWeapon({ patternKey: p.key, quality: 'issue', mods: [], quirks: [] }, {})
rangeFactor(b)   = 1 + b.range / POINTS_MODEL.rangeFactorDivisor
shots(b)         = b.rateOfFire × b.accuracy × b.reliability
apValue(p)       = round4( resolveHit({ weapon: issueBase(p), target: ARMOUR_CLASSES.soft  }).effective × shots × rangeFactor )
aaValue(p)       = round4( resolveHit({ weapon: issueBase(p), target: ARMOUR_CLASSES.heavy }).effective × shots × rangeFactor )
fairPts(p)       = round4( apValue(p) / AP_RATE + aaValue(p) / AA_RATE )
patternEfficiency(p) = round4( fairPts(p) / p.pts )
```

16.2 Calibrate `AP_RATE` and `AA_RATE` (they are two constants you choose) so that
`fairPts(hw141_levy_rifle_mk2)` equals `1` within `±0.005`, and so that the anti-armour reference
pattern's `aaValue / AA_RATE` term is a meaningful share of its own `fairPts` (`>= 0.4`). **Two
rates is what "anti-armour value priced separately from anti-personnel value" means mechanically** —
a heavy anti-tank rifle pays for its armour-killing term whether or not anyone fields infantry.

16.3 Tested, for **every** pattern: `patternEfficiency(p) <= POINTS_MODEL.efficiencyCap` (1.6).
Tested: `WEAPON_PATTERNS.hw141_levy_rifle_mk2.pts === 1`. Tested: for every pattern of class
`anti_armor`, `crawler_gun` or `artillery`, `aaValue(p) > 0`.

16.4 `docs/ARMS_CATALOGUE.md` §11 carries the audit as a full table — one row per pattern:
`key · class · maker · pts · apValue · aaValue · fairPts · efficiency` — with a line stating the
model and the two rates. Regenerate it whenever a number moves.

### 17. `docs/ARMS_CATALOGUE.md` — exactly these 14 sections

1. Purpose, scope and how to read this file
2. **The Universal Damage Model** — `ARMOUR_CLASSES`, `PEN_TABLE` (with the lookup rule),
   `TYPE_MATRIX` printed in full, `resolveHit`, `resolveAoe`, and the sentence that a zero-effect hit
   still suppresses
3. Manufacturers — lore, signature, name-stems, and the 9×10 access matrix
4. Calibres — the table, with logistics classes
5. Quality grades — the 5, the roll weights, and that quality is not tier-gated
6. Weapon patterns — the catalogue, grouped by class
7. Modifications — by slot, with each tradeoff spelled out
8. Quirks — the list and the condition vocabulary
9. `rollWeapon` — the draw order (all 7 steps) and the odds tables
10. `resolveWeapon` / `deriveLoadout` / `loadoutProfile` — the application order and the reduction formula
11. **Points Audit** — the full computed table (Work item 16.4)
12. Plate register — every plate key added, with category and aspect
13. **Codex Annex** — ready-to-paste `ENTRIES` rows for Lane H (Work item 19)
14. **`[PROPOSED — awaiting platform wiring]`** — the `GAME_RULES.md` section, written exactly as it
    should appear there, for the platform lane to promote

Ministry voice throughout. No colour names. No real-world nations, brands or people. No PII.

### 18. Placeholder plates in `src/lib/imageLibrary.js`

18.1 Add exactly one line **inside the existing `IMAGE_CATEGORIES` object**, adjacent to the keys
already there (never in your tail block), matching the existing style:

```js
arms: { label: "The Arms Catalogue", desc: "Weapon patterns, maker's marks and mod kits (TACTICAL_SQUAD_PLAN Lane I · docs/ARMS_CATALOGUE.md)" },
```

18.2 Append **one contiguous block** at the END of `IMAGE_LIBRARY` (before the closing `];`), opened
with a single banner comment naming your lane — `// ——— LANE I: arms ———` — using the existing
`P(...)` helper:

- `arms_<patternKey>` — one per weapon pattern (**≥ 42**), aspect `"16:9"`
- `maker_<manufacturerKey>` — one per manufacturer (**≥ 9**), aspect `"1:1"`
- `mod_kit_<modKey>` — one per modification (**≥ 26**), aspect `"1:1"`

Minimum **77 plates**. Appending as one block at the end is deliberate: Lanes F, G, H and J are
editing this same file concurrently, and a single tail block is the shape that merges cleanly.

18.3 **`url` is always `null`** — `P(...)` handles that via `PLATE_URLS[key] || null`. Never touch
`src/lib/imagePlates.js`. Never add an image file, an SVG, or a `UnitSprite.jsx` edit. **Content
lanes never ship visuals** (drift guard 10) — this is a data-and-prose lane, full stop.

18.4 Prompts: one sentence, naming the subject concretely. **Never repeat `HOUSE_STYLE`** — it is
prepended at generation. No colour-grading instructions, no artist names, no real-world weapon
names, no brands, no people.

18.5 Reproduce the full plate list in `docs/ARMS_CATALOGUE.md` §12 and in your PR body, so the
orchestrator can fold it into `docs/prompts/ART_MANIFEST.md` (which you must not edit).

### 19. Codex entries — every maker and every calibre

19.1 **≥ 9 maker entries + ≥ 15 calibre entries = ≥ 24 entries**, authored in
`docs/ARMS_CATALOGUE.md` §13 as literal rows in the `src/lib/wiki/entries.js` schema:
`{ id, title, folk?, category, tag, status, summary, blocks: [...], see: [...] }`.

19.2 Use `category: "powers"` for manufacturers and `category: "war"` for calibres.
`tag: "Arms Catalogue §3"` / `"Arms Catalogue §4"`. `status: "canon"` where `docs/LORE.md` supports
it, `"thin"` where you are extending into ground the lore bible does not cover — never invent canon
and mark it sealed. `see` cross-links to sibling entries by id, plus existing ids where genuinely
related (`the-ground`, `the-empire`, …).

19.3 **Ship them into `src/lib/wiki/entries.js`** as the one banner-commented tail block described in
"Owned files" — `// ——— LANE I: makers & calibres ———` appended at the END of the `ENTRIES` array —
**and** reproduce the identical rows in `ARMS_CATALOGUE.md` §13 as the catalogue of record. Never edit
an existing entry; never touch `CATEGORIES`, `STATUS`, `entryText` or `citedBy`.

19.4 `id` is a kebab-case slug unique across the **whole** array (`maker-hundredweight-works`,
`calibre-141-levy`, …). Every `see` target must resolve to a real entry id — the corpus is 100%
link-clean today and Lane H's acceptance depends on it staying that way, so assert it: add to
`test/arms-mirror.test.js` a case that imports `ENTRIES` from `@/lib/wiki/entries` and checks
(a) every `id` in the array is unique, (b) every `see` id across the whole array resolves, and
(c) your ≥24 ids are present. State in the PR body that the entries are **shipped**, not handed over.

19.5 Append your `[PROPOSED — awaiting platform wiring]` section to `docs/GAME_RULES.md` per the
owned-files note, keeping `ARMS_CATALOGUE.md` §14 as the identical text of record, and name the
section number you used in the PR body so the platform lane and the other content lanes can see which
numbers are taken.

### 20. The one permitted §4 amendment

`docs/TACTICAL_SQUAD_PLAN.md` §4 does not name four exports that the acceptance criteria force you
to build. Per §3 and §7, edit the contract first. Make **one append-only edit** inside the
`// ---- Arms Catalogue (Lane I) ----` block, adding exactly these comment lines and nothing else:

```
// resolveAoe({ weapon: WeaponBase, victims: [{ target: ArmourClass, dist }] }) → [{ effective, suppressOnly }] — calls resolveHit per victim, per-hex falloff
// resolveWeapon(instance: WeaponInstance, ctx) → WeaponBase — pattern → maker signature → quality → mods → active quirks → clamp
// loadoutProfile(squad) → { armorPen, damageType, aoe, misfire } — the squad's damage profile; Lane A/C feeds this to resolveHit
// evaluateQuirk(quirk, ctx) → boolean — the machine evaluation of Quirk.condition (vocabulary: QUIRK_CONDITION_KEYS)
```

Change nothing else in that file — not §3, not §5, not §6, not another lane's block. **State the
amendment explicitly in the PR body** under a heading "Contract sections touched".

### 21. `test/arms-mirror.test.js` — tables, mirror, and the damage model

Every assertion below is required. Group them into named `describe` blocks.

**21.a Mirror.** Using `readRepoFile` + `extractConst` from `test/helpers/extract-const.js` against
`base44/shared/arms.ts`, and a direct `import` of `@/lib/arms.js`:
1. Deep-equal, table by table, for all 22 pure-data tables:
   `ARMOUR_CLASSES, PEN_TABLE, TYPE_MATRIX, MANUFACTURERS, CALIBRES, WEAPON_PATTERNS,
   QUALITY_GRADES, MODIFICATIONS, QUIRKS, QUIRK_CONDITION_KEYS, ACCESS_COST, SUPPRESSION,
   LOADOUT_KEYS, LOADOUT_SHARES, SQUAD_VALUE_KEYS, POINTS_MODEL, LUCK_SLOPE,
   MOD_COUNT_BY_QUALITY, DAMAGE_TYPES, WEAPON_CLASSES, MOD_SLOTS, HOUSE_KEYS` (plus
   `APPLIES_TO_KEYS`).
2. The **exported-identifier sets are equal**: `[...src.matchAll(/export const (\w+)/g)]` on
   `arms.ts` deep-equals the same on `arms.js` (sorted).
3. **Function-source equality**: for each of `mulberry32, penMultFor, resolveHit, resolveAoe,
   resolveWeapon, evaluateQuirk, rollWeapon, deriveLoadout, loadoutProfile, apValue, aaValue,
   fairPts, patternEfficiency`, the source text in `arms.ts` and `arms.js` is identical after
   stripping the leading `export ` and collapsing whitespace. This is what stops the two copies of
   the *logic* drifting while the *tables* still match.

**21.b Damage model.** All of Work items 3.2, 4.3, 5.2, 6.2. Plus:
4. `TYPE_MATRIX` has exactly 7 type keys, each with exactly 7 class keys (49 numbers).
5. `resolveHit` returns exactly the keys `['effective','suppressOnly']`.
6. `resolveAoe` returns nothing for a `weapon.aoe === null`; drops victims beyond `radius`; and its
   `dist: 0` result equals `resolveHit`'s for the same weapon and target.
7. **Grep guard:** neither `arms.ts` nor `arms.js` contains `armourValue` arithmetic outside the
   three named functions — assert that the substring `armourValue` appears only within
   `penMultFor`/`resolveHit` (drift guard 12).

**21.c The centrepiece test (§3 acceptance, explicit).**
8. An `issue`-grade, un-modded `rifle`-class pattern (`hw141_levy_rifle_mk2`) resolves to
   `effective === 0` and `suppressOnly === true` against `ARMOUR_CLASSES.heavy`.
9. An `issue`-grade, un-modded `anti_armor`-class pattern resolves to `effective > 0` and
   `suppressOnly === false` against `ARMOUR_CLASSES.heavy`.
10. The **class sweep** of Work item 9.8, over every pattern in the catalogue.

**21.d Catalogue integrity.** Work items 7.2 (signature ≥2 keys with ≥1 cost; ≥4 name-stems; all 10
houses in `access` with ≥1 `native`; `lore` 60–100 words), 8.2, 8.3 (±50 % calibre coherence),
9.1 (counts and per-class floors), 9.2 (label regex + year 141–383 + stem prefix), 9.5–9.7
(complete `WeaponBase`, valid `damageType`, valid `aoe`, `slots`/`quirks`/`appliesTo` membership),
10.1 (5 grades, weights sum 1000), 10.2 (`issue` mult all 1), 11.1 (≥26 mods, ≥3 per slot), 11.3
(non-empty benefit and non-empty genuine tradeoff, disjoint keys), 12.3 (every quirk has a valid
condition; `evaluateQuirk` never throws).

**21.e Points Audit.** Work item 16.3 — `fairPts(baseline) ≈ 1`, `baseline.pts === 1`,
`patternEfficiency(p) <= 1.6` for all 42+, and `aaValue > 0` for every
`anti_armor`/`crawler_gun`/`artillery` pattern.

**21.f Plates and keys.** For every pattern an `arms_<key>` plate exists in `IMAGE_LIBRARY`; for
every manufacturer a `maker_<key>`; for every mod a `mod_kit_<key>`; the `arms` category exists in
`IMAGE_CATEGORIES`; every one of those plates has `url === null` and a non-empty `prompt` that does
**not** contain any substring of `HOUSE_STYLE`. (Import `IMAGE_LIBRARY`, `IMAGE_CATEGORIES` and
`HOUSE_STYLE` from `@/lib/imageLibrary.js`.)

### 22. `test/arms-roll.test.js` — determinism, distribution, purity

1. **No `Math.random`:** `readRepoFile('base44/shared/arms.ts')` and
   `readRepoFile('src/lib/arms.js')` contain no `Math.random`, no `Date.now`, no `crypto`.
2. **Same seed → identical instance:** `rollWeapon({ seed: 1234, tierCap: 'III', luck: 0 })` called
   twice is deeply equal; called after 100 unrelated rolls is still deeply equal; and matches a
   hard-coded expected instance snapshotted in the test (so a change to the draw order fails loudly).
3. **Different seeds diverge:** over seeds `1..200`, at least 20 distinct `patternKey` values and at
   least 3 distinct `quality` values appear.
4. **Filters honoured:** `rollWeapon({ seed, class: 'marksman' })` always yields a `marksman`
   pattern; `{ maker: 'emberwright_foundries' }` always yields that maker; a `tierCap: 'I'` roll
   never yields a pattern whose `tier` is above `'I'`.
5. **Empty pool throws** (Work item 13.6).
6. **Structural validity of every instance:** over seeds `1..500`, every instance has exactly the 5
   `WeaponInstance` keys; `patternKey` ∈ `WEAPON_PATTERNS`; `quality` ∈ `QUALITY_GRADES`; every mod
   key ∈ `MODIFICATIONS` with `slot` ∈ that pattern's `slots` and **no two mods sharing a slot**;
   every quirk key ∈ `QUIRKS`; `serial` matches `/^[A-Z]{3}-\d{3}-[0-9A-Z]{5}$/`.
7. **The 10 000-roll distribution test (§3 acceptance):** roll seeds `1..10000` with `luck: 0` and
   `tierCap: 'III'` and no class/maker/calibre filter. For each of the 5 grades, the observed share
   is within **2 percentage points** of `rollWeight / 1000`. Assert on all five, and name the
   observed shares in the failure message.
8. **`deriveLoadout` contract:** for a squad with a rolled primary + support + sidearm,
   `Object.keys(deriveLoadout(squad))` ⊆ `Object.keys(LOADOUT_KEYS)` ⊆ `SQUAD_VALUE_KEYS`; the
   `speed` value is `<= 0`; every returned value is a finite number; and the same squad returns a
   deeply-equal result on repeat calls.
9. **`loadoutProfile` contract:** returns exactly `['aoe','armorPen','damageType','misfire']`
   (sorted); `damageType` ∈ `DAMAGE_TYPES`; `misfire` in `[0, 0.5]`; and the result plugged into
   `resolveHit` against every one of the 7 armour classes returns a finite `effective >= 0`.
10. **`resolveWeapon` order:** a `master`-grade instance of the baseline pattern has strictly higher
    `damage` than an `issue`-grade one; adding a `tradeoff`-bearing mod moves the traded stat in the
    worse direction; a quirk whose `condition` is unmet contributes nothing.

---

## Acceptance criteria

**Copied verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane I:**

> Acceptance: mirror + roll tests green (same seed → identical instance; 10 000 rolls match the
> quality distribution within 2%); every pattern has an `arms_<key>` plate, every maker a
> `maker_<key>` plate, every mod a `mod_kit_<key>` plate; `deriveLoadout` output keys ⊆ §4
> `SquadType` value keys; Codex entries for every maker and calibre; no `Math.random` anywhere in
> the lane.

**Plus, lane-specific, each checkable by running something:**

| # | Criterion | How it is checked |
| --- | --- | --- |
| 1 | ≥ 8 manufacturers (this brief requires 9), each with a house/culture tie, a signature with a real cost, ≥4 name-stems, all 10 houses in `access` with ≥1 `native`, and 60–100 words of lore | `test/arms-mirror.test.js` §21.d |
| 2 | ≥ 10 calibres (this brief requires 15), each with a `logisticsClass` | §21.d |
| 3 | ≥ 40 hand-authored patterns (this brief requires 42) in in-world nomenclature, all 14 classes covered | §21.d, label regex + per-class floors |
| 4 | Exactly 5 quality grades: `scrap, issue, proofed, master, relic` | §21.d |
| 5 | ≥ 25 modifications (this brief requires 26) across the 8 slots, **every one with a non-empty numeric tradeoff** | §21.d |
| 6 | ≥ 20 quirks, **every one with a machine-evaluable `condition`** | §21.d + `evaluateQuirk` |
| 7 | `PEN_TABLE` contains a genuine `mult: 0` row | §21.b |
| 8 | An `issue` rifle-class weapon does **0** effective damage to a `heavy` target; an `anti_armor`-class weapon does not | §21.c — the named acceptance test |
| 9 | AoE rolls against each victim's own armour class with per-hex falloff | §21.b item 6 |
| 10 | `rollWeapon` is pure and seeded with `mulberry32`; no `Math.random` in the lane | `test/arms-roll.test.js` items 1, 2 |
| 11 | `deriveLoadout` reduces to `SquadType`-shaped values only, formula documented | `arms-roll.test.js` item 8 + `ARMS_CATALOGUE.md` §10 |
| 12 | Points Audit: every pattern priced at `issue` against `141 Levy Rifle = 1 pt/figure`; nothing above 1.6× baseline efficiency; anti-armour value priced separately | §21.e + `ARMS_CATALOGUE.md` §11 |
| 13 | Plates: `arms_<key>`, `maker_<key>`, `mod_kit_<key>`; new `imageLibrary` category `arms` | §21.f |
| 14 | Codex entries for every maker and every calibre (≥24) | `ARMS_CATALOGUE.md` §13, count stated in the PR body |
| 15 | No armour arithmetic anywhere outside `arms.ts`'s three named functions | §21.b item 7 |

---

## Drift guards

**The §6 list, in full. All thirteen apply to every PR; the starred ones bite hardest here.**

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it.
   UI-only fields are allowlisted in the test. *(For you: the same discipline applies between
   `arms.ts` and `arms.js`, enforced by `test/arms-mirror.test.js` — and with **no** UI-only
   allowlist, the mirror is strict.)*
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations,
   autoFormations, autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported.
   *(You never touch that file.)*
3. ★ **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind
   classes must be literal strings. *(You write no JSX; you also name no colour anywhere, including
   for quality grades — that is the Base44 session's.)*
5. ★ **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only. *(`@/` imports are for
   `src/` only — `base44/shared/arms.ts` uses no imports at all.)*
7. ★ **Numbers live in one place** — any balance constant referenced in UI copy is read from the
   data module, never retyped. Every number in `ARMS_CATALOGUE.md` must be the number in `arms.ts`.
8. ★ **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`.
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and
   flags `docs/GAME_RULES.md` for the platform lane. *(You do not own `COMBAT_DESIGN.md`; your rule
   numbers live in `ARMS_CATALOGUE.md`, and the `GAME_RULES.md` flag is §14 of that file plus a line
   in the PR body.)*
10. ★ **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no
    `UnitSprite.jsx` edits. Art is requested only as `imageLibrary.js` placeholders with `url: null`.
    **Existing catalog keys are never renamed or removed (live saves reference them.)** Every new
    mechanical effect uses the §4 effect-key vocabulary or extends it in the same PR.
11. ★ **Arms granularity stays numeric and server-rolled** — no weapon stat exists only in prose;
    every quirk carries a machine-evaluable `condition`; `rollWeapon` is pure and seeded (no
    `Math.random`); the tactical engine consumes only `deriveLoadout` output, never raw weapon
    instances.
12. ★ **One damage model** — armour math exists only in `arms.ts` (`ARMOUR_CLASSES`, `PEN_TABLE`,
    `TYPE_MATRIX`, `resolveHit`). Every weapon declares `armorPen`, `damageType` and `aoe`; every
    stand declares an `ArmourClass` (vehicles per facing). `PEN_TABLE` must contain a `mult: 0` row
    so light weapons are genuinely ineffective against heavy/superheavy armour; a zero-effect hit
    may still suppress. No lane re-implements penetration in its own file.
13. **Mechanized granularity mirrors arms** — Lane J's contract. You supply the tables it consumes;
    you do not write `motorPool.ts`.

**Environment rules — these are absolute:**

- ★ **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this
  checkout `node_modules` is a **symlink** to a shared store, and npm silently deletes the symlink
  and reifies a real directory in its place. Dependencies are already installed. There is no config
  knob for this; the damage is silent and total.
- ★ **NEVER edit `package.json` or `package-lock.json`** (drift guard 3). If something seems to need
  a package, it does not — solve it with what is installed.
- ★ **Every table exported from a `base44/shared/*.ts` file MUST be a PURE DATA LITERAL** —
  `export const NAME = { ... }` / `[ ... ]`, with **no spreads, no computed keys, no function calls,
  and no template literals in keys** — because the mirror tests lift it **textually** with
  `test/helpers/extract-const.js` and evaluate it. **A table that is computed cannot be
  mirror-tested.** Derived exports (`Object.keys(...)`) are permitted but must not appear in the
  mirror-compared table list.
- **`@/` imports only in `src/`.** No relative `src/` paths. `base44/shared/*` never imports from
  `src/`, and `src/lib/*` never imports from `base44/`.
- **No hex colours; no non-literal Tailwind class strings.** (Tailwind purges template-built class
  names; the build silently loses them.)
- **Ministry voice in every user-visible string** — in-world military-ministry English, diegetic.
- **Components ≤ ~60 lines, one component per file.** (You write none.)
- **Existing catalog keys are NEVER renamed or removed** — live saves reference them. Everything you
  write is additive; `arms.ts`, `arms.js` and `ARMS_CATALOGUE.md` are new files.
- **Numbers live in one place** — any constant shown in UI copy is imported from `src/lib`, never
  retyped.
- **Lore discipline:** no real-world nations, brands or people; no PII; names must not collide with
  existing names in `docs/LORE.md`, `docs/FACTION_ROSTER.md` or `docs/GEAR_LIBRARY.md` (`141 Levy
  Rifle` and `Marksman Pattern` already exist in `GEAR_LIBRARY.md` §6 — your `hw141_levy_rifle_mk2`
  is deliberately the same weapon, and your other patterns must not duplicate a `GEAR_LIBRARY` name
  with different numbers).
- ★ **You work in your OWN git worktree on branch `feat/tactical-i`** (`scripts/agent-worktree.sh`),
  push to `origin`, and open a PR against `main`. PR title: `tactical(i): <summary>`. The PR body
  lists the contract sections touched and the test names added. **You never edit another lane's
  files**; if a contract must change you edit `docs/TACTICAL_SQUAD_PLAN.md` §4 **first** and say so
  in the PR body (Work item 20 is the only amendment you are pre-authorised to make).
- **Never merge a red branch.** `main` is two-way synced with the Base44 Builder — a red merge
  breaks the live preview.

---

## Definition of done

Run these, in this order, from the repository root of your worktree. All three must be green before
the PR is opened.

```bash
npm test
npm run lint
bash .claude/hooks/rules-guard.sh < /dev/null
```

**What green looks like:**

- **`npm test`** — `vitest run` over `test/**/*.test.js`. Every pre-existing suite
  (`rules-mirror`, `macro-mirror`, `macro-engine-sim`, `macro-pacing`, `combat-math`,
  `extract-const`) still passes untouched, **plus** your two new files pass with zero failures and
  zero skipped tests. `test/arms-mirror.test.js` and `test/arms-roll.test.js` must appear in the
  output. If you touched no other lane's file, no other suite's count can change.
- **`npm run lint`** — `eslint . --quiet` exits `0` with no output. (`src/lib/**` and
  `base44/**` are outside the lint config's `files` globs, so your two modules are not linted —
  run it anyway to prove you broke nothing, and do not treat "not linted" as licence for sloppy
  code.)
- **`bash .claude/hooks/rules-guard.sh < /dev/null`** — exits `0` and prints nothing. It is a passive
  PostToolUse reminder that never blocks; a non-zero exit or an unexpected message means something
  is wrong with your invocation, not with the guard.

**Then verify by hand, and put the numbers in the PR body:**

```bash
# counts — every one must meet or beat its minimum
node -e "import('./src/lib/arms.js').then(m=>console.log(
  'makers',      Object.keys(m.MANUFACTURERS).length,   '>= 8',
  '| calibres',  Object.keys(m.CALIBRES).length,        '>= 10',
  '| patterns',  Object.keys(m.WEAPON_PATTERNS).length, '>= 40',
  '| grades',    Object.keys(m.QUALITY_GRADES).length,  '== 5',
  '| mods',      Object.keys(m.MODIFICATIONS).length,   '>= 25',
  '| quirks',    Object.keys(m.QUIRKS).length,          '>= 20'))"

# purity — both must print nothing
grep -n "Math.random\|Date.now\|crypto" base44/shared/arms.ts src/lib/arms.js

# plates — must print >= 42, >= 9, >= 26
grep -c 'P("arms_'     src/lib/imageLibrary.js
grep -c 'P("maker_'    src/lib/imageLibrary.js
grep -c 'P("mod_kit_'  src/lib/imageLibrary.js

# nothing outside the owned set changed
git status --porcelain
```

`git status --porcelain` must list **exactly** these nine paths and nothing else:

```
base44/shared/arms.ts
src/lib/arms.js
src/lib/imageLibrary.js
src/lib/wiki/entries.js
docs/ARMS_CATALOGUE.md
docs/GAME_RULES.md
docs/TACTICAL_SQUAD_PLAN.md
test/arms-mirror.test.js
test/arms-roll.test.js
```

`src/lib/wiki/entries.js` and `docs/GAME_RULES.md` are the two an earlier draft of this brief omitted,
because it told you to hand the Codex and the rules draft over as prose. They are yours to append to.
Every other path is drift — revert it before pushing.

**The PR body must state, as numbers:** manufacturers, calibres, patterns per class, quality grades,
modifications per slot, quirks, plates by prefix, Codex entries authored, tests added by name, the
§4 amendment made (Work item 20), and any Lane F `SquadTypeKey` you referenced that has not merged
yet.

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

