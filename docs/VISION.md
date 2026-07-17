# Rust Legions — Design Vision & Roadmap

This is the creative north star for the project. `docs/GAME_RULES.md` describes what is *currently implemented* (the v1.x "Vanilla Front" era); this document describes where the game is *going*. When the two conflict, this document wins for future work — but nothing here is implemented until it ships as a Field Amendment (patch) and the rules doc is updated.

## 1. High Concept

> **"The best of Stellaris, on a single world — and that world is Foxhole + Iron Harvest + Mortal Engines."**

A dieselpunk grand-strategy game where the great powers are not nations rooted in capitals, but **nomadic factions dwelling in colossal mobile fortress-bases**, roaming an abandoned world in a hunt for buried precursor technology. Touchstones:

- **Mortal Engines / Stellaris "Nomads"** — mobile fortress-bases as the seat of power
- **Stellaris** — modular customization, doctrine-driven factions, personality-rich AI
- **Twilight Imperium / Stellaris ground combat** — capturing a base requires committed troops, not just firepower
- **Foxhole / Iron Harvest / Dust Front** — gritty dieselpunk logistics warfare (already the visual identity: near-monochrome ash-grey + signal red)
- **Sky Captain and the World of Tomorrow** — the planned Air expansion
- **Waterworld / Foxhole naval** — the planned Sea expansion

## 2. Lore Bible

- **The world:** a habitable planet occupied by humans who were *brought here* by an unknown power — and then abandoned, long ago. Nobody remembers who the patrons were or why they left.
- **The prize:** ancient, immensely powerful technology lies buried and hidden across the world — precursor caches, dead machines, sealed vaults. It is the most fought-over resource on the planet.
- **The powers:** the great factions are **nomadic**. Each resides in a mobile fortress-base and roams the world hunting precursor tech, each believing it will be the one to *restore humanity*. Their doctrines (aggressive / economic / defensive) are philosophies about how that restoration should happen.
- **The settled:** permanent settlements exist, but they are **not political powers**. They are local polities that harvest the resources around them — mining towns, fuel camps, farm communes. They trade with, submit to, or are raided by whichever fortress rolls past. They project no power beyond their own ground.
- **Tone:** worn machinery, rationed shells, ministry communiqués. Hope is real but industrial-grade — humanity's restoration will be riveted together, not wished into being.

## 3. The Core Redesign: Mobile Bases

The single largest planned change to the vanilla rules: **permanent capitals are replaced by mobile fortress-bases.**

> **Status: a vanilla-era slice has SHIPPED.** Every faction now owns a fortress-base with three module
> bays (armor / engine / industry), a Refit Yard, prototype modules certified via the off-turn State
> Armory, base movement across friendly ground, prime-supply-hub status, and wreck-on-capture
> (see `docs/GAME_RULES.md` §18–§20). Still unbuilt from this section: boarding assaults, base loss
> replacing the capital rules, module stripping, aura/lab/hangar module families, and NPC base AI.

### 3.1 What a mobile base is
- Each faction has exactly one — its capital, factory, supply heart, and home, on treads.
- It occupies a tile and can **move across the map** (slowly — this is a fortress, not a jeep).
- It is the faction's **prime supply hub** (the supply network re-anchors as it moves) and its primary production site.
- Its loss is the gravest thing that can happen to a faction.

### 3.2 Modularity (the Stellaris part)
Bases have **module slots**. Modules are installed/swapped at cost and alter the base's abilities and its empire-wide impact. Candidate module families (design space, not final; armor/engine/industry shipped):

| Family | Example effects |
| --- | --- |
| **Engines** ✓ | base movement rate, rough-terrain traversal |
| **Armament** (partial ✓ as Armor) | base defense/attack values, bombardment capability |
| **Industry** ✓ | income bonuses, unit cost reduction, on-board production |
| **Hangar / Barracks** | garrison capacity, muster-from-base, army cap bonus |
| **Laboratory** | precursor-tech excavation speed, relic analysis |
| **Habitat** | manpower income, general recruitment quality |
| **Aura modules** | empire-wide or radius effects (e.g. +speed to nearby armies — ties into the planned initiative system) |

Precursor relics (see §4) can grant **unique modules** that cannot be built, only found.

### 3.3 Capturing a base (the Twilight Imperium part)
- A base **cannot be taken by bombardment or attrition alone** — it must be stormed by committed ground troops (a boarding assault: a special mass-battle type fought deck by deck). *(Current vanilla behavior: the base is simply wrecked when its zone is captured — the boarding assault replaces this.)*
- A captured base changes hands or is salvaged — captured modules may be stripped, transferred, or destroyed (design decision pending).
- **Open question:** does losing your base eliminate the faction, or leave a crippled nomad remnant with a chance to retake it? (Leaning: crippled remnant with a grace period — more dramatic.)

### 3.4 Knock-on effects on vanilla rules (must be resolved when implementing)
- **Capital income rule** ("capital lost ⇒ no income") becomes a base rule.
- **Supply networks** currently anchor to capitals/forts/barracks — the base becomes the primary, moving anchor (it is already *a* hub; it must become *the* anchor).
- **Map-control victory (60%)** may be demoted or replaced: for nomads, holding dirt matters less than holding *tech*. A relic-based victory ("restore humanity") likely becomes the headline win condition.
- **Permanent settlements** replace neutral garrison tiles: minor polities with a disposition, tradeable/raidable/coercible, that harvest their tile's resources.
- **NPC AI** must learn to move its base, install modules, and race for dig sites.
- **Game setup** changes: factions start with a base + escort, not a capital + territory ring.

## 4. Precursor Technology (the abandonment premise made mechanical)

- **Dig sites / caches** seeded across maps (visible rumors + hidden finds; fog of war and probes matter more).
- **Excavation:** parking a base or dedicated army on a site over multiple turns; contested digs are the intended flashpoint of the mid-game.
- **Relics:** grant unique base modules, one-off powers, or victory progress. Fought over, stolen when a base falls.
- **Victory:** assembling enough precursor tech to "restore humanity" — the intended primary win condition post-redesign.

## 5. The Macro Map: Graph Under the Hood, Painterly World on Top

> **Status: sandbox live, merged.** The macro map lives at the **War Table** (`/star-map`,
> `src/lib/macro/`, `src/components/starmap/`): one orbital 3D campaign world (picked at operation
> setup) carrying the node-and-route graph, day-rate Dijkstra itineraries with overnight camps
> (slowest ground element sets the pace), radial node orders menus (stage column / march / anchor
> base), great-circle march trails, and a tactical overlay (supply-artery betweenness analysis +
> ranked capture objectives). It is a client sandbox only — nothing is wired into `gameEngine` yet.
>
> **The form is LOCKED** in [`docs/MACRO_MAP.md`](./MACRO_MAP.md): one canonical macro map —
> a single gritty **orbital 3D planet** you pick from a curated library, with a brass industrial
> **node-and-route overlay** floating above its crust. The Star Chart was promoted to canonical and
> the flat Macro March Lab (`/macro-lab`) has been absorbed and retired. That doc resolves the
> art/scale open questions in §5.6 below.

**Decision (locked):** the hex grid is retired as the player-facing world model. It is replaced by a **Total War / Mount & Blade-style continuous macro map** driven by a **node-and-route graph** on the server. The player never sees a hex — only a painterly war-table map with named places, roads, and marching columns. This is the spine of the v2.x redesign: mobile bases only make sense on a map built for movement.

### 5.1 The two layers

| Layer | What it is | Who sees it |
| --- | --- | --- |
| **Logic layer (server)** | A graph: **locations** (nodes) connected by **routes** (edges) with day-costs. All movement, supply, fog of war, interception, and NPC pathing resolve on the graph. | `gameEngine` only |
| **Presentation layer (client)** | A hand-painted continuous map. Locations are points of interest (dig sites, ruins, passes, fuel camps, settlements); routes are drawn roads/trails; armies and fortress-bases are sprites marching along them. | The player |

Why hybrid: full free-position movement (true M&B) makes turn-based server validation, fog of war, and NPC AI dramatically harder for little strategic gain. The graph keeps every system tractable while the painted map delivers the immersion. Rendering is *lighter* than the hex board (no per-tile geometry) and stays in the existing React/three.js stack — no new engine.

### 5.2 Time: one turn = one in-game day

- The game clock advances **one day per full turn cycle**. All per-turn systems re-anchor to days: weather rolls daily, supply attrition accrues per day out of network, excavation takes N days, truce durations become day counts.
- The calendar becomes diegetic: the operations log, chronicles, and dispatches date themselves ("Day 214 of the March").

### 5.3 Movement: GURPS-inspired day-rates

- Every army has a **march rate in leagues/day**, set by its **slowest element** (this is where the unit speed stats finally bite): a crawler column plods, light rifles move fast, a fortress-base is the slowest thing on the map.
- Route day-costs = route length ÷ effective march rate, modified by: **terrain class** of the route (paved road / trail / broken ground / pass), **weather** (rain and snow slow wheels more than boots), **supply state** (cut-off armies march at half rate), and **general/base auras** (engine modules, logistics generals).
- Most marches take **multiple days**, so orders become **queued destinations**: the player sets a target, the column advances each day automatically, and can be redirected at any daily stop. En-route armies are visibly *on the road segment*, not teleporting node to node.

### 5.4 Interception & engagement

- Two hostile forces on the same route segment (or arriving at the same node) trigger an **interception check**: the faster force chooses to engage or evade; the slower force can only force battle if it blocks a chokepoint (pass/bridge nodes are natural ambush ground).
- Fortress-bases can be **run down** by faster raiding columns over several days — the Mount & Blade chase, turn-based.
- Fog of war works on the graph: you see nodes/segments within scout range of your forces and supply network; probe actions reveal what's marching where.

### 5.5 What happens to the hex content

- **Territory ownership → location control:** you control locations, not tiles; income flows from controlled settlements/resource sites.
- **Adjacency → routes:** attack/march legality becomes route connectivity; the supply network becomes graph range from the mobile base.
- **The map editor** becomes a graph editor: place locations on a painted canvas, draw routes with terrain class and length; `generateMap` seeds procedural graphs instead of hex grids.
- **Existing hex maps** do not migrate — v2.x ships with new-format maps; vanilla games finish on the hex engine, which remains authoritative until the redesign ships.
- **Mass combat, weather, generals, veterancy, medals, diplomacy** carry over unchanged — they never cared about hexes.

### 5.6 Open questions (resolve during v2.x implementation)

1. League scale & typical route lengths (target: 2–6 days between major locations on a standard map)
2. Off-road movement: forbidden, or allowed at severe day-cost penalty for light forces?
3. Simultaneous daily resolution vs. sequential player turns for multi-day marches in multiplayer
4. How much of the painted map is AI-generated art vs. procedural composition of painted assets
5. Interception math details (speed differential thresholds, evasion costs, chokepoint definitions)

## 6. The Political Ideology Lifepath (in-game)

The pre-game BattleTech-style lifepath (faction creation) extends **into play**: the empire keeps living its lifepath. At defined moments during a war, the player is handed a political dilemma — a **Decree** — a choice about the nature of the empire, with real, permanent mechanical consequences. Choices accumulate into an ideology that shapes the faction's bonuses, options, and how others see it.

> **Status: seed shipped.** The State Armory's "Ideology Decrees" (War Bonds, Fuel Rationing, Universal
> Levy, Hearth & Bulwark — `docs/GAME_RULES.md` §20) are the first purchasable decrees, but they are
> flat unlocks: no axes, no triggered Assembly sessions, no path dependency yet. The full system below
> replaces them (or absorbs them as Economy/Mobilization-axis choices).

### 6.1 Ideology axes

Four axes, each ranging −3 … +3, starting at 0 (or seeded by faction lifepath/doctrine):

| Axis | Pole (−) | Pole (+) |
| --- | --- | --- |
| **Authority** | Council Rule | Iron Autocracy |
| **Economy** | War Communalism (command) | Charter Syndicates (market) |
| **Creed** | Reclaimer (humanity saves itself) | Restorationist (precursor tech is salvation) |
| **Mobilization** | Citizen Levy | Professional Corps |

The Creed axis is the lore spine — it ties directly to the precursor-tech hunt (§4) and gains most of its teeth in v2.x.

### 6.2 Triggers — "Sessions of the Assembly"

- **Scheduled sessions:** a decree every N turns (cadence ~4–5, tunable per map size).
- **Event sessions:** fired by history — first enemy territory captured, capital/base threatened, a battle lost badly (≥50% losses), a faction eliminated, treasury crisis (a resource at 0 for 2+ turns), first relic found (v2.x).
- One pending decree at a time, presented at the start of the player's turn; it must be resolved before `endTurn` (or auto-resolves to the neutral option after a grace turn).
- **NPCs resolve decrees silently** by doctrine (aggressive → Autocracy/Professional lean, economic → Market lean, defensive → Council/Levy lean), so their ideologies drift too.

### 6.3 Decrees — structure and example impacts

Each decree offers 2–3 choices; each choice shifts 1–2 axes by ±1 and applies immediate and/or ongoing effects. Illustrative (numbers to be balanced at implementation):

- **The Conscription Question** — *Universal Levy* (Mobilization −1: +1 Manpower income, riflemen −1 def) / *The Professional Standard* (Mobilization +1: riflemen +1 def, +1 MP cost) / *Mercenary Charters* (Economy +1: generals cost −1 MP to commission, −5 NPC dispositions).
- **Emergency Powers** — *Grant the Marshal Absolute Command* (Authority +1: +1 strategy to your supreme commander, rally maneuvers restore −5 less morale) / *Preserve the Council* (Authority −1: +10 NPC dispositions, better truce acceptance).
- **The Foundry Accords** — *Nationalize the Foundries* (Economy −1: +1 Steel income, worse war-market rates once the market exists) / *Charter the Syndicates* (Economy +1: better market rates, fortifications cost +1 Steel).
- **The Reliquary Question** (v2.x) — *Consecrate the Find* (Creed +1: faster excavation, lab modules cheaper) / *Break It for Parts* (Creed −1: immediate resource windfall, victory-progress penalty).

**Constitutional thresholds:** reaching ±2 on an axis locks in a passive "constitutional" bonus and **gates future decree options** — path dependency, exactly like the creation lifepath. An Iron Autocracy cannot later pick council-flavored options without a costly reform decree.

**Diplomatic weight:** ideology distance modifies dispositions — NPCs (and later settlements/players) warm to ideologically similar empires and cool toward opposites.

### 6.4 Data & surfaces (implementation notes)

- State lives per game: `Game.factionSlots[i].ideology = { axes, resolved[], pendingDecree }` — server-authoritative in `gameEngine` (`getState` exposes the pending decree; new `resolveDecree` action applies a choice).
- UI: a full-screen ministry-styled **"Decree of the Assembly"** modal (same visual family as patch dispatches), plus a compact Ideology panel showing axis positions and constitutional bonuses.
- Every resolution writes a combat-log event ("By decree of the Third Assembly, …") — decrees become chapters in the War Chronicle.
- Effects plug into the existing modifier pipeline (`compileMods` / trait bonuses), not a parallel system.

### 6.5 Open questions

Cadence tuning per map size; whether ideology is seeded from the creation lifepath; per-game only vs. any meta-persistence; the balance budget per decree (each choice should be a real trade, never strictly better); how auto-resolve behaves for players who go dark.

## 7. Expansion Roadmap

Shipped and planned content, in order. Each expansion arrives as Field Amendment patch dispatches (see the Patch workflow in `CLAUDE.md`).

| Phase | Name | Contents |
| --- | --- | --- |
| **v1.x (shipped, ongoing)** | The Vanilla Front | Everything in `docs/GAME_RULES.md` — including the shipped diplomacy (§17), fortress-base slice (§18), research tree (§19), and State Armory (§20) |
| **v2.x (next major)** | Mobile Bases & Macro Map redesign | §3–§5 above: full mobile-base rules (boarding assaults, base-loss consequences, remaining module families), permanent settlements as minor polities, precursor tech & relic victory, and the graph-based macro map with day-rate movement (one turn = one day) |
| **Expansion: AIR** | *Sky Captain-inspired* | Aerial theater: airships and sky-fortresses, air lanes/altitude as a movement layer, air piracy, possibly airborne mobile bases. Rocketeer/pulp-aviation flavor grafted onto the dieselpunk base. |
| **Expansion: SEA** | *Waterworld / Foxhole-naval-inspired* | Ocean theater: naval mobile bases (floating fortress flotillas), sea-borne settlements, amphibious operations, deep-sea precursor vaults. Resolves the current sea-transport gap as a full expansion rather than a patch. |

### 7.1 Known Gaps (near-term candidates, independent of the big expansions)

Holes the current systems imply but don't cover. These can ship as vanilla-era patches or fold into the phases above — scope to be locked with the user before building.

**Rules gaps:**

1. **Sea transport / amphibious invasion — the biggest hole in the map game.** Field armies can't enter sea zones and land units can't cross water, so on maps with islands or split continents whole theaters are unreachable except by gunboat skirmishing. Minimal fix: a transport ship, or a **"convoy" action** that ferries an army/garrison between friendly-adjacent coasts. The full naval theater (floating bases, sea settlements) remains the Sea expansion — the convoy is the stopgap.
2. **Player diplomacy — SHIPPED (v1.1.0 "The Envoy Accords").** Truces, non-aggression pacts, and trade offers via the Envoy Desk, with binding accords and dynamic NPC dispositions. Remaining: settlements-as-polities (v2.x) and ideology-distance disposition modifiers (§6).
3. **Resource exchange — partially shipped (v1.1.0).** Faction-to-faction trade exists via the Envoy Desk. Remaining: a neutral **war market** (lossy conversion, e.g. 3:1) for games with no willing trade partner.
4. **Stalemate protection.** Nothing ends a war that grinds — no turn limit, no scored victory, and no timer if a multiplayer opponent goes dark. Fix: an **optional turn deadline with auto-skip**, plus a **max-turn scored victory** (land + production).
5. **Speed/initiative system** — unit speed stats and the battle initiative display have shipped; the mechanical half (initiative-ordered casualties, speed auras) is **now folded into §5**: day-rate marching and interception are where speed pays off. Deferred to v2.x with the macro map.

**Tooling / lore gaps (support, not rules):**

6. **Field Manual.** The rules live in the maintainer's head and scattered tooltips — combat math, weather, supply, veterancy, maneuvers. An **in-game codex page** in the same ministry styling as the patch dispatches, so players can actually learn the game. Pairs naturally with patches ("see amended §4.2"); `docs/GAME_RULES.md` is the source text. Also the natural home for the lore bible (§2), which currently has no in-game surface — the precursor hunt and neutral settlements have no narrative representation in play.
7. **Turn notifications.** Async multiplayer only works if players know it's their turn — an **email nudge to registered players when the baton passes** (Base44 SendEmail reaches registered app users).

## 8. Open Design Questions

To resolve before/while implementing v2.x:

1. Base movement rate and cost at macro scale (the vanilla slice uses 1 zone / 2 Fuel per turn — does this survive the day-rate model?)
2. Remaining module families (hangar, lab, habitat, aura), slot count growth, and swap timing (in-field vs at-settlement?)
3. Boarding assault mechanics — reuse the mass-battle maneuver engine with a "decks" twist, or a new resolution system?
4. Base loss: elimination vs crippled-remnant grace period (leaning remnant; vanilla currently wrecks the base permanently)
5. Settlement interaction verbs: trade / coerce (tribute) / raid / garrison — and how NPC dispositions extend to settlements
6. Relic count/pacing per map size; excavation turns; how contested digs resolve
7. Which vanilla victory conditions survive (map control demoted? capital-domination becomes base-domination?)
8. How the graph map editor represents dig sites and settlements
9. How the Armory's flat ideology decrees fold into the axis-based Assembly system (§6)

## 9. Working Agreement

- **Docs first, then code:** design pivots land in this file before implementation begins.
- Implementation of the v2.x macro map has **not started server-side** — the vanilla hex rules remain fully authoritative in play; the War Table (`/star-map`) is a client-side sandbox.
- Every shipped slice updates `docs/GAME_RULES.md`, the `src/lib/` mirrors, and files a Patch dispatch.