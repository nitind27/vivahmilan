import { NextResponse } from 'next/server';
import {
  validateCompletionToken,
  verifyCompletionEmail,
  maskEmail,
} from '@/lib/profileCompletionInvite.js';

export async function GET(req, { params }) {
  const { token } = await params;
  try {
    const check = await validateCompletionToken(token);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status || 400 });
    }

    const { session } = check;
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';
    const onboardingUrl =
      session.status === 'ACTIVE'
        ? `${base}/onboarding?email=${encodeURIComponent(session.email)}&completionToken=${token}`
        : null;

    return NextResponse.json({
      userName: session.userName,
      maskedEmail: maskEmail(session.email),
      status: session.status,
      expiresAt: session.expiresAt,
      emailVerified: session.status === 'ACTIVE',
      onboardingUrl,
    });
  } catch (err) {
    console.error('[profile-complete GET]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { token } = await params;
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await verifyCompletionEmail(token, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      onboardingUrl: result.onboardingUrl,
      email: result.email,
    });
  } catch (err) {
    console.error('[profile-complete POST]', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
