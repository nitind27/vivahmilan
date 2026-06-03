import { NextResponse } from 'next/server';
import { recordPageview } from '@/lib/pageviewTracking';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await recordPageview(req, body);
    if (!result.ok) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Track] error:', err.message);
    return NextResponse.json({ ok: false });
  }
}
