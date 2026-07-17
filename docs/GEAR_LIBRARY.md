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
