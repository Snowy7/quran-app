import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Flame,
  Target,
  TrendingUp,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button, Card, CardContent } from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import {
  getTotalProgress,
  getDueReviews,
  getStreak,
  getDailyReviewCount,
} from "@/lib/db/hifz";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export default function HifzDashboardPage() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState({
    total: 6236,
    memorized: 0,
    learning: 0,
    new: 0,
  });
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);

  useEffect(() => {
    getTotalProgress().then(setProgress);
    getDueReviews().then((r) => setDueCount(r.length));
    getStreak().then(setStreak);
    getDailyReviewCount().then(setTodayReviews);
  }, []);

  const memorizedPct = Math.round((progress.memorized / progress.total) * 100);
  const hasStarted =
    progress.memorized > 0 || progress.learning > 0 || progress.new > 0;

  return (
    <div className="animate-fade-in">
      <AppHeader title={t("memorization")} />

      <div className="px-6 pb-8 space-y-6">
        {/* Progress Overview */}
        <Card className="overflow-hidden border-0 shadow-card rounded-2xl">
          <CardContent className="p-0">
            <div className="relative px-6 py-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/3" />
              <div className="relative">
                <div className="flex items-center gap-6">
                  {/* Circular progress */}
                  <div className="relative flex h-24 w-24 items-center justify-center shrink-0">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="7"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${memorizedPct * 2.513} ${251.3 - memorizedPct * 2.513}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-foreground tabular-nums">
                        {memorizedPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-base font-bold text-foreground">
                      {progress.memorized} of {progress.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("versesMemorized")}
                    </p>

                    {hasStarted && (
                      <div className="flex gap-2 mt-4">
                        <StatPill
                          label={t("good")}
                          value={progress.memorized}
                          color="text-emerald-600 bg-emerald-500/10"
                        />
                        <StatPill
                          label={t("learning")}
                          value={progress.learning}
                          color="text-amber-600 bg-amber-500/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {streak}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                {t("dayStreak")}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {todayReviews}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                {t("today")}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {dueCount}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                {t("dueNow")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        {dueCount > 0 ? (
          <Link to="/hifz/drill">
            <Card className="border-0 shadow-card hover:shadow-soft transition-all duration-200 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-foreground">
                      {t("startReview")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {dueCount} {dueCount !== 1 ? t("verses") : t("verse")} due
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/60 mx-auto mb-4">
                <Brain className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {hasStarted ? t("allCaughtUp") : t("startMemorizing")}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[240px] mx-auto">
                {hasStarted ? t("noVersesDue") : t("markVersesHint")}
              </p>
              <Link to="/quran">
                <Button
                  variant="outline"
                  className="mt-5 gap-2 rounded-2xl px-6"
                >
                  <BookOpen className="h-4 w-4" />
                  {t("openQuran")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full",
        color,
      )}
    >
      {value} {label}
    </span>
  );
}
