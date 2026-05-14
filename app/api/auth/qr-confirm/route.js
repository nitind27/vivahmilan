import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute, queryOne } from '@/lib/db';
import jwt from 'jsonwebtoken';

// POST /api/auth/qr-confirm — called from mobile app after scanning QR
// Body: { sessionId, token } where token is the mobile user's JWT/session token
// OR if user is already logged in via NextAuth session, we use that
export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, mobileToken } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Check session exists and is pending/scanned
    const qrSession = await queryOne(
      `SELECT id, status, expiresAt FROM qr_sessions WHERE id = ?`,
      [sessionId]
    );

    if (!qrSession) {
      return NextResponse.json({ error: 'QR session not found' }, { status: 404 });
    }
    if (new Date(qrSession.expiresAt) < new Date()) {
      await execute(`UPDATE qr_sessions SET status='expired' WHERE id=?`, [sessionId]);
      return NextResponse.json({ error: 'QR session expired' }, { status: 410 });
    }
    if (qrSession.status === 'confirmed') {
      return NextResponse.json({ error: 'Already confirmed' }, { status: 409 });
    }

    // Verify the mobile token and get user info
    let userId, userEmail, userName, userRole, isPremium, isVerified, adminVerified;

    if (mobileToken) {
      // Mobile app sends its own JWT token
      try {
        const decoded = jwt.verify(mobileToken, process.env.NEXTAUTH_SECRET);
        userId = decoded.id || decoded.sub;
        userEmail = decoded.email;
        userName = decoded.name;
        userRole = decoded.role;
        isPremium = decoded.isPremium;
        isVerified = decoded.isVerified;
        adminVerified = decoded.adminVerified;
      } catch {
        return NextResponse.json({ error: 'Invalid mobile token' }, { status: 401 });
      }
    } else {
      // Web session (user is logged in on mobile browser)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      userId = session.user.id;
      userEmail = session.user.email;
      userName = session.user.name;
      userRole = session.user.role;
      isPremium = session.user.isPremium;
      isVerified = session.user.isVerified;
      adminVerified = session.user.adminVerified;
    }

    // Fetch fresh user data from DB
    const user = await queryOne(
      `SELECT id, email, name, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry 
       FROM \`user\` WHERE id = ?`,
      [userId]
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.isActive) return NextResponse.json({ error: 'Account suspended' }, { status: 403 });

    // Generate a short-lived web login token (60 seconds to use it)
    const webToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: !!user.isPremium,
        premiumPlan: user.premiumPlan || null,
        isVerified: !!user.isVerified,
        adminVerified: !!user.adminVerified,
        freeTrialExpiry: user.freeTrialExpiry ? user.freeTrialExpiry.toISOString() : null,
        qrLogin: true,
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '60s' }
    );

    // Mark session as confirmed with the token
    await execute(
      `UPDATE qr_sessions SET status='confirmed', userId=?, token=? WHERE id=?`,
      [user.id, webToken, sessionId]
    );

    return NextResponse.json({ success: true, message: 'Login confirmed' });
  } catch (err) {
    console.error('QR confirm error:', err);
    return NextResponse.json({ error: 'Failed to confirm QR session' }, { status: 500 });
  }
}

// PATCH /api/auth/qr-confirm — mark as scanned (first scan step)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const qrSession = await queryOne(
      `SELECT id, status, expiresAt FROM qr_sessions WHERE id = ?`,
      [sessionId]
    );
    if (!qrSession) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (new Date(qrSession.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Expired' }, { status: 410 });
    }

    await execute(`UPDATE qr_sessions SET status='scanned' WHERE id=? AND status='pending'`, [sessionId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('QR scan mark error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
