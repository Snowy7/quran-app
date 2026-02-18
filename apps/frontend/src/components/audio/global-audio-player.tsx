import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Play,
  Pause,
  X,
  SkipBack,
  SkipForward,
  Loader2,
  ChevronDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@template/ui";
import { useAudioStore } from "@/lib/stores/audio-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { getSurahById, SURAHS } from "@/data/surahs";
import { cn } from "@/lib/utils";

// Get saved position from localStorage
function getSavedPosition(): { x: number; y: number } | null {
  try {
    const saved = localStorage.getItem("audio-player-position");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

// Save position to localStorage
function savePosition(x: number, y: number) {
  try {
    localStorage.setItem("audio-player-position", JSON.stringify({ x, y }));
  } catch (e) {
    // Ignore errors
  }
}

// Draggable Bubble Component
interface DraggableBubbleProps {
  surahName: string;
  currentAyah: number;
  totalAyahs: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  onExpand: () => void;
  onTogglePlay: () => void;
  onClose: () => void;
}

function DraggableBubble({
  surahName,
  currentAyah,
  totalAyahs,
  isPlaying,
  isLoading,
  error,
  onExpand,
  onTogglePlay,
  onClose,
}: DraggableBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = getSavedPosition();
    return saved || { x: window.innerWidth - 200, y: window.innerHeight - 150 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Constrain position to viewport
  const constrainPosition = useCallback((x: number, y: number) => {
    const bubble = bubbleRef.current;
    if (!bubble) return { x, y };

    const rect = bubble.getBoundingClientRect();
    const padding = 10;

    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    return {
      x: Math.max(padding, Math.min(x, maxX)),
      y: Math.max(padding, Math.min(y, maxY)),
    };
  }, []);

  // Handle touch/mouse start
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({
        x: clientX - position.x,
        y: clientY - position.y,
      });
    },
    [position],
  );

  // Handle touch/mouse move
  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;
      const constrained = constrainPosition(newX, newY);

      // Check if moved significantly
      if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
        setHasMoved(true);
      }

      setPosition(constrained);
    },
    [isDragging, dragStart, constrainPosition, position],
  );

  // Handle touch/mouse end
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position.x, position.y);

      // Snap to edges
      const bubble = bubbleRef.current;
      if (bubble) {
        const rect = bubble.getBoundingClientRect();
        const centerX = position.x + rect.width / 2;
        const screenCenterX = window.innerWidth / 2;
        const padding = 10;

        // Snap to left or right edge
        const snapX =
          centerX < screenCenterX
            ? padding
            : window.innerWidth - rect.width - padding;
        const snapped = constrainPosition(snapX, position.y);
        setPosition(snapped);
        savePosition(snapped.x, snapped.y);
      }
    }
  }, [isDragging, position, constrainPosition]);

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainPosition(prev.x, prev.y));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [constrainPosition]);

  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 touch-none"
      style={{
        left: position.x,
        top: position.y,
        transition: isDragging
          ? "none"
          : "left 0.3s ease-out, top 0.3s ease-out",
      }}
    >
      <div
        className={cn(
          "flex items-center gap-1 bg-primary text-primary-foreground",
          "rounded-full shadow-lg shadow-primary/25 pl-3 pr-1 py-1",
          isDragging ? "scale-105 cursor-grabbing" : "cursor-grab",
          "transition-transform duration-200",
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          handleDragStart(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleDragStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleDragMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleDragEnd}
      >
        {/* Surah info - tap to expand (only if not dragged) */}
        <button
          className="flex items-center gap-2 min-w-0 py-1"
          onClick={() => !hasMoved && onExpand()}
        >
          <div className="text-xs font-medium truncate max-w-24">
            {surahName}
          </div>
          <div className="text-[10px] opacity-80 tabular-nums">
            {currentAyah}/{totalAyahs}
          </div>
        </button>

        {/* Play/Pause button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-white/20 text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation();
            if (!hasMoved) onTogglePlay();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-4 w-4" />
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
          className="h-6 w-6 rounded-full hover:bg-white/20 text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation();
            if (!hasMoved) onClose();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function GlobalAudioPlayer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the reader page
  const isOnReaderPage =
    location.pathname.startsWith("/quran/") &&
    location.pathname.split("/").length > 2;

  // Get state directly from store
  const isVisible = useAudioStore((s) => s.isVisible);
  const isMinimized = useAudioStore((s) => s.isMinimized);
  const surahId = useAudioStore((s) => s.currentSurahId);
  const ayahIndex = useAudioStore((s) => s.currentAyahIndex);
  const totalAyahs = useAudioStore((s) => s.totalAyahs);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const error = useAudioStore((s) => s.error);

  // Get actions
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const stop = useAudioStore((s) => s.stop);
  const next = useAudioStore((s) => s.next);
  const previous = useAudioStore((s) => s.previous);
  const setMinimized = useAudioStore((s) => s.setMinimized);
  const play = useAudioStore((s) => s.play);

  const readingScrollProgress = useUIStore((s) => s.readingScrollProgress);

  const surah = surahId ? getSurahById(surahId) : null;
  const currentAyahNumber = ayahIndex !== null ? ayahIndex + 1 : 0;
  const audioProgress =
    totalAyahs > 0 ? (currentAyahNumber / totalAyahs) * 100 : 0;
  // Reading scroll progress (always available while scrolling on reader page)
  const scrollProgress = readingScrollProgress
    ? (readingScrollProgress.currentAyah / readingScrollProgress.totalAyahs) *
      100
    : 0;

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

  // On reader page: show integrated bottom bar with navigation + player
  if (isOnReaderPage) {
    // Extract surah ID from URL for navigation
    const pathParts = location.pathname.split("/");
    const currentPageSurahId = parseInt(pathParts[2] || "1", 10);
    const currentPageSurah = getSurahById(currentPageSurahId);
    const isPlayingThisSurah = isVisible && surahId === currentPageSurahId;

    const handleSurahChange = (newSurahId: string) => {
      navigate(`/quran/${newSurahId}`);
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Reading scroll progress bar — always visible while reading */}
        <div className="h-0.5 bg-secondary relative overflow-hidden">
          {/* Scroll progress (background layer) */}
          <div
            className="h-full bg-primary/30 transition-all duration-300 ease-out absolute inset-y-0 left-0"
            style={{ width: `${scrollProgress}%` }}
          />
          {/* Audio progress (foreground layer, brighter) */}
          {isPlayingThisSurah && (
            <div
              className="h-full bg-primary transition-all duration-300 ease-out relative"
              style={{ width: `${audioProgress}%` }}
            />
          )}
        </div>

        <div className="bg-background border-t border-border">
          <div className="flex items-center justify-between h-14 px-3">
            {/* Left: Surah navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  currentPageSurahId > 1 &&
                  navigate(`/quran/${currentPageSurahId - 1}`)
                }
                disabled={currentPageSurahId <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Select
                value={currentPageSurahId.toString()}
                onValueChange={handleSurahChange}
              >
                <SelectTrigger className="h-8 w-[130px] border-0 bg-secondary/60 hover:bg-secondary text-xs font-medium px-2">
                  <span className="truncate">
                    {currentPageSurah?.englishName}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {SURAHS.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">
                          {s.id}
                        </span>
                        <span className="text-sm">{s.englishName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  currentPageSurahId < 114 &&
                  navigate(`/quran/${currentPageSurahId + 1}`)
                }
                disabled={currentPageSurahId >= 114}
                className="h-8 w-8"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Right: Audio controls */}
            <div className="flex items-center gap-1">
              {/* Ayah counter */}
              {isPlayingThisSurah && (
                <span className="text-xs text-muted-foreground tabular-nums mr-1">
                  {currentAyahNumber}/{totalAyahs}
                </span>
              )}

              {/* Skip back */}
              {isPlayingThisSurah && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={previous}
                  disabled={ayahIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              )}

              {/* Play/Pause */}
              <Button
                variant={
                  isPlaying && isPlayingThisSurah ? "default" : "outline"
                }
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => {
                  if (isPlayingThisSurah) {
                    handleTogglePlay();
                  } else {
                    play(currentPageSurahId, 0);
                  }
                }}
                disabled={isLoading && isPlayingThisSurah}
              >
                {isLoading && isPlayingThisSurah ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : error && isPlayingThisSurah ? (
                  <AlertCircle className="w-4 h-4" />
                ) : isPlaying && isPlayingThisSurah ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              {/* Skip forward */}
              {isPlayingThisSurah && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={next}
                  disabled={ayahIndex === null || ayahIndex >= totalAyahs - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not on reader page: show floating player only if playing
  if (!isVisible || surahId === null) {
    return null;
  }

  // Minimized bubble view - draggable
  if (isMinimized) {
    return (
      <DraggableBubble
        surahName={surah?.englishName || "Playing"}
        currentAyah={currentAyahNumber}
        totalAyahs={totalAyahs}
        isPlaying={isPlaying}
        isLoading={isLoading}
        error={error}
        onExpand={() => setMinimized(false)}
        onTogglePlay={handleTogglePlay}
        onClose={handleClose}
      />
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
            style={{ width: `${audioProgress}%` }}
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
            <p className="text-sm text-muted-foreground arabic-text">
              {surah?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ayah {currentAyahNumber} of {totalAyahs}
            </p>
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
                error && "bg-destructive hover:bg-destructive/90",
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
            Go to Surah
          </button>
        </div>
      </div>
    </div>
  );
}
