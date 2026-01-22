# Milestone 6: Conversation Infrastructure

## Overview

Build proper backend infrastructure for conversations. Anonymous users get session-based conversations. When accounts come later, conversations can be claimed and persist across devices.

**Why now:** You're about to deploy to friends. localStorage is wrong. Build it right once.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ triage-ui   │───▶│triage-state │───▶│  API calls  │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                              │               │
└──────────────────────────────────────────────│───────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL API                               │
│  ┌───────────────────┐    ┌───────────────────────┐         │
│  │ /api/conversation │    │ /api/conversation/:id │         │
│  │     (create)      │    │   /message (send)     │         │
│  └───────────────────┘    └───────────────────────┘         │
│                                    │                         │
└────────────────────────────────────│─────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  ┌─────────────┐    ┌──────────┐    ┌─────────────┐         │
│  │conversations│───▶│ messages │    │  (future)   │         │
│  │             │    │          │    │   profiles  │         │
│  │ session_id  │    │ role     │    │   users     │         │
│  │ user_id     │    │ content  │    │             │         │
│  │ profile_text│    │ phase    │    │             │         │
│  └─────────────┘    └──────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Sprint Plan

| Sprint | Goal | Deliverables |
|--------|------|--------------|
| 6.1 | Database schema | Tables, indexes, RLS policies |
| 6.2 | API endpoints | Create, send message, get conversation |
| 6.3 | Frontend integration | State syncs with backend, session ID |
| 6.4 | Account foundation | Supabase Auth setup, login UI, claim conversations |

---

## What Changes

### Before (Current State)
- Conversations in localStorage
- Lost when you clear browser data
- No cross-device sync
- No multi-user support
- Manual profile pasting every session

### After (Milestone 6)
- Conversations in Supabase
- Anonymous sessions (sessionStorage) - cleared on tab close
- Optional login → conversations persist across devices
- Ready for multi-user accounts
- Profile saved with conversation

---

## Key Decisions

### Anonymous-First Approach
Users can start chatting immediately without creating an account. When they do sign up, their conversations are claimed and linked to their account.

**Why:** Lower barrier to entry. Friends can try it without commitment.

### Session Storage (Not Local Storage)
Anonymous sessions are stored in `sessionStorage`, which clears when the tab closes.

**Why:** Conversations should be ephemeral unless you explicitly log in. This matches the mental model of "planning session" - when you're done, it's gone.

### Profile as Text Field (For Now)
Instead of building a full profile schema, we store profile text in the conversation record.

**Why:** Ship faster. Real profile schema comes in Milestone 7 when we understand what fields users actually need.

---

## Security Model

### Anonymous Users
- Get a random session ID (UUID) stored in sessionStorage
- Can only access conversations with their session ID
- API validates session ID on every request
- Session dies when tab closes

### Logged-In Users
- Conversations linked to `user_id` (Supabase Auth)
- Can access conversations across devices
- Row Level Security (RLS) enforces "users can only see their own conversations"
- Service role key (backend only) bypasses RLS for admin operations

---

## Success Criteria

After Milestone 6, you have:

| Feature | Status |
|---------|--------|
| Conversations in Supabase | ✅ |
| Messages in Supabase | ✅ |
| Anonymous sessions (sessionStorage) | ✅ |
| API endpoints for CRUD | ✅ |
| Frontend uses API (no localStorage) | ✅ |
| Account sign up / sign in | ✅ |
| Claim anonymous conversations | ✅ |
| Session dies on tab close | ✅ |

**What's NOT done yet:**
- User profiles in database (still pasted text)
- Conversation history UI (list past conversations)
- Real profile creation/editing

Those can be Milestone 7 when you're ready.

---

## Out of Scope

- Multi-conversation history view
- Conversation search
- Conversation sharing
- Team/workspace features
- Profile schema beyond text field

---

## Migration Path

When you deploy this:

1. Existing users with localStorage conversations → **lost** (acceptable, pre-launch)
2. New users → anonymous sessions → optionally claim on signup
3. Future: Import/export for power users

---

## Estimated Time

| Sprint | Estimate |
|--------|----------|
| 6.1: Database Schema | 30 min |
| 6.2: API Endpoints | 1.5 hours |
| 6.3: Frontend Integration | 2 hours |
| 6.4: Account Foundation | 1.5 hours |
| **Total** | **~5.5 hours** |

---

## Next Steps After Milestone 6

Potential Milestone 7 features:
- Conversation list UI (see all past conversations)
- Profile management page (replace pasted text)
- Conversation export (JSON/Markdown)
- Share conversation via link
- Delete conversation

---

Ready to start Sprint 6.1?
