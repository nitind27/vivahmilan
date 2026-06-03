import { query, queryOne } from './db.js';

/**
 * Build SQL conditions for profile search (shared by /api/search and saved-search alerts).
 */
export async function buildSearchQuery(userId, filters = {}) {
  const f = typeof filters === 'string' ? JSON.parse(filters || '{}') : filters;

  const currentUser = await queryOne(
    `SELECT p.religion, p.caste, p.gotra, p.gender FROM profile p WHERE p.userId = ?`,
    [userId]
  );

  const blocks = await query(
    'SELECT blockerId, blockedId FROM block WHERE blockerId = ? OR blockedId = ?',
    [userId, userId]
  );
  const blockedIds = blocks.map(b => (b.blockerId === userId ? b.blockedId : b.blockerId));

  const conditions = ['u.id != ?', 'u.isActive = 1', 'u.adminVerified = 1'];
  const params = [userId];

  if (f.verifiedOnly === '1' || f.verifiedOnly === true) {
    conditions.push('u.verificationBadge = 1');
  }

  if (blockedIds.length) {
    conditions.push(`u.id NOT IN (${blockedIds.map(() => '?').join(',')})`);
    params.push(...blockedIds);
  }

  const myGender = currentUser?.gender;
  if (myGender) {
    conditions.push('p.gender = ?');
    params.push(myGender.toUpperCase() === 'MALE' ? 'FEMALE' : 'MALE');
  } else if (f.gender) {
    conditions.push('p.gender = ?');
    params.push(f.gender);
  }

  const myReligion = currentUser?.religion;
  const myGotra = currentUser?.gotra;

  if (myReligion) {
    conditions.push('p.religion = ?');
    params.push(myReligion);
  } else if (f.religion) {
    conditions.push('p.religion = ?');
    params.push(f.religion);
  }

  if (myGotra?.trim()) {
    conditions.push('(p.gotra IS NULL OR p.gotra = \'\' OR p.gotra != ?)');
    params.push(myGotra.trim());
  }

  if (f.q) {
    conditions.push('(u.name LIKE ? OR p.city LIKE ? OR p.profession LIKE ? OR p.country LIKE ?)');
    params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`, `%${f.q}%`);
  }

  if (f.country) { conditions.push('p.country = ?'); params.push(f.country); }
  if (f.state) { conditions.push('p.state LIKE ?'); params.push(`%${f.state}%`); }
  if (f.city) { conditions.push('p.city LIKE ?'); params.push(`%${f.city}%`); }
  if (f.education) { conditions.push('p.education = ?'); params.push(f.education); }
  if (f.profession) { conditions.push('p.profession LIKE ?'); params.push(`%${f.profession}%`); }
  if (f.maritalStatus) { conditions.push('p.maritalStatus = ?'); params.push(f.maritalStatus); }
  if (f.heightMin) { conditions.push('p.height >= ?'); params.push(parseInt(f.heightMin, 10)); }
  if (f.heightMax) { conditions.push('p.height <= ?'); params.push(parseInt(f.heightMax, 10)); }

  const now = new Date();
  if (f.ageMin) {
    const dobMax = new Date(now.getFullYear() - parseInt(f.ageMin, 10), now.getMonth(), now.getDate());
    conditions.push('p.dob <= ?');
    params.push(dobMax);
  }
  if (f.ageMax) {
    const dobMin = new Date(now.getFullYear() - parseInt(f.ageMax, 10), now.getMonth(), now.getDate());
    conditions.push('p.dob >= ?');
    params.push(dobMin);
  }

  const kundaliJoin = (f.rashi || f.nakshatra || f.manglik || f.hasKundali === '1' || f.hasKundali === true)
    ? ' LEFT JOIN kundali k ON k.userId = u.id'
    : '';

  if (f.hasKundali === '1' || f.hasKundali === true) conditions.push('k.userId IS NOT NULL');
  if (f.rashi) { conditions.push('k.rashi = ?'); params.push(f.rashi); }
  if (f.nakshatra) { conditions.push('k.nakshatra = ?'); params.push(f.nakshatra); }
  if (f.manglik === '1') conditions.push('k.manglik = 1');
  else if (f.manglik === '0') conditions.push('(k.manglik = 0 OR k.manglik IS NULL)');

  return {
    conditions,
    params,
    kundaliJoin,
    where: 'WHERE ' + conditions.join(' AND '),
    baseSQL: (extraConditions = [], extraParams = []) => {
      const allConds = [...conditions, ...extraConditions];
      const allParams = [...params, ...extraParams];
      return {
        sql: `FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id${kundaliJoin} WHERE ${allConds.join(' AND ')}`,
        params: allParams,
      };
    },
  };
}
