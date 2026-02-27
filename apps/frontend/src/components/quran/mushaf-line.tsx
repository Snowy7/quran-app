import { cn } from '@/lib/utils';
import type { AnnotatedWord } from '@/lib/fonts/group-lines';
import { useAudioStore } from '@/lib/stores/audio-store';

interface MushafLineProps {
  words: AnnotatedWord[];
  pageNumber: number;
  lineNumber: number;
  fontLoaded: boolean;
}

export function MushafLine({
  words,
  pageNumber: _pageNumber,
  lineNumber,
  fontLoaded: _fontLoaded,
}: MushafLineProps) {
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  // Temporary safety: always render readable Uthmani text until
  // per-page glyph font mapping is fully aligned with quran.com assets.
  const fontFamily = "'Scheherazade New', 'quran_common', serif";

  const sortedWords = words
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div
      className={cn(
        'mushaf-line flex flex-nowrap items-start justify-end gap-1.5',
        'px-2 py-0.5',
      )}
      dir="rtl"
      data-line={lineNumber}
      style={{
        fontFamily,
        fontSize: 'var(--mushaf-font-size, 28px)',
        lineHeight: 'var(--mushaf-line-height, normal)',
        width: 'var(--mushaf-line-width, 100%)',
      }}
    >
      {sortedWords.map((word) => {
        const isAudioHighlighted =
          isPlaying && currentVerseKey === word.verseKey;
        const displayText = word.text_uthmani || word.text || word.code_v2;

        return (
          <span
            key={`${word.id}-${word.position}-${word.verseKey}`}
            className={cn(
              'mushaf-word inline-block transition-colors duration-200',
              isAudioHighlighted && 'text-primary',
            )}
            data-word-position={word.position}
            data-verse-key={word.verseKey}
          >
            {displayText}
          </span>
        );
      })}
    </div>
  );
}
