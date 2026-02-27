import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Eye, CheckCircle2, Volume2 } from "lucide-react";
import { Button, Card, CardContent, Progress } from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { getDueReviews, updateAfterReview } from "@/lib/db/hifz";
import { useChapters } from "@/lib/api/chapters";
import { fetchVersesByChapter } from "@/lib/api/verses";
import { useAudioStore } from "@/lib/stores/audio-store";
import type { HifzProgress } from "@/lib/db/types";
import { cn } from "@/lib/utils";

type Confidence = "new" | "shaky" | "good" | "solid";

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

  useEffect(() => {
    getDueReviews(20).then(async (reviews) => {
      setQueue(reviews);
      if (reviews.length === 0) {
        setIsFinished(true);
        setLoading(false);
        return;
      }

      const byChapter = new Map<number, number[]>();
      for (const r of reviews) {
        const verses = byChapter.get(r.chapterId) ?? [];
        verses.push(r.verseNumber);
        byChapter.set(r.chapterId, verses);
      }

      const texts: Record<string, string> = {};
      await Promise.all(
        Array.from(byChapter.entries()).map(
          async ([chapterId, verseNumbers]) => {
            try {
              const maxVerse = Math.max(...verseNumbers);
              const data = await fetchVersesByChapter(chapterId, {
                perPage: Math.min(maxVerse + 5, 50),
                fields: "text_uthmani",
              });
              for (const verse of data.verses) {
                const key = `${chapterId}:${verse.verse_number}`;
                if (verse.text_uthmani) {
                  texts[key] = verse.text_uthmani;
                }
              }
            } catch {
              // fallback to verse key
            }
          },
        ),
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
      setResults((prev) => [
        ...prev,
        { verseKey: current.verseKey, confidence },
      ]);

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
      <div className="animate-fade-in">
        <AppHeader title="Review" showBack />
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          Loading review session...
        </div>
      </div>
    );
  }

  // Finished / Summary
  if (isFinished) {
    const goodCount = results.filter(
      (r) => r.confidence === "good" || r.confidence === "solid",
    ).length;
    return (
      <div className="animate-fade-in">
        <AppHeader title="Review Complete" showBack />
        <div className="px-6 py-8 space-y-6">
          <Card className="overflow-hidden border-0 shadow-card rounded-2xl">
            <CardContent className="p-0">
              <div className="relative px-6 py-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/3" />
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {results.length === 0
                      ? "No reviews due"
                      : "Session Complete!"}
                  </p>
                  {results.length > 0 && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {results.length} verse{results.length !== 1 ? "s" : ""}{" "}
                        reviewed
                      </p>
                      <div className="flex justify-center gap-6 mt-5">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                            {goodCount}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            Good / Solid
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-amber-600 tabular-nums">
                            {results.length - goodCount}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            Needs Work
                          </p>
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
              className="flex-1 rounded-2xl h-12"
              onClick={() => navigate("/hifz")}
            >
              Dashboard
            </Button>
            <Button
              className="flex-1 rounded-2xl h-12"
              onClick={() => navigate("/quran")}
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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl safe-area-top">
        <div className="flex items-center justify-between h-16 px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-2xl"
            onClick={() => navigate("/hifz")}
          >
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {currentIndex + 1} / {total}
          </span>
          <div className="w-10" />
        </div>
        <div className="px-6 pb-3">
          <Progress
            value={((currentIndex + 1) / total) * 100}
            className="h-1.5 rounded-full"
          />
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {chapterName ?? `Surah ${current.chapterId}`}
        </p>
        <p className="text-sm font-bold text-foreground mb-8">
          Verse {current.verseNumber}
        </p>

        <Card className="w-full max-w-md border-0 shadow-card rounded-2xl">
          <CardContent className="p-8">
            {revealed ? (
              <p
                className="text-xl leading-[2.3] text-foreground text-center"
                dir="rtl"
                style={{
                  fontFamily: "'Scheherazade New', 'quran_common', serif",
                }}
              >
                {currentVerseText || current.verseKey}
              </p>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="w-full py-10 flex flex-col items-center gap-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/60">
                  <Eye className="h-7 w-7" />
                </div>
                <span className="text-sm font-medium">Tap to reveal</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Audio hint */}
        {!revealed && (
          <Button
            variant="ghost"
            className="mt-5 text-muted-foreground gap-2 rounded-2xl"
            onClick={handlePlayHint}
          >
            <Volume2 className="h-4 w-4" />
            <span className="text-xs font-medium">Play audio hint</span>
          </Button>
        )}

        {/* Rating buttons */}
        {revealed && (
          <div className="grid grid-cols-4 gap-3 w-full max-w-md mt-8">
            <RateButton
              label="Forgot"
              emoji="😰"
              onClick={() => handleRate("new")}
              variant="destructive"
            />
            <RateButton
              label="Shaky"
              emoji="😐"
              onClick={() => handleRate("shaky")}
              variant="warning"
            />
            <RateButton
              label="Good"
              emoji="😊"
              onClick={() => handleRate("good")}
              variant="success"
            />
            <RateButton
              label="Solid"
              emoji="🤩"
              onClick={() => handleRate("solid")}
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
  variant: "destructive" | "warning" | "success" | "primary";
}) {
  const variantStyles = {
    destructive:
      "hover:bg-red-500/10 hover:border-red-500/30 active:bg-red-500/20",
    warning:
      "hover:bg-amber-500/10 hover:border-amber-500/30 active:bg-amber-500/20",
    success:
      "hover:bg-emerald-500/10 hover:border-emerald-500/30 active:bg-emerald-500/20",
    primary: "hover:bg-primary/10 hover:border-primary/30 active:bg-primary/20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border border-border/40 transition-all active:scale-95",
        variantStyles[variant],
      )}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>
    </button>
  );
}
