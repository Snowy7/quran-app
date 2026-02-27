import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import { Skeleton } from "@template/ui";
import { useVersesByChapter } from "@/lib/api/verses";
import { useTafsirByChapter, getDefaultTafsirId } from "@/lib/api/tafsirs";
import { saveReadingPosition } from "@/lib/db/reading-history";
import { useTranslation } from "@/lib/i18n";
import { Bismillah } from "./bismillah";
import {
  useReaderSettings,
  useContentWidth,
  getContentFontScale,
} from "@/lib/hooks/use-settings";
import type { Verse, Tafsir } from "@/lib/api/types";

interface TafsirViewProps {
  chapterId: number;
  totalVerses?: number;
  initialVerse?: number;
}

export function TafsirView({
  chapterId,
  totalVerses,
  initialVerse,
}: TafsirViewProps) {
  const { t, language } = useTranslation();
  const tafsirId = getDefaultTafsirId(language);
  const {
    data: versesData,
    isLoading: versesLoading,
    fetchNextPage: fetchNextVerses,
    hasNextPage: hasNextVerses,
    isFetchingNextPage: isFetchingNextVerses,
  } = useVersesByChapter(chapterId);

  const {
    data: tafsirData,
    isLoading: tafsirLoading,
    isError: tafsirError,
    fetchNextPage: fetchNextTafsir,
    hasNextPage: hasNextTafsir,
    isFetchingNextPage: isFetchingNextTafsir,
  } = useTafsirByChapter(tafsirId, chapterId);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(
    initialVerse,
  );
  const hasScrolled = useRef(false);
  const lastSavedVerse = useRef(0);

  const { arabicFontSize, translationFontSize } = useReaderSettings();
  const cw = useContentWidth();
  const scale = getContentFontScale(cw);
  const scaledArabic = Math.round(arabicFontSize * scale);
  const scaledTafsir = Math.round(translationFontSize * scale);

  const allVerses = useMemo(
    () => versesData?.pages.flatMap((page) => page.verses) ?? [],
    [versesData],
  );

  const tafsirMap = useMemo(() => {
    const map = new Map<string, Tafsir>();
    if (tafsirData) {
      for (const page of tafsirData.pages) {
        for (const t of page.tafsirs) {
          map.set(t.verse_key, t);
        }
      }
    }
    return map;
  }, [tafsirData]);

  // Infinite scroll observer — fetch both verses and tafsir
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        if (hasNextVerses && !isFetchingNextVerses) fetchNextVerses();
        if (hasNextTafsir && !isFetchingNextTafsir) fetchNextTafsir();
      }
    },
    [
      fetchNextVerses,
      hasNextVerses,
      isFetchingNextVerses,
      fetchNextTafsir,
      hasNextTafsir,
      isFetchingNextTafsir,
    ],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Scroll to initial verse
  useEffect(() => {
    if (!initialVerse || hasScrolled.current || versesLoading) return;

    const verseKey = `${chapterId}:${initialVerse}`;
    const el = document.getElementById(`verse-${verseKey}`);
    if (el) {
      hasScrolled.current = true;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightedVerse(undefined), 3000);
      });
    }
  }, [initialVerse, chapterId, versesLoading, versesData]);

  // Track visible verse for reading position
  useEffect(() => {
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
        let maxVisible = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const verseNum = parseInt(
              entry.target.id.replace(`verse-${chapterId}:`, ""),
              10,
            );
            if (verseNum > maxVisible) maxVisible = verseNum;
          }
        }

        if (maxVisible > 0 && maxVisible !== lastSavedVerse.current) {
          lastSavedVerse.current = maxVisible;
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            saveReadingPosition(chapterId, maxVisible, "tafsir").catch(
              () => {},
            );
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
  }, [chapterId, allVerses]);

  const isLoading = versesLoading || tafsirLoading;

  if (isLoading) {
    return <TafsirViewSkeleton />;
  }

  if (tafsirError) {
    return (
      <div className="px-5 py-12 text-center text-muted-foreground text-sm">
        {t("failedToLoadTafsir")}
      </div>
    );
  }

  return (
    <div className="quran-reader-flow">
      <Bismillah chapterId={chapterId} />

      {allVerses.map((verse) => (
        <TafsirVerseCard
          key={verse.id}
          verse={verse}
          tafsir={tafsirMap.get(verse.verse_key)}
          chapterId={chapterId}
          isHighlighted={highlightedVerse === verse.verse_number}
          scaledArabic={scaledArabic}
          scaledTafsir={scaledTafsir}
          tafsirLang={language}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-1" />

      {(isFetchingNextVerses || isFetchingNextTafsir) && (
        <div className="space-y-6 px-5 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TafsirVerseCard({
  verse,
  tafsir,
  chapterId,
  isHighlighted,
  scaledArabic,
  scaledTafsir,
  tafsirLang,
}: {
  verse: Verse;
  tafsir?: Tafsir;
  chapterId: number;
  isHighlighted?: boolean;
  scaledArabic: number;
  scaledTafsir: number;
  tafsirLang: string;
}) {
  const verseKey = `${chapterId}:${verse.verse_number}`;

  return (
    <div
      className={`transition-colors duration-500 ${isHighlighted ? "bg-primary/[0.04]" : ""}`}
      id={`verse-${verseKey}`}
    >
      <div className="px-6 py-6">
        {/* Verse number badge */}
        <div className="mb-5 flex flex-row-reverse items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold tabular-nums bg-primary/8 text-primary">
            {verse.verse_number}
          </div>
        </div>

        {/* Arabic text */}
        <p
          className="mb-5 text-right leading-[2.3] text-foreground"
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: "'Scheherazade New', 'quran_common', serif",
            fontSize: `${scaledArabic}px`,
          }}
        >
          {verse.text_uthmani}
        </p>

        {/* Tafsir content */}
        {tafsir ? (
          <div
            className={`tafsir-content leading-[1.9] text-muted-foreground ${tafsirLang === "ar" ? "text-right" : "text-left"}`}
            dir={tafsirLang === "ar" ? "rtl" : "ltr"}
            style={{ fontSize: `${scaledTafsir}px` }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(tafsir.text),
            }}
          />
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        )}

        {/* Source label */}
        {tafsir?.resource_name && (
          <p className="mt-3 text-[11px] text-muted-foreground/50">
            {tafsir.resource_name}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-6 border-b border-border/30" />
    </div>
  );
}

function TafsirViewSkeleton() {
  return (
    <div className="space-y-6 px-5 py-6">
      {/* Bismillah skeleton */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex-1 h-px bg-border" />
        <Skeleton className="h-8 w-48" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Verse + tafsir skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6 ml-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="h-px bg-border mt-2" />
        </div>
      ))}
    </div>
  );
}
