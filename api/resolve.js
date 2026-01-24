// api/resolve.js
/**
 * Event Resolve - Serverless Function
 *
 * Helps resolve undetermined events by extracting date/time from natural language.
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { event_id, current_event, user_message } = req.body;

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const systemPrompt = `You are helping schedule a calendar event.

Today is: ${today}

Current event details:
- Title: "${current_event.title}"
- Date: ${current_event.date || 'not set'}
- Time: ${current_event.time || 'not set'}

The user said: "${user_message}"

Your job:
1. Extract any date/time information from what they said
2. If you have enough info to update the event, do so
3. If you need clarification, ask a brief follow-up question

Respond with JSON only:
{
  "reply": "Your conversational response to the user",
  "resolved": true/false,
  "updates": {
    "date": "YYYY-MM-DD or null if not changing",
    "time": "HH:MM (24-hour format) or null if not changing",
    "endTime": "HH:MM or null"
  }
}

If resolved is false, updates should be null or empty.

Examples:
- User: "Tuesday at 3" → resolved: true, date: next Tuesday, time: "15:00"
- User: "sometime next week" → resolved: false, ask which day
- User: "morning" → resolved: false, ask what time specifically
- User: "3pm" (when date already set) → resolved: true, time: "15:00"

Important: Convert all times to 24-hour format (e.g., "3pm" → "15:00")`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: user_message
          }
        ]
      })
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok || data.error) {
      console.error('[Resolve] Anthropic API error:', data);
      throw new Error(data.error?.message || `API returned ${response.status}`);
    }

    // Extract the JSON from Claude's response
    if (!data.content || !data.content[0]) {
      console.error('[Resolve] Unexpected API response:', data);
      throw new Error('Invalid API response format');
    }

    const content = data.content[0].text;

    // Parse JSON
    let result;
    try {
      const cleaned = content.replace(/```json|```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('[Resolve] Failed to parse AI response:', content);
      // If parsing fails, treat as a conversational response
      result = {
        reply: content,
        resolved: false,
        updates: null
      };
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Resolve API error:', error);
    return res.status(500).json({
      reply: "I'm having trouble processing that. Can you try rephrasing?",
      resolved: false,
      updates: null
    });
  }
}
