/**
 * Events API
 *
 * Handles all event CRUD operations with Supabase
 */

import { createServiceClient } from '../lib/supabase.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createServiceClient();

  // GET - Load events for session
  if (req.method === 'GET') {
    try {
      // Sprint 14.4: Filter by session ID
      const sessionId = req.headers['x-session-id'];

      console.log('[Events API] GET request');
      console.log('[Events API] Session ID:', sessionId);

      if (!sessionId) {
        console.warn('[Events API] No session ID provided');
        return res.status(400).json({ error: 'Missing session ID' });
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('session_id', sessionId)
        .order('date', { ascending: true });

      if (error) {
        console.error('[Events API] Fetch error:', error);
        throw error;
      }

      // Transform snake_case to camelCase for frontend
      const events = (data || []).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        endTime: e.end_time,
        notes: e.notes,
        raw: e.raw,
        aiResponse: e.ai_response,
        needsTriage: e.needs_triage || false,
        created_at: e.created_at,
        updated_at: e.updated_at
      }));

      console.log(`[Events API] Loaded ${events.length} events for session ${sessionId}`);
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
        end_time: event.endTime || null,
        notes: event.notes || null,
        raw: event.raw || null,
        ai_response: event.aiResponse || null,
        needs_triage: event.needsTriage || false
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
        endTime: data[0].end_time,
        notes: data[0].notes,
        raw: data[0].raw,
        aiResponse: data[0].ai_response,
        needsTriage: data[0].needs_triage || false,
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

  // PUT/PATCH - Update event
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const event = req.body;

      if (!event.id) {
        return res.status(400).json({ error: 'Event ID required' });
      }

      // Transform camelCase to snake_case for database
      const dbUpdates = {
        title: event.title,
        date: event.date,
        time: event.time || null,
        end_time: event.endTime || null,
        notes: event.notes || null,
        raw: event.raw || null,
        ai_response: event.aiResponse || null,
        needs_triage: event.needsTriage !== undefined ? event.needsTriage : undefined
      };

      // Remove undefined/null values to avoid overwriting with nulls
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });

      const { data, error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', event.id)
        .select();

      if (error) throw error;

      console.log('[Events API] Updated event:', event.id);

      // Transform back to camelCase for response
      const responseEvent = {
        id: data[0].id,
        title: data[0].title,
        date: data[0].date,
        time: data[0].time,
        endTime: data[0].end_time,
        notes: data[0].notes,
        raw: data[0].raw,
        aiResponse: data[0].ai_response,
        needsTriage: data[0].needs_triage || false,
        created_at: data[0].created_at,
        updated_at: data[0].updated_at
      };

      return res.status(200).json({ event: responseEvent });
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
