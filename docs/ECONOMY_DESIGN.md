# Rust Legions — Working the Ground v2 (Economy Design Proposal)

> **Status: PROPOSAL (v2 — supersedes v1 of same date).** Maintainer direction: harvesting works like
> Stellaris: Nomads arkship harvesting — the mobile base and logistics vehicles harvest deposits
> directly, depleting them *for a time*, forcing constant movement. v1's settlement-sourcing layer is
> demoted to a rights-and-contracts system around that core. Lore authority: `docs/LORE.md`.
> Cross-links: `TECH_DESIGN.md` (fragments), `LIFEPATH_DESIGN.md` (blocs). Tracker: §3.9 / L-11.
> Reference mechanic: Stellaris: Nomads (2026) — harvest orders, temporary Resource Depletion,
> arkship-vs-logistic-ship stockpiles, harvest contracts with settled powers. Numbers illustrative.

## 0. The Pitch — and the Tedium Law (unchanged)

> **The Tedium Law.** Every economic decision must be *positional*, *structural*, or *exceptional*.
> Zero routine clicks per turn is the acceptance test.

The new core loop: **the keel grazes.** A fortress-base parked in a region drinks it — seams, lodes,
timber, water — fast. The ground gives out *for a season*, and the keel must move. The economy is not
a spreadsheet attached to territory; it is the migration itself. You are a herd animal the size of a
city, and the map is pasture.

## 1. Deposits and Depletion (temporary, not terminal)

Named deposits (fuel seams, ore lodes, provender grounds for Manpower-support) each carry:

- **Yield rate** — flow while harvested (survey/probe to learn it; rumors lie).
- **Depletion state** — harvesting drains the deposit; when drained it enters **Depleted** for D
  in-game days (order of a season, class-dependent), yielding a trickle, then recovers to full.
  Depletion is temporary — the map is pasture, not a fossil bed. A region regrows behind you.
- **Telegraphing (Tedium Law):** the Ledger shows every local deposit's remaining days at current
  draw ("Northreach seams: 23 days at present draw"). Exhaustion is never a surprise; it is the
  clock that schedules your next march.

**Prospecting:** probes/recon survey deposits; a **Deep Survey** action (costs, takes days) can
uncover a hidden deposit in a worked-out region — occasionally restoring a Depleted site early. Deep
Surveys are also a natural place to surface dig-site rumors (TECH_DESIGN demand loop): prospecting
for fuel finds the past.

## 2. The Harvesters

Two harvesting instruments, per the reference mechanic:

- **The keel itself** — projects a **harvest footprint** (a small radius; graph: adjacent nodes/
  segments). Deposits in the footprint are drawn **directly into the faction stockpile** at rates set
  by Industry modules. Parked keel = maximum draw. A marching keel **skims**: it harvests at reduced
  rate from deposits along its route as it passes — migration itself earns.
- **Draught columns** (logistics vehicles) — a new support-unit class, capped at 2–4. A draught
  column is *dispatched* to a deposit or region, harvests **into its own hold**, and must **haul home**
  to the keel (or a depot) to bank it. Loaded columns are slow, visible, and raid-bait — the
  economy's soft underbelly, by design. **Tedium Law compliance:** columns take *circuit assignments*
  ("graze the Northreach seams"), auto-cycling deposit → keel until the region depletes, the column
  is threatened, or you reassign. One order per campaign phase, not per trip.

Division of labor falls out naturally: the keel drinks where it sits; draught columns extend the
graze into ground too poor, too far, or too dangerous to park a city on.

## 3. Harvest Rights (what remains of v1's sourcing modes)

Settlements hold customary **harvest rights** over their local deposits (they live there, under the
Rent ceiling — LORE §4/§6). Harvesting inside a settlement's ground without leave is a diplomatic
incident: disposition loss with that settlement *and its type map-wide* (they talk), escalating to
sabotage and, for parishes, preaching. The options, reframed from v1:

| Mode | What it is | Effect |
| --- | --- | --- |
| **Harvest contract** | Envoy Desk pact: pay/protect for the right to graze their ground | Full draw, no incident; obligation to defend |
| **Tribute graze** | Take the right at gunpoint | Full draw now; disposition decay, strike/sabotage events |
| **Open ground** | Unclaimed deposits (most of the map) | Free to graze — the true nomad economy |

Doctrine identity intact: the Combine contracts, the Reclamation "administers," the Synod grazes
parish ground by covenant. Bloc reactions plug in unchanged (Syndicate Bench, the Levy). v1's
"Company Works" are cut — the keel *is* the works.

## 4. Trade at the Meet (proximity rule — maintainer directive)

**Rule:** any transfer of *goods or rights* — resources, fragments, intact Objects, harvest-rights
grants — executes only when the faction's keel is within **trade range R** of the counterparty: the
other keel for major factions, the settlement itself for minors.

**Words travel by radio; goods travel by road.** Negotiation is unrestricted: truces, pacts, and the
*terms* of a trade can be agreed at any distance via the Envoy Desk. But an agreed exchange becomes a
**pending consignment** that sits on the Ledger and auto-executes the moment range is achieved —
agree once, no re-click (Tedium Law). The Envoy Desk UI shows out-of-range offers with the current
distance in days.

What the rule buys:

- **The meet as gameplay.** Arranging an exchange now steers migrations — a trade is a reason to
  march, and the rendezvous point is a negotiation of its own. Two keels in proximity is mutual
  exposure: ambush range, boarding-assault paranoia. Betrayal at the meet is possible and should
  remain so — priced by map-wide disposition ruin and a Chronicle chapter nobody forgets.
- **Waystations as meet-grounds.** Neutral ground by ancient habit (LORE §6) — the customary,
  lower-risk place to consign an exchange. Convention, not code, at slice 1; possibly a small
  mechanical safety bonus later.
- **The Combine comes to you.** The merchant house's NPC circuits should actively seek meets — its
  economy identity now has a movement signature on the map, and its Advisories can announce routes
  ("the Vow of Coal calls at the Northreach waystation, Days 40–46").
- **Objects change hands at arm's length.** Relic handovers (TECH_DESIGN) being physical makes the
  tensest trades in the game also the most dangerous to conduct. As it should be.

**Scope note:** this section implements the directive strictly — no exchange without keel proximity.
A possible future relaxation (draught columns as consignment carriers extending R at risk) is *not*
part of the directive and is parked as open question 10.

## 5. The Rhythm: Graze, Deplete, March

This is the game's heartbeat, and it stacks with every pressure already designed:

- **Park** where deposits, dig sites, and refit needs cluster → harvest, excavate, refit, research.
- **Deplete** — the Ledger counts down; the Rent (LORE §4) counts up if you linger; two clocks, one
  conclusion.
- **March** — choose the next pasture: richness vs. distance (march burns Fuel; the skim offsets),
  vs. danger, vs. what the tech tree is hungry for (TECH_DESIGN's class demand chooses your compass
  heading).
- **Contested pasture:** two keels grazing one region empty it twice as fast — the resource war
  nobody declared. **Denial grazing** is a strategy: drain a region ahead of an advancing enemy and
  leave them a stripped larder. A keel's depleted trail — its **swath** — is readable on the map:
  you can track a fortress by what it ate, and pursuing an enemy through their own swath means
  starving in it. *(Terminology note: "swath" chosen to avoid collision with Wake-class relics.)*

## 6. Manpower: People Are Not Ore (unchanged from v1)

Keel population (Habitat modules; one visible number moved by events, pacts, casualties — never
sliders), levy pacts with communes, recruitment drives as decree/chapter events. Provender grounds
(farm regions) support population growth while grazed — a reason to park somewhere green.

## 7. Crises, Not Maintenance (adapted)

Seam fires, strikes on contracted ground, weather sealing a pass mid-circuit, a draught column
ambushed (rescue, ransom, or write-off), and the Combine repricing the black market when a region's
grazing collapses. Infrequent, evented, always a real decision.

## 8. Surfaces: the Ledger (unchanged)

One screen: local deposits with countdown clocks, footprint draw, column circuits and holds, depot
balances, rights/contracts list, pinned crises. Ministry styling. Second-screen economy = §0 violated.

## 9. Implementation Sketch

- **Data:** deposits (`class, yieldRate, pool, depletedUntil, claimedBy`); draught columns as units
  with `hold, circuit`; harvest rights on the existing disposition/accord structures; pending consignments as accord records with a range-check on the day tick.
- **Engine touchpoints:** income = footprint draw + column deliveries + skim (replaces territory
  income — the biggest engine change, as in v1); depletion/recovery on the day tick; incident checks
  on claimed-ground harvesting; column pathing reuses army movement.
- **Slicing:** (1) hex-era — deposits + keel footprint + depletion/recovery, income rewired, Ledger
  v1 (columns deferred; the shipped base already moves, so the graze loop is testable now);
  (2) draught columns + circuits + hauling; (3) harvest rights + incidents + contracts (wants Envoy
  Desk extensions); (4) v2.x — skim-on-march, swath rendering, contested-pasture pacing on the graph.

## 10. Open Questions

1. Depletion duration D and recovery curve per class — and is a fully drained deposit's trickle
   zero, or subsistence?
2. Footprint size: fixed, or an Engine/Industry module axis?
3. Draught column cap: flat, or module/ideology-grown? Do columns need crew (Manpower cost)?
4. Skim-while-marching rate — meaningful or flavor? (Leaning: ~25% — enough to make route choice
   interesting, not enough to make parking optional.)
5. Does Deep Survey restoring depletion risk Wake events? (Digging deeper for fuel and finding
   something else is very on-theme.)
6. NPC houses: full graze simulation, or doctrine-scripted circuits? (Leaning: scripted circuits —
   also makes their movements predictable enough to hunt, which is good gameplay.)
7. Settlement economies: do settlements deplete their own ground, or are they balanced draws exempt
   from depletion? (Leaning: exempt — they're under the ceiling; only keels eat like keels.)
8. Trade range R: how many days/zones? Same as, or larger than, the harvest footprint? (Leaning:
   larger — you can deal with a neighbor you can't graze beside.)
9. Does the proximity rule bind NPC↔NPC trades in simulation, or only player-involved exchanges?
   (Leaning: bind everyone — NPC keels visibly converging to trade is free storytelling and free
   intelligence for observant players.)
10. Future relaxation (NOT in the directive): draught columns as consignment carriers extending R,
    slow and interceptable — a Silk-Road layer. Parked pending maintainer interest.
