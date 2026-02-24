import { Flame, BookOpen, Target } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface DailyStatsProps {
  streak: number;
  todayAyahs: number;
  dailyGoal: number;
}

export function DailyStats({ streak, todayAyahs, dailyGoal }: DailyStatsProps) {
  const { t, isRTL } = useTranslation();
  const goalPercent = Math.min(Math.round((todayAyahs / dailyGoal) * 100), 100);
  const goalReached = todayAyahs >= dailyGoal;

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-4 md:p-5">
      <div className="grid grid-cols-3">
        {/* Streak */}
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center mb-2.5',
            streak > 0 ? 'bg-orange-500/10' : 'bg-secondary'
          )}>
            <Flame className={cn(
              'w-[18px] h-[18px]',
              streak > 0 ? 'text-orange-500 fill-current' : 'text-muted-foreground'
            )} />
          </div>
          <p className="text-2xl md:text-3xl font-bold tracking-tight">{streak}</p>
          <p className={cn(
            'text-[10px] md:text-xs text-muted-foreground/60 mt-0.5',
            isRTL && 'font-arabic-ui'
          )}>
            {t('streak')}
          </p>
        </div>

        {/* Today's Ayahs */}
        <div className="flex flex-col items-center text-center border-x border-border/50">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 bg-primary/10">
            <BookOpen className="w-[18px] h-[18px] text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold tracking-tight">{todayAyahs}</p>
          <p className={cn(
            'text-[10px] md:text-xs text-muted-foreground/60 mt-0.5',
            isRTL && 'font-arabic-ui'
          )}>
            {t('ayahsToday')}
          </p>
        </div>

        {/* Daily Goal */}
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center mb-2.5',
            goalReached ? 'bg-emerald-500/10' : 'bg-secondary'
          )}>
            <Target className={cn(
              'w-[18px] h-[18px]',
              goalReached ? 'text-emerald-500' : 'text-muted-foreground'
            )} />
          </div>
          <p className={cn(
            'text-2xl md:text-3xl font-bold tracking-tight',
            goalReached && 'text-emerald-500'
          )}>
            {goalPercent}%
          </p>
          <p className={cn(
            'text-[10px] md:text-xs text-muted-foreground/60 mt-0.5',
            isRTL && 'font-arabic-ui'
          )}>
            {t('dailyGoal')}
          </p>
        </div>
      </div>
    </div>
  );
}
