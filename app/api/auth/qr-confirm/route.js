import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute, queryOne } from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import jwt from 'jsonwebtoken';

// Resolve userId from either:
//   1. Flutter mobile app → Bearer token in Authorization header (flutter-jwt)
//   2. Web browser → NextAuth session cookie
async function resolveUserId(req) {
  // Try Bearer token first (mobile app)
  const bearerToken = getTokenFromRequest(req);
  if (bearerToken) {
    const decoded = verifyToken(bearerToken);
    if (decoded?.id) return decoded.id;
    return null; // token present but invalid
  }

  // Fall back to NextAuth session (web browser)
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

// POST /api/auth/qr-confirm — mobile confirms the QR login
export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Authenticate the caller
    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check QR session
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

    // Fetch fresh user from DB
    const user = await queryOne(
      `SELECT id, email, name, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry 
       FROM \`user\` WHERE id = ?`,
      [userId]
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.isActive) return NextResponse.json({ error: 'Account suspended' }, { status: 403 });

    // Generate short-lived web login token (60s) for the browser to use
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

// PATCH /api/auth/qr-confirm — mark QR as scanned (called right after scan)
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    // Auth check (same dual approach)
    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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
