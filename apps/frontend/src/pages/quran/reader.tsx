import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookMarked, Play, Pause, Settings2, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { Button, Card, CardContent, Skeleton } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { db } from '@/lib/db';
import { fetchSurahAyahs, fetchTranslation, getAyahAudioUrl } from '@/lib/api/quran-api';
import { useOfflineSettings, useOfflineReadingProgress, useIsBookmarked, useOfflineBookmarks } from '@/lib/hooks';
import { getSurahById, BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import type { Ayah, Translation } from '@/types/quran';
import { cn } from '@/lib/utils';
import { Howl } from 'howler';

export default function SurahReaderPage() {
  const { surahId: surahIdParam } = useParams<{ surahId: string }>();
  const surahId = parseInt(surahIdParam || '1', 10);
  const navigate = useNavigate();

  const surah = getSurahById(surahId);
  const { settings } = useOfflineSettings();
  const { updatePosition, recordAyahRead } = useOfflineReadingProgress();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number | null>(null);
  const howlRef = useRef<Howl | null>(null);

  // Load surah data
  useEffect(() => {
    async function loadData() {
      if (!surah) return;

      setIsLoading(true);
      setError(null);

      try {
        const [ayahData, translationData] = await Promise.all([
          fetchSurahAyahs(surahId),
          settings.showTranslation
            ? fetchTranslation(surahId, settings.primaryTranslation)
            : Promise.resolve([]),
        ]);

        setAyahs(ayahData);
        setTranslations(translationData);
      } catch (err) {
        console.error('Failed to load surah:', err);
        setError('Failed to load surah. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [surahId, surah, settings.showTranslation, settings.primaryTranslation]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
    };
  }, []);

  // Play audio for an ayah
  const playAyah = useCallback((index: number) => {
    const ayah = ayahs[index];
    if (!ayah) return;

    // Stop current audio
    if (howlRef.current) {
      howlRef.current.unload();
    }

    const audioUrl = getAyahAudioUrl(settings.defaultReciterId, surahId, ayah.numberInSurah);

    const sound = new Howl({
      src: [audioUrl],
      html5: true,
      rate: settings.playbackSpeed,
      onend: () => {
        // Auto-play next ayah if enabled
        if (settings.autoPlayNext && index < ayahs.length - 1) {
          playAyah(index + 1);
        } else {
          setIsPlaying(false);
          setCurrentAyahIndex(null);
        }
      },
      onloaderror: () => {
        console.error('Failed to load audio');
        setIsPlaying(false);
        setCurrentAyahIndex(null);
      },
    });

    howlRef.current = sound;
    sound.play();
    setIsPlaying(true);
    setCurrentAyahIndex(index);
  }, [ayahs, surahId, settings.defaultReciterId, settings.playbackSpeed, settings.autoPlayNext]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying && howlRef.current) {
      howlRef.current.pause();
      setIsPlaying(false);
    } else if (currentAyahIndex !== null && howlRef.current) {
      howlRef.current.play();
      setIsPlaying(true);
    } else {
      // Start from beginning
      playAyah(0);
    }
  }, [isPlaying, currentAyahIndex, playAyah]);

  // Track reading progress
  const handleAyahVisible = useCallback(async (ayahNumber: number) => {
    await updatePosition(surahId, ayahNumber);
    await recordAyahRead(surahId, ayahNumber);
  }, [surahId, updatePosition, recordAyahRead]);

  // Navigate to previous/next surah
  const goToPrevSurah = () => {
    if (surahId > 1) navigate(`/quran/${surahId - 1}`);
  };

  const goToNextSurah = () => {
    if (surahId < 114) navigate(`/quran/${surahId + 1}`);
  };

  if (!surah) {
    return (
      <div className="page-container">
        <AppHeader title="Not Found" showBack />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Surah not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <AppHeader
        title={surah.englishName}
        subtitle={surah.englishNameTranslation}
        showBack
        showSearch={false}
        rightContent={
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings2 className="h-5 w-5" />
          </Button>
        }
      />

      <main className="px-4 py-4">
        {/* Surah Info */}
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <h1 className="arabic-text text-3xl mb-2">{surah.name}</h1>
            <p className="text-sm text-muted-foreground">
              {surah.revelationType} - {surah.numberOfAyahs} Verses
            </p>
          </CardContent>
        </Card>

        {/* Bismillah */}
        {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
          <div className="bismillah arabic-text">
            {BISMILLAH}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 text-center">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ayahs */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {ayahs.map((ayah, index) => (
              <AyahCard
                key={ayah.id}
                ayah={ayah}
                translation={translations[index]}
                isPlaying={currentAyahIndex === index && isPlaying}
                onPlay={() => playAyah(index)}
                onVisible={() => handleAyahVisible(ayah.numberInSurah)}
                settings={settings}
                surahId={surahId}
              />
            ))}
          </div>
        )}

        {/* Surah Navigation */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={goToPrevSurah}
              disabled={surahId <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={goToNextSurah}
              disabled={surahId >= 114}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>

      {/* Audio Player Bar */}
      {ayahs.length > 0 && (
        <div className="audio-player-bar p-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <div>
                <p className="text-sm font-medium">
                  {currentAyahIndex !== null
                    ? `Verse ${ayahs[currentAyahIndex]?.numberInSurah || 1}`
                    : 'Ready to play'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {surah.englishName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AyahCardProps {
  ayah: Ayah;
  translation?: Translation;
  isPlaying: boolean;
  onPlay: () => void;
  onVisible: () => void;
  settings: ReturnType<typeof useOfflineSettings>['settings'];
  surahId: number;
}

function AyahCard({
  ayah,
  translation,
  isPlaying,
  onPlay,
  onVisible,
  settings,
  surahId,
}: AyahCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isBookmarked } = useIsBookmarked(surahId, ayah.numberInSurah);
  const { addBookmark, removeBookmark, getBookmark } = useOfflineBookmarks();

  // Intersection observer to track visibility
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

  const toggleBookmark = async () => {
    if (isBookmarked) {
      const bookmark = await getBookmark(surahId, ayah.numberInSurah);
      if (bookmark) {
        await removeBookmark(bookmark.clientId);
      }
    } else {
      await addBookmark(surahId, ayah.numberInSurah);
    }
  };

  const fontSizeClass = {
    18: 'text-lg',
    22: 'text-xl',
    26: 'text-2xl',
    28: 'text-2xl',
    32: 'text-3xl',
    36: 'text-4xl',
    40: 'text-4xl',
    44: 'text-5xl',
    48: 'text-5xl',
  }[settings.arabicFontSize] || 'text-2xl';

  return (
    <Card
      ref={cardRef}
      className={cn(
        'transition-all duration-300',
        isPlaying && 'ayah-highlight border-primary/30'
      )}
    >
      <CardContent className="p-4">
        {/* Ayah Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="ayah-number">{ayah.numberInSurah}</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleBookmark}
            >
              <BookMarked
                className={cn(
                  'h-4 w-4',
                  isBookmarked && 'fill-primary text-primary'
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
            'arabic-text leading-loose mb-4',
            fontSizeClass,
            settings.arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
            settings.arabicFontFamily === 'amiri' && 'arabic-amiri',
            settings.arabicFontFamily === 'uthmani' && 'arabic-uthmani'
          )}
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

        {/* Sajdah Indicator */}
        {ayah.sajdah && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Sajdah {ayah.sajdahType === 'obligatory' ? '(Obligatory)' : '(Recommended)'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
