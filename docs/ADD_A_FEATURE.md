# Adding, Customizing & Removing Features

Rust Legions is built so features are **relatively plug-and-play**: self-contained
where the platform allows, and — where it can't be — funneled through a few
well-marked seams instead of scattered across the codebase. This doc is the
practical playbook. Read [`CLAUDE.md`](../CLAUDE.md) for conventions and the
"one critical invariant" first; this is the how-to that follows from it.

## The mental model

A feature usually spans up to four layers. How modular each layer is:

| Layer | Where | Modularity |
| --- | --- | --- |
| **UI** | `src/components/<area>/`, `src/pages/` | ✅ self-contained folders |
| **Client rules/data** | `src/lib/*.js` | ✅ one file per domain |
| **Backend action** | `base44/functions/gameEngine/entry.ts` | ⚠️ one monolith, but registry-dispatched |
| **Persisted state** | `base44/entities/Game.jsonc` + `persistWar()` | ⚠️ one document, centralized seam |

The two ⚠️ rows are **Base44 platform constraints**, not accidents: a backend
function is one file with no local imports, and a game is one `Game` document.
The patterns below keep those constraints from spreading into your feature.

---

## Frontend feature-folder convention (the ✅ path)

**A feature's UI is a folder under `src/components/game/<feature>/` (or a top-level
area like `home/`, `macro/`).** Rules:

1. **Stay in your lane.** A feature folder imports only from:
   - its **own** folder,
   - `@/lib/*` (rules/data/helpers),
   - `@/components/ui/*` (shadcn primitives).
   It must **not** import from another feature's folder. (Enforced by convention;
   the existing `diplomacy/`, `fortress/`, `research/`, `economy/`, `chat/`,
   `charts/` folders all obey this — verified: zero cross-feature imports.)
2. **One panel is the entry point.** The feature exposes a single top-level panel
   (e.g. `DiplomacyPanel.jsx`) that the composition root mounts. Sub-components
   live beside it.
3. **Co-locate the data.** A feature's client-side rules/labels go in one
   `src/lib/<feature>.js` (e.g. `diplomacy.js`, `baseModules.js`).

**Wiring points (the only two files you touch to surface a feature):**
- **A new screen** → [`src/App.jsx`](../src/App.jsx): add one `import` and one
  `<Route>` (the file even carries `// Add page imports here` markers).
- **An in-game panel** → [`src/pages/GamePage.jsx`](../src/pages/GamePage.jsx):
  import the panel and mount it. This is the composition root.

Because nothing cross-imports, **removing** a feature is: delete its folder,
delete its `src/lib/<feature>.js`, and remove the one import + mount in App.jsx
or GamePage.jsx. Nothing else breaks.

---

## Backend action: the action registry (the ⚠️ path, made tidy)

All gameplay goes through one function, `gameEngine`. It no longer uses a long
`if/else` chain — it uses **two action registries**, so adding an action is a
single map entry:

```js
// runs BEFORE a game is loaded (no gameId yet):
PREGAME.myNewSetupAction = async () => { /* ... */ return Response.json(...); };

// runs against the already-fetched `game` (the common case):
GAME_ACTIONS.myNewAction = async () => {
  const slotIdx = requireMyTurn();          // turn enforcement helper
  // ... mutate the in-memory `game` ...
  await persistWar();                        // see next section
  return Response.json({ ok: true });
};
```

Handlers are registered where they're declared and dispatched at the end of the
HTTP handler. Rules:
- **End every handler with a `return Response.json(...)`.** (Dispatch does
  `return await handler()`.)
- Handlers close over `game`, `mySlot`, `svc`, `user`, `body`, and the helpers
  `requireMyTurn()`, `persistWar()`, `logIfComplete()` — all already in scope.
- Use `GAME_ACTIONS` for anything needing a loaded game; `PREGAME` only for
  create/list-style actions that must run before the `Game.get`.
- Add the matching entry to the frontend action catalog call site and to
  [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)'s action table.

*(The smaller `concurrentPlay` function still uses a short `if` chain for its two
off-turn actions; follow the same "one branch per action" shape there.)*

---

## Persisted state: the `Game` document + `persistWar()`

The whole game is one `Game` record. When a feature adds new **persistent**
state, wire it through the single seam:

1. Add the field to the schema in
   [`base44/entities/Game.jsonc`](../base44/entities/Game.jsonc) (write the file
   as a **complete** schema — no partial edits).
2. Add the field to the **`persistWar()`** field list in `gameEngine` — this is
   the one place the war-state document is written back. **If you skip this, your
   state silently doesn't save.** (Some actions also have their own targeted
   `Game.update(...)` calls; match the pattern of the action you're adding.)

Per-slot, off-turn state (research focus, unlocks) goes through `concurrentPlay`
instead, which only touches uncontested per-slot fields.

---

## Rules that exist on both client and server (the invariant)

Any gameplay **number** (cost, stat, modifier) lives in **two or three** places
because the backend can't import from `src/`:

- `gameEngine/entry.ts` — **authoritative. The server always wins.**
- `src/lib/<domain>.js` — the client mirror (display + pre-validation).
- sometimes `concurrentPlay/entry.ts` — a third copy (tech/armory catalogs).

**Canonical-source policy:** treat the `gameEngine` table as the single source of
truth. The mirror and any `concurrentPlay` copy must match it. **Change all
copies in the same commit.**

This is guarded mechanically — you don't rely on memory:

```
npm run rules:check
```

runs the parity suite ([`test/rules-mirror.test.js`](../test/rules-mirror.test.js))
which lifts every rule table out of the backend source and asserts the mirrors
match, plus [`test/combat-math.test.js`](../test/combat-math.test.js) which locks
the combat tables to `docs/GAME_RULES.md`. It covers units, buildings, research,
perks, base modules, armory, weather, maneuvers, army designs, combat modifiers,
and command vehicles. **If you add a new mirrored table, add it to that suite.**
CI runs it on every push.

---

## Checklists

### Add a gameplay feature
- [ ] Read [`docs/VISION.md`](./VISION.md) — does this align with the direction?
- [ ] UI: new folder under `src/components/game/<feature>/`, single entry panel,
      imports only own-folder + `@/lib` + `@/components/ui`.
- [ ] Client data: `src/lib/<feature>.js`.
- [ ] Backend: one `GAME_ACTIONS.<action>` (or `PREGAME.<action>`) entry.
- [ ] State: field in `Game.jsonc` **and** `persistWar()`.
- [ ] Rules on both sides? Update every copy + add to `npm run rules:check`.
- [ ] Wire: `<Route>` in `App.jsx` and/or mount in `GamePage.jsx`.
- [ ] Docs: action table in `docs/ARCHITECTURE.md`; rules in `docs/GAME_RULES.md`.
- [ ] File a Patch dispatch (see `CLAUDE.md` → Patch workflow).
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` all green.

### Customize an existing feature
- [ ] Numbers → edit the `gameEngine` table **and** its `src/lib` mirror (+ any
      `concurrentPlay` copy) together; `npm run rules:check`.
- [ ] UI-only → stay inside the feature folder.

### Remove a feature
- [ ] Delete `src/components/game/<feature>/` and `src/lib/<feature>.js`.
- [ ] Remove its import + mount from `App.jsx`/`GamePage.jsx`.
- [ ] Remove its `GAME_ACTIONS`/`PREGAME` entry and helpers from `gameEngine`.
- [ ] Remove its `Game.jsonc` field + `persistWar()` entry (leave old data keys
      harmlessly ignored if migrating live games).
- [ ] Drop any rules-parity tests for it; `npm test`.

---

## Validating backend changes locally

`gameEngine` runs only on Base44, but you can still catch scope/syntax errors
before pushing. With Deno installed:

```
deno lint base44/functions/gameEngine/entry.ts   # AST/parse + style
```

For a fuller type-check, check it in isolation with the `@base44/sdk` import
stubbed (so the whole frontend dep tree isn't dragged in). The moving parts of a
change — did a variable go out of scope, is a brace unbalanced — surface as
`TS2304 Cannot find name` / `TS1xxx` errors against an otherwise-stable baseline
of untyped-object noise. Behavior itself still needs a Base44 deploy smoke-test.
