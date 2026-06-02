import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { assertAboutMeForSave } from '@/lib/aboutMeValidation.js';
import { validateUserPhoneForSave, phoneNumberChanged } from '@/lib/validateUserPhone';

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
  const agent = await queryOne('SELECT * FROM agent WHERE userId = ?', [session.user.id]).catch(() => null);

  return NextResponse.json({ ...user, profile, photos, familyPhotos, agent });
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

  if (Object.prototype.hasOwnProperty.call(profileData, 'aboutMe') && sanitized.aboutMe) {
    const aboutErr = assertAboutMeForSave(sanitized.aboutMe);
    if (aboutErr) {
      return NextResponse.json({ error: aboutErr.error, code: aboutErr.code }, { status: 400 });
    }
  }

  if (name || phone !== undefined) {
    let phoneToSave = null;
    let phoneVerifiedFlag = null;

    if (phone !== undefined && phone !== null && String(phone).trim()) {
      const current = await queryOne('SELECT phone, phoneVerified FROM `user` WHERE id = ?', [session.user.id]);
      const changed = phoneNumberChanged(current?.phone, phone);
      if (changed || !current?.phoneVerified) {
        const check = await validateUserPhoneForSave(phone, session.user.id, { required: true });
        if (!check.ok) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
        phoneToSave = check.e164;
        phoneVerifiedFlag = 1;
      } else {
        phoneToSave = current?.phone || phone;
      }
    } else if (phone !== undefined) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    if (phoneVerifiedFlag === 1) {
      await execute(
        'UPDATE `user` SET name = COALESCE(?, name), phone = ?, phoneVerified = 1, updatedAt = NOW() WHERE id = ?',
        [name || null, phoneToSave, session.user.id]
      );
    } else {
      await execute(
        'UPDATE `user` SET name = COALESCE(?, name), updatedAt = NOW() WHERE id = ?',
        [name || null, session.user.id]
      );
    }
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
