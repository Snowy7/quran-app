import { cn } from '@/lib/utils';
import { getPageFontFamily } from '@/lib/fonts/mushaf-font-loader';
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
  pageNumber,
  lineNumber,
  fontLoaded,
}: MushafLineProps) {
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const fontFamily = fontLoaded
    ? `'${getPageFontFamily(pageNumber)}'`
    : "'quran_common', serif";

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
      data-page={pageNumber}
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
        const displayText =
          fontLoaded
            ? word.code_v2 || word.text_uthmani || word.text
            : word.text_uthmani || word.code_v2 || word.text;

        return (
          <span
            key={`${word.id}-${word.position}-${word.verseKey}`}
            className={cn(
              'mushaf-word inline-block transition-colors duration-200',
              isAudioHighlighted && 'text-primary',
              !fontLoaded && 'opacity-40',
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
