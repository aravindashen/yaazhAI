import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, ChevronRight, BookOpen, Layers, HelpCircle, ArrowRight, RotateCcw, Volume2, Camera, Languages, Sparkles, Clock, History } from 'lucide-react';
import { ClassicalVerse, FlashcardItem, QuizItem, StudyAnalysis, TrustStatus } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { AudioPronunciation } from './AudioPronunciation.tsx';
import { processSmartInput } from '../services/tanglishConverter.ts';

interface StudyHistoryItem {
  id: string;
  timestamp: string;
  snippet: string;
  workTitleTa?: string;
  workTitleEn?: string;
  chapterOrPoem?: string;
}

interface StudentPlatformProps {
  onInspectVerse: (verse: ClassicalVerse) => void;
  language: Language;
  onOpenScanner?: () => void;
}

const SAMPLE_TEXTS = [
  {
    titleTa: 'திருக்குறள்: விருந்தோம்பல்',
    titleEn: 'Tirukkural: Hospitality',
    snippet: 'இருந்தோம்பி இல்வாழ்வ தெல்லாம் விருந்தோம்பி வேளாண்மை செய்தற் பொருட்டு.',
    ref: 'குறள் 81'
  },
  {
    titleTa: 'புறநானூறு: யாதும் ஊரே',
    titleEn: 'Purananuru: Universal Kinship',
    snippet: 'யாதும் ஊரே யாவரும் கேளிர் தீதும் நன்றும் பிறர்தர வாரா நோதலும் தணிதலும் அவற்றோரன்ன சாதலும் புதுவதன்றே',
    ref: 'பாடல் 192'
  },
  {
    titleTa: 'குறுந்தொகை: செம்புலப் பெயனீரார்',
    titleEn: 'Kurunthogai: Red Earth & Pouring Rain',
    snippet: 'யாயும் ஞாயும் யாராகியரோ எந்தையும் நுந்தையும் எம்முறைக் கேளிர் செம்புலப் பெயல்நீர் போல அன்புடை நெஞ்சம் தாம்கலந்தனவே',
    ref: 'பாடல் 40'
  },
  {
    titleTa: 'சிலப்பதிகாரம்: மங்கல வாழ்த்து',
    titleEn: 'Silappadikaram: Benedictory Ode',
    snippet: 'திங்களைப் போற்றுதும் திங்களைப் போற்றுதும் அங்கண் உலகளித்த லான் ஞாயிறு போற்றுதும் மாமழை போற்றுதும்',
    ref: 'புகார்க் காண்டம்'
  }
];

export const StudentPlatform: React.FC<StudentPlatformProps> = ({
  onInspectVerse,
  language,
  onOpenScanner
}) => {
  const t = TRANSLATIONS[language];
  const [inputText, setInputText] = useState(SAMPLE_TEXTS[0].snippet);
  const [activeSubTab, setActiveSubTab] = useState<'analysis' | 'practice' | 'trail'>('analysis');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StudyAnalysis | null>(null);
  const [quizList, setQuizList] = useState<QuizItem[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [currentFcIndex, setCurrentFcIndex] = useState(0);
  const [isFcRevealed, setIsFcRevealed] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [translateMode, setTranslateMode] = useState<'ta' | 'en'>('ta');

  // Session Continuity: Load recently studied verses from local storage
  const [recentSessions, setRecentSessions] = useState<StudyHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('yaazh_study_history');
      return stored ? JSON.parse(stored) : [
        {
          id: 'hist-1',
          timestamp: 'முந்தைய அமர்வு',
          snippet: 'இருந்தோம்பி இல்வாழ்வ தெல்லாம் விருந்தோம்பி வேளாண்மை செய்தற் பொருட்டு.',
          workTitleTa: 'திருக்குறள்',
          workTitleEn: 'Tirukkural',
          chapterOrPoem: 'குறள் 81'
        },
        {
          id: 'hist-2',
          timestamp: 'முந்தைய அமர்வு',
          snippet: 'யாதும் ஊரே யாவரும் கேளிர் தீதும் நன்றும் பிறர்தர வாரா...',
          workTitleTa: 'புறநானூறு',
          workTitleEn: 'Purananuru',
          chapterOrPoem: 'பாடல் 192'
        }
      ];
    } catch {
      return [];
    }
  });

  const smartInput = processSmartInput(inputText);

  // Trigger Study Analysis
  const handleAnalyze = async (textToAnalyze = inputText) => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    setOcrStatus(null);
    try {
      const res = await fetch('/api/study/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze })
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);

        // Save to Recent Study Sessions for continuity
        const newHistItem: StudyHistoryItem = {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          snippet: textToAnalyze.slice(0, 90),
          workTitleTa: data.analysis.identifiedVerse?.workTitleTa || 'செவ்வியல் செய்யுள்',
          workTitleEn: data.analysis.identifiedVerse?.workTitleEn || 'Classical Verse',
          chapterOrPoem: data.analysis.identifiedVerse?.chapterTa || (data.analysis.identifiedVerse ? `பாடல் ${data.analysis.identifiedVerse.verseNumber}` : undefined)
        };

        setRecentSessions(prev => {
          const filtered = prev.filter(p => p.snippet !== newHistItem.snippet);
          const updated = [newHistItem, ...filtered].slice(0, 6);
          try {
            localStorage.setItem('yaazh_study_history', JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
          return updated;
        });

        // Fetch quiz & flashcards if verse identified
        if (data.analysis.identifiedVerse) {
          const quizRes = await fetch('/api/study/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verseId: data.analysis.identifiedVerse.id })
          });
          const qData = await quizRes.json();
          setQuizList(qData.quiz || []);
          setFlashcards(qData.flashcards || []);
          setCurrentFcIndex(0);
          setIsFcRevealed(false);
          setSelectedAnswers({});
        }
      }
    } catch (err) {
      console.error('Study error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Image Upload & Multimodal OCR Extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setOcrStatus(language === 'ta' ? 'கோப்பின் அளவு 10MB-க்குள் இருக்க வேண்டும்.' : 'File size must be under 10MB.');
      return;
    }

    setOcrStatus(`${language === 'ta' ? 'கோப்பு பதிவேற்றப்பட்டது:' : 'Uploaded:'} ${file.name}. ${language === 'ta' ? 'நேரலை எழுத்துணரி ஆய்வு...' : 'Real-time Multimodal OCR...'}`);
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          setLoading(true);
          const res = await fetch('/api/study/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
          });
          const ocrData = await res.json();
          if (ocrData.extractedText) {
            setInputText(ocrData.extractedText);
            setOcrStatus(`${language === 'ta' ? 'எழுத்துணரி நிறைவு' : 'OCR Completed'}: ${Math.round((ocrData.confidence || 0.95) * 100)}% confidence`);
            handleAnalyze(ocrData.extractedText);
          } else {
            setOcrStatus(ocrData.message || (language === 'ta' ? 'எழுத்துக்கள் எதுவும் கண்டறியப்படவில்லை. தெளிவான படத்தைப் பதிவேற்றவும்.' : 'No legible text detected. Please upload a clear image.'));
          }
        } catch (err) {
          setOcrStatus(language === 'ta' ? 'எழுத்துணரி செயல்முறையில் பிழை ஏற்பட்டது.' : 'OCR processing error. Please retry.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const content = reader.result as string;
        setInputText(content);
        handleAnalyze(content);
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    handleAnalyze(SAMPLE_TEXTS[0].snippet);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
            <h1 className="text-xl font-classical-display font-bold text-stone-900 tracking-wide">
              {t.studyWorkspace}
            </h1>
          </div>
          <p className="text-xs text-stone-600 font-tamil-sans">
            {t.studySubtitle}
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
            {language === 'ta' ? 'தேர்வு & பாடத்திட்டக் களம்' : 'STUDY & EXAMS MODE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input, OCR & Samples (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-between">
              <span>{t.inputSection}</span>
              <span className="text-[10px] text-stone-400">
                {language === 'ta' ? 'படிமம் / படம் / உரை' : 'PDF / Image / Text'}
              </span>
            </h2>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                placeholder={
                  language === 'ta'
                    ? 'தமிழில் தட்டச்சு செய்க, அல்லது Tanglish (எ.கா: irunthombi), அல்லது ஆங்கிலத்தில் வினவுக...'
                    : 'Type in Tamil, Tanglish (e.g. yaathum oore), or English...'
                }
                className="w-full text-sm font-tamil-serif p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-900 focus:bg-white resize-none text-stone-900 mb-2"
              />

              {/* Tanglish / Smart Input Detection Chip */}
              {smartInput.isTanglishOrEnglish && (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-amber-900 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold uppercase text-[10px]">{smartInput.detectedLanguage}:</span>
                    <span className="truncate">{smartInput.tamilQuery}</span>
                  </div>
                  <button
                    onClick={() => {
                      setInputText(smartInput.tamilQuery);
                      handleAnalyze(smartInput.tamilQuery);
                    }}
                    className="shrink-0 ml-2 px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-mono text-[11px] font-bold"
                  >
                    {language === 'ta' ? 'பயன்படுத்து' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Scan Buttons: Real-Time Camera & Upload */}
            <div className="space-y-2 mb-4">
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="flex items-center justify-center gap-2 w-full p-2.5 border border-amber-400 rounded-lg bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors text-xs font-mono text-amber-950 font-semibold shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-amber-700" />
                  <span>{language === 'ta' ? 'கேமரா மூலம் நேரடி ஸ்கேன் & பட ஆய்வு' : 'Real-Time Camera Scan & Visual OCR'}</span>
                </button>
              )}

              <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-stone-300 rounded-lg bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-xs text-stone-600">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>{t.uploadDoc}</span>
                <input
                  type="file"
                  accept="image/*,.txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {ocrStatus && (
                <p className="text-[11px] text-stone-500 mt-2 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{ocrStatus}</span>
                </p>
              )}
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !inputText.trim()}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-lg text-xs font-medium font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
                  <span>{t.analyzing}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.analyzeButton}</span>
                </>
              )}
            </button>

            {/* Continue Learning from Previous Sessions */}
            {recentSessions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <History className="w-3 h-3 text-stone-500" />
                    <span>{language === 'ta' ? 'அண்மையில் கற்றவை (தொடர்க)' : 'Continue Learning (Recent)'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {recentSessions.length}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {recentSessions.map((hist) => (
                    <button
                      key={hist.id}
                      onClick={() => {
                        setInputText(hist.snippet);
                        handleAnalyze(hist.snippet);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-stone-50 hover:bg-amber-50/80 border border-stone-200/80 hover:border-amber-200 text-xs flex items-center justify-between text-stone-800 transition-colors group"
                      title={hist.snippet}
                    >
                      <div className="truncate pr-2">
                        <span className="font-tamil-serif font-bold text-stone-900 group-hover:text-amber-900">
                          {language === 'ta' ? hist.workTitleTa : hist.workTitleEn}
                        </span>
                        {hist.chapterOrPoem && (
                          <span className="text-[10px] text-stone-500 ml-1.5 font-mono">
                            {hist.chapterOrPoem}
                          </span>
                        )}
                        <p className="text-[11px] text-stone-600 truncate mt-0.5 font-tamil-sans">
                          {hist.snippet}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 shrink-0">
                        {hist.timestamp}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Samples */}
            <div className="mt-5 pt-4 border-t border-stone-100">
              <span className="text-[11px] font-mono text-stone-400 block mb-2 uppercase">
                {t.verifiedSamples}:
              </span>
              <div className="space-y-1.5">
                {SAMPLE_TEXTS.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(sample.snippet);
                      handleAnalyze(sample.snippet);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-stone-100 text-xs flex items-center justify-between text-stone-700 transition-colors"
                  >
                    <span className="font-tamil-serif font-medium">
                      {language === 'ta' ? sample.titleTa : sample.titleEn}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">{sample.ref}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis, Flashcards, Quiz & Trail (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs">
            <button
              onClick={() => setActiveSubTab('analysis')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeSubTab === 'analysis'
                  ? 'bg-stone-900 text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {t.tabAnalysis}
            </button>
            <button
              onClick={() => setActiveSubTab('practice')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'practice'
                  ? 'bg-stone-900 text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <span>{t.tabPractice}</span>
              {quizList.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
            <button
              onClick={() => setActiveSubTab('trail')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeSubTab === 'trail'
                  ? 'bg-stone-900 text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {t.tabTrail}
            </button>
          </div>

          {/* Subtab 1: Analysis */}
          {activeSubTab === 'analysis' && analysis && (
            <div className="space-y-6">
              {/* Trust Badge & Match */}
              <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {analysis.sourceTrust}
                    </span>
                    {analysis.isKnownCorpusMatch && (
                      <span className="text-xs text-stone-500 font-mono">
                        {Math.round(analysis.matchConfidence * 100)}% {t.match}
                      </span>
                    )}
                  </div>
                  {analysis.identifiedVerse ? (
                    <div>
                      <h3 className="font-tamil-serif font-bold text-stone-900 text-base">
                        {analysis.identifiedVerse.workTitleTa} · {analysis.identifiedVerse.chapterTa || `பாடல் ${analysis.identifiedVerse.verseNumber}`}
                      </h3>
                      <p className="text-xs text-stone-600 font-tamil-sans">
                        {analysis.identifiedVerse.poetTa} · {analysis.identifiedVerse.meterTa}
                      </p>
                    </div>
                  ) : null}
                </div>

                {analysis.identifiedVerse && (
                  <button
                    onClick={() => onInspectVerse(analysis.identifiedVerse!)}
                    className="text-xs font-medium text-stone-800 hover:text-stone-950 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors"
                  >
                    <span>{t.viewFullEvidence}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Identified Verse Lines & Recitation */}
              {analysis.identifiedVerse && (
                <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
                  <div>
                    <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                      {t.originalText}:
                    </span>
                    <div className="space-y-1 font-tamil-serif text-lg font-semibold text-stone-900 pl-3 border-l-2 border-stone-800">
                      {analysis.identifiedVerse.linesTa.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-mono text-stone-500 italic">
                      {analysis.identifiedVerse.transliteration}
                    </p>
                  </div>

                  {/* Audio Cadence Component */}
                  <AudioPronunciation
                    tamilText={analysis.identifiedVerse.linesTa.join(' ')}
                    transliteration={analysis.identifiedVerse.transliteration}
                    language={language}
                  />
                </div>
              )}

              {/* Word by Word Breakdown */}
              <div className="bg-white border border-stone-200 p-5 rounded-xl">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-3">
                  {t.wordBreakdown}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.wordByWord.map((w, i) => (
                    <div key={i} className="p-2.5 rounded bg-stone-50 border border-stone-200">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="font-tamil-serif font-bold text-stone-900 text-sm">
                          {w.original}
                        </span>
                        {w.grammarNote && (
                          <span className="text-[10px] text-stone-500 font-mono">
                            {w.grammarNote}
                          </span>
                        )}
                      </div>
                      {w.sandhiSplit !== w.original && (
                        <p className="text-xs text-stone-500 font-tamil-sans mb-1">
                          {t.splitForm}: <span className="text-stone-700 font-medium">{w.sandhiSplit}</span>
                        </p>
                      )}
                      <p className="text-xs text-stone-800 font-tamil-sans">
                        {w.meaningTa}
                      </p>
                      <p className="text-[11px] text-stone-500 italic">
                        {w.meaningEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commentary & Explanation */}
              <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    {t.commentaryText}
                  </h4>
                  <p className="text-sm font-tamil-sans text-stone-800 leading-relaxed">
                    {analysis.explanationTa}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    {t.englishExplanation}
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed italic">
                    {analysis.explanationEn}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Practice Flashcards & Quiz */}
          {activeSubTab === 'practice' && (
            <div className="space-y-6">
              {flashcards.length > 0 ? (
                <div className="bg-white border border-stone-200 p-6 rounded-xl text-center">
                  <div className="flex items-center justify-between text-xs text-stone-400 font-mono mb-4">
                    <span>{t.flashcardTitle}</span>
                    <span>{currentFcIndex + 1} / {flashcards.length}</span>
                  </div>

                  <div
                    onClick={() => setIsFcRevealed(!isFcRevealed)}
                    className="min-h-48 p-8 rounded-xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100/70 transition-all select-none"
                  >
                    {!isFcRevealed ? (
                      <div>
                        <div className="font-tamil-serif font-bold text-2xl text-stone-900 mb-2">
                          {flashcards[currentFcIndex].frontTa}
                        </div>
                        <p className="text-xs font-mono text-stone-500 mb-3">
                          {flashcards[currentFcIndex].transliteration}
                        </p>
                        <span className="text-[11px] text-stone-400 font-mono">
                          ({t.clickToReveal})
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-tamil-serif font-semibold text-stone-900 mb-1">
                          {flashcards[currentFcIndex].backMeaningTa}
                        </div>
                        <p className="text-xs text-stone-600 italic mb-3">
                          {flashcards[currentFcIndex].backMeaningEn}
                        </p>
                        <div className="text-[11px] font-mono text-stone-500 bg-stone-200/50 px-2.5 py-1 rounded inline-block">
                          {flashcards[currentFcIndex].grammarTag}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={() => {
                        setIsFcRevealed(false);
                        setCurrentFcIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                      }}
                      className="px-4 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100"
                    >
                      {t.prevWord}
                    </button>
                    <button
                      onClick={() => {
                        setIsFcRevealed(false);
                        setCurrentFcIndex((prev) => (prev + 1) % flashcards.length);
                      }}
                      className="px-4 py-1.5 rounded-md bg-stone-900 text-stone-100 text-xs font-medium hover:bg-stone-800"
                    >
                      {t.nextWord}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Quiz */}
              {quizList.length > 0 && (
                <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                      {t.quizTitle}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-stone-600">
                        {language === 'ta' ? 'மதிப்பெண்' : 'Score'}:{' '}
                        <strong className="text-emerald-700">
                          {quizList.filter(q => selectedAnswers[q.id] === q.correctIndex).length}
                        </strong>{' '}
                        / {quizList.length}
                      </span>
                      {Object.keys(selectedAnswers).length > 0 && (
                        <button
                          onClick={() => setSelectedAnswers({})}
                          className="text-[11px] font-mono text-stone-400 hover:text-stone-700 underline ml-2"
                        >
                          {language === 'ta' ? 'மீளமை' : 'Reset'}
                        </button>
                      )}
                    </div>
                  </div>

                  {quizList.map((quiz, qIdx) => {
                    const selected = selectedAnswers[quiz.id];
                    const isAnswered = selected !== undefined;
                    const isCorrect = selected === quiz.correctIndex;

                    return (
                      <div key={quiz.id} className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-3">
                        <div className="text-xs font-tamil-serif font-bold text-stone-900">
                          {qIdx + 1}. {language === 'ta' ? quiz.questionTa : quiz.questionEn}
                        </div>

                        <div className="space-y-2 pt-1">
                          {quiz.options.map((opt, optIdx) => {
                            let btnStyle = 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100';
                            if (isAnswered) {
                              if (optIdx === quiz.correctIndex) {
                                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-medium';
                              } else if (selected === optIdx) {
                                btnStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isAnswered}
                                onClick={() => setSelectedAnswers({ ...selectedAnswers, [quiz.id]: optIdx })}
                                className={`w-full text-left p-2.5 rounded-md border text-xs font-tamil-sans transition-colors ${btnStyle}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className={`p-3 rounded text-xs ${isCorrect ? 'bg-emerald-100/70 text-emerald-900' : 'bg-stone-200 text-stone-800'}`}>
                            <div className="font-semibold mb-0.5">
                              {isCorrect ? t.correctAnswer : t.sourceExplanation}
                            </div>
                            <p className="font-tamil-sans">
                              {language === 'ta' ? quiz.explanationTa : quiz.explanationEn}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subtab 3: Source Trail */}
          {activeSubTab === 'trail' && analysis && (
            <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-2">
                {t.sourceTrailTitle}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-tamil-sans">
                {t.sourceTrailDesc}
              </p>

              <div className="space-y-3 pt-2">
                {analysis.sourceTrail.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border border-stone-200 bg-stone-50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-stone-900">
                        {item.step}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 font-tamil-sans">
                      {item.detail}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono mt-1">
                      {language === 'ta' ? 'மூல ஆதாரம்' : 'Primary Source'}: {item.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
