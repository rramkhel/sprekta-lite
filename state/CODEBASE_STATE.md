# Codebase State

**Last updated:** 2026-07-14
**Updated by:** Claude Code

Snapshot of what's actually built and running, so a fresh agent (or you,
months from now) doesn't have to reconstruct it by reading every file. See
`agent/knowledge/cortex.md` for the *why* behind anything surprising here,
and `docs/codemap.md` for exact file:line pointers into the frontend.

## Current state

Live, single-user-tested (founder + a handful of disposable test accounts),
not yet at real multi-friend scale. Deployed to `app.sprekta.com` on every
merge to `main` via `vercel --prod` (manual CLI, not git-triggered).

## Stack

- **Frontend:** Vite + React (no router — three top-level components:
  `App.jsx` auth gate, `Onboarding.jsx` first-run flow, `Sprekta.jsx` the
  app itself). Tailwind for utility classes, inline styles for everything
  else (matches the original prototype's style).
- **Backend:** Supabase (Postgres + Auth + RLS) for all data. No general
  application server — the browser talks to Supabase directly for
  items/profiles/dumps/feedback (RLS-scoped to `auth.uid()`); a small set
  of Vercel serverless functions in `api/` handle the things that must not
  run in the browser (the Anthropic key, service-role-keyed writes, the
  cron-triggered dispatcher).
- **AI:** Claude Sonnet 5 via `api/claude.js`, which verifies the caller's
  Supabase session before proxying to the Messages API.
- **Auth:** Supabase magic-link + 6-digit OTP code (both from the same
  `signInWithOtp` email — see cortex "iOS home-screen PWA" entry).
- **Push:** Web Push (VAPID), Supabase pg_cron dispatching every minute.

## Database (Supabase project `sprekta-lite-v2`, ref `iwtoiedigtzsiwllswim`)

Tables: `profiles`, `items`, `dumps`, `feedback`, `profile_snapshots`,
`push_subscriptions`, `reminders`. Migrations in `supabase/migrations/`,
numbered and applied in order — that directory is the source of truth for
schema, not this file (this file just says what exists, not the DDL).

- `profiles`, `items`, `dumps`, `feedback`, `profile_snapshots`: RLS scoped
  to `auth.uid() = user_id`, browser writes directly.
- `push_subscriptions`, `reminders`: RLS enabled, **zero client policies** —
  browser has no access; only the `sync_item_reminder` trigger (SECURITY
  DEFINER) and service-role-keyed API routes touch them. Deliberate — see
  cortex.
- Trigger: `items_sync_reminder` on `items`, fires `sync_item_reminder()` —
  keeps `reminders` in sync with `fixed_time`/`device_id`/`title`.
- Extensions enabled: `pg_cron`, `pg_net`.
- Cron job: `sprekta-reminder-dispatch`, every minute, POSTs
  `/api/reminders/dispatch` with `CRON_SECRET`.

## API routes (`api/`)

- `claude.js` — Anthropic proxy, verifies session, forces model +
  `max_tokens: 6000` server-side regardless of what the client sends.
- `push/subscribe.js` — verifies session, upserts a push subscription
  (service role).
- `push/test.js` — verifies session, sends one test push to the caller's
  `deviceId` (used by the admin-only dev-tools button).
- `reminders/dispatch.js` — `CRON_SECRET`-gated, no user auth. Queries due
  reminders, sends via `web-push`, marks `sent_at` unconditionally (no
  retries in v1), prunes dead subscriptions on 404/410.

## Frontend surfaces

- **Auth gate** (`App.jsx`): email → magic link *and* 6-digit code, either
  completes sign-in.
- **Onboarding** (`Onboarding.jsx`, ~950 lines): 7-slide intro carousel +
  8-screen real question flow (name/work/days/standing/protect/wish/
  tomorrow/read) + optional life/people branch. Final CTA persists the
  profile and runs the real parse on the "tomorrow" dump.
- **Main app** (`Sprekta.jsx`, ~1100 lines): Today / Plan / Calendar /
  Settings tabs. Plan has Offload (dump → parse) and Think-it-through
  (chat) modes. Settings has profile editing, feedback, reminders toggle,
  and an admin-only (`VITE_ADMIN_EMAIL`) dev-tools panel (save/load
  profile snapshots, reset to blank, load sample tasks, re-run onboarding,
  send test notification, raw-state import/export).

## Feature status

**Done and verified live:**
- Multi-user auth (magic link + OTP code), RLS-scoped data.
- Dump/chat parsing → items, with project auto-detection (never
  pre-seeded).
- Onboarding → first plan, wired to the same parse path as regular
  Offload.
- `fixed_time` resolution from natural language (`stated_date`/
  `stated_time` → deterministic app-side date math).
- Reminder creation/update/delete lifecycle (Postgres trigger, directly
  SQL-tested against all edge cases).
- Web push infrastructure end-to-end except the final "grant OS
  permission" step, which requires a real user gesture automation can't
  simulate — needs one manual pass on a real device.

**Explicitly out of scope for v1 (don't build unless asked):**
- Post-onboarding just-in-time signal acquisition (noticing "cake tasting
  Saturday" mid-dump and asking about it) — mentioned in the onboarding
  copy, not implemented.
- "Next Thursday" vs "this Thursday" disambiguation — a bare weekday
  always means its next occurrence, today included.
- Reminder snooze, custom offsets, reminders for todos/date-only items,
  retry logic, per-user notification preferences beyond one on/off toggle.
- Email/SMS reminder fallback.

## Infra inventory (names only — see `.env`/Vercel for values)

Vercel project: `sprekta-lite` (org `rramkhels-projects`), domain
`app.sprekta.com`. Env vars (Production + Development): `ANTHROPIC_API_KEY`,
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`,
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`VITE_VAPID_PUBLIC_KEY`, `CRON_SECRET`.

Email: Resend, domain `mail.sprekta.com`, wired as Supabase custom SMTP.

## Changelog

(Appended automatically by `.claude/hooks/post-merge.sh` on every merge to
`main` — one line per merge, newest at the bottom. Don't hand-edit above
this point without also updating "Last updated" and "Current state" above.)
- 2026-07-13: Set up agent-facing repo infrastructure (7 files)
- 2026-07-13: Fix post-merge hook leaving its own changelog write uncommitted (2 files)
- 2026-07-15: Fix example dump text blocking real input, soften the offload CTA (1 files)
- 2026-07-15: Respect the iOS notch/status-bar safe area at the top (2 files)
- 2026-07-15: Auto-push main to GitHub on every merge (2 files)
- 2026-07-15: Simplify Offload copy: shorter placeholder, "Send" CTA, drop caption (1 files)
- 2026-07-15: Calm down the Offload send button (1 files)
- 2026-07-15: Redesign "Think it through" as a full-screen chat, Claude-mobile-style (1 files)
