import { NextResponse } from 'next/server';
import { getSocialLinks } from '@/lib/socialLinks';

/** Public: social media URLs for footer / Connect with us section */
export async function GET() {
  const links = await getSocialLinks();
  return NextResponse.json(links);
}
