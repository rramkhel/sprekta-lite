import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing session token' });
    return;
  }

  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const { deviceId } = req.body || {};
  if (!deviceId) {
    res.status(400).json({ error: 'Missing deviceId' });
    return;
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: subs, error } = await admin.from('push_subscriptions').select('*').eq('device_id', deviceId);
  if (error) {
    res.status(500).json({ error: 'Failed to look up subscriptions' });
    return;
  }
  if (!subs?.length) {
    res.status(404).json({ error: 'No subscription for this device' });
    return;
  }

  const payload = JSON.stringify({ title: 'Sprekta', body: 'Test from Sprekta 👋', url: '/' });
  const results = await Promise.allSettled(subs.map((s) =>
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
  ));

  const deadEndpoints = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected' && (r.reason?.statusCode === 404 || r.reason?.statusCode === 410)) {
      deadEndpoints.push(subs[i].endpoint);
    }
  });
  if (deadEndpoints.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  res.status(200).json({ sent, total: subs.length });
}
