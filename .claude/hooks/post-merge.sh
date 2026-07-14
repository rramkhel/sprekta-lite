#!/bin/bash
# Post-merge: verifies the build still works on main and logs the merge
# into state/CODEBASE_STATE.md so that file can't silently go stale.
# Pattern borrowed from ironbrev-v2's .claude/hooks/post-merge.sh.

set -eo pipefail
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

echo "=== Post-merge ==="

echo "[1/2] Verifying build..."
if ! BUILD_OUTPUT=$(npm run build 2>&1 | tail -8); then
  echo "BUILD FAILED after merge to main:"
  echo "$BUILD_OUTPUT"
  exit 1
fi
echo "  Build: PASS"

echo "[2/2] Updating state/CODEBASE_STATE.md..."
DATE=$(date +%Y-%m-%d)
LAST_SUBJECT=$(git log -1 --pretty=%s | cut -c1-90)
FILE_COUNT=$(git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -c '[^[:space:]]' || echo "?")
if [ -f state/CODEBASE_STATE.md ]; then
  echo "- $DATE: $LAST_SUBJECT ($FILE_COUNT files)" >> state/CODEBASE_STATE.md
  echo "  Logged: $LAST_SUBJECT"
else
  echo "  state/CODEBASE_STATE.md not found — skipped."
fi

echo "=== Post-merge complete ==="
