import { query, queryOne, execute } from './db.js';
import { ensureFeatureTables } from './ensureFeatureTables.js';
import { sendPremiumRenewalReminderEmail } from './email.js';
import { randomUUID } from 'crypto';

const REMINDER_DAYS = [7, 3, 1, 0];

export async function processRenewalReminders() {
  await ensureFeatureTables();
  const users = await query(`
    SELECT u.id, u.name, u.email, u.premiumPlan, u.premiumExpiry, COALESCE(up.autoRenew, 0) AS autoRenew
    FROM \`user\` u
    LEFT JOIN userpreference up ON up.userId = u.id
    WHERE u.isPremium = 1 AND u.premiumExpiry IS NOT NULL AND u.isActive = 1
      AND u.premiumExpiry >= CURDATE()
      AND u.premiumExpiry <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  `);

  const now = new Date();
  let emailsSent = 0;

  for (const user of users) {
    const expiry = new Date(user.premiumExpiry);
    const daysLeft = Math.ceil((expiry - now) / 86400000);
    if (!REMINDER_DAYS.includes(daysLeft)) continue;

    const typeKey = `RENEWAL_${daysLeft}`;
    const alreadySent = await queryOne(
      `SELECT id FROM notification WHERE userId = ? AND type = 'SUBSCRIPTION_EXPIRY'
       AND message LIKE ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 20 HOUR)`,
      [user.id, `%${daysLeft} day%`]
    );
    if (alreadySent && daysLeft > 0) continue;

    const msg = daysLeft === 0
      ? 'Your Premium subscription expires today! Renew now to keep all benefits.'
      : `Your Premium expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. ${user.autoRenew ? 'Auto-renew is enabled — renew manually on Premium page.' : 'Renew on Premium page.'}`;

    await execute(
      `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
       VALUES (?, ?, 'SUBSCRIPTION_EXPIRY', ?, ?, 0, '/premium', NOW())`,
      [randomUUID(), user.id, daysLeft === 0 ? '⚠️ Premium Expires Today' : '⚠️ Premium Expiring Soon', msg]
    );

    if (user.email && user.autoRenew) {
      try {
        await sendPremiumRenewalReminderEmail(user.email, user.name, user.premiumPlan, user.premiumExpiry, daysLeft, true);
        emailsSent++;
      } catch (e) {
        console.error('[cron] renewal email failed', user.id, e.message);
      }
    }
  }

  return { usersChecked: users.length, emailsSent };
}
