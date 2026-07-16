# Local Development in VS Code

A step-by-step guide to cloning and running **Rust Legions** locally. Assumes
you have [Node.js](https://nodejs.org) 18+ installed, plus
[VS Code](https://code.visualstudio.com) with the **Claude Code** extension.

> **This guide is for the frontend-only workflow** — editing the React app
> locally against the **hosted** Base44 backend, using git (via the Claude Code
> extension) to push and pull. You do **not** need the Base44 CLI. See
> [Backend functions](#backend-functions-base44functions) below for how backend
> changes reach the live app.

## 1. Clone the repository

Use the Claude Code extension's git integration to clone
`blae-code/rust-legions`, or from a terminal:

```bash
git clone https://github.com/blae-code/rust-legions.git
cd rust-legions
```

> If you are continuing the in-progress local-setup work, check out its branch
> after cloning:
> ```bash
> git checkout claude/game-local-setup-60yj92
> ```

## 2. Open in VS Code

```bash
code .
```

When the folder opens, VS Code will offer to install the **recommended
extensions** (see `.vscode/extensions.json`). Accept — they are what makes this
project pleasant to work in:

| Extension | Why |
| --- | --- |
| ESLint | Matches the repo's flat `eslint.config.js` |
| Tailwind CSS IntelliSense | Autocomplete for the dieselpunk design tokens & classes |
| Deno | Language support for the Base44 **backend functions** |
| Prettier *(optional)* | Formatting |
| React snippets *(optional)* | Component scaffolding |

### Why the Deno extension is scoped

This repo is a hybrid: a **Vite + React frontend** (Node-style, in `src/`) and a
**Deno backend** (`base44/functions/*/entry.ts`). Enabling Deno across the whole
project breaks the frontend, so `.vscode/settings.json` scopes the Deno language
server to `base44/functions` only (`deno.enablePaths`). Everything else uses
VS Code's built-in TypeScript/JavaScript server. This is already configured for
you — no action needed.

## 3. Install dependencies

```bash
npm install
```

## 4. Point the frontend at the hosted backend

The game's logic (the `gameEngine` API and friends) lives in the **hosted**
Base44 backend, not on your machine. So the local frontend needs to know where
that backend is, or API calls will fail and the app will render but not work.

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your deployed app's values:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

You can find both in the Base44 dashboard for the app. `.env.local` is
git-ignored, so it stays on your machine only.

## 5. Run the frontend

```bash
npm run dev
```

Vite serves at **http://localhost:5173** by default (it prints the URL, and
picks the next free port if 5173 is taken). Edits to files under `src/`
hot-reload instantly.

## 6. Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (frontend) |
| `npm run build` | Production build to `./dist` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (quiet) |
| `npm run lint:fix` | ESLint with autofix |
| `npm run typecheck` | Type-check via `jsconfig.json` |

## 7. Push and pull with the Claude Code extension

Use the Claude Code extension (or VS Code's built-in Source Control panel) for
all git work — stage, commit, push, pull. There is no separate deploy step for
day-to-day work:

- **Frontend changes** (`src/`) are pushed to git like any other project.
- **Any change pushed to the repo is also reflected in the Base44 Builder** —
  this is how the hosted app picks up your work. To publish it to the live app,
  open the Base44 dashboard and publish from there.

### Backend functions (`base44/functions`)

The backend Deno functions run **only** on Base44 — you cannot execute them
locally without the CLI. Edit them here, push via git, and they flow to the
Base44 Builder for you to publish. The Deno extension gives you correct
language support while editing them (already scoped in `.vscode/settings.json`).

> Remember the **one critical invariant** (see `CLAUDE.md`): several game rules
> live in *both* `base44/functions/gameEngine/entry.ts` and a mirror in
> `src/lib/*.js`. Change both sides together.

## 8. Before you build a feature

Read the docs in this order — the project has a strict server/client
rules-mirroring invariant and a committed design direction:

1. `CLAUDE.md` — conventions, the "one critical invariant", workflows
2. `docs/VISION.md` — design north star (read before designing new gameplay)
3. `docs/GAME_RULES.md` — the numeric ruleset as implemented
4. `docs/ARCHITECTURE.md` — data model, backend API, frontend structure

## Troubleshooting

- **Deno errors all over the frontend** — the Deno extension is enabled too
  broadly. Confirm `.vscode/settings.json` has `"deno.enable": false` with
  `"deno.enablePaths": ["base44/functions"]`, then reload the window.
- **Port 5173 already in use** — Vite will pick the next free port and print it;
  use that URL.
- **Tailwind classes not autocompleting** — make sure the Tailwind CSS
  IntelliSense extension is installed and you've reloaded the window.
