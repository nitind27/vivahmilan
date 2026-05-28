import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function getAdminIds() {
  const rows = await query("SELECT id FROM `user` WHERE role = 'ADMIN' AND isActive = 1");
  return rows.map(r => r.id);
}

/** Insert a SYSTEM notification for every active admin and emit real-time socket event. */
export async function notifyAdmins({ title, message, link }) {
  const adminIds = await getAdminIds();
  if (!adminIds.length) return [];

  const created = [];

  for (const adminId of adminIds) {
    const id = randomUUID();
    await execute(
      `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
       VALUES (?, ?, 'SYSTEM', ?, ?, 0, ?, NOW())`,
      [id, adminId, title, message, link || null]
    );

    const notification = {
      id,
      userId: adminId,
      type: 'SYSTEM',
      title,
      message,
      isRead: false,
      link: link || null,
      createdAt: new Date().toISOString(),
    };
    created.push(notification);

    try {
      const io = global.getIO?.();
      if (io) io.to(`user:${adminId}`).emit('admin:notification', { notification });
    } catch {}
  }

  return created;
}
