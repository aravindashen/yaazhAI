import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Camera, RotateCcw, X, BookOpen,
  HelpCircle, Sparkles, CheckCircle2, ChevronRight, Play, Pause,
  Layers, ArrowRight, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import {
  yaazhTTS, yaazhSTT, audioCues, triggerHaptic, announceToScreenReader,
  VoiceState, VoiceRecognitionResult
} from '../services/voiceAccessService.ts';
import { ClassicalVerse, UserRole } from '../types/index.ts';
import { Language } from '../services/i18n.ts';

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
  const [voiceLang, setVoiceLang] = useState<'ta' | 'en'>(language === 'en' ? 'en' : 'ta');
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<any | null>(null);

  useEffect(() => {
    setVoiceLang(language === 'en' ? 'en' : 'ta');
  }, [language]);

  // Camera to Voice state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const micButtonRef = useRef<HTMLButtonElement | null>(null);

  // Update active verse if parent changes
  useEffect(() => {
    if (initialVerse) {
      setCurrentVerse(initialVerse);
    }
  }, [initialVerse]);

  // Initial welcome greeting when Voice Access is opened
  useEffect(() => {
    if (isOpen) {
      triggerHaptic('medium');
      audioCues.playSuccessChime();

      const welcomeTa = 'வணக்கம். நீங்கள் யாழ் குரல் அணுகலில் உள்ளீர்கள். நீங்கள் எந்தக் கேள்வியும் கேட்கலாம், அல்லது "எளிய விளக்கம்", "கடின சொற்கள்", "மூலப் பாடல்", "வினாடி வினா", அல்லது "கேமரா ஸ்கேன்" எனக் கூறலாம்.';
      const welcomeEn = 'Welcome to YAAZH Voice Access. Ask any Classical Tamil question, or say "Explain simple", "Difficult words", "Read poem", "Quiz me", or "Camera scan".';
      const welcomeText = voiceLang === 'ta' ? welcomeTa : welcomeEn;

      announceToScreenReader(welcomeText, true);

      const welcomeMsg: VoiceMessage = {
        id: 'msg-welcome',
        sender: 'yaazh',
        text: welcomeText,
        spokenAudio: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);

      // Speak welcome aloud
      setVoiceState('speaking');
      yaazhTTS.speak(welcomeText, {
        lang: voiceLang,
        rate: speechRate,
        onEnd: () => setVoiceState('idle')
      });

      // Auto-focus microphone button for screen readers
      setTimeout(() => {
        micButtonRef.current?.focus();
      }, 300);
    } else {
      yaazhTTS.stop();
      yaazhSTT.stop();
      stopCameraStream();
      setVoiceState('idle');
    }
  }, [isOpen]);

  // Auto-scroll chat area
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

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
      yaazhTTS.stop();
      yaazhSTT.stop();
    };
  }, []);

  // Voice Interaction Handler
  const handleProcessVoiceInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setVoiceState('processing');
    announceToScreenReader(`கேட்கப்பட்டது: ${spokenText}. சிந்திக்கிறது...`, true);

    const userMsg: VoiceMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInterimTranscript('');

    try {
      // Check if answering an active quiz
      const isQuizAnswer = !!activeQuizQuestion;

      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: spokenText,
          currentVerseId: currentVerse?.id,
          currentRole,
          language: voiceLang,
          action: isQuizAnswer ? 'EVALUATE_QUIZ' : undefined,
          currentQuizQuestion: activeQuizQuestion,
          userQuizAnswer: spokenText
        })
      });

      if (!response.ok) throw new Error('Voice service failed');
      const data = await response.json();

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

      // Read response aloud
      setVoiceState('speaking');
      announceToScreenReader(data.speechText, true);

      yaazhTTS.speak(data.speechText, {
        lang: voiceLang,
        rate: speechRate,
        onEnd: () => {
          setVoiceState('idle');
          // If in quiz mode, automatically open mic after reading question
          if (data.intent === 'VOICE_QUIZ') {
            setTimeout(() => toggleListening(), 400);
          }
        },
        onError: () => setVoiceState('idle')
      });

    } catch (err: any) {
      console.error('Voice processing error:', err);
      const errMsg = voiceLang === 'ta'
        ? 'மன்னிக்கவும், குரலை பகுப்பாய்வு செய்வதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் கூறவும்.'
        : 'Sorry, I could not process your voice command. Please try speaking again.';

      setVoiceState('error');
      triggerHaptic('warning');
      announceToScreenReader(errMsg, true);

      yaazhTTS.speak(errMsg, {
        lang: voiceLang,
        onEnd: () => setVoiceState('idle')
      });
    }
  };

  // Toggle microphone listening
  const toggleListening = () => {
    if (voiceState === 'speaking') {
      yaazhTTS.stop();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'listening') {
      yaazhSTT.stop();
      setVoiceState('idle');
      return;
    }

    setVoiceState('listening');
    setInterimTranscript('');
    announceToScreenReader('மைக்ரோஃபோன் தயார். பேசவும்...', true);

    yaazhSTT.startListening({
      lang: voiceLang === 'ta' ? 'ta-IN' : 'en-US',
      onResult: (res: VoiceRecognitionResult) => {
        setInterimTranscript(res.transcript);
        if (res.isFinal && res.transcript.trim()) {
          handleProcessVoiceInput(res.transcript);
        }
      },
      onEnd: () => {
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      },
      onError: (err: string) => {
        console.warn('Speech recog error:', err);
        setVoiceState('idle');
        const errAudio = voiceLang === 'ta'
          ? 'குரல் கேட்கவில்லை. மைக்ரோஃபோன் பொத்தானைத் தொட்டு மீண்டும் பேசவும்.'
          : 'Could not capture speech. Please tap the microphone button to try again.';
        announceToScreenReader(errAudio, true);
      }
    });
  };

  // Camera-to-Voice workflow
  const startCameraMode = async () => {
    setIsCameraActive(true);
    setVoiceState('camera_active');
    triggerHaptic('medium');

    const promptText = voiceLang === 'ta'
      ? 'கேமரா திறக்கப்பட்டுள்ளது. உங்கள் தொலைபேசியை ஏடு அல்லது நூலின் மீது நிலைநிறுத்தி திரையைத் தொடவும் அல்லது "படம் எடு" எனக் கூறவும்.'
      : 'Camera active. Position your phone over the palm leaf or printed poem and tap anywhere on the screen.';

    announceToScreenReader(promptText, true);
    yaazhTTS.speak(promptText, { lang: voiceLang, rate: speechRate });

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
      const errPrompt = voiceLang === 'ta'
        ? 'கேமராவைத் திறக்க முடியவில்லை. அனுமதி வழங்கப்பட்டுள்ளதா என சரிபார்க்கவும்.'
        : 'Could not access camera. Please verify camera permissions.';
      announceToScreenReader(errPrompt, true);
      yaazhTTS.speak(errPrompt, { lang: voiceLang });
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

    const processingAudio = voiceLang === 'ta'
      ? 'படம் எடுக்கப்பட்டது. மூல நூல்களோடு ஒப்புநோக்கி பாசுரத்தை அடையாளம் காண்கிறது...'
      : 'Image captured. Identifying classical verse against knowledge base...';

    announceToScreenReader(processingAudio, true);
    yaazhTTS.speak(processingAudio, { lang: voiceLang, rate: speechRate });

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

        const spokenAnswer = voiceLang === 'ta'
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

        setVoiceState('speaking');
        announceToScreenReader(spokenAnswer, true);
        yaazhTTS.speak(spokenAnswer, {
          lang: voiceLang,
          rate: speechRate,
          onEnd: () => setVoiceState('idle')
        });
      } else {
        const noMatch = voiceLang === 'ta'
          ? `எடுக்கப்பட்ட எழுத்துக்கள்: "${ocrData.extractedText || 'தெளிவில்லை'}". மூலப் பாடலோடு நேரடிப் பொருத்தம் அமையவில்லை. தயவுசெய்து கேமராவை மேலும் நிலையாக வைத்து மீண்டும் படம் எடுக்கவும்.`
          : `Extracted text: "${ocrData.extractedText || 'unclear'}". Could not find an exact match in classical corpus. Please try again with better lighting.`;

        announceToScreenReader(noMatch, true);
        yaazhTTS.speak(noMatch, { lang: voiceLang, onEnd: () => setVoiceState('idle') });
      }
    } catch (e: any) {
      setIsOcrProcessing(false);
      setVoiceState('idle');
      console.error('Camera to voice OCR failed:', e);
      const errSpeech = voiceLang === 'ta'
        ? 'எழுத்துணர்தலில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : 'OCR recognition failed. Please try again.';
      announceToScreenReader(errSpeech, true);
      yaazhTTS.speak(errSpeech, { lang: voiceLang });
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
      setVoiceState('speaking');
      announceToScreenReader(lastYaazhMsg.spokenAudio, true);
      yaazhTTS.speak(lastYaazhMsg.spokenAudio, {
        lang: voiceLang,
        rate: speechRate,
        onEnd: () => setVoiceState('idle')
      });
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
        {voiceLang === 'ta' ? 'யாழ் குரல் அணுகல் - பார்வையற்றோருக்கான வாய்ஸ் மோட்' : 'YAAZH Voice Access for Blind and Visually Impaired'}
      </h1>
      <p id="yaazh-voice-desc" className="sr-only">
        {voiceLang === 'ta'
          ? 'இந்தத் திரையில் முழுமையாகக் குரல் வழியே செவ்வியல் தமிழை கற்கலாம். திரையின் கீழ்ப் பகுதியைப் பெரிதாகத் தொட்டு மைக்ரோஃபோனை இயக்கலாம்.'
          : 'Complete voice interface for Classical Tamil. Tap the large microphone area or speak naturally to study, explore, or research.'}
      </p>

      {/* Top Accessible Control Bar */}
      <header className={`px-4 py-3 flex items-center justify-between border-b ${
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
              <span>{voiceLang === 'ta' ? 'யாழ் குரல் அணுகல்' : 'YAAZH Voice Access'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                isHighContrast ? 'bg-yellow-400 text-black' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {voiceLang === 'ta' ? 'பார்வையற்றோர் அணுகல்' : 'Accessible Voice'}
              </span>
            </h2>
            <p className="text-[11px] opacity-75 font-mono">
              {voiceState === 'listening' && (voiceLang === 'ta' ? 'கேட்கிறது... பேசவும்' : 'Listening...')}
              {voiceState === 'processing' && (voiceLang === 'ta' ? 'சிந்திக்கிறது...' : 'Processing...')}
              {voiceState === 'speaking' && (voiceLang === 'ta' ? 'பேசுகிறது...' : 'Speaking...')}
              {voiceState === 'camera_active' && (voiceLang === 'ta' ? 'கேமரா இயக்கத்தில் உள்ளது' : 'Camera active')}
              {voiceState === 'idle' && (voiceLang === 'ta' ? 'தயார் நிலையில் உள்ளது' : 'Ready')}
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
            className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1 border transition-colors ${
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

          {/* Language Toggle */}
          <button
            onClick={() => {
              const next = voiceLang === 'ta' ? 'en' : 'ta';
              setVoiceLang(next);
              announceToScreenReader(next === 'ta' ? 'தமிழ் குரல் தேர்ந்தெடுக்கப்பட்டது' : 'English voice selected', true);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              isHighContrast
                ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400/20'
                : 'border-stone-700 text-stone-300 hover:bg-stone-800'
            }`}
            aria-label="Switch voice language between Tamil and English"
          >
            {voiceLang === 'ta' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>

          {/* Speech Rate: Slow / Normal */}
          <button
            onClick={() => {
              const newRate = speechRate === 0.9 ? 0.75 : 0.9;
              setSpeechRate(newRate);
              announceToScreenReader(newRate === 0.75 ? 'மெதுவான வாசிப்பு வேகம்' : 'சாதாரண வாசிப்பு வேகம்', true);
            }}
            className={`px-2 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              speechRate === 0.75
                ? (isHighContrast ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-amber-600 text-stone-950 border-amber-500')
                : (isHighContrast ? 'border-yellow-400 text-yellow-300' : 'border-stone-700 text-stone-300')
            }`}
            aria-label="Toggle speech pace between slow classical meter and normal"
            title="Speech pace"
          >
            {speechRate === 0.75 ? '0.75x' : '1.0x'}
          </button>

          {/* Close Voice Access */}
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors border ${
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

      {/* Main Interactive Body: Accessible Dialogue & Voice Waveform */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto px-4 py-3">
        {/* Active Verse Banner (if selected) */}
        {currentVerse && !isCameraActive && (
          <div
            role="region"
            aria-label="Current Classical Verse"
            className={`mb-3 p-3 rounded-xl border flex items-center justify-between text-xs ${
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
              onClick={() => handleQuickCommand('Read original poem')}
              className="shrink-0 px-2 py-1 rounded text-[11px] font-mono border border-stone-700 hover:bg-stone-800"
              aria-label="Read active poem aloud"
            >
              <Volume2 className="w-3.5 h-3.5 inline mr-1" />
              {voiceLang === 'ta' ? 'வாசி' : 'Recite'}
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

            {/* Accessible Audio Reticle Overlay */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 animate-pulse flex items-center justify-center bg-black/50 mb-4 shadow-lg">
                <Camera className="w-10 h-10 text-amber-300" />
              </div>
              <p className="text-base sm:text-lg font-bold text-white mb-2 shadow-sm">
                {voiceLang === 'ta' ? 'திரையைத் தொட்டு படம் எடுக்கவும்' : 'Tap Screen to Capture'}
              </p>
              <p className="text-xs text-stone-300 max-w-sm">
                {voiceLang === 'ta'
                  ? 'தொலைபேசியை ஏடு அல்லது நூலின் மீது சீராக வைத்து எங்கு வேண்டுமானாலும் தொடவும்.'
                  : 'Point at any palm-leaf manuscript or printed classical Tamil poem.'}
              </p>
            </div>

            {/* Cancel Camera Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                stopCameraStream();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white border border-stone-600 hover:bg-black"
              aria-label="Cancel camera scan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Dialogue Stream for Screen Reader & Visual User */}
        {!isCameraActive && (
          <div
            ref={scrollAreaRef}
            tabIndex={0}
            role="log"
            aria-live="polite"
            aria-label="Voice conversation history"
            className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 focus:outline-hidden"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl text-sm leading-relaxed border ${
                  msg.sender === 'user'
                    ? isHighContrast
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200 ml-8'
                      : 'border-stone-700 bg-stone-800 text-stone-100 ml-8'
                    : isHighContrast
                      ? 'border-yellow-400 bg-black text-yellow-300 mr-8'
                      : 'border-stone-800 bg-stone-950/80 text-stone-200 mr-8'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] opacity-75 font-mono mb-1">
                  <span>{msg.sender === 'user' ? (voiceLang === 'ta' ? 'நீங்கள்' : 'You') : 'யாழ் குரல் (YAAZH)'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="font-tamil-sans select-text">
                  {msg.text}
                </div>

                {/* If message has spoken audio, allow repeating */}
                {msg.spokenAudio && (
                  <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setVoiceState('speaking');
                        yaazhTTS.speak(msg.spokenAudio!, {
                          lang: voiceLang,
                          rate: speechRate,
                          onEnd: () => setVoiceState('idle')
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono"
                      aria-label="Read this response again"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{voiceLang === 'ta' ? 'மீண்டும் கேள்' : 'Listen again'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Interim live speech transcript while user is speaking */}
            {interimTranscript && (
              <div
                aria-live="polite"
                className={`p-3 rounded-xl border border-dashed text-sm italic ml-8 animate-pulse ${
                  isHighContrast ? 'border-yellow-400 text-yellow-300' : 'border-amber-500/60 text-amber-300 bg-amber-950/20'
                }`}
              >
                <span className="text-xs font-mono block not-italic mb-1 opacity-75">
                  {voiceLang === 'ta' ? 'பேசுவது பதிவு செய்யப்படுகிறது...' : 'Transcribing speech...'}
                </span>
                "{interimTranscript}"
              </div>
            )}
          </div>
        )}

        {/* Quick Voice Commands for Blind / Motor-Impaired Users */}
        {!isCameraActive && (
          <div
            role="region"
            aria-label="Voice shortcuts"
            className="py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2 border-t border-stone-800"
          >
            <button
              onClick={() => handleQuickCommand('Explain this poem in simple Tamil')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 hover:border-amber-500'
              }`}
            >
              🗣️ {voiceLang === 'ta' ? 'எளிய விளக்கம்' : 'Explain Simple'}
            </button>

            <button
              onClick={() => handleQuickCommand('Explain the difficult words')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 hover:border-amber-500'
              }`}
            >
              📖 {voiceLang === 'ta' ? 'கடின சொற்கள்' : 'Difficult Words'}
            </button>

            <button
              onClick={() => handleQuickCommand('Give me the historical context')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 hover:border-amber-500'
              }`}
            >
              🏛️ {voiceLang === 'ta' ? 'வரலாற்றுப் பின்னணி' : 'Context'}
            </button>

            <button
              onClick={() => handleQuickCommand('Read the original poem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 hover:border-amber-500'
              }`}
            >
              📜 {voiceLang === 'ta' ? 'மூலப் பாடல்' : 'Read Poem'}
            </button>

            <button
              onClick={() => handleQuickCommand('Quiz me on this')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 hover:border-amber-500'
              }`}
            >
              🎯 {voiceLang === 'ta' ? 'வினாடி வினா' : 'Voice Quiz'}
            </button>

            <button
              onClick={startCameraMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 border transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                  : 'border-amber-600 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
              }`}
            >
              📸 {voiceLang === 'ta' ? 'கேமரா ஸ்கேன்' : 'Camera to Voice'}
            </button>
          </div>
        )}

        {/* Large Tactile Voice Touch Zone for Smartphone Usability */}
        <div className="pt-2 pb-1 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between gap-3">
            {/* Stop / Replay Audio Button */}
            <button
              onClick={voiceState === 'speaking' ? () => yaazhTTS.stop() : handleReplayLast}
              className={`h-16 px-4 rounded-2xl border flex items-center justify-center font-mono text-xs transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 bg-stone-950 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
              aria-label={voiceState === 'speaking' ? 'Stop speaking' : 'Replay last message'}
            >
              {voiceState === 'speaking' ? (
                <div className="flex items-center gap-1.5">
                  <VolumeX className="w-5 h-5 text-rose-400" />
                  <span className="hidden sm:inline">{voiceLang === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-5 h-5" />
                  <span className="hidden sm:inline">{voiceLang === 'ta' ? 'மீண்டும்' : 'Replay'}</span>
                </div>
              )}
            </button>

            {/* Giant Center Microphone Button (≥ 64px for visually impaired touch accuracy) */}
            <button
              ref={micButtonRef}
              onClick={toggleListening}
              className={`flex-1 h-18 sm:h-20 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
                voiceState === 'listening'
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-4 ring-rose-500/40'
                  : voiceState === 'speaking'
                    ? 'bg-amber-600 text-stone-950 border-amber-400'
                    : isHighContrast
                      ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300'
                      : 'bg-stone-800 text-stone-100 border-stone-600 hover:bg-stone-700 hover:border-amber-500'
              }`}
              aria-label={
                voiceState === 'listening'
                  ? 'Listening. Tap to send.'
                  : voiceState === 'speaking'
                    ? 'Speaking. Tap to interrupt and speak.'
                    : 'Tap to speak your question or command'
              }
            >
              {voiceState === 'listening' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-white animate-ping" />
                  <MicOff className="w-7 h-7" />
                  <div className="text-left">
                    <span className="block text-sm font-bold tracking-wide">
                      {voiceLang === 'ta' ? 'கேட்கிறது... முடித்ததும் தொடவும்' : 'Listening... Tap to finish'}
                    </span>
                    <span className="block text-[11px] opacity-90 font-mono">
                      {voiceLang === 'ta' ? 'அல்லது பேசி முடிக்கவும்' : 'Or pause after speaking'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7 text-amber-400" />
                  <div className="text-left">
                    <span className="block text-sm font-bold tracking-wide">
                      {voiceLang === 'ta' ? 'பேசத் தொடவும்' : 'Tap to Speak'}
                    </span>
                    <span className="block text-[11px] opacity-75 font-mono">
                      {voiceLang === 'ta' ? 'கேள்வி கேட்கலாம் அல்லது கட்டளைகள் கூறலாம்' : 'Ask questions or issue commands'}
                    </span>
                  </div>
                </>
              )}
            </button>

            {/* Camera Scan Button */}
            <button
              onClick={startCameraMode}
              className={`h-16 px-4 rounded-2xl border flex items-center justify-center font-mono text-xs transition-colors ${
                isHighContrast
                  ? 'border-yellow-400 bg-stone-950 text-yellow-300'
                  : 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800'
              }`}
              aria-label="Scan page with phone camera to speech"
            >
              <div className="flex items-center gap-1.5">
                <Camera className="w-5 h-5 text-amber-400" />
                <span className="hidden sm:inline">{voiceLang === 'ta' ? 'கேமரா' : 'Camera'}</span>
              </div>
            </button>
          </div>

          <p className="mt-2 text-[11px] font-mono text-stone-400 text-center">
            {voiceLang === 'ta'
              ? 'விசைப்பலகை குறுக்குவழி: Alt + V | திரைப் படிப்பி: TalkBack & VoiceOver உகந்தது'
              : 'Keyboard shortcut: Alt + V | Compatible with Android TalkBack and iOS VoiceOver'}
          </p>
        </div>
      </div>
    </div>
  );
};
