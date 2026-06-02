import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getEarlyBirdOfferForUser, shouldShowEarlyBirdPopup } from '@/lib/earlyBird';

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    const userId = decoded?.id || null;
    const offer = await getEarlyBirdOfferForUser(userId);
    const showPopup = userId ? await shouldShowEarlyBirdPopup(userId) : false;
    return NextResponse.json({ success: true, offer, showPopup });
  } catch (err) {
    console.error('[flutter/early-bird/status]', err);
    return NextResponse.json({ error: 'Failed to load offer' }, { status: 500 });
  }
}
