# Cortex

Decisions, gotchas, and learnings for whoever (human or agent) touches this
repo next. Pattern borrowed from ironbrev-v2's `agent/knowledge/cortex/` —
right-sized here into one file since sprekta-lite doesn't yet have a
marketing/customer-truth layer worth a separate institutional cortex.

Update this when you make a decision a future agent could plausibly
re-litigate or revert by accident, or hit a gotcha that cost you real time
to diagnose. Don't log routine feature work — that's what `git log` and
`state/CODEBASE_STATE.md` are for.

---

## Architecture Decision Records

### ADR-001: Vite + React over the old vanilla-JS app
The original `sprekta-lite` was a vanilla-JS app (`app.js`, `js/*.js`,
`api/events.js`, a `conversations`/`todos`/`triage` schema) built across many
early sprints. It was fully deleted and rebuilt from scratch as Vite + React
(`src/App.jsx`, `src/Sprekta.jsx`) to match the finished `sprekta.jsx`
prototype the founder was iterating on. **Consequence:** any old handoff doc,
saved prompt, or memory referencing `app.js`, `js/notifications.js`,
`api/events.js`, `api/conversation/[id]/message.js`, or a root-level
`manifest.json`/`sw.js` is describing a codebase that no longer exists —
translate the intent onto the current file layout (`src/`, `api/`,
`public/`), don't copy the paths literally. This bit us once already: the
web-push-reminders handoff (see ADR-004) was written against the dead
architecture.

### ADR-002: Fresh Supabase project, not the original
The original Supabase project (`sprekta-lite`, ref `tqezvppmechaczaulput`)
was paused >90 days and permanently unrecoverable via the Management API
("Project has been paused for more than 90 days and cannot be restored").
Live project is now **`sprekta-lite-v2`**, ref `iwtoiedigtzsiwllswim`. The
old project was later hard-deleted from the org (nothing to migrate — it had
no recoverable data). If you see the old ref anywhere (docs, memory, old
`.env` backups), it's stale.

### ADR-003: Reminders are a Postgres trigger, not a new API layer
The web-push-reminders handoff assumed an `api/events.js` choke point that
doesn't exist in this app — items are written directly from the browser via
the Supabase client (RLS-scoped to `auth.uid() = user_id`). Rather than
introduce a new server-side write path just for this feature, reminder-row
lifecycle is owned by a `SECURITY DEFINER` trigger (`sync_item_reminder`,
migration `0005_reminders.sql`) that reacts to `items` INSERT/UPDATE OF
`fixed_time, device_id, title`. See `docs/codemap.md` for exact behavior.
`reminders` and `push_subscriptions` have RLS enabled with **zero policies**
for `authenticated`/`anon` — the browser has no access at all; only the
trigger (runs as table owner) and the service-role-keyed API routes
(`api/push/*`, `api/reminders/dispatch.js`) touch them. Don't add a client
policy to either table without a real reason — that's the whole point of the
lockdown.

### ADR-004: The model never resolves dates or times
`fixed_time` existed as a DB column since the original launch brief but
nothing ever populated it — the LLM parse schema only emitted a bare
`deadline` (date, no time) and a prose `suggested_slot` guess. Extending it
naively (asking the model to emit a resolved `fixed_time` directly) would
mean trusting LLM arithmetic for calendar math and timezone conversion,
which is exactly the kind of thing that's silently wrong 5% of the time and
hard to catch. Instead: `ITEM_FIELDS` (`src/Sprekta.jsx`) asks for
`stated_date`/`stated_time` — the model only ever echoes what was literally
said (an ISO date, or a bare `today`/`tomorrow`/weekday token, or an
explicit 24h clock time) and is explicitly told not to compute anything.
All resolution — including DST-safe timezone conversion — happens
deterministically in `src/lib/dateResolve.js`, in application code, using
`Intl.DateTimeFormat` (no new dependency). "Ambiguous ('thursday afternoon')
means null" — no guessing a clock time from a vague part-of-day.

### ADR-006: Capture built before Activity, schemas reconciled together first
Three docs arrived describing overlapping/conflicting next work: an Activity
handoff (ready-to-build, real file:line refs), a Capture "valet" redesign
(its own data needs, no file refs, not yet reconciled with the real schema),
and a thin-loop-and-panel spec (different stack — Next.js/TS — and a
different schema entirely). The founder's calls, in order: (1) thin-loop is
**superseded, ignore it** — the app already has a working thin loop in
production; (2) reconcile both real schemas *together* before building
either surface, rather than building Activity first and bolting Capture's
needs on later; (3) scope plural reminders-per-item into that reconciliation
now rather than deferring; (4) build **Capture before Activity** — Activity
is a pure review layer over what Capture produces (its sweep/needs-you/
handled sections have nothing real to show until Capture is generating
`questions`/`activity_log`/`corrections` rows). Migrations `0006` (Activity's
status/questions/activity_log), `0007` (Capture's flagged/reminder_offsets/
corrections, reconciled), `0008` (dump_id linkage) were written and applied
together, verified live against the real Supabase project, before any
Capture UI code was written.

**Naming collision, resolved by comment not by renaming:** both docs use the
word "parked" for two different concepts. Activity's DB value
`items.status='parked'` means *resting* — the user deferred an
otherwise-well-formed item ("not ready to call Kevin yet"). The Capture
design doc's "parked" state means the *opposite* problem — the system
doesn't know the *what* yet (a genuinely vague capture like "grandma flowers
church monday"). That second sense is **not a DB status** — it's just an
open item with an unanswered `questions` row (tier 2/3) attached. Migration
`0006`'s SQL comment documents this explicitly so nobody re-derives the
confusion. If you're about to add a `status` value or a UI label spelled
"parked", check which sense you mean first.

**What Capture v1 actually shipped** (see `state/CODEBASE_STATE.md` Feature
status and `docs/codemap.md` for specifics): composer + feed + item view +
quick-action chips + the shared `applyCorrection` say-box/discuss channel,
live-tested against a disposable Supabase account. Two things explicitly
punted rather than half-built: (1) Plan/Today still don't filter items by
`status`, so `archived`/`parked` items still show there — that's Activity
Phase A (per the handoff, `complete()` should stop hard-deleting and become
`status='done'`, and derived lists should filter `status='open'`), not
touched here to avoid scope-creeping into Activity's own work. (2) the
animated dwell/shimmer/fold sequence from the design doc (§4) was
simplified to a plain expand/collapse — newest entry open by default,
everything else collapsed, tap to toggle — since the *end state* (a feed of
foldable entries) is what carries the "nothing falls through" trust
property, not the transition animation.

### ADR-005: No permanent `dev` branch — feature/fix/chore branches into main
Borrowed from ironbrev-v2's branch discipline, trimmed: no sprint-numbering
system (S-0xx/H-0xx) since this is a single-person, single-thread-of-work
project — that ceremony pays for itself at ironbrev's scale, not here. The
part worth keeping is simpler: **never commit directly to `main`** (enforced
by `.claude/hooks/pre-commit.sh`), branch per change
(`feature/`, `fix/`, `chore/` prefix + short name), merge to `main`, deploy
from `main` via `vercel --prod`. `state/CODEBASE_STATE.md` gets a changelog
line automatically on merge via `.claude/hooks/post-merge.sh`.

---

## Platform gotchas

### Claude Sonnet 5 thinks by default and it counts against max_tokens
No `thinking` param needs to be sent — the model can spend its entire
`max_tokens` budget on extended thinking and emit zero answer text
(`stop_reason: "max_tokens"`, `content: [{type: "thinking"}]` only, no
`text` block). Bit us in production: `api/claude.js` had `max_tokens: 2048`
inherited from the original launch brief, which was enough most of the
time but not on longer system prompts (onboarding's first plan, later the
regular Offload too) — surfaced as "Parse hiccup" / "Had trouble building
your first plan" with no other symptom. Raised to `6000`. If you see parse
failures with no obvious cause, check `stop_reason` and `usage.thinking_tokens`
in the raw response before assuming the prompt or the JSON-extraction logic
is broken.

### React 18 batches synchronous state updates from a stale closure
`Onboarding.jsx`'s chip-toggle handlers (`tapWish`, `tapProtect`, etc.)
originally computed their "next" value by reading the relevant state
variable from the handler's closure, then called the setter directly (not
the functional-updater form). Two toggles landing in the same React batch —
confirmed via two synchronous `.click()` calls with no `await` between them,
though normal spaced-out human clicks mostly dodge it — read the *same*
stale value, so the second write silently clobbered the first. Fixed by
converting every toggle to `setX(prev => ...)` and moving all ledger-line
derivation into `useEffect`s keyed on the actual state, mirroring the
pattern the prototype already used correctly for `weekday`/`weekend`. If you
add a new multi-select chip field, use this pattern from the start —
don't reintroduce the closure-read-then-set pattern.

### Supabase's built-in mailer caps at 2 emails/hour
Fine for solo testing, breaks immediately once more than ~2 people try to
sign in within the same hour — surfaces as "email rate limit exceeded" with
no useful detail in the app UI. Custom SMTP (Resend, domain
`mail.sprekta.com`, verified via DNS on GoDaddy) is wired in via Supabase's
`smtp_*` auth config; `rate_limit_email_sent` is now 30/hour. If invite
emails start failing, check the Resend dashboard before assuming the app
broke.

### iOS home-screen PWA and Safari do not share a login
A home-screen-installed PWA and mobile Safari are separate storage
sandboxes on iOS — a magic-link email opened on the phone opens (and
authenticates) Safari, never the installed app, and there's no way to force
otherwise; this is an Apple platform constraint, not a bug in our control.
Since push reminders only work from the installed PWA, this made the
reminders feature effectively unusable for iPhone friends. Fixed by adding
a 6-digit OTP code entry step (`src/App.jsx`, `verifyOtp`) alongside the
magic link — Supabase's `signInWithOtp` email already carries both
(`email_otp` in the admin API, `{{ .Token }}` in the email template). The
flow: add to home screen → open from home screen → type the code from the
same email → logged in, once, indefinitely (`sessions_timebox` and
`sessions_inactivity_timeout` are both `0` = unlimited).

### `vercel dev` can hang/crash-loop in a sandboxed dev environment
Tried to run `vercel dev` locally (needed for `/api/claude` during Capture
testing) and it repeatedly either hung on "Creating initial build" with the
proxy port never accepting connections, or crash-looped with `Failed to
detect a server running on port <N>` — even though the internal Vite child
process it spawned was reachable directly and responding fine. Root cause
looked like a stray orphaned `vite` process left listening on 5173 from an
earlier attempt (kill it and any `builder-worker.cjs`/`vercel dev`
processes before retrying); even after a clean restart it was still
unreliable in this sandbox. Fallback that worked for UI-level verification:
run plain `vite` on its own port and accept that anything hitting
`/api/claude` will fail closed (fetch resolves to the SPA fallback, `res.json()`
throws, caught by the existing try/catch) — good enough to verify rendering,
navigation, and any DB write path that doesn't need the model (flag/rest/
revive/remove/say-box UI state), not the actual parse/correction round trip.
Prefer testing the Claude-dependent path on a real deploy (preview or prod)
rather than burning time fighting `vercel dev` in this environment.

### RLS with zero policies is a deliberate lockdown, not an oversight
`reminders` and `push_subscriptions` have `enable row level security`
called but **no `create policy` statements at all**. This is intentional —
it means `authenticated`/`anon` (what the browser's Supabase client
operates as) get zero access, full stop. Only a `SECURITY DEFINER` function
(runs as the function owner, bypasses RLS) or the service-role key (bypasses
RLS entirely) can touch these tables. If a future feature needs the browser
to read either table directly, that's a real design decision, not a bug fix
— make it deliberately and update this note.
