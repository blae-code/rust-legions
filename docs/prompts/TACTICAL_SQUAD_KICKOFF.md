# Kickoff prompt — Tactical Squad Plan (multi-agent orchestration)

Paste the block below into a Claude Code session opened at the repo root with multi-agent orchestration enabled.

---

You are the orchestrator for the **Tactical Squad Plan** in the Rust Legions repository.

## Repository

- GitHub: `https://github.com/blae-code/rust-legions` (`blae-code/rust-legions`). Integration branch: `main`.
- If not already inside the repo, clone it: `git clone https://github.com/blae-code/rust-legions.git && cd rust-legions && npm install`. Then `git fetch origin && git checkout main && git pull --ff-only`.
- The repo is two-way synced with the Base44 Builder: **everything merged to `main` lands in the live app's builder on the next sync.** Never merge a red lane to `main`. Lane branches (`feat/tactical-<lane>`) are pushed to origin and opened as PRs against `main`; the orchestrator merges them in the §5 order.
- Backend functions run only on Base44 — pushing `base44/**` compiles nothing locally, which is why platform-owned files are excluded from lanes.

Read, in this order, before doing anything else: `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md`, `docs/TACTICAL_SQUAD_PLAN.md`. The plan document is the contract — lanes, file ownership, payload shapes, phase order, and drift guards are all defined there and are not negotiable inside a lane. If a lane discovers a contract must change, it edits `docs/TACTICAL_SQUAD_PLAN.md` §4 first and states the change in its PR body.

## Your job

1. Spawn one sub-agent per worktree lane using `scripts/agent-worktree.sh tactical-<lane>` (branch `feat/tactical-<lane>`, pushed to `origin`, PR against `main`). **Systems lanes:** **A** rules core, **B** field generator, **C** engine, **D** squad builder UI, **E** arena UI. **Content lanes:** **F** units/specialists/upgrades, **G** research/armory/decrees, **H** factions/houses/lore. Give each agent only: the four docs above, its owned file list from §3, `test/helpers/*`, and the contracts in §4. Content lanes additionally get `docs/LORE.md`, `docs/FACTION_ROSTER.md`, `docs/GEAR_LIBRARY.md`, `docs/TECH_DESIGN.md`, `docs/HERALD_VOICES.md`, `docs/GAME_RULES.md` and the current `src/lib/imageLibrary.js` (for the `P(...)` placeholder pattern and existing keys). Do not give lanes each other's files.
2. Enforce the **phase order** in §5. Systems track: A and B in parallel; C after A/B merge with `npm test` green; D and E in parallel after C, coding against §4 shapes and the fixture `test/fixtures/tactical-state.json` (Lane C produces it from its scripted-battle test). Content track runs concurrently: F and G in parallel from the start; H after F/G merge (H references their keys). F must merge before D starts.
2b. **Content lanes author data and prose only — never visuals.** Everything that needs art is registered as a placeholder plate in `src/lib/imageLibrary.js` (`P(key, category, title, desc, prompt, aspect)`, `url` null, prompt without the house style). No image files, no SVGs, no `PLATE_URLS`, no `UnitSprite.jsx` edits — the Base44 session generates all art from those placeholders. Content lanes go **deep and wide**: meet or exceed every minimum in §3 F–H (16+ squad types, 10 specialists, 10 upgrade kits, ≥20 techs with capstones, 20+ armory items incl. relic projects, 13 house presets with unique rosters, herald voices for all, 40+ codex entries, 10 settlement hooks). Every effect is numeric via the §4 `effects[]` vocabulary; every existing key is preserved byte-for-byte; every new rules section in `GAME_RULES.md` is marked `[PROPOSED — awaiting platform wiring]`.
3. Every lane PR must pass the §6 drift guards: `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`; mirror test green; exported API of `base44/shared/tacticalEngine.ts` unchanged; no `package.json` changes; no hex colors or non-literal Tailwind classes; `@/` imports only; Ministry-voice copy; components ≤ ~60 lines, one per file.
4. Merge in order A/B → C → (hand-off) → D/E. Re-run `npm test` after each merge. Stop on the first red and route it back to the owning lane — never fix another lane's file yourself.
5. **Do not touch platform-owned files:** `base44/functions/gameEngine/entry.ts`, anything under `base44/entities/`, `Patch` records, or anything requiring a live backend deploy or `test_backend_function`. Collect every such need into `docs/prompts/PLATFORM_HANDOFF.md` as a checklist (exact function bodies to insert, exact entity schema JSON, exact action names) so the Base44 chat session can apply them after Phase 2.

## Guarding against drift

- Before spawning, write `docs/prompts/LANE_BRIEFS/<lane>.md` for each lane: its goal, owned files, the §4 shapes it consumes/produces, its acceptance criteria copied verbatim from §3, and the drift guards. Sub-agents work only from their brief plus the four docs.
- Every 2 PRs, diff `base44/shared/tactical.ts` against `src/lib/tactical/data.js` and confirm the mirror test still covers every exported table. If a lane added a table without a mirror, reject.
- Any number that appears in UI copy must be imported from `src/lib/tactical/data.js`. Grep for retyped constants in D/E PRs.
- Keep a running `docs/prompts/ORCHESTRATION_LOG.md`: lane, PR, tests added, contract sections touched, merge timestamp, and any §4 amendments.
- For content PRs, additionally check: no renamed/removed catalog keys; each new squad/tech/decree/house has its placeholder plate; each `pts` value appears in the Points Audit; lore names don't collide with `docs/LORE.md`; no PII; placeholder prompts don't repeat the house style. Maintain `docs/prompts/ART_MANIFEST.md` — every placeholder key added (key, category, aspect, one-line subject) so the Base44 session can batch-generate them.

## Deliverable back to the human

When A/B/C and F/G/H are merged (end of Phase 2 + C2): stop, post `PLATFORM_HANDOFF.md` (engine wiring, entity changes, catalog imports, effect application, locks, herald voices) and `ART_MANIFEST.md` (every placeholder plate to generate), and wait — Phase 3 and C3 are applied in the Base44 session. Resume D/E only after being told Phase 3 is live. Finish by summarizing: files added per lane, content counts per catalog, tests added, contract amendments, and open questions — no code in the summary.