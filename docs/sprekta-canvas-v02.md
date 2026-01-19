# Sprekta Canvas v0.2

## The One-Liner
"Quick capture calendar - jot it down, we'll parse it, you stay in control"

---

## What We're Building (Prototype Scope)

A calendar app with **two core interactions** + **developer infrastructure for AI-assisted development.**

### 1. Quick Capture (User-Facing)
**User flow:**
- Tap "Jot it down" button (or voice button)
- Say/type: "Call mom tomorrow at 6pm"
- Sprekta parses → creates calendar event
- Done in <5 seconds

**What the AI does:**
- Extract: action ("call mom"), time ("tomorrow at 6pm"), type (phone call)
- Create calendar event with smart defaults
- If info missing: add to calendar anyway, ask follow-up later

### 2. Traditional Calendar (User-Facing)
**User flow:**
- See month/week/day views
- Tap event → edit details
- Drag to reschedule
- Delete if needed
- Create manual events (fallback)

**Why it matters:**
- Builds trust ("I can fix anything myself")
- Familiar = lower adoption friction
- Safety net enables AI experimentation

### 3. Developer Infrastructure (Claude Code Workflow)
**Why this is essential:**
Simple "just build it" instructions don't work for AI-assisted development. Claude Code needs:
- **Visibility** into what's happening (response inspector, action logs)
- **Testability** without burning API credits (demo mode, mock AI)
- **Iteration safety** (versioning, snapshots)
- **Structured data contracts** (schemas that define UI ↔ AI boundaries)

**This isn't scope creep—it's the foundation that makes everything else possible.**

---

## Core Features

### ✅ User Features (v0.1)
- [x] Quick capture input (text)
- [x] Natural language parsing ("tomorrow 6pm", "next Tuesday", "Friday morning")
- [x] Calendar month view
- [x] Event creation via AI
- [ ] Event editing (click → edit modal)
- [ ] Event deletion
- [ ] Drag-and-drop reschedule
- [ ] Voice input (Web Speech API)

### ✅ Developer Infrastructure (v0.1) — REQUIRED
- [x] Dev panel (slide-out, toggle with badge)
- [x] Demo mode toggle (mock AI vs. real API)
- [x] Response inspector (see AI output JSON)
- [x] Action log (track what happened)
- [x] Test scenarios (pre-built inputs for testing)
- [x] Mock AI engine (returns ideal responses without API calls)
- [x] Data schemas (single source of truth for data structures)
- [x] Versioning system (snapshots for iteration, milestones for git)
- [x] Supabase integration (cloud persistence)

### 🔜 Nice to Have (v0.2)
- [ ] Week/day views
- [ ] Smart categorization (work/personal)
- [ ] Recurring events
- [ ] Follow-up questions (in-app notification)
- [ ] All-day events

### ⛔ NOT Building Yet
- Triage mode (conversational event refinement)
- Bulk planning
- Pattern learning
- Jarvis suggestions
- Auto-deprecation
- Wearable integration
- Team features

---

## Tech Stack (Current)

**Frontend:**
- Vanilla JS, HTML, CSS
- Voice input via Web Speech API (planned)
- Lucide icons

**Backend:**
- Vercel serverless functions (`/api/parse`, `/api/events`)
- Claude API for NLP parsing (Haiku 3.5 dev / Sonnet 3.5 prod)

**Database:**
- Supabase (PostgreSQL via Session Pooler)
- localStorage fallback

**Developer Tooling:**
- Dev panel with demo mode, response inspector, action log
- Mock AI engine (`test-data/mock-ai-engine.js`)
- Data schemas (`types/schemas.js`)
- Versioning (`versioning/` - snapshots + milestones)

**Deployment:**
- GitHub: `rramkhel/sprekta-lite`
- Vercel: auto-deploy on push
- Live: `https://sprekta-lite.vercel.app`

---

## Current State (as of Jan 2026)

### ✅ What's Working
| Feature | Status | Notes |
|---------|--------|-------|
| Quick capture (text) | ✅ Working | "Jot it down" → AI parses → calendar |
| AI parsing | ✅ Working | Claude API via `/api/parse` |
| Calendar month view | ✅ Working | Grid layout, events as pills |
| Event creation | ✅ Working | Via quick capture |
| Dev panel | ✅ Working | Demo mode, inspector, logs |
| Mock AI | ✅ Working | Test without API costs |
| Versioning | ✅ Working | Snapshots + milestones |
| Supabase | ✅ Working | Cloud persistence |

### ⚠️ What Needs Work
| Feature | Status | What's Missing |
|---------|--------|----------------|
| Event editing | ⚠️ Partial | Click shows debug JSON, no edit UI |
| Event deletion | ⚠️ Partial | Only via "Clear All" |
| Voice input | ❌ Not built | Web Speech API ready but not wired |
| Drag-and-drop | ❌ Not built | |

---

## User Journey (Happy Path)

**Monday morning:**
1. User opens Sprekta
2. Remembers: "Oh crap, need to RSVP to Sarah's wedding"
3. Taps "Jot it down"
4. Says: "RSVP Sarah's wedding by tomorrow"
5. Sprekta creates event for tomorrow (auto-picks 10am)
6. User sees it on calendar, done
7. Tomorrow morning: gets reminder notification

**What makes this work:**
- Zero friction input (<5 sec)
- Smart enough to understand "tomorrow"
- Manual fallback if AI gets it wrong
- Actually reminds them (reliability)

---

## Key Interactions to Nail

### Quick Capture Parsing
**Input examples:**
- "Call mom tomorrow at 6pm" → Event: "Call mom", Tue 6:00 PM
- "Dentist next Tuesday" → Event: "Dentist", Next Tue, 9:00 AM (default)
- "Pick up dry cleaning Saturday morning" → Event: "Pick up dry cleaning", Sat 9:00 AM
- "RSVP wedding by Friday" → Event: "RSVP wedding", Fri 10:00 AM

**Edge cases:**
- Missing time → default to 10am or ask later
- Missing date → assume "today" or ask
- Ambiguous → add to calendar, flag for review

### Calendar Views
**Month view:**
- Standard grid layout
- Events shown as blocks
- Tap to expand details
- Drag to reschedule

### Event Editing (NEEDS DESIGN)
**Open questions:**
1. What happens when you click an event?
   - Option A: Full-screen modal with edit form
   - Option B: Inline expansion (accordion style)
   - Option C: Side panel (like Google Calendar)
2. What fields are editable?
   - Title, date, time, notes (minimum)
   - Category, reminder, repeat (v0.2?)
3. How do you delete?
   - Delete button in edit view
   - Swipe gesture (mobile)
   - Long-press context menu

---

## Claude Code Workflow

### The Problem with Simple Instructions
"Build a calendar with quick capture" doesn't work because:
- Claude Code can't see what the AI returned
- Can't test without burning API credits
- No way to compare "before" and "after"
- Changes compound unpredictably

### The Solution: Developer Infrastructure
1. **Demo Mode** - Test with mock AI (free, instant, predictable)
2. **Response Inspector** - See exactly what AI returned
3. **Action Log** - Track what happened and when
4. **Schemas** - Define data contracts so UI and AI agree
5. **Versioning** - Save state before risky changes, rollback if needed

### Workflow for Adding Features
1. Design the ideal UI in this chat (mock it up, define interactions)
2. Define the data schema (what JSON does the AI return?)
3. Add mock scenarios that return ideal responses
4. Have Claude Code build the UI against mocks
5. Test with demo mode (free iteration)
6. Graduate to real AI when UI is solid
7. Save a snapshot before moving to next feature

---

## Success Metrics (Prototype)

**Internal testing (first 2 weeks):**
- [ ] Can quick capture 10 events without friction
- [ ] AI parses 80%+ of natural language correctly
- [ ] Manual editing feels smooth (no bugs)
- [ ] Voice input works reliably

**Beta testing (50 users, Month 1):**
- [ ] 70%+ use quick capture at least once
- [ ] Average 5+ captures per week
- [ ] <10% report parsing errors
- [ ] "Easier than Google Calendar" feedback

---

## What This Unlocks

**If v0.1 works:**
- Validates core interaction model
- Proves AI parsing is reliable enough
- Shows users trust quick capture
- Foundation for triage mode
- Data to train pattern learning

**If v0.1 fails:**
- Voice input too finicky → focus on text first
- AI parsing not accurate enough → improve prompts/model
- Users don't trust it → add more manual controls
- Too complex → simplify even more

---

## Next Steps (Suggested)

### Immediate: Finish Core User Features
1. **Design event editing UX** (this chat)
2. **Design event deletion UX** (this chat)
3. **Write Claude Code instructions** for edit/delete
4. **Test with demo mode**
5. **Ship to production**

### Then: Voice Input
6. **Design voice UX** (this chat)
7. **Implement Web Speech API**
8. **Test reliability**

### Then: Polish
9. Drag-and-drop reschedule
10. Visual polish (animations, microinteractions)
11. Beta user testing

---

## Open Design Questions

1. **Event click behavior:** Modal? Inline? Side panel?
2. **Delete UX:** Button? Swipe? Confirmation?
3. **Voice indicator:** How do users know it's listening?
4. **Ambiguous input:** Immediate clarification or silent defaults?
5. **Empty states:** What does the calendar look like with no events?

---

**This canvas reflects reality:** Developer infrastructure is not optional, it's the foundation that enables Claude Code to work effectively. The user features are the goal, but the dev tooling is what makes them achievable.
