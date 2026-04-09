import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Save onboarding profile data using email (no auth needed — user not yet approved)
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, ...data } = body;

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Only allow if email is verified
    if (!user.emailVerified)
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });

    const { name, phone, ...profileData } = data;

    // Sanitize
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        phone: phone || user.phone,
        profile: {
          upsert: {
            create: { ...sanitized, profileComplete },
            update: { ...sanitized, profileComplete },
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
