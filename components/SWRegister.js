'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Hardcoded at build time by Next.js
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribePush(reg) {
  try {
    // Check existing
    let sub = await reg.pushManager.getSubscription();

    // If already subscribed, just re-save to server (in case it changed)
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });
    }

    const subJson = sub.toJSON();
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
    });

    if (res.ok) {
      console.log('[Push] Subscription saved ✓');
    } else {
      console.error('[Push] Failed to save subscription');
    }
  } catch (err) {
    console.error('[Push] Subscribe error:', err.message);
  }
}

export default function SWRegister() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) { console.warn('[Push] SW not supported'); return; }
    if (!('PushManager' in window)) { console.warn('[Push] PushManager not supported'); return; }
    if (!VAPID_KEY) { console.error('[Push] VAPID key missing'); return; }

    async function init() {
      try {
        // Register SW
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
        console.log('[SW] Registered:', reg.scope);

        // Wait for SW to be ready
        await navigator.serviceWorker.ready;
        console.log('[SW] Ready');

        // Request permission
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        console.log('[Push] Permission:', permission);
        if (permission !== 'granted') {
          console.warn('[Push] Permission denied');
          return;
        }

        await subscribePush(reg);
      } catch (err) {
        console.error('[SW] Init error:', err);
      }
    }

    init();
  }, [status]);

  return null;
}
