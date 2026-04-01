/**
 * ErrorMessageCard tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ErrorMessageCard } from '@/components/purchase/ErrorMessageCard';
import type { ErrorMessage } from '@/contracts/chat';

const makeError = (code: string, retryable = false): ErrorMessage => ({
  id: 'err-1', type: 'error', role: 'system',
  timestamp: new Date().toISOString(),
  error: { code, message: 'Test error message', retryable },
});

const renderCard = (error: ErrorMessage, onRetry = jest.fn()) =>
  render(
    <MantineProvider defaultColorScheme="dark">
      <ErrorMessageCard message={error} onRetry={onRetry} />
    </MantineProvider>
  );

describe('ErrorMessageCard', () => {
  it('renders error message text', () => {
    renderCard(makeError('CHECKOUT_FAILED'));
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders "Checkout Failed" title for CHECKOUT_FAILED code', () => {
    renderCard(makeError('CHECKOUT_FAILED'));
    expect(screen.getByText(/checkout failed/i)).toBeInTheDocument();
  });

  it('renders "Session Expired" for SESSION_EXPIRED code', () => {
    renderCard(makeError('SESSION_EXPIRED'));
    expect(screen.getByText(/session expired/i)).toBeInTheDocument();
  });

  it('renders "CAPTCHA Required" for CAPTCHA_REQUIRED code', () => {
    renderCard(makeError('CAPTCHA_REQUIRED'));
    expect(screen.getByText(/captcha required/i)).toBeInTheDocument();
  });

  it('does NOT show retry button for non-retryable error', () => {
    renderCard(makeError('CHECKOUT_FAILED', false));
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows retry button for retryable error', () => {
    renderCard(makeError('NETWORK_ERROR', true));
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const onRetry = jest.fn();
    renderCard(makeError('NETWORK_ERROR', true), onRetry);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('has role="alert" for screen readers', () => {
    renderCard(makeError('CHECKOUT_FAILED'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
