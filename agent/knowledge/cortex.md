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

### ADR-005: No permanent `dev` branch — feature/fix/chore branches into main
Borrowed from ironbrev-v2's branch discipline, trimmed: no sprint-numbering
system (S-0xx/H-0xx) since this is a single-person, single-thread-of-work
project — that ceremony pays for itself at ironbrev's scale, not here. The
part worth keeping is simpler: **never commit directly to `main`** (enforced
by `.claude/hooks/pre-commit.sh`), branch per change
(`feature/`, `fix/`, `chore/` prefix + short name), merge to `main`, deploy
from `main` via `vercel --prod`. `state/CODEBASE_STATE.md` gets a changelog
line automatically on merge via `.claude/hooks/post-merge.sh`.

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

### ADR-007: Capture design review — Laurel theme, real parked/resting split, optimistic capture
A line-by-line diff of the shipped Capture v1 against `sprekta-capture-design-doc.md` and the reference prototype `sprekta-capture-valet.html` found the mechanics were right but the *identity* had drifted: the first pass used `Sprekta.jsx`'s own INK/AI-purple/MUTED constants instead of the design doc's actual Laurel palette, individually-carded feed entries instead of a de-carded ledger, no optimistic loading state, and — the substantive bug, not just a style miss — `status='parked'` conflating two unrelated meanings (Capture's "the system doesn't know the what" vs. Activity's "the user isn't ready yet"), with the marker/status-line logic derived from a question's tier instead of from destination. Fixed in one pass:

- **Theme**: replaced the constants wholesale (`PAPER/INK/STONE/FAINT/HAIR/LINE/ACC/ACC_DEEP/ACC_SOFT/ACC_LINE/RING/FLAG`), loaded Fraunces (Google Fonts link in `index.html`) for item-view titles only — everything else stays sans per doc §11 (serif at caption sizes failed readability in testing).
- **De-carded feed**: entries are rows with `border-bottom` separators, not individually-carded widgets; only the expanded multi-item dropdown and the composer are actual white cards.
- **`parked_reason` column** (migration `0009`): `'clarify'` (tier-3 vague capture, system's problem, status line "needs clarification · this evening", no chips at all — the say-box "tell me what this is" is the whole treatment) vs. `'rest'` (user deferred a well-formed item, "resting · back in a day or two", gets a "bring it back" chip that restores its prior `today`/`fixed_time` by reading the most recent `kind='rest'` `corrections` row — no separate snapshot column needed, the audit log doubles as the undo source). `applyCorrection` (`lib/parse.js`) auto-clears `clarify` back to `status='open'` on any successful correction — answering *is* forming the item, per doc §5.3.
- **`quiet` column + deadline-based reminders** (same migration): notification inversion (doc §9.3) — a deadline-only item now gets a day-before nudge by default (`prepareParsedItems` sets `reminder_offsets:[1440]` when there's a deadline but no `fixed_time`; `sync_item_reminder` was extended to fire off `deadline` at a fixed 9am local anchor when `fixed_time` is null). `quiet=true` suppresses all reminders for that item; it's the only opt-out, never an opt-in.
- **Optimistic capture** (`Capture.jsx`'s `pendingEntry` state): the composer clears the instant Send is pressed — words are safe unconditionally — and a shimmer-skeleton entry shows while the real parse/insert round-trip runs in the background; a failure keeps the raw text visible with a retry link, never silently drops it.
- Fixed two real bugs the review caught: `removeItem`'s undo restored `status='open'` unconditionally (an archived *resting* item should come back resting — now restores the pre-remove `status`), and `load()` used to force-expand the newest entry on *every* call, which silently undid collapse-all after any unrelated correction (now only expands on an explicit fresh capture via `load({ expandNewest })`).
- Explicitly punted (per the review's own punt list, unchanged from before): voice/mic, torn/flip UI, project/saved-fact verbs + markers, travel/hold facts, cross-dump dedupe, 9/10 auto-urgency, and the "Activity →" footer link (no dead links to a tab that doesn't exist yet).

### ADR-008: Single-item capture entries — pinned form, then a v2 anatomy revision
Follow-up to ADR-007: a one-item dump was still wrapped in the same footer+padding shell as a multi-item entry, just without the card — close, but it still had a "You said" block and an undo-dump affordance for something that's just one item with its own 🗑. First fix: `Capture.jsx`'s `renderEntry` special-cased a single-item dump to return the plain per-item-row anatomy directly (small marker, normal-weight title, a right-aligned timestamp) — no wrapper, no tray, no summary, no footer.

**Revised (v2), same session:** that bare row read as a *different kind of list* from multi-item entries. Singles now use the multi-item **summary row's own anatomy** instead — a 26px glyph chip in an `ACC_SOFT` square (matching the tray icon's chrome exactly), bold title, and a meta line that leads with relative time then middot-separated facts (`renderSingleItemEntry` in `Capture.jsx`). The chip *is* the checkbox for todo/calendar items (see ADR-009); parked rings are inert. No separate `.sprekta-ts` timestamp column anymore — time lives in the meta line. Left edges (chip column, title baseline) now align between single rows and multi-entry summary rows on purpose, so the feed reads as one list with two content densities, not two list designs.

The **form choice is still pinned to the dump's original parse count, not its current surviving count** — `dumps.item_count` (migration `0010`), unchanged by the v2 revision. A 3-item dump that later has 2 items archived still renders as a multi-item card with a working "You said"/undo-dump footer; it never collapses into the single-row form just because only one item survives. `originalItemCount(dump, items)` (`Capture.jsx`) is the one place this decision is made — falls back to `items.length` for dumps that predate the column. The item view's provenance still collapses to one register for these (`You said "…" · {time}` instead of `from "…" / part of "…"`).

### ADR-009: Check-off lives wherever the user sees the item, not just Today
Design-doc amendment (§7.1): the original "checking off happens on Today" rule only ever constrained *Sprekta* from claiming done-ness on the user's behalf — it never meant the user couldn't complete something the moment they saw it. An empty square that never responds to a tap reads as broken, not as intentional restraint. `status='done'` already existed in the schema (migration `0006`) but nothing wrote it — `Sprekta.jsx`'s own `complete()` still hard-deletes (a separate, older, untouched mechanism; Activity Phase A territory, not this pass).

- **Capture.jsx**: any `open`/`done` item's marker (dropdown rows' small marker, single-item entries' 26px chip, and a new "✓ done"/"reopen" chip in the item view) is checkable — `isCheckable(item)` excludes `parked` (both `clarify` and `rest`) and archived/removed items are never reachable in the first place. Toggling writes `corrections` (`kind:'close'`/`'reopen'`, reusing `close` from the original-but-unused kind vocabulary) and an EA line with undo, same pattern as every other action here. Done rendering: filled `ACC` square + white check, `FAINT` + line-through title, ~45% opacity on the facts/held line — **the row stays in the feed**, it's a receipt, not a deletion.
- **Feedback is scale + stroke on the glyph itself (`.sprekta-marker-btn` in `index.css`), deliberately no background fill** — settled after testing; a filled highlight behind a small glyph read as a mis-registered sticker, not a checkbox response. Needs `!important` on the hover color since inline styles otherwise beat an external stylesheet rule regardless of specificity.
- **`Sprekta.jsx`'s shared items fetch now excludes `status in (done, archived)`** (previously fetched everything unfiltered) — without this, an item completed from Capture would still show as outstanding in Today/Plan/Calendar, since those three surfaces all read the one `items` state populated by that fetch. This is a plain refetch-on-load fix, not real-time: completing something in Capture won't retroactively update an already-rendered Plan/Today until that tab's own data reloads (fresh mount / navigation) — no live cross-tab sync exists between `Capture.jsx` and `Sprekta.jsx`'s separate item state, and building one is out of scope here.
- Today's own tab (per the design mock referenced in the source instructions, `sprekta-today-digest.html`) was **not** rebuilt to match this styling in this pass — no reference doc for it was provided, only the behavioral filter fix above. Today's *existing* rendering already benefits from the filter (done items just disappear, same as before this feature existed), but it doesn't yet have its own checkable-marker UI to match Capture's.

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
