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
import { useCallback, useState } from 'react';
import { Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useChatStore } from '@/stores/chatStore';
import { useClicklessSocket } from '@/providers/ClicklessSocketProvider';
import { useAppSelector } from '@/store/hooks';
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
  const conversationId = useChatStore((s) => s.conversationId);
  const addMessage  = useChatStore((s) => s.addMessage);
  const setSending  = useChatStore((s) => s.setSending);
  const updateMessage = useChatStore((s) => s.updateMessage);

  // Socket is managed by ClicklessSocketProvider in the layout — no explicit connect() needed
  const { send } = useClicklessSocket();
  const userId = useAppSelector((s) => s.session.user?.id ?? 'anonymous');

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [activeConfirmation, setActiveConfirmation] = useState<PurchaseConfirmation | null>(null);
  const [isDirectBuy, setIsDirectBuy] = useState(false);

  const handleSend = useCallback((text: string) => {
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: text,
    };
    addMessage(userMsg);
    setSending(true);
    send({ event: 'user_message', session_id: conversationId, content: text, user_id: userId });
    setSending(false);
  }, [addMessage, setSending, send, conversationId, userId]);

  const handleSuggestion = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  const handleClarificationSelect = useCallback((msgId: string, optionId: string, value: string) => {
    updateMessage(msgId, { selectedOption: optionId } as Partial<FrontendChatMessage>);
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: value,
    };
    addMessage(userMsg);
    send({ event: 'clarification_reply', session_id: conversationId, option_id: optionId });
  }, [updateMessage, addMessage, send, conversationId]);

  const handleClarificationFreeText = useCallback((msgId: string, text: string) => {
    updateMessage(msgId, { selectedOption: '__free_text__' } as Partial<FrontendChatMessage>);
    const userMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'user',
      timestamp: new Date().toISOString(), content: text,
    };
    addMessage(userMsg);
    send({ event: 'clarification_reply', session_id: conversationId, free_text: text });
  }, [updateMessage, addMessage, send, conversationId]);

  // "Buy this" on a product card — opens confirmation modal, then sends direct_buy
  const handleBuy = useCallback((product: NormalizedProduct) => {
    const confirmation: PurchaseConfirmation = {
      confirmation_id: nanoid(),
      status: 'pending',
      created_at: new Date().toISOString(),
      product,
      delivery: { address: '' },
      payment: { method_type: '' },
      total_price: product.pricing.current,
    };
    setActiveConfirmation(confirmation);
    setIsDirectBuy(true);
    setConfirmationOpen(true);
  }, []);

  const handleDetail = useCallback((product: NormalizedProduct) => {
    notifications.show({
      title: product.name,
      message: product.description ?? 'No additional details available.',
      autoClose: 6000,
    });
  }, []);

  const handleConfirmRequest = useCallback((confirmation: PurchaseConfirmation) => {
    setActiveConfirmation(confirmation);
    setIsDirectBuy(false);
    setConfirmationOpen(true);
  }, []);

  const handleConfirm = useCallback((confirmationId: string) => {
    setConfirmationOpen(false);
    if (isDirectBuy && activeConfirmation) {
      // Bypass the LangGraph flow — send directly to execute_purchase
      send({
        event: 'direct_buy',
        session_id: conversationId,
        user_id: userId,
        product: activeConfirmation.product,
        confirmation_id: confirmationId,
      });
    } else {
      // Resume interrupted LangGraph graph
      send({ event: 'purchase_confirm', session_id: conversationId, confirmation_id: confirmationId, confirmed: true });
    }
  }, [send, isDirectBuy, activeConfirmation, conversationId, userId]);

  const handleCancel = useCallback(() => {
    setConfirmationOpen(false);
    const sysMsg: FrontendChatMessage = {
      id: nanoid(), type: 'text', role: 'assistant',
      timestamp: new Date().toISOString(), content: 'Purchase cancelled. No order was placed.',
    };
    addMessage(sysMsg);
  }, [addMessage]);

  const handleRetry = useCallback(() => {
    send({ event: 'user_message', session_id: conversationId, content: 'retry', user_id: userId });
  }, [send, conversationId, userId]);

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
