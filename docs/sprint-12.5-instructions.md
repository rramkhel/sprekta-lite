# Sprint 12.5: Testing Scenarios

## Context

Part of Sprint 12: Brain Dump → Organized Calendar & Todos. This sprint validates that the entire brain dump flow works end-to-end.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

Test all scenarios to ensure:
1. Brain dumps are parsed correctly
2. Items are organized by time
3. Priorities are detected accurately
4. Events and todos are created in database
5. Missing info is identified and questions are asked
6. Priority confirmation is included

---

## Test 1: Basic Brain Dump

### Input
```
dentist wednesday 2pm
call mom
finish report by friday
bible study tonight 7-9pm
```

### Expected Behavior

**AI Response should:**
- Organize into TODAY, THIS WEEK, SOMEDAY groups
- Show priority icons
- Mark created items with ✓
- Ask for priority confirmation at end

**Example output:**
```
Got it! Here's your brain dump organized:

TODAY
   🟡 Bible study — 7-9pm ✓

THIS WEEK
   🟡 Dentist — Wednesday 2pm ✓
   🔴 Finish report — due Friday ✓

SOMEDAY
   🟢 Call mom ✓

Did I get the priorities right? Anything else that's actually non-negotiable?
```

**Database checks:**
```sql
-- Should have 1 event (dentist)
SELECT * FROM events WHERE title LIKE '%dentist%';

-- Should have 1 event (bible study)
SELECT * FROM events WHERE title LIKE '%bible%';

-- Should have 2 todos (report, call mom)
SELECT * FROM todos WHERE title LIKE '%report%' OR title LIKE '%mom%';
```

**Verify:**
- [ ] Bible study created as event (has time)
- [ ] Dentist created as event (has time)
- [ ] Report created as todo with deadline Friday
- [ ] Call mom created as todo with time_group=someday
- [ ] Response groups by time correctly
- [ ] Priority icons shown

---

## Test 2: Missing Time for Event

### Input
```
meeting with sarah tomorrow
realroots tuesday
```

### Expected Behavior

**AI Response should:**
- NOT create events yet (missing time)
- Put both in "Need more info" section
- Ask specific questions

**Example output:**
```
Got it! I've captured these:

📝 Need a bit more info:
   • "Meeting with Sarah tomorrow" — What time is the meeting?
   • "RealRoots Tuesday" — What time does it start?
```

**Database checks:**
```sql
-- Should have 0 new events (missing time)
SELECT COUNT(*) FROM events WHERE title LIKE '%sarah%' OR title LIKE '%realroots%';
-- Expected: 0
```

**Verify:**
- [ ] No events created (missing required time)
- [ ] Both items mentioned in "Need more info" section
- [ ] Specific questions asked

### Follow-up Test

**Input:**
```
sarah is 10am, realroots is 6:30pm
```

**Expected:**
- Both events created now
- Response confirms creation

---

## Test 3: Priority Detection

### Input
```
visa bill due next friday - can't miss
pick up dry cleaning (not urgent)
prep for lilian meeting tomorrow 9am
```

### Expected Behavior

**AI Response should:**
- Detect "can't miss" → 🔴 non-negotiable
- Detect "not urgent" → 🟢 flexible
- Detect "for lilian" (key person) → 🔴 non-negotiable

**Example output:**
```
Got it! Here's your brain dump organized:

TOMORROW
   🔴 Prep for Lilian meeting — 9am ✓

THIS WEEK
   🔴 Visa bill — due Friday ✓

SOMEDAY
   🟢 Pick up dry cleaning ✓

Did I get the priorities right? Anything else that's actually non-negotiable?
```

**Database checks:**
```sql
-- Check priorities
SELECT title, priority FROM todos WHERE title LIKE '%visa%';
-- Expected: priority = 'non_negotiable'

SELECT title, priority FROM todos WHERE title LIKE '%dry cleaning%';
-- Expected: priority = 'flexible'

SELECT title, priority FROM todos WHERE title LIKE '%lilian%';
-- Expected: priority = 'non_negotiable'
```

**Verify:**
- [ ] Visa bill marked 🔴 (explicit "can't miss")
- [ ] Dry cleaning marked 🟢 (explicit "not urgent")
- [ ] Lilian prep marked 🔴 (key person waiting)
- [ ] Priority confirmation asked at end

---

## Test 4: Complex Dump (Real Example)

### Input
```
i have to reschedule my dinner with aly - she was busy with bridesmaids stuff

rentsync - need to finish landlord login by 9am tomorrow for lilian meeting. also need to prep for refinement tomorrow AM.

bible study tonight 7-9pm

realroots tuesday 6:30-9pm

conner's bday jan 15 - flowers arriving 9am-12pm, text him sonnet 116 morning of

need to finish sprekta budget (not urgent)
```

### Expected Behavior

**AI Response should:**
- Parse all 6+ items
- Organize by time: TODAY → TOMORROW → THIS WEEK → SOMEDAY
- Detect priorities correctly
- Ask about missing info (refinement time)
- Confirm priorities at end

**Example output:**
```
Got it! Here's your brain dump organized:

TODAY
   🔴 Bible study — 7-9pm ✓

TOMORROW
   🔴 Finish landlord login — for Lilian meeting 9am ✓
   🟡 Lilian refinement meeting — needs time

THIS WEEK
   🟡 RealRoots networking — Tuesday 6:30-9pm ✓

FUTURE
   🔴 Conner's bday flowers delivery — Jan 15, 9am-12pm ✓
   🔴 Text Conner Sonnet 116 — Jan 15 morning ✓

SOMEDAY
   🟢 Finish Sprekta budget ✓
   🟢 Reschedule dinner with Aly ✓

—

📝 Need a bit more info:
   • "Refinement tomorrow AM" — What time does refinement start?

—

Did I get the priorities right? Anything else that's actually non-negotiable?
```

**Database checks:**
```sql
-- Count items
SELECT COUNT(*) FROM events WHERE source = 'chat' AND created_at > NOW() - INTERVAL '5 minutes';
-- Expected: 3-4 (bible study, realroots, conner flowers, maybe refinement if time inferred)

SELECT COUNT(*) FROM todos WHERE source = 'chat' AND created_at > NOW() - INTERVAL '5 minutes';
-- Expected: 4-5 (landlord login, text conner, budget, reschedule aly, maybe refinement)

-- Check specific items
SELECT title, priority, time_group FROM todos WHERE title LIKE '%landlord%';
-- Expected: priority='non_negotiable', time_group='tomorrow'

SELECT title, priority, time_group FROM todos WHERE title LIKE '%budget%';
-- Expected: priority='flexible', time_group='someday'
```

**Verify:**
- [ ] All items parsed (nothing skipped)
- [ ] Organized by time correctly
- [ ] Priorities detected: bible 🔴, landlord 🔴, budget 🟢
- [ ] Asked about refinement time
- [ ] Priority confirmation at end
- [ ] Events have dates + times
- [ ] Todos have appropriate time_group

---

## Test 5: Follow-up Answers

### Initial Input
```
meeting with sarah tomorrow
```

**AI Response:**
```
Captured: Meeting with Sarah tomorrow

What time is the meeting?
```

### Follow-up Input
```
10am
```

**Expected:**
- Event created for tomorrow at 10am
- Response confirms creation

**Example output:**
```
Got it - added meeting with Sarah tomorrow at 10am ✓

Anything else on your mind?
```

**Database check:**
```sql
SELECT * FROM events WHERE title LIKE '%sarah%' ORDER BY created_at DESC LIMIT 1;
-- Should have start_date = tomorrow, start_time = '10:00'
```

**Verify:**
- [ ] Event created with correct date and time
- [ ] Conversational confirmation
- [ ] No re-listing of previous items

---

## Test 6: Priority Correction

### Initial Input
```
call mom
finish tax forms
```

**AI Response:**
```
Got it! Here's your brain dump organized:

SOMEDAY
   🟢 Call mom ✓
   🟢 Finish tax forms ✓

Did I get the priorities right?
```

### Follow-up Input
```
actually taxes are urgent - due next week
```

**Expected:**
- AI updates priority for tax forms
- Moves to correct time group
- Confirms the change

**Example output:**
```
Got it - updated tax forms to 🔴 non-negotiable and moved to THIS WEEK.

Anything else?
```

**Database check:**
```sql
SELECT title, priority, time_group FROM todos WHERE title LIKE '%tax%';
-- Should show priority='non_negotiable', time_group='this_week'
```

**Verify:**
- [ ] Priority updated to non-negotiable
- [ ] Time group updated to this_week
- [ ] Conversational acknowledgment

---

## Test 7: Todo List UI

### Setup
1. Create several todos via chat (from tests above)
2. Navigate to todo list page/panel

### Expected UI Behavior

**Display:**
- [ ] Todos grouped by time (TODAY, TOMORROW, THIS WEEK, FUTURE, SOMEDAY)
- [ ] Priority icons displayed (🔴🟡🟢)
- [ ] Deadlines shown for todos with deadlines
- [ ] Scheduled times shown if present

**Interaction:**
- [ ] Click checkbox → todo marked complete
- [ ] Click checkbox → todo disappears from list
- [ ] Refresh button reloads todos

**Database check after completion:**
```sql
SELECT title, completed, completed_at FROM todos WHERE id = '<todo-id>';
-- Should show completed=true, completed_at=<timestamp>
```

---

## Verification Checklist

Before marking Sprint 12 complete, verify ALL of these:

### Database
- [ ] `todos` table exists with all columns
- [ ] RLS policies work correctly
- [ ] Indexes created on user_id, session_id, time_group, completed

### System Prompt
- [ ] AI organizes by time correctly
- [ ] AI marks priorities correctly
- [ ] AI asks for missing info
- [ ] AI confirms priorities at end
- [ ] AI handles follow-ups gracefully

### Tool Execution
- [ ] `create_event` tool works
- [ ] `create_todo` tool works
- [ ] Events have required fields (date + time)
- [ ] Todos have required fields (title, priority, time_group)
- [ ] conversation_id links work

### UI
- [ ] Todos display in list
- [ ] Grouped by time_group
- [ ] Priority icons show
- [ ] Checkbox marks complete
- [ ] Refresh reloads todos

### Integration
- [ ] Chat creates events → calendar updates
- [ ] Chat creates todos → todo list updates
- [ ] Completing todos removes from list
- [ ] All test scenarios pass

---

## Commit Message

```bash
git add -A
git commit -m "test: verify sprint 12 brain dump flow

All test scenarios passing:
- Basic brain dump parsing
- Missing time detection
- Priority detection
- Complex multi-item dump
- Follow-up answers
- Priority correction
- Todo list UI

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## What's Next

After Sprint 12 is complete, potential future enhancements:

**Sprint 13: Smart Scheduling**
- AI suggests times based on calendar availability
- Blocks buffer time before/after events
- Respects user's time preferences from profile

**Sprint 14: Recurring Items**
- Support for "every monday" type events
- Recurring todos (weekly reviews, etc)
- Smart handling of series

**Sprint 15: Context & Memory**
- Remember recent context across sessions
- Surface relevant past items
- "You mentioned X last week..."

**Sprint 16: Batch Operations**
- "Move all important todos to tomorrow"
- "Reschedule everything from Thursday"
- Bulk priority updates

---

## Success Criteria

Sprint 12 is complete when:
- ✅ User can dump mixed content (events, todos, deadlines)
- ✅ AI organizes by time and priority
- ✅ Events created on calendar
- ✅ Todos created in list
- ✅ Missing info identified and asked about
- ✅ Priorities confirmed at end
- ✅ All test scenarios pass
- ✅ No manual capture needed - just brain dump and go
