# UI-First Prototyping Guide

## Philosophy

**Design the perfect UX first using mock data, then adapt the AI to match - not the other way around.**

This framework lets you:
- Prototype UX without API costs
- Iterate on data structures freely
- Test all interaction patterns
- Graduate smoothly from mock to real AI

## The Problem

Traditional approach:
1. Write AI prompt
2. See what AI returns
3. Build UI to match AI's format
4. Realize UX is wrong
5. Go back to step 1... 💸💸💸

**Better approach:**
1. Design ideal UX with mock data
2. Finalize data structure
3. Generate AI prompts from schema
4. AI produces exactly what UI expects ✅

## Quick Start

### 1. Open the Scenario Tester

```bash
# Start dev server
npx vercel dev --yes

# Open in browser
open http://localhost:3000/prototype.html
```

You'll see a 3-panel UI:
- **Left:** List of test scenarios
- **Center:** Live UI preview
- **Right:** Debug info & JSON viewer

### 2. Click a Scenario

Try "High Confidence Event" - you'll see:
- The input text
- Mock AI response
- UI components rendering
- Suggested actions

### 3. Edit the Response

Click "✏️ Edit Response" in the right panel. You can:
- Modify the JSON structure
- Test different confidence levels
- Add new fields
- See UI update instantly

### 4. Iterate Until Perfect

Keep editing until the UX feels right. No API calls, no costs!

## File Structure

```
sprekta-lite/
├── types/
│   └── schemas.js              # SINGLE SOURCE OF TRUTH for data structures
├── test-data/
│   ├── mock-ai-engine.js       # Mock AI that returns ideal responses
│   └── scenarios/
│       ├── quick-capture-scenarios.js
│       └── triage-scenarios.js
├── prompts/
│   ├── generator.js            # Converts schemas → AI prompts
│   ├── calendar-parser.md      # Current prompt (editable)
│   └── loader.js               # Loads prompts at runtime
├── config/
│   └── features.js             # Feature flags
├── prototype.html              # Scenario tester UI
├── prototype.js                # Tester logic
├── index.html                  # Real app
└── app.js                      # App logic (works with mock OR real)
```

## Core Workflow

### Step 1: Define Your Ideal Data Structure

Edit `types/schemas.js`:

```javascript
/**
 * @typedef {Object} ParseResponse
 * @property {string} action - 'create_event' | 'ask_question' | ...
 * @property {string} confidence - 'high' | 'medium' | 'low'
 * @property {EventCandidate[]} events
 * @property {string} userMessage
 * @property {SuggestedAction[]} suggestedActions
 */
```

This is your **contract**. UI and AI both follow it.

### Step 2: Create Mock Responses

Edit `test-data/mock-ai-engine.js`:

```javascript
export function parseQuickCapture(text) {
  if (text.includes('tomorrow') && text.match(/\d+\s*pm/)) {
    return {
      action: 'create_event',
      confidence: 'high',
      events: [{ ... }],
      suggestedActions: [{ ... }]
    };
  }
  // ... more scenarios
}
```

Make it realistic! Think about:
- Happy paths
- Edge cases
- Ambiguous input
- Multi-turn conversations

### Step 3: Create Test Scenarios

Edit `test-data/scenarios/quick-capture-scenarios.js`:

```javascript
{
  id: 'high-confidence-event',
  name: 'High Confidence Event',
  category: 'happy-path',
  input: 'Call mom tomorrow at 6pm',
  expectedAction: 'create_event',
  expectedConfidence: 'high',
  expectedUI: 'Should show event preview with "Create Event" button',
  userFlowSteps: [
    { user: 'enters text', ai: 'parses successfully' },
    { user: 'clicks Create Event', ai: 'creates event' }
  ],
  getMockResponse: (input) => mockAI.parseQuickCapture(input)
}
```

### Step 4: Test in Scenario Tester

```bash
open http://localhost:3000/prototype.html
```

Click through scenarios. For each one:
- Does the UI look right?
- Are the suggested actions correct?
- Does the flow make sense?

### Step 5: Iterate on UX

Found an issue? Fix it:

**Option A: Update the schema**
```javascript
// types/schemas.js
// Add a new field
@property {string[]} alternatives - Alternative interpretations
```

**Option B: Update mock responses**
```javascript
// test-data/mock-ai-engine.js
return {
  ...response,
  alternatives: ['Option 1', 'Option 2']  // New field!
};
```

**Option C: Add a new scenario**
```javascript
// test-data/scenarios/quick-capture-scenarios.js
{
  id: 'ambiguous-time',
  name: 'Ambiguous Time Reference',
  input: 'Meeting next week',
  // ...
}
```

**Rinse and repeat!**

### Step 6: Graduate to Real AI

When UX is finalized:

1. **Generate the prompt:**
   ```bash
   node prompts/generator.js
   ```

2. **Copy to prompt file:**
   The generator outputs a prompt that matches your schemas exactly.
   Save it to `prompts/quick-capture-generated.md`

3. **Update api/parse.js:**
   ```javascript
   const systemPrompt = loadPrompt('quick-capture-generated', {
     CURRENT_DATE: new Date().toISOString().split('T')[0]
   });
   ```

4. **Disable demo mode:**
   ```javascript
   // app.js
   window.DEMO_MODE = false;  // Use real AI
   ```

5. **Test with real AI:**
   ```bash
   open http://localhost:3000
   ```

The real AI now produces exactly what your UI expects!

## Advanced Techniques

### Testing Multi-Turn Conversations

Create conversation flows:

```javascript
{
  id: 'multi-turn-planning',
  name: 'Complex Event Planning',
  turns: [
    {
      user: 'Plan my week',
      ai: { action: 'ask_question', question: 'What are your priorities?' }
    },
    {
      user: 'Work meetings and gym',
      ai: { action: 'suggest_times', slots: [...] }
    },
    {
      user: 'Pick Monday 9am and Wednesday 6pm',
      ai: { action: 'create_events', events: [...] }
    }
  ]
}
```

### Response Editor

In prototype.html, click "✏️ Edit Response" to:
- Modify any field in real-time
- Test different confidence levels
- Add/remove suggested actions
- See UI adapt immediately

Example: Change `confidence: "high"` to `"low"` and watch the UI show different affordances.

### Action Log

The action log shows what happened:
```
[2:30:15 PM] Loaded scenario: High Confidence Event
[2:30:18 PM] User clicked: confirm_create
[2:30:20 PM] Response edited successfully
```

Use this to understand the interaction flow.

### Validating Responses

Use the schema validator:

```javascript
import { validateSchema } from './types/schemas.js';

const response = mockAI.parseQuickCapture("test");
const validation = validateSchema(response, 'ParseResponse');

if (!validation.valid) {
  console.error('Schema mismatch!', validation.errors);
}
```

This catches structure mismatches early.

## Common Patterns

### Pattern 1: Progressive Disclosure

```javascript
// Start simple
{
  action: 'create_event',
  events: [{ title, date, time }],
  suggestedActions: [{ label: 'Create', action: 'confirm' }]
}

// User clicks → ask for more details
{
  action: 'ask_question',
  needsInfo: { location: {...}, duration: {...} },
  suggestedActions: [{ label: 'Add Details', action: 'open_triage' }]
}
```

Test this flow in scenarios!

### Pattern 2: Confidence-Based UI

```javascript
// High confidence → direct action
if (confidence === 'high') {
  return { suggestedActions: [{ label: 'Create Event', action: 'confirm' }] };
}

// Low confidence → ask questions
if (confidence === 'low') {
  return { suggestedActions: [{ label: 'Need Help', action: 'open_triage' }] };
}
```

Create scenarios for each confidence level.

### Pattern 3: Alternative Interpretations

```javascript
{
  action: 'show_alternatives',
  events: [
    { title: 'Meeting', date: 'tomorrow', time: '14:00' },
    { title: 'Meeting', date: 'tomorrow', time: '16:00' }
  ],
  suggestedActions: [
    { label: '2pm', action: 'select', data: { index: 0 } },
    { label: '4pm', action: 'select', data: { index: 1 } }
  ]
}
```

## Troubleshooting

### Mock response not showing

**Problem:** Clicked scenario but UI says "Select a scenario"

**Fix:** Check browser console for errors. Likely a JS syntax error in mock-ai-engine.js

### Schema validation failing

**Problem:** `validateSchema()` returns errors

**Fix:** Compare your response against `types/schemas.js`. Ensure all required fields are present.

### Prototype UI not loading

**Problem:** `prototype.html` shows blank page

**Fix:**
1. Check dev server is running: `npx vercel dev --yes`
2. Open browser console for errors
3. Verify `prototype.js` is loading (Network tab)

### Real AI returns different structure

**Problem:** Switched to real AI, UI breaks

**Fix:**
1. Run `node prompts/generator.js` to regenerate prompt
2. Copy the output to your prompt file
3. Ensure the prompt includes ALL schema fields
4. Test with a few inputs before deploying

## Best Practices

### 1. Start with Schemas

**Do this:**
```javascript
// types/schemas.js - define first
@typedef {Object} ParseResponse
@property {string} action
```

Then create mocks and UI.

**Don't do this:**
```javascript
// Mock first, then UI, then realize schema is wrong
```

### 2. Create Comprehensive Scenarios

Cover:
- ✅ Happy paths
- ✅ Edge cases
- ✅ Error states
- ✅ Ambiguous input
- ✅ Multi-turn flows

**Aim for 10-15 scenarios minimum.**

### 3. Use Real Data

**Good scenarios:**
```javascript
input: 'Coffee with Sarah tomorrow at 10am at Blue Bottle'
input: 'Team standup every Monday at 9am'
input: 'Dentist appointment - bring insurance card'
```

**Bad scenarios:**
```javascript
input: 'Event 1'
input: 'Test'
input: 'foo bar baz'
```

### 4. Validate Continuously

Add validation to your mocks:

```javascript
export function parseQuickCapture(text) {
  const response = { ... };

  // Validate before returning
  const validation = validateSchema(response, 'ParseResponse');
  if (!validation.valid) {
    console.error('Mock response invalid!', validation.errors);
  }

  return response;
}
```

### 5. Document Your Decisions

Add notes to scenarios:

```javascript
{
  id: 'recurring-event',
  name: 'Recurring Event Detection',
  notes: 'Decided to show recurrence UI inline rather than in a modal because users found the modal disruptive during user testing on 2025-01-15'
}
```

Future you will thank you!

## Feature Flag Integration

Use feature flags to control behavior:

```javascript
// config/features.js
export const features = {
  PROTOTYPE_MODE: true,                // Use mock AI
  AUTO_CREATE_HIGH_CONFIDENCE: false,  // Auto-create events
  SHOW_AI_REASONING: false             // Show confidence
};

// In your UI
if (isEnabled('AUTO_CREATE_HIGH_CONFIDENCE') && confidence === 'high') {
  createEventDirectly(event);
} else {
  showTriageModal(event);
}
```

Test both paths in scenarios!

## Next Steps

### Enhance the Mock Engine

Add more realistic behaviors:
- Typo handling
- Timezone awareness
- Natural language variations
- Context from previous interactions

### Build More Scenario Types

Create scenario files for:
- `calendar-edit-scenarios.js` - Modifying events
- `multi-turn-scenarios.js` - Conversations
- `error-scenarios.js` - API failures
- `edge-case-scenarios.js` - Weird input

### Create Visual Diff Tool

Build a tool that compares:
- Mock response
- Real AI response
- Highlights differences

This catches regressions!

### Add Automated Testing

```javascript
// test-scenarios.js
describe('Quick Capture Scenarios', () => {
  scenarios.forEach(scenario => {
    it(scenario.name, () => {
      const response = scenario.getMockResponse(scenario.input);
      expect(response.action).toBe(scenario.expectedAction);
      expect(response.confidence).toBe(scenario.expectedConfidence);
    });
  });
});
```

## Resources

- [Tech Stack Overview](./tech-stack.md)
- [Quick Reference](./quick-reference.md)
- [Main README](../README.md)

---

**Remember:** The goal is to design the *perfect* UX first. The AI is just a backend that produces the data your UI needs. Make the AI adapt to you, not the other way around! 🎯
