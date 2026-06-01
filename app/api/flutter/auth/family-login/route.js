import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { signToken } from '@/lib/flutter-jwt';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { recordLoginGeo } from '@/lib/geoTracking';
import { getPortalAccessForUser } from '@/lib/portalAccess';

/** POST /api/flutter/auth/family-login — read-only browse for family members */
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    await ensureFeatureTables();
    const fa = await queryOne(
      'SELECT * FROM familyaccess WHERE email = ? AND isActive = 1',
      [email.trim().toLowerCase()]
    );
    if (!fa) {
      return NextResponse.json({ error: 'Invalid family login credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, fa.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid family login credentials' }, { status: 401 });
    }

    const owner = await queryOne(
      `SELECT id, name, email, role, isActive, isPremium, premiumPlan, isVerified,
              adminVerified, freeTrialExpiry, verificationBadge
       FROM \`user\` WHERE id = ?`,
      [fa.ownerUserId]
    );
    if (!owner?.isActive) {
      return NextResponse.json({ error: 'Profile owner account is not active' }, { status: 403 });
    }

    const trialActive = owner.freeTrialExpiry && new Date(owner.freeTrialExpiry) > new Date();
    const portalAccess = await getPortalAccessForUser({ email: fa.email, role: 'FAMILY' });

    recordLoginGeo(owner.id, req, { email: fa.email }).catch(() => {});

    const token = signToken({
      id: owner.id,
      email: fa.email,
      role: 'FAMILY',
      isPremium: !!owner.isPremium,
      familyAccessId: fa.id,
      memberName: fa.memberName,
      relationship: fa.relationship || 'Family',
      ownerName: owner.name,
    });

    return NextResponse.json({
      success: true,
      token,
      portalAccess: portalAccess.granted,
      portalClosed: !portalAccess.granted,
      launchMessage: portalAccess.granted ? null : portalAccess.message,
      contact: portalAccess.granted ? null : portalAccess.contact,
      user: {
        id: owner.id,
        name: `${fa.memberName} (${fa.relationship || 'Family'})`,
        email: fa.email,
        role: 'FAMILY',
        isFamilyLogin: true,
        familyAccessId: fa.id,
        memberName: fa.memberName,
        relationship: fa.relationship || 'Family',
        ownerName: owner.name,
        ownerId: owner.id,
        isPremium: !!owner.isPremium,
        premiumPlan: owner.premiumPlan || null,
        adminVerified: !!owner.adminVerified,
        verificationBadge: !!owner.verificationBadge,
        freeTrialActive: !!trialActive,
        freeTrialExpiry: owner.freeTrialExpiry || null,
      },
    });
  } catch (err) {
    console.error('Flutter family-login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
