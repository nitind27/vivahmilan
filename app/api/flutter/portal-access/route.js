import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getPortalAccessForUser } from '@/lib/portalAccess';

export async function GET(req) {
  const raw = getTokenFromRequest(req);
  if (!raw) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
  }

  const decoded = verifyToken(raw);
  if (!decoded?.email) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const access = await getPortalAccessForUser({
    email: decoded.email,
    role: decoded.role,
  });

  return NextResponse.json({
    granted: access.granted,
    reason: access.reason,
    portalAccess: access.granted,
    message: access.message || null,
    contact: access.contact || null,
    userId: decoded.id,
  });
}
