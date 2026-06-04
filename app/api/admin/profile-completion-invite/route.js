import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createProfileCompletionInvite } from '@/lib/profileCompletionInvite.js';
import { sendProfileCompletionInviteEmail } from '@/lib/email.js';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const result = await createProfileCompletionInvite(userId, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  let emailSent = false;
  try {
    await sendProfileCompletionInviteEmail(result.email, result.name, result.completionUrl);
    emailSent = true;
  } catch (e) {
    console.error('[profile-completion-invite] email:', e.message);
  }

  return NextResponse.json({
    success: true,
    emailSent,
    completionUrl: result.completionUrl,
    expiresAt: result.expiresAt,
    message: emailSent
      ? `Completion link sent to ${result.email}`
      : `Link created but email failed — copy the link manually`,
  });
}
