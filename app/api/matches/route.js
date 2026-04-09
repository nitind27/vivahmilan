import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const skip = (page - 1) * limit;

  // Filters
  const ageMin = searchParams.get('ageMin');
  const ageMax = searchParams.get('ageMax');
  const religion = searchParams.get('religion');
  const country = searchParams.get('country');
  const state = searchParams.get('state');
  const city = searchParams.get('city');
  const education = searchParams.get('education');
  const profession = searchParams.get('profession');
  const heightMin = searchParams.get('heightMin');
  const heightMax = searchParams.get('heightMax');
  const gender = searchParams.get('gender');
  const maritalStatus = searchParams.get('maritalStatus');

  // Get current user profile to determine opposite gender
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  const oppositeGender = currentUser?.profile?.gender === 'MALE' ? 'FEMALE' : 'MALE';

  // Build date range for age filter
  const now = new Date();
  const dobMax = (ageMin && !isNaN(parseInt(ageMin))) ? new Date(now.getFullYear() - parseInt(ageMin), now.getMonth(), now.getDate()) : undefined;
  const dobMin = (ageMax && !isNaN(parseInt(ageMax))) ? new Date(now.getFullYear() - parseInt(ageMax), now.getMonth(), now.getDate()) : undefined;

  // Get blocked user IDs
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: session.user.id }, { blockedId: session.user.id }] },
  });
  const blockedIds = blocks.map(b => b.blockerId === session.user.id ? b.blockedId : b.blockerId);

  const where = {
    id: { not: session.user.id, notIn: blockedIds },
    isActive: true,
    profile: {
      gender: gender || oppositeGender,
      ...(religion && { religion }),
      ...(country && { country }),
      ...(state && { state }),
      ...(city && { city }),
      ...(education && { education }),
      ...(profession && { profession }),
      ...(maritalStatus && { maritalStatus }),
      ...(dobMin || dobMax ? { dob: { ...(dobMin && { gte: dobMin }), ...(dobMax && { lte: dobMax }) } } : {}),
      ...(heightMin || heightMax ? { height: { ...(heightMin && { gte: parseInt(heightMin) }), ...(heightMax && { lte: parseInt(heightMax) }) } } : {}),
    },
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true, photos: { where: { isMain: true }, take: 1 } },
      skip,
      take: limit,
      orderBy: [{ isPremium: 'desc' }, { profileBoost: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}
