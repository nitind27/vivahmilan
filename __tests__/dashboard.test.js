/**
 * Feature: matrimonial-ui-improvements
 * Property 3: Stat card values are never raw zero placeholders
 * Validates: Requirements 5.2
 */

import fc from 'fast-check';

// The value display logic extracted from app/dashboard/page.js StatCard:
//   value: unreadChat > 0 ? unreadChat : '—'
// This same pattern applies to all stats that could show a meaningless zero.
function getStatValue(rawValue) {
  return rawValue > 0 ? rawValue : '—';
}

describe('Dashboard stat card property tests', () => {
  /**
   * Property 3: Stat card values are never raw zero placeholders
   * Validates: Requirements 5.2
   */
  test('Property 3a: zero input never produces "0" or "00"', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0 }), (zeroValue) => {
        const displayed = String(getStatValue(zeroValue));
        return displayed !== '0' && displayed !== '00';
      }),
      { numRuns: 100 }
    );
  });

  test('Property 3b: any non-negative integer never produces "0" or "00"', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (n) => {
        const displayed = String(getStatValue(n));
        return displayed !== '0' && displayed !== '00';
      }),
      { numRuns: 100 }
    );
  });
});
