/**
 * Mock AI Engine
 *
 * Returns ideal data structures without calling the real AI API.
 * Use this to prototype UX before finalizing AI prompts.
 *
 * Each method returns responses matching schemas.js
 */

/**
 * Parse quick capture input and return structured response
 * @param {string} text - User's natural language input
 * @returns {import('../types/schemas.js').ParseResponse}
 */
export function parseQuickCapture(text) {
  const lower = text.toLowerCase();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Scenario 1: Clear event with date and time
  if (lower.includes('tomorrow') && lower.match(/\d+\s*(am|pm)/i)) {
    const timeMatch = text.match(/(\d+)\s*(am|pm)/i);
    const hour = parseInt(timeMatch[1]);
    const period = timeMatch[2].toLowerCase();
    const time24 = period === 'pm' && hour !== 12 ? hour + 12 : hour;

    return {
      action: 'create_event',
      confidence: 'high',
      events: [{
        title: text.replace(/tomorrow|at|\d+\s*(am|pm)/gi, '').trim(),
        date: formatDate(tomorrow),
        time: `${time24.toString().padStart(2, '0')}:00`,
        endTime: null,
        location: null,
        attendees: [],
        originalText: text,
        confidence: 'high',
        fieldConfidence: {
          title: 'high',
          date: 'high',
          time: 'high'
        }
      }],
      suggestedActions: [
        { label: 'Create Event', action: 'confirm_create', icon: 'check' },
        { label: 'Edit Details', action: 'open_triage', icon: 'edit' }
      ]
    };
  }

  // Scenario 2: Event with date but no time - needs triage
  if (lower.includes('tomorrow') || lower.includes('next week')) {
    return {
      action: 'ask_question',
      confidence: 'medium',
      events: [{
        title: text.replace(/tomorrow|next week/gi, '').trim(),
        date: formatDate(tomorrow),
        time: null,
        endTime: null,
        location: null,
        attendees: [],
        originalText: text,
        confidence: 'medium',
        fieldConfidence: {
          title: 'high',
          date: 'high',
          time: 'low'
        }
      }],
      userMessage: "I found a date but not a time. When should this happen?",
      needsInfo: {
        time: {
          required: true,
          question: "What time?",
          suggestions: ['09:00', '14:00', '16:00']
        }
      },
      suggestedActions: [
        { label: 'Pick a Time', action: 'open_time_picker', icon: 'clock' },
        { label: 'Save as Task', action: 'convert_to_task', icon: 'check-square' }
      ]
    };
  }

  // Scenario 3: Multiple possible interpretations
  if (lower.includes('meeting') && lower.includes('sarah')) {
    return {
      action: 'show_alternatives',
      confidence: 'medium',
      events: [
        {
          title: 'Meeting with Sarah',
          date: formatDate(tomorrow),
          time: '14:00',
          endTime: '15:00',
          location: null,
          attendees: ['Sarah'],
          originalText: text,
          confidence: 'medium',
          fieldConfidence: { title: 'high', date: 'medium', time: 'medium' }
        },
        {
          title: 'Meeting with Sarah',
          date: formatDate(tomorrow),
          time: '10:00',
          endTime: '11:00',
          location: null,
          attendees: ['Sarah'],
          originalText: text,
          confidence: 'medium',
          fieldConfidence: { title: 'high', date: 'medium', time: 'low' }
        }
      ],
      userMessage: "I found a few possibilities. Which one sounds right?",
      suggestedActions: [
        { label: 'Option 1: Tomorrow at 2pm', action: 'select_alternative', data: { index: 0 } },
        { label: 'Option 2: Tomorrow at 10am', action: 'select_alternative', data: { index: 1 } },
        { label: 'None of these', action: 'open_triage', icon: 'edit' }
      ]
    };
  }

  // Scenario 4: Task (no specific time)
  if (lower.includes('buy') || lower.includes('get') || lower.includes('remember')) {
    return {
      action: 'create_task',
      confidence: 'high',
      events: [{
        title: text,
        date: lower.includes('tomorrow') ? formatDate(tomorrow) : null,
        time: null,
        endTime: null,
        location: null,
        attendees: [],
        originalText: text,
        confidence: 'high',
        fieldConfidence: {
          title: 'high',
          date: lower.includes('tomorrow') ? 'high' : 'low',
          time: 'low'
        }
      }],
      userMessage: "This looks like a task. Want to save it?",
      suggestedActions: [
        { label: 'Save as Task', action: 'create_task', icon: 'check-square' },
        { label: 'Make it an Event', action: 'convert_to_event', icon: 'calendar' }
      ]
    };
  }

  // Scenario 5: Note (very vague)
  if (text.split(' ').length < 5 && !lower.match(/\d/)) {
    return {
      action: 'create_note',
      confidence: 'low',
      userMessage: "This seems like a note. Where should I save it?",
      suggestedActions: [
        { label: 'Save as Note', action: 'create_note', icon: 'file-text' },
        { label: 'Add Details', action: 'open_triage', icon: 'edit' }
      ]
    };
  }

  // Scenario 6: Checklist detected
  if (text.includes('\n') || text.match(/\d\./)) {
    const items = text.split(/\n|(?:\d+\.)/g).filter(item => item.trim());
    return {
      action: 'create_checklist',
      confidence: 'high',
      userMessage: `I found ${items.length} items. Create a checklist?`,
      suggestedActions: [
        { label: 'Create Checklist', action: 'create_checklist', data: { items } },
        { label: 'Separate Events', action: 'create_multiple_events' }
      ]
    };
  }

  // Default: Ask for clarification
  return {
    action: 'ask_question',
    confidence: 'low',
    userMessage: "I'm not sure what you want to do. Can you be more specific?",
    needsInfo: {
      date: {
        required: false,
        question: "When should this happen?",
        suggestions: ['today', 'tomorrow', 'next week']
      }
    },
    suggestedActions: [
      { label: 'Add as Note', action: 'create_note', icon: 'file-text' },
      { label: 'Add Details', action: 'open_triage', icon: 'edit' }
    ]
  };
}

/**
 * Process event triage (user confirms/edits event)
 * @param {Object} eventData - Event being triaged
 * @param {Object} userFeedback - User's changes/confirmation
 * @returns {import('../types/schemas.js').TriageResponse}
 */
export function triageEvent(eventData, userFeedback) {
  // If user confirmed without changes
  if (userFeedback.confirmed && !userFeedback.changes) {
    return {
      status: 'success',
      event: {
        ...eventData,
        confidence: 'high',
        fieldConfidence: {
          title: 'high',
          date: 'high',
          time: 'high'
        }
      },
      message: 'Event created successfully!'
    };
  }

  // If user made changes
  if (userFeedback.changes) {
    return {
      status: 'success',
      event: {
        ...eventData,
        ...userFeedback.changes,
        confidence: 'high'
      },
      message: 'Event updated and saved!'
    };
  }

  // If event details are still ambiguous
  if (!eventData.time) {
    return {
      status: 'needs_clarification',
      event: eventData,
      message: 'Please specify a time for this event',
      suggestedActions: [
        { label: 'Pick Time', action: 'open_time_picker' },
        { label: 'All Day Event', action: 'mark_all_day' }
      ]
    };
  }

  return {
    status: 'success',
    event: eventData,
    message: 'Ready to save!'
  };
}

/**
 * Answer a question in multi-turn conversation
 * @param {string} question - User's question
 * @param {Object} context - Conversation context
 * @returns {Object}
 */
export function answerQuestion(question, context = {}) {
  const lower = question.toLowerCase();

  if (lower.includes('when') || lower.includes('time')) {
    return {
      message: "What time works best for you? I can suggest some options based on your calendar.",
      suggestedAction: 'suggest_times',
      timeSlots: [
        { date: '2025-01-19', time: '09:00', confidence: 'high', reason: 'Morning slot available' },
        { date: '2025-01-19', time: '14:00', confidence: 'high', reason: 'After lunch, no conflicts' },
        { date: '2025-01-19', time: '16:00', confidence: 'medium', reason: 'Late afternoon' }
      ]
    };
  }

  if (lower.includes('where') || lower.includes('location')) {
    return {
      message: "Would you like to add a location? You can enter an address or meeting link.",
      suggestedAction: 'add_location',
      suggestions: ['Office', 'Remote - Zoom', 'Coffee Shop']
    };
  }

  return {
    message: "I can help you with that! What would you like to know?",
    suggestedAction: null
  };
}

/**
 * Suggest meeting times based on constraints
 * @param {Object} constraints - User's constraints (duration, date range, etc)
 * @returns {import('../types/schemas.js').TimeSuggestionResponse}
 */
export function suggestTimes(constraints = {}) {
  const today = new Date();
  const suggestions = [];

  // Generate 5 time slots over next 3 days
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Morning slot
    suggestions.push({
      date: dateStr,
      time: '09:00',
      endTime: '10:00',
      confidence: 'high',
      reason: 'Morning slot - typically high energy'
    });

    // Afternoon slot
    suggestions.push({
      date: dateStr,
      time: '14:00',
      endTime: '15:00',
      confidence: 'high',
      reason: 'Post-lunch slot - good for meetings'
    });
  }

  return {
    suggestions: suggestions.slice(0, 5),
    reasoning: 'Selected times based on typical work hours and avoiding early morning/late evening',
    constraints: {
      minHour: 9,
      maxHour: 17,
      excludeWeekends: true,
      ...constraints
    }
  };
}

/**
 * Modify an existing event
 * @param {string} eventId - ID of event to modify
 * @param {Object} modifications - Requested changes
 * @returns {import('../types/schemas.js').ModifyEventResponse}
 */
export function modifyEvent(eventId, modifications) {
  // Simulate successful modification
  return {
    status: 'success',
    event: {
      id: eventId,
      ...modifications,
      updatedAt: new Date().toISOString()
    },
    changes: modifications,
    message: 'Event updated successfully!'
  };
}

// Export all methods
export const mockAI = {
  parseQuickCapture,
  triageEvent,
  answerQuestion,
  suggestTimes,
  modifyEvent
};
