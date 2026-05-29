import { queryOne, execute, query } from './db.js';
import { ensureFeatureTables } from './ensureFeatureTables.js';

function genCode(name) {
  const base = (name || 'VD').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'VD';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${base}${num}`;
}

export async function getOrCreateReferral(userId, userName) {
  await ensureFeatureTables();
  let row = await queryOne('SELECT * FROM userreferral WHERE userId = ?', [userId]);
  if (row) return row;

  let code = genCode(userName);
  for (let i = 0; i < 5; i++) {
    const exists = await queryOne('SELECT id FROM userreferral WHERE referralCode = ?', [code]);
    if (!exists) break;
    code = genCode(userName);
  }

  const id = crypto.randomUUID();
  await execute(
    'INSERT INTO userreferral (id, userId, referralCode, totalReferrals) VALUES (?, ?, ?, 0)',
    [id, userId, code]
  );
  return queryOne('SELECT * FROM userreferral WHERE userId = ?', [userId]);
}

export async function applyReferralCode(newUserId, code) {
  if (!code?.trim()) return null;
  await ensureFeatureTables();
  const ref = await queryOne(
    'SELECT * FROM userreferral WHERE referralCode = ?',
    [code.trim().toUpperCase()]
  );
  if (!ref || ref.userId === newUserId) return null;

  await getOrCreateReferral(newUserId);
  const mine = await queryOne('SELECT referredByUserId FROM userreferral WHERE userId = ?', [newUserId]);
  if (mine?.referredByUserId) return null;

  await execute('UPDATE userreferral SET referredByUserId = ? WHERE userId = ?', [ref.userId, newUserId]);
  await execute('UPDATE userreferral SET totalReferrals = totalReferrals + 1 WHERE userId = ?', [ref.userId]);
  return ref;
}

export async function getReferralStats(userId) {
  await ensureFeatureTables();
  const mine = await getOrCreateReferral(userId);
  const referred = await query(
    `SELECT u.id, u.name, u.createdAt, ph.url AS photo
     FROM userreferral ur
     JOIN \`user\` u ON u.id = ur.userId
     LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
     WHERE ur.referredByUserId = ?
     ORDER BY u.createdAt DESC LIMIT 50`,
    [userId]
  );
  return { ...mine, referredUsers: referred };
}
