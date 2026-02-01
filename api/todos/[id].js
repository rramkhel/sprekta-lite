import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createServiceClient();
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing todo ID' });
  }

  try {
    if (req.method === 'PATCH') {
      const { completed, title, priority, time_group } = req.body;

      const updates = { updated_at: new Date().toISOString() };

      if (typeof completed === 'boolean') {
        updates.completed = completed;
        updates.completed_at = completed ? new Date().toISOString() : null;
      }
      if (title) updates.title = title;
      if (priority) updates.priority = priority;
      if (time_group) updates.time_group = time_group;

      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Todo update error:', error);
        return res.status(500).json({ error: 'Failed to update todo' });
      }

      return res.status(200).json({ todo: data });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Todo delete error:', error);
        return res.status(500).json({ error: 'Failed to delete todo' });
      }

      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
