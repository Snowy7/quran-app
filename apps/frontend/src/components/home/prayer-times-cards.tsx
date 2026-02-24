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

// Simple, clean prayer icons
function FajrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="16" r="4" fill="currentColor" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8v3M7 11l2 1.5M17 11l-2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function DhuhrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AsrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="10" r="4" fill="currentColor" />
      <path d="M12 3v2M12 15v2M5 10h2M17 10h2M6.3 5.3l1.4 1.4M16.3 5.3l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function MaghribIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 16h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="4" fill="currentColor" />
      <path d="M12 20v2M8 18l-1.5 2M16 18l1.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function IshaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3a7 7 0 0 0 0 14 7 7 0 0 0 4-1.2A7 7 0 0 1 12 3z" fill="currentColor" />
      <circle cx="18" cy="5" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="20" cy="12" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

type TranslationKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const prayerConfig: { key: PrayerName; tKey: TranslationKey; Icon: React.FC<{ className?: string }>; gradient: string }[] = [
  { key: 'Fajr', tKey: 'fajr', Icon: FajrIcon, gradient: 'from-sky-400 to-blue-500' },
  { key: 'Dhuhr', tKey: 'dhuhr', Icon: DhuhrIcon, gradient: 'from-amber-400 to-yellow-500' },
  { key: 'Asr', tKey: 'asr', Icon: AsrIcon, gradient: 'from-orange-400 to-amber-500' },
  { key: 'Maghrib', tKey: 'maghrib', Icon: MaghribIcon, gradient: 'from-rose-400 to-orange-500' },
  { key: 'Isha', tKey: 'isha', Icon: IshaIcon, gradient: 'from-indigo-500 to-purple-600' },
];

export function PrayerTimesCards() {
  const { times, nextPrayer, loading, error } = usePrayerTimes();
  const { todayPrayers, togglePrayer } = usePrayerTracking();
  const { t } = useTranslation();

  const hasPrayerTimePassed = useCallback((prayerKey: string): boolean => {
    if (!times) return false;
    const prayerTime = times[prayerKey as keyof typeof times];
    if (!prayerTime) return false;

    const prayerMinutes = parseTimeToMinutes(prayerTime);
    const currentMinutes = getCurrentMinutes();

    return currentMinutes >= prayerMinutes;
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
      toast.warning(`${prayer} time hasn't started yet`, {
        description: 'You can only mark a prayer as done after its time begins.',
      });
      return;
    }

    togglePrayer(prayer);
    toast.success(`${prayer} marked as prayed`);
  }, [todayPrayers, togglePrayer, hasPrayerTimePassed]);

  if (error) {
    return (
      <div className="p-4 md:p-6 rounded-2xl bg-secondary/50 border border-border text-center">
        <p className="text-sm text-muted-foreground">Enable location for prayer times</p>
      </div>
    );
  }

  if (loading || !times) {
    return (
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-[100px] md:h-[120px] rounded-2xl bg-secondary/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2 md:gap-3">
      {prayerConfig.map(({ key, tKey, Icon, gradient }) => {
        const isNext = nextPrayer === key;
        const isCompleted = todayPrayers[key]?.completed || false;
        const time = times[key as keyof typeof times];
        const hasPassed = hasPrayerTimePassed(key);

        return (
          <div
            key={key}
            onClick={(e) => hasPassed || isCompleted ? handlePrayerClick(key, e) : undefined}
            className={cn(
              'rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center transition-all relative',
              'min-h-[100px] md:min-h-[120px]',
              (hasPassed || isCompleted) && 'cursor-pointer',
              isNext
                ? `bg-gradient-to-br ${gradient} text-white shadow-lg`
                : isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-card border border-border hover:border-primary/20'
            )}
          >
            {/* Icon circle */}
            <div
              className={cn(
                'w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center mb-1.5 md:mb-2 transition-colors',
                isNext
                  ? 'bg-white/20'
                  : isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/50'
                    : 'bg-secondary/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 md:w-5 md:h-5',
                  isNext
                    ? 'text-white'
                    : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                )}
              />
            </div>

            {/* Prayer name */}
            <p
              className={cn(
                'text-[10px] md:text-xs font-medium mb-0.5 md:mb-1',
                isNext ? 'text-white/90' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
              )}
            >
              {t(tKey)}
            </p>

            {/* Time */}
            <p
              className={cn(
                'text-xs md:text-sm font-bold',
                isNext ? 'text-white' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : ''
              )}
            >
              {time}
            </p>

            {/* Checkmark */}
            {isCompleted && (
              <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
