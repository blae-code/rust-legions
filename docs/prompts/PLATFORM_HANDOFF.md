# PLATFORM HANDOFF — Tactical Squad Plan

Everything the worktree lanes could **not** do because it is platform-owned: `base44/functions/gameEngine/entry.ts`,
`base44/entities/*.jsonc`, `Patch` records, and anything needing a live backend deploy or `test_backend_function`.

Apply these in the **Base44 chat session**, in order. Phase 3 (P3) is the engine wiring; C3 is the content wiring.
Nothing here has been applied except where a row says APPLIED.

> Status: **accumulating.** Lanes append to this file as they discover platform needs. It is posted to the
> operator when waves 1–4 are merged, and the orchestrator then stops until told Phase 3 is live.

---

## 0. Already applied to a platform-owned file (verify it survives the next Base44 sync)

| File | Change | Why | Risk |
| --- | --- | --- | --- |
| `base44/functions/gameEngine/entry.ts` | Two **comment lines only**, added around the settlement-charter block: `// ---------- Begin settlement charter (harness marker) ----------` and `// ---------- End settlement charter (harness marker) ----------` | `test/helpers/macro-harness.js` lifts marked regions of this file textually so the macro simulation tests exercise the real engine instead of stubs. The identical convention already existed in this file for the macro-engine block. | None — zero behaviour change, no deploy required. **Verified surviving** after the 2026-09-01 platform sync. |
| `base44/functions/gameEngine/entry.ts` → `base44/shared/commandVehicles.ts`, `base44/shared/macroGraph.ts` | **Platform-side extraction (2026-09-01):** command-vehicle tables and macro route/weather/pathing/supply math lifted into shared modules; engine imports them. Engine 2,459 → 2,393 lines. Harness now injects both modules and lifts the macro region from `const MACRO_UNIT_MARCH = {`; mirror tests assert import-not-inlined. | Headroom for P3 wiring. | Lanes must **import, never edit** these modules. Rebase lane branches onto the synced `main`; `npm test` = 97 passed. |

---

## P3 — Engine wiring (after waves 1–3)

- [ ] `createTactical` call site passes `{ seed, nodeKind, weather, fortBonus }`.
- [ ] `tacticalDeploy` accepts `squads: [{ name, type, figures, specialists: [], at?: {q,r}, loadout? }]`.
- [x] **APPLIED 2026-09-01** — `tacticalOrders` reads `body.orderAction` (Q1). Envelope `action` stays the
      dispatch verb; `squadId` (legacy `formationId`) and `target.squadId` (legacy `targetId`) are accepted.
- [x] **APPLIED 2026-09-01** — `tacticalAuto { gameId }` hands the caller's side to the staff: deploys via
      `autoFormations` if not yet filed, then runs `autoOrders` turns until the engagement settles. Both sides
      may hand off; the shared `settleTactical` tail persists and archives. **Lane E may ship its button enabled.**
- [ ] `tacticalView` fields persisted via `persistWar()`.
- [ ] Field Amendment `Patch` dispatch filed.

*(Exact function bodies, entity schema JSON and action names are appended by the lanes as they are written.)*

---

## C3 — Content wiring (after wave 4)

- [ ] Import `base44/shared/catalog.ts` into `gameEngine` **and** `concurrentPlay`, retiring the inlined duplicates.
- [ ] Apply the typed `effects[]` vocabulary in the engine.
- [ ] Enforce `creedLock` / `factionLock`.
- [ ] Point `npcHerald` at the `docs/HERALD_VOICES.md` voices.
- [ ] `base44/entities/ArmyDesign.jsonc` → the `SquadTemplate` shape.
- [ ] Generate every placeholder plate registered in `src/lib/imageLibrary.js` and deliver its URL into
      `src/lib/imagePlates.js` — the full list is `docs/prompts/ART_MANIFEST.md`.
- [ ] Promote each `[PROPOSED — awaiting platform wiring]` section of `docs/GAME_RULES.md` to live.

---

## Lane-appended items

*(Lanes append below, one `### Lane <X>` block each, with exact bodies/schemas/action names.)*
### Lane I — the Arms Catalogue & the Universal Damage Model

Data is complete, tested and mirrored (`base44/shared/arms.ts` ↔ `src/lib/arms.js`). Nothing below
is wired; each item is a decision the platform lane owns.

**1. Where `rollWeapon` fires.** `rollWeapon({ seed, class, maker, calibre, tierCap, luck })` is pure
and seeded and returns a `WeaponInstance` — the lane supplies the function, the platform decides the
trigger. The three §3 callers named are **battle loot**, **dig finds** and **armory certifications**.
Each needs a `seed` that is *stable and reproducible from the game record*, because a serial is
reproduced from its seed rather than stored: derive it from `(gameId, turn, sourceKey, index)` and
never from `Date.now()` or a request-time random. A re-derivable seed means the same dig produces the
same rifle on a replay, a refresh and a rollback.

**And a derivation that comes up short now FAILS rather than degrades.** `mulberry32` coerces its
argument with `a |= 0`, so an `undefined` or `null` seed used to become seed 0 and every caller that
failed to derive one got the same weapon, silently and permanently. `rollWeapon` throws
`rollWeapon: seed must be a finite number` on anything non-finite (`undefined`, `null`, `NaN`,
`Infinity`, a numeric string). Seed `0` itself is a perfectly good seed — the guard is on finiteness,
not on truthiness. Likewise a non-finite `luck` is now treated as neutral `0`; it previously poisoned
every adjusted weight and returned the RAREST grade on every roll.

**2. Arsenal validation of any instance reaching `tacticalDeploy`.** A `WeaponInstance` arriving from
a client is untrusted. Before it is stored on a squad's `loadout`, the engine must reject it unless:
`patternKey ∈ WEAPON_PATTERNS`; `quality ∈ QUALITY_GRADES`; every `mods[k] ∈ MODIFICATIONS` with
`slot ∈ WEAPON_PATTERNS[patternKey].slots` and `appliesTo` containing the pattern's class; **no two
mods share a slot**; every `quirks[k] ∈ QUIRKS`; and `serial` matches `/^[A-Z]{3}-\d{3}-[0-9A-Z]{5}$/`.
Those are exactly the invariants `test/arms-roll.test.js` asserts over 500 rolled instances, so a
validator can be written straight off that test. Without it a client can hand itself a `relic`-grade
anti-crawler lance with four ammunition kits on it and the engine will price it as legal.

**3. Where a `Loadout` is persisted.** §4 says squad rows gain `loadout?: Loadout`
(`{ primary, support?, sidearm? }`). The lane does not touch `base44/entities/**`, so the field does
not exist yet. The engine consumes only `deriveLoadout(squad)` and `loadoutProfile(squad)` — never a
raw instance (drift guard 11) — so the storage decision is free as long as those two are what the
tactical path reads.

**Two rules `deriveSquad` must not guess at, both now asserted in `test/arms-roll.test.js` and
written up in `docs/ARMS_CATALOGUE.md` §10.2:**

- **An absent `loadout` must not be reduced, and the function makes that safe for you.**
  `deriveLoadout`'s `melee`, `ranged` and `range` are `absolute` in `LOADOUT_KEYS` — they *replace*
  the `SquadType` base value. Since no squad row carries a `loadout` yet, a `deriveSquad` that
  applied the result unconditionally would zero every authored `melee`/`ranged`/`range` in the game.
  So a squad with **no `loadout` at all returns `{}`** (contributes nothing, overrides nothing),
  while a squad with a `loadout` that is **present and empty** returns the full set of zeroes —
  an unarmed stand, where zero is the right answer. Calling it unconditionally is safe.
- **The values are PER FIGURE, not per squad.** `SquadType.pts` is the cost of a squad
  (`riflemen` = 100, ten figures); `WeaponPattern.pts` is the cost of one weapon (the 141 Levy Rifle
  = 1). `deriveLoadout` never reads `squad.figures` — a one-figure team and a ten-figure section
  carrying the same weapons reduce identically. `deriveSquad` multiplies `melee`, `ranged` and `pts`
  by `figures` before applying them; `range` and `speed` describe what one figure carries and are
  never scaled. A ten-figure section with 1-point rifles adds **10** to its 100-point squad, and
  `deriveLoadout` returns the **1**.

**4. Where a stand's `armour` class is stored.** §4 says every stand row gains
`armour: ArmourClassKey`, infantry `none/soft/light` via upgrade kits, vehicles **per facing**. Lane J
keys its `Facings` off `ARMOUR_CLASSES`; `resolveHit` takes the armour-class **row**, not the key, so
whatever stores the key must resolve it through `ARMOUR_CLASSES[key]` at the call site.

**5. `resolveHit` is the only armour arithmetic in the repository** (drift guard 12). Lane A imports
it rather than writing penetration code; `test/arms-mirror.test.js` asserts that `armourValue`,
`PEN_TABLE[` and `TYPE_MATRIX[` appear nowhere outside `penMultFor` / `resolveHit` / `resolveAoe` in
either file. If the engine needs suppression weighting, `SUPPRESSION` is exported as data — a
zero-effect hit still suppresses, and that number belongs in the table, not in the engine.

**6. `docs/GAME_RULES.md` section 23** is appended as
`[PROPOSED — awaiting platform wiring]` and is on the C3 promotion list.

**7. A decision the lane could not make: the morale/initiative quirks are DECLARATIVE.** §4 declares
`Quirk.mods` as `Partial<WeaponBase> | { morale?, initiative? }` — a **union**, and no row mixes the
two branches (asserted, because `applyDelta` copies only `WeaponBase` keys and would silently discard
half of a mixed row). The morale/initiative branch holds `ferrymans_blessing`, `prize_taken`,
`synod_proscribed`, `ledger_kept` and `hair_trigger` — including the two §3 names it calls for by hand — `ferrymans_blessing` and `prize_taken`. **Nothing in this lane spends them:**
`deriveLoadout`'s keys are fixed by `LOADOUT_KEYS`, which has no `morale`, and `loadoutProfile`
returns exactly `{ armorPen, damageType, aoe, misfire }` because §22.9 asserts those four and nothing
else. Their conditions evaluate and their numbers are authored and mirrored; whether squad morale or
initiative reads them is a platform decision. `morale` is already inside `SQUAD_VALUE_KEYS`, so the
smallest wiring is to add it to `LOADOUT_KEYS` as a `delta` and sum the active morale quirks in
`deriveLoadout` — which changes a published contract and is therefore not Lane I's to make.

**8. Not a request, a warning:** `POINTS_MODEL.AP_RATE` is calibrated to
`apValue('hw141_levy_rifle_mk2')` so the reference prices itself at exactly 1. Re-tuning that
pattern's `base` moves the whole audit. The test will say so.
### Lane B — Field generator

Nothing in this lane needs a deploy: `base44/shared/tacticalField.ts` is a pure module and its mirror
`src/lib/tactical/field.js` is a pure module. Three things it CANNOT do for itself, all of them in
`gameEngine`:

- [ ] **Persist the field, do not regenerate it.** `generateField` is deterministic on
      `{ seed, nodeKind, weather, fortBonus, w, h }`, so a re-run with the same arguments is free and
      identical — but a re-run with a CHANGED `fortBonus` (the defender fortifies mid-battle) or a changed
      `weather` repaints the whole board underneath the squads. The generated `field` must be stored on
      `battle.tactical` at creation and persisted through `persistWar()`, never rebuilt per `getState`.
      It is 165 tile objects at 15x11 (up from the old 63-hex `GRID`), so budget for that in the `Game`
      document rather than being surprised by it.
- [ ] **Carry `field.meta` through to the client.** §4's field shape gained
      `meta: { seed, nodeKind, weather, fortBonus, losCap, groundsFighters }` (Lane B amendment). The
      arena reads `meta.losCap` for the sight overlay and `meta.groundsFighters` to grey out the fighter
      orders. `lineOfSight()` reads `meta.losCap` directly and **throws** if `meta` is missing — that is
      deliberate (a silent default would be an invisible rules change), and it is pinned by a test. If a
      serialisation step drops unknown keys, the arena will fail loudly on the first sight check.
- [ ] **Source `nodeKind` and `weather` from the real macro node and the live weather.** The generator
      never throws: an unrecognised `nodeKind` falls back to `'crossroads'` and an unrecognised `weather`
      to `'clear'`. A typo therefore surfaces as a bland board, not as an error — worth one assertion at
      the `createTactical` call site that both strings are in the published vocabularies.

The vocabularies themselves are now published in §4 (`TerrainKey`, `NodeKind`, `WeatherKey`, `Tile`,
`FieldMeta`, `Field`) and are what Lane E's terrain tokens and Lane J's `Suspension.terrain` are keyed to.

#### The `createTactical` call site — the exact argument, and what must be true of it

`createTactical(attackerUnits, defenderUnits, fieldOpts)` builds the field. `fieldOpts` is passed
**straight through** to `generateField` and is exactly:

```ts
{ seed: number, nodeKind: 'city'|'town'|'depot'|'ruin'|'crossroads',
  weather: 'clear'|'rain'|'fog'|'storm'|'snow', fortBonus: number,
  w?: number /* = 15 */, h?: number /* = 11 */ }
```

- [ ] **`seed`** — an integer. It is coerced `>>> 0`, so a float, a negative or a `NaN` still produces a
      board, just not the one anyone intended. Derive it from something already persisted on the battle
      (the battle id, the turn number) so a re-entry into the same battle cannot re-roll the ground.
      **The RNG is derived from every input, not just this field**, so the same numeric seed at a
      different node kind, weather, fortification level or board size is a completely different board.
- [ ] **`nodeKind`** — the macro node's own kind, from `src/lib/macro/graph.js`. **Not** a display label.
- [ ] **`weather`** — the live weather key, from `WEATHER_META` in `src/lib/weather.js`.
- [ ] **`fortBonus`** — the DEFENDER's fortification level. Clamped to `0..3` and floored, so `2.7` is two
      levels of digging, not three, and anything above three buys nothing.
- [ ] **`w` / `h`** — omit them. They exist for tests and are clamped to a `9x7` floor. The engine's
      `GRID = { w: 9, h: 7 }` is Lane C's to move to `FIELD` (15x11); this lane does not pre-empt it.

**Validate `nodeKind` and `weather` at this call site.** The generator never throws — an unrecognised
`nodeKind` silently falls back to `'crossroads'` and an unrecognised `weather` to `'clear'`. That is the
right behaviour for a server that must not 500 mid-battle, but it means a typo or a renamed macro node
surfaces as *a bland board*, never as an error. One assertion here converts a silent content bug into a
loud one.

**The two vocabularies are published in §4** (`NodeKind`, `WeatherKey`) and are checked against the
generator's own tables by `test/tactical-field.test.js`, so the platform side can validate against the
contract document rather than against a hand-copied list.
