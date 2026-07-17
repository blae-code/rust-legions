#!/usr/bin/env bash
# agent-worktree.sh — isolated git worktrees for parallel Claude Code sessions.
#
# Branch-per-task is not enough on its own: two agents sharing ONE working
# directory still share the checked-out branch and every uncommitted file.
# A worktree gives each concurrent agent its own directory + branch off
# origin/main, sharing history but nothing uncommitted. See CONTRIBUTING.md.
#
#   scripts/agent-worktree.sh new <topic>    # create ../rl-<topic> on claude/<topic>
#   scripts/agent-worktree.sh list           # list all worktrees
#   scripts/agent-worktree.sh rm  <topic>    # remove the worktree (keeps the branch)
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
PARENT="$(dirname "$REPO_ROOT")"
cmd="${1:-help}"

case "$cmd" in
  new)
    topic="${2:?usage: agent-worktree.sh new <topic>}"
    branch="claude/${topic}"
    dir="${PARENT}/rl-${topic}"
    [ -e "$dir" ] && { echo "✗ $dir already exists"; exit 1; }
    git -C "$REPO_ROOT" fetch origin
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/${branch}"; then
      git -C "$REPO_ROOT" worktree add "$dir" "$branch"
    else
      git -C "$REPO_ROOT" worktree add -b "$branch" "$dir" origin/main
    fi
    git -C "$dir" config core.hooksPath .githooks   # activate the pre-push gate
    echo "✔ worktree ready: $dir   (branch $branch)"
    echo "  next:  cd '$dir' && npm ci && claude"
    echo "  (each worktree needs its own node_modules — run npm ci once)"
    ;;
  list)
    git -C "$REPO_ROOT" worktree list
    ;;
  rm)
    topic="${2:?usage: agent-worktree.sh rm <topic>}"
    dir="${PARENT}/rl-${topic}"
    git -C "$REPO_ROOT" worktree remove "$dir"
    echo "✔ removed $dir  (branch claude/${topic} kept — delete with: git branch -D claude/${topic})"
    ;;
  *)
    grep '^#' "$0" | sed -n '2,12p' | sed 's/^# \{0,1\}//'
    ;;
esac
