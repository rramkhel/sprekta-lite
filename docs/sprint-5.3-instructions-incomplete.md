# Sprint 5.3: Test Scenario System

## Goal

Add a test scenario system to the dev panel. Load pre-written conversation scripts, step through turns, and edit scenarios for testing different user flows.

---

## Files to Modify

```
js/dev-panel.js    ← Add scenario UI and logic (or wherever dev panel lives)
style.css          ← Scenario editor styles
```

---

## Task 1: Define Default Scenarios

**File:** `js/dev-panel.js` (or create `js/test-scenarios.js`)

```javascript
const DEFAULT_SCENARIOS = [
  {
    id: 'toronto-trip',
    name: 'Toronto Trip',
    description: 'Trip prep with laundry, packing, work project',
    turns: [
      "I'm flying to Toronto Sunday at 12:50pm, mom's picking me up at 10am. I need to do laundry tonight, pack, and finish some work for the landlord login project before I leave.",
      "The landlord thing can probably wait til I'm back, it's not urgent",
      "Oh wait, I also need to pick up my prescription before I leave",
      "That works, let's do that"
    ]
  },
  {
    id: 'deadline-crunch',
    name: 'Deadline Crunch',
    description: 'Multiple work deadlines colliding',
    turns: [
      "I have three things due Friday: the Q4 report for leadership, the client proposal, and I promised my team I'd review their PRs. I also have meetings all day Wednesday and Thursday.",
      "The Q4 report is the most important, it goes to the board",
      "The PRs I could probably delegate to Sarah, she's been wanting more responsibility",
      "Yeah that works"
    ]
  },
  {
    id: 'overwhelm-dump',
    name: 'Overwhelm Dump',
    description: 'User dumps 10+ items, no clear anchor',
    turns: [
      "I'm drowning. I need to: finish taxes, call mom, schedule dentist, fix the leaky faucet, prep for Monday's presentation, buy groceries, respond to like 50 emails, figure out what to do for Sarah's birthday, renew my passport, and somehow find time to exercise. I don't even know where to start.",
      "The presentation is Monday so I guess that's the most urgent",
      "Taxes are due in 3 weeks",
      "That helps, thanks"
    ]
  }
];
```

---

## Task 2: Add Scenario State

**File:** `js/dev-panel.js`

```javascript
const ScenarioTester = {
  scenarios: [],
  activeScenario: null,
  currentTurn: 0,

  init() {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('sprekta-test-scenarios');
    this.scenarios = saved ? JSON.parse(saved) : DEFAULT_SCENARIOS;
  },

  saveScenarios() {
    localStorage.setItem('sprekta-test-scenarios', JSON.stringify(this.scenarios));
  },

  loadScenario(id) {
    this.activeScenario = this.scenarios.find(s => s.id === id);
    this.currentTurn = 0;
    return this.activeScenario;
  },

  getCurrentTurn() {
    if (!this.activeScenario) return null;
    return this.activeScenario.turns[this.currentTurn] || null;
  },

  getNextTurn() {
    if (!this.activeScenario) return null;
    if (this.currentTurn >= this.activeScenario.turns.length) return null;
    return this.activeScenario.turns[this.currentTurn++];
  },

  hasMoreTurns() {
    if (!this.activeScenario) return false;
    return this.currentTurn < this.activeScenario.turns.length;
  },

  updateScenario(id, updates) {
    const idx = this.scenarios.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.scenarios[idx] = { ...this.scenarios[idx], ...updates };
      this.saveScenarios();
    }
  },

  addScenario(scenario) {
    this.scenarios.push({
      id: crypto.randomUUID(),
      ...scenario
    });
    this.saveScenarios();
  },

  resetToDefaults() {
    this.scenarios = DEFAULT_SCENARIOS;
    this.saveScenarios();
  }
};
```

---

## Task 3: Add Dev Panel UI

**File:** `js/dev-panel.js`

Add this section to the dev panel render:

```javascript
renderScenarioSection() {
  const active = ScenarioTester.activeScenario;
  const turnInfo = active
    ? `Turn ${ScenarioTester.currentTurn}/${active.turns.length}`
    : 'No scenario loaded';

  return `
    <div class="dev-section">
      <h4>Test Scenarios</h4>

      <div class="scenario-controls">
        <select id="scenario-select">
          <option value="">Select scenario...</option>
          ${ScenarioTester.scenarios.map(s => `
            <option value="${s.id}" ${active?.id === s.id ? 'selected' : ''}>
              ${s.name}
            </option>
          `).join('')}
        </select>

        <button id="scenario-load" class="dev-btn">Load & Start</button>
        <button id="scenario-next" class="dev-btn" ${!active ? 'disabled' : ''}>
          Next Turn (${turnInfo})
        </button>
      </div>

      ${active ? `
        <div class="scenario-preview">
          <p class="scenario-desc">${active.description}</p>
          <div class="scenario-turns">
            ${active.turns.map((turn, i) => `
              <div class="scenario-turn ${i < ScenarioTester.currentTurn ? 'sent' : ''} ${i === ScenarioTester.currentTurn ? 'current' : ''}">
                <span class="turn-num">${i + 1}.</span>
                <span class="turn-text">${turn.substring(0, 60)}${turn.length > 60 ? '...' : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <details class="scenario-editor">
        <summary>Edit Scenario JSON</summary>
        <textarea id="scenario-json" rows="12">${active ? JSON.stringify(active, null, 2) : '// Select a scenario to edit'}</textarea>
        <div class="scenario-editor-actions">
          <button id="scenario-save" class="dev-btn">Save Changes</button>
          <button id="scenario-reset" class="dev-btn dev-btn-danger">Reset to Defaults</button>
        </div>
      </details>
    </div>
  `;
}
```

---

## Task 4: Wire Up Event Handlers

**File:** `js/dev-panel.js`

```javascript
bindScenarioEvents() {
  // Load & Start
  document.getElementById('scenario-load')?.addEventListener('click', () => {
    const select = document.getElementById('scenario-select');
    const id = select.value;
    if (!id) return;

    const scenario = ScenarioTester.loadScenario(id);
    if (!scenario) return;

    // Clear existing chat and start fresh
    ChatUI.clearConversation();

    // Send first turn
    const firstTurn = ScenarioTester.getNextTurn();
    if (firstTurn) {
      ChatUI.sendMessage(firstTurn);
    }

    this.render(); // Update UI
  });

  // Next Turn
  document.getElementById('scenario-next')?.addEventListener('click', () => {
    if (!ScenarioTester.hasMoreTurns()) return;

    const nextTurn = ScenarioTester.getNextTurn();
    if (nextTurn) {
      ChatUI.sendMessage(nextTurn);
    }

    this.render(); // Update turn counter
  });

  // Save JSON edits
  document.getElementById('scenario-save')?.addEventListener('click', () => {
    const textarea = document.getElementById('scenario-json');
    try {
      const updated = JSON.parse(textarea.value);
      ScenarioTester.updateScenario(updated.id, updated);
      alert('Scenario saved!');
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  });

  // Reset to defaults
  document.getElementById('scenario-reset')?.addEventListener('click', () => {
    if (confirm('Reset all scenarios to defaults? Your edits will be lost.')) {
      ScenarioTester.resetToDefaults();
      this.render();
    }
  });
}
```

---

## Task 5: Expose sendMessage on ChatUI

**File:** `js/triage-ui.js`

Make sure ChatUI has a public method to send a message programmatically:

```javascript
// Add this method if it doesn't exist
sendMessage(content) {
  // Set input value and trigger send
  const input = document.getElementById('triage-input');
  if (input) {
    input.value = content;
    this.handleSend();
  }
}
```

---

## Task 6: Styles

**File:** `style.css`

```css
/* Scenario Controls */
.scenario-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

#scenario-select {
  flex: 1;
  min-width: 150px;
  padding: 6px 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 13px;
}

/* Scenario Preview */
.scenario-preview {
  background: var(--bg-secondary, #f9f9f9);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.scenario-desc {
  font-size: 12px;
  color: var(--text-secondary, #666);
  margin: 0 0 8px 0;
}

.scenario-turns {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scenario-turn {
  display: flex;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-primary, #fff);
}

.scenario-turn.sent {
  opacity: 0.5;
  text-decoration: line-through;
}

.scenario-turn.current {
  background: var(--accent-light, #e8f0fe);
  border-left: 3px solid var(--accent, #6366f1);
}

.turn-num {
  color: var(--text-secondary, #666);
  font-weight: 500;
}

.turn-text {
  color: var(--text-primary, #333);
}

/* Scenario Editor */
.scenario-editor {
  margin-top: 12px;
}

.scenario-editor summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.scenario-editor textarea {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  font-family: monospace;
  font-size: 11px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  resize: vertical;
}

.scenario-editor-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.dev-btn-danger {
  color: #dc2626;
  border-color: #dc2626;
}

.dev-btn-danger:hover {
  background: #fee2e2;
}
```

---

## Testing Checklist

- [ ] Dev panel shows "Test Scenarios" section
- [ ] Dropdown lists all 3 default scenarios
- [ ] "Load & Start" clears chat and sends first message
- [ ] AI responds to first turn
- [ ] "Next Turn" sends second message
- [ ] Turn counter updates (1/4 → 2/4 → etc)
- [ ] Sent turns show as crossed out
- [ ] Current turn is highlighted
- [ ] JSON editor shows scenario data
- [ ] Editing JSON and saving persists changes
- [ ] "Reset to Defaults" restores original scenarios
- [ ] Scenarios persist across page refresh

---

## Commit

```bash
git add js/dev-panel.js js/triage-ui.js style.css
git commit -m "feat: test scenario system in dev panel (Sprint 5.3)

- 3 default scenarios: Toronto Trip, Deadline Crunch, Overwhelm Dump
- Load & step through conversation turns
- Visual preview of turns (sent/current/upcoming)
- JSON editor for modifying scenarios
- Scenarios persist in localStorage
- Reset to defaults option"
```

---

## Notes for Claude Code

**Key integration points:**
- `ChatUI.clearConversation()` - from Sprint 5.2
- `ChatUI.sendMessage(content)` - may need to expose this
- Dev panel structure - find existing patterns and match them

**Watch out for:**
- Dev panel might be in a different file than expected - search for "dev" or "DEV"
- ChatUI vs TriageUI naming - Sprint 4.1 renamed it
- localStorage key names - match whatever's currently used

**Don't:**
- Don't break existing dev panel features (mock AI toggle, clear events)
- Don't auto-advance turns - user clicks "Next Turn" manually
- Don't overcomplicate the JSON editor - textarea is fine
