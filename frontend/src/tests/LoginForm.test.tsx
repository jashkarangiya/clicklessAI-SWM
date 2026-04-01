/**
 * LoginForm tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { LoginForm } from '@/components/auth/LoginForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
// Mock auth service
jest.mock('@/lib/api/authService', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({
      token: 'mock-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    }),
  },
}));
// Mock session store
jest.mock('@/stores/sessionStore', () => ({
  useSessionStore: (sel: (s: { setUser: jest.Mock }) => unknown) =>
    sel({ setUser: jest.fn() }),
}));

const renderWithMantine = (ui: React.ReactElement) =>
  render(<MantineProvider defaultColorScheme="dark">{ui}</MantineProvider>);

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    renderWithMantine(<LoginForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderWithMantine(<LoginForm />);
    const submit = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submit);
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    renderWithMantine(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('renders "remember me" checkbox', () => {
    renderWithMantine(<LoginForm />);
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it('renders link to sign up', () => {
    renderWithMantine(<LoginForm />);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});
