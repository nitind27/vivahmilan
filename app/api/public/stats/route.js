import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const revalidate = 300; // cache 5 minutes

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10_000_000) return { value: Math.floor(num / 1_000_000), suffix: 'M+' };
  if (num >= 100_000) return { value: Math.floor(num / 100_000), suffix: 'L+' };
  if (num >= 1_000) return { value: Math.floor(num / 1_000), suffix: 'K+' };
  return { value: num, suffix: num > 0 ? '+' : '' };
}

export async function GET() {
  try {
    const row = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM \`user\` WHERE role = 'USER') AS members,
        (SELECT COUNT(DISTINCT country) FROM profile WHERE country IS NOT NULL AND country != '') AS countries,
        (SELECT COUNT(*) FROM successstory WHERE isActive = 1) AS happyCouples,
        (SELECT COUNT(*) FROM \`user\` WHERE role = 'USER' AND adminVerified = 1) AS verifiedMembers
    `);

    const members = Number(row?.members ?? 0);
    const countries = Number(row?.countries ?? 0);
    const happyCouples = Number(row?.happyCouples ?? 0);
    const verifiedMembers = Number(row?.verifiedMembers ?? 0);
    const successRate = members > 0 ? Math.min(100, Math.round((verifiedMembers / members) * 100)) : 0;

    const membersFmt = formatCount(members);
    const couplesFmt = formatCount(happyCouples);

    return NextResponse.json({
      members,
      countries,
      happyCouples,
      successRate,
      stats: [
        { icon: 'Users', label: 'Members', ...membersFmt, raw: members },
        { icon: 'Heart', label: 'Happy Couples', ...couplesFmt, raw: happyCouples },
        { icon: 'Globe', label: 'Countries', value: countries, suffix: '+', raw: countries },
        { icon: 'Award', label: 'Verified Profiles', value: successRate, suffix: '%', raw: successRate },
      ],
    });
  } catch (err) {
    console.error('Public stats error:', err.message);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
