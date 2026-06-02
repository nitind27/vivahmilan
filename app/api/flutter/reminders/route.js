import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getUserEarlyBirdStatus } from '@/lib/earlyBird';

/** Sync dashboard reminders (premium expiry, birthday) — call on app home open */
export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const userId = decoded.id;
  const now = new Date();
  const created = [];

  const user = await queryOne(
    'SELECT isPremium, premiumExpiry, premiumPlan FROM `user` WHERE id = ?',
    [userId]
  );

  if (user?.isPremium && user?.premiumExpiry) {
    const expiry = new Date(user.premiumExpiry);
    const daysLeft = Math.ceil((expiry - now) / 86400000);

    if (daysLeft <= 2 && daysLeft >= 0) {
      const alreadySent = await queryOne(
        `SELECT id FROM notification WHERE userId = ? AND type = 'SUBSCRIPTION_EXPIRY'
         AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [userId]
      );

      if (!alreadySent) {
        const msg = daysLeft === 0
          ? 'Your Premium subscription expires today! Renew now to keep all benefits.'
          : `Your Premium subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew to keep chatting and accessing all features.`;

        await execute(
          `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
           VALUES (?, ?, 'SUBSCRIPTION_EXPIRY', 'Premium Expiring Soon', ?, 0, '/premium', NOW())`,
          [randomUUID(), userId, msg]
        );
        created.push('premium_expiry');
      }
    }
  }

  const profile = await queryOne('SELECT dob FROM profile WHERE userId = ?', [userId]);

  if (profile?.dob) {
    const dob = new Date(profile.dob);
    const isBirthday = dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();

    if (isBirthday) {
      const alreadySent = await queryOne(
        `SELECT id FROM notification WHERE userId = ? AND type = 'SYSTEM'
         AND title LIKE '%Birthday%' AND createdAt >= CURDATE()`,
        [userId]
      );

      if (!alreadySent) {
        await execute(
          `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
           VALUES (?, ?, 'SYSTEM', 'Happy Birthday!', ?, 0, '/dashboard', NOW())`,
          [randomUUID(), userId,
            'Wishing you a wonderful birthday! May this year bring you your perfect life partner.']
        );
        created.push('birthday');
      }
    }
  }

  const earlyBird = await getUserEarlyBirdStatus(userId);
  let premiumInfo = { isPremium: false };

  if (user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > now) {
    const daysLeft = Math.max(0, Math.ceil((new Date(user.premiumExpiry) - now) / 86400000));
    const totalDays = earlyBird?.totalDays || 30;
    premiumInfo = {
      isPremium: true,
      plan: user.premiumPlan,
      expiry: user.premiumExpiry,
      daysLeft,
      totalDays,
      isEarlyBird: !!earlyBird,
      earlyBirdLabel: earlyBird?.label || null,
      premiumPctLeft: Math.min(100, Math.round((daysLeft / totalDays) * 100)),
    };
  }

  let birthdayInfo = null;
  if (profile?.dob) {
    const dob = new Date(profile.dob);
    const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    const diffDays = Math.ceil((thisYearBday - now) / 86400000);
    const isBirthday = dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
    birthdayInfo = { isBirthday, daysUntil: isBirthday ? 0 : diffDays };
  }

  return NextResponse.json({ created, premiumInfo, birthdayInfo });
}
