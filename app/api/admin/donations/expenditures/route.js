import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { DONATION_CATEGORIES } from '@/lib/donation.js';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureFeatureTables();
  const body = await req.json();
  const {
    title,
    description,
    amount,
    category = 'OTHER',
    campaignId = null,
    expenditureDate,
    receiptNote,
  } = body;

  const amt = Number(amount);
  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }
  if (!amt || amt <= 0) {
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
  }

  const cat = DONATION_CATEGORIES.some((c) => c.key === category) ? category : 'OTHER';
  const date = expenditureDate || new Date().toISOString().slice(0, 10);

  const id = randomUUID();
  await execute(
    `INSERT INTO donation_expenditure
      (id, title, description, amount, category, campaignId, expenditureDate, receiptNote,
       createdByAdminId, createdByAdminName, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      title.trim(),
      description.trim(),
      amt,
      cat,
      campaignId || null,
      date,
      (receiptNote || '').trim() || null,
      session.user.id,
      session.user.name || session.user.email,
    ]
  );

  return NextResponse.json({ success: true, id });
}
