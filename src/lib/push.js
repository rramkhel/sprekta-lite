import { getDeviceId } from './device.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const PROMPT_DISMISSED_KEY = 'sprekta:reminderPromptDismissed';
const ENABLED_KEY = 'sprekta:remindersEnabled';

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isInstalled() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export function supportsPush() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export function isPromptDismissed() {
  return localStorage.getItem(PROMPT_DISMISSED_KEY) === '1';
}
export function dismissPrompt() {
  localStorage.setItem(PROMPT_DISMISSED_KEY, '1');
}

// Local proxy for "this device has a push subscription" — the actual
// subscription record lives server-side in push_subscriptions, which the
// browser deliberately has zero read access to (see migration 0005). Good
// enough for deciding whether to show the contextual prompt; a cleared
// localStorage just means the prompt can reappear, which is harmless.
export function remindersEnabledOnThisDevice() {
  return localStorage.getItem(ENABLED_KEY) === '1';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Must be called from a click handler — browsers block permission requests
// without a direct user gesture, and it's a deliberate product rule here
// too: never request permission on page load or any non-tap trigger.
export async function enableReminders({ accessToken }) {
  if (isIOS() && !isInstalled()) return { status: 'needs-install' };
  if (!supportsPush()) return { status: 'unsupported' };

  const registration = await navigator.serviceWorker.register('/sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { status: 'denied' };

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ subscription, deviceId: getDeviceId() }),
  });
  if (!res.ok) return { status: 'error' };

  localStorage.setItem(ENABLED_KEY, '1');
  return { status: 'enabled' };
}

export async function sendTestNotification({ accessToken }) {
  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ deviceId: getDeviceId() }),
  });
  return res.ok;
}
