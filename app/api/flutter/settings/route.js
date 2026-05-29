import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { getUserAccessSummary } from '@/lib/planPermissions.js';
import { applyReferralCode } from '@/lib/referral.js';

async function getPrefs(userId) {
  await ensureFeatureTables();
  let prefs = await queryOne('SELECT * FROM userpreference WHERE userId = ?', [userId]);
  if (!prefs) {
    await execute('INSERT INTO userpreference (userId) VALUES (?)', [userId]);
    prefs = await queryOne('SELECT * FROM userpreference WHERE userId = ?', [userId]);
  }
  return prefs;
}

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const uid = decoded.id;
    const [user, profile, prefs, access] = await Promise.all([
      queryOne('SELECT name, email, phone, phoneVerified, isPremium, premiumPlan, profileBoost, boostExpiry FROM `user` WHERE id = ?', [uid]),
      queryOne('SELECT hidePhone, hidePhoto, profileComplete FROM profile WHERE userId = ?', [uid]),
      getPrefs(uid),
      getUserAccessSummary(uid),
    ]);

    return NextResponse.json({
      user,
      privacy: {
        hidePhone: !!profile?.hidePhone,
        hidePhoto: !!profile?.hidePhoto,
        profileVisible: !!prefs?.profileVisible,
        showOnlineStatus: !!prefs?.showOnlineStatus,
      },
      notifications: {
        notifyInterest: !!prefs?.notifyInterest,
        notifyMessage: !!prefs?.notifyMessage,
        notifyProfileView: !!prefs?.notifyProfileView,
        notifyMarketing: !!prefs?.notifyMarketing,
      },
      profileComplete: profile?.profileComplete ?? 0,
      access,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const uid = decoded.id;
    const body = await req.json();
    await ensureFeatureTables();
    await getPrefs(uid);

    if (body.privacy) {
      const { hidePhone, hidePhoto, profileVisible, showOnlineStatus } = body.privacy;
      if (hidePhone != null || hidePhoto != null) {
        const sets = [];
        const vals = [];
        if (hidePhone != null) { sets.push('hidePhone = ?'); vals.push(hidePhone ? 1 : 0); }
        if (hidePhoto != null) { sets.push('hidePhoto = ?'); vals.push(hidePhoto ? 1 : 0); }
        if (sets.length) await execute(`UPDATE profile SET ${sets.join(', ')} WHERE userId = ?`, [...vals, uid]);
      }
      const pSets = [];
      const pVals = [];
      if (profileVisible != null) { pSets.push('profileVisible = ?'); pVals.push(profileVisible ? 1 : 0); }
      if (showOnlineStatus != null) { pSets.push('showOnlineStatus = ?'); pVals.push(showOnlineStatus ? 1 : 0); }
      if (pSets.length) await execute(`UPDATE userpreference SET ${pSets.join(', ')}, updatedAt = NOW() WHERE userId = ?`, [...pVals, uid]);
    }

    if (body.notifications) {
      const n = body.notifications;
      const sets = [];
      const vals = [];
      for (const key of ['notifyInterest', 'notifyMessage', 'notifyProfileView', 'notifyMarketing']) {
        if (n[key] != null) { sets.push(`${key} = ?`); vals.push(n[key] ? 1 : 0); }
      }
      if (sets.length) await execute(`UPDATE userpreference SET ${sets.join(', ')}, updatedAt = NOW() WHERE userId = ?`, [...vals, uid]);
    }

    if (body.referralCode) await applyReferralCode(uid, body.referralCode);
    if (body.deactivate === true) {
      await execute('UPDATE `user` SET isActive = 0 WHERE id = ?', [uid]);
      return NextResponse.json({ success: true, deactivated: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
