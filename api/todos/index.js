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
      // Sprint 14.4: Try multiple header variations
      const sessionId = req.headers['x-session-id']
        || req.headers['x-session']
        || req.headers['session-id'];

      console.log('[Todos API] GET request');
      console.log('[Todos API] Session ID:', sessionId);
      console.log('[Todos API] Headers:', Object.keys(req.headers));

      if (!sessionId) {
        console.warn('[Todos API] No session ID found in headers');
        return res.status(400).json({ error: 'Missing session ID', headers: Object.keys(req.headers) });
      }

      // Fetch incomplete todos for this session
      console.log('[Todos API] Querying todos for session:', sessionId);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('session_id', sessionId)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Todos API] Fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
      }

      console.log(`[Todos API] Found ${data?.length || 0} todos`);
      return res.status(200).json({ todos: data || [] });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[Todos API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
