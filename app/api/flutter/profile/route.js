import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

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

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const user = await queryOne('SELECT id, name, email, phone, isPremium, premiumPlan, verificationBadge, adminVerified, isActive, createdAt FROM `user` WHERE id = ?', [decoded.id]);
  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [decoded.id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ?', [decoded.id]);
  const familyPhotos = await query('SELECT * FROM family_photo WHERE userId = ? ORDER BY createdAt DESC', [decoded.id]).catch(() => []);

  return NextResponse.json({ ...user, profile, photos, familyPhotos });
}

export async function PUT(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const data = await req.json();
  const { name, phone, ...profileData } = data;

  const sanitized = {};
  for (const [key, val] of Object.entries(profileData)) {
    if (!ALLOWED_PROFILE_COLS.has(key)) continue;
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
      [name || null, phone || null, decoded.id]
    );
  }

  const existing = await queryOne('SELECT id FROM profile WHERE userId = ?', [decoded.id]);
  if (existing) {
    const sets = [...Object.keys(sanitized).map(k => `\`${k}\` = ?`), 'profileComplete = ?', 'updatedAt = NOW()'].join(', ');
    if (Object.keys(sanitized).length > 0) {
      await execute(`UPDATE profile SET ${sets} WHERE userId = ?`, [...Object.values(sanitized), profileComplete, decoded.id]);
    }
  } else {
    const cols = ['id','userId','profileComplete','maritalStatus','smoking','drinking','hidePhone','hidePhoto','createdAt','updatedAt',...Object.keys(sanitized)];
    const vals = [randomUUID(), decoded.id, profileComplete, 'NEVER_MARRIED','NO','NO',0,0,new Date(),new Date(),...Object.values(sanitized)];
    await execute(`INSERT INTO profile (${cols.map(c=>`\`${c}\``).join(',')}) VALUES (${vals.map(()=>'?').join(',')})`, vals);
  }

  const user = await queryOne('SELECT id, name, email, phone, isPremium, premiumPlan, verificationBadge, adminVerified, isActive, createdAt FROM `user` WHERE id = ?', [decoded.id]);
  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [decoded.id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ?', [decoded.id]);

  return NextResponse.json({ ...user, profile, photos });
}
