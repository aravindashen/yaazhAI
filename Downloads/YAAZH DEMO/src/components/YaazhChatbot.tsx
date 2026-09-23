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
  Maximize2, 
  Minimize2,
  GraduationCap,
  Compass,
  Microscope,
  Home,
  ArrowRight
} from 'lucide-react';
import { UserRole, ClassicalVerse } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { AudioPronunciation } from './AudioPronunciation.tsx';

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

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Initial welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'yaazh',
      text: isTa
        ? `வணக்கம் ${userName}! நான் உங்கள் யாழ் AI (YAAZH AI). செம்மொழித் தமிழ் நூல்கள், திருக்குறள், சங்கப் பாடல்கள், உரை விளக்கங்கள், இலக்கணம், சொல் ஆய்வு, மொழிபெயர்ப்பு அல்லது எந்தவொரு பொதுக் கேள்விகளுக்கும் நேரலையில் விரிவான விடை தருவேன். நீங்கள் எதைப் பற்றி அறிய விரும்புகிறீர்கள்?`
        : `Greetings ${userName}! I am YAAZH AI. I generate real-time answers for any inquiry—classical Tamil literature, Tirukkural, Sangam poetics, grammar, translations, or general questions. What would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUpSuggestions: isTa
        ? [
            'யாதும் ஊரே யாவரும் கேளிர் முழு விளக்கம்',
            'திருக்குறள் 81 பதம் பிரித்து உரை கூறுக',
            'சங்க இலக்கியத்தின் ஐந்திணைகள் எவை?',
            'செம்மொழி 41 நூல்களின் பட்டியல்'
          ]
        : [
            'Explain Yadhum Oore Yaavarum Kelir in depth',
            'Break down Tirukkural 81 with word meanings',
            'What are the 5 landscapes (Ainthinai) of Sangam?',
            'List the 41 Classical Tamil Works'
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
  }, [messages, isOpen, isThinking]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
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
    if (currentRole === 'study' || currentRole === 'student') {
      return [
        {
          ta: 'புறநானூறு 192 பதம் பிரித்து இலக்கணம் தருக',
          en: 'Break down Purananuru 192 grammar & sandhi'
        },
        {
          ta: 'விருந்தோம்பல் அதிகாரத்தின் முக்கிய வினாக்கள்',
          en: 'Key exam review questions on Hospitality'
        },
        {
          ta: 'திருக்குறள் 81 ஆங்கிலத்தில் மொழிபெயர்',
          en: 'Translate Kural 81 into English'
        },
        {
          ta: 'அன்புடை நெஞ்சம் பாடலின் சீர் அசை விளக்கம்',
          en: 'Metrical cadence of Kurunthogai 40'
        }
      ];
    }

    if (currentRole === 'explore' || currentRole === 'learner') {
      return [
        {
          ta: 'பத்துப்பாட்டு நூல்களின் காலவரிசை மற்றும் சிறப்பு',
          en: 'Timeline and significance of Pattuppattu'
        },
        {
          ta: 'யாதும் ஊரே ஆங்கிலத்தில் மொழிபெயர்',
          en: 'Translate Yadhum Oore to English'
        },
        {
          ta: 'செம்புலப் பெயல்நீரார் அகம் பாடல் விழுமியம்',
          en: 'Akam poetics of Sembulappeyalneerar'
        },
        {
          ta: 'சங்க காலப் பெண் புலவர்கள் யார் யார்?',
          en: 'Who are the prominent Sangam women poets?'
        }
      ];
    }

    if (currentRole === 'research' || currentRole === 'researcher') {
      return [
        {
          ta: 'ஓலைச்சுவடி பாடபேதங்கள் எப்படி ஆய்வது?',
          en: 'How to collate palm-leaf manuscript variants'
        },
        {
          ta: 'பரிமேலழகர் vs மணக்குடவர் உரை ஒப்பீடு',
          en: 'Compare Parimelazhagar vs Manakkudavar readings'
        },
        {
          ta: 'சங்க இலக்கியக் கல்வெட்டுச் சான்றுகள்',
          en: 'Epigraphic and lithic references in Sangam corpus'
        },
        {
          ta: 'தீதும் நன்றும் பிறர்தர வாரா மெய்யியல்',
          en: 'Synthesize ethical causality in Purananuru'
        }
      ];
    }

    // Default / Home
    return [
      {
        ta: 'யாதும் ஊரே யாவரும் கேளிர் விளக்கம்',
        en: 'Explain Yadhum Oore Yaavarum Kelir'
      },
      {
        ta: 'திருக்குறள் 81 ஆங்கிலத்தில் மொழிபெயர்',
        en: 'Translate Kural 81 to English'
      },
      {
        ta: 'செம்மொழித் தமிழின் 41 நூல்கள் எவை?',
        en: 'What are the 41 Classical Tamil Works?'
      },
      {
        ta: 'அகப்பொருள் - புறப்பொருள் வேறுபாடு என்ன?',
        en: 'What is the difference between Akam and Puram?'
      }
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

                // Parse bold **text**
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

  // Send query to YAAZH AI unified endpoint
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isThinking) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
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
          language,
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

      const botMessage: ChatMessage = {
        id: `yz-${Date.now()}`,
        sender: 'yaazh',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseType: data.type || 'answer',
        verse: data.verse || (data.verses && data.verses[0]),
        citations: data.citations,
        highlightQuote: data.highlightQuote,
        followUpSuggestions: data.followUpSuggestions,
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
    >
      <div 
        className={`bg-[#faf8f5] w-full ${
          isMaximized 
            ? 'sm:max-w-4xl sm:h-[94vh]' 
            : 'sm:max-w-2xl sm:h-[82vh]'
        } h-[92vh] rounded-t-2xl sm:rounded-2xl border border-stone-300 shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-classical-display font-bold text-sm shadow-md">
              <Bot className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tamil-serif font-bold text-stone-100 text-sm sm:text-base">
                  {t.chatbotTitle}
                </h3>
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${modeInfo.color}`}>
                  {modeInfo.icon}
                  <span>{isTa ? modeInfo.labelTa : modeInfo.labelEn}</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-tamil-sans hidden sm:block">
                {t.chatbotSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-tamil-sans">
          
          {/* Quick Context Banner */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {isTa 
                  ? `நீங்கள் தற்போது "${isTa ? modeInfo.labelTa : modeInfo.labelEn}" பணியிடத்தில் உள்ளீர்கள். எந்தப் பயன்முறையிலிருந்தும் யாழ் உடனடி விடையளிக்கும்.` 
                  : `Active in ${modeInfo.labelEn}. YAAZH provides grounded evidence and translation across all modes.`}
              </span>
            </div>
          </div>

          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-2xs space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-white rounded-br-xs'
                    : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between text-[10px] font-mono opacity-70 pb-1 border-b border-stone-200/30">
                  <span className="font-semibold">
                    {msg.sender === 'user' ? (isTa ? userName : 'You') : 'YAAZH AI'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Main Message Text with Markdown formatting */}
                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap font-tamil-sans">
                    {msg.text}
                  </div>
                ) : (
                  renderFormattedText(msg.text)
                )}

                {/* Rich Card: Translation Result */}
                {msg.translationData && (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-stone-900 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-amber-900">
                      <span className="font-bold uppercase tracking-wider">
                        {isTa ? 'செவ்வியல் மொழிபெயர்ப்பு' : 'Canonical Translation'}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.translationData!.translatedText)}
                        className="flex items-center gap-1 text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-stone-200 hover:bg-stone-50"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-stone-600" />
                            <span>{t.copy}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-amber-200/60 font-serif italic text-sm text-stone-900">
                      "{msg.translationData.translatedText}"
                    </div>

                    {msg.translationData.translator && (
                      <p className="text-[11px] font-mono text-stone-600">
                        {isTa ? 'மொழிபெயர்ப்பாளர்' : 'Translator'}: {msg.translationData.translator} ({msg.translationData.source})
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
                          className="flex items-center gap-1 text-[11px] font-mono font-medium text-stone-700 hover:text-stone-950 bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:bg-stone-50"
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
                    {isTa ? 'யாழ் AI நேரலையில் விடை தயாரிக்கிறது...' : 'YAAZH AI is synthesizing answer in real time...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Bar */}
        <div className="px-4 py-2 bg-stone-100/80 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono text-stone-500 shrink-0 font-semibold">
            {t.chatbotSuggestions}:
          </span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(isTa ? s.ta : s.en)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-200 text-stone-800 text-[11px] font-tamil-sans border border-stone-300/80 shrink-0 transition-colors shadow-2xs"
            >
              {isTa ? s.ta : s.en}
            </button>
          ))}
        </div>

        {/* Interactive Query Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
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
                placeholder={t.chatbotPlaceholder}
                className="flex-1 bg-transparent py-1 px-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden font-tamil-sans"
              />

              <div className="flex items-center gap-1 shrink-0">
                {/* Live Scan Trigger */}
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenScanner();
                    }}
                    className="p-1.5 rounded-lg text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                    title={isTa ? 'கேமரா மூலம் ஏடு/நூல் ஸ்கேன் செய்க' : 'Live scan manuscript or textbook'}
                  >
                    <Camera className="w-4 h-4 text-amber-900" />
                  </button>
                )}

                {/* Voice Access Trigger */}
                {onOpenVoiceAccess && (
                  <button
                    type="button"
                    onClick={onOpenVoiceAccess}
                    className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                    title="YAAZH Voice Access (Alt+V)"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isThinking || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
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
