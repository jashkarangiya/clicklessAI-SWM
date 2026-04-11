'use client';
/**
 * ClickLess AI – Chat Page
 *
 * Main conversational interface. Wires together:
 * - ChatMessageList
 * - ChatInput
 * - StatusStrip
 * - ChatEmptyState
 * - PurchaseConfirmationModal
 * - useClicklessSocket
 */
import { useCallback, useEffect, useState } from 'react';
import { Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useChatStore } from '@/stores/chatStore';
import { useClicklessSocket } from '@/hooks/useClicklessSocket';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { StatusStrip } from '@/components/chat/StatusStrip';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { PurchaseConfirmationModal } from '@/components/purchase/PurchaseConfirmationModal';
import type { NormalizedProduct } from '@/contracts/product';
import type { PurchaseConfirmation } from '@/contracts/purchase';
import type { FrontendChatMessage } from '@/contracts/chat';
import { nanoid } from '@/lib/utils/formatters';


export default function ChatPage() {
  const messages  = useChatStore((s) => s.messages);
  const isTyping  = useChatStore((s) => s.isTyping);
  const isSending = useChatStore((s) => s.isSending);
  const statusText = useChatStore((s) => s.statusText);
  const addMessage  = useChatStore((s) => s.addMessage);
  const setSending  = useChatStore((s) => s.setSending);
  const updateMessage = useChatStore((s) => s.updateMessage);

  const { connect, send } = useClicklessSocket();

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [activeConfirmation, setActiveConfirmation] = useState<PurchaseConfirmation | null>(null);

  // Connect WebSocket on mount
  useEffect(() => { connect(); }, [connect]);

  const handleSend = useCallback((text: string) => {
    // Add user message to chat
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: text,
    };
    addMessage(userMsg);
    setSending(true);

    // Send to WS
    send({ event: 'user_message', session_id: 'mock-session', content: text });
    setSending(false);
  }, [addMessage, setSending, send]);

  const handleSuggestion = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  const handleClarificationSelect = useCallback((msgId: string, optionId: string, value: string) => {
    updateMessage(msgId, { selectedOption: optionId } as Partial<FrontendChatMessage>);
    // Add user message showing their selection
    const label = value;
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: label,
    };
    addMessage(userMsg);
    send({ event: 'clarification_reply', session_id: 'mock-session', option_id: optionId });
  }, [updateMessage, addMessage, send]);

  const handleClarificationFreeText = useCallback((msgId: string, text: string) => {
    updateMessage(msgId, { selectedOption: '__free_text__' } as Partial<FrontendChatMessage>);
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: text,
    };
    addMessage(userMsg);
    send({ event: 'clarification_reply', session_id: 'mock-session', free_text: text });
  }, [updateMessage, addMessage, send]);

  const handleBuy = useCallback((product: NormalizedProduct) => {
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: `Buy the ${product.name}`,
    };
    addMessage(userMsg);
    send({ event: 'user_message', session_id: 'mock-session', content: `confirm_buy:${product.product_id}` });
  }, [addMessage, send]);

  const handleDetail = useCallback((product: NormalizedProduct) => {
    notifications.show({
      title: product.name,
      message: product.description ?? 'No additional details available.',
      autoClose: 6000,
    });
  }, []);

  const handleConfirmRequest = useCallback((confirmation: PurchaseConfirmation) => {
    setActiveConfirmation(confirmation);
    setConfirmationOpen(true);
  }, []);

  const handleConfirm = useCallback((confirmationId: string) => {
    setConfirmationOpen(false);
    send({ event: 'purchase_confirm', session_id: 'mock-session', confirmation_id: confirmationId, confirmed: true });
  }, [send]);

  const handleCancel = useCallback(() => {
    setConfirmationOpen(false);
    const sysMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'assistant',
      timestamp: new Date().toISOString(), content: 'Purchase cancelled. No order was placed.',
    };
    addMessage(sysMsg);
  }, [addMessage]);

  const handleRetry = useCallback(() => {
    send({ event: 'user_message', session_id: 'mock-session', content: 'retry' });
  }, [send]);

  const hasMessages = messages.length > 0;

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hasMessages ? (
        <ChatEmptyState onSuggestion={handleSuggestion} />
      ) : (
        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          onClarificationSelect={handleClarificationSelect}
          onClarificationFreeText={handleClarificationFreeText}
          onBuy={handleBuy}
          onDetail={handleDetail}
          onRetry={handleRetry}
          onConfirmRequest={handleConfirmRequest}
        />
      )}

      <StatusStrip text={statusText} />
      <ChatInput
        onSend={handleSend}
        disabled={isSending || isTyping}
      />

      {activeConfirmation && (
        <PurchaseConfirmationModal
          opened={confirmationOpen}
          confirmation={activeConfirmation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </Box>
  );
}
