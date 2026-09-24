import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Music, Loader2 } from 'lucide-react';
import { Language } from '../services/i18n.ts';
import { yaazhElevenPlayer } from '../services/voiceAccessService.ts';

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
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);

  const words = tamilText.split(/\s+/).filter(Boolean);

  const handlePlayRecitation = async () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    // Cancel any browser speech synthesis before playing ElevenLabs recitation
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsLoading(true);

    try {
      await yaazhElevenPlayer.playText(tamilText, {
        language: 'ta',
        onStart: () => {
          setIsLoading(false);
          setIsPlaying(true);
          setCurrentWordIndex(0);
        },
        onEnd: () => {
          setIsPlaying(false);
          setCurrentWordIndex(null);
        },
        onError: () => {
          setIsLoading(false);
          setIsPlaying(false);
          setCurrentWordIndex(null);
        }
      });
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentWordIndex(null);
    }
  };

  const handleStop = () => {
    yaazhElevenPlayer.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
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

        <button
          onClick={isPlaying ? handleStop : handlePlayRecitation}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            isPlaying
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-stone-900 text-stone-100 hover:bg-stone-800'
          }`}
          aria-label={isPlaying ? 'Stop recitation' : 'Play classical recitation'}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{language === 'ta' ? 'ஆடியோ தயாராகிறது...' : 'Loading audio...'}</span>
            </>
          ) : isPlaying ? (
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
