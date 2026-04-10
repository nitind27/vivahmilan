'use client';

let swRegistration = null;

// Register service worker
export async function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

// Request notification permission
export async function requestNotifPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Send notification via Service Worker (works when tab is in background)
export function sendNotification({ title, body, icon = '/favicon.ico', url = '/' }) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  // Use SW if available — works in background
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      icon,
      url,
    });
  } else {
    // Fallback — direct Notification API
    try { new Notification(title, { body, icon }); } catch {}
  }
}
