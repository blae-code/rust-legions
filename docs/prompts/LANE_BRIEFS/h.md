# Lane H — Factions, houses & lore

> **This brief is your complete instruction set.** Besides it, read exactly four documents, in this
> order: `CLAUDE.md` → `AGENTS.md` → `docs/VISION.md` → `docs/TACTICAL_SQUAD_PLAN.md` (the contract:
> §3 lanes/ownership, §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol). Then your own
> owned files and `test/helpers/extract-const.js`. Nothing else is required context, and nothing else
> may be edited.
>
> **Lane H is a CONTENT lane and runs LAST**, after Lanes F, G, I and J have merged into `main`
> (`TACTICAL_SQUAD_PLAN.md` §5: content track is `F/G/I → J → H → platform`). You reference their
> keys; they do not reference yours.

---

## Goal

At the end of this lane the game ships **thirteen playable preset factions** — one per Great House in
`docs/FACTION_ROSTER.md` §1 plus the three that already exist — each a legally-costed point-buy
ledger with its own lore, insignia, NPC dispositions, lifepath record, unique roster of Lane F/G/I
content, and a named herald voice. `docs/HERALD_VOICES.md` grows from three voice packs to thirteen,
each with a register, catchphrase vocabulary and nine sample intercepts. The point-buy catalog gains
eight nomad-keel perks, the faction wizard gains a sixth chapter (`VI — The Standard`), the ten named
minor polities of `FACTION_ROSTER.md` §2 stop being generic hashed dossiers and get bespoke lore plus
a crisis and charter hook, and the Ministry Archive grows by at least forty cross-linked codex
entries. Every new mechanical effect is a number in a table; every new thing that needs art is a
placeholder plate with `url: null`. **No visuals, no engine wiring, no components.**

---

## Owned files

Copied from `TACTICAL_SQUAD_PLAN.md` §3, Lane H:

> Owns: `src/lib/presetFactions.js`, `src/lib/lifepath.js` (additions only), `src/lib/pointBuy.js`
> (new perks only), `src/lib/wiki/entries.js`, `docs/LORE.md`, `docs/FACTION_ROSTER.md`,
> `docs/HERALD_VOICES.md`, `base44/shared/settlementLore.ts` additions, `imageLibrary.js` §
> factions/houses/settlements/ideology placeholders, `test/presets.test.js`.

As absolute paths, relative to the repository root:

| Path | Permitted change |
| --- | --- |
| `src/lib/presetFactions.js` | 10 new preset rows appended; 3 existing rows gain **only** additive fields; `presetToFactionRecord` extended to strip the new presentation-only fields |
| `src/lib/lifepath.js` | **Additions only** — append one chapter to `LIFEPATH_CHAPTERS`. Do not touch the four existing chapters, `DOCTRINES`, `PHILOSOPHIES`, `VALUES`, or `availableOptions` |
| `src/lib/pointBuy.js` | **New perk rows only** — append 8 rows to `PERKS`. Do not touch existing rows, `PERK_BY_ID`, `MAX_LIABILITIES`, `netPoints`, `pickError` |
| `src/lib/wiki/entries.js` | ≥40 new entries appended to `ENTRIES` as **one banner-commented tail block** (see the shared-file protocol below). Do not edit existing entries except to add `see` back-links; do not touch `CATEGORIES`, `STATUS`, `entryText`, `citedBy` |
| `src/lib/imageLibrary.js` | New `P(...)` placeholder rows as **one banner-commented tail block** (see the shared-file protocol below). `url` is never set (it comes from `PLATE_URLS`) |
| `base44/shared/settlementLore.ts` | **Additions only** — one new exported table plus the minimal lookup that makes `settlementDossier` use it. Existing exports keep their names, shapes and values |
| `docs/LORE.md` | §6 gains the ten named polities; §7 unchanged in meaning |
| `docs/FACTION_ROSTER.md` | Corrections + the reconciliation notes this brief calls for |
| `docs/HERALD_VOICES.md` | Rewritten into 13 packs; the 3 existing packs keep their sample lines |
| `test/presets.test.js` | **New file.** The single home for every check in this lane |
| `docs/GAME_RULES.md` | **Append-only**, one new trailing `[PROPOSED — awaiting platform wiring]` section (the §3 content-lane rule explicitly grants content lanes this one append; the file is otherwise platform-owned) |
| `docs/TACTICAL_SQUAD_PLAN.md` | §3 and §4 only, and only for the two contract amendments named below, made **before** the code that depends on them |

**You may not edit any other file.** In particular: no component, no page, no
`base44/functions/**`, no `src/lib/tactical/**`, no `src/lib/doctrine.js`, no `src/lib/armory.js`, no
`src/lib/arms.js`, no `src/lib/motorPool.js`, no `src/lib/imagePlates.js`, no `package.json`, no
`package-lock.json`, no other test file.

### The shared-file protocol — `src/lib/imageLibrary.js` and `src/lib/wiki/entries.js`

Five lanes append to each of these two files (F, G, H, I and J). **You own `wiki/entries.js` and you
merge last, so by the time you arrive it already carries four other lanes' tail blocks. Follow the
same protocol anyway** — the file is edited again after this wave, and a consistent tail is what makes
the next append mechanical.

- **One contiguous block per file, appended at the very END of the array** (before the closing `];`),
  opened by a single banner comment and nothing else on that line:

  ```js
  // ——— LANE H: houses, polities & perks ———
  ```

  Place it **after** the Lane F / G / I / J blocks, in merge order. If you hit a conflict with another
  lane's tail block, the resolution is always the same mechanical one: **keep both, in lane order.**
- **Never** insert into the middle of either array, never reorder, reflow, reformat or delete an
  existing row, and never renumber anything. The `category` field groups a plate for the UI; its
  position in the array does not. The one edit to an existing row this lane is permitted is adding a
  `see` back-link to an existing Codex entry (Work item 7's "cross-link both ways") — that is a
  targeted one-line change to a named entry, not a rewrite.
- **New `IMAGE_CATEGORIES` keys, if any, go on their own line inside the existing
  `IMAGE_CATEGORIES` object, adjacent to the keys already there** — never in your tail block. **Lane H
  needs none**: `houses`, `settlements`, `ideology`, `lifepath` and `perks` all exist. (Lane I adds
  `arms` and Lane J adds `motor` this way; expect to see them.)
- `url` is never passed — `P(...)` fills it from `PLATE_URLS[key] || null`.

### Visuals — the content-lane prohibition, in full (drift guard 10)

**No image files. No SVG art. No `PLATE_URLS` entries and no edit to `src/lib/imagePlates.js`. No
`UnitSprite.jsx` edit, and no `src/index.css` edit.** Art is requested **only** as `imageLibrary.js`
placeholder plates with `url: null`, whose `prompt` carries **no `HOUSE_STYLE`** (it is prepended at
generation, so restating it produces a doubled prompt) and no colour-grading or artist direction.
This lane authors data and prose; the Base44 session makes the pictures.

### The two contract amendments you must make first

`TACTICAL_SQUAD_PLAN.md` says: *"If a lane needs to change a contract, it edits **this file first** and
flags it in its PR."* Two changes are unavoidable. Make both **before** writing the code that needs
them, and list both in the PR body.

1. **`base44/shared/perkMods.ts` must join Lane H's `Owns:` line in §3.**
   `test/rules-mirror.test.js` asserts `Object.keys(PERK_MODS).sort()` equals
   `PERKS.map(p => p.id).sort()`. Adding 8 perks to `src/lib/pointBuy.js` without adding the same 8
   keys to `base44/shared/perkMods.ts` turns `npm test` **red**. No other lane owns `perkMods.ts`, so
   there is no collision — but the ownership line must say so before you touch the file. Add exactly:
   `base44/shared/perkMods.ts` (new `PERK_MODS` rows only).
2. **§4's `Preset` shape gains `keel`.** §4 currently reads
   `Preset = existing PRESET_FACTIONS row + { house: string, uniqueRoster: {...}, heraldVoice: string }`.
   The §3 acceptance criterion requires a `keel_<key>` plate per house, and nothing in the row names
   the keel. Amend §4 to
   `Preset = existing PRESET_FACTIONS row + { house: string, keel: string, uniqueRoster: { squads, upgrades, decree, patterns }, heraldVoice: string }`.
   While you are there, fix the §3 Lane H bullet, which says `uniqueRoster: { squads, upgrades, decree }`
   — one field short of §4. **§4 governs**; §3's prose is the error.

---

## Contracts you consume

Verbatim from `TACTICAL_SQUAD_PLAN.md` §4. You **read** these keys; you never author or edit the
tables they live in.

```ts
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
```
*Produced by **Lane F** — read from `src/lib/tactical/data.js` (`SQUAD_TYPES`, `UPGRADES`).*

```ts
ArmoryItem = { key, kind: 'module'|'decree'|'relic_project', label, cost: { steel?, manpower?, fuel?, fragments?: { cache?, engine?, cipher?, wake? } }, tier, axis?: 'authority'|'economy'|'creed'|'mobilization', direction?: -1|1, creedLock?, effects: Tech['effects'], desc }
Tech       = { key, branch, tier: 1|2|3|4, label, cost, prereq: string|string[]|null, creedLock?, effect: string, effects: [{ scope: 'macro'|'tactical'|'economy', key: string, value: number }], desc }
```
*Produced by **Lane G** — read from `src/lib/armory.js` (`ARMORY_ITEMS`) and `src/lib/doctrine.js` (`TECHS`).*

```ts
WeaponPattern  = { key, label, maker: ManufacturerKey, calibre: CalibreKey, class: WeaponClass, tier, base: WeaponBase, slots: ModSlot[], quirks: QuirkKey[], pts, appliesTo: SquadTypeKey[], blurb }
Manufacturer   = { key, label, houseKey?: string, culture?: string, signature: Partial<WeaponBase>, nameStems: string[], access: { [houseKey]: 'native'|'licensed'|'captured' }, lore }
```
*Produced by **Lane I** — read from `src/lib/arms.js` (`WEAPON_PATTERNS`, `MANUFACTURERS`).
`Manufacturer.houseKey` and `Manufacturer.access` are keyed by **your** `house` stems — Lane I wrote
them against `FACTION_ROSTER.md`, so reconcile any mismatch in your PR body rather than renaming
their keys.*

```ts
ChassisPattern  = { key, label, maker: ManufacturerKey, class: VehicleClass, tier, hull: { tonnage, crew, hardpoints: Hardpoint[], baseArmour: Facings }, slots: VehicleSlot[], quirks: QuirkKey[], pts, blurb }
```
*Produced by **Lane J** — read from `src/lib/motorPool.js` (`CHASSIS_PATTERNS`) if you cite a chassis
in lore or codex. Optional.*

```ts
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)  // url always null from a lane
```
*The placeholder-plate constructor already in `src/lib/imageLibrary.js`.*

Also consumed, from the shipped codebase (not §4):

- `src/lib/pointBuy.js` — `PERK_BY_ID`, `MAX_LIABILITIES = 3`, `netPoints(picks)`, `pickError(picks)`.
- `base44/shared/perkMods.ts` — `PERK_MODS` and `compileMods(picks)`. **`compileMods` reduces only
  these keys:** `unitStat`, `unitCost`, `income`, `armyCap`, `startBonus`, `capitalDefense`,
  `disposition`. Anything else in a `PERK_MODS` row (including `supplyRange`, which only `mergeMods`
  handles) is **silently inert** — never use it.
- `src/lib/units.js` — `UNIT_TYPES`; the only legal unit keys are
  `riflemen`, `crawler`, `gunboat`, `fighter`, `artillery`.
- `base44/functions/synthesizeFaction/entry.ts` — the **trait effect schema** every `traits[].effect`
  is validated and clamped against:
  `{ type: 'income_flat'|'unit_discount'|'attack_bonus'|'defense_bonus', unit?: 'riflemen'|'crawler'|'gunboat'|'fighter', value: 1|2 }`.
  `income_flat` takes no `unit`; the other three require one. Values outside 1–2 are clamped, so
  writing one is a silent bug.
- `base44/entities/Faction.jsonc` — the entity a preset is created as. Its properties are
  `factionName, lore, doctrine, traits, insigniaDescription, isNPC, npcDispositions, lifepathChoices,
  pointBuy, isPublished`. **There is no `house`, `keel`, `uniqueRoster` or `heraldVoice` column** —
  the entity change is platform-owned, so `presetToFactionRecord` must strip them (see Work item 4).

---

## Contracts you produce

### 1. `Preset` — the row shape of `PRESET_FACTIONS` (§4, as amended by this lane)

```ts
Preset = existing PRESET_FACTIONS row + { house: string, keel: string, uniqueRoster: { squads: SquadTypeKey[], upgrades: UpgradeKey[], decree: ArmoryKey, patterns: WeaponPatternKey[] }, heraldVoice: string }
```

The "existing `PRESET_FACTIONS` row" is, verbatim from the shipped file, exactly these fields in this
order:

```js
{
  id: string,                       // stable slug — NEVER renamed (live saves + codex links)
  factionName: string,              // "The …" — Ministry register
  doctrine: 'aggressive'|'economic'|'defensive',
  insigniaDescription: string,      // one sentence, heraldic, no colour beyond the rationed palette
  lore: string,                     // 120–180 words
  traits: [{ name, description, effect: { type, unit?, value } }],   // exactly 3
  pointBuy: { picks: string[] },    // perk ids, a legal ledger
  npcDispositions: { aggressive: number, economic: number, defensive: number },
  lifepathChoices: { preset: true, doctrine, philosophy, value, standard, seeds },
  isNPC: false,
}
```

with the additive fields:

```js
  house: string,        // the plate stem — house_<house>_crest must exist in IMAGE_LIBRARY
  keel: string,         // the keel plate slug — keel_<keel> must exist in IMAGE_LIBRARY
  uniqueRoster: { squads: [], upgrades: [], decree: '', patterns: [] },
  heraldVoice: string,  // the HERALD_VOICES.md pack key — equals `house`
```

and `lifepathChoices` extended to:

```js
  lifepathChoices: {
    preset: true,
    doctrine: 'aggressive'|'economic'|'defensive',
    philosophy: string,          // existing 3 rows keep their legacy values verbatim
    value: string,               // existing 3 rows keep their legacy values verbatim
    standard: 'std_column'|'std_reliquary'|'std_black'|'std_first_keel',
    seeds: { authority: number, economy: number, creed: number, mobilization: number },  // each −3…3
  }
```

### 2. `NAMED_POLITIES` — the new table in `base44/shared/settlementLore.ts`

A **pure data literal**, keyed by polity slug, each row matching the existing row grammar of
`LORE_ERAS` / `LORE_HOOKS` / `LORE_SPOILS` exactly:

```ts
export const NAMED_POLITIES = {
  hundredweight_bottoms: {
    name: 'Hundredweight Bottoms',   // must equal the node name exactly
    kind: 'city' | 'town' | 'depot' | 'ruin',   // a key of LORE_HOOKS, nothing else
    culture: string,                 // the FACTION_ROSTER §2 culture, lowercase
    era: string,                     // one of LORE_ERAS, byte-identical
    hook: string,                    // LORE_HOOKS grammar: lowercase verb phrase that completes `${name} ${hook}.`
    crisis: string,                  // one bespoke occupation-crisis line, one sentence
    charter: string,                 // one bespoke charter term, one sentence, states its own number
    spoils: { steel|manpower|fuel: number },     // LORE_SPOILS grammar: exactly one key, integer 2–5
    plate: string,                   // the existing set_* plate key
  },
  // …nine more
};
```

`settlementDossier(node)` keeps its **exact** return shape `{ title, era, text, spoils }`. Add only a
name lookup at its head: when `node.name` matches a `NAMED_POLITIES[*].name`, return
`{ title: node.name, era: row.era, text: `${node.name} ${row.hook}.`, spoils: row.spoils }`; otherwise
fall through to the existing hashed path, byte-for-byte unchanged. `charterOptions(dossier)` keeps its
signature and its three option ids (`requisition`, `levy`, `autonomy`).

### 3. `docs/HERALD_VOICES.md` — thirteen packs, one fixed structure

Per faction, a `## ` section whose heading ends with the pack key in backticks, then, in order:

```
## <Faction Name> — "<the pack's own noun>" `<packKey>`

**Voice.** <register: 2–4 sentences>

**Always:** <5–8 catchphrase words/phrases, italicised, comma-separated>
**Never:** <3–5 forbidden moves>

### Ascendant
> <sample 1>
> <sample 2>
> <sample 3>

### Pressed
> <sample 1>
> <sample 2>
> <sample 3>

### Dealing
> <sample 1>
> <sample 2>
> <sample 3>
```

Moods are exactly three and exactly these names: **Ascendant** (the house is winning ground),
**Pressed** (it is losing ground), **Dealing** (trade, truce, envoy or salvage business). Nine samples
per faction, 117 in total. `packKey` equals the preset's `house` / `heraldVoice`. The shared rules
block and the Garble Template at the end of the file stay; the three existing packs keep their
existing sample lines (redistribute them across the three moods rather than deleting them).

---

## Work items

Numbered and checkable. Every minimum is a number.

**0. Verify you are running in order.** Before anything else, confirm all four upstream lanes have
merged into your base branch:

```
node -e "import('./src/lib/tactical/data.js').then(m=>console.log('SQUAD_TYPES',Object.keys(m.SQUAD_TYPES).length,'UPGRADES',Object.keys(m.UPGRADES).length))"
node -e "import('./src/lib/armory.js').then(m=>console.log('ARMORY_ITEMS',Object.keys(m.ARMORY_ITEMS).length))"
node -e "import('./src/lib/arms.js').then(m=>console.log('WEAPON_PATTERNS',Object.keys(m.WEAPON_PATTERNS).length))"
node -e "import('./src/lib/motorPool.js').then(m=>console.log('CHASSIS_PATTERNS',Object.keys(m.CHASSIS_PATTERNS).length))"
```

Expected, per §3: `SQUAD_TYPES ≥ 16`, `UPGRADES ≥ 10`, `ARMORY_ITEMS ≥ 20`, `WEAPON_PATTERNS ≥ 40`,
`CHASSIS_PATTERNS ≥ 18`. If any module is missing or short, **STOP and report to the orchestrator.**
Do not stub, do not invent keys, do not proceed — Lane H exists to reference real keys.

**1. Amend the contract (2 edits, before any code).** Do the two amendments in "The two contract
amendments you must make first". Record both in the PR body under a `Contract sections touched`
heading.

**2. Eight new point-buy perks — 4 assets, 4 liabilities.**
- Append **8** rows to `PERKS` in `src/lib/pointBuy.js`: exactly **4** with `cat: "asset"` and
  exactly **4** with `cat: "liability"`. No new `cat: "upgrade"` rows (they collide with
  `pickError`'s one-upgrade-per-unit rule).
- Append the **same 8 ids** to `PERK_MODS` in `base44/shared/perkMods.ts`.
- Theme: nomad-keel play — **graze, swath, draught columns, boarding** (`docs/ECONOMY_DESIGN.md`
  §§2–5, `docs/VISION.md` §3). Every one must read as a keel that eats ground and marches, not as a
  capital that sits.
- Ids: `snake_case`, unique across the whole catalog, never colliding with an existing perk id.
- Points: assets `pts` in `1…3`; liabilities `pts` in `-3…-1`.
- **Pricing rule:** price each new perk by analogy to an existing perk of identical mechanical
  magnitude (`±1 income = 3 asset / −2 liability`; `±15 army cap = 3 / −2`; `±1 unit stat = 3 asset
  (veteran_corps) or 2 as kit (trench_gear)`; `−10 disposition = −1`). Name the analogue for each of
  the 8 in the PR body.
- **Mod vocabulary:** each `PERK_MODS` row uses **only** `unitStat`, `unitCost`, `income`, `armyCap`,
  `startBonus`, `capitalDefense`, `disposition`; unit keys ⊆ `Object.keys(UNIT_TYPES)`; income keys ⊆
  `{ manpower, steel, fuel }`. Nothing else is reduced by `compileMods` and would be silently inert.
- Each perk's `desc` states its number in Ministry voice and matches its `PERK_MODS` row exactly.
- Register **8** new plates `perk_<id>` in the `POINT-BUY REQUISITIONS (GAME_RULES §13)` block of
  `src/lib/imageLibrary.js`, category `perks`.

**3. Lifepath Chapter VI — The Standard.**
- Append **one** chapter object to `LIFEPATH_CHAPTERS` in `src/lib/lifepath.js`:
  `{ id: "standard", title: "VI — The Standard", prompt: "…", options: [ …4 options… ] }`.
- Exactly **4** options, mapping one-to-one onto the **four `std_*` plates that already exist** —
  `std_column`, `std_reliquary`, `std_black`, `std_first_keel`. **Do not register new `std_*` plates;
  they are already in the `LIFEPATH & CHRONICLE` block.**
- Each option: `{ id, label, desc, plate: "std_<…>", effect: { type, unit?, value } }` where `effect`
  is in the **synthesizeFaction trait effect schema** (`type` ∈
  `income_flat|unit_discount|attack_bonus|defense_bonus`; `unit` ∈
  `riflemen|crawler|gunboat|fighter` and required for all but `income_flat`; `value` ∈ `1|2`, use
  `1` — this is the "small numeric effect"). No `requires` gates: all four are always available.
- Do not modify the four existing chapters or `availableOptions`. `src/pages/FactionBuilder.jsx` and
  `src/components/faction/RegistrationFile.jsx` are already generic over `LIFEPATH_CHAPTERS.length`,
  so **no component edit is needed or permitted.**

**4. Thirteen presets.**
- `PRESET_FACTIONS` goes from **3 rows to 13 rows**: the 3 existing rows (`kessel_pact`,
  `iron_synod`, `grauwall_marches`) plus **10 new rows**, one per Great House of
  `FACTION_ROSTER.md` §1, in roster order.
- **The 3 existing rows are additive-only.** `id`, `factionName`, `doctrine`, `insigniaDescription`,
  `lore`, `traits`, `pointBuy.picks`, `npcDispositions`, and the existing
  `lifepathChoices.{preset,doctrine,philosophy,value}` values stay **byte-identical** — including the
  legacy `philosophy` values `war_economy`/`industry`/`fortress` and `value` values
  `glory`/`order`/`endurance`, which do not appear in `PHILOSOPHIES`/`VALUES` and **must not be
  "fixed"**. They gain only `house`, `keel`, `uniqueRoster`, `heraldVoice`, and
  `lifepathChoices.standard` + `lifepathChoices.seeds`.
- **`house` stems for the ten houses are fixed by the plates that already exist** — use exactly
  these, and the keel slugs with them:

  | Roster house | `house` | `keel` |
  | --- | --- | --- |
  | The Iron Reclamation | `reclamation` | `iron_verdict` |
  | The Charter Combine | `combine` | `vow_of_coal` |
  | The Bastion Synod | `synod` | `reliquary_adamant` |
  | The Covenant of Locks | `covenant` | `vigil_of_chains` |
  | The Signal Ascendancy | `ascendancy` | `testimony_of_copper` |
  | The Commonweal March | `commonweal` | `bond_of_bread` |
  | The Salvage Court | `salvage` | `writ_of_knives` |
  | The Emberwright Union | `emberwright` | `debt_of_winters` |
  | The Long Procession | `procession` | `burden_of_bells` |
  | The Outrider Compact | `outrider` | `promise_of_dust` |

  All twenty of those plates (`house_<house>_crest`, `keel_<keel>`) **already exist** in the
  `THE GREAT HOUSES` block. Verify, do not duplicate.
- **The 3 legacy presets are not roster houses and have no plates.** Give each a `house` stem and a
  `keel` slug and register **6 new plates** — `house_kessel_crest`, `house_ironsynod_crest`,
  `house_grauwall_crest` and one `keel_<slug>` each — in the `THE GREAT HOUSES` block, category
  `houses`. Name each keel by the `LORE.md` §8 pattern: *the* **[Abstract noun] of [Material]**, a vow,
  a debt or a verdict (*Vow of Coal. Debt of Winters. Verdict of Iron.*).
- **`doctrine`** must equal the roster's per-house `**Doctrine**` line. Note the roster's §1 summary
  sentence claims "aggressive ×4, economic ×3, defensive ×3" while its own ten entries read
  **aggressive 4 / economic 4 / defensive 2**. The per-house lines govern: correct the summary
  sentence in `FACTION_ROSTER.md` (you own it) and flag the correction in the PR body.
- **`lifepathChoices.seeds`** must equal the roster's `**Seeds** Auth … , Econ … , Creed … , Mob …`
  values for that house, exactly. ⚠ The roster writes minus as **U+2212 (`−`)**, not ASCII hyphen, and
  house 4 carries a trailing asterisk (`Creed −1*`) — your parser must accept both signs and strip the
  asterisk. Legacy presets have no roster seeds: give them seeds consistent with their lore, each
  integer in `−3…3`.
- **`traits`** — exactly **3** per preset, each `{ name, description, effect }` with `effect` in the
  synthesizeFaction schema and `value` ∈ `1|2`.
- **`lore`** — **120–180 words**, counted as whitespace-separated tokens, in Ministry/in-world
  English, consistent with `LORE.md` (the Ground, the Four Departures, keels, the Rent, the Key) and
  the house's roster paragraph. No real-world nation, brand, person or place.
- **`insigniaDescription`** — one sentence, heraldic, colour only where it carries meaning
  (`LORE.md` §0.4).
- **`npcDispositions`** — `{ aggressive, economic, defensive }`, each an integer in `−20…20`,
  consistent with the house's creed and doctrine.
- **`pointBuy.picks`** — a **legal** ledger: `pickError(picks) === null`, `netPoints(picks) <= 0`,
  at most **3** liabilities, at most one `upgrade` per unit, every id in `PERK_BY_ID`.
- **`uniqueRoster`** — `{ squads: SquadTypeKey[], upgrades: UpgradeKey[], decree: ArmoryKey,
  patterns: WeaponPatternKey[] }`. Minimums per preset: **≥2 squads**, **≥2 upgrades**, **exactly 1
  decree**, **≥2 patterns**. **Every key must exist in the merged catalogs.** A key you want but
  cannot find is dropped from the data and listed in the PR body under
  `Keys requested for reconciliation` — never left in the table to go red.
- **`heraldVoice`** — equals `house`, and a matching pack must exist in `HERALD_VOICES.md`.
- **`presetToFactionRecord(preset)`** must strip **all five** presentation-only fields —
  `id`, `house`, `keel`, `uniqueRoster`, `heraldVoice` — because `base44/entities/Faction.jsonc` has
  no column for them and the entity change is platform-owned. Extend the existing destructure; keep
  the function's name and signature.

**5. Herald voices — thirteen packs.** Rewrite `docs/HERALD_VOICES.md` to the structure in
"Contracts you produce §3": **13** packs × **3** moods × **3** samples = **117** samples. Keep the
`## Shared Rules (all houses)` block, the `## Garble Template (confidence POOR)` block and the
`## Implementation Notes` block. The three existing packs (Reclamation, Combine, Synod) keep their
current sample lines, redistributed across the three moods — do not delete canon prose. Every sample
obeys the shared rules already in the file: diegetic, 1–4 sentences, `{braces}` for event variables,
no mechanics vocabulary (`turn`, `tile`, `player`, `stat`, `modifier`), no theology resolved.

**6. Settlements — the ten named polities.** Add `NAMED_POLITIES` to
`base44/shared/settlementLore.ts` with **exactly 10** rows, one per polity in `FACTION_ROSTER.md` §2
(`LORE.md` §6 describes the *cultures*; §2 of the roster is where the ten are **named** — use these,
in this order, with these `set_*` plates, all of which already exist):

| # | `name` | slug | existing plate |
| --- | --- | --- | --- |
| 1 | Hundredweight Bottoms | `hundredweight_bottoms` | `set_hundredweight` |
| 2 | The Nine Cradles | `nine_cradles` | `set_nine_cradles` |
| 3 | Tarpool | `tarpool` | `set_tarpool` |
| 4 | The Gray Commons | `gray_commons` | `set_gray_commons` |
| 5 | Crossloom | `crossloom` | `set_crossloom` |
| 6 | Vault-of-Winters | `vault_of_winters` | `set_vault_of_winters` |
| 7 | The Chandlery | `chandlery` | `set_chandlery` |
| 8 | Redwater Digs | `redwater_digs` | `set_redwater` |
| 9 | The Quiet Parish | `quiet_parish` | `set_quiet_parish` |
| 10 | Kettleharrow | `kettleharrow` | `set_kettleharrow` |

Each row carries **one** bespoke `crisis` line and **one** bespoke `charter` line (the "crisis/charter
hook"), plus `era` (verbatim from `LORE_ERAS`), `hook` (in `LORE_HOOKS` grammar), `kind` (a
`LORE_HOOKS` key), `culture`, `spoils` (a single-key `LORE_SPOILS`-shaped object), and `plate`. Wire
the name lookup into `settlementDossier` as specified. Do **not** register new settlement plates.
Then extend `docs/LORE.md` §6 with a short paragraph naming the ten and pointing at
`FACTION_ROSTER.md` §2 as their register — §6 currently names none of them.

**7. Codex — ≥40 new entries**, appended as the one banner-commented tail block described under "The
shared-file protocol". `ENTRIES` in `src/lib/wiki/entries.js` held **46** entries on `main` before this
wave, so the shipped floor for this lane is **46 + the four content lanes' blocks + your ≥40**. The
hard, checkable minimum is therefore stated two ways and you must satisfy both: **`ENTRIES.length >= 86`**
(the arithmetic that held when this brief was written), **and ≥40 ids that are new in this lane's
diff** — count your own additions with `git diff origin/main -- src/lib/wiki/entries.js`, because
Lanes F, G, I and J each appended entries ahead of you and their rows are not yours to claim. Required coverage, at minimum:
- **13** entries — one per preset faction (10 houses + 3 legacy), `category: "powers"`.
- **10** entries — one per named polity, `category: "powers"` or `"theaters"`.
- **8** entries — one per new point-buy perk, or a small number of grouped entries covering all 8 by
  name, `category: "war"`.
- **1** entry for Chapter VI / the army standard, `category: "war"`.
- The remaining ≥8 spread across `cosmology`, `history`, `leavings`, `lexicon` — keels, herald voices,
  the four Departures as houses hold them, salvage adjudication, the swath, grazing rights, the
  Anchor Fields, whatever your lore work generates.
Every entry: unique `id` (kebab-case slug), `category` ∈ `CATEGORIES` ids, `status` ∈ `STATUS` keys,
a one-line `summary`, `blocks` using only the shipped block kinds (`lead`, `p`, `h`, `note`, `quote`,
`list`, `table: { head, rows }`), and **`see` entries that all resolve to real ids** — the corpus is
currently 100% link-clean and must stay that way. **Cross-link both ways:** each new house entry
appears in the `see` of at least one other entry. Never invent canon: if an entry needs an answer the
governing documents do not give, mark `status: "thin"` and leave the question to
`src/lib/wiki/register.js` (which you do **not** edit) rather than answering it.

**8. Plates.** New `P(...)` rows only, `url` never set, **all of them in the one banner-commented tail
block** described under "The shared-file protocol" — not inserted into the `houses` or `perks` sections
in the middle of the array. Their `category` field is what files them under houses and perks; their
position is not.
- `houses` category: **3** `house_<stem>_crest` + **3** `keel_<slug>` for the legacy presets = **6**.
- `perks` category: **8** `perk_<id>`.
- **Minimum 14 new plates.** Every plate `key` unique across the whole `IMAGE_LIBRARY`. Prompts carry
  **no house style** — `HOUSE_STYLE` is prepended at generation. Do **not** add `settlements`,
  `lifepath` or `ideology` plates: `set_*`, `std_*` and the axis/bloc/decree plates you need already
  exist. Verify before adding anything.

**9. `docs/GAME_RULES.md` draft section.** Append **one** section at the very end of the file:
`## <N>. Houses, Standards & Nomad-Keel Perks [PROPOSED — awaiting platform wiring]`, where `<N>` is
one greater than the highest existing `## <number>.` heading at the time you write. Contents: the 8
new perks with their exact numbers, Chapter VI's four standards with their effects, and a one-line
table of the 13 presets (name / doctrine / seeds / decree). **Do not renumber, reword or delete any
existing section**, including `§13 Faction Point-Buy Perks` — the platform lane promotes the draft.

**10. `docs/FACTION_ROSTER.md`.** Correct the doctrine-count sentence (work item 4), and add a short
`§5 Reconciliation` note recording: the `house`/`keel`/`heraldVoice` key table, which Lane F/G/I keys
each house's `uniqueRoster` claims, and any key you had to drop. This doc is the reconciliation
record the platform lane reads.

**11. `test/presets.test.js`.** The one test file this lane owns; every check below lives in it.

---

## Acceptance criteria

### Verbatim from `TACTICAL_SQUAD_PLAN.md` §3, Lane H

> Acceptance: every preset passes `pointBuy.js` validation in a unit test; no PII anywhere; every
> house has `house_<key>_crest` + `keel_<key>` plates; `HERALD_VOICES.md` covers all 13 factions.

### Lane-specific checks — all of them live in `test/presets.test.js`, all of them run under `npm test`

Write these as real assertions, not as prose. Each numbered item is at least one `it(...)`.

**Presets**
1. `PRESET_FACTIONS.length === 13`.
2. The three legacy ids `kessel_pact`, `iron_synod`, `grauwall_marches` are still present, in
   positions 0–2, and their `factionName`, `doctrine`, `insigniaDescription`, `lore`, `traits`,
   `pointBuy`, `npcDispositions`, `isNPC` and `lifepathChoices.{preset,doctrine,philosophy,value}`
   deep-equal the values captured as a frozen fixture inside the test file.
3. Every `id` is unique; every `factionName` is unique.
4. For every preset: `pickError(preset.pointBuy.picks) === null`, `netPoints(picks) <= 0`, the count
   of `cat === "liability"` picks is `<= 3`, and every pick id exists in `PERK_BY_ID`.
5. Every preset's `traits.length === 3`, and every `traits[].effect` satisfies:
   `type` ∈ the four-value enum; `value` is an integer in `1…2`; `unit` present and ∈
   `riflemen|crawler|gunboat|fighter` iff `type !== 'income_flat'`.
6. Every preset's `lore` has a whitespace-token count in `120…180` inclusive.
7. Every preset's `doctrine` ∈ `aggressive|economic|defensive`, and `npcDispositions` has exactly the
   three keys with integer values in `−20…20`.
8. Every preset's `lifepathChoices.seeds` has exactly the four axis keys, each an integer in `−3…3`,
   and `lifepathChoices.standard` ∈ the four `std_*` keys.
9. **Seeds match the roster.** Read `docs/FACTION_ROSTER.md` with `readRepoFile` from
   `test/helpers/extract-const.js`, parse each house's `**Seeds** Auth ±n, Econ ±n, Creed ±n, Mob ±n`
   line (accept both `-` and `−`, tolerate a trailing `*`), and assert the parsed values deep-equal
   the corresponding preset's `lifepathChoices.seeds` for all **10** roster houses.
10. **Doctrine matches the roster.** Same parse, on each house's `**Doctrine** <word>` field, for all
    10 roster houses.
11. `presetToFactionRecord(preset)` returns an object with **none** of
    `id, house, keel, uniqueRoster, heraldVoice`, and whose remaining keys are a subset of the
    `Faction.jsonc` property names.

**Unique rosters — every referenced key is real**
12. For every preset: every `uniqueRoster.squads[]` is a key of `SQUAD_TYPES`; every
    `uniqueRoster.upgrades[]` is a key of `UPGRADES`; `uniqueRoster.decree` is a key of
    `ARMORY_ITEMS` **and** that item's `kind === 'decree'`; every `uniqueRoster.patterns[]` is a key
    of `WEAPON_PATTERNS`.
13. Minimum sizes per preset: `squads.length >= 2`, `upgrades.length >= 2`, `patterns.length >= 2`,
    `typeof decree === 'string'`.

**Perks**
14. `PERKS.length >= 29` (21 shipped + 8 new); exactly **4** of the new ids have `cat === "asset"`
    and exactly **4** `cat === "liability"`.
15. Every new asset's `pts` ∈ `1…3`; every new liability's `pts` ∈ `-3…-1`.
16. `Object.keys(PERK_MODS)` (lifted from `base44/shared/perkMods.ts` with `extractConst`) sorted
    equals `PERKS.map(p => p.id)` sorted — the same assertion `test/rules-mirror.test.js` makes,
    asserted here too so this lane fails on its own terms.
17. Every `PERK_MODS` row uses only the keys `unitStat | unitCost | income | armyCap | startBonus |
    capitalDefense | disposition`; every `unitStat`/`unitCost` unit key ∈ `Object.keys(UNIT_TYPES)`;
    every `income` key ∈ `{manpower, steel, fuel}`. (This is the "no silently-inert mod" gate.)
18. Every one of the **8** new perk ids is picked by **at least one** of the 13 presets — new content
    that nothing uses is not shipped content.

**Lifepath**
19. `LIFEPATH_CHAPTERS.length === 5`; the last chapter has `id === "standard"` and
    `title === "VI — The Standard"`; it has exactly **4** options.
20. The four options' `plate` values are exactly the set
    `{std_column, std_reliquary, std_black, std_first_keel}`, each used once, and each is a real
    `IMAGE_LIBRARY` key.
21. Every Chapter VI option's `effect` satisfies the same trait-effect schema assertion as check 5.
22. The first four chapters deep-equal a frozen fixture in the test file (additions-only proof).

**Plates**
23. For all **13** presets, `IMAGE_LIBRARY` contains a plate keyed `house_${preset.house}_crest` and
    one keyed `keel_${preset.keel}`. *(This is the §3 acceptance criterion, mechanised.)*
24. For every new perk id, `IMAGE_LIBRARY` contains `perk_${id}`.
25. Every `IMAGE_LIBRARY` key is unique, and every plate's `url` is `null` or comes from
    `PLATE_URLS` — no lane-authored URL string appears in `imageLibrary.js`.

**Herald voices**
26. Parse `docs/HERALD_VOICES.md`: for each of the 13 `heraldVoice` values there is exactly one `## `
    pack whose heading contains `` `<packKey>` ``.
27. Each pack contains the three mood headings `### Ascendant`, `### Pressed`, `### Dealing`, and at
    least **3** lines beginning `> ` under each — **≥117** sample lines in the file in total.
28. Each pack contains a `**Voice.**`, an `**Always:**` and a `**Never:**` line.
29. No sample line contains the banned mechanics vocabulary (case-insensitive whole words):
    `turn`, `tile`, `player`, `stat`, `modifier`, `hex`, `XP`, `buff`, `debuff`.

**Settlements**
30. `NAMED_POLITIES` lifted from `base44/shared/settlementLore.ts` with `extractConst` has exactly
    **10** keys (this also proves it is a pure data literal — `extractConst` throws on anything else).
31. Every row: `kind` ∈ `Object.keys(LORE_HOOKS)`; `era` ∈ `LORE_ERAS`; `spoils` has exactly one key,
    ∈ `{steel, manpower, fuel}`, integer `2…5`; `hook`, `crisis` and `charter` are non-empty strings;
    `hook` starts with a lowercase letter; `plate` is a real `IMAGE_LIBRARY` key.
32. Every `name` appears in `docs/FACTION_ROSTER.md` §2 (substring check against the read file).
33. `settlementDossier({ id: 'n1', name: 'Tarpool', kind: 'town' })` returns exactly
    `{ title, era, text, spoils }` (four keys, no more), with `era` and `spoils` equal to the
    `tarpool` row's, and `text === 'Tarpool ' + row.hook + '.'`.
34. `settlementDossier` on a node whose name is **not** a named polity still returns the same four
    keys and is deterministic across two calls (the legacy hashed path is intact).
35. `charterOptions(dossier)` still returns exactly the three ids `requisition`, `levy`, `autonomy`.

**Codex**
36. `ENTRIES.length >= 86`, **and** at least **40** of the ids are new in this lane (assert against a
    hard-coded list of your own new ids, so another lane's tail block cannot satisfy your minimum for
    you).
37. Every `id` is unique; every `category` ∈ `CATEGORIES` ids; every `status` ∈ `Object.keys(STATUS)`;
    every entry has a non-empty `summary` and a non-empty `blocks` array.
38. Every `see` id resolves to a real entry id (zero dangling links, corpus-wide).
39. Every block object uses only the keys `lead | p | h | note | quote | list | table`, and every
    `table` has `head` and `rows`.
40. There is at least one entry whose text (via `entryText`) mentions each of the **13** faction
    names and each of the **10** polity names.

**Voice and safety**
41. **No PII anywhere.** Assert that none of the strings this lane produces — preset `lore`,
    `insigniaDescription`, trait text, perk `desc`, polity `hook`/`crisis`/`charter`, codex
    `summary`/blocks, and the raw text of `docs/HERALD_VOICES.md` — matches an email address, a URL,
    a phone-shaped digit run, or an `@handle`. Regexes: `/[\w.+-]+@[\w-]+\.[\w.]+/`,
    `/https?:\/\//`, `/\+?\d[\d\s().-]{7,}\d/`, `/(^|\s)@\w+/`.
42. **No real-world proper nouns.** Assert a denylist of at least the obvious ones
    (`America|Europe|Russia|German|Britain|France|China|Japan|Soviet|Nazi|Reich|USSR|NATO`) does not
    appear in any string this lane produces.
43. **No hex colours** appear in any file this lane touched (`/#[0-9a-fA-F]{3,8}\b/` over the changed
    `src/lib` files), and none of the new copy uses out-of-world mechanics words (same list as check 29)
    in a user-visible string.

---

## Drift guards

The `TACTICAL_SQUAD_PLAN.md` §6 list, in full, plus the environment rules. All of these are binding.

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it. UI-only
   fields are allowlisted in the test. *(For this lane the live instance is
   `perkMods.ts` `PERK_MODS` ↔ `pointBuy.js` `PERKS`, enforced by `test/rules-mirror.test.js`.)*
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations,
   autoFormations, autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported.
   *(For this lane: `settlementDossier`, `charterOptions`, `LORE_ERAS`, `LORE_HOOKS`, `LORE_SPOILS`,
   `loreHash`, `POLICY_COOLDOWN_DAYS`, `POLICY_LOG` keep their names and signatures;
   `presetToFactionRecord`, `netPoints`, `pickError`, `availableOptions`, `entryText`, `citedBy`,
   `getImage`, `libraryStats` keep theirs.)*
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind
   classes must be literal strings.
5. **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only.
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from `data.js`,
   never retyped. *(For this lane: a perk's number is written once in `PERK_MODS`, described in the
   perk's `desc`, and never re-derived anywhere else; the same number in `GAME_RULES.md` is prose
   about the table, not a second source.)*
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and
   flags `docs/GAME_RULES.md` for the platform lane. *(You do not own `COMBAT_DESIGN.md`; your rule
   numbers land in the appended `[PROPOSED]` `GAME_RULES.md` section and are flagged in the PR body.)*
10. **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no
    `UnitSprite.jsx` edits. Art is requested only as `imageLibrary.js` placeholders with `url: null`.
    **Existing catalog keys are never renamed or removed (live saves reference them.)** Every new
    mechanical effect uses the §4 effect-key vocabulary or extends it in the same PR.
11. **Arms granularity stays numeric and server-rolled** — no weapon stat exists only in prose; every
    quirk carries a machine-evaluable `condition`; `rollWeapon` is pure and seeded (no `Math.random`);
    the tactical engine consumes only `deriveLoadout` output, never raw weapon instances.
12. **One damage model** — armour math exists only in `arms.ts`. No lane re-implements penetration in
    its own file. *(You reference `WEAPON_PATTERNS` keys only; you never restate a weapon number.)*
13. **Mechanized granularity mirrors arms** — `rollVehicle` is pure and seeded; the engine consumes
    only `deriveMechanized` output plus `facings`.

### Environment rules — non-negotiable

- **NEVER run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store (`~/.node-modules-store/rust-legions/node_modules`)
  and npm **silently deletes the symlink** and reifies a real directory in its place. Dependencies are
  already installed. `scripts/agent-worktree.sh` prints a `npm ci` hint — **ignore it.** If a worktree
  has no `node_modules`, **stop and report**; do not install.
- **NEVER edit `package.json` or `package-lock.json`** (drift guard 3).
- **Pure data literals only.** Every table exported from a `base44/shared/*.ts` file **must be a pure
  data literal** — `export const NAME = { ... }` / `[ ... ]` — with **no spreads, no computed keys, no
  function calls, no template literals in keys**, because the mirror tests lift it **textually** with
  `test/helpers/extract-const.js` and `Function()`-evaluate it. A table that is computed cannot be
  mirror-tested. This binds `NAMED_POLITIES` in `settlementLore.ts` and `PERK_MODS` in `perkMods.ts`.
  (Derived lookups such as `Object.fromEntries(...)` are fine **beside** the literal, never instead of
  it.)
- `@/` imports only inside `src/`. Tests import backend `.ts` by relative path, the way
  `test/helpers/macro-harness.js` already does.
- No hex colours anywhere; no non-literal Tailwind class strings (Tailwind purges template-built
  class names).
- **Ministry voice in every user-visible string** — in-world military-ministry English, diegetic,
  never addressing "the player".
- **Components ≤ ~60 lines, one per file.** *(This lane writes no components. If you believe you need
  one, you have drifted — stop.)*
- **Existing catalog keys are NEVER renamed or removed** — live saves reference them. That covers
  every `PRESET_FACTIONS.id`, `PERKS.id`, `LIFEPATH_CHAPTERS[].id` and option id, `ENTRIES[].id`,
  `IMAGE_LIBRARY` plate key, and every export in `settlementLore.ts`.
- **Numbers live in one place** — any constant shown in UI copy is imported from `src/lib`, never
  retyped.
- **The lane works in its OWN git worktree on branch `feat/tactical-h`, pushes to `origin`, and opens
  a PR against `main`.** PR title: `tactical(h): <summary>`; the body lists the contract sections
  touched and the test names added. It never edits another lane's files; **if a contract must change
  it edits `docs/TACTICAL_SQUAD_PLAN.md` §4 FIRST and says so in the PR body.** *(If the prompt that
  launched you says the orchestrator owns git state, that instruction wins: leave the work in the
  working tree, run the Definition-of-done commands, and report the PR body text instead of pushing.)*

---

## Definition of done

Run these, in this order, from the repository root. Green means exactly what is written beside each.

```bash
cd /home/blae/Documents/ROOT/Code/rust-legions

# 1. Full suite — includes your new test/presets.test.js and the pre-existing mirrors
npm test

# 2. Lint
npm run lint

# 3. The rules-guard hook (reads the tool payload on stdin; never blocks, always exits 0)
bash .claude/hooks/rules-guard.sh < /dev/null

# 4. The mirror invariant on its own, because this lane edits a mirrored rules file
npm run rules:check

# 5. Typecheck (green on the baseline — keep it green)
npm run typecheck
```

**What green looks like:**

1. `npm test` — **0 failed, 0 skipped**, and `test/presets.test.js` in the run. **Do not gate on an
   absolute file or test count.** `main` carried `Test Files 6 passed (6) · Tests 95 passed (95)`
   before this wave, but Lane H merges **last**: by the time you rebase, Lanes A, B, C, F, G, I and J
   have each added test files (`tactical-mirror`, `tactical-field`, `tactical-engine`,
   `catalog-mirror`, `arms-mirror`, `arms-roll`, `motor-mirror`, `motor-roll`, …). Read the totals off
   your own run after `git fetch origin && git rebase origin/main`; the only fixed facts here are
   *0 failed* and *your file present*. `test/rules-mirror.test.js` in particular must still pass — it
   is the one that goes red if `perkMods.ts` and `pointBuy.js` disagree.
2. `npm run lint` — exit code `0`, no output beyond the npm notice lines. (ESLint ignores
   `src/lib/**`, so a green lint is **not** evidence your lib edits are sound — checks 1 and 5 are.)
3. `bash .claude/hooks/rules-guard.sh < /dev/null` — exit code `0`, no output. It is a passive
   reminder and never blocks; running it is the §6.8 requirement.
4. `npm run rules:check` — exit code `0`; `test/rules-mirror.test.js` and `test/combat-math.test.js`
   both pass.
5. `npm run typecheck` — exit code `0`, **no output at all**. It is silent on the baseline.

**Then, before you report done, confirm each of these by running the command:**

```bash
# 13 presets
node -e "import('./src/lib/presetFactions.js').then(m=>console.log('presets',m.PRESET_FACTIONS.length))"          # 13

# 29+ perks, 4 new assets / 4 new liabilities
node -e "import('./src/lib/pointBuy.js').then(m=>console.log('perks',m.PERKS.length))"                            # >= 29

# 5 chapters, chapter VI has 4 options
node -e "import('./src/lib/lifepath.js').then(m=>{const c=m.LIFEPATH_CHAPTERS;console.log('chapters',c.length,'ch6',c[c.length-1].id,c[c.length-1].options.length)})"   # 5 standard 4

# 86+ codex entries, zero dangling see-links
node -e "import('./src/lib/wiki/entries.js').then(m=>{const ids=new Set(m.ENTRIES.map(e=>e.id));const bad=m.ENTRIES.flatMap(e=>(e.see||[]).filter(s=>!ids.has(s)));console.log('entries',m.ENTRIES.length,'dangling',bad.length)})"   # >= 86, 0

# 10 named polities
node -e "import('./base44/shared/settlementLore.ts').then(m=>console.log('polities',Object.keys(m.NAMED_POLITIES).length))"   # 10

# 13 herald packs, 117+ samples, 0 banned words
grep -c '^## ' docs/HERALD_VOICES.md                                     # 13 packs + 3 structural blocks
grep -c '^> ' docs/HERALD_VOICES.md                                      # >= 117
grep -inE '\b(turn|tile|player|stat|modifier|hex|buff)s?\b' docs/HERALD_VOICES.md | grep '^[0-9]*:> '   # no output

# 14+ new plates, all url-free
node -e "import('./src/lib/imageLibrary.js').then(m=>{const k=m.IMAGE_LIBRARY.map(p=>p.key);console.log('plates',k.length,'unique',new Set(k).size)})"   # equal

# no PII in the working tree's changed files
git diff --name-only | xargs -r grep -nE '[[:alnum:].+_-]+@[[:alnum:]-]+\.[[:alnum:].]+|https?://' || echo "clean"
```

**Report in your final message:** the five command results; the counts above; the list of Lane F/G/I/J
keys you referenced; any key you had to drop, under `Keys requested for reconciliation`; and the two
contract amendments you made to `docs/TACTICAL_SQUAD_PLAN.md` §3 and §4. If anything in Work item 0
was missing, report that instead and change nothing.

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

## WAVE 4 ADDENDUM — 2026-09-02 (orchestrator, AUTHORITATIVE)

Waves 1-3 are merged. `main` is green at **1179 tests**. Every key you reference now exists.

### What is on main for you to reference
- `SQUAD_TYPES` **20 rows** and `SPECIALISTS` **10** and `UPGRADES` **10** (Lanes A + F) in
  `base44/shared/tactical.ts` / `src/lib/tactical/data.js`.
- `TECHS` **25**, `ARMORY_ITEMS` **32**, `RELIC_PROJECTS` **4**, `CREEDS` **4** (Lane G) in
  `base44/shared/catalog.ts` / `src/lib/doctrine.js` / `src/lib/armory.js`.
- `WEAPON_PATTERNS` **49**, `MANUFACTURERS` **14** (9 + Lane J's 5 `mw_*`), `CALIBRES` 16 (Lane I) in
  `base44/shared/arms.ts`.
- `CHASSIS_PATTERNS` **20** and the rest of the Motor Pool (Lane J).
**Read the live tables and use real keys.** Every key in a `uniqueRoster` must exist; the orchestrator
checks. §4 `Preset.uniqueRoster` is `{ squads, upgrades, decree, patterns }` — `patterns` included
(amendment Q3).

### Hard requirements
- **13 house presets**, each a LEGAL point-buy ledger (`netPoints <= 0`, `<= 3` liabilities) that passes
  `pointBuy.js` validation in a unit test, with `traits[]` in the validated effect schema,
  `npcDispositions`, `lifepathChoices`, `insigniaDescription`, 120-180 words of `lore`,
  `uniqueRoster { squads, upgrades, decree, patterns }` and `heraldVoice`.
- **NO `keel` field on `Preset`** (amendment Q3b). The required `keel_<key>` plate is keyed off the
  existing `house` value. Do not add a field.
- **Herald voices for all 13** in `docs/HERALD_VOICES.md` — register, catchphrases, 3 sample intercepts
  per mood.
- **40+ new Codex entries** appended as ONE banner-commented tail block at the very end of
  `src/lib/wiki/entries.js`, after the existing Lane I / G / J / F blocks. Never insert between them.
  Your minimum is 40 entries **in your own diff**, not 40 in the file.
- **>= 8 new point-buy perks** (4 assets / 4 liabilities) tied to nomad-keel play.
- **One new lifepath chapter "VI — The Standard"** with 4 choices, `std_*` plates and a numeric effect.
- **Unique lore + one bespoke crisis/charter hook** for each of the 10 named polities in `LORE §6`, as
  rows in `settlementLore.ts` matching the existing row shape EXACTLY.
- **Every house's Departure must be derivable from its Creed-axis position** — Lane G's G4 relies on it.
- **Close `docs/TECH_DESIGN.md` §7 Q5** on the operator's ruling below, and write the herald line for the
  loss.

### Operator rulings you must encode
1. **Relic projects die with the keel; materials only.** When a fortress-base is captured the captor
   loots the running project's unspent **materials**; the project, its progress and its housed-Object
   requirement are **lost**. This is what closes §7 Q5. Write the herald line for that loss.
2. **Module effects apply on FIT, never on unlock.** A `kind: 'module'` row's certification is inert.
   **Your presets must not assume that unlocking a module grants its effect** — no preset lore or trait
   may imply a faction-wide bonus from certification alone.

### The four defect classes earlier waves shipped — you are the last content lane, so you inherit all of them
1. **DEAD CODE WITH A FALSE JUSTIFICATION.**
2. **A PUBLISHED NUMBER ARITHMETICALLY FALSE AGAINST ITS OWN TABLE** — compute every figure from the
   tables and add a test that recomputes it.
3. **A GATE BOUNDED BY "EVERYTHING TO END OF FILE"** — bound both ends.
4. **A CLOSED SET THAT FORBIDS A LEGAL VALUE.** This one cost two extra passes: Lane A pinned
   `SQUAD_TYPE_KEYS` to the nine that existed, which structurally forbade the appends §3 *mandates*; the
   repair then left the FIELD set closed, which forbade `creedLock` — a field §4 marks **optional**.
   **Ask what §4 marks with a `?`, at every level — tables, rows, fields, and the values inside a field.**
   You are the last lane to append; write no gate that a future Field Amendment would have to fight.

### Shared-file state
`docs/GAME_RULES.md`: `## 23` Lane I, `## 24` Lane G, `## 25` Lane J, `## 26` Lane C, `## 27` Lane F.
Take the next free number, name it in your PR body, and hard-code it nowhere a renumber would break.
`IMAGE_LIBRARY` carries tail blocks from Lanes I, G, J and F — append ONE more at the very end.
`IMAGE_CATEGORIES` already has `arms` and `motor`; you need no new key.
`docs/prompts/PLATFORM_HANDOFF.md` is a sanctioned append surface (amendment Q8).
**Do NOT edit `docs/prompts/ART_MANIFEST.md`** — report your plate keys in the PR body.
