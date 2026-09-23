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

// Screen reader live announcer
let liveAnnouncerEl: HTMLElement | null = null;
export function announceToScreenReader(message: string, assertive = true) {
  if (typeof document === 'undefined') return;
  if (!liveAnnouncerEl) {
    liveAnnouncerEl = document.createElement('div');
    liveAnnouncerEl.id = 'yaazh-screen-reader-announcer';
    liveAnnouncerEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
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

// Speech Recognition Controller (Browser STT)
export class YaazhSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  isAvailable(): boolean {
    return !!this.recognition;
  }

  startListening(options: {
    lang?: 'ta-IN' | 'en-US' | 'auto';
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

    // Default to Tamil with Tanglish/English dual capability
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
      let confidence = 0.85;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
          if (item[0].confidence) confidence = item[0].confidence;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript) {
        options.onResult({
          transcript: finalTranscript.trim(),
          isFinal: true,
          confidence
        });
      } else if (interimTranscript) {
        options.onResult({
          transcript: interimTranscript.trim(),
          isFinal: false,
          confidence
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      audioCues.playStopListening();
      options.onError?.(event.error || 'Speech recognition failed');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      audioCues.playStopListening();
      options.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition start error:', e);
      this.isListening = false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
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
