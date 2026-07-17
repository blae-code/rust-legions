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
5. Does base capture transfer a *running* project, or only materials? (Leaning: materials only —
   projects are keel-specific.)
6. Should Tier I nodes migrate to Tier II at all, or leave the shipped tree untouched in slice 1?
7. NPC houses: full tech-hunger AI, or scripted class preferences per doctrine? (Leaning: preferences —
   Reclamation hunts Wakes, Combine trades fragments, Synod hoards Ciphers. Cheap and in-character.)
