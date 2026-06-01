import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { normalizePlans, parsePlanPermissions } from '@/lib/plans.js';

/** GET /api/flutter/plans — public, no auth required */
export async function GET() {
  try {
    const rows = await query(
      `SELECT plan, displayName, price, durationDays, description, permissions, isActive
       FROM planconfig WHERE isActive = 1 ORDER BY price ASC`
    );
    const plans = normalizePlans(rows || [])
      .filter(p => p.plan !== 'FREE')
      .map(p => ({
        ...p,
        permissions: parsePlanPermissions(p.permissions),
      }));

    return NextResponse.json({ success: true, plans });
  } catch (err) {
    console.error('Flutter plans error:', err);
    return NextResponse.json({ error: 'Failed to load plans', code: 'PLANS_LOAD_FAILED' }, { status: 500 });
  }
}
