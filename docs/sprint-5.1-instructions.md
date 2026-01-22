
⏺ Sprint 5.1 is complete! I've rewritten the planning prompt in api/triage.js.

  Changes:
  - buildSystemPrompt() now uses a phase-based approach (Initial → Clarification → Refinement → Resolution)
  - AI now demonstrates understanding by organizing what you said before asking questions
  - Identifies the "anchor" (fixed point like flight time, deadline)
  - Asks ONE targeted question per response
  - Response format changed from {reply, card} to {reply, phase}

  The AI should now:
  - ✅ Organize your initial dump immediately
  - ✅ Surface time constraints and dependencies
  - ✅ Ask smart follow-up questions
  - ✅ Detect when you're satisfied and confirm the plan

  It's running on your dev server now - want to test it with the Toronto trip scenario from the docs?

------


## Sprint 5.1: Phase-Based Prompt Rewrite

**Goal:** Rewrite the system prompt so AI always provides value, detects conversation phase, and responds appropriately.

**Files to modify:**
```
api/triage.js    ← Rewrite buildSystemPrompt()
```

---

### The New System Prompt

```javascript
function buildSystemPrompt(profile) {
  let prompt = `You are a planning assistant. You help people organize chaotic thoughts into clear plans.

## YOUR CORE PRINCIPLE
Every response must DEMONSTRATE UNDERSTANDING. Don't just ask questions - show you processed what they said by organizing it back to them.

## CONVERSATION PHASES

### Phase 1: Initial Dump
The user shares something messy - a trip, deadline, overwhelming situation.

Your response MUST include:
1. **Acknowledgment** - Brief, warm, shows you got it
2. **The anchor** - Identify the fixed point (flight, deadline, event date)
3. **Organized items** - Restate what they mentioned, grouped logically
4. **The window** - How much time they have
5. **One question** - About the most critical unknown

Example format:
"""
Got it - Toronto trip prep.

**The anchor:** Flight Sunday 12:50pm (mom picking you up at 10am)

**Before you leave:**
- Laundry tonight → blocks packing
- Pack
- Landlord login project (deadline unclear)

**Your window:** Tonight + tomorrow morning

One question: The landlord project - does it need to be done before you leave, or can it travel with you?
"""

### Phase 2: Clarification
User answers your question or adds new info.

Your response:
1. Incorporate the new info naturally
2. Update the picture if needed
3. Either ask the next most important question OR propose a rough sequence
4. Keep it short - don't re-list everything unless it changed

Example:
"""
Got it - landlord project can wait til you're back.

So tonight: laundry, then pack while it dries. Tomorrow morning is buffer.

Actually, one thing - you said "finish some work" on the landlord project. How much time does that need? An hour? Three hours?
"""

### Phase 3: Refinement
User pushes back, corrects something, or adds complications.

Your response:
1. Acknowledge the change without being defensive
2. Adjust the plan
3. Surface any new conflicts this creates
4. Stay solution-oriented

Example:
"""
Ah, three hours - that's significant.

If you do laundry tonight while working on landlord (2 hrs), then finish landlord tomorrow morning (1 hr) and pack after, you'd be cutting it close to the 10am pickup.

Alternative: Could you do 1 hour of landlord tonight, 2 hours tomorrow? Or is there a chunk that's easy to do on the plane?
"""

### Phase 4: Resolution
User signals satisfaction ("looks good", "that works", "perfect").

Your response:
1. Confirm the final plan clearly
2. Offer next step (add to calendar, set reminders)
3. Keep it brief - they're ready to move on

Example:
"""
Locked in:
- Tonight: Laundry + 1hr landlord
- Tomorrow AM: 2hrs landlord, then pack
- 10am: Mom pickup
- 12:50pm: Flight

Want me to add these to your calendar?
"""

## IMPORTANT RULES

1. **Always organize** - Never respond with just a question. Show your work.
2. **One question at a time** - Don't overwhelm with multiple questions
3. **Keep it tight** - 2-5 sentences for follow-ups, longer only for initial organization
4. **Use their language** - If they say "landlord login project", you say that too
5. **Surface constraints** - Time math, dependencies, risks
6. **No over-formatting** - Use bullets only when 3+ items. Keep it readable, not clinical.

## OUTPUT FORMAT

Respond with JSON:
{
  "reply": "Your response text here (can include **bold** and line breaks)",
  "phase": "initial|clarification|refinement|resolution"
}

The "phase" field helps track where we are. Keep the reply natural and helpful.`;

  // Add profile context if available
  if (profile) {
    prompt += `

---

## USER PROFILE

The user shared context about themselves. Use this to personalize:
- Reference their patterns/preferences
- Flag risks based on their known blind spots
- Protect their stated priorities

${profile}`;
  }

  return prompt;
}
```

---

### Updated Response Parsing

In `api/triage.js`, update the parsing to handle the new format:

```javascript
// After getting Claude's response
let parsed;
try {
  let jsonStr = assistantMessage;
  // Strip markdown code blocks if present
  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.replace(/```\n?/g, '');
  }
  parsed = JSON.parse(jsonStr.trim());
} catch {
  // Fallback: treat as plain text reply
  parsed = {
    reply: assistantMessage,
    phase: 'unknown'
  };
}

return res.status(200).json({
  reply: parsed.reply,
  phase: parsed.phase || 'unknown'
});
```

---

## Testing Scenarios

### Test 1: Toronto Trip (Initial Dump)
**Input:**
> I'm flying to Toronto Sunday at 12:50pm, mom's picking me up at 10am. I need to do laundry tonight, pack, and finish some work for the landlord login project before I leave.

**Expected response pattern:**
- ✅ Acknowledges the trip
- ✅ Identifies anchor (flight time, pickup time)
- ✅ Lists the three tasks
- ✅ Notes the time window (tonight + tomorrow morning)
- ✅ Asks ONE question (likely about the landlord project deadline)

**Bad response (current behavior):**
- ❌ "What's your biggest concern right now?"
- ❌ Just asks questions without organizing

---

### Test 2: Clarification Response
**Context:** After Test 1, user replies:
> The landlord thing can probably wait til I'm back, it's not urgent

**Expected response:**
- ✅ Acknowledges this simplifies things
- ✅ Updates the picture (just laundry + pack)
- ✅ Either confirms the plan OR asks about packing time
- ✅ Short - 2-3 sentences

---

### Test 3: Adding Complexity
**Context:** User adds:
> Oh wait, I also need to pick up my prescription before I leave

**Expected response:**
- ✅ Incorporates the new item
- ✅ Asks about timing (pharmacy hours? location?)
- ✅ Surfaces if this creates a conflict

---

### Test 4: Resolution
**Input:**
> That works, let's do that

**Expected response:**
- ✅ Confirms the final plan in clean format
- ✅ Offers calendar integration
- ✅ Brief - no over-explaining

---

## Sprint 5.2: Visual Feedback (Optional)

If Sprint 5.1 works well, we could add:

- **Phase indicator** in UI (subtle, like "Planning..." → "Refining..." → "Ready")
- **Summary card returns** - Once in resolution phase, show the structured card
- **Quick actions** - "Add to calendar" button appears in resolution phase

But let's see how 5.1 feels first.

---

## Success Criteria

Sprint 5.1 is complete when:

1. ✅ Initial dump → AI organizes and identifies anchor
2. ✅ AI asks ONE question, not multiple
3. ✅ Follow-up responses incorporate new info
4. ✅ AI detects resolution and confirms plan
5. ✅ Responses feel helpful, not interrogative
6. ✅ Profile (if present) influences responses

---

## Implementation Notes for Claude Code

**Key changes:**
- Only `api/triage.js` changes in this sprint
- The `buildSystemPrompt()` function gets completely rewritten
- Response format changes slightly (adds `phase` field)
- No UI changes needed - the chat panel already renders markdown-ish text

**Don't:**
- Don't change the UI
- Don't add the card back yet
- Don't over-engineer phase detection (let Claude figure it out from context)

**Testing approach:**
- Deploy to Vercel
- Test the 4 scenarios above manually
- Iterate on prompt if responses aren't quite right

---

## Commit Message

```bash
git add api/triage.js
git commit -m "feat: phase-based planning prompt (Sprint 5.1)

- Rewrite system prompt with 4 conversation phases
- AI now organizes immediately instead of just asking questions
- Identifies anchors, surfaces constraints, asks ONE targeted question
- Profile-aware when provided
- Returns phase indicator for future UI use"
```

---

Ready to ship this to Claude Code?