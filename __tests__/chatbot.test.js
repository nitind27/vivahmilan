/**
 * Feature: matrimonial-ui-improvements
 * Property 4: Chatbot pricing uses rupee symbol
 * Validates: Requirements 11.2
 */

import fc from 'fast-check';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => {
  // eslint-disable-next-line react/display-name
  return function MockImage({ src, alt, ...props }) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return require('react').createElement('img', { src, alt, ...props });
  };
});

jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return function MockLink({ href, children, ...props }) {
    return require('react').createElement('a', { href, ...props }, children);
  };
});

jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        // eslint-disable-next-line react/display-name
        function MotionEl({ children, ...props }) {
          const {
            initial, animate, exit, transition, whileInView, viewport,
            whileHover, whileTap, style, variants, ...rest
          } = props;
          return React.createElement(tag, { style, ...rest }, children);
        },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }) => children,
  };
});

// Mock fetch globally
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

// ── Import after mocks ────────────────────────────────────────────────────────

const { normalizePricing } = require('@/components/ChatBot');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('normalizePricing', () => {
  /**
   * Task 9.3: Unit test for normalizePricing
   * Validates: Requirements 11.2
   */
  test('replaces dollar sign with rupee symbol', () => {
    expect(normalizePricing('Silver plan costs $749/month')).toBe(
      'Silver plan costs ₹749/month'
    );
  });

  /**
   * Task 9.2: Property 4 — Chatbot pricing uses rupee symbol
   * Validates: Requirements 11.2
   */
  test('Property 4: Chatbot pricing uses rupee symbol', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99999 }), (price) => {
        const input = `Plan costs $${price}/month`;
        const output = normalizePricing(input);
        return output.includes(`₹${price}`) && !output.includes(`$${price}`);
      }),
      { numRuns: 100 }
    );
  });
});
