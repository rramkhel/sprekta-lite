# AI Prompt Refactoring Summary

## Changes Made

This refactoring makes AI prompt iteration easier and reduces prototyping costs.

### 1. Switched to Cheaper AI Model ✅

**File:** `api/parse.js:29-31`

```javascript
// Using Haiku for prototyping - switch to Sonnet for production
const model = isEnabled('PROTOTYPE_MODE')
  ? 'claude-haiku-4-5-20251001'  // Cheaper model for development
  : 'claude-sonnet-4-20250514';   // Production model
```

**Impact:**
- **~10x cost reduction** during development
- Haiku is faster (lower latency)
- Easy toggle via feature flag

### 2. Extracted Prompts to Separate Files ✅

**New Files:**
- `prompts/calendar-parser.md` - System prompt with variables
- `prompts/loader.js` - Prompt loading utility

**Benefits:**
- Edit prompts without touching code
- Version control for prompt iterations
- Reuse prompts across endpoints
- Clear separation of concerns

**Example Usage:**
```javascript
const systemPrompt = loadPrompt('calendar-parser', {
  CURRENT_DATE: new Date().toISOString().split('T')[0]
});
```

### 3. Added AI Response Confidence Levels ✅

**Updated:** `prompts/calendar-parser.md`

New response format includes confidence:
```json
{
  "items": [{
    "originalText": "Call mom tomorrow at 6pm",
    "category": "event",
    "confidence": "high",  // NEW FIELD
    "event": { ... }
  }]
}
```

**Confidence Criteria:**
- **high**: Clear date AND time found
- **medium**: Has date OR time, but not both
- **low**: Neither date nor time found

**Use Cases:**
- Auto-create high-confidence events (via feature flag)
- Show warning UI for low-confidence items
- Analytics on parsing accuracy

### 4. Created Feature Flags System ✅

**New File:** `config/features.js`

```javascript
export const features = {
  PROTOTYPE_MODE: true,                // Use cheap AI model
  AUTO_CREATE_HIGH_CONFIDENCE: false,  // Auto-create events
  SHOW_AI_REASONING: false,            // Show debug info
};

export function isEnabled(featureName) { ... }
```

**Benefits:**
- Toggle features without code changes
- A/B testing capabilities
- Gradual rollout of features
- Development vs production modes

## New File Structure

```
sprekta-lite/
├── prompts/
│   ├── calendar-parser.md    ← System prompt (extracted)
│   └── loader.js              ← Prompt loading utility
├── config/
│   └── features.js            ← Feature flags
├── api/
│   └── parse.js               ← Updated to use new system
├── docs/
│   └── refactoring-summary.md ← This file
├── app.js
├── index.html
└── style.css
```

## How to Use

### Iterate on Prompts

1. Open `prompts/calendar-parser.md`
2. Edit the prompt directly
3. Save and test (no code changes needed!)
4. The prompt auto-reloads on next API call

### Switch AI Models

**During Development:**
```javascript
// config/features.js
PROTOTYPE_MODE: true  // Uses Haiku (cheap & fast)
```

**For Production:**
```javascript
// config/features.js
PROTOTYPE_MODE: false  // Uses Sonnet (expensive & accurate)
```

### Test Different Confidence Thresholds

```javascript
// In your app.js or wherever you handle responses
if (item.confidence === 'high' && isEnabled('AUTO_CREATE_HIGH_CONFIDENCE')) {
  createEventDirectly(item);
} else {
  showTriageModal(item);
}
```

### Enable Debug Mode

```javascript
// config/features.js
SHOW_AI_REASONING: true
```

Then check API responses for `_debug` field:
```json
{
  "items": [...],
  "_debug": {
    "model": "claude-haiku-4-5-20251001",
    "promptLength": 1234,
    "featureFlags": { ... }
  }
}
```

## Testing

Dev server is running at: http://localhost:3000

**Test the Quick Capture:**
1. Click "Jot it down"
2. Try: "Meeting with Sarah tomorrow at 3pm"
3. Should return `confidence: "high"`
4. Try: "Buy groceries"
5. Should return `confidence: "low"`

## Cost Savings

| Model | Price per 1M tokens (input) | Typical Request Cost |
|-------|----------------------------|---------------------|
| Haiku | $0.80 | ~$0.0008 |
| Sonnet 4 | $3.00 | ~$0.003 |

**Savings:** ~75% reduction in API costs during prototyping

## Next Steps

### Recommended Prompt Improvements

1. **Add Few-Shot Examples**
   - Add more examples to `calendar-parser.md`
   - Improves accuracy for edge cases

2. **Time Zone Handling**
   - Add `{{USER_TIMEZONE}}` variable
   - Pass from frontend

3. **Multi-Language Support**
   - Add language detection
   - Create `calendar-parser-es.md` for Spanish, etc.

4. **Recurring Events**
   - Extend prompt to detect "every Monday", "weekly", etc.
   - Add `recurrence` field to response

### Recommended Feature Flags

Add these to `config/features.js`:

```javascript
// Experiment with different models
EXPERIMENTAL_AI_MODEL: false,

// Use local fallback parser if AI fails
FALLBACK_TO_REGEX: true,

// Cache AI responses for identical inputs
ENABLE_RESPONSE_CACHE: false,
```

## Troubleshooting

### "Cannot find module" error
- Make sure you're using Node.js 14+ (ESM support)
- Check that all import paths are correct

### Prompt not updating
- Vercel caches files - restart dev server
- Check file path in `loadPrompt()` call

### Feature flag not working
- Verify import: `import { isEnabled } from '../config/features.js'`
- Check spelling of feature name

### AI responses different from before
- This is expected! Haiku behaves differently than Sonnet
- Test thoroughly before deploying
- Switch back: `PROTOTYPE_MODE: false`

## Documentation

- [Tech Stack Overview](./tech-stack.md)
- [Quick Reference](./quick-reference.md)
- Main README: [../README.md](../README.md)
