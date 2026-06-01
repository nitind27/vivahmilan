import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { isFamilyRole, familyForbiddenResponse } from '@/lib/flutterFamilyGuard';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/** GET /api/flutter/family-access — list family logins (owner only) */
export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  if (isFamilyRole(decoded)) {
    return NextResponse.json({ error: 'Family members cannot manage family access' }, { status: 403 });
  }

  await ensureFeatureTables();
  const members = await query(
    `SELECT id, memberName, email, relationship, isActive, createdAt
     FROM familyaccess WHERE ownerUserId = ? ORDER BY createdAt DESC`,
    [decoded.id]
  );
  return NextResponse.json({ members, maxAllowed: 3 });
}

/** POST /api/flutter/family-access — add family login (owner only, max 3) */
export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  if (isFamilyRole(decoded)) return familyForbiddenResponse('manage family access');

  const { memberName, email, password, relationship } = await req.json();
  if (!memberName?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  await ensureFeatureTables();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await queryOne('SELECT id FROM familyaccess WHERE email = ?', [normalizedEmail]);
  if (existing) {
    return NextResponse.json({ error: 'Email already used for family access' }, { status: 409 });
  }

  const count = await queryOne('SELECT COUNT(*) AS cnt FROM familyaccess WHERE ownerUserId = ?', [decoded.id]);
  if (Number(count?.cnt) >= 3) {
    return NextResponse.json({ error: 'Maximum 3 family logins allowed', code: 'FAMILY_LIMIT' }, { status: 400 });
  }

  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  await execute(
    `INSERT INTO familyaccess (id, ownerUserId, memberName, email, password, relationship)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, decoded.id, memberName.trim(), normalizedEmail, hash, relationship || 'Parent']
  );

  return NextResponse.json({
    id,
    success: true,
    member: {
      id,
      memberName: memberName.trim(),
      email: normalizedEmail,
      relationship: relationship || 'Parent',
      isActive: true,
    },
  }, { status: 201 });
}

/** DELETE /api/flutter/family-access?id=... */
export async function DELETE(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  if (isFamilyRole(decoded)) return familyForbiddenResponse('manage family access');

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await ensureFeatureTables();
  await execute('DELETE FROM familyaccess WHERE id = ? AND ownerUserId = ?', [id, decoded.id]);
  return NextResponse.json({ success: true });
}
