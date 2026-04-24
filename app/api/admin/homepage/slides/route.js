import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET all slides
export async function GET() {
  const slides = await query('SELECT * FROM homepage_slide WHERE isActive = 1 ORDER BY sortOrder ASC');
  return NextResponse.json(slides);
}

// POST create/update slide
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, tag, headline, highlight, sub, sortOrder } = await req.json();

  if (id) {
    // Update
    await execute(
      'UPDATE homepage_slide SET tag = ?, headline = ?, highlight = ?, sub = ?, sortOrder = ?, updatedAt = NOW() WHERE id = ?',
      [tag, headline, highlight, sub, sortOrder || 0, id]
    );
  } else {
    // Create
    await execute(
      'INSERT INTO homepage_slide (id, tag, headline, highlight, sub, sortOrder, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
      [randomUUID(), tag, headline, highlight, sub, sortOrder || 0]
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE slide
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  await execute('DELETE FROM homepage_slide WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
