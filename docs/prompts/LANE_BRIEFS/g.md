# Lane G — Research, armory & decrees

> This brief plus `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md` and `docs/TACTICAL_SQUAD_PLAN.md` is your
> **complete** instruction set. Nothing else is authoritative. Where this brief and the plan appear to
> disagree, the plan wins — except where this brief explicitly records a reconciliation (§"Contract
> amendments you must make first"), which is itself an instruction to edit the plan.

---

## Goal

At the end of this lane, `base44/shared/catalog.ts` exists as the **canonical** research/armory catalog —
a pure-data Deno module holding `TECHS`, `ARMORY_ITEMS`, `RELIC_PROJECTS` and `CREEDS` — and
`src/lib/doctrine.js` + `src/lib/armory.js` are byte-equal frontend mirrors of it, proved by a new
`test/catalog-mirror.test.js`. The doctrine tree has grown from 3 branches × 3 tiers (9 techs) to
**5 branches × 4 tiers (≥20 techs, one tier-4 capstone per branch)** with the two new branches `signals`
and `reclamation` and cross-branch prerequisites; the State Armory has grown from 7 items to **≥20**,
including **≥6 new fortress modules**, **≥6 new ideology decrees** (each carrying an axis and a
direction from `VISION §6.1`) and **4 Relic Projects**. Every one of the 9 existing tech keys and 7
existing armory keys survives **unchanged** — live saves reference them. `docs/TECH_DESIGN.md` gains a
published cost curve, a fragment-economy table, a `[PROPOSED — awaiting platform wiring]` rules draft
and a codex-entry appendix for Lane H. Nothing you write is wired into the engine by you: the platform
lane imports `catalog.ts` into `gameEngine`/`concurrentPlay` at phase **C3**.

---

## Owned files

Copied from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane G. These are the **only** files you may create or
edit, with the two additions recorded under "Contract amendments" below:

| Path | Status |
| --- | --- |
| `base44/shared/catalog.ts` | **NEW** — canonical `TECHS`, `ARMORY_ITEMS`, `RELIC_PROJECTS`, `CREEDS` |
| `src/lib/doctrine.js` | edit — mirror (`TECHS`, `CREEDS`) + display metadata + helpers |
| `src/lib/armory.js` | edit — mirror (`ARMORY_ITEMS`, `RELIC_PROJECTS`) + display metadata + helpers |
| `docs/TECH_DESIGN.md` | edit — cost curve, fragment economy, `[PROPOSED]` rules draft, codex appendix |
| `src/lib/imageLibrary.js` | **append only**, in the doctrine / decrees / relics / fortress sections |
| `test/catalog-mirror.test.js` | **NEW** — the mirror + structure gate |
| `docs/TACTICAL_SQUAD_PLAN.md` | edit **§3 Lane G "Owns:"** and **§4** only — see "Contract amendments" |
| `test/rules-mirror.test.js` | edit — legacy-scope narrowing **only**, permitted by the §4 amendment |
| `docs/GAME_RULES.md` | **APPEND ONLY** — one new trailing `[PROPOSED — awaiting platform wiring]` section. Required of every content lane by §3's content-lane preamble. |
| `src/lib/wiki/entries.js` | **APPEND ONLY** — one banner-commented block of Codex entries at the END of `ENTRIES`. Required of every content lane by §3's content-lane preamble. |

**You may not edit any other file.** In particular, and this list is exhaustive of the traps in this lane:

- **`base44/functions/gameEngine/entry.ts`** and **`base44/functions/concurrentPlay/entry.ts`** are
  *platform-owned*. Do not touch them. Their inlined `TECHS` / `ARMORY` tables stay exactly as they are
  until the platform lane retires them at C3.
- **`docs/GAME_RULES.md` and `src/lib/wiki/entries.js` — CORRECTED. An earlier draft of this brief told
  you to keep out of both files and hand their content over as appendices in `docs/TECH_DESIGN.md`,
  reasoning that "ownership wins". That reading is wrong and is withdrawn.** §3's content-lane
  preamble is not in tension with the ownership table; it is the ownership table's own rule for these
  two files: *"Every content lane appends its additions to `docs/GAME_RULES.md` as a draft section
  marked `[PROPOSED — awaiting platform wiring]` and adds Codex entries in `src/lib/wiki/entries.js`."*
  Every other content lane (F, H, I, J) appends to both; a lane that hands its rules and its Codex to
  someone else as prose is a lane whose content never lands. **You append to both, append-only, in the
  banner-block shape below.** The `TECH_DESIGN.md` appendices stay — as the *design record*, the place
  the reasoning and the cost curve live — but they are no longer the delivery mechanism.
  - `docs/GAME_RULES.md`: **one** new section appended at the very end,
    `## <N>. Doctrine, Armory & Relic Projects [PROPOSED — awaiting platform wiring]`, where `<N>` is
    one greater than the highest existing `## <number>.` heading **at the time you write** (renumber
    mechanically if another content lane took your number while you were in flight). Never edit,
    reword, renumber or delete an existing section. Contents: the 5 branches and their tier-4
    capstones, the locked cost curve, the cross-branch prereq rule, the decree axis/direction system,
    the creed locks, and the 4 Relic Projects. Numbers only, in that file's register, each equal to
    the row it describes.
  - `src/lib/wiki/entries.js`: your **≥12** Codex entries, appended as **one** banner-commented block
    at the END of the `ENTRIES` array, in that file's exact schema. Lane H owns the file and merges
    after you, so append-only keeps its rebase clean — see the shared-file protocol in Work item 10.
- **`src/components/game/research/DoctrinePanel.jsx`**, **`ArmoryPanel.jsx`**, **`TechCard.jsx`**,
  **`src/lib/factionOverview.js`** — consumers, not yours. Two of them will need a follow-up once your
  data lands (see Work item 12); report them, do not fix them.
- **`docs/prompts/ART_MANIFEST.md`**, **`docs/prompts/PLATFORM_HANDOFF.md`**,
  **`docs/prompts/ORCHESTRATION_LOG.md`** — the orchestrator's. List your plates and handoffs in the
  **PR body** instead.
- **`src/lib/imagePlates.js`** — never. `PLATE_URLS` is the Base44 session's; your plates ship with
  `url: null` (the `P(...)` helper does this for you).
- **No image files, no SVG, no `UnitSprite.jsx`** (drift guard 10 — content lanes never ship visuals).
- **`package.json` / `package-lock.json`** — never (drift guard 3).

---

## Contract amendments you must make first

`docs/TACTICAL_SQUAD_PLAN.md` §4 does not currently define a `RelicProject` shape, and §3 Lane G
requires `RELIC_PROJECTS`. The plan's own protocol is: *"If a lane needs to change a contract, it edits
this file first and flags it in its PR."* Make these **three** edits as your **first commit**, before
writing any catalog data, and list all three in the PR body under a heading `Contract sections touched`.

**Amendment 1 — add to §4, in the "Content contracts (Lanes F/G/H)" block, directly after the
`ArmoryItem` line:**

```ts
RelicProject = { key, label, objectClass: 'engine'|'cache'|'cipher'|'wake', prereq: string|string[]|null, buildDays: number, cost: ArmoryItem['cost'], creedLock?, effects: Tech['effects'], desc }
// Every RelicProject key also has an ARMORY_ITEMS row with the same key and kind 'relic_project'
Creed      = { key: 'recall'|'finished_ledger'|'flight'|'discarding', label, axisLean: -1|0|1, blurb }
// Tech.creedLock and ArmoryItem.creedLock take a Creed key
```

**Amendment 2 — correct the §3 Lane G cross-reference.** Lane G's bullet reads *"each tagged with an
ideology `axis` + `direction`, `VISION §5`"*. `VISION.md §5` is the macro map; the ideology axes are
**`VISION.md §6.1`**. Change `VISION §5` → `VISION §6.1` in that bullet. This is a typo fix, not a
design change — say so in the PR body.

**Amendment 3 — widen Lane G's `Owns:` line in §3** to include `test/rules-mirror.test.js`
*(legacy-scope narrowing only)*. Reason, which must appear in the PR body: `test/rules-mirror.test.js`
currently asserts that `gameEngine.TECHS`, `concurrentPlay.TECHS` and `src/lib/doctrine.js` declare an
**identical** key set, and likewise for `concurrentPlay.ARMORY` ↔ `src/lib/armory.js`. Growing the
mirror before the platform lane imports `catalog.ts` (phase C3) makes those two assertions red by
construction. The file is assigned to no lane in §3, so claim it explicitly rather than editing an
unowned shared file silently. **The narrowing is exactly this and nothing more:**

- Replace the `it("all three sources declare the same tech keys", …)` body with two assertions:
  (a) `Object.keys(CP_TECHS).sort()` equals `Object.keys(GE_TECHS).sort()` — the two backends must still
  agree with each other; (b) every key in `GE_TECHS` is present in `MIRROR_TECHS` (superset, not
  equality), with a comment naming C3 as the point where equality returns.
- Replace the `it("has the same armory keys on both sides", …)` body with: every key in the backend
  `ARMORY` is present in `ARMORY_ITEMS` (superset, not equality), same comment.
- **Do not touch anything else in that file.** Both per-key `for` loops already iterate the *backend*
  key sets and must keep comparing field-by-field — they are the byte-identity guarantee for the legacy
  rows and they must stay green untouched.

---

## Contracts you consume

Verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §4. You **read** these; you do not define them.

```ts
// Produced by: the platform lane (effect application) — you emit rows shaped by it
// Effect `key` vocabulary (the engine applies these; add new keys here before using them):
// `unit.<type>.attack|defense|melee|ranged|armor|speed|morale`, `income.<steel|fuel|manpower>`,
// `armyCap`, `supplyRange`, `capitalDefense`, `initiative`, `losRange`, `digSpeed`,
// `fragmentYield`, `moraleTest`, `buildTurns`.
```

```ts
// Produced by: Lane F (SquadType rows) — you may reference squad keys in `desc`/`effect` prose only,
// never in `effects[].key` unless the key is already in the vocabulary above.
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
```

```ts
// Produced by: the Base44 session (art). You register placeholders only; `url` is always null from a lane.
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)
```

```ts
// Produced by: Lane H — it will reference YOUR keys (`uniqueRoster.decree` is an ArmoryKey).
// You do not edit presets; you make sure your keys are stable so H can point at them.
Preset     = existing PRESET_FACTIONS row + { house: string, uniqueRoster: { squads: SquadTypeKey[], upgrades: UpgradeKey[], decree: ArmoryKey, patterns: WeaponPatternKey[] }, heraldVoice: string }
```

Also consumed, from `test/helpers/extract-const.js` (read it before writing `catalog.ts`):
`readRepoFile(relPath)` and `extractConst(source, name)` — a **textual** lifter. It finds
`const NAME = ` and walks balanced brackets, then `Function("return (…)")`-evaluates the slice.
**It has no access to module scope.** Anything referencing an identifier throws `ReferenceError`.
This is why your tables must be pure data literals (see Drift guards).

---

## Contracts you produce

Verbatim from §4, plus the two rows you add under Amendment 1. Every row you author must match these
exactly — no extra fields, no missing required fields.

```ts
Tech       = { key, branch, tier: 1|2|3|4, label, cost, prereq: string|string[]|null, creedLock?, effect: string, effects: [{ scope: 'macro'|'tactical'|'economy', key: string, value: number }], desc }
ArmoryItem = { key, kind: 'module'|'decree'|'relic_project', label, cost: { steel?, manpower?, fuel?, fragments?: { cache?, engine?, cipher?, wake? } }, tier, axis?: 'authority'|'economy'|'creed'|'mobilization', direction?: -1|1, creedLock?, effects: Tech['effects'], desc }
RelicProject = { key, label, objectClass: 'engine'|'cache'|'cipher'|'wake', prereq: string|string[]|null, buildDays: number, cost: ArmoryItem['cost'], creedLock?, effects: Tech['effects'], desc }
Creed      = { key: 'recall'|'finished_ledger'|'flight'|'discarding', label, axisLean: -1|0|1, blurb }
```

Notes that are part of the contract, not commentary:

1. `TECHS`, `ARMORY_ITEMS`, `RELIC_PROJECTS` and `CREEDS` are **keyed objects**, not arrays. The map key
   and the row's `key` field must be identical strings (the test asserts this).
2. `catalog.ts` contains **data only** — four `export const` object literals, module-level comments, and
   nothing else. **No functions, no imports, no types, no `as const`.** Helpers live in `src/lib`.
3. `DOCTRINE_BRANCHES` and `ARMORY_KINDS` are **display metadata** (`label`, `icon`, `blurb`) and stay
   frontend-only in `src/lib/doctrine.js` / `src/lib/armory.js`. They are **not** in `catalog.ts` and are
   **not** mirror-compared. The test instead asserts every `TECHS[k].branch` is a key of
   `DOCTRINE_BRANCHES` and every `ARMORY_ITEMS[k].kind` is a key of `ARMORY_KINDS`.
4. `techsByBranch(branch)` and `armoryByKind(kind)` keep their **exact current signatures and return
   shapes**: `techsByBranch` returns `[key, tech][]` filtered by `branch` and sorted ascending by `tier`;
   `armoryByKind` returns `[key, item][]` filtered by `kind`. Do not change the parameter list, the
   entry-pair shape, or the sort. (§3 acceptance: *"`techsByBranch`/`armoryByKind` signatures
   unchanged"*.)

---

## Work items

Numbered and checkable. Every minimum is a number and every number below is asserted by
`test/catalog-mirror.test.js` (Work item 11) unless marked *(review-only)*.

### 1. Contract amendments (do this first)
Make Amendments 1, 2 and 3 above as a single first commit. **1** new `RelicProject` shape, **1** new
`Creed` shape, **1** cross-reference fix, **1** `Owns:` line widened.

### 2. `base44/shared/catalog.ts` — the canonical module
Create it with a header comment stating: this is the canonical research/armory catalog; the
`src/lib/doctrine.js` + `src/lib/armory.js` mirrors are enforced by `test/catalog-mirror.test.js`;
`gameEngine` and `concurrentPlay` import it at plan phase C3 and retire their inlined copies until then.
Then the four exports, in this order: `TECHS`, `CREEDS`, `ARMORY_ITEMS`, `RELIC_PROJECTS`.

### 3. `CREEDS` — the Four Departures
Exactly **4** rows, keys **`recall`, `finished_ledger`, `flight`, `discarding`**, sourced from
`docs/LORE.md §2` ("The Empire and the Four Departures"). `axisLean` maps each to the Creed axis of
`VISION §6.1` (Reclaimer −1 … Restorationist +1): `recall` = **+1**, `finished_ledger` = **0**,
`flight` = **0**, `discarding` = **−1**. `blurb` is 12–30 words, Ministry voice, and must not
contradict the LORE §2 table. These four keys are the **only** legal `creedLock` values anywhere in
this lane.

### 4. `TECHS` — the doctrine tree, 9 → ≥20
- **≥20** rows total. Target **22**. Ship no fewer than 20.
- Exactly **5** branches: the 3 existing (`armament`, `industry`, `logistics`) plus **`signals`** and
  **`reclamation`**.
- **The 9 existing keys are byte-identical** in `branch`, `tier`, `label`, `cost`, `prereq`, `effect`
  and `desc`. They are: `standardized_calibers`, `hardened_plate`, `combined_arms`,
  `rationalized_foundries`, `synthetic_fuel`, `total_mobilization`, `field_kitchens`,
  `motorized_supply`, `general_staff_academy`. Copy them from `git show HEAD:src/lib/doctrine.js`, do
  not retype them. They may gain **one** additive field: `effects[]` (Work item 6). Nothing else about
  them changes — no key rename, no cost change, no prose polish.
- Every branch has **≥1** tech at tier 1, **≥1** at tier 2, **≥1** at tier 3, and **exactly 1** at
  tier 4. That gives **5** tier-4 capstones, one per branch.
- `signals` covers recon, intercept and initiative (`losRange`, `initiative`, `moraleTest`).
  `reclamation` covers dig speed, fragment yield and relic handling (`digSpeed`, `fragmentYield`,
  `buildTurns`). Both need **≥4** rows each (tiers 1–4).
- **Cost is fixed per tier and uniform across branches: tier 1 = 3 RP, tier 2 = 4 RP, tier 3 = 6 RP,
  tier 4 = 9 RP.** The 9 legacy costs (3/4/6) already satisfy this; do not invent per-tech costs.
- **Cross-branch prereqs:** each of the **5** capstones has `prereq` as an **array of ≥2 keys**, of
  which **≥1** belongs to a *different* branch than the capstone. Additionally **≥2** non-capstone techs
  carry an array `prereq`. Total techs with an array `prereq`: **≥7**.
- Every `prereq` string (bare or inside an array) must be an existing `TECHS` key, and a tech's
  prereqs must all sit at a **strictly lower tier** than the tech itself. No cycles — the tier rule
  makes cycles impossible; the test enforces the tier rule.
- **`creedLock`: ≥1 tech per Departure — 4 creed-locked techs minimum**, one each for `recall`,
  `finished_ledger`, `flight`, `discarding`. None of the 9 legacy techs may gain a `creedLock`.
- `effect` is the human one-line summary in the existing terse register ("Riflemen attack +1",
  "Supply range +1") — **≤ 90 characters**, no trailing period.
- `desc` is 15–40 words of Ministry-voice in-world prose. No real-world nations, brands or people.
  Consistent with `docs/LORE.md`, `docs/FACTION_ROSTER.md` and `docs/VISION.md` (nomadic keels, the
  Ground, the Four Departures, the precursor hunt).

### 5. `DOCTRINE_BRANCHES` — 3 → 5
Add `signals` and `reclamation` rows in `src/lib/doctrine.js` with the same three fields the existing
rows carry (`label`, `icon`, `blurb`), one emoji icon each, blurb in the existing register. Do not
change the three existing rows. *(The `DoctrinePanel` grid is `sm:grid-cols-3`; five branches wrap onto
a second row and render correctly — that is acceptable and is a UI-lane retune, not yours.)*

### 6. `effects[]` on every row
Every `TECHS`, `ARMORY_ITEMS` and `RELIC_PROJECTS` row — **including all 9 legacy techs and all 7 legacy
armory items** — carries a **non-empty** `effects` array. Each entry is exactly
`{ scope, key, value }`:
- `scope` ∈ `macro` | `tactical` | `economy`.
- `value` is a finite number.
- `key` must be in the §4 vocabulary. The complete legal set, and the test hard-codes it:
  - `unit.<type>.<stat>` where `<type>` ∈ `riflemen`, `crawler`, `gunboat`, `fighter`, `artillery`
    and `<stat>` ∈ `attack`, `defense`, `melee`, `ranged`, `armor`, `speed`, `morale`
  - `income.steel`, `income.fuel`, `income.manpower`
  - `armyCap`, `supplyRange`, `capitalDefense`, `initiative`, `losRange`, `digSpeed`,
    `fragmentYield`, `moraleTest`, `buildTurns`
- If you need a key outside that set, **add it to §4's vocabulary line in the same PR** (drift guard 10)
  and name the addition in the PR body. Prefer reusing an existing key.
- The `effects[]` you add to a legacy row must be a faithful machine encoding of its existing `effect`
  string — e.g. `standardized_calibers` "Riflemen attack +1" →
  `[{ scope: "macro", key: "unit.riflemen.attack", value: 1 }]`. Do not rebalance legacy rows.

### 7. `ARMORY_ITEMS` — 7 → ≥20
- **≥20** rows total. Target **23**.
- **The 7 existing keys are byte-identical** in `label`, `kind`, `cost` and `desc`:
  `citadel_plate`, `juggernaut_reactors`, `munitions_works`, `war_bonds_decree`, `fuel_ration_act`,
  `universal_levy`, `hearth_and_bulwark`. They may gain the additive fields `tier`, `effects` and, for
  the four decrees, `axis` + `direction`. Nothing else changes.
- `kind: 'module'` — **≥9** rows (3 legacy + **≥6 new**). Draw the new ones from
  `docs/GEAR_LIBRARY.md §2`: the **Laboratory** bay (Field Assay Office, Cipher Hall), the **Hangar**
  bay (Muster Decks, Launch Rails, Sortie Gates), the **Habitat** bay (Granary Decks, Assembly Hall,
  Pilgrim Berths) and the **Aura** bay (March Klaxons, Ministry Mast). Keep GEAR_LIBRARY's names.
- `kind: 'decree'` — **≥10** rows (4 legacy + **≥6 new**). **Every decree row, legacy ones included,
  carries `axis` and `direction`**: `axis` ∈ `authority` | `economy` | `creed` | `mobilization`
  (`VISION §6.1`), `direction` ∈ `-1` | `1` with the sign meaning the pole named in that table
  (`authority` −1 = Council Rule, +1 = Iron Autocracy; `economy` −1 = War Communalism, +1 = Charter
  Syndicates; `creed` −1 = Reclaimer, +1 = Restorationist; `mobilization` −1 = Citizen Levy,
  +1 = Professional Corps). **All 4 axes must appear across the decree set, each with ≥1 row at
  −1 and ≥1 row at +1 — 8 axis/direction combinations, all covered.**
- **`creedLock`: ≥1 decree per Departure — 4 creed-locked decrees minimum**, one each for `recall`,
  `finished_ledger`, `flight`, `discarding`. None of the 4 legacy decrees may gain a `creedLock`.
- `kind: 'relic_project'` — **exactly the 4 keys of Work item 8**, one `ARMORY_ITEMS` row each, with the
  same key as the `RELIC_PROJECTS` row.
- `tier` ∈ `'I'` | `'II:Cache'` | `'II:Eng'` | `'II:Ciph'` | `'II:Wake'` | `'III'` (the
  `docs/GEAR_LIBRARY.md` tier gates, same vocabulary as §4's `SquadType.tier`). The 7 legacy rows are
  tier `'I'`. Every `relic_project` row is tier `'III'`.
- **Fragment economy:** every row whose `tier` starts `'II:'` must have `cost.fragments` containing the
  matching class and nothing else — `II:Cache` → `cache`, `II:Eng` → `engine`, `II:Ciph` → `cipher`,
  `II:Wake` → `wake` — with a value **≥1**. Tier `'I'` rows must have **no** `cost.fragments`. Every
  cost value across the whole catalog is a **positive integer**.

### 8. `RELIC_PROJECTS` — the 4 Tier-III projects
Exactly these **4** keys, spelled exactly: **`land_dreadnought`**, **`lance_carriage`**,
**`the_beacon`**, **`the_new_ignition`**. Source: `docs/TECH_DESIGN.md §2 (Tier III)`.

**⚠ `land_dreadnought` is a shared key: Lane F ships a `SQUAD_TYPES` row under the identical string**
(§3 Lane F mandates `land_dreadnought (relic, [III])` as a squad type). They are two rows in two
different tables describing **one** Object — yours is the *project* that builds it, Lane F's is the
*stand* that then fights. This is not a collision: no key-uniqueness rule spans `RELIC_PROJECTS` and
`SQUAD_TYPES`, and neither lane touches the other's file. It **is** a consistency obligation: keep
`tier: 'III'`, keep your `desc` and Lane F's `blurb` describing the same machine, and **name the
cross-reference in your PR body** so the orchestrator can diff the two rows at merge. Lane F's brief
carries the mirror image of this note. Do not edit Lane F's file to reconcile them.
- `objectClass`: `land_dreadnought` = `engine`, `lance_carriage` = `wake`, `the_beacon` = `cipher`,
  `the_new_ignition` = `cache`. (`the_beacon`/`the_new_ignition` are the two creed forks of the Exodus
  Works — TECH_DESIGN §2.)
- `the_beacon` carries `creedLock: "recall"`; `the_new_ignition` carries `creedLock: "discarding"`.
  Both facts are already canon in TECH_DESIGN §2 / §4 ("the Beacon unavailable" to Reclaimers).
- `prereq` is an array of **≥2** `TECHS` keys, of which **≥1** is in the `reclamation` branch.
- `buildDays` is a positive integer **≥ 10** (TECH_DESIGN §2: the project is an on-clock, interruptible
  race, and the whole design point is that everyone can see the days remaining).
- `cost.fragments` names **≥2** classes.
- Each also gets its paired `ARMORY_ITEMS` row (Work item 7), kind `relic_project`, tier `'III'`, with
  the **same key** and the **same `cost`** object.

### 9. `src/lib/doctrine.js` and `src/lib/armory.js` — the mirrors
- `doctrine.js` exports: `DOCTRINE_BRANCHES` (display), `TECHS` (mirror), `CREEDS` (mirror),
  `techsByBranch` (unchanged signature), and **one new helper** `prereqList(tech)` returning
  `[]` for null, `[x]` for a string, and the array itself for an array. Keep the existing file-header
  comment and extend it.
- `armory.js` exports: `ARMORY_ITEMS` (mirror), `RELIC_PROJECTS` (mirror), `ARMORY_KINDS` (display),
  `armoryByKind` (unchanged signature), and **one new helper** `fragmentCost(item)` returning
  `item.cost.fragments || {}`.
- `ARMORY_KINDS` gains a third row `relic_project` (icon, label, blurb) alongside `module` and `decree`.
  Do not change the two existing rows. *(`ArmoryPanel`'s grid is `sm:grid-cols-2`; three kinds wrap —
  acceptable, and a UI-lane retune.)*
- The mirrored tables must be **deep-equal** to `catalog.ts`, field for field, with **no UI-only extra
  fields**. Unlike the tactical mirror (§6 guard 1), this catalog has no allowlist: copy the literals
  across exactly.

### 10. `src/lib/imageLibrary.js` — placeholder plates, append only
Register one plate per new row via the existing `P(key, category, title, desc, prompt, aspect)` helper.
`url` is always `null` (the helper handles it). **Do not add new `IMAGE_CATEGORIES`** — all four you
need exist. Conventions, and the test enforces them:

| Row | Plate key | Category | Aspect |
| --- | --- | --- | --- |
| every `TECHS` row | `tech_<key>` | `doctrine` | `4:3` |
| `ARMORY_ITEMS` kind `module` | `mod_<key>` | `fortress` | `1:1` |
| `ARMORY_ITEMS` kind `decree` | `decree_<key>` | `decrees` | `4:3` |
| `RELIC_PROJECTS` row | `relic_<key>` | `relics` | `4:3` |

**Four legacy plate keys predate this convention and must NOT be renamed or duplicated** (drift
guard 10). Declare this exact alias map in `test/catalog-mirror.test.js` and resolve through it:

```js
const LEGACY_PLATE_ALIASES = {
  war_bonds_decree:  "decree_war_bonds",
  fuel_ration_act:   "decree_fuel_ration",
  hearth_and_bulwark:"decree_hearth_bulwark",
  the_new_ignition:  "relic_new_ignition",
};
```

`universal_levy` → `decree_universal_levy`, all 9 legacy `tech_*` plates and all 3 legacy `mod_*` plates
already match the convention — add nothing for them. `land_dreadnought` → `relic_land_dreadnought` and
`the_beacon` → `relic_the_beacon` already exist too. So the only relic plate you author is
`relic_lance_carriage`.

**Prompt rules:** the prompt must **not** repeat `HOUSE_STYLE` (it is prepended at generation time),
must describe subject and composition only, and must match the register of the neighbouring plates in
that section (research dossier plates read *"Research dossier plate: … blueprint annotations"*; decree
plates read *"Wartime propaganda poster: … stencil lettering, aged paper"*). 20–45 words.

**⚠ THE SHARED-FILE PROTOCOL — five lanes append to this one file (F, G, H, I and J), so the shape of
the append is a contract, not a preference. This supersedes an earlier instruction in this brief to
insert inside the four category sections.**

- **All of your plates go into ONE contiguous block appended at the very END of the `IMAGE_LIBRARY`
  array**, immediately before the closing `];`, opened by a single banner comment:

  ```js
  // ——— LANE G: doctrine, decrees & relic projects ———
  ```

  Four separate in-section inserts across a 1,000-line array is four independent conflict sites
  against every other content lane; one tail block is one, and its resolution is always the same
  mechanical one — **keep both blocks, in lane order**.
- The `category` field is what groups a plate for the UI (`getImage` is a key lookup, `libraryStats`
  groups by `category`); its **position in the array is not**. Appending at the tail with the correct
  `category` renders identically to inserting in the section.
- **Never** reorder, reflow, reformat, edit or delete an existing row.
- **You add no `IMAGE_CATEGORIES` key** — `doctrine`, `decrees`, `relics` and `fortress` all exist.
  If a later change makes one necessary, it goes on its own line **inside the existing
  `IMAGE_CATEGORIES` object, adjacent to the keys already there**, never in your tail block.
- `url` is never passed; `P(...)` fills it from `PLATE_URLS[key] || null`. **Never touch
  `src/lib/imagePlates.js`.**

### 11. `test/catalog-mirror.test.js` — the gate
New file, following the `test/rules-mirror.test.js` pattern: `readRepoFile` + `extractConst` for the
canonical side, direct `@/lib/...` imports for the mirrors, `IMAGE_LIBRARY` imported from
`@/lib/imageLibrary` for the plate checks, and `ENTRIES` from `@/lib/wiki/entries` for the Codex checks.
It must contain **at least these 24 assertions**, each as its own `it(...)` so a failure names the rule
it broke:

1. `TECHS` mirror deep-equals `catalog.ts` `TECHS`.
2. `ARMORY_ITEMS` mirror deep-equals `catalog.ts` `ARMORY_ITEMS`.
3. `RELIC_PROJECTS` mirror deep-equals `catalog.ts` `RELIC_PROJECTS`.
4. `CREEDS` mirror deep-equals `catalog.ts` `CREEDS`; keys are exactly the 4 Departures.
5. Every table's map key equals its row's `key` field, in all four tables.
6. The **9** legacy tech rows match a hard-coded literal in the test file (`branch`, `tier`, `label`,
   `cost`, `prereq`, `effect`, `desc`) — copied from `git show HEAD:src/lib/doctrine.js`.
7. The **7** legacy armory rows match a hard-coded literal (`label`, `kind`, `cost`, `desc`).
8. No legacy tech and no legacy decree carries `creedLock`.
9. `Object.keys(TECHS).length >= 20`.
10. Exactly **5** distinct `branch` values, and they are the 5 named keys; every `branch` is a key of
    `DOCTRINE_BRANCHES`.
11. Every branch has ≥1 tech at each of tiers 1, 2, 3 and **exactly 1** at tier 4.
12. Cost by tier is exactly `{1:3, 2:4, 3:6, 4:9}` for every tech.
13. Every prereq key exists in `TECHS` and sits at a strictly lower tier.
14. **≥7** techs have an array `prereq`; each of the **5** capstones has an array `prereq` of length ≥2
    containing ≥1 key from another branch.
15. `creedLock` values are `CREEDS` keys; **all 4** Departures appear on ≥1 tech and on ≥1 decree.
16. Every tech/armory/relic row has a non-empty `effects` array; every entry has `scope` in the 3-value
    set, a finite numeric `value`, and a `key` in the hard-coded vocabulary set.
17. `Object.keys(ARMORY_ITEMS).length >= 20`; kind counts are module ≥9, decree ≥10, relic_project ≥4.
18. Every `kind` is a key of `ARMORY_KINDS`; every decree has `axis` in the 4-value set and `direction`
    in `{-1, 1}`; **all 8** axis/direction combinations are covered.
19. Every `tier` is in the 6-value set; every `'II:*'` row has exactly the matching fragment class at
    ≥1; every `'I'` row has no `cost.fragments`; every cost value is a positive integer.
20. `RELIC_PROJECTS` contains the 4 required keys; each has a paired `ARMORY_ITEMS` row with kind
    `relic_project`, tier `'III'` and an identical `cost`; `buildDays >= 10`; `objectClass` in the
    4-value set; `prereq` is an array of ≥2 existing tech keys with ≥1 in `reclamation`;
    `cost.fragments` names ≥2 classes; `the_beacon`/`the_new_ignition` carry the required `creedLock`.
21. **Plate coverage:** for every tech, module, decree and relic project, the conventional plate key —
    or its `LEGACY_PLATE_ALIASES` entry — exists in `IMAGE_LIBRARY`, in the right category, and no
    plate prompt contains a substring of `HOUSE_STYLE`.
22. **Signature freeze:** `techsByBranch("armament")` returns entry pairs sorted ascending by tier and
    `armoryByKind("decree")` returns entry pairs — both asserted on shape (`Array.isArray(row) &&
    row.length === 2`), not just content.
23. **Codex integrity (Work item 13):** `ENTRIES` contains **≥12** ids that are new in this lane;
    every `id` in the whole array is unique; every `category` is a `CATEGORIES` id; every `status` is
    a `STATUS` key; every `see` target across the whole array resolves to a real id (zero dangling
    links, corpus-wide) — the append must not break Lane H's clean corpus.
24. **`[PROPOSED]` marker (Work item 14):** `docs/GAME_RULES.md`, read with `readRepoFile`, contains
    a heading carrying the literal string `[PROPOSED — awaiting platform wiring]`, and the file's
    existing `## <number>.` headings are all still present and in order.

### 12. `docs/TECH_DESIGN.md`
Append, without rewriting the existing §0–§7:
- **`## 8. Cost Curve (LOCKED)`** — the required table: RP per tier and expected unlock turn at
  1 RP/round. Publish exactly: tier 1 = 3 RP (cumulative 3, unlocked ~turn **3**); tier 2 = 4 RP
  (cumulative 7, ~turn **7**); tier 3 = 6 RP (cumulative 13, ~turn **13**); tier 4 = 9 RP (cumulative
  22, ~turn **22**). Add a second column for the whole-branch cost (**22 RP**) and the whole-tree cost
  (5 branches × 22 = **110 RP**, i.e. ~110 rounds at 1 RP/round — state plainly that no single game
  completes the tree, which is the intent).
- **`## 9. Fragment Economy`** — the `'II:*'` tier → fragment class mapping, the per-class demand
  implied by your armory rows, and a count of how many rows demand each of the 4 classes.
- **`## 10. Appendix A — [PROPOSED — awaiting platform wiring] GAME_RULES draft`** — the rules text the
  platform lane will lift into `docs/GAME_RULES.md §19/§20`: the 5 branches, the tier-4 capstones, the
  cross-branch prereq rule, the decree axis/direction system, the creed locks, and the Relic Projects.
  Numbers only, in the register of `GAME_RULES.md`.
- **`## 11. Appendix B — Codex entries for Lane H`** — **≥12** draft entries (title, 60–120 words,
  suggested cross-links) covering: the **2** new branches, the **4** relic projects, and **≥6** of the
  new decrees. Head the section with a line saying Lane H owns `src/lib/wiki/entries.js` and lifts these.
- **`## 12. Consumer follow-ups (for the UI / platform lane)`** *(review-only)* — record the two call
  sites your data breaks, with file and line, so the owning lane fixes them:
  `src/components/game/research/TechCard.jsx:8` computes
  `const locked = tech.prereq && !(research.completed||[]).includes(tech.prereq)` — with an **array**
  `prereq` this is always truthy-and-not-included, so array-prereq techs render permanently locked;
  the fix is `prereqList(tech).every(p => completed.includes(p))`. And
  `src/components/game/research/ArmoryPanel.jsx:9` computes `affords` over `RESOURCE_KEYS` only, so
  `cost.fragments` is invisible and a Tier-II item reads as affordable; the fix consumes
  `fragmentCost(item)`. **Do not fix either yourself** — they are not your files.

### 13. `src/lib/wiki/entries.js` — ≥12 Codex entries (append-only)

13.1 Ship the entries drafted in `TECH_DESIGN.md` Appendix B **into the file**, as real rows: **≥12**
covering the **2** new branches, the **4** relic projects and **≥6** of the new decrees.

13.2 **The same shared-file protocol as the image library.** One contiguous block appended at the very
END of the `ENTRIES` array, before the closing `];`, opened by a single banner comment:

```js
// ——— LANE G: doctrine, decrees & relic projects ———
```

Never edit an existing entry; never insert into the middle of the array; never touch `CATEGORIES`,
`STATUS`, `entryText` or `citedBy`. Lane H owns this file and merges after you — append-only is what
keeps its rebase mechanical.

13.3 Entry shape, per the schema comment at the top of that file:
`{ id, title, folk?, category, tag, status, summary, blocks: [...], see: [...] }`. `id` is a
kebab-case slug, unique across the whole array (`branch-signals`, `relic-the-beacon`, …).
`category` ∈ the shipped `CATEGORIES` ids; `status` ∈ `Object.keys(STATUS)` — use `"canon"` only where
`docs/TECH_DESIGN.md` or `docs/LORE.md` already supports the claim and **`"thin"`** wherever this lane
is extending into ground the lore bible does not cover. Never invent canon.

13.4 Every `see` target must resolve to a real entry id (yours or an existing one) — the corpus is
100% link-clean today and must stay that way. `test/catalog-mirror.test.js` asserts it (Work item 11,
assertion 23: every `see` id in the whole `ENTRIES` array resolves, and every id is unique).

13.5 Keep Appendix B in `TECH_DESIGN.md` as the design record, and say in the PR body that the entries
are now **shipped**, not handed over.

### 14. `docs/GAME_RULES.md` — one `[PROPOSED]` section (append-only)

Append exactly one section at the very end of the file, per the corrected owned-files note above:
`## <N>. Doctrine, Armory & Relic Projects [PROPOSED — awaiting platform wiring]`, `<N>` one greater
than the highest existing `## <number>.` heading at the time you write; renumber mechanically if
another content lane has taken your number by the time you rebase. Lift the text from
`TECH_DESIGN.md` Appendix A. Open it with a one-line note: *"Every number in this section is read from
`base44/shared/catalog.ts`; nothing here is live until the platform lane wires it."* **Do not
renumber, reword or delete any existing section.**

### 15. PR body
Title `tactical(g): research, armory & decrees`. Body must list: the **3** §4/§3 contract sections
touched (Amendments 1–3) and why; the test names added; every plate key registered (key, category,
aspect, one-line subject) so the orchestrator can copy them into `ART_MANIFEST.md`; the Codex entry
ids shipped and the `GAME_RULES.md` section number used (both flagged for Lane H and the platform
lane respectively); the `land_dreadnought` cross-reference to Lane F (see Work item 8); and the two
consumer follow-ups from Work item 12.

---

## Acceptance criteria

**Copied verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §3, Lane G:**

> Acceptance: existing keys unchanged; catalog mirror test green; every tech has a `tech_<key>` plate
> and every decree a `decree_<key>` plate; `techsByBranch`/`armoryByKind` signatures unchanged.

**Plus these lane-specific checks, each satisfied by a named assertion in `test/catalog-mirror.test.js`
(numbers refer to Work item 11):**

| # | Check | Assertion |
| --- | --- | --- |
| 1 | `catalog.ts` ↔ `doctrine.js` ↔ `armory.js` deep-equal, all 4 tables | 1–5 |
| 2 | 9 legacy tech keys byte-identical in `branch/tier/label/cost/prereq/effect/desc` | 6 |
| 3 | 7 legacy armory keys byte-identical in `label/kind/cost/desc` | 7, 8 |
| 4 | ≥20 techs, 5 branches, one tier-4 capstone per branch | 9, 10, 11 |
| 5 | Cost curve locked at 3/4/6/9 RP by tier | 12 |
| 6 | Prereqs valid, tier-monotone, ≥7 array prereqs, capstones cross-branch | 13, 14 |
| 7 | ≥1 tech and ≥1 decree per Departure via `creedLock` | 15 |
| 8 | Every row has `effects[]` in the §4 vocabulary | 16 |
| 9 | ≥20 armory items: ≥9 modules, ≥10 decrees, ≥4 relic projects | 17 |
| 10 | Every decree has axis + direction; all 8 combinations covered | 18 |
| 11 | Tier gates and fragment costs consistent; all costs positive integers | 19 |
| 12 | The 4 named Relic Projects, paired armory rows, ≥10 build days | 20 |
| 13 | A plate for every tech / module / decree / relic; no house style in prompts | 21 |
| 14 | `techsByBranch` / `armoryByKind` return shapes unchanged | 22 |
| 15 | `test/rules-mirror.test.js` still green, narrowed only as specified | `npm run rules:check` |
| 16 | Cost curve table published in `docs/TECH_DESIGN.md` | *(review)* §8 exists with the 4 tiers |
| 17 | `[PROPOSED — awaiting platform wiring]` draft + ≥12 codex entries **drafted** in `TECH_DESIGN.md` | *(review)* §10, §11 exist |
| 18 | The ≥12 codex entries are **shipped into `src/lib/wiki/entries.js`** as one tail block; corpus stays link-clean | 23 |
| 19 | The `[PROPOSED — awaiting platform wiring]` section is **appended to `docs/GAME_RULES.md`**; no existing section renumbered | 24 |

---

## Drift guards

**The §6 list, mandatory in this lane's PR — all thirteen, with the ones that bite Lane G marked ⚑:**

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`. ⚑ *Your equivalent:* every table exported from
   `base44/shared/catalog.ts` has a deep-equal mirror in `src/lib/doctrine.js` / `src/lib/armory.js`,
   enforced by `test/catalog-mirror.test.js`. Your catalog has **no UI-only field allowlist**.
2. **Exported API freeze** — `tacticalEngine.ts` keeps its exported names. ⚑ *Your equivalent:*
   `techsByBranch` and `armoryByKind` keep their signatures and return shapes exactly.
3. ⚑ **No new dependencies. `package.json` is not touched by any worktree lane.**
4. **Design tokens only** — no hex colors, Tailwind classes must be literal strings. *(You write no
   JSX; the guard still applies to any string you author.)*
5. ⚑ **Ministry voice in every user-visible string**; PII never rendered. Every `label`, `effect`,
   `desc` and `blurb` you write is user-visible.
6. **Components ≤ ~60 lines**, one per file, `@/` imports only. ⚑ You author no components; the `@/`
   rule binds every import you write inside `src/` (`@/lib/imagePlates`, not `./imagePlates`).
7. ⚑ **Numbers live in one place** — any balance constant referenced in UI copy is read from the data
   file, never retyped. Do not bake an RP cost or a fragment count into an `effect` or `desc` string
   that would then have to be edited twice; where a number must appear in prose, it must equal the
   row's own field.
8. ⚑ **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`.
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` and flags
   `docs/GAME_RULES.md` for the platform lane. ⚑ *Your rules doc is `docs/TECH_DESIGN.md`*
   (COMBAT_DESIGN is Lane A's, GAME_RULES is the platform's) — every number you add lands there too,
   and the `[PROPOSED]` appendix is the flag to the platform lane.
10. ⚑ **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no
    `UnitSprite.jsx` edits. Art is requested only as `imageLibrary.js` placeholders with `url: null`.
    **Existing catalog keys are never renamed or removed (live saves reference them).** Every new
    mechanical effect uses the §4 effect-key vocabulary or extends it in the same PR.
11. **Arms granularity stays numeric and server-rolled** (Lane I) — every quirk carries a
    machine-evaluable `condition`; `rollWeapon` is pure and seeded, with **no `Math.random`**. ⚑ *Your
    echo of it:* no effect exists only in prose — every `effect` line has a machine-readable
    `effects[]` counterpart — and **`Math.random` appears nowhere in this lane either**. `catalog.ts`
    is data only (no functions at all, per "Contracts you produce" note 2), and the two helpers you add
    to `doctrine.js` / `armory.js` are pure lookups; anything random or time-dependent in a catalog is
    a lane failure.
12. **One damage model** — armour math exists only in `arms.ts`. ⚑ Never author armour, penetration or
    damage arithmetic in `catalog.ts`. A tech that "hardens plate" emits
    `unit.<type>.armor` / `unit.<type>.defense`, never a penetration table.
13. **Mechanized granularity mirrors arms** (Lane J). Not yours; do not duplicate chassis data.

**Environment rules — non-negotiable, and two of them will destroy this checkout if broken:**

- ⛔ **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store (`~/.node-modules-store/rust-legions/node_modules`)
  and npm **silently deletes the symlink** and reifies a real directory in its place. Dependencies are
  already installed. Nothing you need requires an install.
- ⛔ **NEVER edit `package.json` or `package-lock.json`** (drift guard 3).
- ⛔ **Do not run `git commit`, `git push`, `git checkout`, `git branch` or `git merge` outside your own
  lane worktree.** Inside your worktree you commit and push normally; you never touch `main` and you
  never merge. The orchestrator owns integration.
- Work in **your own worktree**: `scripts/agent-worktree.sh tactical-g` → branch `feat/tactical-g`,
  pushed to `origin/feat/tactical-g`, PR opened against `main`. **Never edit another lane's files.**
  If a contract must change, **edit `docs/TACTICAL_SQUAD_PLAN.md` §4 first and say so in the PR body**
  — which is exactly what Amendments 1–3 above are.
- ⚑ **Every table exported from a `base44/shared/*.ts` file MUST be a PURE DATA LITERAL** —
  `export const NAME = { … }` or `[ … ]`, with **no spreads, no computed keys, no function calls, no
  template literals in keys, no chained transforms, no `as const`, no imports**. The mirror test lifts
  it **textually** with `test/helpers/extract-const.js` and evaluates the slice with
  `Function("return (…)")`, which has **no access to module scope**: a computed table cannot be
  mirror-tested and a referenced identifier throws `ReferenceError`. Values may be numbers, strings,
  booleans, `null`, and nested plain objects/arrays — nothing else.
- Read `test/helpers/extract-const.js` before writing `catalog.ts`. Do not modify it.
- `@/` imports only inside `src/`. No hex colours. No non-literal Tailwind class strings.
- Existing catalog keys are **never** renamed or removed — live saves reference them.

---

## Definition of done

Run these, in this order, from the worktree root, and paste the results into the PR body:

```bash
# 1. the full suite — includes your new catalog-mirror test and the narrowed rules-mirror test
npm test

# 2. lint
npm run lint

# 3. the rules-invariant reminder hook (must exit 0 and print nothing on empty stdin)
bash .claude/hooks/rules-guard.sh < /dev/null

# 4. the focused three-place rules check the hook nags about
npm run rules:check

# 5. prove the pure-data-literal rule holds — all four tables must lift and evaluate
node --input-type=module -e '
import { readRepoFile, extractConst } from "./test/helpers/extract-const.js";
const src = readRepoFile("base44/shared/catalog.ts");
for (const t of ["TECHS","CREEDS","ARMORY_ITEMS","RELIC_PROJECTS"]) {
  const v = extractConst(src, t);
  console.log(t, Object.keys(v).length);
}'

# 6. prove no legacy key was renamed or dropped (must print nothing)
git diff HEAD -- src/lib/doctrine.js src/lib/armory.js | grep -E "^-.*\b(standardized_calibers|hardened_plate|combined_arms|rationalized_foundries|synthetic_fuel|total_mobilization|field_kitchens|motorized_supply|general_staff_academy|citadel_plate|juggernaut_reactors|munitions_works|war_bonds_decree|fuel_ration_act|universal_levy|hearth_and_bulwark)\b:" || echo "OK — no legacy key removed"
```

**Green looks like:**

1. `npm test` — vitest reports **0 failed**, every test file passed, and the summary includes
   `test/catalog-mirror.test.js` with **≥22** passing assertions and `test/rules-mirror.test.js` still
   passing.
2. `npm run lint` — exits 0, prints nothing (`eslint . --quiet`).
3. `bash .claude/hooks/rules-guard.sh < /dev/null` — exits 0, prints nothing.
4. `npm run rules:check` — both `rules-mirror` and `combat-math` pass.
5. Step 5 prints four lines: `TECHS <n≥20>`, `CREEDS 4`, `ARMORY_ITEMS <n≥20>`, `RELIC_PROJECTS <n≥4>`.
   Any `ReferenceError`, `unterminated literal` or `unsupported chained method` means you broke the
   pure-data-literal rule — fix `catalog.ts`, not the helper.
6. Step 6 prints `OK — no legacy key removed`.

Then push `feat/tactical-g` to `origin` and open the PR against `main` with the body from Work item 15.
Leave `main` alone; the orchestrator merges in the §5 order. The content track it is running is
**`I → J → F → H`**, with G alongside them and **F, I and J all merged before Lane D starts**; the
platform lane closes it at C3. Lane G has no hard code dependency on any other content lane — your
only cross-lane obligations are the two shared-file appends (`imageLibrary.js`, `wiki/entries.js`,
both tail blocks), the `docs/GAME_RULES.md` section number, and the `land_dreadnought` cross-reference
to Lane F — so **rebase on `origin/main` before every run of the Definition of done** and resolve any
tail-block conflict by keeping both blocks.

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

