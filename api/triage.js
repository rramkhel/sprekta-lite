import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, profile, newMessage } = req.body;

    if (!newMessage) {
      return res.status(400).json({ error: "Missing newMessage" });
    }

    // Build conversation history
    const conversationHistory = (messages || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    conversationHistory.push({
      role: "user",
      content: newMessage
    });

    const systemPrompt = buildSystemPrompt(profile);

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory,
    });

    const assistantMessage = response.content[0].text;

    // Try to parse as JSON
    let parsed;
    try {
      // Handle case where response is wrapped in markdown code block
      let jsonStr = assistantMessage;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        reply: assistantMessage,
        card: null
      };
    }

    return res.status(200).json({
      reply: parsed.reply,
      card: parsed.card
    });

  } catch (error) {
    console.error("Triage API error:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error.message
    });
  }
}

function buildSystemPrompt(profile) {
  let prompt = `You are a planning assistant helping someone organize their thoughts around an event, trip, deadline, or overwhelming situation.

Your approach:
1. Find the anchors - what's fixed/non-negotiable (flights, appointments, deadlines)
2. Identify dependencies - what blocks what
3. Reality-check timing - are they being too optimistic?
4. Ask ONE targeted question if you need more info
5. Keep plans simple - 3-5 action items max

CRITICAL: Always respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "reply": "Your conversational response here",
  "card": {
    "anchor": { "title": "Event name", "dates": "Jan 19-23 or null" },
    "locked": [{ "text": "Non-negotiable item with time" }],
    "todos": [{ "text": "Action item", "note": "Optional context or null" }],
    "insight": "One key insight or reality check",
    "openQuestion": "One follow-up question or null if nothing needed",
    "warnings": [{ "text": "⚠️ Warning based on patterns" }]
  }
}

Rules:
- Keep todos to 3-5 items max
- One insight, one open question
- Warnings only if profile suggests risks
- If you need more info, card can have minimal data
- Be conversational in reply, structured in card`;

  if (profile) {
    prompt += `

---

USER PROFILE:
${profile}

---

Use this profile to:
- Catch things they might forget (based on their red flags)
- Reality-check if they're being optimistic about timing
- Reference their people/constraints when relevant
- Protect their priorities from getting squeezed
- Add warnings for patterns that might cause problems`;
  }

  return prompt;
}
