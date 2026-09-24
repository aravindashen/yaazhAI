import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Sparkles, Check, Copy, Volume2, BookOpen, Search, X } from 'lucide-react';
import { Language } from '../services/i18n.ts';
import { processSmartInput } from '../services/tanglishConverter.ts';
import { ClassicalVerse } from '../types/index.ts';

interface QuickTranslatorProps {
  isOpen?: boolean;
  onClose: () => void;
  language: Language;
  initialText?: string;
  onSelectVerse?: (verse: ClassicalVerse) => void;
}

export const QuickTranslator: React.FC<QuickTranslatorProps> = ({
  isOpen = true,
  onClose,
  language,
  initialText = '',
  onSelectVerse
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [targetLang, setTargetLang] = useState<'ta' | 'en'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [translationSource, setTranslationSource] = useState('');
  const [smartInfo, setSmartInfo] = useState<any>(null);
  const [matchedVerse, setMatchedVerse] = useState<ClassicalVerse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setSmartInfo(null);
      setTranslatedText('');
      setMatchedVerse(null);
      return;
    }

    const smart = processSmartInput(text);
    setSmartInfo(smart);

    // Auto switch target language based on detected input
    if (smart.detectedLanguage === 'english') {
      setTargetLang('ta');
    } else {
      setTargetLang('en');
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetLang
        })
      });

      const data = await res.json();
      setTranslatedText(data.translatedText || '');
      setTranslationSource(data.source || '');

      // Also query smart input to get matching verse
      const smartRes = await fetch('/api/smart-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const smartData = await smartRes.json();
      if (smartData.verseMatch) {
        setMatchedVerse(smartData.verseMatch);
      } else {
        setMatchedVerse(null);
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleInputs = [
    { label: 'Tanglish input', text: 'yaathum oore yaavarum kelir' },
    { label: 'English input', text: 'hospitality and moral virtue in Sangam poetry' },
    { label: 'Tamil input', text: 'அன்பிலார் எல்லாம் தமக்குரியர்' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div 
        className="bg-[#faf8f5] w-full max-w-2xl rounded-2xl border border-stone-300 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tamil-serif font-bold text-sm text-stone-100">
                {language === 'ta' ? 'தமிழ் ⇄ ஆங்கிலம் உடனடி மொழிபெயர்ப்பு & Tanglish உள்ளீடு' : 'Instant Tamil ⇄ English Translator & Tanglish Engine'}
              </h3>
              <p className="text-[11px] text-stone-400 font-mono">
                Understands Tamil, Tanglish, & English typing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Controls: Target Language selector */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-semibold uppercase">மொழிபெயர்ப்பு இலக்கு:</span>
              <button
                onClick={() => setTargetLang(targetLang === 'ta' ? 'en' : 'ta')}
                className="px-3 py-1 rounded-lg bg-stone-200 text-stone-800 hover:bg-stone-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>{targetLang === 'ta' ? 'தமிழுக்கு (To Tamil)' : 'ஆங்கிலத்திற்கு (To English)'}</span>
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {smartInfo?.detectedLanguage && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-100 text-amber-900 border border-amber-300">
                உள்ளீடு: {smartInfo.detectedLanguage.toUpperCase()}
              </span>
            )}
          </div>

          {/* Input Box */}
          <div className="space-y-1.5">
            <textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'தமிழ், Tanglish (எ.கா. yaathum oore), அல்லது English-ல் தட்டச்சு செய்க...'
                  : 'Type in Tamil, Tanglish (e.g. yaathum oore yaavarum kelir), or English...'
              }
              rows={3}
              className="w-full p-3.5 rounded-xl border border-stone-300 bg-white font-tamil-sans text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-800 resize-none shadow-2xs"
            />

            {/* Smart Tanglish converted preview */}
            {smartInfo?.isTanglishOrEnglish && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs font-mono">
                <span className="text-stone-600 truncate">
                  {smartInfo.explanation}
                </span>
                <span className="text-amber-800 font-bold ml-2 shrink-0">
                  {smartInfo.tamilQuery}
                </span>
              </div>
            )}
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-mono text-stone-400">மாதிரிகள்:</span>
            {sampleInputs.map((sample, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(sample.text);
                  handleInputChange(sample.text);
                }}
                className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-mono transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Translate Action Button */}
          <button
            onClick={handleTranslate}
            disabled={!inputText.trim() || isLoading}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-stone-100 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-white rounded-full animate-spin" />
                <span>மொழிபெயர்க்கப்படுகிறது (Translating)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>மொழிபெயர் (Translate Now)</span>
              </>
            )}
          </button>

          {/* Translation Result Output */}
          {translatedText && (
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                <span>முடிவு (Translation Result):</span>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">{translationSource}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-stone-500 hover:text-stone-900 rounded transition-colors"
                    title="Copy Translation"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <p className="font-tamil-serif text-base font-semibold text-stone-900 leading-relaxed">
                {translatedText}
              </p>
            </div>
          )}

          {/* Matched Classical Verse Preview */}
          {matchedVerse && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-950 font-tamil-serif">
                  {matchedVerse.workTitleTa} · {matchedVerse.chapterTa ? matchedVerse.chapterTa : `பாடல் ${matchedVerse.verseNumber}`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  {matchedVerse.poetTa}
                </span>
              </div>
              <p className="text-xs font-tamil-serif text-stone-800 italic">
                "{matchedVerse.linesTa[0]}"
              </p>
              {onSelectVerse && (
                <button
                  onClick={() => {
                    onSelectVerse(matchedVerse);
                    onClose();
                  }}
                  className="text-xs font-mono text-stone-900 hover:underline flex items-center gap-1 font-semibold pt-1"
                >
                  <BookOpen className="w-3 h-3" />
                  முழு மூல பாடத்தையும் உரைகளையும் பார்க்க (Open Verse Dossier) ➔
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
