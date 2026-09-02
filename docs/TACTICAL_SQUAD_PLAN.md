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
| Frontend mirror | `src/lib/tactical/data.js` | Mirrors `tactical.ts` + `hexPixel`, `hexCorners`, `dominantTroop`. **Q6 note:** `hexPixel`/`hexCorners` move to `src/lib/tactical/field.js` when Lane B merges; `data.js` keeps re-exporting them so no consumer's import path breaks. |
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
Owns: the *rows* of `SQUAD_TYPES / SPECIALISTS / UPGRADES` in `base44/shared/tactical.ts` (Lane A owns derivations — F appends rows only), the matching rows in `src/lib/tactical/data.js`, `src/lib/units.js` (new macro unit rows), `src/lib/armyDesign.js`, `docs/GEAR_LIBRARY.md`, `docs/FACTION_ROSTER.md` § unit access, `imageLibrary.js` § units/designs/gear placeholders, `test/gear-points-audit.test.js` *(NEW — see AMENDMENT below)*.

> **AMENDMENT 2026-09-01 (Lane F, Amendment 1).** The **WAVE 3 ADDENDUM** requires that Lane F's Points Audit be *"computed from `SQUAD_TYPES`"* and that the lane *"add a test that recomputes it from the table so it cannot rot"*. Lane F's brief, written before that addendum, says **"No new test files"** and directs the lane to request one in its PR body instead. The addendum is newer and authoritative, so the test exists; the question the addendum did not settle is **which file it goes in**. Editing Lane A's `test/tactical-mirror.test.js` would put two lanes' hands on one file in one wave and collide on rebase — the collision §3 exists to prevent — so Lane F wrote a **new** file, `test/gear-points-audit.test.js`, which duplicates no assertion in the mirror suite: it reads *documents* (`docs/GEAR_LIBRARY.md` §11, `docs/FACTION_ROSTER.md` §5, `docs/GAME_RULES.md`) and rebuilds every published figure from the tables, which no other suite does. `test/**` is assigned to no lane, so Lane F claims this path explicitly — the same move Lane G's Amendment 3 makes for `test/rules-mirror.test.js`. **This amendment is the record of that claim.** Lane F's acceptance check A17 (`git diff --name-only origin/main` lists only the nine Owned paths) is therefore satisfied by **eleven** paths: the nine, plus this test file, plus `docs/prompts/PLATFORM_HANDOFF.md` (already sanctioned by amendment Q8).
Delivers:
- **Squad roster 9 → 16+**: at minimum `stormtroops, sappers, ski_troops, digger_corps, pilgrim_levy, provost, marksmen, flame_team, autocar_scouts, siege_mortar, land_dreadnought (relic, [III])` — each with the full §4 `SquadType` value set, `pts`, `from` regiment, `tier`, optional `factionLock`/`creedLock`, `blurb`, `doctrineNote`.
- **Specialists 5 → 10**: add `chaplain, cartographer, forward_observer, provost_sergeant, relic_bearer` with numeric mods.
- **Squad upgrade kits** (W40K wargear): `UPGRADES` — `armor_skirts, storm_hoods, wire_spades, sapper_plate, ski_conversions, mine_flails, marksman_pattern, drum_magazines, gas_shells, radio_pack` — each `{ appliesTo, pts, mods, tier, blurb }`, max 2 per squad.
- **Army Design Bureau**: `armyDesign.js` grows `formation/weapon/armor/support` option sets (≥6 each) with modifiers expressed as squad mods, so a saved design = a squad template + kits.
- **Points Audit** in `docs/GEAR_LIBRARY.md`: every `pts` justified against `riflemen ×10 = 100 pts`; no type above 1.6× baseline efficiency.
Acceptance: mirror test green; Points Audit complete; each new type has a `unit_<key>_token` placeholder (vehicles also `unit_<key>_action`); ≥1 Codex entry per type.

#### Lane G — Research, armory & decrees
Owns: `base44/shared/catalog.ts` (NEW — canonical `TECHS`, `CREEDS`, `ARMORY_ITEMS`, `RELIC_PROJECTS`), `src/lib/doctrine.js`, `src/lib/armory.js`, `docs/TECH_DESIGN.md`, `imageLibrary.js` § doctrine/decrees/relics placeholders, `test/catalog-mirror.test.js`, `test/rules-mirror.test.js` *(legacy-scope narrowing only — see AMENDMENT below)*.

> **AMENDMENT 2026-09-01 (Lane G, Amendment 3).** `test/rules-mirror.test.js` asserts that `gameEngine.TECHS`, `concurrentPlay.TECHS` and `src/lib/doctrine.js` declare an **identical** key set, and likewise for `concurrentPlay.ARMORY` ↔ `src/lib/armory.js`. Growing the frontend mirrors before the platform lane imports `catalog.ts` (phase C3) makes those two assertions red by construction. The file is assigned to no lane, so Lane G claims it explicitly and narrows exactly two `it(...)` bodies to a superset check, leaving the per-key field-by-field loops untouched. Equality returns at C3.
Delivers:
- **Doctrine tree 3×3 (9) → 5 branches × 4 tiers (≥20 + capstones)**: the 9 existing keys stay byte-identical in `label/cost/prereq/effect` (live saves reference them). Add branches `signals` (recon, intercept, initiative) and `reclamation` (dig/relic/fragment), a tier-4 capstone per branch, cross-branch prereqs (`prereq: string | string[]`). Effects become a typed `effects[]` (§4) with the human `effect` line kept.
- **Armory 7 → 20+**: ≥6 new modules (laboratory/hangar/aura bays from `GEAR_LIBRARY §2`), ≥6 new decrees (each tagged with an ideology `axis` + `direction`, `VISION §6.1`), and ≥4 **Relic Projects** (fragment-costed `[II]`/`[III]`: `land_dreadnought`, `lance_carriage`, `the_beacon`, `the_new_ignition`).
- **Creed-locked content**: ≥1 tech and ≥1 decree per Departure (Recall / Finished Ledger / Flight / Discarding) via `creedLock`.
- Cost curve in `TECH_DESIGN.md` (RP per tier, expected unlock turn at 1 RP/round).
Acceptance: existing keys unchanged; catalog mirror test green; every tech has a `tech_<key>` plate and every decree a `decree_<key>` plate; `techsByBranch`/`armoryByKind` signatures unchanged.

#### Lane H — Factions, houses & lore
Owns: `src/lib/presetFactions.js`, `src/lib/lifepath.js` (additions only), `src/lib/pointBuy.js` (new perks only), `base44/shared/perkMods.ts` (new `PERK_MODS` rows only — AMENDMENT 2026-09-02, Lane H: `test/rules-mirror.test.js` asserts `Object.keys(PERK_MODS)` equals `PERKS.map(p => p.id)`, so the eight new perks cannot be added to `pointBuy.js` alone without turning `npm test` red; no other lane owns this file, so there is no collision), `src/lib/wiki/entries.js`, `docs/LORE.md`, `docs/FACTION_ROSTER.md`, `docs/HERALD_VOICES.md`, `base44/shared/settlementLore.ts` additions, `imageLibrary.js` § factions/houses/settlements/ideology placeholders, `test/presets.test.js`.
Delivers:
- **Presets 3 → 13**: one playable preset per Great House in `FACTION_ROSTER.md` (10) plus the 3 existing. Each a legal point-buy ledger (`netPoints ≤ 0`, ≤3 liabilities), `traits[]` in the validated effect schema, `npcDispositions`, `lifepathChoices`, `insigniaDescription`, 120–180-word `lore`, plus `uniqueRoster: { squads, upgrades, decree, patterns }` (AMENDMENT 2026-09-01, Q3 — §4 governs; `patterns` was missing here) and `heraldVoice` referencing Lane F/G keys (H lists any not-yet-merged keys in its PR for reconciliation).
- **Herald voices**: per faction, a `HERALD_VOICES.md` entry (register, catchphrases, 3 sample intercepts per mood) for `npcHerald`.
- **Point-buy**: ≥8 new perks (4 assets / 4 liabilities) tied to nomad-keel play (graze, swath, columns, boarding).
- **Lifepath**: 1 new chapter (`VI — The Standard`) with 4 choices setting the army standard (`std_*` plates) plus a small numeric effect.
- **Settlements**: unique lore + one bespoke crisis/charter hook for each of the 10 named polities in `LORE §6`, as rows in `settlementLore.ts` matching the existing row shape exactly.
- **Codex**: ≥40 new entries across houses, units, techs, objects, places, cross-linked by key.
Acceptance: every preset passes `pointBuy.js` validation in a unit test; no PII anywhere; every house has `house_<key>_crest` + `keel_<key>` plates; `HERALD_VOICES.md` covers all 13 factions.

#### Lane I — The Arms Catalogue (granular weapons, calibres, makers, quality & mods)
"Rifles" is a *class*, not a weapon. Squads carry **named weapon patterns** from fictional manufacturers, in specific calibres, at a rolled **quality grade**, with slot-based **modifications** and named **quirks** — Enlisted-style specificity with Borderlands-style variety, but every roll is server-seeded and every effect numeric.
Owns: `base44/shared/arms.ts` (NEW — canonical), `src/lib/arms.js` (mirror), `docs/ARMS_CATALOGUE.md` (NEW), `test/arms-mirror.test.js`, `test/arms-roll.test.js`, `imageLibrary.js` § `arms` placeholders (add category `arms`: "The Arms Catalogue — weapon patterns, maker's marks and mod kits").
Delivers:
- **Manufacturers (≥8)**: fictional works/guilds/armouries, each tied to a Great House or settlement culture from `LORE`/`FACTION_ROSTER` (a Hundredweight combine works, an Emberwright Union guild shop, a Salvage Court prize-refit yard, a Ferrymen shrine-armoury, a Crossloom trade pattern-house…). Each `Manufacturer` has a **house signature** — a consistent stat lean applied to everything it makes — name-stems for pattern names, a maker's-mark plate, and 60–100 words of lore. Faction access per maker: `native` / `licensed` / `captured` (cost ×1.0 / ×1.25 / ×1.5).
- **Calibres (≥10)**: pistol, carbine, rifle, heavy-rifle, machine-gun, shotgun bore, mortar bores, crawler gun bores, artillery shell weights, flame fuel grades — each with numeric `damage/armorPen/range/weight`, a `logisticsClass` (which regiment stock feeds it), and lore on who standardised it (the existing `standardized_calibers` tech should reference these).
- **Weapon patterns (≥40 hand-authored)**: rifles, carbines, sidearms, SMGs, LMGs/HMGs, trench guns, marksman rifles, anti-armor rifles, flame projectors, mortars, crawler main guns, artillery pieces, aircraft guns. In-world nomenclature: pattern year + maker + mark ("Hundredweight 141 Levy Rifle, Mk II"). Each has `base` stats, mod `slots`, innate `quirks`, `pts`, `appliesTo` squad types, `tier`.
- **Quality grades (5)**: `scrap, issue, proofed, master, relic` — multipliers, `ptsMult`, roll weights. Lanes reference `qualityKey` only; the grade's colour/visual is the Base44 session's.
- **Modifications (≥25)** by slot (`barrel, optic, magazine, stock, muzzle, bayonet, ammunition, mount`) — every mod has a numeric **tradeoff** (bipod: accuracy up, speed down; drum magazine: rate of fire up, reliability down; hollow-base rounds: damage up, armorPen down).
- **Quirks (≥20)**: named characteristics with numeric hooks and a machine-evaluable `condition` — e.g. *Cold-Forged* (reliability +0.1 in snow), *Ferryman's Blessing* (morale +1 adjacent to a relic_bearer), *Runs Hot* (rateOfFire +0.15, reliability −0.1 after 2 consecutive fire orders), *Prize-Taken* (+1 morale when fielded against the maker's native house).
- **`rollWeapon({ seed, class, maker?, calibre?, tierCap, luck })`** → deterministic `WeaponInstance` (pattern, quality, mods, quirks, serial) via the shared `mulberry32`. Odds tables live in `ARMS_CATALOGUE.md`. Battle loot, dig finds and armory certifications call this — Lane I supplies the function; the platform lane decides when it fires.
- **`deriveLoadout(squad)`** — the squad's `Loadout` (primary / support / sidearm instances) reduces to `SquadType`-shaped mods that Lane A's `deriveSquad` consumes, so the tactical engine never inspects individual weapons. Reduction formula documented (e.g. `ranged = Σ damage×rateOfFire×accuracy ÷ figures`; `reliability` → misfire chance per fire order; `weight` → speed drag).
- **Universal Damage Model** (owned by Lane I, consumed by A/C/J): every weapon — small arm, crawler gun, artillery piece, aircraft gun — carries `armorPen`, a `damageType` (`kinetic | explosive | shaped | incendiary | fragmentation | concussive | chemical`) and an `aoe` (`{ radius (hexes), falloff }`, `null` for point fire). Every target — figure, squad stand, vehicle facing, fortification — carries an `ArmourClass` (`none | soft | light | medium | heavy | superheavy | fortified`) with a numeric `armourValue`. Damage resolves through a **penetration table**: `armorPen − armourValue` maps to an effectiveness multiplier that reaches **0 for light weapons against heavy/superheavy armour** (a rifle squad cannot scratch a heavy crawler; it may still suppress or pin its crew). A **type-vs-armour matrix** scales further (shaped charges excel against heavy plate but waste against soft targets; incendiary ignores plate but is stopped by sealed hulls; fragmentation shreds `soft` and is spent on `light`+; concussive stuns crews). AoE fires against every stand within `radius`, falling off by `falloff` per hex, and rolls against each victim's own armour class. Tables live in `ARMS_CATALOGUE.md` and `arms.ts` (`ARMOUR_CLASSES`, `PEN_TABLE`, `TYPE_MATRIX`, `resolveHit`) and are the only place armour math is defined — Lane A imports them.
- **Points Audit**: every pattern at `issue` grade priced against the reference `141 Levy Rifle = 1 pt/figure`; no pattern > 1.6× baseline efficiency at `issue`; anti-armour value is priced separately from anti-personnel value so a heavy AT rifle is not "free" against infantry.
Acceptance: mirror + roll tests green (same seed → identical instance; 10 000 rolls match the quality distribution within 2%); every pattern has an `arms_<key>` plate, every maker a `maker_<key>` plate, every mod a `mod_kit_<key>` plate; `deriveLoadout` output keys ⊆ §4 `SquadType` value keys; Codex entries for every maker and calibre; no `Math.random` anywhere in the lane.

#### Lane J — The Motor Pool (granular mechanized kit & customisation)
A "crawler" is a *chassis class*, not a vehicle. Mechanized stands are **named chassis patterns** from the same fictional manufacturers (Lane J appends motor-works to Lane I's `MANUFACTURERS`, keys `mw_*`, rather than duplicating the table), fitted with a powerplant, an armour package, a suspension, a turret or fixed mount, hardpoint weapons drawn from Lane I's `WEAPON_PATTERNS` (`crawler_gun`, `hmg`, `flame`, `mortar`, `artillery`, `aircraft_gun` classes), and rolled quirks — Enlisted-style vehicle kit with the same quality grades and seeded rolls as small arms.
Owns: `base44/shared/motorPool.ts` (NEW — canonical), `src/lib/motorPool.js` (mirror), `docs/MOTOR_POOL.md` (NEW), `test/motor-mirror.test.js`, `test/motor-roll.test.js`, `imageLibrary.js` § `motor` placeholders (category `motor`: "The Motor Pool — chassis patterns, powerplants and refit kits").
Delivers:
- **Chassis patterns (≥18)**: light scout crawlers, medium line crawlers, heavy breakthrough crawlers, superheavy land-forts, half-tracks, armoured cars, self-propelled guns, tractor-drawn artillery, gunboats, fighters, bombers — each with tonnage, crew, hardpoints, per-facing base `ArmourClass` (front/side/rear/top), slots, innate quirks, `pts`. Nomenclature as Lane I ("Grimwold 138 Breaker, Mk III").
- **Powerplants (≥8)**: diesel, gas-turbine, steam-flash boiler, relic-cell, alcohol burner… — `hp, weight, reliability, fuelClass, heat`. Speed = f(hp ÷ tonnage) via a documented curve.
- **Armour packages (≥10)**: rolled plate, cast, face-hardened, spaced, bolted salvage, sandbag stowage, relic-alloy — each upgrades per-facing `ArmourClass` with a `weight/cost/reliability` tradeoff; a heavy package can push a medium chassis into `heavy` at the price of speed and powerplant strain.
- **Suspension / drive (≥6)**: tracks, half-track, wheels, walker-legs, screw-drive, hover-skirt (relic) — terrain modifiers per `TERRAIN` key, weight, reliability.
- **Turrets & mounts (≥8)**: fixed casemate, open ring, enclosed turret, twin mount, sponson pair, howitzer cradle — govern how many hardpoint weapons fit, arc of fire, and crew exposure (the gun crew's own `ArmourClass`).
- **Vehicle modifications (≥25)** by `VehicleSlot` (`engine, armour, suspension, turret, hardpoint, optics, radio, stowage, crew_kit`) — every mod has a numeric `tradeoff` (extra plate slows; long-barrel gun cuts turret traverse; smoke dischargers cost a hardpoint).
- **Vehicle quirks (≥15)** with machine-evaluable `condition`s (*Hand-Fitted Gearbox*: reliability +0.1 while not at full pace; *Prize Hull*: morale +1 for the captor's house; *Boiler-Shy*: reliability −0.15 in rain).
- **`rollVehicle({ seed, class, maker?, tierCap, luck })`** → deterministic `VehicleInstance` (chassis, quality, powerplant, armour package, suspension, mount, hardpoints as `WeaponInstance[]`, mods, quirks, serial). Same odds discipline as Lane I.
- **`deriveMechanized(stand)`** → `SquadType`-shaped values (speed, ranged/melee/pen from hardpoints, crew morale, reliability → breakdown chance) **plus `facings`**, so the engine treats a crawler as a stand with facings, never as a bag of parts. The engine applies the attacker's `armorPen` against the **struck facing** (Lane A/C rule: rear = attacker behind the stand's facing hex).
- **Points Audit**: every chassis at `issue` grade with issue powerplant and no package priced against `Hundredweight 141 Line Crawler = 12 pts`.
Acceptance: mirror + roll tests green (same seed → identical vehicle; 10 000 rolls within 2% of the grade table); every chassis has a `chassis_<key>` plate, every powerplant a `plant_<key>` plate, every armour package / mod a `refit_<key>` plate; `deriveMechanized` output keys ⊆ §4 `SquadType` value keys ∪ `{facings}`; every hardpoint weapon key exists in Lane I's `WEAPON_PATTERNS`; Codex entries for every motor-works and chassis class; no `Math.random`; no armour arithmetic outside `arms.ts`.

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
{ action: 'tacticalOrders', gameId, squadId, moveTo?: { q, r }, orderAction: SquadActionKey, target?: { squadId } | { q, r } }
// AMENDMENT 2026-09-01 (orchestrator, Q1): the squad's action key is `orderAction`. The envelope key
// `action` stays the gameEngine dispatch verb, as in every other action body. gameEngine must read
// body.orderAction (platform handoff). No lane may re-file this amendment.

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
// AMENDMENT 2026-09-01 (Lane C, Amendment C1): four ADDED optional/derived keys. Nothing is removed
// or renamed, so every consumer written against the list above still resolves.
//   1. `field` gains `meta: FieldMeta` (the fifth key), because Lane B's lineOfSight() reads
//      `meta.losCap` and THROWS without it — a client that renders sight lines or reports the weather
//      cannot be handed a field with meta stripped, and a silent default would be an invisible rules
//      change. Required by the Wave 3 addendum, item 3. `field` is therefore { w, h, tiles, deploy, meta }.
//   2. each `squads[]` row gains `facing: 0..5` — an index into HEX_DIRECTIONS, the way the stand is
//      pointed. It is set at deployment (toward the enemy line) and updated on every move and every
//      shot. Present on EVERY row, not only mechanized ones, so the row's key set does not vary by
//      stand; it is what selects front/side/rear on a stand that carries `facings`, and decoration on
//      one that does not. Lane E draws it.
//   3. each `squads[]` row gains `armour: ArmourClassKey` — the class a hit resolves against. §4 already
//      said "Every stand row gains `armour: ArmourClassKey`" for the data model and the VIEW row did not
//      carry it. For a mechanized stand this reports the FRONT facing; the other three are server state
//      and are selected by struckFacing at resolution time.
//   Rows are therefore 22 keys and `status` is unchanged at 3 + optional `building`.
//   4. `orderAction` additionally accepts the ENGINE order `'march'` — an activation spent moving only.
//      It is deliberately NOT a SQUAD_ACTIONS row: every order in Lane A's table either fires, builds,
//      or carries noMove:true (`hold`, `rally`, `entrench` all stand fast), so a stand that only wants
//      to close the ground has no content key to be given, and adding one would make Lane F price a
//      verb that does nothing. A null or absent `orderAction` with a `moveTo` is read as a march.
//      It is reported back on `fx.action` as the string 'march'.
//
// AMENDMENT 2026-09-01 (Lane C, Amendment C2): two further ADDED keys, both required by the operator's
// step-3 instruction that `test/fixtures/tactical-state.json` "must carry field.meta and a relicProject
// slot" and "must include a hit that selected a FACING", the second qualified as otherwise "untested and
// UNRENDERABLE". Nothing is removed or renamed.
//   5. the top level gains `relicProject: { attacker, defender }` — the per-faction slot the Wave 3
//      addendum (item 7) requires be cut now so it is not re-cut later. **This SUPERSEDES Amendment C1's
//      note, which put the slot on the engine state and out of the view.** The reason C1 gave — "nothing
//      to render" — was answered by the wrong question. The fixture IS this payload byte for byte and is
//      the only description of the battle Lanes D and E have, so a slot the server holds and the payload
//      does not is one they must re-cut the day boarding assaults fill it; and a fixture carrying a key
//      `tacticalView` does not emit would be a fixture that lies about the contract it exists to pin.
//      It is `{ attacker: null, defender: null }` on every board today. Nothing reads or writes it until
//      boarding assaults land as a Field Amendment. Operator ruling recorded with it: on capture the
//      captor loots the project's unspent MATERIALS only; the project, its progress and its housed-Object
//      requirement are lost with the keel. **The top level is therefore 14 keys.**
//   6. `fx` gains optional `facing: 'front'|'side'|'rear'|'top'` — the plate the shot landed on, present
//      only when the struck stand carried `facings`. The engine cannot resolve a hit on a hull WITHOUT
//      selecting a plate (drift guard 12, and the Wave 3 addendum item 5), and before this the selection
//      reached the client only as an English phrase inside a log line. Lane E draws the strike on the
//      plate; an infantry stand has one armour class and no plate to name, so the key is absent on its
//      hits. **`fx` is therefore 8 always-present keys + 4 optional (`targetId`, `at`, `moraleResult`,
//      `facing`).**

// battleResult (Lane C → platform, unchanged)
{ attackerWon: bool, attackerUnits: Regiments, defenderUnits: Regiments }

// ---- Content contracts (Lanes F/G/H) ----
SquadType  = { key, label, short, from: RegimentKey, tier: 'I'|'II:Cache'|'II:Eng'|'II:Ciph'|'II:Wake'|'III', figures, minFigures, maxFigures, melee, ranged, range, armor, speed, morale, pts, specials: string[], armour: ArmourClassKey, damageType: DamageType, armorPen: number, factionLock?: string, creedLock?: string, blurb, doctrineNote }
// AMENDMENT 2026-09-01 (Lane A, Amendment A1): SquadType gains `minFigures`/`maxFigures` (the bounds a
// commander may carve a squad to) and the three arms-facing fields `armour`/`damageType`/`armorPen` — the
// squad's pre-loadout defaults, overridden by deriveLoadout/loadoutProfile output when a loadout is carried.
// `armor` is a NUMBER (the resilience the melee/ranged contest pairs against); `armour` is an ArmourClass
// KEY and the only armour concept Lane A may hold. All 21 fields are required on every row.
Specialist = { key, label, pts, mods: { morale?, initiative?, recoverPerTurn?, moraleFloor?, aoeSuppress?, buildSpeed?, executionToll? }, blurb }
// AMENDMENT 2026-09-01 (Lane A, Amendment A2): `executionToll` joins the mods vocabulary — the figures a
// squad loses INSTEAD of routing on a failed morale test (the commissar effect, section 1, as a number).
Upgrade    = { key, label, appliesTo: SquadTypeKey[], pts, tier, mods: Partial<SquadType values>, blurb }
Tech       = { key, branch, tier: 1|2|3|4, label, cost, prereq: string|string[]|null, creedLock?, effect: string, effects: [{ scope: 'macro'|'tactical'|'economy', key: string, value: number }], desc }
ArmoryItem = { key, kind: 'module'|'decree'|'relic_project', label, cost: { steel?, manpower?, fuel?, fragments?: { cache?, engine?, cipher?, wake? } }, tier, axis?: 'authority'|'economy'|'creed'|'mobilization', direction?: -1|1, creedLock?, effects: Tech['effects'], desc }
RelicProject = { key, label, objectClass: 'engine'|'cache'|'cipher'|'wake', prereq: string|string[]|null, buildDays: number, cost: ArmoryItem['cost'], creedLock?, effects: Tech['effects'], desc }
// AMENDMENT 2026-09-01 (Lane G, Amendment 1): §3 Lane G requires RELIC_PROJECTS but §4 defined no
// shape for it, and no shape at all for the creed vocabulary that Tech.creedLock / ArmoryItem.creedLock
// already referenced. Both are added here.
// Every RelicProject key also has an ARMORY_ITEMS row with the same key and kind 'relic_project'
Creed      = { key: 'recall'|'finished_ledger'|'flight'|'discarding', label, axisLean: -1|0|1, blurb }
// Tech.creedLock and ArmoryItem.creedLock take a Creed key
Preset     = existing PRESET_FACTIONS row + { house: string, uniqueRoster: { squads: SquadTypeKey[], upgrades: UpgradeKey[], decree: ArmoryKey, patterns: WeaponPatternKey[] }, heraldVoice: string }
// AMENDMENT 2026-09-01 (orchestrator, Q3b): NO `keel` field is added. §3 Lane H's required
// `keel_<key>` plate is keyed off the existing `house` value (`keel_<houseKey>`), so the row needs
// nothing new. Lane H must not file an amendment adding one.

// ---- Arms Catalogue (Lane I) ----
WeaponBase     = { accuracy, rateOfFire, damage, armorPen, range, reliability, weight, damageType: DamageType, aoe: { radius, falloff } | null }
DamageType     = 'kinetic'|'explosive'|'shaped'|'incendiary'|'fragmentation'|'concussive'|'chemical'
ArmourClassKey = 'none'|'soft'|'light'|'medium'|'heavy'|'superheavy'|'fortified'
ArmourClass    = { key: ArmourClassKey, armourValue: number, sealed: boolean, blurb }
PEN_TABLE      = Array<{ minDelta: number, mult: number }>      // armorPen − armourValue → effectiveness; a mult 0 row is mandatory
TYPE_MATRIX    = { [DamageType]: { [ArmourClassKey]: number } } // damage-type vs armour-class multiplier
// resolveHit({ weapon: WeaponBase, target: ArmourClass }) → { effective: number, suppressOnly: boolean } — the only armour math; Lane A imports it
WeaponClass    = 'sidearm'|'carbine'|'rifle'|'smg'|'lmg'|'hmg'|'shotgun'|'marksman'|'anti_armor'|'flame'|'mortar'|'crawler_gun'|'artillery'|'aircraft_gun'
ModSlot        = 'barrel'|'optic'|'magazine'|'stock'|'muzzle'|'bayonet'|'ammunition'|'mount'
Manufacturer   = { key, label, houseKey?: string, culture?: string, signature: Partial<WeaponBase>, nameStems: string[], access: { [houseKey]: 'native'|'licensed'|'captured' }, lore }
Calibre        = { key, label, class: WeaponClass, damage, armorPen, range, weight, logisticsClass: RegimentKey, lore }
WeaponPattern  = { key, label, maker: ManufacturerKey, calibre: CalibreKey, class: WeaponClass, tier, base: WeaponBase, slots: ModSlot[], quirks: QuirkKey[], pts, appliesTo: SquadTypeKey[], blurb }
Modification   = { key, label, slot: ModSlot, appliesTo: WeaponClass[], pts, mods: Partial<WeaponBase>, tradeoff: Partial<WeaponBase>, blurb }
Quirk          = { key, label, mods: Partial<WeaponBase> | { morale?, initiative? }, condition?: { key: string, value?: any }, blurb }
QualityGrade   = { key: 'scrap'|'issue'|'proofed'|'master'|'relic', mult: Partial<WeaponBase>, ptsMult, rollWeight }
WeaponInstance = { patternKey, quality: QualityKey, mods: ModKey[], quirks: QuirkKey[], serial: string }
Loadout        = { primary: WeaponInstance, support?: WeaponInstance, sidearm?: WeaponInstance }
// Squad rows gain `loadout?: Loadout`; deriveLoadout(squad) → Partial<SquadType values>, consumed by deriveSquad
// Every stand row gains `armour: ArmourClassKey` (infantry: none/soft/light via upgrade kits; vehicles: per facing, see below)
// resolveAoe({ weapon: WeaponBase, victims: [{ target: ArmourClass, dist }] }) → [{ effective, suppressOnly }] — calls resolveHit per victim, per-hex falloff
// resolveWeapon(instance: WeaponInstance, ctx) → WeaponBase — pattern → maker signature → quality → mods → active quirks → clamp
// loadoutProfile(squad) → { armorPen, damageType, aoe, misfire } — the squad's damage profile; Lane A/C feeds this to resolveHit
// evaluateQuirk(quirk, ctx) → boolean — the machine evaluation of Quirk.condition (vocabulary: QUIRK_CONDITION_KEYS)

// ---- Motor Pool (Lane J) ----
VehicleClass    = 'scout_crawler'|'line_crawler'|'heavy_crawler'|'land_fort'|'half_track'|'armoured_car'|'sp_gun'|'tractor_gun'|'gunboat'|'fighter'|'bomber'
VehicleSlot     = 'engine'|'armour'|'suspension'|'turret'|'hardpoint'|'optics'|'radio'|'stowage'|'crew_kit'
Facings         = { front: ArmourClassKey, side: ArmourClassKey, rear: ArmourClassKey, top: ArmourClassKey }
Hardpoint       = { key, allowed: WeaponClass[] }
ChassisPattern  = { key, label, maker: ManufacturerKey, class: VehicleClass, tier, hull: { tonnage, crew, hardpoints: Hardpoint[], baseArmour: Facings }, slots: VehicleSlot[], quirks: QuirkKey[], pts, blurb }
Powerplant      = { key, label, maker?, hp, weight, reliability, fuelClass: RegimentKey, heat, blurb }
ArmourPackage   = { key, label, facings: Partial<Facings>, weight, cost, reliability, blurb }
Suspension      = { key, label, terrain: { [TerrainKey]: number }, weight, reliability, blurb }
Mount           = { key, label, hardpoints: number, arc: number, crewArmour: ArmourClassKey, blurb }
VehicleMod      = { key, label, slot: VehicleSlot, appliesTo: VehicleClass[], pts, mods: Record<string, number>, tradeoff: Record<string, number>, blurb }
VehicleInstance = { chassisKey, quality: QualityKey, powerplant: PowerplantKey, armourPackage?: ArmourPackageKey, suspension: SuspensionKey, mount: MountKey, hardpoints: WeaponInstance[], mods: VehicleModKey[], quirks: QuirkKey[], serial }
// Mechanized stand rows carry `vehicle: VehicleInstance`; deriveMechanized(stand) → Partial<SquadType values> & { facings: Facings }
// Engine rule (Lane A/C): a hit resolves via resolveHit against the struck facing — rear if the attacker occupies a hex behind the stand's facing
// tacticalDeploy squads may carry `loadout`; platform validates instances against the caller's arsenal
Plate      = P(key, category, title, desc, prompt /* no house style — prepended at generation */, aspect?)  // url always null from a lane
// ---- Tactical squad rules (Lane A) ----
// AMENDMENT 2026-09-01 (Lane A, Amendment A3): the shapes and tables section 3 named in prose only.
// Every one of these is authored by Lane A and consumed by Lane C (engine), Lane D (builder) and
// Lane E (arena). Lane F appends ROWS to SQUAD_TYPES / SPECIALISTS and authors none of the below.
SquadAction = { key, label, requires: { types: SquadTypeKey[], specialists: SpecialistKey[] } | null,
                uses: 'melee'|'ranged'|null, dmg: number /* MULTIPLIER on the derived `uses` stat */,
                guard: number /* multiplier on the squad's defence for the round */,
                range: number | null /* override in hexes; null = the squad's own */,
                aoe: { radius, falloff } | null, moraleHit: number, suppress: number,
                screenTurns: number /* turns of LOS-blocking screen left on the hex */,
                noMove: boolean, turns: number, builds: DeployableKey | null,
                damageType: DamageType | null /* null = the squad's own */, indirect: boolean, blurb }
// GATING IS A UNION: an order is offered when `requires` is null, OR requires.types names the type, OR
// the TYPE names the order in its own `specials`, OR requires.specialists names a carried specialist.
// The third clause is what lets Lane F add a type without editing SQUAD_ACTIONS. Status gating
// (suppressed / routed / entrenched / already building) is Lane C's and is not expressed here.
Deployable  = { key, label, cover: number /* ADDED to the tile's terrain cover */, blocksLOS: boolean,
                moveCost: number /* ADDED to the tile's entry cost */, buildTurns: number,
                infantryOnly: boolean, armourClass: ArmourClassKey /* the class a stand in the work
                resolves against, only when its own class is in WORK_ARMOUR_APPLIES_TO */,
                mods: { speed: number|null /* ABSOLUTE SET, not a delta; null = unchanged */,
                        range: number /* delta */, suppress: number /* delta */ }, blurb }
// Lane-A-owned tables Lane C reads and never re-authors (drift guard 7):
//   FIGURES_PER_COMPANY  { riflemen: 10, crawler: 1, artillery: 1, fighter: 1 } — keyed by REGIMENT
//   MORALE_MODS          the roll (dice/dieSides), the situational modifiers (added to the target;
//                        negative is harder) and the outcome thresholds (routMargin, autoPass/autoFail)
//   SCALING              every figure-scaling and derivation constant; no scaling number lives outside it
//   POINTS_MODEL         (tactical.ts) the six combat-value weights, the anchor row and the efficiency
//                        cap. NAME COLLISION, and it is deliberate on both sides: arms.ts exports its
//                        own POINTS_MODEL (AP_RATE / AA_RATE / rangeFactorDivisor / the two reference
//                        keys / efficiencyCap) which prices WEAPON PATTERNS. Two currencies, two
//                        tables. Import the one whose module you mean, never both unaliased.
//   WORK_ARMOUR_APPLIES_TO  the ArmourClass keys a work may re-class
//   INFANTRY_REGIMENTS   the RegimentKeys that are men on foot. squadActions refuses a build order
//                        whose work is `infantryOnly` to any type from a regiment outside this list;
//                        OCCUPYING such a work is Lane C's half of the same flag
//   HEX_DIRECTIONS       the six axial directions, in the SAME ORDER as Lane B's neighbors()
//   FACING_ARCS          { front: [5,0,1], side: [2,4], rear: [3] } — offsets from a stand's facing
// Lane-A derivations:
//   deriveSquad(squad) -> { figures, melee, ranged, range, armor, speed, morale, initiative, actions, pts }
//   squadFigures(squad) -> integer, clamped to [0, maxFigures]
//   squadStaffMods(specialists) -> { keys, pts, morale, initiative, moraleFloor, recoverPerTurn,
//                                    aoeSuppress, buildSpeed, executionToll } — the stacking rule, once
//   squadActions(typeKey, specialists) -> SquadActionKey[]
//   poolCost(squads) -> { [RegimentKey]: figures }   all four keys, always, zero by default
//   toRegiments(squads) -> { [RegimentKey]: companies }   Math.floor, all four keys
//   combatValue/fairPts/typeEfficiency(typeKey) -> the Points Audit, as code
//     fairPts here is tactical.ts's fairPts(typeKey: SquadTypeKey) -> pts in the riflemen=100 currency.
//     SECOND NAME COLLISION: arms.ts exports fairPts(pattern: WeaponPattern) -> the cost of ONE weapon
//     in the levy-rifle=1 currency. Different argument, different scale, both correct; §12 of arms.ts
//     declares the join between the two. Qualify the module whenever you name either.
//   resolveSquadHit({ attacker, action, targetArmour, targetDerived? }) -> { effective, suppressOnly }
//     THE TACTICAL LAYER'S ONLY ROUTE TO arms.ts resolveHit. A thin adapter with no armour arithmetic
//     of its own. PENETRATION FOLLOWS THE KIT: when `attacker.loadout.primary` is present the adapter
//     calls Lane I loadoutProfile for armorPen/damageType, the same way deriveSquad calls deriveLoadout
//     for melee/ranged. An explicit `attacker.profile` overrides that; the type's declared defaults are
//     the last resort; an order's own `damageType` overrides both. It resolves ONE stand and never a
//     burst — AoE falloff is Lane C's, via arms.ts resolveAoe. Returns the inert result rather than
//     throwing on any unknown input.
//   struckFacing({ from, at, facing, overhead? }) -> 'front'|'side'|'rear'|'top'
//     Pure axial geometry; `facing` indexes HEX_DIRECTIONS. 'top' for an overhead attack or an
//     attacker in the target's own hex. It picks WHICH facing a hit lands on and never what is behind it.

// ---- Field generator (Lane B) ----
TerrainKey  = 'open'|'road'|'rail'|'field'|'rubble'|'ruins'|'building'|'wall'|'woods'|'hedgerow'|'crater'|'water'|'marsh'|'hill'|'fuel_tank'|'precursor_wall'
WorkKey     = 'foxhole'|'trench'|'bunker'|'emplacement'   // Lane A owns DEPLOYABLES; Lane B only ever emits 'trench' | 'bunker'
TerrainMeta = { key: TerrainKey, cover: number, moveCost: number | null /* null = impassable */, blocksLOS: boolean, baseElev: 0|1|2 }
Tile        = { terrain: TerrainKey, cover: number, elev: 0|1|2, blocksLOS: boolean, moveCost: number | null, work?: WorkKey }
FieldMeta   = { seed: number, nodeKind: NodeKind, weather: WeatherKey, fortBonus: number, losCap: number, groundsFighters: boolean }
Field       = { w, h, tiles: { "q,r": Tile }, deploy: { attacker: [{q,r}], defender: [{q,r}] }, meta: FieldMeta }
NodeKind    = 'city'|'town'|'depot'|'ruin'|'crossroads'
WeatherKey  = 'clear'|'rain'|'fog'|'storm'|'snow'
// generateField({ seed, nodeKind, weather, fortBonus, w=15, h=11 }) → Field   (pure, seeded, no Math.random)
// neighbors(q, r) → [{q,r}] (6, unfiltered)   ·   hexRange(field, centre, n) → [{q,r}] in-field, hexDistance ≤ n
// hexLine(a, b) → [{q,r}] inclusive of both endpoints; hexLine(a,b) === hexLine(b,a).reverse()
// lineOfSight(field, a, b) → boolean          ·   pathCost(field, from, to, opts?) → { cost, path: [{q,r}] } | null
// repairConnectivity(field) → { passes, carved, forced }   (pipeline step 10; exported so it can be driven against a hand-broken board — a no-op on any board generateField produces)
```

**AMENDMENT 2026-09-01 (orchestrator, Q7 — raised by Lane J) — §4 is a CONTRACT, not an export whitelist.**
A lane may export additional pure helpers beyond the shapes named here, provided (a) every contracted
export keeps its exact name and signature, (b) any added optional parameter leaves the contracted
call form behaving identically, and (c) the lane pins its full export surface in a test so the superset
cannot grow unnoticed. Lane J's `MOTOR_MODEL`, `evaluateVehicleQuirk` and its two optional `ctx`
parameters are **blessed** on those terms — they are pinned by `test/motor-mirror.test.js`. Consumers
(Lanes A, C, D) code against the contracted surface only.

**AMENDMENT 2026-09-01 (orchestrator, Q8 — raised by Lane J) — `docs/prompts/PLATFORM_HANDOFF.md` is a
sanctioned append surface for EVERY lane.** §3's owned-file lists do not name it, which made a lane's own
ownership gate read it as an unauthorised eleventh path. The kickoff has always required the opposite —
"collect every such need into `docs/prompts/PLATFORM_HANDOFF.md`" — so the file is hereby an append
surface for all lanes, on the same one-banner-block, append-only, keep-both-in-lane-order protocol as
`imageLibrary.js` and `wiki/entries.js`. It is the ONE shared doc lanes may append to;
`ART_MANIFEST.md` and `ORCHESTRATION_LOG.md` remain orchestrator-only.

**AMENDMENT 2026-09-02 (orchestrator, Q9-Q12 — Lane C's four open questions, all ruled).**

**Q9 — `relicProject` lives IN the `tacticalView` payload, not server-side only.** Lane C's amendment C2
stands and supersedes its own C1 note. The fixture *is* the payload, and it is the only description of a
battle that Lanes D and E ever see; a slot the server holds and the payload hides is a slot those lanes
must re-cut the day boarding assaults fill it. Shape: `relicProject: { attacker, defender }`, both `null`
until the capture path exists.

**Q10 — `relicProject` is keyed by ROLE (`attacker`/`defender`), not by faction id.** A tactical
engagement has exactly two participants and the whole §4 payload already addresses them by role
(`myRole: 'attacker' | 'defender'`). "Per-faction tactical state" means the per-participant state of that
engagement. Lane C's per-side shape is correct; do not re-cut it.

**Q11 — `orderAction: 'march'` is an ENGINE-RESERVED order and correctly has no `SQUAD_ACTIONS` row.**
Every action in Lane A's table either fires, builds, or carries `noMove: true`, which left a stand that
only wants to close ground with no key to send. `march` is pure movement: it is **not priced** (Lane F
gives it no `pts`), **not gated** (Lane H writes no lock for it), and never appears in a squad's
`actions[]`. It is not a missing Lane A row. Any future engine-reserved order is added to this paragraph.

**Q12 — `squads[].facing` is emitted on EVERY row, infantry included; the row shape does not vary by
stand type.** A payload whose key set depends on the row forces every consumer to branch before it can
read, and Lanes D and E consume this shape from a fixture they cannot regenerate. Uniform rows win.
Infantry carry a facing that the damage model simply does not consult.

Effect `key` vocabulary (the engine applies these; add new keys here before using them): `unit.<type>.attack|defense|melee|ranged|armor|speed|morale`, `income.<steel|fuel|manpower>`, `armyCap`, `supplyRange`, `capitalDefense`, `initiative`, `losRange`, `digSpeed`, `fragmentYield`, `moraleTest`, `buildTurns`.

Regiments ↔ figures: `1 company = FIGURES_PER_COMPANY` (Lane A sets; default 10 for infantry-derived, 1 for crawler/artillery/fighter — vehicles are single-figure squads). `toRegiments` rounds **down** so battles never create companies.

**AMENDMENT 2026-09-01 (orchestrator, Q5) — `FIGURES_PER_COMPANY` is keyed by REGIMENT, never by squad type.** §3 Lane A's "1 company = 1 squad's default figures" holds only for `riflemen`; it breaks for every specialised type whose default squad is not 10 figures (Lane F ships several). The binding rule: a squad type's `figures` is its own default squad size and may differ freely from its source regiment's company size; `toRegiments` converts surviving figures back through the **regiment's** `FIGURES_PER_COMPANY`. `riflemen`-derived = 10 and `crawler`/`artillery`/`fighter` = 1 are hard values and must be asserted in Lane A's tests.

---

## 5. Phases & merge order

| Phase | Lanes | Definition of done |
| --- | --- | --- |
| **P1 — Contracts** | A, B (types + generator + tests) | `tactical.ts` and `tacticalField.ts` merged; mirror + field tests green; this doc updated with any numeric changes |
| **P2 — Engine** | C (against P1) | Scripted-battle test green; `battleResult` still satisfies `gameEngine`'s `runAutoTurns` |
| **P3 — Platform wiring** | Platform | `createTactical` field opts, squads deploy, `tacticalAuto`, live test of a full NPC-defended battle via `test_backend_function` |
| **P4 — UI** | D, E in parallel (against P1 shapes; E stubs `fx`) | Deployment + arena render against a recorded `getState` fixture in `test/fixtures/tactical-state.json` |
| **P5 — Ship** | Platform | Patch dispatch filed; `docs/GAME_RULES.md` § Set-Piece Engagements; `docs/ARCHITECTURE.md` action rows |
| **C1 — Catalog contracts** | I, then G ∥ J, then F (see the executed wave order below) | Squad/specialist/upgrade rows, `catalog.ts`, `arms.ts` and `motorPool.ts` merged; mirror + roll tests green; damage-model tables in place; placeholder plates registered; `[PROPOSED]` rules drafted |
| **C2 — Factions & lore** | H (after C1) | 13 presets pass validation; herald voices, codex, settlements, lifepath chapter merged |
| **C3 — Platform content wiring** | Platform | Catalogs imported into the engine, `effects[]` applied, locks enforced, plates generated & delivered, `[PROPOSED]` promoted, patch dispatch |

**AMENDMENT 2026-09-01 (orchestrator, Q2) — the executed wave order.** The paragraph below was
internally circular about Lane F: the C1 row put F parallel with A, while §3 Lane F appends rows to
tables Lane A creates, and §5 itself puts I ahead of A. Chaining those gives `I → A → F`, which the
first two readings forbid. The dependency graph has exactly one valid topological order, and it is
the one being executed:

| Wave | Lanes | Why |
| --- | --- | --- |
| 1 | **I**, **B**, **G** | I is the long pole and blocks A and J; B and G touch nothing else |
| 2 | **A**, **J** | both need I merged (A imports `resolveHit`; J draws hardpoints from `WEAPON_PATTERNS`) |
| 3 | **C**, **F** | C needs A+B; F appends rows to A's tables and prices against I/J |
| 4 | **H** | references F, G, I and J keys |
| — | *platform handoff, then wait* | P3 + C3 run in the Base44 session |
| 5 | **D**, **E** | after Phase 3 is live; D also needs F, I, J |

No lane may start before its wave. The original prose follows and is superseded where it conflicts.

Merge order is strict: A/B → C → platform → D/E. D and E may open PRs early but rebase on P3. Content runs on its own track: F/G/I → J → H → platform (C3). J starts once I merges (J's hardpoints reference I's `WEAPON_PATTERNS`, its facings use I's `ARMOUR_CLASSES`); H after F/G/I/J. F, I and J **must** land before D (the squad builder renders F's rows, I's loadouts and J's vehicles — D adds a "Small Arms Issue" step for infantry and a "Motor Pool Refit" step for mechanized stands, each fitting mods from the reserve). Lane A imports `resolveHit` from `arms.ts` rather than authoring its own armour math, so I's damage-model tables merge **before** A finalises combat resolution.

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
11. **Arms granularity stays numeric and server-rolled** — no weapon stat exists only in prose; every quirk carries a machine-evaluable `condition`; `rollWeapon` is pure and seeded (no `Math.random`); the tactical engine consumes only `deriveLoadout` output, never raw weapon instances.
12. **One damage model** — armour math exists only in `arms.ts` (`ARMOUR_CLASSES`, `PEN_TABLE`, `TYPE_MATRIX`, `resolveHit`). Every weapon declares `armorPen`, `damageType` and `aoe`; every stand declares an `ArmourClass` (vehicles per facing). `PEN_TABLE` must contain a `mult: 0` row so light weapons are genuinely ineffective against heavy/superheavy armour; a zero-effect hit may still suppress. No lane re-implements penetration in its own file.
13. **Mechanized granularity mirrors arms** — vehicles are chassis + powerplant + armour package + suspension + mount + hardpoints (Lane I weapon instances) + mods + quirks; `rollVehicle` is pure and seeded; the engine consumes only `deriveMechanized` output plus `facings`.

## 7. Worktree & git protocol

- Repository: `https://github.com/blae-code/rust-legions` — integration branch `main`, two-way synced with the Base44 Builder (a merge to `main` reaches the live app's builder; a red merge breaks the live preview).
- One worktree per lane: `scripts/agent-worktree.sh tactical-<lane>` → branch `feat/tactical-<lane>`.
- Lane agents read: `CLAUDE.md`, `docs/VISION.md`, this file, their owned files, and `test/helpers/*`. Nothing else is required context.
- Lane branches push to `origin/feat/tactical-<lane>` and open a PR against `main`. PR title: `tactical(<lane>): <summary>`; body lists contract sections touched and test names added.
- The orchestrator merges in the §5 order, re-running `npm test` after each merge, and stops on the first red.
- Anything needing the live backend (entity writes, function deploy, `Patch` records) is handed back to the Base44 chat session as a checklist, not attempted from a worktree.