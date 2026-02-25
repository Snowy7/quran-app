import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookMarked, Play, Pause, CheckCircle2, Settings2, ArrowLeft, Share2,
  BookOpen, Layers, ChevronDown, BookText, X, ChevronsDown, Focus, Hash,
} from 'lucide-react';
import { Button } from '@template/ui';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import {
  useOfflineSettings, useOfflineReadingProgress, useIsBookmarked,
  useOfflineBookmarks, useOfflineMemorization, useSurahMemorization,
} from '@/lib/hooks';
import { useAudioStore } from '@/lib/stores/audio-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { getSurahById, SURAHS, BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import {
  getOfflineSurahWithTranslation,
  getVersePageNumber,
  getVerseMeta,
} from '@/data/quran-data';
import { fetchTafsir, AVAILABLE_TAFSIRS } from '@/lib/api/quran-api';
import { ReadingSettingsSheet, getFontStyle } from '@/components/reader/reading-settings-sheet';
import { MushafView } from '@/components/reader/mushaf-view';
import { useTranslation } from '@/lib/i18n';
import type { Ayah, Translation, TafsirEntry } from '@/types/quran';
import { cn } from '@/lib/utils';

type ReadingMode = 'ayah' | 'mushaf';

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'[parseInt(d)]);
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

      {/* Dropdown */}
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
  const surahId = parseInt(surahIdParam || '1', 10);
  const pageId = pageIdParam ? parseInt(pageIdParam, 10) : undefined;

  const { t, language, isRTL } = useTranslation();
  const surah = getSurahById(surahId);
  const nextSurah = surahId < 114 ? getSurahById(surahId + 1) : null;
  const { settings, updateSettings } = useOfflineSettings();
  const { progress, updatePosition, recordAyahRead } = useOfflineReadingProgress();

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
  const currentPlayingAyahIndex = isCurrentSurahPlaying ? playingAyahIndex : null;

  // Reading mode state
  const [readingMode, setReadingMode] = useState<ReadingMode>(
    pageId ? 'mushaf' : settings.readingMode === 'page' ? 'mushaf' : 'ayah'
  );

  // Surah picker state
  const [showSurahPicker, setShowSurahPicker] = useState(false);

  // Zen mode (distraction-free)
  const isZenMode = useUIStore((s) => s.isZenMode);
  const setZenMode = useUIStore((s) => s.setZenMode);

  // Jump-to-ayah dialog
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Next surah on overscroll ──
  const [overscrollProgress, setOverscrollProgress] = useState(0);
  const overscrollTriggered = useRef(false);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Scroll to top when surah changes
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
    const THRESHOLD = 400;

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
      const p = Math.min(accumulatedScroll / THRESHOLD, 1);
      setOverscrollProgress(p);
      if (p >= 1) {
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
      const p = Math.min(accumulatedScroll / THRESHOLD, 1);
      setOverscrollProgress(p);
      if (p >= 1) {
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

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
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
          (typeof meta?.sajda === 'object' && meta?.sajda !== null),
      };
    });

    const translationList: Translation[] = settings.showTranslation
      ? offlineData.surah.verses.map((verse) => ({
          ayahId: verse.id,
          text: offlineData.translations[verse.id] || '',
          languageCode: 'en',
          translatorName: 'Sahih International',
          translatorId: 'en.sahih',
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
    window.addEventListener('open-reader-settings', handleOpenSettings);
    return () => window.removeEventListener('open-reader-settings', handleOpenSettings);
  }, []);

  // Exit zen mode on unmount (leaving reader page)
  useEffect(() => {
    return () => setZenMode(false);
  }, [setZenMode]);

  // Escape key exits zen mode or closes jump dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showJumpDialog) {
          setShowJumpDialog(false);
        } else if (isZenMode) {
          setZenMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, setZenMode, showJumpDialog]);

  // Focus jump input when dialog opens
  useEffect(() => {
    if (showJumpDialog) {
      setJumpInput('');
      setTimeout(() => jumpInputRef.current?.focus(), 100);
    }
  }, [showJumpDialog]);

  // Jump to ayah handler
  const handleJumpToAyah = useCallback((ayahNumber: number) => {
    if (!surah || ayahNumber < 1 || ayahNumber > surah.numberOfAyahs) {
      toast.error(`Invalid ayah. Enter 1\u2013${surah?.numberOfAyahs || '?'}`);
      return;
    }
    setShowJumpDialog(false);

    const scrollToAyah = () => {
      const el =
        document.querySelector(`[data-ayah-number="${ayahNumber}"]`) ||
        document.querySelector(`[data-verse-key="${surahId}:${ayahNumber}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-primary');
        }, 2000);
      }
    };

    if (readingMode === 'mushaf') {
      const targetPage = getVersePageNumber(surahId, ayahNumber);
      window.dispatchEvent(new CustomEvent('mushaf-load-to-page', { detail: { page: targetPage } }));
      setTimeout(scrollToAyah, 150);
    } else {
      scrollToAyah();
    }
  }, [surah, surahId, readingMode]);

  // Scroll-based reading progress
  useEffect(() => {
    let rafId: number;
    let lastPct = -1;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        if (pct !== lastPct) {
          lastPct = pct;
          useUIStore.getState().setReadingScrollProgress({
            surahId,
            currentAyah: pct,
            totalAyahs: 100,
          });
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
      useUIStore.getState().setReadingScrollProgress(null);
    };
  }, [surahId]);

  const handleReadingModeChange = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    updateSettings({ readingMode: mode === 'mushaf' ? 'page' : 'scroll' });
  }, [updateSettings]);

  const handlePlayAyah = useCallback((index: number) => {
    if (isCurrentSurahPlaying && playingAyahIndex === index && isPlaying) {
      pause();
    } else if (isCurrentSurahPlaying && playingAyahIndex === index && !isPlaying) {
      resume();
    } else {
      play(surahId, index);
    }
  }, [surahId, isCurrentSurahPlaying, playingAyahIndex, isPlaying, play, pause, resume]);

  // Play by surah + ayah number (for Mushaf view)
  const playAyahByNumber = useCallback((targetSurahId: number, ayahNumber: number) => {
    if (targetSurahId === surahId) {
      const index = ayahs.findIndex(a => a.numberInSurah === ayahNumber);
      if (index >= 0) handlePlayAyah(index);
    } else {
      play(targetSurahId, ayahNumber - 1);
    }
  }, [surahId, ayahs, handlePlayAyah, play]);

  // Track reading progress (for Mushaf)
  const handleMushafAyahVisible = useCallback(async (targetSurahId: number, ayahNumber: number) => {
    await updatePosition(targetSurahId, ayahNumber);
    await recordAyahRead(targetSurahId, ayahNumber);
  }, [updatePosition, recordAyahRead]);

  // Track reading progress (for verse mode)
  const handleAyahVisible = useCallback(async (ayahNumber: number) => {
    await updatePosition(surahId, ayahNumber);
    await recordAyahRead(surahId, ayahNumber);
  }, [surahId, updatePosition, recordAyahRead]);

  const isAyahMemorized = useCallback((ayahNumber: number) => {
    return memorization?.memorizedAyahs.includes(ayahNumber) || false;
  }, [memorization]);

  const handleToggleMemorized = useCallback((ayahNumber: number) => {
    if (isAyahMemorized(ayahNumber)) {
      unmarkAyahMemorized(surahId, ayahNumber);
    } else {
      markAyahMemorized(surahId, ayahNumber);
    }
  }, [surahId, isAyahMemorized, markAyahMemorized, unmarkAyahMemorized]);

  const currentPlayingAyahNumber = currentPlayingAyahIndex !== null
    ? (ayahs[currentPlayingAyahIndex]?.numberInSurah ?? null)
    : null;

  if (!surah && !pageId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('surahNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 safe-area-top',
          'transition-all duration-500 ease-out',
          headerVisible && !isZenMode
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none',
        )}
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background/85 backdrop-blur-2xl" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-border/30" />

          <div className="relative z-10 flex items-center justify-between h-12 px-2 max-w-3xl mx-auto">
            {/* Left — back button */}
            <Link
              to="/quran"
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors shrink-0"
            >
              <ArrowLeft className={cn('w-[18px] h-[18px] text-foreground/70', isRTL && 'rotate-180')} />
            </Link>

            {/* Center — surah info with picker */}
            <button
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-secondary/50 transition-colors min-w-0"
              onClick={() => setShowSurahPicker(!showSurahPicker)}
            >
              <p className="font-arabic-ui text-base font-bold text-primary truncate" dir="rtl">
                {surah?.name || ''}
              </p>
              <span className="text-[11px] font-semibold text-foreground/80 truncate max-w-[120px]">
                {surah?.englishName || (pageId ? `Page ${pageId}` : '')}
              </span>
              <ChevronDown className={cn(
                'w-3.5 h-3.5 text-primary/60 shrink-0 transition-transform',
                showSurahPicker && 'rotate-180'
              )} />
            </button>

            {/* Right — actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Mode Toggle */}
              <div className="flex items-center bg-secondary rounded-full p-0.5 mr-0.5">
                <button
                  onClick={() => handleReadingModeChange('ayah')}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                    readingMode === 'ayah'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground/50 hover:text-foreground',
                  )}
                  title={t('verses')}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleReadingModeChange('mushaf')}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                    readingMode === 'mushaf'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground/50 hover:text-foreground',
                  )}
                  title={t('mushaf')}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Jump to ayah */}
              <button
                onClick={() => setShowJumpDialog(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                title="Jump to ayah"
              >
                <Hash className="w-3.5 h-3.5 text-foreground/60" />
              </button>

              {/* Zen mode */}
              <button
                onClick={() => setZenMode(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                title="Zen mode"
              >
                <Focus className="w-4 h-4 text-foreground/60" />
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                title={t('readingSettings')}
              >
                <Settings2 className="w-4 h-4 text-foreground/60" />
              </button>
            </div>
          </div>
        </div>

        {/* Surah picker dropdown */}
        <SurahPicker
          currentSurahId={surahId}
          isOpen={showSurahPicker}
          onClose={() => setShowSurahPicker(false)}
          onSelect={(id) => navigate(`/quran/${id}`)}
          language={language}
        />
      </header>

      {/* Spacer for fixed header */}
      <div className={cn(
        'safe-area-top transition-all duration-500',
        isZenMode ? 'h-0' : 'h-12',
      )} />

      {/* ── Zen mode exit overlay ── */}
      {isZenMode && <ZenModeOverlay onExit={() => setZenMode(false)} />}

      {/* ── Jump to Ayah dialog ── */}
      {showJumpDialog && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setShowJumpDialog(false)}
          />
          <div className="fixed z-[70] top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] animate-scale-in">
            <div className="relative overflow-hidden rounded-2xl bg-background border border-border shadow-2xl">
              <div className="relative z-10 p-5">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium text-center mb-3">
                  {isRTL ? 'الانتقال إلى آية' : 'Jump to Ayah'}
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
                      placeholder={`1 \u2013 ${surah?.numberOfAyahs || '?'}`}
                      className="flex-1 h-10 rounded-xl bg-secondary/50 border border-border/40 px-3 text-center text-sm font-medium tabular-nums placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      {isRTL ? 'اذهب' : 'Go'}
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

      {/* ── Content Area ── */}
      {readingMode === 'mushaf' ? (
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
          {/* Surah Opening */}
          {surah && (
            <div
              className="mx-auto px-4 sm:px-8 pt-4 pb-2"
              style={{ maxWidth: `${settings.readingWidth}%` }}
            >
              <div className="relative overflow-hidden rounded-xl border border-border/40">
                <div className="relative z-10 text-center py-6 px-6">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex-1 max-w-[80px] h-px bg-gradient-to-r from-transparent to-primary/20" />
                    <p className="arabic-text text-2xl sm:text-3xl text-primary leading-normal">
                      {surah.name}
                    </p>
                    <div className="flex-1 max-w-[80px] h-px bg-gradient-to-l from-transparent to-primary/20" />
                  </div>
                  <p className="text-[11px] text-foreground/70 font-semibold tracking-wide mb-0.5">
                    {surah.englishName}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 font-medium tracking-widest uppercase">
                    {surah.englishNameTranslation}
                    <span className="mx-1.5 text-muted-foreground/20">&middot;</span>
                    {surah.numberOfAyahs} {t('ayahs') || 'Ayahs'}
                    <span className="mx-1.5 text-muted-foreground/20">&middot;</span>
                    {surah.revelationType === 'Meccan' ? 'Makkah' : 'Madinah'}
                  </p>
                </div>
              </div>

              {/* Bismillah */}
              {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
                <div className="text-center my-3">
                  <p
                    className="arabic-text inline-block text-primary/80"
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

          {/* Verse List */}
          <div
            className="mx-auto px-4 md:px-6 space-y-3 pb-4"
            style={{ maxWidth: `${settings.readingWidth}%` }}
          >
            {ayahs.map((ayah, index) => {
              const isThisAyahPlaying = isCurrentSurahPlaying && currentPlayingAyahIndex === index && isPlaying;
              return (
                <AyahCard
                  key={ayah.id}
                  ayah={ayah}
                  translation={translations[index]}
                  tafsir={settings.showTafsir ? tafsirEntries.find(t => t.verseKey === `${surahId}:${ayah.numberInSurah}`) : undefined}
                  tafsirLoading={tafsirLoading}
                  isPlaying={isThisAyahPlaying}
                  isCurrentAyah={isCurrentSurahPlaying && currentPlayingAyahIndex === index}
                  isMemorized={isAyahMemorized(ayah.numberInSurah)}
                  isZenMode={isZenMode}
                  onPlay={() => handlePlayAyah(index)}
                  onVisible={() => handleAyahVisible(ayah.numberInSurah)}
                  onToggleMemorized={() => handleToggleMemorized(ayah.numberInSurah)}
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
            <p className="text-[11px] text-muted-foreground/40">
              {isRTL ? `نهاية ${surah?.name || 'السورة'}` : `End of ${surah?.englishName || 'Surah'}`}
            </p>
          </div>
        </div>
      )}

      {/* ── Next Surah Transition (overscroll) ── */}
      {nextSurah && (
        <div ref={bottomSentinelRef} className="pb-24">
          <div className="max-w-md mx-auto px-6">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/30 transition-all duration-300"
              style={{
                opacity: 0.5 + overscrollProgress * 0.5,
                transform: `translateY(${(1 - overscrollProgress) * 8}px)`,
              }}
            >
              <div className="relative z-10 text-center py-6 px-5">
                <div className="flex justify-center mb-3">
                  <ChevronsDown
                    className="w-5 h-5 text-primary/50 transition-all duration-200"
                    style={{
                      opacity: 0.3 + overscrollProgress * 0.7,
                      transform: `scale(${1 + overscrollProgress * 0.15})`,
                    }}
                  />
                </div>

                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium mb-3">
                  {overscrollProgress >= 1 ? (isRTL ? 'جاري التحميل' : 'Loading') : (isRTL ? 'تابع القراءة' : 'Continue reading')}
                </p>

                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-px bg-gradient-to-r from-transparent to-primary/15" />
                  <p className="arabic-text text-lg text-primary leading-normal">
                    {nextSurah.name}
                  </p>
                  <div className="w-10 h-px bg-gradient-to-l from-transparent to-primary/15" />
                </div>
                <p className="text-[12px] font-medium text-foreground/60">{nextSurah.englishName}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">{nextSurah.englishNameTranslation}</p>

                {/* Progress indicator */}
                <div className="mt-4 mx-auto max-w-[120px]">
                  <div className="h-[2px] rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-100 ease-out"
                      style={{ width: `${overscrollProgress * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-[9px] text-muted-foreground/35 mt-2">
                  {overscrollProgress >= 1 ? '' : overscrollProgress > 0 ? (isRTL ? 'واصل...' : 'Keep going...') : (isRTL ? 'مرر للأسفل للمتابعة' : 'Scroll down to continue')}
                </p>

                {overscrollProgress >= 1 && (
                  <div className="flex justify-center mt-2">
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
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
        surahName={surah?.name || ''}
        tafsir={mushafTafsirEntry}
        tafsirLoading={tafsirLoading}
        tafsirId={settings.primaryTafsir}
        language={language}
      />
    </div>
  );
}

// =====================================
// Tafsir Sheet — bottom sheet for mushaf long-press
// =====================================

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

// =====================================
// Ayah Card — verse-by-verse view with tafsir, i18n
// =====================================

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
  settings: ReturnType<typeof useOfflineSettings>['settings'];
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onVisible();
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  useEffect(() => {
    if (isCurrentAyah && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentAyah]);

  const handleBookmarkClick = useCallback(() => {
    if (isBookmarked) {
      getBookmark(surahId, ayah.numberInSurah)
        .then((bookmark) => {
          if (bookmark) return removeBookmark(bookmark.clientId);
        })
        .then(() => toast.success('Bookmark removed'))
        .catch((err) => {
          console.error('[Reader] Failed to remove bookmark:', err);
          toast.error('Failed to remove bookmark');
        });
    } else {
      addBookmark(surahId, ayah.numberInSurah)
        .then(() => toast.success('Bookmark added'))
        .catch((err) => {
          console.error('[Reader] Failed to add bookmark:', err);
          toast.error('Failed to add bookmark');
        });
    }
  }, [isBookmarked, surahId, ayah.numberInSurah, getBookmark, removeBookmark, addBookmark]);

  const handleMemorizedClick = useCallback(() => {
    onToggleMemorized();
    toast.success(isMemorized ? 'Unmarked as memorized' : 'Marked as memorized');
  }, [onToggleMemorized, isMemorized]);

  const fontSize = settings.arabicFontSize || 28;

  return (
    <div
      ref={cardRef}
      data-ayah-number={ayah.numberInSurah}
      className={cn(
        'rounded-2xl border transition-all duration-300',
        isCurrentAyah
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-card border-border hover:border-border/80'
      )}
    >
      {/* Arabic Text */}
      <div className="px-5 pt-5 pb-4 md:px-6 md:pt-6">
        <p
          className={cn(
            'arabic-text leading-[2.2]',
            settings.textColorMode === 'soft' && 'text-[hsl(var(--text-soft))]',
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

        {/* Translation */}
        {settings.showTranslation && translation && (
          <p
            className="text-muted-foreground leading-relaxed mt-3 border-t border-border/50 pt-3"
            style={{ fontSize: `${settings.translationFontSize}px` }}
          >
            {translation.text}
          </p>
        )}

        {/* Tafsir toggle */}
        {settings.showTafsir && (tafsir || tafsirLoading) && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <button
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={() => setTafsirExpanded(!tafsirExpanded)}
            >
              <BookText className="w-3.5 h-3.5" />
              {language === 'ar' ? 'التفسير' : 'Tafsir'}
              <ChevronDown className={cn(
                'w-3 h-3 transition-transform',
                tafsirExpanded && 'rotate-180'
              )} />
            </button>

            {tafsirExpanded && (
              <div className="mt-2">
                {tafsirLoading ? (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading tafsir...'}
                  </p>
                ) : tafsir ? (
                  <div
                    className="tafsir-content text-sm leading-relaxed text-muted-foreground"
                    dir={AVAILABLE_TAFSIRS.find(t => t.id === settings.primaryTafsir)?.language === 'ar' ? 'rtl' : 'ltr'}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(tafsir.text, {
                        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'strong', 'em', 'br', 'div'],
                        ALLOWED_ATTR: ['class', 'dir'],
                      }),
                    }}
                  />
                ) : null}
              </div>
            )}
          </div>
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

      {/* Action bar */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-t border-border/50 bg-secondary/30 rounded-b-2xl transition-all duration-300',
        isZenMode && 'opacity-30',
      )}>
        {/* Ayah number */}
        <span className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
          isCurrentAyah ? 'bg-primary text-white' : 'bg-secondary text-primary'
        )}>
          {language === 'ar' ? toArabicNumerals(ayah.numberInSurah) : ayah.numberInSurah}
        </span>

        {/* Juz/Page micro-label */}
        {ayah.page > 0 && !isZenMode && (
          <span className="text-[9px] text-muted-foreground/40 tabular-nums">
            {ayah.juz ? `Juz ${ayah.juz}` : ''} · p.{ayah.page}
          </span>
        )}

        {/* Action buttons */}
        <div className={cn(
          'flex items-center gap-0.5',
          isZenMode && 'opacity-0 pointer-events-none w-0 overflow-hidden',
        )}>
          {/* Memorization */}
          <button
            type="button"
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              'hover:bg-secondary active:bg-secondary/80 touch-manipulation',
              isMemorized && 'bg-emerald-500/10'
            )}
            onClick={handleMemorizedClick}
            aria-label={isMemorized ? 'Unmark memorized' : 'Mark memorized'}
          >
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                isMemorized ? 'fill-emerald-500 text-emerald-500' : 'text-muted-foreground'
              )}
            />
          </button>

          {/* Bookmark */}
          <button
            type="button"
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              'hover:bg-secondary active:bg-secondary/80 touch-manipulation',
              isBookmarked && 'bg-primary/10'
            )}
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <BookMarked
              className={cn(
                'h-4 w-4',
                isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
              )}
            />
          </button>

          {/* Share */}
          <button
            type="button"
            className="h-8 w-8 rounded-full flex items-center justify-center transition-colors hover:bg-secondary active:bg-secondary/80 touch-manipulation"
            onClick={() => {
              const text = `${ayah.text}\n\n${translation?.text || ''}`;
              if (navigator.share) {
                navigator.share({ text }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text);
                toast.success('Copied to clipboard');
              }
            }}
            aria-label="Share"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Play/Pause */}
          <button
            type="button"
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              'hover:bg-primary/10 active:bg-primary/20 touch-manipulation',
              isCurrentAyah ? 'bg-primary text-white' : 'text-primary'
            )}
            onClick={onPlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        </div>
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

  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setShowControls(false), 2500);
    return () => window.clearTimeout(hideTimer.current);
  }, []);

  const handleTap = useCallback(() => {
    if (showControls) {
      onExit();
    } else {
      setShowControls(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  }, [showControls, onExit]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={handleTap} />
      <div
        className={cn(
          'fixed top-5 left-1/2 -translate-x-1/2 z-50',
          'transition-all duration-500 ease-out',
          showControls
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none',
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-xl border border-border shadow-lg"
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
