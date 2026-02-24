import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, X, SkipBack, SkipForward, Loader2, ChevronDown, AlertCircle, User, Check } from 'lucide-react';
import { Button } from '@template/ui';
import { useAudioStore } from '@/lib/stores/audio-store';
import { getSurahById } from '@/data/surahs';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Ordered reciter list — user's preferred 5 first, then extras
const RECITER_LIST = [
  { id: 'Abdul_Basit_Murattal_192kbps', en: 'Abdul Basit Abdul Samad', ar: 'عبد الباسط عبد الصمد' },
  { id: 'Minshawy_Murattal_128kbps', en: 'Mohamed Siddiq Al-Minshawi', ar: 'محمد صديق المنشاوي' },
  { id: 'Husary_128kbps', en: 'Mahmoud Khalil Al-Husary', ar: 'محمود خليل الحصري' },
  { id: 'Mustafa_Ismail_48kbps', en: 'Mustafa Ismail', ar: 'مصطفى إسماعيل' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', en: 'Abdurrahman As-Sudais', ar: 'عبد الرحمن السديس' },
  { id: 'Alafasy_128kbps', en: 'Mishary Rashid Alafasy', ar: 'مشاري راشد العفاسي' },
  { id: 'Saood_ash-Shuraym_128kbps', en: 'Saud Al-Shuraim', ar: 'سعود الشريم' },
];

function getReciterName(reciterId: string) {
  return RECITER_LIST.find(r => r.id === reciterId) || RECITER_LIST[0];
}

export function GlobalAudioPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [showReciterPicker, setShowReciterPicker] = useState(false);

  // Get state from store
  const isVisible = useAudioStore((s) => s.isVisible);
  const isMinimized = useAudioStore((s) => s.isMinimized);
  const surahId = useAudioStore((s) => s.currentSurahId);
  const ayahIndex = useAudioStore((s) => s.currentAyahIndex);
  const totalAyahs = useAudioStore((s) => s.totalAyahs);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const error = useAudioStore((s) => s.error);
  const reciterId = useAudioStore((s) => s.reciterId);

  // Get actions
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const stop = useAudioStore((s) => s.stop);
  const next = useAudioStore((s) => s.next);
  const previous = useAudioStore((s) => s.previous);
  const setMinimized = useAudioStore((s) => s.setMinimized);
  const play = useAudioStore((s) => s.play);
  const setReciterId = useAudioStore((s) => s.setReciterId);
  const seekTo = useAudioStore((s) => s.seekTo);

  const surah = surahId ? getSurahById(surahId) : null;
  const currentAyahNumber = ayahIndex !== null ? ayahIndex + 1 : 0;
  const progress = totalAyahs > 0 ? (currentAyahNumber / totalAyahs) * 100 : 0;

  // Check if bottom nav is hidden (reader pages)
  const isOnReaderPage = location.pathname.startsWith('/quran/') && location.pathname.split('/').length > 2;

  const reciterName = getReciterName(reciterId);
  const surahDisplayName = isAr ? surah?.name : surah?.englishName;

  const handleTogglePlay = () => {
    if (error && surahId !== null && ayahIndex !== null) {
      play(surahId, ayahIndex);
    } else if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleClose = () => {
    stop();
  };

  const handleGoToSurah = () => {
    if (surahId) {
      navigate(`/quran/${surahId}`);
    }
  };

  const handleReciterChange = (newId: string) => {
    setShowReciterPicker(false);
    if (newId === reciterId) return;
    setReciterId(newId);
    // Replay current ayah with new reciter
    if (surahId !== null && ayahIndex !== null) {
      seekTo(ayahIndex);
    }
  };

  if (!isVisible || surahId === null) {
    return null;
  }

  const bottomClass = cn(
    'fixed left-3 right-3 z-50 safe-area-bottom animate-slide-up',
    isOnReaderPage ? 'bottom-4' : 'bottom-24 lg:bottom-4'
  );

  // Minimized: Clean floating card
  if (isMinimized) {
    return (
      <div className={bottomClass}>
        <div className="bg-primary rounded-2xl shadow-xl shadow-black/20 overflow-hidden max-w-lg mx-auto">
          {/* Thin progress bar */}
          <div className="h-0.5 bg-primary-foreground/10">
            <div
              className="h-full bg-primary-foreground/40 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Reciter icon */}
            <div
              className="w-11 h-11 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => setMinimized(false)}
            >
              <User className="w-5 h-5 text-primary-foreground/70" />
            </div>

            {/* Info - tap to expand */}
            <button
              className="flex-1 min-w-0 text-right"
              onClick={() => setMinimized(false)}
              dir="rtl"
            >
              <p className="text-sm font-semibold text-primary-foreground truncate font-arabic-ui">
                القارئ {reciterName.ar}
              </p>
              <p className="text-xs text-primary-foreground/60 truncate">
                {surah?.name} · آية {currentAyahNumber}/{totalAyahs}
              </p>
            </button>

            {/* Play/Pause */}
            <button
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all',
                'bg-primary-foreground text-primary',
                'hover:bg-primary-foreground/90 active:scale-95'
              )}
              onClick={handleTogglePlay}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : error ? (
                <AlertCircle className="h-5 w-5" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 ml-0.5 fill-current" />
              )}
            </button>

            {/* Close */}
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-primary-foreground/40 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              onClick={handleClose}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded player view
  return (
    <>
      {/* Reciter picker overlay — rendered outside the card so it's not clipped */}
      {showReciterPicker && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowReciterPicker(false)} />
          <div className={cn(
            'fixed left-3 right-3 z-[60]',
            isOnReaderPage ? 'bottom-4' : 'bottom-24 lg:bottom-4'
          )}>
            {/* Position list above where the card sits */}
            <div className="max-w-lg mx-auto mb-[270px]">
              <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in max-w-[280px] mx-auto">
                <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                  {RECITER_LIST.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleReciterChange(r.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 transition-colors',
                        r.id === reciterId
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary/50'
                      )}
                      dir="rtl"
                    >
                      <p className="text-sm font-semibold font-arabic-ui text-right flex-1">
                        {r.ar}
                      </p>
                      {r.id === reciterId && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Card */}
      <div className={bottomClass}>
        <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg mx-auto">
          {/* Progress bar — overflow-hidden only here for rounded corners */}
          <div className="h-1 bg-secondary rounded-t-2xl overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header with collapse/close */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleClose}
                className="p-1 -m-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="p-1 -m-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Surah info */}
            <div
              className="text-center mb-3 cursor-pointer"
              onClick={handleGoToSurah}
            >
              <h3 className={cn(
                'font-semibold text-lg',
                isAr && 'font-arabic-ui'
              )}>
                {surahDisplayName}
              </h3>
              {!isAr && (
                <p className="text-sm text-muted-foreground arabic-text">
                  {surah?.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isAr
                  ? `آية ${currentAyahNumber} من ${totalAyahs}`
                  : `Ayah ${currentAyahNumber} of ${totalAyahs}`}
              </p>
            </div>

            {/* Reciter selector */}
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setShowReciterPicker(!showReciterPicker)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-arabic-ui px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
                dir="rtl"
              >
                القارئ {reciterName.ar}
                <ChevronDown className={cn(
                  'w-3 h-3 transition-transform',
                  showReciterPicker && 'rotate-180'
                )} />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-center mb-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={previous}
                disabled={ayahIndex === 0}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full",
                  error && "bg-destructive hover:bg-destructive/90"
                )}
                onClick={handleTogglePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : error ? (
                  <AlertCircle className="h-6 w-6" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={next}
                disabled={ayahIndex === null || ayahIndex >= totalAyahs - 1}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Go to surah link */}
            <button
              onClick={handleGoToSurah}
              className="w-full mt-4 py-2 text-sm text-primary hover:underline"
            >
              {isAr ? 'الذهاب إلى السورة' : 'Go to Surah'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
