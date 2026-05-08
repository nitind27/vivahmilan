import { NextResponse } from 'next/server';
import { queryOne, query, execute } from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { randomUUID } from 'crypto';

export async function GET(req, { params }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { id } = await params;
    const targetId = id === 'me' ? decoded.id : id;
    const isSelf   = decoded.id === targetId;

    const user = await queryOne(
      `SELECT u.id, u.name, u.email, u.phone, u.isPremium, u.premiumPlan, u.premiumExpiry,
              u.isVerified, u.verificationBadge, u.adminVerified, u.isActive,
              u.profileBoost, u.boostExpiry, u.freeTrialExpiry, u.lastLoginAt, u.createdAt,
              p.gender, p.dob, p.height, p.weight, p.religion, p.caste, p.subCaste,
              p.sect, p.gotra, p.motherTongue, p.education, p.profession, p.income,
              p.country, p.state, p.city, p.aboutMe, p.maritalStatus,
              p.complexion, p.bodyType, p.diet, p.smoking, p.drinking,
              p.fatherOccupation, p.motherOccupation, p.siblings,
              p.familyType, p.familyStatus, p.profileComplete,
              p.horoscopeSign, p.nakshatra, p.manglik, p.kundliMatch, p.amritdhari,
              p.partnerAgeMin, p.partnerAgeMax, p.partnerHeightMin, p.partnerHeightMax,
              p.partnerReligion, p.partnerCaste, p.partnerEducation, p.partnerProfession,
              p.partnerLocation, p.partnerMaritalStatus, p.partnerManglik,
              p.hidePhone, p.hidePhoto
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       WHERE u.id = ? AND u.isActive = 1`,
      [targetId]
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [photos, familyPhotos] = await Promise.all([
      query('SELECT id, url, isMain FROM photo WHERE userId = ? ORDER BY isMain DESC, createdAt ASC', [targetId]),
      query('SELECT id, url, caption, memberCount, createdAt FROM family_photo WHERE userId = ? ORDER BY createdAt DESC', [targetId]).catch(() => []),
    ]);

    // Active subscription + plan config
    const subscription = await queryOne(
      `SELECT s.id, s.plan, s.status, s.amount, s.currency, s.startDate, s.endDate, s.paymentId,
              pc.displayName, pc.permissions, pc.durationDays, pc.description, pc.price
       FROM subscription s
       LEFT JOIN planconfig pc ON pc.plan = s.plan
       WHERE s.userId = ? AND s.status = 'ACTIVE' AND s.endDate > NOW()
       ORDER BY s.endDate DESC LIMIT 1`,
      [targetId]
    );

    let premiumPlanDetails = null;
    if (subscription) {
      premiumPlanDetails = {
        id:           subscription.id,
        plan:         subscription.plan,
        status:       subscription.status,
        amount:       subscription.amount,
        currency:     subscription.currency,
        startDate:    subscription.startDate,
        endDate:      subscription.endDate,
        paymentId:    subscription.paymentId,
        displayName:  subscription.displayName,
        durationDays: subscription.durationDays,
        description:  subscription.description,
        price:        subscription.price,
        permissions:  typeof subscription.permissions === 'string'
          ? JSON.parse(subscription.permissions || '[]')
          : (subscription.permissions || []),
      };
    }

    // Interaction flags — only when viewing another user's profile
    let interactionFlags = {};
    if (!isSelf) {
      // Record profile view (once per viewer)
      const alreadyViewed = await queryOne(
        'SELECT id FROM profileview WHERE viewerId = ? AND viewedId = ?',
        [decoded.id, targetId]
      );
      if (!alreadyViewed) {
        await execute(
          'INSERT INTO profileview (id, viewerId, viewedId, createdAt) VALUES (?, ?, ?, NOW())',
          [randomUUID(), decoded.id, targetId]
        );
        await execute(
          `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
           VALUES (?, ?, 'PROFILE_VIEWED', 'Profile Viewed', 'Someone viewed your profile', 0, ?, NOW())`,
          [randomUUID(), targetId, `/profile/${decoded.id}`]
        );
      }

      const [interestSent, interestReceived, isBlockedRow, isReportedRow, isShortlistedRow] = await Promise.all([
        queryOne('SELECT id, status FROM interest WHERE senderId = ? AND receiverId = ?', [decoded.id, targetId]),
        queryOne('SELECT id, status FROM interest WHERE senderId = ? AND receiverId = ?', [targetId, decoded.id]),
        queryOne('SELECT id FROM block WHERE blockerId = ? AND blockedId = ?', [decoded.id, targetId]),
        queryOne('SELECT id FROM report WHERE reporterId = ? AND targetId = ?', [decoded.id, targetId]),
        queryOne('SELECT id FROM shortlist WHERE ownerId = ? AND targetId = ?', [decoded.id, targetId]),
      ]);

      interactionFlags = {
        interestSent:     interestSent     ? { id: interestSent.id,     status: interestSent.status }     : null,
        interestReceived: interestReceived ? { id: interestReceived.id, status: interestReceived.status } : null,
        isBlocked:        !!isBlockedRow,
        isReported:       !!isReportedRow,
        isShortlisted:    !!isShortlistedRow,
      };
    }

    const isPremiumViewer = !!decoded.isPremium;
    const showPhone = isSelf || (isPremiumViewer && !user.hidePhone);

    return NextResponse.json({
      id:                user.id,
      name:              user.name,
      email:             isSelf ? user.email : null,
      phone:             showPhone ? user.phone : null,
      isPremium:         !!user.isPremium,
      premiumPlan:       user.premiumPlan   || null,
      premiumExpiry:     user.premiumExpiry || null,
      isVerified:        !!user.isVerified,
      verificationBadge: !!user.verificationBadge,
      adminVerified:     !!user.adminVerified,
      profileBoost:      !!user.profileBoost,
      boostExpiry:       user.boostExpiry   || null,
      ...(isSelf && { freeTrialExpiry: user.freeTrialExpiry || null }),
      ...(isSelf && { lastLoginAt: user.lastLoginAt || null }),
      createdAt:         user.createdAt,
      premiumPlanDetails,
      profile: {
        gender:        user.gender,
        dob:           user.dob,
        height:        user.height,
        weight:        user.weight,
        religion:      user.religion,
        caste:         user.caste,
        subCaste:      user.subCaste,
        sect:          user.sect,
        gotra:         user.gotra,
        motherTongue:  user.motherTongue,
        education:     user.education,
        profession:    user.profession,
        income:        user.income,
        country:       user.country,
        state:         user.state,
        city:          user.city,
        aboutMe:       user.aboutMe,
        maritalStatus: user.maritalStatus,
        complexion:    user.complexion,
        bodyType:      user.bodyType,
        diet:          user.diet,
        smoking:       user.smoking,
        drinking:      user.drinking,
        fatherOccupation: user.fatherOccupation,
        motherOccupation: user.motherOccupation,
        siblings:      user.siblings,
        familyType:    user.familyType,
        familyStatus:  user.familyStatus,
        profileComplete: user.profileComplete,
        horoscopeSign: user.horoscopeSign,
        nakshatra:     user.nakshatra,
        manglik:       user.manglik,
        kundliMatch:   user.kundliMatch,
        amritdhari:    user.amritdhari,
        hidePhone:     !!user.hidePhone,
        hidePhoto:     !!user.hidePhoto,
        partnerPreferences: {
          ageMin:        user.partnerAgeMin,
          ageMax:        user.partnerAgeMax,
          heightMin:     user.partnerHeightMin,
          heightMax:     user.partnerHeightMax,
          religion:      user.partnerReligion,
          caste:         user.partnerCaste,
          education:     user.partnerEducation,
          profession:    user.partnerProfession,
          location:      user.partnerLocation,
          maritalStatus: user.partnerMaritalStatus,
          manglik:       user.partnerManglik,
        },
      },
      photos,
      familyPhotos,
      ...interactionFlags,
    });

  } catch (err) {
    console.error('Flutter profile [id] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
