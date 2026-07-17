# Rust Legions — Lore & Content Tracker

> **This is a living document.** It tracks the state of worldbuilding and content design: what is
> locked canon, what is proposed, what mechanics/item ideas are banked, and what work remains. It sits
> between `docs/LORE.md` (locked lore canon) / `docs/VISION.md` (rules north star) and implementation.
>
> **Workflow:** commit this file as `docs/LORE_TODO.md`. At the start of any lore/content session
> (claude.ai or Claude Code), read this file first. Every session that changes state updates this file
> and appends to the changelog (§7). Ratified lore folds into `docs/LORE.md`; approved rules ideas go
> docs-first into `docs/VISION.md` / `docs/GAME_RULES.md` before any code (working agreement, VISION §9).

**Lore markers:** `[LOCKED]` canon · `[PROPOSED]` awaiting ratification · `[DRAFTING]` · `[REJECTED]`
**Idea-board markers (§3):** `[IDEA]` raw · `[SPEC'D]` numbers drafted · `[APPROVED]` docs-first ready · `[SHIPPED]`

---

## 1. Canon Anchors — LOCKED

Base canon from `docs/VISION.md` §2, expanded in `docs/LORE.md` (authoritative for detail):

- **[LOCKED]** Abandonment premise; nomadic great powers in fortress-bases; settlements as non-power polities; industrial-grade hope; ash-grey + signal-red; Creed axis as lore spine; diegetic day calendar. *(VISION §2 / LORE §0–§1)*
- **[LOCKED — AMENDED v2]** **Canon directive (2026-07-16):** humanity was the *ward of a vast interstellar empire* that pilfered the planet and *suddenly left*, leaving scraps and ruins; the world is spent; humanity is dieselpunk-bound but sky-aspirant; the great houses fight to find **the Key** to leaving the dead world. **Amended standing rule:** the Empire's existence, wardship, extraction, and sudden departure are canonical FACT; forever unanswered: *why the suddenness*, why wardship, the Empire's name/fate, and whether anything returns. *(LORE v2 §0.1)*
- **[LOCKED — REWORKED v2]** The Four Theories become the **Four Departures** — the Recall / the Finished Ledger / the Flight / the Discarding — readings of *why the Empire left*, mapped to creeds and houses; patron name-set retained (Wardens/Landlords/Absent), "the Site" added (imperial designation for the world). *(LORE v2 §2)*
- **[LOCKED — EXTENDED v2]** Era timeline: **the Wardship** (duration unknown) → **the Withdrawal** (the sudden departure, date lost) → Quiet Centuries → Ignition (0 F.I.) → Cartel Wars → First March (141 F.I., Siege of the Hundredweight, the First Keel) → Long March era. **Present year: 383 F.I.** Dieselpunk tech = badly reverse-engineered precursor scrap. *(LORE §3)*
- **[LOCKED]** Ground-rot ("the Rent" / rot-counts): mechanism never explained; small settlements, moving powers, dead still-cities. *(LORE §4)*
- **[LOCKED]** Relic taxonomy: Caches / Engines / Ciphers / Wakes; "Object N + folk name"; red-flag protocol. *(LORE §5)*
- **[LOCKED]** NPC houses: Iron Reclamation (aggressive), Charter Combine (economic), Bastion Synod (defensive), with ideology seeds and named keels. *(LORE §7)*
- **[LOCKED]** Settlement cultures: burn-towns, mining combines, farm communes, waystations, scrap-parishes, still-cities; Anchor Fields. *(LORE §6)*
- **[LOCKED — DIRECTIVE 2026-07-16]** **The Reckoning:** 36-hour days; ten-day weeks (the Empire's quota cycle — lift-day was the tenth day); months of 4 ten-days; 10 months = 400-day solar year; two moons — the First Light "the Lamp" (broad, slow, pale) and the Second Light "the Coal" (small, fast, ash-dark); dark-runs, vigil eclipses, "between the Lamp and the Coal." Months numbered officially, folk-named regionally (never a master list). *(LORE v2 §3.1)* **Spec rule:** all "every N days" knobs across the design docs snap to ten-day multiples at spec time; one turn remains one (36-hour) day per VISION §5.2.
- **[LOCKED]** Keel naming: "the [Name], [Ordinal] Keel of [House]"; names are vows/debts/verdicts. *(LORE §8)*

> Proposals 2.1–2.7 were ratified in bulk per maintainer ("proceed", 2026-07-16). Drafting-invented
> details (year 383 F.I., "Siege of the Hundredweight", house keel names, glossary terms) are
> canon-by-default but flagged for maintainer review — amend before content ships.

## 2. Lore Proposals Awaiting Ratification

### 2.8 The Roster — [PROPOSED] (see `docs/design/FACTION_ROSTER.md`)
Extends LORE §7 from three houses to ten (adds the Covenant of Locks, Signal Ascendancy, Commonweal
March, Salvage Court, Emberwright Union, Long Procession, Outrider Compact — all four theories
covered, all three doctrines reused, keels named to pattern) and names ten minor polities on the
locked settlement cultures (Hundredweight Bottoms, the Nine Cradles, Tarpool, the Gray Commons,
Crossloom, Vault-of-Winters, the Chandlery, Redwater Digs, the Quiet Parish, Kettleharrow). On
ratification: houses fold into LORE §7, minors into LORE §6-adjacent, and seven herald voice packs
are owed (L-2 extension). Includes customization architecture: prebuilt majors are saved Five-Chapters
lifepaths; custom minors are settlement templates in the map editor.

## 3. Rules & Content Idea Board

> **Scope.** Lore canon lives in `LORE.md`; *rules* canon lives in `docs/GAME_RULES.md` (implemented)
> and `docs/VISION.md` (planned). This board is upstream of both — a bank so mechanics and item ideas
> aren't lost between sessions. Pipeline: `[IDEA]` → `[SPEC'D]` (numbers drafted here or in a spec
> sheet, L-8) → `[APPROVED]` (folded into VISION/GAME_RULES) → handed to Claude Code (§5) → `[SHIPPED]`.
> Balance is decided at SPEC'D, never at IDEA — bank freely.

### 3.1 Relic items (feeds L-3 seeds; mechanics per VISION §4)

**Engines — unique base modules (found, never built):**
- `[IDEA]` **Object 44, "the Patient Engine"** — industry module: on-board production continues while the base is moving (normally halted).
- `[IDEA]` **"the Deepwell Heart"** — reactor module: base movement costs no Fuel; engine tier above anything buildable.
- `[IDEA]` **"the Long Ear"** — aura module: +N scout/probe range from the base; intercepts occasionally reveal enemy march orders.
- `[IDEA]` **Object 9, "the Choir"** — aura module: friendly armies in base supply range take reduced morale loss (the men say the humming steadies them; nobody asks what hums).
- `[IDEA]` **"the Anchor's Tooth"** — armor module: base immune to bombardment damage; boarding assaults against it fight one extra "deck."

**Caches (one-off windfalls):**
- `[IDEA]` **Sealed fuel bunker** — flat +X Fuel; small chance flagged as Wake on opening (see 3.4).
- `[IDEA]` **Pattern-alloys** — next N units built cost −1 Steel each.
- `[IDEA]` **The Quartermaster's Vault** — instantly refits one army to full veterancy equipment (mechanical form TBD).

**Ciphers (victory progress + triggers):**
- `[IDEA]` **"the Cartographer's Stone"** — reveals all dig-site *rumors* map-wide; +victory progress; fires "The Reliquary Question" decree if not already resolved.
- `[IDEA]` **"the Census of the Quiet"** — victory progress; permanently improves settlement dispositions (proof someone kept the records of the lost centuries).

**Wakes (hazards — pair with 3.4 events):**
- `[IDEA]` **"the Warden of Site 112"** — dormant machine army spawns hostile at the dig when excavation passes a threshold.
- `[IDEA]` **"the Beacon"** — on disturbance, broadcasts the excavator's base position to all factions for 3 days.

### 3.2 General traits, epithets & medals (extends shipped generals system)
- `[IDEA]` **Keel-Born** — bonus when fighting within the base's supply aura (grew up on the treads).
- `[IDEA]` **Digger's Luck** — +excavation speed when the general's army works a site; slightly worse Wake outcomes (they push it).
- `[IDEA]` **Red-Flag Discipline** — reduced/negated Wake event damage (inverse of Digger's Luck; the two should be mutually exclusive).
- `[IDEA]` **Parish-Sworn** — better scrap-parish and commune dispositions; small morale penalty vs. Synod forces.
- `[IDEA]` **Epithet system** — medals accrete into an earned epithet displayed with the name ("Vashenko *of the Hundredweight*"), generated from actual battle history.

### 3.3 Settlement interactions (v2.x verbs — extends trade/coerce/raid/garrison)
- `[IDEA]` **Buy intel (waystations)** — spend resources to reveal fog nodes/segments or a faction's queued march (waystations as the map's information market).
- `[IDEA]` **Provisioning pact (farm communes)** — ongoing Manpower/supply trickle; broken pacts tank commune dispositions map-wide (they talk).
- `[IDEA]` **Tithe of scrap (parishes)** — parishes tithe salvage to Restorationist-leaning factions; refuse Reclaimer-creed factions entirely.
- `[IDEA]` **Gate toll (still-cities)** — pay for passage/resupply inside the walls; garrisoning a still-city triggers ground-rot events (3.4) — the walls aren't the reason nobody conquers them.

### 3.4 Events & hazards
- `[IDEA]` **The Rent comes due** — over-garrisoned location (threshold TBD) accrues rot-counts: attrition + morale drain until dispersed. Makes ground-rot mechanical, not just lore.
- `[IDEA]` **Machine-sleep** — armies excavating >N consecutive days risk morale events with flavor drawn from the four theories (what the dreams "mean" depends on who's reporting).
- `[IDEA]` **Wake escalation ladder** — ignored red-flag protocols escalate: first warning event, then hazard, then catastrophe. Rewards patience, punishes the Digger's Luck playstyle.
- `[IDEA]` **Signals panic** — after a Wake catastrophe anywhere on the map, one garbled POOR-confidence intercept fires (HERALD_VOICES.md garble template) — lore surface for free.

### 3.5 Units & armory content
- `[IDEA]` **Pattern lineage** — State Armory prototypes carry historical pattern names ("Hundredweight-pattern crawler", "141 levy rifle"); pure flavor, zero balance cost, deep lore payoff.
- `[IDEA]` **Salvage detachment** — support unit: improves excavation speed and Cache yields; near-worthless in battle. A unit you escort, not fight with.
- `[IDEA]` **Signals wagon** — support unit: extends probe range; enables intercept-related actions (pairs with "the Long Ear" and 3.3 intel buying).

### 3.6 Economy & misc
- `[IDEA]` **Relic black market** — sell found relics to the Charter Combine NPC for resources instead of keeping them: an anti-victory-progress temptation, priced in-fiction by Combine Advisories.
- *(deferred to VISION — do not duplicate here)* convoy/sea-transport stopgap (VISION §7.1.1), neutral war market 3:1 (§7.1.3), stalemate protection (§7.1.4).

### 3.7 Lifepath depth — MAJOR PROPOSAL (see `docs/design/LIFEPATH_DESIGN.md`)
- `[SPEC'D]` **The Three Lifepaths** — one grammar at three scales (faction / general / army): Five-Chapter creation rework with flaw point-buy and path dependency; in-play Chapters + bloc-proposed decrees + Constitutional Moments (absorbs VISION §6); general origins, milestone choice-traits, formative battle events, loyalty & the Marshalate, aging/succession; army battle honors, column traditions, lineage-preserving reform rules. Absorbs idea 3.2 (traits/epithets). Numbers illustrative — awaiting maintainer review, then fold into VISION and slice per the doc's §5 order. **Directive ratified (2026-07-16): generals are mortal (Marshals included — overrides GAME_RULES §9 "Marshals never die"); death → succession from the Officer Pool (protégés, aides, risen colonels, bloc offers, commissions) or the army dissolves. See LIFEPATH §2.6.**

### 3.8 Tech tree depth — MAJOR PROPOSAL (see `docs/design/TECH_DESIGN.md`)
- `[SPEC'D]` **The Three Books** — three-tier tech tree tied to the precursor hunt: Tier I Doctrine (shipped tree, time-gated), Tier II Patterns (gated by classed *fragments* from digs — Engine/Cache/Cipher/Wake classes map to locomotion/industry/signals/weapons branches), Tier III Relic Projects (end-game gear keyed by *intact Objects* housed in the Laboratory module: Land-Dreadnought, Lance Battery, Long Ear Array, and the **Restoration Works** — the relic victory as a buildable, interruptible, creed-shaped megaproject). Tech lives aboard the keel: base capture takes the lab. Absorbs ideas 3.5 (pattern lineage) and 3.6 (relic black market); Wake salvage makes 3.4's escalation ladder farmable risk. Awaiting maintainer review; fold into VISION §4/§19-adjacent, slice per doc §6.

### 3.9 Economy depth — MAJOR PROPOSAL v2 (see `docs/design/ECONOMY_DESIGN.md`)
- `[SPEC'D]` **Working the Ground v2** — Stellaris: Nomads-style arkship harvesting per maintainer direction: the keel projects a harvest footprint drawing deposits directly into the stockpile; capped draught columns harvest into their own holds on auto-cycling circuit assignments and haul home (slow, visible, raid-bait); deposits deplete *temporarily* (a season, telegraphed on the Ledger) then recover — the map is pasture, and the graze→deplete→march rhythm is the game's heartbeat. Harvest rights replace v1 sourcing: contract / tribute / open ground, with incidents for grazing claimed ground; Company Works cut (the keel *is* the works). Adds skim-while-marching, denial grazing, and the readable **swath** (named to avoid the Wake-relic collision). Tedium Law retained. v1 superseded same date. **Amendment (same date):** trade requires the Meet — goods/rights exchanges (resources, fragments, Objects, harvest rights) execute only with keel-to-counterparty proximity; negotiation stays radio-range; agreed deals persist as auto-executing pending consignments; waystations as customary meet-grounds; betrayal at the meet possible and expensive.

### 3.10 Combat depth — MAJOR PROPOSAL (see `docs/design/COMBAT_DESIGN.md`)
- `[SPEC'D]` **The Shape of Battle** — layered upgrade of the shipped mass-battle engine (GAME_RULES §9), built against a per-battle decision budget (5–14 decisions, every one a read): (1) a reveal-time **counterplay web** turning maneuvers from stat trades into weighted RPS with hand-history UI and readable AI personalities per roster house; (2) **the Line** — three terrain-anchored fronts with weighting presets, weight shifts, and breakthroughs; (3) reserves, timed commitment surges, and the Guard; (4) **arms as verbs** (Barrage / crawler Shock / fighter Strafing reveal / rifle Spade); (5) Headhunt vs. command vehicles feeding general lifepath wounds/captures; (6) endings by decision — fighting withdrawal, rout with standard capture, pursuit choices; (7) approach layer (ground choice, tendency intel, weather forecast); (8) **boarding assaults = the same engine deck-by-deck** (resolves VISION §3.3/§8.3); (9) Field Orders for async defense + auto-resolve. Garrison combat deliberately stays fast. Slice 1 (counter web + history + personalities) is hex-era safe and ships alone.

### 3.11 Supply & siege depth — MAJOR PROPOSAL (see `docs/design/SUPPLY_SIEGE_DESIGN.md`)
- `[SPEC'D]` **The Sinews and the Noose** — graded supply states (In Supply / Extended / Foraging / Cut Off) replacing the binary, with **deadlining** (machines fail before men die; restored on resupply); the envelope built from the keel, forward depots (capped, torchable), and supply-column assignments; foraging as real grazing with harvest-rights consequences; siege warfare created from nothing — investment, visible stores clocks, works-vs-sortie card decisions, Summons, relief triangles, and Honors/Occupation/Sack terms with bloc and disposition teeth; **keel encirclement** as the summit (fence it in its own swath, starve the stockpiles, breakout on the COMBAT Line or boarding assault at the end — the only intact-capture path); the raiding small war; siege/bridging trains; winter as mutual misery. Slices 1–2 hex-era safe. Tedium Law: states not beans, clocks not chores.

### 3.12 Gear & upgrade library — CONTENT DRAFT (see `docs/design/GEAR_LIBRARY.md`)
- `[SPEC'D]` **The Quartermaster's Ledger** — ~140 items across ten categories (generals/vehicles/staff aides, fortress modules incl. four proposed new bays, economy graze gear, logistics columns/depots/roads, industry fittings, manufacturing patterns, vehicle kits & support classes, infantry kit & specialist companies, macro-army standards & fittings, battle-map consumables), every item tier-gated to TECH_DESIGN ([I]/[II:class]/[III]/[A]) and slotted into a shipped or proposed system with slot-count caps against christmas-treeing. Absorbs ideas 3.1 and 3.5; ~11 unique Objects named consistent with relic pacing. Numbers deferred to L-8 spec sheets; needs a per-slice cut-list before any handoff.

### 3.13 Calendar-driven mechanics (from the Reckoning directive)
- `[IDEA]` **Seasonal weather weighting** — the shipped weather table reweights by month (snow heavy in the Ninth/Tenth/First, rain in the thaw months); winter sieges and winter forage rules key off the month band, not a coin flip.
- `[IDEA]` **Night-sky states** — computed alongside weather on the moons' cycles: *bright night* (full Lamp: interception +, ambush −), *dark-run* (Coal only: raids, runner convoys, and Fox ambushes +, march risk +), *vigil eclipse* (rare: settlements close, no Meets, herald goes strange). Cheap state, many hooks.
- `[IDEA]` **Ten-day cadence snap** — Assembly sessions, siege work cards, market repricing, and depletion clocks quoted in ten-days on every UI surface; the Ledger and Chronicle date all entries *Day N, Xth Month, 383 F.I.*
- `[IDEA]` **Lift-day observance** — settlements keep the tenth day differently by creed (parish vigils, Combine settlement of accounts, Reclamation abolition attempts as decree fodder); a quiet worldbuilding pulse on a fixed beat.
- *(parked to SEA)* the Coal and the Lamp drive tides — canonical hook for the naval expansion's timing mechanics.

### 3.14 The Lift-Day Press — DIRECTIVE PROPOSAL (see `docs/design/PRESS_DESIGN.md`)
- `[SPEC'D]` **Weekly digest per maintainer directive:** every ten-day (publishing on lift-day — the old manifest day; founding legend "MANIFEST No. 1: THE COUNTING CONTINUES" pending ratification), an immersive broadsheet popup: private Week in Review (Chronicle-templated), private deterministic economic Projection (Ledger math, no LLM in the numbers), and three shared-world clippings from three papers — **the Manifest** (record, dry, damns with documentation), **the Crossloom Courant** (trade sheet, numerate, sly), **the Red Flag** (penny dreadful, lurid, uncannily right ~1-in-3). Witness rule = press fog-of-war (deeds near settlements/routes/Meets make the papers; the deep waste doesn't; the Red Flag prints unwitnessed rumor at low reliability). Reputation-in-print amplifies only existing mechanics. Zero decisions in the popup; full morgue archive; slice 1 ships without LLM. Three press style packs owed to HERALD_VOICES.

## 4. Deliverables Backlog

### L-1 — `docs/LORE.md` — **[DRAFTED — pending maintainer review]**
- [x] Full draft (2026-07-16) — [ ] review pass, amend flagged details — [ ] commit + cross-link from VISION §2

### L-2 — Herald voice packs — **[DRAFTED — pending review]**
- [x] Full draft (2026-07-16 → `HERALD_VOICES.md`) — [ ] review — [ ] commit as `docs/lore/HERALD_VOICES.md` — [ ] → §5 H-1

### L-3 — Relic seed data
- [ ] Read `base44/entities/` schemas to match conventions (needs local repo — Claude Code task, or paste a schema here)
- [ ] Promote 3.1 items to SPEC'D; write 12–20 seeds across the four classes
- [ ] Wake event sketches (pair with 3.4)

### L-4 — Decree flavor library
- [ ] 15–20 decrees in ministry voice tagged to the four axes; Creed decrees drawing on the four theories
- [ ] Map the four shipped Armory decrees onto axes (VISION §8.9)

### L-5 — Field Manual / codex lore entries (VISION gap §7.1.6)
- [ ] Entry list + diegetic unlock mapping (relic finds / settlement contact)
- [ ] Write entries as conflicting in-world documents

### L-6 — Name generators
- [ ] Places · generals + epithets (pairs with 3.2) · keels (pattern locked) · settlements per culture

### L-7 — Lifepath wizard lore hooks
- [ ] Audit lifepath stages against LORE.md (Claude Code task) — [ ] add creed-flavored options feeding LLM synthesis

### L-8 — Rules idea spec sheets *(new)*
- [ ] For each §3 idea the maintainer promotes, draft a numbered spec (costs, thresholds, edge cases) ready to fold into VISION/GAME_RULES — the bridge between this board and Claude Code.

### L-9 — Lifepath depth design *(new)* — **[DRAFTED — pending maintainer review]**
- [x] Full design proposal drafted (2026-07-16 → `LIFEPATH_DESIGN.md`): Five Chapters, blocs, general & army lifepaths, continuity glue, implementation sketch, open questions
- [x] Mortality/succession directive integrated as §2.6 (2026-07-16); COMBAT §5 fate table and GEAR aide question updated to match
- [ ] Maintainer review; answer its §6 open questions (points budget, cadence, loyalty depth, NPC approximation, aging, schism persistence, v2.x split, pool caps, willingness math, interregnum, voluntary merging)
- [ ] Fold into `docs/VISION.md` (expand/replace §6); commit doc as `docs/design/LIFEPATH_DESIGN.md`
- [ ] Slice 1 spec (creation Five Chapters — engine-safe) → §5 handoff

### L-10 — Tech tree depth design *(new)* — **[DRAFTED — pending maintainer review]**
- [x] Full design proposal drafted (2026-07-16 → `TECH_DESIGN.md`): three tiers, fragment/Object economy, Laboratory loop, Relic Project catalog, Restoration Works victory, ideology cross-links, slicing
- [ ] Maintainer review; answer its §7 open questions (fragment classes, convoy vs. teleport, victory paths, project transfer on capture, NPC approximation)
- [ ] Fold into `docs/VISION.md`; commit doc as `docs/design/TECH_DESIGN.md`
- [ ] Slice 1 spec (fragments + Tier II on existing tree — hex-era safe) → §5 handoff

### L-11 — Economy depth design *(new)* — **[DRAFTED — pending maintainer review]**
- [x] v1 drafted, then **superseded by v2 same date** per maintainer direction (Stellaris: Nomads harvest model): keel footprint, draught columns, temporary depletion, harvest rights, swath
- [ ] v2 maintainer review; answer §10 open questions (depletion duration, footprint scaling, column caps/crew, skim rate, Deep-Survey Wake risk, NPC circuits, settlement exemption, trade range R, NPC↔NPC binding, column-carrier relaxation)
- [ ] Fold into `docs/VISION.md`; commit doc as `docs/design/ECONOMY_DESIGN.md`
- [ ] Slice 1 spec (deposits + keel footprint + depletion/recovery + Ledger v1, hex-era) → §5 handoff

### L-12 — Faction roster *(new)* — **[DRAFTED — pending ratification of 2.8]**
- [x] Full roster drafted (2026-07-16 → `FACTION_ROSTER.md`): 10 majors with ideology seeds/doctrine/keels/herald notes, 10 minors with hooks, customization architecture, open questions
- [ ] Maintainer ratification of 2.8 (names, seeds, theory/doctrine spread); answer roster §4 open questions (doctrine AI stretch, seed counts, voice-pack timing, sharing, keel chassis variance)
- [ ] Fold houses into LORE §7 and minors into LORE; commit doc as `docs/design/FACTION_ROSTER.md`
- [ ] Extend HERALD_VOICES.md with seven new packs (blocks on ratification)

### L-13 — Combat depth design *(new)* — **[DRAFTED — pending maintainer review]**
- [x] Full design proposal drafted (2026-07-16 → `COMBAT_DESIGN.md`), grounded in fetched GAME_RULES §5–§12/§21: seven layers + boarding assaults + AI/async + integration map + slicing
- [ ] Maintainer review; answer its §12 open questions (counter magnitudes, front count scaling, round timers, Strafing timing, standard recapture, Guard cost, Barrage-vs-bombardment)
- [ ] Fold into `docs/VISION.md`; commit doc as `docs/design/COMBAT_DESIGN.md`
- [ ] Slice 1 spec (counterplay web + hand history + AI personalities) → §5 handoff

### L-14 — Supply & siege design *(new)* — **[DRAFTED — pending maintainer review]**
- [x] Full design proposal drafted (2026-07-16 → `SUPPLY_SIEGE_DESIGN.md`): graded states, deadlining, envelope, siege clocks/works/terms, keel encirclement & breakout, raiding, engineering, slicing
- [ ] Maintainer review; answer its §10 open questions (stores math, siege tick cadence, depot caps, recovery cap, winter forage, encirclement definition, besieged off-turn play)
- [ ] Fold into `docs/VISION.md`; commit doc as `docs/design/SUPPLY_SIEGE_DESIGN.md`
- [ ] Slice 1 spec (graded states + deadlining + Forage, hex-era) → §5 handoff

### L-15 — Gear & upgrade library *(new)* — **[DRAFTED — pending maintainer review]**
- [x] Full library drafted (2026-07-16 → `GEAR_LIBRARY.md`): ten categories, tier gates, slot caps, integration notes, open questions
- [ ] Maintainer review: cull/rename pass (the fastest way to review 140 items is to strike the ones that don't spark)
- [ ] Answer its open questions (bay count, consumable economy, aides as characters, per-slice cut-list)
- [ ] Commit as `docs/design/GEAR_LIBRARY.md`; per-slice cut-lists feed L-8 spec sheets

### L-16 — Lift-day press design *(new)* — **[DRAFTED — pending maintainer review]**
- [x] Full design drafted (2026-07-16 → `PRESS_DESIGN.md`): three papers, popup panels, witness rule, reputation-in-print, morgue, sample clippings, slicing
- [ ] Maintainer review; ratify the founding legend (§0) into LORE; answer §8 open questions (fourth paper, clipping scaling, player press actions, NPC reading, Red Flag leak rate)
- [ ] Extend HERALD_VOICES.md with three press style packs (few-shot from doc §6)
- [ ] Commit as `docs/design/PRESS_DESIGN.md`; slice 1 (popup + review + projection, no LLM) → §5 handoff after review

## 5. Handoff Queue → Claude Code

- **H-1 — Wire herald voice packs into `npcHerald`.** Doc: `docs/lore/HERALD_VOICES.md` (see its Implementation Notes). Touches `base44/functions/npcHerald*`. *Prereq: maintainer review.*
- **H-2 — Commit lore docs.** `LORE.md` → `docs/LORE.md`; `HERALD_VOICES.md` → `docs/lore/HERALD_VOICES.md`; this file → `docs/LORE_TODO.md`; add pointers from `VISION.md` §2 and `CLAUDE.md` so agents read LORE.md before generating content.
- **H-3 — (queued)** Relic entity seeds — blocked on L-3 schema check.
- *(rules ideas from §3 enter this queue only via L-8 spec sheets + docs-first per VISION §9.)*

## 6. Parked / Rejected

- *(parked)* Air & Sea expansion lore — hold until v2.x lore ships; keep patron theories compatible with deep-sea vaults (VISION §7).
- *(rejected)* — none yet.

## 7. Changelog

- **2026-07-16 (p)** — Drafted the Lift-Day Press (`PRESS_DESIGN.md`) per weekly-digest directive: three papers (Manifest / Crossloom Courant / Red Flag), lift-day popup (week review + economic projection + clippings), witness rule as press fog-of-war, the morgue. Logged as §3.14 and L-16; press style packs owed to HERALD_VOICES; founding legend pending ratification.
- **2026-07-16 (o)** — Calendar directive integrated: the Reckoning (36-hour days, ten-days, 4×10 months, 400-day year, the Lamp and the Coal) canonized in LORE §3.1 with the ten-day as the Empire's quota cycle; glossary extended; §3.13 idea batch opened (seasonal weather, night-sky states, ten-day cadence snap, lift-day observance); ten-day spec rule added to anchors.
- **2026-07-16 (n)** — CANON DIRECTIVE integrated: LORE.md rewritten as v2 (the Empire, the Wardship, the Withdrawal, the Four Departures, the Site, the leavings, the Key as headline prize on a spent world). TECH victory renamed the Exodus Works; FACTION_ROSTER goals realigned; canon anchors amended. Herald packs and codex entries to be re-checked against v2 at their next touch.
- **2026-07-16 (m)** — Maintainer directive ratified: general mortality + Officer Pool succession or army dissolution (LIFEPATH §2.6). Overrides shipped "Marshals never die" and thin-air recruitment — engine change + patch dispatch required at implementation. COMBAT Headhunt fate table and GEAR aide status updated in sympathy.
- **2026-07-16 (l)** — Drafted the Quartermaster's Ledger (`GEAR_LIBRARY.md`): ~140 tier-gated items across all ten requested categories, slot-capped, absorbing ideas 3.1/3.5. Logged as §3.12 and L-15.
- **2026-07-16 (k)** — Drafted The Sinews and the Noose (`SUPPLY_SIEGE_DESIGN.md`): graded supply, deadlining, depots/columns/forage, full siege system, keel encirclement/breakout/boarding endgame. Logged as §3.11 and L-14. Interlocks with ECONOMY (graze/swath/depots) and COMBAT (Line/withdrawal/boarding).
- **2026-07-16 (j)** — Full-muster combat turn per maintainer: fetched shipped combat rules (GAME_RULES §5–§12/§21) and drafted The Shape of Battle (`COMBAT_DESIGN.md`) — counterplay web, fronts/breakthroughs, reserves/Guard, arms-as-verbs, Headhunt, decision endings, approach layer, boarding-assault resolution of VISION §3.3/§8.3. Logged as §3.10 and L-13.
- **2026-07-16 (i)** — Drafted the Roster (`FACTION_ROSTER.md`): 10 major houses (7 new) spanning all four theories, 10 named minor polities, prebuilts-as-saved-lifepaths customization architecture. Logged as lore proposal 2.8 and L-12; seven herald voice packs owed on ratification.
- **2026-07-16 (h)** — Maintainer directive integrated: proximity-gated trade ("the Meet") added to ECONOMY_DESIGN §4 — goods move only keel-to-keel/settlement in range; negotiation unrestricted; pending consignments auto-execute. Sections renumbered; three open questions added.
- **2026-07-16 (g)** — Economy design rewritten as v2 per maintainer direction: Stellaris: Nomads-style keel/column harvesting with temporary depletion forcing constant movement. Company Works cut; sourcing modes reframed as harvest rights; "swath" coined (avoids Wake collision). §3.9 and L-11 amended.
- **2026-07-16 (f)** — Drafted Working the Ground economy design (`ECONOMY_DESIGN.md`): deposits, sourcing modes, flows, Tedium Law. Logged as §3.9 and L-11. Resolves TECH_DESIGN open q.2 (fragment flows).
- **2026-07-16 (e)** — Drafted the Three Books tech design (`TECH_DESIGN.md`): fragment/Object economy, three-tier tree, Relic Projects incl. the Restoration Works victory megaproject. Logged as §3.8 and L-10. Ideas 3.5, 3.6 absorbed; 3.4 Wake ladder cross-linked.
- **2026-07-16 (d)** — Drafted the Three Lifepaths design proposal (`LIFEPATH_DESIGN.md`): deepened faction creation, in-play political chapters/blocs, general careers, army traditions. Logged as §3.7 and L-9. Idea 3.2 absorbed by the proposal.
- **2026-07-16 (c)** — Added §3 Rules & Content Idea Board (idea → spec'd → approved → shipped pipeline) seeded with ~25 starters across relics, traits, settlement verbs, events, units, economy. Added L-8 (spec sheets). Renumbered §§3–7.
- **2026-07-16 (b)** — Proposals 2.1–2.7 ratified in bulk ("proceed"). LORE.md + herald voice packs drafted. Year set 383 F.I. Handoff queue opened (H-1, H-2).
- **2026-07-16 (a)** — Document created; canon anchors imported from VISION §2; proposals raised; backlog opened.
