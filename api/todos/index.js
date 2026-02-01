import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createServiceClient();

  try {
    if (req.method === 'GET') {
      const sessionId = req.headers['x-session-id'];

      if (!sessionId) {
        return res.status(400).json({ error: 'Missing session ID' });
      }

      // Fetch incomplete todos for this session
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('session_id', sessionId)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Todos fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch todos' });
      }

      return res.status(200).json({ todos: data || [] });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
