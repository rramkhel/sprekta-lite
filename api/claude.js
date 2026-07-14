import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing session token' });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      ...req.body,
      model: 'claude-sonnet-5',
      // Claude Sonnet 5 thinks by default even without an explicit `thinking`
      // param, and thinking tokens count against max_tokens — 2048 was too
      // tight and let extended thinking alone exhaust the budget before any
      // JSON answer was emitted (stop_reason: "max_tokens", 0 text output).
      max_tokens: 6000,
    }),
  });

  const data = await anthropicRes.json();
  res.status(anthropicRes.status).json(data);
}
