/**
 * ClarificationCard tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ClarificationCard } from '@/components/clarification/ClarificationCard';
import type { ClarificationMessage } from '@/contracts/chat';

const mockMessage: ClarificationMessage = {
  id: 'msg-1', type: 'clarification', role: 'assistant',
  timestamp: new Date().toISOString(),
  clarification: {
    question: 'What color do you prefer?',
    options: [
      { id: 'c1', label: 'Black', value: 'black' },
      { id: 'c2', label: 'White', value: 'white' },
    ],
    free_text: false,
  },
};

const renderCard = (onSelect = jest.fn()) =>
  render(
    <MantineProvider defaultColorScheme="dark">
      <ClarificationCard message={mockMessage} onSelect={onSelect} />
    </MantineProvider>
  );

describe('ClarificationCard', () => {
  it('renders the clarification question', () => {
    renderCard();
    expect(screen.getByText(/what color do you prefer/i)).toBeInTheDocument();
  });

  it('renders all option buttons', () => {
    renderCard();
    expect(screen.getByTestId('clarification-option-c1')).toBeInTheDocument();
    expect(screen.getByTestId('clarification-option-c2')).toBeInTheDocument();
  });

  it('calls onSelect with correct id and value when option clicked', () => {
    const onSelect = jest.fn();
    renderCard(onSelect);
    fireEvent.click(screen.getByTestId('clarification-option-c1'));
    expect(onSelect).toHaveBeenCalledWith('c1', 'black');
  });

  it('disables other options after selection', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('clarification-option-c1'));
    expect(screen.getByTestId('clarification-option-c2')).toBeDisabled();
  });

  it('shows "Answered" after selection', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('clarification-option-c1'));
    expect(screen.getByText(/answered/i)).toBeInTheDocument();
  });
});
