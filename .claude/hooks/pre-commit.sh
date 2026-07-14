#!/bin/bash
# Pre-commit gate — blocks bad commits before they enter history.
# Pattern borrowed from ironbrev-v2's .claude/hooks/pre-commit.sh, trimmed
# for a single-branch-at-a-time solo project.

ERRORS=0

# 1. No .env files staged
if git diff --cached --name-only | grep -qE '(^|/)\.env(\..*)?$'; then
  echo "BLOCKED: .env file staged for commit. Remove it."
  ERRORS=$((ERRORS + 1))
fi

# 2. No obvious API keys/secrets in staged ADDITIONS to code files. Scans
# additions only (deletions can't introduce a secret into the new tree).
# Excludes this script itself (contains the patterns literally) and
# markdown (docs legitimately reference key *names*, not values).
STAGED_ADDITIONS=$(git diff --cached -U0 ':!.claude/hooks/pre-commit.sh' ':!*.md' | grep '^+' | grep -v '^+++')
if echo "$STAGED_ADDITIONS" | grep -qiE 'sk[-_](live|test|ant)[-_][a-zA-Z0-9]{20,}|re_[a-zA-Z0-9]{30,}|sbp_[a-zA-Z0-9]{20,}|eyJhbGciOi[a-zA-Z0-9_.-]{40,}'; then
  echo "BLOCKED: Possible API key/token in staged changes. Check your diff."
  ERRORS=$((ERRORS + 1))
fi

# 3. No direct commits to main — forces every change through a named branch
# so there's always a reviewable diff before it lands.
BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$BRANCH" = "main" ]; then
  echo "BLOCKED: Direct commit to main. Create a feature/fix/chore branch first."
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "=== $ERRORS issue(s) found. Commit blocked. ==="
  exit 1
fi

echo "=== Pre-commit checks passed ==="
