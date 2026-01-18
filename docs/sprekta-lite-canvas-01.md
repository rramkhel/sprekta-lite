# Sprekta Canvas v0.1

## The One-Liner
"Quick capture calendar - jot it down, we'll parse it, you stay in control"

---

## What We're Building (Prototype Scope)

A calendar app with **two core interactions:**

### 1. Quick Capture
**User flow:**
- Tap "Jot it down" button (or voice button)
- Say/type: "Call mom tomorrow at 6pm"
- Sprekta parses → creates calendar event
- Done in <5 seconds

**What the AI does:**
- Extract: action ("call mom"), time ("tomorrow at 6pm"), type (phone call)
- Create calendar event with smart defaults
- If info missing: add to calendar anyway, ask follow-up later

### 2. Traditional Calendar
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

---

## Core Features (Keep It Simple)

### ✅ Must Have (v0.1)
- [ ] Quick capture input (text + voice)
- [ ] Natural language parsing ("tomorrow 6pm", "next Tuesday", "Friday morning")
- [ ] Calendar month view
- [ ] Event creation/edit/delete
- [ ] Event details (title, time, date, notes)
- [ ] Drag-and-drop reschedule

### 🔜 Nice to Have (v0.2)
- [ ] Week/day views
- [ ] Smart categorization (work/personal)
- [ ] Recurring events
- [ ] Follow-up questions (in-app notification)
- [ ] All-day events

### ⛔ NOT Building Yet
- Triage mode
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
- Voice input via Web Speech API
- LocalStorage for now (Supabase later)

**Backend:**
- Vercel serverless functions
- Claude API for NLP parsing

**Current repo:**
- GitHub: `rramkhel/sprekta-lite`
- Live: `https://sprekta-lite.vercel.app`

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

**Event card:**
- Title (editable)
- Date/time (editable)
- Notes (optional)
- Delete button
- Save changes

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

## Next Steps

1. **Review this canvas** - does it capture the right scope?
2. **Generate implementation instructions** for Claude Code
3. **Build v0.1** in the existing repo
4. **Test internally** with 5-10 users
5. **Iterate** based on feedback

---

**Does this feel like the right starting point?** Simple enough to build quickly, focused enough to validate the core concept?