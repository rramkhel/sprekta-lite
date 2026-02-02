# Sprint 15: Profile Learning Tests

Test suite for conversational profile learning feature.

## Overview

Sprint 15 implements conversational profile building where users can:
- Say "add to my profile" and see what will be saved
- Confirm with natural language ("yep", "yes", etc.)
- Have the system remember context in future conversations

## Test Types

### Manual Tests
- **test-checklist.md** - Manual verification protocol with 10 test cases
- Run these tests in the browser to verify end-to-end behavior

### Unit Tests
- **profile-merge.test.js** - Tests for profile merge logic, duplicate detection, and edge cases
- Run with: `node tests/sprint-15/profile-merge.test.js`

## Test Coverage

- ✅ Profile suggestion flow
- ✅ Profile confirmation detection
- ✅ Profile save with merge
- ✅ Duplicate detection (patterns, key_people, priorities)
- ✅ Not logged in handling
- ✅ First-time profile creation
- ✅ Notes append (not replace)
- ✅ Correction flow
- ✅ Abandonment handling
- ✅ Lost context handling

## Running Tests

### Manual Tests
1. Follow setup instructions in `test-checklist.md`
2. Run through each test case
3. Mark results in the checklist

### Unit Tests
```bash
node tests/sprint-15/profile-merge.test.js
```

## Related Files

- `api/conversation/[id]/message.js:280-375` - Profile save implementation
- `docs/sprint-15-milestone.md` - Sprint overview
- `docs/sprint-15.1-instructions.md` - Initial implementation
- `docs/sprint-15.2-instructions.md` - Edge case handling
- `docs/sprint-15.3-instructions.md` - Testing protocol
