import { Flame, BookOpen, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyStatsProps {
  streak: number;
  todayAyahs: number;
  dailyGoal: number;
}

export function DailyStats({ streak, todayAyahs, dailyGoal }: DailyStatsProps) {
  const goalPercent = Math.min(Math.round((todayAyahs / dailyGoal) * 100), 100);
  const goalReached = todayAyahs >= dailyGoal;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Streak */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
          streak > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-secondary text-muted-foreground'
        )}>
          <Flame className={cn('w-4 h-4', streak > 0 && 'fill-current')} />
        </div>
        <p className="text-2xl font-semibold">{streak}</p>
        <p className="text-xs text-muted-foreground">Day streak</p>
      </div>

      {/* Today's Reading */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
          <BookOpen className="w-4 h-4" />
        </div>
        <p className="text-2xl font-semibold">{todayAyahs}</p>
        <p className="text-xs text-muted-foreground">Ayahs today</p>
      </div>

      {/* Daily Goal */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
          goalReached ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'
        )}>
          <Target className="w-4 h-4" />
        </div>
        <p className={cn(
          'text-2xl font-semibold',
          goalReached && 'text-emerald-500'
        )}>
          {goalPercent}%
        </p>
        <p className="text-xs text-muted-foreground">Daily goal</p>
      </div>
    </div>
  );
}
