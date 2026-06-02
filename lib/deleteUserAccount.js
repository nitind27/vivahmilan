import { execute, queryOne } from '@/lib/db.js';
import prisma from '@/lib/prisma';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

/**
 * Permanently remove a user and all related rows (Prisma cascades + feature tables).
 */
export async function permanentlyDeleteUserAccount(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isActive: true, adminVerified: true },
  });
  if (!user) {
    return { ok: false, error: 'User not found', status: 404 };
  }
  if (user.role === 'ADMIN') {
    return { ok: false, error: 'Cannot delete admin accounts', status: 403 };
  }
  if (user.isActive) {
    return { ok: false, error: 'Only deactivated (rejected) accounts can be permanently deleted', status: 400 };
  }

  await ensureFeatureTables();

  const tables = [
    ['profilereminderlog', 'userId'],
    ['storysubmission', 'userId'],
    ['savedsearch', 'userId'],
    ['family_photo', 'userId'],
    ['familyaccess', 'ownerUserId'],
    ['userpreference', 'userId'],
    ['userreferral', 'userId'],
    ['adminnote', 'targetUserId'],
    ['fcm_token', 'userId'],
    ['user_geo_log', 'userId'],
    ['pushsubscription', 'userId'],
  ];

  for (const [table, col] of tables) {
    try {
      await execute(`DELETE FROM \`${table}\` WHERE \`${col}\` = ?`, [userId]);
    } catch (e) {
      console.warn(`[deleteUser] ${table}:`, e.message);
    }
  }

  try {
    await execute('UPDATE userreferral SET referredByUserId = NULL WHERE referredByUserId = ?', [userId]);
  } catch (e) {
    console.warn('[deleteUser] userreferral referredBy:', e.message);
  }

  try {
    await execute('DELETE FROM agentsale WHERE buyerId = ?', [userId]);
  } catch (e) {
    console.warn('[deleteUser] agentsale:', e.message);
  }

  if (user.email) {
    try {
      await execute('DELETE FROM verificationtoken WHERE identifier = ?', [user.email]);
    } catch (e) {
      console.warn('[deleteUser] verificationtoken:', e.message);
    }
    try {
      await execute('DELETE FROM pending_registration WHERE email = ?', [user.email]);
    } catch (e) {
      console.warn('[deleteUser] pending_registration:', e.message);
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  const gone = await queryOne('SELECT id FROM `user` WHERE id = ?', [userId]);
  if (gone) {
    return { ok: false, error: 'User record still exists after delete', status: 500 };
  }

  return { ok: true, deletedUserId: userId, email: user.email };
}
