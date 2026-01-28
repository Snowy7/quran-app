import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookMarked, Play, Pause, ChevronLeft, ChevronRight, Settings2, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@template/ui';
import { useOfflineSettings, useOfflineReadingProgress, useIsBookmarked, useOfflineBookmarks, useOfflineMemorization, useSurahMemorization } from '@/lib/hooks';
import { useAudioStore } from '@/lib/stores/audio-store';
import { getSurahById, SURAHS, BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';
import { ReadingSettingsSheet } from '@/components/reader/reading-settings-sheet';
import { MushafView } from '@/components/reader/mushaf-view';
import type { Ayah, Translation } from '@/types/quran';
import { cn } from '@/lib/utils';

type ReadingMode = 'ayah' | 'mushaf';

export default function SurahReaderPage() {
  const { surahId: surahIdParam } = useParams<{ surahId: string }>();
  const surahId = parseInt(surahIdParam || '1', 10);
  const navigate = useNavigate();

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

  // Handle reading mode change
  const handleReadingModeChange = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    updateSettings({ readingMode: mode === 'mushaf' ? 'page' : 'scroll' });
  }, [updateSettings]);

  // Handle surah change
  const handleSurahChange = useCallback((newSurahId: string) => {
    navigate(`/quran/${newSurahId}`);
  }, [navigate]);

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

  if (!surah) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-muted-foreground">Surah not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link to="/quran" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          {/* Surah Selector - Compact */}
          <Select value={surahId.toString()} onValueChange={handleSurahChange}>
            <SelectTrigger className="w-auto gap-1 border-0 bg-transparent hover:bg-secondary h-9 px-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                  {surah.id}
                </span>
                <span className="font-medium text-sm">{surah.englishName}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {SURAHS.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-secondary px-1.5 py-0.5 rounded w-7 text-center">
                      {s.id}
                    </span>
                    <span>{s.englishName}</span>
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Compact Info + Mode Toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{surah.englishNameTranslation}</span>
            <span>•</span>
            <span>{surah.numberOfAyahs} Ayahs</span>
          </div>

          {/* Compact Mode Toggle */}
          <div className="flex items-center bg-background rounded-lg p-0.5 border border-border">
            <button
              onClick={() => handleReadingModeChange('ayah')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                readingMode === 'ayah'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              Verse
            </button>
            <button
              onClick={() => handleReadingModeChange('mushaf')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                readingMode === 'mushaf'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Mushaf
            </button>
          </div>
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

      {/* Navigation */}
      {ayahs.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              surahId > 1 && navigate(`/quran/${surahId - 1}`);
            }}
            disabled={surahId <= 1}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              surahId < 114 && navigate(`/quran/${surahId + 1}`);
            }}
            disabled={surahId >= 114}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
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

  // Handle bookmark toggle - use void to prevent async issues on mobile
  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('[Reader] Bookmark clicked:', { surahId, ayahNumber: ayah.numberInSurah, isBookmarked });

    if (isBookmarked) {
      getBookmark(surahId, ayah.numberInSurah)
        .then((bookmark) => {
          if (bookmark) {
            return removeBookmark(bookmark.clientId);
          }
        })
        .catch((err) => console.error('[Reader] Failed to remove bookmark:', err));
    } else {
      addBookmark(surahId, ayah.numberInSurah)
        .then(() => console.log('[Reader] Bookmark added successfully'))
        .catch((err) => console.error('[Reader] Failed to add bookmark:', err));
    }
  }, [isBookmarked, surahId, ayah.numberInSurah, getBookmark, removeBookmark, addBookmark]);

  // Handle memorization toggle
  const handleMemorizedClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleMemorized();
  }, [onToggleMemorized]);

  const fontSize = settings.arabicFontSize || 28;

  return (
    <div
      ref={cardRef}
      className={cn(
        'px-4 py-5 transition-all duration-300',
        isCurrentAyah && 'bg-primary/10 border-l-4 border-l-primary'
      )}
    >
      {/* Header row with ayah number and actions */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors',
          isCurrentAyah ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
        )}>
          {ayah.numberInSurah}
        </span>
        <div className="flex items-center gap-1">
          {/* Memorization toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleMemorizedClick}
            title={isMemorized ? "Mark as not memorized" : "Mark as memorized"}
          >
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                isMemorized && 'fill-emerald-500 text-emerald-500'
              )}
            />
          </Button>
          {/* Bookmark toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleBookmarkClick}
            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <BookMarked
              className={cn(
                'h-4 w-4',
                isBookmarked && 'fill-primary text-primary'
              )}
            />
          </Button>
          {/* Play/Pause */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 transition-colors',
              isCurrentAyah && 'text-primary bg-primary/10'
            )}
            onClick={onPlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
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
