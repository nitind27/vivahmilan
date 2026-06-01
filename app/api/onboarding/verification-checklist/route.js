import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserSubmitChecklist } from '@/lib/profileVerification';

/** GET /api/onboarding/verification-checklist?email=... — web onboarding submit gate */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const result = await getUserSubmitChecklist(user.id);
  return NextResponse.json(result);
}
