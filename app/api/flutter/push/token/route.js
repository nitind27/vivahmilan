import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const authToken = getTokenFromRequest(req);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const decoded = verifyToken(authToken);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    // Check if this exact token already exists (to avoid duplicate entries for the same device)
    const existing = await queryOne('SELECT id, userId FROM fcm_token WHERE token = ?', [token]);
    
    if (existing) {
      // If the token is registered to a different user, update the userId to the current user
      if (existing.userId !== decoded.id) {
        await execute('UPDATE fcm_token SET userId = ? WHERE id = ?', [decoded.id, existing.id]);
      }
      return NextResponse.json({ success: true, message: 'Token already registered' });
    }

    // Insert new FCM token
    const tokenId = randomUUID();
    await execute(
      'INSERT INTO fcm_token (id, userId, token, createdAt) VALUES (?, ?, ?, NOW())',
      [tokenId, decoded.id, token]
    );

    return NextResponse.json({ success: true, message: 'FCM token registered successfully' }, { status: 201 });
  } catch (err) {
    console.error('FCM token registration error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
