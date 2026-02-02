/**
 * Sprint 15 - Profile Merge Logic Unit Tests
 *
 * Tests the core profile merge logic including:
 * - Duplicate detection for patterns
 * - Duplicate detection for key_people
 * - Duplicate detection for priorities
 * - Notes append (not replace)
 * - First-time profile creation
 */

// Simple test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Expected ${expectedStr} but got ${actualStr}`
      );
    }
  }

  async run() {
    console.log('\n🧪 Sprint 15 Profile Merge Tests\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn(this);
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
    return this.failed === 0;
  }
}

// Profile merge logic (extracted from api/conversation/[id]/message.js)
function mergeProfile(currentProfile, update) {
  // Deduplicate patterns
  const existingPatterns = new Set(currentProfile?.patterns || []);
  const newPatterns = (update.patterns || []).filter(p => !existingPatterns.has(p));

  // Deduplicate key_people by name
  const existingPeople = new Map((currentProfile?.key_people || []).map(p => [p.name, p]));
  const newPeople = (update.key_people || []).filter(p => !existingPeople.has(p.name));

  // Deduplicate priorities
  const existingPriorities = new Set(currentProfile?.priorities || []);
  const newPriorities = (update.priorities || []).filter(p => !existingPriorities.has(p));

  return {
    patterns: [...(currentProfile?.patterns || []), ...newPatterns],
    key_people: [...(currentProfile?.key_people || []), ...newPeople],
    priorities: [...(currentProfile?.priorities || []), ...newPriorities],
    notes: update.notes_append
      ? ((currentProfile?.notes || '') + '\n\n' + update.notes_append).trim()
      : (currentProfile?.notes || null),
    name: currentProfile?.name || null,
    red_flags: currentProfile?.red_flags || []
  };
}

// Tests
const runner = new TestRunner();

runner.test('Deduplicates patterns', (t) => {
  const current = {
    patterns: ['Morning person', 'Volunteers on Sundays']
  };

  const update = {
    patterns: ['Volunteers on Sundays', 'Takes Fridays off']
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(
    merged.patterns,
    ['Morning person', 'Volunteers on Sundays', 'Takes Fridays off']
  );
});

runner.test('Deduplicates key_people by name', (t) => {
  const current = {
    key_people: [
      { name: 'Sarah', relationship: 'manager' }
    ]
  };

  const update = {
    key_people: [
      { name: 'Sarah', relationship: 'boss' }, // Different relationship, same name
      { name: 'Tom', relationship: 'partner' }
    ]
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(
    merged.key_people,
    [
      { name: 'Sarah', relationship: 'manager' },
      { name: 'Tom', relationship: 'partner' }
    ]
  );
});

runner.test('Deduplicates priorities', (t) => {
  const current = {
    priorities: ['Family time', 'Exercise']
  };

  const update = {
    priorities: ['Exercise', 'Learning']
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(
    merged.priorities,
    ['Family time', 'Exercise', 'Learning']
  );
});

runner.test('Appends notes instead of replacing', (t) => {
  const current = {
    notes: 'Commute is 30 minutes'
  };

  const update = {
    notes_append: 'Life.Church volunteering on Sundays'
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(
    merged.notes,
    'Commute is 30 minutes\n\nLife.Church volunteering on Sundays'
  );
});

runner.test('Handles first-time profile (no existing data)', (t) => {
  const current = null;

  const update = {
    patterns: ['Morning person'],
    key_people: [{ name: 'Sarah', relationship: 'manager' }],
    priorities: ['Family time'],
    notes_append: 'New user context'
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(merged.patterns, ['Morning person']);
  t.assertEqual(merged.key_people, [{ name: 'Sarah', relationship: 'manager' }]);
  t.assertEqual(merged.priorities, ['Family time']);
  t.assertEqual(merged.notes, 'New user context');
  t.assertEqual(merged.name, null);
  t.assertEqual(merged.red_flags, []);
});

runner.test('Preserves existing name and red_flags', (t) => {
  const current = {
    name: 'John Doe',
    patterns: ['Morning person'],
    red_flags: ['Dislikes meetings after 4pm']
  };

  const update = {
    patterns: ['Takes Fridays off']
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(merged.name, 'John Doe');
  t.assertEqual(merged.red_flags, ['Dislikes meetings after 4pm']);
});

runner.test('Does not append notes if no notes_append in update', (t) => {
  const current = {
    notes: 'Existing notes'
  };

  const update = {
    patterns: ['New pattern']
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(merged.notes, 'Existing notes');
});

runner.test('Handles empty arrays in current profile', (t) => {
  const current = {
    patterns: [],
    key_people: [],
    priorities: []
  };

  const update = {
    patterns: ['First pattern'],
    key_people: [{ name: 'Alice', relationship: 'friend' }],
    priorities: ['Health']
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(merged.patterns, ['First pattern']);
  t.assertEqual(merged.key_people, [{ name: 'Alice', relationship: 'friend' }]);
  t.assertEqual(merged.priorities, ['Health']);
});

runner.test('Handles empty arrays in update', (t) => {
  const current = {
    patterns: ['Existing pattern']
  };

  const update = {
    patterns: []
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(merged.patterns, ['Existing pattern']);
});

runner.test('Multiple new items added at once', (t) => {
  const current = {
    patterns: ['Morning person']
  };

  const update = {
    patterns: ['Takes Fridays off', 'Works remotely', 'Prefers async communication']
  };

  const merged = mergeProfile(current, update);

  t.assertEqual(
    merged.patterns,
    ['Morning person', 'Takes Fridays off', 'Works remotely', 'Prefers async communication']
  );
});

// Run tests
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
