import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const ALLOWED_PROFILE_COLS = new Set([
  'gender','dob','height','weight','religion','caste','subCaste','sect','gotra','motherTongue',
  'education','profession','income','country','state','city','aboutMe',
  'maritalStatus','smoking','drinking','diet','complexion','bodyType',
  'fatherOccupation','motherOccupation','siblings','familyType','familyStatus',
  'partnerAgeMin','partnerAgeMax','partnerHeightMin','partnerHeightMax',
  'partnerReligion','partnerEducation','partnerLocation',
  'horoscopeSign','nakshatra','manglik','kundliMatch','hidePhone','hidePhoto',
]);

// GET — fetch user + profile by userId or phone
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const phone  = searchParams.get('phone');
  const email  = searchParams.get('email');

  let user = null;
  if (userId) user = await queryOne('SELECT * FROM `user` WHERE id = ?', [userId]);
  else if (phone) user = await queryOne('SELECT * FROM `user` WHERE phone LIKE ?', [`%${phone.replace(/\s/g,'')}%`]);
  else if (email) user = await queryOne('SELECT * FROM `user` WHERE email = ?', [email]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [user.id]);
  const photos  = await query('SELECT * FROM photo WHERE userId = ? ORDER BY isMain DESC', [user.id]);
  const docs    = await query('SELECT id, type, status, url FROM document WHERE userId = ?', [user.id]);

  return NextResponse.json({ user, profile, photos, documents: docs });
}

// POST — create new user + profile (admin creates on behalf)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, email, phone, password, ...profileData } = body;

  if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 });

  const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const hashed = await bcrypt.hash(password || 'Vivah@1234', 12);
  const userId = randomUUID();
  const profileId = randomUUID();
  const now = new Date();

  await execute(
    `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified, adminVerified,
      verificationBadge, isPremium, profileBoost, phoneVerified, loginOtpEnabled, emailVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'USER', 1, 1, 1, 0, 0, 0, 0, 0, NOW(), ?, ?)`,
    [userId, name, email, hashed, phone || null, now, now]
  );

  const sanitized = sanitizeProfile(profileData);
  const fields = ['gender','dob','height','religion','education','profession','country','city','aboutMe','caste','motherTongue'];
  const filled = fields.filter(f => sanitized[f]).length;
  const profileComplete = Math.round((filled / fields.length) * 100);

  const cols = ['id','userId','profileComplete','maritalStatus','smoking','drinking','hidePhone','hidePhoto','createdAt','updatedAt',...Object.keys(sanitized)];
  const vals = [profileId, userId, profileComplete, sanitized.maritalStatus || 'NEVER_MARRIED', sanitized.smoking || 'NO', sanitized.drinking || 'NO', 0, 0, now, now, ...Object.values(sanitized)];
  await execute(`INSERT INTO profile (${cols.map(c=>`\`${c}\``).join(',')}) VALUES (${vals.map(()=>'?').join(',')})`, vals);

  return NextResponse.json({ success: true, userId, message: 'Profile created. Default password: Vivah@1234' });
}

// PATCH — update existing user + profile
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { userId, name, phone, email, adminVerified, isActive, isPremium, premiumExpiry, premiumPlan, ...profileData } = body;

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  // Update user fields
  const userUpdates = [];
  const userVals = [];
  if (name !== undefined)          { userUpdates.push('name = ?');          userVals.push(name); }
  if (phone !== undefined)         { userUpdates.push('phone = ?');         userVals.push(phone); }
  if (email !== undefined)         { userUpdates.push('email = ?');         userVals.push(email); }
  if (adminVerified !== undefined) { userUpdates.push('adminVerified = ?'); userVals.push(adminVerified ? 1 : 0); }
  if (isActive !== undefined)      { userUpdates.push('isActive = ?');      userVals.push(isActive ? 1 : 0); }
  if (isPremium !== undefined)     { userUpdates.push('isPremium = ?');     userVals.push(isPremium ? 1 : 0); }
  if (premiumExpiry !== undefined) { userUpdates.push('premiumExpiry = ?'); userVals.push(premiumExpiry ? new Date(premiumExpiry) : null); }
  if (premiumPlan !== undefined)   { userUpdates.push('premiumPlan = ?');   userVals.push(premiumPlan); }

  if (userUpdates.length) {
    userVals.push(userId);
    await execute(`UPDATE \`user\` SET ${userUpdates.join(', ')}, updatedAt = NOW() WHERE id = ?`, userVals);
  }

  // Update profile
  const sanitized = sanitizeProfile(profileData);
  if (Object.keys(sanitized).length) {
    const fields = ['gender','dob','height','religion','education','profession','country','city','aboutMe','caste','motherTongue'];
    const filled = fields.filter(f => sanitized[f]).length;
    const profileComplete = Math.round((filled / fields.length) * 100);

    const existing = await queryOne('SELECT id FROM profile WHERE userId = ?', [userId]);
    if (existing) {
      const sets = [...Object.keys(sanitized).map(k=>`\`${k}\` = ?`), 'profileComplete = ?', 'updatedAt = NOW()'].join(', ');
      await execute(`UPDATE profile SET ${sets} WHERE userId = ?`, [...Object.values(sanitized), profileComplete, userId]);
    } else {
      const profileId = randomUUID();
      const now = new Date();
      const cols = ['id','userId','profileComplete','maritalStatus','smoking','drinking','hidePhone','hidePhoto','createdAt','updatedAt',...Object.keys(sanitized)];
      const vals = [profileId, userId, profileComplete, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, now, now, ...Object.values(sanitized)];
      await execute(`INSERT INTO profile (${cols.map(c=>`\`${c}\``).join(',')}) VALUES (${vals.map(()=>'?').join(',')})`, vals);
    }
  }

  return NextResponse.json({ success: true });
}

function sanitizeProfile(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (!ALLOWED_PROFILE_COLS.has(k)) continue;
    if (v === '' || v === undefined || v === null) { out[k] = null; continue; }
    if (k === 'dob') { const d = new Date(v); out[k] = isNaN(d.getTime()) ? null : d; continue; }
    if (['height','weight','siblings','partnerAgeMin','partnerAgeMax','partnerHeightMin','partnerHeightMax'].includes(k)) {
      const n = parseInt(v); out[k] = isNaN(n) ? null : n; continue;
    }
    out[k] = v;
  }
  return out;
}
