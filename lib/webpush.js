import webpush from 'web-push';
import { query, execute } from '@/lib/db';

webpush.setVapidDetails(
  'mailto:' + (process.env.EMAIL_FROM || 'admin@vivahmilan.com'),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to all subscriptions of a user
 */
export async function sendPushToUser(userId, { title, body, icon = '/favicon.ico', url = '/' }) {
  const subs = await query(
    'SELECT * FROM pushsubscription WHERE userId = ?',
    [userId]
  );

  if (!subs?.length) return;

  const payload = JSON.stringify({ title, body, icon, url });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        // Remove expired/invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await execute('DELETE FROM pushsubscription WHERE id = ?', [sub.id]);
        }
      }
    })
  );
}
