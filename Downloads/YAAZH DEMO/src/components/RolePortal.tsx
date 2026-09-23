import React, { useState } from 'react';
import { GraduationCap, Sparkles, BookOpen, Microscope, ArrowRight, Globe, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';

interface RolePortalProps {
  currentRole: UserRole | null;
  onSelectRole: (role: UserRole, userName: string) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const RolePortal: React.FC<RolePortalProps> = ({
  currentRole,
  onSelectRole,
  language,
  onToggleLanguage
}) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState('இளங்கோவன் (Tamil Scholar)');

  const roles: Array<{
    id: UserRole;
    icon: typeof GraduationCap;
    title: string;
    badge: string;
    description: string;
    features: string[];
    accentColor: string;
  }> = [
    {
      id: 'student',
      icon: GraduationCap,
      title: t.studyPlatformTitle,
      badge: language === 'ta' ? 'தேர்வு & படிப்பு' : 'EXAMS & STUDY',
      description: t.studyPlatformDesc,
      features: language === 'ta' ? [
        'பாடநூல் / குறிப்புகள் OCR எழுத்துணரி',
        'சொல்-பிரிப்பு, இலக்கணம் & வேர்ச்சொற்கள்',
        'அறிவு அட்டை (Flashcard) மனனம்',
        'மதிப்பெண் உடனடி வினாடிவினா'
      ] : [
        'Document & Image OCR Text Extractor',
        'Word-by-word Sandhi & Grammar Breakdown',
        'Interactive Memorization Flashcards',
        'Auto-graded Comprehension Quizzes'
      ],
      accentColor: 'border-emerald-800/40 hover:border-emerald-700 bg-emerald-950/5'
    },
    {
      id: 'learner',
      icon: Sparkles,
      title: t.learnerPlatformTitle,
      badge: language === 'ta' ? 'மொழி & பண்பாடு' : 'LANGUAGE & CULTURE',
      description: t.learnerPlatformDesc,
      features: language === 'ta' ? [
        'தொடக்க நிலை முதல் உயர்மட்டக் கற்றல் வழிகள்',
        'தமிழர் விழுமிய வரைபடம் (Concept Atlas)',
        'செவ்வியல் உச்சரிப்பு & யாப்பு ஓசை வழிகாட்டி',
        'தினசரிப் பாடல் சவால் & சொல்வளக் களஞ்சியம்'
      ] : [
        'Progressive 4-Stage Learning Curriculum',
        'Tamil Cultural Concept Atlas (அறம், அன்பு, வீரம்)',
        'Classical Recitation & Meter Cadence Player',
        'Daily Classical Verse & Word Intelligence'
      ],
      accentColor: 'border-amber-800/40 hover:border-amber-700 bg-amber-950/5'
    },
    {
      id: 'researcher',
      icon: Microscope,
      title: t.researchPlatformTitle,
      badge: language === 'ta' ? 'செம்மொழி ஆய்வகம்' : 'SCHOLARLY LAB',
      description: t.researchPlatformDesc,
      features: language === 'ta' ? [
        'கலப்புத் தேடல் (Hybrid Semantic & Exact Corpus)',
        'சுவடி & அச்சுப் பாடபேதங்கள் (Textual Variants)',
        'செவ்வியல் உரைகள் & மொழிபெயர்ப்பு ஒப்பாய்வு',
        'ஆய்வுக் கேள்வி தொகுப்பாளர் & BibTeX மேற்கோள்'
      ] : [
        'Faceted Multi-Vector Corpus Search',
        'Critical Edition Textual Variants (பாடபேதம்)',
        'Multi-Scholiast Comparative Matrix',
        'Inquiry Synthesizer & BibTeX/APA Export'
      ],
      accentColor: 'border-stone-800 hover:border-stone-900 bg-stone-900/5'
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between p-4 sm:p-6 lg:p-12">
      {/* Header bar with Language Toggle */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-classical-display font-bold text-lg shadow-sm">
            யா
          </div>
          <div>
            <h1 className="font-classical-display font-bold text-lg text-stone-900 tracking-wide">
              {t.appName}
            </h1>
            <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
              {t.sourceBeforeAi}
            </p>
          </div>
        </div>

        {/* Bilingual Language Switcher */}
        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-stone-200 shadow-2xs">
          <Globe className="w-4 h-4 text-stone-500" />
          <button
            onClick={() => onToggleLanguage('ta')}
            className={`px-2.5 py-1 text-xs font-tamil-sans font-medium rounded transition-colors ${
              language === 'ta' ? 'bg-stone-900 text-stone-100' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            தமிழ்
          </button>
          <button
            onClick={() => onToggleLanguage('en')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              language === 'en' ? 'bg-stone-900 text-stone-100' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Role Selection Area */}
      <div className="max-w-6xl mx-auto w-full my-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-classical-display font-bold text-stone-900 tracking-tight">
            {t.selectPlatform}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-tamil-sans">
            {t.selectPlatformDesc}
          </p>
        </div>

        {/* 3 Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = currentRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => onSelectRole(role.id, name)}
                className={`rounded-2xl border-2 p-6 flex flex-col justify-between cursor-pointer transition-all bg-white hover:shadow-md ${
                  role.accentColor
                } ${isSelected ? 'ring-2 ring-stone-900 shadow-sm' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                      {role.badge}
                    </span>
                  </div>

                  <h3 className="font-tamil-serif font-bold text-lg text-stone-900 mb-2">
                    {role.title}
                  </h3>
                  <p className="text-xs text-stone-600 font-tamil-sans leading-relaxed mb-6">
                    {role.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                      {language === 'ta' ? 'முதன்மைச் சிறப்பம்சங்கள்:' : 'Key Capabilities:'}
                    </span>
                    {role.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-tamil-sans text-stone-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-800 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100">
                  <button
                    onClick={() => onSelectRole(role.id, name)}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-lg text-xs font-mono font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>{t.enterPlatform}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-500 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-stone-700" />
          <span>{t.tagline}</span>
        </div>
        <div>
          <span>CICT · TVA · U.V. Swaminatha Iyer Critical Library</span>
        </div>
      </div>
    </div>
  );
};
