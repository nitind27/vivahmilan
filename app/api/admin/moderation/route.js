import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

  const items = [];

  if (type === 'all' || type === 'profiles') {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.createdAt, u.isPremium,
              p.gender, p.city, p.profileComplete, ph.url AS photo,
              'profile' AS queueType, 'Pending profile approval' AS queueLabel
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE u.role = 'USER' AND u.adminVerified = 0 AND u.isActive = 1
       ORDER BY u.createdAt ASC LIMIT ?`,
      [limit]
    );
    items.push(...rows);
  }

  if (type === 'all' || type === 'kyc') {
    const rows = await query(
      `SELECT d.id, d.type, d.status, d.createdAt, d.url,
              u.id AS userId, u.name, u.email, u.phone, ph.url AS photo,
              'kyc' AS queueType, CONCAT('KYC document: ', d.type) AS queueLabel
       FROM document d
       JOIN \`user\` u ON u.id = d.userId
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE d.status = 'PENDING'
       ORDER BY d.createdAt ASC LIMIT ?`,
      [limit]
    );
    items.push(...rows.map(r => ({ ...r, id: r.id, userId: r.userId })));
  }

  if (type === 'all' || type === 'reports') {
    const rows = await query(
      `SELECT r.id, r.reason, r.details, r.createdAt, r.status,
              u.id AS userId, u.name AS targetName, ph.url AS photo,
              rep.name AS reporterName,
              'report' AS queueType, CONCAT('Report: ', r.reason) AS queueLabel
       FROM report r
       JOIN \`user\` u ON u.id = r.targetId
       JOIN \`user\` rep ON rep.id = r.reporterId
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE r.status = 'PENDING'
       ORDER BY r.createdAt ASC LIMIT ?`,
      [limit]
    );
    items.push(...rows);
  }

  items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const counts = {
    profiles: items.filter(i => i.queueType === 'profile').length,
    kyc: items.filter(i => i.queueType === 'kyc').length,
    reports: items.filter(i => i.queueType === 'report').length,
    total: items.length,
  };

  return NextResponse.json({ items: items.slice(0, limit), counts });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action, userIds, documentIds, reportIds } = await req.json();

  if (action === 'approve_profiles' && userIds?.length) {
    const placeholders = userIds.map(() => '?').join(',');
    await execute(
      `UPDATE \`user\` SET adminVerified = 1 WHERE id IN (${placeholders}) AND role = 'USER'`,
      userIds
    );
    return NextResponse.json({ success: true, count: userIds.length });
  }

  if (action === 'approve_documents' && documentIds?.length) {
    const placeholders = documentIds.map(() => '?').join(',');
    await execute(`UPDATE document SET status = 'APPROVED' WHERE id IN (${placeholders})`, documentIds);
    return NextResponse.json({ success: true, count: documentIds.length });
  }

  if (action === 'resolve_reports' && reportIds?.length) {
    const placeholders = reportIds.map(() => '?').join(',');
    await execute(`UPDATE report SET status = 'RESOLVED' WHERE id IN (${placeholders})`, reportIds);
    return NextResponse.json({ success: true, count: reportIds.length });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
