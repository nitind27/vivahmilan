import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { signToken } from '@/lib/flutter-jwt';
import { recordLoginGeo } from '@/lib/geoTracking';
import { getPortalAccessForUser } from '@/lib/portalAccess';

// Required fields for profile to be considered complete
const REQUIRED_FIELDS = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

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

    // ── Profile completion check (only for non-admin users) ──────────────
    if (user.role !== 'ADMIN') {
      const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [user.id]);

      const missingFields = REQUIRED_FIELDS.filter(f => !profile?.[f]);

      if (missingFields.length > 0) {
        // Issue a limited token so Flutter can call PUT /api/flutter/profile
        const token = signToken({
          id: user.id,
          email: user.email,
          role: user.role,
          isPremium: !!user.isPremium,
        });

        return NextResponse.json({
          error: 'Profile incomplete. Please complete your profile to continue.',
          code: 'PROFILE_INCOMPLETE',
          token,
          userId: user.id,
          missingFields,
          profileComplete: profile?.profileComplete || 0,
          requiredFields: REQUIRED_FIELDS,
        }, { status: 403 });
      }

      // Profile complete but not yet sent for admin review — mark as pending
      if (!user.adminVerified) {
        return NextResponse.json({
          error: 'Your profile is pending admin approval. You will be notified via email.',
          code: 'PENDING_APPROVAL',
        }, { status: 403 });
      }
    }

    const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
    const portalAccess = await getPortalAccessForUser({ email: user.email, role: user.role });

    recordLoginGeo(user.id, req, body).catch(e =>
      console.error('[flutter login] geo log error:', e.message)
    );

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isPremium: !!user.isPremium,
    });

    return NextResponse.json({
      success: true,
      token,
      portalAccess: portalAccess.granted,
      portalClosed: !portalAccess.granted,
      launchMessage: portalAccess.granted ? null : portalAccess.message,
      contact: portalAccess.granted ? null : portalAccess.contact,
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
