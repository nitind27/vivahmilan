import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';

export async function GET(req, { params }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { id } = await params;
    const targetId = id === 'me' ? decoded.id : id;

    const user = await queryOne(
      `SELECT u.id, u.name, u.email, u.phone, u.isPremium, u.premiumPlan,
              u.verificationBadge, u.adminVerified, u.createdAt,
              p.gender, p.dob, p.height, p.weight, p.religion, p.caste, p.subCaste,
              p.gotra, p.motherTongue, p.education, p.profession, p.income,
              p.country, p.state, p.city, p.aboutMe, p.maritalStatus,
              p.complexion, p.bodyType, p.diet, p.smoking, p.drinking,
              p.familyType, p.familyStatus, p.profileComplete,
              p.partnerAgeMin, p.partnerAgeMax, p.partnerHeightMin, p.partnerHeightMax,
              p.partnerReligion, p.partnerEducation, p.partnerProfession
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       WHERE u.id = ? AND u.isActive = 1`,
      [targetId]
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Photos
    const photos = await query(
      'SELECT id, url, isMain FROM photo WHERE userId = ? ORDER BY isMain DESC, createdAt ASC',
      [targetId]
    );

    // Hide phone/email for other users (non-premium check)
    const isSelf = decoded.id === targetId;
    const isPremiumViewer = decoded.isPremium;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: isSelf ? user.email : null,
      phone: (isSelf || isPremiumViewer) ? user.phone : null,
      isPremium: !!user.isPremium,
      premiumPlan: user.premiumPlan || null,
      verificationBadge: !!user.verificationBadge,
      adminVerified: !!user.adminVerified,
      createdAt: user.createdAt,
      profile: {
        gender: user.gender,
        dob: user.dob,
        height: user.height,
        weight: user.weight,
        religion: user.religion,
        caste: user.caste,
        subCaste: user.subCaste,
        gotra: user.gotra,
        motherTongue: user.motherTongue,
        education: user.education,
        profession: user.profession,
        income: user.income,
        country: user.country,
        state: user.state,
        city: user.city,
        aboutMe: user.aboutMe,
        maritalStatus: user.maritalStatus,
        complexion: user.complexion,
        bodyType: user.bodyType,
        diet: user.diet,
        smoking: user.smoking,
        drinking: user.drinking,
        familyType: user.familyType,
        familyStatus: user.familyStatus,
        profileComplete: user.profileComplete,
        partnerPreferences: {
          ageMin: user.partnerAgeMin,
          ageMax: user.partnerAgeMax,
          heightMin: user.partnerHeightMin,
          heightMax: user.partnerHeightMax,
          religion: user.partnerReligion,
          education: user.partnerEducation,
          profession: user.partnerProfession,
        },
      },
      photos,
    });

  } catch (err) {
    console.error('Flutter profile GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
