import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { queryOne, execute } from '@/lib/db';
import { signToken } from '@/lib/flutter-jwt';
import { randomUUID } from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const REQUIRED_FIELDS = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];

export async function POST(req) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      console.error('Google token verification failed:', err);
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Google token does not contain an email' }, { status: 400 });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || 'User';
    const picture = payload.picture || null;

    let user = await queryOne(
      `SELECT id, name, email, phone, password, role, isActive, isPremium, premiumPlan,
              adminVerified, emailVerified, freeTrialExpiry, verificationBadge
       FROM \`user\` WHERE email = ?`,
      [email]
    );

    if (!user) {
      // Create new user
      const newUserId = randomUUID();
      await execute(
        `INSERT INTO \`user\` (id, name, email, emailVerified, isActive, role, createdAt)
         VALUES (?, ?, ?, 1, 1, 'USER', NOW())`,
        [newUserId, name, email]
      );
      
      // Initialize empty profile
      await execute('INSERT INTO profile (id, userId) VALUES (?, ?)', [randomUUID(), newUserId]);

      if (picture) {
        // Save google photo as main photo
        await execute(
          'INSERT INTO photo (id, userId, url, isMain, createdAt) VALUES (?, ?, ?, 1, NOW())',
          [randomUUID(), newUserId, picture]
        );
        await execute('UPDATE \`user\` SET image = ? WHERE id = ?', [picture, newUserId]);
      }

      // Re-fetch the newly created user
      user = await queryOne(
        `SELECT id, name, email, phone, password, role, isActive, isPremium, premiumPlan,
                adminVerified, emailVerified, freeTrialExpiry, verificationBadge
         FROM \`user\` WHERE id = ?`,
        [newUserId]
      );
    } else {
      if (!user.isActive) {
        return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });
      }
      if (!user.emailVerified) {
        // Since they logged in with Google, we can automatically mark email as verified
        await execute('UPDATE \`user\` SET emailVerified = 1 WHERE id = ?', [user.id]);
        user.emailVerified = 1;
      }
    }

    // ── Profile completion check (only for non-admin users) ──────────────
    if (user.role !== 'ADMIN') {
      const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [user.id]);
      const missingFields = REQUIRED_FIELDS.filter(f => !profile?.[f]);

      if (missingFields.length > 0) {
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

      // Profile complete but not yet sent for admin review
      if (!user.adminVerified) {
        return NextResponse.json({
          error: 'Your profile is pending admin approval. You will be notified via email.',
          code: 'PENDING_APPROVAL',
        }, { status: 403 });
      }
    }

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
    console.error('Flutter Google login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
