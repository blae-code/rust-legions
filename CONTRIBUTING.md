# Contributing & Working in Parallel

Rust Legions is often worked on by **several Claude Code sessions (and their operator) at once** — a lore/design session editing `docs/`, a code session in `src/`, another on the backend. This file is the protocol that keeps that safe. Read `CLAUDE.md` (conventions + the rules invariant) and `docs/ADD_A_FEATURE.md` (the feature playbook) first; this is about *coordination*, not *how to code*.

## The one rule that prevents most collisions: one worktree per agent

Branch-per-task is not enough on its own. Two agents sharing a single working directory still share the checked-out branch **and every uncommitted file** — so one session's half-finished edit lands under the other's feet (and moving/renaming the directory mid-session breaks both).

Give every concurrent session its **own git worktree**:

```bash
scripts/agent-worktree.sh new mobile-bases   # → ../rl-mobile-bases on branch claude/mobile-bases
cd ../rl-mobile-bases && npm ci && claude     # each worktree has its own node_modules
scripts/agent-worktree.sh list
scripts/agent-worktree.sh rm  mobile-bases    # when merged (keeps the branch)
```

Worktrees share history and the remote but nothing uncommitted. Integrate through **pull requests to `main`**, where CI runs. Never move or rename a worktree while a session is live in it.

## Ownership zones

To avoid two sessions editing the same file, keep to lanes. These are conventions, not locks — when you must cross a lane, say so and commit small.

| Zone | Paths | Typically owned by |
| --- | --- | --- |
| **Lore & design** | `docs/LORE*.md`, `docs/*_DESIGN.md`, `docs/FACTION_ROSTER.md`, `docs/GEAR_LIBRARY.md`, `docs/HERALD_VOICES.md`, `docs/VISION.md` | the lore/design session |
| **Frontend** | `src/**` (feature folders are already isolated — see the playbook) | code sessions, one per feature folder |
| **Backend engine** | `base44/functions/gameEngine/entry.ts`, `concurrentPlay/entry.ts`, `base44/entities/*.jsonc` | one session at a time — it's a single-file monolith and a merge hotspot |
| **Implementation record** | `docs/GAME_RULES.md`, `docs/ARCHITECTURE.md` | whoever ships the matching code |
| **Shared (coordinate)** | `CLAUDE.md`, `AGENTS.md`, `package.json`, `.github/`, `.claude/` | announce before editing |

**Docs-first (VISION §9):** design lands in the lore/design docs → a code session implements it → updates `docs/GAME_RULES.md` + the `src/lib` mirrors + `rules:check` → files a Patch dispatch.

## The invariant is machine-guarded — lean on it

Any gameplay number lives in **two or three** places (`gameEngine` → `src/lib/<domain>.js` → sometimes `concurrentPlay`). Change every copy in the same commit. You don't have to trust memory across sessions:

```bash
npm run rules:check     # parity suite: backend tables ↔ src/lib mirrors + combat-math ↔ GAME_RULES.md
```

If two sessions touch rules independently and drift, CI (and the pre-push hook) go red. Add any new mirrored table to `test/rules-mirror.test.js`.

## Local gates

```bash
scripts/setup-hooks.sh   # once per checkout: activate the pre-push gate
```

The **pre-push hook** (`.githooks/pre-push`) runs `lint · typecheck · rules:check` before a push reaches a shared branch. Bypass a single push with `git push --no-verify`. **CI** (`.github/workflows/ci.yml`) runs the full set on every push and PR: lint, typecheck, tests, build, and `deno lint` on the backend functions.

Validate a backend change without a Base44 deploy:

```bash
deno lint --rules-exclude=no-import-prefix,prefer-const \
  base44/functions/gameEngine/entry.ts base44/functions/concurrentPlay/entry.ts
```

## Cadence

- Commit small and often; rebase your branch on `origin/main` before opening a PR.
- Keep a feature to its folder + its `src/lib/<feature>.js` + one wiring point (the playbook makes features add/remove-clean).
- When you cross an ownership zone or touch a shared file, note it in your PR description so the other sessions can see it.

## `.claude/` shared config

The repo ships shared Claude Code config so every session behaves consistently:
- `.claude/settings.json` — a permission allowlist (fewer approval prompts for the safe project commands) and a passive `PostToolUse` reminder when a mirrored rules file is edited.
- `.claude/commands/` — `/rules-check`, `/backend-check`, `/add-feature` slash commands.
