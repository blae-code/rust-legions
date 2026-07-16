# Conquest Tactics — Complete Ruleset (v1.0.0 "The Vanilla Front")

Authoritative source: `base44/functions/gameEngine/entry.ts`. Frontend mirrors in `src/lib/`.
Any change here must be applied in both places and filed as a Patch dispatch.

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