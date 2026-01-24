# Milestone 8.5: Simple Triage View

## Overview

A right-side panel that organizes existing events into actionable buckets. No new AI classification — just useful visibility into what needs attention.

**What you'll have after this milestone:**
- Toggleable triage panel (right side)
- Events sorted into Today / This Week / Later / Undetermined
- Click-to-resolve for undetermined items
- Text-first, minimal UI

**Estimated Time:** ~3.5 hours

---

## The Buckets

| Section | What's In It | Source |
|---------|--------------|--------|
| **Today** | Events happening today | `events.date = today` |
| **This Week** | Events in next 7 days | `events.date > today AND <= today+7` |
| **Later** | Events beyond this week | `events.date > today+7` |
| **Undetermined** | Stuff missing info | `events.date IS NULL` OR `events.needs_triage = true` |

---

## Where "Undetermined" Comes From

Two sources:

1. **Events with no date** — Quick capture created an event but couldn't parse a date
2. **Flagged as incomplete** — Add `needs_triage` boolean to events table

When quick capture can't get a full date/time, it still creates the event but flags it.

---

## UI Design

```
┌────────────────────────┐
│ TRIAGE            [✕] │
│                        │
│ Today                  │
│                        │
│ 3pm                    │
│ Dentist           [◉] │
│                        │
│ 5pm                    │
│ Call Sarah        [◉] │
│                        │
│ ─────────────────────  │
│                        │
│ This Week              │
│                        │
│ Thu                    │
│ Project deadline  [◉] │
│                        │
│ Sat                    │
│ Dinner w/ parents [◉] │
│                        │
│ ─────────────────────  │
│                        │
│ Later (3)              │
│   Oil change           │
│   Renew passport       │
│   Call insurance       │
│                        │
│ ─────────────────────  │
│                        │
│ Undetermined           │
│                        │
│ "dentist next week"    │
│ when exactly?     [◉] │
│                        │
│ "call mom"             │
│ add to calendar?  [◉] │
│                        │
└────────────────────────┘
```

### Design Principles

- **Text-first** — weights and shades, not colors
- **Section headers** — small, muted, uppercase
- **Items** — regular weight, clear
- **Subtext** — light, muted (time, or prompt like "when exactly?")
- **[◉] resolve icon** — muted until hover, opens contextual chat

---

## Sprint Plan

| Sprint | Goal | Deliverables | Time |
|--------|------|--------------|------|
| 8.5.1 | Panel + data | Right panel toggle, fetch events by bucket | ~1h |
| 8.5.2 | Triage UI | Render sections, text-first styling | ~1.5h |
| 8.5.3 | Resolve flow | Click [◉] → chat about that item | ~1h |

---

## Database Change

One small addition to `events` table:

```sql
ALTER TABLE events ADD COLUMN needs_triage BOOLEAN DEFAULT FALSE;
```

When quick capture creates an event without a clear date/time, set `needs_triage = true`.

---

## What's NOT Included

- AI classification (full M9)
- Ghost event styling on calendar (full M9)
- Decay/expiration (full M9)
- Session summaries ("While You Were Away") (full M9)
- Admin view (full M9)

This is just: **show me what I have, organized usefully.**

---

## Success Criteria

- [ ] Triage panel toggles open/closed
- [ ] Today section shows today's events
- [ ] This Week shows next 7 days
- [ ] Later shows everything else (collapsible)
- [ ] Undetermined shows items needing clarification
- [ ] Clicking resolve opens chat focused on that item
- [ ] Panel state persists (localStorage)
