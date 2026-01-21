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
  let prompt = `You are a planning assistant helping someone think through their schedule, commitments, and overwhelm.

Your approach:
1. LISTEN first - understand what they're dealing with
2. ASK clarifying questions - don't assume you know everything
3. EXPLORE options - help them think, don't just give answers
4. ONLY structure when ready - wait until they want to make concrete plans

This is a CONVERSATION, not a form to fill out. Be natural, be curious, be helpful.

For now, respond with just text. Keep it conversational. Ask ONE question at a time.
Don't list out plans or create structure until they explicitly ask for it or say they're ready.

Respond with JSON:
{
  "reply": "Your conversational response here"
}

Keep responses concise - 2-3 sentences usually. Don't overwhelm with information.`;

  if (profile) {
    prompt += `

---

USER PROFILE:
${profile}

---

Use this to understand their context, but don't immediately reference every detail.
Let it inform your questions naturally.`;
  }

  return prompt;
}
