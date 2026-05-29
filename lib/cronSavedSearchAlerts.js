import { query } from './db.js';
import { ensureFeatureTables } from './ensureFeatureTables.js';
import { processSavedSearchAlerts } from './savedSearchAlerts.js';

export async function processAllSavedSearchAlerts() {
  await ensureFeatureTables();
  const users = await query(
    `SELECT DISTINCT s.userId FROM savedsearch s WHERE s.alertEnabled = 1`
  );
  let totalSent = 0;
  for (const { userId } of users) {
    try {
      const r = await processSavedSearchAlerts(userId);
      totalSent += r.sent || 0;
    } catch (e) {
      console.error('[cron] saved search alert error for', userId, e.message);
    }
  }
  return { usersProcessed: users.length, emailsSent: totalSent };
}
