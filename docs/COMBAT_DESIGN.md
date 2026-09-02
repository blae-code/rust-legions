# Rust Legions — The Shape of Battle (Combat Design Proposal)

> **Status: PROPOSAL.** Deepens the shipped mass-combat engine (`GAME_RULES.md` §9–§12, §21) —
> this is a layered upgrade, not a replacement: the 3d6 contest, secret simultaneous maneuvers,
> morale, veterancy, signatures, designs, and command vehicles all stand. Lore: `docs/LORE.md`.
> Cross-links: `LIFEPATH_DESIGN.md` §2.3 (formative battle events), `FACTION_ROSTER.md` (AI
> personalities), VISION §3.3 (boarding assaults — resolved here), §5.4 (interception).
> Tracker: §3.10 / L-13. Numbers illustrative; balance at spec time.

## 0. Diagnosis and the Decision Budget

What ships today is a sound chassis with three gaps:

1. **The mind game has no teeth.** Maneuvers are stat trades (skill vs. damage multipliers), so for
   a given matchup there is usually a *correct* pick. Secret simultaneous selection only thrills
   when picks **counter** each other — when reading the opponent is worth more than reading the math.
2. **No space.** One blob contests one blob. There is nowhere to be clever — no flank to refuse, no
   bridge to hold, no breakthrough to exploit.
3. **No commitment arc.** Everything fights from round one; the battle has no reserve to time, no
   withdrawal to judge, no pursuit to risk. It ends by annihilation, rout, or timeout — never by
   decision.

**The Combat Tedium Law** (the §0 law of `ECONOMY_DESIGN.md`, applied here): a battle should present
**5–14 decisions, every one a read** — and never a decision whose answer is always the same. Budget:
1 at deployment, 1 maneuver per round (existing), ≤1 optional lever per round (weight/reserve/asset),
≤1 ending decision. Auto-resolve remains for foregone conclusions; async defenders get better
stand-ins (§9). Everything below fits inside that budget.

## 1. Layer One — The Counterplay Web *(transforms feel; cheapest to build)*

Keep every maneuver's existing stat line. Add a **reveal-time counter table**: after simultaneous
reveal, matchup adjustments apply. Every option now beats something, loses to something, and
**Attack** is the safe, neutral tempo pick.

| You played… | …into | Result |
| --- | --- | --- |
| Hold the Line | All-Out Attack | HtL +2 skill; attacker dmgIn +0.2 — the charge breaks on the wire |
| Flanking | Hold the Line | Flank +2 skill and ignores fortification bonus this round — around the wire |
| Attack | Flanking | Attack +2 skill; Flank loses its dmgOut bonus — caught strung out mid-march |
| All-Out Attack | Feint or Rally | All-Out +2; the Feint's stored bonus is canceled / Rally restores only half — passivity punished |
| Feint | Attack or All-Out | The bait lands: next-round bonus becomes **+4** (not +2) |
| Rally | Hold or Feint | Safe: full +20 morale, no penalty |

Signatures sit atop the web with sharper edges (this is what "signature" should mean): **Staged
Ambush** additionally counters Flanking and All-Out (+2 more vs. both); **Iron Wall** blunts anything
aggressive but concedes tempo (enemy recovers +5 morale — you cannot turtle to victory); **Relentless
Pursuit** doubles its damage against a side that played Rally or Feint (hesitation is death near the
Butcher); **Inspiring Charge** cannot be counter-punished by HtL (it's about the men, not the ground).

**The hand history is the game:** the battle UI already keeps round-by-round dispatches — surface
both sides' full pick history prominently. Reads come from three places: the history, the opponent's
morale state (low morale *must* Rally soon — punish it), and personality (§9). This layer alone turns
each round from arithmetic into poker.

## 2. Layer Two — The Line *(positional play without a tactical map)*

Every mass battle now has a **line of three fronts** — left, center, right — generated from the
battlefield tile (terrain + adjacencies): a river anchors a flank (+def there, no Flanking through
it), a ridge crowns the center (elevation applies per-front), marsh bogs a wing (crawler penalties
localized), a road through the center (breakthrough bonus). The map finally *shapes* the fight.

- **Deployment (1 decision):** pick a weighting preset — *Balanced · Strong Left · Strong Right ·
  Deep Center · Refused Flank* (weights like 40/30/30, 50/25/25, 25/50/25, 20/40/40). Companies
  auto-distribute; no unit-by-unit placement, ever (Tedium Law).
- **Resolution:** one maneuver per round (unchanged — the general's order of the day) contested
  **per front**, with front weight as a local strength modifier and front terrain as local modifiers.
  Losses and morale aggregate as today, so the engine's outer loop barely changes.
- **The optional lever:** once per round you may **shift weight one step** (e.g., feed the left).
  Shifting *into* a front that then loses its contest costs extra (caught in motion).
- **Breakthrough:** win a front by margin ≥ 4 and it **breaks** — next round that front's damage
  bypasses dmgIn reduction, and it unlocks **Headhunt** (§5). The defender can plug a breakthrough
  with the reserve (§3) — which is exactly the decision reserves exist for.

Two new reads appear: *where* is their weight (probe intel and observed losses per front hint at
it), and *when* to shift — and refusing a flank against a Butcher is now a real, nameable tactic.

## 3. Layer Three — Reserves and the Guard *(the commitment arc)*

- **Reserve (deployment decision, folded into the preset choice):** hold 0% / 25% / 40% out of the
  line. Reserved companies take no losses and add no strength — they are stored tempo.
- **Committing the reserve** (round lever, replaces weight-shift that round): choose a front; it
  arrives with a one-round **fresh surge** (+2 skill on that front, dmgOut ×1.2). Commit into a
  breakthrough to seal it, or into a winning front to force one. An uncommitted reserve at rout
  time covers the retreat (§6 — pursuit losses halved). Timing this is the oldest decision in war
  and it is *fun*.
- **The Guard:** veteran/elite companies may be flagged as Guard at muster. Guard held in reserve
  and committed while your morale < 50 fights the surge round at +4 skill instead of +2 — the Old
  Guard at dusk. Once per battle, loudly announced in the dispatch. Chronicle gold.

## 4. Layer Four — Arms as Verbs *(composition becomes tactics)*

Unit mix currently melts into a points total. Give each arm one battlefield verb:

- **Artillery — Barrage** (round option, replaces the maneuver; requires artillery companies):
  skip the contest; deal morale damage (−8 × artillery weight) to a chosen front. Countered hard by
  All-Out Attack (they close the distance: your line fights at −2 while the guns limber). Pre-battle
  bombardment of the tile (existing §10 action) now also lowers defender starting morale by −10 —
  preparation matters.
- **Crawlers — Shock:** crawler weight converts breakthroughs: margin needed drops from 4 to 3 on a
  front where crawlers ≥ 40% of weight. Blunted to 5 in marsh/fortified fronts. Armor is the
  breakthrough arm, exactly as it should be.
- **Fighters — Strafing Run / the Overwatch:** once per battle, before picking your maneuver,
  **reveal the enemy's chosen maneuver this round** (aerial observation of their columns forming).
  If they also field fighters, a dogfight roll decides who sees whom. Air superiority = information
  superiority, which in a reads game is the strongest thing air can be.
- **Riflemen — the Spade:** rifle-majority fronts on fortified/urban/ridge ground upgrade Hold the
  Line (+1 further skill). Infantry holds ground; that's the job.

Muster composition is now a tactical plan, not a budget line — and Army Designs (§11) finally
interact with something (Vanguard formations shift breakthrough thresholds, Skirmish eases
withdrawal, Signals support aids the dogfight and Headhunt defense).

## 5. Layer Five — Command as a Target

Command vehicles (§21, shipped and charming) become stakes. A broken front (Layer 2) unlocks
**Headhunt** next round (round option for that front): a strike at the enemy command vehicle.
Resolve as a contest vs. (their Guard reserve committed? +4 defense) and (their vehicle's design).
On success: −20 enemy morale, and a **general fate roll** — unhurt / wounded (scar trait —
`LIFEPATH_DESIGN` §2.3, straight into the biography) / captured (ransom via the Envoy Desk; a
captured Marshal is a diplomatic event the herald will not shut up about) / **killed** — generals
are mortal by directive; succession or dissolution per `LIFEPATH_DESIGN` §2.6. The Fox's "Vixen" autocar
gets an evasion bonus; the Butcher's "Mauler" can Headhunt *back* on an even round. Protecting the
old man is now a reason to hold a reserve, and killing him is a reason to force a flank.

## 6. Layer Six — Endings by Decision

Replace "annihilation, rout, or timeout" with an ending each side *chooses* under pressure:

- **Fighting Withdrawal** (round option, any round): break contact in good order. You concede the
  field; pursuit losses are modest (halved again if a reserve covers); veterancy, standards, and
  traditions retained. The professional's exit.
- **Rout** (morale ≤ 0, as today) is now *the failure to choose withdrawal in time*: heavy pursuit
  losses, and a roll to lose the army's **standard** — captured standards become enemy trophies,
  Chronicle chapters, and a −5 disposition grudge that outlives the war (army lifepath integration).
- **Pursuit** (winner's decision at any withdrawal/rout): *Press* (convert retreat into casualties —
  Relentless Pursuit and fast compositions excel; risks disorder if their reserve turns) or *Let
  them go* (keep the field, keep formation, take the objective). Speed finally pays in blood, which
  is where this genre wants it paid — and it previews v2.x interception math (VISION §5.4).
- The 15-round cap remains as a backstop only; a battle that reaches it was two Iron Walls staring
  at each other, and both sides' blocs should complain about it.

## 7. Layer Seven — The Approach *(the battle before the battle)*

- **Ground choice:** where the defender has warning (probe detection, garrison), they pick the
  battlefield's facing — which terrain features anchor which fronts. Ambush setups (the Fox's
  Staged Ambush) can *hide* the true weighting until round two.
- **Intelligence:** probe results (§12) gain one line — the enemy general's **tendency** ("favors
  the flank," from their actual pick history across past battles). Scouting a commander before
  fighting them is playing the player.
- **Weather forecast:** a 1-day forecast (Ledger/ministry weather service) makes *when* to force
  battle a decision — attack before the snow grounds your crawlers, or wait for fog to blunt their
  guns.

## 8. Boarding Assaults *(VISION §3.3 and §8.3, resolved with the same grammar)*

Storming a fortress-base reuses the engine with one twist: the three fronts become **decks, fought
in sequence** — Treadworks, Gundecks, the Keep. Each deck is a short (≤5 round) mass battle with the
full maneuver/counter web; taking a deck carries your surviving weight to the next while the
defender falls back (defender's Guard traditionally dies at the Keep). Ship modules matter per deck
(Armor modules defend the Treadworks; Industry decks burn — captured vs. destroyed per VISION's
stripping question). Headhunt at the Keep = seizing the bridge: the base falls **intact**. No new
resolution system needed — the answer to VISION open question §8.3 is "the mass-battle engine, deck
by deck."

## 9. Personalities, Async, and the AI

- **Readable AI:** each roster house (`FACTION_ROSTER.md`) gets a maneuver personality — the
  Reclamation over-commits (All-Out weight high, Feint near-zero), the Fox-trait generals feint one
  round in three, the Salvage Court always Headhunts when able, the Procession never withdraws on
  holy ground, the Compact always Presses pursuit. Personalities are *tells*, and tells are
  exploitable, and exploiting a read you earned is the fun.
- **Async defense:** the 60-second live window stands, but absent defenders stop being doctrine
  tables: players set per-army **Field Orders** — a personality of their own (aggression slider,
  withdrawal threshold, reserve policy, "protect the general"). Losing while offline should feel
  like your *orders* were beaten, not like you were robbed.
- **Auto-resolve** offers expected-value-with-variance for mismatches ≥ 3:1, honoring designs,
  traits, and Field Orders — the Tedium Law's escape hatch.

## 10. Integration Map (what this feeds and eats)

Wounds/captures → general lifepath scars, ransom diplomacy (`LIFEPATH_DESIGN` §2.3–2.4) · standards
and traditions → army lifepath (§3) · Headhunted Marshals, Guard stands, captured standards → War
Chronicle + herald material · draught columns and Meets (`ECONOMY_DESIGN`) → ambush/interception
targets resolved with Layer 1–3 only (small fights stay small) · Lance Battery (`TECH_DESIGN`) →
a Barrage that hits every front · Covenant/Court AI (`FACTION_ROSTER`) → §9 personalities ·
garrison combat (§5 of GAME_RULES) **stays fast and dumb on purpose** — it inherits only pre-battle
bombardment morale and Fighting Withdrawal; the mass battle is the showpiece, the tile scrap is not.

## 11. Implementation Sketch & Slicing

- **Engine:** the counter table is a pure post-reveal adjustment in the existing contest function;
  fronts are a loop over the same contest with local modifiers; reserves/Guard/verbs are flags and
  round options in the existing maneuver-selection payload; endings extend the existing termination
  check. `compileMods` untouched; battle dispatch schema gains per-front lines.
- **Slices:** (1) **Counterplay web + hand-history UI + AI personalities** — smallest change,
  biggest feel shift; hex-era safe; ships alone. (2) Endings (withdrawal/pursuit/standards) +
  Field Orders. (3) Arms as Verbs. (4) The Line + reserves + Headhunt (the big one; UI work).
  (5) Boarding assaults (with the v2.x base-capture rework). (6) The Approach (forecast now;
  ground-choice with v2.x interception).

## 12. Open Questions

1. Counter magnitudes: is ±2 skill the right currency, or should counters touch multipliers only?
   (Leaning: skill — it's legible in the dispatch math players already see.)
2. Three fronts always, or two (van/main) for small battles under N points? (Leaning: two below
   ~40 points; three above.)
3. Live-battle pacing: per-round decision timer in live multiplayer (30s? 60s?) and what fires on
   expiry (Field Orders, presumably).
4. Does Strafing Run reveal before or after the opponent locks their pick (i.e., can they bluff a
   revealed pick)? (Leaning: after lock — the reveal is true. Bluffing the scout is a Fox signature
   candidate instead.)
5. Standard capture odds on rout, and can a captured standard be *retaken* (raid objective — too
   good to leave out?).
6. Guard flagging: free at muster, or a design-slot cost?
7. Barrage vs. the existing bombardment action — keep both (operational vs. tactical guns) or fold?

## 13. Tactical Squads — the canonical numbers (Lane A)

Layers One to Twelve above resolve a battle as a contest between formations. The tactical layer
resolves it as a fight between **squads** on a hex field, and this section is the whole of its
arithmetic. Canonical implementation `base44/shared/tactical.ts`, frontend mirror
`src/lib/tactical/data.js`, both proven by `test/tactical-mirror.test.js`.

**Every table below is printed from the code and read back by that test.** The stat block, the
specialists, the works and the Points Audit are each parsed out of this document and recompared
against the exported tables on every run, so a number that goes stale here is a failing test rather
than a reader's problem. Do not hand-edit a cell: change the table and regenerate.

### 13.1 What a squad is

A squad is **N figures of one type plus up to two specialists**. Figures are the hit pool, in the
Heroes lineage: a section is not wounded, it is *reduced*, and it fights less well for every man it
has lost. A squad type declares what a full-strength section of that kind does; `deriveSquad`
answers what THIS section, at THIS strength, with THIS staff attached, does today.

Two field names on the stat block look alike and are not the same thing, so read them once
carefully. **`armor`** is a number: the resilience the melee and ranged contest pairs against, the
lineage of the old `TROOPS.defense`. **`armour`** is a KEY into the Arms Catalogue armour classes,
and it is the only armour concept the tactical layer is permitted to hold — see 13.9.

### 13.2 The base nine

Nine types ship with the layer. Six of them are drawn from the rifle regiment: the Ministry does not
recruit a mortar man, it retrains a rifleman and issues him a tube. The remaining three are the
vehicle regiments, and each is a **single-figure squad** — one crawler, one gun, one aeroplane.

| Type | Label | From | figures | melee | ranged | range | armor | speed | morale | armour | damageType | armorPen | pts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `riflemen` | Rifle Section | `riflemen` | 10 | 5 | 14 | 7 | 2 | 3 | 11 | `soft` | `kinetic` | 2.5 | 100 |
| `assault` | Assault Section | `riflemen` | 8 | 12 | 10 | 3 | 3 | 4 | 12 | `light` | `kinetic` | 1.5 | 90 |
| `gunners` | Machine-Gun Crew | `riflemen` | 6 | 2 | 18 | 9 | 2 | 2 | 11 | `soft` | `kinetic` | 3 | 85 |
| `scouts` | Scout Section | `riflemen` | 5 | 2 | 6 | 5 | 1 | 6 | 10 | `none` | `kinetic` | 2 | 45 |
| `mortars` | Mortar Team | `riflemen` | 4 | 1 | 12 | 9 | 1 | 2 | 10 | `none` | `fragmentation` | 2 | 55 |
| `pioneers` | Pioneer Section | `riflemen` | 8 | 8 | 9 | 5 | 3 | 3 | 11 | `light` | `explosive` | 2.2 | 100 |
| `crawler` | Diesel Crawler | `crawler` | 1 | 6 | 12 | 10 | 12 | 4 | 12 | `medium` | `kinetic` | 9.5 | 100 |
| `artillery` | Siege Piece | `artillery` | 1 | 1 | 16 | 18 | 3 | 1 | 9 | `light` | `explosive` | 7 | 100 |
| `fighter` | Prop Fighter | `fighter` | 1 | 2 | 13 | 8 | 4 | 8 | 11 | `light` | `kinetic` | 6 | 70 |

`figures` is the squad at full strength and `minFigures`/`maxFigures` bound what a commander may
carve from the pool: 4 to 12 riflemen, 3 to 10 assault, 2 to 8 gunners, 2 to 6 scouts, 2 to 6
mortars, 3 to 10 pioneers, and exactly 1 of each vehicle.

`ranged` and `melee` are **whole-squad** values at full strength, not per-figure ones, and they are
calibrated against the Arms Catalogue rather than invented: an issue-grade line rifle in one pair of
hands is worth about 1.3 of `ranged`, so ten of them are worth about 13 and the rifle section is
written at 14. Ranges are read off the same catalogue — a line rifle reaches 6 to 9 hexes, a belt
gun 8 to 11, a mortar 8 to 13, a field piece 16 to 23.

### 13.3 The five specialists

Attached staff, at most two to a squad. Every one of them is a **number**: a blurb describing an
effect that no field implements would be a rule nobody can resolve.

| Specialist | Label | pts | Numeric mods | What the number does |
| --- | --- | --- | --- | --- |
| `medic` | Field Medic | 12 | `morale +1`, `recoverPerTurn +1` | Returns a figure a turn while unengaged and steadies the test by one. |
| `signaler` | Signaler | 10 | `initiative +3` | Three points of initiative — a signalled section acts before an unsignalled one of the same pace. |
| `commissar` | Ministry Commissar | 14 | `morale +1`, `moraleFloor +11`, `executionToll +1` | The morale target can never derive below the floor; a rout becomes one figure and the section stands. |
| `heavy_gunner` | Heavy Gunner | 16 | `aoeSuppress +1` | One hex of extra radius on suppressing fire. |
| `sapper` | Sapper | 12 | `buildSpeed +1` | A turn off every build order, never below one. |

`morale`, `initiative` and `moraleFloor` land inside `deriveSquad`. `recoverPerTurn`, `aoeSuppress`,
`buildSpeed` and `executionToll` are read from the table by the engine at resolution time —
`squadStaffMods()` stacks all seven in one pass so that no lane writes the stacking rule twice.

### 13.4 The sixteen orders

Thirteen the plan names, plus one signature verb each for the crawler, the gun and the aeroplane,
which would otherwise have had nothing to do that a rifle section could not also do.

| Order | Gated to | uses | dmg | guard | range | aoe | moraleHit | suppress | noMove | turns | indirect |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fire` | any squad | ranged | 1 | 1 | squad | — | 1 | 0.25 | false | 1 | false |
| `assault` | any squad | melee | 1.2 | 0.9 | 1 | — | 3 | 0 | false | 1 | false |
| `hold` | any squad | — | 0 | 1.45 | squad | — | 0 | 0 | true | 1 | false |
| `rally` | any squad | — | 0 | 1.1 | squad | — | 0 | 0 | true | 1 | false |
| `entrench` | any squad | — | 0 | 1.9 | squad | — | 0 | 0 | true | 1 | false |
| `grenade` | `riflemen` / `assault` / `pioneers` | ranged | 0.9 | 1 | 2 | r1 f0.4 | 2 | 0.5 | false | 1 | false |
| `suppress` | `gunners` / `heavy_gunner` | ranged | 0.5 | 1 | squad | — | 4 | 1.5 | true | 1 | false |
| `smoke` | `scouts` / `mortars` | — | 0 | 1 | 4 | r1 f0 | 0 | 0.25 | false | 1 | false |
| `mortar_barrage` | `mortars` | ranged | 1.35 | 1 | squad | r1 f0.35 | 3 | 0.75 | true | 1 | true |
| `bombard` | `artillery` | ranged | 1.5 | 1 | squad | r2 f0.3 | 4 | 1 | true | 1 | true |
| `strafe` | `fighter` | ranged | 1.25 | 0.85 | squad | r1 f0.5 | 3 | 0.5 | false | 1 | false |
| `overrun` | `crawler` | melee | 1.6 | 1 | 1 | — | 5 | 1 | false | 1 | false |
| `build_foxhole` | `pioneers` / `sapper` | — | 0 | 1 | squad | — | 0 | 0 | true | 1 | false |
| `build_trench` | `pioneers` / `sapper` | — | 0 | 1 | squad | — | 0 | 0 | true | 1 | false |
| `build_bunker` | `pioneers` / `sapper` | — | 0 | 1 | squad | — | 0 | 0 | true | 2 | false |
| `build_emplacement` | `pioneers` / `sapper` | — | 0 | 1 | squad | — | 0 | 0 | true | 1 | false |

`dmg` is a **multiplier** on the derived stat named in `uses`, never an absolute. `guard` is a
multiplier on the squad's own defence for the round — standing still is worth 1.45 and digging in is
worth 1.9, while an assault and a strafing run cost you something for the privilege. `range` is an
override in hexes; `squad` means the squad's own reach. An `indirect` order needs no sight line at
all, which is what a mortar is for.

**The gate is a union**, and it is written that way so the roster can grow without this table being
touched. An order is offered when it requires nothing, or when `requires.types` names the squad
type, or when the TYPE names the order in its own `specials`, or when the squad carries a specialist
the order names. The middle two say the same thing from both ends for these nine, and the mirror
test asserts they agree in both directions; a type added later declares only `specials` and is gated
correctly by that alone. Status gating — suppressed, routed, entrenched, already building — belongs
to the engine and is deliberately absent here.

### 13.5 The four works

Raised by a pioneer section, or by any section with a sapper attached.

| Work | Label | cover | blocksLOS | moveCost | buildTurns | infantryOnly | armourClass | mods |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `foxhole` | Foxholes | 1 | false | 0 | 1 | true | `light` | speed unchanged, range +0, suppress +0 |
| `trench` | Trench Line | 2 | true | 1 | 1 | true | `light` | speed unchanged, range +0, suppress +0 |
| `bunker` | Bunker | 4 | true | 1 | 2 | false | `fortified` | speed unchanged, range +0, suppress +0.5 |
| `emplacement` | Emplacement | 2 | false | 0 | 1 | false | `light` | speed set 0, range +1, suppress +0.5 |

`cover` is **added** to the terrain cover of the hex and `moveCost` is **added** to the cost of
entering it; the field generator stamps a work onto the ground and never folds its value into the
tile, so each of these is applied exactly once, at resolution. `mods.speed` is an **absolute set,
not a delta** — `unchanged` leaves the section alone, and the emplacement pins its gun where it
stands in exchange for a hex of reach and a bonus to suppression. `armourClass` is the class a stand
in the work resolves hits against instead of its own, and only for stands whose own class is in
`WORK_ARMOUR_APPLIES_TO`: a work re-classes a man in a greatcoat and never re-classes a hull.

### 13.6 Figures and companies

The macro game counts **companies**; the tactical layer counts **figures**. `FIGURES_PER_COMPANY`
is the conversion and it is keyed by **REGIMENT, never by squad type**:

    { riflemen: 10, crawler: 1, artillery: 1, fighter: 1 }

A squad type's `figures` is its own default size and may differ freely from its regiment's company
size — a mortar team musters four men and a machine-gun crew six, and both fold back through the
rifle company of ten, because both are rifle regiment men on paper. `poolCost(squads)` returns
figures drawn per regiment, with all four keys always present at zero; `toRegiments(squads)`
converts survivors back and **rounds down**, so a battle can lose companies and can never create
one. Nineteen riflemen walk off the field as one company and nine men; nine walk off as nine men.

### 13.7 The Points Audit — computed, never typed

`SquadType.pts` is the cost of the **SQUAD**, not of a figure: a rifle section of ten men is 100
points, and that row is the anchor every other price is set against.

The audit is code. `combatValue(key)` sums six terms, all read from the table:

- **anti-personnel** — `ranged × (1 + range / rangeDivisor)`
- **anti-armour** — `ranged × max(0, armorPen − penFloor) × penWeight`
- **contact** — `melee × meleeWeight`
- **the pool** — `figures × (armor × armorWeight + morale × moraleWeight)`
- **mobility** — `speed × speedWeight`
- **verbs** — `specials.length × specialWeight`

The anti-armour term exists for the same reason the Arms Catalogue prices armour-killing separately
from man-killing: without it a crawler is valued only on the infantry it kills, its gun costs
nothing, and a breakthrough vehicle prices out at half a rifle section. `fairPts` converts that
value into the anchor currency at a rate **derived from the anchor row on every call** — there is no
stored calibration constant to go stale when a stat is re-tuned.

| Type | Combat value | Fair pts | Asked pts | Efficiency |
| --- | --- | --- | --- | --- |
| `riflemen` | 96.35 | 100 | 100 | 1 |
| `assault` | 88.75 | 92.11 | 90 | 1.0234 |
| `gunners` | 81.15 | 84.22 | 85 | 0.9908 |
| `scouts` | 44.15 | 45.82 | 45 | 1.0182 |
| `mortars` | 52.9 | 54.9 | 55 | 0.9982 |
| `pioneers` | 95.225 | 98.83 | 100 | 0.9883 |
| `crawler` | 94.8 | 98.39 | 100 | 0.9839 |
| `artillery` | 95.25 | 98.86 | 100 | 0.9886 |
| `fighter` | 67.55 | 70.11 | 70 | 1.0016 |

Efficiency is fair over asked. The gate is `POINTS_MODEL.efficiencyCap` (1.6) and the widest of
these nine sits inside 3% of exactly priced, which is the point: nothing in the base roster is a
bargain, so a later type that IS one will be visible against them.

### 13.8 The derivations

**Figure scaling.** `ratio = figures / the type default`. Offence is multiplied by
`ratio ** SCALING.offenceExponent` (0.9), so erosion bites sub-linearly: half a section fights at
53.6% of a section, not 50%, because the survivors still have their rifles and still hold their
frontage. `range`, `armor` and `speed` do not scale at all — a two-man mortar team shoots as far as
a four-man one, it simply shoots less often. Morale scales downward with strength by
`SCALING.moralePerStrength`, floored at −3.

**Specialist stacking.** Duplicates count once. The survivors are chosen in **declaration order, not
caller order**, so the derivation is invariant under any permutation of the array and a third
attachment is silently ignored. Additive mods sum; `moraleFloor` takes the maximum, because a floor
is a floor.

**Initiative.** `speed × SCALING.initiativePerSpeed + SCALING.initiativeBase + the signaler`.
Deterministic, and it makes the scout section the fastest thing on foot; the aeroplane precedes
everything, which is what an aeroplane does.

**Points.** `round(type.pts × ratio) + every specialist's pts + round(loadout pts × figures)`.
Linear in figures, because you pay for bodies.

**The arms join.** `deriveLoadout` is per FIGURE. `melee` and `ranged` are therefore multiplied by
the type's DEFAULT figure count to reach whole-squad scale before erosion is applied; `range` is
what one man carries and is taken as it stands; `speed` is a delta; `pts` is a per-figure delta and
is multiplied by the figures ACTUALLY present. A section carrying weapons the catalogue cannot read
falls back to its issue values rather than taking the battle down with it.

**Degenerate input never throws.** An unknown type, a missing squad, zero or negative figures all
return the ten-key zero row.

### 13.9 Armour is somebody else's arithmetic

There is **one** damage model in this repository and it lives in `base44/shared/arms.ts`. This layer
declares an armour class KEY on every stand and every work, and hands that key over. It performs no
subtraction of an armour value, walks no penetration table, looks up no damage-type matrix, and
holds no local multiplier — `resolveSquadHit` builds the weapon-shaped object the catalogue asks
for, looks the target class up by key, and returns what it is told. The mirror test asserts this
mechanically in both files, and proves the consequence rather than restating it: a rifle section
firing on a heavy hull resolves to **zero**, and may still pin the crew.

A hit on a vehicle resolves against the **struck facing**. `struckFacing` is pure hex geometry: it
reads the bearing from attacker to target, compares it with the stand's facing, and names the arc.
`HEX_DIRECTIONS` is asserted equal to the field generator's neighbour order, so the two lanes cannot
drift into disagreeing about which way a hull is pointed. Anything overhead — an aeroplane, a shell
coming down — lands on the top plate whatever the hull is facing.

## 14. The Field Generator *(Lane B — the ground the squads fight over)*

Layer Two gave the battle a *line*; the tactical layer gives it a *place*. `generateField` is one
pure, seeded call that paints a whole set-piece battlefield and hands it back as data:

```js
generateField({ seed, nodeKind, weather, fortBonus, w = 15, h = 11 })
```

Canonical implementation `base44/shared/tacticalField.ts`, frontend mirror `src/lib/tactical/field.js`,
proven in `test/tactical-field.test.js`. **Every number this section refers to lives in one of the five
exported tables — `FIELD`, `TERRAIN`, `PALETTES`, `WEATHER_FIELD`, `WORKS_SEED` — and is deliberately not
restated here.** Read the table; a figure copied into prose is a figure that goes stale.

### 14.1 What a field is

A 15x11 axial hex grid: 165 tiles keyed `"q,r"`, each carrying terrain, cover, elevation, an LOS-blocking
flag and a move cost (`null` = impassable), plus an optional `work` where the defender has dug in. With it
come the two deployment strips — the attacker owns the westernmost three columns, the defender the eastern
three — and a `meta` block recording the inputs, the weather's sight cap and whether fighters are grounded.

Elevation is **three steps, not five**: ground, rise, crest. It is a separate layer from terrain and never
changes cover or movement — its only job is deciding who is shooting *over* whom.

### 14.2 The five palettes — five places, not five reskins

One palette per macro node kind. Each is a weighted terrain distribution plus an `artery` (the metalled
lane carved west to east, which is also the connectivity backbone) and a signature blocking `feature`
painted as ragged radius-1 clusters.

| Node | The board it makes | Signature | Artery |
| --- | --- | --- | --- |
| `city` | Dense and vertical, well over half of it wreckage. The fight is for window-lines; `wall` is the only hard stop the palette paints. | `building` clusters | `road` |
| `town` | Open farmland cut by hedge banks, which are the signature and the only real terrain feature. Buildings are scattered thin, a chapel and a farm at a time. | `hedgerow` banks | `road` |
| `depot` | Rail, hardstanding and drums: almost no natural cover, and the drums are cover until they are lit. | `fuel_tank` farms | `rail` |
| `ruin` | Precursor ground: cratered, waterlogged, slow underfoot, with uncuttable masonry standing where nothing else does. | `precursor_wall` | `road` |
| `crossroads` | Rolling country and the most open board in the set — the armour board. Woods are the only screen there is. | `woods` | `road` |

The design gate is that **a board must stay a battlefield rather than become a maze**: the contract floor
is that at least 55% of every generated field is passable, non-LOS-blocking ground. That is not an
aspiration in a document — it is asserted per board across the whole test corpus, alongside a second,
tighter floor pinned just under the measured worst board, so a palette that quietly got mazier would fail
long before the 55% gate noticed it. The arterial alone accounts for roughly a tenth of every board, which
is why `road` is weighted *down* in the palettes that already run one.

### 14.3 Weather bends sight and ground, never terrain

Weather never repaints a hex. It does three things: caps sight range (`meta.losCap`), taxes soft going, and
grounds aircraft (`meta.groundsFighters` — reported here, enforced by the resolution layer). Metalled lanes
are explicitly exempt from the mud tax; that exemption is the whole reason the arterial is worth having.
Fog is the extreme case — the shortest cap in the table and no movement penalty at all, which turns a
`crossroads` board from an armour duel into a knife fight.

### 14.4 Fortification is dug ground, not a structure

The defender's `fortBonus` seeds trenches and bunkers across its last four columns — the deploy strip plus
the column in front of it, so the line has depth instead of sitting flat on the board edge. Counts come
from `WORKS_SEED`: trenches rise with every level of the bonus, and bunkers appear only from
`WORKS_SEED.bunkerFromLevel` upward.

A work is a **stamp on the ground and nothing else**. It never makes a hex impassable, never blocks sight,
and never folds its value into the tile's `cover` — the tile stays purely terrain-derived. The mechanical
effect of a trench or a bunker lives in the deployables catalogue at 13.5 and is applied at resolution
time. Keeping those two apart is what stops the same defensive bonus being counted twice.

### 14.5 The order is the ruleset

The pipeline runs in a fixed order and the acceptance properties are properties *of that order*: paint ->
artery -> features -> elevation -> weather -> deploy zones -> **normalise the zones** -> works ->
**connectivity repair**. Normalising the zones before stamping works is what makes "no side ever deploys
into a wall" true by construction rather than by luck, and the repair runs last so nothing can re-block
what it opened.

The arterial deserves one line of its own, because it is the step most likely to be broken by a tidy-up: a
lane that drifts one row SOUTH between columns is not adjacent to where it came from — those two hexes are
a distance of two apart — so the generator lays a bridging hex whenever it drifts that way. Remove that and
the lane still looks like a road on a map and stops being a connected chain.

Four properties are proven over a 200-field corpus (every node kind x every weather x eight seeds, with the
fortification level cycled across it), not spot-checked: the same seed returns an identical field; deploy
zones are free of blockers; every deploy hex is reachable from the opposite side; and line of sight is
symmetric. The last is guaranteed structurally — the hex line canonicalises the unordered pair *before*
applying its rounding epsilon, and the elevation rule reads the lower of the two endpoints — rather than
being hoped for and sampled.

### 14.6 What is deliberately not in here

No damage, armour or penetration arithmetic; no squad state; no resolution. Cover is terrain metadata that
the combat math reads, not a combat calculation. The generator is a pure data structure and a set of pure
queries over it — `neighbors`, `hexRange`, `hexLine`, `lineOfSight`, `pathCost` — and every rule that spends
a die roll lives elsewhere.
