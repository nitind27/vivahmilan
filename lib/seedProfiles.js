import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne, execute } from '@/lib/db.js';
import prisma from '@/lib/prisma';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function ensureSeedProfileSupport() {
  await ensureFeatureTables();
  await tagLegacySeedUsers();
}

/** Mark existing bulk-seeded users that predate isSeedProfile flag. */
export async function tagLegacySeedUsers() {
  const result = await execute(`
    UPDATE \`user\` u
    INNER JOIN profile p ON p.userId = u.id
    SET u.isSeedProfile = 1
    WHERE u.isSeedProfile = 0
      AND u.role = 'USER'
      AND p.hidePhoto = 1
      AND p.profileComplete >= 95
      AND (
        u.email LIKE '%@seed.vivahdwar.in'
        OR u.email REGEXP '^[a-z][a-z0-9]*\\\\.[a-z][a-z0-9]*\\\\.[0-9]+@gmail\\\\.com$'
      )
  `);
  return result?.affectedRows ?? 0;
}

export async function getSeedProfileSummary() {
  await ensureSeedProfileSupport();

  const totals = await queryOne(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN p.gender = 'MALE' THEN 1 ELSE 0 END) AS males,
      SUM(CASE WHEN p.gender = 'FEMALE' THEN 1 ELSE 0 END) AS females
    FROM \`user\` u
    INNER JOIN profile p ON p.userId = u.id
    WHERE u.isSeedProfile = 1 AND u.role = 'USER'
  `);

  const byCaste = await query(`
    SELECT p.state, p.caste, p.religion,
           SUM(CASE WHEN p.gender = 'MALE' THEN 1 ELSE 0 END) AS males,
           SUM(CASE WHEN p.gender = 'FEMALE' THEN 1 ELSE 0 END) AS females,
           COUNT(*) AS total
    FROM \`user\` u
    INNER JOIN profile p ON p.userId = u.id
    WHERE u.isSeedProfile = 1 AND u.role = 'USER'
    GROUP BY p.state, p.caste, p.religion
    ORDER BY total DESC, p.state, p.caste
    LIMIT 500
  `);

  return {
    total: Number(totals?.total ?? 0),
    males: Number(totals?.males ?? 0),
    females: Number(totals?.females ?? 0),
    byCaste,
  };
}

export async function listSeedProfiles({
  state = '',
  caste = '',
  gender = '',
  search = '',
  page = 1,
  limit = 30,
}) {
  await ensureSeedProfileSupport();

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const conditions = ['u.isSeedProfile = 1', "u.role = 'USER'"];
  const params = [];

  if (state) {
    conditions.push('p.state = ?');
    params.push(state);
  }
  if (caste) {
    conditions.push('p.caste = ?');
    params.push(caste);
  }
  if (gender) {
    conditions.push('p.gender = ?');
    params.push(gender);
  }
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR p.city LIKE ?)');
    params.push(term, term, term, term);
  }

  const where = conditions.join(' AND ');
  const countRow = await queryOne(
    `SELECT COUNT(*) AS cnt
     FROM \`user\` u
     INNER JOIN profile p ON p.userId = u.id
     WHERE ${where}`,
    params
  );

  const rows = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.isPremium, u.adminVerified, u.createdAt,
            p.gender, p.dob, p.religion, p.caste, p.state, p.city, p.education, p.profession,
            p.profileComplete
     FROM \`user\` u
     INNER JOIN profile p ON p.userId = u.id
     WHERE ${where}
     ORDER BY p.state, p.caste, p.gender, u.createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const total = Number(countRow?.cnt ?? 0);
  return {
    profiles: rows,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    limit: safeLimit,
  };
}

export async function updateSeedProfile(userId, data) {
  await ensureSeedProfileSupport();

  const user = await queryOne(
    'SELECT id, isSeedProfile FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user?.isSeedProfile) {
    return { ok: false, error: 'Not a dummy/seed profile', status: 404 };
  }

  const userUpdates = [];
  const userVals = [];
  const profileUpdates = [];
  const profileVals = [];

  const userFields = ['name', 'email', 'phone'];
  for (const key of userFields) {
    if (data[key] !== undefined) {
      userUpdates.push(`\`${key}\` = ?`);
      userVals.push(data[key] === '' ? null : data[key]);
    }
  }

  const profileFields = ['city', 'state', 'education', 'profession', 'caste', 'religion'];
  for (const key of profileFields) {
    if (data[key] !== undefined) {
      profileUpdates.push(`\`${key}\` = ?`);
      profileVals.push(data[key] === '' ? null : data[key]);
    }
  }

  if (userUpdates.length) {
    userUpdates.push('updatedAt = NOW()');
    await execute(
      `UPDATE \`user\` SET ${userUpdates.join(', ')} WHERE id = ? AND isSeedProfile = 1`,
      [...userVals, userId]
    );
  }

  if (profileUpdates.length) {
    profileUpdates.push('updatedAt = NOW()');
    await execute(
      `UPDATE profile SET ${profileUpdates.join(', ')} WHERE userId = ?`,
      [...profileVals, userId]
    );
  }

  return { ok: true };
}

async function cleanupSeedUserRelations(userId) {
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
    } catch {
      // optional tables
    }
  }

  try {
    await execute('UPDATE userreferral SET referredByUserId = NULL WHERE referredByUserId = ?', [userId]);
  } catch {
    // ignore
  }

  try {
    await execute('DELETE FROM agentsale WHERE buyerId = ?', [userId]);
  } catch {
    // ignore
  }

  const user = await queryOne('SELECT email FROM `user` WHERE id = ?', [userId]);
  if (user?.email) {
    try {
      await execute('DELETE FROM verificationtoken WHERE identifier = ?', [user.email]);
    } catch {
      // ignore
    }
    try {
      await execute('DELETE FROM pending_registration WHERE email = ?', [user.email]);
    } catch {
      // ignore
    }
  }
}

export async function deleteSeedProfile(userId) {
  await ensureSeedProfileSupport();

  const user = await queryOne(
    'SELECT id, isSeedProfile, role FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user?.isSeedProfile) {
    return { ok: false, error: 'Not a dummy/seed profile', status: 404 };
  }
  if (user.role === 'ADMIN') {
    return { ok: false, error: 'Cannot delete admin', status: 403 };
  }

  await cleanupSeedUserRelations(userId);
  await prisma.user.delete({ where: { id: userId } });

  return { ok: true, deletedUserId: userId };
}

export async function deleteSeedProfilesBulk({ scope = 'filter', state = '', caste = '' } = {}) {
  await ensureSeedProfileSupport();

  const conditions = ['u.isSeedProfile = 1', "u.role = 'USER'"];
  const params = [];

  if (scope === 'filter') {
    if (state) {
      conditions.push('p.state = ?');
      params.push(state);
    }
    if (caste) {
      conditions.push('p.caste = ?');
      params.push(caste);
    }
    if (!state && !caste) {
      return { ok: false, error: 'Select state or caste for filtered delete', status: 400 };
    }
  } else if (scope !== 'all') {
    return { ok: false, error: 'Invalid scope', status: 400 };
  }

  const where = conditions.join(' AND ');
  const ids = await query(
    `SELECT u.id FROM \`user\` u
     INNER JOIN profile p ON p.userId = u.id
     WHERE ${where}`,
    params
  );

  let deleted = 0;
  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    for (const row of chunk) {
      const result = await deleteSeedProfile(row.id);
      if (result.ok) deleted += 1;
    }
  }

  return { ok: true, deleted, total: ids.length };
}

export function runSeedGeneration({
  state,
  caste,
  religion = 'Hindu',
  males = 0,
  females = 0,
  perGender = 0,
}) {
  return new Promise((resolve, reject) => {
    if (!state?.trim() || !caste?.trim()) {
      reject(new Error('State and caste are required'));
      return;
    }

    const args = [
      path.join(PROJECT_ROOT, 'scripts', 'seed-caste-profiles.mjs'),
      '--state', state.trim(),
      '--caste', caste.trim(),
      '--religions', religion,
      '--prefix', `admin${Date.now()}`,
    ];

    const maleCount = Math.max(0, parseInt(males, 10) || 0);
    const femaleCount = Math.max(0, parseInt(females, 10) || 0);

    if (maleCount > 0 || femaleCount > 0) {
      args.push('--males', String(maleCount), '--females', String(femaleCount));
    } else {
      const pg = Math.max(1, parseInt(perGender, 10) || 10);
      args.push('--per-gender', String(pg));
    }

    const proc = spawn(process.execPath, args, {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Seed generation timed out (15 min)'));
    }, 15 * 60 * 1000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ ok: true, stdout: stdout.slice(-4000), stderr });
      } else {
        reject(new Error(stderr || stdout || `Seed script exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
