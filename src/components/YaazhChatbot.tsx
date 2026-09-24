import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Camera, 
  Mic, 
  Copy, 
  Check, 
  BookOpen, 
  RotateCcw, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Maximize2, 
  Minimize2,
  GraduationCap,
  Compass,
  Microscope,
  Home,
  Play,
  Pause,
  Square,
  RotateCw,
  Loader2,
  Globe,
  Radio,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import { UserRole, ClassicalVerse } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { AudioPronunciation } from './AudioPronunciation.tsx';
import { 
  yaazhElevenPlayer, 
  yaazhRecorder, 
  yaazhSTT,
  transcribeAudio, 
  announceToScreenReader, 
  audioCues, 
  triggerHaptic 
} from '../services/voiceAccessService.ts';

export type VoiceLanguageMode = 'ta' | 'en' | 'tanglish';

interface ChatMessage {
  id: string;
  sender: 'user' | 'yaazh';
  text: string;
  timestamp: string;
  responseType?: 'translation' | 'answer' | 'search' | 'inquiry_answer';
  verse?: ClassicalVerse;
  citations?: string[];
  highlightQuote?: string;
  followUpSuggestions?: string[];
  languageMode?: VoiceLanguageMode;
  translationData?: {
    originalText: string;
    translatedText: string;
    detectedSourceLang?: string;
    targetLang?: string;
    translator?: string;
    source?: string;
    notes?: string;
    transliteration?: string;
  };
  answerData?: {
    canonicalAnswer: string;
    confidenceScore?: number;
    evidenceCount?: number;
  };
}

interface YaazhChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentRole: UserRole | null;
  userName?: string;
  onInspectVerse?: (verse: ClassicalVerse) => void;
  onOpenScanner?: () => void;
  onOpenVoiceAccess?: () => void;
}

export const YaazhChatbot: React.FC<YaazhChatbotProps> = ({
  isOpen,
  onClose,
  language,
  currentRole,
  userName = 'அன்பர்',
  onInspectVerse,
  onOpenScanner,
  onOpenVoiceAccess
}) => {
  const isTa = language === 'ta';
  const t = TRANSLATIONS[language];

  // Language Mode: 'ta' | 'en' | 'tanglish'
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<VoiceLanguageMode>(isTa ? 'ta' : 'en');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);

  // Input & Thinking State
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // ElevenLabs Voice Recording (STT) State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState<{
    text: string;
    detectedLanguage: string;
    isCommand: boolean;
    detectedCommand?: string;
  } | null>(null);

  // Audio Playback (TTS) State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const [audioProgress, setAudioProgress] = useState({ currentTime: 0, duration: 0 });

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'yaazh',
      text: isTa
        ? `வணக்கம் ${userName}! நான் உங்கள் யாழ் AI (YAAZH AI) — ElevenLabs குரல் வசதியுடன் இயங்கும் தமிழ் அறிவுத்தளம். செம்மொழித் தமிழ் நூல்கள், திருக்குறள், சங்கப் பாடல்கள், உரை விளக்கங்கள், இலக்கணம், மொழிபெயர்ப்பு, அல்லது பொதுவான எதைப் பற்றியும் பேசவும் கேட்கவும் செய்யலாம். தமிழ், ஆங்கிலம், அல்லது Tanglish என எந்த மொழியிலும் என்னிடம் வினவலாம்!`
        : `Greetings ${userName}! I am YAAZH AI — enhanced with ElevenLabs AI Voice capabilities. You can speak and listen to Classical Tamil literature, Tirukkural, grammar, translations, and learning inquiries in Tamil, English, or Tanglish. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUpSuggestions: isTa
        ? [
            'யாதும் ஊரே யாவரும் கேளிர் முழு விளக்கம்',
            'திருக்குறள் 81 பதம் பிரித்து உரை கூறுக',
            'Tanglish la sollu',
            'பாடலை வாசி (Read this poem)',
            'கடின சொற்கள் விளக்கம்'
          ]
        : [
            'Explain Yadhum Oore Yaavarum Kelir in depth',
            'Break down Tirukkural 81 with word meanings',
            'Explain this in Tanglish',
            'Read this poem',
            'Give me a quiz'
          ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking, transcriptPreview]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Subscribe to ElevenLabs Audio Player state updates
  useEffect(() => {
    const unsubscribe = yaazhElevenPlayer.subscribe((state, progress) => {
      setAudioState(state);
      if (progress) {
        setAudioProgress(progress);
      }
      if (state === 'idle' || state === 'error') {
        if (state === 'idle' && audioState === 'playing') {
          announceToScreenReader('Audio response finished playing.');
        }
      }
    });

    return () => {
      unsubscribe();
      yaazhElevenPlayer.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Format second duration helper (mm:ss)
  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ==========================================
  // ElevenLabs Voice Recording Controls (STT)
  // ==========================================
  const handleStartRecording = async () => {
    try {
      // Stop any ongoing audio playback
      handleStopAudio();
      setTranscriptPreview(null);
      setRecordingSeconds(0);

      // Start browser STT in parallel for instant zero-latency speech recognition
      const sttLang = selectedLanguageMode === 'en' ? 'en-US' : 'ta-IN';
      yaazhSTT.startListening({
        lang: sttLang,
        continuous: true,
        onResult: (_res: any) => {
          // If interim, update preview or inputQuery gently if helpful
        },
        onError: (err: string) => {
          console.warn('Chatbot live STT note:', err);
        }
      });

      await yaazhRecorder.startRecording();
      setIsRecording(true);

      const langName = selectedLanguageMode === 'tanglish' ? 'Tanglish' : selectedLanguageMode === 'en' ? 'English' : 'Tamil';
      announceToScreenReader(`Voice recording started in ${langName}. Speak your question now.`);

      // Recording timer (limit to 60s)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            handleStopRecordingAndTranscribe();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      setIsRecording(false);
      yaazhSTT.stop();
      announceToScreenReader('Microphone access denied or unavailable.');
    }
  };

  const handleStopRecordingAndTranscribe = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      setIsRecording(false);
      setIsTranscribing(true);
      announceToScreenReader('Processing your voice recording.');

      const browserText = yaazhSTT.getLatestTranscript();
      yaazhSTT.stop();

      let finalText = browserText.trim();
      let detectedLang: 'tamil' | 'tanglish' | 'english' = selectedLanguageMode === 'en' ? 'english' : selectedLanguageMode === 'tanglish' ? 'tanglish' : 'tamil';
      let isCmd = false;
      let detectedCmd: string | undefined = undefined;

      try {
        if (yaazhRecorder.isActive()) {
          const audioBlob = await yaazhRecorder.stopRecording();
          if (audioBlob && audioBlob.size > 1500) {
            try {
              const result = await transcribeAudio(audioBlob, selectedLanguageMode);
              if (result && result.text && result.text.trim()) {
                finalText = result.text.trim();
                detectedLang = result.detectedLanguage;
                isCmd = result.isCommand;
                detectedCmd = result.detectedCommand;
              }
            } catch (sttErr) {
              console.warn('Backend STT failed, using browser transcript:', sttErr);
            }
          }
        }
      } catch (recErr) {
        console.warn('Recorder stop error:', recErr);
      }

      setIsTranscribing(false);

      if (finalText) {
        audioCues.playSuccessChime();
        triggerHaptic('success');

        // Check if a voice command was detected
        if (detectedCmd === 'SET_LANG_TANGLISH') {
          setSelectedLanguageMode('tanglish');
        } else if (detectedCmd === 'SET_LANG_TAMIL') {
          setSelectedLanguageMode('ta');
        } else if (detectedCmd === 'SET_LANG_ENGLISH') {
          setSelectedLanguageMode('en');
        }

        // Present editable transcript preview to user
        setTranscriptPreview({
          text: finalText,
          detectedLanguage: detectedLang,
          isCommand: isCmd,
          detectedCommand: detectedCmd
        });

        announceToScreenReader(`Speech recognized: "${finalText}". You may edit or submit.`);
      } else {
        announceToScreenReader('No speech was detected. Please try recording again.');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      yaazhSTT.stop();
      setIsTranscribing(false);
      announceToScreenReader('Speech-to-text recognition encountered an error.');
    }
  };

  const handleCancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    yaazhSTT.stop();
    yaazhRecorder.cancelRecording();
    setIsRecording(false);
    setRecordingSeconds(0);
    announceToScreenReader('Voice recording cancelled.');
  };

  // ==========================================
  // ElevenLabs Spoken Audio Playback Controls (TTS)
  // ==========================================
  const handlePlayAudio = async (messageId: string, text: string) => {
    if (playingMessageId === messageId && audioState === 'playing') {
      handlePauseAudio();
      return;
    }

    if (playingMessageId === messageId && audioState === 'paused') {
      handleResumeAudio();
      return;
    }

    setPlayingMessageId(messageId);
    announceToScreenReader('Synthesizing speech with ElevenLabs.');

    await yaazhElevenPlayer.playText(text, {
      language: selectedLanguageMode,
      onStart: () => {
        announceToScreenReader('Playing spoken response.');
      },
      onEnd: () => {
        setPlayingMessageId(null);
      },
      onError: (err) => {
        console.error('Audio playback error:', err);
        setPlayingMessageId(null);
        announceToScreenReader('Audio playback error.');
      }
    });
  };

  const handlePauseAudio = () => {
    yaazhElevenPlayer.pause();
    announceToScreenReader('Audio paused.');
  };

  const handleResumeAudio = () => {
    yaazhElevenPlayer.resume();
    announceToScreenReader('Audio resumed.');
  };

  const handleStopAudio = () => {
    yaazhElevenPlayer.stop();
    setPlayingMessageId(null);
    announceToScreenReader('Audio stopped.');
  };

  const handleReplayAudio = (messageId: string, text: string) => {
    handleStopAudio();
    setTimeout(() => {
      handlePlayAudio(messageId, text);
    }, 100);
  };

  // Mode badge metadata
  const getModeInfo = () => {
    switch (currentRole) {
      case 'study':
      case 'student':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5" />,
          labelTa: 'கற்றல் பயன்முறை (Study)',
          labelEn: 'Study Mode',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300'
        };
      case 'explore':
      case 'learner':
        return {
          icon: <Compass className="w-3.5 h-3.5" />,
          labelTa: 'அறிதல் பயன்முறை (Explore)',
          labelEn: 'Explore Mode',
          color: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'research':
      case 'researcher':
        return {
          icon: <Microscope className="w-3.5 h-3.5" />,
          labelTa: 'ஆய்வுப் பயன்முறை (Research)',
          labelEn: 'Research Mode',
          color: 'bg-stone-200 text-stone-900 border-stone-300'
        };
      default:
        return {
          icon: <Home className="w-3.5 h-3.5" />,
          labelTa: 'பொதுத் தளம் (Home)',
          labelEn: 'Home Mode',
          color: 'bg-stone-100 text-stone-800 border-stone-200'
        };
    }
  };

  // Contextual suggestion chips tailored for the active mode
  const getSuggestions = () => {
    if (selectedLanguageMode === 'tanglish') {
      return [
        { ta: 'Yadhum oore yaavarum kelir explain pannu', en: 'Explain Yadhum oore in Tanglish' },
        { ta: 'Thirukkural 81 simple ah sollu', en: 'Explain Kural 81 in simple Tanglish' },
        { ta: 'Difficult words explain pannu', en: 'Explain difficult words' },
        { ta: 'Quiz kudu', en: 'Give me a quiz' }
      ];
    }

    if (currentRole === 'study' || currentRole === 'student') {
      return [
        { ta: 'புறநானூறு 192 பதம் பிரித்து இலக்கணம் தருக', en: 'Break down Purananuru 192 grammar & sandhi' },
        { ta: 'விருந்தோம்பல் அதிகாரத்தின் முக்கிய வினாக்கள்', en: 'Key exam review questions on Hospitality' },
        { ta: 'Tanglish la sollu', en: 'Explain this in Tanglish' },
        { ta: 'வினாடி வினா கேள் (Give me a quiz)', en: 'Give me a quiz' }
      ];
    }

    if (currentRole === 'explore' || currentRole === 'learner') {
      return [
        { ta: 'பத்துப்பாட்டு நூல்களின் காலவரிசை மற்றும் சிறப்பு', en: 'Timeline and significance of Pattuppattu' },
        { ta: 'பாடலை வாசி (Read this poem)', en: 'Read this poem' },
        { ta: 'சங்க காலப் பெண் புலவர்கள் யார் யார்?', en: 'Who are the prominent Sangam women poets?' },
        { ta: 'Tanglish la sollu', en: 'Explain this in Tanglish' }
      ];
    }

    // Default / Home
    return [
      { ta: 'யாதும் ஊரே யாவரும் கேளிர் விளக்கம்', en: 'Explain Yadhum Oore Yaavarum Kelir' },
      { ta: 'பாடலை வாசி (Read this poem)', en: 'Read this poem' },
      { ta: 'கடின சொற்கள் விளக்கம்', en: 'Explain the difficult words' },
      { ta: 'Tanglish la sollu', en: 'Explain this in Tanglish' }
    ];
  };

  // Helper to format text with bold, bullet points, and clean line wraps
  const renderFormattedText = (content: string) => {
    const paragraphs = content.split(/\n\s*\n/);
    return (
      <div className="space-y-2.5 leading-relaxed">
        {paragraphs.map((para, pIdx) => {
          const lines = para.split('\n');
          return (
            <div key={pIdx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                const isH3 = trimmed.startsWith('### ');
                const isH2 = trimmed.startsWith('## ') || trimmed.startsWith('# ');
                const isQuote = trimmed.startsWith('>');
                const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ') || /^\d+\.\s/.test(trimmed);
                
                let cleanLine = trimmed;
                if (isH3) cleanLine = trimmed.replace(/^###\s*/, '');
                else if (isH2) cleanLine = trimmed.replace(/^#{1,2}\s*/, '');
                else if (isQuote) cleanLine = trimmed.replace(/^>\s*/, '');
                else if (isBullet) cleanLine = trimmed.replace(/^([-*•]|\d+\.)\s*/, '');

                const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
                const formatted = parts.map((part, partIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={partIdx} className="font-bold text-stone-950 font-tamil-serif">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={partIdx}>{part}</span>;
                });

                if (isH2 || isH3) {
                  return (
                    <h3 key={lIdx} className="font-classical-display font-bold text-stone-950 text-xs sm:text-sm mt-2 mb-1 pb-0.5 border-b border-stone-200/60 flex items-center gap-1.5">
                      {formatted}
                    </h3>
                  );
                }

                if (isQuote) {
                  return (
                    <div key={lIdx} className="p-2.5 rounded-lg bg-amber-50/80 border-l-3 border-amber-600 font-tamil-serif italic text-xs text-stone-900 my-1">
                      {formatted}
                    </div>
                  );
                }

                if (isBullet) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-amber-700 font-bold shrink-0 mt-0.5">•</span>
                      <span className="text-stone-800">{formatted}</span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-stone-800">
                    {formatted}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Send query to YAAZH AI unified endpoint with languageMode
  const handleSendMessage = async (queryText?: string, wasSpoken = false) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isThinking) return;

    // Check if user is issuing a language command
    if (/(tanglish\s*(la|il|la\s*sollu|la\s*explain)|speak\s*tanglish)/i.test(textToSend)) {
      setSelectedLanguageMode('tanglish');
    } else if (/(tamil\s*(la|il|la\s*sollu|la\s*explain)|speak\s*tamil|தமிழில்\s*(விளக்கு|சொல்))/i.test(textToSend)) {
      setSelectedLanguageMode('ta');
    } else if (/(english\s*(la|il|la\s*sollu|la\s*explain)|speak\s*english|explain\s*in\s*english|ஆங்கிலத்தில்\s*(விளக்கு|சொல்))/i.test(textToSend)) {
      setSelectedLanguageMode('en');
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      languageMode: selectedLanguageMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setTranscriptPreview(null);
    setIsThinking(true);

    try {
      const historyPayload = messages
        .slice(-8)
        .map(m => ({ sender: m.sender, text: m.text }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language: selectedLanguageMode === 'en' ? 'en' : 'ta',
          languageMode: selectedLanguageMode,
          currentRole: currentRole || 'study',
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error('Ask YAAZH API returned error');
      }

      const data = await response.json();

      let botText = '';
      if (data.type === 'translation') {
        botText = isTa
          ? `கண்டறியப்பட்ட மூல உரை: "${data.originalText}"\n\nமொழிபெயர்ப்பு:\n${data.translatedText}${data.notes ? `\n\nகுறிப்பு: ${data.notes}` : ''}`
          : `Original text: "${data.originalText}"\n\nTranslation:\n${data.translatedText}${data.notes ? `\n\nNotes: ${data.notes}` : ''}`;
      } else if (data.answer) {
        botText = data.answer;
      } else if (data.verses && data.verses.length > 0) {
        botText = isTa
          ? `செவ்வியல் பாடல் சான்று: ${data.verses[0].workTitleTa} - ${data.verses[0].poetTa}\n\n"${data.verses[0].linesTa.join('\n')}"\n\nஉரை: ${data.verses[0].commentaries[0]?.textTa || data.verses[0].meaningEn}`
          : `Classical passage citation: ${data.verses[0].workTitleEn} by ${data.verses[0].poetEn}\n\n"${data.verses[0].linesTa.join('\n')}"\n\nCommentary: ${data.verses[0].commentaries[0]?.textTa || data.verses[0].meaningEn}`;
      } else {
        botText = isTa
          ? 'உங்கள் கேள்விக்கான ஆய்வு நிறைவுற்றது.'
          : 'Query processed against Classical Tamil knowledge base.';
      }

      // Sync language mode if backend detected a switch
      if (data.languageMode && data.languageMode !== selectedLanguageMode) {
        setSelectedLanguageMode(data.languageMode);
      }

      const botMessageId = `yz-${Date.now()}`;
      const botMessage: ChatMessage = {
        id: botMessageId,
        sender: 'yaazh',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseType: data.type || 'answer',
        verse: data.verse || (data.verses && data.verses[0]),
        citations: data.citations,
        highlightQuote: data.highlightQuote,
        followUpSuggestions: data.followUpSuggestions,
        languageMode: data.languageMode || selectedLanguageMode,
        translationData: data.type === 'translation' ? {
          originalText: data.originalText,
          translatedText: data.translatedText,
          detectedSourceLang: data.detectedSourceLang,
          targetLang: data.targetLang,
          translator: data.translator,
          source: data.source,
          notes: data.notes,
          transliteration: data.transliteration
        } : undefined,
        answerData: {
          canonicalAnswer: botText,
          confidenceScore: data.confidenceScore || 0.98,
          evidenceCount: data.resultsCount || (data.verses ? data.verses.length : 1)
        }
      };

      setMessages(prev => [...prev, botMessage]);

      // Auto-read aloud if enabled or asked via voice
      if (autoPlayAudio || wasSpoken) {
        setTimeout(() => {
          handlePlayAudio(botMessageId, botText);
        }, 300);
      }
    } catch (err: any) {
      console.error('Chatbot query failed:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'yaazh',
        text: isTa
          ? 'மன்னிக்கவும், விடை தயாரிப்பதில் தற்காலிகத் தாமதம் ஏற்பட்டது. தயவுசெய்து மீண்டும் வினவவும்.'
          : 'Sorry, a temporary issue occurred while generating the answer. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUpSuggestions: isTa ? ['மீண்டும் முயற்சி செய்', 'திருக்குறள் 81 விளக்கம்'] : ['Try again', 'Explain Kural 81']
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearHistory = () => {
    handleStopAudio();
    setMessages([
      {
        id: 'msg-welcome-new',
        sender: 'yaazh',
        text: isTa
          ? `உரையாடல் வரலாறு அழிக்கப்பட்டது. நான் உங்களுக்கு உதவத் தயாராக உள்ளேன், ${userName}!`
          : `Chat history cleared. Ready to assist you, ${userName}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  const modeInfo = getModeInfo();
  const suggestions = getSuggestions();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="YAAZH AI Intelligent Voice & Chat Assistant"
    >
      <div 
        className={`bg-[#faf8f5] w-full ${
          isMaximized 
            ? 'sm:max-w-4xl sm:h-[94vh]' 
            : 'sm:max-w-2xl sm:h-[84vh]'
        } h-[92vh] rounded-t-2xl sm:rounded-2xl border border-stone-300 shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-classical-display font-bold text-sm shadow-md shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-tamil-serif font-bold text-stone-100 text-xs sm:text-base">
                  {t.chatbotTitle}
                </h3>
                <span className={`hidden xs:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full border ${modeInfo.color}`}>
                  {modeInfo.icon}
                  <span>{isTa ? modeInfo.labelTa : modeInfo.labelEn}</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400 font-tamil-sans hidden sm:block">
                ElevenLabs Voice • Speech-to-Text & Neural Audio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Auto-read Aloud Toggle */}
            <button
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 border ${
                autoPlayAudio 
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold' 
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title={autoPlayAudio ? 'Auto-read speech is enabled' : 'Auto-read speech is paused'}
              aria-label={autoPlayAudio ? 'Disable auto-reading responses' : 'Enable auto-reading responses'}
            >
              {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline text-[11px]">
                {autoPlayAudio ? 'Auto-Voice ON' : 'Voice Off'}
              </span>
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title={t.chatbotClearHistory}
              aria-label={t.chatbotClearHistory}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Toggle Fullscreen / Maximize */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden sm:inline-flex p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
              aria-label={isMaximized ? 'Restore window size' : 'Maximize window size'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title={t.close}
              aria-label={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice & Language Selection Toolbar */}
        <div className="px-4 py-2 bg-stone-100/90 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-stone-500 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-amber-700" />
              <span>{isTa ? 'மொழி பயன்முறை:' : 'Language Mode:'}</span>
            </span>

            {/* Language Mode Selector Tabs */}
            <div className="inline-flex rounded-lg bg-stone-200/80 p-0.5 border border-stone-300/80" role="radiogroup" aria-label="Response Language">
              <button
                type="button"
                onClick={() => setSelectedLanguageMode('ta')}
                className={`px-2.5 py-1 text-xs font-tamil-serif rounded-md transition-all ${
                  selectedLanguageMode === 'ta'
                    ? 'bg-white text-stone-950 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                role="radio"
                aria-checked={selectedLanguageMode === 'ta'}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguageMode('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedLanguageMode === 'en'
                    ? 'bg-white text-stone-950 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                role="radio"
                aria-checked={selectedLanguageMode === 'en'}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguageMode('tanglish')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedLanguageMode === 'tanglish'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                role="radio"
                aria-checked={selectedLanguageMode === 'tanglish'}
              >
                Tanglish
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
              <span>ElevenLabs Voice</span>
            </span>
          </div>
        </div>

        {/* Chat History Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-tamil-sans focus:outline-hidden"
          tabIndex={0}
          aria-label="Conversation history"
        >
          {/* Quick Context Banner */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {selectedLanguageMode === 'tanglish' 
                  ? 'Tanglish Mode active: Natural Romanized Tamil speech with Classical quotes in Tamil script.' 
                  : selectedLanguageMode === 'en' 
                    ? 'English Mode active: Deep literary analysis and verse translations.'
                    : 'தூய தமிழ் பயன்முறை இயங்குகிறது: செம்மொழி 41 நூல்களின் உரை மற்றும் இலக்கண விளக்கம்.'}
              </span>
            </div>
          </div>

          {/* Conversation List */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Sender & Timestamp Header */}
              <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-stone-600">
                {msg.sender === 'yaazh' ? (
                  <span className="flex items-center gap-1 text-amber-900 font-semibold">
                    <Bot className="w-3.5 h-3.5 text-amber-700" />
                    <span>YAAZH AI</span>
                  </span>
                ) : (
                  <span className="text-stone-700 font-medium">
                    {userName}
                  </span>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>

                {/* Copy text action */}
                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className="p-0.5 rounded text-stone-600 hover:text-stone-900 transition-colors ml-1"
                  title={copiedId === msg.id ? 'Copied' : 'Copy message'}
                  aria-label="Copy message text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Message Bubble Card */}
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 shadow-2xs text-xs sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-stone-100 rounded-tr-xs'
                    : 'bg-white border border-stone-200/90 text-stone-900 rounded-tl-xs space-y-3'
                }`}
              >
                {/* Text Content */}
                {renderFormattedText(msg.text)}

                {/* Translation Specific Card */}
                {msg.translationData && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-stone-900 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-amber-950 font-semibold border-b border-amber-200/60 pb-1.5">
                      <span>{isTa ? 'செவ்வியல் மொழிபெயர்ப்பு' : 'LITERARY TRANSLATION'}</span>
                      {msg.translationData.source && (
                        <span className="text-stone-600">{msg.translationData.source}</span>
                      )}
                    </div>
                    <p className="font-tamil-serif text-xs sm:text-sm font-medium text-stone-900 leading-relaxed">
                      "{msg.translationData.translatedText}"
                    </p>
                    {msg.translationData.notes && (
                      <p className="text-[11px] text-stone-600 bg-white/70 p-2 rounded-lg border border-amber-200/50">
                        <strong className="font-semibold">{isTa ? 'குறிப்பு:' : 'Notes:'}</strong> {msg.translationData.notes}
                      </p>
                    )}
                    {msg.translationData.transliteration && (
                      <p className="text-[10px] font-mono text-stone-500 italic">
                        ISO 15919: {msg.translationData.transliteration}
                      </p>
                    )}
                  </div>
                )}

                {/* Highlight Quote */}
                {msg.highlightQuote && (
                  <div className="p-2.5 rounded-lg bg-amber-50/80 border-l-3 border-amber-600 font-tamil-serif italic text-xs sm:text-sm text-stone-900 mt-2 shadow-2xs">
                    <span className="text-[10px] font-mono text-amber-900 uppercase font-semibold block not-italic mb-0.5">
                      {isTa ? 'சிறப்புக் குறிப்பு / மேற்கோள்:' : 'Key Highlight:'}
                    </span>
                    "{msg.highlightQuote}"
                  </div>
                )}

                {/* Rich Card: Verse Evidence */}
                {msg.verse && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 space-y-2.5 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          {isTa ? 'செவ்வியல் மூலம்' : 'VERIFIED CORPUS'}
                        </span>
                        <span className="font-tamil-serif font-bold text-xs text-stone-900">
                          {isTa ? msg.verse.workTitleTa : msg.verse.workTitleEn}
                        </span>
                      </div>

                      {onInspectVerse && (
                        <button
                          onClick={() => onInspectVerse(msg.verse!)}
                          className="flex items-center gap-1 text-[11px] font-mono font-medium text-stone-700 hover:text-stone-950 bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:bg-stone-50 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{isTa ? 'ஆவணம்' : 'Dossier'}</span>
                        </button>
                      )}
                    </div>

                    <div className="pl-2.5 border-l-2 border-stone-800 font-tamil-serif text-xs sm:text-sm text-stone-900 space-y-0.5">
                      {msg.verse.linesTa.map((l, idx) => (
                        <p key={idx}>{l}</p>
                      ))}
                    </div>

                    {/* Cadence pronunciation */}
                    <AudioPronunciation
                      tamilText={msg.verse.linesTa.join(' ')}
                      transliteration={msg.verse.transliteration}
                      language={language}
                    />
                  </div>
                )}

                {/* Citations List */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-200/60 mt-2">
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      {isTa ? 'சான்றாதார நூல்கள்:' : 'Citations:'}
                    </span>
                    {msg.citations.map((cite, cIdx) => (
                      <span key={cIdx} className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        <BookOpen className="w-2.5 h-2.5 text-amber-600" />
                        {cite}
                      </span>
                    ))}
                  </div>
                )}

                {/* ElevenLabs Spoken Audio Player Bar for Bot Responses */}
                {msg.sender === 'yaazh' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-stone-200/70 bg-stone-50/70 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 px-3.5 sm:px-4 py-2.5 rounded-b-2xl">
                    <div className="flex items-center gap-1.5">
                      {playingMessageId === msg.id && audioState === 'loading' ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                          <span className="font-mono text-[11px] font-medium">
                            {isTa ? 'குரல் ஆடியோ தயாராகிறது...' : 'Generating neural speech...'}
                          </span>
                        </div>
                      ) : playingMessageId === msg.id && audioState === 'playing' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handlePauseAudio}
                            className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs active:scale-95 cursor-pointer"
                            title={isTa ? 'நிறுத்து (Pause)' : 'Pause audio'}
                            aria-label="Pause spoken audio"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleStopAudio}
                            className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-all active:scale-95 cursor-pointer"
                            title={isTa ? 'முழுவதும் நிறுத்து' : 'Stop audio'}
                            aria-label="Stop spoken audio"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReplayAudio(msg.id, msg.text)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all active:scale-95 cursor-pointer"
                            title={isTa ? 'மீண்டும் கேள்' : 'Replay audio'}
                            aria-label="Replay spoken audio"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Animated sound wave bars */}
                          <div className="flex items-center gap-0.5 px-2 py-1 bg-white rounded border border-amber-200/80">
                            <span className="w-1 h-3 bg-amber-600 animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-amber-700 animate-pulse delay-75 rounded-full" />
                            <span className="w-1 h-2 bg-amber-500 animate-pulse delay-150 rounded-full" />
                            <span className="text-[10px] font-mono text-amber-950 ml-1.5 font-semibold">
                              {formatDuration(audioProgress.currentTime)} / {formatDuration(audioProgress.duration)}
                            </span>
                          </div>
                        </div>
                      ) : playingMessageId === msg.id && audioState === 'paused' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleResumeAudio}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs active:scale-95 flex items-center gap-1 text-xs cursor-pointer"
                            title={isTa ? 'தொடர் (Resume)' : 'Resume audio'}
                            aria-label="Resume spoken audio"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">{isTa ? 'தொடர்' : 'Resume'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleStopAudio}
                            className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-all active:scale-95 cursor-pointer"
                            title={isTa ? 'நிறுத்து' : 'Stop audio'}
                            aria-label="Stop spoken audio"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(msg.id, msg.text)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 hover:text-amber-950 text-stone-700 border border-stone-300 text-xs font-mono transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                          title={isTa ? 'பதிலை உரக்கக் கேள் (ElevenLabs Neural Voice)' : 'Read answer aloud (ElevenLabs Neural Voice)'}
                          aria-label="Read answer aloud with ElevenLabs voice"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-medium font-tamil-sans">
                            {isTa ? 'உரக்கக் கேள்' : 'Listen Aloud'}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-stone-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>ElevenLabs AI Voice</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Clickable Follow-up Suggestions from AI */}
              {msg.sender === 'yaazh' && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 max-w-[88%] sm:max-w-[82%]">
                  <span className="text-[10px] font-mono text-stone-400">
                    {isTa ? 'தொடர்புடைய வினாக்கள்:' : 'Follow up:'}
                  </span>
                  {msg.followUpSuggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(sug)}
                      className="text-[11px] font-tamil-sans px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 hover:border-amber-400 text-stone-800 border border-stone-200 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Thinking Spinner Indicator */}
          {isThinking && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Bot className="w-4 h-4 text-stone-950" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs font-mono text-stone-600 pl-1 font-medium">
                    {selectedLanguageMode === 'tanglish'
                      ? 'YAAZH AI is synthesizing answer in Tanglish with Classical sources...'
                      : isTa 
                        ? 'யாழ் AI நேரலையில் செவ்வியல் விடை தயாரிக்கிறது...' 
                        : 'YAAZH AI is synthesizing grounded answer in real time...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Bar */}
        <div className="px-4 py-2 bg-stone-100/80 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-mono text-stone-500 shrink-0 font-semibold">
            {t.chatbotSuggestions}:
          </span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(isTa ? s.ta : s.en)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-200 text-stone-800 text-[11px] font-tamil-sans border border-stone-300/80 shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              {isTa ? s.ta : s.en}
            </button>
          ))}
        </div>

        {/* ElevenLabs Voice Recording Active Panel */}
        {isRecording && (
          <div 
            className="p-3 bg-red-50/95 border-t-2 border-red-400 flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-bottom-2"
            role="region"
            aria-live="assertive"
            aria-label="Voice recording in progress"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 relative" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                  <span>{isTa ? 'குரல் பதிவு நடக்கிறது...' : 'Listening to your voice...'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-200 text-red-900 font-semibold uppercase">
                    {selectedLanguageMode === 'tanglish' ? 'Tanglish' : selectedLanguageMode === 'en' ? 'English' : 'தமிழ்'}
                  </span>
                </p>
                <p className="text-[11px] text-red-700 font-mono">
                  {formatDuration(recordingSeconds)} / 01:00 • {isTa ? 'இயல்பாகப் பேசவும்' : 'Speak questions naturally'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="px-2.5 py-1.5 text-xs rounded-lg text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 font-medium cursor-pointer"
              >
                {isTa ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleStopRecordingAndTranscribe}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isTa ? 'முடிந்தது' : 'Done & Transcribe'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ElevenLabs Speech-to-Text Transcribing Spinner */}
        {isTranscribing && (
          <div 
            className="p-3 bg-amber-50/95 border-t border-amber-300 flex items-center gap-2.5 shrink-0"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            <span className="text-xs font-medium text-amber-950 font-tamil-sans">
              {isTa ? 'ElevenLabs AI குரலை உரையாக மாற்றுகிறது...' : 'Transcribing voice with ElevenLabs Speech-to-Text...'}
            </span>
          </div>
        )}

        {/* Recognized Transcript Confirmation & Edit Panel */}
        {transcriptPreview && !isRecording && !isTranscribing && (
          <div 
            className="p-3.5 bg-amber-50/95 border-t-2 border-amber-400 shadow-inner space-y-2 shrink-0 animate-in slide-in-from-bottom-2"
            role="region"
            aria-label="Review recognized speech transcript"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-stone-900 font-tamil-serif">
                  {isTa ? 'அறியப்பட்ட குரல் உரை (ElevenLabs STT)' : 'Recognized Voice Transcript (ElevenLabs STT)'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 font-semibold uppercase">
                  {transcriptPreview.detectedLanguage}
                </span>
                {transcriptPreview.isCommand && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
                    Command: {transcriptPreview.detectedCommand}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-500 font-tamil-sans hidden xs:inline">
                {isTa ? 'தேவைப்பட்டால் திருத்தவும்' : 'Edit before sending if needed'}
              </span>
            </div>

            <textarea
              value={transcriptPreview.text}
              onChange={(e) => setTranscriptPreview({ ...transcriptPreview, text: e.target.value })}
              rows={2}
              className="w-full text-xs sm:text-sm p-2 bg-white rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-950 font-tamil-sans resize-none"
              placeholder={isTa ? 'குரல் உரையைத் திருத்தவும்...' : 'Edit transcript...'}
              aria-label="Editable recognized speech text"
            />

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="text-[11px] text-amber-900 hover:text-amber-950 flex items-center gap-1 font-tamil-sans cursor-pointer font-medium"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isTa ? 'மீண்டும் பேசு' : 'Re-record'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTranscriptPreview(null)}
                  className="text-[11px] text-stone-600 hover:text-stone-900 font-tamil-sans cursor-pointer"
                >
                  {isTa ? 'அழி' : 'Discard'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const finalQuery = transcriptPreview.text.trim();
                  setTranscriptPreview(null);
                  if (finalQuery) handleSendMessage(finalQuery, true);
                }}
                disabled={!transcriptPreview.text.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Send className="w-3 h-3" />
                <span>{isTa ? 'கேள்வி கேள்' : 'Ask YAAZH'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Query Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative flex items-center bg-[#faf8f5] border-2 border-stone-300 focus-within:border-stone-900 rounded-xl transition-all p-1.5 shadow-2xs">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  selectedLanguageMode === 'tanglish'
                    ? 'Tanglish la kelunga (e.g. Thirukkural 81 explanation sollu)...'
                    : t.chatbotPlaceholder
                }
                className="flex-1 bg-transparent py-1 px-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden font-tamil-sans"
                aria-label="Question input"
              />

              <div className="flex items-center gap-1 shrink-0">
                {/* ElevenLabs Microphone Button */}
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecordingAndTranscribe : handleStartRecording}
                  disabled={isTranscribing}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isRecording 
                      ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400' 
                      : 'text-stone-700 bg-stone-100 hover:bg-amber-100 hover:text-amber-950 border border-stone-300'
                  }`}
                  title={isRecording ? 'Stop recording voice' : 'Ask by Voice with ElevenLabs (Tamil/English/Tanglish)'}
                  aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording with ElevenLabs'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Live Scan Trigger */}
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="p-1.5 rounded-lg text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                    title={isTa ? 'கேமரா மூலம் ஏடு/நூல் ஸ்கேன் செய்க' : 'Live scan manuscript or textbook'}
                    aria-label="Scan manuscript or textbook"
                  >
                    <Camera className="w-4 h-4 text-amber-900" />
                  </button>
                )}

                {/* Full-screen Voice Access Trigger */}
                {onOpenVoiceAccess && (
                  <button
                    type="button"
                    onClick={onOpenVoiceAccess}
                    className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer hidden xs:inline-flex"
                    title="YAAZH Full Voice Portal (Alt+V)"
                    aria-label="Open Full Voice Portal"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isThinking || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
              aria-label="Submit question"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.ask}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
