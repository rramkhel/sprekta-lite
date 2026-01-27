# Sprint 10.5: Testing

## Context

Part of Sprint 10: Capture-First Chat Flow. This sprint provides comprehensive testing scenarios to verify the entire capture-to-calendar flow works correctly.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

Verify all capture scenarios work correctly: single items, multi-item dumps, follow-ups, and calendar integration.

---

## Test Scenarios

### Test 1: Simple Single Capture

**Input:**
```
dentist wednesday 2pm
```

**Expected behavior:**
- ✅ AI confirms: "Got it - added dentist Wednesday at 2pm."
- ✅ AI offers 2-3 questions (location? anything to prep?)
- ✅ Event appears on calendar immediately
- ✅ Event has `source: 'chat'` and `conversation_id` set

**Verify in Supabase:**
- Check events table for the new row
- Confirm `conversation_id` is not null
- Confirm `source = 'chat'`

---

### Test 2: Capture with Details

**Input:**
```
realroots networking event tonight 6:15-9pm at chianti's on whyte ave, leaving from office
```

**Expected behavior:**
- ✅ AI confirms with all details
- ✅ AI offers relevant questions (transportation? block travel time?)
- ✅ Event created with title, date, start_time, end_time, location
- ✅ Notes include "leaving from office"

**Verify in Supabase:**
- Check that `start_time = '18:15'` and `end_time = '21:00'`
- Check that `location` contains "Chianti's" or "Whyte Ave"
- Check that `notes` mentions leaving from office

---

### Test 3: Rapid Fire Dumping

**Input 1:**
```
dentist wednesday 2pm
```

**Input 2:** (without answering questions)
```
also Q1 report due friday
```

**Input 3:**
```
and coffee with Sarah monday morning
```

**Expected behavior:**
- ✅ Each gets its own confirmation
- ✅ Each creates a separate event
- ✅ AI doesn't nag about unanswered questions
- ✅ Calendar shows all three events

**Verify:**
- Should have 3 separate events in database
- All linked to same `conversation_id`
- All have `source: 'chat'`

---

### Test 4: Incomplete Capture

**Input:**
```
need to call mom sometime this week
```

**Expected behavior:**
- ✅ AI says "Captured" (not "Added") since no specific date/time
- ✅ AI asks when specifically
- ✅ Event might not be created (no date)
- ✅ OR event created with title only, on today's date

**Note:** Verify which behavior the prompt produces. If no date provided, AI should use `commit: null` or not include a date in the `captured` object.

---

### Test 5: Answering Questions

**Input 1:**
```
meeting with Sarah tomorrow
```

**AI responds with questions about time/location**

**Input 2:**
```
10am at the coffee shop on 4th
```

**Expected behavior:**
- ✅ AI acknowledges briefly
- ✅ Original event is updated (or new event created with full info)
- ✅ Calendar reflects the update

**Note:** This test requires Sprint 11 (update functionality) to fully work. For now, verify that a new event is created with complete info.

---

### Test 6: Multi-Item Dump

**Input:**
```
okay I've got a bunch - realroots tonight 6pm, dentist wed 2pm, Q1 doc due friday
```

**Expected behavior:**
- ✅ AI lists all three in confirmation
- ✅ First event (realroots) created immediately
- ✅ AI offers to flesh out any of them
- ✅ Subsequent items can be captured in follow-up messages

**Note:** Current implementation captures first item only. Other items should be mentioned in reply and captured in subsequent messages.

---

## Verification Checklist

Before marking Sprint 10 complete:

- [ ] **Database:** `events` table has `conversation_id` column
- [ ] **API:** New system prompt deployed
- [ ] **API:** Event creation code added to message handler
- [ ] **UI:** Calendar refreshes when event created
- [ ] **Test 1 passes:** Simple capture works
- [ ] **Test 2 passes:** Capture with details works
- [ ] **Test 3 passes:** Rapid fire dumping works
- [ ] **Test 6 passes:** Multi-item mention works
- [ ] **Database verification:** Events have correct `source` and `conversation_id`

---

## Manual Testing Steps

1. **Clear test data** (optional):
   ```sql
   DELETE FROM events WHERE source = 'chat' AND created_at > NOW() - INTERVAL '1 hour';
   DELETE FROM conversations WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Open the chat panel** in the UI

3. **Run each test scenario** above

4. **After each test:**
   - Check calendar UI for the event
   - Check Supabase events table
   - Verify `conversation_id` is set
   - Verify `source = 'chat'`

5. **Check browser console** for errors

6. **Check server logs** (Vercel dashboard) for API errors

---

## Known Limitations (Future Work)

These are expected limitations that will be addressed in future sprints:

- **No event updates yet:** Answering follow-up questions creates new events instead of updating existing ones (Sprint 11)
- **Single item only:** Multi-item dumps only create the first item (Sprint 13)
- **No planning mode:** Everything commits immediately, no "pending" state (Sprint 12)

---

## Final Push

After all tests pass:

```bash
git push origin main
```

Verify on production: `https://sprekta-lite.vercel.app`

---

## Success Criteria

Sprint 10 is complete when:

1. ✅ User can dump an event in chat
2. ✅ AI confirms immediately with warm language
3. ✅ Event appears on calendar without refresh
4. ✅ Events in database have `conversation_id` and `source: 'chat'`
5. ✅ Rapid fire dumping works (multiple items in sequence)
6. ✅ No regressions in existing calendar functionality
