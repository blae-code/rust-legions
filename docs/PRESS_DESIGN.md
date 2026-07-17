# Rust Legions — The Lift-Day Press (Weekly Digest Design Proposal)

> **Status: PROPOSAL** (tracker §3.14 / L-16). Maintainer directive: at the end of every in-game
> week, players receive a thematic, immersive popup that summarizes their week, projects their
> economic outcome, and shows newspaper clippings of world events, sourced from ~three in-world
> media outlets tracking everything. Per the Reckoning (LORE §3.1), the in-game week is the
> **ten-day** and the digest publishes on **lift-day** — the tenth day, the old manifest day.
> Infrastructure: extends the shipped `npcHerald` LLM pipeline and the ministry-dispatch UI family.
> Numbers illustrative.

## 0. The Founding Legend (canon, pending ratification with this doc)

On the last lift-day of the Wardship, no manifest was posted. The story every pressman tells — true
or not, per LORE §0.1 it is *attributed* — is that in some burn-town during the Quiet, a clerk who
could not bear the empty board chalked up a manifest of her own: who had died, what the seam had
yielded, what the weather would do. **MANIFEST No. 1: THE COUNTING CONTINUES.** Every paper on the
Ground descends from that gesture, and every paper still publishes on lift-day. The Empire counted
humanity for longer than memory; now humanity counts itself, and calls it news.

## 1. The Three Papers

| | **The Manifest** | **The Crossloom Courant** | **The Red Flag** |
| --- | --- | --- | --- |
| **What it is** | The paper of record | The trade sheet, printed at Crossloom waystation | The penny dreadful of the digs |
| **Covers** | War, politics, decrees, sieges, successions, obituaries of generals | Prices, freight, harvests, Meets, contracts, deposit reports, keel movements | Relic finds, Wake scares, dark-run crimes, eclipse vigils, scandal, omens |
| **Voice** | Dry, archival, precise; damns with documentation | Brisk, numerate, gossip between the figures | Breathless, lurid, superstitious — and dead right about once an edition |
| **Departure lean** | Institutional agnostic (order above theory) | The Finished Ledger (everything prices) | Flight-curious (loves the scary reading) |
| **Reliability** | High, slow — confirms before printing | High on numbers, sly on motives | Low on facts, uncanny on rumors: prints tomorrow's truth as this week's hysteria |

Three papers, three biases, one world: the same sack of a commune appears in the Manifest as a
documented atrocity with casualty figures, in the Courant as a regional grain-price shock, and in
the Red Flag as GOD'S JUDGMENT RIDES ON TREADS. Players learn to read all three — and learn which
paper to believe about what.

## 2. The Lift-Day Edition (the popup)

Fires at the end of every 10th full turn cycle. One immersive screen in the ministry visual family,
styled as a folded broadsheet with your ministry's briefing paperclipped to it. Three panels, per
the directive — **zero decisions required** (pure information and immersion; skim, savor, or
dismiss), fully archived (§5):

### 2.1 The Week in Review *(private — your ministry's brief)*
Your faction's ten-day, compiled from the Chronicle: battles and their standards, ground taken and
lost, generals wounded/promoted/dead and successions run, decrees passed, digs progressed, Meets
concluded, bloc mood arrows. Written in ministry register, signed by your Marshalate. Six to ten
lines, every one anchored to a real logged event.

### 2.2 The Projection *(private — the actuary's page)*
Deterministic, computed from Ledger data — **no LLM in the numbers**: projected income flows for the
coming ten-day (footprint draw + columns + skim), depletion countdowns ("Northreach fails Day 6 of
next ten-day at present draw"), stockpile trend arrows, standing obligations (contract upkeep, levy
pacts, certification payments), projected treasury at next lift-day, and one flagged risk ("the
Third Column's supply line crosses contested ground"). The Courant's masthead, your numbers.

### 2.3 The Clippings *(shared world — the papers proper)*
Three torn clippings, typically one per paper, LLM-written on the `npcHerald` pipeline with
per-paper style packs, grounded in the **witnessed-events digest** (§3) — the herald's iron rule
holds: *real events only; invented interpretation is the point.* Clippings cover the world, not
you-in-particular — though you may star in them (§4). Multiplayer: the clippings are identical for
all players in a game; the briefs and projections are private.

## 3. What the Papers Can Know (the witness rule)

The press is an **information layer with fog of war**, not an omniscient narrator:

- An event is *reportable* if it was **witnessed**: it happened at/adjacent to a settlement or
  waystation, involved a Meet, occurred on a trafficked route, was broadcast (Bulletins, Advisories,
  and the Ascendancy's transmissions are quotable), or its outcome is inherently public (a keel's
  position when near settlements, a siege of a named place, a fallen house).
- Deeds in the deep waste stay out of the papers — and players can *plan for the press*: raid the
  convoy beyond the last waystation and the Courant prints "losses on the northern routes,
  attribution unconfirmed"; sack a commune on a trade road and the Manifest prints your keel's name.
- The Red Flag is the exception that proves it: it prints *unwitnessed rumor* at low reliability —
  occasionally leaking true intel (a real dig-site rumor, a real keel heading) wrapped in nonsense.
  Reading the Red Flag well is a skill, which is exactly what a tabloid should be.

## 4. Reputation in Print

Coverage has consequences, all via existing systems: front-page atrocities apply an extra
disposition penalty beyond the act itself (*it made the papers*); Honors of War earn a Manifest
paragraph that softens settlement fear; the Courant repricing your routes after interdiction *is*
the black-market rate shift (ECONOMY crises, now diegetic); bloc favor twitches when the press
covers your decrees (the Levy reads the Manifest; the Syndicate Bench reads the Courant; everyone
denies reading the Red Flag). One rule keeps it sane: **the press never applies a mechanic that
doesn't already exist** — it narrates and slightly amplifies; it does not invent levers.

## 5. The Morgue (archive)

Every edition is kept — the paper morgue, browsable from the Chronicle/codex surface. A finished
game's morgue is its history as the world saw it, clipping by clipping, and the natural export for
the campaign-logging integration (Sheets/Docs) already in the stack.

## 6. Sample Clippings (register-setting; few-shot seeds)

> **THE MANIFEST — Lift-Day, 3rd Month, 383 F.I.**
> **HUNDREDWEIGHT BOTTOMS INVESTED; STORES ESTIMATED AT TWO TEN-DAYS.** The Iron Verdict's columns
> closed the east road on Day 6. A Summons was refused. The Bottoms have withstood four sieges in
> the historical record; the Reclamation's bulletin describes the fifth as "administrative."
> Obituaries, p.4: Col. HASZ, levy-risen, of wounds, Day 8. The counting continues.

> **THE CROSSLOOM COURANT — prices as of lift-day**
> Fuel firm, Steel soft, grain UP 3 points on the Gray Commons pact lapse. The Vow of Coal calls at
> Crossloom Days 2–5 next ten-day — consignments bonded now avoid the dark-run surcharge. Northern
> routes: insurance suspended pending "clarification of losses." We print the numbers; you may
> supply the motives.

> **THE RED FLAG — !! DARK-RUN SPECIAL !!**
> THE COAL PASSED FULL ACROSS THE LAMP AND AT REDWATER THEY DUG ANYWAY. Three lamps failed. A
> flag-man swears the shaft *exhaled*. The diggers' committee denies everything, which is what they
> said before Site 112, and we all remember what came up out of THERE. Vigil schedules, p.2. Sleep
> when the Lamp is up.

## 7. Implementation Sketch

- **Trigger:** `endTurn` cycle counter % 10 == 0 → compile digest job (off the hot path; delivered
  at each player's next session start if offline — async-safe).
- **Data:** witnessed-events digest = Chronicle/combat-log entries filtered by the §3 witness rule
  (a `witnessed` flag computed at event write time — settlement/route adjacency check); projection
  = pure Ledger math; briefs = templated from the player's own event slice.
- **LLM:** three press style packs added to `HERALD_VOICES.md` (shared rules apply; add the witness
  rule and per-paper reliability behavior); one generation call per paper per edition, few-shot on
  §6; reject on mechanics vocabulary as with the herald.
- **UI:** one popup component in the dispatch/ministry family — masthead, two private panels, three
  clipping cards; morgue = paginated archive view.
- **Slicing:** (1) the popup with Week in Review + Projection only (no LLM — ships on pure game
  data, immediately valuable); (2) the three papers + clippings on the herald pipeline; (3) witness
  rule refinement + reputation-in-print hooks; (4) the morgue + campaign-log export.

## 8. Open Questions

1. Exactly three papers always, or a fourth regional/creed sheet on big maps (a parish circular; a
   Reclamation state organ that players can *read as propaganda*)?
2. Clipping count per edition: 3 flat, or 2–5 scaling with how eventful the ten-day was?
3. Do players ever *act* on the press (buy an advert, plant a story, suppress an edition via the
   Court/Reclamation)? (Leaning: park for a later slice — the directive asks for immersion, and
   levers can cheapen it.)
4. NPC houses: do their AIs "read" the papers (react to reported events they didn't witness), or is
   the press player-facing only? (Leaning: player-facing only at first; NPC plumbing already has
   dispositions.)
5. Red Flag true-leak rate: how often does the tabloid contain a real, actionable rumor? (Feels
   like ~1 in 3 editions, never labeled.)
