/**
 * ClickLess AI – ElevenLabs Integration
 *
 * TTS: speak(text)         – converts assistant text to audio and plays it
 * STT: transcribeAudio()   – converts a recorded Blob to transcript text
 */

const API_KEY  = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ?? '';
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel – clear, natural English
const TTS_MODEL = 'eleven_turbo_v2_5';
const STT_MODEL = 'scribe_v1';
const MAX_TTS_CHARS = 4000;

// ── Module-level audio singleton so only one message plays at a time ──────────

let _audio: HTMLAudioElement | null = null;
let _blobUrl: string | null = null;
let _stateCallback: ((playing: boolean) => void) | null = null;

function _teardown() {
  if (_audio) {
    _audio.pause();
    _audio.onended = null;
    _audio.onerror = null;
    _audio = null;
  }
  if (_blobUrl) {
    URL.revokeObjectURL(_blobUrl);
    _blobUrl = null;
  }
  _stateCallback?.(false);
  _stateCallback = null;
}

export function stopSpeaking(): void {
  _teardown();
}

export function isSpeaking(): boolean {
  return _audio !== null && !_audio.paused;
}

/**
 * Convert text to speech via ElevenLabs and play it immediately.
 * @param onStateChange  Called with `true` when playback starts, `false` when it ends/errors.
 */
export async function speak(
  text: string,
  onStateChange?: (playing: boolean) => void,
): Promise<void> {
  _teardown();
  _stateCallback = onStateChange ?? null;

  const truncated = text.slice(0, MAX_TTS_CHARS);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: truncated,
        model_id: TTS_MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.80 },
      }),
    },
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${msg}`);
  }

  const blob = await res.blob();
  _blobUrl = URL.createObjectURL(blob);
  _audio = new Audio(_blobUrl);

  _audio.onended = () => _teardown();
  _audio.onerror = () => _teardown();

  onStateChange?.(true);
  await _audio.play();
}

/**
 * Transcribe an audio Blob using ElevenLabs Speech-to-Text.
 * Returns the transcript string.
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  // ElevenLabs STT accepts webm/ogg/mp4/wav etc.
  formData.append('file', blob, 'recording.webm');
  formData.append('model_id', STT_MODEL);

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: formData,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ElevenLabs STT failed (${res.status}): ${msg}`);
  }

  const data = await res.json() as { text?: string };
  return data.text ?? '';
}
