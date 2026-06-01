import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPortalAccessForUser } from '@/lib/portalAccess';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ granted: false, authenticated: false }, { status: 401 });
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
