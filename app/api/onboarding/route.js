import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { validateSubmitForReview, formatUserSubmitChecklist } from '@/lib/profileVerification';
import { assertAboutMeForSave } from '@/lib/aboutMeValidation.js';
import { validateUserPhoneForSave } from '@/lib/validateUserPhone';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, _activateTrial, _submitForReview, ...data } = body;

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await queryOne(
      'SELECT id, emailVerified, name, phone, phoneVerified, password, freeTrialUsed FROM `user` WHERE email = ?',
      [email]
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const isGoogleAccount = user.password == null || user.password === '';
    if (!user.emailVerified && !isGoogleAccount) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    const { name, phone, ...profileData } = data;

    const sanitized = {};
    for (const [key, val] of Object.entries(profileData)) {
      if (val === '' || val === undefined || val === null) {
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

    const fields = ['gender','dob','height','religion','education','profession','country','city','aboutMe','caste','motherTongue'];
    const filled = fields.filter(f => sanitized[f]).length;
    const profileComplete = Math.round((filled / fields.length) * 100);

    if (sanitized.aboutMe != null && sanitized.aboutMe !== '') {
      const aboutErr = assertAboutMeForSave(sanitized.aboutMe);
      if (aboutErr) {
        return NextResponse.json({ error: aboutErr.error, code: aboutErr.code }, { status: 400 });
      }
    }

    if (name || phone !== undefined) {
      let phoneToSave = user.phone;
      let phoneVerified = user.phoneVerified ? 1 : 0;

      if (phone !== undefined && String(phone).trim()) {
        const check = await validateUserPhoneForSave(phone, user.id, { required: true });
        if (!check.ok) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
        phoneToSave = check.e164;
        phoneVerified = 1;
      } else if (phone !== undefined && !String(phone).trim()) {
        return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
      }

      await execute(
        'UPDATE `user` SET name = ?, phone = ?, phoneVerified = ?, updatedAt = NOW() WHERE id = ?',
        [name || user.name, phoneToSave, phoneVerified, user.id]
      );
    }

    // Upsert profile
    const existing = await queryOne('SELECT id FROM profile WHERE userId = ?', [user.id]);
    if (existing) {
      const sets = Object.entries(sanitized).map(([k]) => `\`${k}\` = ?`).join(', ');
      if (sets) {
        await execute(
          `UPDATE profile SET ${sets}, profileComplete = ?, updatedAt = NOW() WHERE userId = ?`,
          [...Object.values(sanitized), profileComplete, user.id]
        );
      }
    } else {
      const cols = ['id', 'userId', 'profileComplete', 'maritalStatus', 'smoking', 'drinking', 'hidePhone', 'hidePhoto', 'createdAt', 'updatedAt', ...Object.keys(sanitized)];
      const vals = [randomUUID(), user.id, profileComplete, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, new Date(), new Date(), ...Object.values(sanitized)];
      const ph = vals.map(() => '?').join(', ');
      await execute(`INSERT INTO profile (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${ph})`, vals);
    }

    // Activate free trial on final submit (if not already used)
    // NOTE: Trial is now activated when admin approves the profile, not here.
    // This ensures the trial starts when the user can actually use it.

    // If final submit — validate requirements then mark ready for admin review
    if (_submitForReview) {
      const aboutErr = assertAboutMeForSave(sanitized.aboutMe, { required: true });
      if (aboutErr) {
        return NextResponse.json({ error: aboutErr.error, code: aboutErr.code }, { status: 400 });
      }

      const validation = await validateSubmitForReview(user.id);
      if (!validation.ok) {
        return NextResponse.json({
          error: validation.message,
          code: validation.code,
          canSubmit: false,
          ...formatUserSubmitChecklist(validation),
          missingFields: validation.missingFields,
        }, { status: 400 });
      }

      await execute('UPDATE profile SET profileComplete = 100, updatedAt = NOW() WHERE userId = ?', [user.id]);

      try {
        const { clearProfileCorrection } = await import('@/lib/profileCorrection.js');
        await clearProfileCorrection(user.id);
      } catch {}

      try {
        const { notifyAdmins } = await import('@/lib/adminNotifications');
        await notifyAdmins({
          title: '📋 New Profile Submitted',
          message: `${user.name || user.email} has submitted their profile for review.`,
          link: '/admin/pending',
        });
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
