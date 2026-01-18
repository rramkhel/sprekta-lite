/**
 * Events API
 *
 * Handles all event CRUD operations with Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Events API] Supabase credentials missing!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // GET - Load all events
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Transform snake_case to camelCase for frontend
      const events = (data || []).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        raw: e.raw,
        aiResponse: e.ai_response,
        created_at: e.created_at,
        updated_at: e.updated_at
      }));

      console.log(`[Events API] Loaded ${events.length} events`);
      return res.status(200).json({ events });
    } catch (error) {
      console.error('[Events API] Load error:', error);
      return res.status(500).json({
        error: 'Failed to load events',
        details: error.message
      });
    }
  }

  // POST - Create new event
  if (req.method === 'POST') {
    try {
      const event = req.body;

      // Validate required fields
      if (!event.id || !event.title || !event.date) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['id', 'title', 'date']
        });
      }

      // Transform camelCase to snake_case for database
      const dbEvent = {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time || null,
        raw: event.raw || null,
        ai_response: event.aiResponse || null
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('events')
        .insert([dbEvent])
        .select();

      if (error) throw error;

      console.log('[Events API] Created event:', data[0].id);

      // Transform back to camelCase for response
      const responseEvent = {
        id: data[0].id,
        title: data[0].title,
        date: data[0].date,
        time: data[0].time,
        raw: data[0].raw,
        aiResponse: data[0].ai_response,
        created_at: data[0].created_at,
        updated_at: data[0].updated_at
      };

      return res.status(201).json({ event: responseEvent });
    } catch (error) {
      console.error('[Events API] Create error:', error);
      return res.status(500).json({
        error: 'Failed to create event',
        details: error.message
      });
    }
  }

  // PUT - Update event
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Event ID required' });
      }

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      console.log('[Events API] Updated event:', id);
      return res.status(200).json({ event: data[0] });
    } catch (error) {
      console.error('[Events API] Update error:', error);
      return res.status(500).json({
        error: 'Failed to update event',
        details: error.message
      });
    }
  }

  // DELETE - Delete event
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Event ID required' });
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('[Events API] Deleted event:', id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Events API] Delete error:', error);
      return res.status(500).json({
        error: 'Failed to delete event',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
