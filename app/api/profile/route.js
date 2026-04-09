import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, photos: true },
  });

  return NextResponse.json(user);
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { name, phone, ...profileData } = data;

  // Convert empty strings to null, parse numbers and dates properly
  const sanitized = {};
  for (const [key, val] of Object.entries(profileData)) {
    if (val === '' || val === undefined) {
      sanitized[key] = null;
    } else if (key === 'dob') {
      const parsed = new Date(val);
      sanitized[key] = isNaN(parsed.getTime()) ? null : parsed;
    } else if (['height', 'weight', 'siblings', 'partnerAgeMin', 'partnerAgeMax', 'partnerHeightMin', 'partnerHeightMax'].includes(key)) {
      const num = parseInt(val);
      sanitized[key] = isNaN(num) ? null : num;
    } else {
      sanitized[key] = val;
    }
  }

  // Calculate profile completion
  const fields = ['gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe'];
  const filled = fields.filter(f => sanitized[f] !== null && sanitized[f] !== undefined).length;
  const profileComplete = Math.round((filled / fields.length) * 100);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      phone: phone || undefined,
      profile: {
        upsert: {
          create: { ...sanitized, profileComplete },
          update: { ...sanitized, profileComplete },
        },
      },
    },
    include: { profile: true, photos: true },
  });

  return NextResponse.json(user);
}
