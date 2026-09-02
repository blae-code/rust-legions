# The Arms Catalogue

> **Ministry of Ordnance — Directorate of Small Arms and Ordnance Proof.**
> Pattern register, proof tables and points audit, current to 383 F.I.

---

## 1. Purpose, scope and how to read this file

"Rifles" is a class, not a weapon. A squad does not carry *rifles*; it carries a named pattern from a
named works, in a named calibre, at whatever grade the Ministry could certify that month, with
whatever a section armorer has bolted onto it since. This file is the register of all of it.

**Scope.** This document describes `base44/shared/arms.ts` and its mirror `src/lib/arms.js`. Those two
files are authority; this one is the reading copy. It is also **the single place in the repository
where armour mathematics exists** — §2 is the Universal Damage Model, and no other lane, module or
test may re-derive penetration.

**How to read it.**

- Every number printed here is generated from the module. Nothing is typed from memory.
- §11 (the Points Audit) is re-computed by `test/arms-mirror.test.js` and compared against the table
  below, cell by cell. §12 and §13 are diffed against what actually shipped in `src/lib/imageLibrary.js`
  and `src/lib/wiki/entries.js`. **A stale figure in this file is a failing test, not a reader's problem.**
- Deltas are written `+0.05` / `-0.1` and are **additive**. Only `QualityGrade.mult` is multiplicative.
- Where a grade, a house or a squad type is named, it is named by key. Colour and visual treatment
  are not this lane's to assign and appear nowhere in this file.

**The register at a glance.**

| Table | Rows | Floor |
| --- | --- | --- |
| `MANUFACTURERS` | 9 | ≥ 8 (Lane J appends `mw_*` after this lane merges — never assert an exact count) |
| `CALIBRES` | 16 | ≥ 10 |
| `WEAPON_PATTERNS` | 49 | ≥ 42, all 14 classes at or above their floor |
| `QUALITY_GRADES` | 5 | exactly 5 |
| `MODIFICATIONS` | 47 | ≥ 26, ≥ 3 in each of the 8 slots |
| `QUIRKS` | 33 | ≥ 20, every one with a machine-evaluable condition |
| `ARMOUR_CLASSES` | 7 | exactly 7 |
| `TYPE_MATRIX` | 7 × 7 | 49 numbers, no gaps |

---

## 2. The Universal Damage Model

This section is the reason the lane exists. Lane A imports `resolveHit` rather than writing its own
penetration code; Lane J keys its vehicle facings off `ARMOUR_CLASSES`. **No lane re-implements any of it.**

### 2.1 `ARMOUR_CLASSES` — what is being shot at

| key | armourValue | sealed | what it is |
| --- | --- | --- | --- |
| `none` | 0 | no | Cloth, courage and a field coat; the Ministry issues no plate to a levy and enters the omission as mobility. |
| `soft` | 1 | no | Greatcoat, webbing and a sandbag lip — enough to turn a spent fragment, and nothing that arrives with intent. |
| `light` | 3 | no | Sapper plate, an autocar's skin or a well-cut foxhole: proof against small arms at distance and against nothing at hand. |
| `medium` | 6 | **yes** | A line crawler's riveted hull, sealed against fume and flame, and the standard by which the ordnance boards price a gun. |
| `heavy` | 10 | **yes** | A breakthrough crawler's glacis — face-hardened, sloped and sealed; rifle fire arrives on it as weather. |
| `superheavy` | 14 | **yes** | A land-fort's belt, laid in courses like masonry; the board keeps a separate ledger for what has ever moved it. |
| `fortified` | 12 | no | Poured works — a bunker, a keel's casemate: thicker than any hull, and full of men who must go on breathing. |


`armourValue` rises strictly across `none < soft < light < medium < heavy < superheavy`, and
`fortified` sits between `heavy` and `superheavy` — poured works are thicker than a crawler and
thinner than a land-fort's belt. **`sealed` is not a synonym for thick.** It means the crew breathe
their own air: the three sealed classes are `medium`, `heavy` and `superheavy`, and `fortified` is
deliberately **not** one of them, because a bunker has embrasures and a casemate has a hatch. That
single boolean is what lets chemical and incendiary behave like chemical and incendiary.

### 2.2 `PEN_TABLE` — the penetration curve

`delta = weapon.armorPen − target.armourValue`. The lookup rule, `penMultFor(delta)`:
**return the `mult` of the FIRST row whose `minDelta <= delta`**, reading the table top to bottom.
The table is sorted by `minDelta` descending, so the first match is always the tightest one.

| minDelta | mult | reading |
| --- | --- | --- |
| `6` | 1.5 | overmatch — the plate is not the problem |
| `3` | 1.25 | clean penetration with margin |
| `0` | 1 | penetration, exactly as designed |
| `-2` | 0.6 | partial — the plate is winning |
| `-4` | 0.3 | partial — the plate is winning |
| `-6` | 0.1 | partial — the plate is winning |
| `-999` | 0 | **the mandatory zero row** — a rifle cannot scratch a crawler |


`-999` is used rather than `-Infinity`: the literal has to survive being lifted out of the file
textually and evaluated, and `-Infinity` does not round-trip cleanly through a deep-equal.
`penMultFor` returns a number for every integer delta in `[-999, 999]` — there is no `undefined` in
this model and no default branch in the code.

### 2.3 `TYPE_MATRIX` — 7 damage types × 7 armour classes

| type | `none` | `soft` | `light` | `medium` | `heavy` | `superheavy` | `fortified` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `kinetic` | 1 | 1 | 0.95 | 0.9 | 0.8 | 0.7 | 0.6 |
| `explosive` | 1.1 | 1.15 | 1 | 0.85 | 0.7 | 0.55 | 0.9 |
| `shaped` | 0.5 | 0.5 | 0.9 | 1.25 | 1.4 | 1.45 | 1.2 |
| `incendiary` | 1.2 | 1.3 | 1.1 | 0.3 | 0.2 | 0.15 | 0.9 |
| `fragmentation` | 1.35 | 1.4 | 0.45 | 0.15 | 0.05 | **0** | 0.1 |
| `concussive` | 0.8 | 0.85 | 0.7 | 0.5 | 0.35 | 0.25 | 0.45 |
| `chemical` | 1.3 | 1.2 | 0.9 | **0** | **0** | **0** | 0.6 |


The four design statements the matrix exists to make, each of them asserted in test:

- **Shaped charges beat plate and waste themselves on cloth.** `shaped` rises across
  `light → medium → heavy` (0.9 → 1.25 → 1.4) and beats `kinetic` against `heavy`
  (1.4 vs 0.8), while against `soft` it is 0.5 — the jet punches straight through a man and out the other side.
- **Fire ignores plate but not a sealed hull.** `incendiary` is 1.3 against `soft` and no more than
  0.3 against any sealed class.
- **Gas is stopped dead by a sealed hull.** `chemical` is exactly **0** against `medium`, `heavy` and
  `superheavy`, and 0.6 against `fortified`, because a bunker has embrasures.
- **Fragmentation shreds soft targets and is spent on anything plated.** 1.4 against `soft`,
  0.45 against `light`, and never more than that against anything heavier.

### 2.4 `resolveHit` — the whole of the arithmetic

```
delta        = weapon.armorPen − target.armourValue
penMult      = penMultFor(delta)                      // PEN_TABLE, first matching row
typeMult     = TYPE_MATRIX[weapon.damageType][target.key]
effective    = round4(weapon.damage × penMult × typeMult)
suppressOnly = effective === 0
```

`target` is an `ArmourClass` **row**, not a key. The return object has **exactly two keys** —
`effective` and `suppressOnly` — and a test asserts that, because a third key would be a place for a
second damage model to grow.

**A zero-effect hit still suppresses.** `suppressOnly: true` does not mean *nothing happened*: it
means the volley pinned the crew without hurting the vehicle. The weight of that is declared once,
as data, for the engine to read:

```js
export const SUPPRESSION = { onZeroEffect: 0.5, concussiveBonus: 0.5 };
```

### 2.5 `resolveAoe` — area fire, per victim, per victim's own armour

```
for each victim { target, dist }:
  if weapon.aoe === null             → skip   (point fire hits only what it was aimed at)
  if victim.dist > weapon.aoe.radius → skip   (omitted from the result entirely)
  falloffMult = max(0, 1 − weapon.aoe.falloff × victim.dist)
  hit = resolveHit({ weapon: { ...weapon, damage: round4(weapon.damage × falloffMult) }, target: victim.target })
```

It **calls `resolveHit`** — there is no second copy of the maths, and at `dist: 0` its result is
identical to a direct `resolveHit`, which is asserted. Each victim is resolved against **its own**
armour class, so one bomb landing between a rifle section and a crawler does two different things.

---

## 3. Manufacturers

Nine works, each tied to a Great House or a settlement culture. A maker's **signature** is a set of
additive deltas applied to *every* pattern it builds, and **every signature carries a real cost** —
a works with nothing but upside is a works nobody has to make a decision about.

### The Hundredweight Combine Works — `hundredweight_works`

*Culture `hundredweight_bottoms` · native to `reclamation`, `commonweal` · 8 patterns in the register*

The Combine Works began as the maintenance shop of a mining concern and has never entirely stopped behaving like one. Its patterns are heavy, plain and forgiving: oversized chambers, coarse threads, sights a frightened man can still find in the dark. Ordnance boards across the Ground price every other weapon against a Hundredweight, and the Works is quietly proud of that and quietly poor because of it. It licenses freely, holds no house's warrant, and stamps each receiver with the tonnage mark of the seam it was born over.

- **Signature:** `accuracy` -0.03, `reliability` +0.06, `weight` +0.2
- **Name-stems:** *Hundredweight* · *Bottoms* · *Sledge* · *Combine*

### The State Arsenal of the Reclamation — `reclamation_state_arsenal`

*House `reclamation` · native to `reclamation` · 7 patterns in the register*

The State Arsenal exists to arm a levy faster than the levy can be raised. Its shops are measured in shifts rather than craftsmen, and its patterns are drawn around that fact: stamped housings, generous tolerances, a cyclic rate that empties a magazine before the holder can think better of it. Unity is the doctrine and the defect — an Arsenal weapon fits any Reclamation hand and stops in any weather the drawings did not anticipate. The Arsenal holds that a rifle outliving its bearer was a rifle overbuilt.

- **Signature:** `rateOfFire` +0.35, `reliability` -0.07, `weight` +0.4
- **Name-stems:** *Verdict* · *Levy* · *State* · *Ironworks* · *Unity*

### The Emberwright Union Foundries — `emberwright_foundries`

*House `emberwright` · native to `emberwright` · 7 patterns in the register*

Ash-scarred and methodical, the Foundries answer every question with steel. Emberwright barrels run thicker than the drawings require, their breeches are proofed twice, and their shot is cut to bite plate rather than flesh. Union engineers publish tolerances the way parishes publish hymns and will argue a decimal for a season. What they will not do is make anything light. An Emberwright weapon is carried by two men or by a crawler, arrives late to every advance, and opens whatever the advance found waiting for it.

- **Signature:** `armorPen` +0.5, `rateOfFire` -0.2, `weight` +0.9
- **Name-stems:** *Emberwright* · *Winter* · *Cinder* · *Forgeworks* · *Anvilgate*

### The Ferrymen's Shrine-Armoury — `ferrymen_shrine_armoury`

*House `synod` · culture `nine_cradles` · native to `synod`, `procession` · 4 patterns in the register*

Weapons leave the shrine-armoury of the Nine Cradles blessed, numbered and slower than the front would like. Each is fitted by one hand from breech to muzzle: barrel lapped, trigger stoned, stock cut from cradle timber and inscribed with the fitter's name and the date of the vigil. The Ferrymen hold that a weapon is a promise kept in metal, and that promises are not mass-produced. Line officers who have carried one rarely surrender it at rotation, and the Armoury's ledgers have quietly stopped pretending otherwise.

- **Signature:** `accuracy` +0.06, `reliability` +0.05, `rateOfFire` -0.25, `weight` +0.6
- **Name-stems:** *Cradle* · *Ferryman* · *Reliquary* · *Vigilant* · *Ninefold*

### The Prize Yard of the Salvage Court — `salvage_court_prize_yard`

*House `salvage` · native to `salvage` · 5 patterns in the register*

The Prize Yard does not manufacture so much as adjudicate. Captured receivers are re-bored, mismatched furniture is married, and the whole is stamped with a writ number and sold to the party who lost it, at a mark-up the Court considers just. Yard patterns fire fast, weigh little and fail without warning; the warranty is the writ, and the writ is the point. Bailiff-armourers boast that nothing in the yard was ever bought, and that nothing sold out of it has ever been returned.

- **Signature:** `rateOfFire` +0.4, `reliability` -0.14, `weight` -0.2
- **Name-stems:** *Prizeyard* · *Writ* · *Knife* · *Adjudicated* · *Bailiff*

### The Crossloom Pattern House — `crossloom_pattern_house`

*Culture `crossloom` · native to `combine` · 7 patterns in the register*

Crossloom sells drawings, not favours. The pattern house was chartered so that a keel could refit at the Meet-ground without asking anyone's permission, and its designs are deliberately unremarkable: nothing brilliant, nothing brittle, no component beyond the reach of a middling workshop. The price is mass — a Crossloom weapon carries all the metal it takes to be repairable anywhere. Ten houses hold licences and none holds the drawings, which is precisely the arrangement the waystation's neutrality was built to survive.

- **Signature:** `accuracy` +0.02, `reliability` +0.03, `weight` +0.8
- **Name-stems:** *Crossloom* · *Waymark* · *Knotwork* · *Tollgate* · *Openhand*

### The Signal Works of the Ascendancy — `ascendancy_signal_works`

*House `ascendancy` · native to `ascendancy` · 4 patterns in the register*

The Signal Works builds instruments that happen to shoot. Its barrels are long, its sights are ground glass, its ranging tables are printed on the stock, and its projectiles are light enough to be pushed further than a sensible ordnance board would push them. The Ascendancy holds that a shot seen and recorded at distance is worth more than a shot that merely kills nearby — a doctrine its riflemen find easier to admire than to survive. Every receiver carries a transmission serial as well as a number.

- **Signature:** `range` +1, `accuracy` +0.07, `damage` -0.35
- **Name-stems:** *Testimony* · *Copperline* · *Longear* · *Beacon* · *Antenna*

### The Outrider Wheelwrights — `outrider_wheelwrights`

*House `outrider` · native to `outrider` · 3 patterns in the register*

The Wheelwrights arm people who must carry everything they own at a trot. Their patterns are short, thin-walled and stripped of every ounce the Compact could argue away, with sealed actions that will run a season in dust without seeing a bench. What was traded away is reach: an Outrider weapon is decisive at conversational distance and merely irritating beyond it. Couriers accept the bargain, on the reasoning that a rifle which is present weighs more, in the end, than a rifle that was left behind.

- **Signature:** `weight` -0.9, `reliability` +0.05, `range` -0.8
- **Name-stems:** *Outrider* · *Dustpromise* · *Wheelwright* · *Skimline* · *Courier*

### The Tarpool Burnworks — `tarpool_burnworks`

*Culture `tarpool` · native to `emberwright` · 4 patterns in the register*

The Burnworks grew out of a seam fire that has never been put out, and its trade has followed the flame ever since: thickened fuels, incendiary fillings and the projectors that deliver them. Tarpool sells to every house at once and considers that a moral position. Its patterns hit far harder than their weight suggests and are trusted by no quartermaster alive — pressure vessels sweat, valves stick, and the works' own proof-house has burned to the ground three times. Prices are posted daily, in chalk.

- **Signature:** `damage` +0.45, `reliability` -0.12
- **Name-stems:** *Tarpool* · *Seamfire* · *Burnworks* · *Slagline* · *Firetongue*

### 3.1 The access matrix

What it costs a house to field a works' patterns. `native` ×1 · `licensed` ×1.25 · `captured` ×1.5.

| works | `reclamation` | `combine` | `synod` | `covenant` | `ascendancy` | `commonweal` | `salvage` | `emberwright` | `procession` | `outrider` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hundredweight_works` | **native** | licensed | licensed | licensed | licensed | **native** | captured | licensed | licensed | licensed |
| `reclamation_state_arsenal` | **native** | licensed | captured | captured | licensed | licensed | captured | licensed | captured | captured |
| `emberwright_foundries` | licensed | licensed | captured | captured | licensed | licensed | captured | **native** | captured | licensed |
| `ferrymen_shrine_armoury` | captured | licensed | **native** | captured | licensed | licensed | captured | captured | **native** | licensed |
| `salvage_court_prize_yard` | captured | licensed | captured | captured | captured | captured | **native** | captured | captured | licensed |
| `crossloom_pattern_house` | licensed | **native** | licensed | licensed | licensed | licensed | licensed | licensed | captured | licensed |
| `ascendancy_signal_works` | captured | licensed | licensed | captured | **native** | licensed | captured | captured | captured | licensed |
| `outrider_wheelwrights` | captured | licensed | captured | licensed | captured | licensed | licensed | captured | captured | **native** |
| `tarpool_burnworks` | licensed | licensed | captured | captured | licensed | licensed | licensed | **native** | licensed | licensed |

---

## 4. Calibres

A calibre is the reference the pattern is held to. **A pattern's `base` sits within ±50 % of its
calibre's figure on every one of `damage`, `armorPen`, `range` and `weight`** — that band is what
stops a "rifle" being an artillery piece with a rifle's paperwork, and it is asserted for all
49 patterns.

`logisticsClass` names which regiment's stock feeds the round — the four shipped column keys.

| key | label | class | logistics | damage | armorPen | range | weight | patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `p9_service` | P.9 Service Round | `sidearm` | `riflemen` | 1.6 | 1 | 2 | 1.1 | 3 |
| `sm10_stub` | S.M.10 Stub Cartridge | `smg` | `riflemen` | 1.4 | 1 | 3 | 3.4 | 3 |
| `c11_carbine` | C.11 Short Rifle Cartridge | `carbine` | `riflemen` | 2.2 | 2 | 5 | 3.6 | 3 |
| `r13_line` | R.13 Line Cartridge | `rifle` | `riflemen` | 2.8 | 2.5 | 7 | 4.3 | 10 |
| `r13_belt` | R.13 Belt Link | `lmg` | `riflemen` | 2.8 | 2.5 | 8 | 9.8 | 3 |
| `hr17_heavy` | H.R.17 Heavy Rifle Round | `anti_armor` | `riflemen` | 5.5 | 8 | 6 | 16.5 | 3 |
| `sg20_bore` | 20-Bore Trench Shell | `shotgun` | `riflemen` | 3.6 | 1 | 2 | 3.9 | 2 |
| `mg13_sustained` | M.G.13 Sustained-Fire Link | `hmg` | `riflemen` | 3.2 | 3 | 9 | 26 | 3 |
| `fg2_fuel` | F.G.2 Thickened Fuel Grade | `flame` | `crawler` | 4 | 1 | 2 | 21 | 3 |
| `m50_bore` | 50 mm Light Mortar Bomb | `mortar` | `artillery` | 4.5 | 2 | 9 | 18 | 4 |
| `m81_bore` | 81 mm Mortar Bomb | `mortar` | `artillery` | 7.5 | 3 | 13 | 56 | 2 |
| `cg37_bore` | 37 mm Crawler Gun Shot | `crawler_gun` | `crawler` | 6.5 | 9 | 10 | 95 | 2 |
| `cg57_bore` | 57 mm Crawler Gun Shell | `crawler_gun` | `crawler` | 10 | 13 | 12 | 160 | 2 |
| `a105_shell` | 105 mm Field Shell | `artillery` | `artillery` | 14 | 7 | 16 | 290 | 2 |
| `a150_shell` | 150 mm Siege Shell | `artillery` | `artillery` | 22 | 10 | 20 | 520 | 2 |
| `ac20_aircraft` | 20 mm Aircraft Cannon Shell | `aircraft_gun` | `fighter` | 7 | 6 | 6 | 48 | 2 |


**`r13_line` is the cartridge the shipped `standardized_calibers` doctrine is about** — *"one
cartridge for every rifle on the front, no more scavenging mismatched rounds"*. The doctrine row in
`src/lib/doctrine.js` is authority and is not edited by this lane; this catalogue only names the round.

Armour penetration rises monotonically across the rifle family
(`p9_service` 1 → `c11_carbine` 2 → `r13_line` 2.5 → `hr17_heavy` 8) and across the
crawler guns (`cg37_bore` 9 → `cg57_bore` 13). Both are asserted.

---

## 5. Quality grades

Five grades. `mult` is **multiplicative** and an absent key is ×1 — `issue` is the neutral grade,
every one of its multipliers is exactly 1, and **the entire Points Audit in §11 is priced at `issue`**.

| key | damage | accuracy | rateOfFire | reliability | ptsMult | rollWeight | share |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scrap` | ×0.85 | ×0.85 | ×0.9 | ×0.75 | ×0.7 | 300 | 30.0 % |
| `issue` | ×1 | ×1 | ×1 | ×1 | ×1 | 420 | 42.0 % |
| `proofed` | ×1.08 | ×1.1 | ×1.05 | ×1.1 | ×1.25 | 190 | 19.0 % |
| `master` | ×1.18 | ×1.22 | ×1.12 | ×1.2 | ×1.6 | 75 | 7.5 % |
| `relic` | ×1.35 | ×1.4 | ×1.25 | ×1.3 | ×2.4 | 15 | 1.5 % |


The five `rollWeight`s sum to exactly **1000**, which is what makes the share column a percentage
and the 10 000-roll distribution test in `test/arms-roll.test.js` meaningful.

**Quality is NOT gated by `tierCap`.** `tierCap` gates the *pattern pool* and nothing else. A tier-I
roll can and does produce a `relic`-grade Levy Rifle — that is a dug-out heirloom in the hands of a
conscript, and it is exactly the outcome the model is for. It is also what makes the distribution
test clean: the grade shares do not move when the pool does.

Grade **colour and visual treatment are not this lane's to assign** and are named nowhere in this file.

---

## 6. Weapon patterns

**49 hand-authored patterns.** Nomenclature is a hard format —
`<maker name-stem> <3-digit pattern year> <name>, Mk <roman>` — and the year is the **F.I. year the
pattern was certified**, between 141 (the First March) and 383 (the present). Both are asserted by
regex over every row.

`aoe` is `null` for point fire, or `{ radius, falloff }` in hexes. `tier` is a `SquadType` tier value.

Tier spread: `I` 26 · `II:Cache` 4 · `II:Ciph` 4 · `II:Eng` 10 · `II:Wake` 3 · `III` 2.

### `sidearm` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Reliquary 188 Officer's Sidearm, Mk II**<br>`fs188_reliquary_officers_sidearm_mk2` | `ferrymen shrine armoury` | `p9_service` | `II:Wake` | 0.62 | 0.9 | 1.9 | 1.1 | 3 | 0.92 | 1.45 | `kinetic` | — | 0.65 |
| **Bottoms 166 Pit Revolver, Mk I**<br>`hw166_bottoms_pit_revolver_mk1` | `hundredweight works` | `p9_service` | `I` | 0.5 | 1.2 | 1.7 | 1 | 2 | 0.9 | 1.2 | `kinetic` | — | 0.6 |
| **Writ 214 Yard Automatic, Mk III**<br>`sy214_writ_yard_automatic_mk3` | `salvage court prize yard` | `p9_service` | `I` | 0.42 | 2 | 1.5 | 0.9 | 2 | 0.72 | 0.95 | `kinetic` | — | 0.35 |


- **Reliquary 188 Officer's Sidearm, Mk II** — Fitted by one hand, numbered against a vigil, and issued with a detachable shoulder stock nobody has ever been seen to use. Officers who carry one decline to surrender it at rotation, and the Armoury has stopped asking.
  *slots* `barrel` `optic` `stock` · *quirks* `hand_lapped` `ferrymans_blessing` · *issued to* `riflemen` `provost` `marksmen`
- **Bottoms 166 Pit Revolver, Mk I** — Six chambers, a frame a pit-boss could beat straight on an anvil, and a lanyard ring because the Works assumed it would be dropped. It has settled more disputes over a seam than over an enemy.
  *slots* `barrel` `ammunition` `stock` · *quirks* `gallery_worked` · *issued to* `riflemen` `pioneers` `provost`
- **Writ 214 Yard Automatic, Mk III** — Adjudicated from four incompatible frames and sold back to the party that lost three of them. It empties in a breath, and the Yard's warranty is the writ number stamped over the old maker's mark.
  *slots* `magazine` `barrel` `muzzle` · *quirks* `prize_taken` `barrel_droop` · *issued to* `assault` `scouts` `provost`

### `carbine` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Sledge 203 Short Rifle, Mk I**<br>`hw203_sledge_short_rifle_mk1` | `hundredweight works` | `c11_carbine` | `I` | 0.5 | 1.1 | 2.4 | 2.2 | 5 | 0.9 | 3.5 | `kinetic` | — | 0.95 |
| **Courier 197 Dust Carbine, Mk II**<br>`ow197_courier_dust_carbine_mk2` | `outrider wheelwrights` | `c11_carbine` | `I` | 0.52 | 1.3 | 2.1 | 2 | 4 | 0.88 | 2.6 | `kinetic` | — | 0.85 |
| **Unity 241 Column Carbine, Mk IV**<br>`rs241_unity_column_carbine_mk4` | `reclamation state arsenal` | `c11_carbine` | `I` | 0.46 | 1.6 | 2.2 | 2 | 4 | 0.78 | 3.9 | `kinetic` | — | 0.9 |


- **Sledge 203 Short Rifle, Mk I** — The line rifle with a hand of barrel taken off it, for men who work in galleries and load onto wagons. The Works cut the sights down to match and priced it as a saving rather than a compromise.
  *slots* `barrel` `bayonet` `stock` · *quirks* `gallery_worked` · *issued to* `riflemen` `pioneers` `digger_corps`
- **Courier 197 Dust Carbine, Mk II** — Thin-walled, sealed at the action and stripped of every ounce the Compact could argue away. It rides a season in dust without seeing a bench and stops mattering at any distance a courier would rather not be at.
  *slots* `barrel` `stock` `magazine` · *quirks* `dust_sealed` `close_bound` · *issued to* `scouts` `autocar_scouts` `ski_troops`
- **Unity 241 Column Carbine, Mk IV** — Stamped by the shift rather than the craftsman, and issued to whoever is riding the column that week. It fits every Reclamation hand and stops in every weather the drawings did not anticipate.
  *slots* `magazine` `stock` `bayonet` · *quirks* `runs_hot` · *issued to* `riflemen` `assault` `autocar_scouts`

### `rifle` — 7 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Copperline 268 Long Rifle, Mk II**<br>`as268_copperline_long_rifle_mk2` | `ascendancy signal works` | `r13_line` | `II:Ciph` | 0.58 | 0.9 | 2.3 | 2.5 | 10 | 0.84 | 5.2 | `kinetic` | — | 1.05 |
| **Waymark 252 Pattern Rifle, Mk I**<br>`cl252_waymark_pattern_rifle_mk1` | `crossloom pattern house` | `r13_line` | `I` | 0.57 | 1.1 | 2.9 | 2.6 | 8 | 0.87 | 5.4 | `kinetic` | — | 1.2 |
| **Cinder 276 Breaching Rifle, Mk I**<br>`em276_cinder_breaching_rifle_mk1` | `emberwright foundries` | `r13_line` | `II:Eng` | 0.52 | 0.8 | 3.4 | 3.3 | 7 | 0.88 | 6.2 | `kinetic` | — | 0.9 |
| **Ninefold 159 Vigil Rifle, Mk I**<br>`fs159_ninefold_vigil_rifle_mk1` | `ferrymen shrine armoury` | `r13_line` | `II:Wake` | 0.64 | 0.8 | 3 | 2.7 | 9 | 0.9 | 5.8 | `kinetic` | — | 1.15 |
| **Hundredweight 141 Levy Rifle, Mk II**<br>`hw141_levy_rifle_mk2` | `hundredweight works` | `r13_line` | `I` | 0.55 | 1 | 2.8 | 2.5 | 7 | 0.85 | 4.3 | `kinetic` | — | 1 |
| **Dustpromise 311 Field Rifle, Mk II**<br>`ow311_dustpromise_field_rifle_mk2` | `outrider wheelwrights` | `r13_line` | `I` | 0.53 | 1.2 | 2.6 | 2.4 | 6 | 0.89 | 3.4 | `kinetic` | — | 1.05 |
| **Verdict 229 Service Rifle, Mk III**<br>`rs229_verdict_service_rifle_mk3` | `reclamation state arsenal` | `r13_line` | `I` | 0.5 | 1.8 | 2.7 | 2.4 | 6 | 0.76 | 5.1 | `kinetic` | — | 1.5 |


- **Copperline 268 Long Rifle, Mk II** — A long barrel, a light bullet and a ranging table printed on the stock, on the Ascendancy's reasoning that a shot recorded at distance is worth more than a shot that merely kills nearby. Its riflemen find that doctrine easier to admire than to survive.
  *slots* `optic` `barrel` `stock` · *quirks* `ranged_by_wire` · *issued to* `riflemen` `marksmen` `scouts`
- **Waymark 252 Pattern Rifle, Mk I** — Nothing brilliant and nothing brittle: no component in it is beyond the reach of a middling workshop, which is exactly what the waystation chartered the house to guarantee. The price is metal, and the Meet-ground pays it gladly.
  *slots* `barrel` `optic` `stock` `bayonet` · *quirks* `proof_stamped` · *issued to* `riflemen` `provost` `pilgrim_levy`
- **Cinder 276 Breaching Rifle, Mk I** — Proofed twice, chambered tight and loaded hot, for the men who go through a firing slit rather than past it. It is the heaviest thing the Foundries will admit is still a rifle, and it is at the ceiling of what a rifle is permitted to open.
  *slots* `barrel` `muzzle` `bayonet` · *quirks* `cold_forged` `plate_hungry` · *issued to* `riflemen` `sappers` `stormtroops`
- **Ninefold 159 Vigil Rifle, Mk I** — Barrel lapped, trigger stoned, stock cut from cradle timber and inscribed with the fitter's name and the date of the vigil. Nine Cradles holds that a weapon is a promise kept in metal; the front holds that promises are slow.
  *slots* `optic` `barrel` `bayonet` `stock` · *quirks* `ferrymans_blessing` `hand_lapped` · *issued to* `riflemen` `pilgrim_levy` `marksmen`
- **Hundredweight 141 Levy Rifle, Mk II** — The rifle the First March was fought with and the rifle every ordnance board still prices against: plain, forgiving, and certified in the year the Ministry started counting. One point per figure, and the whole ledger is drawn from it.
  *slots* `barrel` `optic` `stock` `bayonet` · *quirks* `settles_in` · *issued to* `riflemen` `pilgrim_levy` `pioneers`
- **Dustpromise 311 Field Rifle, Mk II** — The lightest full-calibre rifle anyone on the Ground will sell you, and the Wheelwrights will tell you what it cost: a hand of reach and a barrel that walks when it gets hot. A rifle that is present weighs more, in the end, than one left behind.
  *slots* `stock` `magazine` `optic` · *quirks* `dust_sealed` · *issued to* `riflemen` `scouts` `autocar_scouts` `ski_troops`
- **Verdict 229 Service Rifle, Mk III** — A self-loader drawn around the shift clock: generous tolerances, a gas port that will pass anything, and a cyclic rate that empties the magazine before the holder can think better of it. The Arsenal considers a rifle that outlives its bearer to have been overbuilt.
  *slots* `magazine` `bayonet` `muzzle` `stock` · *quirks* `runs_hot` · *issued to* `riflemen` `assault` `stormtroops`

### `smg` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Skimline 259 Saddle Gun, Mk I**<br>`ow259_skimline_saddle_gun_mk1` | `outrider wheelwrights` | `sm10_stub` | `I` | 0.44 | 2.8 | 1.5 | 1.1 | 3 | 0.86 | 2.2 | `kinetic` | — | 1 |
| **Levy 236 Trench Automatic, Mk II**<br>`rs236_levy_trench_automatic_mk2` | `reclamation state arsenal` | `sm10_stub` | `I` | 0.4 | 3.4 | 1.4 | 1 | 3 | 0.75 | 3.8 | `kinetic` | — | 1.05 |
| **Knife 288 Room Gun, Mk V**<br>`sy288_knife_room_gun_mk5` | `salvage court prize yard` | `sm10_stub` | `I` | 0.36 | 3.8 | 1.3 | 0.9 | 2 | 0.66 | 2.6 | `kinetic` | — | 0.45 |


- **Skimline 259 Saddle Gun, Mk I** — Made to be fired one-handed off a moving running board and stowed under a seat for a week afterwards. The folding stock is the only ounce the Wheelwrights did not argue away, and they argued about it.
  *slots* `stock` `magazine` `muzzle` · *quirks* `dust_sealed` `short_stocked` · *issued to* `autocar_scouts` `scouts` `ski_troops`
- **Levy 236 Trench Automatic, Mk II** — Pressed housings, a bolt like a length of bar stock, and a stub cartridge chosen so a levy could be armed for a room rather than a field. Nothing in it is precise and nothing in it is expensive.
  *slots* `magazine` `stock` `muzzle` · *quirks* `runs_hot` `close_bound` · *issued to* `assault` `stormtroops` `riflemen`
- **Knife 288 Room Gun, Mk V** — Fifth mark, fourth original maker, and no two in a crate quite alike. Bailiff-armourers sell it by the armful for boarding work and decline, politely, to discuss the fifth magazine.
  *slots* `magazine` `barrel` · *quirks* `prize_taken` `point_blank_bite` · *issued to* `assault` `provost` `sappers`

### `lmg` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Knotwork 274 Light Gun, Mk I**<br>`cl274_knotwork_light_gun_mk1` | `crossloom pattern house` | `r13_belt` | `II:Eng` | 0.48 | 2.4 | 3 | 2.7 | 9 | 0.88 | 13.2 | `kinetic` | — | 2.6 |
| **Combine 184 Squad Automatic, Mk III**<br>`hw184_combine_squad_automatic_mk3` | `hundredweight works` | `r13_belt` | `I` | 0.45 | 2.6 | 2.8 | 2.5 | 8 | 0.86 | 10.4 | `kinetic` | — | 2.1 |
| **Ironworks 257 Belt Gun, Mk II**<br>`rs257_ironworks_belt_gun_mk2` | `reclamation state arsenal` | `r13_belt` | `I` | 0.4 | 3.2 | 2.9 | 2.5 | 8 | 0.74 | 12.5 | `kinetic` | — | 2.3 |


- **Knotwork 274 Light Gun, Mk I** — Drawn so that a middling workshop can make the parts and any house can hold the licence, which is why its belts fit guns that fit nothing else. It is heavier than its rivals and outlasts all of them.
  *slots* `mount` `optic` `barrel` `magazine` · *quirks* `proof_stamped` `loaders_mate` · *issued to* `gunners` `provost` `pilgrim_levy`
- **Combine 184 Squad Automatic, Mk III** — One man carries it, one man carries the belt, and the squad's rifles feed from the same crate — which was the entire argument for the link. Quick-change barrel, coarse threads, and a bipod stiff enough to lever a wagon.
  *slots* `barrel` `magazine` `mount` `stock` · *quirks* `crew_drilled` · *issued to* `gunners` `riflemen` `pioneers`
- **Ironworks 257 Belt Gun, Mk II** — The Arsenal's answer to a machine-gun is more machine-gun: a cyclic rate no gunner asked for and a barrel that must be changed before the doctrine says it must. It wins a firefight in the first minute or not at all.
  *slots* `magazine` `barrel` `mount` · *quirks* `runs_hot` `belt_shared` · *issued to* `gunners` `assault` `stormtroops`

### `hmg` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Tollgate 206 Sustained Gun, Mk II**<br>`cl206_tollgate_sustained_gun_mk2` | `crossloom pattern house` | `mg13_sustained` | `I` | 0.46 | 4 | 3.2 | 3 | 10 | 0.9 | 28 | `kinetic` | — | 3.9 |
| **Anvilgate 233 Heavy Gun, Mk I**<br>`em233_anvilgate_heavy_gun_mk1` | `emberwright foundries` | `mg13_sustained` | `II:Eng` | 0.44 | 3.2 | 3.8 | 3.4 | 11 | 0.9 | 34 | `kinetic` | — | 4 |
| **State 299 Pintle Gun, Mk IV**<br>`rs299_state_pintle_gun_mk4` | `reclamation state arsenal` | `mg13_sustained` | `I` | 0.38 | 5 | 3 | 2.9 | 9 | 0.72 | 24 | `kinetic` | — | 3.2 |


- **Tollgate 206 Sustained Gun, Mk II** — Water-jacketed, tripod-fed and expected to fire all night without anyone's opinion being sought. The Pattern House licenses the drawings to every house on the Ground, and every house has mounted it on something.
  *slots* `mount` `barrel` `magazine` `optic` · *quirks* `crew_drilled` `loaders_mate` · *issued to* `gunners` `crawler` `land_dreadnought`
- **Anvilgate 233 Heavy Gun, Mk I** — A gun cut to bite an autocar's skin rather than the man behind it, at the absolute ceiling of what the Foundries are allowed to call a machine-gun. Two men lift it; a crawler carries it; a line crawler ignores it.
  *slots* `mount` `barrel` `ammunition` · *quirks* `cold_forged` `barrel_droop` · *issued to* `gunners` `crawler` `land_dreadnought`
- **State 299 Pintle Gun, Mk IV** — Fitted to hatch rings, wing roots and anything else with a pintle, on the Arsenal's view that a stoppage on a mount is cheaper than a stoppage in a hand. It is loud, wasteful and always where it was needed.
  *slots* `mount` `magazine` `muzzle` · *quirks* `runs_hot` `belt_shared` · *issued to* `crawler` `fighter` `gunners`

### `shotgun` — 2 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Sledge 218 Trench Sweeper, Mk I**<br>`hw218_sledge_trench_sweeper_mk1` | `hundredweight works` | `sg20_bore` | `I` | 0.54 | 1.1 | 4.2 | 1.2 | 3 | 0.9 | 4.6 | `fragmentation` | — | 1.6 |
| **Bailiff 245 Boarding Gun, Mk II**<br>`sy245_bailiff_boarding_gun_mk2` | `salvage court prize yard` | `sg20_bore` | `I` | 0.5 | 1.4 | 3.8 | 1 | 2 | 0.74 | 3.4 | `fragmentation` | — | 1.4 |


- **Sledge 218 Trench Sweeper, Mk I** — A gallery gun before it was a trench gun: heavy walls, a long bayonet lug and a paper shell of buck the Works has never seen a reason to improve. It clears a firebay in one pull and reloads slowly enough to regret it.
  *slots* `barrel` `bayonet` `ammunition` `stock` · *quirks* `point_blank_bite` `gallery_worked` · *issued to* `riflemen` `pioneers` `digger_corps`
- **Bailiff 245 Boarding Gun, Mk II** — The bore forgives a barrel nobody has measured, which is why the Yard standardised on it for boarding work. Ruinous against a greatcoat at the length of a gangway, and an insult to plate at any distance whatever.
  *slots* `barrel` `ammunition` `bayonet` · *quirks* `prize_taken` `point_blank_bite` · *issued to* `assault` `provost` `sappers`

### `marksman` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Longear 294 Ranging Rifle, Mk I**<br>`as294_longear_ranging_rifle_mk1` | `ascendancy signal works` | `r13_line` | `II:Ciph` | 0.82 | 0.5 | 2.2 | 2.5 | 10 | 0.85 | 5.6 | `kinetic` | — | 0.8 |
| **Ferryman 171 Watch Rifle, Mk II**<br>`fs171_ferryman_watch_rifle_mk2` | `ferrymen shrine armoury` | `r13_line` | `II:Wake` | 0.78 | 0.6 | 3.2 | 2.8 | 10 | 0.92 | 6 | `kinetic` | — | 1 |
| **Bottoms 262 Selected Rifle, Mk III**<br>`hw262_bottoms_selected_rifle_mk3` | `hundredweight works` | `r13_line` | `I` | 0.68 | 0.9 | 2.9 | 2.6 | 9 | 0.9 | 4.8 | `kinetic` | — | 1.45 |


- **Longear 294 Ranging Rifle, Mk I** — An instrument that happens to shoot: the sight is the weapon and the barrel is its mounting. Signal Works marksmen are trained to report the fall of shot before they are trained to reload.
  *slots* `optic` `barrel` `ammunition` · *quirks* `ranged_by_wire` `dark_run_sights` · *issued to* `marksmen` `scouts`
- **Ferryman 171 Watch Rifle, Mk II** — Selected from the vigil rifles by the fitter who made them and kept back for the watch that stands over a crossing. Ground glass, a stoned trigger, and a rate of fire that assumes one shot was the plan.
  *slots* `optic` `barrel` `stock` `ammunition` · *quirks* `hand_lapped` `settles_in` · *issued to* `marksmen` `scouts` `riflemen`
- **Bottoms 262 Selected Rifle, Mk III** — Not designed: chosen. Every hundredth levy rifle off the line shoots better than the ninety-nine around it, and the Works has built a whole doctrine out of putting a sight on that one and saying nothing further.
  *slots* `optic` `stock` `bayonet` · *quirks* `settles_in` `glare_cut_sights` · *issued to* `marksmen` `riflemen` `provost`

### `anti_armor` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Openhand 281 Shaped Lance, Mk I**<br>`cl281_openhand_shaped_lance_mk1` | `crossloom pattern house` | `hr17_heavy` | `II:Eng` | 0.46 | 0.4 | 7.5 | 9 | 4 | 0.8 | 12 | `shaped` | — | 2.4 |
| **Winter 214 Anti-Crawler Rifle, Mk II**<br>`em214_winter_anti_crawler_rifle_mk2` | `emberwright foundries` | `hr17_heavy` | `II:Eng` | 0.5 | 0.6 | 5.5 | 8 | 6 | 0.85 | 18 | `kinetic` | — | 2.3 |
| **Sledge 302 Shoulder Gun, Mk I**<br>`hw302_sledge_shoulder_gun_mk1` | `hundredweight works` | `hr17_heavy` | `I` | 0.42 | 0.5 | 6.4 | 7 | 3 | 0.86 | 9.5 | `shaped` | r1 ƒ0.6 | 1.7 |


- **Openhand 281 Shaped Lance, Mk I** — A tube, a lined cone and a drawing anyone may hold: the Pattern House published it rather than sell it, and every house on the Ground has since made its own. The jet needs plate to bite, and finds men a waste of a charge.
  *slots* `optic` `ammunition` `mount` · *quirks* `plate_hungry` `proof_stamped` · *issued to* `sappers` `pioneers` `assault` `stormtroops`
- **Winter 214 Anti-Crawler Rifle, Mk II** — The Foundries' answer to the first crawler that walked through a rifle company: a long tapered case, a hardened core, and a recoil the Union has never pretended to have solved. It is issued by the round and answered for by the round.
  *slots* `barrel` `optic` `ammunition` `mount` · *quirks* `cold_forged` `plate_hungry` · *issued to* `gunners` `sappers` `riflemen`
- **Sledge 302 Shoulder Gun, Mk I** — The cheap answer, and the Works is not ashamed of it: a stamped tube, a coarse sight and a charge that must be walked to within a stone's throw of the hull. Everything about it assumes the man carrying it would rather be elsewhere.
  *slots* `ammunition` `stock` · *quirks* `close_bound` `plate_hungry` · *issued to* `riflemen` `assault` `pioneers` `ski_troops`

### `flame` — 3 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Bottoms 249 Gallery Burner, Mk I**<br>`hw249_bottoms_gallery_burner_mk1` | `hundredweight works` | `fg2_fuel` | `I` | 0.58 | 1 | 3.6 | 0.9 | 2 | 0.84 | 19 | `incendiary` | r1 ƒ0.6 | 1.1 |
| **Seamfire 226 Trench Projector, Mk II**<br>`tp226_seamfire_trench_projector_mk2` | `tarpool burnworks` | `fg2_fuel` | `I` | 0.6 | 1.2 | 4.4 | 1 | 2 | 0.7 | 22 | `incendiary` | r1 ƒ0.5 | 2 |
| **Slagline 305 Hull Projector, Mk I**<br>`tp305_slagline_hull_projector_mk1` | `tarpool burnworks` | `fg2_fuel` | `II:Eng` | 0.62 | 1.6 | 5.2 | 1.2 | 3 | 0.68 | 30 | `incendiary` | r2 ƒ0.4 | 3 |


- **Bottoms 249 Gallery Burner, Mk I** — A mining tool the Works never bothered to redraw for the front: lower pressure, thinner fuel, and valves a gallery crew can strip by lamplight. It burns a working face clear, and a trench is only a working face on its side.
  *slots* `ammunition` `stock` `barrel` · *quirks* `gallery_worked` `close_bound` · *issued to* `digger_corps` `pioneers` `flame_team`
- **Seamfire 226 Trench Projector, Mk II** — Thickened seam tar thrown from a pressure vessel nobody enjoys carrying, over a parapet and through a firing slit. It drives a garrison off its loopholes and has never once opened a hull.
  *slots* `barrel` `ammunition` `mount` · *quirks* `runs_hot` `point_blank_bite` · *issued to* `flame_team` `pioneers` `sappers`
- **Slagline 305 Hull Projector, Mk I** — The projector a crawler carries instead of a man: a bow mounting, a hull tank and a reach that finally justifies the pressure. Quartermasters cost it as ammunition and insurers decline it entirely.
  *slots* `mount` `ammunition` `barrel` · *quirks* `runs_hot` · *issued to* `crawler` `flame_team` `land_dreadnought`

### `mortar` — 6 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Crossloom 221 Light Mortar, Mk II**<br>`cl221_crossloom_light_mortar_mk2` | `crossloom pattern house` | `m50_bore` | `I` | 0.5 | 1.4 | 4.5 | 2 | 9 | 0.9 | 19 | `fragmentation` | r2 ƒ0.35 | 2.8 |
| **Forgeworks 239 Battalion Mortar, Mk I**<br>`em239_forgeworks_battalion_mortar_mk1` | `emberwright foundries` | `m81_bore` | `II:Eng` | 0.48 | 0.9 | 7.8 | 3.2 | 13 | 0.88 | 58 | `fragmentation` | r3 ƒ0.3 | 3.6 |
| **Verdict 263 Commune Mortar, Mk III**<br>`rs263_verdict_commune_mortar_mk3` | `reclamation state arsenal` | `m50_bore` | `I` | 0.42 | 2 | 4.2 | 1.8 | 8 | 0.76 | 16 | `fragmentation` | r2 ƒ0.4 | 2.6 |
| **State 278 Concussion Mortar, Mk II**<br>`rs278_state_concussion_mortar_mk2` | `reclamation state arsenal` | `m50_bore` | `I` | 0.4 | 2.2 | 6 | 2.4 | 9 | 0.76 | 21 | `concussive` | r2 ƒ0.3 | 2.4 |
| **Firetongue 313 Incendiary Mortar, Mk I**<br>`tp313_firetongue_incendiary_mortar_mk1` | `tarpool burnworks` | `m50_bore` | `II:Cache` | 0.44 | 1.2 | 5.6 | 2.2 | 8 | 0.72 | 20 | `incendiary` | r2 ƒ0.35 | 2.4 |
| **Tarpool 317 Fume Mortar, Mk I**<br>`tp317_tarpool_fume_mortar_mk1` | `tarpool burnworks` | `m81_bore` | `II:Cache` | 0.45 | 0.7 | 7 | 4.2 | 12 | 0.74 | 62 | `chemical` | r3 ƒ0.15 | 2.5 |


- **Crossloom 221 Light Mortar, Mk II** — Baseplate, tube and a bag of finned bombs one man can carry six of — the licence is free and the drawings are posted at the Meet-ground. It answers a machine-gun without waiting on a battery, which is the whole of its argument.
  *slots* `mount` `ammunition` `optic` · *quirks* `loaders_mate` `proof_stamped` · *issued to* `mortars` `riflemen` `pioneers`
- **Forgeworks 239 Battalion Mortar, Mk I** — The battalion bore, cut thick and proofed twice because the Foundries do not believe in thin tubes. It reaches over any ridge on the field and arrives with enough case to settle what is behind it.
  *slots* `mount` `optic` `ammunition` · *quirks* `cold_forged` `settles_in` · *issued to* `mortars` `siege_mortar` `artillery`
- **Verdict 263 Commune Mortar, Mk III** — Thin-walled, generous with case, and dropped down the tube faster than the crew can be told to stop. The Arsenal prints the safe rate on the baseplate and has never expected it to be observed.
  *slots* `mount` `ammunition` `magazine` · *quirks* `crew_drilled` · *issued to* `mortars` `assault` `pilgrim_levy`
- **State 278 Concussion Mortar, Mk II** — A blast bomb with almost no case: it kills badly and pins beautifully, which is exactly what the Arsenal bought it for. Ordnance boards price it as suppression and score it as nothing at all.
  *slots* `mount` `ammunition` `muzzle` · *quirks* `crew_drilled` `ledger_kept` · *issued to* `mortars` `assault` `stormtroops`
- **Firetongue 313 Incendiary Mortar, Mk I** — The Burnworks' filling in somebody else's bomb, which is how Tarpool prefers to sell anything. It puts fire on a position the projector teams cannot walk to, and it will not be quenched by anyone still in it.
  *slots* `mount` `ammunition` `optic` · *quirks* `settles_in` · *issued to* `mortars` `flame_team` `pilgrim_levy`
- **Tarpool 317 Fume Mortar, Mk I** — The Burnworks sells the filling to every house at once and calls that a moral position. It empties a trench line and a poured work of everyone who must go on breathing, and it does not scratch a sealed hull.
  *slots* `mount` `ammunition` `optic` · *quirks* `mire_shod` `ledger_kept` · *issued to* `mortars` `siege_mortar` `pioneers`

### `crawler_gun` — 4 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Tollgate 318 Casemate Gun, Mk I**<br>`cl318_tollgate_casemate_gun_mk1` | `crossloom pattern house` | `cg57_bore` | `II:Eng` | 0.5 | 0.6 | 9 | 12 | 11 | 0.9 | 190 | `shaped` | — | 8.8 |
| **Emberwright 247 Hull Gun, Mk II**<br>`em247_emberwright_hull_gun_mk2` | `emberwright foundries` | `cg37_bore` | `II:Eng` | 0.55 | 1 | 6.5 | 9 | 10 | 0.88 | 98 | `kinetic` | — | 4.9 |
| **Forgeworks 291 Breakthrough Gun, Mk I**<br>`em291_forgeworks_breakthrough_gun_mk1` | `emberwright foundries` | `cg57_bore` | `III` | 0.54 | 0.7 | 10 | 13 | 12 | 0.9 | 165 | `kinetic` | — | 8.5 |
| **Prizeyard 277 Turret Gun, Mk III**<br>`sy277_prizeyard_turret_gun_mk3` | `salvage court prize yard` | `cg37_bore` | `II:Cache` | 0.46 | 1.8 | 5.6 | 7 | 9 | 0.7 | 86 | `kinetic` | — | 4.5 |


- **Tollgate 318 Casemate Gun, Mk I** — A lined shell in a short casemate tube, drawn for keels that must answer a belt without carrying a breakthrough gun's ring. The jet wants plate and wastes itself on anything softer, which the Pattern House prints on the crate.
  *slots* `mount` `optic` `ammunition` · *quirks* `proof_stamped` `plate_hungry` · *issued to* `crawler` `land_dreadnought`
- **Emberwright 247 Hull Gun, Mk II** — The first bore the Foundries cut specifically to open a hull rather than a formation, and the gun most line crawlers still carry. Fast, flat, and increasingly embarrassed by what it meets on a modern glacis.
  *slots* `mount` `optic` `barrel` `ammunition` · *quirks* `cold_forged` `plate_hungry` · *issued to* `crawler` `land_dreadnought`
- **Forgeworks 291 Breakthrough Gun, Mk I** — The Foundries' reply to their own success: the same doctrine at a bore that still means it against face-hardened plate. It costs a larger ring, a longer loader, and a crawler built around the gun rather than the other way about.
  *slots* `mount` `optic` `barrel` `ammunition` · *quirks* `plate_hungry` `cold_forged` · *issued to* `crawler` `land_dreadnought`
- **Prizeyard 277 Turret Gun, Mk III** — Re-bored from three condemned tubes and married to a turret ring it was never drawn for, which the Court records as an improvement. It opens a line crawler twice as fast as the original and is spent entirely on a land-fort's belt.
  *slots* `mount` `magazine` `ammunition` · *quirks* `prize_taken` `barrel_droop` · *issued to* `crawler` `autocar_scouts`

### `artillery` — 4 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Beacon 256 Ranging Gun, Mk I**<br>`as256_beacon_ranging_gun_mk1` | `ascendancy signal works` | `a105_shell` | `II:Ciph` | 0.56 | 0.7 | 11.5 | 6.5 | 22 | 0.88 | 280 | `explosive` | r3 ƒ0.3 | 9.5 |
| **Crossloom 235 Field Piece, Mk II**<br>`cl235_crossloom_field_piece_mk2` | `crossloom pattern house` | `a105_shell` | `I` | 0.5 | 0.8 | 14 | 7 | 16 | 0.9 | 295 | `explosive` | r3 ƒ0.25 | 11 |
| **Anvilgate 284 Siege Howitzer, Mk II**<br>`em284_anvilgate_siege_howitzer_mk2` | `emberwright foundries` | `a150_shell` | `II:Eng` | 0.46 | 0.6 | 22 | 10 | 20 | 0.9 | 540 | `explosive` | r4 ƒ0.2 | 13 |
| **Reliquary 198 Keel Gun, Mk I**<br>`fs198_reliquary_keel_gun_mk1` | `ferrymen shrine armoury` | `a150_shell` | `III` | 0.55 | 0.45 | 24 | 14 | 22 | 0.93 | 620 | `kinetic` | r4 ƒ0.2 | 15 |


- **Beacon 256 Ranging Gun, Mk I** — A lighter shell pushed further than a sensible board would push it, laid by transmitted correction rather than by eye. The Ascendancy would rather register a target for the whole column than break one itself.
  *slots* `mount` `optic` `ammunition` · *quirks* `ranged_by_wire` `settles_in` · *issued to* `artillery` `siege_mortar`
- **Crossloom 235 Field Piece, Mk II** — The divisional piece, on the reasoning that a single shell weight is a single contract. It decides more field engagements than anything else on the Ground, and is almost never seen by the people it decides them against.
  *slots* `mount` `optic` `ammunition` `barrel` · *quirks* `crew_drilled` `loaders_mate` · *issued to* `artillery` `siege_mortar`
- **Anvilgate 284 Siege Howitzer, Mk II** — The works-breaker: two men and a cradle to load, a delay fuse, and a ceiling to answer for. Everything the Foundries believe about steel is in the breech, and the breech is why nobody has improved on it.
  *slots* `mount` `optic` `ammunition` `barrel` · *quirks* `crew_drilled` `ledger_kept` · *issued to* `artillery` `siege_mortar` `land_dreadnought`
- **Reliquary 198 Keel Gun, Mk I** — A land-fort's main armament, laid on its keel rather than on a carriage and blessed once a season whether or not it has fired. Solid shot, a full charge, and the only gun in the catalogue that meets a belt on equal terms.
  *slots* `mount` `optic` `ammunition` `barrel` · *quirks* `ferrymans_blessing` `hand_lapped` · *issued to* `land_dreadnought` `artillery` `siege_mortar`

### `aircraft_gun` — 2 patterns

| pattern | maker | calibre | tier | acc | RoF | dmg | pen | rng | rel | wt | type | aoe | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Antenna 272 Wing Cannon, Mk II**<br>`as272_antenna_wing_cannon_mk2` | `ascendancy signal works` | `ac20_aircraft` | `II:Ciph` | 0.5 | 3.6 | 6.5 | 6 | 7 | 0.85 | 46 | `kinetic` | — | 13 |
| **Adjudicated 296 Nose Battery, Mk I**<br>`sy296_adjudicated_nose_battery_mk1` | `salvage court prize yard` | `ac20_aircraft` | `II:Cache` | 0.42 | 5 | 5.5 | 5 | 5 | 0.7 | 40 | `explosive` | r1 ƒ0.6 | 6.5 |


- **Antenna 272 Wing Cannon, Mk II** — Wing-rooted, harmonised on the bench and impossible to reload in flight, so every gram of it was argued over twice. It arrives in a two-second burst, opens an autocar, scratches a line crawler, and is spent entirely on a land-fort's belt.
  *slots* `mount` `magazine` `ammunition` · *quirks* `ranged_by_wire` `glare_cut_sights` · *issued to* `fighter`
- **Adjudicated 296 Nose Battery, Mk I** — Four condemned tubes adjudicated into one nose mounting and sold with a writ instead of a proof mark. It throws everything it has in the first pass, and the Yard's own pilots decline the fourth gun.
  *slots* `mount` `magazine` `muzzle` · *quirks* `prize_taken` `barrel_droop` · *issued to* `fighter`

### 6.1 The class sweep — the invariant the whole model exists to express

At `issue` grade, no mods, no quirks in force:

- every `sidearm · carbine · rifle · smg · lmg · hmg · shotgun · marksman · flame` pattern resolves to
  **`effective === 0`** against **both** `heavy` and `superheavy`;
- every `anti_armor · crawler_gun · artillery` pattern resolves to **`effective > 0`** against `heavy`.

`mortar` and `aircraft_gun` are deliberately unconstrained — a bomb that lands on a hull deck and a
cannon fired down at one are both arguable, and the Ministry has declined to argue. The sweep runs
over every pattern in the catalogue, not over a chosen example.

---

## 7. Modifications

**47 kits across the 8 slots.** `mods` and `tradeoff` are both **additive** `WeaponBase` deltas with
**disjoint key sets**, and **every kit has a genuine cost** — the tradeoff is never empty and never
secretly a benefit. A section armorer fits nothing for free.

A weapon may carry **at most one kit per slot** (`rollWeapon` enforces it, and so does the roll test).

### `barrel` — 7 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Long-Pattern Barrel Assembly**<br>`barrel_long_pattern` | `accuracy` +0.05, `range` +1 | `weight` +0.6, `rateOfFire` -0.05 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `marksman` `anti_armor` | 0.3 |
| **Cut-Down Barrel**<br>`barrel_cut_down` | `weight` -0.7, `rateOfFire` +0.1 | `range` -2, `accuracy` -0.05 | `carbine` `rifle` `lmg` `shotgun` `marksman` | 0.1 |
| **Heavy-Profile Barrel**<br>`barrel_heavy_profile` | `accuracy` +0.08, `reliability` +0.05 | `weight` +1.1, `rateOfFire` -0.1 | `rifle` `lmg` `hmg` `marksman` `anti_armor` `crawler_gun` | 0.35 |
| **Chrome-Lined Bore**<br>`barrel_chrome_bore` | `reliability` +0.09 | `accuracy` -0.03, `weight` +0.2 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `shotgun` `marksman` `flame` `anti_armor` `crawler_gun` `artillery` | 0.3 |
| **Quick-Change Barrel Sleeve**<br>`barrel_quick_change` | `rateOfFire` +0.45 | `accuracy` -0.05, `weight` +0.8 | `lmg` `hmg` `crawler_gun` `aircraft_gun` | 0.4 |
| **Prize-Yard Re-Lining**<br>`barrel_yard_relined` | `damage` +0.3, `weight` -0.15 | `accuracy` -0.07, `reliability` -0.06 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `shotgun` `flame` `anti_armor` `crawler_gun` | 0.05 |
| **Seam-Bored Projector Tube**<br>`barrel_seam_bored` | `range` +1, `damage` +0.4 | `weight` +1.4, `reliability` -0.05 | `flame` | 0.35 |


- **Long-Pattern Barrel Assembly** — A hand more barrel, and the ranging tables redrawn to match. The board approves it for anyone who fires from a fixed position and quietly regrets it for anyone who has to run.
- **Cut-Down Barrel** — Taken off at the armourer's bench with a hacksaw and a file, on the authority of whoever has to carry it. Handy in a gallery, an embarrassment on a ridge.
- **Heavy-Profile Barrel** — Thicker walls, slower to heat and slower to stop mattering. Every ordnance board on the Ground has approved this fitting and no quartermaster has ever thanked one for it.
- **Chrome-Lined Bore** — A plated bore that shrugs off fouling, damp and the third week of a wet season. The plating is a shade thicker in places than the drawings intended, and the groups open accordingly.
- **Quick-Change Barrel Sleeve** — A latch, an asbestos mitt and a spare tube in the number two's pack, so a gun that has run white can be back in action in a count of ten. Nothing that unlatches ever returns to the same zero.
- **Prize-Yard Re-Lining** — A condemned tube re-bored a size over, sleeved, and stamped with a writ number where the proof mark used to be. It hits harder than the drawings allow, for exactly as long as it lasts.
- **Seam-Bored Projector Tube** — A longer throwing tube bored on the Burnworks' own seam gear, which throws the thickened grade a hex further and one pressure test closer to the edge of its vessel.

### `optic` — 5 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Ranging Telescope**<br>`optic_ranging_telescope` | `accuracy` +0.11, `range` +1 | `weight` +0.5, `rateOfFire` -0.15 | `rifle` `lmg` `hmg` `marksman` `anti_armor` `mortar` `crawler_gun` `artillery` | 0.5 |
| **Open Battle Sight**<br>`optic_open_battle_sight` | `rateOfFire` +0.25 | `accuracy` -0.06, `range` -1 | `sidearm` `carbine` `rifle` `smg` `lmg` `shotgun` `marksman` | 0.05 |
| **Ministry Coincidence Rangefinder**<br>`optic_ministry_rangefinder` | `accuracy` +0.13, `range` +2 | `weight` +2.6, `rateOfFire` -0.2 | `hmg` `anti_armor` `mortar` `crawler_gun` `artillery` | 0.9 |
| **Dark-Run Prism**<br>`optic_dark_run_prism` | `accuracy` +0.07 | `range` -1, `weight` +0.4 | `sidearm` `carbine` `rifle` `lmg` `hmg` `marksman` `anti_armor` `crawler_gun` | 0.45 |
| **Ghost-Ring Aperture**<br>`optic_ghost_ring` | `accuracy` +0.04, `rateOfFire` +0.12 | `range` -1 | `sidearm` `carbine` `rifle` `smg` `lmg` `shotgun` `marksman` | 0.2 |


- **Ranging Telescope** — Ground glass, a graticule etched to the calibre's own drop table, and a mount the armourer will not let you adjust. You will see further and you will fire less often.
- **Open Battle Sight** — The leaf folded flat and the graduations ignored, on the Ministry's own finding that most of the Ground's shooting happens inside two hexes and none of it happens slowly.
- **Ministry Coincidence Rangefinder** — A cased optical instrument with two windows and one answer, issued against signature and returned against signature. It converts a gun crew into a survey party for the length of a laying.
- **Dark-Run Prism** — A wide gathering prism cut for a dark run: it makes a shape out of a smudge at the cost of most of the field around it, which is a bargain nobody enjoys making twice.
- **Ghost-Ring Aperture** — A thin ring the eye stops seeing the moment it is used properly. Fast onto a target at conversational distance, and no help whatever in placing a shot beyond one.

### `magazine` — 6 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Drum Magazine**<br>`magazine_drum` | `rateOfFire` +0.5 | `reliability` -0.12, `weight` +1.2 | `carbine` `rifle` `smg` `lmg` `hmg` `aircraft_gun` | 0.35 |
| **Extended Box Magazine**<br>`magazine_extended_box` | `rateOfFire` +0.2 | `weight` +0.5 | `sidearm` `carbine` `rifle` `smg` `lmg` `marksman` | 0.2 |
| **Stripper-Clip Guide**<br>`magazine_stripper_guide` | `rateOfFire` +0.15 | `accuracy` -0.03 | `carbine` `rifle` `marksman` `shotgun` | 0.1 |
| **Disintegrating Belt Feed**<br>`magazine_belt_feed` | `rateOfFire` +0.8 | `weight` +2.4, `accuracy` -0.05 | `lmg` `hmg` `crawler_gun` `aircraft_gun` | 0.55 |
| **Ready-Rack Cradle**<br>`magazine_ready_rack` | `rateOfFire` +0.3 | `weight` +3.2, `reliability` -0.04 | `hmg` `mortar` `crawler_gun` `artillery` | 0.4 |
| **Lightened Follower Set**<br>`magazine_lightened_follower` | `weight` -0.4, `rateOfFire` +0.1 | `reliability` -0.09 | `sidearm` `carbine` `rifle` `smg` `lmg` | 0.15 |


- **Drum Magazine** — A spring-wound pan holding more rounds than a man can account for and feeding them in an order the spring decides. Loved in the first minute of an assault and cursed in the second.
- **Extended Box Magazine** — The issue box lengthened by half, which is exactly as much as a man can lie down behind. Nothing about it is clever and everything about it works.
- **Stripper-Clip Guide** — A milled guide on the bridge so a full clip goes down in one motion. The milling takes metal off the one part of the receiver the sights are indexed against.
- **Disintegrating Belt Feed** — A feed tray, a pawl and two hundred links that come apart as they pass. It turns a gun into a supply problem, and every doctrine on the Ground has decided that is worth it.
- **Ready-Rack Cradle** — Shell stowage at the loader's elbow rather than at the wagon, which halves the laying interval and puts the ready charges precisely where a hit would find them.
- **Lightened Follower Set** — Pressed followers and a lighter spring, saving a pound across a man's pouches. The last two rounds in every magazine now present at an angle the extractor was not consulted about.

### `stock` — 6 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Folding Bipod**<br>`stock_bipod` | `accuracy` +0.12 | `weight` +0.9 | `rifle` `lmg` `hmg` `marksman` `anti_armor` | 0.3 |
| **Fitted Cheekpiece**<br>`stock_fitted_cheekpiece` | `accuracy` +0.07 | `weight` +0.35 | `sidearm` `carbine` `rifle` `shotgun` `marksman` | 0.25 |
| **Folding Stock Assembly**<br>`stock_folding` | `weight` -0.55 | `accuracy` -0.06, `rateOfFire` -0.05 | `sidearm` `carbine` `rifle` `smg` `shotgun` `flame` | 0.2 |
| **Sprung Recoil Pad**<br>`stock_recoil_pad` | `rateOfFire` +0.15, `accuracy` +0.03 | `weight` +0.45 | `carbine` `rifle` `lmg` `shotgun` `marksman` `anti_armor` | 0.25 |
| **Carrying-Harness Frame**<br>`stock_harness_frame` | `weight` -1.2 | `accuracy` -0.08, `rateOfFire` -0.08 | `lmg` `hmg` `flame` `anti_armor` | 0.2 |
| **Heavy Shoulder Brace**<br>`stock_shoulder_brace` | `accuracy` +0.1, `reliability` +0.03 | `weight` +1.5, `rateOfFire` -0.05 | `rifle` `lmg` `marksman` `anti_armor` | 0.35 |


- **Folding Bipod** — Two sprung legs that fold under the fore-end and take the weapon's weight off a tired man's arms. They also add that weight to every hex he walks before he lies down behind it.
- **Fitted Cheekpiece** — Cradle timber built up under the comb until the eye falls onto the sight without being asked. Fitted to one face, and worth nothing at all on the next.
- **Folding Stock Assembly** — A hinge, a catch and a wire frame, so the thing goes under a coat or into an autocar's footwell. Everything a hinge does to a shoulder weld, it does.
- **Sprung Recoil Pad** — A sprung buttplate that lets a man take the ninth shot as willingly as the first. The Foundries fit them as standard and pretend the reason is comfort.
- **Carrying-Harness Frame** — A shoulder frame that carries the weapon's weight on a man's hips instead of his hands, and holds it in a position from which nothing can be aimed or worked quickly.
- **Heavy Shoulder Brace** — A braced steel butt cast for weapons that would otherwise dislocate the man behind them. Emberwright issues one with every heavy rifle and counts it against the rifle's weight, not the man's.

### `muzzle` — 5 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Slotted Muzzle Brake**<br>`muzzle_brake` | `rateOfFire` +0.3, `accuracy` +0.04 | `reliability` -0.05, `weight` +0.4 | `sidearm` `rifle` `smg` `lmg` `hmg` `marksman` `anti_armor` `mortar` `crawler_gun` `artillery` `aircraft_gun` | 0.3 |
| **Cone Flash Hider**<br>`muzzle_flash_hider` | `accuracy` +0.05 | `weight` +0.25, `rateOfFire` -0.05 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `marksman` | 0.2 |
| **Ported Compensator**<br>`muzzle_ported_compensator` | `accuracy` +0.09 | `damage` -0.25, `weight` +0.3 | `sidearm` `carbine` `rifle` `smg` `shotgun` `aircraft_gun` | 0.25 |
| **Muzzle Grenade Cup**<br>`muzzle_grenade_cup` | `damage` +0.6, `aoe` {"radius":1,"falloff":0.6} | `rateOfFire` -0.35, `accuracy` -0.06, `weight` +0.7 | `carbine` `rifle` `shotgun` | 0.5 |
| **Blast Diffuser Shroud**<br>`muzzle_blast_diffuser` | `reliability` +0.07, `accuracy` +0.05 | `weight` +3, `range` -1 | `hmg` `mortar` `crawler_gun` `artillery` | 0.35 |


- **Slotted Muzzle Brake** — Ported baffles that throw the recoil sideways at everyone standing beside you and hold the muzzle down for the next round. The blast comes back into the action along with everything the blast picked up.
- **Cone Flash Hider** — A slotted cone that keeps the firer's own night vision and denies the other side a bearing. It adds a thing at the muzzle that can catch, and on a dark run it will.
- **Ported Compensator** — Gas bled upward through a row of ports so the muzzle stays where it was put. The gas bled is gas that was pushing the shot, and the ordnance board has the figures.
- **Muzzle Grenade Cup** — A cup clamped over the muzzle and a ballistite cartridge in the chamber, which turns one rifleman in every section into a very short-ranged battery. Nothing else can be done with the weapon while it is fitted.
- **Blast Diffuser Shroud** — A drum shroud that keeps the muzzle blast off the crew, the sights and the pit's own parapet. It also keeps a measurable fraction of the charge off the shell.

### `bayonet` — 4 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Socket Blade**<br>`bayonet_socket_blade` | `damage` +1.2 | `accuracy` -0.03, `weight` +0.5 | `carbine` `rifle` `shotgun` `marksman` | 0.15 |
| **Trench-Knife Lug**<br>`bayonet_trench_knife_lug` | `damage` +0.8 | `weight` +0.3 | `sidearm` `carbine` `rifle` `smg` `shotgun` | 0.1 |
| **Sword-Pattern Bayonet**<br>`bayonet_sword_pattern` | `damage` +1.9 | `accuracy` -0.07, `weight` +1.1, `rateOfFire` -0.05 | `rifle` `marksman` | 0.25 |
| **Pioneer Spade Fitting**<br>`bayonet_pioneer_spade` | `damage` +1.05 | `weight` +0.85, `accuracy` -0.02 | `carbine` `rifle` `shotgun` `marksman` | 0.15 |


- **Socket Blade** — A triangular blade on a collar, issued in the same quantity as rifles and lost at roughly twice the rate. It is the Ministry's official position that the trench is entered with it fixed.
- **Trench-Knife Lug** — A lug welded on so the man's own knife becomes the weapon's blade, which saves the Ministry an issue item and saves the man an argument about which he would rather have.
- **Sword-Pattern Bayonet** — Two hands of ground steel, sharpened on one edge and ceremonial on the other. It is very good at what it is for and it hangs off the muzzle like a grudge.
- **Pioneer Spade Fitting** — The section's entrenching spade sharpened along both edges and cut to seat on the bayonet lug. A digger corps will tell you it has never once been used for digging afterwards.

### `ammunition` — 9 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Hardened-Core Lot**<br>`ammo_hardened_core` | `armorPen` +1.2 | `damage` -0.5, `weight` +0.15 | `anti_armor` `crawler_gun` `artillery` `aircraft_gun` | 0.6 |
| **Hollow-Base Lot**<br>`ammo_hollow_base` | `damage` +0.7 | `armorPen` -0.6, `range` -1 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `shotgun` `marksman` | 0.25 |
| **Shaped-Charge Lot**<br>`ammo_shaped_charge` | `damageType` "shaped", `armorPen` +1 | `damage` -0.6, `range` -2, `rateOfFire` -0.1 | `anti_armor` `crawler_gun` `artillery` | 0.8 |
| **Case-Filled Lot**<br>`ammo_case_filled` | `damageType` "fragmentation", `aoe` {"radius":2,"falloff":0.35} | `armorPen` -2, `damage` -0.5 | `mortar` `crawler_gun` `artillery` | 0.4 |
| **Thickened-Charge Lot**<br>`ammo_thickened_charge` | `damageType` "incendiary", `damage` +0.5 | `armorPen` -1, `reliability` -0.08 | `flame` `mortar` `artillery` | 0.5 |
| **Fume Filling**<br>`ammo_fume_filling` | `damageType` "chemical" | `damage` -1.2, `armorPen` -1.5, `reliability` -0.06 | `mortar` `artillery` | 0.45 |
| **Proof-House Lot**<br>`ammo_proof_lot` | `reliability` +0.1, `accuracy` +0.05 | `weight` +0.15 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `shotgun` `marksman` `anti_armor` `flame` `mortar` `crawler_gun` `artillery` `aircraft_gun` | 0.55 |
| **Reduced-Charge Lot**<br>`ammo_reduced_charge` | `accuracy` +0.07, `reliability` +0.05 | `damage` -0.5, `range` -2 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `shotgun` `marksman` | 0.2 |
| **Overpressure Lot**<br>`ammo_overpressure_lot` | `damage` +0.6, `range` +1 | `reliability` -0.13, `weight` +0.1 | `sidearm` `carbine` `rifle` `smg` `lmg` `hmg` `shotgun` `marksman` `anti_armor` `crawler_gun` `artillery` `aircraft_gun` | 0.3 |


- **Hardened-Core Lot** — A dense core in a light jacket, cut to punch a small clean hole through something that objects. Whatever is behind the hole is the crew's problem, not the projectile's.
- **Hollow-Base Lot** — A soft slug with a hollowed skirt that upsets on contact and stops travelling. Ruinous on a man in a coat, and stopped by the first honest piece of plate it meets.
- **Shaped-Charge Lot** — A copper cone and a stand-off fuse, which converts the filling into one jet aimed at a single point. It cares nothing for how fast it arrived and everything for what it arrived against.
- **Case-Filled Lot** — Thin walls and a generous case charge, so the shell arrives as several hundred pieces of itself. Against men in the open it is decisive; against anything plated it is expensive noise.
- **Thickened-Charge Lot** — Tarpool's seam grade cut to cling rather than splash, filled at the works and carted no further than the works will guarantee. It goes through a firing slit and stays there.
- **Fume Filling** — A thin-walled carrier and a filling the Ministry lists by weight and never by name. It empties a work, a gallery and a trench, and it dies at the first sealed hatch on the field.
- **Proof-House Lot** — One lot, one machine, one afternoon, every round weighed and every case gauged. It costs what it costs and there is nothing else in the catalogue that improves a bad weapon so much.
- **Reduced-Charge Lot** — A short charge behind a heavy bullet: quiet, gentle on the action, and lethargic. Signals sections and provosts draw it; line companies decline it in writing.
- **Overpressure Lot** — Loaded above the drawings on the theory that the proof pressure is a suggestion. It reaches further, hits harder, and shortens every component's life including, occasionally, the firer's.

### `mount` — 5 kits

| kit | benefit | cost | fits | pts |
| --- | --- | --- | --- | --- |
| **Pintle Mounting**<br>`mount_pintle` | `accuracy` +0.05, `rateOfFire` +0.05 | `weight` +3.5 | `lmg` `hmg` `anti_armor` `flame` `mortar` `aircraft_gun` | 0.3 |
| **Sprung Recoil Cradle**<br>`mount_sprung_cradle` | `accuracy` +0.1, `rateOfFire` +0.12 | `weight` +9 | `hmg` `mortar` `crawler_gun` `artillery` | 0.6 |
| **Traversing Ring Mounting**<br>`mount_traversing_ring` | `rateOfFire` +0.28 | `weight` +14, `accuracy` -0.04 | `hmg` `crawler_gun` `artillery` `aircraft_gun` | 0.7 |
| **Dug-In Platform Bed**<br>`mount_dug_in_platform` | `accuracy` +0.15, `reliability` +0.05 | `weight` +7, `rateOfFire` -0.12 | `lmg` `hmg` `anti_armor` `mortar` `artillery` | 0.4 |
| **Casemate Trunnion Block**<br>`mount_casemate_trunnion` | `accuracy` +0.09, `reliability` +0.07 | `weight` +20, `range` -1 | `flame` `crawler_gun` `artillery` | 0.65 |


- **Pintle Mounting** — A socket, a post and a spade grip, welded wherever the crawler's deck will take it. The simplest mounting the Ground has and the one every other mounting is measured against.
- **Sprung Recoil Cradle** — Hydro-spring buffers that take the gun's recoil into the mounting instead of into the ground, so the piece returns to its own laying between rounds rather than being relaid.
- **Traversing Ring Mounting** — A geared ring that brings the whole arc under one man's left hand. It weighs what a ring of that diameter weighs, and it has never once been described as precise.
- **Dug-In Platform Bed** — Baulks, a spade-plate and an afternoon's work, after which the weapon is laid on one arc and is not going anywhere. Sappers approve of it; everyone who has had to leave in a hurry does not.
- **Casemate Trunnion Block** — The gun set into the hull itself on a cast block, with the plate closed around it and the barrel shortened to clear the works. Nothing is steadier and nothing is less able to look elsewhere.

---

## 8. Quirks

**33 quirks, and "machine-evaluable" is enforced rather than asserted.** Every quirk carries a
`condition` drawn from a declared vocabulary, and `evaluateQuirk(quirk, ctx)` is a pure function that
returns a boolean for every quirk against every context — including an empty one and `undefined` —
and never throws. An unknown condition key reads as *not met*, never as *true*.

### 8.1 The condition vocabulary

| `condition.key` | valueType | reads |
| --- | --- | --- |
| `always` | `none` | unconditional — the only kind that fires against an empty context |
| `weather` | `string` | the field's weather: `clear` `rain` `snow` `fog` `storm` |
| `terrain` | `string` | the terrain key under the stand |
| `night` | `none` | a dark-run — a Coal-only night (LORE §3.1) |
| `adjacent_specialist` | `string` | a `SpecialistKey` among the adjacent stands |
| `consecutive_fire` | `number` | fire orders issued back to back, at or above the value |
| `vs_house` | `string` | the defending house; `native_house` resolves to the maker's own |
| `vs_armour_class` | `string` | the target's armour class |
| `quality_at_least` | `string` | the instance's own grade, at or above this one |
| `range_at_most` | `number` | the engagement range, at or below the value |
| `figures_at_least` | `number` | the firing stand's figure count |
| `round_at_least` | `number` | the battle round number |


All 12 keys are in use: `always` 5 · `weather` 5 · `adjacent_specialist` 3 · `quality_at_least` 3 · `terrain` 3 · `consecutive_fire` 2 · `figures_at_least` 2 · `night` 2 · `range_at_most` 2 · `round_at_least` 2 · `vs_armour_class` 2 · `vs_house` 2.

### 8.2 The quirks

| quirk | effect | condition | reading |
| --- | --- | --- | --- |
| **Shoots Low**<br>`shoots_low` | `accuracy` -0.06, `damage` +0.2 | `always` | It has printed low and left since the day it was proofed. The section knows the hold-over, nobody has ever written it down, and the extra bite at the bottom of the group is nobody's idea of compensation. |
| **Sweet Barrel**<br>`sweet_barrel` | `accuracy` +0.07 | `always` | One tube in a hundred comes off the gear better than the drawings ask for, and the armourer who finds it says nothing and issues it to the best shot in the company. |
| **Sticky Action**<br>`sticky_action` | `rateOfFire` -0.12, `reliability` -0.04 | `always` | Something in the bolt way was never quite finished, and no amount of stoning has found it. It works. It simply does not want to. |
| **Worn In**<br>`worn_in` | `reliability` +0.06, `weight` -0.1 | `always` | Ten thousand rounds have lapped every bearing surface into agreement with every other, and taken the bluing, the sharp edges and a little of the metal with them. |
| **Condemned Lot**<br>`condemned_lot` | `damage` +0.3, `reliability` -0.16 | `always` | Struck off the proof register for a fault the inspector recorded and the Prize Yard did not read. It is loaded hotter than it should be and it will let somebody know. |
| **Cold-Forged**<br>`cold_forged` | `reliability` +0.1 | `weather` = `"snow"` | Forged and finished at the Emberwright benches through a Union winter, with clearances cut for a metal that has already shrunk. It comes into its own on the day everything else stops. |
| **Damp-Proofed**<br>`damp_proofed` | `reliability` +0.12 | `weather` = `"rain"` | Waxed furniture, a sealed magazine well and a lacquered case mouth on every round. The fitting costs an afternoon and returns it on the first wet week of the season. |
| **Dust-Sealed**<br>`dust_sealed` | `reliability` +0.1, `accuracy` +0.03 | `weather` = `"storm"` | A felt-lipped dust cover over the ejection port and a shrouded gas way, fitted as standard by people who have watched a storm take a company's rifles out of action in an hour. |
| **Glare-Cut Sights**<br>`glare_cut_sights` | `accuracy` +0.06 | `weather` = `"clear"` | Smoked leaves and a matted rib, so a bright sky stops washing the foresight out. On any other day it is a slightly darker sight picture and nothing more. |
| **Close-Laid**<br>`close_laid` | `rateOfFire` +0.15 | `weather` = `"fog"` | Zeroed for the distance a man can actually see in a fog bank and worked from a rest at that distance, on the sound reasoning that nothing further away is going to be identified anyway. |
| **Gallery-Worked**<br>`gallery_worked` | `accuracy` +0.08 | `terrain` = `"rubble"` | Cut short, braced at the fore-end and sighted for the length of a pit gallery. Among fallen courses and broken works it handles as though the ground were drawn for it, because it was. |
| **Mire-Shod**<br>`mire_shod` | `reliability` +0.1 | `terrain` = `"marsh"` | Broadened bipod shoes, a plugged muzzle cap and a drain cut in the butt. Marsh work destroys weapons that were not thought about beforehand, and this one was. |
| **Short-Stocked**<br>`short_stocked` | `rateOfFire` +0.12, `accuracy` +0.04 | `terrain` = `"woods"` | An inch off the butt and the sling moved forward, so the weapon comes up inside a thicket instead of catching on it. Every scout arm on the Ground is issued this way and pretends it is an accident. |
| **Dark-Run Sights**<br>`dark_run_sights` | `accuracy` +0.1 | `night` | Luminous salts bedded into the foresight and the rear notch, renewed every third season out of a tin the armourer signs for. On a dark run it is the difference between shooting and firing. |
| **Flashless Charge**<br>`flashless_charge` | `accuracy` +0.05, `reliability` +0.04 | `night` | A cooler propellant that leaves the muzzle without announcing the position to everyone on the ridge. The Ministry issues it by the lot and counts the empties. |
| **Ferryman's Blessing**<br>`ferrymans_blessing` | `morale` +1 | `adjacent_specialist` = `"relic_bearer"` | Numbered against a vigil at the Nine Cradles and inscribed with the fitter's name. Beside a relic-bearer the men holding one believe the inscription, and the Ministry has stopped arguing about whether that counts. |
| **Ranged By Wire**<br>`ranged_by_wire` | `range` +2, `accuracy` +0.05 | `adjacent_specialist` = `"signaler"` | Ascendancy furniture carries a terminal post and a ranging card cut for the signals net. With a signaler at the elbow the weapon is laid off somebody else's eyes. |
| **Belt-Shared**<br>`belt_shared` | `rateOfFire` +0.2 | `adjacent_specialist` = `"heavy_gunner"` | Chambered and linked so a section's automatic and its rifles draw out of one crate. Beside a heavy gunner nobody stops to count, which is the entire argument for standardising a cartridge. |
| **Runs Hot**<br>`runs_hot` | `rateOfFire` +0.15, `reliability` -0.1 | `consecutive_fire` = `2` | The cyclic rate climbs with the barrel temperature, which the Arsenal describes as a feature and the men describe as the point at which it starts eating belts and its own extractor. |
| **Barrel Droop**<br>`barrel_droop` | `accuracy` -0.1 | `consecutive_fire` = `3` | A thin tube held at one end goes where heat tells it to. By the third sustained order the group has walked off the aiming mark and no amount of shouting brings it back. |
| **Prize-Taken**<br>`prize_taken` | `morale` +1 | `vs_house` = `"native_house"` | Adjudicated out of the hands it was made for, stamped with a writ number over the old maker's mark, and pointed back the way it came. The Court holds that this is the highest use a weapon can be put to. |
| **Synod-Proscribed**<br>`synod_proscribed` | `morale` +1, `accuracy` +0.03 | `vs_house` = `"synod"` | Named in a Bastion Synod proscription list, which the men who carry it have had read to them and have chosen to take as a testimonial. |
| **Plate-Hungry**<br>`plate_hungry` | `damage` +0.8 | `vs_armour_class` = `"heavy"` | Laid, fused and drilled for one target and one target only. Against a breakthrough glacis the crew does not need to be told the range; against anything else they are slower than they should be. |
| **Soft-Shot**<br>`soft_shot` | `damage` +0.5 | `vs_armour_class` = `"none"` | A loading and a laying chosen for men in the open, which is what the Ground mostly contains. It is a great deal less impressive the moment the ground contains anything else. |
| **Proof-Stamped**<br>`proof_stamped` | `accuracy` +0.05, `reliability` +0.05 | `quality_at_least` = `"proofed"` | Two crossed hammers and a date, struck into the receiver by a proof house that put its own name beside them. A scrap-grade example of the same pattern carries the stamping and none of the meaning. |
| **Hand-Lapped**<br>`hand_lapped` | `accuracy` +0.09 | `quality_at_least` = `"master"` | Bore lapped, locking surfaces stoned and the trigger let off at a weight the fitter chose rather than the drawing. It cannot be done at a shift rate and it cannot be faked. |
| **Hair Trigger**<br>`hair_trigger` | `initiative` +1 | `quality_at_least` = `"proofed"` | Let off so fine that the shot is away before the intention is finished. Superb in a duel and a standing hazard on every wagon, ladder and trench-board between here and the line. |
| **Close-Bound**<br>`close_bound` | `rateOfFire` +0.3 | `range_at_most` = `2` | Short, quick to the shoulder and sighted no further than a man can be sure of. Inside two hexes it is the fastest thing in the section's hands. |
| **Point-Blank Bite**<br>`point_blank_bite` | `damage` +0.6, `accuracy` +0.08 | `range_at_most` = `1` | Everything the charge has, delivered before it has had a chance to spread, slow or be thought about. The boarding parties price a weapon on this number alone. |
| **Crew-Drilled**<br>`crew_drilled` | `rateOfFire` +0.25, `reliability` +0.05 | `figures_at_least` = `4` | Laid, loaded, fused and served by a full detachment who have done it together often enough to stop speaking. Below four hands the drill becomes a conversation and the rate collapses. |
| **Loader's Mate**<br>`loaders_mate` | `rateOfFire` +0.15 | `figures_at_least` = `2` | A second pair of hands on the ready rounds, which is the cheapest increase in rate of fire the Ministry has ever costed and the first thing casualties take away. |
| **Settles In**<br>`settles_in` | `accuracy` +0.08, `reliability` +0.05 | `round_at_least` = `3` | Fouling beds the first rounds in, the bipod finds its own holes in the ground and the firer stops flinching. Everything about the weapon is better by the third round and nobody can quite say why. |
| **Ledger-Kept**<br>`ledger_kept` | `morale` +1 | `round_at_least` = `5` | Every round it has fired is written against its serial in a book the crew keeps in the ammunition chest. By the fifth round of an engagement the book is doing as much work as the gun. |


A quirk whose `mods` carry `morale` or `initiative` is **not** a `WeaponBase` delta and is dropped by
`resolveWeapon` on purpose; it stays on the instance for the platform lane to read. `deriveLoadout`
never surfaces it, because `morale` is a squad value the tactical engine owns.

---

### 8.4 The morale/initiative branch is **declarative**

§4 declares `Quirk.mods` as `Partial<WeaponBase> | { morale?, initiative? }` — a **union**. A row
sits in one branch or the other, never both, and that is asserted: `applyDelta` copies only the nine
`WeaponBase` keys, so a row carrying `{ morale: 1, accuracy: 0.03 }` would have half of itself
silently discarded inside `resolveWeapon` while the other half applied.

The rows in the morale/initiative branch are `ferrymans_blessing`, `prize_taken`,
`synod_proscribed`, `ledger_kept` and `hair_trigger` — the last being this catalogue's one
`initiative` row. **Nothing in this lane spends them.** `deriveLoadout`'s output keys are fixed by `LOADOUT_KEYS`, which has no `morale`;
`loadoutProfile` returns exactly `{ armorPen, damageType, aoe, misfire }`. Their conditions evaluate,
their numbers are authored and mirrored, and they wait: wiring them into squad morale or initiative
is a platform decision, filed under Lane I in `docs/prompts/PLATFORM_HANDOFF.md`. They are recorded
here as **declarative** rather than described as live, because a rule the engine cannot read is not
a rule yet.

---

## 9. `rollWeapon` — the draw order and the odds

```
rollWeapon({ seed, class, maker, calibre, tierCap, luck }) → WeaponInstance
  { patternKey, quality, mods, quirks, serial }   — exactly those five keys
```

**ONE `mulberry32(seed)` stream, drawn in ONE fixed order, and the order is part of the contract.**
A serial is reproduced from its seed rather than stored, so changing the order changes every weapon
the Ministry has ever issued, retroactively.

| # | draw | from |
| --- | --- | --- |
| 1 | pattern | uniform over the filtered pool — `class`, `maker`, `calibre`, and `tier` at or below `tierCap` — **sorted by key ascending** |
| 2 | quality | weighted over the five `rollWeight`s, adjusted by `luck` |
| 3 | mod count | `MOD_COUNT_BY_QUALITY[quality]`, clamped to the number of distinct slots actually available |
| 4 | each mod | uniform over kits whose `slot` ∈ the pattern's `slots` and whose `appliesTo` includes its class; **no two may share a slot**; sorted by key |
| 5 | extra quirk count | 0–2, uniform |
| 6 | each extra quirk | uniform over `QUIRKS` keys not already on the pattern, sorted by key |
| 7 | serial | five characters off the same stream |


Every pool is **sorted by key** before the draw. That is what makes the result independent of object
insertion order — so a row appended by a later lane cannot silently renumber the whole history.

### 9.1 Quality odds, and what `luck` does to them

```js
export const LUCK_SLOPE = { scrap: -0.6, issue: -0.2, proofed: 0.2, master: 0.5, relic: 0.9 };
adjustedWeight(g) = max(0, QUALITY_GRADES[g].rollWeight × (1 + clamp(luck, -1, 1) × LUCK_SLOPE[g]))
```

| `luck` | `scrap` | `issue` | `proofed` | `master` | `relic` |
| --- | --- | --- | --- | --- | --- |
| `-1` (worst) | 40.9 % | 42.9 % | 12.9 % | 3.2 % | 0.1 % |
| `-0.5` | 35.9 % | 42.5 % | 15.7 % | 5.2 % | 0.8 % |
| **`0`** (default) | 30.0 % | 42.0 % | 19.0 % | 7.5 % | 1.5 % |
| `+0.5` | 23.0 % | 41.4 % | 22.9 % | 10.3 % | 2.4 % |
| `+1` (best) | 14.5 % | 40.7 % | 27.6 % | 13.6 % | 3.5 % |


**At `luck: 0` the adjusted weights are exactly the base weights.** That is what the 10 000-roll
distribution test asserts, to within 2 percentage points on all five grades.

### 9.2 Modification count

| quality | kits (inclusive) |
| --- | --- |
| `scrap` | 0–1 |
| `issue` | 0–1 |
| `proofed` | 1–2 |
| `master` | 2–3 |
| `relic` | 2–3 |


Clamped to the distinct slots actually available on that pattern — a two-slot weapon cannot take three kits.

### 9.3 Tier

```js
export const TIER_RANK = { I: 1, 'II:Cache': 2, 'II:Eng': 2, 'II:Ciph': 2, 'II:Wake': 2, III: 3 };
```

The three `II:*` branches are the **same height** and differ only in how they are unlocked, so a cap
admits every tier strictly below it plus its own exact tier: `II:Eng` opens engineering patterns and
not cipher ones; `III` opens everything.

### 9.4 Serial

`` `${stem}-${year}-${five}` `` — `stem` is the first three letters of the maker's first name-stem,
upper-cased; `year` is the 3-digit pattern year parsed off the label; `five` is five characters drawn
from `0-9A-Z` off the same stream. Matches `/^[A-Z]{3}-\d{3}-[0-9A-Z]{5}$/`, and is stable across runs.

### 9.5 An empty pool throws

`rollWeapon` with filters that match nothing throws `rollWeapon: no pattern matches ...` **with the
filters named**. It never returns `null` and never silently widens the filter — a loot roll that
quietly hands back the wrong class of weapon is worse than a loot roll that fails.

Note that `{ class: 'crawler_gun', tierCap: 'I' }` is one such empty pool today: the register carries
no tier-I crawler gun. That is a live design fact, not an accident, and the test asserts it by
*deriving* the tier-locked classes from the table rather than naming one — a hand-picked example goes
quietly non-empty the day someone certifies a pattern lower, and then passes while proving nothing.

---

## 10. `resolveWeapon`, `deriveLoadout`, `loadoutProfile`

### 10.1 `resolveWeapon(instance, ctx)` — the application order is the contract

```
1. b = copy of WEAPON_PATTERNS[instance.patternKey].base          (all 9 keys)
2. b = add(b, MANUFACTURERS[pattern.maker].signature)             (additive)
3. b = mul(b, QUALITY_GRADES[instance.quality].mult)              (multiplicative; absent key = ×1)
4. for each mod:  b = add(b, mod.mods); b = add(b, mod.tradeoff)  (additive, both halves)
5. for each quirk in pattern.quirks ∪ instance.quirks where evaluateQuirk(quirk, ctx):
        b = add(b, quirk.mods)                                    (WeaponBase keys only)
6. clamp: accuracy [0.05, 1.5] · reliability [0.05, 1] · rateOfFire [0.1, 12]
          damage ≥ 0 · armorPen ≥ 0 · range ≥ 0 · weight ≥ 0.1
7. damageType and aoe pass through unchanged unless a mod or quirk SETS them (replacement, not delta)
```

The order matters and is asserted: the maker's signature is added **before** the grade multiplies, so
a `relic`-grade Emberwright gets its foundry's armour penetration multiplied along with everything
else. Mods and quirks land **after** the multiplier, so a bipod is worth the same on a `scrap` weapon
as on a `master` one — the kit does not care what it is bolted to.

### 10.2 `deriveLoadout(squad)` — the reduction to squad numbers

```js
export const LOADOUT_SHARES = { primary: 1, support: 0.15, sidearm: 0.1 };
```

THE REDUCTION FORMULA — this is the implemented one

```
  shares:    primary 1.00 · support 0.15 · sidearm 0.10
  b(w)       = resolveWeapon(w, ctx)                    — the weapon as carried
  bare(w)    = resolveWeapon(w minus its bayonet-slot mods, ctx)
  shots(w)   = b.rateOfFire x b.accuracy x b.reliability
  fire(w)    = bare.damage x shots(w)
  blade(w)   = max(0, b.damage - bare.damage)

  ranged = round2( SUM share_w x fire(w) )
  range  = max over instances of b.range               — the longest reach sets the reach
  melee  = round2( SUM share_w x blade(w) )
  weight = SUM share_w x b.weight
  speed  = -floor( weight / WEIGHT_PER_SPEED_STEP )    — a delta, always <= 0
  pts    = round2( SUM share_w x pattern.pts x grade.ptsMult )
```

**The weapon is resolved twice, and that is the point.** A bayonet's value is its blade, and a blade
must never make a weapon shoot harder. `bare(w)` is the same instance with every `bayonet`-slot kit
taken off it; `fire(w)` is computed from the **bladeless** damage and `blade(w)` is the difference,
so the same number is never spent twice. The blade's *accuracy* cost stays inside `shots(w)`, because
a fixed bayonet genuinely does spoil the aim — fitting one moves `melee` up and `ranged` down.

*(An earlier draft of this section printed `fire(w) = b.damage × shots(w)` and a `bayonet(w)` term,
which double-counted a blade's damage into `ranged` — a 68 % divergence from the module on every
bladed weapon. The block above is now lifted from `arms.ts`'s own comment and compared against it by
`test/arms-mirror.test.js`, so the two copies cannot say different things again.)*

**Output keys are a strict subset of the §4 `SquadType` value keys**, and `LOADOUT_KEYS` tells Lane A
what each one *means* so `deriveSquad` cannot guess wrong:

| key | meaning |
| --- | --- |
| `melee` | **absolute** — replaces the `SquadType` base value |
| `ranged` | **absolute** — replaces the `SquadType` base value |
| `range` | **absolute** — replaces the `SquadType` base value |
| `speed` | **delta** — added to the `SquadType` base value |
| `pts` | **delta** — added to the `SquadType` base value |

**`absolute`/`delta` says where a number LANDS. This says what SCALE it is in, and both are needed.**
`SquadType.pts` is the cost of a **squad** — `SQUAD_TYPES.riflemen.pts` is 100, for ten figures —
while `WeaponPattern.pts` is the cost of **one weapon**, and the 141 Levy Rifle is 1. Those are two
scales. `deriveLoadout` returns the **per-figure** one: it never reads `squad.figures`, and a
one-figure team and a ten-figure section carrying the same weapons reduce to identical numbers
(asserted in `test/arms-roll.test.js`, so it cannot quietly stop being true).

| key | scale | what `deriveSquad` does with it |
| --- | --- | --- |
| `melee` | per figure | × `figures`, then replaces the `SquadType` value |
| `ranged` | per figure | × `figures`, then replaces the `SquadType` value |
| `pts` | per figure | × `figures`, then added to the `SquadType` value |
| `range` | per figure's weapon | never scaled — reach is not a headcount |
| `speed` | per figure's load | never scaled — a man carries what a man carries |

A ten-figure rifle section carrying 1-point rifles therefore adds **10** points to its 100-point
squad — the arms layer really is a tenth of what the squad costs — but `deriveLoadout` returns the
**1**, not the 10.

**AN ABSENT `loadout` AND AN EMPTY ONE ARE DIFFERENT STATES.** `melee`, `ranged` and `range` are
`absolute`: they **replace** the `SquadType` base value. §4 makes `loadout?: Loadout` optional and no
squad row carries one yet, so a `deriveSquad` that called this unconditionally would wipe every
authored `melee`/`ranged`/`range` in the game the moment it was wired up. So:

- **no `loadout` at all** → `deriveLoadout` returns `{}`. It contributes nothing and overrides
  nothing, which is what makes "call it unconditionally" safe.
- **a `loadout` present but empty** → the full set of zeroes. That is an unarmed stand, which is a
  legal state on the field, and zero is the correct thing for it to replace with.


One detail worth the sentence: **`speed` is normalised away from `-0`.** `−Math.floor(weight/12)` is
`-0` for every ordinary rifle section, and `-0` is not `0` to `Object.is`, to a deep-equal, or to a
JSON round-trip through a saved `Game` document. The sign is corrected once, at the only place the
negation happens.

### 10.3 `loadoutProfile(squad)` — what the engine actually holds

Returns exactly `{ armorPen, damageType, aoe, misfire }` for the squad's **primary** weapon, where
`misfire = round2(clamp(0, 1 − reliability, 0.5))`. **This is what Lane A and Lane C feed into
`resolveHit` as the `weapon` argument.** It exists so `deriveLoadout` can keep its keys inside
`SQUAD_VALUE_KEYS` while the engine still has enough to resolve penetration — the engine sees squad
numbers and a damage profile, and **never a `WeaponInstance`**.

A squad with no primary returns an inert profile rather than throwing: an unarmed stand is a legal
state on the field, and it should penetrate nothing and suppress nothing.

---

## 11. The Points Audit

**A points audit written by hand rots.** Someone re-tunes a barrel, nobody re-adds the column, and the
document goes on asserting a total its own tables contradict. So this audit is *code*: `apValue`,
`aaValue`, `fairPts` and `patternEfficiency` are exported from `arms.ts`, and the table below is
generated from them and **re-computed cell by cell** by `test/arms-mirror.test.js` §21.e.

### 11.1 The model

```
issueBase(p)   = resolveWeapon({ patternKey: p.key, quality: 'issue', mods: [], quirks: [] }, {})
shots(b)       = b.rateOfFire × b.accuracy × b.reliability
rangeFactor(b) = 1 + b.range / 20

apValue(p)     = round4( resolveHit({ weapon: issueBase(p), target: ARMOUR_CLASSES.soft  }).effective × shots × rangeFactor )
aaValue(p)     = round4( resolveHit({ weapon: issueBase(p), target: ARMOUR_CLASSES.heavy }).effective × shots × rangeFactor )
fairPts(p)     = round4( apValue(p) / AP_RATE + aaValue(p) / AA_RATE )
patternEfficiency(p) = round4( fairPts(p) / p.pts )
```

```js
export const POINTS_MODEL = {
  AP_RATE: 1.7887,              // anti-personnel value one point buys
  AA_RATE: 1.2,                 // anti-armour value one point buys — PRICED SEPARATELY
  rangeFactorDivisor: 20,
  apReferenceKey: 'hw141_levy_rifle_mk2',
  aaReferenceKey: 'cl281_openhand_shaped_lance_mk1',
  efficiencyCap: 1.6,
};
```

**Two rates, and that is what "anti-armour value priced separately" means mechanically.** One rate
would price a heavy anti-crawler rifle only on the soft-target damage it is bad at, and its
armour-killing would cost nothing at all — it would be *free against infantry*. Splitting the terms
makes the weapon pay for the thing it is for. `AA_RATE` is deliberately **lower** than `AP_RATE`
(1.2 against 1.7887), so a point buys less armour-killing than it buys man-killing: on this ground
armour-killing is the scarce thing, and it costs **×1.49** per unit of value.

### 11.2 Calibration — show the arithmetic

**The anchor is one weapon.** `hw141_levy_rifle_mk2` is the *Hundredweight 141 Levy Rifle, Mk II* at `issue`
grade, and it is priced at **1 point per figure**.

```
issueBase(hw141_levy_rifle_mk2)
  accuracy 0.52 · rateOfFire 1 · damage 2.8 · armorPen 2.5
  range 7 · reliability 0.91 · weight 4.5 · damageType kinetic

shots        = 1 × 0.52 × 0.91 = 0.4732
rangeFactor  = 1 + 7 / 20 = 1.35

vs ARMOUR_CLASSES.soft  (armourValue 1):
  delta      = 2.5 − 1 = 1.5
  penMult    = 1
  typeMult   = TYPE_MATRIX.kinetic.soft = 1
  effective  = 2.8
  apValue    = 2.8 × 0.4732 × 1.35 = 1.7887

vs ARMOUR_CLASSES.heavy (armourValue 10):
  delta      = 2.5 − 10 = -7.5
  penMult    = 0   ← the mandatory zero row
  effective  = 0   → suppressOnly true
  aaValue    = 0
```

`AP_RATE` is therefore **set equal to the reference's own `apValue`**, and the reference prices itself:

```
AP_RATE  = 1.7887                     (= apValue(hw141_levy_rifle_mk2))
fairPts  = 1.7887 / 1.7887 + 0 / 1.2 = 1
pts      = 1
efficiency = 1 / 1 = 1
```

**`AA_RATE` is calibrated against the anti-armour reference,** `cl281_openhand_shaped_lance_mk1` — the
*Openhand 281 Shaped Lance, Mk I*. Its armour-killing term has to be a real share of its own price, or the
separation is decorative:

```
apValue    = 1.0757   → 1.0757 / 1.7887 = 0.6014
aaValue    = 1.2048   → 1.2048 / 1.2 = 1.004
fairPts    = 1.6054
AA share   = 1.004 / 1.6054 = 62.5 %      (floor: 40 %)
```

### 11.3 What the audit finds

| reading | value |
| --- | --- |
| patterns audited | 49 |
| `fairPts` of the reference | 1 (required: 1 ± 0.005) |
| reference `pts` | 1 (asserted exactly 1) |
| anti-armour share of the AA reference | 62.5 % (required ≥ 40 %) |
| highest efficiency | **1.2724** — `hw218_sledge_trench_sweeper_mk1` (cap 1.6) |
| lowest efficiency | 0.5975 — `hw302_sledge_shoulder_gun_mk1` |
| mean efficiency | 0.9323 |
| patterns over the cap | **0** |
| patterns with `aaValue === 0` | 36 of 49 — the damage model working as designed |
| `anti_armor`/`crawler_gun`/`artillery` with `aaValue === 0` | **0** (asserted) |


The zero column is the point. **36 of 49 patterns are worth *nothing* against a breakthrough
crawler's glacis**, and they pay for none of it — which is why a rifle section is cheap and an
anti-crawler team is not.

### 11.4 The audit, every pattern, at `issue` grade

*Sorted by key. `pts` is the charged price; `fairPts` is what the model says it is worth;
`efficiency` is the second divided by the first, and nothing may exceed 1.6.*

| key | class | maker | pts | apValue | aaValue | fairPts | efficiency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `as256_beacon_ranging_gun_mk1` | `artillery` | `ascendancy_signal_works` | 9.5 | 13.3734 | 1.9537 | 9.1047 | 0.9584 |
| `as268_copperline_long_rifle_mk2` | `rifle` | `ascendancy_signal_works` | 1.05 | 1.4853 | **0** | 0.8304 | 0.7909 |
| `as272_antenna_wing_cannon_mk2` | `aircraft_gun` | `ascendancy_signal_works` | 13 | 18.772 | 3.6042 | 13.4983 | 1.0383 |
| `as294_longear_ranging_rifle_mk1` | `marksman` | `ascendancy_signal_works` | 0.8 | 1.0846 | **0** | 0.6064 | 0.758 |
| `cl206_tollgate_sustained_gun_mk2` | `hmg` | `crossloom_pattern_house` | 3.9 | 8.5709 | **0** | 4.7917 | 1.2286 |
| `cl221_crossloom_light_mortar_mk2` | `mortar` | `crossloom_pattern_house` | 2.8 | 6.1848 | **0** | 3.4577 | 1.2349 |
| `cl235_crossloom_field_piece_mk2` | `artillery` | `crossloom_pattern_house` | 11 | 16.8177 | 2.0474 | 11.1084 | 1.0099 |
| `cl252_waymark_pattern_rifle_mk1` | `rifle` | `crossloom_pattern_house` | 1.2 | 2.3714 | **0** | 1.3258 | 1.1048 |
| `cl274_knotwork_light_gun_mk1` | `lmg` | `crossloom_pattern_house` | 2.6 | 4.7502 | **0** | 2.6557 | 1.0214 |
| `cl281_openhand_shaped_lance_mk1` | `anti_armor` | `crossloom_pattern_house` | 2.4 | 1.0757 | 1.2048 | 1.6054 | 0.6689 |
| `cl318_tollgate_casemate_gun_mk1` | `crawler_gun` | `crossloom_pattern_house` | 8.8 | 3.0358 | 5.6668 | 6.4195 | 0.7295 |
| `em214_winter_anti_crawler_rifle_mk2` | `anti_armor` | `emberwright_foundries` | 2.3 | 1.8233 | 0.5834 | 1.5055 | 0.6546 |
| `em233_anvilgate_heavy_gun_mk1` | `hmg` | `emberwright_foundries` | 4 | 6.9973 | **0** | 3.9119 | 0.978 |
| `em239_forgeworks_battalion_mortar_mk1` | `mortar` | `emberwright_foundries` | 3.6 | 5.3276 | **0** | 2.9785 | 0.8274 |
| `em247_emberwright_hull_gun_mk2` | `crawler_gun` | `emberwright_foundries` | 4.9 | 5.6628 | 1.8121 | 4.676 | 0.9543 |
| `em276_cinder_breaching_rifle_mk1` | `rifle` | `emberwright_foundries` | 0.9 | 1.2602 | **0** | 0.7045 | 0.7828 |
| `em284_anvilgate_siege_howitzer_mk2` | `artillery` | `emberwright_foundries` | 13 | 12.569 | 5.1005 | 11.2773 | 0.8675 |
| `em291_forgeworks_breakthrough_gun_mk1` | `crawler_gun` | `emberwright_foundries` | 8.5 | 5.832 | 3.888 | 6.5005 | 0.7648 |
| `fs159_ninefold_vigil_rifle_mk1` | `rifle` | `ferrymen_shrine_armoury` | 1.15 | 1.591 | **0** | 0.8895 | 0.7735 |
| `fs171_ferryman_watch_rifle_mk2` | `marksman` | `ferrymen_shrine_armoury` | 1 | 1.3689 | **0** | 0.7653 | 0.7653 |
| `fs188_reliquary_officers_sidearm_mk2` | `sidearm` | `ferrymen_shrine_armoury` | 0.65 | 0.9368 | **0** | 0.5237 | 0.8057 |
| `fs198_reliquary_keel_gun_mk1` | `artillery` | `ferrymen_shrine_armoury` | 15 | 9.0387 | 6.0258 | 10.0747 | 0.6716 |
| `hw141_levy_rifle_mk2` | `rifle` | `hundredweight_works` | 1 | 1.7887 | **0** | 1 | 1 |
| `hw166_bottoms_pit_revolver_mk1` | `sidearm` | `hundredweight_works` | 0.6 | 1.0125 | **0** | 0.5661 | 0.9435 |
| `hw184_combine_squad_automatic_mk3` | `lmg` | `hundredweight_works` | 2.1 | 3.9382 | **0** | 2.2017 | 1.0484 |
| `hw203_sledge_short_rifle_mk1` | `carbine` | `hundredweight_works` | 0.95 | 1.489 | **0** | 0.8324 | 0.8762 |
| `hw218_sledge_trench_sweeper_mk1` | `shotgun` | `hundredweight_works` | 1.6 | 3.6417 | **0** | 2.0359 | 1.2724 |
| `hw249_bottoms_gallery_burner_mk1` | `flame` | `hundredweight_works` | 1.1 | 1.529 | **0** | 0.8548 | 0.7771 |
| `hw262_bottoms_selected_rifle_mk3` | `marksman` | `hundredweight_works` | 1.45 | 2.3615 | **0** | 1.3202 | 0.9105 |
| `hw302_sledge_shoulder_gun_mk1` | `anti_armor` | `hundredweight_works` | 1.7 | 0.9903 | 0.5546 | 1.0158 | 0.5975 |
| `ow197_courier_dust_carbine_mk2` | `carbine` | `outrider_wheelwrights` | 0.85 | 1.5315 | **0** | 0.8562 | 1.0073 |
| `ow259_skimline_saddle_gun_mk1` | `smg` | `outrider_wheelwrights` | 1 | 1.8667 | **0** | 1.0436 | 1.0436 |
| `ow311_dustpromise_field_rifle_mk2` | `rifle` | `outrider_wheelwrights` | 1.05 | 1.9585 | **0** | 1.0949 | 1.0428 |
| `rs229_verdict_service_rifle_mk3` | `rifle` | `reclamation_state_arsenal` | 1.5 | 2.6035 | **0** | 1.4555 | 0.9703 |
| `rs236_levy_trench_automatic_mk2` | `smg` | `reclamation_state_arsenal` | 1.05 | 1.6422 | **0** | 0.9181 | 0.8744 |
| `rs241_unity_column_carbine_mk4` | `carbine` | `reclamation_state_arsenal` | 0.9 | 1.6813 | **0** | 0.94 | 1.0444 |
| `rs257_ironworks_belt_gun_mk2` | `lmg` | `reclamation_state_arsenal` | 2.3 | 3.8627 | **0** | 2.1595 | 0.9389 |
| `rs263_verdict_commune_mortar_mk3` | `mortar` | `reclamation_state_arsenal` | 2.6 | 5.6062 | **0** | 3.1342 | 1.2055 |
| `rs278_state_concussion_mortar_mk2` | `mortar` | `reclamation_state_arsenal` | 2.4 | 5.2046 | **0** | 2.9097 | 1.2124 |
| `rs299_state_pintle_gun_mk4` | `hmg` | `reclamation_state_arsenal` | 3.2 | 5.7483 | **0** | 3.2137 | 1.0043 |
| `sy214_writ_yard_automatic_mk3` | `sidearm` | `salvage_court_prize_yard` | 0.35 | 0.5788 | **0** | 0.3236 | 0.9246 |
| `sy245_bailiff_boarding_gun_mk2` | `shotgun` | `salvage_court_prize_yard` | 1.4 | 3.1601 | **0** | 1.7667 | 1.2619 |
| `sy277_prizeyard_turret_gun_mk3` | `crawler_gun` | `salvage_court_prize_yard` | 4.5 | 6.9026 | 1.1044 | 4.7793 | 1.0621 |
| `sy288_knife_room_gun_mk5` | `smg` | `salvage_court_prize_yard` | 0.45 | 0.6746 | **0** | 0.3771 | 0.838 |
| `sy296_adjudicated_nose_battery_mk1` | `aircraft_gun` | `salvage_court_prize_yard` | 6.5 | 12.5519 | 0.6112 | 7.5267 | 1.158 |
| `tp226_seamfire_trench_projector_mk2` | `flame` | `tarpool_burnworks` | 2 | 2.8963 | **0** | 1.6192 | 0.8096 |
| `tp305_slagline_hull_projector_mk1` | `flame` | `tarpool_burnworks` | 3 | 4.6923 | **0** | 2.6233 | 0.8744 |
| `tp313_firetongue_incendiary_mortar_mk1` | `mortar` | `tarpool_burnworks` | 2.4 | 3.4883 | **0** | 1.9502 | 0.8126 |
| `tp317_tarpool_fume_mortar_mk1` | `mortar` | `tarpool_burnworks` | 2.5 | 3.492 | **0** | 1.9523 | 0.7809 |


**Regenerate this table whenever a number moves.** The test does not check that you regenerated it —
it checks the numbers, which is stronger.

---

## 12. Plate register

**105 placeholder plates**, appended to `src/lib/imageLibrary.js` as one contiguous banner-commented
block at the end of `IMAGE_LIBRARY`, plus one new `IMAGE_CATEGORIES` key `arms` added inline.
`url` is `null` on every one — **content lanes request art, they never ship it.** No image file, no
SVG, no `PLATE_URLS` entry, no `UnitSprite.jsx` edit.

| prefix | count | aspect | one per |
| --- | --- | --- | --- |
| `arms_<patternKey>` | 49 | 16:9 | weapon pattern |
| `maker_<manufacturerKey>` | 9 | 1:1 | manufacturer |
| `mod_kit_<modKey>` | 47 | 1:1 | modification |


Prompts name the subject concretely and **never restate `HOUSE_STYLE`** — it is prepended at
generation, and a prompt that repeats it fights it. A test asserts that no plate prompt contains any
phrase of the house style.

| key | aspect | title |
| --- | --- | --- |
| `arms_hw166_bottoms_pit_revolver_mk1` | 16:9 | Bottoms 166 Pit Revolver, Mk I |
| `arms_sy214_writ_yard_automatic_mk3` | 16:9 | Writ 214 Yard Automatic, Mk III |
| `arms_fs188_reliquary_officers_sidearm_mk2` | 16:9 | Reliquary 188 Officer's Sidearm, Mk II |
| `arms_ow197_courier_dust_carbine_mk2` | 16:9 | Courier 197 Dust Carbine, Mk II |
| `arms_hw203_sledge_short_rifle_mk1` | 16:9 | Sledge 203 Short Rifle, Mk I |
| `arms_rs241_unity_column_carbine_mk4` | 16:9 | Unity 241 Column Carbine, Mk IV |
| `arms_hw141_levy_rifle_mk2` | 16:9 | Hundredweight 141 Levy Rifle, Mk II |
| `arms_rs229_verdict_service_rifle_mk3` | 16:9 | Verdict 229 Service Rifle, Mk III |
| `arms_cl252_waymark_pattern_rifle_mk1` | 16:9 | Waymark 252 Pattern Rifle, Mk I |
| `arms_as268_copperline_long_rifle_mk2` | 16:9 | Copperline 268 Long Rifle, Mk II |
| `arms_em276_cinder_breaching_rifle_mk1` | 16:9 | Cinder 276 Breaching Rifle, Mk I |
| `arms_ow311_dustpromise_field_rifle_mk2` | 16:9 | Dustpromise 311 Field Rifle, Mk II |
| `arms_fs159_ninefold_vigil_rifle_mk1` | 16:9 | Ninefold 159 Vigil Rifle, Mk I |
| `arms_rs236_levy_trench_automatic_mk2` | 16:9 | Levy 236 Trench Automatic, Mk II |
| `arms_sy288_knife_room_gun_mk5` | 16:9 | Knife 288 Room Gun, Mk V |
| `arms_ow259_skimline_saddle_gun_mk1` | 16:9 | Skimline 259 Saddle Gun, Mk I |
| `arms_hw184_combine_squad_automatic_mk3` | 16:9 | Combine 184 Squad Automatic, Mk III |
| `arms_rs257_ironworks_belt_gun_mk2` | 16:9 | Ironworks 257 Belt Gun, Mk II |
| `arms_cl274_knotwork_light_gun_mk1` | 16:9 | Knotwork 274 Light Gun, Mk I |
| `arms_cl206_tollgate_sustained_gun_mk2` | 16:9 | Tollgate 206 Sustained Gun, Mk II |
| `arms_em233_anvilgate_heavy_gun_mk1` | 16:9 | Anvilgate 233 Heavy Gun, Mk I |
| `arms_rs299_state_pintle_gun_mk4` | 16:9 | State 299 Pintle Gun, Mk IV |
| `arms_sy245_bailiff_boarding_gun_mk2` | 16:9 | Bailiff 245 Boarding Gun, Mk II |
| `arms_hw218_sledge_trench_sweeper_mk1` | 16:9 | Sledge 218 Trench Sweeper, Mk I |
| `arms_fs171_ferryman_watch_rifle_mk2` | 16:9 | Ferryman 171 Watch Rifle, Mk II |
| `arms_as294_longear_ranging_rifle_mk1` | 16:9 | Longear 294 Ranging Rifle, Mk I |
| `arms_hw262_bottoms_selected_rifle_mk3` | 16:9 | Bottoms 262 Selected Rifle, Mk III |
| `arms_em214_winter_anti_crawler_rifle_mk2` | 16:9 | Winter 214 Anti-Crawler Rifle, Mk II |
| `arms_cl281_openhand_shaped_lance_mk1` | 16:9 | Openhand 281 Shaped Lance, Mk I |
| `arms_hw302_sledge_shoulder_gun_mk1` | 16:9 | Sledge 302 Shoulder Gun, Mk I |
| `arms_tp226_seamfire_trench_projector_mk2` | 16:9 | Seamfire 226 Trench Projector, Mk II |
| `arms_tp305_slagline_hull_projector_mk1` | 16:9 | Slagline 305 Hull Projector, Mk I |
| `arms_hw249_bottoms_gallery_burner_mk1` | 16:9 | Bottoms 249 Gallery Burner, Mk I |
| `arms_cl221_crossloom_light_mortar_mk2` | 16:9 | Crossloom 221 Light Mortar, Mk II |
| `arms_rs263_verdict_commune_mortar_mk3` | 16:9 | Verdict 263 Commune Mortar, Mk III |
| `arms_rs278_state_concussion_mortar_mk2` | 16:9 | State 278 Concussion Mortar, Mk II |
| `arms_em239_forgeworks_battalion_mortar_mk1` | 16:9 | Forgeworks 239 Battalion Mortar, Mk I |
| `arms_tp313_firetongue_incendiary_mortar_mk1` | 16:9 | Firetongue 313 Incendiary Mortar, Mk I |
| `arms_tp317_tarpool_fume_mortar_mk1` | 16:9 | Tarpool 317 Fume Mortar, Mk I |
| `arms_em247_emberwright_hull_gun_mk2` | 16:9 | Emberwright 247 Hull Gun, Mk II |
| `arms_sy277_prizeyard_turret_gun_mk3` | 16:9 | Prizeyard 277 Turret Gun, Mk III |
| `arms_em291_forgeworks_breakthrough_gun_mk1` | 16:9 | Forgeworks 291 Breakthrough Gun, Mk I |
| `arms_cl318_tollgate_casemate_gun_mk1` | 16:9 | Tollgate 318 Casemate Gun, Mk I |
| `arms_cl235_crossloom_field_piece_mk2` | 16:9 | Crossloom 235 Field Piece, Mk II |
| `arms_as256_beacon_ranging_gun_mk1` | 16:9 | Beacon 256 Ranging Gun, Mk I |
| `arms_em284_anvilgate_siege_howitzer_mk2` | 16:9 | Anvilgate 284 Siege Howitzer, Mk II |
| `arms_fs198_reliquary_keel_gun_mk1` | 16:9 | Reliquary 198 Keel Gun, Mk I |
| `arms_as272_antenna_wing_cannon_mk2` | 16:9 | Antenna 272 Wing Cannon, Mk II |
| `arms_sy296_adjudicated_nose_battery_mk1` | 16:9 | Adjudicated 296 Nose Battery, Mk I |
| `maker_hundredweight_works` | 1:1 | The Hundredweight Combine Works |
| `maker_reclamation_state_arsenal` | 1:1 | The State Arsenal of the Reclamation |
| `maker_emberwright_foundries` | 1:1 | The Emberwright Union Foundries |
| `maker_ferrymen_shrine_armoury` | 1:1 | The Ferrymen's Shrine-Armoury |
| `maker_salvage_court_prize_yard` | 1:1 | The Prize Yard of the Salvage Court |
| `maker_crossloom_pattern_house` | 1:1 | The Crossloom Pattern House |
| `maker_ascendancy_signal_works` | 1:1 | The Signal Works of the Ascendancy |
| `maker_outrider_wheelwrights` | 1:1 | The Outrider Wheelwrights |
| `maker_tarpool_burnworks` | 1:1 | The Tarpool Burnworks |
| `mod_kit_barrel_long_pattern` | 1:1 | Long-Pattern Barrel Assembly |
| `mod_kit_barrel_cut_down` | 1:1 | Cut-Down Barrel |
| `mod_kit_barrel_heavy_profile` | 1:1 | Heavy-Profile Barrel |
| `mod_kit_barrel_chrome_bore` | 1:1 | Chrome-Lined Bore |
| `mod_kit_barrel_quick_change` | 1:1 | Quick-Change Barrel Sleeve |
| `mod_kit_barrel_yard_relined` | 1:1 | Prize-Yard Re-Lining |
| `mod_kit_barrel_seam_bored` | 1:1 | Seam-Bored Projector Tube |
| `mod_kit_optic_ranging_telescope` | 1:1 | Ranging Telescope |
| `mod_kit_optic_open_battle_sight` | 1:1 | Open Battle Sight |
| `mod_kit_optic_ministry_rangefinder` | 1:1 | Ministry Coincidence Rangefinder |
| `mod_kit_optic_dark_run_prism` | 1:1 | Dark-Run Prism |
| `mod_kit_optic_ghost_ring` | 1:1 | Ghost-Ring Aperture |
| `mod_kit_magazine_drum` | 1:1 | Drum Magazine |
| `mod_kit_magazine_extended_box` | 1:1 | Extended Box Magazine |
| `mod_kit_magazine_stripper_guide` | 1:1 | Stripper-Clip Guide |
| `mod_kit_magazine_belt_feed` | 1:1 | Disintegrating Belt Feed |
| `mod_kit_magazine_ready_rack` | 1:1 | Ready-Rack Cradle |
| `mod_kit_magazine_lightened_follower` | 1:1 | Lightened Follower Set |
| `mod_kit_stock_bipod` | 1:1 | Folding Bipod |
| `mod_kit_stock_fitted_cheekpiece` | 1:1 | Fitted Cheekpiece |
| `mod_kit_stock_folding` | 1:1 | Folding Stock Assembly |
| `mod_kit_stock_recoil_pad` | 1:1 | Sprung Recoil Pad |
| `mod_kit_stock_harness_frame` | 1:1 | Carrying-Harness Frame |
| `mod_kit_stock_shoulder_brace` | 1:1 | Heavy Shoulder Brace |
| `mod_kit_muzzle_brake` | 1:1 | Slotted Muzzle Brake |
| `mod_kit_muzzle_flash_hider` | 1:1 | Cone Flash Hider |
| `mod_kit_muzzle_ported_compensator` | 1:1 | Ported Compensator |
| `mod_kit_muzzle_grenade_cup` | 1:1 | Muzzle Grenade Cup |
| `mod_kit_muzzle_blast_diffuser` | 1:1 | Blast Diffuser Shroud |
| `mod_kit_bayonet_socket_blade` | 1:1 | Socket Blade |
| `mod_kit_bayonet_trench_knife_lug` | 1:1 | Trench-Knife Lug |
| `mod_kit_bayonet_sword_pattern` | 1:1 | Sword-Pattern Bayonet |
| `mod_kit_bayonet_pioneer_spade` | 1:1 | Pioneer Spade Fitting |
| `mod_kit_ammo_hardened_core` | 1:1 | Hardened-Core Lot |
| `mod_kit_ammo_hollow_base` | 1:1 | Hollow-Base Lot |
| `mod_kit_ammo_shaped_charge` | 1:1 | Shaped-Charge Lot |
| `mod_kit_ammo_case_filled` | 1:1 | Case-Filled Lot |
| `mod_kit_ammo_thickened_charge` | 1:1 | Thickened-Charge Lot |
| `mod_kit_ammo_fume_filling` | 1:1 | Fume Filling |
| `mod_kit_ammo_proof_lot` | 1:1 | Proof-House Lot |
| `mod_kit_ammo_reduced_charge` | 1:1 | Reduced-Charge Lot |
| `mod_kit_ammo_overpressure_lot` | 1:1 | Overpressure Lot |
| `mod_kit_mount_pintle` | 1:1 | Pintle Mounting |
| `mod_kit_mount_sprung_cradle` | 1:1 | Sprung Recoil Cradle |
| `mod_kit_mount_traversing_ring` | 1:1 | Traversing Ring Mounting |
| `mod_kit_mount_dug_in_platform` | 1:1 | Dug-In Platform Bed |
| `mod_kit_mount_casemate_trunnion` | 1:1 | Casemate Trunnion Block |


*`docs/prompts/ART_MANIFEST.md` is orchestrator-owned and is not edited by this lane; these keys are
listed in the PR body for folding in.*

---

## 13. Codex Annex

**25 entries — one per manufacturer and one per calibre — are SHIPPED**, appended to
`src/lib/wiki/entries.js` as one contiguous banner-commented block at the end of `ENTRIES`. They are
not handed over as prose: a lane that hands its Codex over as prose is a lane whose Codex never lands.
No existing entry is edited; `CATEGORIES`, `STATUS`, `entryText` and `citedBy` are untouched.

A test asserts that every `id` in the whole corpus is unique and that **every `see` target across the
whole array resolves** — the corpus is 100 % link-clean and Lane H's acceptance depends on it staying so.

| id | category | tag | status | title |
| --- | --- | --- | --- | --- |
| `maker-hundredweight-works` | `powers` | Arms Catalogue §3 | `canon` | The Hundredweight Combine Works |
| `maker-reclamation-state-arsenal` | `powers` | Arms Catalogue §3 | `thin` | The State Arsenal of the Reclamation |
| `maker-emberwright-foundries` | `powers` | Arms Catalogue §3 | `thin` | The Emberwright Union Foundries |
| `maker-ferrymen-shrine-armoury` | `powers` | Arms Catalogue §3 | `thin` | The Ferrymen's Shrine-Armoury |
| `maker-salvage-court-prize-yard` | `powers` | Arms Catalogue §3 | `thin` | The Prize Yard of the Salvage Court |
| `maker-crossloom-pattern-house` | `powers` | Arms Catalogue §3 | `thin` | The Crossloom Pattern House |
| `maker-ascendancy-signal-works` | `powers` | Arms Catalogue §3 | `thin` | The Signal Works of the Ascendancy |
| `maker-outrider-wheelwrights` | `powers` | Arms Catalogue §3 | `thin` | The Outrider Wheelwrights |
| `maker-tarpool-burnworks` | `powers` | Arms Catalogue §3 | `thin` | The Tarpool Burnworks |
| `calibre-p9-service` | `war` | Arms Catalogue §4 | `thin` | P.9 Service Round |
| `calibre-sm10-stub` | `war` | Arms Catalogue §4 | `thin` | S.M.10 Stub Cartridge |
| `calibre-c11-carbine` | `war` | Arms Catalogue §4 | `thin` | C.11 Short Rifle Cartridge |
| `calibre-r13-line` | `war` | Arms Catalogue §4 | `canon` | R.13 Line Cartridge |
| `calibre-r13-belt` | `war` | Arms Catalogue §4 | `thin` | R.13 Belt Link |
| `calibre-hr17-heavy` | `war` | Arms Catalogue §4 | `thin` | H.R.17 Heavy Rifle Round |
| `calibre-sg20-bore` | `war` | Arms Catalogue §4 | `thin` | 20-Bore Trench Shell |
| `calibre-mg13-sustained` | `war` | Arms Catalogue §4 | `thin` | M.G.13 Sustained-Fire Link |
| `calibre-fg2-fuel` | `war` | Arms Catalogue §4 | `thin` | F.G.2 Thickened Fuel Grade |
| `calibre-m50-bore` | `war` | Arms Catalogue §4 | `thin` | 50 mm Light Mortar Bomb |
| `calibre-m81-bore` | `war` | Arms Catalogue §4 | `thin` | 81 mm Mortar Bomb |
| `calibre-cg37-bore` | `war` | Arms Catalogue §4 | `thin` | 37 mm Crawler Gun Shot |
| `calibre-cg57-bore` | `war` | Arms Catalogue §4 | `thin` | 57 mm Crawler Gun Shell |
| `calibre-a105-shell` | `war` | Arms Catalogue §4 | `thin` | 105 mm Field Shell |
| `calibre-a150-shell` | `war` | Arms Catalogue §4 | `thin` | 150 mm Siege Shell |
| `calibre-ac20-aircraft` | `war` | Arms Catalogue §4 | `thin` | 20 mm Aircraft Cannon Shell |


`status: "canon"` is used only where a governing document supports the row — `maker-hundredweight-works`
(`docs/GEAR_LIBRARY.md` §6 already prices the *141 Levy Rifle* at *"good enough for the Hundredweight"*)
and `calibre-r13-line` (the shipped `standardized_calibers` doctrine). **Everything else is `"thin"`.**
The great houses and the settlement cultures are canon; their *arsenals* are ground the lore bible does
not cover, and marking invented ground as sealed is how a wiki starts lying.

The rows exactly as they shipped:

```js
  // ——— LANE I: makers & calibres ———
  // The Arms Catalogue (docs/ARMS_CATALOGUE.md §13): one entry per
  // manufacturer and one per calibre. Appended as a single contiguous tail
  // block so a concurrent content lane collides mechanically and is resolved
  // by keeping both blocks in lane order. No existing entry is touched.
  {
    id: "maker-hundredweight-works",
    title: "The Hundredweight Combine Works",
    folk: "the Bottoms shop",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "canon",
    summary: "The mining combine that armed the First March and never stopped — the reference against which every other maker is priced.",
    blocks: [
      { lead: "Every points table in the Ministry begins with a Hundredweight rifle, because every points table has to begin somewhere cheap." },
      { p: "The Combine Works began as the maintenance shop of a mining concern and has never entirely stopped behaving like one. Its patterns are heavy, plain and forgiving: oversized chambers, coarse threads, sights a frightened man can still find in the dark. Ordnance boards across the Ground price every other weapon against a Hundredweight, and the Works is quietly proud of that and quietly poor because of it. It licenses freely, holds no house's warrant, and stamps each receiver with the tonnage mark of the seam it was born over." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "accuracy -0.03 · reliability +0.06 · weight +0.2"],
                  ["Name-stems", "Hundredweight · Bottoms · Sledge · Combine"],
                  ["Native to", "reclamation, commonweal"],
                  ["Licensed to", "combine, synod, covenant, ascendancy, emberwright, procession, outrider"],
                  ["Taken as prize by", "salvage"],
                  ["Patterns in the register", "8"],
                  ["Calibres chambered", "P.9 Service Round, C.11 Short Rifle Cartridge, R.13 Line Cartridge, R.13 Belt Link, 20-Bore Trench Shell, H.R.17 Heavy Rifle Round, F.G.2 Thickened Fuel Grade"],
                ],
              },
      },
      { note: "GEAR_LIBRARY §6 already prices the 141 Levy Rifle at a reduced cost and a lost point of defence — \"good enough for the Hundredweight\". The Arms Catalogue is that judgement written out in full." },
    ],
    see: ["calibre-p9-service", "calibre-c11-carbine", "calibre-r13-line", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-reclamation-state-arsenal",
    title: "The State Arsenal of the Reclamation",
    folk: "the Verdict lines",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "The Reclamation arms its levies by the crate. Volume of fire is the doctrine; the finish is not.",
    blocks: [
      { lead: "Four assembly lines, numbered, and a quota chalked at the head of each. Nothing leaves the floor beautiful." },
      { p: "The State Arsenal exists to arm a levy faster than the levy can be raised. Its shops are measured in shifts rather than craftsmen, and its patterns are drawn around that fact: stamped housings, generous tolerances, a cyclic rate that empties a magazine before the holder can think better of it. Unity is the doctrine and the defect — an Arsenal weapon fits any Reclamation hand and stops in any weather the drawings did not anticipate. The Arsenal holds that a rifle outliving its bearer was a rifle overbuilt." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "rateOfFire +0.35 · reliability -0.07 · weight +0.4"],
                  ["Name-stems", "Verdict · Levy · State · Ironworks · Unity"],
                  ["Native to", "reclamation"],
                  ["Licensed to", "combine, ascendancy, commonweal, emberwright"],
                  ["Taken as prize by", "synod, covenant, salvage, procession, outrider"],
                  ["Patterns in the register", "7"],
                  ["Calibres chambered", "C.11 Short Rifle Cartridge, R.13 Line Cartridge, S.M.10 Stub Cartridge, R.13 Belt Link, M.G.13 Sustained-Fire Link, 50 mm Light Mortar Bomb"],
                ],
              },
      },
      { note: "The house is canon; this arsenal is thin ground. LORE has never named the Reclamation's works, only its appetite for issue." },
    ],
    see: ["calibre-c11-carbine", "calibre-r13-line", "calibre-sm10-stub", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-emberwright-foundries",
    title: "The Emberwright Union Foundries",
    folk: "the Anvilgate shops",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "Union foundries that would rather punch a hole in a crawler than empty a magazine at infantry.",
    blocks: [
      { lead: "The Emberwrights read the colour of the steel before they read the order, and every gun they make is heavier than it needs to be." },
      { p: "Ash-scarred and methodical, the Foundries answer every question with steel. Emberwright barrels run thicker than the drawings require, their breeches are proofed twice, and their shot is cut to bite plate rather than flesh. Union engineers publish tolerances the way parishes publish hymns and will argue a decimal for a season. What they will not do is make anything light. An Emberwright weapon is carried by two men or by a crawler, arrives late to every advance, and opens whatever the advance found waiting for it." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "armorPen +0.5 · rateOfFire -0.2 · weight +0.9"],
                  ["Name-stems", "Emberwright · Winter · Cinder · Forgeworks · Anvilgate"],
                  ["Native to", "emberwright"],
                  ["Licensed to", "reclamation, combine, ascendancy, commonweal, outrider"],
                  ["Taken as prize by", "synod, covenant, salvage, procession"],
                  ["Patterns in the register", "7"],
                  ["Calibres chambered", "R.13 Line Cartridge, M.G.13 Sustained-Fire Link, H.R.17 Heavy Rifle Round, 81 mm Mortar Bomb, 37 mm Crawler Gun Shot, 57 mm Crawler Gun Shell, 150 mm Siege Shell"],
                ],
              },
      },
      { note: "The Emberwright Union is canon; the foundries as an arms house are an extension the lore bible does not cover." },
    ],
    see: ["calibre-r13-line", "calibre-mg13-sustained", "calibre-hr17-heavy", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-ferrymen-shrine-armoury",
    title: "The Ferrymen's Shrine-Armoury",
    folk: "the cloth benches",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "A shrine-armoury of the Nine Cradles where each finished weapon is marked by hand and slowly.",
    blocks: [
      { lead: "They will not be hurried, and the Synod has never asked them to be." },
      { p: "Weapons leave the shrine-armoury of the Nine Cradles blessed, numbered and slower than the front would like. Each is fitted by one hand from breech to muzzle: barrel lapped, trigger stoned, stock cut from cradle timber and inscribed with the fitter's name and the date of the vigil. The Ferrymen hold that a weapon is a promise kept in metal, and that promises are not mass-produced. Line officers who have carried one rarely surrender it at rotation, and the Armoury's ledgers have quietly stopped pretending otherwise." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "accuracy +0.06 · reliability +0.05 · rateOfFire -0.25 · weight +0.6"],
                  ["Name-stems", "Cradle · Ferryman · Reliquary · Vigilant · Ninefold"],
                  ["Native to", "synod, procession"],
                  ["Licensed to", "combine, ascendancy, commonweal, outrider"],
                  ["Taken as prize by", "reclamation, covenant, salvage, emberwright"],
                  ["Patterns in the register", "4"],
                  ["Calibres chambered", "P.9 Service Round, R.13 Line Cartridge, 150 mm Siege Shell"],
                ],
              },
      },
      { note: "The Nine Cradles and the Synod are canon. That they proof weapons on a cloth-covered bench is not — it is thin ground, logged as such." },
    ],
    see: ["calibre-p9-service", "calibre-r13-line", "calibre-a150-shell", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-salvage-court-prize-yard",
    title: "The Prize Yard of the Salvage Court",
    folk: "the prize racks",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "Captured arms, re-worked and adjudicated by lot. Fast, cheap, and inclined to stop.",
    blocks: [
      { lead: "Nothing in the yard was made there. Everything in the yard has been made to work there, at least once." },
      { p: "The Prize Yard does not manufacture so much as adjudicate. Captured receivers are re-bored, mismatched furniture is married, and the whole is stamped with a writ number and sold to the party who lost it, at a mark-up the Court considers just. Yard patterns fire fast, weigh little and fail without warning; the warranty is the writ, and the writ is the point. Bailiff-armourers boast that nothing in the yard was ever bought, and that nothing sold out of it has ever been returned." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "rateOfFire +0.4 · reliability -0.14 · weight -0.2"],
                  ["Name-stems", "Prizeyard · Writ · Knife · Adjudicated · Bailiff"],
                  ["Native to", "salvage"],
                  ["Licensed to", "combine, outrider"],
                  ["Taken as prize by", "reclamation, synod, covenant, ascendancy, commonweal, emberwright, procession"],
                  ["Patterns in the register", "5"],
                  ["Calibres chambered", "P.9 Service Round, S.M.10 Stub Cartridge, 20-Bore Trench Shell, 37 mm Crawler Gun Shot, 20 mm Aircraft Cannon Shell"],
                ],
              },
      },
      { note: "The Salvage Court is canon; the prize yard as a manufacturing entity is an extension." },
    ],
    see: ["calibre-p9-service", "calibre-sm10-stub", "calibre-sg20-bore", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-crossloom-pattern-house",
    title: "The Crossloom Pattern House",
    folk: "the pattern sheets",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "A waystation drawing office that licenses its patterns to anyone who will pay the sheet fee.",
    blocks: [
      { lead: "Crossloom does not care who fires the weapon. Crossloom cares that the gauge is right." },
      { p: "Crossloom sells drawings, not favours. The pattern house was chartered so that a keel could refit at the Meet-ground without asking anyone's permission, and its designs are deliberately unremarkable: nothing brilliant, nothing brittle, no component beyond the reach of a middling workshop. The price is mass — a Crossloom weapon carries all the metal it takes to be repairable anywhere. Ten houses hold licences and none holds the drawings, which is precisely the arrangement the waystation's neutrality was built to survive." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "accuracy +0.02 · reliability +0.03 · weight +0.8"],
                  ["Name-stems", "Crossloom · Waymark · Knotwork · Tollgate · Openhand"],
                  ["Native to", "combine"],
                  ["Licensed to", "reclamation, synod, covenant, ascendancy, commonweal, salvage, emberwright, outrider"],
                  ["Taken as prize by", "procession"],
                  ["Patterns in the register", "7"],
                  ["Calibres chambered", "R.13 Line Cartridge, R.13 Belt Link, M.G.13 Sustained-Fire Link, H.R.17 Heavy Rifle Round, 50 mm Light Mortar Bomb, 57 mm Crawler Gun Shell, 105 mm Field Shell"],
                ],
              },
      },
      { note: "Crossloom is a waystation of the settled ground; a pattern house sitting in it is thin ground." },
    ],
    see: ["calibre-r13-line", "calibre-r13-belt", "calibre-mg13-sustained", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-ascendancy-signal-works",
    title: "The Signal Works of the Ascendancy",
    folk: "the long-ears",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "Optical benches and long barrels. The Ascendancy would rather see first than hit hard.",
    blocks: [
      { lead: "Reach is the whole argument, and the Signal Works has never pretended otherwise." },
      { p: "The Signal Works builds instruments that happen to shoot. Its barrels are long, its sights are ground glass, its ranging tables are printed on the stock, and its projectiles are light enough to be pushed further than a sensible ordnance board would push them. The Ascendancy holds that a shot seen and recorded at distance is worth more than a shot that merely kills nearby — a doctrine its riflemen find easier to admire than to survive. Every receiver carries a transmission serial as well as a number." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "range +1 · accuracy +0.07 · damage -0.35"],
                  ["Name-stems", "Testimony · Copperline · Longear · Beacon · Antenna"],
                  ["Native to", "ascendancy"],
                  ["Licensed to", "combine, synod, commonweal, outrider"],
                  ["Taken as prize by", "reclamation, covenant, salvage, emberwright, procession"],
                  ["Patterns in the register", "4"],
                  ["Calibres chambered", "R.13 Line Cartridge, 105 mm Field Shell, 20 mm Aircraft Cannon Shell"],
                ],
              },
      },
      { note: "The Ascendancy is canon; its signal works as an arms maker is an extension." },
    ],
    see: ["calibre-r13-line", "calibre-a105-shell", "calibre-ac20-aircraft", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-outrider-wheelwrights",
    title: "The Outrider Wheelwrights",
    folk: "the saddle shops",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "Wheelwrights turned gunsmiths. Everything they build is lighter than it should be and shorter than you want.",
    blocks: [
      { lead: "Weight is what kills a column, so the wheelwrights take weight out of everything, including the reach." },
      { p: "The Wheelwrights arm people who must carry everything they own at a trot. Their patterns are short, thin-walled and stripped of every ounce the Compact could argue away, with sealed actions that will run a season in dust without seeing a bench. What was traded away is reach: an Outrider weapon is decisive at conversational distance and merely irritating beyond it. Couriers accept the bargain, on the reasoning that a rifle which is present weighs more, in the end, than a rifle that was left behind." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "weight -0.9 · reliability +0.05 · range -0.8"],
                  ["Name-stems", "Outrider · Dustpromise · Wheelwright · Skimline · Courier"],
                  ["Native to", "outrider"],
                  ["Licensed to", "combine, covenant, commonweal, salvage"],
                  ["Taken as prize by", "reclamation, synod, ascendancy, emberwright, procession"],
                  ["Patterns in the register", "3"],
                  ["Calibres chambered", "C.11 Short Rifle Cartridge, R.13 Line Cartridge, S.M.10 Stub Cartridge"],
                ],
              },
      },
      { note: "The outriders are canon; a named wheelwrights' works is thin ground." },
    ],
    see: ["calibre-c11-carbine", "calibre-r13-line", "calibre-sm10-stub", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "maker-tarpool-burnworks",
    title: "The Tarpool Burnworks",
    folk: "the mixing trough",
    category: "powers",
    tag: "Arms Catalogue §3",
    status: "thin",
    summary: "A burn-town works that sells thickened fuel, projector wands and a reputation nobody enjoys.",
    blocks: [
      { lead: "Tarpool sells fire. It has never much cared what the fire is pointed at." },
      { p: "The Burnworks grew out of a seam fire that has never been put out, and its trade has followed the flame ever since: thickened fuels, incendiary fillings and the projectors that deliver them. Tarpool sells to every house at once and considers that a moral position. Its patterns hit far harder than their weight suggests and are trusted by no quartermaster alive — pressure vessels sweat, valves stick, and the works' own proof-house has burned to the ground three times. Prices are posted daily, in chalk." },
      {
        h: "The works, in the Ministry's hand",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Signature", "damage +0.45 · reliability -0.12"],
                  ["Name-stems", "Tarpool · Seamfire · Burnworks · Slagline · Firetongue"],
                  ["Native to", "emberwright"],
                  ["Licensed to", "reclamation, combine, ascendancy, commonweal, salvage, procession, outrider"],
                  ["Taken as prize by", "synod, covenant"],
                  ["Patterns in the register", "4"],
                  ["Calibres chambered", "F.G.2 Thickened Fuel Grade, 50 mm Light Mortar Bomb, 81 mm Mortar Bomb"],
                ],
              },
      },
      { note: "Tarpool is a burn-town of the settled ground; the Burnworks as an arms house is an extension." },
    ],
    see: ["calibre-fg2-fuel", "calibre-m50-bore", "calibre-m81-bore", "works", "order-of-battle", "great-houses"],
  },
  {
    id: "calibre-p9-service",
    title: "P.9 Service Round",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The service sidearm round — issued by rank, fired by desperation.",
    blocks: [
      { lead: "The officer's round, and the last argument of a gun crew that has lost its gun." },
      { p: "Standardised by the Hundredweight Combine Works for pit-boss and signal officer alike, and adopted wholesale because it was already in every drawer on the Ground. It settles arguments in a trench and nothing further out." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "sidearm"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "1.6"],
                  ["Reference armour penetration", "1"],
                  ["Reference range (hexes)", "2"],
                  ["Reference weight", "1.1"],
                  ["Patterns chambered", "Bottoms 166 Pit Revolver, Mk I; Writ 214 Yard Automatic, Mk III; Reliquary 188 Officer's Sidearm, Mk II"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-hundredweight-works", "maker-salvage-court-prize-yard", "maker-ferrymen-shrine-armoury", "supply", "order-of-battle"],
  },
  {
    id: "calibre-sm10-stub",
    title: "S.M.10 Stub Cartridge",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The stub cartridge of the trench automatics: short reach, high volume, no pretensions.",
    blocks: [
      { lead: "A short, fat, unambitious cartridge that exists to fill a trench with noise at ten paces." },
      { p: "A shortened pistol case the State Arsenal adopted so that a levy could be armed for a room rather than a field. The Salvage Court re-bores half the Ground's captured stubs to it, which is why nobody agrees whose cartridge it is." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "smg"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "1.4"],
                  ["Reference armour penetration", "1"],
                  ["Reference range (hexes)", "3"],
                  ["Reference weight", "3.4"],
                  ["Patterns chambered", "Levy 236 Trench Automatic, Mk II; Knife 288 Room Gun, Mk V; Skimline 259 Saddle Gun, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-reclamation-state-arsenal", "maker-salvage-court-prize-yard", "maker-outrider-wheelwrights", "supply", "order-of-battle"],
  },
  {
    id: "calibre-c11-carbine",
    title: "C.11 Short Rifle Cartridge",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "A rifle round cut down until a mounted or wheeled man can carry a useful number of them.",
    blocks: [
      { lead: "The compromise round: a rifle cartridge shortened until a mounted man can carry it." },
      { p: "The Outrider Compact's courier round: the line cartridge cut down until a rider could carry two hundred of them and still post a day's distance. The Wheelwrights standardised it; every scout arm on the Ground has since been drawn around it." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "carbine"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "2.2"],
                  ["Reference armour penetration", "2"],
                  ["Reference range (hexes)", "5"],
                  ["Reference weight", "3.6"],
                  ["Patterns chambered", "Courier 197 Dust Carbine, Mk II; Sledge 203 Short Rifle, Mk I; Unity 241 Column Carbine, Mk IV"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-outrider-wheelwrights", "maker-hundredweight-works", "maker-reclamation-state-arsenal", "supply", "order-of-battle"],
  },
  {
    id: "calibre-r13-line",
    title: "R.13 Line Cartridge",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "canon",
    summary: "The line cartridge — the single round the standardisation doctrine is about.",
    blocks: [
      { lead: "One round for every rifle on the front, which is the whole of the standardisation argument." },
      { p: "The cartridge the doctrine Standardized Calibers is about: one case, one bullet weight, one set of chamber drawings, published free by the Hundredweight Combine Works in 143 F.I. and adopted by every house that had to feed a levy. Before it, a rifle company scavenged four incompatible rounds and shot with whichever fitted; after it, ammunition ceased to be an argument and became a supply line." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "rifle"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "2.8"],
                  ["Reference armour penetration", "2.5"],
                  ["Reference range (hexes)", "7"],
                  ["Reference weight", "4.3"],
                  ["Patterns chambered", "Hundredweight 141 Levy Rifle, Mk II; Verdict 229 Service Rifle, Mk III; Waymark 252 Pattern Rifle, Mk I; Copperline 268 Long Rifle, Mk II; Cinder 276 Breaching Rifle, Mk I; Dustpromise 311 Field Rifle, Mk II; Ninefold 159 Vigil Rifle, Mk I; Ferryman 171 Watch Rifle, Mk II; Longear 294 Ranging Rifle, Mk I; Bottoms 262 Selected Rifle, Mk III"],
                ],
              },
      },
      { note: "This is the cartridge the shipped Standardized Calibers doctrine is about — \"one cartridge for every rifle on the front, no more scavenging mismatched rounds\". The doctrine row is authority; this entry only names the round." },
    ],
    see: ["maker-hundredweight-works", "maker-reclamation-state-arsenal", "maker-crossloom-pattern-house", "supply", "order-of-battle"],
  },
  {
    id: "calibre-r13-belt",
    title: "R.13 Belt Link",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The line cartridge on a link, fed through a squad gun instead of a bolt.",
    blocks: [
      { lead: "The same round the section already carries, arriving five at a time instead of one." },
      { p: "The line cartridge on a disintegrating steel link, standardised by the State Arsenal so that a squad's automatic and a squad's rifles draw from one crate. The link is the whole invention; the round is unchanged, and deliberately so." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "lmg"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "2.8"],
                  ["Reference armour penetration", "2.5"],
                  ["Reference range (hexes)", "8"],
                  ["Reference weight", "9.8"],
                  ["Patterns chambered", "Combine 184 Squad Automatic, Mk III; Ironworks 257 Belt Gun, Mk II; Knotwork 274 Light Gun, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-hundredweight-works", "maker-reclamation-state-arsenal", "maker-crossloom-pattern-house", "supply", "order-of-battle"],
  },
  {
    id: "calibre-hr17-heavy",
    title: "H.R.17 Heavy Rifle Round",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The heavy rifle round: designed against plate, priced against a man's back.",
    blocks: [
      { lead: "A cartridge designed against plate, not against men, and the weight makes no apology for it." },
      { p: "The Emberwright Union's answer to the first crawler that walked through a rifle company: a long tapered case, a hardened core, and a recoil the Foundries never pretended to have solved. It is issued by the round, counted by the round, and answered for by the round." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "anti armor"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "5.5"],
                  ["Reference armour penetration", "8"],
                  ["Reference range (hexes)", "6"],
                  ["Reference weight", "16.5"],
                  ["Patterns chambered", "Winter 214 Anti-Crawler Rifle, Mk II; Openhand 281 Shaped Lance, Mk I; Sledge 302 Shoulder Gun, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-emberwright-foundries", "maker-crossloom-pattern-house", "maker-hundredweight-works", "supply", "order-of-battle"],
  },
  {
    id: "calibre-sg20-bore",
    title: "20-Bore Trench Shell",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "A bore rather than a calibre, and the Ministry has stopped correcting the paperwork.",
    blocks: [
      { lead: "Twenty to the pound of lead, which is a measure of nothing the ranging tables use." },
      { p: "A metal-headed paper shell of buck, standardised by the Prize Yard for boarding work because the bore forgives a barrel nobody has measured. Ruinous against a greatcoat, useless against a skirt of plate at any distance whatever." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "shotgun"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "3.6"],
                  ["Reference armour penetration", "1"],
                  ["Reference range (hexes)", "2"],
                  ["Reference weight", "3.9"],
                  ["Patterns chambered", "Bailiff 245 Boarding Gun, Mk II; Sledge 218 Trench Sweeper, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-salvage-court-prize-yard", "maker-hundredweight-works", "supply", "order-of-battle"],
  },
  {
    id: "calibre-mg13-sustained",
    title: "M.G.13 Sustained-Fire Link",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The sustained-fire link — belted work, fired by the hour rather than the magazine.",
    blocks: [
      { lead: "Guns fed from this link are counted in belts consumed, never in rounds." },
      { p: "The line cartridge again, loaded hot and linked heavy for a water-jacketed gun that is expected to fire all night. The Crossloom Pattern House holds the drawings and licenses them to anyone, which is why the belts fit guns that fit nothing else." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "hmg"],
                  ["Logistics column", "riflemen"],
                  ["Reference damage", "3.2"],
                  ["Reference armour penetration", "3"],
                  ["Reference range (hexes)", "9"],
                  ["Reference weight", "26"],
                  ["Patterns chambered", "Tollgate 206 Sustained Gun, Mk II; Anvilgate 233 Heavy Gun, Mk I; State 299 Pintle Gun, Mk IV"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-crossloom-pattern-house", "maker-emberwright-foundries", "maker-reclamation-state-arsenal", "supply", "order-of-battle"],
  },
  {
    id: "calibre-fg2-fuel",
    title: "F.G.2 Thickened Fuel Grade",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "A grade of thickened fuel issued as ammunition, because that is what it is.",
    blocks: [
      { lead: "It is carried in a pack, drawn from the ammunition column, and nobody calls it fuel to its face." },
      { p: "Tarpool's second grade: seam tar cut with light distillate until it clings, thrown from a pressure vessel nobody enjoys carrying. It goes over a parapet, through a firing slit and into a bunker's air, and stops dead at the first sealed hatch." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "flame"],
                  ["Logistics column", "crawler"],
                  ["Reference damage", "4"],
                  ["Reference armour penetration", "1"],
                  ["Reference range (hexes)", "2"],
                  ["Reference weight", "21"],
                  ["Patterns chambered", "Seamfire 226 Trench Projector, Mk II; Slagline 305 Hull Projector, Mk I; Bottoms 249 Gallery Burner, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-tarpool-burnworks", "maker-hundredweight-works", "supply", "order-of-battle"],
  },
  {
    id: "calibre-m50-bore",
    title: "50 mm Light Mortar Bomb",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The light bomb: two men, a tube, and fire that arrives before the request does.",
    blocks: [
      { lead: "The smallest thing on the Ground that can drop a bomb behind a wall." },
      { p: "A finned bomb one man can carry six of, standardised by the Commonweal March so that a commune's levy could answer a machine-gun without waiting on a battery. Thin-walled, generous with fragments, indifferent to plate." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "mortar"],
                  ["Logistics column", "artillery"],
                  ["Reference damage", "4.5"],
                  ["Reference armour penetration", "2"],
                  ["Reference range (hexes)", "9"],
                  ["Reference weight", "18"],
                  ["Patterns chambered", "Crossloom 221 Light Mortar, Mk II; Verdict 263 Commune Mortar, Mk III; State 278 Concussion Mortar, Mk II; Firetongue 313 Incendiary Mortar, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-crossloom-pattern-house", "maker-reclamation-state-arsenal", "maker-tarpool-burnworks", "supply", "order-of-battle"],
  },
  {
    id: "calibre-m81-bore",
    title: "81 mm Mortar Bomb",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The battalion bomb — heavy enough to matter, light enough to displace in time.",
    blocks: [
      { lead: "Heavy enough to matter, light enough to be somewhere else before the counter-battery lands." },
      { p: "The battalion bore, standardised by the Crossloom Pattern House from three competing designs on the reasoning that the Ground could afford one of them. It reaches over any ridge on a tactical field and lands with enough case to matter." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "mortar"],
                  ["Logistics column", "artillery"],
                  ["Reference damage", "7.5"],
                  ["Reference armour penetration", "3"],
                  ["Reference range (hexes)", "13"],
                  ["Reference weight", "56"],
                  ["Patterns chambered", "Forgeworks 239 Battalion Mortar, Mk I; Tarpool 317 Fume Mortar, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-emberwright-foundries", "maker-tarpool-burnworks", "supply", "order-of-battle"],
  },
  {
    id: "calibre-cg37-bore",
    title: "37 mm Crawler Gun Shot",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The first shot that ever went through a crawler, and still the cheapest that does.",
    blocks: [
      { lead: "It was adequate once. The Ministry has never quite admitted that it stopped being adequate." },
      { p: "The first bore cut specifically to open a hull rather than a formation, standardised by the Emberwright Foundries in the decade the line crawler stopped being a novelty. Fast, flat, and increasingly embarrassed by what it meets on a modern glacis." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "crawler gun"],
                  ["Logistics column", "crawler"],
                  ["Reference damage", "6.5"],
                  ["Reference armour penetration", "9"],
                  ["Reference range (hexes)", "10"],
                  ["Reference weight", "95"],
                  ["Patterns chambered", "Emberwright 247 Hull Gun, Mk II; Prizeyard 277 Turret Gun, Mk III"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-emberwright-foundries", "maker-salvage-court-prize-yard", "supply", "order-of-battle"],
  },
  {
    id: "calibre-cg57-bore",
    title: "57 mm Crawler Gun Shell",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The breakthrough shell — what the 37 asks politely, the 57 does not.",
    blocks: [
      { lead: "A gun this size is not fitted to a crawler. A crawler is built around it." },
      { p: "The Foundries' reply to their own success: the same doctrine at a bore that still means it against face-hardened plate. It costs a larger turret ring, a longer loader and a crawler built around the gun rather than the other way about." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "crawler gun"],
                  ["Logistics column", "crawler"],
                  ["Reference damage", "10"],
                  ["Reference armour penetration", "13"],
                  ["Reference range (hexes)", "12"],
                  ["Reference weight", "160"],
                  ["Patterns chambered", "Forgeworks 291 Breakthrough Gun, Mk I; Tollgate 318 Casemate Gun, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-emberwright-foundries", "maker-crossloom-pattern-house", "supply", "order-of-battle"],
  },
  {
    id: "calibre-a105-shell",
    title: "105 mm Field Shell",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The field shell: the workhorse of every gun column on the Ground.",
    blocks: [
      { lead: "More ground has been taken by this shell than by every rifle in the register combined." },
      { p: "The divisional shell, standardised by the Charter Combine because a single shell weight is a single contract. Fused for burst or delay, it is the round that most often decides a field engagement without anyone on the field seeing the gun." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "artillery"],
                  ["Logistics column", "artillery"],
                  ["Reference damage", "14"],
                  ["Reference armour penetration", "7"],
                  ["Reference range (hexes)", "16"],
                  ["Reference weight", "290"],
                  ["Patterns chambered", "Crossloom 235 Field Piece, Mk II; Beacon 256 Ranging Gun, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-crossloom-pattern-house", "maker-ascendancy-signal-works", "supply", "order-of-battle"],
  },
  {
    id: "calibre-a150-shell",
    title: "150 mm Siege Shell",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "The siege shell — it is not moved quickly, and it does not need to be.",
    blocks: [
      { lead: "It is not carried anywhere quickly, and the works it is fired at are not going anywhere either." },
      { p: "The works-breaker, standardised by the Bastion Synod for the reduction of poured positions and kept in production by everyone who has since had to reduce one. Two men and a cradle to load; a bunker's ceiling to answer for." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "artillery"],
                  ["Logistics column", "artillery"],
                  ["Reference damage", "22"],
                  ["Reference armour penetration", "10"],
                  ["Reference range (hexes)", "20"],
                  ["Reference weight", "520"],
                  ["Patterns chambered", "Anvilgate 284 Siege Howitzer, Mk II; Reliquary 198 Keel Gun, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-emberwright-foundries", "maker-ferrymen-shrine-armoury", "supply", "order-of-battle"],
  },
  {
    id: "calibre-ac20-aircraft",
    title: "20 mm Aircraft Cannon Shell",
    category: "war",
    tag: "Arms Catalogue §4",
    status: "thin",
    summary: "An aircraft cannon shell: a short burst off a wing, economical in nothing.",
    blocks: [
      { lead: "Two seconds of trigger empties a wing bay, and the wing bay is the whole of the argument." },
      { p: "A short high-velocity shell standardised by the Signal Works for wing mountings, where every gram is argued over and nothing may be reloaded in flight. It arrives in a two-second burst or not at all." },
      {
        h: "Reference figures",
        table: {
                head: ["Field", "Reading"],
                rows: [
                  ["Class", "aircraft gun"],
                  ["Logistics column", "fighter"],
                  ["Reference damage", "7"],
                  ["Reference armour penetration", "6"],
                  ["Reference range (hexes)", "6"],
                  ["Reference weight", "48"],
                  ["Patterns chambered", "Antenna 272 Wing Cannon, Mk II; Adjudicated 296 Nose Battery, Mk I"],
                ],
              },
      },
      { note: "A pattern chambered for this round sits within half again of every figure above — that band is what stops a \"rifle\" being an artillery piece with a rifle's paperwork." },
    ],
    see: ["maker-ascendancy-signal-works", "maker-salvage-court-prize-yard", "supply", "order-of-battle"],
  },
```

*This block is compared byte-for-byte against `src/lib/wiki/entries.js` by `test/arms-mirror.test.js`,
so it cannot drift from what shipped.*

---

## 14. `[PROPOSED — awaiting platform wiring]`

*The text below is appended verbatim to `docs/GAME_RULES.md` as section 23, for the platform lane to
promote. This copy is the record; a test asserts the two are identical.*

---

## 23. The Arms Catalogue & the Universal Damage Model [PROPOSED — awaiting platform wiring]

*Lane I · source of record `docs/ARMS_CATALOGUE.md` · data `base44/shared/arms.ts` (mirror `src/lib/arms.js`).
Nothing below is wired into the engine yet: the tables, the roll and the damage model exist and are
tested; the platform lane decides when `rollWeapon` fires and where a stand's `armour` is stored.*

- **"Rifles" is a class, not a weapon.** A squad carries **weapon patterns** — 49 named
  patterns from 9 fictional manufacturers, in 16 calibres, at one of **5
  quality grades** (`scrap · issue · proofed · master · relic`), with slot-based **modifications**
  (47 across 8 slots) and named **quirks** (33, every one machine-evaluable).
- **The Universal Damage Model is the only armour arithmetic in the game.** A hit resolves as
  `delta = weapon.armorPen − target.armourValue` → `PEN_TABLE` multiplier → `TYPE_MATRIX[damageType][armourClass]`
  multiplier → `effective`. There are **7 armour classes** (`none` through `fortified`) and **7 damage
  types**, so the matrix is 49 numbers and there are no defaults and no fallbacks.
- **A rifle cannot scratch a crawler, and that is a rule, not a rounding.** `PEN_TABLE` carries a
  mandatory `mult: 0` row. At issue grade with no mods, every `sidearm/carbine/rifle/smg/lmg/hmg/shotgun/marksman/flame`
  pattern does **exactly 0** effective damage to `heavy` and `superheavy` armour, while every
  `anti_armor/crawler_gun/artillery` pattern does not.
- **A zero-effect hit still suppresses.** `resolveHit` returns `{ effective, suppressOnly }`; a rifle
  volley pins a crawler's crew without hurting the crawler. The weight of that suppression is data:
  `SUPPRESSION.onZeroEffect = 0.5`, `SUPPRESSION.concussiveBonus = 0.5`.
- **Area fire rolls against each victim's own armour.** `resolveAoe` calls `resolveHit` once per victim
  inside the burst radius, with damage scaled by `max(0, 1 − falloff × distance)`. Victims outside the
  radius are not in the result at all.
- **Weapons are rolled, not picked.** `rollWeapon({ seed, class, maker, calibre, tierCap, luck })` draws
  one `mulberry32` stream in a fixed, documented order and returns a `WeaponInstance`
  `{ patternKey, quality, mods, quirks, serial }`. The same seed returns the same weapon forever —
  serials are reproduced from the seed, not stored. Quality is **not** gated by `tierCap`; `tierCap`
  gates the pattern pool only. `luck` (clamped to `[-1, 1]`) tilts the quality draw and nothing else.
- **The engine never sees a rifle.** `deriveLoadout(squad)` reduces a squad's carried weapons to
  `SquadType`-shaped numbers (`melee`, `ranged`, `range` absolute; `speed`, `pts` deltas), and
  `loadoutProfile(squad)` hands the engine the damage profile `{ armorPen, damageType, aoe, misfire }`
  it feeds to `resolveHit`. Nothing below squad level crosses that line.
- **Points.** `SquadType.pts` is the cost of a **squad** (`riflemen` = 100 for ten figures);
  `WeaponPattern.pts` is the cost of **one weapon**. The reference is the **Hundredweight 141 Levy
  Rifle at issue grade = 1 point per figure** — a ten-figure section therefore carries 10 points of
  weapon. Anti-armour value is priced on a **separate rate** from anti-personnel value, so a heavy
  anti-crawler rifle is not free against infantry. No pattern exceeds **1.6×**
  the reference's points-efficiency; the audited maximum is **1.2724** (`hw218_sledge_trench_sweeper_mk1`).

**Platform wiring still owed:** when `rollWeapon` fires (battle loot, dig finds, armory
certifications); where a `Loadout` is persisted on a squad row; where a stand's `armour` class is
stored (vehicles carry one per facing); and validation of any `WeaponInstance` arriving from a client.
