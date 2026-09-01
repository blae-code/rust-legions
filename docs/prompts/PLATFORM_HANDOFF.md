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

**7. Not a request, a warning:** `POINTS_MODEL.AP_RATE` is calibrated to
`apValue('hw141_levy_rifle_mk2')` so the reference prices itself at exactly 1. Re-tuning that
pattern's `base` moves the whole audit. The test will say so.
