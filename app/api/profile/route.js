import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await queryOne('SELECT * FROM `user` WHERE id = ?', [session.user.id]);
  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [session.user.id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ?', [session.user.id]);

  return NextResponse.json({ ...user, profile, photos });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { name, phone, ...profileData } = data;

  const sanitized = {};
  for (const [key, val] of Object.entries(profileData)) {
    if (val === '' || val === undefined) {
      sanitized[key] = null;
    } else if (key === 'dob') {
      const parsed = new Date(val);
      sanitized[key] = isNaN(parsed.getTime()) ? null : parsed;
    } else if (['height','weight','siblings','partnerAgeMin','partnerAgeMax','partnerHeightMin','partnerHeightMax'].includes(key)) {
      const num = parseInt(val);
      sanitized[key] = isNaN(num) ? null : num;
    } else {
      sanitized[key] = val;
    }
  }

  const fields = ['gender','dob','height','religion','education','profession','country','city','aboutMe'];
  const filled = fields.filter(f => sanitized[f] != null).length;
  const profileComplete = Math.round((filled / fields.length) * 100);

  if (name || phone) {
    await execute(
      'UPDATE `user` SET name = COALESCE(?, name), phone = COALESCE(?, phone), updatedAt = NOW() WHERE id = ?',
      [name || null, phone || null, session.user.id]
    );
  }

  const existing = await queryOne('SELECT id FROM profile WHERE userId = ?', [session.user.id]);
  if (existing) {
    const sets = [...Object.keys(sanitized).map(k => `\`${k}\` = ?`), 'profileComplete = ?', 'updatedAt = NOW()'].join(', ');
    await execute(
      `UPDATE profile SET ${sets} WHERE userId = ?`,
      [...Object.values(sanitized), profileComplete, session.user.id]
    );
  } else {
    const cols = ['id', 'userId', 'profileComplete', 'maritalStatus', 'smoking', 'drinking', 'hidePhone', 'hidePhoto', 'createdAt', 'updatedAt', ...Object.keys(sanitized)];
    const vals = [randomUUID(), session.user.id, profileComplete, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, new Date(), new Date(), ...Object.values(sanitized)];
    await execute(
      `INSERT INTO profile (${cols.map(c => `\`${c}\``).join(',')}) VALUES (${vals.map(() => '?').join(',')})`,
      vals
    );
  }

  const user = await queryOne('SELECT * FROM `user` WHERE id = ?', [session.user.id]);
  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [session.user.id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ?', [session.user.id]);

  return NextResponse.json({ ...user, profile, photos });
}
