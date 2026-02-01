import { createServiceClient } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth required for all profile operations
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
    // GET - Fetch profile
    if (req.method === 'GET') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Profile fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      return res.status(200).json({ profile: profile || null });
    }

    // POST - Create profile
    if (req.method === 'POST') {
      const { name, patterns, redFlags, keyPeople, priorities, notes, about_me, projects } = req.body;

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Profile already exists. Use PUT to update.' });
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: name || null,
          patterns: patterns || [],
          red_flags: redFlags || [],
          key_people: keyPeople || [],
          priorities: priorities || [],
          notes: notes || null,
          about_me: about_me || null,
          projects: projects || null
        })
        .select()
        .single();

      if (error) {
        console.error('Profile create error:', error);
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      return res.status(201).json({ profile });
    }

    // PUT - Update profile
    if (req.method === 'PUT') {
      const { name, patterns, redFlags, keyPeople, priorities, notes, about_me, projects } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (patterns !== undefined) updates.patterns = patterns;
      if (redFlags !== undefined) updates.red_flags = redFlags;
      if (keyPeople !== undefined) updates.key_people = keyPeople;
      if (priorities !== undefined) updates.priorities = priorities;
      if (notes !== undefined) updates.notes = notes;
      if (about_me !== undefined) updates.about_me = about_me;
      if (projects !== undefined) updates.projects = projects;

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      return res.status(200).json({ profile });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
