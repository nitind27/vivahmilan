import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ensureAboutTables } from '@/lib/about';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureAboutTables();

  const settingsRows = await query('SELECT `key`, value FROM about_setting');
  const settings = {};
  for (const row of settingsRows) settings[row.key] = row.value;

  const values = await query('SELECT * FROM about_value ORDER BY sortOrder ASC');
  const milestones = await query('SELECT * FROM about_milestone ORDER BY sortOrder ASC');

  return NextResponse.json({
    settings,
    values: values.map((v) => ({ ...v, isActive: !!v.isActive })),
    milestones: milestones.map((m) => ({ ...m, isActive: !!m.isActive })),
  });
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureAboutTables();
  const body = await req.json();
  const { type } = body;

  if (type === 'settings') {
    const { settings } = body;
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings object required' }, { status: 400 });
    }
    for (const [key, value] of Object.entries(settings)) {
      const existing = await queryOne('SELECT `key` FROM about_setting WHERE `key` = ?', [key]);
      if (existing) {
        await execute('UPDATE about_setting SET value = ?, updatedAt = NOW() WHERE `key` = ?', [String(value), key]);
      } else {
        await execute('INSERT INTO about_setting (`key`, value) VALUES (?, ?)', [key, String(value)]);
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (type === 'value') {
    const { id, icon, title, description, sortOrder, isActive } = body;
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'title and description required' }, { status: 400 });
    }
    if (id) {
      await execute(
        'UPDATE about_value SET icon = ?, title = ?, description = ?, sortOrder = ?, isActive = ?, updatedAt = NOW() WHERE id = ?',
        [icon || 'Heart', title.trim(), description.trim(), Number(sortOrder) || 0, isActive !== false ? 1 : 0, id]
      );
      return NextResponse.json({ ok: true });
    }
    const newId = randomUUID();
    await execute(
      'INSERT INTO about_value (id, icon, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, icon || 'Heart', title.trim(), description.trim(), Number(sortOrder) || 0, isActive !== false ? 1 : 0]
    );
    return NextResponse.json({ id: newId }, { status: 201 });
  }

  if (type === 'milestone') {
    const { id, year, title, description, sortOrder, isActive } = body;
    if (!year?.trim() || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'year, title and description required' }, { status: 400 });
    }
    if (id) {
      await execute(
        'UPDATE about_milestone SET year = ?, title = ?, description = ?, sortOrder = ?, isActive = ?, updatedAt = NOW() WHERE id = ?',
        [year.trim(), title.trim(), description.trim(), Number(sortOrder) || 0, isActive !== false ? 1 : 0, id]
      );
      return NextResponse.json({ ok: true });
    }
    const newId = randomUUID();
    await execute(
      'INSERT INTO about_milestone (id, year, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, year.trim(), title.trim(), description.trim(), Number(sortOrder) || 0, isActive !== false ? 1 : 0]
    );
    return NextResponse.json({ id: newId }, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureAboutTables();
  const { type, id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (type === 'value') {
    await execute('DELETE FROM about_value WHERE id = ?', [id]);
  } else if (type === 'milestone') {
    await execute('DELETE FROM about_milestone WHERE id = ?', [id]);
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
