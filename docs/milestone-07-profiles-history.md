# Milestone 7: Profiles & Conversation History

## Overview

Move from pasted profile text to real stored profiles. Add conversation history so users can see and resume past planning sessions.

**What you'll have after this milestone:**
- User profiles stored in database
- Profile creation/editing UI
- List of past conversations
- Resume any past conversation
- Profiles automatically load into planning context

**Estimated Time:** ~6-7 hours

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│  ┌─────────────────┐         ┌─────────────────────────┐    │
│  │     Profile     │         │   Conversation History   │    │
│  │  - name         │         │  - Toronto Trip (active) │    │
│  │  - patterns     │         │  - Deadline Crunch (done)│    │
│  │  - red flags    │         │  - Weekly Planning (done)│    │
│  │  - key people   │         │                          │    │
│  └─────────────────┘         └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  ┌──────────┐    ┌───────────────┐    ┌──────────┐          │
│  │ profiles │───▶│ conversations │───▶│ messages │          │
│  │          │    │               │    │          │          │
│  │ user_id  │    │ user_id       │    │ conv_id  │          │
│  │ name     │    │ profile_id    │    │ role     │          │
│  │ patterns │    │ title         │    │ content  │          │
│  │ red_flags│    │ status        │    │          │          │
│  └──────────┘    └───────────────┘    └──────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Sprint Plan

| Sprint | Goal | Deliverables | Time |
|--------|------|--------------|------|
| 7.1 | Profile schema + API | `profiles` table, CRUD endpoints | ~2h |
| 7.2 | Profile UI | Create/edit profile form, settings page | ~2h |
| 7.3 | Conversation history | List past conversations, resume, archive | ~2h |
| 7.4 | Integration polish | Auto-load profile, conversation titles, mobile | ~1.5h |

---

## Key Features After Completion

### User Profiles
- **Structured data:** patterns, red flags, key people, priorities
- **Free-form notes:** backward compatible with pasted text
- **Auto-load into AI context:** personalized planning advice
- **One profile per user:** simple, focused

### Conversation History
- **List all conversations:** active and archived
- **Resume any conversation:** pick up where you left off
- **Auto-generated titles:** from first message
- **Message count & preview:** quick overview
- **Archive completed plans:** keep workspace clean

### Integration
- **Profile indicator in chat:** shows when profile is active
- **Quick profile setup:** prompted for new users
- **Mobile responsive:** works great on phones
- **Seamless flow:** everything connects naturally

---

## What's NOT Included (Future Milestones)

- Conversation search
- Profile import/export
- Conversation sharing
- Multiple profiles (work/personal)
- Profile analytics ("You tend to...")
- Smart conversation grouping

---

## Prerequisites

Before starting Milestone 7, you must complete:
- ✅ Milestone 6 (Conversation Infrastructure)
- ✅ Supabase Auth set up
- ✅ Database migrations working

---

## Next Steps

1. Read through all sprint instructions
2. Start with Sprint 7.1 (Database & API foundation)
3. Test each sprint before moving to the next
4. Complete sprints in order (they build on each other)

Ready to build powerful user profiles and conversation management!
