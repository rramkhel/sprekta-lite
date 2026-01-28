import { createServiceClient } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, profileText, forceNew } = req.body;
    const authHeader = req.headers.authorization;

    let userId = null;

    // If auth token provided, verify and get user
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Verify token with Supabase
      const supabaseAuth = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

      if (!error && user) {
        userId = user.id;
      }
    }

    // Require either sessionId or userId
    if (!sessionId && !userId) {
      return res.status(400).json({ error: 'sessionId or authentication required' });
    }

    const supabase = createServiceClient();

    // Check for existing active conversation
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('status', 'active');

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: existing } = await query.maybeSingle();

    // If forcing new conversation and one exists, archive it
    if (forceNew && existing) {
      const { error: archiveError } = await supabase
        .from('conversations')
        .update({ status: 'resolved' })
        .eq('id', existing.id);

      if (archiveError) {
        console.error('Failed to archive conversation:', archiveError);
        // Continue anyway - create new conversation
      }
    } else if (existing && !forceNew) {
      // Return existing conversation
      return res.status(200).json({
        conversationId: existing.id,
        isNew: false
      });
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        session_id: userId ? null : sessionId,  // Don't store session if logged in
        user_id: userId,
        profile_text: profileText || null,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create conversation' });
    }

    return res.status(201).json({
      conversationId: data.id,
      isNew: true
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
