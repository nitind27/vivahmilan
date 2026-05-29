import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { fetchKundaliMatch } from '@/lib/kundaliMatchService.js';
import { generateKundaliMatchPdf } from '@/lib/kundaliMatchPdf.js';
import { hasPremiumFeature } from '@/lib/planPermissions.js';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const canPdf = await hasPremiumFeature(decoded.id, 'kundaliMatchPdf');
  if (!canPdf) {
    return NextResponse.json({ locked: true, message: 'Premium required for PDF download.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId') || searchParams.get('userId');
  const lang = searchParams.get('lang') === 'hi' ? 'hi' : 'en';
  const format = searchParams.get('format') || 'binary';
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 });

  const result = await fetchKundaliMatch(decoded.id, partnerId);
  if (result.error) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }

  const pdfBuffer = await generateKundaliMatchPdf(result.match, 'Milan Matrimony', lang);
  const filename = `kundali-match-${partnerId.slice(0, 8)}.pdf`;

  if (format === 'base64') {
    return NextResponse.json({
      filename,
      contentType: 'application/pdf',
      base64: pdfBuffer.toString('base64'),
      match: {
        totalGunas: result.match.totalGunas,
        maxGunas: result.match.maxGunas,
        percentage: result.match.percentage,
        verdict: result.match.verdict,
      },
    });
  }

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
