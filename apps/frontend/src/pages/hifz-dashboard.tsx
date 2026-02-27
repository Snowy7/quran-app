import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Flame, Target, TrendingUp, ChevronRight, BookOpen } from 'lucide-react';
import { Button, Card, CardContent, Progress } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import {
  getTotalProgress,
  getDueReviews,
  getStreak,
  getDailyReviewCount,
} from '@/lib/db/hifz';
import { cn } from '@/lib/utils';

export default function HifzDashboardPage() {
  const [progress, setProgress] = useState({ total: 6236, memorized: 0, learning: 0, new: 0 });
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
  const hasStarted = progress.memorized > 0 || progress.learning > 0 || progress.new > 0;

  return (
    <div>
      <AppHeader title="Memorization" />

      <div className="px-5 pb-8 space-y-5">
        {/* Progress Overview */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative px-5 py-5">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/3" />
              <div className="relative">
                {/* Circular stat */}
                <div className="flex items-center gap-5">
                  <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${memorizedPct * 2.136} ${213.6 - memorizedPct * 2.136}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {memorizedPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {progress.memorized} of {progress.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">verses memorized</p>

                    {hasStarted && (
                      <div className="flex gap-3 mt-3">
                        <StatPill label="Good" value={progress.memorized} color="text-emerald-600 bg-emerald-500/10" />
                        <StatPill label="Learning" value={progress.learning} color="text-amber-600 bg-amber-500/10" />
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
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">{streak}</p>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">{todayReviews}</p>
              <p className="text-[10px] text-muted-foreground">Reviewed Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">{dueCount}</p>
              <p className="text-[10px] text-muted-foreground">Due Now</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        {dueCount > 0 ? (
          <Link to="/hifz/drill">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Start Review</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dueCount} verse{dueCount !== 1 ? 's' : ''} due for review
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card>
            <CardContent className="p-5 text-center">
              <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {hasStarted ? 'All caught up!' : 'Start memorizing'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasStarted
                  ? 'No verses due for review right now'
                  : 'Mark verses as memorized from the reader to start tracking'
                }
              </p>
              <Link to="/quran">
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  Open Quran
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
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', color)}>
      {value} {label}
    </span>
  );
}
