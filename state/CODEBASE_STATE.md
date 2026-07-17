# Codebase State

**Last updated:** 2026-07-17
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
`push_subscriptions`, `reminders`, `questions`, `activity_log`,
`corrections`. Migrations in `supabase/migrations/`, numbered and applied
in order — that directory is the source of truth for schema, not this file
(this file just says what exists, not the DDL).

- `profiles`, `items`, `dumps`, `feedback`, `profile_snapshots`, `questions`,
  `activity_log`, `corrections`: RLS scoped to `auth.uid() = user_id`,
  browser writes directly.
- `push_subscriptions`, `reminders`: RLS enabled, **zero client policies** —
  browser has no access; only the `sync_item_reminder` trigger (SECURITY
  DEFINER) and service-role-keyed API routes touch them. Deliberate — see
  cortex.
- `items` also carries (0006/0007/0008/0009): `status` (`open|done|parked|
  archived`), `parked_reason` (`clarify|rest|null` — splits the two
  unrelated meanings `status='parked'` used to conflate: "the system
  doesn't know the what" vs. "the user isn't ready yet"; see cortex),
  `completed_at`, `deferrals`, `source` (verbatim capture fragment),
  `flagged` (priority axis, separate from `today`), `quiet` (opt-out of an
  item's default reminder), `reminder_offsets` (jsonb array of
  minutes-before, default `[15]`; a deadline-only item defaults to
  `[1440]` — see `prepareParsedItems` in `lib/parse.js`), `dump_id` (FK to
  `dumps`, links an item back to the capture that produced it).
  `complete()` in `Sprekta.jsx` still hard-deletes rather than setting
  `status='done'`, and Plan/Today don't yet filter by `status` — that's
  Activity Phase A, not yet built (see cortex + Capture's ADR).
- `reminders` also carries `offset_minutes` — an item can have multiple
  reminders (one row per offset), not just one.
- Trigger: `items_sync_reminder` on `items`, fires `sync_item_reminder()` —
  loops over `reminder_offsets` and keeps `reminders` in sync with
  `fixed_time`/`device_id`/`title`/`reminder_offsets`/`deadline`/`quiet`.
  Also fires a reminder off `deadline` (date-only, no `fixed_time`) at a
  fixed default local time (9am) when set; respects `quiet` (no reminders
  at all when true).
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
- **Capture** (`Capture.jsx`, new — the app's landing tab): the intake
  surface, restyled to the design doc's actual Laurel palette (`INK
  #1D1B17`/`ACC #0F6E56`/`STONE`/`FAINT`/`HAIR`/`LINE`, Fraunces serif for
  item-view titles) after a design review found the first pass had drifted
  into a generic purple-accent look — see cortex. Composer (no voice in
  v1) → an optimistic pending entry appears instantly with a shimmer
  skeleton ("got it" → "sorting it out") while the parse call is in
  flight, then joins the `CAPTURED` feed for real, grouped by `dump_id`
  (a single-item capture is a bare feed row — the item's own marker,
  facts, and a relative timestamp, no tray icon/summary/footer at all;
  a multi-item capture is a de-carded row that expands to a white card,
  footer = collapsed "You said" + a whole-dump undo icon. The single- vs.
  multi-item form is pinned to the dump's original parse count —
  `dumps.item_count` — not however many items currently survive, so
  archiving down to one survivor doesn't collapse a 3-item capture into
  the bare-row form). Row
  markers/facts are read off `kind`/`fixed_time`/`status`/`parked_reason`
  only — never a question's tier. Tap a row for a full-page item view
  (Fraunces title, quick-action chips incl. `quiet this one`, a When/Remind
  fact-row card whose `change`/`+ add` prefill the say-box, and the say-box
  itself — the *only* place to answer a `questions` row until Activity
  ships). "Discuss" (💬) is a one-shot focus chip that scopes the main
  composer to one item for a spoken correction. See
  `sprekta-capture-design-doc.md` (Downloads) for the full spec; see
  Feature status below for what's still deferred.
- **Main app** (`Sprekta.jsx`, ~1050 lines): Capture / Today / Plan /
  Calendar / Settings tabs. Plan's old Offload textarea and inline
  questions box are gone — Capture now owns "get it out of your head"
  entirely; Plan's "Think it through" full-screen chat entry point was
  removed too (the shared chat overlay itself is untouched, still used by
  Today and item-detail). Settings has profile editing, feedback,
  reminders toggle, and an admin-only (`VITE_ADMIN_EMAIL`) dev-tools panel
  (save/load profile snapshots, reset to blank, load sample tasks, re-run
  onboarding, send test notification, raw-state import/export).

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
- Capture v1 (composer, feed, item view, quick-action chips, scoped
  correction via say-box/discuss, `questions` answering) — live-tested via
  a disposable account: multi-item dumps, the vague-verb tier-3 question
  path, flag/rest/revive/remove (with undo), and entry fold/collapse all
  verified against real Supabase writes. The actual Claude parse/
  correction round-trip was verified by code review + the existing
  `runOffload`/`sendChat` pattern it's built on, not a live model call in
  this pass (no local serverless runtime available in the dev sandbox
  used) — verify the first real capture on `app.sprekta.com` after deploy.

**Explicitly out of scope for v1 (don't build unless asked):**
- Post-onboarding just-in-time signal acquisition (noticing "cake tasting
  Saturday" mid-dump and asking about it) — mentioned in the onboarding
  copy, not implemented.
- "Next Thursday" vs "this Thursday" disambiguation — a bare weekday
  always means its next occurrence, today included.
- Reminder snooze, reminders for todos/date-only items, retry logic,
  per-user notification preferences beyond one on/off toggle (multiple
  reminder offsets per item are supported — see `reminder_offsets` above).
- Email/SMS reminder fallback.
- Capture: voice/mic input, the "torn" divergent-parse UI, the agentic
  "action" verb type, the personalization/learning layer (§10 of the
  design doc), point-of-use correction (reminder fire/calendar/Today),
  9/10 auto-urgency detection, and the Activity tab itself (next up —
  Capture's `questions`/`activity_log`/`corrections` rows are what it will
  review).

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
- 2026-07-16: Merge feature/capture: Capture tab, schema reconciliation (9 files)
- 2026-07-16: Merge fix/capture-composer-and-invented-context (2 files)
- 2026-07-16: Merge fix/capture-design-review (7 files)
