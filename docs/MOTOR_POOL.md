# The Motor Pool — design record (Lane J)

Canonical data: `base44/shared/motorPool.ts` · mirror: `src/lib/motorPool.js` ·
tests: `test/motor-mirror.test.js`, `test/motor-roll.test.js`.

Contract: `docs/TACTICAL_SQUAD_PLAN.md` §3 (ownership), §4 (payload shapes), §6 (drift guards).
Consumes Lane I's `base44/shared/arms.ts` and Lane B's `base44/shared/tacticalField.ts`.

## 1. Purpose & scope

A "crawler" is a chassis **class**, not a vehicle. A mechanized stand is a named **chassis pattern**
from a named motor-works, fitted with a powerplant, an armour package, a suspension, a mount,
hardpoint weapons drawn from Lane I's `WEAPON_PATTERNS`, refit kits and rolled quirks — priced in
points and rolled by a pure, seeded `rollVehicle()`.

**The rule that governs everything below: there is no armour or penetration arithmetic in this lane.**
Drift guard 12 puts the whole Universal Damage Model in `arms.ts`. This lane declares `ArmourClass`
**keys** per facing and passes weapon `armorPen` through untouched, never comparing it to anything.
`base44/shared/motorPool.ts` and `src/lib/motorPool.js` contain none of the four identifiers that
name that model, and `test/motor-mirror.test.js` asserts their absence from the source text. The
engine takes the four facing keys out of `deriveMechanized()` and hands them to `arms.ts`, which
resolves the hit against the struck facing.

One consequence is worth stating plainly, because it looks like an omission: `deriveMechanized()`
does **not** return `armor`. A numeric armour rating would require reading an armour value, which is
the prohibited operation. It returns `facings` instead, and the engine derives the number.

Two things this lane deliberately does **not** own:

- **A general's command vehicle.** `base44/shared/commandVehicles.ts` (platform-owned) holds
  `COMMAND_VEHICLES`, `SUPREME_VEHICLE`, its own `VEHICLE_MODS` and `vehicleOf()`. Those are
  **general modifiers** — a trait attached to a commander, priced in `steel`/`fuel`/`manpower` and
  expressed as `dmgOut`/`dmgIn`/`skill`/`moraleIn` multipliers on a macro battle. A Motor Pool
  chassis is a **stand on the tactical field**, priced in points and resolved hex by hex. The two
  tables share no key, and this one never re-declares a row of that one.
- **Visuals.** This is a content lane (drift guard 10): data and prose only. Art is *requested* as
  `imageLibrary.js` placeholders with `url: null`.

**Two additions to the export surface the lane brief lists, declared rather than smuggled.** Neither
changes a §4 shape, so neither is a §4 amendment; both are mirrored and mirror-tested like everything
else here.

- **`MOTOR_MODEL`** — the constants `deriveMechanized`, `breakdownChance` and `totalTonnage` spend,
  plus the six specials sources, in one table. The alternative was a dozen bare numbers inside
  function bodies, which drift guard 7 forbids, and the specials sources have to be *data* if the
  vocabulary is to be checked in both directions.
- **`evaluateVehicleQuirk(quirk, ctx)`** — the vehicle-side twin of `arms.ts`'s `evaluateQuirk`. Drift
  guard 11 says every quirk carries a machine-evaluable condition; that is only true if something
  evaluates it, and three functions here do.

**One flag for the platform lane, and it is a question this lane declines to answer by inventing a
number.** The Points Audit anchors on the **macro** scale — `src/lib/units.js` `crawler.points === 12`,
which §3 pins and which §13 recomputes against — while a tactical `SquadType` prices a whole squad
(`riflemen.pts === 100`). `deriveMechanized().pts` is therefore on the chassis scale. Reconciling the
two is one documented multiplier, it belongs with whoever owns `SQUAD_TYPES`, and guessing at it here
would put a third scale in the repository rather than removing one.

## 2. Nomenclature

As Lane I: **maker name-stem · pattern year · name · mark**, where the works has issued a mark.

> *Grimwold 138 Breaker, Mk III* · *Hundredweight 141 Line Crawler* · *Reliquary 124 Monitor, Mk II*

The stem is drawn from the maker's `nameStems` in `MANUFACTURERS`. The year is the pattern year in
the F.I. calendar, not a serial. The **key is the label in snake_case**, with `, Mk III` becoming
`_mk3` — so the two cannot drift apart unnoticed, and the mirror test asserts the derivation over
every row rather than spot-checking it.

Powerplants are named plainly (`Anvilgate Twin-Bank Diesel, 240 hp`), because a plant is bought by
its rating and not by its drawing number. Refit kits are named for what they are.

## 3. The Motor Works

Five works are appended to Lane I's `MANUFACTURERS`, keyed `mw_*`, under the §3 grant
(*"Lane J appends motor-works to Lane I's `MANUFACTURERS`, keys `mw_*`, rather than duplicating the
table"*). They conform to Lane I's `Manufacturer` shape exactly and add no field to it. The keys are
also exported from `motorPool.ts` as `MOTOR_WORKS_KEYS`.

| Key | Works | Tie | Signature lean | Builds |
| --- | --- | --- | --- | --- |
| `mw_grimwold_treadworks` | The Grimwold Treadworks | house `covenant` | `armorPen +0.35`, `rateOfFire −0.15`, `reliability +0.04`, `weight +0.7` | breakthrough hulls, land forts |
| `mw_chandlery_carriageworks` | The Chandlery Carriageworks | culture `chandlery` | `reliability +0.09`, `weight −0.35`, `damage −0.15` | carriers, prime movers |
| `mw_kettleharrow_boneyard` | The Kettleharrow Boneyard | culture `kettleharrow` | `reliability −0.16`, `damage +0.25`, `weight +0.3` | salvage-built gun hulls |
| `mw_longshadow_aeroworks` | The Longshadow Aeroworks | house `combine` | `accuracy +0.05`, `range +0.6`, `weight −0.45`, `reliability −0.05` | airframes |
| `mw_redwater_hullyards` | The Redwater Hullyards | culture `redwater_digs` | `damage +0.3`, `reliability +0.02`, `weight +0.5`, `accuracy −0.04` | shallow-draught gunboats |

Every one carries an `access` grade for all ten house keys, so `ACCESS_COST` prices a licensed or
captured hull the way it prices a licensed or captured rifle. None of the five owns a weapon pattern
today; their signature leans are read by the Motor Pool, and are available to Lane I's roll if a
later pattern names one.

The append is the **only** change this lane makes to `arms.ts` / `src/lib/arms.js`. Lane I scoped
every one of its own manufacturer assertions to its own nine keys precisely so this append could not
turn `main` red; this lane returns the courtesy by asserting no manufacturer **count** of its own.

## 4. Chassis patterns

Twenty hulls, at least one per `VehicleClass`, spread across all six tiers and all fourteen makers.

**`hull.tonnage` is the all-up combat weight the ordnance boards stamp on the hull** — armour,
running gear and the works' nominal plant, ready to fight and before any refit. It is the tonnage
the speed curve divides into. A refit that changes the plant changes power, not the stamp: the
boards weigh a hull once. A plant far heavier than the pattern was drawn around is not a second
weight ledger; it is **drive strain**, and it is read there (§ breakdowns).

**`hull.baseArmour` declares all four facings.** There is no default facing and no fallback: a
chassis missing `top` is a lane failure, not a hull with an open roof. An open roof is `top: 'none'`,
which is a declaration.

| Pattern | Class | Tier | Works | t | Crew | Facings F/S/R/T | Hardpoints | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Outrider 129 Whippet, Mk II | `scout_crawler` | I | Outrider Wheelwrights | 5.5 | 2 | light / soft / soft / soft | ring (hmg, flame) | 5 |
| Knife 136 Ferret, Mk III | `scout_crawler` | II:Cache | Prize Yard of the Salvage Court | 6.5 | 2 | light / light / soft / soft | turret (crawler_gun, hmg) | 7 |
| Hundredweight 141 Line Crawler | `line_crawler` | I | Hundredweight Combine Works | 14 | 4 | medium / light / light / soft | turret (crawler_gun, hmg); hull (hmg, flame) | **12** |
| Verdict 144 Levy Crawler | `line_crawler` | I | State Arsenal of the Reclamation | 12 | 4 | medium / light / soft / soft | turret (crawler_gun, hmg); bow (hmg) | 11 |
| Tollgate 147 Knotwork Crawler, Mk II | `line_crawler` | II:Eng | Crossloom Pattern House | 16 | 5 | medium / medium / light / soft | turret (crawler_gun, hmg); hull (hmg, flame); sponson (hmg) | 16 |
| Grimwold 138 Breaker, Mk III | `heavy_crawler` | II:Eng | Grimwold Treadworks | 28 | 5 | heavy / medium / light / light | turret (crawler_gun); hull (hmg, flame); coax (hmg) | 18 |
| Forgeworks 152 Cinderhead | `heavy_crawler` | III | Emberwright Union Foundries | 34 | 6 | heavy / heavy / medium / light | turret (crawler_gun); hull (flame); sponson ×2 (hmg) | 22 |
| Grimwold 156 Lockjaw, Mk I | `land_fort` | III | Grimwold Treadworks | 96 | 14 | superheavy / superheavy / heavy / medium | main turret (artillery, crawler_gun); sponson ×2 (crawler_gun); ring ×2 (hmg); mortar pit (mortar) | 44 |
| Drover 134 Provender Carrier | `half_track` | I | Chandlery Carriageworks | 9 | 3 | light / soft / soft / none | ring (hmg) | 5 |
| Seamfire 143 Burnwagon | `half_track` | II:Eng | Tarpool Burnworks | 11 | 3 | light / light / soft / none | bow (flame); ring (hmg) | 7 |
| Dustpromise 131 Courier, Mk II | `armoured_car` | I | Outrider Wheelwrights | 4.5 | 3 | light / soft / soft / soft | turret (hmg) | 5 |
| Copperline 139 Beacon Car | `armoured_car` | II:Ciph | Signal Works of the Ascendancy | 6 | 4 | light / light / soft / soft | ring (hmg) | 6 |
| Sledge 145 Pit Gun | `sp_gun` | I | Hundredweight Combine Works | 15 | 4 | medium / light / light / none | casemate (artillery, crawler_gun); ring (hmg) | 16 |
| Harrow 149 Slaghound, Mk II | `sp_gun` | II:Cache | Kettleharrow Boneyard | 18 | 4 | heavy / light / soft / none | casemate (crawler_gun); ring (hmg) | 13 |
| Crossloom 128 Field Carriage | `tractor_gun` | I | Crossloom Pattern House | 7 | 6 | soft / none / none / none | trail (artillery, mortar) | 9 |
| Punt 137 Shoalcutter | `gunboat` | I | Redwater Hullyards | 22 | 8 | light / light / soft / none | fore turret (crawler_gun, hmg); aft ring (hmg) | 10 |
| Reliquary 124 Monitor, Mk II | `gunboat` | II:Wake | Ferrymen's Shrine-Armoury | 46 | 14 | medium / medium / light / light | main (artillery); casemate (crawler_gun); ring ×2 (hmg) | 26 |
| Kestrel 150 Lofter, Mk II | `fighter` | II:Ciph | Longshadow Aeroworks | 2.4 | 1 | light / soft / none / soft | nose (aircraft_gun); wing (aircraft_gun) | 16 |
| Adjudicated 142 Writhawk | `fighter` | II:Cache | Prize Yard of the Salvage Court | 2.1 | 1 | soft / soft / none / none | nose (aircraft_gun); ring (hmg) | 10 |
| Longshadow 154 Span, Mk I | `bomber` | III | Longshadow Aeroworks | 9.5 | 5 | light / soft / soft / soft | bay (artillery, mortar); nose (aircraft_gun); dorsal (hmg); ventral (hmg) | 24 |

**Slots.** A chassis declares which of the nine `VehicleSlot`s its hull will accept, and a kit for a
slot the chassis does not declare cannot be fitted however well it would suit. The declarations are
content, not boilerplate: the Whippet has no `armour` slot (the hull will not take plate) and no
`crew_kit` (two men, no room); the Verdict has no `radio` (levy machines went out without one); the
Writhawk has neither `armour` nor `crew_kit`; airframes have no `suspension` slot, because flight
gear is not a thing a crew refits in the field. Every one of the nine slots is offered by at least
one chassis, which is what makes the ≥ 2-kits-per-slot floor in §9 reachable.

**Pricing.** Every chassis is priced against the **Hundredweight 141 Line Crawler at 12 pts**, which
is pinned by §3 and by the live macro table (`src/lib/units.js` `crawler.points === 12`). The value
model and the full audit are §13; the short version is that a hull's combat value is its
exposure-weighted protection plus 0.7 × what its hardpoints can carry, and `pts` is that value
divided by the reference's efficiency, adjusted where the model is knowingly blind (a carrier's
cargo, a beacon car's transmitter, a land fort's role as a scenario centrepiece).

Cross-checks against the live macro table, which were not fitted to and broadly agree: line crawler
12 ↔ 12, tractor gun 9 ↔ artillery 10, Shoalcutter 10 ↔ gunboat 10, Lofter 16 ↔ fighter 15.

## 5. Powerplants & the speed curve

Twelve plants. `hp` and `weight` (tonnes) are the plant's own; `reliability` is a base probability in
`[0, 1]` that a turn passes without a mechanical fault, before suspension, package and quirks touch
it; `heat` is the cooling burden in works units, 0–12, which prices radiators rather than damage and
is what makes a turbine a poor neighbour in a sealed hull.

`fuelClass` is a **regiment** key out of `src/lib/units.js` `UNIT_KEYS` — a plant's real cost is
whose supply column carries its fuel.

> **Flag for the platform lane.** `arms.ts` exports `LOGISTICS_CLASSES` with four entries and no
> `gunboat`. That table prices calibres, not plants. This lane uses the five-key regiment vocabulary
> the contract specifies rather than narrowing a marine diesel into an inland column, and says so
> here rather than silently picking one of the two.

| Plant | hp | t | reliability | fuelClass | heat |
| --- | --- | --- | --- | --- | --- |
| Hundredweight Flatbed Diesel, 60 hp | 60 | 1.4 | 0.90 | crawler | 2 |
| Courier Alcohol Burner, 75 hp | 75 | 0.8 | 0.85 | riflemen | 2 |
| State Levy Diesel, 95 hp | 95 | 1.9 | 0.78 | crawler | 3 |
| Boneyard Pieced Diesel, 120 hp | 120 | 2.9 | 0.58 | crawler | 6 |
| Knotwork Governed Diesel, 140 hp | 140 | 2.6 | 0.88 | crawler | 3 |
| Seamfire Flash Boiler, 180 hp | 180 | 5.1 | 0.66 | artillery | 9 |
| Anvilgate Twin-Bank Diesel, 240 hp | 240 | 4.4 | 0.83 | crawler | 5 |
| Redwater Marine Diesel, 310 hp | 310 | 7.6 | 0.87 | gunboat | 4 |
| Forgeworks Gallery Diesel, 460 hp | 460 | 8.2 | 0.75 | crawler | 7 |
| Beacon Gas Turbine, 540 hp | 540 | 3.9 | 0.70 | fighter | 12 |
| Longshadow Nine-Cylinder Radial, 620 hp | 620 | 3.4 | 0.80 | fighter | 6 |
| Reliquary Relic-Cell, 800 hp | 800 | 2.2 | 0.72 | artillery | 1 |

The Relic-Cell is the lore-gated one: recovered material, silent, cold, and unreproducible — its
blurb says so, and no works on the Ground can build a second.

**The curve.** Speed is a step lookup on power-to-weight and never a stat a chassis declares.
`speedFromPowerWeight(hp, tonnage)` divides `hp` by `totalTonnage(vehicle)`, walks `SPEED_CURVE`
ascending, takes the `speed` of the **last** row whose `minRatio <= ratio`, and clamps to `[1, 8]`
hexes per turn. The first row's `minRatio` is `0`, so the lookup always resolves.

| `minRatio` (hp per tonne) | speed |
| --- | --- |
| 0 | 1 |
| 3.5 | 2 |
| 6.5 | 3 |
| 10 | 4 |
| 14 | 5 |
| 20 | 6 |
| 60 | 7 |
| 200 | 8 |

The top two rows are deliberately far apart. Ground machines live between about 2 and 20 hp per
tonne — the whole of speeds 1 to 6 — while an airframe of 2.4 tonnes behind a 620 hp radial sits at
258. One curve serves both only because 60 and 200 are wide enough to put a bomber a step below a
fighter and to leave everything on treads well below either.

`test/motor-mirror.test.js` lifts the following declaration out of this document with `extractConst`
and asserts `speedFromPowerWeight(hp, tonnage) === speed` for every row, so the curve cannot be
changed without this table going red:

```js
const SPEED_CURVE_SAMPLES = [
  { hp: 10,  tonnage: 96,  speed: 1 },   // 0.10 — the hard lower clamp
  { hp: 60,  tonnage: 96,  speed: 1 },   // 0.63 — a land fort on a pit-head plant
  { hp: 35,  tonnage: 10,  speed: 2 },   // 3.50 — exactly on the second row's edge
  { hp: 60,  tonnage: 15,  speed: 2 },   // 4.00
  { hp: 95,  tonnage: 14,  speed: 3 },   // 6.79 — the reference hull, understrength
  { hp: 140, tonnage: 14,  speed: 4 },   // 10.00 — exactly on the fourth row's edge
  { hp: 140, tonnage: 9,   speed: 5 },   // 15.56
  { hp: 240, tonnage: 9,   speed: 6 },   // 26.67
  { hp: 620, tonnage: 9.5, speed: 7 },   // 65.26 — a bomber
  { hp: 200, tonnage: 1,   speed: 8 },   // 200.00 — exactly on the last row's edge
  { hp: 620, tonnage: 2.4, speed: 8 },   // 258.33 — a fighter
  { hp: 800, tonnage: 2.1, speed: 8 },   // 380.95 — the upper clamp
];
```

## 6. Armour packages & facings

Thirteen packages. **Applying one is pure key substitution**: `{ ...hull.baseArmour, ...pkg.facings }`.
There is no addition here, no comparison and no armour value — a package declares the `ArmourClass`
**key** a facing ends at, and `arms.ts` is the only place that knows what that key is worth.

`weight` is tonnes added to the stamped hull weight, which is how a package pays for itself in
speed. `cost` is points. `reliability` is a **delta** on the vehicle's breakdown reliability: plate
strains suspension and drive, and the heaviest suits strain them badly.

| Package | front / side / rear / top | +t | cost | Δrel |
| --- | --- | --- | --- | --- |
| Gun-Shield & Trail Plate | light / — / — / — | 0.4 | 1 | 0 |
| Seat-Back & Sump Plate | — / — / soft / soft | 0.25 | 1 | −0.01 |
| Sandbag & Spare-Track Stowage | light / soft / — / — | 0.6 | 1 | −0.01 |
| Overhead Grillage | — / — / — / light | 0.9 | 1 | −0.01 |
| Bolted Salvage Plate | medium / light / — / — | 1.8 | 2 | −0.04 |
| Spaced Stand-Off Screens | — / medium / medium / — | 2.1 | 3 | −0.03 |
| Rolled Plate Suit | medium / medium / light / — | 3.2 | 4 | −0.05 |
| Cast Glacis & Nose | heavy / — / — / — | 3.6 | 5 | −0.06 |
| Sealed Fume Hull | medium / medium / medium / light | 4.0 | 6 | −0.07 |
| Face-Hardened Belt | heavy / medium / — / — | 5.4 | 7 | −0.09 |
| Breakthrough Carapace | heavy / heavy / medium / medium | 9.5 | 12 | −0.14 |
| Relic-Alloy Skin | heavy / heavy / heavy / medium | 2.8 | 18 | −0.03 |
| Fortress Courses | superheavy / superheavy / heavy / heavy | 26.0 | 24 | −0.20 |

**A package may never lower a facing.** That invariant cannot be asserted in `motorPool.ts`, because
checking it needs armour values; it is asserted in `test/motor-mirror.test.js`, which may import
`ARMOUR_CLASSES`. The rule is enforced at roll time rather than by narrowing the table: a package is
offered to a chassis only when every facing it declares raises or holds that chassis's own. Every
one of the twenty chassis has at least one legal package, and that is asserted too.

**The named case in the brief** — a package heavy enough to push a `line_crawler` front into
`heavy`, at a documented cost — is *Cast Glacis & Nose*: `front: 'heavy'`, **+3.6 t** and **−0.06**
reliability, and nothing for the flanks. On the reference hull that is 14 t → 17.6 t, which on a
140 hp plant takes the power-to-weight from 10.00 to 7.95 and the speed from **4 to 3**. *Face-Hardened
Belt* buys the flanks too, at +5.4 t and −0.09; *Breakthrough Carapace* buys all four, at +9.5 t and
−0.14, which on the same hull and plant is 5.96 hp/t and speed **2**. That is the trade, stated in
tonnes and steps rather than in adjectives.

*Relic-Alloy Skin* is the outlier by design: heavy on three faces for 2.8 t, and eighteen points —
it buys the weight back with the points and the Reliquary Lobby's paperwork, not with a tradeoff in
the hull.

## 7. Suspension & terrain

Nine drives. `terrain` declares a multiplier for **every one of the sixteen `TERRAIN_KEYS`** and for
nothing else — `1` unaffected, `0` impassable, range `[0, 1.5]`. `terrainMultiplier()` throws on an
unknown suspension or terrain key rather than returning `undefined`, because a silent `undefined`
reads downstream as "unaffected" and would quietly make a river passable to a tread.

**The vocabulary is Lane B's, verbatim and in its order**, read out of the merged
`base44/shared/tacticalField.ts` rather than inferred. `TERRAIN_KEYS` is pinned against
`Object.keys(TERRAIN)` lifted from that file, so a divergence is a red test and not an `undefined`
at the point of use. **There is no `street` key — a metalled lane is `road`.**

The four terrains Lane B marks `moveCost: null` — `wall`, `water`, `fuel_tank`, `precursor_wall` —
are `0` for every drive that keeps contact with the ground. A non-zero there is a **claim to cross a
hex Lane B calls impassable**, and only two drives make it: the twin screw, at home in water and
nowhere else, and flight gear, which is over all of it. A plenum skirt floats a river and still will
not climb a wall. The walking legs were drafted crossing a garden wall and were corrected: a
suspension table is not the place to overrule the field generator.

| Drive | open | road | rail | field | rubble | ruins | building | wall | woods | hedgerow | crater | water | marsh | hill | fuel_tank | precursor_wall | +t | rel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line Tread | 1 | 1.1 | 0.9 | 1 | 0.8 | 0.7 | 0.4 | 0 | 0.6 | 0.7 | 0.7 | 0 | 0.5 | 0.8 | 0 | 0 | 2.2 | 0.82 |
| Wide-Girder Tread | 1 | 1 | 0.9 | 1.05 | 0.85 | 0.75 | 0.4 | 0 | 0.7 | 0.75 | 0.8 | 0 | 0.9 | 0.85 | 0 | 0 | 3.1 | 0.80 |
| Half-Track Bogie | 1.05 | 1.25 | 0.95 | 1 | 0.7 | 0.6 | 0.3 | 0 | 0.5 | 0.55 | 0.6 | 0 | 0.55 | 0.7 | 0 | 0 | 1.6 | 0.86 |
| Sprung Road Wheels | 1 | 1.5 | 1 | 0.8 | 0.45 | 0.35 | 0.2 | 0 | 0.3 | 0.35 | 0.4 | 0 | 0.25 | 0.6 | 0 | 0 | 0.9 | 0.92 |
| Ratchet Walking Legs | 0.8 | 0.8 | 0.85 | 0.85 | 1.1 | 1.15 | 0.9 | 0 | 1 | 1 | 1.05 | 0 | 1 | 1.15 | 0 | 0 | 3.6 | 0.62 |
| Twin Screw Drive | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1.3 | 0.8 | 0 | 0 | 0 | 2.8 | 0.88 |
| Relic Plenum Skirt | 1.2 | 1.2 | 1.15 | 1.2 | 0.9 | 0.7 | 0.3 | 0 | 0.5 | 0.8 | 1 | 1.1 | 1.2 | 0.9 | 0 | 0 | 2.4 | 0.55 |
| Undercarriage & Mainplanes | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1.1 | 0.84 |
| Split-Trail Carriage | 0.6 | 0.9 | 0.6 | 0.55 | 0.3 | 0.25 | 0.15 | 0 | 0.2 | 0.25 | 0.3 | 0 | 0.2 | 0.4 | 0 | 0 | 0.6 | 0.95 |

The nine are meant to be **choices, not a ladder**. Road wheels are half again as fast as anything
on a metalled lane and useless off one. Wide girders trade a tenth of road pace for nearly double
the marsh. Walking legs are the only ground drive that is *better* in rubble and ruins than in the
open, and they pay 0.62 reliability for it. The split-trail carriage is slowest at everything and
the most reliable thing on the register, which is exactly what a towed piece is.

`weight` is tonnes of running gear. Like the powerplant's, it is **not** added to the stamped hull
weight (§4); it is read as drive strain by `breakdownChance`.

## 8. Turrets & mounts

Ten mounts. A mount governs three things: how many of the hull's hardpoints it can actually serve,
the arc in degrees through which it can be laid, and the `ArmourClass` the **gun crew themselves**
are behind — which is a different question from what the hull is behind, and the reason an open ring
on a heavy crawler is still an open ring.

| Mount | hardpoints | arc | crewArmour | morale |
| --- | --- | --- | --- | --- |
| Wing Battery | 2 | 20° | light | 0 |
| Fixed Bow Plate | 1 | 30° | medium | +1 |
| Casemate Box | 1 | 45° | heavy | +2 |
| Howitzer Cradle | 1 | 60° | none | −2 |
| Sponson Pair | 2 | 120° | medium | +1 |
| Twin Cradle | 2 | 240° | light | 0 |
| Shielded Ring Mount | 1 | 300° | soft | −1 |
| Open Pintle Ring | 1 | 360° | none | −2 |
| Enclosed Turret | 1 | 360° | medium | +1 |
| Tiered Barbette | 3 | 360° | superheavy | +2 |

The arc/protection trade is the point of the table and it is monotone at both ends: the two mounts
with the narrowest arcs are the two best-protected single-gun positions, and the two with no
protection at all are a full-traverse ring and an open cradle. The exception is deliberate — the
Tiered Barbette is 360° **and** superheavy, because it can only be carried by a hull with the
tonnage for a belt, and only a land fort has ever been given one.

**A mount is legal on a chassis only when `mount.hardpoints <= chassis.hull.hardpoints.length`.**
`rollVehicle` enforces it and the mirror test asserts that every chassis has at least one legal
mount. Six of the twenty hulls declare a single hardpoint, so the four two-gun and three-gun mounts
are genuinely restricted rather than nominally so.

**Crew exposure.** `CREW_EXPOSURE_MORALE` maps a mount's `crewArmour` key to a **morale delta** —
`none −2`, `soft −1`, `light 0`, `medium +1`, `heavy +2`, `superheavy +2`, `fortified +1`. This is
the one place in `motorPool.ts` where an `ArmourClass` key indexes arithmetic, and what it indexes
is a hand-authored morale figure, never an armour value; nothing here is derived from
`ARMOUR_CLASSES` and nothing here may be. `fortified` scores below `superheavy` on purpose: poured
works are thicker and *unsealed*, and a crew that must go on breathing knows it.

## 9. Refit kits (vehicle modifications)

Thirty-four kits across the nine `VehicleSlot`s. A hull carries **one kit per slot**, and only in a
slot its pattern declares — which is what makes `CHASSIS_PATTERNS[k].slots` a constraint rather than
decoration. The Crossloom field carriage declares six slots and the Hundredweight nine, and the
difference shows up as a shorter kit list on every roll.

**Every kit pays, and the audit is mechanical.** `mods` and `tradeoff` are both non-empty, every key
of both is in `VEHICLE_STAT_KEYS`, and **the two key sets are disjoint** — a kit may not both improve
and "cost" the same stat, which is the exact shape a fake tradeoff takes. `test/motor-mirror.test.js`
refuses the whole table if one row breaks any of the three.

**The sign is written as the engine reads it, not as the section implies.** A kit that adds nine
hundred kilogrammes writes `tonnage: 0.9` under `tradeoff`; a kit that cuts fuel draw writes
`fuelUse: -0.3` under `mods`. Read the sign off the arithmetic.

| Slot | Kit | pts | Buys | Costs |
| --- | --- | --- | --- | --- |
| engine | Governor Removed | 1 | hp +25 | reliability −0.08 · heat +2 |
| engine | Forced Induction Pack | 3 | hp +40 | heat +3 · fuelUse +0.2 |
| engine | Radiator Gallery | 2 | heat −4 · reliability +0.03 | tonnage +0.5 · arc −10 |
| engine | Low-Compression Rebuild | 1 | reliability +0.09 | hp −20 |
| engine | Relic-Cell Governor *(III)* | 6 | hp +60 · heat −3 | reliability −0.06 · fuelUse +0.4 |
| armour | Track Skirts | 2 | reliability +0.05 | tonnage +0.9 · arc −20 |
| armour | Spall Liner | 3 | morale +2 | crew −1 |
| armour | Belly Plate | 2 | reliability +0.06 · morale +1 | tonnage +1.1 · speed −1 |
| armour | Mantlet Collar | 2 | morale +1 · accuracy +0.02 | arc −30 · tonnage +0.4 |
| suspension | Reinforced Bogies | 2 | reliability +0.07 | tonnage +1.4 · speed −1 |
| suspension | Wide Grousers | 1 | speed +1 | reliability −0.05 · tonnage +0.6 |
| suspension | Shock Dampers | 2 | accuracy +0.05 | tonnage +0.7 · reliability −0.02 |
| suspension | Dozer Blade | 3 | melee +2 | speed −1 · tonnage +1.5 |
| turret | Power Traverse *(II:Eng)* | 3 | arc +60 · rateOfFire +0.15 | reliability −0.05 · heat +1 |
| turret | Long-Barrel Fitting | 4 | range +2 · ranged +0.5 | arc −40 · tonnage +0.6 |
| turret | Commander's Cupola | 2 | losRange +2 · initiative +1 | tonnage +0.4 · arc −20 |
| turret | Turret Basket | 2 | rateOfFire +0.2 | tonnage +0.7 · crew −1 |
| hardpoint | Smoke Dischargers | 2 | morale +1 · initiative +1 | hardpoints −1 |
| hardpoint | Coaxial Pintle | 2 | ranged +0.6 | heat +1 · reliability −0.03 |
| hardpoint | Ready Racks | 2 | rateOfFire +0.25 | morale −2 |
| hardpoint | Muzzle Brake Collar | 1 | accuracy +0.06 | losRange −1 |
| optics | Range-Drum Sight | 2 | accuracy +0.07 | rateOfFire −0.1 |
| optics | Night Lamp Set *(II:Ciph)* | 2 | losRange +2 | morale −1 · heat +1 |
| optics | Stereo Rangefinder *(II:Ciph)* | 4 | range +2 · accuracy +0.05 | rateOfFire −0.08 · tonnage +0.5 |
| radio | Command Wireless Set *(II:Ciph)* | 4 | initiative +2 | hardpoints −1 |
| radio | Signals Relay | 2 | initiative +1 · losRange +1 | tonnage +0.3 · reliability −0.02 |
| radio | Direction Finder *(II:Ciph)* | 3 | losRange +3 | initiative −1 · tonnage +0.3 |
| stowage | External Fuel Drums | 1 | fuelUse −0.3 | morale −1 · reliability −0.02 |
| stowage | Spare-Link Bins | 1 | reliability +0.05 | tonnage +0.5 · arc −10 |
| stowage | Deck Cargo Rails | 3 | crew +4 | speed −1 · tonnage +1.2 |
| crew_kit | Fireproofed Crew Suits | 2 | morale +2 | rateOfFire −0.08 |
| crew_kit | Medical Locker | 2 | morale +2 | tonnage +0.3 · rateOfFire −0.05 |
| crew_kit | Cut Escape Hatch | 2 | morale +3 | reliability −0.06 |
| crew_kit | Ventilation Fans | 2 | heat −2 · rateOfFire +0.08 | tonnage +0.3 · reliability −0.02 |

Six kits are tier-gated by `ROLL_ODDS.tierOf.mods`, marked above; everything else is tier I, the
boards' default for a fitting anyone can make. `VehicleMod` has no `tier` field — §4 fixes its shape —
so the gate is data rather than a column on the row, and the mirror test asserts every key in that map
exists in `VEHICLE_MODS` and every value is a `TIER_RANK` key.

**Two of the nineteen `VEHICLE_STAT_KEYS` are used by no shipped row, deliberately.** `weight` is the
vocabulary's word for a *component's own* mass — a plant, a drive and an armour package each declare
`weight` as a field — so a kit that makes a hull heavier says `tonnage`, the all-up stamped figure the
speed curve divides into. `pts` is the price of a kit, and every kit already declares `pts` as a field;
a `pts` delta inside `mods` would be a second, silent price on the same row.

## 10. Quirks & conditions

Twenty-four quirks, in the Arms Catalogue's `Quirk` shape verbatim — `{ key, label, mods, condition,
blurb }` — and **every one carries a machine-evaluable condition**. `evaluateVehicleQuirk(quirk, ctx)`
is what makes that claim true rather than decorative: `breakdownChance`, `hardpointStats` and
`deriveMechanized` all call it, so a quirk whose condition does not fire changes nothing, and one that
does changes a number.

**The condition vocabulary is twelve keys, and seven of them are Lane I's own.** `always`, `weather`,
`terrain`, `night`, `vs_house`, `quality_at_least` and `round_at_least` already exist in `arms.ts`'s
`QUIRK_CONDITION_KEYS` and are reused rather than re-spelled — a synonym would hand the platform two
vocabularies to wire where one would do. The other five are the ones a hull has and a rifle does not:
`below_full_pace`, `stationary`, `crew_at_least`, `tonnage_at_least`, `hull_down`.

**Three conditions need no engine context at all.** `quality_at_least`, `crew_at_least` and
`tonnage_at_least` are facts about the instance, so `deriveMechanized` and `breakdownChance` fill them
in from the vehicle before evaluating. Without that, three shipped quirks would be inert until the
platform lane got round to them. The remaining nine need a turn, and the engine supplies it.

**Both directions are asserted.** No quirk may name a condition outside the vocabulary, *and* no key in
the vocabulary may go uncarried by any quirk — the second half is what stops the list becoming a
register of promises.

| Quirk | Condition | Effect |
| --- | --- | --- |
| Light-Footed | always | speed +1 · morale −1 |
| Prize Hull | vs_house `native_house` | morale +1 |
| Forgiving Tolerances | always | reliability +0.05 |
| Cramped Fighting Room | always | rateOfFire −0.1 · morale −1 |
| Hand-Fitted Gearbox | below_full_pace | reliability +0.1 |
| Thirsty | always | fuelUse +0.35 |
| Ponderous | always | speed −1 · melee +1 |
| Open Fighting Compartment | always | morale −1 · initiative +1 · losRange +1 |
| Boiler-Shy | weather `rain` | reliability −0.15 |
| Signals-Fitted | always | initiative +1 · losRange +1 |
| Pieced Together | always | reliability −0.12 · morale +1 |
| Prime-Mover Dependent | always | speed −2 |
| Shallow Draught | terrain `marsh` | speed +1 · reliability +0.04 |
| Consecrated Plate | round_at_least 3 | morale +2 |
| Thin Deck | always | speed +1 · morale −1 |
| High Wing Loading | always | speed +1 · initiative −1 |
| Governor Sealed | always | reliability +0.08 · speed −1 |
| Re-Bored Barrel | quality_at_least `proofed` | ranged +0.4 · accuracy −0.03 |
| Frost-Start | weather `snow` | reliability −0.12 |
| No Night Gear | night | losRange −2 · initiative −1 |
| Settled Bearings | stationary | reliability +0.06 · accuracy +0.03 |
| Deck Gang | crew_at_least 5 | reliability +0.06 · morale +1 |
| Bogs the Soft Going | tonnage_at_least 20 | speed −1 |
| Low Silhouette | hull_down | morale +1 · accuracy +0.04 |

**Sixteen are innate and eight are rollable, and the two sets are disjoint at the roll.** The innate
ones are named by a chassis pattern and born with the hull; `ROLL_ODDS.rollableQuirks` lists the eight
a roll may add to *any* hull. A generic pool over the whole table would put Shallow Draught on a
fighter and Prime-Mover Dependent on a gunboat inside its first thousand seeds.

The brief's three worked examples are all present and all numeric: *Hand-Fitted Gearbox*
(reliability +0.1 while not at full pace), *Prize Hull* (morale +1 against the house whose yard cut the
plate), *Boiler-Shy* (reliability −0.15 in rain).

## 11. Rolling a vehicle

`rollVehicle({ seed, class, maker, tierCap = 'III', luck = 0 })` returns a `VehicleInstance` and is
**pure**. `Math.random`, `Date.now`, `crypto` and module-level mutable state appear nowhere in this
lane; two calls with the same arguments are deep-equal in any order, and interleaving two rolls cannot
make either differ. `class` is a reserved word and is destructured as `class: vehicleClass`.

The generator is `motorMulberry32`, copied verbatim from `base44/functions/gameEngine/entry.ts:711`
rather than imported — a shared module cannot import a Deno function module, and `arms.ts` carries the
same body for the same reason. A non-finite `seed` **throws**: `mulberry32` coerces with `a |= 0`, so
an undefined seed would silently *become* seed 0 and every caller that failed to derive one would get
the same machine.

**The roll order is the contract.** Changing it changes every machine the server has ever issued,
retroactively, because a serial is reproduced from its seed rather than stored.

1. **quality** — weighted over the Arms Catalogue's five `rollWeight`s, adjusted by luck
2. **chassis** — uniform over the filtered pool, sorted by key ascending
3. **powerplant** — weighted by how near its power-to-weight sits to the class target
4. **suspension** — uniform over the class's drive pool
5. **mount** — uniform over the class's mount pool, filtered to `mount.hardpoints <= hull.hardpoints.length`
6. **armour package** — one draw against the class chance, then uniform over the hull's own pool; may be none
7. **hardpoint weapons** — in hull order, one `rollWeapon` per position, each on its own sub-seed
8. **refit kits** — a count from the quality band, then picks, one kit per slot
9. **quirks** — the pattern's innate ones first, then rolled from `rollableQuirks`
10. **serial** — off the same stream

Every pool is **sorted by key** before it is drawn from, which is what makes the draw independent of
object insertion order: a row appended by a later lane cannot silently renumber the whole history.

**Quality and luck.** `w = rollWeight × (1 + luck × luckSlope[grade])`, clamped at zero, then
normalised. At `luck === 0` the distribution is *exactly* the normalised `rollWeight`s, which is what
the ten-thousand-roll test asserts to within two percentage points. `luck` is clamped to `[-1, 1]`, and
a non-finite luck is treated as zero — `clampTo(NaN)` is `NaN`, which would make every weight `NaN`,
never satisfy `ticket < 0`, and drop the loop through to its initialiser: the rarest grade, on every
seed. Lane I found that; the same guard is here and the same test drives it.

**The tier cap.** A cap admits every tier strictly below it plus its own exact tier, which is
`arms.ts`'s rule verbatim: `II:Eng` opens engineering patterns and not cipher ones. It bounds the
chassis, the plant, the package, the drive, the refit kits and every hardpoint weapon. A filter that
empties the chassis pool **throws a descriptive error** and never falls back silently — `class:
'fighter'` at `tierCap: 'I'` throws, because the register holds no tier-I airframe.

**The plant bias, and why it exists.** An unbiased draw over the class pool gives a ninety-six-tonne
land fort its weakest legal plant as often as its best one. `ROLL_ODDS.plantTarget` records the
power-to-weight each class is drawn around and `ROLL_ODDS.plantBias` weights each candidate by
`|ratio / target − 1|` on a step table, falling to `ROLL_ODDS.plantBiasFloor` past the last row. A
lemon stays possible and stops being equiprobable.

**The step table carries no catch-all row, deliberately.** A sentinel at some absurd deviation would
have made the floor unreachable — dead code with a plausible-sounding justification, which is exactly
the defect this wave was told not to repeat — and the floor is genuinely reached: an 800 hp relic cell
in a twenty-two-tonne gunboat deviates by three and a half, and `test/motor-roll.test.js` drives it.

**Hardpoint sub-seeds.** For hardpoint index `i`, `hpSeed = (seed ^ Math.imul(0x9e3779b9, i + 1)) | 0`,
and the weapon class is drawn from that hardpoint's own `allowed` list — filtered to classes that
actually have a pattern at the cap. **A position with nothing it can carry goes to the field empty**
rather than making the hull unrollable, and that branch is real rather than defensive: at
`tierCap: 'II:Wake'` no `crawler_gun` pattern qualifies, so the Reliquary Monitor's casemate has
nothing to put in it while the hull itself is perfectly legal. `test/motor-roll.test.js` drives exactly
that case.

**Armour packages at the roll.** `ROLL_ODDS.packagePool` is keyed by *chassis*, not by class, and is a
**cache of a derivation**: the packages whose every declared facing raises or holds that hull's,
intersected with those weighing at most `MOTOR_MODEL.packageWeightCap` (30 %) of its stamped tonnage.
The mirror test recomputes both halves from `ARMOUR_CLASSES` and `CHASSIS_PATTERNS` and asserts exact
equality, so it cannot drift into a judgement. It has to be a cache: the raises-or-holds half needs
armour *values*, and drift guard 12 puts those in `arms.ts` and nowhere else.

**Serial format:** `MW-<maker stem>-<4 uppercase hex>`, e.g. `MW-HUND-3A9F`. The stem is the first four
letters of the maker's first `nameStem`; the hex is four characters off the same stream. Asserted by
regex `/^MW-[A-Z]{2,4}-[0-9A-F]{4}$/` and by reproducing two hundred serials from their seeds.

## 12. `deriveMechanized` — the roll-up formulas

`deriveMechanized(stand, ctx)` takes `{ vehicle: VehicleInstance, … }` and returns **exactly**

```
{ figures, melee, ranged, range, speed, morale, pts, specials, facings }
```

and no other key. The set is a subset of §4's `SquadType` value keys ∪ `{facings}`, and the test reads
that allowance off `arms.ts`'s `SQUAD_VALUE_KEYS` rather than retyping it, so a §4 change to the
`SquadType` shape moves the gate instead of falsifying it.

**It does not return `armor`.** A numeric armour rating would mean reading an armour class's value,
which is drift guard 12's exact prohibition. The engine derives armour from `facings` through
`arms.ts`. The two numbers that do not fit the contracted key set are exposed as separate exported
functions — `breakdownChance(vehicle, ctx)` and `hardpointStats(vehicle, ctx).armorPenMax` — rather
than smuggled into the return object.

| Key | Formula |
| --- | --- |
| `figures` | always `1` — vehicles are single-figure squads (§4) |
| `melee` | `MELEE_CURVE` on `totalTonnage`, plus kit and quirk `melee` deltas, clamped `[1, 8]` |
| `ranged` | `Σ damage × rateOfFire × accuracy` over the resolved hardpoints, plus `ranged` deltas |
| `range` | `max(range)` over the resolved hardpoints, plus `range` deltas |
| `speed` | `speedFromPowerWeight(plant.hp + hp deltas, totalTonnage)` plus `speed` deltas, clamped `[1, 8]` |
| `morale` | `CREW_MORALE_CURVE` on crew, plus `CREW_EXPOSURE_MORALE[mount.crewArmour]`, plus `morale` deltas, clamped `[1, 10]` |
| `pts` | `(chassis.pts + plant pts + package.cost + Σ kit.pts + Σ gun pts) × quality ptsMult` |
| `specials` | the six `MOTOR_MODEL.specials` sources, deduplicated, in `MECHANIZED_SPECIALS` order |
| `facings` | `{ ...hull.baseArmour, ...(package?.facings ?? {}) }` — key substitution, nothing else |

**`totalTonnage` is hull + package + kit `tonnage` deltas.** The plant's and the drive's own `weight`
are deliberately *not* added: a hull's stamped tonnage is its all-up combat weight, running gear and
the works' nominal plant included. Those two weights are spent in `breakdownChance` instead, as drive
strain — which is the only reason they are not dead fields on twenty-one rows, and
`test/motor-roll.test.js` drives that path with a plant heavy enough to exceed its class allowance.

**`hardpointStats` is weapon arithmetic only.** Each instance goes through Lane I's `resolveWeapon` —
pattern base, maker signature, quality, weapon mods, live weapon quirks, clamp — and this lane adds
only the *vehicle's* own `accuracy` and `rateOfFire` deltas on top, because a stabilised mounting and a
range drum change what the gun on it does. `armorPen` is passed through untouched; `armorPenMax` is a
maximum over the hull's own guns and is never compared to anything else. `hardpointWeapons(vehicle)`
hands the instances back verbatim so Lane C can call `resolveHit` itself.

**Crew is the hull's own plus kit `crew` deltas**, so a spall liner that costs a position costs the
morale that position carried, and deck cargo rails that bring a section raise it. No quirk carries a
`crew` or `tonnage` key — asserted by the mirror test — which is what keeps the quirk context out of a
cycle with the deltas it feeds.

**Every kit's `morale` delta is honoured, not only `crew_kit`'s.** A spall liner is an armour-slot
fitting whose entire effect is morale and ready racks are a hardpoint fitting that costs it; reading
only the `crew_kit` slot would leave five shipped rows with a number nothing reads.

**Specials come off the declared quirks, not the live ones.** A token is a capability of the machine,
not a conditional effect on a turn: an open fighting compartment is open in fine weather too.

**Quirk context.** `ctx` is optional. With none, `always` fires and so do the three instance-fact
conditions; with a turn's context the other nine become live. The returned key set never changes.

**Breakdown.** `clamp(0.5 × (1 − reliability), 0, 0.5)`, where reliability is
`plant.reliability × drive.reliability` (two independent things that both have to keep working), plus
the package delta, plus live quirk and kit `reliability` deltas, minus `0.008 × heat`, minus
`0.03 × (plant.weight + drive.weight − class allowance)` when the running gear is over its allowance.
It is strictly non-increasing as reliability rises, and the test proves that by walking a hull's whole
package pool from the cleanest to the dirtiest — a package is the one fitting that changes reliability
*without* changing strain.

**What this lane spends, and what it hands over.** Seventeen of the nineteen stat keys are carried by
at least one row; these are the ones a function here actually reads:

| Spent by the Motor Pool | Where |
| --- | --- |
| `hp`, `speed` | `deriveMechanized().speed` |
| `tonnage` | `totalTonnage`, and through it melee and speed |
| `crew`, `morale` | `deriveMechanized().morale` |
| `melee` | `deriveMechanized().melee` |
| `accuracy`, `rateOfFire`, `ranged`, `range` | `hardpointStats` |
| `reliability`, `heat` | `breakdownChance` |

| Declarative — carried, mirrored, tested, read by the platform | Why |
| --- | --- |
| `arc` | the engine owns firing arcs; this lane only prices the trade |
| `losRange` | spotting is Lane C's, not the Motor Pool's |
| `initiative` | order sequencing is Lane A/C's |
| `hardpoints` | a kit that costs a position is a builder-time constraint, not a roll-up number |
| `fuelUse` | supply is the macro layer's question |

Lane I made the same split for its quirks' morale keys, and stating it plainly is the difference
between a handoff and dead data.

## 13. Points Audit

Every chassis is priced against **`Hundredweight 141 Line Crawler` = 12 pts**, which is pinned by §3
and agrees with the live macro table (`src/lib/units.js` `crawler.points === 12`).

**The value model, in full.** A hull's combat value is its exposure-weighted protection plus what
its hardpoints can carry:

```
value = 0.45·av(front) + 0.30·av(side) + 0.10·av(rear) + 0.15·av(top)
      + 0.70 · Σ over hardpoints of  max over allowed classes of  meanPts(class)
```

where `av(k)` is `ARMOUR_CLASSES[k].armourValue` and `meanPts(class)` is the mean `pts` of every
`WEAPON_PATTERNS` row of that class. **Both are read out of `arms.ts` by the test, never copied into
this document and never computed in `motorPool.ts`** — the armour values are the prohibited
arithmetic, so the audit lives on the test side of the line where importing them is legal.

The facing weights are frontage: a stand under fire is hit from the front far more often than from
behind, and from above only by indirect fire. They sum to 1. The 0.70 on carriage is the discount
for a gun that must be crewed, fed and pointed by the hull it is on rather than by a squad that
chose it.

At the time of writing, `meanPts` is `crawler_gun 6.675 · hmg 3.7 · flame 2.0333 · mortar 2.7167 ·
artillery 12.125 · aircraft_gun 9.75`. Those figures are **derived, not authored** — the test
recomputes them from `WEAPON_PATTERNS` on every run, so a Lane I change moves the audit rather than
falsifying it.

The reference hull gives `value = 11.3125` against `pts = 12`, so
`refEff = 11.3125 / 12 = 0.9427`, and every row's efficiency is
`ratio = (value / pts) ÷ refEff`. The reference row is `1` by construction. **No row may exceed
1.6**; the widest spread below is `0.8996 … 1.0869`, a band of about ±9 %.

```js
const POINTS_AUDIT = [
  { key: 'outrider_129_whippet_mk2', pts: 5, value: 4.49, ratio: 0.9526 },
  { key: 'knife_136_ferret_mk3', pts: 7, value: 7.1725, ratio: 1.0869 },
  { key: 'hundredweight_141_line_crawler', pts: 12, value: 11.3125, ratio: 1 },
  { key: 'verdict_144_levy_crawler', pts: 11, value: 11.1125, ratio: 1.0716 },
  { key: 'tollgate_147_knotwork_crawler_mk2', pts: 16, value: 14.8025, ratio: 0.9814 },
  { key: 'grimwold_138_breaker_mk3', pts: 18, value: 16.9025, ratio: 0.9961 },
  { key: 'forgeworks_152_cinderhead', pts: 22, value: 19.8258, ratio: 0.9559 },
  { key: 'grimwold_156_lockjaw_mk1', pts: 44, value: 37.3142, ratio: 0.8996 },
  { key: 'drover_134_provender_carrier', pts: 5, value: 4.34, ratio: 0.9208 },
  { key: 'seamfire_143_burnwagon', pts: 7, value: 6.3633, ratio: 0.9643 },
  { key: 'dustpromise_131_courier_mk2', pts: 5, value: 4.49, ratio: 0.9526 },
  { key: 'copperline_139_beacon_car', pts: 6, value: 5.09, ratio: 0.8999 },
  { key: 'sledge_145_pit_gun', pts: 16, value: 14.9775, ratio: 0.993 },
  { key: 'harrow_149_slaghound_mk2', pts: 13, value: 12.7625, ratio: 1.0414 },
  { key: 'crossloom_128_field_carriage', pts: 9, value: 8.9375, ratio: 1.0534 },
  { key: 'punt_137_shoalcutter', pts: 10, value: 9.6125, ratio: 1.0197 },
  { key: 'reliquary_124_monitor_mk2', pts: 26, value: 23.59, ratio: 0.9624 },
  { key: 'kestrel_150_lofter_mk2', pts: 16, value: 15.45, ratio: 1.0243 },
  { key: 'adjudicated_142_writhawk', pts: 10, value: 10.165, ratio: 1.0783 },
  { key: 'longshadow_154_span_mk1', pts: 24, value: 22.3925, ratio: 0.9897 },
];
```

**Anti-armour value is priced separately from anti-personnel value, in prose, on purpose.** The
model above is a single scalar, and a single scalar cannot say that a Slaghound's casemate gun is
formidable against a hull and mediocre against a section in a hedgerow. Lane I already publishes the
split — `apValue(pattern)` and `aaValue(pattern)` — and the class means diverge sharply: an `hmg`
means `AP 7.11 / AA 0.00`, an `artillery` piece `AP 12.95 / AA 3.78`, a `crawler_gun`
`AP 5.36 / AA 3.12`, and `flame` and `mortar` both `AA 0.00`. Read the audit accordingly: a hull
whose only hardpoint takes a `crawler_gun` is bought for what it does to other hulls, and a heavy
anti-armour chassis is **not** free against infantry — it is simply not being priced for that job
here, and the engine will resolve the difference through the damage model rather than through a
points column.

**Where the model is knowingly blind, and the price says so.** Four rows are priced against
something the scalar cannot see, and each is a deliberate deviation rather than a rounding artefact:

- **Drover 134 Provender Carrier** (0.9208) — the model prices one ring gun and ignores the section
  in the bed, which is the entire reason the pattern exists. It is priced up.
- **Copperline 139 Beacon Car** (0.8999) — two thirds of the fighting compartment is a transmitter.
  The Ascendancy regards that as the armament; the value model does not know how to.
- **Grimwold 156 Lockjaw** (0.8996) — a land fort is a scenario centrepiece. It is taxed on purpose,
  so that fielding one is a decision rather than an efficiency.
- **Knife 136 Ferret** (1.0869), the highest row — a turret gun on six and a half tonnes of
  someone else's hull. The model cannot price how easily it dies, so the Court sells it cheap and
  the ratio records that honestly rather than being flattened to 1.

Nothing in the audit is hand-copied: `test/motor-mirror.test.js` lifts the block above with
`extractConst`, recomputes `value` and `ratio` from `CHASSIS_PATTERNS`, `ARMOUR_CLASSES` and
`WEAPON_PATTERNS`, and asserts one row per chassis, `pts` equal to the table's, the reference row at
12 pts and `ratio: 1`, and `ratio <= 1.6` throughout.

## 14. `[PROPOSED — awaiting platform wiring]`

The draft rules section, reproduced **verbatim** as it was appended to `docs/GAME_RULES.md` — where it
is numbered **§25**, one greater than the highest heading in that file at the time of writing (§23 is
Lane I's, §24 is Lane G's). `test/motor-mirror.test.js` compares the two copies as text, each bounded
at its own heading and at the next `## ` heading, so a later lane appending after either copy cannot
drag its own section into the comparison.

## 25. The Motor Pool [PROPOSED — awaiting platform wiring]

*Drafted by the Motor Pool lane. Data: `base44/shared/motorPool.ts` (mirror `src/lib/motorPool.js`).
Design record: `docs/MOTOR_POOL.md`. Nothing in this section is enforced by the engine yet.*

**A crawler is not a unit type — it is a chassis class.** A mechanized stand is a named **chassis
pattern** from a named motor-works, fitted with a **powerplant**, an optional **armour package**, a
**suspension**, a **mount**, **hardpoint weapons** drawn from the Arms Catalogue (§23), **refit kits**
and **quirks**. The engine never reads that assembly directly: it reads what `deriveMechanized(stand)`
returns, which is `{ figures, melee, ranged, range, speed, morale, pts, specials, facings }` and
nothing else.

**The eleven classes.** `scout_crawler`, `line_crawler`, `heavy_crawler`, `land_fort`, `half_track`,
`armoured_car`, `sp_gun`, `tractor_gun`, `gunboat`, `fighter`, `bomber`. Three of them describe units
the rules already field — `tractor_gun` is Siege Artillery, `gunboat` is the Ironclad Gunboat,
`fighter` is the Prop Fighter — and the crawler is divided by tonnage and role rather than by fuel.

**Figures.** A vehicle is a **single-figure squad**. `deriveMechanized` always returns `figures: 1`.

**The four facings.** Every chassis declares an armour class for `front`, `side`, `rear` and `top`.
There is no default facing and no armour *number* anywhere in the Motor Pool: a facing is a key out of
the Arms Catalogue's `ARMOUR_CLASSES`, and §23's Universal Damage Model is the only place a key becomes
a value. A hit resolves against the **struck** facing — rear when the attacker occupies a hex behind
the stand's facing, top for indirect fire — and the resolution is §23's, unchanged.

**Armour packages are key substitution, never addition.** A package declares the class a facing *ends
at*, and fitting one is `{ ...baseArmour, ...package.facings }`. A package may never lower a facing,
and a hull is only ever offered a package whose weight is at most **30 %** of its stamped tonnage —
which is why a two-tonne airframe cannot wear a fortress course.

**The refit vocabulary.** Nine slots: `engine`, `armour`, `suspension`, `turret`, `hardpoint`,
`optics`, `radio`, `stowage`, `crew_kit`. A hull carries **one kit per slot**, and only in a slot it
declares. **Every kit has a numeric cost as well as a numeric benefit** — extra plate slows, the
long-barrel gun cuts turret traverse, smoke dischargers cost a hardpoint, a spall liner costs a crew
position — and the two are recorded in different fields with no key in common. A pure-upside kit is a
defect, not a bargain.

**Speed is `hp ÷ tonnage`, and nothing else.** No chassis declares a speed. Power over all-up weight is
looked up on a step curve and clamped to **1–8** hexes per turn, so fitting a bigger plant is the only
way to go faster and bolting on plate is the only way to slow down. Terrain is applied separately, per
hex, from the suspension's own modifier for that terrain — `0` means impassable, `1` unaffected — and
never folded into the stand's speed.

**Breakdowns.** Each mechanized stand carries a breakdown chance in **[0, 0.5]**, composed from the
plant's and the drive's reliability, the armour package, live quirks, the plant's cooling burden, and
**drive strain** — a plant and running gear heavier than the share of the hull's tonnage its class
allots to them. It never rises as reliability rises. The platform decides when the roll is made.

**Quirks are machine-evaluable.** Every quirk carries a condition — `always`, a weather, a terrain, a
night, an enemy house, a grade, a round number, being below full pace, being stationary, a crew size, a
tonnage, or being hull down — and a numeric effect. A quirk whose effect exists only in prose is a
defect. Three of those conditions are read off the machine itself and need no turn context at all.

**The roll is pure and seeded.** `rollVehicle({ seed, class, maker, tierCap, luck })` returns the same
machine for the same arguments, for ever, in any order. Quality is drawn from §23's five grades on
§23's weights. A serial is reproduced from the seed rather than stored.

**The points anchor is the `Hundredweight 141 Line Crawler` at 12 points**, which is the cost the macro
rules already put on a Diesel Crawler. Every other chassis is priced against it, and the audit in
`docs/MOTOR_POOL.md` §13 recomputes each figure from the catalogue rather than quoting it. A stand's
final cost is chassis + powerplant + package + kits + carried guns, the whole multiplied by the hull's
quality grade.

> **Open for the platform lane.** The chassis anchor is the **macro** 12-point scale
> (`src/lib/units.js` `crawler.points === 12`), while a tactical `SquadType` prices a whole squad
> (`riflemen.pts === 100`). Reconciling the two scales is one documented multiplier and it is not this
> section's to choose.

## 15. Codex entries (Lane H handoff)

Sixteen entries — one per motor-works appended to `MANUFACTURERS` (5) and one per `VehicleClass` (11)
— **shipped** into `src/lib/wiki/entries.js` as one banner-commented block at the very end of the
`ENTRIES` array. Lane H owns that file and merges after this lane, which is exactly why the append is
append-only and at the tail: a concurrent content lane collides mechanically and is resolved by keeping
both blocks, in lane order.

`test/motor-mirror.test.js` asserts that every `id` is unique across the whole array and every `see`
target resolves, over the *entire* corpus rather than over this block — the Archive is link-clean today
and an append must not be what breaks it. It also compares the block below against the shipped bytes,
bounding the slice at the next lane banner **or** the array terminator, whichever comes first.

**Thirteen of the sixteen are `status: 'thin'`, on purpose.** `docs/LORE.md` names none of these five
motor-works and does not divide the crawler by tonnage, so marking those entries "Ministry-Sealed"
would be the Archive starting to lie. The three marked `canon` describe units the live rules already
field: the tractor-drawn gun (Siege Artillery), the gunboat (Ironclad Gunboat) and the fighter (Prop
Fighter).

The rows exactly as they shipped:

```js
  // ——— LANE J: motor works & chassis classes ———
  // Sixteen entries appended by Lane J (the Motor Pool): one per motor-works
  // appended to MANUFACTURERS, and one per VehicleClass. A single contiguous
  // tail block, so a concurrent content lane collides mechanically and is
  // resolved by keeping both blocks in lane order. No existing entry is
  // touched. Reproduced verbatim in docs/MOTOR_POOL.md §15.
  {
    id: "maker-mw-grimwold-treadworks",
    title: "The Grimwold Treadworks",
    folk: "the shaft-head shop",
    category: "powers",
    tag: "Motor Pool §3",
    status: "thin",
    summary: "The Covenant's hull builder — plate sloped past the point of politeness, and an order book that is a statement of belief.",
    blocks: [
      { lead: "Grimwold drawings begin with the weight a hull must carry onto a shaft head, and end with how long it must sit there while sappers work underneath." },
      { p: "Everything between those two lines is subordinate. Treadworks plate is thick and slow; its running gear is drawn for a hull that has stopped moving on purpose. The works licenses grudgingly and to nobody it suspects of digging, which is the only reason a machine as useful as the Breaker is not on every front on the Ground." },
      { p: "Two of the catalogue's hulls carry the mark: the 138 Breaker, which is what a heavy crawler is judged against, and the 156 Lockjaw, the only land fort the ordnance boards have ever priced." },
      { note: "The works and its lore are authored by the Motor Pool lane; docs/LORE.md does not yet name it. Marked thin until the lore bible is extended." },
    ],
    see: ["vehicle-class-heavy-crawler", "vehicle-class-land-fort", "great-houses", "works"],
  },
  {
    id: "maker-mw-chandlery-carriageworks",
    title: "The Chandlery Carriageworks",
    folk: "the wagon shop",
    category: "powers",
    tag: "Motor Pool §3",
    status: "thin",
    summary: "A refit town's wagon shop, grown into the works that carries everybody else's war — and arms almost nothing it builds.",
    blocks: [
      { lead: "A wagon that fights is a wagon not delivering, and the Carriageworks has put that sentence on the first page of its catalogue for three generations." },
      { p: "It builds prime movers, carriers and gun tractors, light and plain and serviceable by a crew who have read nothing. It sells to anyone whose credit it can verify, and its delivery ledgers are the closest thing the Ground has to a census." },
      { p: "The 134 Provender Carrier is its only entry in the fighting register, and it is a bed with benches and one ring gun forward." },
      { note: "The works and its lore are authored by the Motor Pool lane; docs/LORE.md does not yet name it. Marked thin until the lore bible is extended." },
    ],
    see: ["vehicle-class-half-track", "order-of-battle", "works"],
  },
  {
    id: "maker-mw-kettleharrow-boneyard",
    title: "The Kettleharrow Boneyard",
    folk: "the bone shop",
    category: "powers",
    tag: "Motor Pool §3",
    status: "thin",
    summary: "Scavengers on the lip of a dead city, building fighting hulls out of what the city gives up — and honest about which face got the plate.",
    blocks: [
      { lead: "A Boneyard machine is four dead machines with the good parts kept." },
      { p: "Nothing it sells is warranted; everything it sells is cheap. Its foremen are quietly the best diagnosticians on the Ground, because they have taken more hulls apart than anyone alive, and its plants are pieced together from three wrecked engines and run accordingly." },
      { p: "The 149 Slaghound is the pattern the yard is known by: a casemate gun behind mismatched frontal plate, priced for a house that would rather lose a machine than a season." },
      { note: "The works and its lore are authored by the Motor Pool lane; docs/LORE.md does not yet name it. Marked thin until the lore bible is extended." },
    ],
    see: ["vehicle-class-sp-gun", "maker-salvage-court-prize-yard", "works"],
  },
  {
    id: "maker-mw-longshadow-aeroworks",
    title: "The Longshadow Aeroworks",
    folk: "the thin shop",
    category: "powers",
    tag: "Motor Pool §3",
    status: "thin",
    summary: "The Combine's airframe house — mainplanes cut thin, structure calculated to the margin, and a warranty that expires on delivery.",
    blocks: [
      { lead: "The Combine bought an airframe drawing, then the shop that drew it, then the crews to fly what came out." },
      { p: "Longshadow works to weight above everything. Protection is argued about and usually declined. Its machines climb better than anything else on the register and are returned to the works in pieces at a rate the house prefers not to publish." },
      { p: "The 150 Lofter carries the guns; the 154 Span carries the bay. Both are drawn to the same stress margin and both say so in the fine print." },
      { note: "The works and its lore are authored by the Motor Pool lane; docs/LORE.md does not yet name it. Marked thin until the lore bible is extended." },
    ],
    see: ["vehicle-class-fighter", "vehicle-class-bomber", "great-houses", "works"],
  },
  {
    id: "maker-mw-redwater-hullyards",
    title: "The Redwater Hullyards",
    folk: "the wet yard",
    category: "powers",
    tag: "Motor Pool §3",
    status: "thin",
    summary: "Diggers who worked out that a gun on a shallow hull reaches ground no column can — building by eye, in a camp that moves with the site.",
    blocks: [
      { lead: "Redwater boats draw less water than a laden barge, and the yard considers that the whole of its argument." },
      { p: "They are heavy, wet, slow to answer the helm and very difficult to sink. The yard takes payment in fragments, tows salvage home on the same tide, and books both." },
      { p: "The 137 Shoalcutter is its pattern of record: a forward turret, an aft ring, and a flat bottom that rides high over drowned workings." },
      { note: "The works and its lore are authored by the Motor Pool lane; docs/LORE.md does not yet name it. Marked thin until the lore bible is extended." },
    ],
    see: ["vehicle-class-gunboat", "works"],
  },

  {
    id: "vehicle-class-scout-crawler",
    title: "The Scout Crawler",
    folk: "the runner",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "A courier hull with a gun ring welded on. Bought for its pace, priced as a cart, and told to run first.",
    blocks: [
      { lead: "The ordnance boards separate crawlers by tonnage and role, never by fuel, and the lightest division is the one that is not expected to fight." },
      { p: "A scout crawler carries two, is plated against small arms at the front and against weather everywhere else, and takes one gun position. Its value is what its commander learns, and the boards accept a low price on the understanding that the machine will be replaced." },
      { note: "Sub-dividing the live Diesel Crawler into scout, line, heavy and land-fort classes is this lane's proposal, not a rule the engine yet enforces. GAME_RULES §25 is the draft." },
    ],
    see: ["vehicle-class-line-crawler", "vehicle-class-armoured-car", "order-of-battle"],
  },
  {
    id: "vehicle-class-line-crawler",
    title: "The Line Crawler",
    folk: "the twelve-pointer",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "The hull every board prices the others against — a turret, a hull gun, and nothing about it that is admired.",
    blocks: [
      { lead: "Twelve points, four crew, medium plate at the front and light on the flank. The Hundredweight 141 is the reference, and the reference is deliberately dull." },
      { p: "A line crawler is the machine a regiment can keep running: coarse threads, generous hatches, a turret ring a seam fitter can true with a hammer. Every other hull in the register is efficient or inefficient relative to it, and the Points Audit says so in a column." },
      { note: "The live macro table already prices a Diesel Crawler at 12 points. The Motor Pool anchors on that figure rather than proposing a new one." },
    ],
    see: ["vehicle-class-scout-crawler", "vehicle-class-heavy-crawler", "maker-hundredweight-works", "order-of-battle"],
  },
  {
    id: "vehicle-class-heavy-crawler",
    title: "The Heavy Crawler",
    folk: "the breaker",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "Twenty-eight tonnes and upward, drawn to go through a position rather than around it, and to be repaired where it stops.",
    blocks: [
      { lead: "A heavy crawler is bought to make an entrance in a line and to still be standing in the gap afterwards." },
      { p: "Heavy plate on three faces, a main gun and two or three secondary positions, and a plant that drinks at a rate the supply column plans its whole day around. The class is where armour packages start to matter more than pace, and where a thrown track becomes a recovery operation rather than an hour's work." },
      { note: "Sub-dividing the live Diesel Crawler by tonnage is this lane's proposal. GAME_RULES §25 is the draft." },
    ],
    see: ["vehicle-class-line-crawler", "vehicle-class-land-fort", "maker-mw-grimwold-treadworks"],
  },
  {
    id: "vehicle-class-land-fort",
    title: "The Land Fort",
    folk: "the sitting works",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "A belt with a hull inside it. One pattern exists, it is taxed on purpose, and fielding it is a decision rather than an efficiency.",
    blocks: [
      { lead: "Ninety-six tonnes, fourteen crew, six fighting positions and a tiered barbette that only a hull with the tonnage for a belt could carry." },
      { p: "The boards price a land fort above what its guns and plate are worth, deliberately. It is a scenario centrepiece: slow, thirsty, ponderous, and the only thing on the register that makes its own ground and then sits in it." },
      { note: "No land fort exists in the live rules. The class is proposed in GAME_RULES §25 and priced in docs/MOTOR_POOL.md §13 at a rate that is knowingly unfavourable." },
    ],
    see: ["vehicle-class-heavy-crawler", "maker-mw-grimwold-treadworks", "order-of-battle"],
  },
  {
    id: "vehicle-class-half-track",
    title: "The Half-Track",
    folk: "the bed",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "Wheels in front, short tracks behind, and a section riding in the open where the stowage would be.",
    blocks: [
      { lead: "The half-track is the class that arrives with its own infantry and arrives later than it would have." },
      { p: "It is plated at the front, open at the top, and carries one or two light positions. Its whole argument is that a section which rides is a section which is still fresh, and its whole cost is that everybody aboard is visible from above." },
      { note: "Carriers do not appear in the live unit table. GAME_RULES §25 is the draft." },
    ],
    see: ["vehicle-class-armoured-car", "maker-mw-chandlery-carriageworks", "order-of-battle"],
  },
  {
    id: "vehicle-class-armoured-car",
    title: "The Armoured Car",
    folk: "the road machine",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "Fast on a made road, useless off one, and the only wheeled thing the boards will let carry a turret.",
    blocks: [
      { lead: "An armoured car is a road vehicle that has been given plate and told to look at things." },
      { p: "Thin protection, a small turret or a ring, and a drive that treats a metalled lane as an advantage and a marsh as a wall. The class also carries the signals hulls, where two thirds of the fighting compartment is a transmitter and the Ascendancy regards that as the armament." },
      { note: "Wheeled reconnaissance does not appear in the live unit table. GAME_RULES §25 is the draft." },
    ],
    see: ["vehicle-class-scout-crawler", "maker-ascendancy-signal-works", "maker-outrider-wheelwrights"],
  },
  {
    id: "vehicle-class-sp-gun",
    title: "The Self-Propelled Gun",
    folk: "the casemate",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "A gun that brought its own carriage — a heavier piece than any turret ring on the hull could have taken.",
    blocks: [
      { lead: "Take the turret off and build a box around the breech instead, and the hull will carry a gun a size larger than it had any right to." },
      { p: "The trade is arc: the machine is aimed by aiming the hull, and its flanks and roof are usually the thinnest on the register. Many are open-topped, which is the reason a mortar landing anywhere near one is a casualty return rather than a repair." },
      { note: "Self-propelled artillery is not separated from towed artillery in the live rules. GAME_RULES §25 is the draft." },
    ],
    see: ["vehicle-class-tractor-gun", "maker-mw-kettleharrow-boneyard", "maker-hundredweight-works"],
  },
  {
    id: "vehicle-class-tractor-gun",
    title: "The Tractor-Drawn Gun",
    folk: "the trail",
    category: "war",
    tag: "Motor Pool §4",
    status: "canon",
    summary: "Siege artillery as the Ministry already fields it: a split-trail carriage, six hands, and somebody else's engine.",
    blocks: [
      { lead: "It has no drive of its own and never pretended to. Where it goes, and how fast, is a question about the tractor in front of it." },
      { p: "The carriage is spaded into the ground and the crew stand around it in the open. Given a shield and a trail plate it costs almost nothing and stops what a crew served in the open would otherwise catch; given nothing, it is six people and a heavy piece on bare ground." },
      { note: "This is the live Siege Artillery unit, described in Motor Pool terms rather than replaced by it." },
    ],
    see: ["vehicle-class-sp-gun", "maker-crossloom-pattern-house", "order-of-battle"],
  },
  {
    id: "vehicle-class-gunboat",
    title: "The Gunboat",
    folk: "the wet gun",
    category: "war",
    tag: "Motor Pool §4",
    status: "canon",
    summary: "The Ironclad Gunboat as the register holds it — from a shallow-draught punt to a consecrated monitor of forty-six tonnes.",
    blocks: [
      { lead: "A gun on a shallow hull reaches ground no column can, and the flooded diggings are the only roads that were never built." },
      { p: "The class runs from a flat-bottomed punt with a forward turret to a monitor carrying a main gun, a casemate and two ring mounts. Both are slow to answer the helm, both are difficult to sink, and neither will climb anything." },
      { note: "This is the live Ironclad Gunboat, described in Motor Pool terms. Naval movement remains the Sea expansion's question." },
    ],
    see: ["maker-mw-redwater-hullyards", "maker-ferrymen-shrine-armoury", "order-of-battle"],
  },
  {
    id: "vehicle-class-fighter",
    title: "The Fighter",
    folk: "the lofter",
    category: "war",
    tag: "Motor Pool §4",
    status: "canon",
    summary: "The Prop Fighter as the register holds it — a seat, an engine, and the thinnest structure a stress office would sign.",
    blocks: [
      { lead: "Two tonnes of airframe behind six hundred horsepower, and every number in the class falls out of that ratio." },
      { p: "The pilot is the mount: the guns are in the mainplanes or the nose and are laid by pointing the machine. Protection is a seat-back plate and a sump plate, fitted by every squadron after the first loss and by none of them before it." },
      { note: "This is the live Prop Fighter, described in Motor Pool terms. Aerial movement remains the Air expansion's question." },
    ],
    see: ["vehicle-class-bomber", "maker-mw-longshadow-aeroworks", "order-of-battle"],
  },
  {
    id: "vehicle-class-bomber",
    title: "The Bomber",
    folk: "the span",
    category: "war",
    tag: "Motor Pool §4",
    status: "thin",
    summary: "A bay, a glazed nose and two gun positions that exist to make the last quarter of an hour survivable.",
    blocks: [
      { lead: "The bomber is the only class on the register whose main armament is not aimed by the machine carrying it." },
      { p: "It is drawn light, carries five, and puts its weight where the bay is. The dorsal and ventral positions are defensive and everyone aboard knows the arithmetic; the structure is the lightest the stress office would sign, and the crew have read the same drawings the office did." },
      { note: "No bomber exists in the live unit table. GAME_RULES §25 is the draft, and the Air expansion is the place it lands." },
    ],
    see: ["vehicle-class-fighter", "maker-mw-longshadow-aeroworks"],
  },
```

## 16. Art manifest rows

**103 placeholder plates**, all in the new `motor` `IMAGE_CATEGORIES` key, all `url: null`, appended to
`src/lib/imageLibrary.js` as one banner-commented block at the end of `IMAGE_LIBRARY`. Coverage is
asserted mechanically in `test/motor-mirror.test.js` rather than counted here: every chassis has a
`chassis_<key>`, every powerplant a `plant_<key>`, every armour package, suspension, mount and refit
kit a `refit_<key>`, and every `mw_*` works a `maker_<key>`.

**The `refit_*` prefix already existed** — seventeen keys in the `vehicles` category
(`refit_quartermaster_rig`, `refit_smoke_generators`, `refit_wireless_set`, …). This lane's keys carry
the catalogue's own prefixes inside them (`refit_ap_*`, `refit_sus_*`, `refit_mnt_*`, `refit_vm_*`), so
collision is structural rather than lucky, and the uniqueness test sweeps the whole library.

Prompts carry **no house style** — `HOUSE_STYLE` is prepended at generation, so a prompt that restated
it would produce a doubled prompt — and **no colour direction, no artist names, no real-world brands**.
Each is 15–35 words and says only what is specific to its subject: the machine, the kit, the pose, the
ground, the light. Both rules are asserted over this lane's plate text.

Do not fold these into `docs/prompts/ART_MANIFEST.md` from here; that file is the orchestrator's, and
the keys are listed in the PR body for it.

| Plate key | Aspect | Subject |
| --- | --- | --- |
| `chassis_outrider_129_whippet_mk2` | 4:3 | Outrider 129 Whippet, Mk II — Scout crawler — chassis pattern plate |
| `chassis_knife_136_ferret_mk3` | 4:3 | Knife 136 Ferret, Mk III — Scout crawler — chassis pattern plate |
| `chassis_hundredweight_141_line_crawler` | 4:3 | Hundredweight 141 Line Crawler — Line crawler — the reference hull, 12 pts |
| `chassis_verdict_144_levy_crawler` | 4:3 | Verdict 144 Levy Crawler — Line crawler — chassis pattern plate |
| `chassis_tollgate_147_knotwork_crawler_mk2` | 4:3 | Tollgate 147 Knotwork Crawler, Mk II — Line crawler — chassis pattern plate |
| `chassis_grimwold_138_breaker_mk3` | 4:3 | Grimwold 138 Breaker, Mk III — Heavy crawler — chassis pattern plate |
| `chassis_forgeworks_152_cinderhead` | 4:3 | Forgeworks 152 Cinderhead — Heavy crawler — chassis pattern plate |
| `chassis_grimwold_156_lockjaw_mk1` | 4:3 | Grimwold 156 Lockjaw, Mk I — Land fort — chassis pattern plate |
| `chassis_drover_134_provender_carrier` | 4:3 | Drover 134 Provender Carrier — Half-track — chassis pattern plate |
| `chassis_seamfire_143_burnwagon` | 4:3 | Seamfire 143 Burnwagon — Half-track — chassis pattern plate |
| `chassis_dustpromise_131_courier_mk2` | 4:3 | Dustpromise 131 Courier, Mk II — Armoured car — chassis pattern plate |
| `chassis_copperline_139_beacon_car` | 4:3 | Copperline 139 Beacon Car — Armoured car — chassis pattern plate |
| `chassis_sledge_145_pit_gun` | 4:3 | Sledge 145 Pit Gun — Self-propelled gun — chassis pattern plate |
| `chassis_harrow_149_slaghound_mk2` | 4:3 | Harrow 149 Slaghound, Mk II — Self-propelled gun — chassis pattern plate |
| `chassis_crossloom_128_field_carriage` | 4:3 | Crossloom 128 Field Carriage — Tractor-drawn gun — chassis pattern plate |
| `chassis_punt_137_shoalcutter` | 4:3 | Punt 137 Shoalcutter — Gunboat — chassis pattern plate |
| `chassis_reliquary_124_monitor_mk2` | 4:3 | Reliquary 124 Monitor, Mk II — Gunboat — chassis pattern plate |
| `chassis_kestrel_150_lofter_mk2` | 4:3 | Kestrel 150 Lofter, Mk II — Fighter — chassis pattern plate |
| `chassis_adjudicated_142_writhawk` | 4:3 | Adjudicated 142 Writhawk — Fighter — chassis pattern plate |
| `chassis_longshadow_154_span_mk1` | 4:3 | Longshadow 154 Span, Mk I — Bomber — chassis pattern plate |
| `plant_hw_flatbed_diesel_60` | 4:3 | Hundredweight Flatbed Diesel, 60 hp — Powerplant plate — 60 hp pit-head diesel |
| `plant_rs_levy_diesel_95` | 4:3 | State Levy Diesel, 95 hp — Powerplant plate — 95 hp arsenal diesel |
| `plant_cl_knotwork_diesel_140` | 4:3 | Knotwork Governed Diesel, 140 hp — Powerplant plate — 140 hp governed diesel |
| `plant_em_anvilgate_diesel_240` | 4:3 | Anvilgate Twin-Bank Diesel, 240 hp — Powerplant plate — 240 hp twin-bank diesel |
| `plant_em_forgeworks_diesel_460` | 4:3 | Forgeworks Gallery Diesel, 460 hp — Powerplant plate — 460 hp gallery diesel |
| `plant_tp_seamfire_flash_boiler_180` | 4:3 | Seamfire Flash Boiler, 180 hp — Powerplant plate — 180 hp steam flash boiler |
| `plant_ow_courier_alcohol_75` | 4:3 | Courier Alcohol Burner, 75 hp — Powerplant plate — 75 hp alcohol burner |
| `plant_kh_boneyard_pieced_diesel_120` | 4:3 | Boneyard Pieced Diesel, 120 hp — Powerplant plate — 120 hp salvaged diesel |
| `plant_rw_shoal_marine_diesel_310` | 4:3 | Shoalworks Marine Diesel, 310 hp — Powerplant plate — 310 hp marine diesel |
| `plant_as_beacon_turbine_540` | 4:3 | Beacon Gas Turbine, 540 hp — Powerplant plate — 540 hp gas turbine |
| `plant_ls_lofter_radial_620` | 4:3 | Lofter Radial, 620 hp — Powerplant plate — 620 hp aero radial |
| `plant_fs_reliquary_cell_800` | 4:3 | Reliquary Cell, 800 hp — Powerplant plate — 800 hp relic power cell (tier III) |
| `refit_ap_gun_shield` | 1:1 | Gun-Shield & Trail Plate — Armour package plate — gun shield and trail plate |
| `refit_ap_seat_and_sump` | 1:1 | Seat-Back & Sump Plate — Armour package plate — pilot seat and sump plating |
| `refit_ap_sandbag_stowage` | 1:1 | Sandbag & Spare-Track Stowage — Armour package plate — improvised frontal stowage |
| `refit_ap_overhead_grillage` | 1:1 | Overhead Grillage — Armour package plate — anti-mortar roof grillage |
| `refit_ap_spaced_screens` | 1:1 | Spaced Screens — Armour package plate — spaced side and rear screens |
| `refit_ap_bolted_salvage` | 1:1 | Bolted Salvage Plate — Armour package plate — bolted-on salvaged plate |
| `refit_ap_rolled_plate_suit` | 1:1 | Rolled Plate Suit — Armour package plate — full rolled plate suit |
| `refit_ap_cast_glacis` | 1:1 | Cast Glacis — Armour package plate — heavy cast frontal glacis |
| `refit_ap_sealed_fume_hull` | 1:1 | Sealed Fume Hull — Armour package plate — sealed all-round hull |
| `refit_ap_face_hardened_belt` | 1:1 | Face-Hardened Belt — Armour package plate — face-hardened frontal belt |
| `refit_ap_breakthrough_carapace` | 1:1 | Breakthrough Carapace — Armour package plate — all-round heavy carapace |
| `refit_ap_relic_alloy_skin` | 1:1 | Relic-Alloy Skin — Armour package plate — precursor alloy skin (tier III) |
| `refit_ap_fortress_courses` | 1:1 | Fortress Courses — Armour package plate — poured fortress courses |
| `refit_sus_line_tread` | 1:1 | Line Tread — Suspension plate — standard sprung tread |
| `refit_sus_wide_girder_tread` | 1:1 | Wide-Girder Tread — Suspension plate — wide flotation tread |
| `refit_sus_half_track_bogie` | 1:1 | Half-Track Bogie — Suspension plate — half-track running gear |
| `refit_sus_road_wheels` | 1:1 | Road Wheels — Suspension plate — armoured car road wheels |
| `refit_sus_walker_legs` | 1:1 | Walker Legs — Suspension plate — articulated walking legs |
| `refit_sus_twin_screw` | 1:1 | Twin Screw — Suspension plate — marine twin screw and rudders |
| `refit_sus_plenum_skirt` | 1:1 | Plenum Skirt — Suspension plate — relic plenum skirt (tier III) |
| `refit_sus_flight_gear` | 1:1 | Flight Gear — Suspension plate — undercarriage and flying surfaces |
| `refit_sus_split_trail` | 1:1 | Split Trail — Suspension plate — split-trail gun carriage |
| `refit_mnt_fixed_bow` | 1:1 | Fixed Bow Plate — Mount plate — fixed bow gun mounting |
| `refit_mnt_casemate_box` | 1:1 | Casemate Box — Mount plate — fixed casemate mounting |
| `refit_mnt_howitzer_cradle` | 1:1 | Howitzer Cradle — Mount plate — open howitzer cradle |
| `refit_mnt_wing_battery` | 1:1 | Wing Battery — Mount plate — harmonised wing guns |
| `refit_mnt_open_pintle_ring` | 1:1 | Open Pintle Ring — Mount plate — open ring mounting |
| `refit_mnt_shielded_ring` | 1:1 | Shielded Ring Mount — Mount plate — shielded ring mounting |
| `refit_mnt_enclosed_turret` | 1:1 | Enclosed Turret — Mount plate — enclosed traversing turret |
| `refit_mnt_twin_cradle` | 1:1 | Twin Cradle — Mount plate — twin-barrel cradle |
| `refit_mnt_sponson_pair` | 1:1 | Sponson Pair — Mount plate — hull side sponsons |
| `refit_mnt_barbette_tier` | 1:1 | Tiered Barbette — Mount plate — tiered armoured barbette |
| `refit_vm_governor_removed` | 1:1 | Governor Removed — Refit kit plate — engine, governor removed |
| `refit_vm_forced_induction` | 1:1 | Forced Induction Pack — Refit kit plate — engine, blower pack |
| `refit_vm_radiator_gallery` | 1:1 | Radiator Gallery — Refit kit plate — engine, radiator gallery |
| `refit_vm_low_compression_rebuild` | 1:1 | Low-Compression Rebuild — Refit kit plate — engine, low-compression rebuild |
| `refit_vm_relic_cell_governor` | 1:1 | Relic-Cell Governor — Refit kit plate — engine, relic regulator (tier III) |
| `refit_vm_track_skirts` | 1:1 | Track Skirts — Refit kit plate — armour, hung track skirts |
| `refit_vm_spall_liner` | 1:1 | Spall Liner — Refit kit plate — armour, interior spall liner |
| `refit_vm_belly_plate` | 1:1 | Belly Plate — Refit kit plate — armour, belly plate |
| `refit_vm_mantlet_collar` | 1:1 | Mantlet Collar — Refit kit plate — armour, mantlet collar |
| `refit_vm_reinforced_bogies` | 1:1 | Reinforced Bogies — Refit kit plate — suspension, reinforced bogies |
| `refit_vm_wide_grousers` | 1:1 | Wide Grousers — Refit kit plate — suspension, extended grousers |
| `refit_vm_shock_dampers` | 1:1 | Shock Dampers — Refit kit plate — suspension, leading-station dampers |
| `refit_vm_dozer_blade` | 1:1 | Dozer Blade — Refit kit plate — suspension, dozer blade |
| `refit_vm_power_traverse` | 1:1 | Power Traverse — Refit kit plate — turret, powered traverse |
| `refit_vm_long_barrel_gun` | 1:1 | Long-Barrel Fitting — Refit kit plate — turret, long-barrel gun |
| `refit_vm_cupola_ring` | 1:1 | Commander's Cupola — Refit kit plate — turret, commander's cupola |
| `refit_vm_turret_basket` | 1:1 | Turret Basket — Refit kit plate — turret, rotating basket floor |
| `refit_vm_smoke_dischargers` | 1:1 | Smoke Dischargers — Refit kit plate — hardpoint, smoke dischargers |
| `refit_vm_coaxial_pintle` | 1:1 | Coaxial Pintle — Refit kit plate — hardpoint, coaxial gun |
| `refit_vm_ready_racks` | 1:1 | Ready Racks — Refit kit plate — hardpoint, ready ammunition racks |
| `refit_vm_muzzle_brake_collar` | 1:1 | Muzzle Brake Collar — Refit kit plate — hardpoint, muzzle brake |
| `refit_vm_range_drum_sight` | 1:1 | Range-Drum Sight — Refit kit plate — optics, range drum sight |
| `refit_vm_night_lamp_set` | 1:1 | Night Lamp Set — Refit kit plate — optics, shuttered night lamp |
| `refit_vm_stereo_rangefinder` | 1:1 | Stereo Rangefinder — Refit kit plate — optics, stereo rangefinder |
| `refit_vm_command_set` | 1:1 | Command Wireless Set — Refit kit plate — radio, command set |
| `refit_vm_signals_relay` | 1:1 | Signals Relay — Refit kit plate — radio, relay set |
| `refit_vm_direction_finder` | 1:1 | Direction Finder — Refit kit plate — radio, direction finder |
| `refit_vm_external_fuel_drums` | 1:1 | External Fuel Drums — Refit kit plate — stowage, jettisonable fuel drums |
| `refit_vm_spare_link_bins` | 1:1 | Spare-Link Bins — Refit kit plate — stowage, track spares bins |
| `refit_vm_deck_cargo_rails` | 1:1 | Deck Cargo Rails — Refit kit plate — stowage, cargo rails and benches |
| `refit_vm_asbestos_suits` | 1:1 | Fireproofed Crew Suits — Refit kit plate — crew kit, fireproofed suits |
| `refit_vm_medical_locker` | 1:1 | Medical Locker — Refit kit plate — crew kit, medical locker |
| `refit_vm_escape_hatch_cut` | 1:1 | Cut Escape Hatch — Refit kit plate — crew kit, cut floor hatch |
| `refit_vm_ventilation_fans` | 1:1 | Ventilation Fans — Refit kit plate — crew kit, extractor fans |
| `maker_mw_grimwold_treadworks` | 1:1 | Grimwold Treadworks — Motor works plate — heavy hull builder |
| `maker_mw_chandlery_carriageworks` | 1:1 | Chandlery Carriageworks — Motor works plate — carrier and half-track builder |
| `maker_mw_kettleharrow_boneyard` | 1:1 | Kettleharrow Boneyard — Motor works plate — salvage rebuilder |
| `maker_mw_longshadow_aeroworks` | 1:1 | Longshadow Aeroworks — Motor works plate — airframe builder |
| `maker_mw_redwater_hullyards` | 1:1 | Redwater Hullyards — Motor works plate — shallow-draught hull builder |
