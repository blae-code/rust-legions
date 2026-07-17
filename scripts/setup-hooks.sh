#!/usr/bin/env bash
# setup-hooks.sh — point git at the committed hooks directory (one-time, per clone).
# The worktree helper does this automatically for new worktrees; run this once in
# your primary checkout.
set -euo pipefail
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
echo "✔ core.hooksPath = .githooks  (pre-push gate active)"
echo "  bypass a single push with:  git push --no-verify"
