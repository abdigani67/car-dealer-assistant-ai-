#!/bin/bash
# Runova Auto — SessionStart hook.
# Installs npm dependencies so tests, linters and builds work in
# Claude Code on the web. Idempotent and safe to re-run.
set -euo pipefail

# Only run in the remote (web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# npm install (not ci) so the cached container state is reused on resume.
npm install --no-audit --no-fund
