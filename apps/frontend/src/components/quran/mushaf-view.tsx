import { useMemo } from 'react';
import { MushafPage } from './mushaf-page';
import { useChapters } from '@/lib/api/chapters';
import { useLazyLoad } from '@/lib/hooks/use-lazy-load';

interface MushafViewProps {
  chapterId: number;
  startPage?: number;
  endPage?: number;
}

/**
 * Mushaf (physical Quran) reading view.
 *
 * Renders a sequence of mushaf pages for the given chapter.
 * Each page is loaded on demand as it enters the viewport.
 * Follows quran.com's approach: per-page QCF V2 fonts,
 * words grouped by line, RTL flex layout.
 */
export function MushafView({ chapterId, startPage, endPage }: MushafViewProps) {
  const { data: chapters } = useChapters();
  const chapter = chapters?.find((c) => c.id === chapterId);

  // Get the page range for this chapter
  const pageRange = useMemo(() => {
    if (startPage && endPage) {
      return { start: startPage, end: endPage };
    }
    if (chapter?.pages && chapter.pages.length >= 2) {
      return { start: chapter.pages[0], end: chapter.pages[1] };
    }
    return null;
  }, [chapter, startPage, endPage]);

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
      className="mushaf-view space-y-4 px-3 py-4 sm:px-4"
      style={
        {
          '--mushaf-font-size': '28px',
          '--mushaf-line-height': 'normal',
          '--mushaf-line-width': '100%',
          '--mushaf-page-width': '440px',
        } as React.CSSProperties
      }
    >
      {pageNumbers.map((pageNumber) => (
        <MushafPageSlot
          key={pageNumber}
          pageNumber={pageNumber}
          chapters={chapters}
        />
      ))}
    </div>
  );
}

/**
 * Wraps a MushafPage in a lazy-load slot.
 * The actual page only renders when the slot enters the viewport.
 */
function MushafPageSlot({
  pageNumber,
  chapters,
}: {
  pageNumber: number;
  chapters?: ReturnType<typeof useChapters>['data'];
}) {
  const { ref, isVisible } = useLazyLoad({ rootMargin: '600px 0px' });

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
      className="bg-card/50 border border-border/20 rounded-lg mx-auto flex items-center justify-center"
      style={{
        maxWidth: 'var(--mushaf-page-width, 440px)',
        aspectRatio: '3 / 4.5',
      }}
    >
      <span className="text-xs text-muted-foreground/50 tabular-nums">
        Page {pageNumber}
      </span>
    </div>
  );
}
