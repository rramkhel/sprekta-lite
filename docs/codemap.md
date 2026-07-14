# Code map

Concept → exact file:line, so an agent can jump straight there instead of
grepping cold. Line numbers drift as the file changes — if a pointer looks
wrong, trust the file and fix this doc, not the other way around.

## Prompt construction (`src/Sprekta.jsx`)

| Concept | Where |
|---|---|
| `profileContext(p)` — turns profile into prompt text (rhythm/facts/situations/challenge/wishes) | `src/Sprekta.jsx:98` |
| `projectMap(projects)` — the "tag every item with a project key" instructions | `src/Sprekta.jsx:112` |
| `offloadSystemPrompt(profile, projects)` — the shared system prompt for Offload, chat, and onboarding's first dump | `src/Sprekta.jsx:124` |
| `ITEM_FIELDS` — the JSON schema every parse prompt asks the model to return per item, including `stated_date`/`stated_time` | search `const ITEM_FIELDS` in `src/Sprekta.jsx` |
| `WISH_HINTS` / `wishContext()` — wish-key → planner directive map | search `WISH_HINTS` in `src/Sprekta.jsx` |
| `prepareParsedItems(rawItems)` — resolves `stated_date`/`stated_time` → `fixed_time`, stamps `device_id`/`timezone`, strips the raw tokens | `src/Sprekta.jsx:154` |
| `mergeItems(existing, incoming)` — de-dupes by title, case-insensitive | `src/Sprekta.jsx:165` |
| `itemDay(i)` / `whenLabel(i)` — display-layer date resolution (fixed_time > deadline > today flag) | `src/Sprekta.jsx:174`, `:180` |

## The three item-creation paths (all call `prepareParsedItems` + `maybeOfferReminders`)

| Path | Function |
|---|---|
| "Build my plan" (Plan tab, offload mode) | `runOffload()` — `src/Sprekta.jsx:340` |
| "Think it through" chat | `sendChat(seed)` — `src/Sprekta.jsx:375` |
| Onboarding's "tomorrow" dump → first plan | `finishOnboarding(answers)` — `src/Sprekta.jsx:431` |

If you add a fourth item-creation path, it needs to call `prepareParsedItems`
too, or `fixed_time`/`device_id`/`timezone` never get set and that item is
silently un-reminder-eligible.

## Reminders / push

| Concept | Where |
|---|---|
| Date/time resolution (model never resolves; this does) | `src/lib/dateResolve.js` — `computeFixedTime()` at `:68` |
| Device id + timezone helpers | `src/lib/device.js` |
| Push subscribe/enable/dismiss/test-notification client helpers | `src/lib/push.js` |
| Contextual "want a nudge?" prompt trigger | `maybeOfferReminders()` — `src/Sprekta.jsx:411` |
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
| `onFinish` — everything the parent needs to persist + parse | prop passed from `Sprekta.jsx:431` (`finishOnboarding`) |

## Dev tools (admin-only, `VITE_ADMIN_EMAIL`)

| Action | Function |
|---|---|
| Save/Load/Reset profile snapshots | `devSaveProfile` `:579`, `devApplySnapshot` `:595`, `devResetToBlank` `:573` |
| Send test push notification | `devSendTestNotification` `:623` |

## Auth (`src/App.jsx`)

Magic link and 6-digit OTP code both come from one `signInWithOtp` call;
`verifyOtp({ email, token: code, type: 'email' })` completes sign-in without
ever touching the link — this is the path iOS home-screen users take. See
cortex for why this exists.
