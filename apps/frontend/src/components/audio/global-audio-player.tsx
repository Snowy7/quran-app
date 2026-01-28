import { useNavigate } from 'react-router-dom';
import { Play, Pause, X, SkipBack, SkipForward, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@template/ui';
import { useAudioStore } from '@/lib/stores/audio-store';
import { getSurahById } from '@/data/surahs';
import { cn } from '@/lib/utils';

export function GlobalAudioPlayer() {
  const navigate = useNavigate();

  // Get state directly from store - no custom selectors
  const isVisible = useAudioStore((s) => s.isVisible);
  const isMinimized = useAudioStore((s) => s.isMinimized);
  const surahId = useAudioStore((s) => s.currentSurahId);
  const ayahIndex = useAudioStore((s) => s.currentAyahIndex);
  const totalAyahs = useAudioStore((s) => s.totalAyahs);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);

  // Get actions
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const stop = useAudioStore((s) => s.stop);
  const next = useAudioStore((s) => s.next);
  const previous = useAudioStore((s) => s.previous);
  const setMinimized = useAudioStore((s) => s.setMinimized);

  // Don't render if not visible or no surah
  if (!isVisible || surahId === null) {
    return null;
  }

  const surah = getSurahById(surahId);
  const currentAyahNumber = ayahIndex !== null ? ayahIndex + 1 : 0;
  const progress = totalAyahs > 0 ? (currentAyahNumber / totalAyahs) * 100 : 0;

  const handleTogglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleClose = () => {
    stop();
  };

  const handleGoToSurah = () => {
    navigate(`/quran/${surahId}`);
  };

  // Minimized bubble view
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 safe-area-bottom">
        <div
          className={cn(
            'flex items-center gap-2 bg-primary text-primary-foreground',
            'rounded-full shadow-lg shadow-primary/25 pl-3 pr-1 py-1',
            'cursor-pointer transition-transform hover:scale-105 active:scale-95'
          )}
        >
          {/* Surah info - tap to expand */}
          <button
            className="flex items-center gap-2 min-w-0"
            onClick={() => setMinimized(false)}
          >
            <div className="text-xs font-medium truncate max-w-24">
              {surah?.englishName || 'Playing'}
            </div>
            <div className="text-[10px] opacity-80">
              {currentAyahNumber}/{totalAyahs}
            </div>
          </button>

          {/* Play/Pause button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full hover:bg-white/20 text-primary-foreground"
            onClick={handleTogglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full hover:bg-white/20 text-primary-foreground"
            onClick={handleClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Expanded player view
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 safe-area-bottom">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header with collapse/close */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setMinimized(true)}
              className="p-1 -m-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 -m-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Surah info */}
          <div
            className="text-center mb-4 cursor-pointer"
            onClick={handleGoToSurah}
          >
            <h3 className="font-semibold text-lg">{surah?.englishName}</h3>
            <p className="text-sm text-muted-foreground">
              {surah?.englishNameTranslation}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ayah {currentAyahNumber} of {totalAyahs}
            </p>
          </div>

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
              className="h-14 w-14 rounded-full"
              onClick={handleTogglePlay}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
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
            Go to Surah
          </button>
        </div>
      </div>
    </div>
  );
}
