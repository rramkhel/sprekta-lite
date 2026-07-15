# Sprekta Lite

An AI-native calendar/to-do app. Dump your day in plain language, Claude
sorts it into projects and a plan; onboarding does the same for a first-time
user before their first dump even happens. Multi-user, Supabase-backed, Vite
+ React, deployed to `app.sprekta.com`.

**Read `state/CODEBASE_STATE.md` first** for what's actually built and
running right now — this file is the map, that file is the territory.

## Orientation, in order

1. `state/CODEBASE_STATE.md` — current state: stack, DB schema, API routes,
   feature status (done vs. explicitly out of scope), infra inventory.
2. `docs/codemap.md` — concept → exact file:line. Use this before grepping
   cold.
3. `agent/knowledge/cortex.md` — decisions and gotchas with the *why*
   attached. Read before touching anything that looks like it could be
   simplified, reverted, or "fixed" — it might be that way on purpose.
4. `supabase/migrations/` — the actual schema history, numbered and applied
   in order. Source of truth for the DB, not any prose description of it.

## Non-obvious things worth knowing before you start

- **This repo was fully rebuilt once already** (vanilla-JS → Vite+React).
  If you're working from an old handoff doc, a saved prompt, or a memory
  that mentions `app.js`, `js/*.js`, `api/events.js`, or a root-level
  `manifest.json`/`sw.js` — that's the dead architecture. Translate the
  *intent*, not the file paths. See cortex ADR-001.
- **The model never resolves dates or times.** It only echoes what the user
  literally said (`stated_date`/`stated_time` in the parse schema); all
  date math and timezone conversion happens deterministically in
  `src/lib/dateResolve.js`. Don't add a prompt that asks the model to
  compute a final date/timestamp itself — see cortex ADR-004.
- **`reminders` and `push_subscriptions` have zero client RLS policies on
  purpose.** The browser cannot read or write either table. Only a
  `SECURITY DEFINER` trigger and service-role-keyed API routes touch them.
- **Claude Sonnet 5 thinks by default**, and those tokens count against
  `max_tokens`. If a parse call fails with no obvious cause, check
  `stop_reason` in the raw response before assuming the prompt is broken.
- **Toggle/chip state must use the functional `setState` form**
  (`setX(prev => ...)`), never `setX(computedFromClosedOverValue)`. See
  cortex's stale-closure gotcha — this bit onboarding once already.

## Working conventions

- **Never commit directly to `main`.** Branch first: `feature/<name>`,
  `fix/<name>`, or `chore/<name>`. Enforced by
  `.claude/hooks/pre-commit.sh` (installed at `.git/hooks/pre-commit` — see
  "Hook setup" below if it's not firing).
- Deploy is manual: `vercel --prod` from `main`, after merging. Not
  git-triggered — Vercel doesn't watch GitHub for this project, it's
  deployed directly from the local build. GitHub (`rramkhel/sprekta-lite`)
  is kept in sync automatically instead: `post-merge.sh` pushes `main` to
  `origin` right after logging to `CODEBASE_STATE.md`. GitHub is for
  visibility (e.g. a GitHub MCP connection reading current code) — it is
  not part of the deploy path.
- DB changes are numbered migrations in `supabase/migrations/`, applied via
  the Supabase Management API (see any recent commit for the exact `curl`
  pattern) — there's no local Supabase CLI workflow set up for this repo.
- **Never read `.env` directly** (Read/cat/grep) — source values into shell
  commands (`$(source .env && printf '%s' "$VAR")`) so secrets never land
  in a transcript. Same rule for any API response that might echo a
  secret back (e.g. Supabase's `config/auth` endpoint echoes `smtp_pass`)
  — filter before printing.
- Test against throwaway accounts (`supabase.auth.admin.generateLink` +
  `admin.deleteUser` after), not the founder's real account, when
  verifying auth/onboarding/data flows end-to-end.

## Hook setup (once per clone)

`.git/hooks/` isn't version-controlled, so a fresh clone needs the hooks
wired up once:

```bash
ln -sf ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
ln -sf ../../.claude/hooks/post-merge.sh .git/hooks/post-merge
chmod +x .git/hooks/pre-commit .git/hooks/post-merge
```

## Where things live

```
src/App.jsx          auth gate — magic link + 6-digit OTP code
src/Onboarding.jsx    first-run flow (intro carousel + 8-screen questions)
src/Sprekta.jsx       the app itself (Today/Plan/Calendar/Settings)
src/lib/              device id, timezone-safe date resolution, push helpers
api/claude.js         Anthropic proxy (session-verified)
api/push/             subscribe + admin test-notification endpoints
api/reminders/        cron-triggered dispatcher
supabase/migrations/  schema history, numbered
public/sw.js          service worker (push + notification click)
state/CODEBASE_STATE.md   current state snapshot
docs/codemap.md           concept → file:line
agent/knowledge/cortex.md decisions + gotchas
```
