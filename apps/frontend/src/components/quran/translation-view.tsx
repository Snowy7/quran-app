import { useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@template/ui';
import { useVersesByChapter } from '@/lib/api/verses';
import { Bismillah } from './bismillah';
import { VerseCard } from './verse-card';

interface TranslationViewProps {
  chapterId: number;
}

export function TranslationView({ chapterId }: TranslationViewProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVersesByChapter(chapterId);

  const loadMoreRef = useRef<HTMLDivElement>(null);

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
    <div>
      <Bismillah chapterId={chapterId} />

      {allVerses.map((verse) => (
        <VerseCard
          key={verse.id}
          verse={verse}
          chapterNumber={chapterId}
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
