'use client';
/**
 * ClickLess AI – ChatMessageList
 *
 * Renders the full message history using a discriminated union switch.
 * Auto-scrolls to the newest message.
 * Shows TypingIndicator when isTyping.
 */
import { useEffect, useRef } from 'react';
import { Box, Stack } from '@mantine/core';
import type { FrontendChatMessage } from '@/contracts/chat';
import type { NormalizedProduct } from '@/contracts/product';
import type { PurchaseConfirmation } from '@/contracts/purchase';
import { UserMessageBubble } from './UserMessageBubble';
import { AssistantMessageBubble } from './AssistantMessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ClarificationCard } from '@/components/clarification/ClarificationCard';
import { ProductComparisonGrid } from '@/components/product/ProductComparisonGrid';
import { PurchaseProgressCard } from '@/components/purchase/PurchaseProgressCard';
import { PurchaseSuccessCard } from '@/components/purchase/PurchaseSuccessCard';
import { ErrorMessageCard } from '@/components/purchase/ErrorMessageCard';

interface ChatMessageListProps {
  messages: FrontendChatMessage[];
  isTyping: boolean;
  onClarificationSelect: (messageId: string, optionId: string, value: string) => void;
  onClarificationFreeText: (messageId: string, text: string) => void;
  onBuy: (product: NormalizedProduct) => void;
  onDetail: (product: NormalizedProduct) => void;
  onRetry: () => void;
  onConfirmRequest: (confirmation: PurchaseConfirmation) => void;
}

export function ChatMessageList({
  messages, isTyping,
  onClarificationSelect, onClarificationFreeText,
  onBuy, onDetail, onRetry, onConfirmRequest,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  return (
    <Box
      style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <Stack gap="lg">
        {messages.map((msg) => {
          if (msg.type === 'text') {
            if (msg.role === 'user') return <UserMessageBubble key={msg.id} content={msg.content} timestamp={msg.timestamp} />;
            return <AssistantMessageBubble key={msg.id} content={msg.content} timestamp={msg.timestamp} />;
          }
          if (msg.type === 'status') {
            // Transient status messages shown inline if they persist
            if (msg.transient) return null;
            return <AssistantMessageBubble key={msg.id} content={msg.content} timestamp={msg.timestamp} isSystem />;
          }
          if (msg.type === 'clarification') {
            return (
              <ClarificationCard
                key={msg.id}
                message={msg}
                onSelect={(optionId, value) => onClarificationSelect(msg.id, optionId, value)}
                onFreeText={(text) => onClarificationFreeText(msg.id, text)}
              />
            );
          }
          if (msg.type === 'product_results') {
            return (
              <Box key={msg.id} style={{ width: '100%' }}>
                <ProductComparisonGrid
                  products={msg.products}
                  summary={msg.summary}
                  onBuy={onBuy}
                  onDetail={onDetail}
                />
              </Box>
            );
          }
          if (msg.type === 'confirmation_request') {
            return (
              <Box key={msg.id}>
                <AssistantMessageBubble
                  content="I found your order details. Please review and confirm below — I won't place anything without your approval."
                  timestamp={msg.timestamp}
                />
                <Box style={{ marginTop: 8 }}>
                  <button
                    onClick={() => onConfirmRequest(msg.confirmation)}
                    style={{
                      background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
                      border: 'none', color: '#fff', borderRadius: 8,
                      padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    }}
                  >
                    Review Order →
                  </button>
                </Box>
              </Box>
            );
          }
          if (msg.type === 'purchase_progress') {
            return <PurchaseProgressCard key={msg.id} message={msg} />;
          }
          if (msg.type === 'purchase_success') {
            return <PurchaseSuccessCard key={msg.id} message={msg} />;
          }
          if (msg.type === 'error') {
            return <ErrorMessageCard key={msg.id} message={msg} onRetry={onRetry} />;
          }
          if (msg.type === 'session_expired') {
            return (
              <Box key={msg.id}
                style={{
                  backgroundColor: 'var(--cl-warning-soft)',
                  border: '1px solid var(--cl-warning)',
                  borderRadius: 10, padding: '12px 16px', maxWidth: '80%',
                }}
              >
                <span style={{ color: 'var(--cl-warning)', fontSize: 14, fontWeight: 600 }}>
                  ⚡ Session expired{msg.source ? ` (${msg.source})` : ''} — please reconnect in Settings.
                </span>
              </Box>
            );
          }
          return null;
        })}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </Stack>
    </Box>
  );
}
