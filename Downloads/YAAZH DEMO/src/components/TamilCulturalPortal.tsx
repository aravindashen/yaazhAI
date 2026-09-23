import React, { useState } from 'react';
import { 
  GraduationCap, 
  Compass, 
  Microscope, 
  Mic, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  Bot,
  Camera, 
  Volume2, 
  Copy,
  Check,
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkle
} from 'lucide-react';
import { UserRole, ClassicalVerse } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { CLASSICAL_WORKS, CLASSICAL_VERSES } from '../data/classicalCorpus.ts';
import { UniversalScannerModal } from './UniversalScannerModal.tsx';
import { AudioPronunciation } from './AudioPronunciation.tsx';

interface TamilCulturalPortalProps {
  currentRole: UserRole | null;
  onSelectRole: (role: UserRole, userName: string, avatar: string) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  onOpenVoiceAccess?: () => void;
  onOpenChatbot?: () => void;
  onInspectVerse?: (verse: ClassicalVerse) => void;
  userName?: string;
}

const FEATURED_VERSE = CLASSICAL_VERSES[0]; // Tirukkural 81: விருந்தோம்பல்

const QUICK_PROMPTS = [
  { ta: 'Translate: "யாதும் ஊரே யாவரும் கேளிர்"', en: 'Translate: "யாதும் ஊரே யாவரும் கேளிர்"', isTranslate: true },
  { ta: 'குறள் 81 உரை விளக்கம்', en: 'Explain Tirukkural 81', isTranslate: false },
  { ta: 'Translate to Tamil: Knowledge is virtue', en: 'Translate to Tamil: Knowledge is virtue', isTranslate: true },
  { ta: 'ஐந்திணைப் பண்பாடு யாது?', en: 'What are the 5 Sangam Thinais?', isTranslate: false }
];

const THINAI_LANDSCAPES = [
  { id: 'kurinji', nameTa: 'குறிஞ்சி', nameEn: 'Kurinji (Montane)', flower: 'குறிஞ்சிப் பூ', moodTa: 'புணர்தல் (Union)', moodEn: 'Union of lovers' },
  { id: 'mullai', nameTa: 'முல்லை', nameEn: 'Mullai (Pastoral)', flower: 'முல்லை மலர்', moodTa: 'இருத்தல் (Patient waiting)', moodEn: 'Patient waiting in rain' },
  { id: 'marutham', nameTa: 'மருதம்', nameEn: 'Marutham (Riverine)', flower: 'செங்கழுநீர்', moodTa: 'ஊடல் (Playful lover spat)', moodEn: 'Lover spat & reconciliation' },
  { id: 'neythal', nameTa: 'நெய்தல்', nameEn: 'Neythal (Littoral)', flower: 'நெய்தல் மலர்', moodTa: 'இரங்கல் (Yearning)', moodEn: 'Lamentation and yearning' },
  { id: 'palai', nameTa: 'பாலை', nameEn: 'Palai (Arid/Waste)', flower: 'குரவம்', moodTa: 'பிரிதல் (Separation)', moodEn: 'Separation & endurance' }
];

export const TamilCulturalPortal: React.FC<TamilCulturalPortalProps> = ({
  currentRole,
  onSelectRole,
  language,
  onToggleLanguage,
  onOpenVoiceAccess,
  onOpenChatbot,
  onInspectVerse,
  userName = 'இளங்கோவன்'
}) => {
  const isTa = language === 'ta';
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askResponse, setAskResponse] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedThinai, setSelectedThinai] = useState(THINAI_LANDSCAPES[0]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Unified Ask YAAZH Submission (Handles Translation, Q&A, and Search)
  const handleAskYaazh = async (queryText = searchQuery) => {
    if (!queryText.trim()) return;
    setIsAsking(true);
    setAskResponse(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, language })
      });
      const data = await res.json();
      setAskResponse(data);
    } catch (err) {
      console.error('Ask YAAZH error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleLaunchMode = (mode: UserRole) => {
    const savedName = localStorage.getItem('yaazh_user_name') || userName;
    onSelectRole(mode, savedName, 'valluvar');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-stone-900 selection:bg-amber-200 pb-24">
      
      {/* Mobile Application Top App Bar */}
      <header className="sticky top-0 z-30 bg-[#fcfbfa]/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-classical-display font-bold text-sm shadow-xs">
              யா
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-classical-display font-bold text-sm tracking-wider text-stone-900">
                  YAAZH
                </span>
                <span className="text-stone-300 font-light text-xs">·</span>
                <span className="font-tamil-serif text-xs font-semibold text-stone-700">
                  யாழ்
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-500">
                {isTa ? 'செம்மொழி அறிவுப் பொறி' : 'Classical Tamil AI'}
              </span>
            </div>
          </div>

          {/* Top Actions: Chatbot, Voice Access & Lingual Switcher */}
          <div className="flex items-center gap-2">
            {/* Chatbot Button */}
            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-100 font-medium text-xs transition-all shadow-2xs active:scale-95"
                title={language === 'ta' ? 'யாழ் AI அரட்டை திறக்குக' : 'Open YAAZH AI Chatbot'}
                aria-label="Open YAAZH AI Chatbot"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">{t.chatbotBadge}</span>
              </button>
            )}

            {/* Voice Access Button */}
            {onOpenVoiceAccess && (
              <button
                onClick={onOpenVoiceAccess}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-100/70 hover:bg-amber-100 text-amber-950 font-medium text-xs transition-all shadow-2xs active:scale-95"
                title="YAAZH Voice Access (Alt + V)"
                aria-label="Open Voice Access"
              >
                <Mic className="w-3.5 h-3.5 text-amber-900 animate-pulse" />
                <span className="text-xs font-mono">{t.navVoice}</span>
              </button>
            )}

            {/* Language Switcher Button (Reliable & Reactive) */}
            <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg border border-stone-300/60 shadow-2xs">
              <button
                onClick={() => onToggleLanguage('ta')}
                className={`px-2 py-1 text-xs rounded-md transition-all font-tamil-sans ${
                  language === 'ta' 
                    ? 'bg-stone-900 text-white font-medium shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                aria-label="Switch to Tamil"
              >
                தமிழ்
              </button>
              <button
                onClick={() => onToggleLanguage('en')}
                className={`px-2 py-1 text-xs rounded-md transition-all font-mono ${
                  language === 'en' 
                    ? 'bg-stone-900 text-white font-medium shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container (Mobile Application Viewport) */}
      <main className="max-w-3xl mx-auto px-4 pt-5 pb-8 space-y-6">

        {/* 1. WELCOMING USER SECTION */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                  {t.scholar}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-mono text-emerald-700">{t.cictActive}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-classical-display font-bold text-stone-900 tracking-tight">
                {isTa ? `வணக்கம், ${userName}! நல்வரவு.` : `Welcome, ${userName}!`}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-tamil-sans leading-relaxed">
                {t.welcomeSubtitle}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-800" />
            </div>
          </div>
        </section>

        {/* 2. ASK YAAZH AI WITH AUTOMATED DESCRIPTION */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Automated Description Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                {t.appName} · {t.ask}
              </h2>
            </div>
            
            {/* Automated Description Card */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs sm:text-[13px] font-tamil-sans leading-relaxed">
              <p>{t.yaazhDescription}</p>
            </div>
          </div>

          {/* Integrated Omnibar with LIVE SCAN inside */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskYaazh();
            }}
            className="space-y-2.5"
          >
            <div className="relative flex items-center bg-[#fdfcfa] border-2 border-stone-300 focus-within:border-stone-900 rounded-xl transition-all p-1.5 shadow-2xs">
              <div className="pl-2 pr-1 text-stone-400">
                <Search className="w-4 h-4" />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.askYaazhPlaceholder}
                className="flex-1 bg-transparent py-1.5 px-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden font-tamil-sans"
                aria-label="Ask YAAZH or request translation"
              />

              <div className="flex items-center gap-1 shrink-0">
                {/* LIVE SCAN OPTION INSIDE ASK YAAZH SPACE */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 text-xs font-medium transition-all shadow-2xs active:scale-95"
                  title="Live Scan Manuscript or Book with Camera OCR"
                  aria-label="Live Scan with Camera"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-900" />
                  <span className="hidden xs:inline text-[11px] font-mono font-semibold">
                    {t.liveScanButton}
                  </span>
                </button>

                {/* Voice Input Trigger */}
                {onOpenVoiceAccess && (
                  <button
                    type="button"
                    onClick={onOpenVoiceAccess}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    title="Speak to Ask YAAZH (Alt + V)"
                  >
                    <Mic className="w-4 h-4 text-stone-600" />
                  </button>
                )}

                {/* Submit / Ask Button */}
                <button
                  type="submit"
                  disabled={isAsking || !searchQuery.trim()}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  {isAsking ? (
                    <span className="text-[11px] font-mono">{t.processing}</span>
                  ) : (
                    <>
                      <span className="text-xs">{t.ask}</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-mono text-stone-500 mr-1">
                {t.tryPrompts}:
              </span>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const text = isTa ? p.ta : p.en;
                    setSearchQuery(text);
                    handleAskYaazh(text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] transition-colors border border-stone-200/80"
                >
                  {isTa ? p.ta : p.en}
                </button>
              ))}
            </div>
          </form>

          {/* DYNAMIC RESULT CARD (Inside Ask YAAZH AI Space) */}
          {askResponse && (
            <div className="mt-4 pt-4 border-t border-stone-200 space-y-3 animate-in fade-in duration-200">
              
              {/* 1. Translation Result Card */}
              {askResponse.type === 'translation' && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        {t.translationTitle}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        {askResponse.detectedSourceLang?.toUpperCase()} → {askResponse.targetLang?.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(askResponse.translatedText)}
                      className="flex items-center gap-1 text-[11px] font-mono text-stone-600 hover:text-stone-900 bg-white/80 border border-stone-200 px-2 py-0.5 rounded-md"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{t.copySuccess}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Original Text */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-stone-500">
                      {t.originalTextLabel}
                    </span>
                    <p className="font-tamil-serif text-sm text-stone-800 bg-white/70 p-2.5 rounded-lg border border-stone-200/60">
                      {askResponse.originalText}
                    </p>
                  </div>

                  {/* Translated Text */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-amber-900 font-semibold">
                      {t.translatedTextLabel}
                    </span>
                    <p className="font-serif text-sm sm:text-base font-medium text-stone-900 bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                      {askResponse.translatedText}
                    </p>
                  </div>

                  {/* Transliteration & Audio Pronunciation */}
                  {askResponse.transliteration && (
                    <div className="flex items-center justify-between text-xs font-mono text-stone-600 bg-white/50 px-2.5 py-1.5 rounded-lg border border-stone-200/60">
                      <span className="italic">{askResponse.transliteration}</span>
                      <AudioPronunciation 
                        tamilText={askResponse.targetLang === 'ta' ? askResponse.translatedText : askResponse.originalText}
                        transliteration={askResponse.transliteration}
                        language={language}
                      />
                    </div>
                  )}

                  {/* Notes / Context */}
                  {askResponse.notes && (
                    <p className="text-xs text-stone-600 font-tamil-sans italic border-l-2 border-amber-500 pl-2 py-0.5">
                      {askResponse.notes}
                    </p>
                  )}

                  {/* Cross link to Study Mode if matched verse */}
                  {askResponse.relatedVerse && (
                    <div className="pt-2 flex items-center justify-between border-t border-amber-200/60 text-xs">
                      <span className="font-tamil-serif font-bold text-stone-800">
                        {askResponse.relatedVerse.workTitleTa} ({askResponse.relatedVerse.verseNumber})
                      </span>
                      <button
                        onClick={() => {
                          if (onInspectVerse) onInspectVerse(askResponse.relatedVerse);
                          handleLaunchMode('study');
                        }}
                        className="text-stone-900 hover:text-amber-900 font-semibold flex items-center gap-1"
                      >
                        <span>{t.inspectInStudy}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Inquiry Answer Card */}
              {askResponse.type === 'inquiry_answer' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700">
                        {t.canonicalAnswer}
                      </span>
                    </div>
                    <button
                      onClick={() => setAskResponse(null)}
                      className="text-[11px] font-mono text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {isTa ? 'மூடுக ✕' : 'Close ✕'}
                    </button>
                  </div>
                  
                  {/* Highlight Quote if present */}
                  {askResponse.highlightQuote && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border-l-4 border-amber-600 font-tamil-serif italic text-xs sm:text-sm text-stone-900">
                      "{askResponse.highlightQuote}"
                    </div>
                  )}

                  {/* Main Answer Content */}
                  <div className="text-xs sm:text-[13px] font-tamil-sans text-stone-800 leading-relaxed bg-white p-4 sm:p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
                    {(() => {
                      const paragraphs = (askResponse.answer || '').split(/\n\s*\n/);
                      return paragraphs.map((para: string, pIdx: number) => {
                        const lines = para.split('\n');
                        return (
                          <div key={pIdx} className="space-y-1.5">
                            {lines.map((line: string, lIdx: number) => {
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
                                  <h3 key={lIdx} className="font-classical-display font-bold text-stone-950 text-xs sm:text-sm mt-3 mb-1 pb-0.5 border-b border-stone-200/70">
                                    {formatted}
                                  </h3>
                                );
                              }

                              if (isQuote) {
                                return (
                                  <div key={lIdx} className="p-2.5 rounded-lg bg-amber-50/90 border-l-3 border-amber-600 font-tamil-serif italic text-xs text-stone-900 my-1">
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
                      });
                    })()}
                  </div>

                  {/* Citations */}
                  {askResponse.citations && askResponse.citations.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-stone-600 pt-1">
                      <span className="text-stone-400">{t.citations}:</span>
                      {askResponse.citations.map((c: string, ci: number) => (
                        <span key={ci} className="px-2.5 py-0.5 rounded-md bg-stone-200/80 text-stone-800 border border-stone-300/60 font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Question Suggestions */}
                  {askResponse.followUpSuggestions && askResponse.followUpSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                      <span className="text-[11px] font-mono text-stone-500 font-semibold block">
                        {isTa ? 'தொடர் வினாக்கள் (Follow-up Suggestions):' : 'Suggested Follow-up Questions:'}
                      </span>
                      <div className="flex items-center flex-wrap gap-1.5">
                        {askResponse.followUpSuggestions.map((sug: string, si: number) => (
                          <button
                            key={si}
                            type="button"
                            onClick={() => {
                              setSearchQuery(sug);
                              handleAskYaazh(sug);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 text-[11px] transition-all border border-amber-200/70 font-tamil-sans text-left shadow-2xs active:scale-95"
                          >
                            ↳ {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Search Results */}
              {askResponse.type === 'search_results' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-500 pb-1">
                    <span>{askResponse.resultsCount || 0} {t.versesFound}</span>
                  </div>
                  {askResponse.results && askResponse.results.length > 0 ? (
                    askResponse.results.slice(0, 3).map((r: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-tamil-serif font-bold text-stone-900">
                            {r.verse?.workTitleTa || r.workTitleTa}
                          </span>
                          <span className="font-mono text-[10px] text-stone-500">
                            #{r.verse?.verseNumber}
                          </span>
                        </div>
                        <p className="font-tamil-serif text-stone-800 italic">
                          {r.verse?.fullTextTa || r.matchedLine}
                        </p>
                        <div className="flex items-center justify-end pt-1">
                          <button
                            onClick={() => {
                              if (r.verse && onInspectVerse) onInspectVerse(r.verse);
                              handleLaunchMode('study');
                            }}
                            className="text-stone-900 hover:text-amber-800 font-semibold flex items-center gap-1 text-[11px]"
                          >
                            <span>{t.openStudy}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-500 font-mono">
                      {t.noVersesFound}
                    </p>
                  )}
                </div>
              )}

              {/* Close result drawer button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAskResponse(null)}
                  className="text-[11px] font-mono text-stone-400 hover:text-stone-700"
                >
                  {t.closeResult} ✕
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. THE THREE MODES (STUDY, EXPLORE, RESEARCH) */}
        <section className="space-y-3">
          <div className="pb-1 border-b border-stone-200">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
              {t.threeModesSectionTitle}
            </h2>
            <p className="text-xs text-stone-500 font-tamil-sans">
              {t.threeModesSectionDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Mode 1: Study */}
            <div 
              onClick={() => handleLaunchMode('study')}
              className="group cursor-pointer bg-white rounded-xl border border-stone-200/90 p-4 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                    {t.studyMode}
                  </span>
                  <h3 className="font-classical-display font-bold text-base text-stone-900 mt-1">
                    {t.studyModeCardTitle}
                  </h3>
                  <p className="text-xs text-stone-600 font-tamil-sans mt-1 leading-relaxed">
                    {t.studyModeCardDesc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>{t.openStudy}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Mode 2: Explore */}
            <div 
              onClick={() => handleLaunchMode('explore')}
              className="group cursor-pointer bg-white rounded-xl border border-stone-200/90 p-4 hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {t.exploreMode}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {isTa ? '41 நூல்கள்' : '41 Works'}
                    </span>
                  </div>
                  <h3 className="font-classical-display font-bold text-base text-stone-900 mt-1">
                    {t.exploreModeCardTitle}
                  </h3>
                  <p className="text-xs text-stone-600 font-tamil-sans mt-1 leading-relaxed">
                    {t.exploreModeCardDesc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-900">
                <span>{t.openExplore}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Mode 3: Research */}
            <div 
              onClick={() => handleLaunchMode('research')}
              className="group cursor-pointer bg-white rounded-xl border border-stone-200/90 p-4 hover:border-stone-800 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-300 text-stone-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-900">
                    {t.researchMode}
                  </span>
                  <h3 className="font-classical-display font-bold text-base text-stone-900 mt-1">
                    {t.researchModeCardTitle}
                  </h3>
                  <p className="text-xs text-stone-600 font-tamil-sans mt-1 leading-relaxed">
                    {t.researchModeCardDesc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-900">
                <span>{t.openResearch}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>
        </section>

        {/* 4. HERITAGE CARD: Sangam Thinai Landscape */}
        <section className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                {isTa ? 'செம்மொழிப் பண்பாட்டு வெளி' : 'SANGAM POETICS'}
              </span>
              <h3 className="font-tamil-serif font-bold text-base text-stone-900">
                {t.sangamThinai}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">{t.tolkappiyamAkattinai}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {THINAI_LANDSCAPES.map((th) => (
              <button
                key={th.id}
                onClick={() => setSelectedThinai(th)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedThinai.id === th.id
                    ? 'bg-stone-900 text-stone-100 shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                {isTa ? th.nameTa : th.nameEn}
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-tamil-serif font-bold text-amber-950 text-sm">
                  {isTa ? selectedThinai.nameTa : selectedThinai.nameEn}
                </span>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full border border-amber-300 text-amber-900">
                  {selectedThinai.flower}
                </span>
              </div>
              <p className="text-stone-600 font-tamil-sans">
                {isTa ? selectedThinai.moodTa : selectedThinai.moodEn}
              </p>
            </div>
            <button
              onClick={() => handleLaunchMode('explore')}
              className="text-amber-900 hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto text-xs"
            >
              <span>{isTa ? 'அனைத்து நூல்களிலும் காண்க' : 'Explore in Canon'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

      </main>

      {/* Universal Scanner Modal (Integrated with Live Scan) */}
      <UniversalScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        role="study"
        language={language}
        onExtracted={(extractedText) => {
          setSearchQuery(extractedText);
          handleAskYaazh(extractedText);
          setIsScannerOpen(false);
        }}
        onSelectVerse={(verse) => {
          if (onInspectVerse) onInspectVerse(verse);
          handleLaunchMode('study');
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
};
