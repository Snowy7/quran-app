import { useCallback } from 'react';
import { Check } from 'lucide-react';
import { usePrayerTimes, usePrayerTracking } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PrayerName } from '@/types/quran';

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

type TranslationKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const prayerConfig: { key: PrayerName; tKey: TranslationKey; gradient: string }[] = [
  { key: 'Fajr', tKey: 'fajr', gradient: 'from-sky-400 to-blue-500' },
  { key: 'Dhuhr', tKey: 'dhuhr', gradient: 'from-amber-400 to-yellow-500' },
  { key: 'Asr', tKey: 'asr', gradient: 'from-orange-400 to-amber-500' },
  { key: 'Maghrib', tKey: 'maghrib', gradient: 'from-rose-400 to-orange-500' },
  { key: 'Isha', tKey: 'isha', gradient: 'from-indigo-500 to-purple-600' },
];

export function PrayerTimesCards() {
  const { times, nextPrayer, loading, error } = usePrayerTimes();
  const { todayPrayers, togglePrayer } = usePrayerTracking();
  const { t, isRTL } = useTranslation();

  const hasPrayerTimePassed = useCallback((prayerKey: string): boolean => {
    if (!times) return false;
    const prayerTime = times[prayerKey as keyof typeof times];
    if (!prayerTime) return false;
    return getCurrentMinutes() >= parseTimeToMinutes(prayerTime);
  }, [times]);

  const handlePrayerClick = useCallback((prayer: PrayerName, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isCompleted = todayPrayers[prayer]?.completed || false;

    if (isCompleted) {
      togglePrayer(prayer);
      return;
    }

    if (!hasPrayerTimePassed(prayer)) {
      const prayerName = t(prayerConfig.find(p => p.key === prayer)!.tKey);
      toast.warning(
        isRTL ? `\u0644\u0645 \u064A\u062D\u0646 \u0648\u0642\u062A ${prayerName} \u0628\u0639\u062F` : `${prayer} time hasn't started yet`,
        { description: isRTL ? '\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0641\u0642\u0637 \u0628\u0639\u062F \u062F\u062E\u0648\u0644 \u0627\u0644\u0648\u0642\u062A' : 'You can only mark a prayer as done after its time begins.' }
      );
      return;
    }

    togglePrayer(prayer);
    const prayerName = t(prayerConfig.find(p => p.key === prayer)!.tKey);
    toast.success(isRTL ? `\u062A\u0645 \u062A\u0639\u0644\u064A\u0645 ${prayerName} \u0643\u0645\u0624\u062F\u0627\u0629` : `${prayer} marked as prayed`);
  }, [todayPrayers, togglePrayer, hasPrayerTimePassed, t, isRTL]);

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
        <p className={cn('text-sm text-muted-foreground', isRTL && 'font-arabic-ui')}>
          {isRTL ? '\u0641\u0639\u0651\u0644 \u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u0648\u0642\u0639 \u0644\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629' : 'Enable location for prayer times'}
        </p>
      </div>
    );
  }

  if (loading || !times) {
    return (
      <div className="rounded-2xl bg-card border border-border/50 p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[68px] rounded-xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-2.5 md:p-3">
      <div className="grid grid-cols-5 gap-1.5">
        {prayerConfig.map(({ key, tKey, gradient }) => {
          const isNext = nextPrayer === key;
          const isCompleted = todayPrayers[key]?.completed || false;
          const time = times[key as keyof typeof times];
          const hasPassed = hasPrayerTimePassed(key);

          return (
            <div
              key={key}
              onClick={(e) => (hasPassed || isCompleted) ? handlePrayerClick(key, e) : undefined}
              className={cn(
                'flex flex-col items-center justify-center py-3 md:py-4 rounded-xl transition-all relative',
                (hasPassed || isCompleted) && 'cursor-pointer',
                isNext
                  ? `bg-gradient-to-b ${gradient} text-white shadow-sm`
                  : isCompleted
                    ? 'bg-emerald-500/10'
                    : 'hover:bg-secondary/50'
              )}
            >
              <p className={cn(
                'text-[10px] md:text-xs font-medium mb-1.5',
                isNext ? 'text-white/80' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                isRTL && 'font-arabic-ui'
              )}>
                {t(tKey)}
              </p>
              <p className={cn(
                'text-sm md:text-base font-bold tabular-nums',
                isNext ? 'text-white' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : ''
              )}>
                {time}
              </p>
              {isCompleted && (
                <div className="absolute top-1.5 end-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-2 h-2" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
