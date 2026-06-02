import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { query, queryOne, execute } from '@/lib/db';

const MIN_PASSWORD_LEN = 8;

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function countActiveAdmins() {
  const row = await queryOne(
    `SELECT COUNT(*) AS cnt FROM \`user\` WHERE role = 'ADMIN' AND isActive = 1`
  );
  return Number(row?.cnt || 0);
}

export async function listAdmins() {
  return query(
    `SELECT id, name, email, isActive, createdAt, lastLoginAt
     FROM \`user\` WHERE role = 'ADMIN'
     ORDER BY createdAt ASC`
  );
}

export async function getAdminById(id) {
  return queryOne(
    `SELECT id, name, email, isActive, role, password IS NOT NULL AS hasPassword, createdAt, lastLoginAt
     FROM \`user\` WHERE id = ? AND role = 'ADMIN'`,
    [id]
  );
}

/** Create new admin or upgrade existing USER account */
export async function provisionAdmin({ name, email, password }) {
  const emailNorm = email.trim().toLowerCase();
  const displayName = (name || emailNorm.split('@')[0] || 'Admin').trim().slice(0, 191);

  if (!isValidEmail(emailNorm)) throw new Error('Invalid email address');
  if (!password || password.length < MIN_PASSWORD_LEN) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LEN} characters`);
  }

  const hash = await bcrypt.hash(password, 12);
  const now = new Date();

  const existing = await queryOne(
    'SELECT id, name, role FROM `user` WHERE email = ?',
    [emailNorm]
  );

  if (existing) {
    if (existing.role === 'ADMIN') {
      throw new Error('An admin account with this email already exists');
    }
    await execute(
      `UPDATE \`user\` SET role = 'ADMIN', password = ?, name = ?, isActive = 1,
       isVerified = 1, adminVerified = 1, verificationBadge = 1, needsPassword = 0, updatedAt = ?
       WHERE id = ?`,
      [hash, displayName, now, existing.id]
    );
    return { id: existing.id, email: emailNorm, name: displayName, upgraded: true };
  }

  const userId = randomUUID();
  await execute(
    `INSERT INTO \`user\` (id, name, email, password, role, isActive, isVerified, adminVerified,
     verificationBadge, isPremium, profileBoost, phoneVerified, loginOtpEnabled, needsPassword, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'ADMIN', 1, 1, 1, 1, 0, 0, 0, 0, 0, ?, ?)`,
    [userId, displayName, emailNorm, hash, now, now]
  );

  return { id: userId, email: emailNorm, name: displayName, upgraded: false };
}

/** Update logged-in admin's own account (requires current password for sensitive fields) */
export async function updateOwnAdminAccount(userId, { name, email, newPassword, currentPassword }) {
  const user = await queryOne(
    'SELECT id, email, password, name FROM `user` WHERE id = ? AND role = \'ADMIN\'',
    [userId]
  );
  if (!user) throw new Error('Admin account not found');

  const updates = [];
  const params = [];

  if (name != null && String(name).trim()) {
    updates.push('name = ?');
    params.push(String(name).trim().slice(0, 191));
  }

  const changingEmail = email != null && email.trim().toLowerCase() !== (user.email || '').toLowerCase();
  const changingPassword = !!newPassword;

  if (changingEmail || changingPassword) {
    if (!user.password) {
      if (changingPassword && !newPassword) throw new Error('New password is required');
    } else {
      if (!currentPassword) throw new Error('Current password is required');
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) throw new Error('Current password is incorrect');
    }
  }

  if (changingEmail) {
    const emailNorm = email.trim().toLowerCase();
    if (!isValidEmail(emailNorm)) throw new Error('Invalid email address');
    const taken = await queryOne(
      'SELECT id FROM `user` WHERE email = ? AND id != ?',
      [emailNorm, userId]
    );
    if (taken) throw new Error('This email is already in use');
    updates.push('email = ?');
    params.push(emailNorm);
  }

  if (changingPassword) {
    if (newPassword.length < MIN_PASSWORD_LEN) {
      throw new Error(`New password must be at least ${MIN_PASSWORD_LEN} characters`);
    }
    if (user.password) {
      const same = await bcrypt.compare(newPassword, user.password);
      if (same) throw new Error('New password must be different from current password');
    }
    const hash = await bcrypt.hash(newPassword, 12);
    updates.push('password = ?', 'needsPassword = 0');
    params.push(hash);
  }

  if (!updates.length) return { updated: false };

  params.push(new Date(), userId);
  await execute(
    `UPDATE \`user\` SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
    params
  );

  return {
    updated: true,
    email: changingEmail ? email.trim().toLowerCase() : user.email,
    passwordChanged: changingPassword,
  };
}

/** Another admin: reset password, name, email, active status */
export async function updateAdminById(targetId, actorId, data) {
  const target = await getAdminById(targetId);
  if (!target) throw new Error('Admin not found');

  const { name, email, password, isActive } = data;
  const updates = [];
  const params = [];

  if (name != null && String(name).trim()) {
    updates.push('name = ?');
    params.push(String(name).trim().slice(0, 191));
  }

  if (email != null) {
    const emailNorm = email.trim().toLowerCase();
    if (!isValidEmail(emailNorm)) throw new Error('Invalid email address');
    const taken = await queryOne(
      'SELECT id FROM `user` WHERE email = ? AND id != ?',
      [emailNorm, targetId]
    );
    if (taken) throw new Error('This email is already in use');
    updates.push('email = ?');
    params.push(emailNorm);
  }

  if (password) {
    if (password.length < MIN_PASSWORD_LEN) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LEN} characters`);
    }
    const hash = await bcrypt.hash(password, 12);
    updates.push('password = ?', 'needsPassword = 0');
    params.push(hash);
  }

  if (isActive === false) {
    if (targetId === actorId) throw new Error('You cannot deactivate your own account');
    const activeCount = await countActiveAdmins();
    if (activeCount <= 1 && target.isActive) {
      throw new Error('Cannot deactivate the last active admin');
    }
    updates.push('isActive = 0');
  } else if (isActive === true) {
    updates.push('isActive = 1');
  }

  if (!updates.length) return { updated: false };

  params.push(new Date(), targetId);
  await execute(
    `UPDATE \`user\` SET ${updates.join(', ')}, updatedAt = ? WHERE id = ? AND role = 'ADMIN'`,
    params
  );

  return { updated: true };
}
