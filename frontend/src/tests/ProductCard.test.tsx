/**
 * ProductCard tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS } from '@/lib/mocks/fixtures';

const renderCard = (onBuy = jest.fn(), onDetail = jest.fn(), productIdx = 0) =>
  render(
    <MantineProvider defaultColorScheme="dark">
      <ProductCard product={MOCK_PRODUCTS[productIdx]!} onBuy={onBuy} onDetail={onDetail} />
    </MantineProvider>
  );

describe('ProductCard', () => {
  it('renders product name', () => {
    renderCard();
    expect(screen.getByText(/Sony WH-1000XM5/i)).toBeInTheDocument();
  });

  it('renders current price', () => {
    renderCard();
    expect(screen.getByText('$279.99')).toBeInTheDocument();
  });

  it('renders original price with strikethrough when discounted', () => {
    renderCard();
    expect(screen.getByText('$399.99')).toBeInTheDocument();
  });

  it('renders source badge', () => {
    renderCard();
    expect(screen.getByText('amazon')).toBeInTheDocument();
  });

  it('renders recommended badge for top pick', () => {
    renderCard();
    expect(screen.getByText(/top pick/i)).toBeInTheDocument();
  });

  it('calls onBuy when Buy button clicked', () => {
    const onBuy = jest.fn();
    renderCard(onBuy);
    fireEvent.click(screen.getByTestId('buy-btn-amz-001'));
    expect(onBuy).toHaveBeenCalledWith(MOCK_PRODUCTS[0]);
  });

  it('calls onDetail when More button clicked', () => {
    const onDetail = jest.fn();
    renderCard(jest.fn(), onDetail);
    fireEvent.click(screen.getByTestId('detail-btn-amz-001'));
    expect(onDetail).toHaveBeenCalledWith(MOCK_PRODUCTS[0]);
  });
});
