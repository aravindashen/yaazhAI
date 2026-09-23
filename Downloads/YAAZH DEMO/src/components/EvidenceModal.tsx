import React from 'react';
import { X, ShieldCheck, BookOpen, Quote, ExternalLink, Bookmark } from 'lucide-react';
import { ClassicalVerse, TrustStatus } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { AudioPronunciation } from './AudioPronunciation.tsx';

interface EvidenceModalProps {
  verse: ClassicalVerse | null;
  onClose: () => void;
  onSaveToCollection?: (verse: ClassicalVerse) => void;
  language?: Language;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  verse,
  onClose,
  onSaveToCollection,
  language = 'ta'
}) => {
  if (!verse) return null;
  const isTa = language === 'ta';
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div 
        className="bg-[#faf8f5] w-full max-w-3xl rounded-xl border border-stone-300 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-100/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-stone-900 text-stone-100 flex items-center justify-center font-tamil-serif font-semibold text-sm">
              {isTa ? 'சா' : 'EV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tamil-serif font-bold text-stone-900 text-base">
                  {isTa ? verse.workTitleTa : verse.workTitleEn}
                </h3>
                <span className="text-stone-400 text-xs">·</span>
                <span className="text-xs text-stone-600 font-mono">
                  {verse.chapterTa ? `${isTa ? verse.chapterTa : verse.chapterEn} (${verse.verseNumber})` : `#${verse.verseNumber}`}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-tamil-sans">
                {isTa ? 'புலவர்' : 'Poet'}: {isTa ? verse.poetTa : verse.poetEn} · {isTa ? 'யாப்பு' : 'Meter'}: {verse.meterTa}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSaveToCollection && (
              <button
                onClick={() => onSaveToCollection(verse)}
                className="p-1.5 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                title={isTa ? 'சேகரிப்பில் சேர்க்க' : 'Save to Research Collection'}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Primary Text Lines */}
          <div className="p-5 rounded-lg bg-white border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block">
                {isTa ? 'செவ்வியல் மூலப் பாடம்:' : 'Original Classical Text:'}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                {isTa ? 'சரிபார்க்கப்பட்ட மூலம்' : 'VERIFIED CORPUS'}
              </span>
            </div>
            
            <div className="pl-3 border-l-2 border-stone-800 space-y-1 font-tamil-serif text-lg font-bold text-stone-900">
              {verse.linesTa.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>

            <p className="text-xs font-mono text-stone-500 pt-1 italic">
              {verse.transliteration}
            </p>
          </div>

          {/* Audio Pronunciation / Cadence */}
          <AudioPronunciation
            tamilText={verse.linesTa.join(' ')}
            transliteration={verse.transliteration}
            language={language}
          />

          {/* Vocabulary & Sandhi Breakdown */}
          {verse.vocabulary && verse.vocabulary.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                {isTa ? 'பதம் பிரித்தல் & சொல்வளம்' : 'Morphological & Vocabulary Breakdown'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {verse.vocabulary.map((v, i) => (
                  <div key={i} className="p-2.5 rounded bg-white border border-stone-200 text-xs">
                    <div className="flex items-center justify-between font-tamil-serif font-bold text-stone-900">
                      <span>{v.word}</span>
                      {v.pos && <span className="text-[10px] font-mono text-stone-400 font-normal">{v.pos}</span>}
                    </div>
                    {v.splitForm && (
                      <p className="text-[11px] text-stone-500 font-tamil-sans">
                        {isTa ? 'பிரிப்பு' : 'Split'}: <span className="text-stone-700 font-medium">{v.splitForm}</span>
                      </p>
                    )}
                    <p className="text-xs text-stone-800 font-tamil-sans mt-0.5">
                      {isTa ? v.classicalMeaningTa : (v.englishMeaning || v.classicalMeaningTa)}
                    </p>
                    {isTa && (
                      <p className="text-[11px] text-stone-500 italic">
                        {v.englishMeaning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canonical Commentaries */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
              {isTa ? 'செவ்வியல் உரைகள்' : 'Canonical Commentaries'}
            </h4>
            {verse.commentaries.map((comm) => (
              <div key={comm.id} className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-tamil-serif font-bold text-stone-900">
                    {isTa ? comm.scholarTa : comm.scholarEn}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">
                    {comm.period}
                  </span>
                </div>
                <p className="text-xs font-tamil-sans text-stone-800 leading-relaxed">
                  {comm.textTa}
                </p>
                {comm.analysisTa && (
                  <p className="text-[11px] font-tamil-sans text-stone-600 bg-white p-2 rounded border border-stone-100">
                    {isTa ? 'நுட்பம்' : 'Critical Note'}: {comm.analysisTa}
                  </p>
                )}
                <div className="text-[10px] font-mono text-stone-400 pt-1">
                  {isTa ? 'பதிப்பு' : 'Edition'}: {comm.sourceEdition}
                </div>
              </div>
            ))}
          </div>

          {/* Translations */}
          {verse.translations && verse.translations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500">
                {isTa ? 'ஆங்கில மொழிபெயர்ப்புகள்' : 'English Translations'}
              </h4>
              <div className="space-y-2">
                {verse.translations.map((tr) => (
                  <div key={tr.id} className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] text-stone-500 mb-1">
                      <span>{tr.translator}</span>
                      <span>{tr.year}</span>
                    </div>
                    <p className="font-serif italic text-stone-800">
                      "{tr.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Attribution & Critical Edition */}
          <div className="p-3 rounded bg-stone-100 border border-stone-200 text-[11px] font-mono text-stone-600 space-y-1">
            <div className="font-semibold text-stone-800 uppercase">
              {isTa ? 'மூல நூல் சான்று:' : 'Primary Source Reference:'}
            </div>
            <p>{verse.primaryEvidenceReference}</p>
            <p className="text-stone-500">{isTa ? 'பதிப்பு மரபு' : 'Canonical Edition'}: {verse.canonicalSource}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
          <span>{isTa ? 'யாழ் சான்றாதார பொறிமுறை' : 'YAAZH Trust Engine'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-stone-100 rounded hover:bg-stone-800 text-xs font-mono"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
