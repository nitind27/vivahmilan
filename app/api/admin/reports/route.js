import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const reports = await query(
    `SELECT r.id, r.reason, r.details, r.status, r.createdAt,
            r.reporterId, rep.name as reporterName, rep.email as reporterEmail,
            r.targetId, tgt.name as targetName, tgt.email as targetEmail
     FROM report r
     JOIN \`user\` rep ON rep.id = r.reporterId
     JOIN \`user\` tgt ON tgt.id = r.targetId
     ORDER BY r.createdAt DESC`
  );

  const result = reports.map(r => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.createdAt,
    reporter: { id: r.reporterId, name: r.reporterName, email: r.reporterEmail },
    target:   { id: r.targetId,   name: r.targetName,   email: r.targetEmail },
  }));

  return NextResponse.json(result);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { reportId, status } = await req.json();
  await execute('UPDATE report SET status = ? WHERE id = ?', [status, reportId]);
  return NextResponse.json({ success: true });
}
