import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookMarked, Play, Pause, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { Button } from '@template/ui';
import { getAyahAudioUrl } from '@/lib/api/quran-api';
import { useOfflineSettings, useOfflineReadingProgress, useIsBookmarked, useOfflineBookmarks } from '@/lib/hooks';
import { getSurahById, BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';
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
      juz: 1, // We don't have juz info in this data
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

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number | null>(null);
  const howlRef = useRef<Howl | null>(null);

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

    if (howlRef.current) {
      howlRef.current.unload();
    }

    const audioUrl = getAyahAudioUrl(settings.defaultReciterId, surahId, ayah.numberInSurah);

    const sound = new Howl({
      src: [audioUrl],
      html5: true,
      rate: settings.playbackSpeed,
      onend: () => {
        if (settings.autoPlayNext && index < ayahs.length - 1) {
          playAyah(index + 1);
        } else {
          setIsPlaying(false);
          setCurrentAyahIndex(null);
        }
      },
      onloaderror: () => {
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
      playAyah(0);
    }
  }, [isPlaying, currentAyahIndex, playAyah]);

  // Track reading progress
  const handleAyahVisible = useCallback(async (ayahNumber: number) => {
    await updatePosition(surahId, ayahNumber);
    await recordAyahRead(surahId, ayahNumber);
  }, [surahId, updatePosition, recordAyahRead]);

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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link to="/quran" className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{surah.englishName}</h1>
              <p className="text-xs text-muted-foreground">{surah.numberOfAyahs} verses</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Surah Header */}
      <div className="text-center py-8 px-4 border-b border-border">
        <h2 className="arabic-text text-3xl mb-2">{surah.name}</h2>
        <p className="text-sm text-muted-foreground">{surah.englishNameTranslation}</p>
      </div>

      {/* Bismillah */}
      {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
        <div className="bismillah arabic-text border-b border-border">
          {BISMILLAH}
        </div>
      )}

      {/* Ayahs - loaded instantly from bundled data */}
      {ayahs.length > 0 && (
        <div className="divide-y divide-border">
          {ayahs.map((ayah, index) => (
            <AyahRow
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

      {/* Navigation */}
      {ayahs.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => surahId > 1 && navigate(`/quran/${surahId - 1}`)}
            disabled={surahId <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="ghost"
            onClick={() => surahId < 114 && navigate(`/quran/${surahId + 1}`)}
            disabled={surahId >= 114}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Audio Player */}
      {ayahs.length > 0 && (
        <div className="audio-player-bar px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
              <div>
                <p className="text-sm font-medium">
                  {currentAyahIndex !== null
                    ? `Verse ${ayahs[currentAyahIndex]?.numberInSurah}`
                    : 'Play audio'}
                </p>
                <p className="text-xs text-muted-foreground">{surah.englishName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AyahRowProps {
  ayah: Ayah;
  translation?: Translation;
  isPlaying: boolean;
  onPlay: () => void;
  onVisible: () => void;
  settings: ReturnType<typeof useOfflineSettings>['settings'];
  surahId: number;
}

function AyahRow({
  ayah,
  translation,
  isPlaying,
  onPlay,
  onVisible,
  settings,
  surahId,
}: AyahRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
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

    if (rowRef.current) {
      observer.observe(rowRef.current);
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

  const fontSize = settings.arabicFontSize || 28;

  return (
    <div
      ref={rowRef}
      className={cn(
        'px-4 py-6 transition-colors',
        isPlaying && 'bg-primary/5'
      )}
    >
      {/* Ayah Number & Actions */}
      <div className="flex items-center justify-between mb-4">
        <span className="ayah-number">{ayah.numberInSurah}</span>
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
