// api/parse.js
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
    const { text } = req.body;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a smart calendar parser. Parse captured text into discrete events/tasks/notes.

For each line of input:
1. If it has BOTH a date and time → categorize as "event" and extract details
2. Otherwise → categorize as "task" or "note"

Current date: ${new Date().toISOString().split('T')[0]}

Respond with JSON only:
{
  "items": [
    {
      "originalText": "the captured line",
      "category": "event" | "task" | "note",
      "event": {
        "title": "event title",
        "date": "YYYY-MM-DD",
        "time": "HH:MM"
      } // only if category is "event" and you found date+time
    }
  ]
}`,
        messages: [
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    const data = await response.json();

    // Extract the JSON from Claude's response
    const content = data.content[0].text;
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Parse error:', error);
    return res.status(500).json({
      error: 'Failed to parse',
      details: error.message
    });
  }
}
