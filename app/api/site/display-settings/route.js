import { NextResponse } from 'next/server';
import { getShowPricingSection } from '@/lib/displaySettings';
import { getEarlyBirdGuestOffer } from '@/lib/earlyBird';

export async function GET() {
  try {
    const [showPricingSection, earlyBirdGuest] = await Promise.all([
      getShowPricingSection(),
      getEarlyBirdGuestOffer(),
    ]);
    return NextResponse.json({
      showPricingSection,
      earlyBirdGuest,
    });
  } catch (e) {
    console.error('[display-settings]', e.message);
    return NextResponse.json({
      showPricingSection: true,
      earlyBirdGuest: { show: false },
    });
  }
}
