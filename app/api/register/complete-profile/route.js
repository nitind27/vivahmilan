import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function POST(req) {
  try {
    const { email, gender, dob, phone, maritalStatus, religion, caste, gotra,
            motherTongue, country, state, city, education, profession, income, aboutMe } = await req.json();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId = user.id;
    const now = new Date();

    // Update phone on user if provided
    if (phone) {
      await execute('UPDATE `user` SET phone = ?, updatedAt = NOW() WHERE id = ?', [phone, userId]);
    }

    // Calculate profile completeness
    const fields = [gender, dob, religion, education, profession, country, city, aboutMe, caste, motherTongue];
    const filled = fields.filter(Boolean).length;
    const profileComplete = Math.round((filled / fields.length) * 100);

    // Upsert profile
    const existing = await queryOne('SELECT id FROM profile WHERE userId = ?', [userId]);
    if (existing) {
      await execute(
        `UPDATE profile SET
          gender = ?, dob = ?, maritalStatus = ?, religion = ?, caste = ?, gotra = ?,
          motherTongue = ?, country = ?, state = ?, city = ?, education = ?,
          profession = ?, income = ?, aboutMe = ?, profileComplete = ?, updatedAt = NOW()
         WHERE userId = ?`,
        [gender || null, dob ? new Date(dob) : null, maritalStatus || 'NEVER_MARRIED',
         religion || null, caste || null, gotra || null, motherTongue || null,
         country || null, state || null, city || null, education || null,
         profession || null, income || null, aboutMe || null, profileComplete, userId]
      );
    } else {
      const { randomUUID } = await import('crypto');
      await execute(
        `INSERT INTO profile
           (id, userId, gender, dob, maritalStatus, religion, caste, gotra, motherTongue,
            country, state, city, education, profession, income, aboutMe,
            profileComplete, smoking, drinking, hidePhone, hidePhoto, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NO', 'NO', 0, 0, ?, ?)`,
        [randomUUID(), userId, gender || null, dob ? new Date(dob) : null,
         maritalStatus || 'NEVER_MARRIED', religion || null, caste || null, gotra || null,
         motherTongue || null, country || null, state || null, city || null,
         education || null, profession || null, income || null, aboutMe || null,
         profileComplete, now, now]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Complete profile error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
