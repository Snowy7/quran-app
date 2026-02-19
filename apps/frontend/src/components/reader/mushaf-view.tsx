import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { Bookmark, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFontStyle } from "@/components/reader/reading-settings-sheet";
import {
  getPageGroupedBySurah,
  getVersePageNumber,
  getVerseMeta,
  getArabicSurah,
} from "@/data/quran-data";
import { BISMILLAH, SURAH_WITHOUT_BISMILLAH } from "@/data/surahs";
import { useIsBookmarked, useOfflineBookmarks } from "@/lib/hooks";
import { toast } from "sonner";

interface MushafViewProps {
  surahId: number;
  startPage?: number;
  arabicFontSize: number;
  arabicFontFamily: string;
  textColorMode?: string;
  readingWidth?: number;
  lineHeight?: number;
  wordSpacing?: number;
  letterSpacing?: number;
  currentPlayingAyah: number | null;
  playingSurahId: number | null;
  onAyahVisible: (surahId: number, ayahNumber: number) => void;
  onAyahClick: (surahId: number, ayahNumber: number) => void;
  onPageChange?: (page: number) => void;
}

// Arabic number converter
function toArabicNumber(num: number): string {
  const arabicNums = [
    "\u0660",
    "\u0661",
    "\u0662",
    "\u0663",
    "\u0664",
    "\u0665",
    "\u0666",
    "\u0667",
    "\u0668",
    "\u0669",
  ];
  return num
    .toString()
    .split("")
    .map((d) => arabicNums[parseInt(d)])
    .join("");
}

// Verse end marker — clean ornamental style
function AyahEndMarker({ number }: { number: number }) {
  return (
    <span className="inline-flex items-center justify-center mx-0.5 select-none align-middle text-[hsl(var(--mushaf-ornament))]">
      <span
        className="relative flex items-center justify-center"
        style={{ fontFamily: "Amiri Quran, serif" }}
      >
        <span className="text-[0.55em] opacity-70">{"\uFD3F"}</span>
        <span
          className="text-[0.48em] mx-px"
          style={{ fontFamily: "Amiri, serif" }}
        >
          {toArabicNumber(number)}
        </span>
        <span className="text-[0.55em] opacity-70">{"\uFD3E"}</span>
      </span>
    </span>
  );
}

// Surah header within a page
function SurahHeaderInPage({
  name,
  arabicName,
}: {
  name: string;
  arabicName: string;
}) {
  return (
    <div className="my-6 mx-auto max-w-[90%]">
      <div className="relative overflow-hidden rounded-xl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--mushaf-ornament)/0.06)] via-[hsl(var(--mushaf-ornament)/0.1)] to-[hsl(var(--mushaf-ornament)/0.06)]" />
        <div className="absolute inset-0 border border-[hsl(var(--mushaf-ornament)/0.15)] rounded-xl" />

        <div className="relative z-10 text-center py-4 px-6">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[hsl(var(--mushaf-ornament)/0.25)]" />
            <div>
              <p className="arabic-text text-xl text-[hsl(var(--mushaf-ornament))] leading-normal">
                {arabicName}
              </p>
              <p className="text-[9px] text-muted-foreground/60 font-medium tracking-widest uppercase mt-2">
                {name}
              </p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[hsl(var(--mushaf-ornament)/0.25)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Bismillah
function BismillahInPage({ fontSize }: { fontSize: number }) {
  return (
    <div className="text-center my-3">
      <p
        className="arabic-text inline-block text-[hsl(var(--mushaf-text))] opacity-75"
        style={{ fontSize: `${fontSize * 0.8}px`, lineHeight: 2 }}
      >
        {BISMILLAH}
      </p>
    </div>
  );
}

// Bookmark button — appears on hover over a verse
function VerseBookmarkButton({
  surahId,
  ayahNumber,
}: {
  surahId: number;
  ayahNumber: number;
}) {
  const { isBookmarked } = useIsBookmarked(surahId, ayahNumber);
  const { addBookmark, removeBookmark, getBookmark } = useOfflineBookmarks();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isBookmarked) {
        getBookmark(surahId, ayahNumber)
          .then((b) => {
            if (b) return removeBookmark(b.clientId);
          })
          .then(() => toast.success("Bookmark removed"));
      } else {
        addBookmark(surahId, ayahNumber).then(() =>
          toast.success("Bookmark added"),
        );
      }
    },
    [
      isBookmarked,
      surahId,
      ayahNumber,
      getBookmark,
      removeBookmark,
      addBookmark,
    ],
  );

  return (
    <button
      onClick={handleClick}
      className={cn(
        "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "bg-background/90 backdrop-blur-sm shadow-sm border border-border/40",
        isBookmarked && "opacity-100",
      )}
    >
      {isBookmarked ? (
        <BookMarked className="w-3 h-3 text-[hsl(var(--mushaf-active))] fill-[hsl(var(--mushaf-active))]" />
      ) : (
        <Bookmark className="w-3 h-3 text-muted-foreground/50" />
      )}
    </button>
  );
}

// ─── Single Mushaf Page ─────────────────────────────────────────────

function MushafPage({
  pageNumber,
  surahId: filterSurahId,
  arabicFontSize,
  arabicFontFamily,
  textColorMode,
  lineHeight: lineHeightOverride,
  wordSpacing: wordSpacingOverride,
  letterSpacing: letterSpacingOverride,
  currentPlayingAyah,
  playingSurahId,
  onAyahVisible,
  onAyahClick,
  onPageVisible,
}: {
  pageNumber: number;
  surahId?: number;
  arabicFontSize: number;
  arabicFontFamily: string;
  textColorMode?: string;
  lineHeight?: number;
  wordSpacing?: number;
  letterSpacing?: number;
  currentPlayingAyah: number | null;
  playingSurahId: number | null;
  onAyahVisible: (surahId: number, ayahNumber: number) => void;
  onAyahClick: (surahId: number, ayahNumber: number) => void;
  onPageVisible?: (page: number) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const groups = useMemo(() => {
    const allGroups = getPageGroupedBySurah(pageNumber);
    // When navigating to a specific surah, only show groups from that surah
    // so we don't render trailing verses from the previous surah on the first page
    // or leading verses from the next surah on the last page
    if (filterSurahId != null) {
      return allGroups.filter((g) => g.surahId === filterSurahId);
    }
    return allGroups;
  }, [pageNumber, filterSurahId]);

  // Juz number from first verse on this page
  const juzNumber = useMemo(() => {
    if (groups.length === 0 || groups[0].verses.length === 0) return null;
    const first = groups[0];
    const meta = getVerseMeta(first.surahId, first.verses[0].verse);
    return meta?.juz ?? null;
  }, [groups]);

  // Track visibility of whole page
  useEffect(() => {
    if (!pageRef.current || !onPageVisible) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onPageVisible(pageNumber);
      },
      { threshold: 0.3 },
    );
    obs.observe(pageRef.current);
    return () => obs.disconnect();
  }, [pageNumber, onPageVisible]);

  // Track visible verses for reading progress
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const [surah, ayah] = (
              entry.target.getAttribute("data-verse-key") || ""
            )
              .split(":")
              .map(Number);
            if (surah && ayah) onAyahVisible(surah, ayah);
          }
        });
      },
      { threshold: 0.5 },
    );
    verseRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pageNumber, onAyahVisible]);

  const setVerseRef = useCallback((el: HTMLSpanElement | null, key: string) => {
    if (el) verseRefs.current.set(key, el);
    else verseRefs.current.delete(key);
  }, []);

  const lineHeightDefault = Math.max(2.2, 2.6 - (arabicFontSize - 24) * 0.015);
  const lineHeight = lineHeightOverride ?? lineHeightDefault;

  return (
    <div ref={pageRef} data-page={pageNumber}>
      {/* ── Page body ── */}
      <div className="px-4 sm:px-5 md:px-6 pt-3">
        {groups.map((group, gi) => (
          <div key={`${group.surahId}-${gi}`}>
            {/* Surah header when verse 1 starts on this page */}
            {group.verses[0]?.verse === 1 && (
              <>
                <SurahHeaderInPage
                  name={group.surahName}
                  arabicName={group.surahArabicName}
                />
                {group.surahId !== SURAH_WITHOUT_BISMILLAH &&
                  group.surahId !== 1 && (
                    <BismillahInPage fontSize={arabicFontSize} />
                  )}
              </>
            )}

            {/* Continuous Arabic text */}
            <div
              className={cn(
                "arabic-text text-justify",
                textColorMode === "soft"
                  ? "text-[hsl(var(--mushaf-text-soft))]"
                  : "text-[hsl(var(--mushaf-text))]",
              )}
              style={{
                fontSize: `${arabicFontSize}px`,
                lineHeight,
                wordSpacing:
                  wordSpacingOverride != null
                    ? `${wordSpacingOverride}px`
                    : "0.12em",
                letterSpacing: letterSpacingOverride
                  ? `${letterSpacingOverride}px`
                  : undefined,
                ...getFontStyle(arabicFontFamily as any),
              }}
            >
              {group.verses.map((v) => {
                const verseKey = `${group.surahId}:${v.verse}`;
                const isPlaying =
                  playingSurahId === group.surahId &&
                  currentPlayingAyah === v.verse;

                return (
                  <span
                    key={verseKey}
                    ref={(el) => setVerseRef(el, verseKey)}
                    data-verse-key={verseKey}
                    onClick={() => onAyahClick(group.surahId, v.verse)}
                    className={cn(
                      "relative group cursor-pointer rounded-sm transition-all duration-200",
                      "hover:bg-[hsl(var(--mushaf-highlight))]",
                      isPlaying && "mushaf-verse-active",
                    )}
                  >
                    {v.text}
                    <AyahEndMarker number={v.verse} />
                    <VerseBookmarkButton
                      surahId={group.surahId}
                      ayahNumber={v.verse}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Page number footer ── */}
      <div className="flex items-center gap-3 py-3 px-2">
        <div className="flex-1 mushaf-ornament-line" />
        <div className="flex items-center gap-2 shrink-0">
          {juzNumber && (
            <span className="text-[9px] text-muted-foreground/35 font-medium tracking-wider uppercase">
              Juz {juzNumber}
            </span>
          )}
          <span className="text-[10px] text-[hsl(var(--mushaf-ornament)/0.6)] font-semibold tabular-nums">
            {pageNumber}
          </span>
        </div>
        <div className="flex-1 mushaf-ornament-line" />
      </div>
    </div>
  );
}

// ─── Main Mushaf View ───────────────────────────────────────────────

export function MushafView({
  surahId,
  startPage,
  arabicFontSize,
  arabicFontFamily,
  textColorMode,
  readingWidth,
  lineHeight: lineHeightProp,
  wordSpacing: wordSpacingProp,
  letterSpacing: letterSpacingProp,
  currentPlayingAyah,
  playingSurahId,
  onAyahVisible,
  onAyahClick,
  onPageChange,
}: MushafViewProps) {
  // Determine page range for this surah
  const { firstPage, lastPage } = useMemo(() => {
    const first = startPage || getVersePageNumber(surahId, 1);
    const verses = getArabicSurah(surahId);
    const lastVerse = verses.length;
    const last = getVersePageNumber(surahId, lastVerse);
    return { firstPage: first, lastPage: last };
  }, [surahId, startPage]);

  // Pages loaded so far (lazy-loaded in batches)
  const BATCH = 3;
  const [loadedCount, setLoadedCount] = useState(BATCH);

  const allPages = useMemo(() => {
    const pages: number[] = [];
    for (let p = firstPage; p <= lastPage; p++) pages.push(p);
    return pages;
  }, [firstPage, lastPage]);

  const visiblePages = allPages.slice(0, loadedCount);

  // Reset when surah changes
  useEffect(() => {
    setLoadedCount(BATCH);
  }, [surahId, startPage]);

  // Listen for jump-to-ayah requests — force load pages up to the target page
  useEffect(() => {
    const handleLoadToPage = (e: Event) => {
      const { page } = (e as CustomEvent).detail;
      const targetIndex = allPages.indexOf(page);
      if (targetIndex >= 0) {
        setLoadedCount((prev) => Math.max(prev, targetIndex + 1));
      } else {
        // Page not in this surah's range — load all
        setLoadedCount(allPages.length);
      }
    };
    window.addEventListener("mushaf-load-to-page", handleLoadToPage);
    return () =>
      window.removeEventListener("mushaf-load-to-page", handleLoadToPage);
  }, [allPages]);

  // Sentinel for lazy loading more pages
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && loadedCount < allPages.length) {
          setLoadedCount((prev) => Math.min(prev + BATCH, allPages.length));
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadedCount, allPages.length]);

  const handlePageVisible = useCallback(
    (page: number) => {
      onPageChange?.(page);
    },
    [onPageChange],
  );

  return (
    <div
      className="mushaf-container px-1 sm:px-3 md:px-4 py-2 sm:py-3 pb-24"
      style={readingWidth ? { maxWidth: `${readingWidth}%` } : undefined}
    >
      {visiblePages.map((pageNum) => (
        <MushafPage
          key={pageNum}
          pageNumber={pageNum}
          surahId={surahId}
          arabicFontSize={arabicFontSize}
          arabicFontFamily={arabicFontFamily}
          textColorMode={textColorMode}
          lineHeight={lineHeightProp}
          wordSpacing={wordSpacingProp}
          letterSpacing={letterSpacingProp}
          currentPlayingAyah={currentPlayingAyah}
          playingSurahId={playingSurahId}
          onAyahVisible={onAyahVisible}
          onAyahClick={onAyahClick}
          onPageVisible={handlePageVisible}
        />
      ))}

      {/* Sentinel for lazy loading */}
      {loadedCount < allPages.length && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-10"
        >
          <div className="flex items-center gap-2 text-muted-foreground/30 text-xs">
            <div className="w-4 h-4 border-2 border-muted-foreground/15 border-t-muted-foreground/40 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* End indicator */}
      {loadedCount >= allPages.length && allPages.length > 0 && (
        <div className="text-center py-8">
          <div className="mushaf-ornament-line mx-auto max-w-[160px] mb-3" />
          <p className="text-[10px] text-muted-foreground/30 tabular-nums">
            Pages {firstPage} – {lastPage}
          </p>
        </div>
      )}
    </div>
  );
}
