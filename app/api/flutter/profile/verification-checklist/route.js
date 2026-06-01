import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getApprovalChecklist, REQUIRED_PROFILE_FIELDS } from '@/lib/profileVerification';

/**
 * GET /api/flutter/profile/verification-checklist
 * Returns submit/approval checklist for onboarding UI.
 */
export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const result = await getApprovalChecklist(decoded.id);

  return NextResponse.json({
    eligible: result.eligible,
    checklist: result.checklist,
    errors: result.errors,
    missingFields: result.missingFields,
    requiredFields: REQUIRED_PROFILE_FIELDS,
  });
}
