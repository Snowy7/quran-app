import { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@template/ui';
import { useVersesByChapter } from '@/lib/api/verses';
import { saveReadingPosition } from '@/lib/db/reading-history';
import { Bismillah } from './bismillah';
import { VerseCard } from './verse-card';

interface TranslationViewProps {
  chapterId: number;
  totalVerses?: number;
  initialVerse?: number;
}

export function TranslationView({ chapterId, totalVerses, initialVerse }: TranslationViewProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVersesByChapter(chapterId);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(initialVerse);
  const hasScrolled = useRef(false);
  const lastSavedVerse = useRef(0);

  // Infinite scroll observer
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Scroll to initial verse once data is loaded
  useEffect(() => {
    if (!initialVerse || hasScrolled.current || isLoading) return;

    const verseKey = `${chapterId}:${initialVerse}`;
    const el = document.getElementById(`verse-${verseKey}`);
    if (el) {
      hasScrolled.current = true;
      // Small delay to ensure layout is settled
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedVerse(undefined), 3000);
      });
    }
  }, [initialVerse, chapterId, isLoading, data]);

  // Track visible verse for reading position (debounced)
  useEffect(() => {
    const allVerses = data?.pages.flatMap((page) => page.verses) ?? [];
    if (allVerses.length === 0) return;

    const verseElements = allVerses
      .map((v) => ({
        verseNumber: v.verse_number,
        el: document.getElementById(`verse-${chapterId}:${v.verse_number}`),
      }))
      .filter((v) => v.el !== null);

    if (verseElements.length === 0) return;

    let saveTimeout: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the highest verse number that's currently visible
        let maxVisible = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const verseNum = parseInt(
              entry.target.id.replace(`verse-${chapterId}:`, ''),
              10,
            );
            if (verseNum > maxVisible) maxVisible = verseNum;
          }
        }

        if (maxVisible > 0 && maxVisible !== lastSavedVerse.current) {
          lastSavedVerse.current = maxVisible;
          // Debounce: save after 2 seconds of no further scroll
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            saveReadingPosition(chapterId, maxVisible, 'translation').catch(() => {});
          }, 2000);
        }
      },
      { threshold: 0.5 },
    );

    for (const { el } of verseElements) {
      if (el) observer.observe(el);
    }

    return () => {
      clearTimeout(saveTimeout);
      observer.disconnect();
    };
  }, [chapterId, data]);

  if (isLoading) {
    return <TranslationViewSkeleton />;
  }

  if (isError) {
    return (
      <div className="px-5 py-12 text-center text-muted-foreground text-sm">
        Failed to load verses. Please try again.
      </div>
    );
  }

  const allVerses = data?.pages.flatMap((page) => page.verses) ?? [];

  return (
    <div className="quran-reader-flow">
      <Bismillah chapterId={chapterId} />

      {allVerses.map((verse) => (
        <VerseCard
          key={verse.id}
          verse={verse}
          chapterNumber={chapterId}
          totalVerses={totalVerses}
          isHighlighted={highlightedVerse === verse.verse_number}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="space-y-6 px-5 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TranslationViewSkeleton() {
  return (
    <div className="space-y-6 px-5 py-6">
      {/* Bismillah skeleton */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex-1 h-px bg-border" />
        <Skeleton className="h-8 w-48" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Verse skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6 ml-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="h-px bg-border mt-2" />
        </div>
      ))}
    </div>
  );
}
