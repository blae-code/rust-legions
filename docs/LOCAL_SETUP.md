# Local Development in VS Code

A step-by-step guide to cloning and running **Rust Legions** locally. Assumes
you have [Node.js](https://nodejs.org) 18+ and [git](https://git-scm.com)
installed, plus [VS Code](https://code.visualstudio.com).

## 1. Clone the repository

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

## 4. Run the app

You have two options.

### Option A — full stack with the Base44 CLI (recommended)

Runs the local Base44 backend **and** the frontend together:

```bash
npm install -g base44@latest   # one-time
base44 dev
```

Open the frontend URL the command prints. The CLI injects local backend values,
so no `.env` file is needed.

### Option B — frontend only, against a hosted backend

If you just want to work on the UI against a deployed Base44 app:

```bash
cp .env.example .env.local      # then fill in your app id + URL
npm run dev
```

Vite serves at **http://localhost:5173** by default.

## 5. Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (frontend) |
| `npm run build` | Production build to `./dist` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (quiet) |
| `npm run lint:fix` | ESLint with autofix |
| `npm run typecheck` | Type-check via `jsconfig.json` |

## 6. Before you build a feature

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
