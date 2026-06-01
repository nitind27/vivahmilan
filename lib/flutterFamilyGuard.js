import { NextResponse } from 'next/server';

export function isFamilyRole(decoded) {
  return decoded?.role === 'FAMILY';
}

export function familyForbiddenResponse(action = 'perform this action') {
  return NextResponse.json({
    error: `Family login cannot ${action}`,
    code: 'FAMILY_READONLY',
  }, { status: 403 });
}

export function subscriptionOwnerOnlyResponse() {
  return NextResponse.json({
    error: 'Only the profile owner can purchase a subscription. Please login with the member account.',
    code: 'SUBSCRIPTION_OWNER_ONLY',
  }, { status: 403 });
}
