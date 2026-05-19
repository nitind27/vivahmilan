import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const popupData = await getSiteConfig('marketing_popup');
  return NextResponse.json({ marketing_popup: popupData });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { key, value } = await req.json();
    if (!key || !value) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    await execute(
      `INSERT INTO siteconfig (\`id\`, \`key\`, \`value\`, \`updatedAt\`) 
       VALUES (UUID(), ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), \`updatedAt\` = NOW()`,
      [key, value]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Marketing save error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
