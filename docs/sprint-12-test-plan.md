# Sprint 12 Test Plan - Brain Dump Scenarios

## Pre-Test Verification

### ✅ Implementation Checklist
- [x] Database: `todos` table with time_group, priority, deadline_time columns
- [x] System Prompt: Updated with brain dump logic
- [x] Tools: create_event and create_todo tool definitions
- [x] Tool Execution: executeToolCalls() handler
- [x] API Endpoints: GET /api/todos and PATCH /api/todos/[id]
- [x] UI: TodosUI module with grouped display
- [x] UI: Todos panel button in header
- [x] Styles: Complete todos panel styling

### Dev Server Status
- Server running at: http://localhost:3000
- Tool execution confirmed working (see logs)

---

## Test Scenarios

### Scenario 1: Simple Brain Dump (Mixed Events & Todos)
**Input:**
```
Dentist tomorrow at 2pm
Call mom this week
Finish Q1 report by Friday (non-negotiable)
Learn React (flexible, someday)
Team meeting Thursday 10am
```

**Expected Behavior:**
1. AI organizes by time (tomorrow, this_week, someday)
2. AI marks priorities (🔴 non_negotiable for Q1 report, 🟢 flexible for React)
3. Creates:
   - 2 events (dentist, team meeting) - both have specific times
   - 3 todos (call mom, Q1 report, learn React)
4. Asks for clarification on "this week" for call mom
5. Confirms priorities before finalizing

**Verification:**
- Click todos button in header
- Todos panel opens
- See groups: Tomorrow, This Week, Someday
- Priority icons display correctly (🔴🟡🟢)

---

### Scenario 2: Deadline-Heavy Dump
**Input:**
```
Fix bug by end of day (critical!)
Review PR by tomorrow noon
Submit expense report by Friday
Q2 planning due March 1st
```

**Expected Behavior:**
1. All recognized as todos with deadlines
2. AI marks first as non_negotiable (critical)
3. AI organizes: today, tomorrow, this_week, future
4. Creates deadline and deadline_time fields
5. Asks to confirm if "end of day" means 5pm or specific time

**Verification:**
- Todos show deadline dates
- Priority matches urgency
- Time groups reflect timing

---

### Scenario 3: Vague Dump (Needs Clarification)
**Input:**
```
Need to talk to Sarah
Fix that thing
Meeting sometime next week
```

**Expected Behavior:**
1. AI identifies missing info
2. Cordons off unclear items
3. Asks:
   - "Talk to Sarah" - about what? Event or todo?
   - "Fix that thing" - what thing?
   - "Meeting" - with who? What time?
4. Does NOT create items until clarified

**Verification:**
- AI enters "clarify" phase
- No todos/events created yet
- User gets follow-up questions

---

### Scenario 4: Time-Heavy Dump (All Events)
**Input:**
```
Doctor Monday 9am
Lunch with Alex Tuesday 12:30pm
Standup every day at 10am
Coffee chat Friday 3pm
```

**Expected Behavior:**
1. All recognized as events (have specific times)
2. Standup might trigger "recurring" question
3. Creates calendar events, not todos
4. AI asks priorities

**Verification:**
- Events appear on calendar
- Todos panel should be empty (unless recurring standup becomes todo)

---

### Scenario 5: Priority-Focused Dump
**Input:**
```
🔴 URGENT: Server is down - fix now
🟡 Important: Update docs before launch
🟢 Nice to have: Refactor old code
Review team feedback (important)
```

**Expected Behavior:**
1. AI recognizes emoji priorities
2. Maps to non_negotiable (🔴), important (🟡), flexible (🟢)
3. "Review team feedback" marked as important from text
4. Organizes by time (all likely "today" or "someday")

**Verification:**
- Todos panel shows correct priority icons
- Urgent item in "today" group
- Refactor in "someday" group

---

### Scenario 6: Complex Real-World Dump
**Input:**
```
Lots going on:
- RealRoots networking event tonight 6-9pm
- Need to prep for client meeting tomorrow
- Dentist appointment next Tuesday 2pm
- Finish quarterly report (due Friday, non-negotiable)
- Call insurance about claim
- Team offsite planning (March)
- Learn about new AI tools
- Coffee with mentor sometime
```

**Expected Behavior:**
1. AI separates:
   - Events: RealRoots (today), dentist (next week)
   - Todos: client prep (tomorrow), report (this week), insurance (someday), offsite (future), AI tools (someday), coffee (someday)
2. AI asks clarification:
   - Client prep: what time? (might suggest doing today)
   - Insurance: deadline?
   - Coffee: when?
3. AI confirms priorities:
   - Report: non_negotiable
   - Client prep: important (inferred)
   - Learning: flexible

**Verification:**
- Mix of events on calendar + todos in panel
- Todos grouped across all time groups
- Priorities distributed correctly

---

## UI/UX Tests

### Todos Panel
1. **Open/Close:**
   - Click list-checks icon in header → panel opens
   - Click × button → panel closes
   - Click outside panel → panel stays open (overlay)

2. **Grouping:**
   - Groups appear in order: Today, Tomorrow, This Week, Future, Someday
   - Empty groups don't render
   - Each group has label (h4)

3. **Todo Items:**
   - Checkbox ☐ on left
   - Priority icon (🔴🟡🟢) next to title
   - Title displays correctly
   - Deadline shows as "due Feb 3"
   - Scheduled time shows as "2:30pm"

4. **Interactions:**
   - Click checkbox → todo marked completed
   - Completed todo disappears from list
   - Refresh button reloads todos
   - Panel responsive on mobile

---

## API Tests

### GET /api/todos
```bash
curl http://localhost:3000/api/todos | jq '.[] | {title, time_group, priority}'
```
**Expected:** Array of todos with all fields

### PATCH /api/todos/[id]
```bash
curl -X PATCH http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```
**Expected:** Todo marked as completed, completed_at timestamp set

---

## Edge Cases

### Empty States
- [ ] No todos → "No todos yet" message
- [ ] All completed → "All done!" message
- [ ] Only "someday" todos → Other groups don't render

### Validation
- [ ] Deadline without time_group → defaults to "someday"
- [ ] Missing priority → defaults to "flexible"
- [ ] Invalid time_group → rejected by database CHECK constraint

### Performance
- [ ] 100+ todos → pagination or virtualization needed?
- [ ] Rapid todo creation → no duplicates
- [ ] Concurrent updates → last write wins

---

## Success Criteria

Sprint 12 is complete when:
- [x] All implementation items checked off
- [ ] Scenarios 1-6 work as expected
- [ ] UI/UX tests pass
- [ ] API tests return correct data
- [ ] No console errors during normal usage
- [ ] Todos panel smoothly opens/closes
- [ ] Priority icons and time grouping work perfectly

---

## Known Issues
- Profile update errors in console (unrelated to Sprint 12)
- JSON parse errors (likely from previous chat responses, not Sprint 12)

---

## Next Steps After Testing
1. Fix any bugs found during testing
2. Add POST /api/todos endpoint for external creation
3. Consider adding todo editing/deletion UI
4. Add filters (by priority, by completion status)
5. Add sorting within groups (by deadline, by created_at)
6. Consider adding scheduled_time display on calendar
