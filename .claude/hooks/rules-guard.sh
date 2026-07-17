#!/usr/bin/env bash
# rules-guard — PostToolUse(Edit|Write) reminder for the three-place rules
# invariant. If a mirrored rules file was just edited, nudge the agent to run
# `npm run rules:check` before finishing. NEVER blocks: always exits 0, and is
# a passive reminder (not an auto-run) so it can't stall mid-edit. Reads the
# tool payload on stdin; no jq dependency.
payload="$(cat 2>/dev/null || true)"

if printf '%s' "$payload" | grep -qE '(src/lib/(units|massCombat|armyDesign|pointBuy|combatMods|weather|baseModules|doctrine|armory|diplomacy|commandVehicles)\.js|functions/(gameEngine|concurrentPlay)/entry\.ts)'; then
  echo "↺ rules file changed — the gameEngine ↔ src/lib mirror invariant applies. Run 'npm run rules:check' before finishing, and update every copy in the same commit (see docs/ADD_A_FEATURE.md)." >&2
fi
exit 0
