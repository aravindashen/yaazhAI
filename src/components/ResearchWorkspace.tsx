import React, { useState } from 'react';
import { Search, Filter, BookOpen, Layers, Bookmark, Download, Copy, Check, ShieldCheck, Sparkles, ArrowRight, GitCompare } from 'lucide-react';
import { ClassicalVerse, ClassicalWork, EvidenceSnippet, ResearchSynthesis, SourceCitation } from '../types/index.ts';
import { CLASSICAL_VERSES, CLASSICAL_WORKS, TAMIL_CONCEPTS } from '../data/classicalCorpus.ts';

interface ResearchWorkspaceProps {
  onInspectVerse: (verse: ClassicalVerse) => void;
  savedVerses: ClassicalVerse[];
  onToggleSaveVerse: (verse: ClassicalVerse) => void;
  initialConceptFilter?: string;
}

export const ResearchWorkspace: React.FC<ResearchWorkspaceProps> = ({
  onInspectVerse,
  savedVerses,
  onToggleSaveVerse,
  initialConceptFilter
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'synthesizer' | 'compare' | 'collection'>('search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('விருந்தோம்பல்');
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const [selectedConceptId, setSelectedConceptId] = useState<string>(initialConceptFilter || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Inquiry Synthesizer State
  const [inquiryText, setInquiryText] = useState('சங்க இலக்கியங்களில் விருந்தோம்பல் மரபு எங்ஙனம் பதிவாகியுள்ளது?');
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesis, setSynthesis] = useState<ResearchSynthesis | null>(null);

  // Comparison State
  const [compareVerseId, setCompareVerseId] = useState<string>(CLASSICAL_VERSES[0].id);

  // Export State
  const [exportFormat, setExportFormat] = useState<'BIBTEX' | 'APA' | 'CHICAGO'>('BIBTEX');
  const [copied, setCopied] = useState(false);

  // Execute Search
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

  // Execute Inquiry Synthesizer
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

  // Copy Citations to clipboard
  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    handleSearch('விருந்தோம்பல்');
  }, []);

  const currentCompareVerse = CLASSICAL_VERSES.find(v => v.id === compareVerseId) || CLASSICAL_VERSES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-classical-display font-bold text-stone-900 tracking-wide">
            RESEARCH WORKSPACE · செம்மொழி ஆய்வுக் களம்
          </h1>
          <p className="text-xs text-stone-600 font-tamil-sans mt-0.5">
            கலப்புத் தேடல் (Hybrid Search) · சான்று திரட்டல் · மூல உரைகள் ஒப்பாய்வு · ஆய்வுத் தொகுப்பு
          </p>
        </div>

        {/* Workspace Tab Nav */}
        <div className="mt-3 md:mt-0 flex items-center gap-1 bg-stone-200/60 p-1 rounded-lg border border-stone-300/40">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
            }`}
          >
            கலப்புத் தேடல் (Search)
          </button>

          <button
            onClick={() => setActiveTab('synthesizer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'synthesizer'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
            }`}
          >
            ஆய்வுக் கேள்வி (Synthesis)
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'compare'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
            }`}
          >
            உரைகள் ஒப்பாய்வு (Compare)
          </button>

          <button
            onClick={() => setActiveTab('collection')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'collection'
                ? 'bg-stone-900 text-stone-100 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>சேகரிப்பு & மேற்கோள் ({savedVerses.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FACETED HYBRID CORPUS SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="சொல், வரி, யாப்பு அல்லது விழுமியத்தைத் தேடுக (e.g. விருந்து, யாதும் ஊரே, அன்பு, அறம்)..."
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
                <span>சான்று தேடுக (Search)</span>
              </button>
            </div>

            {/* Faceted Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">
                  நூல் தெரிவு (Filter by Work):
                </label>
                <select
                  value={selectedWorkId}
                  onChange={(e) => setSelectedWorkId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 font-tamil-sans"
                >
                  <option value="">அனைத்து செவ்வியல் நூல்கள் (All Works)</option>
                  {CLASSICAL_WORKS.map(w => (
                    <option key={w.id} value={w.id}>{w.titleTa} ({w.titleEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 mb-1">
                  கருத்தியல் / விழுமியம் (Concept Tag):
                </label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 font-tamil-sans"
                >
                  <option value="">அனைத்து விழுமியங்கள் (All Concepts)</option>
                  {TAMIL_CONCEPTS.map(c => (
                    <option key={c.id} value={c.id}>{c.nameTa} ({c.nameEn})</option>
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
                  வடிகட்டிகளை மீட்டமை (Reset Filters)
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>கண்டறியப்பட்ட சான்றுகள் (Retrieved Passages): {searchResults.length}</span>
              <span>வரிசை: சான்று பொருத்தம் (Relevance Ranking)</span>
            </div>

            {searchResults.map((item, idx) => {
              const isSaved = savedVerses.some(v => v.id === item.verse.id);

              return (
                <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 hover:border-stone-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-tamil-serif font-bold text-stone-900 text-base">
                          {item.verse.workTitleTa}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-xs text-stone-600 font-mono">
                          {item.verse.chapterTa ? `${item.verse.chapterTa} (${item.verse.verseNumber})` : `பாடல் ${item.verse.verseNumber}`}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {item.matchType}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-tamil-sans">
                        புலவர்: {item.verse.poetTa} ({item.verse.poetEn}) · யாப்பு: {item.verse.meterTa}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleSaveVerse(item.verse)}
                        className={`p-1.5 rounded transition-colors ${
                          isSaved
                            ? 'text-stone-900 bg-stone-200'
                            : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                        }`}
                        title={isSaved ? 'சேகரிப்பில் உள்ளது' : 'சேகரிப்பில் சேர்க்க'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        onClick={() => onInspectVerse(item.verse)}
                        className="px-3 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono flex items-center gap-1"
                      >
                        <span>சான்று காண்க</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Text Lines */}
                  <div className="pl-3 border-l-2 border-stone-800 font-tamil-serif text-sm font-semibold text-stone-900 space-y-0.5">
                    {item.verse.linesTa.map((line: string, lIdx: number) => (
                      <p key={lIdx}>{line}</p>
                    ))}
                  </div>

                  {/* Commentary Highlight */}
                  {item.verse.commentaries[0] && (
                    <div className="text-xs text-stone-700 font-tamil-sans bg-stone-50 p-3 rounded-lg border border-stone-100">
                      <span className="font-semibold text-stone-900">{item.verse.commentaries[0].scholarTa} உரை: </span>
                      {item.verse.commentaries[0].textTa}
                    </div>
                  )}

                  {/* Citation Footer */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>பதிப்பு: {item.verse.canonicalSource}</span>
                    <span className="text-emerald-700 font-medium">பொருத்தம்: {Math.round(item.score * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RESEARCH INQUIRY SYNTHESIZER */}
      {activeTab === 'synthesizer' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
              ஆய்வுக் கேள்வி தொகுப்பாளர் (Research Inquiry & Evidence Grouping)
            </h3>
            <p className="text-xs text-stone-600 font-tamil-sans">
              நீங்கள் ஆராய விரும்பும் தலைப்பு அல்லது வினாவை உள்ளிடுங்கள். YAAZH AI அமைப்பு, பல நூல்களிலிருந்து சான்றுகளைத் திரட்டி, ஒப்பாய்வு செய்து, முறையான மேற்கோள்களோடு தொகுத்துத் தரும்.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="எ.கா. சங்க இலக்கியத்தில் விருந்தோம்பல் மரபின் கூறுகள் எவை?"
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
                <span>சான்றுகளுடன் தொகுக்க (Synthesize)</span>
              </button>
            </div>
          </div>

          {/* Synthesis Result */}
          {synthesis && (
            <div className="space-y-6">
              {/* Trust Summary Card */}
              <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span className="font-mono text-xs font-bold text-stone-900">
                    EVIDENCE TRUST SUMMARY: {synthesis.trustSummary.overallStatus}
                  </span>
                </div>
                <div className="text-xs font-mono text-stone-600">
                  {synthesis.trustSummary.verifiedCorpusPassages} சான்றுப் பாடல்கள் · {synthesis.trustSummary.commentaryCount} செவ்வியல் உரைகள்
                </div>
              </div>

              {/* Academic Synthesis Text */}
              <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                  ஆய்வுத் தொகுப்புரை (Academic Synthesis)
                </h4>
                <div className="text-sm font-tamil-sans text-stone-800 leading-relaxed space-y-2">
                  <p>{synthesis.academicSynthesisTa}</p>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <h5 className="text-xs font-mono text-stone-500 uppercase mb-1">
                    Scholarly English Digest:
                  </h5>
                  <p className="text-xs text-stone-700 leading-relaxed italic">
                    {synthesis.academicSynthesisEn}
                  </p>
                </div>
              </div>

              {/* Grouped Evidence by Work */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                  திரட்டப்பட்ட மூல நூல்களும் பாடல்களும் (Evidence Grouped by Source)
                </h4>

                {synthesis.groupedEvidence.map((group, gIdx) => (
                  <div key={gIdx} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <h5 className="font-tamil-serif font-bold text-base text-stone-900">
                        {group.workTitleTa} ({group.workTitleEn})
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
                              {ev.citation.chapterOrPoem} (புலவர்: {ev.poetTa})
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

      {/* TAB 3: COMMENTARY & TRANSLATION COMPARISON MATRIX */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                உரைகள் & மொழிபெயர்ப்புகள் ஒப்பாய்வு (Comparative Matrix)
              </h3>
              <p className="text-xs text-stone-600 font-tamil-sans">
                பல்வேறு செவ்வியல் உரைநூல்களையும் (பரிமேலழகர், மு.வரதராசன், அடியார்க்குநல்லார்), ஆங்கில மொழிபெயர்ப்புகளையும் அருகருகே வைத்து ஒப்பிடுக.
              </p>
            </div>

            {/* Verse Selector */}
            <select
              value={compareVerseId}
              onChange={(e) => setCompareVerseId(e.target.value)}
              className="p-2.5 bg-stone-50 border border-stone-200 rounded text-xs font-tamil-sans text-stone-800"
            >
              {CLASSICAL_VERSES.map(v => (
                <option key={v.id} value={v.id}>
                  {v.workTitleTa}: {v.chapterTa || `பாடல் ${v.verseNumber}`} ({v.linesTa[0].slice(0, 30)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Primary Verse Banner */}
          <div className="bg-stone-900 text-stone-100 p-6 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              ஒப்பாய்வு மூலப் பாடம் (Target Text): {currentCompareVerse.workTitleTa}
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

          {/* Side by side Commentators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentCompareVerse.commentaries.map(comm => (
              <div key={comm.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
                  <span className="font-tamil-serif font-bold text-stone-900 text-sm">
                    {comm.scholarTa} ({comm.scholarEn})
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
                    நுட்பக்குறிப்பு: {comm.analysisTa}
                  </p>
                )}
                <div className="text-[10px] font-mono text-stone-400 pt-2 border-t border-stone-100">
                  பதிப்பு: {comm.sourceEdition}
                </div>
              </div>
            ))}
          </div>

          {/* Side by side Translations */}
          {currentCompareVerse.translations.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                ஆங்கில மொழிபெயர்ப்புகள் ஒப்பீடு (English Translations)
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

      {/* TAB 4: SAVED RESEARCH COLLECTION & CITATION EXPORT */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                சேமிக்கப்பட்ட ஆய்வுப் பாடல்கள் (Saved Research Collection)
              </h3>
              <p className="text-xs text-stone-600 font-tamil-sans">
                மொத்தம் {savedVerses.length} பாடல்கள் சேகரிக்கப்பட்டுள்ளன. இவற்றை BibTeX, APA அல்லது Chicago வடிவங்களில் பதிவிறக்கம் செய்க.
              </p>
            </div>

            {/* Export Format Switcher */}
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
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'நகலெடுக்கப்பட்டது!' : 'நகலெடு (Copy)'}</span>
              </button>
            </div>
          </div>

          {/* Collection Grid */}
          {savedVerses.length > 0 ? (
            <div className="space-y-4">
              {savedVerses.map(verse => (
                <div key={verse.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-tamil-serif font-bold text-stone-900 text-base">
                        {verse.workTitleTa}
                      </span>
                      <span className="text-stone-300 mx-2">·</span>
                      <span className="text-xs text-stone-600 font-mono">
                        {verse.chapterTa || `பாடல் ${verse.verseNumber}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onInspectVerse(verse)}
                        className="text-xs text-stone-700 hover:text-stone-950 font-mono"
                      >
                        சான்று காண்க
                      </button>
                      <button
                        onClick={() => onToggleSaveVerse(verse)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-mono"
                      >
                        நீக்கு
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
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-500 space-y-2">
              <Bookmark className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-tamil-sans">
                இன்னும் பாடல்கள் எதுவும் சேகரிக்கப்படவில்லை. கலப்புத் தேடல் அல்லது ஆய்வுக் களத்தில் இருந்து பாடல்களைச் சேமிக்கலாம்.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
