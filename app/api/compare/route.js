import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';
import { computeKundaliMatch, parseKundaliRow } from '@/lib/kundaliMatch.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
  if (ids.length < 2) {
    return NextResponse.json({ error: 'Provide at least 2 profile ids via ?ids=' }, { status: 400 });
  }

  const me = await queryOne(
    `SELECT p.gender FROM profile p WHERE p.userId = ?`,
    [session.user.id]
  );

  const placeholders = ids.map(() => '?').join(',');
  const users = await query(
    `SELECT u.id, u.name, u.isPremium, u.verificationBadge,
            p.gender, p.dob, p.height, p.religion, p.caste, p.education, p.profession,
            p.city, p.state, p.maritalStatus, p.income, p.motherTongue, p.aboutMe, p.profileComplete
     FROM \`user\` u
     LEFT JOIN profile p ON p.userId = u.id
     WHERE u.id IN (${placeholders}) AND u.isActive = 1`,
    ids
  );

  if (users.length < 2) {
    return NextResponse.json({ error: 'Could not load enough profiles' }, { status: 404 });
  }

  const kundalis = await query(
    `SELECT * FROM kundali WHERE userId IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  const kMap = Object.fromEntries(kundalis.map(k => [k.userId, parseKundaliRow(k)]));

  const photos = await query(
    `SELECT userId, url FROM photo WHERE userId IN (${ids.map(() => '?').join(',')}) AND isMain = 1`,
    ids
  );
  const photoMap = Object.fromEntries(photos.map(p => [p.userId, p.url]));

  const myKundali = await queryOne('SELECT * FROM kundali WHERE userId = ?', [session.user.id]);
  const myK = parseKundaliRow(myKundali);

  const profiles = users.map(u => {
    const entry = {
      id: u.id,
      name: u.name,
      isPremium: !!u.isPremium,
      verificationBadge: !!u.verificationBadge,
      photo: photoMap[u.id] || null,
      profile: {
        gender: u.gender,
        dob: u.dob,
        height: u.height,
        religion: u.religion,
        caste: u.caste,
        education: u.education,
        profession: u.profession,
        city: u.city,
        state: u.state,
        maritalStatus: u.maritalStatus,
        income: u.income,
        motherTongue: u.motherTongue,
        aboutMe: u.aboutMe,
        profileComplete: u.profileComplete,
      },
      kundali: kMap[u.id] ? {
        rashi: kMap[u.id].rashi,
        nakshatra: kMap[u.id].nakshatra,
        lagna: kMap[u.id].lagna,
        manglik: !!kMap[u.id].manglik,
      } : null,
      gunaMatch: null,
    };

    if (myK && kMap[u.id]) {
      entry.gunaMatch = computeKundaliMatch(
        myK,
        kMap[u.id],
        me || {},
        { gender: u.gender },
        'You',
        u.name
      );
    }

    return entry;
  });

  return NextResponse.json({ profiles, orderedIds: ids });
}
