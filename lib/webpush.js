import webpush from 'web-push';
import { query, execute } from '@/lib/db';

let initialized = false;

function initWebPush() {
  if (initialized) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.EMAIL_FROM || 'admin@vivahmilan.com';

  if (!pub || !priv) {
    console.error('[WebPush] VAPID keys missing! PUBLIC:', pub ? 'set' : 'MISSING', 'PRIVATE:', priv ? 'set' : 'MISSING');
    return false;
  }

  webpush.setVapidDetails(`mailto:${email}`, pub, priv);
  initialized = true;
  return true;
}

export async function sendPushToUser(userId, { title, body, icon = '/favicon.ico', url = '/' }) {
  if (!initWebPush()) return;

  const subs = await query('SELECT * FROM pushsubscription WHERE userId = ?', [userId]);
  if (!subs?.length) {
    console.log('[WebPush] No subscriptions for user:', userId);
    return;
  }

  console.log(`[WebPush] Sending to ${subs.length} subscription(s) for user ${userId}`);

  const payload = JSON.stringify({ title, body, icon, url });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86400 }
        );
        console.log('[WebPush] Sent to:', sub.endpoint.slice(0, 50));
      } catch (err) {
        console.error('[WebPush] Send error:', err.statusCode, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await execute('DELETE FROM pushsubscription WHERE id = ?', [sub.id]);
          console.log('[WebPush] Removed expired subscription');
        }
      }
    })
  );
}
