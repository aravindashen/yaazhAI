/**
 * YAAZH Voice Access Service
 * Genuine voice accessibility for blind and visually impaired users.
 * Supports:
 * - Speech-to-Text (Web Speech API)
 * - Text-to-Speech (Web Speech API with Tamil / English voice matching)
 * - Non-visual audio cues (Web Audio API synthesis)
 * - Haptic feedback (Vibration API)
 * - Screen-reader ARIA live announcements
 */

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'camera_active' | 'error';

// Web Audio API non-visual cues
class AudioCuePlayer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Listening chime: pleasant rising harmonic
  playStartListening() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('AudioCue listening start:', e);
    }
  }

  // Stop listening / thinking cue
  playStopListening() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {
      console.warn('AudioCue listening stop:', e);
    }
  }

  // Success / Question chime
  playSuccessChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => { // C-E-G chord
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch (e) {
      console.warn('AudioCue success:', e);
    }
  }

  // Camera capture chime
  playShutterChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('AudioCue shutter:', e);
    }
  }
}

export const audioCues = new AudioCuePlayer();

// Haptic feedback for smartphones
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(25);
      else if (type === 'medium') navigator.vibrate(50);
      else if (type === 'success') navigator.vibrate([30, 40, 60]);
      else if (type === 'warning') navigator.vibrate([80, 50, 80]);
    } catch {
      // Ignore vibration errors
    }
  }
}

// Screen reader live announcer (for tactile accessibility status updates only)
let liveAnnouncerEl: HTMLElement | null = null;
export function announceToScreenReader(message: string, assertive = false) {
  if (typeof document === 'undefined' || !message) return;
  // If ElevenLabs AI audio is active or message is long conversational content,
  // do not echo full text into screen reader live region to avoid dual-voice collision.
  if (yaazhElevenPlayer.isPlaying() || message.length > 80) {
    return;
  }
  if (!liveAnnouncerEl) {
    liveAnnouncerEl = document.createElement('div');
    liveAnnouncerEl.id = 'yaazh-screen-reader-announcer';
    liveAnnouncerEl.setAttribute('aria-live', 'polite');
    liveAnnouncerEl.setAttribute('aria-atomic', 'true');
    liveAnnouncerEl.className = 'sr-only';
    liveAnnouncerEl.style.position = 'absolute';
    liveAnnouncerEl.style.width = '1px';
    liveAnnouncerEl.style.height = '1px';
    liveAnnouncerEl.style.padding = '0';
    liveAnnouncerEl.style.overflow = 'hidden';
    liveAnnouncerEl.style.clip = 'rect(0, 0, 0, 0)';
    liveAnnouncerEl.style.whiteSpace = 'nowrap';
    liveAnnouncerEl.style.border = '0';
    document.body.appendChild(liveAnnouncerEl);
  }
  liveAnnouncerEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  liveAnnouncerEl.textContent = '';
  setTimeout(() => {
    if (liveAnnouncerEl) {
      liveAnnouncerEl.textContent = message;
    }
  }, 50);
}

// Text-To-Speech Controller
export class YaazhSpeechSynthesizer {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  getBestTamilVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.loadVoices();
    // 1. Explicit Tamil voice
    const tamil = this.voices.find(v => v.lang.toLowerCase().startsWith('ta'));
    if (tamil) return tamil;
    // 2. Indian English voice (often pronounces Tamil phonetic words well)
    const inEng = this.voices.find(v => v.lang.toLowerCase().includes('en-in'));
    if (inEng) return inEng;
    // 3. Fallback
    return this.voices[0] || null;
  }

  getBestEnglishVoice(): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.loadVoices();
    const eng = this.voices.find(v => v.lang.toLowerCase().includes('en-in')) ||
                this.voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return eng || this.voices[0] || null;
  }

  speak(text: string, options: {
    lang?: 'ta' | 'en';
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onEnd?.();
      return;
    }

    // Do NOT speak via browser TTS if ElevenLabs audio player is currently playing or loading
    if (yaazhElevenPlayer.isPlaying() || yaazhElevenPlayer.getState() === 'loading') {
      options.onEnd?.();
      return;
    }

    this.stop();

    // Clean text of markdown, bracketed references, symbols for natural audio
    const cleanText = text
      .replace(/\[Source\s*\d+\]/gi, '')
      .replace(/\[\d+\]/g, '')
      .replace(/[*#_`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    const isTamil = options.lang === 'ta' || /[\u0B80-\u0BFF]/.test(cleanText);
    utterance.lang = isTamil ? 'ta-IN' : 'en-US';
    utterance.rate = options.rate || (isTamil ? 0.9 : 1.0);
    utterance.pitch = options.pitch || 1.0;

    const voice = isTamil ? this.getBestTamilVoice() : this.getBestEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      // Speech cancel can trigger error, ignore if canceled
      if (e.error !== 'canceled') {
        options.onError?.(e);
      }
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  isActive(): boolean {
    return this.isSpeaking;
  }
}

export const yaazhTTS = new YaazhSpeechSynthesizer();

// ==========================================
// ElevenLabs Neural Audio Player
// ==========================================
export class ElevenLabsAudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private state: 'idle' | 'loading' | 'playing' | 'paused' | 'error' = 'idle';
  private listeners: Set<(state: 'idle' | 'loading' | 'playing' | 'paused' | 'error', progress?: { currentTime: number; duration: number }) => void> = new Set();
  private activeRequestId = 0;

  subscribe(listener: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'error', progress?: { currentTime: number; duration: number }) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(state: 'idle' | 'loading' | 'playing' | 'paused' | 'error', progress?: { currentTime: number; duration: number }) {
    this.state = state;
    this.listeners.forEach(cb => cb(state, progress));
  }

  getState() {
    return this.state;
  }

  async playText(text: string, options: {
    language?: 'ta' | 'en' | 'tanglish';
    voiceId?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}) {
    // 1. Immediately stop any current audio and cancel any browser TTS
    this.stop();
    const requestId = ++this.activeRequestId;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.notify('loading');

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: options.language || 'ta',
          voiceId: options.voiceId
        })
      });

      // If a newer request has started or playback was stopped, abandon this response
      if (requestId !== this.activeRequestId) {
        return;
      }

      if (!res.ok) {
        throw new Error(`ElevenLabs TTS server error (${res.status})`);
      }

      const blob = await res.blob();

      if (requestId !== this.activeRequestId) {
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      this.currentAudioUrl = audioUrl;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      // Ensure no browser speech synthesis is running
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      audio.onplay = () => {
        if (requestId !== this.activeRequestId) return;
        this.notify('playing', { currentTime: audio.currentTime, duration: audio.duration || 0 });
        options.onStart?.();
      };

      audio.ontimeupdate = () => {
        if (requestId !== this.activeRequestId) return;
        this.notify('playing', { currentTime: audio.currentTime, duration: audio.duration || 0 });
      };

      audio.onpause = () => {
        if (requestId !== this.activeRequestId) return;
        if (this.state !== 'idle') {
          this.notify('paused', { currentTime: audio.currentTime, duration: audio.duration || 0 });
        }
      };

      audio.onended = () => {
        if (requestId !== this.activeRequestId) return;
        this.notify('idle', { currentTime: audio.duration || 0, duration: audio.duration || 0 });
        options.onEnd?.();
      };

      audio.onerror = (e) => {
        if (requestId !== this.activeRequestId) return;
        console.warn('ElevenLabs audio playback error:', e);
        this.notify('error');
        options.onError?.(e);
      };

      await audio.play();
    } catch (err: any) {
      if (requestId !== this.activeRequestId) return;
      console.warn('ElevenLabs TTS error:', err);
      this.notify('error');
      options.onError?.(err);
    }
  }

  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    }
  }

  replay() {
    if (this.currentAudio) {
      this.currentAudio.currentTime = 0;
      this.currentAudio.play().catch(() => {});
    }
  }

  stop() {
    this.activeRequestId++;
    if (this.currentAudio) {
      this.currentAudio.onplay = null;
      this.currentAudio.ontimeupdate = null;
      this.currentAudio.onpause = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify('idle');
  }

  isPlaying() {
    return this.state === 'playing';
  }
}

export const yaazhElevenPlayer = new ElevenLabsAudioPlayer();

// ==========================================
// ElevenLabs Audio Recorder (Microphone Stream)
// ==========================================
export class ElevenLabsAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    this.audioChunks = [];

    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      else mimeType = '';
    }

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    recorder.start(100);
    this.isRecording = true;
    audioCues.playStartListening();
    triggerHaptic('light');
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Recorder not active'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.isRecording = false;
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        audioCues.playStopListening();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isRecording = false;
    this.audioChunks = [];
    audioCues.playStopListening();
  }

  isActive() {
    return this.isRecording;
  }
}

export const yaazhRecorder = new ElevenLabsAudioRecorder();

/**
 * Transcribe recorded audio with ElevenLabs Speech-to-Text
 */
export async function transcribeAudio(blob: Blob, languageCode?: string): Promise<{
  text: string;
  detectedLanguage: 'tamil' | 'tanglish' | 'english';
  normalizedTamil: string;
  detectedCommand?: string;
  isCommand: boolean;
  provider: 'elevenlabs';
}> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const res = await fetch('/api/voice/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: blob.type || 'audio/webm',
      languageCode
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'ElevenLabs STT transcription failed');
  }

  return await res.json();
}

// Speech Recognition Controller (Browser STT)
export class YaazhSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private latestTranscript = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  isAvailable(): boolean {
    return !!this.recognition;
  }

  isListeningNow(): boolean {
    return this.isListening;
  }

  getLatestTranscript(): string {
    return this.latestTranscript;
  }

  startListening(options: {
    lang?: 'ta-IN' | 'en-US' | 'auto';
    continuous?: boolean;
    onResult: (result: VoiceRecognitionResult) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  }): void {
    if (!this.recognition) {
      options.onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.latestTranscript = '';
    this.recognition.continuous = options.continuous !== false;
    this.recognition.lang = options.lang === 'en-US' ? 'en-US' : 'ta-IN';

    this.recognition.onstart = () => {
      this.isListening = true;
      audioCues.playStartListening();
      triggerHaptic('light');
      options.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let confidence = 0.9;

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + item[0].transcript;
          if (item[0].confidence) confidence = item[0].confidence;
        } else {
          interimTranscript += (interimTranscript ? ' ' : '') + item[0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      if (activeText) {
        this.latestTranscript = activeText.trim();
        options.onResult({
          transcript: activeText.trim(),
          isFinal: !!finalTranscript && !interimTranscript,
          confidence
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition warning:', event.error);
      if (event.error !== 'no-speech') {
        this.isListening = false;
        audioCues.playStopListening();
        options.onError?.(event.error || 'Speech recognition error');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      audioCues.playStopListening();
      options.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      console.warn('SpeechRecognition start error:', e);
      this.isListening = false;
    }
  }

  stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isListening = false;
  }
}

export const yaazhSTT = new YaazhSpeechRecognizer();
