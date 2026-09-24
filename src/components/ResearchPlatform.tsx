import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Layers, Bookmark, Download, Copy, Check, ShieldCheck, Sparkles, ArrowRight, GitCompare, FileCode, StickyNote, Plus, Camera, Languages } from 'lucide-react';
import { ClassicalVerse, ClassicalWork, ResearchNote, ResearchSynthesis, TextualVariant } from '../types/index.ts';
import { CLASSICAL_VERSES, CLASSICAL_WORKS, TAMIL_CONCEPTS, TEXTUAL_VARIANTS } from '../data/classicalCorpus.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { processSmartInput } from '../services/tanglishConverter.ts';

interface ResearchPlatformProps {
  onInspectVerse: (verse: ClassicalVerse) => void;
  savedVerses: ClassicalVerse[];
  onToggleSaveVerse: (verse: ClassicalVerse) => void;
  language: Language;
  onOpenScanner?: () => void;
}

export const ResearchPlatform: React.FC<ResearchPlatformProps> = ({
  onInspectVerse,
  savedVerses,
  onToggleSaveVerse,
  language,
  onOpenScanner
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'search' | 'variants' | 'synthesizer' | 'compare' | 'notes' | 'collection'>('search');
  const [translateEn, setTranslateEn] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('விருந்தோம்பல்');
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const [selectedConceptId, setSelectedConceptId] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Inquiry Synthesizer State
  const [inquiryText, setInquiryText] = useState('சங்க இலக்கியங்களில் விருந்தோம்பல் மரபு எங்ஙனம் பதிவாகியுள்ளது?');
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesis, setSynthesis] = useState<ResearchSynthesis | null>(null);

  // Comparison State
  const [compareVerseId, setCompareVerseId] = useState<string>(CLASSICAL_VERSES[0].id);

  // Textual Variants State
  const [variantsList, setVariantsList] = useState<TextualVariant[]>(TEXTUAL_VARIANTS);

  // Research Notes State
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('ஆராய்ச்சி, குறிப்பு');
  const [savingNote, setSavingNote] = useState(false);

  // Export State
  const [exportFormat, setExportFormat] = useState<'BIBTEX' | 'APA' | 'CHICAGO'>('BIBTEX');
  const [copied, setCopied] = useState(false);

  // Load Notes & Variants
  useEffect(() => {
    fetch('/api/research/notes')
      .then(res => res.json())
      .then(d => { if (d.notes) setNotes(d.notes); })
      .catch(e => console.warn(e));

    fetch('/api/research/variants')
      .then(res => res.json())
      .then(d => { if (d.variants) setVariantsList(d.variants); })
      .catch(e => console.warn(e));

    handleSearch('விருந்தோம்பல்');
  }, []);

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          workId: selectedWorkId || undefined,
          conceptId: selectedConceptId || undefined
        })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSynthesize = async () => {
    if (!inquiryText.trim()) return;
    setSynthesizing(true);
    try {
      const res = await fetch('/api/research/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inquiryText })
      });
      const data = await res.json();
      setSynthesis(data.synthesis || null);
    } catch (err) {
      console.error('Synthesis error:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/research/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoteTitle,
          noteText: newNoteText,
          tags: newNoteTags.split(',').map(s => s.trim()).filter(Boolean),
          verseId: compareVerseId
        })
      });
      const data = await res.json();
      if (data.note) {
        setNotes([data.note, ...notes]);
        setNewNoteTitle('');
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (type: 'bib' | 'md' | 'json') => {
    let content = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `yaazh-research-dossier-${timestamp}.${type}`;
    let mimeType = 'text/plain';

    if (type === 'bib') {
      const citations = savedVerses.map((v, i) => 
        `@incollection{yaazh_${i + 1},\n  title = {${v.chapterTa || `Verse ${v.verseNumber}`}},\n  booktitle = {${v.workTitleTa}},\n  author = {${v.poetTa}},\n  publisher = {${v.canonicalSource}}\n}`
      );
      content = citations.join('\n\n');
      mimeType = 'application/x-bibtex';
    } else if (type === 'json') {
      content = JSON.stringify({
        title: 'YAAZH AI Classical Tamil Research Dossier',
        exportedAt: new Date().toISOString(),
        collectedVerses: savedVerses,
        notes: notes
      }, null, 2);
      mimeType = 'application/json';
    } else if (type === 'md') {
      content = `# YAAZH AI Classical Tamil Research Dossier\n\nExported: ${new Date().toLocaleString()}\n\n## Collected Verses (${savedVerses.length})\n\n` +
        savedVerses.map(v => 
          `### ${v.workTitleTa} (${v.workTitleEn}) - ${v.chapterTa || `#${v.verseNumber}`}\n` +
          `**Poet/Author**: ${v.poetTa} (${v.poetEn})\n\n` +
          `> ${v.linesTa.join('\n> ')}\n\n` +
          `**Canonical Edition**: ${v.canonicalSource}\n\n` +
          `**Core Concepts**: ${v.coreConcepts.join(', ')}\n\n` +
          (v.commentaries[0] ? `*Commentary (${v.commentaries[0].scholarTa})*: ${v.commentaries[0].textTa}\n\n` : '')
        ).join('---\n\n') +
        `\n## Research Notes (${notes.length})\n\n` +
        notes.map(n => `### ${n.title}\n*Tags: ${n.tags.join(', ')}*\n\n${n.noteText}\n`).join('\n---\n\n');
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentCompareVerse = CLASSICAL_VERSES.find(v => v.id === compareVerseId) || CLASSICAL_VERSES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-900" />
            <h1 className="text-xl font-classical-display font-bold text-stone-900 tracking-wide">
              {t.researchWorkspace}
            </h1>
          </div>
          <p className="text-xs text-stone-600 font-tamil-sans">
            {t.researchSubtitle}
          </p>
        </div>

        {/* Tab Switcher & Action Tools */}
        <div className="mt-3 md:mt-0 flex flex-wrap items-center gap-2">
          {/* Real-time Camera & Manuscript Scanner */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-100 font-mono text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Scan Palm-Leaf Manuscripts or Printed Editions"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ta' ? 'ஏட்டுச்சுவடி ஸ்கேனர்' : 'Manuscript Scanner'}</span>
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
            title="Toggle English Translation for Results & Citations"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{translateEn ? (language === 'ta' ? 'தமிழ் வடிவம்' : 'Tamil Script') : (language === 'ta' ? 'ஆங்கில உரை' : 'English Trans.')}</span>
          </button>

          <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-lg border border-stone-300/40 text-xs">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabSearch}
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'variants'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabVariants}
            </button>
            <button
              onClick={() => setActiveTab('synthesizer')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'synthesizer'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabSynthesizer}
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'compare'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {t.tabCompare}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                activeTab === 'notes'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'குறிப்புகள்' : 'Notes'} ({notes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                activeTab === 'collection'
                  ? 'bg-stone-900 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t.tabCollection} ({savedVerses.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: FACETED CORPUS SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={
                    language === 'ta'
                      ? 'தமிழ், Tanglish (எ.கா: yaathum oore), அல்லது ஆங்கிலத்தில் தேடவும்...'
                      : 'Search in Tamil, Tanglish (e.g. yaathum oore), or English...'
                  }
                  className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-tamil-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900 focus:bg-white"
                />
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={searching}
                className="px-6 py-3 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono font-medium hover:bg-stone-800 transition-colors shrink-0 shadow-xs flex items-center justify-center gap-2"
              >
                {searching ? (
                  <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{t.searchButton}</span>
              </button>
            </div>

            {/* Tanglish / Smart Input Detection for Search */}
            {(() => {
              const smart = processSmartInput(searchQuery);
              if (smart.isTanglishOrEnglish) {
                return (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-amber-900 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold uppercase text-[10px]">{smart.detectedLanguage}:</span>
                      <span className="truncate">{smart.explanation} ➔ <strong>{smart.tamilQuery}</strong></span>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery(smart.tamilQuery);
                        handleSearch(smart.tamilQuery);
                      }}
                      className="shrink-0 ml-2 px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-mono text-[11px] font-bold"
                    >
                      {language === 'ta' ? 'தேடு' : 'Search'}
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">
                  {t.filterByWork}:
                </label>
                <select
                  value={selectedWorkId}
                  onChange={(e) => setSelectedWorkId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 font-tamil-sans"
                >
                  <option value="">{language === 'ta' ? 'அனைத்து செவ்வியல் நூல்கள்' : 'All Classical Works'}</option>
                  {CLASSICAL_WORKS.map(w => (
                    <option key={w.id} value={w.id}>
                      {language === 'ta' ? w.titleTa : w.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">
                  {t.filterByConcept}:
                </label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 font-tamil-sans"
                >
                  <option value="">{language === 'ta' ? 'அனைத்து விழுமியங்கள்' : 'All Concepts'}</option>
                  {TAMIL_CONCEPTS.map(c => (
                    <option key={c.id} value={c.id}>
                      {language === 'ta' ? c.nameTa : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedWorkId('');
                    setSelectedConceptId('');
                    handleSearch(searchQuery);
                  }}
                  className="w-full p-2 rounded border border-stone-200 hover:bg-stone-100 text-xs text-stone-600 font-mono"
                >
                  {t.resetFilters}
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>{t.retrievedCount}: {searchResults.length}</span>
              <span>{language === 'ta' ? 'பொருத்த நிலை' : 'Relevance Score'}</span>
            </div>

            {searchResults.map((item, idx) => {
              const isSaved = savedVerses.some(v => v.id === item.verse.id);

              return (
                <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-tamil-serif font-bold text-stone-900 text-base">
                          {language === 'ta' ? item.verse.workTitleTa : item.verse.workTitleEn}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-xs text-stone-600 font-mono">
                          {item.verse.chapterTa ? `${language === 'ta' ? item.verse.chapterTa : item.verse.chapterEn} (${item.verse.verseNumber})` : `#${item.verse.verseNumber}`}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {item.matchType}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-tamil-sans">
                        {language === 'ta' ? 'புலவர்' : 'Poet'}: {language === 'ta' ? item.verse.poetTa : item.verse.poetEn} · {language === 'ta' ? 'யாப்பு' : 'Meter'}: {item.verse.meterTa}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleSaveVerse(item.verse)}
                        className={`p-1.5 rounded transition-colors ${
                          isSaved ? 'text-stone-900 bg-stone-200' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                        }`}
                        title={isSaved ? (language === 'ta' ? 'சேகரிப்பில் உள்ளது' : 'In Collection') : (language === 'ta' ? 'சேகரிப்பில் சேர்க்க' : 'Add to Collection')}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() => onInspectVerse(item.verse)}
                        className="px-3 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono flex items-center gap-1"
                      >
                        <span>{t.viewFullEvidence}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="pl-3 border-l-2 border-stone-800 font-tamil-serif text-sm font-semibold text-stone-900 space-y-0.5">
                    {item.verse.linesTa.map((line: string, lIdx: number) => (
                      <p key={lIdx}>{line}</p>
                    ))}
                  </div>

                  {item.verse.commentaries[0] && (
                    <div className="text-xs text-stone-700 font-tamil-sans bg-stone-50 p-3 rounded-lg border border-stone-100">
                      <span className="font-semibold text-stone-900">
                        {language === 'ta' ? `${item.verse.commentaries[0].scholarTa} உரை: ` : `${item.verse.commentaries[0].scholarEn} Commentary: `}
                      </span>
                      {language === 'ta' ? item.verse.commentaries[0].textTa : (item.verse.commentaries[0].textEn || item.verse.commentaries[0].textTa)}
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{item.verse.canonicalSource}</span>
                    <span className="text-emerald-700 font-medium">{language === 'ta' ? 'பொருத்தம்' : 'Match'}: {Math.round(item.score * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TEXTUAL VARIANTS (பாடபேதங்கள்) */}
      {activeTab === 'variants' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-2">
            <h2 className="font-tamil-serif font-bold text-lg text-stone-900">
              {t.textualVariantsTitle}
            </h2>
            <p className="text-xs text-stone-600 font-tamil-sans">
              {t.textualVariantsDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {variantsList.map(variant => (
              <div key={variant.id} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-tamil-serif font-bold text-base text-stone-900">
                      {language === 'ta' ? variant.workTitleTa : variant.workTitleEn} · {variant.verseRef}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200">
                    {language === 'ta' ? 'பாடபேத ஆய்வு' : 'CRITICAL APPARATUS'}
                  </span>
                </div>

                {/* Comparative reading columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-950/5 border border-emerald-900/20 space-y-2">
                    <span className="text-[11px] font-mono text-emerald-800 uppercase tracking-wider font-semibold block">
                      {language === 'ta' ? 'ஏற்றுக்கொள்ளப்பட்ட மூலப் பாடம்:' : 'Critical Reading (Base):'}
                    </span>
                    <p className="font-tamil-serif font-bold text-base text-emerald-950">
                      "{variant.baseReadingTa}"
                    </p>
                    <p className="text-[11px] font-mono text-emerald-800">
                      {language === 'ta' ? 'பதிப்பு ஆதாரம்' : 'Edition Source'}: {variant.printedEdition}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-950/5 border border-amber-900/20 space-y-2">
                    <span className="text-[11px] font-mono text-amber-800 uppercase tracking-wider font-semibold block">
                      {language === 'ta' ? 'ஓலைச்சுவடிப் பாடபேதம்:' : 'Manuscript Variant:'}
                    </span>
                    <p className="font-tamil-serif font-bold text-base text-amber-950">
                      "{variant.variantReadingTa}"
                    </p>
                    <p className="text-[11px] font-mono text-amber-800">
                      {language === 'ta' ? 'சுவடி ஆதாரம்' : 'Manuscript Source'}: {variant.sourceManuscript}
                    </p>
                  </div>
                </div>

                {/* Philological Analysis */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block">
                    {language === 'ta' ? 'பதிப்பு வரலாற்று நுட்பம்:' : 'Philological Justification:'}
                  </span>
                  <p className="text-xs font-tamil-sans text-stone-800 leading-relaxed">
                    {language === 'ta' ? variant.criticalAnalysisTa : (variant.criticalAnalysisEn || variant.criticalAnalysisTa)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INQUIRY SYNTHESIZER */}
      {activeTab === 'synthesizer' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
              {t.inquiryTitle}
            </h3>
            <p className="text-xs text-stone-600 font-tamil-sans">
              {t.inquiryDesc}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder={t.inquiryPlaceholder}
                className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-tamil-serif text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
              />
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="px-6 py-3 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono font-medium hover:bg-stone-800 transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {synthesizing ? (
                  <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{t.synthesizeButton}</span>
              </button>
            </div>
          </div>

          {synthesis && (
            <div className="space-y-6">
              <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span className="font-mono text-xs font-bold text-stone-900">
                    {language === 'ta' ? 'செம்மொழிச் சான்றாதாரத் தரம்:' : 'EVIDENCE TRUST SUMMARY:'} {synthesis.trustSummary.overallStatus}
                  </span>
                </div>
                <div className="text-xs font-mono text-stone-600">
                  {synthesis.trustSummary.verifiedCorpusPassages} {language === 'ta' ? 'சான்றுப் பாடல்கள்' : 'verified verses'} · {synthesis.trustSummary.commentaryCount} {language === 'ta' ? 'செவ்வியல் உரைகள்' : 'commentaries'}
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                  {t.academicSynthesis}
                </h4>
                <div className="text-sm font-tamil-sans text-stone-800 leading-relaxed space-y-2">
                  <p>{synthesis.academicSynthesisTa}</p>
                </div>
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-700 leading-relaxed italic">
                    {synthesis.academicSynthesisEn}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                  {t.evidenceBySource}
                </h4>

                {synthesis.groupedEvidence.map((group, gIdx) => (
                  <div key={gIdx} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <h5 className="font-tamil-serif font-bold text-base text-stone-900">
                        {language === 'ta' ? group.workTitleTa : group.workTitleEn}
                      </h5>
                      <span className="text-[11px] font-mono text-stone-500">
                        {group.period}
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {group.evidenceItems.map(ev => (
                        <div key={ev.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-stone-600">
                              {ev.citation.chapterOrPoem} ({language === 'ta' ? 'புலவர்' : 'Poet'}: {ev.poetTa})
                            </span>
                            <span className="text-[11px] font-mono text-emerald-700">
                              {ev.relevanceReason}
                            </span>
                          </div>
                          <div className="pl-3 border-l-2 border-stone-800 font-tamil-serif text-xs font-medium text-stone-900">
                            {ev.linesTa.map((l, li) => (
                              <p key={li}>{l}</p>
                            ))}
                          </div>
                          <p className="text-xs font-tamil-sans text-stone-600 italic">
                            {ev.explanationTa}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPARATIVE MATRIX */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                {t.comparativeMatrix}
              </h3>
              <p className="text-xs text-stone-600 font-tamil-sans">
                {t.comparativeDesc}
              </p>
            </div>

            <select
              value={compareVerseId}
              onChange={(e) => setCompareVerseId(e.target.value)}
              className="p-2.5 bg-stone-50 border border-stone-200 rounded text-xs font-tamil-sans text-stone-800"
            >
              {CLASSICAL_VERSES.map(v => (
                <option key={v.id} value={v.id}>
                  {v.workTitleTa}: {v.chapterTa || `பாடல் ${v.verseNumber}`}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-stone-900 text-stone-100 p-6 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              {currentCompareVerse.workTitleTa} · {currentCompareVerse.chapterTa || currentCompareVerse.verseNumber}
            </span>
            <div className="font-tamil-serif text-lg font-semibold space-y-1">
              {currentCompareVerse.linesTa.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
            <p className="text-xs font-mono text-stone-400 italic">
              {currentCompareVerse.transliteration}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentCompareVerse.commentaries.map(comm => (
              <div key={comm.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                  <span className="font-tamil-serif font-bold text-stone-900 text-sm">
                    {language === 'ta' ? comm.scholarTa : comm.scholarEn}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">
                    {comm.period}
                  </span>
                </div>
                <p className="text-xs font-tamil-sans text-stone-800 leading-relaxed">
                  {comm.textTa}
                </p>
                {comm.analysisTa && (
                  <p className="text-[11px] font-tamil-sans text-stone-600 bg-stone-50 p-2.5 rounded">
                    {language === 'ta' ? 'நுட்பக்குறிப்பு' : 'Scholarly Note'}: {comm.analysisTa}
                  </p>
                )}
                <div className="text-[10px] font-mono text-stone-400 pt-2 border-t border-stone-100">
                  {language === 'ta' ? 'பதிப்பு' : 'Edition'}: {comm.sourceEdition}
                </div>
              </div>
            ))}
          </div>

          {currentCompareVerse.translations.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                {language === 'ta' ? 'ஆங்கில மொழிபெயர்ப்புகள் ஒப்பீடு' : 'Comparative English Translations'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCompareVerse.translations.map(tr => (
                  <div key={tr.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-stone-600">
                      <span>{tr.translator}</span>
                      <span>{tr.year}</span>
                    </div>
                    <p className="text-xs text-stone-800 italic leading-relaxed">
                      "{tr.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RESEARCH NOTES & FIELD BOOK */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Note Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h3 className="font-tamil-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-stone-700" />
                <span>{language === 'ta' ? 'புதிய ஆராய்ச்சிக் குறிப்பு' : 'Add Research Note'}</span>
              </h3>

              <form onSubmit={handleCreateNote} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-stone-500 mb-1">
                    {language === 'ta' ? 'குறிப்புத் தலைப்பு:' : 'Note Title:'}
                  </label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder={language === 'ta' ? 'எ.கா. சிலப்பதிகாரத்தில் அரசியல் அறம்...' : 'e.g. Political ethics in Silappadikaram...'}
                    className="w-full text-xs font-tamil-sans p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-500 mb-1">
                    {language === 'ta' ? 'ஆராய்ச்சிக் குறிப்பு உரை:' : 'Scholarly Observations:'}
                  </label>
                  <textarea
                    rows={4}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={language === 'ta' ? 'உங்கள் கருத்துக்கள், சொல்லாய்வு மற்றும் சான்றுகளின் தொடர்பு...' : 'Your scholarly notes, philological breakdown, evidence links...'}
                    className="w-full text-xs font-tamil-sans p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-900 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-500 mb-1">
                    {language === 'ta' ? 'குறிச்சொற்கள்:' : 'Tags (comma separated):'}
                  </label>
                  <input
                    type="text"
                    value={newNoteTags}
                    onChange={(e) => setNewNoteTags(e.target.value)}
                    className="w-full text-xs font-tamil-sans p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingNote}
                  className="w-full py-2.5 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono font-medium hover:bg-stone-800 transition-colors"
                >
                  {savingNote ? (language === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (language === 'ta' ? 'குறிப்பைச் சேமி' : 'Save Note')}
                </button>
              </form>
            </div>
          </div>

          {/* Notes Feed (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
              {language === 'ta' ? 'பதிவு செய்யப்பட்ட ஆராய்ச்சிக் குறிப்புகள்' : 'Saved Research Notes'} ({notes.length})
            </h3>

            {notes.map(note => (
              <div key={note.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h4 className="font-tamil-serif font-bold text-base text-stone-900">
                    {note.title}
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs font-tamil-sans text-stone-800 leading-relaxed">
                  {note.noteText}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {note.tags.map((tag, ti) => (
                    <span key={ti} className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CITATION EXPORTS & COLLECTION */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                {t.savedCollection}
              </h3>
              <p className="text-xs text-stone-600 font-tamil-sans">
                {language === 'ta' ? `மொத்தம் ${savedVerses.length} பாடல்கள் சேகரிக்கப்பட்டுள்ளன.` : `Total ${savedVerses.length} verses in collection.`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-stone-200 bg-stone-50 p-1">
                {(['BIBTEX', 'APA', 'CHICAGO'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                      exportFormat === fmt ? 'bg-stone-900 text-stone-100' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const citations = savedVerses.map(v => ({
                    workTitle: v.workTitleTa,
                    chapterOrPoem: v.chapterTa || `பாடல் ${v.verseNumber}`,
                    authorOrPoet: v.poetTa,
                    edition: v.canonicalSource,
                    trustStatus: 'VERIFIED' as const,
                    primaryTextSnippet: v.fullTextTa
                  }));
                  const text = exportFormat === 'BIBTEX'
                    ? citations.map((c, i) => `@incollection{yaazh_${i + 1},\n  title = {${c.chapterOrPoem}},\n  booktitle = {${c.workTitle}},\n  author = {${c.authorOrPoet}},\n  publisher = {${c.edition}}\n}`).join('\n\n')
                    : citations.map(c => `${c.authorOrPoet}. "${c.chapterOrPoem}." In ${c.workTitle}. ${c.edition}.`).join('\n\n');
                  handleCopyCitation(text);
                }}
                className="px-3 py-1.5 bg-stone-900 text-stone-100 text-xs font-mono rounded flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
                title="Copy Citations to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyCitation}</span>
              </button>

              {/* Direct File Download Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownloadFile('md')}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono rounded border border-stone-300 flex items-center gap-1 transition-colors"
                  title="Export Dossier as Markdown (.md)"
                >
                  <Download className="w-3 h-3 text-stone-600" />
                  <span>.MD</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('bib')}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono rounded border border-stone-300 flex items-center gap-1 transition-colors"
                  title="Export Citations as BibTeX (.bib)"
                >
                  <Download className="w-3 h-3 text-stone-600" />
                  <span>.BIB</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('json')}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono rounded border border-stone-300 flex items-center gap-1 transition-colors"
                  title="Export Research Data as JSON (.json)"
                >
                  <Download className="w-3 h-3 text-stone-600" />
                  <span>.JSON</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {savedVerses.map(verse => (
              <div key={verse.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-tamil-serif font-bold text-stone-900 text-base">
                      {language === 'ta' ? verse.workTitleTa : verse.workTitleEn}
                    </span>
                    <span className="text-stone-300 mx-2">·</span>
                    <span className="text-xs text-stone-600 font-mono">
                      {verse.chapterTa || `#${verse.verseNumber}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInspectVerse(verse)}
                      className="text-xs text-stone-700 hover:text-stone-950 font-mono"
                    >
                      {t.viewFullEvidence}
                    </button>
                    <button
                      onClick={() => onToggleSaveVerse(verse)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-mono"
                    >
                      {language === 'ta' ? 'நீக்கு' : 'Remove'}
                    </button>
                  </div>
                </div>

                <div className="pl-3 border-l-2 border-stone-800 font-tamil-serif text-sm font-semibold text-stone-900">
                  {verse.linesTa.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-stone-400 pt-2 border-t border-stone-100">
                  {verse.canonicalSource}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
