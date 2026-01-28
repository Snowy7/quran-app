import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePrayerTimes } from '@/lib/hooks/use-prayer-times';
import { cn } from '@/lib/utils';

// Prayer icons as inline SVGs
const PrayerIcons = {
  Fajr: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      {/* Horizon with sun rising */}
      <path d="M2 17h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14a5 5 0 0 1 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M12 14a5 5 0 0 0-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  Dhuhr: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      {/* Full sun */}
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Asr: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      {/* Afternoon sun (lower) */}
      <circle cx="12" cy="10" r="3.5" fill="currentColor" opacity="0.8" />
      <path d="M12 3v1.5M12 15v1.5M5 10h1.5M18.5 10H20M6.4 5.4l1.06 1.06M16.54 5.4l-1.06 1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 20h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Maghrib: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      {/* Sunset */}
      <path d="M2 17h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 17a5 5 0 0 0-10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="3" fill="currentColor" opacity="0.5" />
      {/* Rays going down */}
      <path d="M12 20v2M8 19l-1 1.5M16 19l1 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  Isha: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      {/* Moon and stars */}
      <path d="M12 3a7 7 0 0 0 0 14c1.5 0 2.9-.5 4-1.3A7 7 0 0 1 12 3z" fill="currentColor" />
      <circle cx="19" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="6" cy="8" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="17" cy="13" r="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  ),
};

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export function PrayerTimesWidget() {
  const { times, nextPrayer, loading, error } = usePrayerTimes();

  if (error) {
    return (
      <Link to="/prayer-times" className="block">
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Prayer Times</p>
              <p className="text-xs text-muted-foreground">Enable location access</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </Link>
    );
  }

  if (loading || !times) {
    return (
      <div className="p-4 rounded-xl bg-secondary/50 animate-pulse">
        <div className="h-4 w-24 bg-secondary rounded mb-3" />
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 text-center">
              <div className="h-3 w-full bg-secondary rounded mb-2" />
              <div className="h-4 w-full bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link to="/prayer-times" className="block">
      <div className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Prayer Times</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex justify-between gap-1">
          {prayerOrder.map((prayer) => {
            const Icon = PrayerIcons[prayer];
            const isNext = nextPrayer === prayer;
            return (
              <div
                key={prayer}
                className={cn(
                  'flex-1 text-center py-2 px-1 rounded-lg transition-colors',
                  isNext && 'bg-primary/10'
                )}
              >
                <div className={cn(
                  'flex justify-center mb-1',
                  isNext ? 'text-primary' : 'text-muted-foreground'
                )}>
                  <Icon />
                </div>
                <p className={cn(
                  'text-[10px] mb-0.5',
                  isNext ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {prayer}
                </p>
                <p className={cn(
                  'text-xs font-medium',
                  isNext && 'text-primary'
                )}>
                  {times[prayer]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
