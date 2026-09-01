# Kickoff prompt — Tactical Squad Plan (multi-agent orchestration)

Paste the block below into a Claude Code session opened at the repo root with multi-agent orchestration enabled.

---

You are the orchestrator for the **Tactical Squad Plan** in the Rust Legions repository.

Read, in this order, before doing anything else: `CLAUDE.md`, `AGENTS.md`, `docs/VISION.md`, `docs/TACTICAL_SQUAD_PLAN.md`. The plan document is the contract — lanes, file ownership, payload shapes, phase order, and drift guards are all defined there and are not negotiable inside a lane. If a lane discovers a contract must change, it edits `docs/TACTICAL_SQUAD_PLAN.md` §4 first and states the change in its PR body.

## Your job

1. Spawn one sub-agent per worktree lane using `scripts/agent-worktree.sh tactical-<lane>` (branch `feat/tactical-<lane>`): **A** rules core, **B** field generator, **C** engine, **D** squad builder UI, **E** arena UI. Give each agent only: the four docs above, its owned file list from §3, `test/helpers/*`, and the payload contracts in §4. Do not give lanes each other's files.
2. Enforce the **phase order** in §5: A and B run in parallel first; C starts only after A and B are merged and `npm test` is green; D and E run in parallel after C, coding against §4 shapes and the fixture `test/fixtures/tactical-state.json` (have Lane C produce that fixture from its scripted-battle test).
3. Every lane PR must pass the §6 drift guards: `npm test`, `npm run lint`, `.claude/hooks/rules-guard.sh`; mirror test green; exported API of `base44/shared/tacticalEngine.ts` unchanged; no `package.json` changes; no hex colors or non-literal Tailwind classes; `@/` imports only; Ministry-voice copy; components ≤ ~60 lines, one per file.
4. Merge in order A/B → C → (hand-off) → D/E. Re-run `npm test` after each merge. Stop on the first red and route it back to the owning lane — never fix another lane's file yourself.
5. **Do not touch platform-owned files:** `base44/functions/gameEngine/entry.ts`, anything under `base44/entities/`, `Patch` records, or anything requiring a live backend deploy or `test_backend_function`. Collect every such need into `docs/prompts/PLATFORM_HANDOFF.md` as a checklist (exact function bodies to insert, exact entity schema JSON, exact action names) so the Base44 chat session can apply them after Phase 2.

## Guarding against drift

- Before spawning, write `docs/prompts/LANE_BRIEFS/<lane>.md` for each lane: its goal, owned files, the §4 shapes it consumes/produces, its acceptance criteria copied verbatim from §3, and the drift guards. Sub-agents work only from their brief plus the four docs.
- Every 2 PRs, diff `base44/shared/tactical.ts` against `src/lib/tactical/data.js` and confirm the mirror test still covers every exported table. If a lane added a table without a mirror, reject.
- Any number that appears in UI copy must be imported from `src/lib/tactical/data.js`. Grep for retyped constants in D/E PRs.
- Keep a running `docs/prompts/ORCHESTRATION_LOG.md`: lane, PR, tests added, contract sections touched, merge timestamp, and any §4 amendments.

## Deliverable back to the human

When A/B/C are merged (end of Phase 2): stop, post the `PLATFORM_HANDOFF.md` checklist, and wait — Phase 3 is applied in the Base44 session. Resume D/E only after being told Phase 3 is live. Finish by summarizing: files added per lane, tests added, contract amendments, and open questions — no code in the summary.