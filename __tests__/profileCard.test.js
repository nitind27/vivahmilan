/**
 * Feature: matrimonial-ui-improvements
 * Property 2: Match cards always link to profile
 * Validates: Requirements 6.1
 */

import React from 'react';
import { render } from '@testing-library/react';
import fc from 'fast-check';

// ── Mocks ─────────────────────────────────────────────────────────────────────

global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return function MockLink({ href, children, ...props }) {
    return React.createElement('a', { href, ...props }, children);
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
}));

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

jest.mock('@/components/SmartImage', () => {
  // eslint-disable-next-line react/display-name
  return function MockSmartImage({ src, alt, ...props }) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return React.createElement('img', { src, alt });
  };
});

jest.mock('@/components/VerifiedBadge', () => {
  // eslint-disable-next-line react/display-name
  return function MockVerifiedBadge() {
    return React.createElement('span', null, 'Verified');
  };
});

jest.mock('date-fns', () => ({
  differenceInYears: jest.fn(() => 25),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// ── Arbitrary ─────────────────────────────────────────────────────────────────

function arbitraryUser() {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    profile: fc.record({
      city: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
      country: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
      education: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      profession: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      religion: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
      dob: fc.option(fc.date({ min: new Date('1970-01-01'), max: new Date('2000-12-31') }).map(d => d.toISOString()), { nil: undefined }),
    }),
    photos: fc.array(fc.record({ url: fc.webUrl() }), { maxLength: 5 }),
    isPremium: fc.boolean(),
    verificationBadge: fc.boolean(),
    isShortlisted: fc.boolean(),
  });
}

// ── Import after mocks ────────────────────────────────────────────────────────

const ProfileCard = require('@/components/ProfileCard').default;

// ── Property Test ─────────────────────────────────────────────────────────────

describe('ProfileCard property tests', () => {
  /**
   * Property 2: Match cards always link to profile
   * Validates: Requirements 6.1
   */
  test('Property 2: Match cards always link to profile', () => {
    fc.assert(
      fc.property(arbitraryUser(), (user) => {
        const { container } = render(React.createElement(ProfileCard, { user }));
        const links = container.querySelectorAll(`a[href="/profile/${user.id}"]`);
        return links.length >= 1;
      }),
      { numRuns: 100 }
    );
  });
});
