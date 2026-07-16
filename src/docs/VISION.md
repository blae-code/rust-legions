# Conquest Tactics — Design Vision & Roadmap

This is the creative north star for the project. `docs/GAME_RULES.md` describes what is *currently implemented* (the v1.0.0 "Vanilla Front"); this document describes where the game is *going*. When the two conflict, this document wins for future work — but nothing here is implemented until it ships as a Field Amendment (patch) and the rules doc is updated.

## 1. High Concept

> **"The best of Stellaris, on a single world — and that world is Foxhole + Iron Harvest + Mortal Engines."**

A dieselpunk grand-strategy game where the great powers are not nations rooted in capitals, but **nomadic factions dwelling in colossal mobile fortress-bases**, roaming an abandoned world in a hunt for buried precursor technology. Touchstones:

- **Mortal Engines / Stellaris "Nomads"** — mobile fortress-bases as the seat of power
- **Stellaris** — modular customization, doctrine-driven factions, personality-rich AI
- **Twilight Imperium / Stellaris ground combat** — capturing a base requires committed troops, not just firepower
- **Foxhole / Iron Harvest** — gritty dieselpunk logistics warfare (already the visual identity)
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

### 3.1 What a mobile base is
- Each faction has exactly one — its capital, factory, supply heart, and home, on treads.
- It occupies a tile and can **move across the map** (slowly — this is a fortress, not a jeep).
- It is the faction's **prime supply hub** (the supply network re-anchors as it moves) and its primary production site.
- Its loss is the gravest thing that can happen to a faction.

### 3.2 Modularity (the Stellaris part)
Bases have **module slots**. Modules are installed/swapped at cost and alter the base's abilities and its empire-wide impact. Candidate module families (design space, not final):

| Family | Example effects |
| --- | --- |
| **Engines** | base movement rate, rough-terrain traversal |
| **Armament** | base defense/attack values, bombardment capability |
| **Industry** | income bonuses, unit cost reduction, on-board production |
| **Hangar / Barracks** | garrison capacity, muster-from-base, army cap bonus |
| **Laboratory** | precursor-tech excavation speed, relic analysis |
| **Habitat** | manpower income, general recruitment quality |
| **Aura modules** | empire-wide or radius effects (e.g. +speed to nearby armies — ties into the planned initiative system) |

Precursor relics (see §4) can grant **unique modules** that cannot be built, only found.

### 3.3 Capturing a base (the Twilight Imperium part)
- A base **cannot be taken by bombardment or attrition alone** — it must be stormed by committed ground troops (a boarding assault: a special mass-battle type fought deck by deck).
- A captured base changes hands or is salvaged — captured modules may be stripped, transferred, or destroyed (design decision pending).
- **Open question:** does losing your base eliminate the faction, or leave a crippled nomad remnant with a chance to retake it? (Leaning: crippled remnant with a grace period — more dramatic.)

### 3.4 Knock-on effects on vanilla rules (must be resolved when implementing)
- **Capital income rule** ("capital lost ⇒ no income") becomes a base rule.
- **Supply networks** currently anchor to capitals/forts/barracks — the base becomes the primary, moving anchor.
- **Map-control victory (60%)** may be demoted or replaced: for nomads, holding dirt matters less than holding *tech*. A relic-based victory ("restore humanity") likely becomes the headline win condition.
- **Permanent settlements** replace neutral garrison tiles: minor polities with a disposition, tradeable/raidable/coercible, that harvest their tile's resources.
- **NPC AI** must learn to move its base, install modules, and race for dig sites.
- **Game setup** changes: factions start with a base + escort, not a capital + territory ring.

## 4. Precursor Technology (the abandonment premise made mechanical)

- **Dig sites / caches** seeded across maps (visible rumors + hidden finds; fog of war and probes matter more).
- **Excavation:** parking a base or dedicated army on a site over multiple turns; contested digs are the intended flashpoint of the mid-game.
- **Relics:** grant unique base modules, one-off powers, or victory progress. Fought over, stolen when a base falls.
- **Victory:** assembling enough precursor tech to "restore humanity" — the intended primary win condition post-redesign.

## 5. Expansion Roadmap

Shipped and planned content, in order. Each expansion arrives as Field Amendment patch dispatches (see the Patch workflow in `CLAUDE.md`).

| Phase | Name | Contents |
| --- | --- | --- |
| **v1.x (shipped)** | The Vanilla Front | Everything in `docs/GAME_RULES.md` |
| **v2.x (next major)** | Mobile Bases redesign | §3–§4 above: mobile fortress-bases, modules, boarding assaults, permanent settlements as minor polities, precursor tech & relic victory |
| **Expansion: AIR** | *Sky Captain-inspired* | Aerial theater: airships and sky-fortresses, air lanes/altitude as a movement layer, air piracy, possibly airborne mobile bases. Rocketeer/pulp-aviation flavor grafted onto the dieselpunk base. |
| **Expansion: SEA** | *Waterworld / Foxhole-naval-inspired* | Ocean theater: naval mobile bases (floating fortress flotillas), sea-borne settlements, amphibious operations, deep-sea precursor vaults. Resolves the current sea-transport gap as a full expansion rather than a patch. |

### 5.1 Known Gaps (near-term candidates, independent of the big expansions)

Holes the current systems imply but don't cover. These can ship as vanilla-era patches or fold into the phases above — scope to be locked with the user before building.

**Rules gaps:**

1. **Sea transport / amphibious invasion — the biggest hole in the map game.** Field armies can't enter sea zones and land units can't cross water, so on maps with islands or split continents whole theaters are unreachable except by gunboat skirmishing. Minimal fix: a transport ship, or a **"convoy" action** that ferries an army/garrison between friendly-adjacent coasts. The full naval theater (floating bases, sea settlements) remains the Sea expansion — the convoy is the stopgap.
2. **Player diplomacy.** NPCs have dispositions toward players, but players have zero tools — no truces, non-aggression pacts, or trades, so 3–4 faction games are pure free-for-alls. Even a minimal version — **offer truce / declare war, with NPC acceptance driven by disposition** — turns them into real geopolitics. Pairs with settlements-as-polities in v2.x.
3. **Resource exchange.** Treasuries dead-end: a steel-rich faction with no fuel just stalls. Fix: a **war market** (lossy conversion, e.g. 3:1) and/or trade offers between players.
4. **Stalemate protection.** Nothing ends a war that grinds — no turn limit, no scored victory, and no timer if a multiplayer opponent goes dark. Fix: an **optional turn deadline with auto-skip**, plus a **max-turn scored victory** (land + production).
5. **Speed/initiative system** — sketched earlier (unit speed stats, general speed auras, initiative-ordered casualties, speed-based macro movement), still unbuilt. **Decision pending: in or out of near-term scope** — it pairs naturally with v2.x engine modules, which argues for deferring it.

**Tooling gaps (support, not rules):**

6. **Field Manual.** The rules live in the maintainer's head and scattered tooltips — combat math, weather, supply, veterancy, maneuvers. An **in-game codex page** in the same ministry styling as the patch dispatches, so players can actually learn the game. Pairs naturally with patches ("see amended §4.2"); `docs/GAME_RULES.md` is the source text.
7. **Turn notifications.** Async multiplayer only works if players know it's their turn — an **email nudge to registered players when the baton passes** (Base44 SendEmail reaches registered app users).

## 6. Open Design Questions

To resolve before/while implementing v2.x:

1. Base movement rate and cost (per turn? fuel-fed? terrain limits?)
2. Module slot count, install costs, and swap timing (in-field vs at-settlement?)
3. Boarding assault mechanics — reuse the mass-battle maneuver engine with a "decks" twist, or a new resolution system?
4. Base loss: elimination vs crippled-remnant grace period (leaning remnant)
5. Settlement interaction verbs: trade / coerce (tribute) / raid / garrison — and how NPC dispositions extend to settlements
6. Relic count/pacing per map size; excavation turns; how contested digs resolve
7. Which vanilla victory conditions survive (map control demoted? capital-domination becomes base-domination?)
8. How existing maps and the map editor represent dig sites and settlements

## 7. Working Agreement

- **Docs first, then code:** design pivots land in this file before implementation begins.
- Implementation of v2.x has **not started** — the vanilla rules remain fully authoritative in play.
- Every shipped slice updates `docs/GAME_RULES.md`, the `src/lib/` mirrors, and files a Patch dispatch.