/**
 * Feature: matrimonial-ui-improvements
 * Property 1: No "Milan" brand text in rendered UI
 * Validates: Requirements 2.1
 */

import React from 'react';
import { render } from '@testing-library/react';
import fc from 'fast-check';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// jsdom doesn't implement HTMLMediaElement.play — mock it globally
global.Audio = class {
  constructor() {
    this.volume = 1;
    this.currentTime = 0;
  }
  play() { return Promise.resolve(); }
  pause() {}
};

// Mock fetch globally (ChatBot calls fetch in useEffect)
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

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
    return React.createElement('img', { src, alt, ...props });
  };
});

jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
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
        // eslint-disable-next-line react/display-name
        function MotionEl({ children, ...props }) {
          // Strip framer-motion-specific props
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

jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return React.createElement('nav', null, 'Vivah Dwar Nav');
  };
});

// ── Import page components after mocks ────────────────────────────────────────

// We import lazily inside the test to ensure mocks are applied first.
// Using require() here so Jest mock hoisting works correctly.
const getPageComponents = () => {
  const HomePage = require('@/app/page').default;
  const ChatBot = require('@/components/ChatBot').default;
  return [HomePage, ChatBot];
};

// ── Property Test ─────────────────────────────────────────────────────────────

describe('Brand text property tests', () => {
  /**
   * Property 1: No "Milan" brand text in rendered UI
   * Validates: Requirements 2.1
   */
  test('Property 1: No "Milan" brand text in rendered UI', () => {
    const pageComponents = getPageComponents();

    fc.assert(
      fc.property(fc.constantFrom(...pageComponents), (Component) => {
        const { container } = render(React.createElement(Component));
        const text = container.textContent;
        return !/\bMilan\b/.test(text);
      }),
      { numRuns: 100 }
    );
  });
});
