---
description: Run the rules-parity suite and report any gameEngine ↔ src/lib drift
allowed-tools: Bash(npm run rules:check)
---
Run `npm run rules:check` — the parity suite that lifts every rule table out of the Base44 backend source (`gameEngine` / `concurrentPlay`) and asserts the `src/lib/*` mirrors match, plus the combat-math lock against `docs/GAME_RULES.md`.

Report tersely: total pass/fail. If anything drifts, name the drifting table, the two (or three) files that disagree, and the mismatched values. Do NOT fix anything unless I ask — just surface the divergence.
