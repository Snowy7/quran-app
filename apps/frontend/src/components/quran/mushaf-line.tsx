import { cn } from "@/lib/utils";
import { getPageFontFamily } from "@/lib/fonts/mushaf-font-loader";
import { isCenterAlignedLine } from "@/lib/fonts/page-alignment";
import type { AnnotatedWord } from "@/lib/fonts/group-lines";
import { useAudioStore } from "@/lib/stores/audio-store";

interface MushafLineProps {
  words: AnnotatedWord[];
  pageNumber: number;
  lineNumber: number;
  fontLoaded: boolean;
  onWordTap?: (word: AnnotatedWord, rect: DOMRect) => void;
  selectedWordId?: number | null;
}

export function MushafLine({
  words,
  pageNumber,
  lineNumber,
  fontLoaded,
  onWordTap,
  selectedWordId,
}: MushafLineProps) {
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const fontFamily = fontLoaded
    ? `'${getPageFontFamily(pageNumber)}'`
    : "'quran_common', serif";

  const lineWords = words;
  const centerAligned = isCenterAlignedLine(pageNumber, lineNumber);

  return (
    <div
      className={cn(
        "mushaf-line flex max-w-full shrink-0 flex-nowrap items-end px-1 py-0.5",
        centerAligned ? "self-center justify-center" : "self-end justify-start",
      )}
      dir="rtl"
      data-line={lineNumber}
      data-page={pageNumber}
      style={{
        fontFamily,
        fontSize: "var(--mushaf-font-size, 34px)",
        lineHeight: "var(--mushaf-line-height, 1.55)",
        width: "fit-content",
        maxWidth: "100%",
        justifyContent: centerAligned ? "center" : "flex-start",
        columnGap: "0.02em",
      }}
    >
      {lineWords.map((word) => {
        const isAudioHighlighted =
          isPlaying && currentVerseKey === word.verseKey;
        const isSelected = selectedWordId === word.id;
        const displayText = fontLoaded
          ? word.code_v2 || word.text_uthmani || word.text
          : word.text_uthmani || word.text || word.code_v2;

        return (
          <span
            key={`${word.id}-${word.position}-${word.verseKey}`}
            className={cn(
              "mushaf-word inline-block whitespace-nowrap align-baseline transition-all duration-200",
              isAudioHighlighted && "text-primary",
              isSelected && "text-primary scale-110",
              !fontLoaded && "opacity-40",
              onWordTap && "cursor-pointer active:text-primary/70",
            )}
            data-word-position={word.position}
            data-verse-key={word.verseKey}
            onClick={
              onWordTap
                ? (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onWordTap(word, rect);
                  }
                : undefined
            }
          >
            {displayText}
          </span>
        );
      })}
    </div>
  );
}
