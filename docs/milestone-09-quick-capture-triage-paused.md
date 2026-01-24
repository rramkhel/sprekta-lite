# Milestone 9: Quick Capture Triage System

## Overview

Transform quick capture from "dump and forget" into an intelligent triage system. User jots things down throughout the day; system automatically categorizes, schedules what it can, and surfaces what needs attention.

**What you'll have after this milestone:**
- Automatic event creation from complete captures
- Ghost events for incomplete items
- Triage panel with Coming Up / Needs Attention / Backlog
- "While You Were Away" session summaries
- Decay system for stale items
- Three-panel layout (Chat | Calendar | Triage)
- Admin view for debugging event metadata

**Estimated Time:** ~10-12 hours

---

## The Problem

Current flow:
1. User captures "dentist next week"
2. It... goes somewhere?
3. User forgets about it
4. Dentist appointment missed

New flow:
1. User captures "dentist tue 3pm" → Calendar event created automatically ✓
2. User captures "dentist next week" → Ghost event created, surfaces in triage
3. User returns → sees "While You Were Away" summary
4. Triage panel shows what needs attention
5. Nothing falls through the cracks

---

## Capture Taxonomy

| Type | Example | Immediate Action | Lives Where | Resurfaces How | Decay? |
|------|---------|------------------|-------------|----------------|--------|
| **Complete Event** | "dentist tue 3pm" | → Calendar | Calendar (solid) | Notification + enrichment prompts | No |
| **Incomplete Event** | "dentist next week" | → Ghost event | Calendar (tentative) | Triage: "When exactly?" | Yes - if not resolved |
| **Time-bound Todo** | "call mom before thanksgiving" | → Hold | Backlog w/ deadline flag | Triage + nudges as deadline approaches | Yes - after deadline |
| **Timeless Todo** | "buy batteries" | → Hold | Backlog | Triage (batched/grouped) | Yes - after X weeks |
| **Reference** | "sarah's bday march 15" | → Annual event | Calendar (all-day, recurring) | Week-before reminder | No |

---

## Architecture

### Three-Panel Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              SPREKTA                                      [Admin 🔧] │
├──────────────────┬──────────────────────────────────────────┬────────────────────────┤
│                  │                                          │                        │
│ CHAT             │     CALENDAR                             │ TRIAGE            [✕] │
│                  │                                          │                        │
│ (conversation    │     (when all 3 panels open,            │ (text-first design,   │
│  with AI)        │      iOS-style vertical layout)          │  weights over color)  │
│                  │                                          │                        │
│ ┌──────────────┐ │                                          │                        │
│ │ jot something│ │                                          │                        │
│ └──────────────┘ │                                          │                        │
└──────────────────┴──────────────────────────────────────────┴────────────────────────┘
     [toggleable]              [always on]                        [toggleable]
```

### Panel Behavior

| Panel | Position | Default State | Toggle? |
|-------|----------|---------------|---------|
| Chat | Left | Open | Yes - can collapse |
| Calendar | Center | Always visible | Adapts to available space |
| Triage | Right | Closed (opens after capture or manually) | Yes |

### Calendar Adaptation

- **2 panels open:** Standard month/week view
- **3 panels open:** iOS-style vertical list optimized for narrow width

---

## Triage Panel Design

### Design Principles

- **Text-first** — feels like reading, not using software
- **Weights and shades over color** — muted, not loud
- **Minimal UI** — occasional lucide icon, rare buttons
- **No cognitive load** — organization does the work

### Visual Hierarchy

```
Coming Up                    ← section header: medium weight, muted

Tue 3pm                      ← date/time: light weight, muted  
Dentist              [◉]    ← item: regular weight | resolve icon: muted until hover

dentist next week    [◉]    ← incomplete item
when exactly?                ← subtext: light weight, muted

Backlog (2)                  ← collapsed section: medium weight + count
  buy batteries              ← expanded: regular, indented
```

### Sections

1. **Coming Up** (top)
   - Confirmed events in next few days
   - Glanceable, no actions needed

2. **Needs Attention** (middle)
   - Ghost events needing times
   - Deadlines approaching
   - Each has resolve icon [◉]

3. **Backlog** (collapsed by default)
   - Timeless todos
   - Shows count, expands on click

4. **While You Were Away** (bottom, temporary)
   - Session summary of captures
   - "✓ Dentist Tue 3pm → added to calendar"
   - "⚠ Dentist next week → needs a time"
   - Dismissible with [✕]

### Interaction Model

| Element | Click Action |
|---------|--------------|
| Item text | Opens inline UI for resolution |
| [◉] resolve icon | Opens new chat tab focused on this item |
| [✕] on session summary | Dismisses section |
| Backlog (2) | Expands/collapses list |

### Resolve Icon Behavior

When user clicks [◉] on "dentist next week":
- Opens new chat tab (or focuses chat panel)
- AI pre-loaded with context:

```
Let's pin down that dentist appointment.

You said "dentist next week" — do you know 
what day works? And what time?
```

Focused, single-item conversation. Resolves → updates triage → done.

---

## Ghost Events

### What They Are

Calendar entries for incomplete events. Visually distinct from confirmed events.

### Visual Treatment

- **Tentative/dotted style** — not solid like real events
- **Grey/muted color** — doesn't compete with confirmed events
- **Shows in calendar view** — user sees placeholder exists
- **Clickable** — opens resolution flow

### Google Calendar Integration

Use native "tentative" status where possible. Otherwise, custom styling with event metadata flag.

---

## Decay System

### Purpose

The calendar should never feel stale. Old, unresolved items automatically expire.

### Default Decay Timings

| Item Type | Decay After |
|-----------|-------------|
| Ghost events | 7 days |
| Timeless todos | 14 days |
| Time-bound todos | After deadline passes |

### Decay Behavior Options

| Approach | Behavior |
|----------|----------|
| Silent archive | Disappears, moves to archive |
| Confirmation prompt | "Still need this?" before expiring |
| Admin-only silent | User never sees, admin can review |

**MVP:** Silent archive with admin visibility. User can adjust defaults later.

---

## Admin View

### Purpose

Let you (the developer) see everything the system is doing. Not user-facing.

### Table View

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ADMIN: All Events                                              [Export CSV] │
├──────────────────────────────────────────────────────────────────────────────┤
│ Raw Text         │ Type       │ Status    │ Decay    │ Next Nudge │ Created │
│──────────────────│────────────│───────────│──────────│────────────│─────────│
│ dentist tue 3pm  │ event      │ scheduled │ n/a      │ Mon 6pm    │ Jan 24  │
│ dentist next wk  │ event      │ ghost     │ 7 days   │ Jan 26     │ Jan 24  │
│ call mom thxgvng │ todo+deadline│ pending │ Nov 29   │ Jan 25     │ Jan 24  │
│ buy batteries    │ todo       │ backlog   │ Feb 7    │ Jan 31     │ Jan 24  │
│ sarah bday mar15 │ reference  │ scheduled │ n/a      │ Mar 8      │ Jan 24  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Admin Settings

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ SETTINGS                                                                     │
│ Default decay (timeless todos): [14 days ▼]                                 │
│ Default decay (ghost events):   [7 days ▼]                                  │
│ Nudge frequency (approaching):  [3 days before ▼]                           │
│ Planning prompt cadence:        [Weekly, Sunday evening ▼]                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Access

- Hidden button in existing dev panel, or
- URL param `?admin=true`, or
- Keyboard shortcut (Cmd+Shift+A)

---

## Database Schema Updates

### New: `captures` table

```sql
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  
  -- Raw input
  raw_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI classification
  capture_type TEXT CHECK (capture_type IN ('event', 'todo', 'reference', 'idea')),
  completeness TEXT CHECK (completeness IN ('complete', 'incomplete')),
  confidence FLOAT,
  
  -- Parsed data
  parsed_data JSONB, -- { title, date, time, deadline, etc. }
  
  -- Lifecycle
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'ghost', 'backlog', 'archived', 'decayed')),
  resolved_at TIMESTAMPTZ,
  decay_at TIMESTAMPTZ,
  
  -- Links
  event_id UUID REFERENCES events(id), -- If converted to event
  conversation_id UUID REFERENCES conversations(id) -- If resolved via chat
);
```

### Updates to `events` table

Add fields:
```sql
ALTER TABLE events ADD COLUMN is_ghost BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN capture_id UUID REFERENCES captures(id);
ALTER TABLE events ADD COLUMN enrichment_status TEXT DEFAULT 'none'; -- none, prompted, complete
```

---

## Sprint Plan

| Sprint | Goal | Deliverables | Time |
|--------|------|--------------|------|
| 9.1 | Three-panel layout | Responsive panels, calendar adaptation, toggle behavior | ~2h |
| 9.2 | Capture classification | AI categorization, database schema, capture flow | ~2.5h |
| 9.3 | Triage panel UI | Sections, text-first design, session summary | ~2.5h |
| 9.4 | Ghost events | Calendar integration, visual treatment, resolution flow | ~2h |
| 9.5 | Decay & admin | Decay system, admin table view, settings | ~2h |
| 9.6 | Polish & integration | End-to-end testing, edge cases, mobile | ~1.5h |

---

## Key Principles

1. **Magic first, autonomy second** — Auto-do what's obvious. Ask only when needed.

2. **Ghost events > invisible holding** — User should SEE that incomplete items exist.

3. **Decay is a feature** — Stale items auto-expire. System stays fresh. User trusts the calendar.

4. **Planning mode is the funnel** — Most unresolved stuff surfaces during planning, not random nudges.

5. **Triage, don't list** — AI prioritizes what to surface. Never "here are your 47 captures."

6. **Learn the user** — Planning cadence, habits, weak spots. Adapt nudge timing (future milestone).

---

## What's NOT Included (Future Milestones)

- Personality-based adaptation (Four Tendencies, DISC)
- Location-based nudges ("You're near Target")
- Smart grouping ("These 4 errands could be one trip")
- Recurring capture patterns
- External capture (SMS, email, voice memo)
- Enrichment prompts (location, duration, prep time)

---

## Prerequisites

Before starting Milestone 9, you must complete:
- ✅ Milestone 8 (Authentication)
- ✅ Milestone 7 (Profiles & History)
- ✅ Milestone 6 (Conversation Infrastructure)
- ✅ Working quick capture with AI parsing

---

## Success Criteria

After Milestone 9:
- [ ] User can jot down 5 things rapidly
- [ ] Complete events auto-create on calendar
- [ ] Incomplete events show as ghost events
- [ ] Triage panel shows what needs attention
- [ ] "While You Were Away" closes the loop
- [ ] Items decay after configurable time
- [ ] Admin can see all event metadata
- [ ] Nothing falls through the cracks

---

Ready to build the intelligent capture system!
