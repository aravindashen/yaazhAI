import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  BookOpen, 
  Clock, 
  Tag, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Network, 
  Filter, 
  Layers, 
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';
import { ClassicalVerse, ClassicalWork, Concept } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { 
  CLASSICAL_VERSES, 
  CLASSICAL_WORKS, 
  TAMIL_CONCEPTS,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_GRAPH_EDGES
} from '../data/classicalCorpus.ts';

const CATEGORY_EN_MAP: Record<string, string> = {
  'பத்துப்பாட்டு': 'Ten Idylls (Pattuppattu)',
  'எட்டுத்தொகை': 'Eight Anthologies (Ettuttokai)',
  'பதினெண்கீழ்க்கணக்கு': 'Eighteen Lesser Texts (Patinenkilkkanakku)',
  'காப்பியம்': 'Classical Epics (Kappiyam)',
  'இலக்கணம்': 'Grammar & Poetics (Ilakkanam)'
};

interface ExploreWorkspaceProps {
  onInspectVerse: (verse: ClassicalVerse) => void;
  onSelectConceptForSearch: (conceptId: string) => void;
  onJumpToStudy?: (verse: ClassicalVerse) => void;
  language?: Language;
}

const TIMELINE_ERAS = [
  {
    eraKey: 'early',
    titleTa: 'தொடக்கச் சங்க காலம் & மூல இலக்கணம்',
    titleEn: 'Early Sangam & Foundational Grammar',
    timeRangeTa: 'கி.மு. 4 - 2 ஆம் நூற்றாண்டு',
    timeRangeEn: 'BCE 400 - 200',
    archaeologyTa: 'கீழடி & பொருந்தல் தொல்லியல் காலக்கோடு',
    archaeologyEn: 'Keeladi & Porunthal Epigraphical Evidence',
    descriptionTa: 'தமிழ் மொழியின் மூல இலக்கணம் வகுக்கப்பட்டு, கவிதை யாப்பு, அகத்திணை-புறத்திணை பாகுபாடுகள் நிலைநிறுத்தப்பட்ட தொடக்க பொற்காலம்.',
    descriptionEn: 'The foundational golden age when grammatical rules, poetics, and the Akam-Puram classification were codified in Tolkappiyam.',
    works: ['tolkappiyam']
  },
  {
    eraKey: 'sangam',
    titleTa: 'செவ்வியல் சங்கக் காலம் (எட்டுத்தொகையும் பத்துப்பாட்டும்)',
    titleEn: 'High Classical Sangam Corpus (Ettuthokai & Pathupattu)',
    timeRangeTa: 'கி.மு. 3 - கி.பி. 2 ஆம் நூற்றாண்டு',
    timeRangeEn: 'BCE 300 - CE 200',
    archaeologyTa: 'கொடுமணல் & அழகன்குளம் உரோமானிய வணிகத் தொடர்புகள்',
    archaeologyEn: 'Kodumanal & Alagankulam Roman Trade Corridors',
    descriptionTa: 'வீரம், கொடை, இயற்கை, காதல், ஆற்றுப்படை மற்றும் உலக சகோதரத்துவத்தை (யாதும் ஊரே) பாடிய 2381 சங்கச் செய்யுட்கள் மலர்ந்த காலம்.',
    descriptionEn: 'The pinnacle of classical poetry comprising 2,381 poems on valor, universal kinship (Yaathum Oore), landscape poetics, and love.',
    works: [
      'purananuru', 'kurunthogai', 'narrinai', 'ainkurunuru', 'pathitruppathu', 'paripadal', 'kalithokai', 'akananuru',
      'tirumurugatruppadai', 'porunaratruppadai', 'sirupanatruppadai', 'perumbanatruppadai', 'mullaipattu',
      'maduraikkanji', 'nedunalvaadai', 'kurinjippattu', 'pattinappalai', 'malaipadukadam'
    ]
  },
  {
    eraKey: 'post-sangam',
    titleTa: 'சங்க மருவிய அறநெறிக் காலம் (பதினெண்கீழ்க்கணக்கு)',
    titleEn: 'Post-Sangam & Didactic Golden Age (18 Lesser Works)',
    timeRangeTa: 'கி.பி. 1 - 5 ஆம் நூற்றாண்டு',
    timeRangeEn: 'CE 100 - 500',
    archaeologyTa: 'பூம்புகார் & காவிரிப்பட்டினச் சங்க மருவிய சின்னங்கள்',
    archaeologyEn: 'Poompuhar & Kaveripattinam Epigraphy',
    descriptionTa: 'திருக்குறள், நாலடியார் உள்ளிட்ட 18 நீதிநூல்கள் தோன்றி, வாழ்வியல் விழுமியங்களையும் உலகளாவிய மனித அறத்தையும் நிலைநிறுத்திய காலம்.',
    descriptionEn: 'The era of universal ethics and civic virtue exemplified by Tirukkural and Naladiyar, formulating guidance for personal and social life.',
    works: [
      'tirukkural', 'naladiyar', 'nanmanikkadikai', 'inna-narpathu', 'iniyavai-narpathu', 'kar-narpathu',
      'kalavazhi-narpathu', 'ainthinai-aimpathu', 'thinaimozhi-aimpathu', 'ainthinai-ezhupathu',
      'thinaimalai-nutraimpathu', 'thirikadukam', 'acharakkovai', 'pazhamozhi-nanuru', 'sirupanchamulam',
      'mudumozhikkanji', 'elathi', 'kainnilai'
    ]
  },
  {
    eraKey: 'epics',
    titleTa: 'செம்மொழிக் காப்பியக் காலம் (ஐம்பெருங்காப்பியங்கள்)',
    titleEn: 'Classical Tamil Epic Age',
    timeRangeTa: 'கி.பி. 2 - 9 ஆம் நூற்றாண்டு',
    timeRangeEn: 'CE 200 - 900',
    archaeologyTa: 'வஞ்சி, மதுரை & காவிரிப்பூம்பட்டின முப்பெரும் காப்பிய நகரங்கள்',
    archaeologyEn: 'Vanji, Madurai & Kaveripoompattinam Sites',
    descriptionTa: 'சிலப்பதிகாரம், மணிமேகலை, சீவக சிந்தாமணி என இசை, நாடகம், தத்துவம் மற்றும் சமூக நீதியை ஒருங்கே பாடிய பெருங்காப்பியங்கள் எழுந்த காலம்.',
    descriptionEn: 'The rise of monumental narrative verse synthesizing music, drama, philosophy, and political ethics like Silappadikaram and Manimekalai.',
    works: ['silappadikaram', 'manimekalai', 'civaka-cintamani', 'valayapathi-kundalakesi']
  }
];

export const ExploreWorkspace: React.FC<ExploreWorkspaceProps> = ({
  onInspectVerse,
  onSelectConceptForSearch,
  onJumpToStudy,
  language = 'ta'
}) => {
  const isTa = language === 'ta';
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'works' | 'timeline' | 'atlas' | 'graph' | 'lexicon'>('works');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [selectedWork, setSelectedWork] = useState<ClassicalWork | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept>(TAMIL_CONCEPTS[0]);
  const [lexiconQuery, setLexiconQuery] = useState('');
  const [selectedGraphNode, setSelectedGraphNode] = useState(KNOWLEDGE_GRAPH_NODES[0]);

  // Filter 41 works
  const filteredWorks = useMemo(() => {
    return CLASSICAL_WORKS.filter(work => {
      const matchesCategory = selectedCategory === 'ALL' || work.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!workSearchQuery.trim()) return true;
      const q = workSearchQuery.toLowerCase();
      return (
        work.titleTa.toLowerCase().includes(q) ||
        work.titleEn.toLowerCase().includes(q) ||
        work.transliteration.toLowerCase().includes(q) ||
        work.author.toLowerCase().includes(q) ||
        work.authorEn.toLowerCase().includes(q) ||
        work.descriptionTa.toLowerCase().includes(q) ||
        work.descriptionEn.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, workSearchQuery]);

  // Vocabulary list across verses
  const allVocab = useMemo(() => {
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

  // Verses embodying the selected concept
  const conceptVerses = CLASSICAL_VERSES.filter(v =>
    v.coreConcepts.includes(selectedConcept.nameTa) ||
    selectedConcept.sampleVerseIds.includes(v.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
              {isTa ? 'கண்டறிதல் தளம்' : 'EXPLORE WORKSPACE'}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {isTa ? '41 செம்மொழி நூல்கள்' : '41 Classical Works'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-classical-display font-bold text-stone-900 tracking-tight">
            {isTa ? 'செம்மொழித் தமிழ் களஞ்சியம்' : 'Classical Tamil Discovery & Canon'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-tamil-sans mt-1 max-w-2xl leading-relaxed">
            {isTa 
              ? 'தொல்காப்பியம் முதல் ஐம்பெருங்காப்பியங்கள் வரையிலான 41 செம்மொழி நூல்கள், வரலாற்று காலக்கோடு, விழுமிய வரைபடம் மற்றும் அறிவுப் பின்னல்.' 
              : 'Chronological timeline, conceptual atlas, 41 canonical works from Tolkappiyam to the Great Epics, and relational knowledge graph.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-stone-200/60 p-1 rounded-xl border border-stone-300/40 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('works')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'works'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            {isTa ? '41 நூல்கள்' : '41 Works'}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'timeline'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            {isTa ? 'காலவரிசை' : 'Timeline'}
          </button>
          <button
            onClick={() => setActiveTab('atlas')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'atlas'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            {isTa ? 'விழுமியங்கள்' : 'Concepts'}
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'graph'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            {isTa ? 'அறிவுப் பின்னல்' : 'Knowledge Graph'}
          </button>
          <button
            onClick={() => setActiveTab('lexicon')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'lexicon'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            {isTa ? 'சொற்களஞ்சியம்' : 'Lexicon'}
          </button>
        </div>
      </div>

      {/* VIEW 1: THE 41 CLASSICAL WORKS */}
      {activeTab === 'works' && (
        <div className="space-y-6">
          
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {[
                { id: 'ALL', labelTa: 'அனைத்து 41 நூல்கள்', labelEn: 'All 41 Works' },
                { id: 'இலக்கணம்', labelTa: 'தொல்காப்பியம் (1)', labelEn: 'Tolkappiyam (1)' },
                { id: 'பத்துப்பாட்டு', labelTa: 'பத்துப்பாட்டு (10)', labelEn: 'Pathuppattu (10)' },
                { id: 'எட்டுத்தொகை', labelTa: 'எட்டுத்தொகை (8)', labelEn: 'Ettuthokai (8)' },
                { id: 'பதினெண்கீழ்க்கணக்கு', labelTa: 'பதினெண்கீழ்க்கணக்கு (18)', labelEn: '18 Lesser Works (18)' },
                { id: 'காப்பியம்', labelTa: 'காப்பியங்கள் (4)', labelEn: 'Epics (4)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-stone-100'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {isTa ? cat.labelTa : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Work Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
                placeholder={isTa ? 'நூல் தலைப்பு, ஆசிரியர் கொண்டு தேடுக...' : 'Search 41 works by title, poet...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-stone-900 font-tamil-sans"
              />
            </div>
          </div>

          {/* Canonical Works Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorks.map(work => (
              <div
                key={work.id}
                onClick={() => setSelectedWork(work)}
                className="bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {isTa ? work.category : (CATEGORY_EN_MAP[work.category] || work.category)}
                    </span>
                    <span>{work.approxDate}</span>
                  </div>

                  <h3 className="font-tamil-serif font-bold text-lg text-stone-900 group-hover:text-amber-900 transition-colors mb-0.5">
                    {isTa ? work.titleTa : work.titleEn}
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mb-3">
                    {isTa ? work.transliteration : work.titleTa} · {isTa ? work.author : work.authorEn}
                  </p>

                  <p className="text-xs font-tamil-sans text-stone-600 line-clamp-2 leading-relaxed mb-4">
                    {isTa ? work.descriptionTa : work.descriptionEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-stone-500">
                    {work.verseCount ? `${work.verseCount.toLocaleString()} ${isTa ? 'பாக்கள் / அடிகள்' : 'verses / lines'}` : work.structure}
                  </span>
                  <span className="text-stone-900 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>{isTa ? 'விவரம்' : 'Details'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Work Detail Modal */}
          {selectedWork && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
              <div 
                className="bg-[#faf8f5] w-full max-w-2xl rounded-2xl border border-stone-300 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-mono">
                        {isTa ? selectedWork.category : (CATEGORY_EN_MAP[selectedWork.category] || selectedWork.category)}
                      </span>
                      <span className="text-xs font-mono text-stone-500">{selectedWork.period}</span>
                    </div>
                    <h2 className="font-tamil-serif font-bold text-2xl sm:text-3xl text-stone-900">
                      {isTa ? selectedWork.titleTa : selectedWork.titleEn}
                    </h2>
                    <p className="font-mono text-xs text-stone-500 mt-0.5">
                      {isTa ? `${selectedWork.titleEn} (${selectedWork.transliteration})` : selectedWork.titleTa} · {isTa ? selectedWork.author : selectedWork.authorEn}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedWork(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Description */}
                <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
                  <p className="font-tamil-sans text-sm text-stone-800 leading-relaxed">
                    {isTa ? selectedWork.descriptionTa : selectedWork.descriptionEn}
                  </p>
                  {isTa && selectedWork.descriptionEn && (
                    <p className="text-xs text-stone-600 italic">
                      "{selectedWork.descriptionEn}"
                    </p>
                  )}
                </div>

                {/* Canonical Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider block">
                      {isTa ? 'யாப்பு / கட்டமைப்பு' : 'Structure / Meter'}
                    </span>
                    <p className="font-tamil-sans font-medium text-stone-800 mt-0.5">{selectedWork.structure}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider block">
                      {isTa ? 'பாடல்கள் / அடிகள் எண்ணிக்கை' : 'Verse Count / Extent'}
                    </span>
                    <p className="font-mono font-medium text-stone-800 mt-0.5">
                      {selectedWork.verseCount || (isTa ? 'வரையறுக்கப்பட்டது' : 'Standard Edition')}
                    </p>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-stone-100 border border-stone-200">
                    <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider block">
                      {isTa ? 'மூலப்பதிப்பு & சான்றாதார நெறிமுறை' : 'Critical Edition & Source Canon'}
                    </span>
                    <p className="font-tamil-sans text-stone-700 mt-0.5">{selectedWork.canonicalSource}</p>
                  </div>
                </div>

                {/* Representative Verse action if in database */}
                {CLASSICAL_VERSES.some(v => v.workId === selectedWork.id) && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-amber-900 block">
                        {isTa ? 'மாதிரிச் செய்யுள் கிடைக்கிறது' : 'Sample Verse Available'}
                      </span>
                      <span className="text-[11px] text-amber-800">
                        {isTa ? 'இந்நூலின் தேர்ந்தெடுக்கப்பட்ட செய்யுளைப் பதம் பிரித்துப் பயிலுங்கள்.' : 'Inspect verse morphology, commentary, and recitation in Study Mode.'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const target = CLASSICAL_VERSES.find(v => v.workId === selectedWork.id);
                        if (target) {
                          onInspectVerse(target);
                          if (onJumpToStudy) onJumpToStudy(target);
                        }
                        setSelectedWork(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-medium flex items-center gap-1.5"
                    >
                      <span>{t.openStudy}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedWork(null)}
                    className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: HISTORICAL TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-8">
          <div className="max-w-3xl">
            <h2 className="font-tamil-serif font-bold text-xl text-stone-900 mb-1">
              {isTa ? 'செம்மொழித் தமிழ் காலவரிசை' : 'Chronological Classical Continuum'}
            </h2>
            <p className="text-xs text-stone-600 font-tamil-sans leading-relaxed">
              {isTa 
                ? 'கீழடி, பொருந்தல் தொல்லியல் காலக்கோடு மற்றும் உரோமானிய கடல்வழி வணிகத் தொடர்புகளோடு இணைந்த தமிழின் இலக்கிய வளர்ச்சிப் படிநிலைகள்.'
                : 'Archaeologically corroborated timeline anchored to Keeladi, Porunthal, and Mediterranean maritime trade networks.'}
            </p>
          </div>

          <div className="relative border-l-2 border-stone-300 pl-6 sm:pl-8 space-y-10">
            {TIMELINE_ERAS.map((era) => (
              <div key={era.eraKey} className="relative group">
                {/* Timeline node dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-stone-900 border-4 border-[#faf8f5]"></div>

                <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 hover:border-stone-400 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                    <div>
                      <span className="text-xs font-mono text-amber-700 block mb-0.5">
                        {isTa ? era.timeRangeTa : era.timeRangeEn}
                      </span>
                      <h3 className="font-tamil-serif font-bold text-lg text-stone-900">
                        {isTa ? era.titleTa : era.titleEn}
                      </h3>
                      <p className="font-mono text-xs text-stone-500">
                        {isTa ? era.titleEn : era.titleTa}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 self-start sm:self-center">
                      {isTa ? era.archaeologyTa : era.archaeologyEn}
                    </span>
                  </div>

                  <p className="font-tamil-sans text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {isTa ? era.descriptionTa : era.descriptionEn}
                  </p>

                  {/* Works in this era */}
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                      {isTa ? `இக்காலகட்டச் செம்மொழி நூல்கள் (${era.works.length}):` : `Canonical Works of This Era (${era.works.length}):`}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {era.works.map(workId => {
                        const work = CLASSICAL_WORKS.find(w => w.id === workId);
                        if (!work) return null;
                        return (
                          <button
                            key={work.id}
                            onClick={() => setSelectedWork(work)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-tamil-serif border border-stone-200 transition-colors"
                          >
                            {isTa ? work.titleTa : work.titleEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: CONCEPT ATLAS */}
      {activeTab === 'atlas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Concept Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
              {isTa ? 'தமிழர் முதன்மை விழுமியங்கள்' : 'Core Classical Concepts'}
            </span>
            <div className="space-y-1.5">
              {TAMIL_CONCEPTS.map(concept => {
                const isSelected = selectedConcept.id === concept.id;
                return (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-tamil-serif font-bold text-sm">
                        {isTa ? concept.nameTa : concept.nameEn}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {concept.transliteration}
                      </span>
                    </div>
                    <p className={`line-clamp-1 text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {isTa ? concept.nameEn : concept.nameTa}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Concept Deep Dive (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-stone-200 p-6 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-tamil-serif font-bold text-2xl text-stone-900">
                    {isTa ? selectedConcept.nameTa : selectedConcept.nameEn}
                  </h2>
                  <p className="text-xs font-mono text-stone-500 mt-0.5">
                    {isTa ? selectedConcept.nameEn : selectedConcept.nameTa} · ({selectedConcept.transliteration})
                  </p>
                </div>
                <button
                  onClick={() => onSelectConceptForSearch(selectedConcept.id)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono flex items-center gap-1.5 transition-colors border border-stone-200"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isTa ? 'ஆய்வுக்களத்தில் தேடுக' : 'Search in Research'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <p className="text-sm font-tamil-sans text-stone-800 leading-relaxed">
                  {isTa ? selectedConcept.definitionTa : selectedConcept.definitionEn}
                </p>
                {isTa && selectedConcept.definitionEn && (
                  <p className="text-xs text-stone-600 italic">
                    "{selectedConcept.definitionEn}"
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                  {isTa ? 'செவ்வியல் சொல்வளம்' : 'Classical Vocabulary Cluster'}
                </span>
                <div className="flex flex-wrap gap-1.5">
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
                  {isTa ? 'பண்பாட்டு வரலாற்று முதன்மை' : 'Philosophical & Cultural Significance'}
                </span>
                <p className="text-xs font-tamil-sans text-stone-700 leading-relaxed">
                  {selectedConcept.culturalSignificanceTa}
                </p>
              </div>
            </div>

            {/* Evidence Verses for this Concept */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                {isTa ? 'மூலப் பாடல் சான்றுகள்' : 'Primary Textual Evidence from Canon'}
              </h3>

              {conceptVerses.map(verse => (
                <div key={verse.id} className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-tamil-serif font-bold text-stone-900 text-sm">
                        {isTa ? verse.workTitleTa : verse.workTitleEn}
                      </span>
                      <span className="text-stone-400 text-xs mx-1.5">·</span>
                      <span className="text-xs text-stone-600 font-mono">
                        {verse.chapterTa ? `${isTa ? verse.chapterTa : verse.chapterEn} (${verse.verseNumber})` : `#${verse.verseNumber}`}
                      </span>
                    </div>

                    <button
                      onClick={() => onInspectVerse(verse)}
                      className="text-xs text-stone-700 hover:text-stone-950 flex items-center gap-1 font-mono font-medium"
                    >
                      <span>{isTa ? 'சான்று & உரை' : 'Evidence & Commentary'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pl-3 border-l-2 border-stone-800 font-tamil-serif text-sm font-medium text-stone-900 space-y-0.5">
                    {verse.linesTa.map((l, idx) => (
                      <p key={idx}>{l}</p>
                    ))}
                  </div>

                  {verse.commentaries[0] && (
                    <p className="text-xs text-stone-600 font-tamil-sans bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="font-semibold text-stone-800">
                        {isTa ? `${verse.commentaries[0].scholarTa} உரை: ` : `${verse.commentaries[0].scholarEn} Commentary: `}
                      </span>
                      {verse.commentaries[0].textTa}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: RELATIONAL KNOWLEDGE GRAPH */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
              <div>
                <h3 className="font-classical-display font-bold text-lg text-stone-900">
                  {isTa ? 'அறிவுப் பின்னல்' : 'Relational Knowledge Graph'}
                </h3>
                <p className="text-xs font-tamil-sans text-stone-500">
                  {isTa ? 'நூல்கள், புலவர்கள், விழுமியங்கள் மற்றும் உரைமரபுகளுக்கு இடையிலான பிணைப்புகளை ஆராயுங்கள்.' : 'Explore multi-dimensional links between classical works, poets, moral virtues, and commentators.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-stone-900 text-stone-100">{isTa ? 'நூல்கள்' : 'Works'}</span>
                <span className="px-2 py-0.5 rounded bg-amber-800 text-stone-100">{isTa ? 'விழுமியங்கள்' : 'Concepts'}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-800 text-stone-100">{isTa ? 'புலவர்கள்' : 'Poets'}</span>
              </div>
            </div>

            {/* Nodes Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {KNOWLEDGE_GRAPH_NODES.map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedGraphNode(node)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    selectedGraphNode.id === node.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-[10px] font-mono text-stone-400 block uppercase">{node.type}</span>
                  <span className="font-tamil-serif font-semibold truncate block mt-0.5">
                    {isTa ? node.labelTa : node.labelEn}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Node Connection Details */}
            {selectedGraphNode && (
              <div className="mt-4 p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                      {isTa ? 'தேர்ந்தெடுக்கப்பட்ட முனை' : 'Selected Canon Node'}
                    </span>
                    <h4 className="font-tamil-serif font-bold text-xl text-stone-900 mt-0.5">
                      {isTa ? selectedGraphNode.labelTa : selectedGraphNode.labelEn} ({isTa ? selectedGraphNode.labelEn : selectedGraphNode.labelTa})
                    </h4>
                    <p className="text-xs font-tamil-sans text-stone-600 mt-1">
                      {isTa ? selectedGraphNode.descriptionTa : selectedGraphNode.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Connected Edges */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                    {isTa ? 'தொடர்புடைய இணைப்புகள்' : 'Correlated Canon Edges'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {KNOWLEDGE_GRAPH_EDGES.filter(e => e.source === selectedGraphNode.id || e.target === selectedGraphNode.id).map((edge, idx) => {
                      const otherId = edge.source === selectedGraphNode.id ? edge.target : edge.source;
                      const otherNode = KNOWLEDGE_GRAPH_NODES.find(n => n.id === otherId);
                      return (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-stone-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-stone-400 block">
                              {isTa ? edge.relationshipTa : edge.relationshipEn}
                            </span>
                            <span className="font-tamil-serif font-medium text-stone-800">
                              {otherNode ? (isTa ? otherNode.labelTa : otherNode.labelEn) : otherId}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            {isTa ? edge.relationshipTa : edge.relationshipEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: LEXICON */}
      {activeTab === 'lexicon' && (
        <div className="space-y-6">
          <div className="max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lexiconQuery}
                onChange={(e) => setLexiconQuery(e.target.value)}
                placeholder={isTa ? 'செவ்வியல் சொல், வேர், பொருள் கொண்டு தேடுக...' : 'Search classical words, roots, meanings...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-stone-900 font-tamil-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocab.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-tamil-serif font-bold text-base text-stone-900">
                    {item.vocab.word}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    {item.vocab.pos}
                  </span>
                </div>
                <p className="font-mono text-xs text-stone-500">{item.vocab.transliteration}</p>
                <div className="text-xs font-tamil-sans text-stone-700 space-y-1 pt-1 border-t border-stone-100">
                  <p>
                    <span className="font-medium text-stone-900">{isTa ? 'செவ்வியல் பொருள்:' : 'Classical Meaning:'} </span> 
                    {item.vocab.classicalMeaningTa}
                  </p>
                  <p>
                    <span className="font-medium text-stone-900">{isTa ? 'தற்காலப் பொருள்:' : 'Modern Equivalent:'} </span> 
                    {item.vocab.modernTamilMeaning}
                  </p>
                  <p className="italic text-stone-600">{item.vocab.englishMeaning}</p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                  <span>{isTa ? 'வேர்ச்சொல்' : 'Root'}: {item.vocab.rootWord}</span>
                  <button
                    onClick={() => onInspectVerse(item.verse)}
                    className="text-stone-700 hover:text-stone-950 underline"
                  >
                    {isTa ? 'செய்யுள் காண்க' : 'View Verse'}
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
