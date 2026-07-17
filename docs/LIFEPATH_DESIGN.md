# Rust Legions — The Three Lifepaths (Design Proposal)

> **Status: PROPOSAL.** Extends and partially absorbs `docs/VISION.md` §6 (Political Ideology Lifepath)
> and deepens the shipped faction-creation wizard and generals system. Per the working agreement
> (VISION §9), nothing here is buildable until it is folded into VISION and, slice by slice, into
> `docs/GAME_RULES.md`. Lore authority: `docs/LORE.md`. Tracker: `docs/LORE_TODO.md` §3.7 / L-9.
> All numbers below are illustrative — balance is decided at spec time.

## 0. The Pitch: One Grammar, Three Scales

The existing pieces — the BattleTech-style creation wizard, the ideology axes, generals with traits
and medals, veterancy — are all fragments of one idea. Unify them:

> **Everything that matters in this game is born through a lifepath, develops through choice-events,
> and accretes permanent identity it can never fully shed.**

| Scale | Born via | Develops via | Accretes |
| --- | --- | --- | --- |
| **Faction** | Creation Chapters (wizard) | Assembly sessions, bloc politics, Constitutional Moments | Ideology axes, constitution, reputation |
| **General** | Origin + commission | Career milestones, formative battle events | Traits, medals, epithets, scars, rivals |
| **Army** | Muster | Battle honors, campaign service | Veterancy, standards, column traditions |

One UI grammar (the stage-card / decree modal family already shipped), one data pattern
(stage → choices → axis/trait shifts + lore fragments for the LLM synthesizer + chronicle entry),
three cadences: the faction decides in Assemblies, the general at career milestones, the army after
battles. Every lifepath event writes a War Chronicle chapter — the game's history is literally the
accumulated lifepaths of its actors.

---

## 1. The Faction Lifepath

### 1.1 Creation, deepened: the Five Chapters

The wizard becomes five chapters that walk the faction through the canon timeline (LORE §3), each
choice granting **(a)** ideology axis seeds, **(b)** a perk/flaw pair, **(c)** lore fragments for LLM
synthesis, **(d)** starting-asset variations, and **(e)** bloc strengths (§1.3).

**Chapter I — Origins** *(who were your people before they marched?)*
| Option | Seeds | Flavor of effects |
| --- | --- | --- |
| Seam-cartel | Economy +1 | +Fuel income; combines start warm, parishes cold |
| Parish congregation | Creed +1 | Strong Reliquary Lobby; parish network bonus; No-Patron options gated |
| Still-city exodus | Authority +1 | Extra industry module; "the Rent Remembered" flaw available |
| Waystation league | Economy −1? / neutral | Intel discounts; weak levy |
| Levy remnant | Mobilization −1 | Cheap riflemen; officer shortage flaw |

**Chapter II — The Keel** *(how did your fortress-base come to be?)* — built by charter, inherited
down a lineage, stolen in a mutiny, salvaged from a dead still-city, bought at ruinous debt. Sets a
starting module bias, the keel's name pattern (vow/debt/verdict per LORE §8 — a *stolen* keel bears a
verdict-name), and one permanent quirk (the salvaged keel is cheap to refit but rot-count events fire
on it more often; the indebted keel owes the Combine, who remember).

**Chapter III — The Defining March** *(the crisis that made you)* — a siege broken, a famine winter,
a Wake catastrophe survived, a betrayal by another house. Grants the founding general (§2) with a
matching origin trait, one battle-honor army (§3), and a grudge/bond disposition seed toward an NPC
house.

**Chapter IV — The Creed Question** *(how do your people answer the patron question?)* — pick among
the Four Theories (LORE §2), seeding Creed ±1–2 and gating parish/Synod relations. A **Schism**
option exists at every gated choice: take the "wrong" answer for your origin at the cost of a
permanent internal-dissent flaw (the losers of the schism are still aboard).

**Chapter V — The Charter** *(how are you governed now?)* — council, autocracy, syndicate board,
conclave. Seeds Authority/Economy, names the government in all ministry copy, and fixes the
**Assembly cadence** modifier (autocracies convene rarely but decree hard; councils convene often
and drift).

**Point economy:** perks cost points; **flaws grant points** (GURPS-style): *Blood Debt* (one house
starts hostile), *The Rent Remembered* (garrison caps −1, rot events +), *Mortgaged Keel* (Combine
tithe until paid), *Schismatic* (dissent events seeded). Path dependency: chapter choices gate later
options exactly like constitutional thresholds do in play — the lifepath teaches the ideology system
before turn one.

### 1.2 In play: the Chapters continue (absorbs VISION §6)

VISION §6's Assembly/decree system stands as written (axes, sessions, thresholds, NPC silent
resolution) with these deepenings:

- **Decrees are proposed by blocs, not by nobody** (§1.3). The modal names the proposer: *"The
  Syndicate Bench moves that the foundries be chartered."* Choosing a side shifts axes AND bloc favor.
- **Constitutional Moments:** reaching ±2 on an axis triggers a full Convention event — a named
  document ("the Charter of Day 214") entered in the Chronicle, the passive bonus locked, and gated
  options visibly sealed in the UI. Reform later requires a Reform Convention costing stability
  (dissent events for N days).
- **Chapter cadence:** every ~30–40 in-game days (tunable), a **Chapter event** fires — a
  creation-style stage card (not a decree): a narrative crossroads drawn from game state (first relic,
  base endangered, house eliminated). Same UI as the wizard; the empire keeps living its lifepath,
  literally.

### 1.3 Internal politics: the Blocs

Four standing blocs, strength seeded at creation and shifted by decrees and events:

| Bloc | Wants (axis lean) | Favor high | Favor low |
| --- | --- | --- | --- |
| **The Levy** | Citizen mobilization, council rule | Manpower income +, militia events | Draft riots, desertion ticks |
| **The Syndicate Bench** | Markets, charters | Trade income +, Combine warmth | Capital flight, refit costs + |
| **The Reliquary Lobby** | Restorationist creed | Dig speed +, parish warmth | Consecration protests at digs |
| **The Old Keel** | Professional corps, autocracy | Veteran quality +, general loyalty + | Officer conspiracies, a coup chapter at the extreme |

Blocs make ideology *character-driven*: low-favor blocs generate dissent events, and at rock bottom,
a **Schism chapter** — a bloc departs with a small remnant column that becomes a hostile/neutral minor
force on the map (the game's history generating its own content). Bloc favor is the "stability"
currency the Reform Convention spends.

---

## 2. The General Lifepath

### 2.1 Origins
Every general is commissioned with an origin (keel-born, parish-sworn, still-city exile, levy risen,
purchased commission), granting a starting trait and an **ideology leaning** — parish-sworn generals
lean Restorationist; purchased commissions lean Syndicate. Leanings feed loyalty (§2.4).

### 2.2 Career milestones — choice-driven traits
At milestones (first command, Nth battle, first medal, first defeat), the player chooses the lesson
learned — a stage card for the general: after a costly victory, *"Butcher's Bill"* (+attack, morale
penalty aura) or *"Never Again"* (+defense, refuses high-casualty maneuvers). Traits from milestones
are permanent; the general's sheet becomes a readable biography. (Absorbs tracker idea 3.2: Keel-Born,
Digger's Luck / Red-Flag Discipline as an exclusive pair, Parish-Sworn.)

### 2.3 Formative battle events
Battle outcomes roll development events, weighted by what actually happened: **wounded** (scar traits
— trade a stat for a story), **captured** (ransom/exchange enters the Envoy Desk — diplomacy content
for free), **disgraced** (a court-martial *decree* — the political and military lifepaths touch),
**rivalry** (two generals in the same battle theater develop a rivalry: bonuses apart, friction
together), **protégé** (a veteran general seeds a junior who inherits one trait at succession).

### 2.4 Loyalty and the Marshalate
Generals hold opinions. Ideology distance between a general's leaning and the faction's axes drifts
**loyalty**; decrees delight some commanders and disgust others (the Chronicle notes who). Low
loyalty: refused maneuvers, resignation, defection with the Old Keel bloc's coup chapter as the
ceiling. High loyalty: the **Marshalate** — court appointments (Supreme Marshal, Master of Signals,
Keel Engineer, First Envoy) granting empire-wide effects and putting faces on the ministries. Every
appointment is itself a small decree the blocs care about.

### 2.5 Time
With the v2.x day calendar, careers have length. Aging is coarse (Prime → Seasoned → Old Guard
bands, long campaigns only): Old Guard generals gain strategy, lose vigor, and their succession —
death, retirement, the protégé stepping up — is a scheduled Chronicle event, not a stat deletion.

### 2.6 Mortality, the Pool, and Succession *(maintainer directive — ratified direction)*

> **Directive:** generals are mortal and can die; on death the army is either taken over by a
> candidate from a pool of eligible officers, or the army is dissolved.

**Mortality — all generals, Marshals included.** Death vectors: the army-destruction fate roll
(shipped 50%, to be retuned by rank and vehicle), Headhunt fate rolls (`COMBAT_DESIGN` §5 — the
table gains *killed*), wounds that worsen without a Company Surgeon, Old Guard age events, and
court-martial verdicts. **This overrides the shipped "Marshals never die" rule (GAME_RULES §9)** —
a Marshal's death fires a faction Chapter (*the Marshalate Question*) with bloc-flavored succession
candidates and an interregnum penalty until it resolves.

**The Officer Pool.** A per-faction roster — capped ~3–6, visible as the **Staff College** panel,
zero upkeep (Tedium Law) — of eligible candidates, each with an origin, a leaning, and modest stats.
The pool is fed by the game, never by thin-air RNG: **protégés** (§2.3 — first claim on their
mentor's army) · **named staff aides** (`GEAR_LIBRARY` §1 Staff Bay — they were riding right there) ·
**risen colonels** contributed by Seasoned+ armies, their stats derived from that army's actual
history · **bloc offers** (the Old Keel proposes professionals; communes propose the levy-risen) ·
**paid commissions** (the shipped 4 MP recruit action now draws from the pool rather than
generating). Ideology shapes the bench: Professional Corps — fewer, better; Citizen Levy — more,
greener.

**Succession.** A general killed mid-battle leaves the army fighting on leaderless: −2 skill, −15
morale, no signatures, no staff effects. Afterward (or on any death outside battle) the succession
check runs in priority: protégé → the dead commander's own aide → any willing pool candidate —
willingness gated by ideology distance and bloc favor, so a faction mid-schism may find its colonels
declining the honor. An accepting successor takes command: the army keeps its number, standard,
honors, and traditions (army-lifepath continuity), the new commander begins their own milestone
track, and the column takes a brief "new colours" morale dip.

**Dissolution.** If the pool is empty or every candidate declines, **the army dissolves** (per
directive): companies disperse as garrison to the nearest friendly supplied zone — Cut Off armies
instead resolve as a *stragglers* event, some returning over the following days, some not. The
standard retires to the keel's **Hall of Standards**; a later column re-mustered under the same
number re-raises it, restoring honors but never veterancy.

**Strategic consequence (intended).** Officer attrition becomes a war aim. Headhunting stops being
morale math: hunt the colonels and the pool runs dry, and dry pools dissolve armies. Protégés become
insurance, aides become heirs, and the Levy's deep green bench turns from flavor into a
survivability doctrine.

---

## 3. The Army Lifepath

Armies accrete identity beyond veterancy:

- **Battle honors:** named engagements embroidered on the standard, granting nothing or a hair of
  morale — the point is the standard itself, listed on the army sheet ("the 3rd Column — *Hundredweight,
  Site 112, the Winter Bridges*").
- **Column traditions:** earned passives from service history — dig a relic out: *Reliquary Guard*
  (+defense on excavation sites); survive a Wake: *Red-Flag Discipline* (the army version); winter
  cut off from supply and live: *Eaters of Boots* (reduced attrition). One or two per army, ever.
- **Lineage rules:** a destroyed column can be **reformed** at the base: it keeps its number,
  standard, and honors, loses veterancy and traditions. Names persist; strength doesn't. (This makes
  wiping out a storied enemy column *feel* like something — and makes your own 3rd Column worth
  protecting beyond its stats.)

---

## 4. Continuity Glue (what makes it one system)

1. **Creation seeds everything:** axes, bloc strengths, the founding general with origin and leaning,
   one honored army, the keel's name and quirk. Turn one is already Day N of a story.
2. **Decrees ripple down:** faction choices move general loyalty and bloc favor; general events
   (court-martial, coup) fire faction chapters back up. The three scales exchange events.
3. **The Chronicle is the spine:** every lifepath event at every scale writes a chapter. A finished
   game's chronicle reads as a saga because it is one — the herald (HERALD_VOICES.md) quotes it.
4. **The LLM synthesizer's job widens:** at creation it writes the founding myth; in play it writes
   chapter texts, epithets, and standards from real event data — always grounded, never inventing
   events (herald rule 2 applies everywhere).

## 5. Implementation Sketch (for the eventual handoff)

- **Data:** one `LifepathEvent` shape (scope: faction|general|army; stage id; choices[]; axis/trait/
  favor deltas; chronicle text; lore fragments) reused across all three scales — the decree pipeline
  in VISION §6.4 generalized. Bloc favor lives beside `ideology` in `Game.factionSlots`. Generals
  gain `origin, leaning, loyalty, milestones[], relationships[]`. Armies gain `honors[], traditions[]`.
- **Effects** plug into the existing `compileMods` pipeline — no parallel modifier system.
- **UI:** the wizard's stage cards and the ministry decree modal are the same component family;
  chapters, milestones, and conventions reuse them. The Ideology panel gains a Blocs strip; general
  sheets gain a biography tab; army sheets gain a standard.
- **Slicing order (suggested):** (1) creation Five Chapters rework — self-contained, no engine
  changes; (2) general milestones + battle events — touches battle resolution hooks only;
  (3) blocs + proposer-attributed decrees — extends §6 as it's built; (4) army honors/traditions;
  (5) Marshalate, loyalty, schism/coup chapters — last, they depend on all of it.

## 6. Open Questions

1. Points budget and flaw caps at creation; can flaws exceed +N points?
2. Chapter cadence vs. Assembly cadence — one clock or two? (Leaning: decrees frequent and small,
   chapters rare and large.)
3. Loyalty depth: full stat with thresholds, or three bands (loyal / restive / disloyal)?
4. Do NPC houses run the full system silently, or a cheap approximation? (Leaning: approximation —
   bloc drift by doctrine, no general loyalty.)
5. Aging: always on, or only in games flagged "long campaign"?
6. Schism remnant columns: persistent minor faction, or scripted nuisance that resolves?
7. How much of this predates v2.x? Slices 1–2 are hex-era safe; blocs/chapters want the day calendar.
8. Officer Pool cap: flat, or grown by ideology (Mobilization axis) and decrees?
9. Willingness math: ideology distance threshold, bloc-favor modifier, and can gold overcome scruples?
10. Marshal interregnum: what breaks while the Marshalate Question is unresolved, and for how long?
11. Pre-emptive merging: may a player dissolve-by-choice into another army (folding companies in)
    rather than risk the succession check? (Leaning: yes — voluntary consolidation is good play.)
