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
## 24. Doctrine, Armory & Relic Projects [PROPOSED — awaiting platform wiring]

> Every number in this section is read from `base44/shared/catalog.ts`; nothing here is live until the
> platform lane wires it. Extends §19 (Doctrine Research) and §20 (The State Armory). Design record and
> cost-curve reasoning: `docs/TECH_DESIGN.md` §8–§12.

**Branches and tiers.** Five branches — Armament, Industry, Logistics, **Signals**, **Reclamation** —
each with four tiers and exactly one tier-4 capstone. Research points accrue at **1 per completed full
round** as today. Cost is fixed by tier and identical in every branch: **tier 1 = 3 RP · tier 2 = 4 RP ·
tier 3 = 6 RP · tier 4 = 9 RP**. The cheapest line from a root to a capstone — one node per tier — is
**22 RP**, but no capstone is actually reachable for that: each names a prerequisite in another branch,
so the cheapest first capstone bills **25 RP**. Clearing every branch is **138 RP**, which is longer
than a campaign — the tree is a commitment, not a checklist.

- **Signals** buys line of sight, initiative and steadier morale tests. Capstone: **the Intercept
  Bureau**.
- **Reclamation** buys dig speed, fragment yield and shorter relic works. Capstone: **the Pattern Book**.

**Prerequisites.** A doctrine names one prerequisite, several, or none. Every named prerequisite sits at
a **strictly lower tier**, which is what makes a cycle impossible. Every tier-4 capstone names **at least
two**, of which **at least one belongs to a different branch** — no branch can be climbed alone.

**Creed locks.** Four doctrines are held by a single Departure and are not offered to any other house:
the Vigil Watch (Recall) · Bonded Manifests (Finished Ledger) · Sealing Protocols (Flight) · the
Stripping Yards (Discarding). No branch-and-tier cell contains *only* locked doctrines, so no house is
ever offered an empty shelf. No capstone is reachable only through locked ground either: the check runs
over a capstone's whole transitive prerequisite closure, not its direct prerequisites, because a lock two
steps down closes the capstone just as completely.

**The State Armory: three kinds.** `module` certifies a fortress-bay prototype (its bonus applies once the
module is fitted). `decree` is an act of the Assembly and applies the moment it is enacted.
`relic_project` is the Armory face of a Tier-III work.

**Decrees move an ideology axis.** Every decree — including the four shipped in §20 — carries an **axis**
(Authority, Economy, Creed, Mobilization) and a **direction** (−1 or +1) toward the poles of
`docs/VISION.md` §6.1: Authority −1 Council Rule / +1 Iron Autocracy · Economy −1 War Communalism /
+1 Charter Syndicates · Creed −1 Reclaimer / +1 Restorationist · Mobilization −1 Citizen Levy /
+1 Professional Corps. Enacting a decree applies its effects and shifts that axis one step. **All eight
poles are purchasable.** Four decrees are creed-locked (one per Departure), and every pole keeps at least
one decree that is not — an axis no house can move is not an axis.

A decree is a **trade, not a pure gain**: the Emergency Powers Act buys initiative and costs the ability
to rally; the Standing Corps Act hardens the line and shrinks the army cap; the Reliquary Act speeds the
digging and stalls the foundries.

**Tier gates and fragments.** Every Armory row and every relic project carries a tier:

| Tier | Costs | Notes |
| --- | --- | --- |
| `I` | Manpower / Steel / Fuel only | No fragments, ever |
| `II:Cache` · `II:Eng` · `II:Ciph` · `II:Wake` | conventional resources **plus** its own class of fragment | Exactly one class, at 1 or more |
| `III` | conventional resources plus **two or more** fragment classes | Relic projects only |

Every cost value is a positive integer. An affordability check that reads only Manpower/Steel/Fuel will
report a Tier-II item as purchasable and fail at the server; fragments are part of the price.

**Relic Projects.** Four, all Tier `III`, each keyed to an intact Object of its class held in the keel's
Laboratory:

| Project | Object class | Build days | Held by |
| --- | --- | --- | --- |
| The Land-Dreadnought | Engine | 24 | any house |
| The Lance Carriage | Wake | 18 | any house |
| The Beacon | Cipher | 40 | the Recall only |
| The New Ignition | Cache | 40 | the Discarding only |

Each additionally requires **two or more completed doctrines, at least one of them in Reclamation**, and
none is gated behind a creed-locked doctrine. Construction runs on the **map's clock** in whole days, is
visible to enemy probes and intercepts while it runs, and **dies with the keel** — a relic project is a
race that can be interrupted, not a quiet unlock. The Beacon and the New Ignition are the two creed forks
of the Exodus Works and cost the same forty days.

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

## 26. The Tactical Engagement [PROPOSED — awaiting platform wiring]

*Drafted by the tactical-engine lane. Code: `base44/shared/tacticalEngine.ts`. Field: `base44/shared/
tacticalField.ts` (§ Lane B). Content: `base44/shared/tactical.ts` (squad types, actions, staff,
deployables, morale). Damage: §23's Universal Damage Model, and nothing else. Recorded payload:
`test/fixtures/tactical-state.json`. The platform wiring this section waits on is C1–C9 in
`docs/prompts/PLATFORM_HANDOFF.md`.*

**A set-piece engagement is fought as squads on a 15×11 field, and it is the same fight for both
commanders.** The attacking commander elects it in place of quick resolution (§9); both staffs file an
order of battle; the sections then activate one at a time in initiative order until one side has nothing
left on the ground or the clock runs out.

**The board is generated once and never repainted.** 165 hexes from the macro node's own kind, the live
weather and the defender's fortification level. The two deploy strips are the three columns at either
end and are disjoint. A board that was regenerated mid-battle would move the woods out from under
sections already standing in them, so it is generated at the moment the engagement is elected, stored
with the battle, and read from there for the rest of it.

### 26.1 The order of battle

| | |
| --- | --- |
| Sections a side | **1 minimum, 24 maximum** |
| Staff attachments per section | **2 maximum** |
| Figures per section | the type's own band (a rifle section musters **4–12**, default **10**) |
| Cost | the side's figure pool, by regiment; a regiment is **10 figures** of the line and **1** of crawlers, guns or aeroplanes |

A filing is **all or nothing**. Every row is validated — the type exists, the figure count is inside the
band, the staff return is legal, the whole submission is inside the pool — and then every section is
seated in one movement. A filing the deployment ground cannot hold whole is refused with nothing seated
and no section number spent, so the commander may re-file against exactly the ground he was refused on.

A row may name the hex it wants (`at`). It is honoured when the hex is inside that side's own strip,
unblocked, and not already claimed; **every row that asked for a legal hex is seated before any row is
seated automatically**, so a preferred hex does not depend on the order the rows happened to arrive in.
Anything unseated fills the strip from the front. The two strips fill as 180° rotations of one another —
an axial column is a diagonal, so mirroring one coordinate is not a fair reflection of the hex metric,
and filling both strips the same way hands one side the sheltered corner of its parallelogram.

### 26.2 The clock and the queue

| | |
| --- | --- |
| Rounds | **20** (`ROUND_LIMIT`); the engagement is called at the end of the twentieth |
| Activations in a full round | **48** (24 sections a side, each activating once) |
| Order | initiative descending, rebuilt every round |
| Initiative | `speed × 2 + 4`, plus a signaler's **+3** |
| Ties | broken by a seeded draw, one per stand per round |

The tie-break is a draw and not the section number on purpose: on a board of thirty-odd sections most of
them tie, and breaking ties on the identifier hands every one of those ties to the same side.

**End of round, in this order:** suppression lifts by one, smoke thins, works under construction advance
and finish, medics recover, the round's casualty memory is cleared, and the queue is rebuilt — because a
section that lost figures may have lost the initiative with them.

### 26.3 Orders

An activation spends one order. A section may march **and** fire in the same activation unless the order
stands fast (`hold`, `rally`, `entrench`, `suppress`, both barrages, and every `build_`). An activation
spent only closing the ground is the **march** order.

- **Movement** costs the A\* path over the tiles' own move cost, and must not exceed the section's
  speed. Ground off the field, ground that will not take a section, ground already held, and — for a
  hull — an infantry-only work are each refused in their own words, and a refused order costs the
  section nothing and leaves it exactly where it stood.
- **Reach and sight.** The target must be inside the order's own range (or the section's, if the order
  does not override it) and there must be a line of sight to it — **except** for indirect fire
  (`mortar_barrage`, `bombard`), which needs the range and not the sight.
- **Melee** (`assault`, `overrun`) uses the section's melee against an adjacent stand; everything else
  uses its ranged value.
- **Area fire** falls on a **hex** and strikes every stand inside the radius, friendly stands included,
  each resolved against its own armour. Effect falls off by the order's falloff per hex from the impact,
  and **the shell weight is divided among the stands it finds** — one section under a grenade takes the
  whole of it, eight sections under a bombardment share it. An order that struck every stand for its
  full effect would multiply itself by its own area.
- **Smoke** blocks sight across the order's **own radius** — the impact hex and the ring around it,
  **7 hexes** — for two rounds, then lifts, restoring each hex's own state. The radius is the order's,
  not a constant: it is read off the same `aoe` row that decides where the order may be aimed.

### 26.4 Armour, and the plate a shot lands on

**Every damaging hit in this engagement — small arms, melee, splash, artillery, aircraft — resolves
through §23's damage model and through nothing else.** There is no armour arithmetic in the engine: it
selects *which* armour class the hit is asked about and hands the question over.

- A **mechanized** stand answers on the plate the shot came in on. Each hull declares front, side, rear
  and top; the rear is the arc directly behind the way the stand is pointed. A stand's facing is set at
  deployment (toward the enemy line) and updated every time it moves (to the way it walked) or fires (to
  what it fired at).
- **Indirect and air attacks land on the top plate** whatever the hull is pointed at.
- A stand in a **work** answers on the work's class instead of its own — but only if its own class is
  `none`, `soft` or `light`. **A work re-classes a man; it never re-classes a hull.**
- Everything else answers on its type's declared class.

A hit that §23 resolves to **zero takes no figures, ever** — the remainder is retained on the stand
rather than rounded, so a light weapon accumulates exactly nothing against heavy plate however long it
fires. **It still suppresses and still forces a morale test**: a rifle section cannot mark a heavy
crawler and can pin its crew.

### 26.5 Figures

A resolved effect becomes whole figures by dividing it by what one figure of the target absorbs:

> **figures = ⌊ (retained wounds + effect × swing) ÷ ( (3 + 2 × armor) × (1 + 0.35 × cover) × guard ) ⌋**

| Term | Value |
| --- | --- |
| Base absorption | **3**, plus **2** per point of the stand's `armor` |
| A rifle section | 2 armor → **7** per figure |
| A diesel crawler | 12 armor → **27** per figure |
| Cover | **+35 %** per point, terrain plus the work standing on it — cover 2 is **+70 %** |
| Guard | the order the stand last took: `entrench` **1.9**, `hold` **1.45**, `rally` **1.1**, ordinary **1.0**, `assault` **0.9**, `strafe` **0.85** |
| Swing | one seeded draw, **×0.85 to ×1.15** |
| Remainder | retained on the stand, never rounded away |

A rifle section that has entrenched itself in a trench therefore absorbs **7 × 1.70 × 1.9 = 22.61** per
figure — better than three times what the same section absorbs in the open, which is the whole argument
for digging. Casualties remove whole figures; a section at zero leaves the field and the queue.

### 26.6 Suppression

Suppression is measured in whole rounds and is **⌊ the order's own weight + ½ ⌋**, plus the work the
firer stands in. A hit that resolved to nothing adds **+0.5**, which is what lets a section pin what it
cannot hurt.

| Order | Weight | Rounds pinned |
| --- | --- | --- |
| `assault`, `smoke`, `fire` | 0 – 0.25 | **0** — aimed fire does not pin |
| `fire` on a stand it cannot mark | 0.25 + 0.5 | **1** |
| `grenade`, `strafe` | 0.5 | **1** |
| `mortar_barrage` | 0.75 | **1** |
| `bombard`, `overrun` | 1.0 | **1** |
| `suppress` | 1.5 | **2** |

A pinned stand fires at **65 %** and loses one round of suppression each end of round. Suppression takes
the longer of what a stand carries and what a new order buys, so re-pinning a pinned section buys
nothing.

**The suppression ring.** A heavy gunner's attachment adds **1 hex to the suppress radius, and never to
the damage radius**. Stands inside the ring that the order did not strike are pinned and morale-tested
and **lose no figures** — the belt goes over their heads. **The firer is never inside its own ring**:
for point fire the ring is measured from the target's hex, so a section firing on the stand in the next
hex would otherwise pin itself, and could break and run on its own order. For an area order the ring begins where the
burst stops (radius + 1); for point fire it is measured one hex out from the hex the order fell on.
Friendly stands are caught in it, for the same reason they are caught under a burst.

### 26.7 Morale

A morale test is **3d6 roll-under** the section's derived morale, adjusted:

| | |
| --- | --- |
| Automatic pass / automatic failure | roll **≤ 4** / roll **≥ 17** |
| Per figure lost this round | **−1** |
| Flanked (two or more enemies adjacent) | **−2** |
| Already suppressed | **−2** |
| A friendly section destroyed alongside | **−1** |
| Under fire from something unseen | **−1** |
| In cover / in a work / entrenched | **+1 / +1 / +2** |
| A signaler or commissar in the next hex | **+1** |
| Rallying | **+2** |
| The order's own shock | the order's `moraleHit` (`fire` 1, `grenade` 2, `assault`, `mortar_barrage` and `strafe` 3, `bombard` and `suppress` 4, `overrun` 5) |

Failing pins the section for a round. **Failing by 4 or more breaks it.** A broken section runs for its
own board edge on each activation, never fires, and may not be given an attacking order; it tests to
rally at **+2** each activation, and a section that rallies stands where it is, suppressed.

**The commissar.** A section carrying a Ministry Commissar does not break: the rout becomes
**1 figure removed** and the section stands, suppressed. If that figure was its last, the section is gone — the
commissar closes the ledger on an empty section as readily as on a full one.

**The medic.** A section carrying a Field Medic with no enemy adjacent returns **1 figure per round**,
never above the figures it mustered with.

### 26.8 Works

| Work | Cover | Blocks sight | Move cost | Turns to raise | Armour class | Hulls |
| --- | --- | --- | --- | --- | --- | --- |
| Foxholes | 1 | no | +0 | 1 | light | infantry only |
| Trench Line | 2 | yes | +1 | 1 | light | infantry only |
| Bunker | 4 | yes | +1 | 2 | fortified | any |
| Emplacement | 2 | no | +0 | 1 | light | any |

A section with the order breaks ground on the hex it stands on and finishes at the end of the turn count
(a Sapper takes one turn off, never below one). The work is written into the ground on completion and
belongs to the ground, not to the section: whoever stands in it afterwards gets its cover, its armour
class and its modifiers. An Emplacement pins the piece in it at **speed 0** and lengthens its reach —
which is the trade the order is for. Ground that already carries a work cannot be dug twice.

### 26.9 The staff

A side may hand the engagement to its own staff, and every absent commander's side is fought by it. The
staff is deterministic — the same board and the same seed give the same battle, every time.

**It values an order by the enemy output the order denies for the rest of the engagement**, which has
exactly two terms and no invented exchange rate between them: the figures it expects to remove, times
what a figure of that stand is worth, **times the rounds left on the clock**; plus the additional rounds
of pinning it buys, times the 35 % of output a pinned stand loses, times the stands the suppression ring
reaches. A scorer that read the order's raw damage instead would never issue suppressing fire — it is
priced at half of aimed fire precisely because its value is the pin — and would rate a volley at a heavy
hull exactly as it rated the same volley at the infantry beside it.

Beyond that it prefers the reachable hex with the most cover that keeps the shot open, puts an area
order on a hex holding two or more enemies rather than firing at one, sets an unengaged section with a
Sapper to work, never drops a burst on its own people, and never gives a broken section anything but the
attempt to rally.

Every order it issues names **both** a hex and a stand — the aim point, and a stand under the burst the
same order could legally have been fired at directly. That is not two orders: it is one order in the two
forms the platform can carry, so a caller that reads only the stand still receives a legal order rather
than a refusal.

### 26.10 The result

The engagement ends when one side has nothing on the field, or at the end of round 20. Survivors fold
back into regiments **rounding down**, so a battle never creates a company. **Mutual annihilation is a
defender's win** — the attacker had to take the ground, and an empty field was not taken. When the clock
decides it, the side holding more of the field wins, measured as the sum over its surviving sections of
melee + ranged + figures × armor. **An exact tie is the defender's**, for the same reason mutual
annihilation is: the attacker is the side that had to take the ground.

> **Open for the platform lane.** The engine never sets `status: 'done'`; `gameEngine` does, after
> reading the result once. Figures still in the depot — mustered but never carved into a section — are
> not folded back into the surviving regiments. That is the shipped behaviour, and whether a commander
> should get his unfiled reserves back is a decision this section does not make.
## 27. Squads, Specialists & Upgrade Kits [PROPOSED — awaiting platform wiring]

Every number in this section is read from `base44/shared/tactical.ts`; nothing here is live until the
platform lane wires it.

The tactical board fields **squads**, not the macro unit stack. A squad is a squad *type* at a figure
count, optionally carrying **specialists** (named men attached to it) and **upgrade kits** (wargear
drawn against its establishment). `deriveSquad(squad)` is the only thing that combines the three; the
tables below are its inputs and nothing computes them here.

### 26.1 The squad roster

`from` names the macro regiment a squad is raised out of, and `FIGURES_PER_COMPANY` is keyed by that
**regiment**, never by squad type — a type's `figures` is its own default squad size and may differ
freely from its source regiment's company size, which is why an eight-figure or five-figure section is
legal. `toRegiments` converts through the regiment's company size and rounds **down**, so a battle
never creates a company. `pts` is the cost of the **squad**, not of a figure: the anchor is the rifle
section at its default figure count.

| `key` | Label | `from` | Tier | Figures | `pts` |
| --- | --- | --- | --- | --- | --- |
| `riflemen` | Rifle Section | riflemen | I | 10 | 100 |
| `assault` | Assault Section | riflemen | I | 8 | 90 |
| `gunners` | Machine-Gun Crew | riflemen | I | 6 | 85 |
| `scouts` | Scout Section | riflemen | I | 5 | 45 |
| `mortars` | Mortar Team | riflemen | I | 4 | 55 |
| `pioneers` | Pioneer Section | riflemen | I | 8 | 100 |
| `crawler` | Diesel Crawler | crawler | I | 1 | 100 |
| `artillery` | Siege Piece | artillery | I | 1 | 100 |
| `fighter` | Prop Fighter | fighter | I | 1 | 70 |
| `stormtroops` | Stormtroops | riflemen | I | 8 | 105 |
| `sappers` | Sappers | riflemen | I | 8 | 106 |
| `ski_troops` | Ski Troops | riflemen | I | 10 | 85 |
| `digger_corps` | Digger Corps | riflemen | I | 10 | 82 |
| `pilgrim_levy` | Pilgrim Levy | riflemen | I | 14 | 89 |
| `provost` | Provost Section | riflemen | I | 6 | 58 |
| `marksmen` | Marksmen | riflemen | I | 5 | 51 |
| `flame_team` | Flame Team | riflemen | II:Eng | 6 | 59 |
| `autocar_scouts` | Autocar Scouts | crawler | I | 1 | 41 |
| `siege_mortar` | Siege Mortar | artillery | I | 1 | 52 |
| `land_dreadnought` | Land Dreadnought | crawler | III | 1 | 156 |

Every row raised from `crawler`, `artillery` or `fighter` fields at one figure, and every row raised
from `riflemen` fields at more than one. A single-figure stand is a `SquadType` row and nothing more —
a stand's chassis, powerplant, armour package, suspension, mount and hardpoints live in the section
titled *The Motor Pool* — cited by title, not by number, because these `[PROPOSED]` sections may be
renumbered at merge — and reach the engine only through `deriveMechanized` plus its facings.

`land_dreadnought` is one machine described by two rows in two tables: the relic **project** that
raises it, in the catalogue, and this **stand** that then fights. Both carry tier III. It dies with the
keel that raised it — on capture the captor loots unspent materials only; the project, its progress
and its housed Object are lost.

### 26.2 Specialists

A specialist is attached to a squad and moves its numbers. Every one carries at least one numeric mod;
an attachment whose only effect is in its blurb is not an attachment.

`squadStaffMods` fixes the stacking so two callers cannot disagree: duplicates count once; `morale`,
`initiative`, `recoverPerTurn`, `aoeSuppress`, `buildSpeed` and `executionToll` are **additive**;
`moraleFloor` takes the **maximum**, because a floor is a floor. A squad carries at most
`SCALING.maxSpecialists` attachments, and the survivors are chosen in the table's own declaration
order rather than in the order the caller listed them — so the result does not change when the list is
shuffled, and an attachment past the cap is ignored rather than rejected.

| `key` | Label | `pts` | Mods |
| --- | --- | --- | --- |
| `medic` | Field Medic | 12 | morale +1, recoverPerTurn +1 |
| `signaler` | Signaler | 10 | initiative +3 |
| `commissar` | Ministry Commissar | 14 | morale +1, moraleFloor +11, executionToll +1 |
| `heavy_gunner` | Heavy Gunner | 16 | aoeSuppress +1 |
| `sapper` | Sapper | 12 | buildSpeed +1 |
| `chaplain` | Chaplain | 13 | morale +1, moraleFloor +10 |
| `cartographer` | Field Cartographer | 13 | initiative +2, morale +1 |
| `forward_observer` | Forward Observer | 18 | aoeSuppress +1, initiative +1 |
| `provost_sergeant` | Provost Sergeant | 15 | moraleFloor +12, executionToll +2 |
| `relic_bearer` | Relic Bearer | 20 | morale +2, recoverPerTurn +1 |

### 26.3 Upgrade kits

A kit applies only to the squad types named in its `appliesTo`, and a squad may carry at most
`UPGRADE_RULES.maxPerSquad` kits. That ceiling is a constant in `base44/shared/tactical.ts`; this
section deliberately does not retype it, because a number written in two places is a number that will
disagree with itself.

**No kit is free.** Every row either carries a negative mod — a real trade along a real axis — or is
gated behind a fragment class above tier I, and several are both. A kit's effects apply to the
**fitted stand**, on fit, and never to the faction that unlocked the row.

| `key` | Label | Tier | `pts` | Mods | `appliesTo` |
| --- | --- | --- | --- | --- | --- |
| `armor_skirts` | Armor Skirts | I | 20 | armor +3, speed -1 | `crawler`, `autocar_scouts`, `land_dreadnought` |
| `storm_hoods` | Storm Hoods | II:Cache | 14 | morale +1 | `stormtroops`, `assault`, `sappers`, `pioneers`, `flame_team` |
| `wire_spades` | Wire & Spades | I | 12 | armor +1, speed -1 | `riflemen`, `pioneers`, `sappers`, `digger_corps`, `ski_troops`, `pilgrim_levy`, `provost` |
| `sapper_plate` | Sapper Plate | I | 20 | armor +2, speed -1 | `sappers`, `pioneers`, `stormtroops`, `assault` |
| `ski_conversions` | Ski Conversions | I | 16 | speed +2, ranged -2 | `ski_troops`, `autocar_scouts`, `crawler` |
| `mine_flails` | Mine Flails | I | 14 | melee +2, speed -1 | `crawler`, `autocar_scouts`, `land_dreadnought` |
| `marksman_pattern` | Marksman Pattern | II:Eng | 18 | range +2, ranged -1 | `marksmen`, `scouts`, `riflemen`, `provost` |
| `drum_magazines` | Drum Magazines | I | 18 | ranged +3, range -1 | `assault`, `stormtroops`, `gunners`, `provost` |
| `gas_shells` | Gas Shells | II:Ciph | 22 | ranged +2, range -1 | `mortars`, `siege_mortar`, `artillery` |
| `radio_pack` | Radio Pack | II:Ciph | 16 | morale +1, speed -1 | `riflemen`, `stormtroops`, `marksmen`, `provost`, `autocar_scouts`, `siege_mortar` |

### 26.4 What the platform lane still owns

- `gameEngine` reads none of these tables yet. Wiring them is the handoff item, recorded in
  `docs/prompts/PLATFORM_HANDOFF.md` under *Lane F*.
- The kit ceiling is declared but unenforced: nothing in this section validates a squad's kit list, and
  the combined specialist-plus-kit bill is ungated and on the single-figure stands it is large. The
  audit in `docs/GEAR_LIBRARY.md` §11.8 recomputes it and names the two worst stands.
- Pricing is audited in `docs/GEAR_LIBRARY.md` §11, which recomputes every figure in this section from
  the tables rather than quoting it, and is itself recomputed by `test/gear-points-audit.test.js`.

## 28. Houses, Standards & Nomad-Keel Perks [PROPOSED — awaiting platform wiring]

Nothing in this section is live. Every figure below is **read out of a table, never typed twice**:
`src/lib/pointBuy.js` (`PERKS`), `base44/shared/perkMods.ts` (`PERK_MODS`), `src/lib/lifepath.js`
(`LIFEPATH_CHAPTERS`) and `src/lib/presetFactions.js` (`PRESET_FACTIONS`). `test/presets.test.js`
locates this section **by its title, not by its number**, rebuilds all four tables from those sources
and fails on any disagreement — so promoting, renumbering or re-ordering the section cannot silently
falsify it, and a hand-edited cell goes red on the next run.

`§13 Faction Point-Buy Perks` is unchanged and stays the live catalog. The eight rows below are
**additions to it**, not a replacement, and they are already in `PERKS`; what is missing is the engine
reading them.

### The nomad-keel requisitions

Eight rows for the March itself — the graze, the swath, the draught columns and the boarding deck.
None is a `cat: "upgrade"`: upgrades are one-per-unit under `pickError`, so an eighth would have
quietly shrunk the space of legal ledgers for every preset that already shipped.

| `id` | Requisition | Class | Effect, as `PERK_MODS` states it | `pts` |
| --- | --- | --- | --- | --- |
| `draught_columns` | Draught Column Circuit | asset | Steel income **+1**, Fuel income **−1** | **1** |
| `boarding_parties` | Boarding Parties | asset | Riflemen attack **+1**, riflemen cost **+1** Manpower | **1** |
| `field_refit_train` | Field Refit Train | asset | Crawlers cost **−1** Steel | **2** |
| `ranging_batteries` | Ranging Batteries | asset | Artillery attack **+1** | **3** |
| `swath_bound` | Swath-Bound | liability | Manpower income **−1** | **−2** |
| `stripped_escorts` | Stripped Escorts | liability | Crawler defense **−1**, crawlers cost **−1** Steel | **−1** |
| `tribute_graze` | Tribute Graze | liability | Fuel income **−1**, NPC disposition **−10** | **−3** |
| `exposed_batteries` | Exposed Batteries | liability | Artillery defense **−1** | **−3** |

The eight are priced, not guessed. Each cost is the **sum of its own effect steps** under a schedule
every step of which is anchored by a perk `§13` already shipped — so no new row sets a new price:

| Step | Asset price | Anchor | Liability price | Anchor |
| --- | --- | --- | --- | --- |
| income ±1 | **+3** | `industrial_base` | **−2** | `fuel_shortage` |
| unit stat ±1 | **+3** | `veteran_corps` | **−3** | `green_recruits` |
| unit cost ∓1 | **+2** | `conscription` | **−2** | `rusting_arsenal` |
| army cap ±15 | **+3** | `mobilization_doctrine` | **−2** | `war_weary` |
| start bonus ±4 | **+2** | `war_chest` | **−2** | `depleted_stockpiles` |
| capital defense +1 | **+2** | `home_guard` | — | — |
| NPC disposition −10 | — | — | **−1** | `pariah_state` |

Worked, so the arithmetic is on the page rather than in a claim: `draught_columns` is one income step up
(**+3**) and one down (**−2**) and therefore costs **1**; `tribute_graze` is one income step down
(**−2**) plus the disposition step (**−1**) and therefore grants **−3**. The eight together are
**+7** of assets against **−9** of liabilities, a net of **−2** — which is why a preset can afford one
without re-cutting its whole ledger.

Two gaps in the schedule are **absences, not oversights**: no shipped row anchors a *positive*
disposition step or a *negative* capital-defense step, so neither is priced and neither is used here.
The five `cat: "upgrade"` rows are excluded from the schedule entirely, and the exclusion is measured
rather than asserted — the kit rows depart from it in **both** directions (`naval_rams` and
`drop_tanks` a point under, `flame_projectors` two points over), so the test pins those deltas one by
one instead of calling them a discount.

### Chapter VI — The Standard

The faction wizard gains a sixth chapter. It asks one question — *what flies over your keel* — and the
four answers map one-to-one onto the four `std_*` plates that already existed. Each effect is in the
`synthesizeFaction` trait-effect schema, so the value is **1** in every case; the schema clamps
anything outside `1…2` silently, which makes a larger number a bug rather than a balance lever.

| Option | Standard | Effect |
| --- | --- | --- |
| The Column of Honors | `std_column` | `attack_bonus` · riflemen · **1** |
| The Reliquary Standard | `std_reliquary` | `defense_bonus` · riflemen · **1** |
| The Black Standard | `std_black` | `defense_bonus` · crawler · **1** |
| The First Keel's Pennant | `std_first_keel` | `income_flat` · **1** |

`unit_discount` is the one schema verb the chapter does not spend. That is deliberate: the chapter is
data, not a closed set, and a later Field Amendment can add a fifth standard using it without first
having to defeat a gate written here.

### The thirteen presets

`Seeds` are the four ideology axes of `VISION §6.1` at creation, each **−3…3**. `Departure` is **not
stored on the row** — it is derived from the Creed seed through `DEPARTURE_BY_CREED_SEED`, which is
what lets Lane G's creed locks resolve for a preset that never declares a creed. `Net` is
`netPoints(picks)`, which must be **≤ 0**, and `Liab` the liability count, which must be **≤ 3**.

| Faction | House | Doctrine | Seeds A / E / C / M | Departure | Standard | Decree | Net | Liab |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| The Kessel Pact | `kessel` | aggressive | +2 / −1 / −2 / −2 | Discarding | `std_black` | `universal_levy` | 0 | 3 |
| The Iron Synod | `ironsynod` | economic | +1 / +2 / 0 / +1 | Finished Ledger | `std_column` | `war_bonds_decree` | 0 | 3 |
| The Grauwall Marches | `grauwall` | defensive | 0 / −1 / 0 / −1 | Finished Ledger | `std_column` | `fuel_ration_act` | −1 | 3 |
| The Iron Reclamation | `reclamation` | aggressive | +2 / 0 / −2 / −1 | Discarding | `std_column` | `emergency_powers_act` | 0 | 2 |
| The Charter Combine | `combine` | economic | −1 / +2 / 0 / 0 | Finished Ledger | `std_black` | `charter_of_passage` | −1 | 3 |
| The Bastion Synod | `synod` | defensive | −1 / 0 / +2 / +1 | Recall | `std_reliquary` | `reliquary_act` | 0 | 3 |
| The Covenant of Locks | `covenant` | aggressive | +1 / −1 / −1 / +1 | Flight | `std_black` | `sealed_sites_order` | 0 | 3 |
| The Signal Ascendancy | `ascendancy` | economic | +1 / +1 / +1 / 0 | Recall | `std_reliquary` | `wakewatch_act` | 0 | 3 |
| The Commonweal March | `commonweal` | defensive | −3 / −2 / −2 / −2 | Discarding | `std_first_keel` | `hearth_and_bulwark` | −1 | 3 |
| The Salvage Court | `salvage` | aggressive | +1 / +2 / 0 / +1 | Finished Ledger | `std_black` | `ordinance_common_metal` | 0 | 3 |
| The Emberwright Union | `emberwright` | economic | 0 / −1 / −2 / +1 | Discarding | `std_column` | `breaking_yards_act` | 0 | 3 |
| The Long Procession | `procession` | aggressive | +2 / −1 / +3 / −2 | Recall | `std_reliquary` | `writ_of_consecration` | 0 | 3 |
| The Outrider Compact | `outrider` | economic | −2 / +1 / −1 / +2 | Flight | `std_column` | `standing_corps_act` | 0 | 3 |

Doctrine across the thirteen is **aggressive 5 / economic 5 / defensive 3**; across the ten roster
houses alone it is **aggressive 4 / economic 4 / defensive 2**, which is the count `FACTION_ROSTER.md`
§1 now publishes and §6 explains. All four Departures are held, and no two houses share a keel.

### Capture — a relic project dies with the keel

Settled by operator ruling in the fourth wave; it closes `docs/TECH_DESIGN.md` §7 Q5.

When a fortress-base is boarded and taken, the captor loots **the running project's unspent materials
and nothing else** — the conventional resources and fragments still loose in the cradle. The project,
**all of its accumulated progress, and the housed Object its tier gate required are lost.** Destruction
and capture are identical for the works. The loser keeps no Object; the winner receives none; the works
cannot be inherited, resumed, ransomed or re-founded, and a captor who wants that hull begins it again
on his own keel, having first found his own Object of the right class.

This is a **deletion the engine has to perform**, not merely a transfer it declines to make, and
nothing performs it yet — `RELIC_PROJECTS` have no build clock at all (`PLATFORM_HANDOFF.md` G5). It is
carried in prose meanwhile by `docs/HERALD_VOICES.md` Shared Rule 7 — a captor may report metal, a
loser may report a hole, and **no herald may report a captured project as an inheritance** — and by
the Codex entry `works-lost-with-the-keel`.

### What the platform lane still owns

- **`compileMods` already reduces all eight requisitions correctly** — they use only `unitStat`,
  `unitCost`, `income` and `disposition`, all of which it handles — so the perks work the moment a
  faction created from a preset reaches the engine. Nothing else here is wired.
- **Chapter VI's effect is inert.** `synthesizeFaction` builds `traits[]` from the wizard; no call site
  reads `lifepathChoices.standard`, so choosing a standard currently changes only the Chronicle.
- **`uniqueRoster` is declared and unenforced.** Each preset names the squads, upgrade kits, decree and
  weapon patterns its house fields; every key is checked to exist, and nothing restricts a player to
  them.
- **`house`, `uniqueRoster` and `heraldVoice` have no entity column.** `presetToFactionRecord` strips
  them before `Faction.create`, so a preset's house identity does not survive into the save. Adding the
  columns is platform-owned.
- **Module certifications grant nothing.** A `kind: 'module'` row's effects apply **on fit, never on
  unlock**; no preset's lore or trait claims a faction-wide bonus from certification alone, and the
  engine must keep it that way.
- Full hand-over in `docs/prompts/PLATFORM_HANDOFF.md` under *Lane H*.
