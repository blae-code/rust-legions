# The Motor Pool — design record (Lane J)

Canonical data: `base44/shared/motorPool.ts` · mirror: `src/lib/motorPool.js` ·
tests: `test/motor-mirror.test.js`, `test/motor-roll.test.js`.

Contract: `docs/TACTICAL_SQUAD_PLAN.md` §3 (ownership), §4 (payload shapes), §6 (drift guards).
Consumes Lane I's `base44/shared/arms.ts` and Lane B's `base44/shared/tacticalField.ts`.

> **Status.** Sections 1–8 and 13 are authored. Sections 9–12 and 14–16 — refit kits, quirks,
> `rollVehicle`, `deriveMechanized`, the `[PROPOSED]` rules draft, the Codex entries and the art
> manifest — land in the remaining steps of this lane. Section numbering is fixed by the lane brief
> and is not renumbered when the gaps are filled.

---

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
