import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// Auto-migrate: add missing columns if they don't exist
async function ensureColumns() {
  const cols = [
    'ALTER TABLE profile ADD COLUMN IF NOT EXISTS partnerCaste VARCHAR(255) NULL',
    'ALTER TABLE profile ADD COLUMN IF NOT EXISTS partnerProfession VARCHAR(255) NULL',
    'ALTER TABLE profile ADD COLUMN IF NOT EXISTS partnerMaritalStatus VARCHAR(100) NULL',
    'ALTER TABLE profile ADD COLUMN IF NOT EXISTS partnerManglik VARCHAR(50) NULL',
  ];
  for (const sql of cols) {
    try { await execute(sql); } catch {}
  }
}

let migrated = false;

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await queryOne('SELECT * FROM `user` WHERE id = ?', [session.user.id]);
  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [session.user.id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ?', [session.user.id]);
  const familyPhotos = await query('SELECT * FROM family_photo WHERE userId = ? ORDER BY createdAt DESC', [session.user.id]).catch(() => []);

  return NextResponse.json({ ...user, profile, photos, familyPhotos });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Run once per server instance
  if (!migrated) { await ensureColumns(); migrated = true; }

  const data = await req.json();
  const { name, phone, ...profileData } = data;

  // Whitelist of all valid profile columns (prevents unknown column SQL errors)
  const ALLOWED_PROFILE_COLS = new Set([
    'gender','dob','height','weight','religion','caste','subCaste','sect','gotra','motherTongue',
    'education','profession','income','country','state','city','aboutMe',
    'maritalStatus','smoking','drinking','diet','complexion','bodyType',
    'fatherOccupation','motherOccupation','siblings','familyType','familyStatus',
    'partnerAgeMin','partnerAgeMax','partnerHeightMin','partnerHeightMax',
    'partnerReligion','partnerCaste','partnerEducation','partnerProfession',
    'partnerLocation','partnerMaritalStatus','partnerManglik',
    'horoscopeSign','nakshatra','manglik','kundliMatch','amritdhari',
    'hidePhone','hidePhoto',
  ]);

  const sanitized = {};
  for (const [key, val] of Object.entries(profileData)) {
    if (!ALLOWED_PROFILE_COLS.has(key)) continue; // skip unknown columns
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
