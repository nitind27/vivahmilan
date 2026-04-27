import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne, pool } from '@/lib/db';
import { randomUUID } from 'crypto';
import { calculateKundali } from '@/lib/kundaliCalculator';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const kundali = await queryOne('SELECT * FROM kundali WHERE userId = ?', [decoded.id]);
  if (!kundali) return NextResponse.json(null);

  return NextResponse.json({
    ...kundali,
    manglik: !!kundali.manglik,
    planetaryPositions: JSON.parse(kundali.planetaryPositions || '{}'),
    dashaSequence: JSON.parse(kundali.dashaSequence || '[]'),
  });
}

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { birthDate, birthHour, birthMinute, birthPeriod, birthPlace, lat, lng } = body;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: 'Invalid birth date format (YYYY-MM-DD)' }, { status: 400 });
  }

  const dob = new Date(birthDate);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return NextResponse.json({ error: 'User must be at least 18 years old' }, { status: 400 });

  let result;
  try {
    result = calculateKundali(birthDate, Number(birthHour), Number(birthMinute), birthPeriod, Number(lat), Number(lng));
  } catch (err) {
    return NextResponse.json({ error: `Kundali calculation failed: ${err.message}` }, { status: 500 });
  }

  const { lagna, rashi, nakshatra, manglik, planetaryPositions, dashaSequence } = result;

  let hour24 = Number(birthHour) % 12;
  if (birthPeriod === 'PM') hour24 += 12;
  const [y, m, d] = birthDate.split('-').map(Number);
  const birthTime = new Date(Date.UTC(y, m - 1, d, hour24, Number(birthMinute), 0));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute('SELECT id FROM kundali WHERE userId = ?', [decoded.id]);

    if (existing.length > 0) {
      await conn.execute(
        'UPDATE kundali SET birthTime=?, birthPlace=?, lat=?, lng=?, lagna=?, rashi=?, nakshatra=?, manglik=?, planetaryPositions=?, dashaSequence=?, updatedAt=NOW() WHERE userId=?',
        [birthTime, birthPlace, Number(lat), Number(lng), lagna, rashi, nakshatra, manglik ? 1 : 0, JSON.stringify(planetaryPositions), JSON.stringify(dashaSequence), decoded.id]
      );
    } else {
      await conn.execute(
        'INSERT INTO kundali (id, userId, birthTime, birthPlace, lat, lng, lagna, rashi, nakshatra, manglik, planetaryPositions, dashaSequence, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
        [randomUUID(), decoded.id, birthTime, birthPlace, Number(lat), Number(lng), lagna, rashi, nakshatra, manglik ? 1 : 0, JSON.stringify(planetaryPositions), JSON.stringify(dashaSequence)]
      );
    }

    await conn.execute('UPDATE profile SET manglik=?, horoscopeSign=?, updatedAt=NOW() WHERE userId=?', [manglik ? 'Yes' : 'No', rashi, decoded.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    conn.release();
    return NextResponse.json({ error: 'Failed to save Kundali data' }, { status: 500 });
  }
  conn.release();

  const saved = await queryOne('SELECT * FROM kundali WHERE userId = ?', [decoded.id]);
  return NextResponse.json({
    ...saved,
    manglik: !!saved.manglik,
    planetaryPositions: JSON.parse(saved.planetaryPositions),
    dashaSequence: JSON.parse(saved.dashaSequence),
  });
}
