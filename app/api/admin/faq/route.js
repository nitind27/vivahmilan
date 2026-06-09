import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ensureFaqTable, formatFaqRow } from '@/lib/faq';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureFaqTable();
  const rows = await query('SELECT * FROM faqitem ORDER BY category ASC, sortOrder ASC, createdAt ASC');
  return NextResponse.json(rows.map(formatFaqRow));
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureFaqTable();
  const body = await req.json();
  const {
    id,
    category,
    question,
    answer,
    icon,
    sortOrder,
    isActive,
    showOnBlog,
    showOnHelp,
  } = body;

  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
  }

  const data = {
    category: category?.trim() || 'General',
    question: question.trim(),
    answer: answer.trim(),
    icon: icon?.trim() || 'HelpCircle',
    sortOrder: Number(sortOrder) || 0,
    isActive: isActive !== false ? 1 : 0,
    showOnBlog: showOnBlog !== false ? 1 : 0,
    showOnHelp: showOnHelp !== false ? 1 : 0,
  };

  if (id) {
    await execute(
      `UPDATE faqitem SET category = ?, question = ?, answer = ?, icon = ?, sortOrder = ?,
       isActive = ?, showOnBlog = ?, showOnHelp = ?, updatedAt = NOW() WHERE id = ?`,
      [data.category, data.question, data.answer, data.icon, data.sortOrder, data.isActive, data.showOnBlog, data.showOnHelp, id]
    );
    const updated = await queryOne('SELECT * FROM faqitem WHERE id = ?', [id]);
    return NextResponse.json(formatFaqRow(updated));
  }

  const newId = randomUUID();
  await execute(
    `INSERT INTO faqitem (id, category, question, answer, icon, sortOrder, isActive, showOnBlog, showOnHelp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId, data.category, data.question, data.answer, data.icon, data.sortOrder, data.isActive, data.showOnBlog, data.showOnHelp]
  );
  const created = await queryOne('SELECT * FROM faqitem WHERE id = ?', [newId]);
  return NextResponse.json(formatFaqRow(created), { status: 201 });
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureFaqTable();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await execute('DELETE FROM faqitem WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
