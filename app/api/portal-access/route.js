import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPortalAccessForUser } from '@/lib/portalAccess';
import { queryOne } from '@/lib/db';
import { buildCorrectionOnboardingUrl } from '@/lib/profileCorrection.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ granted: false, authenticated: false }, { status: 401 });
  }

  const correctionRow = await queryOne(
    `SELECT profileCorrectionRequired, profileCorrectionToken, email
     FROM \`user\` WHERE email = ?`,
    [session.user.email]
  );

  if (correctionRow?.profileCorrectionRequired) {
    const correctionUrl = buildCorrectionOnboardingUrl(
      correctionRow.email,
      correctionRow.profileCorrectionToken
    );
    return NextResponse.json({
      authenticated: true,
      granted: false,
      reason: 'profile_correction',
      needsProfileCorrection: true,
      correctionUrl,
      role: session.user.role,
      name: session.user.name || null,
    });
  }

  const access = await getPortalAccessForUser({
    email: session.user.email,
    role: session.user.role,
  });

  return NextResponse.json({
    authenticated: true,
    granted: access.granted,
    reason: access.reason,
    message: access.message || null,
    contact: access.contact || null,
    role: session.user.role,
    name: session.user.name || null,
  });
}
