/**
 * Event Triage Test Scenarios
 *
 * Tests the event confirmation/editing flow
 */

import { mockAI } from '../mock-ai-engine.js';

export const triageScenarios = [
  {
    id: 'confirm-without-changes',
    name: 'User Confirms Event',
    category: 'happy-path',
    eventData: {
      title: 'Call mom',
      date: '2025-01-19',
      time: '18:00',
      originalText: 'Call mom tomorrow at 6pm'
    },
    userAction: { confirmed: true },
    expectedStatus: 'success',
    expectedUI: 'Should show success message and close modal',
    getMockResponse: (eventData, userFeedback) =>
      mockAI.triageEvent(eventData, userFeedback)
  },

  {
    id: 'edit-time',
    name: 'User Edits Time',
    category: 'modifications',
    eventData: {
      title: 'Meeting with Sarah',
      date: '2025-01-19',
      time: '14:00',
      originalText: 'Meeting with Sarah'
    },
    userAction: {
      confirmed: true,
      changes: { time: '15:00' }
    },
    expectedStatus: 'success',
    expectedUI: 'Should update time and show success',
    getMockResponse: (eventData, userFeedback) =>
      mockAI.triageEvent(eventData, userFeedback)
  },

  {
    id: 'add-missing-time',
    name: 'Add Time to Event',
    category: 'completion',
    eventData: {
      title: 'Team meeting',
      date: '2025-01-20',
      time: null,
      originalText: 'Team meeting tomorrow'
    },
    userAction: {
      confirmed: true,
      changes: { time: '09:00' }
    },
    expectedStatus: 'success',
    expectedUI: 'Should accept time and create event',
    getMockResponse: (eventData, userFeedback) =>
      mockAI.triageEvent(eventData, userFeedback)
  },

  {
    id: 'convert-to-all-day',
    name: 'Convert to All-Day',
    category: 'modifications',
    eventData: {
      title: 'Birthday party',
      date: '2025-01-25',
      time: null,
      originalText: 'Birthday party next week'
    },
    userAction: {
      confirmed: true,
      changes: { allDay: true }
    },
    expectedStatus: 'success',
    expectedUI: 'Should mark as all-day event',
    getMockResponse: (eventData, userFeedback) =>
      mockAI.triageEvent(eventData, userFeedback)
  }
];

export function getTriageScenario(id) {
  return triageScenarios.find(s => s.id === id) || null;
}
