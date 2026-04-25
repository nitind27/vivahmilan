import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get('search') || '';
  const gender  = searchParams.get('gender') || '';
  const status  = searchParams.get('status') || ''; // premium|verified|pending|blocked
  const page    = parseInt(searchParams.get('page') || '1');
  const limit   = parseInt(searchParams.get('limit') || '30');
  const offset  = (page - 1) * limit;

  const conditions = ["u.role = 'USER'"];
  const params = [];

  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (gender) { conditions.push('p.gender = ?'); params.push(gender); }
  if (status === 'premium')  { conditions.push('u.isPremium = 1'); }
  if (status === 'verified') { conditions.push('u.adminVerified = 1'); }
  if (status === 'pending')  { conditions.push('u.adminVerified = 0 AND u.isActive = 1'); }
  if (status === 'blocked')  { conditions.push('u.isActive = 0'); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.isPremium, u.isVerified,
            u.adminVerified, u.isActive, u.createdAt, u.lastSeen,
            p.gender, p.dob, p.religion, p.caste, p.city, p.state, p.country,
            p.education, p.profession, p.profileComplete,
            ph.url AS mainPhoto
     FROM \`user\` u
     LEFT JOIN profile p ON p.userId = u.id
     LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
     ${where}
     ORDER BY u.createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countRow = await queryOne(
    `SELECT COUNT(*) as cnt FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id ${where}`,
    params
  );

  return NextResponse.json({ members: rows, total: countRow?.cnt || 0, page, limit });
}
