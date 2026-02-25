import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookMarked, Play, Pause, CheckCircle2, Settings2, ArrowLeft, Share2, BookOpen, Layers, ChevronDown, BookText, X } from 'lucide-react';
import { Button } from '@template/ui';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { useOfflineSettings, useOfflineReadingProgress, useIsBookmarked, useOfflineBookmarks, useOfflineMemorization, useSurahMemorization } from '@/lib/hooks';
import { useAudioStore } from '@/lib/stores/audio-store';
import { getSurahById, SURAHS, BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';
import { fetchTafsir, AVAILABLE_TAFSIRS } from '@/lib/api/quran-api';
import { ReadingSettingsSheet } from '@/components/reader/reading-settings-sheet';
import { MushafView } from '@/components/reader/mushaf-view';
import { useTranslation } from '@/lib/i18n';
import type { Ayah, Translation, TafsirEntry } from '@/types/quran';
import { cn } from '@/lib/utils';

type ReadingMode = 'ayah' | 'mushaf';

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
  const { surahId: surahIdParam } = useParams<{ surahId: string }>();
  const surahId = parseInt(surahIdParam || '1', 10);
  const navigate = useNavigate();

  const surah = getSurahById(surahId);
  const { settings, updateSettings } = useOfflineSettings();
  const { updatePosition, recordAyahRead } = useOfflineReadingProgress();
  const { t, language, isRTL } = useTranslation();

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
    settings.readingMode === 'page' ? 'mushaf' : 'ayah'
  );

  // Surah picker state
  const [showSurahPicker, setShowSurahPicker] = useState(false);

  // Load data from bundled offline source
  const { ayahs, translations } = useMemo(() => {
    const offlineData = getOfflineSurahWithTranslation(surahId);
    if (!offlineData) {
      return { ayahs: [], translations: [] };
    }

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

  const playAyahByNumber = useCallback((ayahNumber: number) => {
    const index = ayahs.findIndex(a => a.numberInSurah === ayahNumber);
    if (index >= 0) {
      handlePlayAyah(index);
    }
  }, [ayahs, handlePlayAyah]);

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
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm safe-area-top border-b border-border/50 relative">
        <div className="flex items-center px-3 py-2 md:px-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary hover:bg-primary/10 shrink-0"
            onClick={() => navigate('/quran')}
          >
            <ArrowLeft className={cn('w-5 h-5', isRTL && 'rotate-180')} />
          </Button>

          {/* Center: Surah name only */}
          <div className="flex-1 flex justify-center min-w-0">
            <button
              className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-secondary/50 transition-colors min-w-0"
              onClick={() => setShowSurahPicker(!showSurahPicker)}
            >
              <p className="font-arabic-ui text-base font-bold text-primary truncate" dir="rtl">
                {surah.name}
              </p>
              <ChevronDown className={cn(
                'w-3.5 h-3.5 text-primary/60 shrink-0 transition-transform',
                showSurahPicker && 'rotate-180'
              )} />
            </button>
          </div>

          {/* Right: Mode toggle + Settings */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center bg-secondary rounded-full p-0.5">
              <button
                onClick={() => handleReadingModeChange('ayah')}
                className={cn(
                  'p-1.5 rounded-full transition-all',
                  readingMode === 'ayah'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-primary'
                )}
                title={t('verses')}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleReadingModeChange('mushaf')}
                className={cn(
                  'p-1.5 rounded-full transition-all',
                  readingMode === 'mushaf'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-primary'
                )}
                title={t('mushaf')}
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary hover:bg-primary/10"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Surah picker dropdown - rendered here so it positions relative to the full header */}
        <SurahPicker
          currentSurahId={surahId}
          isOpen={showSurahPicker}
          onClose={() => setShowSurahPicker(false)}
          onSelect={(id) => navigate(`/quran/${id}`)}
          language={language}
        />
      </div>

      {/* Content */}
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
            onAyahLongPress={(ayahNum) => setMushafTafsirAyah(ayahNum)}
          />
        ) : (
          <div className="max-w-2xl mx-auto pb-6">
            {/* Bismillah */}
            {surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1 && (
              <div className="py-8 px-4">
                <p
                  className={cn(
                    'arabic-text text-center text-2xl md:text-3xl text-primary/80',
                    settings.arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
                    settings.arabicFontFamily === 'uthmani' && 'arabic-uthmani'
                  )}
                >
                  {BISMILLAH}
                </p>
              </div>
            )}

            {/* Ayahs */}
            <div className="px-4 md:px-6 space-y-3 pb-4">
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
          </div>
        )
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
        surahName={surah.name}
        tafsir={mushafTafsirEntry}
        tafsirLoading={tafsirLoading}
        tafsirId={settings.primaryTafsir}
        language={language}
      />
    </div>
  );
}

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
          {/* Handle */}
          <div className="flex-shrink-0 pt-3 pb-2">
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 border-b border-border" dir={isAr ? 'rtl' : 'ltr'}>
            <div>
              <h3 className={cn('text-base font-semibold', isAr && 'font-arabic-ui')}>
                {isAr ? 'التفسير' : 'Tafsir'}
              </h3>
              <p className="text-xs text-muted-foreground font-arabic-ui" dir="rtl">
                {surahName} · {isAr ? 'آية' : 'Ayah'} {isAr ? toArabicNumerals(ayahNumber) : ayahNumber}
              </p>
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
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

  useEffect(() => {
    if (isCurrentAyah && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentAyah]);

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
            className="text-muted-foreground leading-relaxed mt-3 border-t border-border/50 pt-3"
            style={{ fontSize: `${settings.translationFontSize}px` }}
          >
            {translation.text}
          </p>
        )}

        {/* Tafsir */}
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
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-secondary/30 rounded-b-2xl">
        {/* Ayah number */}
        <span className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
          isCurrentAyah ? 'bg-primary text-white' : 'bg-secondary text-primary'
        )}>
          {language === 'ar' ? toArabicNumerals(ayah.numberInSurah) : ayah.numberInSurah}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          {/* Memorization */}
          <button
            type="button"
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              'hover:bg-secondary active:bg-secondary/80 touch-manipulation',
              isMemorized && 'bg-emerald-500/10'
            )}
            onClick={handleMemorizedClick}
            aria-label={isMemorized ? "Unmark memorized" : "Mark memorized"}
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
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
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
            aria-label={isPlaying ? "Pause" : "Play"}
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
