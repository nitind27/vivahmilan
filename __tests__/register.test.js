/**
 * Feature: matrimonial-ui-improvements
 * Unit tests for register page redirect behavior
 * Validates: Requirements 4.1, 4.2
 */

import React from 'react';
import { render } from '@testing-library/react';

// ── Mutable session state (read by the mock factory below) ───────────────────

let mockSessionStatus = 'unauthenticated';
let mockReplace;

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: mockSessionStatus }),
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
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

// ── Import page component after mocks ─────────────────────────────────────────

const RegisterPage = require('@/app/register/page').default;

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReplace = jest.fn();
  mockSessionStatus = 'unauthenticated';
});

describe('Register page redirect behavior', () => {
  test('renders spinner when status === "loading"', () => {
    mockSessionStatus = 'loading';
    const { container } = render(React.createElement(RegisterPage));

    // The spinner is a div with animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();

    // The multi-step form should NOT be visible
    const nameInput = container.querySelector('input[placeholder="Your full name"]');
    expect(nameInput).toBeNull();
  });

  test('calls router.replace("/dashboard") when status === "authenticated"', () => {
    mockSessionStatus = 'authenticated';
    render(React.createElement(RegisterPage));

    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  test('renders the registration form when status === "unauthenticated"', () => {
    mockSessionStatus = 'unauthenticated';
    const { container } = render(React.createElement(RegisterPage));

    // Step 0 of the form should show the name input
    const nameInput = container.querySelector('input[placeholder="Your full name"]');
    expect(nameInput).toBeTruthy();

    // No spinner should be shown
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeNull();

    // No redirect should have fired
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
