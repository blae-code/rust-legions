# Rust Legions — Complete Ruleset (v1.x "The Vanilla Front" era)

Authoritative source: `base44/functions/gameEngine/entry.ts`. Frontend mirrors in `src/lib/`.
Any change here must be applied in both places and filed as a Patch dispatch.

> **Note:** this document describes the game **as currently implemented**. The full v2.x redesign
> (macro map, precursor-tech victory, settlements as minor polities) is still ahead — see `docs/VISION.md` —
> but a **vanilla-era slice of mobile fortress-bases has already shipped** (§18). These rules are fully authoritative.

## 1. Victory Conditions

- **Map control:** hold ≥ **60%** of land zones at the start of your turn (`MAP_CONTROL_PCT`).
- **Capital domination:** one faction owns every capital tile.
- **Last faction standing:** all others eliminated (a faction is eliminated when it owns zero tiles; its field armies are removed).
- **Campaign mode (solo only):** custom win condition — `survive` N turns, or `territory` ≥ N% land control.

## 2. Resources & Economy

Three typed resources: **Manpower**, **Steel**, **Fuel**. Starting treasury: 6 / 10 / 6 (± point-buy `startBonus`).

Terrain → base resource produced (amount = tile `baseIncome`, default 1):

| Terrain | Resource |
| --- | --- |
| plains, deltas, forest | Manpower |
| hills, highlands, mountains | Steel |
| marsh | Fuel |

Tile resource bonuses: `oil_field` +2 Fuel · `coal_depot` +1 Steel · `iron_foundry` +1 Steel and −1 Steel on crawler cost (min 1) for the owner.

Income is collected at the **start** of your turn. **Capital lost ⇒ zero income** until recaptured. Point-buy perks add flat income modifiers (floor 0).

## 3. Buildings

One build slot per land zone; **capitals have two**. One construction/upgrade starts per action; it completes (**level +1**) at the start of your **next** turn (`pending` flag). Max level 2 where upgradeable. Building requires the zone to be **in supply**.

| Building | Cost | Upgrade | Effect per level |
| --- | --- | --- | --- |
| Barracks | 4 Steel | 6 Steel | +1 Manpower income; deploys riflemen; supply hub; muster site |
| Foundry | 3 MP + 2 Fuel | 4 MP + 3 Fuel | +1 Steel income; deploys crawlers/artillery; coastal foundry deploys gunboats |
| Refinery | 4 Steel | 6 Steel | +2 Fuel income |
| Fortifications | 5 Steel | 7 Steel | +level defense bonus; supply hub |
| Airstrip | 3 Steel + 3 Fuel | — | deploys fighters |

Captured zones keep their completed buildings.

## 4. Units

| Unit | Points | Cost | Atk | Def | Domain | Deploys at |
| --- | --- | --- | --- | --- | --- | --- |
| Riflemen | 5 | 2 MP + 1 Steel | 1 | 2 | land | Barracks |
| Crawler | 12 | 3 Steel + 2 Fuel | 3 | 2 | land | Foundry |
| Gunboat | 10 | 3 Steel + 1 Fuel | 2 | 2 | sea | adjacent coastal Foundry |
| Fighter | 15 | 2 Steel + 3 Fuel | 3 | 1 | air | Airstrip |
| Artillery | 10 | 3 Steel + 1 MP | 1 | 1 | land | Foundry |

- **Army cap** (total points, garrisons + field armies): `max(90, Manpower income × 10)` ± point-buy `armyCap`.
- Casualty removal order: riflemen → crawler → gunboat → artillery → fighter.
- Purchasing requires the target zone to be in supply. Land units cannot enter sea; gunboats cannot enter land. Fighters can attack sea or land.

## 5. Garrison Combat (tile-vs-tile Attack action)

- Adjacent tiles only. Commit specific units from one tile.
- Each round every unit rolls **1d6**, hits if roll ≤ effective stat (stat clamped to 1–5). Rounds are simultaneous; repeats until one side is wiped or 25 rounds.
- Defender stat bonuses: fortification level + capital `capitalDefense` perk + terrain defense + fog (−1 to defender means fog *reduces* their bonus — see §8).
- Attacker flat modifiers: weather (rain/snow −1) + elevation slope (§7).
- Outcomes: **captured** (defender wiped, survivors garrison), **repelled** (attacker wiped), **retreated** (round cap — survivors return home).
- Enemy field armies standing on the target fold into its defense first.

## 6. Terrain & Elevation

Terrain defense bonus (garrison combat defender stat / mass-battle defender skill):
mountains **+2** · hills, highlands, forest, marsh, industrial **+1** · plains, deltas **0**.

Elevation tiers: mountains 3, highlands 2, hills 1, all else 0.
Attacking **uphill: attacker −1**; **downhill: attacker +1** (applies in both combat systems; also +1 to bombard hit number when firing downhill).

## 7. Supply & Logistics

- **Supply hubs:** capitals, and any zone with a completed Fortifications or Barracks.
- Supply flows **4 range** through contiguous friendly land (Dijkstra). Traversal cost: 1 per tile; mountains/marsh/highlands cost 2.
- **Out of supply effects:** field armies lose 1 company attrition at the start of their owner's turn (army disbands + general fate check if emptied); fight at **−2** battle skill; zones cut off cannot build, purchase, or reinforce.
- Besieged defenders (defending an out-of-supply zone) also fight at −2.

## 8. Weather

Rolled globally each full turn cycle. Weights: clear 35, rain 22, fog 18, storm 12, snow 13.

| Weather | Effects |
| --- | --- |
| Clear | none |
| Rain | attacker −1 (both combat systems); mountains/highlands/marsh **impassable** (move, attack, army march); bombard hits on ≤2 instead of ≤3 |
| Fog | defender −1; probe intel chances halved |
| Storm | fighters and gunboats cannot move or attack |
| Snow | crawlers cannot move or attack; armies fielding crawlers cannot march; attacker −1 |

## 9. Field Armies & Generals (Mass Combat)

### Mustering
- Requires a completed Barracks on an owned zone; draws riflemen/crawlers/fighters from the garrison (≥1 company).
- Led by a general: pick a free one or **recruit for 4 Manpower** (random stats `6 + d3 + d3` for strategy & leadership).
- Each faction starts with a **Marshal** (supreme commander): strategy/leadership 10 + doctrine bonus (aggressive +2 str; economic +2 ldr; defensive +1/+1). Marshals never die.
- Optional **Army Design** (§11) applied at muster for its resource surcharge.

### General traits → signature maneuvers
| Trait | Epithet | Signature |
| --- | --- | --- |
| butcher | the Butcher | Relentless Pursuit |
| fox | the Old Fox | Staged Ambush |
| bulwark | the Bulwark | Iron Wall |
| firebrand | the Firebrand | Inspiring Charge |

Doctrine → marshal trait: aggressive=butcher, economic=fox, defensive=bulwark.

### Progression
- **+1 strategy per 2 victories** (max 14).
- Non-supreme generals have a **50% death chance** when their army is destroyed.
- **Veterancy** (battles survived): Green 0 / Seasoned 1+ (+1) / Veteran 3+ (+2) / Elite 5+ (+3) battle skill.
- **Medals:** Iron Hammer (3-win streak) · Brass Star (win with ≤10% losses vs force of ≥3) · Defiant Standard (win vs foe ≥1.5× your start) · Marshal's Cross (5 career wins).

### Battle resolution (per round, both sides pick secret maneuvers)
```
battle skill = strategy + maneuver skill + strength mod + fort + terrain
             + veterancy + feint bonus + supply penalty + weather penalty
             + elevation + design skill
strength mod = clamp(round(log2(myPoints / foePoints) × 2), −4 .. +4)
contest: skill − 3d6, higher margin wins the round
```
- Loser losses: `round(total × min(0.07 + 0.06×marginDiff, 0.45) × winner.dmgOut × loser.dmgIn × design multipliers)`, min 1. Winner losses: `round(total × 0.05 × loser.dmgOut × winner.dmgIn × designs)`.
- Loser morale: `−(10 + 5×marginDiff) × winner.moraleOut × loser.moraleIn(design)`. Winner morale −4 (took losses) or −2. Ties: both lose 5% and −4 morale.
- Battle ends: annihilation, morale ≤ 0 (rout), or **15 rounds** (attacker withdraws). Attacker survivors retreat to staging zone; defender survivors garrison.
- Both sides start at 100 morale.

### Maneuvers
| Key | Skill | DmgOut | DmgIn | MoraleOut | Special |
| --- | --- | --- | --- | --- | --- |
| All-Out Attack | −2 | 1.6 | 1.5 | 1.3 | |
| Attack | 0 | 1.0 | 1.0 | 1.0 | |
| Hold the Line | +2 | 0.5 | 0.6 | 0.7 | |
| Flanking Maneuver | −1 | 1.3 | 0.8 | 1.5 | |
| Feint | +1 | 0.3 | 0.7 | 0.8 | +2 skill next round |
| Rally the Ranks | 0 | 0.2 | 0.9 | 0.5 | +20 own morale |
| Relentless Pursuit ★ | −1 | 1.5 | 1.2 | 1.9 | cooldown 4 |
| Staged Ambush ★ | +2 | 1.3 | 0.7 | 1.2 | cooldown 3 |
| Iron Wall ★ | +3 | 0.3 | 0.35 | 0.6 | cooldown 3 |
| Inspiring Charge ★ | 0 | 1.1 | 1.0 | 1.2 | +20 morale, cooldown 2 |

★ = signature, only usable by a general with the matching trait; cooldown ticks per round after use.

### Live vs auto defense
Defender plays interactively if their `lastSeen` heartbeat is < **60 seconds** old at battle creation *and* when orders resolve; otherwise AI picks maneuvers by doctrine table (signature when morale < 55 or 25% chance; rally at morale < 35, 50% chance).

### Marching & unopposed capture
Armies move 1 adjacent land zone per action. Entering an enemy/neutral zone with zero defenders = **unopposed capture** (no battle). Entering a defended zone folds the garrison + any enemy armies there into one defense force and opens a battle. Defending zone's garrison empties into the battle until resolved.

## 10. Artillery Bombardment

- Action: shell one adjacent enemy land zone from a zone with artillery. Cost **1 Fuel**; once per firing zone per turn.
- Each gun rolls 1d6, hits on ≤3 (≤2 in rain; +1 if firing downhill). Each hit destroys one company (casualty order). Never captures ground.

## 11. Army Designs (Design Bureau)

Persistent per-user templates (`ArmyDesign` entity), applied at muster for a surcharge. One option per slot:

| Slot | Option | Effect | Surcharge |
| --- | --- | --- | --- |
| Formation | Line | — | — |
| | Vanguard | dmgOut ×1.2, dmgIn ×1.15 | — |
| | Skirmish | dmgOut ×0.85, dmgIn ×0.85 | — |
| | Column | dmgOut ×0.95, moraleIn ×0.85 | — |
| Weapon | Rifles | — | — |
| | Trench Guns | dmgOut ×1.1 | 2 Steel |
| | Mortars | +1 skill | 3 Steel |
| Armor | Standard | — | — |
| | Plated | dmgIn ×0.85 | 3 Steel |
| | Scout | +1 skill, dmgIn ×1.1 | 1 Fuel |
| Support | None | — | — |
| | Medics | dmgIn ×0.9 | 2 MP |
| | Signals | +1 skill | 2 Fuel |
| | Commissars | moraleIn ×0.8 | 2 MP |

## 12. Reconnaissance Probe

- Cost **1 Fuel**; target must be adjacent to your zones or armies.
- Returns partial intel — each detail observed with independent probability (halved in fog): garrison counts 70%, fort level 70%, buildings 60%, army regiments 60%, army rank 70%, general trait/strategy 50%.

## 13. Faction Point-Buy Perks

Applied at game start via `compileMods` (see `src/lib/pointBuy.js` for costs/UI):
veteran_corps (+1 rifle atk) · industrial_base (+1 steel) · oil_concessions (+1 fuel) · deep_reserves (+1 MP) · conscription (rifle −1 MP) · mobilization_doctrine (+15 army cap) · war_chest (+4 start) · home_guard (+1 capital def) · trench_gear (+1 rifle def) · flame_projectors (crawler +1 atk, +1 fuel cost) · heavy_plating (+1 crawler def) · naval_rams (+1 gunboat atk) · drop_tanks (+1 fighter def) — and drawbacks: war_weary (−15 cap) · fuel_shortage (−1 fuel) · rusting_arsenal (crawler +1 steel) · green_recruits (−1 rifle def) · depleted_stockpiles (−4 start) · brittle_industry (−1 steel) · pariah_state (−10 NPC disposition).

Faction traits from the lifepath wizard add `attack_bonus` / `defense_bonus` / `unit_discount` / `income_flat` effects (see `synthesizeFaction`).

## 14. NPC AI (per turn)

Doctrines: **aggressive**, **economic**, **defensive**.
- **Build** (one per turn, priority): aggressive foundry→barracks→airstrip; economic refinery→foundry→barracks; defensive fortifications→barracks→foundry. Sites: capital → frontline → anywhere.
- **Purchase:** crawlers at foundries (not defensive), then riflemen at barracks (defensive stacks the capital), until cap/treasury exhausted.
- **Attack:** up to 3 attacks; strength-ratio thresholds 0.9 / 1.5 / 2.0 (aggr/econ/def); target scoring = ratio + disposition weight + income/capital/bonus/building value. Weather-aware unit commitment.
- NPC dispositions toward players are seeded from the player faction's lifepath (`npcDispositions`) ± pariah_state.

## 15. Game Setup

- Lobby → all human slots claimed → host starts.
- Capitals: map capitals, topped up by highest-income land tiles if fewer than faction count. Capital starts with 4 riflemen + 2 crawlers + level-1 Barracks; each adjacent unowned land tile starts owned with 2 riflemen. All other land tiles are neutral with 1 rifleman garrison.
- Turn order = slot order; weather starts clear; snapshots of control/production recorded per full turn cycle (`statHistory`, cap 200).

## 16. Fog of War & Intel

- Visible: your tiles + adjacent, your armies' tiles + adjacent. Everything else returns position/sea-flag only.
- Combat log truncated to last 30 entries during play; full log on completion (feeds the War Chronicle).
- Battle archives: last **15** battles' round-by-round dispatch records, visible only to participants.

## 17. Diplomacy — The Envoy Desk (v1.1.0 "The Envoy Accords")

- **Proposals** (in-turn action `proposeDiplomacy`; one envoy per target faction per turn): `truce` (ceasefire, **5 turns**), `nap` (non-aggression pact, **10 turns**), `trade` (resource exchange).
- Accords forbid attack, army engagement, and bombardment between the parties; lapse is announced in the combat log and hostilities may resume.
- **Trade valuation:** manpower ×1, steel ×1.5, fuel ×1.5.
- **NPC acceptance** (driven by disposition `d`, −100…+100): truce if `d ≥ −15`; NAP if `d ≥ 10`; trade if your offer value ≥ 1.15× what you ask and the NPC can cover it.
- **Disposition shifts:** accord signed +10 · trade concluded +6 · envoy refused −3 · attacked −8 · bombarded −5. NPC dispositions are seeded from the player's lifepath `npcDispositions` ± `pariah_state`.
- Human targets receive pending offers (`respondDiplomacy` accept/decline, usable off-turn). Trade voids if either side can no longer cover it.
- Accords ledger + last 8 trades are exposed in `getState.diplomacy`.

## 18. Mobile Fortress-Bases (vanilla-era slice)

Each faction owns exactly one fortress-base, spawned on its capital at game start (legacy games get one lazily). The hull itself grants **+1 defense** to its zone; it is a **prime supply hub** wherever it stands on friendly ground.

- **Module bays** (one module per bay; install/swap via `installModule`, any number per turn while it's your turn):

| Bay | Module | Cost | Effect |
| --- | --- | --- | --- |
| Armor | Riveted Plating | 5 St | +2 zone defense |
| | Bulwark Hull | 9 St + 2 F | +4 zone defense |
| | Citadel Plate ★ | 12 St + 3 F | +6 zone defense |
| Engine | Crawler Drives | 4 St + 3 F | move 1 zone/turn (open ground) |
| | Leviathan Turbines | 6 St + 6 F | move 1 zone/turn, crosses rough terrain |
| | Juggernaut Reactors ★ | 8 St + 8 F | all-terrain, march costs 1 Fuel instead of 2 |
| Industry | Salvage Refinery | 4 St + 2 F | +2 Fuel income |
| | Arc Smelters | 6 St + 2 MP | +2 Steel income |
| | Habitat Decks | 5 St | +2 Manpower income |
| | Munitions Works ★ | 8 St + 3 MP | +1 of every resource |

★ = prototype — must first be certified in the State Armory (§20). Industry income applies only while the base stands on the owner's ground.

- **Movement** (`moveBase`): requires an engine module; 1 adjacent friendly zone per turn; costs **2 Fuel** (1 with Juggernaut Reactors); rough terrain (mountains/highlands/marsh) needs an all-terrain engine; blocked entirely in snow and while a battle is active.
- **Loss:** if the base's zone is captured by another faction, the base is **wrecked permanently** (`baseLost`) — it is never rebuilt. Its defense bonus and the module snapshot appear in the combat record.

## 19. Doctrine Research (Directorate of War Sciences)

- Each human faction sets one **research focus**; focus may be set/changed **at any time, including off-turn** (`concurrentPlay.setResearchFocus`).
- **1 research point accrues per completed full turn cycle** while a focus is set. On completion the tech's mods merge permanently into the slot's compiled mods and the focus clears.
- Three branches, three tiers each (linear prerequisites within a branch):

| Branch | Tier 1 (3 pts) | Tier 2 (4 pts) | Tier 3 (6 pts) |
| --- | --- | --- | --- |
| Armament | Standardized Calibers (+1 rifle atk) | Hardened Plate (+1 crawler def) | Combined Arms (+1 crawler & fighter atk) |
| Industry | Rationalized Foundries (+1 Steel) | Synthetic Fuel (+1 Fuel) | Total Mobilization (+1 MP, +20 army cap) |
| Logistics | Field Kitchens (+10 army cap) | Motorized Supply (+1 supply range) | General Staff Academy (+1 capital def, +1 rifle def) |

NPCs do not research.

## 20. The State Armory (off-turn unlocks)

One-time treasury purchases via `concurrentPlay.unlockItem`, usable **at any time** (concurrent play — never touches contested state):

- **Fortress prototypes** (certify a ★ module for the Refit Yard): Citadel Plate 6 St + 2 MP · Juggernaut Reactors 5 St + 4 F · Munitions Works 6 St + 3 F. Certification is separate from (and cheaper than) the later install cost.
- **Ideology decrees** (bonus applies immediately via slot mods): War Bonds 3 MP + 2 F (+1 Steel income) · Fuel Rationing Act 4 St + 2 MP (+1 Fuel income) · Universal Levy 3 St + 3 MP (+15 army cap) · Hearth & Bulwark 5 St + 2 MP (+1 capital def, +1 rifle def).

## 21. Command Vehicles & Refit Logistics

Every general fights from a **command vehicle** themed to their trait (Butcher: "Mauler" Assault Crawler +10% dmg out · Fox: "Vixen" Scout Autocar +1 skill · Bulwark: "Redoubt" Armored Wagon −10% dmg in · Firebrand: "Clarion" Signal Wagon −15% morale dmg in · Supreme: "Paramount" Command Land-Train +1 skill, −10% morale dmg in). Vehicle stats hook into mass-combat skill, damage and morale math.

**Refit bays** (`gameEngine.refitVehicle`) — more limited than the fortress-base's three bays:

- **Equipment bay** (any vehicle, bolsters the attending army): Quartermaster Rig (−5% dmg in) · Observation Balloon (+1 skill) · Field Hospital Trailer (−10% morale dmg in).
- **Weapon bay** (trait-locked; the supreme land-train mounts any): Breaker Ram (Butcher, +10% dmg out) · Whisper Battery (Fox, +1 skill) · Bastion Casemate (Bulwark, −10% dmg in) · Thunder Klaxon (Firebrand, +15% morale dmg dealt).

**Refit logistics** (applies to command vehicles AND fortress-base modules) — the larger the unit, the scarcer its refit sites:

- **Command vehicles** refit instantly at any friendly zone with a Barracks or Foundry, or alongside the fortress-base. The vehicle is located with its army, or at the base when the general is unassigned.
- **Fortress-bases** need heavy **gantry cranes**: a capital or a **level-2 Foundry** only.
- **Anywhere in supply**: refits arrive by convoy at the start of the owner's next turn, at **25% off** the module cost (economical but slow). One convoy per vehicle bay at a time.
- **Cut off from supply with no site in reach**: no refits possible.
## 22. Macro Operations (experimental world model — slices M1–M3a)

A new game type beside the hex front (`worldModel: "macro"`, chosen at operation
setup). The full design contract is `docs/MACRO_ENGINE.md`; the hex rules above
are untouched and remain authoritative for hex games.

- **World:** the campaign fights across the whole theater world's node-and-route
  graph (the same generated worlds as the War Table, built server-side at
  creation and stored on the game). Geography is public; control flags and
  foreign columns are visible only within **one route hop** of your holdings,
  base and columns.
- **Time:** one full turn cycle = one day. At dawn every marching column (all
  factions) advances one day; weather, research, income and accords keep their
  existing daily cadence.
- **Columns** (the macro armies): levied at a controlled **city** or the
  fortress-base anchor (`macroMusterColumn` — standard unit costs, army-cap
  check, general commissioning as in §8). Pace = slowest ground element
  (riflemen 20 · crawlers 16 · artillery 12 mi/day; the air wing never slows a
  column) × route grade (highway ×1.25 · road ×1.0 · track ×0.75 · trail ×0.5)
  × weather (rain/snow: wheel-bearing columns ×0.6, foot-only ×0.85).
- **Orders:** `macroPlotMarch` Dijkstra-validates a path (mid-leg redirects take
  effect from the node ahead); `macroHalt` stands a column down at the next node;
  `macroDisbandColumn` dissolves it at a controlled settlement.
- **Control:** arriving at an undefended node flips it — unless its owner is
  protected by a signed accord (truces protect territory as well as troops).
  Contact at the node ahead (foreign columns, or a foreign fortress-base
  anchor) **halts** the column short of it, awaiting orders.
- **Assaults (M2):** `macroEngage` — a halted column assaults an adjacent
  node held by foreign columns, opening a **mass battle** through the standard
  engine (§9–§10: maneuvers, morale, signatures, veterancy, command vehicles;
  weather applies; no terrain/fortification bonuses until the garrison layer
  lands in M3). All defending columns fold into one force under their best
  general, exactly like hex zone defense. Attacker wins: survivors advance,
  the node flips, defending generals face their fate. Defender wins: the
  defense reforms as a single column; attacker survivors hold at the staging
  node (`retreated`) or the column is destroyed (`repelled`). Battle honors,
  medals, veterancy and the dispatch archive all apply. Fortress-base anchor
  nodes cannot be assaulted (boarding actions arrive in M5) and block foreign
  movement. Accords forbid engagement; NPC dispositions drop when attacked.
- **Income (daily):** city 2 St + 2 MP · town 2 MP · depot 2 F · ruin 1 St ·
  crossroads nothing.
- **Setup:** spawn cities spread by greedy max-min march-distance; each faction
  starts with its spawn city, the fortress-base anchored there, and a 1st Column
  escort (2 riflemen, 1 crawler).
- **Victory:** control **60% of settlements** (crossroads excluded — the same
  threshold as hex map control). Further conditions (base loss, relics) arrive
  with slices M5–M6.
- **NPCs:** doctrine-flavored greedy expansion — idle columns plot to the
  nearest unclaimed settlement (economic doctrine weighs yields), and a second
  column is levied when the treasury allows.
- **Supply (M3):** each faction projects a supply envelope — ~220 effective
  miles (≈3 road-days) from the **fortress-base** and every controlled **fuel
  depot**, flowing through routes whose far node the faction controls or that
  stand neutral. A column outside the envelope marches at **half rate** and
  loses one company to privation every **2 days** cut off (air wing first, then
  guns, armor, rifles). Depots are therefore strategic ground — they push the
  envelope forward ahead of the base.
- **Fortress-base movement (M3):** `macroMoveBase` rolls the base along the
  graph at a slow **10 mi/day** (the slowest thing on the map). It re-anchors
  supply as it goes and flips settlements it rolls through; it cannot enter
  contested ground (foreign columns or a foreign base). Boarding assaults on an
  anchored base remain reserved for M5.
