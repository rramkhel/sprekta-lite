import { createServiceClient } from '../../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Conversation ID required' });
  }

  // Auth required
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const supabase = createServiceClient();

  try {
    // Fetch conversation to verify ownership
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify ownership
    if (conversation.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status to 'resolved' (archived)
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to archive conversation:', updateError);
      return res.status(500).json({ error: 'Failed to archive conversation' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
