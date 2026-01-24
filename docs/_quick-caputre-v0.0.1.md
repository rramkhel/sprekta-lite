Okay. Let me crystallize what you've decided:

---

## Capture Taxonomy v1

| Type | Example | Immediate Action | Lives Where | Resurfaces How | Decay? |
|------|---------|------------------|-------------|----------------|--------|
| **Complete Event** | "dentist tue 3pm" | → Calendar | Calendar (solid) | Notification + enrichment prompts closer to date | No (it's scheduled) |
| **Incomplete Event** | "dentist next week" | → Ghost event | Calendar (dotted/grey/tentative) | Planning mode: "When exactly?" | Yes - if not resolved |
| **Time-bound Todo** | "call mom before thanksgiving" | → Hold | Backlog w/ deadline flag | Planning mode + nudges as deadline approaches | Yes - after deadline passes |
| **Timeless Todo** | "buy batteries" | → Hold | Backlog | Planning mode (batched/grouped) | Yes - after X weeks |
| **Reference** | "sarah's bday march 15" | → Annual event | Calendar (all-day, recurring) | Week-before reminder | No (it's scheduled) |
| **Idea/Note** | "what if X" | → ??? | ??? | ??? | ??? (punting) |

---

## Key Principles Emerging

1. **Magic first, autonomy second** — Auto-do what's obvious. Ask only when needed.

2. **Ghost events > invisible holding** — User should SEE that "dentist next week" exists, even if incomplete. Visual feedback matters.

3. **Decay is a feature** — Stale items auto-expire. The system stays fresh. User trusts the calendar.

4. **Planning mode is the funnel** — Most unresolved stuff surfaces during planning, not random nudges throughout the day.

5. **Triage, don't list** — AI prioritizes what to surface. Never "here are your 47 captures."

6. **Learn the user** — Planning cadence, habits, weak spots. Adapt nudge timing.

---

## Open Design Questions

### 1. Ghost Events UI
- What does "tentative" look like? Google Calendar has a native tentative status - use that?
- Can user click ghost event to resolve it? Or only through chat?

### 2. Decay Mechanics
- How long until something decays? Fixed (2 weeks)? Or contextual (deadline-aware)?
- When it decays, does it disappear silently? Or "I'm archiving 'buy batteries' - still need it?"
- Can user set decay preferences? ("I want aggressive cleanup" vs "don't delete my stuff")

### 3. Nudge Timing
- When does AI nudge about time-bound todos? 1 week before? 3 days? Depends on task?
- Does nudge happen in-app only? Or push notification? (MVP probably in-app only)

### 4. Planning Mode Entry Point
- When does planning mode happen? User-initiated? Scheduled? AI-prompted?
- How does AI know user's planning cadence? Ask? Observe?

### 5. Triage Logic
- What determines priority? Deadline proximity? User-stated importance? Inferred importance?
- How many items surface per planning session? All? Top 5? Depends?

---

## Which question do you want to dig into first?

My suggestion: **Ghost Events UI** — because it's the most tangible piece we could spec and hand to Claude Code.