/**
 * Feature: matrimonial-ui-improvements
 * Unit tests for premium page active badge and FAQ accordion
 * Validates: Requirements 8.1, 8.2, 9.1, 9.2
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// ── Mutable session state ─────────────────────────────────────────────────────

let mockSession = null;
let mockSessionStatus = 'unauthenticated';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: mockSessionStatus }),
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return React.createElement('img', { src, alt, ...props });
  };
});

jest.mock('next/link', () => {
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

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: jest.fn(),
  toast: jest.fn(),
  error: jest.fn(),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
);

// ── Import page component after mocks ─────────────────────────────────────────

const PremiumPage = require('@/app/premium/page').default;

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSession = null;
  mockSessionStatus = 'unauthenticated';
  jest.clearAllMocks();
});

describe('Premium page — active plan badge', () => {
  test('renders "Active Plan" badge on the correct plan card when isPremium === true', () => {
    mockSession = { user: { isPremium: true, premiumPlan: 'GOLD', role: 'USER' } };
    mockSessionStatus = 'authenticated';

    const { getByText } = render(React.createElement(PremiumPage));

    // Active Plan badge should be visible
    expect(getByText('Active Plan')).toBeTruthy();
  });

  test('renders "Current Plan" button on the active plan card', () => {
    mockSession = { user: { isPremium: true, premiumPlan: 'GOLD', role: 'USER' } };
    mockSessionStatus = 'authenticated';

    const { getByText } = render(React.createElement(PremiumPage));

    // Current Plan button text should appear
    expect(getByText('Current Plan')).toBeTruthy();
  });
});

describe('Premium page — FAQ accordion', () => {
  test('FAQ answers are not visible by default', () => {
    mockSession = null;
    mockSessionStatus = 'unauthenticated';

    const { queryByText } = render(React.createElement(PremiumPage));

    // The first FAQ answer should not be visible initially
    const firstAnswer = queryByText(/All payments are processed by Cashfree/i);
    expect(firstAnswer).toBeNull();
  });

  test('FAQ answer becomes visible after clicking the question button', () => {
    mockSession = null;
    mockSessionStatus = 'unauthenticated';

    const { getByText, queryByText } = render(React.createElement(PremiumPage));

    // Answer not visible before click
    expect(queryByText(/All payments are processed by Cashfree/i)).toBeNull();

    // Click the first FAQ question button
    const firstQuestion = getByText('Is my payment secure?');
    fireEvent.click(firstQuestion);

    // Answer should now be visible
    expect(queryByText(/All payments are processed by Cashfree/i)).toBeTruthy();
  });
});
