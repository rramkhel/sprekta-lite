/**
 * Quick Capture Test Scenarios
 *
 * Each scenario tests a specific interaction pattern.
 * Use these to prototype the UI without hitting the API.
 */

import { mockAI } from '../mock-ai-engine.js';

export const quickCaptureScenarios = [
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
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'This is the ideal case - clear event with all details'
  },

  {
    id: 'medium-confidence-needs-time',
    name: 'Event Missing Time',
    category: 'needs-clarification',
    input: 'Meeting with Sarah tomorrow',
    expectedAction: 'ask_question',
    expectedConfidence: 'medium',
    expectedUI: 'Should show time picker dialog',
    userFlowSteps: [
      { user: 'enters text', ai: 'identifies event but needs time' },
      { user: 'opens time picker', ai: 'suggests common times' },
      { user: 'selects 2pm', ai: 'creates event with selected time' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests the triage flow for incomplete events'
  },

  {
    id: 'low-confidence-vague',
    name: 'Vague Input',
    category: 'edge-case',
    input: 'Remember to exercise',
    expectedAction: 'create_task',
    expectedConfidence: 'medium',
    expectedUI: 'Should offer to create task or add details',
    userFlowSteps: [
      { user: 'enters vague text', ai: 'suggests creating task' },
      { user: 'confirms task creation', ai: 'saves as task' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests handling of vague, non-time-specific input'
  },

  {
    id: 'multiple-alternatives',
    name: 'Ambiguous Event',
    category: 'alternatives',
    input: 'Meeting with Sarah',
    expectedAction: 'show_alternatives',
    expectedConfidence: 'medium',
    expectedUI: 'Should show multiple time options',
    userFlowSteps: [
      { user: 'enters ambiguous text', ai: 'offers multiple interpretations' },
      { user: 'selects option 1', ai: 'creates event with selected time' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests alternative suggestions UI'
  },

  {
    id: 'task-creation',
    name: 'Task (No Time)',
    category: 'happy-path',
    input: 'Buy groceries',
    expectedAction: 'create_task',
    expectedConfidence: 'high',
    expectedUI: 'Should show task creation dialog',
    userFlowSteps: [
      { user: 'enters task-like text', ai: 'identifies as task' },
      { user: 'confirms', ai: 'saves as task' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests task creation flow'
  },

  {
    id: 'note-creation',
    name: 'Simple Note',
    category: 'edge-case',
    input: 'Ideas',
    expectedAction: 'create_note',
    expectedConfidence: 'low',
    expectedUI: 'Should offer to save as note',
    userFlowSteps: [
      { user: 'enters very short text', ai: 'suggests note' },
      { user: 'adds content', ai: 'saves note' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests note creation for non-actionable items'
  },

  {
    id: 'checklist-multi-line',
    name: 'Checklist Detection',
    category: 'advanced',
    input: 'Shopping list\n1. Milk\n2. Bread\n3. Eggs',
    expectedAction: 'create_checklist',
    expectedConfidence: 'high',
    expectedUI: 'Should show checklist preview',
    userFlowSteps: [
      { user: 'enters multi-line list', ai: 'detects checklist' },
      { user: 'confirms', ai: 'creates checklist with items' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests checklist creation from multi-line input'
  },

  {
    id: 'complex-event-with-location',
    name: 'Event with Location',
    category: 'advanced',
    input: 'Team meeting tomorrow at 2pm at office',
    expectedAction: 'create_event',
    expectedConfidence: 'high',
    expectedUI: 'Should show event with location field populated',
    userFlowSteps: [
      { user: 'enters detailed event', ai: 'extracts all fields' },
      { user: 'confirms', ai: 'creates event' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests extraction of location from natural language'
  },

  {
    id: 'recurring-event-hint',
    name: 'Recurring Event',
    category: 'advanced',
    input: 'Team standup every Monday at 9am',
    expectedAction: 'create_event',
    expectedConfidence: 'high',
    expectedUI: 'Should show recurring event options',
    userFlowSteps: [
      { user: 'enters recurring pattern', ai: 'detects recurrence' },
      { user: 'confirms weekly pattern', ai: 'creates recurring event' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests recurring event detection (future feature)'
  },

  {
    id: 'all-day-event',
    name: 'All-Day Event',
    category: 'happy-path',
    input: 'Birthday party on Saturday',
    expectedAction: 'create_event',
    expectedConfidence: 'medium',
    expectedUI: 'Should suggest all-day event',
    userFlowSteps: [
      { user: 'enters event without time', ai: 'suggests all-day' },
      { user: 'confirms all-day', ai: 'creates all-day event' }
    ],
    getMockResponse: (input) => mockAI.parseQuickCapture(input),
    notes: 'Tests all-day event detection'
  }
];

/**
 * Get scenario by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getScenario(id) {
  return quickCaptureScenarios.find(s => s.id === id) || null;
}

/**
 * Get scenarios by category
 * @param {string} category
 * @returns {Array}
 */
export function getScenariosByCategory(category) {
  return quickCaptureScenarios.filter(s => s.category === category);
}

/**
 * Get all categories
 * @returns {string[]}
 */
export function getCategories() {
  return [...new Set(quickCaptureScenarios.map(s => s.category))];
}
