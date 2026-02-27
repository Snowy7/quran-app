import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Repeat,
  Repeat1,
  Loader2,
} from 'lucide-react';
import { Button } from '@template/ui';
import { useAudioStore, RECITERS } from '@/lib/stores/audio-store';
import { ReciterPicker } from './reciter-picker';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
  const {
    isPlaying,
    isLoading,
    isVisible,
    currentVerseKey,
    currentTime,
    duration,
    repeatMode,
    playbackSpeed,
    reciterId,
    pause,
    resume,
    stop,
    next,
    previous,
    seekTo,
    setRepeatMode,
    setSpeed,
  } = useAudioStore();

  const location = useLocation();
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);

  if (!isVisible || !currentVerseKey) return null;

  // Bottom nav hides on reader/drill pages — match that logic
  const hideNavPaths = ['/quran/', '/hifz/drill'];
  const isNavHidden = hideNavPaths.some(
    (p) => location.pathname.startsWith(p) && location.pathname !== '/quran',
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const reciterName = RECITERS.find((r) => r.id === reciterId)?.name ?? 'Unknown';

  const cycleRepeat = () => {
    const modes: ('off' | 'verse' | 'surah')[] = ['off', 'verse', 'surah'];
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(playbackSpeed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seekTo(pct * duration);
  };

  return (
    <>
      <div className={cn(
        'fixed left-0 right-0 z-50 safe-area-bottom',
        isNavHidden ? 'bottom-0' : 'bottom-[60px] lg:bottom-0',
      )}>
        <div className="mx-auto max-w-3xl">
          <div className="bg-card/98 backdrop-blur-xl border-t border-border/50 shadow-lg">
            {/* Progress bar (clickable) */}
            <div
              className="h-1 bg-border/40 cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="px-4 py-2.5">
              {/* Top row: verse key + reciter name + time */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-foreground tabular-nums shrink-0">
                    {currentVerseKey}
                  </span>
                  <button
                    onClick={() => setReciterPickerOpen(true)}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {reciterName}
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums shrink-0 ml-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {/* Left: repeat + speed */}
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      repeatMode !== 'off'
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                    onClick={cycleRepeat}
                  >
                    {repeatMode === 'verse' ? (
                      <Repeat1 className="h-3.5 w-3.5" />
                    ) : (
                      <Repeat className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <button
                    onClick={cycleSpeed}
                    className={cn(
                      'h-8 min-w-[32px] px-1.5 rounded-md text-[10px] font-semibold transition-colors',
                      playbackSpeed !== 1
                        ? 'text-primary bg-primary/8'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {playbackSpeed}x
                  </button>
                </div>

                {/* Center: transport */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-foreground"
                    onClick={previous}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="default"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={isPlaying ? pause : resume}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-4.5 w-4.5" />
                    ) : (
                      <Play className="h-4.5 w-4.5 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-foreground"
                    onClick={next}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Right: close */}
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={stop}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReciterPicker open={reciterPickerOpen} onOpenChange={setReciterPickerOpen} />
    </>
  );
}
