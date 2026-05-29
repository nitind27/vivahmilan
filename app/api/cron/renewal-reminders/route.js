import { NextResponse } from 'next/server';
import { processRenewalReminders } from '@/lib/cronRenewalReminders.js';

export async function GET(req) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processRenewalReminders();
  return NextResponse.json({ ok: true, ...result });
}
