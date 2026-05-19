import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const subs = await query(`
      SELECT s.*, 
             u.name as userName, 
             u.email as userEmail, 
             u.phone as userPhone, 
             u.image as userImage
      FROM subscription s
      LEFT JOIN \`user\` u ON s.userId = u.id
      ORDER BY s.createdAt DESC
      LIMIT 100
    `);

    // Format to match expected frontend structure: { ..., user: { name, email, phone, image } }
    const formattedSubs = subs.map(s => ({
      ...s,
      user: {
        name: s.userName,
        email: s.userEmail,
        phone: s.userPhone,
        image: s.userImage
      }
    }));

    return NextResponse.json(formattedSubs);
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
