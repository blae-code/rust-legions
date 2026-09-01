# Lane E — Arena UI

> This brief is your complete instruction set. Besides it, you read exactly four documents:
> `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md`, `docs/TACTICAL_SQUAD_PLAN.md` (the contract — §3 lanes,
> §4 payload shapes, §5 phases, §6 drift guards, §7 git protocol), plus your own owned files and
> `test/helpers/extract-const.js`. Nothing else is required context and nothing else is authority.
> Where this brief states a number, that number is the requirement — do not substitute your judgement.

---

## Goal

At the end of this lane, a set-piece engagement **renders and can be commanded**. `ArenaScreen` takes a
`battle.tactical` payload in exactly the §4 shape and draws a 15×11 axial-hex battlefield as inline SVG:
terrain fills, elevation shading, works/deployables, fog, both sides' squad tokens with figure counts and
status lamps, an initiative rail, a battle log, and an order panel that highlights legal moves, gates
actions to the squad's own `actions[]`, and submits `tacticalOrders`. The field pans and zooms; on mobile
the order panel becomes a bottom sheet. Every effect is CSS `steps()` / framer-motion — **there is no
`<canvas>` anywhere in this lane**. An "Auto-resolve remainder" button exists, wired to a `tacticalAuto`
action that **does not exist yet** (platform-owned), and is therefore rendered **disabled** with
Ministry-voice copy explaining why.

The lane ships no server code, no engine logic, and no rules numbers of its own. It is a pure
presentation + input lane over a payload someone else produces.

**Phase and rebase obligation (§5).** You are **P4**, alongside Lane D. Merge order is strict —
`A/B → C → platform → D/E` — and §5 grants exactly one concession: *"D and E may open PRs early but
rebase on P3."* So you may build against the P1/§4 shapes and the hand-authored fixture from day one
and open a draft PR, but **the lane is not done until you have run `git fetch origin && git rebase
origin/main` after the platform lane has landed P3** (`createTactical` field opts, squads on
`tacticalDeploy`, the new `tacticalAuto` action) and re-run the entire Definition of done on that
rebase. Record the commit you rebased onto in the PR body. In particular `capabilities.tacticalAuto`
stays **false** until P3 has actually shipped the action — a green run against a pre-P3 `main` does
not discharge this obligation.

---

## Owned files

Copied from `docs/TACTICAL_SQUAD_PLAN.md` §3, "Lane E — Arena":

> Owns: `src/components/game/tactical/arena/*`, `.cq-tac-*` rules in `src/index.css` (append only),
> `UnitSprite.jsx` additions for `assault, mortars, pioneers`.

Concretely, the exact paths you may create or modify:

| Path | Permission |
| --- | --- |
| `src/components/game/tactical/arena/**` | create freely (new directory — it does not exist yet) |
| `src/index.css` | **APPEND ONLY.** One contiguous block at the end of the file. Zero deletions, zero modifications to any existing line. |
| `src/components/game/sprites/UnitSprite.jsx` | **ADDITIONS ONLY** — exactly three new keys in `SPRITES`: `assault`, `mortars`, `pioneers`. Do not touch the five existing sprites, the `SPRITES` wrapper `<g>`, the `viewBox`, or the component signature. |
| `test/tactical-arena.test.js` | create (see "Contract amendment you must file", below) |
| `test/fixtures/tactical-arena-state.json` | create (see "Contract amendment you must file", below) |
| `docs/TACTICAL_SQUAD_PLAN.md` | edit **only** §3's Lane E "Owns:" line and §4's `tacticalOrders` shape — see "Contract amendment you must file" |

**You may not edit any other file.** In particular, and without exception:

- `src/components/game/tactical/EngagementStage.jsx`, `ResolutionElection.jsx`, `StageFrame.jsx`,
  `DeploymentScreen.jsx`, `FormationSlip.jsx`, `FormationStats.jsx`, `ReserveRack.jsx`, `TroopStack.jsx`
  — **Lane D / unowned.** You do not wire yourself into the app. See "Mount contract" below.
- `src/lib/tactical/data.js`, `src/lib/tactical/field.js` — **Lane A / Lane B.**
- `base44/shared/*.ts`, `base44/functions/**`, `base44/entities/**` — **Lane A / B / C / platform.**
- `src/components/game/BattleView.jsx`, `src/App.jsx`, `src/components/Layout.jsx` — unowned.
- `package.json`, `package-lock.json` — **forbidden to every worktree lane** (§6 drift guard 3).
- `src/components/ui/**` — shadcn primitives; consume them, never edit them.

### Contract amendment you must file

Two things §3/§4 do not currently permit, which this lane genuinely needs. §3 and §7 say: *"If a lane
needs to change a contract, it edits this file first and flags it in its PR."* So do exactly that, as the
**first commit** on your branch, and list both amendments in the PR body under a heading
`## §4 / §3 amendments`.

1. **§3, Lane E "Owns:" line** — append `, test/tactical-arena.test.js, test/fixtures/tactical-arena-state.json`.
   Rationale to state in the PR: §5 P4's definition of done requires the arena to render against a
   recorded `getState` fixture, and §3 gave Lane E no test file. Your fixture is **deliberately named
   differently** from Lane C's `test/fixtures/tactical-state.json` so the two lanes cannot collide; your
   test additionally runs its assertions against Lane C's file **when that file exists** (guard with
   `existsSync`), so the two converge without a merge conflict.

2. **§4, the `tacticalOrders` body** — it is currently written as:

   ```ts
   { action: 'tacticalOrders', gameId, squadId, moveTo?: { q, r }, action: SquadActionKey, target?: { squadId } | { q, r } }
   ```

   That object has **`action` twice**. In JavaScript the second key wins, so the literal as written
   dispatches to `SquadActionKey`, not to `tacticalOrders`, and the request cannot route. Change the
   second one to `orderAction` so the shape reads:

   ```ts
   { action: 'tacticalOrders', gameId, squadId, moveTo?: { q, r }, orderAction: SquadActionKey, target?: { squadId } | { q, r } }
   ```

   Emit `orderAction` from your code. In the PR body, add a **Platform hand-off** line stating that
   `gameEngine`'s `tacticalOrders` handler must read `body.orderAction` (today it passes `body.action`,
   which is the dispatch name `"tacticalOrders"`, into `resolveOrders` — a live defect this rename
   surfaces). Do **not** edit `gameEngine` yourself; it is platform-owned.

   **You are the only lane authorised to touch this §4 line, and two other briefs quote it.** Lanes C
   and D both reproduce the `tacticalOrders` shape verbatim; both of their briefs now carry a note
   telling them the amendment is yours and forbidding them from filing it, so you will not collide on
   the contract document. Two obligations follow. **(a)** Name Lane C and the platform lane explicitly
   in your PR body under `## §4 / §3 amendments`, since the rename lands in the body key they read.
   **(b)** The duplicate key is a defect *inside the plan document*, not merely an inconvenience to
   your lane — the orchestrator has been told about it separately. If the orchestrator has already
   ruled on the spelling by the time you start, **the ruling wins over this brief**; do not amend §4 a
   second time to a different name.

Do not amend anything else in the plan document. If you believe another contract is wrong, say so in the
PR body and leave the code conforming to the contract as written.

---

## Contracts you consume

Verbatim from `docs/TACTICAL_SQUAD_PLAN.md` §4. **Produced by Lane C** (`tacticalView`), delivered to you
through `getState` → `battle.tactical`. Field-for-field, this is the only state you may render:

```ts
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
```

Also consumed, from **Lane A** (`src/lib/tactical/data.js`, which exists today):

```js
hexDistance(a, b)                 // axial distance
hexPixel(q, r, size)              // → { x, y }, pointy-top
hexCorners(size)                  // → "x,y x,y …" polygon points string
```

Lane B moves `hexPixel`/`hexCorners` into `src/lib/tactical/field.js` (§3, Lane B); `hexDistance` stays
with Lane A. **Do not import them from more than one place.** Create `arena/hexGeometry.js` as the lane's
single import choke point — it imports from `@/lib/tactical/data` today, re-exports, and carries a
one-line comment marking itself as the sole edit site if Lane B relocates them.

**Import from `@/lib/tactical/data` and leave it there.** The A/B protocol agreed across those two
briefs is that Lane A keeps both helpers reachable from `data.js` throughout — first as definitions,
then as `export { hexPixel, hexCorners } from "@/lib/tactical/field";` once Lane B has merged — so the
data.js import path never breaks and you have nothing to chase. If you ever do need to re-point, it is
one line in `hexGeometry.js` and nowhere else. Every other arena file imports geometry from
`@/components/game/tactical/arena/hexGeometry`, never from `@/lib/tactical/data` directly.

Consumed but **not yet authored** — treat defensively, never crash:

- `field.tiles[k].terrain` values come from Lane B's palettes and may include keys you have not mapped.
  Your terrain table must have a documented fallback and a test proving an unknown key renders.
- `field.tiles[k].work` values come from Lane A's `DEPLOYABLES` (`foxhole`, `trench`, `bunker`,
  `emplacement`). Unknown work keys fall back to a generic works glyph.
- `squads[i].type` may be any of Lane A/F's squad keys. `UnitSprite` already falls back to `riflemen`
  for unknown types — rely on that, do not add your own type list.

Consumed from existing app code (do not modify any of them):

- `@/components/game/sprites/UnitSprite` — silhouette renderer.
- `@/components/ui/button` — the `Button` primitive.
- `@/lib/sfx` — `playSfx(name)`. The only valid names are `move`, `attack`, `build`, `purchase`,
  `hover`, `select`, `endTurn`. Do not invent a name; `playSfx` silently no-ops on an unknown one.
- `framer-motion` (`motion`), `lucide-react` icons, `react` — all already dependencies.

---

## Contracts you produce

Two outbound payloads, emitted through the `onAction(payload)` prop. **The caller adds `gameId`** — the
existing `EngagementStage` → `BattleView` chain does this, so you send the payload without it.

```ts
// tacticalOrders body (Lane E → platform → Lane C)   [as amended above]
{ action: 'tacticalOrders', gameId, squadId, moveTo?: { q, r }, orderAction: SquadActionKey, target?: { squadId } | { q, r } }

// tacticalAuto body (Lane E → platform)
{ action: 'tacticalAuto', gameId }
```

- `moveTo` is omitted entirely when the squad does not move (do not send `null`).
- `target` is `{ squadId }` for a squad-targeted action and `{ q, r }` for an AoE or `build_*` action.
  It is omitted entirely for self-targeted actions (`hold`, `entrench`, `rally`).
- `orderAction` is always one of the strings in that squad's own `actions[]` array. Never send an action
  the payload did not offer, and never hardcode an action key list of your own.
- `tacticalAuto` is emitted **only** when the `tacticalAuto` capability is switched on (see work item 12).
  Until then, the button never fires.

### Mount contract (you do not wire yourself in)

`arena/ArenaScreen.jsx` is the lane's single public entry point. Its props are frozen as:

```js
ArenaScreen({ tactical, battle, busy, onAction, capabilities = { tacticalAuto: false }, mode = "battle" })
```

- `mode: "battle"` — the full arena.
- `mode: "placement"` — the field only, for Lane D's deploy-zone preview: deploy hexes highlighted,
  drop callbacks exposed, **no** order panel, **no** initiative rail, **no** battle log, **no**
  auto-resolve button.

`EngagementStage.jsx` is not yours, so **you do not mount the arena**. Instead:

1. Put a `// MOUNT CONTRACT` comment block at the top of `ArenaScreen.jsx` giving the exact JSX the
   integrator must place in `EngagementStage.jsx`'s final branch.
2. Repeat that same snippet in the PR body under `## Wiring hand-off`.
3. Do not create, append to, or edit `docs/prompts/PLATFORM_HANDOFF.md` or
   `docs/prompts/ORCHESTRATION_LOG.md` — those are the orchestrator's, and concurrent appends by several
   lanes collide silently.

For Lane D's `placement` usage, state the same contract in the PR body under `## Placement-mode contract`,
including the exact prop names of the placement callbacks you expose
(`onHexDrop({ q, r })`, `selectedSquadId`, `placed: [{ id, type, q, r }]`).

---

## Work items

Numbered and checkable. Every minimum is a number.

### Files to create — exactly these 14, all under `src/components/game/tactical/arena/`

1. `hexGeometry.js` — the single geometry import choke point. Re-exports `hexPixel`, `hexCorners`,
   `hexDistance` from `@/lib/tactical/data`, and adds presentation-only constants and helpers:
   `HEX_SIZE = 28` (SVG user units), `fieldBounds(w, h)` → `{ minX, minY, width, height }` for the
   viewBox, `keyOf(q, r)` → `"q,r"`, `parseKey("q,r")` → `{ q, r }`. No rules numbers live here.
2. `terrainTokens.js` — **pure data literals only.** `export const TERRAIN_TOKENS = { ... }` mapping each
   terrain key to `{ fill, stroke, glyph, label }`, `export const WORK_TOKENS = { ... }` for the four
   deployables, `export const TERRAIN_FALLBACK = { ... }`, `export const WORK_FALLBACK = { ... }`.
   **Cover exactly these 16 terrain keys — Lane B's `TERRAIN` table, which is the authoritative
   `TerrainKey` vocabulary:**

   `open`, `road`, `rail`, `field`, `rubble`, `ruins`, `building`, `wall`, `woods`, `hedgerow`,
   `crater`, `water`, `marsh`, `hill`, `fuel_tank`, `precursor_wall`

   **There is no `street` key.** §3's palette prose says *"city (ruins, rubble, streets)"*, and an
   earlier draft of this brief turned that into a `street` token — Lane B's canonical key for a metalled
   lane is **`road`**. A `street` entry would be a token nothing ever renders, while `wall`, `marsh` and
   `hill` — all real keys — would fall through to `TERRAIN_FALLBACK` on every field. Every `fill`/`stroke`
   value is an `hsl(var(--token))` string — see "Colour" below. `label` is Ministry-voice English and is
   what a tooltip shows. If Lane B's merged `TERRAIN` differs from this list, **Lane B's file wins** —
   map what it exports and flag the difference in your PR body.
3. `arenaModel.js` — **pure functions, no JSX, no React import.** At minimum:
   `buildTiles(field)` → array of `{ q, r, x, y, terrain, cover, elev, blocksLOS, moveCost, work }`;
   `tokensFor(squads)` → array of `{ ...squad, x, y }`; `legalMoves(squad, field, occupied)` → array of
   `{ q, r }` reachable within `squad.speed` by `moveCost`, excluding blocked and occupied hexes;
   `losSet(los)` → a `Set` of `"q,r"`; `fxClassFor(fx, squadId)` → one of `"cq-tac-idle"`,
   `"cq-tac-attack"`, `"cq-tac-hit"`, `"cq-tac-boom"`; `logTail(log, n = 18)` → the **last 18** lines in
   original order; `queueRows(queue, squads)` → `[{ id, side, name, type, active }]`;
   `deployKeys(field, side)` → a `Set` of `"q,r"`.
4. `ArenaScreen.jsx` — root; the frozen props above; desktop `grid`, mobile stack + bottom sheet.
5. `FieldCanvas.jsx` — the SVG root: `viewBox` state, pan/zoom handlers, and four `<g>` layers in this
   order: terrain, works, overlays (legal moves / LOS / deploy zones), tokens.
6. `HexTile.jsx` — one `<polygon>` + optional glyph + elevation shading. Wrapped in `React.memo`.
7. `HexWork.jsx` — the works/deployable glyph for a tile, plus the `building.turnsLeft` pip.
8. `SquadToken.jsx` — `UnitSprite` + figure badge + specialist pips + status lamps + the `fx` class.
   Wrapped in `React.memo`.
9. `OrderPanel.jsx` — active-squad card, action list, target prompt, submit, "Runners…" wait state.
10. `OrderSheet.jsx` — the mobile bottom sheet: a CSS-translated panel. **Do not use `vaul`/`Drawer` or
    any Radix portal** — portals do not render under `renderToStaticMarkup` and would make the arena
    untestable in this repo's `environment: "node"` Vitest setup.
11. `InitiativeRail.jsx` — the initiative queue with side colours.
12. `BattleLog.jsx` — the last 18 log lines in `font-mono`.
13. `AutoResolveButton.jsx` — the disabled `tacticalAuto` button.
14. `FogOverlay.jsx` — the weather/fog veil over the field.

### Behaviour

15. **FieldCanvas — grid.** Render every tile in `field.tiles`. For the standard **15×11** field that is
    exactly **165** `<polygon>` hexes. Pointy-top axial layout via `hexPixel`/`hexCorners` at
    `HEX_SIZE = 28`. `viewBox` computed from `fieldBounds(field.w, field.h)` — never a fixed pixel size,
    so the field scales to the container.
16. **FieldCanvas — terrain.** Fill from `TERRAIN_TOKENS[terrain] ?? TERRAIN_FALLBACK`. Elevation is a
    shading overlay only: `opacity` stepped by `elev`. **Lane B's contract emits `elev: 0 | 1 | 2`** —
    author three real steps and clamp defensively to 0–4 so an out-of-contract value cannot break the
    render. Cover
    is drawn as a hatch/stipple `<pattern>` or a stroke weight, never as a new hue.
17. **FieldCanvas — works.** Any tile with `work` also renders a `HexWork` glyph from `WORK_TOKENS`.
    A squad with `status.building` renders a build pip showing `turnsLeft` on its own hex.
18. **FieldCanvas — overlays.** Three mutually-layered overlays, drawn under the tokens:
    legal-move hexes (`cq-tac-legal`), LOS hexes for the active squad (`cq-tac-los`), and in
    `placement` mode the deploy zone for `battle.myRole` (`cq-tac-deploy`). Overlays are `pointer-events`
    -transparent except the legal-move layer, which is the click target for issuing a move.
19. **FieldCanvas — fog.** When `battle.weather === "fog"`, `FogOverlay` renders a veil over the field
    using the existing `.cq-fogbank` class plus the new `.cq-tac-fog`. `rain`, `snow` and `storm` reuse
    the existing `.cq-rain`, `.cq-snowfall`, `.cq-stormflash` classes. Weather is **read from
    `battle.weather`**, which `BattleView` already carries; it is not in the `tactical` payload — if
    `battle.weather` is absent, render no veil.
20. **Pan / zoom.** Pointer-driven, on the SVG `viewBox`, with **no new dependency**. Zoom clamped to
    **[0.6, 3.0]**, one wheel notch or one pinch step = **×1.2**, double-click / double-tap resets to
    fit. Pan clamped so at least **25 %** of the field bounding box stays inside the viewport. Pinch =
    two-pointer distance from `onPointerDown/Move/Up` — do **not** use `window`, `document`,
    `matchMedia`, or `requestAnimationFrame` during render; all listeners attach inside `useEffect` or
    directly as SVG props, so the component renders server-side without a DOM.
21. **SquadToken.** Composed of: `UnitSprite` (facing `right` for `attacker`, `left` for `defender`); a
    **figure badge** rendering `figures`/`maxFigures` from the payload (never a computed or retyped
    number); up to **2** specialist pips (`specialists` is capped at 2 by §4); and status lamps for
    `suppressed`, `routed`, `guard` and `building`. A token whose `id === fx.actorId` carries
    `fxClassFor(fx, id)`. Side is conveyed by the token's frame colour (`--brass` = mine,
    `--rust` = theirs) and by the sprite facing — never by a raw hue outside the token set.
22. **OrderPanel.** Renders only when `tactical.activeId` names a squad with `mine === true`. It shows
    that squad's card (name, type, `figures`/`maxFigures`, and the seven derived values `melee`,
    `ranged`, `range`, `armor`, `speed`, `morale`, `initiative`, all read from the payload), and an
    action list built **exclusively** from that squad's `actions[]`. Selecting an action that needs a
    target puts the panel into a target-picking state: squad-target actions accept a click on an enemy
    token, AoE/`build_*` actions accept a click on a hex. Submitting emits the `tacticalOrders` payload
    above and calls `playSfx("select")`. While `busy` is true every control is disabled.
23. **Wait state.** When `activeId` is not mine (or is null), the order panel is replaced by the
    Ministry-voice wait line — reuse the existing wording so the app stays consistent:
    `"Runners carry orders across the field…"` with a spinning `Loader2`.
24. **InitiativeRail.** Renders `queue` in order, each entry showing the sprite, the squad name and its
    side colour, with the `activeId` entry marked. It reads names and types from `squads`, matched by id;
    an id in `queue` with no matching squad is skipped, not rendered as a blank.
25. **BattleLog.** `logTail(log, 18)` — the **last 18** lines, oldest first, `font-mono`, `text-[11px]`,
    scrollable, newest line visually emphasised. Never truncate a line's text.
26. **Mobile bottom sheet.** Below the `sm` breakpoint the order panel and battle log collapse into
    `OrderSheet` — a bottom-anchored panel with a drag handle and a collapsed/expanded state held in
    React state. Purely Tailwind + CSS transform; **no viewport measurement, no `matchMedia`**. The
    desktop layout and the sheet are the same components under different Tailwind classes.
27. **Auto-resolve remainder.** `AutoResolveButton` renders a `Button` labelled
    **"Auto-resolve Remainder"**. When `capabilities.tacticalAuto !== true` it is rendered with the
    `disabled` attribute and this exact Ministry-voice caption beneath it:
    `"Standing orders not yet authorised — the Ministry has posted no clerk to this front."`
    It must not call `onAction` in that state under any circumstance. When
    `capabilities.tacticalAuto === true` it is enabled and emits `{ action: "tacticalAuto" }`. Default
    the prop to `{ tacticalAuto: false }` so the disabled state is what ships.
28. **UnitSprite additions.** Add exactly three keys to `SPRITES`: `assault` (close-assault infantry —
    a crouched figure with a shortened weapon and a satchel), `mortars` (a two-figure crew around a
    tube on a baseplate), `pioneers` (a figure with a spade and a coil of wire). Same `viewBox 0 0 32 32`,
    same side-on silhouette language, same visual weight as the existing five. **Introduce no new colour
    literal**: your paths carry no `fill`/`stroke` attribute at all and inherit the wrapper `<g>`; where
    an existing sprite darkens a detail it uses `#3A322A`, and you may reuse that exact existing literal
    and no other. The file's total count of `#RRGGBB` literals must remain **7** or fewer, and the total
    number of `SPRITES` keys becomes exactly **8**.
29. **`src/index.css` append.** One contiguous block at the very end of the file, opened by the banner
    comment `/* ── Tactical arena (Lane E) — .cq-tac-* ── */`. Define **at least 9** classes:
    `.cq-tac-idle`, `.cq-tac-attack`, `.cq-tac-hit`, `.cq-tac-boom`, `.cq-tac-fog`, `.cq-tac-selected`,
    `.cq-tac-legal`, `.cq-tac-los`, `.cq-tac-deploy`. The four FX classes use `animation` with
    `steps()` timing (frame-stepped, matching the existing `.cq-muzzle` / `.cq-boom` house style) — no
    `transition`-based smoothing, no JS-driven animation. Every colour is `hsl(var(--token) / a)`.
    **Zero lines of the existing file may be changed or removed.**
30. **Fixture.** `test/fixtures/tactical-arena-state.json` — a hand-authored payload matching §4 exactly,
    with: `field.w = 15`, `field.h = 11`, **165** tile entries, **≥ 8** distinct `terrain` values,
    **≥ 4** tiles carrying a `work`, **24** attacker squads and **24** defender squads (**48** total,
    the §3 `MAX_SQUADS = 24` per side), `deploy.attacker` and `deploy.defender` each **≥ 15** hexes,
    `queue` listing all 48 ids, `activeId` naming a squad with `mine: true`, `los` with **≥ 6** hexes,
    `log` with **≥ 20** lines, a non-null `fx`, and among the squads at least one `suppressed`, one
    `routed`, one `guard`, and one `building`. `roundLimit: 20`, `round: 6`, `status: "fighting"`.
31. **Tests.** `test/tactical-arena.test.js`, using `vitest` and `react-dom/server`'s
    `renderToStaticMarkup` (both already dependencies; the Vitest environment is `node` and there is no
    `jsdom` or `@testing-library` in this repo — do not add one). See "Definition of done" for the
    required assertions.

### Colour, copy and constants

32. **Colour.** Only design tokens. Every SVG `fill`/`stroke` is `hsl(var(--x))` or `hsl(var(--x) / a)`
    drawn from the tokens that already exist in `src/index.css`: `--background`, `--foreground`,
    `--card`, `--muted`, `--muted-foreground`, `--border`, `--brass`, `--brass-bright`, `--rust`,
    `--olive`, `--steel`. **No `#RRGGBB` anywhere in `arena/`**, and none added to `UnitSprite.jsx`.
33. **Tailwind classes are literal strings.** A class name may be chosen by a ternary between two whole
    literal strings; a class name may never be *built*. `` className={`bg-${x}`} `` and any
    `text-${…}` / `border-${…}` / `w-${…}` form is banned — Tailwind's purge cannot see them.
34. **Ministry voice in every user-visible string.** In-world military-ministry English, as in the
    existing screens ("Issue orders, General", "Seal the Order of Battle", "Runners carry orders across
    the field…"). Section labels use `cq-label`, headings `cq-display`, telemetry `font-mono`. Reuse the
    existing house classes (`cq-panel`, `cq-metal`, `cq-brackets`, `cq-hazard`, `cq-stamp`,
    `cq-scanlines`) rather than inventing new chrome.
35. **Numbers live in one place.** Every number a player sees comes from the payload or from an import.
    Do not retype `24`, `20`, `15`, `11`, `18` or any stat into JSX text. Concretely: no digit may appear
    inside a JSX text node — numbers reach the DOM only through `{expression}`.
36. **Components ≤ 60 lines, one component per file, `@/` imports only.** Hard ceiling for this lane:
    **64 lines** per `.jsx` file in `arena/`, **140 lines** per `.js` module (`arenaModel.js`,
    `terrainTokens.js`, `hexGeometry.js`). No relative `../` import anywhere in `src/`.
37. **Existing catalog keys are never renamed or removed** — live saves reference them. That covers the
    five existing `SPRITES` keys, every existing `.cq-*` class in `src/index.css`, and every key you read
    out of the payload. You add; you never rename.
38. **Pure-data-literal discipline.** Every table exported from a `base44/shared/*.ts` file must be a
    **pure data literal** — `export const NAME = { … }` / `[ … ]`, with no spreads, no computed keys, no
    function calls and no template literals in keys — because the mirror tests lift it *textually* with
    `test/helpers/extract-const.js` and evaluate it; a computed table cannot be mirror-tested. This lane
    owns no `base44/shared/*.ts` file, so the rule binds you only in that you must not add one — and
    `terrainTokens.js` follows the same discipline anyway, so it stays liftable if it is ever mirrored.

---

## Acceptance criteria

Copied **verbatim** from `docs/TACTICAL_SQUAD_PLAN.md` §3, "Lane E — Arena":

> Acceptance: renders a 24v24 field at 60 fps on desktop; all FX are CSS `steps()`/framer-motion, no
> canvas; mobile: pinch-zoom works, order panel collapses to a bottom sheet.

Lane-specific checks that make each of those runnable (all in `test/tactical-arena.test.js` unless
stated otherwise):

**Rendering — 24v24**
- `renderToStaticMarkup(<ArenaScreen … />)` on the fixture completes without throwing.
- The rendered markup contains exactly **165** `<polygon` elements in the terrain layer.
- It contains exactly **48** squad tokens (assert on a stable `data-squad-id` attribute you put on each
  token's group).
- Total element count of the rendered markup is **≤ 1400** — the performance budget that stands in for
  the un-testable 60 fps claim. The test **prints the actual count** so a regression is visible before it
  breaks the ceiling. Separately, `SquadToken` and `HexTile` are both wrapped in `React.memo` (asserted
  by source scan), and 60 fps itself is confirmed by the manual step in "Definition of done".

**No canvas, CSS FX only**
- Source scan over `src/components/game/tactical/arena/**`: zero occurrences of `<canvas`, `getContext`,
  `requestAnimationFrame`, `new Image(`, `three`, `@react-three`.
- Every `cq-tac-*` class referenced in `arena/**` is defined in `src/index.css` (parse both, assert set
  inclusion — the referenced set is a subset of the defined set, and the defined set has **≥ 9** members).
- The four FX class definitions each contain `steps(` in their `animation` shorthand.

**Mobile**
- `OrderSheet` renders in the markup for the fixture, carries a collapsed/expanded state, and imports
  nothing from `vaul` or `@radix-ui/*`.
- Source scan: zero occurrences of `matchMedia`, `window.inner`, `document.body` in `arena/**`.
- Pinch/zoom clamp is unit-tested on the pure helper: zoom below `0.6` clamps to `0.6`, above `3.0`
  clamps to `3.0`, and a pan that would push the field bounds more than **75 %** off-screen is clamped.

**Payload conformance**
- `OrderPanel` renders an action button for every entry in the active squad's `actions[]` and **no
  others** (assert count equality against the fixture).
- Submitting emits exactly `{ action: "tacticalOrders", squadId, orderAction, … }` — asserted by calling
  the pure order-builder helper in `arenaModel.js`, not by simulating a click.
- A squad with `status.routed === true` renders the routed lamp and contributes **zero** action buttons.
- The auto-resolve button renders with `disabled` and the exact caption from work item 27 when
  `capabilities.tacticalAuto` is falsy, and the markup contains **no** `tacticalAuto` handler wiring in
  that state.
- `mode: "placement"` renders the deploy-zone overlay and renders **no** `OrderPanel`, **no**
  `InitiativeRail`, **no** `BattleLog` and **no** auto-resolve button.
- Unknown `terrain` and unknown `work` keys render via the fallback tokens without throwing.
- If `test/fixtures/tactical-state.json` exists (Lane C's), the same render assertions run against it,
  scaled to that file's own `w`/`h`/squad count rather than to hardcoded numbers.

**Tokens, voice and shape**
- Source scan over `arena/**`: zero `#RRGGBB` literals; zero built Tailwind class names
  (`/(?:bg|text|border|fill|stroke|w|h|p|m|gap|grid-cols|opacity)-\$\{/`); zero relative `../` imports;
  every `.jsx` ≤ **64** lines; every `.js` ≤ **140** lines; zero digits inside JSX text nodes
  (`/>[^<{]*[0-9]/`).
- `src/components/game/sprites/UnitSprite.jsx` has exactly **8** `SPRITES` keys, including `assault`,
  `mortars` and `pioneers`, and **≤ 7** `#RRGGBB` literals.
- `git diff --numstat -- src/index.css` reports **0** deletions (append-only), and the same for
  `src/components/game/sprites/UnitSprite.jsx`.

---

## Drift guards

The §6 list, verbatim, with the ones that bind this lane called out:

1. **The One Critical Invariant** — every table exported from `base44/shared/tactical.ts` has a
   deep-equal mirror in `src/lib/tactical/data.js`; `test/tactical-mirror.test.js` enforces it. UI-only
   fields are allowlisted in the test. *(You own neither side. Do not touch either file.)*
2. **Exported API freeze** — `tacticalEngine.ts` keeps `createTactical, submitFormations,
   autoFormations, autoOrders, resolveOrders, activeFormation, battleResult, tacticalView` exported.
   *(Not your file; you consume `tacticalView`'s output shape and must not ask for a new field.)*
3. **No new dependencies.** `package.json` is not touched by any worktree lane.
4. **Design tokens only** — no hex colors in JSX; SVG fills use `hsl(var(--brass))` etc. Tailwind
   classes must be literal strings.
5. **Ministry voice** in every user-visible string; PII never rendered.
6. **Components ≤ ~60 lines**; one component per file; `@/` imports only.
7. **Numbers live in one place** — any balance constant referenced in UI copy is read from `data.js`,
   never retyped.
8. **Run before PR:** `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh` (pre-push does this).
9. **Doc drift** — a PR that changes any rule number also edits `docs/COMBAT_DESIGN.md` (lanes) and flags
   `docs/GAME_RULES.md` for the platform lane. *(This lane changes no rule number. If you find yourself
   wanting to, stop — that is Lane A's file, not yours.)*
10. **Content lanes never ship visuals** — *(inverse for you: you are the only lane that may edit
    `UnitSprite.jsx`, and only for `assault`, `mortars`, `pioneers`.)* **Existing catalog keys are never
    renamed or removed (live saves reference them.)**
11–13. Arms/damage-model/mechanized granularity guards — Lanes I/J/A/C. Not applicable here, except that
    you must never re-implement or display derived combat math: you render the numbers the payload gives
    you and compute nothing.

### Environment rules (equally binding)

- **Never run `npm install`, `npm ci`, or anything that writes to `node_modules`.** In this checkout
  `node_modules` is a **symlink** to a shared store; npm silently deletes the symlink and reifies a real
  directory, orphaning the store. Dependencies are already installed. If a command you are about to run
  might write there, do not run it.
- **Never edit `package.json` or `package-lock.json`** (§6 drift guard 3). No new packages, no new npm
  scripts, no version bumps. Everything this lane needs — `react`, `react-dom`, `framer-motion`,
  `lucide-react`, `vitest` — is already a dependency.
- Run tests with `npm test` (`vitest run`). Run lint with `npm run lint` (`eslint . --quiet`).
- The Vitest environment is **`node`**, with only the `@/` → `src` alias. There is no DOM, no `jsdom`,
  no `@testing-library`. Render with `react-dom/server`'s `renderToStaticMarkup`. This is why no
  component may touch `window`, `document` or `matchMedia` during render.
- ESLint covers `src/components/**` and `src/pages/**`. `react-hooks/rules-of-hooks` is an **error** —
  no conditional hooks. `unused-imports/no-unused-imports` is an **error** — no leftover imports.

### Git protocol (§7)

- Work in **your own worktree** on branch **`feat/tactical-e`** — `scripts/agent-worktree.sh` creates it.
  Never work in another lane's tree and never edit another lane's files.
- Push to `origin/feat/tactical-e` and open a PR against `main`.
  PR title: **`tactical(e): arena UI — hex field, squad tokens, order panel`**.
  PR body lists: the contract sections touched (§3 Lane E Owns, §4 `tacticalOrders`), the two amendments
  with their rationale, the test names added, the `## Wiring hand-off` snippet, the
  `## Placement-mode contract` prop list, and the `## Platform hand-off` note about `body.orderAction`.
- `main` is two-way synced with the live Base44 builder: **never open a PR that is red.**
- Do not merge your own PR, do not rebase another lane, do not touch another lane's branch.
- If a contract must change beyond the two amendments above, edit `docs/TACTICAL_SQUAD_PLAN.md` §4
  **first**, in its own commit, and say so in the PR body.

---

## Definition of done

Run all four, from the repository root of your worktree, and paste the output into the PR body.

```bash
npm test
npm run lint
bash .claude/hooks/rules-guard.sh < /dev/null
git diff --numstat -- src/index.css src/components/game/sprites/UnitSprite.jsx
```

Green looks like:

1. **`npm test`** — Vitest exits `0`. Every pre-existing suite still passes (`rules-mirror`,
   `combat-math`, `macro-*`, `extract-const`) — you changed no rules file, so a red there means you
   touched something you do not own. `test/tactical-arena.test.js` appears in the run and passes, and
   its output includes the printed element count for the 24v24 render (a number **≤ 1400**).
2. **`npm run lint`** — ESLint exits `0` with no output. `--quiet` hides warnings, so a silent run is the
   pass; do not leave `unused-imports` errors or conditional hooks behind.
3. **`bash .claude/hooks/rules-guard.sh < /dev/null`** — exits `0` and prints nothing. It nags only when
   a mirrored rules file was edited; silence confirms this lane stayed out of the rules layer.
4. **`git diff --numstat`** — two rows, each with `0` in the **second** column (deletions):
   `src/index.css` and `src/components/game/sprites/UnitSprite.jsx` are additive only. Any non-zero
   deletion count is a hard fail — revert and re-append.

Then the two things a test cannot assert, done by hand and reported in the PR body:

5. **60 fps sanity.** `npm run dev`, mount `ArenaScreen` against the fixture using the snippet from your
   `// MOUNT CONTRACT` block, and record in the PR: frame timing while panning and zooming the 24v24
   field on desktop (Chrome performance panel, a 5-second pan/zoom trace). If it is below 60 fps, say so
   with the measured number rather than claiming the criterion is met — an unmeasured claim is worse than
   a measured miss.
6. **Pinch-zoom on mobile.** Confirm in a touch emulator (or a real device) that a two-finger pinch zooms
   within the `[0.6, 3.0]` clamp and that the order panel is presented as the bottom sheet below the `sm`
   breakpoint. Report what you tested on.

Leave your changes committed on `feat/tactical-e` and pushed, with the PR open against `main`. Do not
merge. Do not touch any file outside the Owned files table.

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

