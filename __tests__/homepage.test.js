/**
 * Feature: matrimonial-ui-improvements
 * Unit tests for home page color classes
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import React from 'react';
import { render } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

global.Audio = class {
  constructor() {
    this.volume = 1;
    this.currentTime = 0;
  }
  play() { return Promise.resolve(); }
  pause() {}
};

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
  return function MockLink({ href, children, className, ...props }) {
    return React.createElement('a', { href, className, ...props }, children);
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

jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return React.createElement('nav', null, 'Vivah Dwar Nav');
  };
});

// ── Import after mocks ────────────────────────────────────────────────────────

const HomePage = require('@/app/page').default;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Home page color class tests', () => {
  let container;

  beforeEach(() => {
    ({ container } = render(React.createElement(HomePage)));
  });

  test('hero search button has vd-gradient-gold class', () => {
    // The hero search button is a Link rendered as <a> with vd-gradient-gold class
    const goldButtons = container.querySelectorAll('.vd-gradient-gold');
    const searchButton = Array.from(goldButtons).find(el =>
      el.textContent.includes('Find Your Match')
    );
    expect(searchButton).toBeTruthy();
  });

  test('footer logo alt equals "Vivah Dwar"', () => {
    const images = container.querySelectorAll('img');
    const footerLogo = Array.from(images).find(img =>
      img.getAttribute('src') === '/logo/logo.png' &&
      img.getAttribute('alt') === 'Vivah Dwar'
    );
    expect(footerLogo).toBeTruthy();
    expect(footerLogo.getAttribute('alt')).toBe('Vivah Dwar');
  });
});
