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
