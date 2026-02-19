import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookMarked,
  Play,
  Pause,
  BookOpen,
  Layers,
  CheckCircle2,
  Settings2,
  ArrowLeft,
  ChevronDown,
  ChevronsDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useOfflineSettings,
  useOfflineReadingProgress,
  useIsBookmarked,
  useOfflineBookmarks,
  useOfflineMemorization,
  useSurahMemorization,
} from "@/lib/hooks";
import { useAudioStore } from "@/lib/stores/audio-store";
import { useUIStore } from "@/lib/stores/ui-store";
import {
  getSurahById,
  BISMILLAH,
  SURAH_WITHOUT_BISMILLAH,
} from "@/data/surahs";
import {
  getOfflineSurahWithTranslation,
  getVersePageNumber,
  getVerseMeta,
} from "@/data/quran-data";
import {
  ReadingSettingsSheet,
  getFontStyle,
} from "@/components/reader/reading-settings-sheet";
import { MushafView } from "@/components/reader/mushaf-view";
import type { Ayah, Translation } from "@/types/quran";
import { cn } from "@/lib/utils";

type ReadingMode = "ayah" | "mushaf";

export default function SurahReaderPage() {
  const { surahId: surahIdParam, pageId: pageIdParam } = useParams<{
    surahId: string;
    pageId: string;
  }>();

  const navigate = useNavigate();
  const surahId = parseInt(surahIdParam || "1", 10);
  const pageId = pageIdParam ? parseInt(pageIdParam, 10) : undefined;

  const surah = getSurahById(surahId);
  const nextSurah = surahId < 114 ? getSurahById(surahId + 1) : null;
  const { settings, updateSettings } = useOfflineSettings();
  const { progress, updatePosition, recordAyahRead } =
    useOfflineReadingProgress();

  // Memorization state
  const { memorization } = useSurahMemorization(surahId);
  const { markAyahMemorized, unmarkAyahMemorized } = useOfflineMemorization();

  // Global audio state
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const playingSurahId = useAudioStore((s) => s.currentSurahId);
  const playingAyahIndex = useAudioStore((s) => s.currentAyahIndex);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const isCurrentSurahPlaying = playingSurahId === surahId;
  const currentPlayingAyahIndex = isCurrentSurahPlaying
    ? playingAyahIndex
    : null;

  // Reading mode state
  const [readingMode, setReadingMode] = useState<ReadingMode>(
    pageId ? "mushaf" : settings.readingMode === "page" ? "mushaf" : "ayah",
  );

  // Header visibility (auto-hide on scroll down, show on scroll up)
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  // Track current visible page in mushaf mode
  const [currentPage, setCurrentPage] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Next surah on overscroll ──
  const [overscrollProgress, setOverscrollProgress] = useState(0);
  const overscrollTriggered = useRef(false);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Scroll to top when surah changes (e.g. navigating to next surah)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [surahId]);

  useEffect(() => {
    if (!nextSurah) return;
    overscrollTriggered.current = false;
    setOverscrollProgress(0);
  }, [surahId, nextSurah]);

  useEffect(() => {
    if (!nextSurah || readingMode === "mushaf") return;

    let accumulatedScroll = 0;
    let isAtBottom = false;
    const THRESHOLD = 150; // px of overscroll before navigating

    const checkBottom = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      isAtBottom = scrollBottom >= docHeight - 2;
    };

    const handleWheel = (e: WheelEvent) => {
      checkBottom();
      if (!isAtBottom || e.deltaY <= 0 || overscrollTriggered.current) {
        if (e.deltaY < 0) {
          accumulatedScroll = 0;
          setOverscrollProgress(0);
        }
        return;
      }
      accumulatedScroll += e.deltaY;
      const progress = Math.min(accumulatedScroll / THRESHOLD, 1);
      setOverscrollProgress(progress);
      if (progress >= 1) {
        overscrollTriggered.current = true;
        navigate(`/quran/${surahId + 1}`);
      }
    };

    let touchStartY = 0;
    let touchAccumulated = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchAccumulated = accumulatedScroll;
    };

    const handleTouchMove = (e: TouchEvent) => {
      checkBottom();
      const deltaY = touchStartY - e.touches[0].clientY;
      if (!isAtBottom || deltaY <= 0 || overscrollTriggered.current) {
        if (deltaY < 0) {
          accumulatedScroll = 0;
          setOverscrollProgress(0);
        }
        return;
      }
      accumulatedScroll = touchAccumulated + deltaY;
      const progress = Math.min(accumulatedScroll / THRESHOLD, 1);
      setOverscrollProgress(progress);
      if (progress >= 1) {
        overscrollTriggered.current = true;
        navigate(`/quran/${surahId + 1}`);
      }
    };

    const handleTouchEnd = () => {
      if (!overscrollTriggered.current) {
        accumulatedScroll = 0;
        setOverscrollProgress(0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextSurah, surahId, readingMode, navigate]);

  // Load data from bundled offline source
  const { ayahs, translations } = useMemo(() => {
    const offlineData = getOfflineSurahWithTranslation(surahId);
    if (!offlineData) return { ayahs: [], translations: [] };

    const ayahList: Ayah[] = offlineData.surah.verses.map((verse, index) => {
      const meta = getVerseMeta(surahId, verse.id);
      return {
        id: index + 1,
        surahId,
        numberInSurah: verse.id,
        text: verse.text,
        textSimple: verse.text,
        juz: meta?.juz || 1,
        hizb: 1,
        page: meta?.page || 1,
        sajdah:
          meta?.sajda === true ||
          (typeof meta?.sajda === "object" && meta?.sajda !== null),
      };
    });

    const translationList: Translation[] = settings.showTranslation
      ? offlineData.surah.verses.map((verse) => ({
          ayahId: verse.id,
          text: offlineData.translations[verse.id] || "",
          languageCode: "en",
          translatorName: "Sahih International",
          translatorId: "en.sahih",
        }))
      : [];

    return { ayahs: ayahList, translations: translationList };
  }, [surahId, settings.showTranslation]);

  // Settings sheet state
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener("open-reader-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("open-reader-settings", handleOpenSettings);
  }, []);

  // Handle reading mode change
  const handleReadingModeChange = useCallback(
    (mode: ReadingMode) => {
      setReadingMode(mode);
      updateSettings({ readingMode: mode === "mushaf" ? "page" : "scroll" });
    },
    [updateSettings],
  );

  // Play audio for an ayah by index
  const handlePlayAyah = useCallback(
    (index: number) => {
      if (isCurrentSurahPlaying && playingAyahIndex === index && isPlaying) {
        pause();
      } else if (
        isCurrentSurahPlaying &&
        playingAyahIndex === index &&
        !isPlaying
      ) {
        resume();
      } else {
        play(surahId, index);
      }
    },
    [
      surahId,
      isCurrentSurahPlaying,
      playingAyahIndex,
      isPlaying,
      play,
      pause,
      resume,
    ],
  );

  // Play by surah + ayah number (for Mushaf view)
  const playAyahByNumber = useCallback(
    (targetSurahId: number, ayahNumber: number) => {
      if (targetSurahId === surahId) {
        const index = ayahs.findIndex((a) => a.numberInSurah === ayahNumber);
        if (index >= 0) handlePlayAyah(index);
      } else {
        play(targetSurahId, ayahNumber - 1);
      }
    },
    [surahId, ayahs, handlePlayAyah, play],
  );

  // Scroll-based reading progress — simple percentage, no flickering
  useEffect(() => {
    let rafId: number;
    let lastPct = -1;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const pct =
          docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        if (pct !== lastPct) {
          lastPct = pct;
          useUIStore.getState().setReadingScrollProgress({
            surahId,
            currentAyah: pct, // reusing field as percentage
            totalAyahs: 100, // denominator = 100 so currentAyah/totalAyahs = percent
          });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      useUIStore.getState().setReadingScrollProgress(null);
    };
  }, [surahId]);

  // Track reading progress (for Mushaf)
  const handleMushafAyahVisible = useCallback(
    async (targetSurahId: number, ayahNumber: number) => {
      await updatePosition(targetSurahId, ayahNumber);
      await recordAyahRead(targetSurahId, ayahNumber);
    },
    [updatePosition, recordAyahRead],
  );

  // Track reading progress (for verse mode)
  const handleAyahVisible = useCallback(
    async (ayahNumber: number) => {
      await updatePosition(surahId, ayahNumber);
      await recordAyahRead(surahId, ayahNumber);
    },
    [surahId, updatePosition, recordAyahRead],
  );

  // Check if an ayah is memorized
  const isAyahMemorized = useCallback(
    (ayahNumber: number) => {
      return memorization?.memorizedAyahs.includes(ayahNumber) || false;
    },
    [memorization],
  );

  const handleToggleMemorized = useCallback(
    (ayahNumber: number) => {
      if (isAyahMemorized(ayahNumber)) {
        unmarkAyahMemorized(surahId, ayahNumber);
      } else {
        markAyahMemorized(surahId, ayahNumber);
      }
    },
    [surahId, isAyahMemorized, markAyahMemorized, unmarkAyahMemorized],
  );

  // Get current playing ayah number
  const currentPlayingAyahNumber =
    currentPlayingAyahIndex !== null
      ? (ayahs[currentPlayingAyahIndex]?.numberInSurah ?? null)
      : null;

  if (!surah && !pageId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Surah not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ────────────────────────────────────────────────────
          Top Bar — frosted glass, auto-hides on scroll
          ──────────────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 safe-area-top",
          "transition-all duration-300 ease-out",
          headerVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0",
        )}
      >
        <div className="bg-background/80 backdrop-blur-2xl border-b border-border/40">
          <div className="flex items-center justify-between h-12 px-2 max-w-3xl mx-auto">
            {/* Left — back button */}
            <Link
              to="/quran"
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary/80 transition-colors shrink-0"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </Link>

            {/* Center — surah info, tappable area */}
            <button
              className="flex flex-col items-center justify-center min-w-0 px-3 py-1 rounded-xl hover:bg-secondary/50 transition-colors"
              onClick={() => {
                // Scroll to top
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="arabic-text text-sm leading-none">
                  {surah?.name || ""}
                </span>
                <span className="text-[11px] font-semibold text-foreground/90 truncate max-w-[120px]">
                  {surah?.englishName || (pageId ? `Page ${pageId}` : "")}
                </span>
              </div>
              {(surah || currentPage) && (
                <span className="text-[9px] text-muted-foreground/60 mt-0.5">
                  {surah ? `${surah.numberOfAyahs} ayahs` : ""}
                  {currentPage ? ` · Page ${currentPage}` : ""}
                </span>
              )}
            </button>

            {/* Right — actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Mode Toggle — compact pill */}
              <div className="flex items-center bg-secondary/50 rounded-full p-0.5 mr-0.5">
                <button
                  onClick={() => handleReadingModeChange("ayah")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    readingMode === "ayah"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground/60 hover:text-foreground",
                  )}
                  title="Verse by verse"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReadingModeChange("mushaf")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    readingMode === "mushaf"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground/60 hover:text-foreground",
                  )}
                  title="Mushaf layout"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary/80 transition-colors"
                title="Reading settings"
              >
                <Settings2 className="w-4 h-4 text-foreground/70" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-12 safe-area-top" />

      {/* ────────────────────────────────────────────────────
          Content Area
          ──────────────────────────────────────────────────── */}
      {readingMode === "mushaf" ? (
        <MushafView
          surahId={surahId}
          startPage={pageId}
          arabicFontSize={settings.arabicFontSize}
          arabicFontFamily={settings.arabicFontFamily}
          textColorMode={settings.textColorMode}
          readingWidth={settings.readingWidth}
          lineHeight={settings.lineHeight}
          wordSpacing={settings.wordSpacing}
          letterSpacing={settings.letterSpacing}
          currentPlayingAyah={currentPlayingAyahNumber}
          playingSurahId={isCurrentSurahPlaying ? surahId : null}
          onAyahVisible={handleMushafAyahVisible}
          onAyahClick={playAyahByNumber}
          onPageChange={(page) => setCurrentPage(page)}
        />
      ) : (
        <div className="pb-24">
          {/* ── Surah Opening Card ── */}
          {surah && (
            <div
              className="mx-auto px-6 sm:px-10 pt-4 pb-2"
              style={{ maxWidth: `${settings.readingWidth}%` }}
            >
              <div className="relative overflow-hidden rounded-2xl">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--mushaf-ornament)/0.08)] via-[hsl(var(--mushaf-ornament)/0.12)] to-[hsl(var(--mushaf-ornament)/0.06)]" />
                <div className="absolute inset-0 border border-[hsl(var(--mushaf-ornament)/0.2)] rounded-2xl" />

                {/* Subtle geometric pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative z-10 text-center py-8 px-6">
                  {/* Arabic name — large, decorative */}
                  <p className="arabic-text text-3xl sm:text-4xl text-[hsl(var(--mushaf-ornament))] leading-normal mb-2">
                    {surah.name}
                  </p>

                  {/* English name */}
                  <h1 className="text-base font-semibold text-foreground/85 mb-1">
                    {surah.englishName}
                  </h1>

                  {/* Details */}
                  <p className="text-xs text-muted-foreground/70">
                    {surah.englishNameTranslation}
                    <span className="mx-1.5 text-muted-foreground/30">|</span>
                    {surah.numberOfAyahs} Ayahs
                    <span className="mx-1.5 text-muted-foreground/30">|</span>
                    {surah.revelationType === "Meccan" ? "Makkah" : "Madinah"}
                  </p>

                  {/* Decorative line */}
                  <div className="mt-5 mx-auto max-w-[180px] mushaf-ornament-line" />

                  {/* Bismillah */}
                  {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
                    <p
                      className="arabic-text mt-5 text-foreground/75"
                      style={{
                        fontSize: `${settings.arabicFontSize * 0.8}px`,
                        ...getFontStyle(settings.arabicFontFamily),
                      }}
                    >
                      {BISMILLAH}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Verse List ── */}
          <div
            className="mx-auto"
            style={{ maxWidth: `${settings.readingWidth}%` }}
          >
            {ayahs.map((ayah, index) => {
              const isThisAyahPlaying =
                isCurrentSurahPlaying &&
                currentPlayingAyahIndex === index &&
                isPlaying;
              return (
                <AyahCard
                  key={ayah.id}
                  ayah={ayah}
                  translation={translations[index]}
                  isPlaying={isThisAyahPlaying}
                  isCurrentAyah={
                    isCurrentSurahPlaying && currentPlayingAyahIndex === index
                  }
                  isMemorized={isAyahMemorized(ayah.numberInSurah)}
                  onPlay={() => handlePlayAyah(index)}
                  onVisible={() => handleAyahVisible(ayah.numberInSurah)}
                  onToggleMemorized={() =>
                    handleToggleMemorized(ayah.numberInSurah)
                  }
                  settings={settings}
                  surahId={surahId}
                />
              );
            })}
          </div>

          {/* End of surah + next surah indicator */}
          <div
            className="mx-auto text-center pt-10 pb-16"
            style={{ maxWidth: `${settings.readingWidth}%` }}
          >
            <div className="mushaf-ornament-line mx-auto max-w-[160px] mb-3" />
            <p className="text-[11px] text-muted-foreground/40">
              End of {surah?.englishName || "Surah"}
            </p>

            {nextSurah && (
              <div ref={bottomSentinelRef} className="mt-8">
                {/* Overscroll progress indicator */}
                <div
                  className="flex flex-col items-center gap-2 transition-opacity duration-200"
                  style={{ opacity: overscrollProgress > 0 ? 1 : 0.5 }}
                >
                  <ChevronsDown
                    className="w-5 h-5 text-muted-foreground/40 transition-transform duration-200"
                    style={{
                      transform: `translateY(${overscrollProgress * -4}px) scale(${1 + overscrollProgress * 0.2})`,
                      opacity: 0.4 + overscrollProgress * 0.6,
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground/50">
                    {overscrollProgress >= 1
                      ? "Loading..."
                      : "Keep scrolling for next surah"}
                  </p>
                  <p className="text-[13px] font-medium text-foreground/60 mt-0.5">
                    <span className="arabic-text text-sm mr-1.5">
                      {nextSurah.name}
                    </span>
                    {nextSurah.englishName}
                  </p>

                  {/* Progress bar */}
                  {overscrollProgress > 0 && (
                    <div className="w-20 h-1 rounded-full bg-border/50 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--mushaf-active))] transition-all duration-100"
                        style={{ width: `${overscrollProgress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Settings Sheet */}
      <ReadingSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

// =====================================
// Ayah Card — Clean verse-by-verse view
// =====================================

interface AyahCardProps {
  ayah: Ayah;
  translation?: Translation;
  isPlaying: boolean;
  isCurrentAyah: boolean;
  isMemorized: boolean;
  onPlay: () => void;
  onVisible: () => void;
  onToggleMemorized: () => void;
  settings: ReturnType<typeof useOfflineSettings>["settings"];
  surahId: number;
}

function AyahCard({
  ayah,
  translation,
  isPlaying,
  isCurrentAyah,
  isMemorized,
  onPlay,
  onVisible,
  onToggleMemorized,
  settings,
  surahId,
}: AyahCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isBookmarked } = useIsBookmarked(surahId, ayah.numberInSurah);
  const { addBookmark, removeBookmark, getBookmark } = useOfflineBookmarks();

  // Visibility tracking for reading progress
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onVisible();
      },
      { threshold: 0.5 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  // Auto-scroll to currently playing ayah
  useEffect(() => {
    if (isCurrentAyah && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isCurrentAyah]);

  const handleBookmarkClick = useCallback(() => {
    if (isBookmarked) {
      getBookmark(surahId, ayah.numberInSurah)
        .then((bookmark) => bookmark && removeBookmark(bookmark.clientId))
        .then(() => toast.success("Bookmark removed"));
    } else {
      addBookmark(surahId, ayah.numberInSurah).then(() =>
        toast.success("Bookmark added"),
      );
    }
  }, [
    isBookmarked,
    surahId,
    ayah.numberInSurah,
    getBookmark,
    removeBookmark,
    addBookmark,
  ]);

  const handleMemorizedClick = useCallback(() => {
    onToggleMemorized();
    toast.success(
      isMemorized ? "Unmarked as memorized" : "Marked as memorized",
    );
  }, [onToggleMemorized, isMemorized]);

  const fontSize = settings.arabicFontSize || 28;

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative px-6 sm:px-10",
        "transition-colors duration-300",
        isCurrentAyah && "bg-[hsl(var(--mushaf-highlight))]",
      )}
    >
      {/* Playing indicator — left accent line */}
      {isCurrentAyah && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[hsl(var(--mushaf-active))]" />
      )}

      {/* Inner content */}
      <div className="py-5 border-b border-border/30">
        {/* ── Verse Number Row ── */}
        <div className="flex items-center justify-between mb-4">
          {/* Verse number badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center justify-center",
                "w-8 h-8 rounded-full text-[11px] font-semibold tabular-nums",
                "transition-colors duration-200",
                isCurrentAyah
                  ? "bg-[hsl(var(--mushaf-active))] text-white"
                  : "bg-secondary/70 text-muted-foreground",
              )}
            >
              {ayah.numberInSurah}
            </span>
            {/* Page + Juz micro-label */}
            {ayah.page > 0 && (
              <span className="text-[9px] text-muted-foreground/40 tabular-nums">
                {ayah.juz ? `Juz ${ayah.juz}` : ""} · p.{ayah.page}
              </span>
            )}
          </div>

          {/* Action buttons — subtle, appear more on hover */}
          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
            {/* Memorization */}
            <button
              type="button"
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "transition-all duration-200 touch-manipulation",
                "hover:bg-secondary/80 active:scale-90",
                isMemorized && "opacity-100",
              )}
              onClick={handleMemorizedClick}
              title={isMemorized ? "Unmark memorized" : "Mark as memorized"}
            >
              <CheckCircle2
                className={cn(
                  "h-[15px] w-[15px]",
                  isMemorized
                    ? "fill-emerald-500 text-emerald-500"
                    : "text-muted-foreground/40",
                )}
              />
            </button>

            {/* Bookmark */}
            <button
              type="button"
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "transition-all duration-200 touch-manipulation",
                "hover:bg-secondary/80 active:scale-90",
                isBookmarked && "opacity-100",
              )}
              onClick={handleBookmarkClick}
              title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <BookMarked
                className={cn(
                  "h-[15px] w-[15px]",
                  isBookmarked
                    ? "fill-[hsl(var(--mushaf-active))] text-[hsl(var(--mushaf-active))]"
                    : "text-muted-foreground/40",
                )}
              />
            </button>

            {/* Play / Pause */}
            <button
              type="button"
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                "transition-all duration-200 touch-manipulation",
                "hover:bg-secondary/80 active:scale-90",
                isCurrentAyah &&
                  "bg-[hsl(var(--mushaf-active))]/10 text-[hsl(var(--mushaf-active))] opacity-100",
              )}
              onClick={onPlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-[15px] w-[15px]" />
              ) : (
                <Play className="h-[15px] w-[15px]" />
              )}
            </button>
          </div>
        </div>

        {/* ── Arabic Text ── */}
        <p
          className={cn(
            "arabic-text mb-1",
            settings.textColorMode === "soft" && "text-[hsl(var(--text-soft))]",
          )}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: settings.lineHeight || 2.4,
            wordSpacing: `${settings.wordSpacing || 0}px`,
            letterSpacing: `${settings.letterSpacing || 0}px`,
            ...getFontStyle(settings.arabicFontFamily),
          }}
        >
          {ayah.text}
        </p>

        {/* ── Translation ── */}
        {settings.showTranslation && translation && (
          <p
            className="text-muted-foreground/80 leading-relaxed mt-3"
            style={{ fontSize: `${settings.translationFontSize}px` }}
          >
            {translation.text}
          </p>
        )}

        {/* Sajdah indicator */}
        {ayah.sajdah && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/8 border border-amber-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Sajdah
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
