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
