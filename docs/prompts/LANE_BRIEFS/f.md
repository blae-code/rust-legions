# Lane F — Units, specialists & upgrades

> **This brief plus four documents is your entire instruction set.** Read, in this order:
> `CLAUDE.md` → `AGENTS.md` → `docs/VISION.md` → `docs/TACTICAL_SQUAD_PLAN.md` (**the contract**:
> §3 lanes/ownership, §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol) → then this
> brief → then your owned files and `test/helpers/extract-const.js`.
> Nothing else is required context. Where this brief and the plan disagree, **the plan wins** — and
> you fix this brief's error in your PR body.

---

## Goal

At the end of Lane F the game's tactical catalogue is three to four times wider and every widening is
a **number**, not a sentence. `SQUAD_TYPES` carries **at least 20 rows** (Lane A's 9 + your 11),
`SPECIALISTS` carries exactly **10**, a new `UPGRADES` table carries **10 W40K-style wargear kits**
with a hard **2-kits-per-squad** ceiling, the Army Design Bureau offers **≥6 options in each of its
4 slots**, and `src/lib/units.js` carries a **`[PROPOSED]` macro support-unit table** the platform
lane can lift verbatim into `gameEngine`. Every one of those rows is priced against
`riflemen ×10 = 100 pts` in a complete Points Audit in `docs/GEAR_LIBRARY.md`, with **no type above
1.6× baseline efficiency**; every new squad type has a placeholder art plate and at least one Codex
entry; and every new rule is drafted into `docs/GAME_RULES.md` as a section marked
`[PROPOSED — awaiting platform wiring]`.

You are a **CONTENT LANE**. You author **data and prose only**. You never author a visual.

---

## Owned files

Copied from `docs/TACTICAL_SQUAD_PLAN.md` §3, "Lane F — Units, specialists & upgrades":

| Path | What you may do to it |
| --- | --- |
| `base44/shared/tactical.ts` | **APPEND ROWS ONLY** to `SQUAD_TYPES` / `SPECIALISTS` / `UPGRADES` (+ create `UPGRADES` / `UPGRADE_RULES` if absent — see Work item 0). Never touch `TROOPS`, `ACTIONS`, `SIZE`, `SQUAD_ACTIONS`, `DEPLOYABLES`, `deriveSquad`, `poolCost`, `toRegiments`, `hexDistance`, or any of Lane A's 9 base rows. |
| `src/lib/tactical/data.js` | The mirror of the above. Same rows, **character-identical**. |
| `src/lib/units.js` | Add the new `PROPOSED_UNIT_TYPES` table only. `UNIT_TYPES`, `UNIT_KEYS`, `BUILDINGS`, `RESOURCE_*` are untouchable (see Work item 5 — touching `UNIT_TYPES` turns `npm test` red). |
| `src/lib/armyDesign.js` | Add option rows to the 4 existing slots. `SLOT_KEYS`, `DEFAULT_DESIGN` and `compileDesign`'s output shape are frozen. |
| `docs/GEAR_LIBRARY.md` | Append the Points Audit section. Do not rewrite §1–§10. |
| `docs/FACTION_ROSTER.md` | Append **one** new "Unit Access" section. Do not touch §1–§4. |
| `src/lib/imageLibrary.js` | Append placeholder plates to the `units`, `designs` and `gear` categories. `url` is always `null` (the `P()` helper does this — never pass a url). |

**Two files are shared with other content lanes and required of every content lane by
`TACTICAL_SQUAD_PLAN.md` §3's content-lane preamble ("Every content lane appends its additions to
`docs/GAME_RULES.md` as a draft section marked `[PROPOSED — awaiting platform wiring]` and adds
Codex entries in `src/lib/wiki/entries.js`"). You may append to them, and only append:**

| Path | What you may do to it |
| --- | --- |
| `docs/GAME_RULES.md` | Append **one** new numbered section at the very end, marked `[PROPOSED — awaiting platform wiring]`, taking the next free `## <number>.` **at the time you write** (Lanes G, H, I and J each append one too — read the file, do not assume §23 is yours). Never edit, reword, renumber or delete an existing section. (This file is otherwise platform-owned; note the append and the number you took in your PR body.) |
| `src/lib/wiki/entries.js` | Append entries to the **end** of the `ENTRIES` array. Never edit an existing entry, never touch `CATEGORIES` or `STATUS`. (Lane H owns this file and merges after you; append-only keeps its rebase clean.) |

**You may not edit any other file.** In particular, and non-exhaustively, these are other lanes' and
are forbidden to you: `base44/shared/tacticalEngine.ts`, `base44/shared/tacticalField.ts`,
`base44/shared/catalog.ts`, `base44/shared/arms.ts`, `base44/shared/motorPool.ts`,
`base44/functions/**` (platform), `base44/entities/**` (platform), `src/lib/tactical/field.js`,
`src/lib/doctrine.js`, `src/lib/armory.js`, `src/lib/presetFactions.js`, `src/lib/lifepath.js`,
`src/lib/pointBuy.js`, `src/lib/imagePlates.js`, `src/components/**` (Lanes D/E),
`src/pages/ArmyDesigner.jsx` (Lane D), `src/index.css` (Lane E),
`src/components/game/sprites/UnitSprite.jsx` (Lane E), `docs/COMBAT_DESIGN.md` (Lane A),
`docs/LORE.md` / `docs/HERALD_VOICES.md` (Lane H), `test/**` (see "No new test files" below),
`package.json`, `package-lock.json`.

**No new test files.** Lane F's owned-file list contains no test. Lane A owns
`test/tactical-mirror.test.js`; adding a competing test file duplicates its coverage and collides on
rebase. Your work is verified by the audit script in **Definition of done**, which lives *outside*
the repository. If you believe a permanent regression test is warranted, **request it in your PR
body** for Lane A to adopt — do not add it yourself.

**Drift-guard 9 note (`docs/COMBAT_DESIGN.md`).** §6.9 says a PR changing a rule number also edits
`docs/COMBAT_DESIGN.md`. That file is **Lane A's**. You discharge §6.9 by writing the Points Audit
(`GEAR_LIBRARY.md`) and the `[PROPOSED]` `GAME_RULES.md` section, and by listing in your PR body the
`COMBAT_DESIGN.md § Tactical squads` paragraphs Lane A should extend. Do not edit it.

---

## Contracts you consume

Verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §4.

**Produced by Lane A** (`base44/shared/tactical.ts` + `src/lib/tactical/data.js`) — the tables you
append to, the derivation that reads your rows, and the action keys your `specials[]` may name:

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed? }, blurb }
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
```

Lane A also delivers (do not author, do not edit — read them and conform):

- `deriveSquad(squad)` → `{ figures, melee, ranged, range, armor, speed, morale, initiative, actions[], pts }` applying figure scaling + specialists.
- `SQUAD_ACTIONS` — `fire, assault (melee), hold, grenade (AoE r1), mortar_barrage (AoE r1, indirect), suppress, smoke, build_<deployable>, rally, entrench`.
- `DEPLOYABLES` — `foxhole, trench, bunker, emplacement`.
- `poolCost`, `toRegiments` re-based on figures→companies.
- `Regiments ↔ figures: 1 company = FIGURES_PER_COMPANY` (Lane A sets; default 10 for infantry-derived, 1 for crawler/artillery/fighter — vehicles are single-figure squads). `toRegiments` rounds **down** so battles never create companies.

**Produced by Lane G** (`base44/shared/catalog.ts`) — you consume only its *key spaces*, never its
file: `creedLock` values, and the `Tech`/`ArmoryItem` `effects[]` element shape:

```ts
Tech       = { key, branch, tier: 1|2|3|4, label, cost, prereq: string|string[]|null, creedLock?, effect: string, effects: [{ scope: 'macro'|'tactical'|'economy', key: string, value: number }], desc }
```

**Produced by Lane H** (`src/lib/presetFactions.js`) — you consume only its *key space* for any
`factionLock` you use, never its file:

```ts
Preset     = existing PRESET_FACTIONS row + { house: string, uniqueRoster: { squads: SquadTypeKey[], upgrades: UpgradeKey[], decree: ArmoryKey, patterns: WeaponPatternKey[] }, heraldVoice: string }
```

**Plate helper** (`src/lib/imageLibrary.js`), consumed as-is:

```ts
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)  // url always null from a lane
```

**Effect `key` vocabulary** (verbatim §4 — the engine applies these; add new keys **in
`docs/TACTICAL_SQUAD_PLAN.md` §4 in the same PR** before using them):
`unit.<type>.attack|defense|melee|ranged|armor|speed|morale`, `income.<steel|fuel|manpower>`,
`armyCap`, `supplyRange`, `capitalDefense`, `initiative`, `losRange`, `digSpeed`, `fragmentYield`,
`moraleTest`, `buildTurns`.

---

## Contracts you produce

You must emit **exactly** these shapes — every field present on every row, no extra fields, no
renamed fields. These are §4 verbatim; they are the same three shapes listed above, restated here
because emitting them precisely is the deliverable:

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed? }, blurb }
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
```

Plus two tables this brief defines because no other lane declares them (both **pure data literals**,
both mirrored character-identically in `tactical.ts` and `data.js`):

```ts
UPGRADE_RULES      = { maxPerSquad: 2 }                                    // in base44/shared/tactical.ts + src/lib/tactical/data.js
PROPOSED_UNIT_TYPES = { [key]: { key, label, points, cost: { manpower?, steel?, fuel? }, attack, defense, speed, domain: 'land'|'sea'|'air', deployAt: string, effects: [{ scope, key, value }], blurb } }   // in src/lib/units.js ONLY
```

`PROPOSED_UNIT_TYPES` deliberately mirrors the shape of `UNIT_TYPES` **plus** `effects[]` and
`blurb`, so the platform lane can lift each row into `gameEngine`'s `UNITS` unchanged. It is
**not** added to `UNIT_KEYS` and **not** mirrored into `gameEngine` by you.

**Field-by-field rules for every row you write:**

- `key` — `snake_case`, unique across the whole table, and **never** a key that already exists.
- `from` — one of `riflemen | crawler | artillery | fighter` (`COLUMN_KEYS`). Mandated per type below.
- `tier` — one of `'I' | 'II:Cache' | 'II:Eng' | 'II:Ciph' | 'II:Wake' | 'III'`. Exact strings.
- `specials[]` — **only** these keys, no invention: `fire`, `assault`, `hold`, `grenade`,
  `mortar_barrage`, `suppress`, `smoke`, `build_foxhole`, `build_trench`, `build_bunker`,
  `build_emplacement`, `rally`, `entrench`. Needing a new one means editing §4/§3 **first**.
- `Specialist.mods` — **only** the six keys in the §4 shape (`morale`, `initiative`,
  `recoverPerTurn`, `moraleFloor`, `aoeSuppress`, `buildSpeed`). If a specialist genuinely needs
  another, add the optional key to §4's `Specialist` shape **in the same PR**, and pick it from the
  §4 effect vocabulary (`losRange`, `moraleTest` and `buildTurns` are pre-approved for this).
- `Upgrade.mods` — keys ⊆ `{ figures, melee, ranged, range, armor, speed, morale }` only.
- `blurb` / `doctrineNote` — Ministry voice, in-world military-ministry English, one or two
  sentences. Prose **describes**; numbers **decide**. No mechanic exists only in a blurb.
- `factionLock` / `creedLock` — omit unless mandated. When present, `creedLock` ∈
  `'recall' | 'finished_ledger' | 'flight' | 'discarding'` (the Four Departures, `docs/LORE.md` §2)
  and `factionLock` must be an id that already exists in `src/lib/presetFactions.js`. Those key
  spaces belong to Lanes G and H — **list every lock you use in your PR body** for reconciliation.

---

## Work items

Every minimum below is a number. All counts are **minimums** unless the word *exactly* appears.

### 0. Branch, rebase and the scaffolding contingency

0.1 Create your worktree: `scripts/agent-worktree.sh new tactical-f`. The script names the branch
`claude/tactical-f`; the plan's §7 protocol requires **`feat/tactical-f`**, so rename it
(`git branch -m feat/tactical-f`) before your first push. Push to `origin/feat/tactical-f` and open
a PR against `main` titled `tactical(f): squad roster, specialists, upgrade kits & points audit`.

0.2 **You merge after Lane A, and after Lanes I and J.** The systems track is `A/B → C → platform →
D/E`; the content track is `I → J → F → H`, and §5 additionally requires that **F, I and J all land
before Lane D starts**. Concretely, before you open the PR:
`git fetch origin && git rebase origin/main`, so your rows sit on top of Lane A's `SQUAD_TYPES` /
`SPECIALISTS` / `SQUAD_ACTIONS` / `DEPLOYABLES` / `deriveSquad` scaffolding **and** on top of Lane I's
`arms.ts` and Lane J's `motorPool.ts`. Rebase again after any of them merges while you are in flight,
and re-run the whole Definition of done on the rebase — a green run against a stale base proves
nothing. Lane H merges after you and references your keys, so **your keys are frozen the moment you
merge**; list every one of them in the PR body.

0.3 **If Lane A has not merged when you start: STOP and report to the orchestrator.** *(This replaces
an earlier instruction in this brief that told you to author the base 9 rows yourself as a
contingency. That instruction was wrong and is withdrawn.)* §3's ownership split is
**Lane A owns the structure and the derivations of `SQUAD_TYPES` / `SPECIALISTS`; Lane F appends rows
only** — the plan's own words for your lane are *"the rows of `SQUAD_TYPES / SPECIALISTS / UPGRADES`
… (Lane A owns derivations — F appends rows only)"*. Authoring Lane A's nine base rows would put two
lanes' hands on the same nine object literals in the same two files, which is precisely the collision
the ownership table exists to prevent, and it would calibrate your Points Audit against numbers that
are about to be overwritten. There is no version of this lane that ships before Lane A.

0.3.1 The one thing you may do while blocked is **read-only preparation**: draft your 11 rows' prose,
your `blurb`/`doctrineNote` copy, the Points Audit skeleton and the Codex entries in scratch, ready to
paste onto Lane A's merged tables. Write nothing into a repository file until the rebase is done.

0.4 `UPGRADES` and `UPGRADE_RULES` appear in no other lane's delivers list. If they do not exist
after rebase, **you create them** (table + rows) in both `base44/shared/tactical.ts` and
`src/lib/tactical/data.js`. If Lane A has created `UPGRADES`, you append rows only. Either way, say
in the PR body that Lane A should add `UPGRADES` and `UPGRADE_RULES` to
`test/tactical-mirror.test.js`'s table list, and that Lane A/C should read
`UPGRADE_RULES.maxPerSquad` rather than hard-coding 2.

### 1. Squad roster: 9 → 20 rows (11 new keys, all mandated)

Append **exactly these 11 keys**, with the mandated `from`, `tier` and `figures`. Everything else
(`melee, ranged, range, armor, speed, morale, pts, specials, blurb, doctrineNote, label, short`) you
author, inside the constraints in Work item 2.

| # | `key` | `label` (suggested) | `from` | `tier` | `figures` | Vehicle? | Design intent |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `stormtroops` | Stormtroops | `riflemen` | `I` | 8 | no | Elite Guard-flag assault company. High melee, low figure count, expensive. `GEAR_LIBRARY §8`. |
| 2 | `sappers` | Sappers | `riflemen` | `I` | 8 | no | Assault engineers: fastest builder in the roster; breaching charges. Distinct key from Lane A's `pioneers`. |
| 3 | `ski_troops` | Ski Troops | `riflemen` | `I` | 10 | no | Full function in snow; the speed answer to winter. |
| 4 | `digger_corps` | Digger Corps | `riflemen` | `I` | 10 | no | Excavation infantry; poor in a firefight, indispensable on a dig. |
| 5 | `pilgrim_levy` | Pilgrim Levy | `riflemen` | `I` | 14 | no | Cheap devout mass. Highest figure count, lowest per-figure value, morale that swings. |
| 6 | `provost` | Provost Section | `riflemen` | `I` | 6 | no | Discipline detachment — morale floor for neighbours, weak on its own. |
| 7 | `marksmen` | Marksmen | `riflemen` | `I` | 5 | no | Long ranged reach at tiny figure count; the counter-specialist killer. |
| 8 | `flame_team` | Flame Team | `riflemen` | `II:Eng` | 6 | no | Short range, brutal against works and cover; fragile. Gated at `II:Eng`. |
| 9 | `autocar_scouts` | Autocar Scouts | `crawler` | `I` | 1 | **yes** | Fast wheeled recon stand — speed and LOS, not weight. |
| 10 | `siege_mortar` | Siege Mortar | `artillery` | `I` | 1 | **yes** | Indirect AoE stand; `mortar_barrage`; cannot move and fire. |
| 11 | `land_dreadnought` | Land Dreadnought | `crawler` | `III` | 1 | **yes** | Relic super-heavy. Highest armor in the roster, slowest, most expensive. |

1.1 The three rows marked **Vehicle** have `figures: 1` — they are single-figure stands per §4's
figures↔regiments rule. All eight infantry rows have `from: 'riflemen'`.

1.2 At most **2** of the 11 rows may carry a `creedLock` or `factionLock`. `pilgrim_levy` is the
natural candidate (`creedLock: 'recall'`); `land_dreadnought` is the other. Every other row is
unlocked.

1.3 `land_dreadnought` is a `[III]` relic Object. `docs/GEAR_LIBRARY.md`'s "Integration & Balance
Notes" requires every `[III]` item to be an Object per `LORE §5` conventions — give it a named
in-world identity in its `blurb`, and cross-reference it in the Points Audit as a relic.

1.3.1 **`land_dreadnought` is a shared key and Lane G owns the other half of it.** §3 mandates the
same string as one of Lane G's four `RELIC_PROJECTS` (and its paired `ARMORY_ITEMS` row of kind
`relic_project`). They are two rows in two different tables describing **one** Object: G's row is the
*project* that builds it, yours is the *stand* that then fights. They must not contradict each other.
So: spell the key exactly `land_dreadnought`, give it `tier: 'III'`, keep your `blurb`'s named
in-world identity consistent with Lane G's `desc`, and **name the cross-reference in your PR body** so
the orchestrator can diff the two rows at merge. Do not edit Lane G's file to reconcile them.

### 2. Stat calibration (how you pick the numbers)

2.1 **Anchor on Lane A's merged rows, not on this brief.** After rebase, read the 9 base rows in
`base44/shared/tactical.ts`. For each of `melee, ranged, range, armor, speed, morale`, your 11 rows
must sit inside `[min, max]` of the 9 base rows' values for that field — with exactly **two**
sanctioned exceptions, both of which you must name in the Points Audit: `land_dreadnought.armor`
may exceed the base max by up to +2, and `marksmen.range` may exceed the base max by +1.

2.2 **Sanity bands, for reference while you draft** (they do not replace 2.1 — Lane A's merged rows
are always the calibration): `melee` 0–6, `ranged` 0–6, `range` 1–6, `armor` 0–5, `speed` 1–7,
`morale` 7–14 (a GURPS-style roll-under target — higher is steadier; `riflemen` = 10), `figures` as
mandated in Work item 1, `pts` a positive integer scaled to the 100-pt anchor squad (2.4). If a
drafted number sits outside Lane A's merged `[min, max]` for its field, 2.1 governs, not this list.

2.3 **`pts` are integers.** No fractional point costs anywhere in `SQUAD_TYPES`, `SPECIALISTS` or
`UPGRADES`.

2.4 **The baseline is `riflemen ×10 = 100 pts`, i.e. `SQUAD_TYPES.riflemen.pts === 100` — the cost of
one riflemen squad at its default **10** figures, which is 10 pts per figure.** *(An earlier draft of
this brief read `=== 10`, treating `pts` as a per-figure price. That contradicted Lane A, whose brief
sets the anchor at `SQUAD_TYPES.riflemen.pts = 100` and whose mirror test asserts it. `SquadType.pts`
is the **squad's** cost, not a figure's.)* If Lane A merged a different value, do **not** edit their
row — record the actual merged baseline in the Points Audit, recompute every ratio against it, and
flag the discrepancy in your PR body.

### 3. Specialists: 5 → exactly 10 (5 new keys, all mandated)

Append **exactly these 5**, keeping Lane A's `medic, signaler, commissar, heavy_gunner, sapper`
untouched:

| # | `key` | Intent | Mods to reach for |
| --- | --- | --- | --- |
| 1 | `chaplain` | Steadies the devout; the Procession's answer to the commissar without the pistol. | `morale`, `moraleFloor` |
| 2 | `cartographer` | Sees further and orders sooner. | `initiative`, plus `losRange` if you extend §4's `Specialist` shape |
| 3 | `forward_observer` | Makes indirect fire land where it was aimed. | `aoeSuppress`, `initiative` |
| 4 | `provost_sergeant` | The squad does not rout; it bleeds instead. | `moraleFloor`, `morale` |
| 5 | `relic_bearer` | Carries the Object; the squad fights above itself while it holds. | `morale`, `recoverPerTurn` |

3.1 Every one of the 5 has a numeric `mods` object with **at least one** key set. **No prose-only
effects** (§3 Lane A: "the five in §1 with explicit numeric mods"). A specialist whose only effect
is in its `blurb` is a lane failure.

3.2 `pts` for each specialist: a positive integer, and **no more than 25% of the anchor squad's cost**
(`SQUAD_TYPES.riflemen.pts`, i.e. ≤ 25 at the 100-pt anchor). Derive the ceiling from the merged
anchor rather than retyping a digit; a two-slot attachment that costs more than a quarter of a full
squad is a design error, and a specialist priced at a rounding error against a 100-pt squad is a
different one. State each specialist's price as a fraction of the anchor in the Points Audit.

3.3 If you need `losRange`, `moraleTest` or `buildTurns` on `Specialist.mods`, add the optional key
to §4's `Specialist` line in `docs/TACTICAL_SQUAD_PLAN.md` **in the same PR** and say so in the PR
body. Those three are pre-approved (they are already in §4's effect vocabulary). Anything else needs
a §4 edit and an explicit flag.

### 4. Upgrade kits: exactly 10 `UPGRADES` rows + `UPGRADE_RULES`

Append **exactly these 10 keys**:

`armor_skirts`, `storm_hoods`, `wire_spades`, `sapper_plate`, `ski_conversions`, `mine_flails`,
`marksman_pattern`, `drum_magazines`, `gas_shells`, `radio_pack`

4.1 Each row is the §4 `Upgrade` shape exactly:
`{ key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }`.

4.2 `appliesTo` is a **non-empty** array, and **every string in it must be a key that exists in
`SQUAD_TYPES`** after your Work item 1 append. The audit script fails on a dangling key.

4.3 **No free upgrades.** Every kit must satisfy at least one of: (a) `mods` contains at least one
**negative** number (a real tradeoff); or (b) `tier` is not `'I'` (gated behind a fragment class).
`armor_skirts` (+armor, −speed) and `drum_magazines` (+ranged, −morale or −range) are the model.

4.4 `pts`: a positive integer, and **no more than 40% of the anchor squad's cost**
(`SQUAD_TYPES.riflemen.pts`, i.e. ≤ 40 at the 100-pt anchor) — and remember a squad may carry
**`UPGRADE_RULES.maxPerSquad`** kits, so two kits at the ceiling must still cost less than a second
squad. Derive from the merged anchor; do not retype a digit.

4.5 Tier alignment with `docs/GEAR_LIBRARY.md` §8, which already names five of these: `sapper_plate`
`[I]`, `wire_spades` `[I]`, `storm_hoods` `[II:Cache]`, and (§7) `armor_skirts` `[I]`,
`ski_conversions` `[I]`, `mine_flails` `[I]`. Use those tiers — the doc is the existing record and
contradicting it is drift.

4.6 Add `export const UPGRADE_RULES = { maxPerSquad: 2 };` to **both** `base44/shared/tactical.ts`
and `src/lib/tactical/data.js`, character-identical. It is a pure object literal so
`extract-const.js` can lift it. Document the ceiling in the `[PROPOSED]` `GAME_RULES.md` section by
*referencing this constant*, never by retyping the digit (drift guard 7).

### 5. `src/lib/units.js` — ≥7 `PROPOSED_UNIT_TYPES` rows

5.1 **Do not add a key to `UNIT_TYPES`.** `test/rules-mirror.test.js` asserts
`Object.keys(gameEngine.UNITS).sort()` deep-equals `Object.keys(UNIT_TYPES).sort()`; `gameEngine` is
platform-owned and you may not edit it, so a new `UNIT_TYPES` key turns `npm test` **red** on the
test named `units — gameEngine.UNITS ↔ src/lib/units.js UNIT_TYPES › has the same unit keys on both
sides`. This is the single easiest way to fail this lane.

5.2 Instead add a new export:

```js
// [PROPOSED — awaiting platform wiring] Macro support classes (GEAR_LIBRARY §7).
// Not in UNIT_KEYS and not mirrored in gameEngine: the platform lane lifts these
// rows into gameEngine's UNITS when it wires them, at which point they move into
// UNIT_TYPES and the mirror test covers them.
export const PROPOSED_UNIT_TYPES = { /* ... */ };
```

5.3 **≥7 rows**, drawn from the support classes `docs/GEAR_LIBRARY.md` §7 already names and for
which `src/lib/imageLibrary.js` **already carries plates** (so no new plate is needed for them):
`draught_column`, `siege_train`, `bridging_train`, `signals_wagon`, `salvage_detachment`,
`hospital_train`, `provost_column`.

5.4 Each row carries the `UNIT_TYPES` field set (`key, label, points, cost, attack, defense, speed,
domain, deployAt`) **plus** `effects: [...]` using **only** §4 vocabulary keys — `supplyRange`,
`digSpeed`, `losRange`, `armyCap`, `income.<steel|fuel|manpower>`, `buildTurns` are the relevant
ones — **plus** a Ministry-voice `blurb`. `deployAt` must be an existing `BUILDINGS` key
(`barracks`, `foundry`, `refinery`, `fortifications`, `airstrip`).

### 6. `src/lib/armyDesign.js` — ≥6 options in each of 4 slots (10 new options)

Current counts: `formation` 4, `weapon` 3, `armor` 3, `support` 4. Minimum new options: **+2
formation, +3 weapon, +3 armor, +2 support = 10 new options**, taking every slot to **≥6**.

6.1 **Never rename or remove** any of the 14 existing options (`line, vanguard, skirmish, column`;
`rifles, trench_guns, mortars`; `standard, plated, scout`; `none, medics, signals, commissars`) —
live saves reference them.

6.2 `SLOT_KEYS`, `DEFAULT_DESIGN`, and `compileDesign`'s **output shape**
(`{ skill, dmgOut, dmgIn, moraleIn, cost: { manpower, steel, fuel } }`) are **frozen**. Lane D's
`ArmyDesigner.jsx`, `DesignCard.jsx` and `SlotPicker.jsx` iterate `slot.options` and read
`opt.label` / `opt.desc`, so purely additive options render with **zero component edits** — which is
the point. Adding a key to `compileDesign`'s output is allowed; removing or renaming one is not.

6.3 Every new option carries: `label`, `desc` (Ministry voice, and the desc must state the numbers,
not vibes), the legacy modifier fields it needs (`skill`, `dmgOut`, `dmgIn`, `moraleIn`, `cost`), and
— per §3 Lane F, "modifiers expressed as squad mods, so a saved design = a squad template + kits" —
a `mods: { ... }` object whose keys ⊆ `{ figures, melee, ranged, range, armor, speed, morale }`, plus
`effects: [...]` (§4 vocabulary only) if the option reaches beyond the squad.

6.4 Every non-default option must have a real cost: a `cost` entry, a negative modifier, or both. No
strictly-better option in any slot.

### 7. `src/lib/imageLibrary.js` — 28 new placeholder plates

**Never** an image file, never SVG, never a `PLATE_URLS` entry, never a `UnitSprite.jsx` edit
(drift guard 10). Only `P(...)` rows with `url` left to the helper (always `null` until the platform
lane delivers).

**⚠ THE SHARED-FILE PROTOCOL — five lanes append to this one file (F, G, H, I and J), so the shape of
the append is a contract, not a preference.**

- **All 28 of your plates go into ONE contiguous block appended at the very END of the
  `IMAGE_LIBRARY` array**, immediately before the closing `];`, opened by a single banner comment
  naming your lane and nothing else on that line:

  ```js
  // ——— LANE F: squad tokens, upgrade kits & design patterns ———
  ```

  One block per lane, all at the tail. Two lanes appending then collide as two adjacent tail blocks
  and the resolution is always the same mechanical one — **keep both, in lane order** — instead of an
  unresolvable interleave inside a category section.
- **Never insert a plate into an existing category section** in the middle of the array, however
  natural it looks next to its neighbours. Never reorder, reflow, reformat, edit or delete an
  existing row. The `category` field is what groups a plate; its position in the array is not.
- **New `IMAGE_CATEGORIES` keys, if any, go inside the existing `IMAGE_CATEGORIES` object, on their
  own line, adjacent to the keys already there** — never in your tail block. One added line is a
  trivial conflict; a restructured object is not. **Lane F needs none**: `units`, `gear` and
  `designs` all exist already. (Lane I adds `arms` and Lane J adds `motor` this way.)
- `url` is never passed — `P(...)` fills it from `PLATE_URLS[key] || null`. **Never touch
  `src/lib/imagePlates.js`.**

| Group | Count | Key pattern | Category |
| --- | --- | --- | --- |
| Squad-type tokens | **11** | `unit_<key>_token` for all 11 Work-item-1 keys | `units` |
| Vehicle action plates | **3** | `unit_<key>_action` for `autocar_scouts`, `siege_mortar`, `land_dreadnought` | `units` |
| Upgrade kits | **4** | `kit_marksman_pattern`, `kit_drum_magazines`, `kit_gas_shells`, `kit_radio_pack` | `gear` |
| Design Bureau options | **10** | `design_<new_option_key>`, one per Work-item-6 option | `designs` |

7.1 **Only 4 kit plates, not 10.** `kit_armor_skirts`, `kit_storm_hoods`, `kit_wire_spades`,
`kit_sapper_plate`, `kit_ski_conversions` and `kit_mine_flails` **already exist** in
`src/lib/imageLibrary.js`. Registering them again is a duplicate key. Do not.

7.2 **Register all 11 `unit_<key>_token` plates even where an older bare plate exists.** Six older
sketch plates (`unit_stormtroops`, `unit_sappers`, `unit_ski_troops`, `unit_digger_corps`,
`unit_pilgrim_levy`, `unit_provost_column`) predate this lane. Acceptance requires the canonical
`unit_<key>_token` key, and drift guard 10 forbids renaming an existing key — so **add the new keys
and leave the six old plates exactly as they are**, then list those six duplicates in the Points
Audit's Plate Register (Work item 8.5) so the platform lane generates one image, not two.

7.3 **The prompt must NOT repeat `HOUSE_STYLE`.** `HOUSE_STYLE` ("Gritty dieselpunk, 1930s
industrial wartime aesthetic…") is prepended at generation time. A prompt that restates it produces
a doubled prompt. Write only what is specific to *this* subject: the figures, the kit, the pose, the
ground, the light. 15–35 words.

7.4 `aspect`: `"1:1"` (the `P()` default, so omit it) for tokens, kits and design cards; `"16:9"`
for the 3 `_action` plates.

7.5 Zero duplicate keys anywhere in `IMAGE_LIBRARY` after your append — the audit script checks.

### 8. `docs/GEAR_LIBRARY.md` — the complete Points Audit

Append **one** new section, `## 11. Points Audit — Tactical Squads, Specialists & Kits (Lane F)`,
containing all five of:

8.1 **The efficiency formula, stated verbatim**, so anyone can recompute it:

```
value(t)      = t.figures × ( t.melee + t.ranged + 0.6×t.armor + 0.35×t.speed + 0.5×t.morale + 0.25×(t.range − 1) )
efficiency(t) = value(t) ÷ t.pts
baseline      = efficiency(SQUAD_TYPES.riflemen)          // the reference: riflemen ×10 = 100 pts
ratio(t)      = efficiency(t) ÷ baseline
HARD GATE:      ratio(t) ≤ 1.60 for every t in SQUAD_TYPES
```

8.2 **One table row for every row in `SQUAD_TYPES`** — all 20+, base 9 included, not just yours —
with columns `key · from · tier · figures · pts · value · efficiency · ratio`, ratios to 2 decimals.
The section is not "complete" if a single type is missing.

8.3 A **specialist pricing table** (10 rows: `key · pts · mods · one-line justification`) and an
**upgrade-kit pricing table** (10 rows: `key · appliesTo · tier · pts · mods · the tradeoff`).

8.4 A short **justification paragraph per new type** — one or two sentences each, 11 of them —
saying what the points buy and why the ratio is where it is. Name explicitly the two sanctioned
band exceptions from Work item 2.1.

8.5 A **Plate Register** subsection: the 28 new plate keys, and the six pre-existing duplicate
`unit_*` sketch plates from 7.2 with a line telling the platform lane which key is canonical.

8.6 Report (do **not** fail on) any type whose `ratio(t) < 0.55` — a type nobody would ever field is
a balance smell worth naming, but it is not a gate.

### 9. `docs/FACTION_ROSTER.md` — one Unit Access section

Append **one** new section, `## 5. Unit Access — Tactical Squads & Kits [PROPOSED]`, after §4. Do
not touch §1–§4.

9.1 A table with **exactly 10 rows**, one per house in §1 (`The Iron Reclamation`, `The Charter
Combine`, `The Bastion Synod`, `The Covenant of Locks`, `The Signal Ascendancy`, `The Commonweal
March`, `The Salvage Court`, `The Emberwright Union`, `The Long Procession`, `The Outrider
Compact`), with columns `House · Signature squad type(s) · Signature upgrade kit(s) · Note`.

9.2 Every key named in that table must exist in `SQUAD_TYPES` or `UPGRADES` after your append.
Keys are "signature" (flavour + Lane H's `uniqueRoster`) — they are **not** `factionLock`s unless
you also set the lock on the row, and at most 2 rows in the whole roster carry a lock (2.1/1.2).

9.3 A closing paragraph listing every `factionLock` / `creedLock` value you used, addressed to Lanes
G and H for reconciliation — repeat it in your PR body.

### 10. `docs/GAME_RULES.md` — one `[PROPOSED]` section

10.1 Append **one** section at the very end of the file. The file currently ends at `## 22. Macro
Operations`, so yours is `## 23. Squads, Specialists & Upgrade Kits [PROPOSED — awaiting platform
wiring]`. **If §23 is taken when you rebase, renumber to the next free number** — mechanical, no
discussion.

10.2 Contents: the squad roster table (`key · label · from · tier · figures · pts`), the specialist
table, the upgrade-kit table with `appliesTo`, and the max-kits ceiling stated as *"a squad may
carry at most `UPGRADE_RULES.maxPerSquad` kits"* — **reference the constant, never retype the
digit** (drift guard 7: numbers live in one place, and that place is
`base44/shared/tactical.ts`).

10.3 Open the section with a one-line note: *"Every number in this section is read from
`base44/shared/tactical.ts`; nothing here is live until the platform lane wires it."*

### 11. `src/lib/wiki/entries.js` — ≥11 Codex entries

11.0 **The same shared-file protocol as the image library, and for the same reason** — Lanes F, G, H,
I and J all add Codex entries, and Lane H **owns** this file and merges last. Your entries go into
**ONE contiguous block appended at the very END of the `ENTRIES` array**, before the closing `];`,
opened by a single banner comment:

```js
// ——— LANE F: squad types ———
```

Never edit an existing entry, never insert into the middle of the array, and never touch `CATEGORIES`,
`STATUS`, `entryText` or `citedBy`. A concurrent append is then two adjacent tail blocks — keep both.

11.1 **≥1 entry per new squad type** = at least 11 new entries.

11.2 Entry shape, per the schema comment at the top of that file:
`{ id, title, folk?, category, tag, status, summary, blocks: [...], see: [...] }`.
`blocks` are `{ lead }` / `{ p }` / `{ h }` / `{ list: [] }` / `{ table: { head, rows } }` /
`{ note }` (see `src/lib/fieldManual.js`).

11.3 `id` — `squad-<key>` with underscores turned to hyphens (`squad-ski-troops`,
`squad-land-dreadnought`). Unique across the whole array.

11.4 `category` — `"war"` (The Machine of War) for all of them.

11.5 `status` — the file's own rule: *"Entries here must never invent canon — when an entry needs
something the source documents don't say, mark it status 'thin'."* So: `"canon"` with
`tag: "Gear Library §8"` for the five types `GEAR_LIBRARY.md` §8 already names (`sappers`,
`stormtroops`, `ski_troops`, `digger_corps`, `pilgrim_levy`); **`"thin"`** with
`tag: "Gear Library §11"` for the six this lane invents (`provost`, `marksmen`, `flame_team`,
`autocar_scouts`, `siege_mortar`, `land_dreadnought`).

11.6 Every entry has a non-empty `see: []` cross-linking at least one other entry id that actually
exists in the array (yours or an existing one).

11.7 No numbers in Codex prose that are not read from the tables — describe the role, cite the tier,
and leave the stat block to the Points Audit.

---

## Acceptance criteria

**Verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane F:**

> Acceptance: mirror test green; Points Audit complete; each new type has a `unit_<key>_token`
> placeholder (vehicles also `unit_<key>_action`); ≥1 Codex entry per type.

**Plus these lane-specific checks, each of which the audit script in Definition of done verifies
mechanically:**

| # | Check | Pass condition |
| --- | --- | --- |
| A1 | Roster size | `Object.keys(SQUAD_TYPES).length >= 20` and all 11 mandated keys present |
| A2 | Specialists | `Object.keys(SPECIALISTS).length === 10`; all 5 mandated new keys present; every one has ≥1 numeric mod |
| A3 | Upgrades | `Object.keys(UPGRADES).length === 10`; all 10 mandated keys present |
| A4 | `UPGRADE_RULES` | exists in both files, `{ maxPerSquad: 2 }` |
| A5 | Mirror equality | `SQUAD_TYPES`, `SPECIALISTS`, `UPGRADES`, `UPGRADE_RULES` lifted from `base44/shared/tactical.ts` with `extract-const.js` deep-equal the imports from `src/lib/tactical/data.js` |
| A6 | No key loss | every key present in `SQUAD_TYPES` / `SPECIALISTS` / `UNIT_TYPES` / `DESIGN_SLOTS.*.options` on `origin/main` is still present |
| A7 | Shape | every new row has every field of its §4 shape and no extra fields; `tier` ∈ the 6 legal strings; `from` ∈ `COLUMN_KEYS` |
| A8 | `specials[]` | every string is in the 13-key allowed action list |
| A9 | `appliesTo` | every string in every `Upgrade.appliesTo` is a live `SQUAD_TYPES` key |
| A10 | No free upgrades | every `UPGRADES` row has a negative mod **or** `tier !== 'I'` |
| A11 | Points Audit gate | `ratio(t) ≤ 1.60` for every `t` in `SQUAD_TYPES`, using the 8.1 formula |
| A12 | Audit completeness | `docs/GEAR_LIBRARY.md` §11 contains one table row per `SQUAD_TYPES` key |
| A13 | Design slots | each of `formation`/`weapon`/`armor`/`support` has ≥6 options; ≥10 new; `SLOT_KEYS` and `DEFAULT_DESIGN` unchanged |
| A14 | Plates | all 11 `unit_<key>_token` + 3 `unit_<key>_action` + 4 `kit_*` + 10 `design_*` keys present in `src/lib/imageLibrary.js`; **zero duplicate plate keys**; no prompt contains a `HOUSE_STYLE` phrase |
| A15 | Codex | ≥11 new `squad-*` entries; zero duplicate `id`s across `ENTRIES`; every `see` target exists |
| A16 | `[PROPOSED]` markers | the new `GAME_RULES.md` section heading contains the literal string `[PROPOSED — awaiting platform wiring]`; `PROPOSED_UNIT_TYPES` is not in `UNIT_KEYS` |
| A17 | Forbidden files | `git diff --name-only origin/main` lists **only** the 9 paths in Owned files |
| A18 | Purity | every table you touched is a pure data literal (see Drift guards) |

---

## Drift guards

**The `docs/TACTICAL_SQUAD_PLAN.md` §6 list, in full — all thirteen apply to your PR:**

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it.
   UI-only fields are allowlisted in the test. *(Your simplest compliance: write each row
   **character-identical** in both files. Then a strict deep-equal passes and no allowlist is
   needed.)*
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations,
   autoFormations, autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported.
   *(You do not touch that file at all.)*
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind
   classes must be literal strings. *(You write no JSX; the guard still binds if you are tempted.)*
5. **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only. *(`@/` only inside `src/`.
   `base44/shared/*.ts` uses relative imports — never `@/` there.)*
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from
   `data.js`, never retyped. *(Applies to your docs too: reference `UPGRADE_RULES.maxPerSquad`,
   don't type "2".)*
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`.
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and
   flags `docs/GAME_RULES.md` for the platform lane. *(See the Owned-files note: `COMBAT_DESIGN.md`
   is Lane A's; you discharge this via the Points Audit + `[PROPOSED]` section + a PR-body flag.)*
10. **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no
    `UnitSprite.jsx` edits. Art is requested only as `imageLibrary.js` placeholders with `url:
    null`. **Existing catalog keys are never renamed or removed (live saves reference them.)** Every
    new mechanical effect uses the §4 effect-key vocabulary or extends it in the same PR.
11. **Arms granularity stays numeric and server-rolled** — no weapon stat exists only in prose;
    every quirk carries a machine-evaluable `condition`; `rollWeapon` is pure and seeded (no
    `Math.random`); the tactical engine consumes only `deriveLoadout` output. *(Lane I's file, but
    the "no `Math.random`, nothing prose-only" half binds you: **no `Math.random` anywhere in Lane
    F**, and no effect that exists only in a `blurb`.)*
12. **One damage model** — armour math exists only in `arms.ts`. *(So: your rows declare `armor` as
    a value and nothing more. Never write a penetration or damage formula in `tactical.ts`,
    `data.js` or your docs.)*
13. **Mechanized granularity mirrors arms** — vehicles are chassis + powerplant + armour package +
    suspension + mount + hardpoints + mods + quirks; `rollVehicle` is pure and seeded; the engine
    consumes only `deriveMechanized` output plus `facings`. *(Your three vehicle rows are
    `SquadType` rows with `figures: 1`. Do **not** give them chassis/powerplant/hardpoint fields —
    that is Lane J's `motorPool.ts`.)*

**Environment rules — non-negotiable:**

- **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store
  (`/home/blae/.node-modules-store/rust-legions/node_modules`) and npm **silently deletes the
  symlink** and reifies a real directory in its place. Dependencies are already installed.
- **NEVER edit `package.json` or `package-lock.json`** (drift guard 3).
- Run tests with `npm test` (vitest run). Run lint with `npm run lint`.
- `@/` imports only inside `src/`. `base44/shared/*.ts` uses relative paths.
- No hex colours anywhere. No non-literal / template-built Tailwind class strings — Tailwind purges
  what it cannot see as a literal.
- Ministry voice in every user-visible string. Components ≤ ~60 lines, one per file. (Lane F writes
  no components; the rule stands if you find yourself about to.)
- **Existing catalog keys are NEVER renamed or removed — live saves reference them.**
- Numbers live in one place: any constant shown in UI copy is imported from `src/lib`, never
  retyped.

**Purity rule — the one that silently breaks the mirror tests:**

Every table exported from a `base44/shared/*.ts` file **MUST be a PURE DATA LITERAL** —
`export const NAME = { ... }` or `export const NAME = [ ... ]`, containing only numbers, strings,
booleans, `null`, and nested objects/arrays. **No spreads (`...BASE`), no computed keys
(`[k]: v`), no function calls, no template literals in keys, no references to other constants, no
`Math.*`.** `test/helpers/extract-const.js` lifts these tables **textually** out of the Deno source
(which cannot be imported into vitest) and evaluates them with
`Function('"use strict"; return (' + expr + ');')` — an expression referencing anything in module
scope throws `ReferenceError`, by design, loudly. A computed table **cannot be mirror-tested**, so a
computed table is a lane failure even when it evaluates correctly at runtime. The one exception the
helper allows is a trailing chain of pure array transforms
(`map/flatMap/flat/filter/slice/concat/reverse`) whose callback is self-contained — **do not use
it**; write the rows out.

**Ownership rule:**

You work in your **own git worktree** on branch **`feat/tactical-f`**, push to
`origin/feat/tactical-f`, and open a PR against `main`. You **never edit another lane's files**. If
a contract must change, you edit **`docs/TACTICAL_SQUAD_PLAN.md` §4 FIRST** and say so explicitly in
the PR body. The PR body must list: contract sections touched, every `factionLock`/`creedLock` value
used, the two shared files you appended to (`GAME_RULES.md`, `wiki/entries.js`), the requests to
Lane A (mirror-test table list, `UPGRADE_RULES` consumption, `COMBAT_DESIGN.md` paragraphs), and the
six duplicate `unit_*` plate keys for the platform lane.

---

## Definition of done

Run all four, from the worktree root, in this order. All four must be green **before** you open the
PR, and again after your final rebase onto `main`.

### 1. Tests

```bash
npm test
```

Green looks like: **`Test Files  N passed (N)` / `Tests  M passed (M)`, zero failed.** The baseline
on `main` before this lane is `6 passed (6)` files / `95 passed (95)` tests — after Lane A merges,
expect more. **Any** failure is a stop, and these two are the ones this lane causes:

- `units — gameEngine.UNITS ↔ src/lib/units.js UNIT_TYPES › has the same unit keys on both sides` →
  you added a key to `UNIT_TYPES`. Move it to `PROPOSED_UNIT_TYPES` (Work item 5).
- anything in `test/tactical-mirror.test.js` → a row differs between `tactical.ts` and `data.js`, or
  a table stopped being a pure data literal.

### 2. Lint

```bash
npm run lint
```

Green looks like: **no output and exit status 0** (`eslint . --quiet` prints nothing on success).

### 3. Rules guard

```bash
bash .claude/hooks/rules-guard.sh < /dev/null
```

Green looks like: **exit status 0**. It is a passive reminder hook and never blocks; with empty
stdin it prints nothing. If it prints the `↺ rules file changed` line, that is the reminder that
`src/lib/armyDesign.js` / `src/lib/units.js` are mirrored rules files — you have already handled
that via `PROPOSED_UNIT_TYPES`; run `npm run rules:check` to confirm.

### 4. The Lane F audit

There is **no new test file** (see Owned files). Write this script **outside the repository** — e.g.
`/tmp/lane-f-audit.mjs` — and run it **from the worktree root** so `process.cwd()` resolves the
repo:

```js
// /tmp/lane-f-audit.mjs — Lane F acceptance audit. Run: cd <worktree> && node /tmp/lane-f-audit.mjs
import { deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const R = (p) => pathToFileURL(resolve(process.cwd(), p)).href;
const T = (p) => readFileSync(resolve(process.cwd(), p), 'utf8');
const { extractConst, readRepoFile } = await import(R('test/helpers/extract-const.js'));
const M = await import(R('src/lib/tactical/data.js'));
const U = await import(R('src/lib/units.js'));
const A = await import(R('src/lib/armyDesign.js'));
const W = await import(R('src/lib/wiki/entries.js'));

const ts = readRepoFile('base44/shared/tactical.ts');
const fail = [];
const ck = (ok, msg) => { if (!ok) fail.push(msg); };

// A5 — mirror equality (character-identical rows ⇒ strict deep-equal)
for (const t of ['SQUAD_TYPES', 'SPECIALISTS', 'UPGRADES', 'UPGRADE_RULES']) {
  try { deepStrictEqual(extractConst(ts, t), M[t]); }
  catch (e) { fail.push(`A5 ${t}: ${e.message.split('\n')[0]}`); }
}

const ST = M.SQUAD_TYPES, SP = M.SPECIALISTS, UP = M.UPGRADES;
const NEW_TYPES = ['stormtroops','sappers','ski_troops','digger_corps','pilgrim_levy','provost',
  'marksmen','flame_team','autocar_scouts','siege_mortar','land_dreadnought'];
const NEW_SPEC  = ['chaplain','cartographer','forward_observer','provost_sergeant','relic_bearer'];
const KITS      = ['armor_skirts','storm_hoods','wire_spades','sapper_plate','ski_conversions',
  'mine_flails','marksman_pattern','drum_magazines','gas_shells','radio_pack'];
const ACTIONS   = new Set(['fire','assault','hold','grenade','mortar_barrage','suppress','smoke',
  'build_foxhole','build_trench','build_bunker','build_emplacement','rally','entrench']);
const TIERS     = new Set(['I','II:Cache','II:Eng','II:Ciph','II:Wake','III']);
const COLUMN    = new Set(['riflemen','crawler','artillery','fighter']);

ck(Object.keys(ST).length >= 20, `A1 SQUAD_TYPES ${Object.keys(ST).length} < 20`);
for (const k of NEW_TYPES) ck(ST[k], `A1 missing squad type ${k}`);
ck(Object.keys(SP).length === 10, `A2 SPECIALISTS ${Object.keys(SP).length} !== 10`);
for (const k of NEW_SPEC) ck(SP[k], `A2 missing specialist ${k}`);
for (const k of NEW_SPEC) ck(Object.values(SP[k]?.mods || {}).some(Number.isFinite), `A2 ${k} has no numeric mod`);
ck(Object.keys(UP).length === 10, `A3 UPGRADES ${Object.keys(UP).length} !== 10`);
for (const k of KITS) ck(UP[k], `A3 missing upgrade ${k}`);
ck(M.UPGRADE_RULES?.maxPerSquad === 2, 'A4 UPGRADE_RULES.maxPerSquad !== 2');

// A7/A8 — shape, tier, from, specials
const FIELDS = ['key','label','short','from','tier','figures','melee','ranged','range','armor','speed','morale','pts','specials','blurb','doctrineNote'];
for (const [k, t] of Object.entries(ST)) {
  for (const f of FIELDS) ck(t[f] !== undefined, `A7 ${k} missing field ${f}`);
  ck(TIERS.has(t.tier), `A7 ${k} bad tier ${t.tier}`);
  ck(COLUMN.has(t.from), `A7 ${k} bad from ${t.from}`);
  ck(Number.isInteger(t.pts) && t.pts > 0, `A7 ${k} pts not a positive integer`);
  for (const s of t.specials || []) ck(ACTIONS.has(s), `A8 ${k} unknown special ${s}`);
}
// A9/A10 — appliesTo resolves; no free upgrades
for (const [k, u] of Object.entries(UP)) {
  ck(Array.isArray(u.appliesTo) && u.appliesTo.length > 0, `A9 ${k} empty appliesTo`);
  for (const s of u.appliesTo || []) ck(ST[s], `A9 ${k} dangling appliesTo ${s}`);
  const neg = Object.values(u.mods || {}).some((v) => v < 0);
  ck(neg || u.tier !== 'I', `A10 ${k} is a free tier-I upgrade`);
}
// A11 — Points Audit gate
const value = (t) => t.figures * (t.melee + t.ranged + 0.6 * t.armor + 0.35 * t.speed + 0.5 * t.morale + 0.25 * (t.range - 1));
const eff = (t) => value(t) / t.pts;
if (ST.riflemen?.pts !== 100) console.log(`WARN riflemen.pts = ${ST.riflemen?.pts} (expected 100 — the anchor squad at 10 figures) — flag in PR body`);
const base = eff(ST.riflemen);
const audit = T('docs/GEAR_LIBRARY.md');
for (const [k, t] of Object.entries(ST)) {
  const r = eff(t) / base;
  console.log(`${r > 1.6 ? 'FAIL' : r < 0.55 ? 'thin' : ' ok '} ${k.padEnd(18)} pts ${String(t.pts).padStart(3)}  ratio ${r.toFixed(2)}`);
  ck(r <= 1.6, `A11 ${k} ratio ${r.toFixed(2)} > 1.60`);
  ck(audit.includes(k), `A12 ${k} absent from the GEAR_LIBRARY Points Audit`);
}
// A13 — design slots
for (const s of ['formation','weapon','armor','support']) {
  const n = Object.keys(A.DESIGN_SLOTS[s].options).length;
  ck(n >= 6, `A13 slot ${s} has ${n} options, needs >= 6`);
}
ck(JSON.stringify(A.SLOT_KEYS) === JSON.stringify(['formation','weapon','armor','support']), 'A13 SLOT_KEYS changed');
// A14 — plates
const lib = T('src/lib/imageLibrary.js');
const keys = [...lib.matchAll(/P\("([^"]+)"/g)].map((m) => m[1]);
const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
ck(dupes.length === 0, `A14 duplicate plate keys: ${[...new Set(dupes)].join(', ')}`);
for (const k of NEW_TYPES) ck(keys.includes(`unit_${k}_token`), `A14 missing plate unit_${k}_token`);
for (const k of ['autocar_scouts','siege_mortar','land_dreadnought']) ck(keys.includes(`unit_${k}_action`), `A14 missing plate unit_${k}_action`);
for (const k of ['marksman_pattern','drum_magazines','gas_shells','radio_pack']) ck(keys.includes(`kit_${k}`), `A14 missing plate kit_${k}`);
ck(!/Gritty dieselpunk, 1930s industrial/.test(lib.split('HOUSE_STYLE =')[1]?.slice(200) || ''), 'A14 a prompt repeats HOUSE_STYLE');
// A15 — codex
const ids = W.ENTRIES.map((e) => e.id);
ck(ids.length === new Set(ids).size, 'A15 duplicate Codex ids');
ck(W.ENTRIES.filter((e) => e.id.startsWith('squad-')).length >= 11, 'A15 fewer than 11 squad-* Codex entries');
for (const e of W.ENTRIES.filter((e) => e.id.startsWith('squad-')))
  for (const s of e.see || []) ck(ids.includes(s), `A15 ${e.id} sees missing entry ${s}`);
// A16 — [PROPOSED] markers
ck(T('docs/GAME_RULES.md').includes('[PROPOSED — awaiting platform wiring]'), 'A16 GAME_RULES section is not marked [PROPOSED — awaiting platform wiring]');
ck(Object.keys(U.PROPOSED_UNIT_TYPES || {}).length >= 7, 'A16 PROPOSED_UNIT_TYPES has fewer than 7 rows');
for (const k of Object.keys(U.PROPOSED_UNIT_TYPES || {})) ck(!U.UNIT_KEYS.includes(k), `A16 ${k} leaked into UNIT_KEYS`);

console.log(`\n${Object.keys(ST).length} types · ${Object.keys(SP).length} specialists · ${Object.keys(UP).length} kits`);
if (fail.length) { console.error('\nFAIL:\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('LANE F AUDIT: PASS');
```

Green looks like: the per-type ratio table with **no `FAIL` rows**, then
`LANE F AUDIT: PASS` and **exit status 0**.

### 5. The two checks the script cannot make

```bash
git fetch origin && git diff --name-only origin/main
```

Green looks like: **exactly these paths and nothing else** —
`base44/shared/tactical.ts`, `src/lib/tactical/data.js`, `src/lib/units.js`,
`src/lib/armyDesign.js`, `src/lib/imageLibrary.js`, `src/lib/wiki/entries.js`,
`docs/GEAR_LIBRARY.md`, `docs/FACTION_ROSTER.md`, `docs/GAME_RULES.md`
(plus `docs/TACTICAL_SQUAD_PLAN.md` **only** if you changed a §4 contract, which the PR body must
then declare). Any other path is a lane violation — revert it.

```bash
grep -nE '\.\.\.|Math\.|\$\{|\[[A-Za-z_$][A-Za-z0-9_$]*\]\s*:' base44/shared/tactical.ts
```

Green looks like: **no hit inside any of `SQUAD_TYPES`, `SPECIALISTS`, `UPGRADES`,
`UPGRADE_RULES`** — spreads, computed keys, template literals and `Math.*` inside those literals
break `extract-const.js` and therefore the mirror test (hits inside Lane A's derivation *functions*
are fine and expected).

### 6. Then, and only then

Rebase onto `main` (Lane A merges first), re-run steps 1–5, push to `origin/feat/tactical-f`, and
open the PR titled `tactical(f): squad roster, specialists, upgrade kits & points audit` against
`main`, with the PR body carrying the list from the Ownership rule above.

---

## ORCHESTRATOR RULINGS — 2026-09-01 (AUTHORITATIVE, supersedes anything above)

The brief you are reading was written before the contract was audited. Six genuine contradictions were
found **inside `docs/TACTICAL_SQUAD_PLAN.md`** and have been resolved by the orchestrator and written
into the plan. They are settled. **Do not re-litigate them, and do not file an amendment for any of
them** — a lane that files a competing amendment for a decided question will have its PR rejected.

| # | Question | Ruling |
| --- | --- | --- |
| Q1 | `tacticalOrders` declared `action` twice in §4 | The squad action key is **`orderAction`**. The envelope key `action` stays the gameEngine dispatch verb. Already fixed in §4. Lanes C, D and E consume `orderAction`. Lane E does **not** file this amendment any more. `gameEngine` reading `body.orderAction` is a platform-handoff item. |
| Q2 | §5 was circular about where Lane F sits | The executed wave order is now a table in §5: **1)** I, B, G · **2)** A, J · **3)** C, F · **4)** H · *platform handoff* · **5)** D, E. Your wave is fixed. Do not start early; do not assume a lane you depend on is unmerged. |
| Q3 | §3 Lane H `uniqueRoster` was missing `patterns` | §4 governs; §3 is fixed to `{ squads, upgrades, decree, patterns }`. Lane H does not file this. |
| Q3b | Does `Preset` need a `keel` field? | **No.** The required `keel_<key>` plate is keyed off the existing `house` value. Do not add a field. |
| Q4 | §3 Lane G cited `VISION §5` for the ideology axes | Wrong section — the axes are **`VISION §6.1`** (§5 is the macro map). Fixed in §3. Lane G does not file this. |
| Q5 | figures↔companies stated two ways | **`FIGURES_PER_COMPANY` is keyed by REGIMENT, never by squad type.** A squad type's `figures` is its own default squad size and may differ from its source regiment's company size. `riflemen`-derived = 10 and `crawler`/`artillery`/`fighter` = 1 are hard values, asserted in Lane A's tests. Fixed in §4. |
| Q6 | §0 said `hexPixel`/`hexCorners` live in `data.js` | They move to `field.js` with Lane B, and `data.js` **re-exports** them so no consumer's import path ever breaks. Noted in §0. |

**One more standing ruling — the pts anchor:** `SquadType.pts` is the cost of the **squad**, not of a
figure. `SQUAD_TYPES.riflemen.pts === 100` (a 10-figure squad). Every Points Audit is computed against
that. If your brief says `10`, it is wrong; `100` is correct.

**Baseline note:** `main` was RED when this wave started (6 failing tests, 1 lint error, all
pre-existing and unrelated to this plan). It was repaired first — `main` is green at 95 passing tests
before your lane begins. Do not record an absolute test count as your success gate; other lanes add
tests. Your gate is **0 failed** plus your own lane's named tests passing.


---

## WAVE 3 ADDENDUM — 2026-09-01 (orchestrator, AUTHORITATIVE)

Waves 1 and 2 are merged. `main` is green at **934 tests**.

### Your gate is OPEN — Lane A has merged
Your brief tells you to stop and report if Lane A has not merged. **It has.**
`base44/shared/tactical.ts` and `src/lib/tactical/data.js` now hold `SQUAD_TYPES` (the base nine),
`SPECIALISTS` (five), `SQUAD_ACTIONS`, `DEPLOYABLES`, `FIGURES_PER_COMPANY`, `deriveSquad`, `poolCost`
and `toRegiments`. **You APPEND ROWS ONLY.** Lane A owns the derivations and the file structure; the
tables were deliberately left one-row-per-line-block so you can append without restructuring. Do not
re-key, reorder, or reformat an existing row.

### The mirror test now DISCOVERS — you cannot quietly skip a mirror
`test/tactical-mirror.test.js` (Lane A) parses every top-level `export const` out of `tactical.ts` and
demands a mirror for each, classifying by right-hand side. If you add a table to the canonical file and
forget `src/lib/tactical/data.js`, it goes red immediately. That is by design — it is what caught
`CASUALTY_ORDER`, unmirrored since before this plan began.

### `land_dreadnought` — one machine, two rows, and they are diffed at merge
Lane G shipped a `RELIC_PROJECTS` row (the project that *builds* it). You ship the `SQUAD_TYPES` row (the
stand that then *fights*). At merge the orchestrator diffs the two: **same tier `'III'`, and the same pts
basis — squad cost, never per-figure.** The blurb and the desc must describe the same machine. Neither
lane edits the other's file; they meet in the platform's completion handler.

### Standing rulings that bind your numbers
- **`SquadType.pts` is the SQUAD's cost.** `riflemen.pts === 100` at its 10 default figures, and Lane A
  asserts it. Your Points Audit is computed against 100, not 10. If any draft of your brief says 10, it
  is wrong.
- **`FIGURES_PER_COMPANY` is keyed by REGIMENT**, not by squad type. A type's `figures` may differ freely
  from its source regiment's company size — which is exactly why `stormtroops` at 8 or `marksmen` at 5 is
  legal. `toRegiments` converts through the **regiment's** company size.
- **Module effects apply on FIT, never on unlock** (operator ruling). If any upgrade kit you author is
  modelled as an armory module, its numbers live on the fitted stand, not on the faction.

### Compute, do not retype
A Wave 1 lane published a cost curve claiming 110 RP against a table that summed to 138, restated in
three places, checked by nothing. Your Points Audit must be **computed from `SQUAD_TYPES`**, and you must
add a test that recomputes it from the table so it cannot rot. State no figure you have not derived.

### Shared-file state
`docs/GAME_RULES.md` `## 23` (Lane I), `## 24` (Lane G), plus Lanes A and J — read the file, take the next
free number, name it in your PR body, and hard-code it nowhere a renumber would break.
`IMAGE_LIBRARY` and `src/lib/wiki/entries.js` carry banner-commented tail blocks from Lanes I, G and J —
append ONE more at the very end, never between. `IMAGE_CATEGORIES` already has `arms` and `motor`; you
need no new key. `docs/prompts/PLATFORM_HANDOFF.md` is a sanctioned append surface (amendment Q8).
**Do NOT edit `docs/prompts/ART_MANIFEST.md`** — report your plate keys in the PR body.
