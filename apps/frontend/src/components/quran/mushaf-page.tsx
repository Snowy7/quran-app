import { Fragment } from 'react';
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

export function MushafPage({ pageNumber, chapters }: MushafPageProps) {
  const { data: verses, isLoading } = useVersesByPage(pageNumber);
  const fontLoaded = usePageFont(pageNumber);

  if (isLoading || !verses) {
    return <MushafPageSkeleton pageNumber={pageNumber} />;
  }

  if (verses.length === 0) {
    return null;
  }

  const lines = groupWordsByLine(verses);

  return (
    <div
      className="mushaf-page-container relative bg-card border border-border/30 rounded-lg mx-auto overflow-hidden"
      style={{
        maxWidth: 'var(--mushaf-page-width, 440px)',
        aspectRatio: '3 / 4.5',
      }}
      data-page={pageNumber}
    >
      {/* Page content area */}
      <div className="flex flex-col justify-between h-full px-4 py-5 sm:px-6 sm:py-6">
        {/* Lines */}
        <div className="flex-1 flex flex-col justify-center gap-0">
          {lines.map((line) => (
            <Fragment key={line.lineNumber}>
              {/* Surah header: appears when a new chapter starts on this page */}
              {line.startsNewChapter && line.newChapterId && (
                <MushafChapterHeader
                  chapterId={line.newChapterId}
                  chapters={chapters}
                  hasBismillah={
                    line.newChapterId !== 1 && line.newChapterId !== 9
                  }
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

        {/* Page number footer */}
        <div className="text-center mt-3 pt-2 border-t border-border/20">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Decorative surah header inserted when a new chapter starts on a mushaf page.
 * Renders the surah name in a decorative frame, plus bismillah if applicable.
 */
function MushafChapterHeader({
  chapterId,
  chapters,
  hasBismillah,
}: {
  chapterId: number;
  chapters?: Chapter[];
  hasBismillah: boolean;
}) {
  const chapter = chapters?.find((c) => c.id === chapterId);
  const surahName = chapter?.name_arabic ?? `سورة ${chapterId}`;

  return (
    <div className="mushaf-surah-header my-2">
      {/* Decorative surah name banner */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary/20" />
        </div>
        <div className="relative bg-card px-4">
          <span
            className="text-base text-primary font-medium"
            dir="rtl"
            style={{
              fontFamily: "'surah_names', serif",
              fontSize: '24px',
              lineHeight: 'normal',
            }}
          >
            {/* Surah names font maps chapter numbers to decorative names */}
            {surahName}
          </span>
        </div>
      </div>

      {/* Bismillah */}
      {hasBismillah && (
        <div className="text-center py-1">
          <span
            className="text-foreground/80"
            dir="rtl"
            style={{
              fontFamily: "'bismillah', serif",
              fontSize: '28px',
              lineHeight: 'normal',
            }}
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </span>
        </div>
      )}
    </div>
  );
}

function MushafPageSkeleton({ pageNumber }: { pageNumber: number }) {
  return (
    <div
      className="mushaf-page-container bg-card border border-border/30 rounded-lg mx-auto overflow-hidden"
      style={{
        maxWidth: 'var(--mushaf-page-width, 440px)',
        aspectRatio: '3 / 4.5',
      }}
    >
      <div className="flex flex-col justify-between h-full px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex-1 flex flex-col justify-center gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-5 w-full rounded"
              style={{ opacity: 0.3 + (i % 3) * 0.1 }}
            />
          ))}
        </div>
        <div className="text-center mt-3 pt-2 border-t border-border/20">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
}
