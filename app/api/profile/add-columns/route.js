import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// One-time migration: add missing partner preference columns
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results = [];
  const columns = [
    { name: 'partnerCaste',        sql: 'ALTER TABLE profile ADD COLUMN partnerCaste VARCHAR(255) NULL' },
    { name: 'partnerProfession',   sql: 'ALTER TABLE profile ADD COLUMN partnerProfession VARCHAR(255) NULL' },
    { name: 'partnerMaritalStatus',sql: 'ALTER TABLE profile ADD COLUMN partnerMaritalStatus VARCHAR(100) NULL' },
    { name: 'partnerManglik',      sql: 'ALTER TABLE profile ADD COLUMN partnerManglik VARCHAR(50) NULL' },
  ];

  for (const col of columns) {
    try {
      await execute(col.sql);
      results.push({ column: col.name, status: 'added' });
    } catch (err) {
      // ER_DUP_FIELDNAME means column already exists — that's fine
      if (err.code === 'ER_DUP_FIELDNAME') {
        results.push({ column: col.name, status: 'already exists' });
      } else {
        results.push({ column: col.name, status: 'error', message: err.message });
      }
    }
  }

  return NextResponse.json({ results });
}
