# Rust Legions — The Three Books (Tech Tree Design Proposal)

> **Status: PROPOSAL.** Vastly deepens the shipped doctrine research tree (`GAME_RULES.md` §19) and
> State Armory (§20), and gives VISION §4 (Precursor Technology) its economic engine. Per the working
> agreement, fold into VISION before building. Lore authority: `docs/LORE.md` (esp. §3, §5).
> Cross-links: `LIFEPATH_DESIGN.md` (Creed axis, Reliquary Lobby, decrees). Tracker: §3.8 / L-10.
> All numbers illustrative.

## 0. The Pitch

LORE §3 (locked): *humanity copied what it could pry open, and what it could pry open was engines,
armor, and fire. A single intact relic is a page of the original book, not our smudged copy.*

Make the tech tree that sentence. Three tiers — three relationships to the precursors:

| Tier | What it is | Gated by | In-fiction |
| --- | --- | --- | --- |
| **I. Doctrine** | The existing research tree — tactics, logistics, industry refinement | Time (off-turn, as shipped) | Our own wits. The smudged copy, improved at the margins. |
| **II. Patterns** | Reverse-engineering branches | **Fragments** recovered from digs, by relic class | Their scraps, pried open and copied. |
| **III. Relic Projects** | End-game gear and victory works | **Intact Objects** held aboard the keel | Their works, built *around* — never understood. |

Nothing at Tier II or III can be researched with time alone. The tech tree stops being a background
clock and becomes the **demand side of the map game**: you go to war because your tree is hungry for
a specific class of buried thing, and someone else is standing on it.

---

## 1. Currency: Fragments and Objects

Excavation (VISION §4) yields two different things:

- **Fragments** — common, classed, fungible. `Engine fragments`, `Cache alloys`, `Cipher shards`,
  `Wake cores`. A stackable resource per class (a fourth resource family beside Manpower/Steel/Fuel,
  but *found, not produced*). Fragments are consumed by Tier II analysis.
- **Intact Objects** — the rare, unique, named relics (LORE §5: *Object N, "folk name"*). Never
  fungible, never produced. An Object either **mounts** (Engine-class → unique base modules, as
  already designed), **keys a Relic Project** (§4), or is **stripped** — destroyed for a large
  fragment payout (the Reclaimer temptation; see §5).

**Sources**, in rough order of volume: dig sites (fragments, occasional Objects) · Anchor Fields and
still-city ruins (rich, rot-risky — LORE §4/§6) · **Wake salvage** — defeating or surviving a Wake
yields Wake cores, the *only* source of the weapons tier: the best guns come from the things that
tried to kill you · Envoy Desk trade (fragments tradeable; Objects tradeable as a diplomatic event) ·
base capture (the victor takes the lab's contents — resolves part of VISION §3.3's stripping
question) · the Combine's relic black market (tracker 3.6: sell Objects for resources/fragments at
rates published in-fiction by Advisories).

## 2. The Three Tiers

### Tier I — Doctrine (shipped tree, reframed)
Unchanged mechanically: off-turn research, always available. Reframed in UI copy as the **Doctrine
Book**. Some existing deep nodes migrate up to Tier II where they fictionally belong (anything that
reads as "wonder tech" today).

### Tier II — Patterns (the new middle game)
Pattern branches unlock by **spending classed fragments to analyze**, then research normally
(off-turn — preserves the off-turn design goal). Class → branch mapping:

| Fragment class | Pattern branches (examples) |
| --- | --- |
| **Engine** | Locomotion & power: crawler drivetrains, base speed, fuel efficiency, rough-terrain traversal |
| **Cache** (alloys) | Metallurgy & industry: armor patterns, unit cost reduction, refit speed |
| **Cipher** (shards) | Signals & command: probe range, intercept quality, command radius, initiative |
| **Wake** (cores) | Weapons: lance batteries, bombardment patterns, the nasty end of the tree |

Each analyzed pattern names its lineage (tracker 3.5, absorbed): *"Hundredweight-pattern drivetrain,
analyzed from Engine fragments, Site 112, Day 214."* The State Armory certifies Tier II prototypes
exactly as it does today — the Armory becomes the place where Patterns turn into fieldable gear.

### Tier III — Relic Projects (end-game gear)
A Relic Project is a **project card, not a research node**: it requires (a) a specific intact Object
class held in the base's Laboratory, (b) Tier II prerequisites, (c) heavy conventional resources, and
(d) **on-clock construction time** — N in-game days during which the project is visible to enemy
intelligence (probes/intercepts can reveal it) and dies with the base if the base falls. End-game
gear is therefore a *race that can be interrupted*, not a quiet unlock. Illustrative catalog:

- **The Land-Dreadnought** *(requires an Engine-class Object)* — a second, lesser mobile platform: a
  relic crawler unit with base-like durability. The only multi-"keel" a faction can field.
- **Lance Battery** *(Wake core Object)* — precursor weapon mounted on the base or a dreadnought;
  bombardment that ignores fortification. The Wake's revenge, pointed outward.
- **The Long Ear Array** *(Cipher Object)* — map-wide signals: all intercepts upgraded, enemy relic
  projects revealed, march orders occasionally read.
- **The Exodus Works** *(multiple Cipher Objects + thresholds)* — **the victory megaproject: the Key
  itself** (LORE v2 — the houses fight to leave the dead world). A *buildable thing on the map's
  clock*, not an abstract counter, its form following the Creed axis (§5): Restorationists raise
  **the Beacon** (signal the Absent — demand the Recall, or reawaken a lifting site); Reclaimers
  raise **the New Ignition** (a human foundry aimed at the sky — the first hull of our own).
  The Covenant of Locks wins by *wrecking* either. Everyone can see the days remaining. The endgame
  writes itself.

## 3. The Laboratory Loop (tech lives aboard the keel)

The **Laboratory module family** (VISION §3.2, previously unbuilt) becomes the gate for Tiers II–III:
lab tier sets fragment analysis speed, how many Objects can be *housed*, and whether Relic Projects
can run. Consequences, all intentional:

- Your tech tree is physically aboard your keel. **Base captured ⇒ housed Objects and fragment
  stockpiles are taken; running projects are lost.** The gravest thing that can happen to a faction
  (VISION §3.1) now includes its future.
- Module bay competition gets real: lab vs. armor vs. industry is now a strategy identity choice.
- The Synod's whole cultural posture (hoard, shelter, outlast) becomes a mechanical doctrine: max
  lab, max armor, buy Ciphers, sit on the Restoration Works.

## 4. Ideology & Lifepath Cross-Links

- **Creed axis teeth** (LIFEPATH_DESIGN / VISION §6): Restorationist (+) — analysis cheaper, stripping
  Objects **forbidden past +2** (constitutionally sealed); Reclaimer (−) — pattern research faster,
  stripping yields more, the Beacon unavailable. "The Reliquary Question" decree (VISION §6.3) becomes
  the tree's fork in decree form.
- **The Reliquary Lobby** (blocs): favor rises with housed Objects and consecration choices, crashes
  when Objects are stripped or sold to the Combine — internal politics polices your tech economy.
- **Chapters:** first Object housed, first Wake survived, Restoration Works begun — all fire faction
  Chapter events. The herald announces enemy relic projects in-voice ("the Synod observes that a
  light burns on the {faction} keel that has not burned in four hundred years").

## 5. The Map Demand Loop (why this makes the hunt the game)

Class-specific hunger turns geography into strategy: weapons factions must court Wakes (the escalation
ladder, tracker 3.4, becomes farmable risk); Key-seeking factions must control Cipher-rich Anchor Fields
(scrap-parish diplomacy suddenly matters — LORE §6); everyone needs Engine fragments to keep pace on
the macro map. Wars start over survey reports. Rumor intel (waystations, tracker 3.3) becomes
prospecting. The convoy of fragments home to the keel is a raidable thing. Every system already
designed now has a reason to be fought over.

## 6. Implementation Sketch

- **Data:** fragments as a per-class counter on `factionSlots`; Objects as entity instances with
  `class, designation, folkName, state (buried|held|mounted|keyed|stripped)`; Tier II analysis and
  Relic Projects extend the shipped research-tree data shape (nodes gain `fragmentCost` /
  `objectKey` fields) — one tree UI, three visually distinct books.
- **Engine touchpoints:** excavation yields (VISION §4 mechanics when built), lab module family,
  project clock on `endTurn`/day tick, capture-transfers-lab on base fall, Envoy Desk fragment trade.
- **Slicing order:** (1) fragments + Tier II analysis on the *existing* tree — hex-era safe, digs can
  stub as special tiles until v2.x; (2) Laboratory module family + Object housing; (3) Relic Projects
  minus victory; (4) the Exodus Works replacing/joining the victory conditions (with v2.x, per
  VISION §3.4's victory rethink); (5) creed gates + bloc reactions (wants LIFEPATH slices).

## 7. Open Questions

1. Fragment classes: exactly four (mirroring relic classes) or fewer, merged for simplicity?
2. Do fragments travel (raidable convoys — richer, heavier) or teleport to the keel on dig completion?
3. Exodus Works (the Key): sole headline victory, or one of two-three paths (conquest/base-domination
   surviving)? Interacts with VISION §3.4 and §8.7.
4. Object count per map size; how many Relic Projects should a normal game actually see finished?
5. ~~Does base capture transfer a *running* project, or only materials?~~ **CLOSED 2026-09-02 —
   MATERIALS ONLY. Decided by the operator in the fourth wave; recorded here as a decision, not a
   leaning.** When a fortress-base is boarded and taken, the captor loots **only the running project's
   unspent materials** — the conventional resources and fragments still lying loose in the cradle. The
   **project itself, all of its accumulated progress, and the housed Object its tier gate required are
   LOST.** Nothing about the works transfers. They were built into a bay whose keel has changed hands,
   and a Relic Project is keel-specific in the strong sense: it cannot be inherited, resumed, sold,
   ransomed or re-founded from where it stood. A captor who wants the Land-Dreadnought starts it from
   the beginning, on its own keel, having first found its own Object of the right class.
6. Should Tier I nodes migrate to Tier II at all, or leave the shipped tree untouched in slice 1?
7. NPC houses: full tech-hunger AI, or scripted class preferences per doctrine? (Leaning: preferences —
   Reclamation hunts Wakes, Combine trades fragments, Synod hoards Ciphers. Cheap and in-character.)

**On Q5, and what it costs the rest of this document.** The ruling is deliberately harsh, and the
reason is §5's demand loop: if a captured keel handed over a finished-in-three-days Land-Dreadnought,
the cheapest route to a relic would be to let a rival pay for it and then board him, and the hunt this
document exists to create would collapse into a raid on whoever is furthest along. Materials-only keeps
boarding worth doing — a taken cradle is a real windfall of fragments and heavy conventional stock —
while leaving the *works* something a house can only get by digging for it. It also settles two things
§10's appendix already asserted in passing and can now say plainly: a project **dies with the keel**
whether the keel is destroyed or captured (the two outcomes are identical for the works), and the
housed Object that satisfied the tier gate is **consumed by the loss**, not returned to the map. The
loser does not keep the Object; the winner does not receive it.

Three consequences for other lanes, all of them already written down rather than left implied:

- **The herald's problem is canon.** `docs/HERALD_VOICES.md` Shared Rule 7 binds all thirteen packs:
  a house that takes a keel may report **metal**, and a house that loses one may report **a hole**.
  **No pack may report a captured project as an inheritance**, because no house ever inherits one.
  Each pack carries one intercept for the loss, filed under whichever mood that house would file it in.
- **The Codex says it in-world.** `src/lib/wiki/entries.js` entry `works-lost-with-the-keel`.
- **The platform lane must implement the loss, not just the loot.** `RELIC_PROJECTS` need a build clock
  (`PLATFORM_HANDOFF.md` G5); this ruling says what the capture branch of that clock does, and it is a
  deletion. See the Lane H block of `PLATFORM_HANDOFF.md`.

*(Filed by Lane H under `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane H Amendment 2 — this lane's claim on
this question and this note, and on nothing else in this file.)*

---

## 8. Cost Curve (LOCKED)

Research points accrue at **1 per completed full round**. Cost is fixed by tier and **uniform across all
five branches** — a tier-3 node in Signals costs exactly what a tier-3 node in Armament costs. Nothing in
`base44/shared/catalog.ts` carries a per-tech price, and `test/catalog-mirror.test.js` fails any row that
tries to.

The **spine** is one node per tier — the cheapest four-node line from a tier-1 root to a tier-4 capstone,
ignoring every side node and every cross-branch prerequisite. It is the floor, not the branch:

| Tier | RP | Cumulative down the spine | Spine reached ~turn (1 RP/round) |
| --- | --- | --- | --- |
| 1 | **3** | 3 | ~**3** |
| 2 | **4** | 7 | ~**7** |
| 3 | **6** | 13 | ~**13** |
| 4 (capstone) | **9** | 22 | ~**22** |

**⚠ 22 RP is the spine, not a branch, and it is not what a capstone actually costs.** A branch holds
more than four nodes, and every capstone names ≥1 prerequisite in a *different* branch — so the real
bill for a first capstone is its whole transitive prerequisite closure. Cheapest is **Saturation
Barrage at 25 RP** (it borrows Rationalized Foundries from Industry); the dearest is the Pattern Book
at **36 RP**. Clearing a branch outright costs more again:

| Branch | Nodes | RP to clear the branch |
| --- | --- | --- |
| Armament | 5 | **28** |
| Industry | 5 | **28** |
| Logistics | 4 | **22** |
| Signals | 5 | **28** |
| Reclamation | 6 | **32** |
| **The whole tree** | **25** | **138** |

These figures are not typed here by hand twice: `test/catalog-mirror.test.js` parses this table and
fails if it disagrees with the sum of `TECHS` costs per branch, and it asserts the whole-tree total
appears verbatim in `docs/GAME_RULES.md` and in the `base44/shared/catalog.ts` header (drift guard 7 —
the number lives in one place and the other two are checked against it).

**No single game finishes the tree, and that is the intent.** At 1 RP/round a house reaches its first
capstone around turn 25 and a second — in a branch it has already part-paid for — some fifteen rounds
later; **138** rounds is longer than any campaign this ruleset expects to run. Research is therefore a
*commitment*, not a checklist — the interesting question is never "what have I unlocked" but "which two
branches did I give up".

Two structural brakes sit on top of the curve and are what stop a rush:

- **Cross-branch capstones.** Every tier-4 node names ≥2 prerequisites, at least one of them in a
  *different* branch. The top of Armament is not reachable by climbing Armament alone.
- **Creed locks.** Four techs and four decrees are held by a single Departure. A house sees roughly
  three quarters of the catalog; no (branch, tier) cell is *only* creed-locked, so nobody is ever offered
  an empty shelf.

## 9. Fragment Economy

Tier `I` is bought with conventional resources alone. Everything at `II:` demands **exactly one** classed
fragment and nothing else, per the `docs/GEAR_LIBRARY.md` gate; Tier `III` relic projects demand several.

| Tier gate | Fragment class | Source (§1) |
| --- | --- | --- |
| `II:Cache` | `cache` — alloys | Sealed imperial stores; still-city ruins |
| `II:Eng` | `engine` — drivetrain scrap | Dig sites, the commonest class |
| `II:Ciph` | `cipher` — shards | Anchor Fields, marked stones |
| `II:Wake` | `wake` — cores | Defeating or surviving a Wake. Nothing else yields them |

Demand implied by the shipped catalog (`ARMORY_ITEMS` + the four `RELIC_PROJECTS`, which share their
`cost` objects — the counts below are per Armory row, not double-counted):

| Class | Rows demanding it | Total units demanded | Rows |
| --- | --- | --- | --- |
| `engine` | **4** | 18 | Launch Rails 3 · Land-Dreadnought 6 · Lance Carriage 3 · New Ignition 6 |
| `cache` | **4** | 17 | Sloped Casemates 3 · Pattern Shop 2 · Land-Dreadnought 4 · New Ignition 8 |
| `wake` | **3** | 13 | Wakewatch Act 3 · Lance Carriage 6 · Beacon 4 |
| `cipher` | **2** | 11 | March Klaxons 3 · Beacon 8 |

**A finding, reported rather than papered over.** The Tier-II layer is Engine- and Cache-heavy because
`GEAR_LIBRARY.md` §2 is: of the bay modules it names, three gate on `II:Eng`, two on `II:Cache`, one on
`II:Ciph` and **none** on `II:Wake` (the Wake-class gear in that document is all ♦ Tier III). Cipher and
Wake demand is therefore concentrated in the endgame — the Beacon, the Lance Carriage — which is
consistent with §5's map-demand loop (weapons factions must court Wakes; Key-seekers must hold
Cipher-rich Anchor Fields) but leaves the *middle* game short of reasons to hunt those two classes.
This lane placed one `II:Wake` row (the Wakewatch Act) rather than inventing bay modules another
document owns. **If the middle game needs more Cipher/Wake pull, the fix belongs in `GEAR_LIBRARY.md`
§2 as new Laboratory and Aura bay modules, not in a decree.**

## 10. Appendix A — [PROPOSED — awaiting platform wiring] GAME_RULES draft

Shipped verbatim as `docs/GAME_RULES.md` §23. Kept here as the design record; the file is the delivery.

- **Five branches, four tiers.** Armament, Industry, Logistics, **Signals**, **Reclamation**. Costs
  3/4/6/9 RP by tier. One capstone per branch: Saturation Barrage, the Continuous Casting Order,
  Grand Quartermastery, the Intercept Bureau, the Pattern Book.
- **Cross-branch prerequisite rule.** Every capstone names ≥2 completed doctrines, ≥1 from another
  branch. Ordinary nodes may name one, several, or none, and a prerequisite always sits at a strictly
  lower tier — which is what makes a cycle impossible.
- **Creed locks.** A locked node is offered only to a house holding that Departure: the Vigil Watch
  (Recall), Bonded Manifests (Finished Ledger), Sealing Protocols (Flight), the Stripping Yards
  (Discarding). No branch-and-tier cell holds *only* locked nodes.
- **Decrees move an axis.** Every Armory decree carries an ideology axis and a direction (`VISION` §6.1).
  Enacting it applies its effects and shifts that axis one step toward the named pole. All eight poles
  are purchasable; four decrees are creed-locked and each pole keeps at least one decree that is not.
- **Tier gates and fragments.** `I` costs conventional resources only. `II:Cache`/`II:Eng`/`II:Ciph`/
  `II:Wake` each additionally cost their own class of fragment. `III` is a relic project.
- **Relic Projects.** Four: the Land-Dreadnought (Engine, 24 days), the Lance Carriage (Wake, 18 days),
  the Beacon (Cipher, 40 days, Recall only) and the New Ignition (Cache, 40 days, Discarding only).
  Each needs a housed Object of its class, ≥2 completed doctrines of which ≥1 is Reclamation, heavy
  conventional resources and ≥2 classes of fragment. Construction runs on the map's clock, is visible to
  enemy probes and intercepts, and dies with the keel.

## 11. Appendix B — Codex entries for Lane H

**Lane H owns `src/lib/wiki/entries.js`.** These fifteen entries are **already shipped into that file**
as one appended tail block (`// ——— LANE G: doctrine, decrees & relic projects ———`); this appendix is
the design record and the place to revise the copy, not a hand-over queue. Status is `canon` only where
this document or `docs/LORE.md` already supports the claim, and `thin` everywhere this lane extended
past the bible.

| id | Title | Category | Status | Covers |
| --- | --- | --- | --- | --- |
| `branch-signals` | The Signals Branch | war | thin | New branch |
| `branch-reclamation` | The Reclamation Branch | leavings | thin | New branch |
| `relic-project-land-dreadnought` | The Land-Dreadnought | leavings | canon | §2 Tier III |
| `relic-project-lance-carriage` | The Lance Carriage | leavings | thin | §2 names it the *Lance Battery* |
| `relic-project-the-beacon` | The Beacon | leavings | canon | §2 Exodus Works, Restorationist fork |
| `relic-project-the-new-ignition` | The New Ignition | leavings | canon | §2 Exodus Works, Reclaimer fork |
| `decree-emergency-powers` | The Emergency Powers Act | powers | thin | Authority +1 |
| `decree-sealed-sites` | The Sealed-Sites Order | powers | thin | Authority +1, Flight |
| `decree-standing-corps` | The Standing Corps Act | powers | thin | Mobilization +1 |
| `decree-charter-of-passage` | The Charter of Passage | powers | thin | Economy +1, Finished Ledger |
| `decree-reliquary-act` | The Reliquary Act | powers | thin | Creed +1 |
| `decree-writ-of-consecration` | The Writ of Consecration | powers | thin | Creed +1, Recall |
| `decree-breaking-yards` | The Breaking-Yards Act | powers | thin | Creed −1, Discarding |
| `decree-ordinance-common-metal` | The Ordinance of Common Metal | powers | thin | Creed −1 |
| `decree-wakewatch` | The Wakewatch Act | powers | thin | Economy +1, `II:Wake` |

Cross-links were chosen to knit the new corpus into the old rather than into itself: the two branch
entries point at `war-sciences`, `fog-of-war`, `dig-sites` and `the-leavings`; the two Exodus forks point
at `the-key`, `four-departures` and at each other; every creed-locked decree points at `four-departures`.
`test/catalog-mirror.test.js` asserts that **every** `see` target in the whole array resolves, so the
corpus stays 100% link-clean.

## 12. Consumer follow-ups (for the UI / platform lane)

**Three** shipped call sites are wrong against this catalog. **None is Lane G's file and none was
touched.** All three are latent today only because the shipped tables had no array prereqs and no
fragment costs; the moment `catalog.ts` is wired in they are visible bugs. Two of them are the same
defect in two places: `affords` and `costString` both filter `RESOURCE_KEYS`, so a Tier-II item's
fragments are missing from the affordability check **and** from the price the player is shown.

| Site | What it does | Why it breaks | Fix |
| --- | --- | --- | --- |
| `src/components/game/research/TechCard.jsx:8` | `const locked = tech.prereq && !(research.completed \|\| []).includes(tech.prereq)` | With an **array** `prereq`, `includes` compares an array against strings and is always false, so all 9 array-prereq techs — **including every capstone** — render permanently locked. | `prereqList(tech).every((p) => completed.includes(p))`, importing `prereqList` from `@/lib/doctrine.js`. |
| `src/components/game/research/ArmoryPanel.jsx:9` | computes `affords` over `RESOURCE_KEYS` only | `cost.fragments` is invisible, so every `II:*` and `III` row reads as affordable and the purchase fails server-side instead. | Consume `fragmentCost(item)` from `@/lib/armory.js` alongside the three conventional resources. |
| `src/lib/units.js:42` (called from `src/components/game/research/ArmoryPanel.jsx:38`) | `costString` maps over `RESOURCE_KEYS` only | The same filter one layer down, on the **price tag** rather than the check: `pattern_shop` renders as "8 STL + 4 FUE" and `the_new_ignition` as "16 MAN + 40 STL + 24 FUE", with the classed fragments invisible in the displayed cost. | Append the `fragmentCost(item)` entries to the rendered string, or render fragments as a second line beside it. `units.js` is not Lane G's file and was not touched. |

Two display notes for the same lane, neither a bug: `DoctrinePanel`'s branch grid is `sm:grid-cols-3` and
now holds **5** branches, and `ArmoryPanel`'s kind grid is `sm:grid-cols-2` and now holds **3** kinds.
Both wrap and render correctly; both would read better retuned.
