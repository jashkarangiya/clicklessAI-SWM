/**
 * SignupForm tests
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { SignupForm } from '@/components/auth/SignupForm';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/api/authService', () => ({
  authService: {
    signup: jest.fn().mockResolvedValue({
      token: 'mock-token',
      user: { id: '1', email: 'test@test.com', name: 'Test' },
    }),
  },
}));
jest.mock('@/stores/sessionStore', () => ({
  useSessionStore: (sel: (s: { setUser: jest.Mock }) => unknown) =>
    sel({ setUser: jest.fn() }),
}));

const renderWithMantine = (ui: React.ReactElement) =>
  render(<MantineProvider defaultColorScheme="dark">{ui}</MantineProvider>);

describe('SignupForm', () => {
  it('renders all form fields', () => {
    renderWithMantine(<SignupForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    // Mantine renders multiple password inputs for show/hide
    expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0);
  });

  it('validates email format', async () => {
    renderWithMantine(<SignupForm />);
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email address/i), 'notanemail');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    renderWithMantine(<SignupForm />);
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@test.com');
    // Find the first password input specifically
    const pwdInputs = screen.getAllByLabelText(/password/i);
    await userEvent.type(pwdInputs[0]!, 'short');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator when typing', async () => {
    renderWithMantine(<SignupForm />);
    const pwdInputs = screen.getAllByLabelText(/password/i);
    await userEvent.type(pwdInputs[0]!, 'TestPass123!');
    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });
});
