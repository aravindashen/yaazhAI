import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, BookOpen, Clock, Tag, ChevronRight, ArrowRight, ShieldCheck, Search, CheckCircle2, Play, Volume2, Award, Camera, Languages } from 'lucide-react';
import { ClassicalVerse, Concept, LearnerModule } from '../types/index.ts';
import { CLASSICAL_VERSES, CLASSICAL_WORKS, TAMIL_CONCEPTS, LEARNER_MODULES } from '../data/classicalCorpus.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { AudioPronunciation } from './AudioPronunciation.tsx';
import { processSmartInput } from '../services/tanglishConverter.ts';

interface LearnerPlatformProps {
  onInspectVerse: (verse: ClassicalVerse) => void;
  language: Language;
  onOpenScanner?: () => void;
}

export const LearnerPlatform: React.FC<LearnerPlatformProps> = ({
  onInspectVerse,
  language,
  onOpenScanner
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'journey' | 'atlas' | 'daily' | 'lexicon'>('journey');
  const [translateEn, setTranslateEn] = useState(false);

  // Journey state
  const [modules, setModules] = useState<LearnerModule[]>(LEARNER_MODULES);
  const [selectedModule, setSelectedModule] = useState<LearnerModule>(LEARNER_MODULES[0]);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yaazh_completed_lessons');
      return saved ? JSON.parse(saved) : ['les-1-1'];
    } catch {
      return ['les-1-1'];
    }
  });

  // Concept Atlas state
  const [selectedConcept, setSelectedConcept] = useState<Concept>(TAMIL_CONCEPTS[0]);

  // Daily verse state
  const [dailyVerse, setDailyVerse] = useState<ClassicalVerse>(CLASSICAL_VERSES[0]);

  // Lexicon state
  const [lexiconQuery, setLexiconQuery] = useState('');

  // Fetch daily verse & modules
  useEffect(() => {
    fetch('/api/learner/daily')
      .then(res => res.json())
      .then(data => {
        if (data.verse) setDailyVerse(data.verse);
      })
      .catch(e => console.warn(e));
  }, []);

  const toggleLessonCompletion = (lessonId: string) => {
    setCompletedLessons(prev => {
      const next = prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('yaazh_completed_lessons', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Collect all vocabulary for lexicon
  const allVocab = React.useMemo(() => {
    const list: { vocab: any; verse: ClassicalVerse }[] = [];
    CLASSICAL_VERSES.forEach(verse => {
      verse.vocabulary.forEach(v => {
        list.push({ vocab: v, verse });
      });
    });
    return list;
  }, []);

  const filteredVocab = allVocab.filter(item => {
    if (!lexiconQuery.trim()) return true;
    const q = lexiconQuery.toLowerCase();
    return (
      item.vocab.word.toLowerCase().includes(q) ||
      item.vocab.transliteration.toLowerCase().includes(q) ||
      item.vocab.classicalMeaningTa.toLowerCase().includes(q) ||
      item.vocab.englishMeaning.toLowerCase().includes(q)
    );
  });

  const conceptVerses = CLASSICAL_VERSES.filter(v =>
    v.coreConcepts.includes(selectedConcept.nameTa) ||
    selectedConcept.sampleVerseIds.includes(v.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <h1 className="text-xl font-classical-display font-bold text-stone-900 tracking-wide">
              {t.learnerWorkspace}
            </h1>
          </div>
          <p className="text-xs text-stone-600 font-tamil-sans">
            {t.learnerSubtitle}
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex flex-wrap items-center gap-2">
          {/* Real-time Camera & Upload Scanner */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Scan Tamil text, signboards, or storybooks"
            >
              <Camera className="w-3.5 h-3.5 text-stone-900" />
              <span>{language === 'ta' ? 'கேமரா ஸ்கேன்' : 'Camera Scan'}</span>
            </button>
          )}

          {/* Bilingual Translation Toggle */}
          <button
            onClick={() => setTranslateEn(!translateEn)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1.5 ${
              translateEn 
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title="Toggle English Translation for Lessons & Verses"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{translateEn ? 'தமிழ் வடிவம்' : 'English Trans.'}</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-lg border border-stone-300/40 text-xs">
            <button
              onClick={() => setActiveTab('journey')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'journey'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabJourney}
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'daily'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabDaily}
            </button>
            <button
              onClick={() => setActiveTab('atlas')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'atlas'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabAtlas}
            </button>
            <button
              onClick={() => setActiveTab('lexicon')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'lexicon'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabLexicon}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: STRUCTURED LEARNING PATHS (JOURNEY) */}
      {activeTab === 'journey' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Module Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white border border-stone-200 rounded-xl p-4 mb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                  {t.learningProgress}
                </span>
                <span className="text-sm font-mono font-bold text-stone-900">
                  {completedLessons.length} பாடங்கள் நிறைவு
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block">
              கற்றல் நிலைகள் (Curriculum Modules)
            </span>

            <div className="space-y-2">
              {modules.map(mod => {
                const isSelected = selectedModule.id === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModule(mod)}
                    className={`w-full text-left p-4 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono uppercase ${isSelected ? 'text-amber-300' : 'text-amber-800'}`}>
                        {language === 'ta' ? mod.levelTitleTa : mod.levelTitleEn}
                      </span>
                      <span className="text-[10px] font-mono opacity-60">
                        {mod.lessons.length} பாடங்கள்
                      </span>
                    </div>
                    <h4 className="font-tamil-serif font-bold text-sm leading-snug">
                      {language === 'ta' ? mod.titleTa : mod.titleEn}
                    </h4>
                    <p className={`line-clamp-2 mt-1 text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {language === 'ta' ? mod.descriptionTa : mod.descriptionEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Lessons Detail (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-[11px] font-mono text-amber-800 font-semibold uppercase block">
                  {language === 'ta' ? selectedModule.levelTitleTa : selectedModule.levelTitleEn}
                </span>
                <h2 className="font-tamil-serif font-bold text-xl text-stone-900">
                  {language === 'ta' ? selectedModule.titleTa : selectedModule.titleEn}
                </h2>
                <p className="text-xs text-stone-600 font-tamil-sans mt-1">
                  {language === 'ta' ? selectedModule.descriptionTa : selectedModule.descriptionEn}
                </p>
              </div>

              {/* Lessons List */}
              <div className="space-y-4">
                {selectedModule.lessons.map((lesson, idx) => {
                  const isDone = completedLessons.includes(lesson.id);
                  const targetVerse = lesson.targetVerseId
                    ? CLASSICAL_VERSES.find(v => v.id === lesson.targetVerseId)
                    : null;

                  return (
                    <div key={lesson.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-stone-400">
                              0{idx + 1}.
                            </span>
                            <h3 className="font-tamil-serif font-bold text-base text-stone-900">
                              {language === 'ta' ? lesson.titleTa : lesson.titleEn}
                            </h3>
                          </div>
                          <p className="text-xs text-stone-600 font-tamil-sans mt-1">
                            {language === 'ta' ? lesson.summaryTa : lesson.summaryEn}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleLessonCompletion(lesson.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-700' : 'text-stone-400'}`} />
                          <span>{isDone ? t.moduleCompleted : 'படித்தாயிற்று'}</span>
                        </button>
                      </div>

                      {/* Key Words */}
                      <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60">
                        <span className="text-[10px] font-mono text-stone-400 uppercase">
                          முக்கியச் சொற்கள்:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {lesson.keyWords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white text-stone-800 text-[11px] font-tamil-serif border border-stone-200">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Target Verse Practice */}
                      {targetVerse && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-stone-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                            <span>பயிற்சிப் பாடல்: {targetVerse.workTitleTa}</span>
                            <button
                              onClick={() => onInspectVerse(targetVerse)}
                              className="text-stone-900 font-medium hover:underline flex items-center gap-1"
                            >
                              <span>{t.viewFullEvidence}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="font-tamil-serif text-sm font-semibold text-stone-900 pl-2 border-l-2 border-stone-800">
                            {targetVerse.linesTa.map((l, li) => (
                              <p key={li}>{l}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY CLASSICAL VERSE CHALLENGE */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-2">
              <div>
                <span className="text-[11px] font-mono text-amber-800 font-semibold uppercase tracking-wider block">
                  {t.dailyVerseTitle}
                </span>
                <h2 className="font-tamil-serif font-bold text-2xl text-stone-900 mt-1">
                  {dailyVerse.workTitleTa} · {dailyVerse.chapterTa || `பாடல் ${dailyVerse.verseNumber}`}
                </h2>
                <p className="text-xs text-stone-500 font-mono">
                  புலவர்: {dailyVerse.poetTa} ({dailyVerse.poetEn}) · யாப்பு: {dailyVerse.meterTa}
                </p>
              </div>

              <button
                onClick={() => onInspectVerse(dailyVerse)}
                className="px-4 py-2 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono font-medium hover:bg-stone-800 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>{t.viewFullEvidence}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Classical Lines */}
            <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="pl-4 border-l-3 border-stone-900 font-tamil-serif text-xl font-bold text-stone-900 leading-relaxed">
                {dailyVerse.linesTa.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <p className="text-xs font-mono text-stone-500 italic">
                {dailyVerse.transliteration}
              </p>
            </div>

            {/* Audio Recitation Cadence Player */}
            <AudioPronunciation
              tamilText={dailyVerse.linesTa.join(' ')}
              transliteration={dailyVerse.transliteration}
              language={language}
            />

            {/* Commentary & English Translation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-1">
                  {dailyVerse.commentaries[0]?.scholarTa} உரை:
                </span>
                <p className="text-xs font-tamil-sans text-stone-800 leading-relaxed">
                  {dailyVerse.commentaries[0]?.textTa}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-1">
                  {dailyVerse.translations[0]?.translator} (Translation):
                </span>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "{dailyVerse.translations[0]?.text}"
                </p>
              </div>
            </div>

            {/* Vocabulary pills */}
            <div>
              <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                {t.classicalVocab}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dailyVerse.vocabulary.map((vocab, i) => (
                  <div key={i} className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-tamil-serif font-bold text-stone-900">{vocab.word}</span>
                      <span className="text-[10px] font-mono text-stone-500">{vocab.pos}</span>
                    </div>
                    <p className="text-stone-700 font-tamil-sans">{vocab.classicalMeaningTa}</p>
                    <p className="text-stone-500 italic text-[11px]">{vocab.englishMeaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONCEPT ATLAS */}
      {activeTab === 'atlas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
              {t.coreConcepts}
            </span>
            <div className="space-y-1.5">
              {TAMIL_CONCEPTS.map(concept => {
                const isSelected = selectedConcept.id === concept.id;
                return (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept)}
                    className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-tamil-serif font-bold text-sm">
                        {concept.nameTa}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {concept.transliteration}
                      </span>
                    </div>
                    <p className={`line-clamp-1 text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {concept.nameEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
              <div>
                <h2 className="font-tamil-serif font-bold text-2xl text-stone-900">
                  {selectedConcept.nameTa}
                </h2>
                <p className="text-xs font-mono text-stone-500 mt-0.5">
                  {selectedConcept.nameEn} · ({selectedConcept.transliteration})
                </p>
              </div>

              <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <p className="text-sm font-tamil-sans text-stone-800 leading-relaxed">
                  {selectedConcept.definitionTa}
                </p>
                <p className="text-xs text-stone-600 italic">
                  {selectedConcept.definitionEn}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                  {t.classicalVocab}
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedConcept.classicalVocabulary.map((word, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-stone-100 text-stone-800 font-tamil-serif text-xs border border-stone-200"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-1">
                  {t.culturalSignificance}
                </span>
                <p className="text-xs font-tamil-sans text-stone-700 leading-relaxed">
                  {selectedConcept.culturalSignificanceTa}
                </p>
              </div>
            </div>

            {/* Verses */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                {t.evidenceVerses}
              </h3>

              {conceptVerses.map(verse => (
                <div key={verse.id} className="bg-white border border-stone-200 p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-tamil-serif font-bold text-stone-900 text-sm">
                        {verse.workTitleTa}
                      </span>
                      <span className="text-stone-400 text-xs mx-1.5">·</span>
                      <span className="text-xs text-stone-600 font-mono">
                        {verse.chapterTa ? `${verse.chapterTa} (${verse.verseNumber})` : `பாடல் ${verse.verseNumber}`}
                      </span>
                    </div>

                    <button
                      onClick={() => onInspectVerse(verse)}
                      className="text-xs text-stone-700 hover:text-stone-950 flex items-center gap-1 font-mono font-medium"
                    >
                      <span>{t.viewFullEvidence}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pl-3 border-l-2 border-stone-800 font-tamil-serif text-sm font-medium text-stone-900 space-y-0.5">
                    {verse.linesTa.map((l, idx) => (
                      <p key={idx}>{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORD INTELLIGENCE LEXICON */}
      {activeTab === 'lexicon' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={lexiconQuery}
              onChange={(e) => setLexiconQuery(e.target.value)}
              placeholder={t.searchWordPlaceholder}
              className="w-full text-xs font-tamil-sans pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocab.map((item, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-tamil-serif font-bold text-base text-stone-900">
                    {item.vocab.word}
                  </h4>
                  {item.vocab.pos && (
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {item.vocab.pos}
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-mono text-stone-500">
                  {item.vocab.transliteration}
                </p>

                {item.vocab.splitForm && (
                  <p className="text-xs text-stone-500 font-tamil-sans">
                    பிரிப்பு: <span className="font-medium text-stone-700">{item.vocab.splitForm}</span>
                  </p>
                )}

                <div className="pt-2 border-t border-stone-100 text-xs font-tamil-sans">
                  <p className="text-stone-800 mb-0.5">{item.vocab.classicalMeaningTa}</p>
                  <p className="text-stone-500 italic">{item.vocab.englishMeaning}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-stone-400">
                  <span>{item.verse.workTitleTa}</span>
                  <button
                    onClick={() => onInspectVerse(item.verse)}
                    className="text-stone-700 hover:text-stone-950 underline"
                  >
                    சான்று
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
