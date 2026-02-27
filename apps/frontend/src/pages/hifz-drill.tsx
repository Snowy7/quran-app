import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, CheckCircle2, Volume2 } from 'lucide-react';
import { Button, Card, CardContent, Progress } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { getDueReviews, updateAfterReview } from '@/lib/db/hifz';
import { useChapters } from '@/lib/api/chapters';
import { fetchVersesByChapter } from '@/lib/api/verses';
import { useAudioStore } from '@/lib/stores/audio-store';
import type { HifzProgress } from '@/lib/db/types';
import { cn } from '@/lib/utils';

type Confidence = 'new' | 'shaky' | 'good' | 'solid';

interface DrillResult {
  verseKey: string;
  confidence: Confidence;
}

export default function HifzDrillPage() {
  const navigate = useNavigate();
  const { data: chapters } = useChapters();
  const { play } = useAudioStore();
  const [queue, setQueue] = useState<HifzProgress[]>([]);
  const [verseTexts, setVerseTexts] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load due reviews and fetch their verse texts
  useEffect(() => {
    getDueReviews(20).then(async (reviews) => {
      setQueue(reviews);
      if (reviews.length === 0) {
        setIsFinished(true);
        setLoading(false);
        return;
      }

      // Group by chapter to batch fetch
      const byChapter = new Map<number, number[]>();
      for (const r of reviews) {
        const verses = byChapter.get(r.chapterId) ?? [];
        verses.push(r.verseNumber);
        byChapter.set(r.chapterId, verses);
      }

      const texts: Record<string, string> = {};
      await Promise.all(
        Array.from(byChapter.entries()).map(async ([chapterId, verseNumbers]) => {
          try {
            // Fetch all verses for this chapter (enough pages to cover them)
            const maxVerse = Math.max(...verseNumbers);
            const data = await fetchVersesByChapter(chapterId, {
              perPage: Math.min(maxVerse + 5, 50),
              fields: 'text_uthmani',
            });
            for (const verse of data.verses) {
              const key = `${chapterId}:${verse.verse_number}`;
              if (verse.text_uthmani) {
                texts[key] = verse.text_uthmani;
              }
            }
          } catch {
            // If API fails, we'll show verse key as fallback
          }
        }),
      );

      setVerseTexts(texts);
      setLoading(false);
    });
  }, []);

  const current = queue[currentIndex];
  const total = queue.length;

  const handleRate = useCallback(
    async (confidence: Confidence) => {
      if (!current) return;
      await updateAfterReview(current.id, confidence);
      setResults((prev) => [...prev, { verseKey: current.verseKey, confidence }]);

      if (currentIndex + 1 >= total) {
        setIsFinished(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setRevealed(false);
      }
    },
    [current, currentIndex, total],
  );

  const handlePlayHint = () => {
    if (current) {
      play(current.verseKey);
    }
  };

  const chapterName = current
    ? chapters?.find((c) => c.id === current.chapterId)?.name_simple
    : undefined;

  if (loading) {
    return (
      <div>
        <AppHeader title="Review" showBack />
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          Loading review session...
        </div>
      </div>
    );
  }

  // Finished / Summary
  if (isFinished) {
    const goodCount = results.filter((r) => r.confidence === 'good' || r.confidence === 'solid').length;
    return (
      <div>
        <AppHeader title="Review Complete" showBack />
        <div className="px-5 py-8 space-y-5">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative px-5 py-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/3" />
                <div className="relative">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-lg font-bold text-foreground">
                    {results.length === 0 ? 'No reviews due' : 'Session Complete!'}
                  </p>
                  {results.length > 0 && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">
                        {results.length} verse{results.length !== 1 ? 's' : ''} reviewed
                      </p>
                      <div className="flex justify-center gap-4 mt-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-emerald-600 tabular-nums">{goodCount}</p>
                          <p className="text-[10px] text-muted-foreground">Good/Solid</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-amber-600 tabular-nums">{results.length - goodCount}</p>
                          <p className="text-[10px] text-muted-foreground">Needs Work</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/hifz')}
            >
              Back to Dashboard
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate('/quran')}
            >
              Continue Reading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentVerseText = verseTexts[current.verseKey];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm safe-area-top">
        <div className="flex items-center justify-between h-14 px-5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate('/hifz')}
          >
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-foreground tabular-nums">
            {currentIndex + 1} / {total}
          </span>
          <div className="w-9" />
        </div>
        <div className="px-5 pb-3">
          <Progress value={((currentIndex + 1) / total) * 100} className="h-1" />
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <p className="text-xs text-muted-foreground mb-1">
          {chapterName ?? `Surah ${current.chapterId}`}
        </p>
        <p className="text-sm font-semibold text-foreground mb-6">
          Verse {current.verseNumber}
        </p>

        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            {revealed ? (
              <p
                className="text-xl leading-[2.3] text-foreground text-center"
                dir="rtl"
                style={{ fontFamily: "'Scheherazade New', 'quran_common', serif" }}
              >
                {currentVerseText || current.verseKey}
              </p>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="w-full py-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="h-8 w-8" />
                <span className="text-sm font-medium">Tap to reveal</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Audio hint button - available before and after reveal */}
        {!revealed && (
          <Button
            variant="ghost"
            className="mt-4 text-muted-foreground gap-2"
            onClick={handlePlayHint}
          >
            <Volume2 className="h-4 w-4" />
            <span className="text-xs">Play audio hint</span>
          </Button>
        )}

        {/* Rating buttons - shown after reveal */}
        {revealed && (
          <div className="grid grid-cols-4 gap-2 w-full max-w-md mt-6">
            <RateButton
              label="Forgot"
              emoji="😰"
              onClick={() => handleRate('new')}
              variant="destructive"
            />
            <RateButton
              label="Shaky"
              emoji="😐"
              onClick={() => handleRate('shaky')}
              variant="warning"
            />
            <RateButton
              label="Good"
              emoji="😊"
              onClick={() => handleRate('good')}
              variant="success"
            />
            <RateButton
              label="Solid"
              emoji="🤩"
              onClick={() => handleRate('solid')}
              variant="primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RateButton({
  label,
  emoji,
  onClick,
  variant,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
  variant: 'destructive' | 'warning' | 'success' | 'primary';
}) {
  const variantStyles = {
    destructive: 'hover:bg-red-500/10 hover:border-red-500/30 active:bg-red-500/20',
    warning: 'hover:bg-amber-500/10 hover:border-amber-500/30 active:bg-amber-500/20',
    success: 'hover:bg-emerald-500/10 hover:border-emerald-500/30 active:bg-emerald-500/20',
    primary: 'hover:bg-primary/10 hover:border-primary/30 active:bg-primary/20',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-border/50 transition-all active:scale-95',
        variantStyles[variant],
      )}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
