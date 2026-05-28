import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne } from '@/lib/db';
import { buildShareUrl, buildShareMessage } from '@/lib/profileMatchRules';

export async function GET(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { id } = await params;
  const profileId = id === 'me' ? decoded.id : id;

  const user = await queryOne(
    'SELECT id, name, isActive, adminVerified FROM `user` WHERE id = ?',
    [profileId]
  );
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const shareUrl = buildShareUrl(profileId);
  const shareText = buildShareMessage(user.name || 'Profile', profileId);

  return NextResponse.json({
    profileId,
    profileName: user.name,
    shareUrl,
    shareText,
    webUrl: shareUrl,
    deepLink: `vivahdwar://profile/${profileId}`,
  });
}
