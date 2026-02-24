import { Flame, BookOpen, Target } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface DailyStatsProps {
  streak: number;
  todayAyahs: number;
  dailyGoal: number;
}

export function DailyStats({ streak, todayAyahs, dailyGoal }: DailyStatsProps) {
  const { t } = useTranslation();
  const goalPercent = Math.min(Math.round((todayAyahs / dailyGoal) * 100), 100);
  const goalReached = todayAyahs >= dailyGoal;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {/* Streak */}
      <div className="p-3 md:p-5 rounded-xl bg-secondary/50 border border-border">
        <div className={cn(
          'w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center mb-2 md:mb-3',
          streak > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-secondary text-muted-foreground'
        )}>
          <Flame className={cn('w-4 h-4 md:w-5 md:h-5', streak > 0 && 'fill-current')} />
        </div>
        <p className="text-2xl md:text-3xl font-semibold">{streak}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{t('streak')}</p>
      </div>

      {/* Today's Reading */}
      <div className="p-3 md:p-5 rounded-xl bg-secondary/50 border border-border">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 md:mb-3">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <p className="text-2xl md:text-3xl font-semibold">{todayAyahs}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{t('ayahsToday')}</p>
      </div>

      {/* Daily Goal */}
      <div className="p-3 md:p-5 rounded-xl bg-secondary/50 border border-border">
        <div className={cn(
          'w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center mb-2 md:mb-3',
          goalReached ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'
        )}>
          <Target className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <p className={cn(
          'text-2xl md:text-3xl font-semibold',
          goalReached && 'text-emerald-500'
        )}>
          {goalPercent}%
        </p>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{t('dailyGoal')}</p>
      </div>
    </div>
  );
}
