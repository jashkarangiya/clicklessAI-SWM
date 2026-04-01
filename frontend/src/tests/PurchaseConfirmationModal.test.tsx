/**
 * PurchaseConfirmationModal tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { PurchaseConfirmationModal } from '@/components/purchase/PurchaseConfirmationModal';
import { MOCK_CONFIRMATION } from '@/lib/mocks/fixtures';

const renderModal = (onConfirm = jest.fn(), onCancel = jest.fn(), overrideConf = MOCK_CONFIRMATION) =>
  render(
    <MantineProvider defaultColorScheme="dark">
      <ModalsProvider>
        <PurchaseConfirmationModal
          opened={true}
          confirmation={overrideConf}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </ModalsProvider>
    </MantineProvider>
  );

describe('PurchaseConfirmationModal', () => {
  it('renders product name', () => {
    renderModal();
    expect(screen.getByText(/Sony WH-1000XM5/i)).toBeInTheDocument();
  });

  it('renders total price', () => {
    renderModal();
    // Price appears in summary and on the confirm button
    expect(screen.getAllByText(/\$279\.99/)[0]).toBeInTheDocument();
  });

  it('renders delivery address', () => {
    renderModal();
    expect(screen.getByText(/Main Street/i)).toBeInTheDocument();
  });

  it('renders payment info', () => {
    renderModal();
    expect(screen.getByText(/Visa/i)).toBeInTheDocument();
    expect(screen.getByText(/4242/)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = jest.fn();
    renderModal(jest.fn(), onCancel);
    fireEvent.click(screen.getByTestId('confirm-cancel-btn'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onConfirm when Confirm clicked for normal amount', () => {
    const onConfirm = jest.fn();
    renderModal(onConfirm);
    fireEvent.click(screen.getByTestId('confirm-purchase-btn'));
    expect(onConfirm).toHaveBeenCalledWith(MOCK_CONFIRMATION.confirmation_id);
  });

  it('enters double-confirm flow for high value (>$500)', () => {
    const highValueConf = {
      ...MOCK_CONFIRMATION,
      total_price: 550,
      product: { ...MOCK_CONFIRMATION.product, pricing: { ...MOCK_CONFIRMATION.product.pricing, current: 550 } },
    };
    const onConfirm = jest.fn();
    renderModal(onConfirm, jest.fn(), highValueConf);
    // First click → shows "Are you absolutely sure?"
    fireEvent.click(screen.getByTestId('confirm-purchase-btn'));
    expect(screen.getByText(/absolutely sure/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    // Second click → confirms
    fireEvent.click(screen.getByTestId('confirm-purchase-btn'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
