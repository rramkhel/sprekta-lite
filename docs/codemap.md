# Code map

Concept → exact file:line, so an agent can jump straight there instead of
grepping cold. Line numbers drift as the file changes — if a pointer looks
wrong, trust the file and fix this doc, not the other way around.

## Shared parse/prompt/correction plumbing (`src/lib/parse.js`)

Extracted so `Sprekta.jsx` (Today/Plan/onboarding) and `Capture.jsx` call the
model and persist items/questions identically instead of drifting apart.

| Concept | Where |
|---|---|
| `profileContext(p)` — turns profile into prompt text (rhythm/facts/situations/challenge/wishes) | `src/lib/parse.js:52` |
| `projectMap(projects)` — the "tag every item with a project key" instructions | `src/lib/parse.js:66` |
| `ITEM_FIELDS` — the JSON schema every parse prompt asks the model to return per item, including `stated_date`/`stated_time`/`source` | `src/lib/parse.js:73` |
| `QUESTION_RULES` — the vague-capture question ladder (tiers 1/2/3, vague-verb rule, one-profile-question-per-dump) | `src/lib/parse.js:81` |
| `offloadSystemPrompt(profile, projects, { askedQuestions })` — the shared system prompt for Capture, Offload/chat, and onboarding's first dump | `src/lib/parse.js:93` |
| `WISH_HINTS` / `wishContext()` — wish-key → planner directive map | `src/lib/parse.js:38` |
| `prepareParsedItems(rawItems)` — resolves `stated_date`/`stated_time` → `fixed_time`, stamps `device_id`/`timezone`, strips the raw tokens | `src/lib/parse.js:127` |
| `mergeItems(existing, incoming)` — de-dupes by title, case-insensitive | `src/lib/parse.js:138` |
| `itemDay(i)` / `whenLabel(i)` — display-layer date resolution (fixed_time > deadline > today flag) | `src/lib/parse.js:147`, `:153` |
| `persistQuestions(rawQuestions, insertedItems, rawItemsForRefs, userId)` — resolves each question's `item_ref` index to a real DB item id, inserts into `questions` | `src/lib/parse.js:188` |
| `correctionSystemPrompt(profile)` — the shared "CEO channel" prompt: one utterance + one item in, `{updates, confirmation, log}` or `{clarify, placeholder}` out | `src/lib/parse.js:220` |
| `applyCorrection({ item, utterance, profile, userId, accessToken, surface })` — calls the model, resolves any `stated_date`/`stated_time` against the item's *own* stored timezone, writes the item update + a `corrections` row | `src/lib/parse.js:243` |
| `undoCorrection({ itemId, before })` — writes a prior snapshot back; used by the EA confirmation line's one-tap undo | `src/lib/parse.js:280` |

## The item-creation paths (all call `prepareParsedItems`)

| Path | Function |
|---|---|
| Capture composer (dump → parse, `dump_id`-linked) | `runCapture(text)` — `src/Capture.jsx` |
| "Think it through" chat | `sendChat(seed)` — `src/Sprekta.jsx:195` |
| Onboarding's "tomorrow" dump → first plan | `finishOnboarding(answers)` — `src/Sprekta.jsx:251` |

Capture also calls `maybeOfferReminders` via the `onAfterCapture` prop passed
from `Sprekta.jsx`. If you add another item-creation path, it needs to call
`prepareParsedItems` too, or `fixed_time`/`device_id`/`timezone` never get
set and that item is silently un-reminder-eligible. Plan's old "Build my
plan" Offload textarea (`runOffload()`) was removed — Capture supersedes it.

## Capture (`src/Capture.jsx`, new — the app's landing tab)

v1 subset of `sprekta-capture-design-doc.md` (Downloads); see
`state/CODEBASE_STATE.md` Feature status for what's deferred.

| Concept | Where |
|---|---|
| `load()` — fetches `dumps`+`items` (excludes `status='archived'`) +`questions`, groups items by `dump_id` into feed entries | `src/Capture.jsx` — `const load = useCallback(...)` |
| `runCapture(text)` — the composer's normal (non-scoped) send path | `src/Capture.jsx` — `async function runCapture` |
| `send()` — routes to `runCapture` or, when `focusItem` is set (the "discuss" one-shot chip), to `applyCorrection` | `src/Capture.jsx` — `async function send` |
| `submitSay(it)` — the item view's say-box, same `applyCorrection` primitive scoped to one item | `src/Capture.jsx` — `async function submitSay` |
| `maybeMarkQuestionAnswered(itemId, answerText)` — best-effort: a successful correction on an item with an open tier-1 fact question marks it answered | `src/Capture.jsx` — `async function maybeMarkQuestionAnswered` |
| `markerFor` / `factsFor` / `entrySummary` — row marker (☐/📅/○) + facts-line + entry headline/meta derivation | `src/Capture.jsx`, top-level functions |
| Quick-action chips (today/flag/rest it/bring it back/remove) | `toggleToday`/`toggleFlag`/`restItem`/`reviveItem`/`removeItem` in `src/Capture.jsx` |

## Reminders / push

| Concept | Where |
|---|---|
| Date/time resolution (model never resolves; this does) | `src/lib/dateResolve.js` — `computeFixedTime()` at `:68` |
| Device id + timezone helpers | `src/lib/device.js` |
| Push subscribe/enable/dismiss/test-notification client helpers | `src/lib/push.js` |
| Contextual "want a nudge?" prompt trigger | `maybeOfferReminders()` — `src/Sprekta.jsx:231` |
| Reminder row lifecycle (create/replace/cascade) | Postgres trigger `sync_item_reminder`, `supabase/migrations/0005_reminders.sql` |
| Push subscribe endpoint | `api/push/subscribe.js` |
| Admin test-notification endpoint | `api/push/test.js` |
| Cron-triggered dispatcher | `api/reminders/dispatch.js` |

## Onboarding (`src/Onboarding.jsx`)

| Concept | Where |
|---|---|
| Step machine (`intro` → 8 real screens) | `const steps = [...]` near the top of `Onboarding()` |
| Hoisted helper components (don't un-hoist — see cortex ADR on remount/focus-loss) | `Q`/`Sub`/`Wrap`/`NextBtn`/`SkipLink`/`H2`/`VoiceBox`, `src/Onboarding.jsx:100-166` |
| Optional life/people branch (not in `steps`, doesn't advance `stepIdx`) | search `branch === 'life'` / `branch === 'people'` |
| Ledger derivation (every field's `useEffect` → `learn()`) | search `const learn = ` in `src/Onboarding.jsx` |
| `onFinish` — everything the parent needs to persist + parse | prop passed from `Sprekta.jsx:251` (`finishOnboarding`) |

## Dev tools (admin-only, `VITE_ADMIN_EMAIL`)

| Action | Function |
|---|---|
| Save/Load/Reset profile snapshots | `devResetToBlank` `:388`, `devSaveProfile` `:394`, `devApplySnapshot` `:410` |
| Send test push notification | `devSendTestNotification` `:438` |

## Auth (`src/App.jsx`)

Magic link and 6-digit OTP code both come from one `signInWithOtp` call;
`verifyOtp({ email, token: code, type: 'email' })` completes sign-in without
ever touching the link — this is the path iOS home-screen users take. See
cortex for why this exists.
