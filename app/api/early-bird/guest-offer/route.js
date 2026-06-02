import { NextResponse } from 'next/server';
import { getEarlyBirdGuestOffer } from '@/lib/earlyBird';

export async function GET() {
  try {
    const offer = await getEarlyBirdGuestOffer();
    return NextResponse.json({ success: true, offer });
  } catch (e) {
    console.error('[early-bird/guest-offer]', e.message);
    return NextResponse.json({ success: false, offer: { show: false } }, { status: 500 });
  }
}
