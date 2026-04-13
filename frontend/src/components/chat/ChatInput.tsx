'use client';
/**
 * ClickLess AI – Chat Input
 *
 * Elevated composer dock:
 * - Resting shadow creates depth above the canvas
 * - Focus state: branded border + glow ring
 * - Animated rotating placeholder (category examples)
 * - Trust lock + keyboard hints in one balanced row
 * - ⌘K focuses the input from anywhere on the page
 * - Mic button for ElevenLabs speech-to-text
 */
import { useRef, useState, useCallback, useEffect, KeyboardEvent } from 'react';
import { Box, Textarea, ActionIcon, Text, Tooltip, Loader } from '@mantine/core';
import { IconSend, IconSendOff, IconLock, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import { transcribeAudio, stopSpeaking } from '@/lib/api/elevenLabsService';

const PLACEHOLDERS = [
  'Find a 4K TV under $900 that arrives by Friday…',
  'Reorder my last Lavazza coffee pods from Amazon…',
  'Compare the Sony WH-1000XM5 vs Bose QC45…',
  'Where is my order from last Tuesday?',
  'Best standing desk under $600 with fast delivery…',
];

interface ChatInputProps {
  onSend:    (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value,          setValue]          = useState('');
  const [isFocused,      setIsFocused]      = useState(false);
  const [phIdx,          setPhIdx]          = useState(0);
  const [phVisible,      setPhVisible]      = useState(true);
  const [isRecording,    setIsRecording]    = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);

  // ── ⌘K / Ctrl+K → focus input from anywhere ─────────────────────────────
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Rotate placeholder every 4 s (paused while focused or typing) ────────
  useEffect(() => {
    if (isFocused || value) return;
    const id = setInterval(() => {
      setPhVisible(false);
      const t = setTimeout(() => {
        setPhIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPhVisible(true);
      }, 260);
      return () => clearTimeout(t);
    }, 4000);
    return () => clearInterval(id);
  }, [isFocused, value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Voice input (ElevenLabs STT) ─────────────────────────────────────────
  const startRecording = useCallback(async () => {
    stopSpeaking(); // stop any TTS before recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const transcript = await transcribeAudio(blob);
          if (transcript) setValue((v) => (v ? v + ' ' + transcript : transcript));
        } catch (err) {
          console.error('Transcription failed:', err);
        } finally {
          setIsTranscribing(false);
          setTimeout(() => textareaRef.current?.focus(), 0);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const canSend = !disabled && value.trim().length > 0;

  return (
    <Box style={{ padding: '10px 20px 16px', backgroundColor: 'var(--cl-bg)' }}>

      {/* ── Trust + keyboard hints row ── */}
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <IconLock size={11} style={{ color: 'var(--cl-text-muted)', flexShrink: 0 }} />
          <Text size="xs" style={{ color: 'var(--cl-text-muted)', fontSize: '0.7rem' }}>
            ClickLess won't place any order without your approval
          </Text>
        </Box>

        <Box style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {[
            { key: '⌘K', label: 'focus' },
            { key: 'Enter', label: 'send' },
          ].map(({ key, label }) => (
            <Box key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box
                component="kbd"
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--cl-text-muted)',
                  backgroundColor: 'var(--cl-surface)',
                  border: '1px solid var(--cl-border)',
                  borderRadius: 5,
                  padding: '1px 6px',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                {key}
              </Box>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)', fontSize: '0.66rem' }}>
                {label}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Input container — elevated, focus-aware ── */}
      <Box
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          backgroundColor: 'var(--cl-surface)',
          border: '1.5px solid',
          borderColor: isFocused ? 'var(--cl-brand)' : 'var(--cl-border)',
          borderRadius: 22,
          padding: '10px 10px 10px 20px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          // Resting: soft lift — Focus: branded glow
          boxShadow: isFocused
            ? '0 0 0 4px rgba(12, 122, 138, 0.12), 0 4px 16px rgba(0,0,0,0.07)'
            : '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          minHeight: 62,
          position: 'relative',
        }}
      >
        {/* Animated placeholder overlay */}
        {!value && (
          <Box
            style={{
              position: 'absolute',
              top: 0, left: 20, right: 58, bottom: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: 'var(--cl-text-muted)',
                fontSize: '0.95rem',
                opacity: phVisible ? 1 : 0,
                transition: 'opacity 0.26s ease',
                userSelect: 'none',
                lineHeight: 1.6,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {PLACEHOLDERS[phIdx]}
            </Text>
          </Box>
        )}

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder=""
          disabled={disabled}
          autosize
          minRows={1}
          maxRows={6}
          id="chat-input"
          aria-label="Chat message input"
          style={{ flex: 1 }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          styles={{
            input: {
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              padding: 0,
              paddingTop: 5,
              resize: 'none',
              color: 'var(--cl-text-primary)',
              lineHeight: 1.65,
              fontSize: '0.96rem',
            },
          }}
        />

        {/* Mic button (ElevenLabs STT) */}
        <Tooltip
          label={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing…' : 'Speak your message'}
          position="top"
          withArrow
        >
          <ActionIcon
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing || disabled}
            size={38}
            radius={9999}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            style={{
              flexShrink: 0,
              backgroundColor: isRecording
                ? 'rgba(220, 38, 38, 0.12)'
                : 'transparent',
              border: isRecording
                ? '1.5px solid rgba(220, 38, 38, 0.4)'
                : '1.5px solid var(--cl-border)',
              color: isRecording ? '#dc2626' : 'var(--cl-text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            {isTranscribing
              ? <Loader size={15} color="var(--cl-brand)" />
              : isRecording
                ? <IconMicrophoneOff size={17} />
                : <IconMicrophone size={17} />
            }
          </ActionIcon>
        </Tooltip>

        {/* Send button */}
        <ActionIcon
          onClick={handleSend}
          disabled={!canSend}
          size={42}
          radius={9999}
          id="chat-send-btn"
          aria-label="Send message"
          title={disabled ? 'Please wait…' : 'Send (Enter)'}
          style={{
            flexShrink: 0,
            backgroundColor: canSend ? 'var(--cl-brand)' : 'var(--cl-surface-raised)',
            border: 'none',
            transition: 'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
            color: canSend ? '#fff' : 'var(--cl-text-muted)',
            boxShadow: canSend ? '0 2px 8px rgba(12,122,138,0.30)' : 'none',
            transform: canSend ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          {disabled ? <IconSendOff size={17} /> : <IconSend size={17} />}
        </ActionIcon>
      </Box>
    </Box>
  );
}
