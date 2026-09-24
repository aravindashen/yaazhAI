/**
 * Dedicated ElevenLabs AI Voice and Language Service
 * Provides Speech-to-Text (STT), Text-to-Speech (TTS), Language Detection,
 * and Tanglish Normalization for the YAAZH AI Classical Tamil platform.
 */

import { detectInputLanguage, convertTanglishToTamil, processSmartInput } from './tanglishConverter.ts';
import { normalizeTamil, cleanTamilForSearch } from './tamilLinguistics.ts';

// Permanent ElevenLabs Voice ID added by the user
export const PERMANENT_ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'hpp4J3VqNfWAUOO0d1Us';

// Default ElevenLabs Voices supporting Multilingual v2 (Tamil, English, Tanglish)
// Locked to user's permanent ElevenLabs AI voice for all features
export const DEFAULT_ELEVENLABS_VOICES = {
  permanent: PERMANENT_ELEVENLABS_VOICE_ID,
  tamil: PERMANENT_ELEVENLABS_VOICE_ID,
  english: PERMANENT_ELEVENLABS_VOICE_ID,
  tanglish: PERMANENT_ELEVENLABS_VOICE_ID,
  scholarly: PERMANENT_ELEVENLABS_VOICE_ID
};

/**
 * Check if ElevenLabs API key is configured in the environment
 */
export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0;
}

/**
 * Detect Language: 'tamil' | 'tanglish' | 'english'
 */
export function detect_language(text: string): 'tamil' | 'tanglish' | 'english' {
  if (!text || typeof text !== 'string') return 'tamil';
  return detectInputLanguage(text);
}

/**
 * Normalize Tanglish text, mapping common Romanized Tamil words and phrases
 * to Tamil Unicode script and normalizing grammar.
 */
export function normalize_tanglish(text: string): {
  original: string;
  normalizedTamil: string;
  detectedLanguage: 'tamil' | 'tanglish' | 'english';
  detectedCommand?: string;
  isCommand: boolean;
} {
  const trimmed = (text || '').trim();
  const detectedLang = detect_language(trimmed);
  const lower = trimmed.toLowerCase();

  // 1. Detect common voice commands
  let detectedCommand: string | undefined;
  if (/(tanglish\s*(la|il|la\s*sollu|la\s*explain|le)|speak\s*tanglish)/i.test(lower)) {
    detectedCommand = 'SET_LANG_TANGLISH';
  } else if (/(tamil\s*(la|il|la\s*sollu|la\s*explain)|speak\s*tamil|தமிழில்\s*(விளக்கு|சொல்|கூறு))/i.test(lower)) {
    detectedCommand = 'SET_LANG_TAMIL';
  } else if (/(english\s*(la|il|la\s*sollu|la\s*explain)|speak\s*english|ஆங்கிலத்தில்\s*(விளக்கு|சொல்))/i.test(lower)) {
    detectedCommand = 'SET_LANG_ENGLISH';
  } else if (/(read\s*(this\s*)?poem|recite|பாடலை\s*வாசி|பாடல்\s*வாசி|poem\s*(ah|a)\s*(padi|read))/i.test(lower)) {
    detectedCommand = 'READ_POEM';
  } else if (/(difficult\s*words|vocabulary|கடின\s*சொற்கள்|சொற்பொருள்|words\s*(ah|a)\s*(explain|sollu))/i.test(lower)) {
    detectedCommand = 'EXPLAIN_WORDS';
  } else if (/(give\s*me\s*a\s*quiz|quiz\s*(me|kudu|kelu|vai)|வினாடி\s*வினா|கேள்வி\s*கேள்)/i.test(lower)) {
    detectedCommand = 'GIVE_QUIZ';
  } else if (/(explain\s*this|பொருள்\s*(கூறு|என்ன)|simple\s*meaning|meaning\s*sollu)/i.test(lower)) {
    detectedCommand = 'EXPLAIN_SIMPLE';
  }

  // 2. Normalization to Tamil script for RAG retrieval
  let normalizedTamil = trimmed;
  if (detectedLang === 'tanglish') {
    normalizedTamil = convertTanglishToTamil(trimmed);
  } else if (detectedLang === 'tamil') {
    normalizedTamil = normalizeTamil(trimmed);
  } else {
    // English: extract potential Tamil concepts
    const smart = processSmartInput(trimmed);
    normalizedTamil = smart.tamilQuery || trimmed;
  }

  return {
    original: trimmed,
    normalizedTamil,
    detectedLanguage: detectedLang,
    detectedCommand,
    isCommand: !!detectedCommand
  };
}

/**
 * ElevenLabs Speech-to-Text (STT)
 * Calls ElevenLabs Scribe API with audio buffer.
 */
export async function speech_to_text(
  audioBuffer: Buffer,
  mimeType = 'audio/webm',
  options: {
    languageCode?: string;
    temperature?: number;
  } = {}
): Promise<{
  text: string;
  languageCode: string;
  detectedLanguage: 'tamil' | 'tanglish' | 'english';
  normalizedTamil: string;
  words?: any[];
  provider: 'elevenlabs';
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured in backend environment variables.');
  }

  // Audio size validation (Max 15MB)
  if (audioBuffer.length > 15 * 1024 * 1024) {
    throw new Error('Audio file exceeds the maximum allowed size of 15MB.');
  }

  // Build multipart form data for ElevenLabs Scribe STT
  const formData = new FormData();
  
  // Extension inference
  let ext = 'webm';
  if (mimeType.includes('wav')) ext = 'wav';
  else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3';
  else if (mimeType.includes('ogg')) ext = 'ogg';
  else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a';

  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append('file', audioBlob, `recording.${ext}`);
  formData.append('model_id', 'scribe_v1');

  // If user selected explicit Tamil ('tam') or English ('eng')
  if (options.languageCode) {
    formData.append('language_code', options.languageCode);
  }

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs STT API error status:', response.status, errorText);
    throw new Error(`ElevenLabs STT error (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawTranscript = (data.text || '').trim();
  
  // Language detection & normalization
  const norm = normalize_tanglish(rawTranscript);

  return {
    text: rawTranscript,
    languageCode: data.language_code || options.languageCode || 'auto',
    detectedLanguage: norm.detectedLanguage,
    normalizedTamil: norm.normalizedTamil,
    words: data.words,
    provider: 'elevenlabs',
  };
}

/**
 * ElevenLabs Text-to-Speech (TTS)
 * Calls ElevenLabs Text-to-Speech API and returns MPEG audio buffer.
 */
export async function text_to_speech(
  text: string,
  options: {
    voiceId?: string;
    language?: 'ta' | 'en' | 'tanglish';
    stability?: number;
    similarityBoost?: number;
  } = {}
): Promise<{
  audioBuffer: Buffer;
  contentType: string;
  provider: 'elevenlabs';
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured in backend environment variables.');
  }

  if (!text || !text.trim()) {
    throw new Error('Text is required for Text-to-Speech conversion.');
  }

  // Text length limit for voice generation safety (4000 chars)
  const trimmedText = text.trim().slice(0, 4000);

  // Clean Markdown, citations, and bracketed notes for smooth, pristine voice audio
  const speechText = trimmedText
    .replace(/\[Source\s*\d+\]/gi, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[#*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Permanent ElevenLabs Voice ID added by the user
  const envVoice = process.env.ELEVENLABS_VOICE_ID || PERMANENT_ELEVENLABS_VOICE_ID;
  const legacyVoiceIds = ['21m00Tcm4TlvDq8ikWAM', 'EXAVITQu4vr4xnSDxMaL', 'ErXwobaYiN019PkySvjV', 'onwK4e9ZLuTAKqWW03F9'];
  const voiceId = (options.voiceId && !legacyVoiceIds.includes(options.voiceId) && options.voiceId !== 'default')
    ? options.voiceId
    : envVoice;

  const payload = {
    text: speechText,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.8,
      style: 0.0,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs TTS API error status:', response.status, errorText);
    throw new Error(`ElevenLabs TTS error (${response.status}): ${errorText || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  return {
    audioBuffer,
    contentType: 'audio/mpeg',
    provider: 'elevenlabs',
  };
}
