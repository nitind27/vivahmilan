/**
 * Feature: matrimonial-ui-improvements
 * Unit tests for Navbar logo and color classes
 * Validates: Requirements 10.1
 */

import React from 'react';
import { render } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return React.createElement('a', { href, ...props }, children);
  };
});

jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        function MotionEl({ children, ...props }) {
          const {
            initial, animate, exit, transition, whileInView, viewport,
            whileHover, whileTap, variants, ...rest
          } = props;
          return React.createElement(tag, rest, children);
        },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }) => children,
  };
});

jest.mock('@/components/SmartImage', () => {
  return function MockSmartImage({ src, alt, ...props }) {
    return React.createElement('img', { src, alt, ...props });
  };
});

jest.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light', toggle: jest.fn(), mounted: true }),
}));

// ── Import component after mocks ──────────────────────────────────────────────

const Navbar = require('@/components/Navbar').default;

// ── Unit Tests ────────────────────────────────────────────────────────────────

describe('Navbar logo', () => {
  test('logo src is /logo/logo.png', () => {
    const { container } = render(React.createElement(Navbar));
    const logo = container.querySelector('img[src="/logo/logo.png"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('src')).toBe('/logo/logo.png');
  });

  test('logo alt is "Vivah Dwar Logo"', () => {
    const { container } = render(React.createElement(Navbar));
    const logo = container.querySelector('img[src="/logo/logo.png"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('alt')).toBe('Vivah Dwar Logo');
  });
});
