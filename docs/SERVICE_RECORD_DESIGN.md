# Service Record Design — Decorations, Rank & Legacy

Design proposal for deepening the commander's persistent record across campaigns.
Nothing here is implemented yet; this is the shortlist to build from.

Existing today: four medals in `src/lib/medals.js` (Iron Hammer, Brass Star,
Marshal's Cross, Defiant Standard), plus raw counters on `UserProfile`
(gamesPlayed, gamesWon, campaignsCompleted, mapsCreated).

Guiding rule: every award must be *earned by a traceable act of war*, named in
Ministry voice, and legible on a paper dossier. No generic "play 10 games" filler
unless it reads as a service milestone.

---

## 1. Commissioned Rank — the spine of the record

A single visible rank, advanced by **Service Points** (SP) rather than wins alone,
so honest defeat still advances a career. SP: +3 victory, +1 completed defeat,
+2 campaign completion, +1 first war on a new theater.

| Rank | SP | Collar mark |
|---|---|---|
| Cadet of the Line | 0 | bare |
| Field Lieutenant | 8 | single bar |
| Captain of Treads | 20 | double bar |
| Major of the Column | 40 | brass pip |
| Colonel-Commandant | 70 | crossed pips |
| Marshal of the Ash | 110 | wreathed star |
| Marshal-Ordinal *(terminal)* | 160 | wreathed star, blackened |

Flair: rank is stamped on every dispatch, lobby seat, and After-Action Dossier.
Promotions arrive as a **sealed Ministry letter** — a one-time modal on the
commissioning-papers aesthetic, with a wax seal to break.

## 2. Decorations — the achievement list

### Combat conduct
- **Order of the Iron Hammer** — three consecutive victories. *(exists)*
- **Brass Star of Command** — decisive victory with minimal casualties. *(exists)*
- **The Defiant Standard** — victory against a superior force. *(exists)*
- **The Marshal's Cross** — five career victories. *(exists)*
- **Ash Wreath** — win a war in which you were reduced to a single territory.
- **The Broken Anvil** — destroy an enemy fortress-base in a single engagement.
- **Hammer of the Gate** — take a fortified settlement without losing an army.
- **Last Whistle** — win on the final turn of a stalemate clock.
- **Bled White** — win a war having taken more casualties than any rival.
- **Order of the Cold Muzzle** — win a war firing on fewer than five turns.

### Manoeuvre & logistics
- **Long March Ribbon** — move a fortress-base more than 20 nodes in one war.
- **The Quartermaster's Knot** — end ten consecutive turns in supply.
- **Iron Road Clasp** — hold an unbroken supply chain across the map's width.
- **Frostbitten Clasp** — win a war fought mostly in snow or storm.
- **Dust Cross** — survive five consecutive turns under attrition.

### Statecraft & doctrine
- **Charter Seal** — bring three neutral settlements under protectorate.
- **The Parley Laurel** — end a war with an accord instead of annihilation.
- **Broken Accord (dishonour mark)** — betray a signed accord. Worn as a black bar,
  removable only by winning a subsequent war outright.
- **Doctrine Wreath** — complete an entire research doctrine line.
- **Relic Warden** — recover a full precursor relic set.

### Career & service
- **Cartographer's Compass** — publish a chart another commander wins a war on.
- **Founder's Rivet** — awarded to commanders who served during the field-trial build.
- **The Standing Watch** — appear on the roll for thirty separate days.
- **Instructor's Baton** — a commander you summoned into their first war wins one.

Rarity tiers, shown as ribbon edge colour: **Common** (olive), **Distinguished**
(brass), **Rare** (rust), **Singular** (blackened brass — one per world event).

## 3. Ribbon Bar

A horizontal bar of ribbons above the dossier — the earned decorations compressed
into coloured strips, hover for the citation. Cheap to render, instantly readable,
very period-correct.

## 4. Campaign Ribbons & Theater Bars

One ribbon per theater fought (Cindara, and each further world), with a **bar** added
per further war on it and a **star** when won. This turns map variety into visible
history without new achievement logic.

## 5. Citations — the flair layer

Every decoration carries a generated one-line **citation** naming the specific war,
turn and enemy: *"For the holding of Kesh Wal on the eleventh day, under fire from
the Ferrous Concord."* Written once at award time by the existing lore synthesis and
stored on the award record, so the dossier reads as a real archive.

## 6. Wounds, Losses & Honest Scars

A record of what it cost, not only what was won:
- **Fortresses lost**, **armies expended**, **turns under siege**.
- **Black Turn** entries — the single worst engagement of each war, listed plainly.
Depth comes from the ledger being unflattering.

## 7. Career Chronicle

A chronological, dated column of one-line service entries — commissioned, first
blood, promotions, decorations, defeats, accords signed and broken. The dossier's
scroll spine, and the natural place to link back to each After-Action Dossier.

## 8. Regimental Identity

Let the commander name a **standing formation** (regiment) that persists across wars,
accruing its own battle honours list — the names of every front it fought on, stencilled
onto its colours. Cheap, and enormously atmospheric.

## 9. Nemesis & Comrade Records

Per-opponent tallies against other callsigns: wars fought, won, lost. The highest-loss
rival is stamped **NEMESIS** on the dossier; the most-allied callsign, **BROTHER-IN-ARMS**.

## 10. Ministry Assessment

A single evaluative line, recalculated after each war from the record's own numbers —
*"Aggressive. Wasteful of men. Effective."* — presented as the Ministry's opinion of
the commander. One sentence that makes the whole record feel observed.

---

## Suggested build order

1. Ribbon Bar + the ten easiest new decorations (all derivable from existing battle data).
2. Commissioned Rank + Service Points + the sealed promotion letter.
3. Citations on award, and the Career Chronicle that lists them.
4. Theater ribbons, Wounds ledger, Ministry Assessment.
5. Regimental identity and Nemesis records (needs cross-player aggregation).