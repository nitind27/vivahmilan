import { NextResponse } from 'next/server';
import { getUserSubmitChecklist } from '@/lib/profileVerification';
import { resolveOnboardingUser } from '@/lib/onboardingAccess.js';

/** GET /api/onboarding/verification-checklist?email=... — web onboarding submit gate */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const completionToken = searchParams.get('completionToken');

  const access = await resolveOnboardingUser({ email, completionToken });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status || 403 });
  }

  const result = await getUserSubmitChecklist(access.user.id);
  return NextResponse.json(result);
}
