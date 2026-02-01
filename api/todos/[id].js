import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createServiceClient();

  try {
    if (req.method === 'PATCH') {
      const { completed } = req.body;

      const { data, error } = await supabase
        .from('todos')
        .update({
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Todo update error:', error);
        return res.status(500).json({ error: 'Failed to update todo' });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
