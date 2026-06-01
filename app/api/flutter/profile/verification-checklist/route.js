import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getUserSubmitChecklist } from '@/lib/profileVerification';

/**
 * GET /api/flutter/profile/verification-checklist
 * Returns submit checklist for onboarding UI.
 * Flutter: keep Submit disabled until canSubmit === true.
 */
export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const result = await getUserSubmitChecklist(decoded.id);

  return NextResponse.json(result);
}
