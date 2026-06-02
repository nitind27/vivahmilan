import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { tryAssignEarlyBirdToUser, getEarlyBirdOfferForUser, markEarlyBirdPopupSeen } from '@/lib/earlyBird';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Please login first' }, { status: 401 });
  }

  try {
    const before = await getEarlyBirdOfferForUser(session.user.id);
    if (before.status === 'active') {
      await markEarlyBirdPopupSeen(session.user.id);
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        message: 'You already have Early Bird access active.',
        offer: before,
        showPopup: false,
      });
    }
    if (before.status === 'sold_out') {
      return NextResponse.json({
        error: before.message || 'All Early Bird slots are full.',
        code: 'SOLD_OUT',
      }, { status: 403 });
    }
    if (before.status === 'disabled') {
      return NextResponse.json({ error: 'Early Bird offer is not active.', code: 'DISABLED' }, { status: 403 });
    }

    const result = await tryAssignEarlyBirdToUser(session.user.id);
    if (!result.assigned) {
      const codes = {
        limit_reached: 'SOLD_OUT',
        disabled: 'DISABLED',
        already_assigned: 'ALREADY_ACTIVE',
      };
      return NextResponse.json({
        error: result.reason === 'limit_reached'
          ? 'Sorry, all free slots have been claimed.'
          : 'Could not activate Early Bird access.',
        code: codes[result.reason] || 'CLAIM_FAILED',
      }, { status: 403 });
    }

    await markEarlyBirdPopupSeen(session.user.id);
    const offer = await getEarlyBirdOfferForUser(session.user.id);
    return NextResponse.json({
      success: true,
      message: `🎉 Free ${result.planDisplayName || result.planId} access activated for ${result.durationLabel}!`,
      result,
      offer,
      showPopup: false,
    });
  } catch (err) {
    console.error('[early-bird/claim]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
