import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET — fetch options by category (public)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  if (!category) {
    const all = await query(
      'SELECT * FROM profileoption ORDER BY category ASC, sortOrder ASC'
    );
    return NextResponse.json(all);
  }

  const options = await query(
    'SELECT id, value, label, `group`, sortOrder FROM profileoption WHERE category = ? AND isActive = 1 ORDER BY sortOrder ASC, label ASC',
    [category]
  );
  return NextResponse.json(options);
}

// POST — add new option (admin only)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { category, value, label, group, sortOrder } = await req.json();
  if (!category || !value || !label) return NextResponse.json({ error: 'category, value, label required' }, { status: 400 });

  const existing = await queryOne(
    'SELECT id FROM profileoption WHERE category = ? AND value = ?',
    [category, value.trim()]
  );
  if (existing) return NextResponse.json({ error: 'Option already exists' }, { status: 409 });

  const id = randomUUID();
  await execute(
    'INSERT INTO profileoption (id, category, value, label, `group`, sortOrder, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
    [id, category, value.trim(), label.trim(), group || null, sortOrder || 0]
  );

  const option = await queryOne('SELECT * FROM profileoption WHERE id = ?', [id]);
  return NextResponse.json(option, { status: 201 });
}

// PATCH — update option (admin only)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, label, group, sortOrder, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const sets = [];
  const params = [];
  if (label !== undefined)     { sets.push('label = ?');     params.push(label); }
  if (group !== undefined)     { sets.push('`group` = ?');   params.push(group || null); }
  if (sortOrder !== undefined) { sets.push('sortOrder = ?'); params.push(sortOrder); }
  if (isActive !== undefined)  { sets.push('isActive = ?');  params.push(isActive ? 1 : 0); }

  if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  await execute(`UPDATE profileoption SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  const option = await queryOne('SELECT * FROM profileoption WHERE id = ?', [id]);
  return NextResponse.json(option);
}

// DELETE — remove option (admin only)
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await execute('DELETE FROM profileoption WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
