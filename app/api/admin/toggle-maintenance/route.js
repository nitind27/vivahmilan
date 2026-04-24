import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// Secret token to protect this endpoint
// Access: /api/admin/toggle-maintenance?token=YOUR_SECRET&value=1 (1=live, 0=maintenance)
const SECRET = process.env.MAINTENANCE_SECRET || 'vd-admin-secret-2024';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const value = searchParams.get('value'); // '1' = live, '0' = maintenance

  if (token !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newValue = value === '0' ? '0' : '1'; // default to live if not specified

  const existing = await queryOne("SELECT id FROM siteconfig WHERE `key` = 'maintenance_mode'");
  if (existing) {
    await execute("UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = 'maintenance_mode'", [newValue]);
  } else {
    await execute(
      "INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, 'maintenance_mode', ?, NOW(), NOW())",
      [randomUUID(), newValue]
    );
  }

  const status = newValue === '1' ? '🟢 Site is LIVE' : '🔴 Maintenance mode ON';
  return NextResponse.json({ success: true, value: newValue, status });
}
