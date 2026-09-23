import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, ChevronRight, BookOpen, Layers, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { ClassicalVerse, FlashcardItem, QuizItem, StudyAnalysis, TrustStatus } from '../types/index.ts';

interface StudyWorkspaceProps {
  onInspectVerse: (verse: ClassicalVerse) => void;
}

const SAMPLE_TEXTS = [
  {
    title: 'திருக்குறள்: விருந்தோம்பல்',
    snippet: 'இருந்தோம்பி இல்வாழ்வ தெல்லாம் விருந்தோம்பி வேளாண்மை செய்தற் பொருட்டு.',
    ref: 'குறள் 81'
  },
  {
    title: 'புறநானூறு: யாதும் ஊரே',
    snippet: 'யாதும் ஊரே யாவரும் கேளிர் தீதும் நன்றும் பிறர்தர வாரா நோதலும் தணிதலும் அவற்றோரன்ன சாதலும் புதுவதன்றே',
    ref: 'பாடல் 192'
  },
  {
    title: 'குறுந்தொகை: செம்புலப் பெயனீரார்',
    snippet: 'யாயும் ஞாயும் யாராகியரோ எந்தையும் நுந்தையும் எம்முறைக் கேளிர் செம்புலப் பெயல்நீர் போல அன்புடை நெஞ்சம் தாம்கலந்தனவே',
    ref: 'பாடல் 40'
  },
  {
    title: 'சிலப்பதிகாரம்: மங்கல வாழ்த்து',
    snippet: 'திங்களைப் போற்றுதும் திங்களைப் போற்றுதும் அங்கண் உலகளித்த லான் ஞாயிறு போற்றுதும் மாமழை போற்றுதும்',
    ref: 'புகார்க் காண்டம்'
  }
];

export const StudyWorkspace: React.FC<StudyWorkspaceProps> = ({ onInspectVerse }) => {
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

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setOcrStatus('கோப்பின் அளவு 10MB-க்கும் குறைவாக இருக்க வேண்டும் (File size must be under 10MB).');
      return;
    }

    setOcrStatus(`கோப்பு பதிவேற்றப்பட்டது: ${file.name}. நேரலை தமிழ் எழுத்துணரி (OCR) ஆய்வு தொடங்குகிறது...`);
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
            setOcrStatus(`OCR எழுத்துணரி நிறைவு பெற்றது (நம்பகத்தன்மை: ${Math.round((ocrData.confidence || 0.95) * 100)}%).`);
            handleAnalyze(ocrData.extractedText);
          } else {
            setOcrStatus(ocrData.message || 'எழுத்துக்கள் எதுவும் கண்டறியப்படவில்லை. தெளிவான படத்தைப் பதிவேற்றவும்.');
          }
        } catch (err) {
          setOcrStatus('எழுத்துணரி செயல்முறையில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Plain text or notes file
      reader.onload = () => {
        const content = reader.result as string;
        setInputText(content);
        handleAnalyze(content);
      };
      reader.readAsText(file);
    }
  };

  // Initial load
  React.useEffect(() => {
    handleAnalyze(SAMPLE_TEXTS[0].snippet);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Philosophy */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-classical-display font-bold text-stone-900 tracking-wide">
            STUDY WORKSPACE · படிப்புக்களம்
          </h1>
          <p className="text-xs text-stone-600 font-tamil-sans mt-0.5">
            படித்தல் → எழுத்துணரி / ஆய்வு → மூல நூல் அடையாளம் → சான்று உரை → பயிற்சி
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center gap-2">
          <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded border border-stone-200">
            EVIDENCE-GROUNDED LEARNING
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Upload Workspace (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-between">
              <span>உரை உள்ளீடு / ஆவணம் (INPUT)</span>
              <span className="text-[11px] text-stone-400">PDF / படம் / குறிப்பு</span>
            </h2>

            {/* Textarea */}
            <div className="relative mb-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={5}
                placeholder="செம்மொழித் தமிழ் அல்லது குறள் வரிகளை இங்கே உள்ளிடவும்..."
                className="w-full text-sm font-tamil-serif p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-900 focus:bg-white resize-none text-stone-900"
              />
            </div>

            {/* OCR Upload Button */}
            <div className="mb-4">
              <label className="flex items-center justify-center gap-2 w-full p-2.5 border border-dashed border-stone-300 rounded-lg bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-xs text-stone-600">
                <Upload className="w-4 h-4 text-stone-500" />
                <span>படம் / குறிப்பு / OCR ஆவணம் பதிவேற்றுக</span>
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

            {/* Action Buttons */}
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !inputText.trim()}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-lg text-xs font-medium font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
                  <span>ஆய்வு செய்யப்படுகிறது...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>சான்று அடிப்படையிலான ஆய்வு (Analyze & Verify)</span>
                </>
              )}
            </button>

            {/* Sample Selector */}
            <div className="mt-5 pt-4 border-t border-stone-100">
              <span className="text-[11px] font-mono text-stone-400 block mb-2 uppercase">
                மாதிரிப் பாடல்கள் (Verified Samples):
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
                    <span className="font-tamil-serif font-medium">{sample.title}</span>
                    <span className="text-[10px] font-mono text-stone-400">{sample.ref}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output, Analysis & Practice Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Subtabs: Analysis | Practice | Source Trail */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
            <button
              onClick={() => setActiveSubTab('analysis')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'analysis'
                  ? 'bg-stone-900 text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              பாடல் ஆய்வு & உரை (Analysis)
            </button>
            <button
              onClick={() => setActiveSubTab('practice')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'practice'
                  ? 'bg-stone-900 text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <span>சொல் மனனம் & வினாடிவினா (Practice)</span>
              {quizList.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('trail')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'trail'
                  ? 'bg-stone-900 text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              சான்று வழித்தடம் (Source Trail)
            </button>
          </div>

          {/* Analysis Tab View */}
          {activeSubTab === 'analysis' && analysis && (
            <div className="space-y-6">
              {/* Trust & Identification Banner */}
              <div className="bg-stone-100 border border-stone-200 p-4 rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {analysis.sourceTrust}
                    </span>
                    {analysis.isKnownCorpusMatch && (
                      <span className="text-xs text-stone-500 font-mono">
                        பொருத்தம்: {Math.round(analysis.matchConfidence * 100)}%
                      </span>
                    )}
                  </div>
                  {analysis.identifiedVerse ? (
                    <div className="mt-1">
                      <h3 className="font-tamil-serif font-bold text-stone-900 text-base">
                        {analysis.identifiedVerse.workTitleTa} · {analysis.identifiedVerse.chapterTa || `பாடல் ${analysis.identifiedVerse.verseNumber}`}
                      </h3>
                      <p className="text-xs text-stone-600 font-tamil-sans">
                        புலவர்: {analysis.identifiedVerse.poetTa} · யாப்பு: {analysis.identifiedVerse.meterTa}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600 font-tamil-sans">
                      பயனர் உரை செவ்வியல் தமிழ் மூலங்களோடு ஒப்பிடப்பட்டுள்ளது.
                    </p>
                  )}
                </div>

                {analysis.identifiedVerse && (
                  <button
                    onClick={() => onInspectVerse(analysis.identifiedVerse!)}
                    className="text-xs font-medium text-stone-800 hover:text-stone-950 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors"
                  >
                    <span>முழு சான்று காண்க</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Identified Verse Lines */}
              {analysis.identifiedVerse && (
                <div className="bg-white border border-stone-200 p-5 rounded-xl">
                  <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                    செவ்வியல் மூலப் பாடம் (Original Classical Text):
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
              )}

              {/* Word-by-Word Breakdown */}
              <div className="bg-white border border-stone-200 p-5 rounded-xl">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-3">
                  பதம் பிரித்தல் & சொல்வளம் (Word Breakdown & Morphology)
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
                          பிரிப்பு: <span className="text-stone-700 font-medium">{w.sandhiSplit}</span>
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

              {/* Dual Explanations (Tamil & English) */}
              <div className="bg-white border border-stone-200 p-5 rounded-xl space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    தமிழ்ப் பொருளுரை (Classical Commentary Exposition)
                  </h4>
                  <p className="text-sm font-tamil-sans text-stone-800 leading-relaxed">
                    {analysis.explanationTa}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    ஆங்கில விளக்கம் (Scholarly English Explanation)
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed italic">
                    {analysis.explanationEn}
                  </p>
                </div>

                {analysis.culturalSignificance && (
                  <div className="pt-3 border-t border-stone-100">
                    <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      பண்பாட்டு வரலாற்றுப் பின்னணி (Cultural & Historical Context)
                    </h4>
                    <p className="text-xs text-stone-600 font-tamil-sans leading-relaxed">
                      {analysis.culturalSignificance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Practice Tab View (Flashcards & Quiz) */}
          {activeSubTab === 'practice' && (
            <div className="space-y-6">
              {/* Flashcards */}
              {flashcards.length > 0 ? (
                <div className="bg-white border border-stone-200 p-6 rounded-xl text-center">
                  <div className="flex items-center justify-between text-xs text-stone-400 font-mono mb-4">
                    <span>செவ்வியல் சொல் அட்டை (Flashcard)</span>
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
                          (பொருள் அறிய அழுத்தவும் / Click to reveal meaning)
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
                          இலக்கணம்: {flashcards[currentFcIndex].grammarTag}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={() => {
                        setIsFcRevealed(false);
                        setCurrentFcIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                      }}
                      className="px-4 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100"
                    >
                      முந்தையது (Prev)
                    </button>
                    <button
                      onClick={() => {
                        setIsFcRevealed(false);
                        setCurrentFcIndex((prev) => (prev + 1) % flashcards.length);
                      }}
                      className="px-4 py-1.5 rounded-md bg-stone-900 text-stone-100 text-xs font-medium hover:bg-stone-800"
                    >
                      அடுத்த சொல் (Next)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200">
                  இப்பாடலுக்கான சொல் அட்டைகள் கிடைக்கவில்லை.
                </div>
              )}

              {/* Comprehension Quiz */}
              {quizList.length > 0 && (
                <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-6">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                    புரிதல் வினாடிவினா (Comprehension & Evidence Verification)
                  </h3>

                  {quizList.map((quiz, qIdx) => {
                    const selected = selectedAnswers[quiz.id];
                    const isAnswered = selected !== undefined;
                    const isCorrect = selected === quiz.correctIndex;

                    return (
                      <div key={quiz.id} className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-3">
                        <div className="text-xs font-tamil-serif font-bold text-stone-900">
                          {qIdx + 1}. {quiz.questionTa}
                        </div>
                        <p className="text-[11px] text-stone-500 italic">
                          {quiz.questionEn}
                        </p>

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
                              {isCorrect ? 'சரியான விடை!' : 'சான்று விளக்கம்:'}
                            </div>
                            <p className="font-tamil-sans">{quiz.explanationTa}</p>
                            <span className="text-[10px] font-mono text-stone-500 block mt-1">
                              சான்று: {quiz.verseRef}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Source Trail Tab View */}
          {activeSubTab === 'trail' && analysis && (
            <div className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 mb-2">
                நம்பகத்தன்மை & சான்று வழித்தடம் (Why am I seeing this?)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-tamil-sans">
                YAAZH AI அமைப்பில் தோன்றும் ஒவ்வொரு விளக்கமும், மூல நூல், புலவர், செவ்வியல் உரைநூல்களோடு எவ்வாறு இணைக்கப்பட்டுள்ளது என்பதை விளக்கும் வெளிப்படையான சான்றுத் தொடர்:
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
                      மூல ஆதாரம்: {item.source}
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
