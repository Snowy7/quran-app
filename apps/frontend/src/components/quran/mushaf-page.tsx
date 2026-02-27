import { Fragment, useMemo } from 'react';
import { Skeleton } from '@template/ui';
import { useVersesByPage } from '@/lib/api/verses';
import { usePageFont } from '@/lib/fonts/mushaf-font-loader';
import { groupWordsByLine } from '@/lib/fonts/group-lines';
import { MushafLine } from './mushaf-line';
import type { Chapter } from '@/lib/api/types';

interface MushafPageProps {
  pageNumber: number;
  chapters?: Chapter[];
}

const BISMILLAH_TEXT =
  '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0650\u064a\u0645\u0650';

const PAGE_STYLES = {
  container:
    'relative bg-card border border-border/40 rounded-xl mx-auto overflow-hidden shadow-sm',
  content: 'flex h-full w-full flex-col justify-between px-4 py-5 sm:px-6 sm:py-7',
  lines: 'flex-1 flex flex-col justify-center gap-1',
} as const;

export function MushafPage({ pageNumber, chapters }: MushafPageProps) {
  const { data: verses, isLoading } = useVersesByPage(pageNumber, {
    words: true,
    wordFields: 'code_v2,code_v1,text_uthmani,v2_page,page_number,line_number,position',
  });
  const fontLoaded = usePageFont(pageNumber);

  const lines = useMemo(() => (verses ? groupWordsByLine(verses) : []), [verses]);

  if (isLoading || !verses) {
    return <MushafPageSkeleton pageNumber={pageNumber} />;
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <article
      className={PAGE_STYLES.container}
      style={{
        width: 'var(--mushaf-page-width, min(95vw, 720px))',
        aspectRatio: '3 / 4.5',
      }}
      data-page={pageNumber}
      aria-label={`Mushaf page ${pageNumber}`}
    >
      <div className={PAGE_STYLES.content}>
        <div className={PAGE_STYLES.lines}>
          {lines.map((line) => (
            <Fragment key={line.lineNumber}>
              {line.startsNewChapter && line.newChapterId && (
                <MushafChapterHeader
                  chapterId={line.newChapterId}
                  chapters={chapters}
                  showBismillah={line.newChapterId !== 1 && line.newChapterId !== 9}
                />
              )}

              <MushafLine
                words={line.words}
                pageNumber={pageNumber}
                lineNumber={line.lineNumber}
                fontLoaded={fontLoaded}
              />
            </Fragment>
          ))}
        </div>

        <footer className="text-center mt-3 pt-3 border-t border-border/20">
          <span className="text-[11px] text-muted-foreground tabular-nums">Page {pageNumber}</span>
        </footer>
      </div>
    </article>
  );
}

function MushafChapterHeader({
  chapterId,
  chapters,
  showBismillah,
}: {
  chapterId: number;
  chapters?: Chapter[];
  showBismillah: boolean;
}) {
  const chapter = chapters?.find((c) => c.id === chapterId);
  const surahName = chapter?.name_arabic ?? `Surah ${chapterId}`;

  return (
    <div className="mushaf-surah-header my-2">
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary/20" />
        </div>
        <div className="relative bg-card px-4">
          <span
            className="text-lg font-medium text-primary"
            dir="rtl"
            style={{
              fontFamily: "'surah_names', 'Scheherazade New', 'quran_common', serif",
              lineHeight: 'normal',
            }}
          >
            {surahName}
          </span>
        </div>
      </div>

      {showBismillah && (
        <p
          className="text-center py-1 text-foreground/80"
          dir="rtl"
          style={{
            fontFamily: "'Scheherazade New', 'quran_common', serif",
            fontSize: '28px',
            lineHeight: 'normal',
          }}
        >
          {BISMILLAH_TEXT}
        </p>
      )}
    </div>
  );
}

function MushafPageSkeleton({ pageNumber }: { pageNumber: number }) {
  return (
    <div
      className={`${PAGE_STYLES.container} mx-auto`}
      style={{
        width: 'var(--mushaf-page-width, min(95vw, 720px))',
        aspectRatio: '3 / 4.5',
      }}
    >
      <div className={PAGE_STYLES.content}>
        <div className="flex-1 flex flex-col justify-center gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-5 w-full rounded"
              style={{ opacity: 0.35 + (i % 3) * 0.07 }}
            />
          ))}
        </div>
        <footer className="text-center mt-3 pt-3 border-t border-border/20">
          <span className="text-[11px] text-muted-foreground tabular-nums">Page {pageNumber}</span>
        </footer>
      </div>
    </div>
  );
}
