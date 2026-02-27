import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getPageFontFamily } from '@/lib/fonts/mushaf-font-loader';
import { isCenterAlignedLine } from '@/lib/fonts/page-alignment';
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
  const lineRef = useRef<HTMLDivElement>(null);
  const [lineScale, setLineScale] = useState(1);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const fontFamily = fontLoaded
    ? `'${getPageFontFamily(pageNumber)}'`
    : "'quran_common', serif";

  const lineWords = words;
  const centerAligned = isCenterAlignedLine(pageNumber, lineNumber);

  useLayoutEffect(() => {
    const node = lineRef.current;
    if (!node) return;

    const fitLine = () => {
      const available = node.clientWidth;
      const content = node.scrollWidth;
      if (!available || !content) {
        setLineScale(1);
        return;
      }

      const rawScale = available / content;
      const nextScale = rawScale >= 0.99 ? 1 : Math.max(0.93, rawScale);
      setLineScale((prev) => (Math.abs(prev - nextScale) > 0.003 ? nextScale : prev));
    };

    fitLine();
    const observer = new ResizeObserver(fitLine);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [centerAligned, fontLoaded, lineNumber, pageNumber, words]);

  return (
    <div
      ref={lineRef}
      className={cn(
        'mushaf-line mx-auto flex w-full flex-nowrap items-end px-1 py-0.5',
        centerAligned && 'justify-center',
      )}
      dir="rtl"
      data-line={lineNumber}
      data-page={pageNumber}
      style={{
        fontFamily,
        fontSize: 'var(--mushaf-font-size, 42px)',
        lineHeight: 'var(--mushaf-line-height, 1.88)',
        width: 'var(--mushaf-line-width, 100%)',
        maxWidth: '100%',
        justifyContent: centerAligned ? 'center' : 'flex-start',
        columnGap: '0.08em',
        transform: lineScale < 1 ? `scaleX(${lineScale})` : undefined,
        transformOrigin: centerAligned ? 'center center' : 'right center',
      }}
    >
      {lineWords.map((word) => {
        const isAudioHighlighted = isPlaying && currentVerseKey === word.verseKey;
        const displayText = fontLoaded
          ? word.code_v2 || word.text_uthmani || word.text
          : word.text_uthmani || word.text || word.code_v2;

        return (
          <span
            key={`${word.id}-${word.position}-${word.verseKey}`}
            className={cn(
              'mushaf-word inline-block whitespace-nowrap align-baseline transition-colors duration-200',
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
