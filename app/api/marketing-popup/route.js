import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/siteconfig';

export async function GET() {
  try {
    const popupData = await getSiteConfig('marketing_popup');
    if (!popupData) return NextResponse.json({ enabled: false });
    
    return NextResponse.json(JSON.parse(popupData));
  } catch (error) {
    return NextResponse.json({ enabled: false });
  }
}
