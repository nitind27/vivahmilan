import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getPortalAccessForUser } from '@/lib/portalAccess';

/** Authenticate Flutter JWT and optionally enforce portal access gate. */
export async function authenticateFlutterRequest(req, { requirePortal = true } = {}) {
  const raw = getTokenFromRequest(req);
  if (!raw) {
    return {
      error: NextResponse.json({ error: 'Authorization required' }, { status: 401 }),
    };
  }

  const decoded = verifyToken(raw);
  if (!decoded?.id) {
    return {
      error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
    };
  }

  if (requirePortal && decoded.role !== 'ADMIN') {
    const access = await getPortalAccessForUser({
      email: decoded.email,
      role: decoded.role,
    });
    if (!access.granted) {
      return {
        error: NextResponse.json(
          {
            error: 'Your profile will be available soon. Please wait for our update.',
            code: 'PORTAL_CLOSED',
            portalAccess: false,
            message: access.message,
            contact: access.contact,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { user: decoded };
}
