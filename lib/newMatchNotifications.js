import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * Notify users whose religion/caste (and gender) match a newly approved profile.
 * Paid premium (isPremium=true) → full profile notification.
 * Free + free-trial users → upsell only, no profileId exposed.
 */
export async function notifyMatchingUsersOfNewProfile(newUserId) {
  const newProfile = await queryOne(
    `SELECT u.name, p.gender, p.religion, p.caste, p.gotra, p.city
     FROM \`user\` u
     JOIN profile p ON p.userId = u.id
     WHERE u.id = ? AND u.isActive = 1`,
    [newUserId]
  );

  if (!newProfile?.religion || !newProfile?.gender) return;

  const oppositeGender = newProfile.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const conditions = [
    'p.userId != ?',
    'u.isActive = 1',
    'u.adminVerified = 1',
    'p.gender = ?',
    'p.religion = ?',
  ];
  const params = [newUserId, oppositeGender, newProfile.religion];

  if (newProfile.religion.toLowerCase() === 'hindu' && newProfile.caste) {
    conditions.push('p.caste = ?');
    params.push(newProfile.caste);
  }

  if (newProfile.gotra?.trim()) {
    conditions.push("(p.gotra IS NULL OR p.gotra = '' OR p.gotra != ?)");
    params.push(newProfile.gotra.trim());
  }

  const matches = await query(
    `SELECT u.id AS userId, u.isPremium
     FROM profile p
     JOIN \`user\` u ON u.id = p.userId
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  if (!matches.length) return;

  const { sendPushToMobile } = await import('@/lib/fcm');
  const { sendPushToUser } = await import('@/lib/webpush');

  const criteriaLabel =
    newProfile.religion.toLowerCase() === 'hindu' && newProfile.caste
      ? `${newProfile.religion} / ${newProfile.caste}`
      : newProfile.religion;

  for (const match of matches) {
    try {
      const isPaidPremium = !!match.isPremium;

      if (isPaidPremium) {
        const title = '🎉 New Match Found!';
        const cityPart = newProfile.city ? ` from ${newProfile.city}` : '';
        const body = `${newProfile.name || 'Someone'}${cityPart} matches your ${criteriaLabel} criteria. View profile now.`;
        const url = `/profile/${newUserId}`;

        await execute(
          `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
           VALUES (?, ?, 'NEW_MATCH', ?, ?, 0, ?, NOW())`,
          [randomUUID(), match.userId, title, body, url]
        );

        await sendPushToMobile(match.userId, {
          title,
          body,
          data: {
            type: 'NEW_PROFILE',
            accessLevel: 'full',
            profileId: newUserId,
            profileName: newProfile.name || '',
            profileCity: newProfile.city || '',
            screen: 'profile',
          },
        });

        await sendPushToUser(match.userId, { title, body, url });
      } else {
        const title = '✨ New Match Available!';
        const body = `A new profile matching your ${criteriaLabel} criteria has joined. Subscribe to Premium to view full profile details.`;
        const url = '/premium?source=new_match';

        await execute(
          `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
           VALUES (?, ?, 'SYSTEM', ?, ?, 0, ?, NOW())`,
          [randomUUID(), match.userId, title, body, url]
        );

        await sendPushToMobile(match.userId, {
          title,
          body,
          data: {
            type: 'NEW_PROFILE',
            accessLevel: 'locked',
            screen: 'premium',
            reason: 'subscription_required',
          },
        });

        await sendPushToUser(match.userId, { title, body, url });
      }
    } catch (err) {
      console.error(`[NewMatch] notify user ${match.userId} failed:`, err.message);
    }
  }
}
