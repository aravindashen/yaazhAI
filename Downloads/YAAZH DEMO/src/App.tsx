import React, { useState, useEffect } from 'react';
import { UserRole, ClassicalVerse } from './types/index.ts';
import { Language, TRANSLATIONS } from './services/i18n.ts';
import { Navbar } from './components/Navbar.tsx';
import { TamilCulturalPortal } from './components/TamilCulturalPortal.tsx';
import { StudentPlatform } from './components/StudentPlatform.tsx';
import { ExploreWorkspace } from './components/ExploreWorkspace.tsx';
import { ResearchPlatform } from './components/ResearchPlatform.tsx';
import { EvidenceModal } from './components/EvidenceModal.tsx';
import { UniversalScannerModal } from './components/UniversalScannerModal.tsx';
import { YaazhVoiceAccess } from './components/YaazhVoiceAccess.tsx';
import { YaazhChatbot } from './components/YaazhChatbot.tsx';
import { CLASSICAL_VERSES, CLASSICAL_WORKS, TAMIL_CONCEPTS } from './data/classicalCorpus.ts';
import { Mic, Home, GraduationCap, Compass, Microscope, Bot, Sparkles } from 'lucide-react';

export default function App() {
  // Language State: 'ta' | 'en'
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('yaazh_language');
      return (stored === 'en' || stored === 'ta') ? stored : 'ta';
    } catch {
      return 'ta';
    }
  });

  // Role / Platform Mode: 'home' | 'study' | 'explore' | 'research'
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => {
    try {
      const stored = localStorage.getItem('yaazh_user_role') as UserRole;
      if (stored === 'study' || stored === 'explore' || stored === 'research' || stored === 'student' || stored === 'learner' || stored === 'researcher') {
        return stored;
      }
      return 'home';
    } catch {
      return 'home';
    }
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('yaazh_user_name') || 'இளங்கோவன்';
    } catch {
      return 'இளங்கோவன்';
    }
  });

  const [inspectedVerse, setInspectedVerse] = useState<ClassicalVerse | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVoiceAccessOpen, setIsVoiceAccessOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Global Alt+V Keyboard Shortcut for YAAZH Voice Access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsVoiceAccessOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [savedVerses, setSavedVerses] = useState<ClassicalVerse[]>(() => {
    try {
      const stored = localStorage.getItem('yaazh_saved_verses');
      return stored ? JSON.parse(stored) : [CLASSICAL_VERSES[0]];
    } catch {
      return [CLASSICAL_VERSES[0]];
    }
  });

  const [corpusStats, setCorpusStats] = useState({
    worksCount: CLASSICAL_WORKS.length,
    indexedVerses: CLASSICAL_VERSES.length,
    conceptsCount: TAMIL_CONCEPTS.length
  });

  // Fetch health & stats
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.corpus) {
          setCorpusStats({
            worksCount: data.corpus.worksCount,
            indexedVerses: data.corpus.indexedVerses,
            conceptsCount: data.corpus.conceptsCount
          });
        }
      })
      .catch(err => console.warn('Corpus stats load:', err));
  }, []);

  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('yaazh_language', lang);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectRole = (role: UserRole, name: string) => {
    setCurrentRole(role);
    setUserName(name);
    try {
      localStorage.setItem('yaazh_user_role', role);
      localStorage.setItem('yaazh_user_name', name);
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchRole = () => {
    setCurrentRole('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSaveVerse = (verse: ClassicalVerse) => {
    setSavedVerses(prev => {
      const exists = prev.some(v => v.id === verse.id);
      const next = exists ? prev.filter(v => v.id !== verse.id) : [...prev, verse];
      try {
        localStorage.setItem('yaazh_saved_verses', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const t = TRANSLATIONS[language];
  const isHomeView = !currentRole || currentRole === 'home';
  const isStudy = currentRole === 'study' || currentRole === 'student';
  const isExplore = currentRole === 'explore' || currentRole === 'learner';
  const isResearch = currentRole === 'research' || currentRole === 'researcher';

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-stone-900 selection:bg-amber-200 flex flex-col font-tamil-sans">
      
      {/* Dynamic View rendering */}
      {isHomeView ? (
        <TamilCulturalPortal
          currentRole={currentRole}
          onSelectRole={handleSelectRole}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onOpenVoiceAccess={() => setIsVoiceAccessOpen(true)}
          onOpenChatbot={() => setIsChatbotOpen(true)}
          userName={userName}
          onInspectVerse={(verse) => {
            setInspectedVerse(verse);
            handleSelectRole('study', userName);
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col pb-20">
          <Navbar
            currentRole={currentRole}
            onSwitchRole={handleSwitchRole}
            onSelectMode={(mode) => handleSelectRole(mode, userName)}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            userName={userName}
            corpusStats={corpusStats}
            onOpenVoiceAccess={() => setIsVoiceAccessOpen(true)}
            onOpenChatbot={() => setIsChatbotOpen(true)}
          />

          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-hidden">
            {isStudy && (
              <StudentPlatform
                onInspectVerse={(verse) => setInspectedVerse(verse)}
                language={language}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {isExplore && (
              <ExploreWorkspace
                onInspectVerse={(verse) => {
                  setInspectedVerse(verse);
                  handleSelectRole('study', userName);
                }}
                onSelectConceptForSearch={() => {
                  handleSelectRole('research', userName);
                }}
                onJumpToStudy={(verse) => {
                  setInspectedVerse(verse);
                  handleSelectRole('study', userName);
                }}
                language={language}
              />
            )}

            {isResearch && (
              <ResearchPlatform
                onInspectVerse={(verse) => setInspectedVerse(verse)}
                savedVerses={savedVerses}
                onToggleSaveVerse={handleToggleSaveVerse}
                language={language}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}
          </main>
        </div>
      )}

      {/* MOBILE APPLICATION BOTTOM NAVIGATION BAR (Fixed at bottom) */}
      <nav 
        role="navigation" 
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-2 py-1.5"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Home / Ask YAAZH */}
          <button
            onClick={() => handleSelectRole('home', userName)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isHomeView 
                ? 'text-stone-950 font-bold' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="Home and Ask YAAZH"
          >
            <div className={`p-1 rounded-lg ${isHomeView ? 'bg-stone-900 text-stone-100' : ''}`}>
              <Home className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">{t.navHome}</span>
          </button>

          {/* Study Mode */}
          <button
            onClick={() => handleSelectRole('study', userName)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isStudy 
                ? 'text-emerald-950 font-bold' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="Study Platform"
          >
            <div className={`p-1 rounded-lg ${isStudy ? 'bg-emerald-800 text-emerald-50' : ''}`}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">{t.navStudy}</span>
          </button>

          {/* Center Voice Access Button */}
          <button
            onClick={() => setIsVoiceAccessOpen(true)}
            className="flex flex-col items-center justify-center -mt-4 py-1 px-2 transition-transform active:scale-90"
            aria-label="YAAZH Voice Access"
            title="Voice Access (Alt+V)"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-stone-950">
              <Mic className="w-5 h-5 text-stone-950 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-amber-950 mt-0.5 font-mono">{t.navVoice}</span>
          </button>

          {/* Explore Mode */}
          <button
            onClick={() => handleSelectRole('explore', userName)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isExplore 
                ? 'text-amber-950 font-bold' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="Explore Platform"
          >
            <div className={`p-1 rounded-lg ${isExplore ? 'bg-amber-800 text-amber-50' : ''}`}>
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">{t.navExplore}</span>
          </button>

          {/* Research Mode */}
          <button
            onClick={() => handleSelectRole('research', userName)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isResearch 
                ? 'text-stone-950 font-bold' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
            aria-label="Research Platform"
          >
            <div className={`p-1 rounded-lg ${isResearch ? 'bg-stone-900 text-stone-100' : ''}`}>
              <Microscope className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">{t.navResearch}</span>
          </button>

        </div>
      </nav>

      {/* FLOATING CHATBOT BUTTON (Available in EVERY mode) */}
      <aside aria-label="YAAZH AI Chat Assistant" className="fixed bottom-16 right-3 sm:bottom-20 sm:right-6 z-40">
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-100 shadow-xl border-2 border-amber-500/80 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label={language === 'ta' ? 'யாழ் AI உடனடி அரட்டை' : 'Ask YAAZH AI Chatbot'}
          title={language === 'ta' ? 'யாழ் AI உரையாடல் (எல்லாப் பயன்முறையிலும் கிடைக்கும்)' : 'Ask YAAZH AI Chatbot (Available across all modes)'}
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="font-tamil-sans font-semibold text-xs sm:text-sm tracking-wide text-white">
            {language === 'ta' ? 'யாழ் AI' : 'Ask YAAZH'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 hidden xs:inline" />
        </button>
      </aside>

      {/* YAAZH Mode-Aware Chatbot (Accessible across ALL modes) */}
      {isChatbotOpen && (
        <YaazhChatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          language={language}
          currentRole={currentRole}
          userName={userName}
          onInspectVerse={(verse) => {
            setInspectedVerse(verse);
            handleSelectRole('study', userName);
          }}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenVoiceAccess={() => setIsVoiceAccessOpen(true)}
        />
      )}

      {/* YAAZH Voice Access Modal */}
      {isVoiceAccessOpen && (
        <YaazhVoiceAccess
          isOpen={isVoiceAccessOpen}
          onClose={() => setIsVoiceAccessOpen(false)}
          language={language}
          currentRole={currentRole}
          onSwitchPlatform={(role) => {
            if (role) handleSelectRole(role, userName);
          }}
          activeVerse={inspectedVerse}
          onSelectVerse={(verse) => {
            setInspectedVerse(verse);
            handleSelectRole('study', userName);
          }}
        />
      )}

      {/* Evidence Modal */}
      {inspectedVerse && (
        <EvidenceModal
          verse={inspectedVerse}
          onClose={() => setInspectedVerse(null)}
          onSaveToCollection={handleToggleSaveVerse}
          language={language}
        />
      )}

      {/* Universal Camera Scanner Modal */}
      {isScannerOpen && (
        <UniversalScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          language={language}
          role={currentRole || 'study'}
          onExtracted={(text: string, verse?: ClassicalVerse) => {
            if (verse) {
              setInspectedVerse(verse);
              handleSelectRole('study', userName);
            }
            setIsScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}
