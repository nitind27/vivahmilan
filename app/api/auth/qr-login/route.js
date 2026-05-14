import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db';

// POST /api/auth/qr-login — web browser exchanges QR token for user credentials
// This is called internally by the NextAuth credentials provider
export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    if (!decoded.qrLogin) {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
    }

    // Return user data for NextAuth to create session
    const user = await queryOne(
      `SELECT id, email, name, role, isActive, isPremium, premiumPlan, isVerified, adminVerified, freeTrialExpiry 
       FROM \`user\` WHERE id = ?`,
      [decoded.id]
    );

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or suspended' }, { status: 403 });
    }

    const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isPremium: !!user.isPremium,
      premiumPlan: user.premiumPlan || null,
      freeTrialActive: !!trialActive,
      freeTrialExpiry: user.freeTrialExpiry ? user.freeTrialExpiry.toISOString() : null,
      isVerified: !!user.isVerified,
      adminVerified: !!user.adminVerified,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'QR token expired' }, { status: 410 });
    }
    console.error('QR login error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
