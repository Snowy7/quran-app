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
  Focus,
  Hash,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
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
  SURAHS,
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
import type { Ayah, Translation, TafsirEntry } from "@/types/quran";
import { fetchTafsir, AVAILABLE_TAFSIRS } from "@/lib/api/quran-api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type ReadingMode = "ayah" | "mushaf";

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

/** Scrollable surah picker dropdown */
function SurahPicker({
  currentSurahId,
  isOpen,
  onClose,
  onSelect,
  language,
}: {
  currentSurahId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  language: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to current surah when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown - centered below header, no transform to avoid animation conflicts */}
      <div className="absolute left-0 right-0 top-full z-50 flex justify-center px-4 pt-1">
        <div className="w-72 max-h-[60vh] bg-background border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <div ref={listRef} className="overflow-y-auto max-h-[60vh] scrollbar-hide">
          {SURAHS.map((surah) => {
            const isActive = surah.id === currentSurahId;
            return (
              <button
                key={surah.id}
                data-active={isActive}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-secondary/50'
                )}
                onClick={() => {
                  onSelect(surah.id);
                  onClose();
                }}
              >
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isActive ? 'bg-primary text-white' : 'bg-secondary text-primary'
                )}>
                  {language === 'ar' ? toArabicNumerals(surah.id) : surah.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-arabic-ui text-sm font-bold truncate',
                    isActive ? 'text-primary' : 'text-foreground'
                  )} dir="rtl">
                    {surah.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {surah.englishName} · {surah.numberOfAyahs} ayahs
                  </p>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SurahReaderPage() {
  const { surahId: surahIdParam, pageId: pageIdParam } = useParams<{
    surahId: string;
    pageId: string;
  }>();

  const navigate = useNavigate();
  const surahId = parseInt(surahIdParam || "1", 10);
  const pageId = pageIdParam ? parseInt(pageIdParam, 10) : undefined;

  const { t, language, isRTL } = useTranslation();
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

  // Zen mode (distraction-free)
  const isZenMode = useUIStore((s) => s.isZenMode);
  const setZenMode = useUIStore((s) => s.setZenMode);

  // Jump-to-ayah dialog
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  const jumpInputRef = useRef<HTMLInputElement>(null);

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
    if (!nextSurah) return;

    let accumulatedScroll = 0;
    let isAtBottom = false;
    const THRESHOLD = 400; // px of overscroll before navigating

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
  }, [nextSurah, surahId, navigate]);

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

  // Tafsir data — always fetched (used by both ayah mode toggle and mushaf long-press)
  const [tafsirEntries, setTafsirEntries] = useState<TafsirEntry[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTafsirLoading(true);

    fetchTafsir(surahId, settings.primaryTafsir)
      .then((entries) => {
        if (!cancelled) setTafsirEntries(entries);
      })
      .catch((err) => {
        console.error('[Reader] Failed to fetch tafsir:', err);
      })
      .finally(() => {
        if (!cancelled) setTafsirLoading(false);
      });

    return () => { cancelled = true; };
  }, [surahId, settings.primaryTafsir]);

  // Mushaf tafsir sheet state (triggered by long-press)
  const [mushafTafsirAyah, setMushafTafsirAyah] = useState<number | null>(null);
  const mushafTafsirEntry = mushafTafsirAyah !== null
    ? tafsirEntries.find(t => t.verseKey === `${surahId}:${mushafTafsirAyah}`)
    : undefined;

  // Settings sheet state
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener("open-reader-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("open-reader-settings", handleOpenSettings);
  }, []);

  // Exit zen mode on unmount (leaving reader page)
  useEffect(() => {
    return () => setZenMode(false);
  }, [setZenMode]);

  // Escape key exits zen mode or closes jump dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showJumpDialog) {
          setShowJumpDialog(false);
        } else if (isZenMode) {
          setZenMode(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode, setZenMode, showJumpDialog]);

  // Focus jump input when dialog opens
  useEffect(() => {
    if (showJumpDialog) {
      setJumpInput("");
      setTimeout(() => jumpInputRef.current?.focus(), 100);
    }
  }, [showJumpDialog]);

  // Jump to ayah handler
  const handleJumpToAyah = useCallback(
    (ayahNumber: number) => {
      if (!surah || ayahNumber < 1 || ayahNumber > surah.numberOfAyahs) {
        toast.error(`Invalid ayah. Enter 1–${surah?.numberOfAyahs || "?"}`);
        return;
      }
      setShowJumpDialog(false);

      const scrollToAyah = () => {
        // In ayah mode: find by data-ayah-number
        // In mushaf mode: find by data-verse-key
        const el =
          document.querySelector(`[data-ayah-number="${ayahNumber}"]`) ||
          document.querySelector(`[data-verse-key="${surahId}:${ayahNumber}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Brief highlight
          el.classList.add("ring-2", "ring-[hsl(var(--mushaf-active))]");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-[hsl(var(--mushaf-active))]");
          }, 2000);
        }
      };

      if (readingMode === "mushaf") {
        // In mushaf mode, the target page may not be loaded yet.
        // Force load all pages by dispatching a custom event, then scroll.
        const targetPage = getVersePageNumber(surahId, ayahNumber);
        window.dispatchEvent(
          new CustomEvent("mushaf-load-to-page", {
            detail: { page: targetPage },
          }),
        );
        // Wait for render, then scroll
        setTimeout(scrollToAyah, 150);
      } else {
        // In ayah mode all verses are in the DOM
        scrollToAyah();
      }
    },
    [surah, surahId, readingMode],
  );

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
          "transition-all duration-500 ease-out",
          headerVisible && !isZenMode
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="relative overflow-hidden">
          {/* Ornamental background */}
          <div className="absolute inset-0 bg-background/85 backdrop-blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--mushaf-ornament)/0.04)] via-[hsl(var(--mushaf-ornament)/0.07)] to-[hsl(var(--mushaf-ornament)/0.04)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--mushaf-ornament)/0.2)] to-transparent" />

          <div className="relative z-10 flex items-center justify-between h-12 px-2 max-w-3xl mx-auto">
            {/* Left — back button */}
            <Link
              to="/quran"
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--mushaf-ornament)/0.08)] transition-colors shrink-0"
            >
              <ArrowLeft className="w-[18px] h-[18px] text-foreground/70" />
            </Link>

            {/* Center — surah info with ornamental flanks */}
            <button
              className="flex items-center gap-3 min-w-0 px-3 py-1 rounded-xl hover:bg-[hsl(var(--mushaf-ornament)/0.06)] transition-colors"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <div className="hidden sm:block flex-shrink-0 w-8 h-px bg-gradient-to-r from-transparent to-[hsl(var(--mushaf-ornament)/0.3)]" />
              <div className="flex flex-col items-center min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="arabic-text text-sm leading-none text-[hsl(var(--mushaf-ornament))]">
                    {surah?.name || ""}
                  </span>
                  <span className="text-[11px] font-semibold text-foreground/80 truncate max-w-[120px]">
                    {surah?.englishName || (pageId ? `Page ${pageId}` : "")}
                  </span>
                </div>
                {(surah || currentPage) && (
                  <span className="text-[9px] text-muted-foreground/50 mt-0.5">
                    {surah ? `${surah.numberOfAyahs} ayahs` : ""}
                    {currentPage ? ` · Page ${currentPage}` : ""}
                  </span>
                )}
              </div>
              <div className="hidden sm:block flex-shrink-0 w-8 h-px bg-gradient-to-l from-transparent to-[hsl(var(--mushaf-ornament)/0.3)]" />
            </button>

            {/* Right — actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Mode Toggle — compact pill */}
              <div className="flex items-center bg-[hsl(var(--mushaf-ornament)/0.06)] rounded-full p-0.5 mr-0.5 border border-[hsl(var(--mushaf-ornament)/0.1)]">
                <button
                  onClick={() => handleReadingModeChange("ayah")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    readingMode === "ayah"
                      ? "bg-background text-[hsl(var(--mushaf-active))] shadow-sm"
                      : "text-muted-foreground/50 hover:text-foreground",
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
                      ? "bg-background text-[hsl(var(--mushaf-active))] shadow-sm"
                      : "text-muted-foreground/50 hover:text-foreground",
                  )}
                  title="Mushaf layout"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Jump to ayah */}
              <button
                onClick={() => setShowJumpDialog(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--mushaf-ornament)/0.08)] transition-colors"
                title="Jump to ayah"
              >
                <Hash className="w-3.5 h-3.5 text-foreground/60" />
              </button>

              {/* Zen mode */}
              <button
                onClick={() => setZenMode(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--mushaf-ornament)/0.08)] transition-colors"
                title="Zen mode"
              >
                <Focus className="w-4 h-4 text-foreground/60" />
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--mushaf-ornament)/0.08)] transition-colors"
                title="Reading settings"
              >
                <Settings2 className="w-4 h-4 text-foreground/60" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div
        className={cn(
          "safe-area-top transition-all duration-500",
          isZenMode ? "h-0" : "h-12",
        )}
      />

      {/* ── Zen mode exit — tap content to briefly show exit button ── */}
      {isZenMode && <ZenModeOverlay onExit={() => setZenMode(false)} />}

      {/* ── Jump to Ayah dialog ── */}
      {showJumpDialog && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setShowJumpDialog(false)}
          />
          <div className="fixed z-[70] top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] animate-in fade-in zoom-in-95 duration-200">
            <div className="relative overflow-hidden rounded-2xl bg-background border border-[hsl(var(--mushaf-ornament)/0.15)] shadow-2xl">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--mushaf-ornament)/0.04)] to-transparent" />

              <div className="relative z-10 p-5">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium text-center mb-3">
                  Jump to Ayah
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const num = parseInt(jumpInput, 10);
                    if (!isNaN(num)) handleJumpToAyah(num);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      ref={jumpInputRef}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={surah?.numberOfAyahs || 286}
                      value={jumpInput}
                      onChange={(e) => setJumpInput(e.target.value)}
                      placeholder={`1 – ${surah?.numberOfAyahs || "?"}`}
                      className="flex-1 h-10 rounded-xl bg-secondary/50 border border-border/40 px-3 text-center text-sm font-medium tabular-nums placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--mushaf-active))]/30 focus:border-[hsl(var(--mushaf-active))]/40"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-[hsl(var(--mushaf-active))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Go
                    </button>
                  </div>
                </form>

                <p className="text-[9px] text-muted-foreground/35 text-center mt-2">
                  {surah?.englishName} · {surah?.numberOfAyahs} ayahs
                </p>
              </div>
            </div>
          </div>
        </>
      )}

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
          {/* ── Surah Opening Card — ornamental mushaf style ── */}
          {surah && (
            <div
              className="mx-auto px-4 sm:px-8 pt-4 pb-2"
              style={{ maxWidth: `${settings.readingWidth}%` }}
            >
              <div className="relative overflow-hidden rounded-xl">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--mushaf-ornament)/0.05)] via-[hsl(var(--mushaf-ornament)/0.09)] to-[hsl(var(--mushaf-ornament)/0.05)]" />
                <div className="absolute inset-0 border border-[hsl(var(--mushaf-ornament)/0.15)] rounded-xl" />

                <div className="relative z-10 text-center py-6 px-6">
                  {/* Arabic name with flanking gradient lines */}
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex-1 max-w-[80px] h-px bg-gradient-to-r from-transparent to-[hsl(var(--mushaf-ornament)/0.3)]" />
                    <p className="arabic-text text-2xl sm:text-3xl text-[hsl(var(--mushaf-ornament))] leading-normal">
                      {surah.name}
                    </p>
                    <div className="flex-1 max-w-[80px] h-px bg-gradient-to-l from-transparent to-[hsl(var(--mushaf-ornament)/0.3)]" />
                  </div>

                  {/* English name */}
                  <p className="text-[11px] text-foreground/70 font-semibold tracking-wide mb-0.5">
                    {surah.englishName}
                  </p>

                  {/* Details row */}
                  <p className="text-[9px] text-muted-foreground/50 font-medium tracking-widest uppercase">
                    {surah.englishNameTranslation}
                    <span className="mx-1.5 text-muted-foreground/20">·</span>
                    {surah.numberOfAyahs} Ayahs
                    <span className="mx-1.5 text-muted-foreground/20">·</span>
                    {surah.revelationType === "Meccan" ? "Makkah" : "Madinah"}
                  </p>

                  {/* Ornament line */}
                  <div className="mt-4 mx-auto max-w-[140px] mushaf-ornament-line" />
                </div>
              </div>

              {/* Bismillah — standalone, centered below the card (matching mushaf style) */}
              {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
                <div className="text-center my-3">
                  <p
                    className="arabic-text inline-block text-[hsl(var(--mushaf-text))] opacity-75"
                    style={{
                      fontSize: `${settings.arabicFontSize * 0.8}px`,
                      lineHeight: 2,
                      ...getFontStyle(settings.arabicFontFamily),
                    }}
                  >
                    {BISMILLAH}
                  </p>
                </div>
              )}
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
                  isZenMode={isZenMode}
                  onPlay={() => handlePlayAyah(index)}
                  onVisible={() => handleAyahVisible(ayah.numberInSurah)}
                  onToggleMemorized={() =>
                    handleToggleMemorized(ayah.numberInSurah)
                  }
                  settings={settings}
                  surahId={surahId}
                  language={language}
                />
              );
            })}
          </div>

          {/* End of surah */}
          <div
            className="mx-auto text-center pt-10 pb-4"
            style={{ maxWidth: `${settings.readingWidth}%` }}
          >
            <div className="mushaf-ornament-line mx-auto max-w-[160px] mb-3" />
            <p className="text-[11px] text-muted-foreground/40">
              End of {surah?.englishName || "Surah"}
            </p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────
          Next Surah Transition — shared between both modes
          ──────────────────────────────────────────────────── */}
      {nextSurah && (
        <div ref={bottomSentinelRef} className="pb-24">
          <div className="max-w-md mx-auto px-6">
            {/* Ornamental card */}
            <div
              className="relative overflow-hidden rounded-2xl transition-all duration-300"
              style={{
                opacity: 0.5 + overscrollProgress * 0.5,
                transform: `translateY(${(1 - overscrollProgress) * 8}px)`,
              }}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--mushaf-ornament)/0.04)] via-[hsl(var(--mushaf-ornament)/0.08)] to-[hsl(var(--mushaf-ornament)/0.04)]" />
              <div className="absolute inset-0 border border-[hsl(var(--mushaf-ornament)/0.12)] rounded-2xl" />

              <div className="relative z-10 text-center py-6 px-5">
                {/* Animated chevrons */}
                <div className="flex justify-center mb-3">
                  <div
                    className="flex flex-col items-center transition-transform duration-200"
                    style={{
                      transform: `translateY(${overscrollProgress * -6}px)`,
                    }}
                  >
                    <ChevronsDown
                      className="w-5 h-5 text-[hsl(var(--mushaf-ornament))] transition-all duration-200"
                      style={{
                        opacity: 0.3 + overscrollProgress * 0.7,
                        transform: `scale(${1 + overscrollProgress * 0.15})`,
                      }}
                    />
                  </div>
                </div>

                {/* Label */}
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium mb-3">
                  {overscrollProgress >= 1 ? "Loading" : "Continue reading"}
                </p>

                {/* Next surah name */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-px bg-gradient-to-r from-transparent to-[hsl(var(--mushaf-ornament)/0.25)]" />
                  <div>
                    <p className="arabic-text text-lg text-[hsl(var(--mushaf-ornament))] leading-normal">
                      {nextSurah.name}
                    </p>
                  </div>
                  <div className="w-10 h-px bg-gradient-to-l from-transparent to-[hsl(var(--mushaf-ornament)/0.25)]" />
                </div>
                <p className="text-[12px] font-medium text-foreground/60">
                  {nextSurah.englishName}
                </p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                  {nextSurah.englishNameTranslation}
                </p>

                {/* Progress indicator */}
                <div className="mt-4 mx-auto max-w-[120px]">
                  <div className="h-[2px] rounded-full bg-[hsl(var(--mushaf-ornament)/0.1)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100 ease-out"
                      style={{
                        width: `${overscrollProgress * 100}%`,
                        background: `linear-gradient(to right, hsl(var(--mushaf-ornament) / 0.4), hsl(var(--mushaf-active)))`,
                      }}
                    />
                  </div>
                </div>

                {/* Hint text */}
                <p className="text-[9px] text-muted-foreground/35 mt-2">
                  {overscrollProgress >= 1
                    ? ""
                    : overscrollProgress > 0
                      ? "Keep going..."
                      : "Scroll down to continue"}
                </p>

                {/* Loading spinner when triggered */}
                {overscrollProgress >= 1 && (
                  <div className="flex justify-center mt-2">
                    <div className="w-4 h-4 border-2 border-[hsl(var(--mushaf-ornament)/0.2)] border-t-[hsl(var(--mushaf-active))] rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reading Settings Sheet */}
      <ReadingSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Mushaf Tafsir Sheet (long-press) */}
      <TafsirSheet
        isOpen={mushafTafsirAyah !== null}
        onClose={() => setMushafTafsirAyah(null)}
        ayahNumber={mushafTafsirAyah}
        surahName={surah?.name || ""}
        tafsir={mushafTafsirEntry}
        tafsirLoading={tafsirLoading}
        tafsirId={settings.primaryTafsir}
        language={language}
      />
    </div>
  );
}

// =====================================
// Ayah Card — Clean verse-by-verse view
// =====================================


/** Bottom sheet for showing tafsir from mushaf long-press */
function TafsirSheet({
  isOpen,
  onClose,
  ayahNumber,
  surahName,
  tafsir,
  tafsirLoading,
  tafsirId,
  language,
}: {
  isOpen: boolean;
  onClose: () => void;
  ayahNumber: number | null;
  surahName: string;
  tafsir?: TafsirEntry;
  tafsirLoading: boolean;
  tafsirId: number;
  language: string;
}) {
  const isAr = language === 'ar';
  const tafsirLang = AVAILABLE_TAFSIRS.find(t => t.id === tafsirId)?.language || 'ar';

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || ayahNumber === null) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] flex justify-center">
        <div
          className="w-full max-w-lg bg-background rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col"
          style={{ animation: 'sheet-slide-up 0.3s ease-out' }}
        >
          <div className="flex-shrink-0 pt-3 pb-2">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto" />
          </div>
          <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 border-b border-border" dir={isAr ? 'rtl' : 'ltr'}>
            <div>
              <h3 className={cn('text-base font-semibold', isAr && 'font-arabic-ui')}>
                {isAr ? 'التفسير' : 'Tafsir'}
              </h3>
              <p className="text-xs text-muted-foreground font-arabic-ui" dir="rtl">
                {surahName} · {isAr ? 'آية' : 'Ayah'} {isAr ? toArabicNumerals(ayahNumber) : ayahNumber}
              </p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors" onClick={onClose}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {tafsirLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className={cn('text-sm text-muted-foreground animate-pulse', isAr && 'font-arabic-ui')}>
                  {isAr ? 'جاري التحميل...' : 'Loading tafsir...'}
                </p>
              </div>
            ) : tafsir ? (
              <div
                className="tafsir-content text-sm leading-relaxed text-muted-foreground"
                dir={tafsirLang === 'ar' ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(tafsir.text, {
                    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'strong', 'em', 'br', 'div'],
                    ALLOWED_ATTR: ['class', 'dir'],
                  }),
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className={cn('text-sm text-muted-foreground', isAr && 'font-arabic-ui')}>
                  {isAr ? 'لا يوجد تفسير متاح لهذه الآية' : 'No tafsir available for this ayah'}
                </p>
              </div>
            )}
          </div>
          <div className="safe-area-bottom flex-shrink-0" />
        </div>
      </div>
    </>
  );
}

interface AyahCardProps {
  ayah: Ayah;
  translation?: Translation;
  tafsir?: TafsirEntry;
  tafsirLoading?: boolean;
  isPlaying: boolean;
  isCurrentAyah: boolean;
  isMemorized: boolean;
  isZenMode?: boolean;
  onPlay: () => void;
  onVisible: () => void;
  onToggleMemorized: () => void;
  settings: ReturnType<typeof useOfflineSettings>["settings"];
  surahId: number;
  language: string;
}

function AyahCard({
  ayah,
  translation,
  tafsir,
  tafsirLoading,
  isPlaying,
  isCurrentAyah,
  isMemorized,
  isZenMode,
  onPlay,
  onVisible,
  onToggleMemorized,
  settings,
  surahId,
  language,
}: AyahCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tafsirExpanded, setTafsirExpanded] = useState(false);
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
      data-ayah-number={ayah.numberInSurah}
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
      <div
        className={cn(
          "py-5 border-b border-border/30",
          isZenMode && "border-transparent",
        )}
      >
        {/* ── Verse Number Row ── */}
        <div
          className={cn(
            "flex items-center justify-between mb-4 transition-all duration-300",
            isZenMode && "mb-1 opacity-30",
          )}
        >
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
            {ayah.page > 0 && !isZenMode && (
              <span className="text-[9px] text-muted-foreground/40 tabular-nums">
                {ayah.juz ? `Juz ${ayah.juz}` : ""} · p.{ayah.page}
              </span>
            )}
          </div>

          {/* Action buttons — subtle, appear more on hover; hidden in zen mode */}
          <div
            className={cn(
              "flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-all duration-300",
              isZenMode && "opacity-0 pointer-events-none w-0 overflow-hidden",
            )}
          >
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

// =====================================
// Zen Mode Overlay — tap to show exit
// =====================================

function ZenModeOverlay({ onExit }: { onExit: () => void }) {
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);

  // Show controls briefly on mount, then fade out
  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setShowControls(false), 2500);
    return () => window.clearTimeout(hideTimer.current);
  }, []);

  const handleTap = useCallback(() => {
    if (showControls) {
      // If controls are visible, tapping exits
      onExit();
    } else {
      // Show controls, auto-hide after a few seconds
      setShowControls(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  }, [showControls, onExit]);

  return (
    <>
      {/* Invisible tap target covering the whole screen */}
      <div className="fixed inset-0 z-40" onClick={handleTap} />

      {/* Exit pill — shown/hidden */}
      <div
        className={cn(
          "fixed top-5 left-1/2 -translate-x-1/2 z-50",
          "transition-all duration-500 ease-out",
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-xl border border-[hsl(var(--mushaf-ornament)/0.15)] shadow-lg"
        >
          <X className="w-3.5 h-3.5 text-foreground/60" />
          <span className="text-[11px] font-medium text-foreground/70">
            Exit Zen Mode
          </span>
        </button>
      </div>
    </>
  );
}
