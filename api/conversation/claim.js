import { createServiceClient } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'];

    if (!authHeader?.startsWith('Bearer ') || !sessionId) {
      return res.status(400).json({ error: 'Token and sessionId required' });
    }

    // Verify token
    const token = authHeader.split(' ')[1];
    const supabaseAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const supabase = createServiceClient();

    // Find anonymous conversations with this session
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .is('user_id', null);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    if (!conversations || conversations.length === 0) {
      return res.status(200).json({ claimed: 0 });
    }

    // Claim conversations - set user_id, clear session_id
    const ids = conversations.map(c => c.id);

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        user_id: user.id,
        session_id: null
      })
      .in('id', ids);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to claim conversations' });
    }

    return res.status(200).json({ claimed: ids.length });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
