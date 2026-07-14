import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: due, error: dueError } = await admin
    .from('reminders')
    .select('id, device_id, title, body')
    .lte('fire_at', new Date().toISOString())
    .is('sent_at', null)
    .limit(50);

  if (dueError) {
    res.status(500).json({ error: 'Failed to query due reminders' });
    return;
  }
  if (!due?.length) {
    res.status(200).json({ due: 0, sent: 0, failed: 0 });
    return;
  }

  const deviceIds = [...new Set(due.map((r) => r.device_id).filter(Boolean))];
  const { data: subs } = deviceIds.length
    ? await admin.from('push_subscriptions').select('*').in('device_id', deviceIds)
    : { data: [] };
  const subsByDevice = new Map();
  for (const s of subs || []) {
    if (!subsByDevice.has(s.device_id)) subsByDevice.set(s.device_id, []);
    subsByDevice.get(s.device_id).push(s);
  }

  let sent = 0, failed = 0;
  const deadEndpoints = new Set();

  for (const reminder of due) {
    const targets = subsByDevice.get(reminder.device_id) || [];
    const payload = JSON.stringify({ title: reminder.title, body: reminder.body || '', url: '/' });
    if (!targets.length) {
      failed += 1;
    } else {
      const results = await Promise.allSettled(targets.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
      ));
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') sent += 1;
        else {
          failed += 1;
          if (r.reason?.statusCode === 404 || r.reason?.statusCode === 410) deadEndpoints.add(targets[i].endpoint);
        }
      });
    }
  }

  // No retries in v1 — every due reminder is marked sent whether or not
  // delivery succeeded, so a failure doesn't spam every minute forever.
  await admin.from('reminders').update({ sent_at: new Date().toISOString() }).in('id', due.map((r) => r.id));

  if (deadEndpoints.size) {
    await admin.from('push_subscriptions').delete().in('endpoint', [...deadEndpoints]);
  }

  res.status(200).json({ due: due.length, sent, failed });
}
