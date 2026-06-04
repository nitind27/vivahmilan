import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { resolveOnboardingUser } from '@/lib/onboardingAccess.js';

// GET /api/onboarding/status?email=...&completionToken=...
// Returns existing profile data + photo + doc status for pre-filling onboarding form
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const completionToken = searchParams.get('completionToken');

  const access = await resolveOnboardingUser({ email, completionToken });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status || 403 });
  }

  const token = searchParams.get('token');
  const user = await queryOne(
    `SELECT id, name, phone, image, adminVerified, profileCorrectionRequired, profileCorrectionNote,
            profileCorrectionFields, profileCorrectionRequestedAt, profileCorrectionToken
     FROM \`user\` WHERE id = ?`,
    [access.user.id]
  );

  const correctionFields = user.profileCorrectionFields
    ? (() => {
        try {
          return JSON.parse(user.profileCorrectionFields);
        } catch {
          return [];
        }
      })()
    : [];

  const correction = user.profileCorrectionRequired
    ? {
        required: true,
        note: user.profileCorrectionNote || '',
        fields: correctionFields,
        requestedAt: user.profileCorrectionRequestedAt,
        tokenValid: token ? token === user.profileCorrectionToken : null,
      }
    : { required: false };

  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [user.id]);

  // Main photo
  const photo = await queryOne(
    'SELECT url FROM photo WHERE userId = ? AND isMain = 1 ORDER BY createdAt DESC LIMIT 1',
    [user.id]
  );

  // Latest document
  const doc = await queryOne(
    'SELECT type, status FROM document WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
    [user.id]
  );

  // Family photos
  const familyPhotos = await query(
    'SELECT * FROM family_photo WHERE userId = ? ORDER BY createdAt DESC',
    [user.id]
  ).catch(() => []);

  // Format dob for date input (YYYY-MM-DD)
  let dob = '';
  if (profile?.dob) {
    const d = new Date(profile.dob);
    if (!isNaN(d.getTime())) {
      dob = d.toISOString().split('T')[0];
    }
  }

  return NextResponse.json({
    name:    user.name  || '',
    phone:   user.phone || '',
    adminVerified: !!user.adminVerified,
    correction,
    photoUrl: photo?.url || user.image || null,
    document: doc ? { type: doc.type, status: doc.status } : null,
    familyPhotos: familyPhotos || [],
    profile: profile ? {
      gender:          profile.gender          || '',
      dob,
      height:          profile.height          ? String(profile.height) : '',
      weight:          profile.weight          ? String(profile.weight) : '',
      maritalStatus:   profile.maritalStatus   || 'NEVER_MARRIED',
      bodyType:        profile.bodyType        || '',
      complexion:      profile.complexion      || '',
      aboutMe:         profile.aboutMe         || '',
      religion:        profile.religion        || '',
      caste:           profile.caste           || '',
      subCaste:        profile.subCaste        || '',
      sect:            profile.sect            || '',
      gotra:           profile.gotra           || '',
      motherTongue:    profile.motherTongue    || '',
      horoscopeSign:   profile.horoscopeSign   || '',
      nakshatra:       profile.nakshatra       || '',
      manglik:         profile.manglik         || 'No',
      kundliMatch:     profile.kundliMatch     || 'Not Required',
      country:         profile.country         || '',
      state:           profile.state           || '',
      city:            profile.city            || '',
      education:       profile.education       || '',
      profession:      profile.profession      || '',
      income:          profile.income          || '',
      smoking:         profile.smoking         || 'NO',
      drinking:        profile.drinking        || 'NO',
      diet:            profile.diet            || '',
      fatherOccupation: profile.fatherOccupation || '',
      motherOccupation: profile.motherOccupation || '',
      siblings:        profile.siblings        ? String(profile.siblings) : '',
      familyType:      profile.familyType      || '',
      familyStatus:    profile.familyStatus    || '',
    } : null,
  });
}
