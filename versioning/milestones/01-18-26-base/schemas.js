/**
 * Data Structure Schemas - SINGLE SOURCE OF TRUTH
 *
 * This file defines ALL data structures used in Sprekta.
 * The AI must produce responses matching these exact structures.
 *
 * Philosophy: Design the ideal UX first, then make AI match it.
 */

/**
 * Confidence level for AI responses
 * @typedef {'high' | 'medium' | 'low'} ConfidenceLevel
 */

/**
 * Possible actions the AI can recommend
 * @typedef {'create_event' | 'ask_question' | 'create_task' | 'create_note' | 'show_alternatives' | 'create_checklist' | 'modify_event' | 'suggest_times'} AIAction
 */

/**
 * Event candidate extracted from user input
 * @typedef {Object} EventCandidate
 * @property {string} title - Event title
 * @property {string|null} date - YYYY-MM-DD or null if unknown
 * @property {string|null} time - HH:MM or null if unknown
 * @property {string|null} endTime - HH:MM or null if unknown/not applicable
 * @property {string|null} location - Event location
 * @property {string[]} attendees - List of people mentioned
 * @property {string} originalText - The user's original input
 * @property {ConfidenceLevel} confidence - Overall confidence in this parse
 * @property {FieldConfidence} fieldConfidence - Confidence per field
 * @property {string[]} [alternatives] - Alternative interpretations of ambiguous parts
 */

/**
 * Confidence level for individual fields
 * @typedef {Object} FieldConfidence
 * @property {ConfidenceLevel} title
 * @property {ConfidenceLevel} date
 * @property {ConfidenceLevel} time
 */

/**
 * Information the AI needs from the user
 * @typedef {Object} MissingInfo
 * @property {InfoField} [date]
 * @property {InfoField} [time]
 * @property {InfoField} [location]
 * @property {InfoField} [attendees]
 */

/**
 * Details about a missing field
 * @typedef {Object} InfoField
 * @property {boolean} required - Is this field required?
 * @property {string} question - Question to ask the user
 * @property {string[]} [suggestions] - Suggested values
 */

/**
 * Suggested action for the user
 * @typedef {Object} SuggestedAction
 * @property {string} label - Button/link text
 * @property {string} action - Action identifier (for JavaScript handler)
 * @property {Object} [data] - Additional data for the action
 * @property {string} [icon] - Icon name (if using icon library)
 */

/**
 * Time slot suggestion
 * @typedef {Object} TimeSlot
 * @property {string} date - YYYY-MM-DD
 * @property {string} time - HH:MM
 * @property {string} [endTime] - HH:MM
 * @property {ConfidenceLevel} confidence - How good this suggestion is
 * @property {string} reason - Why this time was suggested
 */

/**
 * Main response from AI quick capture parse
 * @typedef {Object} ParseResponse
 * @property {AIAction} action - What the AI recommends doing next
 * @property {ConfidenceLevel} confidence - Overall confidence in the response
 * @property {EventCandidate[]} [events] - Event candidates (if action is create_event or show_alternatives)
 * @property {string} [userMessage] - Message to display to the user
 * @property {MissingInfo} [needsInfo] - Information that's missing
 * @property {SuggestedAction[]} suggestedActions - Actions the user can take
 * @property {string} [reasoning] - Why the AI made this decision (dev mode only)
 * @property {Object} [_debug] - Debug info (dev mode only)
 */

/**
 * Response from event triage (user confirms/edits an event)
 * @typedef {Object} TriageResponse
 * @property {'success' | 'needs_clarification' | 'suggest_alternatives'} status
 * @property {EventCandidate} event - The finalized event (if status is success)
 * @property {string} [message] - Message for the user
 * @property {EventCandidate[]} [alternatives] - Alternative event interpretations
 * @property {SuggestedAction[]} [suggestedActions]
 */

/**
 * Finalized calendar event (ready to save)
 * @typedef {Object} CalendarEvent
 * @property {string} id - Unique event ID
 * @property {string} title
 * @property {string} date - YYYY-MM-DD
 * @property {string} time - HH:MM
 * @property {string} [endTime] - HH:MM
 * @property {string} [location]
 * @property {string[]} [attendees]
 * @property {string} [notes]
 * @property {string} [color] - Color category
 * @property {boolean} allDay
 * @property {RecurrenceRule} [recurrence]
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {EventMetadata} metadata
 */

/**
 * Recurrence rule for repeating events
 * @typedef {Object} RecurrenceRule
 * @property {'daily' | 'weekly' | 'monthly' | 'yearly'} frequency
 * @property {number} [interval] - Repeat every N days/weeks/months
 * @property {string} [until] - YYYY-MM-DD when recurrence ends
 * @property {number} [count] - Number of occurrences
 * @property {number[]} [byDay] - Days of week (0=Sunday, 6=Saturday)
 */

/**
 * Metadata about how event was created
 * @typedef {Object} EventMetadata
 * @property {'ai_parse' | 'manual' | 'imported'} source
 * @property {ConfidenceLevel} aiConfidence - If created by AI
 * @property {string} originalInput - Original user text (if from AI parse)
 * @property {number} editCount - How many times user edited this
 */

/**
 * AI message in a conversation
 * @typedef {Object} AIMessage
 * @property {string} id - Message ID
 * @property {'user' | 'assistant'} role
 * @property {string} content - Message text
 * @property {string} timestamp - ISO timestamp
 * @property {AIAction} [suggestedAction] - Action this message suggests
 * @property {EventCandidate[]} [events] - Events mentioned in this message
 * @property {TimeSlot[]} [timeSlots] - Time suggestions
 */

/**
 * Multi-turn conversation state
 * @typedef {Object} Conversation
 * @property {string} id - Conversation ID
 * @property {AIMessage[]} messages
 * @property {'active' | 'completed' | 'abandoned'} status
 * @property {Object} context - Context the AI needs to remember
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Task (event without time)
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} [date] - Due date (YYYY-MM-DD)
 * @property {boolean} completed
 * @property {string} [notes]
 * @property {'low' | 'medium' | 'high'} priority
 * @property {string} createdAt
 */

/**
 * Note (no date/time)
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string[]} tags
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Checklist (multiple related tasks)
 * @typedef {Object} Checklist
 * @property {string} id
 * @property {string} title
 * @property {ChecklistItem[]} items
 * @property {string} createdAt
 */

/**
 * Item in a checklist
 * @typedef {Object} ChecklistItem
 * @property {string} id
 * @property {string} text
 * @property {boolean} completed
 * @property {string} [date] - Optional due date
 */

/**
 * Response from calendar modification request
 * @typedef {Object} ModifyEventResponse
 * @property {'success' | 'needs_confirmation' | 'failed'} status
 * @property {CalendarEvent} event - The modified event
 * @property {Object} changes - What changed
 * @property {string} [message] - Message for user
 */

/**
 * Response from time suggestion request
 * @typedef {Object} TimeSuggestionResponse
 * @property {TimeSlot[]} suggestions
 * @property {string} reasoning - Why these times were suggested
 * @property {Object} constraints - Constraints that were considered
 */

// Export all typedefs as a schema object for runtime validation
export const schemas = {
  ParseResponse: {
    required: ['action', 'confidence', 'suggestedActions'],
    optional: ['events', 'userMessage', 'needsInfo', 'reasoning', '_debug']
  },
  EventCandidate: {
    required: ['title', 'originalText', 'confidence', 'fieldConfidence'],
    optional: ['date', 'time', 'endTime', 'location', 'attendees', 'alternatives']
  },
  CalendarEvent: {
    required: ['id', 'title', 'date', 'time', 'allDay', 'createdAt', 'updatedAt', 'metadata'],
    optional: ['endTime', 'location', 'attendees', 'notes', 'color', 'recurrence']
  }
};

/**
 * Validate an object against a schema
 * @param {Object} obj - Object to validate
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateSchema(obj, schemaName) {
  const schema = schemas[schemaName];
  if (!schema) {
    return { valid: false, errors: [`Unknown schema: ${schemaName}`] };
  }

  const errors = [];

  // Check required fields
  for (const field of schema.required) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
