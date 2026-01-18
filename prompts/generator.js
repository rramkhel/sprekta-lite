/**
 * Prompt Generator - Schema to AI Prompt Converter
 *
 * Generates AI prompts that match your exact data schemas.
 * This ensures the real AI produces the same structure as your mocks.
 *
 * GRADUATION PATH:
 * 1. Design ideal UX with mock data
 * 2. Finalize your schemas in types/schemas.js
 * 3. Run this generator to create AI prompts
 * 4. Copy the generated prompts to api/parse.js
 * 5. Switch DEMO_MODE = false
 * 6. Real AI now produces exactly what your UI expects!
 */

import { schemas } from '../types/schemas.js';

/**
 * Generate a prompt for parsing quick capture input
 * @returns {string} The generated prompt
 */
export function generateQuickCapturePrompt() {
  const currentDate = new Date().toISOString().split('T')[0];

  return `You are a smart calendar parser. Parse natural language input into structured events.

CURRENT DATE: ${currentDate}

YOUR TASK:
Analyze user input and return a JSON response matching this EXACT structure:

RESPONSE SCHEMA:
{
  "action": "create_event" | "ask_question" | "create_task" | "create_note" | "show_alternatives" | "create_checklist",
  "confidence": "high" | "medium" | "low",
  "events": [  // Array of EventCandidate objects (optional)
    {
      "title": string,
      "date": "YYYY-MM-DD" | null,
      "time": "HH:MM" | null,
      "endTime": "HH:MM" | null,
      "location": string | null,
      "attendees": string[],
      "originalText": string,
      "confidence": "high" | "medium" | "low",
      "fieldConfidence": {
        "title": "high" | "medium" | "low",
        "date": "high" | "medium" | "low",
        "time": "high" | "medium" | "low"
      },
      "alternatives": string[]  // Optional alternative interpretations
    }
  ],
  "userMessage": string,  // Optional message to show the user
  "needsInfo": {  // Optional - what information is missing
    "date": {
      "required": boolean,
      "question": string,
      "suggestions": string[]
    },
    "time": { ... },
    "location": { ... }
  },
  "suggestedActions": [  // What the user can do next
    {
      "label": string,  // Button text
      "action": string,  // Action identifier
      "data": object,   // Optional data for the action
      "icon": string    // Optional icon name
    }
  ]
}

CONFIDENCE LEVELS:
- high: Clear date AND time found, or unambiguous task/note
- medium: Has date OR time, but not both, or some ambiguity
- low: Neither date nor time found, or very vague

ACTION TYPES:
- create_event: User wants to create a calendar event (has/needs date+time)
- ask_question: Need more information from user
- create_task: To-do item without specific time
- create_note: General note/idea to save
- show_alternatives: Multiple possible interpretations
- create_checklist: Multiple related items detected

FIELD CONFIDENCE:
For each field (title, date, time), assign:
- high: Explicitly stated or clearly inferred
- medium: Inferred with some assumptions
- low: Guessed or missing

EXAMPLES:

Input: "Call mom tomorrow at 6pm"
Output:
{
  "action": "create_event",
  "confidence": "high",
  "events": [{
    "title": "Call mom",
    "date": "2025-01-19",
    "time": "18:00",
    "endTime": null,
    "location": null,
    "attendees": ["mom"],
    "originalText": "Call mom tomorrow at 6pm",
    "confidence": "high",
    "fieldConfidence": {
      "title": "high",
      "date": "high",
      "time": "high"
    }
  }],
  "suggestedActions": [
    { "label": "Create Event", "action": "confirm_create", "icon": "check" },
    { "label": "Edit Details", "action": "open_triage", "icon": "edit" }
  ]
}

Input: "Meeting with Sarah"
Output:
{
  "action": "ask_question",
  "confidence": "medium",
  "events": [{
    "title": "Meeting with Sarah",
    "date": null,
    "time": null,
    "endTime": null,
    "location": null,
    "attendees": ["Sarah"],
    "originalText": "Meeting with Sarah",
    "confidence": "medium",
    "fieldConfidence": {
      "title": "high",
      "date": "low",
      "time": "low"
    }
  }],
  "userMessage": "I found a meeting but need more details. When should this happen?",
  "needsInfo": {
    "date": {
      "required": true,
      "question": "What day?",
      "suggestions": ["today", "tomorrow", "next week"]
    },
    "time": {
      "required": true,
      "question": "What time?",
      "suggestions": ["09:00", "14:00", "16:00"]
    }
  },
  "suggestedActions": [
    { "label": "Pick a Time", "action": "open_time_picker", "icon": "clock" },
    { "label": "Save as Task", "action": "convert_to_task", "icon": "check-square" }
  ]
}

Input: "Buy groceries"
Output:
{
  "action": "create_task",
  "confidence": "high",
  "events": [{
    "title": "Buy groceries",
    "date": null,
    "time": null,
    "endTime": null,
    "location": null,
    "attendees": [],
    "originalText": "Buy groceries",
    "confidence": "high",
    "fieldConfidence": {
      "title": "high",
      "date": "low",
      "time": "low"
    }
  }],
  "userMessage": "This looks like a task. Want to save it?",
  "suggestedActions": [
    { "label": "Save as Task", "action": "create_task", "icon": "check-square" },
    { "label": "Make it an Event", "action": "convert_to_event", "icon": "calendar" }
  ]
}

IMPORTANT RULES:
1. ALWAYS return valid JSON
2. Use NULL for missing values, not empty strings
3. Dates MUST be YYYY-MM-DD format
4. Times MUST be HH:MM format (24-hour)
5. confidence field is REQUIRED
6. suggestedActions array is REQUIRED (at least one action)
7. Set fieldConfidence for every field
8. If input is multi-line or numbered, consider create_checklist

Now parse the user's input:`;
}

/**
 * Generate a prompt for event triage
 * @returns {string}
 */
export function generateTriagePrompt() {
  return `You are helping the user confirm and refine calendar events.

RESPONSE SCHEMA:
{
  "status": "success" | "needs_clarification" | "suggest_alternatives",
  "event": EventCandidate,  // The finalized or updated event
  "message": string,
  "alternatives": EventCandidate[],  // Optional alternatives
  "suggestedActions": SuggestedAction[]
}

Return this structure based on the user's feedback.`;
}

/**
 * Generate all prompts and save to files
 */
export function generateAllPrompts() {
  const prompts = {
    'quick-capture': generateQuickCapturePrompt(),
    'triage': generateTriagePrompt()
  };

  console.log('===== GENERATED PROMPTS =====\n');

  for (const [name, prompt] of Object.entries(prompts)) {
    console.log(`\n### ${name}.md ###\n`);
    console.log(prompt);
    console.log('\n' + '='.repeat(50));
  }

  console.log('\n\nTO USE THESE PROMPTS:');
  console.log('1. Copy the prompt above');
  console.log('2. Save to prompts/<name>.md');
  console.log('3. Update api/parse.js to use loadPrompt()');
  console.log('4. Set DEMO_MODE = false in app.js');
  console.log('5. Test with real AI!');
}

/**
 * Validate that a response matches the schema
 * @param {Object} response - The AI's response
 * @param {string} schemaName - Name of schema to validate against
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateResponse(response, schemaName = 'ParseResponse') {
  const errors = [];

  if (schemaName === 'ParseResponse') {
    // Check required fields
    if (!response.action) errors.push('Missing required field: action');
    if (!response.confidence) errors.push('Missing required field: confidence');
    if (!response.suggestedActions) errors.push('Missing required field: suggestedActions');

    // Validate action type
    const validActions = ['create_event', 'ask_question', 'create_task', 'create_note', 'show_alternatives', 'create_checklist', 'modify_event', 'suggest_times'];
    if (response.action && !validActions.includes(response.action)) {
      errors.push(`Invalid action: ${response.action}`);
    }

    // Validate confidence
    const validConfidence = ['high', 'medium', 'low'];
    if (response.confidence && !validConfidence.includes(response.confidence)) {
      errors.push(`Invalid confidence: ${response.confidence}`);
    }

    // Validate events array
    if (response.events && !Array.isArray(response.events)) {
      errors.push('events must be an array');
    }

    // Validate each event
    if (response.events) {
      response.events.forEach((event, i) => {
        if (!event.title) errors.push(`Event ${i}: missing title`);
        if (!event.originalText) errors.push(`Event ${i}: missing originalText`);
        if (!event.confidence) errors.push(`Event ${i}: missing confidence`);
        if (!event.fieldConfidence) errors.push(`Event ${i}: missing fieldConfidence`);

        // Validate date format
        if (event.date && !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
          errors.push(`Event ${i}: date must be YYYY-MM-DD format`);
        }

        // Validate time format
        if (event.time && !/^\d{2}:\d{2}$/.test(event.time)) {
          errors.push(`Event ${i}: time must be HH:MM format`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// If run directly, generate and display prompts
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllPrompts();
}

export default {
  generateQuickCapturePrompt,
  generateTriagePrompt,
  generateAllPrompts,
  validateResponse
};
