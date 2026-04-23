import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne, pool } from '@/lib/db';
import { randomUUID } from 'crypto';

import { calculateKundali } from '@/lib/kundaliCalculator';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { birthDate, birthHour, birthMinute, birthPeriod, birthPlace, lat, lng, email } = body;

  // Auth: support both session (logged-in users) and email (onboarding flow)
  let userId;
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    userId = session.user.id;
  } else if (email) {
    const user = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    userId = user.id;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: 'Invalid birth date format' }, { status: 400 });
  }

  // Validate age >= 18
  const dob = new Date(birthDate);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) {
    return NextResponse.json({ error: 'User must be at least 18 years old' }, { status: 400 });
  }

  // Calculate Kundali
  let result;
  try {
    result = calculateKundali(
      birthDate,
      Number(birthHour),
      Number(birthMinute),
      birthPeriod,
      Number(lat),
      Number(lng)
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Kundali calculation failed: ${err.message}` },
      { status: 500 }
    );
  }

  const { lagna, rashi, nakshatra, manglik, planetaryPositions, dashaSequence } = result;

  // Build birthTime as UTC datetime
  let hour24 = Number(birthHour) % 12;
  if (birthPeriod === 'PM') hour24 += 12;
  const [y, m, d] = birthDate.split('-').map(Number);
  const birthTime = new Date(Date.UTC(y, m - 1, d, hour24, Number(birthMinute), 0));

  const planetaryPositionsJson = JSON.stringify(planetaryPositions);
  const dashaSequenceJson = JSON.stringify(dashaSequence);

  // Use a DB transaction: upsert kundali + update profile
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if kundali exists for this user
    const [existing] = await conn.execute(
      'SELECT id FROM kundali WHERE userId = ?',
      [userId]
    );

    if (existing.length > 0) {
      // Update existing record
      await conn.execute(
        `UPDATE kundali SET birthTime=?, birthPlace=?, lat=?, lng=?, lagna=?, rashi=?, nakshatra=?, manglik=?, planetaryPositions=?, dashaSequence=?, updatedAt=NOW() WHERE userId=?`,
        [birthTime, birthPlace, Number(lat), Number(lng), lagna, rashi, nakshatra, manglik ? 1 : 0, planetaryPositionsJson, dashaSequenceJson, userId]
      );
    } else {
      // Insert new record
      const id = randomUUID();
      await conn.execute(
        `INSERT INTO kundali (id, userId, birthTime, birthPlace, lat, lng, lagna, rashi, nakshatra, manglik, planetaryPositions, dashaSequence, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [id, userId, birthTime, birthPlace, Number(lat), Number(lng), lagna, rashi, nakshatra, manglik ? 1 : 0, planetaryPositionsJson, dashaSequenceJson]
      );
    }

    // Update profile: manglik + horoscopeSign
    await conn.execute(
      `UPDATE profile SET manglik=?, horoscopeSign=?, updatedAt=NOW() WHERE userId=?`,
      [manglik ? 'Yes' : 'No', rashi, userId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    conn.release();
    return NextResponse.json({ error: 'Failed to save Kundali data' }, { status: 500 });
  }
  conn.release();

  // Fetch the saved record to return
  const saved = await queryOne('SELECT * FROM kundali WHERE userId = ?', [userId]);
  if (!saved) {
    return NextResponse.json({ error: 'Failed to retrieve saved Kundali' }, { status: 500 });
  }

  return NextResponse.json({
    ...saved,
    manglik: !!saved.manglik,
    planetaryPositions: JSON.parse(saved.planetaryPositions),
    dashaSequence: JSON.parse(saved.dashaSequence),
  });
}
