# TACTICAL SQUAD PLAN — Set-Piece Engagements v2

Status: **Greenlit 2026-09-01.** Multi-lane build plan for the squad-based tactical combat layer (HoMM × Warhammer 40K × GURPS). This is the contract every lane works from. If a lane needs to change a contract, it edits **this file first** and flags it in its PR.

Read in order: `CLAUDE.md` → `docs/VISION.md` → this file → the lane's owned files.

---

## 0. Where we are (already shipped, do not rebuild)

| Layer | File | State |
| --- | --- | --- |
| Canonical rules | `base44/shared/tactical.ts` | Formation-mass model: `TROOPS`, `ACTIONS`, `SIZE`, `deriveFormation`, `poolCost`, `toRegiments`, `hexDistance` |
| Server state machine | `base44/shared/tacticalEngine.ts` | `createTactical`, `submitFormations`, `autoFormations`, `resolveOrders`, `autoOrders`, `activeFormation`, `battleResult`, `tacticalView`. 9×7 axial hex grid, initiative queue, 20-round limit |
| Engine wiring | `base44/functions/gameEngine/entry.ts` | Actions `battleSetMode {mode}`, `tacticalDeploy {formations}`, `tacticalOrders {formationId, moveTo, action, targetId}`; `runAutoTurns` drives absent staffs; `battleResult` → `finishBattle` → `macroApplyBattleOutcome` |
| Frontend mirror | `src/lib/tactical/data.js` | Mirrors `tactical.ts` + `hexPixel`, `hexCorners`, `dominantTroop` |
| Deployment UI | `src/components/game/tactical/*` | `EngagementStage` (router), `ResolutionElection`, `DeploymentScreen` (drag-and-drop Form 9-D), `FormationSlip`, `FormationStats`, `ReserveRack`, `TroopStack`, `StageFrame` |
| Sprites / FX | `src/components/game/sprites/UnitSprite.jsx`, `src/index.css` (`.cq-tac-*`) | Silhouettes for riflemen, gunners, scouts, crawler, artillery, fighter, gunboat; frame-stepped idle/attack/hit/boom keyframes |

**Correction to `CLAUDE.md`:** backend functions *can* import from `base44/shared/*.ts` (relative `../../shared/x.ts`). The "inline everything" rule applies only to function-to-function imports. All tactical rules live in `base44/shared/` and are imported by `gameEngine`.

---

## 1. Design target

The atomic token on the field becomes a **squad**, not a formation mass.

- **Squad** = N figures of one base type + up to 2 **specialist slots**. Figures are the HP pool (HoMM stack erosion). Effectiveness scales with figures.
- **Army** = the column's roster of squads, built pre-battle from the column's regiments (a regiment = a pool of figures of its type; the commander carves squads from it).
- **Values per squad type:** `melee`, `ranged`, `range` (hexes), `armor`, `speed` (hexes/turn), `morale` (leadership target), `figures` (default squad size), `pts` (W40K-style balance cost), `specials[]` (grenade / smoke / build / etc.).
- **Specialists** (from `ArmyDesign.support` lineage): `medic` (steadier morale, recover 1 figure/turn while unengaged), `signaler` (+initiative, enables coordinated actions), `commissar` (morale floor, never routs, −1 figure on failed test instead), `heavy_gunner` (adds ranged AoE suppress), `sapper` (can build deployables, +AoE vs works).
- **Resolution:** melee vs ranged attack/defense pairs; **range + line-of-sight**; **AoE** (grenades/mortars target a hex, hit radius); **morale test** — GURPS-style roll-under vs squad morale, modified by casualties this turn, flanked, adjacent friendly destroyed, commissar/medic. Fail → `suppressed`; critical fail → `routed` (flees toward own edge, no fire).
- **Field:** procedurally generated from the macro node (`kind`: city / town / depot / ruin / crossroads) + weather + defender `fortBonus`: cover tiles, LOS blockers, elevation, water, pre-built defender works.
- **Deployables** (sapper/pioneer action, 1 turn): `foxhole` (light cover, infantry), `trench` (linear cover, blocks LOS at ground level, slows crossing), `bunker` (heavy cover, 2 turns), `emplacement` (fixes a gunner/artillery squad: −all movement, +range +1, +suppress).
- **Scale:** 8–24 squads per side on a **15×11** grid (up from 9×7). Grand battles stay playable via `autoOrders` for unwatched squads + optional "quick-resolve remainder".
- **Authority model unchanged:** server owns state; client renders + submits orders; `getState` polls at 2.5 s during battle.

## 2. Non-goals (v2 of this layer)

No new macro-map rules. No air/sea theaters. No persistent squad veterancy across battles (regiments still fold back via `toRegiments`). No real-time sync (polling stays). No new npm packages.

---

## 3. Lanes & ownership

Each lane owns exactly the files listed. **A lane never edits another lane's files** — it edits this doc and requests the change. `base44/functions/gameEngine/entry.ts`, `base44/entities/*.jsonc`, and anything requiring a deploy/test against the live backend are **platform-owned** (built in the Base44 chat session, not in worktrees).

### Lane A — Rules core (data + derivations)
Owns: `base44/shared/tactical.ts`, `src/lib/tactical/data.js`, `test/tactical-mirror.test.js`, `docs/COMBAT_DESIGN.md` (§ Tactical squads).
Delivers:
- `SQUAD_TYPES` — `riflemen, assault, gunners, scouts, mortars, pioneers, crawler, artillery, fighter` with the value set in §1. Source regiment via `from` (riflemen-derived: assault, gunners, scouts, mortars, pioneers).
- `SPECIALISTS` — the five in §1 with explicit numeric mods (no prose-only effects).
- `SQUAD_ACTIONS` — `fire, assault (melee), hold, grenade (AoE r1), mortar_barrage (AoE r1, indirect), suppress, smoke, build_<deployable>, rally, entrench`. Each with `requires` (type/specialist), `dmg`, `range` override, `aoe`, `moraleHit`, `noMove`, `turns`.
- `DEPLOYABLES` — `foxhole, trench, bunker, emplacement` with `cover`, `blocksLOS`, `moveCost`, `buildTurns`, `infantryOnly`.
- `deriveSquad(squad)` → `{ figures, melee, ranged, range, armor, speed, morale, initiative, actions[], pts }` applying figure scaling + specialists.
- `poolCost`, `toRegiments` re-based on figures→companies (1 company = 1 squad's default figures; document the ratio).
- **Mirror test** — extend the existing `test/helpers/extract-const.js` pattern: every exported table in `tactical.ts` deep-equals `data.js` (mirror may add UI-only fields `label, short, blurb, desc, icon`).
Acceptance: `npm test` green; `deriveSquad` unit tests for scaling, specialist stacking, action gating.

### Lane B — Field generator
Owns: `base44/shared/tacticalField.ts`, `src/lib/tactical/field.js` (terrain meta + hex helpers moved here from `data.js` — coordinate with Lane A), `test/tactical-field.test.js`.
Delivers:
- `generateField({ seed, nodeKind, weather, fortBonus, w=15, h=11 })` → `{ w, h, tiles: { "q,r": { terrain, cover, elev, blocksLOS, moveCost, work? } }, deploy: { attacker: [...], defender: [...] } }`. Deterministic via `mulberry32` (copy the one in `gameEngine`; do not import it).
- Palettes: `city` (ruins, rubble, streets), `town` (buildings, hedgerows, fields), `depot` (fuel tanks, rail, open ground), `ruin` (craters, precursor walls), `crossroads` (open, light woods, a road). Weather: `fog` shortens LOS, `rain/snow` +moveCost on open ground, `storm` grounds fighters.
- `fortBonus > 0` seeds `trench`/`bunker` works on the defender edge proportional to the bonus.
- `lineOfSight(field, a, b)`, `hexLine`, `hexRange`, `neighbors`, `pathCost` (A* over `moveCost`).
Acceptance: same seed → identical field; deploy zones always free of blockers; every deploy hex reachable from the opposite side; LOS symmetric.

### Lane C — Engine (state machine)
Owns: `base44/shared/tacticalEngine.ts`, `test/tactical-engine.test.js`.
Delivers, **preserving the exported function names and the `runAutoTurns` seam**:
- `createTactical(attackerUnits, defenderUnits, fieldOpts)` builds the field via Lane B and pools via Lane A.
- `submitFormations(t, side, squads[])` → validates squads `{ name, type, figures, specialists[] }` against the pool and `MAX_SQUADS = 24`; places in that side's deploy zone (client may pass preferred `q,r` inside the zone).
- `resolveOrders(t, squadId, moveTo, action, target)` — `target` may be `{ squadId }` or `{ q, r }` (AoE / build). Implements movement cost, LOS + range check, melee vs ranged, armor, cover, AoE, suppression, morale tests, rout movement, deployable construction, figure erosion, medic recovery, commissar floor.
- `autoOrders` upgraded: prefers cover, uses AoE on clustered targets, sappers build when not engaged.
- `battleResult` unchanged signature → `{ attackerWon, attackerUnits, defenderUnits }` (via Lane A `toRegiments`).
- `tacticalView(t, myRole)` → see §4 payload. Includes `field`, `squads`, `fx` (last resolution for animation), `los` for the active squad.
Acceptance: deterministic replay of a scripted 6-turn battle in tests; no order can push a squad into a blocked hex; routed squads never fire; battle always terminates ≤ `ROUND_LIMIT`.

### Lane D — Squad builder (pre-battle + Army Design Bureau)
Owns: `src/components/game/tactical/DeploymentScreen.jsx`, `FormationSlip.jsx`, `FormationStats.jsx`, `ReserveRack.jsx`, `TroopStack.jsx`, new `src/components/game/tactical/squad/*`, `src/pages/ArmyDesigner.jsx`, `src/components/army/*`.
Delivers:
- Deployment screen evolves: reserve rack shows **figures per regiment**; a formation slip becomes a **squad card** — type picker, figure count (bounded by type default ± sapper/commissar rules), two specialist slots (drag specialist chits from a "Staff Pool" rack), `pts` readout, derived stat grid (melee / ranged / range / armor / speed / morale / initiative) in the Service Dossier grid style, action tags.
- Deploy-zone placement: a mini field preview (Lane E's `FieldCanvas` in `placement` mode) where squads are dragged onto deploy hexes.
- Army Design Bureau: `ArmyDesign` templates become **squad templates** (type + specialists + name). Templates appear as one-click presets in the deployment reserve. Entity schema change is platform-owned; lane D codes against §4's `SquadTemplate` shape and stubs with local state until the entity lands.
Acceptance: cannot exceed pool; cannot exceed 24 squads; cannot seal with 0 squads; all copy in Ministry voice; keyboard fallback (+/−) for every drag interaction.

### Lane E — Arena (the field)
Owns: `src/components/game/tactical/arena/*`, `.cq-tac-*` rules in `src/index.css` (append only), `UnitSprite.jsx` additions for `assault, mortars, pioneers`.
Delivers:
- `FieldCanvas` — SVG axial hex grid (pointy-top, `hexPixel`/`hexCorners`), terrain fills from `field.js` tokens, works/deployables glyphs, elevation shading, fog for `fog` weather. Modes: `placement` (Lane D) and `battle`.
- `SquadToken` — `UnitSprite` + figure-count badge (HoMM style) + specialist pips + status lamps (suppressed / routed / entrenched). Uses `cq-tac-idle`, `cq-tac-attack`, `cq-tac-hit`, `cq-tac-boom` driven by `tactical.fx`.
- `OrderPanel` — active squad card, legal moves highlighted on click, action list gated by `actions[]`, target picking (squad or hex for AoE/build), range & LOS overlay, "Runners…" wait state when not my squad.
- `InitiativeRail` — the queue with side colors; `BattleLog` — last 18 lines in mono.
- Grand-scale: pan/zoom on the SVG, "Auto-resolve remainder" button → `tacticalAuto` action (platform-owned; lane E wires the button and disables it until the action exists).
Acceptance: renders a 24v24 field at 60 fps on desktop; all FX are CSS `steps()`/framer-motion, no canvas; mobile: pinch-zoom works, order panel collapses to a bottom sheet.

### Content lanes F–H — deepen & widen the game's catalogs

Content lanes author **data and prose**, never visuals. Every new thing that needs art registers a **placeholder plate** in `src/lib/imageLibrary.js` (`P(key, category, title, desc, prompt, aspect)`) — `url` stays `null`; the Base44 session generates the image and fills `PLATE_URLS`. Components already fall back to icons/text when a plate is `null`, so shipping with placeholders is safe. Rules numbers land in `base44/shared/*.ts` (canonical) with a `src/lib/*.js` mirror; the platform lane wires them into `gameEngine`/`concurrentPlay`. Every content lane appends its additions to `docs/GAME_RULES.md` as a **draft section marked `[PROPOSED — awaiting platform wiring]`** and adds Codex entries in `src/lib/wiki/entries.js`.

Content voice rules: in-world Ministry English; lore consistent with `docs/LORE.md`, `docs/FACTION_ROSTER.md`, `docs/VISION.md` (nomadic keels, the Ground, the Four Departures, the precursor hunt). No real-world nations, brands or people. Every effect is **numeric and machine-readable** — prose describes, numbers decide.

#### Lane F — Units, specialists & upgrades
Owns: the *rows* of `SQUAD_TYPES / SPECIALISTS / UPGRADES` in `base44/shared/tactical.ts` (Lane A owns derivations — F appends rows only), the matching rows in `src/lib/tactical/data.js`, `src/lib/units.js` (new macro unit rows), `src/lib/armyDesign.js`, `docs/GEAR_LIBRARY.md`, `docs/FACTION_ROSTER.md` § unit access, `imageLibrary.js` § units/designs/gear placeholders.
Delivers:
- **Squad roster 9 → 16+**: at minimum `stormtroops, sappers, ski_troops, digger_corps, pilgrim_levy, provost, marksmen, flame_team, autocar_scouts, siege_mortar, land_dreadnought (relic, [III])` — each with the full §4 `SquadType` value set, `pts`, `from` regiment, `tier`, optional `factionLock`/`creedLock`, `blurb`, `doctrineNote`.
- **Specialists 5 → 10**: add `chaplain, cartographer, forward_observer, provost_sergeant, relic_bearer` with numeric mods.
- **Squad upgrade kits** (W40K wargear): `UPGRADES` — `armor_skirts, storm_hoods, wire_spades, sapper_plate, ski_conversions, mine_flails, marksman_pattern, drum_magazines, gas_shells, radio_pack` — each `{ appliesTo, pts, mods, tier, blurb }`, max 2 per squad.
- **Army Design Bureau**: `armyDesign.js` grows `formation/weapon/armor/support` option sets (≥6 each) with modifiers expressed as squad mods, so a saved design = a squad template + kits.
- **Points Audit** in `docs/GEAR_LIBRARY.md`: every `pts` justified against `riflemen ×10 = 100 pts`; no type above 1.6× baseline efficiency.
Acceptance: mirror test green; Points Audit complete; each new type has a `unit_<key>_token` placeholder (vehicles also `unit_<key>_action`); ≥1 Codex entry per type.

#### Lane G — Research, armory & decrees
Owns: `base44/shared/catalog.ts` (NEW — canonical `TECHS`, `ARMORY_ITEMS`, `RELIC_PROJECTS`), `src/lib/doctrine.js`, `src/lib/armory.js`, `docs/TECH_DESIGN.md`, `imageLibrary.js` § doctrine/decrees/relics placeholders, `test/catalog-mirror.test.js`.
Delivers:
- **Doctrine tree 3×3 (9) → 5 branches × 4 tiers (≥20 + capstones)**: the 9 existing keys stay byte-identical in `label/cost/prereq/effect` (live saves reference them). Add branches `signals` (recon, intercept, initiative) and `reclamation` (dig/relic/fragment), a tier-4 capstone per branch, cross-branch prereqs (`prereq: string | string[]`). Effects become a typed `effects[]` (§4) with the human `effect` line kept.
- **Armory 7 → 20+**: ≥6 new modules (laboratory/hangar/aura bays from `GEAR_LIBRARY §2`), ≥6 new decrees (each tagged with an ideology `axis` + `direction`, `VISION §5`), and ≥4 **Relic Projects** (fragment-costed `[II]`/`[III]`: `land_dreadnought`, `lance_carriage`, `the_beacon`, `the_new_ignition`).
- **Creed-locked content**: ≥1 tech and ≥1 decree per Departure (Recall / Finished Ledger / Flight / Discarding) via `creedLock`.
- Cost curve in `TECH_DESIGN.md` (RP per tier, expected unlock turn at 1 RP/round).
Acceptance: existing keys unchanged; catalog mirror test green; every tech has a `tech_<key>` plate and every decree a `decree_<key>` plate; `techsByBranch`/`armoryByKind` signatures unchanged.

#### Lane H — Factions, houses & lore
Owns: `src/lib/presetFactions.js`, `src/lib/lifepath.js` (additions only), `src/lib/pointBuy.js` (new perks only), `src/lib/wiki/entries.js`, `docs/LORE.md`, `docs/FACTION_ROSTER.md`, `docs/HERALD_VOICES.md`, `base44/shared/settlementLore.ts` additions, `imageLibrary.js` § factions/houses/settlements/ideology placeholders, `test/presets.test.js`.
Delivers:
- **Presets 3 → 13**: one playable preset per Great House in `FACTION_ROSTER.md` (10) plus the 3 existing. Each a legal point-buy ledger (`netPoints ≤ 0`, ≤3 liabilities), `traits[]` in the validated effect schema, `npcDispositions`, `lifepathChoices`, `insigniaDescription`, 120–180-word `lore`, plus `uniqueRoster: { squads, upgrades, decree }` and `heraldVoice` referencing Lane F/G keys (H lists any not-yet-merged keys in its PR for reconciliation).
- **Herald voices**: per faction, a `HERALD_VOICES.md` entry (register, catchphrases, 3 sample intercepts per mood) for `npcHerald`.
- **Point-buy**: ≥8 new perks (4 assets / 4 liabilities) tied to nomad-keel play (graze, swath, columns, boarding).
- **Lifepath**: 1 new chapter (`VI — The Standard`) with 4 choices setting the army standard (`std_*` plates) plus a small numeric effect.
- **Settlements**: unique lore + one bespoke crisis/charter hook for each of the 10 named polities in `LORE §6`, as rows in `settlementLore.ts` matching the existing row shape exactly.
- **Codex**: ≥40 new entries across houses, units, techs, objects, places, cross-linked by key.
Acceptance: every preset passes `pointBuy.js` validation in a unit test; no PII anywhere; every house has `house_<key>_crest` + `keel_<key>` plates; `HERALD_VOICES.md` covers all 13 factions.

### Platform lane (Base44 chat session — not a worktree)
Owns: `base44/functions/gameEngine/entry.ts`, `base44/entities/ArmyDesign.jsonc` → `SquadTemplate` shape, `Patch` dispatch record, live `test_backend_function` runs, `docs/GAME_RULES.md`, `docs/ARCHITECTURE.md` catalog rows.
Delivers: `createTactical` call site passes `{ seed, nodeKind, weather, fortBonus }`; `tacticalDeploy` accepts squads; new `tacticalAuto` action (auto-resolve remaining turns for the caller's side); `tacticalView` fields persisted via `persistWar()`; Field Amendment patch note. **For content lanes:** import `base44/shared/catalog.ts` into `gameEngine` + `concurrentPlay` (retiring the inlined duplicates), apply `effects[]` in the engine, enforce `creedLock`/`factionLock`, point `npcHerald` at the `HERALD_VOICES.md` voices, **generate every placeholder plate** registered in `imageLibrary.js` and deliver its URL into `imagePlates.js`, and promote each `[PROPOSED]` `GAME_RULES.md` section to live once wired.

---

## 4. Integration contracts (payload shapes)

All lanes code against these exactly. Change here first.

```ts
// Squad template (ArmyDesign successor; entity + Lane D)
SquadTemplate = { name: string, type: SquadTypeKey, specialists: SpecialistKey[] /* ≤2 */, notes?: string }

// tacticalDeploy body (Lane D → platform → Lane C)
{ action: 'tacticalDeploy', gameId, squads: [{ name, type, figures, specialists: [], at?: { q, r } }] }

// tacticalOrders body (Lane E → platform → Lane C)
{ action: 'tacticalOrders', gameId, squadId, moveTo?: { q, r }, action: SquadActionKey, target?: { squadId } | { q, r } }

// tacticalAuto body (Lane E → platform)
{ action: 'tacticalAuto', gameId }

// getState → battle.tactical (Lane C → Lane D/E)
{
  status: 'deploy' | 'fighting' | 'done', round, roundLimit, myRole: 'attacker' | 'defender' | null,
  deployed: { attacker: bool, defender: bool },
  myPool: { riflemen, crawler, artillery, fighter } | null,        // figures, not companies
  field: { w, h, tiles: { "q,r": { terrain, cover, elev, blocksLOS, moveCost, work? } }, deploy: { attacker: [{q,r}], defender: [{q,r}] } },
  activeId, queue: [squadId],
  squads: [{ id, side, name, type, figures, maxFigures, specialists, q, r,
             status: { suppressed, routed, guard, building?: { work, turnsLeft } },
             melee, ranged, range, armor, speed, morale, initiative, pts,
             actions: [] /* only for mine */, mine: bool }],
  los: [{ q, r }] /* hexes visible to the active squad, only when mine */,
  log: string[], fx: { seq, round, actorId, action, targetId?, at?: {q,r}, dealt, taken, moraleResult?: 'held'|'suppressed'|'routed', moved, from } | null
}

// battleResult (Lane C → platform, unchanged)
{ attackerWon: bool, attackerUnits: Regiments, defenderUnits: Regiments }

// ---- Content contracts (Lanes F/G/H) ----
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, melee, ranged, range, armor, speed, morale, pts, specials: string[], factionLock?: string, creedLock?: string, blurb, doctrineNote }
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed? }, blurb }
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
Tech       = { key, branch, tier: 1|2|3|4, label, cost, prereq: string|string[]|null, creedLock?, effect: string, effects: [{ scope: 'macro'|'tactical'|'economy', key: string, value: number }], desc }
ArmoryItem = { key, kind: 'module'|'decree'|'relic_project', label, cost: { steel?, manpower?, fuel?, fragments?: { cache?, engine?, cipher?, wake? } }, tier, axis?: 'authority'|'economy'|'creed'|'mobilization', direction?: -1|1, creedLock?, effects: Tech['effects'], desc }
Preset     = existing PRESET_FACTIONS row + { house: string, uniqueRoster: { squads: SquadTypeKey[], upgrades: UpgradeKey[], decree: ArmoryKey }, heraldVoice: string }
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)  // url always null from a lane
```

Effect `key` vocabulary (the engine applies these; add new keys here before using them): `unit.<type>.attack|defense|melee|ranged|armor|speed|morale`, `income.<steel|fuel|manpower>`, `armyCap`, `supplyRange`, `capitalDefense`, `initiative`, `losRange`, `digSpeed`, `fragmentYield`, `moraleTest`, `buildTurns`.

Regiments ↔ figures: `1 company = FIGURES_PER_COMPANY` (Lane A sets; default 10 for infantry-derived, 1 for crawler/artillery/fighter — vehicles are single-figure squads). `toRegiments` rounds **down** so battles never create companies.

---

## 5. Phases & merge order

| Phase | Lanes | Definition of done |
| --- | --- | --- |
| **P1 — Contracts** | A, B (types + generator + tests) | `tactical.ts` and `tacticalField.ts` merged; mirror + field tests green; this doc updated with any numeric changes |
| **P2 — Engine** | C (against P1) | Scripted-battle test green; `battleResult` still satisfies `gameEngine`'s `runAutoTurns` |
| **P3 — Platform wiring** | Platform | `createTactical` field opts, squads deploy, `tacticalAuto`, live test of a full NPC-defended battle via `test_backend_function` |
| **P4 — UI** | D, E in parallel (against P1 shapes; E stubs `fx`) | Deployment + arena render against a recorded `getState` fixture in `test/fixtures/tactical-state.json` |
| **P5 — Ship** | Platform | Patch dispatch filed; `docs/GAME_RULES.md` § Set-Piece Engagements; `docs/ARCHITECTURE.md` action rows |
| **C1 — Catalog contracts** | F, G (parallel with P1) | Squad/specialist/upgrade rows and `catalog.ts` merged; mirror tests green; placeholder plates registered; `[PROPOSED]` rules drafted |
| **C2 — Factions & lore** | H (after C1) | 13 presets pass validation; herald voices, codex, settlements, lifepath chapter merged |
| **C3 — Platform content wiring** | Platform | Catalogs imported into the engine, `effects[]` applied, locks enforced, plates generated & delivered, `[PROPOSED]` promoted, patch dispatch |

Merge order is strict: A/B → C → platform → D/E. D and E may open PRs early but rebase on P3. Content runs on its own track: F/G → H → platform (C3); F **must** land before D (the squad builder renders F's rows).

---

## 6. Drift guards (mandatory in every lane PR)

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it. UI-only fields are allowlisted in the test.
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations, autoFormations, autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported (rename internally, re-export aliases if needed). `gameEngine` imports exactly these.
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind classes must be literal strings.
5. **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only.
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from `data.js`, never retyped.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and flags `docs/GAME_RULES.md` for the platform lane.
10. **Content lanes never ship visuals** — no image files, no SVG art, no `PLATE_URLS` entries, no `UnitSprite.jsx` edits. Art is requested only as `imageLibrary.js` placeholders with `url: null`. Existing catalog keys are never renamed or removed (live saves reference them). Every new mechanical effect uses the §4 effect-key vocabulary or extends it in the same PR.

## 7. Worktree & git protocol

- Repository: `https://github.com/blae-code/rust-legions` — integration branch `main`, two-way synced with the Base44 Builder (a merge to `main` reaches the live app's builder; a red merge breaks the live preview).
- One worktree per lane: `scripts/agent-worktree.sh tactical-<lane>` → branch `feat/tactical-<lane>`.
- Lane agents read: `CLAUDE.md`, `docs/VISION.md`, this file, their owned files, and `test/helpers/*`. Nothing else is required context.
- Lane branches push to `origin/feat/tactical-<lane>` and open a PR against `main`. PR title: `tactical(<lane>): <summary>`; body lists contract sections touched and test names added.
- The orchestrator merges in the §5 order, re-running `npm test` after each merge, and stops on the first red.
- Anything needing the live backend (entity writes, function deploy, `Patch` records) is handed back to the Base44 chat session as a checklist, not attempted from a worktree.