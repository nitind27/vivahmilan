import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/db';
import { buildShareUrl, buildShareMessage } from '@/lib/profileMatchRules';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const user = await queryOne(
    'SELECT id, name, isActive, adminVerified FROM `user` WHERE id = ?',
    [id]
  );
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const shareUrl = buildShareUrl(id);
  const shareText = buildShareMessage(user.name || 'Profile', id);

  return NextResponse.json({
    profileId: id,
    profileName: user.name,
    shareUrl,
    shareText,
    webUrl: shareUrl,
    deepLink: `vivahdwar://profile/${id}`,
  });
}
