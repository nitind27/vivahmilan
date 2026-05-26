import { execute } from '@/lib/db';

/** Remove "new interest" notifications for the receiver when sender withdraws. */
export async function clearInterestReceivedNotifications(receiverId, senderId) {
  await execute(
    `DELETE FROM notification
     WHERE userId = ? AND type = 'INTEREST_RECEIVED' AND link = ?`,
    [receiverId, `/profile/${senderId}`]
  );
}

export function emitNotificationRefresh(userId) {
  try {
    const io = global.getIO?.();
    if (io) io.emit('notification:new', { userId });
  } catch {}
}
