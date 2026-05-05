import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, _activateTrial, _submitForReview, ...data } = body;

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await queryOne('SELECT id, emailVerified, name, phone, freeTrialUsed FROM `user` WHERE email = ?', [email]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.emailVerified) return NextResponse.json({ error: 'Email not verified' }, { status: 403 });

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

    // Update user name/phone
    if (name || phone) {
      await execute(
        'UPDATE `user` SET name = ?, phone = ?, updatedAt = NOW() WHERE id = ?',
        [name || user.name, phone || user.phone, user.id]
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

    // If final submit — mark profileComplete = 100 to signal ready for admin review
    if (_submitForReview) {
      await execute('UPDATE profile SET profileComplete = 100, updatedAt = NOW() WHERE userId = ?', [user.id]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
