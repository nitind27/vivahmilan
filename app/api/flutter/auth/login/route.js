import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { signToken } from '@/lib/flutter-jwt';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });

    const user = await queryOne(
      `SELECT id, name, email, phone, password, role, isActive, isPremium, premiumPlan,
              adminVerified, emailVerified, freeTrialExpiry, verificationBadge
       FROM \`user\` WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!user)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (!user.password)
      return NextResponse.json({ error: 'This account uses Google login. Please login with Google.' }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (!user.isActive)
      return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });

    if (!user.emailVerified)
      return NextResponse.json({
        error: 'Email not verified. Please verify your email first.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      }, { status: 403 });

    if (user.role !== 'ADMIN' && !user.adminVerified)
      return NextResponse.json({
        error: 'Your profile is pending admin approval. You will be notified via email.',
        code: 'PENDING_APPROVAL',
      }, { status: 403 });

    const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: !!user.isPremium,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        isPremium: !!user.isPremium,
        premiumPlan: user.premiumPlan || null,
        adminVerified: !!user.adminVerified,
        verificationBadge: !!user.verificationBadge,
        freeTrialActive: !!trialActive,
        freeTrialExpiry: user.freeTrialExpiry || null,
      },
    });

  } catch (err) {
    console.error('Flutter login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
