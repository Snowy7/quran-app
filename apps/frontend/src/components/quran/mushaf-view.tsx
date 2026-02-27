import { useEffect, useMemo, useState, useCallback } from "react";
import { MushafPage } from "./mushaf-page";
import { useChapters } from "@/lib/api/chapters";
import { useLazyLoad } from "@/lib/hooks/use-lazy-load";
import { loadPageFont } from "@/lib/fonts/mushaf-font-loader";
import { useContentWidth, getContentFontScale } from "@/lib/hooks/use-settings";
import type { AnnotatedWord } from "@/lib/fonts/group-lines";

interface MushafViewProps {
  chapterId?: number;
  startPage?: number;
  endPage?: number;
}

interface WordPopupData {
  word: AnnotatedWord;
  x: number;
  y: number;
}

export function MushafView({ chapterId, startPage, endPage }: MushafViewProps) {
  const { data: chapters } = useChapters();
  const chapter = useMemo(
    () => chapters?.find((c) => c.id === chapterId),
    [chapters, chapterId],
  );
  const [wordPopup, setWordPopup] = useState<WordPopupData | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const cw = useContentWidth();
  const fontScale = getContentFontScale(cw);

  const pageRange = useMemo(() => {
    if (typeof startPage === "number") {
      const start = Math.max(1, Math.min(604, startPage));
      const end = Math.max(start, Math.min(604, endPage ?? start));
      return { start, end };
    }

    if (chapter?.pages && chapter.pages.length >= 2) {
      return {
        start: chapter.pages[0],
        end: chapter.pages[1],
      };
    }

    return null;
  }, [chapter, endPage, startPage]);

  // Close popup on outside click/scroll
  useEffect(() => {
    if (!wordPopup) return;
    const close = () => setWordPopup(null);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [wordPopup]);

  const handleWordTap = useCallback((word: AnnotatedWord, rect: DOMRect) => {
    setSelectedWordId(word.id);
    setWordPopup({
      word,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, []);

  const handleDismissPopup = useCallback(() => {
    setWordPopup(null);
    setSelectedWordId(null);
  }, []);

  // Prefetch fonts for the first few pages
  useEffect(() => {
    if (!pageRange) return;
    const pages = Array.from(
      { length: Math.min(3, pageRange.end - pageRange.start + 1) },
      (_, i) => pageRange.start + i,
    );
    pages.forEach((p) => {
      loadPageFont(p).catch(() => {});
    });
  }, [pageRange]);

  if (!pageRange) {
    return (
      <div className="px-6 py-16 text-center text-muted-foreground text-sm">
        Loading mushaf pages...
      </div>
    );
  }

  const pageNumbers = Array.from(
    { length: pageRange.end - pageRange.start + 1 },
    (_, i) => pageRange.start + i,
  );

  return (
    <>
      <div
        className="mushaf-view quran-reader-flow min-h-[calc(100vh-120px)] space-y-2 px-1 py-3 sm:px-3"
        dir="rtl"
        style={
          {
            "--mushaf-font-size": `clamp(22px, 5.1vw, ${Math.round(40 * fontScale)}px)`,
            "--mushaf-line-height": "1.6",
            "--mushaf-line-width": "fit-content",
            "--mushaf-page-width": "fit-content",
          } as Record<string, string>
        }
      >
        {pageNumbers.map((pageNumber) => (
          <MushafPageSlot
            key={pageNumber}
            pageNumber={pageNumber}
            onWordTap={handleWordTap}
            selectedWordId={selectedWordId}
          />
        ))}
      </div>

      {/* Word meaning popup */}
      {wordPopup && (
        <WordMeaningPopup
          word={wordPopup.word}
          x={wordPopup.x}
          y={wordPopup.y}
          onDismiss={handleDismissPopup}
        />
      )}
    </>
  );
}

function MushafPageSlot({
  pageNumber,
  onWordTap,
  selectedWordId,
}: {
  pageNumber: number;
  onWordTap: (word: AnnotatedWord, rect: DOMRect) => void;
  selectedWordId: number | null;
}) {
  const { ref, isVisible } = useLazyLoad({ rootMargin: "700px 0px" });

  return (
    <div ref={ref} data-page-slot={pageNumber}>
      {isVisible ? (
        <MushafPage
          pageNumber={pageNumber}
          onWordTap={onWordTap}
          selectedWordId={selectedWordId}
        />
      ) : (
        <MushafPagePlaceholder pageNumber={pageNumber} />
      )}
    </div>
  );
}

function MushafPagePlaceholder({ pageNumber }: { pageNumber: number }) {
  return (
    <div
      className="mx-auto flex h-full items-center justify-center"
      style={{
        width: "min(98vw, 980px)",
        minHeight: "60vh",
      }}
    >
      <span className="text-xs text-muted-foreground/40 tabular-nums">
        {pageNumber}
      </span>
    </div>
  );
}

function WordMeaningPopup({
  word,
  x,
  y,
  onDismiss,
}: {
  word: AnnotatedWord;
  x: number;
  y: number;
  onDismiss: () => void;
}) {
  const translation = word.translation?.text;
  const transliteration = word.transliteration?.text;
  const arabicText = word.text_uthmani || word.text;

  // If no meaningful data, don't show popup
  if (!translation && !transliteration) {
    return null;
  }

  // Calculate position - above the word, centered
  const popupStyle: React.CSSProperties = {
    position: "fixed",
    left: `${x}px`,
    top: `${y - 8}px`,
    transform: "translate(-50%, -100%)",
    zIndex: 9999,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onDismiss} />
      {/* Popup */}
      <div
        style={popupStyle}
        className="animate-pop-in bg-card border border-border/50 rounded-2xl shadow-elevated px-4 py-3 min-w-[140px] max-w-[220px]"
      >
        {/* Arabic word */}
        <p
          className="text-lg text-foreground text-center leading-relaxed mb-1.5"
          dir="rtl"
          style={{ fontFamily: "'Scheherazade New', 'quran_common', serif" }}
        >
          {arabicText}
        </p>

        {/* Translation */}
        {translation && (
          <p
            className="text-xs text-foreground font-medium text-center"
            dir="ltr"
          >
            {translation}
          </p>
        )}

        {/* Transliteration */}
        {transliteration && (
          <p
            className="text-[10px] text-muted-foreground italic text-center mt-0.5"
            dir="ltr"
          >
            {transliteration}
          </p>
        )}

        {/* Verse reference */}
        <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5 font-medium">
          {word.verseKey}
        </p>
      </div>
    </>
  );
}
