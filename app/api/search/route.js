import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page    = parseInt(searchParams.get('page')  || '1');
  const limit   = parseInt(searchParams.get('limit') || '12');
  const skip    = (page - 1) * limit;

  const q            = searchParams.get('q')            || '';
  const gender       = searchParams.get('gender')       || '';
  const religion     = searchParams.get('religion')     || '';
  const country      = searchParams.get('country')      || '';
  const state        = searchParams.get('state')        || '';
  const city         = searchParams.get('city')         || '';
  const education    = searchParams.get('education')    || '';
  const profession   = searchParams.get('profession')   || '';
  const maritalStatus = searchParams.get('maritalStatus') || '';
  const ageMin       = searchParams.get('ageMin')       || '';
  const ageMax       = searchParams.get('ageMax')       || '';
  const heightMin    = searchParams.get('heightMin')    || '';
  const heightMax    = searchParams.get('heightMax')    || '';

  // Get blocked IDs
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: session.user.id }, { blockedId: session.user.id }] },
  });
  const blockedIds = blocks.map(b => b.blockerId === session.user.id ? b.blockedId : b.blockerId);

  // Age → DOB range
  const now = new Date();
  const dobMax = (ageMin && !isNaN(+ageMin)) ? new Date(now.getFullYear() - +ageMin, now.getMonth(), now.getDate()) : undefined;
  const dobMin = (ageMax && !isNaN(+ageMax)) ? new Date(now.getFullYear() - +ageMax, now.getMonth(), now.getDate()) : undefined;

  // Text search across name + profile fields
  const textSearch = q ? {
    OR: [
      { name: { contains: q } },
      { profile: { city: { contains: q } } },
      { profile: { profession: { contains: q } } },
      { profile: { religion: { contains: q } } },
      { profile: { country: { contains: q } } },
      { profile: { education: { contains: q } } },
    ],
  } : {};

  const profileWhere = {
    ...(gender       && { gender }),
    ...(religion     && { religion }),
    ...(country      && { country }),
    ...(state        && { state: { contains: state } }),
    ...(city         && { city: { contains: city } }),
    ...(education    && { education }),
    ...(profession   && { profession: { contains: profession } }),
    ...(maritalStatus && { maritalStatus }),
    ...((dobMin || dobMax) && { dob: { ...(dobMin && { gte: dobMin }), ...(dobMax && { lte: dobMax }) } }),
    ...((heightMin || heightMax) && { height: { ...(heightMin && { gte: +heightMin }), ...(heightMax && { lte: +heightMax }) } }),
  };

  const where = {
    id: { not: session.user.id, notIn: blockedIds },
    isActive: true,
    ...textSearch,
    ...(Object.keys(profileWhere).length > 0 && { profile: profileWhere }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        photos: { where: { isMain: true }, take: 1 },
      },
      skip,
      take: limit,
      orderBy: [{ isPremium: 'desc' }, { profileBoost: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}
