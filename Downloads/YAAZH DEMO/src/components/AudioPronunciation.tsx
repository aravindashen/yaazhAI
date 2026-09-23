import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Music } from 'lucide-react';
import { Language } from '../services/i18n.ts';

interface AudioPronunciationProps {
  tamilText: string;
  transliteration?: string;
  language: Language;
}

export const AudioPronunciation: React.FC<AudioPronunciationProps> = ({
  tamilText,
  transliteration,
  language
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const words = tamilText.split(/\s+/).filter(Boolean);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  const handlePlayRecitation = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (isPlaying) {
      setIsPlaying(false);
      setCurrentWordIndex(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(tamilText);
    utterance.lang = 'ta-IN';
    utterance.rate = 0.85; // Classical measured pace
    utterance.pitch = 1.0;

    // Try finding a Tamil voice
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('Tamil'));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }

    // Word boundary tracking
    let wordIdx = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentWordIndex(wordIdx);
        wordIdx++;
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentWordIndex(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(null);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentWordIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentWordIndex(null);
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-700">
          <Music className="w-4 h-4 text-stone-900" />
          <span className="font-semibold uppercase tracking-wider">
            {language === 'ta' ? 'செவ்வியல் ஓசை & வாசிப்பு' : 'Classical Recitation & Cadence'}
          </span>
        </div>

        {speechSupported && (
          <button
            onClick={isPlaying ? handleStop : handlePlayRecitation}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-stone-900 text-stone-100 hover:bg-stone-800'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'நிறுத்து' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'ஓசையைக் கேட்க' : 'Listen Cadence'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Recitation Highlight Flow */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
        {words.map((word, idx) => {
          const isHighlighted = currentWordIndex === idx;
          return (
            <span
              key={idx}
              className={`px-2 py-1 rounded text-sm font-tamil-serif transition-colors ${
                isHighlighted
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-800 bg-white border border-stone-200'
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>

      {transliteration && (
        <p className="text-[11px] font-mono text-stone-500 italic">
          ISO 15919: {transliteration}
        </p>
      )}
    </div>
  );
};
