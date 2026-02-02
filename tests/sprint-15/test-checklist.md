# Sprint 15 Manual Test Checklist

## Test Setup

### Prerequisites
1. **Clear test data:**
   ```sql
   -- In Supabase SQL editor
   DELETE FROM profiles WHERE user_id = 'YOUR_TEST_USER_ID';
   ```

2. **Browser windows:**
   - One signed in (authenticated tests)
   - One incognito/signed out (anonymous tests)

3. **Supabase dashboard open** to verify database changes

---

## Test Cases

### ✅ T1: Happy Path — Full Flow
**Precondition:** Logged in, no existing profile

| # | User Says | Expected AI Response | Verify |
|---|-----------|---------------------|--------|
| 1 | "add to my profile: I'm a morning person, prefer meetings before noon" | "I'll remember this! Here's what I'm adding: **Patterns** • Morning person • Prefers meetings before noon. Does this look right?" | `profile_suggestion` in response |
| 2 | "yep" | "✓ Saved to your profile!" | `profile_save` in response, DB updated |

**Database check:**
```sql
SELECT patterns FROM profiles WHERE user_id = 'YOUR_USER_ID';
-- Expected: ["Morning person", "Prefers meetings before noon"]
```

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T2: Correction Before Save
**Precondition:** Logged in

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "save to my profile: standup is at 9am daily" | Shows summary, asks confirmation |
| 2 | "actually it's 9:30am" | "Got it — updated to 9:30am. [shows corrected summary] Save this?" |
| 3 | "yes" | "✓ Saved!" |

**Verify:** Profile has "9:30am" not "9am"

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T3: Abandonment
**Precondition:** Logged in

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "add to my profile: I like hiking" | Shows summary, asks confirmation |
| 2 | "what's on my calendar tomorrow?" | Answers calendar question, no mention of profile |

**Verify:** Profile NOT updated with hiking

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T4: Not Logged In
**Precondition:** Incognito/signed out

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "save to my profile: I work remotely" | "I'd love to remember this! [shows what would be saved] To save it to your profile, sign in first." |

**Verify:** No profile created, `profileError: 'not_authenticated'` in response

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T5: Adding to Existing Profile
**Precondition:** Logged in, profile already has `patterns: ["Morning person"]`

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "also add to my profile: I take Fridays off" | Shows summary with just the new item |
| 2 | "save it" | "✓ Saved!" |

**Database check:**
```sql
SELECT patterns FROM profiles WHERE user_id = 'YOUR_USER_ID';
-- Expected: ["Morning person", "Takes Fridays off"]
```

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T6: Key People
**Precondition:** Logged in

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "remember that Sarah is my manager and Tom is my partner" | "I'll remember! **Key People** • Sarah (manager) • Tom (partner). Save this?" |
| 2 | "yes" | "✓ Saved!" |

**Database check:**
```sql
SELECT key_people FROM profiles WHERE user_id = 'YOUR_USER_ID';
-- Expected: [{"name": "Sarah", "relationship": "manager"}, {"name": "Tom", "relationship": "partner"}]
```

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T7: Notes Append (Complex Info)
**Precondition:** Logged in, profile has existing notes: "Commute is 30 minutes"

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "add to my profile: Life.Church volunteering - Media booth 8am-12:15pm, Cafe 9:45am-12:30pm, travel 30m from home" | Shows formatted summary |
| 2 | "looks good" | "✓ Saved!" |

**Database check:**
```sql
SELECT notes FROM profiles WHERE user_id = 'YOUR_USER_ID';
-- Expected: Original notes PLUS the new Life.Church info
```

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T8: Duplicate Detection
**Precondition:** Profile already has `patterns: ["Volunteers at church on Sundays"]`

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "save to my profile: I volunteer at church on Sundays" | "I actually already have that in your profile! Want me to add any details?" |

**Verify:** No duplicate created

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T9: Lost Context
**Steps:**

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "dentist tomorrow at 2pm" | Creates event |
| 2 | "yes save it" | "Sure! What would you like me to save to your profile?" (doesn't assume the dentist event) |

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

### ✅ T10: Profile Appears in Future Context
**Precondition:** Profile has "Volunteers at Life.Church on Sundays, Media booth 8am-12:15pm"

| # | User Says | Expected AI Response |
|---|-----------|---------------------|
| 1 | "church this sunday" | AI should reference the profile context — "Got it! Adding Life.Church volunteering for Sunday. Media booth at 8am, right?" |

**Verify:** AI demonstrates it "remembers"

**Status:** ⬜ Not tested | ✅ Passed | ❌ Failed
**Notes:**

---

## Test Summary

- [ ] T1: Happy path works
- [ ] T2: Corrections work
- [ ] T3: Abandonment works
- [ ] T4: Not logged in handled gracefully
- [ ] T5: Appends to existing profile
- [ ] T6: Key people saved correctly
- [ ] T7: Notes appended (not replaced)
- [ ] T8: Duplicates detected
- [ ] T9: Lost context handled
- [ ] T10: Profile used in future conversations

**Total:** 0/10 passed

---

## Common Issues

### AI returns plain text instead of JSON
- Check Vercel logs for JSON parse errors
- May need to strengthen the prompt

### Confirmation not detected
- User says "yep" but AI asks again
- Check if AI is seeing full conversation history

### Notes replaced instead of appended
- Old notes disappear
- Verify merge logic in api/conversation/[id]/message.js:330

### Duplicate patterns added
- Same pattern appears twice
- Verify dedup logic in api/conversation/[id]/message.js:298

---

## Test Date: _____________
**Tester:** _____________
**Environment:** Dev | Staging | Production
