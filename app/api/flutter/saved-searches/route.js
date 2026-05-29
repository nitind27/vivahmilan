import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    await ensureFeatureTables();
    const rows = await query(
      'SELECT id, name, filters, alertEnabled, createdAt, updatedAt FROM savedsearch WHERE userId = ? ORDER BY updatedAt DESC',
      [decoded.id]
    );

    return NextResponse.json({
      searches: rows.map(r => ({
        ...r,
        filters: JSON.parse(r.filters || '{}'),
        alertEnabled: !!r.alertEnabled,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { name, filters, alertEnabled } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    await ensureFeatureTables();
    const id = crypto.randomUUID();
    await execute(
      'INSERT INTO savedsearch (id, userId, name, filters, alertEnabled) VALUES (?, ?, ?, ?, ?)',
      [id, decoded.id, name.trim(), JSON.stringify(filters || {}), alertEnabled ? 1 : 0]
    );
    return NextResponse.json({ id, success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await ensureFeatureTables();
    await execute('DELETE FROM savedsearch WHERE id = ? AND userId = ?', [id, decoded.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
