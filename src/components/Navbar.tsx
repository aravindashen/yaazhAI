import React from 'react';
import { 
  GraduationCap, 
  Compass, 
  Microscope, 
  Globe, 
  Camera, 
  Languages, 
  Mic, 
  Search,
  Home,
  Bot,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';

interface NavbarProps {
  currentRole: UserRole;
  onSwitchRole: () => void;
  onSelectMode?: (mode: UserRole) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  userName?: string;
  onOpenVoiceAccess?: () => void;
  onOpenChatbot?: () => void;
  corpusStats: {
    worksCount: number;
    indexedVerses: number;
    conceptsCount: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSwitchRole,
  onSelectMode,
  language,
  onToggleLanguage,
  userName,
  onOpenVoiceAccess,
  onOpenChatbot,
  corpusStats
}) => {
  const t = TRANSLATIONS[language];

  const handleNav = (mode: UserRole) => {
    if (onSelectMode) {
      onSelectMode(mode);
    } else if (mode === 'home') {
      onSwitchRole();
    }
  };

  const isStudy = currentRole === 'study' || currentRole === 'student';
  const isExplore = currentRole === 'explore' || currentRole === 'learner';
  const isResearch = currentRole === 'research' || currentRole === 'researcher';
  const isHome = currentRole === 'home' || !currentRole;

  return (
    <header role="banner" className="border-b border-stone-200/80 bg-[#faf8f5]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Skip Link for Screen Readers (TalkBack / VoiceOver) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-stone-100 focus:rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500"
      >
        {language === 'ta' ? 'முதன்மை உள்ளடக்கத்திற்குச் செல்' : 'Skip to main content'}
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
              aria-label="YAAZH AI Home"
            >
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-classical-display font-bold text-base tracking-tight shadow-xs group-hover:bg-amber-600 transition-colors">
                யா
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-classical-display font-bold text-base tracking-wider text-stone-900">
                    YAAZH
                  </span>
                  <span className="text-stone-300 font-light">·</span>
                  <span className="font-tamil-serif text-sm font-semibold text-stone-700">
                    யாழ்
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400 hidden sm:block tracking-tight">
                  {language === 'ta' ? 'செம்மொழி அறிவுப் பொறி' : 'Classical Tamil Intelligence'}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Segmented Mode Switcher */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center bg-stone-200/60 p-1 rounded-xl border border-stone-300/40">
            <button
              onClick={() => handleNav('home')}
              aria-current={isHome ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isHome
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/40'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'முகப்பு' : 'Home'}</span>
            </button>

            <button
              onClick={() => handleNav('study')}
              aria-current={isStudy ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isStudy
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/40'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'கற்றல்' : 'Study'}</span>
            </button>

            <button
              onClick={() => handleNav('explore')}
              aria-current={isExplore ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isExplore
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'அறிதல்' : 'Explore'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 font-mono">
                41
              </span>
            </button>

            <button
              onClick={() => handleNav('research')}
              aria-current={isResearch ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isResearch
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/40'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'ஆய்வு' : 'Research'}</span>
            </button>
          </nav>

          {/* Right Action Controls: Voice Access, Scanner, Translator, Language */}
          <div className="flex items-center gap-2">
            
            {/* YAAZH AI Chatbot Header Button (Available in Every Mode) */}
            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-100 font-medium text-xs transition-all shadow-xs active:scale-95"
                title={language === 'ta' ? 'யாழ் AI அரட்டை திறக்குக' : 'Open YAAZH AI Chatbot'}
                aria-label="Open YAAZH AI Chatbot"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-tamil-sans font-semibold">{t.chatbotBadge}</span>
                <Sparkles className="w-3 h-3 text-amber-400 hidden sm:inline" />
              </button>
            )}

            {/* YAAZH Voice Access Button (Genuine Accessibility for Blind/Visually Impaired) */}
            {onOpenVoiceAccess && (
              <button
                onClick={onOpenVoiceAccess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-600/60 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs transition-all shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-600"
                aria-label={
                  language === 'ta'
                    ? 'யாழ் குரல் அணுகல் திறக்கவும். பார்வையற்றோருக்கான வாய்ஸ் மோட். விசைப்பலகை: Alt + V'
                    : 'Open YAAZH Voice Access for blind and visually impaired scholars. Shortcut: Alt + V'
                }
                title="YAAZH Voice Access (Alt + V)"
              >
                <Mic className="w-4 h-4 text-stone-950 animate-pulse" />
                <span className="font-semibold">{language === 'ta' ? 'குரல்' : 'Voice'}</span>
                <kbd className="hidden lg:inline-block px-1 py-0.5 text-[10px] bg-stone-950/10 rounded font-mono text-stone-900">
                  Alt+V
                </kbd>
              </button>
            )}

            {/* Language Switcher */}
            <div
              role="group"
              aria-label="Language selection"
              className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs"
            >
              <button
                onClick={() => onToggleLanguage('ta')}
                aria-pressed={language === 'ta'}
                className={`px-2 py-0.5 text-xs font-tamil-sans rounded-lg transition-colors ${
                  language === 'ta'
                    ? 'bg-stone-900 text-stone-100 font-medium'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => onToggleLanguage('en')}
                aria-pressed={language === 'en'}
                className={`px-2 py-0.5 text-xs font-mono rounded-lg transition-colors ${
                  language === 'en'
                    ? 'bg-stone-900 text-stone-100 font-medium'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden border-t border-stone-200 bg-[#faf8f5] px-4 py-2 flex items-center justify-around text-xs">
        <button
          onClick={() => handleNav('home')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${isHome ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'}`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'முகப்பு' : 'Home'}</span>
        </button>
        <button
          onClick={() => handleNav('study')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${isStudy ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'}`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'கற்றல்' : 'Study'}</span>
        </button>
        <button
          onClick={() => handleNav('explore')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${isExplore ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'}`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'அறிதல்' : 'Explore'}</span>
        </button>
        <button
          onClick={() => handleNav('research')}
          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg ${isResearch ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'}`}
        >
          <Microscope className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'ஆய்வு' : 'Research'}</span>
        </button>
      </div>
    </header>
  );
};
