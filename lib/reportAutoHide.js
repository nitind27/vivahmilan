import { queryOne, execute } from '@/lib/db';
import { AUTO_HIDE_REPORT_THRESHOLD } from '@/lib/profileVerification';

/**
 * After a new report, auto-hide profile from search if report threshold is reached.
 */
export async function handleReportAutoHide(targetId) {
  const row = await queryOne(
    `SELECT COUNT(*) AS cnt FROM report
     WHERE targetId = ? AND status IN ('PENDING', 'REVIEWED')`,
    [targetId]
  );
  const count = Number(row?.cnt ?? 0);
  if (count < AUTO_HIDE_REPORT_THRESHOLD) {
    return { hidden: false, reportCount: count };
  }

  const target = await queryOne('SELECT id, name, isActive, adminVerified FROM `user` WHERE id = ?', [targetId]);
  if (!target || !target.isActive) {
    return { hidden: false, reportCount: count, alreadyInactive: true };
  }

  await execute(
    'UPDATE `user` SET isActive = 0, updatedAt = NOW() WHERE id = ?',
    [targetId]
  );

  try {
    const { notifyAdmins } = await import('@/lib/adminNotifications');
    await notifyAdmins({
      title: '⚠️ Profile Auto-Hidden — Multiple Reports',
      message: `${target.name || 'A user'} received ${count} abuse reports and has been automatically hidden pending admin review.`,
      link: '/admin/reports',
    });
  } catch {}

  try {
    await execute(
      `INSERT INTO notification (id, userId, type, title, message, link, isRead, createdAt)
       VALUES (UUID(), ?, 'ACCOUNT_SUSPENDED', ?, ?, '/contact', 0, NOW())`,
      [
        targetId,
        'Account Under Review',
        `Your profile has been temporarily hidden after receiving multiple community reports. Our team will review your account shortly. Contact support if you believe this is an error.`,
      ]
    );
  } catch {}

  return { hidden: true, reportCount: count };
}
