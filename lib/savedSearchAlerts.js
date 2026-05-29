import { query, queryOne, execute } from './db.js';
import { ensureFeatureTables } from './ensureFeatureTables.js';
import { buildSearchQuery } from './buildSearchQuery.js';
import { sendSavedSearchAlertEmail } from './email.js';

const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function processSavedSearchAlerts(userId) {
  await ensureFeatureTables();

  const user = await queryOne('SELECT name, email FROM `user` WHERE id = ?', [userId]);
  if (!user?.email) return { sent: 0 };

  const searches = await query(
    `SELECT id, name, filters, lastAlertAt, createdAt FROM savedsearch
     WHERE userId = ? AND alertEnabled = 1`,
    [userId]
  );

  let sent = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';

  for (const search of searches) {
    const lastAt = search.lastAlertAt ? new Date(search.lastAlertAt) : new Date(search.createdAt);
    if (Date.now() - lastAt.getTime() < ALERT_COOLDOWN_MS) continue;

    const filters = typeof search.filters === 'string' ? JSON.parse(search.filters || '{}') : search.filters;
    const q = await buildSearchQuery(userId, filters);
    const since = lastAt.toISOString().slice(0, 19).replace('T', ' ');

    const { sql, params } = q.baseSQL(['u.createdAt > ?'], [since]);
    const matches = await query(
      `SELECT u.id, u.name, p.city, p.profession
       ${sql}
       ORDER BY u.createdAt DESC
       LIMIT 5`,
      params
    );

    const countRow = await queryOne(`SELECT COUNT(*) AS cnt ${sql}`, params);
    const total = Number(countRow?.cnt ?? 0);
    if (total === 0) continue;

    await sendSavedSearchAlertEmail(user.email, user.name, {
      searchName: search.name,
      total,
      matches: matches.map(m => ({
        name: m.name,
        detail: [m.city, m.profession].filter(Boolean).join(' · ') || 'New member',
      })),
      searchUrl: `${appUrl}/search`,
    });

    try {
      const { sendPushToUser } = await import('./webpush.js');
      await sendPushToUser(userId, {
        title: `🔔 ${total} new match${total !== 1 ? 'es' : ''}`,
        body: `"${search.name}" — ${matches[0]?.name || 'View profiles'}`,
        url: '/search',
      });
    } catch {}

    await execute('UPDATE savedsearch SET lastAlertAt = NOW() WHERE id = ?', [search.id]);
    sent++;
  }

  return { sent };
}
