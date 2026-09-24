import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Camera, RotateCcw, X, BookOpen,
  HelpCircle, Sparkles, CheckCircle2, ChevronRight, Play, Pause,
  Layers, ArrowRight, ShieldCheck, Eye, EyeOff, Radio, Square,
  RotateCw, Loader2, Edit3, Globe, Check, Send
} from 'lucide-react';
import {
  yaazhSTT, yaazhElevenPlayer, yaazhRecorder, transcribeAudio,
  audioCues, triggerHaptic, announceToScreenReader,
  VoiceState, VoiceRecognitionResult
} from '../services/voiceAccessService.ts';
import { ClassicalVerse, UserRole } from '../types/index.ts';
import { Language } from '../services/i18n.ts';

export type VoiceLanguageMode = 'ta' | 'en' | 'tanglish';

interface YaazhVoiceAccessProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentRole: UserRole | null;
  onSwitchPlatform: (role: UserRole | null) => void;
  activeVerse?: ClassicalVerse | null;
  onSelectVerse?: (verse: ClassicalVerse) => void;
}

interface VoiceMessage {
  id: string;
  sender: 'user' | 'yaazh';
  text: string;
  spokenAudio?: string;
  timestamp: string;
  intent?: string;
  verse?: ClassicalVerse;
  quizQuestion?: {
    id: string;
    questionTa: string;
    questionEn: string;
    expectedAnswer: string;
    explanationTa: string;
    explanationEn: string;
  };
}

export const YaazhVoiceAccess: React.FC<YaazhVoiceAccessProps> = ({
  isOpen,
  onClose,
  language,
  currentRole,
  onSwitchPlatform,
  activeVerse: initialVerse,
  onSelectVerse
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [currentVerse, setCurrentVerse] = useState<ClassicalVerse | null>(initialVerse || null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  
  // Voice Language: 'ta' | 'en' | 'tanglish'
  const [voiceLangMode, setVoiceLangMode] = useState<VoiceLanguageMode>(language === 'en' ? 'en' : 'ta');
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<any | null>(null);

  // Editable preview if user chooses to edit
  const [editingTranscript, setEditingTranscript] = useState<string | null>(null);

  // ElevenLabs Audio Player progress
  const [audioPlaybackState, setAudioPlaybackState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const [audioProgress, setAudioProgress] = useState({ currentTime: 0, duration: 0 });

  const interimRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);

  useEffect(() => {
    setVoiceLangMode(language === 'en' ? 'en' : 'ta');
  }, [language]);

  // Camera to Voice state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const micButtonRef = useRef<HTMLButtonElement | null>(null);

  // Subscribe to ElevenLabs player
  useEffect(() => {
    const unsub = yaazhElevenPlayer.subscribe((state, progress) => {
      setAudioPlaybackState(state);
      if (progress) setAudioProgress(progress);
      if (state === 'playing') setVoiceState('speaking');
      else if (state === 'idle' && voiceState === 'speaking') setVoiceState('idle');
    });
    return () => {
      unsub();
    };
  }, [voiceState]);

  // Update active verse if parent changes
  useEffect(() => {
    if (initialVerse) {
      setCurrentVerse(initialVerse);
    }
  }, [initialVerse]);

  const speakText = async (text: string) => {
    setVoiceState('speaking');
    // Aggressively cancel any lingering browser synthesis to prevent two voices speaking
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      await yaazhElevenPlayer.playText(text, {
        language: voiceLangMode,
        onStart: () => setVoiceState('speaking'),
        onEnd: () => setVoiceState('idle'),
        onError: () => setVoiceState('idle')
      });
    } catch (e) {
      console.warn('ElevenLabs playback error:', e);
      setVoiceState('idle');
    }
  };

  // Initial welcome greeting when Voice Access is opened
  useEffect(() => {
    if (isOpen) {
      triggerHaptic('medium');
      audioCues.playSuccessChime();

      const welcomeTa = 'வணக்கம். நீங்கள் யாழ் குரல் அணுகலில் உள்ளீர்கள். கீழே உள்ள பெரிய பொத்தானைத் தொட்டுப் பேசவும் (Tap to Speak). அல்லது "Tanglish la sollu", "எளிய விளக்கம்", "கடின சொற்கள்", "மூலப் பாடல்", "வினாடி வினா" எனக் கூறலாம்.';
      const welcomeEn = 'Welcome to YAAZH Voice Access. Tap the large microphone button to speak naturally. Ask any Classical Tamil question, or say "Tanglish la sollu", "Explain simple", "Difficult words", or "Quiz me".';
      const welcomeText = voiceLangMode === 'ta' ? welcomeTa : welcomeEn;

      // Status-only announcement to prevent screen reader from speaking simultaneously with ElevenLabs
      announceToScreenReader(voiceLangMode === 'ta' ? 'யாழ் குரல் அணுகல் இயக்கப்பட்டது.' : 'YAAZH Voice Access active.');

      const welcomeMsg: VoiceMessage = {
        id: 'msg-welcome',
        sender: 'yaazh',
        text: welcomeText,
        spokenAudio: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);

      // Speak welcome aloud using permanent ElevenLabs AI Voice
      speakText(welcomeText);

      // Auto-focus microphone button for screen readers & accessibility
      setTimeout(() => {
        micButtonRef.current?.focus();
      }, 300);
    } else {
      yaazhElevenPlayer.stop();
      yaazhSTT.stop();
      yaazhRecorder.cancelRecording();
      isListeningRef.current = false;
      stopCameraStream();
      setVoiceState('idle');
    }
  }, [isOpen]);

  // Auto-scroll chat area
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, interimTranscript, editingTranscript]);

  // Cleanup camera stream
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      yaazhElevenPlayer.stop();
      yaazhSTT.stop();
      yaazhRecorder.cancelRecording();
      isListeningRef.current = false;
    };
  }, []);

  // Voice Interaction Handler
  const handleProcessVoiceInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setVoiceState('processing');
    setEditingTranscript(null);
    setInterimTranscript('');
    announceToScreenReader(`கேட்கப்பட்டது: ${spokenText}. சிந்திக்கிறது...`, true);

    const userMsg: VoiceMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const isQuizAnswer = !!activeQuizQuestion;

      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: spokenText,
          currentVerseId: currentVerse?.id,
          currentRole,
          language: voiceLangMode === 'en' ? 'en' : 'ta',
          languageMode: voiceLangMode,
          action: isQuizAnswer ? 'EVALUATE_QUIZ' : undefined,
          currentQuizQuestion: activeQuizQuestion,
          userQuizAnswer: spokenText
        })
      });

      if (!response.ok) throw new Error('Voice service failed');
      const data = await response.json();

      // Check if language mode switched
      if (data.languageMode && data.languageMode !== voiceLangMode) {
        setVoiceLangMode(data.languageMode);
      }

      // Clear or update quiz state
      if (data.intent === 'VOICE_QUIZ' && data.quizQuestion) {
        setActiveQuizQuestion(data.quizQuestion);
      } else if (data.intent === 'QUIZ_EVALUATION') {
        setActiveQuizQuestion(null);
      }

      // Handle verse update
      if (data.verse) {
        setCurrentVerse(data.verse);
        onSelectVerse?.(data.verse);
      }

      // Handle navigation intent
      if (data.intent === 'NAVIGATION' && data.targetPlatform !== undefined) {
        onSwitchPlatform(data.targetPlatform);
      }

      // Handle camera scan trigger
      if (data.action === 'OPEN_CAMERA') {
        startCameraMode();
      }

      const yaazhMsg: VoiceMessage = {
        id: `yz-${Date.now()}`,
        sender: 'yaazh',
        text: data.displayText || data.speechText,
        spokenAudio: data.speechText,
        intent: data.intent,
        verse: data.verse,
        quizQuestion: data.quizQuestion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, yaazhMsg]);
      triggerHaptic('success');
      audioCues.playSuccessChime();

      // Read response aloud using permanent ElevenLabs AI Voice
      announceToScreenReader(voiceLangMode === 'ta' ? 'பதிலளித்துப் பேசுகிறது.' : 'Playing spoken response.');
      speakText(data.speechText);

    } catch (err: any) {
      console.error('Voice processing error:', err);
      const errMsg = voiceLangMode === 'ta'
        ? 'மன்னிக்கவும், குரலை பகுப்பாய்வு செய்வதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் பொத்தானைத் தொட்டுப் பேசவும்.'
        : 'Sorry, I could not process your voice command. Please tap the button to speak again.';

      setVoiceState('error');
      triggerHaptic('warning');
      announceToScreenReader(voiceLangMode === 'ta' ? 'குரல் பகுப்பாய்வில் பிழை.' : 'Voice processing error.');
      speakText(errMsg);
    }
  };

  // FULLY WORKING TAP TO SPEAK FUNCTIONALITY
  const toggleListening = async () => {
    // 1. If currently speaking aloud: interrupt and return to idle
    if (voiceState === 'speaking') {
      yaazhElevenPlayer.stop();
      setVoiceState('idle');
      return;
    }

    // 2. If currently listening: user tapped to finish speaking!
    if (voiceState === 'listening' || isListeningRef.current) {
      isListeningRef.current = false;
      setVoiceState('processing');
      audioCues.playStopListening();
      triggerHaptic('medium');

      // Capture whatever real-time text was gathered
      const liveSpeechText = interimRef.current.trim() || interimTranscript.trim();
      yaazhSTT.stop();

      let finalQuery = liveSpeechText;

      // Simultaneously retrieve recorded audio blob and transcribe via ElevenLabs / Gemini STT
      try {
        if (yaazhRecorder.isActive()) {
          const audioBlob = await yaazhRecorder.stopRecording();
          if (audioBlob && audioBlob.size > 1500) {
            try {
              const res = await transcribeAudio(audioBlob, voiceLangMode);
              if (res && res.text && res.text.trim()) {
                finalQuery = res.text.trim();
              }
            } catch (backendSttErr) {
              console.warn('Backend STT failed, using live browser transcript:', backendSttErr);
            }
          }
        }
      } catch (recErr) {
        console.warn('Audio recorder stop error:', recErr);
      }

      // If speech was recognized, immediately process and answer!
      if (finalQuery) {
        audioCues.playSuccessChime();
        triggerHaptic('success');
        setInterimTranscript('');
        await handleProcessVoiceInput(finalQuery);
      } else {
        setVoiceState('idle');
        const retryPrompt = voiceLangMode === 'ta'
          ? 'குரல் கேட்கவில்லை. தயவுசெய்து மீண்டும் பொத்தானைத் தொட்டுப் பேசவும்.'
          : 'Could not capture speech. Please tap the microphone button to try again.';
        announceToScreenReader(retryPrompt, true);
      }
      return;
    }

    // 3. Start Recording & Real-Time Listening (Tap to Speak)
    try {
      setVoiceState('listening');
      isListeningRef.current = true;
      interimRef.current = '';
      setInterimTranscript('');
      setEditingTranscript(null);

      audioCues.playStartListening();
      triggerHaptic('light');

      const listenMsg = voiceLangMode === 'ta'
        ? 'மைக்ரோஃபோன் கேட்கிறது... பேசவும். முடித்ததும் மீண்டும் தொடவும்.'
        : 'Microphone listening. Speak now, then tap to finish.';
      announceToScreenReader(listenMsg, true);

      // Start Browser Web Speech Recognition for instant zero-latency feedback
      const sttLang = voiceLangMode === 'en' ? 'en-US' : 'ta-IN';
      yaazhSTT.startListening({
        lang: sttLang,
        continuous: true,
        onResult: (res: VoiceRecognitionResult) => {
          interimRef.current = res.transcript;
          setInterimTranscript(res.transcript);
        },
        onError: (err: string) => {
          console.warn('Live STT warning:', err);
        }
      });

      // Simultaneously record raw audio for ElevenLabs neural STT
      await yaazhRecorder.startRecording();

    } catch (err: any) {
      console.warn('Direct microphone start fallback:', err);
      // Browser STT fallback if MediaRecorder failed
      yaazhSTT.startListening({
        lang: voiceLangMode === 'en' ? 'en-US' : 'ta-IN',
        continuous: true,
        onResult: (res: VoiceRecognitionResult) => {
          interimRef.current = res.transcript;
          setInterimTranscript(res.transcript);
        },
        onError: () => {
          setVoiceState('idle');
          isListeningRef.current = false;
        }
      });
    }
  };

  // Camera-to-Voice workflow
  const startCameraMode = async () => {
    setIsCameraActive(true);
    setVoiceState('camera_active');
    triggerHaptic('medium');

    const promptText = voiceLangMode === 'ta'
      ? 'கேமரா திறக்கப்பட்டுள்ளது. உங்கள் தொலைபேசியை ஏடு அல்லது நூலின் மீது நிலைநிறுத்தி திரையைத் தொடவும்.'
      : 'Camera active. Position your phone over the palm leaf or printed poem and tap anywhere on the screen.';

    announceToScreenReader(voiceLangMode === 'ta' ? 'கேமரா திறக்கப்பட்டுள்ளது.' : 'Camera active.');
    speakText(promptText);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      console.warn('Camera stream error:', e);
      const errPrompt = voiceLangMode === 'ta'
        ? 'கேமராவைத் திறக்க முடியவில்லை. அனுமதி வழங்கப்பட்டுள்ளதா என சரிபார்க்கவும்.'
        : 'Could not access camera. Please verify camera permissions.';
      announceToScreenReader(voiceLangMode === 'ta' ? 'கேமரா பிழை.' : 'Camera error.');
      speakText(errPrompt);
      setIsCameraActive(false);
      setVoiceState('idle');
    }
  };

  // Capture frame from camera and execute OCR + Voice Readout
  const handleCaptureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    audioCues.playShutterChime();
    triggerHaptic('medium');
    setIsOcrProcessing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCameraStream();

    const processingAudio = voiceLangMode === 'ta'
      ? 'படம் எடுக்கப்பட்டது. மூல நூல்களோடு ஒப்புநோக்கி பாசுரத்தை அடையாளம் காண்கிறது...'
      : 'Image captured. Identifying classical verse against knowledge base...';

    announceToScreenReader(voiceLangMode === 'ta' ? 'பாடல் அடையாளம் காணப்படுகிறது.' : 'Identifying verse.');
    speakText(processingAudio);

    try {
      const ocrRes = await fetch('/api/scanner/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mode: currentRole || 'student'
        })
      });

      const ocrData = await ocrRes.json();
      setIsOcrProcessing(false);

      if (ocrData.identification?.verse) {
        const verse: ClassicalVerse = ocrData.identification.verse;
        setCurrentVerse(verse);
        onSelectVerse?.(verse);

        const lines = verse.linesTa.join('. ');
        const commentary = verse.commentaries[0]?.textTa || verse.vocabulary.map(v => v.classicalMeaningTa).join(' ');

        const spokenAnswer = voiceLangMode === 'ta'
          ? `அடையாளம் காணப்பட்டது: ${verse.workTitleTa}, ${verse.chapterTa || ''}. பாடல் வரிகள்: ${lines}. எளிய பொருள்: ${commentary}. நீங்கள் இப்போது கடின சொற்களைக் கேட்கலாம் அல்லது வினாடி வினா தொடங்கலாம்.`
          : `Recognized verse: ${verse.workTitleEn}, ${verse.chapterEn || ''}. Lines: ${lines}. Meaning: ${verse.vocabulary.map(v => v.englishMeaning).join(', ')}.`;

        const msg: VoiceMessage = {
          id: `ocr-${Date.now()}`,
          sender: 'yaazh',
          text: spokenAnswer,
          spokenAudio: spokenAnswer,
          verse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, msg]);
        triggerHaptic('success');
        audioCues.playSuccessChime();

        announceToScreenReader(voiceLangMode === 'ta' ? 'பாடல் வாசிக்கப்படுகிறது.' : 'Reading identified verse.');
        speakText(spokenAnswer);
      } else {
        const noMatch = voiceLangMode === 'ta'
          ? `எடுக்கப்பட்ட எழுத்துக்கள்: "${ocrData.extractedText || 'தெளிவில்லை'}". மூலப் பாடலோடு நேரடிப் பொருத்தம் அமையவில்லை. தயவுசெய்து கேமராவை மேலும் நிலையாக வைத்து மீண்டும் படம் எடுக்கவும்.`
          : `Extracted text: "${ocrData.extractedText || 'unclear'}". Could not find an exact match in classical corpus. Please try again with better lighting.`;

        announceToScreenReader(voiceLangMode === 'ta' ? 'நேரடிப் பொருத்தம் அமையவில்லை.' : 'No match found.');
        speakText(noMatch);
      }
    } catch (e: any) {
      setIsOcrProcessing(false);
      setVoiceState('idle');
      console.error('Camera to voice OCR failed:', e);
      const errSpeech = voiceLangMode === 'ta'
        ? 'எழுத்துணர்தலில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : 'OCR recognition failed. Please try again.';
      announceToScreenReader(voiceLangMode === 'ta' ? 'எழுத்துணர்தலில் பிழை.' : 'OCR error.');
      speakText(errSpeech);
    }
  };

  // Quick Action Buttons
  const handleQuickCommand = (command: string) => {
    handleProcessVoiceInput(command);
  };

  // Replay speech of last message
  const handleReplayLast = () => {
    const lastYaazhMsg = [...messages].reverse().find(m => m.sender === 'yaazh');
    if (lastYaazhMsg?.spokenAudio) {
      announceToScreenReader(voiceLangMode === 'ta' ? 'மீண்டும் வாசிக்கப்படுகிறது.' : 'Replaying spoken message.');
      speakText(lastYaazhMsg.spokenAudio);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="yaazh-voice-title"
      aria-describedby="yaazh-voice-desc"
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-200 ${
        isHighContrast
          ? 'bg-black text-yellow-300'
          : 'bg-stone-900 text-stone-100'
      }`}
    >
      {/* Accessible Hidden Screen Reader Descriptions */}
      <h1 id="yaazh-voice-title" className="sr-only">
        {voiceLangMode === 'ta' ? 'யாழ் குரல் அணுகல் - பார்வையற்றோருக்கான வாய்ஸ் மோட்' : 'YAAZH Voice Access for Blind and Visually Impaired'}
      </h1>
      <p id="yaazh-voice-desc" className="sr-only">
        {voiceLangMode === 'ta'
          ? 'இந்தத் திரையில் முழுமையாகக் குரல் வழியே செவ்வியல் தமிழை கற்கலாம். திரையின் கீழ்ப் பகுதியில் உள்ள பெரிய பொத்தானைத் தொட்டுப் பேசலாம்.'
          : 'Complete voice interface for Classical Tamil. Tap the large microphone button to speak naturally to study, explore, or research.'}
      </p>

      {/* Top Accessible Control Bar */}
      <header className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${
        isHighContrast ? 'border-yellow-400 bg-black' : 'border-stone-800 bg-stone-950/80 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
            isHighContrast ? 'bg-yellow-400 text-black' : 'bg-amber-600 text-stone-950'
          }`}>
            யா
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <span>{voiceLangMode === 'ta' ? 'யாழ் குரல் அணுகல்' : 'YAAZH Voice Access'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                isHighContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                ElevenLabs Voice
              </span>
            </h2>
            <p className="text-[11px] opacity-75 font-mono">
              {voiceState === 'listening' && (voiceLangMode === 'ta' ? 'கேட்கிறது... பேசவும்' : 'Listening to voice...')}
              {voiceState === 'processing' && (voiceLangMode === 'ta' ? 'சிந்திக்கிறது...' : 'Processing & Grounding...')}
              {voiceState === 'speaking' && (voiceLangMode === 'ta' ? 'பதிலளித்துப் பேசுகிறது...' : 'Speaking answer...')}
              {voiceState === 'camera_active' && (voiceLangMode === 'ta' ? 'கேமரா இயக்கத்தில் உள்ளது' : 'Camera active')}
              {voiceState === 'idle' && (voiceLangMode === 'ta' ? 'தயார் நிலை (Tap to Speak)' : 'Ready · Tap to Speak')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* High Contrast Toggle */}
          <button
            onClick={() => {
              setIsHighContrast(prev => !prev);
              announceToScreenReader(isHighContrast ? 'உயர் மாறுபாடு முடக்கப்பட்டது' : 'உயர் மாறுபாடு இயக்கப்பட்டது', true);
            }}
            className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
              isHighContrast
                ? 'bg-yellow-400 text-black border-yellow-300'
                : 'bg-stone-800 text-stone-300 hover:text-white border-stone-700'
            }`}
            aria-label={isHighContrast ? 'Disable high contrast' : 'Enable high contrast'}
            title="Toggle High Contrast"
          >
            {isHighContrast ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isHighContrast ? 'HC ON' : 'HC'}</span>
          </button>

          {/* Language Mode Toggle: Tamil / English / Tanglish */}
          <div className="inline-flex rounded-lg bg-stone-800 p-0.5 border border-stone-700">
            <button
              onClick={() => {
                setVoiceLangMode('ta');
                announceToScreenReader('தமிழ் குரல் பயன்முறை தேர்ந்தெடுக்கப்பட்டது', true);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                voiceLangMode === 'ta' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => {
                setVoiceLangMode('en');
                announceToScreenReader('English voice mode selected', true);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                voiceLangMode === 'en' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setVoiceLangMode('tanglish');
                announceToScreenReader('Tanglish voice mode selected', true);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                voiceLangMode === 'tanglish' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
              }`}
            >
              Tanglish
            </button>
          </div>

          {/* Close Voice Access */}
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors border cursor-pointer ${
              isHighContrast
                ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                : 'border-stone-700 text-stone-400 hover:text-stone-100 hover:bg-stone-800'
            }`}
            aria-label="Close Voice Access and return to visual view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Body */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-4 py-3">
        {/* Active Verse Banner (if selected) */}
        {currentVerse && !isCameraActive && (
          <div
            role="region"
            aria-label="Current Classical Verse"
            className={`mb-3 p-3 rounded-xl border flex items-center justify-between text-xs shrink-0 ${
              isHighContrast
                ? 'border-yellow-400 bg-stone-950 text-yellow-300'
                : 'border-stone-800 bg-stone-950/60 text-stone-300'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
              <div className="truncate">
                <span className="font-semibold text-stone-100">{currentVerse.workTitleTa}</span>
                {currentVerse.chapterTa && <span> · {currentVerse.chapterTa}</span>}
                <span className="ml-2 opacity-75 font-tamil-serif italic">"{currentVerse.linesTa[0]}"</span>
              </div>
            </div>
            <button
              onClick={() => handleQuickCommand('Read the original poem')}
              className="shrink-0 px-2 py-1 rounded text-[11px] font-mono border border-stone-700 hover:bg-stone-800 cursor-pointer"
              aria-label="Read active poem aloud"
            >
              <Volume2 className="w-3.5 h-3.5 inline mr-1" />
              {voiceLangMode === 'ta' ? 'வாசி' : 'Recite'}
            </button>
          </div>
        )}

        {/* Camera Viewport (when Camera to Voice is triggered) */}
        {isCameraActive && (
          <div
            role="region"
            aria-label="Camera Scan Viewport. Tap anywhere to capture."
            onClick={handleCaptureFrame}
            className={`flex-1 relative rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center cursor-pointer mb-3 ${
              isHighContrast ? 'border-yellow-400 bg-black' : 'border-amber-500/80 bg-stone-950'
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 animate-pulse flex items-center justify-center bg-black/50 mb-4 shadow-lg">
                <Camera className="w-10 h-10 text-amber-300" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white mb-2 shadow-sm">
                {voiceLangMode === 'ta' ? 'திரையைத் தொட்டு படம் எடுக்கவும்' : 'Tap Screen to Capture'}
              </p>
              <p className="text-xs text-stone-300 max-w-sm">
                {voiceLangMode === 'ta'
                  ? 'தொலைபேசியை ஏடு அல்லது நூலின் மீது சீராக வைத்து எங்கு வேண்டுமானாலும் தொடவும்.'
                  : 'Point at any palm-leaf manuscript or printed classical Tamil poem.'}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                stopCameraStream();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white border border-stone-600 hover:bg-black cursor-pointer"
              aria-label="Cancel camera scan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Dialogue Stream */}
        {!isCameraActive && (
          <div
            ref={scrollAreaRef}
            tabIndex={0}
            role="log"
            aria-live="polite"
            aria-label="Voice conversation history"
            className="flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl focus:outline-hidden"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? (isHighContrast
                        ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-300 ml-8'
                        : 'bg-stone-800 border border-stone-700 text-stone-100 ml-8')
                    : (isHighContrast
                        ? 'bg-black border-2 border-yellow-400 text-yellow-200 mr-4'
                        : 'bg-stone-950/80 border border-stone-800 text-stone-100 mr-4 shadow-md')
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono opacity-75 mb-1.5 pb-1 border-b border-stone-800">
                  <span className="font-bold flex items-center gap-1.5">
                    {m.sender === 'yaazh' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>யாழ் AI (YAAZH Voice)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>நீங்கள் (User Voice)</span>
                      </>
                    )}
                  </span>
                  <span>{m.timestamp}</span>
                </div>

                <p className="font-tamil-sans whitespace-pre-line">{m.text}</p>

                {/* Spoken audio controls on bot card */}
                {m.sender === 'yaazh' && m.spokenAudio && (
                  <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-stone-800 text-xs font-mono">
                    <button
                      onClick={() => speakText(m.spokenAudio!)}
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                      aria-label="Replay answer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{voiceLangMode === 'ta' ? 'மீண்டும் கேள்' : 'Replay Answer'}</span>
                    </button>

                    <span className="text-[10px] text-stone-500 font-mono">ElevenLabs TTS</span>
                  </div>
                )}
              </div>
            ))}

            {/* Live Real-Time Hearing Transcript */}
            {interimTranscript && voiceState === 'listening' && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-200 italic flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-1 h-3.5">
                    <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2" />
                    <span className="w-1 bg-amber-400 rounded-full animate-bounce h-3.5" />
                    <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2.5" />
                  </div>
                  <span>{voiceLangMode === 'ta' ? 'கேட்கப்படுகிறது: ' : 'Hearing: '} "{interimTranscript}"</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-amber-900/60 px-2 py-0.5 rounded text-amber-300">
                  Live
                </span>
              </div>
            )}

            {/* Processing State Indicator */}
            {voiceState === 'processing' && (
              <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-amber-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{voiceLangMode === 'ta' ? 'சிந்திக்கிறது... செவ்வியல் மூலங்களுடன் ஒப்புநோக்குகிறது...' : 'Thinking... retrieving grounded classical knowledge...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Optional Edit Transcript Card (if user opens it) */}
        {editingTranscript !== null && !isCameraActive && (
          <div className="p-3 bg-amber-950/90 border border-amber-500 rounded-xl my-2 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 font-tamil-serif">
                {voiceLangMode === 'ta' ? 'கேள்வியைத் திருத்தவும்' : 'Edit Question Before Submitting'}
              </span>
            </div>
            <textarea
              value={editingTranscript}
              onChange={(e) => setEditingTranscript(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 bg-stone-900 rounded border border-amber-600 text-stone-100 font-tamil-sans focus:outline-hidden"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setEditingTranscript(null)}
                className="text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {voiceLangMode === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const finalQ = editingTranscript.trim();
                  setEditingTranscript(null);
                  if (finalQ) handleProcessVoiceInput(finalQ);
                }}
                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{voiceLangMode === 'ta' ? 'அனுப்பு' : 'Submit'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Voice Command Chips */}
        {!isCameraActive && (
          <div
            role="toolbar"
            aria-label="Quick voice command suggestions"
            className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
          >
            <button
              onClick={() => handleQuickCommand('Tanglish la sollu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-amber-600 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
              }`}
            >
              💬 Tanglish la sollu
            </button>

            <button
              onClick={() => handleQuickCommand('Explain this in Tamil')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
            >
              🗣️ தமிழில் விளக்கு
            </button>

            <button
              onClick={() => handleQuickCommand('Explain this in English')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
            >
              🇬🇧 English Explanation
            </button>

            <button
              onClick={() => handleQuickCommand('Read the original poem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
            >
              📜 {voiceLangMode === 'ta' ? 'மூலப் பாடல்' : 'Read Poem'}
            </button>

            <button
              onClick={() => handleQuickCommand('Explain the difficult words')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
            >
              📖 {voiceLangMode === 'ta' ? 'கடின சொற்கள்' : 'Difficult Words'}
            </button>

            <button
              onClick={() => handleQuickCommand('Give me a quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
            >
              🎯 {voiceLangMode === 'ta' ? 'வினாடி வினா' : 'Give me a quiz'}
            </button>

            <button
              onClick={startCameraMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
            >
              📸 {voiceLangMode === 'ta' ? 'கேமரா ஸ்கேன்' : 'Camera to Voice'}
            </button>
          </div>
        )}

        {/* Tactile Microphone & Controls Zone */}
        <div className="pt-2 pb-1 flex flex-col items-center justify-center shrink-0">
          
          {/* Live Audio Visualizer Bar when listening */}
          {voiceState === 'listening' && (
            <div className="w-full mb-2 p-2 rounded-xl bg-rose-950/70 border border-rose-500/60 flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex items-end gap-1 h-4">
                  <span className="w-1.5 bg-rose-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                  <span className="w-1.5 bg-rose-300 rounded-full animate-[bounce_0.6s_infinite_200ms] h-4" />
                  <span className="w-1.5 bg-rose-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2" />
                  <span className="w-1.5 bg-rose-300 rounded-full animate-[bounce_0.6s_infinite_400ms] h-4" />
                </div>
                <span className="font-tamil-sans text-rose-200 truncate">
                  {interimTranscript ? `"${interimTranscript}"` : (voiceLangMode === 'ta' ? 'குரலைக் கேட்கிறது... பேசி முடித்ததும் பொத்தானைத் தொடவும்' : 'Listening... tap button when done')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-rose-300 shrink-0 px-2 py-0.5 rounded bg-rose-900/60">
                MIC ACTIVE
              </span>
            </div>
          )}

          <div className="w-full flex items-center justify-between gap-3">
            {/* Stop Audio Button */}
            <button
              onClick={voiceState === 'speaking' ? () => yaazhElevenPlayer.stop() : handleReplayLast}
              className={`h-16 px-4 rounded-2xl border flex items-center justify-center font-mono text-xs transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 bg-stone-950 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
              aria-label={voiceState === 'speaking' ? 'Stop speaking' : 'Replay last message'}
            >
              {voiceState === 'speaking' ? (
                <div className="flex items-center gap-1.5">
                  <VolumeX className="w-5 h-5 text-rose-400" />
                  <span className="hidden sm:inline">{voiceLangMode === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-5 h-5" />
                  <span className="hidden sm:inline">{voiceLangMode === 'ta' ? 'மீண்டும்' : 'Replay'}</span>
                </div>
              )}
            </button>

            {/* FULLY WORKING CENTER TAP TO SPEAK BUTTON (≥ 64px for accessibility touch accuracy) */}
            <button
              ref={micButtonRef}
              onClick={toggleListening}
              className={`flex-1 h-18 sm:h-20 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl cursor-pointer ${
                voiceState === 'listening'
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-4 ring-rose-500/40'
                  : voiceState === 'processing'
                    ? 'bg-amber-600 text-stone-950 border-amber-400 animate-pulse'
                    : voiceState === 'speaking'
                      ? 'bg-emerald-700 text-white border-emerald-500'
                      : isHighContrast
                        ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300'
                        : 'bg-stone-800 text-stone-100 border-stone-600 hover:bg-stone-700 hover:border-amber-500'
              }`}
              aria-label={
                voiceState === 'listening'
                  ? 'Listening. Tap to send and hear answer.'
                  : voiceState === 'processing'
                    ? 'Processing your voice...'
                    : voiceState === 'speaking'
                      ? 'Speaking answer. Tap to interrupt and speak.'
                      : 'Tap to Speak: Ask questions in Tamil, English, or Tanglish'
              }
            >
              {voiceState === 'listening' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-white animate-ping" />
                  <MicOff className="w-7 h-7" />
                  <div className="text-left">
                    <span className="block text-sm sm:text-base font-bold tracking-wide">
                      {voiceLangMode === 'ta' ? 'கேட்கிறது... முடித்ததும் தொடவும்' : 'Listening... Tap to Send'}
                    </span>
                    <span className="block text-[11px] opacity-90 font-mono">
                      {voiceLangMode === 'ta' ? 'பேசி முடித்ததும் அழுத்தவும்' : 'Tap to receive spoken answer'}
                    </span>
                  </div>
                </>
              ) : voiceState === 'processing' ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin text-stone-950" />
                  <div className="text-left">
                    <span className="block text-sm sm:text-base font-bold tracking-wide">
                      {voiceLangMode === 'ta' ? 'சிந்திக்கிறது...' : 'Processing Voice...'}
                    </span>
                    <span className="block text-[11px] opacity-90 font-mono">
                      {voiceLangMode === 'ta' ? 'பதிலளிக்கத் தயாராகிறது' : 'Generating grounded answer'}
                    </span>
                  </div>
                </>
              ) : voiceState === 'speaking' ? (
                <>
                  <Volume2 className="w-7 h-7 animate-bounce" />
                  <div className="text-left">
                    <span className="block text-sm sm:text-base font-bold tracking-wide">
                      {voiceLangMode === 'ta' ? 'பதில் பேசுகிறது... (தொடவும்)' : 'Speaking Answer... (Tap)'}
                    </span>
                    <span className="block text-[11px] opacity-90 font-mono">
                      {voiceLangMode === 'ta' ? 'குறுக்கிட்டுப் பேசத் தொடவும்' : 'Tap to interrupt and ask question'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7 text-amber-400" />
                  <div className="text-left">
                    <span className="block text-sm sm:text-base font-bold tracking-wide">
                      {voiceLangMode === 'ta' ? 'பேசத் தொடவும் (Tap to Speak)' : 'Tap to Speak'}
                    </span>
                    <span className="block text-[11px] opacity-75 font-mono">
                      {voiceLangMode === 'ta' ? 'தமிழ், English, Tanglish என பேசலாம்' : 'Speak in Tamil, English, or Tanglish'}
                    </span>
                  </div>
                </>
              )}
            </button>

            {/* Camera Scan Button */}
            <button
              onClick={startCameraMode}
              className={`h-16 px-4 rounded-2xl border flex items-center justify-center font-mono text-xs transition-colors cursor-pointer ${
                isHighContrast
                  ? 'border-yellow-400 bg-stone-950 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
              aria-label="Scan page with phone camera to speech"
            >
              <div className="flex items-center gap-1.5">
                <Camera className="w-5 h-5 text-amber-400" />
                <span className="hidden sm:inline">{voiceLangMode === 'ta' ? 'கேமரா' : 'Camera'}</span>
              </div>
            </button>
          </div>

          <p className="mt-2 text-[11px] font-mono text-stone-400 text-center">
            {voiceLangMode === 'ta'
              ? 'விசைப்பலகை: Alt + V | TalkBack & VoiceOver உகந்தது | நேரலை STT & ElevenLabs AI குரல்'
              : 'Keyboard: Alt + V | TalkBack & VoiceOver Accessible | Real-time STT & ElevenLabs Voice'}
          </p>
        </div>
      </div>
    </div>
  );
};
