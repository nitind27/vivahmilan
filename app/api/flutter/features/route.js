import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getUserAccessSummary } from '@/lib/planPermissions.js';
import { INTEREST_TEMPLATES } from '@/lib/interestTemplates.js';

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const access = await getUserAccessSummary(decoded.id);
    return NextResponse.json({
      access,
      interestTemplates: INTEREST_TEMPLATES,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
