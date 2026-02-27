import { Fragment, useMemo } from "react";
import { Skeleton } from "@template/ui";
import { useVersesByPage } from "@/lib/api/verses";
import { usePageFont } from "@/lib/fonts/mushaf-font-loader";
import { groupWordsByLine } from "@/lib/fonts/group-lines";
import { MushafLine } from "./mushaf-line";
import { BismillahSvg } from "./bismillah";
import type { AnnotatedWord } from "@/lib/fonts/group-lines";

interface MushafPageProps {
  pageNumber: number;
  onWordTap?: (word: AnnotatedWord, rect: DOMRect) => void;
  selectedWordId?: number | null;
}

export function MushafPage({
  pageNumber,
  onWordTap,
  selectedWordId,
}: MushafPageProps) {
  const { data: verses, isLoading } = useVersesByPage(pageNumber, {
    words: true,
    wordFields:
      "code_v2,code_v1,text_uthmani,v2_page,page_number,line_number,position,translation,transliteration",
  });
  const fontLoaded = usePageFont(pageNumber);

  const lines = useMemo(
    () => (verses ? groupWordsByLine(verses) : []),
    [verses],
  );

  if (isLoading || !verses) {
    return <MushafPageSkeleton pageNumber={pageNumber} />;
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <article
      className="mx-auto"
      style={{
        width: "var(--mushaf-page-width, fit-content)",
        maxWidth: "min(98vw, 980px)",
      }}
      data-page={pageNumber}
      aria-label={`Mushaf page ${pageNumber}`}
    >
      <div className="flex h-full w-full flex-col justify-between px-3 py-4 sm:px-6 sm:py-6">
        {/* Lines */}
        <div className="mushaf-page-lines flex flex-1 flex-col items-end justify-start gap-1 overflow-visible">
          {lines.map((line) => (
            <Fragment key={line.lineNumber}>
              {line.startsNewChapter && line.newChapterId && (
                <MushafChapterHeader
                  chapterId={line.newChapterId}
                  showBismillah={
                    line.newChapterId !== 1 && line.newChapterId !== 9
                  }
                />
              )}

              <MushafLine
                words={line.words}
                pageNumber={pageNumber}
                lineNumber={line.lineNumber}
                fontLoaded={fontLoaded}
                onWordTap={onWordTap}
                selectedWordId={selectedWordId}
              />
            </Fragment>
          ))}
        </div>

        {/* Page number */}
        <footer className="mt-4 pt-3 border-t border-border/30 text-center">
          <span className="text-[10px] tabular-nums tracking-[0.15em] font-medium text-muted-foreground/50">
            {pageNumber}
          </span>
        </footer>
      </div>
    </article>
  );
}

function MushafChapterHeader({
  chapterId,
  showBismillah,
}: {
  chapterId: number;
  showBismillah: boolean;
}) {
  return (
    <div className="w-full my-4">
      {/* Surah name with decorative lines */}
      <div className="relative flex items-center justify-center py-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary/20" />
        </div>
        <div className="relative bg-background px-6">
          <span
            className="text-2xl text-primary"
            dir="rtl"
            style={{
              fontFamily:
                "'surah_names', 'Scheherazade New', 'quran_common', serif",
              lineHeight: "1.6",
            }}
          >
            {String(chapterId).padStart(3, "0")}
          </span>
        </div>
      </div>

      {/* Bismillah */}
      {showBismillah && (
        <div className="py-3 flex justify-center">
          <BismillahSvg className="h-[24px] w-auto text-foreground/80" />
        </div>
      )}
    </div>
  );
}

function MushafPageSkeleton({ pageNumber }: { pageNumber: number }) {
  return (
    <div
      className="mx-auto"
      style={{
        width: "min(98vw, 980px)",
        minHeight: "60vh",
      }}
    >
      <div className="flex h-full flex-col justify-between px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex-1 flex flex-col justify-center gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-5 w-full rounded"
              style={{ opacity: 0.2 + (i % 3) * 0.05 }}
            />
          ))}
        </div>
        <footer className="text-center mt-3 pt-3 border-t border-border/20">
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">
            {pageNumber}
          </span>
        </footer>
      </div>
    </div>
  );
}
