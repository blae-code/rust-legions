# Rust Legions — The Sinews and the Noose (Supply & Siege Design Proposal)

> **Status: PROPOSAL.** Deepens shipped supply (`GAME_RULES.md` §7, §21 refit logistics) and creates
> siege warfare, which currently doesn't exist (assault or leave — "besieged" is only a −2). Built to
> interlock with `ECONOMY_DESIGN.md` (graze, flows, depots, draught columns, swaths),
> `COMBAT_DESIGN.md` (the Line, withdrawal, boarding assaults), and VISION §5 (v2.x graph supply
> re-anchoring to the base). The Tedium Law governs throughout: supply is **states, not beans**;
> sieges are **clocks with occasional decisions, not daily chores**. Tracker: §3.11 / L-14.
> Numbers illustrative.

## 0. The Pitch

Two ideas, one doc. **Resupply:** an army's reach is the shadow of its keel — a graded envelope you
extend with depots and columns and stretch at growing risk, not a binary radius. **Siege:** the art
of making the other side's clock run out first — stores against saps, sorties against works, relief
against starvation — and, at the summit of the art, the encirclement of a fortress-base: the only
way to kill a thing that eats regions is to fence it inside one it has already eaten.

## 1. Graded Supply States (replaces the binary)

Every army holds one state, computed as today (Dijkstra from hubs) but graded:

| State | Condition | Effects |
| --- | --- | --- |
| **In Supply** | Within network range | Full function (as today) |
| **Extended** | Beyond range but linked via a forward depot or an assigned supply column | −1 battle skill; no reinforcement; builds fine at destination? no — purchase/reinforce still blocked; movement full |
| **Foraging** | Out of network, stance chosen | No attrition; **grazes the local deposit** (ECONOMY: real depletion, real harvest-rights incidents — an army eats like a small keel and settlements remember); march rate −1; −1 skill |
| **Cut Off** | Out of network, no depot/column/forage | Attrition (§3), −2 skill (as today), no build/purchase/reinforce |

**Deadlining (the humane attrition):** when Cut Off, machines fail before men die — crawler and
fighter companies **deadline** first: present but non-combatant (no attack contribution, still count
for casualties last), restored automatically on resupply. Attrition deaths (§3) begin only after
everything mechanized is deadlined. Cut-off armor becoming infantry-with-baggage is truer, kinder,
and more interesting than deletion — and it makes fuel interdiction a precision weapon.

## 2. The Envelope (how reach is built)

- **The keel is the heart** (v2.x canon): the network radiates from the base and marches with it —
  a migration is also a campaign plan. Hex-era: base + capitals + forts/barracks hubs as today.
- **Forward depots** (player-placed, cap 2–3): an action stocks a friendly zone/location with a
  depot (costs resources to fill; shares the economy doc's depot object). A depot projects a small
  supply bubble → **Extended** state for armies beyond the network. Depots burn when captured
  (attacker chooses: loot or torch). Offensives now have visible logistics: watch an enemy stock a
  depot and you are reading their next campaign.
- **Supply columns:** draught columns (ECONOMY §2) take a second assignment type — *sustain army X
  from depot/keel Y*. One column sustains one army in Extended state; the column is on the road,
  visible, and raidable (§6). Assignment-based, auto-cycling, zero per-turn clicks.
- **Foraging** is the stance of armies that have outrun everything — Mongol logistics, at the price
  of the countryside's goodwill and your own tempo.

## 3. Attrition & Recovery

- Cut Off attrition scales with **weather and terrain** (snow/mountains double it) — evented in the
  dispatch ("the 3rd Column reports frostbite in the passes"), never player-managed.
- **Recovery trickle:** armies In Supply adjacent to the keel or with a Field Hospital Trailer
  recover a fraction of recent casualties over days (the wounded return). Rewards supply discipline
  and rotation; softens the counterplay-web's damage economy; gives the keel one more gravitational
  pull.

## 4. Sieges (fortified zones, settlements, still-cities)

**Investment:** an army on/adjacent to a fortified zone or settlement may **Invest** instead of
assaulting: hostile presence cuts the target's supply and opens a **Siege** — a clock, visible to
both sides.

- **Stores:** every fortified zone/settlement holds siege stores = f(fortification level, terrain,
  stockpile actions taken in peace). UI on both sides: *"Estimated holdout: 19 days."* The whole
  siege is a race against that number and the relief map.
- **Besieger works** (a decision every few days, not daily — the siege tick offers one card):
  *Bombard* (existing artillery grinds fort level — a **Breach** halves fort bonus in the eventual
  assault) · *Sap* (approach trenches: N days, then assault ignores one front's terrain anchor —
  COMBAT Line tie) · *Tighten the blockade* (stores drain ×1.5, besieger supply cost up, runner
  convoys blocked) · *Summon* (demand surrender — acceptance odds from stores remaining, relief
  distance, disposition, creed; a Summon refused hardens the garrison, +morale) · *Assault* (the
  mass battle, with breach/sap state applied).
- **Defender options** (same cadence): *Sortie* (a short Line battle against the works — success
  burns saps/guns/besieger supply; the Fox's ambush shines) · *Runner convoys* (sneak supply in —
  odds by weather/fog, blocked by tight blockade) · *Appeal* (radio for relief: allies, settlements
  of the same creed, or a paid house — the Envoy Desk mid-siege) · *Surrender on terms*.
- **Relief:** when a relieving force nears, the besieger chooses: *maintain and cover* (detach a
  covering force → a field battle while the siege holds), *lift and concentrate*, or *storm before
  they arrive* (assault at whatever breach state exists). The oldest triangle in warfare, three
  clean options.
- **Terms and the sack:** a fallen or surrendered place resolves as *Honors of War* (garrison
  marches out; settlement disposition largely preserved; the Chronicle approves) · *Occupation*
  (garrison cost, manageable dispositions) · *Sack* (immediate resources and fragments, map-wide
  disposition ruin by settlement type, bloc reactions — the Levy hates it, the Court doesn't — and
  a permanent Chronicle stain). Ideology made visceral at the moment of victory.

## 5. Sieging the Keel (the summit)

A fortress-base cannot be starved — it can *move* — so the siege of a keel is an **Encirclement**:

1. **Fence the pasture:** hostile forces controlling the zones/routes around a keel's position cut
   its flows and pin its harvest footprint to the local region. Denial-grazing the region *first*
   (ECONOMY §5) is the master stroke — fence it inside its own swath.
2. **The starving clock:** the keel eats what's left locally, then its stockpiles (caps = Industry/
   stockpile modules — suddenly precious). Both sides watch the same countdown.
3. **The encircled keel's outs:** **Breakout** — a battle type on the COMBAT Line where the keel
   picks one front and punches with everything, base guns included; success = the keel escapes onto
   the chosen route at cost, failure = back inside, weaker · *Sortie/Appeal/Terms* as §4 · or hold
   for relief.
4. **The kill:** a starved keel (stores 0) suffers deadlining of its own — modules failing one by
   one, morale aura collapsing — until the besieger **boarding-assaults** (COMBAT §8: Treadworks →
   Gundecks → the Keep) a fortress that can barely answer. Encircle, starve, storm: the correct,
   dramatic, expensive way to end a great house — and the only way that captures the base intact.

## 6. Raiding & Interdiction (the small war)

Supply columns, runner convoys, depots, and siege trains are all **raid targets** resolved with
COMBAT Layers 1–3 only (small fights stay small). Fast compositions and the Outrider Compact live
here. v2.x: interdiction stance on route segments (ECONOMY §3 economy-side) gains the military verb —
a raiding army astride a route auto-contests columns crossing it. The war behind the war.

## 7. Engineering & Weather

- **Siege train** (unit class or Armory pattern): heavy guns — doubles Bombard breach rate, halves
  march speed of its army. A thing you protect and a thing you hunt.
- **Bridging train** (support): unlocks crossing/attacking over river-anchored fronts (COMBAT Line)
  and shortens routes at rivers (v2.x). One more reason columns and engineers matter.
- **Winter sieges:** snow drains both clocks — stores faster, besieger attrition doubled. Mutual
  misery, evented ("Day 31 before the walls; the guns are frozen; so are they"). Starting a siege in
  autumn is a decision.

## 8. Integration Map

Forage/encirclement grazing → ECONOMY depletion, harvest-rights incidents, swaths · sack/honors/
tribute → settlement dispositions, blocs, decrees (a "Conduct of War" decree naturally follows a
first sack) · sorties, breakouts, assaults → COMBAT engine (Line, withdrawal, boarding) · siege
chapters, Guard stands at the Keep, sacks → Chronicle + herald (the Synod's Roll mourning a
sacked parish writes itself) · stockpile modules & Habitat decks → keel holdout · Lance Battery →
counter-battery drama · relief appeals → Envoy Desk content mid-war.

## 9. Implementation Sketch & Slicing

- **Engine:** supply grading extends the existing Dijkstra pass with depot/column sources; deadlining
  is a unit flag honored in battle math; sieges are a new engagement object (target, stores clock,
  works state, breach level) ticked daily with card-choice actions; encirclement reuses zone/route
  control checks + the flow cuts already specced in ECONOMY.
- **Slices:** (1) **Graded states + deadlining + Forage** — hex-era safe, small engine change, makes
  supply immediately more humane and more interesting. (2) **Sieges of fixed places** (invest,
  stores, works/sortie cards, terms) — hex-era, fortifications finally mean something. (3) Depots +
  supply columns (wants ECONOMY columns). (4) Raiding verbs + siege/bridging trains. (5) **Keel
  encirclement & breakout** (wants graze economy + COMBAT Line + boarding). (6) v2.x route
  interdiction unification.

## 10. Open Questions

1. Stores math: days at fort level 1/2, and how much can peacetime stockpiling extend it?
2. Siege tick cadence: a works/sortie card every 3 days? 5? (Tedium ceiling: a 30-day siege should
   ask ~6–10 decisions total, both sides combined per side.)
3. Depot cap (2? 3? ideology-grown?) and fill costs.
4. Recovery trickle rate — and does it risk making attrition toothless? (Leaning: cap recovery at
   25% of losses, keel-adjacent only.)
5. Does Forage work in winter? (Leaning: no — snow forage = Cut Off. Generals who winter in the
   field earn their epithets.)
6. Encirclement definition, hex vs. graph: all adjacent zones hostile, or flows-cut-for-N-days?
   (Leaning: flows-cut — it's one check and it already exists in ECONOMY.)
7. Can a besieged *player* keel still run off-turn systems (Armory, research)? (Leaning: yes —
   the Directorate works by lamplight. It's thematic and keeps the besieged player playing.)
