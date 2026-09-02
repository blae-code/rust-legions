# Rust Legions — The Quartermaster's Ledger (Gear & Upgrade Library)

> **Status: CONTENT DRAFT** (tracker §3.12 / L-15). The item library for every system, shipped and
> proposed. Absorbs idea-board 3.1 (relic items) and 3.5 (support units). Effects are one-line design
> intent; **all numbers are decided at spec time** — cost bands only here (Low / Mid / High / Relic).
>
> **Tier gates** (per `TECH_DESIGN.md`): **[S]** shipped today · **[I]** Doctrine tier, buildable ·
> **[II:x]** Pattern tier, unlocked by analyzing fragment class *x* (Eng/Cache/Ciph/Wake) ·
> **[III]** Relic Project, keyed by an intact Object, found never built · **[A]** requires State
> Armory certification. Items marked ♦ have a folk name — two registers per LORE §0.2.

---

## 1. Generals — Command Vehicles & Staff

*Extends GAME_RULES §21 (vehicles, equipment/weapon bays). Adds a third bay: the Staff Bay — one
aide riding with the general, a person not a part.*

**Equipment bay** *(any vehicle; bolsters the attending army)*
| Item | Gate | Cost | Effect |
| --- | --- | --- | --- |
| Quartermaster Rig | [S] | Mid | −5% dmg in |
| Observation Balloon | [S] | Mid | +1 skill |
| Field Hospital Trailer | [S] | Mid | −10% morale dmg in; enables recovery trickle away from keel (SUPPLY §3) |
| Wireless Set | [I] | Mid | Army counts as In Supply one zone deeper (Extended without a column) |
| Pioneer Toolcart | [I] | Low | Entrench action builds field works in 1 day instead of 2 |
| Winter Stores Sledge | [I] | Low | Halves winter attrition; Forage allowed in snow at −2 (SUPPLY §10.5) |
| Armored Fuel Bowser | [I] | Mid | Crawlers deadline last, not first, when Cut Off |
| Smoke Generators | [II:Wake] | Mid | Once/battle: conceal this round's weight shift (COMBAT Line) |
| Calliope Rack ♦ "the Choirmaster's Cart" | [II:Wake] | High | Barrage option deals +2 extra morale dmg |
| The Unerring Glass ♦ | [III] | Relic | Precursor optics: see enemy maneuver *every* round; general becomes the map's priority Headhunt target |

**Weapon bay** *(trait-locked; Supreme land-train mounts any)*
| Item | Gate | Trait | Effect |
| --- | --- | --- | --- |
| Breaker Ram | [S] | Butcher | +10% dmg out |
| Mauler Flail Dozer | [II:Wake] | Butcher | Breakthrough margin −1 on the general's weighted front |
| Whisper Battery | [S] | Fox | +1 skill |
| Fox's Mirrors ♦ | [II:Ciph] | Fox | Once/battle: show a *false* pick to enemy Strafing Run |
| Bastion Casemate | [S] | Bulwark | −10% dmg in |
| Redoubt Anchor Spades | [II:Cache] | Bulwark | Iron Wall no longer concedes the +5 enemy morale |
| Thunder Klaxon | [S] | Firebrand | +15% morale dmg dealt |
| Clarion Organ ♦ "the Hymn Gun" | [II:Wake] | Firebrand | Inspiring Charge also rallies +5 to adjacent fronts |

**Staff bay** *(new; one aide per general)*
| Aide | Gate | Cost | Effect |
| --- | --- | --- | --- |
| Signals Adjutant | [I] | Low | +1 to dogfight/Strafing contests; probe tendencies auto-shared |
| Master Cartographer | [I] | Low | +1 march rate on trails/broken ground |
| Provost Marshal | [I] | Low | Rout threshold −10 (army breaks later); −5% morale recovery |
| Quartermaster-General | [I] | Mid | Army Forage yields +25%, incident odds −25% |
| Reliquary Chaplain | [I] | Low | +2 skill fighting on/for dig sites; Reliquary Lobby favor + |
| Old Keel Adjutant | [I] | Mid | General loyalty drift toward faction halved (LIFEPATH §2.4) |
| Company Surgeon | [II:Cache] | Mid | Wound results on general fate rolls downgraded one step |

## 2. Mobile Bases — Fortress Modules

*Extends GAME_RULES §18. New bays proposed: Laboratory, Hangar, Habitat, Aura, Keep (VISION §3.2
families completed). One module per bay; ★ = [A] certification as shipped.*

**Armor bay:** Riveted Plating [S] · Bulwark Hull [S] · Citadel Plate [S][A] · **Sloped Casemates**
[II:Cache] (Bulwark-tier defense, −1 boarding deck for attackers) · **Murder-Decks** [I] (boarding
attackers fight the Treadworks deck at −2) · **the Anchor's Tooth** ♦ [III] (immune to bombardment;
boarding fights one extra deck).

**Engine bay:** Crawler Drives [S] · Leviathan Turbines [S] · Juggernaut Reactors [S][A] · **Swamp
Screws** [II:Eng] (marsh at normal cost; skim while crossing) · **Silent Gearing** [II:Eng]
(encirclement checks need one extra day of flow-cut — the keel that slips the noose) · **the
Deepwell Heart** ♦ [III] (base movement costs no Fuel).

**Industry bay:** Salvage Refinery [S] · Arc Smelters [S] · Habitat Decks [S] · Munitions Works
[S][A] · **Skim Scoops** [II:Eng] (+50% skim-while-marching rate) · **Pattern Shop** [II:Cache]
(Armory certifications −25% cost) · **the Patient Engine** ♦ [III] (on-board production continues
while moving).

**Laboratory bay** *(new — gates TECH Tiers II–III)*: **Field Assay Office** [I] (analyze fragments,
1 slot) · **Cipher Hall** [I] High (2 Object housings; Cipher analysis ×1.5) · **the Long Ear** ♦
[III] (map-wide intercept upgrade; enemy relic projects revealed).

**Hangar bay** *(new)*: **Muster Decks** [I] (muster armies at the base; +garrison cap) · **Launch
Rails** [II:Eng] (fighters rebase to the keel; one free Strafing per battle in footprint) · **Sortie
Gates** [I] (encircled sorties at +2).

**Habitat bay** *(new)*: **Granary Decks** [I] (siege stores +N days — the encirclement answer) ·
**Assembly Hall** [I] (one extra decree option at Sessions; bloc favor decay −) · **Pilgrim Berths**
[I] (parish disposition +; Manpower trickle at Anchor Fields).

**Aura bay** *(new)*: **March Klaxons** [II:Ciph] (+1 march rate, armies in footprint) · **Ministry
Mast** [I] (herald/probe range +1; Field Orders update off-turn) · **the Choir** ♦ [III] (−25%
morale dmg taken, armies in footprint; nobody asks what hums).

## 3. Economy — Graze & Prospecting Gear

*Hooks ECONOMY_DESIGN. Mostly keel fittings and column kit.*

| Item | Gate | Cost | Effect |
| --- | --- | --- | --- |
| Auger Heads | [I] | Mid | Footprint draw +25% on seams |
| Dredge Scoops | [I] | Mid | Footprint draw +25% on lodes |
| Survey Wagon | [I] | Low | Probe deposits at +1 range; richness revealed exactly |
| Deep-Survey Rig | [II:Eng] | High | Deep Survey 2 days faster; +10% hidden-deposit odds; +Wake risk |
| Assay Scales ♦ "the Honest Weights" | [II:Ciph] | Mid | Fragment yields +10%; Combine trade rates improve |
| Bonded Warehouse (waystation fitting) | [I] | Mid | Depot at a waystation is raid-proof while neutral |
| Charter Seal | [I] | Low | Harvest contracts −20% upkeep; Syndicate Bench favor + |
| Tithe Book | [I] | Low | Tribute grazing incident odds −25%; the Levy disapproves |
| the Cartographer's Stone ♦ | [III] | Relic | All dig-site rumors revealed map-wide; victory progress |

## 4. Logistics — Columns, Depots, Roads

*Hooks ECONOMY §2, SUPPLY §2/§7.*

**Draught column chassis:** **Light Draught** [I] (fast, small hold) · **Heavy Draught** [I] (2×
hold, slow) · **Armored Draught** [II:Cache] (survives one raid contest round for free) · **Silent
Draught** ♦ "the Night Freight" [II:Ciph] (invisible beyond adjacent zones).

**Column & road kit:** Spare Teams [I] (circuit downtime −1 day) · Escort Wagons [I] (raiders fight
at −1) · Weatherproof Tarps [I] (rain doesn't slow the column) · Corduroy Kits [I] (column lays
trail: broken-ground route cost −1 after 3 crossings) · **Bridging Train** [I] High (river fronts
crossable; river routes shortened — SUPPLY §7) · **Pack Train** [I] (mountain routes at normal cost,
half hold) · Runner Kit [II:Ciph] (siege runner convoy odds +25%).

**Depot kit:** Cache Pits [I] (depot invisible until adjacent) · Fuel Bladders [I] (depot holds
+50% Fuel) · Demolition Charges [I] (torched depot damages the captor) · Depot Signal Post [I]
(depot extends Extended range +1).

## 5. Industry — Capacity & Inputs

*Zone buildings and refit infrastructure. Hooks GAME_RULES §3, §21.*

| Item | Gate | Cost | Effect |
| --- | --- | --- | --- |
| Tooling Upgrade (Foundry fitting) | [I] | Mid | This Foundry's units −1 Steel (stacks with iron_foundry tile) |
| Shift Whistles (Barracks fitting) | [I] | Low | +1 Manpower income this zone; Levy favor + |
| Cracking Towers (Refinery fitting) | [II:Eng] | High | +1 Fuel; refinery fires crisis odds + |
| Gantry Crane (zone fitting) | [I] | High | This zone refits fortress modules (extends §21's level-2-Foundry rule) |
| Salvage Works | [I] | Mid | Battles adjacent to this zone return 10% of losses as Steel |
| Munitions Line | [I] | Mid | Artillery −1 cost; Barrage option +1 morale dmg armies supplied from here |
| Standard Gauge Jigs | [II:Cache] | High | All refit convoys arrive 1 day sooner |

## 6. Manufacturing — Patterns off the Line

*Unit variants certified via the Armory (absorbs idea 3.5 pattern lineage). A pattern, once
certified, is a muster option at its surcharge.*

| Pattern | Gate | Base unit | Effect |
| --- | --- | --- | --- |
| 141 Levy Rifle | [I][A] | Riflemen | −1 MP cost, −1 def ("good enough for the Hundredweight") |
| Marksman Pattern | [I][A] | Riflemen | +1 atk, +1 Steel |
| Hundredweight-Pattern Crawler | [II:Eng][A] | Crawler | +1 def, −1 Fuel upkeep flavor; the classic |
| Breacher Crawler | [II:Wake][A] | Crawler | Siege: Bombard breach rate +; battle: Shock threshold −1 vs forts |
| Salvage Crawler | [I][A] | Crawler | Joins Salvage Detachment duties; −1 atk |
| Longwing Fighter | [II:Eng][A] | Fighter | Strafing usable twice/battle; fragile (−1 def) |
| Camera Fighter | [II:Ciph][A] | Fighter | Probes from the air: probe action at +2 range |
| Siege Mortar Battery | [I][A] | Artillery | The Siege Train gun (SUPPLY §7): breach ×2, march ½ |
| Rocket Sledge ♦ "the Screamer" | [II:Wake][A] | Artillery | Barrage hits two fronts at −2 each |
| Lance Carriage | [III] | Artillery | Mounts a Lance Battery Object off-keel; the army becomes a strategic asset and target |

## 7. Vehicles — Kits & Support Classes

**Upgrade kits (fit at refit sites):** Armor Skirts [I] (crawler +1 def vs Barrage) · Mine Flails
[I] (ignore Mine Belts — §10) · Flame Projectors [S→item] (crawler +1 atk, +1 Fuel; terror: +2
morale dmg vs levy infantry) · Drop Tanks [S→item] (fighter range/def) · Salvage Crane [I] (crawler
company recovers deadlined vehicles 1 day faster) · Ski Conversions [I] (crawlers move in snow at
−1 atk).

**Support vehicle classes (new units):** **Signals Wagon** [I] (probe range +1; +1 dogfight;
Headhunt defense +1) · **Salvage Detachment** [I] (excavation +25%; Cache yields +10%; near-useless
in line battle) · **Hospital Train** [II:Cache] (recovery trickle anywhere In Supply) · **Bridging
Train** [I] (see §4) · **Provost Column** [I] (occupied settlements' unrest events −50%).

## 8. Infantry — Kit & Specialist Companies

**Kit (Army Design weapon/armor slots, extended):** Trench Guns [S] · Mortars [S] · Sapper Plate
[I] (dmgIn ×0.9 in siege assaults) · Wire & Spades Issue [I] (the Spade verb works on plains too) ·
Gas Masks? — no: **Storm Hoods** [II:Cache] (immune to Smoke/Star Shell effects) · Lance Rifles ♦
"the Quiet Word" [III] (relic small-arms for the Guard only: Guard surge +2 further; horrifies
everyone including your blocs).

**Specialist companies (muster options):** **Sappers** [I] (Sap works 2× rate; breaching charges in
boarding) · **Stormtroops** [I][A] (may always be Guard-flagged regardless of veterancy; +cost) ·
**Ski Troops** [I] (full function in snow; Forage in winter at no penalty) · **Digger Corps** [I]
(excavation without a Salvage Detachment; red-flag discipline built in) · **Pilgrim Levy** [I]
(cheap mass; +2 morale on holy ground, −2 off it; Procession signature).

## 9. Macro Army — Campaign Fittings

*Army-level items carried on the march (one Standard + two Fittings per army).*

**Standards** *(army lifepath anchors — capturable at rout, COMBAT §6)*: **Column Standard** [I]
(default; honors embroidered) · **Reliquary Standard** [I] (morale +5 on dig sites; a *prize* if
taken) · **Black Standard** ♦ "the Debt Unpaid" [I] (no morale bonus; enemy sees veterancy as one
band higher — reputation as armor) · **the First Keel's Pennant** ♦ [III] (unique: rout threshold
−15; if ever captured, map-wide Chronicle event).

**Fittings:** Entrenchment Kit [I] (field works on camp, 1 day) · Forced-March Boots Program [I]
(+1 march 3 days, then −1 two days — spend the men) · Forage Wagons [I] (Forage radius +1 zone) ·
Signal Rockets [I] (evade one interception attempt per march) · Balloon Detachment [I] (recon
radius +1 on the march) · Winter Quarters Kit [I] (winter camp attrition zero) · Pontoon Section
[I] (one river crossing without the Bridging Train, then expended).

## 10. Micro Army — Battle-Map Consumables

*Bought before battle or carried (2 slots per army); expended on use. Each maps to a COMBAT layer.*

| Item | Gate | Effect (once per battle unless noted) |
| --- | --- | --- |
| Pre-Registered Fire Plan | [I] | Your first Barrage cannot be countered by All-Out |
| Smoke Shells | [I] | Conceal your weight shift this round |
| Star Shells | [I] | Negate fog/night modifiers one round; reveal enemy weighting |
| Wire & Stakes | [I] | Fortify one front (+1 HtL there, whole battle) |
| Mine Belt | [I] | First enemy Flanking against a chosen front takes dmg, loses its bonus |
| Breaching Charges | [I] | Boarding: skip one deck's fortification bonus |
| Storm Ladders | [I] | Assault a breach one day earlier |
| Aid Station Stores | [I] | Withdrawal pursuit losses halved (stacks with reserve cover) |
| Thunderflash Batteries ♦ | [II:Wake] | Enemy skill −2 one round; your Feint reads as All-Out to their scout |
| the Keyturner's Kit ♦ | [III] | Boarding: the Keep's Headhunt succeeds on ties — the base falls intact more often |

---

## Integration & Balance Notes

- Every [II] item names its fragment class → TECH demand loop; every [III] item is an Object per
  LORE §5 conventions (Objects here: the Unerring Glass, Anchor's Tooth, Deepwell Heart, Patient
  Engine, Long Ear, Choir, Cartographer's Stone, Lance Battery/Carriage, Lance Rifles, First Keel's
  Pennant, Keyturner's Kit — count: ~11 uniques, consistent with TECH open q.4's per-map pacing).
- Slot discipline caps loadouts: general = 3 bays; base = 7 bays max (existing 3 + 4 proposed);
  army = 1 Standard + 2 Fittings + 2 Consumables + Design. No infinite christmas trees.
- **Balance is not attempted here.** Each line is a design intent; L-8 spec sheets assign numbers
  when a slice is promoted. Redundant-feeling items (e.g., three sources of march speed) are
  deliberate — different systems, different costs, player expression.

## Open Questions

1. New base bays (Lab/Hangar/Habitat/Aura/Keep): all five, or fold Keep into Armor and Aura into
   Habitat to keep the bay UI at five?
2. Consumable economy: bought with resources, or a new "requisition" trickle to avoid Steel doing
   everything?
3. Staff aides: are they characters (named, lifepath-adjacent, can die) or gear? (Leaning:
   named-but-simple — a fate roll when the vehicle is Headhunted. Free drama.) **Partially
   answered by the mortality directive: aides are named and stand in the succession pool
   (LIFEPATH §2.6).**
4. Which of the ~140 items ship in each slice — the library needs a cut-list per design-doc slice
   so Claude Code never implements orphaned gear.

---

## 11. Points Audit — Tactical Squads, Specialists & Kits (Lane F)

**Every figure in this section is computed, none is typed.** `test/gear-points-audit.test.js` parses
the tables below back out of this file, recomputes each cell from `base44/shared/tactical.ts`,
`src/lib/armyDesign.js` and `src/lib/units.js`, and fails on any disagreement — including a
disagreement between the formula printed in 11.1 and the numbers printed under it. A stale number
here is a red test, not a reading error.

The audit is bounded at both ends: it begins at this heading and ends at the next `##` heading, so a
later lane appending its own section after this one changes nothing the test reads.

### 11.1 The efficiency formula

```
value(t)      = t.figures × ( t.melee + t.ranged + 0.6×t.armor + 0.35×t.speed + 0.5×t.morale + 0.25×(t.range − 1) )
efficiency(t) = value(t) ÷ t.pts
baseline      = efficiency(SQUAD_TYPES.riflemen)          // the reference: riflemen ×10 = 100 pts
ratio(t)      = efficiency(t) ÷ baseline
HARD GATE:      ratio(t) ≤ 1.60 for every t in SQUAD_TYPES
```

The anchor is `SQUAD_TYPES.riflemen.pts = 100` — the cost of **one squad** at its default
10 figures, not the cost of a figure. `baseline` computes to **2.825**.

**Two models are reported, and they are not the same instrument.** The formula above is the one this
lane's brief mandates and the one the hard gate reads. Lane A also ships a points model in code —
`combatValue` / `fairPts` / `typeEfficiency` in `base44/shared/tactical.ts`, driven by `POINTS_MODEL`
— and **that** is what every `pts` in this roster was actually solved against, because it is the model
the engine will price with. The `fair pts` and `dev` columns below are its verdict. Where the two
disagree, the disagreement is a property of the formulae and is reported in 11.8, never smoothed.

### 11.2 Every squad type, priced

| key | from | tier | figures | pts | value | efficiency | ratio | fair pts | dev |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `riflemen` | riflemen | I | 10 | 100 | 282.50 | 2.825 | 1.00 | 100.00 | +0.00% |
| `assault` | riflemen | I | 8 | 90 | 253.60 | 2.818 | 1.00 | 92.11 | -2.29% |
| `gunners` | riflemen | I | 6 | 85 | 176.40 | 2.075 | 0.73 | 84.22 | +0.92% |
| `scouts` | riflemen | I | 5 | 45 | 83.50 | 1.856 | 0.66 | 45.82 | -1.80% |
| `mortars` | riflemen | I | 4 | 55 | 85.20 | 1.549 | 0.55 | 54.90 | +0.17% |
| `pioneers` | riflemen | I | 8 | 100 | 210.80 | 2.108 | 0.75 | 98.83 | +1.18% |
| `crawler` | crawler | I | 1 | 100 | 34.85 | 0.348 | 0.12 | 98.39 | +1.64% |
| `artillery` | artillery | I | 1 | 100 | 27.90 | 0.279 | 0.10 | 98.86 | +1.15% |
| `fighter` | fighter | I | 1 | 70 | 27.45 | 0.392 | 0.14 | 70.11 | -0.16% |
| `stormtroops` | riflemen | I | 8 | 105 | 268.40 | 2.556 | 0.90 | 105.03 | -0.03% |
| `sappers` | riflemen | I | 8 | 106 | 213.60 | 2.015 | 0.71 | 106.28 | -0.26% |
| `ski_troops` | riflemen | I | 10 | 85 | 252.00 | 2.965 | 1.05 | 84.69 | +0.36% |
| `digger_corps` | riflemen | I | 10 | 82 | 196.50 | 2.396 | 0.85 | 81.89 | +0.14% |
| `pilgrim_levy` | riflemen | I | 14 | 89 | 341.60 | 3.838 | 1.36 | 89.21 | -0.23% |
| `provost` | riflemen | I | 6 | 58 | 132.00 | 2.276 | 0.81 | 58.23 | -0.39% |
| `marksmen` | riflemen | I | 5 | 51 | 95.00 | 1.863 | 0.66 | 50.62 | +0.75% |
| `flame_team` | riflemen | II:Eng | 6 | 59 | 142.50 | 2.415 | 0.85 | 58.85 | +0.26% |
| `autocar_scouts` | crawler | I | 1 | 41 | 22.70 | 0.554 | 0.20 | 41.46 | -1.12% |
| `siege_mortar` | artillery | I | 1 | 52 | 23.30 | 0.448 | 0.16 | 52.36 | -0.69% |
| `land_dreadnought` | crawler | III | 1 | 156 | 44.85 | 0.288 | 0.10 | 155.68 | +0.20% |

**The gate.** The widest ratio in the roster is `pilgrim_levy` at **1.36**, against a cap of
**1.60**. No type is over. **The other model.** The largest deviation from Lane A's `fairPts` is
`assault` at **-2.29%** — a base row, not one of this lane's — and every one of the eleven new
rows prices within **1.12%** of exactly fair.

**The two sanctioned band exceptions (Work item 2.1), both named here as required:**

- `land_dreadnought.armor` = **14**, against a base-nine maximum of **12** (`crawler`) — **+2**, the sanctioned ceiling.
- `marksmen.range` = **11**. The base-nine maximum is **18** (`artillery`), so this exception was **not needed** and is not claimed: marksmen sit inside the merged band. The reach it is priced for is the longest in the *infantry* column, where the base maximum is **9** (`gunners`/`mortars`).

### 11.3 Specialists

Ceiling: **25% of the anchor**, i.e. `SQUAD_TYPES.riflemen.pts × 0.25` = **25** pts. `SCALING.maxSpecialists`
is **2**, so a fully staffed squad carries at most **38** pts of staff.

| key | pts | % of anchor | mods | justification |
| --- | --- | --- | --- | --- |
| `medic` | 12 | 12.00% | morale +1, recoverPerTurn +1 | Two mods at the cheap end: he steadies the section and returns a figure a turn. |
| `signaler` | 10 | 10.00% | initiative +3 | The largest single mod in the table on the one axis that buys nothing defensively. |
| `commissar` | 14 | 14.00% | morale +1, moraleFloor +11, executionToll +1 | A floor, a step of morale and a toll paid in figures — priced above the medic for the floor. |
| `heavy_gunner` | 16 | 16.00% | aoeSuppress +1 | One mod, and the dearest of the five: area suppression is the only thing that makes a hex unusable. |
| `sapper` | 12 | 12.00% | buildSpeed +1 | One mod, and the only one that touches the works clock rather than the firefight. |
| `chaplain` | 13 | 13.00% | morale +1, moraleFloor +10 | The commissar's shape without the toll, and it holds a point lower — cheaper for both reasons. |
| `cartographer` | 13 | 13.00% | initiative +2, morale +1 | Two thirds of the signaler's initiative plus a step of morale, priced between them. |
| `forward_observer` | 18 | 18.00% | aoeSuppress +1, initiative +1 | The heavy gunner's suppression plus initiative: the dearest attachment that fires nothing itself. |
| `provost_sergeant` | 15 | 15.00% | moraleFloor +12, executionToll +2 | The highest floor in the table, bought with the highest toll in the table. |
| `relic_bearer` | 20 | 20.00% | morale +2, recoverPerTurn +1 | The largest morale mod and a recovery step, at the specialist ceiling — and the worst thing in the table to lose. |

### 11.4 Upgrade kits

Ceiling: **40% of the anchor** = **40** pts. A squad may carry at most
`UPGRADE_RULES.maxPerSquad` kits — the constant, not a digit typed here.

| key | appliesTo | tier | pts | % of anchor | mods | the tradeoff |
| --- | --- | --- | --- | --- | --- | --- |
| `armor_skirts` | `crawler`, `autocar_scouts`, `land_dreadnought` | I | 20 | 20.00% | armor +3, speed -1 | A course of plate for the last of the pace. |
| `storm_hoods` | `stormtroops`, `assault`, `sappers`, `pioneers`, `flame_team` | II:Cache | 14 | 14.00% | morale +1 | No stat given up — the price is the Cache fragment gate. |
| `wire_spades` | `riflemen`, `pioneers`, `sappers`, `digger_corps`, `ski_troops`, `pilgrim_levy`, `provost` | I | 12 | 12.00% | armor +1, speed -1 | Goes to ground anywhere; marches slower to everywhere. |
| `sapper_plate` | `sappers`, `pioneers`, `stormtroops`, `assault` | I | 20 | 20.00% | armor +2, speed -1 | Proof against the fragment that ends a breach; a slower man in the doorway. |
| `ski_conversions` | `ski_troops`, `autocar_scouts`, `crawler` | I | 16 | 16.00% | speed +2, ranged -2 | Winter stops being an argument; nothing aims well at that pace. |
| `mine_flails` | `crawler`, `autocar_scouts`, `land_dreadnought` | I | 14 | 14.00% | melee +2, speed -1 | Beats the ground the tracks will stand on, from in front of the tracks. |
| `marksman_pattern` | `marksmen`, `scouts`, `riflemen`, `provost` | II:Eng | 18 | 18.00% | range +2, ranged -1 | Reach for rate — a man who is aiming is not firing. Eng-gated. |
| `drum_magazines` | `assault`, `stormtroops`, `gunners`, `provost` | I | 18 | 18.00% | ranged +3, range -1 | Volume for reach. It is short work, and it wins rooms. |
| `gas_shells` | `mortars`, `siege_mortar`, `artillery` | II:Ciph | 22 | 22.00% | ranged +2, range -1 | A heavier bomb, so a shorter throw. Ciphered warrant. |
| `radio_pack` | `riflemen`, `stormtroops`, `marksmen`, `provost`, `autocar_scouts`, `siege_mortar` | II:Ciph | 16 | 16.00% | morale +1, speed -1 | Orders instead of rumour, at the pace of the heaviest thing in the section. |

**What a kit is worth in Lane A's model, measured.** Fitting a kit's `mods` to each squad in its
`appliesTo` and re-running `fairPts` gives the value the engine's own pricing model puts on it:

| key | Δ fair pts, min | Δ fair pts, max | Δ fair pts, mean |
| --- | --- | --- | --- |
| `armor_skirts` | +2.18 | +2.18 | +2.18 |
| `storm_hoods` | +2.18 | +2.91 | +2.76 |
| `wire_spades` | +5.60 | +14.74 | +9.52 |
| `sapper_plate` | +17.02 | +17.02 | +17.02 |
| `ski_conversions` | -8.93 | -0.88 | -4.00 |
| `mine_flails` | +0.00 | +0.00 | +0.00 |
| `marksman_pattern` | -1.12 | +1.43 | -0.02 |
| `drum_magazines` | +2.59 | +3.89 | +3.15 |
| `gas_shells` | +2.59 | +8.56 | +5.22 |
| `radio_pack` | -0.88 | +2.39 | +0.63 |

**Read that table with its limitation, which is real and is the reason kit prices are not solved from
it.** `combatValue`'s survivability term is `figures × (armor × armorWeight + morale × moraleWeight)`
— it is a **pool**, multiplied by figure count. On a single-figure vehicle stand that term is one
tenth of what the same armour is worth to a ten-figure section, so the model reads `armor_skirts`
(+3 armour on three vehicle stands) as worth +2.18 pts while it reads `sapper_plate`
(+2 armour on four infantry sections) as worth +17.02. Vehicle armour is not a pool — it is a
**threshold**, and the threshold lives in Lane I's `PEN_TABLE` / `ARMOUR_CLASSES`, which
`combatValue` cannot see. The two kits are therefore priced **equally**, which is already generous to
the vehicle kit by this model and correct by the damage model. 4 kits
(`ski_conversions`, `mine_flails`, `marksman_pattern`, `radio_pack`) price under a single point for the same reason:
they trade along mobility, reach and denial, which this model weights at a fraction of volume of
fire. They are reported here rather than repriced to numbers the damage model would contradict.

**The stack ceiling.** No stack of `UPGRADE_RULES.maxPerSquad` kits may reach the price of a second
stand of the type it is fitted to — a kit bill that exceeds a second body is a kit nobody fits.
Computed for every type in the roster:

| type | pts | dearest legal stack | kits | % of a second stand |
| --- | --- | --- | --- | --- |
| `riflemen` | 100 | 34 | `marksman_pattern` + `radio_pack` | 34.00% |
| `assault` | 90 | 38 | `sapper_plate` + `drum_magazines` | 42.22% |
| `gunners` | 85 | 18 | `drum_magazines` | 21.18% |
| `scouts` | 45 | 18 | `marksman_pattern` | 40.00% |
| `mortars` | 55 | 22 | `gas_shells` | 40.00% |
| `pioneers` | 100 | 34 | `sapper_plate` + `storm_hoods` | 34.00% |
| `crawler` | 100 | 36 | `armor_skirts` + `ski_conversions` | 36.00% |
| `artillery` | 100 | 22 | `gas_shells` | 22.00% |
| `fighter` | 70 | 0 | — | 0.00% |
| `stormtroops` | 105 | 38 | `sapper_plate` + `drum_magazines` | 36.19% |
| `sappers` | 106 | 34 | `sapper_plate` + `storm_hoods` | 32.08% |
| `ski_troops` | 85 | 28 | `ski_conversions` + `wire_spades` | 32.94% |
| `digger_corps` | 82 | 12 | `wire_spades` | 14.63% |
| `pilgrim_levy` | 89 | 12 | `wire_spades` | 13.48% |
| `provost` | 58 | 36 | `marksman_pattern` + `drum_magazines` | 62.07% |
| `marksmen` | 51 | 34 | `marksman_pattern` + `radio_pack` | 66.67% |
| `flame_team` | 59 | 14 | `storm_hoods` | 23.73% |
| `autocar_scouts` | 41 | 36 | `armor_skirts` + `ski_conversions` | 87.80% |
| `siege_mortar` | 52 | 38 | `gas_shells` + `radio_pack` | 73.08% |
| `land_dreadnought` | 156 | 34 | `armor_skirts` + `mine_flails` | 21.79% |

The tightest is `autocar_scouts` at **87.80%** — the cheapest stand in the roster with full access to
the vehicle kits. It passes, and it is the row to re-check first if any `pts` in this table moves.

### 11.5 The Design Bureau

A saved design compiles to a squad template plus kits: `compileDesign` now returns `mods` in the
`SquadType` vocabulary and an `effects[]` list alongside the legacy macro multipliers, so the
tactical layer can spend a doctrine instead of only the mass-battle resolver reading it.

| slot | options | of which carry squad `mods` |
| --- | --- | --- |
| formation | 6 | 2 |
| weapon | 6 | 3 |
| armor | 7 | 4 |
| support | 6 | 2 |

**The compiled envelope**, enumerated over all **1512** legal designs (6 × 6 × 7 × 6):

| compiled field | min | max |
| --- | --- | --- |
| skill | 0.000 | 4.000 |
| dmgOut | 0.767 | 1.518 |
| dmgIn | 0.540 | 1.458 |
| moraleIn | 0.578 | 1.150 |
| cost (total) | 0.000 | 13.000 |
| mods.figures | 0.000 | 0.000 |
| mods.melee | -2.000 | 3.000 |
| mods.ranged | -3.000 | 3.000 |
| mods.range | -1.000 | 2.000 |
| mods.armor | -3.000 | 4.000 |
| mods.speed | -3.000 | 2.000 |
| mods.morale | -1.000 | 2.000 |
| effects | 0.000 | 3.000 |

`mods.figures` is the one axis no design moves, and that is deliberate: figure count belongs to the
squad type and to `minFigures`/`maxFigures`, never to a doctrine template. Every other axis spans
both signs, so the Bureau can build a fast design as well as a slow one — before this lane it could
only ever slow a squad down.

### 11.6 Proposed macro support classes

`PROPOSED_UNIT_TYPES` in `src/lib/units.js` is priced against the five units that already exist, on
the only published relationship the macro ledger has between cost and points:

```
resourceCost(u) = u.cost.manpower + u.cost.steel + u.cost.fuel
density(u)      = u.points ÷ resourceCost(u)
```

Across `UNIT_TYPES` that runs **1.667** (`riflemen` — the cheap-mass floor) to **3.000** (`fighter` — the
ceiling). Every proposed row sits inside that band, and the test recomputes the band from
`UNIT_TYPES` rather than reading these numbers, so the band moves if the base five ever do.

| key | points | cost | density | atk/def/spd | deployAt | effects |
| --- | --- | --- | --- | --- | --- | --- |
| `draught_column` | 5 | 2 manpower + 1 fuel | 1.667 | 0/1/3 | barracks | `supplyRange` +2 |
| `siege_train` | 15 | 2 manpower + 4 steel + 1 fuel | 2.143 | 3/1/1 | foundry | `unit.artillery.attack` +1, `unit.artillery.speed` +1 |
| `bridging_train` | 7 | 1 manpower + 3 steel | 1.750 | 0/1/2 | foundry | `buildTurns` -1 |
| `signals_wagon` | 9 | 2 steel + 2 fuel | 2.250 | 1/1/3 | foundry | `losRange` +1, `initiative` +1 |
| `salvage_detachment` | 6 | 2 manpower + 1 steel | 2.000 | 0/1/2 | foundry | `digSpeed` +1, `fragmentYield` +1 |
| `hospital_train` | 11 | 3 manpower + 2 steel | 2.200 | 0/2/2 | barracks | `income.manpower` +1, `armyCap` +1 |
| `provost_column` | 8 | 3 manpower + 1 steel | 2.000 | 1/2/3 | fortifications | `moraleTest` +2 |

Two design intents `GEAR_LIBRARY §7` states have **no key in the §4 effect vocabulary** and were not
invented here — they are handed to the platform lane instead: the bridging train's river crossing
(`buildTurns` stands in for the span it throws) and the hospital train's `[II:Cache]` fragment gate
(`PROPOSED_UNIT_TYPES` mirrors `UNIT_TYPES`, which carries no tier field).

### 11.7 What the points buy — the eleven new types

**`stormtroops`** — 8 figures, 105 pts, ratio 0.90, fair 105.03 (-0.03%). Eight figures priced above ten: the melee and armour of an assault section with a rifle section's volume of fire behind it, and a Guard flag wherever they muster. The ratio sits below the anchor because the model pays for figures and they have two fewer than the line.

**`sappers`** — 8 figures, 106 pts, ratio 0.71, fair 106.28 (-0.26%). The dearest infantry row in the roster, and the shaped charge is why — a breaching pen no other section carries, three of the four works, and armour to survive standing in the doorway. It buys a verb list, not a firefight, so the ratio reads low.

**`ski_troops`** — 10 figures, 85 pts, ratio 1.05, fair 84.69 (+0.36%). The rifle section's figure count and volume at twice the pace, bought with the armour taken off them. It is the only new row above the anchor ratio, which is the correct place for a type whose whole argument is arriving.

**`digger_corps`** — 10 figures, 82 pts, ratio 0.85, fair 81.89 (+0.14%). Ten figures that lose an even exchange to anything holding a proper rifle. The points buy the two works verbs and the mass; the low ranged value is the price and is visible in the ratio.

**`pilgrim_levy`** — 14 figures, 89 pts, ratio 1.36, fair 89.21 (-0.23%). The widest ratio in the whole roster and deliberately so: fourteen bodies at the lowest per-figure value in the ledger, no verbs at all, the worst morale on the board and the only creed lock in the lane. Mass is the entire argument and the model prices mass.

**`provost`** — 6 figures, 58 pts, ratio 0.81, fair 58.23 (-0.39%). Six figures, the joint-highest morale in the infantry column, and nothing else. It is priced as the morale it holds rather than the fire it puts out, which is why its ratio sits mid-table on a very small stand.

**`marksmen`** — 5 figures, 51 pts, ratio 0.66, fair 50.62 (+0.75%). The longest reach the line regiments are issued, on five figures that erode fast. No band exception was needed: the merged roster's range maximum belongs to the siege piece and marksmen sit well inside it.

**`flame_team`** — 6 figures, 59 pts, ratio 0.85, fair 58.85 (+0.26%). The only Engineering-gated infantry row. Almost no reach, an incendiary type that ignores plate, and the shortest argument in the catalogue against a garrison that will not come out. The gate is a third of the price.

**`autocar_scouts`** — 1 figure, 41 pts, ratio 0.20, fair 41.46 (-1.12%). The cheapest stand in the roster and the fastest thing on wheels. One figure means one loss ends it, so the model's figure multiplier prices it as thin — that is the formula, not the car.

**`siege_mortar`** — 1 figure, 52 pts, ratio 0.16, fair 52.36 (-0.69%). Indirect reach at half the siege piece's price, and the ranging is what you are not paying for. A single-figure stand again, so the same thin reading applies.

**`land_dreadnought`** — 1 figure, 156 pts, ratio 0.10, fair 155.68 (+0.20%). The most expensive row in the roster by half again. The second band exception is here: armour 14, two over the crawler's 12 and sanctioned by 2.1. It is a relic Object — Lane G's project builds it, this row fights it, and both carry tier III.

### 11.8 Reported, not failed

**Work item 8.6 — types below ratio 0.55.** 7 of 20, printed to three places because the threshold cuts inside two: `mortars` 0.548, `crawler` 0.123, `artillery` 0.099, `fighter` 0.139, `autocar_scouts` 0.196, `siege_mortar` 0.159, `land_dreadnought` 0.102.

**All 6 single-figure stands in the roster are on that list, and 3 of them are Lane A's own base
rows.** That is the formula, not the roster: 11.1 multiplies the whole bracket by `t.figures`, so a
stand that is one figure by contract can never approach a ten-figure section however good it is.
The threshold is kept because the brief sets it and because it is a genuine smell for *infantry* —
the one infantry row it flags is `mortars` at 0.548, a base row. Lane A's `typeEfficiency`
has no figure multiplier and reads the whole roster between **0.977** and **1.016** of exactly fair.

**The total attachment bill is not gated by anything, and on the cheap stands it is large.**
`SCALING.maxSpecialists` staff at **38** pts plus `UPGRADE_RULES.maxPerSquad` kits reaches
**180.49%** of `autocar_scouts` and **146.15%** of `siege_mortar`. Nothing in this lane's contract caps the
combined bill, and nothing should be changed on that basis without Lane C, which owns what a squad
may actually field in a battle. Named here so it is a decision rather than an oversight.

**4 kits price under a single point in Lane A's model** (11.4). They are not free rides: each moves a
real stat, and each trades along an axis `combatValue` weights at a fraction of volume of fire. The
honest statement is that the model is a squad-type pricing instrument and not a kit-pricing one.

**The fourteen legacy Design Bureau options carry no squad `mods`.** `line`, `vanguard`, `skirmish`,
`column`, `rifles`, `trench_guns`, `mortars`, `standard`, `plated`, `scout`, `none`, `medics`,
`signals` and `commissars` predate the squad-mod convention and are referenced by live saves, so
this lane did not touch them. Translating their multipliers into `mods` is a platform-handoff item;
until it happens, `compileDesign(...).mods` describes only the options that declare it.

