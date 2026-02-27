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

  return (
    <div
      className="mushaf-line flex justify-between items-start mx-auto"
      dir="rtl"
      data-line={lineNumber}
      style={{
        fontFamily,
        fontSize: 'var(--mushaf-font-size, 28px)',
        lineHeight: 'var(--mushaf-line-height, normal)',
        width: 'var(--mushaf-line-width, 100%)',
      }}
    >
      {words.map((word) => {
        const isAudioHighlighted =
          isPlaying && currentVerseKey === word.verseKey;

        return (
          <span
            key={`${word.id}-${word.position}`}
            className={cn(
              'mushaf-word inline-block transition-colors duration-200',
              isAudioHighlighted && 'text-primary',
              !fontLoaded && 'opacity-40',
            )}
            data-word-position={word.position}
            data-verse-key={word.verseKey}
          >
            {fontLoaded ? word.code_v2 : word.text || word.code_v2}
          </span>
        );
      })}
    </div>
  );
}
