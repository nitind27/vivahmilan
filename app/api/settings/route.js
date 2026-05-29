import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const [user, profile, prefs, access] = await Promise.all([
    queryOne('SELECT id, name, email, phone, phoneVerified, isPremium, premiumPlan, profileBoost, boostExpiry FROM `user` WHERE id = ?', [uid]),
    queryOne('SELECT hidePhone, hidePhoto, profileComplete FROM profile WHERE userId = ?', [uid]),
    getPrefs(uid),
    getUserAccessSummary(uid),
  ]);

  return NextResponse.json({
    user: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      phoneVerified: !!user?.phoneVerified,
      isPremium: !!user?.isPremium,
      premiumPlan: user?.premiumPlan,
      profileBoost: !!user?.profileBoost,
      boostExpiry: user?.boostExpiry,
    },
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
    subscription: {
      autoRenew: !!prefs?.autoRenew,
    },
    profileComplete: profile?.profileComplete ?? 0,
    access,
  });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role === 'FAMILY') {
    return NextResponse.json({ error: 'Family login cannot change settings' }, { status: 403 });
  }

  const uid = session.user.id;
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

  if (body.subscription && body.subscription.autoRenew != null) {
    await execute('UPDATE userpreference SET autoRenew = ?, updatedAt = NOW() WHERE userId = ?', [body.subscription.autoRenew ? 1 : 0, uid]);
  }

  if (body.referralCode) {
    await applyReferralCode(uid, body.referralCode);
  }

  if (body.deactivate === true) {
    await execute('UPDATE `user` SET isActive = 0 WHERE id = ?', [uid]);
    return NextResponse.json({ success: true, deactivated: true });
  }

  return NextResponse.json({ success: true });
}
