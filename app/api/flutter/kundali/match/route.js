import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { fetchKundaliMatch } from '@/lib/kundaliMatchService.js';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId') || searchParams.get('userId');
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 });

  const result = await fetchKundaliMatch(decoded.id, partnerId);
  if (result.error) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }

  return NextResponse.json(result.match);
}
