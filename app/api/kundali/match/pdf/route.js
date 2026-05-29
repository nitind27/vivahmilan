import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchKundaliMatch } from '@/lib/kundaliMatchService.js';
import { generateKundaliMatchPdf } from '@/lib/kundaliMatchPdf.js';
import { hasPremiumFeature } from '@/lib/planPermissions.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canPdf = await hasPremiumFeature(session.user.id, 'kundaliMatchPdf');
  if (!canPdf) {
    return NextResponse.json({
      locked: true,
      message: 'Upgrade to premium to download Kundali Match PDF reports.',
    }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId') || searchParams.get('userId');
  const lang = searchParams.get('lang') === 'hi' ? 'hi' : 'en';
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 });

  const result = await fetchKundaliMatch(session.user.id, partnerId);
  if (result.error) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }

  const pdfBuffer = await generateKundaliMatchPdf(result.match, 'Milan Matrimony', lang);
  const filename = `kundali-match-${partnerId.slice(0, 8)}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
