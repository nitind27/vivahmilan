import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { runSeedGeneration } from '@/lib/seedProfiles.js';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { state, caste, religion = 'Hindu', males = 0, females = 0, perGender = 0 } = body;

  if (!state?.trim() || !caste?.trim()) {
    return NextResponse.json({ error: 'State and caste are required' }, { status: 400 });
  }

  const maleCount = parseInt(males, 10) || 0;
  const femaleCount = parseInt(females, 10) || 0;
  const pg = parseInt(perGender, 10) || 0;

  if (maleCount === 0 && femaleCount === 0 && pg === 0) {
    return NextResponse.json({ error: 'Set male count, female count, or per-gender count' }, { status: 400 });
  }

  if (maleCount > 500 || femaleCount > 500 || pg > 500) {
    return NextResponse.json({ error: 'Maximum 500 profiles per gender per request' }, { status: 400 });
  }

  try {
    const result = await runSeedGeneration({
      state: state.trim(),
      caste: caste.trim(),
      religion,
      males: maleCount,
      females: femaleCount,
      perGender: pg,
    });
    return NextResponse.json({
      success: true,
      message: 'Dummy profiles generated successfully',
      log: result.stdout,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
