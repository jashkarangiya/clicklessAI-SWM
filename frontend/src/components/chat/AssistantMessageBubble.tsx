'use client';
/**
 * ClickLess AI – Assistant & System Message Bubble
 *
 * Renders markdown content with a blinking cursor while streaming.
 * Includes ElevenLabs TTS speaker button.
 */
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Text, ActionIcon, Tooltip, Loader } from '@mantine/core';
import { IconVolume, IconPlayerStop } from '@tabler/icons-react';
import { LogoMark } from '@/components/branding/LogoMark';
import { formatTimestamp } from '@/lib/utils/formatters';
import { speak, stopSpeaking } from '@/lib/api/elevenLabsService';

interface AssistantMessageBubbleProps {
  content: string;
  timestamp: string;
  isSystem?: boolean;
  isStreaming?: boolean;
}

export function AssistantMessageBubble({
  content,
  timestamp,
  isSystem = false,
  isStreaming = false,
}: AssistantMessageBubbleProps) {
  const [speakState, setSpeakState] = useState<'idle' | 'loading' | 'playing'>('idle');

  const handleSpeak = useCallback(async () => {
    if (speakState === 'playing') {
      stopSpeaking();
      setSpeakState('idle');
      return;
    }
    setSpeakState('loading');
    try {
      await speak(content, (playing) => setSpeakState(playing ? 'playing' : 'idle'));
    } catch (err) {
      console.error('TTS error:', err);
      setSpeakState('idle');
    }
  }, [content, speakState]);

  return (
    <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '80%' }}>
      {!isSystem && (
        <Box
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: 10,
            backgroundColor: 'var(--cl-brand-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <LogoMark size={18} animated={isStreaming} />
        </Box>
      )}
      <Box style={{ flex: 1 }}>
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 20,
            padding: '14px 20px',
            lineHeight: 1.65,
          }}
        >
          {isSystem ? (
            <Text
              size="sm"
              style={{ color: 'var(--cl-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {content}
            </Text>
          ) : (
            <div className="cl-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
              {isStreaming && <span className="cl-cursor" />}
            </div>
          )}
        </Box>
        {!isStreaming && (
          <Box style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: 4 }}>
            <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
              {formatTimestamp(timestamp)}
            </Text>
            {!isSystem && (
              <Tooltip
                label={speakState === 'playing' ? 'Stop' : speakState === 'loading' ? 'Loading audio…' : 'Read aloud'}
                position="right"
                withArrow
              >
                <ActionIcon
                  onClick={handleSpeak}
                  disabled={speakState === 'loading'}
                  size={22}
                  variant="subtle"
                  radius={6}
                  aria-label="Read aloud"
                  style={{
                    color: speakState === 'playing' ? 'var(--cl-brand)' : 'var(--cl-text-muted)',
                    opacity: speakState === 'idle' ? 0.55 : 1,
                    transition: 'opacity 0.15s ease, color 0.15s ease',
                  }}
                >
                  {speakState === 'loading'
                    ? <Loader size={12} color="var(--cl-brand)" />
                    : speakState === 'playing'
                      ? <IconPlayerStop size={13} />
                      : <IconVolume size={13} />
                  }
                </ActionIcon>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      <style>{`
        .cl-markdown {
          font-size: 0.875rem;
          color: var(--cl-text-primary);
          line-height: 1.65;
          word-break: break-word;
        }
        .cl-markdown p { margin: 0 0 0.6em; }
        .cl-markdown p:last-child { margin-bottom: 0; }
        .cl-markdown h1, .cl-markdown h2, .cl-markdown h3,
        .cl-markdown h4, .cl-markdown h5, .cl-markdown h6 {
          font-weight: 700;
          margin: 1em 0 0.4em;
          color: var(--cl-text-primary);
          line-height: 1.3;
        }
        .cl-markdown h1 { font-size: 1.2em; }
        .cl-markdown h2 { font-size: 1.1em; }
        .cl-markdown h3 { font-size: 1em; }
        .cl-markdown ul, .cl-markdown ol {
          padding-left: 1.4em;
          margin: 0.4em 0 0.6em;
        }
        .cl-markdown li { margin-bottom: 0.25em; }
        .cl-markdown code {
          background: var(--cl-bg-subtle);
          border: 1px solid var(--cl-border);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 0.82em;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .cl-markdown pre {
          background: var(--cl-bg-subtle);
          border: 1px solid var(--cl-border);
          border-radius: 10px;
          padding: 12px 16px;
          overflow-x: auto;
          margin: 0.6em 0;
        }
        .cl-markdown pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.82em;
        }
        .cl-markdown blockquote {
          border-left: 3px solid var(--cl-brand);
          margin: 0.6em 0;
          padding: 2px 0 2px 12px;
          color: var(--cl-text-secondary);
        }
        .cl-markdown a {
          color: var(--cl-brand);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .cl-markdown strong { font-weight: 700; }
        .cl-markdown em { font-style: italic; }
        .cl-markdown hr {
          border: none;
          border-top: 1px solid var(--cl-border);
          margin: 0.8em 0;
        }
        .cl-markdown table {
          border-collapse: collapse;
          width: 100%;
          font-size: 0.85em;
          margin: 0.6em 0;
        }
        .cl-markdown th, .cl-markdown td {
          border: 1px solid var(--cl-border);
          padding: 6px 10px;
          text-align: left;
        }
        .cl-markdown th {
          background: var(--cl-bg-subtle);
          font-weight: 600;
        }
        .cl-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--cl-brand);
          margin-left: 2px;
          vertical-align: text-bottom;
          border-radius: 1px;
          animation: cl-blink 0.9s step-end infinite;
        }
        @keyframes cl-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </Box>
  );
}
