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
