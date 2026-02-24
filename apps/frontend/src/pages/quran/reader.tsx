import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookMarked, Play, Pause, BookOpen, Layers, CheckCircle2, Settings2, ArrowLeft, Search, Menu, ChevronUp, FileText, Bookmark } from 'lucide-react';
import { Button } from '@template/ui';
import { toast } from 'sonner';
import { useOfflineSettings, useOfflineReadingProgress, useIsBookmarked, useOfflineBookmarks, useOfflineMemorization, useSurahMemorization } from '@/lib/hooks';
import { useAudioStore } from '@/lib/stores/audio-store';
import { getSurahById, BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';
import { ReadingSettingsSheet } from '@/components/reader/reading-settings-sheet';
import { MushafView } from '@/components/reader/mushaf-view';
import type { Ayah, Translation } from '@/types/quran';
import { cn } from '@/lib/utils';
import { useSidebarContext } from '@/components/layout/app-layout';

type ReadingMode = 'ayah' | 'mushaf';

export default function SurahReaderPage() {
  const { surahId: surahIdParam } = useParams<{ surahId: string }>();
  const surahId = parseInt(surahIdParam || '1', 10);

  const surah = getSurahById(surahId);
  const { settings, updateSettings } = useOfflineSettings();
  const { updatePosition, recordAyahRead } = useOfflineReadingProgress();

  // Memorization state
  const { memorization } = useSurahMemorization(surahId);
  const { markAyahMemorized, unmarkAyahMemorized } = useOfflineMemorization();

  // Global audio state - use direct store selectors to avoid infinite loops
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const playingSurahId = useAudioStore((s) => s.currentSurahId);
  const playingAyahIndex = useAudioStore((s) => s.currentAyahIndex);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  // Check if this surah is currently playing
  const isCurrentSurahPlaying = playingSurahId === surahId;
  const currentPlayingAyahIndex = isCurrentSurahPlaying ? playingAyahIndex : null;

  // Reading mode state
  const [readingMode, setReadingMode] = useState<ReadingMode>(
    settings.readingMode === 'page' ? 'mushaf' : 'ayah'
  );

  // Load data from bundled offline source (instant, no network)
  const { ayahs, translations } = useMemo(() => {
    const offlineData = getOfflineSurahWithTranslation(surahId);
    if (!offlineData) {
      return { ayahs: [], translations: [] };
    }

    // Convert to our Ayah type
    const ayahList: Ayah[] = offlineData.surah.verses.map((verse, index) => ({
      id: index + 1,
      surahId,
      numberInSurah: verse.id,
      text: verse.text,
      textSimple: verse.text,
      juz: 1,
      hizb: 1,
      page: 1,
      sajdah: false,
    }));

    // Convert to our Translation type
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

  // Settings sheet state
  const [showSettings, setShowSettings] = useState(false);

  // Listen for settings open event from bottom bar
  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener('open-reader-settings', handleOpenSettings);
    return () => window.removeEventListener('open-reader-settings', handleOpenSettings);
  }, []);

  // Handle reading mode change
  const handleReadingModeChange = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    updateSettings({ readingMode: mode === 'mushaf' ? 'page' : 'scroll' });
  }, [updateSettings]);

  // Play audio for an ayah
  const handlePlayAyah = useCallback((index: number) => {
    if (isCurrentSurahPlaying && playingAyahIndex === index && isPlaying) {
      pause();
    } else if (isCurrentSurahPlaying && playingAyahIndex === index && !isPlaying) {
      resume();
    } else {
      play(surahId, index);
    }
  }, [surahId, isCurrentSurahPlaying, playingAyahIndex, isPlaying, play, pause, resume]);

  // Play by ayah number (for Mushaf view)
  const playAyahByNumber = useCallback((ayahNumber: number) => {
    const index = ayahs.findIndex(a => a.numberInSurah === ayahNumber);
    if (index >= 0) {
      handlePlayAyah(index);
    }
  }, [ayahs, handlePlayAyah]);

  // Track reading progress
  const handleAyahVisible = useCallback(async (ayahNumber: number) => {
    await updatePosition(surahId, ayahNumber);
    await recordAyahRead(surahId, ayahNumber);
  }, [surahId, updatePosition, recordAyahRead]);

  // Check if an ayah is memorized
  const isAyahMemorized = useCallback((ayahNumber: number) => {
    return memorization?.memorizedAyahs.includes(ayahNumber) || false;
  }, [memorization]);

  // Toggle memorization for an ayah
  const handleToggleMemorized = useCallback((ayahNumber: number) => {
    if (isAyahMemorized(ayahNumber)) {
      unmarkAyahMemorized(surahId, ayahNumber);
    } else {
      markAyahMemorized(surahId, ayahNumber);
    }
  }, [surahId, isAyahMemorized, markAyahMemorized, unmarkAyahMemorized]);

  // Get current playing ayah number for Mushaf view
  const currentPlayingAyahNumber = currentPlayingAyahIndex !== null
    ? ayahs[currentPlayingAyahIndex]?.numberInSurah ?? null
    : null;

  const sidebar = useSidebarContext();

  if (!surah) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-muted-foreground">Surah not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 lg:pb-20">
      {/* App Bar - Figma style */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm safe-area-top">
        <div className="flex items-center justify-between px-5 py-3 md:px-8">
          {/* Left: Search */}
          <Link to="/search">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary hover:bg-primary/10"
            >
              <Search className="w-5 h-5" />
            </Button>
          </Link>

          {/* Center: Surah name + juz info */}
          <Link to="/quran" className="flex items-center gap-1.5">
            <ChevronUp className="w-4 h-4 text-primary" />
            <div className="text-center">
              <p className="font-arabic-ui text-lg md:text-xl font-bold text-primary leading-tight" dir="rtl">
                {surah.name}
              </p>
              <p className="font-arabic-ui text-xs text-primary/70" dir="rtl">
                الجزء {surah.startJuz} - {surah.numberOfAyahs} آيات
              </p>
            </div>
          </Link>

          {/* Right: Menu (hidden on desktop) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
            onClick={sidebar.open}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="hidden lg:block w-9" />
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-2 px-5 pb-2">
          <div className="flex items-center bg-secondary rounded-full p-1">
            <button
              onClick={() => handleReadingModeChange('ayah')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-arabic-ui font-bold transition-all',
                readingMode === 'ayah'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-primary/60 hover:text-primary'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              الآيات
            </button>
            <button
              onClick={() => handleReadingModeChange('mushaf')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-arabic-ui font-bold transition-all',
                readingMode === 'mushaf'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-primary/60 hover:text-primary'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              المصحف
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-primary"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content based on reading mode */}
      {ayahs.length > 0 && (
        readingMode === 'mushaf' ? (
          <MushafView
            surahId={surahId}
            ayahs={ayahs}
            arabicFontSize={settings.arabicFontSize}
            arabicFontFamily={settings.arabicFontFamily}
            currentPlayingAyah={currentPlayingAyahNumber}
            onAyahVisible={handleAyahVisible}
            onAyahClick={playAyahByNumber}
          />
        ) : (
          <>
            {/* Bismillah */}
            {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
              <div className="px-4 py-6 border-b border-border">
                <p
                  className={cn(
                    'arabic-text text-center text-2xl text-foreground/80',
                    settings.arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
                    settings.arabicFontFamily === 'uthmani' && 'arabic-uthmani'
                  )}
                >
                  {BISMILLAH}
                </p>
              </div>
            )}

            {/* Ayahs - verse by verse */}
            <div className="divide-y divide-border">
              {ayahs.map((ayah, index) => {
                const isThisAyahPlaying = isCurrentSurahPlaying && currentPlayingAyahIndex === index && isPlaying;
                return (
                  <AyahCard
                    key={ayah.id}
                    ayah={ayah}
                    translation={translations[index]}
                    isPlaying={isThisAyahPlaying}
                    isCurrentAyah={isCurrentSurahPlaying && currentPlayingAyahIndex === index}
                    isMemorized={isAyahMemorized(ayah.numberInSurah)}
                    onPlay={() => handlePlayAyah(index)}
                    onVisible={() => handleAyahVisible(ayah.numberInSurah)}
                    onToggleMemorized={() => handleToggleMemorized(ayah.numberInSurah)}
                    settings={settings}
                    surahId={surahId}
                  />
                );
              })}
            </div>
          </>
        )
      )}


      {/* Bottom Action Bar - Figma style */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-secondary border-t border-border safe-area-bottom lg:left-64">
        <div className="flex items-center justify-between px-8 py-3 max-w-3xl mx-auto">
          <button
            type="button"
            className="flex items-center gap-2 text-primary font-arabic-ui font-bold text-sm"
            onClick={() => setShowSettings(true)}
          >
            <span dir="rtl">تفسير السورة</span>
            <FileText className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 text-primary font-arabic-ui font-bold text-sm"
            onClick={() => toast.info('Bookmark feature')}
          >
            <span dir="rtl">إضافة علامة</span>
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reading Settings Sheet */}
      <ReadingSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

interface AyahCardProps {
  ayah: Ayah;
  translation?: Translation;
  isPlaying: boolean;
  isCurrentAyah: boolean;
  isMemorized: boolean;
  onPlay: () => void;
  onVisible: () => void;
  onToggleMemorized: () => void;
  settings: ReturnType<typeof useOfflineSettings>['settings'];
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible();
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [onVisible]);

  // Scroll into view when this ayah becomes current
  useEffect(() => {
    if (isCurrentAyah && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentAyah]);

  // Handle bookmark toggle
  const handleBookmarkClick = useCallback(() => {
    if (isBookmarked) {
      getBookmark(surahId, ayah.numberInSurah)
        .then((bookmark) => {
          if (bookmark) {
            return removeBookmark(bookmark.clientId);
          }
        })
        .then(() => {
          toast.success('Bookmark removed');
        })
        .catch((err) => {
          console.error('[Reader] Failed to remove bookmark:', err);
          toast.error('Failed to remove bookmark');
        });
    } else {
      addBookmark(surahId, ayah.numberInSurah)
        .then(() => {
          toast.success('Bookmark added');
        })
        .catch((err) => {
          console.error('[Reader] Failed to add bookmark:', err);
          toast.error('Failed to add bookmark');
        });
    }
  }, [isBookmarked, surahId, ayah.numberInSurah, getBookmark, removeBookmark, addBookmark]);

  // Handle memorization toggle
  const handleMemorizedClick = useCallback(() => {
    onToggleMemorized();
    if (isMemorized) {
      toast.success('Unmarked as memorized');
    } else {
      toast.success('Marked as memorized');
    }
  }, [onToggleMemorized, isMemorized]);

  const fontSize = settings.arabicFontSize || 28;

  return (
    <div
      ref={cardRef}
      className={cn(
        'px-5 py-5 md:px-8 md:py-6 transition-all duration-300',
        isCurrentAyah && 'bg-secondary border-r-4 border-r-accent'
      )}
    >
      {/* Header row with ayah number and actions */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold font-arabic-ui transition-colors',
          isCurrentAyah ? 'bg-accent text-white' : 'bg-secondary text-primary'
        )}>
          {ayah.numberInSurah}
        </span>
        <div className="flex items-center gap-2">
          {/* Memorization toggle */}
          <button
            type="button"
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
              'hover:bg-secondary active:bg-secondary/80 touch-manipulation',
              isMemorized && 'bg-emerald-500/10'
            )}
            onClick={handleMemorizedClick}
            aria-label={isMemorized ? "Mark as not memorized" : "Mark as memorized"}
          >
            <CheckCircle2
              className={cn(
                'h-5 w-5',
                isMemorized ? 'fill-emerald-500 text-emerald-500' : 'text-muted-foreground'
              )}
            />
          </button>
          {/* Bookmark toggle */}
          <button
            type="button"
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
              'hover:bg-secondary active:bg-secondary/80 touch-manipulation',
              isBookmarked && 'bg-primary/10'
            )}
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <BookMarked
              className={cn(
                'h-5 w-5',
                isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
              )}
            />
          </button>
          {/* Play/Pause */}
          <button
            type="button"
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
              'hover:bg-secondary active:bg-secondary/80 touch-manipulation',
              isCurrentAyah && 'text-primary bg-primary/10'
            )}
            onClick={onPlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Arabic Text */}
      <p
        className={cn(
          'arabic-text mb-4',
          settings.arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
          settings.arabicFontFamily === 'uthmani' && 'arabic-uthmani'
        )}
        style={{ fontSize: `${fontSize}px` }}
      >
        {ayah.text}
      </p>

      {/* Translation */}
      {settings.showTranslation && translation && (
        <p
          className="text-muted-foreground leading-relaxed"
          style={{ fontSize: `${settings.translationFontSize}px` }}
        >
          {translation.text}
        </p>
      )}
    </div>
  );
}
