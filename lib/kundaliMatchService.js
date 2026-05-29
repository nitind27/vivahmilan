import { queryOne } from '@/lib/db.js';
import { computeKundaliMatch, parseKundaliRow } from '@/lib/kundaliMatch.js';

export async function fetchKundaliMatch(userId, partnerId) {
  if (!userId || !partnerId) {
    return { error: 'userId and partnerId required', status: 400 };
  }
  if (userId === partnerId) {
    return { error: 'Cannot match with yourself', status: 400 };
  }

  const [kundaliA, kundaliB, profileA, profileB, userA, userB] = await Promise.all([
    queryOne('SELECT * FROM kundali WHERE userId = ?', [userId]),
    queryOne('SELECT * FROM kundali WHERE userId = ?', [partnerId]),
    queryOne('SELECT gender FROM profile WHERE userId = ?', [userId]),
    queryOne('SELECT gender FROM profile WHERE userId = ?', [partnerId]),
    queryOne('SELECT name FROM `user` WHERE id = ?', [userId]),
    queryOne('SELECT name FROM `user` WHERE id = ?', [partnerId]),
  ]);

  if (!kundaliA) {
    return { error: 'Your kundali is not generated. Please generate it from profile edit.', status: 404, code: 'NO_SELF_KUNDALI' };
  }
  if (!kundaliB) {
    return { error: 'Partner kundali not available', status: 404, code: 'NO_PARTNER_KUNDALI' };
  }

  const match = computeKundaliMatch(
    parseKundaliRow(kundaliA),
    parseKundaliRow(kundaliB),
    profileA || {},
    profileB || {},
    userA?.name || 'You',
    userB?.name || 'Partner'
  );

  return { match, status: 200 };
}
