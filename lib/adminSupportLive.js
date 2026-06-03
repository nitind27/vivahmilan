import { getAdminIds, notifyAdmins } from '@/lib/adminNotifications';

/** In-app notification + real-time socket for admin support queue. */
export async function notifyAdminSupportEvent({ sessionId, title, message, type = 'message' }) {
  const link = `/admin/support?session=${sessionId}`;

  await notifyAdmins({ title, message, link });

  try {
    const io = global.getIO?.();
    if (!io) return;

    const adminIds = await getAdminIds();
    const payload = {
      sessionId,
      title,
      message,
      type,
      link,
      at: new Date().toISOString(),
    };

    for (const adminId of adminIds) {
      io.to(`user:${adminId}`).emit('admin:support:update', payload);
    }
  } catch (e) {
    console.error('[adminSupportLive] socket:', e.message);
  }
}
