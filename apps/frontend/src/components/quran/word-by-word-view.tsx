import { useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@template/ui';
import { useVersesByChapter } from '@/lib/api/verses';
import { Bismillah } from './bismillah';
import type { Word, Verse } from '@/lib/api/types';

interface WordByWordViewProps {
  chapterId: number;
}

export function WordByWordView({ chapterId }: WordByWordViewProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVersesByChapter(chapterId, { words: true });

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

  if (isLoading) return <WordByWordSkeleton />;

  if (isError) {
    return (
      <div className="px-5 py-12 text-center text-muted-foreground text-sm">
        Failed to load verses. Please try again.
      </div>
    );
  }

  const allVerses = data?.pages.flatMap((page) => page.verses) ?? [];

  return (
    <div className="quran-reader-flow" dir="rtl">
      <Bismillah chapterId={chapterId} />

      {allVerses.map((verse) => (
        <VerseWordsRow key={verse.id} verse={verse} />
      ))}

      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && <WordByWordSkeleton count={2} />}
    </div>
  );
}

function VerseWordsRow({ verse }: { verse: Verse }) {
  const words = verse.words ?? [];
  const contentWords = words.filter((w) => w.char_type_name === 'word' || w.char_type_name === 'end');

  return (
    <div className="border-b border-border/40 px-5 py-5 md:px-8" dir="rtl">
      {/* Verse number */}
      <div className="mb-4 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 text-xs font-semibold tabular-nums text-primary">
        {verse.verse_number}
      </div>

      {/* Word grid - RTL flex wrap */}
      <div className="flex flex-wrap gap-3 justify-end" dir="rtl">
        {contentWords.map((word) => (
          <WordCard key={word.id} word={word} />
        ))}
      </div>
    </div>
  );
}

function WordCard({ word }: { word: Word }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[70px] py-2 px-2 rounded-lg hover:bg-secondary/60 transition-colors cursor-default">
      {/* Arabic word */}
      <span
        className="text-xl leading-relaxed text-foreground"
        dir="rtl"
        lang="ar"
        style={{ fontFamily: "'Scheherazade New', 'quran_common', serif" }}
      >
        {word.text_uthmani || word.text || word.code_v2}
      </span>

      {/* Translation */}
      {word.translation?.text && (
        <span
          className="max-w-[80px] text-center text-[10px] leading-tight text-muted-foreground"
          dir="ltr"
        >
          {word.translation.text}
        </span>
      )}

      {/* Transliteration */}
      {word.transliteration?.text && (
        <span
          className="max-w-[80px] text-center text-[10px] italic leading-tight text-primary/60"
          dir="ltr"
        >
          {word.transliteration.text}
        </span>
      )}
    </div>
  );
}

function WordByWordSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6 px-5 py-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="flex flex-wrap gap-3 justify-end" dir="rtl">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
