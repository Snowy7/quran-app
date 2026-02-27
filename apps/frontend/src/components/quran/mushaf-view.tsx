import { useMemo } from 'react';
import { MushafPage } from './mushaf-page';
import { useChapters } from '@/lib/api/chapters';
import { useLazyLoad } from '@/lib/hooks/use-lazy-load';

interface MushafViewProps {
  chapterId?: number;
  startPage?: number;
  endPage?: number;
}

export function MushafView({ chapterId, startPage, endPage }: MushafViewProps) {
  const { data: chapters } = useChapters();
  const chapter = useMemo(
    () => chapters?.find((c) => c.id === chapterId),
    [chapters, chapterId],
  );

  const pageRange = useMemo(() => {
    if (typeof startPage === 'number') {
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

  if (!pageRange) {
    return (
      <div className="px-5 py-12 text-center text-muted-foreground text-sm">
        Loading mushaf pages...
      </div>
    );
  }

  const pageNumbers = Array.from(
    { length: pageRange.end - pageRange.start + 1 },
    (_, i) => pageRange.start + i,
  );

  return (
    <div
      className="mushaf-view quran-reader-flow min-h-[calc(100vh-120px)] space-y-4 px-3 py-5 sm:px-4"
      dir="rtl"
      style={{
        '--mushaf-font-size': 'clamp(20px, 1.6vw, 24px)',
        '--mushaf-line-height': 'normal',
        '--mushaf-line-width': '90%',
        '--mushaf-page-width': 'min(95vw, 720px)',
      } as Record<string, string>}
    >
      {pageNumbers.map((pageNumber) => (
        <MushafPageSlot key={pageNumber} pageNumber={pageNumber} chapters={chapters} />
      ))}
    </div>
  );
}

function MushafPageSlot({
  pageNumber,
  chapters,
}: {
  pageNumber: number;
  chapters?: ReturnType<typeof useChapters>['data'];
}) {
  const { ref, isVisible } = useLazyLoad({ rootMargin: '700px 0px' });

  return (
    <div ref={ref} data-page-slot={pageNumber}>
      {isVisible ? (
        <MushafPage pageNumber={pageNumber} chapters={chapters} />
      ) : (
        <MushafPagePlaceholder pageNumber={pageNumber} />
      )}
    </div>
  );
}

function MushafPagePlaceholder({ pageNumber }: { pageNumber: number }) {
  return (
    <div
      className="mx-auto flex h-full items-center justify-center rounded-xl border border-border/20 bg-card/50"
      style={{ width: 'var(--mushaf-page-width, min(95vw, 720px))', aspectRatio: '3 / 4.5' }}
    >
      <span className="text-xs text-muted-foreground/60 tabular-nums">Page {pageNumber}</span>
    </div>
  );
}
