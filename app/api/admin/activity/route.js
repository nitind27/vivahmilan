import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all'; // all | registrations | interests | messages | logins

  const results = {};

  if (type === 'all' || type === 'registrations') {
    results.registrations = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.createdAt,
              p.gender, p.city, p.country, ph.url AS photo
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE u.role = 'USER'
       ORDER BY u.createdAt DESC LIMIT 20`
    );
  }

  if (type === 'all' || type === 'interests') {
    results.interests = await query(
      `SELECT i.id, i.status, i.createdAt,
              s.name AS senderName, s.email AS senderEmail,
              r.name AS receiverName, r.email AS receiverEmail
       FROM interest i
       JOIN \`user\` s ON s.id = i.senderId
       JOIN \`user\` r ON r.id = i.receiverId
       ORDER BY i.createdAt DESC LIMIT 20`
    );
  }

  if (type === 'all' || type === 'messages') {
    results.messages = await query(
      `SELECT m.id, m.content, m.type, m.createdAt,
              s.name AS senderName, r.name AS receiverName
       FROM message m
       JOIN \`user\` s ON s.id = m.senderId
       JOIN \`user\` r ON r.id = m.receiverId
       ORDER BY m.createdAt DESC LIMIT 20`
    );
  }

  if (type === 'all' || type === 'logins') {
    results.logins = await query(
      `SELECT u.id, u.name, u.email, u.lastLoginAt, u.lastSeen,
              p.gender, p.city
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       WHERE u.role = 'USER' AND u.lastLoginAt IS NOT NULL
       ORDER BY u.lastLoginAt DESC LIMIT 20`
    );
  }

  if (type === 'all' || type === 'premium') {
    results.premiumActivity = await query(
      `SELECT s.id, s.plan, s.status, s.amount, s.startDate, s.endDate,
              u.name, u.email
       FROM subscription s
       JOIN \`user\` u ON u.id = s.userId
       ORDER BY s.startDate DESC LIMIT 20`
    );
  }

  return NextResponse.json(results);
}
