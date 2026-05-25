import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

function buildFilters({ search, gender, status }) {
  const userConds = ["u.role = 'USER'"];
  const params = [];

  if (search) {
    const term = search.trim();
    if (term.includes('@')) {
      userConds.push('u.email LIKE ?');
      params.push(`${term}%`);
    } else if (/^\+?\d{4,}$/.test(term.replace(/\s/g, ''))) {
      userConds.push('u.phone LIKE ?');
      params.push(`${term.replace(/\s/g, '')}%`);
    } else if (term.length >= 2) {
      userConds.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      params.push(`${term}%`, `${term}%`, `${term}%`);
    }
  }

  if (status === 'premium') userConds.push('u.isPremium = 1');
  if (status === 'verified') userConds.push('u.adminVerified = 1');
  if (status === 'pending') userConds.push('u.adminVerified = 0 AND u.isActive = 1');
  if (status === 'blocked') userConds.push('u.isActive = 0');

  const profileConds = [];
  if (gender) {
    profileConds.push('p.gender = ?');
    params.push(gender);
  }

  return { userConds, profileConds, params };
}

function buildWhere({ userConds, profileConds }) {
  const parts = [...userConds];
  if (profileConds.length) {
    parts.push(`EXISTS (SELECT 1 FROM profile p WHERE p.userId = u.id AND ${profileConds.join(' AND ')})`);
  }
  return `WHERE ${parts.join(' AND ')}`;
}

function buildCountSql({ userConds, profileConds }) {
  const parts = [...userConds];
  if (profileConds.length) {
    parts.push(`EXISTS (SELECT 1 FROM profile p WHERE p.userId = u.id AND ${profileConds.join(' AND ')})`);
  }
  return `SELECT COUNT(*) AS cnt FROM \`user\` u WHERE ${parts.join(' AND ')}`;
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const gender = searchParams.get('gender') || '';
  const status = searchParams.get('status') || '';
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skipTotal = searchParams.get('skipTotal') === '1';
  const cursorAt = searchParams.get('cursorAt');
  const cursorId = searchParams.get('cursorId');

  const { userConds, profileConds, params } = buildFilters({ search, gender, status });

  if (search.trim() && search.trim().length < 2 && !search.includes('@') && !/^\d/.test(search.trim())) {
    return NextResponse.json({
      members: [],
      total: 0,
      hasMore: false,
      nextCursor: null,
      message: 'Enter at least 2 characters to search',
    });
  }

  const where = buildWhere({ userConds, profileConds });
  const dataParams = [...params];

  let cursorSql = '';
  if (cursorAt && cursorId) {
    cursorSql = 'AND (u.createdAt, u.id) < (?, ?)';
    dataParams.push(cursorAt, cursorId);
  }

  const rowsSql = `
    SELECT u.id, u.name, u.email, u.phone, u.image, u.isPremium, u.isVerified,
           u.adminVerified, u.isActive, u.createdAt, u.lastLoginAt,
           p.gender, p.dob, p.religion, p.caste, p.city, p.state, p.country,
           p.education, p.profession, p.profileComplete
    FROM \`user\` u
    LEFT JOIN profile p ON p.userId = u.id
    ${where}
    ${cursorSql}
    ORDER BY u.createdAt DESC, u.id DESC
    LIMIT ?
  `;
  dataParams.push(limit + 1);

  const rowsPromise = query(rowsSql, dataParams);
  const countPromise = skipTotal
    ? Promise.resolve(null)
    : queryOne(buildCountSql({ userConds, profileConds }), params);

  let rows;
  let countRow;
  try {
    [rows, countRow] = await Promise.all([rowsPromise, countPromise]);
  } catch (err) {
    console.error('Admin members query failed:', err.message);
    return NextResponse.json({ error: 'Failed to load members. Please try again.' }, { status: 500 });
  }

  const hasMore = rows.length > limit;
  const members = hasMore ? rows.slice(0, limit) : rows;

  if (members.length) {
    const ids = members.map(m => m.id);
    const photos = await query(
      `SELECT userId, url FROM photo WHERE userId IN (${ids.map(() => '?').join(',')}) AND isMain = 1`,
      ids
    );
    const photoMap = Object.fromEntries(photos.map(p => [p.userId, p.url]));
    for (const m of members) {
      m.mainPhoto = photoMap[m.id] || m.image || null;
    }
  }

  const last = members[members.length - 1];
  const nextCursor = hasMore && last
    ? { cursorAt: last.createdAt, cursorId: last.id }
    : null;

  return NextResponse.json({
    members,
    total: countRow ? Number(countRow.cnt ?? 0) : undefined,
    hasMore,
    nextCursor,
    limit,
  });
}
