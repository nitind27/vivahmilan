import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import {
  getDonationStats,
  listExpenditures,
  listActiveCampaigns,
  DONATION_CATEGORIES,
} from '@/lib/donation.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureFeatureTables();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';

  let where = '';
  const params = [];
  if (status) {
    where = ' WHERE d.status = ?';
    params.push(status);
  }

  const payments = await query(
    `SELECT d.*, c.title AS campaignTitle
     FROM donation_payment d
     LEFT JOIN donation_campaign c ON c.id = d.campaignId
     ${where}
     ORDER BY d.createdAt DESC
     LIMIT 200`,
    params
  );

  const campaigns = await query(
    `SELECT c.*,
      (SELECT COALESCE(SUM(p.amount), 0) FROM donation_payment p
       WHERE p.campaignId = c.id AND p.status = 'PAID') AS raisedAmount
     FROM donation_campaign c
     ORDER BY c.sortOrder ASC, c.createdAt DESC`
  );

  const [stats, expenditures] = await Promise.all([
    getDonationStats(),
    listExpenditures({ limit: 100 }),
  ]);

  return NextResponse.json({
    stats,
    payments,
    campaigns,
    expenditures,
    categories: DONATION_CATEGORIES,
  });
}
