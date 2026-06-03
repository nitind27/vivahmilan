import { randomUUID } from 'crypto';
import { execute, query, queryOne } from '@/lib/db.js';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Record a permanently deleted member so admins can audit; same email may register again later. */
export async function archiveDeletedUser(user, { adminId = null, adminName = null } = {}) {
  const email = normalizeEmail(user?.email);
  if (!email) return null;

  await ensureFeatureTables();
  const id = randomUUID();

  await execute('DELETE FROM deleted_user_archive WHERE email = ?', [email]);

  await execute(
    `INSERT INTO deleted_user_archive
      (id, originalUserId, email, name, phone, rejectionReason, rejectedAt,
       deletedAt, deletedByAdminId, deletedByAdminName)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [
      id,
      user.id,
      email,
      user.name || null,
      user.phone || null,
      user.profileRejectionReason || null,
      user.profileRejectedAt || null,
      adminId,
      adminName,
    ]
  );

  return id;
}

/** Remove from deleted list when the same email registers again. */
export async function clearDeletedUserArchiveByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return 0;
  await ensureFeatureTables();
  const result = await execute('DELETE FROM deleted_user_archive WHERE email = ?', [normalized]);
  return result?.affectedRows ?? 0;
}

export async function listDeletedUserArchive({
  search = '',
  limit = 50,
  offset = 0,
} = {}) {
  await ensureFeatureTables();
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const off = Math.max(Number(offset) || 0, 0);
  const q = search.trim().toLowerCase();

  let where = '';
  const params = [];
  if (q) {
    where = ' WHERE (LOWER(email) LIKE ? OR LOWER(name) LIKE ? OR LOWER(phone) LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const totalRow = await queryOne(
    `SELECT COUNT(*) AS cnt FROM deleted_user_archive${where}`,
    params
  );

  const rows = await query(
    `SELECT id, originalUserId, email, name, phone, rejectionReason, rejectedAt,
            deletedAt, deletedByAdminId, deletedByAdminName
     FROM deleted_user_archive${where}
     ORDER BY deletedAt DESC
     LIMIT ${lim} OFFSET ${off}`,
    params
  );

  return {
    users: rows,
    total: Number(totalRow?.cnt || 0),
    limit: lim,
    offset: off,
  };
}
