// api/parse.js
/**
 * Calendar Event Parser - Serverless Function
 *
 * Parses natural language input into structured calendar events using AI.
 * Now with extracted prompts and feature flags for easier iteration.
 */

import { loadPrompt } from '../prompts/loader.js';
import { isEnabled } from '../config/features.js';

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

    // Select AI model based on feature flag
    // Using Haiku for prototyping - switch to Sonnet for production
    const model = isEnabled('PROTOTYPE_MODE')
      ? 'claude-3-5-haiku-20241022'  // Cheaper model for development ($0.80/MTok vs $3/MTok)
      : 'claude-3-5-sonnet-20241022';   // Production model

    // Load the system prompt from markdown file with current date
    const systemPrompt = loadPrompt('calendar-parser', {
      CURRENT_DATE: new Date().toISOString().split('T')[0]
    });

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok || data.error) {
      console.error('[Parse] Anthropic API error:', data);
      throw new Error(data.error?.message || `API returned ${response.status}`);
    }

    // Extract the JSON from Claude's response
    if (!data.content || !data.content[0]) {
      console.error('[Parse] Unexpected API response:', data);
      throw new Error('Invalid API response format');
    }

    const content = data.content[0].text;
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Add metadata if debugging is enabled
    if (isEnabled('SHOW_AI_REASONING')) {
      parsed._debug = {
        model,
        promptLength: systemPrompt.length,
        featureFlags: {
          PROTOTYPE_MODE: isEnabled('PROTOTYPE_MODE'),
          AUTO_CREATE_HIGH_CONFIDENCE: isEnabled('AUTO_CREATE_HIGH_CONFIDENCE'),
          SHOW_AI_REASONING: isEnabled('SHOW_AI_REASONING')
        }
      };
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Parse error:', error);
    return res.status(500).json({
      error: 'Failed to parse',
      details: error.message
    });
  }
}
