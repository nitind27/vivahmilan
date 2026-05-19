import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const agents = await query(`
      SELECT a.*, u.name as userName, u.email as userEmail, u.phone as userPhone, u.image as userImage 
      FROM agent a
      JOIN \`user\` u ON u.id = a.userId
      ORDER BY a.createdAt DESC
    `);
    return NextResponse.json(agents);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { userId, referralCode, commissionPct } = await req.json();
    
    // Check if code exists
    const [existing] = await query('SELECT id FROM agent WHERE referralCode = ?', [referralCode]);
    if (existing) return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });

    await execute(
      'INSERT INTO agent (id, userId, referralCode, commissionPct, totalEarnings, createdAt) VALUES (?, ?, ?, ?, 0, NOW())',
      [uuidv4(), userId, referralCode, commissionPct]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'User is already an agent' }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const id = new URL(req.url).searchParams.get('id');
    await execute('DELETE FROM agent WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
