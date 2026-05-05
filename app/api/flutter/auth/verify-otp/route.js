import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { signToken } from '@/lib/flutter-jwt';

const REQUIRED_FIELDS = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];

export async function POST(req) {
  try {
    const { email, otp, type = 'EMAIL_VERIFY' } = await req.json();

    if (!email || !otp)
      return NextResponse.json({ error: 'email and otp are required' }, { status: 400 });

    const user = await queryOne(
      'SELECT id, name, email, role, isActive, isPremium, premiumPlan, adminVerified, freeTrialExpiry FROM `user` WHERE email = ?',
      [email]
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const record = await queryOne(
      'SELECT id, code, expiresAt FROM otp WHERE userId = ? AND type = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
      [user.id, type]
    );

    if (!record)
      return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
    if (new Date() > new Date(record.expiresAt))
      return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
    if (record.code !== String(otp))
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

    // Mark OTP used
    await execute('UPDATE otp SET used = 1 WHERE id = ?', [record.id]);

    if (type === 'EMAIL_VERIFY') {
      await execute('UPDATE `user` SET emailVerified = NOW(), updatedAt = NOW() WHERE id = ?', [user.id]);
    }

    // Issue JWT token after email verify
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: !!user.isPremium,
    });

    // Check profile completion for non-admin users
    let profileIncomplete = false;
    let missingFields = [];
    let profileComplete = 0;

    if (user.role !== 'ADMIN' && type === 'EMAIL_VERIFY') {
      const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [user.id]);
      missingFields = REQUIRED_FIELDS.filter(f => !profile?.[f]);
      profileComplete = profile?.profileComplete || 0;
      profileIncomplete = missingFields.length > 0;
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: !!user.isPremium,
        premiumPlan: user.premiumPlan || null,
        adminVerified: !!user.adminVerified,
      },
      profileIncomplete,
      missingFields,
      profileComplete,
      requiredFields: REQUIRED_FIELDS,
    });

  } catch (err) {
    console.error('Flutter verify-otp error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
